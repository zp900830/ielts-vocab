#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把子代理提交的句子级改写（tools/…find-chN.json 聚合出的 all_findings.json）安全落地。

为什么必须有一道校验，而不是直接套用：本仓库现在的课文就是"代理生成、无人复验"留下的。
代理交回的是**剥掉 [[key:disp]] 标记的裸英文**，直接回填会丢高亮、会漏目标词、会引入超纲词。

四条硬校验，任一不过就整条拒绝并记录原因：
  1 标记守恒 —— 原句每个目标词都要能在新句里重新定位到（含变形），一个都不能少；
  2 词汇合规 —— 新句除目标词外，每个词都要落在简单词白名单里（tools/data/simple_word_tags.tsv）；
  3 结构不变 —— 全书句子总数不变（就地改写，不插句，本地进度序号不会错位）；
  4 译文配对 —— 改了英文必须同时给出新的中文。

另：同一句被多个代理给了不同改写 → 判为冲突，不自动决断，只记出来。

用法：python3 tools/apply_sentence_fixes.py /tmp/tqa/all_findings.json            # 干跑，出报告
      python3 tools/apply_sentence_fixes.py … --apply --only "wrong,high"
"""
import json
import re
import sys
import collections

ROOT = '.'
SECTIONS = ROOT + '/shadow/data/sections.json'
WHITELIST = ROOT + '/tools/data/simple_word_tags.tsv'
WORD = re.compile(r"[A-Za-z][A-Za-z'’-]*")
MARK = re.compile(r'\[\[([^\]:]+):([^\]]+)\]\]')


def load_simple():
    s = set()
    with open(WHITELIST, encoding='utf-8') as f:
        for ln in f:
            if ln.startswith('#') or not ln.strip():
                continue
            s.add(ln.split('\t')[0].strip().lower())
    return s


def surface_forms(key):
    """只从词典词头「向上」生成词形。反方向（把正文词往下裁）会把 with 判成 wither 的变形。"""
    k = key.lower()
    f = {k, k + 's', k + 'es', k + 'd', k + 'ed', k + 'ing', k + 'er', k + 'est'}
    if k.endswith('e'):
        f |= {k + 'd', k[:-1] + 'ing', k[:-1] + 'ed'}
    if k.endswith('y') and len(k) > 2:
        f |= {k[:-1] + 'ies', k[:-1] + 'ed', k[:-1] + 'ing', k[:-1] + 'er', k[:-1] + 'est'}
    if len(k) > 3 and k[-1] not in 'aeiouwy' and k[-2] in 'aeiou' and k[-3] not in 'aeiou':
        f |= {k + k[-1] + 'ing', k + k[-1] + 'ed'}
    return f


def remark(new_en, keys, V):
    """把新句里的目标词重新包上 [[key:disp]]；找不到就返回 None。"""
    out = new_en
    placed = 0
    for key in keys:
        forms = surface_forms(key)
        hit = None
        for m in WORD.finditer(out):
            w = m.group(0).lower()
            if w in forms and (w != key.lower() or key.lower() in V):
                hit = m
                break
        if not hit:
            return None, None
        disp = out[hit.start():hit.end()]
        out = out[:hit.start()] + '[[%s:%s]]' % (key, disp) + out[hit.end():]
        placed += 1
    return out, placed


NAMES = set('''lin mei leo sam ana ken bo lars maya mina xiaoyu yu grandma grandpa father mother
mom mum peter tom mary anna alice bob carl joe wu chen wang li zhang zhao su ding feng gao
britain england london oxford china asian african european atlantic antarctic arctic pacific
earth moon sun mars jupiter saturn vedah elnino nordic indian arctic
''' .split())


def candidates(w):
    """把正文词往下还原成可能词头（只还原正文词本身，不从词典词向下裁）。"""
    w = re.sub(r"['’]s$", '', w)
    w = re.sub(r"['’]$", '', w)
    out = {w}
    for suf in ('s', 'es', 'ed', 'd', 'ing', 'ly', 'er', 'est', 'tion', 'ment'):
        if w.endswith(suf) and len(w) - len(suf) >= 2:
            b = w[:-len(suf)]
            out |= {b, b + 'e'}
            if len(b) > 1 and b[-1] == b[-2]:
                out.add(b[:-1])
    if w.endswith('ies') and len(w) > 4:
        out.add(w[:-3] + 'y')
    if w.endswith('ied') and len(w) > 4:
        out.add(w[:-3] + 'y')
    if w.endswith('ing') and len(w) > 5:
        out |= {w[:-3], w[:-3] + 'e', w[:-4] if len(w) > 5 else w}
    return {c for c in out if c}


def hard_words(new_en, keys, simple, V, orig_allow=frozenset()):
    """除目标词外，落在白名单之外的词。大写且不在句首的词按专有名词放行。"""
    tf = set()
    for k in keys:
        tf |= surface_forms(k)
    vis = re.sub(r'\[\[[^\]:]+:([^\]]+)\]\]', r' \1 ', new_en)
    bad = []
    for i, m in enumerate(WORD.finditer(vis)):
        raw = m.group(0)
        w = raw.lower()
        if len(w) < 3 or w in ('a', 'an', 'the'):
            continue
        if raw[0].isupper() and (i > 0 or raw.lower() in NAMES):
            continue          # 专有名词（句首除外，避免把普通词首字母大写蒙过去）
        if raw.lower() in NAMES:
            continue
        if w in simple or w in tf or w in V:
            continue
        if any(w in surface_forms(k) for k in keys):
            continue
        if candidates(w) & simple:
            continue
        if w in orig_allow or (candidates(w) & orig_allow):
            continue          # 原句里本来就有的词，不算「把词汇改难」
        bad.append(w)
    return sorted(set(bad))


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else '/tmp/tqa/all_findings.json'
    do_apply = '--apply' in sys.argv
    only = None
    if '--only' in sys.argv:
        only = set(sys.argv[sys.argv.index('--only') + 1].split(','))
    findings = json.load(open(src, encoding='utf-8'))
    D = json.load(open(SECTIONS, encoding='utf-8'))
    V = {k.lower() for k in json.load(open(ROOT + '/shadow/data/vocab.json', encoding='utf-8'))}
    simple = load_simple()
    flat = [(ci, si, k) for ci, c in enumerate(D) for si, pp in enumerate(c['paragraphs']) for k in range(len(pp))]

    # 先算出每条改写属于哪一层、哪个优先级
    def rank(r):
        sev = {'wrong': 0, 'awkward': 1, 'minor': 2}.get(r.get('severity'), 3)
        conf = {'high': 0, 'medium': 1, 'low': 2}.get(r.get('confidence'), 3)
        return sev * 3 + conf

    bygi = collections.defaultdict(list)
    for r in findings:
        bygi[r['gi']].append(r)

    en_fix, zh_fix, conflicts, rejected, accepted = {}, {}, [], [], []
    for gi, lst in bygi.items():
        ci, si, k = flat[gi]
        orig = D[ci]['paragraphs'][si][k]
        keys = [m.group(1).lower() for m in MARK.finditer(orig)]
        e = [r for r in lst if r['layer'] == 'en' and (r.get('fix_en') or '').strip()]
        if only:
            e = [r for r in e if r.get('severity') in only]
        if len({(r.get('fix_en') or '').strip() for r in e}) > 1:
            conflicts.append((gi, [r.get('fix_en')[:48] for r in e]))
            continue
        if e:
            en_fix[gi] = e[0]
        else:
            z = [r for r in lst if r['layer'] == 'zh' and (r.get('fix_zh') or '').strip()]
            if len({(r.get('fix_zh') or '').strip() for r in z}) > 1:
                conflicts.append((gi, ['<zh>' + (r.get('fix_zh') or '')[:40] for r in z]))
                continue
            if z:
                zh_fix[gi] = z[0]

    for gi, r in sorted(en_fix.items()):
        ci, si, k = flat[gi]
        orig = D[ci]['paragraphs'][si][k]
        keys = [m.group(1).lower() for m in MARK.finditer(orig)]
        new = (r.get('fix_en') or '').strip()
        zh = (r.get('fix_zh') or '').strip()
        if not new or not zh:
            rejected.append((gi, '缺英文或配对中文'))
            continue
        if new == re.sub(MARK, r'\2', orig):
            rejected.append((gi, '改写与原文相同'))
            continue
        marked, n = remark(new, keys, V)
        if marked is None:
            rejected.append((gi, f'目标词在新句里找不到（{len(keys)} 个要求全保留）'))
            continue
        # 往返校验：把重新加上的标记剥掉，必须与代理给的句子逐词相同；
        # 否则说明标记挂错了位置（同一词出现两次、或匹配到另一个同形词）
        back = re.sub(r'\[\[[^\]:]+:([^\]]+)\]\]', r'\1', marked).lower()
        back = re.sub(r'[^a-z0-9 ]+', ' ', back)
        want = re.sub(r'[^a-z0-9 ]+', ' ', new.lower())
        if ' '.join(back.split()) != ' '.join(want.split()):
            rejected.append((gi, '标记回填后与改写句不一致（可能挂错位置）'))
            continue
        if sorted(k for m in MARK.finditer(marked) for k in [m.group(1).lower()]) != sorted(keys):
            rejected.append((gi, '标记词集不守恒'))
            continue
        orig_vis = {t.lower() for t in WORD.findall(re.sub(MARK, r'\2', orig))}
        orig_allow = set(orig_vis)
        for t in orig_vis:
            orig_allow |= candidates(t)
        bad = hard_words(marked, keys, simple, V, frozenset(orig_allow))
        if bad:
            rejected.append((gi, '引入非简单词 ' + ','.join(bad[:5])))
            continue
        ow, nw = len(re.sub(MARK, ' ', orig).split()), len(new.split())
        if nw < ow * 0.5 or nw > ow * 1.9:
            rejected.append((gi, f'句长变化过大 {ow}→{nw} 词'))
            continue
        accepted.append((gi, r, marked, zh))
    for gi, r in sorted(zh_fix.items()):
        accepted.append((gi, r, None, (r.get('fix_zh') or '').strip()))

    print(f'句子级改写：候选 {sum(len(v) for v in bygi.values())} 条 findings → 通过 {len(accepted)}，拒绝 {len(rejected)}，冲突 {len(conflicts)}')
    reason = collections.Counter(x[1].split('（')[0].split(' ')[0] for x in rejected)
    for kk, v in reason.most_common():
        print(f'  拒绝原因 {kk}: {v}')
    for gi, why in rejected[:25]:
        print(f'    #{gi}: {why}')
    for gi, lst in conflicts[:10]:
        print(f'    冲突 #{gi}: {len(lst)} 个不同改写')
    print('\n通过样例：')
    for gi, r, marked, zh in accepted[:8]:
        ci, si, k = flat[gi]
        old_vis = MARK.sub(lambda m: m.group(2), D[ci]['paragraphs'][si][k])
        new_vis = MARK.sub(lambda m: m.group(2), marked) if marked else '(仅改中文)'
        print('  #%d [%s/%s] %s' % (gi, r.get('severity'), r.get('confidence'), r.get('layer')))
        print('     旧 EN %s' % old_vis[:88])
        print('     新 EN %s' % new_vis[:88])
        print('     旧 ZH %s' % D[ci]['sentZh'][si][k][:44])
        print('     新 ZH %s' % zh[:44])

    if not do_apply:
        print('\n（干跑，未写文件。加 --apply 才落地）')
        json.dump([{'gi': gi, 'layer': r.get('layer'), 'marked': marked, 'zh': zh} for gi, r, marked, zh in accepted],
                  open('/tmp/tqa/appliable.json', 'w', encoding='utf-8'), ensure_ascii=False)
        json.dump([{'gi': gi, 'why': w} for gi, w in rejected], open('/tmp/tqa/rejected.json', 'w', encoding='utf-8'),
                  ensure_ascii=False)
        return 0

    for gi, r, marked, zh in accepted:
        ci, si, k = flat[gi]
        if marked:
            D[ci]['paragraphs'][si][k] = marked
        D[ci]['sentZh'][si][k] = zh
    total = sum(len(p) for c in D for p in c['paragraphs'])
    assert total == len(flat), f'句子总数变了 {len(flat)}→{total}'
    json.dump(D, open(SECTIONS, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(f'已落地 {len(accepted)} 句，句子总数仍为 {total}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
