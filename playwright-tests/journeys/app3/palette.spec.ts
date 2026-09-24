// 2026-09-24 用户：主色按钮"太黑"（上一轮为了白字过 AA 压到 #0a8360/#075e46），改回中调薄荷绿。
// 这条锁用「实测对比度数字」说话：把主按钮的渐变色标拆出来，逐个与白字算 WCAG 对比度。
//   ① 最亮那档必须 ≥ 4.5（AA 正文门槛）—— 这是白字能过线的物理上限，不能再浅；
//   ② 最暗那档必须 ≤ 6.6 —— 「不再压得过黑」的可测定义（旧版最暗 7.78，这条在旧代码上必红）。
// 服务器归 global-setup.ts 起停（仓库根 8932）；/app/ 在仓库根，用 E2E_ROOT_URL，不走 baseURL。
import { test, expect } from '../../fixtures';

const rootUrl = process.env.E2E_ROOT_URL || '';
const EMPTY: Record<string, string> = { 'sections.json': '[]', 'vocab.json': '{}', 'chapters.json': '[]' };
async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/shadow/data/${name}*`, (r) => r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}

test.describe('3.0 主按钮中调薄荷绿（实测对比度）', () => {
  test('首页主按钮：白字压渐变的每档都 ≥4.5，且不再压得过黑', async ({ page }) => {
    await stubData(page, EMPTY);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    const btn = page.locator('#homeBanner .b-go');
    await expect(btn).toBeVisible();

    const m = await btn.evaluate((el) => {
      const cs = getComputedStyle(el);
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
    });

    expect(m.color, '主按钮是白字').toBe('rgb(255, 255, 255)');
    expect(m.ratios.length, '渐变要至少两档，否则拆不出最亮/最暗').toBeGreaterThanOrEqual(2);
    const brightest = Math.min(...m.ratios);   // 对比度最低 = 最亮那档
    const darkest = Math.max(...m.ratios);
    expect(brightest, `最亮档要过 AA 正文 4.5（实测 ${m.ratios}）`).toBeGreaterThanOrEqual(4.5);
    expect(darkest, `最暗档别再压得过黑（旧版 7.78；实测 ${m.ratios}）`).toBeLessThanOrEqual(6.6);
  });

  test('「我的」浮窗主按钮同一套渐变（不是两套绿）', async ({ page }) => {
    await stubData(page, EMPTY);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await page.locator('#meCard').click();
    const cta = page.locator('#mePop .mp-cta');
    await expect(cta).toBeVisible();
    const m = await cta.evaluate((el) => {
      const cs = getComputedStyle(el);
      const f = (v: number) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
      const parse = (s: string) => { const mm = /rgba?\(([^)]+)\)/.exec(s || ''); if (!mm) return null;
        const p = mm[1].split(/[,\s/]+/).filter(Boolean).map(parseFloat); return p.length >= 3 ? [p[0], p[1], p[2], p[3] ?? 1] : null; };
      const lum = (c: number[]) => 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
      const over = (fg: number[], bg: number[]) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
      const ratio = (a: number[], b: number[]) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
      const fg = parse(cs.color) || [0, 0, 0, 1];
      const stops: number[][] = []; const re = /rgba?\([^)]+\)/g; let mm: RegExpExecArray | null;
      while ((mm = re.exec(cs.backgroundImage || ''))) { const c = parse(mm[0]); if (c) stops.push(c); }
      return { color: cs.color, ratios: stops.map((s) => +ratio(fg, over(s, [255, 255, 255])).toFixed(2)) };
    });
    expect(m.color).toBe('rgb(255, 255, 255)');
    expect(Math.min(...m.ratios), `最亮档 ${m.ratios}`).toBeGreaterThanOrEqual(4.5);
    expect(Math.max(...m.ratios), `最暗档 ${m.ratios}`).toBeLessThanOrEqual(6.6);
  });
});
