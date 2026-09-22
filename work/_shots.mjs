import { createRequire } from 'module';
const require = createRequire(new URL('../playwright-tests/package.json', import.meta.url));
const { chromium } = require('playwright');
const B = 'http://127.0.0.1:8971';
const br = await chromium.launch();
for (const vp of [{ width: 1280, height: 900, tag: 'desk' }, { width: 390, height: 844, tag: 'mob' }]) {
  const ctx = await br.newContext({ viewport: vp });
  const p = await ctx.newPage();
  await p.goto(B + '/index.html'); await p.waitForSelector('.sent'); await p.waitForTimeout(1200);
  await p.screenshot({ path: `work/shots/${vp.tag}-1-常规播放条.png` });
  await p.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); TASK.enterTaskMode(); });
  await p.waitForTimeout(800);
  await p.screenshot({ path: `work/shots/${vp.tag}-2-任务模式底栏.png` });
  await p.evaluate(() => { TASK.exitTaskMode(); TASK.openPanel(); });
  await p.waitForTimeout(900);
  await p.screenshot({ path: `work/shots/${vp.tag}-3-今日面板.png` });
  const info = await p.evaluate(() => {
    const r = (sel) => { const e = document.querySelector(sel); if (!e) return null;
      const b = e.getBoundingClientRect(); const cs = getComputedStyle(e);
      return { w: Math.round(b.width), h: Math.round(b.height), top: Math.round(b.top), disp: cs.display, vis: cs.visibility, op: cs.opacity }; };
    return { tpProg: r('.tp-prog'), tpFill: r('.tp-prog-fill'), week: r('.tp-week'), seek: r('#seekTrack'), tbProg: r('.tb-prog') };
  });
  console.log(vp.tag, JSON.stringify(info));
  await ctx.close();
}
await br.close();
