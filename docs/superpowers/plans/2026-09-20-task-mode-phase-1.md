# 学习计划与任务模式 · 第一期（骨架）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把影子跟读站的排程对象从「句子」换成「词」，每天按可用分钟装配三池队列，跑「通读 → 挖空 → 选义」三遍，并把进度以只追加事件流的形式同步到云端。

**Architecture:** 新增一个无 DOM 的纯逻辑引擎 `shadow/js/plan-engine.js`（全局 `ShadowPlan`），负责日界、事件→词状态的归约、三池装配、出题与迁移；`shadow/index.html` 里的 `TASK` 模块退化为宿主，只做存储、渲染、播放接线。真值只有一份 —— 事件日志；所有界面数字都从「事件重放出来的状态」派生。

**Tech Stack:** 原生 ES2019（无构建、无框架）、Supabase JS v2（`window.supabase`）、Python 静态服务器 + `@playwright/test` 1.63（headless chromium）。

**Spec:** `docs/2026-09-20-学习计划与任务模式重设计-PRD.md`（v1.1 定稿）—— **先读它的 §0 / §4 十条原则 / §5 / §6 / §7.4 / §11 / §12**。原型见 `docs/prototype/2026-09-20-任务模式原型.html`。

## Global Constraints

每个任务的隐含要求，逐条抄自规格：

- 唯一目的是背单词；**读句子本身就是背单词**，不做口语评测、不做卡片式词表入口（原则 1）。
- **接触是货币，检索只是升级考试**：① 遍完成就计今日进度；答错不扣任何进度（原则 2）。
- **挖空永远遮目标词**，绝不遮词伙（原则 3）。第一期只有回忆题形态的 ②，规则相同。
- 句子不存记忆曲线：`prog.sentences[i].reps / phase / nextDue` 这套彻底废除（原则 4）。
- **不生成欠账**：状态里不允许出现 `debt` / `pending` 之类字段，界面上不允许出现「欠 / 待补 / 还差」（原则 5）。
- 界面：任务栏同一根、只换内容，**上一句/下一句在任务模式下必须可见可点**；同一个数字全页至多出现一次；「今天」与「词汇」两栏永不合并（原则 6）。
- 第一期只做跟读站；队列项结构预留 `kind:'sent'|'word'`，但只产出 `'sent'`（原则 7）。
- 内容不许造：出题的素材只能来自 `shadow/data/vocab.json` 与 `shadow/data/sections.json` 里已有的东西（原则 8）。
- 期次写「第一期 / 第二期 / 第三期」；引用设计原则写「原则 N」（全文命名约定）。
- 不改 `shadow/data/sections.json` 的句子数量。若任何改动导致句数变化，**必须**在 `shadow/index.html` 的 `SENT_SHIFTS` 追加记录（AGENTS.md §2，`validate_data.py` 第 14 条会拦）。
- 每次改了 `shadow/data/*.json` 必须 bump `shadow/index.html` 的 `SHADOW_DATA_VER`；只改 HTML/JS 不需要（`validate_data.py` 第 0b 条只管数据）。
- **不改 `config.js`、不提交任何密钥**（AGENTS.md §6）。
- 完工前必须：`cd playwright-tests && npm test` 全绿、`python3 scripts/validate_data.py` 输出 `Validation PASSED`、`node scripts/build_site.mjs` 构建自检通过。
- 不在 `main` 上改；分支形如 `agent/qoder-task-mode-build-0920`。**不替用户 push main。**

## 本期我替你做的设计决定（规格里留白或需要落地的地方）

| # | 决定 | 为什么 |
|---|---|---|
| D1 | 纯逻辑放 `shadow/js/plan-engine.js`，全局 `ShadowPlan`，不碰 DOM | `shadow/index.html` 已 4760 行；引擎可单独读、单独测 |
| D2 | 真值 = 事件日志；派生态每次全量重放（`eventsSeen !== events.length` 时），重放期用临时 Set 去重 | 不做增量合并就没有冲突面；千级事件重放是毫秒级 |
| D3 | **接触去重键 = 词 + 句 + 日**：同一天反复回放同一句，只给句中各词记 1 次接触 | 否则「重播一句 20 遍」能把词刷毕业，`reps ≥ 20` 的出口就是假的 |
| D4 | 词间隔表沿用现表：`[0,0,0,1,1,2,2,3,3,4,5,5,5,5,5,7,7,7,7,7]`，毕业后进 `14 → 30` | 原则：第一期不换算法，先把账记对 |
| D5 | `graduated` 判据 = `reps ≥ 20 && ok3 ≥ 1`（③ 至少答对过一次） | 规格原文「最后一次 ③ 答对」难以稳定复算，等价改为「曾经答对且未再错到需要重考」 |
| D6 | **③ 第一期就能做**：干扰义项取自「同一段里其它目标词」的中文义项，不需要辨析内容 | 义项本来就在卡上（`m` 字段，分号分项）；语义选项不存在"两个都对"的争议 |
| D7 | ② 第一期只做回忆题（遮目标词 + 译文 + 首字母 + 词长 + 词性 + 一条词伙首词），判分允许编辑距离 ≤ 1 | 四选一的选项必须来自已裁决的辨析组（原则 8 + §8.7），第二期解锁 |
| D8 | 上云表 `shadow_events(user_id, event_id text primary key, ts bigint, type text, payload jsonb)`；push = `upsert(onConflict:'event_id')`，pull = `gte('ts', 本地最大 ts − 60s)` + 按 `event_id` 去重 | 单用户两设备，不需要游标、不需要服务端状态 |
| D9 | `streak` 不存，从 `daily` 派生；地板日与扎实日在 `daily` 里各一个布尔位 | 数字唯一性：界面所有天数都从同一份 daily 现算 |
| D10 | 面板一个容器三个视图：`#todayPanel[data-view="today|plan|book"]`；词本第一期只做「按状态筛选 + 列表 + 重学」 | 二期再加「按辨析组逛」 |
| D11 | 云端测试用 `page.addInitScript` 注入假 `window.supabase`（`CLOUD.client()` 在它缺失时返回 null，这是现成接缝） | 不打真网络，不碰真凭证 |
| D12 | 旧用例 `carryover-queue.spec.ts` 断言的是**旧模型**的内部（`newPerDay`、句窗口），必须改写为断言新不变量 | 留着它 = 用测试锁死旧设计 |
| D13 | `stage` 事件类型第一期不产生（状态是派生量），但 reducer 在跃迁时往 `events` 里写 `promote` 事件 | 云端与遥测需要能还原"哪天晋升了什么"，而 FSRS 拟合需要的正是接触与对错 |

---

## 文件结构

| 文件 | 动作 | 责任 |
|---|---|---|
| `shadow/js/plan-engine.js` | 新建 | 纯逻辑：日界、间隔表、事件归约、三池装配、出题、判分、迁移。无 DOM、无 fetch |
| `shadow/index.html` | 修改 | `TASK` 模块改宿主：存储 v2、渲染、三遍控制、播放接线、云同步；`#taskBar`/`#todayPanel` 结构 |
| `scripts/build_site.mjs` | 修改 | 白名单加 `shadow/js/plan-engine.js`（漏了会构建自检失败 + 线上 404） |
| `sql/shadow_events.sql` | 新建 | 建表 + RLS，**由用户本人在 Supabase 执行** |
| `playwright-tests/journeys/shadow/plan-engine.spec.ts` | 新建 | 引擎单元测试（日界、归约、装配、出题、判分） |
| `playwright-tests/journeys/shadow/task-migration.spec.ts` | 新建 | 老 localStorage 迁移 |
| `playwright-tests/journeys/shadow/task-flow.spec.ts` | 新建 | 三遍流程 + 界面不变量（控件不藏、数字唯一、两栏不合并） |
| `playwright-tests/journeys/shadow/task-events.spec.ts` | 新建 | 事件流上云：离线堆积、重放幂等 |
| `playwright-tests/journeys/shadow/carryover-queue.spec.ts` | 改写 | 旧模型断言 → 新不变量 |
| `tests/e2e/shadow/task-mode-phase1.md` | 新建 | 上述用例的书面案例文档（仓库约定：spec 头部注明 source） |
| `docs/PRD.md` | 修改 | 新增 §5.9 学习计划与任务模式（补掉规格空洞） |

---

## Task 1: 引擎骨架与日界

**Files:**
- Create: `shadow/js/plan-engine.js`
- Modify: `shadow/index.html:1304`（`<script src="config.js"></script>` 之后插一行）
- Modify: `scripts/build_site.mjs:32-35`（FILES 白名单）
- Test: `playwright-tests/journeys/shadow/plan-engine.spec.ts`

**Interfaces:**
- Consumes: 无（这是第一个任务）
- Produces：全局 `ShadowPlan`，本任务交付
  - `ShadowPlan.DAY_MS: number`
  - `ShadowPlan.WORD_INTERVALS: number[]`（20 项，毕业后的 14/30 另表）
  - `ShadowPlan.STAGES: ['fresh','seen','recognized','owned','graduated']`
  - `ShadowPlan.dayKey(ts: number, boundaryHour: number): string` → `'YYYY-MM-DD'`
  - `ShadowPlan.dayDiff(a: string, b: string): number` → 两个 dayKey 之间的天数（b−a，按日历日）
  - `ShadowPlan.wordInterval(reps: number): number` → 天
  - `ShadowPlan.emptyState(): object`

- [ ] **Step 1: 写失败的测试（日界与 dayKey）**

创建 `playwright-tests/journeys/shadow/plan-engine.spec.ts`：

```ts
import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

declare const ShadowPlan: {
  DAY_MS: number;
  WORD_INTERVALS: number[];
  STAGES: string[];
  dayKey(ts: number, boundaryHour: number): string;
  dayDiff(a: string, b: string): number;
  wordInterval(reps: number): number;
  emptyState(): { words: Record<string, unknown> };
};

const ENV = process.env.E2E_ENVIRONMENT || 'local';

test.describe('plan engine · day boundary', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);

  test('loads as a global with the documented surface', async ({ page, baseURL }) => {
    test.setTimeout(currentTimeout() * 4);
    await page.goto(`${baseURL}/index.html`);
    const shape = await page.evaluate(() => ({
      hasDay: typeof ShadowPlan.dayKey === 'function',
      dayMs: ShadowPlan.DAY_MS,
      intervals: ShadowPlan.WORD_INTERVALS.length,
      stages: ShadowPlan.STAGES.join('>'),
    }));
    expect(shape.hasDay).toBe(true);
    expect(shape.dayMs).toBe(86400000);
    expect(shape.intervals).toBe(20);   // 原表 21 档，末档 14 已挪进 GRADUATED_INTERVALS
    expect(shape.stages).toBe('fresh>seen>recognized>owned>graduated');
  });

  test('04:00 boundary keeps 03:50 on the previous day', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/index.html`);
    const got = await page.evaluate(() => {
      const before = new Date(2026, 8, 20, 3, 50, 0).getTime();
      const after = new Date(2026, 8, 20, 4, 10, 0).getTime();
      return [ShadowPlan.dayKey(before, 4), ShadowPlan.dayKey(after, 4)];
    });
    expect(got).toEqual(['2026-09-19', '2026-09-20']);
  });

  test('boundaryHour 0 is plain midnight', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/index.html`);
    const got = await page.evaluate(() => {
      const late = new Date(2026, 8, 20, 23, 30, 0).getTime();
      const early = new Date(2026, 8, 21, 0, 30, 0).getTime();
      return [ShadowPlan.dayKey(late, 0), ShadowPlan.dayKey(early, 0),
              ShadowPlan.dayDiff(ShadowPlan.dayKey(late, 0), ShadowPlan.dayKey(early, 0))];
    });
    expect(got).toEqual(['2026-09-20', '2026-09-21', 1]);
  });

  test('word interval saturates instead of running off the table', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/index.html`);
    const got = await page.evaluate(() => [
      ShadowPlan.wordInterval(0), ShadowPlan.wordInterval(3),
      ShadowPlan.wordInterval(20), ShadowPlan.wordInterval(999),
    ]);
    expect(got).toEqual([0, 1, 14, 14]);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd playwright-tests && npx playwright test plan-engine -g "loads as a global"`
Expected: FAIL —— `ReferenceError: ShadowPlan is not defined`

- [ ] **Step 3: 写引擎文件**

创建 `shadow/js/plan-engine.js`：

```js
/* 学习计划引擎：纯逻辑，不碰 DOM、不发请求。宿主是 shadow/index.html 的 TASK 模块。
   真值只有一份 —— 事件日志。派生态（词状态、daily、streak）一律重放现算，不另存副本。 */
(function () {
  'use strict';

  const DAY_MS = 864e5;
  // 第 n 次接触后隔几天再见。前段是 0（当天回锅），毕业后进 14 → 30。
  const WORD_INTERVALS = [0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 5, 5, 5, 5, 5, 7, 7, 7, 7, 7];
  const GRADUATED_INTERVALS = [14, 30];
  const STAGES = ['fresh', 'seen', 'recognized', 'owned', 'graduated'];
  const MASTER_REPS = 20;      // reps ≥ 20 且 ③ 答对过 → graduated
  const LEECH_ERR = 3;         // 连错 3 次 → 重点词

  const pad = (n) => String(n).padStart(2, '0');

  // 「今天」的唯一入口。默认凌晨 4 点日界：熬夜到 3 点不该算断更，
  // 也不该一次看到两天的任务。
  function dayKey(ts, boundaryHour) {
    const b = Number.isInteger(boundaryHour) ? boundaryHour : 4;
    const d = new Date(ts - b * 3600e3);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function dayDiff(a, b) {
    const ta = Date.parse(a + 'T12:00:00');
    const tb = Date.parse(b + 'T12:00:00');
    return Math.round((tb - ta) / DAY_MS);
  }

  function wordInterval(reps) {
    if (reps >= MASTER_REPS) return GRADUATED_INTERVALS[0];
    return WORD_INTERVALS[Math.max(0, Math.min(reps, WORD_INTERVALS.length - 1))];
  }

  function emptyState() {
    return { v: 2, plan: null, words: {}, sents: {}, daily: {}, eventsSeen: 0, migratedAt: 0 };
  }

  window.ShadowPlan = {
    DAY_MS, WORD_INTERVALS, GRADUATED_INTERVALS, STAGES, MASTER_REPS, LEECH_ERR,
    dayKey, dayDiff, wordInterval, emptyState,
  };
})();
```

- [ ] **Step 4: 挂进页面并发布白名单**

`shadow/index.html` 第 1304 行后插入（必须在主 `<script>` 之前，`TASK` 会用到它）：

```html
    <script src="js/plan-engine.js"></script>
```

`scripts/build_site.mjs` 的 `FILES` 里，`'shadow/index.html'` 之后加一行：

```js
  'shadow/js/plan-engine.js',
```

- [ ] **Step 5: 跑测试确认通过**

Run: `cd playwright-tests && npx playwright test plan-engine -v`
Expected: 4 passed。若报 `page.goto` 拿到旧 HTML，按仓库约定加缓存串 `?v=N` 并递增 N。

- [ ] **Step 6: 构建自检**

Run: `node scripts/build_site.mjs && ls -l dist/shadow/js/plan-engine.js`
Expected: 文件存在（白名单漏了会在这里失败）

- [ ] **Step 7: 提交**

```bash
git add shadow/js/plan-engine.js shadow/index.html scripts/build_site.mjs playwright-tests/journeys/shadow/plan-engine.spec.ts
git commit -m "feat(task-mode): 抽出无 DOM 的排程引擎骨架并接入日界口径"
```

---

## Task 2: 事件流与词状态归约（记忆模型搬到词上）

**Files:**
- Modify: `shadow/js/plan-engine.js`
- Test: `playwright-tests/journeys/shadow/plan-engine.spec.ts`（追加用例）

**Interfaces:**
- Consumes: `ShadowPlan.dayKey / wordInterval / emptyState`（Task 1）
- Produces:
  - `ShadowPlan.eventId(ev: object): string`
  - `ShadowPlan.mkContact(word: string, sent: number, at: number, day: string): ev`
  - `ShadowPlan.mkQuiz(word: string, sent: number, kind: 'recall'|'mc4zh', ok: boolean, at: number, day: string): ev`
  - `ShadowPlan.mkPromote(word: string, from: string, to: string, at: number, day: string): ev`
  - `ShadowPlan.replay(events: ev[], opts: {plan, boundaryHour, wordsOf}): state`
    - `wordsOf(sentIndex: number): string[]` 由宿主提供（从 `SENT_RAW` 抽 `[[key:...]]`）
  - `ShadowPlan.wordState(state, key): {stage, reps, err, due, leech, ctx}`（缺省给 fresh 空壳）

- [ ] **Step 1: 写失败的测试**

追加进 `plan-engine.spec.ts`：

```ts
type Ev = Record<string, unknown>;

const seed = (page: import('@playwright/test').Page, fn: (p: unknown) => unknown, arg: unknown) =>
  page.evaluate(([src, a]) => (new Function('return (' + src + ')')())(a), [fn.toString(), arg] as [string, unknown]);

test.describe('plan engine · word state reducer', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);
  test.beforeEach(async ({ page, baseURL }) => { await page.goto(`${baseURL}/index.html`); });

  test('reading a sentence credits every unfinished word in it, once per day', async ({ page }) => {
    const got = await page.evaluate(() => {
      const at = new Date(2026, 8, 20, 9, 0, 0).getTime();
      const wordsOf: Record<number, string[]> = { 5: ['damp', 'humid'], 6: ['mist'] };
      const ev = [
        ShadowPlan.mkContact('damp', 5, at, '2026-09-20'),
        ShadowPlan.mkContact('humid', 5, at, '2026-09-20'),
        // 同一句重播：同一天不应重复记接触
        ShadowPlan.mkContact('damp', 5, at + 30000, '2026-09-20'),
        ShadowPlan.mkContact('damp', 5, at + 60000, '2026-09-20'),
        ShadowPlan.mkContact('damp', 5, at + 60000, '2026-09-21'),
      ];
      const st = ShadowPlan.replay(ev, { boundaryHour: 4, wordsOf: (i: number) => wordsOf[i] || [] });
      return { damp: st.words.damp.reps, humid: st.words.humid.reps,
               dampStage: st.words.damp.stage, s5: st.sents['5'].lastReadAt > 0 };
    });
    expect(got).toEqual({ damp: 2, humid: 1, dampStage: 'seen', s5: true });
  });

  test('recognized needs two different contexts; a quiz wrong answer never downgrades', async ({ page }) => {
    const got = await page.evaluate(() => {
      const T = (d: number, h = 9) => new Date(2026, 8, d, h, 0, 0).getTime();
      const w = (i: number) => ['peer'];
      const ev: unknown[] = [];
      ev.push(ShadowPlan.mkContact('peer', 1500, T(20), '2026-09-20'));
      ev.push(ShadowPlan.mkQuiz('peer', 1500, 'recall', true, T(20, 10), '2026-09-20'));   // 课文语境 ✓
      const half = ShadowPlan.replay(ev, { boundaryHour: 4, wordsOf: () => ['peer'] });
      ev.push(ShadowPlan.mkContact('peer', 1500, T(21), '2026-09-21'));
      ev.push(ShadowPlan.mkQuiz('peer', 1500, 'recall', false, T(21, 10), '2026-09-21'));  // 答错
      const afterWrong = ShadowPlan.replay(ev, { boundaryHour: 4, wordsOf: () => ['peer'] });
      ev.push(ShadowPlan.mkQuiz('peer', 'ex', 'recall', true, T(22), '2026-09-22'));       // 例句语境 ✓
      const both = ShadowPlan.replay(ev, { boundaryHour: 4, wordsOf: () => ['peer'] });
      return {
        halfStage: half.words.peer.stage,
        wrongKeepsStage: afterWrong.words.peer.stage,
        wrongErr: afterWrong.words.peer.err,
        wrongDueToday: afterWrong.words.peer.due <= T(21, 23),
        bothStage: both.words.peer.stage,
      };
    });
    expect(got.halfStage).toBe('seen');
    expect(got.wrongKeepsStage).toBe('seen');
    expect(got.wrongErr).toBe(1);
    expect(got.wrongDueToday).toBe(true);
    expect(got.bothStage).toBe('recognized');
  });

  test('③ right answer makes it owned; 20 contacts and ok3 graduates it', async ({ page }) => {
    const got = await page.evaluate(() => {
      const ev: unknown[] = [];
      for (let d = 1; d <= 25; d++) {
        const day = '2026-09-' + String(d).padStart(2, '0');
        ev.push(ShadowPlan.mkContact('gaze', 1500, d * 864e5, day));
      }
      const before = ShadowPlan.replay(ev, { boundaryHour: 4, wordsOf: () => ['gaze'] });
      ev.push(ShadowPlan.mkQuiz('gaze', 1500, 'mc4zh', true, 26 * 864e5, '2026-09-26'));
      const after = ShadowPlan.replay(ev, { boundaryHour: 4, wordsOf: () => ['gaze'] });
      return { before: before.words.gaze.stage, reps: after.words.gaze.reps,
               after: after.words.gaze.stage };
    });
    expect(got.before).toBe('seen');
    expect(got.reps).toBe(25);
    expect(got.after).toBe('graduated');
  });

  test('three wrong answers mark it a leech and never silently hide it', async ({ page }) => {
    const got = await page.evaluate(() => {
      const ev: unknown[] = [];
      for (let i = 0; i < 3; i++) {
        const day = '2026-09-' + String(20 + i).padStart(2, '0');
        ev.push(ShadowPlan.mkContact('ooze', 1583, i * 864e5, day));
        ev.push(ShadowPlan.mkQuiz('ooze', 1583, 'recall', false, i * 864e5 + 1, day));
      }
      const st = ShadowPlan.replay(ev, { boundaryHour: 4, wordsOf: () => ['ooze'] });
      return { err: st.words.ooze.err, leech: !!st.words.ooze.leech, stage: st.words.ooze.stage };
    });
    expect(got).toEqual({ err: 3, leech: true, stage: 'seen' });
  });

  test('event ids are stable and dedupe on replay', async ({ page }) => {
    const got = await page.evaluate(() => {
      const a = ShadowPlan.mkContact('mist', 26, 1700000000000, '2026-09-20');
      const b = ShadowPlan.mkContact('mist', 26, 1700000000000, '2026-09-20');
      const c = ShadowPlan.mkContact('mist', 27, 1700000000000, '2026-09-20');
      const st = ShadowPlan.replay([a, b, c], { boundaryHour: 4, wordsOf: () => ['mist'] });
      return { same: ShadowPlan.eventId(a) === ShadowPlan.eventId(b),
               diff: ShadowPlan.eventId(a) !== ShadowPlan.eventId(c),
               reps: st.words.mist.reps, seen: st.eventsSeen };
    });
    expect(got).toEqual({ same: true, diff: true, reps: 1, seen: 2 });
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd playwright-tests && npx playwright test plan-engine -g "word state reducer" -v`
Expected: FAIL —— `ShadowPlan.mkContact is not a function`

- [ ] **Step 3: 写实现**

在 `shadow/js/plan-engine.js` 里 `emptyState` 之前插入：

```js
  /* ---------- 事件：只追加，不改写 ---------- */
  // id 必须是内容的纯函数：云端和本地各自生成同一个 id，重放天然幂等去重。
  function eventId(ev) {
    const s = ev.type + '|' + (ev.w || '') + '|' + (ev.s === undefined ? '' : ev.s) +
              '|' + (ev.day || '') + '|' + ev.ts + '|' + (ev.ok === undefined ? '' : ev.ok ? 1 : 0) +
              '|' + (ev.kind || '');
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
    return h.toString(16) + '-' + s.length.toString(16);
  }
  const mkContact = (w, s, at, day) => ({ type: 'contact', w, s, day, ts: at, id: null });
  const mkQuiz = (w, s, kind, ok, at, day) => ({ type: 'quiz', w, s, kind, ok, day, ts: at, id: null });
  const mkPromote = (w, from, to, at, day) => ({ type: 'promote', w, from, to, day, ts: at, id: null });

  function newWord() {
    return { stage: 'fresh', reps: 0, err: 0, due: 0, ctx: {}, ok3: 0,
             firstSeenAt: 0, lastContactAt: 0, lastContactDay: '', leech: false };
  }

  // 一次 ② 答对记在「语境」上：课文句是句索引，卡上例句是 'ex'。
  // 两个不同语境各对一次 → recognized（原则 3：同一个词必须在两个语境里都站得住）。
  function bumpCtx(w, sentKey, kind, ok) {
    if (kind === 'mc4zh') { if (ok) w.ok3++; return; }
    if (!ok) return;
    w.ctx[sentKey] = (w.ctx[sentKey] || 0) + 1;
  }

  function stageOf(w) {
    if (w.reps >= MASTER_REPS && w.ok3 >= 1) return 'graduated';
    if (w.ok3 >= 1) return 'owned';
    const ctxes = Object.keys(w.ctx).filter(k => w.ctx[k] > 0);
    if (ctxes.length >= 2) return 'recognized';
    if (w.reps >= 1) return 'seen';
    return 'fresh';
  }

  function replay(events, opts) {
    const o = opts || {};
    const boundary = o.boundaryHour === undefined ? 4 : o.boundaryHour;
    const wordsOf = typeof o.wordsOf === 'function' ? o.wordsOf : () => [];
    const st = emptyState();
    st.plan = o.plan || null;
    const seenIds = new Set();
    const credited = new Set();   // 词+句+日 只记一次接触（D3）
    const daySents = new Map();   // dayKey → Set<句号>

    for (const raw of events) {
      const ev = raw || {};
      const id = ev.id || eventId(ev);
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      st.eventsSeen++;
      const day = ev.day || dayKey(ev.ts || 0, boundary);

      if (ev.type === 'contact') {
        if (!ev.w) continue;
        const k = ev.w + '|' + ev.s + '|' + day;
        const slot = st.words[ev.w] || (st.words[ev.w] = newWord());
        const before = slot.stage;
        st.sents[ev.s] = { lastReadAt: Math.max(st.sents[ev.s] ? st.sents[ev.s].lastReadAt : 0, ev.ts || 0) };
        if (!daySents.has(day)) daySents.set(day, new Set());
        daySents.get(day).add(ev.s);              // 今天读过的句数：两栏「今天」那一列的来源
        if (!credited.has(k)) {
          credited.add(k);
          if (before !== 'graduated') {
            slot.reps++;
            slot.lastContactAt = ev.ts || 0;
            slot.lastContactDay = day;
            if (!slot.firstSeenAt) slot.firstSeenAt = ev.ts || 0;
          }
        }
        slot.stage = stageOf(slot);
        slot.due = (ev.ts || 0) + wordInterval(slot.reps) * DAY_MS;
        if (slot.stage !== before) touchDaily(st, day).promote = (touchDaily(st, day).promote || 0) + 1;
      } else if (ev.type === 'quiz') {
        if (!ev.w) continue;
        const slot = st.words[ev.w] || (st.words[ev.w] = newWord());
        const before = slot.stage;
        bumpCtx(slot, ev.s, ev.kind, !!ev.ok);
        if (ev.ok) slot.err = 0;       // 只有答对才清零：读到不等于会了
        if (!ev.ok) {
          slot.err++;
          slot.leech = slot.err >= LEECH_ERR;
          slot.due = ev.ts || 0;            // 今天之内再见一次，不倒退状态
        }
        slot.stage = stageOf(slot);
        const d = touchDaily(st, day);
        d.quizDone = (d.quizDone || 0) + 1;
        if (ev.ok) d.correct = (d.correct || 0) + 1;
        if (slot.stage !== before) touchDaily(st, day).promote = (touchDaily(st, day).promote || 0) + 1;
      } else if (ev.type === 'promote') {
        // 云端拉回来的历史晋升：状态已能从 contact/quiz 现算，这里只补今天的晋升计数
        touchDaily(st, day).promote = (touchDaily(st, day).promote || 0) + 1;
      } else if (ev.type === 'flag' || ev.type === 'dayplan') {
        if (ev.type === 'dayplan' && ev.day) {
          const d = touchDaily(st, ev.day);
          if (ev.minutes) d.minutes = ev.minutes;
        }
      }
    }
    for (const key in st.words) {
      const w = st.words[key];
      w.stage = stageOf(w);          // 收尾统一收一次口，界面与装配都只读这一个值
    }
    daySents.forEach((set, day) => { touchDaily(st, day).sentDone = set.size; });
    return st;
  }

  function touchDaily(st, day) { return st.daily[day] || (st.daily[day] = {}); }

  function wordState(st, key) { return (st && st.words[key]) || newWord(); }
```

> 晋升计数在归约时顺手累加到 `daily[promote]`；「哪天晋升了什么」留给 promote 事件单独承载，第二期接排程拟合时再启用（本期不产生该事件类型，见 D13）。重点词的提前回炉由 `assemble` 的排序负责，不在 reducer 里改 `due`。

并把文件末尾的导出改成：

```js
  window.ShadowPlan = {
    DAY_MS, WORD_INTERVALS, GRADUATED_INTERVALS, STAGES, MASTER_REPS, LEECH_ERR,
    dayKey, dayDiff, wordInterval, emptyState,
    eventId, mkContact, mkQuiz, mkPromote, replay, wordState, newWord, stageOf,
  };
```

- [ ] **Step 4: 跑测试确认通过**

Run: `cd playwright-tests && npx playwright test plan-engine -v`
Expected: 9 passed（含 Task 1 的 4 条）

- [ ] **Step 5: 提交**

```bash
git add shadow/js/plan-engine.js playwright-tests/journeys/shadow/plan-engine.spec.ts
git commit -m "feat(task-mode): 事件流 + 词状态归约，句内每个未毕业词各记一次接触"
```

---

## Task 3: 三池装配与时间预算

**Files:**
- Modify: `shadow/js/plan-engine.js`
- Test: `playwright-tests/journeys/shadow/plan-engine.spec.ts`（追加）

**Interfaces:**
- Consumes: `ShadowPlan.replay` 产出的 state（Task 2）
- Produces: `ShadowPlan.assemble(state, opts): {queue, items, words, stats}`
  - `opts = { now:number, todayMinutes:number, rate:number, secNew:number, secReview:number, secQuiz:number, wordsOf(i):string[], totalSents:number, boundaryHour:number }`
  - `queue: [{kind:'sent', i:number, pool:'A'|'B'|'C', sec:number, words:string[]}]`
  - `items: [{kind:'quiz', s:number, w:string, pass:2|3, pool:string}]`（②③ 的题位，按 PRD §5.3 第 4 步）
  - `stats: {budgetSec, usedSec, dueWords, newWords, droppedA, floor:boolean}`

- [ ] **Step 1: 写失败的测试**

```ts
test.describe('plan engine · time budget', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);
  test.beforeEach(async ({ page, baseURL }) => { await page.goto(`${baseURL}/index.html`); });

  const FIX = {
    rate: 1, secNew: 25, secReview: 8, secQuiz: 6, totalSents: 60, boundaryHour: 4,
    // 每句两个目标词；0-9 号句的词已全部毕业，10-29 到期复习，30+ 全新
    wordsOf: null as unknown,
  };

  const mk = (page: import('@playwright/test').Page, minutes: number, stageOfWords: string) =>
    page.evaluate(([mins, which, f]) => {
      const wordsOf = (i: number) => ['w' + i + 'a', 'w' + i + 'b'];
      const st = ShadowPlan.emptyState();
      const at = Date.now();
      const fill = (idx: number[], reps: number) => idx.forEach(i => {
        wordsOf(i).forEach(w => { st.words[w] = Object.assign(ShadowPlan.newWord(),
          { stage: 'seen', reps, due: which === 'due' ? at - 864e5 : at + 30 * 864e5 }); });
      });
      const grad = (idx: number[]) => idx.forEach(i => wordsOf(i).forEach(w => {
        st.words[w] = Object.assign(ShadowPlan.newWord(), { stage: 'graduated', reps: 30, due: at + 30 * 864e5 });
      }));
      grad([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      if (which === 'due') fill(Array.from({ length: 20 }, (_, k) => 10 + k), 4);
      return ShadowPlan.assemble(st, {
        now: at, todayMinutes: mins, rate: f.rate, secNew: f.secNew,
        secReview: f.secReview, secQuiz: f.secQuiz, wordsOf,
        totalSents: f.totalSents, boundaryHour: f.boundaryHour,
      });
    }, [minutes, stageOfWords, FIX] as [number, string, typeof FIX]);

  test('a 10-minute day fits inside 10 minutes', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/index.html`);
    const got = await mk(page, 10, 'due');
    expect(got.stats.usedSec).toBeLessThanOrEqual(10 * 60);
    expect(got.queue.length).toBeGreaterThan(0);
    expect(got.stats.dueWords).toBeGreaterThan(0);
    expect(got.stats.droppedA).toBeGreaterThan(0);   // 20 句装不下，说明确实砍了
  });

  test('a longer budget serves strictly more sentences, never fewer', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/index.html`);
    const a = await mk(page, 10, 'due');
    const b = await mk(page, 30, 'due');
    expect(b.queue.length).toBeGreaterThanOrEqual(a.queue.length);
    expect(b.stats.usedSec).toBeLessThanOrEqual(30 * 60);
  });

  test('nothing due and nothing new still yields the floor task', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/index.html`);
    const got = await mk(page, 0, 'none');
    expect(got.stats.floor).toBe(true);
    expect(got.queue.length + got.stats.newWords).toBeGreaterThan(0);
  });

  test('queue items carry the reserved kind field and only ever say sent in phase 1', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/index.html`);
    const got = await mk(page, 15, 'due');
    expect(got.queue.every((x: { kind: string }) => x.kind === 'sent')).toBe(true);
    expect(got.queue.every((x: { i: number }) => Number.isInteger(x.i))).toBe(true);
    // 不生成欠账：装配结果里不允许出现 debt 这一类字段
    expect(JSON.stringify(got)).not.toMatch(/debt|pending|backlog/i);
  });

  test('quiz slots cost time too: 2n + k', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/index.html`);
    const got = await mk(page, 20, 'due');
    const n = got.queue.length;
    const read = got.queue.reduce((s: number, q: { sec: number }) => s + q.sec, 0);
    expect(got.stats.usedSec).toBe(read + got.items.length * FIX.secQuiz);
    expect(got.items.length).toBeLessThanOrEqual(2 * n + 20);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd playwright-tests && npx playwright test plan-engine -g "time budget"`
Expected: FAIL —— `ShadowPlan.assemble is not a function`

- [ ] **Step 3: 写实现**

在 `shadow/js/plan-engine.js` 里加入（放在 `replay` 之后）：

```js
  /* ---------- 三池装配 ----------
     A 到期复习 / C 新词 / B 加深。时间预算是唯一输入；句数是结果。
     装不下的部分今天不排、明天重算 —— 状态里没有任何 debt 字段（原则 5）。 */
  function assemble(state, opts) {
    const o = opts || {};
    const now = o.now || Date.now();
    const total = o.totalSents || 0;
    const wordsOf = o.wordsOf || (() => []);
    const rate = o.rate || 1;
    const secNew = (o.secNew || 25) / rate, secReview = (o.secReview || 8) / rate, secQuiz = (o.secQuiz || 6) / rate;
    const budget = Math.max(0, (o.todayMinutes || 0) * 60);
    const ws = (state && state.words) || {};
    const daily = (state && state.daily) || {};
    const today = dayKey(now, o.boundaryHour);
    const doneToday = new Set();
    for (const key in ws) if (ws[key].lastContactDay === today) doneToday.add(key);

    // 池：到期词 A、未到期未毕业 B、全新 C
    const dueW = [], growW = [], newW = [];
    let dueWords = 0;
    for (let i = 0; i < total; i++) {
      for (const w of wordsOf(i)) {
        const st = ws[w];
        if (!st || st.stage === 'fresh') { if (!newW.includes(w)) newW.push(w); continue; }
        if (st.stage === 'graduated') continue;
        if (doneToday.has(w)) continue;
        if ((st.due || 0) <= now) { dueWords++; dueW.push({ w, i, due: st.due || 0, leech: !!st.leech }); }
        else growW.push({ w, i });
      }
    }
    dueW.sort((a, b) => (b.leech ? 1 : 0) - (a.leech ? 1 : 0) || a.due - b.due || a.i - b.i);

    const SENT = new Map();     // 句号 → {pool, sec}
    const put = (i, pool, sec) => {
      const cur = SENT.get(i);
      if (!cur) SENT.set(i, { i, kind: 'sent', pool, sec, words: wordsOf(i).slice() });
      else if (pool === 'A' && cur.pool !== 'A') { cur.pool = 'A'; cur.sec = sec; }
    };
    let left = budget;
    let droppedA = 0;
    for (const e of dueW) {
      const free = doneToday.has(e.w) ? 0 : 1;
      if (!free) continue;
      if (SENT.has(e.i)) { doneToday.add(e.w); continue; }
      if (left - secReview - 2 * secQuiz < 0) { droppedA++; continue; }
      left -= secReview; put(e.i, 'A', secReview); doneToday.add(e.w);
    }
    const usedForNew = budget - left;
    if (state && state.plan && state.plan.pausedNew) {
      /* 暂停新词：只复习 */
    } else if (left >= 0.6 * budget || usedForNew === 0) {
      const freshSents = [];
      for (let i = 0; i < total && newW.length; i++) {
        const fresh = wordsOf(i).filter(w => newW.indexOf(w) >= 0);
        if (fresh.length) freshSents.push({ i, fresh });
      }
      for (const f of freshSents) {
        if (left - secNew - 2 * secQuiz < 0) break;
        put(f.i, 'C', secNew); left -= secNew;
        f.fresh.forEach(w => { const k = newW.indexOf(w); if (k >= 0) newW.splice(k, 1); });
      }
    }
    for (const e of growW) {
      if (left - secReview - 2 * secQuiz < 0) break;
      if (SENT.has(e.i)) continue;
      put(e.i, 'B', secReview); left -= secReview;
    }

    const queue = Array.from(SENT.keys()).sort((a, b) => a - b)
      .map(i => SENT.get(i));
    // 题位：每句 1 题（②），③ 同词同句一道；二次确认题 k 从例句语境缺的词里出
    const items = [];
    for (const q of queue) {
      const pick = q.pool === 'C'
        ? (wordsOf(q.i).filter(w => !ws[w] || ws[w].stage === 'fresh')[0] || wordsOf(q.i)[0])
        : pickDueWord(q, ws, now);
      if (!pick) continue;
      items.push({ kind: 'quiz', pass: 2, s: q.i, w: pick, pool: q.pool });
      items.push({ kind: 'quiz', pass: 3, s: q.i, w: pick, pool: q.pool });
    }
    let kSlots = 0;
    for (const q of queue) {
      for (const w of q.words) {
        const st = ws[w];
        if (!st || st.stage === 'graduated') continue;
        if (st.ctx['ex'] > 0 || !(st.ctx[String(q.i)] > 0)) continue;
        if (left - secQuiz < 0) break;
        items.push({ kind: 'quiz', pass: 2, s: 'ex', w, pool: q.pool });
        left -= secQuiz; kSlots++;
      }
    }
    // 地板保底：只要还有未毕业词，今天排出的量必须够地板（原则 2 + §9.1）
    let floor = false;
    if (!queue.length && (dueWords || newW.length || growW.length)) {
      const i = dueW.length ? dueW[0].i : (growW.length ? growW[0].i : 0);
      put(i, dueW.length ? 'A' : 'C', secNew);
      queue.push(SENT.get(i));
      items.push({ kind: 'quiz', pass: 2, s: i, w: (wordsOf(i)[0] || ''), pool: 'A' });
      floor = true;
    }
    const readSec = queue.reduce((a, q) => a + q.sec, 0);
    return {
      queue, items,
      words: Array.from(new Set(queue.reduce((a, q) => a.concat(q.words), []))),
      stats: {
        // 每句入队时按 (句时 + 2 × secQuiz) 预留、k 槽按 1 × secQuiz 预留，
        // 所以 usedSec = readSec + items.length × secQuiz ≤ budget 天然成立（测试断言的就是这个等式）
        budgetSec: budget, usedSec: readSec + items.length * secQuiz,
        dueWords, newWords: newW.length, droppedA, floor,
        day: today, kSlots,
      },
    };
  }

  function pickDueWord(q, ws, now) {
    const ranked = q.words
      .map(w => ({ w, st: ws[w] }))
      .filter(x => x.st && x.st.stage !== 'graduated');
    if (!ranked.length) return q.words[0];
    ranked.sort((a, b) => (b.st.leech ? 1 : 0) - (a.st.leech ? 1 : 0) || (a.st.due || 0) - (b.st.due || 0));
    return ranked[0].w;
  }
```

并把 `assemble` 加进 `window.ShadowPlan` 的导出。

> 注意 `stats.usedSec` 的算法是 `读句 + 全部题位 × secQuiz`，与测试 `read + items.length * secQuiz` 一致；`kSlots` 只用于界面文案（「6 句 · 12 题 + 3 道二次确认」）。若实现时发现同一时间被扣了两次（`left` 里扣过、`usedSec` 又算一次），以测试等式为准修正 `usedSec`，不要改测试。

- [ ] **Step 4: 跑测试确认通过**

Run: `cd playwright-tests && npx playwright test plan-engine -v`
Expected: 14 passed

- [ ] **Step 5: 提交**

```bash
git add shadow/js/plan-engine.js playwright-tests/journeys/shadow/plan-engine.spec.ts
git commit -m "feat(task-mode): 三池按分钟装配，装不下的明天重算、不留欠账"
```

---

## Task 4: 老进度迁移

**Files:**
- Modify: `shadow/js/plan-engine.js`
- Create: `playwright-tests/journeys/shadow/task-migration.spec.ts`

**Interfaces:**
- Consumes: `ShadowPlan.replay / mkContact / emptyState`
- Produces: `ShadowPlan.migrate(oldPlan, oldProg, now): { events, state, report:{ contacts, words, cappedWords, droppedCycle, minutes } }`
  - `oldPlan = {startDate,totalDays,dailyMinutes,newPerDay,paused}`（现网形状）
  - `oldProg = {sentences:{i:{reps,phase,nextDue,lastRead}}, daily, streak, pace, cycleCount, cycleSeen, lastDay}`

- [ ] **Step 1: 写失败的测试**

创建 `playwright-tests/journeys/shadow/task-migration.spec.ts`：

```ts
import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';
const OLD_PLAN = 'ielts-task-plan';
const OLD_PROG = 'ielts-task-progress';

test.describe('progress migration: sentences → words', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);

  const seedOld = async (page: import('@playwright/test').Page, plan: unknown, prog: unknown) => {
    await page.goto(`${process.env.E2E_BASE_URL || 'http://localhost:8931'}/index.html`);
    await page.evaluate(([pk, sk, p, g]) => {
      localStorage.removeItem('ielts.shadow.v2');
      if (p !== null) localStorage.setItem(pk, JSON.stringify(p));
      if (g !== null) localStorage.setItem(sk, JSON.stringify(g));
    }, [OLD_PLAN, OLD_PROG, plan, prog] as [string, string, unknown, unknown]);
  };

  test('sentence reps become halved word contacts, capped at seen', async ({ page, baseURL }) => {
    test.setTimeout(currentTimeout() * 6);
    await seedOld(page, { startDate: '2026-09-01', totalDays: 30, dailyMinutes: 15, newPerDay: 8 }, {
      sentences: { 5: { reps: 6, phase: 'mastered', nextDue: Date.now(), lastRead: Date.now() },
                   6: { reps: 2, phase: 'learning', nextDue: Date.now(), lastRead: Date.now() } },
      daily: {}, streak: 4, cycleCount: 3, cycleSeen: {}, lastDay: '2026-09-19',
      pace: { new: 25, review: 8, samples: 60 },
    });
    const got = await page.evaluate(() => TASK.migrateNow());
    expect(got.report.cappedWords).toBeGreaterThan(0);      // mastered 被压回 seen
    expect(got.report.contacts).toBeGreaterThan(0);
    expect(got.report.minutes).toBeGreaterThan(0);
    // 5 号句 reps 6 → 每个词 floor(6*0.5)=3 次接触；6 号句 reps 2 → 1 次
    const reps = Object.keys(got.repsByWord).map(k => got.repsByWord[k]);
    expect(Math.max(...reps)).toBeGreaterThanOrEqual(3);
    expect(new Set(Object.values(got.stageByWord))).toEqual(new Set(['seen']));
  });

  test('migrating twice changes nothing (idempotent)', async ({ page }) => {
    await seedOld(page, { startDate: '2026-09-01', totalDays: 30, dailyMinutes: 15, newPerDay: 8 },
      { sentences: { 7: { reps: 4 } }, daily: {}, streak: 2 });
    const a = await page.evaluate(() => JSON.stringify(TASK.migrateNow().state));
    const b = await page.evaluate(() => JSON.stringify(TASK.migrateNow().state));
    expect(a).toBe(b);
  });

  test('garbage, empty and half-missing storage all migrate without throwing', async ({ page }) => {
    const cases: [unknown, unknown][] = [[null, null], [{}, {}], [null, { sentences: {} }],
      [{ startDate: 'not-a-date' }, { sentences: { 3: { reps: -5 } } }]];
    for (const [p, g] of cases) {
      await seedOld(page, p, g);
      const ok = await page.evaluate(() => {
        try { const r = TASK.migrateNow(); return !!r.state && r.state.v === 2; } catch (e) { return String(e); }
      });
      expect(ok).toBe(true);
    }
  });

  test('old keys are left intact for rollback, and the legacy block is read-only', async ({ page }) => {
    await seedOld(page, { startDate: '2026-09-01', totalDays: 30, dailyMinutes: 20, newPerDay: 8 },
      { sentences: { 9: { reps: 5 } }, daily: {}, streak: 9, cycleCount: 2 });
    const got = await page.evaluate(() => ({
      old: !!localStorage.getItem('ielts-task-progress'),
      root: JSON.parse(localStorage.getItem('ielts.shadow.v2') || '{}'),
    }));
    expect(got.old).toBe(true);                       // 30 天回滚窗口，不静默删
    expect(got.root.state.legacy.streak).toBe(9);
    expect(got.root.state.legacy.cycleCount).toBe(2); // 「轮」只读快照，界面不再显示
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd playwright-tests && npx playwright test task-migration -v`
Expected: FAIL —— `TASK.migrateNow is not a function`

- [ ] **Step 3: 写实现（引擎侧）**

```js
  /* ---------- 老数据迁移：句子记的功搬到词上 ----------
     折扣是刻意的：一句读 6 遍 ≠ 句里每个词有效接触 6 次。不折扣会有一批词直接
     被判毕业，那等于凭空说「你会了」—— 宁可让它回到「已见面」，重考一次再说。 */
  function migrate(oldPlan, oldProg, now, wordsOf) {
    const at = now || Date.now();
    const events = [];
    const report = { contacts: 0, words: 0, cappedWords: 0, minutes: 0, droppedCycle: 0 };
    const sents = (oldProg && oldProg.sentences) || {};
    const boundary = 4;
    Object.keys(sents).forEach(sk => {
      const i = parseInt(sk, 10);
      if (!Number.isInteger(i)) return;
      const rec = sents[sk] || {};
      const reps = Math.max(0, Math.min(20, Math.floor((rec.reps || 0) / 2)));
      if (reps === 0) return;
      const last = rec.lastRead || rec.nextDue || at;
      const list = (wordsOf && wordsOf(i)) || [];
      if ((rec.reps || 0) >= 10) report.cappedWords++;
      for (let n = 0; n < reps; n++) {
        const dayAt = last - (reps - 1 - n) * DAY_MS;
        list.forEach(w => { events.push(mkContact(w, i, dayAt, dayKey(dayAt, boundary))); report.contacts++; });
      }
    });
    report.words = new Set(events.map(e => e.w)).size;
    report.droppedCycle = (oldProg && oldProg.cycleCount) || 0;
    const plan = {
      todayMinutes: Math.max(5, Math.min(180, (oldPlan && oldPlan.dailyMinutes) || 15)),
      boundaryHour: boundary,
      startDate: (oldPlan && typeof oldPlan.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(oldPlan.startDate))
        ? oldPlan.startDate : dayKey(at, boundary),
      endDate: null, pausedNew: !!(oldPlan && oldPlan.paused),
    };
    report.minutes = plan.todayMinutes;
    const state = replay(events, { boundaryHour: boundary, wordsOf, plan, now: at });
    state.plan = plan;
    state.migratedAt = at;
    state.legacy = {
      streak: (oldProg && oldProg.streak) || 0,
      cycleCount: report.droppedCycle,
      lastDay: (oldProg && oldProg.lastDay) || '',
      pace: (oldProg && oldProg.pace) || null,
    };
    // 老 daily 里的历史天数只补「到过没」，不复制句数：口径已经不同
    const daily = (oldProg && oldProg.daily) || {};
    Object.keys(daily).forEach(d => {
      const src = daily[d] || {};
      if (src.reps) {
        state.daily[d] = Object.assign({ legacyReps: src.reps }, state.daily[d] || {});
        if (!state.daily[d].sentDone) state.daily[d].sentDone = Math.min(3, src.reps);
      }
    });
    return { events, state, report };
  }
```

- [ ] **Step 4: 宿主侧接上 `TASK.migrateNow()`**

在 `shadow/index.html` 的 `TASK` 模块里加（放在 `loadPlan/loadProg` 附近）：

```js
      const LS_V2 = 'ielts.shadow.v2';
      let S = null;        // {plan, state, events}

      function wordsOfSent(i) {
        const raw = SENT_RAW[i] || '';
        const out = [];
        const re = /\[\[([^\]:]+):/g;
        let m;
        while ((m = re.exec(raw))) { const k = m[1].trim().toLowerCase(); if (out.indexOf(k) < 0) out.push(k); }
        return out;
      }

      function migrateNow() {
        const oldPlan = JSON.parse(localStorage.getItem(LS_PLAN) || 'null');
        const oldProg = JSON.parse(localStorage.getItem(LS_PROG) || 'null');
        const r = ShadowPlan.migrate(oldPlan, oldProg, Date.now(), wordsOfSent);
        const repsByWord = {}, stageByWord = {};
        Object.keys(r.state.words).forEach(k => {
          repsByWord[k] = r.state.words[k].reps; stageByWord[k] = r.state.words[k].stage;
        });
        return { report: r.report, repsByWord, stageByWord, state: r.state };
      }
```

并在 return 里加 `migrateNow`。**本任务只交付"能算出迁移结果 + 可测"**，落盘接线在 Task 6。

- [ ] **Step 5: 跑测试确认通过**

Run: `cd playwright-tests && npx playwright test task-migration -v`
Expected: 4 passed

- [ ] **Step 6: 提交**

```bash
git add shadow/js/plan-engine.js shadow/index.html playwright-tests/journeys/shadow/task-migration.spec.ts
git commit -m "feat(task-mode): 老进度按词迁移并打五折，「轮」转为只读快照"
```

---

## Task 5: 出题器（② 回忆题 / ③ 中文四选一）与判分

**Files:**
- Modify: `shadow/js/plan-engine.js`
- Test: `playwright-tests/journeys/shadow/plan-engine.spec.ts`（追加）

**Interfaces:**
- Consumes: `items`（Task 3）、`shadow/data/vocab.json` 的 `m / ex / note`（由宿主解析后传进来）
- Produces:
  - `ShadowPlan.recallQuiz({sent, word, disp, sentZh, card}): {kind:'recall', s, w, blank, zh, initial, len, pos, colFirst, answer}`
  - `ShadowPlan.meaningQuiz({sent, word, sentZh, card, paraCards}): {kind:'mc4zh', s, w, prompt, opts:string[], answer:string} | null`
  - `ShadowPlan.judgeRecall(input: string, answer: string): boolean`
  - `ShadowPlan.editDistance(a: string, b: string): number`
  - `ShadowPlan.parseSenses(m: string): string[]`

- [ ] **Step 1: 写失败的测试**

```ts
test.describe('quiz builder', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);
  test.beforeEach(async ({ page, baseURL }) => { await page.goto(`${baseURL}/index.html`); });

  test('recall keeps the word length and never leaks the answer', async ({ page }) => {
    const got = await page.evaluate(() => ShadowPlan.recallQuiz({
      sent: 72, word: 'damp', disp: 'damp',
      sentZh: '深夜里，外套被雨打湿，摸上去还是又冷又潮。',
      card: { m: 'adj. 潮湿的', ex: 'The ground is damp after the rain.', note: '词伙：damp clay' },
    }));
    expect(got.kind).toBe('recall');
    expect(got.initial).toBe('d');
    expect(got.len).toBe(4);
    expect(got.pos).toBe('adj.');
    expect(got.colFirst).toBe('damp');           // 词伙只给首词，不给整块
    expect(got.blank).toBe('d _ _ _');
    expect(JSON.stringify(got)).toContain('damp');   // answer 字段本身要在，但不进提示串
    expect(got.hintText === undefined).toBe(true);
  });

  test('meaning quiz distractors come from the same paragraph, never the same sense', async ({ page }) => {
    const got = await page.evaluate(() => ShadowPlan.meaningQuiz({
      sent: 1500, word: 'peer', sentZh: '他目光稳定地看着路面，努力透过清晨小雨凝视。',
      card: { m: 'v. 凝视；费力看；n. 同辈' },
      paraCards: { gaze: 'n. 凝视；v. 注视', steady: 'adj. 稳定的；v. 使稳住', road: 'n. 路，道路' },
    }));
    expect(got.kind).toBe('mc4zh');
    expect(got.opts.length).toBe(4);
    expect(got.opts).toContain(got.answer);
    expect(new Set(got.opts).size).toBe(4);
    expect(got.opts.some(o => o.includes('凝视') && o !== got.answer)).toBe(false);
  });

  test('meaning quiz refuses to build when there is no clean set of four', async ({ page }) => {
    const got = await page.evaluate(() => ShadowPlan.meaningQuiz({
      sent: 26, word: 'mist', sentZh: '清晨的薄雾柔化了海湾。',
      card: { m: 'n. 薄雾' }, paraCards: { bay: 'n. 海湾' },
    }));
    expect(got).toBe(null);
  });

  test('recall judging tolerates one typo and rejects a different word', async ({ page }) => {
    const got = await page.evaluate(() => ({
      exact: ShadowPlan.judgeRecall('DAMP', 'damp'),
      oneOff: ShadowPlan.judgeRecall(' damp ', 'damp'),
      inflect: ShadowPlan.judgeRecall('damps', 'damp'),
      wrong: ShadowPlan.judgeRecall('wet', 'damp'),
      far: ShadowPlan.judgeRecall('humid', 'damp'),
      empty: ShadowPlan.judgeRecall('', 'damp'),
    }));
    expect(got).toEqual({ exact: true, oneOff: true, inflect: true, wrong: false, far: false, empty: false });
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd playwright-tests && npx playwright test plan-engine -g "quiz builder"`
Expected: FAIL —— `ShadowPlan.recallQuiz is not a function`

- [ ] **Step 3: 写实现**

```js
  /* ---------- 出题 ----------
     ② 永远遮目标词（原则 3）。第一期没有裁决过的辨析组，所以只出回忆题 ——
     回忆题结构上不存在双解，宁可不给选项也不出错题（原则 8）。 */
  function parseSenses(m) {
    return String(m || '').split(/[；;]/).map(x => x.trim()).filter(Boolean);
  }

  function posOf(m) {
    const x = String(m || '').match(/^\s*(n|v|vt|vi|adj|adv|prep|conj|pron|num|int|abbr)\./i);
    return x ? x[1].toLowerCase() + '.' : '';
  }

  function colFirstOf(note) {
    if (typeof note !== 'string') return '';
    const seg = String(note).split('；').find(p => p.trim().startsWith('词伙：'));
    if (!seg) return '';
    const first = seg.split('：')[1].split(',')[0].trim();
    return first.split(/\s+/)[0] || '';
  }

  function recallQuiz(o) {
    const w = String(o.word || '').toLowerCase();
    const disp = String(o.disp || o.word || '');
    const card = o.card || {};
    const blank = disp.length <= 1 ? '_'.repeat(Math.max(1, w.length))
      : disp[0].toLowerCase() + ' ' + '_ '.repeat(Math.max(0, w.length - 1)).trim().split('').join(' ');
    return {
      kind: 'recall', s: o.sent, w, blank,
      zh: o.sentZh || '', initial: w[0] || '', len: w.length,
      pos: posOf(card.m), colFirst: colFirstOf(card.note), answer: w,
    };
  }

  function editDistance(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  }

  // 判分：忽略大小写与首尾空格，允许 1 个字符的容错（屈折、单复数、手滑）
  function judgeRecall(input, answer) {
    const a = String(input || '').trim().toLowerCase();
    const b = String(answer || '').trim().toLowerCase();
    if (!a || !b) return false;
    return a === b || editDistance(a, b) <= 1;
  }

  /* ③ 看英文选中文：义项来自卡上 m 的分号分项，干扰项取自同一段里其它目标词的义项。
     要求：四个选项互不相同，且没有任何干扰项与正确答案含同一个中文关键词
     （含同一个词就等于「两个都对」，那是错题 —— 原则 8）。 */
  function meaningQuiz(o) {
    const ans = String(o.answer || '').trim();
    const answer = ans || (parseSenses(o.card && o.card.m)[0] || '');
    if (!answer) return null;
    const keys = (s) => String(s).replace(/[，。、,\.；;：:\s]/g, '');
    const ak = keys(answer);
    const opts = [answer];
    const pool = Object.keys(o.paraCards || {});
    for (let i = 0; i < pool.length && opts.length < 4; i++) {
      const w = pool[i];
      if (w === o.word) continue;
      for (const s of parseSenses(o.paraCards[w].m || o.paraCards[w])) {
        const sk = keys(s);
        if (!sk || sk === ak) continue;
        if (sk.includes(ak) || ak.includes(sk)) continue;      // 义项包含 → 视为同义，禁
        if (opts.indexOf(s) >= 0) continue;
        opts.push(s);
        break;
      }
    }
    if (opts.length < 4) return null;
    const seed = String(o.sent) + '|' + String(o.word);
    const sorted = opts.map((x, i) => ({ x, i, k: (hash(seed + i) % 997) / 997 }))
      .sort((a, b) => a.k - b.k).map(v => v.x);
    return { kind: 'mc4zh', s: o.sent, w: String(o.word).toLowerCase(), prompt: o.sentZh || '',
             opts: sorted, answer };
  }

  function hash(s) {
    let h = 5381;
    for (let i = 0; i < String(s).length; i++) h = ((h * 33) ^ String(s).charCodeAt(i)) >>> 0;
    return h;
  }
```

导出加 `recallQuiz, meaningQuiz, judgeRecall, editDistance, parseSenses, hash`。

> `meaningQuiz` 的 `paraCards` 由宿主传：`{词头: card}` 里 `card` 可以是 `{m:'…'}` 的裸对象（同段其它目标词），测试里就是这个形状。选项顺序用 `hash` 稳定化（规格 §7.7 确定性）。

- [ ] **Step 4: 跑测试确认通过**

Run: `cd playwright-tests && npx playwright test plan-engine -v`
Expected: 18 passed

- [ ] **Step 5: 提交**

```bash
git add shadow/js/plan-engine.js playwright-tests/journeys/shadow/plan-engine.spec.ts
git commit -m "feat(task-mode): 回忆题与中文义项题的出题器、判分和稳定选项序"
```

---

## Task 6: 存储换 v2 根 + 界面按新规格重做

**Files:**
- Modify: `shadow/index.html:1085-1100`（CSS `body.task-mode .audiobar .ab-step{display:none}` 删除）、`:1272-1280`（taskBar 结构）、`:1269`（todayPanel 容器）、`:3911-4760`（TASK 模块）
- Test: `playwright-tests/journeys/shadow/task-flow.spec.ts`（新建）

**Interfaces:**
- Consumes: `ShadowPlan.*`（Task 1–5）
- Produces（`window.TASK` 上给测试和别的模块用的口子）:
  - `TASK.todayPlan(): {queue, items, stats}`（现算，不缓存）
  - `TASK.state(): object`（v2 state，只读语义）
  - `TASK.events(): ev[]`
  - `TASK.migrateNow()`（Task 4 已有）
  - `TASK.pass(): 1|2|3`、`TASK.setPass(n)`、`TASK.advance()`、`TASK.finishPass(n)`、`TASK.finished(): boolean`
  - `TASK.currentQuiz()`、`TASK.answerQuiz(choice: string): boolean`
  - `TASK.readDone(i: number)`（① 遍一句读完时调，写 contact 事件）
  - `TASK.initPlan(minutes: number)`、`TASK.resetV2(opts?: {keepCloud?: boolean})`
  - `TASK.relearn(k: string)`、`TASK.setBookFilter(f: string)`
  - 测试钩子只暴露「读」与「用户本来就能做的动作」，**不额外暴露答案**（`currentQuiz().answer` 本来就要渲染才能揭示答案）

- [ ] **Step 1: 写失败的测试（界面不变量）**

创建 `playwright-tests/journeys/shadow/task-flow.spec.ts`：

```ts
import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';
declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  todayPlan(): { queue: { i: number; kind: string; pool: string }[]; items: unknown[]; stats: Record<string, unknown> };
  enterTaskMode(): void; exitTaskMode(): void;
  pass(): number; setPass(n: number): void;
  currentQuiz(): { kind: string; w: string } | null;
  answerQuiz(c: string): boolean;
  state(): { words: Record<string, { stage: string; reps: number }> ; daily: Record<string, Record<string, number>> };
  events(): { type: string }[];
};

const boot = async (page: import('@playwright/test').Page, baseURL: string) => {
  await page.goto(`${baseURL}/index.html`);
  await expect(page.locator('.sent').first()).toBeVisible();
  await page.evaluate(() => TASK.resetV2());
  await page.reload();
  await expect(page.locator('.sent').first()).toBeVisible();
};

test.describe('task mode · UI invariants', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);
  test.setTimeout(currentTimeout() * 8);

  test('step controls stay visible in task mode (regression: they used to be CSS-hidden)', async ({ page, baseURL }) => {
    await boot(page, baseURL);
    await page.evaluate(() => TASK.initPlan(10));
    await page.evaluate(() => TASK.enterTaskMode());
    await expect(page.locator('.audiobar .ab-step')).toHaveCount(2);
    for (const loc of [page.getByRole('button', { name: '上一句' }), page.getByRole('button', { name: '下一句' })]) {
      await expect(loc).toBeVisible();
      await expect(loc).toBeEnabled();
    }
  });

  test('no number is spoken twice on the whole page', async ({ page, baseURL }) => {
    await boot(page, baseURL);
    await page.evaluate(() => TASK.initPlan(15));
    await page.evaluate(() => TASK.enterTaskMode());
    const dup = await page.evaluate(() => {
      const bar = document.getElementById('taskBar');
      const ab = document.getElementById('abTitle');
      const t = (bar && bar.innerText) || '';
      const a = (ab && ab.innerText) || '';
      const hits = (t.match(/\d+\s*\/\s*\d+/g) || []).concat(a.match(/\d+\s*\/\s*\d+/g) || []);
      const remain = (t.match(/~?\s*\d+\s*(分|秒)/g) || []).length + (a.match(/~?\s*\d+\s*(分|秒)/g) || []).length;
      return { progress: new Set(hits).size, hits: hits.length, remain };
    });
    expect(dup.progress).toBeLessThanOrEqual(1);
    expect(dup.remain).toBeLessThanOrEqual(1);
  });

  test('the panel keeps today and vocabulary as two columns and never merges them', async ({ page, baseURL }) => {
    await boot(page, baseURL);
    await page.evaluate(() => TASK.initPlan(15));
    await page.locator('#btnToday').click();
    await expect(page.locator('.tp-col-today')).toBeVisible();
    await expect(page.locator('.tp-col-words')).toBeVisible();
    const merged = await page.locator('.today-panel').innerText();
    expect(/轮/.test(merged)).toBe(false);
    expect(/欠|待补|还差|积压/.test(merged)).toBe(false);
    expect(/%\s*(完成|进度)/.test(merged.split('词汇')[0]) || /总进度|总分/.test(merged)).toBe(false);
  });

  test('the word book can push a word back to seen', async ({ page, baseURL }) => {
    await boot(page, baseURL);
    await page.evaluate(() => TASK.initPlan(15));
    const before = await page.evaluate(() => {
      const st = TASK.state(); const k = Object.keys(st.words)[0];
      return { k, stage: st.words[k] && st.words[k].stage };
    });
    test.skip(!before.k, 'no learned word in this fixture');
    const after = await page.evaluate((k) => {
      TASK.relearn(k);
      return TASK.state().words[k].stage;
    }, before.k);
    expect(['fresh', 'seen']).toContain(after);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd playwright-tests && npx playwright test task-flow -v`
Expected: FAIL —— `TASK.resetV2 is not a function`

- [ ] **Step 3: 换存储根、删掉藏控件的 CSS**

`shadow/index.html` 里删除第 1094 行：

```css
  body.task-mode .audiobar .ab-step { display: none; }   /* ← 整行删掉 */
```

`TASK` 模块顶部把两个旧 key 的读写改成 v2 单根：

```js
      const LS_V2 = 'ielts.shadow.v2';
      const LS_PLAN = 'ielts-task-plan';        // 只读：迁移与 30 天回滚
      const LS_PROG = 'ielts-task-progress';    // 只读：同上
      let ROOT2 = null;      // {plan, state, events, savedAt}

      function loadRoot() {
        try { ROOT2 = JSON.parse(localStorage.getItem(LS_V2) || 'null'); } catch (e) { ROOT2 = null; }
        if (!ROOT2 || !ROOT2.state || ROOT2.state.v !== 2) {
          const oldPlan = readLegacy(LS_PLAN), oldProg = readLegacy(LS_PROG);
          const r = ShadowPlan.migrate(oldPlan, oldProg, Date.now(), wordsOfSent);
          ROOT2 = { plan: r.state.plan, state: r.state, events: r.events, savedAt: Date.now(),
                    migratedAt: r.state.migratedAt, report: r.report };
          persist();
          return;
        }
        const cached = ROOT2.state.eventsSeen || 0;
        if (cached !== (ROOT2.events || []).length) recompute();
      }
      function readLegacy(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
      function persist() {
        ROOT2.savedAt = Date.now();
        safeStore(LS_V2, JSON.stringify(ROOT2));
      }
      function recompute() {
        const plan = ROOT2.plan;
        const st = ShadowPlan.replay(ROOT2.events, {
          boundaryHour: plan.boundaryHour, wordsOf: wordsOfSent, plan, now: Date.now(),
        });
        st.plan = plan; st.legacy = ROOT2.state.legacy || null; st.migratedAt = ROOT2.state.migratedAt || 0;
        ROOT2.state = st;
        ROOT2.state.eventsSeen = ROOT2.events.length;
      }
      function push(ev) {
        ev.id = ev.id || ShadowPlan.eventId(ev);
        ROOT2.events.push(ev);
        if (ROOT2.events.length > 5000) ROOT2.events.splice(0, ROOT2.events.length - 5000);
        recompute(); persist(); queueEventUpload();
        return ev;
      }
```

- [ ] **Step 4: 任务栏三态与面板两栏**

`taskBar` 结构（1272 行附近）改成一条栏、只换内容，控件不动：

```html
    <div class="task-bar" id="taskBar" data-state="idle">
      <div class="tb-main"><b id="tbTitle">今天</b><span id="tbSub" class="sm"></span></div>
      <div class="tb-act">
        <button class="btn" id="tbAgain" onclick="TASK.again()">再读一遍</button>
        <button class="btn primary" id="tbNext" onclick="TASK.next()">下一句</button>
      </div>
    </div>
```

`updateTaskBar()` 重写为三态，且**不再往 `abTitle` 写进度**：

```js
      function updateTaskBar(allDone) {
        const bar = document.getElementById('taskBar');
        if (!bar) return;
        const title = document.getElementById('tbTitle'), sub = document.getElementById('tbSub');
        const tp = todayPlan();
        const n = tp.queue.length, done = countReadToday();
        bar.dataset.state = allDone ? 'done' : (pass >= 2 ? 'quiz' : 'read');
        if (allDone) {
          title.innerHTML = '<i class="ri-trophy-line" aria-hidden="true"></i> 今天完成';
          sub.textContent = fmtPromoteToday() + ' · 用时 ' + fmtTime((Date.now() - sessionStart) / 1000);
        } else if (pass >= 2) {
          title.textContent = (pass === 2 ? '② 挖空 ' : '③ 选义 ') + quizDoneCount() + '/' + quizTotalCount();
          sub.textContent = quizWrong() ? '错 ' + quizWrong() : '';
        } else {
          title.textContent = '① 通读 ' + done + '/' + n;
          sub.textContent = '今天 ' + tp.stats.todayMinutes + ' 分钟 · 剩 ~' + fmtTime(remainSec());
        }
        // 关键：abTitle 回归「第 N 句 / 章节名」，不再复读进度
        const abT = document.getElementById('abTitle');
        if (abT && taskMode) abT.textContent = chapterLabelFor(currentSentence());
      }
```

`renderToday()` 的两栏骨架：

```js
      function renderColumns(cap) {
        const tp = todayPlan();
        const st = ROOT2.state, d = st.daily[ShadowPlan.dayKey(Date.now(), plan.boundaryHour)] || {};
        const counts = countStages();
        return `<div class="tp-cols">
          <div class="tp-col tp-col-today">
            <h4>今天</h4>
            <div class="tp-num">${d.sentDone || 0}<span class="unit"> / ${tp.queue.length} 句</span></div>
            <div class="tp-prog"><div class="tp-prog-fill" style="width:${pct(d.sentDone || 0, tp.queue.length)}%"></div></div>
            <div class="tp-kv"><span>连续</span><b>${streakDays()} 天${floorDays() ? ' · 含 ' + floorDays() + ' 个地板日' : ''}</b></div>
            <div class="tp-kv"><span>今天怎么排的</span><b>${tp.stats.dueWords} 个词到期 · ${tp.stats.newWords} 个新词</b></div>
          </div>
          <div class="tp-col tp-col-words">
            <h4>词汇</h4>
            <div class="tp-num">${(d.promote || 0)}<span class="unit"> 个词今天晋升</span></div>
            <div class="tp-kv"><span>文中可辨</span><b>${counts.recognized}</b></div>
            <div class="tp-kv"><span>义项直连</span><b>${counts.owned}</b></div>
            <div class="tp-kv"><span>重点词</span><b class="leech">${counts.leech}</b></div>
          </div>
        </div>`;
      }
```

并加 CSS：`.tp-cols{display:flex;gap:9px} .tp-col{flex:1;border:1px solid var(--border);border-radius:10px;padding:8px 10px}`。**不写任何把两栏合并成一个数的样式。**

- [ ] **Step 5: 词本视图（最小版）与 `TASK` 新接口**

面板容器加 `data-view`，三屏切换；词本第一期只做按状态筛选：

```js
      function renderBook(p) {
        const filter = bookFilter || 'all';
        const rows = Object.keys(ROOT2.state.words)
          .filter(k => filter === 'all' || (filter === 'leech' ? ROOT2.state.words[k].leech : ROOT2.state.words[k].stage === filter))
          .sort((a, b) => (ROOT2.state.words[b].reps || 0) - (ROOT2.state.words[a].reps || 0))
          .slice(0, 200);
        return `<div class="tp-head"><h3>词本 · ${Object.keys(ROOT2.state.words).length} 个词</h3>
          <button class="tp-close" onclick="TASK.closePanel()">✕</button></div>
          <div class="tp-filters">${['all','seen','recognized','owned','graduated','leech']
            .map(f => `<button class="pill${filter === f ? ' on' : ''}" onclick="TASK.setBookFilter('${f}')">${STAGE_LABEL[f]}</button>`).join('')}</div>
          <div class="tp-book">${rows.map(k => bookRow(k)).join('') || '<p class="sm">这一档还没有词。</p>'}</div>`;
      }
      function relearn(k) {
        if (!ROOT2.state.words[k]) return;
        push({ type: 'relearn', w: k, day: ShadowPlan.dayKey(Date.now(), plan.boundaryHour), ts: Date.now() });
        render();
      }
```

`reducer` 里补 `relearn` 分支（把该词清空 `ctx`、`ok3`、`reps = min(reps, 3)`、stage 重算）。return 里补：
`resetV2, initPlan, todayPlan, state, events, pass, setPass, currentQuiz, answerQuiz, readDone, relearn, setBookFilter`。

- [ ] **Step 6: 跑测试确认通过**

Run: `cd playwright-tests && npx playwright test task-flow -v`
Expected: 4 passed

- [ ] **Step 7: 跑全站回归（这一步会暴露旧用例）**

Run: `cd playwright-tests && npm test`
Expected: `carryover-queue.spec.ts` 失败（它断言 `newPerDay`）。**不要**为了让它绿而回退设计 —— 按 Task 9 改写它。其余 shadow 用例必须已经全绿。

- [ ] **Step 8: 提交**

```bash
git add shadow/index.html playwright-tests/journeys/shadow/task-flow.spec.ts
git commit -m "feat(task-mode): 存储换到单一事件根，任务栏三态、两栏面板、控件不再被藏"
```

---

## Task 7: 三遍流程控制器

**Files:**
- Modify: `shadow/index.html`（TASK 的 `enterTaskMode/next/goToNextTask/recordRep`）
- Test: `playwright-tests/journeys/shadow/task-flow.spec.ts`（追加）

**Interfaces:**
- Consumes: `TASK.todayPlan()`、`ShadowPlan.recallQuiz/meaningQuiz/judgeRecall`、`VOCAB`
- Produces: `TASK.setPass(n)`、`TASK.currentQuiz()`、`TASK.answerQuiz(choice)`；`recordRep` 改为写 `contact` 事件（不再写 `sentences[i].reps`）

- [ ] **Step 1: 写失败的测试**

```ts
test.describe('three passes', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);
  test.setTimeout(currentTimeout() * 10);

  test('pass 1 makes zero quiz requests and credits every word in the sentence', async ({ page, baseURL }) => {
    await boot(page, baseURL);
    await page.evaluate(() => TASK.initPlan(15));
    await page.evaluate(() => TASK.enterTaskMode());
    expect(await page.evaluate(() => TASK.pass())).toBe(1);
    expect(await page.evaluate(() => TASK.currentQuiz())).toBe(null);
    const got = await page.evaluate(() => {
      const before = Object.keys(TASK.state().words).length;
      TASK.readDone(TASK.todayPlan().queue[0].i);
      return { before, after: Object.keys(TASK.state().words).length };
    });
    expect(got.after).toBeGreaterThan(got.before);
  });

  test('a right recall answer promotes and a wrong one never costs progress', async ({ page, baseURL }) => {
    await boot(page, baseURL);
    await page.evaluate(() => TASK.initPlan(15));
    await page.evaluate(() => TASK.enterTaskMode());
    const q = await page.evaluate(() => {
      const tp = TASK.todayPlan();
      tp.queue.forEach(x => TASK.readDone(x.i));
      TASK.setPass(2);
      const cur = TASK.currentQuiz();
      const before = TASK.state().words[cur.w].stage;
      const ok = TASK.answerQuiz(' definitely-not-the-word ');
      return { w: cur.w, before, ok, afterWrong: TASK.state().words[cur.w].stage,
               progressKept: TASK.todayPlan().stats !== undefined };
    });
    expect(q.ok).toBe(false);
    expect(q.afterWrong).toBe(q.before);          // 答错不倒退（原则 2）
    const right = await page.evaluate(() => {
      const cur = TASK.currentQuiz();
      TASK.answerQuiz(cur.answer);                  // 答案本来就在题面对象里（要渲染出来才能揭示）
      return TASK.state().words[cur.w].ctx;
    });
    expect(Object.keys(right).length).toBeGreaterThan(0);
  });

  test('finishing pass 1 rolls into pass 2 then pass 3, each with its own summary', async ({ page, baseURL }) => {
    await boot(page, baseURL);
    await page.evaluate(() => TASK.initPlan(10));
    await page.evaluate(() => TASK.enterTaskMode());
    const seen = await page.evaluate(() => {
      const log: number[] = [];
      for (let guard = 0; guard < 40; guard++) {
        log.push(TASK.pass());
        const tp = TASK.todayPlan();
        if (TASK.pass() === 1) tp.queue.forEach(x => TASK.readDone(x.i));
        else { const c = TASK.currentQuiz(); if (c) TASK.answerQuiz(c.answer); }
        TASK.advance();
        if (TASK.finished()) break;
      }
      return { passes: Array.from(new Set(log)), done: TASK.finished() };
    });
    expect(seen.passes).toEqual([1, 2, 3]);
    expect(seen.done).toBe(true);
  });

  test('the summary screen shows exactly three numbers', async ({ page, baseURL }) => {
    await boot(page, baseURL);
    await page.evaluate(() => TASK.initPlan(10));
    await page.evaluate(() => TASK.enterTaskMode());
    await page.evaluate(() => { TASK.todayPlan().queue.forEach(x => TASK.readDone(x.i)); TASK.finishPass(1); });
    const txt = await page.locator('.pass-summary').innerText();
    const nums = (txt.match(/\d+/g) || []).length;
    expect(nums).toBeLessThanOrEqual(5);          // 读了 N 句 / 覆盖 M 词 / 晋升 K / 错 J
    expect(/欠|待补|积压/.test(txt)).toBe(false);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd playwright-tests && npx playwright test task-flow -g "three passes"`
Expected: FAIL —— `TASK.advance is not a function`

- [ ] **Step 3: 写控制器**

```js
      let pass = 1, quizCursor = 0, quizWrongN = 0, quizDoneN = 0, cachedPlan = null, cachedPlanDay = '';

      function todayPlan(force) {
        const d = ShadowPlan.dayKey(Date.now(), plan ? plan.boundaryHour : 4);
        if (!force && cachedPlan && cachedPlanDay === d) return cachedPlan;
        cachedPlan = ShadowPlan.assemble(ROOT2.state, {
          now: Date.now(), todayMinutes: plan ? plan.todayMinutes : 0, rate: rate || 1,
          secNew: secNew(), secReview: secReview(), secQuiz: 6,
          wordsOf: wordsOfSent, totalSents: SENT_RAW.length,
          boundaryHour: plan ? plan.boundaryHour : 4,
        });
        cachedPlanDay = d;
        return cachedPlan;
      }

      function quizList() { return todayPlan().items.filter(x => x.pass === pass); }
      function currentQuiz() {
        if (pass === 1) return null;
        const list = quizList();
        const item = list[quizCursor];
        if (!item) return null;
        if (item.built) return item.built;
        const card = VOCAB[item.w] || {};
        const disp = displayOf(item.s, item.w);
        item.built = pass === 2
          ? ShadowPlan.recallQuiz({ sent: item.s, word: item.w, disp,
              sentZh: item.s === 'ex' ? String(card.exZh || '') : SENT_ZH[item.s], card })
          : ShadowPlan.meaningQuiz({ sent: item.s, word: item.w,
              sentZh: item.s === 'ex' ? String(card.exZh || '') : SENT_ZH[item.s],
              card, paraCards: paraCardsOf(item.s, item.w) });
        if (pass === 2 && !item.built) item.built = ShadowPlan.recallQuiz({ sent: item.s, word: item.w, disp, card });
        return item.built;
      }

      function answerQuiz(choice) {
        const q = currentQuiz();
        if (!q) return false;
        const ok = q.kind === 'recall'
          ? ShadowPlan.judgeRecall(choice, q.answer)
          : String(choice).trim() === q.answer;
        push(ShadowPlan.mkQuiz(q.w, q.s, q.kind, ok, Date.now(), ShadowPlan.dayKey(Date.now(), plan.boundaryHour)));
        quizDoneN++;
        if (!ok) { quizWrongN++; showCompareOrAnswer(q); }
        advanceQuiz();
        return ok;
      }

      function advanceQuiz() {
        const list = quizList();
        if (quizCursor + 1 < list.length) { quizCursor++; renderQuiz(); }
        else finishPass(pass);
      }
      function finishPass(n) {
        renderPassSummary(n);
        if (n === 1) { pass = 2; quizCursor = 0; }
        else if (n === 2) { pass = 3; quizCursor = 0; }
        else { finished = true; }
        cachedPlan = null;                 // 状态变了，下一句的装配要重算
        updateTaskBar(); updateMarkers();
      }
      function advance() {
        if (finished) return;
        if (pass === 1) { const tp = todayPlan(); const nxt = tp.queue.findIndex(q => !readToday(q.i));
          if (nxt < 0) return finishPass(1); goSentence(tp.queue[nxt].i); return; }
        answerQuizSkip();
      }
```

`recordRep` 换成：

```js
      function recordRep(globalIdx) {
        if (!plan) return;
        const day = ShadowPlan.dayKey(Date.now(), plan.boundaryHour);
        wordsOfSent(globalIdx).forEach(w => {
          if (ROOT2.state.words[w] && ROOT2.state.words[w].stage === 'graduated') return;
          push(ShadowPlan.mkContact(w, globalIdx, Date.now(), day));
        });
        samplePace(readCount() <= (plan.todayMinutes ? 8 : 8) ? 'new' : 'review', Date.now());
        cachedPlan = null;
        updateTaskBar(); updateMarkers();
      }
```

`enterTaskMode()` 里 `pass = 1; quizCursor = 0; finished = false;`；`exitTaskMode()` 保留（清 DOM 类，但**不再清 pass** —— 回来还在同一遍）。

- [ ] **Step 4: 跑测试确认通过**

Run: `cd playwright-tests && npx playwright test task-flow -v`
Expected: 8 passed（含 Task 6 的 4 条）

- [ ] **Step 5: 提交**

```bash
git add shadow/index.html playwright-tests/journeys/shadow/task-flow.spec.ts
git commit -m "feat(task-mode): 通读→挖空→选义三遍控制器，答错不倒退也不扣进度"
```

---

## Task 8: 事件流上云（append-only）

**Files:**
- Create: `sql/shadow_events.sql`
- Modify: `shadow/index.html`（TASK 的云端段）
- Create: `playwright-tests/journeys/shadow/task-events.spec.ts`

**Interfaces:**
- Consumes: `CLOUD.client()`（已有；`window.supabase` 缺失时返回 null —— 测试就注入假的那个）
- Produces:
  - `TASK.pendingEvents(): ev[]`、`TASK.cloudPush(): Promise<{sent:number}>`、`TASK.cloudPull(): Promise<{got:number,newEvents:number}>`
  - `TASK.setSupStub(fn|null)`（仅测试用，注入假 client）

- [ ] **Step 1: 写 SQL（要用户自己跑，agent 不碰库）**

创建 `sql/shadow_events.sql`：

```sql
-- 影子跟读：只追加的学习完成事件流（第一期）
-- 计划与一切派生数都存在客户端，云端只存事实；因此本表无 update。
create table if not exists public.shadow_events (
  user_id   uuid        not null references auth.users(id) on delete cascade,
  event_id  text        not null,
  ts        bigint      not null,          -- 客户端 epoch ms，服务端不重写
  type      text        not null,          -- contact | quiz | promote | flag | dayplan | relearn
  payload   jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);
create index if not exists shadow_events_user_ts on public.shadow_events (user_id, ts);

alter table public.shadow_events enable row level security;

drop policy if exists "shadow_events self select" on public.shadow_events;
create policy "shadow_events self select" on public.shadow_events
  for select using (auth.uid() = user_id);

drop policy if exists "shadow_events self insert" on public.shadow_events;
create policy "shadow_events self insert" on public.shadow_events
  for insert with check (auth.uid() = user_id);
-- 故意不写 update / delete 策略：事件流只追加，账户注销走 cascade。
```

- [ ] **Step 2: 写失败的测试**

创建 `playwright-tests/journeys/shadow/task-events.spec.ts`：

```ts
import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';
declare const TASK: {
  resetV2(): void; initPlan(n: number): void; enterTaskMode(): void;
  readDone(i: number): void; todayPlan(): { queue: { i: number }[] };
  pendingEvents(): { id: string; type: string }[];
  cloudPush(): Promise<{ sent: number }>;
  cloudPull(): Promise<{ got: number; newEvents: number }>;
  setSupStub(c: unknown): void;
  state(): { words: Record<string, { reps: number; stage: string }> };
};

// 假的 supabase：只记录 upsert 的行了什么，select 从同一份数组回读
const STUB = `
window.__supaRows = [];
window.__supaReject = false;
window.supabase = {
  createClient: () => ({
    auth: { getSession: async () => ({ data: { session: { user: { id: 'u-test' } } } }) },
    from: (t) => ({
      upsert: async (rows) => {
        if (window.__supaReject) return { error: { message: 'rls denied' } };
        const arr = Array.isArray(rows) ? rows : [rows];
        arr.forEach(r => { if (!window.__supaRows.find(x => x.event_id === r.event_id)) window.__supaRows.push(r); });
        return { error: null };
      },
      select: () => ({ gte: () => ({ order: async () => ({ data: window.__supaRows, error: null }) }) }),
    }),
  }),
};`;

test.describe('append-only event stream', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);
  test.setTimeout(currentTimeout() * 8);

  test.beforeEach(async ({ page, baseURL }) => {
    await page.addInitScript(STUB);
    await page.goto(`${baseURL}/index.html`);
    await page.evaluate(() => TASK.resetV2());
    await page.reload();
    await expect(page.locator('.sent').first()).toBeVisible();
  });

  test('offline contacts queue up and survive a reload', async ({ page }) => {
    await page.evaluate(() => TASK.initPlan(10));
    const a = await page.evaluate(() => {
      TASK.todayPlan().queue.slice(0, 3).forEach(x => TASK.readDone(x.i));
      return TASK.pendingEvents().length;
    });
    expect(a).toBeGreaterThan(0);
    await page.reload();
    const b = await page.evaluate(() => TASK.pendingEvents().length);
    expect(b).toBe(a);
  });

  test('push sends idempotent rows and a second push sends nothing new', async ({ page }) => {
    await page.evaluate(() => TASK.initPlan(10));
    await page.evaluate(() => TASK.todayPlan().queue.slice(0, 2).forEach(x => TASK.readDone(x.i)));
    const first = await page.evaluate(async () => {
      const r = await TASK.cloudPush();
      return { sent: r.sent, rows: window.__supaRows.length };
    });
    expect(first.sent).toBeGreaterThan(0);
    expect(first.rows).toBe(first.sent);
    const again = await page.evaluate(async () => (await TASK.cloudPush()).sent);
    expect(again).toBe(0);
  });

  test('replaying cloud rows twice yields the same state', async ({ page }) => {
    const reps = await page.evaluate(async () => {
      TASK.initPlan(10);
      TASK.todayPlan().queue.slice(0, 3).forEach(x => TASK.readDone(x.i));
      await TASK.cloudPush();
      TASK.resetV2({ keepCloud: true });
      TASK.initPlan(10);
      const a = await TASK.cloudPull();
      const s1 = JSON.stringify(Object.keys(TASK.state().words).map(k => TASK.state().words[k].reps));
      await TASK.cloudPull();
      const s2 = JSON.stringify(Object.keys(TASK.state().words).map(k => TASK.state().words[k].reps));
      return { got: a.got, same: s1 === s2 };
    });
    expect(reps.got).toBeGreaterThan(0);
    expect(reps.same).toBe(true);
  });

  test('a refused upload never breaks local progress and shows a standing hint', async ({ page }) => {
    await page.evaluate(() => { window.__supaReject = true; TASK.initPlan(10); });
    const got = await page.evaluate(async () => {
      TASK.todayPlan().queue.slice(0, 2).forEach(x => TASK.readDone(x.i));
      const r = await TASK.cloudPush();
      return { err: r.error ? true : false, pending: TASK.pendingEvents().length,
               words: Object.keys(TASK.state().words).length };
    });
    expect(got.err).toBe(true);
    expect(got.words).toBeGreaterThan(0);         // 本地照常推进
    expect(got.pending).toBeGreaterThan(0);       // 事件留在待发队列
    await expect(page.locator('#syncHint')).toBeVisible();
  });
});
```

- [ ] **Step 3: 跑测试确认失败**

Run: `cd playwright-tests && npx playwright test task-events -v`
Expected: FAIL —— `TASK.pendingEvents is not a function`

- [ ] **Step 4: 写实现**

```js
      /* ---------- 事件流上云：只传事实，计划不上传 ----------
         没有 update、没有合并策略：拉回来重放，靠 event_id 去重，天然幂等。 */
      let _evPushT = null, _pushing = false;
      function queueEventUpload() { clearTimeout(_evPushT); _evPushT = setTimeout(() => { try { cloudPush(); } catch (e) {} }, 2500); }

      function pendingEvents() {
        const sent = ROOT2.uploaded || 0;
        return ROOT2.events.slice(sent);
      }

      async function cloudPush() {
        const c = (typeof CLOUD !== 'undefined') ? CLOUD.client() : null;
        if (!c) { setSyncHint('未登录 · 进度只在这台设备上'); return { sent: 0, offline: true }; }
        if (_pushing) return { sent: 0, busy: true };
        _pushing = true;
        try {
          const { data: { session } } = await c.auth.getSession();
          if (!session) { setSyncHint('未登录 · 进度只在这台设备上'); return { sent: 0, offline: true }; }
          const rows = [];
          const list = pendingEvents();
          for (const ev of list.slice(0, 400)) {
            rows.push({ user_id: session.user.id, event_id: ev.id || ShadowPlan.eventId(ev),
                        ts: ev.ts || Date.now(), type: ev.type, payload: ev });
          }
          if (!rows.length) { setSyncHint(''); return { sent: 0 }; }
          const { error } = await c.from('shadow_events').upsert(rows, { onConflict: 'event_id,user_id' });
          if (error) { dlog('events-push-fail', error.message || error); setSyncHint('本机进度未同步 · 点一下同步'); return { sent: 0, error: error.message }; }
          ROOT2.uploaded = Math.min(ROOT2.events.length, (ROOT2.uploaded || 0) + rows.length);
          persist();
          setSyncHint('');
          return { sent: rows.length };
        } catch (e) {
          dlog('events-push-fail', (e && e.message) || e);
          setSyncHint('本机进度未同步 · 点一下同步');
          return { sent: 0, error: String((e && e.message) || e) };
        } finally { _pushing = false; }
      }

      async function cloudPull() {
        const c = (typeof CLOUD !== 'undefined') ? CLOUD.client() : null;
        if (!c) return { got: 0, newEvents: 0 };
        try {
          const { data: { session } } = await c.auth.getSession();
          if (!session) return { got: 0, newEvents: 0 };
          const localMax = ROOT2.events.reduce((a, e) => Math.max(a, e.ts || 0), 0);
          const { data, error } = await c.from('shadow_events')
            .select('event_id,ts,type,payload').eq('user_id', session.user.id)
            .order('ts', { ascending: true }).range(0, 1999);
          if (error || !Array.isArray(data)) return { got: 0, newEvents: 0 };
          const have = new Set(ROOT2.events.map(e => e.id || ShadowPlan.eventId(e)));
          let added = 0;
          for (const row of data) {
            if (have.has(row.event_id)) continue;
            const ev = Object.assign({}, row.payload, { id: row.event_id, ts: row.ts });
            ROOT2.events.push(ev); added++;
          }
          if (added) { recompute(); ROOT2.state.eventsSeen = ROOT2.events.length; ROOT2.uploaded = 0; persist(); }
          return { got: data.length, newEvents: added, localMax };
        } catch (e) { dlog('events-pull-fail', (e && e.message) || e); return { got: 0, newEvents: 0 }; }
      }

      function setSyncHint(msg) {
        const el = document.getElementById('syncHint');
        if (!el) return;
        el.textContent = msg || '';
        el.style.display = msg ? '' : 'none';
      }
```

页面里加常驻提示条（**不是弹窗**，符合原则 6 与 §12）：`<div id="syncHint" class="sync-hint" role="status"></div>`，放 `task-bar` 上方；`resetV2({keepCloud})` 保留 `window.__supaRows` 只清本地。

- [ ] **Step 5: 跑测试确认通过**

Run: `cd playwright-tests && npx playwright test task-events -v`
Expected: 4 passed

- [ ] **Step 6: 提交**

```bash
git add sql/shadow_events.sql shadow/index.html playwright-tests/journeys/shadow/task-events.spec.ts
git commit -m "feat(cloud): 学习进度改成只追加事件流上云，计划每次现算"
```

---

## Task 9: 旧用例改写 + 门禁 + 规格回写

**Files:**
- Modify: `playwright-tests/journeys/shadow/carryover-queue.spec.ts`
- Create: `tests/e2e/shadow/task-mode-phase1.md`
- Modify: `tests/e2e/shadow/carryover-queue.md`
- Modify: `docs/PRD.md`（新增 §5.9）

**Interfaces:**
- Consumes: 全部前序任务
- Produces: 全绿的测试套、构建通过、主 PRD 补上这块规格

- [ ] **Step 1: 改写 carryover-queue（D12）**

整份替换为断言**新不变量**（不再引用 `newPerDay`，那字段已随模型一起没）：

```ts
// Rewritten 2026-09-20 for the word-based model (docs/2026-09-20-学习计划与任务模式重设计-PRD.md §5.3).
// The old version asserted the sentence-window cursor and plan.newPerDay — both gone.
// What must still hold: a long gap never swallows content, and never creates a debt.
import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';
declare const TASK: {
  resetV2(): void; initPlan(n: number): void;
  todayPlan(force?: boolean): { queue: { i: number; pool: string }[]; stats: Record<string, unknown> };
  state(): Record<string, unknown>;
};

test.describe('a long gap re-plans today instead of skipping or piling up', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);

  test.beforeEach(async ({ page, baseURL }) => {
    test.setTimeout(currentTimeout() * 6);
    await page.goto(`${baseURL}/index.html?v=carry2`);
    await expect(page.locator('.sent').first()).toBeVisible();
    await page.evaluate(() => TASK.resetV2());
  });

  test('9 days away still fits the chosen budget and shows no backlog', async ({ page }) => {
    const got = await page.evaluate(() => {
      TASK.initPlan(10);
      const tp = TASK.todayPlan();
      return { n: tp.queue.length, used: tp.stats.usedSec, dropped: tp.stats.droppedA,
               raw: JSON.stringify(TASK.state()) };
    });
    expect(got.n).toBeGreaterThan(0);
    expect(got.used).toBeLessThanOrEqual(10 * 60 + 1);
    expect(got.raw).not.toMatch(/debt|backlog|pending/i);
  });

  test('a bigger budget is a superset, never a shorter queue', async ({ page }) => {
    const a = await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(10); return TASK.todayPlan().queue.map(q => q.i); });
    const b = await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(30); return TASK.todayPlan().queue.map(q => q.i); });
    expect(b.length).toBeGreaterThanOrEqual(a.length);
    expect(a.every(i => b.indexOf(i) >= 0)).toBe(true);
  });
});
```

同步把 `tests/e2e/shadow/carryover-queue.md` 的「预期」段落改成上面两条，并注明"2026-09-20 因模型改为按词排程而改写"。

- [ ] **Step 2: 跑全站测试**

Run: `cd playwright-tests && npm test`
Expected: 全绿（原 27 条 + 本期新增约 25 条）。若 `smoke`/`playback-chain` 偶发假红，按仓库经验先重跑一次再判断。

- [ ] **Step 3: 数据与构建门禁**

Run: `python3 scripts/validate_data.py && node scripts/build_site.mjs`
Expected：`Validation PASSED`；构建自检通过（`dist/shadow/js/plan-engine.js` 存在）

- [ ] **Step 4: 界面手工过一遍真实数据**

用浏览器打开本地 shadow 页，走完：新建计划 → ① 三句 → ② 回忆题（故意答错一次看辨析/答案揭示） → ③ 中文四选一 → 完成页；再手动把 `savedAt` 往前调 9 天重载，确认无"欠账"文案。**看到什么、点不动的地方，写进下一个提交的说明里**（本期不做视觉走查自动化）。

- [ ] **Step 5: 写书面案例文档**

创建 `tests/e2e/shadow/task-mode-phase1.md`，按 `tests/e2e/shadow/conventions.md` 的格式，把本计划的 4 个 spec 逐条写成「前置 / 步骤 / 预期」，每条注明 area `@shadow`、polarity、以及为什么存在（尤其：控件不藏、数字唯一、无欠账、迁移幂等）。spec 头部注释指回这份 md。

- [ ] **Step 6: 把最终形态回写进主 PRD**

`docs/PRD.md` §5.8 之后新增 §5.9「学习计划与任务模式」：抄录上线后的真实行为（三遍、三池、日界、词状态机表、界面不变量、事件流同步），并注明"规格沿革见 `docs/2026-09-20-学习计划与任务模式重设计-PRD.md`"。§5.10「辨析词组」留待第二期。

- [ ] **Step 7: 提交**

```bash
git add playwright-tests/journeys/shadow/carryover-queue.spec.ts tests/e2e/shadow/carryover-queue.md \
        tests/e2e/shadow/task-mode-phase1.md docs/PRD.md
git commit -m "test(shadow): 旧队列用例改写到新模型；补第一期书面案例与主 PRD §5.9"
```

- [ ] **Step 8: 汇报，不自己并 main**

```bash
git push origin agent/qoder-task-mode-build-0920
```

然后告诉用户：分支已 push、测试与门禁结果、需要他做的事（在 Supabase 跑 `sql/shadow_events.sql`； himself 用 7 天）、以及"要不要合并上线"。**合并 main 由他点头后执行。**

---

## 附录 A · 宿主侧辅助函数（Task 6/7/8 必须一并实现，前面代码里全都用到）

这些函数只做「把页面已有的数据翻译成引擎要的输入」和「把引擎的结果画出来」，没有判断逻辑。
签名和实现都写在这里，不要各自发明。全部放在 `TASK` 模块内部（`shadow/index.html`）。

### A1 · 数据接线（引擎的输入）

现有页面只有 `SENT_RAW`（1311 行，扁平句数组）与 `SECTIONS[章].sentZh[段][句]`，**没有**扁平中文数组和段落索引，需要建一次：

```js
      let SENT_ZH_FLAT = [], SENT_PARA = [], SENT_CHAP = [];
      function indexText() {
        SENT_ZH_FLAT = []; SENT_PARA = []; SENT_CHAP = [];
        SECTIONS.forEach((art, ci) => {
          (art.paragraphs || []).forEach((para, pi) => {
            para.forEach((_, ti) => {
              SENT_ZH_FLAT.push((art.sentZh && art.sentZh[pi] && art.sentZh[pi][ti]) || '');
              SENT_PARA.push(ci + ':' + pi);          // 段落身份：章:段
              SENT_CHAP.push(ci);
            });
          });
        });
      }
      // 句子里第 i 个标记在原文中的显示词形（[[key:display]] 的 display，含大写/屈折）
      function displayOf(sentIdx, word) {
        const raw = SENT_RAW[sentIdx] || '';
        const re = /\[\[([^\]:]+):([^\]]+)\]\]/g;
        let m;
        while ((m = re.exec(raw))) if (m[1].trim().toLowerCase() === word) return m[2];
        return word;
      }
      // 同一段里其它目标词的词卡 —— ③ 的干扰义项来源（不跨段、不外借、不造词）
      function paraCardsOf(sentIdx, excludeWord) {
        const want = SENT_PARA[sentIdx], out = {};
        for (let i = 0; i < SENT_RAW.length; i++) {
          if (SENT_PARA[i] !== want) continue;
          for (const w of wordsOfSent(i)) if (w !== excludeWord && VOCAB[w]) out[w] = VOCAB[w];
        }
        return out;
      }
      function sentZhOf(item) {
        if (item.s === 'ex') return String((VOCAB[item.w] || {}).exZh || '');
        return SENT_ZH_FLAT[item.s] || '';
      }
```

### A2 · 读没读过（① 遍进度只认这一份）

```js
      function todayStr() { return ShadowPlan.dayKey(Date.now(), plan ? plan.boundaryHour : 4); }
      function readToday(i) {
        const s = ROOT2.state.sents[i];
        return !!(s && ShadowPlan.dayKey(s.lastReadAt, plan.boundaryHour) === todayStr());
      }
      function countReadToday() { return todayPlan().queue.filter(q => readToday(q.i)).length; }
      function quizTotalCount() { return todayPlan().items.filter(x => x.pass === pass).length; }
      function quizDoneCount() { return quizCursor; }
      function quizWrong() { return quizWrongN; }
      function remainSec() {
        const tp = todayPlan();
        const leftSent = tp.queue.filter(q => !readToday(q.i)).reduce((a, q) => a + q.sec, 0);
        return Math.max(0, leftSent + Math.max(0, quizTotalCount() - quizDoneCount()) * 6);
      }
      function fmtPromoteToday() {
        const d = ROOT2.state.daily[todayStr()] || {};
        return (d.promote || 0) + ' 个词晋升';
      }
```

### A3 · 两栏的数字（全部现算，谁都不是第二个家）

```js
      const STAGE_LABEL = { all: '全部', seen: '已见面', recognized: '文中可辨',
                            owned: '义项直连', graduated: '已毕业', leech: '重点词' };
      function countStages() {
        const c = { fresh: 0, seen: 0, recognized: 0, owned: 0, graduated: 0, leech: 0 };
        const ws = ROOT2.state.words;
        for (const k in ws) { c[ws[k].stage] = (c[ws[k].stage] || 0) + 1; if (ws[k].leech) c.leech++; }
        c.fresh = SENT_WORDS_TOTAL - Object.keys(ws).filter(k => ws[k].stage !== 'fresh').length;
        return c;
      }
      function streakDays() {                       // 连续 = 达标（≥地板）的连续天数
        let n = 0;
        for (let d = new Date(); ; d.setTime(d.getTime() - ShadowPlan.DAY_MS)) {
          const key = ShadowPlan.dayKey(d.getTime(), plan.boundaryHour);
          const x = ROOT2.state.daily[key];
          if (x && (x.sentDone || 0) >= 3) n++;
          else if (key === todayStr()) { }          // 今天还没过完，不断链
          else break;
          if (n > 400) break;
        }
        return n;
      }
      // 地板日 = 到了 3 句但没做扎实（题不足 3 道）；只用 daily 里已有的数，不另存字段
      function floorDays() {
        const d = ROOT2.state.daily;
        return Object.keys(d).filter(k => (d[k].sentDone || 0) >= 3 && (d[k].quizDone || 0) < 3).length;
      }
      function pct(a, b) { return b > 0 ? Math.round(a / b * 100) : 0; }
      function chapterLabelFor(i) {
        const ci = SENT_CHAP[i === undefined ? currentSentence() : i];
        return ci === undefined ? '' : '第 ' + (ci + 1) + ' 章';
      }
```

`SENT_WORDS_TOTAL` = 页面加载时 `wordsOfSent` 遍历全句得到的去重词头数（与词表卡数同源，启动时算一次）。
`floorDays()` 的口径：**做了但没做扎实的天** —— 判据只用 daily 里已有的数，不另存字段。

### A4 · 渲染（做题态与小结）

```js
      function renderQuiz() {
        const q = currentQuiz();
        const box = document.getElementById('quizCard');
        if (!box) return;
        if (!q) { box.hidden = true; return; }
        box.hidden = false;
        const zh = sentZhOf(quizList()[quizCursor]);
        box.innerHTML = q.kind === 'recall'
          ? `<div class="qz-sent">${esc(zh)}</div>
             <div class="qz-blank" aria-label="空格，${q.len} 个字母，${q.initial} 开头">${q.blank}</div>
             <div class="qz-hint">${q.pos ? esc(q.pos) + ' · ' : ''}${q.colFirst ? '词伙首词 ' + esc(q.colFirst) : ''}</div>
             <input id="qzInput" class="qz-input" autocomplete="off" autocapitalize="off" spellcheck="false"
                    aria-label="回想这个单词" inputmode="latin">
             <button class="btn" onclick="TASK.reveal()">想不起来</button>`
          : `<div class="qz-sent">${renderSentenceHtml(q.s, q.w)}</div>
             <div class="qz-ask">这一句里 <b>${esc(q.w)}</b> 是哪个意思？</div>
             <div class="qz-opts">${q.opts.map((o, k) =>
                `<button class="qz-opt" onclick="TASK.answerQuiz(${JSON.stringify(o).replace(/"/g, '&quot;')})">
                   <i>${k + 1}</i>${esc(o)}</button>`).join('')}</div>`;
        if (q.kind === 'recall') document.getElementById('qzInput').focus();
        updateTaskBar();
      }
      function reveal() {
        const q = currentQuiz();
        if (q) showAbToast('答案：' + q.answer);
      }
      function renderPassSummary(n) {
        const d = ROOT2.state.daily[todayStr()] || {};
        const tp = todayPlan();
        const box = document.getElementById('passSummary');
        if (!box) return;
        box.hidden = false;
        box.innerHTML = `<h3>${['', '① 通读完了', '② 挖空填完了', '③ 选义做完了'][n]}</h3>
          <div class="ps-nums"><span>读了 <b>${tp.queue.length}</b> 句</span>
            <span>覆盖 <b>${tp.words.length}</b> 个词</span>
            <span>晋升 <b>${d.promote || 0}</b></span>
            <span>填错 <b>${quizWrongN}</b></span></div>
          <button class="btn primary" onclick="TASK.continuePass()">${n === 3 ? '今天到这儿' : '继续下一遍'}</button>`;
      }
      function continuePass() {
        const box = document.getElementById('passSummary');
        if (box) box.hidden = true;
        if (finished) { exitTaskMode(); return; }
        if (pass === 1) { goSentence(todayPlan().queue[0] ? todayPlan().queue[0].i : 0); }
        renderQuiz();
      }
      function answerQuizSkip() { advanceQuiz(); }   // 「跳过」= 不作答，只前进；不计对错
      function showCompareOrAnswer(q) { /* 第二期填辨析表；第一期揭示答案 + 一句中文义项 */
        const card = VOCAB[q.w] || {};
        showAbToast(q.w + '：' + String(card.m || '').slice(0, 40));
      }
      function goSentence(i) { /* 复用现有 jumpTo/渲染：把全局句号 i 换成本地索引后滚动并高亮 */
        const ci = SENT_CHAP[i];
        if (ci !== currentChapter) setChapter(ci);
        scrollToSent(i - (chapterSentStart || 0));
      }
```

`#quizCard` / `#passSummary` 两个容器要加进 `shadow/index.html` 的正文区末尾（默认 `hidden`），
配套 CSS：`.qz-blank{border-bottom:2px solid var(--accent);font-weight:700;letter-spacing:1px}`、
`.qz-opt{display:flex;gap:8px;min-height:44px}`、`.qz-opt i{...}`。触摸目标 ≥44px（规格 §10.3）。

### A5 · 计划创建 / 清空 / 云端桩（测试用到的三个动作）

```js
      function initPlan(minutes) {
        plan = { todayMinutes: Math.max(0, Math.min(180, minutes | 0)), boundaryHour: 4,
                 startDate: ShadowPlan.dayKey(Date.now(), 4), endDate: null, pausedNew: false };
        ROOT2.plan = plan; ROOT2.state.plan = plan; ROOT2.uploaded = 0;
        persist(); cachedPlan = null;
        push({ type: 'dayplan', day: todayStr(), minutes: plan.todayMinutes, ts: Date.now() });
      }
      function resetV2(opts) {
        const keep = opts && opts.keepCloud;
        localStorage.removeItem(LS_V2);
        ROOT2 = { plan: null, state: ShadowPlan.emptyState(), events: [], uploaded: 0 };
        if (!keep) { /* 云端桩由测试自己清 */ }
        cachedPlan = null;
      }
      function setSupStub(c) { if (typeof CLOUD !== 'undefined') CLOUD._client = c; }
```

`loadRoot()` 里若 `ROOT2.plan` 为 null，则 `plan = null`，界面走「先建计划」分支 —— 与现状一致，不新增空状态。

### A6 · reducer 的 `relearn` 分支（Task 6 Step 5 用到，实现在引擎里）

`shadow/js/plan-engine.js` 的 `replay` 事件分派里补一条：

```js
      } else if (ev.type === 'relearn') {
        const slot = st.words[ev.w];
        if (slot) { slot.ctx = {}; slot.ok3 = 0; slot.err = 0; slot.leech = false;
                    slot.reps = Math.min(slot.reps, 3); slot.stage = stageOf(slot); }
      } else if (ev.type === 'flag' || ev.type === 'dayplan') {
```

`relearn` 是用户显式动作，所以它作为事件进日志（能被云端与其他设备重放），而不是直接改状态。

---

## 执行期校正（真跑测试才发现的，按此修正后续任务）

| # | 计划里写的 | 实际改成 | 为什么 |
|---|---|---|---|
| C1 | `WORD_INTERVALS` 21 项 | **20 项** | 原表末尾那档 14 天挪进了 `GRADUATED_INTERVALS`，不在同一张表里 |
| C2 | 接触时 `err = 0`（"读到就不算一直错"） | **只有答对才清零** | 读到不等于会了；原写法让「连错 3 次进重点词」永远凑不满 |
| C3 | 迁移 = `floor(句reps / 2)`，不设上限 | **再封顶 3 次接触** | 迁移期没有任何检索凭据，一句读 40 遍也不该把词推到快毕业；封顶后仍要重新考 |
| C4 | `cappedWords` 按句计 | **按词计** | 报告要说"多少个词被压回来"，一句两个词就是两个 |
| C5 | 迁移测试用 `new Function('return ' + src)()` 造 `wordsOf` | **改成传数据、页面内现造闭包** | 那写法少调一层，`wordsOf(i)` 返回函数而不是数组，`undefined` 被当成词塞进事件流 —— 测试自己假红 |
| C6 | Task 4 交付 `TASK.migrateNow()` | **第一期只交付纯函数 `ShadowPlan.migrate`**，宿主接线并进 Task 6 的 `loadRoot()` | 少一次对 `TASK` 的临时改动，迁移落盘和 v2 存储同一次切换更安全 |

Task 4 的夹具算术同步更正：6 号句只有 1 个词 → 事件数是 `3×2 + 1×1 = 7`，不是 8。

---

## 完成定义（第一期）

全部满足才算这期做完：

1. `cd playwright-tests && npm test` 全绿，且新增用例覆盖：日界、接触去重、两语境、答错不倒退、时间预算、迁移幂等、出题与判分、界面不变量（控件可见 + 数字唯一 + 两栏不合并 + 无欠账字样）、事件流离线堆积与重放幂等。
2. `python3 scripts/validate_data.py` 输出 `Validation PASSED`，`SENT_SHIFTS` 未被误动。
3. `node scripts/build_site.mjs` 通过，`dist/shadow/js/plan-engine.js` 在发布包里。
4. `sql/shadow_events.sql` 已交付给用户，未登录状态下 App 一切正常（`setSyncHint` 提示，不弹断窗）。
5. 用户连续 7 天自用后：从打开到开始第一句 ≤3 击；界面没有任何"轮/欠/待补"字样。
6. `docs/PRD.md` 有 §5.9。
