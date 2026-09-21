// Compiled from: tests/e2e/shadow/plan-adjust-persist.md
// Compiled at: 2026-09-21 (第三期全面测试 · 阶段一 compiler)
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

const PLAN_KEYS = [
  'ielts-task-plan', 'ielts.shadow.v2', 'ielts-task-progress', 'ielts.shadow.migNotice',
];

test.describe('Plan page: three knobs each take effect, persist, and echo after reload', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/plan-adjust-persist.md',
    });

    await test.step('Setup 1: Open the app', async () => {
      await page.goto(`${baseURL}/index.html?v=plan-adjust`);
      await expect(page.locator('.sent').first()).toBeVisible();
    });

    await test.step('Setup 2: Create a 15-minute plan through the UI', async () => {
      await page.evaluate((keys) => { keys.forEach((k) => localStorage.removeItem(k)); }, PLAN_KEYS);
      await page.reload();
      await expect(page.locator('.sent').first()).toBeVisible();
      await page.getByRole('button', { name: '今日学习任务' }).click();
      await page.getByRole('button', { name: '15 分钟', exact: true }).click();
      await page.getByRole('button', { name: '开始这个计划' }).click();
      await expect(page.locator('.tp-col h4').first()).toHaveText('今天 · 15 分钟');
    });

    await test.step('Setup 3: Open the plan tab', async () => {
      await page.getByRole('button', { name: '计划', exact: true }).click();
      await expect(page.getByText('每天有多少分钟')).toBeVisible();
      await expect(page.getByText('几点算换一天')).toBeVisible();
      await expect(page.getByText('新词', { exact: true })).toBeVisible();
    });
  });

  test(
    'each knob is exclusive, persists to the event root, adds no upload event, and survives a reload',
    { tag: ['@regression', '@positive', '@shadow', '@plan'] },
    async ({ page, baseURL }) => {
      // 同上：面板点击不需要 12 分钟预算
      test.setTimeout(currentTimeout());
      await test.step('Step 1: 三组控件齐备且每组恰好一颗高亮', async () => {
        const groups = page.locator('.ps-group');
        await expect(groups).toHaveCount(3);
        await expect(page.locator('.ps-group').nth(0).locator('.ps-opt')).toHaveCount(7);
        await expect(page.locator('.ps-group').nth(1).locator('.ps-opt')).toHaveCount(6);
        await expect(page.locator('.ps-group').nth(2).locator('.ps-opt')).toHaveCount(2);
        const btexts = await page.locator('.ps-group').nth(1).locator('.ps-opt').allInnerTexts();
        ['0 点', '2 点', '3 点', '凌晨 4 点', '5 点', '6 点'].forEach((b) =>
          expect(btexts).toContain(b));
        for (let i = 0; i < 3; i++) {
          await expect(page.locator('.ps-group').nth(i).locator('.ps-opt.sel')).toHaveCount(1);
        }
        await expect(page.locator('.ps-group').nth(0).locator('.ps-opt.sel')).toHaveText('15 分钟');
        await expect(page.locator('.ps-group').nth(1).locator('.ps-opt.sel')).toHaveText('凌晨 4 点');
        await expect(page.locator('.ps-group').nth(2).locator('.ps-opt.sel')).toHaveText('正常见新词');
      });

      const readPlan = () => page.evaluate(() => {
        const v2 = JSON.parse(localStorage.getItem('ielts.shadow.v2') || '{}');
        const legacy = JSON.parse(localStorage.getItem('ielts-task-plan') || '{}');
        return {
          todayMinutes: v2.plan ? v2.plan.todayMinutes : null,
          boundaryHour: v2.plan ? v2.plan.boundaryHour : null,
          pausedNew: v2.plan ? v2.plan.pausedNew : null,
          legacyMinutes: legacy.dailyMinutes, legacyPaused: legacy.paused,
          dayplans: (v2.events || []).filter((e: any) => e.type === 'dayplan'),
          events: (v2.events || []).length,
        };
      });

      let n15 = 0;
      await test.step('Step 2: 改分钟，今天的承诺随之收紧', async () => {
        // Setup 3 停在「计划」tab，.tp-num 只存在于「今天」视图 —— 先切回去再读
        await page.getByRole('button', { name: '今天', exact: true }).click();
        await expect(page.locator('.tp-num').first()).toBeVisible();
        const num = (await page.locator('.tp-num').first().textContent()) || '';
        n15 = Number((num.match(/\/\s*(\d+)/) || [0, '0'])[1]);
        expect(n15).toBeGreaterThan(0);

        await page.getByRole('button', { name: '计划', exact: true }).click();
        await page.getByRole('button', { name: '5 分钟', exact: true }).click();
        await page.getByRole('button', { name: '今天', exact: true }).click();
        await expect(page.locator('.tp-col h4').first()).toHaveText('今天 · 5 分钟');
        const num2 = (await page.locator('.tp-num').first().textContent()) || '';
        const n5 = Number((num2.match(/\/\s*(\d+)/) || [0, '0'])[1]);
        expect(n5).toBeGreaterThanOrEqual(1);
        expect(n5).toBeLessThanOrEqual(n15);
        // 同一个数不许在两处说不一致
        const note = (await page.locator('.tp-note').first().textContent()) || '';
        expect(note).toContain('今天 5 分钟');
      });

      await test.step('Step 3: 改日界可逆，且不撑爆今天', async () => {
        await page.getByRole('button', { name: '计划', exact: true }).click();
        await page.getByRole('button', { name: '0 点', exact: true }).click();
        await expect(page.locator('.ps-group').nth(1).locator('.ps-opt.sel')).toHaveText('0 点');
        expect((await readPlan()).boundaryHour).toBe(0);
        await page.getByRole('button', { name: '今天', exact: true }).click();
        const note = (await page.locator('.tp-note').first().textContent()) || '';
        const quizzes = Number((note.match(/(\d+)\s*题/) || [0, '0'])[1]);
        const leftN = Number((note.match(/还剩\s*(\d+)\s*句/) || [0, '0'])[1]);
        expect(quizzes).toBeGreaterThanOrEqual(leftN);
        await page.getByRole('button', { name: '计划', exact: true }).click();
        await page.getByRole('button', { name: '凌晨 4 点', exact: true }).click();
        expect((await readPlan()).boundaryHour).toBe(4);
      });

      await test.step('Step 4: 新词开关互斥，两份表示同步', async () => {
        await page.getByRole('button', { name: '只复习，先不见新词', exact: true }).click();
        await expect(page.locator('.ps-group').nth(2).locator('.ps-opt.sel')).toHaveText('只复习，先不见新词');
        const after = await readPlan();
        expect(after.pausedNew).toBe(true);
        expect(after.legacyPaused).toBe(true);
        expect(after.legacyMinutes).toBe(after.todayMinutes);
        await page.getByRole('button', { name: '正常见新词', exact: true }).click();
        expect((await readPlan()).pausedNew).toBe(false);
      });

      await test.step('Step 5: 调整计划不新增上传事件', async () => {
        const st = await readPlan();
        expect(st.dayplans).toHaveLength(1);
        expect(st.dayplans[0].minutes).toBe(15);   // 建计划时的初值，不是后来改的 5
        expect(st.events).toBe(1);
      });

      await test.step('Step 6: 刷新后一切回显', async () => {
        await page.goto(`${baseURL}/index.html?v=plan-adjust-2`);
        await expect(page.locator('.sent').first()).toBeVisible();
        await page.getByRole('button', { name: '今日学习任务' }).click();
        await page.getByRole('button', { name: '计划', exact: true }).click();
        await expect(page.locator('.ps-group').nth(0).locator('.ps-opt.sel')).toHaveText('5 分钟');
        await expect(page.locator('.ps-group').nth(1).locator('.ps-opt.sel')).toHaveText('凌晨 4 点');
        await expect(page.locator('.ps-group').nth(2).locator('.ps-opt.sel')).toHaveText('正常见新词');
        // 未登录时不许报「还有 N 条没传上去」这种空许诺
        await expect(page.locator('.sync-state')).toHaveText('');
      });

      await test.step('Step 7: 清空重来回到设置屏', async () => {
        page.once('dialog', (d) => { d.accept().catch(() => {}); });
        await page.getByRole('button', { name: '清空重来' }).click();
        await expect(page.locator('#psStart')).toBeVisible();
        const gone = await page.evaluate((keys) => keys.filter((k) => localStorage.getItem(k) !== null), PLAN_KEYS);
        expect(gone.filter((k: string) => k === 'ielts.shadow.v2' || k === 'ielts-task-plan')).toEqual([]);
      });
    },
  );

  // After Hook — 共享存储状态恢复，幂等（第 7 步已经清过时什么都不做）。
  test.afterEach(async ({ page }, testInfo) => {
    await test.step('Teardown 1: Clear the plan', async () => {
      await page.evaluate((keys) => { keys.forEach((k) => localStorage.removeItem(k)); }, PLAN_KEYS);
    }).catch((err) =>
      testInfo.annotations.push({ type: 'teardown-warning', description: String(err) }),
    );
  });
});
