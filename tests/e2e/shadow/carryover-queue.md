# 断更之后：不生成欠账，也不丢进度（原「新句顺延 carry-over」）

- App: shadow
- Environment: local, preview
- Tags: @regression @positive @shadow
- Written: 2026-09-18（修复 A1）· **Rewritten: 2026-09-20**（任务模式第一期）
- Spec: `docs/2026-09-20-学习计划与任务模式重设计-PRD.md` §5.3 步 5、§14 T3
- Runner: `playwright-tests/journeys/shadow/carryover-queue.spec.ts`

## 这条从哪来，为什么改名

2026-09-18 那一版锁的是一个真 bug：`buildQueue` 用 `dayIndex() * newPerDay` 取新句窗口，
断更 N 天窗口就整体前移 N 格，那 N 天的句子既不进新句、也不转复习，**被永久跳过**。
当时的修法是「游标按已开过的句子数推进」。

第一期把记忆模型从句子搬到词上之后，这条 bug 的**形状**没了：
队列不再由日历决定，而是「到期的词 + 没见过的词 + 时间预算」现算，
没读过的词永远留在池子里。所以这里改锁两条更根本的东西：

1. **不生成欠账**（原则 5）：断更 7 天回来，今天的量还是由分钟数决定，不会因为「欠 7 天」而变长；
   存储里也压根不存在 debt/owed/backlog 这类字段。
2. **不丢进度**：7 天前见过的词还在，状态没有被日历改写，而且今天该再见一面。

文件名保留 `carryover-queue`，是为了让「日历不该推走内容」这条历史约束还能顺着名字找回来。

## Setup

1. 打开 `{E2E_BASE_URL}/index.html`，等正文句子渲染出来。
2. `TASK.resetV2()` + `TASK.initPlan(15)` 起一份干净计划（不走 UI，UI 路径由 `task-flow.spec.ts` 覆盖）。
3. `TASK.readDone(i)` 读掉队列前 3–4 句（读句子就是给词记接触，这是原则 1）。
4. **模拟断更**：把 `ielts.shadow.v2` 里每条事件的 `ts` 往前挪 7 天、清空 `day`、
   把 `state.eventsSeen` 置成与 `events.length` 不一致（逼开页时重放，而不是沿用旧快照），
   `planned` 清空，然后刷新。

## Test Steps

1. 断更后读今日队列与存档。
   - 断言：`stats.usedSec ≤ stats.budgetSec + 1` —— 今天的量由分钟数封顶，不是「欠多少补多少」。
   - 断言：队列非空（断更 7 天不该给一块空屏）。
   - 断言：`state.words` 的词数 > 0（7 天前见过的词一个没丢）。
   - 断言：整份 `ielts.shadow.v2` 文本里不含 `debt|owed|backlog|missed|overdue|待补|欠`。
2. 打开今日面板，读面板全文。
   - 断言：不出现「欠 / 待补 / 积压 / 轮 / 已读 N」；出现「今天」。
3. 断更后重放的状态核对。
   - 断言：词数与断更前一致。
   - 断言：没有任何一个词已经是「已毕业」（迁移期与断更都不该白送毕业）。
   - 断言：所有词的 `lastContactDay` 都还是 7 天前那一天（重放没有把历史改写成今天）。
   - 断言：`stats.dueWords > 0` —— 到期了，今天该再见一面。

## 约定

- 不依赖音频与朗读状态，只断言队列、状态与存档。
- 不断言队列的具体句数（它由句长与实测语速决定），只断言「不超过预算」与「非空」。
- 断更用**改时间戳**实现，不改系统时间：多端与 CI 都不能靠改时钟。
