# 行内词义按这句的词性选义项
<!-- status: compiled | spec: playwright-tests/journeys/shadow/gloss-context.spec.ts | date: 2026-09-19 -->

## Summary
行内小字以前按「词」显示第一条义项，同一个词既当名词又当动词时必有一半句子显示错意思。
现在改成按这句话选义项（只用高置信线索：情态动词后=动词、系动词后=形容词、
限定词后紧跟实词=前置定语不切换），并且不再把「复数词形 / 现在分词词形」这类占位义项端给学生。

## Preconditions
- **Standard shadow preconditions**；Environments: local, preview；Markers: @regression @positive @shadow

## Test Steps

### 1. 同一句里同形异性的两个词各得其所
「The barn stood **stable** and the **stable** doors stayed open」——第一个是形容词，第二个是名词。
**Verify:** 第一个 stable 的小字含「稳定」，第二个含「马厩」。

### 2. 情态动词后的动词不再显示名词义
「hoping to **trace** the **leak**」与「until the **fire** …」。
**Verify:** trace 显示「追踪」（不是「痕迹」）、fire 显示「火」（不是「解雇」）。

### 3. 系动词后的形容词
「her liver looked **fine**」。**Verify:** 显示「很好」而非「罚款」。

### 4. 占位义项不再出现在小字里
全库扫一遍所有 `.gl`。
**Verify:** 没有任何小字含「复数词形」「现在分词词形」「过去式」；也没有该有释义的词丢了小字。

### 5. 以 -ly 结尾的形容词不被当成副词
「sharing **monthly** drawings」里的 monthly 修饰 drawings，是形容词而不是副词。
**Verify:** monthly 的小字含「每月的」，不是「每月一次」。

**Pass condition:** 五条全过，且相对旧渲染被改写的处数 ≤ 60（这条规则必须保守，宁可不换也别换错）。
