# 门禁 2 审核 · 批次 2 切片 01 / 02 / 03（worklist_idx 5, 11–24，共 15 组）

审核人：门禁 2 独立代理（非草稿作者）。数据出处只用 `shadow/data/sections.json` + `shadow/data/vocab.json`，
逐组亲算亲 grep，未复述作者自查结论。审核过程只读数据，未改草稿、未碰 `shadow/data/*`、`shadow/index.html`、
测试，未做任何 git 写操作。

组数 15 / BLOCK 4 组（共 6 处 BLOCK 级缺陷）/ MISMATCH 10 组（共 27 处）/ 通过 1 组

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
| 锚点段段长 | 14 个锚点段全部恰好 6 句 | 15 张原文表 = 14 张全段表（各 6 行）+ 1 张声明过的 4 行子集 → **没有并句、没有漏句** |
| 草稿里所有「…」中文引号 | 219 处，逐条回查 `sentZh` / `paraZh` / `subheads` / 卡 `m`/`exZh`/`note` | **0 处伪引**：对不上的 51 处全部是作者自造的标签或明确写"不这样用"的假设句 |

> **A 项总结（15 组一次性给完，下面各组不再重复）**：把三份草稿「该段原文」表里全部 **88 行英文 + 88 行中文**
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

# 批次 2 · 切片 02（worklist_idx 15–19）

## 组 15（2_02·组1） · expedition / exploration

A 原文表：**OK**。6 行（174–179）逐字 ✓；`paraZh` 逐字 ✓；共现声明「两个词挤在同一句 175」复算 ✓（175 的 heads 正好含 exploration + expedition）。
B 句号与共现：175 ✓（0＋段前句数＋1）；与切片包 `sents:[175]` 一致 ✓。
C 可 grep：命中 **18 条**，正面证据查无 **0 条**，否定行 0 条。逐条回验：
 `went on an expedition to the mountains`（expedition 卡 ex ✓）、`a real expedition to distant, cold worlds`（175 ✓）、
 `Their exploration of the veranda`（175 ✓）、`space exploration`（exploration 卡词伙 ✓ + pioneer 卡 ex `He was a pioneer in space exploration.` ✓）、
 `natural gas exploration`（exploration 卡 + gas 卡同串 ✓）、`The exploration of space takes many years`（exploration 卡 ex ✓，**卡原文句末有句点，草稿省了**）。
 否定行「本书查不到一次 a/an + exploration」我逐字复验：`a exploration`、`an exploration` 两文件 **0 处** → **诚实，放行** ✓。
D 宽度：默认行 草稿 38.5 / 实测 **38.5** ✓；总结句 草稿 18.5 / 实测 **18.5** ✓ —— 本切片 5 组 10 个宽度数字**全部逐位吻合机检口径**（见文件头统一说明）。
E 义项照抄：core `拖队出发的那一趟` / `探熟一块地方的活儿` 不含 m 词 ✓；sense 槽保留「探险；远征」「探索；勘探；探险」✓。
 **BLOCK 1 处（在 title 里）**：「这一句把**两个「探险」**并排放」——175 的本书译句是「自家游廊上的**探索**……真正**远征**」，
 这一段**没有把两个词都用在「探险」上**（worklist 那个共享义项在本段不撞）。按基线「写进标题而该段实际不撞 = BLOCK」判 BLOCK，
 处置＝口径 6：标题改成"这一段两个词各领哪样东西"（草稿后半句其实已经这么写了，把「两个探险」这个壳去掉即可），并在「证据强度」补一句"本书这一段没把 exploration 译成探险、也没让两词撞在探险上"。
F 同源与厚度：「交叉出处共 6 条」——复算：`real expedition`（卡词伙）＝175 同源（表格里已注明"课文 175 就是它"✓）、
 `space exploration` 在 exploration 卡与 pioneer 卡 ex 重复登记、`natural gas exploration` 在 exploration 卡与 gas 卡重复登记 →
 **6 条登记，去重后独立文本 4 条**。草稿把它写成"6 条交叉出处"且未点名后两组同串 → MISMATCH（同源计数不实，但没据此宣称"两处书证方向一致"，不升 BLOCK）。
 另：文件头小结写「5 组的共享义项与锚点句实际用法核对一致，无不副实需整组退回的」——**与本组事实相反**，这句自查结论要删。
**判定：需作者改**（1 处 BLOCK 标题 + 1 处同源计数 + 删文件头那句自查结论）。

---

## 组 16（2_02·组2） · sample / specimen

A 原文表：**OK**。6 行（180–185）逐字 ✓；`paraZh` 逐字 ✓；两词同一句 182 ✓。
B 句号与共现：182 ✓；182 的 heads 确为 sample + specimen ✓。
C 可 grep：命中 **18 条**，作为正面证据的串查无 **0 条**。逐条回验：`take samples`（sample 卡词伙 ✓）、
 `took a small sample of soil`（182 ✓）、`tested the sample from the river`（sample 卡 ex ✓）、`leaf specimen`（specimen 卡词伙 + 182 ✓）、
 `labelled her best leaf specimen`（182 ✓）、`showed a specimen of a butterfly`（specimen 卡 ex ✓）、`a specimen of a butterfly` ✓。
D 宽度：默认行 草稿 38.0 / 实测 **38.0** ✓；总结句 草稿 26.0 / 实测 **26.0** ✓。
E 义项照抄：title 未宣称「两词都指样品」（写的是"一句里给了两样东西：舀出来拿去测的一份 / 挑出来贴标签留着的那片叶子"）✓；
 core `从一堆里取的那一份` / `整件留起来展示的那一件` 不含「样品／样本／标本」✓。
F 同源与厚度 —— **本组最严重的一处，是一句假否定**：
 证据强度写「两词在课文里**都只出现 1 次**（182 同句）……sample 的词伙登记的是复数形 `take samples`，课文 182 用的是单数 `took a small sample`——**书证里查不到 take samples 原样**」。
 我在 `sections.json` 里复算 sample 这个词：共 **3 处**——182（带标记）、**111** `They take samples along the grassy fringe of the pines`（译「沿松林边缘草地**取样**」，未标词头）、
 **320** `The lab found harmless mouth bacteria in samples…`（译「在**样本**里发现」，未标词头）。
 → ① 「只出现 1 次」不成立；② 「查不到 take samples 原样」**恰好被 111 逐字打脸**：卡上那条词伙在课文里有原样现场，还带着本书自己的译文「取样」。
 影响：这一格让 sample 侧少了一条独立书证，且表里「它跟 take/test 结伴」那格本可以直接挂 111；落地者若照抄会以为 sample 只有 1 处书证。
 （作业书 C 对"否定行"的放行前提是那句否定**为真**；这句为假，按数字/出处不实处理，记 MISMATCH·高，不升 BLOCK——缺陷在草稿自证部分，未进 title/summary/diff 三格。）
 另：specimen 词伙 `leaf specimen` 与 182 同源 → 草稿已点名"独立性打折" ✓ 这一半写得对。
**判定：需作者改**（必改 1 处：把 111 / 320 补进书证、删掉「查不到 take samples 原样」；specimen 侧计数不变）。

---

## 组 17（2_02·组3） · despair / desperate

A 原文表：**OK**。6 行（192–197）逐字 ✓；段外补的 1259 整句逐字 ✓（含句末句号、含「也没人愿意再骗老朋友」全句）；`paraZh` 逐字 ✓。
B 句号与共现：197 ✓（despair + desperate 同句标记）；「despair 全书另有 1 次在章3 段62 全局 1259」复算＝despair 标记 2 处 [197, 1259] ✓ 且 1259 确在章3 段62 ✓；desperate 标记 1 处 ✓。
C 可 grep：命中 **17 条**，正面证据查无 **0 条**。逐条回验：`felt brief despair`（197 ✓）、`brief despair`（despair 卡词伙 ✓，与 197 同源 ✓ 已注明）、
 `He felt despair after losing his job`（卡 ex ✓）、`Despair never led to suicide`（1259 ✓）、`took desperate steps`（197 + 卡词伙 ✓）、
 `made a desperate attempt to save the child`（desperate 卡 ex ✓）、`to cool the trays`（197 子串 ✓）。
 否定行「『极度渴望的』这一档本书查不到任何书证」复算 ✓（desperate 全书唯一 1 处是"不顾一切"档）→ 诚实。
D 宽度：默认行 草稿 40.0 / 实测 **40.0** ✓（正好卡线；按 1A 口径会是 42.5 超限，说明本切片改用了机检口径）；总结句 草稿 26.0 / 实测 **26.0** ✓。
E 义项照抄：core `心里挨的那一下` / `豁出去做的那几步` 不含「绝望」✓；但——
 **BLOCK 第 1 处（title）**：「197 一句把**两个「绝望」**分工得干干净净」——197 的本书译句是「短暂地**绝望**了一下，随即**拼命**采取措施」，
 desperate 在这一句走的是卡 `m` 第一档「不顾一切的」，**该段并没有两个"绝望"**。按基线判 BLOCK，处置＝口径 6（标题只说这一段各领哪样东西，sense 槽留「绝望」，证据强度补"本书没这样译过"）。
 （同一片段里草稿在 diff 第五格自己写了「卡 m 第一档写的就是『不顾一切的』」——标题与自家结论打架，改标题即可。）
 **BLOCK 第 2 处（diff 一句话区别，要上线）**：desperate 那行写「它自己**从来**不当主语、不当宾语，只修饰 steps/attempt 这类动作名词」——
 支撑只有 2 处（197 定语 + 卡 ex `a desperate attempt` 定语），「从来」是本书口径撑不住的绝对禁令，违反作业书第 7 条"不许把本书就这么写升级成语法禁令"。
 改法：「本书 2 处都在名词前（197 的 steps、卡 ex 的 attempt）」。
F 同源与厚度：草稿主动申报「两张卡的词伙段与课文 197 是同一处文本」✓ 态度对；但计数写「四个『出处』实际只有**三处**独立文本（197、1259、两张卡 ex 各一句）」——
 括号里列的是 **4 项**，去重后也正是 4 处独立文本 → MISMATCH（数字自相矛盾，落地者会少算一条）。
**判定：需作者改**（2 处 BLOCK + 1 处计数）。这组的区别本身（名词位 vs 形容词位、feel 后 vs steps 前）我逐条 grep 过，**站得住，不必退回**。

---

## 组 18（2_02·组4） · decay / rot

A 原文表：**OK**。6 行（222–227）逐字 ✓；`paraZh` 逐字 ✓；成员句号 225（rot）/226（decay）与标记一致 ✓（225 heads 含 rot + decompose、226 含 decay + stale）。
B 句号与共现：225/226 相邻、同段 [0,38] ✓，与切片 `sents` 一致 ✓。
C 可 grep：命中 **15 条**，正面证据查无 **0 条**。逐条回验：`the slow decay of old leaves`（226 ✓）、`show signs of decay`（decay 卡 ex ✓）、
 `prevent decay`（decay 卡词伙 ✓ + prevent 卡词伙 ✓，prevent 卡的 note 我核过确含该条）、`clear away`（226 子串 ✓）、
 `wet stems rot in the corner`（225 ✓）、`Fallen bits decompose fast`（225 ✓）、`The apple will rot if left in the sun`（rot 卡 ex ✓）。
 否定行 2 条复验为真：`rot 卡 note 为空、零词伙段` ✓（note 确实是 `""`）；「decay『衰落』档、rot『使烂』及物档本书无书证」✓（decay 全书表面形式仅 226 一处；rot 单词一处，`rotten` 属另词头）。
D 宽度：默认行 草稿 33.5 / 实测 **33.5** ✓；总结句 草稿 18.0 / 实测 **18.0** ✓。
E 义项照抄：title「一个是动作，一个是被清走的东西」未宣称「都指腐烂」✓；core `慢慢烂掉那一摊` / `自己烂掉这个动作` 不含 m 词「腐烂／衰落」✓。
F 同源与厚度：`prevent decay` 在 decay 卡与 prevent 卡重复登记 → 出处清单写「两处独立登记，短语相同」✓ 没有拆成两条书证；
 rot 卡 note 空 → 明说、并拒绝为对齐造搭配 ✓ 规范。
 1 处口径不严（MISMATCH）：证据强度说「decay 侧书证也只有 226 一句」，同一文件 diff 表却引用了 decay 卡自己的 ex `show signs of decay` 与词伙 `prevent decay` —— 一句少报，两处说法自相矛盾。
 「两词各只有 1 处书证」这句只在"课文标记处"口径下成立，写"书证"要加限定。
**判定：可落地**（必改 1 句计数措辞）。作者说这是 5 组里最薄的一组并提请拍板：我判**不退**——225/226 相邻两句把「动词位 rot / 名词位 decay」摆在一起是**本书给的现成对照**，
 加上两卡 ex 共 4 处独立文本全部可 grep；薄不等于没有可写的区别。

---

## 组 19（2_02·组5） · grass / meadow

A 原文表：**OK**。6 行（234–239）逐字 ✓；`paraZh` 逐字 ✓。
B 句号与共现：235 同句标记 grass + meadow ✓；
 「grass 另有 6 处带标记（264、274、296、914、1495、1653）+ 638、640 两处为未标记的普通用法」——我逐处复算：grass 标记共 **7** 处（含 235）＝草稿的"另有 6 处" ✓；
 未标记而表面形式确为 grass 的恰为 **638、640** ✓（97/111 是 `grassy`，不算，草稿也没算）；meadow 全书标记＝表面＝**1 处**（235）✓。
 **这是 15 组里唯一一处把"标记 / 未标记"两个口径分开并且算对的书证清单。**
C 可 grep：命中 **26 条**，正面证据查无 **0 条**（本组无否定行）。逐条回验：`chewed long grass`（296 ✓）、`mow the grass in front of the house`（1495 ✓）、
 `played in the grass`（274 ✓）、`The children play on the grass after school`（grass 卡 ex ✓）、`nothing but grass on both sides`（914 ✓）、
 `dwarf the small grass at its foot`（1653 ✓）、`grass eating herbivore`（herbivore 卡词伙 ✓ + 264 原句 ✓）、`Fresh grass clippings`（235 ✓）、
 `a wide meadow walk`（235 ✓）、`wide meadow` / `meadow walk`（meadow 卡词伙 ✓）、`The cows are grazing in the meadow`（卡 ex ✓）、`long grass`/`fresh grass`（grass 卡词伙 ✓）。
D 宽度：默认行 草稿 38.0 / 实测 **38.0** ✓；总结句 草稿 22.5 / 实测 **22.5** ✓。
E 义项照抄：title「一个论层、论堆，一个论块」未宣称「都指草地」✓；core `长着、嚼着、割着的那层` / `能走进去的一整块地` 不含「草；草地」「牧场」✓（「草地」只进 sense/scene 槽）。
F 同源与厚度：meadow 两条词伙与 235 同源 → 明写"同一处文本，落地别算两条独立证据"，并给出"真正独立的出处只有卡 ex 奶牛那句" ✓ 完全属实（我复算 meadow 独立文本＝235 + 卡 ex = 2 ✓）；
 236 的 `lawn` 有自己单独的卡（我核 `lawn` 卡存在，词伙 `lawn edge`）→ 按规矩没并进本组 ✓。
**判定：可落地，A–F 六项无一处需要改 —— 本范围 15 组里唯一一个"干净通过"的组。**

# 批次 2 · 切片 03（worklist_idx 20–24）

## 组 20（2_03·组1） · breed / feed

A 原文表：**OK**。6 行（272–277）逐字 ✓；`paraZh` 逐字 ✓。（正文行「…兔子生太快段 47 `paraZh`「…」」那句缺句号、括号也没闭合，是排版磕碰，不进 title/summary/diff，改顺手时一并抹平即可。）
B 句号与共现：275 ✓（feed + breed 同句标记）；`A white farm goose honked for feed` 我按草稿标的「课文第 303 句（段 [0,52] 第 1 句）」复算 ✓ 逐字对、段内序号也对；
 「本段小标题栏位为空、生效的是第四卷『动物救助站——周末义工』，起自段 45」复算 `subheads`：45 处确有该小标题、47 处确为空 ✓ 这条查得细。
C 可 grep：命中 **28 条**，正面证据查无 **0 条**（本组无否定行）。逐条回验到**具体那张卡**：
 `The farmers breed cows to get more milk.`（breed 卡 ex ✓）、`captive breeding projects`（breed 卡 **与** captive 卡同条词伙 ✓ 两卡都核过）、
 `feed family`（feed 卡词伙 ✓）、`She feeds the cat every morning.`（卡 ex ✓）、`reproduce, propagate, raise` / `nourish, sustain, rear`（两卡同义词栏 ✓）、
 `child rearing duties` + rear 卡同义词含 feed（✓）、"consume、prey 两卡同义词栏也写着 feed"（✓ 两张卡都查到）、
 `breed mistrust`（breed 卡词伙 ✓，草稿说明"不属饲养档、只报备"✓）、`interbreed/hybridise/proliferate/sterility`（276/277 词头 ✓）。
 否定行「本书没有一处把 breed 当名词用」复算 ✓（breed 表面形式全书仅 275 一处，动词）。
D 宽度：默认行 草稿 38.0 / 实测 **35.5**；总结句 草稿 19.5 / 实测 **18.5** → MISMATCH（= 1A 口径，全表口径问题，见文件头）。
E 义项照抄：core `管它们生不生` / `管它们吃不吃` 不含 m 词（交配繁殖／饲养／喂）✓；默认行用「让动物生 / 给动物吃」✓；
 title 说「中文都跟『养』沾边，英文管的不是同一头」——**没有**宣称本段两词都＝饲养，且已在证据强度里写明"275 那次 breed 是繁殖不是饲养" ✓ 口径 6 的处置做对了。
F 同源与厚度：`captive breeding projects` 两卡同串 → 已注明"（breed 卡与 captive 卡同条词伙）" ✓ 没拆两条；
 「breed 全书 1 次」✓；**但「feed 2 次（275 / 303）」只数了带词头标记的 2 处**：feed 这个词在课文另有 2 处未标记的动词用法 ——
 198 `how photosynthesis feeds green shoots`（本书译「光合作用如何**喂养**绿苗」）、1346 `the devil who feeds upon angry quarrels`（译「以愤怒争吵为食」）。
 → 写成"feed 2 次"会让落地者以为 feed 侧只有两句可引；措辞要加"带标记"限定（MISMATCH）。
 语义 1 处：items 词性列写 feed「`n.` 饲养/**饲料**（卡 `m`…）」——feed 卡 `m` 原文只有「v. 喂；n. 饲养」，**全书所有卡 `m` 里查不到"饲料"二字**，
 把"饲料"挂在"（卡 m）"名下是加了料。改成「n. 饲养（本书 303 译『讨吃的』）」即可（MISMATCH，位置在 items 列，落地前请一并清掉）。
**判定：可落地。** 作者提的「共享义项『饲养』名不副实」我判：**按口径 6 处理正确，不退**（两卡 m 的「饲养」确实分挂动词档 / 名词档，我逐字复核为真），
 必改 2 处（feed 次数限定、「饲料」归源）。

---

## 组 21（2_03·组2） · descendant / offspring

A 原文表：**OK**。4 行（272–275）逐字 ✓，且表上方已声明"只列本组两句 + 邻句，整段见组 1"——不视为漏句 ✓。
B 句号与共现：273（`[[descendant:descendant]]` + `[[ancestor:ancestor]]`）、274（`[[offspring:offspring]]`）✓；「与组 1 主锚点同为段 [0,47]」复算 ✓ 真实存在挂位冲突。
C 可 grep：命中 **21 条**，正面证据查无 **0 条**。逐条回验：`a descendant of the first king`（descendant 卡 ex ✓）、`its happy descendant`（卡词伙 + 273 ✓）、
 `her tiny offspring`（卡词伙 + 274 ✓）、`The dogs had three offspring last spring`（卡 ex ✓）、`an ancestor of the gibbon`（273 ✓）、
 `My ancestor came from China a hundred years ago.`（ancestor 卡 ex ✓）。
 **4 条反例我逐条亲 grep，全部为真**（两文件合并、标记按表面展开后）：`descendants` 0 处、`offsprings` 0 处、`a offspring` 0 处、`offspring of` 0 处 ✓ 放行。
 → 顺带核了文件头小结那句"全文只有 8 条查不到、全是反例"：**成立**（我独立跑切分器，2_03 反引号串里查无的实词正好是
 trace back / track record / on track / lose track of / motivate sb. with / stimulate sb. to do / stimulate interest / descendants 这 8 条，
 再加裸写在计数结论行的 offsprings / a offspring / offspring of 3 条，全部落在明写的反例行里，无一条当正面证据用）。
D 宽度：默认行 草稿 34.0 / 实测 **32.5**；总结句 草稿 23.5 / 实测 **22.5** → MISMATCH（口径）。
E 义项照抄：title「这两句都在讲"后代"」——273 译「快乐的**后代**」、274 译「小小的**后代**」，**该段真撞**，按基线放行 ✓；
 core `往回认的那一个` / `刚生的那一窝` 不含「后裔／子孙／后代／子女／幼苗」✓。
F 同源与厚度：「各 1 条卡上词伙恰好就是课文那两处 → 共 4 条独立文本」复算＝273、274、descendant 卡 ex、offspring 卡 ex = **4** ✓ 数得对（15 组里少数把独立文本数算准的一组）；
 「两卡 note 都没有同义词段」✓ 属实（两卡 note 各只有词伙）→ 所以本组没交叉引同义词，规矩 ✓。
 语义加注 1 处（MISMATCH）：274 被写成「妈妈在**喂奶**」、diff 里注「274 用的动词是 `nursed`（喂奶）」——
 本书 274 的译句是「妈妈**照顾**小小的后代」，offspring/descendant 两卡 `m` 也没有哺乳义。"喂奶"是加进去的第三义，落地时按本书译法写"照顾／喂养"。
**判定：可落地**（必改 1 处"喂奶"加注 + 宽度口径）。与组 1 抢段 [0,47] 挂位是**产品排布问题，不是本组内容缺陷**，我不据此判退回。

---

## 组 22（2_03·组3） · excrete / secrete

A 原文表：**OK**。6 行（323–328）逐字 ✓（含 328 那种"蝙蝠用柔和声学回声移动鸭子黄昏需要…"的无标点原译，草稿照抄未美化 ✓）。
B 句号与共现：323 同句含 `[[secrete:secrete]]`、`[[excrete:excrete]]` ✓；「323 里只有 secrete、excrete、fluid 三个词头被标记」复算 heads 正好这 3 个 ✓ 精确；
 paraZh（段 55）复算 ✓ 与草稿描述一致；「gland / kidney 各有一张卡」✓ 两卡都在；「kidney 卡 note 为空」✓ 属实。
C 可 grep：命中 **27 条**，正面证据查无 **0 条**。逐条回验：`secrete thick fluid`（secrete 卡 + fluid 卡同串 + 323 ✓ 三处都核）、
 `secrete sweat to cool the body`（secrete 卡 ex 连续子串 ✓）、`excrete waste`（卡词伙 + 323 ✓）、`excrete waste from the body`（卡 ex 子串 ✓）、
 `The gland makes saliva in her mouth`（gland 卡 ex ✓）、`small gland`（gland 卡词伙 ✓）、`He drank water to help his kidney work better`（kidney 卡 ex ✓）、
 `discharge, exude, release`（secrete 卡同义词栏 ✓）+ discharge 卡回列 secrete（✓ 互指成立）、`night instinct`（instinct 卡词伙 + 324 ✓）。
 否定行「ex-/se- 词根讲法两卡无任何标注，不写」✓ 属实（两卡 note 无词根栏）。
D 宽度：默认行 草稿 38.0 / 实测 **35.5**；总结句 草稿 22.0 / 实测 **21.0** → MISMATCH（口径）。
E 义项照抄：title 提「分泌」「排泄」是**引述两卡义项栏已经分开**（secrete 只写分泌、excrete 第一档是排泄），并**没有**宣称本段两词都＝分泌 —— 本段译文也确实分开（secrete「分泌」/ excrete「排出」）→ 处置正确 ✓；
 core `往外送有用的` / `往外扔废物` 不含「分泌／排泄」✓。
F 同源与厚度：「两卡各自的词伙 `secrete thick fluid`、`excrete waste` 都就是 323 那一处」✓ 已点名同源，
 **但同一句结论写「共 4 条独立文本」**——去重后是 **3** 条（323、secrete 卡 ex、excrete 卡 ex）→ MISMATCH（同源已经自己点破了，计数却没跟着减）。
 附加价值（要转出去）：草稿照录并报备 **secrete 卡 `ex` 原文是 `The gland secrete sweat to cool the body.`（三单没加 s）**——
 我复核 vocab.json 确认**数据里就是这样**。辨析卡侧不该改，但这条是**词卡数据缺陷**，落地时要另开一条修数据的线（同一段材料里 `feeds`／`secrete` 这类形态问题不止一处）。
**判定：可落地**（必改 1 个计数）。作者称"本切片最干净的一组"，我复核**同意**：同句 `while` 对举 + 出去的东西一个有用一个废物，是 15 组里区别最硬的一组。

---

## 组 23（2_03·组4） · trace / track

A 原文表：**OK**。6 行（329–334）逐字 ✓；`paraZh` 逐字 ✓（「…休眠冬眠**追踪踪迹**备用路线…」原文确为「追踪踪迹」连写 ✓，草稿用它撑起表头这个抓手是对的）。
B 句号与共现：330（`[[track:track]]`）/ 331（`[[trace:trace]]`）都在 [0,56] ✓；段外两条的坐标我逐条复算：
 113 = 段 [0,19] 第 5 句 ✓、1666 = 段 [5,28] 第 5 句 ✓、330 = 段 [0,56] 第 1 句 ✓；「trace 全书标记 3 处（113/331/1666）」复算 ✓；「生效小标题第四卷」✓。
C 可 grep：命中 **27 条**，正面证据查无 **0 条**。逐条回验：`hoping to trace the leak that same day`（113 ✓）、`no trace of sickness in the water`（331 ✓）、
 `No trace of cancer showed up in her tests`（1666 ✓）、`no trace of blood on the floor`（trace 卡 ex ✓）、`helpers track weight charts with great care`（330 ✓）、
 `track down criminals` / `keep track of expenses`（track 卡词伙 ✓ 两条都在）、`The dog followed the track of the rabbit`（卡 ex ✓）、
 `observe, track, oversee`（monitor 卡同义词栏 ✓）。
 4 条反例复验全为真：`trace back`、`track record`、`on track`、`lose track of` 两文件 **0 处** ✓；「`keep track of` 课文里没用过」复算 0 ✓ 诚实。
D 宽度：默认行 草稿 37.5 / 实测 **35.0**；总结句 草稿 25.0 / 实测 **23.5** → MISMATCH（口径）。
E 义项照抄 + **BLOCK 第 1 处（title）**：title 写「这一段**两个"追踪"**挨着出现」——330 的 track 本书译「**追踪**体重表」✓，
 但 331 的 trace 本书译「没发现任何疾病的**痕迹**」，**该段并没有两个"追踪"**；而同一份草稿最后一行 diff 自己写着「本书译文把 trace 处理成痕迹/踪迹、track 处理成追踪」。
 标题与自家结论互相打脸 → 按基线（写进标题而该段不撞）判 BLOCK；处置＝口径 6，标题改"这一段一个在盯表、一个在查有没有留下东西"。
F 同源与厚度 + **BLOCK 第 2 处（diff 一句话区别，要上线）**：
 「名词档是什么东西 | trace」写「课文 2 处 + 卡 ex 1 处，**3 处名词用法全在 `no trace of` 这个框里**」，「带 of 时各是什么框架」再写「它的 of 前面站着 **no**：查不出残留」，
 证据强度还补了一句「三处全是 no trace of 且都在否定句里」。
 我复算 trace 的全部表面形式：除 113（动词）、331、1666、卡 ex 之外，还有
 **199 `Leaves respire at night, taking in air and giving off a trace of dioxide.`（本书译「排出一点二氧化物」）** ——
 一条**肯定式的 `a trace of` 名词用法**（该句未标 trace 词头，所以作者按标记数数时漏了），另有 **178 `Leo traced the moon's orbit`**（动词，同样未标记）。
 → 「全在 no trace of／都在否定句里」被本书自己证伪；这两处都在**要上线的 diff 文本**里 → BLOCK。
 改法：名词档计数改「本书 trace 名词 4 处：3 处 `no trace of`（331/1666/卡 ex）+ 1 处 `a trace of`（199，肯定式）」；"of 前面站着 no"降级为"本书 4 次里 3 次走 no trace of"。
 其余合规：trace 卡 `note` 只有同义词栏、零词伙 → 明说 ✓ 且提出可补的两条（`no trace of blood`＝它自己 ex、`trace the leak`＝113）我复算**都在数据里** ✓；
 `all_synonyms: true` 与两卡互列同义词一致 ✓。
**判定：需作者改**（2 处 BLOCK + 计数）。这组的区别（名词一个痕迹 / 一条路、`keep track of` 只在 track 侧）本身有书证，改完可落地，**不必退回**。

---

## 组 24（2_03·组5） · motivate / stimulate

A 原文表：**OK**。6 行（351–356）逐字 ✓（含 355 的 `all-round` 原文带连字符、表里写作 `all round` 已在出处清单注明按表面形式引 ✓）；`paraZh` 逐字 ✓。
B 句号与共现：351 ＝ 章1 段2 第 0 句（339＋段0/段1 各 6 句＝351）✓ 与切片 `sents` 一致；两词同句被同一个 `would` 并列 ✓ 复算 heads 含 motivate + stimulate。
C 可 grep：命中 **35 条**，正面证据查无 **0 条**。逐条回验：`Good teachers motivate students to learn`（motivate 卡 ex ✓）、`stay motivated`（卡词伙 ✓）、
 `stimulate thoughts` / `visually stimulating` / `stimulate consumption`（stimulate 卡词伙 3 条 ✓ 一条不多一条不少）、
 `The bright light stimulated her eyes`（卡 ex ✓）、`The bright light was a stimulus for the baby to open his eyes`（stimulus 卡 ex ✓）、
 `a useful spur`（352 + spur 卡词伙 ✓）、`fresh impetus`（352 + impetus 卡词伙 ✓）、
 incentive 卡同义词栏 `drive, motivation, stimulus, stimulate` 与 3 条词伙（✓ 逐字对）。
 「两栏几乎一字不差（只差 inspire）」复算：motivate 6 词 / stimulate 5 词，差的正是 inspire ✓ 精确。
 3 条反例复验全为真：`motivate sb. with`、`stimulate sb. to do`、`stimulate interest` 两文件 **0 处** ✓ 放行。
D 宽度：默认行 草稿 38.5 / 实测 **36.0**；总结句 草稿 23.5 / 实测 **22.5** → MISMATCH（口径）。
E 义项照抄：title「两张卡的义项栏都写着『激励』，宾语却不是一路东西」——**引述卡 m 并立刻否定**，本段译「鼓励（小宇）／激发（好奇心）」确都属激励档 → 放行 ✓；
 core `让人肯去干` / `把念头或反应点着` 不含「激励／激发／刺激」✓；sense 槽保留「激励；激发」「刺激；激励」✓。
F 同源与厚度：「共 6 条独立文本」复算＝351、motivate 卡 ex、stimulate 卡 ex、`stay motivated`、`stimulate thoughts`、`visually stimulating`、`stimulate consumption` = **7 条**
 （这些词伙全都不与课文同源，我逐条 grep 过：`stay motivated`、`stimulate thoughts`、`visually stimulating`、`stimulate consumption` 课文 0 处）→ MISMATCH（少算 1 条，方向安全但数字不对）。
 「相对薄的是 motivate 侧：卡上词伙只有 `stay motivated` 一条，本书也只 1 次」复算 ✓ 属实；没有为对齐造搭配 ✓。
 「义项名副其实」这句自查：我复核**同意**（两卡 `m` 都含「激励」，本段两处用法都落在激励档，不像 2_02 组1/组3 那样在段内被拆开）。
**判定：可落地**（必改 1 个计数 + 宽度口径）。

---

# 汇总与要人拍板的 3 条

## 缺陷台账（BLOCK 6 处 / MISMATCH 27 处，按组）

| 组 | BLOCK（落地上线文本被数据证伪 / 违基线） | MISMATCH（草稿侧记账） |
|---|---|---|
| 5 damp/humid | — | 103 段内序号写成第 0 句（实为第 1 句）；默认行 40.0/37.0；总结句 22.5 两口径都不合 |
| 11 natural/nature | — | 「卡上 4 条词伙」实为 3 条；4 条跨卡词伙全与课文同源未点破；`feel close to nature` 被误归"性子"档（nature 侧少 1 条书证）；宽度口径差 |
| 12 gas/petrol | — | gas 词性「本书零冠词」实指卡上词伙；宽度口径差 2.5 |
| 13 cosmos/universe | **「本书 2 处全在句子开头当主语」**——163 里 universe 是并列主语第二项，句首是 Interstellar space | 宽度 2 处（默认 38.5/36.0、总结句 23.5 两口径都不合） |
| 14 spacecraft/spaceship | — | 默认行 40.0/37.5；总结句标称 30.0 但**按作者自己那套口径实测 31.0，已越 ≤30** |
| 15 expedition/exploration | **title「把两个『探险』并排放」**——175 本书译「探索／远征」，该段不撞（且文件头自称"5 组义项核对一致"） | 「交叉出处 6 条」含 2 组同串，去重 4 条 |
| 16 sample/specimen | — | **「课文只出现 1 次 / 查不到 take samples 原样」为假**：111 就是 `They take samples`（译「取样」），另有 320 `in samples` |
| 17 despair/desperate | **title「两个『绝望』」**——197 里 desperate 译「拼命」，该段不撞；**diff「它自己从来不当主语、不当宾语」**（2 处证据升级成禁令） | 「四个出处＝三处独立文本」括号里列 4 项，实为 4 |
| 18 decay/rot | — | 「decay 侧书证也只有 226 一句」与同组 diff 引用 decay 卡 ex 矛盾 |
| 19 grass/meadow | — | 无 |
| 20 breed/feed | — | 「feed 2 次」漏 198/1346 两处未标记 `feeds`；items 把「饲料」挂在「（卡 m）」名下（全书卡 `m` 无"饲料"）；宽度口径差 |
| 21 descendant/offspring | — | `nursed` 注成「喂奶」（本书 274 译「照顾」，卡 `m` 无哺乳义）；宽度口径差 |
| 22 excrete/secrete | — | 「共 4 条独立文本」去重后 3 条；宽度口径差 |
| 23 trace/track | **title「两个"追踪"」**（331 trace 本书译「痕迹」，该段不撞）；**diff「3 处名词用法全在 `no trace of`／of 前站着 no」**——被 199 `a trace of dioxide` 证伪，且 178 `traced` 也被漏计 | 宽度口径差 |
| 24 motivate/stimulate | — | 「共 6 条独立文本」实为 7；宽度口径差 |

**「宽度口径」这一族（10 个组、共 13 处）我全部只记 MISMATCH、不记 BLOCK**，理由：
按机检 `validate_data.py._width` 复算，15 组的默认行 33.5–40.0、总结句 18.0–29.5，**没有一行超限**；作者标称值一律 ≥ 实测值（方向保守，不是虚报放行）。
但作业书 D 写的是「其余（字母/空格/=/括号/**标点**）计 0.5」＝机检口径，按字面「差 >1.0 即 BLOCK」，则 2_01 与 2_03 的 10 个组默认行全要判 BLOCK ——
而**批次 1A（他点头过的那 5 行「简单记」）在同一算法下差值也是 1.5–2.5**，等于回头把已验收的批次判成 BLOCK。所以我判：这是**口径定义分叉**，不是作者算错，交给你一次定死。
真正属于"标称值本身算错"（两种口径都对不上，不是口径差）的只有 3 处：`2_01 组1 总结句 22.5`（实测 20.5 / 21.5）、
`组4 总结句 23.5`（实测 23.0 / 24.5）、`组5 总结句标称 30.0`（作者自己那套口径下实为 **31.0，已越 ≤30**）。

## 需要你拍板的 3 条

1. **宽度口径统一定死（影响全表 210 组，不只是我这 15 组）**：现在三套并存——批次 1A/2_01/2_03 用「汉字＋全角标点＝1」，2_02 用机检「只有汉字＝1」，
   作业书 D 的括号又写标点算 0.5。建议：**以 `scripts/validate_data.py._width` 为唯一口径**（它是落地时真会拦的那条），
   要求所有草稿重标；并顺手把 `2_01 组5` 的总结句（作者口径 31.0）压回 ≤30。定了之后我在其余范围一次性处理，不必逐组来问。
2. **作者自请退回 / 降级的 4 组，我的判定是"都不退"**：`13 cosmos/universe`（改 1 处"句子开头"表述）、`14 spacecraft/spaceship`（改 1 个宽度数）、
   `12 gas/petrol`、`20 breed/feed`（义项名不副实已按口径 6 处理）、外加 `18 decay/rot`（最薄但对照现成）。
   共享的 `11 natural/nature`、`23 trace/track` 也照这个走。**要退就明确"薄到哪种程度算没有可写的区别"**，否则按我的判定全部落地；
   另外 `2_03 组1 / 组2` 两张卡都挂段 [0,47] 末（作者提请的挂位冲突），是渲染排布问题，请一并定。
3. **`16 sample/specimen` 那条假否定怎么处理**：我复算 sample 在课文有 3 处（111/182/320），111 就是卡上词伙 `take samples` 的课文现场（本书译「取样」）。
   要作者改（把 111 补进表、删掉那句"查不到"）我就能落地；但请顺带定一条口径：**"本书查不到 X"这类反例句，以后是否要像正面证据一样强制附 grep 结果**——
   因为这一类是门禁 1 结构上唯一拦不住的（它跳过否定行）。本轮 15 组里我逐条手工验回的"本书查不到 X"断言共 **21 条**
   （2_01 计 9、2_02 计 1、2_03 计 11＝8 条反引号 + 3 条裸写在计数结论行），**只有上面这一条是假的**，其余 20 条复验确实 0 处。

