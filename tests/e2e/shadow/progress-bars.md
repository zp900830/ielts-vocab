# 影子跟读全站进度条：任务条要能拖，绿字要过 AA

## Summary

他 2026-09-22 一句「**任务模式的进度条无法使用**」，加上「把全站进度条的交互和视觉优化一下」。查下来的根因不是拖动事件坏了，而是**任务模式里那根本不是一根进度条**：

| 面 | 改之前实测 | 改之后 |
| --- | --- | --- |
| 任务条 `.tb-prog` | 3px 一条线，`aria-hidden="true"`，没绑任何事件；真正能拖的 `#seekTrack` 在任务模式里被 `.tb-play .ab-seek{display:none}` 藏掉 | `#tbSeek` 位置条：轨 4px、热区 28px（伪元素外扩）、滑块 12px 静止可见、`role=slider` + `tabindex=0` + `aria-valuenow/valuetext`，拖完跳句 |
| 播放条 `#seekTrack` | 静止轨 1px、滑块 `opacity:0`（要 hover 才浮现）、无 role 无键盘；拖动本身是好的 | 静止轨 2px、滑块常驻、`role=slider` + 键盘 ← → / Home / End；1px→2px 不改热区（仍靠 `::before`，那条 −20px 的注释约束没动） |
| 今日面板 `.tp-prog` | 轨道底色吃 `--border`，深色下压在深灰卡上几乎看不见 | 两档都拉开一档 + 内高光；不加第二个数字（`tp-num` 已经写了「12 / 36 句」） |

顺带把上一轮（Round F）报了"等他拍板"的两族一起修掉，他这句「你另开一轮修改吧」就是拍板：

1. **A/B 角标**：11px 的字母吃 4.5:1。白字压 `--accent` 浅 3.49 / 深 2.66，压 `--coral-deep` 4.27 —— 上一轮只查了"绿底 + 带字的按钮"，角标的字写在 `::after` 上，所以漏了。A 换主按钮那支深墨（4.78 / 6.26），B 是红底、白字留着、把红压暗一档到 `#b8483c`（5.21）。
2. **绿字压浅底一族**：`--accent #0c9c74` 当字用只有 3.49，压 `--accent-soft` 浅薄荷 3.06 —— 它是上一轮"绿底浅字"的镜像，同一枚硬币。新增 `--accent-text: #0a7558`，浅色 14 处 + 深色 2 处一起过线（5.68 / 4.99 / 5.43）。**没有直接把 `--accent` 调暗**：`#btnAB.ab-active`、`.ab-on` 那几颗是"深墨字压 `--accent` 底"，墨字要 4.78，底色一暗就掉到 3.25，修一族撞坏另一族。
3. `#loopCount` 9px 小徽标：深色下白字压 `--muted #908a7e` 只有 3.43，给深色单独一枚 `#6e685c`（5.53）。

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- **Environments:** local, preview
- **Markers:** @regression @a11y @shadow

## Before Hook

### Setup 1. Open the app
Navigate to `{E2E_BASE_URL}/index.html`，**等到 `.sent` 数量 > 5 才算开完**。
**为什么这条写进前置：** 数据是 `fetch` 回来的，只等 `.audiobar` 会量到一个还没启动完的空壳 —— 探针第一版就是这么量出"播放条拖了不动"的假红，那是脚本在撒谎。

## Case 1. 播放条：静止看得见、键盘到得了、拖了会换句

**Verify:**
- `#seekTrack` 的 `role="slider"`、`tabindex="0"`
- `#seekKnob` 静止 `opacity:1`（不靠 hover 才浮现）、`#seekRail` 静止高度 ≥2px
- 含伪元素外扩的可点高度 ≥24px
- 前置：屏幕上确实有一句 `.sent.playing`；从 20% 拖到 80% 后 `.sent.playing` 的下标变了

## Case 2. 任务条：进度面是一根能拖的位置条

`TASK.resetV2(); TASK.initPlan(15); TASK.enterTaskMode();`

**Verify:**
- `#tbSeek` 存在、`aria-hidden` **不是** `"true"`、`role="slider"`、`tabindex="0"`
- `aria-valuemax` 等于 `TASK.queue.length`；含伪元素外扩热区 ≥24px；`#tbKnob` 静止可见
- 从 20% 拖到 80%：`aria-valuenow` 前移、`aria-valuetext` 形如「今天第 N 句，还剩 M 句」、`aria-valuemax` = 队列长度、当前句真的换了

## Case 3. 任务条：键盘 ← → / Home / End 能挪句

**Verify:** `#tbSeek` 聚焦后按 `ArrowRight` → `aria-valuenow` 变 2；按 `End` → 变 `queue.length`。

## Case 4. 任务条：② 做题态退化成只读，不露一个拖不动的把手

`TASK.todayPlan(true).queue.forEach(x => TASK.readDone(x.i)); TASK.setPass(2);`（与 task-flow 同一配方）

**Verify:** `#taskBar[data-state="quiz"]`；`#tbSeek` 变 `role="progressbar"` + `tabindex="-1"` + `.off`；`#tbKnob` 的 `opacity:0`。

## Case 5. 全站外壳：绿字压在底色上过 AA，浅色深色各量一遍

`#btnDark` 切深色后再量一次（必须先断言 `body.dark` 真的挂上 —— 上一轮有两档"深色"其实没切上，等于没量）。

**Verify:** 越界列表为空数组，**且捞到的站点数 > 0**；角标 `::after` 与 `#loopCount` 按同一判据过线。

## Case 6. 手机 390 与桌面 1280 两档：热区、气泡、不吃行高

上一支探针（`work/round_g_probe.mjs`）只在 1280 一档跑，所以验收标准里「390 与 1280 两档」和「预览气泡不伸出视口」两条**等于没量**。这一条补上，判法沿用上一轮弹层的纪律：**用 `elementFromPoint` 问浏览器这一点归谁**，不读 CSS 猜热区；气泡在 **2% / 20% / 50% / 80% / 98% 五个位置各抓一次**（只在中间拖一次量不出边界），并且必须在 `pointerdown`→`pointerup` 之间抓，松手就没了。

**实测基线**（`node work/round_g2_probe.mjs`）：390 档热区 28px、底栏 102.6px；1280 档热区 28px、底栏 54.6px；两档五处气泡左右上溢出全为 0；`.tb-line1` 高 = `.tb-title` 高 = 18.2px（条子靠伪元素外扩，不吃行高）。
注意 1280 档刚进任务模式那一瞬底栏量到 57px，是按钮组 `transition: .4s` 还没走完，**约 1 秒后稳定在 54.6px** —— 所以基线必须先等高度稳定再取，否则这条锁会自己造出一个"拖动把底栏改矮了"的假红。

**Verify:**
- `#taskBar` 与页面横向无溢出（`scrollWidth ≤ clientWidth`）
- 含伪元素的热区：`elementFromPoint` 在 `#tbSeek` 中心上下各探，实测连续命中带宽 ≥26px
- `#tbKnob` 的矩形落在 `#taskBar` 矩形内（把手被 `overflow:hidden` 裁掉是这类"热区外扩"写法最常见的翻车）
- 2% / 20% / 50% / 80% / 98% 五处拖动中途：`#tbTip` 显示中，且左溢 / 右溢 / 上溢各 < 0.5px
- 底栏高度：稳定后拖动五次，前后差 ≤ 1px；`.tb-line1` 高 = `.tb-title` 高（进度面没有撑高那一行）

## Case 7. 任务条气泡：反复 hover，宽度不许越量越窄

2026-09-24 实测（1902 视口）：hover 几十次之后，`#tbTip` 塌成一条竖线，整句英文**一字一行**。

根因在 `showTip`：它直接读 `tip.scrollWidth` 当"自然宽度"，可 `tip.style.width` 还留着**上一次**写进去的 px。带显式宽度、内容又折行的元素，`scrollWidth` 恒等于那个宽度 —— 于是每显示一次就少 2px（边框/取整），几十次之后到底。修法：量之前先把 `width` 收回 `max-content`，再夹上「不窄于 220 / 不宽于条宽-28」。

**Verify:**
- 连续 hover 24 次（在条的 20%~80% 之间来回走），每次读 `#tbTip.offsetWidth`
- 最窄值 ≥ 200px（塌成竖线时只有 ~30px）
- 24 次读到的宽度**去重后只剩 1 个值**（"越量越窄"会给出 20+ 个递减值）

## 已知未修（别以为这条锁覆盖了）

正文（`.sec` 里）的词头绿 `#0d9d74` 压浅绿底纹 2.91、音标绿 2.80 —— 一页 8000+ 个 span，改它等于改阅读体验本身（那是"这个词是目标词"的教学法编码，不是控件色）。这一族**没有**被本锁扫到（`el.closest('.sec')` 显式排除），要动得单独拍。
