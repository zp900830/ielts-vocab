/* Round F 取证探针：① 绿底浅字全站对比度 ② 四类弹层是否溢出视口。
   用法：
     python3 -m http.server 8961 --bind 127.0.0.1        # 仓库根起一台，避开 8931/8932
     node work/round_f_probe.mjs                 # 量当前工作树
     node work/round_f_probe.mjs --base          # 量 __base_check*.html（git show HEAD 复原的副本）
   --base 这一档是【反向验证】：门禁必须先对旧数据响，才算闸门成立。
   越界 > 0 就非零退出；任何"没量到"都单独计数并打印，绝不当成合格。 */
import { createRequire } from 'module';
/* 仓库根没有 package.json，playwright 装在 playwright-tests/ 下 —— 从那里要，别在根上再装一份。 */
const require = createRequire(new URL('../playwright-tests/package.json', import.meta.url));
const { chromium } = require('playwright');

const arg = (name, dft) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : dft; };
const BASE_URL = arg('--url', 'http://127.0.0.1:8961');
const BASE = process.argv.includes('--base');
const PAGES = [
  { name: '主应用 index.html', url: BASE ? '/__base_check_root.html' : '/index.html', shadow: false },
  { name: '跟读 shadow', url: BASE ? '/shadow/__base_check_shadow.html' : '/shadow/index.html', shadow: true },
].map((p) => ({ ...p, vp: [{ w: 390, n: '手机 390' }, { w: 1280, n: '桌面 1280' }] }));

/* 在页面里跑：把「浅色字/图标 压在饱和绿底上」的站点全捞出来。
   判绿：背景合成分量里 G 最大且 G>110、G-R>25、G-B>25（#2bd4a4 / #10b487 / #0c9c74 都落在范围内）。
   渐变不能只取中间一档 —— 亮端 #2bd4a4 才是白字压不住的那一端。 */
const contrastSweep = (page) => page.evaluate(() => {
  const parse = (s) => { const m = /rgba?\(([^)]+)\)/.exec(s || ''); if (!m) return null;
    const p = m[1].split(',').map((x) => parseFloat(x));
    return [p[0] || 0, p[1] || 0, p[2] || 0, p.length > 3 ? p[3] : 1]; };
  const parseAll = (s) => { const out = []; const re = /rgba?\([^)]+\)/g; let m;
    while ((m = re.exec(s || ''))) { const c = parse(m[0]); if (c) out.push(c); } return out; };
  const over = (fg, bg) => [fg[0] * fg[3] + bg[0] * (1 - fg[3]), fg[1] * fg[3] + bg[1] * (1 - fg[3]),
    fg[2] * fg[3] + bg[2] * (1 - fg[3]), 1];
  const lum = (c) => { const a = c.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; };
  const ratio = (a, b) => +(((Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)).toFixed(2));
  const isGreen = (c) => c[1] > 110 && c[1] - c[0] > 25 && c[1] - c[2] > 25;
  const isLight = (c) => lum(c) > 0.55;
  /* 底色：从自身往上叠，遇到不透明层收口。半透明玻璃那几层必须叠回去，否则量到的是纸面白底。 */
  const bgStack = (el) => {
    const layers = []; let host = el, base = null;
    while (host) {
      const cs = getComputedStyle(host);
      const grads = parseAll(cs.backgroundImage);
      if (grads.length) layers.push(grads);
      const solid = parse(cs.backgroundColor);
      if (solid && solid[3] >= 0.999) { base = solid; break; }
      if (solid && solid[3] > 0) layers.push([solid]);
      host = host.parentElement;
    }
    const acc = base || [255, 255, 255, 1];
    const outs = [];
    /* 把每一层里的每个色标分别跟"其余层的合成结果"配一次 —— 亮端暗端都算到 */
    const flatten = (i, cur) => { if (i < 0) { outs.push(cur); return; } layers[i].forEach((s) => flatten(i - 1, over(s, cur))); };
    flatten(layers.length - 1, acc);
    return outs;
  };
  const out = [];
  document.querySelectorAll('*').forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    /* 渐变裁字（-webkit-text-fill-color:transparent + background-clip:text）是"字本身就是绿的"，
       拿 color 那一路白去比绿底会凭空报一条 1.41:1 —— 站点的顶栏标题就是这种写法。 */
    const fill = cs.webkitTextFillColor || cs['-webkit-text-fill-color'];
    if (fill && /rgba?\([^)]*,\s*0(\.0+)?\s*\)|transparent/.test(fill)) return;
    const fg = parse(cs.color); if (!fg || fg[3] < 0.5) return;
    const bgs = bgStack(el).filter(isGreen);
    if (!bgs.length) return;
    const txt = (el.textContent || '').trim();
    const isIcon = !txt && !!el.querySelector('i[class*="ri-"]');
    if (!txt && !isIcon) return;                    // 没有可辨识内容的容器不算站点
    const px = parseFloat(cs.fontSize);
    const large = px >= 24 || (px >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
    const need = (isIcon || large) ? 3 : 4.5;
    let worst = Infinity;
    bgs.forEach((b) => { const v = ratio(fg, b); if (v < worst) worst = v; });
    out.push({ sel: el.id ? '#' + el.id : (el.className && typeof el.className === 'string'
        ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : el.tagName.toLowerCase()),
      text: txt.slice(0, 12), kind: isIcon ? '图标' : (large ? '大字' : '小字'),
      size: cs.fontSize, weight: cs.fontWeight, ratio: worst, need, pass: worst >= need });
  });
  return out;
});

/* ② 弹层：真点一次打开，量矩形 + 用 elementFromPoint 验最外侧那项真的点得到。
   展开有 .18s 过渡，点完立刻量会把"正在淡入"读成"没开" —— 必须等。 */
const popupProbe = async (page, ks) => {
  const res = [];
  for (const k of ks) {
    const btn = await page.$(k.trigger);
    if (!btn) { res.push({ name: k.name, skip: '控件不在页面上' }); continue; }
    await btn.click().catch(() => {});
    await page.waitForTimeout(320);
    const got = await page.evaluate((sel) => {
      const menu = document.querySelector(sel);
      if (!menu) return { skip: '菜单节点不存在' };
      const cs = getComputedStyle(menu);
      if (cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.5) return { skip: '点了没开' };
      const vw = document.documentElement.clientWidth;
      const r = menu.getBoundingClientRect();
      const items = [...menu.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().height > 0);
      const edge = items[items.length - 1];
      let edgeItemHit = null, edgeTxt = '';
      if (edge) {
        const er = edge.getBoundingClientRect();
        edgeTxt = (edge.textContent || '').trim().slice(0, 8);
        const cx = (Math.max(er.left, 1) + Math.min(er.right, vw - 1)) / 2;
        const hitEl = document.elementFromPoint(cx, (er.top + er.bottom) / 2);
        edgeItemHit = !!(hitEl && (hitEl === edge || edge.contains(hitEl)));
      }
      return { left: +r.left.toFixed(1), right: +r.right.toFixed(1), vw, width: +r.width.toFixed(1),
        overflowL: +Math.max(0, -r.left).toFixed(1), overflowR: +Math.max(0, r.right - vw).toFixed(1),
        edgeItemHit, edgeTxt, items: items.length };
    }, k.menu);
    if (got.skip) res.push({ name: k.name, skip: got.skip });
    else res.push({ name: k.name, ...got });
    // 关掉，别影响下一颗
    await btn.click().catch(() => {});
    await page.waitForTimeout(220);
  }
  return res;
};

const POPUPS = [
  { name: '循环次数', trigger: '#btnLoop', menu: '#loopWrap .loop-menu' },
  { name: '倍速', trigger: '#rateCycle', menu: '#rateWrap .rate-menu' },
  { name: 'A-B 选段', trigger: '#btnAB', menu: '#abWrap .ab-menu' },
  { name: '书签', trigger: '#markBtn', menu: '#markWrap .ab-menu' },
];

async function run() {
  const browser = await chromium.launch();
  let bad = 0, skipped = 0;
  const reportPopups = (label, list) => list.forEach((x) => {
    if (x.skip) { console.log(`   ${label} ${x.name}：${x.skip} —— 没量到`); skipped++; return; }
    const over = (x.overflowL || 0) + (x.overflowR || 0);
    const ok = over < 0.5 && x.edgeItemHit !== false;
    if (!ok) bad++;
    console.log(`   ${ok ? '✓' : '✗'} ${label} ${x.name}：${x.left}→${x.right} / 视口 ${x.vw}`
      + `，宽 ${x.width}，${x.items} 项 → 左溢 ${x.overflowL} 右溢 ${x.overflowR}`
      + ` 末项「${x.edgeTxt}」可点=${x.edgeItemHit}`);
  });

  for (const pg of PAGES) {
    for (const vp of pg.vp) {
      const ctx = await browser.newContext({ viewport: { width: vp.w, height: 844 } });
      const page = await ctx.newPage();
      const label = `${pg.name} @${vp.n}`;
      /* 主应用首屏要拉 cdnjs 的图标字体，load/domcontentloaded 在弱网下 20s 都等不到 ——
         先 commit，再等应用自己的节点出现，等不到就明说"没量到"。 */
      page.setDefaultNavigationTimeout(25000);
      try {
        await page.goto(BASE_URL + pg.url, { waitUntil: 'commit' });
        await page.waitForSelector(pg.shadow ? '.audiobar' : '#topbar', { timeout: 30000 });
      } catch (e) {
        console.log(`\n⚠️ ${label} 打不开/没渲染出来（${e.message.split('\n')[0]}）—— 这一档整页没量到`);
        skipped++; await ctx.close(); continue;
      }
      await page.waitForTimeout(1200);

      const sweep = async (mname) => {
        const c = await contrastSweep(page);
        const fails = c.filter((x) => !x.pass);
        bad += fails.length;
        if (!c.length) { console.log(`\n⚠️ [${label} / ${mname}] 一处绿底浅字都没捞到 —— 不是"全过"，是没量到`); skipped++; }
        else console.log(`\n[${label} / ${mname}] 绿底有字站点 ${c.length} 处，越界 ${fails.length} 处`);
        c.forEach((x) => console.log(`   ${x.pass ? '✓' : '✗'} ${x.sel} 「${x.text}」${x.kind} ${x.size}/${x.weight} → ${x.ratio}（需 ${x.need}）`));
      };
      await sweep('浅色');

      // 深色：两站开关不完全一样，逐个试，切不上就明说"没量到"
      await page.evaluate(() => {
        const b = document.getElementById('btnDark') || document.querySelector('[onclick*="Dark"]');
        if (b) { b.click(); return; }
        if (typeof window.toggleDark === 'function') window.toggleDark();
      });
      await page.waitForTimeout(400);
      if (!(await page.evaluate(() => document.body.classList.contains('dark')))) {
        console.log(`\n⚠️ [${label}] 深色模式没切上 —— 这一档等于没量`); skipped++;
      }
      await sweep('深色');
      await page.evaluate(() => { const b = document.getElementById('btnDark'); if (b) b.click(); });
      await page.waitForTimeout(300);

      if (!pg.shadow) { await ctx.close(); continue; }   // 弹层是跟读站的控件

      /* 书签菜单空着量不出真实溢出（里面是一条条列表），先记一条。
         放在弹层走查之后、任务模式之前：书签会插进正文句子，做任务模式数字前先清掉，
         免得这一轮的量测把正文结构改了，污染后面读到的进度。 */
      await page.evaluate(() => { if (typeof window.addMark === 'function') window.addMark(); });
      await page.waitForTimeout(250);
      reportPopups(`${label} 常规模式 弹层`, await popupProbe(page, POPUPS));

      // 任务模式：底栏把播放组挪到了左边，溢出方向反过来，必须单独量
      await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); TASK.enterTaskMode(); });
      await page.waitForTimeout(700);
      if (!(await page.evaluate(() => document.body.classList.contains('task-mode')))) {
        console.log(`\n⚠️ [${label}] 没进任务模式 —— 底栏那一档弹层等于没量`); skipped++;
      } else {
        reportPopups(`${label} 任务模式 弹层`, await popupProbe(page, POPUPS));
      }
      // 退出任务模式后量"计划设置弹窗"那两颗绿按钮（在屏上时才量得到）
      await page.evaluate(() => { try { TASK.exitTaskMode(); } catch (e) {} });
      await page.waitForTimeout(400);
      await page.evaluate(() => { const b = document.getElementById('btnToday'); if (b) b.click(); });
      await page.waitForTimeout(600);
      await sweep('今日面板');
      await page.evaluate(() => { try { TASK.resetV2(); } catch (e) {}
        try { localStorage.clear(); } catch (e) {} });
      await ctx.close();
    }
  }
  console.log(`\n================ 越界 ${bad} 处，没量到 ${skipped} 档 ================`);
  await browser.close();
  process.exit(bad ? 1 : 0);
}
run();
