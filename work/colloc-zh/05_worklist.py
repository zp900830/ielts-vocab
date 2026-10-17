#!/usr/bin/env python3
"""生成待翻译清单：每条词伙 + 书里查到的中文（若有）+ 出现该词的课文句（供译者看语境）。"""
import json, re, os, collections

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
V = json.load(open(os.path.join(ROOT, 'data/vocab.json'), encoding='utf-8'))
S = json.load(open(os.path.join(ROOT, 'data/sections.json'), encoding='utf-8'))
BOOK = json.load(open(os.path.join(ROOT, 'work/colloc-zh/book_pairs.json'), encoding='utf-8'))['pairs']

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

def norm(s):
    s = s.lower().replace('’', "'")
    s = re.sub(r'\([^)]*\)', ' ', s)
    s = re.sub(r'[^a-z0-9\- ]', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return re.sub(r'^(a|an|the)\s+', '', s)

book_norm = {}
for k, zh in BOOK.items():
    n = norm(k)
    if n and n not in book_norm:
        book_norm[n] = zh.title() if False else zh

# 句子索引：词 -> 首句
first_sent = {}
for ch in S:
    for p in ch['paragraphs']:
        for s in p:
            for w in set(re.findall(r'\[\[([^\]:]+):', s)):
                first_sent.setdefault(w.lower(), re.sub(r'\[\[[^\]:]+:([^\]]+)\]\]', r'\1', s))

rows, seen = [], set()
for w, v in V.items():
    note = (v or {}).get('note', '')
    if '词伙：' not in note:
        continue
    rest = note.split('词伙：', 1)[1].split('同义词：')[0]
    for c in split_collocs(rest):
        key = (w, c.lower())
        if key in seen:
            continue
        seen.add(key)
        rows.append({'w': w, 'c': c, 'book': book_norm.get(norm(c), ''),
                     'sent': first_sent.get(w.lower(), '')[:160]})

# 按词头排序，便于人工按语义批量译
rows.sort(key=lambda r: (r['w'], r['c'].lower()))
with open(os.path.join(ROOT, 'work/colloc-zh/worklist.tsv'), 'w', encoding='utf-8') as f:
    for i, r in enumerate(rows):
        f.write('%d\t%s\t%s\t%s\t%s\n' % (i, r['w'], r['c'], r['book'], r['sent'].replace('\t', ' ')))
print('总条数', len(rows), '| 书里命中', sum(1 for r in rows if r['book']))
json.dump(rows, open(os.path.join(ROOT, 'work/colloc-zh/worklist.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=0)
