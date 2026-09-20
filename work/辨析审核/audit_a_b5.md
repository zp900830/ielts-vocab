# 门禁 2 审核 · 批次 5 前半（`work/辨析草稿/5_01.md` + `5_02.md`，10 组 / worklist_idx 136–145 / 全在章4）

> 审核方式：`shadow/data/sections.json` 去 `[[词头:表面]]` 标记后逐字比对（脚本化，16 + 17 行表格全量、含标点与撇号）；
> 宽度用 `tools/width_rule.py` 复量；全局句号按偏移 `[0,339,651,883,1277,1492]` 自算 —— 切片包 `sents` 是 **0 基**，
> 与批次 4 已落地写法一致（我另用 4_09 组 2 的 domain/realm=1390 反验过这条约定），本审核不改编号。
> 正面证据做了**全量独立扫描**：两份草稿共 992 个反引号英文串，整串回两份数据原文，
> 未命中的 31 + 50 条**逐条读过上下文**，全部属"明写不写／0 处／本书没有"的否定行或省略号引文 —— 无一被当正面证据用。
> 本审核只读数据 + 只写本文件；未改草稿、未碰数据/代码/测试、未跑 `tools/land_compare.py`
> （`work/辨析审核/land_preview.json` mtime 仍是 09-20 23:24，早于两份草稿的 09-21 02:26/02:32，可反证没人跑过写盘模式）。

组数 10 / **BLOCK 1**（组140）/ **MISMATCH 2**（组141、组142）/ 通过 7
片级附带（不单独定级，改一次全片生效）：`5_02.md` 把段主题小节写成 `subheads[4][17]`，共 10 处 —— 实际「下篇·发明比赛」在 `subheads[4][18]`，`[17]` 是空串（`5_01.md` 同片写 `[18]`，可证是笔误不是口径）。

---

## 组136 · device / equipment（段 [4,19] ｜ 句 1394 / 1395）

A 原文表：**OK**。1392–1395 四行英文/中文与数据逐字一致（含 1395「学校院子免费提供场地，晚上共用设备干活。」的逗号）。
B 句号与共现：**OK**。段 19 = 1390–1395，device 1394、equipment 1395，与 `sents` 相符；两句确实以 `[[device:device]]`、`[[equipment:equipment]]` 打标记。
C 可 grep：**OK**，我亲自查到 14 条正面证据（课文 7 条子串 + 两卡 `ex`/`note` 8 条 + peripheral/mobile/portable/household/sterility 五张旁证卡逐字对上）。否定行逐条回查**无虚报**：`equipments`（两份数据 0）、`a piece of equipment`、`laboratory equipment`、`safety device`、`by all devices` 全 0 ✓；两卡 `note` 确实无同义词栏 ✓。§五.13 两档分开写 ✓；「本书 4 处 device 写法全是单数 / 6 处 equipment」按 §五.8 跨卡同串合并后我复算 = **4 / 6** ✓（复数 devices 未混入，且上一格已明列）。
D 宽度：默认行 标称 35.5 / **实测 35.5** ✓；总结句 21.5 / **实测 21.5** ✓。
E 义项照抄：**OK**（「设备」「装置」只在 `sense` 槽与被否定的表头里）。
F 同源诚实：**OK**（`portable device`、`household equipment` 跨卡同串各点名算 1 条，未算两条）。
判定：**可落地**。

## 组137 · instrument / tool（段 [4,20] ｜ 句 1396）

A 原文表：**OK**（1396–1398 逐字）。
B 句号与共现：**OK**。段 20 = 1396–1401；两词同在 1396 ✓ 与 `sents [1396]`。§五.13：instrument 标 1/未标 0 ✓；**tool 标 1 + 未标 2（397、760）✓** —— 我 grep 到的 694 `stool`、875 `stools` 是子串假命中，作者没算进去，是对的。
C 可 grep：**OK**，20+ 条正面证据全中（两卡 `ex`、instrument/tool 五条词伙、musical/steel 卡同串、enable/electronics/practical/utilise/multimedia 五张卡 `ex` 逐字、课文 397/760 两句）。否定行**无虚报**：`power tools`、`garden tools`、`measuring instrument`、`toolbox`、`precision instrument`、`an instrument of the law` 六串各 0 ✓；「刀具」= 1317/1367 knives ✓、「工具箱／用具」= 655 `repair kit` / `chrome utensil` ✓（中文反查正是这两句）；tool 卡提不到「乐器」二字 ✓。
D 宽度：35.5 / 35.5 ✓；23.0 / 23.0 ✓。
E 义项照抄：**OK**（「工具」「仪器」「刀具」「器具」未进 core/默认行/总结句；总结句的「乐器」出自卡上**词伙**且作者标明是词伙，不是 `m` 的字面，放行）。
F 同源诚实：**OK**。§五.14 在本片唯一真正适用的就是本组（两卡 `ex` 同一句式只换词头、同一把 hammer）：三件齐全部写到（同形照写 + 两栏没互列故 false 有据 + 各算一侧书证）→ **已处置到位**。
判定：**可落地**。

## 组138 · assess / gauge（段 [4,20] ｜ 句 1397 / 1400）

A 原文表：**OK**（1397 / 1399 / 1400 逐字）。
B 句号与共现：**OK**（1397 gauge、1400 assess，与 `sents`；"隔两句"与实况相符）。
C 可 grep：**OK**。旁证课文 1384 `a kind mechanic`（章4 段18 首句，编号与标记均对）。否定行**无虚报**：gauge 全书 1 处、assess 全书 1 处 ✓；`gauge the`/`gauge the pressure`/`gauge the speed`/`tire gauge`/`pressure gauge`/`an assessment of`/`assess the situation` 各 0 ✓；`assessment` 只在 measure 卡同义词栏 ✓；`tire pressure` 课文 0、只 gauge 卡 `ex` ✓。assess 卡**无词伙段**如实报缺 ✓。
D 宽度：30.0 / 30.0 ✓；22.0 / 22.0 ✓。
E 义项照抄：**OK**。表头「评估」= 引用 + 否定 ✓；总结句「本书只给了 assess 的两句」实测为真（全书中文「评估」仅 1400 一处 + assess 卡 `exZh` 一处，共 2 句，两句都对着 assess）—— 存在性断言写对了。
F 同源诚实：**OK**（`brass gauge` = 1397 同源不另计）。
判定：**可落地**。**拍板：不退。** 属 §五.6 已定死的处置（标题改写"各领哪样东西" ✓、义项只留 `sense` ✓、边界补"本书没这样用过" ✓），且实况比作者自评更稳一档（「评估」在 1397/1400 的 assess 侧**真落**）。按 §五.6「不退回」，这条不必占拍板额度。

## 组139 · compute / estimate（段 [4,20] ｜ 句 1398 / 1399）

A 原文表：**OK**（1397 / 1398 / 1399 逐字）。
B 句号与共现：**OK**；相邻两句同段、句式对仗的描述与原文相符。
C 可 grep：**OK**。否定行**无虚报且数目精确**：`computer` 课文 0、恰好 **10 张**别的卡 `ex`（cable/install/input/equip/execute/field/expertise/bachelor/network/binary，逐张开过，字段也真是 `ex`）✓；498/499 是 `underestimating` / `overestimate`，两句编号与"各有独立卡"全对 ✓；`compute by hand`、`roughly computed`、`estimated cost`、`make an estimate` 各 0 ✓；「估」字在课文中文只跟 1399 ✓。跨切片引用 worklist_idx 209 = `calculate / compute / count` ✓（查了 worklist 第 209 条）。
D 宽度：38.0 / 38.0 ✓；21.5 / 21.5 ✓。
E 义项照抄：**OK**（「估算」「计算」只在 `sense` 与被否定的表头）。
F 同源诚实：**OK**（`compute costs`/`estimate savings` 两条词伙与课文一一同源，明写"真正确实独立的只有卡 ex 那两句"）。
判定：**可落地**。**拍板：不退。** §五.6 处置到位，且已预先堵住升级写法（"不许升级成 compute 不能表估算"）。不必占拍板额度。

## 组140 · estimate / evaluate（段 [4,20] ｜ 句 1399 / 1400）

A 原文表：**OK**（1399 / 1400 / 1401 逐字，含 1401 长译文）。
B 句号与共现：**OK**（与 `sents`；本组与组 2/3/4 同挂段 20 末，四张切入角不重复，符合 §五.9）。
C 可 grep：**OK**。`the old watch`/`shopkeeper` 课文 0、只 evaluate 卡 `ex` —— 归属写对 ✓；`evaluate risks`（evaluate 词伙 + risk 卡词伙同串）✓。否定行**无虚报**：`evaluate` 课文仅 1400 ✓；`evaluation` 课文 0、只出现在 measure / procedure / rigorous / undergo **四张**卡的 `note`（我数的正是这四张，一张不多不少）✓；课文中文「估价」0 处、唯一落点是 evaluate 卡 `exZh` ✓；`evaluate the performance`、`self-assessment`、`market estimate` 各 0 ✓。
D 宽度：31.0 / 31.0 ✓；21.0 / 21.0 ✓。
E 义项照抄：**不符（本组唯一必改点，判 BLOCK）**。默认行
`estimate = 猜省多少（estimate savings），evaluate = 给旧表估价`
里「估价」正是 worklist 的共享义项、也是两卡 `m` 的字面（estimate `m`：v. 估算；n. **估价** ／ evaluate `m`：v. **估价**；评价）。§五.4 是硬约束："core 和默认行一律换掉"，§五.11 的豁免只给**表头**（本组表头"引用＋当场否定"那部分照 §五.11 放行）。段级语义没错（本组没宣称"两词都指估价"），但默认行是落地后**唯一露在外面**的一行，「估价」一露就把表头刚否定掉的义项请回主位 —— 这正是 E 行标 BLOCK 的那一档。
F 同源诚实：**OK**（`estimate savings` 与 1399 同源、`evaluate risks` 跨卡同串；两侧各 2 条如实写；档位错按 §五.6 同族处理并禁止升级）。
判定：**需作者改（BLOCK 1 处，改一句即回，不是退回）**。最小清单：
1. 默认行去掉「估价」二字。我实测过的两个可用写法（都 ≤40）：
   `estimate = 猜省多少（estimate savings），evaluate = 店主看那块旧表` → **33.0**
   `estimate = 猜省多少（estimate savings），evaluate = 看图纸说值不值` → **33.0**
   （想留英文括号：`… evaluate = 店主看那块旧表（old watch）` = 39.5，仍在尺内，不必抬上限。）
2. 改完把标称宽度一并换成实测值。其余 diff、出处清单、数据边界一律不用动。
**拍板：内容不退。** 本组是 5_01 唯一"共现两处都偏离共享义项"的组，§五.6 三件齐（标题否定义项、义项留 `sense`、边界补"本书没这样用过"，并写清 estimate 的估价是 n. 档 / evaluate 的是 v. 档）—— 语义侧已处置到位，要改的只是 E 那一行的措辞泄漏。

## 组141 · fault / flaw（段 [4,26] ｜ 句 1432 / 1433）

A 原文表：**OK**（1432 / 1433 / 1434 逐字）。
B 句号与共现：**OK**（段 26 = 1432–1437，与 `sents`）；**但本组（及全片）出处清单写 `subheads[4][17]`，实际「下篇·发明比赛」在 `subheads[4][18]`，`[17]` 是空串 —— 片级笔误 10 处，改索引即可，卡片内容不受影响 → MISMATCH（定级记在本组，组 142–145 同因不重复计）。**
C 可 grep：**OK**，且这是两份草稿里 §五.13/§五.15 做得最严的一组。标记数**精确**：fault 标 2（1057、1433）+ 未标 1（1321，该句标的是 patriot 与 blame ✓）、flaw 标 1 + 未标 0 ✓、`faulty` 2 处（411 标 electronics ✓、670 标 fuse ✓）未并入本形 ✓。句子与译文逐条对上（1057「都怪他」、1321「过错」、卡 ex「过错」、flaw 卡 ex「瑕疵」）✓；688 `shows every defect` 章2段6、defect 未打标记且**无 defect 卡** ✓；`welcome home` 有卡（phrase. 欢迎回家）✓；mistake 卡 `note` = 「同义词：error, blunder, fault」逐字 ✓。否定行**无虚报**：`flawless`、`fatal flaw`、`design flaw`、`fault line`、`find fault`、`a fault in` 各 0 ✓；全书课文中文「缺陷」0 处 ✓（「瑕疵」1 处＝688、「裂纹」1 处＝1432、「过错」1 处＝1321、「故障」2 处＝868/1433，与草稿的落点描述一致）。
D 宽度：默认行 33.5 / **实测 33.5** ✓；总结句 19.5 / **实测 19.5** ✓。
E 义项照抄：**OK**（「故障／缺陷／过错／瑕疵／裂痕」都不在 core、默认行；表头引用「缺陷」+ 当场否定 ✓ §五.11）。
F 同源诚实：**OK**（三条词伙 `thin flaw`／`small fault`／`sad faults` 全部点名与课文同源、不另计；合并后 fault 4 条 / flaw 2 条我复点相符）。
判定：**需作者改一处笔误（subheads 索引），卡片内容可落地**。共同义项「缺陷」在共现段两侧都不落（1432 译「细裂纹」、1433 译「小故障」）已按 §五.6 说轻，作者自判"不必拍板"，我同意：**不退**。

## 组142 · juvenile / teenage（段 [4,28] ｜ 句 1444 / 1446）

A 原文表：**OK**（1444 / 1445 / 1446 逐字）。
B 句号与共现：**OK**（1444、1446 与 `sents`；"隔一句"相符；同段 youngster/youth（1445）、adolescence（1447）确为另外的卡，按硬约束 2 未拉进成员 ✓）。subheads 索引同片级笔误。
C 可 grep：**OK**。正面证据：两句课文子串、`The book is written for juvenile readers.` ✓、`Teenage boys often like playing basketball.` ✓、orphan 词伙 `small orphan` ✓、gang 词伙 `noisy gang` ✓。否定行**无虚报，且这条最容易翻车**：「child / kid 这两个词头在 vocab.json 里没有条目」我逐头查过 —— `child`、`kid` 确实无条目（只有 childish / kidnap / kidney）✓；课文 373 那句 `… good books for teens`、`teens` 未打标记、词头 `teen` 无条目 ✓（编号、译文「怎么给青少年挑到好书」都对）；`teenager`、`youthful`、`teenage years`、`delinqu` 课文 0 ✓；teenage 卡确实无同义词栏 ✓。
D 宽度：默认行 35.5 / **实测 35.5** ✓；总结句 23.5 / **实测 23.5** ✓。
E 义项照抄：**不符**。成员表 `core` 给 teenage 写的是「**十来岁**那几年」，正是 teenage 卡 `m` 第二档「青少年的；**十来岁的**」的字面复述（§五.4「core 和默认行一律换掉」）。级别：MISMATCH 而非 BLOCK —— 它不在落地唯一露出的默认行里，也不是本组 worklist 共享义项（那个是「青少年」，未泄漏），换 4 个字即可。建议 core 改「扫巷的那批小辈」（juvenile 侧「还没成年那拨」不动，对比关系不丢）。表头"两边都成立"的宣称我核过为真（1444 译「少年帮手」、1446 译「青少年志愿者」）→ 不属 §五.11 拦的那种"宣称而该段实际不撞"。
F 同源诚实：**OK**（三条词伙同源全部点名；"juvenile 三条 delinquency 词伙只在卡上、别当课文书证"写得很干净）。
判定：**需作者改（core 一处 + 片级 subheads）**。
**拍板：不退。** §五.7 明写"证据薄不是退回理由"，本组两侧各 2 条可 grep 文本、卡上不对称（juvenile 多两档 + 词伙落在"犯事的"一族）是真信息；作者列的"要不要出 diff 表"不该由起草代理重开 —— 现表可落地。

## 组143 · kin / relative（段 [4,28] ｜ 句 1447 / 1448 ｜ `all_synonyms: true`）

A 原文表：**OK**（1446 / 1447 / 1448 逐字）。
B 句号与共现：**OK**（1447、1448 与 `sents`；与组 142 同挂段 28 末，两张角不重复 ✓ §五.9）。subheads 索引同片级笔误。
C 可 grep：**OK**。kin 标 1 + 未标 0（我用词边界复扫 `kin`，全书只 1447 一处 ✓，`kind`/`making` 一类没被误算）；relative 标 1 + **未标 1 = 1152**（章3段45句2 ✓，译文「来访亲戚」✓）。`a relative` 两份数据 0 ✓、`family reunion` 课文 0、只 kin 卡 `ex` ✓、`next of kin`/`kith`/`kinfolk`/`kinsfolk`/`distant relative`/`closely related` 各 0 ✓、relation / connection 无条目 ✓、relative 卡确实**无词伙段**且 `ex` 走形容词档（`His success is relative to his hard work.`）✓、`their visiting relatives` ✓、1448/1447 两处 `close kin`、`bright adolescence` 与卡同源 ✓。`all_synonyms: true` 的物证（两栏互列 relative↔kin）我核对为真 ✓。
D 宽度：36.0 / 36.0 ✓；18.5 / 18.5 ✓。
E 义项照抄：**OK**（「亲属」「亲戚」「相对的」只在 `sense`；表头说"本书译文把两个词写成同一个中文词"，实测三处「亲戚」= 1152/1447/1448 ✓ 属实）。
F 同源诚实：**OK**；并按 §五.14 的辨异写清"本组不属两卡例句只差词头那种"（两条 `ex` 形不同、档也不同）→ 判断正确，未误用也未漏用该口径。
判定：**可落地（除片级 subheads 笔误）**。
**拍板：不退，照出 diff 表。** 作者提的"relative 侧卡上零'亲戚'档文本要不要照出表"—— §五.8 与 §三.8 要求的正是"如实写有几条出处、卡上没有词伙段要明说"，两条都做了；硬区别（`one` / 带 -s、在场 / 寄来）是可 grep 的形状差，不是编的语义层。已处置到位。

## 组144 · hostess / mistress（段 [4,29] ｜ 句 1452 / 1453）

A 原文表：**OK**（1451 / 1452 / 1453 / 1454 逐字）。
B 句号与共现：**OK**（1452、1453 与 `sents`；"本片只有本组一张卡挂段 29"我回 worklist 全表核过，[4,29] 只出现 1 次 ✓）。subheads 索引同片级笔误。
C 可 grep：**OK**。hostess 标 1 + 未标 0、mistress 标 1 + 未标 0，`hostesses`/`mistresses` 两份数据 0 ✓；段 29"院里的女人"那一串标记（beloved/madam 1451、stern+landlady 1452、housewife 1453、widow+maid 1454）逐句核过，四张词伙 `stern landlady`、`busy housewife`、`old widow`、`quick maid` 与课文同源、都标了 ✓；旁证 host 卡 `ex` 确为 `The host welcomed us with tea and cookies.`（与 hostess 卡同写 `welcomed us` ✓），`welcomed us` 课文 0 ✓、`welcomed the guests warmly` 课文 0、只在 mistress 卡 ✓；`waitress`、`schoolmistress`、`lady of the house`、`hostess with` 各 0 ✓。"mistress 2/2 挂 of、hostess 0/2 挂 of"我数过：1453 `of the yard` + 卡 ex `of the house` = 2/2，1452 与 hostess 卡 ex 都不挂 ✓ 无误。
D 宽度：38.0 / 38.0 ✓；19.5 / 19.5 ✓。
E 义项照抄：**OK，但要点明判据**。表头写"worklist 给的共同义项「女主人」本书译文两处都照写了" —— 这是**宣称**而非"引用＋否定"，字面上落在 E 行"表头 = BLOCK"那一档；但 E 行末句拦的是"宣称本段两词都指 X 而该段实际不撞"，本段 1452、1453 的 `sentZh` **两处都真的写「女主人」**（我逐字核过），宣称与数据相撞不成立 → **放行**。`core`、默认行、总结句都不含「女主人」✓。若定级口径要按字面走，这一条是本次唯一需要他确认"真撞即可写"的地方（我判断：可以，且这正是 §三.3 要求表头交代的"为什么会同时出现"）。
F 同源诚实：**OK**：两条词伙都是课文回声；明写"卡上没给过任何一条独立于课文的块"；对 §五.14 的辨异正确（两卡 `ex` 形不同、不是只差词头那种，故不套 14 的三件齐），并且没有把"两处都写女主人"升级成"两词可互换"。
判定：**可落地（除片级 subheads 笔误）**。**拍板见文末体例建议。**

## 组145 · client / customer（段 [4,30] ｜ 句 1458 / 1459）

A 原文表：**OK**（1457 / 1458 / 1459 / 1460 逐字）。
B 句号与共现：**OK**（1458、1459 与 `sents`；1461「约见评委」句、613 patron 句的章/段/句编号我逐条回查：1150 章3段45句0 ✓、1164 章3段47句2 ✓、613 章1段45句2 ✓、1461 章4段30句5 ✓）。subheads 索引同片级笔误。
C 可 grep：**OK**，本组的存在性断言最密，全部为真：`client` 全书只 1459 一处（"本书一次都没让 client 出现在店里" ✓）、`clients` 两份数据 0 ✓、customer 标 1 + 未标 2（1150、1164）✓、customer 只被 counter / slogan / compete 三张卡 `ex` 用着（我逐头查，恰好这三张，"client 一张也没有" ✓）、lawyer / contract / consumer / user **四头皆无条目** ✓ 且 contract 课文 0 ✓、`customer service`/`shop assistant`/`a client of` 各 0 ✓、课文中文「主顾」0 处 ✓、patron 卡 `m` 确有「老主顾」一档而 613 译「资助人」✓（因此按硬约束 2 只在边界报备，处置正确）。
D 宽度：38.5 / **实测 38.5** ✓（离上限 1.5，是全片最贴线的一条，别再往上加字）；总结句 20.0 / 20.0 ✓。
E 义项照抄：**OK**（「客户／顾客／主顾」不在 core/默认行；表头"「客户」只落在 1459 一侧（1458 译「顾客」）"实测为真 ✓，属引用＋收窄）。
F 同源诚实：**OK**（`shop customer`、`shy client` 两条词伙均点名同源；并主动声明 counter/slogan/compete 那 3 条是卡例句、不是课文，禁止升级成规律）。
判定：**可落地（除片级 subheads 笔误）**。义项单侧（「客户」只在 1459）按 §五.6 说轻，作者自判不必拍板，我同意：**不退**。

---

# 六个拍板请求的判断

| # | 作者提请 | 我的判断 | 依据 |
|---|---|---|---|
| 1 | 5_01 组3 assess/gauge：「评估」只在 assess 侧 | **不退，也别占拍板额度** | §五.6 三件齐已做到；实况比自评更好一档（1400 译文就是「评估」） |
| 2 | 5_01 组4 compute/estimate：「估算」没给 compute | **不退，别占额度** | §五.6 处置到位，并已禁止升级 |
| 3 | 5_01 组5 estimate/evaluate：本段两侧都不在估价 | **内容不退，但默认行必须改（本组判 BLOCK）** | 义项词回到唯一露出的那一行 = §五.4；改法见组140 |
| 4 | 5_02 组2 juvenile/teenage 最薄 | **不退**；core 换掉「十来岁」（MISMATCH） | §五.7 白纸黑字；薄是常态，卡上不对称是真信息 |
| 5 | 5_02 组3 relative 卡上零"亲戚"档文本 | **不退，照出 diff 表** | §三.8 + §五.8 要求的就是"如实写明零词伙段"；形状差可 grep |
| 6 | 5_02 组4 hostess/mistress 两处译文都写「女主人」+「卡上另一档本书 0 处该不该留在表里」 | **不退**；体例见下 | 真撞 → 表头可写（E 行末句）；0 处档保留更合规 |

**对第 6 条「体例」的建议：保留这一格，但把它定死成写法，别砍。**
① 它不是可选装饰：§三.8 要求"卡上没有词伙段／全书只出现 1 次必须明说"，§五.6 要求档位错"必须写明哪一档本书 0 处、哪一档的书证在别段" —— 删掉这行就等于把义务挪到「数据边界」，而落地只渲染表，等于漏写。
② 作者说"这一格三组共用"是**低估**：实测 5_02 组1（缺陷档）、组2（幼稚的／n. 少年）、组4（女招待／情妇／女教师）+ 5_01 组3（规格／评估档）、组4（估价 n. 档）都在用，**至少 5 组**；"改就三组一起改"要改成"五组一起改"。
③ 建议的硬规矩（三条，都不必回数据再改内容）：行名统一叫「卡上另一档用上了吗」；该档只准出现在 diff 表与「数据边界」，一律不得进 `core`/默认行/总结句；"一句话区别"列必须以"本书 0 处／本书没这样用过"收尾，不写年龄、不写语域。这样组140 那类泄漏不会再出现。

# 需要他拍的最多 3 条

1. 组140 默认行的「估价」怎么改（我给了两条 33.0 的现成写法，任选或自定）—— 这是本批唯一 BLOCK。
2. 组144 表头那句"共同义项本书译文两处都照写了"是否确认放行（数据为真、义项真撞；我按 E 行末句判可，但要他一句话钉死"真撞即可写"，好让后面几批照办）。
3. 「卡上另一档 0 处」这一格：按我的建议保留并定死写法（影响至少 5 组），还是全部挪进「数据边界」（那要连 5_01 组3/组4 一起改）。
