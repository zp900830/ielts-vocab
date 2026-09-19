// Hand-written alongside docs/superpowers/plans/2026-09-20-task-mode-phase-1.md (Task 6)
// 界面不变量。这两条是「回归锁」：现状用 CSS 藏掉上一句/下一句、
// 并把同一个进度数字在任务栏和播放条各写一遍。
import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

declare const TASK: { buildQueue(): void; enterTaskMode(): void; exitTaskMode(): void; active: boolean };

const ENV = process.env.E2E_ENVIRONMENT || 'local';
const PLAN_KEY = 'ielts-task-plan';
const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

async function startPlanAndTaskMode(page: import('@playwright/test').Page, baseURL: string) {
  await page.goto(`${baseURL}/index.html`);
  await expect(page.locator('.sent').first()).toBeVisible();
  await page.locator('#btnToday').click();
  await page.locator('.ps-start').click();
  await page.keyboard.press('Escape');
  expect(await page.evaluate((k) => !!localStorage.getItem(k), PLAN_KEY)).toBe(true);
  await page.evaluate(() => TASK.enterTaskMode());
  await expect(page.locator('#taskBar')).toBeVisible();
}

test.describe('task mode · UI invariants', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);

  test('step controls stay visible and usable inside task mode', async ({ page, baseURL }) => {
    test.setTimeout(currentTimeout() * 8);
    await startPlanAndTaskMode(page, baseURL);
    await expect(page.locator('.audiobar .ab-step')).toHaveCount(2);
    for (const name of ['上一句', '下一句']) {
      const btn = page.locator('.audiobar').getByRole('button', { name });
      await expect(btn).toBeVisible();
      await expect(btn).toBeEnabled();
    }
    // 退出后位置不变：肌肉记忆不该被模式切换作废
    await page.evaluate(() => TASK.exitTaskMode());
    await expect(page.locator('.audiobar').getByRole('button', { name: '上一句' })).toBeVisible();
  });

  test('the progress readout appears once on the page, not twice', async ({ page, baseURL }) => {
    test.setTimeout(currentTimeout() * 8);
    await startPlanAndTaskMode(page, baseURL);
    const got = await page.evaluate(() => {
      const bar = document.getElementById('taskBar');
      const ab = document.getElementById('abTitle');
      const grab = (el: Element | null) => (el && el.textContent) || '';
      const t = grab(bar), a = grab(ab);
      const rx = /\d+\s*\/\s*\d+/g;
      const hits = t.match(rx) || [];
      // 播放条允许报「读到第几句」，但不得重复任务栏那个「今日 done/total」
      const prog = hits[0] ? hits[0].replace(/\s+/g, '') : '';
      return { dupProgress: hits.length, abTitle: a,
               sameInAb: prog ? a.replace(/\s+/g, '').includes(prog) : false };
    });
    expect(got.dupProgress).toBeLessThanOrEqual(1);
    expect(got.sameInAb).toBe(false);
  });
});
