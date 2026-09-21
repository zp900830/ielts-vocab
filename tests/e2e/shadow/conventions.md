# Shadow Area Conventions

## Standard shadow preconditions
- Fresh browser session at `{E2E_BASE_URL}/index.html`.
- No login (cloud features are out of scope for these tests).
- `localStorage` cleared unless the test asserts persistence.
- NOTE: `browser_close` + navigate does NOT wipe the profile — `ielts-pos`/`ielts-marks` persist across runs. Tests asserting storage contents must clear the relevant keys in Before Hook.

## Named procedures
- **Start playback**: Click the play button (name 播放). Verify: button text becomes 暂停.
- **Stop playback**: Click the play button (name 暂停). Verify: button text becomes 播放.
- **Current sentence**: The element with class `playing` (`document.querySelector('.sent.playing')`).
- **Clear the plan** (2026-09-21): remove `ielts-task-plan`, `ielts.shadow.v2`,
  `ielts-task-progress`, `ielts.shadow.migNotice` from `localStorage`, then reload with a cache-buster.
  Required by anything that needs the setup screen: `.ps-start` only renders when there is no plan.
- **Open the today panel**: click the topbar button whose accessible name is  今日学习任务
  (`#btnToday`). Verify: `#todayPanel` has class `open`.
- **Create a plan (M minutes)**: Clear the plan → Open the today panel → click the `.ps-opt`
  whose text is `${M} 分钟` → click 开始这个计划. Verify: panel shows three `.tp-tab` buttons
  (今天 / 计划 / 词本) and the left column heading is 今天 · `${M}` 分钟.
- **Open the plan tab**: Create a plan (or reuse one) → Open the today panel → click tab 计划.
  Verify: headings 每天有多少分钟 / 几点算换一天 / 新词 are present.

## Plan-panel gotchas (discovered 2026-09-21, 探索设置屏时实测)
- **每组 `.ps-opt` 只应有一颗 `.sel`**；选中态只有 class，**没有 `aria-pressed`/`role`** ——
  所以断言「哪颗被选中」只能读 `.sel`，读可访问名是读不到的（无障碍缺口另案）。
- **点任何 `.ps-opt` 都会整块重渲染面板**（`renderToday` 重写 `innerHTML`）：
  上一步拿到的 a11y ref 立刻失效，每一步都要重新取。
- 「清空重来」走原生 `confirm()`，不是站内弹层 —— 用例必须先注册 dialog 处理器再点。
- 计划**只在本机**：改分钟/改日界/暂停新词都**不追加事件**，事件流里那条 `dayplan`
  永远是建计划时的初值。别把"调整要上云"当成正确行为写进断言。
- 面板可见性判定不要用 `offsetParent`（播放条/任务栏/面板都是 `position:fixed`，恒 null）。


## Topbar-collapse gotchas (discovered 2026-09-21, 全面测试阶段一 4 runner 实测)
- **任何依赖顶栏收纳（`body.nav-menu` / `#btnMenu`）的用例，进页面后必须先回到顶部并等 `body.scrolled` 消失**，
  否则红绿由「上一个用例在这个 worker 的 profile 里留下的续读位」决定。
  机制：`syncNavMode()` 第一行是 `if (scrolled) return`（收缩态不量宽，防过渡重启），
  而 `ielts-pos` 在 profile 里跨轮存活 → 开页直接落在正文中段 → `scrolled=true` → 永不测量 → 汉堡不出现。
  实测：1280px 下 `.topbar` `clientWidth=1272` 而 `scrollWidth=1350`（**确实放不下 78px**），
  但 `nav-menu` 始终没挂上、`#btnMenu` 的 `display` 恒为 `none`；派发自定义 `resize` 事件也救不回来。
  配方：`window.scrollTo(0,0)` → `expect.poll(() => body.classList.contains('scrolled')).toBe(false)`。
- 推论（2026-09-21 复测后修正）：老用户开页停在续读位时顶栏确实不收纳，但**那一刻它压成 mini、
  根本没有两行可排**；等他滚回顶部或上滑露出完整顶栏，尺寸一变就会被重新量到。
  想让收缩态也当场量（临时挂 `show-nav` 复原压扁）已试过：见下条，走不通。
- 2026-09-21 追查那条 0.2% 间歇红的结论（压测台 `node work/nav_probe.mjs`，未修版 410 次红 1 次、
  带探针 550 次 0 红）：三个候选原因里两个被数据否掉，剩下的一个不是产品问题。
  ① 「只看折行会漏掉横向溢出」—— 长标签下 72 次量宽**全部判了放不下**、0 次出现横向溢出，
     所以那条判定是白加的，已撤；② 「读派生 class 会慢一帧」—— 所有量宽决策都发生在
     `scrollY=0`、无 `scrolled` 时，与这条无关，已撤回原来的读 class 写法；
  ③ 真正的偶发源在**用例自己**：它靠往 `#voiceSel` / `#btnCloud` 写长文字来制造「放不下」，
     而这两个节点归应用所有 —— `loadVoices()` 会在 `document.fonts.ready`、
     `speechSynthesis.onvoiceschanged`、云端会话恢复三个异步时刻整体重建它们，覆写晚一步就被冲掉，
     于是那一行真的放得下、汉堡不出现。**推论：造状态要用应用不会重写的输入（窗口宽度），
     别去覆写应用自己管的 DOM。** 现在按 `--sweep` 实测的区间取值：≤1000px 一定放不下、
     ≥1440px 一定放得下（与音色名/章节名长短无关）。
- 「收缩态不量宽」这条守卫留着，但 `fade-nav` 已从守卫里拿掉：它只是空闲 5 秒把顶栏调到
  `opacity:.55`（679 行），一个字节宽度都不动，却会让那一段时间里永远不重新测量。
  另一条走不通的路也记下来免得重踩：量宽时临时挂 `show-nav` 去复原压扁（想连收缩态一起量）
  → 被 ResizeObserver 观察的按钮尺寸每帧被改 → 「面板打得开」那条用例从 3s 拖到 47s 点不动。
- `.ps-opt`/`#btnMenu` 这类「`display` 由 class 决定」的元素，判可见要用 Playwright 的可见断言，
  不要只读 `getComputedStyle().display !== 'none'`：面板收起时它 display 可以不是 none 但盒子为 0，
  用例会一边「断言通过」一边点不动。

## Markers
- Phase: `@regression`; polarity: `@positive` unless stated; area: `@shadow`.

## Headless / no-audio environments (discovered 2026-09-12)
- Speech never sounds, but the chain still advances via watchdog retries: button text, `.playing` highlight and `ielts-pos` all update normally. Assert UI state, never audibility.
- After ~12s of continuous silent playback the app raises the no-audio guidance `alert`. Pause before that in tests, or expect and dismiss it. The alert text always starts with `语音播不出来`.
- `browser_close` while the alert is up lands on `about:blank`; just navigate fresh afterwards.
- Static server responses get heuristically cached: after changing the app, navigate with a cache-buster (`{E2E_BASE_URL}/index.html?v=N`, bump N per change) and verify via `fetch(location.href)` that the new code is loaded before running.
