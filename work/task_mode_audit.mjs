#!/usr/bin/env node
/* 任务模式体验走查探针（不进产品，只出体检报告）。
   目的：把「人在手机上用任务模式」会撞到的东西量化成一条一条的事实，供人工判优先级。
   它【不断言】、只测量 —— 断言在 playwright-tests/journeys/shadow/*.spec.ts 里，那份才是门禁。
   跑法：先起服务（python3 -m http.server 8931 --directory shadow，或复用测试用的那台），
        node work/task_mode_audit.mjs [baseURL]
   测的是 shadow/index.html 真页面，用的是产品自己的 TASK.* 入口（和 spec 的 beforeEach 同一配方）。 */
import { createRequire } from 'module';
/* 仓库根没有 package.json，playwright 装在 playwright-tests/ 下 —— 从那里要，别在根上再装一份。 */
const require = createRequire(new URL('../playwright-tests/package.json', import.meta.url));
const { chromium } = require('playwright');

const BASE = process.argv[2] || 'http://127.0.0.1:8931';
const findings = [];
const add = (area, level, msg) => findings.push({ area, level, msg });

const HIT = 44;   // iOS HIG / WCAG 2.5.5 触控目标下限

async function open(browser, vp) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 90)));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console:' + m.text().slice(0, 90)); });
  await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.locator('.sent').first().waitFor({ timeout: 30000 });
  page.__errs = errs;
  return { ctx, page };
}

const enter = (page, min) => page.evaluate((m) => {
  TASK.resetV2(); TASK.initPlan(m); TASK.enterTaskMode();
}, min);

/* 屏幕上所有可见的可点元素：命中区、名字、归谁管。
   只看任务模式那三块壳子（任务条 / 做题卡 / 搬过去的播放控件）—— 正文里的行内小词卡
   天生就是 23px 高的文字，拿 44px 去量它等于让报告淹在噪音里（第一版就是这么废的）。 */
const IN_CHROME = '#taskBar, #taskCard, .audiobar';
const tapTargets = (page) => page.evaluate(({ HIT, IN }) => {
  const out = [];
  document.querySelectorAll(`${IN} button, ${IN} [role=button], ${IN} .opt, ${IN} .qz-opt`).forEach((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (!r.width || !r.height || cs.visibility === 'hidden' || cs.display === 'none') return;
    if (r.bottom < 0 || r.top > innerHeight) return;
    if (r.width <= 2 || r.height <= 2) return;          // 聚焦才现身的 skip-link 等，不算命中区问题
    /* 热区不能只看 getBoundingClientRect —— 我们把触控热区用 ::after 撑大了，
       那个盒子不在元素自己的 rect 里。真判据是 hit-test：上下各外扩 8px 的点还归不归这颗按钮。 */
    const owns = (dy) => { const p = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2 + dy);
      return !!(p && (p === el || el.contains(p) || (p.closest && p.closest('button') === el))); };
    out.push({
      id: el.id || (el.className + '').slice(0, 26),
      name: (el.getAttribute('aria-label') || el.title || el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 22),
      w: Math.round(r.width), h: Math.round(r.height),
      tapH: Math.round(r.height) + (owns(-(r.height / 2 + 8)) ? 8 : 0) + (owns(r.height / 2 + 8) ? 8 : 0),
      top: Math.round(r.top), bottom: Math.round(r.bottom),
      tag: el.tagName, onclick: !!el.getAttribute('onclick'),
    });
  });
  // 热区只在手机宽度上判：产品自己那条 @media (max-width:700px) 就是按这个断点给 44px 的，
  // 桌面用鼠标，拿 44 去量桌面按钮只会出一屏假红。
  if (innerWidth > 700) return [];
  return out.filter((e) => e.tapH < HIT || e.w < HIT);
}, { HIT, IN: IN_CHROME });

const barInfo = (page) => page.evaluate(() => {
  const bar = document.getElementById('taskBar');
  const r = bar.getBoundingClientRect();
  const cs = getComputedStyle(document.documentElement);
  const ov = (sel) => { const e = document.querySelector(sel); if (!e) return null;
    return { text: (e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60), clipped: e.scrollWidth > e.clientWidth + 1 }; };
  const card = document.getElementById('taskCard');
  const cr = card && !card.hidden ? card.getBoundingClientRect() : null;
  return {
    state: bar.dataset.state, h: Math.round(r.height), top: Math.round(r.top),
    varH: cs.getPropertyValue('--task-bar-h').trim(), varCardB: cs.getPropertyValue('--task-card-b').trim(),
    title: ov('#tbTitle'), sub: ov('#tbSub'), eta: ov('#tbEta'),
    cardGap: cr ? Math.round(r.top - cr.bottom) : null,
    cardOverflow: cr ? cr.top < 44 : false,
  };
});

async function probeMenus(page, tag) {
  for (const [id, menu] of [['btnLoop', '.loop-menu'], ['btnAB', '.ab-menu'], ['rateCycle', '.rate-menu'], ['btnMark', '.menu,.ab-menu,.rate-menu']]) {
    const btn = page.locator('#' + id);
    if (!(await btn.count()) || !(await btn.isVisible().catch(() => false))) continue;
    await btn.click().catch(() => {});
    await page.waitForTimeout(220);
    const res = await page.evaluate((m) => {
      const el = document.querySelector(m);
      if (!el) return { found: false };
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { found: true, shown: cs.display !== 'none' && cs.visibility !== 'hidden' && r.height > 4,
        offTop: Math.round(-r.top), offRight: Math.round(r.right - innerWidth), offBottom: Math.round(r.bottom - innerHeight),
        offLeft: Math.round(-r.left), z: cs.zIndex };
    }, menu);
    if (!res.found) { add(tag + ' 菜单', 'P3', `#${id} 点了找不到 ${menu}（可能类名不同）`); }
    else if (!res.shown) { add(tag + ' 菜单', 'P1', `#${id} 点开不了 ${menu} —— 任务模式里这个功能是坏的`); }
    else if (res.offTop > 0 || res.offBottom > 0 || res.offRight > 0 || res.offLeft > 0) {
      add(tag + ' 菜单', 'P2', `${menu} 超出视口：上${res.offTop} 下${res.offBottom} 右${res.offRight} 左${res.offLeft}（z=${res.z}）`);
    }
    await page.mouse.click(5, 60); await page.waitForTimeout(160);
    /* 收没关，要看 visibility/opacity 而不是 display —— 这几个菜单是用
       `.loop-menu{opacity:0;visibility:hidden}` 藏的，只看 display 会把"已经关了"读成"还开着"。 */
    const still = await page.evaluate((m) => { const el = document.querySelector(m); if (!el) return false;
      const cs = getComputedStyle(el);
      return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.5 && el.getBoundingClientRect().height > 4; }, menu);
    if (res.shown && still) add(tag + ' 菜单', 'P2', `${menu} 点了外部不关闭（要再点一次那颗按钮才收）`);
  }
}

const contrastProbe = (page) => page.evaluate(() => {
  const ratio = (fg, bg) => { const p = (c) => (c.match(/\d+(\.\d+)?/g) || [0, 0, 0]).slice(0, 3).map(Number);
    const L = (c) => { const a = p(c).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
      return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; };
    return +((Math.max(L(fg), L(bg)) + 0.05) / (Math.min(L(fg), L(bg)) + 0.05)).toFixed(2); };
  const out = {};
  [['#tbNext', '下一句'], ['#tbAgain', '再来'], ['#tbPrev', '上一句'], ['#btnPlay', '▶'], ['#tbExit', '退出'],
   ['#rateCycle', '倍速'], ['#btnLoop', '循环'], ['#tbSub', '副标题'], ['#tbEta', '工期行']].forEach(([sel, name]) => {
    const el = document.querySelector(sel); if (!el) return;
    const cs = getComputedStyle(el);
    if (+parseFloat(cs.fontSize) === 0) return;              // 窄屏纯图标态：字号 0，量出来的"颜色"是图标的
    if (cs.backgroundImage !== 'none') {                     // 渐变底（下一句那颗）取不到 background-color，
      out[name] = { ratio: 99, size: cs.fontSize, gradient: true }; return;   // 拿父级白底去比只会得 1:1 假红
    }
    let bg = cs.backgroundColor; let host = el;
    while ((bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') && host.parentElement) {
      host = host.parentElement; bg = getComputedStyle(host).backgroundColor;
    }
    out[name] = { ratio: ratio(cs.color, bg), size: cs.fontSize, weight: cs.fontWeight };
  });
  return out;
});

const keyboardProbe = (page) => page.evaluate(() => {
  const st = () => ({ idx: (typeof idx !== 'undefined' ? idx : null),
    bar: document.getElementById('taskBar').dataset.state, quiz: document.body.classList.contains('quiz-mode') });
  return { before: st(), active: (document.activeElement || {}).id || (document.activeElement || {}).tagName };
});

async function run() {
  const browser = await chromium.launch();

  for (const vp of [{ width: 390, height: 844, name: '手机 390' }, { width: 1280, height: 900, name: '桌面 1280' }]) {
    const { ctx, page } = await open(browser, vp);
    const T = vp.name;

    await enter(page, 15);
    await page.waitForTimeout(400);
    let bi = await barInfo(page);
    add(T + ' 底栏', bi.h > 120 ? 'P1' : 'P3', `① 通读态任务条高 ${bi.h}px（--task-bar-h=${bi.varH}）`);
    if (Math.abs(parseInt(bi.varH) - bi.h) > 3) add(T + ' 底栏', 'P1', `--task-bar-h(${bi.varH}) 和实测高(${bi.h}px) 不一致 —— 靠它让位的卡片会压住或空出一截`);
    const small = await tapTargets(page);
    small.forEach((s) => add(T + ' 命中区', 'P2', `「${s.name || s.id}」只有 ${s.w}×${s.h}px（< ${HIT}）`));

    await probeMenus(page, T + ' ①');
    const c = await contrastProbe(page);
    Object.entries(c).forEach(([k, v]) => { if (v.ratio < 4.5 && v.size !== '11px') add(T + ' 对比度', v.ratio < 3 ? 'P1' : 'P2', `${k} ${v.ratio}:1（字号 ${v.size}）`); });

    /* 键盘：任务模式里能不能不靠手点完一天 */
    const k0 = await keyboardProbe(page);
    await page.keyboard.press('Space'); await page.waitForTimeout(120);
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(200);
    const k1 = await page.evaluate(() => ({ idx: (typeof idx !== 'undefined' ? idx : null) }));
    if (k1.idx === k0.before.idx) add(T + ' 键盘', 'P2', '→ / Space 在任务模式里没有任何作用（只能上手点）');
    await page.evaluate(() => { TASK.setPass(2); TASK.next(); });
    await page.waitForTimeout(500);
    const kb = await page.evaluate(() => { const n = document.querySelectorAll('.task-card button, .qz-opt, .opt').length;
      return { n, focusable: [...document.querySelectorAll('.task-card button')].map((e) => e.tabIndex) }; });
    bi = await barInfo(page);
    add(T + ' 底栏', 'P3', `② 做题态任务条高 ${bi.h}px，卡片与条之间留白 ${bi.cardGap}px`);
    if (bi.cardGap !== null && bi.cardGap < 0) add(T + ' 布局', 'P1', `② 做题卡压住任务条 ${-bi.cardGap}px`);
    const smallQ = (await tapTargets(page)).filter((s) => /选项|opt|A|B|C|D/.test(s.id + s.name));
    smallQ.forEach((s) => add(T + ' ② 选项命中区', 'P2', `选项「${s.name || s.id}」${s.w}×${s.h}px`));
    if (!kb.n) add(T + ' ② 出题', 'P1', '切到 ② 之后卡片里一颗按钮都没有 —— 卡死');

    /* 状态机：几个容易漏的岔路 */
    const paths = await page.evaluate(() => {
      const r = {};
      try { TASK.setPass(3); r.pass3 = document.getElementById('taskBar').dataset.state; } catch (e) { r.pass3 = 'THROW ' + e.message; }
      try { TASK.again(); r.againInQuiz = 'ok'; } catch (e) { r.againInQuiz = 'THROW ' + e.message; }
      r.bodyClasses = document.body.className;
      return r;
    });
    if (/THROW/.test(paths.pass3 + paths.againInQuiz)) add(T + ' 状态机', 'P1', `岔路直接抛错：setPass3=${paths.pass3} / ② 里按再来=${paths.againInQuiz}`);

    /* 同步提示条贴得对不对：它写的是 `--task-bar-h + 8 + 62`，那 62 是【播放条】的高度。
       任务模式里播放条整条不显示，这 62 就成了凭空多出来的一段空隙（他 2026-09-21 之后底栏口径变了）。
       必须在底栏真的在屏幕上时量：底栏 display:none 时 rect 全是 0，会算出"压住 712px"这种假红。 */
    const hint = await page.evaluate(() => {
      const h = document.getElementById('syncHint'); if (!h) return null;
      // 走真路径：手动点重试才会调 setSyncHint（它是 fixed 药丸，贴在底栏上方，
      // 直接把 hidden 改成 false 量不到 JS 贴的位置，只会量到 CSS 的静态兜底值）。
      h.hidden = false; h.textContent = '同步失败，点这里重试';
      const bar = document.getElementById('taskBar').getBoundingClientRect();
      const ab = document.getElementById('audiobar').getBoundingClientRect();
      const anchor = bar.height > 0 ? bar : (ab.height > 0 ? ab : null);
      if (!anchor) { h.hidden = true; return { skipped: true }; }
      const hr = h.getBoundingClientRect();
      const cs = getComputedStyle(h);
      const gap = Math.round(anchor.top - hr.bottom);
      h.hidden = true;
      return { gap, task: bar.height > 0, shown: cs.display !== 'none' };
    });
    if (hint && !hint.skipped) {
      if (hint.gap < 0) add(T + ' 同步提示', 'P1', `同步条压住底栏 ${-hint.gap}px`);
      else if (hint.gap > 40) add(T + ' 同步提示', 'P2', `${hint.task ? '任务模式里' : '非任务模式'}同步条浮在离底栏 ${hint.gap}px 的地方（写死了播放条那 62px）`);
      else add(T + ' 同步提示', 'P3', `同步条离底栏 ${hint.gap}px`);
    }

    /* 刷新 → 续读条。必须放在「做完今天」之前：那一天做完了就没有未完成任务可续，
       这条会稳定报假红（第一版就踩了）。也要先真读两句：一句进展都没有，续读条本来就不该出现。 */
    await page.evaluate(() => { TASK.todayPlan(true).queue.slice(0, 2).forEach((x) => TASK.readDone(x.i)); });
    await page.evaluate(() => { TASK.exitTaskMode(); });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('.sent').first().waitFor();
    await page.waitForTimeout(600);
    const resume = await page.evaluate(() => {
      const bar = document.getElementById('taskBar'); const r = bar.getBoundingClientRect();
      return { state: bar.dataset.state, shown: r.height > 0, h: Math.round(r.height),
        bodyTask: document.body.classList.contains('task-mode'),
        btns: [...bar.querySelectorAll('button')].filter((e) => e.getBoundingClientRect().height > 0).length };
    });
    if (!resume.shown) add(T + ' 续读条', 'P2', '任务没做完刷新后底部没有续读条（state=' + resume.state + '）');
    else add(T + ' 续读条', resume.bodyTask ? 'P2' : 'P3', `续读条高 ${resume.h}px / ${resume.btns} 颗 / body.task-mode=${resume.bodyTask}`);


    /* 做完今天 → done 态（用 5 分钟档，循环几轮就空了） */
    await enter(page, 5);
    await page.evaluate(() => { for (let i = 0; i < 60; i++) { try { TASK.next(); } catch (e) {} try { TASK.readDone(i); } catch (e) {} } });
    await page.waitForTimeout(400);
    const done = await page.evaluate(() => {
      const bar = document.getElementById('taskBar');
      const vis = [...bar.querySelectorAll('button')].filter((e) => e.getBoundingClientRect().height > 0)
        .map((e) => (e.innerText || e.id).replace(/\s+/g, ' ').trim().slice(0, 10));
      return { state: bar.dataset.state, vis, h: Math.round(bar.getBoundingClientRect().height) };
    });
    add(T + ' 收工态', done.state === 'done' ? 'P3' : 'P2', `今天做完：state=${done.state}，条上剩 ${done.vis.length} 颗 ${JSON.stringify(done.vis)}，高 ${done.h}px`);

    /* 60 分钟档：文案挤不挤 */
    await enter(page, 60).catch(() => {});
    await page.evaluate(() => TASK.enterTaskMode()).catch(() => {});
    await page.waitForTimeout(500);
    const big = await barInfo(page);
    ['title', 'sub', 'eta'].forEach((k) => { if (big[k] && big[k].clipped)
      add(T + ' 文案', 'P2', `${k} 被截断：「${big[k].text}」`); });
    add(T + ' 底栏', big.h > 120 ? 'P2' : 'P3', `60 分钟档任务条高 ${big.h}px / state=${big.state}`);

    /* 深色模式 */
    await page.evaluate(() => { const b = document.getElementById('themeBtn') || document.querySelector('[onclick*="dark"],[onclick*="theme"]');
      if (b) b.click(); });
    await page.waitForTimeout(300);
    const dark = await contrastProbe(page);
    Object.entries(dark).forEach(([k, v]) => { if (v.ratio < 4.5) add(T + ' 深色对比度', v.ratio < 3 ? 'P1' : 'P2', `${k} ${v.ratio}:1`); });

    if (page.__errs.length) add(T + ' 报错', 'P1', `JS 报错 ${page.__errs.length} 条：${page.__errs.slice(0, 3).join(' | ')}`);
    await ctx.close();
  }

  await browser.close();
  const order = { P1: 0, P2: 1, P3: 2 };
  findings.sort((a, b) => order[a.level] - order[b.level] || a.area.localeCompare(b.area));
  const lines = findings.map((f) => `- [${f.level}] **${f.area}** :: ${f.msg}`);
  const md = `# 任务模式走查报告\n\n跑法：\`node work/task_mode_audit.mjs\`　生成：${new Date().toISOString()}\n\n` +
    `共 ${findings.length} 条（P1 ${findings.filter((f) => f.level === 'P1').length} / ` +
    `P2 ${findings.filter((f) => f.level === 'P2').length} / P3 ${findings.filter((f) => f.level === 'P3').length}）\n\n` +
    lines.join('\n') + '\n';
  const { writeFileSync } = await import('fs');
  writeFileSync(new URL('./task_mode_audit_result.md', import.meta.url), md);
  console.log(md);
}
run().catch((e) => { console.error('探针本身挂了：', e.message); process.exit(1); });
