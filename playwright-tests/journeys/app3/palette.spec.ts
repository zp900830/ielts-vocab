// 2026-09-24（第三轮）用户拍板：主按钮退回「深墨字」之前那一版 —— 轻薄荷渐变 #2bd4a4→#0fae7e
// + 白字/白图标 + 通透光晕。实测白字压最亮端 #2bd4a4 只有 1.90:1（最暗端 2.85:1），
// ⚠️ 已知低于 WCAG AA 正文 4.5（纯图标也要 3:1）—— 用户看过实测数字后仍选定这支品牌色，
// 知情接受。所以本门禁**不再按对比度判达标**（那是假达标），改成**锁定色值的回归锁**：
// 把主按钮的渐变色标拆出来与 LOCKED_GRAD 精确比对，只防手滑改浅/改深或改掉字色。
// 下方「色值锁自检」塞一颗漂移值，证明锁真的会响。
// 服务器归 global-setup.ts 起停（仓库根 8932）；/app/ 在仓库根，用 E2E_ROOT_URL，不走 baseURL。
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
    await page.route(`**/shadow/data/${name}*`, (r) => r.fulfill({ status: 200, contentType: 'application/json', body }));
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
    await page.goto(`${rootUrl}/app/index.html#/home`);
    const btn = page.locator('#homeBanner .b-go');
    await expect(btn).toBeVisible();
    assertLockedMint(await btn.evaluate(measureButton), '首页主按钮');
  });

  test('「我的」浮窗主按钮同一套渐变（不是两套绿）', async ({ page }) => {
    await stubData(page, EMPTY);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await page.locator('#meCard').click();
    const cta = page.locator('#mePop .mp-cta');
    await expect(cta).toBeVisible();
    assertLockedMint(await cta.evaluate(measureButton), '「我的」主按钮');
  });

  /* 色值锁自检：塞一颗「旧参数」按钮（#2e9c76→#0f7c5a，上一版），用与实页用例【同一套】量法算 ——
     锁必须把它判为不合规。这条替代了旧的「合成回归：白字 + 太浅薄荷会被 3:1 拦下」：那套对比度门槛
     与用户新选定的 1.90:1 品牌色直接冲突，已删除；现在锁的是色值，不是对比度。 */
  test('色值锁自检：漂移的渐变（旧的 #2e9c76 一版）必须被判不合规', async ({ page }) => {
    await stubData(page, EMPTY);
    await page.goto(`${rootUrl}/app/index.html#/home`);
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

/* ============ 状态胶囊（实底）对比度 ============
   门禁原先的盲区：上面的 measureButton 只读 backgroundImage 里的**渐变档** —— 它是为「主按钮」写的。
   实底胶囊（background-color，backgroundImage=none）它一档都拆不出来，于是整族「深字/白字压实色底」
   的胶囊（.wr-pill / .a-stage / .wd-stage…）从来没被量过。M3 的 `.wr-pill.s-graduated` 白字压
   --accent #0c9c74（3.49:1）就是从这个盲区漏出去的。下面这条按新页面的每一档胶囊逐颗量字/底对比。 */
function measureSolid(el: Element, overRgb: number[]) {
  const cs = getComputedStyle(el as HTMLElement);
  const parse = (s: string): number[] | null => {
    const mm = /rgba?\(([^)]+)\)/.exec(s || '');
    if (!mm) return null;
    const p = mm[1].split(/[,\s/]+/).filter(Boolean).map(parseFloat);
    return p.length >= 3 ? [p[0], p[1], p[2], p.length > 3 ? p[3] : 1] : null;
  };
  const f = (v: number) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
  const lum = (c: number[]) => 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  const comp = (fg: number[], bg: number[]) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
  const ratio = (a: number[], b: number[]) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  const fg = parse(cs.color) || [0, 0, 0, 1];
  const bg = parse(cs.backgroundColor) || [255, 255, 255, 1];
  const bgc = comp(bg, overRgb);            // 半透明底先叠到它所在的那张卡上
  const fgc = comp(fg, bgc);
  return { cls: (el as HTMLElement).className, color: cs.color, bg: cs.backgroundColor, ratio: +ratio(fgc, bgc).toFixed(2) };
}

/* 5 个词 → 5 档胶囊：base(未见面) / seen / owned / leech / graduated。 */
const PILLS: Record<string, string> = (() => {
  const words = ['basew', 'seenw', 'ownedw', 'leechw', 'gradw'];
  const lines = words.map((w, i) => `Sentence ${i} with [[${w}:${w}]].`);
  const sections = [{ title: '胶囊', zh: '胶囊', subheads: ['第一卷'], paragraphs: [lines],
    sentZh: [lines.map((_, i) => `第 ${i + 1} 句。`)], paraZh: [''] }];
  const vocab: Record<string, { m: string }> = {};
  words.forEach((w) => { vocab[w] = { m: 'n. ' + w }; });
  return { 'sections.json': JSON.stringify(sections), 'vocab.json': JSON.stringify(vocab), 'chapters.json': '[]' };
})();

test.describe('3.0 状态胶囊（实底）对比度 ≥ AA 正文 4.5', () => {
  test('单词本每一档胶囊：字压底浅/深都 ≥4.5，毕业胶囊不得再用白字', async ({ page }) => {
    await stubData(page, PILLS);
    await page.goto(`${rootUrl}/app/index.html#/words`);
    await waitShadowReady(page);
    await page.evaluate(() => {
      TASK.resetV2(); TASK.initPlan(15);
      const st = TASK.state();
      const mk = (o: Record<string, unknown>) => Object.assign(ShadowPlan.newWord(), o);
      st.words['gradw'] = mk({ stage: 'graduated', reps: 12, ok3: 1 });
      st.words['seenw'] = mk({ stage: 'seen', reps: 1 });
      st.words['ownedw'] = mk({ stage: 'owned', reps: 4, ok3: 1 });
      st.words['leechw'] = mk({ stage: 'seen', reps: 1, leech: true });
      APP3.route();
    });

    // 覆盖保证：5 档都在（空选择器别假绿）
    await expect(page.locator('.wb-row .wr-pill')).toHaveCount(5);
    await expect(page.locator('.wb-row .wr-pill.s-graduated')).toHaveCount(1);
    await expect(page.locator('.wb-row .wr-pill.s-seen')).toHaveCount(1);
    await expect(page.locator('.wb-row .wr-pill.s-owned')).toHaveCount(1);
    await expect(page.locator('.wb-row .wr-pill.leech')).toHaveCount(1);

    const checkAll = async (over: number[], where: string) => {
      const n = await page.locator('.wb-row .wr-pill').count();
      for (let i = 0; i < n; i++) {
        const m = await page.locator('.wb-row .wr-pill').nth(i).evaluate(measureSolid, over);
        expect(m.ratio, `${where} ${m.cls}：${m.color} 压 ${m.bg} 只有 ${m.ratio}:1（AA 正文要 4.5）`).toBeGreaterThanOrEqual(4.5);
      }
    };
    await checkAll([255, 255, 255], '浅色');
    await page.evaluate(() => document.body.classList.add('dark'));
    await checkAll([37, 34, 32], '深色');

    const gradColor = await page.locator('.wb-row .wr-pill.s-graduated').evaluate((el) => getComputedStyle(el).color);
    expect(gradColor, '毕业胶囊必须是深墨字：白字压 --accent #0c9c74 只有 3.49:1').not.toBe('rgb(255, 255, 255)');
  });
});
