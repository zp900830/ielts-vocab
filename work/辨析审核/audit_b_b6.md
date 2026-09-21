# 门禁 2 审核 · 批次 6 / 切片 39+40（6_03 + 6_04，worklist_idx 188–197）

审核者不是作者。只读 `shadow/data/sections.json`、`shadow/data/vocab.json`、切片包 `slice39/40.json`、
`work/compare_groups_worklist.json`、两份草稿；**只写本文件**。
未改草稿/数据/代码/测试，未跑 `tools/land_compare.py`（任何模式），无任何 git 写操作。

**组数 10 / BLOCK 0 / MISMATCH 5 / 通过 5**

> mtime 自证：`work/辨析审核/land_preview.json` = **Sep 20 23:24**（27888 字节），早于本次审核读取时间
> 2026-09-21 09:43；我没有运行落地器，所以它仍是上一个 agent 留下的那份。

## 自算底账（草稿自报的一律自己重跑，下表全是我算的数）

| 项 | 我实测的数 | 与草稿 |
|---|---|---|
| 全书句数 / 六章句数 | 1833；339 / 312 / 232 / 394 / 215 / 341；章偏移 `[0, 339, 651, 883, 1277, 1492]`（独立重建索引） | 与 §二 口径一致 |
| **A** 表行逐字比 | 两份草稿 **45 行「该段原文」× 2 栏 = 90 格**（去 `[[词头:表面]]`、去 `**`、空白折叠后逐字符比英文与 `sentZh`）→ **0 格不符**；**撇号单列一轮**：含 `'` 的引用 3 串（`…the sun's harmful rays`＝ozone 卡 ex、`Grandpa's simple blueprint`＝课文 1335、`Father's long talk`＝课文 1090）逐字符命中 | 草稿未自报此行，我补算 |
| **B** 句号与共现 | 10 组 × 2 成员句 = 20 句全部回算命中（含 6_03 组5 的 246/247、6_04 组2 的 354/355 同句并现），与切片包 `sents` 0 冲突；另回算 **23 处旁证句号**（311、265、844、1008、1096、1017、1295、1573、1594、326、471、474–477、876、1262、1335、1316/1334/1591/1694、1406、1089/1090、1645、70、1813/1815）—— 除 1 处小标题索引（见组 197）全部对得上章/段/段内序号；26 个成员词的"标记 N 处＋未标 M 处"两档全部复算：只有 protect（311）与 amuse（1406）各有 1 处未标记，与草稿两档分写一致 | 一致（组 197 一处例外） |
| **C** 可 grep | 两份草稿 **479 条含英文的 code span**（6_03 228 / 6_04 251）逐条回两份数据；**当作正面证据用的串 0 条查无**。查无的 80 条我逐条分类：24 条是文件路径/字段名/命令，14 条是带省略号或斜杠的节引（8 条节引逐条回原文命中：`Wise talk could counter fright…`=1316、`Good strategy needs wiser tactics…`=1334、`Seniors reckon… and deem…`=478、`paused to observe… and politely inquire about`=493、`first dance steps … lightly`=章5 段50、`contemporary / medieval`=1815 等），42 条是"本书没有／0 处"式反例——**42 条我逐条 grep 两份数据，全部真 0 命中**；**26 条中文存在性断言**另立一轮（刺激 1／调查 3／娱乐 0／聪明 2／认为 1／估计 0／视作 0／中间 0／居中 0／永久 0／永恒 1＝1594／经久 0／与此同时 1＝1827／保护 4＝246·247·265·311／保存 2／节约 1＝155／勘测·款待·休闲·衣冠楚楚·时髦 0／开心 7／消遣 2／固定 3／持久 1／当口 0／空隙 1） | 结论全部支持，例外见各组 MISMATCH |
| **D** 宽度 | 用 `tools/width_rule.width` + 其自带 `extract`：默认行 33.5 / 35.0 / 33.0 / 35.0 / 38.0 / 37.0 / 37.0 / 35.5 / 37.5 / 37.0，总结句 22.0 / 24.5 / 21.0 / 15.0 / 27.0 / 26.5 / 25.5 / 25.5 / 29.0 / 25.5 —— **20/20 与标称一字不差，偏差 0.0**，无一条超上限；15 个 `core` 实测 5.0–9.0（≤12 全过）；顶格提醒：6_03 组5 默认行 38.0、6_04 组4 总结句 29.0，落地别加字 | 一致 |
| **E** 义项照抄 | 26 张成员卡 `m` 切成 **36 个义项词元**，逐槽扫：`core` 0 命中、默认行 0 命中、总结句 0 命中；表头命中 9 个词元（8 组），全部是"引用 worklist 义项＋当场否定／限定"形状，且**我回数据验实每一处否定为真**（§五.11 豁免）。另有两处引的是 worklist 的短形而非卡 `m` 原词，故不被词元扫到，我单独验实：组 188 表头的「在前」（卡 `m` 写「在前的」，原词只在本该在的 `sense` 槽）、组 194 表头的「聪明」（354 的 `sentZh` 确实给 intelligent 落了「非常聪明」，属"限定到一侧"不是"宣称三词同义"）→ **10 组 E 行全部无 BLOCK** | 一致 |
| **F** 结构 / 同源诚实 | **32 张表逐行数 `\|`**：原文表 45 行全 3 列、items 表 26 行全 **7 列**（含 6 个三成员组共 15 行，无一格被"词性＋义项"挤掉）、diff 表 91 行全 5 列、复核索引 10 行全 8 列 → **0 处列数错位、0 个空 `eg` 槽**；**同源合并标注 20 处**逐条回卡面与课文（prior skill／preceding week／intermediate shelf／everlasting love／permanent desk／counterbalance harsh light／useful spur／fresh impetus／clever ways／looked smart／short fun survey／fun survey／survey respondent／entertain kids／quiet recreation／bring quiet recreation／amuse friends／simply assume／fine precedent／former patient）→ 全部为真、全部只算 1 条，无一处据此宣称"两处书证方向一致" | 一致 |
| 载体（口径 9 之外的机械事实） | 扫 `vocab.json` 181 张带 `cmp` 的卡：段 2 = `motivate-stimulate`、段 22 = `postulate-presume`＋`detect-perceive`、段 25 = `inquire-query`、段 39 = `pastime-recreation`＋`feast-festival`、章5 段 53/54 与章0 段 42 **零张现存表**；本片 26 个成员词头里只有 `inquire` 已占一张表 → **6_04 的载体报备逐字准确**（`cmp.group`＝`inquire-query`、`at`＝`[1, 25]`、items 两项＝inquire 与 query） | 一致 |
| 门禁 1 | 自己重跑 `python3 tools/check_compare_draft.py work/辨析草稿/6_03.md work/辨析草稿/6_04.md` → `OK / OK / 门禁 1: PASSED`（与自报一致；但它只看反引号，所以 C 项我另扫了非 code span 的英文与中文造景） | 一致 |

---

## 组 188 · preceding / prior（6_03 组1，章5 段53，1822/1823）

- A：**OK** 4 行（1821–1824）英文＋中文 90 格里这 8 格逐字符全等；只粗 prior／preceding 两个成员，1821/1824 背景行没粗 ✓。
- B：**OK** 1822＝段53 第 3 句、1823＝第 4 句；`[[prior]]`/`[[preceding]]` 实测在句内；preceding 标 1/未标 0、prior 标 1/未标 0 ✓；`prior to` 全书只在 prior 卡 ex、课文 0 处 ✓；`priority` 课文 0 处、只在 preference 卡同义词栏 ✓；`[5,53]` 在 220 组里只出现 1 次、两词也只在这一组露面 ✓（worklist 复算）。
- C：**OK** 正证据 12 条全查到；反例 5 条（the day preceding／preceding days／prior experience／prior notice／predecessor）实测各 0 ✓；「从前」「过去」「前一章」「在会议之前」四个中文落点与 `sentZh`/`exZh` 逐字一致 ✓。
- D：**OK** 33.5 / 22.0 与实测 0 偏差；core 8.0／9.0。
- E：**OK** 「在前的」只在 `sense` 槽；表头引用 worklist 义项「在前」属引用位、且后文把它降级为"两处译文谁也没用同一个中文词"（实测为真）；默认行/总结句/core 0 命中。
- F：**OK** 两条词伙＝1822/1823 原话，主动并条；"独立文本各 2 条、薄"写进证据强度与数据边界；两卡 `note` 无语域标注 → 没写"正式度"判决 ✓。三格硬区别（本事 vs 日子、prior 能带 to、卡 ex 摆位）都有 1822/1823＋两卡 ex 四条文本撑，不是词典排比。
- **判定：通过（可落地）**。

## 组 189 · intermediate / midst（6_03 组2，章5 段54，1825/1826）

- A：**OK** 3 行逐字符全等；1827 背景行里 Meanwhile 没粗 ✓。
- B：**OK** 1825＝段54 第 0 句、1826＝第 1 句；两词标 1/未标 0 ✓；in the middle of 另有 2 处（1008/1096）✓、middle 无卡未标记不在 220 组 ✓；「中间」1833 句译文 0 处 ✓、「居中」0 处 ✓。
- C：**基本 OK，一处计数不实**。正证据 11 条全查到（含 fold 卡 exZh「这张纸中间有一道深深的折痕」逐字 ✓、shelf 卡 ex＋词伙 wall shelf ✓、两卡 ex 全句 ✓）；反例 4 条（in the midst of battle／intermediate level／a midst of／midst of the night）实测 0 ✓。
  **不符**：diff「卡上另一半给了什么 / midst」格（第 132 行）与出处清单（第 145 行）写「`crowd` 一词在课文另有 4 处（**269 / 927 / 1309 / 1315**）」。实测：单数 `crowd` 带 `[[词头:…]]` 标记的 4 处是 **269 / 530 / 927 / 936**；草稿列的 1309、1315 是**未打标记的复数 `crowds`**，另 `crowded` 3 处（230 / 383 / 767）。四个数凑对了、号错一半、两档并成了一档（§五.13 明确禁止）。
- D：**OK** 35.0 / 24.5，core 8.0／7.0。
- E：**OK** 「中间」在表头是"引用＋当场否定"，我实测该否定为真（译文 0 处，两处中文是「中级」「当中」）→ §五.11 豁免；core/默认行/总结句 0 命中。
- F：**OK** midst 卡 `note` 整栏为空我核 ✓，草稿两处明写"拿不出词伙、落地别替它补搭配"；"midst 永远在 in the … of 里"自限为"样本 2 条、不是禁令" ✓。
- **判定：需作者改（MISMATCH 1 处，只改数字，不动内容骨架）**。
  最小清单：① 第 132 行该格 + ② 第 145 行同句 → 统一改成「`crowd` 带标记 4 处（269 / 530 / 927 / 936）＋未打标记的复数 `crowds` 2 处（1309 / 1315，另有 `crowded` 3 处：230 / 383 / 767），没有一处跟 midst 同现」。三处号码我逐个 grep 过。

## 组 190 · meantime / meanwhile（6_03 组3，章5 段54，1826/1827）

- A：**OK** 3 行逐字符全等；背景行 1828 的 everlasting 没粗 ✓。
- B：**OK** 1826/1827＝段54 第 1/2 句；meantime 标 1/未标 0、meanwhile 标 1/未标 0 ✓；「与此同时」译文全书 1 处＝1827 ✓。
- C：**OK** 正证据 13 条全查到（两句卡 ex＋exZh 逐字、1826/1827/1828 全句子串）；反例 3 条（for the meantime／in the meanwhile／meanwhile 作名词）实测 0 ✓。
- D：**OK** 33.0 / 21.0。
- E：**OK** 「与此同时」只在 `sense` 与表头引用位；core/默认行/总结句 0 命中。
- F：**OK** 两卡 `note` 均空串我核 ✓；两句卡 ex 同幕按 §五.14 三件齐（同形照写＋false 有据＋各算一侧）✓。
- **判定：通过（可落地）**。
- **拍板 1（作者：语义层本书材料分不出差）→ 不退、也不必再拍。** 这正是审核书尾那条已写死的判据 (b) 档：本段两头撞共同义项（都是"同一时段两件事"），但全书有一条 ≥2 处、两词不同形状的线可 grep（1826 句中 `in the meantime` 挂 in the＋主语不换人 vs 1827 句首 `Meanwhile,`＋换人换地），照 §四 口味也是画面不是术语。
- **数据侧问题（只报不改）**：meantime 卡 `m`＝`n. 与此同时`，它自己 `ex`＝`He cooked dinner; meantime, the kids did their homework.` 是副词接法——两栏确实自相矛盾，草稿原样摆出、没替卡圆场，处置正确。改不改卡由他定，**不是本组的退回理由**。

## 组 191 · everlasting / permanent（6_03 组4，章5 段54，1828/1829）

- A：**OK** 3 行逐字符全等。
- B：**OK** 1828/1829＝段54 第 3/4 句；两词标 1/未标 0 ✓。
- C：**OK** 正证据 15 条全查到（含 ongoing 卡词伙 `ongoing training` 在卡、课文 0 处 ✓、1830 全句 ✓）；反例 4 条（permanently／everlasting brightness／permanent job／permanent resident）＋eternal love 实测 0 ✓；中文断言「永久」0 处 ✓、「永恒」1 处＝1594 且那里是 `timeless`（无卡、未标记）✓、「持久」1 处＝1828 ✓、「经久」0 处 ✓。
- D：**OK** 35.0 / 15.0。
- E：**OK** 义项词全在 `sense`；表头「permanent 卡上明明写着『持久的』，课文却没这么译」属引用＋否定，实测为真 → 豁免。
- F：**OK** 两条词伙＝1828 / 1829 原话（同源已并条）；"配感情 vs 配物件"由 1828＋卡 ex / 1829＋卡 ex 四处文本撑；两处"计数结论不是禁令"自限到位。
- **判定：通过（可落地）**。

## 组 192 · conservation / preserve / protect（6_03 组5，章0 段42，246/247，三成员）

- A：**OK** 4 行（246–249）逐字符全等；只粗 protect / preserved / conservation 三个成员 ✓。
- B：**OK** 246＝段42 第 0 句、247＝第 1 句；`[[protect]]` 在 246，`[[preserve:preserved]]`＋`[[conservation]]` 同在 247 的 `and` 两边 ✓；protect 标 1（246）＋未标 1（311，章0 段53 ✓ 两档分写正确）；preserve 标 1/未标 0 ✓；conservation 标 1/未标 0，`conserv` 词形另 1 处＝1017 `conservative` ✓；`[0,42]` 在 220 组只出现 1 次、三词只在这一组露面 ✓。
- C：**OK（一处译文标注不实，见下）** 正证据 30+ 条逐张回卡面/课文命中：conservation 卡 ex、三条词伙（`wildlife conservation` 确在 wildlife＋conservation 两卡、草稿主动并条 ✓）、preserve 卡 ex＋三条词伙、`preserve cultural heritage` 确在 heritage 卡 ✓、protect 卡 ex＋两条词伙 ✓、13 张别卡 ex（security／sustainable／fleet／guard／emission／invoke／mankind／skull／joint／wildlife／defensive／impetus／ozone）我逐张对号，13 这个数字**不多不少正好** ✓、clothe 卡词伙 `protective clothing` ✓、265「野生动物保护队」＝wildlife team ✓、844 `strawberry jam` ✓、155「节约」＝save ✓。中文存在性断言全部为真：「保护」跟着 protect 2 处（246/311）、conservation 1 处（247）、没给 preserve（247 译「保存」）✓。
  **不符 1 处**：第 332 行、第 399 行把 1017 写作 `conservative`**「保守的选择」**（带「」当引文）。1017 的 `sentZh` 实测是「父亲选了**稳妥的那条路**：远一些，可是更安全。」——「保守的选择」是回译，不是本书中文。同段它确实有卡、确实另一词头，结论不受影响，但「」里的字必须能回数据。
- D：**OK** 默认行 38.0（本片最宽的一条，顶格未超）、总结句 27.0；core 9.0／8.0／8.0。
- E：**OK** 「保护」「保存」只在表头引用位，且后接"跟着谁／没跟着谁"的实测分配（§五.11 豁免）；core／默认行／总结句 0 命中三个义项词。
- F：**OK** 三成员两两对照 3 组全部落在本书原文上（246 强光 vs 247 落花 vs 247 全班课；卡 ex 头盔 vs 果酱 vs 公园），**没有一格是词典排比**；同源 2 处（counterbalance harsh light、wildlife conservation 跨卡）主动并条；"protect 主语可以是物""preserve 用于被动"两处都自限成"计数结论、样本 2 条"。
- **建议 2 处（不拦落地）**：① 证据强度与 diff「卡上圈子里有谁 / protect」把 impetus 卡 ex 算进"拿 protect 造句"的 13 张——那一句用的是名词 `environmental protection`，动词是 12 张，宜写"12 张用动词 protect、1 张（impetus）用名词 protection"；②「是本片唯一一组成员全带词伙的组」不确（组1、组4 的成员也全带词伙），改成"唯一一组成员**两栏都齐**（同义词栏＋词伙段）的组"即为真。
- **`preserve wildife` 我的核实结论**：回 `shadow/data/vocab.json` grep，`wildife` **全库只出现 1 次**，就在 `preserve` 卡 `note` 的词伙段第三条（`preserve food, preserve animals, preserve wildife`），少一个 l 属实；课文侧 0 命中。**这是数据侧错字，不是草稿错**——草稿三处（第 362 行 diff、第 383 行出处清单、第 397 行数据边界）全部照原样引、明写"未改数据"，处置完全正确。**不要动数据**，报他定；落地时这条词伙进卡会带同一个错字，这是唯一实际风险。
- **判定：需作者改（MISMATCH 1 处＝1017 的「」引文）**。最小清单：第 332 / 399 行两处「保守的选择」→ 改「`conservative`『保守的』（卡 `m` 第一档），1017 的译文是『稳妥的那条路』」；其余可落地。

## 组 193 · impetus / spur / stimulate（6_04 组1，章1 段2，351/352，三成员）

- A：**OK** 6 行（351–356）逐字符全等；只粗三个成员，motivate／clever／intelligent／smart／genius／elite／dawn 一律没粗 ✓（§五.16 这条 6_04 做得比要求严）。
- B：**OK** 351＝段2 第 0 句、352＝第 1 句；三词各标 1 处＋未标 0 处 ✓（`spurs / spurred / stimulating / stimulates` 词形全书 0 处 ✓）；`stimulus` 1645＝章5 段25 第 2 句 ✓ 且有卡 ✓。
- C：**OK** 正证据 22 条全查到（三卡 ex/exZh/note 三档词伙、incentive 卡同义词栏确列 `stimulate` 词条 ✓、impetus 与 spur 在别的卡 `ex`/`note` 里 0 次 ✓ 我逐卡扫）、1645 全句＋译文逐字 ✓、353–356 背景句 ✓；反例 4 条（an impetus／spurs／impetus to do sth／add impetus to）实测 0 ✓；「刺激」全书课文译文 1 处＝1645 落 stimulus ✓。
- D：**OK** 37.0 / 26.5；core 7.0／6.0／5.0。
- E：**OK** 表头「worklist 说三词的共同义项是『刺激』，可本书这三处一个都没译成'刺激'」＝引用＋我验真的否定；core（把整件事往前推／催你再干一层／把念头点着）、默认行、总结句 0 命中「刺激／鞭策／冲力／推动力／激励」。
- F：**OK** 三侧最薄（spur 与 impetus 唯一课文书证同句 352）如实写；同源 2 条点名合并；"impetus 不挂 a""spur 的 v. 档本书 0 处"都停在分布、没升级成规则 ✓。三格硬区别（挂 a vs 零冠词 vs 动词接念头）352 同句＋两卡 ex 全可 grep，**不是把词典排比搬进来**。
- **建议 2 处**：① items 的 stimulate `scene`「强光弄得眼睛**发疼**（卡 ex）」——卡 ex／exZh 只说「强烈的光线刺激了她的眼睛」，"发疼"是造出来的体感（中文造景，机检不看中文所以看不见）；改成"卡上是那道强光落在她眼睛上"即可；② diff「它推的是哪样东西 / stimulate」写"三张卡里只有它是动词"——spur 卡 `m` 也有 v. 档（本书 0 处），宜写"本段三处里只有它是动词"。
- **判定：通过（可落地）**。
- **拍板 2（作者：共享义项「刺激」三侧都不在本段）→ 不退。** §五.6 的三件草稿全做了（标题改写成"352 两个名词各领哪样东西＋冠词对照"、义项只留 `sense`、数据边界明写"本书没这样用过"且没升级成"stimulate 没有刺激义"——卡 ex 那句就是它的书证，草稿也这样写了）。撤下这条拍板请求即可。

## 组 194 · clever / intelligent / smart（6_04 组2，章1 段2，354/355，三成员）

- A：**OK** 4 行逐字符全等。
- B：**OK** 354＝段2 第 3 句（intelligent＋clever 同句）、355＝第 4 句；clever 标 4（354/876/1262/1335）＋未标 0 ✓，intelligent／smart 各标 1/未标 0 ✓；`cleverly / smarts / smartly / smartness` 0 处 ✓；intelligence 另有卡、326 一处带标记 ✓。
- C：**两处不实**。正证据 19 条全查到（三卡 ex/exZh/note、876/1262/1335 三句原文与 `sentZh` 逐字 ✓、strategy 卡 ex、generation 卡 ex 的 `smartphones` ✓、"明智"4 处＝1316/1334/1591/1694 逐处回原文命中且落 `wise`/`wiser`、`wise` 未打标记也无卡 ✓、bright／gifted 确无卡 ✓、"聪明"课文译文 2 处＝354/1262 ✓）。
  ① diff「卡上『聪明』这一档落在哪 / smart」格（第 141 行）写「「聪明」档的**唯一书证**是卡 ex `He is a smart student…`」，题头（第 116 行）写"只在卡 ex 用过一次"，items 的 `scene`（第 124 行）也写"卡 ex 才轮到'聪明'"。实测：**strategy 卡 `ex` `The team made a smart strategy to win the game.` 的 `exZh` 是「这个团队制定了一项聪明的策略来赢得比赛。」**——同属"卡上、聪明档"的第二处书证，且草稿自己在第 112／138 行就把它当旁证引了。
  ② diff「三张卡的例句是不是同一件事 / intelligent」格（第 143 行）写"两句 `exZh` 只差「聪明的 / 有才智的」四个字"。实测两句 exZh 还差第二处：clever「很快**解决**了这道数学题」／intelligent「很快**解出**了这道数学题」（18 字 vs 19 字）。
- D：**OK** 37.0 / 25.5；core 5.0／6.0／7.0。
- E：**OK** 「聪明」在表头是"引用＋限定到一侧"（intelligent 一侧实测真撞：354 的 `sentZh` 就是「非常聪明」），core/默认行/总结句 0 命中。
- F：**OK** 三卡 ex 同帧（clever 与 intelligent 英文逐字只差词头）按 §五.14 三件齐；两条卡词伙＝354/355 主动并条；clever 侧 5 条、intelligent 侧 2 条与实测一致；"clever 只作定语"自限成 5 处分布。
- **判定：需作者改（MISMATCH 2 处）**。最小清单：
  ① 第 141 行 + 第 124 行 + 第 116 行：把"唯一书证／只在卡 ex 一次"改成「『聪明』档两处书证都在卡上：自己卡 ex（exZh『聪明的学生』）＋ strategy 卡 ex（`a smart strategy`，exZh『一项聪明的策略』）；课文 0 处」；
  ② 第 143 行：改成「两句 `exZh` 只差「聪明的／有才智的」与「解决／解出」两处」。两处替换串我都 grep 过原文。

## 组 195 · deem / reckon / suppose（6_04 组3，章1 段22，473/478，三成员）

- A：**OK** 6 行（473–478）逐字符全等。
- B：**OK** 473＝段22 第 0 句、478＝第 5 句；deem／reckon 同在 478、suppose 在 473 ✓；三词各标 1/未标 0，`deemed / reckons / supposes` 0 处 ✓；1573 实为 `redeem`（另有卡、译「弥补」）✓、471 实为 `assume`（另有卡）✓——两条"别算第 2 处"的报备我逐个回原文验实；suppose 与 idx 217（切片 44 的 hypothesis/postulate/presume/suppose）同段不同组 ✓。
- C：**OK** 正证据 16 条全查到（三卡 ex/exZh、deem／reckon 卡 `note` 确为空串、suppose 卡 note 只有「同义词：assume」、assume 卡 note 逐字符 ✓、474–477 背景句 ✓）；反例 6 条（deem it fit／reckon with／supposed to／be supposed to do／deem that／suppose it useful）实测 0 ✓；中文断言「认为」1 处＝478 ✓、「估计」0 ✓、「视作」0 ✓。
- D：**OK** 35.5 / 25.5；core 9.0／7.0／7.0。
- E：**OK** 五个义项词全关在 `sense` 槽；表头只用 478 的实际译文词；core/默认行/总结句 0 命中。
- F：**OK** 本片最薄（三侧各 2 条、deem＋reckon 唯一课文书证同句 478）如实写；三卡 exZh 一致落「认为」而课文不跟——这条对照是实的（三句 exZh 我逐字对过）。
- **建议 2 处**：① 第 182 行说 `detect-perceive`「走 476 / 477 的'观察线'」——那张表的两个 eg 全取 476（477 是 discern／conscious），写"走 476"更准；② 第 245 行「assume 卡同义词栏**单向**列了 suppose（suppose 栏也列了 assume）」前后自相矛盾，两栏互列，按 §五.14 应写"互列但不属本组"。
- **判定：通过（可落地）**。

## 组 196 · inquire / research / survey（6_04 组4，章1 段25，492/493，三成员）

- A：**OK** 6 行（491–496）逐字符全等。
- B：**OK** 492＝段25 第 1 句（survey＋research 同句）、493＝第 2 句（inquire）；survey 标 2（492/1089）＋未标 0 ✓、research 标 1/未标 0 且 70 是 `researcher`（无词头卡，只在 scholar／scientist 同义词栏）✓、inquire 标 1/未标 0 ✓；`inquired / surveyed / researches` 0 处 ✓。
- C：**三处计数／存在性断言不实**（正证据本身 100% 查得到：三卡 ex/exZh/note、1089 与 1090 全句逐字 ✓、survey 旁证 4 卡（conduct／demographic／gender／compile）✓、research 旁证 4 卡＋state 词伙 ✓、inquire 在别卡 0 次 ✓、`survey respondent` 确在 respondent 卡词伙＝1089 同源 ✓；反例 6 条（do a survey on／carry out research into／inquire into／market research／surveyed／inquired）实测 0 ✓；中文「调查」3 处＝492/1089/1090（1090 落 poll、poll 有卡）✓、「勘测」0 ✓）：
  ① diff「本书给它配了什么架子 / survey」格（第 311 行）：「本书 survey 侧一共 **4 处**带限定词（a / a / many / each）」→ 实测 **7 处**：`a`(492)／`a`(survey 卡 ex)／`a`(conduct 卡 ex `conduct a survey next week`)／`many`(compile 卡 ex)／`each`(1089)／`The`(demographic 卡 ex)／`The`(gender 卡 ex)。
  ② 数据边界（第 342 行）：「research 侧 **8 条**」→ 草稿自己同一句的枚举（492、卡 ex、词伙 3 条、别卡 ex 4 条、state 卡词伙）＝**10 条**；第 343 行「来自本书 8 处的分布」同错。
  ③ 第 343 行：「本书只是没写 `a research`（grep 过，**全书 0 处**）」→ 不实：`He works at a research institute.`（institute 卡 ex，草稿自己引为旁证）字面含 `a research`（1 处）。该说的是"没把 research 当可数名词挂 a"。
- D：**OK** 37.5 / 29.0（总结句顶格，落地别加字）；core 6.0／6.0／6.0。
- E：**OK** 表头「worklist 说三词的共同义项是『调查』，可本书这三处里真站在『调查』这一档上的只有 survey 那侧」＝引用＋我验真的否定；四个义项词只在 `sense`；core/默认行/总结句 0 命中。
- F：**OK** 三成员两两对照（问一个人 / 问一群人 / 钻一桩事）＋限定词对照（a survey vs many surveys vs some research vs inquire about）全部可 grep，**没有一格是排比**；同源 3 条点名合并；薄侧 inquire（2 条、卡 note 空）如实写；**载体报备逐字准确**（inquire 卡 `cmp.group`＝`inquire-query`、`at`＝`[1,25]`、items＝inquire＋query；research／survey 两卡确无 cmp）。
- **判定：需作者改（MISMATCH 3 处，全是数字/断言，不动内容）**。最小清单：① 第 311 行"4 处带限定词（a/a/many/each）"→"7 处（a×3：492 / survey 卡 ex / conduct 卡 ex；many：compile 卡 ex；each：1089；the×2：demographic / gender 卡 ex）"；② 第 342/343 行"8 条／8 处"→"10 条"；③ 第 343 行"没写 `a research`（全书 0 处）"→"没把 research 当可数名词用 `a research`（全书唯一形似的是 institute 卡 ex 的 `a research institute`，那里 a 挂 institute、research 是定语）"。
- **拍板 3（作者：载体冲突＋共享义项单侧）→ 义项那条不退（同 §五.6 (b) 档），载体要他点头**：一个词头只挂一张表是渲染层的硬事实，落地器若拒挂就得改 `at`。我的意见与草稿一致：**本组表挂 research 或 survey，`inquire-query` 原表不动**（两张表切入角确实不重叠，我逐条读过现存那张的 items/diff，它讲"动作 vs 纸上的问题"，本组讲"问一个人 vs 一群人 vs 查一桩事"）。

## 组 197 · amuse / entertain / recreation（6_04 组5，章1 段39，576/577，三成员）

- A：**OK** 6 行（575–580）逐字符全等。
- B：**OK（一处出处索引写错）** 576＝段39 第 1 句（entertain＋recreation 同句）、577＝第 2 句（amuse）；amuse 标 1（577）＋**未标 1（1406，章4 段21 第 4 句，`its dim echo amused kids near the fence`、译「微弱回声逗乐了篱笆边的孩子」）**两档分写与实测完全一致 ✓；entertain／recreation 各标 1/未标 0 ✓；`entertained / recreations / recreational` 0 处 ✓。
  **不符**：第 350 行与第 419 行两处把小标题标成 `subheads[1][26]`。实测 `subheads[1][26]`＝**空串**，「下篇·文化娱乐周」在 **`subheads[1][27]`**（章1 非空小标题只有 `[1][0]` 上篇·新生学期 与 `[1][27]` 下篇·文化娱乐周）。段 39 确实在它之下，判断不受影响，但索引错了。
- C：**OK** 正证据 19 条全查到（三卡 ex/exZh/note、576/577 全句与子串、1406 全句＋译文、575 全句、provide 卡词伙 `provide entertainment`、amuse 与 entertain 两卡 ex 只差词头、`exZh` 完全相同——逐字符核过 ✓）；反例 5 条（amused to pieces／entertain an audience／outdoor recreation／recreational／be amused by）实测 0 ✓；中文断言「娱乐」课文译文 0 处 ✓（但见下面建议 ①）、「开心」7 处 ✓、「消遣」2 处（575 pastime／576 recreation）✓、「款待」「休闲」各 0 ✓。
- D：**OK** 37.0 / 25.5；core 7.0／6.0／7.0。
- E：**OK** 表头「worklist 的共同义项『娱乐』，本书课文两处都没这么译」＝引用＋验真否定；core/默认行/总结句 0 命中「娱乐／消遣／款待／休闲」。
- F：**OK** 三张卡的词伙段全部＝课文（576/576/577）逐条同源并只算 1 条，"一条都不另计"；amuse/entertain 两卡 ex 同帧按 §五.14 三件齐；"amuse 接朋友、entertain 接孩子"用 1406 自己反例自限成分布 ✓。
- **建议 2 处**：① 第 425 行「它只活在两卡 `exZh`」不确——「娱乐」在三张卡的 `m` 义项栏里都有（`amuse.m` 就是「v. 娱乐」），章1 小标题「下篇·文化娱乐周」也有 1 处；写"课文译文 0 处、只在三卡 `m` 与两卡 `exZh` 上"即为真。② 口径 9 的重叠比我实测更重：6_04 组5 的 **recreation 侧 core「忙完之后那段闲」、scene「忙碌一天收工后，歌声带来的那点安静；…」、eg「bring quiet recreation after busy days」、默认行末半句「recreation = 忙后的闲」——与段39 已落地的 `pastime-recreation` 表 recreation 侧（core「忙完才有的那段放松」、scene「忙碌一天收工以后，歌声带来的那点安静」、eg 同一句、总结句「recreation = 忙后的闲（quiet recreation）」）近乎逐字重复**。草稿"各说一半"的说法在维度层成立，在措辞层不成立；落地后段39 会出现两张几乎一样的 recreation 侧。建议改字（如 core→"被带来、不被数出的那块"，默认行半句→"recreation = 那块不是凑出来的"）——同段两张表不必互相迁就数据，但要迁就眼睛。
- **判定：需作者改（MISMATCH 1 处＝小标题索引；建议 2 处）**。最小清单：第 350、419 行 `subheads[1][26]` → **`subheads[1][27]`**（我实测：`S[1]['subheads'][27]`＝'下篇·文化娱乐周'、`[26]`＝''）。

---

## 汇总

| 组 | 主题 | 判定 | 必修 |
|---|---|---|---|
| 188 | preceding / prior | **通过** | — |
| 189 | intermediate / midst | **MISMATCH** | crowd 号码：单数带标记 4 处＝269/530/927/936；1309/1315 是未标记的 `crowds`（两处同改） |
| 190 | meantime / meanwhile | **通过** | 撤拍板请求（判据 b 档）；meantime 卡 m/ex 矛盾属数据侧，报不改 |
| 191 | everlasting / permanent | **通过** | — |
| 192 | conservation / preserve / protect | **MISMATCH** | 1017 的「」引文「保守的选择」→ 原文译文是「稳妥的那条路」；（建议）protect 旁证 13→"12 动词＋1 名词 protection"、"全带词伙"→"两栏都齐" |
| 193 | impetus / spur / stimulate | **通过** | 撤拍板请求；（建议）scene 别造"眼睛发疼"、"只有它是动词"限定到本段三处 |
| 194 | clever / intelligent / smart | **MISMATCH** | smart 聪明档不是"唯一/一次"（strategy 卡 ex 的 exZh 就是「聪明的策略」）三处同改；两句 exZh 还差"解决／解出" |
| 195 | deem / reckon / suppose | **通过** | （建议）detect-perceive 只走 476；assume↔suppose 是互列不是"单向" |
| 196 | inquire / research / survey | **MISMATCH** | survey 限定词 4→7；research 8→10；`a research`「全书 0 处」不实（institute 卡 ex 1 处） |
| 197 | amuse / entertain / recreation | **MISMATCH** | `subheads[1][26]`→`[1][27]`（两处）；（建议）recreation 侧与同段已落地表措辞去重 |

**结构性风险这次没有**：6 个三成员组共 15 行 items 表我逐行数 `|`，**全部 7 列、`eg` 槽全满**，批次 5 那种"词性＋义项挤一格→整排左移"的错一处没有；A/D/E 三项 20 条宽度与 45 行表行全部零偏差。

**最严重一条**：组 194（idx 194）三处（题头 / items 的 `scene` / diff 的「聪明档落在哪」）把 smart 的"聪明"档说成"全书唯一一处、只在卡 ex"，而草稿自己在旁证里引的 `strategy` 卡 `ex`（`a smart strategy`）的 `exZh` 正是「一项**聪明的**策略」——这不是数字口径，是会把读者带去"本书没给 smart 的聪明档配过第二句"的错结论，落地后是卡面上的错话。
次严重的是同族的 §五.15 虚报：组 196 的「`a research` 全书 0 处」（1 处）、组 189 的 crowd 号码（4 个号错 2 个＋两档并一档）。批次 4/5 每一批都抓到虚报，这批也不例外。

**需要他拍的最多 3 条**

1. **6_04 组4（idx 196）的载体**：`inquire` 已挂 `inquire-query`（`at`＝`[1,25]`，我逐字核过报备准确）。要不要按草稿建议，把新表挂到 research（或 survey），原表不动？一个词头一张表是渲染层硬事实，必须点头。
2. **`preserve wildife` 错字**（`preserve.note` 第三条，全库唯一 1 次，我 grep 确认）：修卡由他定；不修则落地这条词伙时会把错字带上卡面——这是它唯一的实际风险。草稿"照原样引＋不改数据"的处置正确。
3. **章5 晚段 / 章1 段末的多卡同段渲染**：6_03 组2/3/4 三张表挤在章5 段54 末（1826 那句被组2、组3 共用，草稿已让角），6_04 组5 的 recreation 侧与**已落地**的 `pastime-recreation` 近乎逐字重复（见组 197 建议 ②）。要不要在下一次起草前，把"同段几张卡的 core／默认行互不相犯"写成 BRIEF 的硬约束？

（另：6_03 组3、6_04 组1 作者自报的两处"提请拍板"，按 §五.6／§五.7 与审核书尾判据属 (b) 档轻处理，**不必拍、也不退**，请作者把请求撤下；6_03 组5 的 `wildife` 与 6_04 组4 的载体见上面第 2、1 条。）
