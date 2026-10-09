#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""全书内容二次排查：机器全量体检（只读）。

覆盖用户四项诉求中可机检的部分：
  A. 词卡完整性：句中引用 key 全部有词条；词条 m/p/音标/ex/exZh 无空值；
     note 无截断迹象（不以标点/括号收口）、无残留标记；
  B. 译文对应：sentZh 逐句存在、有句末标点、无 [[、无孤立英文单词、
     长度与英文比例合理、疑问/叹号语气对齐、数字出现对齐（EN 数字 -> ZH 含同值）；
  C. 英文流畅性：无中文混入、无断标、无重复词（the the）、无双空格、
     无小写句首、单句规则、连续 3 句同主语开头、句长分布；
  D. 辨析卡：同义词 note 格式合规（每个同义词后跟全角括注）、词伙尾巴非空、
     cmp 表成员存在、例句引用（交由门禁覆盖，这里查 title/summary/diff 完整性）。

输出：分类问题清单（坐标 + 违规详情），供人工/子代理复核修正。
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
MARK = re.compile(r'\[\[([^\]:]+):([^\]]+)\]\]')
ABBREV = re.compile(r'\b(Mr|Ms|Mrs|Dr|St|Jr|Sr|vs|etc|e\.g|i\.e)\.(?=\s)')
NEW_SENT = re.compile(r'[.!?][")\]]?\s+[A-Z]')
ZH_END = re.compile(r'[。！？；…”』」)]$')

def plain_of(en):
    return MARK.sub(lambda m: m.group(2), en)

def main():
    sections = json.load(open(ROOT / 'data/sections.json', encoding='utf-8'))
    vocab = json.load(open(ROOT / 'data/vocab.json', encoding='utf-8'))
    P = {}   # 问题清单：类目 -> [(坐标, 详情)]

    def add(cat, where, detail):
        P.setdefault(cat, []).append((where, detail))

    # ---------- A. 词卡完整性 ----------
    refs = {}
    for si, sec in enumerate(sections):
        for pi, para in enumerate(sec['paragraphs']):
            for ti, sent in enumerate(para):
                for m in MARK.finditer(sent):
                    refs.setdefault(m.group(1).lower(), []).append(f'{si}.{pi}.{ti}')
    for k, where in refs.items():
        e = vocab.get(k)
        if not e:
            add('A1 引用词无词条', where[0], k); continue
        if not (e.get('m') or '').strip():
            add('A2 词条缺词义', f'{k}@{where[0]}', e.get('m'))
        if not (e.get('p') or '').strip():
            add('A3 词条缺词性', f'{k}@{where[0]}', e.get('p'))
        if not ((e.get('uk') or '').strip() or (e.get('us') or '').strip() or (e.get('p') or '').strip()):
            add('A4 词条缺音标', f'{k}@{where[0]}', '')
        ex, z = (e.get('ex') or '').strip(), (e.get('exZh') or '').strip()
        if ex and not z:
            add('A5 例句无译文', k, ex[:40])
        if z and not ex:
            add('A6 译文无例句', k, z[:40])
        note = (e.get('note') or '').strip()
        if note:
            if note.endswith(('，', '、', '（', ':', '：')):
                add('A7 note 疑似截断', k, note[-24:])
            if '[[' in note:
                add('A8 note 残留标记', k, note[:40])
            if re.search(r'\b[a-z]{2,}\s{2,}[a-z]', note):
                add('A9 note 双空格', k, note[:40])

    # ---------- B/C. 逐句体检 ----------
    for si, sec in enumerate(sections):
        paras = sec['paragraphs']; zhs = sec.get('sentZh', [])
        for pi, para in enumerate(paras):
            zh_list = zhs[pi] if pi < len(zhs) else []
            starts = []
            for ti, sent in enumerate(para):
                where = f'{si}.{pi}.{ti}'
                en_plain = plain_of(sent)
                zh = zh_list[ti] if ti < len(zh_list) else ''
                # C 英文
                if re.search(r'[\u4e00-\u9fff]', en_plain):
                    add('C1 英文含中文', where, en_plain[:50])
                if re.search(r'\]\][a-z]', sent):
                    add('C2 断标', where, sent[-30:])
                if NEW_SENT.search(ABBREV.sub(r'\1‡', en_plain)):
                    add('C3 疑似多句', where, en_plain[:60])
                if re.search(r'\b(\w+) \1\b', en_plain, re.I):
                    add('C4 重复词', where, en_plain[:60])
                if '  ' in en_plain:
                    add('C5 双空格', where, en_plain[:50])
                if re.search(r'\s+[,.;!?]', en_plain):
                    add('C6 标点前空格', where, en_plain[:50])
                first_word = re.match(r'[A-Za-z"]+', en_plain)
                if first_word and first_word.group(0)[0].islower() and not re.match(r'^[a-z]+[\u2019\']', en_plain or ''):
                    # 句首小写（引号内对话等允许：以 " 开头的已排除）
                    add('C7 句首小写', where, en_plain[:40])
                words = en_plain.split()
                if not words:
                    add('C8 空句', where, '')
                elif len(words) > 26:
                    add('C9 句子偏长(>26词)', where, f'{len(words)}词: {en_plain[:50]}')
                starts.append((en_plain.split()[0] if words else '').lower().strip('"('))
                if len(starts) >= 3 and starts[-1] == starts[-2] == starts[-3] and starts[-1]:
                    add('C10 连续3句同主语开头', where, starts[-1])
                # B 中文
                if not zh.strip():
                    add('B1 缺译文', where, sent[:40]); continue
                if '[[' in zh:
                    add('B2 译文含标记', where, zh[:40])
                if not ZH_END.search(zh.strip()):
                    add('B3 译文无句末标点', where, zh[-20:])
                if re.search(r'[\u4e00-\u9fff]', en_plain) is None:
                    en_alpha = set(re.findall(r'[A-Za-z]{3,}', en_plain.lower()))
                    zh_alpha = set(re.findall(r'[A-Za-z]{3,}', zh.lower()))
                    inter = en_alpha - {'the', 'and', 'for', 'with', 'her', 'his', 'she', 'was', 'are', 'not', 'out', 'all', 'one', 'two'} - {w.lower() for w in []}
                    inter &= zh_alpha
                    if len(inter) >= 3:
                        add('B4 译文残留英文单词', where, ' '.join(sorted(inter))[:40])
                en_digits = set(re.findall(r'\d+(?:[.,]\d+)?', en_plain))
                for d in en_digits:
                    if d not in zh and d.replace('.', '') not in zh.replace('.', ''):
                        # 容许中文数字写法：一/两/三…（只对 0-10 简单豁免个位）
                        if not (len(d) == 1 and d.isdigit() and int(d) <= 10):
                            add('B5 数字未对齐', where, f'EN有{d}: {zh[:40]}')
                if en_plain.rstrip('"\'').endswith('?') and not re.search(r'[？?]', zh):
                    add('B6 疑问语气未对齐', where, zh[-24:])
                # 长度比例：EN 词数 vs ZH 字数（粗检：<0.8 或 >3.2 标记）
                if words and zh:
                    ratio = len(re.findall(r'[\u4e00-\u9fff]', zh)) / len(words)
                    if ratio < 0.7 or ratio > 3.4:
                        add('B7 译文长度比例异常', where, f'{ratio:.1f}: {zh[:36]}')

        # paraZh
        pz = sec.get('paraZh') or []
        for pi in range(len(paras)):
            v = pz[pi] if pi < len(pz) else ''
            if not (v or '').strip():
                add('D0 段落小结缺失', f'{si}.段{pi}', '')
            elif len(v) > 46:
                add('D1 段落小结偏长', f'{si}.段{pi}', v)

    # ---------- E. 辨析卡 ----------
    for k, e in vocab.items():
        note = (e.get('note') or '').strip()
        if note.startswith('同义词：'):
            seg = note.split('词伙：')[0]
            items = [x.strip() for x in re.split('[；;]', seg.replace('同义词：', '')) if x.strip()]
            for it in items:
                if not re.search(r'（[^）]+）$', it):
                    add('E1 同义词缺括注', k, it[:40])
        if note.startswith('词伙：') and len(note) < 8:
            add('E2 词伙疑似过短', k, note)
        cmp = e.get('cmp')
        if isinstance(cmp, dict) and cmp.get('type') == 'compare':
            if not cmp.get('title'): add('E3 cmp缺title', k, '')
            if not cmp.get('summary'): add('E4 cmp缺summary', k, '')
            if not cmp.get('diff'): add('E5 cmp缺diff', k, '')
            for it in cmp.get('items', []):
                if not it.get('eg'): add('E6 cmp成员缺例句', f"{k}/{it.get('w')}", '')

    total = sum(len(v) for v in P.values())
    print(f'机器体检完成：{total} 条待复核')
    for cat in sorted(P):
        lst = P[cat]
        print(f'\n== {cat}：{len(lst)} 条')
        for where, detail in lst[:12]:
            print(f'   [{where}] {detail}')
        if len(lst) > 12:
            print(f'   ... 其余 {len(lst)-12} 条省略')
    # 落盘完整清单
    with open(ROOT / 'work/content-audit2/machine-findings.json', 'w', encoding='utf-8') as f:
        json.dump({k: v for k, v in P.items()}, f, ensure_ascii=False, indent=1)
    print('\n完整清单: work/content-audit2/machine-findings.json')

if __name__ == '__main__':
    main()
