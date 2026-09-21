# 修复记录 · 批次 6 切片 39+40 `6_03.md` + `6_04.md`（依据 `work/辨析审核/audit_b_b6.md`）· 2026-09-21

执行人：修复代理（FIX_6_b）。**只改了两份草稿 `work/辨析草稿/6_03.md`、`work/辨析草稿/6_04.md` 与本文件**；未碰 `shadow/data/*`（**`preserve wildife` 那个错字一个字没改，`vocab.json`、`sections.json` 只读**）、未碰 `scripts/*`、`tools/*`、`index.html`、`shadow/index.html`、别人的草稿（`6_01`、`6_02`、`6_05`–`6_09`、`5_*.md`）与任何 `audit_*.md`；**未跑 `tools/land_compare.py` 的任何模式**（含 `--dry-run` / `--check`；`work/辨析审核/land_preview.json` 仍是 Sep 20 23:24 / 27888 字节，未触碰）；无 git 写操作（只跑过 `git status --porcelain` 与 `git rev-parse --abbrev-ref HEAD` 确认工作区：13 条改动全在 `work/辨析草稿/`、`work/辨析审核/` 之内，`shadow/`、`scripts/`、`tools/`、两个 `index.html` 零条目；当前分支 `agent/qoder-compare-batches2-6-0920`）。

本次范围：MISMATCH 5（组 189 / 192 / 194 / 196 / 197）＋ 审核书明令"撤下拍板请求"3 处（组 190 / 193 / 196 的义项那一半）＋ 任务书追加的一条落地要求（`preserve wildife` 不得进卡面格子）。BLOCK 0。组标题 `## 组N · …` 的编号与成员顺序、`主锚点 = 章N 段M` 独立行（每文件 5 行）一字未动。

宽度一律用 `tools/width_rule.width`；**本次未动任何默认行／总结句／core**（改的都是表头一句、items 的 `scene`、diff 各格、出处清单、数据边界、附录），20 条标称值逐条回量仍与实测一字不差（见终检 3）。报告给的建议措辞不当事实来源——新写的每条反引号英文串自己回两份数据查过（含 `[[词头:表面形式]]` 的两变体拆法），新写的每条中文断言自己 grep 过 `sections.json` 的 `sentZh`／`subheads` 与 `vocab.json`（含 `cmp.group`），逐条自查写进下表。

| # | 报告编号 | 组 | 改前 | 改后 | 改后宽度 | 过不过 |
|---|---|---|---|---|---|---|
| 1 | 组189·C 行 MISMATCH（§五.13 两档并一档＋号码错，diff 格） | 189（6_03 组2 intermediate / midst） | diff「卡上另一半给了什么 / midst」格：`旁证 `crowd` 一词在课文另有 4 处（269 / 927 / 1309 / 1315），没有一处跟 midst 同现` | `旁证 `crowd` 带标记 4 处（269 / 530 / 927 / 936）＋未打标记的复数 `crowds` 2 处（1309 / 1315，另有 `crowded` 3 处：230 / 383 / 767），没有一处跟 midst 同现（§五.13 两档分开写）`。自查（自建 1833 句索引，章偏移 `[0,339,651,883,1277,1492]`）：带 `[[crowd:crowd]]` 标记的 4 处＝**269**（章0 段46）／**530**（章1 段31）／**927**（章3 段7）／**936**（章3 段8）；1309（章4 段5）／1315（章4 段6）是未打标记的 `crowds`；`crowded` 3 处＝230／383／767，均未打标记 ✓ | —（非 ≤40/≤30/≤12 字段） | 过 |
| 2 | 组189·C 行 MISMATCH（出处清单同一处） | 189（6_03 组2「出处清单」midst 卡 ex 那一行） | `；\`crowd\` 一词在课文另有 4 处（269 / 927 / 1309 / 1315），都不带 midst。` | `；\`crowd\` 带 \`[[词头:…]]\` 标记的课文 4 处是 269 / 530 / 927 / 936，另有未打标记的复数 \`crowds\` 2 处（1309 / 1315）与 \`crowded\` 3 处（230 / 383 / 767），这几处都不带 midst（§五.13 两档分开写）。`（与 #1 同一套号码，两处已一致） | — | 过 |
| 3 | 组192·C 行 MISMATCH（「」里的中文回数据查不到，计数行） | 192（6_03 组5 三成员计数行 conservation 那条） | `那是 \`conservative\`「保守的选择」，另一个词头、另有卡` —— 「保守的选择」是回译：1017 的 `sentZh` 实测「父亲选了稳妥的那条路：远一些，可是更安全。」，且「保守」二字全书课文译文 **0 处**（我自己 grep `sentZh` 1833 句：保守 0／稳妥 1＝1017） | `那是 \`conservative\` —— 它卡 \`m\` 的第一档才是「保守的」，而 1017 的 \`sentZh\` 实测是「父亲选了稳妥的那条路：远一些，可是更安全。」；另一个词头、另有卡，不算它的书证`。「保守的」＝ `vocab['conservative']['m']`＝`adj. 保守的；守旧的` 第一档逐字 ✓；1017 原句 `Father took the [[conservative:conservative]] choice: the longer road, but the safer one.` ✓ | — | 过 |
| 4 | 组192·C 行 MISMATCH（数据边界同一处） | 192（6_03 组5「档位与计数」条） | `conservative（1017「保守的选择」）是另一个词头` | `conservative 是另一个词头（1017 的译文是「稳妥的那条路」，它卡 \`m\` 第一档才写「保守的」）` —— 两处「」里的中文现在都回得了数据 | — | 过 |
| 5 | 任务书追加：`preserve wildife` 不得进卡面格子（报告 C/F 行判"处置正确"，但落地要求另加一道） | 192（6_03 组5 diff「外力来不来（两两对照）/ preserve」格） | 搭配格把三条词伙原样列进卡面：`词伙 \`preserve food\`、\`preserve animals\`、\`preserve wildife\`（三条本书课文 0 处，已 grep）、heritage 卡词伙 \`preserve cultural heritage\`` | 换成干净书证：`词伙 \`preserve food\`、\`preserve animals\`（两条本书课文 0 处，已 grep）、卡 ex \`She preserves fresh fruit\`、heritage 卡词伙 \`preserve cultural heritage\`（preserve 卡词伙段的第三条是数据侧错字，只作报备留在「出处清单」与「数据边界」，不写进本行卡面格）`。自查：`She preserves fresh fruit` ＝ preserve 卡 `ex` 连续子串 ✓；`preserve food`／`preserve animals` 课文 0 处 ✓；`preserve cultural heritage` ＝ heritage 卡 `note` 词伙段 ✓。**本组 items 表 `eg`／`core`／`scene`、默认行、总结句、表头一句均未引用过该词伙**（逐格查过，全片只有这一格在卡面槽位上） | — | 过 |
| 6 | 组192·`wildife` 报备行的措辞（同上，让"不进卡"写死在草稿里） | 192（6_03 组5「出处清单」＋「数据边界」＋文末附录） | ① 出处清单：`（第三条拼写少了个 l，本清单照原样引，未改数据；三条本书课文 0 处，已 grep）` ② 数据边界：`落地器若把这条词伙搬进卡会带同一个错字` ③ 附录：`**卡上 \`preserve wildife\` 错字 → 要拍板**` | ① 改「**这里是数据侧错字报备、照原样引，未改数据，也不带进任何卡面格子**；前两条本书课文 0 处」② 改「草稿里这三处都不落卡面 → 提请拍板：修不修卡由他定；**本次已把这条词伙从 diff 卡面格里换掉**（改用卡 ex `She preserves fresh fruit`），落地器取不到它」③ 附录同步：`要他定（修不修卡）：该条只留在「出处清单」与「数据边界」作错字报备，diff 卡面格已换成卡 ex 的干净书证，落地不带错字` | — | 过 |
| 7 | 组194·C 行 MISMATCH①（最严重那条：题头） | 194（6_04 组2 clever / intelligent / smart「表头一句」） | `可 smart 的"聪明"档本书只在卡 ex 用过一次：` | `可 smart 的"聪明"档课文 0 处，两处书证都在卡上：自己卡 ex（exZh「他是一个聪明的学生」）＋ strategy 卡 ex 那句 \`a smart strategy\`（exZh「这个团队制定了一项聪明的策略来赢得比赛。」）：`。自查：`vocab['strategy']['ex']`＝`The team made a smart strategy to win the game.`、`exZh`＝`这个团队制定了一项聪明的策略来赢得比赛。` 逐字 ✓；`smart` 卡 `exZh`＝`他是一个聪明的学生，能快速解决数学问题。`（我引的是前缀节选，草稿同形用法早已如此）；课文译文「聪明」2 处＝354（intelligent）／1262（clever），smart 0 处 ✓ | —（表头一句无宽度上限） | 过 |
| 8 | 组194·C 行 MISMATCH①（items 的 `scene` 槽） | 194（6_04 组2 smart 行，现第 125 行） | `她穿蓝牛仔裤看着精神；解数学题的那个学生（卡 ex 才轮到"聪明"）` | `她穿蓝牛仔裤看着精神；解数学题的那个学生 —— "聪明"档两处书证都在卡上（自己卡 ex ＋ strategy 卡 ex 的 \`a smart strategy\`），课文 0 处`。core 未动（`一身穿着的样子` 实测 7.0 ≤12）、`sense` 未动 | core 7.0（≤12，未动） | 过 |
| 9 | 组194·C 行 MISMATCH①（diff「卡上『聪明』这一档落在哪 / smart」格） | 194（6_04 组2 smart 行，现第 142 行） | `\`m\` 三档……：课文 355 走前两档（译「精神」），「聪明」档的**唯一书证**是卡 ex \`He is a smart student…\`` ＋「一句话区别」格 `本书只用了两档，各在一处` | 搭配格：`……「聪明」档**两处书证都在卡上**——自己卡 ex \`He is a smart student who solves math problems quickly.\`（\`exZh\` 译「他是一个聪明的学生」）＋ strategy 卡 ex \`The team made a smart strategy to win the game.\`（\`exZh\` 译「这个团队制定了一项聪明的策略来赢得比赛。」），课文 0 处`；区别格：`本书用上的只有"穿着"与"聪明"两头：前者在课文 1 处、后者在两处卡 ex`。两句卡 ex 我逐字符回 `vocab.json` 对过 ✓ | — | 过 |
| 10 | 组194·C 行 MISMATCH②（两句 exZh 还差第二处） | 194（6_04 组2 diff「三张卡的例句是不是同一件事 / intelligent」格） | `同帧同译文（两句 \`exZh\` 只差「聪明的 / 有才智的」四个字）` | `同帧同译文（两句 \`exZh\` 只差「聪明的 / 有才智的」与「解决 / 解出」两处）`。自查：clever `exZh`「这个聪明的男孩很快**解决**了这道数学题。」／intelligent `exZh`「这个有才智的男孩很快**解出**了这道数学题。」——确实两处，不是四个字 | — | 过 |
| 11 | 组194·同族的另两处（报告"三处同改"里没点名的同一句谎） | 194（6_04 组2「数据边界」口径 6 那格 ＋「出处清单」strategy 行 ＋ 文末附录组 2 行） | ① `它的"聪明"档本书 1 处书证在卡 ex` ＋ `卡 ex 就是它` ② 出处清单：`\`The team made a smart strategy to win the game.\` —— strategy 卡 \`ex\`（smart 在别的卡上被用的旁证）` ③ 附录：`smart 的聪明档只在卡 ex` | ① `它的"聪明"档有两处书证、都在卡上：自己卡 ex（exZh「他是一个聪明的学生」）＋ strategy 卡 ex 那句 \`a smart strategy\`（exZh「这个团队制定了一项聪明的策略来赢得比赛。」）；课文 0 处……两句卡 ex 就是它` ② 该行补 `exZh` 全文并明写"**也是"聪明"档的第二处书证**（算进 smart 侧卡上书证，不计入课文书证）` ③ 附录改 `两处书证都在卡上（自己卡 ex ＋ strategy 卡 ex 的 \`a smart strategy\`）、课文 0 处` | — | 过 |
| 12 | 组196·C 行 MISMATCH①（限定词计数） | 196（6_04 组4 diff「本书给它配了什么架子 / survey」格） | `本书 survey 侧一共 4 处带限定词（a / a / many / each）`，且搭配格只挂了 2 条串 | `一共 7 处带限定词（a×3：492 / survey 卡 ex / conduct 卡 ex；many：compile 卡 ex；each：1089；the×2：demographic 卡 ex / gender 卡 ex）`，并把 7 处的原文串逐条补进搭配格（`The school did a survey about student lunch preferences.`、`The company will conduct a survey next week.`、`each survey respondent`、`The survey collected demographic data like age and income.`、`The survey asks about your gender.`）。自查：我自己扫两份数据 —— a：492 `a short, fun survey`／survey 卡 ex／conduct 卡 ex；many：compile 卡 ex `many surveys`；each：1089；the：demographic、gender 卡 ex ＝ **7**；survey 卡词伙 `short fun survey`／`fun survey`、respondent 卡词伙 `survey respondent` 均零冠词，不在这个账里 ✓ | — | 过 |
| 13 | 组196·C 行 MISMATCH②（同句枚举与总数不齐） | 196（6_04 组4「数据边界·同源合并」条） | `research 侧 **8 条**（492、卡 ex、词伙 3 条、别的卡 ex 4 条 + state 卡词伙，其中词伙三条课文 0 处）` | `research 侧 **10 条**（492、卡 ex、词伙 3 条、别的卡 ex 4 条 + state 卡词伙 = 1＋1＋3＋4＋1，其中词伙三条课文 0 处）`。自查 10 处：492／research 卡 ex／卡词伙 `space research`+`research skills`+`in-depth research`／institute+prestige+grant+breakthrough 四卡 ex／state 卡词伙 `state funded scientific research` ✓（`researches` 词形全书 0 处 ✓） | — | 过 |
| 14 | 组196·C 行 MISMATCH③（§五.15 虚报"全书 0 处"） | 196（6_04 组4「计数结论、不是禁令」条） | `"research 不挂 a"来自本书 8 处的分布（无一处 a research）；"survey 能挂 a 也能复数"来自 4 处带限定词的写法……本书只是没写 \`a research\`（grep 过，全书 0 处）` | `"research 不挂 a"来自本书 10 处 research 的分布（没一处把 research 当可数名词单数挂在 a 后面）；"survey 能挂 a 也能复数"来自 7 处带限定词的写法……本书唯一形似 \`a research\` 的写法是 institute 卡 ex \`He works at a research institute.\`，那里 a 挂的是 institute、research 只是定语，"一条研究"那种把 research 当可数名词的 \`a research\` 本书 0 处（已 grep 两份数据）`。自查：我扫 1833 句（三变体）＋ 181 张卡 → `a research` 字面命中**只有 1 处**＝institute 卡 ex（草稿自己列为旁证）✓，"0 处"是虚报，已改成可验的说法 | — | 过 |
| 15 | 组197·B 行 MISMATCH（小标题索引错，两处） | 197（6_04 组5「共现位置」＋「出处清单」末段） | `subheads[1][26]`：下篇·文化娱乐周（出现 2 处；出处清单那处还写"渲染时挂在段 26 之前"） | 两处 → `subheads[1][27]`。「共现位置」补：`章1 非空小标题只有 \`[1][0]\`「上篇·新生学期」与 \`[1][27]\` 这两条，\`[1][26]\` 实测是空串`；出处清单那处改：`（实测 \`S[1]['subheads'][27]\`＝'下篇·文化娱乐周'、\`[26]\`＝空串；渲染时小标题挂在自己那一行，段 39 在其下）`。自查：`S[1]['subheads']` 长 52，非空项只有索引 0 与 27 ✓ | — | 过 |
| 16 | 组190·审核书"撤下这条拍板请求"（(b) 档轻处理） | 190（6_03 文件头＋组3 小标题＋组3 末条＋组3「卡内自相矛盾」条＋文末附录） | ① 文件头「提请拍板 **2** 处：组 3……；组 5……」② 组3 小标题尾 `（**要拍板**）` ③ 末条「**提请拍板点**：若他要求每张辨析卡的差异必须落在语义……需要他点头」④ `要不要动卡……请他拍板，我不改数据` ⑤ 附录组 3 行尾 `→ **要拍板**` | ① 改「提请拍板 **1** 处」＝只剩组 5 的 `wildife`；组 3 一条改写成"已按 `audit_b_b6.md` 组 190 行撤下：**不退回、也不必拍**"，并给出那条可 grep 的形状线（1826 `reading poems in the meantime` 挂 in the、主语仍是 Lin vs 1827 句首 `Meanwhile Mei learned guitar nearby` 换人换地）② 小标题尾改「（按 §五.6／§五.7 的 (b) 档，不提请拍板）」③ 末条换「**不提请拍板**……**诚实写法保留**：本书材料确实给不出语义层的差，本组不编」④ 改「属**数据侧报备**（改不改由他定，我不改数据）……**不是本组的退回理由**」⑤ 附录同步。**内容（表头、items、diff、默认行、总结句、"分不出语义差"的诚实结论）一字未改** | 默认行 33.0／总结句 21.0（均未动，实测同标称） | 过 |
| 17 | 组193·审核书"撤下这条拍板请求即可" | 193（6_04 文件头＋组1 小标题＋组1 末条＋文末附录） | ① 文件头「提请拍板 **2** 处：组 1……若他要求"共享义项至少在一侧成立"，本组退回义项表即可」② 组1 小标题尾 `（要拍板）` ③ 末条「**提请拍板点**：……本组退回义项表即可」④ 附录组 1 行尾 `**要拍板**` | ① 文件头改「提请拍板 **1** 处」＝只剩组 4 的载体；组 1 一条改写成"已撤下：不退回、也不必拍"，事实报备（351 译「激发」／352 两词都是名词译「鞭策」「劲头」／全书课文译文「刺激」1 处＝1645 落 `stimulus`）原样保留——我自己 grep `sentZh` 1833 句：「刺激」确为 1 处＝1645 ✓ ② 小标题尾改「（按 §五.6 的 (b) 档就地轻处理，不提请拍板）」③ 末条换「**不提请拍板**」并列 §五.6 三件齐的落点（标题／`sense` 槽／数据边界明写不升级）④ 附录同步。**内容一字未改**（含报告标为"建议"的两处，见未改项） | 默认行 37.0／总结句 26.5（均未动） | 过 |
| 18 | 组196·审核书"义项那条不退（(b) 档），载体要他点头" | 196（6_04 文件头＋组4 小标题＋组4 末条＋文末附录） | ① 文件头把组 4 的「调查」义项＋载体混在一起报 ② 组4 小标题 `……只有 survey 一侧成立（要拍板）` ③ 末条「本组与组 1 同型（共享义项只有一侧成立），但更麻烦的是载体……」④ 附录 `**要拍板**（另附载体报备……）` | ① 文件头改：拍板只剩**载体**（inquire 已挂 `inquire-query`，`at` 就是 `[1,25]`，一个词头只挂一张表是渲染层硬事实——我逐字回 `vocab.json` 复核：`cmp.group`＝`inquire-query`、`at`＝`[1, 25]`、items＝inquire＋query；research／survey 两卡确无 `cmp` ✓）；义项那一半明写"不提请拍板" ② 小标题改「§五.6 (b) 档就地轻处理，不提请拍板，**载体要他点头**」③ 末条改「**提请拍板点（只剩载体一条）**」④ 附录同步 | — | 过 |
| 19 | 两份草稿第 5 行范围声明与事实对齐（我自己这轮动了 `work/辨析审核/`） | 188–197（6_03／6_04 文件头第 5 行） | `未碰别人的草稿与 \`work/辨析审核/\`` —— 本轮之后就不成立了（本轮在 `work/辨析审核/` 新建了本文件） | 拆成两行：保留"只读未改数据／未跑落地器／无 git 写"，并加一行「本文件已经过门禁 2 修复轮（`work/辨析审核/FIX_6_b.md`）：本轮只改本文件与姊妹切片 ＋ 新建那一份修复记录，任何 `audit_*.md` 一字未动」 | — | 过 |

## 未改项及理由

- **`preserve wildife`（报告"需要他拍的第 2 条"＋数据侧发现）——数据一字未改**。我的处置：① `shadow/data/vocab.json` 里那个少一个 l 的词伙**保持原样**（我没有、也不该改数据）；② 草稿三处引用中**唯一落在卡面格子里的那一处**（组 5 diff「外力来不来 / preserve」搭配格）已换成干净书证卡 ex `She preserves fresh fruit`（见 #5），所以落地取不到它、错字不会上卡面；③ 「出处清单」与「数据边界」两处**继续照原样引**，并按任务书要求显式标明"数据侧错字报备、不进卡"（见 #6），文末附录同样；④ 报告判"草稿处置正确"的三处文字（第 362／383／397 行）事实内容未动，只补了"不进卡"的标注。修不修卡仍等他拍。
- **报告标「建议」的全部条目一字未动**（共 8 处）：组 192 的"13 张别卡 ex → 12 动词＋1 名词 protection"与"唯一一组成员全带词伙 → 两栏都齐"；组 193 的 `scene`「强光弄得眼睛发疼」与"三张卡里只有它是动词"；组 195 的「detect-perceive 走 476」与「assume 卡同义词栏单向列了 suppose」；组 197 的「它只活在两卡 `exZh`」与 recreation 侧同段两张表措辞去重（含报告代拟的新 core／默认行半句）。理由：任务书写明"报告标『建议』『口味』『待他拍』的条目不动"。其中组 197 建议①我核过确是事实（「娱乐」在三卡 `m` 都有、章1 小标题 1 处、课文译文 0 处），但那是建议级，不由我这边动。
- **组 190 的诚实写法与全部卡面内容**：只撤"提请拍板"这个动作（报告明令），没有为了让卡片"好看"编任何语义差；默认行／总结句／core／表头／items／diff 一字未动（终检 3 复量同标称）。
- **组 196 载体方案**：仍按草稿原建议（新表挂 research 或 survey、`inquire-query` 原表不动）报备等点头，我没挪任何东西、也没跑落地器去试挂。
- **组 196 diff「它面对的是谁 / survey」格尾的"本书四处 survey 后面都站着一堆答话的人"**：未动。报告未列此条，它说的是"谁在答话"这一维度（492／1089／survey 卡 ex／conduct 卡 ex），与我改的"7 处带限定词"是两个不同的账，不属本次 MISMATCH 最小清单；若他要统一到 7 处，一句话我就改。
- **组 192「唯一一组成员全带词伙的组」与"13 张"两处**：见上面「建议」条（未动）。
- **组 194「clever 只作定语」条里那句"含 strategy 卡 ex 的 `a smart strategy` 也是定语"**：未动 —— 报告判 clever 侧计数与分布全部属实（clever 标 4 处＋卡 ex＝5 处），该句讲的是"定语"这一形状的分布，不是"聪明档"的账。
- **`meantime` 卡 `m`／`ex` 自相矛盾（报告"数据侧问题，只报不改"）**：数据未动，报备保留。
- **全局句号编号、`sents`、组标题编号与成员顺序、`主锚点 = 章N 段M` 独立行、A 表 45 行的粗字（§五.16）**：全部未动（报告 A/B 行判 OK；我只动过 items 表 1 行的 `scene` 格与 diff 表 5 格，列数复查见终检 2）。
- **组 188、191、195 三组**：报告判"通过"，本次一字未改（其宽度、槽位在终检 2／3 里一并复量，仍全过）。

## 终检

### 1）门禁 1（原样输出）

```
$ cd "/Users/zhoupeng/Library/Mobile Documents/com~apple~CloudDocs/雅思背单词项目" && python3 tools/check_compare_draft.py work/辨析草稿/6_03.md work/辨析草稿/6_04.md
OK   6_03.md
OK   6_04.md

门禁 1: PASSED（全部英文串可回溯）
```

机检只看反引号，所以本次新写的串我另跑了一轮"不跳过否定行"的严格复查：22 条新增／改写的英文串（`crowds`、`crowded`、`She preserves fresh fruit`、`a smart strategy`、`The team made a smart strategy to win the game.`、`He works at a research institute.`、`The school did a survey about student lunch preferences.`、`The company will conduct a survey next week.`、`The survey collected demographic data like age and income.`、`The survey asks about your gender.`、`He compiles data from many surveys.`、`each survey respondent`、`reading poems in the meantime`、`Meanwhile Mei learned guitar nearby`、`in the meantime`、`a research`……）**逐条在 `haystack()` 里命中，0 条查无**；新写的中文断言逐条 grep：「刺激」课文译文 1 处＝1645 ✓、「聪明」2 处＝354/1262 ✓、「调查」3 处＝492/1089/1090 ✓、「保守」0 处／「稳妥」1 处＝1017 ✓、「下篇·文化娱乐周」＝`subheads[1][27]`（`[26]` 空串）✓。

### 2）结构与槽位复查（只读草稿，按表头数 `|`；未跑落地器）

| 项 | 6_03 | 6_04 | 结论 |
|---|---|---|---|
| 组标题 `## 组N · …` | 5（组1–5，idx 188–192） | 5（组1–5，idx 193–197） | 编号与成员顺序未动 ✓ |
| `主锚点 = 章N 段M` 独立行 | 5 | 5 | 字段名与值未动 ✓ |
| items 表（表头 7 列） | 11 行全 7 列、`eg` 槽全满 | 15 行全 7 列、`eg` 槽全满 | 26 行 0 错位 ✓ |
| diff 表（表头 5 列）／原文表（3 列）／附录索引（8 列） | 90 表格行 0 处列数错位 | 114 表格行 0 处列数错位 | ✓ |
| 15＋11 个 `core` 实测宽度 | 7.0–9.0 | 5.0–9.0 | 全部 ≤12 ✓（本次一个 core 都没改） |
| §五.4 义项词落槽 | 未动（报告 E 行 10 组全 OK） | 未动 | ✓ |

### 3）10 条默认行 + 10 条总结句逐条标称／实测（含未改的组；尺＝`tools/width_rule.width()`，取法＝`width_rule.extract()`）

| 组 | 默认行标称 | 默认行实测 | 默认行本体 | 总结句标称 | 总结句实测 | 总结句本体 |
|---|---|---|---|---|---|---|
| 188 preceding/prior | 33.5 | 33.5 ✓ | `prior = 素描攒下的老本事（prior skill），preceding = 那一周他天天读` | 22.0 | 22.0 ✓ | prior 管早先攒下的本事，preceding 管那一周。 |
| 189 intermediate/midst | 35.0 | 35.0 ✓ | `intermediate = 长故事那排架，midst = 考试当中（in the midst of exams）` | 24.5 | 24.5 ✓ | intermediate 管架子排第几，midst 管人站在哪一堆。 |
| 190 meantime/meanwhile | 33.0 | 33.0 ✓ | `meantime = 读诗那点空（in the meantime），meanwhile = 切到梅学吉他` | 21.0 | 21.0 ✓ | 一处挂 in the 摆在句中，一个放句首带逗号。 |
| 191 everlasting/permanent | 35.0 | 35.0 ✓ | `everlasting = 那份爱往后长（everlasting love），permanent = 窗边那张桌` | 15.0 | 15.0 ✓ | 一份爱往后长，一张桌摆着不动。 |
| 192 conservation/preserve/protect | 38.0 | 38.0 ✓（顶格未超，落地别加字） | `conservation = 全班学的规矩，preserve = 落花留做手工，protect = 遮阳网挡强光` | 27.0 | 27.0 ✓ | protect 挡强光，preserve 留落花，conservation 是规矩。 |
| 193 impetus/spur/stimulate | 37.0 | 37.0 ✓ | `spur = 催你更努力（useful spur），impetus = 那股劲，stimulate = 点着好奇心` | 26.5 | 26.5 ✓ | spur 催你多干，impetus 推着事走，stimulate 点着念头。 |
| 194 clever/intelligent/smart | 37.0 | 37.0 ✓ | `clever = 办法巧（clever ways），intelligent = 说人本身，smart = 说穿得精神` | 25.5 | 25.5 ✓ | 人本身用 intelligent，办法用 clever，穿着用 smart。 |
| 195 deem/reckon/suppose | 35.5 | 35.5 ✓ | `deem = 看它太冒险（too risky），reckon = 说它有用，suppose = 不核实就猜` | 25.5 | 25.5 ✓ | deem 说那样东西怎么样，reckon 和 suppose 说一件事。 |
| 196 inquire/research/survey | 37.5 | 37.5 ✓ | `inquire = 开口问（inquire about），survey = 一堆受访者，research = 查一桩事` | 29.0 | 29.0 ✓（顶格未超，落地别加字） | 开口问用 inquire，问一群人用 survey，查一桩事用 research。 |
| 197 amuse/entertain/recreation | 37.0 | 37.0 ✓ | `amuse = 逗朋友（amuse friends），entertain = 哄孩子，recreation = 忙后的闲` | 25.5 | 25.5 ✓ | 逗人开心用 amuse / entertain，那份闲是 recreation。 |

20 条标称＝实测、偏差 0.0，无一超 40／30；**本次未改任何默认行／总结句／core**，故无标称值需要重贴；两条顶格（组 192 默认行 38.0、组 196 总结句 29.0）落地时不要再加字。

### 4）工作区（只读）

```
$ git status --porcelain
 M work/辨析草稿/6_01.md … 6_09.md            （6_01/6_02/6_05/6_06/6_08/6_09 是别的修复代理的产出，我没碰）
 M work/辨析草稿/6_03.md                       ← 本次改
 M work/辨析草稿/6_04.md                       ← 本次改
?? work/辨析审核/FIX_6_a.md                    （别人的修复记录，未碰）
?? work/辨析审核/audit_a_b6.md … audit_d_b6.md （四份审核书，一字未动）
?? work/辨析审核/FIX_6_b.md                    ← 本文件
```

（`shadow/`、`scripts/`、`tools/`、`index.html`、`shadow/index.html` 无任何条目；`work/辨析审核/land_preview.json` mtime 仍为 Sep 20 23:24、27888 字节，本次未跑落地器。）
