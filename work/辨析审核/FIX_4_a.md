# 修复记录 · 批次 4 `4_01.md` + `4_02.md`（依据 `work/辨析审核/audit_a_b4.md`）· 2026-09-21

执行人：修复代理（FIX_4_a）。只改了两份草稿 `work/辨析草稿/4_01.md`、`work/辨析草稿/4_02.md` 与本文件；未碰数据 / 代码 / 别人的草稿与审核报告；无 git 写操作；未跑 `tools/land_compare.py`。

| # | 报告编号 | 组 | 改前 | 改后 | 改后宽度 | 过不过 |
|---|---|---|---|---|---|---|
| 1 | 组96·E 行 BLOCK① | 96（4_01 组3） | 默认行 `aid = 挂在名词前的援助（aid workers）…`（「援助」是 aid 卡 `m` 原义项词当钩子中心语，违 §五.4） | 按审核给的原 core 措辞换成 `aid = 挂在名词前那半截（aid workers），assist = 搭手帮那个人（assist us）` | 实测 36.5（与审核预判一致，标称原为 36.5，无需改小标题） | 过（≤40） |
| 2 | 组96·C 行矛盾 BLOCK② | 96（4_01 组3） | 出处清单第 226 行：`A funny lecturer…`（课文 369，**未打标记**） | 改为「课文 369，**打了标记**：该句标的是 lecturer 与 assistant 两个词头」——我自己在 `sections.json` 复核：369 句含 `[[lecturer:lecturer]] [[assistant:assistant]]`，与第 179 行对齐（§五.15） | — | 过（与数据一致） |
| 3 | 组94·F1 MISMATCH | 94（4_01 组1） | 差异表仍挂「谁在说（本组最反直觉的一格）」两行 + 「中文各走哪一路」一行，与第 28 行"三格不重讲"的承诺不符（已落地 declare.cmp 的四格实测为「说这话的是谁／说出去的那样东西是哪样／句子怎么搭／中文各走哪一路」，我直接读了 `shadow/data/vocab.json` 核对） | 两格换掉：「谁在说」→「别的卡的例句借了哪个词」（announce 被 judge/herald/chancellor/reform/official 五卡 ex 借用、declare 全库 0 卡借用，串全部沿用本组已核实出处）；「中文各走哪一路」→「这两个动词的名词形书里露过面吗」（announcement/declaration 课文与全部卡面 0 处、名词位由 announcer 顶着——三个断言均自行 grep：vocab+sections 全扫 0 命中；announcer 卡 ex 与课文 568 的 `[[announcer:announcer]]` 逐句核过）；第 28 行承诺改为点名已落地表四格"一格都不重讲"；边界节原「谁在说」格的奶奶/父亲反例降级为报备句；出处清单两行同步（5 条旁证"逐条列出"改指新格；announcer 报备补 568）；复核索引行同步 | 差异表 4 个维度（2–4 合规）；新增英文串均查得到，门禁 PASSED | 过 |
| 4 | 组94·F2 MISMATCH | 94（4_01 组1） | 「本书 announce 侧 8 条文本**每一处都说得出谁在听**」 | 「8 条里 7 条写得出听的人……只有 757 奶奶那句全句与译文都没交代谁在听（奶奶对自家说的，靠常识补）」；边界节「announce 每处都有听众」与复核索引「处处有听众」两处同源说法一并降级为 7/8 | —（未动默认行/总结句） | 过（撑得住） |
| 5 | 组100·C 行错位 MISMATCH | 100（4_02 组2） | 计数段「过去式与第三人称单数只在卡侧例句里有：`reduces emission`、`increases by one increment`」——后半是组 99 的词 | 换成本组成员的写法分布：删 `increases by one increment`；"过去式只在卡侧"改为"过去式与名词派生形（reduced/reduction/decreased 这类）课文与卡面都查不到 0 处；第三人称单数只 `reduces emission`（emission 卡 ex）一次；decrease 卡侧只剩原形与 `a decrease`"（forms 我扫过 sections+vocab：reduced/reduction/decreased/decreases 全 0 命中，原句"过去式有"本身也不成立，已按可查事实写） | — | 过（0 条别组串） |
| 6 | 组102·A 行 MISMATCH（其一） | 102（4_02 组4） | 1168 行 `young **renters** nearby` 加粗，但数据里 1168 标记只有 influx/imply/affluent，renter 无卡 | 去掉 `renters` 那对 `**`（标记集合我自查过 ✓） | — | 过（恢复"加粗＝挂了词头"约定） |
| 7 | 组102·A 行 MISMATCH（其二） | 102（4_02 组4） | 1170 行 `no **spare** **chairs**` 中 `chairs` 加粗，1170 标记只有 adequate/spare，chair 无卡 | 去掉 `chairs` 那对 `**` | — | 过 |
| 8 | 组103·A 行 MISMATCH | 103（4_02 组5） | 1170 行（组5 表）`**spare** **chairs**` 同上 | 去掉 `chairs` 那对 `**` | — | 过 |
| 9 | 附带 | 94 | 4_01 头记「全文 186 条唯一英文串」在改稿后失实 | 去掉写死条数，改为"每一条反引号英文串逐条可查 + 2026-09-21 改稿后重跑 PASSED" | — | 过 |

## 未改项及理由

- **组 96 审核建议③**（在「「协助」这一档本书没这样用过」后补 365 印「协助」的说明半句）：报告自标"建议"、不在本次必改清单，按"照报告、别自己发挥"未动。数据侧我核过：365 句为 `the assistant [[principal:principal]]`、译文确印「协助校长的副校长」，若后续要补，事实已备。
- **段 47 三张表第一格同为词性/位置**：审核明示口味项、他拍板本轮不做（牵动宽度），一字未动。
- **判 OK 的 5 组（95、97、98、99、101）**：一字未动（101 的"增长补半句"是审核给下一位的提醒，非必改，未动）。

## 终检

- `python3 tools/check_compare_draft.py work/辨析草稿/4_01.md work/辨析草稿/4_02.md` → 两文件 **OK，门禁 1 PASSED（全部英文串可回溯）**（改稿后重跑）。
- 10 条默认行 + 10 条总结句全量复量：标称 = 实测，无一超 40 / 30（含改后的组 96 默认行 36.5）。
