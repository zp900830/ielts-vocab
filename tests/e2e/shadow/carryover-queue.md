# 断更后新句顺延（carry-over）

- App: shadow
- Environment: local, preview
- Tags: @regression @positive @shadow
- Written: 2026-09-18（第一批修复 A1，随 `buildQueue` 窗口改为进度游标而新增）

## 背景（为什么有这条）

`buildQueue` 原先用 `startNew = dayIndex() * plan.newPerDay` 取新句窗口。断更 N 天后
窗口整体前移 N 格，那 N 天该学的句子既不再进新句窗口、也因 `reps = 0` 不会被转成复习，
**被永久跳过**。改为按「已开过的句子数」推进游标后，游标停在原地，欠的句子留在队列里。

这条测试锁的是：日历过去 5 天 ≠ 窗口前进 5 格。

## Setup

1. 打开 `index.html`，等正文句子渲染出来。
2. 点顶栏「今日」→ 弹窗里点「开始计划」（默认 30 天 / 60 分钟，`newPerDay` 由数据决定，不断言具体值）。
3. 把存档里的 `plan.startDate` 改成 5 天前，清空 `prog.sentences`，写回 localStorage 后刷新。

## Test Steps

1. 刷新后读取今日队列中所有 `type === 'new'` 的句索引。
   - 断言：最小索引为 `0` —— 断更 5 天没有把窗口推走（回归点：旧实现会给出 `5 * newPerDay`）。
   - 断言：新句数量等于 `plan.newPerDay`（窗口宽度仍是每天那么多，没有一次倒 5 天）。
2. 把索引 `0 .. newPerDay-1` 的句子标记为已开过（`reps = 1`），重建队列。
   - 断言：新句最小索引变为 `newPerDay` —— 学完才推进，而不是到点就推进。
   - 断言：新句最大索引小于 `2 * newPerDay`。

## 约定

- 不依赖音频与朗读状态，只断言队列数组与存档。
- 不断言 `newPerDay` 的字面数值，从 `plan` 里读，避免数据变更后测试脆断。
