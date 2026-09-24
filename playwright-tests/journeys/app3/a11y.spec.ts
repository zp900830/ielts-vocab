// M6 收口：无障碍回归锁（PRD §10.4）。
// 用 @axe-core/playwright 对 /app/ 的关键页面/状态扫 WCAG 2.0/2.1 A+AA，断言 0 违规。
// 为什么锁在这里：M6 之前全靠人工看，这次扫描才发现三类真问题（nested-interactive、
// aria-allowed-attr、成批颜色对比度），锁住后回退会直接红。
// 扫描面刻意收窄到「首页 + 任务模式①（浅/深）」：axe 全页扫描对 1833 句的正文很慢，
// 夹具换成 6 篇小壳，保证快且稳。其余页面/浮层（stats/words/listen/② 浮窗/我的浮窗）
// 由 M6 的一次性脚本 scripts/a11y-scan.mjs 覆盖，结论写进 /tmp/m6-report.md。
import { test, expect } from '../../fixtures';
import { AxeBuilder } from '@axe-core/playwright';

declare const TASK: { resetV2(): void; initPlan(minutes: number): void };

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

async function scan(page: import('@playwright/test').Page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
}

function report(violations: { id: string; impact?: string | null; nodes: { target: unknown[]; failureSummary?: string }[] }[]) {
  return violations.map((v) => `${v.impact} ${v.id}: ${v.nodes.map((n) => n.target.join(' ') + ' :: ' + (n.failureSummary || '').replace(/\n/g, ' ')).join(' | ')}`).join('\n');
}

test.describe('3.0 无障碍（axe，WCAG A/AA）', () => {
  test('首页：浅色 + 深色均无 axe 违规', async ({ page }) => {
    /* 关键：prefers-reduced-motion 会让全局 `transition-duration:.01ms !important` 生效，
       切 body.dark 时颜色不再处于 0.15s 插值中途 —— 否则 axe 会量到半途的浅底色，
       报出假的对比度红（实测 #btnZh 底 #9cb0a7）。顺带也验证了 reduced-motion 路径。 */
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await stubData(page);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    await page.reload();
    await expect(page.locator('.art-card')).toHaveCount(6);
    const light = await scan(page);
    expect(report(light.violations), '首页浅色').toBe('');

    await page.evaluate(() => document.body.classList.add('dark'));
    await expect(page.locator('body')).toHaveClass(/dark/);
    const dark = await scan(page);
    expect(report(dark.violations), '首页深色').toBe('');
  });

  test('任务模式①：浅色 + 深色均无 axe 违规', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await stubData(page);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    await page.reload();
    await page.locator('.art-card .a-open').first().click();
    await expect(page.locator('body')).toHaveClass(/task-mode/);
    await expect(page.locator('#art .sent').first()).toBeVisible();
    const light = await scan(page);
    expect(report(light.violations), '任务模式① 浅色').toBe('');

    await page.evaluate(() => document.body.classList.add('dark'));
    const dark = await scan(page);
    expect(report(dark.violations), '任务模式① 深色').toBe('');
  });
});
