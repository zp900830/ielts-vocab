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

  test('四档筛选各自真的改变结果集，且计数与 state 同源', async ({ page }) => {
    await stubData(page, WORDS);
    await page.goto(`${rootUrl}/app/index.html#/words`);
    await waitShadowReady(page);
    await page.evaluate(() => {
      TASK.resetV2(); TASK.initPlan(15);
      const st = TASK.state();
      const mk = (o: Record<string, unknown>) => Object.assign(ShadowPlan.newWord(), o);
      st.words['atmosphere'] = mk({ stage: 'graduated', reps: 12, ok3: 1, leech: false });
      st.words['oxygen'] = mk({ stage: 'seen', reps: 1, ok3: 0, leech: false });
      st.words['library'] = mk({ stage: 'owned', reps: 5, ok3: 1, leech: false });
      APP3.route();
    });

    // 期望集从 state 现算（真断言，不写死字面量）
    const exp = await page.evaluate(() => {
      const st = TASK.state();
      const all = Object.keys(VOCAB);
      const bucket = (w: string) => { const s = st.words[w]; if (!s) return 'fresh'; if (s.leech) return 'leech'; return s.stage; };
      return {
        all: all.length,
        todo: all.filter((w) => { const b = bucket(w); return b === 'seen' || b === 'recognized' || b === 'leech'; }),
        learning: all.filter((w) => bucket(w) === 'owned'),
        mastered: all.filter((w) => bucket(w) === 'graduated'),
        universe: all.slice().sort(),
      };
    });
    await expect(page.locator('.wb-filter[data-f="all"] .wf-n')).toHaveText(String(exp.all));
    await expect(page.locator('.wb-filter[data-f="todo"] .wf-n')).toHaveText(String(exp.todo.length));
    await expect(page.locator('.wb-filter[data-f="learning"] .wf-n')).toHaveText(String(exp.learning.length));
    await expect(page.locator('.wb-filter[data-f="mastered"] .wf-n')).toHaveText(String(exp.mastered.length));

    const shownWords = async () => (await page.locator('.wb-row .wr-word').allInnerTexts()).sort();
    const want: Record<string, string[]> = { all: exp.universe, todo: exp.todo, learning: exp.learning, mastered: exp.mastered };
    for (const f of ['all', 'todo', 'learning', 'mastered']) {
      await page.locator(`.wb-filter[data-f="${f}"]`).click();
      await expect(page).toHaveURL(new RegExp('#/words/' + f));
      await expect(page.locator(`.wb-filter[data-f="${f}"]`)).toHaveAttribute('aria-pressed', 'true');
      expect(await shownWords(), `筛选 ${f} 的结果集`).toEqual([...want[f]].sort());
    }
    // 三档之和 = 有状态的词且不重复：todo 1 + learning 1 + mastered 1 = 3
    expect(exp.todo.length + exp.learning.length + exp.mastered.length, '夹具要真造出三档').toBe(3);
  });

  test('M2 待加强的「去复习」落到单词本「待掌握」筛选视图', async ({ page }) => {
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
    await expect(page).toHaveURL(/#\/words\/todo/);
    await expect(page.locator('.wb-filter[data-f="todo"]')).toHaveAttribute('aria-pressed', 'true');
    expect((await page.locator('.wb-row .wr-word').allInnerTexts()).sort()).toEqual(['oxygen']);
  });
});
