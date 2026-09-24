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
