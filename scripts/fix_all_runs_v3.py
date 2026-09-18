#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
全量修正：消除所有 ≥3 连同主语，修正语法/生硬表达，保留所有目标词
"""
import json
import re
import copy

new = json.load(open('shadow/data/sections.json', encoding='utf-8'))

# 手工重写：(ci, pi, si) -> 新英文句子（保留所有 [[w:d]]）
REWRITES = {
    # CH1 段9 句0-2: They 3连
    (0, 9, 0): "They explored the river delta where crocodiles and [[hippopotamus:hippopotamus]]es lived together.",
    (0, 9, 1): "The river [[delta:delta]] branched into many streams, each leading to rich fishing grounds.",
    (0, 9, 2): "Seasonal [[flooding:flooding]] brought nutrients that made the soil extremely fertile.",

    # CH1 段28: Leo 4连 -> 改为混合
    (0, 28, 0): "Leo measured the slowly melting [[glacier:glacier]] and recorded the data carefully.",
    (0, 28, 1): "The team moved their tents to open ground and slept in turns.",
    (0, 28, 2): "Down in the city, thick [[smog:smog]] and black [[fume:fume]] from old trucks filled the streets.",
    (0, 28, 3): "Morning [[mist:mist]] softened the bay before the morning bus left.",

    # CH1 段53: They 3连
    (0, 53, 3): "White bears roam on the frozen [[arctic:Arctic]] ice.",
    (0, 53, 4): "The icy [[antarctic:Antarctic]] lies even farther south.",
    (0, 53, 5): "Their dream is to reach the North [[pole:Pole]] one day.",

    # CH6 段1: He 3连
    (5, 1, 3): "He checked the [[thermometer:thermometer]] and noted the rising [[temperature:temperature]].",
    (5, 1, 4): "A sudden [[headache:headache]] made him pause and take a deep breath.",
    (5, 1, 5): "The [[doctor:doctor]] advised rest and plenty of [[water:water]].",

    # CH6 段4: He 3连 (句0-2)
    (5, 4, 0): "He stretched his arms and felt the [[muscle:muscle]]s tighten.",
    (5, 4, 1): "A gentle [[stretch:stretch]] eased the tension in his [[shoulder:shoulder]]s.",
    (5, 4, 2): "Regular [[exercise:exercise]] keeps the [[body:body]] flexible and strong.",

    # CH6 段10: Leo 4连
    (5, 10, 2): "Leo [[measure:measure]]s his [[pulse:pulse]] after the morning run.",
    (5, 10, 3): "The [[heart:heart]] rate returns to normal within minutes.",
    (5, 10, 4): "Consistent [[training:training]] improves [[endurance:endurance]] over time.",
    (5, 10, 5): "He records each [[session:session]] in his fitness [[log:log]].",

    # CH6 段12: He 6连
    (5, 12, 0): "He wakes before dawn and starts the day with [[meditation:meditation]].",
    (5, 12, 1): "A calm [[mind:mind]] helps him focus on the day's [[task:task]]s.",
    (5, 12, 2): "Breakfast includes [[protein:protein]] and [[fiber:fiber]] for lasting energy.",
    (5, 12, 3): "He reviews his [[schedule:schedule]] and sets priorities for the day.",
    (5, 12, 4): "Short [[break:break]]s between tasks prevent [[fatigue:fatigue]].",
    (5, 12, 5): "Evening [[reflection:reflection]] helps him improve tomorrow's [[plan:plan]].",

    # CH6 段19: Leo 3连
    (5, 19, 2): "Leo [[stretch:stretch]]es his [[leg:leg]]s before the evening walk.",
    (5, 19, 3): "Fresh [[air:air]] fills his [[lung:lung]]s as he breathes deeply.",
    (5, 19, 4): "The [[sunset:sunset]] paints the sky in shades of [[orange:orange]] and [[purple:purple]].",

    # CH6 段39: Mei 3连
    (5, 39, 3): "Mei [[check:check]]s her [[posture:posture]] in the mirror.",
    (5, 39, 4): "A straight [[spine:spine]] prevents [[back:back]] pain during long study sessions.",
    (5, 39, 5): "She adjusts the [[chair:chair]] height and takes a [[break:break]] every hour.",
}

# 额外的语法/措辞修正：(ci, pi, si) -> 修正后句子
GRAMMAR_FIXES = {
    # CH1 段53 句0-2 (检查是否还有问题)
    # CH6 段1 句0-2 等
}

def apply_rewrites():
    modified = copy.deepcopy(new)
    changed = 0
    
    for (ci, pi, si), new_sent in REWRITES.items():
        if ci < len(modified) and pi < len(modified[ci]['paragraphs']) and si < len(modified[ci]['paragraphs'][pi]):
            old = modified[ci]['paragraphs'][pi][si]
            # 验证目标词一致
            old_markers = set(re.findall(r'\[\[([^\]:]+):([^\]]+)\]\]', old))
            new_markers = set(re.findall(r'\[\[([^\]:]+):([^\]]+)\]\]', new_sent))
            if old_markers != new_markers:
                print(f"⚠️ 目标词不匹配 CH{ci+1} 段{pi} 句{si}:")
                print(f"  旧: {old_markers}")
                print(f"  新: {new_markers}")
                continue
            modified[ci]['paragraphs'][pi][si] = new_sent
            changed += 1
            print(f"✓ CH{ci+1} 段{pi} 句{si}: {old[:60]}... -> {new_sent[:60]}...")
        else:
            print(f"⚠️ 索引越界 CH{ci+1} 段{pi} 句{si}")
    
    # 语法修正
    for (ci, pi, si), new_sent in GRAMMAR_FIXES.items():
        if ci < len(modified) and pi < len(modified[ci]['paragraphs']) and si < len(modified[ci]['paragraphs'][pi]):
            old = modified[ci]['paragraphs'][pi][si]
            old_markers = set(re.findall(r'\[\[([^\]:]+):([^\]]+)\]\]', old))
            new_markers = set(re.findall(r'\[\[([^\]:]+):([^\]]+)\]\]', new_sent))
            if old_markers != new_markers:
                print(f"⚠️ 语法修正目标词不匹配 CH{ci+1} 段{pi} 句{si}")
                continue
            modified[ci]['paragraphs'][pi][si] = new_sent
            print(f"✓ 语法修正 CH{ci+1} 段{pi} 句{si}: {old[:60]}... -> {new_sent[:60]}...")
    
    print(f"\n共修改 {changed} 句（主语连击）+ {len(GRAMMAR_FIXES)} 句（语法）")
    return modified

if __name__ == '__main__':
    import shutil, datetime
    ts = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    shutil.copy2('shadow/data/sections.json', f'shadow/data/sections.json.backup-{ts}')
    new_sections = apply_rewrites()
    with open('shadow/data/sections.json', 'w', encoding='utf-8') as f:
        json.dump(new_sections, f, ensure_ascii=False, separators=(',', ':'))
    print("重写完成，已写回 shadow/data/sections.json")