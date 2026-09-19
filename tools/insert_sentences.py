#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把新目标词连同例句插进课文（第 3 批：资料里有、应用没教的词）。

这一步比改句子危险，因为**句子总数会变**：书签、续读位、间隔复习、A-B 循环存的全是
全局句号，不登记顺移账本（SENT_SHIFTS）就会让用户本地进度静默错位。所以这个脚本
必须同时做四件事，少一件都不许落地：
  1 机械校验每条新句（只含一个新目标词、其余词全是简单词或已有目标词、句长、标记成对）
  2 把句子插进 sections.json 的 paragraphs / sentZh，并把词加进 sections 和 chapters
    两份 words 表（门禁第 2、12 条分别查这两处，漏一个就报错）
  3 生成 vocab.json 词条
  4 往 shadow/index.html 的 SENT_SHIFTS 追加账目

账目语义：applySentShifts 是按数组顺序逐条叠加的，所以第 j 条的 after 必须是
「前 j-1 条都已生效之后」的序号 —— 即原始全局句号 + 前面已经插了几条。算错就会把
用户的书签整体挪位。
"""
import json
import re
import sys
import collections

ROOT = '/Users/zhoupeng/Library/Mobile Documents/com~apple~CloudDocs/雅思背单词项目'
SEC = ROOT + '/shadow/data/sections.json'
CHA = ROOT + '/shadow/data/chapters.json'
VOC = ROOT + '/shadow/data/vocab.json'
IDX = ROOT + '/shadow/index.html'
SIMPLE = ROOT + '/tools/data/simple_word_tags.tsv'
WORD = re.compile(r"[A-Za-z][A-Za-z'’-]*")
MARK = re.compile(r'\[\[([^\]:]+):([^\]]+)\]\]')
sys.path.insert(0, ROOT + '/scripts')
from validate_data import shadow_data_ver  # noqa: E402


def forms(w):
    w = w.lower()
    f = {w, w + 's', w + 'es', w + 'd', w + 'ed', w + 'ing', w + 'er', w + 'est'}
    if w.endswith('e'):
        f |= {w + 'd', w[:-1] + 'ing', w[:-1] + 'ed'}
    if w.endswith('y') and len(w) > 2:
        f |= {w[:-1] + 'ies', w[:-1] + 'ed', w[:-1] + 'ing', w[:-1] + 'er', w[:-1] + 'est'}
    return f


def proper_nouns(D):
    """课文里已经在用的人名/地名。

    新句不许带生词，但本书本来就有 Lin / Anna / Mingming 这批人物和 Beijing、
    Komodo 这些地名：它们不在任何词表里，于是每写一句用到人名就必被判「引入生词」。
    判据用「句中大写」这种只有专名才会有的证据，外加各章 words 表里首字母大写的条目，
    不写死名单，改人物名也不用动代码。
    """
    out = set()
    for ch in D:
        for w in ch.get('words', []):
            if str(w)[:1].isupper():
                out.add(str(w).lower())
        for para in ch['paragraphs']:
            for s in para:
                body = re.sub(r'\[\[([^\]:]+):([^\]]+)\]\]', r'\2', s)
                for m in re.finditer(r'\b([A-Z][a-zA-Z]{2,})\b', body):
                    if m.start() > 0 and body[m.start() - 1] not in '.!?"':
                        out.add(m.group(1).lower())
    return out


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else '/tmp/cardgen/newwords_out.json'
    do = '--apply' in sys.argv
    items = json.load(open(src, encoding='utf-8'))
    D = json.load(open(SEC, encoding='utf-8'))
    C = json.load(open(CHA, encoding='utf-8'))
    V = json.load(open(VOC, encoding='utf-8'))
    ROOTVOC = ROOT + '/data/vocab.json'
    R = json.load(open(ROOTVOC, encoding='utf-8'))
    simple = {l.split('\t')[0].strip().lower() for l in open(SIMPLE, encoding='utf-8')
              if not l.startswith('#') and l.strip()}
    vocab_keys = {k.lower() for k in V}
    names = proper_nouns(D)
    # 一次性把所有允许出现的词形铺开：否则下面每个 token 都要重算三万次 forms()
    allow_forms = set()
    for x in (vocab_keys | simple):
        if ' ' not in x:
            allow_forms |= forms(x)
    allow_forms |= names            # 课文已有的人名地名不算「引入生词」
    # 全局序号 → (章, 段, 段内序号)，并算出每条插入点的原始全局句号
    flat = []
    for ci, c in enumerate(D):
        for si, p in enumerate(c['paragraphs']):
            for k in range(len(p) + 1):
                flat.append((ci, si, k))
    gidx = {}
    n = 0
    for ci, c in enumerate(D):
        for si, p in enumerate(c['paragraphs']):
            for k in range(len(p)):
                gidx[(ci, si, k)] = n
                n += 1
    TOTAL = n


    def ins_after(ci, para, pos):
        """插到 (章,段,pos) 之前 → 它前面那一句的全局序号；插在全书最前则返回 -1。"""
        base = gidx.get((ci, para, 0))
        if base is None:                      # 空段（理论上不该有）
            prev = max((v for (c2, s2, k2), v in gidx.items() if (c2, s2) < (ci, para)), default=-1)
            return prev
        return base + pos - 1

    ok, bad = [], []
    seen = set()
    for it in items:
        w = str(it.get('word', '')).lower().strip()
        def why(m):
            bad.append((w, m))
        if w in vocab_keys:
            why('已在词表'); continue
        if w in seen:
            why('本次重复'); continue
        ch, para, pos = it.get('chapter'), it.get('para'), it.get('pos')
        if not (isinstance(ch, int) and 1 <= ch <= len(D)):
            why('chapter 越界'); continue
        ci = ch - 1
        if not (isinstance(para, int) and 0 <= para < len(D[ci]['paragraphs'])):
            why('para 越界'); continue
        L = len(D[ci]['paragraphs'][para])
        if not (isinstance(pos, int) and 0 <= pos <= L):
            why('pos 越界'); continue
        en = str(it.get('en', '')).strip()
        ms = list(MARK.finditer(en))
        if len(ms) != 1 or ms[0].group(1).lower() != w:
            why(f'标记数={len(ms)} 或词头不符'); continue
        vis = MARK.sub(lambda m: m.group(2), en)
        nw = len(WORD.findall(vis))
        if not (6 <= nw <= 18):
            why(f'句长 {nw} 词'); continue
        zh = str(it.get('zh', '')).strip()
        if not zh or not re.search(r'[，。]', zh):
            why('中文缺标点'); continue
        m_, p_ = str(it.get('m', '')).strip(), str(it.get('p', '')).strip()
        if not re.match(r'^(n|v|vt|vi|a|adj|ad|adv|prep|conj|pron|num)\.\s*\S', m_):
            why('释义没有词性前缀'); continue
        if not (p_.startswith('/') and p_.endswith('/') and len(p_) > 3):
            why('音标格式不对'); continue
        ex = str(it.get('ex', '')).strip()
        if not ex or MARK.sub('', ex).strip() == vis.strip() or not str(it.get('exZh', '')).strip():
            why('例句缺失或与课文句相同'); continue
        # 除新词外不许引入第三个生词
        hf = forms(w)
        hard = []
        for t in WORD.findall(vis):
            tl = t.lower()
            if tl in hf or tl in allow_forms:
                continue
            hard.append(tl)
        if hard:
            why('引入生词 ' + ','.join(sorted(set(hard))[:4])); continue
        seen.add(w)
        ok.append({**it, 'word': w, '_ci': ci, '_para': para, '_pos': pos,
                   '_gi': ins_after(ci, para, pos)})

    ok.sort(key=lambda x: x['_gi'])
    # 账目：after 用「前面已插入若干条之后」的序号
    ledger = []
    for j, x in enumerate(ok):
        # applySentShifts 是按数组顺序逐条叠加的，所以第 j 条的 after 要换算成
        # 「前 j-1 条都已生效之后」的序号 = 原始序号 + 前面插在它之前的条数
        after = x['_gi'] + sum(1 for y in ok[:j] if y['_gi'] <= x['_gi'])
        ledger.append({'id': f"ins-{after}-new-{x['word']}", 'after': after, 'delta': 1,
                       'chapter': x['_ci'], 'localAfter': x['_pos']})
        x['_after'] = after
    print(f'候选 {len(items)} → 通过 {len(ok)}，拒绝 {len(bad)}')
    cnt = collections.Counter()
    for w, m in bad:
        cnt[m.split(' ')[0]] += 1
    for k, v in cnt.most_common(8):
        print(f'   拒绝 {k}: {v}')
    for w, m in bad[:10]:
        print(f'     {w}: {m}')
    print(f'句子总数 {TOTAL} → {TOTAL + len(ok)}')
    print('插入点样例:', ', '.join(f"{x['word']}@ch{x['_ci']+1}/{x['_para']}/{x['_pos']}" for x in ok[:6]))
    if not do:
        print('\n（干跑，未写文件。加 --apply 才落地）')
        # 计划里必须留 _gi：check_shift_ledger 的「直接映射」算法靠它算旧序号→新序号，
        # 之前只写 _after 导致那两个独立算法其实没法对账
        json.dump({'ok': [{k: v for k, v in x.items() if not k.startswith('_')}
                          | {'_after': x['_after'], '_gi': x['_gi']} for x in ok],
                   'ledger': ledger}, open('/tmp/cardgen/insert_plan.json', 'w', encoding='utf-8'),
                  ensure_ascii=False, indent=1)
        return 0
    if not ok:
        print('没有可落地的条目，拒绝写入')
        return 1
    for x in sorted(ok, key=lambda y: -y['_gi']):
        ci, para, pos = x['_ci'], x['_para'], x['_pos']
        D[ci]['paragraphs'][para].insert(pos, x['en'].strip())
        D[ci]['sentZh'][para].insert(pos, x['zh'].strip())
        if x['word'] not in [str(t).lower() for t in D[ci]['words']]:
            D[ci]['words'].append(x['word'])
        if x['word'] not in [str(t).lower() for t in C[ci]['words']]:
            C[ci]['words'].append(x['word'])
        V[x['word']] = {'p': x['p'].strip(), 'm': x['m'].strip(),
                        'uk': x.get('uk') or x['p'].strip(), 'us': x.get('us') or x['p'].strip(),
                        'ex': x['ex'].strip(), 'exZh': x['exZh'].strip(), 'note': ''}
        # validate_data 第 4 条要求两个应用词表键集一致：新词必须同时进阅读站，
        # 它的条目结构更瘦（只有 p/m/note）
        R[x['word']] = {'p': x['p'].strip(), 'm': x['m'].strip(), 'note': ''}
    tot = sum(len(p) for c in D for p in c['paragraphs'])
    assert tot == TOTAL + len(ok), f'句子总数不符 {tot} != {TOTAL}+{len(ok)}'
    for c in D:
        for i, p in enumerate(c['paragraphs']):
            assert len(p) == len(c['sentZh'][i]), f'第{c["title"]}段{i}中英句数不齐'
    s = open(IDX, encoding='utf-8').read()
    anchor = "      { id: 'ins-1619-0919', after: 1619, delta: 1, chapter: 5, localAfter: 3 },\n"
    assert anchor in s, '找不到 SENT_SHIFTS 锚点，不敢盲改'
    add = ''.join("      { id: %r, after: %d, delta: 1, chapter: %d, localAfter: %d },\n"
                  % (e['id'], e['after'], e['chapter'], e['localAfter']) for e in ledger)
    s = s.replace(anchor, anchor + "      // 2026-09-19 第 3 批：按三份资料补的新目标词，每插一句记一条\n" + add, 1)
    open(IDX, 'w', encoding='utf-8').write(s)
    json.dump(D, open(SEC, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    json.dump(C, open(CHA, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    json.dump(V, open(VOC, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    # 阅读站词表是缩进排版，别按跟读站的紧凑格式写，否则一次造出上万行假 diff
    rv_txt = json.dumps(R, ensure_ascii=False, indent=2)
    if open(ROOTVOC, encoding='utf-8').read().endswith('\n'):
        rv_txt += '\n'
    open(ROOTVOC, 'w', encoding='utf-8').write(rv_txt)
    # 课文与词表都变了，必须同批 bump 数据版本号，否则手机上拉不到新课文
    s2 = open(IDX, encoding='utf-8').read()
    ver = shadow_data_ver()
    s2 = re.sub(r'(const SHADOW_DATA_VER\s*=\s*")[0-9a-f]+(")', r'\g<1>' + ver + r'\g<2>', s2, count=1)
    open(IDX, 'w', encoding='utf-8').write(s2)
    print(f'SHADOW_DATA_VER → {ver}')
    print(f'已落地 {len(ok)} 词 / {len(ledger)} 条账目，句子总数 {tot}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
