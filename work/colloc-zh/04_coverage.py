#!/usr/bin/env python3
"""覆盖率体检：每个目标词在课文里的每次出现，note 里的词伙是否真的「管到」这一处。
管到的判据：某条词伙的实词（忽略词形后缀）在句子里按序出现。
"""
import json, re, os, collections

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = json.load(open(os.path.join(ROOT, 'data/sections.json'), encoding='utf-8'))
V = json.load(open(os.path.join(ROOT, 'data/vocab.json'), encoding='utf-8'))
STOP = set('the a an to of in on for and or at by with is are be as it that this some any no not but from into over under'.split())

def split_collocs(rest):
    out, buf, depth = [], '', 0
    for ch in rest:
        if ch in '（(':
            depth += 1
        elif ch in '）)':
            depth = max(0, depth - 1)
        if ch in ',，、' and depth == 0:
            out.append(buf); buf = ''
        else:
            buf += ch
    out.append(buf)
    return [x.strip(' ;；') for x in out if x.strip(' ;；')]

def stem(t):
    for suf in ('ies', 'ing', 'ed', 'es', 's'):
        if len(t) > len(suf) + 3 and t.endswith(suf):
            return t[:-len(suf)]
    return t

def covered(colloc, sent_low):
    toks = [stem(t) for t in re.findall(r"[a-z][a-z'\-]*", colloc.lower()) if t not in STOP]
    if not toks:
        return False
    # 允许目标词自身词形变化：只要句子里按序出现这些实词
    pos = 0
    for t in toks:
        i = sent_low.find(t, pos)
        if i < 0:
            return False
        pos = i + len(t)
    return True

occ = collections.defaultdict(list)   # word -> [(ci,pi,si,plain)]
for ci, ch in enumerate(S):
    for pi, para in enumerate(ch['paragraphs']):
        for si, raw in enumerate(para):
            plain = re.sub(r'\[\[([^\]:]+):([^\]]+)\]\]', r'\2', raw).lower()
            for w in set(re.findall(r'\[\[([^\]:]+):', raw)):
                occ[w.lower()].append((ci, pi, si, plain))

rows = []
for w, occs in occ.items():
    note = (V.get(w, {}) or {}).get('note', '')
    collocs = split_collocs(note.split('词伙：', 1)[1].split('同义词：')[0]) if '词伙：' in note else []
    missing = [o for o in occs if not any(covered(c, o[3]) for c in collocs)]
    if missing:
        rows.append((w, len(occs), len(missing), collocs, missing[0]))

rows.sort(key=lambda r: -r[2])
print('有出现但没被任何词伙管到的词:', len(rows), '| 涉及出现次数:', sum(r[2] for r in rows))
print('其中完全没 note 的:', sum(1 for r in rows if not r[3]))
print('\n前 25:')
for w, n, m, cl, first in rows[:25]:
    print('  %-14s 出现%d 未覆盖%d | %s' % (w, n, m, (', '.join(cl) if cl else '（无 note）')))
json.dump([{'w': w, 'occ': n, 'miss': m, 'collocs': cl,
            'first': {'ci': f[0], 'pi': f[1], 'si': f[2]}} for w, n, m, cl, f in rows],
          open(os.path.join(ROOT, 'work/colloc-zh/coverage.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=0)
