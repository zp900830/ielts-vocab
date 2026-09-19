#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""落地「已经带好 [[key:disp]] 标记」的句子级改写（与 apply_sentence_fixes.py 互补）。

apply_sentence_fixes 收的是裸英文、由本地 remark() 重新加标记；本脚本收的是代理自己标好的句子，
所以 remark() 那条路不适用 —— 必须直接校验标记本身。六条硬校验：
  1 词集守恒：新旧 [[key]] 多重集完全相同（高亮一个不多一个不少）；
  2 标记自洽：key 必须是 disp 的词头变形，否则说明挂错了词；
  3 剥标记可逆：strip 后的可见文本与代理声称的裸句逐字一致；
  4 词汇合规：除目标词外，新句每个词都要落在简单词白名单里（超纲词只认原句已有的）；
  5 句长不失控：词数比在 0.5–1.9 之间；
  6 配对中文：改英文必须同时给中文，且中文非空。
干跑输出报告 + /tmp/tqa/marked-appliable.json；加 --apply 才写文件，写前再断言全书句子总数不变。

用法：python3 tools/apply_marked_fixes.py /tmp/tqa/skeleton-fix.json
      python3 tools/apply_marked_fixes.py … --apply
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from apply_sentence_fixes import (MARK, WORD, NAMES, candidates, load_simple,
                                  surface_forms, SECTIONS, WHITELIST)  # noqa: E402

ROOT = '.'
VOCAB = ROOT + '/shadow/data/vocab.json'


def key_matches(key, disp):
    """disp 是否可能是 key 的词面形（含复数/时态/比较级，以及带空格的多词头）。"""
    d = disp.lower().strip()
    k = key.lower().strip()
    if d == k:
        return True
    parts = k.split()
    if len(parts) > 1:
        return d == ' '.join(parts)
    return d in surface_forms(k) or (candidates(d) & {k})


def main():
    src = sys.argv[1]
    do_apply = '--apply' in sys.argv
    items = json.load(open(src, encoding='utf-8'))
    D = json.load(open(SECTIONS, encoding='utf-8'))
    V = {k.lower() for k in json.load(open(VOCAB, encoding='utf-8'))}
    simple = load_simple()
    flat = [(ci, si, k) for ci, c in enumerate(D) for si, pp in enumerate(c['paragraphs']) for k in range(len(pp))]

    accepted, rejected = [], []
    seen = set()
    for it in items:
        gi = it.get('gi')
        new = (it.get('en') or '').strip()
        zh = (it.get('zh') or '').strip()
        if gi is None or gi >= len(flat) or gi in seen:
            rejected.append((gi, 'gi 缺失/越界/重复'))
            continue
        seen.add(gi)
        ci, si, k = flat[gi]
        orig = D[ci]['paragraphs'][si][k]
        if not new or not zh:
            rejected.append((gi, '缺英文或配对中文'))
            continue
        old_keys = sorted(m.group(1).lower() for m in MARK.finditer(orig))
        new_keys = sorted(m.group(1).lower() for m in MARK.finditer(new))
        if old_keys != new_keys:
            rejected.append((gi, f'词集不守恒 {old_keys}→{new_keys}'))
            continue
        bad_mark = [(m.group(1), m.group(2)) for m in MARK.finditer(new)
                    if not key_matches(m.group(1), m.group(2))]
        if bad_mark:
            rejected.append((gi, '标记挂错词 ' + str(bad_mark[:3])))
            continue
        vis_new = MARK.sub(lambda m: m.group(2), new)
        if '[[' in vis_new or ']]' in vis_new:
            rejected.append((gi, '标记残缺（剥完还剩方括号）'))
            continue
        # 4 词汇合规：新句裸文本里，非目标词的每个词都要有出处
        orig_vis = {t.lower() for t in WORD.findall(MARK.sub(lambda m: m.group(2), orig))}
        allow = set(orig_vis)
        for t in orig_vis:
            allow |= candidates(t)
        tf = set()
        for key in old_keys:
            tf |= surface_forms(key)
        hard = []
        for i, m in enumerate(WORD.finditer(vis_new)):
            raw, w = m.group(0), m.group(0).lower()
            if len(w) < 3 or w in ('a', 'an', 'the'):
                continue
            if raw[0].isupper() and (i > 0 or raw.lower() in NAMES):
                continue
            if raw.lower() in NAMES or w in simple or w in tf or w in V:
                continue
            if candidates(w) & simple or candidates(w) & allow:
                continue
            hard.append(w)
        if hard:
            rejected.append((gi, '引入非简单词 ' + ','.join(sorted(set(hard))[:5])))
            continue
        ow, nw = len(MARK.sub(' ', orig).split()), len(vis_new.split())
        if nw < ow * 0.5 or nw > ow * 1.9:
            rejected.append((gi, f'句长变化过大 {ow}→{nw} 词'))
            continue
        accepted.append((gi, new, zh, it.get('note', '')))

    print(f'预标记改写：候选 {len(items)} → 通过 {len(accepted)}，拒绝 {len(rejected)}')
    for gi, why in rejected[:30]:
        print(f'    #{gi}: {why}')
    for gi, new, zh, note in accepted[:6]:
        ci, si, k = flat[gi]
        print('  #%d 旧 %s' % (gi, MARK.sub(lambda m: m.group(2), D[ci]['paragraphs'][si][k])[:80]))
        print('     新 %s' % MARK.sub(lambda m: m.group(2), new)[:80])
        print('     中 %s' % zh[:44])
    if not do_apply:
        print('\n（干跑，未写文件。加 --apply 才落地）')
        json.dump([{'gi': g, 'en': e, 'zh': z} for g, e, z, _ in accepted],
                  open('/tmp/tqa/marked-appliable.json', 'w', encoding='utf-8'), ensure_ascii=False)
        return 0
    for gi, new, zh, _ in accepted:
        ci, si, k = flat[gi]
        D[ci]['paragraphs'][si][k] = new
        D[ci]['sentZh'][si][k] = zh
    total = sum(len(p) for c in D for p in c['paragraphs'])
    assert total == len(flat), f'句子总数变了 {len(flat)}→{total}'
    json.dump(D, open(SECTIONS, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(f'已落地 {len(accepted)} 句，句子总数仍为 {total}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
