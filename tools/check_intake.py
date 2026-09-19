#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""收件核验：子代理交回的 got/*.json 结构上对不对。

这是门禁 1（validate_card_patch.py）之前的**收货检查**，只看形式不看语义：
条数齐不齐、有没有重复、有没有缺条、字符串是否逐字来自该片候选、单卡有没有超 3 条。
语义审核是门禁 2 的事；这里查出问题说明代理没照规则干活，整片打回重跑。
"""
import json
import os
import sys

ROOT = '/Users/zhoupeng/Library/Mobile Documents/com~apple~CloudDocs/雅思背单词项目'
CAP = 3


def check(sid, verbose=True):
    need_p = f'{ROOT}/work/cardgen/need/{sid}.json'
    got_p = f'{ROOT}/work/cardgen/got/{sid}.json'
    need = json.load(open(need_p, encoding='utf-8'))
    if not os.path.exists(got_p):
        return (sid, 0, 0, '未交回', [])
    got = json.load(open(got_p, encoding='utf-8'))
    nw = {r['w'].lower(): r for r in need}
    gw = [str(x.get('w', '')).lower() for x in got]
    problems = []
    free_per_head = {}
    for w in set(gw):
        if w not in nw:
            problems.append(f'越权词头 {w}')
    for w in set(nw) - set(gw):
        problems.append(f'缺条 {w}')
    if len(gw) != len(set(gw)):
        problems.append(f'重复词头 {len(gw) - len(set(gw))} 个')
    ns = nc = 0
    for x in got:
        w = str(x.get('w', '')).lower()
        r = nw.get(w)
        if not r:
            continue
        syn = [str(s).lower() for s in (x.get('syn') or [])]
        col = [str(c).lower() for c in (x.get('col') or [])]
        ns += len(syn)
        nc += len(col)
        if len(syn) > CAP:
            problems.append(f'{w} syn 超 {CAP} 条')
        if len(col) > CAP:
            problems.append(f'{w} col 超 {CAP} 条')
        for v in syn:
            if v not in r['syn']:
                free_per_head.setdefault(w, []).append(v)
        for v in col:
            if v not in r['col']:
                problems.append(f'{w} col 越界候选（词伙不许自由作答）{v}')
    if any(len(x) > 1 for x in free_per_head.values()):
        problems.append('自由作答同义词超过 1 个/词：' + ', '.join(
            f'{k}→{v}' for k, v in free_per_head.items() if len(v) > 1))
    empty = sum(1 for x in got if not (x.get('syn') or x.get('col')))
    if verbose:
        print(f'{sid:<9} 输入 {len(need):>3} 输出 {len(got):>3} | syn {ns:>3} col {nc:>3} | 交空 {empty:>3} | '
              + ('OK' if not problems else f'★ {len(problems)} 处问题'))
        for p in problems[:6]:
            print('    ', p)
    return sid, ns, nc, ('OK' if not problems else 'BAD'), problems


def main():
    args = sys.argv[1:]
    sids = args or sorted(f.split('.')[0] for f in os.listdir(ROOT + '/work/cardgen/need')
                          if f.endswith('.json') and not f.startswith('_'))
    bad = tot_syn = tot_col = n = 0
    for sid in sids:
        _, ns, nc, st, probs = check(sid)
        n += 1
        tot_syn += ns
        tot_col += nc
        if st == 'BAD':
            bad += 1
    print(f'\n{n} 片 | 同义词 {tot_syn} 条、词伙 {tot_col} 条 | 有问题的片 {bad}')
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
