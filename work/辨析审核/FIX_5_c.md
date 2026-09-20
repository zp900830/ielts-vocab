# 修复记录 · 批次 5 后半 `5_05.md` + `5_06.md`（依据 `work/辨析审核/audit_c_b5.md`）· 2026-09-21

执行人：修复代理（FIX_5_c）。**只改了两份草稿 `work/辨析草稿/5_05.md`、`work/辨析草稿/5_06.md` 与本文件**；未碰 `shadow/data/*`、`scripts/*`、`tools/*`、`index.html`、`shadow/index.html`、别人的草稿（`5_01..5_04`、`5_07..5_09`、`4_*.md`）与任何 `audit_*.md`；**未跑 `tools/land_compare.py` 的任何模式**（含 `--dry-run` / `--check`，`work/辨析审核/land_preview.json` 未被本次触碰）；无 git 写操作（只跑过 `git status` / `git rev-parse` 确认工作区：`shadow/`、`scripts/`、`tools/` 零改动，批次 5 产物全是未跟踪文件）。

本次范围：BLOCK 3（组158、组162、组165）＋ MISMATCH 3（组157、组160、组161）共 6 组、10 条改动。组标题 `## 组N · …` 的编号与顺序、`主锚点 = 章N 段M` 字段名一字未动。宽度一律用 `tools/width_rule.py`；报告给的建议措辞不当事实来源——反引号英文串与「0 处／N 处」式断言全部自己回 `shadow/data/sections.json`（自建 1833 句全局索引，章偏移 `[0,339,651,883,1277,1492]`）与 `shadow/data/vocab.json` 复核后才落地。

| # | 报告编号 | 组 | 改前 | 改后 | 改后宽度 | 过不过 |
|---|---|---|---|---|---|---|
| 1 | 组157·C 行 MISMATCH①（引用号错＋定性错，diff 行） | 157（5_05 组2 recover / restore） | diff「卡上还给了哪档、用上了吗」行 recover 侧搭配格：`…（课文未用到）。课文 198 另有一句 ` + `No cage was used and the cells remained open` + `，那里的 cells 是笼子、不与 recover 连用` | 同格改为：`…课文 312（章0 段53 第 4 句）另有一句 `No cage was used and the cells remained open`，那里的 cells 译文作「小隔间」（cage 才是「笼子」）、不与 recover 连用`。自查：全局 312 = 章0 段53 第 4 句，原文 `No [[cage:cage]] was used and the [[cell:cells]] remained open.`、`sentZh`「没有用到任何笼子，那个小隔间也一直敞开着。」；全局 198 实测是 `Nothing felt hopeless once they learned how photosynthesis feeds green shoots.`（报告说的 198→312 成立） | —（非落地字段） | 过 |
| 2 | 组157·C 行 MISMATCH①（出处清单同一处） | 157（5_05 组2） | `- `No cage was used and the cells remained open` —— 课文第 198 句（章0 段53；只用来报备…）` | `- `No cage was used and the cells remained open` / 译文「没有用到任何笼子，那个小隔间也一直敞开着。」 —— 课文第 312 句（章0 段53 第 4 句；cells 译作「小隔间」、cage 才是「笼子」…）`（译文一并补上，免得下次又靠"cells 是笼子"下判断） | — | 过 |
| 3 | 组157·C 行 MISMATCH②（§五.15 虚报） | 157（5_05 组2「不写的」栏） | `…；`recover` 的名词 `recovery` 本书 0 处（grep 过），不提；…` | `…；`recover` 的名词形本组不展开——`recovery` 另有一张自己的卡（词头在 `vocab.json` 里），课文 1701 有一处 `guiding her slow recovery day by day`（章5 段34 第 4 句，译「陪她一天天慢慢康复」），它不在本组成员里（硬约束 2），按 §五.13 属"打了标记的那 1 处"；…`。自查：`vocab['recovery']` = `n. 恢复；复苏`（有卡）；全局 1701 = 章5 段34 第 4 句、句内含 `[[recovery:recovery]]` ✓（原「本书 0 处」是虚报，删） | — | 过 |
| 4 | 组158·E 行 **BLOCK**（唯一 BLOCK 级默认行） | 158（5_05 组3 amplify / augment） | `amplify = 话筒放大（soft voices），augment = 课文加料（augment dull texts）` —— 「放大」正是 amplify 卡 `m` 第一档字面（自查 `vocab['amplify']['m']` = `v. 放大；增强`），违 §五.4 | 取报告两版备选的第 1 版（35.5 那版，钩子更全且默认行里不含任何 `m` 字面词、也不含"大"字号补语）：`amplify = 话筒（soft voices），augment = 课文加料（augment dull texts）`；小标题标称同步 37.5→35.5，文末附录标称串同步（38.0 / 38.0 / **35.5** / 40.0 / 39.0） | **35.5**（≤40，实测；与报告预判一致） | 过 |
| 5 | 组160·MISMATCH（措辞过界） | 160（5_05 组5 excuse / forgive） | diff「本书把它当什么词用」格：`本书只让它当**名词**（可数的那样东西）` —— 与同组下一行、数据边界自述（动词档书证在卡 ex `Please excuse me for being late.`）口径相反 | 按报告最小修法：`本段只让它当**名词**（可数的那样东西；课文另一处 1610 也是名词）`（自查：段 15 内 excuse 只 1585 一处、是名词；1610 是名词复数、未打标记；卡 ex 是动词 → "本书"不成立、"本段"成立） | — | 过 |
| 6 | 组160·撤拍板请求（报告"唯一要动的"第二件，§五.14 结尾） | 160（5_05 文件头＋组5 小标题＋组5 末条） | ① 文件头「提请拍板 **3** 处：…；**组 5**（excuse / forgive）属口径 6 的"档位错"…按口径 14 同形照写、出卡。」② 组5 小标题「…属档位错（**要拍板**）」③ 末条「**提请拍板点**：…若他认为同帧卡 ex 应升级成"两词可换"的宣称，需要改表头措辞，请标注。」 | ① 改「提请拍板 **2** 处」＋组 5 一条改写成"原也在此列，现按 §五.14 结尾'不再逐组提请拍板'撤下提请"，事实报备（档位错、卡 ex 同帧）保留并指回组内「数据边界」；② 小标题尾括注改「（按 §五.14 不再提请拍板）」；③ 末条换成「**不提请拍板**」并写明三件齐（同形照写／"两栏没互列故 false 有据"／两句各算一侧），§五.14 定义处补了「它结构上看不见例句形状」一句 | — | 过 |
| 7 | 组161·MISMATCH（无主语词伙被算进句法统计） | 161（5_06 组1 differentiate / distinguish） | diff「谁在当主语」格：`本书 differentiate 的 3 条文本（课文 1 + 卡 2）主语全是人` | `本书 differentiate 侧**两处有主语的句子（课文 1609 ＋ 卡 ex 1）主语都是人**；卡词伙 `differentiate between factual information and opinions` 那条没有主语，不算进这一格（按 §五.13 它属"词伙块"、不属句子）`（自查：1609 主语 He；卡 ex `Can you differentiate between the two colors?` 主语 you；那条词伙确无主语） | — | 过 |
| 8 | 组162·**BLOCK**（items 表 6 列错位） | 162（5_06 组2 incline / lean，第 108 行） | 整行：`\| lean \| /liːn/ \| v. 倚靠；倾斜；adj. 瘦的 \| 把自己搭上去 \| 1610 不拿借口当支撑；627 球杆斜在球门框边；卡 ex 是只精瘦的狗（没在靠什么） \| `nor lean on excuses`（课文 1610） \|` —— **6 格**：词性格装了整串 `m`，`sense` 槽拿到中文钩子「把自己搭上去」、`core` 槽拿到 scene 长句、`eg` 槽空 | 整行：`\| lean \| /liːn/ \| v. + adj. \| 倚靠；倾斜；瘦的 \| 把自己搭上去 \| 1610 不拿借口当支撑；627 球杆斜在球门框边；卡 ex 是只精瘦的狗（没在靠什么） \| `nor lean on excuses`（课文 1610） \|` —— **7 格**，只拆列未改一字（`v. + adj.` 沿用同片 excuse 行 `n. + v.` 体例；`sense` 逐字取自 `vocab['lean']['m']` 去掉 `v.`／`adj.` 后剩下的三档） | core 实测 6.0（≤12）；默认行／总结句未动（40.0 / 21.5） | 过（槽位复查见终检表） |
| 9 | 组162·MISMATCH（中文落点少一档） | 162（5_06 组2「中文落点」行） | `lean 有「斜靠」「倾斜」「扶正」三种处理` | `lean 有「斜靠」（627）、「倾斜」（770）、「扶正」（693）、「依赖」（本段 1610）四种处理`（自查 `sentZh`：627「斜靠着门边」／770「倾斜的棚子」／693「扶正长长的墙架」／1610「也不会依赖借口」→ 确为四种，各挂一处可 grep） | — | 过 |
| 10 | 组165·**BLOCK**（items 表 invalid 行 6 列错位，第 331 行） | 165（5_06 组5 invalid / patient） | 整行：`\| invalid \| /ɪnˈvælɪd/ \| n. 病人；病弱者；adj. 无效的 \| 被击垮瘫几周 \| 1659 强壮的人被糖击垮后好几周像的那样；卡 ex 是过期的票（没人病着） \| `making her feel like an invalid for weeks`（课文 1659） \|` —— **6 格**，`sense` 槽拿到「被击垮瘫几周」、`eg` 槽空 | 整行：`\| invalid \| /ɪnˈvælɪd/ \| n. + adj. \| 病人；病弱者；无效的 \| 被击垮瘫几周 \| 1659 强壮的人被糖击垮后好几周像的那样；卡 ex 是过期的票（没人病着） \| `making her feel like an invalid for weeks`（课文 1659） \|` —— **7 格**（`sense` 逐字对 `vocab['invalid']['m']` = `n. 病人；病弱者；adj. 无效的`） | core 实测 6.0（≤12） | 过 |
| 11 | 组165·**BLOCK**（items 表 patient 行 6 列错位，第 332 行） | 165（5_06 组5） | 整行：`\| patient \| /ˈpeɪʃ(ə)nt/ \| n. 病人；adj. 有耐心的 \| 诊室里挂号的那位 \| 1660 平静地告诉护士细节的那位；1822 林帮"老病友"画鸟；卡 ex 被医生帮着好起来的那位 \| `As a calm patient, she told the nurse`（课文 1660） \|` —— **6 格** | 整行：`\| patient \| /ˈpeɪʃ(ə)nt/ \| n. + adj. \| 病人；有耐心的 \| 诊室里被围着的那位 \| 1660 平静地告诉护士细节的那位；1822 林帮"老病友"画鸟；卡 ex 被医生帮着好起来的那位 \| `As a calm patient, she told the nurse`（课文 1660） \|` —— **7 格**，scene／eg 为报告说的"现值"未动 | core 实测 9.0（≤12） | 过 |
| 12 | 组165·MISMATCH（`core` 中文造景） | 165（5_06 组5 patient `core`，与 #11 同格） | `诊室里**挂号**的那位` —— 自查：`挂号` 在 `sections.json`、`vocab.json` 两份数据里 **0 处**（`grep -c` 两文件皆 0），是造出来的细节；`诊所` 实测 12 处（sections 10 ＋ vocab 2，如 1811「每月在诊所大厅分享画」）→「诊室里」站得住、"挂号"删 | 按报告改成 `诊室里被围着的那位`（9.0 ≤12）。出处：本组 diff「谁在它身边」格已列的 nurse／doctor／physician／hospital 四条卡 `ex`（`The nurse gave the patient medicine.`、`The doctor helped the patient feel better.`、`The physician checked the patient's temperature.`、`The hospital will isolate the patient to stop the spread.`），且与本组总结句「patient 身边围着整个诊所」同一画面，不再引入新细节 | 9.0（≤12） | 过 |

## 未改项及理由

- **组156 附带建议**（`undo` 的 `core`「把结开解 / 把点错的退回去」实测 12.5，超 §三 items 栏 ≤12，报告建议缩成「把结开解 / 把点错的收回」= 11.5）：**未动**。报告自己写明"属措辞不属事实"、且 §三 的 ≤12 不是 §四 硬约束、也不在本次最小清单（组 156 判"通过"）。实测确认：该格确为 12.5（我复量过），要缩就等他一句话，别由我这边动口味。
- **组158 拍板 2 / 组161 拍板 / 组162 拍板 / 组165 拍板**：**内容一字未动**。报告结论是"不退"，但只有组 160 被明令"撤下拍板请求"（理由是 §五.14 结尾"不再逐组提请拍板"）；其余 4 处报告仍把它们列为"等他拍板/已答复"的形状，按"报告没让删就不删"保留（含 5_06 文件头"提请拍板 3 处"与文末索引的 **要拍板** 标记）。
- **组164 两条建议**（"illness 的修饰语全在轻重常见与否"补 mental；"本书译文给 disease 的永远是名词"→"那 1 处"）：**未动**，报告自标"不改不拦"。
- **组159「默认行正好 40.0」提醒**：未动（顶格未超，报告明说"没超、落地别加字"）。
- **组158 `scene` 与散文里的「放大」**：未动。报告 E 行只扫四个槽（表头／默认行／总结句／core），本组 `core` 与总结句 0 命中判 OK；「话筒放大轻柔的说话声」（scene 格）与「这一段在讲什么」散文属报告未列位置，我不越界改判。改后默认行本身已不含「放大」。
- **组157 表头「都在'恢复'」那处肯定式引用**：未动。报告回 `sentZh` 验实为"真撞"（1571「恢复体力」／1572「恢复平静专注」），属 §五.11 允许形状。
- **全局句号编号、切片包 `sents` 口径**：未动（报告 B 行判 OK，附录"5 组 8 个句号／5 组 7 个句号对得上"仍成立）。
- **`subheads[5][20]`、章5 `paraZh` 引用**：未动（报告 B 行已核 [5][20]＝「下篇·奶奶的健康年」挂在段20、草稿标的就是它）。

## 终检

### 1）门禁 1（原样输出）

```
$ cd "/Users/zhoupeng/Library/Mobile Documents/com~apple~CloudDocs/雅思背单词项目" && python3 tools/check_compare_draft.py work/辨析草稿/5_05.md work/辨析草稿/5_06.md
OK   5_05.md
OK   5_06.md

门禁 1: PASSED（全部英文串可回溯）
```

### 2）三处 6 列错位的列数／槽位复查（脚本按 `land_compare.cells()` 同一条 `split('|')` 口径，只读草稿，未跑落地器）

| 行 | 表头列数 | 改前列数 | 改后列数 | `sense` 槽拿到 | `core` 槽拿到 | `scene` 槽拿到 | `eg` 槽拿到 |
|---|---|---|---|---|---|---|---|
| 5_06 第 108 行 lean | 7 | **6** | **7** ✓ | 倚靠；倾斜；瘦的（＝卡 `m` 去词性） | 把自己搭上去（6.0 ≤12） | 1610／627／卡 ex 三格长句 ✓ | `nor lean on excuses`（课文 1610）✓ |
| 5_06 第 331 行 invalid | 7 | **6** | **7** ✓ | 病人；病弱者；无效的（逐字＝卡 `m` 去词性） | 被击垮瘫几周（6.0） | 1659＋卡 ex 过期票 ✓ | `making her feel like an invalid for weeks`（课文 1659）✓ |
| 5_06 第 332 行 patient | 7 | **6** | **7** ✓ | 病人；有耐心的（逐字＝卡 `m` 去词性） | 诊室里被围着的那位（9.0） | 1660／1822／卡 ex ✓ | `As a calm patient, she told the nurse`（课文 1660）✓ |

同两文件另外 **17 行** items 逐行复量列数 = 7（`词｜音标｜词性｜sense｜core｜scene｜eg` 顺序无一行错位），共 20 行全 OK。

### 3）10 条默认行 + 10 条总结句逐条标称／实测（含未改的组；尺＝`tools/width_rule.width()`）

| 组 | 默认行标称 | 默认行实测 | 默认行本体 | 总结句标称 | 总结句实测 | 总结句本体 |
|---|---|---|---|---|---|---|
| 156 reverse/undo | 38.0 | 38.0 ✓ | `reverse = 推翻决定（reverse his decision），undo = 解开绳结（undo the knot）` | 20.5 | 20.5 ✓ | 决定翻没翻用 reverse，绳结解没解用 undo。 |
| 157 recover/restore | 38.0 | 38.0 ✓ | `recover = 散步缓回来（recover strength），restore = 热茶找回来（calm focus）` | 25.0 | 25.0 ✓ | recover 是自己缓回来，restore 是被别的东西弄回来。 |
| 158 amplify/augment | **35.5** | **35.5** ✓（改后重量） | `amplify = 话筒（soft voices），augment = 课文加料（augment dull texts）` | 21.0 | 21.0 ✓ | amplify 把小的变大，augment 往不够的加码。 |
| 159 ooze/seep | 40.0 | 40.0 ✓（顶格未超） | `seep = 钻缝进来（seep through cracks），ooze = 旧漆往外冒（make old paint ooze）` | 16.0 | 16.0 ✓ | seep 是穿缝进出，ooze 是往外冒。 |
| 160 excuse/forgive | 39.0 | 39.0 ✓ | `excuse = 迟到的由头（fair excuse），forgive = 老师不追究（forgive late steps）` | 24.5 | 24.5 ✓ | excuse 本段是名词的由头，forgive 一出场就是原谅。 |
| 161 differentiate/distinguish | 37.5 | 37.5 ✓ | `differentiate = 掰开真假（truth from lies），distinguish = 两队靠颜色认出来` | 26.0 | 26.0 ✓ | 同一句里，真假归 differentiate、敌友归 distinguish。 |
| 162 incline/lean | 40.0 | 40.0 ✓（顶格未超） | `incline = 心往发怒偏（incline to anger），lean = 拿借口当支点（lean on excuses）` | 21.5 | 21.5 ✓ | 往怒气偏的是 incline，往借口上搭的是 lean。 |
| 163 chin/jaw | 37.0 | 37.0 ✓ | `chin = 答话时抬起那一小块（small chin），jaw = 疼起来连着脖子（stiff jaw）` | 17.0 | 17.0 ✓ | 一个被抬起来答话，一个僵了有点疼。 |
| 164 disease/illness | 39.0 | 39.0 ✓ | `disease = 扫描单那条（showed on scans），illness = 待在家那阵子（stayed home）` | 28.0 | 28.0 ✓ | disease 在医生的检查单上，illness 在回家养的那段日子里。 |
| 165 invalid/patient | 38.5 | 38.5 ✓ | `invalid = 瘫几周那样（like an invalid），patient = 告诉护士的（calm patient）` | 25.0 | 25.0 ✓ | patient 身边围着整个诊所，invalid 本书只一个比喻。 |

20 条标称 = 实测，无一超 40 / 30；唯一动过文字的默认行是组 158（37.5→35.5），小标题与文末附录已同步；10 条总结句本次一字未动。

### 4）工作区（只读）

```
$ git status --porcelain
?? work/辨析审核/FIX_5_a.md
?? work/辨析审核/FIX_5_b.md
?? work/辨析审核/audit_a_b5.md
?? work/辨析审核/audit_b_b5.md
?? work/辨析审核/audit_c_b5.md
?? work/辨析审核/audit_d_b5.md
?? work/辨析草稿/5_01.md … work/辨析草稿/5_09.md
```

（`shadow/`、`scripts/`、`tools/`、`index.html`、`shadow/index.html` 无任何改动条目；`work/辨析审核/FIX_5_c.md` 为本文件，写完即为本清单第 7 条未跟踪项。）
