# 门禁 2 审核 · 批次 3 切片 05 + 06（`work/辨析草稿/3_05.md`、`work/辨析草稿/3_06.md`）

组数 10 / BLOCK 0 / MISMATCH 3 / 通过 7

> 审核范围：3_05 = worklist_idx 72/73/74/75/76；3_06 = worklist_idx 77/78/79/80/81。
> 数据只读 `shadow/data/sections.json`、`shadow/data/vocab.json`；宽度一律用 `tools/width_rule.py` 的 `width()` 复算。

## 组 1 · cottage / hut（3_05，slice14 worklist_idx 72）

A 原文表：**OK**。769–774 六行英文（去 `[[词头:表面]]` 标记后）与六行 `sentZh` 逐字回 `sections.json` 章2 段20 比对，标点、大小写、单复数、时态全一致，无并句、无错位。表内加粗位置（769 hut、771 cottage）与数据里的标记词头一致。

B 句号与共现：章2 偏移 651 + 段20 之前累计 118 句 = 769，与草稿「段 20 之前累计 118 句 → 首句即 769」一致；771 = 段20 第 2 句 ✓。切片包 `paras=[[2,20]]`、`sents=[769,771]` 全部对得上。成员确实以 `[[hut:hut]]`（769）、`[[cottage:cottage]]`（771）出现在声称段里。附带复核：cottage 全书带标记 **1 处**（771）、hut 全书带标记 **1 处**（769），草稿的"唯一共现段/各只 1 句"成立；766–768 那六张卡（skyscraper/villa/mansion/apartment/hostel/hunting lodge）与 770 的 cellar/shed、772 的 cradle 位置也逐条核过，无误。

C 可 grep：正面证据 **15 条**我亲自查到 —— `a weak hut`、`Behind the yard`、`a wooden cabin`、`full of battered chairs`、`The small cottage next door`、`served as a daytime nursery for village kids`、`found his tiny cradle there`、`small cottage`（cottage 卡 note 词伙）、`They live in a small cottage near the forest.` + `exZh`、`The children built a hut in the woods.` + `exZh`、`He lived in a crude hut with no electricity.` + `exZh`、`crude hut`、`with no electricity`、`crude joints`、`dark cellar`、`leaning shed`、`hunting lodge`、`They stayed in a small lodge near the forest.`、`tiny cradle`（后四条分别落在 cellar/shed/lodge/cradle 卡 `note`，跨卡登记已核）。查无但草稿明写"本书没有"的否定行 **2 条**（`cottage garden`、`fisherman's hut`），实测全库 0 命中，属真否定 → 放行。表内「`built` 为其词形」的说明也与卡 ex 一致。**未见藏在否定行里的正证据。**

D 宽度：草稿默认行 36.5 / 实测 **36.5**；总结句草稿 20.0 / 实测 **20.0**。均在上限内（≤40 / ≤30），标称值无虚报。`core` 六字/七字，全部 ≤12。

E 义项照抄：`sense` 槽写「村舍；小屋」「小屋；棚屋；茅屋」，`core`（隔壁那间住家 / 搭出来的那间）、默认行、总结句均未复述卡上 `m` 的词。表头「worklist 给的共同义项是"小屋"，可本书译文自己给岔开了」+「所以要分的不是这两间谁更小」= 引用并当场否定，属口径 11 豁免句式，且事实核对为真（769 `sentZh` 作「破棚」、771 作「小屋子」）。**OK**。

F 同源诚实：cottage 卡词伙 `small cottage` 与课文 771 同源，草稿在「卡上给不给现成块」格和「数据边界」两处都点名合并、明确"不另计"；独立文本 cottage 2 条 / hut 3 条（含 crude 卡 ex 这一条别家书证，来源标注清楚）→ 与实算相符。**OK**。薄（各 1 处课文）已按口径 7 如实写，未据此要求退回。

判定：**可落地（OK）**。无需作者改。

提请拍板 ① 前半（我的判断）：**支持出卡，不必退**。本组的"共同义项名不副实"是真的（769 译「破棚」、771 译「小屋子」，交集词「小屋」只落在 cottage 侧），但草稿处置完全落在口径 6/11 的轨道上：标题不宣称两词都指"小屋"、义项只留 `sense` 槽、并在 diff 表第 5 格 + 「数据边界」两处各点名一次"本书译文自己给岔开了"。769 后半 `full of battered chairs` 归属未定这一点，草稿主动拒绝把它当 hut 的证据，这个自我约束方向是对的，不需要他再补裁决。

---

## 组 2 · living room / parlour（3_05，slice14 worklist_idx 73）

A 原文表：**OK**。781–785 五行英文（去标记后）与 `sentZh` 逐字回章2 段22 比对全等，加粗位置（783 `[[parlour:parlour]]`、785 `[[living room:living room]]`）与数据一致。成员表的音标（/ˈlɪvɪŋ ruːm/、卡 `us` 同值、`uk` 作 /'lɪvɪŋ ru:m/）、`m`「客厅；起居室」/「客厅；起居室；营业室」、"卡 `m` 标的是 `phrase.`（不是 `n.`）"、living room `note` 空串 —— 逐项对卡验过，全对。

B 句号与共现：章2 偏移 651 + 段22 之前累计 130 句 = **781**，与草稿"段22（全局 781–785）"一致；783 = 段22 第 2 句、785 = 第 4 句 ✓，与切片包 `sents=[783,785]` 对得上。全库扫描：`[[parlour:…]]` 全书只 783 一处、`[[living room:…]]` 全书只 785 一处（含未打标记的纯文本 'living room' 也只有卡 ex 与 spacious 卡 ex 两处，都在 `vocab.json` 不在课文里），草稿"各只 1 句 + living room 另 1 条文本在 spacious 卡 ex"成立。段 20 与段 22 相隔两段、不抢挂位 ✓。

C 可 grep：正面证据 **20 条**全部查到 —— `the old parlour looked empty and sad`、`old parlour`（卡 note 词伙）、`the rickety wooden bench`、`polishing every wooden cabinet door`、`the dusty living room shelves`、`We watch TV in the living room.` + `exZh`、`watch TV`、`in the parlour`、`drank tea`、`She sat in the parlour and drank tea.` + `exZh`、`The new house has a spacious living room.` + `exZh`、`a spacious living room`、`new house`、`a simple reception corner`（782）、`hotel lobby`（782 + lobby 卡词伙）、`simple reception`（reception 卡词伙）、`stone fireplace`、`iron radiator`（784 + 两卡词伙）、`wide eaves`、`stone chimney`（781 + 两卡词伙）。「起居室」在全书课文译文里 0 处、「营业室」0 处，两条否定陈述实测为真。**唯一查出问题的一条见 F/结论行：`sitting room` 被写成"本书没有"，实际课文 1712 有。**

D 宽度：默认行草稿 38.5 / 实测 **38.5**；总结句草稿 29.0 / 实测 **29.0**（贴 30 上限但未超）。标称无虚报。`core`「一家看电视那间」7 /「旧式待客那间」6，≤12 ✓。

E 义项照抄：`sense` 槽承载「客厅；起居室」，`core`、默认行、总结句均未复述。表头两处出现「客厅」是**陈述译文事实**（783 译「旧客厅」、785 译「客厅」，实测为真），「起居室」则是引用后当场否定（"本书一次也没这样译过"）→ 属口径 11 放行形状。且本组与"该段实际不撞"的情形相反：这一段两词确实同指一间屋，草稿在「数据边界」里主动写明"中文这一格两词没有区别"，没有把义项词升级成区别。**OK**。

F 同源诚实：`old parlour`（卡词伙）与课文 783 同源，草稿在 diff 行与「数据边界」两处都点名合并、不另计，独立文本 parlour 2 / living room 3 与实算一致；reception/lobby/fireplace/radiator/eaves/chimney 六条跨卡词伙也逐条标了"与课文同源"。**未发现把同一处文本算成两条。**

判定：**MISMATCH —— 需作者改一处（最小清单）**
1. 「不写的」那行 `front room`、`sitting room` 这类本书没有的近义词不列 —— **`sitting room` 本书有 1 处**（全局 1712，章5 段36 第 4 句 `…clear laughter filled the small sunny sitting room.`，`sentZh`「清脆的笑声洒满小小向阳的会客室」）。改成"sitting room 本书只 1712 一处、译「会客室」，不在本组共现段，故不并列"即可；`front room` 实测 0 处，那句留着没问题。

提请拍板（本组）：草稿未把本组列为待拍板组，我同意 —— 义项名不副实（「起居室」全书 0 译）已按口径 6 说轻，"两词同物"这个反直觉事实它主动挑明了，**可落地**（改掉上面那一行虚报后）。

---

## 组 3 · complex / mall（3_05，slice14 worklist_idx 74）

A 原文表：**OK**。786–790 五行英文（去标记后）与 `sentZh` 逐字回章2 段23 比对全等（含 788 的 `bath tub` 两词分标、790 的 `night market booth`），标点/大小写/单复数一致。两卡的音标与词性标注逐项对卡核过：complex `p` ˈkɑːmpleks / `uk` ˈkɒmpleks / `us` kəmˈpleks（草稿写"英 /ˈkɒmpleks/，美 /kəmˈpleks/"✓）、`m` 确为「n. 综合楼（群）；购物中心；adj. 复杂的」两档同卡（草稿"n. 与 adj. 两档挂在同一张卡上"✓）；mall `uk` 确为 `mɔːl; mæl`（草稿"英亦作 /mæl/"✓）。

B 句号与共现：章2 偏移 651 + 段23 之前累计 135 句 = **786**，段23 共 5 句 → 789 = 段内第 3 句 ✓，与草稿"全局 786–790""第 3 句"及切片包 `sents=[789]` 全部对得上。789 内 `[[mall:mall]]`、`[[complex:complex]]` 双标记确实同句，"前后两半"方向也对（mall 在前）。全库扫描：complex 带标记全书仅 789 一处、mall 带标记全书仅 789 一处 ✓；两词在课文里也没有任何未打标记的出现。

C 可 grep：正面证据 **13 组**全部查到 —— `the noisy town mall`、`stone shopping complex`、`Unlike the noisy town mall or stone shopping complex, home felt calm`、`He goes to the mall to buy clothes.` + `exZh`、`buy clothes`、`shopping malls`（mall 卡 note）、`The instructions are too complex for children.` + `exZh`、`handle complex real-life communication scenarios`（complex / handle / scenario 三卡同条，已核）、`complicated, intricate, involved`（complex 卡同义词栏）、`tough` 卡 note 同义词 `challenging, complex, complicated`、`complicated` 卡 note 同义词 `complex, intricate, involved`（两条反向指认均实测存在）、`the distant supermarket` + `night market booth`（790，并分别同见 supermarket、booth 卡 `note` 词伙）。否定行 5 条实测全部为真：`complexes` 0、`sports complex` 0、`a mall in the city` 0、`shopping mall(s)` 课文 0（只 mall 卡上 1 条）、形容词档 complex 在课文里 0 处。无藏在否定行里的正证据。
- **一处背景句少算**（不影响卡片内容）：草稿写"同段 790 还站着 `supermarket`、`booth` 两张别的卡"，实测 790 是 `[[supermarket:…]] [[night:night]] [[booth:…]]` **三处标记**（night 有卡），该句少列一个。范围声明不完整而已，不计 MISMATCH，作者顺手补。

D 宽度：默认行草稿 36.5 / 实测 **36.5**；总结句草稿 23.5 / 实测 **23.5**。`core`「不止一栋那一排」7 /「镇上那一家」5，≤12 ✓。均未超限、标称无虚报。

E 义项照抄：`core`、默认行、总结句均未出现卡 `m` 的中文词；「购物中心」只在 `sense` 槽和表头出现，表头是"worklist 说共同义项是"购物中心"，两词这一档确实都对"—— 属**宣称两词都指 X 且该段实测真撞**（789 `sentZh` 一处「商场」一处「购物中心」，两卡 `m` 均含这一档），正是 BRIEF 第 6 条留出的"名副其实"情形，不构成 E 项拦截。区别落在修饰词（`town`+`noisy` vs `stone`+`shopping`），未复述义项。**OK**。

F 同源诚实：complex 卡 ex 与词伙全属形容词档、名词档零现成块 —— 草稿没替它编搭配，并把"三卡一条词伙"合并算 1 条；独立文本 mall 3 / complex 名词档 1 / 形容词档 2 的分账与实算一致，且明说形容词档那 2 条"不属本段这一档，只在'还挂着别的一档吗'那格里当证据用"。**未发现同源双计，也未把薄当退回理由。**

判定：**可落地（OK）**。建议（非必须）：把 790 的"两张别的卡"补成三张（含 `night`）。

提请拍板 ②（我的判断）：**支持出卡，不必退，也不必给 complex 补词伙**。他的疑虑（名词档只 789 一处、卡上现成块全在形容词档）实测成立，但这正是口径 7 说的"薄不是退回理由"，而且草稿的处理方式是把薄如实写进 diff 第 6 格与「数据边界」，没升级成语法禁令、也没编第二条书证。建议不要按"每个成员用到的那一档至少一条卡上现成块"去加门槛 —— 那等于要求往数据里补 `stone shopping complex`（与 789 同源），会直接撞口径 8。

---

## 组 4 · refectory / restaurant（3_05，slice14 worklist_idx 75）

A 原文表：**OK**。799–804 六行英文（去标记后）与 `sentZh` 逐字回章2 段26 比对全等（含 799 的直角撇号 `tomorrow’s`、804 的 `barbecue stand`），加粗位置（801 `[[restaurant:restaurant]]`、802 `[[refectory:refectory]]`）与数据一致。两卡音标/词性/`m`/`ex`/`exZh`/`note` 逐项对卡核过：refectory `m`「食堂；餐厅」、词伙 `school refectory`、`exZh`「学生们在食堂吃午饭。」；restaurant `/ˈrestərɑːnt/`（`uk` ˈrestrɒnt）、`m`「餐厅；餐馆」、词伙 `small restaurant` —— 全对。

B 句号与共现：章2 偏移 651 + 段26 之前累计 148 句 = **799**，段26 共 6 句 → 801 = 第 2 句、802 = 第 3 句 ✓，与切片包 `sents=[801,802]` 一致。1196 反算落在章3 段52 第 4 句 ✓（草稿"章3 段52，章3 下篇·街角小店"及译文「饭馆晚付货款，逼得他向供货商要一点退款」逐字对 `sentZh`）。全库扫描：refectory 带标记全书仅 802、restaurant 带标记全书仅 801 + 1196，课文内均无未打标记的出现 ✓。

C 可 grep：正面证据 **20 组**全部查到 —— `a small restaurant`、`planning to make the old hall into a small restaurant`、`secret recipe`（801 + recipe 卡词伙）、`the school refectory`、`the noisy street bar`、`the food at home would taste gentle`、`street bar`（bar 卡词伙）、`school refectory`（卡词伙）、`The students eat lunch in the refectory.` + `exZh`、`small restaurant`（卡词伙）、`We ate dinner at a small restaurant.` + `exZh`、`ate dinner`、`The restaurant caters to vegetarians.`（cater 卡 ex）、`help Mom cater`（799）、`The restaurant offers excellent service.`（service 卡 ex）、`He eats gourmet food at a fancy restaurant.`、`a fancy restaurant`（gourmet 卡 ex）、`A late payment from a restaurant forced him to ask for a small refund from the supplier.`（1196）+ `small refund`（refund 卡词伙）+ `make a payment`（payment 卡词伙）、`the dull cafeteria lines`（803 + cafeteria 卡词伙 `cafeteria lines`）、`costly hotel buffet`（803 + buffet 卡词伙 `hotel buffet`）、`We ate lunch in the school cafeteria.`、`He buys lunch in the school canteen.`、`yard barbecue stand`、`family supper`。
- **`canteen` / `dining hall` 那张已落卡**：实测挂在章1 段7（`canteen` 卡 `cmp.at = [1,7]`），与草稿"在章1 段7 已经落过一张同类辨析卡（载体挂在 canteen 卡上）"一致 ✓。
- 否定行 4 条实测全为真：`refectories` 0、`restaurants` 0、`fine dining` 0、`restaurant menu` 0；「餐厅」在 `sentZh`/`paraZh` 里 0 处 ✓。
- 一处计数可再精确（不影响内容）：`exZh` 里写「餐厅」的其实是 **5** 张卡（cater / restaurant / cafeteria / gourmet / service），草稿写 4 张 —— 差的那张是 cafeteria 的「自助餐厅」（含在复合词里），草稿点名的 4 张逐一核过均属实，按"standalone 写餐厅"理解成立。

D 宽度：默认行草稿 36.5 / 实测 **36.5**；总结句草稿 24.5 / 实测 **24.5**。`core`「学校那间饭厅」6 /「开门等客人那间」7 ≤12 ✓。

E 义项照抄：`core`、默认行、总结句均未复述「食堂/餐厅/餐馆」；表头「worklist 的共同义项「餐厅」本书在这两句里一次都没这样译（一处作「小饭馆」、一处作「食堂」）」= 引用义项 + 当场否定，实测为真（801 译「小饭馆」、802 译「食堂」）→ 口径 11 放行。diff 第 7 格进一步把"交集词本段两词都没沾"落到 1196 译「饭馆」上，未把义项当区别用。**OK**。

F 同源诚实：卡词伙 `school refectory` 与 802 同源、`small restaurant` 与 801 同源，草稿两处都点名"不另计"；独立文本 refectory 2 / restaurant 6 与我的全库扫描**逐条对得上**（801、1196、自家 ex、cater ex、service ex、gourmet ex 确为 6 条互不同源的文本）→ 无同源双计。另外它主动声明 cafeteria 卡 ex 与 refectory 卡 ex 同构、"只作旁证、不算 refectory 的书证"，这句是关键的正向自律，核下来也确实没算进去 ✓。「两侧方向一致（一群固定的人 / 上门的客人）」这句是建立在 6 条独立文本上的，不是单点，未构成"两处书证方向一致"的虚报。

判定：**可落地（OK）**。两处可选精确化（不阻断落地）：① 表头/复核索引把「章 2 标题」改称"章 2 卷题（`zh` 字段）"，实际数据里 chapter 2 的 `title` 是「衣食住行」、「旧物店与老屋餐厅」是 `zh`；② `exZh` 写「餐厅」的卡数是 5 张（含 cafeteria 的「自助餐厅」）。

提请拍板 ① 后半（我的判断）：**支持出卡，不必退**。本组是 10 组里"共同义项在共现段两处都不落地"最彻底的一组，但它的处置是口径 6 的教科书形状：标题改写成"这两间各是谁的饭桌"、义项只留 `sense`、并在 diff 第 7 格 + 「数据边界」两处各点名一次"本书没这样用过"。更关键的是它的替代判据不薄：restaurant 侧 6 条独立文本里有 3 条来自别的卡、1 条来自别的章的课文，"钱的关系"那条（1196）是全书唯一一处 restaurant 与 payment/refund 同框，实测为真。建议按现稿落地，别让这组因为"餐厅"两个字没出现而被砍。

---

## 组 5 · corn / grain（3_05，slice14 worklist_idx 76）

A 原文表：**OK**。831–836 六行英文（去标记后）与 `sentZh` 逐字回章2 段31 比对全等，加粗位置（831 的 `[[corn:corn]]`、`[[grain:grain]]`）一致。旁注"831 的 `ears` 不是目标词（本书没给它卡）"实测为真（`ear` 无卡、831 未标 ear）✓。两卡 `m`/`ex`/`exZh`/`note`（corn `note` 空串、grain 词伙 `pepper grains`）逐项对卡核过 ✓。

B 句号与共现：章2 偏移 651 + 段31 之前累计 180 句 = **831**，段31 共 6 句 → 831–836 ✓，与切片包 `sents=[831]`、"同句共现"一致。全库扫描：`[[corn:…]]` 全书仅 831（其余 corn 字面命中都是 `corner` 内的假命中）✓；`[[grain:…]]` 全书 831 + 1305 两处 ✓（1305 = 章4 段4 第 4 句，反算 883+422=1305 ✓）。1303/1304 的位置与译文（「漫长的饥荒蔓延山谷」／「寒夜剥夺了温暖饭食，瘦弱的孩子们只好挨饿」）逐字对 `sentZh` ✓。830 = 章2 段30 第 5 句 ✓。

C 可 grep：正面证据 **18 组**查到 —— `golden ears of corn`、`heavy grain sacks`、`into the yard`、`Uncle Wang carried golden ears of corn and heavy grain sacks into the yard`、`He ate popcorn made from corn.` + `made from corn` + `exZh`、`Farmers grow grain like wheat and rice.` + `like wheat and rice` + `exZh`、`pepper grains`（grain 卡 note）、`Farmers grow corn as a crop.` + `as a crop` + `exZh`、`Farmers hybridise corn to make it grow faster.` + `hybridise corn` + `exZh`、`thanking the autumn crop for lavish gifts`（830）、`Strong men came to seize grain and pursue sad farmers down lanes`（1305）、`long famine`（1303 + famine 卡词伙）、`pale wheat kernels`、`reap under the hot sun`（832）、`white flour`、`morning porridge`（833 + 两卡词伙）、`sticky rice paste`（834，词伙在 **paste 卡**）、`village livestock`（834 + livestock 卡词伙）、`He carried the apples in a burlap sack.` + `flour sack`。否定行 `cornfield`、`grain store`、`grain of truth` 实测 0 处 ✓。
- **两处"本书没有/只 1 处"实测为假（见 F 与判定）**：① 847（章2 段33 第 4 句）`Uncle Wang crushed the black pepper grains, slicing pale yellow ginger root thinly.` —— 课文里就有 `pepper grains`；② 1209（章3 段54 第 5 句）`He never used the flour sacks as chairs …` —— 课文里第二处 `sacks`，且那里 `[[sack:sacks]]` 是打了标记的。
- 背景句少列：草稿"同段还站着 `wheat`、`reap`、`flour`、`porridge`、`livestock` 五张别的卡"，实测段31 标记词头共 13 个（另有 paste、chicken、turkey、feast、beef、pork 六张有卡的）。不影响证据，属可选精确化。

D 宽度：默认行草稿 37.5 / 实测 **37.5**；总结句草稿 21.5 / 实测 **21.5**。`core`「一根一根的棒子」7 /「装袋的那一大堆」7 ≤12 ✓。标称无虚报。

E 义项照抄：`core`、默认行、总结句均未出现「谷物」「玉米」「颗粒」。表头「worklist 给共同义项"谷物"，可本书译文一个给「玉米棒」、一个给「粮」」= 引用义项 + 当场把话说轻，且「这一档在两卡 `m` 里一个排第一、一个排第二」实测为真（grain `m` 谷物居首、corn `m` 谷物居次）；「数据边界」另补"corn 的 4 条文本没有一处把 corn 当'谷物统称'用"，这条我逐句核过成立（831 + 三张卡 ex 里 corn 都是具体作物）。**OK**。

F 同源诚实：**这里出的问题最重**。草稿三处断言"颗粒档本书课文 0 处"并把卡词伙 `pepper grains` 标成"与课文不同源的独立一条"，但课文 847 就是 `the black pepper grains`（同一处文本）→ 按口径 8 这条词伙应与 847 合并点名，草稿反而把它算成"独立一条"并据此宣称"本书课文里这一档 0 处用过"。同理"本书课文里 `sacks` 只出现在 831"与 1209 冲突（`flour sacks` 还与 sack 卡词伙 `flour sack` 同源）。计数未被虚增（grain 4 条不含 847，独立文本数不因修正而变），所以判 MISMATCH 不判 BLOCK —— 但"一句话区别"列里那句"本书课文里这一档 0 处用过"是要渲染给用户的错信息，必须改。

判定：**需作者改（MISMATCH）—— 必须改的最小清单**
1. diff 表「卡上给不给现成块」grain 行末列：「本书课文里这一档 0 处用过」→ 改为「课文 847 `the black pepper grains` 就是这一档（译「胡椒粒」），但那里 `grain` 未打词条标记」。
2. 出处清单 `pepper grains` 行：「本书课文里 0 处这样用过，是与课文不同源的独立一条」→ 改为「与课文 847 同一处文本（`black pepper grains`），按 §五.8 同源合并，不另计」。
3. 「数据边界 · 不写的」里「grain 的『颗粒』档除卡上 `pepper grains` 外本书 0 处」→ 删掉或改成"课文仅 847 一处（未打标记）"。
4. diff 表「同句里它是什么形状」grain 行 + 出处清单 sack 那行：「本书课文里 `sacks` 只出现在 831」→ 补上 1209 `the flour sacks`（`[[sack:sacks]]` 有标记），并把"两处不同源"改成"831 与 1209 各一处、sack 卡词伙 `flour sack` 与 1209 同源"。

提请拍板 ③（我的判断）：**支持出卡，不必退回单语境**。他说"段内只有两堆东西一起扛进院子"这个判断我核下来是准的，但本组的卡外证据比他自己写的更厚 —— 847 那条被我捞回来之后，grain 侧"统称 vs 颗粒"两档在本书都各有一处课文用例，corn 侧 4 条互不同源，grain 卡 ex 的 `like wheat and rice` 确实是他唯一一条把 grain 当上位的句子。所以"具体一种 / 统称一类"这条区别线**站得住**，只是必须按上面 4 条把同源与计数改对。

---

# 3_06（批次 3 切片 06 / slice15，worklist_idx 77–81）

## 组 1 · tasty / yummy（3_06，worklist_idx 77）

A 原文表：**OK**。849–854 六行英文（去标记后）与 `sentZh` 逐字回章2 段34 比对全等，加粗位置（852 `[[yummy:yummy]]`、853 `[[tasty:tasty]]`）一致。两卡音标（ˈteɪsti / ˈjʌmi，`uk`=`us`=`p`）、`m`（两张都是「adj. 美味的；可口的」，草稿"两卡 `m` 完全一样、一字不差"✓）、tasty `note` 空串 ✓、yummy 词伙 `simply yummy` ✓、两卡 `ex`/`exZh` 逐字 ✓。

B 句号与共现：章2 偏移 651 + 段34 之前累计 198 句 = **849**，段34 共 6 句 → 852 = 段内第 3 句、853 = 第 4 句，与草稿出处清单标注的"第 3 句／第 4 句"和切片包 `sents=[852,853]` 全部对得上。全库扫描：tasty 全书标记仅 853、yummy 全书标记仅 852（两词在其余课文句里 0 次未标记出现）✓；"同段 852 还站着 delicious 这张别的卡"✓（同句 `[[delicious:delicious]]`）。

C 可 grep：正面证据 **11 条**全部查到 —— `The hot noodles were tasty`、`perfect for thirsty workers`、`perfect for thirsty workers after a long day`、`were tasty, perfect for…`、`the warm buns were simply yummy`、`called the stew delicious`、`simply yummy`（yummy 卡 note + 852）、`The soup is tasty and hot.` + `exZh`「这汤美味又热。」、`tasty and hot`、`The cake is yummy.` + `exZh`「这个蛋糕很好吃。」、`The cake tastes delicious.`（delicious 卡 ex）。否定行 2 条实测为真：`yummy mummy` 0、`tasty treat` 0；"两卡 `note` 均无语域标注（tasty 干脆是空串）"✓。计数复核：草稿"本书 tasty 的 2 处（课文 + 卡 ex）""yummy 的 2 处"与我逐句扫描结果一致 ✓。无藏在否定行里的正证据。

D 宽度：默认行草稿 38.0 / 实测 **38.0**；总结句草稿 23.0 / 实测 **23.0**。`core`「热汤面那一口」6 /「冲口夸的那一嗓子」8 ≤12 ✓。

E 义项照抄：`sense` 槽承担「美味的；可口的」；`core`、默认行、总结句、表头均未复述"美味/可口"（表头用的是译文里的「好吃」与"一嗓子"）✓。表头"本书给这两词各配了一类吃食"是**计数结论**，草稿在「数据边界」里主动标明"是本书 4 条文本的计数结论，不是语法禁令"，并写了"换一句课文就可能翻"——这正是口径 7 要求的诚实写法。**OK**。

F 同源诚实：`simply yummy`（卡词伙）与课文 852 同源，草稿在出处清单与「数据边界」两处都点名合并、明确"yummy 侧卡上词伙没有新增独立文本"，独立文本 4 条 = 852 + 853 + 两张卡 ex，与实算一致 ✓。没把"各 1 处书证"当退回理由，反而如实写"是批次里偏薄的一组" ✓。

判定：**可落地（OK）**。无需作者改。

本组不在作者提请拍板清单里，我的判断：**同意出卡**。区别线（热汤面 vs 馒头蛋糕 + `and hot` 并列 vs `simply` 加强）两侧各 2 条独立文本、方向一致、全部实测可 grep，是本文件里少数"两词都是 2 条"的组；标题那句"各配了一类吃食"也没有越成语法禁令。

---

## 组 2 · exterior / outward（3_06，worklist_idx 78）

A 原文表：**OK**。877–882 六行英文（去标记后）与 `sentZh` 逐字回章2 段39 比对全等，加粗位置（878 `[[outward:outward]]`、879 `[[exterior:exterior]]`）一致。两卡 `m` 逐字核过：exterior = 「n. 外表；adj. 外部的」（草稿"卡上 n. + adj."✓）、outward = 「adv. 向外；adj. 外表的」（草稿"本段是副词；卡上另给 adj. 档"✓）；音标 exterior /ɪkˈstɪriər/（`uk` ɪkˈstɪəriə）、outward /ˈaʊtwərd/（`uk` ˈaʊtwəd）✓；outward `note` 确为空串 ✓；exterior `note` = 「同义词：external, outside；词伙：impressive exterior design」✓。

B 句号与共现：章2 偏移 651 + 段39 之前累计 226 句 = **877**，段39 共 6 句 → 878 = 第 1 句、879 = 第 2 句 ✓，与切片包 `sents=[878,879]` 一致。全库扫描：exterior 全书标记仅 879、outward 全书标记仅 878，两词在其余课文句 0 次未标记出现 → 草稿"两词全书各 1 现"成立 ✓。"与组 3 同段、各写各的角"核过：本组用 878/879，组 3 用 877，不重叠 ✓。

C 可 grep：正面证据 **17 条**全部查到 —— `then ran outward toward the music`、`played outside the doorway`、`touching exterior rails`、`keeping external dust away from food`、`external dust`、`the inner rooms`、`the renewed interior`、`Warm light flowed inward`、`every internal corner`、`new lamps onto the roof at dawn`、`The exterior of the house is painted white.` + `exZh`、`The outward force pushed the door open.` + `the outward force` + `exZh`、`impressive exterior design`（exterior 卡 note，课文实测 0 处 → "本书课文没用过"这句为真 ✓）、`The external wall of the house is painted blue.`（external 卡 ex）、outside 卡 / external 卡 note 同义词栏回列 exterior（两卡实测均含 ✓，"三张卡互相指认"成立）。否定行 2 条实测为真：`exterior wall` 0、`outward calm` 0；"outward 卡 `m` 的「外表的」一档全书 0 例"核过 —— 全书 outward 仅 878（副词）+ 卡 ex（形容词"向外的力"），确无"外在表现"义 ✓；「外表」在 sections.json 全文 0 命中 ✓。
- 一处措辞不够准（不影响证据）：注里说 878 的 outside、879 的 external「与本组两词互列同义词」——实测两卡同义词栏列的是 **exterior / external / outside** 三者互指，与 outward 没有任何互列。出处清单那行写对了（只说 exterior），建议把注里"两词"改成"exterior"。

D 宽度：默认行草稿 34.0 / 实测 **34.0**；总结句草稿 25.5 / 实测 **25.5**。`core`「朝外那一面」5 /「往外的方向」5 ≤12 ✓。

E 义项照抄：这是口径 6/11 的正面样板。表头「都不是谁的外表」、总结句「都没说"外表"」、专设一段「先报一个口径问题」= 引用义项 + 当场否定，且实测为真（878 outward 译「跑了出去」、879 exterior 译「外侧的」）；「外表」在两卡 `m` 里都在但全书课文译文 0 次这样用 → 义项只留 `sense` 槽 ✓。`core`、默认行均未复述义项词。**OK**。

F 同源诚实：exterior 侧 3 条（879 + 卡 ex + 卡词伙）、outward 侧 2 条（878 + 卡 ex），草稿明写 `impressive exterior design` 是"卡上孤块（课文没用）"，未把它算成书证，也未据此宣称"多处方向一致"；"本组比'各 1 句'看起来厚一点的原因"归给段内对举（880/881 的 inner/interior/inward/internal），这几处我逐句核过确实存在 → 归因诚实，不是虚报厚度。**OK**。

判定：**可落地（OK）**。建议（非必须）：把注里"与本组两词互列同义词"改成"与 exterior 互列同义词"。

提请拍板（作者列的第 1 处）：**支持出卡，且我认为这组连"拍板"都不太需要**。他给的处置（标题当场否掉「外表」、义项留 `sense`、「本书没这样用过」明写）与批次 1A 组 2/组 5 的先例同形，我逐条验过全部为真；区别判据（一面 vs 一个方向）有段内 878 outside、879 external、880–881 inner/interior/inward/internal 五处对举背书，是这 10 组里"义项名不副实但替代判据最硬"的一组。落地时卡片起名若必须写共享义项，就照现标题的否定句走，不要改回"外表"。

---

## 组 3 · entrance / entry（3_06，worklist_idx 79）

A 原文表：**OK**。877–882 六行与数据逐字一致（与组 2 同表，两版都核过，无抄错/错位）；877 一句里 `[[entrance:entrance]]`、`[[entry:entry]]` 双标记确实同句 ✓。四张相关卡逐字段核过：entrance `m`「n. 入口」+ 词伙 `pay the entrance fees` + `ex`/`exZh`「这座建筑的入口在左边。」✓；entry `m`「n. 入口；条目；参赛作品」+ 词伙 `free entry` + `ex`/`exZh`「建筑物在晚上10点后进入通道会被锁上。」✓（草稿"卡 ex 也只译成'进入通道'半只脚"引述准确）；selective 卡词伙含 `selective entry test` ✓；salary 卡词伙含 `earn entry-level salaries` ✓。

B 句号与共现：877 = 章2 段39 第 0 句 ✓（偏移反算 651+226）。切片包 `sents=[877]`、"同句共现"成立。全库扫描：entrance 全书标记仅 877 ✓；entry 全书标记仅 877，另 456 有**未打标记**的 `selective entry test` —— 草稿明写"没打标记""本组把它算给 entry 当书证并点名标记情况" ✓。456 位置反算 = 章1 段19 第 1 句 ✓，`sentZh`「一门基础编程课对所有人开放，不设任何筛选式的入学测试。」与草稿引的「不设任何筛选式的入学测试」一致 ✓。

C 可 grep：正面证据 **14 条**全部查到 —— `Guests entered through the red entrance`、`entered through the red entrance`、`the red entrance`、`guided past the side entry`、`the side entry`、`The entrance to the building is on the left.` + `is on the left` + `exZh`、`The entry to the building is locked after 10 PM.` + `exZh`、`pay the entrance fees`、`free entry`、`no harsh selective entry test` + `selective entry test`（456 + selective 卡词伙，同源）、`earn entry-level salaries`。三条"卡上孤块、课文查不到"的声明实测全部为真：`pay the entrance fees` 课文 0、`free entry` 课文 0、`entry-level` 课文 0 ✓。"entry 的「条目」「参赛作品」两义本书 0 例"→ 「条目」「参赛作品」在 sections.json 全文 0 命中 ✓。表里那句"同一个 `the ___ to the building` 框，两卡自己都在用"实测成立（两卡 ex 各一条，`to the building` 在 vocab 命中 2）✓。

D 宽度：默认行草稿 35.5 / 实测 **35.5**；总结句草稿 23.5 / 实测 **23.5**。`core`「走进去的那扇门」7 /「那道门，也管准不准进」11 ≤12 ✓。

E 义项照抄：`core`、默认行、总结句均未出现「入口」。表头「worklist 说共同义项是"入口"，这句两个词都成立」= **宣称两词都指 X**，而该段实测真撞（877 `sentZh` 一处「正门」一处「侧门」，两卡 `m` 均含「入口」）→ 属 BRIEF 第 6 条留出的"名副其实"情形，不在拦截范围。区别落在"穿过它走进去 vs 被领着绕过"，是句法/叙事位置而非义项复述。**OK**。

F 同源诚实：`selective entry test`（selective 卡词伙）与课文 456 同源 —— 草稿点名"与该句同源，§五.8 合并计" ✓；`pay the entrance fees`、`free entry`、`earn entry-level salaries` 三条孤块各自标明"本书课文无此句，只作卡上现成块" ✓。分账 entrance 3 条 / entry 5 条与实算一致，"厚度全在'准入'那一档"这句我核过（456 准入 + free entry + entry-level + 卡 ex 的"locked"）成立 ✓。

判定：**可落地（OK）**。无需作者改。

补一句判断（作者未列本组为待拍板，我同意）：把未打标记的 456 算给 entry 当书证，不违反 §五.2 —— 那条拦的是"把没卡、没被标的简单词拉进成员表"，本组成员仍是切片给的两个词，且草稿在正文和复核索引两处都点明了标记情况。**建议保留 456**：它是本组唯一一条能把 entry 的"准入"档坐实的课文证据，剔掉之后 entry 侧就只剩一扇门。

---

## 组 4 · itinerary / route（3_06，worklist_idx 80）

A 原文表：**OK**。907–912 六行英文（去标记后）与 `sentZh` 逐字回章3 段4 比对全等，加粗位置（908 `[[route:route]]`、909 `[[itinerary:itinerary]]`）一致。两卡逐字段核过：itinerary `m`「n. 路线」、`exZh`「我们在旅行前规划了路线。」、`note` 空串、音标 /aɪˈtɪnəreri/（`uk` aɪˈtɪnərəri）✓；route `m`「n. 路线；途径」、`ex`/`exZh`、`note` 空串、/raʊt/（`uk` ruːt）✓。"两卡 `note` 都是空串"实测为真 ✓。

B 句号与共现：章3 偏移 883 + 段4 之前累计 24 句 = **907**，段4 共 6 句 → 908 = 第 1 句、909 = 第 2 句 ✓，与切片包 `sents=[908,909]` 及出处清单标注一致。全库扫描：itinerary 全书标记仅 909 ✓、route 全书标记仅 908 ✓。
- 一处口径要补字：「数据边界」里"route 卡 `m` 的另一档「途径」本书没有书证（全书就 908 一处）"—— 1352 `Old maritime maps show naval routes once used by worried sailors.`（译「海军航线」，标记打在 naval 上、`routes` 未标）是 route 一词在课文里的第二处字面。作者全篇用"全书标记 N 处"的口径且组 5 明确区分了标记/未标记，这里只是漏写"（按标记口径）"三个字，不计 MISMATCH。

C 可 grep：正面证据 **13 条**全部查到 —— `Half asleep on the ride home`、`I heard Father check our route twice`、`check our route twice`、`Father read our itinerary out loud in the shop`、`read our itinerary out loud`、`counting the trains we still had to take`、`We planned our itinerary before the trip.` + `planned our itinerary before the trip`、`We took a different route to avoid traffic.` + `took a different route to avoid traffic`、`atlas`（907）、`the mountain passage`（910）、`the busy intersection`（911）、`a narrow lane`（912）。否定行 3 条实测为真：`bus route` 0、`route map` 0、`daily itinerary` 0；两卡 `note` 空、无语域标注 → "不写「itinerary 比 route 正式/书面」"的依据成立 ✓。
- 唯一不精确处：「义项对齐说明」把段 4 `paraZh` 引成「中午到达边境，市集热闹，父亲带我下车走走」，实际字段末尾还有「，看看异乡风物。」（正文「这一段在讲什么」里引的是全的）→ 补全即可，属引用截断不是抄错。

D 宽度：默认行草稿 39.5 / 实测 **39.5**（贴 40 上限但未超，与复核索引"经 `audit_ledger.py` 复量 40.5 越线后已压到 39.5"自述一致）；总结句草稿 22.0 / 实测 **22.0**。`core`「排好的那张单」6 /「走的那条线」5 ≤12 ✓。

E 义项照抄：`core`、默认行、总结句均未出现「路线」。表头「这个被核了两遍，那个被念出声来数车次——一个是一条线，一张是手里的单子」用"线/单子"绕开义项词；「义项对齐说明」进一步写明"worklist 那个「路线」义项名只跟 908 对得上，对 909 得换成'单子'"，并实测为真（908 译「路线」、909 译「行程」）→ 口径 6 的轻量处置，**OK**。

F 同源诚实：两卡 `note` 全空 → 无词伙可双计；独立文本 4 条（908、909、两卡 ex）与实算一致 ✓。"双点同向"的说法我核过：itinerary 侧 909 句内 + 卡 ex planned = 2 处、route 侧 908 + 卡 ex took a different = 2 处，各 2 条**互不同源**的文本方向一致 → 这不是"把同一处文本当两条"，措辞成立 ✓。引用批次 2 组 4 先例（cosmos/universe）作为同口径处理，符合口径 7。

判定：**可落地（OK）**。两处非阻断修正：出处清单把段 4 `paraZh` 引用补全；「全书就 908 一处」补"（按标记口径）"。

提请拍板（作者列的第 2 处 / 复核索引里的"最薄"）：**支持出卡**。他担心的"每侧只有 2 条独立文本"实测属实，但这正是 98% 组的常态（口径 7），且本组的判据是"动词配对"而不是语义层编造：check/念 两处都在课文里、plan/take 两处都在卡上，四条全部可 grep。别按"两卡全空必须补词伙再上"处理 —— 那等于要求改 `shadow/data/vocab.json`，超出辨析卡的范围。

---

## 组 5 · lorry / truck（3_06，worklist_idx 81）

A 原文表：**OK**。919–924 六行英文（去标记后）与 `sentZh` 逐字回章3 段6 比对全等，加粗位置（921 `[[truck:truck]]`、922 `[[lorry:lorry]]`）一致。两卡逐字段核过：lorry `/ˈlɔːri/`（`uk` ˈlɒri）、`m`「卡车；载重汽车」、`ex`/`exZh`「卡车把箱子运到了仓库。」、词伙 `big lorry` ✓；truck `/trʌk/`、`m`「卡车」、`ex`/`exZh`「卡车把箱子运到了商店。」、词伙 `late truck, little truck` ✓。

B 句号与共现：章3 偏移 883 + 段6 之前累计 36 句 = **919** → 921 = 第 2 句、922 = 第 3 句 ✓（与出处清单标注一致），切片包 `sents=[921,922]` ✓。全库扫描 truck 带标记 **8 处**：921、933、934、994、1231、1245、1254、1356 —— 与草稿逐个对上 ✓；lorry 带标记仅 922 ✓；25（章0 段5 第 0 句 `from old trucks`）确为未打标记 ✓，草稿把它单列、不进 8 处计数，口径干净。

C 可 grep：正面证据 **20 条**全部查到 —— `A man at the small station jumped down from his truck`、`jumped down from his truck`、`helped Father lift our bags`、`One big lorry`、`could stop a whole city`、`used it to answer the host`、`big lorry`、`The lorry carried boxes to the warehouse.`、`The truck carried boxes to the store.`、`The truck waited at the market gate`（933）、`A flat tyre slowed the truck`（934）、`the little truck`、`moved slowly far behind our train`（994）、`one late truck`（1231）、`the late truck`（1245、1254）、`No military truck carries nuclear loads`（1356）、`late truck`、`little truck`（truck 卡词伙）、`from old trucks`（25）、`came by tram`（919）、`the white ambulance`（920）、`the quiet van behind the bakery`（923）、`An old wagon with two brown horses`（924）。否定行 4 条实测为真：`lorries` 0、`lorry driver` 0、`pickup truck` 0、`trucks` 课文仅 25 一处未标记 ✓；「truck 晚到那三句（1231、1245、1254）译文只称「车」」逐句核过为真 ✓（「一辆晚到的车」／「那辆晚到的车」／「这辆晚到的车」）。
- **计数错一处**：出处清单"truck 其余 **6** 处课文"，但它自己列出的就是 933、934、994、1231、1245、1254、1356 = **7** 句（8 处减 921）。正文别处（"全书标记 8 处"、"课文 8 句 + 卡 ex = 9 条"）都是对的，只有这一行标签算错。
- **一处措辞越了数据**：表头「一个在场内被人从**驾驶室**跳下来」—— 921 原文与译文都只给"从卡车上跳下来 / jumped down from his truck"，本书没有任何一处出现 cab/驾驶室。成员表 `scene` 那格写的是"小站跳下来帮抬行李"（合规），只有表头这一处加了数据里没有的部件。

D 宽度：默认行草稿 38.0 / 实测 **38.0**；总结句草稿 25.0 / 实测 **25.0**。`core`「书里唯一那辆大的」7 /「路上干活的那辆」6 ≤12 ✓。

E 义项照抄：`core`、默认行、总结句均未复述「卡车／载重汽车」（默认行用"大家伙""帮抬行李的"，总结句直接给计数）✓。表头不宣称"本段两词都指卡车"，改问"在不在场"，而该段 921 译「卡车」、922 译「大货车」，作者没把中文那一格当区别用 ✓。**OK**。

F 同源诚实：三条词伙（`big lorry`、`late truck`、`little truck`）全部与课文同源，草稿在正文与出处清单两处点名"按 §五.8 不另计新文本"，实算一致；独立文本 truck 9 / lorry 2 ✓。更难得的是它主动把卡 ex 那两条判为**"无区别"证据**（同句式对拍、只差 warehouse/store），没把它们算成支撑区别的书证 —— 这正是口径 7 反对的反方向。**未发现双计。**

判定：**需作者改（MISMATCH）—— 必须改的最小清单**
1. 出处清单"truck 其余 6 处课文" → **7 处**（或删掉数字，直接列句子）。
2. 表头「被人从驾驶室跳下来」→ 改成数据给的"从卡车上跳下来"（"驾驶室"本书 0 处；改后不影响任何宽度上限，表头不受 ≤40 约束）。

本组作者未列待拍板，我的判断：**改完这两条即可落地**，厚度悬殊（truck 9 / lorry 2）按口径 7 不构成退回；"922 的 lorry 不在场"那句提醒落地表头别写成"段里停着两辆车"，是这一批里少见的、对自己表头做反向纠偏的好写法，落地时务必照它执行。

---

# 汇总

| 组 | 文件 | 词 | 判定 |
|---|---|---|---|
| idx 72 | 3_05 组1 | cottage / hut | OK |
| idx 73 | 3_05 组2 | living room / parlour | MISMATCH（`sitting room` 虚报"本书没有"） |
| idx 74 | 3_05 组3 | complex / mall | OK |
| idx 75 | 3_05 组4 | refectory / restaurant | OK |
| idx 76 | 3_05 组5 | corn / grain | MISMATCH（`pepper grains`／`sacks` 两处"课文 0 处"虚报 + 同源判反） |
| idx 77 | 3_06 组1 | tasty / yummy | OK |
| idx 78 | 3_06 组2 | exterior / outward | OK |
| idx 79 | 3_06 组3 | entrance / entry | OK |
| idx 80 | 3_06 组4 | itinerary / route | OK |
| idx 81 | 3_06 组5 | lorry / truck | MISMATCH（truck 处数 6/7 算错 + 表头"驾驶室"无据） |

- 10 组全部逐字回 `sections.json` 复核「该段原文」表：A 项 **0 处不符**（含撇号 `tomorrow’s`、`bath tub` 分标、`night market booth` 分标这类易错点）。
- 全局句号 10 组全部用偏移 `[0,339,651,883,1277,1492]` 反算自证，与两份切片包 `sents` **全对**；成员在两处声称段内的 `[[词头:表面]]` 标记均实测存在。
- 宽度 20 个标称值（10 默认行 + 10 总结句）用 `tools/width_rule.py` 的 `width()` 逐个复算，**与草稿标称一字不差**，无一条超限、无一处虚报，也不存在把上限往 25 压的写法。
- 门禁 1 我实跑过两份文件：`OK 3_05.md` / `OK 3_06.md`，均 PASSED，与两份文件头小结一致。
- 最严重的一条：3_05 组 5 把卡词伙 `pepper grains` 判成"与课文不同源的独立一条、本书课文这一档 0 处"，而课文 847 `the black pepper grains` 就是这一档的用例（同一处文本）—— 三处断言连带一句要渲染给用户的"一句话区别"全错，且方向正好是口径 8 的同源合并。改法不伤卡片骨架（grain 侧反而更厚），所以判 MISMATCH 不判 BLOCK，但这是这 10 组里唯一一条会直接输出错信息的内容级错误。








