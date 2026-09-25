// M6 收口：无障碍回归锁（PRD §10.4）。
// 用 @axe-core/playwright 对 /app/ 的关键页面/状态扫 WCAG 2.0/2.1 A+AA。
//
// 2026-09-24 复审修正（本文件的核心教训）：
//   旧版只断言 `violations === ''`，完全无视 `incomplete`。axe 对**算不出背景**的元素
//   （祖先半透明 / 背景是渐变 / 伪元素）会把 color-contrast 判成 incomplete 而不是 violation。
//   于是首页「未开始」卡片整卡 `opacity:.62` 把文字压到 3.1:1（AA 要 4.5）时，
//   门禁照样报 0 违规 —— 门禁在假装达标。
//   现在的判据是**两段式**：
//     ① `violations` 必须为空（axe 已判定不合格的）。
//     ② `incomplete` 里的 color-contrast **也纳入判定**，只有显式登记的「axe 算不了背景」
//        的元素（见 AXE_UNCALCULABLE，逐条写明原因）可以放行；任何未登记的 incomplete 一律红。
//        对「只是踩在页面装饰渐变上、元素自身没有半透明/渐变」的文字，门禁自行合成背景算一次
//        对比度（阈值 WCAG：正文 4.5 / 大字 3.0），算不过就红。
//   自检见文件末尾：注入一个已知低对比度元素，门禁必须变红 —— 证明 incomplete 真的被判定。
//
// 覆盖面：首页 + 任务模式①（浅/深）+ 学习数据/单词本/随身听/我的浮窗/② 挖空浮窗。
// 用 6 篇小壳夹具保证快且稳（真实 1833 句正文对 axe 太慢）。
import { test, expect } from '../../fixtures';
import { AxeBuilder } from '@axe-core/playwright';

declare const TASK: {
  resetV2(): void; initPlan(minutes: number): void;
  seedArticleForTest(a: number, o?: unknown): void; setPass(p: number): void;
};
declare const APP3: { openBlank(bi: number): void };

const rootUrl = process.env.E2E_ROOT_URL || '';

const SIX: Record<string, string> = (() => {
  const mk = (title: string, n: number) => ({
    title, zh: title, subheads: [''],
    paragraphs: [Array.from({ length: n }, (_, i) => `Sentence ${i} about [[w${i}:w${i}]].`)],
    sentZh: [Array.from({ length: n }, (_, i) => `第 ${i + 1} 句。`)],
    paraZh: [''],
  });
  const titles = ['地球与生命', '校园与文化', '衣食住行', '社会与规则', '历史与发明', '身体与时间'];
  const vocab: Record<string, { m: string }> = {};
  for (let i = 0; i < 24; i++) vocab[`w${i}`] = { m: 'n. 词 ' + i };
  return {
    'sections.json': JSON.stringify(titles.map((t, i) => mk(t, i === 0 ? 24 : 3))),
    'vocab.json': JSON.stringify(vocab),
    'chapters.json': '[]',
  };
})();

async function stubData(page: import('@playwright/test').Page) {
  for (const [name, body] of Object.entries(SIX)) {
    await page.route(`**/shadow/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}

type Scan = Awaited<ReturnType<AxeBuilder['analyze']>>;
type AxeNode = Scan['violations'][number]['nodes'][number];

async function scan(page: import('@playwright/test').Page): Promise<Scan> {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
}

function report(violations: Scan['violations']) {
  return violations.map((v) => `${v.impact} ${v.id}: ${v.nodes.map((n) => n.target.join(' ') + ' :: ' + (n.failureSummary || '').replace(/\n/g, ' ')).join(' | ')}`).join('\n');
}

/* 唯一允许放行的 axe-incomplete 例外：axe 对它们**算不出背景色**，不是对比度真的没问题。
   每条都必须说清"为什么 axe 算不了"。未登记的一律红 —— 这正是旧门禁栽的地方。
   注意：不要把它们和「真·失败但用户知情接受」混为一谈 —— 前者是 axe 的盲区，后者只有
   AXE_UNCALCULABLE 里那几颗品牌渐变 CTA（白字压 #2bd4a4 = 1.90:1，用户已知情，色值另有
   palette.spec.ts 锁）。 */
const AXE_UNCALCULABLE: { sel: string; why: string }[] = [
  { sel: '.b-go', why: '首页横幅主按钮：底色是 --grad 渐变，axe 判不了背景（白字 1.90:1 为用户知情取舍）' },
  { sel: '.st-go', why: '学习数据页同款 --grad 渐变 CTA，同上' },
  { sel: '.tip-go', why: '「待加强」提示里的 --grad 渐变按钮，同上' },
  { sel: '.mp-cta', why: '「我的」浮窗主 CTA：同款 --grad 渐变' },
  { sel: '.st-open-me', why: '空态主 CTA：同款 --grad 渐变' },
  { sel: '.tb-btn.next', why: '任务条推进键：--grad 渐变底' },
  { sel: '.tb-btn.quit', why: '任务条收工键：--grad 渐变底' },
  { sel: '.task-bar', why: '玻璃任务条：背景是 linear-gradient + backdrop-filter + ::before 伪元素，axe 只看元素/祖先背景，判不了' },
  { sel: '.audiobar', why: '玻璃播放条：同款玻璃配方，原因同上' },
  { sel: '.playing', why: '当前句高亮：.playing 是半透明渐变底（--hl），axe 判不了（文字仍是 --text/--accent-text，按同底色人工核过）' },
  { sel: '.sync-hint', why: '常驻同步 pill：底 rgba(255,241,236,.96) 半透明，axe 顺着摸到 body 渐变就放弃' },
  { sel: '.ls-prev', why: '纯图标按钮：axe 对「只含非文字内容」判不了 contrast（图标色另有 ≥3:1 要求，人工核）' },
  { sel: '.ls-next', why: '纯图标按钮：同上' },
];

function luminance(rgb: number[]) {
  const c = rgb.map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contrastRatio(a: number[], b: number[]) {
  const la = luminance(a), lb = luminance(b);
  const hi = Math.max(la, lb), lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}
function parseRgb(s: string): number[] { return (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number); }

/* 把 axe 的 incomplete 翻成"我们自己的判据"：
   - 已登记例外 → 放行；
   - 纯图标 → 未登记就红（不做文字对比度合成）；
   - 元素自身/祖先有半透明或渐变（nonBodyPainted）→ 未登记就红（旧卡片的 opacity 陷阱就在这里）；
   - 只是踩在页面装饰渐变上 → 自己按 body 底色合成算对比度，算不过（<4.5/<3.0）就红。 */
async function contrastProblems(page: import('@playwright/test').Page, res: Scan): Promise<string[]> {
  const problems: string[] = [];
  const exemptSels = AXE_UNCALCULABLE.map((e) => e.sel);
  const cc = res.incomplete.filter((v) => v.id === 'color-contrast');
  for (const v of cc) {
    for (const n of v.nodes as AxeNode[]) {
      const sel = n.target.map(String).join(' ');
      const reason = n.failureSummary || '';
      let info: {
        exempt: string[]; nonBodyPainted: boolean; color: string; bodyColor: string;
        fontSize: number; fontWeight: number;
      };
      try {
        info = await page.locator(sel).first().evaluate((el, exempt) => {
          const num = (s: string) => (s.match(/[\d.]+/g) || []).map(Number);
          const chain: { op: number; bgA: number; img: boolean }[] = [];
          let x: Element | null = el;
          while (x) {
            const c = getComputedStyle(x);
            const bg = num(c.backgroundColor);
            chain.push({ op: parseFloat(c.opacity), bgA: bg.length >= 4 ? bg[3] : 1, img: c.backgroundImage !== 'none' });
            if (x === document.body) break;
            x = x.parentElement;
          }
          const nonBodyPainted = chain.slice(0, -1).some((c) => c.op < 1 || c.img || (c.bgA > 0 && c.bgA < 1));
          const cs = getComputedStyle(el);
          return {
            exempt: exempt.filter((s) => { try { return !!el.closest(s); } catch { return false; } }),
            nonBodyPainted,
            color: cs.color,
            bodyColor: getComputedStyle(document.body).backgroundColor,
            fontSize: parseFloat(cs.fontSize),
            fontWeight: parseInt(cs.fontWeight, 10) || 400,
          };
        }, exemptSels);
      } catch (e) {
        problems.push(`incomplete(contrast) 无法定位 ${sel}: ${String((e as Error).message || e)}`);
        continue;
      }
      if (info.exempt.length) continue;                    // 显式登记的 axe 盲区
      if (/non-text characters/i.test(reason)) { problems.push(`incomplete(contrast) 未登记的纯图标控件 ${sel}`); continue; }
      if (info.nonBodyPainted) { problems.push(`incomplete(contrast) 未登记的半透明/渐变层 ${sel} :: ${reason}`); continue; }
      const threshold = (info.fontSize >= 24 || (info.fontSize >= 18.66 && info.fontWeight >= 700)) ? 3 : 4.5;
      const ratio = contrastRatio(parseRgb(info.color), parseRgb(info.bodyColor));
      if (ratio < threshold) problems.push(`incomplete(contrast) 合成对比度 ${ratio.toFixed(2)}:1 < ${threshold}:1 @ ${sel} (${info.color} on ${info.bodyColor})`);
    }
  }
  return problems;
}

async function expectClean(page: import('@playwright/test').Page, label: string) {
  const res = await scan(page);
  const problems = [
    ...(report(res.violations) ? [`violations:\n${report(res.violations)}`] : []),
    ...(await contrastProblems(page, res)),
  ];
  expect(problems.join('\n'), label).toBe('');
}

async function bootHome(page: import('@playwright/test').Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await stubData(page);
  await page.goto(`${rootUrl}/app/index.html#/home`);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await expect(page.locator('.art-card')).toHaveCount(6);
}

async function lightAndDark(page: import('@playwright/test').Page, label: string) {
  await expectClean(page, `${label} 浅色`);
  await page.evaluate(() => document.body.classList.add('dark'));
  await expect(page.locator('body')).toHaveClass(/dark/);
  await expectClean(page, `${label} 深色`);
  await page.evaluate(() => document.body.classList.remove('dark'));
}

test.describe('3.0 无障碍（axe，WCAG A/AA）', () => {
  test('首页：浅色 + 深色均无 axe 违规、无未登记的对比度 incomplete', async ({ page }) => {
    /* 关键：prefers-reduced-motion 会让全局 `transition-duration:.01ms !important` 生效，
       切 body.dark 时颜色不再处于 0.15s 插值中途 —— 否则 axe 会量到半途的浅底色，
       报出假的对比度红（实测 #btnZh 底 #9cb0a7）。顺带也验证了 reduced-motion 路径。 */
    await bootHome(page);
    await lightAndDark(page, '首页');
  });

  test('任务模式①：浅色 + 深色均无 axe 违规、无未登记的对比度 incomplete', async ({ page }) => {
    await bootHome(page);
    await page.locator('.art-card .a-open').first().click();
    await expect(page.locator('body')).toHaveClass(/task-mode/);
    await expect(page.locator('#art .sent').first()).toBeVisible();
    await lightAndDark(page, '任务模式①');
  });

  /* 覆盖面补齐（2026-09-24 复审）：以前这些页面只跑过不进 CI 的 a11y-scan.mjs，
     现在用同一套小夹具纳入回归。 */
  test('学习数据页：浅色 + 深色无 axe 违规、无未登记的对比度 incomplete', async ({ page }) => {
    await bootHome(page);
    await page.goto(`${rootUrl}/app/index.html#/stats`);
    await expect(page.locator('.stats-page')).toBeVisible();
    await lightAndDark(page, '学习数据页');
  });

  test('单词本：浅色 + 深色无 axe 违规、无未登记的对比度 incomplete', async ({ page }) => {
    await bootHome(page);
    await page.goto(`${rootUrl}/app/index.html#/words`);
    await expect(page.locator('.words-page')).toBeVisible();
    await lightAndDark(page, '单词本');
  });

  test('随身听：浅色 + 深色无 axe 违规、无未登记的对比度 incomplete', async ({ page }) => {
    await bootHome(page);
    await page.goto(`${rootUrl}/app/index.html#/listen`);
    await expect(page.locator('div.listen-page')).toBeVisible();
    await lightAndDark(page, '随身听');
  });

  test('「我的」浮窗：浅色 + 深色无 axe 违规、无未登记的对比度 incomplete', async ({ page }) => {
    await bootHome(page);
    await page.locator('#meCard').click();
    await expect(page.locator('#mePop')).toBeVisible();
    await lightAndDark(page, '我的浮窗');
  });

  test('② 挖空浮窗：浅色 + 深色无 axe 违规、无未登记的对比度 incomplete', async ({ page }) => {
    await bootHome(page);
    await page.locator('.art-card .a-open').first().click();
    await expect(page.locator('#art .sent').first()).toBeVisible();
    await page.evaluate(() => { TASK.seedArticleForTest(0); TASK.setPass(2); APP3.openBlank(1); });
    await expect(page.locator('#blankPop')).not.toHaveAttribute('hidden', '');
    await lightAndDark(page, '② 挖空浮窗');
  });

  /* 自检：证明门槛真的会响。注入一个已知对比度不足的元素（同色渐变底 + 同色文字，
     对比度 1:1），axe 只会把它判成 incomplete（背景是渐变，算不了）。
     如果门禁又退回"只看 violations"，这条会绿 —— 那正是要防的"假装达标"。 */
  test('自检：已知低对比度元素必须让门禁变红（incomplete 也被判定）', async ({ page }) => {
    await bootHome(page);
    await page.evaluate(() => {
      const d = document.createElement('div');
      d.id = 'a11y-selfcheck-bad';
      d.textContent = '低对比度自检';
      document.body.appendChild(d);
    });
    await page.addStyleTag({
      content: '#a11y-selfcheck-bad{position:fixed;left:0;bottom:0;z-index:99999;font-size:16px;font-weight:400;color:#9a9a9a;background:linear-gradient(#9a9a9a,#9a9a9a);padding:4px 8px;}',
    });
    const res = await scan(page);
    expect(res.violations.map((v) => v.id), '自检元素应是 incomplete（渐变底算不了）而不是 violation').not.toContain('color-contrast');
    const problems = await contrastProblems(page, res);
    expect(problems.join('\n'), '低对比度自检元素必须被门禁抓住').toContain('a11y-selfcheck-bad');
  });

  /* 触区 ≥44px（PRD §10.4）：axe 不管这条，M6 补。手机档头部那排（.nav-arrow/.tr-msw/.tr-help）
     视觉 24–26px、任务条播放条那排（循环/AB/倍速/书签）视觉 30px，靠 ::after hit-slop 与
     移动档 min-height/min-width 补到 ≥44。反向验证：去掉这些补丁必红（实测 40/42/30）。 */
  test('移动端任务模式：头部与任务条控件的有效触区 ≥44px', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await stubData(page);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    await page.reload();
    await page.locator('.art-card .a-open').first().click();
    await expect(page.locator('#taskTop')).toBeVisible();
    await expect(page.locator('#art .sent').first()).toBeVisible();

    const sels = ['#ttPrev', '#ttNext', '#btnZh', '#btnGloss', '#ttHelp',
      '#btnLoop', '#btnAB', '#rateCycle', '#markBtn'];
    for (const sel of sels) {
      const m = await page.locator(sel).evaluate((el) => {
        const r = (el as HTMLElement).getBoundingClientRect();
        const a = getComputedStyle(el, '::after');
        const parts = (a.inset || '0px').split(/\s+/).map((x) => Math.abs(parseFloat(x) || 0));
        const tb = parts[0] || 0;
        const lr = parts.length > 1 ? parts[1] : parts[0] || 0;
        return { w: r.width + 2 * lr, h: r.height + 2 * tb };
      });
      expect(m.h, `${sel} 有效触区高`).toBeGreaterThanOrEqual(44);
      expect(m.w, `${sel} 有效触区宽`).toBeGreaterThanOrEqual(44);
    }
  });
});
