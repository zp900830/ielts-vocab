#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""证明 SENT_SHIFTS 账本能把用户的旧书签精确搬到新课文的同一句。

原理：插句之后，「旧全局句号 i」应该映射到「新课文里同一句话的新序号」。
这个映射有两个独立算法可以算：
  A) 直接法：按插入点构造 旧序号 → 新序号 的映射（不依赖账本）
  B) 回放法：把 shadow/index.html 里的 SENT_SHIFTS 按数组顺序逐条作用到 i 上
     （完全照抄前端 applySentShifts 的语义：i > after 才 +delta）
两者对每一个旧序号都必须一致。不一致就说明账本写错了，用户的书签/续读位/AB 循环
会整体错位 —— 这类错误不会报错，只会静默把进度挪到别的句子上。
"""
import json
import re
import sys

ROOT = '/Users/zhoupeng/Library/Mobile Documents/com~apple~CloudDocs/雅思背单词项目'


def parse_ledger():
    s = open(ROOT + '/shadow/index.html', encoding='utf-8').read()
    blk = s[s.index('const SENT_SHIFTS'):]
    blk = blk[:blk.index('];')]
    out = []
    for m in re.finditer(r"\{ id:\s*'([^']+)',\s*after:\s*(-?\d+),\s*delta:\s*(-?\d+),\s*chapter:\s*(-?\d+),\s*localAfter:\s*(-?\d+)\s*\}", blk):
        out.append({'id': m.group(1), 'after': int(m.group(2)), 'delta': int(m.group(3)),
                    'chapter': int(m.group(4)), 'localAfter': int(m.group(5))})
    return out


def replay(i, ledger):
    """前端语义：Number.isInteger(i) && i > s.after 才加 delta。"""
    for s in ledger:
        if i > s['after']:
            i += s['delta']
    return i


def main():
    try:
        plan = json.load(open('/tmp/cardgen/insert_plan.json', encoding='utf-8'))
        items = plan['ok']
    except OSError:
        items = []
        print('（还没有 insert_plan.json，只核对历史账本条数）')
    ledger = parse_ledger()
    D = json.load(open(ROOT + '/shadow/data/sections.json', encoding='utf-8'))
    new_total = sum(len(p) for c in D for p in c['paragraphs'])
    # _gi 是「插入点前一句」的旧序号，所以只有 _gi < i 的插入会把旧句 i 往后推，
    # 正好对应前端「i > after 才 +delta」的语义。
    def direct2(i):
        return i + sum(1 for x in items if i > x['_gi'])

    # 账本里历史条目对应的是「更早那批插入之前」的序号空间，已经生效过了；
    # 这里只该核对本批新增的那几条，否则会把历史位移当成不一致。
    ledger_new = ledger[len(ledger) - len(items):] if items else []
    bad = []
    for i in range(new_total - len(items)):
        a, b = replay(i, ledger_new), direct2(i)
        if a != b:
            bad.append((i, a, b))
    print(f'账本共 {len(ledger)} 条，本批核对 {len(ledger_new)} 条 | 旧序号 0–{new_total - len(items) - 1}')
    print(f'直接映射 与 账本回放 不一致的旧序号：{len(bad)}')
    for i, a, b in bad[:10]:
        print(f'   旧 {i}: 回放→{a}  直接→{b}')
    if len(ledger) != len(items) + 1:
        print(f'注意：账本总条数 {len(ledger)} ≠ 本次 {len(items)} + 历史 1，请核对')
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
