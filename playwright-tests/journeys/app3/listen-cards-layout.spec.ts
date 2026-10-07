/* 2026-10-07 用户多轮截图（全部 390×844 量）锁这几件事：
   ① 「本句单词卡」入口从右下挪到右上（与「随身听」大标题同一行）—— 原来压在
      「展开全文」上；② 展开态单词卡挂**顶部**，迷你条沉到底：字幕窗在上、三键在右下；
      ③ 字幕窗加高到「三行英文 + 一句译文」，三颗玻璃键浮在它下沿；
   ④ 句序号只留抽屉标题一处（迷你条左下角 → 字幕窗角标 → 全部撤掉，用户：「这是重复信息」），
      标题本身改成「第 xx / xxx 句」+ 目标词数量胶囊（复用文章头部那颗琥珀 .r-badge）；
   ⑤ 移动端抽屉开着 = 一整屏阅读面，底部 TabBar 整条隐藏，迷你条落到屏底；
   ⑥ PC 端（1280）三键靠右 + 字幕整条真居中；
   ⑦ 抽屉与「展开全文阅读」两处收起键同一个类、同一个矩形（390 实测两枚都是右 357 / 上 15 / 58×30）；
   ⑧ PC 档同档口径：两枚各自贴住本条栏右缘、顶边一致（两条栏宽度本就不同，不谈像素重合）；
   ⑨ 展开态顶栏标题的左内距（照抄 .reader-head 时把垫返回键的 6px 一起抄了过来，标题压进圆弧）。 */
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

/* 收起键探针（⑦⑧ 共用）：样式量 computed、落点量矩形，「居右」量的是键右缘到**本条栏内容右缘**
   的净距离 —— `margin-left: auto` 到了 computed 里已经被浏览器算成像素值，量不出「贴住右端」这件事。 */
function collapseProbe(el: HTMLElement) {
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const bar = el.parentElement as HTMLElement;
  const bcs = getComputedStyle(bar);
  const br = bar.getBoundingClientRect();
  return {
    cls: el.className,
    right: Math.round(r.right), top: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
    color: cs.color, bg: cs.backgroundColor, border: `${cs.borderTopWidth} ${cs.borderTopStyle}`,
    radius: cs.borderRadius, fs: cs.fontSize, fw: cs.fontWeight, pad: cs.padding,
    iconFs: getComputedStyle(el.querySelector('i')!).fontSize,
    flushRight: Math.round(br.right - parseFloat(bcs.paddingRight) - parseFloat(bcs.borderRightWidth || '0') - r.right),
    inRightHalf: r.left + r.width / 2 > br.left + br.width / 2,
  };
}
/* 量之前先等字体与入场动画落定：这颗键是内容宽，webfont 一 swap 就漂 1px（同一份 CSS 两次量到
   57/58 就是这么来的）；而 .listen-top 的 lsBarIn 还在跑时顶边差 14px。⑦⑧ 量的正是像素，
   这两件事不排掉就是随机红。
   还要先把鼠标挪开 —— 两枚键现在落在**同一个矩形**，点完抽屉那颗之后鼠标就停在原地，
   展开态那颗正好接手一个 :hover（bg 从 transparent 变成 --accent-soft），实测就是这么红的。 */
async function probeCollapse(page: import('@playwright/test').Page, sel: string) {
  await page.mouse.move(0, 0);
  await page.evaluate(async () => {
    try { await document.fonts.ready; } catch (e) {}
    document.getAnimations().forEach((a) => { try { a.finish(); } catch (e) {} });
  });
  await page.waitForTimeout(120);
  return page.locator(sel).evaluate(collapseProbe);
}

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

  test('② 展开态：抽屉顶挂、迷你条沉底三键贴右，标题「第 N / M 句」+ 目标词胶囊', async ({ page }) => {
    await gotoListen(page);
    await page.locator('#lcFab').click();
    await expect(page.locator('#lcDrawer')).toHaveClass(/open/);
    await page.waitForTimeout(450);
    const geo = await page.evaluate(() => {
      const r = (s: string) => {
        const b = document.querySelector(s)!.getBoundingClientRect();
        return { x: b.left, y: b.top, r: b.right, b: b.bottom };
      };
      const chip = document.getElementById('lcWords') as HTMLElement;
      const cs = getComputedStyle(chip);
      const cr = chip.getBoundingClientRect();
      const title = (document.getElementById('lcTitle') as HTMLElement).getBoundingClientRect();
      const close = (document.getElementById('lcClose') as HTMLElement).getBoundingClientRect();
      return {
        drawer: r('#lcDrawer'), mini: r('#lcMini'), roll: r('#lcMini .mb-roll'),
        bar: r('#lcMini .mb-bar'), prev: r('#lcMini .mb-prev'), next: r('#lcMini .mb-next'),
        count: document.querySelectorAll('#lcMini .mb-count').length,
        posDots: document.querySelectorAll('#lcMini .mb-pos').length,
        title: title.width,
        titleTxt: (document.getElementById('lcTitle') as HTMLElement).textContent || '',
        chip: chip.textContent || '',
        chipCls: chip.className,
        chipBg: cs.backgroundColor, chipFg: cs.color,
        chipVsClose: Math.round(cr.right - close.left),
        chipGapToTitle: Math.round(cr.left - title.right),
      };
    });
    expect(geo.drawer.y, '单词卡挂顶部').toBeLessThanOrEqual(1);
    expect(geo.drawer.b, '顶挂抽屉不许吃掉整屏').toBeLessThan(844 * 0.8);
    expect(geo.drawer.b, '抽屉不许盖住沉底迷你条（盖住就点不到切句键）').toBeLessThanOrEqual(geo.mini.y + 1);
    expect(geo.mini.b, '抽屉开着 = 底栏整条隐藏，迷你条落到视口底（见 ⑤）').toBeGreaterThanOrEqual(843);
    expect(geo.roll.y, '字幕窗在按钮行上面').toBeLessThan(geo.bar.y);
    expect(geo.next.r, '三键在右').toBeGreaterThan(390 - 60);
    // .mb-bar 是 left/right:14 的绝对层，光看它的 x 没意义 —— 要看最左那颗键真被推到右端
    expect(geo.prev.x, '三键整排贴右，不许散回左边（句数那颗的 auto margin 已删）')
      .toBeGreaterThan(200);
    // 2026-10-07 用户：「去掉左下角第x/xxx句」+「播放条上的第 x 句去掉啊。这是重复信息」
    expect(geo.count, '迷你条左下角那颗句数整行删掉').toBe(0);
    expect(geo.posDots, '字幕窗右上角的「第 N 句」角标也撤了：位置信息只留抽屉标题一处').toBe(0);
    expect(geo.titleTxt.trim(), '抽屉标题：第 N / M 句（M = 本篇总句数）').toMatch(/^第 \d+ \/ \d+ 句$/);
    expect(geo.chip.trim(), '词数从标题文字改成胶囊读数').toMatch(/^目标词 \d+$/);
    // 「样式和图片中的页面右上角一样」= 同一个类、同一份样式，不是仿写
    expect(geo.chipCls, '胶囊复用文章头部那两个类').toBe('r-badge fav-badge');
    expect(geo.chipBg, '琥珀底同 .fav-badge').toBe('rgb(253, 241, 220)');
    expect(geo.chipFg, '琥珀深字同 .fav-badge').toBe('rgb(138, 95, 10)');
    expect(geo.chipVsClose, '胶囊停在收起键左边，不许叠上去').toBeLessThanOrEqual(0);
    // 「组合」按字面做：胶囊紧贴标题排在左边一组，收起键仍独占行右端（margin-left:auto）
    expect(Math.abs(geo.chipGapToTitle - 8), `胶囊与标题的实际间距 ${geo.chipGapToTitle}px 应等于 .dw-head 的 gap`)
      .toBeLessThanOrEqual(1);
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

  /* ④ 2026-10-07 用户（阅读页截图）：「下面播放条上的『第 x 句』去掉啊。这是重复信息」——
     上一轮补的那枚字幕窗右上角轻角标本轮整颗从 DOM 撤掉，位置信息只留抽屉标题一处。
     迷你条平时靠 IntersectionObserver 才现形，这里直接加 .show（IO 做的也就是这件事）。 */
  test('④ 迷你条不重复报句序号：.mb-pos 整颗撤掉，切句仍跟着走', async ({ page }) => {
    await gotoListen(page);
    await page.evaluate(() => { document.getElementById('lcMini')!.classList.add('show'); });
    await page.waitForTimeout(350);
    const g = await page.evaluate(() => {
      const r = (s: string) => (document.querySelector(s) as HTMLElement).getBoundingClientRect();
      const mini = document.getElementById('lcMini') as HTMLElement;
      return {
        dots: document.querySelectorAll('#lcMini .mb-pos').length,
        padTop: getComputedStyle(mini).paddingTop,
        miniH: Math.round(r('#lcMini').height),
        rollH: Math.round(r('#lcMini .mb-roll').height),
      };
    });
    expect(g.dots, '字幕窗右上角那颗角标整颗撤掉（DOM 里都不该有）').toBe(0);
    expect(g.padTop, '上一轮为角标多给的 4px 顶垫一起回收，回到基础内边距').toBe('10px');
    expect(g.miniH - g.rollH, '整条高度 = 字幕窗 + 上下内边距，没有第三样东西把它撑高')
      .toBeLessThanOrEqual(23);
    // 撤掉角标不能把切句联动一起带走：高亮行要跟着挪
    await page.locator('#lcMini .mb-next').click();
    await expect.poll(() => page.evaluate(() =>
      document.querySelector('#lcMini .mb-row.cur')?.getAttribute('data-g')), { timeout: 2000 }).toBe('1');
  });

  /* ⑤ 2026-10-07 用户：移动端本句单词卡页面需要隐藏导航 —— 抽屉那一屏是整屏阅读面，
     底下那条 TabBar(z=300) 压在迷你条下面既占位又分流注意力。--tabbar-h 同时归零，
     迷你条落到屏底、抽屉把那一截高度收回去。 */
  test('⑤ 抽屉开 → TabBar 整条滑出视口、迷你条落屏底；收起 → 原样回来', async ({ page }) => {
    await gotoListen(page);
    const before = await page.evaluate(() => {
      const nav = document.querySelector('.sidenav') as HTMLElement;
      return {
        vis: getComputedStyle(nav).visibility,
        y: Math.round(nav.getBoundingClientRect().top),
        tabbar: getComputedStyle(document.documentElement).getPropertyValue('--tabbar-h').trim(),
      };
    });
    expect(before.vis, '没开抽屉时导航照常可见').toBe('visible');
    expect(before.y, '没开抽屉时导航停在视口之内').toBeLessThan(844);
    expect(before.tabbar, 'positionListenMini 已把底栏实测高写进 --tabbar-h').not.toBe('');

    await page.locator('#lcFab').click();
    await expect(page.locator('#lcDrawer')).toHaveClass(/open/);
    await page.waitForTimeout(500);
    const open = await page.evaluate(() => {
      const nav = document.querySelector('.sidenav') as HTMLElement;
      const cs = getComputedStyle(nav);
      const mini = (document.getElementById('lcMini') as HTMLElement).getBoundingClientRect();
      const drawer = (document.getElementById('lcDrawer') as HTMLElement).getBoundingClientRect();
      const first = (document.querySelector('.sidenav .nav-item') as HTMLElement).getBoundingClientRect();
      return {
        vis: cs.visibility, pe: cs.pointerEvents, navY: Math.round(nav.getBoundingClientRect().top),
        itemY: Math.round(first.top), miniBottom: Math.round(mini.bottom), miniY: Math.round(mini.top),
        drawerB: Math.round(drawer.bottom),
        tabbar: getComputedStyle(document.body).getPropertyValue('--tabbar-h').trim(),
      };
    });
    expect(open.vis, '抽屉开着：底栏从无障碍树/Tab 序里一起摘掉（不是只挪位置）').toBe('hidden');
    expect(open.pe, 'pointer-events 也关掉').toBe('none');
    expect(open.navY, '整条滑到视口之下').toBeGreaterThanOrEqual(844);
    expect(open.itemY, 'Tab 键本身也跟着出去了，够不着').toBeGreaterThanOrEqual(844);
    expect(open.tabbar, 'body.dw-open 时 --tabbar-h 归零（迷你条和抽屉都读它）').toBe('0px');
    expect(open.miniBottom, '迷你条落到视口底，原来那条底栏那一截归它').toBeGreaterThanOrEqual(843);
    expect(open.drawerB, '抽屉仍不许盖住迷你条（盖住就点不到切句键）').toBeLessThanOrEqual(open.miniY + 1);

    // 关抽屉前先把迷你条钉在显示态（它平时靠 IO，播放卡在视口内时收起后本就该藏起来）
    await page.evaluate(() => { document.getElementById('lcMini')!.classList.add('show'); });
    await page.locator('#lcClose').click();
    await page.waitForTimeout(500);
    const after = await page.evaluate(() => {
      const nav = document.querySelector('.sidenav') as HTMLElement;
      const mini = (document.getElementById('lcMini') as HTMLElement).getBoundingClientRect();
      return {
        vis: getComputedStyle(nav).visibility,
        y: Math.round(nav.getBoundingClientRect().top),
        miniBottom: Math.round(mini.bottom),
        tabbar: getComputedStyle(document.body).getPropertyValue('--tabbar-h').trim(),
      };
    });
    expect(after.vis, '收起后导航原样回来').toBe('visible');
    expect(after.y, '导航回到屏底').toBeLessThan(844);
    expect(after.tabbar, 'body 上那条 --tabbar-h:0 一起撤掉，回到 html 的实测值').not.toBe('0px');
    expect(after.miniBottom, '迷你条重新停在 TabBar 正上方').toBeLessThanOrEqual(after.y + 1);
  });

  /* ⑦ 2026-10-07 用户：「展开的本句单词卡和展开全文阅读页面。收起按钮都使用展开全文阅读页面的
     收起按钮样式。位置均居右侧，位置一样。」
     「样式一致」按用户口径 = 同一个 CSS 类，不是仿写声明；「位置一样」按字面 = 两个状态各量一次，
     同一个矩形（右缘 / 顶边 / 宽高）实测重合，不是「都在右边大概那个位置」。
     两处不同容器（居中玻璃胶囊 vs 通栏面板）能重合，靠的是抽屉在手机档把胶囊那 18px 窗距
     补进右内距、并把顶边对齐到 8+1+6=15px —— 数值改动一发生这条就红，正是为了拦住「改回一套」。 */
  test('⑦ 两处收起键：同一个类、同一个落点（右缘 / 顶边 / 尺寸实测重合）', async ({ page }) => {
    await gotoListen(page);
    await page.locator('#lcFab').click();
    await expect(page.locator('#lcDrawer')).toHaveClass(/open/);
    await page.waitForTimeout(450);
    const dw = await probeCollapse(page, '#lcClose');

    await page.locator('#lcClose').click();
    await expect(page.locator('#lcDrawer')).not.toHaveClass(/open/);
    await page.evaluate(() => { (TASK as unknown as { listenExpand(): void }).listenExpand(); });
    await expect(page.locator('body')).toHaveClass(/listen-mode/);
    await expect(page.locator('#listenTop')).toBeVisible();
    const lt = await probeCollapse(page, '#lsClose');

    expect(lt.cls, '抽屉那颗直接挂展开全文阅读那颗的类（复用，不是仿写）').toBe(dw.cls);
    expect(dw.cls, '两处都是 .ls-collapse').toContain('ls-collapse');
    for (const k of ['color', 'bg', 'border', 'radius', 'fs', 'fw', 'pad', 'iconFs', 'h', 'w'] as const) {
      expect(dw[k], `收起键样式第 ${k} 项两处不一致`).toBe(lt[k]);
    }
    expect(dw.flushRight, '抽屉那颗贴住栏右缘').toBe(0);
    expect(lt.flushRight, '展开态那颗贴住栏右缘（原先它在最左，现在挪到右端）').toBe(0);
    expect(dw.right, '两枚收起键右缘到视口右缘重合').toBe(lt.right);
    expect(dw.top, '顶边也同档（抽屉 15 = 胶囊 8+1+6）').toBe(lt.top);
    const vw = 390;
    expect(lt.right, '展开态那颗确实在右端（不是还留在左边）').toBeGreaterThan(vw / 2);
    expect(vw - lt.right, '右缘距视口 = 胶囊那 33px 一档').toBeLessThanOrEqual(34);
  });

  /* ⑨ 2026-10-07 用户圈图「这个标题位置需要有内间距啊」：这条栏是照抄任务模式 .reader-head 来的，
     连左内距 6px 一起抄 —— 但那 6px 是给 30px 圆形返回键垫的，键本身填掉了胶囊左端那截圆弧。
     本栏没有返回键，标题第一个字就压在圆弧里（栏高 44 → 左端半圆半径 22，字却从第 7px 开始）。
     量法：标题矩形左缘到**栏边框盒左缘**的净距离，左右两边都要 ≥12 且互相对称。 */
  test('⑨ 展开态顶栏标题有左内距（不压在胶囊圆弧里），左右对称', async ({ page }) => {
    await gotoListen(page);
    await page.evaluate(() => { (TASK as unknown as { listenExpand(): void }).listenExpand(); });
    await expect(page.locator('body')).toHaveClass(/listen-mode/);
    await expect(page.locator('#listenTop')).toBeVisible();
    await page.mouse.move(0, 0);
    await page.evaluate(async () => {
      try { await document.fonts.ready; } catch (e) {}
      document.getAnimations().forEach((a) => { try { a.finish(); } catch (e) {} });
    });
    await page.waitForTimeout(120);
    const g = await page.evaluate(() => {
      const bar = document.getElementById('listenTop') as HTMLElement;
      const title = bar.querySelector('.r-title') as HTMLElement;
      const key = document.getElementById('lsClose') as HTMLElement;
      const br = bar.getBoundingClientRect(), tr = title.getBoundingClientRect(), kr = key.getBoundingClientRect();
      return {
        barH: Math.round(br.height),
        left: Math.round(tr.left - br.left),
        right: Math.round(br.right - kr.right),
      };
    });
    expect(g.left, `标题左内距实测 ${g.left}px：要 ≥12 才出得了半径 ${Math.round(g.barH / 2)}px 的左端圆弧`).toBeGreaterThanOrEqual(12);
    expect(g.right, `栏右内距（收起键到边框盒，margin-left:auto 贴到底）=${ g.right}px，左边要与之对称`).toBe(g.left);
  });
});

/* ⑥ 2026-10-07 用户 PC 截图：三颗键挪到右边、字幕在播放条上居中（「第 N 句」那颗本条 ④ 已整颗撤掉）。
   「居中」按字面量：文本列的中线要和整条播放条的中线重合，不是挤在按键剩下的那点宽度里。 */
test.describe('随身听迷你条 PC 端：三键靠右 + 字幕真居中', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('⑥ 按键浮在右端，字幕整条居中', async ({ page }) => {
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
        posDots: document.querySelectorAll('.mb-pos').length,
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
    expect(g.posDots, '「第 N 句」角标两端都不再有').toBe(0);
    expect(g.barRightGap, '三颗键贴右缘').toBeLessThanOrEqual(20);
    expect(Math.abs(g.centerOff), `字幕文本列要在整条上正中（实测偏 ${g.centerOff}px）`).toBeLessThanOrEqual(2);
    expect(g.overlap, '字幕文本列不许钻到按键底下').toBe(false);
    expect(g.align).toBe('center');
    expect(g.curInside, '当前句整句落在窗口里').toBe(true);
  });

  /* ⑧ PC 档同一件事的另一半：抽屉在 ≥900px 是居中面板（min(860px, 92vw)）、顶栏是居中胶囊
     （min(1084px, 100% - 36px)），两条栏本来不同宽，像素级重合无从谈起 —— 这一档的
     「位置一样」按同档口径锁：同一个类、同一套样式、都贴住自己那条栏的右缘、顶边同一档。 */
  test('⑧ 两处收起键在 PC 档同档：同一类 + 各自贴住栏右缘 + 顶边一致', async ({ page }) => {
    await gotoListen(page);
    await page.locator('#lcFab').click();
    await expect(page.locator('#lcDrawer')).toHaveClass(/open/);
    await page.waitForTimeout(450);
    const dw = await probeCollapse(page, '#lcClose');
    await page.locator('#lcClose').click();
    await page.evaluate(() => { (TASK as unknown as { listenExpand(): void }).listenExpand(); });
    await expect(page.locator('body')).toHaveClass(/listen-mode/);
    const lt = await probeCollapse(page, '#lsClose');

    expect(lt.cls).toBe(dw.cls);
    expect(dw.inRightHalf, '抽屉那颗在栏的右半边').toBe(true);
    expect(lt.inRightHalf, '展开态那颗也在右半边（不再是最左）').toBe(true);
    expect(dw.flushRight, '抽屉那颗贴住栏右缘').toBe(0);
    expect(lt.flushRight, '展开态那颗贴住栏右缘').toBe(0);
    expect(dw.top, '顶边同档').toBe(lt.top);
    for (const k of ['color', 'bg', 'border', 'radius', 'fs', 'fw', 'pad', 'iconFs', 'h', 'w'] as const) {
      expect(dw[k], `第 ${k} 项两处不一致`).toBe(lt[k]);
    }
  });
});
