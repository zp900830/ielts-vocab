# 第二轮捞回 · 复核规则（只判"会不会说错"）

你看到的是**第一轮代理一条都没交回**（或漏交）的词头，它们当时都带着候选。
第一轮是按"偶然相邻就砍"收的，砍得比项目负责人要的更狠 —— 他 2026-09-19 的原话是
「不会教错的就别砍」「低价值的全部捞回，别纠结」。所以这一轮只回答一个问题：

> **这串词换个句子还能不能原样套用？套上去会不会说错英语？**
> 不会 —— 交回来。会 —— 才留空。

## 输入格式

`work/cardgen/refix/rfaNN.txt`，一个词头一行，下面可能再附一到两行原句：

```
词头|卡上释义|syn[没交回的候选]|col[没交回的候选]
    原句：这条候选在课文里出现的那个句子（最多给两条候选的原句）
```

## 必须捞回（第一轮误砍）

| 形状 | 例子 | 为什么捞 |
|---|---|---|
| 形容词 + 名词的描写短语 | `kind physician`、`warm flame`、`small orchestra`、`empty throne`、`manly courage`、`quiet refuge` | 英语完全没错，学生照抄不会说错，只是信息量低 |
| 动宾 | `erase wrong answers`、`weld chair legs`、`steal coins` | 可整套复用 |
| 名词 + 介词 | `stand adjacent to`、`take steps` | 习惯搭配 |
| 冗余但正确的修饰 | `meat eating carnivore`、`white farm goose`、`tiny mite` | 上一轮砍掉后用户要求全部放回 |

## 仍然不许捞（照抄会错）

| 形状 | 例子 | 为什么 |
|---|---|---|
| 跨过主谓 / 带时态人称 | `barn stood`、`kids plunge`、`asthma came back`、`foe learned` | 换个人称就得改，不是"搭配" |
| 系表、宾补缺了一半 | `render hard lessons`（原句 render hard lessons simple）、`defensive around` | 少了后半句不成话 |
| 中心词抓错 | `tiny lawn`（原句中心是 lawn edge）、`pale wheat`（原句 pale wheat kernels） | 词头根本不是这个短语的中心词 |
| 介词/副词悬在尾巴 | `jump near`、`manifest as`、`saucer beneath` | 后面必须补宾语，套不上 |
| 只属于那一句的临时限定 | `every past stricture`、`counted every shilling` | 去掉限定词才是可套用的搭配 |
| 同义词义项不等 | `mite↔parasite`（上下位）、`sponsor≠provide`、`summary≠syllabus` | 换词后句子意思变了 |

## 交回格式

写到 `work/cardgen/refix_out/<同一个片号>.json`：

```json
[{"w":"physician","syn":[],"col":["kind physician"]},{"w":"barn","syn":[],"col":[]}]
```

- 每个输入行都要有一条输出，**确认该砍的也写空数组**，不许缺条。
- 字符串必须**逐字来自该行的候选**；词伙允许把窗口掐头去尾（`use soft acoustic echoes`
  → `soft acoustic echoes`），但必须是候选里的连续片段，不许换词。
- 同义词最多 3 个、词伙最多 3 条。
- **每判满 40 行整份覆盖写一次**，别攒到最后。
- 只写 `work/cardgen/refix_out/` 下你这一个文件；不碰数据文件、不做 git。
