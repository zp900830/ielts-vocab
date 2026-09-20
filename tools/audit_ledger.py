#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""门禁 2 汇总表：把四份审核报告没覆盖的「宽度」一项用当前机检口径重算。

为什么单独一个脚本：审核代理跑的时候 `validate_data.py._width` 还是「只有汉字计 1」，
2026-09-20 我把全角标点也提成了 1（收紧）。同一行现在会量出更大的数，
所以审计报告里写着「OK 40.0」的行，落地时可能被新口径拦下 —— 必须重算，不能沿用。

只读，不改任何草稿。
"""
import json
import re
import sys
import glob
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
from width_rule import width as _width   # noqa: E402  一把尺：口径只在 tools/width_rule.py 里改（≤40 = 手机上两行以内）

# 各切片作者用了三种小标题写法（### 默认显示的那一行 / ### 默认那一行 / **默认那一行**），
# 落地前要把 42 组一次性量齐，所以三种都要认，否则会误报"这组没写默认行"。
LINE_RE = re.compile(r'^(?:#{2,6}\s+|\*\*)[^#]*默认')
SUM_RE = re.compile(r'^(?:#{2,6}\s+|\*\*)[^#]*总结句')


def parse(md):
    """返回 [{group, line, line_width, claimed, summary, sum_width, sum_claimed}]"""
    out, cur = [], None
    lines = md.split('\n')
    i = 0
    while i < len(lines):
        ln = lines[i]
        g = re.match(r'^##\s+(组\s*\d+.*)$', ln)
        if g:
            cur = {'group': re.sub(r'\s+｜.*$', '', g.group(1)).strip(),
                   'line': None, 'summary': None, 'claimed': None, 'sum_claimed': None}
            out.append(cur)
            i += 1
            continue
        # 「## 附：切片 06 复核索引」这类二级标题不是组，必须把上一组关掉 ——
        # 不关的话附录里的「默认那一行」会被算进最后一组，量出一条 58.5 的假超限。
        if re.match(r'^##\s', ln) and not g:
            cur = None
        if cur is None:
            i += 1
            continue
        if LINE_RE.match(ln):
            m = re.search(r'宽度\s*([\d.]+)', ln)
            cur['claimed'] = float(m.group(1)) if m else None
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1
            if j < len(lines) and lines[j].strip().startswith('```'):
                j += 1
                body = []
                while j < len(lines) and not lines[j].strip().startswith('```'):
                    body.append(lines[j])
                    j += 1
                cur['line'] = '\n'.join(body).strip()
            elif j < len(lines):
                cur['line'] = lines[j].strip().lstrip('> ').strip()
            i = j + 1
            continue
        if SUM_RE.match(ln):
            m = re.search(r'宽度\s*([\d.]+)', ln)
            cur['sum_claimed'] = float(m.group(1)) if m else None
            body = []
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1
            while j < len(lines) and lines[j].strip() and not lines[j].startswith('#'):
                body.append(lines[j].strip().lstrip('> ').strip())
                j += 1
            cur['summary'] = ' '.join([b for b in body if b])
            i = j
            continue
        i += 1
    return out


def main(paths):
    bad, rows = [], []
    for p in paths:
        with open(p, encoding='utf-8') as f:
            md = f.read()
        for g in parse(md):
            lw = _width(g['line'] or '')
            sw = _width(g['summary'] or '')
            g['w'] = lw
            g['sw'] = sw
            g['file'] = os.path.basename(p)
            rows.append(g)
            if not g['line']:
                bad.append((g['file'], g['group'], 'no-line', 0, 40))
            if g['summary'] is None:
                bad.append((g['file'], g['group'], 'no-summary', 0, 30))
            if lw > 40:
                bad.append((g['file'], g['group'], 'line>40', lw, 40))
            if sw > 30:
                bad.append((g['file'], g['group'], 'sum>30', sw, 30))
    print(f'扫描 {len(paths)} 份草稿 / {len(rows)} 组')
    print(f'按当前机检口径（汉字+全角标点=1）超限的组数：{len(bad)}\n')
    for f, grp, kind, w, cap in bad:
        print(f'  {f} · {grp} · {kind} · {w} > {cap}')
    over40 = [r for r in rows if r['w'] > 40]
    print('\n--- 明细（超限行原文）---')
    for r in over40:
        print(f'\n[{r["file"]} {r["group"]}] 标称 {r["claimed"]} / 现口径 {r["w"]}')
        print(f'  {r["line"]}')
    print('\n--- 标称 vs 现口径 差值最大的 12 组（默认行）---')
    diff = [r for r in rows if r['claimed'] is not None]
    diff.sort(key=lambda r: r['w'] - r['claimed'], reverse=True)
    for r in diff[:12]:
        flag = 'OVER' if r['w'] > 40 else '    '
        print(f'  {flag} {r["file"]} {r["group"][:28]:30s} 标称 {r["claimed"]:5.1f} → 现 {r["w"]:5.1f} (Δ{r["w"]-r["claimed"]:+.1f})')
    return 1 if bad else 0


if __name__ == '__main__':
    args = sys.argv[1:] or sorted(glob.glob(os.path.join(ROOT, 'work', '辨析草稿', '2_*.md')))
    sys.exit(main(args))
