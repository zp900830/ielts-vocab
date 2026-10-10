// 2026-09-24（第三轮）用户拍板：主按钮退回「深墨字」之前那一版 —— 轻薄荷渐变 #2bd4a4→#0fae7e
// + 白字/白图标 + 通透光晕。实测白字压最亮端 #2bd4a4 只有 1.90:1（最暗端 2.85:1），
// ⚠️ 已知低于 WCAG AA 正文 4.5（纯图标也要 3:1）—— 用户看过实测数字后仍选定这支品牌色，
// 知情接受。所以本门禁**不再按对比度判达标**（那是假达标），改成**锁定色值的回归锁**：
// 把主按钮的渐变色标拆出来与 LOCKED_GRAD 精确比对，只防手滑改浅/改深或改掉字色。
// 下方「色值锁自检」塞一颗漂移值，证明锁真的会响。
// 服务器归 global-setup.ts 起停（仓库根 8932）；站点在仓库根，用 E2E_ROOT_URL，不走 baseURL。
import { test, expect } from '../../fixtures';
import { waitShadowReady } from '../../utils/app-ready';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  state(): { words: Record<string, unknown> };
};
declare const ShadowPlan: { newWord(): Record<string, unknown> };
declare const APP3: { route(): void };

const rootUrl = process.env.E2E_ROOT_URL || '';
// 锁定的品牌渐变（用户 2026-09-24 亲自选定；白字实测 1.90/2.85:1，已知低于 AA，用户知情接受）
const LOCKED_GRAD = ['rgb(43, 212, 164)', 'rgb(15, 174, 126)'];  // #2bd4a4 → #0fae7e
const LOCKED_INK = 'rgb(255, 255, 255)';                          // --cta-ink = #fff
const isLockedGrad = (stops: string[]) => JSON.stringify(stops) === JSON.stringify(LOCKED_GRAD);
const EMPTY: Record<string, string> = { 'sections.json': '[]', 'vocab.json': '{}', 'chapters.json': '[]' };
async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/data/${name}*`, (r) => r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}

/* 量一颗控件：拆出它 backgroundImage 里的每一档渐变色标，返回 { color, stops, ratios }。
   两个实页用例与「色值锁自检」探针共用同一套算法 —— 探针量的就是门禁量的。
   ratios 只作诚实记录（白字压这两档实测 1.90/2.85），不再参与断言。 */
function measureButton(el: Element) {
  const cs = getComputedStyle(el as HTMLElement);
  const parse = (s: string): number[] | null => {
    const mm = /rgba?\(([^)]+)\)/.exec(s || '');
    if (!mm) return null;
    const p = mm[1].split(/[,\s/]+/).filter(Boolean).map(parseFloat);
    return p.length >= 3 ? [p[0], p[1], p[2], p.length > 3 ? p[3] : 1] : null;
  };
  const f = (v: number) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
  const lum = (c: number[]) => 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  const over = (fg: number[], bg: number[]) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
  const ratio = (a: number[], b: number[]) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  const fg = parse(cs.color) || [0, 0, 0, 1];
  const stops: number[][] = [];
  const re = /rgba?\([^)]+\)/g; let mm: RegExpExecArray | null;
  while ((mm = re.exec(cs.backgroundImage || ''))) { const c = parse(mm[0]); if (c) stops.push(c); }
  const rgb = (c: number[]) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  return { color: cs.color, stops: stops.map(rgb), ratios: stops.map((s) => +ratio(fg, over(s, [255, 255, 255])).toFixed(2)) };
}

function assertLockedMint(m: { color: string; stops: string[]; ratios: number[] }, where: string) {
  expect(m.color, `${where} 是白字（--cta-ink = #fff）`).toBe(LOCKED_INK);
  expect(m.stops.length, `${where} 渐变要至少两档，否则拆不出两端`).toBeGreaterThanOrEqual(2);
  /* 回归锁：精确匹配用户锁定的品牌色。白字压它实测 1.90/2.85:1，已知低于 AA —— 用户知情接受，
     这里不再断言对比度达标（那是假达标），只保证没人把色值改浅/改深。 */
  expect(m.stops, `${where} 主按钮渐变被改动（白字实测 ${m.ratios}）`).toEqual(LOCKED_GRAD);
}

test.describe('3.0 主按钮轻渐变薄荷（锁定色值）', () => {
  test('首页主按钮：白字 + 锁定的品牌渐变（防手滑改浅/改深）', async ({ page }) => {
    await stubData(page, EMPTY);
    await page.goto(`${rootUrl}/index.html#/home`);
    const btn = page.locator('#homeBanner .b-go');
    await expect(btn).toBeVisible();
    assertLockedMint(await btn.evaluate(measureButton), '首页主按钮');
  });

  test('「我的」浮窗主按钮同一套渐变（不是两套绿）', async ({ page }) => {
    await stubData(page, EMPTY);
    await page.goto(`${rootUrl}/index.html#/home`);
    await page.locator('#meCard').click();
    await expect(page.locator('#loginModal')).toBeVisible();
    await page.locator('#loginModal [data-login-settings]').click();
    const cta = page.locator('#mePop .mp-cta');
    await expect(cta).toBeVisible();
    assertLockedMint(await cta.evaluate(measureButton), '「我的」主按钮');
  });

  /* 色值锁自检：塞一颗「旧参数」按钮（#2e9c76→#0f7c5a，上一版），用与实页用例【同一套】量法算 ——
     锁必须把它判为不合规。这条替代了旧的「合成回归：白字 + 太浅薄荷会被 3:1 拦下」：那套对比度门槛
     与用户新选定的 1.90:1 品牌色直接冲突，已删除；现在锁的是色值，不是对比度。 */
  test('色值锁自检：漂移的渐变（旧的 #2e9c76 一版）必须被判不合规', async ({ page }) => {
    await stubData(page, EMPTY);
    await page.goto(`${rootUrl}/index.html#/home`);
    await page.evaluate(() => {
      const b = document.createElement('button');
      b.id = '__drift_probe';
      b.textContent = '开始学习';
      b.style.color = '#fff';
      b.style.background = 'linear-gradient(135deg, #2e9c76, #0f7c5a)'; // 上一版（白字 3.42）
      document.body.appendChild(b);
    });
    const m = await page.locator('#__drift_probe').evaluate(measureButton);
    expect(isLockedGrad(m.stops), `漂移值不该被判合规（实测 ${m.stops}）`).toBe(false);
  });
});

/* refine3 ③：非主按钮的操作组件（选中态胶囊）统一「浅底 + 同色深字」，
   不再「深绿实心 + 黑字」。用户截图点名的是「我的」浮窗里「每天分钟数」那一排。
   锁：背景是浅薄荷、字是深绿、对比 ≥4.5；字不是近黑。 */
describeRefine3();

function describeRefine3() {
  const fixture: Record<string, string> = (() => {
    const mk = (title: string, n: number) => ({
      title, zh: title, subheads: [''],
      paragraphs: [Array.from({ length: n }, (_, i) => `Sentence ${i} about [[w${i}:w${i}]].`)],
      sentZh: [Array.from({ length: n }, (_, i) => `第 ${i} 句。`)],
      paraZh: [''],
    });
    const titles = ['地球与生命', '校园与文化', '衣食住行', '社会与规则', '历史与发明', '身体与时间'];
    const vocab: Record<string, { m: string }> = {};
    for (let i = 0; i < 12; i++) vocab[`w${i}`] = { m: 'w' + i };
    return { 'sections.json': JSON.stringify(titles.map((t, i) => mk(t, i === 0 ? 12 : 2))), 'vocab.json': JSON.stringify(vocab), 'chapters.json': '[]' };
  })();

  /* refine3 ③ 的续篇（2026-10-08：每天分钟数从胶囊换成滑块）。这一行「当前值」的皮不再靠
     浅薄荷底 + 深绿字的胶囊表达，改成：读数 .min-val 走 --accent-text 深绿、控件走 --accent
     那支绿（accent-color，与随身听 .ls-seek 同源）。本文件按惯例只锁色值，不假装在判达标。 */
  test('refine3 ③ 续：分钟数滑块读数深绿字、控件那支绿是 --accent，且不铺胶囊底', async ({ page }) => {
    await stubData(page, fixture);
    await page.goto(`${rootUrl}/index.html#/home`);
    await waitShadowReady(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    await page.reload();
    await waitShadowReady(page);
    await page.locator('#meCard').click();
    await expect(page.locator('#loginModal')).toBeVisible();
    await page.locator('#loginModal [data-login-settings]').click();
    await expect(page.locator('#mePop')).toBeVisible();
    const m = await page.evaluate(() => {
      const nums = (el: Element | null, prop: keyof CSSStyleDeclaration) => {
        const s = String(getComputedStyle(el as Element)[prop] ?? '');
        return (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
      };
      const range = document.querySelector('#mePop .min-range');
      const val = document.querySelector('#mePop .min-val');
      return {
        accent: nums(range, 'accentColor'),
        valColor: nums(val, 'color'),
        valBg: nums(val, 'backgroundColor'),
        text: (val as HTMLElement).textContent,
      };
    });
    expect(m.accent, '控件那支绿 = var(--accent) 浅色档 #0c9c74，不是 #2bd4a4 / #10b487').toEqual([12, 156, 116]);
    expect(m.valColor, '读数走 --accent-text 深绿 #0a7558，不是黑字').toEqual([10, 117, 88]);
    expect(m.valBg, '读数不再铺一层胶囊底色').toEqual([0, 0, 0]);
    expect(m.text, '读数带单位').toBe('15 分钟');
  });
}
