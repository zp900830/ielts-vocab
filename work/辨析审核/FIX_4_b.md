# 修复记录 · 批次 4 切片 21+22（按 audit_b_b4 改稿）

范围：`work/辨析草稿/4_03.md`、`work/辨析草稿/4_04.md`。尺：`tools/width_rule.py` 的 `width()`。
门禁：`python3 tools/check_compare_draft.py work/辨析草稿/4_03.md work/辨析草稿/4_04.md` → 两份均 **PASSED（0 条查不到）**。
未动产品代码/数据、未跑 `land_compare.py`、无 git 写操作。审核判通过的 5 组（105/106/110/112/113）一字未动。

| # | 报告编号 | 组（文件） | 改前 | 改后 | 改后宽度 | 过不过 |
|---|---|---|---|---|---|---|
| 1 | BLOCK·修复清单1 | 组109 / 4_04 组1 · 1217 原文行 | `read the cold **regulation** aloud twice.`（单数） | `read the cold **regulations** aloud twice.`（复数，与数据 `[[regulation:regulations]]` 一致；中文行不动） | 默认行 34.5／总结句 25.0（未动） | 过 |
| 2 | MISMATCH·修复清单2 | 组111 / 4_04 组3 ·「不写的」 | `compulsory、obligatory、make it mandatory、a moral obligation 这类本书 0 处…` | 摘掉 compulsory，改写为"compulsory 有卡（`compulsory math`）、课文 455 挂标记、卡 ex 与 mandatory 卡 ex 只差那个动词，属另一张 mandatory／compulsory 表的对照"；0 处只留 obligatory／make it mandatory／a moral obligation | 默认行 33.5／总结句 22.5（未动） | 过 |
| 3 | MISMATCH·修复清单3 | 组107 / 4_03 组4 ·「不写的」 | `卡 m 没有这档，本书也查无 manager／management 这两个词` | `management 全书 0 处；manager 无卡、课文 0 处，但有 11 张卡在用、含 9 句现成例句（hire 卡…new manager…、oversee 卡 The manager oversees…），只在别人卡例句里当背景角色` | 默认行 37.5／总结句 22.0（未动） | 过 |
| 4 | MISMATCH·修复清单4 | 组108 / 4_03 组5 · 正文"书外提及"行 | `opportunity 只出现在 chance 卡那一栏里——除互列之外本书没第二处提过 opportunity` | `opportunity 书外还有第 2 处提及——seize 卡词伙 seize job opportunities；"没第二处提过"不成立，记为 chance 卡同义词栏 + seize 卡词伙共 2 处` | 默认行 37.5／总结句 23.5（未动） | 过 |
| 5 | MISMATCH·修复清单5 | 组104 / 4_03 组1 · 数据边界同源合并 | `词伙 3 条 + 别的卡 3 条（luxury / package / transit）+ product 卡同义词栏 1 条` | `词伙 3 条（含 luxury goods…）+ 别的卡 2 条（package / transit）`，点名 `luxury goods` 跨卡同串（goods 卡与 luxury 卡同一条文本），§五.8 已并入词伙、不重复计，别的卡一侧 -1 | 默认行 39.0／总结句 18.0（未动） | 过 |
| 6 | MISMATCH·修复清单6 | 组104 / 4_03 组1 · 出处清单 paraZh 行 | `本段 6 句里 1176 进货、1179 签约旁听，主题栏说的事句子都撑得住` | 收窄为 §五.12："进货"＝1176、"旁听"＝1179 两项撑得住；"签约"本段无对应句（1179 是 `Long negotiations followed`，长商谈非签约，sign/contract 0 处），"侄子"与译文不合（godson 译「教子」） | 默认行 39.0／总结句 18.0（未动） | 过 |

## 未改项与理由
- 组 113（murmur／whisper，新 §五.6 "档位错"检查）：审核判通过、属"一字不动"的 5 组。已按其指示复核——草稿把 murmur 的 v. 档写成"全书 0 处 / 本书没这样用过"、whisper 的 v. 档写成"书证在别段 967/1087/1117/129/944"，**没有**把"档位错"升级成"本书没有这个词形"，已是收窄形态，无需改。
- 审核"备注·可不改"3 条（组110"一句挤四个标准类词"、组112 late truck 另有 1254、组113「低语」"那处"宜改"那几句"）：不改判、非清单必改项，且组110/112/113 均在"通过 5 组"内 → 一字不动。

## 宽度总检
10 组 × （默认行 + 总结句）＝20 个标称值，全部用尺复量：默认行 39.0/38.5/39.5/37.5/37.5/34.5/34.0/33.5/34.5/38.5 均 ≤40；总结句 18.0/22.5/21.0/22.0/23.5/25.0/19.0/22.5/17.0/19.5 均 ≤30。标称与实测一字不差，无一条超限（本次 6 条改动均未触碰任何默认行/总结句围栏，宽度不变）。
