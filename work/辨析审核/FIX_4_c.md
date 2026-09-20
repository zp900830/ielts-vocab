# 修复记录 · 批次 4 切片 23+24（4_05 / 4_06）按 audit_c_b4 改稿

> 修复代理：FIX_4_c（2026-09-21）。依据 `work/辨析审核/audit_c_b4.md` + `work/compare_slices/BRIEF.md` §五.12–15。
> 只改 `work/辨析草稿/4_05.md`、`work/辨析草稿/4_06.md` 两份草稿与本文件；未动 `shadow/data/*`、`shadow/index.html`、`scripts/`、`tools/`、别人的草稿与审核报告；未跑 `tools/land_compare.py`；无任何 git 写操作。
> 换进草稿的每一条英文串都先在 `shadow/data/vocab.json` / `shadow/data/sections.json` 里 grep 过再落笔（§五.15）。
> 修后终检：`python3 tools/check_compare_draft.py work/辨析草稿/4_05.md work/辨析草稿/4_06.md` → 两份 **OK，门禁 1 PASSED**；20 条宽度（10 默认行 + 10 总结句）用 `width_rule.width` 复量，标称＝实测、无一条超 ≤40 / ≤30。
> 审核判可落地且本次无涉的 组 116 / 120 / 121 / 122 / 123 **一字未动**（含 118／120 的 invade 卡 `note` 空表报备、123 的两处提醒级措辞，均按"不当门槛、照出卡"保留原样）。

| # | 报告编号 / 组 | 改前 | 改后 | 改后宽度 | 过不过 |
|---|---|---|---|---|---|
| 1 | audit_c_b4 组 119（BLOCK·措辞级）· 4_06 组1 diff「它后面接什么 · strike」末句 | "strike 在本书**没有一次**当动词用" | "strike 的动词用法课文 0 处（课文唯一那处 1299 是名词）；动词义本书只以过去式 `struck` 出现在两张卡的例句里：lightning 卡 `The lightning struck the tree last night.`、midnight 卡 `The clock struck midnight.`"（两句均逐字回卡验实） | 不在宽度管控行（diff 格），默认行 36.0 未动·复量 OK | 过（门禁 1 PASSED） |
| 2 | audit_c_b4 组 119（BLOCK 第 2 处）· 4_06 组1「数据边界 · 计数结论」 | "strike 本书 0 处动词用法同理（strike 卡 `m` 明明给了 v. 击打，只是本书没用）" | "strike 的动词用法同理：课文 0 处……但卡面上有 2 处过去式动词用法（lightning 卡与 midnight 卡的 `ex` 各 1 句 `struck`），所以只能说'课文 0 处'，不能说'本书一次都没当动词用'" | 同上，总结句 22.5 未动·复量 OK | 过 |
| 3 | 同组连带（§五.15 同款误报第三处）· 4_06 附索引组1行 | "strike 当'那一场'本身、本书 0 处动词用法" | "strike 动词用法课文 0 处，动词义只以 `struck` 出现在 lightning / midnight 两卡 `ex`" | 索引表不受宽度尺管控 | 过 |
| 4 | audit_c_b4 组 119「顺带」· 4_06 组1「不写的」行 | "`struck`、`striking`、`hits`、`hitting` 这类形态在 `sections.json` 里各 0 处……一律不列" | 限定范围保留并点破依据："课文各 0 处（已 grep）——不列的理由是'课文 0 处'不是'本书没有'：`struck` 卡面 2 处、`striking` 还被 **dramatic / surprising** 两张卡的同义词栏各列名 1 次"（审核顺带句写的是 surprise，实测有该字样的是 surprising 卡的栏，按数据落笔） | 不在宽度管控行 | 过 |
| 5 | audit_c_b4 组 115（MISMATCH）· 4_05 组2 diff「卡上把它记在哪一族 · confine」 | "列的全是 limit / **restrain** 这一路" | "列的全是 **constrain / constraint / curb / limit** 这一路（restrain 不在任何一栏里，它只出现在课文 1253）"——四词逐一回 confine / restrict / limit / curb 四卡栏核过；restrain 在全库 note 0 命中复验属实。成员表 scene 里"再往下段（1253）还有 restrict / restrain 一路"引的是课文句，restrain 确在 1253，不误、未动 | 默认行 36.5 / 总结句 18.0 未动·复量 OK | 过 |
| 6 | audit_c_b4 组 117（MISMATCH）· 4_05 组4 出处清单 arrest 卡行括号 | "本书另外两处带 police 的文本是 crime 卡 ex 与课文 1250" | "带 police 的文本重数过：卡面共 **11 张卡的 `ex`** 含 police（enforce / investigate / arrest / crime / clue / assault / evidence / surrender / patrol / evacuate / scheme），课文侧只 1250 一处"——11 张与句号 1250 均本代理自己 grep 复算，与审核一致 | 不在宽度管控行，默认行 38.5 未动·复量 OK | 过 |
| 7 | 新口径 §五.14 · 4_05 组1（114 jail/prison）「数据边界」末条 | "**提请拍板点**：……要不要按 `all_synonyms: true` 的写法出卡……" | "**同形是合法物证（§五.14，不再提请拍板）**"：① 同形照写为最强"可换"物证；② 两栏没互列、故 false 有据；③ 同形两句 jail / prison 各算一侧 1 条书证（口径 8 不并条、不据标记否认同形）；照现表出卡。未退回、未碰 worklist | 不在宽度管控行 | 过 |
| 8 | 同组连带 · 4_05 文件头小结 | "提请拍板 3 处：……**组 1**……要不要按 `all_synonyms: true` 的写法出卡；" | "提请拍板 2 处"（组 2 / 组 4 原文保留），组 1 改为陈述句"按 §五.14 照现表出卡，同形已写进「数据边界」当合法物证" | 头部小结不受宽度尺管控 | 过 |
| 9 | 同组连带 · 4_05 附索引组1行 | "**'标 false 却实物可换'要拍板**" | "**ex 同形＝合法物证，两栏没互列故 false 有据，按 §五.14 照现表出卡、不拍板**" | 索引表不受宽度尺管控 | 过 |
| 10 | 工具修复连带 · 4_05 组5（118 blast/explosion）出处清单 1277 行 | "本清单**不整句引用**：……门禁 1 拆标记的变形会把这一句整段吞掉……落地时若要引它，只引不带标记的半截"（审核文末第 2 条：报备保留到工具修好为止） | 改为正常整句引用：`Last Sunday Grandpa said old wars brought deep violence and long conflict to villages` ＋子串 `deep violence`、`long conflict` ＋ `sentZh` 逐字引（均回数据验实），并保留一句已了结的成因备注（正则吞 `paragraphs` 开头 `[[`，已修，0/339/651/883/1277/1492 六句恢复可整句引） | 默认行 40.0 / 总结句 22.0 未动·复量 OK（40.0 贴线未超） | 过 |
| 11 | 顺手项 · 4_05 组5 §五.13 计数复核 | "blast 标 1（1282）／未标 0；explosion 标 1（1280）／未标 0；explode 无卡、`exploded` 全书只 bomb 卡 `ex` 1 处" | **未改**——本代理独立复算（词形匹配 + 标记位）与草稿所写逐档一致，属"复核过、无需动" | 计数行非宽度管控行 | 过 |
