# 修复记录 · 批次 4 切片 25–27（门禁 2 报告 `audit_d_b4.md` 的 4 处 MISMATCH + §五.14 两处定案）

本次过手的三份草稿：`work/辨析草稿/4_07.md`、`4_08.md`、`4_09.md`（实际只写了前两份；`4_09.md` 0 MISMATCH 且点名的两句不牵连它，未动，见文末）。
宽度尺 = `tools/width_rule.py` 的 `width()`（默认行 ≤40 / 总结句 ≤30；`core` 一栏按草稿自标的 ≤12 字复量）。
"非宽度行" = 改的是正文 / 出处清单 / 复核索引行，不落在默认行或总结句上，无上限约束；该行涉及的默认行与总结句我复量过、与草稿标称一致（逐条写在下面）。

| # | 报告编号 / 组 | 改前（摘） | 改后（摘） | 改后宽度实测 | 门禁 |
|---|---|---|---|---|---|
| 1 | 报告结案表 1 / 组 124 evidence·proof（`4_07.md` 正文第 27 行） | 「proof 那侧除自己卡外没有第二张卡提到它」 | 「proof 那侧没有第二张卡的例句用到它，但有 1 处词表条目 —— `evidence` 卡 `note` 的同义词栏就把 `proof` 列了进去（原文 `同义词：clue, proof, testimony`），只是词表条目、不是句子，不计入书证条数」 | 非宽度行；本组默认行 39.5 / ≤40、总结句 15.5 / ≤30（复量与标称一致） | PASSED（`同义词：clue, proof, testimony` 逐字回 vocab evidence 卡 `note` 核到；全 vocab 扫 `\bproof\b` 只 3 处：evidence 卡 note、proof 卡 ex、proof 卡 note） |
| 2a | 报告结案表 7 / 组 130 strategy·tactic（`4_08.md` 段原文表下正文行，报告指为第 101 行） | 「两词在别的卡的 `ex` / `note` 里 0 引用」 | 「卡侧：两卡互相把对方列进了自己 `note` 的同义词栏（strategy 栏 `同义词：tactic`、tactic 栏 `同义词：strategy`），除这两栏外全书没有第三张卡用到它们」 | 非宽度行；本组默认行 39.5 / ≤40、总结句 22.5 / ≤30（复量与标称一致） | PASSED（扫 vocab 全字段 `strateg` 命中 3 处、`tactic` 命中 3 处，全部落在这两张卡自己身上 + 互列的两栏，无第三张卡） |
| 2b | 同上 / 组 130（「证据强度」小节，报告指为第 154 行） | 同一句「两词在别的卡的 `ex` / `note` 里 0 引用」 | 「卡侧文本除本卡 `ex` 外只有互相那两栏同义词……除这两栏外没有第三张卡提到它们」，并写明是逐张扫 `ex` / `note` 后的结论（§五.15） | 非宽度行 | PASSED |
| 3a | 报告组 131 拍板判断 + 新 §五.14 / 组 131 happen·occur（`4_08.md` 「证据强度」小节标题 + 第一条 bullet） | 「能出卡，但卡面证据与 `all_synonyms: false` 相反（要拍板）」+ 单条 bullet 把矛盾报上去等定夺 | 「两卡 `ex` 只差动词这一同形事实按 §五.14 记为合法物证（不再提请拍板）」+ 两条 bullet：① 同形照写（逐字引 `The accident happened yesterday.` / `The accident occurred yesterday.`，并写明两句**各算一侧书证**、不并成一条）；② **两栏没互列，故 false 有据**（注明 `all_synonyms` 只是"两栏互列与否"的机械位、定义在 `tools/confusable_groups.py:301`；happen `note` 空串 / occur `note` 只有 `occur daily`） | 非宽度行；本组默认行 38.5 / ≤40、总结句 17.5 / ≤30（复量与标称一致） | PASSED（两条 `ex`、`exZh`「事故昨天发生了。」、`occur daily` 均逐字回 vocab 核到；worklist idx 131 `all_synonyms` 实为 false） |
| 3b | 同上 / 组 131（小节内「提请拍板点」一条） | 「提请拍板点：① 元数据自相矛盾……需要他定一句'两卡 ex 同形时以哪个为准'；② ……」 | 「本组无待拍板项」：①按 §五.14 已定死（按现表出卡、不改 worklist、不退回义项表、不再逐组上报）；只保留②那条**措辞锁**（真区别建立在课文唯一 1 句的不对称上，落地停在"本书这一处"） | 非宽度行 | PASSED |
| 3c | 同上 / 组 131（「表头一句」尾） | 「……两卡 `ex` 是同一句事故只换了动词，可 worklist 却把这两词标成不同义：」 | 「……两卡 `ex` 是同一句事故只换了动词（本书给的"可换"物证，见「数据边界」），所以这一组的区别只能落在状语上：」——标题不再拿元数据当语义结论（§五.14） | 非宽度行（title 不受 ≤40 约束） | PASSED |
| 4a | 报告结案表 9① / 组 132 grave·tomb（`4_08.md` 该段原文表标题） | 「**该段原文（章4 段12，成员两句 + 前后各一句）**」（1349 实为段11 末句，与自己的出处清单第 294 行打架） | 「**该段原文（章4 段11 末句 1349 + 段12 前三句 1350–1352；成员两句 + 前后各一句）**」，并在表下正文补一句段归属复核说明（段11 起 1344 共 6 句 / 段12 起 1350，卡挂段 12 末） | 非宽度行 | PASSED（按章偏移 1277 自算：段11 = 1344–1349、段12 = 1350–1355） |
| 4b | 报告结案表 9② / 组 132（成员表 grave 的 `core`） | 「土里那处、能走到旁边」（"土里"无书证，且刚在本组「不写的」第一条否认过 grave=土坑） | 「白杨后那处、能走到旁边」（`behind white poplars` + `closed near a mossy grave`，1350 原句撑得住；tomb 的「里面装东西」按报告保留，由 `was filled with artifacts` 撑） | `core` 实测 11（≤12 字，本组默认行 39.5 / 总结句 19.5 未动、复量一致） | PASSED |
| 5a | 报告结案表 10 / 组 133 disturb·interrupt（`4_08.md` 第 369 行「出处清单」，本片最严重一条） | 「affect / impact / influence 三词**各有自己的卡**但未与本组并成一组；disrupt 没有卡……按硬约束 2 一律不进成员表」 | 「词头存在性自查（§五.15：逐条 grep 过 vocab 全部 3245 个词头）—— `affect`、`impact`、`interfere` 各有自己的卡；`influence` 与 `disrupt` **都没有卡**：`influence` 只出现在 dominate / affect / disturb / impact 四张卡的同义词栏里，另在 radius 卡 `ex` `The new policy has a wide radius of influence.` 与 propaganda 卡 `ex` `The government used propaganda to influence people's opinions.` 里作句内词；词头里只有形近词 `influx`（`n. 涌入`），下游照卡找 `influence` 会撞空。`disrupt` 只是 interrupt 栏的一个词条 + marine / ecosystem / wildlife 三张卡的词伙。课文 1833 句里 influence / disrupt 均 0 处。**理由掉个头**：邻居词一律不进成员表，与它们有没有卡无关 —— 成员集合由切片包 `words` 钉死（硬约束 2），扩员是 worklist 生成层的事」 | 非宽度行；本组默认行 38.5 / ≤40、总结句 22.0 / ≤30（复量与标称一致） | PASSED（influence：vocab 6 命中 = 4 栏同义词 + radius ex + propaganda ex，sections 0 命中；disrupt：vocab 4 命中全在栏/词伙里，sections 0 命中；influx 词头存在、m=「n. 涌入」；`The new policy has a wide radius of influence.`／`The government used propaganda to influence people's opinions.` 逐字回 vocab 核到） |
| 5b | 报告组 133 拍板判断（统一判据 4）/ 组 133（「证据强度」小节末条） | 「提请拍板点：……真要拍板的是**要不要把 interfere 拉进本组**」 | 拆成两条报备：义项半边按口径 6（非待拍板项）；interfere **不拉进本组**（硬约束 2 已定，草稿不自行并组），只保留它该待的那一格 —— 在"本段那句用哪个词管干扰课程"里逐字引 `boastful shouts interfere with lessons` 并标明"有卡但未并组、不进成员、不计条数"，要报的那一行是**同义词栏单向**（interrupt 收 disturb、disturb 不收 interrupt） | 非宽度行 | PASSED |
| 5c | 自查附带修正（与 5a 同族的存在性/计数断言，§五.15）/ 组 133 三处（正文「卡侧引用」行、diff「同义词栏往哪边列」disturb 行、同源合并条） | 「disturb 被 affect、impact **两张卡**的同义词栏收进去」「disturb 侧另有 **2 处**跨卡登记」 | 逐张扫 vocab 的 `note` 后改为 **三张卡 / 3 处**（affect、impact、**interrupt** —— interrupt 栏 `同义词：disrupt, disturb, interfere with` 也收了 disturb），并注明是扫过才写的 | 非宽度行 | PASSED（漏计的那一栏与本报告判的"单向互列"是同一条事实，改完 diff 那一格与出处清单不再打架） |
| 6a | 与 3a／5b 连带的文件头一致性 / `4_08.md` 小结第 2 行 | 「提请拍板 **4** 处：组 1 …… 组 2 …… **组 3（元数据与卡面自相矛盾，要不要退回义项表）**；**组 5（……口径 6 处理）**」 | 「提请拍板 **2** 处：组 1、组 2」+ 新增一段「两项原上报的拍板请求已按新口径就地结案」：组 3 按 §五.14（同形=合法物证、两句各算一侧、补"两栏没互列故 false 有据"、不退义项表不改 worklist）；组 5 的 interfere 按硬约束 2 留表外、只报同义词栏单向那一行，义项半边回到口径 6 报备 | 非宽度行 | PASSED |
| 6b | 同上 / `4_08.md` 文末「附：本切片复核索引」组 3、组 5 两行 | 组 3 行「**元数据与卡面矛盾**……**要拍板**」；组 5 行「**要拍板**（interfere 要不要拉进组）」 | 组 3 行改成「同形 = §五.14 的合法物证，写进「数据边界」、不再提请拍板（false 有据：两栏没互列，happen 的 note 是空串）」；组 5 行改成「interfere 不拉进组（成员集合由切片包 `words` 钉死；influence / disrupt 也没有词头卡，只作栏内词条），只报同义词栏单向这一行」 | 非宽度行 | PASSED |

## 没改的（含理由）

- **报告判通过的 8 组（125 / 126 / 127 / 128 / 129 / 134 / 135，加上 131 除 §五.14 那两处外的全部表体）一字未动**：A 项 48 行原文表本就逐字符等值，D 项宽度 0 偏差，没有可改的东西。
- **`4_09.md` 整份未动**（0 MISMATCH）。点名要改的两句都不牵连它：`influence` 那句只在 `4_08.md`；124/130/132 三处也都在另两份。它自己的三条存在性断言（`win` 无卡、`area` 无卡、`kingdom` 无卡、「王国」全书 2 次、realm 全书无人提）报告已逐条反向核对成立，我不另改。
- **组 130「不写的」里那些反例（`military strategy`、`political tactics`、`delaying tactic`、`strategic plan`、`strategic`、`tactical`）保留原样**：它们是当场否认的反例、不是虚报"本书有"，`strategic` / `tactical` / `strategies` 我复核 vocab + sections 两份数据确为 0 见。
- **组 132 tomb 的 `core`「立着的一座、里面装东西」保留**：报告点名「里面装东西」由卡 `ex` `The ancient tomb was filled with artifacts.` 撑得住，只有 grave 那一侧的「土里」要换。
- **组 132「两词在别的卡的 `ex` / `note` 里都 0 引用」保留**：这条与 130 那条不同名实相符 —— 我扫 vocab 全字段，grave / tomb 作独立词头被别的卡引用确为 0（`graves` 那串属 engrave 卡 `ex` `He engraves his name on the ring.` 的构词，报告亦已核对）。
- **组 124 表体、组 130 表体、组 132 表体的每一条书证未动**：报告的三处必改都写明"表体与书证不动"。

## 门禁与宽度终检

- `python3 tools/check_compare_draft.py work/辨析草稿/4_07.md work/辨析草稿/4_08.md work/辨析草稿/4_09.md` → **三份全 OK，门禁 1 PASSED（全部英文串可回溯）**。
- 另跑一遍"非否定行零漏网"自查（用门禁自己的 `SPAN` / `units` / `NEG` 拆行）：三份草稿里**所有未被否定句式豁免的行，其反引号内英文串全部能在 `shadow/data/sections.json` 或 `shadow/data/vocab.json` 查到**；被否定行豁免的只有各原本就标注为"本书没有／不写的"的反例，以及本次新增、我逐条手工 grep 过的存在性断言（见上表"门禁"列）。
- 宽度：24 条（12 组 × 默认行 + 总结句）用 `tools/width_rule.py` 的 `width()` 全量复测，**标称=实测、无一条超限**（默认行 38.0–39.5 ≤40，总结句 15.5–24.5 ≤30）。本次改动没有触碰任何默认行或总结句文本；唯一带宽度约束的新增文本是 grave 的 `core`「白杨后那处、能走到旁边」= 11（≤12 字）。
- 未跑 `tools/land_compare.py`（任何模式）；未做任何 git 写操作；未碰 `shadow/data/*`、`shadow/index.html`、`scripts/`、`tools/`、别人的草稿与审核报告。本次写入的文件只有三个：`work/辨析草稿/4_07.md`、`work/辨析草稿/4_08.md`、`work/辨析审核/FIX_4_d.md`（`4_09.md` 只读未改）。

