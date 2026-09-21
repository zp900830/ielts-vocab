#!/usr/bin/env python3
"""门禁 1（机械）：辨析草稿里每一条**声称有出处**的英文串，必须在数据原文里查得到。

用法：python3 tools/check_compare_draft.py work/…草稿.md [更多.md]
退出码 0 = 全部可回溯；1 = 有串查不到（草稿必须改：换成人话描述，或补真出处）。

口径（与批次 1 的手工终检一致）：
- 课文里的 [[词头:表面形式]] 会切断连续文本，所以先把标记拆成「表面形式」与「词头 表面形式」两种变体再查。
- 反例不算缺串：同一行带「没有 / 查不到 / 不出现 / 一处都 / 禁 / ×」这类否定语气的，作者是在说
  "这个写法不成立"，本来就不该在语料里找到。
- 字段名、文件名、音标、纯数字、带省略号的举例模板跳过。
"""
import re, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPAN = re.compile(r'`([^`]+)`')
MARK = re.compile(r'\[\[([^\]:"\n]+):([^\]"]+)\]\]')          # 课文里的 [[词头:表面形式]]，见 sec_variants 的说明
CJK = re.compile(r'[一-鿿]')
IPA = re.compile(r'^/[^一-鿿]*/$|^\[.+\]$')
NEG = re.compile(r'没有|不含|不出现|未出现|查不到|找不到|一处都|都不|不成立|不写|因此不|禁|不存在|×|✗|误写|不能说|不说|无此|不是')
# 元信息不是引文：代码片段、文件路径、grep 命令、等式（at dawn = at sunrise 这类"能替换"的断言）
META = re.compile(r"[{}\[\]()<>|=|/]|^(grep|python|node|git|TASK|ShadowPlan)\b|\\'")
SKIP = re.compile(r'^(m|ex|exZh|note|title|items|diff|summary|sense|core|eg|scene|paraZh|sentZh|type|words|'
                  r'sents|paras|all_synonyms|subheads|paragraphs|w|p|pos|label|.*\.json.*|.*\.md.*|\d+|'
                  r'd\.|v\.|n\.|adj\.|adv\.|phrase|pl\.|sing\.|abbr\.|US|UK)$', re.I)


def sec_variants(raw):
    """课文原文的三种查法：原样 + 标记拆成「表面形式」+ 标记拆成「词头 表面形式」。

    正则必须排除 `"` 与换行：JSON 里段落数组开头就是字面 `[[`，紧跟换行和引号，
    旧写法 `[^\\]:]+` 会把这个 `[[` 当成标记起点、一路吞到本章第一句里的第一个真标记，
    于是**每章第一句**（全局句号 0 / 339 / 651 / 883 / 1277 / 1492）整句永远查不到 ——
    门禁 1 会逼作者「别整句引用」，把真书证绕成没法核的形式。
    """
    return [raw,
            re.sub(MARK, r'\2', raw),
            re.sub(MARK, r'\1 \2', raw)]


def haystack():
    out = []
    for name in ('shadow/data/sections.json', 'shadow/data/vocab.json'):
        raw = open(os.path.join(ROOT, name), encoding='utf-8').read()
        out += sec_variants(raw)
    return ' \n '.join(out).lower()


PATH = re.compile(r'\S/\S|\.(md|json|py|ts|js)\b', re.I)     # 路径 / 文件名
KV = re.compile(r'[:=]')                                        # key: value、a = b 这类断言，不是引文


def units(s):
    if '…' in s or '...' in s or PATH.search(s) or KV.search(s):
        return []
    keep = []
    for p in re.split(r'\s*[／/、；;]\s*|\s+或\s+|\s+OR\s+', s):
        p = p.strip().strip('.,:;!?·—-()"\'')
        if len(p) < 3 or CJK.search(p) or SKIP.match(p) or IPA.match(p) or META.search(p):
            continue
        keep.append(p.lower())
    return keep


def check(path, hay):
    bad, seen = [], set()
    for line in open(path, encoding='utf-8'):
        if NEG.search(line):
            continue
        for raw in SPAN.findall(line):
            for u in units(raw.strip()):
                if u in seen:
                    continue
                seen.add(u)
                if u not in hay:
                    bad.append((line.strip()[:80], raw.strip()))
    return bad


def main():
    files = [a for a in sys.argv[1:] if a.endswith('.md')]
    if not files:
        print(__doc__); return 2
    hay = haystack()
    total = 0
    for f in files:
        bad = check(f, hay)
        total += len(bad)
        print(('OK   ' if not bad else 'FAIL ') + os.path.basename(f) + ('' if not bad else '  ← %d 条查不到' % len(bad)))
        for where, s in bad[:25]:
            print('       缺: %-44r 行: %s' % (s, where))
        if len(bad) > 25:
            print('       …另有 %d 条' % (len(bad) - 25))
    print('\n门禁 1:', 'PASSED（全部英文串可回溯）' if not total else 'FAILED（%d 条查无出处）' % total)
    return 0 if total == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
