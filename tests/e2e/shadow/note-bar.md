# Note bar under sentences, 辨析表挂段末

## Summary
Verifies the two different note placements: 词级笔记（同义词 / 词伙）仍插在**句子下面**；结构化**辨析表**（`note.type === 'compare'`）插在**段落末尾**、默认只露一行、点开才出对比表，且一组只挂一处。句子无笔记则句下不插卡；卡片里的词头是纯文本不可点，正文里的词点击仍开单词弹窗。

2026-09-20 改：辨析表原先挂句下，本书近义词是"同段共现"而非同句（135/308 段 vs 67/1833 句），挂句下会把一张表按成员重复几遍；实测 51 个段落要挂 2–5 组，句下没有稳定位置。PRD §7.2 定的是"一段一张、默认一行、点开才出表"。

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow

## Before Hook

### Setup 1. Open the app
Navigate to `{E2E_BASE_URL}/index.html`.
**Verify:** `.sent` first is visible.

## Test Steps

### 1. 词级笔记仍挂在句子下面
Find the first `.notebar` containing `heavy traffic`（`traffic` 卡的同义词 + 词伙；该词全书出现两句，取第一处）。
**Verify:** 卡存在；`.nb-t` 含 `traffic`；`.nb-n` 含 `同义词`。

### 2. Sentences without noted words have no card
Each sentence-level `.notebar` must follow `.sent`/`.sent-zh` (or another `.notebar` when one sentence holds several noted words); sampled plain sentences have no `.notebar` after them.
**Verify:** structural check passes.

### 3. 辨析表挂段末、默认折叠、一组只挂一处
Find `.cmp-card[data-grp="curse-swear"]`（`curse`/`swear` 同句共现于第 6 章）。
**Verify:** 卡片不在任何 `.para` 里面（是段落的兄弟节点），且它所在的 `.cmp-block` 前面紧邻 `.para-zh`（不打断正文与译文）；`.cmp-body` 计算样式 `display: none`；整页该 `data-grp` 只出现 **1** 次；折叠行里能看到「简单记」那半句 `curse = 诅咒`。

### 4. 点一下出对比表，再点收回
Click that card's `.cmp-head`.
**Verify:** `.cmp-body` 变为可见且里面有 `.nb-table`；再点一次收回。

### 5. Card word is plain text, not clickable
Click `.notebar .nb-w` inside the traffic card.
**Verify:** card contains no `.w` element; `#pop` stays hidden.

### 6. Sentence word still opens popup
Click `.sent .w[data-w="traffic"]` in the sentence body.
**Verify:** `#pop` is visible and `#pw` shows the word.

**Pass condition:** 词级笔记在句下、辨析表在段末且默认折叠一组一处，点击可展开/收回，卡片词不可点、正文词可点。

## After Hook

### Teardown 1. Dismiss popup
Press Escape.
