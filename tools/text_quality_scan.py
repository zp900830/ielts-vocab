#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""跟读篇四层文本质量全量扫描（英文 / 全句译文 / 行内词义 / 辨析卡）。

与 tools/shadow_text_audit.py 的分工：那份管「目标词标全没标、难度是否超纲」这类
规格符合性；这份管「已经标出来的内容本身对不对、读起来顺不顺」。

只读，不改任何文件。所有检查都是机械规则 —— 命中的是「嫌疑」，不是定论；
真正需要语义判断的（译文体例、词义是否合语境、辨析是否讲得通）交给逐句子代理。

用法：python3 tools/text_quality_scan.py [--json 输出路径]
"""
import json
import re
import sys
import collections

SECTIONS = 'shadow/data/sections.json'
VOCAB = 'shadow/data/vocab.json'
GLOSS_MAX = 12          # shadow/index.html glossParts() 的硬截断长度


def load():
    return (json.load(open(SECTIONS, encoding='utf-8')),
            json.load(open(VOCAB, encoding='utf-8')))


def strip_markers(s):
    return re.sub(r'\[\[([^\]:]+):([^\]]+)\]\]', r'\2', s)


def marked_keys(s):
    return [m.group(1).lower() for m in re.finditer(r'\[\[([^\]:]+):', s)]


def plain_words(s):
    """去掉标记后的纯文本词（小写）。"""
    return re.findall(r"[a-z][a-z'’]*", strip_markers(s).lower())


def iter_sents(D):
    gi = 0
    for ci, c in enumerate(D):
        for si, para in enumerate(c['paragraphs']):
            for k, sent in enumerate(para):
                yield gi, ci, si, k, sent, c['sentZh'][si][k]
                gi += 1


UNCOUNTABLE = {'hair', 'information', 'advice', 'luggage', 'equipment', 'furniture',
               'money', 'research', 'progress', 'knowledge', 'weather', 'traffic',
               'news', 'music', 'bread', 'water', 'rice', 'paper', 'homework'}
VOWEL_START = set('aeiou')
AN_EXCEPTION = {'hour', 'honest', 'honesty', 'honor', 'honour', 'heir', 'heiress',
                'uber', 'umbrella', 'uncle', 'enemy', 'onion', 'eye', 'error', 'ear',
                'egg', 'elf', 'ankle', 'axe', 'arm', 'leg', 'inch', 'olive', 'orbit',
                'opera', 'outline', 'oven', 'elephant', 'ice', 'isle'}
A_EXCEPTION = {'university', 'useful', 'user', 'utility', 'utensil', 'European', 'one',
               'once', 'one-off', 'one-sided', 'unit', 'union', 'unity', 'uterus',
               'unicorn', 'uniform', 'eulogy', 'euphemism', 'euchre', 'euro', 'used',
               'useless', 'usual', 'yard', 'yawn', 'year', 'yoga', 'yolk', 'young',
               'youth', 'yacht', 'yellow', 'yes'}


def check_english(sent, ci):
    """返回英文层的机器可疑点列表。"""
    out = []
    vis = strip_markers(sent)
    w = vis.split()
    if not vis.endswith('.') and not vis.endswith('?') and not vis.endswith('!'):
        out.append('缺句末标点')
    if '  ' in vis.strip():
        out.append('双空格')
    low = [x.lower().strip('.,;:!?"“”') for x in w]
    for i in range(len(low) - 1):
        if low[i] and low[i] == low[i + 1] and low[i] not in {'had', 'that'}:
            out.append(f'叠词 {low[i]}')
    for i in range(len(w) - 1):
        a, b = w[i].lower(), w[i + 1].lower().strip('.,;:!?')
        if a not in ('a', 'an'):
            continue
        if not re.fullmatch(r"[a-z][a-z'’-]*", b):
            continue
        if b in UNCOUNTABLE:
            out.append(f'{a} {b}：不可数名词')
        first = b[0]
        # 只按首字母判 a/an 会误报：useful/union 读 /j-/、hour 的 h 不发音，
        # 后面紧跟名词时（a water specialist）前面的名词其实是定语用法，都可数性无关
        nxt = w[i + 2].lower().strip('.,;:!?') if i + 2 < len(w) else ''
        if a == 'a' and first in VOWEL_START and b not in AN_EXCEPTION and b not in A_EXCEPTION:
            out.append(f'a {b}：应为 an')
        if a == 'an' and first not in VOWEL_START and b not in A_EXCEPTION and b not in AN_EXCEPTION:
            out.append(f'an {b}：应为 a')
        if a == 'a' and b in UNCOUNTABLE and nxt and nxt not in {'of','for','to','in','like','as'}:
            pass
        elif a == 'a' and b in UNCOUNTABLE:
            out.append(f'{a} {b}：不可数名词')
    if re.search(r"\b(noone|alot|becuase|recieve|teh|adn|thier|wich|whith|freind)\b", vis.lower()):
        out.append('拼写')
    if re.search(r'[a-z]\s*[,;]\s*[a-z]+\s+(and|but|so|or)\s+[a-z]', vis.lower()) and vis.count(',') >= 3:
        out.append('逗号串句嫌疑')
    if '"' in vis or "'" in vis and False:
        out.append('直引号')
    if re.search(r'\b(is|are|was|were)\s+\1\b', vis):
        out.append('重复系动词')
    if vis.count('"') % 2 or vis.count('“') != vis.count('”'):
        out.append('引号不配对')
    if re.match(r'^[a-z]', vis):
        out.append('句首小写')
    return out


def check_zh(sent, zh, ci, gi):
    out = []
    en_words = len(strip_markers(sent).split())
    if not zh.strip():
        return ['中文为空']
    ratio = len(zh) / max(1, en_words)
    if len(zh) < max(3, en_words * 0.9):
        out.append(f'译文偏短（{len(zh)}字/{en_words}词）')
    if en_words * 4.2 < len(zh):
        out.append(f'译文偏长（{len(zh)}字/{en_words}词）')
    if re.search(r'[a-zA-Z]{3,}', zh):
        out.append('译文含英文')
    if zh.count('，') > 6:
        out.append('译文逗号过多')
    if re.search(r'[;:]\s*$', zh):
        out.append('译文结尾悬挂')
    if zh.startswith('的') or '。。' in zh or '，，' in zh:
        out.append('译文标点异常')
    return out


def gloss_render(m):
    parts = [p.strip() for p in re.split(r'[；;]', str(m)) if p.strip()]
    if not parts:
        return '', False
    two = '；'.join(parts[:2])
    pick = two if len(two) <= GLOSS_MAX else parts[0]
    return pick[:GLOSS_MAX], len(pick) > GLOSS_MAX


def main():
    asjson = None
    if '--json' in sys.argv:
        asjson = sys.argv[sys.argv.index('--json') + 1]
    D, V = load()
    total = 0
    en_hits = collections.Counter()
    en_examples = collections.defaultdict(list)
    zh_hits = collections.Counter()
    zh_examples = collections.defaultdict(list)
    gloss_cut, gloss_senses = 0, collections.Counter()
    gloss_multi = []
    note_len = collections.Counter()
    notes_used = set()
    note_ref = collections.Counter()
    note_ref_examples = collections.defaultdict(list)
    dup_note = collections.defaultdict(list)
    label_dist = collections.Counter()
    zh_pair_dup = collections.defaultdict(list)

    chap_words = [{str(w).lower() for w in c['words']} for c in D]
    chap_tokens = [{m.group(0).lower()
                    for c in D for para in c['paragraphs'] for sent in para
                    for m in re.finditer(r"[A-Za-z][A-Za-z'’-]*", strip_markers(sent))}
                   for c in D]

    for gi, ci, si, k, sent, zh in iter_sents(D):
        total += 1
        for tag in check_english(sent, ci):
            key = tag.split('：')[0].split(' ')[0] if tag.startswith('a ') or tag.startswith('an ') else tag
            en_hits[tag if not tag.startswith(('a ', 'an ')) else key] += 1
            if len(en_examples[key]) < 6:
                en_examples[key].append((gi, strip_markers(sent)[:110], tag))
        for tag in check_zh(sent, zh, ci, gi):
            zh_hits[tag] += 1
            if len(zh_examples[tag]) < 5:
                zh_examples[tag].append((gi, strip_markers(sent)[:80], zh[:60], tag))
        zh_pair_dup[(ci, zh)].append(gi)

        for kk in set(marked_keys(sent)):
            e = V.get(kk)
            if not e:
                continue
            notes_used.add(kk)
            g, cut = gloss_render(e.get('m', ''))
            if cut:
                gloss_cut += 1
                if len(gloss_multi) < 25:
                    gloss_multi.append((kk, e['m'][:60], g))
            n_parts = [p for p in re.split(r'[；;]', str(e.get('m', ''))) if p.strip()]
            gloss_senses[len(n_parts)] += 1

    for w, e in V.items():
        n = e.get('note')
        if not n:
            note_len['无 note'] += 1
            continue
        if isinstance(n, dict):
            note_len['结构化 compare 卡'] += 1
            continue
        s = str(n).strip()
        L = len(s)
        note_len['1-19字' if L < 20 else '20-39字' if L < 40 else '40-69字' if L < 70 else '70字以上'] += 1
        m = re.match(r'^(辨析|同义词|反义词|词伙|搭配|易混|注意|提示)[:：]', s)
        label_dist[m.group(1) if m else '(无前缀)'] += 1
        dup_note[s].append(w)
        # 辨析里点名的其它英文词，是否在同一章真的出现过
        named = {x.lower() for x in re.findall(r'\b([A-Za-z]{3,})\b', s)}
        named -= {'may', 'can', 'must', 'will', 'shall', 'the', 'and', 'but', 'for', 'with', 'that', 'this'}
        if not named:
            continue
        chapters_with = [ci for ci in range(len(D)) if w in chap_words[ci]]
        if not chapters_with:
            continue
        for other in sorted(named):
            present = any(other in chap_tokens[ci] for ci in chapters_with)
            if not present:
                note_ref[other] += 1
                if len(note_ref_examples[other]) < 3:
                    note_ref_examples[other].append((w, chapters_with, s[:70]))

    print(f'扫描句子总数：{total}　词表条目：{len(V)}　课文里实际出现的可点词：{len(notes_used)}')

    print('\n【1｜英文层】机器可疑点（命中≠必改，是逐条要看）')
    for tag, c in en_hits.most_common():
        print(f'  {c:4d}  {tag}')
    for tag in en_hits:
        if tag.split(' ')[0] in ('a', 'an') or '不可数' in tag or '叠词' in tag or '拼写' in tag:
            for gi, s, t in en_examples[tag][:6]:
                print(f'    #{gi} [{t}] {s}')

    print('\n【2｜全句译文层】')
    for tag, c in zh_hits.most_common():
        print(f'  {c:4d}  {tag}')
    for tag, lst in zh_examples.items():
        for gi, s, z, t in lst[:3]:
            print(f'    #{gi} [{t}] {s}  ⇒  {z}')
    dup = {kk: v for kk, v in zh_pair_dup.items() if len(v) > 1}
    print(f'  同章内「不同英文共用同一句中文」的组数：{len(dup)}')
    for (ci, z), gs in list(dup.items())[:6]:
        print(f'    ch{ci} 复用 {len(gs)} 次：{z[:48]}')

    print('\n【3｜行内词义层】')
    print(f'  渲染时被 {GLOSS_MAX} 字硬截断的词形：{gloss_cut}')
    print('  每词条义项数分布：' + ', '.join(f'{n} 项×{c}' for n, c in sorted(gloss_senses.items())))
    for kk, full, cutted in gloss_multi[:12]:
        print(f'    {kk}: 完整「{full}」→ 只显示「{cutted}」')

    print('\n【4｜辨析卡层】')
    for tag, c in note_len.most_common():
        print(f'  {c:4d}  {tag}')
    print('  note 前缀标签分布：' + ', '.join(f'{k}×{v}' for k, v in label_dist.most_common()))
    hard = {s: ws for s, ws in dup_note.items() if len(ws) >= 3 and len(s) > 25}
    print(f'  同一句辨析文案被 ≥3 个词共用（疑似套模板）：{len(hard)} 组')
    for s, ws in list(hard.items())[:8]:
        print(f'    {len(ws)} 词同文案 {ws[:6]}…：{s[:70]}')
    print(f'  辨析里点名、但同章课文中根本没出现的词：{len(note_ref)} 个（去重后）')
    for other, c in note_ref.most_common(12):
        w, chs, s = note_ref_examples[other][0]
        print(f'    {other} 被引用 {c} 次｜例：{w} 的辨析「{s}」，只在 ch{chs} 声明')

    if asjson:
        json.dump({'en': dict(en_hits), 'zh': dict(zh_hits), 'gloss_cut': gloss_cut,
                   'note_labels': dict(label_dist)},
                  open(asjson, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print(f'\n已写统计 JSON：{asjson}')


if __name__ == '__main__':
    main()
