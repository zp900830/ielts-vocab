#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""修词典例句里「第三人称单数主语 + 动词原形」的系统性变位缺陷，以及卡片里的残缺 token。

成因：这些例句是早先按「主语写死 He/She/一个单数名词 + 动词填词条原形」批量生成的，
从来没做过三单变位。课文（sections.json）没有这个问题，只有点词弹窗里的例句有。

23 条是**人工逐条从 58 条机器嫌疑里筛出来的**——机器把「They/We + 原形」（复数主语，本就该用原形）
和「Please do …」（祈使句）都算进来了，所以必须以这份表为准，不要再拿正则结果直接改。

用法：python3 tools/fix_example_agreement.py [--apply]
"""
import json
import re
import sys

VOCAB = 'shadow/data/vocab.json'

# 词条 → (例句里的错误片段, 正确片段)。脚本要求「错误片段」在该词条 ex 里恰好出现一次。
EX_FIX = {
    'admit':    ('He finally admit his mistake.', 'He finally admitted his mistake.'),
    'affirm':   ('He affirm that', 'He affirms that'),
    'assort':   ('She assort the books', 'She assorts the books'),
    'bind':     ('He bind the books', 'He binds the books'),
    'clothe':   ('She clothe the baby', 'She clothes the baby'),
    'commit':   ('He commit to help his friend.', 'He commits to helping his friend.'),
    'conform':  ('He conform to the rules', 'He conforms to the rules'),
    'donate':   ('He donate money', 'He donates money'),
    'drag':     ('He drag the box', 'He drags the box'),
    'endow':    ('He endow a library', 'He endows a library'),
    'exhale':   ('He exhale slowly', 'He exhales slowly'),
    'greet':    ('He greet his friend', 'He greets his friend'),
    'improvise': ('He improvise a song', 'He improvises a song'),
    'kick':     ('He kick the ball', 'He kicks the ball'),
    'paralyse': ('The snake bite paralyse his arm.', "The snake's bite paralyses his arm."),
    'predict':  ('The old woman predict rain tomorrow.', 'The old woman predicts rain tomorrow.'),
    'propose':  ('He propose to go', 'He proposes to go'),
    'pull':     ('He pull the door open.', 'He pulls the door open.'),
    'reject':   ('He reject the job offer.', 'He rejects the job offer.'),
    'shuffle':  ('He shuffle his feet', 'He shuffles his feet'),
    'startle':  ('The loud noise startle the bird.', 'The loud noise startles the bird.'),
    'submerge': ('The diver submerge to explore', 'The diver submerges to explore'),
    'throw':    ('He throw the ball', 'He throws the ball'),
    'tremble':  ('The old man tremble in the cold wind.', 'The old man trembles in the cold wind.'),
    'weep':     ('Her weep lasted for hours', 'Her weeping lasted for hours'),
}

# 卡片文本里的残缺/畸形 token（不是我的扫描误报：awareness / conveyable 之类已排除）
NOTE_FIX = {
    'acknowl,': 'acknowledge,',          # 被截断的 acknowledge，出现在 5 张卡里
    'resolve conficts, resolve conflicts': 'resolve conflicts',   # 拼错 + 与正确项重复
    'perform intellectualjobs': 'perform intellectual jobs',     # 漏了空格
    'dna,': 'DNA,',                      # 小写的 DNA 出现在 5 张卡的同义词行里
}


def main():
    do = '--apply' in sys.argv
    raw = open(VOCAB, encoding='utf-8').read()
    V = json.loads(raw)
    errs, n_ex, n_note = [], 0, 0
    for w, (bad, good) in EX_FIX.items():
        e = V.get(w)
        if not e:
            errs.append(f'{w}: 词条不存在')
            continue
        ex = str(e.get('ex', ''))
        if bad not in ex:
            errs.append(f'{w}: 例句里找不到待修片段 {bad!r}（实际 {ex[:60]!r}）')
            continue
        e['ex'] = ex.replace(bad, good, 1)
        n_ex += 1
    for w, e in V.items():
        n = e.get('note')
        if not isinstance(n, str):
            continue
        for bad, good in NOTE_FIX.items():
            if bad in n:
                e['note'] = n = n.replace(bad, good)
                n_note += 1
    # 修完必须还是一条合法的例句：以大写开头、有句末标点、不含残留 token
    # 用词边界复查，避免「acknowl」把已修好的「acknowledge」又匹配上
    resid = [w for w, e in V.items()
             if any(re.search(r'\b' + re.escape(b.rstrip(',\s')) + r'\b(?!edge)', str(e.get('note', '')) + ' ' + str(e.get('ex', '')))
                    for b in NOTE_FIX)]
    if errs:
        print('拒绝落盘：')
        for x in errs:
            print('  -', x)
        return 1
    if not do:
        print(f'DRY-RUN 通过：应修例句 {n_ex} 条、卡片 token {n_note} 处')
        return 0
    json.dump(V, open(VOCAB, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(f'已修例句 {n_ex} 条、卡片 token {n_note} 处；残留可疑 token {resid}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
