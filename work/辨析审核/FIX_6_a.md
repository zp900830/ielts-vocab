# 修复记录 · 批次 6 前半 `6_01.md` + `6_02.md`（依据 `work/辨析审核/audit_a_b6.md`）· 2026-09-21

执行人：修复代理（FIX_6_a）。**本轮只改了两份草稿 `work/辨析草稿/6_01.md`、`work/辨析草稿/6_02.md` 与本文件**；未碰 `shadow/data/*`（含 `vocab.json` 里 `preserve` 卡 `note` 那个 `preserve wildife` 错字 —— 实测该串在 `shadow/data/vocab.json` 原文 1 处、`wildlife` 6 处，属数据侧，**只报不修**）、`scripts/*`、`tools/*`、`index.html`、`shadow/index.html`、别人的草稿（`6_03..6_09`、`5_*.md`）与任何 `audit_*.md`；**未跑 `tools/land_compare.py` 的任何模式**（含 `--dry-run` / `--check`）；无 git 写操作（只跑过 `git status --porcelain` 确认工作区）。**自证未跑写盘模式**：`work/辨析审核/land_preview.json` mtime 仍是 **2026-09-20 23:24:49**、`tools/width_samples.json` 仍是 **09-20 21:28:25**（本轮无人 `--bless`）。宽度一律用 `tools/width_rule.py` 那把尺；英文串与存在性断言全部自己回 `shadow/data/sections.json`、`shadow/data/vocab.json`、`work/compare_groups_worklist.json` 复扫后才落地。

本次范围：BLOCK 1（组179 的 `core` 复述卡 `m` 字面）＋ MISMATCH 6（组178、180、183、185、186、187），落到纸面共 **13 处**（含组178 一处随「条数改口」而来的连带更正）。组标题编号与成员顺序、`主锚点 = 章N 段M` 字段名一字未动；items／diff／原文表列数改后复算：`6_01.md` 82 个表格数据行、`6_02.md` 64 行，**列数不齐 0**。

## 对报告核心发现的独立复核（"17 个词头都不在任何辨析组"）

我没有采信报告，自己扫了三处：

1. `work/compare_groups_worklist.json` 实测 **220 组**；把 17 个词头逐个与全部成员词比对 —— **精确命中 0 条**，连"成员词字符串包含该词头"的宽松匹配也是 **0**（`sorrow / sadness / mourn / hesitate / guilty / embarrass / regret / repent / ashamed / ridiculous / stupid / careless / oblivious / insult / unkind / uneasy / fear`）。
2. `shadow/data/vocab.json` 实测 **181 张 `cmp` 卡**；"卡宿主词头 ∪ 各 `cmp.group` 成员"共 209 个词头，**17 头命中 0**。
3. 17 头**全部有自己的词卡**（`m`／`ex` 齐全，逐头开卡验过）—— 所以成立的说法是"有卡、不在任何辨析组里"，不成立的是"属别的组"。

唯一真属别组的是 `doubt / sceptical / suspicion`：worklist_idx **216**、`paras` = `[[5,48]]`、`sents` = `[1784,1785]`、`words` 三头齐；它落在 `work/compare_slices/slice44.json`（该片 `worklist_idx` = 213–217）→ `6_02` 组3 与附栏说它"属别的切片"**为真，未动**。

改后那句话所依赖的标记位实测（章5）：段43 共 15 处标记、除两成员外 13 个词头（familiar／naked／spring／bare／private／intuition／spontaneous／praise／implicit／illusion／imaginary／paper／fancy）；1780 = uneasy, fear；1782 = insult, unkind；1783 = envy, jealous（该句除两成员外无别的标记词）；1784 = doubt, suspicion；1785 = sceptical；1788 = hesitate, guilty；1789 = embarrass, regret；1790 = repent, ashamed, hurt；1795 = ridiculous, error, stupid；1796 = first, awkward, clumsy；1797 = careless, oblivious。整词 `mad` 全书课文实测 **1 处**（1772，`not a mad rush` 否定式），另 1 处在 mad 卡 `ex`（`He became mad after losing his job.`，非否定）。

## 逐条清单

| # | 报告编号 | 组 | 改前 | 改后 | 改后宽度 | 过不过 |
|---|---|---|---|---|---|---|
| 1 | 组179·E 行 **BLOCK**（本片唯一 BLOCK） | 179（6_01 组2 resemble / similar） | items 表 similar 的 `core`＝「**相像的**那批摊在前」——「相像的」正是 similar 卡 `m`「类似的；相像的」的字面，违 §五.4 | 换成句法位钩子「**顶在名词前那批**」（resemble 侧「像的那样东西摆后面」不动，"动词后摆宾语 vs 形容词顶名词前"的对照不丢）。核查方式：`vocab.json` 里 similar `m` = 「类似的；相像的」，新串不含任一字面；事实由课文 1750 `using similar lines`（`sections.json` 章5 段43 i0，实测标记 = resemble, similar）与同组总结句「similar 顶在名词前面」同源，纯中文无需回数据 | `core` **7.0**（≤12，实测 `width_rule.width`）；不参与 ≤40 口径 → 该组两个小标题标称值未动（默认行 33.0 / 总结句 25.5，复量仍等于标称） | 过 |
| 2 | 组178·最小清单 1（前半） | 178（6_01 组1 severe / strict） | 「证据强度」：`strict 侧独立文本 6 条（课文 2 + 卡 ex 1 + 卡词伙 3，另 enforce 卡词伙 1 条）` | `strict 侧独立文本 5 条（课文 2 + 卡 ex 1 + 卡词伙另 2 条；strict rules 与 1748 同源不另计），另 enforce 卡词伙 1 条旁证`。核查方式：strict 卡 `note` 实测只有 `strict rules, strict censorship, imposing overly strict rules` 三条，`strict rules` = 课文 1748 那半句；独立文本 = 1748、1007、卡 `ex`、`strict censorship`、`imposing overly strict rules` 共 5 | —（非 ≤40/≤30 槽） | 过 |
| 3 | 组178·最小清单 1（后半） | 178 | 「数据边界·计数结论」：`来自 severe 侧 5 处 vs strict 侧 6 处的分布` | `severe 侧 5 处 vs strict 侧 5 处`（severe 侧 5 条按报告未动，我复点：课文 1749 + 卡 `ex` + 三条词伙 = 5 ✓） | — | 过 |
| 4 | 组178·随 #2 的连带更正（报告未点名，但被我这条改动改成自相矛盾的一句） | 178 | 「数据边界·同源合并」结尾：`合并后 severe 侧独立文本 5 条里只有 1 条是课文，strict 侧 6 条里 2 条是课文` | `…strict 侧 5 条里 2 条是课文`（留着 6 就与改后的「证据强度」打架，同片批次 5 修复有同款连带先例） | — | 过 |
| 5 | 组178·最小清单 2 | 178 | items 表 strict 的 `scene` 末段：`条文、审查、罚则（卡 note 三条词伙）` | `条文、审查（卡 note 三条词伙）＋罚则（enforce 卡词伙）`。核查方式：strict 卡 `note` 三条里无一条是罚则（实测 `strict rules, strict censorship, imposing overly strict rules`）；`enforce stricter penalties` 在 **enforce** 卡 `note`（实测该卡 note = 「同义词：force, impose, compel；词伙：enforce stricter penalties」），与本组 diff 表第 6 行原有归属一致。列数复算：该行仍 7 格 | — | 过 |
| 6 | 组178·最小清单 3（前半） | 178（6_01 附栏） | `5 组去重后 6 个成员句（1748、1749、1750、1757、1758、1761、1765、1766）` | `5 组去重后 8 个成员句（同一串号未动）`。核查方式：去重后集合大小实测 8（1758 同时属组3 与组4） | — | 过 |
| 7 | 组178·最小清单 3（后半） | 178（6_01 附栏） | `卡上词伙与课文同源的六条（strict rules、resemble real trees、similar lines、using similar lines、deep grief、stay miserable、feeling wretched）` | `七条`（括号内七串一字未动，只把数词对齐实测 7） | — | 过 |
| 8 | 组180·最小清单 1 | 180（6_01 组3 grief / grieve） | 「不写的」格：`sorrow、sadness、mourn 各是别的组、别的卡` | `sorrow、sadness、mourn 各是别的卡，三词都有自己的词卡，但都不在 220 组 worklist 的任何辨析组里，也没有一张已落地 cmp 卡把它们登记进 group（已逐组扫 worklist 与 vocab.json）`。核查方式＝本文上一节的三场扫描（17 头在 220 组 / 209 个 cmp 词头里命中 0，17 头皆有卡） | — | 过 |
| 9 | 组180·最小清单 2 | 180（6_01 出处清单旁证格） | `句式都挨着「He felt ...」与「his dog」`（"都"字过宽） | `grief／sorrow／sadness 三张卡的 ex 是 He felt … his dog 那一形，mourn 那张给的是 She mourns her dog every day.`。核查方式：逐张开卡 —— grief `ex` = `He felt deep grief after his dog died.`、sorrow = `He felt deep sorrow when his dog died.`、sadness = `He felt sadness after losing his dog.`、mourn = `She mourns her dog every day.`（门禁 1 也回查该串可溯源） | — | 过 |
| 10 | 组183·最小清单 1 | 183（6_02 组1 crazy / mad） | diff 表 mad 行末句：`本书只在一句"没这么干"的否定里给它露了面`（该行维度名是"本段它挂在哪个名词前面"，"本书"口径下为假） | `本段只在一句"没这么干"的否定里给它露了面（整词 mad 全书课文只 1772 这一处，另 1 处在它自己卡的 ex，那句不是否定式）`。核查方式：整词 `mad`（词首词尾都不接字母）扫全书 1833 句 = 1 处（1772，段46 i4）；mad 卡 `ex` = `He became mad after losing his job.` | —（diff 单元格，非 ≤40 槽；列数复算该行仍 5 格） | 过 |
| 11 | 组185·最小清单 1 | 185（6_02 组3 envy / jealous） | 「与别组的交界」：`1782 的 insult / unkind、1784 的 doubt / suspicion、1780 的 uneasy / fear 都有卡，属别的组或别的切片` | `1784 的 doubt / suspicion 与 1785 的 sceptical 同属 worklist_idx 216 那一组（words = doubt / sceptical / suspicion，paras = [[5,48]]，挂在 slice44，是别的切片），那张讲"怀疑"；1782 的 insult / unkind、1780 的 uneasy / fear 四个词头都有自己的词卡，但都不在 220 组 worklist 的任何辨析组里、也没有一张已落地 cmp 卡把它们登记进 group（已逐组扫 worklist 与 vocab.json 的 181 张 cmp），按硬约束 2 不进成员，只作背景`。核查方式：worklist[216] 逐字段开看 + slice44.json 的 `worklist_idx` 覆盖 213–217；四头 `in vocab` 为真、`in 任何组` 为假 | — | 过 |
| 12 | 组186·最小清单 1 | 186（6_02 组4 reluctant / unwilling，组头共现位置） | `同段的 1788（hesitate / guilty）、1789（embarrass / regret）、1790（repent / ashamed）各属别的组或别的切片` | `…六个词都有自己的词卡，但都不在 220 组 worklist 的任何辨析组里、也没有一张已落地 cmp 卡把它们登记进 group（已逐组扫 worklist 与 vocab.json 的 181 张 cmp），本张只讲 1787 这半句与后半句的分工（口径 9）`。核查方式：六头逐个 `in vocab` = True、在 220 组与 209 个 cmp 词头中命中 0；句位标记实测 1788 = hesitate, guilty／1789 = embarrass, regret／1790 = repent, ashamed, hurt | — | 过 |
| 13 | 组187·最小清单 1 | 187（6_02 组5 awkward / clumsy，组头共现位置） | `同段 1795（ridiculous / stupid）、1797（careless / oblivious）属别的组或别的切片` | `…四个词都有自己的词卡，但都不在 220 组 worklist 的任何辨析组里、也没有一张已落地 cmp 卡把它们登记进 group（已逐组扫 worklist 与 vocab.json 的 181 张 cmp），本张只讲这一句舞步与两张卡各自那一下（口径 9）`。核查方式：四头皆有卡（ridiculous / stupid / careless / oblivious 的 `m`、`ex` 逐头开过）且 220 组、181 张 `cmp` 中命中 0；1795 = ridiculous, error, stupid、1797 = careless, oblivious | — | 过 |

必改四类去重后逐一对上号：① `core` 一格＝#1；② "属别的组／别的切片"→"有卡、不在任何辨析组里（已扫）"＝#8、#11、#12、#13 共 4 处；③ 组178 条数与出处归属＋附栏两个数＝#2、#3、#5、#6、#7（外加连带更正 #4）；④ 组183"本书"→"本段"＝#10。报告另两条非必改项（组180 #9"都挨着 He felt"）一并办了。

## 未改项及理由

- **组178 附带的"建议级"一句**（报告：`第 28 行给 1007 的引号写作「清晨那套作息有多严」，数据 sentZh 是「清晨那套规矩有多严」—— 建议去掉引号或照数据写`）：**未动**。我回数据复核为真：1007（章3 段20 第 4 句，起句实测 1003）原文 `How [[strict:strict]] our morning [[regime:regime]] was!`、`sentZh` = 「父亲大声笑我们清晨那套**规矩**有多严，说时平原正亮晃晃地往后跑」；同组出处清单第 69 行引的是全句、字字与数据相同，只有第 28 行与 items `scene` 用了"作息"这个说法。报告自标建议级、且它提示这可能与 177 号已落地卡同口径 → 留给他定这一族引号写法，我不改判。
- **组179 汇总表标注的「2 处措辞建议级」**：① diff 表 similar 行"similar to sth 那个**最常见框架**"的"最常见"四字（报告建议删，理由是 §一 禁语感当来源）；② 组头"本段**另三张卡**（familiar / bare / private 等）"。两处**均未动**。②我实测过：段43 标记 15 处、除两成员外 13 个词头（清单见上），草稿那句确是低估，但它带"等"字、不属"虚报邻居词"那一族，报告把它记在建议级 → 不在我授权范围。
- **组180 建议级**（组头"1752 的湖"→应为 1751）：**未动**。复核为真：1751 = `The lake path felt familiar each morning…`（湖在此），1752 = `Lin kept his feet bare on warm sand…`（暖沙与芦苇）。报告明标"建议级"。
- **组181 建议级**（组头"同段**隔三句**"→1758 与 1761 之间是 1759、1760，隔两句）：**未动**（该组判定为 OK 可落地，报告称"建议级、不动任何结论"）。
- **组184 作者提请拍板那一格 + 报告"需要他拍"第 2 条**：内容一字未动。报告核验结论是"报备属实、推的半步没进任何落地槽"→ 维持不写进表；要写得由他给一句本书书证。我不替他写、也不替他删。
- **报告"需要他拍"第 1 条（组179 `core` 定 BLOCK 还是 MISMATCH）**：**未替改判**。#1 的改法两档通用（都是一格、都不牵动 ≤40 标称），定级由他一句话钉。
- **报告"需要他拍"第 3 条（把"邻居词属别的组"改成强制写法、并由门禁 2 固定必查／是否动 `tools/check_compare_draft.py`）**：**未动** —— 工具与门禁脚本不在我的可改范围（`tools/*` 禁改），我只在本片把 4 处虚报按可查事实改掉了。
- **`shadow/data/vocab.json` 的 `preserve` 卡 `note` 错字 `preserve wildife`**：**只报不修**（数据侧）。实测：该串在 `vocab.json` 原文 1 处、`wildlife` 6 处，是本报告与两份草稿之外的数据缺陷。
- **判 OK 的三组（组181、182、184）内容、全部原文表、全局句号编号、组标题编号与成员顺序、`主锚点 = 章N 段M` 字段名**：一字未动（报告 A／B／D 三项零缺陷）。
- **`work/辨析草稿/6_03.md`、`6_04.md`、`6_05.md`、`6_06.md`、`6_08.md` 在 `git status` 里显示 M**：不是我改的（本轮我只写 6_01、6_02 与本文件这三份），应是并行在跑的修复代理的产出。

## 终检

1. 门禁 1（改稿后真跑，原样输出）：

```
$ python3 tools/check_compare_draft.py work/辨析草稿/6_01.md work/辨析草稿/6_02.md
OK   6_01.md
OK   6_02.md

门禁 1: PASSED（全部英文串可回溯）
exit_code=0
```

2. 范围内 10 组默认行／总结句全量复量（`tools/width_rule.width`，取的是落地器真正会取的那串：代码围栏里的本体与 `>` 后那句；**本轮没有改动任何一条默认行或总结句**，逐条仍与标称分毫不差、无一超 40 / 30）：

| 组 | 默认行那一行本体 | 标称 | 实测 | 总结句那一行 | 标称 | 实测 |
|---|---|---|---|---|---|---|
| 178 severe/strict | `severe = 冬天的咳嗽（had been severe），strict = 自习的手机规矩` | 31.5 | 31.5 | severe 说落下来的那一下有多重，strict 说管着人的那条线。 | 28.0 | 28.0 |
| 179 resemble/similar（**本次改 core**） | `resemble = 速写像真树（resemble real trees），similar = 抄来的线条` | 33.0 | 33.0 | resemble 后面直接摆那样东西，similar 顶在名词前面。 | 25.5 | 25.5 |
| 180 grief/grieve | `grief = 卧床孤独的日子（deep grief），grieve = 为输掉的比赛难过` | 31.5 | 31.5 | grief 和 grieve 是同一团悲伤的名词形和动词形。 | 23.0 | 23.0 |
| 181 miserable/wretched | `miserable = 朋友在门外等时（stay miserable），wretched = 鞋子湿透那次` | 34.5 | 34.5 | miserable 说心里不乐意，wretched 说身上不好受。 | 23.5 | 23.5 |
| 182 hate/hatred | `hate = 楼梯上的慢进步（hate slow progress），hatred = 放下对久等的那份` | 35.0 | 35.0 | hate 后面直接摆那件事，hatred 后头挂一个 for。 | 23.0 | 23.0 |
| 183 crazy/mad（**本次改 diff 一格**） | `crazy = 湿石头上那局游戏（crazy games），mad = 一周十本那阵赶（mad rush）` | 36.5 | 36.5 | crazy 是那局被禁的游戏，mad 是一周十本那阵赶。 | 23.0 | 23.0 |
| 184 bother/harass | `harass = 那些瘦弱的鸭子（weak ducks），bother = 墙边睡觉的老猫（old cats）` | 37.0 | 37.0 | bother 能接 to clean the room，harass 本书两处都带宾语。 | 28.0 | 28.0 |
| 185 envy/jealous（**本次改交界一格**） | `envy = 游得快的孩子（no envy toward），jealous = 好友得的奖（of prizes）` | 36.0 | 36.0 | envy 本书两处都对着人，jealous 两处都对着东西。 | 23.5 | 23.5 |
| 186 reluctant/unwilling（**本次改组头一格**） | `unwilling = 帮奶奶从不推辞（never unwilling），reluctant = 有次洗绿菜` | 34.5 | 34.5 | 本书把 never 给了 unwilling，把 once 给了 reluctant。 | 26.5 | 26.5 |
| 187 awkward/clumsy（**本次改组头一格**） | `awkward = 忘名字那一下（felt awkward），clumsy = 打翻杯子（dropped the glass）` | 39.0 | 39.0 | 同一支舞步本书两个词一起给，两卡各演一件事。 | 22.0 | 22.0 |

3. `core` 全 20 格复量（≤12 硬口径，实测 6.0–10.0，无一条越线）：`6_01` 病、灾、伤、罚那一档 10 ／ 写下来管着人的那条线 10 ／ 像的那样东西摆后面 9 ／ **顶在名词前那批 7（本次改）** ／ 记得的那一团 6 ／ 难过不了太久 6 ／ 心里那股不乐意 7 ／ 身上难受加疲惫 7 ／ 后面直接跟那件事 8 ／ for 后头才是恨的对象 10；`6_02` 湿石头上那局游戏 8 ／ 一周十本那阵赶 7 ／ 那群瘦弱的鸭子 7 ／ 墙边睡觉的老猫 7 ／ 游得快的孩子那桩 8 ／ 好友得的那份奖 7 ／ 帮奶奶从不推辞 7 ／ 有次洗绿菜那回 7 ／ 忘名字那一下 6 ／ 打翻了杯子的那位 8。义项字面泄漏复查：`grep '相像的那批\|摊在前'` → 两份草稿 0 命中；`grep '相像的\|类似的'` 现只剩 3 行 —— items 表的 `sense` 格 1 行（第 125 行，§五.4 允许的唯一去处）＋出处清单逐字引两卡 `m` 原文 2 行（第 157、159 行）；`core`、默认行、总结句、五个维度名四处全部不含该字面（表头那句「类似」是引用＋当场否定，§五.11 放行，报告 A–F 行已判 OK）。
4. 表格结构复算（脚本数 `|` 数与表头比对）：`6_01.md` 82 个数据行、`6_02.md` 64 个数据行，**列数不齐 0**（改的是 items/diff 单元格内容，没并格）。
5. `git status --porcelain`（原样）：`M work/辨析草稿/6_01.md`、`M 6_02.md`（本轮的改动）＋ `M 6_03 / 6_04 / 6_05 / 6_06 / 6_08`（并行修复代理，非本轮）＋未跟踪 `work/辨析审核/FIX_6_a.md`、`audit_[abcd]_b6.md`；再过一道 `grep -E 'shadow/data|scripts/|tools/|index.html|playwright'` → **空**，无数据 / 代码 / 测试文件被改，未做任何 git 写操作。
