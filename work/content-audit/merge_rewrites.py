#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""合并 sec{i}.rewrite*.json 增量改写回 data/sections.json，硬校验后写盘。

用法:
  python3 work/content-audit/merge_rewrites.py            # 干跑，只报告
  python3 work/content-audit/merge_rewrites.py --write    # 真正写 data/sections.json

产出文件契约（agent 负责）:
  work/content-audit/sec{i}.rewrite.<batch>.json
  {
    "si": <int>,
    "sents": { "<pi>.<ti>": {"en": "...[[k:d]]...", "zh": "..."} , ... },
    "paraZh": { "<pi>": "段落小结" }        # 可选
  }

硬校验（任一失败该句回退原文并记入报告）:
  1. [[key:display]] 的 key 序列与原句完全一致（个数、顺序、字符串逐字节相等）
  2. 每个显示形在去标记后的英文正文里逐字出现（挖空按显示形遮词）
  3. 无断标: ]] 后紧跟小写字母（校验器门禁 10）
  4. key/display 不含 [ ] | : 非法字符
  5. 英文是单句: 去掉缩写点后不得出现「句末标点+空格+大写」
  6. 英文无 CJK；中文有标点（门禁 11）；中文无 [[
  7. 英文长度 0.4x ~ 2.5x 原句（超出告警，3x 拒绝）
  8. 不得新引入本章声明词的平文出现（门禁 12 严化: 只比原文新增的才算）
  9. 句号坐标 (pi,ti) 必须存在；paraZh 下标必须存在
覆盖检查: 每篇每个 (pi,ti) 都必须出现在某个 rewrite 文件里（未覆盖=报告）
"""
import json, re, sys, glob, os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
AUD = ROOT / 'work' / 'content-audit'
WRITE = '--write' in sys.argv

ABBREV = re.compile(r'\b(Mr|Ms|Mrs|Dr|St|Jr|Sr|vs|etc|e\.g|i\.e)\.(?=\s)')
MARK = re.compile(r'\[\[([^\]:]+):([^\]]+)\]\]')
BROKEN = re.compile(r'\]\][a-z]')
CJK = re.compile(r'[\u4e00-\u9fff]')
ZH_PUNCT = re.compile(r'[，。、；：！？]')
NEW_SENT = re.compile(r'[.!?][")\]]?\s+[A-Z]')


def keys_of(en):
    return [m.group(1) for m in MARK.finditer(en)]


def plain_of(en):
    return MARK.sub(lambda m: m.group(2), en)


def decl_plain_words(text, decl):
    low = text.lower()
    out = set()
    for w in decl:
        w = str(w).lower()
        if re.search(r'(?<![a-z])' + re.escape(w) + r'(?![a-z])', low):
            out.add(w)
    return out


def main():
    with open(ROOT / 'data/sections.json', encoding='utf-8') as f:
        sections = json.load(f)

    report = {'applied': 0, 'kept': 0, 'skipped': [], 'missing': [], 'paraZh': 0}
    new_sections = json.loads(json.dumps(sections, ensure_ascii=False))

    for si, sec in enumerate(sections):
        orig = json.load(open(AUD / f'sec{si}.json', encoding='utf-8'))
        decl = [str(w).lower() for w in orig.get('declared_words', [])]
        files = sorted(glob.glob(str(AUD / f'sec{si}.rewrite.*.json')))
        sents_updates = {}
        parazh_updates = {}
        for fp in files:
            try:
                data = json.load(open(fp, encoding='utf-8'))
            except Exception as e:
                report['skipped'].append(f'sec{si} {os.path.basename(fp)}: JSON 解析失败 {e}')
                continue
            if data.get('si') != si:
                report['skipped'].append(f'sec{si} {os.path.basename(fp)}: si 不匹配 {data.get("si")}')
                continue
            for k, v in (data.get('sents') or {}).items():
                sents_updates[k] = v
            for k, v in (data.get('paraZh') or {}).items():
                parazh_updates[str(k)] = v

        # 覆盖检查
        for pi, para in enumerate(sec['paragraphs']):
            for ti in range(len(para)):
                if f'{pi}.{ti}' not in sents_updates:
                    report['missing'].append(f'sec{si} {pi}.{ti}')

        for key, v in sents_updates.items():
            try:
                pi, ti = (int(x) for x in key.split('.'))
                old_en = sec['paragraphs'][pi][ti]
            except Exception:
                report['skipped'].append(f'sec{si} {key}: 坐标不存在')
                continue
            en, zh = str(v.get('en') or ''), str(v.get('zh') or '')
            why = None
            if not en or not zh:
                why = '空内容'
            elif keys_of(en) != keys_of(old_en):
                why = f'key 序变了: 原 {keys_of(old_en)} → 新 {keys_of(en)}'
            elif BROKEN.search(en):
                why = '断标 ]][a-z]'
            elif any(c in m for m in keys_of(en) for c in '[]|'):
                why = 'key 非法字符'
            else:
                plain = plain_of(en)
                for m in MARK.finditer(en):
                    d = m.group(2)
                    if not d or any(c in d for c in '[]|:'):
                        why = f'display 非法: {d!r}'; break
                    if d not in plain:
                        why = f'显示形 {d!r} 不在正文中'; break
            if not why:
                bare = ABBREV.sub(r'\1‡', en)
                if NEW_SENT.search(bare):
                    why = '疑似多句（句末标点+大写开头）'
                elif CJK.search(en):
                    why = '英文含中文'
                elif not ZH_PUNCT.search(zh):
                    why = '中文无标点'
                elif '[[' in zh:
                    why = '中文含标记'
            if not why:
                lo, hi = len(plain_of(old_en)), len(plain_of(en))
                if lo and (hi > lo * 3 or hi < lo * 0.25):
                    why = f'长度异常 {lo}→{hi}'
                elif lo and (hi > lo * 2.5 or hi < lo * 0.4):
                    report['skipped'].append(f'sec{si} {key}: 长度告警放行 {lo}→{hi}')
            if not why:
                # 平文口径与门禁 validate_data.py 第 12 条一致：先「去掉」标记再查
                # （display 可按语法屈折，标记本身是规范允许的提及方式，不算平文）。
                added = decl_plain_words(MARK.sub(' ', en), decl) - decl_plain_words(MARK.sub(' ', old_en), decl)
                if added:
                    why = f'新引入声明词平文: {sorted(added)}'
            if why:
                report['skipped'].append(f'sec{si} {key}: {why}')
                continue
            if en == old_en and zh == (sec.get('sentZh', [[[]]]) [pi][ti] if pi < len(sec.get('sentZh', [])) and ti < len(sec['sentZh'][pi]) else ''):
                report['kept'] += 1
            else:
                report['applied'] += 1
            new_sections[si]['paragraphs'][pi][ti] = en
            new_sections[si]['sentZh'][pi][ti] = zh

        for k, v in parazh_updates.items():
            try:
                pi = int(k)
                if pi >= len(new_sections[si]['paragraphs']):
                    raise ValueError
            except Exception:
                report['skipped'].append(f'sec{si} paraZh[{k}]: 下标不存在')
                continue
            v = str(v or '').strip()
            if not v or not ZH_PUNCT.search(v):
                report['skipped'].append(f'sec{si} paraZh[{k}]: 空或无标点')
                continue
            old = (new_sections[si].get('paraZh') or [None] * 999)[pi] if pi < len(new_sections[si].get('paraZh') or []) else None
            if v != old:
                report['applied'] += 1
            new_sections[si].setdefault('paraZh', [])
            while len(new_sections[si]['paraZh']) <= pi:
                new_sections[si]['paraZh'].append('')
            new_sections[si]['paraZh'][pi] = v
            report['paraZh'] += 1

        # 结构不变性
        if len(new_sections[si]['paragraphs']) != len(sec['paragraphs']):
            report['skipped'].append(f'sec{si}: 段数变了!回退整篇')
            new_sections[si] = json.loads(json.dumps(sec, ensure_ascii=False))
        for pi, (a, b) in enumerate(zip(new_sections[si]['paragraphs'], sec['paragraphs'])):
            if len(a) != len(b):
                report['skipped'].append(f'sec{si} 段{pi}: 句数变了!回退该段')
                new_sections[si]['paragraphs'][pi] = b
                new_sections[si]['sentZh'][pi] = sec['sentZh'][pi]

    print(f"应用改写: {report['applied']} 句 (含 paraZh {report['paraZh']} 条), 原样保留: {report['kept']}")
    if report['missing']:
        print(f"\n未覆盖 {len(report['missing'])} 句（前 20 条）:")
        for x in report['missing'][:20]:
            print('  -', x)
    if report['skipped']:
        print(f"\n拒绝 {len(report['skipped'])} 条（前 40 条）:")
        for x in report['skipped'][:40]:
            print('  -', x)
    bad = len(report['skipped']) + len(report['missing'])
    if bad:
        print(f"\n共 {bad} 条问题 —— 先修 rewrite 文件再 --write")
        sys.exit(1)
    if WRITE:
        with open(ROOT / 'data/sections.json', 'w', encoding='utf-8') as f:
            json.dump(new_sections, f, ensure_ascii=False, indent=1)
        print('已写入 data/sections.json')
    else:
        print('（干跑，未写盘）')


if __name__ == '__main__':
    main()
