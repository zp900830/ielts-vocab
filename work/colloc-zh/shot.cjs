#!/usr/bin/env node
'use strict';
/* 词伙带中文后的卡片外观截图：node work/colloc-zh/shot.cjs <W> <chapter> <out.png> */
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8932';
const W = Number(process.argv[2] || 1280);
const CH = process.argv[3] || '地球与生命';
const OUT = process.argv[4] || 'work/colloc-zh/cards.png';

(async () => {
  const browser = await chromium.launch({ channel: 'chromium' });
  const ctx = await browser.newContext({ viewport: { width: W, height: 1400 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => { window.__e2eAuthBypass = true; });
  await page.goto(`${BASE}/index.html#/home`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.art-card', { timeout: 20000 });
  const cards = page.locator('.art-card');
  const n = await cards.count();
  for (let i = 0; i < n; i++) {
    const t = (await cards.nth(i).textContent()) || '';
    if (t.includes(CH)) { await cards.nth(i).click(); break; }
  }
  await page.waitForFunction(() => document.querySelectorAll('.notebar').length > 2, null, { timeout: 20000 });
  await page.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve()));
  await page.waitForTimeout(600);
  const box = await page.evaluate(() => {
    const bars = [...document.querySelectorAll('.notebar')];
    const target = bars.find(b => /（[^）]+）/.test(b.textContent)) || bars[0];
    const g = target.closest('.nb-group') || target;
    g.scrollIntoView({ block: 'center', behavior: 'instant' });
    const r = g.getBoundingClientRect();
    return { x: r.x - 20, y: r.y - 30, w: Math.min(r.width + 40, innerWidth - 10), h: Math.min(r.height + 60, 800) };
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: OUT, clip: { x: Math.max(0, box.x), y: Math.max(0, box.y), width: box.w, height: box.h } });
  const info = await page.evaluate(() => {
    const bars = [...document.querySelectorAll('.notebar')];
    const wide = bars.filter(b => b.classList.contains('nb-wide')).length;
    return { cards: bars.length, wide, sample: bars.slice(0, 4).map(b => b.textContent.trim()) };
  });
  console.log(JSON.stringify(info, null, 1));
  await browser.close();
})();
