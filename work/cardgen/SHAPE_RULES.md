# 词伙「成品搭配 vs 偶然相邻」专判规则

你只回答一个问题：**这串词，雅思考生能不能原样背下来、在自己的作文或口语里套用？**

不能 —— 判 drop。能 —— 判 keep。不要改写、不要拆分、不要换词，只能对整条说 keep 或 drop。

输入每行五段，用「｜」分隔：

```
词头｜卡上释义｜词伙｜它在课文里的原句｜原句中文
```

## 判 keep（同时满足）

1. **脱离原句也站得住**：把这条词伙单拎出来，是一个完整的、可复用的语义单位。
2. **没有越界**：整条处在同一个短语内部，没有跨过主语/谓语/宾语的边界。
3. **没有临时成分**：不带只服务于那一句的副词、限定词、数字、所有格。
4. **不冗余**：修饰语不重复词头自带的含义。

## 判 drop（命中任一条）

| 类型 | 例子 | 为什么 |
|---|---|---|
| 冗余修饰 | `meat eating carnivore`、`grass eating herbivore` | carnivore 本就指吃肉，herbivore 本就指吃草 |
| 跨句法边界 | `let scores plummet`、`shows deep regard`、`refuses any shipment` | 拖上了主语/助动词，换个人称就得改 |
| 临时副词/限定词 | `quickly diagnose weak points`、`followed every convention`、`every past stricture` | 去掉副词才是可套用的搭配；副词只属于那一句 |
| 偶然相邻的描述堆叠 | `white farm goose`、`bitter skin`、`tiny lawn`（原句中心词其实是 edge） | 只是那一句里恰好挨着，不是习惯搭配 |
| 依赖上下文的片段 | `render hard lessons`（原句 render hard lessons simple） | 少了宾补就不成话 |
| 具体数字/专名 | `ninety degrees fahrenheit`、`astronaut hat` | 不可迁移 |

## 容易被误砍、应当 keep 的几类（别过度杀）

- **动宾搭配**：`erase wrong answers`、`pronounce new words`、`recite new terms`、`spill cold water`、`weld chair legs`
- **习惯形名搭配**：`quick snack`、`empty stomach`、`high altitude`、`green alga`、`steel tools`、`chess game`
- **名介结构**：`stand adjacent to`、`take steps`

判不准时问自己一句：**把它写进教材，学生照抄会不会说错英语？** 会 —— drop；不会 —— keep。
