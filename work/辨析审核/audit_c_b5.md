# 门禁 2 审核 · 批次 5 / 切片 32+33（5_05 + 5_06，worklist_idx 156–165，章5）

审核者独立执行：只读 `shadow/data/sections.json`、`shadow/data/vocab.json` 与两份草稿；只写本文件。
未跑 `tools/land_compare.py`，未做任何 git 写操作，未改草稿/数据。

- 组数 10 / BLOCK 3 / MISMATCH 3 / 通过 4
- 机检口径全部自己重算：A 用脚本把两份草稿 **52 行「该段原文」表格逐字** 与数据（去 `[[词头:表面]]` 标记后）比对（英文＋`sentZh` 双栏），**0 行不符**；
  B 独立重建 1833 句全局索引（章偏移实测 `[0,339,651,883,1277,1492]`，总句数 1833，与 BRIEF §二 一致），逐组回算句号；
  C 独立扫两份草稿 **345 个 code span** + 非 code span 的英文串（门禁 1 的盲区），正证据逐条回原文；
  D 20 条宽度全部用 `tools/width_rule.width()` 复量，**20/20 与标称一字不差**；
  E 用脚本按卡 `m` 切档后逐槽（表头／默认行／总结句／core）扫命中；
  F 逐条核「同源」标注，并对 10 组的全部否定行（"本书没有／0 处"）逐条回数据自查。

## 组 156 · reverse / undo（5_05 组1，段 [5,10]）

- A 原文表：**OK** —— 6 行（1552–1557）英文＋中文逐字回数据，标点/单复数/时态全对（脚本比对，非目测）。
- B 句号与共现：**OK** —— 自算 1552 起、1554＝段内第 2 句、1557＝第 5 句，与切片 `sents` 对得上；`[[undo:undo]]`、`[[reverse:reverse]]` 实测就在段 10 那两句里。计数分档复算：reverse 标 1 / 未标 0；undo 标 1 / 未标 1（1516 `the twist in the rope undone`，章5 段4 第 0 句）→ 草稿写法与实测完全一致。
- C 可 grep：正证据 14 条全部亲查到（1554/1557 全句与子串、1516、两卡 `ex`、reverse 三条款、`reverse habitat destruction` 确在 destruction＋habitat 两卡）。否定行自查：「『倒车』档本书 0 处」✓（reverse 全书仅 1557 一处）；「reverse 未打标记 0 处」✓；「undo 的 2 处宾语全是真绳子」✓（knot / twist in the rope）。查无但已标成否定行的：`revoked`、`annul`（在「不写的」栏）→ 放行。
- D 宽度：默认行 标称 38.0 / 实测 **38.0**；总结句 标称 20.5 / 实测 **20.5** → 过。附带：`undo` 的 `core`「把结开解 / 把点错的退回去」实测 **12.5**，超 §三 items 栏的 ≤12（非 A–F 硬约束），建议缩成「把结开解 / 把点错的收回」= 11.5。
- E 义项照抄：**OK** —— 「撤销」只出现在 `sense` 与表头的"引用＋当场否定"位（§五.11 豁免形状，且我复核该否定为真：本段 undo 译「解开」、1516 译「解开了」）；`core`、默认行、总结句脚本扫 0 命中。
- F 同源诚实：**OK** —— 卡词伙 3 条明写"课文未用到"、跨卡同串（destruction / habitat）主动并成 1 条；没有把同一处文本算两次。
- **判定：通过（可落地）**；唯一建议是 `core` 那 0.5 的超长，属措辞不属事实。
- **拍板 1（作者提请：义项只单侧）→ 不退。** §五.6 已把处置定死：标题改写成"各领哪样东西"＋义项留 `sense`＋数据边界报备"本书课文没这样用过"，三件草稿全做了，且事实成立（undo 侧「撤销」档唯一书证在卡 `ex`，数字场景）。"接实物结 vs 接决定"这条线有 1554 / 1516 / 1557 三处可 grep，正是 §四 要的"哪样东西"层区别；"证据薄"按 §五.7 不构成退回理由。

## 组 157 · recover / restore（5_05 组2，段 [5,13]）

- A 原文表：**OK** —— 6 行（1570–1575）英文＋中文逐字对得上。
- B 句号与共现：**OK** —— 1571／1572 各＝段 13 第 1／2 句，`[[recover]]`、`[[restore]]` 实测在句内；recover 标 1 / 未标 0、restore 标 1 / 未标 0，与草稿一致。
- C 可 grep：正证据 20 条全查到（两卡 `ex`、`exZh`、civil / curative 卡 `ex` 原句、`restore calm focus`＝restore 卡词伙＝1572 半句）。**但有一条引用号错了**：草稿两处（diff 行「卡上还给了哪档」＋出处清单）写"课文 198 另有一句 `No cage was used and the cells remained open`" —— 该句实测在**全局 312（章0 段53 第 4 句）**，全局 198 是 `Nothing felt hopeless once they learned how photosynthesis feeds green shoots.`。草稿同句还写「章0 段53」——**段落对、句号错**（差 114）。顺带：该句 `sentZh` 是「没有用到任何笼子，那个小隔间也一直敞开着」，cells 译作「小隔间」、cage 才是「笼子」，草稿"那里的 cells 是笼子"的定性按译文站不住。
- **另一条虚报（§五.15 那一族）**：「`recover` 的名词 `recovery` 本书 0 处（grep 过）」—— 实测 `recovery` **既是一张卡（词头就在 `vocab.json` 里），也出现在课文 1701**（`guiding her slow [[recovery:recovery]] day by day`，译「陪她一天天慢慢康复」）。→ 这句照写就会让下游修卡的人查空。
- D 宽度：默认行 标称 38.0 / 实测 **38.0**；总结句 标称 25.0 / 实测 **25.0** → 过。
- E 义项照抄：**OK** —— 表头「都在'恢复'」是**肯定式**引用，我回 `sentZh` 验实（1571「恢复体力」／1572「恢复平静专注」两侧都撞）→ 不属 §五.11 拦的"宣称而不撞"，与批次 3/4 已通过的同类写法一致；`core`（自己缓回来 / 被外物找回来）、默认行、总结句 0 命中卡 `m` 词。
- F 同源诚实：**OK** —— `restore calm focus`＝1572 主动并条，restore 侧因此只算 2 条并明写"薄的一侧是 restore"；`renew` 无卡（我查 ✓）、"restore 没被别的卡 used in ex、只有 revive 同义词栏列它"（我查 ✓：仅 revive.note）。
- **判定：需作者改（MISMATCH，2 处，都在"引用与存在性断言"上，不动内容骨架）**。最小清单：① 两处「课文 198」→「课文 312」，并把"cells 是笼子"改成"cells 译『小隔间』"（或整格删掉——它只用来报备一件与本组无关的事）；② 删掉"`recovery` 本书 0 处（grep 过）"，或改成"`recovery` 另有一张自己的卡、课文 1701 一处（不在本组成员里）"。

## 组 158 · amplify / augment（5_05 组3，段 [5,14]）

- A 原文表：**OK** —— 6 行（1576–1581）逐字对得上，含 1577「增加枯燥课文的可读性」这种"译文比原文多字"的格子也照抄无误。
- B 句号与共现：**OK** —— 1577＝段14 第 1 句、1578＝第 2 句，`[[augment]]`、`[[amplify]]` 实测在句内；amplify 标 1 / 未标 0、augment 标 1 / 未标 0 ✓。
- C 可 grep：17 条正证据全查到（两卡 `ex`、`amplify suffering` 确在 amplify＋suffering＋suffer **三卡**、`magnify tiny details` 确在 magnify 卡词伙、`soft voices`、`dull texts`、段内 1576/1579/1580/1581 全句）。否定行自查全部为真：`augmentation` 0 处 ✓、`amplified voice` 0 处 ✓、"augment 在别的卡 `ex`/`note` 里 0 次" ✓（我按词头逐卡扫，只有它自己那张）、"本书课文 `amplify suffering` 0 处" ✓。
- D 宽度：默认行 标称 37.5 / 实测 **37.5**；总结句 标称 21.0 / 实测 **21.0** → 过。
- E 义项照抄：**不符（本片唯一一处 E 命中，必须改）** —— 「放大」是 amplify 卡 `m` 的第一档（`m`＝「v. 放大；增强」），它进了**默认那一行**：`amplify = 话筒放大（soft voices）…`。按 AUDIT_BRIEF E 行与批次 3/4 审核的一致做法（"core、默认行、总结句 0 命中卡 m 词"是逐槽脚本报的），这一格＝BLOCK 级；表头那处「放大」在"引用＋修正"位，放行。`core`（把音量拧大的那台机器 / 往不够的东西里添料）与总结句 0 命中 ✓。
  最小修法（我已量过）：默认行改 `amplify = 话筒（soft voices），augment = 课文加料（augment dull texts）` = **35.5 ≤40**；或 `amplify = 话筒把轻声推大（soft voices），augment = 课文加料（dull texts）` = **36.5 ≤40**。两版都不掉钩子。
- F 同源诚实：**OK** —— `magnify tiny details`（magnify 卡词伙）＝1577、`amplify suffering` 三卡同串，两处都主动点名同源并各算 1 条；augment 卡 `note` 为空已明写"没有词伙段、没有同义词栏""没有第三条英文文本可引"。
- **判定：需作者改（BLOCK 级 1 处：默认行的「放大」）**，改一条 35.5 宽的行即可落地，内容骨架与全部书证不用动。
- **拍板 2（作者提请：augment 卡 note 全空＋amplify 档位错）→ 不退，且不必再拍。** 「增强」档对 amplify 侧确属 §五.6 的"档位错"（实测：amplify 全书 2 处文本 1578＋卡 ex 全走「放大」，「增强」只剩词伙 `amplify suffering`）；草稿按口径写明了"哪一档本书 0 处、书证在别处"，且**没有**升级成"amplify 没有增强义"（卡 `m` 两档照抄）—— 这正是 §五.6 要求的处置。`note` 全空按 §五.7 不是退回理由，只在「证据强度」如实报（已做）。

## 组 159 · ooze / seep（5_05 组4，段 [5,15]）

- A 原文表：**OK** —— 6 行（1582–1587）逐字对得上；1583 草稿写作「**Damp** air…」，数据是 `[[damp:Damp]]`，去标记后大写 Damp ✓。
- B 句号与共现：**OK** —— 切片 `sents` 只有 1583，两词确在同一句（`[[seep:seep]]` 与 `[[ooze:ooze]]` 实测都在段15 第 1 句）；ooze 标 1 / 未标 0、seep 标 1 / 未标 0 ✓（"1 段 1 句、两词挤在同一句"与数据一致）。
- C 可 grep：正证据 12 条全查到（1582/1583/1584 全句、两卡 `ex`＋`exZh`、`seeped through the cracks in the wall`、`Mud is oozing from the hole`）。否定行自查为真："别的卡的 `ex`/`note` 里 ooze、seep 都 0 次" ✓（我按词根 `ooz`、`seep` 扫全部卡，只命中各自那张）、"本书 2 处 seep 全带 through" ✓（1583＋卡 ex）、"ooze 没有 through 句" ✓、`oozed out`／`seep into` 各 0 处 ✓。
- D 宽度：默认行 标称 40.0 / 实测 **40.0**（顶格但没超，未触上限）；总结句 标称 16.0 / 实测 **16.0** → 过。
- E 义项照抄：**OK** —— 「渗出」「缓流」「淤泥」只在 `sense` 与表头的"引用＋当场否定（本段一处『渗入』一处『泛潮』、方向相反）"位；`core`（物件自己往外冒 / 穿过窄缝慢慢走）、默认行、总结句 0 命中 ✓。表头那处否定我回 `sentZh` 验实为真。
- F 同源诚实：**OK** —— 两卡无词伙段，草稿明写"本组没有词伙＝课文式同源""两词唯一共享的就是 1583 那一句，去掉它两侧各剩 1 条"，计数诚实；1583 只算 1 条文本、没当两条独立证据用。
- **判定：通过（可落地）**。附带提醒（不改也可）：默认行正好 40.0，落地时若加字必超。

## 组 160 · excuse / forgive（5_05 组5，段 [5,15]）

- A 原文表：**OK** —— 4 行（1584–1587）逐字对得上，与组 4 同段的行文字一致（无两版互斥）。
- B 句号与共现：**OK** —— 1585＝段15 第 3 句、1586＝第 4 句，`[[excuse:excuse]]`、`[[forgive:forgive]]` 实测在句内；excuse 标 1 ＋ 未标 1（1610 `lean on excuses`，章5 段19 第 4 句）／forgive 标 1 ＋ 未标 0，与草稿两档分写一致。
- C 可 grep：正证据 13 条全查到（1584–1587、两卡 `ex`/`exZh`、`fair excuse`＝excuse 卡词伙＝1585 半句、`saturate shoes` 确在 saturate 卡词伙、1610 全句）。否定行自查全部为真：`forgave`／`forgiven` 全书 0 处 ✓、"forgive 在别的卡 `ex`/`note` 里 0 次" ✓、"excuse 只在自身两行里出现" ✓、「『宽恕』0 处」✓（`宽恕` 全书只出现在 forgive 卡 `m` 自己那一格）、「『理由』这一落点本书译文没用过」✓（1585／1610 两译都是「借口」）。
- D 宽度：默认行 标称 39.0 / 实测 **39.0**；总结句 标称 24.5 / 实测 **24.5** → 过。
- E 义项照抄：**OK** —— 「原谅」「借口」在表头是"引用 worklist 义项＋当场指出它取自动词档、本段走名词档"（§五.11 豁免），`core`（替你圆过去的由头 / 把这笔账真放了）、默认行 0 命中；总结句「forgive 一出场就是原谅」在 E 行三个槽之外，且是正反对比不是复述义项 → 放行。
- F 同源诚实：**OK** —— `fair excuse`＝1585、`saturate shoes` 同源均已点名并合并计数（excuse 3 条 / forgive 2 条）；两条 `ex` 同帧但**句子不同**，草稿明确"不算同源、各算一侧"——正是 §五.14 第 ③ 点要求的写法。
- **一处必须改（MISMATCH）**：diff 首行 `用在哪` 格写「本书只让它当**名词**」—— `excuse` 卡 `ex`（`Please excuse me for being late.`）就是本书材料、就是动词，且草稿自己下一行、数据边界里都写了"动词档唯一书证在卡 ex""不升级成本书没有 excuse 作动词"。这一格与同组其余措辞口径相反，落地后读者只看那半格会被带偏。最小修法：改成「**本段**只让它当名词（可数的那样东西）」或「课文两处都是名词」。
- **判定：需作者改（MISMATCH 1 处措辞）**，其余可落地。
- **拍板 3（作者问：§五.14 的处置对不对）→ 处置正确，且按 §五.14 不必再提请拍板。** 我核到位：`all_synonyms` 的定义是"两卡『同义词：』栏有没有互列"（excuse `note` 只有词伙段、forgive `note` 为空 → false 有据），它结构上看不见例句形状；两卡 `ex` 只差词头与人称、`exZh` 同落「原谅」＝本书最强"可换"物证。三件齐（同形照写 ✓、补一句"两栏没互列故 false 有据" ✓、两句各算一侧 ✓）草稿全做了。**唯一要动的**是把文件头"提请拍板 3 处"里的这一条撤掉（§五.14 结尾就是"不再逐组提请拍板"），并把上面那半格措辞改掉。

## 组 161 · differentiate / distinguish（5_06 组1，段 [5,19]）

- A 原文表：**OK** —— 6 行（1606–1611）逐字对得上（含 1609 的 `[[foe:foes]]` 去标记后为 foes，草稿写 foes ✓）。
- B 句号与共现：**OK** —— 1609＝段19 第 3 句，两词同句分任一半，`[[differentiate]]`、`[[distinguish]]` 实测都在句内；differentiate 标 1 / 未标 0、distinguish 标 1 / 未标 1（164＝章0 段28 第 2 句，`He distinguished the celestial bodies from the terrestrial ones.` 逐字 ✓、`sentZh`「区分了开来」✓）→ 与草稿两档分写一致，切片 `sents` 对得上。
- C 可 grep：正证据 15 条全查到（两卡 `ex`/`exZh`、`differentiate between factual information and opinions`、distinguish 三条词伙、`distinguish between reality and fantasy` 确在 fantasy 卡词伙、1609/164 全句）。否定行自查为真：`inclination`／`distinction`／`differentiation` 全书 0 处 ✓、`distinguish yourself` 0 处 ✓、`within walking distance` 0 处 ✓、"本书没有任何一处 differentiate 接 the two teams 式句子" ✓（the two teams 只在卡上、课文 0 处）。
- D 宽度：默认行 标称 37.5 / 实测 **37.5**；总结句 标称 26.0 / 实测 **26.0** → 过。
- E 义项照抄：**OK** —— 表头「worklist 的共同义项'区分'两边都立得住」是肯定式，我回 `sentZh` 验实（1609 一处「区分开」一处「辨别清楚」，两卡 `m` 均含这档）→ 属 §六"名副其实"情形，不拦；「辨别」是 differentiate 第三档、草稿把它放在"译文各作什么"位不是区别位。`core`（掰开真话与假话 / 颜色一衬两队就认得出）、默认行、总结句 0 命中。
- F 同源诚实：**OK** —— `distinguish between reality and fantasy` 跨卡同串主动并条；"卡侧 differentiate ex 1＋词伙 1 / distinguish ex 1＋词伙 3"与卡面实测一致。
- **一处要改（MISMATCH，措辞过界）**：diff「谁在当主语」写"本书 differentiate 的 **3 条文本**（课文 1 + 卡 2）主语全是人" —— 第 3 条是词伙 `differentiate between factual information and opinions`，**根本没有主语**，不能计入主语分布。最小修法：改成"两处有主语的句子（1609＋卡 ex）主语都是人，词伙那条无主语、不算进来"。（与组 160 同族：把无主语词伙算进句法统计。）
- **判定：需作者改（MISMATCH 1 处）**，其余可落地。
- 作者另提请拍板（differentiate 全书仅 1 处书证）→ **不退**：§五.7 明写"证据薄不是退回理由"，且本组两条防线（同句分任一半＋两卡各拿"两种颜色"造句）都可 grep；「使有别于」那格草稿已自限"1 处、在卡上、别升级成通用规则"。此条不需他拍。

## 组 162 · incline / lean（5_06 组2，段 [5,19]）

- A 原文表：**OK** —— 3 行（1609–1611）逐字对得上。
- B 句号与共现：**OK** —— 1610＝段19 第 4 句，`[[incline]]`、`[[lean]]` 同句、共用 `would not … nor …` ✓；incline 标 1 / 未标 0；lean 标 1 / 未标 **3**（627 `leaned`＝章1 段47 第 4 句、693 `leaning`＝章2 段7 第 0 句、770 `leaning`＝章2 段20 第 1 句，三句原文与 `sentZh`「斜靠着门边」「扶正长长的墙架」「倾斜的棚子」逐字核过）→ 草稿两档分写与实测一致。
- C 可 grep：正证据 12 条全查到（incline 卡 `ex`/`exZh`、lean 卡 `ex`/`exZh`、1610 全句、627/693/770 全句、`leaning shed` 确在 shed 卡词伙、liable 卡「同义词：prone, inclined, responsible；词伙：still liable」逐字 ✓）。否定行自查全部为真：`lean to`／`leaned to`／`lean forward`／`lean on me`／`lean-to`／`inclination` 全书 0 处 ✓；"`inclined` 全书唯一一处在 liable 卡同义词栏" ✓（课文 0 处、别的卡也没有）；"本书 incline 一次没以 -ing 顶名词" ✓（课文无 inclining）。
- D 宽度：默认行 标称 40.0 / 实测 **40.0**（顶格未超，落地别加字）；总结句 标称 21.5 / 实测 **21.5** → 过。
- E 义项照抄：**OK（本片处置最标准的一组）** —— 表头「worklist 给的共同义项'倾斜'这一段谁都没占着」＝引用＋当场否定，我实测为真（1610 译「倾向于／依赖」，两词都不在斜）；「倾斜」在 items 里只进 `sense`/词性槽，`core`（往怒气那头偏 / 把自己搭上去）、默认行、总结句 0 命中卡 `m` 词。
- F 同源诚实：**OK** —— `leaning shed`＝770 主动并条；incline 2 条 / lean 5 条计数与实测一致；两卡 `note` 整栏为空已明写"卡侧证据只有各自的 ex""lean 卡上自己的例句根本没在斜也没在靠"。
- **一处 BLOCK（结构性，门禁 1 抓不到）**：items 表 `lean` 那一行**只有 6 列**（第 108 行）——「v. 倚靠；倾斜；adj. 瘦的」占掉了词性格，后面整排左移一格：`sense` 槽拿到「把自己搭上去」、`core` 槽拿到 scene 长句、`eg` 槽空。落地器按槽取数会直接产出一张没有例句、sense 写着中文钩子的卡。最小修法（只拆列，不改一字）：词性＝`v. + adj.`、`sense`＝`倚靠；倾斜；瘦的`、`core`＝`把自己搭上去`、`scene`＝`1610 不拿借口当支撑；627 球杆斜在球门框边；卡 ex 是只精瘦的狗（没在靠什么）`、`eg`＝`nor lean on excuses`（课文 1610）。
- **一处 MISMATCH（计数少一档）**：中文落点行写"lean 有「斜靠」「倾斜」「扶正」三种处理" —— 实测 **4** 种，漏了本句 1610 自己那处「依赖」；incline「只被译过一次」✓ 对。改成"四种（含本段「依赖」）"即可。
- **判定：需作者改（BLOCK 1 处＝拆列；MISMATCH 1 处＝补「依赖」）**，两处都是机械修，内容骨架与全部书证不用动。

## 组 163 · chin / jaw（5_06 组3，段 [5,22]）

- A 原文表：**OK** —— 6 行（1624–1629）逐字对得上（含 1628「又沉又重」这种译文加字，与 `sentZh` 一字不差）。
- B 句号与共现：**OK** —— 1625＝段22 第 1 句、1626＝第 2 句，`[[chin]]`、`[[jaw]]` 实测在句内；chin 标 1 / 未标 0、jaw 标 1 / 未标 0 ✓；`subheads[5][20]`＝「下篇·奶奶的健康年」✓（挂在段20，本段 22 的 subhead 是空串，草稿标的就是 [5][20]，没标错段）。
- C 可 grep：正证据 12 条全查到（两卡 `ex`/`exZh`、`small chin`＝chin 卡词伙＝1625、`stiff jaw`＝jaw 卡词伙＝1626、1624/1627 全句、paraZh 段22 逐字 ✓）。否定行自查为真：复数 `chins`／`jaws` 0 处 ✓、`chin up`／`drop your chin`／`jawbone`／`upper jaw`／`lower jaw` 全书 0 处 ✓、"本书给 chin 的修饰语只有'小'、给 jaw 的只有'僵'" ✓（两词在课文＋全部卡里各只出现 2 次，我已逐卡扫）、"「颏」「颚」「颌」三个汉字全书各只出现 1 次、都在这两卡 `m` 里" ✓（实测 sections 0 次、vocab 各 1 次）。
- D 宽度：默认行 标称 37.0 / 实测 **37.0**；总结句 标称 17.0 / 实测 **17.0** → 过。
- E 义项照抄：**OK** —— 表头「本书译文把两处都写作「下巴」」是肯定式，实测为真（1625「小小的下巴」、1626「僵硬的下巴」、两卡 `exZh` 也都「下巴」，四处无一例外）→ §六 名副其实，不拦；草稿紧接着把区别挪到英文动静（抬／摸 vs 僵／疼／磕）并写"中文帮不了这个忙"，正是 §五.4 要的写法。`core`、默认行、总结句 0 命中「下巴／颏／颚／颌」。
- F 同源诚实：**OK** —— 两卡词伙各自押在课文那句上，草稿两处都点名同源、两侧都只算 2 条独立文本，没有把同源并成"两处书证方向一致"。
- **判定：通过（可落地）**。提醒：默认行 37.0、`core` 8.0/7.0 都在线内。

## 组 164 · disease / illness（5_06 组4，段 [5,27]）

- A 原文表：**OK** —— 6 行（1655–1660）逐字对得上（1655「细菌培养检查」这种把 clone 译开的格子也照抄无误）。
- B 句号与共现：**OK** —— 1656＝段27 第 1 句，`[[disease]]`、`[[illness]]` 同句由 yet 串起 ✓；disease 标 1 / 未标 0、illness 标 **2**（1656、1756）/ 未标 0 ✓；1756＝章5 段44 第 0 句，原文与 `sentZh`「不再怨命运让自己生病」逐字核过。
- C 可 grep：正证据 22 条全查到，其中跨卡引用我逐张对过：disease 在 cause / immune / cure / confirm **四卡 `ex`** ✓、deal / prevent / cure / pest **四卡词伙** ✓（`pest disease`、`deal with unfamiliar diseases`、`cure diseases`、`prevent crime, prevent decay, prevent disease` 全部逐字在卡上）；illness 在 succumb / recover / mental / sanitary / common / diagnose **六卡 `ex`** ✓。复数计数：disease 复数 3 处 ✓、illness 复数 0 处 ✓（`illnesses` 全书 0）。否定行自查为真：`infectious disease`／`long-term illness`／`terminal illness`／`bedridden` 类 0 处 ✓、"chronic 本书挂的是 cough（1684 及 chronic 卡 ex）" ✓（1684 实测 `a [[chronic:chronic]] cough stayed for months`）。
- D 宽度：默认行 标称 39.0 / 实测 **39.0**；总结句 标称 28.0 / 实测 **28.0** → 过。
- E 义项照抄：**OK** —— 表头「共同义项'疾病'两侧都立得住（一处作「疾病」、一处作「小病」）」实测为真（1656 `sentZh` ✓）；`core`（检查单上那一项 / 在家扛的那阵子）、默认行、总结句 0 命中「疾病／病」。
- F 同源诚实：**OK** —— `prevent disease` 跨卡同串主动并条；9 条 / 10 条与实测一致；并自报反例（illness 也被 diagnose / prevent），没有把"检查单 vs 日子"升级成规则。
- **判定：通过（可落地）**。两条建议（不改不拦）：① "illness 的修饰语全在轻重常见与否"漏了 `mental illness`（mental 既非轻重也非常见），补半句"mental 属'哪一类'，仍不落部位"更稳；② "本书译文给 disease 的永远是名词"只有 1 处课文样本，建议改成"本书那 1 处"。

## 组 165 · invalid / patient（5_06 组5，段 [5,27]）

- A 原文表：**OK** —— 3 行（1658–1660）逐字对得上。
- B 句号与共现：**OK** —— 1659＝段27 第 4 句、1660＝第 5 句，`[[invalid]]`、`[[patient]]` 各在句内 ✓；invalid 标 1 / 未标 0 ✓；patient 标 **2**（1660、1822）/ 未标 **1**（1811 `weak patients`＝章5 段51 第 4 句，与 patient 卡词伙同串）✓ —— 三处原文与译文我逐字核过，两档分写与实测一致。
- C 可 grep：正证据 15 条全查到（`feel like an invalid`、`an invalid for weeks`、invalid/patient 两卡 `ex`+`exZh`、nurse/physician/isolate/nature 四卡 `ex` 原句、`calm patient`＝词伙＝1660、`weak patients`＝词伙＝1811、`former patient`＝former 卡词伙＝1822）。否定行自查为真：复数 `invalids`、`the invalid`、`bedridden`、`chronically ill` 全书 0 处 ✓；"除本卡外没有任何别的卡用过 invalid" ✓（逐卡扫 `invalid`，只命中它自己那张）；"patient 同义词栏是 tolerant / forbearing / calm（挂'有耐心的'档）" ✓ 逐字对。
- D 宽度：默认行 标称 38.5 / 实测 **38.5**；总结句 标称 25.0 / 实测 **25.0** → 过。
- E 义项照抄：**OK** —— 表头「一句'像病人'、一句真是病人」是肯定式且实测为真（1659「像病人一样瘫着」／1660「作为平静的病人」）→ 不属"宣称而不撞"；`core`、默认行、总结句 0 命中「病人／病弱者／无效的」；invalid 卡 `ex` 走「无效的」档这一格，草稿放在"卡例句站在哪一档"行并自限"卡上没演示指人"，写法合规。
- F 同源诚实：**OK** —— 三对词伙＝课文（calm patient／weak patients／former patient）全部点名同源；patient 约 7 条 / invalid 2 条与实测一致，且明写 invalid 那 2 条里"1 条还不在本组义项上"。
- **两处 BLOCK（结构性，门禁 1 抓不到）**：items 表 **invalid 与 patient 两行都只有 6 列**（第 331、332 行）——「n. 病人；病弱者；adj. 无效的」占掉词性格后整排左移，`sense` 槽拿到中文钩子（被击垮瘫几周 / 诊室里挂号的那位）、`eg` 槽空。最小修法（只拆列）：invalid → 词性 `n. + adj.`、`sense` `病人；病弱者；无效的`、`core` `被击垮瘫几周`、`scene` `1659 强壮的人被糖击垮后好几周像的那样；卡 ex 是过期的票（没人病着）`、`eg` `making her feel like an invalid for weeks`（课文 1659）；patient → 词性 `n. + adj.`、`sense` `病人；有耐心的`、`core` 现值、`scene` 现值、`eg` `As a calm patient, she told the nurse`（课文 1660）。
- **一处 MISMATCH（中文画面造字）**：patient 的 `core`「诊室里**挂号**的那位」—— 本书两份数据里 `挂号` 0 处（`诊所` 12 处、`医院` 3 处，所以"诊室里"站得住、"挂号"是造出来的细节；C 项只扫英文，这类中文造景门禁 1 看不见）。最小修法：`诊室里被围着的那位`（实测宽 9.0 ≤12，且"被围着"有 nurse / doctor / physician / hospital 四条卡 `ex` 撑）。
- **判定：需作者改（BLOCK 2 处＝拆列；MISMATCH 1 处＝core 造景）**，内容骨架与书证不用动。

---

## 给 BRIEF 的一条固定判据（incline/lean 与 excuse/forgive 属同族两端，一次写死）

> **「共现段撞不撞共同义项」只决定表头怎么写，不决定要不要出 diff 表；决定出不出表的是「全书有没有一条可 grep 的分工线」。**
> 三档处置，逐组照走、不再上报拍板：
> - **(a) 本段两头都撞** → 表头可直接说共同义项（须回 `sentZh` 验实），区别另找维度。
> - **(b) 本段不撞（含"档位错"：worklist 取动词档、共现段走名词档；含"两头各偏一义"）→ 一律出 diff 表**，条件是分工线在**全书任一处**可 grep（本段框架对立、物理档在卡 `ex`、别段书证、词形分布都算线）。写法固定三件：表头改写成"这一段两个词各领哪样东西"、worklist 义项只留 `sense` 槽、在「数据边界」点名"哪一档本书 0 处、那一档的书证在哪"，并不许升级成"本书没有这个词形/这种用法"。§五.6 结尾"同一口径处理，不必另立规则"就是这条的通用形，excuse/forgive（名词档 vs 动词档）与 incline/lean（两头都不撞）都是它的实例，差别只在"话说轻"要轻到"本段一个都没占着"。
> - **(c) 才降级为"只挂义项说明、不出 diff 表"**：当且仅当把本段、别段、两卡 `ex`／`note` 全扫完后，**两侧合起来仍凑不出一条 ≥2 处文本、且两词不同档的线**（等价于：能进表的搭配全来自同一句、或某一侧独立文本 0 条）。
> 两条反向提醒：**`note` 整栏为空不是降级理由**（§五.7），它只强制「证据强度」栏如实写"没有词伙段、没有同义词栏"；**false 也不是降级理由**（§五.14），两卡 `ex` 同帧只差词头反而是本书最强的"可换"物证，照写进「数据边界」即可，不必再提请拍板。

## 汇总

| 组 | worklist_idx | 判定 | 必修 |
|---|---|---|---|
| 156 reverse/undo | 156 | 通过 | （建议）core 12.5→11.5 |
| 157 recover/restore | 157 | MISMATCH | 课文 198→312＋cells 译「小隔间」；删/改 `recovery` 0 处虚报 |
| 158 amplify/augment | 158 | BLOCK | 默认行「放大」换字（已给 35.5/36.5 两版） |
| 159 ooze/seep | 159 | 通过 | — |
| 160 excuse/forgive | 160 | MISMATCH | 「本书只让它当名词」→「本段只让它当名词」；撤该组拍板请求 |
| 161 differentiate/distinguish | 161 | MISMATCH | 无主语词伙不计入主语分布 |
| 162 incline/lean | 162 | BLOCK | lean 行 6 列错位；中文落点 3→4 种（补「依赖」） |
| 163 chin/jaw | 163 | 通过 | — |
| 164 disease/illness | 164 | 通过 | （建议）补 mental、"永远"→"那 1 处" |
| 165 invalid/patient | 165 | BLOCK | invalid/patient 两行 6 列错位；core 造「挂号」 |

**5 处拍板的答复**：156 不退、158 不退（但默认行必改「放大」）、160 处置正确且按 §五.14 撤下拍板请求、162 **不出"只挂义项"的降级**、165 不退。理由统一走上文那条判据：这 5 组每一组都能从两份数据里挖出 ≥2 条、方向不同的可 grep 分工线，属 (b) 档；(c) 档一组都没有。
最严重一条不在上面任何"薄"或"义项"问题上，而在 **items 表 3 行掉成 6 列**（162 lean、165 invalid、165 patient）——它会静默产出 `sense` 写中文钩子、`eg` 空白的卡，门禁 1 只扫 code span 永远抓不到，落地前必须由作者拆列。
