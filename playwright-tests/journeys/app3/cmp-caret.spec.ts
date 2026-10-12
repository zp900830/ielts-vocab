// 辨析卡的折叠箭头（2026-10-08 用户截图圈出来：「这个箭头忒小了，都快看不见了」）。
// 两个宿主各一枚：精读段末的 .cmp-card .cmp-caret、随身听抽屉里的 .cmp .chev。
// 锁三件事：字号够大、颜色不再是 --muted 而是 --ink2、字形仍是 ▾ 字符。
// 字形这条不是洁癖：换成图标字体（ri-arrow-*）后，这枚箭头的宽度就寄托在 webfont 上 ——
// 字体没到手时字形宽度塌成 0、整枚消失（门禁已知的一类假红），而可点性提示恰恰只有它。
// 2026-10-10 起图标字体已自托管（不再「一断 CDN 就塌」），这条守卫继续留着：
// 它锁的是「箭头不许依赖 webfont」本身，与字体从哪来无关。
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

/* 辨析卡显示清洗（2026-10-12 用户：「同时展示多个词性，n. n.」「不要 79、78 这种在文章中
   哪里哪里的信息，标的很乱一堆标号」）：渲染层剥掉数据里的「写卡维护语」——
   ① sense 去掉与 pos 重复的词性前缀（素材本来就写着 pos:"n." + sense:"n. 大气"，
      清洗前渲染成 "n. n. 大气"）；
   ② 「（879）」「（卡上例句）」「（课文 474 走 n.）」类句号/出处注不上卡面。
   数据文件里的维护语保持不动（对写卡仍有价值），只在显示前剥。 */
test('辨析卡显示清洗：无「n. n.」重复词性、无句号编号与「卡上」出处注', async ({ page }) => {
  const DIRTY: Record<string, string> = (() => {
    const sections = [{
      title: '地球与生命', zh: '地球与生命', subheads: ['第一卷'],
      paragraphs: [['The [[atmo:atmo]] lifted his [[mood:mood]].', 'Plain sky today.']],
      sentZh: ['大气与心情。', '今天天晴。'],
      paraZh: [''],
    }];
    const mkCmp = {
      type: 'compare', group: 'atmo-mood', title: 'atmo 是地方的气，mood 是人的气。',
      items: [
        { w: 'atmo', pos: 'n.（卡上释义只有名词一档）', sense: 'n. 大气（879）', core: '地之气（卡上例句）', scene: '那地方的那股气（卡上例句）；门上那块匾（1251）' },
        { w: 'mood', pos: 'n. 与 v.', sense: 'n. 心情', core: '人的情绪' },
      ],
      rows: [{ label: '用在哪（课文 474 走 n.）', atmo: '地方/气氛（卡词伙）', mood: '人的情绪（本书 3 处）' }],
    };
    const vocab = {
      atmo: { m: 'n. 大气', p: 'ˈætməsfɪə', cmp: mkCmp },
      mood: { m: 'n. 心情', p: 'muːd', cmp: mkCmp },
    };
    return { 'sections.json': JSON.stringify(sections), 'vocab.json': JSON.stringify(vocab), 'chapters.json': '[]' };
  })();
  await stubData(page, DIRTY);
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => TASK.resetV2());
  await page.locator('.art-card').first().click();
  const block = page.locator('.cmp-block');
  await expect(block).toBeVisible();
  /* 读 textContent（不是 innerText）：卡片默认折叠态，innerText 不输出 display:none 的卡体，
     而清洗锁的靶子（卡体里的 pos/sense/scene）恰在折叠区里。 */
  const text = await block.evaluate((el) => el.textContent || '');
  expect(text, 'pos+sense 不许重复成「n. n.」').not.toMatch(/n\.\s+n\./);
  expect(text, '句号编号「（879）」不许上卡面').not.toMatch(/[（(]\s*\d{1,4}\s*[）)]/);
  expect(text, '「卡上」「课文」「本书」等维护注不许上卡面').not.toMatch(/卡上|卡词伙|课文|本书/);
  expect(text, '编号数字（1251 / 3）不许上卡面').not.toMatch(/\b1251\b|\b879\b/);
  expect(text, '清洗后正文本体还在').toContain('n. 大气');
  expect(text, 'pos 的括号备注剥掉后保留词性本体').toContain('n. 与 v.');
});

