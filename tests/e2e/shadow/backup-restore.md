# 本地备份：导出必须含真值根，且能整包回灌

- App: shadow
- Environment: local, preview
- Tags: @regression @positive @shadow
- Written: 2026-09-24
- Spec: `docs/PRD.md` §5.7（进度与云同步）/ §10.2（计划页的导出/导入）

## Summary

2026-09-24 实测的 P1：备份导出/恢复都绕开了真值根。`BACKUP_PREFIX` 是 `ielts-`（连字符），
而真值根是 `ielts.shadow.v2`（点分隔）—— `'ielts.shadow.v2'.startsWith('ielts-')` 是 `false`。
实测旧版的备份键只有 `ielts-sent-shift / ielts-marks / ielts-task-progress / ielts-task-plan /
ielts-marks-schema / ielts-ab-loops`，**events / state / plan 一个都没有** —— 导出来是个空壳，
恢复完还是旧状态。同一轮还发现：导入按钮只长在「计划」页里，而计划页要先建出计划才进得去，
**换设备/清缓存的人根本恢复不了**。

## Preconditions

- Standard shadow preconditions（见 area conventions）
- 不要求登录；云同步不参与本用例

## Before Hook

### Setup 1. 开页并造出一点真进度
- 打开 `/index.html`，等正文渲完
- `TASK.resetV2(); TASK.initPlan(10); TASK.enterTaskMode();`
- 取 `TASK.todayPlan(true).queue` 前 3 句各 `TASK.readDone(i)`
- **Verify:** `Object.keys(TASK.state().words).length > 0`（没读到词 = 这条什么都没测）

## Test Steps

### 1. 导出包里必须有真值根
调 `TASK.exportBackup()`，接住 download，读文件里的 `.data`。
**Verify:** `Object.keys(data)` **包含** `ielts.shadow.v2`，且它的 `events.length > 0`。
（旧版断言会在这里红，报「备份里没有真值根」。）

### 2. 清空本机 → 导入 → 进度回来
- `localStorage.clear()` → reload
- **Verify（清空判据）:** 每次开页 `loadRoot()` 都会写一份**空的**根，所以"清空"**不等于 key 不存在** ——
  判据是 `JSON.parse(localStorage['ielts.shadow.v2'])` 的 `events.length === 0` 且 `state.words` 为空。
- 点顶栏「今日学习任务」打开面板（此刻是**设置屏**，还没有计划）
- 注册 dialog 处理器（导入走原生 `confirm()`），点「导入备份恢复」→ 接住 filechooser → 塞进备份文件
- reload
- **Verify:** `ielts.shadow.v2` 与 `ielts-task-plan` 都回来了；`state.words` 的词数 == Setup 1 记下的数

## Pass condition

导出包含 `ielts.shadow.v2`，且清空后能从这份文件把词数原样恢复。

## 已知未覆盖

- 云端那份（`shadow_events` / `user_data`）不参与本锁；多设备合并另见 `bookmark-sync` / `progress-sync`
- `importBackup` 目前**不校验每个值是不是字符串**，也不看 `backupVer`（`P3`，未修）
- 导入会连 UI 偏好（`ielts-dark` / `ielts-voice` / `ielts-accent` / `ielts-ab-loops`）一起覆盖 ——
  它们是前缀命中的，属于"备份整包"的语义，暂按预期处理

## After Hook
_None —— 用例自己清过一遍 localStorage，不留状态。_
