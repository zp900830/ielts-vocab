#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从两份同义替换资料生成「词卡同义词补齐」方案（只出方案，不写数据）。

三条硬规矩，都是上一轮踩过坑之后定下的：
 1 只补**本书目标词**（vocab.json 的键）。资料里的超纲词一律不采纳 —— 词卡是给学生
   扩展用的，塞一个他还没学的词进去只会变成读不懂的死字；同时目标词本身有词条，
   将来可以直接点开。
 2 上一轮 530 张逐条裁决里被判 wrong 的词，**不许借资料复活**。资料的分组是启发式的
   （同小节 / 同释义），会把 prompt(adj.) 和 promote(v.) 这种形近词并进来。
 3 每条卡片最多 5 个同义词，先留裁决时确认过的，再按资料里共现次数补。

输出 /tmp/syn/syn_patch.json：{head: {"old": [...], "new": [...], "added": [...]}}
"""
import json
import re
import sys
import collections

sys.path.insert(0, '/Users/zhoupeng/Library/Mobile Documents/com~apple~CloudDocs/雅思背单词项目/tools')
from crosscheck_syn import load_he, load_gp, norm, key   # noqa: E402

ROOT = '/Users/zhoupeng/Library/Mobile Documents/com~apple~CloudDocs/雅思背单词项目'
VERDICTS = ['/tmp/tqa/syn-verdict-0.json', '/tmp/tqa/syn-verdict-1.json']
CAP = 5


def rejected_words():
    """上一轮判错的 (head → {被否掉的同义词})。"""
    out = collections.defaultdict(set)
    for f in VERDICTS:
        try:
            rows = json.load(open(f, encoding='utf-8'))
        except OSError:
            continue
        for r in rows:
            head = r['head'].lower()
            for w in r.get('wrong') or []:
                m = re.match(r'^\s*([A-Za-z][A-Za-z\'’ .-]*?)\s*[:：]', w)
                if m:
                    out[head].add(norm(m.group(1)))
    return out


def main():
    V = json.load(open(ROOT + '/shadow/data/vocab.json', encoding='utf-8'))
    targets = {k.lower() for k in V}
    gp_groups, _ = load_gp()
    # 只用两种可靠依据：
    #   何琼的等号（A=B 是明确改写关系）、高频书「中文释义完全相同」（increase=rise=raise）。
    # 刻意丢掉「同一小节标题」那条 —— 高频书的小节里混着疾病类、校园场景类这种**同话题**清单，
    # 按小节成组会把 allergy↔trauma、accumulate↔restrict 当成同义词，实测污染率极高。
    groups = load_he() + [g for g in gp_groups if g['src'] == '高频·同释义']

    # head → {候选: 共现次数}
    cand = collections.defaultdict(collections.Counter)
    for g in groups:
        items = [norm(x) for x in g['items']]
        uniq = [x for x in dict.fromkeys(items) if x]
        for h in uniq:
            if h not in targets:
                continue
            for o in uniq:
                if o != h and o in targets:
                    cand[h][o] += 1

    rej = rejected_words()
    patch = {}
    stat = collections.Counter()
    for h in sorted(targets):
        have = []
        n = V.get(h, {}).get('note')
        if isinstance(n, str):
            m = re.search(r'同义词：([^\n；]+)', n)
            if m:
                have = [x.strip() for x in m.group(1).split(',') if x.strip()]
        bad = rej.get(h, set())
        bad_keys = {key(x) for x in bad}
        keep = [x for x in have if key(x) != key(h) and key(x) not in bad_keys]
        keep_keys = {key(x) for x in keep}
        add = []
        for o, c in cand.get(h, collections.Counter()).most_common():
            if key(o) in keep_keys or key(o) == key(h) or key(o) in bad_keys:
                continue
            add.append(o)
            keep_keys.add(key(o))
            if len(keep) + len(add) >= CAP:
                break
        if not add:
            stat['无变化' if have else '资料也无从补'] += 1
            continue
        patch[h] = {'old': have, 'new': (keep + add)[:CAP], 'added': add}
        stat[('新增段' if not have else '扩充')] += 1
    json.dump(patch, open('/tmp/syn/syn_patch.json', 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    tot_add = sum(len(v['added']) for v in patch.values())
    print(f'涉及 {len(patch)} 个词头，新增 {tot_add} 条同义词关系')
    print('  其中原本没有同义词段的:', stat['新增段'], '| 在已有段上扩充的:', stat['扩充'])
    print('  资料给出的候选被"只收目标词"规则挡掉的共现对，未计入')
    print('\n样例：')
    for h in list(patch)[:10]:
        p = patch[h]
        print(f'  {h:<14} 旧 {",".join(p["old"]) or "(无)"}  →  新 {",".join(p["new"])}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
