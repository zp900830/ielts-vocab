// playwright-tests/journeys/app3/words.spec.ts
// 3.0 M3：单词本页（PRD §6）。服务器归 global-setup.ts 起停（仓库根 8932）；
// /app/ 在仓库根，所以和 shell/home/stats 一样用 E2E_ROOT_URL，不走 baseURL。
import { test, expect } from '../../fixtures';
import { waitShadowReady } from '../../utils/app-ready';

declare const TASK: {
  hasPlan: boolean;
  resetV2(): void;
  initPlan(minutes: number): void;
  readDone(i: number): void;
  relearn(w: string): void;
  state(): {
    daily: Record<string, unknown>;
    words: Record<string, { stage: string; reps: number; ok3: number; err: number; leech: boolean; lastContactAt?: number }>;
    sents: Record<number, { lastReadAt: number }>;
  };
  article: number | null;
};
declare const ShadowPlan: {
  articleScope(sections: unknown, a: number): Set<number>;
  newWord(): Record<string, unknown>;
};
declare const SECTIONS: Array<{ title: string }>;
declare const VOCAB: Record<string, { p?: string; m?: string; uk?: string; us?: string; ex?: string; exZh?: string }>;
declare const APP3: {
  route(): void;
  current(): string;
  playSentence(a: number, gi: number): void;
};
declare const dataReady: boolean;

const rootUrl = process.env.E2E_ROOT_URL || '';

/* A5 之后全应用只有一份档位表（app/index.html 的 WB_FILTERS）：
   全部 + 五个真状态 + 重点词（重点词是叠在状态上的正交标记）。 */
const STAGES = ['fresh', 'seen', 'recognized', 'owned', 'graduated'];
const WB_KEYS = ['all'].concat(STAGES).concat(['leech']);

/* 两篇小课文 + 3 个已知目标词，够断言「文章关联 / 卷 / 出现次数 / 原文语境 / 联动」。
   句号：篇 0 = 0,1,2；篇 1 = 3,4。atmosphere 在篇 0 出现 2 次（第 0、2 句）。 */
const WORDS = (() => {
  const mk = (title: string, sub: string, lines: string[]) => ({
    title, zh: title, subheads: [sub],
    paragraphs: [lines],
    sentZh: [lines.map((_, i) => `第 ${i + 1} 句译文。`)],
    paraZh: [''],
  });
  const sections = [
    mk('地球与生命', '第一卷·远行', [
      'The [[atmosphere:atmosphere]] protects life.',
      'We need [[oxygen:oxygen]] to live.',
      'The [[atmosphere:atmosphere]] also keeps us warm.',
    ]),
    mk('校园与文化', '上篇·新生学期', [
      'Students [[oxygen:oxygen]] study in the [[library:library]].',
      'The [[library:library]] is quiet.',
    ]),
  ];
  const vocab = {
    atmosphere: { p: 'ˈætməsfɪr', m: 'n. 大气；气氛；氛围', uk: 'ˈætməsfɪə', us: 'ˈætməsfɪr',
      ex: 'The meeting was held in a relaxed atmosphere.', exZh: '会议在轻松的气氛中举行。', note: '词伙：lively atmosphere' },
    oxygen: { p: 'ˈɒksɪdʒən', m: 'n. 氧气', ex: 'Oxygen is essential for life.', exZh: '氧气是生命所必需的。' },
    library: { p: 'ˈlaɪbrəri', m: 'n. 图书馆', ex: 'She borrowed a book from the library.', exZh: '她从图书馆借了一本书。' },
  };
  return {
    'sections.json': JSON.stringify(sections),
    'vocab.json': JSON.stringify(vocab),
    'chapters.json': '[]',
  };
})();

/* 大词表：一篇 120 句、每句 1 个独有目标词 —— 专门锁「不能一次渲染全部」。 */
const BIG = (() => {
  const lines = Array.from({ length: 120 }, (_, i) => `Sentence ${i} about [[w${i}:w${i}]].`);
  const sections = [{ title: '大地', zh: '大地', subheads: ['第一卷'], paragraphs: [lines],
    sentZh: [lines.map((_, i) => `第 ${i + 1} 句。`)], paraZh: [''] }];
  const vocab: Record<string, { m: string }> = {};
  for (let i = 0; i < 120; i++) vocab['w' + i] = { m: 'n. 词' + i };
  return { 'sections.json': JSON.stringify(sections), 'vocab.json': JSON.stringify(vocab), 'chapters.json': '[]' };
})();

async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/shadow/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}

test.describe('3.0 单词本页（M3，PRD §6）', () => {
  test('列出全部目标词，行含状态/文章/卷/出现次数；未见面也在「全部」里', async ({ page }) => {
    await stubData(page, WORDS);
    await page.goto(`${rootUrl}/app/index.html#/words`);
    await waitShadowReady(page);

    await expect(page.locator('.words-page > h1')).toHaveText('单词本');
    const words = (await page.locator('.wb-row .wr-word').allInnerTexts()).sort();
    expect(words).toEqual(['atmosphere', 'library', 'oxygen']);
    // 未接触过 → 未见面胶囊
    await expect(page.locator('.wb-row[data-w="atmosphere"] .wr-pill')).toHaveText('未见面');
    // 文章关联：atmosphere 在《地球与生命》第 1 卷出现 2 次
    const at = page.locator('.wb-row[data-w="atmosphere"] .wr-meta');
    await expect(at).toContainText('地球与生命');
    await expect(at).toContainText('第 1 卷');
    await expect(at).toContainText('出现 2 次');
    // oxygen 横跨两篇：出现次数是全局合计（篇 0 一次 + 篇 1 一次 = 2）
    await expect(page.locator('.wb-row[data-w="oxygen"] .wr-meta')).toContainText('出现 2 次');
  });

  test('长列表增量渲染：初始只渲一批，点「加载更多」才追加（不能一次渲全部）', async ({ page }) => {
    await stubData(page, BIG);
    await page.goto(`${rootUrl}/app/index.html#/words`);
    await waitShadowReady(page);

    const total = await page.evaluate(() => Object.keys(VOCAB).length);
    expect(total).toBe(120);
    const first = await page.locator('.wb-row').count();
    expect(first, '初始要有一批').toBeGreaterThan(0);
    expect(first, '不能一次渲染全部 120 行').toBeLessThan(total);
    await expect(page.locator('.wb-row .wr-word').first()).toHaveText('w0');

    await page.locator('.wb-more').click();
    await expect.poll(() => page.locator('.wb-row').count(), { message: '加载更多要真的追加' }).toBeGreaterThan(first);
  });

  /* A5 回归锁：筛选档位就是五个真状态（+「全部」与正交的「重点词」）。
     旧版是「待掌握 / 学习中 / 已掌握」三档，没碰过的 fresh 不落在任何一档 ——
     三档相加永远小于「全部」，同一个单词本在两个屏上数出两个总数。现在这条相加必须恒等。 */
  test('筛选档位 = 五个真状态 + 重点词，五档互斥且相加恒等于「全部」', async ({ page }) => {
    await stubData(page, WORDS);
    await page.goto(`${rootUrl}/app/index.html#/words`);
    await waitShadowReady(page);
    await page.evaluate(() => {
      TASK.resetV2(); TASK.initPlan(15);
      const st = TASK.state();
      const mk = (o: Record<string, unknown>) => Object.assign(ShadowPlan.newWord(), o);
      st.words['atmosphere'] = mk({ stage: 'graduated', reps: 12, ok3: 1, leech: false });
      st.words['oxygen'] = mk({ stage: 'seen', reps: 1, ok3: 0, leech: true });
      /* library 故意不写状态 → 它是「未见面」，让 fresh 档有非零读数 */
      APP3.route();
    });

    // 期望集从 state 现算（真断言，不写死字面量）
    const exp = await page.evaluate((stages: string[]) => {
      const st = TASK.state();
      const all = Object.keys(VOCAB);
      const bucket = (w: string) => { const s = st.words[w]; return (s && s.stage) || 'fresh'; };
      const by: Record<string, string[]> = {};
      stages.forEach((k) => { by[k] = all.filter((w) => bucket(w) === k); });
      return {
        all: all.length, by,
        leech: all.filter((w) => st.words[w] && st.words[w].leech),
        universe: all.slice().sort(),
      };
    }, STAGES);

    await expect(page.locator('.wb-filter[data-f="all"] .wf-n')).toHaveText(String(exp.all));
    for (const f of STAGES) {
      await expect(page.locator(`.wb-filter[data-f="${f}"] .wf-n`), `${f} 档计数`).toHaveText(String(exp.by[f].length));
    }
    await expect(page.locator('.wb-filter[data-f="leech"] .wf-n')).toHaveText(String(exp.leech.length));
    expect(STAGES.reduce((n, f) => n + exp.by[f].length, 0), '五档相加 = 全部').toBe(exp.all);

    const shownWords = async () => (await page.locator('.wb-row .wr-word').allInnerTexts()).sort();
    const want: Record<string, string[]> = Object.assign({}, exp.by, { all: exp.universe, leech: exp.leech });
    for (const f of WB_KEYS) {
      await page.locator(`.wb-filter[data-f="${f}"]`).click();
      await expect(page).toHaveURL(new RegExp('#/words/' + f));
      await expect(page.locator(`.wb-filter[data-f="${f}"]`), `${f} 档要点亮自己`).toHaveAttribute('aria-pressed', 'true');
      expect(await shownWords(), `筛选 ${f} 的结果集`).toEqual([...(want[f] || [])].sort());
    }
    // 重点词那颗胶囊不再把状态盖掉：已见面档里 oxygen 的胶囊同时写着状态与「重点词」
    await page.locator('.wb-filter[data-f="seen"]').click();
    await expect(page.locator('.wb-row[data-w="oxygen"] .wr-pill')).toHaveText('已见面 · 重点词');
    await expect(page.locator('.wb-row[data-w="oxygen"] .wr-pill'), '胶囊带档位 class，底色仍走 .leech')
      .toHaveClass(/s-seen/);
  });

  test('M2 待加强的「去复习」落到单词本「重点词」筛选视图', async ({ page }) => {
    await stubData(page, WORDS);
    await page.goto(`${rootUrl}/app/index.html#/stats`);
    await waitShadowReady(page);
    await page.evaluate(() => {
      TASK.resetV2(); TASK.initPlan(15);
      const st = TASK.state();
      st.words['oxygen'] = Object.assign(ShadowPlan.newWord(), { stage: 'seen', reps: 1, leech: true, due: Date.now() - 1000 });
      APP3.route();
    });
    await expect(page.locator('.st-tip[data-tip="leech"]')).toBeVisible();
    await page.locator('.st-tip[data-tip="leech"] .tip-go').click();
    await expect(page).toHaveURL(/#\/words\/leech/);
    await expect(page.locator('.wb-filter[data-f="leech"]')).toHaveAttribute('aria-pressed', 'true');
    expect((await page.locator('.wb-row .wr-word').allInnerTexts()).sort()).toEqual(['oxygen']);
  });

  test('点词行展开详情：原文语境在前、例句其次，含状态路径与接触/答对', async ({ page }) => {
    await stubData(page, WORDS);
    await page.goto(`${rootUrl}/app/index.html#/words`);
    await waitShadowReady(page);
    await page.evaluate(() => {
      TASK.resetV2(); TASK.initPlan(15);
      const st = TASK.state();
      st.words['atmosphere'] = Object.assign(ShadowPlan.newWord(),
        { stage: 'graduated', reps: 12, ok3: 3, err: 0, leech: false, lastContactAt: Date.now() });
      APP3.route();
    });

    const row = page.locator('.wb-row[data-w="atmosphere"]');
    await expect(row).toHaveAttribute('aria-expanded', 'false');
    await row.click();
    await expect(row).toHaveAttribute('aria-expanded', 'true');
    const d = page.locator('.wb-detail');
    await expect(d).toBeVisible();
    // 音标 + 释义
    await expect(d.locator('.wd-phon')).toHaveText('/ˈætməsfɪr/');
    await expect(d.locator('.wd-mean')).toContainText('大气');
    // 原文语境：句子（目标词高亮）+ 《文章》卷/句号 + 播放
    await expect(d.locator('.wd-ctx')).toContainText('protects life');
    await expect(d.locator('.wd-ctx .wd-hl')).toHaveText('atmosphere');
    await expect(d.locator('.wd-src')).toContainText('《地球与生命》');
    await expect(d.locator('.wd-src')).toContainText('第 1 卷');
    await expect(d.locator('.wd-src')).toContainText('第 1 句');
    await expect(d.locator('.wd-play')).toBeVisible();
    // §6.4：原文语境永远排第一，例句其次。M6：详情块标题从 h4 提到 h2（h1「单词本」→ h2，
    // 不再跳级；axe heading-order 要求逐级递增），断言同步改选择器。
    const heads = await d.locator('.wd-block h2').allInnerTexts();
    expect(heads[0]).toContain('原文语境');
    expect(heads[1]).toContain('例句');
    await expect(d.locator('.wd-ex')).toContainText('relaxed atmosphere');
    // 学习状态：路径 + 接触/答对
    await expect(d.locator('.wd-path .wd-step.on')).toHaveText('已毕业');
    await expect(d.locator('.wd-stat')).toContainText('接触 12 次');
    await expect(d.locator('.wd-stat')).toContainText('答对 3 次');

    // 再点一次收起
    await row.click();
    await expect(row).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.wb-detail')).toHaveCount(0);
  });

  test('词详情「▶ 播放这句」→ 回首页并进该篇任务模式、定位该句并播放', async ({ page }) => {
    await stubData(page, WORDS);
    await page.goto(`${rootUrl}/app/index.html#/words`);
    await waitShadowReady(page);
    await page.evaluate(() => {
      TASK.resetV2(); TASK.initPlan(15);
      const st = TASK.state();
      st.words['atmosphere'] = Object.assign(ShadowPlan.newWord(), { stage: 'seen', reps: 1 });
      APP3.route();
    });
    await page.locator('.wb-row[data-w="atmosphere"]').click();
    // 词详情给的 gi = atmosphere 的**首次**出现句（全局 0）；夹具里它在第 0、2 句都出现 ——
    // 只断言「含该词」会漏掉错跳到第 2 句，所以这里锁精确句序号。
    const gi = Number(await page.locator('.wd-play').getAttribute('data-gi'));
    expect(gi, '夹具里 atmosphere 首次出现在全局第 0 句').toBe(0);
    await page.locator('.wd-play').click();
    // 目标：回首页 + 进任务模式 + 精确落到该句并在播
    await expect(page).toHaveURL(/#\/home/);
    await expect(page.locator('body')).toHaveClass(/task-mode/);
    await expect.poll(() => page.evaluate(() => {
      const arr = [...document.querySelectorAll('#art .sent')];
      return arr.findIndex((e) => e.classList.contains('playing'));
    }), { message: '必须精确落在 atmosphere 首次出现那一句（不是只含该词的任意句）' }).toBe(gi);
    expect(await page.evaluate(() => TASK.article), '进的必须是该词所属那一篇').toBe(0);
  });

  test('深色模式：单词本卡片/详情不是白底，深色下可读（PRD §10.1）', async ({ page }) => {
    await stubData(page, WORDS);
    await page.goto(`${rootUrl}/app/index.html#/words`);
    await waitShadowReady(page);
    await page.evaluate(() => {
      TASK.resetV2(); TASK.initPlan(15);
      const st = TASK.state();
      st.words['atmosphere'] = Object.assign(ShadowPlan.newWord(), { stage: 'graduated', reps: 12, ok3: 1 });
      APP3.route();
    });
    await page.locator('.wb-row[data-w="atmosphere"]').click();
    const lightRow = await page.locator('.wb-row').first().evaluate((el) => getComputedStyle(el).backgroundColor);
    const lightDet = await page.locator('.wb-detail').evaluate((el) => getComputedStyle(el).backgroundColor);
    // .wr-pill 底是**写死的浅色** rgba(0,0,0,.05) —— 深色覆盖漏了它就会一直浅色（真正的漏点）
    const lightPill = await page.locator('.wb-row[data-w="library"] .wr-pill').evaluate((el) => getComputedStyle(el).backgroundColor);
    await page.evaluate(() => document.body.classList.add('dark'));
    const darkRow = await page.locator('.wb-row').first().evaluate((el) => getComputedStyle(el).backgroundColor);
    const darkDet = await page.locator('.wb-detail').evaluate((el) => getComputedStyle(el).backgroundColor);
    const darkPill = await page.locator('.wb-row[data-w="library"] .wr-pill').evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(darkRow).not.toBe(lightRow);
    expect(darkDet).not.toBe(lightDet);
    expect(darkPill, '深色下状态胶囊底必须换掉写死的浅色').not.toBe(lightPill);
    expect(darkPill).not.toBe('rgba(0, 0, 0, 0.05)');
    expect(darkRow).not.toBe('rgb(255, 255, 255)');
    expect(darkDet).not.toBe('rgb(255, 255, 255)');
    const color = await page.locator('.wd-mean').evaluate((el) => getComputedStyle(el).color);
    expect(color, '深色下正文不能还是黑字').not.toBe('rgb(0, 0, 0)');
  });

  test('无障碍：h1 唯一、筛选是 button+aria-pressed、行可聚焦可键盘、触摸目标 ≥44px', async ({ page }) => {
    await stubData(page, BIG);
    await page.goto(`${rootUrl}/app/index.html#/words`);
    await waitShadowReady(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); APP3.route(); });

    await expect(page.locator('.words-page > h1')).toHaveCount(1);
    // A5：档位表只剩一份（五个真状态 + 全部 + 重点词），不再有四档/词本两套账
    await expect(page.locator('.wb-filter')).toHaveCount(WB_KEYS.length);
    for (const f of WB_KEYS) {
      await expect(page.locator(`.wb-filter[data-f="${f}"]`)).toHaveAttribute('aria-pressed', /^(true|false)$/);
    }
    const row = page.locator('.wb-row').first();
    await expect(row).toHaveAttribute('aria-expanded', 'false');
    expect(await row.evaluate((el) => el.tagName)).toBe('BUTTON');
    for (const sel of ['.wb-row', '.wb-filter', '.wb-more']) {
      const h = await page.locator(sel).first().evaluate((el) => el.getBoundingClientRect().height);
      expect(h, `${sel} 触摸目标 ≥44px`).toBeGreaterThanOrEqual(44);
    }
    // 键盘：聚焦到行，Enter 展开
    await row.focus();
    await page.keyboard.press('Enter');
    await expect(row).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.wb-detail')).toBeVisible();
  });
});
