# -*- coding: utf-8 -*-
"""导出全部修复点的精确原文 / 译文 / keys / 上下文，供 apply_fixes.py 使用。"""
import json, re, io, sys

ROOT = '/Users/pengzhou/Library/Mobile Documents/com~apple~CloudDocs/词汇真经单词速记'
sec = json.load(open(ROOT + '/data/sections.json', encoding='utf-8'))

MARK = re.compile(r'\[\[([^:\]]+):([^\]]*)\]\]')

def keys_of(s):
    return [m.group(1) for m in MARK.finditer(s)]

def strip_marks(s):
    return MARK.sub(lambda m: m.group(2), s)

TARGETS = [
    # ch0
    (0, 14, 5), (0, 15, 2), (0, 14, 1), (0, 14, 2), (0, 15, 3), (0, 15, 4),
    (0, 50, 5), (0, 50, 0), (0, 50, 4),
    (0, 45, 0), (0, 45, 4), (0, 46, 2), (0, 48, 3), (0, 48, 5), (0, 50, 3),
    (0, 51, 1), (0, 51, 2), (0, 52, 5), (0, 53, 1), (0, 55, 2), (0, 57, 2),
    # ch1
    (1, 8, 5), (1, 12, 3), (1, 12, 5), (1, 13, 0), (1, 18, 7), (1, 6, 0), (1, 10, 0),
    # ch2
    (2, 17, 3), (2, 18, 0), (2, 18, 1), (2, 24, 3), (2, 26, 2), (2, 28, 0),
    # ch3 - S3-1 host
    (3, 1, 3), (3, 4, 0), (3, 6, 3), (3, 11, 1), (3, 22, 4),
    (3, 21, 3), (3, 24, 0), (3, 26, 3), (3, 29, 0), (3, 36, 3),
    # ch3 - 大小写 / 裁定
    (3, 15, 3), (3, 20, 1), (3, 21, 0), (3, 16, 2), (3, 16, 3),
    (3, 42, 1), (3, 58, 6), (3, 52, 4), (3, 56, 1), (3, 49, 5),
    # ch3 - 重复句
    (3, 19, 3), (3, 39, 3), (3, 21, 2), (3, 30, 5),
    (3, 14, 0), (3, 19, 0), (3, 34, 0), (3, 39, 0),
    (3, 9, 5), (3, 34, 5), (3, 21, 4), (3, 23, 4),
    # ch4
    (4, 26, 5), (4, 31, 3), (4, 31, 0), (4, 25, 4), (4, 26, 0), (4, 29, 5),
    (4, 18, 0), (4, 35, 4), (4, 19, 2),
    # ch5
    (5, 35, 3), (5, 35, 4), (5, 36, 0), (5, 36, 1), (5, 36, 4), (5, 38, 4),
    (5, 23, 6), (5, 24, 3),
]

out = io.StringIO()
def w(s=''):
    out.write(s + '\n')

for (ci, pi, si) in TARGETS:
    ch = sec[ci]
    paras = ch['paragraphs']
    zhs = ch['sentZh']
    if pi >= len(paras) or si >= len(paras[pi]):
        w(f'!! [MISSING] [{ci}.{pi}.{si}]')
        continue
    en = paras[pi][si]
    zh = zhs[pi][si] if pi < len(zhs) and si < len(zhs[pi]) else '(no zh)'
    ks = keys_of(en)
    w(f'--- [{ci}.{pi}.{si}] keys={ks}')
    w(f'EN: {en}')
    w(f'ZH: {zh}')
    w(f'plain: {strip_marks(en)}')

# 篇2 外婆全表
w('')
w('===== 篇2 含「外婆」的句子全表 =====')
ch2 = sec[2]
for pi, para in enumerate(ch2['sentZh']):
    for si, zh in enumerate(para):
        if '外婆' in zh:
            w(f'[{2}.{pi}.{si}] ZH: {zh}')
            w(f'    EN: {ch2["paragraphs"][pi][si]}')
            w(f'    PJ: {ch2["paraZh"][pi][:60]}')

# 篇2 含「奶奶」
w('')
w('===== 篇2 含「奶奶」的句子全表（前 12 条）=====')
cnt = 0
for pi, para in enumerate(ch2['sentZh']):
    for si, zh in enumerate(para):
        if '奶奶' in zh:
            cnt += 1
            if cnt <= 12:
                w(f'[{2}.{pi}.{si}] ZH: {zh}')
if cnt > 12:
    w(f'... 共 {cnt} 条')

# 篇0 里奥/利奥
w('')
w('===== 篇0 里奥 / 利奥 全表 =====')
ch0 = sec[0]
for label in ('里奥', '利奥'):
    n = 0
    for pi, para in enumerate(ch0['sentZh']):
        for si, zh in enumerate(para):
            if label in zh:
                n += 1
                w(f'{label} [{0}.{pi}.{si}] {zh}')
    w(f'-- {label} 共 {n} 处（sentZh）')
    npz = sum(1 for x in ch0['paraZh'] if label in x)
    w(f'-- {label} paraZh {npz} 处')

# 篇1 萨姆/山姆
w('')
w('===== 篇1 萨姆 / 山姆 =====')
ch1 = sec[1]
for label in ('萨姆', '山姆'):
    n = 0
    for pi, para in enumerate(ch1['sentZh']):
        for si, zh in enumerate(para):
            if label in zh:
                n += 1
                w(f'{label} [{1}.{pi}.{si}] {zh}')
    w(f'-- 共 {n}')

# 篇0 P16-P19 全文（时态样板）
w('')
w('===== 篇0 P16–P19 全文 =====')
for pi in (16, 17, 18, 19):
    w(f'--- para {pi}  paraZh: {ch0["paraZh"][pi]}')
    for si, en in enumerate(ch0['paragraphs'][pi]):
        w(f'  [{0}.{pi}.{si}] keys={keys_of(en)}')
        w(f'    EN: {en}')
        zh = ch0['sentZh'][pi][si]
        w(f'    ZH: {zh}')

# 篇5 P35-P38 全文
w('')
w('===== 篇5 P35–P38 全文 =====')
ch5 = sec[5]
for pi in (35, 36, 37, 38):
    if pi >= len(ch5['paragraphs']):
        w(f'--- para {pi} MISSING')
        continue
    w(f'--- para {pi}  paraZh: {ch5["paraZh"][pi]}')
    for si, en in enumerate(ch5['paragraphs'][pi]):
        w(f'  [{5}.{pi}.{si}] keys={keys_of(en)}')
        w(f'    EN: {en}')
        zh = ch5['sentZh'][pi][si]
        w(f'    ZH: {zh}')

# 篇5 subheads
w('')
w('===== 各篇 subheads =====')
for ci, ch in enumerate(sec):
    nz = [(i, s) for i, s in enumerate(ch['subheads']) if s]
    w(f'ch{ci}: {nz}')

# 篇2 P17/P18/P24 上下文
w('')
w('===== 篇2 P17–P18 / P24 段落全文 =====')
for pi in (17, 18, 24):
    w(f'--- para {pi}  paraZh: {ch2["paraZh"][pi]}')
    for si, en in enumerate(ch2['paragraphs'][pi]):
        w(f'  [{2}.{pi}.{si}] keys={keys_of(en)}')
        w(f'    EN: {en}')
        w(f'    ZH: {ch2["sentZh"][pi][si]}')

# 篇4 P25-P26 / P29 / P31 / P18 / P35
w('')
w('===== 篇4 P25/P26/P29/P31/P18/P19/P35 全文 =====')
ch4 = sec[4]
for pi in (25, 26, 29, 31, 18, 19, 35):
    if pi >= len(ch4['paragraphs']):
        w(f'--- para {pi} MISSING')
        continue
    w(f'--- para {pi}  paraZh: {ch4["paraZh"][pi]}')
    for si, en in enumerate(ch4['paragraphs'][pi]):
        w(f'  [{4}.{pi}.{si}] keys={keys_of(en)}')
        w(f'    EN: {en}')
        w(f'    ZH: {ch4["sentZh"][pi][si]}')

# 篇3 P1/P4/P6/P11/P22 + P21/P24/P26/P29/P36 上下文
w('')
w('===== 篇3 host 相关段落全文 =====')
ch3 = sec[3]
for pi in (1, 4, 6, 11, 21, 22, 24, 26, 29, 36):
    if pi >= len(ch3['paragraphs']):
        w(f'--- para {pi} MISSING')
        continue
    w(f'--- para {pi}  paraZh: {ch3["paraZh"][pi]}')
    for si, en in enumerate(ch3['paragraphs'][pi]):
        w(f'  [{3}.{pi}.{si}] keys={keys_of(en)}')
        w(f'    EN: {en}')
        w(f'    ZH: {ch3["sentZh"][pi][si]}')

# 篇3 重复句与裁定句段落
w('')
w('===== 篇3 重复句/裁定句段落全文 =====')
for pi in (14, 16, 19, 30, 34, 39, 42, 52, 56, 58, 9, 23, 15, 20, 49):
    if pi >= len(ch3['paragraphs']):
        w(f'--- para {pi} MISSING')
        continue
    w(f'--- para {pi}  paraZh: {ch3["paraZh"][pi]}')
    for si, en in enumerate(ch3['paragraphs'][pi]):
        w(f'  [{3}.{pi}.{si}] keys={keys_of(en)}')
        w(f'    EN: {en}')
        w(f'    ZH: {ch3["sentZh"][pi][si]}')

open(ROOT + '/work/storyfix/dump.txt', 'w', encoding='utf-8').write(out.getvalue())
print('written:', len(out.getvalue()), 'chars')
print('lines:', out.getvalue().count('\n'))
