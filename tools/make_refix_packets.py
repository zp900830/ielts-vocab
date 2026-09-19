#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把「有候选但代理一条没交回」的词头挑出来，生成第二轮捞回包。

为什么要第二轮：裁决代理按"偶然相邻就砍"收得太狠 —— 形容词+名词的描写短语
（kind physician、manly courage、soft acupuncture）英语本身没错，学生照抄不会说错，
用户 2026-09-19 已经为这一类翻过一次案（206 条 lowvalue 全数放回）。
所以第一轮的空白不等于"没有合格候选"，得单独再走一遍，判据换成只剩一条：
**换个句子套不上、或套上去就是错的** 才砍。

包里的每一行都带上候选在原句里的那一句，让代理看着句子判，而不是看切片猜。
"""
import glob
import json
import os
import re
import sys

ROOT = '/Users/zhoupeng/Library/Mobile Documents/com~apple~CloudDocs/雅思背单词项目'
sys.path.insert(0, ROOT + '/tools')
from validate_card_patch import trim_match  # noqa: E402
from make_review_packets import locate, strip_to_key  # noqa: E402

MARK = re.compile(r'\[\[([^\]:]+):([^\]]+)\]\]')


bare_s = lambda s: MARK.sub(lambda m: m.group(2), s)


def main():
    per = int(sys.argv[1]) if len(sys.argv) > 1 else 130
    tag = sys.argv[2] if len(sys.argv) > 2 else 'a'
    # 第一轮代理是分批交回的，捞回也分批跑：第三批用 --only 只挑新到的那几片
    only = set()
    if '--only' in sys.argv:
        only = set(sys.argv[sys.argv.index('--only') + 1].split(','))
    V = json.load(open(ROOT + '/shadow/data/vocab.json', encoding='utf-8'))
    D = json.load(open(ROOT + '/shadow/data/sections.json', encoding='utf-8'))
    sentences = [(bare_s(en), strip_to_key(en),
                  (D[ci]['sentZh'][si][k] if k < len(D[ci]['sentZh'][si]) else ''))
                 for ci, c in enumerate(D) for si, p in enumerate(c['paragraphs'])
                 for k, en in enumerate(p)]
    empty, partial = [], []
    for nf in sorted(glob.glob(ROOT + '/work/cardgen/need/*.json')):
        sid = nf.split('/')[-1][:-5]
        if sid.startswith('_') or (only and sid not in only):
            continue
        gf = f'{ROOT}/work/cardgen/got/{sid}.json'
        if not os.path.exists(gf):
            continue            # 这片还没交回，不能按「全空」算，否则会把整片误当捞回对象
        got = {str(x.get('w', '')).lower(): x for x in json.load(open(gf, encoding='utf-8'))}
        for r in json.load(open(nf, encoding='utf-8')):
            w = r['w']
            g = got.get(w) or {}
            gave_syn = [s for s in (g.get('syn') or []) if s]
            gave_col = [c for c in (g.get('col') or []) if c]
            miss_syn = [s for s in r['syn'] if s not in gave_syn] if r['need_syn'] else []
            miss_col = ([c for c in r['col'] if trim_match(c, gave_col) is None and c not in gave_col]
                        if r['need_col'] else [])
            if not (miss_syn or miss_col):
                continue
            row = {'w': w, 'm': (V.get(w) or {}).get('m', ''), 'syn': miss_syn, 'col': miss_col,
                   'ctx': [locate(c, sentences)[0] for c in miss_col[:2]]}
            (empty if not (gave_syn or gave_col) else partial).append(row)
    out = empty + partial
    p = f'{ROOT}/work/cardgen/refix'
    os.makedirs(p, exist_ok=True)
    # 只清自己这一批的包：第一轮代理是分批交回的，捞回也要分批跑，不能互相抹掉
    for f in glob.glob(f'{p}/rf{tag}*'):
        os.remove(f)
    for i in range(0, len(out), per):
        sid = f'rf{tag}{i // per + 1:02d}'
        chunk = out[i:i + per]
        with open(f'{p}/{sid}.txt', 'w', encoding='utf-8') as fh:
            for r in chunk:
                fh.write(f"{r['w']}|{r['m'][:30]}|syn[{','.join(r['syn'])}]"
                         f"|col[{','.join(r['col'])}]\n")
                for c in r['ctx']:
                    if c:
                        fh.write(f"    原句：{c}\n")
        json.dump([{k: v for k, v in r.items() if k != 'ctx'} for r in chunk],
                  open(f'{p}/{sid}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'第一轮整片交空 {len(empty)} 个词头、漏交部分候选 {len(partial)} 个 → 捞回包 {len(out)} 行，'
          f'切 {(len(out) + per - 1) // per} 份（每份≈{per}）')
    return 0


if __name__ == '__main__':
    sys.exit(main())
