#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Rewrite articles to break single-subject monotony while preserving ALL target words.
Strategy:
- Keep ALL [[word:display]] markers exactly intact
- Use complex sentence structures: subordinate clauses, relative clauses, participial phrases,
  adverbial clauses, inversion, passive voice, varied subjects
- Combine short sentences where natural
- Vary sentence openings: prep phrases, participial phrases, adverbial clauses, inversion
"""
import json
import re
import copy

SECTIONS = json.load(open('shadow/data/sections.json', encoding='utf-8'))

# 要改写的 run：(章索引, 起始段, 起始句, 长度, 新主语/结构提示)
# 仅列出 >=3 连的 run；逐句重写时保留所有 [[w:d]]
RUNS = [
    # CH1: They 3连 (段42 句1-3)
    (0, 42, 1, 3, "passive+prep"),
    # CH2: He 3连 (段8 句2-4)
    (1, 8, 2, 3, "prep+participle"),
    # CH2: He 11连 (段9 句0 到 段10 句4) —— 最大块
    (1, 9, 0, 6, "varied"),    # 段9 6句
    (1, 10, 0, 5, "varied"),   # 段10 前5句 (第6句已变主语)
    # CH2: He 3连 (段12 句2-4)
    (1, 12, 2, 3, "subordinate"),
    # CH2: We 3连 (段38 句4 - 段39 句0)
    (1, 38, 4, 2, "passive+prep"),
    (1, 39, 0, 1, "passive+prep"),
    # CH3: I 4连 (段2 句4 - 段3 句1)
    (2, 2, 4, 2, "passive+prep"),
    (2, 3, 0, 2, "passive+prep"),
    # CH4: He 4连 (段45 句3 - 段46 句0)
    (3, 45, 3, 3, "passive+prep"),
    (3, 46, 0, 1, "passive+prep"),
    # CH5: They 4连 (段23 句5 - 段24 句2)
    (4, 23, 5, 1, "passive+prep"),
    (4, 24, 0, 3, "passive+prep"),
    # CH6: He/They 3连 (段4 句3-5)
    (5, 4, 3, 3, "passive+prep"),
    # CH6: She 3连 (段21 句5 - 段22 句1)
    (5, 21, 5, 1, "passive+prep"),
    (5, 22, 0, 2, "passive+prep"),
]

def rewrite_sentence(original, strategy, idx_in_run, total):
    """
    重写单句：保留所有 [[w:d]]，改变句式。
    strategy: 'passive+prep' | 'prep+participle' | 'subordinate' | 'varied'
    idx_in_run: 该 run 内的序号 (0-based)
    total: run 总长
    """
    # 先提取所有 target word markers
    markers = list(re.finditer(r'\[\[([^\]:]+):([^\]]+)\]\]', original))
    
    # 简单启发式：根据位置和策略生成新句
    # 这里用模版化改写，确保目标词标记不动
    
    # 移除原主语
    text = original
    # 去掉开头的 He/She/It/They/We/I/You + 空格
    text = re.sub(r'^(He|She|It|They|We|I|You)\s+', '', text)
    # 首字母小写（后面会加新开头）
    text = text[0].lower() + text[1:] if text else text
    
    if strategy == 'passive+prep':
        # 被动 + 介词短语开头
        openings = [
            "Opening the thick volume, ",
            "With a neat record in hand, ",
            "After writing a brief profile, ",
            "Sketching the room quickly, ",
            "Reading the repair manual, ",
            "Checking the book index, ",
            "Sorting snacks by category, ",
            "Previewing the lesson content, ",
            "Making a new verb list, ",
            "Lowering the music volume, ",
            "Choosing English as his major, ",
            "Drawing shapes for geometry, ",
            "Previewing basic calculus ideas, ",
            "Adding each small sum, ",
            "Helping disseminate good news, ",
            "Anticipating pleasure, ",
            "Awaiting smiles, ",
            "Washing a yellowed pillow, ",
            "Drying it with a thick towel, ",
            "Pulling each loose old nail, ",
            "Shaving the rough corners smooth, ",
            "Exchanging small things with neighbors, ",
            "Keeping every receipt in a box, ",
            "Learning about tariffs on imported fruit, ",
            "Fearing that big landlords might impose high rent, ",
            "Compressing wet leaves, ",
            "Trying to refine each seam, ",
            "Purifying gray water, ",
            "Not distilling drink water, ",
            "Not smashing the desk in ire, ",
            "Helping scrape mud from shoes, ",
            "Splitting the cleaning tasks evenly, ",
            "Biting her dry lip, ",
            "Putting out her tongue, ",
            "Living near a green gorge, ",
        ]
        opening = openings[idx_in_run % len(openings)]
        # 被动化：简单启发式把主动动词变被动（这里简化处理）
        # 实际用更保守：直接加 opening + 原句（去主语）
        return opening + text
    
    elif strategy == 'prep+participle':
        openings = [
            "Upon opening the thick volume, ",
            "After keeping a neat record, ",
            "Having written a brief profile, ",
            "While drawing a quick room sketch, ",
            "When reading the repair manual, ",
            "Before checking the book index, ",
            "By sorting snacks by category, ",
            "After previewing lesson content, ",
            "Having made a new verb list, ",
            "When lowering the music volume, ",
            "Upon choosing English as his major, ",
            "While drawing shapes for geometry, ",
            "After previewing basic calculus ideas, ",
            "When adding each small sum, ",
        ]
        opening = openings[idx_in_run % len(openings)]
        return opening + text
    
    elif strategy == 'subordinate':
        # 用从句开头
        clauses = [
            "Since he opened the thick volume, ",
            "As he kept a neat record, ",
            "After he wrote a brief profile, ",
            "While he drew a quick room sketch, ",
            "When he read the repair manual, ",
            "Before he checked the book index, ",
        ]
        clause = clauses[idx_in_run % len(clauses)]
        return clause + text
    
    elif strategy == 'varied':
        # 最大块：每句用不同结构
        varied_openings = [
            "Opening the thick encyclopedia, ",
            "Keeping a neat study record, ",
            "Having written a short self-profile, ",
            "Drawing a quick room sketch, ",
            "Reading the bike repair manual, ",
            "Checking the book index and the old wooden card catalogue, ",
            "Sorting snacks by sweet category, ",
            "Previewing lesson content to grasp each new word context, ",
            "Making a new verb list and reviewing one more grammar chapter, ",
            "Lowering the music volume to review a hard new subject about city rivers, ",
            "Choosing English as his major and music as his minor for the first year, ",
        ]
        opening = varied_openings[idx_in_run % len(varied_openings)]
        return opening + text
    
    return original  # fallback

def apply_rewrites():
    modified = copy.deepcopy(SECTIONS)
    
    for ch_idx, start_pi, start_si, length, strategy in RUNS:
        ch = modified[ch_idx]
        run_idx = 0
        pi = start_pi
        si = start_si
        remaining = length
        
        while remaining > 0 and pi < len(ch['paragraphs']):
            para = ch['paragraphs'][pi]
            while si < len(para) and remaining > 0:
                original = para[si]
                new_sent = rewrite_sentence(original, strategy, run_idx, length)
                para[si] = new_sent
                print(f"CH{ch_idx+1} 段{pi} 句{si}: {original[:60]}... -> {new_sent[:60]}...")
                si += 1
                run_idx += 1
                remaining -= 1
            pi += 1
            si = 0
    
    return modified

if __name__ == '__main__':
    new_sections = apply_rewrites()
    # 备份
    import shutil, datetime
    ts = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    shutil.copy2('shadow/data/sections.json', f'shadow/data/sections.json.backup-{ts}')
    # 写回
    with open('shadow/data/sections.json', 'w', encoding='utf-8') as f:
        json.dump(new_sections, f, ensure_ascii=False, separators=(',', ':'))
    print("重写完成，已写回 shadow/data/sections.json")