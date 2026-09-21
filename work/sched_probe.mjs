#!/usr/bin/env node
/* 一次性对照实验（不进产品）：排程精修到底值多少天。
   做法 = 把 plan-engine.js 的源码按候选改动做一次字符串替换，在 Node 里装成
   window.ShadowPlan，再用它自带的 estimateDays 跑真实词表。
   为什么不用另一套算式：本仓库的规矩是「一份逻辑两份实现就会漂移」。
   跑法：node work/sched_probe.mjs */
'use strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = fs.readFileSync(path.join(ROOT, 'shadow/js/plan-engine.js'), 'utf8');

function loadEngine(patch) {
  const sandbox = { window: {}, Date, Math, JSON, console };
  let src = SRC;
  (patch || []).forEach(([from, to]) => {
    if (src.indexOf(from) < 0) throw new Error('补丁没命中，源码已变：' + from.slice(0, 60));
    src = src.replace(from, to);
  });
  const fn = new Function('window', 'Date', 'Math', 'JSON', 'console', src + '\nreturn window.ShadowPlan;');
  return fn(sandbox.window, sandbox.Date, sandbox.Math, sandbox.JSON, sandbox.console);
}

/* 词表与句表：和界面同源 —— sections.json 展平，目标词 = [[词头:表面]] 的词头 */
const SECTIONS = JSON.parse(fs.readFileSync(path.join(ROOT, 'shadow/data/sections.json'), 'utf8'));
const SENT_RAW = [];
SECTIONS.forEach((sec) => sec.paragraphs.forEach((p) => p.forEach((t) => SENT_RAW.push(t))));
const WORDS_BY_SENT = SENT_RAW.map((raw) => {
  const re = /\[\[([^\]:]+):/g;
  const out = [];
  let m;
  while ((m = re.exec(raw || ''))) {
    const k = m[1].trim().toLowerCase();
    if (out.indexOf(k) < 0) out.push(k);
  }
  return out;
});
const ALL_WORDS = new Set([].concat.apply([], WORDS_BY_SENT)).size;
const wordsOf = (i) => WORDS_BY_SENT[i] || [];

function run(label, minutes, patch, opts) {
  const eng = loadEngine(patch);
  const o = Object.assign({ accuracy: 0.85, maxDays: 1095 }, opts || {}, {
    totalSents: SENT_RAW.length,
    wordsOf: wordsOf,
    totalWords: ALL_WORDS,
    boundaryHour: 4,
    now: Date.parse('2026-09-21T09:00:00'),
    plan: { todayMinutes: minutes, boundaryHour: 4, pausedNew: false },
  });
  const t0 = Date.now();
  const r = eng.estimateDays(eng.emptyState(), minutes, o);
  return {
    label: label, minutes: minutes, ms: Date.now() - t0,
    done: r.done, days: r.days, capped: r.capped, empty: r.empty,
    doneAt: r.doneAt ? new Date(r.doneAt).toISOString().slice(0, 10) : '—',
    year1: r.atHorizon ? r.atHorizon.graduated : null,
  };
}

/* ---------- 候选改动（字符串必须精确命中当前源码） ---------- */
const GRAD = 'const GRADUATED_INTERVALS = [14, 30];';
const GRAD_N = (n) => 'const GRADUATED_INTERVALS = [' + n + ', 30];';
const REPS = 'const MASTER_REPS = 20;';
const REPS_N = (n) => 'const MASTER_REPS = ' + n + ';';
const INTERVALS = 'const WORD_INTERVALS = [0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 5, 5, 5, 5, 5, 7, 7, 7, 7, 7];';
const IV_TIGHT = 'const WORD_INTERVALS = [0, 0, 0, 1, 1, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3];';
const IV_LOOSE = 'const WORD_INTERVALS = [0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 6, 6, 8, 8, 10, 12, 12, 15, 15, 18];';
// 装配时把毕业词整个跳过 —— 这是「毕业 = 永不再见」的唯一实现处
const SKIP = "if (st.stage === 'graduated') continue;";
const NOSKIP = ';';
const ROOMY = 'const roomy = left >= 0.6 * budget || chosen.size === 0 && budget === 0;';
const ROOMY_N = (f) => 'const roomy = left >= ' + f + ' * budget || chosen.size === 0 && budget === 0;';

const CANDIDATES = [
  { name: '现状（基线）', patch: [] },
  { name: '毕业档 14→30 天', patch: [[GRAD, GRAD_N(30)]] },
  { name: '毕业档 14→60 天', patch: [[GRAD, GRAD_N(60)]] },
  { name: '新词闸门 0.6→0.25', patch: [[ROOMY, ROOMY_N(0.25)]] },
  { name: '新词闸门去掉（有余量就塞）', patch: [[ROOMY, ROOMY_N(-1)]] },
  { name: '门槛 20→16 次接触', patch: [[REPS, REPS_N(16)]] },
  { name: '门槛 20→12 次接触', patch: [[REPS, REPS_N(12)]] },
  { name: '门槛 20→8 次接触', patch: [[REPS, REPS_N(8)]] },
  { name: '间隔表尾部收紧 7→5', patch: [[INTERVALS, IV_TIGHT]] },
  { name: '间隔表尾部放宽 7→12', patch: [[INTERVALS, IV_LOOSE]] },
  { name: '12 次 + 收紧到 5', patch: [[REPS, REPS_N(12)], [INTERVALS, IV_TIGHT]] },
  { name: '毕业词继续回炉（14 天）', patch: [[SKIP, NOSKIP]] },
  { name: '毕业词回炉 + 档改 30 天', patch: [[SKIP, NOSKIP], [GRAD, GRAD_N(30)]] },
  { name: '毕业词回炉 + 档改 60 天', patch: [[SKIP, NOSKIP], [GRAD, GRAD_N(60)]] },
  { name: '回炉 + 12 次门槛', patch: [[SKIP, NOSKIP], [REPS, REPS_N(12)]] },
];

const MINUTES = [15, 30, 60, 120];
const rows = [];
CANDIDATES.forEach((c) => MINUTES.forEach((m) => rows.push(run(c.name, m, c.patch))));

const pad = (s, n) => String(s) + ' '.repeat(Math.max(0, n - String(s).length));
console.log('词表 ' + ALL_WORDS + ' 词 · ' + SENT_RAW.length + ' 句 · 正确率假设 0.85 · 日界 4 点\n');
console.log(pad('候选', 26) + pad('分钟', 6) + pad('走完天数', 10) + pad('毕业日', 13) + pad('一年后毕业', 12) + pad('每天推掉', 10) + '耗时ms');
rows.forEach((r) => console.log(
  pad(r.label, 26) + pad(r.minutes, 6) + pad(r.days === null ? '封顶(>1095)' : r.days, 10) +
  pad(r.doneAt, 13) + pad(r.year1, 12) +
  pad(r.days ? (ALL_WORDS / r.days).toFixed(1) : '—', 10) + r.ms));

fs.writeFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'sched_probe_result.json'), JSON.stringify(rows, null, 2) + '\n');
console.log('\n明细已写 work/sched_probe_result.json');
