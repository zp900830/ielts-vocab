#!/usr/bin/env python3
"""词伙层改为「只放 2.0 原书条目 + 原书中文」。
- 每个词头挂上原书里含该词的搭配（书里顺序，全部保留，不设上限）
- 原书没有该词的搭配 → 删掉「词伙：」段（不留自译）
- 同义词段、辨析卡一字不动
默认 dry-run，--apply 写盘；写盘前把原 note 备份到 work/colloc-zh/notes_backup_before_book_only.json
"""
import json, re, os, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VOCAB = os.path.join(ROOT, 'data/vocab.json')
BOOK = os.path.join(ROOT, 'work/colloc-zh/book_pairs_final.json')
BACKUP = os.path.join(ROOT, 'work/colloc-zh/notes_backup_before_book_only.json')
APPLY = '--apply' in sys.argv

pairs = json.load(open(BOOK, encoding='utf-8'))
vocab = json.load(open(VOCAB, encoding='utf-8'))

STOP = set('the a an to of in on for and or at by with is are be as it that this some any no not from into over under than then so but very too also just'.split())
heads = {w.lower(): w for w in vocab}

def stem(t):
    for suf in ('ies', 'ing', 'ed', 'es', 's'):
        if len(t) > len(suf) + 3 and t.endswith(suf):
            return t[:-len(suf)]
    return t

def variants(t):
    vs = {t}
    if t.endswith('e'):
        vs.add(t[:-1])
    else:
        vs.add(t + 'e')
    if t.endswith('y'):
        vs.add(t[:-1] + 'i')
    return vs

by_word = collections.OrderedDict()
unattached = []
for en, zh in pairs:
    toks = [x for x in re.findall(r"[a-z][a-z'\-]*", en.lower()) if x not in STOP]
    got = []
    for t in toks:
        for v in variants(stem(t)):
            if v in heads:
                got.append(heads[v]); break
    got = list(dict.fromkeys(got))
    if not got:
        unattached.append((en, zh)); continue
    for g in got:
        by_word.setdefault(g, []).append((en, zh))

# —— 改 note ——
backup, lost, kept, changed = {}, 0, 0, 0
samples = []
for w, v in vocab.items():
    note = (v or {}).get('note', '')
    has_p = '词伙：' in note
    entries = by_word.get(w, [])
    if not note and not entries:
        continue
    if has_p:
        backup[w] = note
    head, after = (note.split('词伙：', 1) + [''])[:2] if has_p else (note, '')
    if has_p:
        if '；同义词：' in after:
            colloc_old, tail = after.split('；同义词：', 1)
            syn = '同义词：' + tail
            colloc_first = True
        else:
            colloc_old, syn = after, head
            colloc_first = False
    else:
        syn = note
        colloc_first = False

    syn = syn.strip()
    while syn.endswith('；') or syn.endswith(';'):
        syn = syn[:-1].strip()

    if entries:
        colloc = '词伙：' + ', '.join('%s（%s）' % (en, zh) for en, zh in entries)
        if syn:
            new_note = (colloc + '；' + syn) if colloc_first else (syn + '；' + colloc)
        else:
            new_note = colloc
        kept += 1
    else:
        new_note = syn
        if has_p:
            lost += 1
    if new_note != note:
        changed += 1
        if len(samples) < 6 and w in ('cellar', 'dust', 'atmosphere', 'granite', 'oxygen', 'hull'):
            samples.append((w, note, new_note))
        if APPLY:
            v['note'] = new_note

print('书条目', len(pairs), '| 挂到词头', sum(len(v) for v in by_word.values()), '| 覆盖词', len(by_word), '| 挂不上', len(unattached))
print('词条改动', changed, '| 保留词伙', kept, '| 删掉词伙', lost)
print('每词最多搭配', max(len(v) for v in by_word.values()), '| 分布', sorted(collections.Counter(len(v) for v in by_word.values()).items()))
for w, a, b in samples:
    print('\n[%s]\n  旧 %s\n  新 %s' % (w, a, b))

if APPLY:
    json.dump(backup, open(BACKUP, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    txt = json.dumps(vocab, ensure_ascii=False, separators=(',', ':'))
    open(VOCAB, 'w', encoding='utf-8').write(txt)
    print('\n已写盘', len(txt), '字节；备份', len(backup), '条 ->', BACKUP)
