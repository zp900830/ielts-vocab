#!/usr/bin/env python3
"""最终口径：词伙只放 3.0 原书条目（英文 + 原书中文），2.0 与自译/自造全部清掉。
- 每条搭配挂到它包含的目标词（词形还原），一词最多 5 条（书里顺序；词作中心词优先）
- 原书没有该词搭配 → 删掉「词伙：」段；同义词段与 cmp 不动
默认 dry-run，--apply 写盘；写盘前备份到 notes_backup_before_v30.json
"""
import json, re, os, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VOCAB = os.path.join(ROOT, 'data/vocab.json')
BOOK = os.path.join(ROOT, 'work/colloc-zh/book_pairs_v30.json')
BACKUP = os.path.join(ROOT, 'work/colloc-zh/notes_backup_before_v30.json')
APPLY = '--apply' in sys.argv
CAP = 5

pairs = json.load(open(BOOK, encoding='utf-8'))
vocab = json.load(open(VOCAB, encoding='utf-8'))

STOP = set('the a an to of in on for and or at by with is are be as it that this some any no not from into over under than then so but very too also just can could may might will would shall should do does did have has had'.split())
heads = {w.lower(): w for w in vocab}

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

# word -> [(en, zh, score, order)]
by_word = collections.OrderedDict()
unattached = []
for order, (en, zh) in enumerate(pairs):
    toks = [x for x in re.findall(r"[a-z][a-z'\-]*", en.lower()) if x not in STOP]
    got = []
    for t in toks:
        for v in variants(stem(t)):
            if v in heads:
                got.append(heads[v]); break
    got = list(dict.fromkeys(got))
    if not got:
        unattached.append((en, zh)); continue
    last = toks[-1] if toks else ''
    for g in got:
        score = 0 if g.lower() in variants(stem(last)) else 1
        by_word.setdefault(g, []).append((en, zh, score, order))

backup, lost, kept, changed, trimmed = {}, 0, 0, 0, 0
samples = []
for w, v in vocab.items():
    note = (v or {}).get('note', '')
    has_p = '词伙：' in note
    entries = sorted(by_word.get(w, []), key=lambda x: (x[2], x[3]))
    if len(entries) > CAP:
        trimmed += 1
        entries = entries[:CAP]
    if not note and not entries:
        continue
    if has_p:
        backup[w] = note
    if has_p:
        head, after = note.split('词伙：', 1)
        if '；同义词：' in after:
            _old, tail = after.split('；同义词：', 1)
            syn = '同义词：' + tail
            colloc_first = True
        else:
            syn = head
            colloc_first = False
    else:
        syn, colloc_first = note, False
    syn = syn.strip().strip('；;').strip()

    if entries:
        colloc = '词伙：' + ', '.join('%s（%s）' % (en, zh) for en, zh, _, _ in entries)
        new_note = (colloc + '；' + syn) if (syn and colloc_first) else ((syn + '；' + colloc) if syn else colloc)
        kept += 1
    else:
        new_note = syn
        if has_p:
            lost += 1
    if new_note != note:
        changed += 1
        if len(samples) < 5 and w in ('pollution', 'traffic', 'atmosphere', 'crime', 'oxygen'):
            samples.append((w, note, new_note))
        if APPLY:
            v['note'] = new_note

print('3.0 条目', len(pairs), '| 挂载', sum(len(v) for v in by_word.values()), '| 覆盖词', len(by_word), '| 挂不上', len(unattached))
print('词条改动', changed, '| 保留词伙', kept, '| 删掉词伙', lost, '| 超上限截断', trimmed)
for w, a, b in samples:
    print('\n[%s]\n  旧 %s\n  新 %s' % (w, a, b))

if APPLY:
    json.dump(backup, open(BACKUP, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    txt = json.dumps(vocab, ensure_ascii=False, separators=(',', ':'))
    open(VOCAB, 'w', encoding='utf-8').write(txt)
    print('\n已写盘', len(txt), '字节；备份', len(backup), '条 note；未挂书目', len(unattached), '条')
