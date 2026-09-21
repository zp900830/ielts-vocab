# 第一次打开：设置屏只问「每天有多少分钟」
<!-- status: compiled | spec: playwright-tests/journeys/shadow/plan-setup-first-run.spec.ts | date: 2026-09-21 -->

## Summary
验证「无计划 → 设置屏 → 选分钟 → 开始这个计划」这条首屏路径：设置屏只有一颗分钟旋钮（不许把已删的总天数/速度三档加回来）、「今天大约 N 句 · M 题」随选择重算且题数=句数×1（2026-09-22 两步制：一句只剩 ② 一道题，原来 ×2 的口径作废）、建计划只往事件流里留一条 `dayplan`。

## 这条从哪来（为什么值得锁）
2026-09-21 全面测试阶段一 author 实测：这块界面**一条 E2E 都没有** —— `psMin` 在整个
`playwright-tests/journeys/` 里 0 命中。它是全应用唯一的时间入口，也是「走完全部词要多久」
三处显示的第一处落点。锁的三件事分别对应三种会被悄悄破坏的方式：
① 已删的「总天数 → 每天句数」除法链被接回来（源码里 `TASK.adjustPlan()` **至今仍被导出**，
只是界面上没入口）；② 换算式被改成写死的句数/题数（两步制后正确的是 ×1 题，见上）；③ 计划多出一个第二真值来源。

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- 首屏路径依赖「还没有计划」，所以必须走 area conventions 的 **Clear the plan**（`.ps-start` 只在无计划时渲染）。
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow @plan

## Before Hook

### Setup 1. Open the app
Navigate to `{E2E_BASE_URL}/index.html`（带 cache-buster）。
**Verify:** 正文句子渲染出来（`.sent` 可见）。

### Setup 2. Clear the plan
按 area conventions **Clear the plan**：清 `ielts-task-plan`、`ielts.shadow.v2`、
`ielts-task-progress`、`ielts.shadow.migNotice`，重载。
**Verify:** 这四个 key 都不存在。

### Setup 3. Open the today panel
按 area conventions **Open the today panel**（顶栏按钮可访问名「今日学习任务」）。
**Verify:** 出现标题「每天有多少分钟」与按钮「开始这个计划」。

## Test Steps

### 1. 设置屏只有一颗旋钮
**Verify:** `#psMin .ps-opt` 恰好 7 颗，文本依次 5/10/15/20/30/45/60 分钟；
其中只有「15 分钟」带 `.sel`（每组恰好一颗高亮）；
设置屏文本里不含「总天数」「新句速度」「慢」「快」，DOM 里不含 `#adjSpeed`、
不含 `input[type=range]`。

### 2. 句数与词数从数据现算，不写死
**Verify:** 用 `SECTIONS` 段落字符串逐条求和得到句数、用正文 `[[词头:` 标记去重得到词数，
两个数都出现在 `ps-sub` 那一行（「共 N 句 · M 个目标词」）。

### 3. 「今天大约」随分钟重算，且题数 = 句数 ×1（两步制）
按 `.ps-opt` 文本点「60 分钟」，读 `#psSum` 里的句数 `n60` 与题数 `q60`；
再点「5 分钟」，读 `n5` 与 `q5`。
**Verify:** `n5 < n60`；`q60 === n60`；`q5 === n5`；当前只有「60 分钟」或「5 分钟」
（最后点的那颗）带 `.sel`。

### 4. 开始这个计划 → 面板切到「今天」，设置屏消失
点「开始这个计划」（文本随第 3 步所选，用 5 分钟）。
**Verify:** 出现三颗 `.tp-tab`（今天 / 计划 / 词本）；左栏 `h4` 是「今天 · 5 分钟」
（跟随所选，不是写死的 15）；`.ps-start` 与 `#psMin` 都查不到。

### 5. 计划落盘，事件流里只有那条初值
**Verify:** `ielts.shadow.v2` 的 `plan.todayMinutes === 5`、`plan.boundaryHour === 4`、
`plan.pausedNew === false`；`events` 里 `type === 'dayplan'` **恰好一条**且 `minutes === 5`。

**Pass condition:** 五步全绿。第 1 步（只有一颗旋钮）与第 5 步（一条 `dayplan`、一个真值来源）
是本用例的判据，其余三步保证它们不是巧合。

## After Hook

### Teardown 1. Clear the plan
若 `ielts.shadow.v2` 或 `ielts-task-plan` 仍存在，按 area conventions **Clear the plan** 清掉。
（幂等：本来就干净时什么都不做。）

## 约定
- 不播放、不进任务模式 —— 因此不会触发 12 秒静默的「语音播不出来」alert。
- 不断言队列的具体句数（受句长/实测语速影响），只断言方向与「题数 = 句数 ×1」这类构造关系。
- 点完 `.ps-opt` 面板整块重渲染，旧 ref 全部失效：每一步重新取 ref（见 area conventions 的
  Plan-panel gotchas）。
