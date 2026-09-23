// Compiled from: tests/e2e/shadow/progress-bars.md
// Source is authoritative — do not edit; re-compile from markdown if broken.
//
// 这一条锁的是他 2026-09-22 说的两件事：「任务模式的进度条无法使用」+「全站进度条的交互和视觉优化」。
// 判"能不能用"只认一个事实：真的按住拖一下，看当前那句跟不跟着走。
// 不锁"有没有绑事件" —— 上一轮的教训是：底栏那根条有 CSS、有宽度、看着就在眼前，
// 但它是一根 aria-hidden 的装饰线，任何"元素存在即通过"的断言都会对它亮绿灯。
//
// 本锁也不看内部变量（idx / taskPos 都在闭包里，测试拿不到），全部只看 DOM 上看得见的东西。

import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

declare const TASK: {
  resetV2(): void; initPlan(n: number): void; enterTaskMode(): void; exitTaskMode(): void;
  queue: { i: number; type: string }[];
  todayPlan(force?: boolean): { queue: { i: number }[] };
  readDone(i: number): void; setPass(n: number): void;
};

/* 当前播的那句在 .sent 里的下标；没在播返回 -1 */
const playingIdx = (page) => page.evaluate(() =>
  [...document.querySelectorAll('.sent')].findIndex((e) => e.classList.contains('playing')));

/* 从 x% 拖到 y%，走真鼠标 —— pointerdown/move/up，和应用里绑的事件同一通道 */
async function dragTrack(page, sel, from, to) {
  const box = await page.evaluate((s) => {
    const el = document.querySelector(s); if (!el) return null;
    const r = el.getBoundingClientRect();
    return r.width && r.height ? { x: r.x, y: r.y, w: r.width, h: r.height } : null;
  }, sel);
  expect(box, `进度条 ${sel} 不在屏上`).not.toBeNull();
  const y = box!.y + box!.h / 2;
  await page.mouse.move(box!.x + box!.w * from, y);
  await page.mouse.down();
  for (const f of [from + (to - from) * 0.4, from + (to - from) * 0.7, to]) {
    await page.mouse.move(box!.x + box!.w * f, y);
    await page.waitForTimeout(60);
  }
  await page.mouse.up();
  await page.waitForTimeout(900);
}

/* 绿字对比度：把"字是绿的、压在某个底上"的站点全捞出来，一条一条算。
   只管界面外壳（顶栏 / 播放条 / 任务条 / 面板），正文里的词头绿是教学法编码，另算一笔账。 */
const greenInkViolations = (page) => page.evaluate(() => {
  const parse = (s) => { const m = /rgba?\(([^)]+)\)/.exec(s || ''); if (!m) return null;
    const p = m[1].split(',').map((x) => parseFloat(x));
    return [p[0] || 0, p[1] || 0, p[2] || 0, p.length > 3 ? p[3] : 1]; };
  const over = (f, b) => [f[0] * f[3] + b[0] * (1 - f[3]), f[1] * f[3] + b[1] * (1 - f[3]),
    f[2] * f[3] + b[2] * (1 - f[3]), 1];
  const lum = (c) => { const a = c.slice(0, 3).map((v) => { v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; };
  const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  const isGreen = (c) => c[1] > 60 && c[1] - c[0] > 20 && c[1] - c[2] > 12;
  const bgStack = (el) => { const re = /rgba?\([^)]+\)/g; const layers = []; let host = el, base = null;
    while (host) { const cs = getComputedStyle(host); let m; const ims = [];
      while ((m = re.exec(cs.backgroundImage || ''))) { const c = parse(m[0]); if (c) ims.push(c); }
      if (ims.length) layers.push(ims);
      const solid = parse(cs.backgroundColor);
      if (solid && solid[3] >= 0.999) { base = solid; break; }
      if (solid && solid[3] > 0) layers.push([solid]);
      host = host.parentElement; }
    const acc = base || [255, 255, 255, 1]; const outs = [];
    const flat = (i, cur) => { if (i < 0) { outs.push(cur); return; } layers[i].forEach((s) => flat(i - 1, over(s, cur))); };
    flat(layers.length - 1, acc); return outs; };
  const bad = [];
  document.querySelectorAll('*').forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const txt = (el.textContent || '').trim();
    if (!txt) return;
    if (el.closest('.sec')) return;                       // 正文不在这笔账里
    const fill = cs.webkitTextFillColor;
    if (fill && /rgba?\([^)]*,\s*0(\.0+)?\s*\)|transparent/.test(fill)) return;  // 渐变裁字另算
    const fg = parse(cs.color); if (!fg || !isGreen(fg)) return;
    const px = parseFloat(cs.fontSize);
    const need = (px >= 24 || (px >= 18.66 && parseInt(cs.fontWeight, 10) >= 700)) ? 3 : 4.5;
    let worst = Infinity;
    bgStack(el).forEach((b) => { worst = Math.min(worst, ratio(fg, b)); });
    if (worst < need) bad.push((el.id ? '#' + el.id : el.className || el.tagName) + ' → ' + worst.toFixed(2));
  });
  return bad;
});

/* 热区不读 CSS 猜：在中心上下各探若干像素，用 elementFromPoint 问浏览器"这一点归谁"。
   上一轮弹层就是靠这条纪律才量出 39px 右溢的 —— 读 computed style 只能量出作者以为自己在写什么。 */
const hitBand = (page, sel) => page.evaluate((s) => {
  const el = document.querySelector(s); if (!el) return -1;
  const r = el.getBoundingClientRect();
  const own = (dy: number) => { const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2 + dy);
    return !!(t && (t === el || el.contains(t) || el.contains(t.parentElement))); };
  let up = 0, down = 0;
  for (let d = 1; d <= 40; d++) { if (own(-d)) up = d; else break; }
  for (let d = 1; d <= 40; d++) { if (own(d)) down = d; else break; }
  return up + down + 1;
}, sel);

/* 等底栏高度稳定再取基线：按钮组有 `transition: .4s`，刚进任务模式量到的是"正在收"的中间值
   （1280 档实测 57 → 约 1 秒后 54.6）。拿中间值当基线，就会凭空报出"拖动把底栏改矮了"。 */
async function stableBarH(page) {
  let prev = -1, cur = 0;
  for (let i = 0; i < 12; i++) {
    cur = await page.evaluate(() => +document.getElementById('taskBar')!.getBoundingClientRect().height.toFixed(1));
    if (cur === prev) return cur;
    prev = cur; await page.waitForTimeout(300);
  }
  return cur;
}

test.describe('影子跟读全站进度条（任务条可拖 / 播放条可达 / 绿字对比度）', () => {
  test.skip(!['local', 'preview'].includes(ENV), `Test not allowed in "${ENV}"`);

  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({ type: 'source', description: 'tests/e2e/shadow/progress-bars.md' });
    await page.goto(`${baseURL}/index.html`);
    // 数据是 fetch 回来的：只等 .audiobar 会量到一个还没启动完的空壳
    await page.waitForFunction(() => document.querySelectorAll('.sent').length > 5, null, { timeout: 30000 });
  });

  test('① 播放条：静止就看得见把手、能 Tab 到、拖了会换句',
    { tag: ['@regression', '@positive', '@shadow'] }, async ({ page }) => {
      const t = page.locator('#seekTrack');
      await expect(t).toHaveAttribute('role', 'slider');
      await expect(t).toHaveAttribute('tabindex', '0');
      // 把手不靠 hover 才浮现 —— 一根看不见把手的细线，没人知道它能拖
      await expect(page.locator('#seekKnob')).toHaveCSS('opacity', '1');
      await expect(page.locator('#seekRail')).toHaveCSS('height', /[2-9](\.\d+)?px/);
      // 热区：11px 的条靠 ::before 外扩到 ≥24px，手机上才点得中
      const hit = await page.evaluate(() => {
        const el = document.getElementById('seekTrack');
        const r = el.getBoundingClientRect(); let h = r.height;
        ['::before', '::after'].forEach((pe) => { const c = getComputedStyle(el, pe);
          if (!c.content || c.content === 'none' || c.height === 'auto') return;
          const t = parseFloat(c.top), b = parseFloat(c.bottom);
          if (isFinite(t) && isFinite(b)) h = Math.max(h, r.height - t - b); });
        return h;
      });
      expect(hit).toBeGreaterThanOrEqual(24);
      // 应用不自动开播，所以先把基线立起来：没有一句在播，就无从判"拖完换没换句"
      await page.click('#btnPlay');
      await page.waitForFunction(() => [...document.querySelectorAll('.sent')]
        .some((e) => e.classList.contains('playing')), null, { timeout: 8000 });
      const before = await playingIdx(page);
      expect(before, '前置：得先有一句在播，才谈得上"拖了换句"').toBeGreaterThanOrEqual(0);
      await dragTrack(page, '#seekTrack', 0.2, 0.8);
      expect(await playingIdx(page)).not.toBe(before);
    });

  test('② 任务条：进度面是一根能拖的位置条，不是装饰线',
    { tag: ['@regression', '@positive', '@shadow'] }, async ({ page }) => {
      await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); TASK.enterTaskMode(); });
      await page.waitForTimeout(900);
      const bar = page.locator('#tbSeek');
      await expect(bar).toBeVisible();
      const hidden = await bar.evaluate((el) => el.getAttribute('aria-hidden'));
      expect(hidden, '整根 aria-hidden = 读屏根本不知道它在这里').not.toBe('true');
      await expect(bar).toHaveAttribute('role', 'slider');
      await expect(bar).toHaveAttribute('tabindex', '0');
      await expect(bar).toHaveAttribute('aria-valuemax', String(await page.evaluate(() => TASK.queue.length)));
      // 热区 ≥24px：以前它是 3px 的一条线，鼠标要正好压在 3px 上才有反应
      const hit = await bar.evaluate((el) => {
        const r = el.getBoundingClientRect(); let h = r.height;
        ['::before', '::after'].forEach((pe) => { const c = getComputedStyle(el, pe);
          if (!c.content || c.content === 'none' || c.height === 'auto') return;
          const t = parseFloat(c.top), b = parseFloat(c.bottom);
          if (isFinite(t) && isFinite(b)) h = Math.max(h, r.height - t - b); });
        return h;
      });
      expect(hit).toBeGreaterThanOrEqual(24);
      await expect(page.locator('#tbKnob')).toHaveCSS('opacity', '1');

      const n = await page.evaluate(() => TASK.queue.length);
      const before = await playingIdx(page);
      await dragTrack(page, '#tbSeek', 0.2, 0.8);
      const now = Number(await bar.evaluate((el) => el.getAttribute('aria-valuenow')));
      expect(now, '拖到 80% 后 aria-valuenow 该跟着走').toBeGreaterThan(1);
      /* 值文本报「位置 + 还剩」，不再报「共 N 句」：那个 N 是队列长度，跟任务条上那个 n/N
         （当天快照）不是一个量纲 —— 两个都写成「第 x/M 句」会被读成对不上（2026-09-24）。
         队列长度本身仍从 aria-valuemax 读得到。 */
      expect(await bar.evaluate((el) => el.getAttribute('aria-valuetext')))
        .toMatch(new RegExp(`今天第 ${now} 句，还剩 \\d+ 句`));
      expect(Number(await bar.evaluate((el) => el.getAttribute('aria-valuemax'))), '滑块上界 = 队列长度').toBe(n);
      expect(await playingIdx(page), '拖完当前句没换 = 拖动没接到播放上').not.toBe(before);
    });

  test('③ 任务条：键盘到得了（Tab 聚焦后 ← → 一句一句挪）',
    { tag: ['@regression', '@positive', '@shadow'] }, async ({ page }) => {
      await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); TASK.enterTaskMode(); });
      await page.waitForTimeout(900);
      const bar = page.locator('#tbSeek');
      await bar.focus();
      const read = () => bar.evaluate((el) => Number(el.getAttribute('aria-valuenow')));
      expect(await read()).toBeGreaterThanOrEqual(1);
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(700);
      expect(await read()).toBe(await page.evaluate(() => TASK.queue.length > 1 ? 2 : 1));
      await page.keyboard.press('End');
      await page.waitForTimeout(700);
      expect(await read()).toBe(await page.evaluate(() => TASK.queue.length));
    });

  test('④ 任务条：② 做题态退化成只读进度条，不给一个拖不动的滑块',
    { tag: ['@regression', '@positive', '@shadow'] }, async ({ page }) => {
      await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); TASK.enterTaskMode(); });
      await page.waitForTimeout(900);
      // 进 ② 用 task-flow 同一配方：把今天这批标成读完，再推到第 2 步
      await page.evaluate(() => {
        TASK.todayPlan(true).queue.forEach((x) => TASK.readDone(x.i));
        TASK.setPass(2);
      });
      await page.waitForTimeout(700);
      expect(await page.evaluate(() => document.getElementById('taskBar').dataset.state)).toBe('quiz');
      const bar = page.locator('#tbSeek');
      await expect(bar).toHaveAttribute('role', 'progressbar');
      await expect(bar).toHaveAttribute('tabindex', '-1');
      await expect(bar).toHaveClass(/off/);
      await expect(page.locator('#tbKnob')).toHaveCSS('opacity', '0');
    });

  test('⑤ 全站外壳：绿字压在底色上要过 AA（浅色 4.5:1）',
    { tag: ['@regression', '@positive', '@shadow'] }, async ({ page }) => {
      const seen = await page.evaluate(() => document.querySelectorAll('.btn, #edgeTab, #backToPlay').length);
      expect(seen, '一处绿字站点都没捞到 = 没量到，不算通过').toBeGreaterThan(0);
      expect(await greenInkViolations(page)).toEqual([]);
      await page.evaluate(() => document.getElementById('btnDark').click());
      await page.waitForTimeout(400);
      await expect(page.locator('body')).toHaveClass(/dark/);
      expect(await greenInkViolations(page)).toEqual([]);
    });

  /* ⑥ 底栏这一根在两档宽度下的几何：热区、把手不被裁、拖动中途的预览气泡不越界、不吃行高。
     抽成函数是因为 390 与 1280 要跑同一套判据 —— 上一支探针只跑了 1280，等于「两档」这条没量。 */
  const taskBarGeometry = async (page) => {
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); TASK.enterTaskMode(); });
    const barH0 = await stableBarH(page);
    const vw = await page.evaluate(() => document.documentElement.clientWidth);

    expect(await page.evaluate(() => document.documentElement.scrollWidth),
      `${vw}px 档横向溢出 = 底栏被进度条撑破了`).toBeLessThanOrEqual(vw);
    expect(await hitBand(page, '#tbSeek'), '含伪元素外扩的真实热区带宽').toBeGreaterThanOrEqual(26);

    const clipped = await page.evaluate(() => { const b = document.getElementById('taskBar')!.getBoundingClientRect();
      const k = document.getElementById('tbKnob')!.getBoundingClientRect();
      return { inBar: k.top >= b.top - 0.5 && k.bottom <= b.bottom + 0.5, k, b }; });
    expect(clipped.inBar, '把手被父级 overflow 裁掉 —— 外扩热区最常见的翻车').toBe(true);

    /* 五个位置各抓一次气泡：只在中间拖一次量不出边界。必须在 down 与 up 之间抓，松手就没了。 */
    const box = await page.evaluate(() => { const r = document.getElementById('tbSeek')!.getBoundingClientRect();
      return { x: r.x, y: r.y + r.height / 2, w: r.width }; });
    for (const f of [0.02, 0.2, 0.5, 0.8, 0.98]) {
      await page.mouse.move(box.x + box.w * 0.5, box.y);
      await page.mouse.down();
      await page.mouse.move(box.x + box.w * f, box.y, { steps: 6 });
      await page.waitForTimeout(150);
      const tip = await page.evaluate(() => { const el = document.getElementById('tbTip')!;
        const r = el.getBoundingClientRect(); const vw2 = document.documentElement.clientWidth;
        return { shown: getComputedStyle(el).display !== 'none',
          l: +Math.max(0, -r.left).toFixed(1), rt: +Math.max(0, r.right - vw2).toFixed(1),
          t: +Math.max(0, -r.top).toFixed(1) }; });
      expect(tip.shown, `拖到 ${Math.round(f * 100)}% 时预览气泡没出现 = 这一档没量到`).toBe(true);
      expect(tip.l, `拖到 ${Math.round(f * 100)}% 左溢`).toBeLessThan(0.5);
      expect(tip.rt, `拖到 ${Math.round(f * 100)}% 右溢`).toBeLessThan(0.5);
      expect(tip.t, `拖到 ${Math.round(f * 100)}% 顶出视口`).toBeLessThan(0.5);
      await page.mouse.up();
      await page.waitForTimeout(260);
    }

    /* 「进度面靠伪元素外扩，不吃行高」—— 条子那一段所在行的高必须等于标题行的高；
       拖了五次之后底栏也不许长高/变矮（他 2026-09-22 定过底栏是"主行 + 辅行 + 一行按钮"）。 */
    const rows = await page.evaluate(() => ({ line1: +document.querySelector('.tb-line1')!.getBoundingClientRect().height.toFixed(1),
      title: +document.querySelector('.tb-title')!.getBoundingClientRect().height.toFixed(1) }));
    expect(Math.abs(rows.line1 - rows.title), `进度条把那一行撑高了：${rows.line1} vs 标题 ${rows.title}`).toBeLessThanOrEqual(1);
    expect(Math.abs(await stableBarH(page) - barH0), '拖动五次后底栏高度变了').toBeLessThanOrEqual(1);
  };

  test('⑥ 任务条几何：桌面 1280 档热区 / 气泡 / 不吃行高',
    { tag: ['@regression', '@shadow'] }, async ({ page }) => { await taskBarGeometry(page); });

  test.describe('手机 390 档', () => {
    test.use({ viewport: { width: 390, height: 844 } });
    test('⑦ 任务条几何：热区 ≥26、气泡不伸出屏幕、底栏不被撑高',
      { tag: ['@regression', '@shadow'] }, async ({ page }) => { await taskBarGeometry(page); });
  });
});
