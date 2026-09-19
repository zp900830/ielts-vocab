#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""词伙层对照：顾家北《手把手教你雅思词伙》× shadow 词卡的「词伙：」段。

书是 262 页纯扫描件，要先 OCR（见 tools/ocr_vision.swift + pdftoppm），产出 book.txt。
两个方向分开算，因为「遗漏」和「错误」不是一回事：
  B 卡片有、书里找不到 → 来源不明（本轮的主要发现：绝大多数词伙不是从这本书来的）
  A 书里有、卡片没有   → 漏收（但书侧靠 OCR，漏抽会让这个数偏低，不能当上限用）

B 方向刻意算了两遍：精确子串 与 编辑距离容错。两个数只差 1.5 个百分点，
说明低重合不是 OCR 错字造成的假象 —— 这一步是结论能不能立的关键。
"""
import json
import re
import subprocess
import sys
import collections

ROOT = '/Users/zhoupeng/Library/Mobile Documents/com~apple~CloudDocs/雅思背单词项目'
STOP = set('the a an to of in on for and or at by with is are be as it that this'.split())


def norm(s):
    s = s.lower().strip().strip('.,;:，。 ')
    s = re.sub(r'\([^)]*\)', '', s)
    s = re.sub(r'^(the|a|an)\s+', '', s)
    s = s.replace('-', ' ')
    return re.sub(r'\s{2,}', ' ', s).strip()


def stem(w):
    for suf in ('ing', 'ed', 'es', 's'):
        if w.endswith(suf) and len(w) - len(suf) >= 3:
            return w[:-len(suf)]
    return w


def words(s):
    return {stem(w) for w in norm(s).split() if len(w) > 1 and w not in STOP}


def card_items():
    V = json.load(open(ROOT + '/shadow/data/vocab.json', encoding='utf-8'))
    out = {}
    for k, e in V.items():
        n = e.get('note')
        if isinstance(n, str):
            m = re.search(r'词伙：([^\n；]+)', n)
            if m:
                out[k.lower()] = [x.strip() for x in m.group(1).split(',') if x.strip()]
    return out


def book_items(path):
    """从 OCR 文本里抽「英文搭配 + 中文」的行（全书，不限附录）。"""
    pat = re.compile(r'^\s*(?:\d{1,2}[\.、]\s*)?([A-Za-z][A-Za-z\'’/&\- ]{2,44}?)\s*([\u4e00-\u9fa5][\u4e00-\u9fa5，、；。！？()0-9 ]{1,22})\s*$')
    seen, out = set(), []
    for ln in open(path, encoding='utf-8'):
        if ln.startswith('###'):
            continue
        m = pat.match(ln)
        if not m:
            continue
        c = norm(m.group(1))
        if len(c) < 4 or not re.search(r'[a-z]{3}', c) or not words(c):
            continue
        if c not in seen:
            seen.add(c)
            out.append(c)
    return out


def ed(a, b):
    if a == b:
        return 0
    if abs(len(a) - len(b)) > 2:
        return 9
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else '/tmp/gjb/book.txt'
    raw = open(path, encoding='utf-8').read()
    book = book_items(path)
    card = card_items()
    n = sum(len(v) for v in card.values())
    items = [(k, c) for k, lst in card.items() for c in lst]

    # 精确：规范化后子串命中
    low = re.sub(r'\s+', ' ', raw.lower())
    exact = [x for x in items if re.sub(r'\s+', ' ', norm(x[1])) in low]
    # 容错：词级编辑距离（吸收 OCR 错字）
    toks = re.findall(r"[a-z']+", raw.lower())
    def fuzzy(item):
        w = [t for t in norm(item).split() if t not in STOP and len(t) > 2]
        if not w:
            return False
        for i in range(len(toks) - len(w) + 1):
            if all(ed(toks[i + k], w[k]) <= (2 if len(w[k]) >= 5 else 1) for k in range(len(w))):
                return True
        return False
    fz = [x for x in items if fuzzy(x[1])]
    print(f'书侧 OCR 抽出去重搭配 {len(book)} 条 | 卡片词伙 {len(card)} 词条 / {n} 条')
    print(f'B 方向：卡片词伙能在书里找到 —— 精确 {len(exact)} ({len(exact)/n*100:.1f}%) / '
          f'容错 {len(fz)} ({len(fz)/n*100:.1f}%)；两个数接近 ⇒ 低重合不是 OCR 造成的')
    probe = ['take steps', 'adopt measures', 'harsh punishment', 'lead a fulfilling life',
             'gain knowledge', 'receive education', 'solve the problem', 'exposure to violence',
             'raise awareness', 'awareness campaigns']
    have = {norm(c) for lst in card.values() for c in lst}
    print('\n书里的招牌搭配，卡片是否收录：')
    for p in probe:
        print(f'   {p:<24} {"有" if norm(p) in have else "无"}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
