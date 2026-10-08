// 2026-10-07 一致性排查报告 D 批的回归锁。
// D1（锁滚残留）/ D2（云菜单两套显隐）/ D3（dialog 没焦点陷阱）/ D4（Esc 分层失控）/ D11（外点监听复制五份）
// 本是同一个病的五张脸：浮层显隐有三套机制各走各的关闭路径。现在全部读 app/index.html 里那份
// OVERLAY_STACK —— 这里逐条钉住，防止将来又长回第二套。
// 服务器归 global-setup.ts 起停（仓库根 8932）；/app/ 在仓库根，用 E2E_ROOT_URL。
import { test, expect } from '../../fixtures';
import { waitShadowReady } from '../../utils/app-ready';
import { stubCloudAccount } from '../../utils/cloud-stub';
import { setMin } from '../../utils/min-slider';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  openStartPicker(): void;
  closeStartPicker(): void;
  state(): unknown;
  etaCalls: { n: number };
};
declare const APP3: {
  setLcDrawer(open: boolean, opts?: { focus?: boolean; save?: boolean }): void;
};
declare const ShadowPlan: { estimateDays(...args: unknown[]): number };
declare function togglePanel(): void;
declare function toggleJumpPop(force?: unknown): void;
declare function toggleCloudWrap(e?: unknown): void;
declare function toggleMarkWrap(e?: unknown): void;
declare function toggleABWrap(e?: unknown): void;
declare function toggleRateMenu(e?: unknown): void;
declare function toggleLoopMenu(e?: unknown): void;

const rootUrl = process.env.E2E_ROOT_URL || '';

/* 两篇小课文：篇 0 = 4 句（前两句各带 1 个目标词），篇 1 = 2 句。 */
const TWO: Record<string, string> = (() => {
  const mk = (title: string, lines: string[]) => ({
    title, zh: title, subheads: ['第一卷'],
    paragraphs: [lines],
    sentZh: [lines.map((_, i) => `第 ${i + 1} 句译文。`)],
    paraZh: [''],
  });
  const sections = [
    mk('地球与生命', ['The [[atmosphere:atmosphere]] protects life.', 'We need [[oxygen:oxygen]] to live.',
      'The air keeps us warm.', 'Plants give us gas.']),
    mk('校园与文化', ['A [[library:library]] is quiet.', 'The library opens late.']),
  ];
  const vocab = { atmosphere: { m: 'n. 大气' }, oxygen: { m: 'n. 氧气' }, library: { m: 'n. 图书馆' } };
  return { 'sections.json': JSON.stringify(sections), 'vocab.json': JSON.stringify(vocab), 'chapters.json': '[]' };
})();

async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/app/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}
const waitTask = (page: import('@playwright/test').Page) =>
  page.waitForFunction(() => { try { return typeof TASK !== 'undefined' && !!TASK.state; } catch (e) { return false; } });
async function gotoListen(page: import('@playwright/test').Page) {
  await page.goto(`${rootUrl}/app/index.html#/listen`);
  await waitShadowReady(page);
  await page.waitForFunction(() => {
    const w = window as unknown as { APP3?: { renderListen?: unknown } };
    const v = document.getElementById('appView');
    return !!(w.APP3 && typeof w.APP3.renderListen === 'function' && v && v.querySelector('.listen-page'));
  }, undefined, { timeout: 20000 });
}
/* 「我的」浮窗：未登录点卡片进的是登录弹窗，所以先把账号态点亮。
   点亮这件事本身有竞态，已经收进 utils/cloud-stub.ts 的 stubCloudAccount —— 它会先等
   CLOUD.boot() 跑完，否则 boot 拿不到会话的回写会把邮箱擦回空（app/index.html:3960）。 */
async function openMeLogged(page: import('@playwright/test').Page) {
  await stubCloudAccount(page);
  const pop = page.locator('#mePop');
  await page.locator('#meCard').click();
  if (!(await pop.isVisible())) await page.locator('#meCard').click();
  await expect(pop).toBeVisible();
  return pop;
}

test.describe('D1 · 词库抽屉的锁滚跟着断点走', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('窄屏锁滚、转宽屏自动放行；panel-open 只挂 body 一个宿主', async ({ page }) => {
    await stubData(page, TWO);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitTask(page);
    await page.evaluate(() => { document.body.style.overflow = ''; togglePanel(); });
    await expect(page.locator('body')).toHaveClass(/panel-open/);
    expect(await page.evaluate(() => document.body.style.overflow), '窄屏开抽屉要锁滚').toBe('hidden');
    expect(await page.evaluate(() => !!document.querySelector('.layout.panel-open')),
      '同一个 class 不许再挂第二个宿主').toBe(false);

    // 报告的病灶：转横屏 / 拖宽过 700px 后，唯一会清 overflow 的路径要求窄屏仍成立 → 永久锁滚
    await page.setViewportSize({ width: 1000, height: 720 });
    await expect.poll(() => page.evaluate(() => document.body.style.overflow),
      '过 700px 锁滚必须自动解除（不靠刷新）').toBe('');
  });
});

test.describe('D2 · ☁ 云菜单只认 .open 这一套显隐', () => {
  test('Esc 关得掉，aria-expanded 跟着回落，且不留下第二条 inline 路', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    // 3.0 外壳把 body > .topbar 整块藏了（云菜单仍在这棵树里），所以走元素自身点击
    await page.evaluate(() => (document.getElementById('btnCloud') as HTMLElement).click());
    await expect(page.locator('#cloudWrap')).toHaveClass(/open/);
    await expect(page.locator('#btnCloud')).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(page.locator('#cloudWrap'), 'Esc 走的是浮层栈，class 那一套').not.toHaveClass(/open/);
    await expect(page.locator('#btnCloud')).toHaveAttribute('aria-expanded', 'false');
    expect(await page.evaluate(() => (document.getElementById('cloudWrap') as HTMLElement).style.display),
      '不许再用 inline display 开这层').toBe('');
  });
});

test.describe('D3 · 标了 role=dialog 的浮层都得拦住 Tab', () => {
  test('今日任务起点弹层：Tab 五下不逃逸，Esc 关得掉（从前它连 Esc 都没有）', async ({ page }) => {
    await stubData(page, TWO);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitTask(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); TASK.openStartPicker(); });
    const pop = page.locator('#startPickPop');
    await expect(pop).toBeVisible();
    for (let i = 1; i <= 5; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => {
        const a = document.activeElement;
        return !!(a && a.closest && a.closest('#startPickPop'));
      }), `第 ${i} 次 Tab 焦点还在弹层内`).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(pop, 'Esc 要关得掉').toHaveCount(0);
    await expect(page.locator('#startPickMask')).toHaveCount(0);
  });

  test('本句单词卡抽屉：Tab 不落到背后正文', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await page.locator('#lcFab').click();
    await expect(page.locator('#lcDrawer')).toHaveClass(/open/);
    for (let i = 1; i <= 4; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => {
        const a = document.activeElement;
        return !!(a && a.closest && a.closest('#lcDrawer'));
      }), `第 ${i} 次 Tab 焦点还在抽屉内`).toBe(true);
    }
  });
});

/* 报告的 D4：app.js 是 defer 的，主站内联脚本先跑 —— 一次 Esc 把抽屉和全屏两层全收了。 */
test.describe('D4 · 一次 Esc 只关最上面那一层', () => {
  test('展开全屏 + 开着单词卡抽屉：第一下只收抽屉，第二下才收全屏', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await page.locator('.ls-expand').click();
    await expect(page.locator('body')).toHaveClass(/listen-mode/);
    await page.evaluate(() => APP3.setLcDrawer(true, { focus: false }));
    await expect(page.locator('#lcDrawer')).toHaveClass(/open/);

    await page.keyboard.press('Escape');
    await expect(page.locator('#lcDrawer'), '第一层：抽屉先关').not.toHaveClass(/open/);
    await expect(page.locator('body'), '第二层还在').toHaveClass(/listen-mode/);

    await page.keyboard.press('Escape');
    await expect(page.locator('body'), '再按一下才收全屏').not.toHaveClass(/listen-mode/);
  });
});

test.describe('D8 · 工期估算抛错不许毒掉这一档', () => {
  test('估算抛错 → 说「算不出来」而不是永远「算一下…」；修好后同一分钟数还能重算', async ({ page }) => {
    await stubData(page, TWO);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitTask(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    const pop = await openMeLogged(page);
    const calls = () => page.evaluate(() => TASK.etaCalls.n);
    const before = await calls();

    await page.evaluate(() => {
      (window as unknown as { __origEta: unknown }).__origEta = ShadowPlan.estimateDays;
      ShadowPlan.estimateDays = () => { throw new Error('stub boom'); };
    });
    await setMin(pop.locator('.min-range'), 30);
    await expect(page.locator('#mpEta')).toHaveText(/算不出来/);

    // 病灶：那颗死 Promise 留在 _etaPending 里，之后每次拖到 30 分钟都拿回它 —— 补 .catch 也救不了
    await page.evaluate(() => {
      ShadowPlan.estimateDays = (window as unknown as { __origEta: typeof ShadowPlan.estimateDays }).__origEta;
    });
    await setMin(pop.locator('.min-range'), 30);
    await expect(page.locator('#mpEta'), '同一档重试要重新算').not.toHaveText(/算不出来|算一下/);
    expect(await calls(), '失败不许进缓存，必须真的重算一次').toBeGreaterThan(before);
  });
});

test.describe('D9 · 还要打字的两处改成点选', () => {
  test('快速跳转：句号是 select（选项数 = 该章句数、带句首预览），换章重列，直达落在那一句', async ({ page }) => {
    await stubData(page, TWO);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitTask(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    await page.locator('.art-card .a-open').first().click();
    await expect(page.locator('body')).toHaveClass(/task-mode/);
    await page.evaluate(() => toggleJumpPop());

    const jumpN = page.locator('#jumpN');
    expect(await jumpN.evaluate((el) => (el as HTMLElement).tagName), '句号不许再是数字输入框').toBe('SELECT');
    await expect(jumpN.locator('option'), '篇 0 四句 → 四个选项').toHaveCount(4);
    expect(await jumpN.locator('option').first().textContent(), '带上句首几词，不是盲选序号').toContain('The atmosphere');

    await page.locator('#jumpCh').selectOption('1');
    await expect(jumpN.locator('option'), '换章要重列成这一章的句数').toHaveCount(2);
    await jumpN.selectOption('2');
    await page.locator('#jumpPop .btn.play').click();
    await expect(page.locator('#jumpPop')).toBeHidden();
    expect(await page.evaluate(() => Array.from(document.querySelectorAll('#art .sent'))
      .findIndex((el) => el.classList.contains('playing'))), '直达落在本篇第 2 句').toBe(1);
  });

  test('今日任务起点：第几句是 select，换篇目后句数跟着重列、选中项不丢', async ({ page }) => {
    // 「定了起点之后线真的挪」由 today-range-line.spec.ts 端到端锁（那边夹具够大）；
    // 这里只锁这颗控件不再要求打字：选项 = 本篇句数，换篇重列。
    await stubData(page, TWO);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitTask(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    await page.locator('.art-card .a-open').first().click();
    await expect(page.locator('body'), '起点弹层从文章内的开始线进').toHaveClass(/task-mode/);
    await page.evaluate(() => TASK.openStartPicker());
    const spSent = page.locator('#spSent');
    expect(await spSent.evaluate((el) => (el as HTMLElement).tagName), '第几句不许再是数字输入框').toBe('SELECT');
    await expect(spSent.locator('option')).toHaveCount(4);
    expect(await spSent.locator('option').first().textContent()).toContain('The atmosphere');
    await spSent.selectOption('3');
    await page.locator('#spArt').selectOption('1');
    await expect(spSent.locator('option'), '换篇目后按那一章的句数重列').toHaveCount(2);
    expect(await spSent.inputValue(), '本篇只有 2 句 → 第 3 句被夹到末尾').toBe('2');
    await page.locator('#spArt').selectOption('0');
    await expect(spSent.locator('option'), '换回来又按本篇句数重列').toHaveCount(4);
  });
});

test.describe('D11 · 「点外面关」是一颗粒常驻监听', () => {
  test('五个菜单反复开关，document 上的 pointerdown 监听数量不涨', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __pdLive: number };
      w.__pdLive = 0;
      const proto = EventTarget.prototype;
      const add = proto.addEventListener;
      const rem = proto.removeEventListener;
      proto.addEventListener = function (this: EventTarget, t: string, o: EventListenerOrEventListenerObject, c?: boolean | AddEventListenerOptions) {
        if (this === document && t === 'pointerdown') w.__pdLive++;
        return add.call(this, t, o, c);
      };
      proto.removeEventListener = function (this: EventTarget, t: string, o: EventListenerOrEventListenerObject, c?: boolean | EventListenerOptions) {
        if (this === document && t === 'pointerdown') w.__pdLive--;
        return rem.call(this, t, o, c);
      };
    });
    await stubData(page, TWO);
    await gotoListen(page);
    expect(await page.evaluate(() => (window as unknown as { __pdLive: number }).__pdLive),
      '常驻外点监听只有一颗').toBe(1);

    /* 旧写法：每个菜单打开时挂一颗一次性 pointerdown，而它只在「自己命中」时才摘自己 ——
       菜单若是被别的路径关掉的（开关再点一下 / Esc / openModal 互斥），那颗就永久挂着。
       三轮开关 = 旧口径能攒下十五颗。 */
    const toggleAll = () => page.evaluate(() => {
      toggleCloudWrap(); toggleMarkWrap(); toggleABWrap(); toggleRateMenu(); toggleLoopMenu();
    });
    for (let round = 0; round < 3; round++) {
      await toggleAll();
      await expect(page.locator('#abWrap')).toHaveClass(/open/);
      await toggleAll();
      await expect(page.locator('#abWrap')).not.toHaveClass(/open/);
    }
    expect(await page.evaluate(() => (window as unknown as { __pdLive: number }).__pdLive),
      '开关三轮后不该攒下监听').toBe(1);
  });
});
