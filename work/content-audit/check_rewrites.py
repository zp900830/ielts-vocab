#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""校验 rewrite 与 notes 升级文件的覆盖面与硬规则（只读，不写盘）。

用法: python3 work/content-audit/check_rewrites.py
输出: 每篇的缺失/多余句坐标、逐句硬规则违规明细；notes.up 的结构校验。
"""
import json, re, sys, glob, os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
AUD = ROOT / 'work' / 'content-audit'

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

def check_sentence(si, key, old_en, v, problems):
    en, zh = str(v.get('en') or ''), str(v.get('zh') or '')
    tag = f'sec{si} {key}'
    if not en or not zh:
        problems.append(f'{tag}: 空内容'); return
    if keys_of(en) != keys_of(old_en):
        problems.append(f'{tag}: key 序变 {keys_of(old_en)} -> {keys_of(en)}'); return
    if BROKEN.search(en):
        problems.append(f'{tag}: 断标 ]][a-z]')
    plain = plain_of(en)
    for m in MARK.finditer(en):
        d = m.group(2)
        if not d or any(c in d for c in '[]|:'):
            problems.append(f'{tag}: display 非法 {d!r}'); break
        if d not in plain:
            problems.append(f'{tag}: 显示形 {d!r} 不在正文'); break
    if NEW_SENT.search(ABBREV.sub(r'\1‡', en)):
        problems.append(f'{tag}: 疑似多句')
    if CJK.search(en):
        problems.append(f'{tag}: 英文含中文')
    if not ZH_PUNCT.search(zh):
        problems.append(f'{tag}: 中文无标点')
    if '[[' in zh:
        problems.append(f'{tag}: 中文含标记')
    lo, hi = len(plain_of(old_en)), len(plain)
    if lo and (hi > lo * 3 or hi < lo * 0.25):
        problems.append(f'{tag}: 长度异常 {lo}->{hi}')

def main():
    all_ok = True
    for si in range(6):
        src = AUD / f'sec{si}.json'
        sec = json.load(open(src, encoding='utf-8'))
        coords = [(pi, ti) for pi, para in enumerate(sec['paragraphs']) for ti in range(len(para))]
        want = {f'{pi}.{ti}' for pi, ti in coords}
        files = sorted(glob.glob(str(AUD / f'sec{si}.rewrite.*.json')))
        got = {}
        parse_errors = []
        for fp in files:
            try:
                d = json.load(open(fp, encoding='utf-8'))
            except Exception as e:
                parse_errors.append(f'{os.path.basename(fp)}: {e}'); continue
            if d.get('si') != si:
                parse_errors.append(f'{os.path.basename(fp)}: si={d.get("si")} 应为 {si}'); continue
            for k, v in (d.get('sents') or {}).items():
                got[k] = v
        missing = sorted(want - set(got), key=lambda x: [int(p) for p in x.split('.')])
        extra = sorted(set(got) - want, key=lambda x: [int(p) for p in x.split('.')])
        problems = []
        for k, v in got.items():
            pi, ti = k.split('.')
            try:
                old_en = sec['paragraphs'][int(pi)][int(ti)]
            except Exception:
                problems.append(f'sec{si} {k}: 坐标不存在'); continue
            check_sentence(si, k, old_en, v, problems)
        status = 'OK' if not (missing or extra or problems or parse_errors) else 'FAIL'
        if status == 'FAIL':
            all_ok = False
        print(f'--- sec{si}: 文件 {len(files)} 个, 覆盖 {len(set(got) & want)}/{len(want)} 句 [{status}]')
        for e in parse_errors[:10]: print('   解析/契约:', e)
        for m in missing[:40]: print('   缺失:', m)
        if len(missing) > 40: print(f'   ... 还有 {len(missing)-40} 句缺失')
        for x in extra[:10]: print('   多余:', x)
        for p in problems[:40]: print('   违规:', p)
        if len(problems) > 40: print(f'   ... 还有 {len(problems)-40} 条违规')

    # notes.up 校验
    for part in ('a', 'b'):
        srcp = AUD / f'notes_src.{part}.json'
        upp = AUD / f'notes.up.{part}.json'
        src = json.load(open(srcp, encoding='utf-8'))
        try:
            up = json.load(open(upp, encoding='utf-8'))
        except Exception as e:
            print(f'--- notes.up.{part}: JSON 解析失败 {e}'); all_ok = False; continue
        srcmap = {r['k']: r for r in src}
        upmap = {r.get('k'): r for r in up}
        miss = set(srcmap) - set(upmap)
        extra = set(upmap) - set(srcmap)
        probs = []
        for k, r in upmap.items():
            if k not in srcmap: continue
            note = str(r.get('note') or '')
            old = srcmap[k]['note']
            if not note.startswith('同义词'):
                probs.append(f'{k}: 前缀不是同义词：')
            if '词伙：' in old:
                otail = old.split('词伙：', 1)[1]
                if '词伙：' not in note or note.split('词伙：', 1)[1] != otail:
                    probs.append(f'{k}: 词伙尾巴被改')
            if not ZH_PUNCT.search(note):
                probs.append(f'{k}: 无中文标点')
            if '[[' in note:
                probs.append(f'{k}: 含 [[')
            if len(note) > 190:
                probs.append(f'{k}: 超长 {len(note)}')
        st = 'OK' if not (miss or extra or probs) else 'FAIL'
        if st == 'FAIL': all_ok = False
        print(f'--- notes.up.{part}: {len(up)}/{len(src)} 条 [{st}]')
        for m in sorted(miss)[:20]: print('   缺失:', m)
        for x in sorted(extra)[:20]: print('   多余:', x)
        for p in probs[:30]: print('   违规:', p)
        if len(probs) > 30: print(f'   ... 还有 {len(probs)-30} 条违规')

    print('CHECK', 'PASSED' if all_ok else 'FAILED')
    sys.exit(0 if all_ok else 1)

if __name__ == '__main__':
    main()
