// Compiled from: tests/e2e/shadow/progress-sync.md
// Compiled at: 2026-09-14
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

// App globals
declare const cloudPullMarks: () => Promise<void>;
declare const idx: number;
declare const CLOUD: any;

const FAKE_USER = 'test-user';

async function installFake(page: import('@playwright/test').Page, row: { marks: unknown[]; pos: Record<string, unknown> }) {
  await page.evaluate(
    ({ row, user }) => {
      const w: any = window;
      w.__upserts = [];
      w.__fakeRow = row;
      CLOUD.client = () => ({
        auth: {
          getSession: async () => ({ data: { session: { user: { id: user } } } }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: w.__fakeRow, error: null }),
            }),
          }),
          upsert: async (payload: object) => {
            w.__upserts.push(payload);
            return { error: null };
          },
        }),
      });
    },
    { row, user: FAKE_USER },
  );
}

test.describe('Progress cloud sync: pull, push, and latest-wins', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/progress-sync.md',
    });

    await test.step('Setup 1: Clear local progress', async () => {
      await page.goto(`${baseURL}/index.html`);
      await page.evaluate(() => localStorage.removeItem('ielts-pos'));
      expect(await page.evaluate(() => localStorage.getItem('ielts-pos'))).toBeNull();
    });

    await test.step('Setup 2: Install fake Supabase client', async () => {
      await installFake(page, { marks: [], pos: {} });
      const uid = await page.evaluate(async () => {
        const { data } = await CLOUD.client().auth.getSession();
        return data.session.user.id;
      });
      expect(uid).toBe(FAKE_USER);
    });
  });

  test(
    'progress syncs newest-wins in both directions',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page }) => {
      await test.step('Step 1: Cloud newer overwrites local', async () => {
        await installFake(page, { marks: [], pos: { i: 20, t: Date.now() } });
        await page.evaluate(() => cloudPullMarks());
        const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ielts-pos') || '{}') as { i: number });
        expect(stored.i).toBe(20);
        expect(await page.evaluate(() => idx)).toBe(20);
      });

      await test.step('Step 2: Local newer wins', async () => {
        await page.evaluate(() => localStorage.setItem('ielts-pos', JSON.stringify({ i: 5, t: Date.now() + 100000 })));
        await installFake(page, { marks: [], pos: { i: 20, t: 1000 } });
        await page.evaluate(() => cloudPullMarks());
        const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ielts-pos') || '{}') as { i: number });
        expect(stored.i).toBe(5);
      });

      await test.step('Step 3: savePos debounce-pushes pos to cloud', async () => {
        await installFake(page, { marks: [], pos: {} });
        await page.evaluate(() => {
          ((window as any).__upserts = []);
        });
        await page.evaluate(() => {
          const sents = document.querySelectorAll('.sent');
          sents[30].scrollIntoView({ block: 'center' });
          (sents[30] as HTMLElement).click();
        });
        await page.waitForTimeout(4500);
        const last = await page.evaluate(() => {
          const arr: any = (window as any).__upserts;
          return arr[arr.length - 1];
        });
        expect(last.user_id).toBe(FAKE_USER);
        expect(last.pos.i).toBe(30);
      });
    },
  );

  test.afterEach(async ({ page }) => {
    await test.step('Teardown 1: Clear progress storage', async () => {
      await page.evaluate(() => localStorage.removeItem('ielts-pos')).catch(() => {});
      await page.reload().catch(() => {});
    }).catch(() => {});
  });
});
