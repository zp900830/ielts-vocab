#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把辨析卡草稿（work/…辨析…md）落地进 shadow/data/vocab.json。

草稿是人写的、格式有两种历史形状：
  · 批次 1：差异表已经是宽表 `| 维度 | dawn | sunrise |` —— 和数据的 diff 一模一样
  · 批次 2：差异表是长表 `| 维度 | 词 | 常见搭配 | 用在哪 | 一句话区别 |`
本工具**只吃宽表**，遇到长表就报错，不做静默降级 —— 上一轮代理把 note 压成字符串
直接显示在线上，就是因为落地器"尽力而为"。宁可停下。

三种模式：
  --dry-run  只解析 + 打印报表（默认）
  --write    写 vocab.json（紧凑分隔符，保持单行）+ 重算 SHADOW_DATA_VER
  --check    解析后按 validate 第 16 条的口径自查（宽度 / 锚点 / 成员有卡），不写文件

关键约束（都在报表里点名，不猜）：
  · note 只能挂在词头卡上，一个词头一个 note —— 一个成员同时属于两组时，
    只有一组能拿到这个"载体"，另一组挂到它另一个成员上（carrier 选择见报表）。
  · items[].eg 会被 validate 拿去全库 grep，所以草稿里「（课文 72）」这种出处后缀必须剥掉。
  · summary 结尾必须是「简单记：<默认行>」，段末默认行显示的就是这一截，宽度也是量它。
"""
import json
import os
import re
import sys
import glob
import hashlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOCAB = os.path.join(ROOT, 'shadow', 'data', 'vocab.json')
SECTIONS = os.path.join(ROOT, 'shadow', 'data', 'sections.json')
INDEX = os.path.join(ROOT, 'shadow', 'index.html')


def width(t):
    """与 scripts/validate_data.py._width 一字不差：汉字与全角标点各 1，其余 0.5。"""
    return sum(1 if ('一' <= c <= '鿿') or ('　' <= c <= '〿') or ('＀' <= c <= '￯') else 0.5
               for c in t)


PROV = re.compile(r'[（(]\s*(?:课文|卡|ex|note|词伙|同位|原文|书|章)\s*\d*[^）)]*[)）]\s*$')


def strip_prov(s):
    """剥掉草稿 eg 末尾的出处括号 —— validate 拿 eg 去全库 grep，带中文后缀必查无。"""
    prev = None
    s = (s or '').strip().strip('`').strip()
    while prev != s:
        prev = s
        s = PROV.sub('', s).strip().rstrip('；;，,').strip()
    return s


def cells(line):
    return [c.strip() for c in line.strip().strip('|').split('|')]


def table_after(lines, start):
    """从 start 往下找第一张 markdown 表，返回 (header_cells, row_cells[])。"""
    i = start
    while i < len(lines) and not lines[i].lstrip().startswith('|'):
        if lines[i].startswith('##'):
            return None, None
        i += 1
    if i >= len(lines):
        return None, None
    head = cells(lines[i])
    rows = []
    i += 2 if i + 1 < len(lines) and set(lines[i + 1].replace('|', '').strip()) <= set('-: ') else 1
    while i < len(lines) and lines[i].lstrip().startswith('|'):
        rows.append(cells(lines[i]))
        i += 1
    return head, rows


def block_after_quote(lines, start):
    i = start
    while i < len(lines) and not lines[i].strip():
        i += 1
    out = []
    while i < len(lines) and (lines[i].startswith('>') or lines[i].strip()):
        if lines[i].startswith('##'):
            break
        t = lines[i].strip().lstrip('>').strip()
        if t:
            out.append(t)
        if lines[i].strip() and not lines[i].startswith('>') and out:
            break
        i += 1
    return ' '.join(out)


def code_after(lines, start):
    i = start
    while i < len(lines) and not lines[i].strip():
        i += 1
    if i < len(lines) and lines[i].strip().startswith('```'):
        j = i + 1
        body = []
        while j < len(lines) and not lines[j].strip().startswith('```'):
            body.append(lines[j])
            j += 1
        return '\n'.join(body).strip()
    return lines[i].strip().lstrip('>').strip() if i < len(lines) else ''


def split_groups(md):
    """[(heading, start_line, end_line)]，一个 `## 组 N ·` 到下一个 `## ` 为止。"""
    lines = md.split('\n')
    marks = [(i, ln) for i, ln in enumerate(lines) if re.match(r'^##\s+组\s*\d+', ln)]
    out = []
    for k, (i, ln) in enumerate(marks):
        end = marks[k + 1][0] if k + 1 < len(marks) else len(lines)
        # 「## 附：…」不是组，要提前收口
        for j in range(i + 1, end):
            if re.match(r'^##\s(?!组\s*\d)', lines[j]):
                end = j
                break
        out.append((ln, i, end))
    return out, lines


def parse_group(heading, lines, a, b, fname):
    """返回 (card_dict, warnings[])。任何解析不出来的一律进 errors，不猜。"""
    errs, warns = [], []
    g = {'raw_heading': heading}

    # 组标题三种历史写法：`## 组 1 · dawn / sunrise（共享义项：黎明）`、
    # `## 组 1 · damp / humid —— 潮湿 ｜ \`all_synonyms\`: true ｜ 段 [0,13]`。
    # 成员一律从「·」之后截到第一个装饰性分隔（（ ｜ —）为止，斜杠切开。
    m = re.match(r'^##\s+组\s*(\d+)\s*·\s*(.+)$', heading)
    if not m:
        return None, [f'{fname}: 组标题解析不出成员: {heading[:60]}'], []
    idx = int(m.group(1))
    head_members = re.split(r'[（｜(—]', m.group(2), 1)[0]
    members = [x.strip().lower() for x in re.split(r'\s*/\s*', head_members) if x.strip()]
    members = [x for x in members if re.fullmatch(r'[a-z][a-z\-]*', x)]
    if len(members) < 2:
        return None, [f'{fname} 组{idx}: 成员数 <2'], []
    g['members'] = members
    g['idx'] = idx

    def find(pat, lo=a, hi=b):
        for i in range(lo, hi):
            if re.search(pat, lines[i]):
                return i
        return None

    # --- title ---
    ti = find(r'(表头一句|^\*\*表头)')
    g['title'] = block_after_quote(lines, ti + 1).strip() if ti else ''
    if not g['title']:
        errs.append(f'{fname} 组{idx}: 没有表头一句')

    # --- items ---
    ii = find(r'成员（items）|^\*\*成员')
    head, rows = table_after(lines, ii + 1) if ii is not None else (None, None)
    if not head or '词' not in head[0]:
        errs.append(f'{fname} 组{idx}: 找不到成员表')
        items = []
    else:
        col = {name: k for k, name in enumerate(head)}

        def cell(row, key):
            for name, i in col.items():
                if key in name and i < len(row):
                    return row[i].strip()
            return ''
        items = []
        for row in rows:
            w = cell(row, '词').strip('*`').strip().lower()
            if not w or not re.match(r'^[a-z][a-z\- ]*$', w):
                continue
            it = {'w': w, 'p': cell(row, '音标').strip('`'),
                  'pos': cell(row, '词性'), 'sense': cell(row, 'sense'),
                  'core': cell(row, 'core').strip('*')}
            sc = cell(row, 'scene').strip('*')
            eg = strip_prov(cell(row, 'eg'))
            if sc:
                it['scene'] = sc
            if eg:
                it['eg'] = eg
            items.append(it)
        got = [x['w'] for x in items]
        missing = [x for x in members if x not in got]
        if missing:
            errs.append(f'{fname} 组{idx}: 成员表里缺 {missing}')
    g['items'] = items

    # --- 默认行 / 总结句 ---
    li = find(r'默认.*行')
    g['line'] = code_after(lines, li + 1) if li else ''
    if not g['line']:
        errs.append(f'{fname} 组{idx}: 没有默认那一行')
    si = find(r'总结句')
    g['summary_line'] = block_after_quote(lines, si + 1) if si else ''
    if not g['summary_line']:
        errs.append(f'{fname} 组{idx}: 没有总结句')

    # --- diff（只吃宽表）---
    di = find(r'差异维度表|^\*\*差异')
    head, rows = table_after(lines, di + 1) if di is not None else (None, None)
    diff = []
    if not head:
        errs.append(f'{fname} 组{idx}: 找不到差异表')
    elif len(head) >= 3 and head[1].strip('*`').lower() in ('词',) :
        errs.append(f'{fname} 组{idx}: 差异表是长表（第 2 列是「词」），先转成 `| 维度 | 词1 | 词2 |` 宽表再落地')
    elif head[0].startswith('维度') or len(head) - 1 == len(members):
        cols = [c.strip('*`').lower() for c in head[1:]]
        bad = [c for c in cols if c not in members]
        if bad:
            errs.append(f'{fname} 组{idx}: 差异表列名与成员不符: {bad} vs {members}')
        for row in rows:
            if len(row) < len(head):
                continue
            r = {'label': row[0].strip('*').strip()}
            for k, c in enumerate(cols):
                v = row[k + 1].strip() if k + 1 < len(row) else ''
                if v:
                    r[c] = v
            diff.append(r)
    else:
        errs.append(f'{fname} 组{idx}: 差异表表头认不出: {head[:4]}')
    g['diff'] = diff

    # --- 锚点 [章, 段] ---
    at = None
    for pat in (r'主锚点\s*[=＝]\s*章?\s*(\d+)\s*段\s*(\d+)',
                r'该段原文[（(]\s*章\s*(\d+)\s*段\s*(\d+)'):
        ai = find(pat)
        if ai is None:
            continue
        mm = re.search(pat, lines[ai])
        at = [int(mm.group(1)), int(mm.group(2))]
        break
    if at is None:
        errs.append(f'{fname} 组{idx}: 找不到主锚点（要「主锚点 = 章N 段M」或「该段原文（章N 段M）」）')
    g['at'] = at

    g['slug'] = '-'.join(members)
    g['file'] = fname
    return g, errs, warns


def load():
    vocab = json.load(open(VOCAB, encoding='utf-8'))
    sections = json.load(open(SECTIONS, encoding='utf-8'))
    return vocab, sections


def in_para(sections, ci, pi, w):
    try:
        para = sections[ci]['paragraphs'][pi]
    except (IndexError, KeyError, TypeError):
        return False
    return any(f'[[{w}:' in s or f'[[{w}]]' in s for s in para if isinstance(s, str))


def main(argv):
    write = '--write' in argv
    check = '--check' in argv
    paths = [a for a in argv if not a.startswith('--')]
    if not paths:
        paths = sorted(glob.glob(os.path.join(ROOT, 'work', '辨析草稿', '2_*.md')))
        paths += [os.path.join(ROOT, 'work', '2026-09-20-辨析批次1A.md'),
                  os.path.join(ROOT, 'work', '2026-09-20-辨析批次1B.md')]
    vocab, sections = load()
    cards, all_errs = [], []
    for p in paths:
        md = open(p, encoding='utf-8').read()
        gls, lines = split_groups(md)
        for heading, a, b in gls:
            g, errs, warns = parse_group(heading, lines, a, b, os.path.basename(p))
            all_errs += errs
            for w in warns:
                all_errs.append('WARN ' + w)
            if g:
                cards.append(g)

    # 自查（validate #16 的口径，提前跑一遍，别等落地后红）
    slug_seen, carrier_plan = {}, []
    for g in cards:
        f = g['file']
        if width(g['line']) > 40:
            all_errs.append(f'{f} 组{g["idx"]}: 默认行宽 {width(g["line"])} > 40')
        if width(g['summary_line']) > 30:
            all_errs.append(f'{f} 组{g["idx"]}: 总结句宽 {width(g["summary_line"])} > 30')
        if g['slug'] in slug_seen:
            all_errs.append(f'组号冲突 {g["slug"]}: {slug_seen[g["slug"]]} 与 {f} 组{g["idx"]} 撞了')
        slug_seen[g['slug']] = f'{f} 组{g["idx"]}'
        for m in g['members']:
            if m not in vocab:
                all_errs.append(f'{f} 组{g["idx"]}: 成员 {m} 在 vocab.json 没卡')
        if g['at'] and not all(in_para(sections, g['at'][0], g['at'][1], m) for m in g['members']):
            all_errs.append(f'{f} 组{g["idx"]}: 锚点段 {g["at"]} 里成员没到齐')
        taken = [m for m in g['members'] if isinstance((vocab.get(m) or {}).get('note'), dict)]
        carrier_plan.append((g, [m for m in g['members'] if m not in taken]))

    # 载体分配：一个词头只能带一张表 —— 逐个组挑一个还没被占用的成员
    used = set()
    unmapped = []
    for g, free in carrier_plan:
        pick = next((m for m in free if m not in used), None)
        if pick is None:
            unmapped.append(g)
            continue
        used.add(pick)
        g['carrier'] = pick

    print(f'解析 {len(paths)} 份草稿 / {len(cards)} 组')
    print(f'载体分配：{len(cards) - len(unmapped)} 组可挂，冲突 {len(unmapped)} 组')
    for g in unmapped:
        print(f'  冲突 {g["file"]} 组{g["idx"]} {g["slug"]}: 成员 {g["members"]} 都已被别的组占用')
    hard = [e for e in all_errs if not e.startswith('WARN')]
    print(f'\n错误 {len(hard)} 条 / 提醒 {len(all_errs) - len(hard)} 条')
    for e in all_errs[:60]:
        print('  ' + e)
    if len(all_errs) > 60:
        print(f'  …另有 {len(all_errs) - 60} 条')

    if hard or unmapped or check:
        print('\n未落地。' + ('（--check 模式不写文件）' if check and not hard and not unmapped else ''))
        return 1 if (hard or unmapped) and not check else (1 if hard or unmapped else 0)

    if not write:
        with open(os.path.join(ROOT, 'work', '辨析审核', 'land_preview.json'), 'w', encoding='utf-8') as f:
            json.dump([{k: g[k] for k in ('file', 'idx', 'slug', 'members', 'carrier', 'at',
                                           'title', 'line', 'summary_line')} for g in cards],
                      f, ensure_ascii=False, indent=1)
        print('已写 work/辨析审核/land_preview.json（--write 才落数据）')
        return 0

    before = len(vocab)
    for g in cards:
        note = {'type': 'compare', 'group': g['slug'], 'title': g['title'],
                'items': [{k: v for k, v in it.items() if v} for it in g['items']],
                'diff': g['diff'],
                'summary': f"辨析：{g['summary_line']} 简单记：{g['line']}",
                'at': g['at']}
        vocab[g['carrier']]['note'] = note
    tmp = VOCAB + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(vocab, f, ensure_ascii=False, separators=(',', ':'))
    os.replace(tmp, VOCAB)
    print(f'已写 vocab.json：{before} → {len(vocab)} 词头，新增/覆盖 {len(cards)} 张辨析卡')

    # SHADOW_DATA_VER：内容哈希，跟 build/validate 的口径一致
    h = hashlib.sha256()
    for p in sorted(glob.glob(os.path.join(ROOT, 'shadow', 'data', '*.json'))):
        h.update(open(p, 'rb').read())
    ver = h.hexdigest()[:10]
    src = open(INDEX, encoding='utf-8').read()
    new, n = re.subn(r'(const SHADOW_DATA_VER = ")[0-9a-f]{10}(";)', r'\g<1>' + ver + r'\g<2>', src)
    if n != 1:
        print(f'!! SHADOW_DATA_VER 没替换上（{n} 处），手动核对 shadow/index.html；新值应为 {ver}')
    else:
        open(INDEX, 'w', encoding='utf-8').write(new)
        print(f'SHADOW_DATA_VER → {ver}')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
