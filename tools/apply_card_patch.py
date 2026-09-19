#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""门禁 3→落地：把通过机械校验（并可选地通过独立审核）的词卡补丁写进 vocab.json。

顺序是硬性的：没有 --review 就拒绝落地。上一轮 60% 错列的成因不是模型不会，
而是「生成了就直接写进数据」，所以这里宁可麻烦也要留一道人工/审核的痕迹。

只改 shadow/data/vocab.json 的 note 段，保持原紧凑单行 JSON 与「；」分段约定；
改完必须同步 bump shadow/index.html 的 SHADOW_DATA_VER —— 否则线上永远命中旧缓存，
改词卡在手机上看不到。validate_data.py 第 0b 条会拦漏 bump。
"""
import argparse
import json
import re
import sys

ROOT = '/Users/zhoupeng/Library/Mobile Documents/com~apple~CloudDocs/雅思背单词项目'
sys.path.insert(0, ROOT + '/scripts')
from validate_data import shadow_data_ver  # noqa: E402

SEG = re.compile(r'^(同义词|词伙)：(.*)$')


def split_segments(note):
    """'state作名词=…；词伙：a, b' → (['state作名词=…'], {'词伙': ['a','b']})"""
    segs = {'同义词': [], '词伙': []}
    free = []
    for part in re.split(r'；', str(note or '')):
        part = part.strip()
        if not part:
            continue
        m = SEG.match(part)
        if m:
            segs[m.group(1)] += [x.strip() for x in m.group(2).split(',') if x.strip()]
        else:
            free.append(part)
    return free, segs


def join_segments(free, segs):
    out = list(free)
    if segs['同义词']:
        out.append('同义词：' + ', '.join(segs['同义词']))
    if segs['词伙']:
        out.append('词伙：' + ', '.join(segs['词伙']))
    return '；'.join(out)


def apply_review(clean, review_path):
    """review JSON: {词头: {"syn": {词: "keep"|"drop"}, "col": {...}}}。

    没有结论就不落地，而不是按「默认保留」放行 —— 否则审核代理漏判的那部分等于
    谁都没看过就直接写进了学生的词卡。
    """
    rv = json.load(open(review_path, encoding='utf-8'))
    dropped = 0
    out = []
    for item in clean:
        r = rv.get(item['w'])
        if r is None:
            raise SystemExit(f'门禁 2 未覆盖词头 {item["w"]}，拒绝落地')
        for key in ('syn', 'col'):
            field = 's' if key == 'syn' else 'c'
            marks = r.get(key) or {}
            kept = []
            for x in item[key]:
                verdict = marks.get(x[field])
                if verdict is None:
                    raise SystemExit(f'门禁 2 未覆盖 {item["w"]}/{key}/{x[field]}，拒绝落地')
                if str(verdict).lower().startswith('drop'):
                    dropped += 1
                else:
                    kept.append(x)
            item[key] = kept
        if item['syn'] or item['col']:
            out.append(item)
    return out, dropped


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--patch', default=ROOT + '/work/cardgen/clean.json')
    ap.add_argument('--review', help='门禁 2 的审核结论，缺省则拒绝落地')
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    if not args.review:
        print('拒绝落地：没过独立审核（门禁 2）。确认要跳过请加 --review 指定结论文件。', file=sys.stderr)
        return 2

    path = ROOT + '/shadow/data/vocab.json'
    src = open(path, encoding='utf-8').read()
    V = json.loads(src)
    # 候选表建表时把连字符折成了空格（well-known → well known），这里按同一口径回认词头，
    # 否则这批卡的审核结论会被当成「词表里没有」整条丢掉
    key_of = {k.lower(): k for k in V}
    key_of.update({k.lower().replace('-', ' '): k for k in V})
    clean, dropped = apply_review(json.load(open(args.patch, encoding='utf-8')), args.review)

    touched = {'同义词': 0, '词伙': 0}
    added = {'同义词': 0, '词伙': 0}
    skipped = []
    for item in sorted(clean, key=lambda x: x['w']):
        k = key_of.get(item['w'])
        if not k:
            skipped.append((item['w'], '词表里没有'))
            continue
        free, segs = split_segments(V[k].get('note'))
        for tag, arr, field in (('同义词', item['syn'], 's'), ('词伙', item['col'], 'c')):
            cur = {x.lower() for x in segs[tag]}
            cur |= {k.lower()}
            for cand in arr:
                w = cand[field].lower()
                if w in cur:
                    continue
                segs[tag].append(cand[field])
                cur.add(w)
                touched[tag] += 1
                added[tag] += 1
        V[k]['note'] = join_segments(free, segs)

    new = json.dumps(V, ensure_ascii=False, separators=(',', ':'))
    print(f'审核否掉 {dropped} 条；落地新增 同义词 {added["同义词"]} 条、词伙 {added["词伙"]} 条；跳过 {len(skipped)}')
    if args.dry_run:
        print('（dry-run，未写盘）')
        return 0
    if new == src:
        print('数据无变化，跳过写入与版本号 bump')
        return 0
    open(path, 'w', encoding='utf-8').write(new)

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
