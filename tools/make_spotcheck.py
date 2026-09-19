#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""给用户抽查用的清单：把这一批要落地的内容按"最可能出错"的顺序摊开。

抽查是三道门的最后一道，但上一轮它是靠人从 2445 条里瞎翻 —— 翻到的基本都是
"看着顺眼"的那种，恰恰白翻。这里按风险排序挑，规则都是能被机械算出来的：

  1 两层否决意见不一致的（门禁 2 说留、成品专判说砍，或反过来）—— 判据本身在打架
  2 代理改过形的（交回的是候选截断，不是原候选）—— 手一抖就不是原话了
  3 同义词段（只有 40 来条，且 M/R 两种出处都可能串义项）
  4 本轮新增词头（新词的整卡内容都是第一次上线）
  5 一条卡里塞了 3 条词伙的（名额用满的更容易是硬凑）
"""
import json
import re
import sys

ROOT = '/Users/zhoupeng/Library/Mobile Documents/com~apple~CloudDocs/雅思背单词项目'
MARK = re.compile(r'\[\[([^\]:]+):([^\]]+)\]\]')
SRC = {'M': '同义替换资料', 'R': '反向索引', 'B': '词伙书', 'T': '课文原句', 'F': '无出处'}


def main():
    clean = json.load(open(ROOT + '/work/cardgen/clean.json', encoding='utf-8'))
    cand = json.load(open(ROOT + '/work/cardgen/cand.json', encoding='utf-8'))
    rev = json.load(open(ROOT + '/work/cardgen/reviewed.json', encoding='utf-8'))
    V = json.load(open(ROOT + '/shadow/data/vocab.json', encoding='utf-8'))
    new = {m.group(1) for m in re.finditer(r"id: 'ins-\d+-new-([a-z ]+)'",
                                           open(ROOT + '/shadow/index.html', encoding='utf-8').read())}
    rows = []
    for e in clean:
        w = e['w']
        r = rev.get(w) or {}
        keep_syn = [x['s'] for x in e['syn'] if (r.get('syn') or {}).get(x['s'], 'keep') == 'keep']
        keep_col = [x['c'] for x in e['col'] if (r.get('col') or {}).get(x['c'], 'keep') == 'keep']
        if not (keep_syn or keep_col):
            continue
        risk = []
        for x in e['col']:
            if x['c'] not in [c['c'] for c in (cand.get(w) or {}).get('col', [])]:
                risk.append('改形:' + x['c'])
                break
        if len(keep_col) > len(e['col']) - 1 and any(
                (r.get('col') or {}).get(x['c'], 'keep') == 'drop' for x in e['col']):
            risk.append('两层否决不一致')
        if keep_syn:
            risk.append('同义词')
        if w in new:
            risk.append('本轮新词')
        if len(keep_col) >= 3:
            risk.append('词伙用满 3 条')
        rows.append({'w': w, 'm': (V.get(w) or {}).get('m', ''), 'syn': keep_syn,
                     'col': keep_col, 'risk': risk, 'src': (e['col'] or [{}])[0].get('src', '?')})
    rows.sort(key=lambda x: -len(x['risk']))
    out = [f'# 本轮抽查清单（{len(rows)} 张卡要落地，按风险排序挑 60 条）\n',
           '看的时候只问一句：**这个词放到这张卡的义项下，学生照抄会不会说错？**\n',
           '风险标签含义：`改形`=代理把候选掐头去尾过；`两层否决不一致`=审核与专判打架；'
           '`同义词`=只有同义替换这一种依据；`本轮新词`=新加进课文的词。\n']
    for x in rows[:60]:
        out.append(f"- **{x['w']}** {x['m'][:26]}｜{'、'.join(x['risk']) or '常规'}")
        if x['syn']:
            out.append(f"  - 同义词：{', '.join(x['syn'])}")
        for c in x['col']:
            out.append(f"  - 词伙：{c}（{SRC.get(x['src'], x['src'])}）")

    # 同义词单向：A 卡列了 B，但 B 卡没列 A（或反过来本轮被否）。
    # 大多数是义项方向不同（alarm 作名词=warning 成立、warn 作动词≈alarm 使惊恐不成立），
    # 不一定是错，但他抽查时最好知道哪些是单向的，别以为两张卡对称。
    one_way = []
    for x in rows:
        for s in x['syn']:
            back = (V.get(s) or {}).get('note') or ''
            m = re.search(r'同义词：([^\n；]+)', back)
            lst = [t.strip() for t in (m.group(1).split(',') if m else [])]
            if x['w'] not in lst and s in V:
                one_way.append((x['w'], s))
    if one_way:
        out.append(f"\n## 同义词单向（{len(one_way)} 对，A 卡列了 B、B 卡没列回 A）\n")
        out.append('多数是义项方向不同，不等于错；抽查时按「这两张卡说的是不是同一个意思」看。\n')
        for a, b in one_way:
            out.append(f"- {a} → {b}（{b} 卡未列回 {a}）")
    p = ROOT + '/work/cardgen/抽查清单-本轮.md'
    open(p, 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    print(f'{len(rows)} 张卡有内容可落地；清单写到 work/cardgen/抽查清单-本轮.md（前 60 条按风险排）')
    tag = sum(1 for x in rows if x['risk'])
    print(f'带风险标签的 {tag} 张，其中改形 {sum(1 for x in rows if any(t.startswith("改形") for t in x["risk"]))} 张、'
          f'同义词单向 {len(one_way)} 对')
    return 0


if __name__ == '__main__':
    sys.exit(main())
