# 门禁 2 审核 · 批次 6 前半（`work/辨析草稿/6_01.md` + `6_02.md`，10 组 / worklist_idx 178–187 / 全在章5 段42–50）

> 审核方式：全部量测自己重跑，草稿自报值一概不采信。
> **A**：脚本化逐字比对 —— 去 `[[词头:表面]]` 标记、去 `**`，英文与 `sentZh` 双栏，撇号（数据里是弯撇号 `’`）与大小写单独归一化一轮；45 行表格 / 90 个单元格。
> **B**：独立重建 1833 句全局索引（实测六章 339 / 312 / 232 / 394 / 215 / 341，偏移 `[0,339,651,883,1277,1492]` 与书上一致），逐组回算全局句号、段内序号、`paraZh`、成员标记；`subheads[5]` 非空位实测 = 第 0、20 两处。
> **C**：反引号英文串 240 + 203 = **443 条**整串回两份数据；**没套反引号的英文**另扫 149 + 137 = **286 段**（门禁 1 结构上看不到这一层）；`「」`中文引文 108 + 88 = **196 条**回 `sentZh` / `paraZh` / 卡字段。存在性断言（"0 处／没这样用过／都有卡／属别的组"）反向 grep，共回查约 100 条断言、30 余条计数。
> **D**：`tools/width_rule.width` 逐条复量（默认行、总结句、以及 `core` 的 ≤12 字）。
> **E**：按卡 `m` 切档，扫 `core`／默认行／表头／总结句／维度名五个槽。
> **F**：items 表与 diff 表按 `|` 数逐行核列数；同源／派生对的条数重算；中文造景逐格回数据。
> 门禁 1 我自己也重跑了一遍：两份都 `门禁 1: PASSED（全部英文串可回溯）` ✓。
> 本审核只读数据 + **只写本文件**；未改草稿、未碰 `shadow/data/*`、`tools/*`、测试，未做任何 git 写操作。
> **自证未跑写盘模式**：`work/辨析审核/land_preview.json` mtime = **2026-09-20 23:24:49**，早于 `6_01.md`（09-21 03:57:03）与 `6_02.md`（09-21 09:18:04），也早于本审核开始的时间；`tools/width_samples.json` 仍是 09-20 21:28:25（无人跑过 `width_rule.py --bless`）。

组数 10 / **BLOCK 1**（组179）/ **MISMATCH 6**（组178、180、183、185、186、187）/ **通过 3**（组181、182、184）

**底账（我这一侧的原始事实，供抽查）**
- 原文表 45 行**逐字全中**，无一格偏差（含 1748/1749/1750/1757/1758/1761/1765/1766/1768/1772/1773/1783/1787/1796 的弯撇号与大小写）。
- 全局句号：段42=1744–1749、43=1750–1755、44=1756–1761、45=1762–1767、46=1768–1773、47=1774–1779、48=1780–1785、49=1786–1791、50=1792–**1806**（15 句，与 6_02 所写一致）；10 组声称的 `sents` 与切片包、与我回算的段内序号全部相符；21 个 (词,句) 成员标记位全部真以 `[[词头:…]]` 出现。
- 10 个成员词的"标 1–2 处／未标 0 处"全部重算为真（唯一例外：hate 标 1 + 未标 1 = 1539，草稿写明 ✓；整词 `mad` 全书实测 1 处、`strict` 2 处，`stricture`757／`strictly`1223 另档 ✓）。
- 宽度 20 条标称值**分毫不差**（31.5/33.0/31.5/34.5/35.0 + 28.0/25.5/23.0/23.5/23.0；36.5/37.0/36.0/34.5/39.0 + 23.0/28.0/23.5/26.5/22.0），全部在 ≤40 / ≤30 内；`core` 20 格实测 6.0–10.0，全在 ≤12 内。
- 中文计数断言全部重算为真：「严厉」7（stern 5 / harsh 2）、「类似」4（全在卡）、「相似」1、「悲痛」6（全在卡）、「悲伤」8、「难过」3、「悲惨」4、「恶劣」2、「闷闷不乐」2、「憎恨」4、「仇恨」1、「疯狂」2、「狂热」1、「骚扰」1、「打扰」2、「烦扰」0、「妒忌」0、「嫉妒」1、「眼红」1、「羡慕」0、「不情愿」0、「不愿意」0、「不愿」3、「别扭」1、「笨拙」1、「尴尬」1、「不灵巧」0 —— 与草稿写的每一处落点一致。
- 卡侧字段归属全部开过卡验：severe/strict/resemble/similar/grief/grieve/miserable/wretched/hate/hatred/crazy/mad/harass/bother/envy/jealous/reluctant/unwilling/awkward/clumsy 的 `m`／`ex`／`exZh`／`note` 与音标逐格对平；`grieve`、`hatred`、`harass`、`envy`、`jealous`、`awkward`、`clumsy` 的 `note` **确实是空串**，草稿如实报缺 ✓。
- 落地卡现状：`vocab.json` 实测 **181 张 `cmp` 卡**；`at=[5,42]` 只有 rigorous（worklist 177，`sents`=[1748]）✓；`[5,43]/[5,44]/[5,45]/[5,46]/[5,48]/[5,49]/[5,50]` 实测**零张** ✓ → 6_01 的"同段已挂 177"与 6_02 的"本片五组都是首挂"两条都成立。
- **本片最大的一族问题**：草稿把邻居词说成"属别的组／别的切片"，而我把 220 组 worklist 与 181 张已落地 `cmp` 全扫了一遍 —— `sorrow / sadness / mourn / hesitate / guilty / embarrass / regret / repent / ashamed / ridiculous / stupid / careless / oblivious / insult / unkind / uneasy / fear` **十七个词头不在任何辨析组里**（只有 `doubt / sceptical / suspicion`＝idx 216 一条，落在 slice44，6_02 组3 引它是对的）。四处犯这毛病，见各组 F 行。

---

## 组178 · severe / strict（段 [5,42] ｜ 句 1748 / 1749 ｜ 严厉 ｜ false）

A 原文表：**OK**。1744–1749 六行英中逐字与数据相同；表内只粗 `strict`、`severe` 两个成员词（§五.16 合规），1748 同句的 rigorous／quiet、1749 的 spring／mutual 都没粗 ✓。
B 句号与共现：**OK**。段42 = 1744–1749，`strict` 在 i4、`severe` 在 i5，与切片包 `sents [1748,1749]` 相符；旁证 1007 = 章3段20第4句 ✓（实测 `[[strict:strict]]`）、1223 = 章3段57第1句 ✓（该句只标 perform／enforce，strictly 未标 ✓）、757 `stricture` 另卡 ✓。`paraZh`「饮食起居细调，天真发问受夸。」逐字对平（数据带句末句号，草稿引文省句号 —— 与批次 1–5 全片同例，不计）。"起居细调"由 1747 撑住 ✓、"天真发问受夸"归 1744 ✓。
C 可 grep：**OK（正面证据无一虚报）**。我亲自查到的条数：severe 卡 `ex`/`note` 4 串、strict 卡 `ex`/`note` 4 串、punishment／jam／cause／injury／enforce 五张卡的跨卡同串 5 条（逐张开过：`severe punishment` 在 punishment、`severe traffic jams` 在 jam、`cause severe injuries` 在 cause 与 injury 两处、`enforce stricter penalties` 在 enforce）✓；课文侧 1749／1748／1007／1223／1747 五句与译文全部逐字命中；「严厉」7 句的英文（1247、1452、1467、1476、1483 = stern；1249、1347 = harsh）逐句开过，**stern 有卡且 `m` 真是「n. 船尾」、harsh 实测无卡** ✓。否定行回查**无一虚报**：`severely`、`severity`、`misery` 类派生、`a severe teacher`、`severe about`、`strict cough`、`severe rules`、`more severe`、`severest`、`severe weather`、`strict discipline`、`strictly speaking`、`a severe test`、`severe hardship` 十四串两份数据实测各 0 ✓；"本书没有一处 severe 写人"在 severe 的 5 条文本上为真 ✓；"strictly 本书无卡"✓（`strictly` 不是词头）。
D 宽度：默认行 标称 31.5 / **实测 31.5** ✓；总结句 28.0 / **实测 28.0** ✓。不抬不压，措辞口径正确。
E 义项照抄：**OK**。「严厉」只在 `sense` 槽与被否定的表头（引用＋当场否定，§五.11 放行）；`core`（病、灾、伤、罚那一档／写下来管着人的那条线）、默认行、总结句、五个维度名全部干净。
F 结构性与诚实：列数 **OK**（items 表 3 行 ×7 格与表头齐、diff 表 8 行 ×5 格齐、原文表 7 行 ×3 格齐，本片 10 组无一格左移）。同源处理**大体诚实**（`strict rules` 点名与 1748 同源；severe 三条词伙按 §五.8 各算 1 条；跨卡重复登记已点名），**但有两处对不上自己的账**（见清单）。造景：**OK**，无编造物件。
判定：**需作者改（MISMATCH，最小清单 3 条）**
1. 「证据强度」格：`strict 侧独立文本 6 条（课文 2 + 卡 ex 1 + 卡词伙 3，另 enforce 卡词伙 1 条）` 与同组「数据边界」的 `strict 卡词伙 strict rules 就是课文 1748 那半句（同源，不另计）` 互相打脸 —— 按 §五.8 合并后是 **5 条**。改成：`strict 侧独立文本 5 条（课文 2 + 卡 ex 1 + 卡词伙另 2 条；strict rules 与 1748 同源不另计），另 enforce 卡词伙 1 条旁证`；同组「数据边界」那句 `来自 severe 侧 5 处 vs strict 侧 6 处的分布` → **5 处 vs 5 处**（severe 侧 5 条我复点无误，不用动）。
2. items 表 strict 的 `scene` 格：`条文、审查、罚则（卡 note 三条词伙）` —— strict 卡 `note` 三条实测是 `strict rules, strict censorship, imposing overly strict rules`，**没有一条是罚则**；罚则来自 enforce 卡的 `enforce stricter penalties`（本组出处清单里归对过，只有这一格串了位）。改成：`条文、审查（卡 note 三条词伙）＋罚则（enforce 卡词伙）`。
3. 文件尾「附：本切片复核索引」两处数与列不合：`5 组去重后 6 个成员句` 后面列的是 1748、1749、1750、1757、1758、1761、1765、1766 = **8 个**；`卡上词伙与课文同源的六条` 后面列了 `strict rules、resemble real trees、similar lines、using similar lines、deep grief、stay miserable、feeling wretched` = **七条**。按实测改成 8 / 七。（附带一句建议级：第 28 行给 1007 的引号写作「清晨那套**作息**有多严」，数据 `sentZh` 是「清晨那套**规矩**有多严」—— 建议去掉引号或照数据写，同段的 177 号落地卡也用了"作息"这一说法，别让它读起来像逐字引文。）

---

## 组179 · resemble / similar（段 [5,43] ｜ 句 1750 ｜ 类似 ｜ false）

A 原文表：**OK**。1750–1755 六行逐字（1750 一句里 `resemble`／`similar` 两处成员词都粗、1751 的 familiar／naked／spring 与 1752 的 bare／private 一律不粗 ✓）。
B 句号与共现：**OK**。段43 = 1750–1755，两词同在 1750（i0），与 `sents [1750]` ✓；`paraZh`「严字当头，互助中画技渐长。」逐字对平，且 §五.12 报备**属实**：前四字与「互助」说的是段42 的 1748／1749（实测 1749 = `mutual help` ✓），只有「画技渐长」对得上 1750 ✓。
C 可 grep：**OK**。正面证据全中（1750 整句 + 7 条子串、`The boy resembles his father.`、`The two dogs are similar in color.`、两卡 `note` 的词伙与同义词栏逐字：resemble = 「同义词：like, similar；词伙：resemble real trees」、similar = 「同义词：like；词伙：similar lines, using similar lines」）✓；`like` 词头实测**无卡** ✓。否定行**无一虚报**：`resemblance`/`resembling`/`resembled`/`similarly`/`similarities` 五个派生形两份数据实测 0 ✓；「类似」全数据 4 处且**恰好**是 resemble m／similar m／parallel m／unique exZh（草稿点的名一张不差）、课文 0 ✓；「相似」课文实测 1 处＝1750 ✓；`resemble to`、`similar to`、`closely resemble`、`bear resemblance to`、`similar to each other`、`sound similar` 六串 0 ✓。
D 宽度：默认行 33.0 / **实测 33.0** ✓；总结句 25.5 / **实测 25.5** ✓；`core` 9.0 / 8.0 ✓。
E 义项照抄：**不符（本组唯一必改点）**。`similar` 的 `core` 写成「**相像的**那批摊在前」，「相像的」正是 similar 卡 `m`（「类似的；相像的」）的字面 —— §五.4「core 和默认行一律换掉」，AUDIT_BRIEF 的 E 行把 core 命中定在 **BLOCK** 档。默认行／总结句／维度名／表头都干净（表头那句"worklist 给的共同义项是「类似」，可本书课文从没把「类似」这三个字用出来过"＝引用＋当场否定，§五.11 放行 ✓）。*定级说明：批次 5 组142 的同型泄漏（`core`＝「十来岁那几年」）当时被降级为 MISMATCH；我这一格按简报字面记 BLOCK，两者改法一样、都是一格，取哪一档请他一句话钉死（见文末第 2 条）。*
F 结构性与诚实：**OK**。列数齐（items 3×7、diff 8×5）；§五.8 同源合并做对了（三条词伙全部就是 1750，一条不另计 → 两侧各 2 条、全组 4 条文本，我复点相符）；§五.14 的"false 的真原因是同义词栏单向"我核过为真 ✓；`all_synonyms: false` 与 worklist 一致 ✓。两处措辞请顺手收：diff 表 similar 行"本书一次都没用过"similar to sth"那个**最常见框架**" —— 前半句是数据事实、后半"最常见"是语感判断（BRIEF §一 禁"自己的英语语感"当来源），建议删那四个字；组头"本段另三张卡（familiar / bare / private 等）"实测该段共 15 处标记、除两个成员词外还有 **13 个**被标记的词头，写成"另三张"是低估。造景 **OK**（速写／真树／旧书上的线条／两只狗的颜色，全部对得上数据）。
判定：**BLOCK（1 处，改一格即回，不是退回）**。最小清单：
1. items 表 similar 的 `core`：「相像的那批摊在前」→ 换掉 `m` 字面，建议「**顶在名词前那批**」（实测宽度 7.0 ≤12，纯中文、无需回数据）。对比关系不丢（resemble 侧「像的那样东西摆后面」不动，仍是"动词后摆宾语 vs 形容词顶名词前"）。
2. 改完把该组小标题／边界里没有涉及宽度的表述保持不动（core 不参与 ≤40 口径，无需换标称值）。

---

## 组180 · grief / grieve（段 [5,44] ｜ 句 1757 / 1758 ｜ 悲痛 ｜ false）

A 原文表：**OK**。1756–1761 六行逐字（1757 `[[grief:grief]]`、1758 `[[grieve:grieve]]` 都粗，同句的 agony／miserable／outside／distress／sadness／gloomy／disappoint／discourage／wretched 一律不粗 ✓）。
B 句号与共现：**OK**。段44 = 1756–1761；1757 = i1、1758 = i2，"相邻两句"属实；与 `sents [1757,1758]` 相符。`paraZh`「湖畔静心，直觉与想象生长。」逐字对平，§五.12 报备**实质属实**（本段六句 1756–1761 里没有湖、没有直觉、没有想象之岛，草稿对段44 主题栏不可用的判断成立 ✓；唯一笔误：草稿写"1752 的湖"，湖实测在 1751「The lake path…」，1752 是暖沙与芦苇）。旁证 1759／1762／1686 编号与译文全部回查为真 ✓。
C 可 grep：**OK，全片最干净的一组**。`He felt deep grief after his dog died.`／`He grieves for his lost dog.`／`deep grief`／`grieve for long`／`over lost games`／1757、1758、1759、1762 四句及其译文 —— 逐条命中；`grieve` 卡 `note` **实测是空串**（草稿如实报缺、并据此禁止给 grieve 补搭配 ✓）。否定行回查**无一虚报**：`grieved`/`grieving`/`grievance`/`grief for`/`grief over`/`grieve for his loss`/`deeply grieved`/`grief and loss`/`in grief`/`grieving family`/`buoy sb up in grief` 十一串 0 ✓；「悲痛」两份数据 6 处且恰好 grief m+exZh、grieve m+exZh、sorrow m+exZh，课文 0 ✓；「悲伤」课文实测 **8** 处、1757→grief／1759→sadness／1686→sorrow 三处对得上 ✓；「难过」实测 **3** 处（534 sad、1758 grieve、1762 mourn）✓。唯一不实的一格见 F。
D 宽度：默认行 31.5 / **实测 31.5** ✓；总结句 23.0 / **实测 23.0** ✓；`core` 6.0 / 6.0 ✓。
E 义项照抄：**OK**。「悲痛」「使伤心」只在 `sense`；`core`（记得的那一团／难过不了太久）、默认行、总结句、维度名干净；表头属"引用＋否定"✓。
F 结构性与诚实：**列数 OK**（items 3×7、diff 9×5）。**同源诚实做得对**：明写"这一组不是两个词，是一个词的两形"、不硬凑三条语义差异、只给句法位／介词框架／中文落点三格，且 grieve 的「使伤心」档只报备不造句 —— 这正是同源对要求的写法。两处措辞要收：① 出处清单说四张卡"句式都挨着 `He felt ...` 与 `his dog`"，实测 mourn 那张是 `She mourns her dog every day.`（既非 He felt 也不是 his dog），"都"字过宽；② 「不写的」那一格写「sorrow、sadness、mourn **各是别的组**、别的卡」—— 我把 220 组 worklist 与 181 张落地 `cmp` 全扫过：这三个词头**不在任何辨析组里**，只有卡（§五.15 的"关于有没有的那句话本身必须查得到"）。造景 **OK**。
判定：**需作者改（MISMATCH，最小清单 2 条）**
1. 「不写的」格：`sorrow、sadness、mourn 各是别的组、别的卡` → `sorrow、sadness、mourn 各是别的卡（三词都不在 220 组 worklist 的任何辨析组里，已扫）`。
2. 出处清单旁证格：`句式都挨着「He felt ...」与「his dog」` → `三张卡的 ex 是 He felt … his dog 那一形，mourn 那张是 She mourns her dog every day.`（建议级：组头"1752 的湖"→"1751 的湖"）。

---

## 组181 · miserable / wretched（段 [5,44] ｜ 句 1758 / 1761 ｜ 悲惨 ｜ false）

A 原文表：**OK**。1756–1761 六行逐字，只粗 miserable／wretched ✓。
B 句号与共现：**OK**。1758 = i2、1761 = i5，与 `sents [1758,1761]`；`paraZh` 与段44 错位的报备同上组（属实）。旁证 1747（段42 i3）、333（章0段56 i4）、1759 编号与译文全部回查为真 ✓。
C 可 grep：**OK**。`He felt miserable after losing his job.` / `He felt wretched after losing his job.` / `exZh`「他失业后感到很悲惨。」两条**只差形容词、中文一字未改**（实测为真 ✓）；`stay miserable`、`feeling wretched` 两卡唯一词伙与课文同源 ✓。否定行回查**无一虚报**：`misery`、`wretchedly`、`miserable weather`、`a miserable failure`、`wretched conditions`、`feel absolutely miserable` 六串 0 ✓；「悲惨」两份数据 4 处＝两卡 m + 两卡 exZh、课文 0 ✓；「恶劣」两份数据 **2** 处＝wretched m + foul m、课文 0 ✓；「闷闷不乐」课文 **2** 处＝1758 + 333（333 给 `stayed sad`）✓。
D 宽度：默认行 34.5 / **实测 34.5** ✓；总结句 23.5 / **实测 23.5** ✓；`core` 7.0 / 7.0 ✓。
E 义项照抄：**OK**。「悲惨」「恶劣」只在 `sense` 与被否定的表头；`core`（心里那股不乐意／身上难受加疲惫）、默认行、总结句、维度名干净。
F 结构性与诚实：**OK，且是本片最诚实的一格**。列数齐（items 3×7、diff 8×5）；§五.14 三件齐全部做到（同形照写 + 两卡无同义词栏故 false 有据 + 两句各算一侧书证），并明写"卡上两句完全不能区分这两个词、能区分的只有 1758 与 1761" —— 这正是"那一格的结论只由那一处撑着、不冒充常识"的写法。合并后全组 4 条英文文本我复点相符。造景 **OK**（门外等的朋友们／湿透的鞋子／丢工作，全在数据里）。唯一措辞笔误：组头"同段**隔三句**" —— 1758 与 1761 之间是 1759、1760，**隔两句**（建议级，不动任何结论）。
判定：**OK 可落地**（附 1 条建议级措辞：「隔三句」→「隔两句」）。

---

## 组182 · hate / hatred（段 [5,45] ｜ 句 1765 / 1766 ｜ 憎恨 ｜ false）

A 原文表：**OK**。1762–1767 六行逐字，只粗 hate／hatred ✓（1765 的 irritate／progress、1766 的 nuisance／deal、1767 的 bitter／disgust／vex 都没粗）。
B 句号与共现：**OK**。段45 = 1762–1767，1765 = i3、1766 = i4；"相邻两句、一前一后收同一桩事"属实。`paraZh`「剧痛渐缓，不再久悲过去。」逐字对平，报备**属实**：它说的正是段44 的 1757（`leg agony had eased`）与 1758（`did not grieve for long`），本段六句讲的是错过的比赛／康复太慢的怒气／不吵不闹地等／公交／久等 ✓。旁证 1539（章5段7 i5，`hates` 实测**未打标记** ✓）、1763／1764、1247 等编号与译文全对。
C 可 grep：**OK**。`I hate waking up early.`、`He felt hatred for the man who hurt his brother.`、`He hates the bureaucracy in government offices.`、`hate speech`（实测只挂在 hate 自己卡 `note`，课文 0 ✓）逐条命中；`hatred` 卡 `note` **实测是空串** ✓。否定行**无一虚报**：`hateful`/`hatreds`/`hate for`/`hates for`/`hatred of`/`deep hatred`/`hate him`/`self-hatred`/`hate to say`/`bear no hatred`/`hated him`/`intense hatred` 十二串 0 ✓；「憎恨」两份数据 4 处＝课文 1766 + hatred m + hatred exZh + hate m，**没有一处英文是 hate** ✓（草稿的"只兑现一半"为真）；「仇恨」1 处＝hatred m ✓；整词 `hat*` 实测只有 1539／1765／1766 三处（757 一类误命中不存在）✓。
D 宽度：默认行 35.0 / **实测 35.0** ✓；总结句 23.0 / **实测 23.0** ✓；`core` 8.0 / 10.0 ✓。
E 义项照抄：**OK**。「憎恨」「仇恨」「讨厌」只在 `sense`（`scene` 里那句"他放下对久等的憎恨"是 1766 的 `sentZh` 原文，属引数据不是宣称义项）；`core`、默认行、总结句、维度名干净；表头＝引用＋否定 ✓。
F 结构性与诚实：**OK**。列数齐（items 3×7、diff 9×5）；**派生对没有算成两条独立出处**（明写"这一组不是两个词源"，条数 hate 4／hatred 2 我复点相符：hate 那条唯一词伙 `hate speech` 不在课文、计 1 条独立文本是对的）；§五.13 两档分开（hate 标 1 + 未标 1 = 1539，且明写"1539 那处不在共现段，别与 1765 并成一条"）；§五.6 禁升级（"不许说成本书里 hate 不表憎恨"）✓；比较级／语域一类常识没有越进来。造景 **OK**。
判定：**OK 可落地**。

---

## 组183 · crazy / mad（段 [5,46] ｜ 句 1772 / 1773 ｜ 疯狂 ｜ false）

A 原文表：**OK**。1771–1773 三行逐字（1773 数据无句末标点差异，草稿与数据同为"…也不许" ✓）；只粗 mad／crazy，1772 的 radical／list、1773 的 wicked／hurt 不粗 ✓。
B 句号与共现：**OK**。段46 = 1768–1773，1772 = i4、1773 = i5，"相邻两句、正是这一段最后两句"实测为真；`paraZh`「放下怒气，学会平静等待。」逐字对平、报备属实（它说的是段45 的 1763／1764）；`subheads[5]` 附近无非空项 ✓。
C 可 grep：**OK**。`He wore a crazy hat to the party.`／`He became mad after losing his job.`／`crazy games`／`mad rush`（两条词伙实测就是 1773／1772 本句 → 同源不另计 ✓）、旁证 `He thinks it's insane to drive without a license.`（insane 卡 ✓）、`control wild desire`（desire 卡词伙 = 课文 1560 ✓，那句译文「狂热渴望」✓）、1664 编号与译文 ✓。否定行**无一虚报**：`crazy about`/`mad at`/`go crazy`/`drive him mad`/`like crazy`/`crazy idea` 六串 0 ✓；「疯狂」课文逐句译文实测 **2** 处（1664 insane、1772 mad）✓，第三处在段48 主题栏（实测 ✓）；「狂热」课文 1 处 = 1560 ✓；`furious / anger / irritate / vex` 四张卡都在 ✓、mad／crazy 两卡 `m` 里都没有"生气" ✓。
D 宽度：默认行 36.5 / **实测 36.5** ✓（本片贴线第二条，别再往上加字）；总结句 23.0 / **实测 23.0** ✓；`core` 8.0 / 7.0 ✓。
E 义项照抄：**OK**。「疯狂的」「狂热的」只在 `sense`；`core`（湿石头上那局游戏／一周十本那阵赶）、默认行、总结句干净；表头＝引用＋收窄 ✓。
F 结构性与诚实：列数 **OK**（items 3×7、diff 7×5）。同源两条点名合并 ✓、false 有据（两卡 `note` 只有词伙段）✓、造景 **OK**（帽子／派对／失业，全在卡上）。**一处口径越线**：diff 表 mad 那一行末句写「**本书**只在一句"没这么干"的否定里给它露了面」—— 实测 `mad` 全书 2 处（1772 否定式 + 卡 `ex` `He became mad after losing his job.`，后者不是否定句），该行维度名是"本段它挂在哪个名词前面"，把"本段"写成"本书"就成了一处可被反查的不实。
判定：**需作者改（MISMATCH，最小清单 1 条）**
1. 该行「本书只在一句"没这么干"的否定里给它露了面」→ 改「**本段**只在一句"没这么干"的否定里给它露了面」（或"本书课文里只有 1772 这一处，且在否定式里"）。其余不动。

---

## 组184 · bother / harass（段 [5,46] ｜ 句 1768 ｜ 烦扰 ｜ false）

A 原文表：**OK**。1768–1770 三行逐字；只粗 harass／bother ✓。
B 句号与共现：**OK**。1768 = 段46 i0，与 `sents [1768]` ✓；"同句、同一 `not to … nor to …` 否定框架、共用主语 `He asked kids`"实测为真 ✓；`subheads[5]` 附近无非空项 ✓；组头"同段末还要挂本切片组 1（crazy／mad）"实测 worklist 183 也挂 [5,46] ✓（切入角不重复，§五.9 合规）。
C 可 grep：**OK**。`He asked kids not to harass weak ducks, nor to bother old cats sleeping by the wall` 及其 6 条子串、`Don't bother to clean the room, I'll do it later.`、`He harasses his coworkers with loud jokes.` 逐条命中；`bother` 卡 `note` = 「词伙：bother old cats」（与 1768 同源 ✓）、`harass` 卡 `note` **实测是空串** ✓。否定行**无一虚报**：`bothers`/`bothered`/`harassed`/`harassment`/`bothersome`/`harass sb into doing`/`bother with`/`don't bother me`/`not to bother` 九串 0 ✓（`harasses` 实测只在它自己卡 `ex`、课文 0 ✓）；「骚扰」课文译文 1 处（1768）✓、"只 harass 一张卡 `m` 有"✓（该卡 `exZh` 也含，属同卡，草稿括号已声明扫的是 m/exZh/note 三栏）；「打扰」课文 2 处（1768、1363）✓、另 intrude／disturb／interrupt 三张卡 `m` 含打扰 ✓（加 bother = 4 张 ✓）；「烦扰」课文 0、只在 harass m + bother m ✓；"1363 那处已挂 disturb／interrupt 的辨析卡、见批次 4 的 4_08"我回查为真（4_08 组5 = disturb/interrupt 段 [4,14]，落地卡实测在 disturb 上、`at`=[4,14]）✓。
D 宽度：默认行 37.0 / **实测 37.0** ✓（本片最贴线的一条，≤40 之内，**不要再加字**）；总结句 28.0 / **实测 28.0** ✓；`core` 7.0 / 7.0 ✓。
E 义项照抄：**OK**。「骚扰／打扰／烦扰／屡次侵扰」只在 `sense`；`core`（那群瘦弱的鸭子／墙边睡觉的老猫）、默认行、总结句、维度名干净；表头＝引用＋否定 ✓。
F 结构性与诚实：**OK，且作者提请拍板那一条我验过没有越线**。列数齐（items 3×7、diff 7×5）；`harass` 卡 `note` 空这一真实缺口如实写进「证据强度」并禁止补搭配 ✓；表里**确实没有任何一行**写"harass 比 bother 更严重／更正式／更频繁"（我把 core／默认行／总结句／四个维度名／「一句话区别」列全扫过：只说"反复／屡次"的只有 `sense` 槽里 harass 卡 `m` 的第三档「屡次侵扰」—— 那是卡上的字、按硬约束 4 允许）；"bother 的一次性"只出现在「数据边界」，且标明"是我从时态与句式推的判断、两卡 `note` 都没有频率标注"（该句我核过为真：bother `note` 无频率、harass `note` 空串）→ **推的半步停在边界栏里、没有进落地槽，属 §五.7 允许并 §五.15 要求报备的写法**。造景 **OK**（瘦鸭子／墙边睡觉的老猫／大声笑话缠着的同事／稍后再打扫的房间，逐格对得上数据）。
判定：**OK 可落地**。作者提请的那一格：我的建议是**维持不写进表**（数据里 harass 只有 2 处，撑不起频率分工；要写得由他给一句本书书证）。

---

## 组185 · envy / jealous（段 [5,48] ｜ 句 1783 ｜ 妒忌 ｜ false）

A 原文表：**OK**。1782–1784 三行逐字；只粗 envy／jealous ✓。
B 句号与共现：**OK**。段48 = 1780–1785，1783 = i3；`paraZh`「新书单代替疯狂赶读，管住小我。」逐字对平，报备**属实**（"新书单／疯狂赶读"实测在 1772、"管住小我"实测在 1775 `kept his growing ego in check`）；引用 worklist_idx 216 = `doubt / sceptical / suspicion`、`paras [[5,48]]`、`sents [1784,1785]`、属 slice44（别的切片）✓ —— 这条**是真**的；`subheads[5]` 附近无非空项 ✓。
C 可 grep：**OK**。`Lin felt no envy toward fast swimmers, nor grew jealous of prizes won by close friends` 及 9 条子串、`I envy her for her happy family.`、`He is jealous of his brother's new bike.`、旁证 `I admire my teacher for her patience.`（同 `… + 人 + for + 事物` 形状 ✓）逐条命中；两卡 `note` **实测都是空串** ✓。否定行**无一虚报**：`jealousy`/`envious`/`envies`/`envy of`/`green-eyed`/`be jealous for`/`jealous of a person`/`envy sb sth` 八串 0 ✓ 且 jealousy/envious/envies 三头**都无卡** ✓；「妒忌」课文 0、只在两卡 m ✓；「嫉妒」课文 1 处（1783→envy）+ jealous 卡 exZh ✓；「眼红」课文 1 处（1783）✓；「羡慕」课文 0、只在 envy 卡 m+exZh ✓；「吃醋」两份数据 0 ✓；1780 的 uneasy／fear、1782 的 insult／unkind 都有卡 ✓（"属别的组"那半句不实，见 F）。
D 宽度：默认行 36.0 / **实测 36.0** ✓；总结句 23.5 / **实测 23.5** ✓；`core` 8.0 / 7.0 ✓。
E 义项照抄：**OK**。「妒忌」「羡慕」只在 `sense`（`scene` 里"他羡慕的那个她和她的家"是 envy 卡 `exZh` 的原文事实）；`core`、默认行、总结句、维度名干净；表头＝引用＋当场说明档位差 ✓。
F 结构性与诚实：列数齐（items 3×7、diff 7×5）；**"档位错"这一族的处置是范本级的** —— 卡 `m` 只给动词档（实测 envy m = `v. 羡慕；妒忌` ✓）而 1783 是名词位（`felt no envy` ✓），表里把词性格直接写成「v.（卡上档）；1783 处是名词」、并写明"名词档书证＝课文 1783、动词档书证＝卡 ex（在卡上、不在本段）"、禁止升级成"envy 不能作动词" ✓。造景 **OK**。**一处存在性断言不实**：「与别组的交界」写"1782 的 insult / unkind、1784 的 doubt / suspicion、1780 的 uneasy / fear 都有卡，**属别的组或别的切片**" —— doubt/suspicion ✓ 有组（216），但 `insult`、`unkind`、`uneasy`、`fear` 四头我把 220 组 worklist 全扫了，**不在任何辨析组里**。
判定：**需作者改（MISMATCH，最小清单 1 条）**
1. 该行改成：`1784 的 doubt / suspicion 属 worklist_idx 216 那一组（slice44）；1782 的 insult / unkind、1780 的 uneasy / fear 都有卡、但都不在 220 组 worklist 的任何辨析组里（已扫），按硬约束 2 只作背景。`

---

## 组186 · reluctant / unwilling（段 [5,49] ｜ 句 1787 ｜ 不情愿 ｜ **true**）

A 原文表：**OK**。1786–1788 三行逐字；只粗 unwilling／reluctant ✓（1786 的 unstable／unsuitable、1788 的 hesitate／guilty 不粗 ✓）。
B 句号与共现：**OK**。段49 = 1786–1791，1787 = i1；`paraZh`「戒掉多余，直面朗读恐惧。」逐字对平、报备**属实**（"戒掉多余" = 1778 `quit excessive late snacks` ✓、"直面朗读恐惧" = 1780 `faced his old fear of reading aloud` ✓）；"同段 1788／1789／1790"的句内容与词头归属我逐句开过 ✓（但"各属别的组"不实，见 F）。
C 可 grep：**OK**。`Lin was never unwilling to help Grandma, though once reluctant to wash green vegetables` 及 8 条子串、两卡 `ex`/`exZh`、两条 `note`（同义词栏互列：reluctant→unwilling、unwilling→reluctant ✓ → `all_synonyms: true` 有据 ✓）、旁证 348（`He did not want to cram at night` / 「他不愿晚上临时抱佛脚」✓）、1758（`refusing to stay miserable` ✓）逐条命中。否定行**无一虚报**：`reluctantly`/`unwillingly`/`reluctant acceptance`/`unwilling participant`/`reluctant smile`/`unwilling to admit` 六串 0 ✓；`willing` 词头**实测无卡**（只有 `unwilling` 一条含该子串的词头）✓；「不情愿」课文 0 ✓；「不愿意」课文 0、实测只在两卡 `exZh`（都以「他不愿意」开头 ✓）+ unwilling 卡 `m` 第一档 ✓；「不愿」课文实测 **3** 处 = 348／1758／1787 ✓。
D 宽度：默认行 34.5 / **实测 34.5** ✓；总结句 26.5 / **实测 26.5** ✓；`core` 7.0 / 7.0 ✓。
E 义项照抄：**OK**。「不情愿的」「不愿意的」只在 `sense`；`core`（帮奶奶从不推辞／有次洗绿菜那回）、默认行、总结句、维度名干净；表头那句"worklist 给的共同义项「不情愿」两卡都认（unwilling 卡上就写着"不情愿的"），可这三个字在本书课文译文里一处都没落地"＝引用＋当场否定 ✓。
F 结构性与诚实：列数齐（items 3×7、diff 8×5）；§五.14 的"同形照写 + 各算一侧"做了，且这一组 `all_synonyms: true` 不存在 false 打架 ✓；区别落在 never／once 上，草稿明写"这是卡上两条词伙原样给的形状，不是我加的规则"（实测 ✓）并禁止升格成"unwilling 必须配 never"；卡内不一致（reluctant `m` 只一档、`exZh` 却写「不愿意」）如实报备 ✓。造景 **OK**。**一处存在性断言不实**：组头"同段的 1788（hesitate / guilty）、1789（embarrass / regret）、1790（repent / ashamed）各属别的组或别的切片" —— 这六个词头**没有一个在任何辨析组里**（实测 220 组全扫，六头皆 0；也无落地 `cmp` 卡）。
判定：**需作者改（MISMATCH，最小清单 1 条）**
1. 该行改为：`同段的 1788（hesitate / guilty）、1789（embarrass / regret）、1790（repent / ashamed）六个词都有卡，但都不在 220 组 worklist 的任何辨析组里（已扫），本张只讲 1787 这半句与后半句的分工。`

---

## 组187 · awkward / clumsy（段 [5,50] ｜ 句 1796 ｜ 笨拙 ｜ false）

A 原文表：**OK**。1795–1797 三行逐字；只粗 awkward／clumsy ✓（1795 的 ridiculous／error／stupid、1797 的 careless／oblivious、1796 句首的 first 一律不粗 ✓）。
B 句号与共现：**OK**。段50 实测 **1792–1806（15 句）**，与草稿所写一致；1796 = i4；`paraZh`「打消怀疑，乐于帮奶奶分面包。」逐字对平、报备**属实**（"打消怀疑" = 1784 ✓、"帮奶奶分面包" = 1787／1788 ✓）；`subheads[5]` 附近无非空项 ✓。
C 可 grep：**OK**。`His first dance steps felt awkward and clumsy, but music carried him across the floor lightly` 及 8 条子串、`He felt awkward when he forgot his friend's name.`、`He is clumsy and dropped the glass.`、旁证 1789（`Loud hiccups used to embarrass him in class` / 「响亮的嗝曾让他在课上尴尬」✓）逐条命中；两卡 `note` **实测都是空串** ✓。否定行**无一虚报**：`awkwardly`/`awkwardness`/`clumsily`/`clumsiness`/`awkward silence`/`awkward moment`/`awkward pause`/`clumsy hands`/`clumsy boy`/`dance floor` 十串 0 ✓；「别扭」课文 1 处（1796）✓；「笨拙」课文逐句译文 1 处（1796），另一处实测在**段52 主题栏**「包容慢读，笨拙舞步也轻盈。」（草稿明写主题栏不作出处 ✓）；「不灵巧」课文 0 ✓；「尴尬」课文 1 处 = 1789 挂 embarrass ✓；「笨手笨脚」两份数据 0 ✓。
D 宽度：默认行 39.0 / **实测 39.0** ✓（**离上限只剩 1.0**，本片最贴线的一条，落地时别再加字）；总结句 22.0 / **实测 22.0** ✓；`core` 6.0 / 8.0 ✓。
E 义项照抄：**OK**。「笨拙的」「尴尬的」「别扭的」「不灵巧的」都只在 `sense`（diff 表里"别扭／笨拙／尴尬"是逐字引 `sentZh`／`exZh` 的中文落点，属引数据）；`core`、默认行、总结句、维度名干净；表头＝引用＋否定 ✓。
F 结构性与诚实：列数齐（items 3×7、diff 8×5）；同句 `and` 并列这一处"本段几乎可换"物证照写、并按 §五.14 算两侧各一条 ✓；卡上档数不对称（3 档 vs 2 档）、"笨拙这档本段只落在 clumsy 一侧"都如实写 ✓；禁止把"忘名字 vs 掉杯子"写成通则 ✓。造景 **OK**（舞步／地板／忘了朋友名字／打翻玻璃杯，逐格对得上）。**一处存在性断言不实**：组头"同段 1795（ridiculous / stupid）、1797（careless / oblivious）属别的组或别的切片" —— 四个词头**没有一个在任何辨析组里**（220 组全扫 = 0，也无落地 `cmp` 卡）。另有一条建议级：「本组这一句是全段唯一写"身体不听话"的句子」是软判断（同段 1793 忍康复走、1805 哮喘坐起也写身体），不构成不实，但建议改成"全段唯一把身体不听话写成两个词的这一句"。（组头另一处"awkward 卡 `m` 三档（第三档由卡 ex 那句…演出）"实测为真 ✓。）
判定：**需作者改（MISMATCH，最小清单 1 条）**
1. 该行改为：`同段 1795（ridiculous / stupid）、1797（careless / oblivious）四个词都有卡，但都不在 220 组 worklist 的任何辨析组里（已扫），本张只讲这一句舞步与两张卡各自那一下。`

---

# 汇总

| 组 | worklist_idx | 词对 | A 原文 | B 句号 | C 可 grep | D 宽度 | E 义项 | F 结构/诚实 | 判定 |
|---|---|---|---|---|---|---|---|---|---|
| 178 | 178 | severe / strict | OK | OK | OK | 31.5/28.0 实测符 | OK | 条数自相矛盾（6→5）+ 罚则出处串位 + 附栏 2 处数 | **MISMATCH** |
| 179 | 179 | resemble / similar | OK | OK | OK | 33.0/25.5 实测符 | **core 复述 `m` 字面「相像的」** | OK（2 处措辞建议级） | **BLOCK**（改 1 格） |
| 180 | 180 | grief / grieve | OK | OK（"1752 的湖"应 1751） | OK | 31.5/23.0 实测符 | OK | "各是别的组"虚报 + "都挨着 He felt"过宽 | **MISMATCH** |
| 181 | 181 | miserable / wretched | OK | OK | OK | 34.5/23.5 实测符 | OK | OK（"隔三句"应隔两句，建议级） | **OK 可落地** |
| 182 | 182 | hate / hatred | OK | OK | OK | 35.0/23.0 实测符 | OK | OK（派生对未算两条） | **OK 可落地** |
| 183 | 183 | crazy / mad | OK | OK | OK | 36.5/23.0 实测符 | OK | "本书只在否定句露面"应为"本段" | **MISMATCH** |
| 184 | 184 | bother / harass | OK | OK | OK | 37.0/28.0 实测符 | OK | OK（报备属实、推断未进落地槽） | **OK 可落地** |
| 185 | 185 | envy / jealous | OK | OK | OK | 36.0/23.5 实测符 | OK | insult/unkind/uneasy/fear "属别的组"虚报 | **MISMATCH** |
| 186 | 186 | reluctant / unwilling | OK | OK | OK | 34.5/26.5 实测符 | OK | 1788–1790 六词"属别的组"虚报 | **MISMATCH** |
| 187 | 187 | awkward / clumsy | OK | OK | OK | 39.0/22.0 实测符 | OK | 1795/1797 四词"属别的组"虚报 | **MISMATCH** |

**合计：组数 10 / BLOCK 1 / MISMATCH 6 / 通过 3。**
**必改清单去重后只有 4 类，各改一次即全片生效**：① `core` 一格（组179）；② "属别的组或别的切片" → "有卡、不在任何辨析组里（已扫 worklist 220 组）"（组180、185、186、187，共 4 处）；③ 组178 的条数与出处归属 2 格 + 附栏 2 个数；④ 组183 一行末句"本书"→"本段"。
**A／B／D 三项零缺陷**：45 行原文表逐字、20 条宽度标称、21 个成员标记位、9 个段落范围、6 条 `paraZh` 与 2 条 §五.12 报备全部实测为真 —— 这两批的"薄证据组"没有一处是靠编原文或抬宽度过关的。

# 需要他拍的最多 3 条

1. **组179 那一格 `core` 的定级**：按 AUDIT_BRIEF 的字面（core 命中＝BLOCK）还是按批次 5 组142 的先例（同型判 MISMATCH）？改法我已经验过（「顶在名词前那批」= 7.0 ≤12），只要他一句话把这一档定死，后面批次不用再猜。
2. **组184 作者提请的那条**：我的核验结论是"报备属实、推的半步没有进任何落地槽"→ 建议**维持不写进表**；如果他要写，得他自己给一句本书书证（我把 harass 全书只有 1768 + 卡 `ex` 两处、频率无一字标注这一事实钉在这里）。
3. **"属别的组"这一族虚报（本片 4 处、批次 4/5/6 反复出现）**：是否把"邻居词属别的组"改成强制写法"都有卡、都不在 220 组 worklist 里（已扫）"，并在 `tools/check_compare_draft.py` 之外由门禁 2 固定必查？（本片实测 17 个被点名的词头没有任何一个在别的组里，这条口径不修，下一批还会照错。）
