#!/usr/bin/env node
/* 一次性探针（不进产品）：用【宿主真实出题路径】量 ② 挖空选择的出题供给 —— 也就是
   「多少比例的句子凑不出合格干扰项因而不出题」这个决定实际覆盖率的数。
   判据一律走 TASK.blankQuizFor（与界面上那道题同一个实现），不在这里重写一遍：
   本仓库的规矩是一份逻辑不许有两份实现，自己另算只会算出一个不会漂移的错数。
   跑法：python3 -m http.server 8941 --bind 127.0.0.1 --directory shadow &
        node work/two_step_build_probe.mjs                                    */
'use strict';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// playwright 只装在 playwright-tests/ 下（仓库根没有 package.json），仓库根跑不进模块解析 —— 两条路都试
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let pw;
try { pw = await import('playwright'); }
catch { pw = await import(pathToFileURL(path.join(ROOT, 'playwright-tests/node_modules/playwright/index.js')).href); }
const chromium = pw.chromium || (pw.default && pw.default.chromium);

const BASE = process.env.PROBE_BASE || 'http://127.0.0.1:8941';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.sent');

const out = await page.evaluate(() => {
  const sentEls = Array.from(document.querySelectorAll('.sent'));
  const wordsOf = (el) => Array.from(el.querySelectorAll('.w'))
    .map(w => (w.dataset.w || '').toLowerCase()).filter(Boolean)
    .filter((x, i, a) => a.indexOf(x) === i);
  const perSent = [];
  const pair = { built: 0, refused: 0 };
  sentEls.forEach((el, i) => {
    const ws = wordsOf(el);
    if (!ws.length) return;
    let ok = 0;
    ws.forEach(w => {
      if (TASK.blankQuizFor(i, w)) { pair.built++; ok++; } else pair.refused++;
    });
    perSent.push({ i, words: ws.length, ok });
  });
  // 例句题（k 槽）另算：它的干扰项池 = 该词的辨析组 + 它被排进队列时那一句的同段词（from）
  const firstSentOf = {};
  sentEls.forEach((el, i) => wordsOf(el).forEach(w => { if (firstSentOf[w] === undefined) firstSentOf[w] = i; }));
  let exBuilt = 0, exRefused = 0;
  Object.keys(VOCAB).slice(0, 400).forEach(w => {
    const from = firstSentOf[w.toLowerCase()];
    if (from === undefined) return;                       // 课文里没标过的词不会进队列
    if (TASK.blankQuizFor('ex', w, from)) exBuilt++; else exRefused++;
  });
  return {
    sents: perSent.length,
    pairBuilt: pair.built, pairRefused: pair.refused,
    sentOk: perSent.filter(x => x.ok > 0).length,
    sentNone: perSent.filter(x => x.ok === 0).length,
    exBuilt, exRefused,
  };
});
await browser.close();

const pct = (a, b) => (100 * a / b).toFixed(1) + '%';
console.log(`课文句 ${out.sents} 句（有目标词的）`);
console.log(`(句,词) 对：能出题 ${out.pairBuilt} / ${out.pairBuilt + out.pairRefused} = ${pct(out.pairBuilt, out.pairBuilt + out.pairRefused)}` +
  ` → 出不了题 ${out.pairRefused} 对 = ${pct(out.pairRefused, out.pairBuilt + out.pairRefused)}`);
console.log(`按句看：至少有一个词能出题 ${out.sentOk} / ${out.sents} = ${pct(out.sentOk, out.sents)}` +
  ` → 整句不弹题 ${out.sentNone} 句 = ${pct(out.sentNone, out.sents)}`);
console.log(`例句题（只认辨析组）：出题 ${out.exBuilt} / ${out.exBuilt + out.exRefused} = ${pct(out.exBuilt, out.exBuilt + out.exRefused)}`);
