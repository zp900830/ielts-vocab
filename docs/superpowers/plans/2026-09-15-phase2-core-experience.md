# Phase 2 — 核心体验修复实施计划

> **Goal:** 按《全量排查报告_20260915.md》修复 P1 核心体验问题（2.1 ~ 2.13）。

**Architecture:** 以 `shadow/index.html` 为主，同步修复 `index.html` 与 `admin/index.html`；所有改动以“不破坏现有 Playwright 回归”为底线。

**Spec:** `docs/全量排查报告_20260915.md`

**Global Constraints:**
- 不删除用户已有 localStorage 数据；新键与旧键兼容。
- `shadow/index.html` Playwright 回归必须 18/18 通过。
- 暗色模式 CSS 只追加，不推翻现有浅色样式。
- admin 改动保持 Vue 3 + Element Plus 结构。

---

## Task 1: shadow 词库抽屉下滑关闭与滚动冲突（2.1）

**Files:** `shadow/index.html:3720-3739`

- 仅当触摸起点在抽屉头部/手柄，或列表已滚动到顶部时才允许下滑关闭。
- 添加 `.panel-handle` 作为关闭手势区域；列表主体正常滚动。

**Test:** 移动端视口下打开词库抽屉，列表可上下滚动，下滑到顶后继续下滑才关闭。

---

## Task 2: shadow 键盘空格冲突 + 可访问性（2.2）

**Files:** `shadow/index.html`

- 聚焦 `.sent` / `.w` 时按空格，仅触发该元素行为，不再冒泡到全局播放/暂停。
- 给 `.sent`、`.w`、进度条标题等可点击元素补充 `aria-label` / `role`。
- 单词弹窗、跳转弹窗、书签弹窗加 `role="dialog" aria-modal="true"`。

**Test:** Playwright keyboard 测试 + 手动 Tab 到句子按空格。

---

## Task 3: shadow 暗色模式根背景与 theme-color 联动（2.3）

**Files:** `shadow/index.html`

- 修复 `body.dark html` 选择器无效问题：把根背景色放到 `html` / `:root` 并随 `.dark` 切换。
- 暗色切换时同步更新 `<meta name="theme-color">`。
- 修复 `.sec h2`、`.t-en`、`.gl` 等硬编码颜色未覆盖暗色。

**Test:** 切暗色后页面背景、标题、内联 gloss 颜色正确；iOS 橡皮筋无白闪。

---

## Task 4: shadow 播放偏好持久化（2.4）

**Files:** `shadow/index.html`

- 持久化：播放倍速、单句循环次数、是否显示中文译文、是否显示 notebar 解析、暗色模式开关。
- 使用 localStorage 键 `ielts-shadow-prefs`（JSON），读取时与默认值 merge。

**Test:** 刷新页面后偏好保持。

---

## Task 5: shadow 弹窗焦点管理（2.5）

**Files:** `shadow/index.html`

- 打开弹窗时 focus 弹窗内第一个可聚焦元素（或弹窗本身）。
- Tab 焦点限制在弹窗内（focus trap）。
- Esc 关闭弹窗，焦点返回触发按钮。
- 打开新弹窗时关闭旧弹窗。

**Test:** 键盘测试 + Playwright keyboard 回归。

---

## Task 6: A-B 循环与单句循环叠加（2.6）

**Files:** `shadow/index.html`

- A-B 循环激活时，单句循环仅在当前句生效；一轮后仍能正确回绕到 A。
- 避免 `loopSent` 与 `abMode` 状态互相覆盖。

**Test:** Playwright ab-loop / loop-mode 回归。

---

## Task 7: index.html 暗色模式（2.7）

**Files:** `index.html`

- 引入与 shadow 一致的暗色 token 与 `.dark` 切换逻辑。
- 给 body、卡片、侧边栏、弹窗加暗色覆盖。
- 同步 `theme-color`。

**Test:** 手动切换暗色，检查主应用无闪白。

---

## Task 8: index.html 键盘快捷键冲突 + Esc 关闭弹窗（2.8）

**Files:** `index.html`

- 全局空格仅在未聚焦按钮/链接/输入时切换播放。
- Esc 关闭 `#wpop` 单词弹窗。

**Test:** 手动 Tab 到按钮按空格不触发播放；打开弹窗按 Esc 关闭。

---

## Task 9: index.html 云音频 resume 失败降级（2.9）

**Files:** `index.html`

- blob URL 被回收后 resume 失败时，重新请求云端 TTS 或降级到本机语音，不静默吞错。

**Test:** 需要真机/网络模拟，先保证代码路径不抛未处理异常。

---

## Task 10: admin 修复（2.10）

**Files:** `admin/index.html`

- 移除普通 `<style>` 中的 `:deep()`（Vue scoped 才需要）。
- 图表实例在组件卸载/视图切换时 `dispose()`。
- `loadData()` 出错时设置 `dInfo` 为错误对象，UI 显示重试。

**Test:** 手动打开 admin，切换视图，检查控制台无 `:deep()` 警告。

---

## Task 11: admin 提升/降级确认 + TTS 保存（2.11）

**Files:** `admin/index.html`

- 提升/降级管理员前弹 `confirm()` 二次确认。
- `loadTts()` 不再清空 `tts.key`；保存时若输入为空保留原 key。

**Test:** 手动验证。

---

## Task 12: 清理根目录截图/备份（2.12）

**Files:** 仓库根目录

- 删除未引用的 PNG 截图与 HTML 备份（先列出清单给用户确认）。

**Test:** `git status` 确认删除；页面仍能正常打开。

---

## Task 13: admin 第三方脚本 defer/async（2.13）

**Files:** `admin/index.html`

- Vue、Element Plus、ECharts、Supabase 等脚本改为 `defer` 或 `async`，避免阻塞首屏。
- 内联脚本放到 DOM 后或监听 `DOMContentLoaded`。

**Test:** admin 页面仍能正常加载；控制台无报错。

---

## 回归验证

1. `cd playwright-tests && npm test` → 18/18 通过。
2. 手动检查 shadow / index / admin 首页控制台无新增报错。

---

## Spec Coverage

- 2.1 → Task 1
- 2.2 → Task 2
- 2.3 → Task 3
- 2.4 → Task 4
- 2.5 → Task 5
- 2.6 → Task 6
- 2.7 → Task 7
- 2.8 → Task 8
- 2.9 → Task 9
- 2.10 → Task 10
- 2.11 → Task 11
- 2.12 → Task 12
- 2.13 → Task 13
