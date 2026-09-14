#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从22个Excel读词+例句, 全部词条的例句按章拼成长文, 生成最终HTML. 幂等: 重跑安全."""
import json, glob, os, re, sys
from openpyxl import load_workbook

if os.environ.get('IELTS_ALLOW_REBUILD') != '1':
    sys.exit('FROZEN 2026-09-14: rebuild wipes sentZh/paraZh人工成果 — set IELTS_ALLOW_REBUILD=1 to override')

# NOTE：SRC/OUT 为本机绝对路径（machine-local），值保持原样，仅文档说明，不改逻辑。
SRC = "/Users/zhoupeng/Downloads/雅思词汇真经(Excel版待背）"
# FROZEN 2026-09-14：子项目A进行中，禁止重跑（注入正则会冲掉 shadow 内联 sentZh/paraZh 人工成果）
# FROZEN-override：文件头旧注"幂等: 重跑安全"已失效——重跑会销毁 sentZh/paraZh 人工成果，以本冻结注释为准。
OUT = "/Users/zhoupeng/Library/Mobile Documents/com~apple~CloudDocs/雅思背单词项目/雅思影子跟读.html"

ZH = {
"1 自然地理": "Leo 学地质学，走进荒野：山峰、冰川、海岸、沙漠、火山与气象。",
"2 植物研究": "种子发芽、开花结果：光合作用与生态保护。",
"3 动物保护": "野生动物世界：鲸与鹰、捕食者与猎物、栖息地保护。",
"4 太空探索": "夜晚用望远镜看宇宙：星系、航天器、彗星与陨石坑。",
"5 学校教育": "校园生活：课表、图书馆、研讨课、复习备考与奖学金。",
"6 科技发明": "小发明家的车间：专利、原型、传感器与发电机。",
"7 文化历史": "博物馆里：考古、陶器、王朝皇帝、教堂与文艺复兴。",
"8 语言演化": "语言的科学：象形文字、字母、音节、方言与习语。",
"9 娱乐活动": "课余时光：钢琴吉他、演唱会、棋类与远足野餐。",
"10 物品材料": "逛街选礼物：刀具陶瓷、木棉铁塑、水晶与纪念品。",
"11 时尚潮流": "裁缝小铺：天鹅绒围巾、晚礼服蕾丝、刺绣与珠宝。",
"12 饮食健康": "一日三餐：粥面包酸奶、香辣菜谱与细嚼慢咽。",
"13 建筑场所": "城市建筑：公寓城堡、厨房壁炉阳台与图书馆。",
"14 交通旅行": "海上航行：行程单、渡轮甲板、直升机与喷气机。",
"15 国家政府": "国家大事：议会改革、公民投票、福利与外交代表团。",
"16 社会经济": "家中生意：进出口、营收通胀、储蓄投资与工资折扣。",
"17 法律法规": "法庭一日：法规协议、证人嫌疑犯、法官量刑与立法。",
"18 沙场争锋": "历史书里的老战役：围城、武器盾盔、战略与纪念碑。",
"19 社会角色": "街坊邻里：渔民祖父、家庭主妇、房东房客与同事。",
"20 行为动作": "Leo 的一天：打招呼备书包、瞥钟赶车、专心听课与回顾立志。",
"21 身心健康": "奶奶就医记：把脉问诊、卫生蛋白、生物钟焦虑与乐观疗法。",
"22 时间日期": "一年过去：周年纪念日、黎明即起、月考年考与终身学习。",
}

# ---- 读全部词+例句 ----
chapters = []   # [(章节名, [(word, phon, meaning, example)])]
for f in sorted(glob.glob(os.path.join(SRC, "*.xlsx"))):
    wb = load_workbook(f, read_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    wb.close()
    title = os.path.basename(f).split("_chapter", 1)[-1].replace(".xlsx", "").strip()
    words = []
    for r in rows[1:]:
        if not r or not r[0]:
            continue
        w = str(r[0]).strip()
        if not w or w.lower() == "word":
            continue
        p = str(r[1]).strip() if len(r) > 1 and r[1] else ""
        m = str(r[2]).strip() if len(r) > 2 and r[2] else ""
        m = re.sub(r'[；;]+\s*$', '', m).strip()  # 去释义尾部分隔符（如“n. 氧气；”）
        ex = str(r[3]).strip() if len(r) > 3 and r[3] else ""
        words.append((w, p, m, ex))
    chapters.append((title, words))

vocab = {}
for title, words in chapters:
    for w, p, m, ex in words:
        k = w.lower()
        if k not in vocab:
            vocab[k] = {"p": p, "m": m}

# ---- 词形匹配: 在例句里找词(含常见变形), 命中则打标记 ----
IRREG = {  # 不规则变形手动表(Excel例句中实际出现的)
    "steal": "stole", "rob": "robbed", "occur": "occurred", "withdraw": "withdrew",
    "swear": "swore", "grab": "grabbed", "fulfil": "fulfilled", "omit": "omitted",
    "drop": "dropped", "cram": "crammed", "chop": "chopped", "trap": "trapped",
    "drip": "dripping", "tap": "tapped", "itch": "itchy", "simultaneous": "simultaneously",
    "skim": "skimmed", "infer": "inferred", "flip": "flipped", "hop": "hopped",
}
HYPH_REPL = {"eco-friendly": "ecofriendly", "short day": "short-day", "all round": "all-round",
             "byproduct": "by-product"}

def inflections(w):
    if w in IRREG:
        return {w, IRREG[w]}
    if w in HYPH_REPL:
        return {HYPH_REPL[w]}
    outs = {w, w + "s", w + "es", w + "ed", w + "ing"}
    if w.endswith("e"):
        base = w[:-1]
        outs |= {w + "d", base + "ing"}
    if w.endswith("y") and len(w) > 2 and w[-2] not in "aeiou":
        outs |= {w[:-1] + "ies", w[:-1] + "ied", w[:-1] + "ier", w[:-1] + "iest"}
    # 双写辅音: run->running
    if (len(w) >= 3 and w[-1] not in "aeiouwxy"
            and w[-2] not in "aeiou" and w[-1] != w[-2] and w[-2] == w[-3]):
        outs |= {w + w[-1] + "ing", w + w[-1] + "ed"}
    return outs

def mark(ex, w):
    """返回 (标注后句子, 是否命中)"""
    if not ex:
        return None, False
    key = w.lower()
    for cand in sorted(inflections(key), key=len, reverse=True):
        m2 = re.search(r"(?<![a-zA-Z])" + re.escape(cand) + r"(?![a-zA-Z])", ex, re.I)
        if m2:
            a, b = m2.span()
            return ex[:a] + "[[%s:%s]]" % (key, ex[a:b]) + ex[b:], True
    return None, False

miss = []
sections_js = []
seen_word = set()
for title, words in chapters:
    sents, ch_covered = [], []
    for w, p, m, ex in words:
        k = w.lower()
        if k in seen_word:
            continue  # 跨章重复词只保留首次, 避免重复句
        marked, ok = mark(ex, k)
        if marked:
            sents.append(marked)
            ch_covered.append(k)
            seen_word.add(k)
        else:
            miss.append((title, w))
    paras = [sents[i:i+8] for i in range(0, len(sents), 8)]
    sections_js.append({"title": title,
                        "paragraphs": paras,
                        "zh": ZH.get(title, ""),
                        "words": list(dict.fromkeys(ch_covered))})

chapters_js = [{"title": t, "words": [w for w, _, _, _ in ws]} for t, ws in chapters]

data_sections = json.dumps(sections_js, ensure_ascii=False)
data_vocab = json.dumps(vocab, ensure_ascii=False)
data_chapters = json.dumps(chapters_js, ensure_ascii=False)

with open(OUT, encoding="utf-8") as f:
    html = f.read()
pat = re.compile(r"const SECTIONS = .*?;\nconst VOCAB = .*?;\n(?:const CHAPTERS = .*?;\n)?", re.S)
new_block = ("const SECTIONS = " + data_sections + ";\n"
             "const VOCAB = " + data_vocab + ";\n"
             "const CHAPTERS = " + data_chapters + ";\n")
if pat.search(html):
    html = pat.sub(lambda m: new_block, html, count=1)
else:
    raise SystemExit("未找到注入点")
with open(OUT, "w", encoding="utf-8") as f:
    f.write(html)

total_marks = sum(len(s["words"]) for s in sections_js)
n_sents = sum(len(x) for s in sections_js for x in s["paragraphs"])
print(f"章节:{len(sections_js)}  词库:{len(vocab)}  文中标注:{total_marks}  句子:{n_sents}  未匹配:{len(miss)}")
if miss:
    print("未匹配样例(前20):", miss[:20])
