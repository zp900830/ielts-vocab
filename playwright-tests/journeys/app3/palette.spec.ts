// 2026-09-24（第二轮）用户：全局主色按钮「太重太辣眼」，改「轻渐变薄荷 + 通透感」。
// 这条锁用「实测对比度数字」说话：把主按钮的渐变色标拆出来，逐个与白字算 WCAG 对比度。
//   ① 最亮那档必须 ≥ WHITE_MIN = 3.0 —— 这是【用户已知情并接受】的取舍：
//      白字压浅薄荷过不了 AA 正文 4.5（参考图那颗「开始学习」实测只有 ≈2.0:1），
//      用户看过实测数字后仍选「浅薄荷 + 白字」。3:1 是「不会到看不清」的硬底线。
//      下方「合成回归」那条探针就是下次有人手滑调太浅（≈2.0）时的警报。
//   ② 最亮那档必须 ≤ 4.0 —— 锁「确实变轻了」：旧版 #0b8663 白字 4.56，在旧代码上这条必红（反向验证）。
//   ③ 最暗那档 ≤ 6.6 —— 别再压得过黑（旧版 #0a7050 是 6.09）。
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
const WHITE_MIN = 3.0;          // 用户知情下限（白字压主色按钮）；AA 正文 4.5 在这里是被主动放弃的
const WHITE_MAX_LIGHT = 4.0;    // 「确实变轻」的上界：旧版 4.56 超过它 → 反向验证必红
const EMPTY: Record<string, string> = { 'sections.json': '[]', 'vocab.json': '{}', 'chapters.json': '[]' };
async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/shadow/data/${name}*`, (r) => r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}

/* 量一颗控件：白字 vs 它 backgroundImage 里的每一档渐变色标（半透明先叠白纸），
   返回 { color, ratios }。两个实页用例与「合成回归」探针共用同一套算法 —— 探针量的就是门禁量的。 */
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
  return { color: cs.color, ratios: stops.map((s) => +ratio(fg, over(s, [255, 255, 255])).toFixed(2)) };
}

function assertLightMint(m: { color: string; ratios: number[] }, where: string) {
  expect(m.color, `${where} 是白字`).toBe('rgb(255, 255, 255)');
  expect(m.ratios.length, `${where} 渐变要至少两档，否则拆不出最亮/最暗`).toBeGreaterThanOrEqual(2);
  const brightest = Math.min(...m.ratios);
  const darkest = Math.max(...m.ratios);
  expect(brightest, `${where} 最亮档要过用户下限 3:1（实测 ${m.ratios}）`).toBeGreaterThanOrEqual(WHITE_MIN);
  expect(brightest, `${where} 要确实变轻：最亮档 ≤ ${WHITE_MAX_LIGHT}（旧版 4.56 在这条上必红；实测 ${m.ratios}）`).toBeLessThanOrEqual(WHITE_MAX_LIGHT);
  expect(darkest, `${where} 最暗档别再压得过黑（实测 ${m.ratios}）`).toBeLessThanOrEqual(6.6);
}

test.describe('3.0 主按钮轻渐变薄荷（实测对比度）', () => {
  test('首页主按钮：白字压浅薄荷每档 ≥3:1，且确实比旧版轻', async ({ page }) => {
    await stubData(page, EMPTY);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    const btn = page.locator('#homeBanner .b-go');
    await expect(btn).toBeVisible();
    assertLightMint(await btn.evaluate(measureButton), '首页主按钮');
  });

  test('「我的」浮窗主按钮同一套渐变（不是两套绿）', async ({ page }) => {
    await stubData(page, EMPTY);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await page.locator('#meCard').click();
    const cta = page.locator('#mePop .mp-cta');
    await expect(cta).toBeVisible();
    assertLightMint(await cta.evaluate(measureButton), '「我的」主按钮');
  });

  /* 合成回归（下次有人手滑调太浅的警报）：塞一颗「白字 + 参考图那档浅薄荷」的探针，
     用与上面实页用例【同一套】量法算 —— 它必须掉到 3:1 门槛之下，证明门槛真的会响。
     2026-09-24（第二轮）用户原话的参考图那颗就是 ≈2.0:1；这条把「抄参考图」这件事钉成红灯。 */
  test('合成回归：白字 + 参考图那档浅薄荷（≈2.0）会被 3:1 门槛拦下', async ({ page }) => {
    await stubData(page, EMPTY);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await page.evaluate(() => {
      const b = document.createElement('button');
      b.id = '__too_light_probe';
      b.textContent = '开始学习';
      b.style.color = '#fff';
      b.style.background = 'linear-gradient(135deg, #57cba8, #4fc9a4)'; // 白字 ≈2.00 / 2.05
      document.body.appendChild(b);
    });
    const m = await page.locator('#__too_light_probe').evaluate(measureButton);
    const brightest = Math.min(...m.ratios);
    expect(brightest, `参考图那档实测应 < 3:1 门槛（实测 ${m.ratios}）`).toBeLessThan(WHITE_MIN);
    expect(brightest, `它正好≈2.0，别让探针漂走（实测 ${m.ratios}）`).toBeLessThan(2.2);
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
