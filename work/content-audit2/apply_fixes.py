#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""二次排查修正：正文 10 句（key 序列/单句/中英规则硬校验）+ 词条 13 条。

用法: python3 work/content-audit2/apply_fixes.py [--write]
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
WRITE = '--write' in sys.argv
MARK = re.compile(r'\[\[([^\]:]+):([^\]]+)\]\]')
ABBREV = re.compile(r'\b(Mr|Ms|Mrs|Dr|St|Jr|Sr|vs|etc|e\.g|i\.e)\.(?=\s)')
NEW_SENT = re.compile(r'[.!?][")\]]?\s+[A-Z]')
ZH_PUNCT = re.compile(r'[，。、；：！？]')

def keys_of(s):
    return [m.group(1) for m in MARK.finditer(s)]

# 正文修正：(si, pi, ti) -> (新EN or None, 新ZH or None)
SENT_FIXES = {
    (0, 31, 4): (
        'Leo said that in salty water each [[atom:atom]] gives or takes electrons, becoming an [[ion:ion]].',
        '利奥说，在盐水里，每个原子都会给出或得到电子，变成一个离子。'),
    (0, 50, 1): (
        'They polished a curved antelope [[horn:horn]] model and heard far lonely [[wolf:wolves]] howl at [[night:night]].',
        None),
    (1, 8, 4): (
        'His next buy was a cheap sports [[magazine:magazine]], and he wrote notes in a blue class [[journal:journal]] daily.',
        None),
    (1, 8, 5): (
        'The small [[coverage lettering:coverage lettering]] at the foot of his map even came with a short reading [[bibliography:bibliography]].',
        '他地图下方那行小小的覆盖说明，甚至还附了一份简短的阅读书目。'),
    (1, 13, 5): (
        'Late at [[night:night]], Sam drew an [[approximately:approximately]] correct study [[diagram:diagram]] on the whiteboard.',
        '深夜里，山姆在白板上画了一张大体正确的学习图表。'),
    (1, 18, 6): (
        'Every morning, Lin packed her [[backpack:backpack]] with lunch and one red book.',
        None),
    (1, 20, 3): (
        '[[senior:Senior]] students showed a short [[thesis:thesis]] and a neat model [[paper:paper]] as guides.',
        None),
    (2, 19, 5): (
        None,
        '他们不肯把它改成吵闹的旅舍，也不愿把它变成供陌生人住的猎屋。'),
    (3, 22, 4): (
        "The [[municipal:municipal]] inn earned Father's praise when our [[host:host]] gave us hot tea and warm blankets late at [[night:night]].",
        None),
    (5, 14, 3): (
        'Short breaks are never [[prolong:prolonged]] too long, and Leo [[uphold:upholds]] firm sleeping hours.',
        None),
}

# 词条修正
VOCAB_FIXES = {
    'violet':   {'m': 'n. 紫罗兰；adj. 紫罗兰色的'},
    'brute':    {'m': 'adj. 粗暴的；蛮干的；n. 野蛮的家伙（a brute of a …）'},
    'puff':     {'m': 'v. 喘息；（使）肿胀（puff up）；n. 一股（烟、气）'},
    'overall':  {'m': 'n. [常 pl.] 工装裤；防护服；adj. 全面的；adv. 总体上'},
    'recipe':   {'m': 'n. 秘诀；食谱；配方'},
    'abortion': {'m': 'n. 流产；堕胎；（计划等的）中途夭折'},
    'stern':    {'m': 'n. 船尾；adj. 严厉的；坚定的'},
    'bound':    {'m': 'adj. 一定会…的；有义务的；密切相关的；v. bind 的过去式（包扎；系紧）'},
    'itch':     {'ex': 'The mosquito bite caused an itch on my arm.'},
    'jump':     {'ex': 'The boy jumps over the puddle.'},
    'tilt':     {'ex': 'The boy tilts the cup and spills the water.'},
    'scatter':  {'ex': 'The wind scatters the leaves everywhere.'},
}

def main():
    secs = json.load(open(ROOT / 'data/sections.json', encoding='utf-8'))
    vocab = json.load(open(ROOT / 'data/vocab.json', encoding='utf-8'))
    problems, applied_s, applied_v = [], 0, 0

    for (si, pi, ti), (new_en, new_zh) in SENT_FIXES.items():
        try:
            old_en = secs[si]['paragraphs'][pi][ti]
        except IndexError:
            problems.append(f'({si},{pi},{ti}): 坐标不存在'); continue
        en = new_en if new_en else old_en
        zh = new_zh if new_zh else secs[si]['sentZh'][pi][ti]
        if new_en:
            if keys_of(en) != keys_of(old_en):
                problems.append(f'({si},{pi},{ti}): key 序变 {keys_of(old_en)} -> {keys_of(en)}'); continue
            plain = MARK.sub(lambda m: m.group(2), en)
            if any(m.group(2) not in plain for m in MARK.finditer(en)):
                problems.append(f'({si},{pi},{ti}): display 不在正文'); continue
            if NEW_SENT.search(ABBREV.sub(r'\1‡', plain)):
                problems.append(f'({si},{pi},{ti}): 疑似多句'); continue
            if re.search(r'[\u4e00-\u9fff]', plain):
                problems.append(f'({si},{pi},{ti}): 英文含中文'); continue
        if new_zh and (not ZH_PUNCT.search(zh) or '[[' in zh):
            problems.append(f'({si},{pi},{ti}): 中文规则违规'); continue
        secs[si]['paragraphs'][pi][ti] = en
        secs[si]['sentZh'][pi][ti] = zh
        applied_s += 1

    for k, patch in VOCAB_FIXES.items():
        if k not in vocab:
            problems.append(f'vocab {k}: 不存在'); continue
        for f, val in patch.items():
            vocab[k][f] = val
        applied_v += 1

    # lip 音标复核
    lip = vocab.get('lip', {})
    if lip.get('uk') in ('el aɪ piː', 'e l aɪ p iː') or lip.get('us') in ('el aɪ piː', 'e l aɪ p iː'):
        lip['uk'] = 'lɪp'; lip['us'] = 'lɪp'
        applied_v += 1
        print('lip 音标已修正为 lɪp')
    else:
        print(f"lip 音标现状: uk={lip.get('uk')} us={lip.get('us')}（如正常则不动）")

    print(f'正文修正: {applied_s} 句; 词条修正: {applied_v} 条; 问题: {len(problems)}')
    for p in problems:
        print('  -', p)
    if problems:
        sys.exit(1)
    if WRITE:
        with open(ROOT / 'data/sections.json', 'w', encoding='utf-8') as f:
            json.dump(secs, f, ensure_ascii=False, separators=(',', ':'))
        with open(ROOT / 'data/vocab.json', 'w', encoding='utf-8') as f:
            json.dump(vocab, f, ensure_ascii=False, separators=(',', ':'))
        print('已写入 data/sections.json 与 data/vocab.json')
    else:
        print('（干跑，未写盘）')

if __name__ == '__main__':
    main()
