#!/usr/bin/env python3
"""辨析卡全量重构 v4 引擎（2026-10-12，dry-run，不写盘）。

在 v3（work/cmp_clean_engine.py）基础上按实测语料修订：
  - v3 的「量词化（6 次→多次）」撤销：计数是内容（「6 次全是」），保留阿拉伯数字；
    只删「位置编号」（476、1327、1656–1681、段 39）这类学习者读不懂的指路号。
  - 坐标翻译不删不换：本书/全书→课文；本段/同段/段内→课文里；全库→所有词条；
    卡上→卡片上（回退）；卡上例句→例句（先行）。
  - 术语翻译扩到全部字段：词伙→搭配、书证→用例、档→义项、落点→译法/对应、槽位→位置。
  - 断句删除（clean_c）收窄到纯元信息（审核组/未打标记/见出处清单/不进表…），
    不再吃「对举/两卡都/本组」这类可能带内容的段——带内容的改走 PATCH 表逐条精修。
  - pos 专项：POS_MAP 覆盖全部非纯标签取值（113 种，逐条人工核过），
    通用回退=取词性标签序列 + 受控限定词（可数/单复数/及物/定语位…），其余尾注丢弃。
  - 结构清理：清洗后全空的 diff 行整行丢、全空的 dim 组连同小标题丢；
    items 里空的 sense/core/scene 不动（数据保留），丢行逻辑只针对 diff。

输出：work/cmp_v4_review.txt（典型卡前后对照）+ work/cmp_v4_resid.txt（验收残余）。
跳过 eg（门禁 16）。
"""
import json
import re
import sys
from collections import Counter

sys.path.insert(0, 'work')
from dim_normalize import dim_norm  # noqa: E402

# ======================= 1) 括号 =======================
# 强维护词：括号里带这些 → 整括号丢（对学习者无信息）
BRACKET_KILL = re.compile(
    r'卡上|卡词伙|卡有|卡同|卡里|没有卡|本书|全书|全库|书证|词伙|审核|未打标记|未标|'
    r'grep|自查|登记|硬约束|只报备|不进|条例句|段\s*\d|章\s*\d|组\s*\d|原句|同一处|同源|'
    r'见出处|出处清单|都这样|计数|一栏|进表'
)
# 括注里「卡上例句，当宾语」这类混合注：拆开后只保留短属性碎片（当…/带…/零冠词…），
# 「宾语是 dinner」这种带内容的丢弃（丢弃后语义仍完整）。
ATTR_KEEP = re.compile(r'^(?:当|带|加|用|作|接|跟|配|零冠词|单数|复数|不带|不加|光着尾|无冠词|只作|只见|译文)')


def _split_parts(inner):
    parts, cur, depth = [], '', 0
    for ch in inner:
        if ch in '「『（(':
            depth += 1
        elif ch in '」』）)':
            depth = max(0, depth - 1)
        if depth == 0 and ch in '，,；;、':
            parts.append(cur)
            cur = ''
        else:
            cur += ch
    if cur:
        parts.append(cur)
    return parts


def clean_bracket(inner):
    if re.fullmatch(r'[\s\d]*', inner):
        return ''
    if re.match(r'^\s*\d+\s*[处条个次句点]', inner):
        return ''
    if re.match(r'^\s*\d+\s*等[^）)]*[处条个次]', inner):
        return ''
    if re.fullmatch(r'\s*\d{1,4}\s*[–—-]\s*\d{1,4}\s*', inner):
        return ''
    if re.fullmatch(r'\s*[\d\s、,，/]+(?:[两一二三四五六七八九十]\s*[处条个次句])?\s*', inner):
        return ''
    if BRACKET_KILL.search(inner):
        keep = [p.strip() for p in _split_parts(inner)
                if p.strip() and not BRACKET_KILL.search(p) and ATTR_KEEP.match(p.strip())]
        if not keep:
            return ''
        inner = '，'.join(keep)
    r = inner
    r = re.sub(r'〔\s*\d+\s*〕', '', r)
    r = re.sub(r'^\s*\d{1,4}\s*[:：]\s*', '', r)
    # —— 「悬空助词」防线·括号版（2026-10-12 第三轮；与 kill_nums 同款，必须排在通用删号**前**）——
    # 教训：「（1219 是其中一处）」「（853 的 perfect）」这类编号在本级就被删了，
    # kill_nums 级再补的规则看不到编号、救不回来，只会留下「（是…」「（的…」。
    r = re.sub(r'(?<![\w\d.])\d{1,4}(?:\s*[、,，]\s*\d{1,4})*\s*的(?=\s*[A-Za-z\u4e00-\u9fa5])', '', r)
    # 「与 1577 是同一处」：编号在「是」前，先整体接住，别让下一条 A2 拆成「与同一处」
    r = re.sub(r'与\s*\d{1,4}\s*是同一(?=[处句])', '与课文里的是同一', r)
    r = re.sub(r'(?<![\w\d.])\d{1,4}(?:\s*[、,，]\s*\d{1,4})*\s*是(?=\s*[A-Za-z\u4e00-\u9fa5])', '', r)
    r = re.sub(r'(?<![\w\d.])\d{1,4}(?:\s*[、,，]\s*\d{1,4})*\s*译(?=\s*[「"“])', '', r)
    r = re.sub(r'与\s*\d{1,4}\s*同(?=[一源串句处型])', '与课文同', r)
    # 两条数字删除都要避开计数单位（「写法 0 处」的 0 是计数，不是坐标；2026-10-12 修）
    r = re.sub(r'(?<=[\u4e00-\u9fa5])\s+\d{2,4}\s+(?![处条个次句点位种例张])', ' ', r)
    r = re.sub(r'([，,、；;：:])\s*\d{1,4}\s+(?=[A-Za-z])', r'\1', r)
    r = re.sub(r'(?:^|(?<=[，,、\s/]))\d{1,4}(?!\s*[处条个次句点位种例张])(?=[，,、：:\s/]|\s*$)', '', r)
    r = re.sub(r'、\s*$', '', r)
    r = re.sub(r'^[\s，,、/]+', '', r)
    r = re.sub(r'[\s，,、/]+$', '', r).strip()
    if not r:
        return ''
    return ('（' + r + '）') if r != inner else None


PAREN = re.compile(r'[（(]([^）)]*)[）)]')


def clean_parens(s):
    return PAREN.sub(lambda m: (lambda r: m.group(0) if r is None else r)(clean_bracket(m.group(1))), s)


# ======================= 2) 坐标 + 术语 =======================
COORD = [
    (re.compile(r'卡上例句的?第一句'), '例句'),
    (re.compile(r'卡上例句'), '例句'),
    (re.compile(r'卡例句'), '例句'),
    (re.compile(r'卡有词伙'), '卡片里有搭配'),
    (re.compile(r'卡上词伙'), '搭配'),
    (re.compile(r'卡词伙'), '搭配'),
    (re.compile(r'卡上释义'), '释义'),
    (re.compile(r'卡上同义词'), '同义词'),
    (re.compile(r'卡上现成块'), '卡片里的现成搭配'),
    (re.compile(r'卡上零词伙'), '卡片里没有搭配'),
    (re.compile(r'本书|全书'), '课文'),
    (re.compile(r'全库'), '所有词条'),
    (re.compile(r'本段|这一段|同段里|同段|段内'), '课文里'),
    (re.compile(r'卡里'), '卡片里'),
    (re.compile(r'卡侧'), '卡片上'),
    (re.compile(r'卡上'), '卡片上'),
    (re.compile(r'课文课文'), '课文'),
    (re.compile(r'课文里里'), '课文里'),
    (re.compile(r'[，,]?\s*不进本组[^。；，,]*'), ''),
    (re.compile(r'本组'), '这组词'),
]

TERM = [
    (re.compile(r'词伙'), '搭配'),
    (re.compile(r'书证'), '用例'),
    (re.compile(r'现成块'), '现成搭配'),
    (re.compile(r'可背块'), '可背搭配'),
    (re.compile(r'物证'), '证据'),
    (re.compile(r'句框'), '句式'),
    (re.compile(r'架子'), '句式'),
    (re.compile(r'框架'), '结构'),
    (re.compile(r'槽位'), '位置'),
    (re.compile(r'栏位'), '栏目'),
    (re.compile(r'抢生意'), '同场'),
    (re.compile(r'露过脸|露过面'), '出现过'),
    (re.compile(r'中文落点'), '中文译法'),
    (re.compile(r'找不到落点'), '对不上'),
    (re.compile(r'的落点'), '的用法'),
    (re.compile(r'落点'), '用法'),  # 安全网：裸用落点全库仅 3 处（已由 RAW_PATCHES 定向改写），此条兜底防漏
    (re.compile(r'另有'), '还有'),
    # 档系（避「掉档」，含拆词「掉了档」）
    (re.compile(r'哪一档|哪档'), '哪个义项'),
    (re.compile(r'这一档|这档'), '这个义项'),
    (re.compile(r'那一档|那档'), '那个义项'),
    (re.compile(r'另一档'), '另一个义项'),
    (re.compile(r'第一档'), '第一个义项'),
    (re.compile(r'第二档'), '第二个义项'),
    (re.compile(r'第三档'), '第三个义项'),
    (re.compile(r'两档'), '两个义项'),
    (re.compile(r'三档'), '三个义项'),
    (re.compile(r'四档'), '四个义项'),
    (re.compile(r'几档'), '几个义项'),
    (re.compile(r'多档'), '多个义项'),
    (re.compile(r'一档'), '一个义项'),
    (re.compile(r'档数'), '义项数'),
    (re.compile(r'名义首档'), '名义上的第一个义项'),
    (re.compile(r'首档'), '第一个义项'),
    # 档位/档次另有专译，别误伤（曾产出「义项位」「义项次」）；
    # 第三轮再加保护：搭档/高档/归档/档案（「档」在这些词里是别义，曾产出「搭义项」）——2026-10-12
    (re.compile(r'(?<!掉)(?<!了)(?<![搭高归])档(?![位次案])'), '义项'),
    # 杂项术语
    (re.compile(r'[，,]?\s*见出处清单[^。；，,]*'), ''),
    (re.compile(r'出处'), '用例'),
    (re.compile(r'卡\s*同义词栏|卡\s*的同义词栏|卡上同义词栏'), '的同义词栏'),
    (re.compile(r'卡\s*同义词|卡\s*的同义词'), '的同义词'),
    (re.compile(r'书里|书内'), '课文里'),
    (re.compile(r'别的卡(?![片])'), '别的卡片'),
    (re.compile(r'三词'), '三个词'),
    (re.compile(r'两词'), '两个词'),
    # 厚薄系（作者用「厚/薄」指例子多少，学习者话要说穿）
    (re.compile(r'最薄的一侧之一'), '例子最少的一侧之一'),
    (re.compile(r'最薄的一侧'), '例子最少的一侧'),
    (re.compile(r'最薄的一边'), '例子最少的一边'),
    (re.compile(r'最厚的一侧'), '例子最多的一侧'),
    (re.compile(r'最厚的一档'), '例子最多的一个义项'),
    (re.compile(r'厚的一边'), '例子多的一边'),
    (re.compile(r'厚薄差'), '例子多少的差别'),
    (re.compile(r'厚薄'), '例子多少'),
    (re.compile(r'厚度'), '例子'),
    (re.compile(r'厚一点'), '例子多一点'),
    (re.compile(r'更薄'), '例子更少'),
    (re.compile(r'最薄的'), '例子最少的'),
    (re.compile(r'薄侧'), '例子少的一侧'),
    (re.compile(r'薄的一侧'), '例子少的一侧'),
    (re.compile(r'薄的程度和'), '例子少得和'),
    (re.compile(r'vocab\.json'), '词表'),
    # —— 卡/卡片家族（2026-10-12 第三轮收口）——
    # 教训：这些规则必须 (a) 长模式在前、裸「张卡」在后；(b) 全部带 (?![片]) 保护——
    # 否则对已含「卡片」的原文二次触发，产出「卡片片 / 词条片」伪影（本轮扫出并修掉 36 处）。
    (re.compile(r'还没卡(?![片])'), '还没收录'),
    (re.compile(r'没有卡(?![片])'), '没有收录'),
    (re.compile(r'都没卡(?![片])'), '都没收录'),
    (re.compile(r'没卡可用'), '没有可换的'),
    (re.compile(r'另一张卡(?![片])'), '另一个词条'),
    (re.compile(r'换一张卡(?![片])'), '换词条'),
    (re.compile(r'另有卡(?![片])'), '另有词条'),
    (re.compile(r'三张卡(?![片])'), '三张卡片'),
    (re.compile(r'两张卡(?![片])'), '两张卡片'),
    (re.compile(r'四张卡(?![片])'), '四张卡片'),
    (re.compile(r'张卡(?![片])'), '张卡片'),
    (re.compile(r'三卡(?![片])'), '三个词'),
    (re.compile(r'两卡(?![片])'), '两个词'),
    (re.compile(r'四卡(?![片])'), '四个词'),
    # 「N 卡里/上」会先被 COORD 的「卡里/卡上」接成「N卡片里」——补上量词（N张卡片）
    (re.compile(r'([一二三四五六七八九两])卡片'), r'\1张卡片'),
    # 修：原目标「没有词条的」+身后的「的词」→「没有词条的的词」（cope 卡扫出）。目标须为「没有词条」。
    (re.compile(r'没卡(?=的)'), '没有词条'),
    (re.compile(r'自己的卡(?![片])'), '自己的卡片'),
    (re.compile(r'(?<=处)卡(?![片车])'), '卡片'),
    (re.compile(r'动词卡(?![片])'), '动词卡片'),
    (re.compile(r'读卡(?![片])'), '读卡片'),
    (re.compile(r'条卡(?![片])'), '条卡片'),
    (re.compile(r'跨卡(?![片])'), '跨卡片'),
    (re.compile(r'换卡(?![片])'), '换卡片'),
    (re.compile(r'卡句(?![片])'), '卡片例句'),
    (re.compile(r'卡(?=[与和])'), '卡片'),
    (re.compile(r'卡(?=的)'), '卡片'),
    (re.compile(r'[（(]卡(?![片车])[）)]'), '（卡片）'),
    (re.compile(r'(?<=["”」』])卡(?![片车])'), '卡片'),
    (re.compile(r'旁卡(?![片])'), '旁边的卡片'),
    (re.compile(r'本卡(?![片])'), '这张卡片'),
    (re.compile(r'成员卡(?![片])'), '成员卡片'),
    (re.compile(r'词头卡(?![片])'), '词条'),
    (re.compile(r'有卡(?![片])'), '有卡片'),
    (re.compile(r'卡面'), '卡片上'),
    (re.compile(r'卡文本'), '卡片文本'),
    (re.compile(r'卡译句'), '卡片译文'),
    (re.compile(r'卡外'), '卡片之外的'),
    (re.compile(r'卡栏'), '卡片栏目'),
    (re.compile(r'卡本身'), '卡片本身'),
    (re.compile(r'卡给'), '卡片给'),
    (re.compile(r'卡没(?=[演示])'), '卡片没'),
    (re.compile(r'课文[、＋]卡(?![片])'), '课文与卡片'),
    (re.compile(r'卡自己的'), '自己的'),
    (re.compile(r'卡自己'), '自己'),
    (re.compile(r'卡\s*(?=\d)'), '卡片 '),
    # 「X 卡（英文）」＝某某卡里给的例句，须先于裸卡规则；「卡：+英文」同理
    (re.compile(r'(?<=[A-Za-z]) 卡 (?=[A-Z])'), ' 卡片里是 '),
    (re.compile(r'卡：(?=\s*[A-Z])'), '卡片里是 '),
    (re.compile(r'(?<=[A-Za-z]) 卡(?![片车])'), ' 卡片'),
    # 「点名」家族（2026-10-12 第三轮重写）：原单条「点名→列了」两处翻车——
    # ① 误伤「不接地点名词」里的「地点名」（产出「地列了词」）；②「点名了」产出「列了了」。
    # 长模式在前；(?<!地) 挡住「地点名词」；疾病/引用/报价/战术等语境已由 RAW_PATCHES 定向改写。
    (re.compile(r'互相点名'), '互相收录'),
    (re.compile(r'互不点名'), '互不收录'),
    (re.compile(r'(?<!地)点名了'), '收录了'),
    (re.compile(r'(?<!地)点名'), '收录'),
    (re.compile(r'两頭'), '两头'),
    # 台账语 → 普通说法（保留内容，只换腔调）
    (re.compile(r'只活在'), '只在'),
    (re.compile(r'登记'), '收录'),
    (re.compile(r'这样用过'), '这么用过'),
    (re.compile(r'全部证据只有'), '全部例子只有'),
    (re.compile(r'证据只有'), '例子只有'),
    (re.compile(r'同属'), '也属'),
    (re.compile(r'整段就是语料'), '那一段全是例子'),
    (re.compile(r'语料'), '例子'),
    (re.compile(r'数据里没有任何标记[，,]?'), ''),
    (re.compile(r'[——]?所以表里不写[^。；]*'), ''),
    (re.compile(r'[——，,]?(?:课文)?计数结论[^。；]*'), ''),
    (re.compile(r'[——，,]?这是分布[^。；]*'), ''),
    (re.compile(r'[，,]?不是禁令[^。；]*'), ''),
    (re.compile(r'这一格不是禁令，只是'), ''),
    (re.compile(r'[，,]?按硬约束[^。；，,]*'), ''),
]

# ======================= 3) 元信息断句删除 =======================
# 收窄到「翻不成学习者话」的台账语（能翻译的都在 TERM 里换成普通说法，不在这里删）。
SEG_DEL = re.compile(
    r'审核组|未打标记|未标|只报备|不进表|不进成员|不进默认行|不进|见出处清单|见出处|'
    r'已\s*grep|自己\s*grep|自查过|订正[:：]|更正[:：]|这一批|上一批|这批|'
    r'都这样|这样用|计数结论|不是禁令|禁令|归组|并入|另计|不另计|'
    r'硬约束|黑话|留痕|台账|锚在|锚点|缺省|默认行|表里不写|正文只|照抄|'
    r'算\s*1\s*条|这一条只是|顺带一提|另外记|备注[:：]|两卡都|两卡的|两卡里'
)


def split_segs(s):
    segs, cur, depth = [], '', 0
    for ch in s:
        if ch in '「『（(':
            depth += 1
        elif ch in '」』）)':
            depth = max(0, depth - 1)
        cur += ch
        if depth == 0 and re.match(r'[；;。！？!?、.]', ch):
            segs.append(cur)
            cur = ''
    if cur:
        segs.append(cur)
    return segs


def clean_segs(s):
    kept = []
    for seg in split_segs(s):
        core = re.sub(r'^[\s；;、，,：:—\-]+', '', seg)
        if not core.strip():
            continue
        if SEG_DEL.search(core):
            continue
        kept.append(seg)
    return ''.join(kept)


# ======================= 4) 编号清理 =======================
# 计数单位（数字保留）：处 次 条 个 位 种 例 张（「句」用阈值判：<=30 计数，>30 编号）
CNT_UNIT = '处次条个位种例张'


def kill_nums(s):
    s = re.sub(r'(?<![\w\d.])\d{2,4}\s*[–—]\s*\d{2,4}', '', s)            # 1656–1681
    s = re.sub(r'(?<![\w\d.])\d{2,4}\s*[~～至]\s*\d{2,4}', '', s)           # 1656~1681
    # 中文语境里的「767 / 768」「1316 / 1334 / 1591 / 1694」链式编号：整链删除。
    # 单杀会留一个光秃秃的「 / 」（如「搭配就是 / 这两句」），所以先按整链处理。
    s = re.sub(r'(?<![\w\d./])\d{1,4}(?:\s*/\s*\d{1,4})+\s*(?=[，。；、）"」』]|[\u4e00-\u9fa5])', '', s)
    s = re.sub(r'段\s*\d+\s*(?:的|里|中)?', '课文里', s)                     # 段 39 的 → 课文里
    s = re.sub(r'组\s*\d+\s*(?:的|里|中)?', '这一组', s)
    # 「；726 no costly…」编号被删后留下的「分隔符+空格+英文」：塌回分隔符
    s = re.sub(r'([；;、，,：:])\s*0?\d{1,4}\s+(?=[A-Za-z])', r'\1', s)
    # —— 「悬空助词」防线（2026-10-12 第三轮全库排查新增；每条都对应实测残片）——
    # 「853 的 perfect」「1219 的 protocol」「：1145 是老林」（1219 是其中一处）：编号单删会留
    # 光杆「的/是」，比原文更难读；整段「编号（含顿号连写）+ 的/是」一起删。
    # 计数有「处次条个…」隔在中间，命中不到；Task/task 前缀照旧豁免（负向后顾防「Task 2 的」类）。
    s = re.sub(r'(?<![\w\d.])(?<!Task )(?<!task )\d{1,4}(?:\s*[、,，]\s*\d{1,4})*\s*的(?=\s*[A-Za-z\u4e00-\u9fa5])', '', s)
    # 「与 1577 是同一处」：编号在「是」前，先整体接住，别让下一条 A2 拆成「与同一处」
    s = re.sub(r'与\s*\d{1,4}\s*是同一(?=[处句])', '与课文里的是同一', s)
    s = re.sub(r'(?<![\w\d.])(?<!Task )(?<!task )\d{1,4}(?:\s*[、,，]\s*\d{1,4})*\s*是(?=\s*[A-Za-z\u4e00-\u9fa5])', '', s)
    # 「1689 译「…」」：标点/行首处连「译」一起删（「／1687 译」→「／「…」」）；
    # 「本书 1773 译「…」」词主处保留「译」（「本书译「…」」，与后面「卡上例句译…」并列一致）。
    s = re.sub(r'(^|[（(、，,；;：:／/])\s*\d{1,4}(?:\s*[、,，]\s*\d{1,4})*\s*译(?=\s*[「"“])', r'\1', s)
    s = re.sub(r'(?<=[\u4e00-\u9fa5])\s*\d{1,4}(?:\s*[、,，]\s*\d{1,4})*\s*译(?=\s*[「"“])', '译', s)
    # 「与 157 同一场景」「与 991 同型」：编号没了「与同一…/与同型」缺参照 → 换成「与课文同…」。
    s = re.sub(r'与\s*\d{1,4}\s*同(?=[一源串句处型])', '与课文同', s)
    # 场景清单的「664：老人…」「618、633：体育馆…」：编号+全角冒号整删（只认全角：；
    # 半角「12:30」类时间不受影响——后顾数字边界 + 前瞻汉字/字母才命中）。
    s = re.sub(r'(?<![\w\d.])0?\d{1,4}(?:\s*[、,，]\s*\d{1,4})*\s*：(?=[\u4e00-\u9fa5A-Za-z])', '', s)

    def kill(m):
        i, j = m.start(), m.end()
        ctx = s[max(0, i - 8):i]
        if re.search(r'(?:Task|Part|task|part)\s*$', ctx):
            return m.group(0)                                               # Task 2
        if i > 0 and s[i - 1] in './·':
            return m.group(0)
        if j < len(s) and s[j] in '%％':
            return m.group(0)
        tail = s[j:j + 3]
        mt = re.match(r'\s*([\u4e00-\u9fa5])', tail)
        if mt and mt.group(1) in CNT_UNIT:
            return m.group(0)                                               # 6 次：计数保留
        mt = re.match(r'\s*句', tail)
        if mt and int(m.group(0)) <= 30:
            return m.group(0)                                               # 3 句：计数
        return ''
    s = re.sub(r'(?<![\w\d.])0?(\d{1,4})(?![\w\d.])', kill, s)
    return s


# ======================= 5) 收尾修复 =======================
def polish(s):
    # 伪影兜底（规则二次触发残片；根上已加 (?![片]) 保护，这里双保险）
    s = s.replace('卡片片', '卡片').replace('词条片', '词条')
    s = re.sub(r'（\s*）|\(\s*\)', '', s)
    # 全角「＋」并入（2026-10-12 第三轮：raw 里 ASCII/全角混用，只收 ASCII 会漏 27 处）
    s = re.sub(r'\s*[+＋]\s*(?=[A-Za-z]+\.(?:\s|$))', '；', s)               # 「微量 + v. 追踪」→「微量；v. 追踪」
    s = re.sub(r'\s*[+＋]\s*', '、', s)
    s = re.sub(r'[：:]\s*[、，,；;]+\s*', '：', s)                             # 「话题：、说」→「话题：说」
    s = re.sub(r'、\s*(?=[，,；;。：:、]|$)', '', s)
    s = re.sub(r'[；;]{2,}', '；', s)
    s = re.sub(r'[，,]{2,}', '，', s)
    s = re.sub(r'（[；;，,、]', '（', s)
    s = re.sub(r'\s{2,}', ' ', s)
    s = re.sub(r'\s*——\s*', '——', s)
    # 中文夹空（「课文 前面是」→「课文前面是」）；中英边界不动
    s = re.sub(r'(?<=[\u4e00-\u9fa5])\s+(?=[\u4e00-\u9fa5])', '', s)
    s = re.sub(r'(?<=[\u4e00-\u9fa5])\s+(?=[，。；：、）」』])', '', s)
    # 全角「／」并进塌缩家族（2026-10-12）：编号删除后残留「／ 译」/「／ 「A」」类空隙
    s = re.sub(r'(?<=[，。；：、／])\s+(?=[\u4e00-\u9fa5])', '', s)
    s = re.sub(r'(?<=[，。；：、／])\s+(?=[A-Za-z“”"「『])', '', s)
    s = re.sub(r'^[\s；;、，,：:—\-]+', '', s)
    s = re.sub(r'[\s；;、,，:：\-]+$', '', s)
    s = re.sub(r'^—+\s*', '', s)
    s = re.sub(r'\s*—+\s*$', '', s)
    s = re.sub(r'（\s*）|\(\s*\)', '', s)
    # 「课文 1 + 卡 1」→（数字先被杀）→「课文、卡」：放在 polish 末尾，等「+→、」转换完再收口
    s = re.sub(r'课文\s*[、，,＋+]\s*卡(?![片])', '课文与卡片', s)
    # —— 第四轮兜底（2026-10-12）——
    s = s.replace('课文在课文里', '课文里')        # 「本书在课文里」经 本书→课文 后的叠加去重（agreement 卡实测）
    s = re.sub(r'（的\s*', '（', s)                # 括号内只剩「的」的兜底（正文编号+的 已由 kill_nums 处理）
    s = re.sub(r'\s*[、，,]\s*(?=[）)])', '', s)   # 「（卡词伙 + 55）」→「（卡词伙、）」的尾随顿号
    return s.strip()


# ======================= 6) 全管线 =======================
def clean_full(s):
    if not s or not isinstance(s, str):
        return s or ''
    o = clean_parens(s)
    for pat, rep in COORD:
        o = pat.sub(rep, o)
    for pat, rep in TERM:
        o = pat.sub(rep, o)
    o = clean_segs(o)
    o = kill_nums(o)
    o = polish(o)
    return o


# ======================= 7) pos 专项 =======================
POS_MAP = {
    'v.／n.': 'v. / n.', 'v.；n.': 'v. / n.', 'n.；v.': 'n. / v.', 'n.／v.': 'n. / v.',
    'n. + adj.': 'n. / adj.', 'n. + v.': 'n. / v.', 'v. + adj.': 'v. / adj.', 'v. + n.': 'v. / n.',
    'n. 与 v.': 'n. / v.', 'adj. 兼 n.（卡上释义两档，本书只用到 adj.）': 'adj. / n.',
    'v. 兼 n.（卡上释义两档，本书两档都用过）': 'v. / n.', 'n. 兼 v.（卡上释义两档，本书只用到 n.）': 'n. / v.',
    # 无标签开头 → 补标签、丢尾注
    '卡上释义只给动词一档': 'v.', '卡上释义只给名词一档': 'n.',
    '卡上释义标的是 phrase.（不是 n.）': 'n.', '卡上词条类型写的就是 phrase.（复合说法）': 'n.',
    '本段是副词；卡上另给 adj. 档': 'adv. / adj.',
    '卡上 n. + adj.；本段是形容词用法': 'n. / adj.',
    '本书 1 处全是 v.；卡上释义另给「n. 品种」，本书 0 例': 'v. / n.',
    '卡上释义给名词 + 动词两档（引文／引用；另有「报价」一档本书没用）': 'n. / v.',
    '卡上释义两档：名词 + 抽象的': 'n. / adj.',
    '卡上释义两档：名词「假设」+ 动词「假定」': 'n. / v.',
    'v.（卡上档）；1783 处是名词': 'n. / v.',
    # 带尾注 → 收干（尾注丢）
    'adj.（卡上只给 adj.）': 'adj.', 'n.（卡上另挂 v.）': 'n.', 'adj.（卡上只给 adj.，本书 5 处全贴在名词前）': 'adj.',
    'n. 与 adj. 两档挂在同一张卡上': 'n. / adj.', 'n. + adj.（本书两档都用上了）': 'n. / adj.',
    'n. + adj.（本书两处都是 n.）': 'n. / adj.', 'n. 与 v.（本书 4 处标记全是 n.）': 'n. / v.',
    'n.（卡上释义另有一档 v.）': 'n.', 'adv.（本书 5 条串里 4 条紧跟动词）': 'adv.',
    'adv.（卡上释义另给 adj. 海外的）': 'adv.', 'n.（本书带 the，卡上例句零冠词）': 'n.',
    'adj.（卡上释义只给形容词一档）': 'adj.', 'n.（卡另给 v.）': 'n.', 'v.（卡上另挂 n.）': 'v.',
    'n.（本书这处）；卡上 n. + v.': 'n. / v.', 'v.（本书这处）；卡上 v. + n.': 'v. / n.',
    'n.（卡上释义另给了 adj. 一档）': 'n.', 'adj.（卡上另给 n.）': 'adj.', 'n.（卡上另给 adj.）': 'n.',
    'n.（卡上释义也标 v.，本书两处全是名词位）': 'n.', 'v.（卡上释义也标 n.，本书这一处是动词位）': 'v.',
    'v.（另 n. 反面）': 'v.', 'v.（另 n. 淤泥）': 'v.', 'n.（卡另给 v. 两档，本书未用）': 'n.',
    'n.（卡上释义另有 v. 档，本书无书证）': 'n.', 'n.（另 v. 刺激）': 'n.', 'n.（另 v. 调查）': 'n.',
    'n.（另 v. 勘测）': 'n.', 'n.（卡上没给 v.，本书也没有动词用法）': 'n.',
    'v.（卡上没给 n.，本书也没有名词用法）': 'v.', 'n.（卡上释义自标"复数词形"）': 'n.',
    'v.（卡上释义另列 n. 一档，本书没用）': 'v.', 'n.（卡上释义另列 v. 一档，本书那 4 处没走到）': 'n.',
    'n.（本书全部零冠词）': 'n.', 'n.（本书零冠词）': 'n.', 'n.（卡上释义只有名词一档）': 'n.',
    'v. 及物（卡上释义只有这一档）': 'v. 及物', 'prep.（本书 1 处只用到这一档；卡上释义另有 adj. 负的、n. 缺点）': 'prep.',
    'n.（本书唯一用到的词性；卡上释义另列 v.「询问；怀疑」，本书无书证）': 'n.',
    'adj.（卡上释义另列 n.「寓意」，本书无名词书证，不进表）': 'adj.',
    '本段是形容词（卡上释义给三档：adj. 陌生的 / n. 外星人 / n. 外国人）': 'adj.',
    'n.（课文那处带 that；零冠词只在卡上词伙里，如 natural gas exploration）': 'n.',
    'n.（说公司之间那股劲时前面什么都不挂）': 'n.',
    'n. 只有复数形（全库搜不到单数 outskirt）': 'n. 只有复数形',
    'n. 单复同形（卡上例句 three offspring；全库搜不到 offsprings）': 'n. 单复同形',
    'n. 可数（本书 1 处，单数带 a）': 'n. 可数',
    'n. 可数（本书 1 处，单数带 a；全库搜不到复数形）': 'n. 可数',
    'n. 可数（课文里被 each 数着）': 'n. 可数', 'n. 可数（本书 3 处全带 a / the）': 'n. 可数',
    'n. 可数（本书 1 处单数；卡上词伙三条都给了复数形）': 'n. 可数',
    'n. 可数（本书 1 处，单数带 the）': 'n. 可数', 'n. 可数（复数 tales）': 'n. 可数',
    'n. 可数（复数 stories）': 'n. 可数', 'n. 可数（带队伍、有去处）': 'n. 可数',
    'n.（课文里零冠词，跟在 bring 后）': 'n.',
    'v. 及物（本书 1 处，原形）': 'v. 及物', 'v.（本书 2 处都无宾语）': 'v.',
    'v.（本书只有动词用法）': 'v.', 'adj.（本书 5 处全在名词前）': 'adj.',
    'adj. 本书只见定语位': 'adj. 只见定语位', 'adj. 本书只见定语位（卡上例句在系动词后）': 'adj. 只见定语位',
    'v.；另档 adj.': 'v. / adj.', 'n. 活动/行业名，本书不带 a': 'n. 活动/行业名',
    'v. 及物，后接名词（念头 / 器官 / 消费）': 'v. 及物，后接名词',
    'v. 喂（275）+ n. 饲养（卡上释义原文只有「v. 喂；n. 饲养」两档，本书 303 就是名词、译「讨吃的」）': 'v. / n.',
    'n. 痕迹；微量 + v. 追踪（卡上释义两档都有）': 'n. / v.',
    'v. 追踪 + n. 轨道；跑道（卡上释义）': 'v. / n.',
    'v. + n.（本书两档都用上了）': 'v. / n.', 'v. + n.（n. 只在卡上例句）': 'v. / n.',
    'n. + v.（卡上释义带动词档）': 'n. / v.',
}
POS_TAIL = re.compile(r'^(n|v|adj|adv|prep|pron|conj|num|vt|vi)\.$')
POS_KEEP_TAIL = re.compile(r'^(：?(?:可数|不可数|单复同形|及物|不及物|只见定语位|只见表语位|后接人|后接名词|只有复数形|只有名词|活动/行业名))')


def pos_clean(p, sense):
    p = (p or '').strip()
    if not p:
        return p
    if p in POS_MAP:
        return POS_MAP[p]
    if re.fullmatch(r'(n|v|adj|adv|prep|pron|conj|num)\.', p):
        return p
    # 通用回退：抽词性标签序列 + 受控限定词；抽不到就从 sense 借
    m = re.match(r'^([A-Za-z]+)\.((?:\s*(?:[／/+；;,，]|\s)\s*[A-Za-z]+\.)*)', p)
    if m:
        tags = [m.group(1)] + re.findall(r'([A-Za-z]+)\.', m.group(2))
        out = ' / '.join(t + '.' for t in tags)
        rest = p[m.end():].strip()
        mt = POS_KEEP_TAIL.match(rest)
        if mt:
            out += ('，' if rest.startswith('后接') else ' ') + mt.group(1)
        return out
    # 没有标签：问 sense 借
    ms = re.match(r'^([A-Za-z]+)\.', sense or '')
    return (ms.group(1) + '.') if ms else p


# ======================= 7.5) 内容级逐条 patch（在 clean 之前改原文）=======================
# 只收「清洗管线接不住、又必须保留内容」的句子；替换结果本身必须是清洗稳定点。
RAW_PATCHES = [
    ('degrade', r'diff\[\d+\]\.degrade', r'课文 44 就是它的原句', '课文里就是这句'),
    ('degrade', r'diff\[\d+\]\.deteriorate', r'全部证据只有例句一句 \+ 课文 43 一句', '只有例句一句、课文里一句'),
    ('turbulent', r'diff\[\d+\]\.turbulent', r'本组最实用的一格：想说.水在翻.只有 turbulent 有书证', '想说"水在翻"时，只有 turbulent 有用例'),
    ('ease', r'diff\[\d+\]\.relieve', r'；本组不复述.*?（上一批那张表已登记）', ''),
    ('ease', r'diff\[\d+\]\.ease', r'所以别把上一批那条"哪一头"的线外推到它身上', '别拿"心里／身上"那条线去套它'),
    ('ease', r'diff\[\d+\]\.ease', r'本组最硬的新格', '这组词里最硬的一条'),
    ('ease', r'diff\[\d+\]\.relieve', r'；这一格上一批已写实，本组只补"ease 不必换卡"', '；ease 不必换卡'),
    ('adorn', r'diff\[\d+\]\.embellish', r'——那是 decorate 卡自己的词，不进本组', '——那是 decorate 自己的例子'),
    ('gem', r'diff\[\d+\]\.jewel', r'顺带一提：课文 718 的 pale green jade ring（玉戒）也在手指那一头，可那是 jade 的卡',
     '课文里的 pale green jade ring（玉戒）也在手指那一头，但那是 jade 自己的词条'),
    ('differentiate', r'diff\[\d+\]\.both', r'——这是卡上自带的、可 grep 的分工', '——这是两个词自带的用法分工'),
    ('chin', r'diff\[\d+\]\.jaw', r'（大小 / 僵不僵），可 grep', '（大小 / 僵不僵）'),
    ('hop', r'diff\[\d+\]\.leap', r'课文里给跳法配了程度词的只有 637 的 leap high', '课文里给跳法配程度词的只有 leap high 一处'),
    ('hop', r'diff\[\d+\]\.leap',
     r'卡侧另有 kangaroo 卡上例句 The kangaroo jumps high in the Australian wild\. 一处拿 high 配 jump，那是卡不是课文，别说成"全书唯一"。over 那半句在卡上例句，课文没用',
     'jumps high 只在 kangaroo 例句里，不算课文；over 那半句也只出现在例句里'),
    ('expose', r'diff\[\d+\]\.uncover', r'与 reveal 卡同一组名单', '与 reveal 同属一组'),
    ('cite', r'diff\[\d+\]\.cite', r'cite 卡有同义词栏，可以顺着换', 'cite 有同义词栏，可以顺着换'),
    ('natural', r'diff\[\d+\]\.natural', r'本书 7 句 \+ natural 卡自己 3 条词伙（[^）]*）',
     '课文里 7 句、natural 自己的 3 条搭配（habitats / endowment / predators）'),
    ('gem', r'diff\[\d+\]\.gem', r'落点一边是项链、一边是手指', '一边落在项链、一边落在手指'),
    ('oversee', r'diff\[\d+\]\.both', r'在 vocab\.json 全书除自己那张卡外 0 次被引用', '在词表里除自己那张卡片外 0 次被引用'),
    ('individual', r'diff\[\d+\]\.individual', r'这是本组最硬的一格：卡上例句与课文同一开头，措辞可 grep',
     '例句与课文同一开头，措辞几乎逐字相同'),
    ('bet', r'diff\[\d+\]\.bet', r'同段相邻两句，bet 挂 on、gamble 挂 with，是本组最可 grep 的一格',
     '课文里相邻两句，bet 挂 on、gamble 挂 with，最能看出分工'),
    ('excuse', r'diff\[\d+\]\.excuse', r'「理由」这一落点本书译文没用过', '「理由」这个译法课文译文里没用过'),
    ('artist', r'diff\[\d+\]\.artist', r'正是 589 的译文落点（「年轻艺术家」）', '正是课文里的译文（「年轻艺术家」）'),
    ('refectory', r'diff\[\d+\]\.both', r'（全书只出现在章 2 标题「旧物店与老屋餐厅」里）', '（只在标题「旧物店与老屋餐厅」里出现过）'),
    ('hop', r'diff\[\d+\]\.jump', r'1536 在章5 段7，是本组三词里唯一一处课文里的名词用法；jump 侧的厚度全来自课文与别的卡上例句，自身卡上没词伙',
     '课文里，这是三个词里唯一的名词用法；jump 这一侧的例子全来自课文与别的例句，自己卡片上没有搭配'),
    # 落点裸用收口（原文精确匹配，逐字核对过码点；作用：把「落点」这层写卡行话说穿成学习者话）
    ('crazy', r'diff\[\d+\]\.mad', r'两档各有一处落点', '两个义项各用到一处'),
    ('clever', r'diff\[\d+\]\.both', r'smart 一次都没拿到这个落点', 'smart 一次都没拿到「聪明」这个译法'),
    ('empire', r'diff\[\d+\]\.both', r'，同一个"帝国"字面两种落点', '——同一个「帝国」，英文里分了名词和形容词两个词'),
    ('crime', r'diff\[\d+\]\.sin', r'本组是 \d+ 组里厚薄差最大的一格', '是这几组里例子多少差别最大的一组'),
    ('miserable', r'diff\[\d+\]\.miserable', r'（两卡里最薄的一张义项栏）', '（这组词里义项最少的一张）'),
    ('itinerary', r'diff\[\d+\]\.both', r'谁也别嫌谁薄', '谁也别嫌谁例子少'),
    ('itinerary', r'diff\[\d+\]\.both', r'能背的块就是那 2 句课文', '能背的就是那 2 句课文'),
    # ==== 第三轮：卡片家族收口 + 二线台账词（每条的原文均逐字核对过，2026-10-12）====
    ('announce', r'diff\[\d+\]\.announce',
     r'这一格只报卡面的借位分布：5 张卡借 announce、0 张卡借 declare——是本组除"有没有人等"外第二处两侧不对等的货；至于这些句子谁在开口，只按分布报备，不立"官方才 announce"的规矩（反例见边界一节 757）',
     '这一格看卡片里的分布：5 张卡片用到 announce、0 张用到 declare——是这组词里第二处两侧不对等的；至于这些句子里谁在开口，不立"只有官方才用 announce"的规矩'),
    ('announce', r'diff\[\d+\]\.declare',
     r'"没人借"是这几张卡的现状分布，不是它生僻', '"没有卡片借它"只是分布现状，不代表它生僻'),
    ('bet', r'diff\[\d+\]\.bet',
     r'这条的档（我敢说）卡上释义里没列（m 只有打赌；赌注），本书课文也没有第二处这样的用法——只能当卡上孤例报备',
     '「我敢说」这个义项，释义里没列（释义只有"打赌；赌注"），课文也没有第二处这样的用法——只能当孤例看待'),
    ('bet', r'diff\[\d+\]\.gamble', r'是另一张卡（m 风险；股份；桩）', '是另一个词条（释义有"风险；股份；桩"）'),
    ('cosmos', r'diff\[\d+\]\.cosmos',
     r'段里 164 的 celestial bodies、165 的 astronomy 都在同一条名单上', '这段里的 celestial bodies、astronomy 都在同一组里'),
    ('abroad', r'diff\[\d+\]\.abroad', r'international 还没卡，按 P10 不能拉进成员', 'international 还没有词条，不能算作成员'),
    ('donate', r'diff\[\d+\]\.donate', r'（m「贡献；促成；投稿」', '（释义有「贡献；促成；投稿」'),
    ('dilemma', r'diff\[\d+\]\.dilemma', r'这一档 plight 卡根本没有（m 只「困境」一档）', '这一档 plight 根本没有（释义只有「困境」一个义项）'),
    ('manipulate', r'diff\[\d+\]\.steer',
     r'其中 direct 有卡（m adj. 直接的；v. 指导；指示）', '其中 direct 有词条（释义 adj. 直接的；v. 指导；指示）'),
    ('manipulate', r'diff\[\d+\]\.steer', r'direct 卡的同义词栏还回列 steer', 'direct 的同义词栏里也把 steer 列了回去'),
    ('alleviate', r'diff\[\d+\]\.relieve',
     r'名词 relief 另有一张卡（m 给「宽慰；解脱；救济」', '名词 relief 另有一个词条（释义「宽慰；解脱；救济」'),
    ('complex', r'diff\[\d+\]\.both', r'supermarket、booth 各有卡，未并组', 'supermarket、booth 也各有词条，只是没并进这一组'),
    ('inner', r'diff\[\d+\]\.both', r'别按"别的词头"去找它的卡', '别按"别的词头"去找它的词条'),
    ('perspective', r'diff\[\d+\]\.perspective',
     r'opinion 卡、attitude 卡的同义词栏也都回列 perspective', 'opinion、attitude 的同义词栏里也都把 perspective 列了回去'),
    ('perspective', r'diff\[\d+\]\.perspective', r'viewpoint 没有这种回列', 'viewpoint 没有这种互相收录'),
    ('dismiss', r'diff\[\d+\]\.layoff', r'全书（课文＋卡）查不到任何句子', '课文和卡片里都查不到任何句子'),
    ('mandatory', r'diff\[\d+\]\.obligation', r'（duty 卡栏里回列 obligation）', '（duty 的同义词栏里也列着 obligation）'),
    ('client', r'diff\[\d+\]\.customer', r'（guest 有卡）', '（guest 也有词条）'),
    ('client', r'diff\[\d+\]\.client', r'而这两个词没有词卡，已核对', '而这两个词没有词条'),
    ('resemble', r'diff\[\d+\]\.resemble', r'（like 这个词没有词卡，已查）', '（like 这个词没有词条）'),
    ('conservation', r'diff\[\d+\]\.conservation',
     r'其中 protection、preservation 两份数据里都没有词头卡（已查 vocab.json），saving 有卡',
     '其中 protection、preservation 都没有自己的词条，saving 有'),
    ('conservation', r'diff\[\d+\]\.preserve',
     r'conserve、retain 都没有词头卡（已查），protect 有卡且它的栏里回列 preserve —— 两卡互列',
     'conserve、retain 都没有自己的词条，protect 有，且它的同义词栏里也列着 preserve——两个词互列'),
    ('cope', r'diff\[\d+\]\.dispose', r'在两份数据里没有词头卡', '都没有自己的词条'),
    ('cope', r'diff\[\d+\]\.dispose', r'handle 有卡但不是本组成员', 'handle 有词条但不是这组词的成员'),
    ('clever', r'diff\[\d+\]\.intelligent',
     r'卡上释义三档：「有才智的」只在卡上例句译文（「这个有才智的男孩」）；「聪明的」正是 354 的译文；「明智的」档本书 0 处——课文里「明智」有 4 处（1316 / 1334 / 1591 / 1694），落的全是 wise / wiser 那几个未打标记、也没词头卡的词',
     '释义三个义项：「有才智的」只在例句译文里（「这个有才智的男孩」）；「聪明的」正是课文里用过的那条译文；「明智的」这个义项课文 0 处——课文里「明智」的几处用的全是 wise / wiser 这类没有词条的词'),
    ('oral', r'diff\[\d+\]\.both', r'课文 544 同段还在讲 syntax、phonetics、syllable（都各有卡）', '课文里还在讲 syntax、phonetics、syllable（都各有词条）'),
    ('damp', r'diff\[\d+\]\.damp',
     r'damp 卡「同义词：humid, wet」＋词伙 1 条，两处文本互指', 'damp 卡片上写着「同义词：humid, wet」和 1 条搭配，卡片与课文互相印证'),
    ('adorn', r'diff\[\d+\]\.embellish', r'它跟 adorn 同格同架', '它跟 adorn 位置、句式都一样'),
    ('dwelling', r'diff\[\d+\]\.both',
     r'其中 mansion / hostel / lodge 三张卡的词伙就是 767 / 768 这两句', '其中 mansion / hostel / lodge 三张卡片的搭配就是这两句'),
    ('fatal', r'diff\[\d+\]\.mortal',
     r'本组唯一的档位问题：卡上「致命」那一档本书没用过', '这组词唯一的义项错位问题：卡片上「致命」那个义项课文没用过'),
    ('amplify', r'diff\[\d+\]\.amplify',
     r'在 amplify 这侧属"档位错"：档在卡上释义上有，本书没给这样的例句', '在 amplify 这侧属"义项错位"：释义里有这个义项，课文没给这样的例句'),
    ('intermediate', r'diff\[\d+\]\.intermediate', r'说级别：一堆档位里的中档', '说级别：一堆等级里的中间那级'),
    ('refectory', r'diff\[\d+\]\.restaurant', r'fancy 讲的是档次', 'fancy 带的是高级感'),
    ('demand', r'diff\[\d+\]\.request', r'本书（课文＋卡片）它一次也没当动词用过', '课文和卡片里它一次也没当动词用过'),
    # ==== 第三轮补遗：回列家族 / 义项卡译文 / 卡义项 / 可卡的 等 ====
    ('exterior', r'diff\[\d+\]\.exterior', r'也回列 exterior', '也把 exterior 列了回去'),
    ('committee', r'diff\[\d+\]\.council', r'回列了 council', '也把 council 列了进去'),
    ('breed', r'diff\[\d+\]\.feed', r'栏回列 feed', '栏里也把 feed 列了进去'),
    ('recover', r'diff\[\d+\]\.restore', r'没回列 restore', '没把 restore 列进去'),
    ('estimate', r'diff\[\d+\]\.evaluate', r'亦回列 evaluate', '也把 evaluate 列了进去'),
    ('research', r'diff\[\d+\]\.survey', r'也因此回列了 research', '也因此把 research 列了进去'),
    ('recover', r'diff\[\d+\]\.restore', r'那档卡译文自己就写「修复」', '那张卡片的译文自己就写着「修复」'),
    ('desire', r'diff\[\d+\]\.itch', r'可卡的例句却回到了蚊子咬', '可它卡片里的例句却回到了蚊子咬'),
    ('research', r'diff\[\d+\]\.survey', r'唯一"卡档、课文译文两边都对上"', '唯一"卡片的义项和课文译文两边都对上"'),
    # ==== 第四轮：悬空残片/误伤定向修（2026-10-12；每条原文均逐字 dump 核对后照抄）====
    ('announce', r'diff\[\d+\]\.announce',
     r'连 1116 都是"父亲侧着头听"', '连「父亲侧着头听」那条也在其中'),
    ('damp', r'diff\[\d+\]\.damp', r'它在 72 与另一只觉词 cold 并列', '它与另一个感觉词 cold 并列'),
    ('belt', r'diff\[\d+\]\.belt',
     r'belt 卡上有整整第二档，本书靠卡上例句给出来；746 是身上、卡上例句是机器',
     'belt 还有一个义项：课文里用在「身上」、例句里用在「机器」'),
    ('itinerary', r'diff\[\d+\]\.both',
     r'本书译文在 909 给了「行程」——itinerary 和 route 那个「路线」义项名只跟 908 对得上，对 909 得换成"单子"',
     '本书译文给的是「行程」——itinerary 和 route 那个「路线」义项名只对得上前一处，后一处得换成"单子"'),
    ('growth', r'diff\[\d+\]\.growth',
     r'本书用的是没打标记的 grew / grow（1155 his sense of duty grew stronger each day、202 grew into a small ecosystem），不是 growth',
     '本书用的是 grew / grow（his sense of duty grew stronger each day、grew into a small ecosystem），不是 growth'),
    ('oath', r'diff\[\d+\]\.vow', r'（119、491 的 vowed，都没打标记）', '（vowed）'),
    ('incline', r'diff\[\d+\]\.lean', r'全在课文、且 3 处都没打标记；', '全在课文（3 处）；'),
    ('desire', r'diff\[\d+\]\.itch', r'（1562，带标记、名词位）', '（名词位）'),
    ('cheat', r'diff\[\d+\]\.both',
     r'「作弊」3 处（473 / 1539 / 1547）落的全是未打标记的 cheating、cheaters——中文在这一组里既不分词、也不分档',
     '「作弊」3 处全出自 cheating、cheaters——中文在这一组里既不分词、也不分义项'),
    ('disease', r'diff\[\d+\]\.disease', r'点名病灶与性质', '指出病灶与性质'),
    ('cite', r'items\[\d+\]\.core', r'把来源点名出来', '把来源点出来'),
    ('quote', r'items\[\d+\]\.core', r'把从哪儿来的点名', '把从哪儿来的指出来'),
    ('donate', r'diff\[\d+\]\.donate', r'（1145，前一句 1144 点名 Old Lin）', '（前一句提到 Old Lin）'),
    ('strategy', r'items\[\d+\]\.scene', r'本段它被战略点名要', '课文里「战略」要的就是它'),
    ('diary', r'diff\[\d+\]\.journal', r'走的是第一档期刊、science journal（卡上例句连续子串）', '走的是第一个义项「期刊」'),
    ('inner', r'diff\[\d+\]\.internal', r'词伙 internal corner ＝课文 881（同源）', '词伙 internal corner 和课文里的是同一处'),
    # 「in + … + plight」是结构记法，不是列表——『+→、』会把记法读破（全库仅此 1 处）
    ('dilemma', r'diff\[\d+\]\.plight', r'2 条都是 in \+ … \+ plight', '两条都是 in … plight'),
]

PATCH_FIRED: set = set()


def apply_raw_patches(word, path, s):
    for i, (w, pre, pat, rep) in enumerate(RAW_PATCHES):
        if w != word or not re.search(pre, path):
            continue
        ns = re.sub(pat, rep, s)
        if ns != s:
            PATCH_FIRED.add(i)
            s = ns
    return s


# ======================= 8) 结构清理 =======================
def clean_card(cmp, word=''):
    out = dict(cmp)
    if out.get('title'):
        out['title'] = clean_full(apply_raw_patches(word, 'title', out['title']))
    if out.get('summary'):
        out['summary'] = clean_full(apply_raw_patches(word, 'summary', out['summary']))
    items = []
    for idx, it in enumerate(cmp.get('items') or []):
        ni = dict(it)
        if ni.get('pos'):
            ni['pos'] = pos_clean(ni['pos'], ni.get('sense'))
        if ni.get('sense'):
            ni['sense'] = clean_full(apply_raw_patches(word, f'items[{idx}].sense', ni['sense']))
        for f in ('core', 'scene'):
            if ni.get(f):
                ni[f] = clean_full(apply_raw_patches(word, f'items[{idx}].{f}', ni[f]))
        items.append(ni)
    out['items'] = items
    # diff：dim 走 dim_norm；其余字段走 clean_full；全空行/全空 dim 组丢
    rows = []
    for idx, row in enumerate(cmp.get('diff') or []):
        nr = {}
        for k, v in row.items():
            if not isinstance(v, str):
                nr[k] = v
                continue
            if k == 'dim':
                nr[k] = dim_norm(v)
            else:
                nr[k] = clean_full(apply_raw_patches(word, f'diff[{idx}].{k}', v))
        # 全空行判定：label 也空 + 所有内容列空
        content = [nr.get(k) for k in nr if k not in ('dim', 'label')]
        if nr.get('label') and any((c or '').strip() for c in content):
            rows.append(nr)
        elif any((c or '').strip() for c in content):
            rows.append(nr)
    out['diff'] = rows
    return out


# ======================= 9) 验收扫描 =======================
RESID_KW = re.compile(
    r'卡上|卡词伙|卡有|卡里|卡\s*同|没有卡(?![片])|本书|全书|全库|书证|词伙|现成块|可背块|物证|'
    r'审核|未打标记|未标|可\s*grep|自查过|订正[:：]|更正[:：]|登记|硬约束|只报备|报备|不进|台账|黑话|'
    r'落点|栏位|槽位|句框|抢生意|露过脸|露过面|段\s*\d|章\s*\d|组\s*\d|两卡|三卡|两词|三词|'
    r'[一二三哪那这]档|档数|档位|(?<!掉)(?<!了)(?<![搭高归])档(?![位次案])|本组|上一批|'
    r'卡面|卡文本|卡译|卡外|卡栏|卡给|卡没|词头卡|回列|借位|已核对|已查|边界一节|同格同架|名单|'
    r'(?<!卡)卡(?![片车住着得死在])'   # 裸「卡」：卡片/卡车/卡住/卡着/卡得/卡死/卡在（复合词或动词）之外一律拦下
)


def scan(s):
    hits = []
    if RESID_KW.search(s):
        hits.append('维护词')
    if re.search(r'[（(]\s*[，,、；;：:]*\s*[）)]|^[：:，,；;、]|[（(][；;，,、]', s):
        hits.append('残标点')
    if re.search(r'(?<![\w\d.])0?\d{2,4}(?![\w\d.])(?!\s*[处次条个位种])', s):
        pass  # 编号已在 kill_nums 处理；残余不查编号避免误报（如英文序号）
    return hits


# ======================= 10) 主流程 =======================
def walk_fields(cmp):
    out = []
    if cmp.get('title'):
        out.append(('title', cmp['title']))
    if cmp.get('summary'):
        out.append(('summary', cmp['summary']))
    for i, it in enumerate(cmp.get('items') or []):
        for f in ('pos', 'sense', 'core', 'scene'):
            if it.get(f):
                out.append((f'items[{i}].{f}', it[f]))
    for i, row in enumerate(cmp.get('diff') or []):
        for k, v in row.items():
            if isinstance(v, str) and v:
                out.append((f'diff[{i}].{k}', v))
    return out


def main():
    with open('data/vocab.json', encoding='utf-8') as f:
        d = json.load(f)
    cards = [(k, v['cmp']) for k, v in d.items() if isinstance(v, dict) and isinstance(v.get('cmp'), dict)]

    tb = ta = 0
    resid = []
    empties = []
    dropped_rows = 0
    for k, cmp in cards:
        nc = clean_card(cmp, k)
        dropped_rows += len(cmp.get('diff') or []) - len(nc.get('diff') or [])
        raw_map = dict(walk_fields(cmp))
        for path, t in walk_fields(cmp):
            if path.endswith('.dim'):
                continue
            tb += len(t)
        for path, t in walk_fields(nc):
            if path.endswith('.dim'):
                continue
            ta += len(t)
            if not t.strip():
                old = raw_map.get(path, '')
                if old.strip():
                    empties.append((k, path, old))
            hits = scan(t)
            if hits:
                resid.append((k, path, ','.join(hits), t))

    print(f'非 dim 字段字符量：{tb} → {ta}（-{100 - ta * 100 // tb}%）')
    print(f'整行丢弃的 diff 行：{dropped_rows}')
    print(f'清洗后变空字段（原文非空）：{len(empties)}')
    print(f'验收残余：{len(resid)}')
    print('  类型分布：', dict(Counter(r[2] for r in resid)))
    fired = PATCH_FIRED
    miss = [i for i in range(len(RAW_PATCHES)) if i not in fired]
    print(f'RAW_PATCHES: {len(fired)}/{len(RAW_PATCHES)} 生效')
    for i in miss:
        print(f'  未命中 patch[{i}]: {RAW_PATCHES[i][0]} {RAW_PATCHES[i][2][:60]}')

    with open('work/cmp_v4_resid.txt', 'w', encoding='utf-8') as f:
        for k, path, bad, t in resid:
            f.write(f'[{k}.{path}] ({bad})\n  {t}\n')
    print('残余清单 → work/cmp_v4_resid.txt')

    with open('work/cmp_v4_empty.txt', 'w', encoding='utf-8') as f:
        for k, path, old in empties:
            f.write(f'[{k}.{path}]\n  前: {old}\n')
    print('空字段清单 → work/cmp_v4_empty.txt')

    REVIEW = ['turbulent', 'cosmetics', 'flat', 'mild', 'degrade', 'endanger', 'damp',
              'inner', 'trace', 'dilemma', 'descendant', 'instrument', 'curse', 'natural', 'florid']
    with open('work/cmp_v4_review.txt', 'w', encoding='utf-8') as f:
        for k in REVIEW:
            if k not in d or not isinstance(d[k].get('cmp'), dict):
                continue
            cmp = d[k]['cmp']
            nc = clean_card(cmp, k)
            kept_rows = len(nc.get('diff') or [])
            f.write('=' * 30 + f' {k} ' + '=' * 30 + '\n\n')
            f.write('--- title 前 ---\n' + (cmp.get('title') or '') + '\n')
            f.write('--- title 后 ---\n' + (nc.get('title') or '') + '\n\n')
            for i, (it, ni) in enumerate(zip(cmp.get('items') or [], nc.get('items') or [])):
                f.write(f'--- item[{i}] {it.get("w")} ---\n')
                f.write(f'  pos 前: {it.get("pos")}\n  pos 后: {ni.get("pos")}\n')
                f.write(f'  sense 前: {it.get("sense")}\n  sense 后: {ni.get("sense")}\n')
                f.write(f'  core  前: {it.get("core")}\n  core  后: {ni.get("core")}\n')
                f.write(f'  scene 前: {it.get("scene")}\n  scene 后: {ni.get("scene")}\n')
            f.write('\n')
            for i, row in enumerate(cmp.get('diff') or []):
                nr = {}
                for kk, vv in row.items():
                    if not isinstance(vv, str):
                        nr[kk] = vv
                    else:
                        nr[kk] = dim_norm(vv) if kk == 'dim' else clean_full(apply_raw_patches(k, f'diff[{i}].{kk}', vv))
                f.write(f'--- diff[{i}] ---\n')
                for kk in ('dim', 'label', 'both'):
                    if row.get(kk) or nr.get(kk):
                        f.write(f'  {kk} 前: {row.get(kk)}\n  {kk} 后: {nr.get(kk)}\n')
                for kk, vv in row.items():
                    if kk not in ('dim', 'label', 'both') and isinstance(vv, str):
                        f.write(f'  {kk} 前: {vv}\n  {kk} 后: {nr.get(kk)}\n')
            f.write(f'--- 该卡 diff 行数：{len(cmp.get("diff") or [])} → {kept_rows} ---\n')
            f.write('--- summary 前 ---\n' + (cmp.get('summary') or '') + '\n')
            f.write('--- summary 后 ---\n' + (nc.get('summary') or '') + '\n\n\n')
    print('审读对照 → work/cmp_v4_review.txt')
    print()
    for k, path, bad, t in resid[:40]:
        print(f' [{k}.{path}] ({bad})')
        print(f'   {t[:110]}')


if __name__ == '__main__':
    main()
