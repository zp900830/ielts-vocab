# 门禁 2 审核 · 批次 2 切片 01 / 02 / 03（worklist_idx 5, 11–24，共 15 组）

审核人：门禁 2 独立代理（非草稿作者）。数据出处只用 `shadow/data/sections.json` + `shadow/data/vocab.json`，
逐组亲算亲 grep，未复述作者自查结论。审核过程只读数据，未改草稿、未碰 `shadow/data/*`、`shadow/index.html`、
测试，未做任何 git 写操作。

组数 15 / BLOCK 4 组（共 6 处 BLOCK 级缺陷）/ MISMATCH 10 组（共 17 处）/ 通过 1 组

- **BLOCK**（必须改，改完才可落地）＝ 落在**要上线的字段**（`title` / 「简单记」/ `diff` 三格）里、被数据本身证伪或
  违反作业书基线的断言。命中组：`2_01 组4`（1 处）、`2_02 组1`（1）、`2_02 组3`（2）、`2_03 组4`（2）。
- **MISMATCH** ＝ 草稿侧记账错（宽度标称值、出处条数、段内序号、同源计数），不进线上文本，方向基本都是保守／少报，
  但落地前必须更正，否则下一个代理会照抄错数字。
- **通过** ＝ A–F 六项全对、无一处口径问题：只有 `2_02 组5 grass/meadow`。

### 复算基线（先立口径，后面各组引用）

| 项 | 我复算到的值 | 与草稿/作业书的关系 |
|---|---|---|
| 全书句数 | 1833 | 与作业书一致 |
| 章偏移自算 | `[0, 339, 651, 883, 1277, 1492]` | 与作业书给的常量逐位一致 ✓ |
| 各章句数 | 339 / 312 / 232 / 394 / 215 / 341 | 求和 1833 ✓ |
| 宽度机检口径 | `scripts/validate_data.py:297` `_width = sum(1 if '一'<=c<='鿿' else 0.5)` | **只有汉字计 1，全角标点 `（） 、 。 ，` 计 0.5**；落地时是这一条把关 |
| 作者用的口径 | 2_01 / 2_03 ＝「汉字＋全角标点计 1」（=批次 1A 口径）；2_02 ＝「只有汉字计 1」（=机检口径） | 三个切片两套口径，见下面 D 项统一说明 |
| 15 组默认行机检宽度 | 33.5–40.0，最大 40.0（`2_02 组3`） | 全部 ≤40 ✓ 无线上超宽风险 |
| 15 组总结句机检宽度 | 18.0–29.5，最大 29.5（`2_01 组5`） | 全部 ≤30 ✓ |
| 锚点段段长 | 14 个锚点段全部恰好 6 句 | 13 张全段表都是 6 行 → **没有并句、没有漏句**（A 项逐字比对全过） |

> **A 项总结（15 组一次性给完，下面各组不再重复）**：把三份草稿「该段原文」表里全部 **82 行英文 + 82 行中文**
> 逐行剥掉 `[[词头:表面形式]]` 标记后与 `sections.json[章][段][句]` / `sentZh` 同位比对，
> 含标点、大小写、单复数、时态、`from the rain` 这类尾巴 —— **0 行不符，0 处并句，0 处译句错位**。
> 唯一的例外声明是 `2_03 组2`（只列 272–275 四句，已在表上方写明「整段见组 1 的表」）✓ 合规。
> 抄表这一项上三位作者都干净；缺陷全在**表外的语义与计数**。

---

## 组 5（2_01·组1） · damp / humid

A 原文表：**OK**。6 行（72–77）EN/ZH 逐字等于数据；`paraZh`「午夜潮湿，清晨雪霜，冰雹转融化。」逐字 ✓；卷名归属（第二卷·归来，段 12 起 subhead）✓。
B 句号与共现：72＝0＋段前 72 句＋0、73 ✓；两成员确实以 `[[damp:damp]]`（72）、`[[humid:humid]]`（73）挂在共现段 [0,13] ✓。
 「damp 另有 2 处（103、1583）、humid 全书只 73 一处」→ 我复算：damp 标记 3 处 [72,103,1583]、humid 标记 1 处 [73] ✓ 数字精确。
 **不符 1 处**：出处清单写 103 是「段 [0,18] 第 0 句」，实测 103＝段 [0,18] 第 **1** 句（103 前面还有 `After storms the bank turns soft and muddy…`）。
C 可 grep：我亲自命中的反引号英文串 **25 条**，查无 **0 条当正面证据用的**；3 条查无里 `damp air can seep through cracks…` 是省略号截断（原句 1583 逐字有），余 2 条是元信息。
 否定行 3 条我逐条回数据验过确实无据：`The ground is damp after the rain.`（卡 ex ✓）、卡 ex `The air feels humid…`（✓，表里 `feels humid` 为其子串 ✓）、
 「humid 语气更重／只用于热带」「damp 还能当动词」→ 两卡 `note` 确实无标注、`damp` 动词义全书 0 例 ✓ 诚实。
D 宽度：默认行 草稿 40.0 / 机检口径实测 **37.0**（批次 1A 口径 40.0）→ MISMATCH（差 3.0，方向保守）；
 总结句 草稿 22.5 / 实测 **20.5**（1A 口径也才 21.5）→ 两套口径都对不上，**这个数字是算错**，MISMATCH。
E 义项照抄：core `贴东西上，摸得出` / `落房间空气里`、默认行、title 全部不含 `m` 里的「潮湿的／湿润的」✓；「潮湿」只出现在 sense 槽与 draft 小标题的义项标签位 → **OK**。
F 同源与厚度：`damp clay`（卡词伙）与课文 103 同一处 → 草稿已写「与课文 103 同一处／两处文本互指」✓ 未算两条；
 「humid 侧总共 2 条出处」复算＝73＋humid 卡 ex ✓；1583 `Damp air` 越界（damp 也修饰 air）主动披露并把结论降级成计数 ✓ 规范。
**判定：可落地。** 必改最小清单：① 103 的段内序号 第 0 句 → 第 1 句；② 总结句宽度 22.5 改 20.5（或按全表统一口径重标）。

---

## 组 11（2_01·组2） · natural / nature

A 原文表：**OK**。6 行（150–155）逐字 ✓，`paraZh` 逐字 ✓。
B 句号与共现：153（`[[nature:nature]]`）/154（`[[natural:natural]]`）都在 [0,26] ✓；
 「natural 全书 7 句 13/154/245/310/358/721/855」复算＝按表面形式 7 句 ✓（**其中 13 的词头是 phenomenon，natural 只是表面形式，那儿不挂 natural 卡**）；
 「nature 全书只有 153 这 1 句」复算 ✓（surface=marked=1）。
C 可 grep：命中 **41 条**；查无的正面证据 **0 条**。否定行 `The lake is natural` 我复验全书 0 处 ✓ 诚实。
 跨卡归属我也逐条验了（不只是全局能查到）：`natural habitats`（natural+habitat 两卡词伙 ✓）、`natural aptitude`（aptitude ✓）、
 `natural perfume`（perfume ✓）、`natural phenomenon`（phenomenon ✓）、`normal again`（normal 卡词伙 ✓）、`I appreciate the beauty of nature.`（appreciate 卡 ex ✓）。
D 宽度：默认行 草稿 37.0 / 实测 **34.5**；总结句 草稿 25.5 / 实测 **24.5** → MISMATCH（1A 口径下两处都吻合，属口径差不是算错）。
E 义项照抄：core `不是人做出来的` / `山和水那一整片` 不含「自然的／天然的／本性／自然」✓；title 也没宣称「本段两词都指自然」✓ → **OK**。
F 同源与厚度：
 ① 「本书 7 句 + 卡上 **4 条**词伙」——natural 自己卡上是 **3 条**（habitats / endowment / predators），4 条对不上任何一口（跨卡算则 ≥5 条）→ MISMATCH；
 ② 那 4 条里 `natural habitats`=310、`natural perfume`=855、`natural aptitude`=358、`natural phenomenon`=13 **全是课文那 4 句的同源登记**，
  「7 句 + 4 条词伙」并排写会被下一个代理读成 11 条独立证据 → MISMATCH（草稿在表格逐格里标了「同时是 X 卡词伙」，但证据强度那节没点破）。
 ③ **语义错 1 处（少报自家证据）**：「卡上 3 条词伙（playful / addictive / feel close to nature）走的都是『性子、脾气』那一档，跟本段『大自然』档不同义」——
 `feel close to nature`（亲近大自然）正是「那一片」档，不是「性子」档。nature 侧撑「那一片」的书证应是 **3 条**（153 + appreciate 卡 ex + feel close to nature），草稿写 2 条。
**判定：可落地。** 必改最小清单：①「4 条词伙」改「3 条（natural 卡自）＋4 条跨卡同串登记」；② `feel close to nature` 归回「那一片」档，nature 侧书证数改 3；③宽度两值按统一口径重标。

---

## 组 12（2_01·组3） · gas / petrol

A 原文表：**OK**。6 行（156–161）逐字 ✓，`paraZh` 逐字 ✓。
B 句号与共现：157 `[[petrol:petrol]]`、158 `[[gas:gas]]` ✓；「各标记 1 次」复算 ✓（159 是 gasoline、160 是 petroleum，另两张卡 ✓ 草稿已报备）。
C 可 grep：命中 **28 条**，正面证据查无 **0 条**。查证到的关键几条：`The car consumes a lot of gas.`（consume 卡 ex ✓）、
 `The car will accelerate when you press the gas.`（accelerate 卡 ex ✓）、`traditional petrol-powered vehicles`（vehicle 卡词伙 ✓）、
 `release greenhouse gases`（gas 卡词伙 ✓，复数 gases 确在卡上 ✓）、`He buys petrol every Friday.`（petrol 卡 ex ✓）。
 否定行 2 条复验：`petrol station` / `gas station` 全书与词卡 **0 处** ✓ 放行；「查不到 petrol 的复数形」→ `petrols` 复验 **0** ✓ 诚实。
D 宽度：默认行 草稿 37.5 / 实测 **35.0** → MISMATCH；总结句 草稿 25.0 / 实测 **25.0** ✓（这一行恰好两套口径都算不到一起，机检口径吻合）。
E 义项照抄：title 里出现 m 词「汽油」，但是以**否定式**引述（「worklist 说共同义项是汽油，可本段只有 petrol 真用在这一档」）——
 与批次 1A 组 2「两个词真撞在『平』上时…」、组 5「两个词都在说不到极端」同一手法，**未宣称本段都指汽油** → 放行，不计 BLOCK。
 core `三档共用一个词` / `只管加油站那箱`、默认行 `既管呛烟也管加油 / 只管加油` 均不含 m 词 ✓。
F 同源与厚度：`costly petrol`（卡词伙）与 157 同一处 → 已点名 ✓；「consume / accelerate 两卡 ex 共 2 条独立文本」复算＝2 ✓（真是两条独立文本，不是同源拆二）；
 「方向一致」只用来支撑「gas 能当车加的油」这一格，两条文本都是"车＋gas"，成立 ✓。
 语义小疵 1 处：items 词性列写 gas「本书**零冠词**与 that 都用过」——课文唯一那处是 `that dirty gas`（带 that），零冠词只存在于卡上 `natural gas exploration` 这类复合词伙里，
 「本书」二字会让人以为课文有现场 → 建议改「卡上词伙里零冠词」。
**判定：可落地，**作者提的「义项与本段不符要拍板」我判：**按口径 6 处理正确，不退。** 必改：仅词性列那半句 + 宽度口径。

---

## 组 13（2_01·组4） · cosmos / universe

A 原文表：**OK**。6 行（162–167）逐字 ✓；`paraZh` 逐字 ✓；163 里 `Interstellar` 首字母大写得和原文一致 ✓。
B 句号与共现：162 `[[cosmos:…]]`、163 `[[universe:universe]]` 都在 [0,28] ✓；「各 1 句」复算 ✓（surface 也各 1）。
C 可 grep：命中 **25 条**；正面证据查无 **0 条**。**4 条否定行我逐条复验确实 0**：`the cosmos is vast`、`a corner of the universe`、`in the cosmos`、`in the universe` ——
 草稿说"本书各 0 处"→ 全部核对为真 ✓，这是三份草稿里否定行最守规矩的一组。`watch the cosmos` / `at night` / `is very big` 均为卡 ex 连续子串 ✓；
 `The spaceship travels through interstellar space.`（interstellar 卡 ex ✓）。
D 宽度：默认行 草稿 38.5 / 实测 **36.0** → MISMATCH；总结句 草稿 23.5 / 实测 **23.0**（1A 口径 24.5）→ 两套口径都不吻合，**数字算错** MISMATCH。
E 义项照抄：title 写「这一段两个"宇宙"挨着出现」——**本段两句译文都是「宇宙」**（162「头顶的宇宙」、163「整个宇宙」）→ 该段真撞，按基线放行 ✓；
 core `抬头被研究的那片` / `大到装得下一切` 不含「宇宙」✓。
F 同源与厚度：「可用文本总共 4 条（各 2 条）」复算＝162、163、cosmos 卡 ex、universe 卡 ex = 4 ✓ 精确；
 「本书 4 处全是 the 开头」复算 ✓（162 the cosmos / 163 the universe / 两卡 ex 各 the）→ 冠词那格写"两词无区别"是对的，不是凑格子。
**BLOCK 1 处（在要上线的 diff 里）**：「在句子里站哪一头 | universe」的一句话区别写「本书 2 处**全在句子开头**当说话的主角」——
 163 的原文是 `Interstellar space and the universe fascinated him deeply`，universe 是**并列主语的第二项**，句首是 Interstellar space；
 草稿自己在下一格「挨着谁」里已经写明"与 Interstellar space 并列"。→ 该格必须改成「本书 2 处都当主语（163 是并列主语第二项）」，否则线上卡会教错一个位置事实。
**判定：需作者改（1 处 BLOCK + 2 个宽度数字）。**
 关于作者自请「退回或降级」：**我判不退**。理由按作业书第 7 条——薄不是退回理由（本组 2+2 条，全书 98% 的组都这样），
 且这组给得出两条**可 grep 的真区别**（被看的对象 vs 当主语的那一项；邻居是 galaxy 还是 interstellar space），卡上 `note` 全空也已如实写进「证据强度」而不是编出来。
 要守的是：**别把"被看 vs 当主角"升级成 cosmos/universe 的通用之别**——草稿现在的措辞（"本书 2 处"）已经踩到线上，改完即可落地。

---

## 组 14（2_01·组5） · spacecraft / spaceship

A 原文表：**OK**。6 行（168–173）逐字 ✓；`paraZh` 逐字 ✓。
B 句号与共现：169 `[[spacecraft:spacecraft]]`、170 `[[spaceship:spaceship]]` ✓；
 「spacecraft 全书 1 句 + flyby 卡 ex 1 句；spaceship 1 句 + interstellar 卡 ex 1 句」复算 ✓（169/170 各 1，flyby/interstellar 卡 ex 各含 1 句 ✓）；
 「两卡词伙各 1 条，且就是本段那一句」复算 ✓（`model spacecraft`=169、`toy spaceship`=170）。
C 可 grep：命中 **39 条**；正面证据查无 **0 条**；2 条否定行 `spacecrafts`、`spaceships` 复验全书与词卡 **0 处** ✓ 放行。
 逐条对上出处：`The spacecraft landed safely on Mars.`（卡 ex ✓）、`The spacecraft completed a flyby of Mars last month.`（flyby 卡 ex ✓）、
 `The spaceship flew to the moon.`（卡 ex ✓）、`The spaceship travels through interstellar space.`（interstellar 卡 ex ✓）、
 `a small probe`（170 有 probe 卡 ✓）、`a new module`（171 ✓）、`simple propulsion with air`（171 ✓）、`the dynamics of air pressure`（172 ✓）。
D 宽度：默认行 草稿 40.0 / 实测 **37.5** → MISMATCH（保守）；
 总结句 草稿标称 **30.0** / 机检口径实测 **29.5** → 过；但按**作者自己文件里用的那套口径**（汉字＋全角标点计 1）实测是 **31.0，已越过 ≤30**。
 这行是 15 组里唯一"口径一换就超限"的，落地前按机检口径重标一次（`validate_data.py._width` 会拦）。
E 义项照抄：title 明写「课文一个说是 model、一个说是 toy——想分清得翻两张卡自己的 ex」——**未宣称本段都指宇宙飞船** ✓；
 core `落在星球上的那件` / `飞来飞去的那艘` 不含「航天器／宇宙飞船／太空船」✓；默认行用「那个模型／那个玩具」✓。
F 同源与厚度：词伙与课文 169/170 同源 → 两处都点名「课文 169 就是它」✓ 没算两条；
 「卡 ex 的去处不同」那格引的 4 句确实是 4 处独立文本（spacecraft 卡、flyby 卡、spaceship 卡、interstellar 卡）✓；
 「本书 4 条文本没有一处写到有没有人」复算 ✓ 且反向证据（170 的 `probe` 系在 spaceship 上）如实拿来推翻"载人"讲法 ✓ 这一段写得干净。
 「中文义项给的差别」格点出 `paraZh` 把两词并成一句「他们擦拭修补飞船模型」——逐字核对 ✓（数据原文如此），这是诚实的弱证据声明。
**判定：可落地（需改 1 个宽度数字）。**
 关于作者提的第二个候选退回：**我判不退**。这组的硬区别不在段内两句（作者已自认两句无区别），而在 4 条卡 ex 的"落火星／在路上"分工，
 4 处独立、方向一致、全部可 grep；`m` 的「器 vs 船」也已标注为中文侧线索。这正是作业书第 7 条要保下来的那类"薄但真"的组。

<!-- NEXT -->
