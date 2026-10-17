#!/usr/bin/env python3
"""盘点 data/vocab.json 里所有词伙条目（按 note 文本），并与书里对照表匹配。"""
import json, re, os, collections

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VOCAB = os.path.join(ROOT, 'data/vocab.json')
BOOK = os.path.join(ROOT, 'work/colloc-zh/book_pairs.json')
OUT = os.path.join(ROOT, 'work/colloc-zh/project_collocs.json')

book = json.load(open(BOOK, encoding='utf-8'))['pairs']
vocab = json.load(open(VOCAB, encoding='utf-8'))

def split_collocs(rest):
    """把「a, b, c」拆成条目；括号内的逗号不拆。"""
    out, buf, depth = [], '', 0
    for ch in rest:
        if ch in '（(':
            depth += 1
        elif ch in '）)':
            depth = max(0, depth - 1)
        if ch in ',，、' and depth == 0:
            out.append(buf)
            buf = ''
        else:
            buf += ch
    out.append(buf)
    return [x.strip(' ;；') for x in out if x.strip(' ;；')]

rows = []
for w, v in vocab.items():
    note = (v or {}).get('note', '')
    if not note or '词伙：' not in note:
        continue
    rest = note.split('词伙：', 1)[1]
    # 词伙段可能后面还有内容（同义词在前后都可能出现），只取到下一个「同义词：」
    rest = rest.split('同义词：')[0]
    for c in split_collocs(rest):
        rows.append((w, c))

uniq = collections.OrderedDict()
for w, c in rows:
    uniq.setdefault(c.lower(), []).append(w)

print('词伙条目行数', len(rows), '| 词条', len({w for w, _ in rows}), '| 去重搭配', len(uniq))

def norm(s):
    s = s.lower().replace('’', "'")
    s = re.sub(r'\([^)]*\)', ' ', s)
    s = re.sub(r'[^a-z0-9\- ]', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    s = re.sub(r'^(a|an|the)\s+', '', s)
    return s

book_norm = {norm(k): v for k, v in book.items()}
exact = [c for c in uniq if norm(c) in book_norm]
print('精确命中书', len(exact), '=%.1f%%' % (100*len(exact)/len(uniq)))
print('未命中', len(uniq)-len(exact))
json.dump({'rows': rows, 'uniq': list(uniq.keys()),
           'book': book}, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('\n未命中样例:')
n = 0
for c in uniq:
    if norm(c) not in book_norm:
        print(' ', c)
        n += 1
        if n >= 25: break
