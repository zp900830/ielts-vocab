// 3.0 随身听 UX 批（2026-09-25）：
//   ① 卡片 ◀/▶ = 上一句/下一句（句级，不再是切篇）
//   ② 未展开 + 展开态都有「停止」按钮（暂停 ≠ 停止）
//   ③ 未展开态去掉 循环/AB/倍速/书签（只在展开态提供）
//   ④ 「展开全文阅读」= 全屏弹窗播放文章（不离开 #/listen，可带动效收起）
//   ⑤ 悬浮球只在「停止」时消失（暂停/切 tab 都仍在）
//   ⑥ 展开弹窗 Esc 关闭（分层：普通浮层先关）
//   ⑦ 收听计时清零（停止/关闭/暂停）；收起不停止不清零
//   ⑧ 按篇账云同步合并语义 = 单调 max
// 服务器归 global-setup.ts 起停（仓库根 8932）：/app/ 在仓库根，用 E2E_ROOT_URL。
import { test, expect } from '../../fixtures';
import { waitShadowReady } from '../../utils/app-ready';

declare const TASK: {
  listenState(): { a: number; idx: number; total: number; playing: boolean; active: boolean; expanded: boolean; ctx: boolean; text: string };
  listenOpen(a: number): void;
  listenExpand(): void;
  listenCollapse(): void;
  listenStop(): void;
  listenClose(): void;
  listenSentenceStep(d: number): void;
  listenStep(d: number): void;
  listenSeek(local: number): void;
  listenArticle: number | null;
  listenTickMs: number;   // ⑦ 跨场清零锁：收听计时指针
  mergeArticleAccount(remote: unknown): boolean;   // ⑧ 合并语义锁
  articleAccountSnapshot(): {
    reps: Record<string, Record<string, number>>;
    pass2: Record<string, boolean>;
    listen: { sents: Record<string, Record<string, number>>; ms: Record<string, Record<string, number>>; last: Record<string, number> };
  };
};
declare const SECTIONS: Array<{ title: string }>;

const rootUrl = process.env.E2E_ROOT_URL || '';

/* 两篇小课文：篇 0 = 4 句，篇 1 = 2 句；句号全局连续（0–3 / 4–5）。 */
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
    mk('校园与文化', ['A [[library:library]] is quiet.', 'The [[library:library]] opens late.']),
  ];
  const vocab = { atmosphere: { m: 'n. 大气' }, oxygen: { m: 'n. 氧气' }, library: { m: 'n. 图书馆' } };
  return { 'sections.json': JSON.stringify(sections), 'vocab.json': JSON.stringify(vocab), 'chapters.json': '[]' };
})();

async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/shadow/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}

/* 录音笔引擎：__finish() 手动兑现「这句播完了」（headless 里 speechSynthesis 不发声）。 */
async function installSpeakStub(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const w = window as unknown as { speak: (t: string, cb?: () => void) => void; __cbs: (() => void)[] };
    w.__cbs = [];
    w.speak = function (t: string, cb?: () => void) { if (cb) w.__cbs.push(cb); };
  });
}
const finishSpeak = (page: import('@playwright/test').Page) =>
  page.evaluate(() => { const w = window as unknown as { __cbs: (() => void)[] }; const cb = w.__cbs.shift(); if (cb) cb(); });

async function gotoListen(page: import('@playwright/test').Page) {
  await page.goto(`${rootUrl}/app/index.html#/listen`);
  await waitShadowReady(page);
  await page.waitForFunction(() => {
    const w = window as unknown as { APP3?: { renderListen?: unknown } };
    const v = document.getElementById('appView');
    return !!(w.APP3 && typeof w.APP3.renderListen === 'function' && v && v.querySelector('.listen-page'));
  }, undefined, { timeout: 20000 });
}

const st = (page: import('@playwright/test').Page) => page.evaluate(() => TASK.listenState());
const fab = (page: import('@playwright/test').Page) => page.locator('#lsMini');
async function switchTo(page: import('@playwright/test').Page, route: string) {
  await page.locator(`.sidenav .nav-item[data-route="${route}"]`).click();
  await expect(page).toHaveURL(new RegExp(`#/${route}`));
}

test.describe('① 卡片 ◀/▶ = 句级（上一句/下一句）', () => {
  test('点 ▶ 只进一句、篇不变；点 ◀ 只退一句、篇不变', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await installSpeakStub(page);
    await page.locator('.ls-play').click();
    await expect.poll(() => page.evaluate(() => TASK.listenState().idx)).toBe(0);

    await page.locator('.ls-next').click();
    await expect.poll(() => page.evaluate(() => TASK.listenState().idx), '▶ 应只动一句').toBe(1);
    expect((await st(page)).a, '▶ 不许切篇').toBe(0);

    await page.locator('.ls-prev').click();
    await expect.poll(() => page.evaluate(() => TASK.listenState().idx), '◀ 应只退一句').toBe(0);
    expect((await st(page)).a, '◀ 不许切篇').toBe(0);
  });

  test('按钮文案是「上一句/下一句」，首尾有禁用态', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await installSpeakStub(page);
    await expect(page.locator('.ls-prev')).toContainText('上一句');
    await expect(page.locator('.ls-next')).toContainText('下一句');
    // 未起播 idx=-1：◀ 禁用、▶ 可用（与主站 audiobar 一致）
    await expect(page.locator('.ls-prev')).toBeDisabled();
    await expect(page.locator('.ls-next')).toBeEnabled();
    await page.locator('.ls-play').click();
    await expect.poll(() => page.evaluate(() => TASK.listenState().idx)).toBe(0);
    await expect(page.locator('.ls-prev'), '首句 ◀ 禁用').toBeDisabled();
    await page.evaluate(() => TASK.listenSeek(3));
    await expect.poll(() => page.evaluate(() => TASK.listenState().idx)).toBe(3);
    await expect(page.locator('.ls-next'), '末句 ▶ 禁用').toBeDisabled();
  });
});

test.describe('② 停止按钮（未展开 + 展开）', () => {
  test('未展开卡片有停止：点了真的停、且不是暂停态', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await installSpeakStub(page);
    await page.locator('.ls-play').click();
    await expect.poll(() => page.evaluate(() => TASK.listenState().playing)).toBe(true);

    const stop = page.locator('.ls-stop');
    await expect(stop, '未展开态要有停止按钮').toBeVisible();
    await stop.click();
    const s = await st(page);
    expect(s.playing, '停止后不许还在播').toBe(false);
    expect(s.active, '停止后 active 必须为 false（暂停才是 active）').toBe(false);
  });

  test('展开态有停止：点了真的停', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await installSpeakStub(page);
    await page.locator('.ls-expand').click();
    await expect(page.locator('body')).toHaveClass(/listen-mode/);
    await expect(page.locator('#btnStop'), '展开态要有停止按钮').toBeVisible();
    await page.locator('#btnStop').click();
    expect((await st(page)).playing, '展开态停止后不许还在播').toBe(false);
  });
});

test.describe('③ 未展开态没有 循环/AB/倍速/书签', () => {
  test('卡片态无这些控件；展开态都有', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    for (const sel of ['.ls-loop', '.ls-ab', '.ls-rate', '.ls-mark']) {
      await expect(page.locator(sel), `未展开态不该有 ${sel}`).toHaveCount(0);
    }
    await installSpeakStub(page);
    await page.locator('.ls-expand').click();
    await expect(page.locator('body')).toHaveClass(/listen-mode/);
    // 展开态走既有的全功能播放条：循环 / AB / 倍速 / 书签 / 快速跳转都在
    for (const sel of ['#loopWrap', '#abWrap', '#rateWrap', '#markWrap', '.jump-btn']) {
      await expect(page.locator(sel), `展开态应有 ${sel}`).toHaveCount(1);
    }
  });
});

test.describe('④ 展开 = 全屏弹窗（不离开 #/listen）', () => {
  test('点展开：留在 #/listen、正文全屏、可播放；**不再有 HUD 大卡片**；顶栏是「收起」', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await installSpeakStub(page);
    await page.locator('.ls-expand').click();

    await expect(page, '不许跳出随身听路由').toHaveURL(/#\/listen/);
    await expect(page.locator('body')).toHaveClass(/listen-mode/);
    await expect(page.locator('body'), '不是路由跳进文章任务模式').not.toHaveClass(/task-mode/);
    // 2026-09-25 用户：HUD 大卡片删掉 —— 篇名在顶部条、当前句在正文高亮、控件在播放条
    expect(await page.locator('#listenHud').count(), 'HUD 卡必须不存在').toBe(0);
    await expect(page.locator('#lsTitle'), '顶部条报篇名').toContainText('地球与生命');
    await expect(page.locator('#lsPos'), '顶部条报篇号').toContainText(/第 \d+\/\d+ 篇/);
    await expect(page.locator('#art .sent').first()).toBeVisible();   // §7.3 正文
    await expect.poll(() => page.evaluate(() => TASK.listenState().playing)).toBe(true);
    // 左上角 = 收起，不是返回（收起后播放继续，见 ⑦）
    await expect(page.locator('#lsClose')).toHaveAttribute('aria-label', '收起');
    // task-mode class 不许泄漏进听书态（用户截图实测过泄漏）
    await expect(page.locator('#taskTop')).toBeHidden();
  });

  test('收起：回到卡片、仍在 #/listen、**播放继续**；有动效且 reduced-motion 下降级', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await installSpeakStub(page);

    await page.locator('.ls-expand').click();
    await expect(page.locator('body')).toHaveClass(/listen-mode/);
    const opened = await page.evaluate(() =>
      getComputedStyle(document.querySelector('body > .layout')!).animationName);
    expect(opened, '展开要有进入动效（正文整块淡入）').not.toBe('none');

    await page.locator('#lsClose').click();
    await expect(page.locator('body')).not.toHaveClass(/listen-mode/);
    await expect(page).toHaveURL(/#\/listen/);
    await expect(page.locator('.ls-card')).toBeVisible();
    // 口径（2026-09-25 用户）：收起不停止 —— 播放继续；卡片页是控制面，球不显示（见 listen-float 锁）
    expect((await st(page)).playing, '收起后播放必须继续').toBe(true);
    await expect(fab(page), '卡片页是控制面，不显示悬浮球').toBeHidden();

    // reduced-motion：动效压掉
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('.ls-expand').click();
    await expect(page.locator('body')).toHaveClass(/listen-mode/);
    const rm = await page.evaluate(() =>
      getComputedStyle(document.querySelector('body > .layout')!).animationName);
    expect(rm, 'reduced-motion 下压掉动画').toBe('none');
  });
});

test.describe('⑤ 悬浮球只在「停止」时消失', () => {
  test('暂停后切 tab：悬浮球仍在', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await installSpeakStub(page);
    await page.locator('.ls-play').click();
    await expect.poll(() => page.evaluate(() => TASK.listenState().playing)).toBe(true);
    await page.locator('.ls-play').click();                         // 暂停
    await expect.poll(() => page.evaluate(() => TASK.listenState().playing)).toBe(false);
    await switchTo(page, 'home');
    await expect(fab(page), '暂停切走后仍要在').toBeVisible();
  });

  test('播放中切 tab：悬浮球仍在且播放不断', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await installSpeakStub(page);
    await page.locator('.ls-play').click();
    await expect.poll(() => page.evaluate(() => TASK.listenState().playing)).toBe(true);
    await switchTo(page, 'stats');
    await expect(fab(page)).toBeVisible();
    expect((await st(page)).playing).toBe(true);
  });

  test('停止：悬浮球消失，再切 tab 也不回来', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await installSpeakStub(page);
    await page.locator('.ls-play').click();
    await expect.poll(() => page.evaluate(() => TASK.listenState().playing)).toBe(true);
    await switchTo(page, 'home');
    await expect(fab(page)).toBeVisible();

    await page.locator('#lsMiniStop').click();
    await expect(fab(page), '停止后必须消失').toBeHidden();
    const s = await st(page);
    expect(s.playing).toBe(false);
    expect(s.active, '停止后 active=false').toBe(false);

    await switchTo(page, 'words');
    await expect(fab(page), '停过之后切 tab 也不许再冒出来').toBeHidden();
  });
});

/* ⑥⑦⑧（2026-09-25 用户拍板的三件小事）：
   ⑥ 展开弹窗按 Esc = 收起（普通浮层都关干净了才轮到它 —— 分层口径）。
   ⑦ 收听计时跨场清零：停止/关闭/收起后 _listenTick 归 0，
      否则下次起播把隔场间隔算进时长（单笔封顶 10 分钟，虚高）。
   ⑧ 按篇账云同步的合并语义 = 单调 max（reps/ms/sents 累计、last 时间戳、pass2 布尔）。
      拉回快照逐键取 max 就是正确合并 —— 这是「换设备不丢」的地基，钉死它。 */
test.describe('⑥ 展开弹窗 Esc 关闭', () => {
  test('展开态按 Esc：收起（回到卡片，不离开 #/listen）', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await installSpeakStub(page);
    await page.locator('.ls-expand').click();
    await expect(page.locator('body')).toHaveClass(/listen-mode/);

    await page.keyboard.press('Escape');
    await expect(page.locator('body'), 'Esc 要收起弹窗').not.toHaveClass(/listen-mode/);
    await expect(page).toHaveURL(/#\/listen/, '收起不是离开随身听');
    await expect(page.locator('#appView .listen-page'), '收起后回到卡片').toBeVisible();
  });

  test('有普通浮层开着时 Esc 只关浮层，不动弹窗（分层）', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await installSpeakStub(page);
    await page.locator('.ls-expand').click();
    await expect(page.locator('body')).toHaveClass(/listen-mode/);
    // 弹一个普通浮层（A-B 循环菜单）
    await page.locator('#btnAB').click();
    await expect(page.locator('#abWrap')).toHaveClass(/open/);

    await page.keyboard.press('Escape');
    await expect(page.locator('#abWrap'), '第一层：浮层先关').not.toHaveClass(/open/);
    await expect(page.locator('body'), '弹窗这一层还在').toHaveClass(/listen-mode/);

    await page.keyboard.press('Escape');
    await expect(page.locator('body'), '第二层：弹窗才收').not.toHaveClass(/listen-mode/);
  });
});

test.describe('⑦ 收听计时跨场清零', () => {
  test('停止 / 关闭 / 暂停 清零；收起（播放继续）不清零', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await installSpeakStub(page);

    // 停止
    await page.locator('.ls-play').click();
    await expect.poll(() => page.evaluate(() => TASK.listenState().playing)).toBe(true);
    await page.evaluate(() => TASK.listenStop());
    expect(await page.evaluate(() => TASK.listenTickMs), '停止后清零').toBe(0);

    // 关闭
    await page.locator('.ls-play').click();
    await expect.poll(() => page.evaluate(() => TASK.listenState().playing)).toBe(true);
    await page.evaluate(() => TASK.listenClose());
    expect(await page.evaluate(() => TASK.listenTickMs), '关闭后清零').toBe(0);

    // 暂停（togglePlay 暂停分支：先 flush 再清零）
    await page.locator('.ls-play').click();
    await expect.poll(() => page.evaluate(() => TASK.listenState().playing)).toBe(true);
    await page.locator('.ls-play').click();
    await expect.poll(() => page.evaluate(() => TASK.listenState().playing)).toBe(false);
    expect(await page.evaluate(() => TASK.listenTickMs), '暂停后清零').toBe(0);

    // 收起（reduced-motion 下瞬时完成）：播放继续 → 计时必须还在走，不许清零
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('.ls-play').click();
    await expect.poll(() => page.evaluate(() => TASK.listenState().playing)).toBe(true);
    await page.evaluate(() => TASK.listenExpand());
    await expect(page.locator('body')).toHaveClass(/listen-mode/);
    await page.evaluate(() => TASK.listenCollapse());
    await expect.poll(() => page.evaluate(() => TASK.listenTickMs), '收起不清零（播放还在继续，账要接着记）')
      .toBeGreaterThan(0);
    // 真正停止才归零
    await page.evaluate(() => TASK.listenStop());
    expect(await page.evaluate(() => TASK.listenTickMs), '停止后清零').toBe(0);
  });
});

test.describe('⑧ 按篇账云同步：合并 = 单调 max', () => {
  test('远端快照逐键取 max：累计数取大、last 取新、pass2 true 赢；本机大的不被冲掉', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    // 合并按「日键/篇号」字符串折叠，与真实日期无关 —— 用固定日键断言更稳。
    // 本机账：reps[D][0]=3、listen.ms[D][0]=5000、listen.sents[D][0]=7、last[0]=1000、pass2[0]=true
    const D = '2026-09-25';
    await page.evaluate((day) => {
      TASK.mergeArticleAccount({
        reps: { [day]: { 0: 3 } },
        pass2: { 0: true },
        listen: { sents: { [day]: { 0: 7 } }, ms: { [day]: { 0: 5000 } }, last: { 0: 1000 } },
      });
    }, D);
    const snap1 = await page.evaluate(() => TASK.articleAccountSnapshot());
    expect(snap1.reps[D][0]).toBe(3);
    expect(snap1.pass2[0]).toBe(true);

    // 远端来了各键都**更小**的快照 + 一个新的篇：max 语义下本机不许被冲掉
    await page.evaluate((day) => {
      TASK.mergeArticleAccount({
        reps: { [day]: { 0: 1, 1: 2 } },
        pass2: {},
        listen: { sents: { [day]: { 0: 2, 1: 4 } }, ms: { [day]: { 0: 100, 1: 88 } }, last: { 0: 500, 1: 2000 } },
      });
    }, D);
    const snap2 = await page.evaluate(() => TASK.articleAccountSnapshot());
    expect(snap2.reps[D][0], '本机 3 > 远端 1').toBe(3);
    expect(snap2.reps[D][1], '远端新篇照样并入').toBe(2);
    expect(snap2.listen.sents[D][0], '本机 7 > 远端 2').toBe(7);
    expect(snap2.listen.sents[D][1]).toBe(4);
    expect(snap2.listen.ms[D][0], '本机 5000 > 远端 100').toBe(5000);
    expect(snap2.listen.ms[D][1]).toBe(88);
    expect(snap2.listen.last[0], 'last 取更大时间戳').toBe(1000);
    expect(snap2.listen.last[1]).toBe(2000);
    expect(snap2.pass2[0], 'pass2 一旦 true 不回落').toBe(true);
  });
});

/* ⑨（2026-09-25 链路排查）：通读真实用时（read.ms）跟着按篇账一起上云/合并 —— 单调 max。
   同一设备多次记累计、换设备拉回不丢。 */
test.describe('⑨ 真实用时 read.ms 的云同步合并', () => {
  test('远端快照取 max：本机小的被覆盖为大值，新天照并入', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    const D = '2026-09-25';
    await page.evaluate((day) => {
      TASK.mergeArticleAccount({ read: { ms: { [day]: 60000 } } });
    }, D);
    const s1 = await page.evaluate(() => TASK.articleAccountSnapshot());
    expect(s1.read.ms[D]).toBe(60000);
    // 远端同天更小 → 不冲掉；新天照并入
    await page.evaluate((day) => {
      TASK.mergeArticleAccount({ read: { ms: { [day]: 30000, '2026-09-24': 120000 } } });
    }, D);
    const s2 = await page.evaluate(() => TASK.articleAccountSnapshot());
    expect(s2.read.ms[D], '本机 60000 > 远端 30000').toBe(60000);
    expect(s2.read.ms['2026-09-24'], '新天照并入').toBe(120000);
  });
});

/* ⑩（2026-09-25 用户报「暂停按钮功能上是下一句」）：暂停必须停在当前句 ——
   高亮不动、不播下一句。走真实朗读引擎（不桩 speak）：暂停会 cancel 引擎，
   部分平台把 cancel 报成 onend，陈旧 end 不许推进链子（onend 已加代际守卫）。 */
test.describe('⑩ 暂停不推进', () => {
  test('暂停后：高亮停在当前句，3 秒内不许自己走到下一句', async ({ page }) => {
    test.setTimeout(60000);   // 真实引擎 + 外链字体（load 事件等全部子资源），网络抖动时 30s 会被 goto 吃光
    await stubData(page, TWO);
    await gotoListen(page);
    await page.locator('.ls-play').click();          // 真实引擎起播（headless 静音但不影响链路）
    await expect.poll(() => page.evaluate(() => TASK.listenState().idx), '起播后落在第 0 句').toBe(0);
    await page.locator('.ls-play').click();          // 暂停
    const idx = await page.evaluate(() => TASK.listenState().idx);
    await page.waitForTimeout(3000);
    const after = await page.evaluate(() => TASK.listenState());
    expect(after.idx, '暂停后高亮不许走').toBe(idx);
    expect(after.playing, '暂停后不许自己在播').toBe(false);
  });
});
