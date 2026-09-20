#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把辨析草稿统一成一种版式，让落地器只认一种形状、让宽度没有一个组被漏量。

为什么必须做：1B 用 `## 3. grand / magnificent` 编号，别的文件用 `## 组 8 · …`。
按 `^## 组` 量宽度的脚本于是**静默跳过了 1B 的 3 个组** —— 那 3 条默认行从来没被量过。
"没量到"比"量出超限"危险得多，因为它看起来是全绿。

三件事，只做这三件：
  1. 组标题统一成 `## 组 <worklist_idx> · a / b —— 共享主题`（编号靠 --start-idx 显式给，不猜）
  2. 差异表统一成宽表 `| 维度 | a | b |`：长表 `| 维度 | 词 | 常见搭配 | 用在哪 | 一句话区别 |`
     按「维度」转置；一个维度出 2–3 行，标签 `维度`（放一句话区别）/ `维度 · 搭配` / `维度 · 用在哪`。
     —— 批次 1A 本来就是宽表，所以这不是新发明，是把批次 2 拉齐到他点头的那个形状。
  3. 用 tools/width_rule 复算并改写标称宽度。**只改数字，一个字都不改内容。**

超限行只报告、不自动删字（删哪几个字是口味判断，归作者/审核）。

默认 dry-run 打印将要做的事；--write 才落盘。
"""
import argparse
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from width_rule import width, LINE_CAP, SUM_CAP  # noqa: E402

LONG_COLS = [('常见搭配', '搭配'), ('用在哪', '用在哪'), ('一句话区别', '区别')]


def cells(line):
    return [c.strip() for c in line.strip().strip('|').split('|')]


def is_sep(line):
    return bool(line) and set(line.replace('|', '').strip()) <= set('-: ')


def find_long_table(lines, a, b):
    """→ (head_idx, rows[], header) 若该段里是长表；否则 None"""
    i = a
    while i < b:
        if lines[i].lstrip().startswith('|'):
            head = cells(lines[i])
            rows, j = [], i + (2 if is_sep(lines[i + 1]) else 1)
            while j < b and lines[j].lstrip().startswith('|'):
                rows.append(cells(lines[j]))
                j += 1
            if len(head) >= 3 and head[1] in ('词', '*词*') and rows and len(rows[0]) == len(head):
                return i, rows, head
            i = j
            continue
        i += 1
    return None


def find_wide_table(lines, a, b):
    i = a
    while i < b:
        if lines[i].lstrip().startswith('|'):
            head = cells(lines[i])
            if head and head[0].startswith('维度') and len(head) >= 3:
                return i, head
            i += 1
            continue
        i += 1
    return None


def long_to_wide(rows, head):
    """长表 → 宽表。返回 (词序[], 新表 rows[label, w1, w2, …])。信息一条不丢、一条不加。"""
    col = {}
    for k, name in enumerate(head):
        for key, tag in LONG_COLS:
            if key in name:
                col[tag] = i0 = k
        if name.startswith('维度'):
            col['label'] = k
    order, bydim = [], {}
    for r in rows:
        dim = r[col['label']].strip('*').strip()
        w = r[next(k for k, n in enumerate(head) if n.strip('*`') not in ('维度',) and k != col['label'])] \
            if False else None
        # 「词」列固定第 2 列（find_long_table 已保证 head[1] 是「词」）
        w = r[1].strip('*`').strip().lower()
        if w not in order:
            order.append(w)
        bydim.setdefault(dim, {})
        if '区别' in col and col['区别'] < len(r):
            bydim[dim].setdefault('区别', {})[w] = r[col['区别']]
        if '搭配' in col and col['搭配'] < len(r):
            bydim[dim].setdefault('搭配', {})[w] = r[col['搭配']]
        if '用在哪' in col and col['用在哪'] < len(r):
            bydim[dim].setdefault('用在哪', {})[w] = r[col['用在哪']]
    out = []
    for dim, buckets in bydim.items():
        for tag in ('区别', '搭配', '用在哪'):
            if tag not in buckets:
                continue
            label = dim if tag == '区别' else f'{dim} · {tag}'
            out.append([label] + [buckets[tag].get(w, '').strip() for w in order])
    return order, out


def is_group_head(ln):
    """`## 组 8 · a / b` 或 `## 3. a / b —— 主题`。
    不认 `## 0. 我用了哪些字段`（那是文件头的口径说明，不是组）—— 认错的代价是
    报一堆"缺默认小节"的假红灯，把真缺口淹掉。"""
    if re.match(r'^##\s+组\s*\d+', ln):
        return True
    m = re.match(r'^##\s+\d+\.\s+(.*)$', ln)
    return bool(m) and re.search(r'[A-Za-z][A-Za-z\- ]*\s*/\s*[A-Za-z]', m.group(1))


def group_spans(lines):
    marks = [i for i, ln in enumerate(lines) if is_group_head(ln)]
    spans = []
    for k, i in enumerate(marks):
        end = marks[k + 1] if k + 1 < len(marks) else len(lines)
        for j in range(i + 1, end):
            if re.match(r'^##\s', lines[j]) and j != i:
                end = j
                break
        spans.append((i, end))
    return spans


def rewrite_width(md, report):
    """把「实测宽度 X」和「≤40 / ≤30」按唯一尺子重算。只动数字。"""
    lines = md.split('\n')
    for a, b in group_spans(lines):
        head = lines[a]
        dim = re.sub(r'^##\s+', '', head)[:34]
        for kind, cap in (('默认', LINE_CAP), ('总结句', SUM_CAP)):
            idx = None
            for i in range(a + 1, b):
                if re.match(r'^(?:#{2,6}\s+|\*\*)[^#]*' + kind, lines[i]):
                    idx = i
                    break
            if idx is None:
                report.append(f'缺「{kind}」小节  ← {dim}')
                continue
            body = None
            j = idx + 1
            while j < b and not lines[j].strip():
                j += 1
            if kind == '默认':
                if j < b and lines[j].strip().startswith('```'):
                    k = j + 1
                    buf = []
                    while k < b and not lines[k].strip().startswith('```'):
                        buf.append(lines[k])
                        k += 1
                    body = '\n'.join(buf).strip()
                else:
                    report.append(f'「默认」小节后面不是代码围栏，量不到  ← {dim}')
                    continue
            else:
                buf = []
                while j < b and lines[j].strip() and not lines[j].startswith('#'):
                    buf.append(lines[j].strip().lstrip('>').strip())
                    j += 1
                body = ' '.join([x for x in buf if x])
            if not body:
                report.append(f'「{kind}」是空的  ← {dim}')
                continue
            got = width(body)
            old = re.search(r'(\d+(?:\.\d+)?)', lines[idx].split('宽度')[-1]) if '宽度' in lines[idx] else None
            new = re.sub(r'\d+(?:\.\d+)?(?=\s*[）)/])', f'{got:.1f}', lines[idx]) \
                if old else f'{lines[idx]}（实测宽度 {got:.1f}）'
            if new != lines[idx]:
                report.append(f'宽度改写 {old.group(1) if old else "—"}→{got:.1f}  {kind}  ← {dim}')
                lines[idx] = new
            if got > cap:
                report.append(f'★超限 {got:.1f}>{cap} {kind}（要改文本，不改数字）← {dim}\n    {body}')
    return '\n'.join(lines)


def normalize_headings(md, start_idx, fname, report):
    """`## 3. a / b` → `## 组 <start+offset> · a / b`"""
    lines = md.split('\n')
    n = 0
    for i, ln in enumerate(lines):
        m = re.match(r'^##\s+(\d+)\.\s+(.*)$', ln)
        if not m:
            continue
        idx = int(m.group(1)) - 1 + start_idx
        lines[i] = f'## 组 {idx} · {m.group(2)}'
        report.append(f'标题统一 #{m.group(1)}→组 {idx}  ← {fname}')
        n += 1
    return '\n'.join(lines), n


def convert_tables(md, report):
    lines = md.split('\n')
    for a, b in group_spans(lines):
        seg = '\n'.join(lines[a:b])
        if '差异维度表' not in seg and '差异' not in seg.split('\n')[0]:
            hit = None
            for i in range(a, b):
                if '差异' in lines[i] and lines[i].lstrip().startswith(('#', '*')):
                    hit = i
                    break
            if hit is None:
                report.append(f'找不到差异表小节  ← {re.sub(r"^##\s+", "", lines[a])[:34]}')
                continue
        got = find_long_table(lines, a, b)
        if not got:
            if not find_wide_table(lines, a, b):
                report.append(f'差异表既不是长表也不是宽表  ← {re.sub(r"^##\s+", "", lines[a])[:34]}')
            continue
        hi, rows, head = got
        order, wide = long_to_wide(rows, head)
        if not order:
            report.append(f'长表里没认出词  ← {re.sub(r"^##\s+", "", lines[a])[:34]}')
            continue
        new = ['| 维度 | ' + ' | '.join(order) + ' |', '|' + '---|' * (len(order) + 1)]
        for r in wide:
            new.append('| ' + ' | '.join(r) + ' |')
        # 丢掉原来的「维度/词/…」表头与分隔行
        old_len = 1 + (1 if hi + 1 < b and is_sep(lines[hi + 1]) else 0) + len(rows)
        report.append(f'长表→宽表 {len(rows)} 行 → {len(wide)} 行 × {len(order)} 列  '
                      f'← {re.sub(r"^##\s+", "", lines[a])[:34]}')
        lines[hi:hi + old_len] = new
    return '\n'.join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('paths', nargs='+')
    ap.add_argument('--write', action='store_true')
    ap.add_argument('--start-idx', type=int, default=None,
                    help='该文件的第 1 组对应哪个 worklist_idx（只给用 `## 1.` 编号的文件）')
    ap.add_argument('--skip-tables', action='store_true', help='只做标题与宽度，不动差异表')
    args = ap.parse_args()

    total = 0
    for p in args.paths:
        md = open(p, encoding='utf-8').read()
        report = []
        before = len(re.findall(r'^##\s+组\s*\d+', md, re.M))
        out = md
        if args.start_idx:
            out, _ = normalize_headings(out, args.start_idx, os.path.basename(p), report)
        if not args.skip_tables:
            out = convert_tables(out, report)
        out = rewrite_width(out, report)
        after = len(re.findall(r'^##\s+组\s*\d+', out, re.M))
        total += after
        print(f'\n### {os.path.basename(p)}：组数 {before} → {after}')
        for r in report:
            print('  ' + r)
        if out != md:
            if args.write:
                open(p, 'w', encoding='utf-8').write(out)
                print('  已写盘')
            else:
                print('  （dry-run，未写）')
    print(f'\n合计 {total} 组被量到')
    return 0


if __name__ == '__main__':
    sys.exit(main())
