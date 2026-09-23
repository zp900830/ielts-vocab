# 事件流安全合并：压缩不许动账

- App: shadow
- Environment: local, preview
- Tags: @regression @shadow
- Written: 2026-09-24
- Spec: `docs/PRD.md` §12（云同步：只传事件、拉回重放）+ plan-engine `replay`

## Summary

2026-09-24 实测的 P1：事件流超上限时走的是 `events.splice(0, cut)` 再 `recompute2()` ——
派生出来的词状态、streak、daily 全部按**截断后**的日志重算，等于把进度删掉。
PRD §12 的口径是「溢出时**先合并同类 contact**」。

修法两半，这条锁**第一半（安全合并）**：

- `compactEvents()`：`contact` 按 `w|s|day` **留第一条**、`dayplan` 每天**留最后一条** ——
  这两类在 `replay` 里都是「后面的重复等于空操作」，所以合并对派生的 `words/daily/sents` 必须逐字段不变。
- ⚠️ 留「第一条」不是随便定的：`reps/due/lastContactAt` 只在 engine 的 `credited` guard 里写一次。
  第一版压缩留的是最后一条，对照实验当场抓到 `due` 差了 1ms —— **压缩会改账**。
  同时把 `plan-engine.js` 里写在 guard **外面**的 `slot.due = ...` 挪了进去
  （原先同日重读不加 `reps` 却会把 `due` 往后推，既让排期漂移，又让"重复 contact 是空操作"不成立）。

## Preconditions

- Standard shadow preconditions（见 area conventions）
- 不要求登录；云同步不参与本用例（只调本地引擎）

## Before Hook

### Setup 1. 开页
打开 `/index.html`，等第一句可见。

## Test Steps

### 1. 造出重复 contact
`TASK.resetV2(); TASK.initPlan(10); TASK.enterTaskMode();`
取 `TASK.todayPlan(true).queue` 前 5 句，**连续三轮**各 `TASK.readDone(i)`。
**Verify:** `events` 里 `type==='contact'` 的条数 **严格大于** 它按 `w|s` 去重后的个数
（没造出重复 = 这条什么都没测）。

### 2. 合并：必须省条数、且不动账
调 `TASK.compactProbeForTest()`（先冻结 `words/daily/sents` 快照 → `compactEvents` → `recompute2` → 再快照）。
**Verify:**
- `eventsAfter < eventsBefore`（真的合并掉了重复）
- `after === before`（**派生状态逐字段不变**）

口径两条，都是被对照实验逼出来的：

- 比较用**深排序后的 canonical JSON** —— 重放会按事件顺序重建对象，键序会变，直接 `stringify` 会把
  「值同键序不同」误判成丢账（第一版就这么红的）。
- `sents[].lastReadAt` 按 **`dayKey` 归一**再比 —— 它只经 `ShadowPlan.dayKey` 被 `readToday2` 读，
  精确毫秒不参与任何判断；合并留下同一 `w|s|day` 的第一条，ts 比最后一条早几毫秒，同一天内等价
  （第二版就是这么红的）。

## Pass condition

重复 contact 被合并掉，且合并前后 `words/daily/sents` 完全一致。

## 已知未覆盖

- **上限那一半没测**：`EVENTS_CAP` 从 5000 抬到 20000，要造 2 万条事件才能触发，太重；
  这条只锁"合并本身安全"这个承重件
- 合并后 `uploaded` 归零重推（靠服务端 `(user_id,event_id)` 主键 + `ignoreDuplicates` 幂等）
  没有断言 —— 云端被 mock 掉了，见 `bookmark-sync` / `progress-sync` 的 mock 方式
- `quiz/flag/stage/promote/relearn` 这些**不可安全合并**的类型没有对应断言（它们本来就不参与合并）

## After Hook
_None —— 用例只动内存里的引擎状态。_
