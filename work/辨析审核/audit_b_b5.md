# 门禁 2 审核 · 批次 5 / 5_03 + 5_04（worklist_idx 146–155，10 组）

组数 10 / BLOCK 0 / MISMATCH 3 / 通过 7

审核人：audit_b_b5（独立代理，非草稿作者）。只读 `shadow/data/vocab.json`、`shadow/data/sections.json`、
两份切片包 `work/compare_slices/slice30.json`/`slice31.json`、`work/compare_groups_worklist.json`（取 senses/all_synonyms 复核）
与本组两份草稿；为回答"载体撞车"的渲染问题另**只读**了 `tools/land_compare.py`、`shadow/index.html`、`scripts/validate_data.py`
的相关段落（未改、未跑 `land_compare.py`，含 `--dry-run`/`--check` 均未跑）。宽度一律用 `tools/width_rule.width` 复量。

自算底账（先钉口径，再逐组比）：章偏移实测 `[0,339,651,883,1277,1492]`、全书 1833 句；
章4 段31 起 1462、段33 起 1474；章5 段1 起 1498、段2 起 1504、段3 起 1510、段6 起 1528、段9 起 1546、段10 起 1552。

---

## 组 146 · individual / single

A 原文表：OK。6 行（1462–1467）英、中逐字符比对全等（我把整份文件的「该段原文」表用脚本按 `章/段/句` 回数据做过全等比对，本组 0 处差异）。
B 句号与共现：OK。章4 段31 基号 1462；1464=段内第 2 句（single 带标记 `[[single:single]]`）、1466=第 4 句（`[[individual:individual]]`）；
　切片 `sents=[1464,1466]`、`paras=[[4,31]]` 对得上；`paraZh[4][31]`「拄拐小波也提议，全街鼓掌目标一致。」逐字引、且 1462/1464/1467 三句真在讲它；`subheads[4][18]`='下篇·发明比赛' 实测对。
C 可 grep：本组 38 条英文串，31 条命中（课文 24 / 卡 7），7 条查无 —— 逐条看全在「不写的」与「本书没出现过」否定行
　（`a single person`、`single individual`、`individual effort`、`single parent`、`single-minded`、`in single figures`、`the individual vs the mass`），我自 grep 确认这 7 条 sec/voc 双 0 处 → 属合法否定行，无一条混进正面证据。
　正面证据侧我逐条定位到字段：`Each individual wrote notes`→课文 1466；`Each individual has the right to speak freely`→individual.ex；
　`a single shared aim`→1464；`a single ticket for the bus`→single.ex；`remain single`/三条 individuals 词伙→卡 note 词伙段；
　「`in need` 那 1 处命中是 `brain needs` 的假阳性」这句我复核为真：全库 `in need` 只 1 处 = 课文 1619 "A strong brain needs good sleep…"。
D 宽度：草稿 38.0 / 实测 38.0；总结句 草稿 14.0 / 实测 14.0 → OK（≤40、≤30）。
E 义项照抄：OK。表头引「单独」是当靶子当场否定（"本段两处都没站上去"），按口径 11 放行；core「一个一个的人」「就一个，不是两个」与默认行「每人／只一个」都没落回 m 的字面。
　另核它的分档报数：「单独」二字在本书课文译文里 0 处 —— 我 grep 全库 sentZh，确为 0，断言成立。
F 同源诚实：OK。卡 ex 与 1466 同开头不同句，草稿明写"是另一句话、各算一条"，没把 2 条并成 1 条、也没宣称两处方向一致；三条词伙明写"本书课文 0 处、只作卡上现成块"。

判定：**可落地**。口径 6 的处置（义项只留 `sense`、标题改写成"各领哪样东西"、补"本书没这样用过"）写全了，是本片最干净的一组。
拍板判断：作者把它列进"要拍板"，我的意见是**不必拍板、直接落**——共同义项不落地不是缺陷而是本书词表常态（口径 6 明写"不退回"），
而「Each + individual 做主语 / a + single 做定语」两侧各 2 条可 grep 文本，是本组真正交付给学生的硬货。

---

## 组 147 · committee / council

A 原文表：OK。1477/1478/1479 三行英中逐字等（含「集市委员会开了两次会，镇议会借出桌椅。」）。
B 句号与共现：OK。基号 1474；1478=段内第 4 句，`[[committee:committee]]` 与 `[[council:council]]` 都在这同一句里，与 `sents=[1478]`、`paras=[[4,33]]` 对得上。
C 可 grep：29 条串，22 命中、7 查无且全在否定行（`committees`、`councils`、`student council`、`board of directors`、`committee member`、`appoint a committee`、`local authority`）。
　"课文里并没有 committees、councils 这两种形式"我按词族 grep：committee 只有 1215/1478 两处、council 只 1478 一处，复数确 0 处 → 断言真。
　`the street committee`→课文 1215（我算出基号正是 1215、章3 段55 第 5 句，且该句 committee **未打标记**，与草稿分档一致）；
　`The committee meets every Monday`→committee.ex；`The city council`/`made a new rule about recycling`→council.ex；
　`authority, government, ministry, official`→council.note，并核 authority.note='同义词：council, government, ministry, official'（回列 council）逐字真；
　"government、ministry 在 vocab.json 里没有卡"我按词头精确查：均非词头 ✓。
D 宽度：35.0 / 实测 35.0；总结句 15.0 / 实测 15.0 → OK。
E 义项照抄：OK。「委员会」在表头当靶子被否（"本书译文给 council 的中文是「镇议会」"）；core「为一件事凑起来的那拨人」「镇里市里那层机构」避开 m 字面。
　我复核了"council 的 2 处中文没有一处写作「委员会」"：全库「委员会」在课文译文只 1 处=1478（committee 侧），「议会」2 处（1028 parliament、1478），
　「理事会」课文 0 处、只 council.m/council.exZh → 该断言成立。
F 同源诚实：OK。`fair committee`=1478、`town council`=1478 都点名同源不另计，独立文本 3 vs 2 与我的 grep 逐条吻合。

判定：**可落地**。"要拍板"那一处（义项半落地）同样不必拍板：council 两处中文另有落点是数据事实，草稿已按口径 6 处理并留下 fair/street vs town/city 这条硬分工。

---

## 组 148 · glance / glimpse　【载体撞车，见文末专题一】

A 原文表：OK。1498/1499/1500 三行英中逐字等。
B 句号与共现：OK。章5 段1 基号 1498；1498=第 0 句（glimpse 带标记）、1499=第 1 句（glance 带标记）、1500 只作背景（gaze/peer）；与 `sents=[1498,1499]` 对得上。
　草稿说"组 4 在 1502、1503 那两句"——**备注**：oath/vow 只在 1502，1503 是 pledge；导引句把组 4 的表格范围说成了成员范围，非落地字段，不扣。
C 可 grep：31 条串，25 命中、6 查无且全在否定行（`a glimpse of hope`、`at first glance`、`glance over`、`glance through`、`a fleeting glimpse`、`catch a glimpse of`）。
　`catch a glimpse of` 后面那句"本书卡上是 caught，没有这条原形词伙"我核为真（glimpse.ex 用的是 caught）✓。
　正面证据逐条定位：`takes a quick glance at`/`gets a quick glimpse of`→1499/1498；两条卡 ex→glance.ex/glimpse.ex；`a sharp glare`→1498 且 glare.note='词伙：sharp glare' ✓。
　"两卡 `note` 字段都不存在"✓（glance/glimpse 两卡都无 note 键，只有 cmp）。
D 宽度：37.0 / 实测 37.0；总结句 17.5 / 实测 17.5 → OK。
E 义项照抄：OK（core「自己抬头去看一眼」「撞见、瞥见」，默认行「抬眼看表／撞见公交」，都没用 m 的「一瞥／扫视」）。
F 同源诚实：OK，**但有一处事实不全**：草稿写"两卡上是同一份内容的两份拷贝"——实际带 look-verbs 拷贝的是**三张**卡（glance、glimpse、**peep**），
　而且 peep 那一份**多带 `at:[5,1]`**、glance/glimpse 两份没有 at（我逐字段 diff：唯一差异就是 at）。这一条不影响卡内容，但正是文末专题一"并存怎么落"的关键物证，须补进「数据边界」。

判定：**需作者改（MISMATCH，1 条最小清单）**
1. 表头一句（会原样写成 `cmp.title`）里「**中文也都是"看一眼"**」与数据不符：1498 译「很快**瞥见**了公交车」、只有 1499 译「飞快地**看了一眼**手表」；
　本组自己的「中文落点」行也写着"本书课文把两个词分开了（瞥见 / 看一眼）"——同一张卡里表头与表体自相矛盾。改成"中文都在说看一眼，可一个撞见、一个去看"一类即不伤数据。

拍板判断：作者请他定"替换还是并存"。我的结论见文末**专题一**：这张卡该留（它把旧表零书证的三格换成可 grep 的三格），
但"只留一张"会让 **peep 从此没有任何辨析表**（我把 220 组 worklist 扫过一遍：peep 不在任何一组，peer 另有 idx 219 contemplate/gaze/peer/stare 同挂 [5,1]）。

---

## 组 149 · oath / vow

A 原文表：OK。1501/1502/1503 三行英中逐字等。
B 句号与共现：OK。基号 1498；1502=段内第 4 句，oath、vow 两个标记都在这一句（`An [[oath:oath]] was taken and a solemn [[vow:vow]] made silently.`），与 `sents=[1502]` 对。
C 可 grep：32 条串，25 命中、7 查无且全在否定行（`oaths`、`vows`、`swear an oath`、`take a vow of silence`、`wedding vows`、`parliamentary oath`、`under oath`）。
　"本书 oaths、vows 两种复数写法都没有"✓（词族 grep：oath 1 处、vow 1 处 + vowed 2 处、vowel 1 处）；
　"课文 545 那个 vowel 不算 vow"✓（545='Each small phoneme matched a bright vowel on the white board.'，我按号回查正是这句）；
　`vowed` 两处=课文 119（章0 段20 第 5 句）、491（章1 段25 第 0 句），我按基号自算完全对上，且两处都**未打 `[[vow:…]]` 标记** ✓；
　`He took an oath to tell the truth`→oath.ex、`He made a vow to quit smoking`→vow.ex、`solemn vow`→vow.note 词伙段 ✓；`He made a pledge to help the poor`→pledge.ex ✓。
D 宽度：34.0 / 实测 34.0；总结句 16.5 / 实测 16.5 → OK。
E 义项照抄：OK。「誓言」这一档本段两处**真落地**（1502 译「立下誓言」「…誓约」），所以标题说"这一档两处都成立"不是空宣称；core「立出来的那句誓」「心里许下的那一约」是钩子不是照抄。
F 同源诚实：OK。`solemn vow` 点名与 1502 同源不另计；oath 侧 2 条 / vow 侧 4 条与 grep 一致；"vow 的动词档两处都没打标记"按口径 13 分档写清，没有把它说成"课文标过的用法"。
　总结句「oath 只是名词」我核过：这是 oath 卡 `m` 自己只给 n. + 本书 0 处动词形，且"只是名词"对 oath 在英语里也真（动词侧走 swear），
　且草稿在「数据边界」主动补了"那是卡上没给档、不是本书禁过"→ 不算把本书写法升级成语法禁令。

判定：**可落地**（本片最厚的一侧、oath 卡 note 空串也按 §三.8 明说了）。无需拍板。

---

## 组 150 · curse / swear　【与卡上旧表同段同句，见文末专题一/二】

A 原文表：OK。1507/1508/1509 三行英中逐字等。
B 句号与共现：OK。章5 段2 基号 1504；1509=段内第 5 句，curse、swear 同句都带标记，与 `sents=[1509]`、`paras=[[5,2]]` 对。
　旧表 `cmp.at=[5,2]`（我读 curse/swear 两卡 cmp，两份拷贝逐字段相等）→ 草稿"同段同句"成立。
C 可 grep：32 条串，24 命中、8 查无 —— 其中 7 条在否定行（`swears`、`curse words`、`a curse on sb`、`bless or curse`、`swear by`、`bad language`、`profanity`）；
　第 8 条 `He swore + 从句` 是"英文+中文语法词"的混合写法、不是书证串，其本体 `He swore he didn't steal the money.` 我核到 swear.ex ✓（建议作者把这条改成中文描述，免下游照抄）。
　"课文里 swore、swears 两种写法都没有"✓：swear 族在全库课文只 1509 一处，swore/swears/sworn 课文 0 处（swore 只存在于 swear.ex）。
　对旧表字段的逐字引（title、两格 core、三条 diff label、summary 里的「swear at sb = 骂某人」「swear to do = 发誓做」）我全部按 cmp 原文比过，**逐字一致**，没有一条是作者替旧表编的话。
D 宽度：35.0 / 实测 35.0；总结句 21.5 / 实测 21.5 → OK。
E 义项照抄：OK。「咒骂」在 1509 两处译文里真落地（「咒骂坏运气」「…骂骂咧咧」），标题"两处都成立"有译证；core 两格是画面钩子。
F 同源诚实：OK。`heavy traffic`=traffic.note 词伙、点名与 1509 同源不另计，并另引 traffic.ex 作旁证而不计入本组条数；两侧 2 vs 2 与 grep 一致。

判定：**需作者改（MISMATCH，1 条最小清单）**
1. 表头「差别全在**中间那三个字母**」：数错且不可解 —— 两半句的差是 `at`（2 个字母），curse/swear 两词本身也不是"中间三个字母"的关系。
　改成"差别全在动词后面那个 at"即可，字数还更省（本组表头不受宽度限，但落地是 `cmp.title`，学生第一眼看的就是它）。

拍板判断：见文末**专题二**——作者报的"旧表两条断言无书证"我独立复算，**两条都成立**（一条零书证、一条对象错），
而且我发现了比"要不要改旧表"更要紧的一件事：**这组落地器不会报冲突，会静默原地覆盖，并且只在 curse 一张卡上覆盖**（详见专题二）。

---

## 组 151 · applaud / clap

A 原文表：OK。1510–1515 六行英中逐字等（整段全引，没有挑句）。
B 句号与共现：OK。章5 段3 基号 1510；1512=第 2 句（clap 带标记）、1513=第 3 句（applaud 带标记），与 `sents=[1512,1513]` 对；`paraZh[5][3]` 逐字引且「养成习惯」半句由 1515 'keep a firm grip on daily habits' 真撑住 ✓。
C 可 grep：25 条串，21 命中、4 查无且全在「不写的」行（`give sb a big clap`、`clap in unison`、`applaud sb for sth`、`applause`）；
　"`applause` 本书没有卡、也没有课文用例"我两头都查了：vocab 词头无 applause ✓、全库 0 处 ✓ → 断言真。
　clap 两处未打标记我按号复算：544=章1 段33 第 5 句、1467=章4 段31 第 5 句，两句原文里都**没有** `[[clap:…]]` ✓；卡 ex 两条→applaud.ex/clap.ex ✓；`loudly applaud`→applaud.note ✓。
　"本书 3 处 clap 全是动词形、名词档 0 处"✓（clap 族全库只有 clap/clapped 三处，无 a clap/claps/clapping）。
D 宽度：36.5 / 实测 36.5；总结句 18.5 / 实测 18.5 → OK。
E 义项照抄：OK。共享义项「鼓掌」被换掉：core「为努力喝彩」「手拍出手声」，默认行「给努力喝彩／给发言拍手」；m 字面「鼓掌」只在 sense 槽。
F 同源诚实：OK。`loudly applaud` 点名与 1513 同源并 1 条；两卡 ex 同框架（The crowd + after the …）按口径 14 写成"各算一侧书证、不并条" ✓。

判定：**可落地**。两处**备注**（不改不阻断）：
①「clap 的 3 处里 2 处在课堂外——街区和**语言角**」，"语言角"三字来自 章1 段33 的 `paraZh`（章1 主题栏可用，非章3 段22–43 坏数据），
　但那 6 句英文说的是 word room/phonetics/syllable，按口径 12 的写法建议标一下出处；
②「本书译文…跟卡 `m` 的落点一致」——applaud 卡 m 是「鼓掌；称赞」、课文 1513 译「喝彩」，"一致"是靠 喝彩↔称赞 拐了一道，措辞可再软半格。
拍板判断：作者请他确认"clap 比 applaud 厚"这条不升级成禁令 —— 我看表体已经用「本书这几处」「在本库不成立」封顶（544 的 `clapped each new syllable` 被当成反例主动摆出来），**不必拍板**。

---

## 组 152 · manipulate / steer

A 原文表：OK。1528–1531 四行英中逐字等。
B 句号与共现：OK。章5 段6 基号 1528；1529=第 1 句（manipulate 带标记）、1530=第 2 句（steer 带标记）；`sents=[1529,1530]` 对；`paraZh` 两处支撑（1528 After lunch…to the courts、1532 play clean）我逐字回查为真。
C 可 grep：29 条串，26 命中、3 查无且全在「不写的」行（`manipulator`、`steer clear of`、`hand manipulation`）；
　三条词伙→manipulate.note，并核 gene.note='词伙：manipulate genes'、opinion.note 含 'manipulate public opinions' ✓（跨卡同串已按口径 8 各算 1 条）；
　steer.note='同义词：guide, direct, control'（**无词伙段**）✓ 逐字；direct.note='同义词：steer, manage' 回列 steer ✓；direct.m='adj. 直接的；v. 指导；指示' 与草稿括注逐字一致 ✓；
　"guide / control 本书没有卡"→按词头精确查：均非词头 ✓。
D 宽度：40.0 / 实测 40.0（**正好贴顶，不超**）；总结句 20.5 / 实测 20.5 → OK。注意这行已是满尺，下游任何加字都会撞 #16。
E 义项照抄：OK 且处理正确。「操纵」在 1529/1530 两处译文（操控/控制）确实都没直落 → 标题当场说"两处都没直译成「操纵」"，义项只留 sense 槽 ✓。
　我另外复核了"steer 侧「操纵」「掌舵」两档本书 0 处"：steer 全库只 1530 一处，且全库中文「舵/掌舵」0 处 ✓ 断言真。
F 同源诚实：OK。两侧各 2 条 + 词伙 3/0，与 grep 一致；"卡 ex 给了它一个 toward"明说是 1 处、并在「数据边界」写"样本 2 条、不是禁令" ✓。
　表头/表体没有"操纵只出现在 manipulate 卡"式的越界话（那句「只出现在 manipulate 卡的中文里」我核的是：课文译文「操纵」0 处、exZh 侧只有 manipulate.exZh 含「操纵」——限定在"译文"范围里说，成立）。

判定：**可落地**。「manipulate 贬义、steer 中性」被主动拒写（理由"本书唯一一处 manipulate 用在球课学控球的正面场景"），这个判断我认同，写得很稳。

---

## 组 153 · bet / gamble

A 原文表：OK。1531/1532/1533 三行英中逐字等（1532 中文带冒号那半句也逐字对）。
B 句号与共现：OK。基号 1528；1531=第 3 句（bet 带标记）、1532=第 4 句（gamble 带标记）；`sents=[1531,1532]` 对。
C 可 grep：19 条串，15 命中、4 查无且全在「不写的」行（`place a bet`、`you bet`、`gamble away`、`a risky gamble`）；
　"betting / gamboling 等变形书内 0 处"✓（全库 betting/gambling/gambol 0 处）；`bet money`→bet.note 词伙 ✓ 且点名与 1531 同源；
　gamble.note='' → 草稿"整个是空的、没有词伙段"✓；stake.m='n. 风险；股份；桩'、stake.ex 逐字 ✓（把 `put pride at stake` 从 bet 家摘出去这步做得对）。
D 宽度：34.0 / 实测 34.0；总结句 16.5 / 实测 16.5 → OK。
E 义项照抄：**触线（本组唯一必须改的）**。差异维度表里 gamble 的 `core` 写成「**押上去的冒险**」——「冒险」正是 gamble 卡 `m` 的字面档
　（bet 那格「押明价码的赌」同理复用了 m 的「打赌/赌注」字头）。按硬约束 4「m 里的中文词只能待在 sense 槽，core 一律换掉」这是照抄。
　默认行、表头都没这问题（默认行是「桌上的钱／押上安全」）。最小改法：core 改「押上去、输不起」或「押样输不起的东西」，8 字内、宽度不受影响。
F 同源诚实：OK。bet 2 条（词伙同源不另计）、gamble 2 条，与 grep 一致；"卡 ex 那一档 m 里没列"按卡上孤例报备，没升级成"本书不许"。

判定：**需作者改（MISMATCH，1 条最小清单）**：换掉 gamble 那格 core 里的「冒险」二字（顺带把 bet 那格的「赌」换成"价码"类具体词）。
拍板判断：作者把"bet 卡 ex 的『我敢说』档要不要留一格"列成拍板项 —— 我认为**不必拍板、照现表留**：
它是一条真实卡数据（bet.ex/exZh 逐字可查），并且是"bet 只能赌钱"的天然反例；只需按上面改掉 core 那格即可。

---

## 组 154 · allure / tempt

A 原文表：OK。1549/1550/1551 三行英中逐字等。
B 句号与共现：OK。章5 段9 基号 1546；1550=第 4 句（allure 带标记，句首 `[[victory:Victory]]` 我也按 RAW 逐字核到）、1551=第 5 句（tempt 带标记）；`sents=[1550,1551]` 对。
C 可 grep：27 条串，24 命中、3 查无且全在「不写的」行（`the allure of the city`、`tempt sb into doing sth`、`a tempting offer`）；
　"temptation 只在 resist 卡 ex、不是词头"两头核真（词头无 temptation；全 vocab 只有 resist 命中）✓；
　"tempted/tempting/temptation 在 sections 里 0 处"✓（tempt 族全库只 1551 一处）；"allurement 0 处"✓；"into 0 处（本书只有 toward／to do）"✓；
　`strong allure`→allure.note、`tempt players`→tempt.note，两条都点名与课文同源 ✓。
D 宽度：36.5 / 实测 36.5；总结句 21.5 / 实测 21.5 → OK。
E 义项照抄：OK。「诱惑」在本段两侧都真落地（1550 译「很有诱惑」、1551 译「引诱」），标题按词性分流而不是宣称"两词都指诱惑"，core 两格也没有复述 m。
F 同源诚实：OK。两侧各 2 条 + 词伙全同源，草稿明写"词伙全与课文同源"，没有把它数成两条独立证据。
　口径 3 的用法也对：`all_synonyms: true/false` 与"两词性能不能换"是两件事，本组 false 有据（allure.note/tempt.note 都只有词伙段、谁也没列对方）。

判定：**可落地**。本片最干净的一格区别（n. vs v.），两侧格子全可 grep，无需拍板。

---

## 组 155 · assign / distribute

A 原文表：OK。1552/1553/1554 三行英中逐字等。
B 句号与共现：OK。章5 段10 基号 1552；1552=第 0 句（assign 带标记）、1553=第 1 句（distribute 带标记，注意 RAW 是 `[[worksheet:worksheets]]`，词头单数挂复数表面，与草稿把 distribute 标成 `[[distribute:distribute]]` 无关）；`sents=[1552,1553]` 对。
C 可 grep：29 条串，25 命中、4 查无且全在「不写的」行（`assign sb to do sth`、`distribute sth among us`、`distribution list`、`assign a seat`）；
　"among 框架本书 0 处"、"allocate/appoint/spread 没有卡"（按词头精查 ✓ 三者皆非词头）、"assignment 有独立卡"（m='n. 作业；任务'、ex、词伙 complete assignments 逐字 ✓）、
　"distribution 只在 channel 卡词伙"✓（sections 里 0 处；全 vocab 只有 channel.note 命中）——四条存在性断言我逐条自 grep，全真。
　`distribute clean worksheet`（单数）→distribute.note ✓，且 worksheet.ex **整句照抄 1553** 这一点草稿主动标出并按口径 8 只算 1 条 ✓。
D 宽度：39.0 / 实测 39.0；总结句 19.0 / 实测 19.0 → OK。
E 义项照抄：OK。「分配」在本段两处都成立（布置夜读页数／分发练习纸），core「动嘴把任务派出去」「动手把东西递到手」是钩子。
F 同源诚实：OK。`assign pages` 与 1552 同源、distribute 词伙 + worksheet 卡 ex 全与 1553 同源，三处都点名；两卡 ex 同框架按口径 14 各算一侧 ✓。

判定：**可落地**（本片唯一的 `all_synonyms: true`，互列物证我逐字核到 assign.note/distribute.note）。
一条**建议**（不扣级）：介词行「本库 assign 挂 for、distribute 挂 to —— 两词各一种」事实无误（for 只 1552 一处、to 只 card ex 一处，
另外两条文本各自不带介词），但这组的「数据边界」没像其他组那样补一句"各只 1 处、是计数结论"，落地后读者可能读成框架禁令。

---

# 专题一 · 5_03 组 3（glance / glimpse）与卡上"看"类四词旧表：内容重复度 / 留哪张 / 并存怎么渲染

**先纠一件作者没写全的事实**：带 look-verbs 那份 `cmp` 的是**三张**卡（glance、glimpse、peep），不是两张。
glance.cmp 与 glimpse.cmp 逐字段相等（**无 `at`**）；peep.cmp 与它们唯一的差别就是**多了 `at:[5,1]`**。
所以旧表现在**确实就钉在章5 段1 末**（我按 `shadow/index.html` 的 `cmpIndex()` 逻辑跑了一遍：peep 走 at 命中 [5,1]；glance/glimpse 两份无 at，
退回"第一个 ≥2 个成员被标出的段"，而全书第一个满足的段也正是 章5 段1——1498–1500 连着标了 glimpse/glance/peep/peer 四个词）。
草稿"本卡与那份表同挂段 1 末"这句**独立复算成立**。

### ① 内容重复到什么程度

旧表 glance/glimpse 侧一共只给了 6 个格子：两格 `core`（主动、快速地看一眼 / 被动、偶然、不完整的一瞥）、两格 `scene`（抬眼看表 / 人群中看到一个背影）、
`diff` 的「方式」「关键特征」两行各 2 格，外加 summary 前半句"glance 是主动快看，glimpse 是被动瞥见"。**items 里没有 `eg` 字段——旧表一格出处都没有。**

- **被新表按同一意思重讲的（4 格 + 半句）**：旧 `core` 两格 ↔ 新「谁先动手」两行（人主动去看 / 没看清却看见了）；旧 `diff.方式` 两格 ↔ 同一轴；
  旧 summary 前半 ↔ 新总结句「glance 是你去看，glimpse 是它出现」。方向完全一致，新表没有推翻旧表任何东西。
- **唯一一处字面照抄**：新默认行「glance = **抬眼看表**（a quick glance）」——"抬眼看表"四字与旧表 `items.glance.scene` **逐字相同**。
  区别是它这次有书证（1499 takes a quick glance at his watch），旧表那一格是凭手感写的。
- **新表有、旧表没有的（且全部可 grep）**：a) 动词—介词框架 take…**at** ↔ get/catch…**of**（1499/1498 + 两卡 ex，4 条齐）；
  b) 宾语会不会跑（表·钟 ↔ 公交·猫）；c) 词性纪律：两卡 `m` 都只有 n.，而旧表把 `pos` 写成 v./n.（新表把这格当成"卡与卡打架"的物证写了出来）；
  d) glimpse 的 `m` 只写「一瞥」、不写「瞥见」，"瞥见"那层是靠 of 后面挂会动的东西给的；e) 两卡 `exZh` 反而把两词并成同一个「瞥了一眼」→ 明令"卡上中文不许当区分依据"。
- **旧表有、新表没有的**：peep、peer 两个成员（含 peer 的"同辈"名词义 + `peer pressure`，后者在 peer.note 里有词伙、可算有卡证据）、glimpse 的「短暂、不完整」一格。
- **旧表里查无书证的**：`items.glimpse.scene`「人群中看到一个背影」（全库 0 处）、两词的 `pos: v./n.`（课文两处都是名词、卡 `m` 只给 n.）、`sense`「瞥见」与 glimpse 卡 `m` 打架。

一句话：**旧表 glance/glimpse 那 6 个格子，新表在语义上全覆盖了；新表多出的不重复部分是"框架 + 出处 + 卡片自相矛盾的证据"，而旧表多出的部分是新表成员之外的 peep/peer。**

### ② 只能留一张的话，留哪张

**留新表，旧表不许原样并存**，理由三条：旧表这 6 格零出处、其中 3 格（pos v./n.、sense 瞥见、scene 人群背影）与两卡 `m` 和课文直接打架；
新表的三条硬格（take…at / get…of、宾语会不会跑、卡 exZh 把两词并成同一个中文）每一条都能 grep；而且学生真正会用错的是介词，不是"主动/被动"这种换话说法。
**但代价要点名**：全书 220 组辨析里 **peep 不在任何一组**（我扫过 worklist：只 look-verbs 旧表含它），peer 另有 idx 219（contemplate/gaze/peer/stare，同挂 [5,1]）。
所以"只留一张"= 1499 那半句 "has a peep down the long road" 从此没有辨析表。若他在意，最小代价不是留旧表，而是把 look-verbs 改造成
**peep/peer（或 glance/glimpse/peep/peer 四词但每格补出处）** 那一张，让它继续挂 [5,1]——这是数据改动，等他点头，不在我权限内。

### ③ 若允许并存（一词多表），渲染上要注意什么

- **"一词一表"目前是结构性约束，不只是规矩**：`vocab[w].cmp` 是单个对象；`land_compare.py` 的载体分配里 `taken` = 成员中 `cmp.group != 本组 slug` 的那些，
  glance/glimpse 的 `cmp.group`='look-verbs' ≠ 新 slug 'glance-glimpse' → 两个成员都算"已被占用" → 正是他看到的"冲突 1 组"。
- **不改代码的并存配方（推荐给他选）**：旧表在 **peep 卡上还有一份带 `at:[5,1]` 的完整拷贝**——只要删掉 glance、glimpse 两份拷贝、保留 peep 那份，
  新表就能落到 glance 或 glimpse 上：每个词仍只带 1 张 `cmp`，`cmpIndex()` 按 `group` 去重（look-verbs vs glance-glimpse 两个名字），两张表都渲染、都在段1 末。
  注意**要把新表同时写到 glance 与 glimpse 两张卡**（group 同名会被去重，段末仍只一张），否则会出现下面"答错摊表"的缺口。
- **段1 末会从 1 张变 2 张（加上组 4 是 3 张）**：头一行词表分别显示 `glance · glimpse` 与 `glance · glimpse · peep · peer`，学生一眼分不清谁是谁；
  默认行也不同形——新表走「简单记」那半句，旧表 summary **没有「简单记：」**，`compareLine()` 会退回整条 `note.title`
  （"这一段几个词都和"看"有关，但"看"法不同："），这正是 `validate_data.py` #16 现在给它报 warning 的那件事。**并存就要顺手给旧表补「简单记：」，否则段末一行长一行短、还夹一个冒号结尾的标题。**
- **排序键会打平**：`cmpIndex()` 末尾按 `at`（该段里第一个新标记的句序）排同段多张，旧表、新组 3、组 4 的 at 分别是 0、0、4 ——
  组 3 新旧两张**同为 0，谁前谁后取决于 vocab.json 的键序**（实测 glimpse 1636 < glance 1637 < peep 1638 < oath 1640），等于由 JSON 顺序决定教学顺序。要固定，得给新表也写 at 并让组内顺序可指。
- **做题"答错摊表"这条路径是逐词读 `card.cmp`**（index.html:4635 `renderCompareNote(card.cmp, true)`）：段末合并显示，但摊表各词各摊各的。
  所以并存方案里若 glance/glimpse 只剩一张带新表，另一个词答错时就**摊不出表**（旧表已不在它身上）——这是并存最容易被漏掉的一处，必须两张卡都写。
- 另外提醒一句：`validate_data.py` #16(b) 会拦"表头用『这一句』指代"。本片 10 张卡的 title 我逐条按那条正则扫过（「这一句/这句」），**全部不触**；
  旧 look-verbs 表的 title 是"这一段…"、旧 curse-swear 表是"同句里…"，也都躲过 #16(b)。

---

# 专题二 · 组 150 报的旧表两条断言（swear at sb / swear to do）——独立复核结论

我自己 grep 了三处：全库课文 1833 句（去标记后的表面形式）、`vocab.json` 全部词头的 `m/ex/exZh/note`、以及 `cmp` 内容单列。

1. **「swear at sb = 骂某人」→ 框架有书证，对象类型没有。**
   `swear at` 在全库只 1 处 = 课文 1509 "…will not **swear at** the heavy traffic"，`at` 后面是**物**（traffic）。
   没有任何一处 `swear at + 人`；两卡 `ex` 也都不带 at。旧表自己的 `diff.对象` 写"swear 多针对人或具体事物"——"具体事物"被 1509 撑住，"人"0 处。
   → 这条属**半错**：作为"简单记"的等式（swear at **sb**）在本书 0 书证。
2. **「swear to do = 发誓做」→ 零书证。**
   `swear to` 整串：课文 0 处（swear 全书只 1509 一处且接 at）、两卡 `ex/exZh/note` 0 处（swear.ex 走的是 "He swore + 从句"）。
   我在整个 `vocab.json` 里搜 `swear|swore|sworn`，命中只有三处：swear.ex、curse.cmp、swear.cmp ——
   也就是说 **`swear to do` 这句话的唯一出处就是那份旧表自己**（自证循环）。旧表 `diff.其他含义` 那句"发誓、宣誓（swear to）"同属零书证。
   → 作者这两条报告**我全部复算为真**，不是虚报。

**但我发现一件更该拍的事（本片最严重一条）**：`land_compare.py` 的新卡 slug = 成员按草稿标题顺序连字符拼接 → 组 150 得到 **`curse-swear`，与线上旧 `cmp.group` 一模一样**。
`taken` 判定因此认为"这就是同一张表"，所以：
- 这组**不会**进"冲突"名单（他看到的"冲突 1 组"只有 glance/glimpse，正是这个原因）；
- 落地时会**原地静默覆盖**旧表 —— 而那两条无书证断言就从此从线上消失，这个决定不是用户做的，是 slug 撞名撞出来的；
- 更糟的是覆盖只写 `vocab[g['carrier']]['cmp']`（carrier 取成员里第一个未被占用者 = **curse**），**swear 卡上那份旧拷贝不会被清**：
  段2 末因为按 group 去重、且 curse 在 JSON 里先于 swear（1657 < 1658）→ 显示新表；
  但做题答错 swear 时走 `card.cmp` 直读 swear 自己那张 → **摊开的还是旧表，学生照样背「swear at sb = 骂某人；swear to do = 发誓做」**。
  同名两张表会同时留在生产数据里，`validate_data` #16 也查不出（它的英文串只查 `eg`/`collocation`，这两条写在 `diff`/`summary` 里，正是机检的盲区）。

→ 给用户的两难，我建议这么解：**(a) 先手动删/改 curse、swear 两卡上的旧 cmp（撤两条无书证断言），再落新表**；
或 **(b) 若希望冲突检测把这组也报出来**，把组 150 的标题成员顺序改成 `swear / curse`（slug 变 `swear-curse` ≠ 旧 group），它就会和组 148 一起进"冲突"名单——但这是绕过检测，不如 (a) 干净。

---

## 汇总

| 组 | worklist_idx | 结论级 | 必须改的最小清单 |
|---|---|---|---|
| 5_03 组1 | 146 | OK 可落地 | — |
| 5_03 组2 | 147 | OK 可落地 | — |
| 5_03 组3 | 148 | MISMATCH | 表头「中文也都是"看一眼"」改成与 1498 译「瞥见」一致；「数据边界」补一句"peep 卡也带一份、且那份额外带 at:[5,1]" |
| 5_03 组4 | 149 | OK 可落地 | — |
| 5_03 组5 | 150 | MISMATCH | 表头「中间那三个字母」→「动词后面那个 at」；出处行 `He swore + 从句` 改中文描述 |
| 5_04 组1 | 151 | OK 可落地 | （建议）544 的「语言角」标明取自段主题栏 |
| 5_04 组2 | 152 | OK 可落地 | （注意）默认行实测 40.0 = 贴顶，下游不可再加字 |
| 5_04 组3 | 153 | MISMATCH | gamble 那格 `core`「押上去的冒险」复述卡 `m` 的「冒险」→ 换词（bet 那格同批处理） |
| 5_04 组4 | 154 | OK 可落地 | — |
| 5_04 组5 | 155 | OK 可落地 | （建议）介词行补一句"for/to 各只 1 处、是计数结论" |

- A 项（原文表逐字符回数据）：10/10 全等，含每行中文译句 —— 我用脚本把两份文件里所有 `| 句号 | 英 | 中 |` 行按 `sections.json` 全等比对，0 处差异。
- B 项（全局句号）：10/10 自算与切片 `sents` 一致；成员标记全部实测在声称段里。
- C 项：10 组分组去重后合计 291 条英文串，命中 238 条；53 条"查无"**逐条**确认全部落在「不写的／本书没有」否定行，无一条混进表体、`eg`、出处清单；
　作者所有「本书 0 处／没有卡／未打标记」式存在性断言我逐条自 grep，**没有一条虚报**（含 `committees`、`oaths`、`vows`、`swears`、`applause`、
　`temptation`、`betting/gambling`、`distribution`、`allocate/appoint/spread/guide/control/government/ministry`、`单独`/`操纵`/`掌舵` 的中文 0 处等 19 条）。
- D 项：20 条标称宽度（默认行 10 + 总结句 10）与 `width_rule.width` 实测**逐条相等**，无一条 >1.0 偏差，无一条超限。
- E 项：1 处触线（组 153 的 core 复述本卡 m）；其余把义项当靶子当场否定的写法（组 146/147/152）都符合口径 11 的豁免。
- F 项：10 组的同源合并全部诚实（`fair committee`/`town council`/`sharp glare`/`solemn vow`/`heavy traffic`/`loudly applaud`/`bet money`/
　`strong allure`/`tempt players`/`assign pages`/`distribute clean worksheet` + worksheet 卡 ex 逐条点名"与课文同源、不另计"），无一组把同源算成两条独立书证。
