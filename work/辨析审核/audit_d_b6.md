# 门禁 2 审核 · 批次 6 切片 43–45（`6_07` / `6_08` / `6_09`，worklist_idx 208–219）

组数 12 / BLOCK 0 / MISMATCH 3 / 通过 9
（另有 1 处文件级发现：`cmpIndex` 同段多表的真实排序与注释不符，见文末，未计入组判定）

**自算底账（全部我亲手跑，不采信草稿自报）**：
- 数据只读 `shadow/data/sections.json`、`shadow/data/vocab.json`。重建 1833 句索引：六章实数 339/312/232/394/215/341，与偏移 `[0,339,651,883,1277,1492]` 逐个对得上；`gi=章偏移+段前句数和+段内序号` 断言全表通过。
- 章/段/句号、段内序号：12 组共 28 个成员句回算，全部与草稿所写一致（含 6_07 段18=1384–1389、6_09 组2 段1=1498–1503、组1 段47=1162–1167）。
- 39 个成员词的"带标记/未打标记"两套集合逐词重扫（词形=原形+s/es/ed/ing，词边界匹配）：**无一列错位**——含 count 未标 11 处（253/285/643/778/856/905/909/1118/1183/1189/1632）、turn 未标 19 处、ease 未标 3 处（752/1757/1764），句序号逐个对得上。
- A：三份「该段原文」表（含 6_08 组3 的 752/1757/1764 附表）**68 行**逐字符比（去 `[[词头:表面]]`、去 `**`），英文＋`sentZh` **0 不符**；粗体扫描确认每行只粗本组成员词（§五.16 干净，比批次 5 好）。
- C：三份反引号英文串去重 227/274/154 条，我自建语料（课文表面形式＋全卡 `ex/exZh/note/m`）逐条回扫；再跑 `tools/check_compare_draft.py` 三份均 **PASSED**，声称属实。查无的 45/76/42 条全部是文件路径/字段名/组 slug/「不写的」反例/带中文占位的骨架行（`turned … into`、`with X` 这类），无一被当正面证据用；反向 grep 的存在性断言 40+ 条逐条为真（清单见各组 C 行）。
- D：`tools/width_rule.width` 复量 12 条默认行＋12 条总结句：**24 个标称值全部=实测**，无一超线；贴顶的 4 条 39.5（6_07-1、6_08-1、6_08-5、6_09-1）逐条确认 ≤40。core 37 格实测最长 11 字（≤12；6_07 自报"15 格最大 10"复核属实）。三份附录的宽度复述清单与各组小标题**逐个相等**（含 6_08"17 张表"、6_09"四成员名吃 14.5/12.0"这种小账都对）。
- E：按卡 `m` 切档（含全部 ≥2 字子串）对 `core`/默认行/表头/总结句做包含检测：除下表标注外零命中。**amplify 专项**：「放大」只出现在表头（引用＋当场说破，§五.11 形状）与 diff「中文落点」行对本书译文的带引号直引；core/默认行/总结句连同义复述（变大/扩大）都没有 → 不 BLOCK。
- F：全部 markdown 表逐张数列：**12 组 items/diff/原文表每行列数=表头**，含两个四成员组的 16 行 diff 与 4 行 items，无一格错位。同源合并、证据强度、数据边界的诚实性逐组核，问题见各组 F 行。
- 撞车专项：全库 181 张 `cmp` / 178 张 distinct group 重数；**12 个新组 slug（成员序连字符式，`land_compare.py:361` 同款）与线上 178 张全部无同名 → "静默覆盖"这一最危险类确认为 0**。五张旧表载体逐张回 `vocab.json` 核实：compute→`compute-estimate` at[4,20]、amplify→`amplify-augment` at[5,14]、alleviate→`alleviate-relieve` at[5,35]、postulate→`postulate-presume` at[1,22]、decrease→`decrease-reduce` at[3,47] —— 与五份报备逐字相符；按落地器挑载体规则（组内第一个空成员）本批自动换载体为 calculate / enlarge / ease / hypothesis / diminish，与草稿"建议换 XX 或 YY"的方向一致。

---

## 组 208 · expose / reveal / uncover（`6_07` 组1，章4 段18）

A 原文表：6 行（1384–1389）英中逐字符相符，0 不符。
B 句号与共现：段18=1384–1389 ✓；1388=第 4 句、1389=第 5 句 ✓；三词各标记 1 处（1388/1389/1389）＋未标 0 处 ✓；disclose 标记全书恰 1 处（1388）✓；段末无已落地表（at=[4,18] 者 0 张）✓。
C 可 grep：45 条查无全是路径/字段名/「不写的」反例；正面串全命中。「揭露」在 sections.json 全文（含 paraZh/title）0 处 ✓；1432 译「暴露」英文确是 showed ✓ 且「暴露」全书译文恰 2 处（1389/1432，"另有一处"属实）；1541 译「显露偏见」英文是 shows ✓；display/divulge 无卡 ✓、disclose 有卡（词伙 `disclose plans`＝1388 同源、栏列 expose/reveal/divulge）✓；reveal/uncover 两栏字面同（disclose, display, expose）✓。
D 宽度：默认行 39.5/39.5 ✓（贴顶确认 ≤40）；总结句 26.0/26.0 ✓。
E 义项照抄：core/默认行/总结句不含「揭露/暴露/揭开」；表头引用「揭露」＋当场给三个真实落点（揭晓/发现/暴露）→ §五.11 放行形状。
F 同源诚实：uncover 词伙与 1389 同源合并 ✓；expose 5 条／reveal 3 条／uncover 2 条与我重数一致 ✓；"1389 一句两格各算一侧" ✓；「不写成禁令」的分寸已声明。
判定：**可落地（通过）**。

## 组 209 · calculate / compute / count（`6_07` 组2，章4 段20）

A 原文表：6 行（1396–1401）0 不符。
B 句号与共现：段20=1396–1401 ✓；1398=第 2 句、1399=第 3 句 ✓；calculate/compute 各 1／0；count 标记 2（1089、1399）＋未标 11，**11 个句序号与草稿逐个相同**、共 13 句 ✓。段末已挂四张表（instrument-tool／compute-estimate／estimate-evaluate／assess-gauge，at=[4,20]）✓ 与"口径 9 报备"相符。
C 可 grep：`sentZh`「计算」全书仅 1398 ✓、「估算」仅跟着 1399 的 estimate ✓；8 处 count 宾语前挂 each/every（285/643/778/856/1089/1118/1189/1632）逐句命中 ✓；count 卡 `note` 整栏空 ✓；compute 词形在两卡之外 0 处引用 ✓（口径提醒：若按子串 grep 会撞上 12 卡里的 `computer`，草稿是按词形扫的，成立）；calculate 被 measure/estimate/assess 三栏点名 ✓；cashier.ex `counted the money` ✓；count as / counted as 全书 0 ✓。
D 宽度：38.5/38.5 ✓；23.5/23.5 ✓。
E 义项照抄：core/默认行不含「计算/估算/计数/看作」；表头把"算"这个字让位给"能不能一件件对上号" ✓。
F 同源诚实：`calculate drops`／`compute costs` 与 1398 同源已并 ✓；count 侧 15 条（13+1+1）与我重数一致 ✓；§五.14 三件齐（两卡 ex 只差词头、exZh 两样、各算一侧）✓；"分不开"那格明写缺证、没编语域 ✓；compute 载体报备属实（slug `calculate-compute-count` 无冲突，落地器会自动落 calculate）。
判定：**可落地（通过）**。

## 组 210 · convert / transform / turn（`6_07` 组3，章4 段25）

A 原文表：6 行（1426–1431）0 不符。
B 句号与共现：段25=1426–1431 ✓；1426=第 0 句、1428=第 2 句 ✓；transform/convert 各 1／0；**turn 标记 1（1428）＋未标 19，19 个句序号与草稿的 5+3+11 三份清单并集逐个相同、无多漏** ✓。
C 可 grep：「转变」「转换」「变换」sections 全文 0 处 ✓；五处"换样+into"（892/1074/1743/1808/1813）与三处"turned … to"（428/1379/1024）整句都在所标句号上 ✓；knob/blade/bend 三卡 ex 各借 turn 1 处 ✓；convert/transform 词形在两卡之外 0 处 ✓；transform 词伙 `transform skylines` 课文 0 ✓；24 `took turns sleeping` 未标、名词档 ✓。
D 宽度：38.0/38.0 ✓；26.5/26.5 ✓。
E 义项照抄：core/默认行不含「转变/转换/转动」；表头引「转变」＋说破"turn 这处走的是拧阀门" ✓。
F 同源诚实：transform 3／convert 2／turn 24 条与重数一致 ✓；"transform 比 convert 改动更大只在卡上两句成立"的收缩写得诚实 ✓。
nit（不改判）：草稿三处把 892 族的形状统称「turned … into」，其中 1743/1813 实为 `turning … into` —— 逐句引用清单都对，只有概括形状欠准，建议改"turn(ed/ing) … into"。
判定：**可落地（通过）**。

## 组 211 · desire / itch / yearn（`6_07` 组4，章5 段11）

A 原文表：6 行（1558–1563）0 不符。
B 句号与共现：段11=1558–1563 ✓；1560/1561/1562=第 2/3/4 句 ✓；三词各标记 1＋未标 0 ✓；1716 那处 heads 里有 `desirable` 词头（另词）、英文确是 grew keen ✓。
C 可 grep：`sentZh`「渴望」全书恰 6 处（1324/1560/1561/1562/1716/1736）✓ 另三处英文 will/keen/eager 逐句核 ✓；三词在别的卡栏 0 引用 ✓（desire/itch/yearn 只在自己卡）；itch 卡 ex `caused an itchy on my arm` 原样引、未改写 ✓；itchy 全书 0 ✓；desire 动词档、yearn 名词、count 之类空档断言逐条为真。
D 宽度：37.5/37.5 ✓；22.0/22.0 ✓。
E 义项照抄：core/默认行不含「渴望/欲望/痒」；表头用"敌是动力"新轴 ✓。
F 同源诚实：`control wild desire`／`inner itch` 两条词伙同源已并 ✓；三侧各 2 条 ✓；"本切片唯一三侧齐薄（各 2 条）"与组 5 的 3/3/3 不矛盾，成立。
判定：**可落地（通过）**。

## 组 212 · cope / dispose / tackle（`6_07` 组5，章5 段12）

A 原文表：6 行（1564–1569）0 不符。
B 句号与共现：段12=1564–1569 ✓；1567=第 3 句、1568=第 4 句 ✓；三词各 1／0 ✓。
C 可 grep：cope 被 mount 词伙同串借用 ✓；dispose/tackle 词形在两卡之外 0 处 ✓（子串级会撞 nature.note 的 `disposition`、income.note 的 `disposable` —— 都是别的词，草稿按词形扫的口径成立）；address/confront/deal with 无卡、handle 有卡 ✓；「处理」sentZh 恰 2 处都在本段（1567/1568）✓、「应对」1 处 1568＋paraZh(0,33) 一处 ✓；「应付」「处置」0 ✓。
D 宽度：36.5/36.5 ✓；21.0/21.0 ✓。
E 义项照抄：core/默认行不含「应付/处理/处置」✓。
F 同源诚实：`cope with stress` 三处同串并 1 ✓；三侧各 3 条 ✓；"9 条文本无例外"我逐条数过属实（with/of/零介词各 3）。
判定：**可落地（通过）**。

---

## 组 213 · amplify / enlarge / magnify（`6_08` 组1，章5 段14）

A 原文表：5 行（1576–1580）0 不符；表头自报"成员三句+后两句"、1581 只在出处清单整句引（逐字符对）——口径一致，不算缺行。
B 句号与共现：段14=1576–1581 ✓；三成员第 0/1/2 句各一句 ✓；三词各标记 1＋未标 0 ✓；段末唯一已落地表＝`amplify-augment`（at=[5,14]，载体 amplify）✓ 报备属实。
C 可 grep：「放大」sentZh 恰 3 句=本组三句 ✓（paraZh 那处「放大进步」草稿另列、没混进译文数）；「增强」译文仅 1340=reinforce ✓、「夸大」仅 1578 ✓；1686 `share less suffering…` ✓；1167 expand 标记 1 处 ✓；`amplify the voice`/`enlarge the photo`/`magnify one's problems`/三名词形 均 0 ✓（都在「不写的」里）；enlarge↔expand 互列 ✓；magnify 词伙与 1577 同源 ✓。
D 宽度：39.5/39.5 ✓（贴顶确认）；24.0/24.0 ✓。
E 义项照抄：「放大」仅在表头作靶（引用＋说破"最不管用的一条线"）；core/默认行/总结句 0 命中、无同义复述 → 专项点名的 BLOCK 线**未踩**。
F 同源诚实：三侧 3/2/2 条与重数一致 ✓；默认行"显微镜下的细节"拼景已如实自报 ✓。**不符一处：默认行的 amplify 侧钩子 `amplify = 话筒（soft voices）` 与同段末已落地旧表的「简单记」那截逐字相同，diff 首行"宾语全是声音类的东西，一个例外都没有"又把旧表"amplify 领声音"的结论原样重讲——而「数据边界」自报"本组内容不引用那张表的结论"。学生会在段14末连着看到同一句钩子两遍。这是 §五.9"各写各的切入角、不重复"被破＋自报不实。**
判定：**需作者改（MISMATCH）**。最小清单：把默认行 amplify 侧换成不与旧表重叠的钩子（例如 `amplify = 机器送声（amplify the sound）`，用卡 ex 侧、宽度需复量），并把"不引用那张表的结论"改成"amplify 接声音这一条两表共享，本组从'谁动手/接哪样'重写"。

## 组 214 · fatal / lethal / mortal（`6_08` 组2，章5 段30）

A 原文表：5 行（1674–1678）0 不符（表头自报"成员两句+前后各两句"，1673 在出处清单整句引、逐字符对）。
B 句号与共现：段30=1673–1678 ✓；1676=第 3 句、1678=第 5 句 ✓；三词各 1／0 ✓；三卡 `cmp` 全空 ✓（"本组不撞车"属实）；`death-demise` at=[5,30] 载体 death ✓。
C 可 grep：「致命」sentZh 仅 1678 一句两处 ✓；「会死去的」仅 1676 ✓；poison 卡 ex `The snake's poison can kill quickly.` ✓；death/demise/doom 有卡 ✓；1680 smoky buses / 1686 suffering 两句在所标句号 ✓；`mortal wound` 等反例 0 ✓。
D 宽度：37.5/37.5 ✓；23.0/23.0 ✓。
E 义项照抄：core/默认行不含「致命/灾难性的/凡人」；「会死的那条命」是本书译文「会死去的」的引用改写，不算义项复述。
F 同源诚实：三词伙逐条同源已并、各侧 2 条 ✓；口径 6 对 mortal 的处理（"别升级成没这个意思"）写得标准 ✓。
nit（不改判）：说旧表"「搭配」栏引过 1676 整句"——实际引的是前半 `We never speak of death at home`，够撑结论，措辞收一下即可。
判定：**可落地（通过）**。

## 组 215 · alleviate / ease / relieve（`6_08` 组3，章5 段35）

A 原文表：主表 5 行（1703–1707）＋附表 3 行（752/1757/1764）共 8 行，0 不符。
B 句号与共现：段35=1703–1707（5 句）✓；1703=第 0 句、1704=第 1 句 ✓；ease 标记 1（1704）＋未标 3（752=章2 段16 第 1 句、1757=章5 段44、1764=章5 段45，章段序号逐条对）✓；alleviate/relieve 各 1／0 ✓；`alleviate-relieve` at=[5,35] 载体 alleviate ✓、ease/relieve 卡无 `cmp` ✓（换载体到 ease 可行，与落地器规则一致）。
C 可 grep：1702=章5 段34 末句 ✓；「缓解」2（1703/1704）、「减轻」2（1341/1703）、「抚平」3（1517/1759/1764）✓ 1517 smoothed／1759 softened 逐句对 ✓；全书课文 tension 恰 1 处 1327 ✓；`relieved/relieving/alleviating/alleviation/at ease/with ease/ease off` 0 ✓；两卡 ex 同形、exZh 一字未改 ✓（§五.14 三件齐）。
D 宽度：39.0/39.0 ✓；21.0/21.0 ✓。
E 义项照抄：core/默认行不含「缓解/减轻」；表头引「缓解」＋说破照不出差别 ✓。
F 同源诚实：**不符一处**：计数行写"三张卡的词伙里**只有 alleviate 那两条**本书课文没用过"——不成立：ease 唯一词伙 `ease tensions` 课文同样 0 处（草稿自己的出处清单都明写"本书课文没用过"，前后两处自相矛盾）。三成员卡共 3 条词伙（alleviate 2＋ease 1），全部课文 0 处才是事实。其余：leg agony 同源合并 ✓、ease 6/relieve 3/alleviate 4 条与重数一致 ✓、relieve 卡 note 空 ✓。
建议（不计入清单）：items 两处 core（暖浴按着的那处疼／几首歌松开的那件事）与旧表「简单记」的"泡走腿上的疼／唱走心里的事"语义同源——默认行已换"动手"新轴，段末不会重复；若求全，落地前把这两格 core 也往"施动者"轴靠。
判定：**需作者改（MISMATCH）**。最小清单：该计数行改为"三张卡的词伙（3 条）课文都没用过；relieve 卡连词伙段都没有"。

## 组 216 · doubt / sceptical / suspicion（`6_08` 组4，章5 段48）

A 原文表：4 行（1782–1785）0 不符。
B 句号与共现：段48=1780–1785 ✓；1784=第 4 句、1785=第 5 句 ✓；三词各 1／0 ✓；**段[5,48]段末无任何已落地表（at=[5,48] 者 0 张）、三卡无 `cmp`** ✓ "本切片五段唯一空的"属实。
C 可 grep：「怀疑」2 句（1784/1785）、「猜疑」1（1784）✓；`doubts/doubted/doubtful/suspicions/skeptical` 两份数据 0 ✓；skepticism 全库仅 doubt.note 1 处、无卡、课文 0 ✓；suspect 有卡、1249=章3 段60 用"嫌疑人"档 ✓；suspicious 无卡、只挂 odd 同义词栏 ✓；paraZh(5,48) 与本段六句对不上（草稿如实点破、不取用）✓ §五.12 处理标准。
D 宽度：37.5/37.5 ✓；20.0/20.0 ✓。
E 义项照抄：core/默认行不含「怀疑/猜疑/疑惑」；表头"谁在做事"新轴 ✓。
F 同源诚实：三词伙逐条同源已并、三侧各 2 条 ✓；"会散/会蒙眼只来自 1784 一句"的收缩 ✓；§五.14 不适用（三 ex 不同形，我逐句比过）。
判定：**可落地（通过）**。

## 组 217 · hypothesis / postulate / presume / suppose（`6_08` 组5，章1 段22，**四成员**）

A 原文表：4 行（473–476）0 不符；477/478 两句在"这一段在讲什么"里逐句回数据对上了（含 471 assume 句旁证逐字）。
B 句号与共现：段22=473–478 ✓；473=第 0 句、474=第 1 句 ✓；**四成员逐个核**：四词各标记 1＋未标 0 ✓；474 里 quiet 挂标记、非成员未粗 ✓；`postulate-presume` at=[1,22]（载体 postulate）＋`detect-perceive` at=[1,22] ✓ 报备两张齐全。
C 可 grep：presume/suppose/postulate/hypothesis 的名词形与过去式形状（presumed/supposed/postulated/hypotheses/presumption/supposition）0 ✓；assumption/premise 仅 hypothesis.note、无卡 ✓、theory 有卡 ✓；assume 卡三栏引用（同义词列 suppose/presume/take for granted、ex、471 标记 1 处、词伙 simply assume 同源）逐条 ✓；inductive 卡 ex 借 hypothesis 1 处 ✓；「假设」sentZh 仅 471（且那句成员是 assume）✓、「假说」「公设」各仅 474 ✓。
D 宽度：默认行 39.5/39.5 ✓（四词四钩子贴顶确认）；21.0/21.0 ✓。
E 义项照抄：默认行不含「假设/假定/猜想/认为」✓。
F 同源诚实：**四成员组专项：items 表 4 行 ×7 列、diff 4 维 ×4 行 =16 行 ×5 列，列数与表头逐行齐，无批次 5 式错位** ✓；词伙四条（never presume／quiet simple postulate／simple postulate／new hypothesis）逐条同源已并 ✓；"最强物证是 474 同尾＋473 同架，不是同形 ex"的 §五.14 判断准确 ✓；换载体（hypothesis 或 suppose，两卡 cmp 空）与落地器规则一致。
判定：**可落地（通过）**。

---

## 组 218 · decrease / diminish / dwindle / reduce（`6_09` 组1，章3 段47，**四成员**）

A 原文表：6 行（1162–1167，全段）0 不符。
B 句号与共现：段47=1162–1167 ✓；四成员各占第 0/1/2/3 句 ✓ 各标记 1＋未标 0 ✓；`decrease-reduce` **at=[3,47] 与本组同段核实属实**（载体 decrease 一张、全库该 slug 仅 1 份拷贝，"reduce 只是 items 第二个 w"对）；段末另有 increase-increment／growth-increase，"共三张、本组第四张" ✓；paraZh(3,47) 在坏主题栏区间（章3 段22–43）之外、且与本段句子相合 ✓（坏数组我重跑：章3 恰 22 段命中、章4/章5 各 0）。
C 可 grep：「减少」sentZh 恰 2 处=437（章1，译句"友情减少了心理摩擦"逐字对）＋1165 ✓；`dwindles` 仅 dwindle.ex、`reduces` 仅 emission.ex ✓；`reduced/decreased/diminished/dwindled/reduction` 0 ✓；reduce 被 4 卡 ex 借用（reuse/campaign/emission/illiteracy）＋7 卡词伙（burden/debt/aggressive/diversity/anxiety/operate/accident）逐个点名无误、debt 同串并 1 ✓；三卡同义词栏原文逐字 ✓、dwindle.note 空 ✓；两对互列＋worklist 100（decrease/reduce 两词组）true 在案 ✓ "false 被空卡拖下来"的推理成立。
D 宽度：默认行 39.5/39.5 ✓（"四个成员名吃 14.5"复算=4+4+3.5+3=14.5 ✓）；总结句 28.0/28.0 ✓。
E 义项照抄：core/默认行不含「减少/降低/削弱/减损/缩小/减量」✓。
F 同源诚实：四侧文本数与重数一致 ✓；四成员表列数全齐 ✓。**不符一处**：默认行 `reduce = 他动手` 与同段末已落地旧表「简单记」的 `reduce = 他动手（reduce waste）` **逐字相同**，`decrease = 那截数`≈旧表"落下去那截"，总结句"decrease 记那个数，reduce 记那双手"是旧表辨析句的同义复述；而草稿开篇明写"旧表那四格（含'句子里有没有人动手''中文给的是下滑还是减少'）已讲完，本组不复述、decrease/reduce 只以新角出现"。段47末四张表并排时，这两句钩子学生连看两遍——口径 9 被破＋自报不实。另 nit：「落在 decrease 卡上就成了'一段末两张表挤在同一张卡'」措辞不对——一个词头只带一张表，真落 decrease 是**顶掉旧表**（方向结论没错：换载体即可，落地器也会自动先挑 diminish）。
判定：**需作者改（MISMATCH）**。最小清单：默认行 decrease/reduce 两侧换到本组新轴（例：`decrease = 生意那截，diminish = 噪音变弱，dwindle = 硬币一天天少，reduce = 后屋的浪费`，宽度复量 ≤40），总结句同轴改写（别再用"那双手"），并把"只以新角出现"的自报改准。

## 组 219 · contemplate / gaze / peer / stare（`6_09` 组2，章5 段1，**四成员**）

A 原文表：6 行（1498–1503，全段）0 不符（1501 粗的是表面形 `contemplated/stared`，词头登记 contemplate/stare，与草稿自述一致）。
B 句号与共现：段1=1498–1503 ✓；1500=第 2 句、1501=第 3 句 ✓；四词各标记 1＋未标 0、且全 1833 句再无未标 ✓；`stares/gazing/peering/contemplation` 0 ✓；`peer at` 全库 0 ✓；「凝视」课文译文恰 1 处=1500 的 peer 半句 ✓；卡面「凝视」仅四张 m＋gaze/stare 两条 exZh ✓（与草稿报备范围一字不差）。
C 可 grep（**旧表 look-verbs 逐条核实，这是任务点名区**）：`look-verbs` 全库 3 份拷贝＝glance/glimpse/peep，带 `at` 的仅 peep 那份、`at=[5,1]` 与本组同段 ✓；四 item＝glance/glimpse/peep/peer（peer 是第 4 个）✓；summary **无「简单记：」**、items **无 eg**、diff 空 ✓；summary 全文 width=**69.0**（复量与草稿一致，超 40 一倍）✓；全库 181 张 cmp 里不带「简单记」的恰这 3 张、items 全无 eg 的也恰这 3 张 ✓；`compareLine` 源码确认回落逻辑：取不到「简单记」显示 title「这一段几个词都和“看”有关，但“看”法不同：」✓（草稿连回落后的那一行都引对了——只有引文把弯引号写成了直引号，nit）。
D 宽度：默认行 38.0/38.0 ✓；总结句 29.0/29.0 ✓。
E 义项照抄：core/默认行不含「凝视/注视/盯着看/考虑/同辈」✓。
F 同源诚实／旧表重叠判断：peer 卡面两条全在同辈档 ✓、pressure/negative/conform 跨卡同串并 1 ✓；**本组没有重讲旧表已给的 glance/glimpse/peep/peer 四词对照，也没重讲"同辈"**：peer 侧只给"挂 through"的新格＋卡面档位报备（明确写"旧表已交代过，本表不复述"），默认行"透过小雨看"与旧表"费力辨认"不重字 → 通过。四成员表列数全齐；contemplate/stare.note 空、gaze 词伙课文 0、卡 ex 与 1500"不是同一条文本"各算一侧——逐条与数据相符。
判定：**可落地（通过）**。

---

## 文件级

1. **`cmpIndex` 同段多表的真实排序 ≠ 代码注释**（`shadow/index.html:1724` 起）。三处事实：① 同 `group` 只认 `Object.keys(VOCAB)` 的第一份拷贝（`done` 去重）；② 排序键 `at` 是**段级常量**（该段第一个带标记句的段内序号），同段所有表拿到的键**一模一样**，"按撞上的句序号排"在同段内是空转；③ 平键走稳定排序 → 实际显示顺序 = **各表生效载体的 VOCAB 键序**。据此推演：段47末（本组 218 落 diminish/968）→ `decrease-reduce(965) → 本组新表(968) → increase-increment(970) → growth-increase(972)`；段[5,1]末（本组 219 落 contemplate/1642）→ `look-verbs(glimpse/1636 那份生效，它没有 at、走成员回落到 [5,1]——结果与 peep 那份带 at 相同，我已验证全库首个≥2 成员同段就是[5,1]) → 本组新表(1642) → oath-vow(1644)`。回答报备问句"若同段末叠两张表，显示按什么排"：**不是按句号，是按载体词头在 vocab.json 里的先后**。这影响 6_09 两组（以及 6_08 组1/3/5 的换载体选择要不要顺带调显示顺序），值得渲染侧或落地器文档记一笔。
2. 三份文件的宽度/句号/表数/载体自报与附录复述我逐条重跑：6_07 五条默认行 39.5/38.5/38.0/37.5/36.5、五条总结句、core 最大 10、sents 11/11、四张表在段20——全对；6_08 的 17 张表、11 个句号、两处「提请拍板 0」成立；6_09 的 6 个句号、14.5/12.0 成员名当量、坏主题栏 22/0/0——全对。**没有批次 5 那种"附录数字错"**。
3. nit 集合（均不改判）：6_07 组3 的「turned … into」概括形状（1743/1813 是 turning）；6_08 组2「引过 1676 整句」实为前半；6_09 组2 回落行的弯引号写成直引号；6_09 组1「两张表挤在同一张卡」措辞（应写"顶掉旧表"）。

## 汇总

| 组 | worklist_idx | A | B | C | D | E | F | 判定 |
|---|---|---|---|---|---|---|---|---|
| 6_07-1 | 208 | OK | OK | OK | OK | OK | OK | 通过 |
| 6_07-2 | 209 | OK | OK | OK | OK | OK | OK | 通过 |
| 6_07-3 | 210 | OK | OK | OK | OK | OK | OK | 通过（1 nit） |
| 6_07-4 | 211 | OK | OK | OK | OK | OK | OK | 通过 |
| 6_07-5 | 212 | OK | OK | OK | OK | OK | OK | 通过 |
| 6_08-1 | 213 | OK | OK | OK | OK | OK | 默认行与旧表逐字重复＋自报不实 | **MISMATCH** |
| 6_08-2 | 214 | OK | OK | OK | OK | OK | OK | 通过（1 nit） |
| 6_08-3 | 215 | OK | OK | OK | OK | OK | 「只有 alleviate 两条」计数行失实 | **MISMATCH** |
| 6_08-4 | 216 | OK | OK | OK | OK | OK | OK | 通过 |
| 6_08-5 | 217 | OK | OK | OK | OK | OK | OK | 通过 |
| 6_09-1 | 218 | OK | OK | OK | OK | OK | 默认行/总结句复述旧表＋自报不实 | **MISMATCH** |
| 6_09-2 | 219 | OK | OK | OK | OK | OK | OK | 通过（1 nit） |

**12 组：BLOCK 0 / MISMATCH 3 / 通过 9。** 最严重一条：**218（decrease/diminish/dwindle/reduce）**——本组与已落地的 `decrease-reduce` 挂同一段末，默认行的 `reduce = 他动手` 与旧表「简单记」逐字相同、总结句同义复述，而草稿明写"不复述旧表"；213（amplify 组）是同一族的逐字撞钩子。三处都只需改 2–4 行措辞，不动结构、不动数据。

必改最小清单：
1. `6_08.md` 组1 默认行 amplify 侧钩子换掉（与旧表「amplify = 话筒（soft voices）」不重字），并把「数据边界」里"本组内容不引用那张表的结论"改准。
2. `6_08.md` 组3 计数行"只有 alleviate 那两条课文没用过"改为"三张卡的词伙（3 条）课文都没用过"。
3. `6_09.md` 组1 默认行 decrease/reduce 两侧与总结句换到新轴（掉的是哪类东西／带不带过程），"旧表已讲完、本组不复述"的自报随之改准。

## 需要他拍的最多 3 条

1. **旧表撞车的处置口径（213/218 的根问题）**：撞车只在"钩子字面"，两表的成员集与切分线各自成立。改法 A＝作者改新表钩子（上面清单 1、3，代价最小）；改法 B＝承认"旧结论在四/三词表里必然重讲"，把旧表 `amplify-augment`、`decrease-reduce` 整体下线重写（代价＝两批审核凭据作废＋段末重排，不建议）。拍板影响要不要退回 6_08 组1、6_09 组1 重写还是只改字。
2. **`cmpIndex` 排序真相（文件级第 1 条）**：同段多表实际按载体 VOCAB 键序排，注释宣称的"按撞上的句序号排"同段内是空转。改法 A＝不动渲染侧，落地时把 218/219 的载体挑在想要的键位（diminish/contemplate 现成的位置就分别是"旧表后、increase 前"和"look-verbs 后"）；改法 B＝改 `index.html` 让 at 落到"该组第一个成员句"——一处小改，但会挪动全部存量同段表的顺序，需要再跑一轮页面测试。本批 12 组落不落地都该先拍这个口径。
3. **段[5,1]末三表并排（6_09 组2 报备）**：`look-verbs` 无「简单记」、summary 69.0 超宽、items 无 eg，全是旧表旧账；新表 38.0 合规。要么立一个"旧表清理"专项（给 look-verbs 补「简单记：」前缀即可回收段末显示，小改），要么接受现状——但 validate 第 16 条将来会持续对那 3 份拷贝报警。请定先后。

**边界自证**：本审核只读；唯一写盘是本文件。未改任何草稿/数据/代码；未跑 `tools/land_compare.py`（任何模式，只 `sed` 读了它与 `shadow/index.html` 的源码）；无 git 写操作（`git status` 仅读）。落盘前基线 mtime：`6_07.md` Sep 21 09:13:25、`6_08.md` Sep 21 09:18:12、`6_09.md` Sep 21 08:55:49、`shadow/data/vocab.json` Sep 21 03:25:15、`shadow/data/sections.json` Sep 19 22:12:02、`shadow/index.html` Sep 21 03:25:15 —— 若本文件写完后上述文件 mtime 未变，即证未越界。
