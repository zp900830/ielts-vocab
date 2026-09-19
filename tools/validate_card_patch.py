#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""门禁 1：机器校验子代理交回的词卡补丁 work/cardgen/got/*.json。

与上一版的两点区别：
 1 输入改成目录驱动的 need/*.json ↔ got/*.json 配对。上一轮 7 个代理里 4 个的产出
   随会话崩溃蒸发，因为它们的产出只存在于对话里。现在一片一个文件，崩了最多丢一片。
 2 每条交回的词都要回查 work/cardgen/cand.json 的候选表 —— 拿不到候选的一律**直接拒绝**。
   上一版只是打个 free 标记放行，结果代理仍然会顺手造词；用户 2026-09-19 定调
   「词伙、同义词不用自己造」，所以自由作答从「记账」改成「拦截」。

只拦能被机械证明的错，不判「意思像不像」（那是门禁 2 的职责）：
  1 词头必须在 need 清单里，且该词头确实缺这一段的（不许越权改别的词/改已有段）
  2 词必须在本书目标词里（syn），不得是词头自身、不得重复
  3 syn 必须与词头词性有交集 —— 拦 prompt(adj)↔promote(v) 这类形近假同义
  4 col 必须 2–6 个词、纯小写字母、含词头（或其屈折形）、除词头外每个词都在
    简单词/目标词白名单里（不引入超纲词）、≤3 条
  5 不得复活上一轮逐条裁决判 wrong 的词（这条文档里早就写了，代码一直漏着）
"""
import glob
import json
import re
import sys
import collections

ROOT = '/Users/zhoupeng/Library/Mobile Documents/com~apple~CloudDocs/雅思背单词项目'
POS = {'n': 'n', 'vt': 'n', 'vi': 'n', 'v': 'v', 'a': 'adj', 'adj': 'adj',
       'ad': 'adv', 'adv': 'adv', 'prep': 'prep', 'conj': 'conj', 'pron': 'n', 'num': 'adj'}
TAG = re.compile(r'(?:^|[；;，,\s])(n|vt|vi|v|a|adj|ad|prep|conj|pron|num)\.', re.I)
CAP_SYN = CAP_COL = 3
SRC_LABEL = {'M': '资料同义组', 'R': '反向索引', 'B': '词伙书', 'T': '课文原句', 'F': '自由作答'}


def pos_set(m):
    out = set()
    for t in TAG.findall(str(m or '')):
        p = POS.get(t.lower())
        if p:
            out.add(p)
    return out


def forms(w, pos=None):
    """词头 → 允许出现的词形。

    刻意不无脑加 `d`/`er`：kin→kind、corn→corner 这种拼得出真词的错误匹配，
    上一轮就是这么把从句窗口里的别的词当成词头搭配喂进词卡的。
    传 pos（pos_set 的结果）时按词性再收一道：-er/-est 只给形容词/副词，
    -ed/-ing 只给动词，-s/-es 给名词和动词 —— 名词 corn 就再也拼不出 corner。
    pos 为 None 或解析不出来时退回宽松集合，宁多不漏。
    """
    w = w.lower()
    if not pos:
        pos = {'n', 'v', 'adj', 'adv'}
    f = {w}
    if pos & {'n', 'v'}:
        f |= {w + 's', w + 'es'}
    if 'v' in pos:
        f |= {w + 'ed', w + 'ing'}
    if pos & {'adj', 'adv'}:
        f |= {w + 'er', w + 'est'}
    if w.endswith('e'):
        if 'v' in pos:
            f |= {w + 'd', w[:-1] + 'ing', w[:-1] + 'ed'}
        if pos & {'adj', 'adv'}:
            f |= {w + 'r', w + 'st', w[:-1] + 'est'}
    if w.endswith('y') and len(w) > 2:
        stem = w[:-1]
        if pos & {'n', 'v'}:
            f.add(stem + 'ies')
        if 'v' in pos:
            f |= {stem + 'ed', stem + 'ing'}
        if pos & {'adj', 'adv'}:
            f |= {stem + 'er', stem + 'est'}
    return f


def load_simple():
    return {l.split('\t')[0].strip().lower() for l in open(ROOT + '/tools/data/simple_word_tags.tsv', encoding='utf-8')
            if not l.startswith('#') and l.strip()}


def trim_match(sub, cands):
    """代理交回的词伙是不是某条候选「掐头去尾」后的连续片段。

    候选是从课文里切的窗口（travel bureau take），能背的单位往往只是其中一段
    （travel bureau）。允许剪两端、不许换词、不许中间掏空 —— 这样既拿到可复用形状，
    又不可能凭空造词。命中时返回原候选，出处照原候选记。
    """
    w = sub.split()
    if not w:
        return None
    for c in cands:
        cw = c.split()
        for i in range(len(cw) - len(w) + 1):
            if cw[i:i + len(w)] == w:
                return c
    return None


def rejected_pairs():
    """上一轮逐条裁决判 wrong 的 (词头 → 被否词)。"""
    out = collections.defaultdict(set)
    for f in sorted(glob.glob(ROOT + '/work/ref/syn-verdict-*.json')):
        try:
            rows = json.load(open(f, encoding='utf-8'))
        except (OSError, ValueError):
            continue
        for r in rows if isinstance(rows, list) else []:
            if not isinstance(r, dict):
                continue
            head = str(r.get('head') or r.get('w') or '').lower().strip()
            if not head:
                continue
            for w in r.get('wrong') or []:
                m = re.match(r'^\s*([A-Za-z][A-Za-z\'’ .-]*?)\s*[:：]', str(w))
                out[head].add((m.group(1) if m else str(w)).lower().strip())
    return out


def pairs(need, got):
    """need/*.json 与 got/*.json 按同名配对；缺 got 的片单独报出来。"""
    for nf in sorted(glob.glob(need + '/*.json')):
        sid = nf.split('/')[-1][:-5]
        if sid.startswith('_'):
            continue
        gf = f'{got}/{sid}.json'
        rows = json.load(open(nf, encoding='utf-8'))
        if not glob.glob(gf):
            yield sid, rows, None
            continue
        yield sid, rows, json.load(open(gf, encoding='utf-8'))


def main():
    V = json.load(open(ROOT + '/shadow/data/vocab.json', encoding='utf-8'))
    cand = json.load(open(ROOT + '/work/cardgen/cand.json', encoding='utf-8'))
    allowed = {k.lower() for k in V}
    simple = load_simple()
    wrong = rejected_pairs()
    src_of = {h: ({x['s']: x['src'] for x in e.get('syn', [])},
                  {x['c']: x['src'] for x in e.get('col', [])}) for h, e in cand.items()}

    rejected, clean = [], []
    seen_head, missing_slice = set(), []
    for sid, rows, got in pairs(ROOT + '/work/cardgen/need', ROOT + '/work/cardgen/got'):
        want = {r['w'].lower(): r for r in rows}
        if got is None:
            missing_slice.append(sid)
            continue
        for item in got:
            h = str(item.get('w', '')).lower().strip()
            if h not in want:
                rejected.append((h, sid, '不在本片待处理清单里（越权）'))
                continue
            if h in seen_head:
                continue
            seen_head.add(h)
            row, (csyn, ccol) = want[h], src_of.get(h, ({}, {}))
            head_pos = pos_set((V.get(h) or (V.get(next((k for k in V if k.lower() == h), ''))) or {}).get('m'))
            hf = forms(h, head_pos)
            syn, col = [], []
            if row.get('need_syn') or row.get('need_syn_ext'):
                for s in (item.get('syn') or []):
                    s = str(s).lower().strip()
                    if s == h:
                        rejected.append((h, sid, f'syn 含词头自身 {s}')); continue
                    if s not in csyn:
                        # 用户 2026-09-19 定调：同义词不许自己造，只许从资料抽好的候选里挑
                        rejected.append((h, sid, f'syn 不在候选里（自由作答）{s}')); continue
                    if s not in allowed:
                        rejected.append((h, sid, f'syn 非本书目标词 {s}')); continue
                    if s in [x['s'] for x in syn]:
                        continue
                    if s in wrong.get(h, set()):
                        rejected.append((h, sid, f'syn 是上一轮判错的词 {s}')); continue
                    sp = pos_set((V.get(s) or {}).get('m'))
                    if head_pos and sp and not (head_pos & sp):
                        rejected.append((h, sid, f'syn 词性不符 {s}({"/".join(sorted(sp))} vs {"/".join(sorted(head_pos))})')); continue
                    syn.append({'s': s, 'src': csyn.get(s, 'F')})
                    if len(syn) >= CAP_SYN:
                        break
            elif item.get('syn'):
                rejected.append((h, sid, '该词不需要补同义词段，忽略 syn'))
            if row.get('need_col'):
                for c in (item.get('col') or []):
                    c = str(c).strip().lower()
                    if not re.fullmatch(r"[a-z][a-z' -]{1,60}", c):
                        rejected.append((h, sid, f'col 含非法字符 {c!r}')); continue
                    ws = c.split()
                    if not (2 <= len(ws) <= 6):
                        rejected.append((h, sid, f'col 词数越界 {c!r}')); continue
                    if c not in ccol and trim_match(c, list(ccol)) is None:
                        # 同上：词伙只许从候选里挑（允许掐头去尾），候选全是资料/课文里真出现过的
                        rejected.append((h, sid, f'col 不在候选里（自由作答）{c!r}')); continue
                    # 出处照命中的那条候选记（掐头去尾不改变它来自书里还是课文里）
                    src = ccol.get(c) or ccol[trim_match(c, list(ccol))]
                    if not any(w in hf or any(w in forms(x) for x in h.split()) for w in ws):
                        rejected.append((h, sid, f'col 不含词头 {c!r}')); continue
                    badw = [w for w in ws if w not in hf and w not in simple and w not in allowed]
                    if badw:
                        rejected.append((h, sid, f'col 引入超纲词 {c!r} → {badw}')); continue
                    if c in [x['c'] for x in col]:
                        continue
                    col.append({'c': c, 'src': src})
                    if len(col) >= CAP_COL:
                        break
            elif item.get('col'):
                rejected.append((h, sid, '该词不需要补词伙段，忽略 col'))
            if syn or col:
                # 同一条搭配的三种截断（fertile soil / deep fertile soil）只算机械可查的冗余，
                # 但「留哪条」是判断不是事实，所以只打标记，交给门禁 2 定夺，不静默删
                dup = [[a['c'], b['c']] for i, a in enumerate(col) for b in col[i + 1:]
                       if a['c'] in b['c'] or b['c'] in a['c']]
                clean.append({'w': h, 'pkt': row.get('pkt', sid.split('-')[0]),
                              'merge_syn_ext': bool(row.get('need_syn_ext')),
                              'overlap_col': dup or None,
                              'syn': syn, 'col': col})

    json.dump(clean, open(ROOT + '/work/cardgen/clean.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    json.dump([{'head': a, 'slice': b, 'why': c} for a, b, c in rejected],
              open(ROOT + '/work/cardgen/rejected.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    ns = sum(len(x['syn']) for x in clean)
    nc = sum(len(x['col']) for x in clean)
    fs = sum(1 for x in clean for y in x['syn'] if y['src'] == 'F')
    fc = sum(1 for x in clean for y in x['col'] if y['src'] == 'F')
    print(f'通过 {len(clean)} 个词头 | 同义词 {ns} 条（自由作答 {fs}）、词伙 {nc} 条（自由作答 {fc}）')
    bysrc = collections.Counter(y['src'] for x in clean for y in x['syn'] + x['col'])
    print('  出处分布：' + '、'.join(f'{SRC_LABEL[k]} {v}' for k, v in sorted(bysrc.items(), key=lambda kv: -kv[1])))
    print(f'拒绝 {len(rejected)} 条')
    for k, v in collections.Counter(r[2].split(' ')[0] for r in rejected).most_common(8):
        print(f'   {k}: {v}')
    if missing_slice:
        print(f'!! 有 {len(missing_slice)} 片没交回：{",".join(missing_slice)}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
