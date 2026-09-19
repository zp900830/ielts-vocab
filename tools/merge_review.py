#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""合并独立审核结论（门禁 2），并强制核对覆盖率。

审核代理交回来的东西不能直接信两件事：
 1 它可能漏判条目。漏判如果按「默认保留」处理，就等于让一次没被看过的词伙上线 ——
    所以这里对漏判直接报错，而不是悄悄放行。
 2 不同代理对 why 字段的写法不一致（一个词头多条 drop 时，why 从字符串变成了字典）。
    why 只是给人看的，不参与判定，但解析时得能吃下两种形状。

输出 work/cardgen/reviewed.json，供 apply_card_patch.py 使用。
"""
import collections
import glob
import json
import sys

ROOT = '/Users/zhoupeng/Library/Mobile Documents/com~apple~CloudDocs/雅思背单词项目'


def main():
    ins = sorted(glob.glob(ROOT + '/work/cardgen/review_in/*.json'))
    outs = {f.split('/')[-1][:-5] for f in glob.glob(ROOT + '/work/cardgen/review_out/*.json')}
    rc = 0
    if len(ins) != len(outs):
        rc = 1
        print(f'!! 审核包 {len(ins)} 份，只交回 {len(outs)} 份：缺 '
              f'{sorted({f.split("/")[-1][:-5] for f in ins} - outs)} —— 缺的包按「未审核」处理，不许落地',
              file=sys.stderr)
    merged, missing = {}, []
    keeps = dropped = 0
    for f in ins:
        sid = f.split('/')[-1][:-5]
        try:
            rev = json.load(open(ROOT + f'/work/cardgen/review_out/{sid}.json', encoding='utf-8'))
        except (OSError, ValueError) as e:
            print(f'!! {sid} 审核结论不可用：{type(e).__name__}', file=sys.stderr)
            continue
        for item in json.load(open(f, encoding='utf-8')):
            w = item['w']
            r = rev.get(w) or {}
            entry = {}
            for key, field, arr in (('syn', 's', item.get('syn') or []),
                                    ('col', 'c', item.get('col') or [])):
                marks = r.get(key) or {}
                sub = {}
                for x in arr:
                    v = str(x[field]).lower()
                    verdict = marks.get(v) or marks.get(x[field])
                    if isinstance(verdict, dict):
                        verdict = verdict.get('verdict')
                    if not verdict:
                        missing.append(f'{sid}/{w}/{key}/{v}')
                        verdict = 'keep'
                    verdict = 'drop' if str(verdict).lower().startswith('drop') else 'keep'
                    sub[v] = verdict
                    keeps += verdict == 'keep'
                    dropped += verdict == 'drop'
                entry[key] = sub
            merged[w] = entry
    json.dump(merged, open(ROOT + '/work/cardgen/reviewed.json', 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    print(f'审核结论合并完成：{len(merged)} 个词头，keep {keeps} 条、drop {dropped} 条')

    # 第二层否决：词伙「成品搭配 vs 偶然相邻」专判。它是独立一轮，所以只在 drop 时生效，
    # 不能把门禁 2 已经 drop 的东西翻回 keep。
    sh_in = sorted(glob.glob(ROOT + '/work/cardgen/shape_in/*.txt'))
    if sh_in:
        sh_out = {f.split('/')[-1][:-5] for f in glob.glob(ROOT + '/work/cardgen/shape_out/*.json')}
        if len(sh_in) != len(sh_out):
            rc = 1
            print(f'!! 专判包 {len(sh_in)} 份，只交回 {len(sh_out)} 份：缺 {sorted({f.split('/')[-1][:-4] for f in sh_in} - sh_out)}',
                  file=sys.stderr)
        extra = 0
        for f in sh_in:
            sid = f.split('/')[-1][:-4]
            try:
                sv = json.load(open(ROOT + f'/work/cardgen/shape_out/{sid}.json', encoding='utf-8'))
            except (OSError, ValueError):
                continue
            want = collections.defaultdict(set)
            for ln in open(f, encoding='utf-8'):
                p = ln.rstrip('\n').split('｜')
                if len(p) >= 3:
                    want[p[0].strip()].add(p[2].strip())
            for h, chunks in want.items():
                seen = (sv.get(h) or {})
                miss = [c for c in chunks if str(seen.get(c, '')).lower() not in ('keep', 'drop')]
                if miss:
                    missing += [f'{sid}/{h}/{c}（专判缺结论）' for c in miss]
                    continue
                for c in chunks:
                    if str(seen[c]).lower() == 'drop':
                        entry = merged.setdefault(h, {'syn': {}, 'col': {}})
                        if (entry['col'].get(c) or 'keep') != 'drop':
                            entry['col'][c] = 'drop'
                            extra += 1
        dropped += extra
        json.dump(merged, open(ROOT + '/work/cardgen/reviewed.json', 'w', encoding='utf-8'),
                  ensure_ascii=False, indent=1)
        print(f'专判追加否决 {extra} 条；累计 drop {dropped} 条、keep {keeps - extra} 条')

    if missing:
        print(f'★ 有 {len(missing)} 条没有任何审核结论，已按 keep 处理，必须复核：')
        for m in missing[:12]:
            print('   ', m)
    return rc or (1 if missing else 0)


if __name__ == '__main__':
    sys.exit(main())
