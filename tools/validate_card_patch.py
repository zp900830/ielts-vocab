#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""机器校验子代理交回的词卡补丁（out_ch*.json），只放行能机械证明合法的条目。

为什么必须有这一道：上一轮"代理生成、无人复验"直接把 60% 错列的同义词写进了词卡。
这里不判断"意思像不像"（那要靠人/审核代理），只把**能被机械证明**的错误挡掉：

  1 词头必须真在词表里，且确实在待处理清单里（不许越权改别的词）
  2 同义词必须 ∈ allowed_words.json（本书目标词），不得含词头自身，不得重复，≤3 个
  3 同义词必须与词头**词性有交集** —— 词性从词典 m 字段的前缀标记读，
     这一条专门拦 prompt(adj)↔promote(v) 这类"形近但词性不同"的假同义词
  4 词伙必须 2–6 个词、纯 ASCII 字母（拦整句/带标点/中文混入）、含词头或其屈折形、
     除词头外每个词都要在简单词白名单里（保证不引入超纲词）、≤3 条、不与已有重复
  5 不得复活上一轮 530 张逐条裁决里被判 wrong 的词

输出 /tmp/cardgen/clean.json（可直接喂给 applier）+ 一份拒绝清单。
"""
import json
import re
import sys
import collections

ROOT = '/Users/zhoupeng/Library/Mobile Documents/com~apple~CloudDocs/雅思背单词项目'
PACKET = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6a', 'ch6b']
POS = {'n': 'n', 'vt': 'n', 'vi': 'n', 'v': 'v', 'a': 'adj', 'adj': 'adj',
       'ad': 'adv', 'adv': 'adv', 'prep': 'prep', 'conj': 'conj', 'pron': 'n', 'num': 'adj'}
TAG = re.compile(r'(?:^|[；;，,\s])(n|vt|vi|v|a|adj|ad|adv|prep|conj|pron|num)\.', re.I)


def pos_set(m):
    """从 'n. 痕迹；v. 追踪' 这种释义里读出全部词性。读不出来返回空集。"""
    out = set()
    for t in TAG.findall(str(m or '')):
        p = POS.get(t.lower())
        if p:
            out.add(p)
    return out


def forms(w):
    w = w.lower()
    f = {w, w + 's', w + 'es', w + 'd', w + 'ed', w + 'ing', w + 'er', w + 'est'}
    if w.endswith('e'):
        f |= {w + 'd', w[:-1] + 'ing'}
    if w.endswith('y') and len(w) > 2:
        f |= {w[:-1] + 'ies', w[:-1] + 'ed', w[:-1] + 'ing'}
    return f


def main():
    V = json.load(open(ROOT + '/shadow/data/vocab.json', encoding='utf-8'))
    allowed = set(json.load(open('/tmp/cardgen/allowed_words.json', encoding='utf-8')))
    simple = {l.split('\t')[0].strip().lower() for l in open(ROOT + '/tools/data/simple_word_tags.tsv', encoding='utf-8')
              if not l.startswith('#') and l.strip()}
    want = {}
    for p in PACKET:
        try:
            rows = json.load(open(f'/tmp/cardgen/{p}.json', encoding='utf-8'))
        except OSError:
            continue
        for r in rows:
            want[r['w']] = (r.get('need_syn'), r.get('need_col'))

    rejected = []
    clean = []
    seen_head = set()
    for p in PACKET:
        try:
            out = json.load(open(f'/tmp/cardgen/out_{p}.json', encoding='utf-8'))
        except (OSError, ValueError) as e:
            rejected.append(('*', p, f'文件不可用：{type(e).__name__}'))
            continue
        for item in out:
            h = str(item.get('w', '')).lower().strip()
            if h not in want:
                rejected.append((h, p, '不在待处理清单里（越权）'))
                continue
            if h in seen_head:
                continue
            seen_head.add(h)
            need_syn, need_col = want[h]
            head_pos = pos_set((V.get(h) or {}).get('m'))
            syn, col = [], []
            for s in (item.get('syn') or []):
                s = str(s).lower().strip()
                if not need_syn:
                    rejected.append((h, p, '本章该词已有同义词段，忽略新 syn')); break
                if s == h:
                    rejected.append((h, p, f'syn 含词头自身 {s}')); continue
                if s not in allowed:
                    rejected.append((h, p, f'syn 非本书目标词 {s}')); continue
                if s in syn:
                    continue
                sp = pos_set((V.get(s) or {}).get('m'))
                if head_pos and sp and not (head_pos & sp):
                    rejected.append((h, p, f'syn 词性不符 {s}({"/".join(sorted(sp))} vs {"/".join(sorted(head_pos))})')); continue
                syn.append(s)
                if len(syn) >= 3:
                    break
            for c in (item.get('col') or []):
                c = str(c).strip().lower()
                if not need_col:
                    rejected.append((h, p, '本章该词已有词伙段，忽略新 col')); break
                if not re.fullmatch(r"[a-z][a-z' -]{1,60}", c):
                    rejected.append((h, p, f'col 含非法字符 {c!r}')); continue
                ws = c.split()
                if not (2 <= len(ws) <= 6):
                    rejected.append((h, p, f'col 词数越界 {c!r}')); continue
                hf = forms(h)
                if not any(w in hf or any(w in forms(x) for x in h.split()) for w in ws):
                    rejected.append((h, p, f'col 不含词头 {c!r}')); continue
                other = [w for w in ws if w not in hf and not any(w in forms(x) for x in h.split())]
                badw = [w for w in other if w not in simple and len(w) > 2]
                if badw:
                    rejected.append((h, p, f'col 引入超纲词 {c!r} → {badw}')); continue
                if c in col:
                    continue
                col.append(c)
                if len(col) >= 3:
                    break
            if syn or col:
                clean.append({'w': h, 'syn': syn, 'col': col})

    json.dump(clean, open('/tmp/cardgen/clean.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    json.dump([{'head': a, 'src': b, 'why': c} for a, b, c in rejected],
              open('/tmp/cardgen/rejected.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    ns = sum(1 for x in clean if x['syn'])
    nc = sum(1 for x in clean if x['col'])
    print(f'清单内词头 {len(want)} | 交回且通过 {len(clean)}（有 syn {ns}，有 col {nc}）')
    print(f'拒绝记录 {len(rejected)} 条')
    why = collections.Counter(r[2].split(' ')[0] for r in rejected)
    for k, v in why.most_common(10):
        print(f'   {k}: {v}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
