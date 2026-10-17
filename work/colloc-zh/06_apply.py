#!/usr/bin/env python3
"""把词伙译文写回 data/vocab.json（默认 dry-run，--apply 才写盘）。

格式：词伙：dark cellar（黑暗的地窖）, absorb dust（吸尘）
规则：
 1 只动「词伙：」这一段，前面的辨析/同义词一字不改；16 条「；同义词：」尾巴原样保留。
 2 原有英文逐字保留，只在后面追加全角括注；已带括注的条目跳过（幂等）。
 3 找不到译文就报错，不静默跳过。
"""
import json, re, os, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VOCAB = os.path.join(ROOT, 'data/vocab.json')
ZH_IDX = json.load(open(os.path.join(ROOT, 'work/colloc-zh/zh_all.json'), encoding='utf-8'))
UNIQ = json.load(open(os.path.join(ROOT, 'work/colloc-zh/unique.json'), encoding='utf-8'))
ZH = {UNIQ[int(i)]['c'].lower(): zh for i, zh in ZH_IDX.items()}
APPLY = '--apply' in sys.argv

vocab = json.load(open(VOCAB, encoding='utf-8'))
changed = 0
missing, already, samples = [], 0, []
maxlen = 0

for w, v in vocab.items():
    note = (v or {}).get('note', '')
    if '词伙：' not in note:
        continue
    head, after = note.split('词伙：', 1)
    if '；同义词：' in after:
        colloc_part, syn = after.split('；同义词：', 1)
        tail = '；同义词：' + syn
    else:
        colloc_part, tail = after, ''
    items = [x.strip() for x in colloc_part.split(',') if x.strip()]
    out = []
    for it in items:
        if re.search(r'（[^）]*[\u4e00-\u9fff][^）]*）$', it):
            already += 1
            out.append(it)
            continue
        zh = ZH.get(it.lower())
        if not zh:
            missing.append((w, it))
            out.append(it)
            continue
        out.append('%s（%s）' % (it, zh))
    new_note = head + '词伙：' + ', '.join(out) + tail
    # 断言：原英文全部还在
    for it in items:
        assert it in new_note, (w, it)
    maxlen = max(maxlen, len(new_note))
    if new_note != note:
        changed += 1
        if len(samples) < 5:
            samples.append((w, note, new_note))
        if APPLY:
            v['note'] = new_note

print('待改词条', changed, '| 已带中文跳过', already, '| 缺译', len(missing))
if missing:
    print('缺译样例', missing[:10])
for w, a, b in samples:
    print('\n[%s]\n  旧 %s\n  新 %s' % (w, a, b))
print('\n最长的 note 长度', maxlen)

if APPLY:
    txt = json.dumps(vocab, ensure_ascii=False, separators=(',', ':'))
    open(VOCAB, 'w', encoding='utf-8').write(txt)
    print('已写盘', len(txt), '字节')
