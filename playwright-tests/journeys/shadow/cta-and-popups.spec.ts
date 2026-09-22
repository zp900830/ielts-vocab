// Hand-written alongside tests/e2e/shadow/cta-and-popups.md
// 这一条锁的是他 2026-09-22 单独点出来的两件事，都是上一轮走查"发现了但没顺手修"的：
//   ① 所有绿色主按钮的白字压绿底，实测对比度只有 1.90（AA 正文要 4.5:1）；
//   ② A-B／循环／倍速那几个小弹层在手机上伸出屏幕外（常规模式右溢 39px，任务模式左溢 33.5px）。
// 两条都是量出来的，所以这里的断言也只能是量出来的 —— 写一条"看起来改好了"的用例等于没锁。
//
// 为什么每件事留【源码级】+【实页级】两道：
//   实页扫描只能看见此刻在屏幕上的控件（做题态、A-B 生效态、书签弹层要先进状态才显形），
//   源码扫描把所有写过"绿底 + 白字"的规则一网打尽，含看不见的热态与弹层。
//   少一道就是假绿。源码那道另配夹具自检（fixtures/cta-gate-selfcheck.css），
//   因为它一开始把 admin 站的蓝色 --accent 误判成绿 —— 只断言"现在 0 命中"是量不到这种错的。
//
// 范围口径（不在本锁里，别误以为已修）：句子上的 A/B 角标、#loopCount 那颗小徽标也是白字压色底，
// 但它们是状态标记不是按钮，已单独报给他拍板。
import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';
import fs from 'fs';
import path from 'path';

declare const TASK: {
  resetV2(): void; initPlan(n: number): void; enterTaskMode(): void; exitTaskMode(): void;
};
declare function addMark(): void;

/* ---------------- 源码级：把 CSS 里的"绿底 + 白字"规则抓出来 ---------------- */

const WHITE_INK = /(?:^|[;\s])color:\s*(?:#fff\b|#ffffff\b|white\b|rgb\(255,\s*255,\s*255\))/i;

const parseColor = (t: string): [number, number, number, number] | null => {
  let m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(t);
  if (m) { let h = m[1]; if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1]; }
  m = /^rgba?\(([^)]+)\)$/i.exec(t);
  if (m) { const p = m[1].split(/[,\s/]+/).filter(Boolean).map(parseFloat);
    if (p.length >= 3) return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
  return null;
};
// 半透明先叠到白纸上再判色相：rgba(16,180,135,.08) 那种浅绿底纹不是"绿底"，别误伤
const isGreenFill = (c: [number, number, number, number]) => {
  const k = c[3] > 1 ? 1 : c[3];
  const r = c[0] * k + 255 * (1 - k), g = c[1] * k + 255 * (1 - k), b = c[2] * k + 255 * (1 - k);
  return g > 110 && g - r > 25 && g - b > 25;
};

const scanCssSource = (file: string) => {
  const html = fs.readFileSync(file, 'utf-8');
  // HTML 只扫 <style> 里那些；.css 文件（自检夹具）本身就是样式表，整份扫
  const blocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);
  // 注释里也写着 #2bd4a4 这类色值和"绿底"字样，不摘干净会把注释当成声明块的一部分
  const css = (blocks.length ? blocks.join('\n') : html).replace(/\/\*[\s\S]*?\*\//g, '');
  // --accent 在跟读站是绿的、在 admin 站是苹果蓝：先按本文件自己写的取值解析，再判色相
  const vars: Record<string, string> = {};
  [...css.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)].forEach((m) => {
    if (!(m[1] in vars)) vars[m[1]] = m[2].trim();
  });
  const resolve = (s: string, depth = 0): string => {
    if (depth > 4) return s;
    return s.replace(/var\((--[\w-]+)(?:\s*,\s*([^()]*))?\)/g, (_all, name, fallback) => {
      const v = vars[name] ?? fallback ?? '';
      return resolve(v, depth + 1);
    });
  };
  const hits: string[] = [];
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].forEach(([, rawSel, decl]) => {
    const bg = new RegExp(`background(?:-color)?\\s*:[^;]*`, 'i').exec(decl);
    if (!bg || !WHITE_INK.test(decl)) return;
    const flat = resolve(bg[0]);
    const colors = [...flat.matchAll(/#[0-9a-f]{3}\b|#[0-9a-f]{6}\b|rgba?\([^)]+\)/gi)]
      .map((m) => parseColor(m[0])).filter(Boolean) as [number, number, number, number][];
    if (colors.some(isGreenFill)) hits.push(rawSel.trim().replace(/\s+/g, ' ').slice(-70));
  });
  return hits;
};

/* ---------------- 实页级：把屏幕上"绿底 + 有字"的控件真量一遍 ---------------- */

const sweepLive = (page: import('@playwright/test').Page) => page.evaluate(() => {
  const parse = (s: string) => { const m = /rgba?\(([^)]+)\)/.exec(s || ''); if (!m) return null;
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(parseFloat);
    return p.length >= 3 ? [p[0], p[1], p[2], p.length > 3 ? p[3] : 1] : null; };
  const parseAll = (s: string) => { const out: number[][] = []; const re = /rgba?\([^)]+\)/g; let m;
    while ((m = re.exec(s || ''))) { const c = parse(m[0]); if (c) out.push(c); } return out; };
  const over = (fg: number[], bg: number[]) => [fg[0] * fg[3] + bg[0] * (1 - fg[3]),
    fg[1] * fg[3] + bg[1] * (1 - fg[3]), fg[2] * fg[3] + bg[2] * (1 - fg[3]), 1];
  const lum = (c: number[]) => { const a = c.slice(0, 3).map((v) => { const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; };
  const ratio = (a: number[], b: number[]) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  const isGreen = (c: number[]) => c[1] > 110 && c[1] - c[0] > 25 && c[1] - c[2] > 25;
  /* 底色一路往上叠：玻璃条那几层是半透明渐变，不叠回去量到的是纸面白底，比屏幕上真实观感偏乐观。
     渐变要每个色标单独配一次 —— 亮端 #2bd4a4 正是压不住白字的那一端。 */
  const bgStack = (el: Element) => {
    const layers: number[][][] = []; let host: Element | null = el; let base: number[] | null = null;
    while (host) {
      const cs = getComputedStyle(host);
      const grads = parseAll(cs.backgroundImage); if (grads.length) layers.push(grads);
      const solid = parse(cs.backgroundColor);
      if (solid && solid[3] >= 0.999) { base = solid; break; }
      if (solid && solid[3] > 0) layers.push([solid]);
      host = host.parentElement;
    }
    const outs: number[][] = []; const acc = base || [255, 255, 255, 1];
    const flat = (i: number, cur: number[]) => { if (i < 0) { outs.push(cur); return; }
      layers[i].forEach((s) => flat(i - 1, over(s, cur))); };
    flat(layers.length - 1, acc); return outs;
  };
  const bad: { sel: string; ratio: number; need: number }[] = [];
  let seen = 0;
  document.querySelectorAll('*').forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    // 渐变裁字的标题（-webkit-text-fill-color:transparent）字本身就是绿的，拿 color 那一路白去比是假阳性
    if (cs.webkitTextFillColor && /transparent|rgba?\([^)]*,\s*0(\.0+)?\s*\)/.test(cs.webkitTextFillColor)) return;
    const fg = parse(cs.color); if (!fg || fg[3] < 0.5) return;
    const bgs = bgStack(el).filter(isGreen); if (!bgs.length) return;
    const txt = (el.textContent || '').trim();
    const isIcon = !txt && !!el.querySelector('i[class*="ri-"]');
    if (!txt && !isIcon) return;
    seen++;
    const px = parseFloat(cs.fontSize);
    const large = px >= 24 || (px >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
    const need = (isIcon || large) ? 3 : 4.5;
    const worst = Math.min(...bgs.map((b) => ratio(fg, b)));
    if (worst < need) bad.push({ sel: el.id ? '#' + el.id : el.tagName.toLowerCase(), ratio: +worst.toFixed(2), need });
  });
  return { seen, bad };
});

const POPUPS = [
  { name: '循环次数', trigger: '#btnLoop', menu: '#loopWrap .loop-menu' },
  { name: '倍速', trigger: '#rateCycle', menu: '#rateWrap .rate-menu' },
  { name: 'A-B 选段', trigger: '#btnAB', menu: '#abWrap .ab-menu' },
  { name: '书签', trigger: '#markBtn', menu: '#markWrap .ab-menu' },
];

async function measurePopup(page: import('@playwright/test').Page, p: { name: string; trigger: string; menu: string }) {
  await page.locator(p.trigger).click();
  // 展开是 .18s 过渡，点完立刻量会把"正在淡入"读成"没开"
  await expect(page.locator(p.menu)).toBeVisible();
  await page.waitForTimeout(260);
  const geo = await page.evaluate((sel) => {
    const menu = document.querySelector(sel) as HTMLElement;
    const vw = document.documentElement.clientWidth;
    const r = menu.getBoundingClientRect();
    const items = [...menu.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().height > 0);
    const edge = items[items.length - 1] as HTMLElement | undefined;
    return { left: +r.left.toFixed(1), right: +r.right.toFixed(1), vw, items: items.length,
      top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1),
      lastLabel: edge ? (edge.textContent || '').trim().slice(0, 10) : '' };
  }, p.menu);
  /* 判"用户点得到吗"不用坐标猜，直接真点最外侧那一项 —— 有东西压着它，Playwright 会点名是谁。
     （上一版在这里用 elementFromPoint 自己算，算出过一次分不清是遮挡还是时序的假失败。） */
  const last = page.locator(`${p.menu} button`).last();
  try {
    await last.click({ timeout: 4000 });
  } catch (e) {
    throw new Error(`${p.name} 最外侧那一项「${geo.lastLabel}」点不到：`
      + String((e as Error).message).split('\n')[0]);
  }
  // 选完通常自己收；没收的（书签那条）手工收一下，别挡住下一颗
  await page.evaluate(() => document.querySelectorAll('.loop-wrap.open, .rate-wrap.open, .ab-wrap.open')
    .forEach((w) => w.classList.remove('open')));
  await page.waitForTimeout(160);
  return geo;
}

test.describe('绿底按钮的字色 · 全站对比度', () => {
  const root = path.resolve(process.cwd(), '..');

  test('源码里不许再有「绿底 + 白字」这条规则（含看不见的热态和弹层）', () => {
    // 先自检这道闸门本身：坏写法必须响、好写法必须不响
    const fx = scanCssSource(path.join(root, 'playwright-tests/fixtures/cta-gate-selfcheck.css'));
    expect(fx.sort()).toEqual(['.bad-a', '.bad-b']);
    const report = ['shadow/index.html', 'index.html', 'admin/index.html']
      .map((f) => [f, scanCssSource(path.join(root, f))] as const)
      .filter(([, h]) => h.length > 0);
    expect(report, report.map(([f, h]) => `${f}: ${h.join(' | ')}`).join('\n')).toEqual([]);
  });

  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 4);
    await page.goto(`${baseURL}/index.html`);
    await expect(page.locator('.sent').first()).toBeVisible();
  });

  test('屏幕上真的量一遍：首屏绿底控件的对比度全过 AA', async ({ page }) => {
    const r = await sweepLive(page);
    expect(r.bad, JSON.stringify(r.bad)).toEqual([]);
    expect(r.seen, '一处绿底有字的控件都没捞到 = 扫描没跑到东西，不算通过').toBeGreaterThan(0);
  });

  test('任务模式那颗「下一句」：绿底没改暗、字换成深墨', async ({ page }) => {
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); TASK.enterTaskMode(); });
    await expect(page.locator('#tbNext')).toBeVisible();
    const one = await page.evaluate(() => {
      const el = document.getElementById('tbNext') as HTMLElement;
      const cs = getComputedStyle(el);
      return { color: cs.color, bg: cs.backgroundImage.slice(0, 70) };
    });
    expect(one.color).toBe('rgb(4, 35, 27)');          // --cta-ink
    expect(one.bg).toContain('43, 212, 164');          // #2bd4a4 —— 薄荷绿本身一颗都没压暗
    const r = await sweepLive(page);
    expect(r.bad, JSON.stringify(r.bad)).toEqual([]);
    expect(r.seen).toBeGreaterThan(0);
    await page.evaluate(() => { try { TASK.exitTaskMode(); TASK.resetV2(); } catch (e) {} });
  });
});

test.describe('播放条小弹层 · 不许伸出屏幕', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  const run = async (page: import('@playwright/test').Page) => {
    /* 「今日学习任务」这块面板常驻在 DOM 里，靠 .today-panel.open 才显形（不是 display:none）。
       它开着的时候会盖住底栏上方那一条，弹层的量测就变成在测"模态挡没挡"，所以先断言它是关的。 */
    await expect(page.locator('.today-panel.open')).toHaveCount(0);
    // 书签那条 .ab-menu 空着量不出真实溢出（里面是一条条列表），先记一条
    await page.evaluate(() => { try { addMark(); } catch (e) {} });
    for (const p of POPUPS) {
      const m = await measurePopup(page, p);
      expect(m.items, `${p.name} 弹层里没有可点的项，等于没量`).toBeGreaterThan(0);
      expect(m.left, `${p.name} 伸出左边界 ${m.left} < 0`).toBeGreaterThanOrEqual(-0.5);
      expect(m.right, `${p.name} 伸出右边界 ${m.right} > 视口 ${m.vw}`).toBeLessThanOrEqual(m.vw + 0.5);
    }
    // 上面是真的点了选项：把倍速/循环/A-B 拨回默认，别把状态带给后面的用例
    await page.evaluate(() => {
      try { pickRate(1); } catch (e) {}
      try { setLoopCount(0); } catch (e) {}
      try { abCancel(); } catch (e) {}
    });
  };

  test('390px 常规模式：四类弹层全在屏幕内，末项点得到', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/index.html`);
    await expect(page.locator('.audiobar')).toBeVisible();
    await run(page);
  });

  test('390px 任务模式：播放组挪到左边后溢出方向反过来，也收得住', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/index.html`);
    await expect(page.locator('.sent').first()).toBeVisible();
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); TASK.enterTaskMode(); });
    await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'read');
    await run(page);
    await page.evaluate(() => { try { TASK.exitTaskMode(); TASK.resetV2(); } catch (e) {} });
  });
});
