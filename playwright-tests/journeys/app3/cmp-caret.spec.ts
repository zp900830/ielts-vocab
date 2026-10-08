// 辨析卡的折叠箭头（2026-10-08 用户截图圈出来：「这个箭头忒小了，都快看不见了」）。
// 两个宿主各一枚：精读段末的 .cmp-card .cmp-caret、随身听抽屉里的 .cmp .chev。
// 锁三件事：字号够大、颜色不再是 --muted 而是 --ink2、字形仍是 ▾ 字符。
// 字形这条不是洁癖：换成图标字体（ri-arrow-*）后本机一断 CDN 字形宽度就塌成 0，
// 箭头整枚消失（门禁已知的一类假红），而可点性提示恰恰只有它。
import { test, expect } from '../../fixtures';

const rootUrl = process.env.E2E_ROOT_URL || '';

const CARDS: Record<string, string> = (() => {
  const sections = [{
    title: '地球与生命', zh: '地球与生命', subheads: ['第一卷'],
    paragraphs: [['The [[atmo:atmo]] lifted his [[mood:mood]].', 'Plain sky today.']],
    sentZh: ['大气与心情。', '今天天晴。'],
    paraZh: [''],
  }];
  const vocab = {
    atmo: { m: 'n. 大气', p: 'ˈætməsfɪə', note: '同义词：air',
      cmp: { type: 'compare', group: 'atmo-mood', title: 'atmo 是地方的气，mood 是人的气。', items: [
        { w: 'atmo', pos: 'n.', sense: 'n. 大气', eg: 'thin atmo' },
        { w: 'mood', pos: 'n.', sense: 'n. 心情', eg: 'good mood' }],
        rows: [{ label: '用在哪', atmo: '地方/气氛', mood: '人的情绪' }] } },
    mood: { m: 'n. 心情', p: 'muːd',
      cmp: { type: 'compare', group: 'atmo-mood', title: 'atmo 是地方的气，mood 是人的气。', items: [
        { w: 'atmo', pos: 'n.', sense: 'n. 大气', eg: 'thin atmo' },
        { w: 'mood', pos: 'n.', sense: 'n. 心情', eg: 'good mood' }],
        rows: [{ label: '用在哪', atmo: '地方/气氛', mood: '人的情绪' }] } },
  };
  return { 'sections.json': JSON.stringify(sections), 'vocab.json': JSON.stringify(vocab), 'chapters.json': '[]' };
})();

async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}

async function waitAppReady(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => {
    try {
      return typeof SECTIONS !== 'undefined' && SECTIONS.length > 0
        && typeof TASK !== 'undefined';
    } catch (e) { return false; }
  });
}
declare const SECTIONS: unknown[];
declare const TASK: { resetV2(): void };

/* 把 CSS 变量解析成浏览器实际用的 rgb() 串：直接比十六进制会因写法不同假红。 */
const resolveVar = (page: import('@playwright/test').Page, name: string) =>
  page.evaluate((v) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${v})`;
    probe.style.display = 'none';
    document.body.appendChild(probe);
    const rgb = getComputedStyle(probe).color;
    probe.remove();
    return rgb;
  }, name);

const caretStyles = (page: import('@playwright/test').Page, sel: string) =>
  page.evaluate((s) => Array.from(document.querySelectorAll(s)).map((n) => {
    const cs = getComputedStyle(n);
    return { size: parseFloat(cs.fontSize), color: cs.color, text: (n.textContent || '').trim() };
  }), sel);

async function expectVisibleCarets(page: import('@playwright/test').Page, sel: string, host: string) {
  const list = await caretStyles(page, sel);
  expect(list.length, `${host}里要有箭头可量`).toBeGreaterThanOrEqual(1);
  const ink2 = await resolveVar(page, '--ink2');
  list.forEach((st, i) => {
    expect(st.size, `${host}第 ${i + 1} 枚字号 ${st.size}px，太小就等于没有`).toBeGreaterThanOrEqual(18);
    expect(st.text, `${host}第 ${i + 1} 枚不许换成图标字体（断 CDN 时字形宽度塌成 0）`).toBe('▾');
    expect(st.color, `${host}第 ${i + 1} 枚颜色要从 --muted 提到 --ink2`).toBe(ink2);
  });
}

test.describe('辨析卡的折叠箭头看得见', () => {
  test('精读段末那张卡：箭头 ≥18px、颜色是 --ink2、字形仍是 ▾', async ({ page }) => {
    await stubData(page, CARDS);
    await page.goto(`${rootUrl}/index.html#/home`);
    await waitAppReady(page);
    await page.evaluate(() => TASK.resetV2());          // 无计划 = 常规阅读，卡片照样挂段末
    await page.locator('.art-card').first().click();
    await expect(page.locator('.cmp-card .cmp-caret'), '辨析卡要渲染出来才有箭头可量').toHaveCount(1);
    await expectVisibleCarets(page, '.cmp-card .cmp-caret', '精读');
  });

  test('随身听抽屉里那枚同口径（两宿主一把尺子）', async ({ page }) => {
    await stubData(page, CARDS);
    await page.goto(`${rootUrl}/index.html#/listen`);
    await waitAppReady(page);
    await page.locator('#lcFab').click();
    await expect(page.locator('#lcDrawer .cmp .chev').first(), '抽屉卡片里有辨析块').toBeVisible();
    await expectVisibleCarets(page, '#lcDrawer .cmp .chev', '抽屉');
  });
});

