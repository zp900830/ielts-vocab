#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""统一词汇 schema：把 data/vocab.json（笔记）与 data/vocab-map.json（音标释义）合并成
单一来源 data/vocab.json，并同步更新 shadow/data/vocab.json（保留现有 ex/exZh/uk/us 等扩展字段）。
"""
import argparse, json, os, shutil
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def load_json(path: Path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path: Path, data, indent=0):
    tmp = path.with_suffix('.tmp')
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=indent)
        f.write('\n')
    os.replace(tmp, path)

def main():
    parser = argparse.ArgumentParser(description='Normalize vocabulary schema.')
    parser.add_argument('--apply', action='store_true', help='Apply changes (default is dry-run)')
    parser.add_argument('--no-backup', action='store_true', help='Skip backups')
    args = parser.parse_args()

    raw_vocab = load_json(ROOT / 'data' / 'vocab.json')
    vocab_map = load_json(ROOT / 'data' / 'vocab-map.json')
    shadow_vocab = load_json(ROOT / 'shadow' / 'data' / 'vocab.json')

    # 1. 拆分章节元数据
    chapters_raw = raw_vocab.pop('chapters', None)

    # 2. 合并 root 词汇：p/m 来自 vocab-map，note 保留自现有 vocab
    merged_root = {}
    for word in vocab_map:
        key = word.lower()
        entry = dict(vocab_map[word])
        note = ''
        if key in raw_vocab and isinstance(raw_vocab[key], dict):
            note = raw_vocab[key].get('note', '')
        merged_root[key] = {'p': entry.get('p', ''), 'm': entry.get('m', ''), 'note': note}

    # 3. 同步 shadow/data/vocab.json：保留扩展字段并补入 note
    merged_shadow = {}
    for word, entry in shadow_vocab.items():
        key = word.lower()
        new_entry = dict(entry)
        root_entry = merged_root.get(key, {})
        new_entry.setdefault('p', root_entry.get('p', ''))
        new_entry.setdefault('m', root_entry.get('m', ''))
        new_entry.setdefault('note', root_entry.get('note', ''))
        merged_shadow[word] = new_entry

    print(f"root vocab entries: {len(merged_root)}")
    print(f"shadow vocab entries: {len(merged_shadow)}")
    print(f"notes carried from root: {sum(1 for e in merged_root.values() if e.get('note'))}")
    if chapters_raw:
        print(f"chapters metadata entries: {len(chapters_raw)}")

    if not args.apply:
        print('Dry-run complete. Use --apply to write files.')
        return

    # 备份
    if not args.no_backup:
        ts = datetime.now().strftime('%Y%m%d-%H%M%S')
        for p in [ROOT/'data'/'vocab.json', ROOT/'shadow'/'data'/'vocab.json']:
            if p.exists():
                shutil.copy2(p, p.with_suffix(f'.json.backup-{ts}'))
        if chapters_raw:
            shutil.copy2(ROOT/'data'/'vocab.json', ROOT/'data'/f'vocab.json.backup-{ts}-with-chapters')

    # 写入
    save_json(ROOT / 'data' / 'vocab.json', merged_root, indent=2)
    save_json(ROOT / 'shadow' / 'data' / 'vocab.json', merged_shadow, indent=2)
    if chapters_raw:
        save_json(ROOT / 'data' / 'chapters-raw.json', chapters_raw, indent=2)
        print('Wrote data/chapters-raw.json')
    print('Wrote data/vocab.json and shadow/data/vocab.json')

if __name__ == '__main__':
    main()
