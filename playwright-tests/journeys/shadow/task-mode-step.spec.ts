// 2026-09-23 他四条实测缺陷（手机 ielts-vocab.bond 截图四张）：
//  ① 续读条与播放条重叠 —— 让位高度只在任务模式里量，而续读条恰恰出现在任务模式外；
//  ② 任务条那根位置条的圆点默认比横线低半个身子 —— 居中用的 translateY 只写在 hover/active 那条里；
//  ③ 任务模式里播放链自己往下跑，「听完一句」既不计完成也不出答题，播放键还留着 —— 他要「不点不放」；
//  ④ 通读跑完后条上写着「接着出这一批的词」，但兑现这句话的检查只挂在点「下一句」上，连读时永远不触发。
// 口径（他 2026-09-23 拍板，三问三答）：那颗键改名「放这一句」，放完记完成并自动前进到下一句；
// 循环遍数照当前设定跑完才算放完；接受任务模式里没有锁屏连读。
import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

declare const TASK: {
  buildQueue(): void; enterTaskMode(): void; active: boolean; hasPlan: boolean;
  resetV2(): void; initPlan(minutes: number): void;
  readDone(i: number): void;
  offerResume(): boolean; hideResumeOffer(): void;
  next(): void; prev(): void; again(): void;
  queue: { i: number }[];
  quizTotal(): number;
};

const ENV = process.env.E2E_ENVIRONMENT || 'local';

async function openShadow(page: import('@playwright/test').Page, baseURL: string, width = 390) {
  await page.setViewportSize({ width, height: 844 });
  await page.goto(`${baseURL}/index.html`);
  await expect(page.locator('.sent').first()).toBeVisible();
  await page.evaluate(() => { if (!TASK.hasPlan) { TASK.resetV2(); TASK.initPlan(15); } });
}

/* 把朗读引擎换成录音笔：__spoken 记「交给了引擎几句」，__finish() 手动兑现「这一句播完了」。
   不这么做就只能等真语音，headless 里 speechSynthesis 根本不发声。 */
async function installSpeakStub(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const w = window as unknown as {
      speak: (t: string, cb?: () => void) => void;
      __spoken: string[]; __cbs: (() => void)[]; __finish: () => void;
    };
    w.__spoken = []; w.__cbs = [];
    w.speak = function (t: string, cb?: () => void) {
      w.__spoken.push(String(t).slice(0, 20));
      if (cb) w.__cbs.push(cb);
    };
    w.__finish = () => { const cb = w.__cbs.shift(); if (cb) cb(); };
  });
}
const spoken = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken.length);

test.describe('任务模式 · 一步一停（2026-09-23 四条实测）', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);

  test('① 续读卡亮着时，播放条整颗在它上边，不压字', async ({ page, baseURL }) => {
    test.setTimeout(currentTimeout() * 6);
    await openShadow(page, baseURL);
    const geo = await page.evaluate(() => {
      localStorage.removeItem('ielts.shadow.resumeDay');
      const offered = TASK.offerResume();
      const bar = document.getElementById('taskBar')!;
      const ab = document.querySelector('.audiobar')!;
      return {
        offered, barH: bar.offsetHeight,
        gap: Math.round(bar.getBoundingClientRect().top - ab.getBoundingClientRect().bottom),
      };
    });
    expect(geo.offered).toBe(true);
    // gap>0 才算真让开；0 是贴边，负数就是他那张截图里的重叠
    expect(geo.gap, `续读卡高 ${geo.barH}px，播放条底边与它的间距只有 ${geo.gap}px`).toBeGreaterThan(0);  });

  test('② 任务条那根位置条：不碰它，圆点也压在横线中线上', async ({ page, baseURL }) => {
    test.setTimeout(currentTimeout() * 6);
    await openShadow(page, baseURL);
    await page.evaluate(() => { TASK.hideResumeOffer(); TASK.enterTaskMode(); });
    await expect(page.locator('#taskBar')).toBeVisible();
    const d = await page.evaluate(() => {
      const k = document.getElementById('tbKnob')!.getBoundingClientRect();
      const r = document.querySelector('.tb-rail')!.getBoundingClientRect();
      return { delta: (k.top + k.height / 2) - (r.top + r.height / 2) };
    });
    expect(Math.abs(d.delta), `圆点比横线中线低 ${d.delta}px`).toBeLessThan(1);
  });

  test('③ 任务模式里没有播放键，点「放这一句」只放这一句', async ({ page, baseURL }) => {
    test.setTimeout(currentTimeout() * 8);
    await openShadow(page, baseURL);
    await page.evaluate(() => { TASK.hideResumeOffer(); TASK.enterTaskMode(); });
    await expect(page.locator('#taskBar')).toBeVisible();
    await expect(page.locator('#btnPlay')).not.toBeVisible();
    expect(await page.evaluate(() => TASK.queue.length), '队列为空 = 下面全是空测').toBeGreaterThan(1);

    await installSpeakStub(page);
    const title = await page.locator('#tbNext').innerText();
    expect(title).toContain('放这一句');
    await page.locator('#tbNext').click();
    expect(await spoken(page)).toBe(1);            // 不许预取把后两句一起塞进引擎

    const before = await page.locator('#tbTitle').innerText();
    await page.evaluate(() => (window as unknown as { __finish: () => void }).__finish());
    await page.waitForTimeout(400);
    expect(await spoken(page), '这一句放完后引擎里不该再有下一句').toBe(1);
    const after = await page.locator('#tbTitle').innerText();
    expect(after).not.toBe(before);                 // 通读那个数要动
  });

  test('④ 这批最后一句放完，不等第二下就把答题面端上来', async ({ page, baseURL }) => {
    test.setTimeout(currentTimeout() * 8);
    await openShadow(page, baseURL);
    // 先进模式再取队列：todayQueue 是 enterTaskMode 里 buildQueue 才填的，
    // 早一步读它拿到的是空数组 —— 空夹具会把这条用例变成"什么都没测的绿灯"。
    const n = await page.evaluate(() => {
      TASK.hideResumeOffer(); TASK.enterTaskMode();
      const q = TASK.queue;
      for (let k = 1; k < q.length; k++) TASK.readDone(q[k].i);   // 只留第一句没读
      return q.length;
    });
    expect(n, '队列没建起来 = 这条用例什么都没测').toBeGreaterThan(1);
    await installSpeakStub(page);
    await page.locator('#tbNext').click();
    await page.evaluate(() => (window as unknown as { __finish: () => void }).__finish());
    await expect(page.locator('#taskCard')).toBeVisible({ timeout: 5000 });
    expect(await page.evaluate(() => TASK.quizTotal())).toBeGreaterThan(0);
  });

  /* ⑤ 他 2026-09-23 追报：「高亮错误，现在全都高亮」。量过 —— 今天这批 36 句每句都染 6% 绿底，
     而「正在读哪句」全站只有一句，36 句连成一片就把那一句淹掉了。
     这条锁的是"底色只属于当前句"这个不变式：队列那批靠左边那道竖条说话，不靠底色。
     注意 :not(.playing) —— 少了它，清底色的规则会连当前句一起抹平（第一版就是这么错的）。 */
  test('⑤ 任务模式里带底色的只有当前那一句，今天这批不再整片染绿', async ({ page, baseURL }) => {
    test.setTimeout(currentTimeout() * 6);
    await openShadow(page, baseURL);
    await page.evaluate(() => { TASK.hideResumeOffer(); TASK.enterTaskMode(); });
    await expect(page.locator('#taskBar')).toBeVisible();
    const n = await page.evaluate(() => {
      const all = [...document.querySelectorAll('.sent')];
      const painted = all.filter((e) => {
        const cs = getComputedStyle(e);
        return cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.backgroundImage !== 'none';
      });
      return { total: all.length, taskMarked: all.filter(e =>
          e.classList.contains('task-new') || e.classList.contains('task-review') || e.classList.contains('task-done')).length,
        painted: painted.length, paintedIsPlaying: painted.every(e => e.classList.contains('playing')) };
    });
    expect(n.taskMarked, '今天这批一句都没标 = 夹具空了，这条什么都没测').toBeGreaterThan(3);
    expect(n.painted, `带底色的句子有 ${n.painted} 句，应当只剩当前那 1 句`).toBe(1);
    expect(n.paintedIsPlaying, '带底色的那一句必须是当前句本身').toBe(true);
  });

  /* ⑥ 读完一句，它得从「今天这批」里退出去。以前 done 对新句额外要求 reps>=3，
     而队列往前走只看「今天读过没有」—— 一步一停之后每句每天只记一次，两把尺不一致，
     结果整批从头绿到尾，这条标记不再说"我读到哪儿"了。他 2026-09-23 报的「全都高亮」的另一半。 */
  test('⑥ 放完一句，它就从「今天这批」的绿竖条里退出去（标记和队列同一把尺）', async ({ page, baseURL }) => {
    test.setTimeout(currentTimeout() * 8);
    await openShadow(page, baseURL);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    await page.evaluate(() => { TASK.hideResumeOffer(); TASK.enterTaskMode(); });
    await expect(page.locator('#taskBar')).toBeVisible();
    await installSpeakStub(page);
    const pile = () => page.evaluate(() => {
      const all = [...document.querySelectorAll('.sent')];
      return { green: all.filter(e => e.classList.contains('task-new')).length,
        grey: all.filter(e => e.classList.contains('task-done')).length };
    });
    const before = await pile();
    expect(before.green, '开局这批应当全是"没读过的绿" = 夹具空了').toBeGreaterThan(3);
    expect(before.grey, '开局不该已经有退出去的').toBe(0);

    await page.locator('#tbNext').click();
    await page.evaluate(() => (window as unknown as { __finish: () => void }).__finish());
    await page.waitForTimeout(500);
    const after = await pile();
    expect(after.green, `放完一句后绿竖条还是 ${after.green}，一句都没退出去`).toBe(before.green - 1);
    expect(after.grey, '退出去的那句应当变成"已读"那一档').toBe(1);
  });

  /* ⑦ iPad / iOS 的 Chromium 常态：SpeechSynthesisUtterance 只报 onstart，**不报 onend**。
     以前这句会被当成"失败"，于是换一副音色把同一句再念一遍，条上那个数一动不动 ——
     他 2026-09-23 报的「点放这一句永远不变，发个声就卡住」。修法：onstart 已经发生过就等于放过了，
     直接往前，不再重试。这条用例不靠真语音，直接把引擎换成"只报开始"。 */
  test('⑦ 引擎只报开始不报结束时（iPad 的常态）：同一句只念一遍，看门狗到点要推进度', async ({ page, baseURL }) => {
    test.setTimeout(currentTimeout() * 8);
    await openShadow(page, baseURL);
    await page.evaluate(() => {
      const proto = Object.getPrototypeOf(speechSynthesis);
      const w = window as unknown as { __sp: { text: string; voice: string }[] };
      w.__sp = [];
      proto.speak = function (u: SpeechSynthesisUtterance) {
        w.__sp.push({ text: (u.text || '').slice(0, 24), voice: u.voice ? u.voice.name : '-' });
        setTimeout(() => { if (u.onstart) u.onstart({} as SpeechSynthesisEvent); }, 30);
        // onend 永不 —— 这就是 iOS 上观察到的形状
      };
    });
    await page.evaluate(() => { TASK.hideResumeOffer(); TASK.enterTaskMode(); });
    await expect(page.locator('#taskBar')).toBeVisible();
    const before = await page.locator('#tbTitle').innerText();
    await page.locator('#tbNext').click();
    // 看门狗下限 8 秒，所以这里必须等过 8 秒才看得到推进；等不到就是真卡住
    await expect.poll(() => page.locator('#tbTitle').innerText(), { timeout: 20000, intervals: [1000, 2000] })
      .not.toBe(before);
    const sp = await page.evaluate(() => (window as unknown as { __sp: { text: string }[] }).__sp);
    expect(sp.length, `同一句被提交了 ${sp.length} 次 = 又去换音色重播了`).toBe(1);
  });

  /* ⑧ 他 2026-09-23 补的口径：那颗键点过之后要翻成「下一句」—— 第一下「放这一句」，
     第二下不再是重放，而是把这句收尾、跳到队列里下一句。
     反向也锁住：自动前进 / 「上一句」都得回到「放这一句」（退回来是"再听一遍这句话"，
     不是"接着往下走"）。判据是 #tbNext 自己点过没有，不是 playing —— prev() 也会起播。 */
  test('⑧ 点过「放这一句」之后那颗键翻成「下一句」，点一下收尾前进', async ({ page, baseURL }) => {
    test.setTimeout(currentTimeout() * 8);
    await openShadow(page, baseURL, 1280);   // 窄屏上这颗字被 font-size:0 收掉，只看得到图标
    await page.evaluate(() => { TASK.hideResumeOffer(); TASK.enterTaskMode(); });
    await expect(page.locator('#taskBar')).toBeVisible();
    await installSpeakStub(page);
    const next = page.locator('#tbNext');
    const title = () => page.locator('#tbTitle').innerText();

    await expect(next).toContainText('放这一句');
    const t0 = await title();
    await next.click();
    await expect(next).toContainText('下一句');        // 点过 → 翻名
    expect(await title(), '第一下只是"放"，不该已经前进').toBe(t0);

    await next.click();                                // 第二下 = 收尾前进
    await expect.poll(() => title()).not.toBe(t0);
    await expect(next).toContainText('放这一句');       // 换了一句 → 回到"放"

    await page.locator('#tbPrev').click();             // 退回来：仍是"放"，不是"继续往下走"
    await expect(next).toContainText('放这一句');
  });
});
