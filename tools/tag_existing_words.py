#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""给「课文里早就出现、但没套可点标记」的词补上词卡。

为什么单独要一个工具：这类词不需要插句，句子总数不变，所以既不碰 SENT_SHIFTS
顺移账本、也不会让用户书签错位 —— 是加词里唯一零风险的一类。上一轮把「加词」
一律等同于「插句」，结果这三个词（foe / induction / worksheet）明明就在课文里，
却一直没人能点开。

做的事：
  1 在裸文本上用词边界补 [[词头:实际词形]]，已有的 [[..]] 内部绝不重复匹配
  2 把词头加进「真的标到标记的那些章」的 sections/chapters 两份 words 表
     （validate_data 第 2、12 条分别查这两处）
  3 建词卡：例句直接取它在本项目课文里的那句和对应中文，不另编句子
  4 断言句子总数与中英句数完全没变，再 bump SHADOW_DATA_VER

用法：python3 tools/tag_existing_words.py work/newwords_zero_cost.json [--apply]
"""
import json
import re
import sys

ROOT = '/Users/zhoupeng/Library/Mobile Documents/com~apple~CloudDocs/雅思背单词项目'
sys.path.insert(0, ROOT + '/scripts')
from validate_data import shadow_data_ver  # noqa: E402

MARK = re.compile(r'\[\[[^\]]+\]\]')
S = re.compile(r"(?:^|(?<=[\s,;:.(\"']))([A-Za-z]+)(?=[\s,;:.!?)\"']|$)")


def surface_forms(w):
    w = w.lower()
    out = {w}
    if w.endswith(('s', 'sh', 'x', 'z', 'ch')):
        out.add(w + 'es')
    else:
        out.add(w + 's')
    if w.endswith('y') and len(w) > 2:
        out.add(w[:-1] + 'ies')
    return out


def mark_plain(part, w, hit):
    """只在非标记文本里按词边界套壳。"""
    def rep(m):
        tok = m.group(1)
        if tok.lower() in surface_forms(w):
            hit.append(tok)
            return '[[%s:%s]]' % (w, tok)
        return tok
    return S.sub(rep, part)


def main():
    spec = json.load(open(sys.argv[1] if len(sys.argv) > 1 else
                          ROOT + '/work/newwords_zero_cost.json', encoding='utf-8'))
    do = '--apply' in sys.argv
    D = json.load(open(ROOT + '/shadow/data/sections.json', encoding='utf-8'))
    C = json.load(open(ROOT + '/shadow/data/chapters.json', encoding='utf-8'))
    V = json.load(open(ROOT + '/shadow/data/vocab.json', encoding='utf-8'))
    R = json.load(open(ROOT + '/data/vocab.json', encoding='utf-8'))
    before = sum(len(p) for c in D for p in c['paragraphs'])

    for item in spec:
        w = item['word'].lower()
        if w in V:
            print(f'  跳过 {w}：卡已存在')
            continue
        hit_sent = []
        for ci, ch in enumerate(D):
            for pi, para in enumerate(ch['paragraphs']):
                for si, s in enumerate(para):
                    if not re.search(r'\b(' + '|'.join(surface_forms(w)) + r')\b', MARK.sub(' ', s)):
                        continue
                    hit = []
                    parts = re.split(r'(\[\[[^\]]+\]\])', s)
                    parts = [p if p.startswith('[[') else mark_plain(p, w, hit) for p in parts]
                    new = ''.join(parts)
                    if not hit:
                        continue
                    ch['paragraphs'][pi][si] = new
                    hit_sent.append((ci, pi, si, new, ch['sentZh'][pi][si]))
        if not hit_sent:
            print(f'  ★ {w}：课文里没有未标记的出现，不建卡')
            continue
        for ci, _, _, _, _ in hit_sent:
            for tbl in (D[ci], C[ci]):
                if w not in [str(t).lower() for t in tbl['words']]:
                    tbl['words'].append(w)
        ci, pi, si, en, zh = hit_sent[0]
        plain = re.sub(r'\[\[([^\]:]+):([^\]]+)\]\]', r'\2', en)
        V[w] = {'p': item['p'], 'm': item['m'], 'uk': item.get('uk') or item['p'],
                'us': item.get('us') or item['p'], 'ex': plain, 'exZh': zh, 'note': ''}
        # validate_data 第 4 条要求两应用词表键集完全一致，所以阅读站词表必须同步加；
        # 它的条目结构更瘦（只有 p/m/note），别把跟读站的字段搬过去。
        R[w] = {'p': item['p'], 'm': item['m'], 'note': ''}
        print(f"  {w}：套壳 {len(hit_sent)} 处（章 {sorted({c + 1 for c, *_ in hit_sent})}），两应用词表各建 1 卡")

    after = sum(len(p) for c in D for p in c['paragraphs'])
    assert after == before, f'句子总数变了 {before} → {after}，必须回滚'
    for c in D:
        for i, p in enumerate(c['paragraphs']):
            assert len(p) == len(c['sentZh'][i]), f'第{c["title"]}段{i}中英句数不齐'
    print(f'句子总数不变：{after} 句；顺移账本无需登记')
    if not do:
        print('（干跑，未写文件。加 --apply 才落地）')
        return 0
    # 每个文件保持它自己原来的排版：根词表是缩进 JSON，压成一行会造出上万行假 diff，
    # 也让人工复核时看不出到底改了哪几个词
    for path, obj, indent in ((ROOT + '/shadow/data/sections.json', D, None),
                              (ROOT + '/shadow/data/chapters.json', C, None),
                              (ROOT + '/shadow/data/vocab.json', V, None),
                              (ROOT + '/data/vocab.json', R, 2)):
        txt = json.dumps(obj, ensure_ascii=False, indent=indent,
                         **({'separators': (',', ':')} if indent is None else {}))
        if open(path, encoding='utf-8').read().endswith('\n'):
            txt += '\n'
        open(path, 'w', encoding='utf-8').write(txt)
    ver = shadow_data_ver()
    hp = ROOT + '/shadow/index.html'
    html = open(hp, encoding='utf-8').read()
    old = re.search(r'const SHADOW_DATA_VER\s*=\s*"([0-9a-f]+)"', html)
    open(hp, 'w', encoding='utf-8').write(
        re.sub(r'(const SHADOW_DATA_VER\s*=\s*")[0-9a-f]+(")', r'\g<1>' + ver + r'\g<2>', html, count=1))
    print(f'SHADOW_DATA_VER {old.group(1) if old else "?"} → {ver}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
