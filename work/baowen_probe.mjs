#!/usr/bin/env node
/* 一次性探针（不进产品）：保温（毕业词 14 天回访回池）到底吃掉多少预算、把工期拖长多少。
   做法照抄 work/sched_probe.mjs：把 plan-engine.js 的源码按候选改动做一次字符串替换，
   在 Node 里装成 window.ShadowPlan，再用它自带的 estimateDays 跑真实词表。
   为什么不用另一套算式：本仓库的规矩是「一份逻辑两份实现就会漂移」。
   规格出处：docs/superpowers/plans/2026-09-22-保温第一期.md §4 Task 1。
   三组数：
     基线      —— MASTER_REPS 20（现状）与 12（已拍板门槛），无保温；
     保温打开  —— 门槛固定 12，把 assemble() 里毕业词那句 continue 换成
                  「按 GRADUATED_INTERVALS[0]（14 天）到期才回池」（即不限配额）；
     配额扫描  —— cap ∈ {0, 2, 4, 8, 不限}，单位是「句」：每天最多几「句」
                  是为了带一个到期回炉词而排进来的（句已被排进来则免费顺带）。
   确定性：不许 Math.random()，抽签全走引擎现成 hash32。每个格子连跑两遍，
   逐字段（含 estimateDays 返回的整个 JSON）比对，不一致就标 red 并退出非零。
   跑法：node work/baowen_probe.mjs   （约 1-2 分钟，明细写 work/baowen_probe_result.json） */
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

/* ---------- 字符串补丁（必须精确命中当前源码，撞不上就抛错） ---------- */
const REPS = 'const MASTER_REPS = 20;';
const REPS_N = (n) => 'const MASTER_REPS = ' + n + ';';

// 「毕业 = 永不再见」的唯一实现处（本文件写作时在 plan-engine.js:189）
const SKIP = "if (st.stage === 'graduated') continue;";
// 换成：到期（GRADUATED_INTERVALS[0] = 14 天，due 由 replay 里 wordInterval 在毕业那刻排好）
// 才回池，按普通到期词进 A 池，但打上 g:1 标记，好在下面配额处计数。
const BACKPOOL = "if (st.stage === 'graduated') { if ((st.due || 0) > now) continue; " +
  "inPool[w] = 'A'; dueWords++; due.push({ w: w, i: i, due: st.due || 0, leech: false, g: 1 }); continue; }";

// A 池取句循环：加「每日保温句上限」。cap 计的是「为了带一个回炉词而新排的句」——
// 句子若已因未毕业词被排进（riding），回炉词免费顺带，不吃配额。
const TAKE_OLD = `    for (let n = 0; n < due.length; n++) {
      if (!take(due[n].i, 'A', secReview)) droppedA++;
    }`;
const TAKE_NEW = (cap) => `    let baowenSent = 0;
    for (let n = 0; n < due.length; n++) {
      const e = due[n];
      const riding = chosen.has(e.i);
      if (e.g && !riding && baowenSent >= ${cap}) { droppedA++; continue; }
      if (!take(e.i, 'A', secReview)) { droppedA++; continue; }
      if (e.g && !riding) baowenSent++;
    }`;

const baowenPatch = (capExpr) => [[SKIP, BACKPOOL], [TAKE_OLD, TAKE_NEW(capExpr)]];

/* ---------- 跑一格：同一格连跑两遍，逐字段比对 ---------- */
const MINUTES = [5, 10, 15, 20, 30, 45, 60];

function estimateOnce(label, minutes, patch) {
  const eng = loadEngine(patch);
  const o = {
    accuracy: 0.85, maxDays: 1095,
    totalSents: SENT_RAW.length,
    wordsOf: wordsOf,
    totalWords: ALL_WORDS,
    boundaryHour: 4,
    now: Date.parse('2026-09-21T09:00:00'),
    plan: { todayMinutes: minutes, boundaryHour: 4, pausedNew: false },
  };
  const t0 = Date.now();
  const r = eng.estimateDays(eng.emptyState(), minutes, o);
  return { ms: Date.now() - t0, json: JSON.stringify(r), r: r };
}

function runCell(group, capLabel, minutes, patch, problems) {
  const a = estimateOnce(capLabel, minutes, patch);
  const b = estimateOnce(capLabel, minutes, patch);
  const deterministic = a.json === b.json;
  if (!deterministic) problems.push(group + ' / cap=' + capLabel + ' / ' + minutes + 'min：两遍结果不一致');
  const r = a.r;
  return {
    group, cap: capLabel, minutes,
    done: r.done, days: r.days, capped: r.capped, empty: r.empty,
    doneAt: r.doneAt ? new Date(r.doneAt).toISOString().slice(0, 10) : '—',
    year1: r.atHorizon ? r.atHorizon.graduated : null,
    graduatedNow: r.graduatedNow, total: r.total,
    ms1: a.ms, ms2: b.ms, deterministic,
  };
}

const problems = [];
const rows = [];

function runGroup(group, label, minutes, patch) {
  const cell = runCell(group, label, minutes, patch, problems);
  rows.push(cell);
  console.log(`[${group}] cap=${label} ${String(minutes).padStart(2)}min → ` +
    `days=${cell.days === null ? '封顶(>1095)' : cell.days} doneAt=${cell.doneAt} ` +
    `capped=${cell.capped} empty=${cell.empty} 一年后=${cell.year1} ` +
    `耗时=${cell.ms1}/${cell.ms2}ms 确定=${cell.deterministic}`);
}

// 1) 基线：门槛 20（现状）/ 12（已拍板），无保温
MINUTES.forEach((m) => runGroup('基线-20次', '无保温', m, []));
MINUTES.forEach((m) => runGroup('基线-12次', '无保温', m, [[REPS, REPS_N(12)]]));

// 2+3) 保温打开 + 配额扫描：门槛固定 12（否则差异分不清是门槛的还是保温的）。
//      cap=不限 即「保温打开」那一组；cap=0 是边界对照，理论上应与基线-12 完全一致（顺带当自检）。
const CAPS = [[0, '0'], [2, '2'], [4, '4'], [8, '8'], ['Infinity', '不限']];
CAPS.forEach(([capExpr, capLabel]) => {
  MINUTES.forEach((m) => {
    const group = capLabel === '不限' ? '保温打开(不限)' : '配额cap=' + capLabel;
    runGroup(group, capLabel, m, [[REPS, REPS_N(12)], ...baowenPatch(capExpr)]);
  });
});

/* ---------- 汇总：各档位 相对不保温(12次) 的工期拖长 % ---------- */
const byKey = {};
rows.forEach((r) => { byKey[r.cap + '@' + r.minutes] = r; });
console.log('\n拖长百分比（相对 门槛12·无保温，同档位；封顶=三年内无完工日，百分比无定义）：');
const pct = {};
MINUTES.forEach((m) => {
  const b = rows.find((r) => r.group === '基线-12次' && r.minutes === m);
  const line = CAPS.map(([, label]) => {
    const cell = rows.find((r) => r.group !== '基线-20次' && r.group !== '基线-12次' && r.cap === label && r.minutes === m);
    if (!cell || cell.days === null || b.days === null) { (pct[label] = pct[label] || {})[m] = null; return label + ':' + '—'; }
    const p = (cell.days - b.days) / b.days * 100;
    (pct[label] = pct[label] || {})[m] = p;
    return label + ':' + (p >= 0 ? '+' : '') + p.toFixed(1) + '%';
  });
  console.log(m + 'min  ' + line.join('  '));
});

fs.writeFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'baowen_probe_result.json'),
  JSON.stringify({ rows, pct, words: ALL_WORDS, sents: SENT_RAW.length }, null, 2) + '\n');
console.log('\n明细已写 work/baowen_probe_result.json');

if (problems.length) {
  console.error('\n确定性被破坏：\n' + problems.join('\n'));
  process.exit(1);
}
console.log('确定性验证：全部 ' + rows.length + ' 格 ×2 遍逐字段一致。');
