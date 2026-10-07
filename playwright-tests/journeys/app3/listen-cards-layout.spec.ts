/* 2026-10-07 用户两张对照图（调整前/后）锁两件事，全部 390×844 量：
   ① 「本句单词卡」入口从右下挪到右上（与「随身听」大标题同一行）—— 原来压在
      「展开全文」上；② 展开态单词卡挂**顶部**，迷你条沉到 TabBar 正上方：
      字幕窗在上、三键在右下。同轮第二次改：迷你条左下角的句序号删掉，位置信息
      改由抽屉标题「本句单词卡 · 第 N 句 · N 个目标词」承担；第三次（④）又把
      「第 N 句」以角标形式放回字幕窗右上角 —— 绝对定位，不占行。 */
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

  test('② 展开态：抽屉顶挂、迷你条沉底三键贴右，左下角那颗句数已并进标题', async ({ page }) => {
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
    expect(geo.count, '迷你条左下角那颗句数整行删掉（位置改由右上角标 + 标题承担）').toBe(0);
    expect(geo.title.trim(), '抽屉标题：本句单词卡 · 第 N 句 · N 个目标词')
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
    // 2026-10-07 用户第二次加高：真正的判据是「整句落在按键**上方**」，所以窗高要 ≥ 文本 + 遮挡
    expect(g.rollH, `按键吃掉 ${g.overlap}px 后，剩下的净带还得装得下三行英文+一句译文（${g.need}px）`)
      .toBeGreaterThanOrEqual(g.need + g.overlap);
    expect(g.overlap, '按钮行浮在字幕窗之上（字从玻璃键底下穿过去）').toBeGreaterThan(20);
    expect(g.btn, '三颗键加大到好点（≥44）').toBeGreaterThanOrEqual(44);
    expect(g.btnBg, '玻璃键用渐变底，不再是实底薄荷').toMatch(/gradient/);
  });

  /* ④ 2026-10-07 用户采纳建议：句序号删掉后抽屉**关着**时这一屏没有位置信息了，
     把它放回字幕窗**右上角** —— 绝对定位不占行、比标题轻一档、跟着切句走。
     迷你条平时靠 IntersectionObserver 才现形，这里直接加 .show（IO 做的也就是这件事）。 */
  test('④ 位置角标浮在字幕窗右上角：不占行、跟着切句走', async ({ page }) => {
    await gotoListen(page);
    await page.evaluate(() => { document.getElementById('lcMini')!.classList.add('show'); });
    await page.waitForTimeout(350);
    const g = await page.evaluate(() => {
      const r = (s: string) => (document.querySelector(s) as HTMLElement).getBoundingClientRect();
      const pos = document.querySelector('#lcMini .mb-pos') as HTMLElement;
      const roll = r('#lcMini .mb-roll');
      const pr = pos.getBoundingClientRect();
      const fade = parseFloat(getComputedStyle(pos.parentElement as Element).getPropertyValue('--lc-fade-top')) || 0;
      return {
        text: pos.textContent || '',
        pos: getComputedStyle(pos).position,
        pe: getComputedStyle(pos).pointerEvents,
        size: getComputedStyle(pos).fontSize,
        weight: getComputedStyle(pos).fontWeight,
        rightGap: Math.round(roll.right - pr.right),
        // 窗加高后当前句最高能顶到渐隐带下沿（roll.top + fade），角标不许越过这条线
        aboveBand: pr.bottom <= roll.top + fade,
        fade,
        miniH: Math.round(r('#lcMini').height),
        rollH: Math.round(roll.height),
      };
    });
    expect(g.text, '角标只报本篇第几句（与抽屉标题同一个数）').toMatch(/^第 \d+ 句$/);
    expect(g.pos, '绝对定位才不占行').toBe('absolute');
    expect(g.pe, '不许吃掉三颗键的点击').toBe('none');
    expect(Number(g.weight), '比标题轻一档（标题 600）').toBeLessThan(600);
    expect(g.aboveBand, `角标要停在渐隐带（${g.fade}px）之上，不许压到当前句可能到达的最高点`).toBe(true);
    expect(Math.abs(g.rightGap), '贴着窗口右缘').toBeLessThanOrEqual(6);
    expect(g.miniH - g.rollH, '整条高度 = 字幕窗 + 上下内边距，角标没额外撑高')
      .toBeLessThanOrEqual(28);
    // 切句要跟着走
    await page.locator('#lcMini .mb-next').click();
    await expect.poll(() => page.evaluate(() =>
      (document.querySelector('#lcMini .mb-pos') as HTMLElement).textContent), { timeout: 2000 })
      .toBe('第 2 句');
  });
});

/* ⑤ 2026-10-07 用户 PC 截图：三颗键挪到右边、字幕在播放条上居中、「第 N 句」角标去掉。
   「居中」按字面量：文本列的中线要和整条播放条的中线重合，不是挤在按键剩下的那点宽度里。 */
test.describe('随身听迷你条 PC 端：三键靠右 + 字幕真居中 + 无角标', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('⑤ 按键浮在右端，字幕整条居中，角标不出现', async ({ page }) => {
    await gotoListen(page);
    await page.locator('#lcFab').click();
    await page.waitForTimeout(450);
    const g = await page.evaluate(() => {
      const el = (s: string) => document.querySelector(s) as HTMLElement;
      const r = (s: string) => el(s).getBoundingClientRect();
      const mini = r('#lcMini'); const roll = r('#lcMini .mb-roll'); const bar = r('#lcMini .mb-bar');
      const pad = parseFloat(getComputedStyle(el('#lcMini .mb-roll')).paddingLeft);
      const textMid = roll.left + pad + (roll.width - 2 * pad) / 2;
      return {
        posDisplay: getComputedStyle(el('#lcMini .mb-pos')).display,
        barRightGap: Math.round(mini.right - bar.right),
        centerOff: Math.round(textMid - (mini.left + mini.width / 2)),
        overlap: bar.left < roll.right - pad,
        align: getComputedStyle(el('#lcMini .mb-roll')).textAlign,
        curInside: (() => {
          const c = r('#lcMini .mb-row.cur');
          return c.top >= roll.top - 1 && c.bottom <= roll.bottom + 1;
        })(),
      };
    });
    expect(g.posDisplay, 'PC 端不要「第 N 句」角标').toBe('none');
    expect(g.barRightGap, '三颗键贴右缘').toBeLessThanOrEqual(20);
    expect(Math.abs(g.centerOff), `字幕文本列要在整条上正中（实测偏 ${g.centerOff}px）`).toBeLessThanOrEqual(2);
    expect(g.overlap, '字幕文本列不许钻到按键底下').toBe(false);
    expect(g.align).toBe('center');
    expect(g.curInside, '当前句整句落在窗口里').toBe(true);
  });
});
