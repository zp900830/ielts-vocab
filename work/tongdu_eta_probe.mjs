#!/usr/bin/env node
/* 一次性探针（不进产品）：工期口径改成「只按通读算」之后，把设置屏那 7 个分钟档重新量一遍。
   产出直接抄进 docs/superpowers/specs/2026-09-21-走完全部词要多久-设计.md §3 的新表。
   算法一律用产品里同一个 estimateDays，不自建第二套算式（本仓库规矩：一份逻辑两份实现就会漂移）。
   跑法：node work/tongdu_eta_probe.mjs   */
'use strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = fs.readFileSync(path.join(ROOT, 'shadow/js/plan-engine.js'), 'utf8');

function loadEngine() {
  const sandbox = { window: {}, Date, Math, JSON, console };
  const fn = new Function('window', 'Date', 'Math', 'JSON', 'console', SRC + '\nreturn window.ShadowPlan;');
  return fn(sandbox.window, sandbox.Date, sandbox.Math, sandbox.JSON, sandbox.console);
}

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

const eng = loadEngine();
const MINUTES = [5, 10, 15, 20, 30, 45, 60];
const START = Date.parse('2026-09-22T09:00:00');

console.log(`词表 ${ALL_WORDS} · 句子 ${SENT_RAW.length} · 起点 2026-09-22 · 口径：预算只计通读，完工=每个词至少通读过一次\n`);
console.log('分钟  天数    完工日（UTC）    第365天已通读   单次耗时');
MINUTES.forEach((m) => {
  const o = {
    accuracy: 0.85, maxDays: 1095, horizonDays: 365,
    totalSents: SENT_RAW.length, wordsOf, totalWords: ALL_WORDS,
    boundaryHour: 4, now: START,
    plan: { todayMinutes: m, boundaryHour: 4, pausedNew: false },
  };
  const t0 = Date.now();
  const r = eng.estimateDays(eng.emptyState(), m, o);
  const ms = Date.now() - t0;
  const d = r.doneAt ? new Date(r.doneAt) : null;
  const cn = d ? `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}` : '—';
  console.log(
    `${String(m).padStart(4)}  ${(r.done ? String(r.days) : (r.capped ? '三年内到不了' : '排不出')).padStart(6)}  ${cn.padStart(12)}    ` +
    `${String(r.atHorizon ? r.atHorizon.passed : '—').padStart(8)}     ${ms}ms`);
});

/* 顺量一遍真实负载：每天排多少句、多少题 —— 用来判断「题不占预算」之后今天的句子数会不会涨得离谱。 */
console.log('\n每天负载（空状态第 1 天 / 第 30 天，assemble 直调）：');
MINUTES.forEach((m) => {
  const o = { totalSents: SENT_RAW.length, wordsOf, boundaryHour: 4, todayMinutes: m,
              plan: { todayMinutes: m, boundaryHour: 4, pausedNew: false },
              secNew: 25, secReview: 8, rate: 1 };
  const st = eng.emptyState();
  st.plan = o.plan;
  const d1 = eng.assemble(st, Object.assign({}, o, { now: START }));
  o.now = START + 29 * 864e5;
  const st2 = JSON.parse(JSON.stringify(st));
  const d30 = eng.assemble(st2, o);
  console.log(`  ${String(m).padStart(3)} 分钟：第 1 天 ${d1.queue.length} 句 / ${d1.items.length} 题（用掉 ${Math.round(d1.stats.usedSec)} 秒）` +
              ` · 第 30 天 ${d30.queue.length} 句 / ${d30.items.length} 题（用掉 ${Math.round(d30.stats.usedSec)} 秒）`);
});
