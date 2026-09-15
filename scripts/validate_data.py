#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""数据校验：确保词汇、章节、故事占位符之间的一致性。"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def load(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def main():
    vocab = load(ROOT / 'shadow' / 'data' / 'vocab.json')
    chapters = load(ROOT / 'shadow' / 'data' / 'chapters.json')
    sections = load(ROOT / 'shadow' / 'data' / 'sections.json')
    root_vocab = load(ROOT / 'data' / 'vocab.json')

    errors = []

    # 1. 每个词都有 p/m
    missing_pm = [w for w, e in vocab.items() if not e.get('p') or not e.get('m')]
    if missing_pm:
        errors.append(f"{len(missing_pm)} words missing p/m: {missing_pm[:10]}")

    # 2. chapters.json 里的词都在 vocab 里
    ch_words = set()
    for ch in chapters:
        for w in ch.get('words', []):
            ch_words.add(w.lower())
    missing_in_vocab = ch_words - set(w.lower() for w in vocab)
    if missing_in_vocab:
        errors.append(f"{len(missing_in_vocab)} chapter words not in vocab: {list(missing_in_vocab)[:10]}")

    # 3. sections.json 占位符 [[word:form]] 对应的 word 存在
    placeholder_re = re.compile(r'\[\[([^\]:|]+)')
    ph_words = set()
    for sec in sections:
        for para in sec.get('paragraphs', []):
            for sent in para:
                for m in placeholder_re.finditer(sent):
                    ph_words.add(m.group(1).lower())
    missing_ph = ph_words - set(w.lower() for w in vocab)
    if missing_ph:
        errors.append(f"{len(missing_ph)} placeholder words not in vocab: {list(missing_ph)[:10]}")

    # 4. root vocab 与 shadow vocab 键一致
    root_keys = set(root_vocab.keys())
    shadow_keys = set(w.lower() for w in vocab)
    if root_keys != shadow_keys:
        only_root = root_keys - shadow_keys
        only_shadow = shadow_keys - root_keys
        if only_root:
            errors.append(f"{len(only_root)} words only in root vocab: {list(only_root)[:10]}")
        if only_shadow:
            errors.append(f"{len(only_shadow)} words only in shadow vocab: {list(only_shadow)[:10]}")

    # 5. 基础统计
    print(f"vocab: {len(vocab)} words")
    print(f"chapters: {len(chapters)} macro chapters, {len(ch_words)} unique words")
    print(f"sections placeholders: {len(ph_words)} unique words")
    print(f"root vocab: {len(root_vocab)} words")

    if errors:
        print('\nValidation FAILED:')
        for e in errors:
            print(' -', e)
        sys.exit(1)
    print('\nValidation PASSED')

if __name__ == '__main__':
    main()
