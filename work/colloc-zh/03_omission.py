#!/usr/bin/env python3
"""遗漏体检：把文章句子里「目标词实际参与的搭配」和该词 note 里的词伙对照。
只报两类：
  A 书里有、句子里也真的出现、但该词 note 没收录  —— 强证据遗漏
  B note 里的词伙在全书 1833 句里一次都找不到     —— 词伙没落在课文里（可能是书来的，也可能写错）
"""
import json, re, os, collections

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = json.load(open(os.path.join(ROOT, 'data/sections.json'), encoding='utf-8'))
V = json.load(open(os.path.join(ROOT, 'data/vocab.json'), encoding='utf-8'))
BOOK = json.load(open(os.path.join(ROOT, 'work/colloc-zh/book_pairs.json'), encoding='utf-8'))['pairs']

STOP = set('the a an to of in on for and or at by with is are be as it that this some any no not but from into over under their his her its our your my'.split())
CJK = re.compile(r'[\u4e00-\u9fff]')

def norm(s):
    s = s.lower().replace('’', "'")
    s = re.sub(r'\([^)]*\)', ' ', s)
    s = re.sub(r'[^a-z0-9\- ]', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    s = re.sub(r'^(a|an|the)\s+', '', s)
    return s

book_norm = {norm(k): v for k, v in BOOK.items()}

# 收集句子文本（去标记）
sents = []   # (chapter, para, sent, plain_text, [(word, surface_chars)])
for ci, ch in enumerate(S):
    for pi, para in enumerate(ch['paragraphs']):
        for si, raw in enumerate(para):
            marks = []
            def repl(m):
                marks.append((m.group(1).lower(), m.group(2)))
                return m.group(2)
            plain = re.sub(r'\[\[([^\]:]+):([^\]]+)\]\]', repl, raw)
            sents.append((ci, pi, si, plain, marks))

alltext = ' '.join(s[3] for s in sents).lower()

# 1) note 里的词伙在课文里能否找到
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

missing_in_text = []
for w, v in V.items():
    note = (v or {}).get('note', '')
    if '词伙：' not in note:
        continue
    rest = note.split('词伙：', 1)[1].split('同义词：')[0]
    for c in split_collocs(rest):
        body = norm(c)
        if not body:
            continue
        # 允许词形变化：取实词词干粗略匹配
        toks = [t for t in body.split() if t not in STOP]
        if not toks:
            continue
        hit = all(re.search(r'\b' + re.escape(t[:max(4, len(t)-2)]) , alltext) for t in toks)
        if not hit:
            missing_in_text.append((w, c))
print('note 词伙在课文里找不到的:', len(missing_in_text))
for x in missing_in_text[:15]:
    print('   ', x)

# 2) 句子里出现、书里有、note 没收录
STOP2 = STOP | set('that which who whom whose when where why how'.split())
added = []
for ci, pi, si, plain, marks in sents:
    toks = re.findall(r"[A-Za-z][A-Za-z'\-]*", plain)
    low = [t.lower() for t in toks]
    for w, surf in marks:
        idxs = [i for i, t in enumerate(low) if t == surf.lower() or t.rstrip('s') == surf.lower()]
        for i in idxs:
            for n in (2, 3, 4):
                for st in range(max(0, i - n + 1), i + 1):
                    if st + n > len(low):
                        continue
                    gram = low[st:st+n]
                    if gram[0] in STOP2 or gram[-1] in STOP2:
                        continue
                    cand = ' '.join(gram)
                    if cand not in book_norm:
                        continue
                    note = (V.get(w, {}) or {}).get('note', '')
                    if norm(cand) in norm(note.split('词伙：')[-1]):
                        continue
                    added.append((w, cand, book_norm[cand], ci, pi, si))
uniq = collections.OrderedDict()
for w, c, zh, ci, pi, si in added:
    uniq.setdefault((w, c), (zh, ci, pi, si))
print('\n书里有 + 句子里真出现 + note 没收录:', len(added), '去重', len(uniq))
for (w, c), (zh, ci, pi, si) in list(uniq.items())[:30]:
    print('   %-16s %-38s %s' % (w, c, zh))
json.dump([{'w': w, 'colloc': c, 'zh': zh, 'at': [ci, pi, si]} for (w, c), (zh, ci, pi, si) in uniq.items()],
          open(os.path.join(ROOT, 'work/colloc-zh/omission_candidates.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=0)
