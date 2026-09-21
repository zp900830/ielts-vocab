// 顶栏收纳压测台（计划 §1 第 1 步）
// 同一条判定并行跑 N 次，记录「每次量宽看到了什么、结论是什么、挂上后有没有被摘掉」，
// 用分布区分两种病因：测量口径（该判放不下却判了放得下）vs 测量时机（结论对但被后一帧推翻）。
//
// 用法：
//   node work/nav_probe.mjs                     # 默认 3 场景 × 24 次
//   node work/nav_probe.mjs --runs=32 --concurrency=8
//   node work/nav_probe.mjs --only=long-top
import { createRequire } from 'module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';

const require = createRequire(import.meta.url);
const PW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'playwright-tests', 'node_modules');
const { chromium } = (() => {
  try { return require(path.join(PW, '@playwright/test')); }
  catch (e) { return require(path.join(PW, 'playwright-core')); }
})();

const argv = Object.fromEntries(process.argv.slice(2).map(s => {
  const m = s.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [s, true];
}));
const BASE = process.env.E2E_BASE_URL || 'http://127.0.0.1:8931';
const RUNS = Number(argv.runs || 24);
const CONC = Number(argv.concurrency || 8);
const ONLY = argv.only ? String(argv.only).split(',') : null;

const SHORT = 'Daniel';
const LONG = 'Guy · 美式男声 ★★★ Neuron Online (en-US) Microsoft Azure Speech —— '.repeat(4);

// 每个场景：怎么进页面 + 之后把标签换成什么 + 期望顶栏收不收纳
const SCENARIOS = [
  {
    id: 'long-top', width: 1280, labels: LONG, wantCollapse: true,
    desc: '宽屏 1280，顶部进入，标签被撑长 → 必须收进汉堡且不翻烙饼',
    async enter(page) { /* goto 后什么都不做，就是「开页在顶部」 */ }
  },
  {
    id: 'long-mid-entry', width: 1280, labels: LONG, wantCollapse: true,
    desc: '老用户入口：开页直接落在正文中段（reload 让浏览器恢复滚动位），标签本来就长',
    async enter(page) {
      await page.evaluate(() => window.scrollTo(0, 800));
      await page.waitForTimeout(250);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('.sent').first().waitFor({ state: 'visible' });
      await page.waitForTimeout(250);
    }
  },
  {
    id: 'long-idle', width: 1280, labels: LONG, wantCollapse: true,
    desc: '假设检验：静置过 IDLE_TIMEOUT(5s) 让 body.fade-nav 挂上，再换长标签 → 还收不收',
    async enter(page) {
      await page.waitForTimeout(5600);
      const faded = await page.evaluate(() => document.body.classList.contains('fade-nav'));
      if (!faded) throw new Error('fade-nav 没挂上，假设前提不成立');
    }
  },
  {
    id: 'long-rebuild', width: 1280, labels: LONG, wantCollapse: true,
    desc: '机制检验：长标签收进汉堡后，让应用自己重建 #voiceSel（loadVoices 的三条异步路径都一样）',
    async enter(page) { /* 顶部进入 */ },
    async post(page) { await page.evaluate(() => window.loadVoices && window.loadVoices()); }
  },
  {
    id: 'short-top', width: 1440, labels: SHORT, wantCollapse: false,
    desc: '反向：1440 + 短标签，本来就放得下 → 不许误收',
    async enter(page) { /* 顶部进入 */ }
  }
];

// 装探针：包一层 window.navRowWraps（全局函数声明，syncNavMode 走全局查找 → 补丁生效）
const HOOK = () => {
  const w = window;
  w.__probe = { calls: [], flips: [] };
  const snap = () => {
    const bar = document.querySelector('.topbar');
    const cs = bar ? getComputedStyle(bar) : null;
    const kids = bar ? [].filter.call(bar.children, el => el.offsetParent !== null) : [];
    const contentH = bar ? bar.clientHeight - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0) : 0;
    const tallest = kids.length ? Math.max.apply(null, kids.map(el => el.offsetHeight)) : 0;
    return {
      t: Math.round(performance.now()),
      innerW: window.innerWidth, scrollY: Math.round(window.scrollY),
      cls: document.body.className || '(none)',
      cw: bar ? bar.clientWidth : -1, sw: bar ? bar.scrollWidth : -1,
      docSW: document.documentElement.scrollWidth,
      contentH: Math.round(contentH), tallest: Math.round(tallest),
      measuring: document.body.classList.contains('nav-measure')
    };
  };
  const orig = w.navRowWraps;
  if (typeof orig === 'function') {
    w.navRowWraps = function () {
      const before = snap();
      const r = orig.apply(this, arguments);
      w.__probe.calls.push(Object.assign(before, { want: !!r }));
      return r;
    };
  }
  new MutationObserver(() => {
    w.__probe.flips.push({ t: Math.round(performance.now()), navMenu: document.body.classList.contains('nav-menu') });
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
};

const FINAL = () => ({
  navMenu: document.body.classList.contains('nav-menu'),
  burgerShown: getComputedStyle(document.getElementById('btnMenu')).display !== 'none',
  inPanel: !!document.querySelector('.topbar-right .app-link'),
  barH: Math.round(document.querySelector('.topbar').getBoundingClientRect().height),
  scrollY: Math.round(window.scrollY),
  fonts: document.fonts ? document.fonts.status : 'n/a',
  calls: window.__probe ? window.__probe.calls : null,
  flips: window.__probe ? window.__probe.flips : null,
  hooked: !!(window.__probe && window.__probe.calls.length)
});

async function oneRun(scen) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: scen.width, height: 900 } });
  let res;
  try {
    await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.locator('.sent').first().waitFor({ state: 'visible' });
    await page.setViewportSize({ width: scen.width, height: 900 });
    await scen.enter(page);
    await page.evaluate(HOOK);
    await page.evaluate((v) => {
      document.getElementById('voiceSel').innerHTML = `<option>${v}</option>`;
      document.getElementById('btnCloud').innerHTML =
        '<i class="ri-cloud-line"></i> ' + (v.length > 20 ? '1013711120 已登录，点击可退出' : '未登录');
    }, scen.labels);
    await page.waitForTimeout(1200);
    if (scen.post) { await scen.post(page); await page.waitForTimeout(1200); }
    // 再逼一轮：确认结论稳定，不是一帧的运气
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await page.waitForTimeout(800);
    res = await page.evaluate(FINAL);
  } catch (e) {
    res = { error: String(e).slice(0, 160), calls: [], flips: [] };
  }
  await browser.close();
  return res;
}

async function pool(taskFns, conc) {
  const out = new Array(taskFns.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(conc, taskFns.length) }, async () => {
    while (i < taskFns.length) { const k = i++; out[k] = await taskFns[k](); }
  }));
  return out;
}

const pct = (n, d) => (d ? (100 * n / d).toFixed(0) + '%' : 'n/a');

/* --sweep：找「真实内容下顶栏的收纳 breakpoints」。新用例要挑两个宽度：一个铁定放得下、
   一个铁定放不下，且不能被音色名/章节名的长短影响 —— 所以按最短/最长两种标签各量一遍，
   取两者都成立的区间。这里不注入探针、不改 DOM 结构，只用应用自己的 syncNavMode 判定。 */
async function sweep() {
  const browser = await chromium.launch();
  const rows = [];
  for (const [tag, voice, cloud] of [
    ['最短标签', 'Daniel', '未登录'],
    ['最长标签', LONG.slice(0, 200), '1013711120 已登录，点击可退出']
  ]) {
    for (const width of [740, 820, 900, 1000, 1120, 1280, 1440, 1600, 1760]) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded' });
      await page.locator('.sent').first().waitFor({ state: 'visible' });
      await page.evaluate(([v, c]) => {
        document.getElementById('voiceSel').innerHTML = `<option>${v}</option>`;
        document.getElementById('btnCloud').innerHTML = '<i class="ri-cloud-line"></i> ' + c;
      }, [voice, cloud]);
      await page.waitForTimeout(700);
      const r = await page.evaluate(() => {
        window.syncNavMode();
        return { collapsed: document.body.classList.contains('nav-menu') };
      });
      rows.push({ tag, width, collapsed: r.collapsed });
      await ctx.close();
    }
  }
  await browser.close();
  const fmt = tag => rows.filter(r => r.tag === tag).map(r => `${r.width}:${r.collapsed ? '收' : '放'}`).join('  ');
  console.log('（收=判定放不下而收进汉堡，放=保持一行铺开）');
  console.log('  ' + fmt('最短标签') + '   ← 最短标签');
  console.log('  ' + fmt('最长标签') + '   ← 最长标签');
  const safeWide = [740, 820, 900, 1000, 1120, 1280, 1440, 1600, 1760]
    .filter(w => rows.every(r => !(r.width === w && r.collapsed)));
  const safeNarrow = [740, 820, 900, 1000, 1120, 1280, 1440, 1600, 1760]
    .filter(w => rows.every(r => !(r.width === w && !r.collapsed)));
  console.log(`  两种标签下都「放得下」的宽度：${safeWide.join(', ') || '（无）'}`);
  console.log(`  两种标签下都「放不下」的宽度：${safeNarrow.join(', ') || '（无）'}`);
}

async function main() {
  if (argv.sweep) return sweep();

  const scenarios = ONLY ? SCENARIOS.filter(s => ONLY.includes(s.id)) : SCENARIOS;
  console.log(`压测台 · ${BASE} · 每场景 ${RUNS} 次 · 并发 ${CONC}\n`);
  for (const scen of scenarios) {
    const fns = Array.from({ length: RUNS }, () => () => oneRun(scen));
    const t0 = Date.now();
    const runs = await pool(fns, CONC);
    const okHook = runs.filter(r => r.hooked).length;
    const decisions = runs.flatMap(r => r.calls || []);
    const fits = decisions.filter(d => !d.want).length;
    const noWrapSeen = decisions.filter(d => d.contentH <= d.tallest + 2).length;
    const horizSeen = decisions.filter(d => d.sw > d.cw + 1 || d.docSW > d.innerW + 1).length;
    let flippers = 0, neverCollapsed = 0, pass = 0;
    for (const r of runs) {
      const seq = (r.flips || []).map(f => f.navMenu ? 1 : 0);
      const got = seq.includes(1);
      const lost = got && !r.navMenu;
      if (lost) flippers++;
      if (!got && r.wantCollapse !== false) neverCollapsed++;
      const good = scen.wantCollapse ? (r.navMenu && r.burgerShown && r.inPanel && r.barH < 64)
        : (!r.navMenu && !r.burgerShown);
      if (good) pass++;
    }
    console.log(`【${scen.id}】${scen.desc}`);
    console.log(`  通过 ${pass}/${RUNS} (${pct(pass, RUNS)})   探针命中 ${okHook}/${RUNS}`);
    console.log(`  量宽共 ${decisions.length} 次：判「放不下」${pct(decisions.length - fits, decisions.length)} / 判「放得下」${pct(fits, decisions.length)}`);
    console.log(`    其中「从未折行」${pct(noWrapSeen, decisions.length)}、「存在横向溢出」${pct(horizSeen, decisions.length)}`);
    const y60 = decisions.filter(d => d.scrollY > 60).length;
    const scCls = decisions.filter(d => /(^|\s)scrolled(\s|$)/.test(d.cls)).length;
    const ys = runs.map(r => r.scrollY || 0).sort((a, b) => a - b);
    console.log(`  决策时 scrollY>60 占 ${pct(y60, decisions.length)} · class 里带 scrolled 占 ${pct(scCls, decisions.length)}`);
    console.log(`  收尾 scrollY：min ${ys[0]} 中位 ${ys[Math.floor(ys.length / 2)]} max ${ys[ys.length - 1]}`);
    console.log(`  先挂上又摘掉（翻烙饼）${flippers} 次 · 全程没挂上过 ${neverCollapsed} 次`);
    const bad = runs.map((r, i) => ({ r, i })).filter(x => !(scen.wantCollapse
      ? (x.r.navMenu && x.r.burgerShown && x.r.inPanel && x.r.barH < 64)
      : (!x.r.navMenu && !x.r.burgerShown)));
    bad.slice(0, 3).forEach(({ r, i }) => {
      console.log(`  ↳ 失败样本 #${i}: navMenu=${r.navMenu} burger=${r.burgerShown} inPanel=${r.inPanel} barH=${r.barH} scrollY=${r.scrollY} fonts=${r.fonts}`);
      (r.calls || []).slice(-6).forEach(c => console.log(`      t=${c.t} y=${c.scrollY} cw=${c.cw} sw=${c.sw} docSW=${c.docSW} contentH=${c.contentH} tallest=${c.tallest} want=${c.want} cls="${c.cls}"`));
      (r.flips || []).slice(-6).forEach(f => console.log(`      flip t=${f.t} navMenu=${f.navMenu}`));
    });
    console.log(`  (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
