#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 notes.up.{a,b}.json 的辨析升级合并回 data/vocab.json，校验后紧凑写盘。

用法:
  python3 work/content-audit/merge_notes.py            # 干跑，只报告
  python3 work/content-audit/merge_notes.py --write    # 真正写 data/vocab.json

输入契约:
  work/content-audit/notes.up.<batch>.json  = [{"k": key, "note": 新note}, ...]

硬校验（任一失败该条拒绝）:
  1. k 必须存在于 vocab
  2. 新 note 非空、无 [[
  3. 原 note 含「词伙：」时，新 note 的「词伙：」及其后文本必须逐字保留
  4. 原 note 以「同义词：」开头时新 note 仍以其开头（保持卡片标签自适应逻辑）
  5. 含中文标点；长度 ≤ 200 字符
"""
import json, re, sys, glob, os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
AUD = ROOT / 'work' / 'content-audit'
WRITE = '--write' in sys.argv
ZH_PUNCT = re.compile(r'[，。、；：！？]')

def main():
    vocab = json.load(open(ROOT / 'data/vocab.json', encoding='utf-8'))
    applied, kept, rejected = 0, 0, []
    for fp in sorted(glob.glob(str(AUD / 'notes.up.*.json'))):
        try:
            rows = json.load(open(fp, encoding='utf-8'))
        except Exception as e:
            rejected.append(f'{os.path.basename(fp)}: JSON 解析失败 {e}'); continue
        for r in rows:
            k = str(r.get('k') or '')
            note = str(r.get('note') or '').strip()
            if k not in vocab:
                rejected.append(f'{k}: vocab 无此词'); continue
            old = vocab[k].get('note') or ''
            if not note or '[[' in note:
                rejected.append(f'{k}: 空或含 [['); continue
            if old.startswith('同义词') and not note.startswith('同义词'):
                rejected.append(f'{k}: 前缀变了'); continue
            if '词伙：' in old:
                otail = old.split('词伙：', 1)[1]
                if '词伙：' not in note or note.split('词伙：', 1)[1] != otail:
                    rejected.append(f'{k}: 词伙尾巴被改'); continue
            if not ZH_PUNCT.search(note):
                rejected.append(f'{k}: 无中文标点'); continue
            if len(note) > 200:
                rejected.append(f'{k}: 超长 {len(note)}'); continue
            if note == old:
                kept += 1
            else:
                applied += 1
            vocab[k]['note'] = note
    print(f'辨析卡应用: {applied} 条, 原样保留: {kept} 条')
    if rejected:
        print(f'拒绝 {len(rejected)} 条（前 40 条）:')
        for x in rejected[:40]: print('  -', x)
        sys.exit(1)
    if WRITE:
        with open(ROOT / 'data/vocab.json', 'w', encoding='utf-8') as f:
            json.dump(vocab, f, ensure_ascii=False, separators=(',', ':'))
        print('已写入 data/vocab.json')
    else:
        print('（干跑，未写盘）')

if __name__ == '__main__':
    main()
