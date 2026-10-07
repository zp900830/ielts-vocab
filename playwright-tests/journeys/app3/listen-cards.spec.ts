// 随身听 · 本句单词卡（2026-10-04 方案 B，2026-10-07 反转成顶挂抽屉 + 沉底迷你条）。
// 位置类断言另有 listen-cards-layout.spec.ts 专锁，本文件管行为（开闭/切句/字幕/无障碍）。
// 服务器归 global-setup.ts 起停（仓库根 8932）：/app/ 在仓库根，用 E2E_ROOT_URL。
// 桩数据/录音笔照抄 listen.spec.ts 同套路；VOCAB 桩带 note/cmp（真数据同形）。
import { test, expect } from '../../fixtures';
import { waitShadowReady } from '../../utils/app-ready';

declare const TASK: {
  listenState(): { a: number; idx: number; total: number; playing: boolean; text: string; src: string; todayPos: number; todayTotal: number };
  listenSentenceStep(d: number): void;
  listenToggle(): void;
  listenStep(d: number): void;
};

const rootUrl = process.env.E2E_ROOT_URL || '';

/* 三句桩：S0 双词有表 / S1 双词无表（strip/nutrient 式）/ S2 无目标词。 */
const CARDS: Record<string, string> = (() => {
  const mk = (title: string, lines: string[]) => ({
    title, zh: title, subheads: ['第一卷'],
    paragraphs: [lines],
    sentZh: [lines.map((_, i) => `第 ${i + 1} 句译文。`)],
    paraZh: [''],
  });
  const sections = [
    mk('地球与生命', [
      'The [[atmo:atmo]] is a thin [[cover:cover]].',
      'Heat may [[strip:strip]] [[nutrient:nutrient]].',
      'Plain sky today.',
    ]),
  ];
  const vocab = {
    atmo: { m: 'n. 大气', p: 'ˈætməsfɪə', note: '同义词：air；词伙：thin atmo',
      cmp: { type: 'compare', group: 'atmo-mood', title: 'atmo 是地方的气，mood 是人的气。', items: [
        { w: 'atmo', pos: 'n.', sense: 'n. 大气', eg: 'thin atmo' },
        { w: 'mood', pos: 'n.', sense: 'n. 心情', eg: 'good mood' } ] } },
    cover: { m: 'v. 覆盖', p: 'ˈkʌvə', note: '词伙：cover costs',
      cmp: { type: 'compare', group: 'cover-lid', title: 'cover 泛指盖住。', items: [
        { w: 'cover', pos: 'v.', sense: 'v. 覆盖', eg: 'cover costs' },
        { w: 'lid', pos: 'n.', sense: 'n. 盖子', eg: 'put lid on' } ] } },
    strip: { m: 'v. 剥去', p: 'strɪp', note: '词伙：strip bark' },
    nutrient: { m: 'n. 营养', p: 'ˈnjuːtriənt', note: '同义词：nourishment' },
  };
  return { 'sections.json': JSON.stringify(sections), 'vocab.json': JSON.stringify(vocab), 'chapters.json': '[]' };
})();

async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/shadow/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}

async function gotoListen(page: import('@playwright/test').Page) {
  await page.goto(`${rootUrl}/app/index.html#/listen`);
  await waitShadowReady(page);
  await page.waitForFunction(() => {
    const v = document.getElementById('appView');
    return !!(v && v.querySelector('.listen-page'));
  }, undefined, { timeout: 20000 });
}

async function installSpeakStub(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const w = window as unknown as { speak: (t: string, cb?: () => void) => void; __cbs: (() => void)[] };
    w.__cbs = [];
    w.speak = function (t: string, cb?: () => void) { if (cb) w.__cbs.push(cb); };
  });
}
const finishSpeak = (page: import('@playwright/test').Page) =>
  page.evaluate(() => { const w = window as unknown as { __cbs: (() => void)[] }; const cb = w.__cbs.shift(); if (cb) cb(); });

function trackErrors(page: import('@playwright/test').Page) {
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + String(e && (e as Error).message || e).slice(0, 200)));
  // 资源 404 按精确 URL 过：开发服务器本底缺 app/config.js（index.html 静态引用，与本功能无关）
  page.on('response', (r) => {
    if (r.status() >= 400 && !/config\.js|favicon\.ico/.test(r.url())) errs.push(`http ${r.status()} ${r.url().slice(0, 160)}`);
  });
  return errs;
}

test.use({ viewport: { width: 390, height: 844 } });

test.describe('随身听 · 本句单词卡抽屉（方案 B）', () => {
  test('FAB 显隐与角标：有词显示计数，无词隐藏不出空抽屉', async ({ page }) => {
    const errs = trackErrors(page);
    await stubData(page, CARDS);
    await gotoListen(page);

    // 未起播也按首句给卡（idx=-1 → 第 1 句，2 个目标词）
    const fab = page.locator('#lcFab');
    await expect(fab).toBeVisible();
    await expect(page.locator('#lcFabN')).toHaveText('2');

    // 切到无词句 → FAB 藏
    await page.locator('.ls-next').click();
    await page.locator('.ls-next').click();
    await expect(fab).toBeHidden();
    expect(errs).toEqual([]);
  });

  test('抽屉开闭：FAB/遮罩/收起/ESC + 焦点 + aria-modal', async ({ page }) => {
    const errs = trackErrors(page);
    await stubData(page, CARDS);
    await gotoListen(page);
    const fab = page.locator('#lcFab');
    const drawer = page.locator('#lcDrawer');
    await expect(fab).toBeVisible();

    // FAB 开 → 抽屉滑出 + 遮罩 + 焦点落收起 + 首屏看全第一张卡
    await fab.click();
    await expect(drawer).toHaveClass(/open/);
    await expect(page.locator('#lcScrim')).toHaveClass(/on/);
    await expect(page.locator('#lcClose')).toBeFocused();
    await expect(drawer).toHaveAttribute('aria-modal', 'true');
    const first = drawer.locator('.wcard').first();
    await expect(first).toBeVisible();
    // 等抽屉滑入动画落定再量（卡现在首开即落，不等会量到 .34s 位移动画的中间帧）
    // 2026-10-07 起抽屉顶挂：落定态 top === 0（不再是 innerHeight - height）
    await page.waitForFunction(() => {
      const d = document.getElementById('lcDrawer');
      if (!d) return false;
      return Math.abs(d.getBoundingClientRect().top) < 1;
    }, undefined, { timeout: 3000 });
    const r = await first.evaluate((el) => { const b = (el as HTMLElement).getBoundingClientRect(); return { top: b.top, bottom: b.bottom, vh: window.innerHeight }; });
    expect(r.top, '第一张卡顶边在屏内').toBeGreaterThanOrEqual(0);
    expect(r.bottom, '第一张卡底边在屏内（390px 首屏看全）').toBeLessThanOrEqual(r.vh);
    // 两张卡都在（atmo/cover）
    await expect(drawer.locator('.wcard')).toHaveCount(2);
    await expect(drawer.locator('.wc-word').first()).toHaveText('atmo');

    // 遮罩点按关 → 焦点回 FAB（点遮罩可见带：顶挂抽屉之下、沉底迷你条之上）
    const gapY = await page.evaluate(() => {
      const b = (s: string) => (document.querySelector(s) as HTMLElement).getBoundingClientRect();
      return Math.round((b('#lcDrawer').bottom + b('#lcMini').top) / 2);
    });
    await page.locator('#lcScrim').click({ position: { x: 195, y: gapY } });
    await expect(drawer).not.toHaveClass(/open/);
    await expect(fab).toBeFocused();

    // 收起键关
    await fab.click();
    await expect(drawer).toHaveClass(/open/);
    await page.locator('#lcClose').click();
    await expect(drawer).not.toHaveClass(/open/);

    // ESC 关
    await fab.click();
    await expect(drawer).toHaveClass(/open/);
    await page.keyboard.press('Escape');
    await expect(drawer).not.toHaveClass(/open/);
    expect(errs).toEqual([]);
  });

  test('切句联动：抽屉开着切句只换卡不关抽屉；回顶；徽标同步', async ({ page }) => {
    await stubData(page, CARDS);
    await gotoListen(page);
    const drawer = page.locator('#lcDrawer');
    await page.locator('#lcFab').click();
    await expect(drawer).toHaveClass(/open/);

    // S0 → S1（都有 2 词）：经迷你条切（抽屉开时页面被遮罩盖住，只能走迷你条——正是它压在遮罩上层的理由）
    // 先把内容区滚到底，验证切句后回顶
    await drawer.locator('#lcGrid').evaluate((el) => { (el as HTMLElement).scrollTop = 9999; });
    await page.locator('#lcMini .mb-next').click();
    await expect(page.locator('#lcTitle')).toContainText('第 2 句');
    await expect(drawer).toHaveClass(/open/);
    await expect(drawer.locator('.wc-word').first()).toHaveText('strip');
    // strip 无 cmp：只有 note 行，没有辨析块
    const stripCard = drawer.locator('.wcard', { hasText: 'strip' });
    await expect(stripCard.locator('.nb-label').first()).toHaveText('词伙');
    expect(await stripCard.locator('.cmp').count()).toBe(0);
    // 回顶：内容区 scrollTop 回 0（轮询等 170ms 淡入刷新落定）
    await expect.poll(() => drawer.locator('#lcGrid').evaluate((el) => (el as HTMLElement).scrollTop)).toBe(0);

    // S1 → S2（无词）：抽屉不再自动收起，改在内部显占位（收起只由用户操作 / 离路由 / 全屏触发）；FAB 藏
    await page.locator('#lcMini .mb-next').click();
    await expect(drawer).toHaveClass(/open/);
    await expect(page.locator('#lcTitle')).toHaveText('本句无目标词');
    await expect(drawer.locator('.lc-empty')).toBeVisible();
    expect(await drawer.locator('.wcard').count()).toBe(0);
    await expect(page.locator('#lcFab')).toBeHidden();
  });

  test('迷你条：层级 scrim<迷你条<抽屉；开抽屉强制沉底贴 TabBar 上方；滚出播放卡才出现', async ({ page }) => {
    await stubData(page, CARDS);
    await gotoListen(page);

    // 层级定案锁死
    const z = await page.evaluate(() => {
      const g = (s: string) => getComputedStyle(document.querySelector(s) as Element).zIndex;
      return { scrim: g('#lcScrim'), mini: g('#lcMini'), drawer: g('#lcDrawer') };
    });
    expect([z.scrim, z.mini, z.drawer].map(Number)).toEqual([70, 75, 80]);

    // 抽屉开 → 迷你条强制可见且沉底：贴在底部 TabBar 正上方（等 .28s 位移动画落定再量）
    await page.locator('#lcFab').click();
    const mini = page.locator('#lcMini');
    await expect(mini).toBeVisible();
    const dock = () => mini.evaluate((el) => {
      const b = el.getBoundingClientRect();
      const nav = document.querySelector('.sidenav');
      const navTop = nav ? (nav as HTMLElement).getBoundingClientRect().top : window.innerHeight;
      return { bottom: Math.round(b.bottom), top: Math.round(b.top), navTop: Math.round(navTop) };
    });
    await expect.poll(async () => {
      const d = await dock();
      return d.bottom <= d.navTop + 1;
    }, { timeout: 3000 }).toBe(true);
    const d0 = await dock();
    expect(d0.top, '沉底：整条在屏幕下半区，不再吸顶').toBeGreaterThan(844 / 2);
    // 迷你条句文同步当前句
    await expect(page.locator('#lcSent')).toContainText('atmo');
    await page.locator('#lcClose').click();

    // 抽屉关：滚出播放卡 → 出现；回顶 → 收起（垫高页面保证可滚，harness 非功能代码）
    await page.evaluate(() => { const d = document.createElement('div'); d.style.height = '3000px'; document.getElementById('appView')!.appendChild(d); });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(mini).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(mini).toBeHidden();
  });

  test('字幕窗：当前句任务模式高亮、邻句不亮；切句平滑滚到居中', async ({ page }) => {
    await stubData(page, CARDS);
    await gotoListen(page);
    // 抽屉关、滚出播放卡 → 迷你条 .show，字幕窗全高（垫高页面保证可滚，harness 非功能代码）
    await page.evaluate(() => { const d = document.createElement('div'); d.style.height = '3000px'; document.getElementById('appView')!.appendChild(d); });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const roll = page.locator('#lcSent');
    await expect(roll).toBeVisible();
    // 行体与精读同源：唯一当前句挂 .playing 薄荷高亮 + 行内词义 .gl + 译文 .sent-zh
    const cur = roll.locator('.mb-row.cur');
    await expect(cur).toHaveCount(1);
    await expect(cur.locator('.sent')).toHaveClass(/playing/);
    await expect(cur.locator('.gl').first()).toBeAttached();
    await expect(cur.locator('.sent-zh')).toBeAttached();
    // 邻句在窗里但不高亮、降透明度
    const others = roll.locator('.mb-row:not(.cur)');
    expect(await others.count()).toBeGreaterThanOrEqual(1);
    expect(await others.first().evaluate((el) => getComputedStyle(el).opacity)).toBe('0.42');
    expect(await roll.locator('.mb-row:not(.cur) .sent.playing').count()).toBe(0);
    // 首句贴顶（上面没有行，居中会被 clamp）
    await expect.poll(() => roll.evaluate((el) => (el as HTMLElement).scrollTop)).toBe(0);

    // 切到中间句：高亮搬家 + 320ms 滚动后当前句落在「玻璃键之上那条净带」里居中
    // （2026-10-07：三颗键浮在字幕窗下沿，居中不能按整窗算，否则句子下半截永远压在键底下；
    //   同轮第二次改：顶边那条 mask 渐隐带也不算进净带 —— 当前句的头一行落进去就是淡的）
    const placement = () => roll.locator('.mb-row.cur').evaluate((el) => {
      const r = (el as HTMLElement).getBoundingClientRect();
      const rollEl = (el as HTMLElement).closest('.mb-roll') as HTMLElement;
      const p = rollEl.getBoundingClientRect();
      const b = (document.querySelector('#lcMini .mb-bar') as HTMLElement).getBoundingClientRect();
      const occ = Math.max(0, p.bottom - b.top);
      const fade = parseFloat(getComputedStyle(rollEl).getPropertyValue('--lc-fade-top')) || 0;
      return {
        off: Math.abs((r.top + r.height / 2) - (p.top + fade + (p.height - occ - fade) / 2)),
        clear: b.top - r.bottom,
        headClear: r.top - (p.top + fade),
        occ: Math.round(occ),
      };
    });
    const g0 = await cur.getAttribute('data-g');
    await page.locator('#lcMini .mb-next').click();
    await expect.poll(() => roll.locator('.mb-row.cur').getAttribute('data-g'), { timeout: 2000 }).not.toBe(g0);
    await expect.poll(async () => (await placement()).off, { timeout: 2000 }).toBeLessThan(6);
    const g1 = await placement();
    expect(g1.clear, '当前句整句在按钮之上，不被玻璃键压住').toBeGreaterThanOrEqual(0);
    expect(g1.headClear, '当前句的头一行不许落进 mask 渐隐带').toBeGreaterThanOrEqual(0);
  });

  test('辨析展开：默认一行简单记；点开展开无横向溢出', async ({ page }) => {
    await stubData(page, CARDS);
    await gotoListen(page);
    await page.locator('#lcFab').click();
    const drawer = page.locator('#lcDrawer');
    const firstCmp = drawer.locator('.wcard').first().locator('.cmp');
    await expect(firstCmp).toHaveCount(1);
    const toggle = firstCmp.locator('.cmp-toggle');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    // 默认折叠：视觉隐藏看 opacity（0fr 行的表头 margin 会漏几 px 盒高，不可见即达标）
    await expect(firstCmp.locator('.cmp-body')).toHaveCSS('opacity', '0');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(firstCmp).toHaveClass(/open/);
    // 390px 下表格无横向溢出
    const over = await drawer.locator('#lcGrid').evaluate((el) => {
      const g = el as HTMLElement;
      const t = g.querySelector('.cmp-body table') as HTMLElement | null;
      return { grid: g.scrollWidth - g.clientWidth, table: t ? t.scrollWidth - t.clientWidth : 0 };
    });
    expect(over.grid, '卡片区无横向溢出').toBeLessThanOrEqual(1);
    expect(over.table, '对比表无横向溢出').toBeLessThanOrEqual(1);
  });

  test('持久化：开抽屉 → reload → 恢复（2026-10-07 grip 行与高档已删，只剩一个开合态）', async ({ page }) => {
    await stubData(page, CARDS);
    await gotoListen(page);
    await page.locator('#lcFab').click();
    await expect(page.locator('#lcDrawer')).toHaveClass(/open/);
    expect(await page.locator('#lcDrawer .dw-grip').count(), '拖手那一行整个删掉').toBe(0);
    await page.reload();
    await gotoListen(page);
    await expect(page.locator('#lcDrawer')).toHaveClass(/open/);
    await expect(page.locator('#lcDrawer .wcard')).toHaveCount(2);
  });

  test('只有基础词义(m)的目标词也出卡（词+词义即卡；seismic/tsunami 丢卡回归）', async ({ page }) => {
    const errs = trackErrors(page);
    // 同 CARDS 的课文；vocab 里 strip/nutrient 只留词义，无 note 无 cmp
    const vocab = {
      atmo: { m: 'n. 大气', p: 'ˈætməsfɪə', note: '同义词：air；词伙：thin atmo' },
      cover: { m: 'v. 覆盖', p: 'ˈkʌvə', note: '词伙：cover costs' },
      strip: { m: 'v. 剥去', p: 'strɪp' },
      nutrient: { m: 'n. 营养', p: 'ˈnjuːtriənt' },
    };
    await stubData(page, {
      'sections.json': CARDS['sections.json'],
      'vocab.json': JSON.stringify(vocab),
      'chapters.json': '[]',
    });
    await gotoListen(page);
    await page.locator('.ls-next').click();   // → S1：strip + nutrient 全是 gloss-only
    const fab = page.locator('#lcFab');
    await expect(fab).toBeVisible();
    await expect(page.locator('#lcFabN')).toHaveText('2');
    await fab.click();
    const drawer = page.locator('#lcDrawer');
    await expect(drawer).toHaveClass(/open/);
    const stripCard = drawer.locator('.wcard', { hasText: 'strip' });
    await expect(stripCard.locator('.wc-word')).toHaveText('strip');
    await expect(stripCard.locator('.wc-gloss')).toHaveText('v. 剥去');
    expect(await stripCard.locator('.nb-label').count()).toBe(0);   // 无 note/cmp，卡体就是词+词义
    expect(errs).toEqual([]);
  });

  test('跨篇句号：第 2 篇的卡来自第 2 篇的句（全局句号查词），不借第 1 篇', async ({ page }) => {
    const errs = trackErrors(page);
    const mk = (title: string, lines: string[]) => ({
      title, zh: title, subheads: ['第一卷'],
      paragraphs: [lines],
      sentZh: [lines.map((_, i) => `第 ${i + 1} 句译文。`)],
      paraZh: [''],
    });
    const sections = [
      mk('地球与生命', [
        'The [[atmo:atmo]] is a thin [[cover:cover]].',
        'Heat may [[strip:strip]] [[nutrient:nutrient]].',
        'Plain sky today.',
      ]),
      mk('极地传说', ['The [[glacier:glacier]] melts fast.']),
    ];
    const vocab = {
      atmo: { m: 'n. 大气', p: 'ˈætməsfɪə', note: '同义词：air；词伙：thin atmo' },
      cover: { m: 'v. 覆盖', p: 'ˈkʌvə', note: '词伙：cover costs' },
      strip: { m: 'v. 剥去', p: 'strɪp', note: '词伙：strip bark' },
      nutrient: { m: 'n. 营养', p: 'ˈnjuːtriənt', note: '同义词：nourishment' },
      glacier: { m: 'n. 冰川', p: 'ˈɡlæsiə', note: '词伙：glacier melt' },
    };
    await stubData(page, {
      'sections.json': JSON.stringify(sections),
      'vocab.json': JSON.stringify(vocab),
      'chapters.json': '[]',
    });
    await gotoListen(page);
    await page.evaluate(() => TASK.listenStep(1));   // → 第 2 篇
    const fab = page.locator('#lcFab');
    await expect(fab).toBeVisible();
    await expect(page.locator('#lcFabN')).toHaveText('1');
    await fab.click();
    const drawer = page.locator('#lcDrawer');
    await expect(drawer).toHaveClass(/open/);
    // 修前用篇内 idx 查全书索引，会借到第 1 篇第 1 句的 atmo
    await expect(drawer.locator('.wc-word')).toHaveText('glacier');
    await expect(page.locator('#lcTitle')).toContainText('第 1 句');
    expect(errs).toEqual([]);
  });

  test('持久化补开：boot 恰逢无词句被拒开后，进到有词句自动补开抽屉', async ({ page }) => {
    // S0 无词：boot 恰逢无词句
    const sections = [{
      title: '地球与生命', zh: '地球与生命', subheads: ['第一卷'],
      paragraphs: [
        ['Plain sky today.',
         'The [[atmo:atmo]] is a thin [[cover:cover]].',
         'Heat may [[strip:strip]] [[nutrient:nutrient]].'],
      ],
      sentZh: [['第 1 句译文。', '第 2 句译文。', '第 3 句译文。']],
      paraZh: [''],
    }];
    const vocab = {
      atmo: { m: 'n. 大气', p: 'ˈætməsfɪə', note: '同义词：air；词伙：thin atmo' },
      cover: { m: 'v. 覆盖', p: 'ˈkʌvə', note: '词伙：cover costs' },
      strip: { m: 'v. 剥去', p: 'strɪp', note: '词伙：strip bark' },
      nutrient: { m: 'n. 营养', p: 'ˈnjuːtriənt', note: '同义词：nourishment' },
    };
    await stubData(page, {
      'sections.json': JSON.stringify(sections),
      'vocab.json': JSON.stringify(vocab),
      'chapters.json': '[]',
    });
    // 预置「抽屉打开」偏好（等价于上次手动开过）；S0 无词 → boot 恢复被拒
    await page.addInitScript(() => {
      localStorage.setItem('ielts-shadow-prefs', JSON.stringify({ listenCards: { open: true } }));
    });
    await gotoListen(page);
    const drawer = page.locator('#lcDrawer');
    await expect(drawer).not.toHaveClass(/open/);
    await expect(page.locator('#lcFab')).toBeHidden();
    await page.locator('.ls-next').click();   // → S1 有词
    await expect(drawer).toHaveClass(/open/);
    await expect(page.locator('#lcTitle')).toContainText('第 2 句');
    // 补开用的是 save:false —— 此后手动关掉仍以用户为准（pref 写回 false），不再抢开
    await page.locator('#lcClose').click();
    await expect(drawer).not.toHaveClass(/open/);
  });

  test('播完自动进句刷新徽标（speak 录音笔兑现 onend）', async ({ page }) => {
    await stubData(page, CARDS);
    await gotoListen(page);
    await installSpeakStub(page);
    await page.locator('.ls-play').click();
    await expect.poll(() => page.evaluate(() => TASK.listenState().playing)).toBe(true);
    // 兑现第 1 句播完 → 自动进第 2 句 → 标题同步
    await finishSpeak(page);
    await expect(page.locator('#lcTitle')).toContainText('第 2 句', { timeout: 15000 });
  });

  test.describe('桌面 1280', () => {
    test.use({ viewport: { width: 1280, height: 800 } });
    test('抽屉居中 860px、双列卡片不溢出', async ({ page }) => {
      await stubData(page, CARDS);
      await gotoListen(page);
      await page.locator('#lcFab').click();
      const drawer = page.locator('#lcDrawer');
      await expect(drawer).toHaveClass(/open/);
      const box = await drawer.evaluate((el) => {
        const b = (el as HTMLElement).getBoundingClientRect();
        return { w: Math.round(b.width), x: Math.round(b.left), vw: window.innerWidth };
      });
      expect(box.w).toBeLessThanOrEqual(860);
      expect(Math.abs(box.x - (box.vw - box.w) / 2)).toBeLessThanOrEqual(2);
      const cards = drawer.locator('.wcard');
      await expect(cards).toHaveCount(2);
      // 双列：两卡同排（top 相等）
      const tops = await cards.evaluateAll((els) => els.map((el) => Math.round((el as HTMLElement).getBoundingClientRect().top)));
      expect(tops[1]).toBe(tops[0]);
      const over = await drawer.locator('#lcGrid').evaluate((el) => (el as HTMLElement).scrollWidth - (el as HTMLElement).clientWidth);
      expect(over).toBeLessThanOrEqual(1);
    });
  });
});
