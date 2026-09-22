/* Round H：#syncHint（常驻同步药丸）压住底栏弹层末项 —— 先把"到底压没压"量出来。
   上一轮的账（shadow/index.html .sync-hint 注释）说根因是 CSS 里那个 `+ 62px`，
   但那条只在 JS 没接管 bottom 时才成立：真实路径 setSyncHint() 会调 placeSyncHint()
   用 getBoundingClientRect 现量底栏顶边。两种落点都要量，别把 fallback 当成现状。
   所以这里跑三组：
     A 真路径 —— 上传被拒 → 药丸由 app 自己显形（不碰 hidden 属性）
     B 假路径 —— 直接 hidden=false（测 CSS fallback，也就是注释里那 671px 的出处）
     C 顺序反过来 —— 先让药丸显形，再开弹层（用户实际就是这么点的）
   用法：python3 -m http.server 8975 --bind 127.0.0.1 --directory shadow
        node work/round_h_probe.mjs
   只出数、不改代码。阈值等数出来再定。 */
import { createRequire } from 'module';
const require = createRequire(new URL('../playwright-tests/package.json', import.meta.url));
const { chromium } = require('playwright');

const URL_BASE = process.env.PROBE_URL || 'http://127.0.0.1:8975';
const VPS = [{ w: 390, h: 844, n: '手机 390' }, { w: 1280, h: 900, n: '桌面 1280' }];
const POPUPS = [
  { name: '循环次数', trigger: '#btnLoop', menu: '#loopWrap .loop-menu' },
  { name: '倍速', trigger: '#rateCycle', menu: '#rateWrap .rate-menu' },
  { name: 'A-B 选段', trigger: '#btnAB', menu: '#abWrap .ab-menu' },
  { name: '书签', trigger: '#markBtn', menu: '#markWrap .ab-menu' },
];

/* 与 task-events.spec.ts 同一份假 supabase：让"上传被拒"这条真走到 setSyncHint */
const STUB = `
window.__supaReject = true;
var rows = function () { return []; };
window.__supaRows = [];
window.supabase = {
  createClient: function () {
    return {
      auth: {
        getSession: function () { return Promise.resolve({ data: { session: { user: { id: 'u-test', email: 'stub@local' } } } }); },
        onAuthStateChange: function () { return { data: { subscription: { unsubscribe: function () {} } } }; }
      },
      from: function () {
        var q = {};
        q.upsert = function () { return Promise.resolve({ error: { message: 'rls denied' } }); };
        q.select = function () { return q; };
        q.eq = function () { return q; };
        q.order = function () { return q; };
        q.range = function () { return Promise.resolve({ data: rows(), error: null }); };
        return q;
      }
    };
  }
};`;

const geo = (page) => page.evaluate(() => {
  const el = document.getElementById('syncHint');
  const bar = document.getElementById('taskBar');
  const ab = document.querySelector('.audiobar');
  const r = (n) => { if (!n) return null; const b = n.getBoundingClientRect();
    return { top: +b.top.toFixed(1), bottom: +b.bottom.toFixed(1), h: +b.height.toFixed(1) }; };
  const cs = getComputedStyle(el);
  return { hidden: el.hidden, text: (el.textContent || '').slice(0, 24),
    inlineBottom: el.style.bottom || '(无)', cssBottom: cs.bottom, zIndex: cs.zIndex,
    parentChain: (function (n) { const out = []; while (n && out.length < 5) {
      out.push(n.id ? '#' + n.id : (n.className ? '.' + String(n.className).split(' ')[0] : n.tagName)); n = n.parentElement; } return out.join(' < '); })(el),
    hint: r(el), taskBar: r(bar), taskBarH: getComputedStyle(document.body).getPropertyValue('--task-bar-h').trim(),
    abDisplay: ab ? getComputedStyle(ab).display : 'none', ab: r(ab),
    vh: document.documentElement.clientHeight, vw: document.documentElement.clientWidth };
});

const probePopup = async (page, p) => {
  await page.locator(p.trigger).click();
  await page.waitForSelector(p.menu, { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(320);
  const m = await page.evaluate((sel) => {
    const menu = document.querySelector(sel);
    const hint = document.getElementById('syncHint');
    const items = [...menu.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().height > 0);
    const last = items[items.length - 1];
    const mr = menu.getBoundingClientRect(), hr = hint.getBoundingClientRect(), lr = last.getBoundingClientRect();
    const c = document.elementFromPoint(lr.left + lr.width / 2, lr.top + lr.height / 2);
    const who = c ? (c.id ? '#' + c.id : c.className ? '.' + String(c.className).split(' ')[0] : c.tagName) : '(null)';
    const covered = !!(c && !(c === last || last.contains(c) || (c.parentElement && last.contains(c.parentElement))));
    /* 药丸在末项上方还是下方：正 = 让开了，负 = 压上去 */
    return { label: (last.textContent || '').trim().slice(0, 8), items: items.length,
      menuTop: +mr.top.toFixed(1), menuBottom: +mr.bottom.toFixed(1),
      lastTop: +lr.top.toFixed(1), lastBottom: +lr.bottom.toFixed(1),
      hintTop: +hr.top.toFixed(1), hintBottom: +hr.bottom.toFixed(1),
      gap: +(lr.top - hr.bottom).toFixed(1), covered, hit: who };
  }, p.menu);
  let clicked = 'ok';
  try {
    await page.locator(`${p.menu} button`).last().click({ timeout: 3000 });
  } catch (e) {
    clicked = 'FAIL: ' + String(e.message).split('\n').slice(0, 3).join(' | ');
  }
  await page.waitForTimeout(200);
  return { ...m, clicked };
};

const browser = await chromium.launch();
for (const vp of VPS) {
  for (const mode of ['任务模式', '常规模式']) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    const page = await ctx.newPage();
    page.setDefaultNavigationTimeout(30000);
    await page.route('**/supabase-js@2*', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: STUB }));
    try {
      await page.goto(`${URL_BASE}/index.html`, { waitUntil: 'commit' });
      await page.waitForFunction(() => document.querySelectorAll('.sent').length > 5, null, { timeout: 30000 });
    } catch (e) {
      console.log(`⚠️ ${vp.n} 打不开（${e.message.split('\n')[0]}）`);
      await ctx.close(); continue;
    }
    await page.waitForTimeout(1000);
    if (mode === '任务模式') {
      await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); TASK.enterTaskMode(); });
      await page.waitForTimeout(900);
    }
    try { await page.evaluate(() => { addMark(); }); } catch (e) {}

    console.log(`\n════ ${vp.n} · ${mode} ════`);

    /* --- B 假路径：只把 hidden 摘掉，不跑 placeSyncHint，量 CSS 那条 calc 落在哪 --- */
    await page.evaluate(async () => {
      const el = document.getElementById('syncHint');
      el.textContent = '连不上云端 · 进度先记在本机'; el.hidden = false;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
    const bGeo = await geo(page);
    console.log(`[B 假路径 hidden=false] 药丸 ${JSON.stringify(bGeo.hint)} bottom=${bGeo.cssBottom} 内联=${bGeo.inlineBottom}`);
    const bPopups = [];
    for (const p of POPUPS) bPopups.push({ name: p.name, ...(await probePopup(page, p)) });
    console.table(bPopups.map((x) => ({ 弹层: x.name, 末项: x.label, 末项上沿: x.lastTop, 药丸下沿: x.hintBottom, 间隙: x.gap, 被压: x.covered, 命中: x.hit, 真点: x.clicked.startsWith('ok') ? '✓' : '✗' })));
    await page.evaluate(() => { const el = document.getElementById('syncHint'); el.hidden = true; el.style.bottom = ''; });
    for (const p of POPUPS) { try { await page.locator(p.trigger).click({ timeout: 1500 }); } catch (e) {} }
    await page.waitForTimeout(200);

    /* --- A/C 真路径：让 app 自己显形，然后开弹层（C 就是"先有药丸再开弹层"） --- */
    const shown = await page.evaluate(async () => {
      window.__supaReject = true;
      try { TASK.initPlan(10); } catch (e) {}
      try { TASK.todayPlan(true).queue.slice(0, 2).forEach((x) => TASK.readDone(x.i)); } catch (e) {}
      const r = await TASK.cloudPush();
      await new Promise((k) => setTimeout(k, 300));
      const el = document.getElementById('syncHint');
      return { err: r && r.error ? String(r.error).slice(0, 30) : null, visible: !el.hidden };
    });
    await page.waitForTimeout(400);
    const aGeo = await geo(page);
    console.log(`[A 真路径 cloudPush 被拒] error=${shown.err} 显形=${shown.visible} text="${aGeo.text}" 药丸=${JSON.stringify(aGeo.hint)} bottom=${aGeo.cssBottom} 内联=${aGeo.inlineBottom}`);
    console.log(`    底栏 top=${aGeo.taskBar && aGeo.taskBar.top} --task-bar-h=${aGeo.taskBarH} 播放条 display=${aGeo.abDisplay} 链路=${aGeo.parentChain} z=${aGeo.zIndex}`);
    const aPopups = [];
    for (const p of POPUPS) aPopups.push({ name: p.name, ...(await probePopup(page, p)) });
    console.table(aPopups.map((x) => ({ 弹层: x.name, 末项: x.label, 末项上沿: x.lastTop, 药丸下沿: x.hintBottom, 间隙: x.gap, 被压: x.covered, 命中: x.hit, 真点: x.clicked.startsWith('ok') ? '✓' : '✗' })));
    for (const x of aPopups) if (!x.clicked.startsWith('ok')) console.log(`      ↳ ${x.name}: ${x.clicked}`);

    await ctx.close();
  }
}
await browser.close();
