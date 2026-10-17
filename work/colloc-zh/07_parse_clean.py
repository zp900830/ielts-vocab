#!/usr/bin/env python3
"""从去水印 2.0 重扫件（PDF 208–231）抽附录1 的「英文搭配 + 中文释义」。
输出 work/colloc-zh/book_pairs_clean.json
"""
import json, re, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = '/tmp/v20_appendix.txt'
OUT = os.path.join(ROOT, 'work/colloc-zh/book_pairs_clean.json')

lines = open(SRC, encoding='utf-8').read().split('\n')
# 只取附录1：从「附录 1：全书词伙分类列表」到「附录2」
start = next(i for i, l in enumerate(lines) if '全书词伙分类列表' in l)
end = next(i for i, l in enumerate(lines) if l.strip().startswith('附录2'))
lines = lines[start:end]

CJK = re.compile(r'[\u4e00-\u9fff]')
LATIN = re.compile(r'[A-Za-z]')
JUNK = re.compile(r'(电子书|微信|公众号|IELTS下载|彬仔|扫码|免费提供|请勿出售|^### PAGE|^第?\d+$)')
HEADER = re.compile(r'^(屋|届|尾).*(手把手|词伙)')

def clean(s):
    s = s.replace('\u00a0', ' ').strip()
    s = re.sub(r'\s+', ' ', s)
    return s

raw = []
for l in lines:
    s = clean(l)
    if not s or JUNK.search(s) or HEADER.search(s):
        continue
    if re.fullmatch(r'\d{1,3}', s):
        continue
    raw.append(s)

pairs = []          # [(en, zh)]
seen = set()
pending = None

def norm_en(s):
    s = s.strip().lower().replace('’', "'")
    s = re.sub(r'\s+', ' ', s)
    return s

for s in raw:
    has_l, has_c = bool(LATIN.search(s)), bool(CJK.search(s))
    if has_l and has_c:
        m = CJK.search(s)
        if LATIN.match(s):
            en, zh = s[:m.start()], s[m.start():]
        else:
            m2 = list(LATIN.finditer(s))
            if not m2:
                continue
            en, zh = s[m2[0].start():], s[:m2[0].start()]
        en = en.strip(' ,.;:，。')
        zh = zh.strip(' ,.;:，。')
        if en and zh and LATIN.search(en) and CJK.search(zh):
            k = norm_en(en)
            if k not in seen:
                seen.add(k); pairs.append((en, zh))
            pending = None
    elif has_l:
        if len(s.split()) <= 4 and s[:1].isupper() and not s.endswith('.'):
            pending = None          # 话题标题
            continue
        pending = s
    elif has_c:
        if pending:
            k = norm_en(pending)
            if k not in seen:
                seen.add(k); pairs.append((pending, s))
            pending = None

print('原始行', len(raw), '| 抽出对照', len(pairs))
json.dump(pairs, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
for en, zh in pairs[:12]:
    print(' ', en, '=>', zh)
