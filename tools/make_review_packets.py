#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""门禁 2 送审包：把门禁 1 通过的东西切成可并行审核的包，只写不改判定。

上一轮这一步是在对话里临时拼的，结果包格式和 merge_review.py 的对齐全靠手抄，
重跑一次就要重新想一遍。落成脚本有三个原因：
 1 review_in/*.json 的字段名必须和 merge_review.py 读的一致（syn 用 s、col 用 c），
   错了就整包「无结论」，而 merge_review 对无结论是报错不是放行 —— 报错发生在最后。
 2 shape_in 只喂 T（课文切片）。带 B/M 出处的词伙是 PDF 上印着的原文，
   用户 2026-09-19 拍板「低价值不砍」，把它们再送去专判就是重复否决。
 3 每条 T 词伙都要配上课文原句和中文译文，代理判「偶然相邻」必须看上下文；
   定位不到原句的单列出来，别悄悄丢。

用法：python3 tools/make_review_packets.py [--per 180] [--shape-per 240]
"""
import glob
import json
import os
import re
import sys

ROOT = '/Users/zhoupeng/Library/Mobile Documents/com~apple~CloudDocs/雅思背单词项目'
MARK = re.compile(r'\[\[([^\]:]+):([^\]]+)\]\]')


def arg(name, default):
    return next((sys.argv[i + 1] for i, a in enumerate(sys.argv)
                 if a == '--' + name and i + 1 < len(sys.argv)), default)


def bare(s):
    return MARK.sub(lambda m: m.group(2), s)


def locate(chunk, heads):
    """在课文里找包含这条搭配的整句，返回 (英文原句, 中文译文)。

    必须整词匹配：'old foe' 不该被 'copper fold' 这种连排命中。
    候选是课文小写化之后切的，原句里却是 Arctic ice —— 所以只把被搜索的句子转小写。
    词与词之间允许原文的逗号/句号：窗口是从标点后重新拼的，'heavy sleepy ox'
    在原句里其实是 "heavy, sleepy ox"，按单空格匹配就永远定位不到，
    代理只能对着切片瞎判 —— 而这恰恰是该看标点的形状。
    """
    pat = re.compile(r'(?<![a-z])' + re.escape(chunk).replace(r'\ ', r'[,. ]+') + r'(?![a-z])')
    for en, zh in heads:
        if pat.search(en.lower()):
            return en, zh
    return None, None


def main():
    clean = json.load(open(ROOT + '/work/cardgen/clean.json', encoding='utf-8'))
    V = json.load(open(ROOT + '/shadow/data/vocab.json', encoding='utf-8'))
    D = json.load(open(ROOT + '/shadow/data/sections.json', encoding='utf-8'))
    sentences = [(bare(en), (D[ci]['sentZh'][si][k] if k < len(D[ci]['sentZh'][si]) else ''))
                 for ci, c in enumerate(D) for si, p in enumerate(c['paragraphs'])
                 for k, en in enumerate(p)]
    vk = {k.lower(): v for k, v in V.items()}
    for d in ('review_in', 'shape_in'):
        p = f'{ROOT}/work/cardgen/{d}'
        for f in glob.glob(p + '/*'):
            os.remove(f)
        os.makedirs(p, exist_ok=True)

    items, shape = [], []
    for e in clean:
        w = e['w']
        v = vk.get(w) or {}
        it = {'w': w, 'm': v.get('m', ''), 'ex': v.get('ex', ''), 'exZh': v.get('exZh', ''),
              'overlap': e.get('overlap_col'),
              'syn': [{'s': x['s'], 'src': x['src']} for x in e.get('syn') or []],
              'col': [{'c': x['c'], 'src': x['src']} for x in e.get('col') or []]}
        items.append(it)
        for x in it['col']:
            if x['src'] != 'T':
                continue                      # B/M 是资料原文，不进专判
            en, zh = locate(x['c'], sentences)
            shape.append((w, it['m'], x['c'], en, zh))

    per, sper = int(arg('per', 180)), int(arg('shape-per', 240))
    for i in range(0, len(items), per):
        sid = f'r{i // per + 1:02d}'
        json.dump(items[i:i + per], open(f'{ROOT}/work/cardgen/review_in/{sid}.json', 'w', encoding='utf-8'),
                  ensure_ascii=False, indent=1)
    nolocate = [s for s in shape if not s[3]]
    for i in range(0, len(shape), sper):
        sid = f's{i // sper + 1:02d}'
        with open(f'{ROOT}/work/cardgen/shape_in/{sid}.txt', 'w', encoding='utf-8') as fh:
            for w, m, c, en, zh in shape[i:i + sper]:
                fh.write('｜'.join([w, m, c, en or '（未定位）', zh or '']) + '\n')
    print(f'门禁 2 审核包 {len(items)} 个词头 → {(len(items) + per - 1) // per} 份')
    print(f'专判包 {len(shape)} 条（只含课文切片 T；带 PDF 出处的 {sum(1 for e in clean for x in e["col"] if x["src"] == "B")} 条 B 已排除）'
          f' → {(len(shape) + sper - 1) // sper} 份，其中定位不到原句 {len(nolocate)} 条')
    for w, m, c, _, _ in nolocate[:5]:
        print(f'   未定位：{w} → {c}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
