#!/usr/bin/env node
/* 一次性探针（不进产品）：保温（毕业词 14 天回访回池）到底吃掉多少预算、把工期拖长多少。
   做法照抄 work/sched_probe.mjs：把真 plan-engine.js 装进 Node 沙箱当 window.ShadowPlan，
   用它自带的 estimateDays 跑真实词表。为什么不用另一套算式：本仓库的规矩是
   「一份逻辑两份实现就会漂移」。
   规格出处：docs/superpowers/plans/2026-09-22-保温第一期.md §4 Task 1 与 Task 4。

   —— 这个文件有过两代，别把两代的数混着引用 ——
   v1（Task 1 用）：保温还没实现，那批「保温打开」的数是把 assemble() 里毕业词那句 continue
       用【字符串补丁】换出来的。整份文件在 git 里：`git show HEAD~1:work/baowen_probe.mjs`，
       结论留在 work/保温预算-实测-2026-09-22.md §1–§8。
   v2（现在这份，Task 4 用）：保温已经在引擎里了，所以除了一格「拆掉 clamp」，
       一行源码都不改 —— 配额直接喂 plan.baowenCap。量的是【真要上线的那份实现】。

   四组数：
     对照·不保温 —— plan.baowenCap=0，等价于旧行为「毕业 = 永不再见」；
     上线口径    —— 不传 baowenCap，走引擎默认 BAOWEN_CAP_SENTS，界面上就是这个数；
     配额扫描    —— cap ∈ {2,4,8,16,32}，把「工期拖长 ≤10% 的最大档」这条判据在真实现上复核；
     不限额      —— 唯一需要补丁的一组：resolveBaowenCap 把 cap 钳到 64 是防呆不是策略，
                    要看真·不限额怎么塌必须绕开它。
   确定性：不许 Math.random()，抽签全走引擎现成 hash32。每格连跑两遍，
   逐字段（含 estimateDays 返回的整个 JSON）比对，不一致就报错退出非零。
   跑法：node work/baowen_probe.mjs   （约 2-4 分钟，明细写 work/baowen_probe_result.json） */
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

/* 唯一一处字符串补丁：拆掉 resolveBaowenCap 的 64 上限。撞不上源码就抛错，不许静默跳过。 */
const CLAMP = 'return Number.isFinite(n) ? Math.max(0, Math.min(64, Math.floor(n))) : BAOWEN_CAP_SENTS;';
const NO_CLAMP = 'return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : BAOWEN_CAP_SENTS;';

const MINUTES = [5, 10, 15, 20, 30, 45, 60];
const START = Date.parse('2026-09-21T09:00:00');

function estimateOnce(minutes, cap, patch) {
  const eng = loadEngine(patch);
  const plan = { todayMinutes: minutes, boundaryHour: 4, pausedNew: false };
  if (cap !== null) plan.baowenCap = cap;
  const o = {
    accuracy: 0.85, maxDays: 1095,
    totalSents: SENT_RAW.length, wordsOf: wordsOf, totalWords: ALL_WORDS,
    boundaryHour: 4, now: START, plan: plan,
  };
  const t0 = Date.now();
  const r = eng.estimateDays(eng.emptyState(), minutes, o);
  return { ms: Date.now() - t0, json: JSON.stringify(r), r: r };
}

function runCell(group, capLabel, minutes, cap, patch, problems) {
  const a = estimateOnce(minutes, cap, patch);
  const b = estimateOnce(minutes, cap, patch);
  const deterministic = a.json === b.json;
  if (!deterministic) problems.push(group + ' / cap=' + capLabel + ' / ' + minutes + 'min：两遍结果不一致');
  const r = a.r;
  return {
    group, cap: capLabel, minutes,
    done: r.done, days: r.days, capped: r.capped, empty: r.empty,
    doneAt: r.doneAt ? new Date(r.doneAt).toISOString().slice(0, 10) : '—',
    /* D10 之后 estimateDays 返回 passed/passedNow（「被通读到过一次」），不再是 graduated。
       v1 那版读错过字段、静默打了 null —— 读数缺了不报错，比报错坏，所以这里显式读对的名字。 */
    year1: r.atHorizon ? r.atHorizon.passed : null,
    passedNow: r.passedNow, total: r.total,
    ms1: a.ms, ms2: b.ms, deterministic,
  };
}

const problems = [];
const rows = [];

function runGroup(group, capLabel, minutes, cap, patch) {
  const cell = runCell(group, capLabel, minutes, cap, patch, problems);
  rows.push(cell);
  console.log(`[${group}] cap=${capLabel} ${String(minutes).padStart(2)}min → ` +
    `days=${cell.days === null ? '封顶(>1095)' : cell.days} doneAt=${cell.doneAt} ` +
    `capped=${cell.capped} empty=${cell.empty} 一年后过完=${cell.year1} ` +
    `耗时=${cell.ms1}/${cell.ms2}ms 确定=${cell.deterministic}`);
}

const ENG = loadEngine([]);
console.log('引擎常数：MASTER_REPS=' + ENG.MASTER_REPS + ' BAOWEN_CAP_SENTS=' + ENG.BAOWEN_CAP_SENTS +
  ' BAOWEN_MIN_MINUTES=' + ENG.BAOWEN_MIN_MINUTES + ' 句=' + SENT_RAW.length + ' 词=' + ALL_WORDS + '\n');

// 1) 对照：cap=0 ≡ 旧的「永不再见」
MINUTES.forEach((m) => runGroup('对照·不保温', '0', m, 0, []));
// 2) 上线口径：不传 baowenCap，走引擎默认 —— 界面与文档 §9 引用的就是这一列
MINUTES.forEach((m) => runGroup('上线口径·引擎默认', '默认', m, null, []));
// 3) 配额扫描：判据要在真实现上复核一遍
[2, 4, 8, 16, 32].forEach((cap) => {
  MINUTES.forEach((m) => runGroup('配额cap=' + cap, String(cap), m, cap, []));
});
// 4) 边界对照：拆掉 clamp 的真·不限额。预期全档塌（§8.3 第 3 条的论证要在实现上再验一次）
MINUTES.forEach((m) => runGroup('不限额(拆clamp)', '不限', m, 1e9, [[CLAMP, NO_CLAMP]]));

/* ---------- 自检：低档（<15min）不保温必须由引擎自己兑现 ----------
   v1 的自检是「cap=0 与基线逐字段相同」（证明补丁没顺手改坏别的行为）；
   保温已经在引擎里了，能塌的方换成了这个：低档传默认与传 0 必须一模一样。
   ⚠️ 比的是【排程结果字段】，不能把 ms1/ms2 卷进来 —— 那是墙钟耗时，任何两跑都不相等，
      上一版整行 JSON.stringify 比，结果每档都假报"不保温没生效"。 */
const SEMANTIC = ['done', 'days', 'capped', 'empty', 'doneAt', 'year1', 'passedNow', 'total'];
const semantic = (r) => JSON.stringify(SEMANTIC.map((k) => r[k]));
MINUTES.filter((m) => m < ENG.BAOWEN_MIN_MINUTES).forEach((m) => {
  const a = semantic(rows.find((r) => r.group === '对照·不保温' && r.minutes === m));
  const b = semantic(rows.find((r) => r.group === '上线口径·引擎默认' && r.minutes === m));
  if (a !== b) problems.push(`${m}min 档：默认口径与 cap=0 不一致 —— 低档「不保温」这条口径没生效`);
});

/* ---------- 汇总：相对「不保温」的工期拖长 % ---------- */
console.log('\n拖长百分比（相对同档位 cap=0；封顶=三年内无完工日，百分比无定义）：');
const pct = {};
const LABELS = [['默认', '默认'], ['2', '2'], ['4', '4'], ['8', '8'], ['16', '16'], ['32', '32'], ['不限', '不限']];
MINUTES.forEach((m) => {
  const base = rows.find((r) => r.group === '对照·不保温' && r.minutes === m);
  const line = LABELS.map(([key, label]) => {
    const cell = rows.find((r) => r.cap === key && r.minutes === m && r.group !== '对照·不保温');
    if (!cell || cell.days === null || base.days === null) {
      (pct[key] = pct[key] || {})[m] = null; return label + ':—';
    }
    const p = (cell.days - base.days) / base.days * 100;
    (pct[key] = pct[key] || {})[m] = p;
    return label + ':' + (p >= 0 ? '+' : '') + p.toFixed(1) + '%';
  });
  console.log(String(m).padStart(2) + 'min  ' + line.join('  '));
});

console.log('\n上线口径一表（文档 §9 与 spec §3 引用的是这一列）：');
MINUTES.forEach((m) => {
  const c = rows.find((r) => r.group === '上线口径·引擎默认' && r.minutes === m);
  console.log(`  ${String(m).padStart(2)}min → ${c.days === null ? '封顶(>1095)' : c.days + ' 天'} ` +
    `完工 ${c.doneAt} · 一年后过完 ${c.year1} · estimateDays ${c.ms1}ms`);
});

const slowest = rows.reduce((a, r) => Math.max(a, Math.max(r.ms1, r.ms2)), 0);
console.log('\nestimateDays 单次最慢 ' + slowest + ' ms（界面三处靠它；>1000ms 就要考虑限频）');

fs.writeFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'baowen_probe_result.json'),
  JSON.stringify({ engine: { masterReps: ENG.MASTER_REPS, cap: ENG.BAOWEN_CAP_SENTS,
                             minMinutes: ENG.BAOWEN_MIN_MINUTES },
                   rows, pct, words: ALL_WORDS, sents: SENT_RAW.length }, null, 2) + '\n');
console.log('明细已写 work/baowen_probe_result.json');

if (problems.length) {
  console.error('\n不成立：\n' + problems.join('\n'));
  process.exit(1);
}
console.log('确定性 + 低档不保温自检：全部 ' + rows.length + ' 格 ×2 遍逐字段一致。');
