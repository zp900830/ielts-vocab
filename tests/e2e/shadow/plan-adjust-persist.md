# 计划页：三处调整各自生效、各自留痕、刷新后回显
<!-- status: compiled | spec: playwright-tests/journeys/shadow/plan-adjust-persist.spec.ts | date: 2026-09-21 -->

## Summary
验证计划页两组旋钮（每天多少分钟 / 几点算换一天）互斥高亮、写入本机计划、刷新后回显，并锁住一条容易被误"修"的决定：**调整计划不追加上传事件**。另锁 2026-10-06 砍「只复习不见新词」开关后的迁移行为：存量 `pausedNew:true` 载入时必须归一化回 `false`，否则那批用户被永久锁死。最后走一遍「清空重来」回到设置屏。

## 这条从哪来（为什么值得锁）
2026-09-21 全面测试阶段一 author 实测：`pausedNew` 在整个套件里 **0 命中**，日界只有引擎层碰到过，
计划页整块界面没有 E2E。两组旋钮各自都会改写今天的队列，而"两个数字互相打架"是这套功能
最初被推翻的理由，所以要锁的是**一致性**而不是"按钮能点"：
① 每组恰好一颗高亮（旧版出过三档同时亮）；② 界面显示与存档同源；③ 计划是本机的事，
只有「完成记录」上云 —— 哪天有人"顺手"把每次调整都写成事件，这条会红，
那时要改的是设计说明，不是断言。

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- 需要一份已存在的计划：走 area conventions **Create a plan**（本用例固定 15 分钟）。
- 「清空重来」走原生 `confirm()`，编译出的 spec 必须先注册 dialog 处理器。
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow @plan

## Before Hook

### Setup 1. Open the app
Navigate to `{E2E_BASE_URL}/index.html`（带 cache-buster）。
**Verify:** `.sent` 渲染出来。

### Setup 2. Create a plan
按 area conventions **Clear the plan** → **Create a plan（15 分钟）**。
**Verify:** 三颗 `.tp-tab` 存在，左栏 `h4` 是「今天 · 15 分钟」。

### Setup 3. Open the plan tab
按 area conventions **Open the plan tab**（面板里点 tab「计划」）。
**Verify:** 出现「每天有多少分钟」「几点算换一天」两组标题；**没有**「新词」组（2026-10-06 已删）。

## Test Steps

### 1. 两组控件齐备，每组恰好一颗高亮
**Verify:** 分钟组 7 颗、日界组 6 颗（含「0 点」「2 点」「3 点」「4 点」「5 点」「6 点」）；
设置屏里不存在「只复习，先不见新词」按钮；每组内 `.ps-opt.sel` 数量为 1；
初始分别是「15 分钟」「4 点」。

### 2. 改分钟：今天的承诺随之收紧
读 tab「今天」左栏 `h4` 的分钟数与 `.tp-num` 的句数上限，记为 `n15`。
回「计划」，点「5 分钟」。
**Verify:** 左栏标题变成「今天 · 5 分钟」；5 分钟档句数上限 `n5` 满足 `1 ≤ n5 ≤ n15`；
`.tp-note` 开头的「今天 N 分钟」与标题里的 N 相同（同一个数不许在两处说不一致）。

### 3. 改日界：可逆，且不许把今天撑爆
点「0 点」。**Verify:** 只有它带 `.sel`；`ielts.shadow.v2` 的 `plan.boundaryHour === 0`；
注脚里的题数 ≥ 句数（预算仍由分钟封顶，不随日界膨胀）。
再点「4 点」。**Verify:** `plan.boundaryHour === 4`（可逆）。

### 4. 「只复习」开关已删：存量 pausedNew:true 载入时归一化
直接往 `ielts.shadow.v2` 的 `plan` 写 `pausedNew: true`（伪造 2026-10-06 之前的存量存档），
带 cache-buster 重载 → 打开计划 tab。
**Verify:** 设置屏仍无「新词」组；`plan.pausedNew === false`（归一化，不许把人永久锁在"只复习"）；
legacy 镜像 `ielts-task-plan` 的 `paused === false`，且它的 `dailyMinutes` 等于 v2 的 `todayMinutes`。

### 5. 调整计划不新增上传事件
记下本步之前的 `events` 总条数与 `dayplan` 条数。
**Verify:** `dayplan` 恰好一条、其 `minutes` 仍是**建计划时**的 15（不是第 2 步改成的 5）；
第 2/3/4 步这一整轮之后 `events` 总条数**没有增加**。

### 6. 刷新后一切回显
带 cache-buster 重载 → **Open the today panel** → tab「计划」。
**Verify:** 高亮仍是「5 分钟」+「4 点」；
`.sync-state` 文本为空（未登录时不许报"还有 N 条没传上去"这种空许诺）。

### 7. 清空重来回到设置屏
注册 dialog 处理器（接受），点「清空重来」。
**Verify:** 「开始这个计划」重新出现；`ielts.shadow.v2` 与 `ielts-task-plan` 都已不存在。

**Pass condition:** 七步全绿。第 5、6 步是判据（单一真值来源 + 不出这台设备），
第 1 步保证没有"双高亮"回归，第 4 步锁住砍开关后的存量迁移，第 7 步顺带把状态清干净供下一轮跑。

## After Hook

### Teardown 1. Clear the plan
若 `ielts.shadow.v2` 或 `ielts-task-plan` 仍存在（第 7 步没走到时），按 area conventions
**Clear the plan** 清掉。**Verify:** 四个计划相关 key 都不存在。

## 约定
- 全程不播放、不进任务模式 —— 不触发 12 秒静默的「语音播不出来」alert。
- 点完 `.ps-opt` 面板整块重渲染，旧 ref 立即失效：每步重新取 ref（area conventions 的 Plan-panel gotchas）。
- 面板/任务栏都是 `position:fixed`，可见性一律用 Playwright 的可见断言，不用 `offsetParent`。
- 句数/词数一律运行时从页面读，不写死。
