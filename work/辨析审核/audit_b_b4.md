# 门禁 2 审核 · 批次 4 切片 21+22（worklist_idx 104–113 / 10 组）

审核代理：audit_b_b4（独立审核，非作者）
范围：`work/辨析草稿/4_03.md`（组 104–108）、`work/辨析草稿/4_04.md`（组 109–113）
只读输入：`shadow/data/sections.json`、`shadow/data/vocab.json`、两份草稿。尺：`tools/width_rule.py` 的 `width()`。
门禁 1 复核：两份草稿我都亲手跑过 `python3 tools/check_compare_draft.py`，**均 PASSED（0 条查不到）**，与作者自报一致。

**组数 10 / BLOCK 1 / MISMATCH 4 / 通过 5**

- BLOCK：组 109（4_04 组1）—— 「该段原文」表 1217 行 `regulation`，数据是 `[[regulation:regulations]]`。
- MISMATCH：组 104（两处一行内的小账）、组 107（把 11 张卡里就在用的 `manager` 报成"本书查无"）、
  组 108（虚报"本书没第二处提过 opportunity"）、组 111（把有卡有课文标记的 `compulsory` 报成"本书 0 处"）。
- 10 组的 20 个宽度标称值（默认行 10 条 + 总结句 10 条）**我用尺逐条复量，全部一字不差**，无一条超上限；
  10 组的「该段原文」表共 46 行英文/中文逐字回数据，**除上述 1 行外全部逐字相符**（含撇号、逗号、大小写）。
- §五.13 两档计数：10 个成员词我全部自己扫过 `sections.json`（标记 = `[[词头:…]]` 里 head 命中；未标 = 把标记整段挖成占位符后按词形匹配），
  **10 组词草稿报的"标 N 处 / 未标 M 处"全对**，含 clerk 的 1 处未标（1368）与 whisper 的 2 处未标（129、944）。

---

## 组 104 · cargo / goods（4_03 组1）
A 原文表：OK —— 6 行（1174–1179）英文与 `paragraphs[49]` 去标记后逐字相符，中文与 `sentZh[49]` 逐字相符。
B 句号与共现：OK —— 自算章3 偏移 883 + 前 49 段句数 = 1174，段49 六句 1174–1179；1176 = 段内第 2 句、1177 = 第 3 句，与草稿一致。
  成员标记核实：`[[goods:goods]]` 在 1176、`[[cargo:cargo]]` 在 1177，全书各仅这 1 处（未打标记 0 处）✓。
C 可 grep：OK —— 本组我逐条查到：课文 1175/1176/1177/1178/1179、卡 cargo.ex/goods.ex、goods 词伙 3 条、
  `packaged goods`(package.note)、`luxury goods`(luxury.note)、`The transit of goods takes three days.`(transit.ex)、
  `commodity, goods`(product.note)、freight 卡 m + 课文 905、merchandise 卡 m + 课文 651、product 卡 m。
  否定行 2 条（`cargo ship`、`deliver goods`）确认本书 0 处，放行。
  附带查实：`goods` 本卡以外被 4 张卡提到（luxury/package/transit/product）、`cargo` 0 张 —— 与草稿"4 张/没有第二张卡"完全一致。
D 宽度：草稿 39.0 / 实测 39.0；总结句 草稿 18.0 / 实测 18.0 → OK（均在上限内，上限未抬）。
E 义项照抄：OK —— 义项「货物」「商品」未进 core、默认行、总结句；表头写的是"两批货…岔口在'到手没有'，不在'是什么货'"，
  属把义项当靶子并当场否定（§五.11 豁免形状），且不是"复述义项当区别"。
F 同源诚实：**2 处 MISMATCH（都是一行内可改）**
  ① 词伙双计：`luxury goods` 已计入"词伙 3 条"，"别的卡 3 条（luxury / package / transit）"里又算了一次 ——
     而草稿自己在出处清单已写"跨卡同串，按口径 8 算 1 条"。goods 侧总数应减 1。
  ② §五.12 支撑断言过头：出处清单写「本段 6 句里 1176 进货、1179 签约旁听，主题栏说的事句子都撑得住」——
     我把段49 六句逐句查过，**没有任何一句写"签约"**（1179 是 `Long negotiations followed…`，商谈不是签约；
     `sign`/`contract` 在本段 0 处）。另 paraZh 写「侄子」而 1179 译文是「教子」（godson），草稿正文用的是"教子"没错。
     改成"主题栏只'进货/旁听'两项撑得住，'签约'段内无对应句"即可。
  另：cargo 侧 2 条、`winter cargo` 与 1177 同源不另计 —— 如实，未发现把同源当两条独立证据；"路上 vs 店里"明写为 1 处 vs 1 处，未升级成禁令 ✓。
判定：需作者改（两处一行内的小账，不阻断送落地；都是「证据强度/出处清单」的账，表体与默认行都不动）。

## 组 105 · deal / transaction（4_03 组2）
A 原文表：OK —— 6 行（1180–1185）逐字相符。
B 句号与共现：OK —— 段50 起 1180，1182/1183 = 第 2/3 句 ✓；`[[deal:deal]]`@1182、`[[transaction:transaction]]`@1183。
  deal 全书标 3 处 = 1021/1182/1766、未标 0；transaction 标 1 处 = 1183、未标 0 —— 与草稿完全一致。
  旁证定位也复核了：1021 = 章3 段23 第 0 句、1766 = 章5 段45 第 4 句 ✓（段23 正在主题栏坏区间内，草稿只引原句与 sentZh、未引该段主题栏 ✓ 处置正确）。
C 可 grep：OK —— 逐条查到：`shook hands on the final deal`(1182)、`made a low bid`(1182)、`low bid`(bid.note 词伙，同源 ✓)、
  `Every transaction was written down`(1183)、`regular turnover`(turnover.note，与 1183 同源 ✓)、`every transaction`(transaction.note ✓)、
  `a bilateral deal`(1021)+`bilateral deal`(bilateral.note ✓)、`not a big deal`/`a small nuisance`(1766 ✓)、
  `He can deal with difficult problems easily.`(deal.ex) 与 `He can handle difficult problems easily.`(handle.ex) 只差动词 ✓、
  handle/dispose 同义词栏的 `deal with` ✓、deal↔transaction 互列 ✓（→ `all_synonyms: true` 有据）。
  "deal 另外被 4 张卡的 note 提到" 我扫出恰好 4 张（handle/bilateral/transaction/dispose）✓。business/bargain 确无卡 ✓。
D 宽度：草稿 38.5 / 实测 38.5；总结句 草稿 22.5 / 实测 22.5 → OK。
E 义项照抄：OK —— core「握手定下来的那一单」「要写下来的那一笔」，默认行无「交易」；表头用"管成交/管上账"，且点明本书译文没用「交易」二字 ✓。
F 同源诚实：OK —— 四条同源（`every transaction`/`low bid`/`regular turnover`/`bilateral deal`）全部点名不另计 ✓；
  合并后 deal 5 条 / transaction 2 条 我复算一致；"方向是一致的"用的是课文 1183 + 卡 ex（两处独立文本），不是同源硬凑 ✓。
判定：可落地。对作者提请拍板那格的判断：**照表落地**。deal 卡 `ex` 落在第二档（处理）不是缺陷，
  反而是这组最能教人的信息（handle 卡 ex 是同一句只换动词，本书自己就给了"deal≠只有交易"的物证）；
  共现段 1182/1183 同单生意一前一后已是书里最强的分工证据，不需要卡上例句补位。

## 组 106 · clerk / personnel（4_03 组3）
A 原文表：OK —— 6 行（1198–1203）逐字相符。
B 句号与共现：OK —— 段53 起 1198，1203 = 第 5 句 ✓；`[[personnel:personnel]]` 与 `[[clerk:clerk]]` 同句 1203 ✓。
  clerk 标 2（1203、1387）+ 未标 1（1368 `Sleepy clerks…`，该句 heads 只有 `[[quarrel:quarrels]]` 一类、clerks 确无标记 ✓）；
  personnel 标 1（1203）+ 未标 0 ✓。1368 = 章4 段15 第 0 句、1387 = 章4 段18 第 3 句、1194 = 章3 段52 第 2 句 ✓ 全部核对。
C 可 grep：OK —— `young clerk`/`shop personnel`（两卡词伙，均与 1203 同源 ✓）、`A clerk explained patents`…(1387 ✓)、
  `The clerk at the store helped me find the book.`(clerk.ex ✓)、`The company hired new personnel last month.`(personnel.ex ✓)、
  `workforce of three helpers`(1202 ✓) + workforce 卡 m/同义词栏逐字对上 ✓、`honest occupation`(occupation.note ✓)、
  `true vocation`(vocation.note ✓)、1194 的 staff 确"未挂标记、也无卡"✓。
  否定行 5 条（`personnel department`、`human resources`、`shop assistant`、`head clerk`、`staff canteen`）确认本书 0 处 ✓。
  "personnel 和 cargo 是这片 10 词里仅有的两个'课文 1 处 + 别的卡 0 次'" —— 我按 10 词逐个扫了本卡以外的提及，
  结论成立：transaction 有 deal 卡列、manage 有 handle/direct/multiple、regulate 有 advertise、chance 有 opportunity/potential、
  opportunity 有 chance（外加 seize，见组 108）、goods 有 4 张、clerk/deal 有若干 → 只剩 cargo、personnel 两项 ✓。
D 宽度：草稿 39.5 / 实测 39.5（本片最贴线的一条，仍未超）；总结句 草稿 21.0 / 实测 21.0 → OK。
E 义项照抄：OK —— 表头「共同义项『职员』在这一句里两侧都没以"职员"露面」是引用 + 当场否定（§五.11 豁免），
  core 与默认行只用"那群里的一位/一共那群人"✓。
F 同源诚实：OK —— 两条词伙与 1203 同源均点名；clerk 4 条 / personnel 2 条复算一致；
  "全体 vs 一位"明写为"一个句子的两半"、并声明 1387/1368 只能证明 clerk 单用 ✓ 没有越界。
判定：可落地。对拍板点的判断：**不必退回，按现写法落地**。义项「职员」在 clerk 侧有 1387、1368 两处译文落地，
  personnel 侧本书从未这样译 —— 草稿已经把这句话写进「证据强度」，正是 §五.6 要的动作。

## 组 107 · manage / regulate（4_03 组4）
A 原文表：OK —— 6 行（1210–1215）逐字相符。
B 句号与共现：OK —— 段55 起 1210，1214 = 第 4 句 ✓；`[[manage:manage]]` 与 `[[regulate:regulate]]` 同句 ✓。
  两词各"标 1 处 + 未标 0 处"✓（manage 词形 manages/managed/managing 全书也无裸用）。1217 = 章3 段56 第 1 句 ✓。
C 可 grep：**1 处 MISMATCH（虚报本书没有，与组 111 的 compulsory 同一型）** —— 「不写的」那行写
  "「manage 还指经营公司／担任经理」（卡 `m` 没有这档，**本书也查无 manager／management 这两个词**）"。
  实测：`management` 确实全书 0 处 ✓，但 **`manager` 不是查无** —— 它虽无自己那张卡，却出现在 11 张别的卡上：
  9 句现成例句（`The company will hire a new manager next week.` hire.ex、`The manager oversees the team's daily work.` oversee.ex、
  hierarchy.ex、secretary.ex、vice.ex、successor.ex、subordinate.ex、deputy.ex、delegate.ex）
  ＋ boss.note 与 director.note 同义词栏各列 1 次。
  结论方向不变（本组不该写"担任经理"这档，因为 manager 无卡、课文 0 处），但这句要改成
  "manager 只在别的卡的例句里当背景角色、无卡，management 全书 0 处"。
  同组另外几处"查无此卡"我核了，**写法准确**：control 与 govern 确无卡（govern 在 1238 由 `governance` 承担、多卡同义词栏列过），
  adjust 有卡 ✓。
  其余逐条查到：`manage his mood`/`regulate his breathing`(1214 ✓)、`manage emotions`/`finances`/`multiple tasks`(manage.note ✓，
  后一条同见 multiple.note ✓)、`regulate behaviour`/`industries`/`advertising`(regulate.note ✓，末一条同见 advertise.note ✓)、
  `I managed to finish my homework before dinner.`(manage.ex ✓)、`The thermostat helps regulate the room temperature.`(regulate.ex ✓)、
  两卡同义词栏逐字对上（都列 control、互不列对方 → `all_synonyms: false` 有据 ✓）、`the cold regulations`(1217 ✓ 复数正确)、
  regulation 卡 m/ex ✓、adjust 卡 m ✓。control 确无卡无课文 ✓；govern 无卡、课文那处是 1238 的 `governance` ✓；
  management 全书 0 处 ✓；manager 无卡、课文 0 处 ✓ 但**卡库里 11 处在用**（见上，就是那条 MISMATCH）。
  否定行（`regulate to do`、`manage a team`、`regulate traffic`、`market regulation`、`self-regulation`）本书 0 处 ✓。
D 宽度：草稿 37.5 / 实测 37.5；总结句 草稿 22.0 / 实测 22.0 → OK。
E 义项照抄：OK —— 「管理」只在表头被引用并当场否定；core 用"按住/往回调"，默认行用「稳住情绪」——是 1214 的译文词，不是卡上义项 ✓。
F 同源诚实：OK —— 两侧各 2 条（课文 1214 + 卡 ex）、跨卡重复各算 1 条，均点名；
  "回到该在的那一格"明写来源是 regulate 卡 ex 的恒温器、不来自课文 ✓；regulation/课文 1217 被明确降为"名词族旁证，不能当 regulate 的书证" ✓。
判定：需作者改（最小清单 1 条，一句话）：把「不写的」里"本书也查无 manager／management 这两个词"改成
  "manager 无卡、课文 0 处，只在别的卡的例句里当背景角色；management 全书 0 处"。表体、宽度、diff 全不动。
  改完即可落地。对拍板点的判断：**照表落地**。这组薄（各 1 处、共用一句），但两格硬区别都可 grep：
  同句双宾语分工 + 卡词伙的宾语类型差；按 §五.7"薄不是退回理由"，砍它等于砍整张表的这一档。
  唯一要留神的是落地时别把中文「稳住」当义项写进 summary —— 草稿已经处理对了。

## 组 108 · chance / opportunity（4_03 组5）
A 原文表：OK —— 3 行（1210–1212）逐字相符。
B 句号与共现：OK —— 1211 = 段55 第 1 句、1212 = 第 2 句 ✓；两词各"标 1 处 + 未标 0 处"✓。
C 可 grep：**1 处 MISMATCH（虚报本书没有）** —— 组内正文写
  "书外提及：chance 出现在两张别的卡的同义词栏里（opportunity 卡、potential 卡『chance, likelihood』），
  **opportunity 只出现在 chance 卡那一栏里——除互列之外本书没第二处提过 opportunity**"。
  实测：`opportunity`/`opportunities` 在卡库本卡以外出现 **2 处** —— `chance.note`（同义词栏，草稿已算）
  **＋ `seize.note` 词伙整条就是 `seize job opportunities`**。也就是说：
  ① "没第二处提过"是假；② 草稿「不写的」里把 `seize the opportunity` 归入"本书没出现过的写法"，
  严格串比成立，但读者会以为 seize 这条也没 book 痕迹，实际 seize 卡的词伙正好是"抓住机会"那一路，方向与本组结论并不冲突。
  chance 侧的 2 张（opportunity/potential）我核了，**准确**。
  其余逐条查到：`little chance`(1212 + chance.note 同源 ✓)、`a chance it will rain tomorrow`(chance.ex ✓)、
  `gave an opponent an opportunity…`(1211 ✓)、`an opportunity to work abroad`(opportunity.ex ✓)、
  `job/academic/economic opportunities`(opportunity.note ✓)、两卡互列 → `all_synonyms: true` 有据 ✓、
  likelihood/possibility 确无卡 ✓。否定行 `little opportunity`、`a big chance`、`by chance`、`take a chance`、
  `second chance`、`window of opportunity` 本书 0 处 ✓。
D 宽度：草稿 37.5 / 实测 37.5；总结句 草稿 23.5 / 实测 23.5 → OK。
E 义项照抄：OK（有 1 处需登记为"合法引用"）—— 表头写"挨着的两句各有一个'机会'…两处译文都作「机会」"，
  这是**宣称共享义项成立**，而 1211 译「…的机会」、1212 译「没什么机会」两句确实都命中，属 §五.11 反向情形（宣称且数据支持）→ 放行；
  core 与默认行都没用「机会」二字（"还剩的那点/送上门的那格空子"）✓。
F 同源诚实：OK —— chance 侧 2 条 / opportunity 侧 2 条 + 词伙 3 条，`little chance` 与 1212 同源点名 ✓；
  还主动写出"两处共用同一个名词 + to 框架，所以没把句法当区别写"—— 这条诚实度是本片最好的一格 ✓。
判定：需作者改（最小清单 1 条，一行）：把"除互列之外本书没第二处提过 opportunity"改为
  「书外提及 2 处：chance 卡同义词栏 + seize 卡词伙 `seize job opportunities`」。不涉及表体、宽度、默认行。

---

## 组 109 · collaborate / cooperate（4_04 组1）
A 原文表：**BLOCK** —— 「该段原文（章3 段56）」第 2 行（全局 1217）草稿写
  `A young student explained **legal** words and read the cold **regulation** aloud twice.`
  数据是 `A young student explained [[legal:legal]] words and read the cold [[regulation:regulations]] aloud twice.`
  —— 表面形式是 **regulations（复数）**，草稿单数，加粗处也丢了 s。这是照抄运行数据的表，按 A 行判 BLOCK。
  旁证：**同一句在 `4_03.md` 组4 的出处清单里写作 `read the cold regulations aloud twice`，是对的** —— 两份草稿对同一句给了两种抄法，
  错的是 4_04 这份（1217 的其余 5 行、含 1216/1218/1219/1220/1221，中英逐字都对，所以是这一行漏抄）。
  门禁 1 抓不到它：这行不在反引号里，正是 AUDIT_BRIEF「机检有哪些看不见」第 1 类。
B 句号与共现：OK —— 段56 起 1216、共 6 句；`[[cooperate:cooperate]]` 与 `[[collaborate:collaborate]]` 同句 1216 ✓；
  两词各"标 1 处 + 未标 0 处"（含 -ed/-s/-ing 词形扫过，全书再无第二处）✓；1218 = 第 2 句、1219 = 第 3 句 ✓。
C 可 grep：OK —— `cooperate for one evening`/`collaborate on checking the books`/`on checking the books`/`checking the books`/`for one evening`(1216 ✓)、
  `They collaborate to finish the project.`(collaborate.ex ✓)、`They cooperate to finish the project on time.`(cooperate.ex ✓)、
  `felt weak compared to`(1218 ✓)、`differed from the delivery protocol`(1219 ✓)。
  草稿报备「两卡 `note` 均为空字符串」—— 我直接读两卡，**确为 `""`** ✓；
  草稿报备「别的卡的 ex/note 用到这两个词的：0 张」—— 按动词原形族严格扫，**确为 0 张** ✓（harmony 卡列的是 `cooperation`，
  那是 harmony「协调」义的同义词，不算本词，草稿这句成立）。否定行 `collaboration`/`collaborative`/`co-operative`/`joint venture` 全书 0 处 ✓。
  修正说明：该表其余 5 行（1216/1218/1219/1220/1221）中英逐字都对，所以是 1217 这一行单独漏抄；
  4_04 组1 的「出处清单」没引 1217，故全篇只有这一个错点。
D 宽度：草稿 34.5 / 实测 34.5；总结句 草稿 25.0 / 实测 25.0 → OK。
E 义项照抄：OK —— 表头「一句里"合作"说了两遍」是引用共享义项 + 立刻限定（"中文译文只给前一半留了「合作」两个字"）✓；
  core「一起做出同一件活」「搭手、不挡道」，默认行无「合作」二字 ✓。
F 同源诚实：OK —— 两侧各 2 条，且明写"两卡 `ex` 分属两卡、不是同一处文本，但骨架一致，实际只贡献一条'可换'信息"，
  没有把同句型算成两条独立证据 ✓。
判定：需作者改（**BLOCK 级 1 条，必须改后再落地**）：把 1217 那一行改回数据的复数
  `read the cold **regulations** aloud twice`（中文行「把冰冷条例读了两遍」不用动，译文本就无单复数）。
  其余四行、表头、默认行、diff、宽度全部原样可用。对拍板点的判断：**仍出卡**——
  "介词挂时长 vs 介词挂那件活"来自课文那一句本身、可 grep，比批次 3 组 2（imitate/mimic，两卡 ex 只差动词、被判"卡上零区别"）
  的处境更好，不是更差；两卡 note 全空只是少了词伙那一格，不该成为砍组理由（§五.7）。

## 组 110 · norm / standard（4_04 组2）
A 原文表：OK —— 2 行（1220/1221）逐字相符（该组只贴下半段两句，草稿自己这么标，组1 的表覆盖了另 4 句，均已逐字核过）。
B 句号与共现：OK —— 1220 = 段56 第 4 句、1221 = 第 5 句 ✓；`[[norm:norm]]`@1220、`[[standard:standard]]`@1221；
  各"标 1 处 + 未标 0 处"（我把 norms/standards 一并扫了，standard 复数全书确实 0 处）✓。
C 可 grep：OK —— 逐条查到：`the trade norm`/`broke the trade norm`/`fell below the cold benchmark they had set`(1220 ✓)、
  `cold benchmark`(benchmark.note，同源 ✓)、`no uniform standard was ever written`/`clear criteria`/`for fresh milk`(1221 ✓)、
  `clear criteria`(criteria.note，同源 ✓)、`The norm in this school is to arrive on time.`(norm.ex ✓)、
  `The school has a high standard for homework.`(standard.ex ✓)、三条 + 三条词伙 ✓、`conform to norms` 跨卡（conform.note 同条 ✓）、
  `rigid standards of beauty` 跨卡（rigid.note ✓）、`act, guideline, instruction, norm`(regulation.note ✓)、
  `instruction, norm, policy`(guideline.note ✓)、`contrasting norms`(contrast.note ✓)、
  `standards, benchmarks, requirements`(criteria.note ✓)、conform 卡 ex + m「符合」✓、benchmark/criteria 两卡 ex 与中文"标准"✓、
  normal 卡带 `average` 那串同义词 ✓。被别的卡引用的计数我也复算：norm 除 standard 卡外恰好 4 张（guideline/regulation/conform/contrast）✓、
  standard 恰好 2 张（criteria/rigid）✓。否定行 `standard deviation`/`norms of behaviour`/`set a standard`/`up to standard` 本书 0 处 ✓。
D 宽度：草稿 34.0 / 实测 34.0；总结句 草稿 19.0 / 实测 19.0 → OK。
E 义项照抄：OK —— 「标准」只在表头被引用 + 当场限定（"本段真落在译文上的只有 standard 这一侧"）✓；core 无义项词；
  默认行写「没人写也照做的行规」，「行规」是 1220 的译文词、不是卡上义项 ✓。
F 同源诚实：OK —— 两条词伙同源（cold benchmark、clear criteria）点名、跨卡同串各算 1 条点名；两侧各 5 条 复算一致 ✓。
  一处措辞可收紧（不改判）：出处清单说"段 56 下半一句里挤了四个'标准类'词"，实为**两句**各两个（1220 = norm+benchmark、1221 = criteria+standard）。
判定：可落地。对两个拍板点的判断：**都按现写法落地**。① 义项单侧成立属 §五.6 标准处置，草稿已把「标准」关进 `sense` 槽；
  ② norm 卡三条词伙课文 0 处**该留**——它正是"worklist 为什么会把 norm 算进标准组"的解释，且草稿已标"本书课文 0 处、不可当课文证据"。

## 组 111 · mandatory / obligation（4_04 组3）
A 原文表：OK —— 3 行（1225/1226/1227）逐字相符。
B 句号与共现：OK —— 段57 起 1222，1225 = 第 3 句、1226 = 第 4 句、1227 = 第 5 句 ✓；
  两词各"标 1 处 + 未标 0 处"✓（obligations 复数也扫了，0）；obligation 本卡以外仅 duty.note 回列 1 次 ✓、mandatory 0 次 ✓。
C 可 grep：**1 处 MISMATCH（虚报本书没有）** —— 「不写的」那行写
  "compulsory、obligatory、`make it mandatory`、`a moral obligation` 这类**本书 0 处**的写法一律不列"。
  实测 `compulsory` **不是 0 处**：它有卡（m「adj. 必须做的；强制的」、词伙 `compulsory math`、
  ex `Wearing a helmet is compulsory for cyclists.` —— 与 mandatory 卡 ex 只差那个动词），
  而且课文 455（章1 段19 第 0 句）挂了标记 `[[compulsory:compulsory]]`，译「迎接最终必修数学复习」。
  obligatory / `make it mandatory` / `a moral obligation` 我扫过，确为 0 处 ✓，只有 compulsory 这一项报错了。
  要紧的是方向：这不是"编了条查不到的搭配"，而是**把本书有的一个近义词头报成没有**——
  后面要出 mandatory/compulsory 那一张的人会被这条误导。改法一行：把 compulsory 从"本书 0 处"里摘掉，
  另写"compulsory 有卡且课文 455 已标，它的卡 ex 与本组 mandatory 卡 ex 是同一句只换词，属另一张表的对照"。
  其余逐条查到：`called morning delivery mandatory`/`mandatory for all food shops`/`An official from the street office`/`street office`/`morning delivery`(1225 ✓)、
  `the plain obligation he felt toward the children`/`any road to court`(1227 ✓)、`Wearing a helmet is mandatory for cyclists.`(mandatory.ex ✓)、
  `He felt an obligation to help his friend.`(obligation.ex ✓)、`felt bound by honor`/`to talk peacefully`(1226 ✓)、bound 卡 m 与空 note ✓、
  1223 `perform every promise…enforce the morning delivery times strictly` ✓、`enforce stricter penalties`(enforce.note ✓)、
  court 卡 ex + `supreme court`(court.note，与 1228 同源 ✓)、duty 卡 ex + `child-rearing duties` ✓、obligation 三条词伙课文 0 处 ✓。
D 宽度：草稿 33.5 / 实测 33.5；总结句 草稿 22.5 / 实测 22.5 → OK。
E 义项照抄：OK —— 表头「共同义项『义务』，本段两处译文一个没用它」= 引用 + 否定 ✓；
  core「外头定的，必须照做」「自己心里那份，觉得该」，默认行无「义务/强制的/法定的」✓。
F 同源诚实：OK —— 本组没有卡词伙与课文同源（三条 obligation 词伙课文 0 处，已点名）；两侧各 2 条 + duty 卡回列算旁证不算文本 ✓。
  "obligation 跟 feel 绑"明写样本 2、不可写成禁令 ✓。
判定：需作者改（最小清单 1 条）：改「不写的」里 `compulsory` 那句。表体、宽度、默认行、diff 全不动 → 改完即可落地。
  对拍板点的判断：**不退回**。这组最硬的两格（adj./n. 的句法位置、`for + 那批人` vs `toward/to + 人` + feel）
  与"义务"这个义项名无关且可 grep；义项两侧不落地按 §五.6 处理，草稿已照做。

## 组 112 · prosecute / sue（4_04 组4）
A 原文表：OK —— 4 行（1230–1233）逐字相符。
B 句号与共现：OK —— 段58 起 1228、该段 12 句（我实测 12 ✓，与草稿"本段 12 句"一致）；1231 = 第 3 句、1232 = 第 4 句、1228 = 第 0 句 ✓；
  sue 标 1（1231）+ 未标 0；prosecute 标 1（1232）+ 未标 0，且 `prosecutes/prosecuted/prosecution` 全书 0 处 ✓（草稿这条报对了）；
  两词被别的卡提到的次数：各 0 张 ✓；两卡 `note` 确为空字符串 ✓。
C 可 grep：OK —— `sue over one late truck`/`promised never to sue`/`refused to accuse anyone in anger`/`in anger`/`one late truck`(1231 ✓)、
  `prosecute the tired driver`/`No one wished to prosecute`/`condemn his honest family`/`the tired driver`(1232 ✓)、
  sue.ex `He will sue the company for damages.` ✓、prosecute.ex `The court will prosecute him for theft.` ✓、
  1230/1233/1228 三句 ✓、condemn 卡 ex ✓、accuse 卡 ex `They accused him of stealing the money.` ✓、
  court 卡 ex + supreme court ✓、truck 卡 ex + `little truck`(truck.note，另在课文 994 未挂标记出现，草稿未宣称 0 处，无冲突) ✓。
  否定行 `sue for divorce`/`prosecute a case`/`sued for libel` 本书 0 处 ✓。
  `late truck` 那条词伙草稿写"与 1231 / 1245 同源"，实际本书有 3 处（还含 1254）；草稿只是列了本组相关的两处，
  未据此加计出处，不影响任何结论 → 记一句备注，不改判。
D 宽度：草稿 34.5 / 实测 34.5；总结句 草稿 17.0 / 实测 17.0 → OK。
E 义项照抄：OK —— 表头说"共同义项「起诉」两处都成立"，1231 译「去起诉谁」、1232 译「想告」——数据支持（且草稿自己点明
  两处中文不是同一个词）→ 属"宣称且成立"，非复述当区别；core「为那桩事去告」「把那个人告了」，默认行无义项词 ✓。
F 同源诚实：OK —— `late truck` 与课文同源点名不另计；两侧各 2 条；
  并且主动把"官府才用 prosecute"这条**判给本书撑不住**（1232 主语是 `No one`，不是卡 ex 的 The court）——
  这正是 AUDIT_BRIEF 第 4 类（把本书两句升级成语法禁令）的防御性写法，做得对 ✓。
判定：可落地。拍板点（作者说"不必拍板"）我同意：义项两侧成立、区别格两格都可 grep。

## 组 113 · murmur / whisper（4_04 组5）
A 原文表：OK —— 4 行（1242–1245）逐字相符。
B 句号与共现：OK —— 段59 起 1240；1243 = 第 3 句、1244 = 第 4 句、1240 = 第 0 句、1241/1242 = 第 1/2 句 ✓；
  `[[whisper:whisper]]`@1243、`[[murmur:murmur]]`@1244 ✓。
  §五.13 两档我逐个词形扫过：whisper 标 4 = 967/1087/1117/1243 ✓、未标 2 = 129(`whispers`)、944(`whispered`) ✓；
  murmur 标 1 = 1244、未标 0 ✓。定位也对：967 = 章3 段14 第 0 句、1087 = 段34 第 0 句、1117 = 段39 第 0 句、
  129 = 章0 段22 第 3 句、944 = 章3 段10 第 1 句 ✓（章0 不在坏区间，见下「独立复核」）。
  whisper 被别的卡用到：仅 timid.ex 1 次 ✓；murmur：0 张 ✓。
C 可 grep：OK —— 逐条查到 12 条：`A nervous whisper ran through the room`/`nervous whisper`(1243 + whisper.note 同源 ✓)、
  `A soft murmur of understanding spread`/`soft murmur`/`stayed mute and calm`/`angry uncles`(1244 + murmur.note 同源 ✓)、
  `He whispered a secret to his friend.`(whisper.ex ✓)、`I heard a murmur from the next room.`(murmur.ex ✓)、
  967/1087/1117 三句全句与三个 that 从句 ✓、`Someone whispers that our valley feels exactly like a green paradise`(129 ✓)
  + 译文「有人低语山谷恰似一座绿色乐园。」✓、`Father whispered about things that vanish on a journey…`(944 ✓) + 译文逐字 ✓、
  `The timid boy whispered his answer.`(timid.ex ✓)、`He mutters under his breath when he is angry.`(mutter.ex ✓)、
  `He stayed mute during the meeting.`(mute.ex ✓)、1240/1241/1242/1245 四句 + `mediate gently`/`for the truth`/`a soft appeal` ✓。
  否定行 `murmurings`/`whisper to sb`/`murmur with displeasure` 本书 0 处 ✓。
  一处措辞可收紧（不改判）：diff 末行说"「低语」这两个字在课文里只出现在 whisper 那处"——
  我扫了全书译文，`低语` 命中 2 处（129、1243），**两处都挂在 whisper 那句上**（129 是动词、1243 是名词），
  所以这句的实质（本书从没用「低语」译 murmur）成立，只是"那处"数量写成了一处。建议改成"只出现在 whisper 的句子里"。
D 宽度：草稿 38.5 / 实测 38.5；总结句 草稿 19.5 / 实测 19.5 → OK。
E 义项照抄：OK —— 表头「共同义项『低语』在两卡 m 上都挂在动词档，可本段两处用的都是名词」= 引用 + 当场降格 ✓；
  core「凑耳边说的那句」「听不清内容那一片」把「耳语」「低语声」都换成了画面 ✓；默认行无义项词 ✓。
F 同源诚实：OK —— 两卡唯一词伙与 1243/1244 同源、各点名不另计；murmur 侧 2 条、whisper 侧 8 条（6 书内 + 2 卡），
  且明写"967/1087/1117 同句型，只算 1 个句型、但三段从句各不同"—— 同源/同型的账摊开了 ✓。
  "whisper 6 处里 5 处身后挂着话"我逐句数过：967/1087/1117/129/944 = 5 处带从句或宾语，1243 不带 ✓ 数字准确。
判定：可落地（含下面那条新形态的处置意见）。

---

# 两件独立核的（本批指定）

## 1. §五.12 坏点边界：`4_03` 那句判断 **成立**，可以放行后面两批

我把 6 章 58+52+40+66+36+56 = 308 段主题栏全量扫了一遍，两种形状都测了（完全相等、以及"前段主题栏 + 尾缀"）：

- 只有 **章3（社会与规则，66 段）** 有坏点；其余 5 章**零重复、零"前句+尾缀"**。
- 章3 命中恰好 **22 对**：`paraZh[i+22] == paraZh[i] + ' 灯下团聚，欢语不断。'`，i = 0…21 → 坏的是**段 22–43**（含两端，共 22 段），
  尾缀 22 条完全同字。段 44 起 22 段主题栏互不重复、也不与 0–43 任何一条构成前缀关系。
- 所以 `4_03` 写的"坏点只在章3 段 22–43，本切片共现段 49/50/53/55 在区间外"**逐字复核为真**；
  `4_04` 用的 56/57/58/59 同样在区间外 ✓；`4_03` 组2 把旁证句 1021（段23，**在**坏区间内）只引原句 + `sentZh`、
  不引该段主题栏 ✓ 处置正确。

给后面两批的两条操作性提醒（避免误伤）：

1. **检测要用 `startswith`，不是相等**。全书 `paraZh` 没有任何一对完全相等值，只数重复值会一条都报不出来。
2. **坏的是"副本半区"（22–43），不是"原件半区"（0–21）**。段 0–21 的主题栏各自正常，只是被 22–43 抄了一遍并挂了别人的尾缀；
   别把它推成"章3 前 44 段也不能引"。章3 段 44–65（本批与后两批的街角小店那一卷）主题栏干净，可当背景，
   但仍受 §五.12 主判据约束（只能写句子撑得住的部分）。
3. 章0 段22（课文 129）与坏区间号撞名但**不同章**，不受影响 —— `4_04` 组5 引它是安全的。

## 2. `4_04` 组5（murmur / whisper）"档位错"这种形状怎么判

先把事实钉住（我亲手查的）：两卡 `m` = whisper「n. 耳语；v. 低语」、murmur「n. 低语声；v. 低语」，
交集「低语」确实**同时挂在两卡的 v. 档**；共现段 1243/1244 两处都是**名词短语**（`A nervous whisper ran…`、`A soft murmur of understanding spread`），
译文分别「一阵低语」「…的轻声」；murmur 的 v. 档全书 0 处，whisper 的 v. 档书证在别段（967/1087/1117/129/944）。

**判定：不是 BLOCK，也不是 MISMATCH —— 属 §五.6 的同一口径，草稿的处理方式正确（把话说轻 + 义项关进 `sense` 槽 + 在证据强度里点名档位），照落地走。**

**要不要写进 BRIEF 当一条新口径？我的意见：不新增条，只在 §五.6 追加一个示例括号。** 三条理由：

1. §五.6 那句话的正文已经覆盖它了："worklist 的 `senses` 是两张卡 `m` 的交集，**不是共现段里的实际用法**"，
   而且举的两个例子里，`alien/foreigner` 那条就是**词性错位**（alien 在段里是形容词）。murmur/whisper 与它是同一种病，
   只是错的是 `m` 内部的档位而不是 n./v. 之间。再开一条会与 §五.6 重叠，代理反而要判两套。
2. 真正有增量的信息不是"怎么处置"，而是"**要多写一句**"：档位错必须写明"哪一档本书 0 处、哪一档的书证在别的段"——
   这本就是 §三.8（证据强度要明说）＋ §五.13（两档计数）已经在要求的东西，不需要另立门。
3. 危险方向也正好相反，值得钉一句：**档位错不许升级成"本书没有这个词形"**。murmur 的 v. 档全书 0 处是真的，
   但 whisper 的 v. 档书证很厚（6 处），草稿在 diff 里就把两词这一档分开写了，写法可当范本。

建议在 §五.6 末尾那个括号例后面追加：
「（同一口径还包含**档位错**：`whisper/murmur` 的『低语』取自两卡 v. 档，而共现段两处都是 n. 档 —— 处置不变，
 但要在证据强度里写清是哪一档 0 处、哪一档的书证在别段。）」

---

# 提请他拍板那几组，我的意见（共 8 处，逐条）

| # | 组 | 作者要拍的是什么 | 我的判断 |
|---|---|---|---|
| 1 | 105 deal/transaction | `all_synonyms: true` 但两卡 ex 不同档，是否照表落地 | **照表落地**。共现段同单生意一前一后是书里最强分工证据；deal 卡 ex 走"处理"档反而是可利用的信息，不是缺陷 |
| 2 | 106 clerk/personnel | 义项「职员」在 personnel 侧本书从未这样译 | **不退回，现写法即 §五.6**。"一共那群人 vs 其中一位"是可 grep 的句法差（All+were vs the+单数） |
| 3 | 107 manage/regulate | 两词各 1 处、挤同一句，是否只出义项表 | **照表落地**。§五.7 已定死薄不是门槛；两格（同句双宾语 + 词伙宾语类型）都可回溯 |
| 4 | 109 collaborate/cooperate | 两卡 note 全空、比批次 3 组2 更薄 | **仍出卡**，但**先把 1217 那行复数改回来**（唯一 BLOCK）。改完这一行它就和其他组一样可落地 |
| 5 | 110 norm/standard | 义项单侧 + norm 三条词伙课文 0 处该不该进表 | **都留**。词伙行恰好解释 worklist 为什么这样分组，且已标"不可当课文证据" |
| 6 | 111 mandatory/obligation | 义项两处译文都没落地 | **不退回**。词性 + `for` vs `toward/to` + feel 三格与义项名无关，全可 grep。但 `compulsory` 那句"本书 0 处"必须改 |
| 7 | 113 murmur/whisper ① | 档位错要不要另立口径 | **不另立**，按上面建议在 §五.6 补一个示例括号 |
| 8 | 113 murmur/whisper ② | murmur 侧仅 2 条，是否允许出 diff 表 | **允许**。这组的另一边（whisper 6 处）厚，"听见的是一片声还是有人在说话"这一格对本段读者真有用；murmur 半侧全部标注为"本书没给"，没有硬凑 |

---

# 修复清单（最小，按优先级）

1. **[BLOCK] `4_04.md` 组1 · 1217 行**：`read the cold regulation aloud twice` → 数据的 `regulations`（复数）。加粗处一并补 s。
2. **[MISMATCH] `4_04.md` 组3 ·「不写的」**：`compulsory` 不是本书 0 处 —— 它有卡、课文 455 挂了标记，卡 ex 与 mandatory 卡 ex 只差那个动词。
3. **[MISMATCH] `4_03.md` 组4 ·「不写的」**："本书也查无 manager／management 这两个词" —— `management` 成立，`manager` 不成立（11 张卡在用，含 9 句现成例句）。
4. **[MISMATCH] `4_03.md` 组5 · 正文"书外提及"行**：opportunity 除 chance 卡外还有 seize 卡词伙 `seize job opportunities`，"没第二处提过"要改。
5. **[MISMATCH] `4_03.md` 组1 · 数据边界节**：`luxury goods` 在"词伙 3 条"与"别的卡 3 条"里各算了一次（草稿自己声明跨卡算 1 条），goods 侧总数 -1。
6. **[MISMATCH] `4_03.md` 组1 · 出处清单 paraZh 行**："1179 签约旁听…主题栏说的事句子都撑得住"——段49 六句没有任何一句写签约，改成部分撑得住。
7. **[备注，可不改] `4_04.md` 组2**：段56 下半"一句里挤了四个标准类词"实为两句各两个。**组4**：`late truck` 课文另有 1254。**组5**："「低语」只出现在 whisper 那处"宜改"那几句"（129、1243 两处都是 whisper 句，实质结论不变）。

宽度、句号编号、共现段、§五.13 两档计数、义项照抄（E）、同源合并（F）这六类**没有一条需要返工**：
20 个宽度标称值、46 行原文表、10 组成员句位与全部计数，我都逐条亲手复算/复量过，除以上 6 条外一致。
（4 条 MISMATCH 全部落在「不写的」／「证据强度」这类边界声明里，**没有一条动表体、默认行或宽度** —— 作者改完 6 行即可送落地。）

## 给落地方的一条模式提示（不是缺陷，是规律）

这 3 条"虚报本书没有"（组 107 `manager`、组 108 `opportunities`、组 111 `compulsory`）不是抄错，是**同一种系统性偏窄**：
作者在写"本书 0 处 / 没第二处提过"这类**否定式覆盖面断言**时，只查了课文 + 自己那张卡，
没有把 `vocab.json` 里**别的卡的 `ex` / `note`** 再扫一遍。而我逐条扫下来发现：
两批草稿里所有**肯定式**断言（标 N 处、未标 M 处、词伙出处、被几张卡提到、同义词栏互列）**除组 104 那一处跨卡双计外全部准确**，
错的清一色是否定式那三句。所以下一批代理交稿前，建议只加一步：
把草稿里出现的"查无 / 没出现过 / 0 处 / 没第二处"逐条挑出来，用词形匹配扫一遍 `vocab.json` 的 `m`/`ex`/`exZh`/`note` 四字段 ——
成本 1 分钟，本批这 3 条就全都能自己冒出来。
（对照：这两批草稿里"本书没出现过 / 查无 / 0 处"类断言我总共实测了 35 条以上，**除上面 3 条外全部成立**，抽样列一些：
`by chance`、`take a chance`、`window of opportunity`、`set a standard`、`up to standard`、`standard deviation`、
`personnel department`、`human resources`、`shop assistant`、`head clerk`、`staff canteen`、`moral obligation`、
`make it mandatory`、`obligatory`、`sue for divorce`、`prosecute a case`、`sued for libel`、`murmurings`、
`joint venture`、`cargo ship`、`deliver goods`、`self-regulation` 等 —— 只有上面那 3 条越界。）
