// Compiled from: tests/e2e/shadow/event-compaction.md
// Compiled at: 2026-09-24
// Source is authoritative — do not edit; re-compile from markdown if broken.
//
// 2026-09-24 实测的 P1：事件流超上限时 `events.splice(0, cut)` + `recompute2()` ——
// 派生的词状态 / streak / daily 全部按**截断后**的日志重算，等于悄悄删进度
// （PRD §12 写的是"溢出时先合并同类 contact"，不是丢）。
// 修法分两半，这条锁的是**安全合并**那一半：合并必须对重放完全无影响。

import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

// App globals
declare const TASK: {
  resetV2(): void; initPlan(minutes: number): void; enterTaskMode(): void;
  todayPlan(force?: boolean): { queue: { i: number }[] };
  readDone(i: number): void;
  events(): { type: string; w?: string; s?: number | string }[];
  compactProbeForTest(): { before: string; after: string; eventsBefore: number; eventsAfter: number };
};

test.describe('事件流安全合并：压缩不许动账', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);

  test(
    '同日重读产生的重复 contact 可以合并，且派生状态逐字节不变',
    { tag: ['@regression', '@shadow'] },
    async ({ page, baseURL }, testInfo) => {
      testInfo.setTimeout(currentTimeout() * 8);
      testInfo.annotations.push({ type: 'source', description: 'tests/e2e/shadow/event-compaction.md' });
      await page.goto(`${baseURL}/index.html`);
      await expect(page.locator('.sent').first()).toBeVisible();

      const built = await page.evaluate(() => {
        TASK.resetV2(); TASK.initPlan(10); TASK.enterTaskMode();
        const q = TASK.todayPlan(true).queue.slice(0, 5);
        q.forEach((x) => TASK.readDone(x.i));      // 第一次：真接触
        q.forEach((x) => TASK.readDone(x.i));      // 第二次：同一 w|s|day，引擎会去重
        q.forEach((x) => TASK.readDone(x.i));      // 再来一遍
        const evs = TASK.events();
        const contacts = evs.filter((e) => e.type === 'contact');
        const uniq = new Set(contacts.map((e) => `${e.w}|${e.s}`));
        return { events: evs.length, contacts: contacts.length, uniq: uniq.size };
      });
      expect(built.contacts, '没造出重复 contact = 这条什么都没测').toBeGreaterThan(built.uniq);

      const probe = await page.evaluate(() => TASK.compactProbeForTest());
      expect(probe.eventsAfter, `合并没省下任何条数（${probe.eventsBefore} → ${probe.eventsAfter}）`)
        .toBeLessThan(probe.eventsBefore);
      expect(probe.after, `合并改了派生状态 —— 词状态/日程/日账必须逐字段不变`)
        .toBe(probe.before);
    },
  );
});
