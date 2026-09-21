# 门禁 2 审核 · 批次 2 切片 05 / 06 / 07（worklist_idx 30–44）

组数 15 / BLOCK 8 / MISMATCH 16 / 通过 7（通过组均带 MISMATCH 待订正，无 BLOCK）

> 审核人：agent（非草稿作者）。数据原文只读 `shadow/data/sections.json` + `shadow/data/vocab.json`。
> 未修改任何草稿 / 数据 / 测试；未做任何 git 写操作。

## 审核方法与工具（先说清我怎么算的，便于复核）

| 项 | 做法 |
|---|---|
| A 原文表 | 用脚本抽出三份草稿里**全部 86 行**带全局句号的表格行（2_05 = 32 行、2_06 = 24 行、2_07 = 30 行），逐行与 `paragraphs[段][句]` 去 `[[词头:表面]]` 标记后的原文 + 同位 `sentZh` 做**全等**比对（去粗体 `**`、归一空白）。不是抽查。**逐字比对结果：85 行全等，1 行不符（见组 42）。** 2_05 作者自称"32 行原句表已逐字比对、零不符"——**我重跑过，这条断言为真**（切片 05 全部 32 行、中英两列零不符）；唯一的不符出在 2_07。另外核了「整段覆盖」：2_05 五组均为整段全列（387–392 / 417–422 / 429–434 / 447–454 / 461–466 行数与段内句数一一对应，无并句、无漏行）；2_06、2_07 的组 36/37/39/41 等只列部分行，但表头自己声明了"成员两句 + 前后各一句"，声明与实际行一致。 |
| B 句号与共现 | 章偏移 `[0,339,651,883,1277,1492]` + 段前句数 + 段内序号自算，反查每组的 `[章,段]` 全局区间（章1 段8=387–392、段13=417–422、段15=429–434、段18=447–454、段20=461–466、段21=467–472、段22=473–478、段23=479–484、段25=491–496、段27=503–508、段28=509–514、段29=515–520），并全库扫 `[[词头:…]]` 标签确认每个成员在书中出现的**唯一位置**与草稿所写句号一致。15 组 30 个成员**全部对得上**，各成员全书确实只 1 处。paraZh / subheads 引用 12 处全部逐字命中。 |
| C 可 grep | 不复用门禁 1。自建扫描：把草稿里**所有**拉丁串（含①反引号内混了中文的、②完全不在反引号里的裸文本）拉出来查三份变体 haystack（原文 / 摘标记 / 词头+表面）。三份草稿合计 0 条"被当正面证据却查不到"。2_05 的 18 条否定行串我逐条回原文确认**确实全库查无**（诚实否定行，放行）。 |
| D 宽度 | 先定死口径再算（见下）。 |
| E 义项照抄 | 从两张成员卡 `m` 机器切出义项词表，比对 title / 默认行 / 总结句 / core 四个槽。 |
| F 同源 | 把每条卡词伙拿去课文反查，判定哪些是同一处文本，复算草稿写的"独立文本 N 条"。 |

**D 宽度口径必须先裁定（影响 10 组的结论）**：AUDIT_BRIEF D 行原文是「CJK 字符计 1，其余（拉丁字母、空格、`=`、括号、标点）计 0.5」——"标点"是否含中文标点，字面读不通。我用**批次 1A 的实测数反推口径**（那是他点头过的形状基准）：1A 5 条默认行标称 38.0 / 38.0 / 39.0 / 36.0 / 39.5，按「汉字与中文标点各记 1、非汉字记 0.5」**5 条全部精确命中**；按「只有汉字记 1、中文标点记 0.5」**5 条全部差 2.5**。故本次审核以**「汉字 + 中文标点 = 1」为基线口径**（2_05、2_06 用的就是这个，2_07 用的是另一个）。若你认为应改用后者，下面组 40–44 的 5 个 D-BLOCK 全部自动消解，但 2_05/2_06 的 10 条默认行会集体反转为"虚报 2.5"。**这一条要你拍板。**

---

## 切片 05（`work/辨析草稿/2_05.md`，组 30–34）

## 组 30 · diary / journal —— 日记 ｜ 段 [1,8] ｜ 句 390 / 391

- **A 原文表：OK**。6 行（387–392）与数据逐字全等，英/中两列都是；无并句、无漏行（段 8 恰 6 句）。paraZh 引文「借阅科幻小说、记日记抄诗、买杂志做笔记，校园文化生活丰富多彩。」逐字命中。
- **B 句号与共现：OK**。390 = `[[diary:diary]]`、391 = `[[journal:journal]]`，两处均在全书唯一一次出现；章1 段 8 全局区间 387–392 与草稿所写一致。
- **C 可 grep：OK**。正面证据我亲自 grep 到 11 条（`small diary`、`kept a small diary`、`He writes in his diary every night.`、`He keeps his diary private.`（= private 卡 ex，核实无误）、`copied out a short verse of love poetry`、`love poetry`、`class journal`、`a blue class journal`、`wrote notes in a blue class journal`、`science journal`（= journal 卡 ex 连续子串）、`a cheap sports magazine` / `sports magazine`）。否定行 4 条 `keep a diary`、`daily journal`、`journalism`、`diaries` **逐条回原文确认全库查无**（三种变体都查），是诚实否定行 → 放行。顶部小结自称"关掉否定行仍缺 18 条"→ 我复跑得到**恰好 18 条**，全部落在 5 个「不写的」清单内，不虚。
- **D 宽度：OK**。默认行 标称 37.0 / 实测 37.0；总结句 标称 22.0 / 实测 22.0。
- **E 义项照抄：BLOCK（两处，都在表头）**。
  1. 表头写「**同一个"日记"**，谁在看这本子差得最远」——「日记」是两张卡 `m` 里的原词（diary `n. 日记`；journal `n. 期刊；日志；日记`），且这句是在**宣称本段两词同指"日记"**。而该段实际不撞：390 `sentZh` 译「小日记」、391 `sentZh` 译「班级**日志**」。**草稿自己的 diff 表「中文落点」行就写着"一个译「日记」，一个译「日志」"**——表头与自己的表体互相打脸。按 BRIEF §6 的固定处置（标题改写成"各领哪样东西"、义项只留在 `sense` 槽），这是必须改的。
  2. 同一错误的延伸：顶部小结 + 「证据强度」的"待你拍①"写「journal 卡 `m` 第一档是「期刊」，**本书用的却是第三档「日记」**」。**这条是错的**：`m` 三档顺序是 期刊(1) / 日志(2) / 日记(3)，本书唯一那处 391 的 `sentZh` 是「那本蓝色的班级**日志**里」，用的是**第二档「日志」**，不是第三档「日记」。整组的"提请拍板"就建立在这个误读上。
- **F 同源与厚度诚实：OK**。`small diary`（卡词伙）与课文 390、`class journal`（卡词伙）与课文 391 都明标"同一处"，未算成两条；diary 侧"隐私"那格明确说明靠的是 private 卡 ex、不是本书标记句，并叮嘱"落地时别把它当课文证据引用"——诚实。各侧未虚报条数。
- **判定：需作者改**。最小清单：① 表头去掉「同一个"日记"」的宣称，改成"这两本本子各给谁翻"式（BRIEF §6 已给的现成写法）；② 删掉/改正"第三档日记"那句，写成"本书用的是第二档「日志」（391 `sentZh`），`期刊`/`日记` 两档本书 0 例"；③ 「证据强度」补一句"本书没把 journal 当日记用过"。三处都是文字层面一次改完，不用重做。

## 组 31 · minus / subtract —— 减去 ｜ 段 [1,13] ｜ 句 417 / 418

- **A 原文表：OK**。6 行（417–422）逐字全等；段 13 恰 6 句，整段列全，无并句。paraZh「新生期末周林梅结伴复习定计划。」命中。
- **B 句号与共现：OK**。417 `[[minus:minus]]`、418 `[[subtract:subtract]]`，各全书唯一 1 次，相邻两句。
- **C 可 grep：OK**。正面证据 9 条命中（`minus a few tiny changes`、`identical schedules during finals week`、`The temperature is minus ten degrees Celsius.`、`subtract old scores`、`how to subtract old scores`、`Their maths teacher`、`Subtract 5 from 10 to get 5.`、`small daily gains multiply into a high mark`、`identical schedules`= identical 卡词伙）。否定行 4 条 `a minus`/`minuses`/`minus sign`/`subtract from` **全库确无** → 放行（注意：`subtract from` 作为连续串确实没有，卡 ex 是 `Subtract 5 from`，草稿没拿它当搭配用，只是声明"没有这条连续文本"，措辞准确）。`multiply` 卡 `m`「v. 增加；繁殖」与 `ex`「The bacteria multiply quickly.」均核实无误。
- **D 宽度：OK**。默认行 39.0 / 39.0；总结句 24.5 / 24.5。
- **E 义项照抄：OK**。卡 `m` 词「负的 / 缺点 / 减去」在 title、默认行、总结句、两个 core 里**一次都没出现**（core = 说少了哪几样 / 把旧分数扣掉）。全切片 E 最干净的一组。
- **F 同源与厚度诚实：MISMATCH**。「subtract 有卡上词伙 `subtract old scores`，且与课文 418 是同一处，卡 ex 又给了 from/to 框架 → **3 条独立文本**」——作者一边点名"同一处"，一边仍把词伙与课文算成两条，**实为 2 条独立文本**（卡词伙＝课文 418 / 卡 ex）。未按 BRIEF §8 同源合并。未据此宣称"两处书证方向一致"，故只算 MISMATCH。
  另：minus 卡 `note` 确实是空串（零词伙段）——核实为真，草稿如实报备并主动提请拍板 ②，处置正确。
- **判定：可落地**。只需把"3 条独立文本"改成"2 条独立文本（卡词伙＝课文 418 同一处）"。

## 组 32 · rate / ratio —— 比率 ｜ 段 [1,15] ｜ 句 429 / 430

- **A 原文表：OK**。6 行（429–434）逐字全等，段 15 整段列全。paraZh「物理焦虑中互助称量希望。」命中。
- **B 句号与共现：OK**。429 rate / 430 ratio，各全书唯一 1 次。
- **C 可 grep：OK**。正面证据 10 条命中（`the fast failing rate in physics`、`failing rate`、`interest rates`、`crime rates`、`low birth rates`、`The interest rate is very low this year.`、`simple study ratio`、`The ratio of boys to girls is 3 to 2.`、`a large proportion of freshmen`、`only a fraction of her usual jokes`、`A fraction of the students passed the test.`）。我另核了草稿的两处卡结构断言：rate 卡 `note` 同义词确为 `grade, measure`、ratio 卡 `note` 同义词确为 `proportion`、proportion 卡 `note` 同义词确含 `ratio`，且草稿说"grade / share / percentage 在 vocab.json 无卡"→ 三个都**确实无卡** ✓。**"rate 侧 5 条里 3 条卡词伙是真独立"我反查过**：`interest rate` / `crime rate` / `birth rate` 在课文里**一处都没有**，所以没跟 429 同源 → 草稿算的"7 条独立文本（rate 5 + ratio 2）"**成立**，这是三份草稿里少数没虚报条数的一格。否定行 `ratios`、`at a rate of` 全库确无 → 放行。
- **D 宽度：OK**。默认行 39.0 / 39.0；总结句 15.5 / 15.5。
- **E 义项照抄：BLOCK**。表头写「**同一个"比率"**，429 那句关心它涨得多快…430 那句只关心两样东西怎么配对」。「比率」是两张卡 `m` 的原词（rate `n. 比率；价格`、ratio `n. 比率；比值`），且"同一个"是在宣称本段同指。该段实际不撞：429 `sentZh` 译「挂科**率**太高」、430 `sentZh` 译「学习**配比**」——**草稿自己的 diff 表「中文落点」行就写着"一个译「率」，一个译「配比」"**，与表头互相矛盾。core（说高低快慢 / 说几比几）、默认行、总结句都干净，只有表头这一处。
- **F 同源与厚度诚实：OK**。`simple study ratio` 明标"卡上词伙，与课文 430 同一处"，未算两条。
- **判定：需作者改**。最小清单：表头半句改写（例："这一句在算两笔账：429 那笔看的是快慢高低，430 那笔看的是谁比谁"），删掉"同一个比率"。其余全部可保留，证据厚度是真的。

## 组 33 · elementary / rudimentary —— 基本 ｜ 段 [1,18] ｜ 句 452（同句共现）

- **A 原文表：OK**。**8 行**（447–454）逐字全等，段 18 整段列全（切片 5 组里唯一 8 句的段，没漏行）。paraZh「确立制度迎接忙碌秋课收尾。」命中。
- **B 句号与共现：OK**。两词确实**挤在同一句 452**：`[[rudimentary:rudimentary]]` + `[[elementary:elementary]]`，切片 `sents` 只有 `[452]`，草稿"同句共现"的说法与数据一致（本组是 15 组里唯一被切片标为同句共现、且作者没有把它写成相邻两句的）。两词各全书唯一 1 次。
- **C 可 grep：OK**。正面证据 9 条命中（`elementary word lists`、`a few elementary word lists`、`worked through a few elementary word lists`、`rudimentary maths`、`reviewed their rudimentary maths`、`He is learning elementary math at school.`、`His knowledge of math is rudimentary.`、`the club's new spring syllabus for beginners`、`new spring syllabus`）。另核：rudimentary 卡 `note` 同义词 `basic, essential, fundamental` → 草稿称"三词都无卡"，**我逐个查过：basic / essential / fundamental 全部 NO CARD** ✓；elementary 卡 `note` 确实只有词伙段 ✓；primary 卡 `m` 确有「小学的」档、本书唯一一处 339 译「第一目标」✓（报备诚实）。否定行 `elementary school`、`rudimentary understanding`、`rudiment` 全库确无 ✓。
- **D 宽度：OK**。默认行 38.0 / 38.0；总结句 23.5 / 23.5。
- **E 义项照抄：OK**。卡 `m` 词「初级的 / 基本的 / 未充分发展的 / 初步的」未进 core、默认行、总结句。表头写「452 这一句同时用了两个"基本"」——严格说"基本"是 worklist 义项名、也是 `基本的` 的前缀，但**该段确实两个词都撞在"基础"这层**（452 `sentZh` 同时给了「基础的数学」和「最入门的单词表」，作者没有宣称同指，反而立刻接"本书自己把对象分开了"），且 core 用的是"等级 vs 存量"这种非照抄的钩子 → 放行。
- **F 同源与厚度诚实：MISMATCH**。「两卡 `note` 都有词伙段（**各 1 条，且都与课文 452 是同一处**），另有卡 ex 各 1 句 → **每侧 3–4 条独立文本**」——点名了同源却仍按不同源计数：每侧实际 = 课文 452（含卡词伙）1 处 + 卡 ex 1 句 = **2 条独立文本**，虚报约一倍。未据此宣称"两处方向一致"（它反过来强调"不拿『初步的/初级的』当区别，只拿有 ex 支撑的线当区别"）→ 只算 MISMATCH。
  另：本组最好的一格（452 同句把 rudimentary→maths、elementary→word lists 分开）确实是本书给的，不是作者语感，核实成立 ✓。
- **判定：可落地**。只需把"每侧 3–4 条独立文本"改为"每侧 2 条独立文本（卡词伙＝课文 452 同一处）"。

## 组 34 · dissertation / thesis —— 学位论文 ｜ 段 [1,20] ｜ 句 464 / 465

- **A 原文表：OK**。6 行（461–466）逐字全等，段 20 整段列全。paraZh「诚信应考抓住每课要点。」命中。
- **B 句号与共现：OK**。464 thesis、465 dissertation，各全书唯一 1 次、相邻两句。
- **C 可 grep：OK**。正面证据 12 条命中（`senior thesis`、`a short senior thesis`、`Senior students showed`、`as guides`、`His thesis is that exercise improves memory.`、`long dissertation`、`Nobody wrote a long dissertation`、`He wrote his dissertation on climate change.`、`dissertation on climate change`、`a neat model paper`、`each chapter heading`、`fixed each chapter heading carefully`）。卡结构断言逐张回 `vocab.json` 核过：paper `m`=「n. 论文；纸；报纸」+ 词伙 `model paper, neat model paper` ✓；chapter 与 heading 两卡词伙**同条** `chapter heading` ✓。否定行 6 条 `theses`/`dissertations`/`doctoral dissertation`/`master's thesis`/`submit a thesis`/`defend the dissertation` **全部全库确无** ✓（复数形那条我也单独查过，确实搜不到）。
- **D 宽度：OK**。默认行 35.5 / 35.5；总结句 25.0 / 25.0。
- **E 义项照抄：OK（附说明）**。表头写「中文都叫"论文"」——成员卡 `m` 原词是「学位论文」，"论文"是其一部分；关键是**该段确实撞**：464 `sentZh`「短论文」、465 `sentZh`「长博士论文」，两句中文都带"论文"，所以这不是把名不副实的共享义项写进标题（BRIEF §6 的反例），而是如实描述中文撞车、再把区别押在长短/框架/第二身份上。core（学长拿来当指引的那本 / 长到没人动笔的那本）不含义项词。→ 放行。
- **F 同源与厚度诚实：OK**。"长短"两条明标 `senior thesis`＝464、`long dissertation`＝465 同源，未算两条；并自称"本切片最薄的一组"，无虚报。
- **判定：可落地（内容层）**。本组有两处**数据本身的缺陷**要你先拍板，见下方「数据侧核实结论」。

---

## 切片 05 · 两处「数据本身疑似问题」的独立核实结论

**① `thesis` 卡卡内自相矛盾 —— 属实，建议改卡。**
`shadow/data/vocab.json` 原文：`thesis` = `{m: "n. 学位论文", ex: "His thesis is that exercise improves memory.", exZh: "他的论点是锻炼能改善记忆力。", note: "词伙：senior thesis"}`。
`m` 只印一档「学位论文」，`ex`/`exZh` 却把 thesis 当「论点」用（`thesis is that + 从句` 这个框架在"学位论文"义下不成立）。两档中文零重叠，卡内自相矛盾**核实为真**。
旁证：本书唯一一处 thesis（课文 464 `a short senior thesis` / 译「短论文」）走的是"学位论文"档，所以"论点"这档在全书**零书证**，只有这张卡 ex 自己造了一个。
影响面：组 34 diff 表「后面怎么接」「有没有第二个身份」两格完全靠这条 ex 撑（草稿已如实点名）。
**建议**：给 `thesis.m` 补「n. 论点」一档（一处改动、不动课文、不动 SENT_SHIFTS），补完之后这张卡的"第二身份"维度才站得住。不补的话，落地时这两格要降级为"卡上例句这么写，本书没这样用过"。

**② `journal` 卡的档位说法 —— 草稿报错了档，实际问题比它说的轻。**
`journal.m` = 「n. 期刊；日志；日记」（三档：1 期刊 / 2 日志 / 3 日记）；`note` = 「词伙：class journal」；`ex` = 「He reads a science journal every week.」/「他每周读一本科学期刊。」
本书唯一一处（课文 391 `a blue class journal`）`sentZh` 是「每天都把笔记写在那本蓝色的班级**日志**里」→ 用的是**第二档「日志」**。
**草稿顶部小结与"待你拍①"写的「本书用的却是第三档『日记』」是错的**（见组 30 E 项）。
真正的数据侧问题只有半个：卡 ex 走第 1 档、本书/卡词伙走第 2 档，**第 3 档「日记」在本书 0 例**，而 worklist 把共享义项取成了 diary∩journal 的「日记」。这不构成改卡理由（三档都真实存在），**要改的是草稿的表头与那句拍板申请**。

---

## 切片 06（`work/辨析草稿/2_06.md`，组 35–39）

## 组 35 · cite / reference —— 提及 ｜ 段 [1,21] ｜ 句 468（同句共现）

- **A 原文表：OK**。6 行（467–472）逐字全等，段 21 整段列全。paraZh「整理引用搭建知识框架。」命中；`subheads[1][0]`=「上篇·新生学期」命中。
- **B 句号与共现：OK**。468 同句确有 `[[reference:reference]]` + `[[cite:cite]]`，两词全书各仅 1 次。
- **C 可 grep：OK**。正面证据 8 条命中（`cite sources`、`learned how to cite sources correctly`、`He cited a book in his essay.`、`reference book`、`one useful reference book`、`Please use this book for reference.`、`for reference`、`refer to`）。卡结构断言核实：cite `note`=「同义词：quote, refer to, mention；词伙：cite sources」✓、reference `note`=「词伙：reference book」**确实没有同义词栏**✓、cite `m`=「v. 引用；提及」、reference `m`=「n. 参考；提及」**逐字与草稿 line 30 引文一致**✓。否定行 `citation`、`cited in` **全库确无**（`citation` 也确实无卡）→ 放行。"reference 的『提及』义本书 0 例"✓（唯一一处 468 译「参考书」）。
- **D 宽度：OK**。默认行 38.5 / 38.5；总结句 24.5 / 24.5。文件头 line 10 自称"两个口径都 ≤40 / ≤30"，我两个口径都算了：默认行 38.5（标点=1）/ 36.0（仅汉字）→ 两句声明都成立 ✓（2_06 是全批次唯一主动把两个口径都摆出来的文件，这条做法建议推广）。
- **E 义项照抄：低危（待口径裁定），不算 BLOCK**。表头「两个"提及"一个是你伸手去引的那个动作、一个是桌上备着查的那本书」含 `m` 原词「提及」「引用」；默认行「reference = 桌上那本**参考**书」含 reference 的 `m` 词「参考」。但表头用的是**BRIEF §6 规定的正确句式**（拿义项名当话题词、紧跟"各领哪样"），并且 line 30–31 明写「不在标题里宣称本段两词都指"提及"」——与组 30/32 的"同一个 X"宣称性质不同，故我不判 BLOCK。「参考书」是 `reference book` 的固有译法、不是把义项当区别，放行。
- **F 同源与厚度诚实：MISMATCH**。line 71「它的搭配总账只有：**卡词伙 1 条 + 卡 ex 1 句 + 课文 1 句**。cite 侧同理（词伙 1 条 + ex 1 句 + 课文 1 句）」——`reference book` 与课文 468、`cite sources` 与课文 468 都是同一处文本，每侧**实为 2 条独立文本**，虚报为 3。未按 BRIEF §8 合并。
- **判定：可落地**。① 「提及」这个共享义项名不副实的处置（表头按词性讲 + 把义项收进 diff 第 1 行 + 明说本书 0 例）**完全符合 BRIEF §6，是 15 组里最标准的一处示范，不该退回**；② 只需把两侧总账改成"2 条独立文本（卡词伙＝课文 468 同一处）"。

## 组 36 · cite / quote —— 引用 ｜ `all_synonyms: true` ｜ 段 [1,21] ｜ 句 468 / 469

- **A 原文表：OK**。4 行（467–470）逐字全等。表头自称"只列成员两句 + 前后各一句"，实列 4 行、声明与行一致（本切片部分列行的三处都核过，没有一处声明与实际不符）。
- **B 句号与共现：OK**。468 cite、469 quote，相邻两句、各全书唯一 1 次。切片 `all_synonyms: true` 与草稿引用一致，且我核了两卡 `note` 确实**互指**（cite 卡同义词含 quote、quote 卡同义词＝cite）✓。
- **C 可 grep：OK**。正面证据 8 条命中（`cite sources`、`He cited a book in his essay.`、`sources`、`one perfect quote for the wall`、`perfect quote`、`He quoted Shakespeare in his speech.`、`elicit fresh thoughts`、`how to cite sources`）。`elicit fresh thoughts` 确为 elicit 卡词伙且=课文 469 同一处（草稿已标"与课文 469 同一处"）✓。否定行 `in quotation marks`、`citation` 全库确无 ✓；"quote 卡 `m` 的『报价』一档本书 0 例"✓（quote 仅 469 一处，名词"引文"义）。
- **D 宽度：OK**。默认行 39.0 / 39.0；总结句 23.5 / 23.5。
- **E 义项照抄：低危（待口径裁定）**。表头「两个"引用"接的不是同一种东西」含两卡 `m` 原词「引用」，但同 §6 句式（紧跟"接的不是同一种东西"）；core（把从哪儿来的点名 / 搬过来的那一句）、默认行、总结句**全部干净**。放行。
- **F 同源与厚度诚实：MISMATCH**。line 129「各配卡词伙 1 条 + 卡 ex 1 句 → **独立文本各 3 条**」——词伙 `cite sources`／`perfect quote` 分别与课文 468／469 同源，每侧实为 2 条。
- **判定：可落地**。硬约束 3（整组同义照写、区别落在词性/框架/搭配对象）执行到位：本组把区别钉在"cite 只能当动作、quote 天生可数"上，且用的是 468/469 的现场形态（`to cite` vs `one perfect quote`），不是语感。只需订正条数。

## 组 37 · abstract / summary —— 摘要 ｜ 段 [1,21] ｜ 句 470 / 471

- **A 原文表：OK**。4 行（469–472）逐字全等，声明的"成员两句 + 前后各一句"与行一致。
- **B 句号与共现：OK**。470 abstract、471 summary，相邻两句、各全书唯一 1 次，且两句句式平行（草稿"同一句式"的观察成立）。
- **C 可 grep：OK**。正面证据 11 条命中（`write a short clear abstract daily`、`a short clear abstract`、`clear abstract`、`extract key lines`、`illustrate abstract theories`、`an abstract shape`、`The painting shows an abstract shape.`、`a brief morning summary`、`brief morning summary`、`morning summary`、`He gave a summary of the story at the end.`、`at the end`）。卡结构核实：theory 卡与 illustrate 卡**确实同条词伙** `illustrate abstract theories` ✓；summary `note` 确有 2 条词伙 `brief morning summary, morning summary` ✓；abstract `note` 词伙确为 `illustrate abstract theories`（形容词义）✓；syllabus 卡同义词确为 `curriculum, outline, summary` ✓ 且 **outline 确实无卡** ✓、curriculum 有卡（草稿没 claiming 它无卡，措辞安全）。否定行 `abstract of a paper`、`write a summary of` 全库确无 ✓。
- **D 宽度：OK**。默认行 40.0 / 40.0 —— **恰好压在 ≤40 的上限**，不超但零余量（换个口径或加一个字就爆），落地时建议减 2 字留余量。总结句 24.5 / 24.5。
- **E 义项照抄：OK**。卡 `m` 词「摘要 / 概要 / 抽象的 / 总结」**在 title、默认行、总结句、core 四个槽里一次都没出现**（core = 抽关键句攒成的一段 / 收个尾再说一遍）。与组 31、33 并列，是本批次 E 最干净的三组。
- **F 同源与厚度诚实：MISMATCH**。line 188「summary 侧相对厚一点：卡词伙 2 条 + 卡 ex 1 句 + 课文 471，**四条文本方向一致**」——`brief morning summary`（卡词伙）＝课文 471 同一处、`morning summary` 又是它的前缀，三者实为 1 处文本，加上卡 ex 才 **2 条独立文本**，虚报为 4；且把虚报后的条数用来支撑"方向一致"的判断，已贴近 AUDIT_BRIEF F 的 BLOCK 线。**我判 MISMATCH 而不是 BLOCK**，理由是：即便把同源合并，剩下那 1 条独立文本（卡 ex「gave a summary of the story **at the end**」）本身就足以撑"summary 是收尾"这一格，结论不依赖虚报。另：abstract 侧主动报备"名词『摘要』只有课文 470 一条 + 卡 m 一个字面"——**这条报备是真的**，我核过 abstract 卡 ex 走的是形容词义 ✓，处置符合 BRIEF §7（薄就如实写）。
- **判定：可落地**。改两处：默认行减字留余量；"四条文本方向一致"→"2 条独立文本（词伙＝课文 471 同一处）"。

## 组 38 · detect / perceive —— 察觉 ｜ 段 [1,22] ｜ 句 476（同句共现）

- **A 原文表：OK**。6 行（473–478）逐字全等，段 22 整段列全。paraZh「大胆假设细心观察保持清醒。」命中。
- **B 句号与共现：OK**。476 同句含 `[[perceive:perceive]]` + `[[detect:detect]]`，两词全书各仅 1 次。草稿"由同一个主语 `Sharp eyes` 管着"✓ 与原文一致。
- **C 可 grep：OK**。正面证据 10 条命中（`detect rising stress`、`detect rising stress early`、`perceive small changes`、`Sharp eyes could perceive small changes and detect rising stress early`、`I can detect a change in her mood.`、`a change in her mood`、`I perceive a change in his mood.`、`The robot uses a sensor to detect walls.`、`to detect walls`、`mount a small detector on the boulder`）。**特别核了两条容易造出来的**：课文 94 确为该句、`sentZh` 确为「在那里她帮朋友把小探测器安装在巨石上」✓；`detector` **确实无卡** ✓。卡结构核实：detect 同义词 `find, discover, notice` ✓、perceive 同义词 `appreciate, ascertain, comprehend` ✓、perceive `note` 词伙确为 `perceive small changes` ✓、discern 有卡且 `m`=「v. 辨明」✓（草稿说"第三个『看出来』，切片没并进本组"✓ 切片 38 成员确实只有两词）。否定行 `detect a problem`、`perceive sth as` 全库确无 ✓。
- **D 宽度：OK**。默认行 39.0 / 39.0；总结句 23.0 / 23.0。
- **E 义项照抄：BLOCK（默认行）**。默认行写「detect = **测出**升上来的（rising stress），perceive = 看出小差别（small changes）」——「测出」是 detect 卡 `m` 的**第一档原词**（`v. 测出；察觉`）。AUDIT_BRIEF E 明确把"成员卡 `m` 里的中文词出现在**默认行**"列为 BLOCK，而这正是 E 要防的那种写法：钩子只把词典释义搬过来，没给画面。（表头那处「两个"察觉"接的不是同一种东西」属 §6 句式，与组 35/36 同类，不另计。）
- **F 同源与厚度诚实：MISMATCH（轻）**。line 247「detect 课文 1 次（476）+ 卡 ex 1 句 + **卡词伙 1 条** + sensor 卡 ex 1 句」——`detect rising stress`（词伙）＝课文 476 同一处，未合并，detect 侧实为 3 条独立文本。另外 line 229 说「书里另一处 detect 的主语是机器 —— sensor 卡 ex」，措辞会让人以为课文里有第二处 detect；实际课文 detect 仅 476 一处，"另一处"来自卡 ex。表述收一下即可，事实本身（sensor 卡 ex 那句）核实为真。
  本组最好的一格——`a change in her mood` / `a change in his mood` 两张卡 ex 几乎同句——是**两条真独立文本**，草稿把它写在 diff 第 1 行而不是硬掰成区别，处理得当 ✓。
- **判定：需作者改**。最小清单：① 默认行「测出」换成画面钩子（例："detect = 把没摆到明处的查出来（rising stress）"，core 里已有现成措辞）；② line 229「书里另一处」→「另一处在卡 ex（不是课文）」；③ detect 侧条数合并为 3。

## 组 39 · postulate / presume —— 假定 ｜ 段 [1,22] ｜ 句 473 / 474

- **A 原文表：OK**。4 行（473–476）逐字全等。（表头自称"成员两句 + 后一句"实列 4 行、多给了 476 一句，属声明写得比实际窄，内容与数据无冲突。）paraZh 命中。
- **B 句号与共现：OK**。**注意切片 `sents` 是 `[473, 474]`，顺序与词序相反**：473 = `[[presume:presume]]`、474 = `[[postulate:postulate]]`。草稿通篇按"473 presume / 474 postulate"写，**与数据一致、没照抄切片的词序**（这正是该做的）；两词全书各仅 1 次。
- **C 可 grep：OK**。正面证据 12 条命中（`never presume`、`would never presume cheating`、`presume cheating`、`without verification`、`I presume he will arrive tomorrow.`、`quiet simple postulate`、`simple postulate`、`one quiet simple postulate`、`put forward one brave new hypothesis and one quiet simple postulate`、`for her friends to test`、`He postulates that all humans are equal.`）。卡结构核实：presume `m`=「v. 假设；假定；设想」**确实只有动词一档** ✓、postulate `m`=「n. 假设；v. 假定」**确实有名词一档** ✓、postulate `note` **确实没有同义词栏** ✓、presume `note` 词伙确为 `never presume` ✓。否定行 `presume that…` 无第二处 ✓（presume 仅 473 一处）。
- **D 宽度：OK**。默认行 39.5 / 39.5；总结句 23.0 / 23.0。
- **E 义项照抄：低危（待口径裁定）**。表头「两个"假定"一个是私下的、一个是摊开来的」含两卡 `m` 原词「假定」，§6 句式（紧跟"一个是…一个是…"）；默认行、core（没核实就先当真 / 摊开来待人验的那条）、总结句干净。放行。
- **F 同源与厚度诚实：MISMATCH ×2**。
  1. line 305「它的独立文本总账是：课文 1 句 + 卡词伙 1 处 + 卡 ex 1 句」——词伙 `quiet simple postulate` / `simple postulate` 就是课文 474（草稿自己也点了"两条其实指同一处，即课文 474"），**实为 2 条独立文本**。
  2. line 307 边界句「同段的 `suppose`（473）、`hypothesis`（474）、`speculate`/`predict`（475）与 471 的 `assume` 都有卡，**切片另有组 195 / 217 收它们**」——前半"都有卡"我逐个查过 ✓ 属实；后半不成立：**217 = hypothesis / postulate / presume / suppose ✓（草稿复述得准）**、**195 = deem / reckon / suppose ✓**，但 `speculate`、`predict`、`assume` 在 `compare_groups_worklist.json` 全 220 组里**一组都没被收**。这句不影响卡内容（结论"不并进来"仍然对），但"别的组收了"是个不存在的事实，会被下游当依据。
- **判定：可落地**。改 2 处计数/边界表述。本组"最硬的一格是 `for her friends to test` 对 `without verification`、两处都在句子里不靠语感"——核实为真，是 15 组里语义最干净的一组。

---

## 切片 07（`work/辨析草稿/2_07.md`，组 40–44）

> **本文件有一个贯穿性缺陷：宽度口径用错了。** 2_07 的文件头写「宽度口径：CJK 记 1、其余字符记 0.5」，作者据此把**中文标点（（） ， 、）也记 0.5**，即"只有汉字记 1"。批次 1A（他点头的形状基准）5 条默认行的标称值只有"汉字 + 中文标点各记 1"这个口径能对上。后果：**10 条标称宽度全部低于实测（差 0.5–2.5），其中 3 条默认行按正确口径已经破 ≤40 上限**。下面每组 D 项都记一笔，不重复解释。

## 组 40 · deduce / infer —— 推断 ｜ 段 [1,23] ｜ 句 482 / 483

- **A 原文表：OK**。6 行（479–484）逐字全等，段 23 整段列全。paraZh「坚持理解互助解惑迎接春天。」命中。
- **B 句号与共现：OK**。**切片 `sents` [482,483] 与词序相反**：482 = `[[infer:infer]]`、483 = `[[deduce:deduce]]`，草稿写成"482（infer）/ 483（deduce）"✓ 与数据一致。两词全书各仅 1 次。
- **C 可 grep：OK**。正面证据 10 条命中（`deduce answers`、`deduce answers from hints`、`He can deduce the answer from the clues.`、`from the clues`、`funny food analogy`、`safely infer`、`infer better study paths`、`He inferred that she was tired from her yawns.`、`from her yawns`、`quickly diagnose weak points`）。`quickly diagnose weak points` **确为 diagnose 卡词伙** ✓（草稿说"同时也是 diagnose 卡的词伙"，属实）。草稿的否定断言「deduce 在两份数据里找不到 `that` 从句这个句型」我单独查过 ✓ 真：数据里有 `inferred that`、无 `deduce that`。"常见讲法 deduce 演绎 / infer 归纳 没有支撑、不写"——核实：deduce `m`=「v. 推断；演绎；推论」确实带「演绎」二字，草稿说的是"没有**书证**支撑这个对立"，措辞与数据不冲突 ✓。
- **D 宽度：BLOCK ×2**。默认行 标称 38.0 / **实测 40.5 → 破 ≤40 上限**（虚报 2.5，>1.0）；总结句 标称 24.0 / **实测 25.5**（虚报 1.5，>1.0）。两处都是"作者要么算错要么虚报"那一档。默认行还不至于要重做——把「（from her yawns）」的括号内容缩成「（yawns）」或删「答案」二字即回到 40 以内。
- **E 义项照抄：低危，放行**。表头「都叫"推断"，可证据从哪来、推出的是啥，不是一回事」含两卡 `m` 原词「推断」，且用的是"都叫 X"这种宣称同指的措辞（与组 30/32 同形）——**但本段确实撞**：482 `sentZh`「再据此**推出**一条更合适的学习路线」、483 `sentZh`「从提示**推断**答案」，两句中文都在"推断"这一层。按 AUDIT_BRIEF 口味基线（"写进去**而该段实际不撞** = BLOCK"），此组不构成 BLOCK。core（从提示推出答案 / 从迹象推出判断）未照抄 `m` 词。
- **F 同源与厚度诚实：MISMATCH**。line 70「两张卡都有词伙、都有 ex，**独立文本共 6 条**」——`deduce answers`＝课文 483、`safely infer`＝课文 482 都是同一处文本（草稿在出处清单里自己也标了"原句即课文 482/483"），合并后实为 **4 条独立文本**，虚报 1.5 倍。未据此宣称"两处书证方向一致"→ 只算 MISMATCH。
- **判定：需作者改**（只改数字：默认行减字、总结句宽度重标、独立文本 6→4）。

## 组 41 · inquire / query —— 询问 ｜ 段 [1,25] ｜ 句 493 / 494

- **A 原文表：OK**。6 行（491–496）逐字全等，段 25 整段列全。paraZh「自信解开心结社团招新忙。」命中。
- **B 句号与共现：OK**。493 inquire、494 query，相邻两句、各全书唯一 1 次。
- **C 可 grep：OK**。正面证据 10 条命中（`politely inquire about joining steps`、`politely inquire`、`inquire about the bus schedule`、`He made a query about the bus schedule.`、`made a query about the bus schedule`、`one short query`、`left one short query`、`short query`、`filled in a simple questionnaire carefully`、`simple questionnaire`、`observe seniors`、`paused to observe seniors`）。卡结构核实：**inquire 卡 `note` 确实是空串（零词伙段）**✓（草稿主动明说，未硬凑）；query `note` 词伙确为 `short query` ✓ 且 = 课文 494 ✓；questionnaire 卡词伙确为 `simple questionnaire` ✓；observe 卡词伙确为 `observe seniors` ✓；query `m`=「n. 疑问；v. 询问；怀疑」**动词一档确实存在**，草稿说"本书无书证"✓（query 仅 494 一处、名词位）。否定断言「`query the results` 这类本书零次出现」✓ 真。
- **D 宽度：BLOCK（虚报）**。默认行 标称 35.0 / **实测 37.5**（虚报 2.5，>1.0；未破 40 上限）；总结句 标称 19.5 / 实测 20.0（虚报 0.5，MISMATCH）。
- **E 义项照抄：低危，放行**。表头「两个"询问"，一个是动作，是一件东西」含两卡 `m` 原词「询问」，§6 句式。默认行、core（开口向人打听 / 留下纸上的问题）、总结句干净。
- **F 同源与厚度诚实：OK**。本组是本切片唯一"条数没虚报"的：说"最硬的一条是两卡 ex 撞成最小对（同一件 the bus schedule）"——两条卡 ex **确实是两条独立文本**（inquire 卡 / query 卡各一句），我逐字对过，成立；`short query` 与 494 同源也点了名。
- **判定：需作者改**（只需按正确口径重标两处宽度）。
- 附：这一组两卡 ex 的最小对（`He wants to inquire about the bus schedule.` / `He made a query about the bus schedule.`）是 15 组里质量最高的一个抓手，落地时建议保留在默认行的括号里。

## 组 42 · ethical / moral —— 道德 ｜ `all_synonyms: true` ｜ 段 [1,27] ｜ 句 507（同句共现）

- **A 原文表：BLOCK（本审核唯一一处原文抄错）**。**L144、全局句 503**：
  - 草稿写成：`On Monday morning Lily told us about early civilisation and the **renaissance** in the big hall.`
  - 数据原文：`… and the **Renaissance** in the big hall.`（标记为 `[[renaissance:Renaissance]]`，词头小写、**表面形式首字母大写**）
  按 AUDIT_BRIEF A「大小写算不符 → BLOCK」。成因清楚：作者照抄了词头而不是表面形式。中文列「周一早上，莉莉在大礼堂给我们讲了古代文明和文艺复兴。」与 `sentZh` 逐字一致 ✓。其余 5 行（504–508）逐字全等。
- **B 句号与共现：OK**。507 同句含 `[[ethical:ethical]]` + `[[moral:moral]]`，切片 `sents` 就是 `[507]`（同句共现，草稿未误写成相邻两句）✓；两词全书各仅 1 次。
- **C 可 grep：OK**。正面证据 11 条命中（`each ethical choice`、`a clear moral heart`、`uphold ethical principles`、`follows ethical practices in hiring`、`The company follows ethical practices in hiring.`、`moral duty`、`It is a moral duty to tell the truth.`、`moral responsibility`、`moral support`、`teach moral values`、`Our family ethic is short enough to say in one sentence`）。卡结构核实：uphold 卡 `note` 词伙栏**确含** `uphold ethical principles` ✓（草稿说"uphold 卡词伙栏同款"，属实）；ethical/moral 两卡同义词栏**确实互指** ✓（切片 `all_synonyms: true` 有卡上依据）；`Our family ethic…` 确为**课文 1107**，逐字是该句前缀 ✓。
  小疵：出处清单把 1107 那句引到 `one sentence` 就截了，原文后面还有 `: work hard and be kind`，且草稿没加省略号——它是被当"边界说明"引用、不是当搭配用，风险低，但落地前补个省略号。
- **D 宽度：BLOCK ×2**。默认行 标称 39.0 / **实测 41.5 → 破 ≤40 上限**（虚报 2.5）；总结句 标称 19.5 / 实测 20.0（虚报 0.5）。
- **E 义项照抄：低危，放行**。表头「把两个"道德"装进同一句——各修一样东西」含两卡 `m` 原词「道德（的）」，§6 句式（紧跟"各修一样东西"）；core（讲规矩那条线 / 心里认的善恶）、默认行、总结句干净。
- **F 同源与厚度诚实：MISMATCH（语义越界 1 条）**。
  1. 条数**没**虚报：ethical 卡词伙 `uphold ethical principles`、moral 卡 3 条词伙、两卡 ex 我逐条回课文反查，**全都不在课文里** → 都是真独立文本，"两卡词伙方向一致"这个判断有 2 条以上真证据撑着 ✓。
  2. **但** diff 表「同义词框架」行写「阅读里碰到任一都译"**道德的**"，别当新信息」——本书 507 自己的 `sentZh` 是「每一个**道德上的**选择，都需要一颗清清楚楚的**向善的**心」：ethical 译道德上的、moral 译"向善的心"。**这句断言被同组表格里的第 148 行直接推翻**，属"把两词恰好同义升级成读者一定会遇到的翻译事实"。改成"中文都可能落到『道德』这一族，但本书 507 把 moral 译成了『向善的』"即可。
  3. 「本书未给 ethical 指行业规范、moral 指个人品德这种学者级区分，表里不写」——核实 ✓ 真：两张卡 `note` 都无语域标注。这条克制是对的。
- **判定：需作者改**。最小清单：① 503 行 `renaissance` → `Renaissance`（照表面形式抄）；② 默认行按正确口径重标并减到 ≤40；③ "都译道德的"那半句改成与 507 译文不冲突的说法。

## 组 43 · alien / foreigner —— 外国人（名不副实）｜ 段 [1,28] ｜ 句 510 / 511

- **A 原文表：OK**。6 行（509–514）逐字全等，段 28 整段列全。paraZh「小镇居民热情，匠心守护遗产。」命中。
- **B 句号与共现：OK**。**切片 `sents` [510,511] 与词序相反**：510 = `[[foreigner:foreigner]]`、511 = `[[alien:alien]]`（同句另有 `[[anthropologist:anthropologist]]`）。草稿按 510 foreigner / 511 alien 写 ✓。两词全书各仅 1 次。
- **C 可 grep：OK**。正面证据 9 条命中（`every foreigner at the long table`、`The foreigner asked for directions to the train station.`、`asked for directions`、`No one felt alien`、`felt alien`、`a wise anthropologist welcomed all with tea`、`wise anthropologist`、`The boy saw an alien in the forest.`、`saw an alien`、`exotic fruit`、`An exotic fruit cake`）。卡结构核实：**alien 与 foreigner 两卡 `note` 确实都是空串（零词伙段）**✓——草稿"两张卡的 note 都是空的，全部搭配来自 ex 与课文"完全属实，这一格报备很诚实；alien `m`「adj. 陌生的；n. 外星人；外国人」三档 ✓；exotic 卡词伙确为 `exotic fruit` ✓。
  另：草稿说"要改挂『陌生的 vs 外国的』档得拉 exotic/foreign 进来，**两词都不在本组成员里**"✓（切片成员就是 alien/foreigner）。
- **D 宽度：BLOCK ×2**。默认行 标称 39.5 / **实测 42.0 → 破 ≤40 上限，且是 15 组里最超的一条**（虚报 2.5）；总结句 标称 22.0 / 实测 22.5（虚报 0.5）。
- **E 义项照抄：OK，且是正面示范**。标称共享义项「外国人」名不副实——**核实成立**：511 的 alien 挂在系动词 `felt` 后当形容词、`sentZh`「没有人觉得自己是**外人**」；本书 alien 作名词的**唯一一处确实是 alien 卡 ex 的"外星人"**（`The boy saw an alien in the forest.` / 「男孩在森林里看到了一个外星人。」）✓。表头「"外"在那句是一个人，在这句是一种感觉」**没有**宣称本段两词同指"外国人"，core（外地来的客人 / 觉得自己是外人）、默认行均不含 `m` 原词「外国人」；并且在「要你拍板②」里补了"BRIEF §6 要求的那句" —— 「alien 卡 `m` 给了『n. 外国人』却零书证，落地时这格义项建议注明"本书未这样用过"」。**这就是 BRIEF §6 的完整标准处置，15 组里做得最好的一组，不该退回。**
- **F 同源与厚度诚实：OK**。「独立文本共 4 条」= 课文 510、511 + 两卡 ex，**逐条核过，没有同源重复计数**（两卡连词伙段都没有，无从同源）；"只撑得起词性 + 指什么，撑不了更多"的自评与证据量相称。
- **判定：需作者改（只改宽度）**。默认行 42.0 要压到 ≤40（例：`foreigner = 当面那位外宾（asked for directions），alien = 心里那点见外（felt alien）` → 去掉一个括号内容即可）。内容、义项处置、厚度报备三样都不用动。

## 组 44 · holy / sacred —— 神圣 ｜ `all_synonyms: true` ｜ 段 [1,29] ｜ 句 518 / 519

- **A 原文表：OK**。6 行（515–520）逐字全等，段 29 整段列全。paraZh「周二展厅仪式与礼仪之美。」命中。
- **B 句号与共现：OK**。**切片 `sents` [518,519] 与词序相反**：518 = `[[sacred:sacred]]`（同句另有 `[[etiquette:etiquette]]`）、519 = `[[holy:holy]]`（同句另有 `[[hallowed:hallowed]]`）。草稿按 518 sacred / 519 holy 写 ✓，并正确指出 519 同句的 hallowed 是另一张卡、不算成员（核实：hallowed 有卡，`m`「adj. 神圣化的；受崇敬的」，词伙 `hallowed wall` 与课文 519 同一处 ✓）。两词全书各仅 1 次。
- **C 可 grep：OK**。正面证据 10 条命中（`sacred room`、`each sacred room`、`keeps each sacred room calm and bright`、`The temple is a sacred place for believers.`、`a sacred place for believers`、`The church is a holy place.`、`a holy place`、`holy chime`、`hallowed wall`）。卡结构核实：sacred `note` = 「同义词：religious, holy, divine；词伙：sacred room」✓ 逐字对；**holy 卡 `note` 确实只有「同义词：sacred」、没有词伙段**✓（草稿明说了"holy 的搭配全部来自 ex 与课文"，诚实）；holy `m`「adj. 神圣的；圣洁的」✓。切片 `all_synonyms: true` 有卡上依据（两卡同义词栏互指）✓。
- **D 宽度：BLOCK（虚报）**。默认行 标称 33.0 / **实测 35.5**（虚报 2.5，>1.0；未破 40）；总结句 标称 23.0 / **实测 24.0**（虚报 1.0，按 D 的 ">1.0 算 BLOCK" 判为 MISMATCH）。
- **E 义项照抄：低危，放行**。表头「礼仪让每间**神圣的**房间保持安静（518），**神圣的**钟声又让人心里平静」含两卡 `m` 原词「神圣的」——但这是对 518/519 `sentZh` 的如实转述（两句译文本身都带"神圣"），不是把义项当区别；core（行礼的那间房 / 教堂那口钟）、默认行干净。
- **F 同源与厚度诚实：MISMATCH（语义越界 1 条）**。条数诚实：「两卡 ex 是一对近似最小对（church is a **holy place** / temple is a **sacred place**），『说地方可互换』这一条是它们撑起来的」——**核实为两条真独立文本**，结论站得住 ✓；"holy 卡同义词栏只有 sacred 一个，它的同义网比 sacred 窄得多"✓ 属实（sacred 栏 3 个词、holy 栏 1 个）。
  **但**总结句「说地方时互换，说房间**只有** sacred，说钟声**只有** holy」把"本书各给了 1 处"写成了排他性规则——本书 sacred 仅 518 一处、holy 仅 519 一处，推不出"只有"。这正是 BRIEF §7 禁止的"把本书就这么写升级成语法禁令"。改成"本书给的是 sacred room、holy chime"即可（同时 24.0 也要重标）。
  另：文件末尾主动报备"两词差异本来就小，提请落地时别再为对齐硬加维度（比如『口语里 holy 更宗教、sacred 更庄严』——数据里没有，没写）"——核实：两卡 `note` 确无语域标注 ✓，这条克制是对的。
- **判定：需作者改**。① 两处宽度重标（默认行 33.0→35.5、总结句 23.0→24.0）；② 总结句的两个"只有"降级为本书书证级表述。

---

## 汇总

| 组 | 成员 | A | B | C | D | E | F | 判定 |
|---|---|---|---|---|---|---|---|---|
| 30 | diary / journal | ✓ | ✓ | ✓ | ✓ | **BLOCK** | ✓ | 需作者改（标题 + 撤掉"第三档日记"误判） |
| 31 | minus / subtract | ✓ | ✓ | ✓ | ✓ | ✓ | MISMATCH | 可落地 |
| 32 | rate / ratio | ✓ | ✓ | ✓ | ✓ | **BLOCK** | ✓ | 需作者改（仅标题半句） |
| 33 | elementary / rudimentary | ✓ | ✓ | ✓ | ✓ | ✓ | MISMATCH | 可落地 |
| 34 | dissertation / thesis | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 可落地（数据侧待拍板见下） |
| 35 | cite / reference | ✓ | ✓ | ✓ | ✓ | 低危 | MISMATCH | 可落地 |
| 36 | cite / quote | ✓ | ✓ | ✓ | ✓ | 低危 | MISMATCH | 可落地 |
| 37 | abstract / summary | ✓ | ✓ | ✓ | ✓ | ✓ | MISMATCH | 可落地（默认行 40.0 零余量） |
| 38 | detect / perceive | ✓ | ✓ | ✓ | ✓ | **BLOCK** | MISMATCH | 需作者改（默认行「测出」） |
| 39 | postulate / presume | ✓ | ✓ | ✓ | ✓ | 低危 | MISMATCH ×2 | 可落地 |
| 40 | deduce / infer | ✓ | ✓ | ✓ | **BLOCK** | 低危 | MISMATCH | 需作者改（宽度） |
| 41 | inquire / query | ✓ | ✓ | ✓ | **BLOCK** | 低危 | ✓ | 需作者改（宽度） |
| 42 | ethical / moral | **BLOCK** | ✓ | ✓ | **BLOCK** | 低危 | MISMATCH | 需作者改（大小写 + 宽度 + 语义） |
| 43 | alien / foreigner | ✓ | ✓ | ✓ | **BLOCK** | ✓ | ✓ | 需作者改（宽度）；义项处置为正面示范 |
| 44 | holy / sacred | ✓ | ✓ | ✓ | **BLOCK** | 低危 | MISMATCH | 需作者改（宽度 + "只有"过强） |

**BLOCK 组 8**（30、32、38、40、41、42、43、44）／ **通过组 7**（31、33、34、35、36、37、39，其中 6 组带同源计数 MISMATCH）／ **MISMATCH 条目 16**：F 同源计数虚高 8（组 31、33、35、36、37、38、39、40）、D 总结句宽度虚报 4（组 41、42、43、44，差 0.5–1.0 未触发 BLOCK）、语义/引用表述越界 3（组 42 两处、组 44 一处）、边界索引句误报 1（组 39）。

A–F 六项里，**A（86 行原文表逐字比对，仅 1 处大小写不符）、B（30 个成员的全局句号与词头标签全对）、C（正面证据 0 条查无、否定行 0 条造假）** 三项在 15 组上的通过率是硬的高；真实缺陷集中在 **D（2_07 口径用错，导致 3 条超上限 + 10 条虚报）** 和 **E（2 组表头宣称同指 + 1 组默认行照抄义项）** 两项。

## 需要人拍板的（≤3 条）

1. **宽度口径**：以「汉字 + 中文标点各记 1」（= 批次 1A 实测口径，我推荐）还是「只有汉字记 1」（= 2_07 用的）为准？前者下 2_07 有 3 条默认行破 40（组 40 / 42 / 43），后者下 2_05 + 2_06 的 10 条会集体反转成"虚报 2.5"。这条不定，15 组里 10 组的 D 结论都是摇摆的。
2. **`thesis` 卡要不要补「论点」一档**：卡 `m` 只印「学位论文」，卡 `ex`/`exZh` 却按「论点」译（`His thesis is that exercise improves memory.` / 他的论点是…）——**卡内自相矛盾，我已核实为真**，且组 34 的"第二身份"两格全靠它。补档只动 `vocab.json` 一处；不补则该维度落地时要降级。（附带一条：`journal` 的"本书用了第三档日记"是**草稿读错了**，本书用的是第二档「日志」，改草稿即可，不必改卡。）
3. **表头能不能出现共享义项名**：2_05 的组 30/32 写「同一个"日记"/"比率"」（该段实际不撞，判 BLOCK），2_06/2_07 的组 35/36/39/41/44 写「两个"X"…各领一样」（§6 规定的句式，我按口味基线放行）。若你要的是字面口径"义项词一律不得进表头"，则后者 5 组也要一起返工——两种读法工作量差 6 组，先定哪条。

