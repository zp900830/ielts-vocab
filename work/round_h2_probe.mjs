/* Round H-2：上一支探针翻出了两条旧账 ——
   ① 药丸的父级其实是 <body>（body 的 class 会随状态变成 nav-menu / task-mode / ab-picking，
      上一轮把 body 的类名当成了"某个 .nav-menu 容器"，于是得出"改 z-index 没用"）；
   ② 真路径下压住弹层末项的不是 CSS 里那 62px（JS 已经用现量的 bottom 覆盖了它），
      是药丸和弹层抢同一条带：底栏顶边上方那 8px 起，两边都要用。
   这一支只测三件事，为改法选路线：
     A 把 z-index 从 595 降到栏以下（50），末项还点得到吗？
     B 弹层开着时把药丸摘掉（display:none），末项点得到吗？
     C 现状（595）药丸有没有连底栏自己的按钮也压住（"下一句"那颗）？
   用法：python3 -m http.server 8975 --bind 127.0.0.1 --directory shadow
        node work/round_h2_probe.mjs                                            */
import { createRequire } from 'module';
const require = createRequire(new URL('../playwright-tests/package.json', import.meta.url));
const { chromium } = require('playwright');

const URL_BASE = process.env.PROBE_URL || 'http://127.0.0.1:8975';
const VPS = [{ w: 390, h: 844, n: '手机 390' }, { w: 1280, h: 900, n: '桌面 1280' }];
const POPUPS = [
  { name: '循环次数', trigger: '#btnLoop', menu: '#loopWrap .loop-menu' },
  { name: '倍速', trigger: '#rateCycle', menu: '#rateWrap .rate-menu' },
];

const STUB = `
window.__supaReject = true;
window.__supaRows = [];
window.supabase = { createClient: function () { return {
  auth: { getSession: function () { return Promise.resolve({ data: { session: { user: { id: 'u', email: 's@l' } } } }); },
          onAuthStateChange: function () { return { data: { subscription: { unsubscribe: function () {} } } }; } },
  from: function () { var q = {}; q.upsert = function () { return Promise.resolve({ error: { message: 'rls denied' } }); };
    q.select = function () { return q; }; q.eq = function () { return q; }; q.order = function () { return q; };
    q.range = function () { return Promise.resolve({ data: [], error: null }); }; return q; } }; } };`;

/* 弹层末项中心归谁 —— 每次都重新开一次弹层，不复用上一次的残留 */
const lastItemHit = (page, sel) => page.evaluate((s) => {
  const menu = document.querySelector(s);
  if (!menu) return { err: 'menu 不在 DOM' };
  const items = [...menu.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().height > 0);
  const last = items[items.length - 1];
  if (!last) return { err: '没有可见项' };
  const lr = last.getBoundingClientRect();
  const c = document.elementFromPoint(lr.left + lr.width / 2, lr.top + lr.height / 2);
  const hint = document.getElementById('syncHint').getBoundingClientRect();
  return { lastTop: +lr.top.toFixed(1), hintBottom: +hint.bottom.toFixed(1), gap: +(lr.top - hint.bottom).toFixed(1),
    hit: c ? (c.id ? '#' + c.id : String(c.className).split(' ')[0]) : '(null)',
    occluded: !!(c && !(c === last || last.contains(c) || (c.parentElement && last.contains(c.parentElement)))) };
}, sel);

const openPopup = async (page, p) => {
  await page.locator(p.trigger).click();
  await page.waitForSelector(p.menu, { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(320);
};
const closePopup = async (page, p) => {
  try { await page.locator(p.trigger).click({ timeout: 1500 }); } catch (e) {}
  await page.mouse.move(5, 5);
  await page.waitForTimeout(260);
};

const browser = await chromium.launch();
for (const vp of VPS) {
  for (const mode of ['任务模式', '常规模式']) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    const page = await ctx.newPage();
    page.setDefaultNavigationTimeout(30000);
    await page.route('**/supabase-js@2*', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: STUB }));
    await page.goto(`${URL_BASE}/index.html`, { waitUntil: 'commit' });
    await page.waitForFunction(() => document.querySelectorAll('.sent').length > 5, null, { timeout: 30000 });
    await page.waitForTimeout(1000);
    if (mode === '任务模式') {
      await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); TASK.enterTaskMode(); });
      await page.waitForTimeout(900);
    }
    await page.evaluate(async () => {
      window.__supaReject = true; TASK.initPlan(10);
      TASK.todayPlan(true).queue.slice(0, 2).forEach((x) => TASK.readDone(x.i));
      await TASK.cloudPush();
    });
    await page.waitForTimeout(500);
    const pillVisible = await page.evaluate(() => { const e = document.getElementById('syncHint'); return !e.hidden; });
    console.log(`\n════ ${vp.n} · ${mode} ════ 药丸显形=${pillVisible}`);
    if (!pillVisible) { await ctx.close(); continue; }

    /* C：现状下底栏自己的按钮有没有被药丸压住 */
    const barBtn = mode === '任务模式' ? '#btnNext' : '#btnPlay';
    const onBar = await page.evaluate((sel) => {
      const b = document.querySelector(sel); if (!b) return { err: 'no ' + sel };
      const r = b.getBoundingClientRect();
      const c = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { hit: c ? (c.id ? '#' + c.id : String(c.className).split(' ')[0]) : '(null)', over: !!(c && c !== b && !b.contains(c) && !(c.parentElement && b.contains(c.parentElement))) };
    }, barBtn);
    console.log(`[C 现状·药丸压不压 ${barBtn}] ${JSON.stringify(onBar)}`);

    for (const p of POPUPS) {
      await openPopup(page, p);
      const a = await lastItemHit(page, p.menu);
      await closePopup(page, p);
      await openPopup(page, p);
      await page.evaluate(() => { document.getElementById('syncHint').style.zIndex = '50'; });
      const b = await lastItemHit(page, p.menu);
      await page.evaluate(() => { document.getElementById('syncHint').style.zIndex = ''; });
      await closePopup(page, p);
      await openPopup(page, p);
      await page.evaluate(() => { document.getElementById('syncHint').style.display = 'none'; });
      const c = await lastItemHit(page, p.menu);
      await page.evaluate(() => { document.getElementById('syncHint').style.display = ''; });
      await closePopup(page, p);
      console.log(`[${p.name}] 现状 595 → ${JSON.stringify(a)}`);
      console.log(`${' '.repeat(p.name.length + 7)}z=50   → ${JSON.stringify(b)}`);
      console.log(`${' '.repeat(p.name.length + 7)}摘掉   → ${JSON.stringify(c)}`);
    }
    await ctx.close();
  }
}
await browser.close();
