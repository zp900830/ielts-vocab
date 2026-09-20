# 门禁 2 审核 · 批次 2 切片 04 / 08 / 09（worklist_idx 25–29、45–49、50–51）

组数 12 / BLOCK 0 / MISMATCH 2 / 通过 10

审核人：门禁 2 独立代理（非草稿作者）。数据原文只读 `shadow/data/sections.json`、`shadow/data/vocab.json`。
未修改任何草稿、数据、测试；未做任何 git 写操作（只跑了 `git status`）。

## 复核方法与可复现口径

先把两份数据装进内存、自建全局句索引，再逐组跑 A–F，**不采信草稿自己的任何自算结论**：

- **索引校验**：按章偏移 `[0,339,651,883,1277,1492]` + 段前句数 + 段内序号重建，得到 0–1832 共 **1833 句、编号连续无空洞**，与 BRIEF §2 口径一致。各锚点段自算结果：`[1,3]=357–362`、`[1,4]=363–368`、`[1,7]=381–386`、`[1,8]=387–392`、`[1,30]=521–526`、`[1,32]=533–538`、`[1,33]=539–544`、`[1,36]=557–562`、`[1,38]=569–574`、`[1,39]=575–580`，**与 12 组草稿所写号段全部一致**。
- **A 逐字比对**：把三份草稿所有「该段原文 / 成员句」表格行（共 31 + 26 + 12 = 69 行有效句行）去 `**` 加粗后，与去 `[[词头:表面]]` 标记的原文 + 同位 `sentZh` **逐字符比对**（含标点、大小写、单复数、时态），并额外做了**表完整性检查**（该段每一句是否都在表里、有没有把两句并成一句、有无跳句）。
- **C 广域可 grep**：不止扫 code span。抽出全部英文串（code span 内的 + 表格/散文里的裸英文串），去重 532 条候选，在 `sections.json`（表面形式）+ `vocab.json`（`m`/`ex`/`exZh`/`note`）三形态文本海里查。查无的逐条人工分诊：文件路径 / 字段名 / 省略号模板 / 真·否定行。
  > 这一步刻意做宽，因为门禁 1 结构上必漏：它 `META` 排除了含 `(`/`)`/`/` 的 code span（默认行、diff 表里大量带括号的搭配正好落在这），且**整行含否定词就跳过**。
- **C′ 出处归位**：52 条「X 是卡 `Y`.note 词伙 / `Y`.ex」的**归位断言**，不看全局是否在数据里出现过，只看**是否真在该卡该字段里**。0 条失败。
- **D 宽度复算**：CJK 及全角标点计 1、其余（字母/空格/`=`/半角括号）计 0.5，复算 24 条（12 默认行 + 12 总结句）。另做敏感性检验：把全角标点也按 0.5 计（AUDIT_BRIEF D 字面口径），所有默认行仍 32.5–37.0、无一超 40，故 D 结论不受口径歧义影响。
- **B 交叉验证**：跑仓库自带的 `tools/check_shared_sense.py` 独立佐证，全 220 组 `A. 声称共现但某成员未被标记在该段：0 组`、`A'. 一组共现段都没有：0 组`，本片 12 组均在其中。
- **出现次数复核**：对 23 个成员词头（含 `-s/-ed/-ing` 与表面形式变体）做全书词边界扫描，区分「已标记 / 未标记」，逐条对草稿的「全书 N 次」声明。

**总体：未发现 BLOCK。** 草稿在 A（逐字）、C（可 grep）、C′（归位）、次数声明四项上全部经得起复算，未见手抄错句、并句、译句错位，也未见把查不到的搭配伪装成正面证据。

---

## 组 25 · eminent / outstanding

- **A 原文表**：OK。段 [1,3] 全 6 句（357–362）逐字与 `paragraphs` 去标记后一致，6 句齐全无并句；6 条 `sentZh` 逐字一致。
- **B 句号与共现**：OK。自算 357–362 = `[1,3]`；`eminent` 标记于 361、`outstanding` 标记于 359，二者确实同段共现。worklist `sents=[359,361]`、`all_synonyms=false` 与草稿所写一致。
- **C 可 grep**：候选 38 条，查到 33 条。查无 5 条全部合规：`all_synonyms: false`（字段值）、`vocab.json`/`sections.json`（路径）、`outstanding debt`/`outstanding payment`（明写「都查不到，按硬约束 1 只能放弃」，我独立验证全书 0 命中、`vocab.json` 0 命中 → 否定行属实、放行）。归位断言 `eminent visitor`∈`eminent`.note 词伙、`eminent scientist`∈`.ex`、`outstanding work`∈`outstanding`.note 词伙、`outstanding student`∈`.ex` **4/4 通过**。
- **D 宽度**：默认行 草稿 35.5 / 实测 **35.5**（delta 0）；总结句 草稿 29.0 / 实测 **29.0**。均达标（≤40、≤30）。
- **E 义项照抄**：OK。core=`有名气、有头衔`／`比同排高出一截`，默认行与标题均无「杰出／著名／尚未处理」作实质区别。注：标题以引号形式出现「杰出」一次，属被拆的靶子而非被宣称的共识（见「全局事项」）。
- **F 同源诚实**：OK。已点明 `eminent visitor` 与课文 361、`outstanding work` 与课文 359 是同一处（「卡上词伙，课文 361 就是它」），并据同源合并报「合计 4 条独立文本」——我复算确为 4 个独立语次（2 课文 + 2 卡 ex，词伙并入课文），**未虚报**；也未据此宣称「两处书证方向一致」。
- **判定**：**可落地**（证据薄不是退回理由，按 BRIEF §5.7 放行）。

## 组 26 · headmaster / principal

- **A**：OK。段 [1,4] 全 6 句（363–368）逐字一致、无缺句；`sentZh` 逐字一致。
- **B**：OK。同句共现 365 已核：`[[headmaster:headmaster]]` + `[[principal:principal]]` 双标记。worklist `sents=[365]`、`paras=[[1,4]]`、`all_synonyms=false` 一致。
- **C**：候选 36，查到 34。查无 2 条：`all_synonyms: false`（字段值）、`headmaster reason`（明写「本书也没有…这种写法」，独立验 0 命中 → 否定行属实）。归位 8/8 通过，含跨卡断言 `assistant principal`∈`principal`.note 且 **同条亦在** `assistant`.note、`The students handed in a petition to the principal.`∈`petition`.ex、`first, leading, major`∈`principal`.note 同义词栏、`major` 卡同义词栏回指 `principal`（**逐条为真**）。
- **D**：默认行 36.0 / 实测 **36.0**；总结句 23.5 / 实测 **23.5**。达标。
- **E**：OK。core=`学校正职那一位`／`排在最前那位`，绕开了 `校长`/`主要的`/`负责人`；默认行无照抄。
- **F**：OK。明写「`assistant principal` 这条在**两张卡上重复登记**」，主动合并同源、未算两条。
- **判定**：**可落地**。作者提请拍板的「共享义项『校长』名不副实」经核**成立**：365 `sentZh` 确把 principal 译作「协助校长的副校长」，标题也已按「谁正谁副」改写、未宣称两词都指校长 —— 处置与 BRIEF §5.6 一致，无需退回。

## 组 27 · professor / tutor

- **A**：OK。成员句 367/368 逐字一致；另 3 句 `Tutors…`（482、490、1576）**逐字一致**，`sentZh` 含 1576 译「家教」亦逐字一致。
- **B**：OK。`professor` 标记于 367、`tutor` 标记于 368，同段 `[1,4]` 共现，号段 363–368 自算一致。
- **C**：候选 28，查到 27；唯一查无为 `all_synonyms: false`（字段值）。**关键否定核实**：草稿称 482/490/1576 的 `tutors`「没被标成目标词」—— 我核原文，三句均无 `[[tutor:…]]` 标记，**属实**。归位：`old professor`∈`professor`.note 词伙、`faculty, lecturer`∈同义词栏、`one-on-one tutoring`∈`tutor`.note 词伙、两句卡 ex，**6/6 通过**。
- **D**：默认行 34.5 / 实测 **34.5**；总结句 19.0 / 实测 **19.0**。达标。
- **E**：OK。core=`大学里讲一门课的人`／`只管你一个人的人`，无「教授／导师」照抄。
- **F**：OK 且**额外加分**：草稿主动声明 `one-on-one tutoring` 严格说是 `tutoring` 的名词短语、「不能当 `tutor` 的可数用法背」，未把它冒充成 tutor 的用法证据。厚度声明「tutor 4 句（1 标记 + 3 未标记）、professor 1 句」与我复算 **完全一致**。
- **判定**：**可落地**。「共享义项『导师』名不副实」经核成立（367 译「老教授」，professor 全书从未按"导师"用过），处置符合 §5.6。

## 组 28 · canteen / dining hall

- **A**：OK。主段 [1,7] 全 6 句（381–386）逐字一致。另两句 427、758 也**逐字一致**；该表中文列在原文之后追加了括注（`paraZh` 说明、「未被标成目标词」），剥掉括注后 `sentZh` 完全对齐 —— 属标注性追加，**不算译句错位**。
- **B**：OK。`canteen`+`dining hall` 双标记于 383（同句共现）；号段 381–386 自算一致。427 属 `[1,14]`（单成员）、758 属 `[2,18]`（单成员），草稿**明确写成"另外两处…供表头改写用"而未冒充共现段**，口径正确（worklist `paras` 只有 `[1,7]`）。
- **C**：候选 33，查到 32；唯一查无为 `all_synonyms: false`。**本组最重要的归位核实**：`dining hall`.**note 是空串** —— 草稿称「`note` 是完全空的、零词伙、零同义词，能用的搭配全指望课文那两句」，`construct a warm dining hall` 只算课文一个出处；我核 `dining hall`.note == `""`、且 `construct`.note 只有同义词 `build, form, create` 无词伙段，**两条断言逐字为真**。758 的 `dining hall` 确实未标记，属实。归位 6/6 通过。
- **D**：默认行 34.0 / 实测 **34.0**；总结句 27.0 / 实测 **27.0**。达标。
- **E**：OK（本组标题最干净，用「两间吃饭的地方／一间厅／一个铺子」，未出现「食堂／餐厅」）。core=`买饭吃的那个地方`／`吃饭用的那间大厅`，无照抄。
- **F**：OK。`street canteen`/`small street canteen` 词伙与课文 383 重合已点名；「该卡 `note` 为空，无词伙可用」主动交底。
- **判定**：**可落地**。

## 组 29 · story / tale

- **A**：OK。段 [1,8] 全 6 句（387–392）逐字一致，`sentZh` 逐字一致。
- **B**：OK。`tale` 标记于 388、`story` 标记于 389，同段共现，号段 387–392 一致。
- **C**：候选 88（全片最多），查到 86。查无 2 条：`all_synonyms: false`（字段值）、`storys`（明写「误写，本书不存在」，验 0 命中 → 否定行属实）。**跨卡引用最密集的一组，13 张旁证卡逐张打开核对，全部为真**：`fairy tale`∈`dwarf`.ex、`humorous tales`∈`humorous`.note 词伙、`epic tale`∈`epic`.note 词伙、`greek story`∈`greek`.note 词伙、`retell stories`∈`retell`.note 词伙、`The journalist wrote a story about the earthquake.`∈`journalist`.ex、`…gist of the story?`∈`gist`.ex、`…summary of the story…`∈`summary`.ex、`a love story`∈`interpret`.ex、`fantasy stories`∈`fantasy`.ex、`tells stories`∈`grandfather`.ex、`rapidly evolving stories`∈`story`.note 词伙、`…Nobel Prize.`∈`eminent`.ex。又核 `naive/inspire/illustrate/mislead/pictograph` 五卡 ex 确含 story/stories（草稿称"没用上"，属实）。
- **D**：默认行 33.0 / 实测 **33.0**；总结句 27.5 / 实测 **27.5**。达标。
- **E**：OK。core=`传了很多代的老底子`／`一个人讲的那件事`，无「故事／叙述／传说／轶事」照抄。
- **F**：OK，且**做了两处反向核实并如实上报**：① `epic` 卡一边把 `epic tale` 作词伙、ex 却写 `an epic story`；`humorous` 卡同理 —— 草稿据此**主动放弃**"哪些形容词只能配谁"的写法；② `rapidly evolving stories` 在 `story` 与 `evolve` 两卡同条重复登记，已标「同条」。厚度声明「story 16 标记 + 11 未标记、tale 5 标记 + 8 未标记」与我独立扫描 **16/11/5/8 逐项精确吻合**。
- **判定**：**可落地**（本切片最厚一组，结论成立）。

## 组 45 · empire / imperial

- **A**：OK。段 [1,30] 全 6 句（521–526）逐字一致，`sentZh` 逐字一致。
- **B**：OK。`empire` 标记于 525、`imperial` 标记于 526，号段 521–526 一致；草稿写的段内序号（525=第 4 句、526=第 5 句）也对。
- **C**：候选 30，查到 27。查无 3 条：`all_synonyms: false`、`the imperial gold shone…`（省略号模板，完整串我已单独验在 526）、`an imperial`（明写「本书没有这种写法」，验 0 命中 → 否定行属实）。归位：`great empire`∈`empire`.note 词伙、`imperial gold`∈`imperial`.note 词伙、两句卡 ex、`The Tang dynasty…`∈`dynasty`.ex，**5/5 通过**。
- **D**：默认行 38.5 / 实测 **38.5**；总结句 24.0 / 实测 **24.0**。达标（本组默认行余量最小，仅 1.5）。
- **E**：OK。core=`被讲的那个大国家`／`拿来修饰名词那一下`，未把「帝国／皇帝的」当区别。
- **F**：OK。写「4 处文本（课文 525/526 + 两条卡 ex）里可核」—— 我复算确为 4 个独立语次，词伙 `great empire`/`imperial gold` 因与课文同源已被正确排除在计数外，**无虚报**。
- **判定**：**可落地**。

## 组 46 · prosperity / thrive

- **A**：OK。段 [1,32] 全 6 句（533–538）逐字一致。
- **B**：OK。同句共现 535，双标记均在（`[[thrive:thrive]]`、`[[prosperity:prosperity]]`）；号段 533–538 一致。
- **C**：候选 37，查到 33。查无 4 条全部合规：`all_synonyms: false`、`vocab.json`（路径）、`bring … prosperity to the town`（省略号模板）、`prosperous`（明写「同族形容词 prosperous 也无卡」，验 `vocab.json` 无该词头 → 否定行属实）。**另核 `prosper` 无卡、全书词边界 0 次，草稿「本书没有 prosper 这个动词」为真**。归位 6/6 通过。
- **D**：默认行 39.5 / 实测 **39.5**（贴线，余量 0.5）；总结句 25.0 / 实测 **25.0**。
- **E**：OK。core=`见太阳就疯长`／`攒下来的家底`，无「兴旺／繁荣／茁壮成长」照抄。
- **F**：OK 且**诚实度值得记一笔**：草稿特意注明「`lasting prosperity` 是课文 535 的连续子串，**卡上词伙是下面三条、无 lasting**」——主动避免把课文串冒充成卡上词伙。thrive `note` 为空亦经核为真，故该列只给 2 条出处。`flourishes after dark`（1099）标为旁支不进表，1099 原文逐字为真。
- **判定**：**可落地**。

## 组 47 · oral / verbal

- **A**：OK。段 [1,33] 全 6 句（539–544）逐字一致，`sentZh` 逐字一致。
- **B**：OK。`oral` 标记于 543、`verbal` 标记于 544，号段 539–544 一致。worklist `all_synonyms=true` 与草稿一致。
- **C**：候选 43，查到 36。查无 7 条全部合规：`all_synonyms: true`（字段值）、`vocab.json`（路径），以及 `oral abuse`/`oral warning`/`verbal practice`/`verbal encouragement` 四条**交叉组合**（草稿写"全库 0 命中、这就是本卡能给的唯一硬边界"）—— 我逐条验，**四条确均 0 命中**，否定行属实且是正面用途（用来划边界）。`oral hygiene` 同理（明写「不写的」）。归位：`offer oral encouragement` **同时**在 `oral`.note 与 `offer`.note（草稿称两卡重复登记，为真）、`verbal abuse`∈`verbal`.note 词伙且草稿注明「课文 0 次」（验为真）、`an oral report in class`/`a verbal warning`/`instead of a written one` 均在 ex 连续子串内，**8/8 通过**。
- **D**：默认行 37.5 / 实测 **37.5**；总结句 18.0 / 实测 **18.0**。达标。
- **E**：OK。core=`开口练、开口报`／`用嘴说、不落到笔头`，把「口头的／语言的」换成动作画面，**本组是全片做得最好的一例**。
- **F**：OK。`offer oral encouragement` 在两卡重复登记一事主动合并、明确写"oral 的词伙在 offer 卡上重复登记一次"，未算两条。`spoken`（草稿称 `vocab.json` 无卡、课文 0 次）经核 **无词头、全书词边界 0 次**，属实；`written` 同理（有 7 处课文但无卡，草稿只称"只在 verbal 卡 ex 里作对举字面出现"，口径准确）。
- **判定**：**可落地**。`all_synonyms: true` 标签经核与数据相符（两卡互点），故整组按"义项可换、词伙不可换"出表的方向正确。

## 组 48 · narrate / tale

- **A**：OK。段 [1,36] 全 6 句（557–562）逐字一致，`sentZh` 逐字一致；并正确注明 557/560 的 `tales` 未加 `[[tale:…]]` 标记。
- **B**：OK。`tale` 标记于 558、`narrate` 标记于 560，同段共现；号段 557–562 一致。旁证句号 526（段 [1,30] 第 5 句）、388（段 [1,8] 第 1 句）、504（段 [1,27] 第 1 句）、1724（段 [5,38] 第 4 句）经 `para_range` 反查**四个段内序号全对**。
- **C**：候选 48，查到 42。查无 6 条全部合规：`all_synonyms: false`、`vocab.json`、`[[tale:…]]`（标记语法示例）、`an + 形容词`（句法图式，非搭配）、`narration`/`narrative`（明写「无卡（本书查不到）」，验两词**均无词头、课文 0 次** → 否定行属实）。归位：`family tale`/`old family tale`/`epic tale` 三条均在 `tale`.note 词伙、`a tale about a brave knight` 为其 `.ex` 连续子串、`narrate the story to his little sister` 为 `narrate`.ex 连续子串、`convey messages`∈`convey`.note（草稿称 convey 有卡，属实），**6/6 通过**。
- **D**：默认行 39.5 / 实测 **39.5**（贴线）；总结句 23.5 / 实测 **23.5**。达标。
- **E**：OK。core=`被讲的那个东西`／`张嘴把它讲出来`，用词性/句法位而非「叙述」作区别 —— 共享义项名不副实（tale 的名词档 vs narrate 的动词档）已按 §5.6 把标题改写成"东西 vs 动作"，未宣称同义。
- **F**：OK。明确写「卡上 3 条词伙与课文 388、504 两处重合」并点出 `humorous tales` 与 humorous 卡词伙同源；narrate 一侧如实报「卡上无词伙段，全部搭配证据就是 ex 一句加课文 560 一句」，不给它编第三格。厚度声明「tale 标记 5 处（388、504、526、553、558）+ 未标记 tales 8 处（525、544、557、560、577、1724、1794、1815）」，我全书扫描**两组句号逐一命中、数目精确**。
- **判定**：**可落地**。

## 组 49 · interpret / paraphrase

- **A**：OK。成员句 559、560 逐字一致（`sentZh` 亦逐字一致）；引用 558 处 `The long tale seemed complicated` 逐字一致。
- **B**：OK。`paraphrase` 标记于 559、`interpret` 标记于 560；段内序号（559 第 2 句、560 第 3 句、558 第 1 句）反查全对。
- **C**：候选 36，查到 33。查无 3 条：`all_synonyms: false`、`vocab.json`、`in … words`（框架图式，两条实串 `in easy words`/`in simple words` 我已分别验在 559 与 `paraphrase`.ex）。归位：`interpret messages`∈`interpret`.note 词伙、`He interprets the poem as a love story`/`He paraphrased the poem in simple words` 两 ex、`comprehend content`+`easier to comprehend`∈`comprehend`.note 词伙（草稿称 comprehend 有卡且词伙即此两条，为真）、`He compiles data from many surveys.`∈`compile`.ex、`decipher old cards`∈`decipher`.note 词伙，**7/7 通过**。
  另核「本书 3 处 interpret 文本没一处带 `in … words`」——interpret 全书仅 560 + 词伙 + 卡 ex 三处，**确无一带 `in … words`**，否定行属实。
- **D**：默认行 39.5 / 实测 **39.5**（贴线）；总结句 26.5 / 实测 **26.5**。达标。
- **E**：OK。core=`换成好懂的话`／`说出它是什么意思`，未照抄「意译／解释／改述／理解为」。
- **F**：OK。`paraphrase`.**note 确为空串**（无词伙、无同义词栏）经核为真，故该列只给 2 条出处；两句卡 ex 宾语同为 `the poem` 是**真实数据巧合**（非同源重复计数），草稿把它当"同宾语、不同框架"的对举用，方向正确。
- **判定**：**可落地**。

## 组 50 · anticipate / expect —— ⚠ 1 处 MISMATCH（数字口径）

- **A**：OK。段 [1,38] 全 6 句（569–574）逐字一致；6 条 `sentZh` 逐字一致。
- **B**：OK。同句共现 574，双标记均在（`[[anticipate:anticipated]]` + `[[expect:expected]]`）；号段 569–574 一致。worklist `sents=[574]`、`all_synonyms=true` 与草稿一致。
- **C**：候选 44，查到 39。查无 5 条全部合规：`all_synonyms: true`、`vocab.json`/`sections.json`（路径）、`[[expect:…]]`（标记示例）、`anticipated for + 游园会`（中英混排图式，`anticipated for` 实串我已验在 574）。归位：`conjecture, expect, predict`∈`anticipate`.note 同义词栏原文（逐字）、`I anticipate rain tomorrow.`∈`anticipate`.ex、`I expect a gift on my birthday.`∈`expect`.ex、`follow expected behaviour`+`achieve expected learning outcomes`∈`expect`.note 词伙、**同条 `achieve expected learning outcomes` 亦在 `outcome`.note**（草稿称"outcome 卡也写着同一串，另有 learning outcomes"，**逐字为真**）、`predict`.note 同义词栏确同时列 `anticipate, expect`（草稿"predict 卡两张都列"为真）。**另独立验证两条否定**：`expect … for` 框架全书 0 命中；`anticipated + 名词` 形容词用法全书 0 命中 —— 草稿两条"搜不到"**属实**。旁段 573 `foresee` 卡 `m`=「预见；预知」、ex=`I cannot foresee what will happen tomorrow.` 逐字为真，且未违规拉进表。
- **D 宽度 → MISMATCH**：默认行 39.5 / 实测 **39.5** ✔；总结句 23.0 / 实测 **23.0** ✔；但 `expect` 的 `core`「等着谁或哪样东西到位」标称 **（9）**，实为 **10 个汉字**（等着谁或哪样东西到位）。偏差 1、未超 1.0 → 记 **MISMATCH 非 BLOCK**；`≤12` 硬门未破，但**落地时应把该行改成（10）**，否则下游照标称值做排版预算会偏。同组另三条 core（8/8/9）复算全对。
- **E**：OK。core=`事先想到有那件事`／`等着谁或哪样东西到位`，默认行=`先想到有事／等人到`，均无「预料／预期／期待／期望」照抄。
- **F**：OK。`achieve expected learning outcomes` 在 `expect` 与 `outcome` 两卡重复登记一事主动合并，未算两条；anticipate 卡零词伙已明写并交代"这一格是空的，不是我漏写"。
- **判定**：**可落地，须作者改一处**（最小清单：把 `expect` 的 core 标称值 `（9）` 改为 `（10）`；内容不必动）。

## 组 51 · pastime / recreation —— ⚠ 1 处 MISMATCH（标签口径判断错）

- **A**：OK。段 [1,39] 全 6 句（575–580）逐字一致；6 条 `sentZh` 逐字一致。
- **B**：OK。`pastime` 标记于 575、`recreation` 标记于 576，同段共现；号段 575–580 一致。worklist `sents=[575,576]`、`all_synonyms=false` 与草稿一致。旁证：579 起笔确为 `Saturday`、段 [1,40] 主题确为周六演出（`paraZh`=「周六午后马戏戏剧音乐会」），草稿的段落衔接叙述为真。
- **C**：候选 40，查到 33。查无 7 条全部合规：`all_synonyms: false`、`vocab.json`/`sections.json`（路径）、`leisure`/`a pastime`/`a recreation`/`the recreation`—— 后四条是草稿明写的"本书查不到"，我逐条验：`pastimes` 0 命中、`a pastime` 0、`a recreation` 0、`recreations` 0、`the recreation` 0、`leisure` 无词头且课文 0 次，**六条否定全部属实**。归位：`sweet pastime`∈`pastime`.note 词伙、`quiet recreation`+`bring quiet recreation`∈`recreation`.note 词伙（草稿"两条词伙之一，另一条 quiet recreation"为真）、`his favorite pastime`/`his favorite recreation` 各为卡 ex 连续子串、`amusement, entertainment`∈`recreation`.note 同义词栏原文、`recreation`∈`pastime`.note 同义词栏（pastime 只列这一个同义词，为真）、`entertain kids`∈`entertain`.note、`amuse friends`∈`amuse`.note，**9/9 通过**。
- **D**：默认行 39.0 / 实测 **39.0** ✔；总结句 23.5 / 实测 **23.5** ✔。core 8/9 两条复算全对。
- **E**：OK。core=`一项项数得出的玩`／`忙完才有的那段放松`，默认行=`一件件玩／忙后的闲`，无「消遣／娱乐／休闲活动」照抄。diff 里「卡给的义项宽窄」那一档确实引用了 `m` 原词，但那一行的论题**就是**义项宽窄（边界说明），且位置在 diff 表而非 core/默认行/表头，未违 E。
- **F**：OK。明写「词伙与课文那两句重合」，同源已合并。
- **MISMATCH（标签口径）**：草稿「提请拍板 2」主张「worklist 标 `all_synonyms: false`，但 pastime 卡同义词栏就是 recreation、两卡 ex 还是同一句模板换词，若要求义项交集与卡上同义词栏一致，**这一组的 false 该改 true**」。**该结论错**，详见下节专项核实。内容层面草稿并未因此写错任何一行（它按"可换但覆盖宽窄不同"出表，判断本身站得住），故只记 MISMATCH、不 BLOCK。
- **判定**：**内容可落地；但作者的改标签建议不可采纳**（最小清单：撤回"false 该改 true"的建议，把该条改写为"本组为单向同义指点，`all_synonyms` 按互点口径为 false 是正确的"）。

---

## 专项核实 ① · `pastime / recreation` 的 `all_synonyms` 标签（重点指派项）

**结论：标签没有标错；草稿的怀疑基于对标签定义的一处误读。且这个标签根本不是出选择题的闸门 —— 闸门在别处，用另一套判据。**

我读了生成器 `tools/confusable_groups.py`，标签的真实算法是（第 301 行）：

```python
both_syn = all(y in syn[x] for x in g for y in g if x != y) if len(g) > 1 else False
out.append({..., 'all_synonyms': both_syn, ...})
```

即 **严格互点**：组内每一对都必须双向出现在对方 `note` 的「同义词：」栏里，才记 `true`。

- 实测 `pastime`.note = `同义词：recreation；词伙：sweet pastime` → `pastime → recreation` **有**；
  `recreation`.note = `同义词：amusement, entertainment；…` → `recreation → pastime` **无**。
  互点不成立 ⇒ `false` 是**算法正确输出**，不是标错。
- 我把 12 组的标签连同 `senses`/`paras`/`sents` 一起按该公式重算，**12/12 与 worklist 存储值完全一致**；扩到全 220 组重算，**0 组与公式不符**。所以"标签可能标错"的说法在 220 组范围内不成立。

更关键的一层（这一层草稿和任务书都都没说到）：

**`all_synonyms` 根本不是"能不能出选择题"的准入依据。** 真正的选项闸门在同一脚本第 95–99 行，是**单向 OR**、直接从 `note` 原文重算的：

```python
# 黑名单：互相列进同义词段的，不做易混边（填哪个都对 → 出成题就是错题）
for a, b, x in edges:
    if b in syn[a] or a in syn[b]:
        continue
```

`pastime → recreation` 单向成立，**这一对今天就已经被这道闸门挡掉了**，改标签既不会关掉它、也不会打开它。全仓 grep 确认 `all_synonyms` 目前只有两个消费者：`check_compare_draft.py`（当字段名跳过）和 `check_shared_sense.py`（仅存进报表 `all_syn`），**没有任何渲染/出题代码读它**。

因此真正的风险方向与指派里的担心**相反**：

| | 闸门（第 98 行，单向 OR） | 标签（第 301 行，双向互点） | 后果 |
|---|---|---|---|
| 双向互点 | 挡 | `true` | 一致，无风险 |
| **单向指点** | **挡** | **`false`** | 标签**低报**同义性 |

实测全书有 **14 / 220 组**属"单向指点"这一档（`endanger/jeopardise`、`pastime/recreation`、`norm/standard`、`compete/contest`、`disturb/interrupt`、`recover/restore`、`cure/heal`、`resemble/similar`，以及 6 个三/四词组）。若日后有人**新写**一个以 `all_synonyms == true` 为准入的出题闸门，这 14 组会被判成"不是同义词、可以当 A/B 选项"，于是**闸门静默敞开**——错题照出。本片只有 idx 51 一组落在这档。

**建议**：不要动数据、不要动这 12 组内容。要做的是消歧：把标签重命名为能表达"互点"的名字，或在 worklist/生成器注释里写明它是 reciprocal-only、下游禁止拿它当选项闸门（选项黑名单应复用第 98 行的单向 OR）。这是**代码/口径**问题，不是**草稿**问题。

## 专项核实 ② · 章 4 的 `expected` 未被标记（重点指派项）

**结论：草稿报得完全属实，且根因也判对了。**

- 全局句 **1386** = 章 4《历史与发明》段 18 第 2 句（口径核对：章 4 偏移 1277 + 该段之前段 0–17 共 107 句 + 段内序号 2 = **1386**；`para_range(4,18)=1384–1389`，反查 `SENT[1386]` 落在 ch4/p18/i2）。
- 原文：`Nobody expected a big breakthrough from a tiny gizmo made in a yard.` —— 句中**确实有 `expected`**，但该句的 `[[…]]` 标记集为空，**没有 `[[expect:expected]]`**。
- 根因经核：`expect` 在**章 1 的 `words` 表里**（故 574 被标），但**不在章 4 的 `words` 表里**（章 4 共 424 词，扫 `expect/anticipate` 均无）。草稿写「章 4 的 words 表里没有 expect，所以那句只是普通用词、没加 `[[expect:…]`」—— **与数据完全一致**。
- 影响面：同一个词头跨章标记不一致，会让"全书出现次数"这类统计漏计。草稿没有被带偏：它把 `expect` 老实写成「标记 1 次（574）+ 未标记 1 次（1386）」，并只把**已标记**的 574 用作表内证据，1386 仅进出处清单作旁证。**处置正确。**
- 这是**数据侧缺口，不是草稿缺陷**，不计 BLOCK/MISMATCH。但值得单独提给人：要么把 `expect` 补进章 4 `words` 并重新标记（属 `shadow/data/` 变更，需走正常流程 + `validate_data.py`），要么在统计口径上统一"按标记数"还是"按词边界数"。

## 全局事项（一次说清，不逐组重复）

1. **A 项最可能真实存在的缺陷未出现**：69 行手抄句我做了逐字符 diff + 完整性扫描（该段每句是否都在表里、`idx` 是否 0..n-1 连续）。三张表全部**满段、连续、无并句、无跳句**，中英两列 0 处不符。两处中文列带追加括注（组 28 的 427/758），剥离后逐字对齐，判为标注非错位。
2. **C 项"否定行藏正证据"未出现**：所有查无串经逐条验证，要么是路径/字段名/省略号模板/句法图式，要么是**独立复验为真的"本书查不到"**（共 16 条否定断言，如 `outstanding debt`、`prosperous`、`oral abuse`、`a pastime`、`narration`、`expect…for`、`anticipated+名词` 等，**0 条伪否定**）。没有任何一条查不到的串被当作正面证据使用。
3. **E 项的口径张力（提给人确认，我未据此判 BLOCK）**：12 组里有 8 组把 worklist 共享义项词加了引号写进**表头一句**（如「这一段"杰出"出现了两次」「这一句把"兴旺"拆成两截」「这一段"消遣"出现了两回」）。按 AUDIT_BRIEF E 的**字面**（`m` 中文词出现在表头 = BLOCK）会 12 组全 BLOCK；但按同文件「口味基线」与 BRIEF §5.6 的**判据**（BLOCK 需"宣称本段两词都指 X"**且**"该段实际不撞"），这些标题都是把 X 当**被拆的靶子**、随即给出句法位/框架差，且 24 个 core、12 条默认行**实测 0 处照抄**义项词，故判 **E 全过**。若他要的是字面严判，请一句话回我，我按字面重跑一遍。
4. **撞位不计**：切片 04（段 [1,4]、[1,8]）、切片 08（段 [1,36]）报的"同段末挂两张卡"我全部按指派**排除在 BLOCK 之外**，仅确认其内容各自独立、切入角不重复（组 26 走"同句正副"、组 27 走"台上一门课 vs 身边一个人"；组 48 走"东西 vs 动作"、组 49 走"换词 vs 定性"），符合 BRIEF §5.9。
5. **薄证据不计退回**：`check_shared_sense.py` 实测 216/220 组（98%）最薄一侧仅 1 处书证，本片 12 组有 11 组落在这一档。按 BRIEF §5.7 与 AUDIT_BRIEF F 的要求，**均未据此判 BLOCK**。

---

## 需要人拍板（3 条）

1. **`all_synonyms` 标签：不采纳切片 09 的改标签建议，改的是口径文档。** 标签 12/12（全库 220/220）与生成公式一致、`pastime/recreation=false` 正确；而真正的出题闸门在 `confusable_groups.py:98` 的**单向 OR**，该对已被挡住。请拍：(a) 只把这个歧义在注释/文档里写死、下游禁止用该标签当闸门；还是 (b) 把字段重命名为 `mutually_listed_synonyms` 之类（属 worklist 生成侧变更，会动 220 组 JSON，需评估下游）。**不建议动 `shadow/data/`。**
2. **章 4 的 `expected`（全局 1386）漏标：修数据还是统一统计口径？** 草稿处置正确、不阻塞落地。但若把 `expect` 补进章 4 `words` 重新标记，会改变"全书出现次数"类统计，且按 AGENTS.md 属 `shadow/data/` 变更（须同步 `SENT_SHIFTS`？—— 本例只加标记、不改句数，故**不触发**该约束，但仍需过 `validate_data.py`）。请拍是否另开一张数据单，不要混在辨析落地里。
3. **E 项判据：按字面还是按口味基线？** 若按 AUDIT_BRIEF E 的字面，8 组标题因带引号出现共享义项词而 BLOCK；若按「口味基线 + BRIEF §5.6」的"宣称同义且实际不撞"判据，全 12 组 E 通过（我采用后者，并实测 core/默认行 0 处照抄）。他点头过的批次 1A 版式本身就是"把义项词加引号当靶子再拆"，所以我倾向维持通过，但这属于判据解释权，请他一句话定。

（另有 2 处 MISMATCH 属作者可自行改的机械项，不需拍板：组 50 `expect` core 标称（9）应为（10）；组 51 撤回"false 该改 true"的建议。）

---

## 审核边界声明

- 只读 `shadow/data/sections.json`、`shadow/data/vocab.json`、`work/compare_groups_worklist.json`、`work/compare_slices/*.json`、`tools/confusable_groups.py`、`tools/check_shared_sense.py`、三份草稿；未把 `work/confusable_groups.json`、PDF 同义替换表、何琼等号表当出处。
- 未修改任何草稿、数据、`shadow/index.html`、测试文件。
- 唯一 git 操作为 `git status` / `git diff`（只读）。审核时工作区已有改动，**均非本次审核产生**。
- **重要：审核期间 `shadow/data/vocab.json` 被另一个 agent 并发写入。** 我开跑时 `git status` 只有 `shadow/index.html` 等 3 项，收工前多出 ` M shadow/data/vocab.json`（mtime 20:45:45）。逐 head 比对 HEAD vs 工作区，改动仅 **5 个**：`swear`、`curse`、`peep`、`glimpse`、`glance`（内容是批次 1A/1B 已落地辨析卡的 `note` 由字符串化的 dict 规范成真 dict、并把标题「这一句…」改成「这一段…」），**全 3245 个 head 里只动这 5 个**。
  我进一步比对了本审核依赖的全部 **57 个 head**（12 组成员 + 所有旁证卡），结论：**0 个被改动，HEAD 版与工作区版逐字节相同** → 本文件所有 A/B/C/D/E/F 结论**对两个版本同时成立**，无需重跑。这 5 个被改的 head 也不在任何一组辨析里。
- 本审核**未**触碰 `shadow/data/`；但落地阶段请以最终 `vocab.json` 重跑一次 `python3 scripts/validate_data.py` 与 `npm test`，因为并发写入正在进行中。
- 我跑过 `tools/check_shared_sense.py` 作独立佐证，该脚本第 66 行会固定重写 `work/sense_check_220.json`（脚本自身行为，非我写入内容；该文件未出现在 `git status` 中）。
