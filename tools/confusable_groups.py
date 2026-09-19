#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""量「辨析组」的资产底座：哪些词在中文义项上看着一样、其实不能互换。

挖空题的选项只能从「同一个语义场、但互换会说错」的词里取，所以一期做多少组辨析卡、
出题引擎能覆盖多少目标词，都取决于这里算出来的数。改口径就重跑，PRD 里的数字以本脚本输出为准。

  python3 tools/confusable_groups.py [--json out.json]

口径：
  边 = 两个在课文里真被标为可点目标词的词头，中文义项有重叠，但**没有**互相列进「同义词：」段。
  （互相列为同义词的是黑名单：空格里填哪个都算对，拿来做选项就是出错题，见 PRD 5.3 第 1 层。）
  组 = 该边图的连通分量，成员数 ≥ 2。
"""
import argparse
import collections
import json
import re
import sys

ROOT = '/Users/zhoupeng/Library/Mobile Documents/com~apple~CloudDocs/雅思背单词项目'
POS = r'(?:n|v|vt|vi|adj|adv|prep|conj|pron|num|int|art|aux|abbr)\.'
STOP_SENSE = {'的', '地', '得', '东西', '样子', '情况', '时候', '人', '事物'}


def senses(m):
    """'n. 大群人；v. 挤满' -> {'大群人', '挤满'}"""
    out = set()
    for part in re.split(r'[；;]', str(m or '')):
        part = re.sub(POS, '', part, flags=re.I).strip(' ，,。')
        for x in re.split(r'[,，/、]', part):
            x = x.strip().strip('的')
            if len(x) >= 2 and x not in STOP_SENSE:
                out.add(x)
    return out


def segs(note):
    s, c = [], []
    for p in re.split('；', str(note or '')):
        p = p.strip()
        if p.startswith('同义词：'):
            s += [x.strip().lower() for x in p[4:].split(',') if x.strip()]
        elif p.startswith('词伙：'):
            c += [x.strip() for x in p[3:].split(',') if x.strip()]
    return s, c


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--json')
    args = ap.parse_args()
    V = json.load(open(ROOT + '/shadow/data/vocab.json', encoding='utf-8'))
    S = json.load(open(ROOT + '/shadow/data/sections.json', encoding='utf-8'))
    sents = [x for a in S for p in a['paragraphs'] for x in p]

    key_of = {k.lower(): k for k in V}
    key_of.update({k.lower().replace('-', ' '): k for k in V})
    in_text, chap, marks = collections.defaultdict(int), {}, 0
    cum, n = [], 0
    for a in S:
        k = sum(len(p) for p in a['paragraphs'])
        cum.append((n, n + k - 1))
        n += k
    for gi, s in enumerate(sents):
        for mm in re.finditer(r'\[\[([^\]:]+):', s):
            w = mm.group(1).strip().lower()
            in_text[w] += 1
            marks += 1
            for ci, (a_, b_) in enumerate(cum):
                if a_ <= gi <= b_:
                    chap.setdefault(w, set()).add(ci)
                    break

    syn, col, sen = {}, {}, {}
    for k in V:
        kk = k.lower()
        s, c = segs(V[k].get('note'))
        syn[kk] = set(s)
        col[kk] = c
        sen[kk] = senses(V[k].get('m'))
    # 义项归一：把「窥视」和「偷看」这类近形合并靠包含关系，不做语义推断
    pool = [w for w in in_text if w in key_of]
    by_sense = collections.defaultdict(set)
    for w in pool:
        for x in sen[w]:
            by_sense[x].add(w)

    edges = set()
    for x, ws in by_sense.items():
        for a in ws:
            for b in ws:
                if a < b:
                    edges.add((a, b, x))
    # 黑名单：互相列进同义词段的，不做易混边（填哪个都对 → 出成题就是错题）
    conf = {}
    for a, b, x in edges:
        if b in syn[a] or a in syn[b]:
            continue
        conf.setdefault((a, b), set()).add(x)
    banned = sum(1 for a, b, x in edges if b in syn[a] or a in syn[b])

    dsu = {w: w for w in pool}

    def find(x):
        while dsu[x] != x:
            dsu[x] = dsu[dsu[x]]
            x = dsu[x]
        return x

    for (a, b) in conf:
        ra, rb = find(a), find(b)
        if ra != rb:
            dsu[ra] = rb
    comp = collections.defaultdict(set)
    for (a, b) in conf:
        r = find(a)
        comp[r] |= {a, b}
    groups = [sorted(g) for g in comp.values() if len(g) >= 2]
    groups.sort(key=lambda g: (-len(g), g[0]))

    # 传递闭包会把只沾一个义项的词链成几十个大团（噪声），所以另出一个更硬的视图：
    # 「义项桶」= 同一个中文义项下直接互见的 2~6 个词，组内两两都满足口径，不做链式合并。
    buckets = {}
    for x, ws in by_sense.items():
        g = {a for a in ws if a in key_of}
        for a in g:
            for b in g:
                if a < b and (a, b) in conf:
                    buckets.setdefault(x, set()).update((a, b))
    usable = {x: sorted(g) for x, g in buckets.items() if 2 <= len(g) <= 6}
    in_bucket = {w for g in usable.values() for w in g}
    # 辨析组的成员不限于 3245 张卡：fog / haze / smoke 这种简单词没卡但更该辨析。
    # 统计课文里词形出现 ≥2 次、却没有卡的词，就是「要加可点标记的简单词」池子。
    simple = collections.Counter()
    for s in sents:
        bare = re.sub(r'\[\[([^\]:]+):[^\]]*\]\]', r'\1', s)
        for t in re.findall(r"[a-zA-Z][a-zA-Z'’-]{2,}", bare.lower()):
            simple[t.replace('-', ' ')] += 1
    nocard = {t: c for t, c in simple.items() if c >= 2 and t not in key_of}
    covered = {w for g in comp.values() for w in g if len(g) >= 2}
    both_col = sum(1 for a, b in conf if col[a] and col[b])
    same_chap = sum(1 for (a, b) in conf if chap.get(a, set()) & chap.get(b, set()))
    # 例句与课文两个语境（挖空题要能在卡上例句里二次验证）
    def loose(w):
        return r'(?<![a-z])' + re.escape(w) + r'[a-z]{0,4}(?![a-z])'
    eg_missing, two_ctx = [], 0
    for k in V:
        kk = k.lower()
        ex = str(V[k].get('ex') or '')
        has_ex = bool(ex.strip())
        in_tx = kk in in_text
        if has_ex and in_tx:
            two_ctx += 1
            if not re.search(loose(kk), ex.lower()):
                eg_missing.append(kk)
    with_col = sum(1 for k in V if segs(V[k].get('note'))[1])
    with_syn = sum(1 for k in V if segs(V[k].get('note'))[0])
    have_compare = [k for k in V if isinstance(V[k].get('note'), dict)]

    print(f'句 {len(sents)} · 可点标记 {marks} · 卡 {len(V)}（有词伙 {with_col} / 有同义词 {with_syn} / 辨析 {len(have_compare)}）')
    print(f'课文里真出现过的目标词头 {len(pool)}')
    print(f'易混边（义项重叠且未互相列为同义词） {len(conf)} 对；同义词黑名单拦掉 {banned} 条边')
    print(f'  ├ 两侧都有词伙 {both_col} 对 · 同章出现 {same_chap} 对')
    print(f'辨析组（连通分量 ≥2） {len(groups)} 组，覆盖 {len(covered)} 个词头 = {len(covered)/len(V)*100:.1f}% 的卡')
    print(f'  └ 链式合并会把只沾一个义项的词连成大团，最大 {max(len(g) for g in groups) if groups else 0} 词，仅作上界参考')
    print(f'义项桶（同义项直接互见 2~6 词，一期可做的组） {len(usable)} 个，覆盖 {len(in_bucket)} 个词头 = {len(in_bucket)/len(V)*100:.1f}%')
    top = sorted(usable.items(), key=lambda kv: -len(kv[1]))[:12]
    for x, g in top:
        print(f'    {x}: {" ".join(g)}')
    print(f'课文中出现 ≥2 次但没有卡的简单词（辨析组要收、且要么加可点标记要么只做纯文本选项） {len(nocard)} 个')
    print(f'  高频示例: ' + ' '.join(f'{t}×{c}' for t, c in sorted(nocard.items(), key=lambda kv: -kv[1])[:16]))
    print(f'两语境（卡上有例句且课文里有标记） {two_ctx}/{len(V)}')
    print(f'其中例句没写出词头本体 {len(eg_missing)} 张: ' + ' '.join(eg_missing[:30]))
    if args.json:
        json.dump({'groups': groups, 'pairs': sorted(conf), 'eg_missing': eg_missing},
                  open(args.json, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    return 0


if __name__ == '__main__':
    sys.exit(main())
