#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把第二轮捞回的结果并回第一轮 got/<片号>.json，让门禁 1 只看一份完整交件。

分两份文件写是因为代理交件按片号一一对应，第二轮的片号和第一轮不是一套；
并回来后仍然要逐条回查候选，所以合并只做「补空位」，不做覆盖：
第一轮已经判 keep 的排在前面，捞回的都往后追加，每栏最多 3 条（和门禁 1 的上限一致）。
"""
import glob
import json
import os
import sys

ROOT = '/Users/zhoupeng/Library/Mobile Documents/com~apple~CloudDocs/雅思背单词项目'
CAP = 3


def main():
    dry = '--apply' not in sys.argv
    # 片号 → 该片的词头顺序，第二轮的条目要落回原来的片
    home = {}
    for nf in sorted(glob.glob(ROOT + '/work/cardgen/need/*.json')):
        sid = nf.split('/')[-1][:-5]
        if sid.startswith('_'):
            continue
        for r in json.load(open(nf, encoding='utf-8')):
            home[r['w']] = sid
    added = {}
    for rf in sorted(glob.glob(ROOT + '/work/cardgen/refix_out/*.json')):
        for x in json.load(open(rf, encoding='utf-8')):
            w = str(x.get('w', '')).lower()
            if w not in home:
                print(f'!! {w} 不在任何送审片里，跳过')
                continue
            added.setdefault(home[w], {}).setdefault(w, {'syn': [], 'col': []})
            for k in ('syn', 'col'):
                for v in x.get(k) or []:
                    if v and v not in added[home[w]][w][k]:
                        added[home[w]][w][k].append(v)
    n_syn = n_col = 0
    for sid, rows in added.items():
        p = f'{ROOT}/work/cardgen/got/{sid}.json'
        got = json.load(open(p, encoding='utf-8'))
        idx = {str(x.get('w', '')).lower(): x for x in got}
        for w, extra in rows.items():
            cur = idx.get(w)
            if cur is None:
                print(f'!! {sid} 里没有 {w}，跳过')
                continue
            for k in ('syn', 'col'):
                have = [v for v in (cur.get(k) or []) if v]
                for v in extra[k]:
                    if len(have) >= CAP:
                        break
                    if v not in have:
                        have.append(v)
                        n_syn += k == 'syn'
                        n_col += k == 'col'
                cur[k] = have
        if not dry:
            json.dump(got, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'捞回涉及 {len(added)} 片、{sum(len(v) for v in added.values())} 个词头，'
          f'追加同义词 {n_syn} 条、词伙 {n_col} 条' + ('（干跑，未写文件）' if dry else '，已并回 got/'))
    return 0


if __name__ == '__main__':
    sys.exit(main())
