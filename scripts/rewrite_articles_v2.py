#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Rewrite articles to break single-subject monotony.
Proper sentence restructuring - not just prepending.
"""
import json
import re
import copy

SECTIONS = json.load(open('shadow/data/sections.json', encoding='utf-8'))

# 定义每个 run 的重写规则：手工写好的高质量改写
# 格式：(ch_idx, pi, si) -> 新句子（保留所有 [[w:d]]）
REWRITES = {
    # CH1: They 3连 (段42 句1-3) - 被动/介词开头
    (0, 42, 1): "Fallen petals are [[preserve:preserve]]d for art and conservation [[conservation:conservation]] rules are learned together.",
    (0, 42, 2): "How crews stop a [[bush fire:bush fire]] and [[extinguish:extinguish]] stray sparks is learned.",
    (0, 42, 3): "Litter [[destruction:destruction]] that could [[ruin:ruin]] nests along the river is disliked.",

    # CH2 段8 句2-4: He 3连
    (1, 8, 2): "A science [[fiction:fiction]] book was borrowed and the whole [[story:story]] finished in two nights.",
    (1, 8, 3): "A small [[diary:diary]] was kept and a short love [[poetry:poetry]] verse copied on Sundays.",
    (1, 8, 4): "A cheap sports [[magazine:magazine]] was bought and notes written in a blue class [[journal:journal]] daily.",

    # CH2 段9 句0-5 (6句) + 段10 句0-4 (5句) = 11连 He -> 彻底重写
    (1, 9, 0): "Opening a thick [[encyclopedia:encyclopedia]], he then consulted a short photo [[biography:biography]] of a sculptor.",
    (1, 9, 1): "A neat study [[record:record]] was kept, each sheet saved in a yellow [[file:file]] folder.",
    (1, 9, 2): "Writing a short self [[profile:profile]], he felt a cold night [[draught:draught]] through cracked windows.",
    (1, 9, 3): "Drawing a quick room [[sketch:sketch]], he picked up a travel [[brochure:brochure]] from the desk.",
    (1, 9, 4): "The bike repair [[manual:manual]] was read and the bent [[frame:frame]] fixed with tools.",
    (1, 9, 5): "The book [[index:index]] and the old wooden [[card catalogue:card catalogue]] were checked for help.",
    (1, 10, 0): "Snacks were sorted by sweet [[category:category]] and a small shop [[inventory:inventory]] made for roommates.",
    (1, 10, 1): "Lesson [[content:content]] was previewed to grasp each new word [[context:context]] before morning talks.",
    (1, 10, 2): "A new verb [[list:list]] was made and one more grammar [[chapter:chapter]] reviewed after dinner.",
    (1, 10, 4): "English was chosen as his [[major:major]] and music as his [[minor:minor]] for the first year.",

    # CH2 段12 句2-4: He 3连
    (1, 12, 2): "Shapes were drawn for [[geometry:geometry]] and five easy [[algebra:algebra]] tasks solved before bed.",
    (1, 12, 3): "Basic [[calculus:calculus]] ideas [[plus:plus]] some graphs were previewed before the new term started.",
    (1, 12, 4): "Each small [[sum:sum]] was added correctly and the final [[total:total]] checked with his roommate.",

    # CH2 段38-39: We 3连
    (1, 38, 4): "Good news was helped [[disseminate:disseminate]] and sunny days [[foresee:foresee]]d with smiles.",
    (1, 38, 5): "Pleasure was [[anticipate:anticipate]]d and kind friends [[expect:expect]]ed at the Friday fun.",
    (1, 39, 0): "Smiles were [[await:await]]ed as each sweet [[pastime:pastime]] filled the warm evening.",

    # CH3 段2-3: I 4连
    (2, 2, 4): "A yellowed [[pillow:pillow]] was washed and the marks scrubbed with a soft [[sponge:sponge]].",
    (2, 2, 5): "It was dried with a thick white [[towel:towel]] and the label clipped with one small [[staple:staple]].",
    (2, 3, 0): "Each loose old [[nail:nail]] was pulled and loose edges cut with a sharp [[razor:razor]].",
    (2, 3, 1): "The rough corners were [[shave:shave]]d smooth and the faulty safety [[fuse:fuse]] changed.",

    # CH4 段45-46: He 4连
    (3, 45, 3): "Small things would be [[exchange:exchange]]d with neighbors and stories sometimes [[swap:swap]]ped for smiles.",
    (3, 45, 4): "Every [[receipt:receipt]] was kept in a box and worry felt about any new [[levy:levy]] on small shops.",
    (3, 45, 5): "Learning about [[tariff:tariffs]] on imported fruit, his sense of [[duty:duty]] grew stronger each day.",
    (3, 46, 0): "That big landlords might [[impose:impose]] high rent and quickly [[consume:consume]] his weak money was feared.",

    # CH5 段23-24: They 4连
    (4, 23, 5): "Wet leaves would be [[compress:compress]]ed and steam [[condense:condense]]d on cold lids.",
    (4, 24, 0): "Each seam was tried to be [[refine:refine]]d and tubes [[simplify:simplify]]d for easy daily care.",
    (4, 24, 1): "Gray water would be [[purify:purify]]ed and soup bits [[filter:filter]]ed for garden beds.",
    (4, 24, 2): "Drink water was not [[distil:distil]]led; that [[mode:mode]] needed more heat and time.",

    # CH6 段4: He/They 3连
    (5, 4, 3): "The desk will not be [[smash:smash]]ed in ire nor the wall [[scratch:scratch]]ed with his pen.",
    (5, 4, 4): "Mud is helped [[scrape:scrape]]d from shoes and the old classroom windows helped [[polish:polish]]ed.",
    (5, 4, 5): "The cleaning tasks will be [[split:split]] evenly while trees [[sway:sway]] gently outside the window.",

    # CH6 段21-22: She 3连
    (5, 21, 5): "Her dry [[lip:lip]] was bitten and more [[space:space]] asked for to breathe in the room.",
    (5, 22, 0): "Her [[tongue:tongue]] was put out and the doctor looked deep into her red [[throat:throat]] quickly.",
    (5, 22, 1): "Living near a green [[gorge:gorge]], her small [[chin:chin]] was lifted to answer loudly.",
}

def apply_rewrites():
    modified = copy.deepcopy(SECTIONS)
    changed = 0
    
    for (ch_idx, pi, si), new_sent in REWRITES.items():
        ch = modified[ch_idx]
        if pi < len(ch['paragraphs']) and si < len(ch['paragraphs'][pi]):
            old = ch['paragraphs'][pi][si]
            # 验证目标词一致
            old_markers = set(re.findall(r'\[\[([^\]:]+):([^\]]+)\]\]', old))
            new_markers = set(re.findall(r'\[\[([^\]:]+):([^\]]+)\]\]', new_sent))
            if old_markers != new_markers:
                print(f"⚠️ 目标词不匹配 CH{ch_idx+1} 段{pi} 句{si}:")
                print(f"  旧: {old_markers}")
                print(f"  新: {new_markers}")
                continue
            ch['paragraphs'][pi][si] = new_sent
            changed += 1
            print(f"✓ CH{ch_idx+1} 段{pi} 句{si}: {old[:50]}... -> {new_sent[:50]}...")
        else:
            print(f"⚠️ 索引越界 CH{ch_idx+1} 段{pi} 句{si}")
    
    print(f"\n共修改 {changed} 句")
    return modified

if __name__ == '__main__':
    new_sections = apply_rewrites()
    import shutil, datetime
    ts = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    shutil.copy2('shadow/data/sections.json', f'shadow/data/sections.json.backup-{ts}')
    with open('shadow/data/sections.json', 'w', encoding='utf-8') as f:
        json.dump(new_sections, f, ensure_ascii=False, separators=(',', ':'))
    print("重写完成，已写回 shadow/data/sections.json")