#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 10 句「一个目标词都没有」的过渡句就地改写成教学句。

硬约束（任何一条不满足就整体不落盘）：
  1. 句子总数、每段句数、每章句数全部不变 —— 不插句，用户书签/已读的全局序号不会错位。
  2. 只允许改动指定的 10 句英文 + 其配对中文，其余句子逐字节不变。
  3. 新句子里除目标词外必须全是简单词（由调用方先用词表校验，这里只断言标记形态）。
一次性脚本，2026-09-19 已 --apply 落盘。留档是为了让这 10 处改写可复核；
再跑一次会因为「该句已含目标词」断言而拒绝落盘，不会重复改写。
用法：python3 tools/rewrite_transition_sentences.py          # 干跑校验
      python3 tools/rewrite_transition_sentences.py --apply
"""
import json, re, sys, hashlib

PATH = 'shadow/data/sections.json'

# 全局句号 -> (章, 段, 句, 新英文, 新中文)
EDITS = {
    24: (0, 4, 0, 'The team moved their tents to open ground at a low [[altitude:altitude]] and slept in turns.',
             '小队把帐篷搬到一处海拔较低的开阔地，轮流睡觉。'),
    33: (0, 6, 0, 'No one spoke loudly, and the team moved in a careful straight line through the [[dense:dense]] snow.',
             '没人高声说话，全队排成一条笔直的线，小心穿过茂密的积雪。'),
    34: (0, 6, 0, 'They camped early and dried their socks by a small warm fire before the [[frost:frost]] came.',
             '他们早早扎营，赶在霜冻来临之前围着小堆火把袜子烤干。'),
    78: (0, 14, 0, 'Far to the north, another legend was unfolding in the cold [[polar:polar]] night.',
             '在遥远的北方，另一个传说正在寒冷的极夜里缓缓展开。'),
    89: (0, 15, 0, 'Back home, he marked the date in red on the wall, hoping the [[seasonal:seasonal]] rains would return.',
             '回家后他在墙上用红笔圈下这个日子，盼着季节性的雨能再来。'),
    93: (0, 16, 0, 'By noon she stands on the [[hillside:hillside]] path, laughing at her own haste.',
             '中午，她站在山坡的小路上，笑自己太心急。'),
    113: (0, 19, 0, 'She photographs both and sends them to the county hall, hoping to [[trace:trace]] the leak that same day.',
              '她给两处都拍了照，当天送往县政厅，希望就此追踪到泄漏源头。'),
    424: (1, 14, 0, 'Evening rain tapped softly on the bright [[canteen:canteen]] windows while kettles sang low.',
              '傍晚的雨轻轻敲着食堂明亮的窗户，水壶在一旁低声鸣着。'),
    1466: (4, 34, 0, 'Kids laughed aloud and shared warm buns with every [[guest:guest]] under bright lamps.',
               '孩子们大声笑着，在明亮的灯下把热包子分给每一位客人。'),
    1472: (4, 35, 0, 'Morning sun dried the wet paths, and pupils greeted the whole [[neighbourhood:neighbourhood]] with smiles.',
               '晨阳晒干了湿路，孩子们笑着跟整个街坊四邻打招呼。'),
}


def flat_index(D):
    """全局句号 -> (章, 段, 段内句序)，并顺带返回该句文本。"""
    gi, out = 0, {}
    for ci, c in enumerate(D):
        for si, para in enumerate(c['paragraphs']):
            for k, s in enumerate(para):
                out[gi] = (ci, si, k, s)
                gi += 1
    return out


def main():
    apply = '--apply' in sys.argv
    raw = open(PATH, encoding='utf-8').read()
    D = json.loads(raw)
    idx = flat_index(D)
    V = json.load(open('shadow/data/vocab.json', encoding='utf-8'))
    vkeys = {k.lower() for k in V}
    errs = []

    for gi, (ci, si, _unused, en, zh) in EDITS.items():
        oci, osi, ok, old_en = idx[gi]
        if (oci, osi) != (ci, si):
            errs.append(f'#{gi} 坐标漂移: 期望 ch{ci} 段{si}，实际 ch{oci} 段{osi}')
            continue
        if len(re.findall(r'\[\[', old_en)) != 0:
            errs.append(f'#{gi} 该句已含目标词，不该被改写: {old_en[:60]}')
        # 标记形态：每个 [[k:d]] 的 k 必须在背记词表里
        for k in re.findall(r'\[\[([^:\]]+):', en):
            if k.lower() not in vkeys:
                errs.append(f'#{gi} 标记的词不在词表: {k}')
        if len(re.findall(r'\[\[', en)) == 0:
            errs.append(f'#{gi} 新句仍无目标词')
        if not en.endswith('.'):
            errs.append(f'#{gi} 新句缺句号')
        EDITS[gi] = (ci, si, ok, en, zh)

    if errs:
        print('拒绝落盘：')
        for e in errs:
            print('  -', e)
        return 1

    for gi, (ci, si, k, en, zh) in EDITS.items():
        D[ci]['paragraphs'][si][k] = en
        D[ci]['sentZh'][si][k] = zh

    # 结构不变断言
    idx2 = flat_index(D)
    assert len(idx2) == len(idx) == 1809, '句子总数变了'
    changed = {gi for gi in idx if idx[gi][3] != idx2[gi][3]}
    assert changed == set(EDITS), f'意外改动 {len(changed - set(EDITS))} 句: {sorted(changed - set(EDITS))[:5]}'
    # 剥掉标记后，未改句的可见文本必须逐字节不变
    strip = lambda s: re.sub(r'\[\[([^:\]]+):([^\]]+)\]\]', r'\2', s)
    for gi in range(1809):
        if gi not in EDITS and strip(idx[gi][3]) != strip(idx2[gi][3]):
            errs.append(f'#{gi} 未改句的可见文本发生变化')
    assert not errs, errs

    if not apply:
        print('DRY-RUN 校验通过（未落盘）')
        return 0

    json.dump(D, open(PATH, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('已改写 %d 句；句子总数 %d 不变' % (len(EDITS), len(idx2)))
    for gi in sorted(EDITS):
        print('  #%d → %s' % (gi, EDITS[gi][3][:78]))
    return 0


if __name__ == '__main__':
    sys.exit(main())
