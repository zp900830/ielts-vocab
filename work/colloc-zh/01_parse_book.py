#!/usr/bin/env python3
"""从 2.0 版 OCR 的附录1「全书词伙分类列表」抽出 英文搭配 → 中文释义 对照表。"""
import json, re, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'work/ref/gjb_book.txt')
OUT = os.path.join(ROOT, 'work/colloc-zh/book_pairs.json')

lines = open(SRC, encoding='utf-8').read().split('\n')
start = next(i for i, l in enumerate(lines)
             if l.strip().startswith('附录1：全书词伙分类列表') and '198' not in l)
end = next(i for i, l in enumerate(lines)
           if l.strip().startswith('附录2：百搭观点列表') and '221' not in l)

CJK = re.compile(r'[\u4e00-\u9fff]')
LATIN = re.compile(r'[A-Za-z]')
JUNK = re.compile(r'(电子书|微信|公众号|IELTS下载|彬仔|扫码|免费提供|请勿出售|^### PAGE|^第?\d+$|^[^\w\u4e00-\u9fff]+$)')
# 只在这些行里出现的东西一律当噪声：页眉页脚、水印
def clean(s):
    s = s.replace('\u00a0', ' ').strip()
    s = re.sub(r'\s+', ' ', s)
    return s

raw = []
for l in lines[start:end]:
    s = clean(l)
    if not s or JUNK.search(s):
        continue
    raw.append(s)

# 话题标题：纯英文、首字母大写、词数 <=4、且下一行不是它的中文延续
pairs = {}          # 规范化英文 -> 中文
topic_headers = []
pending_en = None   # 上一行只有英文，等下一行的中文续行

def norm_en(s):
    s = s.strip().lower()
    s = s.replace('’', "'").replace('‘', "'")
    s = re.sub(r'\s+', ' ', s)
    s = re.sub(r'[.,;:]+$', '', s)
    s = re.sub(r'^(a|an|the)\s+', '', s)
    return s.strip()

for s in raw:
    has_l, has_c = bool(LATIN.search(s)), bool(CJK.search(s))
    if has_l and has_c:
        # 英文在前、中文在后（少数中文在前）
        m = CJK.search(s)
        if m and LATIN.match(s):
            en = s[:m.start()].strip(' ,.;:')
            zh = s[m.start():].strip()
        else:
            # 中文在前，找最后一个英文串
            m2 = list(LATIN.finditer(s))
            if not m2:
                continue
            en = s[m2[0].start():].strip(' ,.;:')
            zh = s[:m2[0].start()].strip()
        en = en.strip()
        if not en or not LATIN.search(en):
            continue
        if not zh or not CJK.search(zh):
            continue
        pairs.setdefault(norm_en(en), zh)
        pending_en = None
    elif has_l:
        if len(s.split()) <= 4 and s[:1].isupper() and not s.endswith('.'):
            topic_headers.append(s)
            pending_en = None
            continue
        pending_en = s
    elif has_c:
        if pending_en:
            pairs.setdefault(norm_en(pending_en), s)
            pending_en = None

print('原始行', len(raw), '| 话题标题', len(topic_headers), '| 抽到对照', len(pairs))
json.dump({'pairs': pairs, 'headers': topic_headers}, open(OUT, 'w', encoding='utf-8'),
          ensure_ascii=False, indent=0)
print('样例:')
for i, (k, v) in enumerate(pairs.items()):
    if i % 120 == 0:
        print(' ', k, '=>', v)
