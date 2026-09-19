#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""「行内词义显示的第一个义项，是不是这句话里实际用到的那个意思」的可机器判定部分。

原理：行内词义是按「词」渲染的（glossHTML(data-w)），同一个词在书里被标成名词用法
和动词用法时只能显示同一份释义。所以只要 (a) 词典首项词性与句中形态冲突，
(b) 而词条里其实有对得上的其它义项，就能确定这句话下面那行小字说的是别的意思。

形态线索是启发式的，命中后仍需人工/子代理看语境；但「首项词性 ≠ 句中判定的词性」
这条足以把嫌疑池从 4045 处压到很小。

用法：python3 tools/sense_in_context.py [--dump 前缀]
"""
import json
import re
import sys
import collections

MPOS = [('noun', r'^\s*n\.'), ('verb', r'^\s*v\.'), ('adj', r'^\s*a\.'), ('adv', r'^\s*ad\.'),
        ('prep', r'^\s*prep'), ('conj', r'^\s*conj'), ('pron', r'^\s*pron'), ('num', r'^\s*num')]
IPOS = r'^\s*([nva]|ad|prep|conj|pron|num|art|int|aux|vt|vi)\.?'


def sense_pos(m):
    """把 'n. 大气；v. 气氛' 切成义项段并给每段打词性。"""
    parts, pos = [], []
    head = re.match(IPOS, m)
    cur_p = None
    for seg in re.split(r'[；;]', m):
        seg = seg.strip()
        if not seg:
            continue
        g = re.match(IPOS, seg)
        if g:
            t = g.group(1)
            cur_p = {'n': 'noun', 'v': 'verb', 'vt': 'verb', 'vi': 'verb', 'a': 'adj', 'ad': 'adv',
                     'prep': 'prep', 'conj': 'conj', 'pron': 'pron', 'num': 'num'}.get(t, 'other')
        parts.append(seg)
        pos.append(cur_p)
    return parts, pos


def infer_pos(vis, disp, following):
    """从句中位置猜这个词在这里的词性。返回 (guess, evidence) 或 None。"""
    d = disp.lower()
    i = following.lower().find(d)
    if i < 0:
        return None
    before = following[:i].rstrip()
    after = following[i + len(d):].lstrip()
    b_words = before.split()
    b_last = b_words[-1] if b_words else ''
    a_first = re.match(r"[a-z']+|(.)", after).group(0) if after else ''
    if re.search(r'\b(the|a|an|this|that|these|those|my|his|her|its|our|their|some|any|no|every|each|one|two|several|many|few|another|other)\s+$', before.lower()):
        return 'noun', f'前面是限定词 {b_last}'
    if re.search(r'\b(of|in|on|at|to|for|with|from|by|as)\s+$', before.lower()) and not re.search(r'\bto\s+$', before.lower()):
        return 'noun', f'前面是介词 {b_last}'
    if re.search(r'\b(is|are|was|were|be|been|being|looks|looked|seems|seem|become|became)\s+$', before.lower()):
        return 'adj', f'前面是系动词 {b_last}'
    if re.search(r'\b(to|will|would|can|could|should|must|may|might|does|did|do|have|has|had)\s+$', before.lower()):
        return 'verb', f'前面是 {b_last}'
    if re.search(r'\b(has|have|had)\s+$', before.lower()):
        return 'verb', '前面是完成助动词'
    if d.endswith('ing') and re.search(r'\b(is|are|was|were)\s+$', before.lower()):
        return 'verb', '进行时'
    if re.match(r'^(that|which|who|whose)\b', after):
        return 'verb', '后面接关系代词'
    return None


def main():
    dump = None
    if '--dump' in sys.argv:
        dump = sys.argv[sys.argv.index('--dump') + 1]
    D = json.load(open('shadow/data/sections.json', encoding='utf-8'))
    V = json.load(open('shadow/data/vocab.json', encoding='utf-8'))
    stat = collections.Counter()
    rows, per_chap = [], collections.defaultdict(list)
    gi = 0
    for ci, c in enumerate(D):
        for si, para in enumerate(c['paragraphs']):
            for k, sent in enumerate(para):
                # 判定词性必须用剥掉 [[key:disp]] 标记后的裸文本，
                # 否则上下文尾部是 "]]" 这种符号，限定词/介词的锚点正则永远匹配不上
                vis = re.sub(r'\[\[([^\]:]+):([^\]]+)\]\]', r'\2', sent)
                for key, disp in re.findall(r'\[\[([^\]:]+):([^\]]+)\]\]', sent):
                    key = key.lower()
                    e = V.get(key)
                    if not e or not e.get('m'):
                        stat['词条缺释义'] += 1
                        continue
                    parts, pos = sense_pos(e['m'])
                    first = pos[0] if pos else None
                    guess = infer_pos(vis, disp, vis)
                    stat['句中词性可判' if guess else '句中词性判不出'] += 1
                    if not guess or not first or first == guess[0]:
                        continue
                    alt = [p for p, pp in zip(parts, pos) if pp == guess[0]]
                    stat[f'首项 {first} vs 句中 {guess[0]}'] += 1
                    if not alt:
                        stat['  其中词条里根本没有该词性的义项（释义覆盖不全）'] += 1
                    r = dict(gi=gi, ch=ci, para=si, sent=k, key=key, disp=disp,
                             en=vis, zh=c['sentZh'][si][k], m=e['m'],
                             first_pos=first, guess=guess[0], why=guess[1],
                             alt_sense='；'.join(alt) if alt else '')
                    rows.append(r)
                    per_chap[ci].append(r)
                gi += 1
    for kk, v in stat.most_common():
        print(f'  {v:5d}  {kk}')
    print(f'\n首项词性与句中判定冲突：{len(rows)} 处，涉及 {len({r["key"] for r in rows})} 个不同的词')
    by = collections.Counter(f'{r["first_pos"]}→{r["guess"]}' for r in rows)
    for kk, v in by.most_common():
        print(f'  {v:5d}  {kk}')
    print('\n样例 20 条：')
    for r in rows[:20]:
        print(f'  #{r["gi"]} {r["disp"]}（{r["why"]}，句中判为 {r["guess"]}）词条首项 {r["first_pos"]}「{r["m"][:38]}」'
              f'｜该句义项应为「{r["alt_sense"][:28] or "词条里没有"}」')
        print(f'       {r["en"][:100]}')
    if dump:
        for ci, lst in per_chap.items():
            json.dump(lst, open(f'{dump}{ci}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
            print(f'已写 {dump}{ci}.json：{len(lst)} 条')
        json.dump(rows, open(f'{dump}all.json', 'w', encoding='utf-8'), ensure_ascii=False)


if __name__ == '__main__':
    main()
