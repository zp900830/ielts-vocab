#!/usr/bin/env node
/* 一次性探针（不进产品）：两步制落地后，有没有「永远出不了题」的词。
   为什么必须单独量：estimateDays 的模拟器给队列里每一题都算一次接触，
   但界面规则是「凑不满四个合格干扰项就不出题」（规格 D4）。
   若某个词在它出现过的每一个语境里都出不了题，它就拿不到毕业凭据 ok3，
   永远不毕业 —— 那界面上那个完工日期是假的。
   判据一律调产品里同一个 ShadowPlan.blankQuiz，不自建第二套。
   跑法：node work/two_step_deadword_probe.mjs                               */
'use strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VOCAB = JSON.parse(fs.readFileSync(path.join(ROOT, 'shadow/data/vocab.json'), 'utf8'));
const SECTIONS = JSON.parse(fs.readFileSync(path.join(ROOT, 'shadow/data/sections.json'), 'utf8'));
const SRC = fs.readFileSync(path.join(ROOT, 'shadow/js/plan-engine.js'), 'utf8');
const eng = (new Function('window', SRC + '\nreturn window.ShadowPlan;'))({});

const SENT_RAW = [], PARA = [];
SECTIONS.forEach((s, si) => (s.paragraphs || []).forEach((p, pi) => p.forEach((t) => {
  SENT_RAW.push(t); PARA.push(si + '.' + pi);
})));
const RE = /\[\[([^\]:]+):([^\]]+)\]\]/g;
const wordsOf = (i) => {
  const out = []; let m; RE.lastIndex = 0;
  while ((m = RE.exec(String(SENT_RAW[i] || '')))) {
    const k = m[1].trim().toLowerCase();
    if (out.indexOf(k) < 0 && VOCAB[k]) out.push(k);
  }
  return out;
};
const WORD_SENTS = {};
SENT_RAW.forEach((_, i) => wordsOf(i).forEach((w) => (WORD_SENTS[w] = WORD_SENTS[w] || []).push(i)));

// 同段目标词（与界面 paraCardsOf 同一口径：按段落聚合，排除自己）
const PARA_WORDS = {};
SENT_RAW.forEach((_, i) => {
  const g = (PARA_WORDS[PARA[i]] = PARA_WORDS[PARA[i]] || {});
  wordsOf(i).forEach((w) => { g[w] = VOCAB[w]; });
});
// 已裁决辨析组成员（与界面 groupCardsOf 同一口径：从 vocab[k].cmp 的 items[].w 取）
const GROUP = {};
Object.keys(VOCAB).forEach((k) => {
  const c = VOCAB[k].cmp; if (!c) return;
  const members = [];
  (c.items || []).forEach((it) => { const w = String(it.w || '').toLowerCase(); if (w && VOCAB[w] && members.indexOf(w) < 0) members.push(w); });
  const g = (arr) => arr.forEach((w) => {
    const m = (GROUP[w] = GROUP[w] || {});
    members.forEach((x) => { if (x !== w) m[x] = VOCAB[x]; });
  });
  g(members);
  if (c.group) String(c.group).split(/[-\/]/).map((x) => x.trim().toLowerCase()).forEach((w) => {
    if (VOCAB[w]) { const m = (GROUP[w] = GROUP[w] || {}); members.forEach((x) => { if (x !== w) m[x] = VOCAB[x]; }); }
  });
});

const senses = (m) => String(m || '').split(/[；;]/).map((x) => x.trim()).filter(Boolean);
const uniq = (a) => Array.from(new Set(a));

let deadHard = [], deadSoft = [], okWords = 0;
const allWords = Object.keys(VOCAB);
for (const w of allWords) {
  const card = VOCAB[w] || {};
  const sents = WORD_SENTS[w] || [];
  const cardSenses = uniq([].concat(senses(card.m), senses((card.ex || '') && '')));
  let hard = false, soft = false;
  const tryAnchor = (i, sense) => !!eng.blankQuiz({
    sent: i, word: w, sense: sense, sentZh: '', card: card,
    groupCards: GROUP[w] || {}, paraCards: Object.assign({}, PARA_WORDS[PARA[i]] || {}),
    bookCards: VOCAB,
  });
  for (const i of sents) {
    if (hard) break;
    if (tryAnchor(i, cardSenses[0])) { hard = true; break; }
    if (!soft && cardSenses.some((s) => tryAnchor(i, s))) soft = true;
  }
  if (!hard && !soft && card.ex) { /* 卡上例句这个语境：宿主用 from=该句，池子同第一段 */ }
  if (hard) okWords++;
  else if (soft) deadSoft.push(w);
  else deadHard.push(w);
}
console.log('词头总数:', allWords.length);
console.log('默认义项就能出题:', okWords);
console.log('换别的义项才出得了题:', deadSoft.length, deadSoft.slice(0, 20).join(' '));
console.log('该词出现过的每一句都出不了题:', deadHard.length, deadHard.slice(0, 40).join(' '));
const noSents = allWords.filter((w) => !(WORD_SENTS[w] || []).length);
console.log('课文里一次都没被标出的词:', noSents.length);
