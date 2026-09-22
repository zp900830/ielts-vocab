# 绿底按钮的字色 + 播放条弹层不许出屏

## Summary
两件独立的事，一条用例锁住，因为它们是同一天同一份走查里"发现了但当时没修"的那一对：

1. **绿底白字的主按钮对比度不达标** —— 薄荷绿渐变 `linear-gradient(135deg,#2bd4a4,#0fae7e)` 上压白字，白字压亮端 `#2bd4a4` 实测 **1.90:1**（WCAG AA 正文要 4.5:1，纯图标要 3:1）。这颗按钮是全应用统一的：开始今日任务、下一题、继续任务、播放，都是它。
   2026-09-22 定：换**字色**不换底色 —— 把 `--grad` 压暗到能容白字要一路压到亮度 0.183 以下，那就不是这支薄荷绿了。改成深墨 `--cta-ink: #04231b` 后同一位置 **8.76:1**，绿底一颗都没动。跟读站 16 条规则、主应用 10 条规则一起改，浅色/深色两档都过线。
2. **A-B／循环／倍速／书签四类小弹层在手机上伸出屏幕外** —— 菜单以那颗约 40px 宽的小按钮为锚左右各甩一半，实测 390px 上常规模式右溢 **39px / 18.8px**，任务模式播放组挪到左边后左溢 **33.5px**。
   2026-09-22 定：窄屏（≤700px）把锚从"按钮"换成"整条栏"（wrap 改 `position:static`，包含块上移到 fixed 的 `.audiobar` / `.task-bar`）。改完 390px 两处都是左溢 0 右溢 0，1280px 的几何逐位不变（648→740 等）。

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- **Environments:** local, preview
- **Markers:** @regression @a11y @shadow

## Before Hook

### Setup 1. Open the app
Navigate to `{E2E_BASE_URL}/index.html`.
**Verify:** 首句 `.sent` 可见。

## Case 1. 源码里不许再有「绿底 + 白字」这条规则

读 `shadow/index.html` / `index.html` / `admin/index.html` 三份 `<style>`，按声明块判"底色是绿 且 字色是白"。**先自检闸门本身**：拿 `playwright-tests/fixtures/cta-gate-selfcheck.css` 喂进去，必须恰好抓到 `.bad-a`、`.bad-b` 两条，且不许误报那条蓝底（`--accent` 在 admin 站是苹果蓝）和那条 8% 淡绿底纹。

**Verify:** 三份站点命中 0 条；夹具命中恰好 2 条。
**为什么还要这一道：** 屏幕上只能量到此刻在屏的控件，做题态、A-B 生效态、书签弹层要先钻进那个状态才显形 —— 源码级扫描不依赖渲染，含看不见的热态。

## Case 2. 屏幕上真的量一遍首屏

遍历页面，把"绿底 + 有字/有图标"的站点全捞出来，半透明玻璃层按由外向内叠回底色，渐变亮端暗端各算一次，取最差比值；按 WCAG 分档判（≥24px 或 ≥18.66px 加粗算大字 3:1，纯图标 3:1，其余 4.5:1）。
顶栏标题那种"渐变裁字"（`-webkit-text-fill-color:transparent`）要跳过 —— 字本身就是绿的，拿 `color` 那一路白去比是假阳性（上一版就被它骗过一条 1.41:1）。

**Verify:** 越界 0 条，**且捞到的站点数 > 0**（一条都没捞到 = 扫描没跑到东西，不算通过）。

## Case 3. 任务模式那颗「下一句」

`TASK.resetV2(); TASK.initPlan(15); TASK.enterTaskMode();`
**Verify:** `#tbNext` 的 `color` 是 `rgb(4, 35, 27)`，`background-image` 里仍有 `43, 212, 164`（绿底没被压暗）；整页复量越界 0 条且站点数 > 0。

## Case 4. 390px 弹层位置（常规模式 + 任务模式各一遍）

先进「今日学习任务」面板是关的（`.today-panel.open` 计数 0，它常驻 DOM、靠 class 显形，别拿 `display` 判）。
`addMark()` 记一条书签（书签那条 `.ab-menu` 空着量不出真实溢出），然后依次点开 **循环次数 / 倍速 / A-B 选段 / 书签**，每颗展开后等过渡走完（.18s，抢时序会把"正在淡入"读成"没开"）再量。

**Verify（每颗）:**
- 弹层矩形 `left ≥ 0`、`right ≤ 视口宽`；
- 里面有可点的项（项数 > 0，否则等于没量）；
- **真点最外侧那一项**，点得到才算过 —— 有东西压着它时让 Playwright 点名是谁，不用坐标自己猜。

选完把倍速/循环/A-B 拨回默认，别把状态带给后面的用例。

## 已知不在本用例口径内
句子上的 A/B 角标、`#loopCount` 那颗 9px 小徽标也是白字压色底（3.49:1 / 更低），但它们是状态标记不是按钮，已单独报给他拍板，2026-09-22 未动。

## Verify 汇总
`playwright-tests/journeys/shadow/cta-and-popups.spec.ts`（5 条）。量测口径来自 `work/round_f_probe.mjs`，它带 `--base` 反向验证：喂 `git show HEAD` 复原的旧页面必须报越界（实测旧版越界 27 处、溢出 3 处）。
