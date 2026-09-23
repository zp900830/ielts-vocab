// Compiled from: tests/e2e/shadow/backup-restore.md
// Compiled at: 2026-09-24
// Source is authoritative — do not edit; re-compile from markdown if broken.
//
// 2026-09-24 实测的 P1：导出/恢复都绕开了真值根。
// BACKUP_PREFIX 是 'ielts-'（连字符），而真值根是 'ielts.shadow.v2'（点分隔）——
// `'ielts.shadow.v2'.startsWith('ielts-')` 是 false，于是 events/state/plan 一个都没进备份，
// 导出来的是个空壳，恢复完还是旧状态。这条锁「新格式的根必须在包里」+「整包能回灌」。

import { test, expect } from '../../fixtures';
import * as fs from 'node:fs';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

// App globals
declare const TASK: {
  resetV2(): void; initPlan(minutes: number): void; enterTaskMode(): void; exportBackup(): void;
  readDone(i: number): void; todayPlan(force?: boolean): { queue: { i: number }[] };
  state(): { words: Record<string, { reps: number }> };
};

const LS_V2 = 'ielts.shadow.v2';
const ROOT_KEY = 'ielts-task-plan';

test.describe('本地备份：导出必须含真值根，且能整包回灌', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);

  test(
    '导出含 ielts.shadow.v2，导入能把它恢复回来',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page, baseURL }, testInfo) => {
      testInfo.setTimeout(currentTimeout() * 10);
      testInfo.annotations.push({ type: 'source', description: 'tests/e2e/shadow/backup-restore.md' });

      await page.goto(`${baseURL}/index.html`);
      await expect(page.locator('.sent').first()).toBeVisible();
      await page.evaluate(() => {
        TASK.resetV2(); TASK.initPlan(10); TASK.enterTaskMode();
        TASK.todayPlan(true).queue.slice(0, 3).forEach((q) => TASK.readDone(q.i));
      });
      await page.waitForTimeout(400);
      const wordsBefore = await page.evaluate(() => Object.keys(TASK.state().words).length);
      expect(wordsBefore, '没读到词 = 这条什么都没测').toBeGreaterThan(0);
      let backupPath = '';

      await test.step('Step 1: 导出包里必须有真值根', async () => {
        const [dl] = await Promise.all([
          page.waitForEvent('download'),
          page.evaluate(() => TASK.exportBackup()),
        ]);
        backupPath = (await dl.path()) || '';
        const payload = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
        const keys = Object.keys(payload.data);
        expect(keys, `备份里没有真值根 ${LS_V2} —— 导出的是空壳。实际键：${keys.join(', ')}`)
          .toContain(LS_V2);
        expect(JSON.parse(payload.data[LS_V2]).events.length, '真值根里的 events 是空的').toBeGreaterThan(0);
      });

      await test.step('Step 2: 清空本机 → 导入 → 进度回来', async () => {
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await expect(page.locator('.sent').first()).toBeVisible();
        /* 每次开页 loadRoot() 都会写一份**空的**根，所以「清空」不等于 key 不存在 ——
           判据是它里面的 events 空了（词也空了）。 */
        const cleared = await page.evaluate((k) => {
          try { const r = JSON.parse(localStorage.getItem(k) || '{}'); return { events: (r.events || []).length, words: Object.keys(r.state?.words || {}).length }; }
          catch (e) { return { events: -1, words: -1 }; }
        }, LS_V2);
        expect(cleared, '清空没生效 = 这条测不准').toEqual({ events: 0, words: 0 });

        page.once('dialog', (d) => d.accept());
        const chooser = page.waitForEvent('filechooser');
        /* 清空之后是「设置屏」—— 导入按钮必须在这儿也有一颗。
           以前它只长在「计划」页里，而计划页要先把计划建出来才进得去：
           换设备进来根本恢复不了（这也是这次一起补的闭环缺口）。 */
        await page.locator('#btnToday').click();
        await page.getByRole('button', { name: '导入备份恢复' }).click({ timeout: currentTimeout() });
        await (await chooser).setFiles(backupPath);
        await page.waitForTimeout(300);
        await page.goto(`${baseURL}/index.html`);
        await expect(page.locator('.sent').first()).toBeVisible();

        expect(await page.evaluate((k) => !!localStorage.getItem(k), LS_V2), '导入后真值根没回来').toBe(true);
        expect(await page.evaluate((k) => !!localStorage.getItem(k), ROOT_KEY), '导入后计划没回来').toBe(true);
        const wordsAfter = await page.evaluate(() => Object.keys(TASK.state().words).length);
        expect(wordsAfter, `导入后词数从 ${wordsBefore} 变成 ${wordsAfter}`).toBe(wordsBefore);
      });
    },
  );
});
