// playwright-tests/journeys/app3/word-bank-tabs.spec.ts
// 词库面板双视图（2026-10-10 用户：把 1.0 的「目标词速查」侧栏放回来——收进现有词库面板做 tab）：
//   'cur' = 本篇目标词（数据源 SECTIONS[cur].words，与正文 .w 高亮同源）；'all' = 六篇全量（chapters.json 分组）。
// currentChapter=-1（全部文章）时 'cur' 自动降级为全库。选择记忆在 localStorage['ielts-wq-view']；
// 面板开着切篇由 onChapterChange 侧即时刷新列表，📖（不在本篇正文）标记随切篇重建。
// 入口：#edgeTab 把手——3.0 外壳曾把它全局 display:none（词库面板桌面零入口），本轮在任务模式恢复。
import { test, expect } from '../../fixtures';
import { waitShadowReady } from '../../utils/app-ready';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
};
declare const onChapterChange: (val: string | number, fromTask?: boolean) => void;

const rootUrl = process.env.E2E_ROOT_URL || '';

const PAYLOAD = (() => {
  const mk = (title: string, lines: string[], words: string[]) => ({
    title, zh: title, subheads: ['第一卷'],
    paragraphs: [lines],
    sentZh: [lines.map((_, i) => `第 ${i + 1} 句译文。`)],
    paraZh: [''],
    words,
  });
  const sections = [
    mk('地球与生命', [
      'The [[atmosphere:atmosphere]] protects life.',
      'We need [[oxygen:oxygen]] to live.',
    ], ['atmosphere', 'oxygen', 'crust']),
    mk('校园与文化', [
      'Students [[library:library]] read books.',
      'The [[liberty:liberty]] matters.',
    ], ['library', 'liberty', 'lecture']),
  ];
  const vocab = {
    atmosphere: { p: 'ˈætməsfɪr', m: 'n. 大气；气氛；氛围', ex: 'The meeting was held in a relaxed atmosphere.', exZh: '会议在轻松的气氛中举行。' },
    oxygen: { m: 'n. 氧气' },
    crust: { m: 'n. 地壳' },
    library: { m: 'n. 图书馆' },
    liberty: { m: 'n. 自由' },
    lecture: { m: 'n. 讲座' },
  };
  const chapters = [
    { title: 'Chapter 1 · Earth and Life', words: ['atmosphere', 'oxygen', 'crust'] },
    { title: 'Chapter 2 · Campus and Culture', words: ['library', 'liberty', 'lecture'] },
  ];
  return {
    'sections.json': JSON.stringify(sections),
    'vocab.json': JSON.stringify(vocab),
    'chapters.json': JSON.stringify(chapters),
  };
})();

async function stubData(page: import('@playwright/test').Page) {
  for (const [name, body] of Object.entries(PAYLOAD)) {
    await page.route(`**/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}

/* 进任务模式（唯一露出正文与 #edgeTab 把手的视图）→ 点把手开词库面板 */
async function enterReadingAndOpenPanel(page: import('@playwright/test').Page, chapter = 0) {
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.locator('.art-card .a-open').first().click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  if (chapter !== 0) await page.evaluate(() => onChapterChange(chapter));
  await expect(page.locator('#edgeTab'), '任务模式下词库把手可见（3.0 外壳曾藏掉它）').toBeVisible();
  await page.locator('#edgeTab').click();
  await expect(page.locator('#panel')).toBeVisible();
}

test.describe('词库面板双视图（目标词侧栏回归）', () => {
  test('任务模式：把手可见，本篇视图无分组头、卡数对上 SECTIONS[cur].words、不在正文的词带 📖', async ({ page }) => {
    await stubData(page);
    await page.goto(`${rootUrl}/index.html#/`);
    await waitShadowReady(page);
    await enterReadingAndOpenPanel(page, 0);

    await expect(page.locator('#wqTabCur'), '默认视图 = 本篇目标词').toHaveClass(/on/);
    await expect(page.locator('#vlist .g'), '单篇视图不出现章分组头').toHaveCount(0);
    await expect(page.locator('#vlist .item')).toHaveCount(3);
    await expect(page.locator('#vlist .item').first()).toContainText('atmosphere');
    /* 📖 = 「不在本篇正文」：crust 在本篇词表但正文没有它 */
    await expect(page.locator('#vlist .item[data-k="crust"] .wtop b')).toHaveText(/📖/);
    await expect(page.locator('#vlist .item[data-k="atmosphere"] .wtop b')).not.toHaveText(/📖/);
    await expect(page.locator('#vcnt')).toContainText('3 / 本篇3词');
  });

  test('切「全部词库」：分组头回归；切换结果写 localStorage，切回也记录', async ({ page }) => {
    await stubData(page);
    await page.goto(`${rootUrl}/index.html#/`);
    await waitShadowReady(page);
    await enterReadingAndOpenPanel(page, 0);
    await expect(page.locator('#vlist .item')).toHaveCount(3);

    await page.locator('#wqTabAll').click();
    await expect(page.locator('#wqTabAll')).toHaveClass(/on/);
    await expect(page.locator('#wqTabCur')).not.toHaveClass(/on/);
    await expect(page.locator('#vlist .g')).toHaveCount(2);
    await expect(page.locator('#vcnt')).not.toContainText('本篇');
    expect(await page.evaluate(() => localStorage.getItem('ielts-wq-view'))).toBe('all');

    await page.locator('#wqTabCur').click();
    await expect(page.locator('#vlist .item')).toHaveCount(3);
    expect(await page.evaluate(() => localStorage.getItem('ielts-wq-view'))).toBe('cur');
  });

  test('切篇即时刷新：面板开着从篇 1 切篇 2，列表与 vcnt 跟着新篇走', async ({ page }) => {
    await stubData(page);
    await page.goto(`${rootUrl}/index.html#/`);
    await waitShadowReady(page);
    await enterReadingAndOpenPanel(page, 0);
    await expect(page.locator('#vlist .item').first()).toContainText('atmosphere');

    await page.evaluate(() => onChapterChange(1));
    await expect(page.locator('#vlist .item')).toHaveCount(3);
    await expect(page.locator('#vlist .item').first()).toContainText('library');
    await expect(page.locator('#vlist .item[data-k="lecture"] .wtop b')).toHaveText(/📖/);
    await expect(page.locator('#vcnt')).toContainText('3 / 本篇3词');
  });

  test('刷新还原视图：all 记忆回 all，cur 记忆回 cur', async ({ page }) => {
    await stubData(page);
    await page.goto(`${rootUrl}/index.html#/`);
    await waitShadowReady(page);
    await enterReadingAndOpenPanel(page, 0);
    await page.locator('#wqTabAll').click();
    await expect(page.locator('#wqTabAll')).toHaveClass(/on/);

    await page.reload();
    await waitShadowReady(page);
    await enterReadingAndOpenPanel(page, 0);
    await expect(page.locator('#wqTabAll'), '刷新后仍是全部词库').toHaveClass(/on/);
    await expect(page.locator('#vlist .g')).toHaveCount(2);

    await page.locator('#wqTabCur').click();
    await page.reload();
    await waitShadowReady(page);
    await enterReadingAndOpenPanel(page, 0);
    await expect(page.locator('#wqTabCur'), '刷新后回到本篇目标词').toHaveClass(/on/);
  });

  test('手机档（390×844）：tab 热区（盒子+::after 外扩）≥44；音标一体钮与快捷键条就位', async ({ page }) => {
    await stubData(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${rootUrl}/index.html#/`);
    await waitShadowReady(page);
    await enterReadingAndOpenPanel(page, 0);

    /* tab 视觉盒子刻意做小（用户否了大 pill），热区靠 ::after 外扩补到 44 口径 */
    for (const sel of ['#wqTabCur', '#wqTabAll']) {
      const m = await page.locator(sel).evaluate((el) => {
        const b = (el as HTMLElement).getBoundingClientRect();
        const a = getComputedStyle(el, '::after');
        let w = b.width, h = b.height;
        if (a.content !== 'none' && a.display !== 'none') {
          const parts = (a.inset || '0px').split(/\s+/).map((x) => Math.abs(parseFloat(x) || 0));
          const tb = parts[0] || 0, lr = parts.length > 1 ? parts[1] : tb;
          w += 2 * lr; h += 2 * tb;
        }
        return { w: Math.round(w), h: Math.round(h) };
      });
      expect(m.w, `${sel} 热区宽`).toBeGreaterThanOrEqual(44);
      expect(m.h, `${sel} 热区高`).toBeGreaterThanOrEqual(44);
    }
    /* 音标一体钮：每卡两颗（英/美），独立大喇叭按钮已废 */
    await expect(page.locator('#vlist .item[data-k="atmosphere"] .spk')).toHaveCount(2);
    await expect(page.locator('#vlist .item[data-k="atmosphere"] .spk[data-acc="uk"]')).toContainText('英');
    await expect(page.locator('#vlist .item[data-k="atmosphere"] .spk[data-acc="us"]')).toContainText('美');
    await expect(page.locator('#vlist .item[data-k="atmosphere"] .wtop > .spk')).toHaveCount(0);
    /* 快捷键速记条（桌面档可见） */
    await expect(page.locator('aside .wq-keys')).toBeVisible();
    await expect(page.locator('aside .wq-keys')).toContainText('切换卡片');
    await expect(page.locator('aside .wq-keys')).toContainText('朗读选中');
    await expect(page.locator('aside .wq-keys')).toContainText('收起');
  });

  test('手机档任务模式：抽屉盖过任务条（z 序 + 命中测试双锁；190 那版下沿被任务条压掉）', async ({ page }) => {
    await stubData(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${rootUrl}/index.html#/`);
    await waitShadowReady(page);
    await enterReadingAndOpenPanel(page, 0);

    /* 抽屉滑入有 .28s 过渡（translateY 102% → 0）。命中测试必须等变换落定再量——
       中途量的还是「滑行中间态」：抽屉顶边还没越过任务条中心，会假红（本用例首版就栽在这）。
       同 fixtures 的 fabSettled 口径：等 computed transform 回到恒等。 */
    await expect
      .poll(() => page.evaluate(() => {
        const t = getComputedStyle(document.getElementById('panel') as HTMLElement).transform;
        return t === 'none' || /^matrix\(1, 0, 0, 1, 0, 0\)$/.test(t);
      }), { message: '等待抽屉滑入过渡落定' })
      .toBe(true);

    const info = await page.evaluate(() => {
      const panel = document.getElementById('panel') as HTMLElement;
      const bar = document.querySelector('.task-bar') as HTMLElement | null;
      const fallback = { barVisible: false, zPanel: 0, zBar: 0, hitInPanel: false, hitDesc: '' };
      if (!bar || getComputedStyle(bar).display === 'none') return fallback;
      const r = bar.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) as HTMLElement | null;
      return {
        barVisible: true,
        zPanel: Number(getComputedStyle(panel).zIndex),
        zBar: Number(getComputedStyle(bar).zIndex),
        hitInPanel: !!(hit && panel.contains(hit)),
        hitDesc: hit ? `${hit.tagName}.${String(hit.className)}` : 'null',
      };
    });
    expect(info.barVisible, '任务模式里任务条应可见（本用例前提）。若任务条改版隐藏，请连同本锁一起复核').toBe(true);
    expect(info.zPanel, '抽屉 z（=220）必须高过任务条 z（=200）').toBeGreaterThan(info.zBar);
    /* 命中测试是最硬的锁：任务条几何中心点当时最顶上的元素必须在抽屉里。
       190 那版这里命中 .task-bar 自己（或它的按钮），视觉上就是任务条画在抽屉上、压掉下沿一截。 */
    expect(info.hitInPanel, `任务条中心点应由抽屉接住，实际命中 ${info.hitDesc}`).toBe(true);
  });

  /* ---------- 2026-10-10 二轮（用户截图：左侧无内距 + 对齐 8901 细节）回归锁 ---------- */
  test('面板细节回归锁（1.0 对齐）：列表两侧 12px 内距、例句译文收进框内 .ex .cn', async ({ page }) => {
    await stubData(page);
    await page.goto(`${rootUrl}/index.html#/`);
    await waitShadowReady(page);
    await enterReadingAndOpenPanel(page, 0);

    /* 两侧内距：修复前 .list 零内距，卡片左缘贴死面板边框（右缘却因滚动条有空隙）。
       断言卡片盒到面板盒左右都 ≥12，且左右差不悬殊（差值 = 滚动条占位 0~11px）。 */
    const m = await page.evaluate(() => {
      const panel = document.getElementById('panel') as HTMLElement;
      const list = document.getElementById('vlist') as HTMLElement;
      const item = list.querySelector('.item') as HTMLElement;
      const pr = panel.getBoundingClientRect(), ir = item.getBoundingClientRect();
      return {
        padL: getComputedStyle(list).paddingLeft,
        padR: getComputedStyle(list).paddingRight,
        padB: getComputedStyle(list).paddingBottom,
        leftGap: Math.round(ir.left - pr.left),
        rightGap: Math.round(pr.right - ir.right),
      };
    });
    expect(m.padL, 'list 左内距').toBe('12px');
    expect(m.padR, 'list 右内距').toBe('12px');
    expect(m.padB, 'list 底内距（1.0 .wq-list 同款 12px）').toBe('12px');
    expect(m.leftGap, '卡片距面板左缘（边框 1 + 内距 12）').toBeGreaterThanOrEqual(12);
    expect(m.leftGap).toBeLessThan(16);
    expect(m.rightGap, '右侧同理，只多滚动条占位').toBeGreaterThanOrEqual(m.leftGap);
    expect(m.rightGap - m.leftGap, '左右差 = 滚动条占位（overlay=0 / 经典 5~15px），不应再是单侧贴死').toBeLessThanOrEqual(16);

    /* 例句译文收进 .ex 框内（1.0 .wq-ex 的 .en/.cn 结构）；旧的框外 .exzh 已废 */
    const ex = page.locator('#vlist .item[data-k="atmosphere"] .ex');
    await expect(ex.locator('.en')).toHaveText('The meeting was held in a relaxed atmosphere.');
    await expect(ex.locator('.cn')).toHaveText('会议在轻松的气氛中举行。');
    await expect(page.locator('#vlist .exzh'), '框外译文行已删').toHaveCount(0);
  });

  test('选中即发音：↑↓ 导航落定朗读该卡、点卡朗读单词、音标钮带口音参数', async ({ page }) => {
    await stubData(page);
    await page.goto(`${rootUrl}/index.html#/`);
    await waitShadowReady(page);
    await enterReadingAndOpenPanel(page, 0);
    /* 录音笔：只记「要求朗读什么、带什么口音」，不回放（headless 无声卡） */
    await page.evaluate(() => {
      const w = window as unknown as { __said: { t: string; acc?: string }[]; speak: (...a: unknown[]) => void };
      w.__said = [];
      w.speak = (text: string, _cb: unknown, opts?: { voiceAcc?: string }) => {
        w.__said.push({ t: text, acc: opts && opts.voiceAcc });
      };
    });
    const lastSaid = () => page.evaluate(() => (window as unknown as { __said: { t: string; acc?: string }[] }).__said.at(-1));

    /* ↑↓ 落定即发音（用户 2026-10-10：快捷键上下选完的也要发音） */
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#vlist .item').first()).toHaveClass(/sel/);
    await expect.poll(lastSaid, { message: '↓ 落到第一张卡就朗读 atmosphere' }).toEqual({ t: 'atmosphere' });
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#vlist .item[data-k="oxygen"]')).toHaveClass(/sel/);
    await expect.poll(lastSaid).toEqual({ t: 'oxygen' });
    await page.keyboard.press('ArrowUp');
    await expect.poll(lastSaid).toEqual({ t: 'atmosphere' });

    /* 点卡任意空白 = 朗读单词（1.0 语义回归锁） */
    await page.locator('#vlist .item[data-k="crust"] .wtop b').click();
    await expect.poll(lastSaid).toEqual({ t: 'crust' });
    await expect(page.locator('#vlist .item[data-k="crust"]')).toHaveClass(/sel/);

    /* 音标钮：英/美各带口音参数（data-acc=uk/us → en-GB/en-US） */
    await page.locator('#vlist .item[data-k="atmosphere"] .spk[data-acc="uk"]').click();
    await expect.poll(lastSaid, { message: '点「英」按英音朗读' }).toEqual({ t: 'atmosphere', acc: 'en-GB' });
    await page.locator('#vlist .item[data-k="atmosphere"] .spk[data-acc="us"]').click();
    await expect.poll(lastSaid, { message: '点「美」按美音朗读' }).toEqual({ t: 'atmosphere', acc: 'en-US' });
  });

  test('起播前清队列只 cancel 一遍：cancel 后留 150ms 再 speak（曾因 go() 内第二遍 cancel 紧接 speak 被吞，音标钮/词卡偶发静默）', async ({ page }) => {
    await stubData(page);
    await page.goto(`${rootUrl}/index.html#/`);
    await waitShadowReady(page);
    await enterReadingAndOpenPanel(page, 0);
    /* 假引擎：cancel 异步生效（300ms 后 speaking 才回落）——复刻真浏览器「cancel 后状态残留一拍」的形状；
       若代码在残留窗口里又 cancel 一次，第二遍就紧贴 speak，正是被吞组合的形状。 */
    await page.evaluate(() => {
      const w = window as unknown as { __eng: Record<string, unknown> };
      const eng: Record<string, unknown> = {
        cancels: 0, speaks: 0, lastCancelAt: 0, lastSpeakAt: 0,
        speaking: true, pending: false, paused: false,
        getVoices: () => [],
        cancel() { (eng.cancels as number)++; eng.lastCancelAt = performance.now(); setTimeout(() => { eng.speaking = false; }, 300); },
        speak(u: SpeechSynthesisUtterance) {
          (eng.speaks as number)++; eng.lastSpeakAt = performance.now();
          try { if (u.onstart) (u.onstart as (ev: Event) => void)(new Event('start')); } catch (e) {}
        },
        resume() {}, pause() {}, addEventListener() {}, removeEventListener() {},
      };
      w.__eng = eng;
      Object.defineProperty(window, 'speechSynthesis', { value: eng, configurable: true });
    });
    const eng = () => page.evaluate(() => {
      const e = (window as unknown as { __eng: Record<string, number> }).__eng;
      return { cancels: e.cancels, speaks: e.speaks, gap: Math.round(e.lastSpeakAt - e.lastCancelAt) };
    });

    await page.locator('#vlist .item[data-k="oxygen"] .wtop b').click();
    await expect.poll(async () => (await eng()).speaks, { message: '应起播一次' }).toBe(1);
    const s = await eng();
    expect(s.cancels, '起播前清队列恰好 cancel 一遍（第二遍已删）').toBe(1);
    expect(s.gap, 'cancel 与 speak 之间留足 150ms，不构成同 tick 被吞组合').toBeGreaterThanOrEqual(140);
  });
});
