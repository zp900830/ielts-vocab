#!/usr/bin/env node
/* 一次性探针（不进产品）：把「这一期毕业要多久」在设置屏会给出的每个分钟档先算准，
   顺便量 estimateDays 的真实耗时 —— 决定界面要不要缓存、防抖多少毫秒。
   算法一律用产品里同一个 estimateDays，不自建第二套算式（本仓库规矩：一份逻辑两份实现就会漂移）。
   跑法：node work/eta_probe.mjs   */
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
const MINUTES = [5, 10, 15, 20, 30, 45, 60, 90, 120, 180];
const HORIZON = 1095;                       // 与 sched_probe 同一把尺：三年封顶

console.log(`词表 ${ALL_WORDS} · 句子 ${SENT_RAW.length} · 封顶 ${HORIZON} 天 · 起点 2026-09-21\n`);
console.log('分钟  天数   完工日期      一年后已毕业   单次耗时   界面文案');
MINUTES.forEach((m) => {
  const o = {
    accuracy: 0.85, maxDays: HORIZON,
    totalSents: SENT_RAW.length, wordsOf, totalWords: ALL_WORDS,
    boundaryHour: 4, now: Date.parse('2026-09-21T09:00:00'),
    plan: { todayMinutes: m, boundaryHour: 4, pausedNew: false },
  };
  const t0 = Date.now();
  const r = eng.estimateDays(eng.emptyState(), m, o);
  const ms = Date.now() - t0;
  const d = r.doneAt ? new Date(r.doneAt) : null;
  const cn = d ? `${d.getUTCFullYear()} 年 ${d.getUTCMonth() + 1} 月 ${d.getUTCDate()} 日` : '—';
  const copy = r.capped
    ? `三年内到不了（一年只毕业 ${r.atHorizon ? r.atHorizon.graduated : '?'} 个）`
    : `照每天 ${m} 分钟，到 ${cn} 全部毕业`;
  console.log(
    `${String(m).padStart(4)}  ${(r.capped ? '封顶' : String(r.days)).padStart(5)}  ${cn.padEnd(14)}  ` +
    `${String(r.atHorizon ? r.atHorizon.graduated : '—').padStart(8)}      ${String(ms).padStart(5)}ms   ${copy}`);
});
