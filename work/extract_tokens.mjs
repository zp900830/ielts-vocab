#!/usr/bin/env node
/* 内部模式 token 抽取器（product-design:extract 的执行件，不进产品）。
   为什么写脚本而不是手抄：手抄必然出错，而这个项目已经被「文档写的数和代码不一样」坑过
   （0921 措辞改了、算式还数毕业）。这里每条值都是正则从 shadow/index.html 里数出来的，
   usage 计数 = 真实出现次数，下游 design.md 只许引用本文件的输出。
   跑法：node work/extract_tokens.mjs [文件…]   默认 shadow/index.html
   输出：spark-output/extract/<slug>/tokens/shadow-design-tokens.json */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const files = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const TARGET = files.length ? files : ['shadow/index.html'];
const SRC = TARGET.map((f) => ({ path: f, text: readFileSync(f, 'utf8') }));
const all = SRC.map((s) => s.text).join('\n');

/* ---------- 1. CSS 自定义属性（真 token 源：优先级最高的那一层） ---------- */
const vars = new Map();
for (const m of all.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}]+)[;}]/gi)) {
  const name = m[1], value = m[2].trim();
  if (!vars.has(name)) vars.set(name, { value, defined_in: [], used_by: 0 });
  const defLine = all.slice(0, m.index).split('\n').length;
  const host = SRC.find((s) => s.text.includes(value));
  vars.get(name).defined_in.push(`${host ? host.path : TARGET[0]}:${defLine}`);
}
/* 引用次数：var(--x) 出现的次数。这是「usage_count」的唯一来源，不许估。 */
for (const [name] of vars) {
  const re = new RegExp(`var\\(${name}[,)]`, 'g');
  vars.get(name).used_by = (all.match(re) || []).length;
}

/* ---------- 2. 裸值统计（没有走 var() 的字面量 = 该收进 token 的候选） ---------- */
const count = (re) => { const t = {}; for (const m of all.matchAll(re)) t[m[0]] = (t[m[0]] || 0) + 1; return t; };
const top = (obj, n) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);

const hexColors = count(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-fA-F])/g);
const rgbaColors = count(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/g);
const radii = count(/border-radius\s*:\s*([^;}]+)/g);
const blurs = count(/backdrop-filter\s*:\s*([^;}]+)/g);
const filters = count(/-webkit-backdrop-filter\s*:\s*([^;}]+)/g);
const fontSizes = count(/font-size\s*:\s*(\d+(?:\.\d+)?px)/g);
const transitions = count(/transition\s*:\s*([^;}]+)/g);
const durations = count(/(\d+(?:\.\d+)?)s(?=[\s,;)]|$)/g);
const zIndices = count(/z-index\s*:\s*(\d+)/g);

/* ---------- 3. 「浮空玻璃卡」这一族的指纹：同时有 backdrop-filter + border-radius + inset 高光 ---------- */
/* CSS 注释里全是「============ 底部播放条 ===========」这种分节标题，
   不先剥掉的话它们会被当成选择器抓进来 —— 第一版产物里 selector 全是注释，读起来像坏了。
   统计仍然用原文（出现次数要数全），只有这一节用剥过注释的副本。 */
const noComment = all.replace(/\/\*[\s\S]*?\*\//g, ' ');
const BLOCK = /([^{}]+)\{([^{}]*backdrop-filter[^{}]*)\}/g;
const glass = [];
for (const m of noComment.matchAll(BLOCK)) {
  const sel = m[1].replace(/\s+/g, ' ').trim().split(/,\s*/).pop().trim();
  const body = m[2];
  const g = (re) => { const x = re.exec(body); return x ? x[1].trim() : null; };
  glass.push({
    selector: sel.slice(0, 70),
    radius: g(/border-radius\s*:\s*([^;]+)/),
    filter: g(/(?:webkit-)?backdrop-filter\s*:\s*([^;]+)/),
    border: g(/border\s*:\s*([^;]+)/),
    shadow: g(/box-shadow\s*:\s*([^;]+)/),
    hasInnerHighlight: /inset 0 1px 0/.test(body),
    translucentGradient: /linear-gradient\([^)]*rgba?\([^)]*,\s*0?\.\d+/.test(body),
  });
}
const glassFamily = glass.filter((x) => x.translucentGradient && x.hasInnerHighlight);

/* ---------- 4. 断点 / 字体 ---------- */
const breakpoints = [...new Set([...all.matchAll(/@media[^{]*?(max-width|min-width)\s*:\s*(\d+)px/g)]
  .map((m) => `${m[1]}:${m[2]}`))].sort();
const fontFamilies = [...new Set([...all.matchAll(/font-family\s*:\s*([^;}]+)/g)].map((m) => m[1].trim()))];

/* 同名不同值 / 同值不同名 —— 两个都算 token 债务。
   --task-new 与 --accent-bright 都是 #10b487：改一个不会带动另一个，界面上就会出现两种「同一个绿」。
   人眼看一屏 CSS 是抓不住这个的，只能按值分堆数出来。 */
const byValue = new Map();
for (const [name, info] of vars) {
  const key = info.value.toLowerCase();
  if (!byValue.has(key)) byValue.set(key, []);
  byValue.get(key).push({ name, used_by: info.used_by });
}
const duplicateVars = [...byValue.entries()]
  .filter(([, list]) => list.length > 1)
  .map(([value, list]) => ({ value, names: list.sort((a, b) => b.used_by - a.used_by), alias_count: list.length }))
  .sort((a, b) => b.alias_count - a.alias_count);

const out = {
  meta: {
    source_type: 'internal', generated_at: new Date().toISOString(),
    files_scanned: TARGET.map((f) => ({ path: f, bytes: SRC.find((s) => s.path === f).text.length })),
    css_in_js_engine: 'none',
    fallback_applied: ['no-config-source', 'no-sparkdesign-baseline', 'no-css-in-js'],
    note: '本仓库是单文件 HTML + 内联 <style>，没有 tailwind.config / theme.ts / CSS-in-JS，' +
      '所以按 extract 的级联降级到「CSS 自定义属性 + 裸值字面量统计」。' +
      '所有数字都是正则数出来的，不是人估的。',
  },
  tokens: {
    css_variables: Object.fromEntries([...vars.entries()].sort((a, b) => b[1].used_by - a[1].used_by)),
    duplicate_variable_values: duplicateVars,
    typography: { font_families: fontFamilies, font_size_scale: top(fontSizes, 20) },
    radius: top(radii, 20),
    shadow_note: '阴影写在 box-shadow 里，见 glass_family.shadow 与裸值统计',
    motion: { transitions: top(transitions, 15) },
    glass: { backdrop_filter_variants: { ...top(blurs, 12).reduce((a, [k, v]) => (a[k] = v, a), {}),
      ...top(filters, 12).reduce((a, [k, v]) => (a[k] = v, a), {}) },
      floating_card_family: glassFamily, floating_card_count: glassFamily.length,
      all_backdrop_blocks: glass.length },
    color_literals: { hex: top(hexColors, 25), rgba: top(rgbaColors, 25) },
    z_index: top(zIndices, 12),
    breakpoints,
  },
};

const slug = 'shadow';
const dir = `spark-output/extract/${slug}/tokens`;
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/shadow-design-tokens.json`, JSON.stringify(out, null, 2));
const n = (o) => (o ? Object.keys(o).length : 0);
if (duplicateVars.length) {
  console.log(`\n同值不同名的变量（token 债务，${duplicateVars.length} 组）：`);
  duplicateVars.slice(0, 8).forEach((d) => console.log(`  ${d.value} ← ${d.names.map((x) => `${x.name}(${x.used_by})`).join(' , ')}`));
}
console.log(`\n扫描 ${TARGET.join(', ')}：CSS 变量 ${n(out.tokens.css_variables)} 个、` +
  `backdrop-filter 块 ${out.tokens.glass.all_backdrop_blocks} 个（其中浮空玻璃卡 ${out.tokens.glass.floating_card_count} 个）、` +
  `裸 hex ${n(hexColors)} 种 / rgba ${n(rgbaColors)} 种、断点 ${out.tokens.breakpoints.length} 档`);
console.log('→', `${dir}/shadow-design-tokens.json`);
