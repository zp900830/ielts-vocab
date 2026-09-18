#!/usr/bin/env python3
# 跟读篇文本规格核查（可重跑）
#
# 规格（用户 2026-09-19 口述，详见 docs/2026-09-19-跟读篇文本规格排查.md）：
#   影子跟读 = 除目标词外其余单词均应为简单词，句子可以是长难句；
#   情境阅读 = 允许高级词汇，但故事要合理。
# 本脚本查跟读篇，输出 A 标记残缺 / B 目标词漏标 / C 非目标词难度 / D 句长密度 / E 分章漏标。
#
# 依赖外部词表（不入库，跑前下载到 /tmp/wordlists/derived/）：
#   ecdict_tag_zk.txt / ecdict_tag_gk.txt / ecdict_tag_cet4.txt   ← ECDICT 的考纲 tag 列
#   NGSL12_surface_forms_ranked__word_rank.tsv                    ← NGSL 1.2 官方词形表
#   ngsl31k_lemmas__word_rank.tsv, coca20000_freq_ordered.txt     ← 兜底频率表
#   /tmp/wordlists/ecdict.csv.full                                ← 可选，用于给超纲词配中文释义
# 缺文件时脚本会报错退出，不会给出假数字。
#
# 用法：python3 tools/shadow_text_audit.py
"""跟读篇文本规格核查 v3（最终版）。

规格：影子跟读 = 除目标词外其余单词均应为简单词（句子可为长难句）；阅读篇 = 允许高级词但故事要合理。
输出四类结论：
  A 标记残缺（词尾漏在高亮外）
  B 目标词以纯文本出现（点不到、无释义）
  C 非目标词难度分布（超纲 = 违反规格）
  D 句子结构与目标词密度
"""
import json, re, csv, sys, collections

ROOT = "/Users/zhoupeng/Library/Mobile Documents/com~apple~CloudDocs/雅思背单词项目"
WL = "/tmp/wordlists/derived"
MARK = re.compile(r"\[\[([^\]:]+):([^\]]+)\]\]")
WORD = re.compile(r"[A-Za-z][A-Za-z'’\-]*")

def load_words(path, col=0, delim="\t"):
    out = set()
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        w = (line.split(delim)[col] if delim else line).strip().lower()
        if w:
            out.add(w)
    return out

def load_rank(path):
    r = {}
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        p = line.split("\t")
        if len(p) >= 2 and p[1].strip().isdigit():
            r.setdefault(p[0].strip().lower(), int(p[1]))
    return r

zk = load_words(f"{WL}/ecdict_tag_zk.txt")
gk = load_words(f"{WL}/ecdict_tag_gk.txt")
cet4 = load_words(f"{WL}/ecdict_tag_cet4.txt")
ngsl_forms = load_rank(f"{WL}/NGSL12_surface_forms_ranked__word_rank.tsv")
ngsl_lem = load_rank(f"{WL}/ngsl31k_lemmas__word_rank.tsv")
coca20k = load_words(f"{WL}/coca20000_freq_ordered.txt")

IRREGULAR = {  # 不规则变形 → 原形（词表按原形收录，不补这张表会误判成超纲）
    "wove": "weave", "woven": "weave", "clung": "cling", "beheld": "behold",
    "undone": "undo", "freshmen": "freshman", "freshman": "freshman",
    "travellers": "traveler", "colourful": "colorful", "tidied": "tidy",
    "snugness": "snug", "shoeless": "shoe", "shopkeeping": "shop",
    "handpainted": "handpainted", "strung": "string", "spun": "spin",
    "shone": "shine", "lit": "light", "dreamt": "dream", "burnt": "burn",
    "leapt": "leap", "rode": "ride", "rose": "rise", "sank": "sink",
    "threw": "throw", "drew": "draw", "flew": "fly", "grew": "grow",
    "knew": "know", "gave": "give", "took": "take", "came": "come",
    "saw": "see", "went": "go", "made": "make", "found": "find",
    "held": "hold", "kept": "keep", "left": "leave", "felt": "feel",
    "meant": "mean", "built": "build", "brought": "bring", "bought": "buy",
    "thought": "think", "taught": "teach", "caught": "catch", "told": "tell",
    "sold": "sell", "sent": "send", "spent": "spend", "met": "meet",
    "sat": "sit", "stood": "stand", "heard": "hear", "led": "lead",
    "read": "read", "written": "write", "driven": "drive", "ridden": "ride",
    "fallen": "fall", "risen": "rise", "broken": "break", "chosen": "choose",
    "spoken": "speak", "taken": "take", "given": "give", "done": "do",
    "gone": "go", "been": "be", "was": "be", "were": "be",
}

def forms(w):
    c = {w}
    if w in IRREGULAR:
        c.add(IRREGULAR[w])
    if w.endswith("ied") and len(w) > 4:
        c.add(w[:-3] + "y")
    if w.endswith("ies") and len(w) > 4:
        c.add(w[:-3] + "y")
    for suf in ("ies", "es", "ed", "ing", "ly", "er", "est", "s"):
        if w.endswith(suf) and len(w) - len(suf) >= 3:
            stem = w[:-len(suf)]
            c |= {stem, stem + "e"}
            if len(w) > 5 and w[-len(suf)-1] == w[-len(suf)-2]:
                c.add(stem[:-1])
    return c

def in_set(w, s):
    return w in s or bool(forms(w) & s)

def ngsl_rank(w):
    r = [ngsl_forms[x] for x in forms(w) if x in ngsl_forms]
    r += [ngsl_lem[x] for x in forms(w) if x in ngsl_lem]
    return min(r) if r else None

def classify(w):
    if in_set(w, zk):
        return "中考"
    if in_set(w, gk):
        return "高考"
    if in_set(w, cet4):
        return "四级"
    rk = ngsl_rank(w)
    if rk is not None:
        return "NGSL≤1000" if rk <= 1000 else "NGSL1001-3000" if rk <= 3000 \
            else "NGSL3001-5000" if rk <= 5000 else "NGSL>5000"
    if in_set(w, coca20k):
        return "COCA2万"
    return None

def surface(k):
    c = {k, k + "s", k + "es", k + "d", k + "ing", k + "er", k + "est", k + "r", k + "st"}
    if k.endswith("y") and len(k) > 2 and k[-2] not in "aeiou":
        c |= {k[:-1] + "ies", k[:-1] + "ed", k[:-1] + "ing"}
    if k.endswith("f"):
        c.add(k[:-1] + "ves")
    if len(k) > 2 and k[-1] not in "aeiouwxy" and k[-2] in "aeiou":
        c |= {k + k[-1] + s for s in ("ing", "ed", "er", "est")}
    return c

secs = json.load(open(f"{ROOT}/shadow/data/sections.json"))
vocab = json.load(open(f"{ROOT}/shadow/data/vocab.json"))
tgt = set(vocab)
tgt_forms = {}
for k in tgt:
    for f in surface(k.lower()):
        tgt_forms.setdefault(f, k)

# ---- 人名表：从数据里推（只以大写形式出现过、且任何词表都查不到）----
seen_cap = collections.defaultdict(bool)
seen_low = collections.defaultdict(bool)
for ch in secs:
    for para in ch["paragraphs"]:
        for s in para:
            st = MARK.sub(lambda m: " " * len(m.group(0)), s)
            for m in WORD.finditer(st):
                t = m.group(0)
                w = re.sub(r"'s$|'$", "", t.lower().replace("’", "'"))
                if t[0].isupper():
                    seen_cap[w] = True
                else:
                    seen_low[w] = True
NAMES = {w for w in seen_cap if not seen_low[w] and classify(w) is None}

rows = []
broken = []
for ci, ch in enumerate(secs):
    for pi, para in enumerate(ch["paragraphs"]):
        for ti, raw in enumerate(para):
            for m in MARK.finditer(raw):
                if re.match(r"^[a-z]", raw[m.end():m.end()+4]):
                    broken.append((ci, pi, ti, m.group(1), raw[m.end():m.end()+4]))
            stripped = MARK.sub(lambda m: " " * len(m.group(0)), raw)
            for m in WORD.finditer(stripped):
                t = m.group(0)
                w = re.sub(r"'s$|'$", "", t.lower().replace("’", "'"))
                if not re.search(r"[a-z]", w):
                    continue
                if w in tgt:
                    rows.append((ci, pi, ti, w, "目标词原形未标记"))
                elif w in NAMES:
                    rows.append((ci, pi, ti, w, "专有名词"))
                else:
                    hit = tgt_forms.get(w) or next(
                        (tgt_forms[f] for f in forms(w) if f in tgt_forms), None)
                    if hit:
                        # 变形命中还要看这个词自己难不难：later 虽是 late 的变形，
                        # 但 later 本身是中考词，不标也不算阅读障碍。
                        simple = classify(w) is not None
                        rows.append((ci, pi, ti, w,
                                     f"目标词变形未标记({hit})" if not simple
                                     else "目标词变形但是简单词"))
                    else:
                        b = classify(w)
                        rows.append((ci, pi, ti, w, b or "超纲"))

cnt = collections.Counter(r[4] for r in rows)
total = len(rows)
print(f"非目标词 token 总数 {total}｜不同词形 {len({r[3] for r in rows})}")
print("\n【C｜非目标词难度分布】")
order = ["中考", "高考", "四级", "NGSL≤1000", "NGSL1001-3000", "NGSL3001-5000",
         "NGSL>5000", "COCA2万", "专有名词", "超纲"]
for k in order + [x for x in cnt if x not in order and not x.startswith("目标词")]:
    if k in cnt:
        print(f"  {k:14s} {cnt[k]:6d} 次 ({cnt[k]/total*100:5.2f}%)")
tgt_unmarked = cnt.get("目标词原形未标记", 0) + sum(v for k, v in cnt.items() if k.startswith("目标词变形未标记"))
print(f"  {'目标词未标记':14s} {tgt_unmarked:6d} 次 ({tgt_unmarked/total*100:5.2f}%)")

hard = collections.Counter(r[3] for r in rows if r[4] == "超纲")
gloss = {}
if hard:
    with open("/tmp/wordlists/ecdict.csv.full", encoding="utf-8") as f:
        want = set(hard)
        for r in csv.DictReader(f):
            k = (r.get("word") or "").lower()
            if k in want and k not in gloss:
                gloss[k] = (r.get("translation") or "").replace("\\n", "；")[:70]
print(f"\n【超纲明细】{len(hard)} 个词 / {sum(hard.values())} 次")
for w, n in sorted(hard.items(), key=lambda kv: (-kv[1], kv[0])):
    where = next((r for r in rows if r[3] == w), None)
    print(f"  {w:14s} ×{n:<3d} {gloss.get(w,'')}")

print(f"\n【A｜标记残缺】词尾漏在高亮外 {len(broken)} 处 / {len({(b[0],b[1],b[2]) for b in broken})} 句")
for ci, pi, ti, k, nx in broken:
    print(f"  ch{ci} 段{pi} 句{ti}: [[{k}:{k}]]{nx}")

print("\n【B｜目标词以纯文本出现】")
exact = {r[3] for r in rows if r[4] == "目标词原形未标记"}
print(f"  原形命中 {cnt['目标词原形未标记']} 次 / {len(exact)} 个不同的目标词")
ex2 = {k: v for k, v in cnt.items() if k.startswith("目标词变形未标记")}
benign = cnt.get("目标词变形但是简单词", 0)
print(f"  变形命中且本身不是简单词 {sum(ex2.values())} 次 / {len(ex2)} 个目标词")
print(f"  （另有 {benign} 次是目标词的变形、但词本身是简单词，不算阅读障碍）")
print("  高频样例：", ", ".join(f"{k.split('(')[1][:-1]}←{v}"
                              for k, v in sorted(ex2.items(), key=lambda kv: -kv[1])[:12]))

print("\n【D｜结构】")
per_sent_tgt = collections.Counter()
per_sent_all = collections.Counter()
for ci, ch in enumerate(secs):
    for pi, para in enumerate(ch["paragraphs"]):
        for ti, raw in enumerate(para):
            n = len(MARK.findall(raw))
            per_sent_tgt[n] += 1
            st = MARK.sub(lambda m: " " * len(m.group(0)), raw)
            per_sent_all[len(tokens := [x for x in WORD.findall(st)])] += 1
for k in sorted(per_sent_tgt):
    print(f"  每句目标词 {k} 个: {per_sent_tgt[k]} 句")
ls = sorted(per_sent_all.items())
cum = 0
print("  每句总词数分位：", end="")
import statistics
flat = [w for w, n in ls for _ in range(n)]
print(f"最短 {min(flat)}｜中位 {statistics.median(flat)}｜P90 {flat[int(len(flat)*0.9)]}｜最长 {max(flat)}")
print(f"  21 词以上长句：{sum(n for w, n in ls if w >= 21)} 句（长难句配额）")

# ---- E｜每章「声明要教、正文却没高亮」的目标词 ----
print("\n【E｜章节声明要教、正文里却从没标记过的目标词】")
for ci, ch in enumerate(secs):
    declared = {w.lower() for w in (ch.get("words") or [])}
    marked_here = set()
    plain_here = collections.Counter()
    for pi, para in enumerate(ch["paragraphs"]):
        for ti, raw in enumerate(para):
            for k, _d in MARK.findall(raw):
                marked_here.add(k.lower())
            st = MARK.sub(lambda m: " " * len(m.group(0)), raw)
            for m in WORD.finditer(st):
                w = re.sub(r"'s$|'$", "", m.group(0).lower().replace("’", "'"))
                if w in declared:
                    plain_here[w] += 1
    never = sorted(declared - marked_here)
    shown_as_plain = {w: n for w, n in plain_here.items() if w in never}
    print(f"  ch{ci} {ch['title']}: 声明 {len(declared)}｜本章标记 {len(marked_here & declared)}"
          f"｜声明了但本章一次都没标记 {len(never)}")
    if shown_as_plain:
        top = sorted(shown_as_plain.items(), key=lambda kv: -kv[1])
        print(f"     其中「正文里以纯文本出现过」= 该高亮却漏了：{len(top)} 个 / "
              f"{sum(v for _, v in top)} 次")
        print("     " + ", ".join(f"{w}×{n}" for w, n in top[:20]))
    truly_absent = [w for w in never if w not in shown_as_plain]
    if truly_absent:
        print(f"     本章正文里根本没出现（白名单里有、课文里找不到）：{len(truly_absent)} 个 → "
              + ", ".join(truly_absent[:20]))
