# 门禁 2 审核 · 批次 3 切片 16/17/18（`3_07.md` + `3_08.md` + `3_09.md`，worklist_idx 82–93）

> 审核代理：audit_d_b3（独立于三份草稿的作者）。数据只读 `shadow/data/vocab.json`、`shadow/data/sections.json`。
> 工具口径：宽度用 `tools/width_rule.py` 的 `width()`（`extract` 取行），句号用章偏移 `[0,339,651,883,1277,1492]` 自算，
> 原文表逐字比对与英文串 grep 全部脚本化跑过（表格行 72 条、反引号英文串 685 条），不靠肉眼。
> 注：草稿里的「章3」= sections.json 数组第 4 个元素（`title`「社会与规则」，偏移 883），本审核沿用草稿编号。

组数 12 / BLOCK 0 / MISMATCH 5 / 通过 7

（分档小结：BLOCK 0 —— 12 组的原文表 72 行逐字全对、24 个宽度标称值逐位吻合、义项词一个都没漏进 `core`/默认行/总结句，
所以没有一条需要退回重写。MISMATCH 5 组全部集中在两类可改文本的错：**3_07 组2** 把没标词头的 `dawn` 写成"同段挂着的卡"；
**3_08 组1/3/4/5** 把章3 的 `paraZh`（段主题栏）当成段落内容写进「这一段在讲什么」，其中三组写出了本段根本没有的事件（热汤／孩子们挥手）。
详见各组 F 行与本文件末「paraZh 专项」。）

---

## 组 82 · sailor / seaman（3_07 组1）
A 原文表：OK。表 6 行（949–954）英文与中文逐字回 `sections.json` 比对（去掉 `[[词头:表面]]` 后），标点/大小写/单复数/时态零差异；
  三处成员加粗位置与该句实际标记一致（951 `[[sailor:sailor]]`、952 `[[seaman:seaman]]`、954 `[[sailor:sailor]]`）。
B 句号与共现：OK。自算 949–954 = 883 + 段0–10 合计 66 句 + 段内序号，与草稿一致；切片 `sents` 951/952/954 对得上；
  `sailor` 标记 2 处（951/954）、`seaman` 1 处（952）✓；"1352 的 sailors 未被标成卡片词" ✓（该句标记的是 `maritime`/`naval`）；
  "章4 段12 第 2 句" ✓（1352 = 数组第 5 章段12 句2）。
C 可 grep：55 条逐条命中（含 `worried sailors`、cabin/stern/sailor/seaman/captain 四条卡 `ex`、`old sailor`/`tired sailor`/`tired seaman` 三条词伙）。
  查无 3 条：`seamen`、`ship's crew`、`merchant seaman` —— 三条都在"本书 0 处/一律不写"的否定行，且我反向验回确实全书 0 处 → 放行。**没有一条假证据藏在否定行里当正证据用。**
D 宽度：默认行 标称 38.5 / 实测 38.5 ✓；总结句 标称 21.0 / 实测 21.0 ✓；`core` 两格 ≤12 字 ✓。
E 义项照抄：`core`（被讲起、也开口的那位 / 屏幕里那位）、默认行、总结句三处零义项词 ✓。
  表头含「水手」但属如实登记：我逐句核了 951/952/954 的 `sentZh`，三处译文确实都含「水手」→ 该段**实际就是撞的**，不构成 §五.11 拦的那种"宣称都指 X 而实际不撞"；
  且同一句里用「可……他在屏幕上」当场把话题转向真区别 → 按豁免放行。
F 同源诚实：OK。点名"两卡 3 条词伙全是课文 951/952/954 那三句"并按 1 条计 ✓；独立文本 3+2+3＝8 条算式我复算无误 ✓；
  最薄一侧（seaman 全书 1 现）如实写明，未拿"薄"当缺陷，也未据此升级成语法禁令。
判定：**可落地（OK）**。作者提请拍板的那句"主判据落在段内 2:1 分布、不是卡给的"——我的判断：**这条判据成立且是本书唯一给得出的判据**
（两卡 `note` 都没有同义词栏，`m` 交集只有中文，卡上没有任何一条能区分二者的英文）；段内分布是课文原文，不是作者推的语义，不该因此降级。

---

## 组 83 · railroad / railway（3_07 组2）
A 原文表：OK。表 6 行（967–972）逐字全对 ✓；971/972 加粗与标记一致 ✓。
B 句号与共现：**不符 1 处（本组唯一实质问题）**。句号/共现段本身全对（railroad 1 处 971、railway 1 处 972，切片 `sents` 吻合；
  973/976 的"下一段"位置也对）。错在段内卡片清单那句：草稿写「同段还站着 embark / **dawn** / channel / canal / ditch / flat **六张**别的卡」，
  而段14 实际标记的词头是 midnight / whisper / embark / quiet / channel / canal / story / ditch / flat ——
  **`dawn` 在 967 只是未标词头的裸词 `at dawn`，本段没有 dawn 卡**（`dawn` 的标记处在 883/1000/1264 等，均不在段14）；
  且"六张"实测是 9 张，漏了 midnight / whisper / quiet / story。
C 可 grep：48 条命中（含 `The train runs on the railroad.` / `…on the railway.` / `…on the rail.` 三条 ex、rail 卡 `steel rail`、
  `A small locomotive pulled six cars over the river`、`Flat land ran past the window`、`the deep ditch and the rivers beyond`）。
  未命中 1 条被当正证据用：`Father said ...`（diff 第 3 行"971 railroad 待在 `Father said ...` 后面"）——
  我回原文验了：971 确为 "…; Father said this whole railroad was built by hand"，串是**省略号写法**不是假证据 → 放行，
  但建议落地时改成 `Father said this whole railroad…` 的省略形或整句，免得下游脚本按字面查不到。
  查无 3 条（`railway station`/`railroad track`/`by railroad`）全在"本书 0 处的写法一律不写"行 ✓ 反向验回确实 0 处。
D 宽度：默认行 标称 36.5 / 实测 36.5 ✓；总结句 标称 20.5 / 实测 20.5 ✓；`core` ≤12 字 ✓。
E 义项照抄：默认行/总结句/`core` 零义项词 ✓。表头含「铁路」：971 译「这条铁路」、972 译「这条新铁路」我逐字核过 ✓ 两处在中文上确实撞，
  同句用「可 971 说的是……972 说的是……」转向真区别 → 按豁免放行。
F 同源诚实：OK。"两卡各 1 条词伙、都就是本段那一句"✓；"可用文本总共 4 条"算式复算无误 ✓；
  本组唯一一条**卡上给的**区别（`railroad` 译「铁路」vs `railway` 译「铁轨」，且与 rail 卡 `ex` 译文一字不差）我逐字比过三条 `exZh`，完全成立 ✓
  —— 这条我认为是本切片质量最高的一处发现。rail 只作对照、没被拉进成员表 ✓（硬约束 2）。
判定：**需作者改（MISMATCH）**。最小清单：① 删掉/改写段14 卡片清单那句 —— `dawn` 标注为"未标词头的裸词 at dawn"，"六张"改"九张"或直接删掉这句计数；
  ②（可选）`Father said ...` 换成可字面命中的整句形。两处都不动卡片字段，改文即可，不必退回。
作者提请拍板的"段内分布算不算判据"——同组 82 的判断：**算**；何况本组还额外有一条卡上给的中文字分工作第二判据。

---

## 组 84 · defer / delay（3_07 组3）
A 原文表：OK。表 6 行（979–984）逐字全对 ✓；980 `[[delay:delay]]`、982 `[[defer:deferring]]` 标记形状与草稿所写一致（我直接看了 `paragraphs` 原文串）✓。
B 句号与共现：OK。980/982 落在段16（979–984）✓；`defer` 全书标记 1 处（982）、`delay` 4 处（980/1222/1264/1505）✓ 与草稿逐一对上；
  裸词 3 处（534 `delayed`、1764/1766 `delays`）✓；四处位置注解"章3 段57 第 0 句 / 章3 段63 第 0 句 / 章5 段2 第 1 句 / 章1 段32 第 1 句 / 章5 段45"我逐条回数据核，**全对** ✓。
C 可 grep：67 条命中（`mumble about deferring the trip`、`waited out the long delay`、`a grudging admission of the delay`、
  `confess the delay openly`、`explain the bus delay calmly`、`An accident delayed our outing`、`meet delays`、`long delays`、
  两卡 `ex`、三条 delay 词伙、postpone 卡「同义词：delay, defer」与 `postpone the meeting until next week`、lag 卡 `lag behind` 等）。
  查无 3 条（`defer to`/`put off`/`postpone the flight`）全在"本书 0 处，故不写"行 ✓ 反向验回 0 命中。
  **重点核了最容易出事的一条**：草稿把"980 的 delay 是名词"当判据用 —— 我读了 980 原句与 `sentZh`（"那段长长的晚点"）并核 4 处标记全部是
  "the long delay / of the delay / the delay openly / the bus delay" 的名词框架 ✓，"没有一处是主语主动定日子"复算成立 ✓。不是编的。
D 宽度：默认行 标称 38.0 / 实测 38.0 ✓；总结句 标称 21.0 / 实测 21.0 ✓。
E 义项照抄：`core`/默认行/总结句零义项词 ✓。表头是 §五.11 的教科书句式（"本段的 delay 不是『谁推迟了什么』，是等来的那段时间"）→ 引用 + 当场否定 ✓ 放行。
  「延缓」二字只出现在 `sense` 槽 ✓。
F 同源诚实：OK。"defer 卡 note 只有同义词栏、词伙段一条都没有"✓（原文 `同义词：postpone`）；"delay 的 3 条词伙本书课文一处没用过"✓ 我 grep 过；
  `flight delay` 跨卡同串只算 1 条 ✓；"本组独立文本"未虚报（未给总数，给的分解 5+2+3+1 我核得下）✓。
判定：**可落地（OK）**。作者提请拍板的两条：① "共享义项名不副实（980 的 delay 译『晚点』）"—— **成立**，我已独立验回 `sentZh` 与 4 处标记的词性框架，
  §五.6 的处理（义项留 `sense`、标题不宣称、证据强度补一句）到位，**不需要退回**；② "defer 侧零词伙、要不要给 defer 卡补词伙"——
  这是数据侧的事，不属本门禁范围，落地上 defer 侧现有 2 条文本（982 + 卡 ex）够撑这张卡。

---

## 组 85 · package / parcel（3_07 组4）
A 原文表：OK。表 6 行（991–996）逐字全对 ✓；991/993 加粗与标记一致 ✓。
B 句号与共现：OK。`package`、`parcel` 全书各 1 处标记（991/993），且**未标词头的写法也各只有这 1 处**（我按 `\bpackage\b`/`\bparcel\b` 全六章重扫 ✓）；
  "上一段 985–990 的邮件串"六句逐句核：985 worked out the money due / 986 extra postage / 987 small stamp / 988 old envelope / 989 mail box / 990 packet ✓ 全对；
  "各挂各的卡"（bind 992 / load 994 / burden 995 / transfer 996）逐个核了标记 ✓ 全对。
C 可 grep：64 条命中（`gave Father a small package of dried fruit`、`Father lifted a brown parcel off our seat`、两卡 `ex`+`exZh`、
  `packaged goods`、`software packages`、despatch 卡 `He will despatch the package tomorrow.`、logistics 卡 `…deliver packages faster.`、
  990 的 `a packet of thin cookies` 与 packet 卡 `ex` 等）。未命中 1 条 `a package of + 内容` 是**中文+加号的写法模板**不是引文，
  实体串 `a package of cookies` / `a small package of dried fruit` 均可命中 → 放行（建议改成"「a package of ＋内容」"以避开字面查询）。
  查无 2 条（`parcel post`/`package the bags`）在否定行 ✓。
D 宽度：默认行 38.0 ✓；总结句 19.5 ✓；`core` ≤12 ✓。
E 义项照抄：`core`/默认行/总结句零义项词 ✓。表头被脚本判到「小包」二字，实为 991 译文的字样（"一小包果干"），不是宣称两词都指"小包" → 放行。
F 同源诚实：**本组是 12 组里数数最干净的一组**。"parcel 唯一词伙 `brown parcel` 就是课文 993、不另计"✓；
  "package 的 2 条词伙本书课文都没用到，是独立文本"✓；8 条 = 2+2+2+2 算式复算无误 ✓，package 6 / parcel 2 的偏侧分布也与我核到的一致 ✓；
  "本书唯一两处『寄／送包裹』都是 package、课文 0 处"—— 我把全库 `package*`/`parcel*` 都翻了，除 991/993 与四张卡的 ex/note 外无第二处 ✓ 成立，
  且作者明写"这一格写的是本书口径，不是 parcel 不能表被寄"✓ 没升级成禁令。
判定：**可落地（OK）**。990 的 packet 与 991 的 package 同档、未进成员只在出处备案 ✓ 符合硬约束 2。

---

## 组 86 · speed / velocity（3_07 组5）
A 原文表：OK。表 6 行（997–1002）逐字全对 ✓；1001/1002 加粗与标记一致 ✓。
B 句号与共现：OK。`speed`、`velocity` 全书各 1 处标记（1001/1002），两句紧邻、都在段19 ✓；
  "本段前 4 句各挂各的卡"（997 transmit / 998 transit / 999 deliver / 1000 convey）逐个核标记 ✓ 全对；1003 `swift birds` ✓ 在段20 ✓。
C 可 grep：61 条命中（`At full speed the little cups on our table danced`、`Nothing on this plain can reach the velocity of that morning train`、
  两卡 `ex`、exceed 卡 `The car exceeded the speed limit.`、accelerate 卡 `同义词：speed up, hasten, precipitate`、pedal 卡 `…to speed up the bike.`、
  `transmit home`、`city transit`、`deliver our promises`、`convey the message`、`Some swift birds went over the wall`）。
  查无 3 条（`at high velocity`/`a velocity of 100 km/h`/`speed of light`）全在"本书 0 处的写法"否定行 ✓ 反向验回 0 命中。
  **"本书 speed up 有 2 处，全在旁卡，课文 0 处"我独立数过：accelerate 卡同义词栏 1 + pedal 卡 ex 1 = 2 ✓，课文 0 ✓ 不虚报。**
D 宽度：默认行 39.0 ✓（本切片最贴上限的一条，我复算过：确实 39.0，没超）；总结句 23.5 ✓。
E 义项照抄：全组 `core`/默认行/总结句/表头**零义项词**（12 组里 E 最干净的组之一，「速度」只在 `sense` 槽）✓。
F 同源诚实：OK。"velocity 卡 `note` 是空字符串"✓（原文 `note: ""`）；"speed 唯一词伙 `full speed` 就是课文 1001"✓ 同源不另计；
  7 条 = 2+2+3 复算无误 ✓；未拿"velocity 卡全空"当退回理由，也没升级成"velocity 是物理量"的通用结论 ✓。
判定：**可落地（OK）**。作者提请拍板的"velocity 侧卡上完全空白、要不要退回"—— **不该退回**：§五.7 明写证据薄不是门槛，
  本组两侧各 1 处 + 各 1 句 `ex`、方向（at full speed 作状语 vs reach the velocity 带 of 所属）我逐句核过是句子给的，不是推的。
  一处小笔误请顺手改：出处清单把 swift 卡 `m` 写成「迅速的；快」，原文是「迅速的；快的；n. 雨燕」。

---

## 组 87 · importance / significance（3_08 组1）
A 原文表：OK。表 6 行（1045–1050）逐字全对 ✓；1045/1046 加粗与标记一致 ✓。
B 句号与共现：OK。`importance` 标记 1 处（1045）、`significance` 1 处（1046）；我按 `\bimportance\b`/`\bsignificance\b` 全六章重扫（含未标词头写法）
  确实各 1 处 ✓ 与草稿"重扫全六章也还是各 1 处"一致；段首 1045 = 883 + 前面 27 段累计 162 句 ✓ 附录里 162/174/192/198 四个累计数我全复算过 ✓。
C 可 grep：44 条命中、**0 条查无**（含 `The importance of homework is clear.`、emphasise 卡 `The teacher emphasise the importance of homework.`、
  `The significance of this discovery changed science.`、`deep significance`、1047–1050 四张旁卡的 `aid organisation`/`farmers' association`/`union flag`/`community`）。
D 宽度：默认行 标称 35.5 / 实测 35.5 ✓；总结句 标称 27.0 / 实测 27.0 ✓；`core` ≤12 ✓。
E 义项照抄：全组零命中（「重要性」「意义」只在 `sense` 槽与 diff 的"卡上给不给第二档"格，那是登记卡档不是宣称本段同指）✓。
F 同源诚实：OK。"卡上词伙 `deep significance` 与 1046 同源、算 1 条"✓；"importance 卡 `ex` 与 emphasise 卡 `ex` 是同一条短语 → 合并计 1 条"✓
  这是本批次最正确的两次跨卡合并之一；两侧各 2 条复算无误 ✓；"importance 卡 `note` 是空串"✓（原文 `note: ""`）。
判定：**需作者改（MISMATCH）**。问题不在卡片字段，在段首那句：「这一段在讲什么」写"上篇·跨国列车，**刚进第二国**" ——
  这是从段 27 的 `paraZh`（「进入第二国后，田野开阔……」）搬来的，**段27 六句里没有任何一处提到进第二国**
  （我全章扫过：「第二国」只出现在 949 / 1024 / 1114 三句，分别在段11 / 23 / 38；「田野开阔」全章 0 处）。
  最小清单：把「刚进第二国」删掉或改成"段主题栏这样写，本组按句子写"。
  另一处请顺手 soften（不改判）：证据强度说"共享义项「重要性」在本段两处都成立"，而 1046 的 `sentZh` 走的是「意义多么重大」＝significance 卡 `m` 的第二档；
  说"两处都在讲有多当回事"更贴原文。这不是 §五.11 拦的方向（没虚构撞），故只记备注。

---

## 组 88 · abroad / overseas（3_08 组2）
A 原文表：OK。表 6 行（1057–1062）逐字全对 ✓（1060 那句长句也逐字一致，标点分号/引号都在）。
B 句号与共现：OK。两词各 1 处标记（1061 overseas / 1062 abroad），未标词头写法也各 1 处 ✓；"顺序与 worklist 相反"✓；
  "同档邻居"1064 `emigrate` / 1065 `immigrate` 在段30 ✓ 两句原文与译文（移居国外 / 移居到新的国家）逐字核 ✓，两卡都存在 ✓。
C 可 grep：56 条命中、**0 条查无**。卡外证据我一条条回原文捞过：`He went abroad to study medicine.`（abroad ex）、
  `He moved overseas for work.`（overseas ex）、`travel overseas`/`source from overseas`（overseas 词伙）、
  `ship abroad`/`sell overseas`（export 卡**同义词栏**，不是词伙段 —— 草稿标的字段是对的 ✓）、
  `purchase abroad`（import 卡同义词栏 ✓）、`He got an opportunity to work abroad.`（opportunity ex ✓）、
  overseas 卡同义词栏 `international, worldwide` ✓、worldwide 卡同义词栏 `global, international` ✓。
  并验了"international 还没卡"✓（`vocab.json` 无该键）。
D 宽度：默认行 38.5 ✓；总结句 25.5 ✓。
E 义项照抄：`core`（人出去那件事 / 隔着海的那一头）、默认行、总结句零义项词 ✓（「在国外」「海外」只在 `sense` 槽）。
F 同源诚实：**本切片最厚的一组，数数也最干净**：abroad 侧 5 条 = 1062（卡词伙同源合并）+ 卡 ex + opportunity ex + ship abroad + purchase abroad ✓；
  overseas 侧 5 条 = 1061 + 卡 ex + 2 词伙 + sell overseas ✓；"本书 5 条 abroad 串全紧跟动词或引号、没有一条走 from 框架"我逐条看过 ✓ 成立；
  并明写"'abroad 不跟 from'是本书 5 条串的计数，不是通用禁令"、"overseas 形容词档本书 0 处用到，不许落地时升级" ✓ 没有把"本书恰好这么写"升级成规则。
判定：**可落地（OK）**。段首「夜深了，车厢安静」虽与 `paraZh` 同字，但 1058 `the ride home stayed quiet` 与 1061 `the night train` 本身撑得住，
  不算把主题栏当内容 —— 这一组我给过，理由是**句子给得出同样的说法**。

---

## 组 89 · asylum / refuge（3_08 组3）
A 原文表：OK。表 6 行（1075–1080）逐字全对 ✓；1075/1076 加粗与标记一致 ✓。
B 句号与共现：OK。两词各 1 处标记（1075 refuge / 1076 asylum），未标词头写法各 1 处 ✓；"与组 4 同挂段32 末"✓（1077/1078 同段 ✓）。
C 可 grep：53 条命中、**0 条查无**（`The old building now serves as an asylum for the homeless.`、`The animals found refuge in the forest.`、
  `city asylum`/`quiet refuge` 两词伙、shelter 卡的 `provide shelter` 与 `The refugees found shelter in a small building.`、
  772 `a safe shelter for kittens`（= 数组第 3 章段20 ✓ 草稿写"章2 段20"沿用草稿编号 ✓）、1381 `Deep burrows shelter rabbits` ✓）。
D 宽度：默认行 39.5 ✓（本 12 组里最贴上限的一条，复算 39.5，未超）；总结句 24.0 ✓。
E 义项照抄：`core`（城里那间收人的地方 / 能躲进去的那一处）、默认行、总结句零义项词 ✓。
  表头用"两个『避难所』挨着出场"引用义项、同句以（译「避难所」）／（译「收容所」）＋"本段谁也没在收留难民"当场限定 ✓
  且我核了 1075/1076 的 `sentZh` 确实一个「避难所」一个「收容所」✓ → 该段真撞、写法属 §五.11 豁免，放行。
F 同源诚实：OK。"两卡唯一词伙就是课文这两句、不重复计"✓；两侧各 2 条 ✓ 复算无误；
  冠词那行明写"各 1 条证据，别当规则"、边界里再点名"落地时请把它读成两条卡各自的写法" ✓ 没有升级。
判定：**需作者改（MISMATCH）**。段首「这一段在讲什么」写"中午在小站停靠，买了热汤" —— 全章 grep：**「停靠」0 处、「汤」只在 1195（段52）出现一次**，
  段32 六句（避难所／收容所／人口牌子／人口统计图／排队公民／小店猫）里没有停站也没有热汤。这一句是从 `paraZh` 搬的。
  最小清单：删掉"中午在小站停靠，买了热汤"（后半段"父亲先带孩子去看面包店后面…"全部按句子写的，保留）。

---

## 组 90 · demographic / population（3_08 组4）
A 原文表：OK。表 6 行（1075–1080，与组 3 同段重复列出）逐字全对 ✓；1077/1078 加粗与标记一致 ✓。
B 句号与共现：OK。两词各 1 处标记（1077 population / 1078 demographic），未标词头写法各 1 处 ✓。
C 可 grep：65 条命中、**0 条查无**。7 张跨卡串我逐个回 `vocab.json` 捞原文，全部存在且字段标得对：
  `population explosion`（explosion 词伙）、`the general population`（general 词伙，同栏确有 `the general public` ✓）、
  `population density`（density 词伙）、`population is mobile`（mobile 词伙）、`the village population`（decimation ex 子串 ✓）、
  `The resident population grew last year.`（resident ex ✓，其 `exZh` 确为「居住人口去年增加了」✓）、`population growth`（growth 词伙，与 population 卡同串 ✓）。
  另核 `The survey collected demographic data like age and income.`（demographic ex ✓）、`changing demographics`（词伙 ✓）、
  `ageing population`/`population ageing`/`population growth`（population 卡 3 条词伙 ✓）、`the resident cats` 确在 1080 ✓。
D 宽度：默认行 37.0 ✓；总结句 27.5 ✓。
E 义项照抄：`core`（按年龄收入分开的那套 / 一共多少人那个数）、默认行、总结句零义项词 ✓。
  表头是 §五.11 的合规句式（"worklist 说共同义项是『人口』，可本段一个是名词那个数、一个是形容词那张图"）✓，
  且事实我核过：demographic 卡 `m` 只有 `adj. 人口统计的；人口的`（确无名词档）、1078 译文「人口统计图」✓、1077 译文「这个镇的人口」✓；
  边界里补了 §五.6 要求的"本书没这样用过"那一句 ✓。
F 同源诚实：**数字算错（本组唯一硬伤，但是往小里报错、不是虚报）**。证据强度那条写
  "课文 1077 + 卡 ex + 卡上 3 条词伙 + 挂在别人卡上的 6 条串 = **9 条**"，按它自己列的加数是 **1+1+3+6 = 11 条**；
  7 张跨卡里 `population growth` 与 population 卡同串已合并、余下确为 6 条，所以独立文本应是 **11**（9 这个数还同时出现在本组标题行、文件头小结"2–9 条"和附表"9 条 vs 3 条"）。
  demographic 侧 3 条 ✓ 复算正确。合并思路（§五.8）本身没问题，纯粹是加法漏了 2。
判定：**需作者改（MISMATCH）**。最小清单：① 把 population 侧 9 条改成 11 条（同段落标题行、文件头小结、附表三处一起改）；
  ② 段首"中午在小站停靠"同样是 `paraZh` 搬来的（全章「停靠」0 处），删掉。

---

## 组 91 · ethnic / racial（3_08 组5）
A 原文表：OK。表 6 行（1081–1086）逐字全对 ✓；1081/1082 加粗与标记一致 ✓。
B 句号与共现：OK。两词各 1 处标记（1081 ethnic / 1082 racial），未标词头写法各 1 处 ✓。
C 可 grep：44 条命中；查无 3 条（`ethnic minority`/`racial equality`/`interethnic`）全在"本书查不到的搭配一律不写"行 ✓ 反向验回 0 命中。
  正证据侧我另核了：`The festival celebrates ethnic music and dance.` ✓、`He faced racial discrimination at work.` ✓、
  `racial discrimination`＋`racial tensions`（racial 卡确为这 2 条词伙 ✓）、ethnic 卡唯一词伙 `ethnic group` ✓、
  1083 `the old mountain clan` ✓（clan 卡词伙确有 `mountain clan, old mountain clan` ✓）、508 `a distant tribe` ✓、1056 `our nation` ✓。
D 宽度：默认行 39.5 ✓；总结句 20.0 ✓。
E 义项照抄：`core`/默认行/总结句零义项词 ✓（「民族的」「种族的」只在 `sense` 槽）。
  表头引用共同义项"种族"并当场否定（"本段只有 1082 真走这一档，1081 走的是 ethnic 卡上第一档"）✓，
  我核了 1081 `sentZh`「她自己民族的歌」、1082 `sentZh`「许多不同种族的人」✓ 完全属实 → §五.11 豁免，边界里也补了"本书没把 ethnic 译成『种族的』用过" ✓。
F 同源诚实：OK。"卡词伙 `ethnic group` 与 1081 同源合并"✓、"`racial discrimination` 卡 ex 与词伙同串、合并计 1 条"✓、
  两侧各 2 条 + 1 条未用过的 `racial tensions` ✓ 复算无误；"真正硬的区别只有一条方向…属本书口径"✓。
判定：**需作者改（MISMATCH）**。① 段首第一句"下午穿过村庄，孩子们挥手、父亲也挥手"是 `paraZh`[33] 的原文，
  **段33 六句里没有村庄也没有挥手**（全章「挥手」仅 956（段12）一处、「村庄」仅 1142（段43）一处）—— 删掉，或按 3_07 的写法改成报备句。
  ② "本组是本切片唯一触发 §五.6 的组"与本文件组 4 自述"（§五.6 已按此处理）"自相矛盾，实际组 4、组 5 两组都触发了，请改成"两组之一"。

---

## 组 92 · perspective / viewpoint（3_09 组1）
A 原文表：OK。表 6 行（1099–1104）逐字全对 ✓（1104 那句含两个问号的长句也一致）；1102/1103 加粗与标记一致 ✓。
B 句号与共现：OK。`perspective` 标记 1 处（1102）、`viewpoint` 1 处（1103），紧邻两句 ✓；段36 = 1099–1104（883 + 前 36 段累计 216）✓；
  `paras` 只有一处 ✓。同段邻居卡：1104 standpoint ✓、1101 prospect ✓ 都核过标记；**1105 outlook 在段37 不在"同段"**（见判定，只算措辞笔误）。
C 可 grep：50 条命中。查无 4 条（`from my perspective`/`a narrow viewpoint`/`point of view`/`perspectives`）全在"本书没有的搭配一律不写"行 ✓
  反向验回 0 命中（`\bperspectives?\b` 全库扫下来确实没有复数形）。正证据逐条回捞：
  `His perspective on life is very positive.` ✓ 与 `exZh`「他对生活的看法非常积极。」✓；`in perspective` 确在 perspective 卡 note（「in perspective=正确看待」✓）；
  `His viewpoint is different from mine.` ✓ `exZh`「他的观点与我的不同。」✓；viewpoint 卡 note 那行分工原文逐字一致 ✓ 且**确实没有「同义词：」栏** ✓；
  attitude 卡 `同义词：opinion, perspective` ✓、opinion 卡 `同义词：attitude, perspective` ✓（"两卡都回列 perspective、viewpoint 没有这种回列"成立 ✓）；
  `bring diverse viewpoints` 确在 diverse 卡词伙、且是**全书唯一一处 viewpoint 复数**（课文 0 处 ✓）。
D 宽度：默认行 标称 37.5 / 实测 37.5 ✓；总结句 标称 25.0 / 实测 25.0 ✓；`core` ≤12 ✓。
  （文件头"audit_ledger.py 报 0 组超限"我没跑那个工具，用 `width()` 自己复算了 4 条，读数与草稿标称逐位相同。）
E 义项照抄：`core`（别人递到你手上那一下 / 你自己说出口的那套）、默认行、总结句零义项词 ✓。
  表头引用共同义项"观点"并当场否定（"本书译文里 perspective 走的是「角度」、只有 viewpoint 走「看法」"）✓
  我核了 1102 `sentZh`「一个从没想过的角度看它」、1103 `sentZh`「说完了自己的看法」✓ 完全属实 → §五.11 豁免，且边界里补了 §五.6 那句 ✓。
F 同源诚实：OK。"卡上词伙（fresh perspective / whole viewpoint）与课文那句是同一处 → 同源合并"✓；
  "两侧各 3 条独立文本（课文 1 + 卡 ex 1 + note 另 1 条）"复算正确 ✓；
  "本书 perspective 从没译成『观点』"这条我给了一句补充（见判定）但不影响计数；没有把 standpoint 卡那条"比 viewpoint 更正式"拉进本组当判据 ✓ 边界写得很干净。
判定：**可落地（OK）**，两处顺手改（不改判）：① 段首"同段 1104 还站着 standpoint 一张卡、1101 站着 prospect、**1105 站着 outlook**"——
  1105 是段37 第 0 句，把"同段"改成"本段与下段头一句"即可（我没升成 MISMATCH 的理由：outlook 的标记本身是真的，错的只是范围词；
  与组 83 那条"把未标词头的裸词说成挂在同段的卡"不是一类）。② "「观点」三字在本组只出现在 viewpoint 卡 `exZh` 和两卡 `m` 里"少算了一处：
  viewpoint 卡 `note` 的「个人观点」里也有 —— 同一张卡，结论不变。

---

## 组 93 · declare / proclaim（3_09 组2）
A 原文表：OK。表 6 行（1111–1116）逐字全对 ✓（1113 的冒号、1114 的两个短句都在）；1111/1114 加粗与标记一致 ✓。
B 句号与共现：OK。`declare` 1 处（1111）、`proclaim` 1 处（1114），同段（段38 = 1111–1116）不相邻 ✓；
  "中间隔着 affirm、claim 两张别的卡"✓（1112 heads=affirm/promise/plain，1113 heads=claim）；
  worklist 94 = announce/declare、95 = affirm/declare、三组同挂 [3,38] ✓ 我回 `work/compare_groups_worklist.json` 核过 ✓。
C 可 grep：50 条命中。查无 5 条（`declare war`/`proclaim independence`/`declaration`/`proclamation`/`publicly proclaim`）
  全在"本书 0 处的搭配与派生形"否定行 ✓ 反向验回 0 命中；作者自报"全书 grep 只有 declare/declared/proclaim/proclaimed 四个形"
  我用 `declar\w*` / `proclaim\w*` 重扫全库（含未标词头与 vocab 字段）✓ **确实是这四个形，无第五条**。
  正证据：两卡 `ex`/`exZh` 逐字一致 ✓；两卡 `note` 各只一句分工、**确无「词伙：」与「同义词：」栏** ✓；
  "declare 两处中文都是「宣布」"、"proclaim 只有卡 `exZh` 写「宣告」"我逐字比过 1111/1114 的 `sentZh` 与两卡 `exZh` ✓ 全对。
D 宽度：默认行 标称 38.5 / 实测 38.5 ✓；总结句 标称 24.5 / 实测 24.5 ✓。
E 义项照抄：`core`（一句话把事情定下 / 当众念给一群人听）、默认行、总结句零义项词 ✓。
  表头引用共同义项"宣告"＋当场否定（"本书译文两处都印成「宣布」，中文这条路根本分不开它们"）✓ §五.11 豁免。
F 同源诚实：**本 12 组里我最认可的一处诚实**：作者主动点破"卡上语域标注反着来"——declare 的 note 也写着「正式宣布」、proclaim 写「官方口吻」，
  因此**拒绝**写"declare 偏日常、proclaim 偏正式"，只写"本书 2 处 proclaim 的说话人都是官、declare 有 1 处是父亲"的计数 ✓
  我把两条 note 与三处主语（Father / a guard / The king）都核过，成立；两侧各 2 条独立文本、4 条总数复算无误 ✓。
判定：**可落地（OK）**。作者提请拍板的"declare 被 93/94/95 三组共用、note 载体归谁"—— 这是渲染/落地层的归属决定，
  **内容层不冲突**（三组切入角确实不重复：本组=谁在说+宾语哪样东西；announce 组=报站；affirm 组=把话说实），建议载体给 93、另两组用 announce / affirm 当载体。
  另：本组引用了 `tools/land_compare.py` 的"一个词头一个 note"约束，超出我的只读范围，**我没有验这条**（如落地层要按它决策，请作者或 owner 自证）。

---

# paraZh 专项：3_07 作者报的跨组口径问题，我独立核过的结论

**这条成立，而且比作者报的更严重：它是章3 独有的数组缺陷，不是"个别段对不上"。**

1. **结构证据（硬）**：`sections.json` 第 4 个元素（草稿称章3「社会与规则」）有 66 段、`paraZh` 也有 66 条，但**只有 44 条不同文本**：
   去掉尾缀「 灯下团聚，欢语不断。」后 `paraZh[i] == paraZh[i+22]` 对 i=0…21 **全部相等**。也就是上篇 44 段是把同一份 22 条主题表**套了两遍**。
   其余 5 章零重复（58/52/40/36/56 条各不重复）。`subheads` 显示上篇正是段 0–43 —— 与"插过句、段落被劈开"的说法吻合。
2. **内容证据（硬）**：主题栏里的具体物件在本章根本没有对应句子 —— 「停靠」全章 0 处、「热汤/汤」只在 1195（段52）出现过、「点心」0 处、
   「选情」0 处、「田野开阔」0 处、「黄昏」0 处；「挥手」全章只有 956（段12）一处，而主题栏把它写给了段11 **和**段33 两段。
3. **机检打分（粗筛，方法：主题串 2-gram 命中率 vs 该段全部 `sentZh`）**：章3 平均 0.10、只有 28/66 段"自身得分最高"；
   对照 章1 0.20/40-51、章2 0.28/39-40、章4 0.33/35-36、章5 0.17/37-56。**章3 明显是离群的那一章**；但章5 也只有 66%，所以这条口径不该只给章3 开。
4. **同一句主题在两段里"一段像、一段不像"**：「深夜回到车厢，父亲总结几国的见闻，说世界很大」——3_07 组3 判段16「大体相合」（确有 982 At midnight + 983 父亲把一路看过的填进去），
   而同一串挂到段38（1111 天刚亮上车…）就完全不合。说明**这是重复数组造成的巧合，不能按"多数能对上"放行**。

**建议口径（给下游 24 个切片直接照用，不含糊）：**

- **段主题栏不是出处。** 辨析卡的任何判据、任何"本书这样写过"的断言，只能来自 `paragraphs[段][句]` 与 `sentZh`（这两份才是句子级原文）。
  主题栏不参与 A–F 任何一行的"证据"，也不进「该段原文」表。
- **允许逐字引用，但必须标明是 `paraZh`、并且不得当段落内容写。** 本 12 组对 `paraZh` 的 12 处引用**逐字都准确**（含尾缀），
  出事的是 3_08 的四组把主题栏的句子搬进了「这一段在讲什么」——**引用对、当内容错**，这两件事要分开管。
- **章3 上篇（段 0–43）一律按"主题栏不可用"处理**，不得据它写任何一句话（理由：数组重复且普遍不吻合，无法逐段判断哪一遍是真的）。
- 其余章与章3 下篇（段 44–65）：可作背景，**但只许写句子撑得住的部分**（如 3_08 组2「夜深了，车厢安静」有 1058/1061 自己撑着，我给过）。
- **推荐模板句**：把 3_07 的报备写法升级成全批次固定格式 —— 「段主题栏写的是『X』（与本段句子不合，本组按句子写）」，
  这样下游切片既不必逐段再判断，也不会把主题栏当内容。
- 数据侧（不属我的改动权限，只提请注意）：若要根治，得重生成或置空章3 上篇的 `paraZh`；`validate_data.py` 可以加一条
  "同章 `paraZh` 重复率"检查（章3 上篇会立刻命中）。**我没有动 `scripts/` 或 `shadow/data/` 任何文件。**

---

# 作者提请拍板项 · 我的判断（逐条）

1. **"段内分布算不算主判据"（3_07 组1 / 组2 / 组5，共 3 组）** → **算，不该降级**。三组的差别都写在具体句子的句法位置上
   （951/954 有人 describe/tell vs 952 在屏幕里；971 was built 被动 vs 972 cuts/brings 主动；1001 at full speed 作状语 vs 1002 reach the velocity + of 所属），
   我逐句回 `paragraphs` 原文核过，**是课文给的，不是作者推的语义**。这些卡片的 `note` 确实给不出第二判据（多数是空串或只 1 条与课文同源的词伙），
   降级成"义项 + 各 1 句 ex"等于把辨析卡退回复述中文 —— 与 §三.4「不许复述中文义项」正好相反。
2. **"共享义项名不副实要不要退回"（3_07 组3 defer/delay、3_08 组4 demographic/population、组5 ethnic/racial、3_09 组1 perspective/viewpoint）**
   → **一律不退回**，四组的 §五.6 处置都到位（义项只在 `sense` 槽、表头引用＋当场否定、边界补"本书没这样用过"），四组的否定句我逐条回数据验过**全部属实**。
3. **"卡上一侧完全空白要不要退回"（3_07 组5 velocity `note` 空串、组3 defer 零词伙、3_08 组1 importance `note` 空串）** → **不退回**（§五.7），三处如实报备即可。
4. **"declare 被 93/94/95 三组共用，note 载体给谁"** → 内容层三组切入角确实不重复，载体给 93、另两组改用 announce / affirm 当载体即可；
   它引的 `land_compare.py` 约束我没验（超出只读范围）。
5. **"paraZh 还作不作数"** → 见上节：**不作出处、可逐字引用但不得当内容、章3 上篇一律按不可用**。

---

# 汇总

| 组 | idx | 词 | 判定 | 必须改的最小清单 |
|---|---|---|---|---|
| 3_07 组1 | 82 | sailor / seaman | **OK** | — |
| 3_07 组2 | 83 | railroad / railway | **MISMATCH** | 段14 卡片清单里 `dawn` 并未标词头（是裸词 at dawn）、"六张"实为 9 张 → 改这半句 |
| 3_07 组3 | 84 | defer / delay | **OK** | — |
| 3_07 组4 | 85 | package / parcel | **OK** | （可选）`a package of + 内容` 改成中文模板写法 |
| 3_07 组5 | 86 | speed / velocity | **OK** | （顺手）swift 卡 `m` 原文是「迅速的；快的；n. 雨燕」 |
| 3_08 组1 | 87 | importance / significance | **MISMATCH** | 删「刚进第二国」（段27 无据，来自 paraZh[27]） |
| 3_08 组2 | 88 | abroad / overseas | **OK** | — |
| 3_08 组3 | 89 | asylum / refuge | **MISMATCH** | 删「中午在小站停靠，买了热汤」（全章「停靠」0 处、「汤」仅 1195） |
| 3_08 组4 | 90 | demographic / population | **MISMATCH** | population 侧独立文本 9 → **11**（三处联动）；删「中午在小站停靠」 |
| 3_08 组5 | 91 | ethnic / racial | **MISMATCH** | 删「下午穿过村庄，孩子们挥手」（全章「挥手」仅 956）；"本切片唯一触发 §五.6 的组"→ 与组 4 自述矛盾，改"两组之一" |
| 3_09 组1 | 92 | perspective / viewpoint | **OK** | （顺手）"同段…1105 outlook"改"本段与下段头一句"；「观点」出现处补 viewpoint 卡 `note` |
| 3_09 组2 | 93 | declare / proclaim | **OK** | — |

- **A（原文表逐字）12/12 全过**：72 行英文＋中文全部回 `sections.json` 逐字比对（去标记后），零差异 —— 含最容易错的 950/1060 长句与 1104 的双问句。
- **B（句号与共现）12/12 成员位置全对**；唯一不符是组 83 的"同段挂着哪些卡"。
- **C（正证据可 grep）**：三份草稿共 **685 条**反引号英文串（脚本逐条查 `sections.json` 表面形式 + `vocab.json` 的 `m/ex/exZh/note`；
  字段名与命令路径类 token 不计）→ **命中 657 条**；查无 28 条里 **26 条明确落在"本书 0 处／不写"否定行、且我反向验回确实全书 0 命中**，
  另 2 条（`Father said ...` 省略形、`a package of + 内容` 中文模板）回原文验为真实句子的合法截写 → **没有一条假证据被当成正证据用**。
- **D（宽度）24/24 标称值与 `width()` 实测逐位吻合**（默认行最大 39.5、总结句最大 27.5），无一条 >40 / >30，作者也没往 45 抬。
- **E（义项）`core`／默认行／总结句 12 组零违规**；表头 8 组出现义项字样，逐组核下来全部是"引用＋当场否定"或如实登记译文相同（且该段确实撞），无一例"宣称都指 X 而实际不撞"。
- **F（同源与厚度）**：§五.8 的合并在 12/12 组都点名执行（`old sailor`/`deep significance`/`city asylum`/`full speed`/`whole viewpoint`/`racial discrimination`/`study abroad` 等 15 处），
  唯一的数字错是组 90 的 9→11（往小里报）；无一组把同源算成两条独立出处，也无一组拿"证据薄"当退回理由。
- 另需 owner 知悉：3_09 文件头自报跑过 `tools/land_compare.py --dry-run` 并覆盖了 `work/辨析审核/land_preview.json`（后用 `git checkout --` 还原）。
  我核 `git status --porcelain work/辨析审核/`：**该文件当前无未提交改动**，自述成立；但那次写操作超出"只写自己草稿"的边界，请口头提醒一次。
- 本审核未修改任何草稿、数据、脚本或测试；未做任何 git 写操作。全文只写了本文件。


