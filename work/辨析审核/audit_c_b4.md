# 门禁 2 审核 · 批次 4 切片 23+24（worklist_idx 114–123，共 10 组）

> 审核代理：audit_c_b4（独立于草稿作者）。数据只读 `shadow/data/vocab.json`、`shadow/data/sections.json`；
> 判"合规"按 `work/compare_slices/BRIEF.md` §五 的 13 条 + `AUDIT_BRIEF.md` A–F，不按审核者英语观。
> 宽度一律用 `python3 -c "...from width_rule import width..."` 复量，未手算。未跑 `land_compare.py`，未做任何 git 写操作。
>
> 机检基线（审核者自己跑）：`python3 tools/check_compare_draft.py work/辨析草稿/4_05.md work/辨析草稿/4_06.md`
> → **两份都 OK，门禁 1 PASSED**（草稿自述属实）。
> 「该段原文」表格逐字符回数据：4_05 共 21 行、4_06 共 29 行，**不符 0 行**（脚本比对：去 `**` 粗体后与
> `paragraphs` 去 `[[词头:表面]]` 标记的表面形式全等，中文列与 `sentZh` 全等，撇号/标点/大小写一并参与比对）。
> 宽度 20 条标称值（10 默认行 + 10 总结句）**全部与实测一致**，无一超上限。

组数 10 / **BLOCK 1**（组 119）/ **MISMATCH 2**（组 115、组 117）/ **可落地 7**（114、116、118、120、121、122、123）

---

## 组 114 · jail / prison（4_05 组 1）

A 原文表：**OK** —— 章3 段60 全 6 句（1246–1251）逐字符与数据相等（英 6 / 中 6 全等，无撇号差异、无并句、无译句错位）。
B 句号与共现：**OK** —— 段60 起句 = 883 + 前 60 段句数之和 = 1246，段内 6 句 → 1250 第 4 句 / 1251 第 5 句，与 worklist `sents [1250,1251]` 对齐；`[[jail:jail]]` 实测在 1250、`[[prison:prison]]` 在 1251，成员确在同一共现段。计数两档分开报得对：jail 标 1 / 未标 0、prison 标 1 / 未标 0（审核者独立跑 `(?<![a-z])word(?![a-z])` 全文匹配，未打标记确为 0）。
C 可 grep：**OK** —— 卡面串 12 条逐条命中（jail/prison 的 `ex`+`exZh`、词伙 `send them to jail` / `an oversized prison` / `serve a prison term` / `prison sentence`、escape 卡 `ex`、escape 同义词栏 `flee, evade, break free`、judge 卡词伙 `stern judge`、课文 1246–1251）。草稿标"本书 0 处"的 7 条（`jailbird`、`prisoners`、`prison break`、`county jail`、`book someone into jail`、`inside prison`、`the jail`）**逐条 grep 确无**，属诚实反例，无一条被当正面证据用。"prison 另有 1 张别的卡的 ex 在用它（escape）"复核 = 1 张，准确。
D 宽度：标称 36.5 / 实测 **36.5**（≤40）；总结句标称 22.0 / 实测 **22.0**（≤30）→ **OK**。
E 义项照抄：**OK（附一句提醒）** —— 「监狱」在 `sense` 槽；表头以引号引用 worklist 义项并立刻给分工（「各牵着那栋房子的哪一块」），未把义项写进 `core` / 默认行。提醒：表头写"两处都站得住"是**肯定式**而非否定式引用，审核者已独立验它成立（1250 = 牢房铁栏、1251 = 监墙，两处都指关人的那栋房子），所以不属 §五.11 拦的"宣称而不撞"；若他要求表头一律走否定句式，这条只需改措辞、不改事实。
F 同源诚实：**OK** —— jail 侧 3 条 / prison 侧 6 条与审核者独立计数一致；`send them to jail`（词伙）与 `He was sent to jail for stealing.`（卡 ex）确为两句不同文本，不并条的处理正确；两卡 `ex` 同形只算"各自一侧 1 条"，草稿**没有**据此宣称"两处书证方向一致"，只写成"可换"物证并提请拍板 —— 符合口径 8。
判定：**可落地**。提请拍板那一条（`ex` 同形 vs `all_synonyms: false`）审核者判断见文末"两件独立核的"第 1 条 —— 草稿的处置（照现表落地、不因标记退回）与结论一致，但**它的措辞要按新口径改一行**（见 4_05 组 1「数据边界」）。

---

## 组 115 · confine / prison（4_05 组 2）

A 原文表：**OK** —— 表内 1250 / 1251 两句逐字符相等；"整段六句见组 1"的指代属实（同段同表）。
B 句号与共现：**OK** —— worklist `sents [1251]`，两成员同句：1251 的 heads 实测 = `['confine','paper','prison']`，confine 与 prison 确实挤在同一句前后两半（草稿的核心论断成立）。confine / prison 各"标 1 / 未标 0"复算一致。
C 可 grep：**1 处 MISMATCH** —— 命中项：confine 卡 `ex`/`exZh`、confine 卡 `同义词：constrain, curb, limit`、restrict / limit / curb 三卡各自同义词栏列 confine（审核者独立跑：**恰好 3 张卡**，与草稿"另在 3 张别的卡的同义词栏里被列名（restrict / limit / curb）"完全一致）、`constrain 无卡`（实测 vocab.json 无 constrain 词条 ✓）、课文 1249 / 1251 / 1253、prison 三条词伙、escape 卡 ex、cell 卡报备（课文 312 = `No cage was used and the cells remained open.`，heads 含 cage+cell、译文「那个小隔间」、上下文 hive/nest 在 311 —— 草稿这条"看着像其实不是"的报备**逐点属实**）。
  **不符的一格**：diff「卡上把它记在哪一族 · confine」写"三张卡的同义词栏互相指来指去，**列的全是 limit / restrain 这一路**"。实测三栏内容 = `constrain, curb, limit` / `confine, constrain, constraint` / `confine, constrain, constraint, curb` / `confine, constrain, limit`，**没有一处出现 restrain**；`restrain` 在 `vocab.json` 全部 3245 张卡的 `note` 里 0 次命中（restrain 自己那张卡 `note` 是空串），它只出现在课文 1253。→ 这是"描述卡面内容时点错了一个词"，不是造串（`restrain` 本身在数据里，门禁 1 结构上抓不到）。**修法：把该格的 `restrain` 改成 `constraint`**（或写"limit / curb / constrain 这一路"）。本组的结论（confine 被记在「限制」族、没记在关押族）不受影响。
  草稿标"本书 0 处"的清单（`imprison`、`detention`、`cell block`、`confine to bed`、`confinement`、`solitary confinement`）逐条 grep 确无 ✓。
D 宽度：默认行标称 36.5 / 实测 **36.5**；总结句标称 18.0 / 实测 **18.0** → **OK**。
E 义项照抄：**OK（豁免适用）** —— 表头「worklist 给的共同义项『监禁』在这一句里两侧都没落上」正是 §五.11 拍板的"引用义项 + 当场否定"写法；「监禁」未进 `core`（core = 那堵监墙 / 把哪样东西圈在某处）、未进默认行。审核者独立复核该否定断言为真：confine 全书 2 处（课文 1251 + 卡 ex `confined to his room`）都落「限制」档，本书确无一处把 confine 当"关进监狱"用；1251 的 prison 走 walls。→ 按口径 6 处理正确，不必退回。
F 同源诚实：**OK** —— 本组显式做了去重（"同句 1251 的 confine 证据只计本组、prison 证据只计组 1"），两组同挂段 60 末也不重复计 prison 那 6 条，做法比口径 8 的最低要求更严。
判定：**需作者改**，最小清单 = 1 处：diff「卡上把它记在哪一族」里 `restrain` → `constraint`。改完即可落地。

---

## 组 116 · oversee / supervise（4_05 组 3）

A 原文表：**OK** —— 表内 1252 / 1253 / 1254 三句逐字符与数据相等（英中两列全等）。
B 句号与共现：**OK** —— 段61 起句 = 883 + 前 61 段句数之和 = 1252，段内 6 句；worklist `sents [1252]` 对齐；1252 的 heads 实测含 `oversee` + `supervise`（同句两半，草稿核心论断成立）。两词"标 1 / 未标 0"复算一致（未打标记独立跑词形匹配 = 0）。
C 可 grep：**OK** —— 命中：课文 1252/1253/1254、两卡 `ex`/`exZh`、oversee 词伙 `oversee morning arrivals`、supervise 词伙 `personally supervise`、monitor 卡 `ex`（含直撇号 `students' progress`，与数据同形）、monitor 同义词栏 `observe, track, oversee`、trace 卡 `cmp` 里的 oversee 字样（实测确在 trace 已落地表的"带 of 时各是什么框架·track"格里，草稿"那是在逐字引 monitor 卡的栏，不算用例"的定性准确）、observe / track 有卡 ✓。标"本书 0 处"的 5 条（`supervision`、`overseer`、`supervise sb doing sth`、`under supervision`、`oversee the students`）逐条 grep 确无 ✓。"supervise 除自己那张卡外 0 次被引用"复算 = 卡库命中 1（仅 own）✓，"oversee 被别的卡收进栏里 1 次"✓（monitor；trace 那处是 cmp 文本，草稿已自行排除）。
D 宽度：默认行标称 39.0 / 实测 **39.0**；总结句标称 21.0 / 实测 **21.0** → **OK**。
E 义项照抄：**OK** —— 「监督」只在表头以引号引用 worklist 义项、`sense` 槽照卡；`core` = 盯着一整摊事 / 盯着，还要管到人（未照抄「管理」「指导」）、默认行与总结句均无义项词（脚本按卡 `m` 切档逐槽验，命中 0）。表头"这一句两处都成立"是肯定式，审核者独立验它属实（1252 两半都是"有人对着结果负责"的盯）。提醒：diff 有一格写"卡上白给的「指导」「管理」两档正是它跟 oversee 的分界"，属引用卡面档差而非编语义，且同行已自限"本书没写语域"；落地措辞要保留"卡上"二字。
F 同源诚实：**OK** —— 两卡词伙都被点名"就是课文 1252 那一句"并按口径 8 不另计，两侧各 2 条与审核者独立计数一致；未据同源宣称"两处方向一致"。
判定：**可落地**（无必须改项）。

---

## 组 117 · crime / sin（4_05 组 4）

A 原文表：**OK** —— 表内 1253 / 1254 / 1255 / 1256 四句逐字符相等（含 1255 的 `vice`、1256 的 `bribe`/`rob` 标记位）。
B 句号与共现：**OK** —— 1254 第 2 句、1255 第 3 句，与 worklist `sents [1254,1255]` 一致；heads 复核 `[[sin:sin]]` 在 1254、`[[crime:crime]]` 在 1255，两词确在同段相邻两句。crime / sin 各"标 1 / 未标 0"复算一致（`sin` 的词形匹配已排除 since / singing / singer / single / sink / sincere，与草稿的自注一致）。
C 可 grep：**1 处 MISMATCH（分布计数说小了）** —— 正面证据全命中：crime 卡 `ex`/`exZh`、同义词栏 `offence, felony, wrongdoing`（实测三词**都无卡** ✓，按硬约束 2 不进成员的做法对）、词伙 `crime rates, youth crime, combat crime`、sin 卡 `ex`/`exZh`、`darker sin`、`hidden vice`（vice 卡 note 实测就是这一条 ✓）、arrest / guilty / commit / curb / prevent / community / repent / clue / evidence / enormity 各条原文逐字相符。"crime 在别的 11 张卡里被用到"复算 = 除 crime 卡自己外正好 **11 张**（curb / community / commit / clue / enormity / prevent / evidence / youth / repent / rat / rate，名单一字不差）✓；"sin 除自己那张卡外全书 0 处"✓；`commit crime` 课文 0 处 ✓；`criminal trials`（trial 卡）/ `criminal record`（record 卡）本书**确有** ✓，草稿把它归到"不写的"里并说明 `criminal` 无卡，属诚实报备。
  **不符的一格**：出处清单第 297 行为 arrest 卡 `ex` 加注"本书另外两处带 police 的文本是 crime 卡 ex 与课文 1250"。实测"带 police 的文本"远不止两处：**11 张卡的 `ex` 含 police**（enforce / investigate / arrest / crime / clue / assault / evidence / surrender / patrol / evacuate / scheme），课文侧 1 处（1250）。→ 这是一次**漏报式虚报**（把 11 说成 2），不是造串；被支持的"警察在 crime 那一头"结论本身仍有 crime 卡 ex + 课文 1250 撑住，所以不升级成 BLOCK。**修法：把该括号改成"另见 enforce / investigate / patrol / evacuate / scheme 等 11 张卡的 `ex`，课文侧只 1250 一处"**，或删掉"另外两处"这个数量词。
  标"本书 0 处"的 7 条（`sinner`、`commit a sin`、`pay for your sins`、`crime wave`、`misdemeanor`、`moral crime`、`organised crime`）逐条 grep 确无 ✓。
D 宽度：默认行标称 38.5 / 实测 **38.5**；总结句标称 16.0 / 实测 **16.0** → **OK**。
E 义项照抄：**OK** —— 「罪行」在表头是"引用 + 分头修正"（crime 译「案子」／sin 译「亏心事」），未写进 `core`（归警察查的那一件 / 自己心里那份亏）、默认行、总结句。审核者独立复核该修正是真的：1254 `sentZh` 确为「亏心事」、1255 确为「案子」，而 sin 卡 `exZh` 确写「撒谎的**罪行**」——草稿"卡上有用、课文没用"这一定性两头都对。
F 同源诚实：**OK** —— `darker sin`（= 1254）、`hidden vice`（= 1255）两条同源都点名不另计；`crime rates` / `youth crime` 跨卡同串只算 1 条；两侧条数（crime 侧十来条 / sin 侧 2 条）复算一致，且明写"厚薄差是常态、真区别靠两卡 ex 各 1 句"，没有把同源文本凑成独立两处。
判定：**需作者改**，最小清单 = 1 处：把"另外两处带 police 的文本"这条数量断言改对（或去掉数量词）。改完即可落地，不必退回。

---

## 组 118 · blast / explosion（4_05 组 5）

A 原文表：**OK** —— 章4 段0 全 6 句（1277–1282）逐字符相等，**含 1277 那句**（作者虽"不整句引用"，但原文表里照抄了，审核者逐字符验回：与数据全等）。
B 句号与共现：**OK** —— 章4 偏移 1277，段0 起 1277、段内 6 句 → 1280 第 3 句 / 1282 第 5 句，与 worklist `sents [1280,1282]` 一致；`[[explosion:explosion]]` 实测在 1280、`[[blast:blast]]` 在 1282，中间隔 1281 ✓（草稿"隔一句"属实）。两词"标 1 / 未打标记 0"复算一致。
C 可 grep：**OK** —— 命中：课文 1278 / 1279 / 1280 / 1281 / 1282、两卡 `ex`/`exZh`、blast 词伙 `loud blast`、explosion 词伙 `population explosion`、cataclysmic 卡 `ex`、bomb 卡 `ex`（`The bomb exploded at noon.`）与词伙 `bomb bridges`、burst 卡 `ex`。**三条"本书没有"的断言全部验实**：`explode` 无卡 ✓（vocab.json 里 explode / exploded 只出现在 bomb 一张卡的 ex 上 ✓）、`population explosion` 课文 0 处 ✓、demographic 卡 `cmp` 里的 explosion 字样确是"点名 population 挂在哪几张卡"而非用例 ✓。标 0 处的 8 条（`blast off`、`blastoff`、`bomb blast`、`gas explosion`、`detonation`、`shock wave`、`atomic bomb`、`explosion of anger`）逐条 grep 确无 ✓。框架计数复核："blast 侧 2 条里 1 条带 of、explosion 侧 4 条 0 条带 of" 与数据一致 ✓。
  ⚠️ **1277 不整句引用的事由成立**：审核者亲跑复现（见文末第 2 条），是门禁 1 工具的形状缺陷，不是作者误判 → 该报备保留到工具修好为止。
D 宽度：默认行标称 40.0 / 实测 **40.0**（正好贴上限，未超）；总结句标称 22.0 / 实测 **22.0** → **OK**。
E 义项照抄：**OK** —— 「爆炸」在表头是"引用 + 指出译文各落一档"，`core` = 传到跟前的那一声 / 炸开的那一下（未照抄「爆炸」「巨响」）、默认行与总结句 0 命中。「本书唯一那处 blast，中文用的是「巨响」而不是「爆炸」」审核者回 `sentZh` 验实 ✓。
F 同源诚实：**OK** —— `loud blast`（= 1282）、`bomb bridges`（= 1281）两条同源点名不另计；blast 侧 2 / explosion 侧 4 条复算一致；未据同源宣称"两处书证方向一致"。
判定：**可落地**（无必须改项）。

---

## 组 119 · hit / strike（4_06 组 1）

A 原文表：**OK** —— 章4 段3 全 6 句（1295–1300）逐字符相等（英中两列全等；本段无撇号）。
B 句号与共现：**OK** —— 章4 段3 起句 = 1277 + 段0–2 各 6 句 = 1295；1298 第 3 句 / 1299 第 4 句，与 worklist `sents [1298,1299]` 一致；`[[hit:hit]]` 实测在 1298、`[[strike:strike]]` 在 1299（相邻两句）✓。hit / strike 各"标 1 / 未标 0"复算一致；`strikes` 全书 0 处，故未标档确为 0。卡侧文本也复核：hit 出现在 hammer / blast 两卡 `ex` ✓（卡库命中 3 = own + 2），strike 另在 attack 卡同义词栏被列 1 次 ✓。
C 可 grep：**1 处 BLOCK（"本书没有"报错了方向）** —— 正面证据全命中：课文 1295 / 1297 / 1298 / 1299 / 1300、两卡 `ex`/`exZh`、hit 词伙 `hit songs`（实测课文 0 处 ✓，草稿的定性对）、strike 词伙 `loud strike`（与 1299 同源 ✓）、hammer / blast 卡 `ex`、strike 卡 `同义词：attack`（实测栏里就这一个词 ✓）。标 0 处的 `strike a bargain` / `hit the road` / `be struck by` / `hits` / `hitting` 逐条 grep 确无 ✓；"struck、striking、hits、hitting 在 `sections.json` 里各 0 处"这条**限定范围写得对、复算也全 0** ✓。
  **不符的一格**：diff「它后面接什么 · strike」末句"strike 在本书**没有一次**当动词用"，与「数据边界」"strike 本书 0 处动词用法同理（strike 卡 `m` 明明给了 v. 击打，只是本书没用）"。实测**本书卡面有 2 处 strike 的动词用法（过去式）**：lightning 卡 `ex` = `The lightning struck the tree last night.`、midnight 卡 `ex` = `The clock struck midnight.`。本稿在别处（如组 114"本书 jail 侧 3 条文本（课文 1 + 卡 ex 1 + 卡词伙 1）"）把"本书"定义为**含卡 `ex`**，按它自己的口径这两处就是动词用法 → 该断言属"虚报本书没有、其实数据里就有"这一族（用户点名的那条）。→ **BLOCK（措辞级，改一句即可，不必退回）**：两处改成"课文里 strike 只 1 处、且是名词；动词义本书只以过去式 `struck` 出现在 lightning / midnight 两卡的 `ex` 上"。顺带：`striking` 在 dramatic / surprise 两张卡的同义词栏里也各出现 1 次，"一律不列"的理由要落在"课文 0 处"而不是"本书没有"。
  本组的"接具体物件 vs 当那一场本身"这条真区别不受影响（hit 侧 4 条宾语确为 wall / ball / nail / window，无一抽象 ✓）。
D 宽度：默认行标称 36.0 / 实测 **36.0**；总结句标称 22.5 / 实测 **22.5** → **OK**。
E 义项照抄：**OK（豁免适用）** —— 表头"本段真译成「袭击」的只有 strike 那一侧，hit 那处译的是「击中」"是引用 + 当场否定；审核者回 `sentZh` 验实（1298「石头从未击中墙壁」／1299「没有响亮的袭击声」）✓。`core` = 砸中一样砸得着的东西 / 被听见的那一响、那一场，默认行与总结句均无卡 `m` 词（脚本逐槽验 0 命中）。
F 同源诚实：**OK** —— `loud strike` 与 1299 同源点名不另计 ✓；hit 侧 4 条 / strike 侧 2 条与独立计数一致；未据同源宣称两处方向一致。
判定：**需作者改**，最小清单 = 2 行（diff 的 strike 行末句 + 数据边界"strike 本书 0 处动词用法"那半句）。其余可落地。

---

## 组 120 · dilemma / plight（4_06 组 2）

A 原文表：**OK** —— 章4 段4 全 6 句（1301–1306）逐字符相等。
B 句号与共现：**OK** —— 段4 起 1301（1277+12+6+6 复算 = 1301 ✓），1301 为段内第 0 句 ✓；1301 的 heads 实测含 dilemma + plight（同句前后两半，`left` 串联的论断成立）。两词"标 1 / 未标 0"复算一致；"两词的 `ex`/词伙在全书别的卡里一次都没出现"复算 = 卡库各命中 1（仅 own）✓。
C 可 grep：**OK** —— 正面证据全命中：课文 1301（含 5 个子串）、两卡 `ex`/`exZh`（dilemma 卡 ex 带冒号，脚本按 KV 跳过，审核者手工回原卡逐字对 ✓）、`hard dilemma` / `lasting plight` 两条词伙（均与 1301 同源 ✓）、课文 1302–1306。框架计数复算：`in a dilemma` / `dilemma of` 全书 0 处 ✓（草稿"介词短语接 dilemma 的写法 0 处"属实）；plight 侧 2 条文本确实都走 `in … plight`（1301 `in lasting plight` + 卡 ex `in a difficult plight`）✓。标 0 处的 4 条（`in a dilemma`、`dilemma of whether to`、`the plight of the refugees`、`be in a plight for`）逐条确无 ✓。
D 宽度：默认行标称 38.5 / 实测 **38.5**；总结句标称 21.5 / 实测 **21.5** → **OK**。
E 义项照抄：**OK** —— 「困境」在表头是"引用 + 指出本书课文自己拆成「困境」/「困苦」两词翻"，两卡 `exZh` 确实都用「困境」（撞在卡上）✓；`core` = 那道二选一 / 人待在里面那段日子，默认行、总结句 0 命中。「两难」档只出现在 `sense` 与 diff 的"卡上还给了哪一档"格，且同行给了正面证据 `stay home or go to work` ✓。
F 同源诚实：**OK** —— 两条词伙同源点名；两侧各 2 条与独立计数一致；"dilemma 有选项"那条的支撑只有卡 ex 1 句，草稿自己在数据边界里点破了（"课文 1301 里并没有给出选项内容"），诚实到位。
判定：**可落地**（无必须改项）。§五.12 合规：段主题栏逐字引且明说"主题栏里没提'困境'这件事" ✓。

---

## 组 121 · invade / violate（4_06 组 3）

A 原文表：**OK** —— 章4 段5 全 7 句（1307–1313）逐字符相等，是两片里最长的一张表，无一处并句 / 错位。
B 句号与共现：**OK** —— 段5 起 1307（1277+6+6+6+6+6+7 链复算 ✓），1309 第 2 句 / 1310 第 3 句，与 worklist `sents [1307,1309]` 一致；`[[invade:invade]]` 实测在 1307、`[[violate:violated]]` 在 1309 ✓（草稿标的表面形式是 violated，与数据一致）。violate / invade 各"标 1 / 未标 0"复算一致（词形匹配下 violate 基形在课文 0 处，草稿已自注原因）。
C 可 grep：**OK** —— 正面证据全命中：课文 1307 / 1308 / 1309 / 1310 / 1311 / 1312、两卡 `ex`/`exZh`、violate 词伙 `violate rules`、`violate laws`（实测各 1 次且只在卡上，"课文 0 处、那处是被动写法"的自注 ✓）、violate 卡 `同义词：infringe, breach, break`、infringe 卡 `ex` 与 `infringe on privacy rights` ✓。三条关键"族谱"断言全部验实：**invade 卡 `note` 是空串** ✓（既无词伙也无同义词栏，本片唯一一条）、**violate 同义词栏里没有 invade** ✓、**attack 卡同义词栏 = `assault, strike, invade`** ✓（故"本书把 invade 归进攻击族"成立）。对象分布复核：invade 侧 2 条宾语 = house / country（都带限定词 ✓）；violate 侧 4 条对象 = rule / rules / rule / laws ✓；"本书没有一处 violate 接地方、没有一处 invade 接规则" ✓。标 0 处的 6 条（`invade the country with an army`、`be invaded by`、`violate human rights`、`violate a truce`、`violation`、`invader`）逐条确无 ✓。
D 宽度：默认行标称 38.5 / 实测 **38.5**；总结句标称 25.5 / 实测 **25.5** → **OK**。
E 义项照抄：**OK（豁免适用）** —— 表头引用「侵犯」并当场否定 violate 侧（"本书译文只在 invade 那侧用了「侵犯」，violate 那处译的是「违反」"），回 `sentZh` 验实 ✓。`core` = 踏进一块属于谁的地 / 坏掉一条写着的规，默认行与总结句 0 命中卡 `m` 词。
F 同源诚实：**OK** —— invade 侧 2 / violate 侧 4 条与独立计数一致；空 `note` 按 §三.8 明说不硬凑 ✓；未宣称"两处方向一致"。
判定：**可落地**（无必须改项）。提请拍板那一条（卡上零词伙是否够出卡）：审核者判断 = 够。invade 侧 2 条文本（课文 1307 + 卡 ex）都把"对面是一块地"演出来了，且本组的区别格不依赖词伙；卡 `note` 空属词卡数据边界，按口径 7"薄不是退回理由"处理，出卡但保留"本书 invade 侧只有 2 条"的报备。

---

## 组 122 · assault / attack（4_06 组 4）

A 原文表：**OK** —— 表内 1308 / 1309 / 1310 / 1311 四句逐字符相等。
B 句号与共现：**OK** —— 1309 第 2 句 / 1310 第 3 句，与 worklist `sents [1309,1310]` 一致；1309 heads 含 attack + violate、1310 heads 含 assault ✓。§五.13 两档分列是本片唯一有实义的例外，审核者复算完全一致：**attack 标 `[[attack:attack]]` 1 处（1309）+ 未打在 attack 名下 1 处（1665）**；1665 实测 = 章5 段28 第 4 句、heads = allergy / `heart attack` / risk、`sentZh`「她没有食物过敏，扫描显示现在没有心脏病发作风险。」✓（草稿"那是多词卡的词头、中文译「心脏病」"属实）。assault 标 1 / 未标 0 ✓。
C 可 grep：**OK** —— 正面证据全命中：课文 1308–1311、两卡 `ex`/`exZh`、词伙 `sudden assault` / `attack old peace`（各与 1310 / 1309 同源，实测课文 1 + 卡 1 ✓）、`同义词：attack`（assault 卡）/`同义词：assault, strike, invade`（attack 卡）、heart attack 卡 `ex` `He had a heart attack last week.` ✓。`on` 框架复核：`the assault on the old man` 在卡 ex ✓；attack 侧本书无 on 框架 ✓。`assaulted` / `assaults` 全书 0 处 ✓（支撑"本书与卡上都没给过它当动词的例子"，且这句用的是"本书"含卡面，与组 119 相反 —— 这条**是对的**）。标 0 处的 6 条（`assault on the town`、`sexual assault`、`a verbal assault`、`attack on the capital`、`counter-attack`、`attack violently`）逐条确无 ✓。
D 宽度：默认行标称 38.5 / 实测 **38.5**；总结句标称 19.5 / 实测 **19.5** → **OK**。
E 义项照抄：**OK** —— 本片唯一 `all_synonyms: true` 组；表头引用"攻击／袭击"两档并说明"在本书译文里一边一个"，回 `sentZh` 验实（1309「攻击」／1310「袭击」）✓，不是虚假宣称。`core` = 那一场本身，来得突然 / 有人冲上来动手；默认行与总结句 0 命中卡 `m` 词（「攻击」「袭击」只出现在 sense 槽与"卡 m 给了哪两档"的引用位）。
F 同源诚实：**OK** —— 两条词伙同源点名，两侧各 2 条与独立计数一致；"两句 `exZh` 都译「攻击」"实测为真（assault「对那位老人的攻击」／attack「这次攻击发生在夜晚」），草稿把它当"可换"物证、同时明写"本段两词不并列、是同一幕的两个镜头"，没有把同源升级成两处独立书证 ✓。
判定：**可落地**（无必须改项）。硬约束 3 的执行也对：区别落在词性 + `on` 框架 + 卡 ex 镜头三格，没有提议"该删哪个"。

---

## 组 123 · forbid / prohibit（4_06 组 5）

A 原文表：**OK** —— 章4 段6 全 6 句（1314–1319）逐字符相等。
B 句号与共现：**OK** —— 段6 起 1317（1277 + 6+6+6+6+7 = 1317 ✓），1317 为段内第 3 句，与 worklist `sents [1317]` 一致；raw 实测标记 = `[[forbid:forbid]]` 与 `[[prohibit:prohibited]]`，与草稿写的一致 ✓。两词"标 1 / 未标 0"复算一致；"两词都没出现在别的卡的 `ex`/`note` 里"复算 = 卡库各命中 1（仅 own）✓；"本书'阻止'那一族（deter / prevent / counter）的同义词栏没把两者收进去"复算 ✓（deter 卡 = `discourage, prevent, dissuade`、prevent 卡 = `counter, deter`，实测两条栏原文与草稿一字不差）。
C 可 grep：**OK** —— 正面证据全命中：课文 1314–1319（含 `from joining fights`）、两卡 `ex`/`exZh`（两句确实只差 `forbids … to use` / `prohibits … from using`，实测 `exZh` 都是「学校禁止学生在课堂上使用手机。」，一字未改 ✓）、词伙 `forbid guns`（与 1317 前半同源 ✓）、`prohibit extreme sport`、`prohibit animal exploitation`（实测课文 0 处 ✓）。形态计数复算：`prohibited` 全书唯一 1 处 = 1317 ✓；`forbids` / `prohibits` 课文 0 处（只在卡 ex）✓；`forbade` / `forbidden` / `prohibition` / `forbidding` / `prohibiting` 课文 0 处 ✓；`a ban on` 无（ban 无卡）、`bar` 有卡但 `bar sb from` 本书 0 处 ✓。
D 宽度：默认行标称 39.0 / 实测 **39.0**；总结句标称 22.0 / 实测 **22.0** → **OK**。
E 义项照抄：**OK** —— 「禁止」在表头是肯定式引用（"worklist 说的共同义项'禁止'两处都站得住"），回 `sentZh` 验实：1317 译文前后半都是「禁止」✓ 属实，故不属 §五.11 拦的虚假宣称。`core` = 不许某人去做那一件 / 把一类事划到不许里；默认行、总结句 0 命中卡 `m` 词。
F 同源诚实：**OK** —— `forbid guns` 与 1317 同源点名；两条 prohibit 词伙明写"课文 0 处、别当课文证据"✓；两条 `ex` 场景相同但句子不同、按口径 8 不并条 ✓；"硬区别只剩 1 句卡例"在数据边界里自己点破，未粉饰。
判定：**可落地**。两处**提醒级**措辞（不阻断）：① "同一句话只换了动词和那个介词"（小结与 diff 各一处）—— 严格说是换了"动词 + 介词 + 那个动词的 -ing 形"（`to use` ↔ `from using`），草稿自己把两个串都摆出来了，读者看得见，改不改由他；② 数据边界把本组称作"与批次 3 组 2 的 imitate / mimic 同型"，实测 imitate / mimic（worklist idx 53）的 `all_synonyms` 是 **true**，本组是 **false** —— 只有"`ex` 同形"这一维同型，标记维不同，落地前建议在本组文件头把"同型"限定到 `ex` 形状。

---

# 两件独立核的（审核者自己跑数据得出，未采信草稿自述）

## 第 1 件 · 「卡面同形 vs worklist 标记」冲突时按哪个 —— 结论：按标记，且这根本不构成冲突

**标记是哪来的（读了生成脚本，不是推测）**：`tools/confusable_groups.py:301`

```python
both_syn = all(y in syn[x] for x in g for y in g if x != y) if len(g) > 1 else False
```

其中 `syn[x]` 来自 `segs(V[x]['note'])[0]`，即**该卡 `note` 的「同义词：」那一段**。所以
`all_synonyms` 是一个纯机械标记，定义域**只有一件事**：两张卡的同义词栏有没有互列对方。它不读 `ex`、不读 `exZh`、不读 `m`，
与"两句例句是否同形"**在数据结构上不可能冲突** —— 因为它们量的不是同一个东西。

**审核者独立跑的分布**（把 `ex` 归一后做词形对齐，只换一个成员词或两句完全相同记为"同形"）：

| 类别 | 组数 | worklist_idx |
|---|---|---|
| `ex` 同形 + `all_synonyms=false`（作者报的"错配"型） | **7 / 220** | 51 pastime·recreation、62 fridge·refrigerator、83 railroad·railway、**114 jail·prison**、**131 happen·occur**、171 alleviate·relieve、181 miserable·wretched |
| `ex` 同形 + `all_synonyms=true`（一致型，无需处置） | 2 / 220 | 53 imitate·mimic、59 famous·well-known |

- **批次 4 的 42 组（idx 94–135）里只有 2 组**：idx **114**（4_05 组 1，jail / prison）与 idx **131**（4_08 组 3，happen / occur，ex 是 `The accident happened yesterday.` / `The accident occurred yesterday.`）。用户点名的这两组确实是全集里仅有的两组同类，**我这一批（114–123）里只有 114 一组**。
- 我这批的 idx **123 forbid / prohibit 不属此类**：两句 `ex` 差 3 个词（`forbids … to use` ↔ `prohibits … from using`），是"同场景 + `exZh` 一字不差"的**弱一档**，草稿自己的描述是准确的（只把"介词"改准一点即可，见组 123 提醒）。

**能写进 BRIEF 的固定口径（建议作为 §五.14）**：

> **14. 卡面 `ex` 同形与 `all_synonyms` 标记不是同一维度，不许互相"纠错"。**
> `all_synonyms` 的定义写死在 `tools/confusable_groups.py:301`：只看两卡 `note` 的「同义词：」栏是否互列，与 `ex` 无关。
> 因此：① 出卡一律**照 worklist 的标记走**，不许因为两卡 `ex` 同形就按 `all_synonyms: true` 的写法出卡（硬约束 3 的触发条件只看标记）；
> ② `ex` 同形 / `exZh` 同译是一条**合法的卡面物证**，写在「数据边界」里作为"本书此处可换"的证据即可，**不必再提请拍板**（全集 9 / 220、批次 4 只有 idx 114、131 两组，按本条一次性了结）；
> ③ 报这条物证时必须同时如实报"两卡同义词栏没互列，故标记 false 有据"——这句两片 4_05 组 1、4_06 组 5 都写了，写法可沿用；
> ④ 反过来也不许因为标记 false 就否认 `ex` 同形这个事实；
> ⑤ 同形的两句 `ex` 是**两句不同文本**，按口径 8 各计自己一侧 1 条，不算同源、也不算两条独立书证。

**对作者提请拍板那几组的判断**：
- **4_05 组 1（114 jail / prison）**：不必拍板，按现表落地。标记 false 有据（jail 卡 note 只有 `词伙：send them to jail`、prison 卡只有三条词伙，两栏都没互列 —— 审核者回原卡逐字验实 ✓）。唯一要做的是把「数据边界」与文件头小结里那句"要不要按 `all_synonyms: true` 的写法出卡"的疑问**改成陈述句**（引上面的口径 14），少一个待办。
- **4_05 组 2（115 confine / prison）**：作者问"共享义项在共现句完全不成立要不要退" —— **不退**。按口径 6 的"话说轻"版本落地即可，且它给的替代区别（名词那半句 vs 动词那半句 + `to` 框架）是 2 条可 grep 的硬证据（`confined to his room` / `confine the talk to paper`）。本组只欠那个 `restrain`→`constraint` 的一词改动。
- **4_05 组 4（117 crime / sin）**：作者问"两侧文本量差一个数量级 + sin 侧译得更轻要不要退" —— **不退**。真区别（法这一头 vs 良心这一头）由两卡 `ex` 各 1 句撑起（`The police caught the man for a serious crime.` 有 police、`He felt guilt for his sin of lying.` 只有 felt guilt），2 vs 2 干净；义项偏轻一档已按口径 6 处理。本组只欠"另外两处带 police 的文本"那条数量断言。
- **4_06 组 1（119 hit / strike）**：作者问"两词连词性都不同、义项只对一侧成立要不要退" —— **词性不同不是退回理由**（辨析卡本来就靠词性/框架分工，组 122 也是 n. vs v. 且他批过），但本组必须先改掉"strike 本书 0 处动词用法"这条**误报缺失**（数据里有 2 处 `struck`）。改完即可落地。
- **4_06 组 3（121 invade / violate）**：作者问"invade 卡 `note` 空、要不要按'必须有词伙段才出卡'退" —— **不退**，除非他要新加一条他从未定过的硬门槛（卡上有没有词伙段不是 §五 任何一条门槛，口径 7 明确"薄不是退回理由"，实测本书 3245 张卡里 `note` 为空者一大片：`arrest` / `restrain` / `trespass` / `intrude` / `enormity` / `heart attack` 审核者抽查均为空串）。
- **4_06 组 5（123 forbid / prohibit）**：作者问"硬区别只在卡例、课文 0 处，要不要把括号换成中文描述" —— **不必换**。`§一` 明列 `vocab.json` 的 `ex` 是合法出处；本组默认行 `forbid = 法律禁枪（forbid guns）` 用的是课文串、`prohibit = 学校禁玩手机（from using phones）` 用的是卡例串，一侧一个，恰好是"卡例可当搭配"的既有写法（批次 1A 起 57 张卡都是这个形状）。

## 第 2 件 · 门禁 1 的形状缺陷：**是工具问题，作者没误判**（已复现 + 已验证最小修法）

**复现**（`tools/check_compare_draft.py` 未改，跑在 /tmp 临时草稿上）：把 1277 整句原文（去标记后）放进反引号 →

```
FAIL repro1277.md  ← 2 条查不到
       缺: 'Last Sunday Grandpa said old wars brought deep violence and long conflict to villages'   ← 1277，数据里逐字存在
       缺: 'Leo kept a journal entry about the old well'                                            ← 故意造的假串
```

同段 1278 整句作对照 → **通过**。所以是"这一句"的形状问题，不是"整段/这一类引用"的问题。

**根因（不是"数组开头的 `[[` 粘连"这么轻）**：`haystack()` 第 32–33 行的标记正则 `\[\[([^\]:]+):([^\]]+)\]\]`
里，`[^\]:]+` **不排除引号 `"` 和换行**，于是它会把 JSON 里 `paragraphs` 数组开头那个字面 `[[` 当成标记的起始，
一路吞到该章第一句里的第一个真标记：

```
匹配到: '[["Ms. Lin said the [[atmosphere:atmosphere]]'
group(1)= '"Ms. Lin said the [[atmosphere'     ← 跨了字符串边界（含引号/换行）
```

替换成 `\2` 后，**章4 首句在 surface 变体里被删掉了前半截**，整句自然查不到。

**影响面（实测全集，不是只影响 1277）**：每章 `paragraphs` 数组的第一句共 **6 句**（全局 **0 / 339 / 651 / 883 / 1277 / 1492**）
的整句引用必 FAIL；全书 1833 句里"整句在 surface 变体中查不到"的正好这 6 句。

**最小修法（一行，只动 `haystack()` 里那两个 `re.sub`，正则字符类各加排除 `"` 与换行）**：

```python
# tools/check_compare_draft.py 第 32–33 行
-                re.sub(r'\[\[([^\]:]+):([^\]]+)\]\]', r'\2', raw),
-                re.sub(r'\[\[([^\]:]+):([^\]]+)\]\]', r'\1 \2', raw)]
+                re.sub(r'\[\[([^]"\n:]+):([^]"\n]+)\]\]', r'\2', raw),
+                re.sub(r'\[\[([^]"\n:]+):([^]"\n]+)\]\]', r'\1 \2', raw)]
```

（同一个模式在 `tools/land_compare.py` / `audit_ledger.py` 里若也有副本，改时要一起对齐 —— 审核者未跑它们，无法代验。）

**改后回归证据（在 /tmp 的补丁副本上跑的，仓库脚本一字未动）**：
- 标记数不变：`sections.json` loose 4072 / strict 4072，`vocab.json` 2 / 2（**没丢任何真标记**）；
- `vocab.json` 两个变体的输出**逐字节相同**（卡面证据完全不受影响）；
- 整句可查率 1827 / 1833 → **1833 / 1833**；
- 两份草稿复检：`OK 4_05.md`、`OK 4_06.md`（**没有新增 FAIL**）；1277 那句转为可查，假的对照串照旧被抓 ✓。
- 副作用（可接受）：修好后 4_05 组 5 出处清单里"1277 不整句引用"那段报备可以删掉，作者也能整句引 0 / 339 / 651 / 883 / 1492 那 5 句。

---

# 汇总

| 组 | idx | 判定 | 必须改（最小清单） |
|---|---|---|---|
| 4_05 组 1 | 114 | 可落地 | 无（把"要不要按 true 出卡"的疑问按口径 14 改成陈述句，非阻断） |
| 4_05 组 2 | 115 | 需作者改（MISMATCH） | diff「卡上把它记在哪一族」里 `restrain` → `constraint`（1 词） |
| 4_05 组 3 | 116 | 可落地 | 无 |
| 4_05 组 4 | 117 | 需作者改（MISMATCH） | 出处清单"本书另外两处带 police 的文本"→ 实测 11 张卡 `ex` 含 police，改数量或删数量词 |
| 4_05 组 5 | 118 | 可落地 | 无（1277 报备待工具修好后可删） |
| 4_06 组 1 | 119 | 需作者改（**BLOCK**） | "strike 在本书没有一次当动词用"/"本书 0 处动词用法"→ 数据里有 `struck` 2 处（lightning / midnight 卡 ex），改成"课文 0 处 + 卡面 2 处 struck" |
| 4_06 组 2 | 120 | 可落地 | 无 |
| 4_06 组 3 | 121 | 可落地 | 无 |
| 4_06 组 4 | 122 | 可落地 | 无 |
| 4_06 组 5 | 123 | 可落地 | 无（2 处提醒级措辞，见该组判定行） |

**全批公共项（一次改完全片通用）**：
1. **A 项**：50 行「该段原文」（4_05 21 行 + 4_06 29 行）英中两列**逐字符 0 不符**（含撇号形态：4_05 用 6 个直撇号、与数据同形；全文无 U+2019）。
2. **B 项**：18 条"章/段/句"坐标式引用（"课文第 N 句（段 [c,p] 第 k 句）"）**全部与自算偏移一致**，0 条错位；裸句号引用除"全书 1833 句"这个总数（实测 1833 ✓）外全部存在。
3. **D 项**：20 条宽度标称（10 默认行 + 10 总结句）**与 `width_rule.width` 实测一字不差**，最贴线的是 4_05 组 5 默认行 = 40.0（正好等于上限，未超）。
4. **§五.13**：20 个成员词全部"标记 / 未标记"分两档报，复算 19 个为"标 1 / 未标 0"，唯一例外 attack（标 1 + 未标 1 @1665）与草稿一致；`violate` / `prohibit` 基形课文 0 处是因为表面形式是 `violated` / `prohibited`，草稿已自注 ✓。
5. **§五.12**：本片 10 组的共现段全在章3 段60/61 与章4 段0/3/4/5/6，**都在坏数据（章3 段22–43）之外**；审核者复核坏数组范围 = 22/22 段命中 `paraZh[i+22] == paraZh[i] + 尾缀`，其余章 0 重复 ✓。两份草稿引的 7 条 `paraZh` 逐字与数据相等，且章3 段60/61 之外都限定在"句子撑得住的部分"，组 5（123）还主动写明"本组这句 1317 主题栏没提" ✓ —— 无一处照抄主题栏当出处。
6. **形状小瑕（不阻断）**：§三.2 说原文表"成员词加粗"，两片都把该段**所有**有卡的词头加了粗（如 1295 的 helmet / shield），只多不少，不影响落地，留作者决定要不要收。
