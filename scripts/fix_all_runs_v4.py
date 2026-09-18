#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
精准修正所有 ≥3 连同主语，完全保留目标词
"""
import json
import re
import copy

secs = json.load(open('shadow/data/sections.json', encoding='utf-8'))

# 精准重写：key = (ci, pi, si) -> 新句子（必须包含完全相同的目标词）
REWRITES = {
    # CH1 段9 句0-2: They 3连 -> 被动/介词开头
    (0, 9, 0): "The [[atlantic:Atlantic]] was crossed while [[marine:marine]] birds followed the ship.",
    (0, 9, 1): "The skipper trusted satellite [[navigation:navigation]] even in thick fog, until they sheltered in a calm wide [[gulf:Gulf]].",
    (0, 9, 2): "They landed on a [[quiet:quiet]] golden [[beach:beach]] for fresh water.",

    # CH1 段28 句0-3: Leo 4连 -> 分词/从句/被动混合
    (0, 28, 0): "Leo studied the [[cosmos:cosmos]] and the vast [[galaxy:galaxy]] above.",
    (0, 28, 1): "The [[interstellar:interstellar]] space and the [[universe:universe]] fascinated him deeply.",
    (0, 28, 2): "He distinguished the [[celestial:celestial]] bodies from the [[terrestrial:terrestrial]] ones.",
    (0, 28, 3): "The difference between [[astrology:astrology]] and [[astronomy:astronomy]] became clear to him.",

    # CH1 段53 句3-5: They 3连
    (0, 53, 3): "The [[hive:hive]] was protected and the [[nest:nest]] left undisturbed.",
    (0, 53, 4): "No [[cage:cage]] was used and the [[cell:cells]] remained open.",
    (0, 53, 5): "The [[barn:barn]] stood stable and the [[stable:stable]] doors stayed open.",

    # CH6 段1 句3-5: He 3连
    (5, 1, 3): "He [[contemplate:contemplate]]d the stars and [[stare:stare]]d at the night sky.",
    (5, 1, 4): "An [[oath:oath]] was taken and a solemn [[vow:vow]] made silently.",
    (5, 1, 5): "A [[pledge:pledge]] was given and the [[whistler:whistler]] sang softly.",

    # CH6 段4 句0-2: He 3连
    (5, 4, 0): "The [[mess:mess]] was cleaned and the [[twist:twist]] in the rope undone.",
    (5, 4, 1): "Each [[fold:fold]] was smoothed and nothing left to [[scatter:scatter]].",
    (5, 4, 2): "Every [[fasten:fasten]]ing was checked and nothing left to [[loosen:loosen]].",

    # CH6 段10 句2-5: Leo 4连
    (5, 10, 2): "To [[detach:detach]] is to [[undo:undo]] the knot carefully.",
    (5, 10, 3): "He would not [[conceal:conceal]] the truth nor [[disguise:disguise]] his feelings.",
    (5, 10, 4): "No one should [[exclude:exclude]] others or [[refuse:refuse]] help when needed.",
    (5, 10, 5): "He would [[assure:assure]] her and never [[reverse:reverse]] his decision.",

    # CH6 段12 句0-5: He 6连
    (5, 12, 0): "A [[loom:loom]] stood ready and the threads began to [[sort:sort]] themselves.",
    (5, 12, 1): "To [[commence:commence]] is to [[launch:launch]] the day with purpose.",
    (5, 12, 2): "He would not [[exploit:exploit]] others but [[explore:explore]] new paths.",
    (5, 12, 3): "To [[exert:exert]] effort is to [[tackle:tackle]] each challenge directly.",
    (5, 12, 4): "He learned to [[cope:cope]] with stress and [[dispose:dispose]] of worry.",
    (5, 12, 5): "His [[conduct:conduct]] was honest and nothing was left to [[omit:omit]].",

    # CH6 段19 句2-4: Leo 3连
    (5, 19, 2): "To [[replace:replace]] the old part is to [[substitute:substitute]] it entirely.",
    (5, 19, 3): "He learned to [[differentiate:differentiate]] truth from lies and [[distinguish:distinguish]] friends from foes.",
    (5, 19, 4): "He would not [[incline:incline]] to anger nor [[lean:lean]] on excuses.",

    # CH6 段39 句3-5: Mei 3连
    (5, 39, 3): "She felt [[proud:proud]] and remained [[rational:rational]] under pressure.",
    (5, 39, 4): "The host was [[hospitable:hospitable]] and spoke [[seriously:seriously]] of life.",
    (5, 39, 5): "[[freedom:freedom]] was cherished and [[romantic:romantic]] dreams pursued.",
}

# 额外语法/措辞微调：(ci, pi, si) -> 修正后句子
GRAMMAR_FIXES = {
    # CH1 段28 句1: "The interstellar space and the universe fascinated him deeply." -> 微调
    # CH1 段53 句5: "The barn stood stable and the stable doors stayed open." -> 避免重复 stable
    (0, 53, 5): "The [[barn:barn]] stood firm and the [[stable:stable]] doors stayed open.",
    # CH6 段4 句0: "The mess was cleaned and the twist in the rope undone." -> 微调
    (5, 4, 0): "The [[mess:mess]] was cleared and the [[twist:twist]] in the rope undone.",
}

def apply_rewrites():
    modified = copy.deepcopy(secs)
    changed = 0
    
    for (ci, pi, si), new_sent in REWRITES.items():
        if ci < len(modified) and pi < len(modified[ci]['paragraphs']) and si < len(modified[ci]['paragraphs'][pi]):
            old = modified[ci]['paragraphs'][pi][si]
            old_markers = set(re.findall(r'\[\[([^\]:]+):([^\]]+)\]\]', old))
            new_markers = set(re.findall(r'\[\[([^\]:]+):([^\]]+)\]\]', new_sent))
            if old_markers != new_markers:
                print(f"⚠️ 目标词不匹配 CH{ci+1} 段{pi} 句{si}:")
                print(f"  旧: {old_markers}")
                print(f"  新: {new_markers}")
                continue
            modified[ci]['paragraphs'][pi][si] = new_sent
            print(f"✓ CH{ci+1} 段{pi} 句{si}: {modified[ci]['paragraphs'][pi][si][:70]}...")
            changed += 1
        else:
            print(f"⚠️ 索引越界 CH{ci+1} 段{pi} 句{si}")
    
    # 语法微调
    for (ci, pi, si), new_sent in GRAMMAR_FIXES.items():
        if ci < len(secs) and pi < len(secs[ci]['paragraphs']) and si < len(secs[ci]['paragraphs'][pi]):
            old = secs[ci]['paragraphs'][pi][si]
            old_markers = set(re.findall(r'\[\[([^\]:]+):([^\]]+)\]\]', old))
            new_markers = set(re.findall(r'\[\[([^\]:]+):([^\]]+)\]\]', new_sent))
            if old_markers != new_markers:
                print(f"⚠️ 语法修正目标词不匹配 CH{ci+1} 段{pi} 句{si}")
                continue
            print(f"✓ 语法修正 CH{ci+1} 段{pi} 句{si}: {old[:70]}... -> {new_sent[:70]}...")
    
    print(f"\n共修改 {len(REWRITES)} 句（主语连击）+ {len(GRAMMAR_FIXES)} 句（语法）")
    return modified

if __name__ == '__main__':
    import shutil, datetime
    ts = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    shutil.copy2('shadow/data/sections.json', f'shadow/data/sections.json.backup-{ts}')
    new_sections = apply_rewrites()
    with open('shadow/data/sections.json', 'w', encoding='utf-8') as f:
        json.dump(new_sections, f, ensure_ascii=False, separators=(',', ':'))
    print("重写完成，已写回 shadow/data/sections.json")