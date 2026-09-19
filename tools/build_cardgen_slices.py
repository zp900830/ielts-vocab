#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""给词卡补齐生成「机械候选」，把子代理从「自由创作」降级成「做选择题」。

为什么这么改：上一轮 60% 错列的同义词，全部出自「让模型凭记忆生成、无人复验」。
凭记忆生成的错法是没规律的，而机械候选的错法是可枚举的（资料分组串了话题、
OCR 打错词、n-gram 截断在介词上），所以每条候选都带**来源标记**，
校验器按来源分级放行，审核代理只需要判「这两个词在这句里意思是否真的相通」。

来源标记
  M  两份同义替换资料成组（何琼等号 / 高频书中文释义相同）—— 最强的书面依据
  R  反向索引：别的卡片已经把它列为该词头的同义词（上一轮 530 张逐条裁决的产物）
  B  顾家北词伙书 OCR 里真实出现的搭配
  T  跟读篇课文原句里真实出现的搭配（其他词必须都是简单词）

只有 M/B 才算「有出处」。完全没有候选的词头单独标 noEvidence —— 按「不许凑数」口径，
默认不去凑，除非审核阶段另有依据。

输出 work/cardgen/cand.json + 每份可独立落地的送审表 work/cardgen/sheet-*.txt
"""
import json
import re
import sys
import collections

ROOT = '/Users/zhoupeng/Library/Mobile Documents/com~apple~CloudDocs/雅思背单词项目'
sys.path.insert(0, ROOT + '/tools')
import crosscheck_syn as CS  # noqa: E402
from validate_card_patch import pos_set, forms  # noqa: E402

CS.HE = ROOT + '/work/ref/heqiong.txt'
CS.GP = ROOT + '/work/ref/gaopin_entries.json'

PACKET = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6a', 'ch6b']
STOP = set('the a an to of in on for and or at by with is are be as it that this some any no our their his her you we they i he she there here'.split())
# 资料里「同小节」这条成组依据被刻意丢掉：小节是话题清单，会把 allergy↔trauma 并进来
SYN_SRC = ('何琼', '高频·同释义')
PREP = set('in on at by for with about from of into over under during through between among against toward upon like'.split())
FUNC_HARD = set("""the a an this that these those my your his her its our their me him us them it he she we they i you
who whom whose which what where when why how and but or nor so yet because since while if though although unless until
after before is are was were be been being am do does did have has had will would can could shall should may might must
not no yes to too very more most all both each few many much several some any own other another one two three first
second latter former there here""".split())
KNOWN_OK = set()          # text_colloc 里填充：目标词 ∪ 简单词，窗口内不许出现陌生词
BOOK_PAT = re.compile(r'^\s*(?:\d{1,2}[\.、]\s*)?([A-Za-z][A-Za-z\'’/&\- ]{2,44}?)\s+([\u4e00-\u9fa5][\u4e00-\u9fa5，、；。！？()0-9 ]{1,22})\s*$')


def norm(s):
    s = s.lower().strip().strip('.,;:，。 ')
    s = re.sub(r'\([^)]*\)', '', s)
    s = re.sub(r'^(the|a|an)\s+', '', s)
    s = s.replace('-', ' ').replace('’', "'")
    return re.sub(r'\s{2,}', ' ', s).strip()


def section_head(s):
    """[[oxygen:oxygen]] → oxygen；顺带把标记拆成普通词。"""
    return re.sub(r'\[\[([^\]:]+):[^\]]*\]\]', r'\1', s)


def load_wrong():
    """上一轮逐条裁决判为 wrong 的 (head → 被否词)，不许借资料复活。"""
    out = collections.defaultdict(set)
    for f in ('/tmp/tqa/syn-verdict-0.json', '/tmp/tqa/syn-verdict-1.json',
              ROOT + '/work/ref/syn_patch_verdicts.json'):
        try:
            rows = json.load(open(f, encoding='utf-8'))
        except OSError:
            continue
        if isinstance(rows, dict):
            rows = rows.get('rows') or rows.get('verdicts') or []
        for r in rows:
            if not isinstance(r, dict):
                continue
            head = str(r.get('head') or r.get('w') or '').lower()
            if not head:
                continue
            for w in r.get('wrong') or []:
                m = re.match(r'^\s*([A-Za-z][A-Za-z\'’ .-]*?)\s*[:：]', str(w))
                out[head].add(norm(m.group(1) if m else w))
    return out


def syn_groups():
    groups = [g for g in CS.load_he() if g['src'] in SYN_SRC]
    gp, _ = CS.load_gp()
    groups += [g for g in gp if g['src'] in SYN_SRC]
    cand = collections.defaultdict(collections.Counter)
    for g in groups:
        uniq = list(dict.fromkeys(norm(x) for x in g['items'] if x))
        for h in uniq:
            for o in uniq:
                if o != h:
                    cand[h][o] += 1
    return cand


def reverse_syn(V):
    cand = collections.defaultdict(collections.Counter)
    for k, e in V.items():
        n = e.get('note')
        if not isinstance(n, str):
            continue
        m = re.search(r'同义词：([^\n；]+)', n)
        if not m:
            continue
        for s in m.group(1).split(','):
            s = norm(s)
            if s and s != norm(k):
                cand[s][norm(k)] += 1
    return cand


def book_colloc():
    """书侧搭配：词面必须全部已知（OCR 错词整条丢），返回 词头 → 搭配计数。"""
    V = json.load(open(ROOT + '/shadow/data/vocab.json', encoding='utf-8'))
    B = {str(r[1]).lower() for r in json.load(open(ROOT + '/data/book.json', encoding='utf-8'))
         if isinstance(r, list) and len(r) > 1}
    simple = {l.split('\t')[0].strip().lower() for l in open(ROOT + '/tools/data/simple_word_tags.tsv', encoding='utf-8')
              if not l.startswith('#') and l.strip()}
    known = {norm(w) for w in (set(V) | B | simple)}
    # 词形 → 词头：书里写 "to reduce poverty" / "polluted air"，按原形精确匹配会整批漏掉
    fidx = collections.defaultdict(set)
    for k in V:
        for f in forms(norm(k)):
            fidx[f].add(norm(k))
    rows = collections.defaultdict(collections.Counter)
    for ln in open(ROOT + '/work/ref/gjb_book.txt', encoding='utf-8'):
        if ln.startswith('###'):
            continue
        m = BOOK_PAT.match(ln)
        if not m:
            continue
        c = norm(m.group(1))
        ws = [w for w in c.split() if w not in STOP]
        if len(c) < 4 or not ws or any(w not in known for w in ws):
            continue
        for w in c.split():
            for h in fidx.get(w, ()):
                rows[h][c] += 1
    return rows


def text_colloc(D):
    """课文原句里的搭配：以词头为锚点扩窗。

    闭类词（代词/助动词/限定词/连词）一个都不许进窗 —— 上一版只挡了两端，
    结果切出 "wind would aggravate"、"water and took an alternate" 这种从句碎块，
    喂给代理只会批量产出假词伙。介词允许，但只能紧贴词头、且整窗最多一个。
    """
    simple = {l.split('\t')[0].strip().lower() for l in open(ROOT + '/tools/data/simple_word_tags.tsv', encoding='utf-8')
              if not l.startswith('#') and l.strip()}
    V = json.load(open(ROOT + '/shadow/data/vocab.json', encoding='utf-8'))
    global KNOWN_OK
    KNOWN_OK = {norm(w) for w in V} | simple
    rows = collections.defaultdict(collections.Counter)
    for ch in D:
        fidx = collections.defaultdict(set)
        for h in ch.get('words', []):
            for f in forms(norm(h)):
                fidx[f].add(norm(h))
        for para in ch['paragraphs']:
            for s in para:
                toks = re.findall(r"[a-z'’]+", section_head(s).lower())
                for i, t in enumerate(toks):
                    for h in fidx.get(t, ()):
                        hf = forms(h)
                        L = i
                        while L - 1 >= 0 and i - L < 2 and ok_edge(toks[L - 1], hf, toks[i - 1:i]):
                            L -= 1
                        R = i
                        while R + 1 < len(toks) and R - i < 2 and ok_edge(toks[R + 1], hf, toks[R + 1:R + 2]):
                            R += 1
                        for st in range(max(L, i - 3), i + 1):
                            for en in range(i, min(R + 1, st + 5)):
                                w = toks[st:en + 1]
                                if not (2 <= len(w) <= 4):
                                    continue
                                if not ok_window(w, hf):
                                    continue
                                rows[h][' '.join(w)] += 1
    return rows


def ok_edge(tok, hf, ctx=()):
    """能不能往这个方向再吃一个词。"""
    if tok in hf:
        return True
    if tok in FUNC_HARD or len(tok) < 2:
        return False
    if tok in PREP:
        return len(ctx) == 0 or ctx[0] in hf      # 介词只能紧贴词头
    return tok in KNOWN_OK


def ok_window(w, hf):
    core = [x for x in w if x not in hf]
    if not core:
        return False
    if sum(1 for x in core if x in PREP) > 1:
        return False
    if any(x in FUNC_HARD for x in core):
        return False
    if w[0] in PREP or w[-1] in PREP:
        return False
    return all(x in KNOWN_OK or x in hf for x in w)


def cur_syn(V, h):
    n = (V.get(h) or {}).get('note')
    if not isinstance(n, str):
        return []
    m = re.search(r'同义词：([^\n；]+)', n)
    return [x.strip() for x in m.group(1).split(',')] if m else []


def cur_col(V, h):
    n = (V.get(h) or {}).get('note')
    if not isinstance(n, str):
        return []
    m = re.search(r'词伙：([^\n；]+)', n)
    return [x.strip() for x in m.group(1).split(',')] if m else []


def main():
    V = json.load(open(ROOT + '/shadow/data/vocab.json', encoding='utf-8'))
    D = json.load(open(ROOT + '/shadow/data/sections.json', encoding='utf-8'))
    allowed = {norm(k) for k in V}
    wrong = load_wrong()
    mat, rev = syn_groups(), reverse_syn(V)
    bc, tc = book_colloc(), text_colloc(D)
    pkt_of = {}
    for p in PACKET:
        try:
            rows = json.load(open(f'{ROOT}/work/cardgen/{p}.json', encoding='utf-8'))
        except OSError:
            print(f'!! 缺分包 {p}', file=sys.stderr)
            continue
        for r in rows:
            pkt_of.setdefault(norm(r['w']), p)

    want = {}
    for p in PACKET:
        try:
            rows = json.load(open(f'{ROOT}/work/cardgen/{p}.json', encoding='utf-8'))
        except OSError:
            continue
        for r in rows:
            h = norm(r['w'])
            want.setdefault(h, {'pkt': pkt_of.get(h, p), 'syn': False, 'col': False, 'syn_ext': False})
            want[h]['syn'] |= bool(r.get('need_syn'))
            want[h]['col'] |= bool(r.get('need_col'))

    # 补口径：分包只覆盖了「完全没有同义词段」的词头，漏掉了「有段但缺大半」那一整块
    # （排查报告里的 222 个）。这里按资料组重算一次，标记成 syn_ext 单独走合并式落地。
    for h in allowed:
        if want.get(h, {}).get('syn'):
            continue
        have = {CS.key(x) for x in cur_syn(V, h)}
        if not have:
            continue
        miss = [o for o in mat.get(h, collections.Counter()) if CS.key(o) not in have and o != h]
        if len(miss) >= 2:
            want.setdefault(h, {'pkt': pkt_of.get(h, 'ext'), 'syn': False, 'col': False})
            want[h]['syn_ext'] = True

    out = {}
    stat = collections.Counter()
    for h, info in sorted(want.items()):
        entry = {'w': h, 'pkt': info['pkt'], 'need_syn': info['syn'], 'need_col': info['col'],
                 'need_syn_ext': info.get('syn_ext', False),
                 'm': (V.get(h) or {}).get('m', ''), 'ex': (V.get(h) or {}).get('ex', ''),
                 'cur_syn': cur_syn(V, h), 'cur_col': cur_col(V, h), 'syn': [], 'col': []}
        hpos = pos_set(entry['m'])
        if info['syn'] or info.get('syn_ext'):
            seen = set()
            pool = []
            for src, tbl in (('M', mat), ('R', rev)):
                for o, c in tbl.get(h, collections.Counter()).most_common(12):
                    if o in seen or o == h or o not in allowed or o in wrong.get(h, set()):
                        continue
                    opos = pos_set((V.get(o) or {}).get('m'))
                    if hpos and opos and not (hpos & opos):
                        continue          # 词性不相交，机械就能否掉
                    seen.add(o)
                    pool.append({'s': o, 'src': src, 'n': c})
            entry['syn'] = pool[:8]
            stat['syn:M' if any(x['src'] == 'M' for x in entry['syn']) else
                 ('syn:R' if entry['syn'] else 'syn:无')] += 1
        if info['col']:
            seen, pool = set(), []
            for src, tbl in (('B', bc), ('T', tc)):
                for c, n in tbl.get(h, collections.Counter()).most_common(24):
                    if c in seen or c == h or len(c.split()) < 2:
                        continue
                    seen.add(c)
                    pool.append({'c': c, 'src': src, 'n': n})
                    if len(pool) >= 12:
                        break
            entry['col'] = sorted(pool, key=lambda x: (x['src'] != 'B', -x['n']))[:6]
            stat['col:B' if any(x['src'] == 'B' for x in entry['col']) else
                 ('col:T' if entry['col'] else 'col:无')] += 1
        if not entry['syn'] and not entry['col']:
            stat['两路皆无候选'] += 1
        stat['need_syn'] += info['syn']
        stat['need_syn_ext'] += info.get('syn_ext', False)
        stat['need_col'] += info['col']
        out[h] = entry

    json.dump(out, open(ROOT + '/work/cardgen/cand.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    write_sheets(out)
    print(f'待处理词头 {len(out)}')
    for k in ('need_syn', 'need_syn_ext', 'need_col', 'syn:M', 'syn:R', 'syn:无',
              'col:B', 'col:T', 'col:无', '两路皆无候选'):
        print(f'  {k:<14} {stat[k]}')
    print(f'\n机械候选合计：同义词 {sum(len(v["syn"]) for v in out.values())} 条、'
          f'词伙 {sum(len(v["col"]) for v in out.values())} 条')
    return 0


def write_sheets(out, per=110):
    """把候选压成「一行一词」的送审表，按章切成 work/cardgen/need/*.json。

    刻意用极简文本喂给子代理：只给词头、释义、例句和候选，不给整章课文。
    代理的职责收窄成「这条候选在这个意思上成不成立」，越短越不容易跑飞。
    """
    import os
    os.makedirs(ROOT + '/work/cardgen/need', exist_ok=True)
    for f in os.listdir(ROOT + '/work/cardgen/need'):
        os.remove(ROOT + '/work/cardgen/need/' + f)
    by_pkt = collections.defaultdict(list)
    for h, e in out.items():
        if e['syn'] or e['col']:
            by_pkt[e['pkt']].append(e)
    n = 0
    manifest = {}
    for p in PACKET:
        rows = by_pkt.get(p, [])
        for i in range(0, len(rows), per):
            chunk = rows[i:i + per]
            sid = f'{p}-{i // per + 1:02d}'
            lines = []
            for e in chunk:
                tg = []
                if e['need_syn']:
                    tg.append('syn')
                if e['need_syn_ext']:
                    tg.append('syn+')
                if e['need_col']:
                    tg.append('col')
                lines.append(f"{e['w']}|{e['m'][:34]}|{'/'.join(tg)}|"
                             f"syn[{','.join(x['s'] + ':' + x['src'] for x in e['syn'])}]"
                             f"|col[{','.join(x['c'] + ':' + x['src'] for x in e['col'])}]")
            open(f'{ROOT}/work/cardgen/need/{sid}.txt', 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
            json.dump([{'w': e['w'], 'need_syn': e['need_syn'], 'need_syn_ext': e['need_syn_ext'],
                        'need_col': e['need_col'], 'syn': [x['s'] for x in e['syn']],
                        'col': [x['c'] for x in e['col']]} for e in chunk],
                      open(f'{ROOT}/work/cardgen/need/{sid}.json', 'w', encoding='utf-8'),
                      ensure_ascii=False, indent=1)
            manifest[sid] = len(chunk)
            n += 1
    json.dump(manifest, open(ROOT + '/work/cardgen/need/_manifest.json', 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    print(f'送审表 {n} 份，共 {sum(manifest.values())} 个词头（每份≈{per}）')


if __name__ == '__main__':
    raise SystemExit(main())
