#!/usr/bin/env node
/* 底栏自激循环探针（2026-09-22 全量从 13 分钟涨到 26.4 分钟，先来定性再谈改）。
   判据不用"包一层函数数调用次数"—— 那些函数在闭包里，换 window 上的同名属性根本不拦截内部调用
   （work/../tests 里踩过，见 conventions 的探针教训）。改成观察它【写出去的 DOM】：
     · syncTaskBarHeight() 的唯一外部效果 = 往 documentElement 写 --task-bar-h
     · 所以 MutationObserver 数 style 属性变化 = 数它真跑了多少次，骗不了人
   关键区分：**没人操作的时候它还在不停写，就是自激**；只在点击/翻句时各写一次，是正常。
   跑法：8931 上要有服务（python3 -m http.server 8931 --directory shadow）
        node work/taskbar_loop_probe.mjs */
import { createRequire } from 'module';
const require = createRequire(new URL('../playwright-tests/package.json', import.meta.url));
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://127.0.0.1:8931';

const r = await (async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.locator('.sent').first().waitFor({ timeout: 30000 });
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); TASK.enterTaskMode(); });
  await page.waitForTimeout(600);

  /* 装表：--task-bar-h 每写一次记一个时间戳；同时逐帧记底栏高度 */
  await page.evaluate(() => {
    window.__probe = { varWrites: [], heights: [], raf: 0 };
    /* documentElement 的 style 上不止这一个变量（还有 --task-card-b 等），
       只数"属性变了"会虚高。所以记的是【这个变量自己的值】有没有真的变。 */
    let lastVal = getComputedStyle(document.documentElement).getPropertyValue('--task-bar-h').trim();
    new MutationObserver(() => {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--task-bar-h').trim();
      if (v !== lastVal) { lastVal = v; window.__probe.varWrites.push(Math.round(performance.now())); }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    (function tick() {
      const bar = document.getElementById('taskBar');
      if (bar) {
        window.__probe.heights.push(Math.round(bar.getBoundingClientRect().height * 10) / 10);
        window.__probe.raf++;
      }
      requestAnimationFrame(tick);
    })();
  });

  /* A. 完全静默 6 秒：不点、不滚、不翻页。自激会在这段时间里持续写 */
  const t0 = await page.evaluate(() => { window.__probe.varWrites.length = 0; window.__probe.raf = 0; return performance.now(); });
  await page.waitForTimeout(6000);
  const idle = await page.evaluate((start) => ({
    writes: window.__probe.varWrites.length,
    frames: window.__probe.raf,
    secs: +((performance.now() - start) / 1000).toFixed(1),
  }), t0);

  /* B. 翻 10 句：每句写几次算正常（条子高度会随文案换行变一次） */
  await page.evaluate(() => { window.__probe.varWrites.length = 0; });
  for (let i = 0; i < 10; i++) { await page.evaluate(() => TASK.next()); await page.waitForTimeout(120); }
  const active = await page.evaluate(() => ({
    writes: window.__probe.varWrites.length,
    distinctHeights: [...new Set(window.__probe.heights)].sort((a, b) => a - b),
  }));

  /* C. 高度来回跳？相邻两帧之差来回改号 = 抖。只数"改号次数"，不数变化次数 */
  const flip = await page.evaluate(() => {
    const h = window.__probe.heights; let last = 0, flips = 0, maxDelta = 0;
    for (let i = 1; i < h.length; i++) {
      const d = h[i] - h[i - 1];
      if (Math.abs(d) < 0.05) continue;
      const sign = d > 0 ? 1 : -1;
      if (last !== 0 && sign !== last) flips++;
      last = sign; maxDelta = Math.max(maxDelta, Math.abs(d));
    }
    return { samples: h.length, flips, maxDelta };
  });

  await browser.close();
  return { idle, active, flip };
})();

console.log(JSON.stringify(r, null, 2));
const bad = [];
if (r.idle.writes > 2) bad.push(`静默 ${r.idle.secs}s 里 --task-bar-h 被写了 ${r.idle.writes} 次（只有 15 秒自走表那一次可以算正常）→ 自激`);
if (r.flip.flips > 3) bad.push(`底栏高度方向来回改号 ${r.flip.flips} 次、单帧最大 ${r.flip.maxDelta}px → 抖动`);
if (r.active.writes > 40) bad.push(`翻 10 句写了 ${r.active.writes} 次 --task-bar-h（每句 >4 次）→ 一次翻句触发了多轮重排`);
console.log(bad.length ? '\n结论：' + bad.join('\n结论：') : '\n结论：没抓到自激 —— 26.4 分钟不是底栏循环造成的');
process.exit(bad.length ? 1 : 0);
