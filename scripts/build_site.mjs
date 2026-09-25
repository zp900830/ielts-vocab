#!/usr/bin/env node
/* 构建 dist/ —— 只放真正需要公网可见的文件，并在构建期生成 config.js。
 *
 * 为什么必须有构建这一步（2026-09-19 实测 EdgeOne Pages 文档）：
 *  1. 静态 HTML/JS **读不到**环境变量，只有 Functions 能读 —— 所以 config.js 只能由构建写出，
 *     线上 `shadow/config.js` 现在 404，云同步因此一直是断的。
 *  2. 仓库根即发布根时，docs/、tools/、playwright-tests/、以及 6 个
 *     `sections.json.backup-*` 全都能被公网下载。输出目录换成 dist/ 一次性解决。
 *  3. EdgeOne 不支持 _redirects / _headers / netlify.toml，仓库里那两个文件是死的。
 *
 * 环境变量：SUPABASE_URL，SUPABASE_KEY（或 SUPABASE_ANON_KEY）。
 * 缺变量时**不失败**：写出空凭证并大声告警，让应用走「未配置云同步」分支，
 * 比留一个 404 更好（每次开页都报一条控制台错误，且没人知道为什么）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'dist');

// 明确白名单，不做「整目录复制再排除」——后者会让新加的备份文件默认变成公开
const FILES = [
  'index.html',
  '404.html',
  'admin/index.html',
  'data/book.json',
  'data/covers.json',
  'data/stories.json',
  'data/sup.json',
  // data/vocab.json 与 data/chapters-raw.json 只被 scripts/ 用，运行时不抓 —— 不进发布包
  'shadow/index.html',
  'shadow/js/plan-engine.js',
  'shadow/data/chapters.json',
  'shadow/data/sections.json',
  'shadow/data/vocab.json',
  // 3.0 新站点：外壳 + 路由（引擎与数据直接读 /shadow/ 那份，不复制）
  'app/index.html',
  'app/app.js',
  // 3.0 PWA：真实 service worker 文件（scope /app/）。缺它则 SW 注册 404、离线兜底失效。
  'app/sw.js',
  // 3.0 PWA iOS 图标（2026-09-25）：iOS 只认 apple-touch-icon，manifest 的 data-URI 图标它不收。
  'app/apple-touch-icon.png',
];

const warn = [];

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join('/');
}

function copy(src, dst) {
  if (!fs.existsSync(src)) {
    warn.push(`缺失源文件 ${rel(src)} —— 线上会 404`);
    return;
  }
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

function writeConfig(dir, url, key) {
  fs.mkdirSync(dir, { recursive: true });
  const body =
    '// 本文件由 scripts/build_site.mjs 在构建期生成，不要手写真实凭证进仓库。\n' +
    '// 凭证来自 EdgeOne 环境变量 SUPABASE_URL / SUPABASE_KEY。\n' +
    'window.IELTS_CONFIG = {\n' +
    `  SUPABASE_URL: ${JSON.stringify(url)},\n` +
    `  SUPABASE_KEY: ${JSON.stringify(key)},\n` +
    '};\n';
  fs.writeFileSync(path.join(dir, 'config.js'), body);
}

function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  for (const f of FILES) copy(path.join(ROOT, f), path.join(OUT, f));

  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (!url || !key) {
    warn.push(
      `SUPABASE_URL/SUPABASE_KEY 未设置（url=${url ? '有' : '空'} key=${key ? '有' : '空'}）` +
        '—— 云同步继续不可用，请到 EdgeOne 项目设置 › 环境管理 › 环境变量 里补，然后重新部署',
    );
  }
  writeConfig(path.join(OUT), url, key);
  writeConfig(path.join(OUT, 'shadow'), url, key);
  writeConfig(path.join(OUT, 'app'), url, key);

  // 防「白名单漏文件」：扫已复制的 HTML，凡是引用本站相对路径的 json/js/html，必须在 dist 里
  const missing = [];
  for (const html of FILES.filter((f) => f.endsWith('.html'))) {
    const p = path.join(OUT, html);
    if (!fs.existsSync(p)) continue;
    const src = fs.readFileSync(p, 'utf8');
    const here = path.dirname(p);
    const refs = new Set();
    for (const m of src.matchAll(/(?:src|href)=["']([^"'#?]+?\.(?:json|js|html))["']/g)) refs.add(m[1]);
    for (const m of src.matchAll(/get\(\s*["']([^"'#?]+?\.(?:json|js))\?/g)) refs.add(m[1]);
    for (const r of refs) {
      if (/^(https?:|data:|\/\/)/.test(r)) continue;
      // 以 / 开头是站点绝对路径，相对 dist 根而不是文件系统根
      const target = r.startsWith('/') ? path.join(OUT, r) : path.resolve(here, r);
      if (!fs.existsSync(target)) missing.push(`${html} → ${r}`);
    }
  }

  const total = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, e.name);
      if (e.isDirectory()) walk(f);
      else total.push([rel(f), fs.statSync(f).size]);
    }
  })(OUT);

  console.log(`dist/ 构建完成：${total.length} 个文件，${(total.reduce((a, [, s]) => a + s, 0) / 1024 / 1024).toFixed(2)} MB`);
  for (const [f, s] of total.sort()) console.log(`  ${f}  ${(s / 1024).toFixed(0)}KB`);
  if (missing.length) {
    console.error('\nBUILD FAILED: 白名单漏了页面引用的文件：');
    for (const m of missing) console.error('  -', m);
    process.exit(1);
  }
  if (warn.length) {
    console.log('\n告警（不阻断）:');
    for (const w of warn) console.log('  -', w);
  }
}

main();
