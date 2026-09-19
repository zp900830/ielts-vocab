#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""按「竖栏裁切」提取 高频同义替换与学术词汇.pdf 的编号条目。

一页三栏，直接整页提取会把三栏挤在同一行、串行；这里对每栏单独裁切
（pdftotext -x/-W），每栏内部就是严格阅读顺序，再按「行首编号」切条目：
  · 行首是数字        → 新条目（编号、词面、音标、词性+中文）
  · 整行只有中文      → 小节标题（同义组的依据，如「增长」「简单的」）
  · 其余非空行        → 上一条目的折行续接（词面被排版本拆开时拼回去）
"""
import json
import re
import subprocess
import sys

PDF = '/Users/zhoupeng/Desktop/高频同义替换与学术词汇.pdf'
OUT = '/tmp/syn/gaopin_entries.json'
# 栏边界按编号词的实测 x 起点定：col1 编号≈40、col2≈280、col3≈540、页码≈800，
# 裁宽了会把下一栏的编号吞进上一条的释义里（第一版就是这么丢了 66–77 号）。
COLS = [(28, 248), (278, 254), (534, 262)]
HEAD = re.compile(r'^\s*(\d{1,3})\s+(.*)$')
IPA = re.compile(r'/[^/]*/?')
CJK = re.compile(r'[一-鿿]')
LAT = re.compile(r'[A-Za-z]')


def page_col_text(page, x, w):
    r = subprocess.run(['pdftotext', '-layout', '-f', str(page), '-l', str(page),
                        '-x', str(x), '-y', '0', '-W', str(w), '-H', '595', PDF, '-'],
                       capture_output=True, text=True)
    return r.stdout


def main():
    last = int(sys.argv[1]) if len(sys.argv) > 1 else 33
    entries, headers = [], []
    for page in range(3, last + 1):
        for ci, (x, w) in enumerate(COLS):
            grp = None
            cur = None
            for raw in page_col_text(page, x, w).splitlines():
                line = raw.rstrip()
                if not line.strip():
                    continue
                m = HEAD.match(line)
                if m:
                    cur = {'num': int(m.group(1)), 'page': page, 'col': ci,
                           'rest': m.group(2).strip(), 'group': grp}
                    entries.append(cur)
                    continue
                body = line.strip()
                if CJK.search(body) and not LAT.search(body) and not body.startswith(('/', '(')):
                    grp = re.sub(r'^[，,、\s]+|[，,、\s]+$', '', body)
                    headers.append({'page': page, 'col': ci, 'text': grp})
                    continue
                if cur is not None:
                    # 排版本把词面拆开时（concentratio / n），续行要无缝拼回去
                    cur['rest'] += body if re.fullmatch(r'[a-z]{1,3}', body) else ' ' + body
            # 栏与栏之间的小节标题不连续，换栏时清空
    for e in entries:
        rest = IPA.sub(' ', ' ' + e['rest'] + ' ')
        rest = re.sub(r'\s{2,}', ' ', rest).strip()
        g = re.match(r'^((?:adj|adv|n|v|vt|vi|prep|conj|pron|num|int)\.[^一-鿿]*)?(.*)$', rest)
        e['en'] = ''
        e['poszh'] = rest
        # 词面 = 开头的英文部分；后面接词性标记或中文即为释义
        mm = re.match(r"^([A-Za-z][A-Za-z'’.\- ]*?)(\s+(?:(?:adj|adv|n|v|vt|vi|prep|conj|pron|num)\.|[一-鿿]).*)$", rest)
        if mm:
            e['en'] = mm.group(1).strip()
            e['poszh'] = mm.group(2).strip()
        else:
            e['en'] = rest
        del e['rest']
    nums = sorted(e['num'] for e in entries)
    missing = sorted(set(range(nums[0], nums[-1] + 1)) - set(nums))
    dup = [n for n, c in __import__('collections').Counter(nums).items() if c > 1]
    json.dump({'entries': entries, 'headers': headers}, open(OUT, 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    print(f'条目 {len(entries)} | 编号 {nums[0]}–{nums[-1]} | 缺号 {len(missing)} {missing[:12]} | 重号 {len(dup)}')
    print(f'小节标题 {len(headers)} 个')
    for e in entries[:4] + [x for x in entries if x['num'] in (462, 467, 471, 537)][:4]:
        print(f"  {e['num']:>4} {e['en'][:24]:<24} {e['poszh'][:26]:<26} 组={e['group']}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
