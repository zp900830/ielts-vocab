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

    # 组内必须**两两都过黑名单**（团 / clique），不能靠共享义项做并集 ——
    # 并集会让 damp↔humid 这种互为同义词的对子顺着第三条边混进组里，正是要禁的那类。
    adj = collections.defaultdict(set)
    for (a, b) in conf:
        adj[a] |= {b}
        adj[b] |= {a}

    def cliques(nodes):
        """Bron–Kerbosch：只回极大团（组内两两都是易混边）。节点 ≤12，不加速也够快"""
        out = []

        def bk(r, pc, x):
            if not pc and not x:
                if len(r) >= 2:
                    out.append(frozenset(r))
                return
            for v in sorted(pc, key=lambda w: -len(adj[w] & pc)):
                bk(r | {v}, pc & adj[v], x & adj[v])
                pc = pc - {v}
                x = x | {v}
        bk(set(), set(nodes), set())
        return out

    usable, big_sense = {}, 0
    for x, ws in by_sense.items():
        g = {a for a in ws if a in key_of}
        if len(g) > 12:
            big_sense += 1
            continue                      # 一个义项挂十几个词，多半是通用释义，不作为组来源
        cs = [c for c in cliques(g) if 2 <= len(c) <= 6]
        if cs:
            usable[x] = [sorted(c) for c in cs]
    in_bucket = {w for gs in usable.values() for c in gs for w in c}
    n_bucket_edges = sum(len(g) for g in usable.values())
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
    # 「辨析」的候选来源跟「出题」正好相反：出题要挑「义项重叠但填了会说错」的，
    # 辨析要挑「作者故意放在同一句/同一段里的近义词」，越近越要辨析（含被同义词黑名单挡掉的）。
    # 所以这里按共现重新统计一遍，别复用 conf 那份边集。
    marked = []          # 每句的可点词集合
    for s in sents:
        ws = []
        for mm in re.finditer(r'\[\[([^\]:]+):', s):
            w = mm.group(1).strip().lower()
            if w not in ws:
                ws.append(w)
        marked.append(set(ws))
    syn_pairs = set()
    for a in syn:
        for b in syn[a]:
            if a < b:
                syn_pairs.add((a, b))
    # 辨析组的成员一律限死为目标词（有卡、在课文里被标的词）。
    # 「同义词：」段（来自 PDF 同义替换资料）**不作为辨析组的来源**，它只服务卡上那一栏；
    # 这里只统计它带来的一个副作用：这些对子不能互为选项（填哪个都对）。
    co_sent, co_groups = {}, collections.Counter()
    para_of = []                       # 全局句号 → (文章索引, 段索引)，与 sents 同序
    for ai, a in enumerate(S):
        for pi, para in enumerate(a['paragraphs']):
            for _ in para:
                para_of.append((ai, pi))
    para_words = collections.defaultdict(set)
    for gi, ws in enumerate(marked):
        para_words[para_of[gi]].update(ws)
    for gi, ws in enumerate(marked):
        for x, cs in usable.items():
            for c in cs:
                hit = ws & set(c)
                if len(hit) >= 2:
                    co_sent.setdefault(gi, []).append((x, tuple(sorted(hit))))
                    co_groups[(x, tuple(sorted(hit)))] += 1
    # 互为同义词的对子在课文里也常共现，但它按新口径不进辨析清单，只统计「选项黑名单要挡掉多少」
    syn_co = {tuple(sorted((p, q))) for p, q in syn_pairs
              if p in set().union(*marked) and q in set().union(*marked)}
    syn_co_para = {k for k, ws in para_words.items() if any(p in ws and q in ws for p, q in syn_pairs)}
    def para_hits(ws):
        return [tuple(sorted(ws & set(c))) for x, cs in usable.items() for c in cs
                if len(ws & set(c)) >= 2]
    para_hit = sum(1 for ws in para_words.values() if para_hits(ws))
    # 共现主要发生在**段**一级（作者把近义词铺在一整段里），所以段级才是辨析组的工作清单
    co_groups_para = collections.Counter()
    for k, ws in para_words.items():
        for x, cs in usable.items():
            for c in cs:
                hit = ws & set(c)
                if len(hit) >= 2:
                    co_groups_para[(x, tuple(sorted(hit)))] += 1
    # 辨析表的分组单位是「同一段 + 同一个中文义项」，**不排除互为同义词的**：
    # damp 与 humid 在同一段里挨着，这恰恰是他最想被一句话讲清的一对。
    # L1 同义词黑名单只在**出题**时用（填哪个都对 → 不能互为选项），别拿它砍辨析。
    cmp_groups = {}                                    # 词集 → {出现的段落, 共享义项}
    for pk, ws in para_words.items():
        for x, g in by_sense.items():
            hit = tuple(sorted(ws & g & set(key_of)))
            if 2 <= len(hit) <= 6:
                e = cmp_groups.setdefault(hit, {'paras': set(), 'senses': set()})
                e['paras'].add(pk)
                e['senses'].add(x)
    cmp_words = {w for g in cmp_groups for w in g}
    para_words_covered = {w for (_, g) in co_groups_para for w in g}
    worklist = sorted({g for (_, g) in co_groups_para})
    # 组内目标词数 = 2 时只有两选一，出不了合格的四选一 → 该组只作辨析，题目走回忆题
    tiny = {g for g in worklist if len(g) <= 2}
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
    print(f'义项团（组内两两都过黑名单）：{len(usable)} 个义项产出 {n_bucket_edges} 组，覆盖 {len(in_bucket)} 个词头 = {len(in_bucket)/len(V)*100:.1f}%（跳过超大义项 {big_sense} 个）')
    top = sorted(usable.items(), key=lambda kv: -len(kv[1]))[:10]
    for x, gs in top:
        print(f'    {x}: ' + ' / '.join(' '.join(g) for g in gs[:4]))
    print(f'课文中出现 ≥2 次但没有卡的简单词（辨析组要收、且要么加可点标记要么只做纯文本选项） {len(nocard)} 个')
    print(f'  高频示例: ' + ' '.join(f'{t}×{c}' for t, c in sorted(nocard.items(), key=lambda kv: -kv[1])[:16]))
    print(f'── 共现口径（辨析卡的真正来源：作者故意把近义词写在一起）──')
    print(f'同句内 ≥2 个近义词共现的句子 {len(co_sent)} / {len(sents)} 句 = {len(co_sent)/len(sents)*100:.1f}%')
    print(f'同段内共现的段落 {para_hit} / {len(para_words)} 段 = {para_hit/len(para_words)*100:.1f}%')
    print(f'去重后的共现组 {len(co_groups)} 个，其中在课文里出现 ≥2 次的 {sum(1 for v in co_groups.values() if v >= 2)} 个')
    for (x, g), c in co_groups.most_common(6):
        print(f'    ×{c} [{x}] {" ".join(g)}')
    print(f'  段级共现组（一期辨析工作清单，成员全是目标词） {len(worklist)} 组，'
          f'覆盖 {len(para_words_covered)} 个词头 = {len(para_words_covered)/len(V)*100:.1f}%')
    print(f'  规模分布 {dict(sorted(collections.Counter(len(g) for g in worklist).items()))}'
          f' · 只有 2 个目标词的组 {len(tiny)} 组（够辨析，不够出四选一 → 走回忆题）')
    only_syn = sum(1 for g in cmp_groups if all(y in syn[x] for x in g for y in g if x != y))
    print(f'  ── 辨析表清单（段内同义项成组，含互为同义词的对子）{len(cmp_groups)} 组，其中整组互为同义词 {only_syn} 组，'
          f'覆盖 {len(cmp_words)} 个词头 = {len(cmp_words)/len(V)*100:.1f}%，落在 {len({p for e in cmp_groups.values() for p in e["paras"]})} 个段落上')
    print(f'     规模分布 {dict(sorted(collections.Counter(len(g) for g in cmp_groups).items()))}')
    print(f'  ── 出题选项池（极大团，已挡同义词）{n_bucket_edges} 组 / 段级共现 {len(worklist)} 组 —— 辨析可以讲同义对，选项不行')
    print(f'  互为同义词且同段共现的对子 {len(syn_co)} 对（只作选项黑名单），涉及 {len(syn_co_para)} 个段落')
    for (x, g), c in co_groups_para.most_common(14):
        print(f'    ×{c} [{x}] {" ".join(g)}')
    print(f'两语境（卡上有例句且课文里有标记） {two_ctx}/{len(V)}')
    print(f'其中例句没写出词头本体 {len(eg_missing)} 张: ' + ' '.join(eg_missing[:30]))
    if args.json:
        para_sents = collections.defaultdict(list)
        for gi, pk in enumerate(para_of):
            para_sents[pk].append(gi)
        loc = collections.defaultdict(lambda: {'paras': set(), 'senses': set()})
        for pk, ws in para_words.items():
            for x, cs in usable.items():
                for c in cs:
                    hit = tuple(sorted(ws & set(c)))
                    if len(hit) >= 2:
                        loc[hit]['paras'].add(pk)
                        loc[hit]['senses'].add(x)
        json.dump({'groups': groups, 'pairs': sorted(conf), 'eg_missing': eg_missing},
                  open(args.json, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
        out = []
        for g, v in sorted(cmp_groups.items(), key=lambda kv: (-len(kv[1]['paras']), len(kv[0]))):
            sents_in = sorted({gi for pk in v['paras'] for gi in para_sents[pk]
                               if marked[gi] & set(g)})
            both_syn = all(y in syn[x] for x in g for y in g if x != y) if len(g) > 1 else False
            out.append({'words': list(g), 'senses': sorted(v['senses']),
                        'paras': [list(pk) for pk in sorted(v['paras'])],
                        'all_synonyms': both_syn, 'sents': sents_in})
        json.dump(out, open('work/compare_groups_worklist.json', 'w', encoding='utf-8'),
                  ensure_ascii=False, indent=1)
        print(f'工作清单已写 work/compare_groups_worklist.json（{len(out)} 组，带段落与句号定位）')
    return 0


if __name__ == '__main__':
    sys.exit(main())
