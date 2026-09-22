/* Round G-2 补量：上一支探针只在 1280 一档跑，验收标准里「390 与 1280 两档」和
   「拖动预览气泡不伸出视口」两条等于没量。这一支专门把这两条量出来。
   用法：python3 -m http.server 8971 --bind 127.0.0.1 --directory shadow
        node work/round_g2_probe.mjs
   先出数、再定阈值 —— 阈值没有实测撑着就是拍脑袋。 */
import { createRequire } from 'module';
const require = createRequire(new URL('../playwright-tests/package.json', import.meta.url));
const { chromium } = require('playwright');

const URL_BASE = process.env.PROBE_URL || 'http://127.0.0.1:8971';
const VPS = [{ w: 390, h: 844, n: '手机 390' }, { w: 1280, h: 900, n: '桌面 1280' }];

const browser = await chromium.launch();
for (const vp of VPS) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const page = await ctx.newPage();
  page.setDefaultNavigationTimeout(30000);
  try {
    await page.goto(`${URL_BASE}/index.html`, { waitUntil: 'commit' });
    await page.waitForFunction(() => document.querySelectorAll('.sent').length > 5, null, { timeout: 30000 });
  } catch (e) {
    console.log(`⚠️ ${vp.n} 页面打不开（${e.message.split('\n')[0]}）—— 这一档没量到`);
    await ctx.close(); continue;
  }
  await page.waitForTimeout(1200);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); TASK.enterTaskMode(); });
  await page.waitForTimeout(900);

  const geo = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const el = document.getElementById('tbSeek');
    const r = el.getBoundingClientRect();
    const bar = document.getElementById('taskBar').getBoundingClientRect();
    const title = document.querySelector('.tb-title').getBoundingClientRect();
    const line1 = document.querySelector('.tb-line1').getBoundingClientRect();
    const knob = document.getElementById('tbKnob').getBoundingClientRect();
    /* 热区不靠读 CSS 猜：在条子上下各挪 N 像素，用 elementFromPoint 问浏览器"这一点归谁"。 */
    const hitAt = (dy) => { const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2 + dy);
      return !!(t && (t === el || el.contains(t) || el.contains(t.parentElement))); };
    let up = 0, down = 0;
    for (let d = 1; d <= 30; d++) { if (hitAt(-d)) up = d; else break; }
    for (let d = 1; d <= 30; d++) { if (hitAt(d)) down = d; else break; }
    return { vw, width: +r.width.toFixed(1), rowH: +r.height.toFixed(1),
      hitUp: up, hitDown: down, hitTotal: up + down + 1,
      barH: +bar.height.toFixed(1), barRight: +bar.right.toFixed(1), barLeft: +bar.left.toFixed(1),
      titleH: +title.height.toFixed(1), line1H: +line1.height.toFixed(1),
      knobTop: +knob.top.toFixed(1), knobBottom: +knob.bottom.toFixed(1),
      knobInBar: knob.top >= bar.top - 0.5 && knob.bottom <= bar.bottom + 0.5,
      pageScrollW: document.documentElement.scrollWidth,
      n: (TASK.queue || []).length, state: document.getElementById('taskBar').dataset.state };
  });
  console.log(`\n===== ${vp.n}（视口宽 ${geo.vw}）=====`);
  console.log(`  底栏高 ${geo.barH}px · .tb-line1 高 ${geo.line1H}px · 标题行高 ${geo.titleH}px`);
  console.log(`  #tbSeek ${geo.width}×${geo.rowH}px，热区实测 上 ${geo.hitUp} + 本体 ${geo.rowH} + 下 ${geo.hitDown} = ${geo.hitTotal}px`);
  console.log(`  把手在底栏框内=${geo.knobInBar}（${geo.knobTop}→${geo.knobBottom}），底栏 ${geo.barLeft}→${geo.barRight} / ${geo.vw}`);
  console.log(`  横向无溢出=${geo.pageScrollW <= geo.vw}（scrollWidth ${geo.pageScrollW}），队列 ${geo.n} 句，state=${geo.state}`);

  /* 拖动中途量气泡：松手就没了，必须在 pointermove 之后、up 之前抓。
     左右各扫一遍，取最坏的一边 —— 只在中间拖一次量不出边界。 */
  const box = await page.evaluate(() => { const r = document.getElementById('tbSeek').getBoundingClientRect();
    return { x: r.x, y: r.y + r.height / 2, w: r.width }; });
  const tips = [];
  for (const f of [0.02, 0.2, 0.5, 0.8, 0.98]) {
    await page.mouse.move(box.x + box.w * 0.5, box.y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.w * f, box.y, { steps: 6 });
    await page.waitForTimeout(160);
    const t = await page.evaluate(() => { const tip = document.getElementById('tbTip');
      const cs = getComputedStyle(tip); const r = tip.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      return { shown: cs.display !== 'none', left: +r.left.toFixed(1), right: +r.right.toFixed(1),
        top: +r.top.toFixed(1), vw, overflowL: +Math.max(0, -r.left).toFixed(1),
        overflowR: +Math.max(0, r.right - vw).toFixed(1),
        overflowTop: +Math.max(0, -r.top).toFixed(1), text: (tip.textContent || '').trim().slice(0, 14) }; });
    tips.push({ f, ...t });
    await page.mouse.up();
    await page.waitForTimeout(220);
  }
  console.log('  拖动预览气泡（按位置 2%/20%/50%/80%/98% 各抓一次）：');
  let tipBad = 0;
  tips.forEach((t) => { const ok = t.shown && t.overflowL < 0.5 && t.overflowR < 0.5 && t.overflowTop < 0.5;
    if (!ok) tipBad++;
    console.log(`    ${ok ? '✓' : '✗'} ${Math.round(t.f * 100)}%：${t.left}→${t.right} / ${t.vw}`
      + `，顶 ${t.top}｜左溢 ${t.overflowL} 右溢 ${t.overflowR} 上溢 ${t.overflowTop}｜「${t.text}」`
      + (t.shown ? '' : '（没显示）')); });
  const barAfter = await page.evaluate(() => ({ barH: +document.getElementById('taskBar').getBoundingClientRect().height.toFixed(1),
    state: document.getElementById('taskBar').dataset.state }));
  console.log(`  五次拖动后底栏高 ${barAfter.barH}px（起量 ${geo.barH}px，差 ${(barAfter.barH - geo.barH).toFixed(1)}）`);
  console.log(`  气泡越界档 ${tipBad}/5`);
  await ctx.close();
}
await browser.close();
