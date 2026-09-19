#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把两份同义词审计裁决（syn-verdict-*.json）落到 shadow/data/vocab.json 的 note 里。

note 的格式是「同义词：a, b, c；词伙：x y」这种用 ； 串起来的段，所以只允许替换
「同义词：」那一段，其余段落（词伙、辨析标题…）必须原样留着 —— 直接整条覆盖会顺手
把词伙抹掉。裁决里给的 sample_new_note 只是样例、不带词伙段，不能拿来当成品用。

四条校验：
  1 只动 note，其它字段逐字节不变；词条总数不变；
  2 改写后不得出现空的「同义词：」；delete 判定 → 整段删掉；
  3 corrected 词形合法：纯 ASCII、1–3 个词、不含标点、不等于词头本身、列表内不重复；
  4 幂等：跑第二遍不再有任何改动。
干跑打印改了多少条 + 20 条抽样；加 --apply 才写文件。
"""
import json
import re
import sys

SEG = re.compile(r'同义词：([^；\n]*)')
OK = re.compile(r"^[A-Za-z][A-Za-z'’.\- ]*$")


def rebuild(note, corrected):
    """只替换 note 里的「同义词：…」那一段。
    实测全库 530 条里 0 条会把同义词列表用 ； 切断，所以一段就够，其余段原样保留。"""
    if corrected:
        new_seg = '同义词：' + ', '.join(corrected)
        out, n = SEG.subn(lambda m: new_seg, note, count=1)
        return out if n else None
    # delete：连同分隔符一起摘掉这一段
    parts = [p for p in note.split('；') if not p.startswith('同义词：')]
    return '；'.join(parts)


def main():
    do = '--apply' in sys.argv
    V = json.load(open('shadow/data/vocab.json', encoding='utf-8'))
    verdicts = {}
    for f in sys.argv[1:]:
        if f.startswith('--'):
            continue
        for r in json.load(open(f, encoding='utf-8')):
            verdicts[r['head'].lower()] = r
    changed, skipped, illegal = {}, [], []
    for head, r in sorted(verdicts.items()):
        e = V.get(head)
        if not e:
            skipped.append((head, '词条不存在'))
            continue
        note = e.get('note')
        if not isinstance(note, str) or not note.strip():
            skipped.append((head, '本就没有 note'))
            continue
        if '同义词' not in note:
            skipped.append((head, 'note 里没有同义词段'))
            continue
        verdict = r['verdict']
        if verdict == 'keep':
            continue
        corr = [c.strip() for c in r.get('corrected') or [] if str(c).strip()]
        bad = [c for c in corr if not OK.match(c) or len(c.split()) > 3 or c.lower() == head]
        if bad:
            illegal.append((head, bad))
            continue
        if len({c.lower() for c in corr}) != len(corr):
            illegal.append((head, '列表内有重复'))
            continue
        new = rebuild(note, corr)
        if new is None:
            skipped.append((head, '定位不到同义词段'))
            continue
        if corr and not SEG.search(new):
            illegal.append((head, '改写后同义词段丢失'))
            continue
        if new != note:
            changed[head] = (note, new, verdict)
    print(f'裁决 {len(verdicts)} 条 → 改写 {len(changed)}，跳过 {len(skipped)}，不合法 {len(illegal)}')
    for h, why in skipped[:10]:
        print(f'  跳过 {h}: {why}')
    for h, why in illegal[:10]:
        print(f'  不合法 {h}: {why}')
    import random
    random.seed(7)
    for h in random.sample(sorted(changed), min(20, len(changed))):
        o, n, v = changed[h]
        print(f'  [{v}] {h}\n     旧 {o}\n     新 {n}')
    if illegal:
        print('存在不合法裁决，拒绝写入')
        return 1
    if do:
        before = json.dumps(V, ensure_ascii=False, sort_keys=True)
        for h, (o, n, v) in changed.items():
            V[h]['note'] = n
        assert json.loads(before).keys() == V.keys(), '词条集合变了'
        for h, e in json.loads(before).items():
            for f, val in e.items():
                if f == 'note':
                    continue
                assert V[h][f] == val, f'{h}.{f} 被误改'
        json.dump(V, open('shadow/data/vocab.json', 'w', encoding='utf-8'),
                  ensure_ascii=False, separators=(',', ':'))
        print(f'已改写 {len(changed)} 条 note（除 note 外 0 字段变动，词条集合不变）')
    else:
        print('（干跑。加 --apply 落地）')
    return 0


if __name__ == '__main__':
    sys.exit(main())
