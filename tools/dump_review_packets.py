#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""为「四层文本全量排查」生成每章送审包（供子代理逐条语义判定，只读）。

每章一个 JSON：
  sentences[]  —— 全章每一句：裸英文、中文译文、可点词（含该词词条全文）
  glossSuspect[] —— 行内词义可能选错的高危子集：该词词条本身跨词性（n. + v. 并存），
                    而行内小字永远显示第一个义项，所以这句里若用的是另一个意思就是错的
  notes[]      —— 本章可点词的辨析卡原文 + 同句/同章里真实共现的近义目标词

用法：python3 tools/dump_review_packets.py /tmp/tqa/packet-ch
"""
import json
import re
import sys
import collections

IPOS = r'^\s*([nva]|ad|prep|conj|pron|num|int|aux|vt|vi)\.?'
MAP = {'n': 'noun', 'v': 'verb', 'vt': 'verb', 'vi': 'verb', 'a': 'adj', 'ad': 'adv'}


def senses(m):
    out = []
    cur = None
    for seg in re.split(r'[；;]', str(m)):
        seg = seg.strip()
        if not seg:
            continue
        g = re.match(IPOS, seg)
        if g:
            cur = MAP.get(g.group(1), g.group(1))
        out.append({'pos': cur, 'text': seg})
    return out


def strip_markers(s):
    return re.sub(r'\[\[([^\]:]+):([^\]]+)\]\]', r'\2', s)


def main():
    prefix = sys.argv[1] if len(sys.argv) > 1 else '/tmp/tqa/packet-ch'
    D = json.load(open('shadow/data/sections.json', encoding='utf-8'))
    V = json.load(open('shadow/data/vocab.json', encoding='utf-8'))
    for ci, c in enumerate(D):
        sentences, gloss_suspect = [], []
        gi = sum(len(p) for cc in D[:ci] for p in cc['paragraphs'])
        chap_tokens = collections.Counter(
            w.lower() for para in c['paragraphs'] for s in para
            for w in re.findall(r"[A-Za-z][A-Za-z'’-]*", strip_markers(s)))
        for si, para in enumerate(c['paragraphs']):
            for k, sent in enumerate(para):
                vis = strip_markers(sent)
                marks = []
                for key, disp in re.findall(r'\[\[([^\]:]+):([^\]]+)\]\]', sent):
                    key = key.lower()
                    e = V.get(key) or {}
                    marks.append({'key': key, 'disp': disp, 'm': e.get('m', ''),
                                  'has_note': bool(e.get('note'))})
                sentences.append({'gi': gi, 'para': si, 'sent': k, 'en': vis,
                                  'zh': c['sentZh'][si][k], 'marks': marks})
                for mk in marks:
                    sp = {s['pos'] for s in senses(mk['m']) if s['pos']}
                    if len(sp) > 1:
                        gloss_suspect.append({'gi': gi, 'key': mk['key'], 'disp': mk['disp'],
                                              'senses': senses(mk['m']), 'shown': mk['m'],
                                              'en': vis, 'zh': c['sentZh'][si][k]})
                gi += 1
        notes = []
        for w in sorted({str(x).lower() for x in c['words']}):
            e = V.get(w)
            if not e or not e.get('note'):
                continue
            n = e['note']
            named = {x.lower() for x in re.findall(r'\b([A-Za-z][A-Za-z,-]{2,})\b', str(n))}
            notes.append({'key': w, 'm': e.get('m', ''), 'note': n,
                          'ex': e.get('ex', ''), 'exZh': e.get('exZh', ''),
                          'co_occur_in_chapter': sorted(o for o in named if chap_tokens.get(o)),
                          'absent_from_chapter': sorted(o for o in named if not chap_tokens.get(o))})
        pkt = {'chapter': ci, 'title': c['title'], 'zh': c['zh'],
               'n_sentences': len(sentences), 'sentences': sentences,
               'gloss_suspect': gloss_suspect, 'notes': notes}
        out = f'{prefix}{ci}.json'
        json.dump(pkt, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print(f'{out}：{len(sentences)} 句 / 行内词义嫌疑 {len(gloss_suspect)} 处 / 有辨析卡的词 {len(notes)} 个')


if __name__ == '__main__':
    main()
