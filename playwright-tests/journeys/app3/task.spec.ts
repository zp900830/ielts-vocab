// 3.0 M1 Task 5：点首页卡片 → 进这一篇的任务模式（按篇队列 + ① 通读）。
// 服务器归 global-setup.ts 起停（仓库根 8932）；站点在仓库根，所以用 E2E_ROOT_URL。
//
// 数据用 stub 而不用真课文（和 shell.spec / home.spec 同一理由）：真课文一页 1833 句 +
// 3242 词，整套并行时会压出 shadow 用例偶发红。这里要的是「有 [[词:形式]] 标记的真句子」，
// 引擎据此才能排句 —— 六篇句数刻意不等，才能锁住「按篇」而不是「全局」。
import fs from 'node:fs';
import { test, expect } from '../../fixtures';
import { setMin } from '../../utils/min-slider';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  readDone(i: number): void;
  next(): void;
  queue: { i: number }[];
  hasPlan: boolean;
  state(): { daily: Record<string, unknown> };
  events(): unknown[];
  repsOf(a: number): number;
  todayProgress(): { done: number; planned: number; left: number };
  exportBackup(): void;
};
declare const ShadowPlan: {
  articleScope(sections: unknown, article: number): Set<number>;
  dayKey(ts: number, b: number): string;
};
declare const SECTIONS: { title: string; paragraphs: string[][] }[];

const rootUrl = process.env.E2E_ROOT_URL || '';

/* 六篇，句数刻意不等：第 0 篇 12 句，其余各 2 句 → 全局 22 句。
   每个词带篇号前缀（a0_w0 / a1_w0 …），否则引擎的「一个词只算一次」会把后几篇的
   同名词当成第 0 篇的重复，全局队列缩回第 0 篇 —— 那样就锁不住「按篇」了。
   若任务条拿的是全局句数，N 会是 22；按篇才该是 12。 */
const SIX: Record<string, string> = (() => {
  const mk = (title: string, ai: number, n: number) => ({
    title,
    zh: title,
    subheads: [''],
    paragraphs: [Array.from({ length: n }, (_, i) => `Sentence ${i} about [[a${ai}_w${i}:a${ai}_w${i}]].`)],
    sentZh: [Array.from({ length: n }, (_, i) => `第 ${i} 句。`)],
    paraZh: [''],
  });
  const titles = ['地球与生命', '校园与文化', '衣食住行', '社会与规则', '历史与发明', '身体与时间'];
  return {
    'sections.json': JSON.stringify(titles.map((t, i) => mk(t, i, i === 0 ? 12 : 2))),
    'vocab.json': '{}',
    'chapters.json': '[]',
  };
})();

async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }),
    );
  }
}

/* 等 app 真正就位：loadData 落地（SECTIONS 非空）+ TASK.init 跑过（ROOT2.state.daily 存在）。
   page.reload() 在 load 事件就返回，而 initApp 的 loadData().then(TASK.init) 还在后面异步跑 ——
   不等这一步，紧跟其后的 page.evaluate(readDone / seedArticleForTest / SECTIONS) 会落在
   尚未初始化的页面上静默空转（全量并行时 loadData 变慢就偶发，单跑几乎撞不上）。 */
async function waitAppReady(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => {
    try {
      return typeof SECTIONS !== 'undefined' && SECTIONS.length > 0
        && typeof TASK !== 'undefined' && !!(TASK.state() && TASK.state().daily);
    } catch (e) { return false; }
  });
}

/* 造一份「刚建好、还没读」的 15 分钟计划，然后刷新让首页读到它。 */
async function freshPlan(page: import('@playwright/test').Page) {
  await waitAppReady(page);   // 首次加载也要就位，resetV2 的 indexWords 才拿得到真 SECTIONS
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await waitAppReady(page);   // 刷新后必须等 init 完成，调用方紧接着的 evaluate 才不是空转
}

/* 把朗读引擎换成录音笔：__spoken 记交给了引擎几句，__finish() 手动兑现「这句播完了」。
   headless 里 speechSynthesis 根本不发声，不这么做 taskSentenceFinished（→ bumpArticleRep）
   永远不会被叫到（和 shadow/task-mode-step.spec.ts 同一套 stub）。 */
async function installSpeakStub(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const w = window as unknown as { speak: (t: string, cb?: () => void) => void; __cbs: (() => void)[] };
    w.__cbs = [];
    w.speak = function (t: string, cb?: () => void) { if (cb) w.__cbs.push(cb); };
  });
}
const finishSpeak = (page: import('@playwright/test').Page) =>
  page.evaluate(() => { const w = window as unknown as { __cbs: (() => void)[] }; const cb = w.__cbs.shift(); if (cb) cb(); });

const curIdx = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const p = document.querySelector('#art .sent.playing');
    return p ? Array.from(document.querySelectorAll('#art .sent')).indexOf(p) : -1;
  });

/* 口径 A（2026-09-25 用户拍板）：任务模式里的「下一句」= 屏幕上紧挨着的下一句 ——
   哪怕那句的词不在今天批次（被 assemble 排除、队列里没有它）也照去，不许整句跳过。
   复现用户的局面：队列 = [0, 2, 3, …]（第 1 句的词今天已见过 → 不在批次），
   站在第 0 句点「下一句」必须落到第 1 句，而不是按队列跳到第 2 句。 */
test('口径 A：下一句=屏幕上紧邻的下一句（不在今天批次也照去）', async ({ page }) => {
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); TASK.readDone(1); });
  await page.reload();
  await waitAppReady(page);
  await page.locator('.art-card').first().click();
  await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'read');
  await installSpeakStub(page);

  // 进任务模式落在队列第一条没读的（= 文章第 0 句）
  expect(await curIdx(page), '落在第 0 句').toBe(0);
  // 队列确实跳过了第 1 句（它的词今天已见过）—— 这是 assemble 的口径，不动
  const inQueue = await page.evaluate(() => TASK.queue.map((q: { i: number }) => q.i));
  expect(inQueue, '夹具要真造出「第 1 句不在队列」').not.toContain(1);
  expect(inQueue[0], '队列第一条 = 第 0 句').toBe(0);

  await page.locator('#tbNext').click();          // 放这一句（第 0 句）
  await finishSpeak(page);                        // 播完记完成
  await page.locator('#tbNext').click();          // 下一句
  expect(await curIdx(page), '必须落到屏幕上紧邻的第 1 句，不许按队列跳到第 2 句').toBe(1);
  await finishSpeak(page);
  await page.locator('#tbNext').click();          // 再下一句 → 第 2 句（它回到了队列正轨）
  expect(await curIdx(page)).toBe(2);
});

test.describe('3.0 文章任务模式（按篇队列）', () => {
  test('点卡片 → 任务模式，主行 n/N 是今天的计划句数（口径 A，不是这一篇）', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/index.html#/home`);
    await freshPlan(page);
    await page.locator('.art-card').first().click();
    await expect(page.locator('body')).toHaveClass(/task-mode/);
    await expect(page.locator('#taskBar')).toBeVisible();
    const n = await page.evaluate(() =>
      Number(document.getElementById('tbTitle')!.textContent!.match(/\/\s*(\d+)/)![1]));
    const tp = await page.evaluate(() => TASK.todayProgress());
    expect(tp.planned, '今天的分母要真造出来').toBeGreaterThan(0);
    expect(n, '任务条的 N 必须是今天计划的句数（口径 A）').toBe(tp.planned);
    const art0 = await page.evaluate(() => ShadowPlan.articleScope(SECTIONS, 0).size);
    const all = await page.evaluate(() =>
      SECTIONS.reduce((a, s) => a + s.paragraphs.reduce((x, p) => x + p.length, 0), 0));
    expect(art0, '夹具要让第 0 篇句数 ≠ 全局句数，否则分不清今天/本篇').not.toBe(all);
  });

  test('按篇队列：排出来的句一句都不许出这一篇', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/index.html#/home`);
    await freshPlan(page);
    await page.locator('.art-card').nth(1).click();   // 第二篇
    await expect(page.locator('#taskBar')).toBeVisible();
    const got = await page.evaluate(() => ({
      q: TASK.queue.map((x) => x.i),
      scope: Array.from(ShadowPlan.articleScope(SECTIONS, 1)),
    }));
    expect(got.q.length, '队列为空 = 这条什么都没测').toBeGreaterThan(0);
    expect(got.q.every((i) => got.scope.includes(i)), `队列混进了第二篇以外的句：${got.q}`).toBe(true);
  });

  test('任务模式里正文是主角：#appShell 让位，#art 可见', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/index.html#/home`);
    await freshPlan(page);
    await page.locator('.art-card').first().click();
    await expect(page.locator('#taskBar')).toBeVisible();
    expect(await page.locator('#appShell').isVisible(), '任务模式里首页外壳必须让位').toBe(false);
    await expect(page.locator('#art')).toBeVisible();
    await expect(page.locator('#art .sent').first()).toBeVisible();
  });

  test('横幅的文章名与「还剩」读的是同一篇（T4）', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/index.html#/home`);
    await freshPlan(page);
    const main = page.locator('#homeBanner .hb-main');
    // 先等横幅落地（数据是异步拉的）——不等就 evaluate 读 SECTIONS 会偶发 undefined。
    await expect(main).toContainText('继续学');
    /* refine3 ⑤：底部续读条删掉后，横幅的「还剩」改说**今天**这本账（todayProgress().left），
       不再拿文章未读总量；文章名仍是「第一篇还没读完的」。两者都要与各自出口同源。 */
    const info = await page.evaluate(() => ({
      title: SECTIONS[0].title,
      left: (TASK as unknown as { todayProgress(): { left: number } }).todayProgress().left,
    }));
    await expect(main).toContainText(`《${info.title}》`);
    await expect(main, '「今天还剩」的 N 必须与今天这本账（todayProgress）同源').toContainText(`今天还剩 ${info.left} 句`);
  });

  // 审阅 I1：任务模式没有顶栏，光一颗 ✕ 不说明「退出 = 回首页选下一篇」。
  test('任务模式顶栏：文章标题 + 返回首页，点了回首页（I1）', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/index.html#/home`);
    await freshPlan(page);
    await page.locator('.art-card').first().click();
    await expect(page.locator('body')).toHaveClass(/task-mode/);

    const top = page.locator('#taskTop');
    // G（2026-09-25）：第二排撤掉后 #taskTop 自身零高（只含 fixed 的 #readerHead），断言可见的 #readerHead。
    await expect(page.locator('#readerHead')).toBeVisible();
    // W1 重做：头部照抄主站 .reader-head —— 返回是 .back 圆钮，标题是 .r-title 里的 .tt-zh
    await expect(top.locator('.reader-head .back')).toBeVisible();
    await expect(top.locator('#ttTitle .tt-zh')).toHaveText('地球与生命');
    await expect(top.locator('#ttTitle .r-pos')).toContainText('第 1 / 6 篇');

    await top.locator('.reader-head .back').click();
    await expect(page.locator('body')).not.toHaveClass(/task-mode/);
    // 文章内头部只在任务模式现身（一级页面头部是 #shellTop，见 leftovers.spec.ts）
    await expect(page.locator('#taskTop')).toBeHidden();
    await expect(page.locator('.art-card')).toHaveCount(6);
  });

  // 2026-09-24 用户：任务条那颗 ✕ 去掉，退出走头部「返回」；退出零惩罚，所以不再摆二次确认。
  test('任务条没有 ✕ 了；退出走头部「返回」，直接退不摆二次确认', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/index.html#/home`);
    await freshPlan(page);
    await page.locator('.art-card').first().click();
    await expect(page.locator('#taskBar')).toBeVisible();
    expect(await page.locator('#tbExit').count(), '✕ 已删').toBe(0);
    expect(await page.locator('#tbStay').count(), '「继续做」已删').toBe(0);
    expect(await page.locator('#tbQuit').count(), '「退出」确认键已删').toBe(0);
    // 头部「返回」→ 直接退出，中途不出现 data-state=exit 的确认态
    await page.locator('#taskTop .reader-head .back').click();
    await expect(page.locator('body')).not.toHaveClass(/task-mode/);
    expect(await page.locator('#taskBar').getAttribute('data-state')).not.toBe('exit');
  });

  // ④ 任务模式（沉浸式阅读）用原背景色（暖白 #faf8f4），不是首页那套主站薄荷底。
  test('任务模式底色回到暖白，和首页薄荷底不一样', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/index.html#/home`);
    await freshPlan(page);
    const homeBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.locator('.art-card').first().click();
    await expect(page.locator('body')).toHaveClass(/task-mode/);
    const taskBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(taskBg, `任务模式底色 ${taskBg} 应与首页 ${homeBg} 不同`).not.toBe(homeBg);
    expect(taskBg, '任务模式回到影子跟读那套暖白').toBe('rgb(250, 248, 244)');
  });

  // 审阅 I2：退出后首页卡片/横幅还停在进任务模式前的进度，要等点导航或刷新才更新。
  test('退出任务模式后首页立即刷新，不用刷新页面（I2）', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/index.html#/home`);
    await freshPlan(page);
    await page.locator('.art-card').first().click();
    await expect(page.locator('body')).toHaveClass(/task-mode/);
    // 读前 6 句（12 句的一篇）：卡片显示**通读完成度** = 6/12 = 50%
    await page.evaluate(() => {
      Array.from(ShadowPlan.articleScope(SECTIONS, 0)).slice(0, 6).forEach((i) => TASK.readDone(i));
    });
    await page.locator('#taskTop .reader-head .back').click();
    await expect(page.locator('body')).not.toHaveClass(/task-mode/);
    await expect(page.locator('.art-card').first().locator('.a-pct')).toHaveText('50%');
  });
});

/* ===== 2026-10-10 ② 删除后的收工态 =====
   ① 队列读满 / 额度读满 → finishTask() → 任务条进 done 态：
   全局还有剩 → 「本篇完成 / 今天读够了 · 继续读」；真读完 → 「今天完成 · 看词本 / 回首页」。 */
test.describe('3.0 收工态（② 删除后：① 读满直接收工）', () => {
  test('今天全读完 → 收工「今天完成 · 看词本」', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/index.html#/home`);
    await freshPlan(page);
    await page.evaluate(() => {
      for (let a = 0; a < SECTIONS.length; a++) {
        Array.from(ShadowPlan.articleScope(SECTIONS, a)).forEach((i: number) => TASK.readDone(i));
      }
    });
    await page.locator('.art-card').first().click();
    await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'done');
    await expect(page.locator('#tbTitle')).toContainText('今天完成');
    await expect(page.locator('#tbNext')).toContainText('看词本');
    await expect(page.locator('#tbAgain')).toContainText('回首页');
    // 看词本 → #/words
    await page.locator('#tbNext').click();
    await expect(page).toHaveURL(/#\/words/);
    await expect(page.locator('#appView')).toContainText('单词本');
  });

  test('收工态「回首页」→ 首页六张卡片', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/index.html#/home`);
    await freshPlan(page);
    await page.evaluate(() => {
      for (let a = 0; a < SECTIONS.length; a++) {
        Array.from(ShadowPlan.articleScope(SECTIONS, a)).forEach((i: number) => TASK.readDone(i));
      }
    });
    await page.locator('.art-card').first().click();
    await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'done');
    await page.locator('#tbAgain').click();
    await expect(page.locator('body')).not.toHaveClass(/task-mode/);
    await expect(page.locator('.art-card')).toHaveCount(6);
  });

  test('额度读满、本篇没读完 → 收工分岔「今天读够了 · 继续读」，点了扩回全局队列', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/index.html#/home`);
    await waitAppReady(page);
    /* 5 分钟档：今天的额度（12 句）小于全书句数（22 句）—— 只有额度比书小，
       「额度读满、本篇还有没读的」才造得出来。15 分钟档会把 22 句全排进来，
       读满额度 = 全书读完，「本篇没读完」不存在（2026-10-10 实验修正：
       旧夹具「第 0 篇尾部补到额度」实际把第 0 篇 12 句全补完了）。 */
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(5); });
    await page.reload();
    await waitAppReady(page);
    // 读满额度：其它五篇全读（10 句），差的从第 0 篇尾部补 —— 第 0 篇主体（前 10 句）留着不读
    await page.evaluate(() => {
      const left = () => { const tp = TASK.todayProgress(); return tp.planned - tp.done; };
      for (let a = 1; a < SECTIONS.length; a++) {
        Array.from(ShadowPlan.articleScope(SECTIONS, a)).forEach((i: number) => TASK.readDone(i));
      }
      const s0 = Array.from(ShadowPlan.articleScope(SECTIONS, 0)).sort((x, y) => x - y);
      for (let k = s0.length - 1; k >= 0 && left() > 0; k--) TASK.readDone(s0[k]);
      const tp = TASK.todayProgress();
      if (!(tp.planned > 0 && tp.done >= tp.planned)) throw new Error('夹具要真造出「额度读满」');
    });
    // 前提：第 0 篇还有没读的句（否则「本篇没读完」无从谈起）
    const art0Unread = await page.evaluate(() => {
      const s = (TASK.state() as unknown as { sents: Record<number, { lastReadAt?: number }> }).sents || {};
      return Array.from(ShadowPlan.articleScope(SECTIONS, 0))
        .filter((i: number) => !(s[i] && (s[i].lastReadAt || 0) > 0)).length;
    });
    expect(art0Unread, '夹具前提：第 0 篇必须还有没读的句').toBeGreaterThan(0);

    await page.locator('.art-card').first().click();
    await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'read');
    // 额度闸：推进键一下就进收工态（「今天读够了 · 继续读」）
    await page.locator('#tbNext').click();
    await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'done');
    await expect(page.locator('#tbTitle')).toContainText('今天读够了');
    await expect(page.locator('#tbNext')).toContainText('继续读');
    // 继续读 → 扩回全局队列，回到 ① 通读态
    await page.locator('#tbNext').click();
    await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'read');
  });
});

/* 终审 B1（§2.3 / §13.1 / §14.2）：没计划的新用户点卡片，过去是静默无反应（if (!plan) return）。
   现在要：照进这一篇的任务模式（正文可读、自由跟读），任务条那一格换空状态 +「去设置」，
   点它进 v2.0 设置屏，建完计划回到这一篇换成真任务条。 */
test.describe('3.0 §2.3 没计划也能进任务模式', () => {
  test('新用户点卡片 → 自由跟读 + 空状态任务条 →「去设置」建计划 → 真任务条回来', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/index.html#/home`);
    // 全新用户：清掉真值根与 3.0 按篇账，刷新让首页读到「没计划」
    await page.evaluate(() => {
      localStorage.removeItem('ielts.shadow.v2');
      localStorage.removeItem('ielts.app3.article');
    });
    await page.reload();
    await expect(page.locator('#homeBanner .b-go')).toContainText('设置');

    // 点第一张卡：不再静默无反应 —— 进任务模式、正文可见
    await page.locator('.art-card').first().click();
    await expect(page.locator('body')).toHaveClass(/task-mode/);
    await expect(page.locator('#art')).toBeVisible();
    expect(await page.locator('#art .sent').count(), '正文必须渲出来').toBeGreaterThan(0);

    // 任务条那一格是空状态（§2.3）
    await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'noplan');
    await expect(page.locator('#tbTitle')).toContainText('还没有学习计划');
    await expect(page.locator('#tbSub')).toContainText('去设置「每天有多少分钟」');
    await expect(page.locator('#tbNext')).toContainText('去设置');
    // 自由跟读：播放条控件搬进任务条了，那颗 ▶ 也在
    await expect(page.locator('#taskBar .tb-play')).toBeVisible();
    await expect(page.locator('#taskBar #btnPlay')).toBeVisible();

    // 点「去设置」→ 出设置屏（复用影子跟读的 renderSetup）
    await page.locator('#tbNext').click();
    await expect(page.locator('body')).not.toHaveClass(/task-mode/);
    await expect(page.locator('#setupSheet .ps-start')).toBeVisible();

    // 建计划 → 回到那一篇，换成真任务条
    await setMin(page.locator('#setupSheet .min-range'), 15);        // 拖到 15 分钟
    await page.locator('#setupSheet .ps-start').click();
    await expect(page.locator('body')).toHaveClass(/task-mode/);
    await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'read');
    // 2026-09-24 用户：任务条那枚圈起来的阶段数字（①/②）去掉 —— 阶段靠文字仍读得出。
    // 锁两件事：圈不在（回归锁）+ 阶段名还在（不许连字一起删/变成一坨数字）。
    await expect(page.locator('#tbTitle')).toContainText('通读');
    await expect(page.locator('#tbTitle')).not.toContainText(/[①②③④]/);
  });
});

/* 终审 I2：repsByArticle 过去塞在共享的 ielts.shadow.v2 里（/shadow/ 已下线），重放/抹写
   这类风险已随旧站消失；现在锁两件事——账只住 3.0 自己的 key，且能进 exportBackup。 */
test.describe('3.0 按篇账不随共享 blob 走', () => {
  test('精读次数住自己的 key，reload 与备份都在', async ({ page }) => {
    /* 2026-10-10：本用例 2 次整页加载。当天早些时候 jsdelivr 不可达（本机 curl 也超时），
       每次加载要等 30s 子资源超时，曾临时把上限抬到 180s —— 当天把图标字体与 supabase-js
       改成自托管后，加载回到秒级，上限还给默认值：不拿余量掩盖慢。 */
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/index.html#/home`);
    await freshPlan(page);
    await page.evaluate(() => {
      localStorage.setItem('ielts.app3.article', JSON.stringify(
        { reps: { [ShadowPlan.dayKey(Date.now(), 4)]: { 0: 3 } } }));
    });
    await page.reload();
    await page.waitForFunction(() => { try { return !!(TASK.state() && TASK.state().daily); } catch (e) { return false; } });
    expect(await page.evaluate(() => TASK.repsOf(0))).toBe(3);
    // 共享 blob 里不许再有这份账（它只该住 ielts.app3.article）
    expect(await page.evaluate(() => (localStorage.getItem('ielts.shadow.v2') || '').includes('repsByArticle'))).toBe(false);

    // 备份：3.0 自己的 key 必须随 exportBackup 一起走（换设备才带得走精读次数）
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.evaluate(() => TASK.exportBackup()),
    ]);
    const payload = JSON.parse(fs.readFileSync((await download.path()) as string, 'utf8'));
    expect(Object.keys(payload.data), '备份必须含 ielts.app3.article').toContain('ielts.app3.article');

    /* 备份不许动按篇账（原先要「再 reload 一次复查」）：repsOf 有内存缓存，查不到
       「存储被抹」这回事，直接查 localStorage 本体更准、也省一次整页加载。 */
    expect(await page.evaluate(() => {
      const o = JSON.parse(localStorage.getItem('ielts.app3.article') || 'null') || {};
      return Object.keys(o.reps || {}).reduce((n: number, d: string) => n + (((o.reps[d] || {}) as Record<string, number>)['0'] || 0), 0);
    }), '备份不许抹掉按篇账').toBe(3);
  });
});

test.describe('3.0 终审顺手项', () => {
  test('Global Constraint：.b-go 触区 ≥44px（头部照抄主站，用 hit-slop 扩热区）', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/index.html#/home`);
    await freshPlan(page);
    // .b-go：横幅那颗
    const goH = await page.locator('#homeBanner .b-go').evaluate((el) => el.getBoundingClientRect().height);
    expect(goH, '.b-go 触区').toBeGreaterThanOrEqual(44);
    /* 文章内头部（W1 重做）：.back 照抄主站视觉尺寸（30px），触区靠 ::after 外扩（不撑大视觉）。
       M3：把「有效触区 = 视觉盒 + ::after 每边 inset」量出来断言 ≥44（PRD §10.4），不再只断言「它在」。 */
    await page.locator('.art-card').first().click();
    await expect(page.locator('#readerHead')).toBeVisible();
    const backHit = await page.locator('#taskTop .reader-head .back').evaluate((el) => {
      const r = el.getBoundingClientRect();
      const a = getComputedStyle(el, '::after');
      const slop = Math.max(Math.abs(parseFloat(a.top) || 0), Math.abs(parseFloat(a.left) || 0));
      return { w: r.width, h: r.height, slop, hitW: r.width + 2 * slop, hitH: r.height + 2 * slop };
    });
    expect(backHit.hitW, `back 有效触区宽 ${JSON.stringify(backHit)}`).toBeGreaterThanOrEqual(44);
    expect(backHit.hitH, `back 有效触区高 ${JSON.stringify(backHit)}`).toBeGreaterThanOrEqual(44);
    await page.locator('#taskTop .reader-head .back').click();
    await expect(page.locator('body')).not.toHaveClass(/task-mode/);
  });
});
