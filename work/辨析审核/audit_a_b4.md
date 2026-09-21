# 门禁 2 审核 · 批次 4 `4_01.md` + `4_02.md`（slice19 + slice20 / worklist_idx 94–103）

组数 10 / BLOCK 1 / MISMATCH 4 / 通过 5

审核手段（全部我亲手跑，未复用作者的数）：
- A：脚本把两份草稿**所有**首列为 3–4 位数字的表格行拉出来，与 `sections.json` 去标记后的原文 + 同位 `sentZh` 逐字符比对（20 行 + 22 行，含重复引用），并额外比对"草稿加粗的词"与"数据里真的挂了 `[[词头:表面]]` 的词"是否一致。
- B：按章偏移 `[0,339,651,883,1277,1492]` 自算全局句（0 基），核对每组成员是否真的以 `[[词头:…]]` 出现在声称的共现段。
- C：草稿里 431 条唯一反引号英文串 + 非 code span 的 126 条英文串（表格 / `eg` / `scene` / 维度列）逐条在 `sections.json`（表面形式）与 `vocab.json`（m/ex/exZh/note）里大小写不敏感查；查不到的 100 条逐条回上下文分类。
- D：`python3 -c "import sys;sys.path.insert(0,'tools');from width_rule import width;..."` 复量 10 条默认行 + 10 条总结句。
- 另核：§五.12 坏数组（我独立重跑 `paraZh[i]==paraZh[i-22]+' 灯下团聚，欢语不断。'`，章3 命中恰为段 22–43）、§五.13 两档计数（词边界正则全书扫，避开学 `said/maid/transparent` 的假阳性）、`cmp` 占位。

---

## 组 94 · announce / declare（`4_01.md` 组1）

A 原文表：**OK**。表 6 行（1111–1116）英文去标记后与数据逐字符一致，中文与同位 `sentZh` 逐字符一致；6 行加粗词与该行 `[[词头:…]]` 标记完全相同（declare/affirm/promise/plain/claim/guard/proclaim/state/announce/mist/sunrise），无多标无漏标。
B 句号与共现：**OK**。段 38 base=1111（章3 偏移 883 + 段 0–37 共 228 句），1111=段内第 0 句标 `[[declare:declared]]`、1116=段内第 5 句标 `[[announce:announce]]`，与切片 `sents [1111,1116]` 对齐；文中"本段 6 句共 12 处标记、11 个词头、guard 2 次"我逐句数过，对。
C 可 grep：**OK（含 3 处"本书没有"全部核实为真）**。announce 侧 8 条正面证据我逐条查到：1116、757（`Grandma announced…`，确认章2 段18 第 0 句、该句标记为 erection/stricture，announce 确未打标记）、announce 卡 ex、judge/herald/chancellor/reform/official 五张卡的 ex 全在；`announcement`/`declaration` 全书课文 0 处 ✓ 真；declare 标记 1 / 未标 0 ✓ 真（`declar*` 全书只 1 处）；announcer 卡 ex ✓ 真。"8 条里没一处 announce 后面直接跟人" ✓ 真。
D 宽度：默认行 标称 38.5 / 实测 **38.5**；总结句 标称 25.5 / 实测 **25.5**。均在 ≤40 / ≤30 内 ✓。
E 义项照抄：**OK**。core（"有人在那头等着听"/"说完，事就算成立了"）、默认行、维度列均无 `m` 里的义项词；表头引「宣布」是**引用 + 当场否定**（"课文那处印的是「念了两遍」，压根没出现宣布"）→ 落 §五.11 豁免。
F 同源与厚度诚实：**基本 OK，两处要改（本组判 MISMATCH 的原因）**。
 1. **口径 9 自相矛盾**：第 28 行白纸黑字承诺"那张（已落地的 declare/proclaim）表的『谁在说 / 宾语是哪样东西 / 句子怎么搭』三格不重讲"，但差异表第二格就叫**「谁在说（本组最反直觉的一格）」**、第四格**「中文各走哪一路」**与已落地卡的维度名一字不差。段 38 末实测确实已有 1 张表（`declare.cmp.group=declare-proclaim`，`at=[3,38]`），所以同段将挂 2 张、且两张都有"谁在说"格。内容本身不假（announce 侧的"奶奶也说得上"是新事实），坏在**承诺与成品不符**。
 2. **一处计数说过头**："本书 announce 侧 8 条文本每一处都说得出谁在听" —— 757 那句 `Grandma announced the plan …, ignoring every past stricture about money` 全句与译文都没有交代谁在听，它是 8 条里唯一撑不住"每一处"的一条。改成"8 条里 7 条写得出听的人（757 是奶奶对自家说的，靠常识补）"即可。
判定：**需作者改（MISMATCH，不退回）**。最小清单：① 把第 28 行"三格不重讲"改成与现表一致的说法（或删掉「谁在说」那一格）；②"每一处都说得出谁在听"降级为"8 条里 7 条"。

## 组 95 · affirm / declare（`4_01.md` 组2）

A 原文表：**OK**。1111 / 1112 / 1113 三行逐字符与数据一致（含 1112 译文"父亲只是平平地又应了一声，把那话说实"），加粗与标记集合一致。
B 句号与共现：**OK**。affirm 标记 1 处 = 1112（`[[affirm:affirmed]]`）、declare = 1111，与切片 `sents [1111,1112]` 对齐；"未打标记 0 处"两词各自成立（`affirm*` 全书仅 1 处、`declar*` 全书仅 1 处，我用词边界扫过）。
C 可 grep：**OK**。正面证据 `Father affirmed his promise again`（1112 子串 ✓）、`He affirms that the plan will work.` + exZh「他断言这个计划会成功。」✓、affirm 卡 note `affirm=断言、肯定（语气正式）`✓、declare 卡 ex/note ✓、promise 卡 note 词伙 `fair promise` ✓、claim 卡 m「声称」+ note「claim=声称（不一定是真的）」✓。**关键反例声明我复核为真**：「断言」在 `sentZh` 全书 0 处、`paraZh` 全书 0 处 —— 作者"本书课文（含译文）一次都没印过断言"不是虚报，是实。
D 宽度：默认行 35.5 / 35.5 ✓；总结句 23.5 / 23.5 ✓。
E 义项照抄：**OK**。「断言」「宣布」只出现在 `sense` 槽与被否定的表头里。
F 同源与厚度诚实：**OK**。两侧各 2 条独立文本（课文 1 + 卡 ex 1）如实写、明说"与本切片组 5 并列最薄"，没拿薄当缺陷、也没升级成禁令（"declare 不能接从句这话说不得"）；无同源重复计数。
判定：**可落地（OK）**。对作者提请拍板那条我的判断：**不必退**——「断言」只在卡 `exZh` 成立是数据事实（已核 0 处），"旧话 / 新话"这一格是真货且可 grep，按现表落地。

## 组 96 · aid / assist（`4_01.md` 组3）

A 原文表：**OK**。1117 / 1118 / 1119 / 1120 四行逐字符与数据一致，加粗词与标记集合一致（1117: midnight/whisper/clarify；1118: quiet/assist；1119: aid；1120: dawn/encourage）。
B 句号与共现：**OK**。段 39 base=1117，assist@1118、aid@1119 ✓ 与切片 `[1118,1119]` 对齐；aid 标记 2 处（1047、1119）+ 未标 0 ✓（`aids?` 词边界全书扫：仅这 2 处，`said/maid/afraid` 类假阳性已排除）；assist 标记 1 处 + 未标 0 ✓。旁引的 1047 确为章3 段27 第 2 句、句中 `[[aid:aid]]` ✓，所引英文与译文逐字符 ✓。
C 可 grep：**OK**，但**内部自相矛盾一处（记 MISMATCH）**。正面证据我逐条查到：aid 卡 ex + exZh ✓、卡 note 同义词 `assistance, help, support`（三词均无卡 ✓ 已核）与词伙 `foreign aid, receive aid, visual aids` ✓、humanitarian 卡 note + ex ✓、financial 卡 note ✓、nation 卡 note `aid-dependent nations` ✓、visual 卡 note + ex ✓、relief 卡 note「同义词：comfort, aid, assistance」✓、assistant 卡 ex ✓、principal/assistant 两卡词伙 `assistant principal` ✓、assist 卡 note 为空串 ✓（`"note": ""` 实测）。课文 foreign aid / receive aid / visual aids 确 0 处 ✓ 真。
 **矛盾**：第 179 行写"369 `her cheerful assistant` **打了标记**"——这是对的（369 的标记是 lecturer + assistant）；但第 226 行出处清单把同一句写成"（课文 369，**未打标记**）"。数据只有一个真相：369 **打了标记**。两行必有一行错，且错的是清单行。
D 宽度：默认行 36.5 / 36.5 ✓；总结句 21.5 / 21.5 ✓。
E 义项照抄：**BLOCK（一行文本手术）**。aid 卡 `m` = 「n. 帮助；援助；v. 协助」，**「援助」是 `m` 里的义项词，却出现在默认那一行**："aid = 挂在名词前的援助（aid workers）"。按 §五.4 / 审核书 E 行（义项词只许待在 `sense` 槽，豁免只给"表头引用 + 当场否定"），默认行不豁免。对照他点头过的口味基线，`outskirts/suburb`、`endanger/jeopardise`、`mild/moderate` 五例**没有一条**用 `m` 的原词当钩子中心语。修法作者自己已经写好：`core` 槽就是「挂在名词前那半截」，默认行改成「aid = 挂在名词前那半截（aid workers），assist = 搭手帮那个人（assist us）」即可（我量过：改后仍是 36.5，不超 40）。其余位置干净：core、维度列均无义项词；表头引「协助」是**引用 + 当场否定**（"这一档本书一次都没这样用过"）→ 豁免成立。
F 同源与厚度诚实：**OK**。三处跨卡同源（`foreign aid`、`visual aids`、`assistant principal`）都点名合并、只算 1 条 ✓；assist 卡 `note` 空这条按 §三.8 明说了 ✓；"卡上 `note` 缺失"没被拿来当退回理由 ✓。
 提醒（不改判定）：作者写"「协助」这一档本书没这样用过"——严格说是"没**这样**用过"，因为 `sentZh` 全书确有 1 处印「协助」：365「和蔼的校长欢迎家长，**协助**校长的副校长则挨个和大家握手」，它挂的是未打标记的 assistant（词头 principal）。建议在这行后补半句"（365 那句印了『协助』，但那是 assistant 的汉译，不挂在 aid/assist 上）"，否则下一位代理照 `sentZh` grep 会以为作者虚报。
判定：**需作者改（BLOCK）**。最小清单：① 默认行把「援助」换成非义项说法（用作者自己的 core 措辞，宽度不变）；② 第 226 行"369 未打标记"改回"打了标记"；③（建议）补 365「协助」那句的说明。
 对作者提请拍板两条我的判断：① 「协助」0 处属口径 6 正常型，**不必退**；② "assist 卡 `note` 空、一侧只有 2 条文本"**不构成退回理由**（口径 7），本组真正立得住的是词性 + to/with 两格，都硬且可 grep。

## 组 97 · donate / endow（`4_01.md` 组4）

A 原文表：**OK**。1144 / 1145 / 1146 / 1147 四行逐字符一致，加粗与标记集合一致（merchant/financial/pressure、fund/donate、endow/commercial、advertise/slogan/wooden/outside）。
B 句号与共现：**OK**。段 44 base=1144，donate@1145、endow@1146 ✓ 对齐切片；donate/endow 各"标记 1 处 + 未打标记 0 处"✓（`donat*`、`endow*` 词边界全书扫：各仅 1 处）。
C 可 grep：**OK**。`donate warm food to neighbors`、`endow the old house with new hope` ✓ 是 1145/1146 连续子串；donate 卡 ex/exZh/note（同义词 contribute, dedicate + 词伙 donate to worthy causes, donate money）✓；worthy 卡 note 同串 ✓；endow 卡 ex/exZh ✓、note 空串 ✓；generous 卡 ex `He gave a generous donation to the poor.` ✓（`donation` 全书课文 0 处 ✓ 真）；`endowment` 2 处 = natural 卡词伙 + fund 卡同义词栏 ✓（课文 0 处 ✓ 真）；contribute 卡 m/ex/note（反向列 donate）✓；dedicate **确无词头卡** ✓（我查 `vocab.json` 无 `dedicate`）；1149 背景句 ✓ 逐字符。"「捐赠」在本书译文里 0 处"我复核为**真**（`sentZh` 全书 0 处、`paraZh` 0 处）。
D 宽度：默认行 37.5 / 37.5 ✓；总结句 22.5 / 22.5 ✓。
E 义项照抄：**OK**。core「把东西送出去给人」「往那样东西里添」、默认行、维度列都没有 `m` 原词（「捐赠」「资助」「赋予」只在 sense 槽与被否定的表头里）。
F 同源与厚度诚实：**OK**。`donate to worthy causes` 跨卡合并 ✓、卡词伙 `donate money` 与卡 ex 合并为 1 条 ✓（没有把同一条算两次）；donate 4 条 / endow 2 条如实写、点名"最薄的一侧就是它" ✓。
判定：**可落地（OK）**。拍板那条我的判断：**不必退**——「捐赠」在共现段两处译文不落实是数据事实（已核 0 处），而本组真正立得住的 `to` / `with` 框架 + 1145/1146 主语对调与那个义项无关，4 条文本零例外，我逐句看过确实如此。endow 卡 `note` 空属常态。

## 组 98 · exchange / swap（`4_01.md` 组5）

A 原文表：**OK**。1152 / 1153 / 1154 三行逐字符一致，加粗与标记集合一致（paper/coupons/currencies、exchanged/swapped、receipt/levy）。
B 句号与共现：**OK**。段 45 base=1150，1153=段内第 3 句，两成员同句（`[[exchange:exchanged]]` + `[[swap:swapped]]`）✓ 对齐切片 `sents [1153]`；"标记各 1 处 + 未标 0 处"✓（`exchange*`/`swap*` 全书各仅 1 处）。
C 可 grep：**OK**。exchange 卡 ex/exZh/note（同义词 interchange, share + 词伙 exchange information）✓、swap 卡 m/ex/exZh、note 空串 ✓、transaction 卡 ex + note 同义词 `deal, exchange` ✓；`exchange information` 课文 0 处 ✓ 真；interchange / share **确无词头卡** ✓（我查 `vocab.json`，两者皆无；`share` 在课文有 6 处未打标记，作者说的是"没有卡"，措辞准确）。"本书没有一处 exchange 站在『兑换』上"✓ 真（全书仅 1153 一处）。
D 宽度：默认行 37.5 / 37.5 ✓；总结句 18.0 / 18.0 ✓。
E 义项照抄：**OK**。core「跟谁换来换去」「拿一样换一样」不是 `m` 原词「交换」；「兑换／交易所」出现在维度列时是**引用 + 否定**（"那一档本书 0 处"）→ 豁免；表头宣称「交换」本段两处都站得住 —— 我核 1153 译文「换来换去」「换来一个笑脸」，**该段确实撞**，不属 §五.11 拦的那种"宣称而不撞"。
F 同源与厚度诚实：**OK**。两侧各 2–3 条如实写、明说"全部区别出自同一句 1 处" ✓；没有把孤证升级成规则（"`exchanged for`、`swapped with` 本书 0 处，不宣称不可能"）✓。
判定：**可落地（OK）**，无需拍板。

## 组 99 · increase / increment（`4_02.md` 组1）

A 原文表：**OK**。1162–1167 六行逐字符与数据一致（含 1166 译文"客人每多一点点，都像寒冬过后的暖意生长"），六行加粗集合与该段标记集合完全相同。
B 句号与共现：**OK**。段 47 base=1162（883 + 段 0–46 共 279 句，作者自算 279 我复算一致），increase@1165（第 3 句）、increment@1166（第 4 句）✓ 对齐切片 `[1165,1166]`；两词"标记 1 处 / 未打标记 0 处"✓（`increas*` 全书仅 1165 一处；`increment*` 全书仅 1166 一处）。
C 可 grep：**OK**。正面证据全部查到：`increase fresh fruit on the shelves`、`Every tiny increment in visitors` ✓ 子串；increase 卡 ex/exZh + note 同义词（boom, boost, raise）+ 词伙 3 条 ✓；increment 卡 ex/exZh + note 只有词伙 `tiny increment`、无同义词栏 ✓。**§五.13 那笔"12 张别的卡在用它"我逐张数过，分毫不差**：ex 侧 7 张 = dramatic / velocity / revenue / increment / turnover / import / demand ✓，note 侧 5 张 = sale / tension / circulation / brain / raise ✓；"increment 在别的卡里 0 处"✓ 真（全库只有 increment 自己那张卡提它）。
D 宽度：默认行 39.5 / 39.5 ✓；总结句 26.5 / 26.5 ✓。
E 义项照抄：**OK**。core「动手把数弄上去」「多出来的那一小格」避开了 `m` 原词「增加 / 增量 / 增长」；表头引「增加」是"两边都站得住 + 真正岔口是词性"，而 1165 译「多摆」、1166 译「每多一点点」确实都落在增加上（不是宣称而不撞）。
F 同源与厚度诚实：**OK**。词伙 `tiny increment` 与 1166 同源、点名不另计 ✓；increment 侧只 2 条如实写 ✓；"本书课文 increase 没有一次跟 in"、"名词档只活在别的卡 ex 里"两条我核为真，且都停在"本书"口径。
判定：**可落地（OK）**。

## 组 100 · decrease / reduce（`4_02.md` 组2）

A 原文表：**OK**。1162–1166 五行逐字符一致，加粗与标记集合一致。
B 句号与共现：**OK**。decrease@1163（名词位）、reduce@1165 ✓ 对齐切片 `[1163,1165]`；两词"标记 1 处 / 未打标记 0 处"✓，并且作者那句"这两个词除上面两处标记外再没有别的写法出现过"我为他独立验了：`reduc*`（含 reduced/reduces/reduction）与 `decreas*` 在 1833 句里各只 1 处 ✓ 真。
C 可 grep：**OK，一处举例错位（记 MISMATCH）**。`all_synonyms: true` 的物证我核为真：decrease 卡 note 同义词栏含 reduce、reduce 卡 note 同义词栏含 decrease（互列）✓。"decrease 一次都没被任何一张卡的例句用过、只出现在 8 张卡的同义词栏里"✓ 精确 —— 我扫出含 decrease 的别的卡恰为 8 张（alleviate / decline / diminish / drop / mitigate / shrink / deprive / reduce），且 8 处全在「同义词：」段内 ✓。"reduce 被 4 张别的卡 ex 用、被 7 张卡词伙用"✓ 精确（ex：reuse / campaign / emission / illiteracy；词伙：burden / debt / aggressive / diversity / anxiety / operate / accident，我逐张确认都在「词伙：」段而非同义词栏）✓。`a reduce in` 查不到 ✓ 真。
 **错位**：第 102 行那句"过去式与第三人称单数只在卡侧例句里有：`reduces emission`、`increases by one increment`"——后半引的是 **increase** 的卡 ex（组 1 的词），不是本组 decrease/reduce 的写法证据。删掉那半条，或换成 `reduces emission` 之外的 reduce 例子（本组卡侧只有 `reduces`、`reduce` 两种形式）即可。不影响任何结论，但这是"拿别组的串给本组当证据"的形状，必须清掉。
D 宽度：默认行 39.0 / 39.0 ✓；总结句 20.0 / 20.0 ✓。
E 义项照抄：**OK**。core「落下来的那一截」「他动手把那样东西弄小」避开了「减少 / 降低 / 减量」；表头没有宣称"本段两词都在降低"（1163 译「下滑」、1165 译「减少」），并明确"卡说能换、书里各守一位"。
F 同源与厚度诚实：**OK**。`reduce debt` 跨卡合并、`reduce waste` 与卡 ex 合为 1 条 ✓；"本书给不出一个可换的实例"这条是主动交底，方向正确（口径 3 要的就是这个）。
判定：**需作者改（MISMATCH，1 处举例错位，不退回）**。

## 组 101 · growth / increase（`4_02.md` 组3）

A 原文表：**OK**。1165 / 1166 / 1167 三行 + 另章 1831 一行，英文去标记后与数据逐字符一致，中文与同位 `sentZh` 逐字符一致；加粗与标记集合一致（1831 的标记是 periodically / growth / imminent，草稿正是这三个）。
B 句号与共现：**OK**。increase@1165、growth@1166 ✓ 对齐切片；growth 第 2 处 1831 = 章5 段55 第 0 句（1492 + 前 339 句）✓，作者标的"章5 段55 第 0 句"对；"increase 标记 1 / 未标 0、growth 标记 2 / 未标 0"✓。**grew 17 处 / grow 4 处 / growing 4 处且全部未打标记** —— 我用词边界全书扫，三个数与"全部未标"都对得上（1155、202 两处引文也逐字对）✓。
C 可 grep：**OK**。growth 卡 ex/exZh/note（同义词 boom, boost + 词伙 social / economic / population growth）✓；affect / uptake / hormone 三张卡 ex ✓ 逐字；population 卡词伙 `population growth` ✓；`boom` 课文 0 处 ✓ 真、`boost` 课文仅 1226 一处且那处标记是 potent ✓ 真（我核 `heads=[potent, bound]`）。"increase 侧十几条无一活物"我数了：increase 出现过的 12 张卡 + 课文 1 处，宾语全是利润 / 销量 / 成本 / 温度 / 进口量 / 营业额 / 需求 / 车速，唯一沾活物的是课文那处 `fresh fruit`（作者自己在同一格里点名了）✓。
D 宽度：默认行 37.5 / 37.5 ✓；总结句 19.0 / 19.0 ✓。
E 义项照抄：**OK，且是本批最标准的 §五.11 写法**。表头开宗明义"这一段两个词都没在说『增长』"→ 引用 + 当场否定；core「把数往上添」「活的东西在长」不用 `m` 原词；维度列「卡上『增长』那一档落实了吗」是同一种否定式引用。
F 同源与厚度诚实：**OK**。`increase sales`（increase 卡 = sale 卡）、`population growth`（growth 卡 = population 卡）都点名合并 ✓；increase ≈11 条 / growth 9 条的分类可复算 ✓；没有把"活物"写成词义禁令（边界里明写"growth 卡 `m` 自己就有经济增长那两档，只是本书没用"）✓。
 提醒（不改判定）：表头那句"本书课文一处没落实"对**成员词**成立，但"增长"两个字在 `sentZh` 全书其实出现 2 次（206「日益增长的多样性」、326「智力增长」），都挂在**未打标记的 growing** 上。作者在本组已按 §五.13 把 grew/grow/growing 单独报备过，所以不算虚报；建议表头补半句"（课文另有 2 处译『增长』，挂的是没打标记的 growing）"，免得下一位代理 grep 到 206/326 以为这条不成立。
判定：**可落地（OK）**。拍板那条我的判断：**不必退，而且这组不该被算作"共享义项失败"的负面样本**——两侧都不在「增长」上是数据事实（我核过 1165 动词、1166 生长档），但"活物 6 处 vs 数得出来的东西 十几处 0 处"是批次 4 目前最厚、最可 grep 的一格，退掉等于把本片最有用的一条扔掉。

## 组 102 · adequate / sufficient（`4_02.md` 组4）

A 原文表：**英文 / 中文逐字符 OK，但加粗越界 → 记 MISMATCH**。1168–1173 六行英文去标记后与数据完全一致、六行中文与 `sentZh` 完全一致。**问题**：1168 行把 `renters` 加粗、1170 行把 `chairs` 加粗，而数据里这两处**根本没有 `[[词头:…]]` 标记**（1168 的标记只有 influx / imply / affluent，1170 只有 adequate / spare），`vocab.json` 里也**没有 renter / chair / chairs 任何一张卡**。草稿全文其余 43 行（两份共 46 行带编号的表行）都严守"加粗 = 数据里挂了词头"这条约定（4_01 全 20 行零例外），所以这两处会让读表的人以为 renters / chairs 是本书目标词。修法：去掉这两对 `**`。
B 句号与共现：**OK**。段 48 base=1168（作者自算对），sufficient@1169、adequate@1170 ✓ 对齐切片 `[1169,1170]`；两词"标记 1 处 / 未打标记 0 处"✓（`adequat*`、`sufficien*` 全书各仅 1 处）。
C 可 grep：**OK**。两卡 ex / exZh / note（互列对方 + 都列 enough、词伙 `barely adequate` / `sufficient room`）✓ 逐字；"两词都没有第二张卡来借"✓ 精确（全库 adequate 只出现在 sufficient 卡、sufficient 只出现在 adequate 卡）；`enough` 无卡 ✓、课文 5 处未打标记且**编号完全对**（134 / 1104 / 1107 / 1726 / 1746，134 译「蓄的水，够所有人用」✓）；`adequate room`、`was sufficient`、`room sufficient` 三处"本书没有"我查为**真**；`shortage` 无卡 ✓、课文仅 1159 一处未打标记 ✓、`water shortage` 活在 drought 卡同义词栏 ✓。
D 宽度：默认行 39.0 / 39.0 ✓；总结句 28.0 / 28.0 ✓。
E 义项照抄：**OK**。core「刚过线，勉强及格」「数凑够了，装得下」不含 `m` 原词「足够的 / 充足的」；表头宣称「足够」两边成立 —— 1169 译「足够的地方」、1170 译「勉强够用」，该段确实撞 ✓。
F 同源与厚度诚实：**OK**。两条词伙都与课文同源、明确不另计 ✓；"4 条文本两侧完全对称"、"样本 2，不许写成 adequate 只能当表语" ✓ 措辞停在本书。
判定：**需作者改（MISMATCH，2 处越界加粗，不退回）**。另：本组与组 5 共用 1170 那句，切入角不重复（本组讲"够不够、站句子哪儿"，组 5 讲那把椅子），符合口径 9。

## 组 103 · redundant / spare（`4_02.md` 组5）

A 原文表：**MISMATCH（同组 102 的加粗越界）**。1169 / 1170 / 1171 / 1172 + 1401 各行英文、中文与数据**逐字符一致**，唯一问题是 1170 行 `**chairs**` —— 该处数据只有 `[[adequate:adequate]] [[spare:spare]]` 两个标记，chairs 没打标记也没有卡。删掉那对 `**` 即可。
B 句号与共现：**OK**。spare@1170、redundant@1171 ✓ 对齐切片 `[1170,1171]`；spare 第 2 处 1401 = 章4 段20 第 5 句（1277 + 124）✓；"spare 标记 2 / 未标 0"（`spare*` 词边界全书扫 = 1170、1401，`transparent` 那类假阳性已排除）✓、"redundant 标记 1 / 未标 0"✓。
C 可 grep：**OK**。spare 卡 m/note 词伙 `spare chairs`/ex/exZh ✓；accessory 卡词伙 `spare accessory`（与 1401 同源 ✓）；compose 卡 ex `He composes music in his spare time.` ✓；redundant 卡 m/ex/exZh ✓、**note 实测确为空串 `""`** ✓、"全库没有第二张卡提到 redundant"✓ 真；"本书没有一处把 redundant 用在人身上"、"`be made redundant` 0 处"✓ 真；`spare parts`/`spare tyre`/`redundancy` 等 8 条"不写的"我查为**确实 0 处** ✓。
D 宽度：默认行 38.0 / 38.0 ✓；总结句 21.0 / 21.0 ✓。
E 义项照抄：**OK**。core「备着等人用」「用不上的那一堆」不含 `m` 原词「多余的 / 被裁减的 / 抽出」；表头宣称「多余」两边成立 —— 1170「多余椅子」、1171「成了多余之物」确实同一个中文词，1401 却译「备用的」这条也被如实写成"靠中文区分不了" ✓。
F 同源与厚度诚实：**OK**。`spare chairs`=1170、`spare accessory`=1401 两条同源都点名不另计 ✓；4 vs 2 的厚薄差明说、并警告"别为对齐去给 redundant 造搭配" ✓。
判定：**需作者改（MISMATCH，1 处越界加粗，不退回）**。拍板那条我的判断：**不必退，也不必为它单独挂一条"卡上无词伙段"的特殊标注**——`validate_data.py` 只管数据完整性，卡上 note 空是常态（本批我自己就数到 assist、endow、swap、increment、redundant 五张 note 空 / 只有一条词伙），表里已经用中文写明白了，再挂标注等于给渲染层加新概念。

---

## 一、作者报上来的两件，我独立核的结论

**1）`4_01`：「段 38 末已挂着已落地的组 93（declare/proclaim），所以组 94/95 的载体必须换成 announce/affirm」—— 说法成立。**
我直接读 `shadow/data/vocab.json`：`declare.cmp` 存在且为 `{"group": "declare-proclaim", "at": [3,38], ...}`（4 个维度格、summary 已写好），`worklist_idx 93 = declare/proclaim`（manifest slice18 对得上），即该表**已落地在生产数据里**、挂段正是章3 段38；而本批 10 组 18 个成员词头里**只有 declare 一张带 `cmp`**（`announce.cmp`、`affirm.cmp` 均无；我顺手扫的 22 词头中另有一张 `natural.cmp=natural-nature`，`at=[0,26]`，与本批无关）。所以"declare 的对比表位被占、94/95 换载体"是对的，无需为此改任何内容 —— 与任务口径一致（落地器自动换载体）。
副作用一件：段 38 末落地后会挂 **3 张表**（93 declare/proclaim + 94 + 95），仍在"实测最多 5 张"之内，且 94 讲"有没有人在等"、95 讲"新话还是旧话"，两句成员句不撞（94 用 1111+1116、95 用 1111+1112）—— 但见组 94 的 MISMATCH：草稿承诺过"那张表的三格不重讲"，实际复用了「谁在说」与「中文各走哪一路」两个维度名。

**2）`4_02`：increase 同时是组 99 与组 101 的成员、段 47 末挂三张表 —— 三组切入角确实各写各的，没重复。**
我按维度名 + 成员句 + 括号里的证据逐组对：99 = increase/increment 的"动作 vs 那一格"+ `in`/`by` 框架（成员句 1165+1166）；100 = decrease 名词位 vs reduce 及物动词位、"句子里有没有人动手"（1163+1165）；101 = growth 管活物 vs increase 管数得出来的东西（1165+1166+1831）。三张表**没有一个维度格是同一对词 + 同一件事**，`all_synonyms` 也不同（99/101 false、100 true），载体建议（99→increment、100→decrease、101→growth）我核过这五个词头目前 `cmp` 全空、且段 47/48 末现在**一张表都没挂**（我扫了全部 97 张已落地 cmp 的 `at`，章3 只到段 38），不撞车。
 一条口味级提醒给他拍板（不是缺陷）：**段 47 三张 + 段 48 两张，五张表的"第一格"全是词性 / 句子位置**（99「它是动作还是那一格」、100「本书把它摆在哪个位置」、101「谁能当动词」、102「它站在句子哪个位置」、103「站在句子哪儿」）。逐张看都对，同一屏连开三张会有"又是词性"的重复感。真要错峰，最省事的是把 101 的第一格换成"它管哪样东西（活物 / 数得出来的东西）"——那张表的差异化内容本来就在这格，且它比"谁能当动词"更不像语法课。

## 二、批次级复核（三件套，两组都过）

- **§五.12 坏数组**：我独立重跑判定式，章3 命中恰为段 22–43（含尾缀「 灯下团聚，欢语不断。」），其余章 0 处。两份草稿引用的段 38 / 段 39 / 段 27 主题栏**逐字与数据一致**且都标明"坏数组、本段句子不含此事、不取为据" ✓；段 44 / 45 / 47 / 48 在数组之外，四段主题栏逐字引用 ✓，其中组 5 把「担心高租吞噬积蓄」判为本段 6 句撑不住而**主动不取** ✓（1150–1155 确无 rent）。`subheads[3]` 实测是稀疏数组、只有下标 44 有值「下篇·街角小店」，草稿一律写 `subheads[3][44]` 是对的 ✓。
- **§五.13 两档分开**：10 组所有"标记 N / 未标 M"我逐条重算 —— 全部与数据相符（announce 1+1、declare 1+0、affirm 1+0、aid 2+0、assist 1+0、donate 1+0、endow 1+0、exchange 1+0、swap 1+0、increase 1+0、increment 1+0、decrease 1+0、reduce 1+0、growth 2+0、adequate 1+0、sufficient 1+0、redundant 1+0、spare 2+0），唯一的口径瑕疵是 4_01 组 3 清单行把已打标记的 369 写成"未打标记"（已计入组 96 的 BLOCK 清单）。
- **宽度**：20 条（10 默认行 + 10 总结句）**全部标称 = 实测**，无一超 40 / 30；4 条贴着上限的默认行（39.5 / 39.0 / 39.0 / 38.0）我按同一把尺复核过没算虚，也不需要往 45 抬或压到 25。

