// Compiled from: tests/e2e/shadow/event-paging.md
// Compiled at: 2026-09-24
// Source is authoritative — do not edit; re-compile from markdown if broken.
//
// 2026-09-24 实测的 P1：cloudPull 写死 `.range(0, 1999)`，全文件只有这一处 range。
// 第二台设备永远只拿到**最老的** 2000 条，之后的事件再也到不了 ——
// PRD §12 的「多设备一致」在这条上不成立。这条锁「按页拉完为止」。

import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

// App globals
declare const TASK: { resetV2(): void; cloudPull(): Promise<{ got: number; newEvents: number }>; events(): { type: string }[] };
declare const CLOUD: { client(): unknown };

const SERVER_TOTAL = 2300;   // 故意跨过旧的那个 1999 上限

test.describe('云端事件补拉：必须翻页拉到满', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);

  test(
    '服务端 2300 条要分多页拉回来，一条不落',
    { tag: ['@regression', '@shadow'] },
    async ({ page, baseURL }, testInfo) => {
      testInfo.setTimeout(currentTimeout() * 6);
      testInfo.annotations.push({ type: 'source', description: 'tests/e2e/shadow/event-paging.md' });
      await page.goto(`${baseURL}/index.html`);
      await expect(page.locator('.sent').first()).toBeVisible();

      const got = await page.evaluate(async (total) => {
        TASK.resetV2();
        const rows = [];
        for (let i = 0; i < total; i++) {
          rows.push({
            event_id: 'e' + i, ts: 1000 + i, type: 'contact',
            payload: { type: 'contact', w: 'x', s: 0, ts: 1000 + i },
          });
        }
        const pages: string[] = [];
        // 只换 client()：其余（排序列、range 语义）都按真 Supabase 的形状给
        CLOUD.client = () => ({
          auth: { getSession: async () => ({ data: { session: { user: { id: 'u' } } } }) },
          from: () => ({
            select: () => ({
              eq: () => ({
                order: () => ({
                  range: async (a: number, b: number) => {
                    pages.push(a + '-' + b);
                    return { data: rows.slice(a, b + 1), error: null };
                  },
                }),
              }),
            }),
          }),
        });
        const r = await TASK.cloudPull();
        return { pages, reported: r.got, local: TASK.events().length };
      }, SERVER_TOTAL);

      expect(got.pages.length, `只请求了 ${got.pages.length} 页（${got.pages.join(',')}）—— 说明又是单页硬上限`)
        .toBeGreaterThan(1);
      expect(got.reported, '补拉自报的条数').toBe(SERVER_TOTAL);
      expect(got.local, `本机只拿到 ${got.local} / ${SERVER_TOTAL} 条 —— 后面的永远到不了`).toBe(SERVER_TOTAL);
    },
  );
});
