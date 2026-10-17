#!/usr/bin/env python3
"""生成词伙表数据 data/collocations.json：3.0 全部条目，标注是否被课文覆盖。
已覆盖（能挂到目标词）排前面，未覆盖排最后（前端置灰）。
"""
import json, re, os, collections

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
V = json.load(open(os.path.join(ROOT, 'data/vocab.json'), encoding='utf-8'))
P = json.load(open(os.path.join(ROOT, 'work/colloc-zh/book_pairs_v30.json'), encoding='utf-8'))
OUT = os.path.join(ROOT, 'data/collocations.json')

STOP = set('the a an to of in on for and or at by with is are be as it that this some any no not from into over under than then so but very too also just can could may might will would shall should do does did have has had'.split())
heads = {w.lower(): w for w in V}

def stem(t):
    for suf in ('ies', 'ing', 'ed', 'es', 's'):
        if len(t) > len(suf) + 3 and t.endswith(suf):
            return t[:-len(suf)]
    return t

def variants(t):
    vs = {t, t[:-1] if t.endswith('e') else t + 'e'}
    if t.endswith('y'):
        vs.add(t[:-1] + 'i')
    return vs

rows = []
for en, zh in P:
    toks = [x for x in re.findall(r"[a-z][a-z'\-]*", en.lower()) if x not in STOP]
    got = []
    for t in toks:
        for v in variants(stem(t)):
            if v in heads:
                got.append(heads[v]); break
    got = list(dict.fromkeys(got))
    rows.append({'e': en, 'z': zh, 'w': got, 'c': 1 if got else 0})

rows.sort(key=lambda r: (0 if r['c'] else 1))   # 稳定排序：两组内部保持书内顺序
cov = sum(1 for r in rows if r['c'])
json.dump(rows, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('总条数', len(rows), '| 已覆盖', cov, '| 未覆盖', len(rows) - cov, '| 字节', os.path.getsize(OUT))
