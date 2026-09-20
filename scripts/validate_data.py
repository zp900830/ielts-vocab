#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""数据校验：确保词汇、章节、故事占位符之间的一致性。"""
import json, collections, re, sys, hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

sys.path.insert(0, str(ROOT / 'tools'))
from width_rule import width as _ruler_width   # 唯一一把尺；口径与上限都只在 tools/width_rule.py 里改

# 主站 fetchCached 用 DATA_VER 做 Cache API 的 x-ver 键：改了数据文件而没 bump
# DATA_VER，线上会永久命中旧缓存且无任何报错。故把版本号定义为这些文件的内容哈希，
# 由本脚本校验一致性 —— 忘记 bump 会直接 FAIL，而不是静默服务旧词库。
DATA_VER_FILES = ['data/book.json', 'data/sup.json', 'data/stories.json', 'data/covers.json']
# 跟读站同理：它原先完全没有版本戳，改课文后 iOS Safari 会按 Last-Modified 命中旧缓存，
# 出现 sections.json 是新的、vocab.json 是旧的 → 句序与词表错位。
SHADOW_VER_FILES = ['shadow/data/sections.json', 'shadow/data/vocab.json', 'shadow/data/chapters.json']

def digest(rels):
    h = hashlib.sha256()
    for rel in rels:
        b = (ROOT / rel).read_bytes()
        h.update(rel.encode('utf-8'))
        h.update(len(b).to_bytes(8, 'big'))
        h.update(b)
    return h.hexdigest()[:10]

def data_ver():
    return digest(DATA_VER_FILES)

def shadow_data_ver():
    return digest(SHADOW_VER_FILES)


def template_clusters(paragraphs, thresh=0.55, min_size=3):
    """词集相似度成簇：同一骨架只换目标词的模板句会聚成一簇。
    纯 stdlib，不依赖外部词表，所以可以放进门禁。"""
    items = []
    for para in paragraphs:
        for sent in para:
            en = re.sub(r'\[\[([^\]:]+):[^\]]+\]\]', r'\1', sent)
            items.append(set(re.findall(r'[a-z]+', en.lower())))
    buckets = collections.defaultdict(list)
    for i, ws in enumerate(items):
        srt = sorted(ws)
        if len(srt) >= 3:
            buckets[tuple(srt[:3])].append(i)
    out, used = [], set()
    for idxs in buckets.values():
        if len(idxs) < min_size:
            continue
        for i in idxs:
            if i in used or len(items[i]) < 6:
                continue
            g, used = [i], used | {i}
            for j in idxs:
                if j in used or len(items[j]) < 6:
                    continue
                if len(items[i] & items[j]) / len(items[i] | items[j]) >= thresh:
                    g.append(j); used.add(j)
            if len(g) >= min_size:
                out.append(g)
    return out

def load(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def main():
    vocab = load(ROOT / 'shadow' / 'data' / 'vocab.json')
    chapters = load(ROOT / 'shadow' / 'data' / 'chapters.json')
    sections = load(ROOT / 'shadow' / 'data' / 'sections.json')
    root_vocab = load(ROOT / 'data' / 'vocab.json')
    book = load(ROOT / 'data' / 'book.json')

    errors = []
    warnings = []   # 已知待修项：报告但不阻断，修完后可逐条上提为 error

    # 0. DATA_VER 必须等于数据文件内容哈希
    want = data_ver()
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    m = re.search(r'const DATA_VER\s*=\s*"([0-9a-fA-F]+)"', html)
    if not m:
        errors.append('index.html: 找不到 const DATA_VER = "..."，无法校验缓存版本')
    elif m.group(1) != want:
        errors.append(f'index.html DATA_VER 已过期：当前 {m.group(1)}，数据文件哈希为 {want}。'
                      f' 请改为 "{want}"，否则线上会永久命中旧缓存。')

    # 0b. 跟读站 SHADOW_DATA_VER 必须等于 shadow/data 三文件的内容哈希
    want_s = shadow_data_ver()
    sh = (ROOT / 'shadow' / 'index.html').read_text(encoding='utf-8')
    ms = re.search(r'const SHADOW_DATA_VER\s*=\s*"([0-9a-fA-F]+)"', sh)
    if not ms:
        errors.append('shadow/index.html: 找不到 const SHADOW_DATA_VER = "..."，跟读站数据无缓存版本')
    elif ms.group(1) != want_s:
        errors.append(f'shadow/index.html SHADOW_DATA_VER 已过期：当前 {ms.group(1)}，'
                      f' 数据哈希为 {want_s}。请改为 "{want_s}"，否则改课文不会到达手机。')
    missing_pm = [w for w, e in vocab.items() if not e.get('p') or not e.get('m')]
    if missing_pm:
        errors.append(f"{len(missing_pm)} words missing p/m: {missing_pm[:10]}")

    # 2. chapters.json 里的词都在 vocab 里
    ch_words = set()
    for ch in chapters:
        for w in ch.get('words', []):
            ch_words.add(w.lower())
    missing_in_vocab = ch_words - set(w.lower() for w in vocab)
    if missing_in_vocab:
        errors.append(f"{len(missing_in_vocab)} chapter words not in vocab: {list(missing_in_vocab)[:10]}")

    # 3. sections.json 占位符 [[word:form]] 对应的 word 存在
    placeholder_re = re.compile(r'\[\[([^\]:|]+)')
    ph_words = set()
    for sec in sections:
        for para in sec.get('paragraphs', []):
            for sent in para:
                for m in placeholder_re.finditer(sent):
                    ph_words.add(m.group(1).lower())
    missing_ph = ph_words - set(w.lower() for w in vocab)
    if missing_ph:
        errors.append(f"{len(missing_ph)} placeholder words not in vocab: {list(missing_ph)[:10]}")

    # 4. root vocab 与 shadow vocab 键一致
    root_keys = set(root_vocab.keys())
    shadow_keys = set(w.lower() for w in vocab)
    if root_keys != shadow_keys:
        only_root = root_keys - shadow_keys
        only_shadow = shadow_keys - root_keys
        if only_root:
            errors.append(f"{len(only_root)} words only in root vocab: {list(only_root)[:10]}")
        if only_shadow:
            errors.append(f"{len(only_shadow)} words only in shadow vocab: {list(only_shadow)[:10]}")

    # 5. 释义排版脏字符：悬挂分号与重复分号会直接渲染进词卡弹窗
    trail = [r[1] for r in book if isinstance(r[3], str) and r[3].rstrip().endswith('；')]
    if trail:
        errors.append(f"{len(trail)} book.json defs end with ；: {trail[:10]}")
    dbl = []
    for name, d in (('shadow vocab', vocab), ('root vocab', root_vocab)):
        for w, e in d.items():
            txt = e.get('m') if isinstance(e, dict) else (e[3] if isinstance(e, list) else '')
            if isinstance(txt, str) and '；；' in txt:
                dbl.append(f"{name}:{w}")
    if dbl:
        errors.append(f"{len(dbl)} defs contain ；；: {dbl[:10]}")

    # 6. book.json 重复词头：DICT 构建为后写覆盖，徽章与例句可能张冠李戴
    seen, dup = set(), []
    for r in book:
        k = r[1].lower()
        if k in seen:
            dup.append(k)
        seen.add(k)
    if dup:
        warnings.append(f"{len(dup)} duplicate headwords in book.json (later row wins): {sorted(set(dup))[:12]}")

    # 7. 大小写不一致的词头：上面 2/3 项用 lower() 比较会掩盖这类脏键
    vkeys = set(vocab.keys())
    case_bad = sorted({w for ch in chapters for w in ch.get('words', [])
                       if w not in vkeys and w.lower() in vkeys})
    if case_bad:
        warnings.append(f"{len(case_bad)} chapter words differ only by case from vocab keys: {case_bad[:12]}")

    # 8. 词表列了但正文从未出现的目标词（sections 的 [[word:form]] 标记）
    marked = set()
    for sec in sections:
        for para in sec.get('paragraphs', []):
            for sent in para:
                for m in placeholder_re.finditer(sent):
                    marked.add(m.group(1).lower())
    orphan = sorted(ch_words - marked)
    if orphan:
        warnings.append(f"{len(orphan)} chapter words never appear in section text: {orphan[:12]}")

    total_sents = sum(len(p) for sec in sections for p in sec.get('paragraphs', []))

    # 10-12. 跟读篇文本规格（见 docs/2026-09-19-跟读篇文本规格排查.md §0）：
    #        除目标词外均为简单词 —— 词汇难度由 tools/shadow_text_audit.py 判（需外部词表），
    #        这里只守不依赖外部数据的三条硬约束。
    mark_full = re.compile(r'\[\[[^\]:]+:[^\]]+\]\]')

    # 10. 标记残缺：[[k:d]] 后紧跟小写字母 = 词尾掉在高亮外，
    #     渲染成「refine + 行内释义 + d」，读出来是 simplifyd 这类不存在的词。
    broken = [f"ch{si}-{pi}-{ti}"
              for si, sec in enumerate(sections)
              for pi, para in enumerate(sec.get('paragraphs', []))
              for ti, sent in enumerate(para) if re.search(r'\]\][a-z]', sent)]
    if broken:
        errors.append(f"{len(broken)} markers leak an inflection suffix outside [[...]] "
                      f"(renders as a misspelled word): {broken[:8]}")

    # 11. 逐句中文译文必须存在 —— 跟读时靠它确认听懂，缺一句就是盲读
    #     且必须带标点：2026-09-19 实测第 3 章有 62 句整句一个停顿都没有，读起来像一串关键词。
    nozh = []
    nopunct = []
    for si, sec in enumerate(sections):
        zh = sec.get('sentZh') or []
        for pi, para in enumerate(sec.get('paragraphs', [])):
            row = zh[pi] if pi < len(zh) else []
            for ti, _sent in enumerate(para):
                cell = row[ti] if ti < len(row) else ''
                if not str(cell or '').strip():
                    nozh.append(f"ch{si}-{pi}-{ti}")
                elif not re.search(r'[，。、；：！？]', str(cell)):
                    nopunct.append(f"ch{si}-{pi}-{ti}: {str(cell)[:18]}")
    if nozh:
        errors.append(f"{len(nozh)} sentences have no Chinese translation: {nozh[:8]}")
    if nopunct:
        errors.append(f"{len(nopunct)} 句中文译文没有任何标点（需补停顿）: {nopunct[:5]}")

    # 12. 本章声明要教的词，不得以纯文本出现却在本章从不标记（学生点不到、无行内释义）
    missed = []
    for si, sec in enumerate(sections):
        decl = {str(w).lower() for w in sec.get('words', [])}
        marked_here, plain_here = set(), set()
        for para in sec.get('paragraphs', []):
            for sent in para:
                for m in placeholder_re.finditer(sent):
                    marked_here.add(m.group(1).lower())
                bare = mark_full.sub(' ', sent).lower()
                for w in decl:
                    if re.search(r'(?<![a-z])' + re.escape(w) + r'(?![a-z])', bare):
                        plain_here.add(w)
        bad = sorted(plain_here - marked_here)
        if bad:
            missed.append(f"ch{si}: {bad}")
    if missed:
        errors.append(f"chapter words taught in plain text but never marked "
                      f"(untappable, no gloss): {'; '.join(missed)[:400]}")

    # 13. 模板句覆盖率：同一骨架只换目标词的句子成簇，说明课文是套模板生成的。
    #     2026-09-19 实测 ch3 曾达 28.4%（110 句），已全部重写归零；此检查防止内容生成再次退回模板。
    tmpl = sum(len(g) for sec in sections for g in template_clusters(sec.get('paragraphs', [])))
    if tmpl / max(1, total_sents) > 0.02:
        warnings.append(f"{tmpl}/{total_sents} 句疑似模板克隆（同一骨架换词），占 {tmpl/total_sents*100:.1f}%")

    # 14. 顺移账本必须能解释当前句数。书签/续读位/间隔复习/A-B 循环存的全是全局句号，
    #     增删句子却没登记 SENT_SHIFTS，用户本地进度会静默错位且无法回滚。
    SENT_BASELINE = 1809  # 2026-09-19 建立账本时的全书句数
    k = sh.find('const SENT_SHIFTS = [')
    if k < 0:
        errors.append('shadow/index.html 找不到 SENT_SHIFTS 顺移账本；若课文句数有变，必须补记')
    else:
        d0, i = k + len('const SENT_SHIFTS = ['), k + len('const SENT_SHIFTS = [')
        depth = 1
        while i < len(sh) and depth:
            if sh[i] == '[':
                depth += 1
            elif sh[i] == ']':
                depth -= 1
            i += 1
        block = sh[d0:i - 1]
        ids = re.findall(r"id:\s*'([^']+)'", block)
        deltas = re.findall(r'delta:\s*(-?\d+)', block)
        if len(ids) != len(deltas):
            errors.append(f'SENT_SHIFTS 有 {len(ids)} 个 id 但 {len(deltas)} 个 delta，账本不完整')
        elif SENT_BASELINE + sum(int(x) for x in deltas) != total_sents:
            errors.append(f'课文句数 {total_sents} ≠ 基线 {SENT_BASELINE} + 账本增删 {sum(int(x) for x in deltas)}。'
                          f' 增删句子必须往 SENT_SHIFTS 追加一条 {{id, after, delta, chapter, localAfter}}，'
                          f' 否则用户书签与间隔复习记录会整体错位。')

    # 15. 每个段落的英文句数与中文译文句数必须一一对应，否则整段译文串位
    misalign = []
    for si, sec in enumerate(sections):
        zhs = sec.get('sentZh', [])
        for pi, para in enumerate(sec.get('paragraphs', [])):
            zh = zhs[pi] if pi < len(zhs) else None
            if not isinstance(zh, list) or len(zh) != len(para):
                misalign.append(f'ch{si}段{pi}: 英文 {len(para)} 句 / 中文 {0 if not isinstance(zh, list) else len(zh)} 句')
    if misalign:
        errors.append(f'英文句与中文译文不齐（译文会整段串位）: {misalign[:8]}')

    # 16. 结构化辨析卡（cmp.type === 'compare'）：不许造词、不许无处可挂
    #     这类卡是第二期 220 组辨析的落库形状，靠人工守不住，所以每条都机检。
    _sec_raw = (ROOT / 'shadow/data/sections.json').read_text(encoding='utf-8')
    # 可查集合**不能**含辨析卡自己的内容 —— 否则卡片里编一条搭配，就被它自己"证明"了（自证循环）。
    # 所以卡片侧只收：词头、义项 m、例句 ex/exZh、字符串型 note（同义词/词伙）。
    _card_bits = []
    for _w, _c in vocab.items():
        _card_bits.append(str(_w))
        if not isinstance(_c, dict):
            continue
        _card_bits += [str(_c.get(k) or '') for k in ('m', 'ex', 'exZh')]
        if isinstance(_c.get('note'), str):
            _card_bits.append(_c['note'])
    # 课文里的 [[词头:表面形式]] 会切断连续串，两种拆法都收进可查集合
    hay = ' '.join([_sec_raw,
                    re.sub(r'\[\[([^\]:]+):([^\]]+)\]\]', r'\2', _sec_raw),
                    re.sub(r'\[\[([^\]:]+):([^\]]+)\]\]', r'\1 \2', _sec_raw),
                    ' '.join(_card_bits)]).lower()
    # 每个成员必须真的出现在它声称的共现段里 —— 这是"表挂段末"的前提
    def _in_para(ci, pi, w):
        try:
            para = sections[ci]['paragraphs'][pi]
        except (IndexError, KeyError, TypeError):
            return False
        return any(f'[[{w}:' in s or f'[[{w}]]' in s for s in para if isinstance(s, str))
    def _width(t):
        # 口径（2026-09-20 两份独立审核各自从批次 1A 你点头的 5 条实测数反推，结论一致）：
        # 汉字和全角标点各记 1，其余（拉丁字母、空格、半角括号）记 0.5。
        # 之前这里抄了一份自己算，中文标点被记 0.5 —— 上限因此比 PRD 说的松，超宽的行能混过去。
        # 现在只留一个委托：尺子在 tools/width_rule.py，别再这里改口径。
        return _ruler_width(t)
    n_cmp = 0
    for w, c in vocab.items():
        if not isinstance(c, dict):
            continue
        note = c.get('cmp')   # 辨析卡在 cmp；note 是句下要显示的同义词/词伙串，两者不互占
        # (a) 落地器历史上把结构化辨析卡压成过 Python repr 字符串，线上一显示就是一坨
        #     {'type': 'compare', ...}。守卫只能防以后再压坏，已经压坏的必须被这里点名。
        flat = [f for f in (note, c.get('note')) if isinstance(f, str)
                and re.match(r'^\{\s*[\'"]type[\'"]\s*:', f.strip())]
        if flat:
            errors.append(f'辨析卡 {w}: 卡被压成了字符串（页面上会直接显示 dict 字面量），要还原成对象')
            continue
        if not (isinstance(note, dict) and note.get('type') == 'compare'):
            continue
        n_cmp += 1
        members = [it.get('w') for it in note.get('items', []) if isinstance(it, dict)]
        # (b) 卡片挂在段落末尾，「这一句」没有可指的句子了 —— 要么写「这一段」，要么写「同句里」
        if re.search(r'这一?句', str(note.get('title') or '')):
            errors.append(f'辨析卡 {w}: 表头用「这一句」指代，但卡片挂在段末（改「这一段」或「同句里」）')
        for m in members:
            if m not in vocab:
                errors.append(f'辨析卡 {w}: 成员 {m} 在 vocab.json 里没有卡（辨析只许讨论目标词，PRD §5.10）')
        for it in note.get('items', []):
            eg = it.get('eg')
            if isinstance(eg, str) and eg.strip() and eg.lower().strip() not in hay:
                errors.append(f'辨析卡 {w}/{it.get("w")}: 例句查无出处（疑似造搭配）: {eg[:60]}')
        for row in note.get('diff', []):
            for k in ('eg', 'collocation'):
                v = row.get(k)
                if isinstance(v, str) and v.strip() and v.lower().strip() not in hay:
                    errors.append(f'辨析卡 {w}: 差异表 {k} 查无出处: {v[:60]}')
        miss = [k for k in ('title', 'items', 'summary') if not note.get(k)]
        if miss:
            errors.append(f'辨析卡 {w}: 缺字段 {miss}（渲染按这三段摆，缺一个就白屏）')
        summ = note.get('summary')
        text = summ if isinstance(summ, str) else (summ or {}).get('easy', '') if isinstance(summ, dict) else ''
        # ≤40 只管「简单记」那半句 —— 段末默认行显示的就是它，整段 summary 是点开才出的
        m = re.search(r'简单记[:：](.+)$', text)
        if m:
            line = m.group(1).strip()
            if _width(line) > 40:
                errors.append(f'辨析卡 {w}: 默认那一行宽度 {_width(line)} > 40，手机上会超过两行（PRD §5.10：≤40 的口径是"两行以内"，不是"一行"）: {line[:30]}')
        elif text:
            warnings.append(f'辨析卡 {w}: summary 里没有「简单记：」那半句，段末默认行只能整段显示（会超宽）')
        paras = note.get('paras') or []
        if members and paras:
            if not any(all(_in_para(p[0], p[1], m) for m in members)
                       for p in paras if isinstance(p, (list, tuple)) and len(p) == 2):
                errors.append(f'辨析卡 {w}: 声明的共现段 {paras} 里并非所有成员都在，这张表没有可挂的段')
        # (c) at = 渲染时挂哪一段。挂错段 = 表出现在没有这些词的段落后面，比不挂更糟
        at = note.get('at')
        if at is not None:
            if not (isinstance(at, (list, tuple)) and len(at) == 2):
                errors.append(f'辨析卡 {w}: at 要写成 [章号, 段号]，现在是 {at!r}')
            elif members and not all(_in_para(at[0], at[1], m) for m in members):
                errors.append(f'辨析卡 {w}: 锚点段 {list(at)} 里并非所有成员都在（{members}）')

    # 9. 基础统计
    print(f"vocab: {len(vocab)} words")
    print(f"chapters: {len(chapters)} macro chapters, {len(ch_words)} unique words")
    print(f"sections placeholders: {len(ph_words)} unique words")
    print(f"root vocab: {len(root_vocab)} words")
    print(f"book: {len(book)} rows")
    print(f"compare cards (辨析卡): {n_cmp}")

    if warnings:
        print('\n待修告警（不阻断）:')
        for w in warnings:
            print(' -', w)

    if errors:
        print('\nValidation FAILED:')
        for e in errors:
            print(' -', e)
        sys.exit(1)
    print('\nValidation PASSED')

if __name__ == '__main__':
    main()
