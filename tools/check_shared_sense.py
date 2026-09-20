#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""辨析清单可信度体检：只做不含语义判断的两条硬核对。

为什么不做「共享义项撞不撞」的机检：课文中文是意译，同一义项会给好几种说法
（dawn=拂晓、sunrise=日出，都属"黎明"却都不含"黎明"二字）。拿中文子串当判据会
凭空造出一批假缺口 —— 与早前"11 个词课文里找不到"同一类事故（词形表太窄）。
所以那一类判断留给读得懂中文的人（起草代理逐组读过并上报），脚本只出可复核的数。

输出：
  A 成员是否真的以 [[词头:表面]] 出现在声称的共现段里 —— 段末渲染要靠这个定位。
  B 证据厚度：每组在全书有多少处标记、覆盖多少段，用来定"最薄的那批有多薄"。
"""
import json, re, collections
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MARK = re.compile(r'\[\[([^\]:]+):([^\]]+)\]\]')
SECS = json.loads((ROOT / 'shadow/data/sections.json').read_text(encoding='utf-8'))
WL = json.loads((ROOT / 'work/compare_groups_worklist.json').read_text(encoding='utf-8'))

# 全书每个词头出现在哪些 (章, 段)
where = collections.defaultdict(set)
count = collections.Counter()
for ci, sec in enumerate(SECS):
    for pi, sents in enumerate(sec['paragraphs']):
        for s in sents:
            for head, _surf in MARK.findall(s):
                h = head.strip().lower()
                where[h].add((ci, pi))
                count[h] += 1

rows = []
for gi, g in enumerate(WL):
    words = [w.strip().lower() for w in g['words']]
    paras = [tuple(p) for p in g['paras']]
    # A：声称的段里，是否每个成员都被标记
    absent = [(w, p) for w in words for p in paras if p not in where.get(w, set())]
    co_paras = [p for p in paras if all(p in where.get(w, set()) for w in words)]
    # B：证据厚度 —— 组内成员全书标记数的最小值，以及共现段数
    thin = min(count.get(w, 0) for w in words)
    rows.append({'gi': gi, 'words': g['words'], 'senses': g['senses'],
                 'claimed_paras': [list(p) for p in paras],
                 'true_co_paras': [list(p) for p in co_paras],
                 'absent': [[w, list(p)] for w, p in absent],
                 'min_attest': thin, 'all_syn': g.get('all_synonyms')})

bad = [r for r in rows if r['absent']]
print(f'共 {len(rows)} 组')
print(f'\nA. 声称共现但某成员未被标记在该段：{len(bad)} 组')
for r in bad[:25]:
    print(f"  #{r['gi']:>3} {'/'.join(r['words']):<26} 缺席 {[(w, tuple(p)) for w, p in r['absent']]}")
    print(f"       真实共现段: {r['true_co_paras']}")

noco = [r for r in rows if not r['true_co_paras']]
print(f'\nA\'. 按真实标记算，一组共现段都没有（清单口径要重算）：{len(noco)} 组')
for r in noco[:20]:
    print(f"  #{r['gi']:>3} {'/'.join(r['words']):<26} 各成员位置 {[(w, sorted(where.get(w,set()))[:4]) for w in [x.lower() for x in r['words']]]}")

dist = collections.Counter(r['min_attest'] for r in rows)
print('\nB. 证据厚度（组内最少书证那一侧的标记数）：')
for k in sorted(dist):
    print(f'  {k:>2} 处: {dist[k]:>3} 组')
one = [r for r in rows if r['min_attest'] <= 1]
print(f'  → 最薄一侧只有 1 处书证的: {len(one)} 组（占 {len(one)/len(rows)*100:.0f}%）')
json.dump(rows, (ROOT / 'work/sense_check_220.json').open('w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
print('\n明细: work/sense_check_220.json')
