#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""正文改写后，修复辨析卡 items[].eg 引用失效（例句查无出处）。

原理：改写保持句坐标不变。失效 eg 一定是旧课文的片段/整句引用（词卡自带 ex
引用不受影响，仍在 hay 里）。定位旧 eg 出自哪个旧句（片段包含匹配）→ 取同一
坐标的新句（去标记平文）作为新 eg。多处命中时选内容词重合度最高者。

用法:
  python3 work/content-audit/fix_cmp_egs.py           # 干跑：只报告
  python3 work/content-audit/fix_cmp_egs.py --write   # 应用修复并写 data/vocab.json
"""
import json, re, sys, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
WRITE = '--write' in sys.argv
MARK = re.compile(r'\[\[([^\]:]+):([^\]]+)\]\]')
sys.path.insert(0, str(ROOT / 'tools'))
from check_compare_draft import sec_variants   # 与门禁同源的课文拆法

def plain_of(en):
    return MARK.sub(lambda m: m.group(2), en)

def words(s):
    stop = {'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'at', 'for',
            'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been',
            'that', 'this', 'it', 'its', 'his', 'her', 'their', 'our', 'your'}
    return set(re.findall(r"[a-z']+", s.lower())) - stop

def build_hay(sections, vocab):
    raw = json.dumps(sections, ensure_ascii=False)
    bits = []
    for w, c in vocab.items():
        bits.append(str(w))
        if isinstance(c, dict):
            bits += [str(c.get(k) or '') for k in ('m', 'ex', 'exZh')]
            if isinstance(c.get('note'), str):
                bits.append(c['note'])
    return ' '.join([*sec_variants(raw), ' '.join(bits)]).lower()

def main():
    old_sections = json.loads(subprocess.run(
        ['git', 'show', 'HEAD:data/sections.json'], capture_output=True, text=True,
        cwd=ROOT).stdout)
    new_sections = json.load(open(ROOT / 'data/sections.json', encoding='utf-8'))
    vocab = json.load(open(ROOT / 'data/vocab.json', encoding='utf-8'))
    hay = build_hay(new_sections, vocab)

    # 旧句坐标索引：(si, pi, ti, 旧平文小写, 新平文原样)
    old_sents = []
    for si, sec in enumerate(old_sections):
        for pi, para in enumerate(sec['paragraphs']):
            for ti, sent in enumerate(para):
                old_sents.append((si, pi, ti, plain_of(sent).lower(),
                                  plain_of(new_sections[si]['paragraphs'][pi][ti])))

    fixed, failed = 0, []
    for k, e in vocab.items():
        cmp = e.get('cmp')
        if not (isinstance(cmp, dict) and cmp.get('type') == 'compare'):
            continue
        for it in cmp.get('items', []):
            eg = it.get('eg')
            if not (isinstance(eg, str) and eg.strip()):
                continue
            if eg.lower().strip() in hay:
                continue                      # 仍可查到（词卡 ex 引用等），无需修
            frag = eg.lower().strip()
            hits = [o for o in old_sents if frag in o[3]]
            if not hits:
                # 退一步：标点差异（旧文片段可能被卡片截去过标点），按内容词找最优旧句
                fw = words(frag)
                scored = [(len(fw & words(o[3])), o) for o in old_sents]
                scored = [s for s in scored if s[0] >= max(2, len(fw) - 2)]
                hits = [o for _, o in sorted(scored, reverse=True)[:3]]
                if not hits:
                    failed.append((k, it.get('w'), eg[:60], '旧课文找不到出处'))
                    continue
            if len(hits) == 1:
                new_eg = hits[0][4]
            else:
                fw = words(frag)
                best = max(hits, key=lambda o: len(fw & words(o[4])))
                new_eg = best[4]
            it['eg'] = new_eg
            fixed += 1

    print(f'修复引用: {fixed} 处')
    if failed:
        print(f'无法自动定位: {len(failed)} 处:')
        for f in failed[:30]:
            print('  -', f)
    # 终验
    hay2 = build_hay(new_sections, vocab)
    miss = []
    for k, e in vocab.items():
        cmp = e.get('cmp')
        if not (isinstance(cmp, dict) and cmp.get('type') == 'compare'):
            continue
        for it in cmp.get('items', []):
            eg = str(it.get('eg') or '').strip()
            if eg and eg.lower() not in hay2:
                miss.append((k, it.get('w'), eg[:60]))
    if miss:
        print(f'终验仍有 {len(miss)} 处不在 hay:')
        for m in miss[:30]:
            print('  -', m)
    if WRITE and not failed and not miss:
        with open(ROOT / 'data/vocab.json', 'w', encoding='utf-8') as f:
            json.dump(vocab, f, ensure_ascii=False, separators=(',', ':'))
        print('已写入 data/vocab.json')
    elif WRITE:
        print('有问题未写盘')

if __name__ == '__main__':
    main()
