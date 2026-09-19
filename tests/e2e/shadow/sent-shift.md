# 课文增删句子后本地进度序号顺移
<!-- status: compiled | spec: playwright-tests/journeys/shadow/sent-shift.spec.ts | date: 2026-09-19 -->

## Summary
课文里插入或删除句子时，本地存的书签句号、续读位、间隔复习记录、A-B 循环范围必须整体顺移，
且**只能应用一次**（重复加载不能二次顺移）。这是「收藏的那句跳过去成了下一句」这类静默错位的唯一防线。

## Preconditions
- **Standard shadow preconditions**（见 area conventions）
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow

## Before Hook

### Setup 0. 打开应用并清掉迁移记账
Navigate to `{E2E_BASE_URL}/index.html`。
**Verify:** 句子已渲染；`ielts-sent-shift` 已删除（模拟「老设备第一次拿到新课文」）。

### Setup 1. 灌入旧序号的学习数据
向 `localStorage` 直接写入 5 把键的**旧版（插入前）序号**数据：
`ielts-marks`、`ielts-pos`、`ielts-ab-loops`、`ielts-task-progress`。
其中必须同时包含「插入点之前」和「插入点之后」两类序号，才能证明只有后者动。

## Test Steps

### 1. 重新加载触发顺移
Reload 并等待迁移记账写入。
**Verify:**
- `ielts-marks`：插入点之前的句号不变、锚点句本身不变、插入点之后的句号 +1；
- `ielts-ab-loops`：`start`/`end` +1，且被顺移过的那条 `name` 字段被丢弃（否则会显示旧句号）；未被顺移的那条 `name` 保留；
- `ielts-task-progress.sentences`：键整体顺移，插入点之后的记录内容（`reps`）原样带过去、旧键不残留；`cycleSeen` 同步顺移；非序号字段（`streak`）不变；
- `ielts-sent-shift` 已记录该条变更 id。

### 2. 续读位也跟着顺移
重置记账、灌入旧序号的 `ielts-pos`，直接调用 `applySentShifts()` 后读回。
**Verify:** 全局 `i` +1，且同章时章内 `chapterI` 也 +1。
（续读位单独验：`reload` 会让上一个文档在卸载瞬间触发一次自动存档，那是 `ielts-pos` 自身的既有行为，混进一步会测错对象。）

### 3. 再加载一次，确认不重复顺移
Reload 第二次。
**Verify:** 书签、A-B 循环、复习记录键、记账列表与第一次逐字节一致。

**Pass condition:** 只顺移一次、只移插入点之后、复习记录内容不丢、A-B 循环标题不撒谎。

## After Hook

### Teardown 1. 清掉测试写入的键
Remove `ielts-marks`, `ielts-pos`, `ielts-ab-loops`, `ielts-task-progress`, `ielts-sent-shift`。
