#!/usr/bin/env python3
"""从 3.0 OCR 全文里抽「中文 + 英文搭配」行，修 OCR 错拼，输出 book_pairs_v30.json"""
import json, re, os, collections

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = '/tmp/v30_body.txt'
OUT = os.path.join(ROOT, 'work/colloc-zh/book_pairs_v30.json')

CJK = re.compile(r'[\u4e00-\u9fff]')
LAT = re.compile(r'[A-Za-z]')

TOKEN_FIX = {
    'potentia': 'potential', 'likelinood': 'likelihood', 'schoo': 'school',
    'abilties': 'abilities', 'responsioiities': 'responsibilities', 'supjects': 'subjects',
    'iliteracy': 'illiteracy', 'opinior': 'opinion', 'facilties': 'facilities',
    'eamning': 'earning', 'tevitalise': 'revitalise', 'polliutants': 'pollutants',
    'conficting': 'conflicting', 'aise': 'raise', 'einforce': 'reinforce',
    'wildife': 'wildlife', 'driling': 'drilling', 'festiva': 'festival',
    'ajust': 'adjust', 'vpluntary': 'voluntary', 'fulfiling': 'fulfilling',
    'thinkingskils': 'thinking skills', 'intellectualjobs': 'intellectual jobs',
    'onjobs': 'on jobs', 'offriendship': 'of friendship', 'thejob': 'the job',
    'ajob': 'a job', 'al-generated': 'AI-generated',
}

lines = [l.strip() for l in open(SRC, encoding='utf-8') if l.strip()]
pairs, seen = [], set()
for s in lines:
    if s.startswith('### PAGE') or not (CJK.search(s) and LAT.search(s)):
        continue
    if LAT.match(s[:1]):                    # 英文在前
        m = CJK.search(s)
        en, zh = s[:m.start()], s[m.start():]
    else:                                   # 中文在前（3.0 表格的常态）
        m = LAT.search(s)
        zh, en = s[:m.start()], s[m.start():]
    en = en.strip(' ,，.。:：;；')
    zh = zh.strip(' ,，.。:：;；')
    if not en or not zh:
        continue
    # 逐词修 OCR
    en = re.sub(r"[A-Za-z][A-Za-z'\-]*", lambda m: TOKEN_FIX.get(m.group(0).lower(), m.group(0)), en)
    en = re.sub(r'\s+', ' ', en).strip()
    if not (2 <= len(en.split()) <= 8):
        continue
    if re.search(r'[0-9]', en):
        continue
    if not re.fullmatch(r"[A-Za-z][A-Za-z'’\- ,/&()]*", en):
        continue
    if not (2 <= len(zh) <= 28) or len(CJK.findall(zh)) < 2:
        continue
    if LAT.search(zh):
        continue
    k = en.lower()
    if k in seen:
        continue
    seen.add(k)
    pairs.append((en, zh))

json.dump(pairs, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('3.0 词伙对', len(pairs))
print('长度分布', collections.Counter(len(e.split()) for e, z in pairs).most_common())
for en, zh in pairs[2000:2020]:
    print(' ', en, '|', zh)
