# 门禁 2 审核 · 批次 1（1A + 1B）

组数 10 / BLOCK 9 组（14 条）/ MISMATCH 10 条 / 全项通过 0 组。
逐组判定（章节按 worklist_idx 编号）：可落地 1（idx 3 = degrade·deteriorate = 1A 组 4）· 需作者改 9 · 建议退回 0（两份草稿各自提请的"组 2/组 5 共享义项""heaven 一侧偏薄"两个退回候选，我都不支持——理由见对应组的 F 行与拍板项 3）。

> 审核人：门禁 2 独立审核代理（非草稿作者）。作业书：`work/compare_slices/AUDIT_BRIEF.md`。
> 数据原文只认 `shadow/data/sections.json`（去 `[[词头:表面]]` 标记后的表面形式 + 同位 `sentZh`/`paraZh`/`subheads`）
> 与 `shadow/data/vocab.json`（`m`/`ex`/`exZh`/`note`）。
> 章偏移 `[0,339,651,883,1277,1492]`、全书 1833 句 —— 我用脚本从 `paragraphs` 展平自算，与作业书给的偏移一字不差。
> 门禁 1 复跑（只读）：两份草稿均 **PASSED**（`OK 2026-09-20-辨析批次1A.md / OK …1B.md`）——下面的问题是机检结构上抓不到的。

**范围**：`work/2026-09-20-辨析批次1A.md`（worklist_idx 0/1/2/3/4）+ `work/2026-09-20-辨析批次1B.md`（worklist_idx 6/7/8/9/10）。
未改任何草稿、未碰 `shadow/data/`、未做任何 git 写操作（仅 `git status`）。

## 口径备注（影响 D 的读数，先说清）

- D 我按 BRIEF §三.4 / AUDIT 作业书 D 行算：**CJK（含全角标点）记 1，其余记 0.5**。
  1A 的 10 个标称值在这种口径下 **逐个精确复现**（38.0/28.5/38.0/24.0/39.0/20.0/36.0/26.0/39.5/22.0），
  若把全角标点折成 0.5 则整体低 1.0–2.5（方向是"低估"，不超上限）。→ 1A 的宽度数**不是虚报**。
- 1B 的 10 个标称值用的是另一套口径（其 §0.8 自述"只数汉字，不含英文与标点"），**不是作业书要求的宽度**。
  换成规定口径后 5 条默认行全部爆表（见各组 D 行）。

---

## 组 0 · dawn / sunrise（1A 组 1）

A 原文表：**OK**。表内 6 行（114–119）与 `sections.json`[0].paragraphs[20] 逐字比对，去 `**` 后英文 6/6 完全一致、
中文 6/6 与同位 `sentZh` 完全一致；段范围 114–119 = 该段全部 6 句，无漏句、无并句。`paraZh`「峡谷日出宫殿传说，荒野沙漠立誓护林。」逐字对。
另两段的三处裸文本引句（`…classical strings at dawn`/604 全句/883 全句）也对得上；`paraZh`（章1 段43「周日清晨多种歌曲风格。」）对；
883/886 标注的"上篇·跨国列车"是该段 `subheads` 原文、"出发日"是其 `paraZh` 的转述（未加引号冒充原文，可接受）。
B 句号与共现：**OK**。3 个共现段 = worklist `paras [[0,20],[1,43],[3,0]]`；成员句 114(sunrise)/118(dawn)、600(dawn)/604(sunrise)、883(dawn)/886(sunrise)
全部确以 `[[词头:…]]` 标记出现；`sents [114,118,600,604,883,886]` 与草稿写的号逐一对上。
C 可 grep：**OK**。我亲自命中的唯一英文串 21 条（出处清单 10 条 + 表内 11 条）；6 条不命中全是字段名/文件名/`at dawn = at sunrise` 这类等式断言。
抽样复算：`each dawn`→356 ✓、`from dawn to dark night`→1201 ✓、`the new dawn rule`→1264 ✓、`a calm lake at sunrise`→1824 ✓、
`At sunrise we boarded the train`→恰好 886/1111/1126 三句 ✓（草稿写"三句同为"，属实）。
两条否定行我自己反查过：全库 `see/watch + dawn` 组合 **0 命中**、`a dawn`/`dawns` **0 命中** → 属实，不是躲门禁 1。
D 宽度：默认行 标称 38.0 / 实测 **38.0**（严格口径 35.5）→ OK；总结句 标称 28.5 / 实测 **28.5** → OK。
E 义项照抄：**BLOCK（字面）**。表头写「都译成"黎明"」——「黎明」同时是 `dawn`.m 与 `sunrise`.m 的原词。
默认行/总结句/core 干净（"出发的那个钟点""看的那道景"均为转述）。该行是"引用共同译文 + 当场否定用法"，
与 AUDIT E 的字面判据冲突，需按拍板项 2 定。
F 同源与厚度诚实：**MISMATCH（轻）**。`golden sunrise`（卡词伙）↔ 课文 125、`splendid sunrise`（卡词伙）↔ 课文 114 是同一处文本，
出处清单写成"卡词伙 + 课文"两源，未在「证据强度」点名同源（BRIEF §8 要求点名）。"证据强度"本身没有据此宣称"两处独立书证方向一致"，故不到 BLOCK。
另：正文口径未声明——dawn 按 `[[dawn:…]]` 标记确为 **16 句**（草稿的 16 ✓），但按表面文本另有 1 句 967「…embark again at dawn」未被标记，
且"16 句全是时间点"我逐句核过 16 句成立（1264 的 `the new dawn rule` 是定语而非时间状语，措辞偏松），"没有一句是被看见的景物"成立。
判定：**需作者改**（最小清单：① 表头去掉「黎明」二字；② 出处清单点名 golden/splendid sunrise 与 125/114 同源；③ 交代 16 是标记口径）。

---

## 组 1 · flat / smooth（1A 组 2）

A 原文表：**OK**。表内 6 行（53–58）与 [0].paragraphs[10] 逐字一致（英 6/6、中 6/6）；`paraZh` 逐字对；57 为 `rough` 卡词伙 `stayed rough` 原句 ✓。
正文裸文本引句 `They rented a small dry flat…`/`An old flat iron…`/971/594 全部逐字命中。
B 句号与共现：**OK**。2 段 = worklist `paras [[0,10],[2,8]]`；成员句 55(flat)/56(smooth)、699(flat)/701(smooth)/703(smooth)
均带标记；`sents [55,56,699,701,703]` 与 worklist 完全一致。
C 可 grep：**OK**。唯一英文串 30 条全部命中（2 条不命中为字段名与 `senses:["平坦"]` 引用）。逐条定位：
`dry flat`→卡+55 ✓、`flat land`→971 ✓、`flat tyre`→卡 tyre+934 ✓、`flat iron`→卡 iron+699 ✓、`flat seat cushion`→665 ✓、
`felt surprisingly smooth`→卡+56 ✓、`select smooth stones`→卡 select+594 ✓、`were shaved smooth`→670 ✓、`smooth intonation`→541 ✓、
`smooth wall plaster`→701 ✓、`Smooth moves`→1534 ✓、`crowded apartment`→卡 apartment ✓、`stayed rough`→卡 rough+57 ✓。
"select / shave / intonation 三张卡的词伙里都写着 smooth"——我逐张开卡核对，三张都含 ✓，属实。
D 宽度：默认行 38.0 = 实测 **38.0** ✓；总结句 24.0 = 实测 **24.0** ✓。
E 义项照抄：**BLOCK（字面）**。表头「这一段 `flat` 是租来的那间**公寓**」——「公寓」是 `flat`.m 原词，且在此直接充当该词的钩子。
默认行/core 干净（"说形状不陡不鼓"）。与拍板项 2 同类。
F 同源与厚度诚实：**MISMATCH（轻）**。`dry flat`↔55、`felt surprisingly smooth`↔56 同源，出处清单并列两源未点名（同组 0 的问题）。
证据强度未据此宣称独立双证 ✓。"本书 6 次全是形容词或名词、没有动词用法"——我把 6 句（55/665/699/825/934/971）逐句看了，成立。
判定：**需作者改**（① 表头去「公寓」或改写成不照抄义项的说法；② 点名 2 处同源）。

---

## 组 2 · endanger / jeopardise（1A 组 3）

A 原文表：**OK**。表内 5 行（10–14）与 [0].paragraphs[2] 逐字一致（英 5/5、中 5/5）；`paraZh` 逐字对。
B 句号与共现：**OK**。worklist `paras [[0,2]]`、`sents [11]` ✓ —— 草稿"1 段 1 句、两个词挤在同一句 11"与数据一致；
11 句里 `[[endanger:endanger]]` 与 `[[jeopardise:jeopardise]]` 确实同句共存 ✓。引"PRD 说的 3.7% 那一类"→ PRD §5.10 表格「同句仅 3.7%」原文如此，引用准确。
C 可 grep：**OK**。唯一英文串 15 条命中（`-ise/-ize`、`paraZh` 为元信息）。`endanger lives`→11 ✓、`jeopardise the whole school outing`→11 ✓、
`Pollution can endanger animals.`→endanger 卡 ex ✓、`Smoking can jeopardise your health.`→jeopardise 卡 ex ✓、
`endangered species`/`endanger health`→endanger 卡词伙 ✓（课文 0 命中，卡-only，草稿也这么标）✓；
"两卡互列同义词"：endanger.note 含 `jeopardize`（美式）、jeopardise.note 含 `endanger` ✓ —— 草稿报备的"拼写不一致"属实，是数据本身的两条，不是作者加的。
D 宽度：默认行 39.0 = 实测 **39.0** ✓；总结句 20.0 = 实测 **20.0** ✓。
E 义项照抄：**BLOCK（字面）**。表头「两个"危及"接的不是同一种东西」——「危及」是 `jeopardise`.m 原词、也在 `endanger`.m 里。
默认行/core 干净。同类，见拍板项 2。
F 同源与厚度诚实：**MISMATCH**。① 出处清单自称"7 条英文串"，按英文串行数实为 6 条（第 7、8 行是"两词互列同义词""拼写不一致"两条说明，不是引文）→ 计数虚高 1；
② "endangered species 这块**只挂在 endanger 上**"——`species` 卡的词伙里同样有 `endangered species`（extinct/invasive/endangered species 三条），
按字面是假的（按"本组两成员中只属左列"则成立），措辞要收紧。
"证据薄"部分作者自陈 `health` 撞车、卡零词伙，如实，**不作为退回理由** ✓。
判定：**需作者改**（① 表头；② 出处条数改 6；③ "只挂在 endanger 上"改成"本组两词里只属左列"）。

---

## 组 3 · degrade / deteriorate（1A 组 4）

A 原文表：**OK（1 处字符差异，非实质）**。表内 5 行（42–46）与 [0].paragraphs[8] 逐字比对（英 5/5、中 5/5）；`paraZh` 逐字对。
唯一差异：42 行草稿用直撇号 `Earth's`，数据原文是排版撇号 `Earth’s` —— 这是 A 项唯一一处标点不符，我判 MISMATCH 不判 BLOCK（同字符的两种字形，语义无损），
但落地进 `vocab.json` 时必须按数据原文取 `’`，否则这条引句又变成"书里查不到"。
B 句号与共现：**OK**。worklist `paras [[0,8]]`、`sents [43,44]` ✓；43 为 `[[deteriorate:…]]`、44 为 `[[degrade:…]]` ✓。
C 可 grep：**OK**。唯一英文串 22 条全部命中（1 条为 `paraZh` 字段名）。
`degrade fast`→卡词伙 + 44 ✓、`The soil degrades over time without proper care.`→卡 ex ✓、`upgrades them`→44 ✓、
`air began to deteriorate`→43 ✓、`The weather will deteriorate tomorrow.`→卡 ex ✓、`aggravate their frostbite`→43 ✓。
**明写的两条边界我复算成立**：① 4 条例证（44/卡 ex/43/卡 ex）确实全部不带宾语 → "及物性相同、这一档不写"属实；
② "degrade 的贬低人格义在卡 `m` 里没有"→ `degrade`.m = "v. 退化"，确无此义 ✓ 两条都是真否定行。
D 宽度：默认行 36.0 = 实测 **36.0** ✓；总结句 26.0 = 实测 **26.0** ✓。
E 义项照抄：**OK**。m 词「退化」「恶化」「变坏」一个都没进表头/默认行/core（写的是"变糟""越来越糟""掉档"，是转述）。
唯一观察：默认行"degrade = 物件被**用**得掉档"，而 44 的致坏因是"在严寒里"（in such cold）不是"用"——措辞与书证的因由略有出入，属可接受的钩子，不算照抄也不算编语义。
F 同源与厚度诚实：**OK**。作者主动点名"degrade 另有卡词伙 degrade fast 与课文重合"（正是 BRIEF §8 要求的点名），
并如实写"deteriorate 卡 note 为空、全部证据只有 ex 一句 + 课文 43 一句"，未把同源算成两条独立证据、未据此宣称方向一致。
判定：**可落地**（A 项唯一那处字符差异只要把 `Earth's` 换成数据里的 `Earth’s` 即可；除此之外 A–F 六项全过，是本批最干净的一组）。

---

## 组 4 · mild / moderate（1A 组 5）

A 原文表：**OK**。表内 7 行（65–71）与 [0].paragraphs[12] 逐字一致（英 7/7、中 7/7）；`paraZh` 逐字对；`subheads` = 「第二卷·归来——风暴过后是家园」✓ 原文。
B 句号与共现：**OK**。worklist `paras [[0,12]]`、`sents [66,67]` ✓，66 mild / 67 moderate 带标记 ✓。
C 可 grep：**基本 OK，2 处出处定位错**。唯一英文串 28 条命中；斜杠复合串 `mild fever / mild flu / …` 拆成 7 条后 6 条命中课文 1656–1692、
`mild ailment` 只在卡上（见 MISMATCH ①）。
逐条定位：`mild detergent`→658 ✓、`mild fruit flavour`/`not the sharp sour taste`→同句 850 ✓（"同句反义"属实）、`mild and spicy`→851 ✓、
`a grey mild pigeon`→301 ✓（且该句 `sentZh` 确有「温顺的鸽子」✓）、8 处健康串→1656/1657/1662/1666/1668/1669/1681/1692 逐号命中 ✓、
7 张健康卡（infection/hypertension/arthritis/flu/fever/fatigue/ailment）词伙里确实各写 `mild X` ✓ 逐张开卡核过。
**MISMATCH ①**：差异维度表把 `mild ailment` 也归到「课文 1656–1692」，但 `mild ailment` 在课文里只出现在 **1806**（且该处 `mild` 未被 `[[…]]` 标记），1656–1692 区间内没有它 → 出处位置写错（串本身查得到，不到 BLOCK）。
**MISMATCH ②**：「健康类阅读里它是"轻微"不是"温和"：1656–1692 连着 8 处」这 8 处里 1692 `two mild teas` 的本书译文正是「两种**温和**的茶饮」→ 该断言在自家 1 条书证上被推翻，8 处的方向数应为 7。
D 宽度：默认行 39.5 = 实测 **39.5** ✓（严格口径 37.0）；总结句 22.0 = 实测 **22.0** ✓。
E 义项照抄：**OK**。表头/默认行/core 都没出现 m 词「温和的」「轻微的」「适度的」（写的是"劲儿""量不超标""不到极端"）。本组正是 §6 的规范处置。
F 同源与厚度诚实：**BLOCK**。「moderate 课文只 1 句（67），但卡 ex + 卡词伙 + intensity 卡词伙共 **3 条独立文本，方向一致**」——
`moderate`.note 词伙与 `intensity`.note 词伙是**同一条字符串** `moderate intensity activities`（两张卡各抄一遍），
独立文本实为 **2 条**（卡 ex + 这条词伙），且据此下了"方向一致"的结论 → 按作业书 F 的第二档 = BLOCK。
（同批 1B 组 5 对这条词伙写的是「intensity 卡词伙段（**moderate 卡词伙同条**）」——同一处文本，1B 诚实、1A 计数虚高。）
判定：**需作者改**（① 证据强度改为"2 条独立文本"或点名两张卡同一词伙；② `mild ailment` 的课文号改 1806 或删；③ "8 处都是轻微"改 7 处）。

---

## 组 6 · outskirts / suburb（1B 组 1）｜`all_synonyms: true`

A 原文表：**缺失**。1B 全 5 组都没有 BRIEF §三.2 要求的「该段原文」表（只有"这一段在讲什么"散文）——
所以 A 项无表可逐字核，这个盲区这次由我人工补：我把 105/106 两句的表面形式 + `sentZh` + 段 18 `paraZh` 逐字对过，**全部一致**
（105「第二站是绿树成荫的郊区」、106「接着是镇外尘土飞扬的工厂区」、`paraZh`「送货路线一路向远」）。
B 句号与共现：**OK**。worklist `paras [[0,18]]`、`sents [105,106]` ✓；105 带 `[[suburb:suburb]]`、106 带 `[[outskirts:outskirts]]` ✓；
草稿写的"段 [0,18] 第 3 句／第 4 句"是 0 基段内序号，与我的自算一致 ✓；5 组的 `senses`/`all_synonyms` 我逐字段与 worklist 对过，引用无误。
C 可 grep：**OK**。唯一英文串 11 条全部命中；其余 5 条为字段名/文件名。
`on the outskirts of the city`→卡词伙 ✓ 且"与卡 ex 同一句"属实（ex = They live on the outskirts of the city.）✓、
`a leafy suburb full of waiting children`→105 连续子串 ✓、`on the dusty outskirts of town`→106 ✓。
**三条否定声明我全部反查为真**（不是躲门禁 1）：单数 `outskirt` 全库 0 命中 ✓、`suburbs` 复数 0 命中 ✓、
`suburban`/`suburbia` 在 vocab 无卡 ✓（只在两张卡的同义词栏出现，我也确认了词头确实存在这两词的那一栏）。
D 宽度：**BLOCK**。默认行标称「实测 19 字」，按规定的宽度口径实测 **55.0**（全角标点折 0.5 则 53.0），超 ≤40 上限 **15.0**；
其 §0.8 自述口径是"只数汉字"，不是 BRIEF §三.4 的宽度 → 口径不符 + 超限双重。总结行标称 6 / 实测 26.0（≤30 内，仍属口径不符）。
E 义项照抄：**BLOCK（字面）**。表头「"郊区"这两个词各自落在不同的地方」——「郊区」是两卡 `m` 的原词；core（"城边绕一圈那块地"/"城外住人的那一片"）与默认行干净。见拍板项 2。
F 同源与厚度诚实：**OK**。"卡上 + 课文共 2 处文本"的算法把同源的 词伙/ex 合并了 ✓；"全文各只出现 1 次"经我 count 属实（105、106 各 1，标记与文本两种口径都 1）。
判定：**需作者改**（① 默认行压到 ≤40 宽度；② 表头不照抄「郊区」；③ 补「该段原文」表）。

---

## 组 7 · contaminate / pollution（1B 组 2）｜`all_synonyms: true`

A 原文表：**缺失**（同上）。109/110 两句表面形式、`sentZh`（「玛雅查河流污染」「那些废料可能污染水井」）、段 19 `paraZh`
「仓库拒运有毒品；小玛雅查河污，桥缝拍照上报」我逐字对过 ✓ 全对。
B 句号与共现：**OK**。`paras [[0,19]]`、`sents [109,110]` ✓；109 pollution / 110 contaminate 带标记 ✓；"第 1 句／第 2 句" 0 基一致 ✓。
C 可 grep：**OK**。唯一英文串 21 条命中，含跨卡引用 `tackle pollution`（tackle 卡词伙 ✓）、`control pollution`（regulation 卡 ex 连续子串 ✓）、
`Pollution can endanger animals.`（endanger 卡 ex ✓）。否定声明反查为真：`a pollution`/`an pollution`/`pollutions` 三变体全文 0 命中 ✓、
`pollute`/`contamination`/`contaminated` 词头不存在 ✓。"本表引用的 8 条 pollution 搭配"——我数表内 pollution 串确为 8 条 ✓ 计数不虚。
D 宽度：**BLOCK**。默认行标称 14 / 实测 **49.0**（严格口径 46.5），超上限 **9.0**；总结行标称 12 / 实测 23.5。
E 义项照抄：**BLOCK（本批最硬的一次）**。默认行「pollution = **污染**这件事 … contaminate = 把哪样**弄脏**」两半都直接搬 `m` 原词；
`core` 两格「**污染**这一件事」「把哪样东西**弄脏**」同样照抄；表头又出现「"污染"一个当名字用」——同一义项词命中 默认行 + core×2 + 表头，共 4 处。
（我知道这组的实际区别落在词性上、且 §3 允许整组同义写词性差，但 E 的判据是位置判据，core 槽必须换说法。）
F 同源与厚度诚实：**OK**。未把同源重复计数，也未宣称"多处方向一致"。
判定：**需作者改**（E 的 4 处是硬伤：core 与默认行必须换成非义项词；另 D 压宽、A 补表）。

---

## 组 8 · grand / magnificent（1B 组 3）

A 原文表：**缺失**（同上）。115/116 两句 + `sentZh`（「古代国王建的宏伟宫殿」「眼前深邃的峡谷显得格外壮丽」）+ 611 全句与其译文「大阵仗的锦标赛」
+ 段 20 `paraZh` 我逐字对过 ✓ 全对。
B 句号与共现：**OK**。`paras [[0,20]]`、`sents [115,116]` ✓；611 =「段 [1,45] 第 0 句」我按展平序核过 ✓ 完全正确（章1 偏移 339 + 前 45 段句数 + 0 = 611）。
C 可 grep：**OK**。唯一英文串 17 条命中，包括 `a grand tournament`（611 ✓ + tournament 卡词伙 `grand tournament` ✓）、
卡 ex `The grand castle stood on the hill.` ✓、`The sunset over the mountains was magnificent.` ✓。
"两卡互不列同义词（grand note 只有词伙 / magnificent note 只有词伙）"→ 我逐张开卡，属实 ✓。
D 宽度：**BLOCK**。默认行标称 15 / 实测 **48.0**（严格口径 45.5），超上限 **8.0**；总结行标称 12 / 实测 21.5。
E 义项照抄：**BLOCK（字面）**。表头「"壮丽"这两个词在句子里站的位置不一样」——「壮丽」是两卡 `m` 共有原词；core/默认行/总结句干净。
F 同源与厚度诚实：**OK，且是本批最好的一条纪律**：作者主动把"grand 3 处全在名词前 / magnificent 2 处全在系动词后"
标明"是本库语料的计数结论，**不是**语法禁令"。计数我复算：grand 标记句 115、611 + 卡 ex = 3 ✓；magnificent 标记句 116 + 卡 ex = 2 ✓；卡词伙与 115/116 同源已被合并 ✓。
另 **MISMATCH（引用错号）**：§0.5 说 `items` 字段照 "PRD §8.4"、"§8.3 四条判据" —— PRD §8.3 是 RLS、§8.4 是 Edge Functions；
真正出处是 **§7.2（line 755 的 items schema）** 与 **§5.10（line 579 的四条文体制判据）**。落地时按错号去找会找不到。
判定：**需作者改**（D 压宽；E 改表头；引用错号改成 §7.2 / §5.10；A 补原文表）。

---

## 组 9 · heaven / paradise（1B 组 4）

A 原文表：**缺失**（同上）。128/129 两句 + `sentZh`（「头顶发亮的天空美得像天堂」「有人低语山谷恰似一座绿色乐园」）+ 段 22 `paraZh`
「赏日落观日食，黄昏天堂山谷，水汽蒸发」逐字对过 ✓ 全对。
B 句号与共现：**OK**。`paras [[0,22]]`、`sents [128,129]` ✓；128 heaven / 129 paradise 带标记 ✓。
C 可 grep：**OK**。唯一英文串 10 条命中；`go to heaven after death`→heaven 卡 ex ✓、`a green paradise`→卡词伙 + 129 ✓、
`They found paradise on a small island.`→卡 ex ✓。四条否定声明反查全部为真：`in heaven` 0、`heaven on earth` 0、`reading is heaven` 0、`a heaven` 0 ✓，
且草稿明写"本书没出现过的搭配，不写" ✓ 属合法否定行。`heaven` 卡 `note` 确为空串 ✓。
D 宽度：**BLOCK**。默认行标称 13 / 实测 **45.5**（严格口径 43.0），超上限 **5.5**；总结行标称 9 / 实测 19.0。
E 义项照抄：**BLOCK**。默认行「heaven = 死后去的**天国**」照抄 `heaven`.m（"天堂；天国"）；表头「两个"天堂"一个在头上、一个在脚下」照抄两卡 `m` 共有词。
core 两格（"死后去的那地方"/"地上顶好那一块"）倒是干净的——说明作者会写，默认行是偷懒抄 m。
F 同源与厚度诚实：计数诚实（卡词伙 `green paradise` 与课文 129 已标"同一处" ✓；"heaven 侧只有 2 条出处"我复算成立 ✓；薄本身不是退回理由 ✓）。
但 **BLOCK（语义升级）**：diff 行「同段两个比喻挨着，一个**不能加 a**、一个**天生带 a**」把 n=1 的分布写成禁令，
且被同组自己引的书证证伪 —— paradise 卡 ex `They found paradise on a small island.` 里 paradise 就是零冠词。
即"paradise 天生带 a"在数据里 2 处中 1 处不成立；heaven 侧只有 1 处，够不到"不能"。
对照 1B 组 3 同一张表里作者自己的纪律（"不是语法禁令，按出现次数写"），这一行是该文件内部自相矛盾的一处。
判定：**需作者改**（① 默认行去「天国」；② 「不能加 a／天生带 a」那一格改成出现次数口径；③ D 压宽；④ 补原文表）。
—— 作者把这组列为"5 组里唯一可退回"，我按作业书 F 末条不采纳"薄=退回"，证据够用。

---

## 组 10 · dense / intensive（1B 组 5）

A 原文表：**缺失**（同上）。145/146/147 三句 + 33 句（`the dense snow`）+ 各 `sentZh`（「又黑又密，长满高大的松树」「小心穿过茂密的积雪」「老师安排了紧凑的一天徒步」）
+ 段 25 `paraZh`「泉涌密林休整，集训遇鹿见溪光」逐字对过 ✓ 全对。
B 句号与共现：**OK**。`paras [[0,25]]`、`sents [145,147]` ✓；145 dense / 147 intensive 带标记 ✓；146 = intensity 标记句 ✓；
"density 的课文标记见段 [1,15] 第 3 句"→ 我核到 432 = ch1 p15 sent3 `[[density:density]]` ✓ 精确。
C 可 grep：**OK**。唯一英文串 28 条命中，含 `intensive farming`/`intensive farming practices`/`intensive language learning`（intensive 卡词伙三条 ✓）、
`an intensive English course`（卡 ex 连续子串 ✓）、`population density`（density 卡词伙 ✓）、`moderate intensity activities`（intensity 卡词伙 ✓）。
否定声明反查为真：`intensive snow` 0、`dense English course` 0 ✓；`concentrated`/`compact`/`focused` 三词头均不存在 ✓（我按 vocab 键名逐个查过）。
D 宽度：**BLOCK（本批最大偏差）**。默认行标称 9 / 实测 **51.0**（严格口径 48.5），超上限 **11.0**；总结行标称 11 / 实测 19.5。
E 义项照抄：**OK**。core/默认行/表头都没出现「密集的」「稠密的」原词（写的是"挤得密不透风""排得满"）；表头的「密」是单字转述、非 m 原词，放行但记一笔。
F 同源与厚度诚实：**OK**。把"moderate 卡词伙同条"（与 intensity 卡重复的同一条词伙）主动点名 ✓，正是 1A 组 5 该做而没做的写法。
判定：**需作者改**（只有 D 一条：默认行压宽；A 补原文表为版式补齐）。

---

## 文件级发现（不属单组，但必须随批处理）

1. **1B 全 5 组缺「该段原文」表**（BRIEF §三.2 明列为每组必产出，且 §三 写的是"照批次 1 的版式"）。
   本次靠我把裸文本引句逐字回数据，才确认 1B 的抄写其实**零错字**；但批次 2 的 45 个切片会照抄这个缺表的版式，
   门禁 1 不查裸文本、门禁 2 没有表可查 → 抄错/并句/译句错位这类缺陷将彻底无人把关。**建议：把"每组必须有原文表"写成硬回件条件。**
2. **1B 附录"段号互不相同（18/19/20/22/25）→ 挂段末不会互相抢位置"不成立**：段 [0,20] 同时是 1A 组 1（dawn/sunrise）的主锚点段，
   批次 1 落地后该段末会挂 2 张卡。按 BRIEF §9 这本身没问题，但这句结论写错了 → MISMATCH。
3. 两份草稿的 10 组数据（words/senses/paras/sents/all_synonyms）我逐字段与 `work/compare_groups_worklist.json` 对过，**10/10 一致**；
   worklist 下标为 0/1/2/3/4（1A）与 6/7/8/9/10（1B），idx 5 不在这两份里。
4. 我复算的宽度用两种口径都给了数（全角标点记 1 / 折 0.5），1A 的标称只能在全角记 1 口径下精确复现，
   建议把 BRIEF §三.4 的"CJK 记 1"补一句"全角标点按 1 计"，否则不同 agent 的标称值系统性差 1–2.5。

## 汇总

组数 10 / BLOCK 9 组（BLOCK 条目 14）/ MISMATCH 条目 10 / 全项通过 0 组；**可落地 1 组**（idx 3 · degrade·deteriorate，即 1A 组 4，只需统一一个撇号字符）。

- BLOCK 分布：1A 组 0(E)、组 1(E)、组 2(E)、组 4(F)；1B 组 6(D,E)、组 7(D,E)、组 8(D,E)、组 9(D,E,F)、组 10(D)。
- 1B 的 5 条「默认那一行」全部超 ≤40 上限（实测 45.5 / 48.0 / 49.0 / 51.0 / 55.0），且标称用的是"只数汉字"口径 —— 这是本次最大的单一缺陷，5 组同因。
- **A 项（手抄原句）基本干净**：1A 29 行表格做**字节级**严格比对后只有 1 处不符（42 行 `Earth's` vs 数据的 `Earth’s`，撇号字形），去 `**` 加弯直引号归一后 29/29 全对；1B 的裸文本引句（6 处 `sentZh`、5 处 `paraZh`、33/105/106/109/110/115/116/128/129/145/146/147/611 各句）逐字 0 错。
  这次没抓到手抄错字，但它是"没人查过"而非"查过没问题"，门禁 2 之后仍建议保留原文表要求。

## 需要人拍板的 3 条（不拍这 3 条，批次 2 的 45 片会按各自理解继续跑偏）

1. **默认行的宽度上限怎么算、超了怎么办**（影响 1B 全部 5 组 + 批次 2 全体）。
   1B 按"只数汉字"标称 9–19，换成 BRIEF §三.4 规定口径实测 45.5–55.0，5 条全部超 ≤40。
   问题在于：§四「他点头的口味」里第 5 行（`outskirts = 城边那一圈（on the dusty outskirts of town，工厂在）；suburb = 城外那片住宅区（a leafy suburb，孩子在等）`）
   **本身就是这条 55.0 的超宽行** —— 也就是口味母本与宽度硬约束互相打架。请二选一：
   (a) 上限按"汉字数 ≤40"解释、把 §三.4 的宽度式改成 §三.4 的注释口径（则 1B 的 D 全部撤销，1A 也不受影响）；
   (b) 维持宽度 ≤40 → 则 §四 那一行要么删掉要么重写成 1A 那种 36–39.5 的形状，5 组 1B 默认行照新形状改写。
   我倾向 (b)：1A 的 5 行全部落在 35.5–39.5，证明这个上限写得出来也不牺牲口味。

2. **E（卡 `m` 中文词不许进表头/默认行/core）要不要给"引用并当场否定"开口子**。
   1A 组 0/1/2 与 1B 组 6/7/8/9 共 **7 组表头**都写成「这一段两个词都译 X，但用法不是一回事」——
   这正是 BRIEF §6 要求的"把标题改写成这一段各领哪样东西"的写法，却按字面撞了 E。
   要区分的是：① **默认行/core 照抄**（1B 组 7 的「污染这一件事」「把哪样东西弄脏」、组 9 的「死后去的天国」）无论如何都得改，没有争议；
   ② **表头引用共同译文 + 当场否定**（7 组）是否放行。请给一句话裁决，例如
   「表头允许出现共同译文的条件：句内必须紧跟否定，且该词不得出现在 core/默认行」。
   不裁决的话，批次 2 会一半 agent 报 BLOCK、一半放行。

3. **1A 组 4（mild/moderate）的"3 条独立文本、方向一致"按 BLOCK 退回重算，还是只改措辞**。
   `moderate`.note 与 `intensity`.note 的词伙是同一条字符串 `moderate intensity activities`，独立文本实为 2 条，
   而作者据此下了"方向一致"的结论 → 作业书 F 第二档 = BLOCK。
   1B 组 10 对同一条词伙写的是"（moderate 卡词伙同条）"，说明这批人知道规矩、只是在"证据强度"里少减了 1。
   请定：这条只改 1 行措辞即可落地，还是连带要求 1A 全篇把"卡词伙 + 课文"并列处都补上同源点名（组 0、组 1 各 2 处）？
   我建议后者——因为它和 §8 是同一个洞，一次补完比批次 2 再犯便宜。
