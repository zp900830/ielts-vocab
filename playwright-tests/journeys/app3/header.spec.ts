// 2026-09-25 用户（G）：把「目标词 / 全句译文 / 行内词义」搬进文章头部并定左右 ——
//   目标词 pill 在左侧、紧跟「第 N/6 篇」；全句译文 + 行内词义在右侧、紧在「上一篇」之前；
//   随头部等比例缩放（.shrunk），缩了也不错位；原来下面那一行不再留。
import { test, expect } from '../../fixtures';

declare const TASK: { resetV2(): void; initPlan(minutes: number): void };

const rootUrl = process.env.E2E_ROOT_URL || '';

const BIG: Record<string, string> = (() => {
  const mk = (title: string, ai: number, n: number) => ({
    title, zh: title, subheads: [''],
    paragraphs: [Array.from({ length: n }, (_, i) => `Sentence ${i} about [[a${ai}_w${i}:a${ai}_w${i}]].`)],
    sentZh: [Array.from({ length: n }, (_, i) => `第 ${i} 句。`)],
    paraZh: [''],
  });
  const titles = ['地球与生命', '校园与文化', '衣食住行', '社会与规则', '历史与发明', '身体与时间'];
  const vocab: Record<string, { m: string }> = {};
  for (let a = 0; a < 6; a++) for (let i = 0; i < 40; i++) vocab[`a${a}_w${i}`] = { m: `a${a}_w${i}` };
  return {
    'sections.json': JSON.stringify(titles.map((t, i) => mk(t, i, i === 0 ? 40 : 2))),
    'vocab.json': JSON.stringify(vocab),
    'chapters.json': '[]',
  };
})();

async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/shadow/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}

async function enterTask(page: import('@playwright/test').Page) {
  await stubData(page, BIG);
  await page.goto(`${rootUrl}/app/index.html#/home`);
  await page.waitForFunction(() => {
    try {
      return typeof dataReady !== 'undefined' && dataReady
        && !!(window as unknown as { APP3?: unknown }).APP3
        && document.querySelectorAll('.art-card').length > 0;
    } catch (e) { return false; }
  });
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.locator('.art-card .a-open').first().click();
  await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'read');
  await expect(page.locator('#ttWords')).not.toBeEmpty();
}

async function measure(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const r = (id: string) => document.getElementById(id)!.getBoundingClientRect();
    const fs = (id: string) => parseFloat(getComputedStyle(document.getElementById(id)!).fontSize);
    const knob = document.querySelector('#btnZh .knob')!.getBoundingClientRect();
    return {
      wordsL: r('ttWords').left, zhL: r('btnZh').left, glossL: r('btnGloss').left, prevL: r('ttPrev').left,
      zhR: r('btnZh').right,
      badgeFs: fs('ttWords'), zhFs: fs('btnZh'), knobW: knob.width,
      headR: r('readerHead').right, headL: r('readerHead').left,
    };
  });
}

test.describe('3.0 文章头部（G）：目标词左 / 拨杆右 / 随头部缩放', () => {
  test('DOM 顺序与左右位置：目标词在「第 N/6 篇」后，译文+词义在「上一篇」前', async ({ page }) => {
    await enterTask(page);
    // 原来那一行不再留：控件组必须住在 .reader-head 里
    expect(await page.locator('#taskBadges').evaluate((el) => !!el.closest('.reader-head'))).toBe(true);
    const rel = await page.evaluate(() => {
      const q = (id: string) => document.getElementById(id)!;
      const following = (a: Element, b: Element) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      return {
        posBeforeWords: following(document.querySelector('#ttTitle .r-pos')!, q('ttWords')),
        wordsBeforeZh: following(q('ttWords'), q('btnZh')),
        zhBeforeGloss: following(q('btnZh'), q('btnGloss')),
        glossBeforePrev: following(q('btnGloss'), q('ttPrev')),
        prevBeforeNext: following(q('ttPrev'), q('ttNext')),
      };
    });
    for (const [k, v] of Object.entries(rel)) expect(v, `DOM 顺序 ${k}`).toBe(true);

    const m = await measure(page);
    expect(m.wordsL, '目标词在拨杆左侧').toBeLessThan(m.zhL);
    expect(m.zhL, '译文在词义左侧').toBeLessThan(m.glossL);
    expect(m.zhR, '译文+词义在「上一篇」左侧').toBeLessThan(m.prevL);
    expect(m.wordsL, '目标词在头部左半区').toBeLessThan((m.headL + m.headR) / 2);
  });

  test('随头部 .shrunk 等比例缩小，缩了仍不错位', async ({ page }) => {
    await enterTask(page);
    const before = await measure(page);
    await page.evaluate(() => { document.getElementById('readerHead')!.classList.add('shrunk'); });
    await expect(page.locator('#readerHead')).toHaveClass(/shrunk/);
    const after = await measure(page);
    expect(after.badgeFs, '目标词胶囊字号要缩').toBeLessThan(before.badgeFs);
    expect(after.zhFs, '译文拨杆字号要缩').toBeLessThan(before.zhFs);
    expect(after.knobW, '拨杆滑块要缩').toBeLessThan(before.knobW);
    // 缩了之后左右关系不变
    expect(after.wordsL).toBeLessThan(after.zhL);
    expect(after.zhR).toBeLessThan(after.prevL);
  });
});
