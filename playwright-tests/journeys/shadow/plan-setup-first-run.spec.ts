// Compiled from: tests/e2e/shadow/plan-setup-first-run.md
// Compiled at: 2026-09-21 (第三期全面测试 · 阶段一 compiler)
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

const PLAN_KEYS = [
  'ielts-task-plan', 'ielts.shadow.v2', 'ielts-task-progress', 'ielts.shadow.migNotice',
];

test.describe('Plan setup: the first-run screen asks only about minutes', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/plan-setup-first-run.md',
    });

    await test.step('Setup 1: Open the app', async () => {
      await page.goto(`${baseURL}/index.html?v=plan-setup`);
      await expect(page.locator('.sent').first()).toBeVisible();
    });

    await test.step('Setup 2: Clear the plan', async () => {
      await page.evaluate((keys) => {
        keys.forEach((k) => localStorage.removeItem(k));
      }, PLAN_KEYS);
      await page.reload();
      await expect(page.locator('.sent').first()).toBeVisible();
    });

    await test.step('Setup 3: Open the today panel', async () => {
      await page.getByRole('button', { name: '今日学习任务' }).click();
      await expect(page.getByRole('heading', { name: '每天有多少分钟' })).toBeVisible();
      await expect(page.getByRole('button', { name: '开始这个计划' })).toBeVisible();
    });
  });

  test(
    'one knob only, the minute estimate recomputes, and starting the plan leaves exactly one event',
    { tag: ['@regression', '@positive', '@shadow', '@plan'] },
    async ({ page }) => {
      // 面板点击没有网络与音频等待，用不着 beforeEach 那个 12 分钟预算（gotcha 11）
      test.setTimeout(currentTimeout());
      await test.step('Step 1: 设置屏只有一颗旋钮', async () => {
        const opts = page.locator('#psMin .ps-opt');
        await expect(opts).toHaveCount(7);
        expect(await opts.allInnerTexts()).toEqual([
          '5 分钟', '10 分钟', '15 分钟', '20 分钟', '30 分钟', '45 分钟', '60 分钟',
        ]);
        // 恰好一颗高亮：旧版出过「三个选项同时亮」
        await expect(page.locator('#psMin .ps-opt.sel')).toHaveCount(1);
        await expect(page.locator('#psMin .ps-opt.sel')).toHaveText('15 分钟');

        // 已删的「总天数 → 每天句数」除法链与「慢/正常/快」三档不许回来。
        // 旧版那颗「调整学习计划」浮层（含 TASK.adjustPlan）已连函数带导出一起删掉，这条断言继续防它复活。
        const panelText = (await page.locator('#todayPanel').textContent()) || '';
        ['总天数', '新句速度', '慢', '快'].forEach((banned) => {
          expect(panelText).not.toContain(banned);
        });
        await expect(page.locator('#adjSpeed')).toHaveCount(0);
        await expect(page.locator('#todayPanel input[type="range"]')).toHaveCount(0);
      });

      await test.step('Step 2: 句数与词数从页面现取，不写死', async () => {
        const derived = await page.evaluate(() => {
          const marks = new Set<string>();
          document.querySelectorAll('.sent').forEach((s) => {
            s.querySelectorAll('.w').forEach((w) => {
              const k = ((w as HTMLElement).dataset.w || '').trim().toLowerCase();
              if (k) marks.add(k);
            });
          });
          return { sents: document.querySelectorAll('.sent').length, words: marks.size };
        });
        expect(derived.sents).toBeGreaterThan(0);
        const sub = (await page.locator('.ps-sub').textContent()) || '';
        expect(sub).toContain(String(derived.sents));
        // 两个独立来源：面板自己说的那个词数，与页面里真标出来的词头数。不一致就是索引漏词。
        expect(derived.words).toBeGreaterThan(1000);
        expect(sub).toContain(String(derived.words));
      });

      let n60 = 0; const MIN_SEL = 60;
      await test.step('Step 3: 换分钟重算「今天大约」，题数恒等于句数 ×1（两步制：一句只剩 ② 一题）', async () => {
        const read = async () => {
          const txt = (await page.locator('#psSum').textContent()) || '';
          const m = txt.match(/(\d+)\s*句[^0-9]*(\d+)\s*题/);
          expect(m).not.toBeNull();
          return { sents: Number(m![1]), quizzes: Number(m![2]) };
        };
        await page.getByRole('button', { name: '60 分钟', exact: true }).click();
        await expect(page.locator('#psMin .ps-opt.sel')).toHaveText('60 分钟');
        const big = await read();
        n60 = big.sents;
        expect(big.quizzes).toBe(big.sents);

        await page.getByRole('button', { name: '5 分钟', exact: true }).click();
        const small = await read();
        expect(small.sents).toBeLessThan(big.sents);
        expect(small.quizzes).toBe(small.sents);

        await page.getByRole('button', { name: '60 分钟', exact: true }).click();
        await expect(page.locator('#psMin .ps-opt.sel')).toHaveText('60 分钟');
      });

      await test.step('Step 4: 开始这个计划 → 面板切到「今天」，设置屏消失', async () => {
        await page.getByRole('button', { name: '开始这个计划' }).click();
        await expect(page.locator('.tp-tab')).toHaveCount(3);
        await expect(page.locator('.tp-col h4').first()).toHaveText(`今天 · ${MIN_SEL} 分钟`);
        await expect(page.locator('#psMin')).toHaveCount(0);
        await expect(page.locator('.ps-start')).toHaveCount(0);
      });

      await test.step('Step 5: 计划落盘，事件流里只有那一条 dayplan', async () => {
        const stored = await page.evaluate(() => {
          const j = JSON.parse(localStorage.getItem('ielts.shadow.v2') || '{}');
          return {
            plan: j.plan || null,
            dayplans: (j.events || []).filter((e: any) => e.type === 'dayplan'),
            events: (j.events || []).length,
          };
        });
        expect(stored.plan.todayMinutes).toBe(MIN_SEL);
        expect(stored.plan.boundaryHour).toBe(4);
        expect(stored.plan.pausedNew).toBe(false);
        expect(stored.dayplans).toHaveLength(1);
        expect(stored.dayplans[0].minutes).toBe(MIN_SEL);
      });
    },
  );

  // After Hook — 共享存储状态恢复（清掉本轮建出来的计划），幂等。
  test.afterEach(async ({ page }, testInfo) => {
    await test.step('Teardown 1: Clear the plan', async () => {
      await page.evaluate((keys) => {
        keys.forEach((k) => localStorage.removeItem(k));
      }, PLAN_KEYS);
    }).catch((err) =>
      testInfo.annotations.push({ type: 'teardown-warning', description: String(err) }),
    );
  });
});
