# Gloss 基线报表（2026-09-14）

来源：`shadow/index.html` 第 933–935 行（`SECTIONS` / `VOCAB` / `CHAPTERS`，构建器生成的单行数据）。
抽取：`python3 tools/gloss-audit/extract.py`（只读 shadow，写 `tools/gloss-audit/out/`；幂等，已用 md5 重跑验证）。

## 基线数字（实测输出，与计划预期一致）

| 指标 | 数字 | 定义 |
|---|---|---|
| vocab（词条数） | 3219 | `VOCAB` key 数 |
| sents（句数） | 1809 | 全 sections `paragraphs` 展平句数（= `sentZh` 展平句数，逐 section assert 相等） |
| poly-words（多义词数） | 2209 | `m` 按 `[；;]` 切分出去空后义项数 > 1 的词条数 |
| poly-sents（多义句数） | 1502 | `marks`（`[[key:disp]]` 小写化）命中多义词的句子数 |
| `；；`（双分号条） | 393 | `m` 含 `；；` 的词条数 |
| 义项 > 3 | 455 | 切分后义项数 > 3 的词条数 |
| 前两义超 12 字 | 293 | `len('；'.join(前两义)) > 12` 的词条数（严格大于；前两义用 `；` 连接后计分隔符） |

脚本打印原文：

```
vocab: 3219 sents: 1809 poly-words: 2209 poly-sents: 1502
doublesemi: 393 over-3-senses: 455 two-sense-over12: 293
```

## 产物（Task 3–6 输入）

- `tools/gloss-audit/out/vocab-m.json`（3219：`key → m`）
- `tools/gloss-audit/out/sent-align.json`（1809 行：`sec/i/en/zh/marks`）
- `tools/gloss-audit/out/poly-sentences.json`（1502 行）

## 核对备注

- 3219 个去重 `marks` 全部精确命中 `VOCAB` key（`marks − VOCAB keys = ∅`），无悬空标注；大小写比较下 poly-sents 同为 1502，无大小写漏配。
- `data/vocab.json` 在本 worktree 不存在（`data/` 下只有 `book/covers/stories/sup.json`），抽取仅消费 `shadow/index.html`，与脚本实际行为一致。
- `two-sense-over12` 定义说明：`；` 连接符计入长度，故等价于“前两义字符之和 ≥ 12”；若用严格“两义字符和 > 12”（不计连接符）则为 218（边界和 = 12 的有 75 条）。此处采用 293 口径。
