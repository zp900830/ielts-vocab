#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把辨析卡草稿（work/…辨析…md）落地进 shadow/data/vocab.json。

草稿是人写的、格式有两种历史形状：
  · 批次 1A：差异表已经是宽表 `| 维度 | dawn | sunrise |` —— 和数据的 diff 一模一样
  · 批次 1B/2：差异表是长表 `| 维度 | 词 | 常见搭配 | 用在哪 | 一句话区别 |`
长表在**这里**（内存里、只在落地这一次）转置成宽表，草稿一种都不改写 —— 四份门禁 2
审核是逐行核过草稿原文的，重排文件等于把「已被人工核过」的凭据洗掉。
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
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from width_rule import width  # noqa: E402  一把尺：与 validate_data.py 同源，别再抄一份
sys.path.insert(0, os.path.join(ROOT, 'scripts'))
from validate_data import shadow_data_ver  # noqa: E402  版本号算法也只有一份，抄一遍就会漂


PROV = re.compile(r'[（(]\s*(?:课文|卡|ex|note|词伙|同位|原文|书|章)\s*\d*[^）)]*[)）]\s*')


def clean_text(s):
    """草稿里的 markdown 记号到了页面上是死字（渲染走 esc，没有 markdown 解析器）。"""
    s = re.sub(r'\*\*(.+?)\*\*', r'\1', str(s or ''))
    s = s.replace('`', '')
    return re.sub(r' {2,}', ' ', s).strip()


def strip_prov(s, warn=None, where=''):
    """剥掉草稿 eg 里的出处括号与反引号 —— validate 拿 eg 去全库 grep，带后缀必查无。
    一格塞两句（用 ／ 分隔）时只留第一句：整串永远 grep 不到，而第二句在差异表里原样还在。"""
    s = str(s or '')
    # 一格塞两条书证（用 ／ 或 、连着）时取第一条：validate 拿 eg 去全库 grep，两条连在一起永远查无。
    # 「第一条」不是随手挑的 —— 作者按「先书证、后备证」的顺序写，第二条在差异表里原样还在。
    m = re.search(r'`([^`]+)`', s)
    if m:
        rest = s[m.end():].strip().strip('／、,；; ').strip()
        if rest and warn is not None:
            warn.append(f'{where}: eg 还有第二条书证，只落第一条（第二条在差异表里原样还在）: {rest[:40]}')
        return clean_text(m.group(1))
    prev = None
    while prev != s:
        prev = s
        s = PROV.sub('', s).strip().rstrip('；;，,').strip()
    return clean_text(s)


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


def items_from_vocab(vocab, members):
    """没有成员表时（批次 1A 的全部 5 组早于这套版式），items 直接从现卡取。
    只搬 vocab 里已有的字段，不补 core/scene —— 那两格是人写的钩子，工具编不出来。"""
    out = []
    for w in members:
        c = vocab.get(w) or {}
        m = str(c.get('m') or '').strip()
        mm = re.match(r'^((?:n|v|vt|vi|adj|adv|prep|conj|pron|phrase)\.\s*)', m)
        pos = mm.group(1).strip() if mm else ''
        raw = str(c.get('p') or '').strip().strip('/')
        out.append({'w': w, 'p': f'/{raw}/' if raw else '',
                    'pos': pos, 'sense': (m[len(pos):] if pos else m).strip(),
                    'core': '', 'eg': str(c.get('ex') or '').strip()})
    return out


def parse_group(heading, lines, a, b, fname, vocab):
    """返回 (card_dict, errors[], warnings[])。任何解析不出来的一律进 errors，不猜。"""
    errs, warns = [], []
    g = {'raw_heading': heading}

    # 组标题三种历史写法：`## 组 1 · dawn / sunrise（共享义项：黎明）`、
    # `## 组 1 · damp / humid —— 潮湿 ｜ \`all_synonyms\`: true ｜ 段 [0,13]`。
    # 成员一律从「·」之后截到第一个装饰性分隔（（ ｜ —）为止，斜杠切开。
    m = re.match(r'^##\s+组\s*(\d+)\s*·\s*(.+)$', heading)
    if not m:
        return None, [f'{fname}: 组标题解析不出成员: {heading[:60]}'], []
    idx = int(m.group(1))
    head_members = re.split(r"[（｜(—]", m.group(2), maxsplit=1)[0]
    members = [x.strip().lower() for x in re.split(r'\s*/\s*', head_members) if x.strip()]
    # 允许词组型词头（`dining hall`、`swear word`）—— 第一版只认 [a-z-]，把 idx 28/73
    # 两组直接判成"成员数 <2"，等于凭空丢掉两张表。
    members = [x for x in members if re.fullmatch(r'[a-z][a-z\- ]*[a-z]|[a-z]', x)]
    if len(members) < 2:
        return None, [f'{fname} 组{idx}: 成员数 <2'], []
    g['members'] = members
    g['idx'] = idx

    def find(pat, lo=a, hi=b):
        for i in range(lo, hi):
            if re.search(pat, lines[i]):
                return i
        return None

    def table_by_sig(pat, sig, lo=a, hi=b):
        """扫 pat 在组内的**所有**命中，返回第一张「表头签名对得上」的表。
        只取第一个命中会踩坑：作者常在小节正文里先提一句「差异维度表按…」，
        那句后面紧跟着的是本段原文表（表头是 全局句/英文原句），拿它当差异表
        等于把课文塞进对比栏 —— 所以对不上签名就继续往下找。"""
        for i in range(lo, hi):
            if not re.search(pat, lines[i]):
                continue
            head, rows = table_after(lines, i + 1)
            if head and sig(head):
                return head, rows
        return None, None

    # --- title ---
    ti = find(r'(表头一句|^\*\*表头)')
    g['title'] = block_after_quote(lines, ti + 1).strip() if ti else ''
    if not g['title']:
        errs.append(f'{fname} 组{idx}: 没有表头一句')
    elif re.search(r'这一?句', g['title']):
        # 与 validate_data.py 第 16 条 (b) 同一条规则：卡挂在段末，「这一句/这句」没有可指的句子。
        # 在落地前就拦下来，而不是等写进 vocab.json 后由门禁 3 报错（批次 3 有两组就是这么撞上的）。
        errs.append(f'{fname} 组{idx}: 表头用「这一句/这句」指代，但卡挂段末（改「这一段」或「同句里」）')

    # --- items ---
    head, rows = table_by_sig(r'成员（items）|^\*\*成员|^#+\s*成员',
                              lambda h: '词' in h[0] and any('sense' in c or 'core' in c for c in h))
    items = []
    if not head:
        # 批次 1A 早于「成员表」这套版式，5 组都没有这一节。音标/词性/义项/例句现卡里就有，
        # 工具搬过去（不是编）；core 和 scene 是人写的钩子，搬不出来就留着，报表点名。
        warns.append(f'{fname} 组{idx}: 无成员表 → items 取自 vocab.json 现卡（core/scene 空着）')
        items = items_from_vocab(vocab, members)
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
            eg = strip_prov(cell(row, 'eg'), warns, f'{fname} 组{idx}/{w or "?"}')
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
    # 必须按「小标题形状」定位：批次 6 的修复代理在组里加了讲"默认行/总结句不复用旧表"的说明段，
    # 老正则 `默认.*行` 先撞上那段散文，于是把整段「这一段在讲什么」当成了默认行（量出 282 宽）。
    HEAD = r'^\s*>?\s*(?:#{1,6}\s*|\*\*)?%s'
    li = find(HEAD % r'默认.{0,14}行')
    g['line'] = code_after(lines, li + 1) if li else ''
    if not g['line']:
        errs.append(f'{fname} 组{idx}: 没有默认那一行')
    elif '\n' in g['line'] or width(g['line']) > 120:
        errs.append(f'{fname} 组{idx}: 默认行取到的是整段（{width(g["line"]):.0f} 宽）而不是那一行 '
                    f'—— 小标题没写成 `### 默认那一行（实测宽度 X / ≤40）` + 紧跟一个 ``` 围栏')
    si = find(HEAD % '总结句')
    g['summary_line'] = block_after_quote(lines, si + 1) if si else ''
    if not g['summary_line']:
        errs.append(f'{fname} 组{idx}: 没有总结句')
    elif width(g['summary_line']) > 120:
        errs.append(f'{fname} 组{idx}: 总结句取到的是整段（{width(g["summary_line"]):.0f} 宽）'
                    f'—— 小标题没写成 `### 总结句（实测宽度 X / ≤30）` + 紧跟一行')

    # --- diff ---
    # 两种形状都收，**草稿一种也不改写**（四份审核是逐行核过草稿原文的，批量重排会把
    # 那份"已被人工核过"的凭据洗掉）。转换只在这里、只在这一次发生：
    #   宽表（批次 1A）`| 维度 | dawn | sunrise |`  → {label: 维度, dawn:…, sunrise:…}
    #   长表（批次 2） `| 维度 | 词 | 搭配 | 用在哪 | 一句话区别 |`
    #       → 按维度转置成宽表，每维度出 2–3 行，并多带一个 dim 字段，
    #         渲染时 dim 变化处插一行小标题 —— 手机上读起来是"四块"，不是"十二行"。
    head, rows = table_by_sig(r'^#+\s*差异|^\*\*差异|差异维度表',
                              lambda h: '维度' in h[0])
    diff = []
    TAGS = (('区别', ('一句话区别', '区别')), ('搭配', ('常见搭配', '搭配')),
            ('用在哪', ('用在哪',)))
    if not head:
        errs.append(f'{fname} 组{idx}: 找不到差异表')
    elif len(head) >= 3 and re.sub(r'[*`\s]', '', head[1]) == '词':
        # 长表：先按维度聚合成块，再决定这一块怎么摆 ——
        #   两侧都有话     → 一行一列，词当列名（这才是对比表）
        #   只有一侧有话   → 整行合并，词名写进正文（「谁能夸事」→「grand：…」）
        #   「两个词」那一行 → 本来就不点名某个词，整行合并
        # 不给缺的那侧补空格子：空格子在表里读作「书里没有」，而作者早就把另一侧的
        # 情况写进「一句话区别」了（「magnificent 卡上没有这一义」）。补格子=盖真话。
        cols = {}
        for tag, keys in TAGS:
            for k, name in enumerate(head):
                if k and any(key in name for key in keys):
                    cols[tag] = k
                    break

        def nz(s):
            return re.sub(r'[\s　]', '', re.sub(r'[*`]', '', s or '')).lower()
        n2m = {nz(m): m for m in members}
        need = [m for m in members if m not in {n2m.get(nz(r[1])) for r in rows if len(r) > 1}]
        if need:
            errs.append(f'{fname} 组{idx}: 长表里缺成员行 {need}')
        blocks = {}
        for r in rows:
            dim = re.sub(r'[*`]', '', r[0]).strip() if r else ''
            if not dim:
                errs.append(f'{fname} 组{idx}: 长表有一行没有维度名')
                continue
            blk = blocks.setdefault(dim, {'words': [], 'cells': []})
            w = n2m.get(nz(r[1])) if len(r) > 1 else None
            if w and w not in blk['words']:
                blk['words'].append(w)
            for tag, _ in TAGS:
                k = cols.get(tag)
                txt = r[k].strip() if k is not None and k < len(r) else ''
                if txt:
                    blk['cells'].append((tag, w, txt))
        for dim, blk in blocks.items():
            full = len(blk['words']) == len(members)
            if not full and blk['words']:
                side = [m for m in members if m not in blk['words']]
                warns.append(f'{fname} 组{idx}: 维度「{dim}」只有 {blk["words"]} 有话（{side} 那侧书里没给）'
                             f'→ 整行合并摆，不补空格子')
            by_tag = {}
            for tag, w, txt in blk['cells']:
                by_tag.setdefault(tag, []).append((w, txt))
            for tag in ('区别', '搭配', '用在哪'):
                for w, txt in by_tag.get(tag, []):
                    row = None
                    if full and w:
                        row = next((x for x in diff if x['dim'] == dim and x['label'] == tag
                                    and 'both' not in x and w not in x), None)
                    if row is None:
                        row = {'dim': dim, 'label': tag}
                        diff.append(row)
                    if full and w:
                        row[w] = txt
                    else:
                        row['both'] = f'{w}：{txt}' if w else txt
    elif head[0].startswith('维度') or len(head) - 1 == len(members):
        cols = [re.sub(r'[*`\s]', '', c).lower() for c in head[1:]]
        bad = [c for c in cols if c not in members]
        if bad:
            errs.append(f'{fname} 组{idx}: 差异表列名与成员不符: {bad} vs {members}')
        for row in rows:
            if len(row) < len(head):
                continue
            lab = re.sub(r'[*`]', '', row[0]).strip()
            bare = re.sub(r'[（(].*?[)）]', '', lab).strip()
            # 表头列名统一成长表转置后的那三个词，两种形状摆在页面上才是一回事
            tag = next((t for t, keys in TAGS if any(k in bare for k in keys)), None)
            r = {'label': tag or bare or lab}
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
    # 辨析卡放 `cmp`，不放 `note`：note 是人手写的「同义词：…／词伙：…」串，句下词级笔记
    # 读的就是它（shadow 的 noteBar），52 组里有 46 组的载体带着这种串 —— 写进 note
    # 等于把人家背的东西覆盖掉。早先落地的 5 张卡占着 note，这里一并搬走（幂等）。
    moved = 0
    for k, c in vocab.items():
        if isinstance(c.get('note'), dict):
            c['cmp'] = c.pop('note')
            moved += 1
    if moved:
        print(f'迁移：{moved} 张旧辨析卡从 note 搬到 cmp（note 还给词伙/同义词串）')
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
    # --skip <slug>：把某一组整组排除在本次之外（载体撞车 / 与线上旧表同 slug 会被静默覆盖时，
    # 落 41 组比因为 1 组卡住整批不落更有用，但那组必须**显式**报给用户，不能悄悄跳过）。
    skip, paths, isval = set(), [], False
    for a in argv:
        if isval and not a.startswith('--'):
            skip.add(a); isval = False; continue
        isval = (a == '--skip')
        if not a.startswith('--'):
            paths.append(a)
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
            g, errs, warns = parse_group(heading, lines, a, b, os.path.basename(p), vocab)
            all_errs += errs
            for w in warns:
                all_errs.append('WARN ' + w)
            if g:
                cards.append(g)

    if skip:
        held = [g['slug'] for g in cards if g['slug'] in skip]
        cards = [g for g in cards if g['slug'] not in skip]
        for s in sorted(skip):
            tag = '已排除' if s in held else '!! 本次草稿里没有这个 slug（拼错了？）'
            print(f'{tag} --skip {s}')
        if len(held) != len(set(held)):
            all_errs.append(f'--skip 的 slug 在草稿里出现多份：{held}')

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
        # 「已被占用」要排除本工具自己上一轮落的卡 —— 否则重跑第二遍时，第一遍挑的载体
        # 会把这一组顶到另一个成员上，连锁产生一堆假冲突（落地就不幂等了）。
        taken = [m for m in g['members']
                 if isinstance((vocab.get(m) or {}).get('cmp'), dict)
                 and (vocab[m]['cmp'].get('group') or vocab[m]['cmp'].get('slug')) != g['slug']]
        # slug 与线上已有表同名 → 上面那句会把它当成"本工具上一轮落的"放行，于是**原地覆盖**。
        # 覆盖我们自己的产出没问题（重跑幂等）；覆盖**别人手写/更早的旧表**是另一件事：
        # 只写载体那一张卡，同组其余成员卡上的旧拷贝不会清，段末显示新表、点开旧成员卡还是老表。
        # 批次 5 的 curse-swear 就是这么差点静默上线的（旧表里「swear to do」零书证）。
        for m in g['members']:
            old = (vocab.get(m) or {}).get('cmp')
            if isinstance(old, dict) and (old.get('group') or old.get('slug')) == g['slug'] \
                    and str(old.get('title') or '').strip() != clean_text(g['title']).strip():
                all_errs.append(f'WARN ⚠覆盖 {f} 组{g["idx"]}: slug {g["slug"]} 与 {m} 卡上已有表同名但**内容不同** → '
                                f'本次只覆盖载体那一张，其余成员卡上的旧表会留着继续给学生看；'
                                f'要先清旧表或改 slug，别静默落')
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
    soft = [e for e in all_errs if e.startswith('WARN')]
    loud = [e for e in soft if e.startswith('WARN ⚠')]     # 会改到线上已有内容的，一条都不许被 20 行上限挤掉
    quiet = [e for e in soft if e not in loud]
    print(f'\n错误 {len(hard)} 条 / 提醒 {len(soft)} 条')
    for e in hard:
        print('  ' + e)
    for e in loud:
        print('  ' + e)
    for e in quiet[:20]:
        print('  ' + e)
    if len(quiet) > 20:
        print(f'  …另有 {len(quiet) - 20} 条提醒')

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
        note = {'type': 'compare', 'group': g['slug'], 'title': clean_text(g['title']),
                'items': [{k: clean_text(v) for k, v in it.items() if v} for it in g['items']],
                'diff': [{k: (clean_text(v) if isinstance(v, str) else v) for k, v in row.items()}
                         for row in g['diff']],
                'summary': clean_text(f"辨析：{g['summary_line']} 简单记：{g['line']}"),
                'at': g['at']}
        vocab[g['carrier']]['cmp'] = note   # 写 cmp，不写 note —— note 是句下要显示的同义词/词伙串
    tmp = VOCAB + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(vocab, f, ensure_ascii=False, separators=(',', ':'))
    os.replace(tmp, VOCAB)
    print(f'已写 vocab.json：{before} → {len(vocab)} 词头，新增/覆盖 {len(cards)} 张辨析卡')

    # SHADOW_DATA_VER：直接调 validate_data 的那个函数（同一份文件清单、同一个摘要配方）
    ver = shadow_data_ver()
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
