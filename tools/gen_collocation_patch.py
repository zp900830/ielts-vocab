#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从顾家北词伙书的 OCR 文本里，为每个目标词生成「词伙」补齐方案（只出方案，不写数据）。

关键取舍：
 1 只要**词面干净**的搭配 —— 每个英文词都必须落在「本书词表 / 阅读词表 / 简单词表」里。
   OCR 会把 etiquette 打成 etiguette、workload 打成 wotkload，这类一律丢弃，
   绝不把扫描噪声写进词卡。
 2 搭配归到哪个词头下：取搭配里**属于目标词**的实词；多个目标词就都挂（书里本来就只在
   一个话题下列一次，挂给两个词都算有据）。冠词/介词/简单词不作为词头。
 3 每张卡最多 3 条，已有的排前面，新的按书里出现次数排序。

输出 /tmp/syn/colloc_patch.json：{head: {"old":[...], "new":[...], "added":[...]}}
"""
import json
import re
import sys
import collections

ROOT = '/Users/zhoupeng/Library/Mobile Documents/com~apple~CloudDocs/雅思背单词项目'
BOOK = sys.argv[1] if len(sys.argv) > 1 else '/tmp/gjb/book.txt'
CAP = 3
STOP = set('the a an to of in on for and or at by with is are be as it that this some any no'.split())
PAT = re.compile(r'^\s*(?:\d{1,2}[\.、]\s*)?([A-Za-z][A-Za-z\'’/&\- ]{2,44}?)\s+([\u4e00-\u9fa5][\u4e00-\u9fa5，、；。！？()0-9 ]{1,22})\s*$')


def norm(s):
    s = s.lower().strip().strip('.,;:，。 ')
    s = re.sub(r'\([^)]*\)', '', s)
    s = re.sub(r'^(the|a|an)\s+', '', s)
    s = s.replace('-', ' ').replace('’', "'")
    return re.sub(r'\s{2,}', ' ', s).strip()


def main():
    V = json.load(open(ROOT + '/shadow/data/vocab.json', encoding='utf-8'))
    B = {str(r[1]).lower() for r in json.load(open(ROOT + '/data/book.json', encoding='utf-8'))
         if isinstance(r, list) and len(r) > 1}
    simple = {l.split('\t')[0].strip().lower() for l in open(ROOT + '/tools/data/simple_word_tags.tsv', encoding='utf-8')
              if not l.startswith('#') and l.strip()}
    known = {norm(w) for w in (set(V) | B | simple)}
    targets = {norm(k) for k in V}

    rows = collections.Counter()
    rejected_noise = 0
    for ln in open(BOOK, encoding='utf-8'):
        if ln.startswith('###'):
            continue
        m = PAT.match(ln)
        if not m:
            continue
        col = norm(m.group(1))
        ws = [w for w in col.split() if w not in STOP]
        if len(col) < 4 or not ws:
            continue
        if any(w not in known for w in ws):
            rejected_noise += 1          # OCR 打错词 → 整条丢，不进词卡
            continue
        if not any(w in targets for w in ws):
            continue                      # 不含任何目标词 → 挂不到卡上
        rows[col] += 1

    by_head = collections.defaultdict(list)
    for col, c in rows.most_common():
        for w in col.split():
            if w in targets:
                by_head[w].append(col)

    patch = {}
    for h in sorted(targets):
        old = []
        n = V.get(h, {}).get('note')
        if isinstance(n, str):
            m = re.search(r'词伙：([^\n；]+)', n)
            if m:
                old = [x.strip() for x in m.group(1).split(',') if x.strip()]
        add = []
        seen = {norm(x) for x in old}
        for col in by_head.get(h, []):
            if col in seen or col == h:
                continue
            add.append(col)
            seen.add(col)
            if len(old) + len(add) >= CAP:
                break
        merged = (old + add)[:CAP]
        if merged != old:          # 旧段已满 3 条时 add 会被截没了，别留空改动
            patch[h] = {'old': old, 'new': merged, 'added': [x for x in merged if x not in old]}
    json.dump(patch, open('/tmp/syn/colloc_patch.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    tot = len(rows)
    print(f'书侧干净搭配 {tot} 条（另有 {rejected_noise} 条因 OCR 错词被丢弃）')
    print(f'可补齐 {len(patch)} 个目标词的词伙段，新增 {sum(len(v["added"]) for v in patch.values())} 条')
    print(f'原本没有词伙段、这次能补上的: {sum(1 for v in patch.values() if not v["old"])} 个')
    print(f'词表 3219 词里书能覆盖到的: {len({h for h in patch})} 个')
    print('\n样例：')
    for h in list(patch)[:12]:
        p = patch[h]
        print(f'  {h:<14} 旧 {"|".join(p["old"]) or "(无)"}  →  {"|".join(p["new"])}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
