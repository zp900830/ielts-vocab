#!/usr/bin/env node
/* 一次性探针（不进产品）：量「② 挖空选择」的出题供给。
   三种干扰项池各算一遍，决定实现口径与工期表重算时的可用题量：
     A = 今天的 ③（义项取自同段其它目标词，无词性约束）
     B = 严格：只取该词所在「已裁决辨析组」（vocab.cmp）的成员 + 同词性
     C = B 优先，不足 3 个再用同段同词性目标词补（PRD §7.2 的补池阶梯）
   跑法：node work/two_step_supply_probe.mjs                                     */
'use strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VOCAB = JSON.parse(fs.readFileSync(path.join(ROOT, 'shadow/data/vocab.json'), 'utf8'));
const SECTIONS = JSON.parse(fs.readFileSync(path.join(ROOT, 'shadow/data/sections.json'), 'utf8'));

const SENT_RAW = [];
const PARA = [];           // 句号 → 'si.pi'
SECTIONS.forEach((s, si) => (s.paragraphs || []).forEach((p, pi) => p.forEach((t) => {
  SENT_RAW.push(t); PARA.push(si + '.' + pi);
})));
const RE = /\[\[([^\]:]+):([^\]]+)\]\]/g;
const wordsOf = (i) => {
  const out = []; let m;
  RE.lastIndex = 0;
  while ((m = RE.exec(String(SENT_RAW[i] || '')))) {
    const k = m[1].trim().toLowerCase();
    if (out.indexOf(k) < 0 && VOCAB[k]) out.push(k);
  }
  return out;
};
const PARA_WORDS = {};
SENT_RAW.forEach((_, i) => { (PARA_WORDS[PARA[i]] = PARA_WORDS[PARA[i]] || new Set()); wordsOf(i).forEach(w => PARA_WORDS[PARA[i]].add(w)); });

const parseSenses = (m) => String(m || '').split(/[；;]/).map(x => x.trim()).filter(Boolean);
const POSRX = /\b(n|v|vt|vi|adj|adv|prep|conj|pron|num|int|abbr|phrase)\./ig;
const posSet = (m) => { const s = new Set(); let x; POSRX.lastIndex = 0; while ((x = POSRX.exec(String(m || '')))) s.add(x[1].toLowerCase() + '.'); return s; };
const posOf = (m) => { const x = String(m || '').match(/^\s*(n|v|vt|vi|adj|adv|prep|conj|pron|num|int|abbr)\./i); return x ? x[1].toLowerCase() + '.' : ''; };
const norm = (s) => String(s).replace(/[，。、,.;；：:\s]/g, '');
const clean = (a, b) => { const ak = norm(a), bk = norm(b); return !!bk && bk !== ak && bk.indexOf(ak) < 0 && ak.indexOf(bk) < 0; };

// 辨析组反向索引：词 → 该词所在的所有已裁决组的成员
const GROUPS = new Map();      // gid → Set<word>
Object.keys(VOCAB).forEach((k) => {
  const c = VOCAB[k].cmp;
  if (!c || !Array.isArray(c.items)) return;
  const gid = String(c.group || k);
  const set = GROUPS.get(gid) || new Set();
  set.add(k.toLowerCase());
  c.items.forEach(it => { const w = String(it.w || '').toLowerCase(); if (VOCAB[w]) set.add(w); });
  GROUPS.set(gid, set);
});
const MY_GROUPS = new Map();   // word → [Set<word>]
GROUPS.forEach((set, gid) => set.forEach(w => {
  const list = MY_GROUPS.get(w) || [];
  list.push(set); MY_GROUPS.set(w, list);
}));

function countFor(i, w, mode) {
  const pw = posSet(VOCAB[w].m);
  const ans = parseSenses(VOCAB[w].m)[0] || '';
  if (!ans) return 0;
  const group = [];
  if (mode !== 'A') (MY_GROUPS.get(w) || []).forEach(set => set.forEach(x => {
    if (x !== w && group.indexOf(x) < 0) group.push(x);
  }));
  const pool = group.slice();
  if (mode !== 'B') {
    for (let k = 0; k < SENT_RAW.length; k++) {
      if (PARA[k] !== PARA[i]) continue;
      wordsOf(k).forEach(x => { if (x !== w && pool.indexOf(x) < 0) pool.push(x); });
    }
  }
  const isGroup = (x) => group.indexOf(x) >= 0;
  let n = 1;
  for (const x of pool) {
    if (!VOCAB[x]) continue;
    if (mode !== 'A' && ![...pw].some(p => posSet(VOCAB[x].m).has(p))) continue;
    const senses = parseSenses(VOCAB[x].m);
    // 各模式的差别只在两件事：池子里放不放同段词（B 只放辨析组）、以及「义项与本句重叠」怎么算：
    //   A 今天的 ③：只比中文义项，有一条不重叠就能用（无词性闸）
    //   B 严格 D5：只取辨析组成员 + 同词性，重叠口径同 A
    //   C 组+同段补池，一刀切重叠闸：候选只要有一档义项与本句重叠 → 整词踢掉（填进去也可能对）
    //   D 同 C，但辨析组成员免掉重叠闸：那一组差异是人工裁决过的（vocab.cmp 的 diff/summary）
    //   E 同 D，但补池退回 A 的宽松口径
    let usable;
    if (mode === 'D' || mode === 'E') {
      if (isGroup(x)) usable = true;                                     // 组内成员免掉双解闸
      else usable = mode === 'D' ? senses.every(s => clean(ans, s))       // 补池：一刀切
                                 : senses.some(s => clean(ans, s));       // 补池：老口径
    } else if (mode === 'C') usable = senses.every(s => clean(ans, s));
    else usable = senses.some(s => clean(ans, s));
    if (usable) { n++; if (n >= 4) break; }
  }
  return n;
}

const MODES = ['A', 'B', 'C', 'D', 'E'];
const stat = {};
MODES.forEach(m => stat[m] = { pairOk: 0, pairAll: 0, sentOk: 0 });
for (let i = 0; i < SENT_RAW.length; i++) {
  const ws = wordsOf(i);
  if (!ws.length) continue;
  MODES.forEach(mode => {
    let any = false;
    ws.forEach(w => {
      const n = countFor(i, w, mode);
      stat[mode].pairAll++;
      if (n >= 4) { stat[mode].pairOk++; any = true; }
    });
    if (any) stat[mode].sentOk++;
  });
}
const totalSent = SENT_RAW.filter((_, i) => wordsOf(i).length).length;
console.log(`句子 ${SENT_RAW.length}（含目标词的 ${totalSent}）· 词卡 ${Object.keys(VOCAB).length} · 已裁决辨析组 ${GROUPS.size} 组`);
console.log('A = 今天的 ③（同段义项、无词性闸） B = 严格只取辨析组成员+同词性');
console.log('C = 组+同段都要求「义项与本句不重叠」  D = 组内成员免重叠闸（裁决即凭据），补池才要不重叠');
MODES.forEach(mode => {
  const s = stat[mode];
  console.log(`${mode}: 能凑满四选一的 (句,词) 对 ${s.pairOk}/${s.pairAll} = ${(100 * s.pairOk / s.pairAll).toFixed(1)}%  |  该句至少一个词能出题 ${s.sentOk}/${totalSent} = ${(100 * s.sentOk / totalSent).toFixed(1)}%  |  出不了题的句 ${totalSent - s.sentOk}`);
});
// 补充：严格口径下按辨析组大小看供给上限
const sizes = {};
GROUPS.forEach(set => {
  let ok = 0;
  set.forEach(w => { if ([...set].filter(x => x !== w && [...posSet(VOCAB[w].m)].some(p => posSet(VOCAB[x].m).has(p))).length >= 3) ok++; });
  sizes[[set.size, ok]] = (sizes[[set.size, ok]] || 0) + 1;
});
console.log('辨析组 [成员数, 组内能独立凑满四选一的词数] → 组数:', JSON.stringify(sizes));
console.log('词卡带 cmp 的词头数:', Object.values(VOCAB).filter(v => v.cmp).length);
