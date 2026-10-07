/* 2026-10-07 用户两张对照图（调整前/后）锁两件事，全部 390×844 量：
   ① 「本句单词卡」入口从右下挪到右上（与「随身听」大标题同一行）—— 原来压在
      「展开全文」上；② 展开态单词卡挂**顶部**，迷你条沉到 TabBar 正上方：
      字幕窗在上、三键在右下。同轮第二次改：迷你条左下角的句序号删掉，
      位置信息只留抽屉标题「本句单词卡 · 第 N 句 · N 个目标词」。 */
import { test, expect } from '../../fixtures';
import { waitShadowReady } from '../../utils/app-ready';

const rootUrl = process.env.E2E_ROOT_URL || '';

const TWO: Record<string, string> = (() => {
  const mk = (title: string, lines: string[]) => ({
    title, zh: title, subheads: ['第一卷'],
    paragraphs: [lines],
    sentZh: [lines.map((_, i) => `第 ${i + 1} 句译文。`)],
    paraZh: [''],
  });
  const sections = [
    mk('地球与生命', ['The [[atmosphere:atmosphere]] protects life.', 'We need [[oxygen:oxygen]] to live.',
      'The [[atmosphere:atmosphere]] keeps us warm.', 'Plants give us [[oxygen:oxygen]].']),
    mk('校园与图书馆', ['A [[library:library]] is quiet.', 'The [[library:library]] opens late.']),
  ];
  const vocab = { atmosphere: { m: 'n. 大气' }, oxygen: { m: 'n. 氧气' }, library: { m: 'n. 图书馆' } };
  return { 'sections.json': JSON.stringify(sections), 'vocab.json': JSON.stringify(vocab), 'chapters.json': '[]' };
})();

async function gotoListen(page: import('@playwright/test').Page) {
  for (const [name, body] of Object.entries(TWO)) {
    await page.route(`**/shadow/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
  await page.goto(`${rootUrl}/app/index.html#/listen`);
  await waitShadowReady(page);
  await page.waitForFunction(() => {
    const w = window as unknown as { APP3?: { renderListen?: unknown } };
    const v = document.getElementById('appView');
    return !!(w.APP3 && typeof w.APP3.renderListen === 'function' && v && v.querySelector('.listen-page'));
  }, undefined, { timeout: 20000 });
  await page.waitForFunction(() => {
    const f = document.getElementById('lcFab');
    return !!f && !f.hidden;
  }, undefined, { timeout: 20000 });
}

test.use({ viewport: { width: 390, height: 844 } });

test.describe('随身听单词卡：入口右上 + 抽屉顶挂 + 迷你条沉底', () => {
  test('① 入口在右上角，与标题同行，不压播放卡', async ({ page }) => {
    await gotoListen(page);
    const geo = await page.evaluate(() => {
      const r = (s: string) => {
        const b = document.querySelector(s)!.getBoundingClientRect();
        return { x: b.left, y: b.top, r: b.right, b: b.bottom };
      };
      return { fab: r('#lcFab'), title: r('.pg-title'), expand: r('.ls-expand') };
    });
    expect(geo.fab.y, '入口要贴在视口顶部（标题那一行）').toBeLessThan(80);
    expect(geo.fab.y, '和标题同一行，不是浮在标题上面老远').toBeLessThan(geo.title.b);
    expect(geo.fab.r, '靠右缘').toBeGreaterThan(390 - 32);
    expect(geo.fab.b, '不许压到播放卡的展开键').toBeLessThan(geo.expand.y);
  });

  test('② 展开态：抽屉顶挂、迷你条沉底三键贴右，句序号只在抽屉标题里', async ({ page }) => {
    await gotoListen(page);
    await page.locator('#lcFab').click();
    await expect(page.locator('#lcDrawer')).toHaveClass(/open/);
    await page.waitForTimeout(450);
    const geo = await page.evaluate(() => {
      const r = (s: string) => {
        const b = document.querySelector(s)!.getBoundingClientRect();
        return { x: b.left, y: b.top, r: b.right, b: b.bottom };
      };
      return {
        drawer: r('#lcDrawer'), mini: r('#lcMini'), roll: r('#lcMini .mb-roll'),
        bar: r('#lcMini .mb-bar'), prev: r('#lcMini .mb-prev'), next: r('#lcMini .mb-next'),
        nav: r('.sidenav'),
        count: document.querySelectorAll('#lcMini .mb-count').length,
        title: (document.getElementById('lcTitle') as HTMLElement).textContent || '',
      };
    });
    expect(geo.drawer.y, '单词卡挂顶部').toBeLessThanOrEqual(1);
    expect(geo.drawer.b, '顶挂抽屉不许吃掉整屏').toBeLessThan(844 * 0.8);
    expect(geo.drawer.b, '抽屉不许盖住沉底迷你条（盖住就点不到切句键）').toBeLessThanOrEqual(geo.mini.y + 1);
    expect(geo.mini.b, '迷你条贴在 TabBar 正上方').toBeLessThanOrEqual(geo.nav.y + 1);
    expect(geo.roll.y, '字幕窗在按钮行上面').toBeLessThan(geo.bar.y);
    expect(geo.next.r, '三键在右').toBeGreaterThan(390 - 60);
    // .mb-bar 是 left/right:14 的绝对层，光看它的 x 没意义 —— 要看最左那颗键真被推到右端
    expect(geo.prev.x, '三键整排贴右，不许散回左边（句数那颗的 auto margin 已删）')
      .toBeGreaterThan(200);
    // 2026-10-07 用户：「去掉左下角第x/xxx句，和左上角第 x 句的信息合并」
    expect(geo.count, '迷你条左下角的句序号整个删掉').toBe(0);
    expect(geo.title.trim(), '抽屉标题是唯一出口：本句单词卡 · 第 N 句 · N 个目标词')
      .toMatch(/^本句单词卡 · 第 \d+ 句 · \d+ 个目标词$/);
  });

  test('③ 字幕窗加高到「三行英文 + 一句译文」，三颗玻璃键浮在它下沿', async ({ page }) => {
    await gotoListen(page);
    await page.locator('#lcFab').click();
    await page.waitForTimeout(450);
    const g = await page.evaluate(() => {
      const r = (s: string) => (document.querySelector(s) as HTMLElement).getBoundingClientRect();
      const cs = (s: string, p: string) => getComputedStyle(document.querySelector(s) as Element)[p as 'fontSize'];
      const lh = parseFloat(cs('#lcMini .mb-row .sent', 'lineHeight')) || 23;
      const lhz = parseFloat(cs('#lcMini .mb-row .sent-zh', 'lineHeight')) || 19;
      return {
        rollH: Math.round(r('#lcMini .mb-roll').height),
        need: Math.round(lh * 3 + lhz),
        overlap: Math.round(r('#lcMini .mb-roll').bottom - r('#lcMini .mb-bar').top),
        btn: Math.round(r('#lcMini .mb-next').width),
        btnBg: cs('#lcMini .mb-next', 'backgroundImage').slice(0, 24),
      };
    });
    // 三行英文 + 一句译文：行高按实测算，别写死字面量
    expect(g.rollH, `字幕窗 ${g.rollH}px 要装得下三行英文+一句译文（${g.need}px）再加被键压住的那截`).toBeGreaterThanOrEqual(g.need);
    expect(g.overlap, '按钮行浮在字幕窗之上（字从玻璃键底下穿过去）').toBeGreaterThan(20);
    expect(g.btn, '三颗键加大到好点（≥44）').toBeGreaterThanOrEqual(44);
    expect(g.btnBg, '玻璃键用渐变底，不再是实底薄荷').toMatch(/gradient/);
  });
});
