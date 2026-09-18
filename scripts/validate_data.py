#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""数据校验：确保词汇、章节、故事占位符之间的一致性。"""
import json, re, sys, hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# 主站 fetchCached 用 DATA_VER 做 Cache API 的 x-ver 键：改了数据文件而没 bump
# DATA_VER，线上会永久命中旧缓存且无任何报错。故把版本号定义为这些文件的内容哈希，
# 由本脚本校验一致性 —— 忘记 bump 会直接 FAIL，而不是静默服务旧词库。
DATA_VER_FILES = ['data/book.json', 'data/sup.json', 'data/stories.json', 'data/covers.json']

def data_ver():
    h = hashlib.sha256()
    for rel in DATA_VER_FILES:
        b = (ROOT / rel).read_bytes()
        h.update(rel.encode('utf-8'))
        h.update(len(b).to_bytes(8, 'big'))
        h.update(b)
    return h.hexdigest()[:10]

def load(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def main():
    vocab = load(ROOT / 'shadow' / 'data' / 'vocab.json')
    chapters = load(ROOT / 'shadow' / 'data' / 'chapters.json')
    sections = load(ROOT / 'shadow' / 'data' / 'sections.json')
    root_vocab = load(ROOT / 'data' / 'vocab.json')
    book = load(ROOT / 'data' / 'book.json')

    errors = []
    warnings = []   # 已知待修项：报告但不阻断，修完后可逐条上提为 error

    # 0. DATA_VER 必须等于数据文件内容哈希
    want = data_ver()
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    m = re.search(r'const DATA_VER\s*=\s*"([0-9a-fA-F]+)"', html)
    if not m:
        errors.append('index.html: 找不到 const DATA_VER = "..."，无法校验缓存版本')
    elif m.group(1) != want:
        errors.append(f'index.html DATA_VER 已过期：当前 {m.group(1)}，数据文件哈希为 {want}。'
                      f' 请改为 "{want}"，否则线上会永久命中旧缓存。')

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

    # 5. 释义排版脏字符：悬挂分号与重复分号会直接渲染进词卡弹窗
    trail = [r[1] for r in book if isinstance(r[3], str) and r[3].rstrip().endswith('；')]
    if trail:
        errors.append(f"{len(trail)} book.json defs end with ；: {trail[:10]}")
    dbl = []
    for name, d in (('shadow vocab', vocab), ('root vocab', root_vocab)):
        for w, e in d.items():
            txt = e.get('m') if isinstance(e, dict) else (e[3] if isinstance(e, list) else '')
            if isinstance(txt, str) and '；；' in txt:
                dbl.append(f"{name}:{w}")
    if dbl:
        errors.append(f"{len(dbl)} defs contain ；；: {dbl[:10]}")

    # 6. book.json 重复词头：DICT 构建为后写覆盖，徽章与例句可能张冠李戴
    seen, dup = set(), []
    for r in book:
        k = r[1].lower()
        if k in seen:
            dup.append(k)
        seen.add(k)
    if dup:
        warnings.append(f"{len(dup)} duplicate headwords in book.json (later row wins): {sorted(set(dup))[:12]}")

    # 7. 大小写不一致的词头：上面 2/3 项用 lower() 比较会掩盖这类脏键
    vkeys = set(vocab.keys())
    case_bad = sorted({w for ch in chapters for w in ch.get('words', [])
                       if w not in vkeys and w.lower() in vkeys})
    if case_bad:
        warnings.append(f"{len(case_bad)} chapter words differ only by case from vocab keys: {case_bad[:12]}")

    # 8. 词表列了但正文从未出现的目标词（sections 的 [[word:form]] 标记）
    marked = set()
    for sec in sections:
        for para in sec.get('paragraphs', []):
            for sent in para:
                for m in placeholder_re.finditer(sent):
                    marked.add(m.group(1).lower())
    orphan = sorted(ch_words - marked)
    if orphan:
        warnings.append(f"{len(orphan)} chapter words never appear in section text: {orphan[:12]}")

    # 9. 基础统计
    print(f"vocab: {len(vocab)} words")
    print(f"chapters: {len(chapters)} macro chapters, {len(ch_words)} unique words")
    print(f"sections placeholders: {len(ph_words)} unique words")
    print(f"root vocab: {len(root_vocab)} words")
    print(f"book: {len(book)} rows")

    if warnings:
        print('\n待修告警（不阻断）:')
        for w in warnings:
            print(' -', w)

    if errors:
        print('\nValidation FAILED:')
        for e in errors:
            print(' -', e)
        sys.exit(1)
    print('\nValidation PASSED')

if __name__ == '__main__':
    main()
