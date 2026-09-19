#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""同义替换双向核对：两份资料 × shadow/data/vocab.json 的「同义词：」段。

资料 1  何琼听力改写：一行一条「A=B=C 中文」，等号即明确的同义关系。
资料 2  高频同义替换：编号条目按小节成组（同一小节 = 同一组同义词），
        另外「中文释义相同」本身就是同义依据，所以再按释义聚一次组。

两个方向：
  B 卡片里的 (词头, 同义词) 对，资料里有没有依据 —— 没有就是来源不明
  A 资料里的组，落在跟读篇目标词上的部分，卡片有没有收 —— 没有就是漏收
"""
import json
import re
import collections

ROOT = '/Users/zhoupeng/Library/Mobile Documents/com~apple~CloudDocs/雅思背单词项目'
HE = '/tmp/syn/heqiong.txt'
GP = '/tmp/syn/gaopin_entries.json'


def norm(s):
    s = s.lower().strip().strip('.,;:，。 ')
    s = re.sub(r'\([^)]*\)', '', s)
    s = re.sub(r'^(the|a|an)\s+', '', s)
    return re.sub(r'\s{2,}', ' ', s).strip()


def stem(w):
    for suf in ('ing', 'ed', 'es', 's'):
        if w.endswith(suf) and len(w) - len(suf) >= 3:
            return w[:-len(suf)]
    return w


def key(s):
    return ' '.join(stem(w) for w in norm(s).split() if len(w) > 1)


def load_he():
    """何琼：`1.  manufacturer=producer 生产者` → 组内成员列表。"""
    groups = []
    for ln in open(HE, encoding='utf-8'):
        m = re.match(r'^\s*\d+\.\s*(.+)$', ln)
        if not m:
            continue
        body = m.group(1)
        # 中文尾注去掉（只留英文侧）
        eng = re.split(r'[\u4e00-\u9fa5]', body)[0]
        parts = [norm(p) for p in re.split(r'[=＝]', eng)]
        parts = [p for p in parts if p and re.search(r'[a-z]', p)]
        if len(parts) >= 2:
            groups.append({'src': '何琼', 'items': parts, 'raw': norm(eng)})
    return groups


def load_gp():
    d = json.load(open(GP, encoding='utf-8'))
    ents = d['entries']
    bynum = {}
    for e in ents:
        bynum.setdefault(e['num'], e)
    ordered = [bynum[k] for k in sorted(bynum)]
    groups = []
    # 依据一：同一小节标题下连续成组
    cur, grp = None, []
    for e in ordered:
        if e.get('group') != cur:
            if len(grp) >= 2:
                groups.append({'src': '高频·小节', 'items': grp})
            cur, grp = e.get('group'), []
        if e['en']:
            grp.append(norm(e['en']))
    if len(grp) >= 2:
        groups.append({'src': '高频·小节', 'items': grp})
    # 依据二：中文释义相同即同组（对释义做归一后聚类）
    byg = collections.defaultdict(list)
    for e in ordered:
        g = re.sub(r'^(adj|adv|n|v|vt|vi|prep|conj|pron|num)\.[^一-鿿]*', '', e.get('poszh', ''))
        g = re.sub(r'[，,、；;。\s]+', '', g)
        if len(e['en']) > 2 and len(g) >= 2:
            byg[g].append(norm(e['en']))
    for g, lst in byg.items():
        if 2 <= len(lst) <= 12:
            groups.append({'src': '高频·同释义', 'items': lst, 'gloss': g})
    return groups, ordered


def main():
    V = json.load(open(ROOT + '/shadow/data/vocab.json', encoding='utf-8'))
    D = json.load(open(ROOT + '/shadow/data/sections.json', encoding='utf-8'))
    targets = collections.Counter()
    for c in D:
        for p in c['paragraphs']:
            for s in p:
                for m in re.finditer(r'\[\[([^\]:]+):', s):
                    targets[m.group(1).lower()] += 1

    he = load_he()
    gp, gp_ents = load_gp()
    groups = he + gp
    # 组内两两关系 → 依据集
    evidence = set()
    for g in groups:
        ks = sorted({key(x) for x in g['items'] if x})
        for i in range(len(ks)):
            for j in range(len(ks)):
                if i != j:
                    evidence.add((ks[i], ks[j]))
    print(f'资料解析：何琼 {len(he)} 组、高频 {len(gp)} 组（含小节 {sum(1 for x in gp if x["src"]=="高频·小节")}）'
          f'、高频词条 {len(gp_ents)} 条')
    print(f'可支持的有向同义关系 {len(evidence)} 对')

    card = {}
    for k, e in V.items():
        n = e.get('note')
        if isinstance(n, str):
            m = re.search(r'同义词：([^\n；]+)', n)
            if m:
                card[k.lower()] = [x.strip() for x in m.group(1).split(',') if x.strip()]
    pairs = [(k, s) for k, lst in card.items() for s in lst]
    ok = [(k, s) for k, s in pairs if (key(s), key(k)) in evidence]
    bad = [(k, s) for k, s in pairs if (key(s), key(k)) not in evidence]
    print(f'\nB 方向：卡片同义词对 {len(pairs)}，资料可支持 {len(ok)}（{len(ok)/len(pairs)*100:.1f}%），'
          f'无依据 {len(bad)}（{len(bad)/len(pairs)*100:.1f}%）')

    # A 方向：资料里成组、且词头是目标词，但卡片没写同义词
    heads_in_src = collections.defaultdict(set)
    for g in groups:
        for x in g['items']:
            kk = norm(x)
            if kk in targets and kk in V:
                heads_in_src[kk] |= {norm(y) for y in g['items'] if norm(y) != kk}
    no_card = [k for k in heads_in_src if k not in card]
    partial = []
    for k, syns in heads_in_src.items():
        if k in card:
            have = {key(x) for x in card[k]}
            miss = [s for s in syns if key(s) not in have]
            if len(miss) >= max(2, len(syns) // 2):
                partial.append((k, len(syns), len(miss)))
    print(f'A 方向：资料里出现且是目标词的词头 {len(heads_in_src)} 个；'
          f'其中卡片完全没有同义词段的 {len(no_card)} 个；'
          f'卡片有但漏掉大半组员的 {len(partial)} 个')
    print('\nA 样例（资料有组、卡片没同义词段）:', ', '.join(sorted(no_card)[:18]))
    print('B 样例（卡片有、资料无依据）:')
    for k, s in bad[:14]:
        print(f'   {k:<14} ← {s}')
    json.dump({'no_card': sorted(no_card), 'partial': sorted(partial, key=lambda x: -x[2]),
               'unsupported': [{'head': k, 'syn': s} for k, s in bad],
               'supported': [{'head': k, 'syn': s} for k, s in ok]},
              open('/tmp/syn/syn_xcheck.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
