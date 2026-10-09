# -*- coding: utf-8 -*-
"""六篇故事线修复落地器（2026-10-10）

覆盖：§五 修复清单 18 项 + §六 8 项裁定 + X-2 附加项。
原则：零增删句、key 集合按项保词、每句至少 1 标记、ZH 与 EN 同步。

用法：
  python3 work/storyfix/apply_fixes.py          # 干跑：只校验并打印报告
  python3 work/storyfix/apply_fixes.py --apply  # 落盘
"""
import json, re, sys, io, hashlib
from pathlib import Path

ROOT = Path('/Users/pengzhou/Library/Mobile Documents/com~apple~CloudDocs/词汇真经单词速记')
APPLY = '--apply' in sys.argv

sec_path = ROOT / 'data/sections.json'
vocab_path = ROOT / 'data/vocab.json'

raw_sec = sec_path.read_bytes()
raw_vocab = vocab_path.read_bytes()
sec = json.loads(raw_sec.decode('utf-8'))
vocab = json.loads(raw_vocab.decode('utf-8'))

MARK = re.compile(r'\[\[([^:\]]+):([^\]]*)\]\]')
PLACE = re.compile(r'\[\[([^\]:|]+)')
MARK_FULL = re.compile(r'\[\[[^\]:]+:[^\]]+\]\]')
HAS_CJK_PUNCT = re.compile(r'[，。、；：！？]')

def keys_of(s):
    return [m.group(1) for m in MARK.finditer(s)]

def en(s):
    return s['paragraphs']

# ---------------------------------------------------------------- 编辑清单
# (ci, pi, si, old, new, zh_new or None, must_keep=[keys], tag=说明)
E = []
def add(ci, pi, si, old, new, zh, keep, tag):
    E.append(dict(ci=ci, pi=pi, si=si, old=old, new=new, zh=zh, keep=keep, tag=tag))

# ---------- 篇0：S0-1 动作顺序 ----------
add(0, 14, 5,
    'He tied the boat fast and hurried toward the warm [[harbour:harbour]] lights.',
    'He was about to tie the boat fast and hurry toward the warm [[harbour:harbour]] lights.',
    '他正要把小船系牢，快步走向温暖的港灯。',
    ['harbour'], 'S0-1 动作顺序')

# ---------- 篇0：S0-2 oxen → ox ----------
add(0, 50, 5,
    'The [[quiet:quiet]] milk [[cattle:cattle]] stood in line while a strong brown [[ox:oxen]] pulled a dray.',
    'The [[quiet:quiet]] milk [[cattle:cattle]] stood in line while a strong brown [[ox:ox]] pulled a dray.',
    None, ['quiet', 'cattle', 'ox'], 'S0-2 a strong brown oxen → ox')

# ---------- 篇0：S0-3 时态样板（P16–P19 全块转过去时） ----------
TENSE = [
 (16, 0, 'Early in the morning, Mina [[sprinkle:sprinkles]] sugar into her tea and takes a quick [[shower:shower]] before the climb.',
        'Early in the morning, Mina [[sprinkle:sprinkled]] sugar into her tea and took a quick [[shower:shower]] before the climb.'),
 (16, 1, 'Outdoors it is already twenty-five degrees [[celsius:Celsius]], and such a high [[temperature:temperature]] softens the deep snow.',
        'Outdoors it was already twenty-five degrees [[celsius:Celsius]], and such a high [[temperature:temperature]] softened the deep snow.'),
 (16, 2, 'Yet the radio [[forecast:forecast]] promises cool winds near the [[snowy:snowy]] [[peak:peak]].',
        'Yet the radio [[forecast:forecast]] promised cool winds near the [[snowy:snowy]] [[peak:peak]].'),
 (16, 3, 'By noon she stands on the [[hillside:hillside]] path, laughing at her own haste.',
        'By noon she stood on the [[hillside:hillside]] path, laughing at her own haste.'),
 (16, 4, 'There she helps her friend [[mount:mount]] a small detector on the boulder.',
        'There she helped her friend [[mount:mount]] a small detector on the boulder.'),
 (16, 5, 'Together they watch the distant [[mountain:mountain]] crest glow in the evening light.',
        'Together they watched the distant [[mountain:mountain]] crest glow in the evening light.'),
 (17, 0, 'Young Ken knows all the nearby [[range:ranges]] well and leads guests along the [[narrow:narrow]] [[ridge:ridge]].',
        'Young Ken knew all the nearby [[range:ranges]] well and led guests along the [[narrow:narrow]] [[ridge:ridge]].'),
 (17, 1, 'They come down the grassy [[slope:slope]] into a peaceful green [[valley:valley]] dotted with sheep.',
        'They came down the grassy [[slope:slope]] into a peaceful green [[valley:valley]] dotted with sheep.'),
 (17, 2, 'Children race down the sunny [[hillside:hillside]], past the spot where Ken [[overlook:overlooks]] the whole village.',
        'Children raced down the sunny [[hillside:hillside]], past the spot where Ken [[overlook:overlooked]] the whole village.'),
 (17, 4, 'Ana studies [[irreversible:irreversible]] harm in the wetlands, taking water samples [[irregularly:irregularly]].',
        'Ana studied [[irreversible:irreversible]] harm in the wetlands, taking water samples [[irregularly:irregularly]].'),
 (18, 0, 'The slow river carries thick [[sediment:sediment]] while soft [[silt:silt]] settles among the roots.',
        'The slow river carried thick [[sediment:sediment]] while soft [[silt:silt]] settled among the roots.'),
 (18, 1, 'After storms the bank turns soft and [[muddy:muddy]], so she moulds the [[damp:damp]] [[clay:clay]] into small bricks to show her class.',
        'After storms the bank turned soft and [[muddy:muddy]], so she moulded the [[damp:damp]] [[clay:clay]] into small bricks to show her class.'),
 (18, 2, 'At daybreak Sam wipes [[dirt:dirt]] from his windscreen before his long [[rural:rural]] delivery run.',
        'At daybreak Sam wiped [[dirt:dirt]] from his windscreen before his long [[rural:rural]] delivery run.'),
 (18, 3, 'His [[first:first]] stop is a [[quiet:quiet]] farm, his second a leafy [[suburb:suburb]] full of waiting children.',
        'His [[first:first]] stop was a [[quiet:quiet]] farm, his second a leafy [[suburb:suburb]] full of waiting children.'),
 (18, 4, 'Then come the factories on the dusty [[outskirts:outskirts]] of town.',
        'Then came the factories on the dusty [[outskirts:outskirts]] of town.'),
 (18, 5, 'After lunch he drives on toward a [[remote:remote]] farm down a long [[desolate:desolate]] road.',
        'After lunch he drove on toward a [[remote:remote]] farm down a long [[desolate:desolate]] road.'),
 (19, 0, 'Two warehouses stand [[adjacent:adjacent]] to the old station, but Sam refuses any [[toxic:toxic]] shipment without sealed boxes.',
        'Two warehouses stood [[adjacent:adjacent]] to the old station, but Sam refused any [[toxic:toxic]] shipment without sealed boxes.'),
 (19, 1, 'Maya investigates river [[pollution:pollution]] and finds one oily [[pollutant:pollutant]] leaking from a rusty conduit.',
        'Maya investigated river [[pollution:pollution]] and found one oily [[pollutant:pollutant]] leaking from a rusty conduit.'),
 (19, 2, 'That waste could [[contaminate:contaminate]] the wells, so her class joins the weekend [[geology:geology]] outings to watch the water.',
        'That waste could [[contaminate:contaminate]] the wells, so her class joined the weekend [[geology:geology]] outings to watch the water.'),
 (19, 3, 'They take samples along the grassy [[fringe:fringe]] of the pines, where Maya drops her enamel [[plate:plate]] on the rocks.',
        'They took samples along the grassy [[fringe:fringe]] of the pines, where Maya dropped her enamel [[plate:plate]] on the rocks.'),
 (19, 4, 'The flood has scattered sharp [[debris:debris]] across the path, and she spots a thin [[crack:crack]] spreading in the old bridge wall.',
        'The flood had scattered sharp [[debris:debris]] across the path, and she spotted a thin [[crack:crack]] spreading in the old bridge wall.'),
 (19, 5, 'She photographs both and sends them to the county hall, hoping to [[trace:trace]] the [[leak:leak]] that same day.',
        'She photographed both and sent them to the county hall, hoping to [[trace:trace]] the [[leak:leak]] that same day.'),
]
for (pi, si, o, n) in TENSE:
    add(0, pi, si, o, n, None, keys_of(o), f'S0-3 时态样板 P{pi}.{si}')

# ---------- 篇1：S1-2 病句 ----------
add(1, 8, 5,
    'The small [[coverage lettering:coverage lettering]] at the foot of his map even came with a short reading [[bibliography:bibliography]].',
    'The small print at the foot of his map explained the [[coverage lettering:coverage lettering]] and listed a short reading [[bibliography:bibliography]].',
    '他地图下方的小字解释了图上的标注字样，还列出一份简短的阅读书目。',
    ['coverage lettering', 'bibliography'], 'S1-2 病句重写')

# ---------- 篇1：R-11 ----------
add(1, 12, 3,
    'He previewed basic [[calculus:calculus]] ideas [[plus:plus]] a few graphs before the new term began.',
    'He previewed basic [[calculus:calculus]] ideas [[plus:plus]] a few graphs before his first term began.',
    '第一个学期开始前，他预习了基础微积分概念和一些图表。',
    ['calculus', 'plus'], 'R-11 the new term → his first term')

# ---------- 篇1：S1-1 主角更替过渡 ----------
add(1, 13, 0,
    'During finals week, Lin and Mei had [[identical:identical]] schedules, [[minus:minus]] a few tiny changes.',
    "During finals week Xiao Yu's classmates Lin and Mei kept almost [[identical:identical]] study hours, [[minus:minus]] a few short breaks.",
    '期末周，小宇的同班同学林和梅复习的作息几乎一模一样，只差几段短短的休息。',
    ['identical', 'minus'], 'S1-1 主角更替过渡 + S1-16 identical/minus 矛盾')

# ---------- 篇1：X-2 萨姆 → 山姆 ----------
add(1, 18, 7, None, None, '萨姆把自己的艺术作品挂在教室门边，准备参展。',
    ['artwork'], 'X-2 译名统一（仅译文）')
E[-1]['zh_from'] = '萨姆'
E[-1]['zh_to'] = '山姆'

# ---------- 篇2：S2-2 承接（旧物店去向 + 与奶奶一家关系） ----------
add(2, 17, 3,
    'At [[dusk:dusk]] we share tea, thankful for each [[slight:slight]] repair that warms our street.',
    "At [[dusk:dusk]] we share tea and hand the old shop to Grandma's family, thankful for each [[slight:slight]] repair that warms our street.",
    '黄昏时分我们共饮热茶，把旧物店交给奶奶一家，感谢每一处小小修补温暖了整条街。',
    ['dusk', 'slight'], 'S2-2 上篇→下篇承接')

# ---------- 篇2：S2-3 erection 语义对齐（保词） ----------
add(2, 18, 0,
    'Grandma announced her plan for the [[erection:erection]] of a new hall, brushing aside every past [[stricture:stricture]] about money.',
    'Grandma announced her plan for the [[erection:erection]] of a small new dining room inside the old hall, brushing aside every past [[stricture:stricture]] about money.',
    '奶奶宣布了在旧厅堂里新建一间小饭厅的计划，不再理会过去那些关于钱的指责。',
    ['erection', 'stricture'], 'S2-3 新建厅堂 → 旧厅堂内新建饭厅')

# ---------- 篇2：S2-2 we → they ----------
add(2, 24, 3,
    'After we cleared away the [[junk:junk]], the hall looked [[spacious:spacious]] yet still dusty, far from [[airtight:airtight]] and safe.',
    'After they cleared away the [[junk:junk]], the hall looked [[spacious:spacious]] yet still dusty, far from [[airtight:airtight]] and safe.',
    None, ['junk', 'spacious', 'airtight'], 'S2-2 we → they')

# ---------- 篇3：S3-1 host 双角色拆分（旅店老板 → innkeeper） ----------
HOST_SPLIT = [
 (1, 3, 'Our [[host:host]] went on and on about votes, so Father turned it into a talk about city [[traffic:traffic]].',
        'Our innkeeper went on and on about votes, so Father turned it into a talk about city [[traffic:traffic]].'),
 (4, 0, 'It took Father a whole page of the [[atlas:atlas]] to [[explain:explain]] what the [[host:host]] had said about votes.',
        'It took Father a whole page of the [[atlas:atlas]] to [[explain:explain]] what the innkeeper had said about votes.'),
 (6, 3, 'One big [[lorry:lorry]], Father told the [[host:host]], could bring a whole city to a stop, and that answer ended the argument.',
        'One big [[lorry:lorry]], Father told the innkeeper, could bring a whole city to a stop, and that answer ended the argument.'),
 (22, 4, "The [[municipal:municipal]] inn earned Father's praise when our [[host:host]] gave us hot tea and warm blankets late at [[night:night]].",
        "The [[municipal:municipal]] inn earned Father's praise when the innkeeper gave us hot tea and warm blankets late at [[night:night]]."),
]
for (pi, si, o, n) in HOST_SPLIT:
    add(3, pi, si, o, n, None, [k for k in keys_of(o) if k != 'host'], f'S3-1 host 拆分 P{pi}.{si}')

# ---------- 篇3：S3-2 拂晓列车员重复 ----------
add(3, 39, 3,
    'At [[dawn:dawn]] the conductor asked the tall boys to [[encourage:encourage]] one another and clear the doorway for the old folks.',
    'Just before [[dawn:dawn]] the conductor [[encourage:encouraged]] us with hot tea and quiet words.',
    '天快亮时，列车员用热茶和轻声细语给我们鼓劲。',
    ['dawn', 'encourage'], 'S3-2 拂晓列车员重复句改写')

# ---------- 篇3：S3-3 午夜铃重复 ----------
add(3, 30, 5,
    'A soft [[bell:bell]] rang at [[midnight:midnight]], and Father woke me to tell of the empty [[throne:throne]] under the silver moon.',
    'Long past [[midnight:midnight]], a distant [[bell:bell]] rang, and Father told me of the empty [[throne:throne]] in the old palace.',
    '午夜过了很久，远处一声铃响，父亲给我讲起旧宫里那张空着的王座。',
    ['bell', 'midnight', 'throne'], 'S3-3 午夜铃重复句改写')

# ---------- 篇3：S3-4 父亲梦话+掖毯 5 处 → 保留 2 处，改写 3 处 ----------
add(3, 19, 0,
    'Late that night Father murmured in his sleep about the news we [[transmit:transmit]] home, and I tucked the blanket around him.',
    'That night Father explained how the news we [[transmit:transmit]] home would get there first.',
    '那天夜里，父亲给我们讲，我们发回家的消息会先一步到达。',
    ['transmit'], 'S3-4 梦话改写①')
add(3, 34, 0,
    'I woke to Father whispering in his sleep that he must not miss the [[vote:vote]], and I covered him gently.',
    'Next morning Father checked his watch twice, anxious not to miss the [[vote:vote]].',
    '第二天早上，父亲把表看了两遍，生怕错过那场投票。',
    ['vote'], 'S3-4 梦话改写②')
add(3, 39, 0,
    'Past midnight Father murmured that he still had one small thing to [[clarify:clarify]], and I covered him up.',
    'Over breakfast Father said he still had one small thing to [[clarify:clarify]] before we left.',
    '早饭时父亲说，我们动身前他还有一件小事要澄清。',
    ['clarify'], 'S3-4 梦话改写③')

# ---------- 篇3：S3-10 弟弟像小丑重复 ----------
add(3, 9, 5,
    '[[outside:Outside]] the bakery my brother tried to [[crush:crush]] a [[paper:paper]] cup like a clown, and the whole sleepy [[queue:queue]] laughed.',
    '[[outside:Outside]] the bakery my brother found a [[crush:crushed]] [[paper:paper]] cup and handed it to the boy in the [[queue:queue]] ahead of us.',
    '面包店外，弟弟捡到一只压扁的纸杯，递给了我们前面排队的男孩。',
    ['outside', 'crush', 'paper', 'queue'], 'S3-10 弟弟像小丑重复句改写')

# ---------- 篇3：S3-11 登夜车+篮子外套重复 ----------
add(3, 23, 4,
    'With our baskets and coats we climbed aboard, and the conductor gave us the [[premier:premier]] seats on the bright [[night:night]] train.',
    'The conductor gave us the [[premier:premier]] seats, and the [[night:night]] train rocked us all to sleep.',
    '列车员把最好的座位给了我们，夜车摇着大家进入了梦乡。',
    ['premier', 'night'], 'S3-11 登夜车重复句改写')

# ---------- 篇3：S3-7 / S3-8 大小写（仅标注形式） ----------
add(3, 15, 3,
    'Right [[outside:Outside]] my window the [[steel:steel]] [[rail:rail]] ran straight to the edge of the fields.',
    'Right [[outside:outside]] my window the [[steel:steel]] [[rail:rail]] ran straight to the edge of the fields.',
    None, ['outside', 'steel', 'rail'], 'S3-7 Outside → outside')
add(3, 20, 1,
    'Father read a little about [[marxism:marxism]] on the ride home and asked what I had heard.',
    'Father read a little about [[marxism:Marxism]] on the ride home and asked what I had heard.',
    None, ['marxism'], 'S3-8 marxism → Marxism（显示）')

# ---------- 篇3：R-2 母亲来信 ----------
add(3, 21, 0,
    'Mother asked why [[political:political]] news filled every [[paper:paper]] that week.',
    "Mother's letter asked why [[political:political]] news filled every [[paper:paper]] that week.",
    '母亲来信问，为什么那一周每份报纸都登满了政治新闻。',
    ['political', 'paper'], 'R-2 母亲来信口吻')

# ---------- 篇3：R-3 in his sleep ----------
add(3, 16, 3,
    'In the small hours I heard Father mumble about [[defer:deferring]] the [[trip:trip]], so I pulled the blanket over him.',
    'In the small hours I heard Father mumble in his sleep about [[defer:deferring]] the [[trip:trip]], so I pulled the blanket over him.',
    '夜深了，我听见父亲在睡梦里嘟囔着要把旅行往后推，就把毯子往他身上拉了拉。',
    ['defer', 'trip'], 'R-3 补 in his sleep')

# ---------- 篇3：R-4 主语=父亲 ----------
add(3, 42, 1,
    'He even copied a line from an old [[soviet:Soviet]] [[film:film]], which made the whole room laugh.',
    'Father even copied a line from an old [[soviet:Soviet]] [[film:film]], which made the whole room laugh.',
    '父亲甚至学了一句老苏联电影里的台词，把满屋子的人都逗笑了。',
    ['soviet', 'film'], 'R-4 He → Father')

# ---------- 篇3：R-5 Our street → The street ----------
add(3, 58, 6,
    'Our street now has a new [[surveillance:surveillance]] camera above the gate.',
    'The street now has a new [[surveillance:surveillance]] camera above the gate.',
    '这条街的大门上方，现在装了一个新的监控摄像头。',
    ['surveillance'], 'R-5 Our street → The street')

# ---------- 篇3：R-7 on unsold goods ----------
add(3, 52, 4,
    'A late [[payment:payment]] from a [[restaurant:restaurant]] left him short, so he asked the supplier for a small [[refund:refund]].',
    'A late [[payment:payment]] from a [[restaurant:restaurant]] left him short, so he asked the supplier for a small [[refund:refund]] on unsold goods.',
    '一家饭馆迟迟没付货款，他手头紧了，只好拿没卖出的货向供货商要一点退款。',
    ['payment', 'restaurant', 'refund'], 'R-7 补 on unsold goods')

# ---------- 篇3：S3-5 年轻学生 → 老林的教子 ----------
add(3, 56, 1,
    'A young student explained [[legal:legal]] words and read the cold [[regulation:regulations]] aloud twice.',
    "Lin's young godson, still a student, explained the [[legal:legal]] words and read the cold [[regulation:regulations]] aloud twice.",
    '老林年轻的教子——还在念书——讲解法律字眼，把那几条冷冰冰的条例读了两遍。',
    ['legal', 'regulation'], 'S3-5 呼应教子伏笔')

# ---------- 篇4：S4-1 梅的职责统一 ----------
add(4, 31, 3,
    'Mei took [[sole:sole]] care of the charts, and the others kept their [[respective:respective]] jars in line.',
    'Mei took [[sole:sole]] care of the jars, and the others kept their [[respective:respective]] charts and notes in order.',
    '梅独自照管罐子，其他人则把各自的图表和记录整理得井井有条。',
    ['sole', 'respective'], 'S4-1 继承人职责对齐')

# ---------- 篇4：S4-2 试验时间线 ----------
add(4, 25, 4,
    'The readings grew [[accurate:accurate]] and [[precise:precise]] after three calm [[trial:trial]] days.',
    'The readings grew [[accurate:accurate]] and [[precise:precise]] after three calm days of [[trial:trial]] runs.',
    '三天平静的试运行之后，读数变得又准又精。',
    ['accurate', 'precise', 'trial'], 'S4-2 三天试验 → 三天试运行')

# ---------- 篇4：S4-3 删 today ----------
add(4, 18, 0,
    'Our small town [[polytechnic:polytechnic]] asked a kind [[mechanic:mechanic]] to guide the students today.',
    'Our small town [[polytechnic:polytechnic]] asked a kind [[mechanic:mechanic]] to guide the students.',
    '镇上的小理工学院请来一位和善的机修工指导学生。',
    ['polytechnic', 'mechanic'], 'S4-3 删 today')

# ---------- 篇4：R-12 小波前因 ----------
add(4, 31, 0,
    'Small Bo, still [[dependent:dependent]] on crutches, dared to [[propose:propose]] a safer spout.',
    'Small Bo, still [[dependent:dependent]] on crutches after a climbing fall, dared to [[propose:propose]] a safer spout.',
    '登山摔伤后仍拄着双拐的小波，大胆提出了更安全的水嘴方案。',
    ['dependent', 'propose'], 'R-12 补 after a climbing fall')

# ---------- 篇5：S5-2 人称 ----------
add(5, 23, 6,
    'Years ago her [[womb:womb]] carried my mother, and now one [[kidney:kidney]] no longer works as well as before.',
    'Years ago her [[womb:womb]] carried our mother, and now one [[kidney:kidney]] no longer works as well as before.',
    '多年前，她的子宫里孕育了我们的妈妈；如今她有一个肾也不如从前好用了。',
    ['womb', 'kidney'], 'S5-2 my mother → our mother')

# ---------- 篇5：S5-1 视角断裂（补「林＝奶奶的孙辈」） ----------
add(5, 36, 0,
    'After long weeks in bed, Lin felt [[negative:negative]] and [[passive:passive]], while grey skies hung low outside.',
    "Our worry then moved to Grandma's grandson Lin, long in bed and feeling [[negative:negative]] and [[passive:passive]] while grey skies hung low outside.",
    '随后我们的牵挂转到了奶奶的孙子林身上——他卧床许久，消极又被动，窗外灰蒙蒙的天空低低地压着。',
    ['negative', 'passive'], 'S5-1 视角断裂过渡')

# ---------- 篇5：R-10 named Ben ----------
add(5, 36, 4,
    'A [[merry:merry]] neighbour boy shared short jokes, and clear [[laughter:laughter]] filled the small sunny sitting room.',
    'A [[merry:merry]] neighbour boy named Ben shared short jokes, and clear [[laughter:laughter]] filled the small sunny sitting room.',
    '一个名叫本的欢乐邻家男孩讲起短笑话，清脆的笑声洒满小小而向阳的客厅。',
    ['merry', 'laughter'], 'R-10 补 named Ben')

# ---------------------------------------------------------------- 逐条校验
errs, warns, log = [], [], []
bulk_log, sub_log, cmp_log = [], [], []

# ---------------------------------------------------------------- cmp 例句联动
# 门禁 16：辨析卡 eg / diff.eg / collocation 必须在「课文原文 ∪ 卡片字段」里查得到。
# 改句后失效的 4 条，逐条同步（改前逐条实测确认失效）。
CMP_EDITS = [
    ('defer', 'items', 0, 'eg',
     'I heard Father mumble about deferring the trip',
     'I heard Father mumble in his sleep about deferring the trip',
     'R-3 联动：补 in his sleep'),
    ('minus', 'items', 0, 'eg',
     'minus a few tiny changes',
     'minus a few short breaks',
     'S1-1 联动：minus 例句'),
    ('construct', 'items', 1, 'eg',
     'Grandma announced her plan for the erection of a new hall, brushing aside every past stricture about money.',
     'Grandma announced her plan for the erection of a small new dining room inside the old hall, brushing aside every past stricture about money.',
     'S2-3 联动：erection 例句'),
    ('contaminate', 'items', 0, 'eg',
     'Maya investigates river pollution',
     'Maya investigated river pollution',
     'S0-3 联动：pollution 例句'),
]
for (w, sect, idx, field, o, n, tag) in CMP_EDITS:
    card = vocab.get(w)
    arr = (card or {}).get('cmp', {}).get(sect)
    if not isinstance(arr, list) or idx >= len(arr) or arr[idx].get(field) != o:
        errs.append(f'cmp 联动 {w}.{sect}[{idx}].{field} 原值不符（期望 {o!r}）')
        continue
    if True:  # 内存中始终先改
        arr[idx][field] = n
    cmp_log.append(f'{w}.{sect}[{idx}].{field}: {o!r} → {n!r}  （{tag}）')

# 批量译文替换：X-1 篇0 卷四「里奥」→「利奥」；S2-1 篇2「外婆」→「奶奶」
BULK_ZH = [
    (0, '里奥', '利奥', 'X-1 译名统一'),
    (2, '外婆', '奶奶', 'S2-1 称谓统一'),
]
for (ci, a, b, tag) in BULK_ZH:
    n_s = n_p = 0
    for pi, para in enumerate(sec[ci]['sentZh']):
        for si, z in enumerate(para):
            if a in z:
                n_s += z.count(a)
                if True:  # 内存中始终先改，落盘由 --apply 控制
                    para[si] = z.replace(a, b)
    for pi, z in enumerate(sec[ci]['paraZh']):
        if a in z:
            n_p += z.count(a)
            if True:  # 内存中始终先改，落盘由 --apply 控制
                sec[ci]['paraZh'][pi] = z.replace(a, b)
    bulk_log.append(f'ch{ci} {tag}: sentZh {n_s} 处 / paraZh {n_p} 处 「{a}」→「{b}」')
    if n_s == 0:
        errs.append(f'ch{ci} {tag}: sentZh 里找不到「{a}」，替换点可能有变')

# 分卷标题：(章, 段, 期望原值, 新值, 说明)
SUBHEADS = [
    (2, 18, '', '下篇·老屋餐厅', 'S2-4 补下篇分卷标题'),
    (5, 20, '下篇·奶奶的健康年', '下篇·奶奶的健康年——全家人的康复与成长', 'S5-1 下篇标题承载双线'),
]
for (ci, idx, exp_old, text, tag) in SUBHEADS:
    oldv = sec[ci]['subheads'][idx]
    if oldv != exp_old:
        errs.append(f'ch{ci}.subheads[{idx}] 原值不符（期望 {exp_old!r}，实际 {oldv!r}）— {tag}')
    else:
        if True:  # 内存中始终先改，落盘由 --apply 控制
            sec[ci]['subheads'][idx] = text
        sub_log.append(f'ch{ci}.subheads[{idx}]: {exp_old!r} → {text!r}  （{tag}）')

old_plain_text = []
for ci, ch in enumerate(sec):
    for pi, para in enumerate(ch['paragraphs']):
        for si, s in enumerate(para):
            old_plain_text.append(s)

for i, e in enumerate(E):
    ci, pi, si = e['ci'], e['pi'], e['si']
    cur = sec[ci]['paragraphs'][pi][si]
    if e['old'] is None:
        # 仅译文替换项
        zc = sec[ci]['sentZh'][pi][si]
        if e['zh_from'] not in zc:
            errs.append(f'#{i} [{ci}.{pi}.{si}] 译文里找不到「{e["zh_from"]}」: {zc}')
        else:
            if True:  # 内存中始终先改，落盘由 --apply 控制
                sec[ci]['sentZh'][pi][si] = zc.replace(e['zh_from'], e['zh_to'])
        log.append(f'[ZH] [{ci}.{pi}.{si}] {e["tag"]}: {e["zh_from"]}→{e["zh_to"]}')
        continue
    if cur != e['old']:
        errs.append(f'#{i} [{ci}.{pi}.{si}] 原文不匹配\n  期望: {e["old"]}\n  实际: {cur}')
        continue
    new = e['new']
    # 硬校验
    if e['keep']:
        miss = [k for k in e['keep'] if k not in keys_of(new)]
        if miss:
            errs.append(f'#{i} [{ci}.{pi}.{si}] 保词丢失 {miss}: {new}')
    if not keys_of(new):
        errs.append(f'#{i} [{ci}.{pi}.{si}] 改写后 0 个标记: {new}')
    if re.search(r'\]\][a-z]', new):
        errs.append(f'#{i} [{ci}.{pi}.{si}] 标记后缀泄漏: {new}')
    if e['zh'] is None:
        zh = sec[ci]['sentZh'][pi][si]
        if not HAS_CJK_PUNCT.search(str(zh)):
            errs.append(f'#{i} [{ci}.{pi}.{si}] 译文无标点: {zh}')
    else:
        zh = e['zh']
        if not HAS_CJK_PUNCT.search(zh):
            errs.append(f'#{i} [{ci}.{pi}.{si}] 新译文无标点: {zh}')
        if True:  # 内存中始终先改，落盘由 --apply 控制
            sec[ci]['sentZh'][pi][si] = zh
    ko, kn = keys_of(e['old']), keys_of(new)
    if True:  # 内存中始终先改，落盘由 --apply 控制
        sec[ci]['paragraphs'][pi][si] = new
    log.append(f'[{ci}.{pi}.{si}] {e["tag"]}\n    − 旧: {e["old"]}\n    + 新: {new}\n    keys: {ko} → {kn}')

# --------- 章词表：新增纯文本不得引入未标记的声明词（门禁规则 12 预演）
def rule12_report():
    bad = []
    for ci, ch in enumerate(sec):
        decl = {str(w).lower() for w in ch.get('words', [])}
        marked, plain = set(), set()
        for para in ch['paragraphs']:
            for sent in para:
                for m in PLACE.finditer(sent):
                    marked.add(m.group(1).lower())
                bare = MARK_FULL.sub(' ', sent).lower()
                for w in decl:
                    if re.search(r'(?<![a-z])' + re.escape(w) + r'(?![a-z])', bare):
                        plain.add(w)
        d = sorted(plain - marked)
        if d:
            bad.append((ci, d))
    return bad

# --------- 门禁规则 16 预演：cmp 例句可查性
def cmp_report():
    import importlib.util
    spec = importlib.util.spec_from_file_location('ccd', str(ROOT / 'tools/check_compare_draft.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    sec_raw = json.dumps(sec, ensure_ascii=False, separators=(',', ':'))
    card_bits = []
    for _w, _c in vocab.items():
        card_bits.append(str(_w))
        if isinstance(_c, dict):
            card_bits += [str(_c.get(k) or '') for k in ('m', 'ex', 'exZh')]
            if isinstance(_c.get('note'), str):
                card_bits.append(_c['note'])
    hay = ' '.join([*mod.sec_variants(sec_raw), ' '.join(card_bits)]).lower()
    miss = []
    for w, c in vocab.items():
        if not (isinstance(c, dict) and isinstance(c.get('cmp'), dict)):
            continue
        note = c['cmp']
        for it in note.get('items', []):
            eg = it.get('eg')
            if isinstance(eg, str) and eg.strip() and eg.lower().strip() not in hay:
                miss.append(f'  {w}/{it.get("w")}: {eg}')
        for row in note.get('diff', []):
            for k in ('eg', 'collocation'):
                v = row.get(k)
                if isinstance(v, str) and v.strip() and v.lower().strip() not in hay:
                    miss.append(f'  {w} diff.{k}: {v}')
    # at / paras 锚点：成员必须仍在锚点段里被标记
    def _in_para(ci, pi, w):
        try:
            para = sec[ci]['paragraphs'][pi]
        except (IndexError, KeyError):
            return False
        return any(f'[[{w}:' in s or f'[[{w}]]' in s for s in para if isinstance(s, str))
    for w, c in vocab.items():
        if not (isinstance(c, dict) and isinstance(c.get('cmp'), dict)):
            continue
        note = c['cmp']
        members = [it.get('w') for it in note.get('items', []) if isinstance(it, dict)]
        for p in (note.get('paras') or []):
            if isinstance(p, (list, tuple)) and len(p) == 2:
                if not all(_in_para(p[0], p[1], m) for m in members):
                    miss.append(f'  [锚点 paras] {w}: {list(p)} 里成员已不全 {members}')
        at = note.get('at')
        if isinstance(at, (list, tuple)) and len(at) == 2:
            if not all(_in_para(at[0], at[1], m) for m in members):
                miss.append(f'  [锚点 at] {w}: {list(at)} 里成员已不全 {members}')
    return miss

new_missing = cmp_report()
r12 = rule12_report()

out = io.StringIO()
out.write(f'编辑条数: {len(E)}\n')
out.write('=' * 70 + '\n')
for l in log:
    out.write(l + '\n')
out.write('=' * 70 + '\n')
out.write('批量译文替换 / 分卷标题 / cmp 例句联动:\n')
for l in bulk_log + sub_log + cmp_log:
    out.write('  ' + l + '\n')
out.write('=' * 70 + '\n')
out.write(f'硬校验错误: {len(errs)}\n')
for x in errs:
    out.write('  ✗ ' + x + '\n')
out.write('\n' + '=' * 70 + '\n')
out.write('规则 12 预演（章声明词以纯文本出现却从未标记）:\n')
if r12:
    for ci, d in r12:
        out.write(f'  ch{ci}: {d}\n')
else:
    out.write('  无 → 通过\n')
out.write('\n' + '=' * 70 + '\n')
out.write(f'规则 16 预演（cmp 例句查无出处）: {len(new_missing)}\n')
for x in new_missing:
    out.write(x + '\n')

# 保词/失词总表
out.write('\n' + '=' * 70 + '\n')
lost = {}
for e in E:
    if e['old'] is None:
        continue
    for k in keys_of(e['old']):
        if k not in keys_of(e['new']):
            lost.setdefault(k, []).append(f'[{e["ci"]}.{e["pi"]}.{e["si"]}]')
out.write(f'移除的目标词标记（共 {len(lost)} 个词）:\n')
for k, v in sorted(lost.items()):
    out.write(f'  {k}: {len(v)} 处 {v}\n')

print(out.getvalue())

# 句数校验
total = sum(len(p) for ch in sec for p in ch['paragraphs'])
print('总句数:', total, '(基线 1809 + 24 = 1833)')

if errs:
    print('!! 有硬校验错误，未落盘')
    sys.exit(1)

if APPLY:
    body = json.dumps(sec, ensure_ascii=False, separators=(',', ':'))
    if raw_sec.decode('utf-8').endswith('\n'):
        body += '\n'
    sec_path.write_bytes(body.encode('utf-8'))
    print('已写入 data/sections.json:', len(body.encode('utf-8')), 'B (原', len(raw_sec), 'B )')
    vbody = json.dumps(vocab, ensure_ascii=False, separators=(',', ':'))
    if raw_vocab.decode('utf-8').endswith('\n'):
        vbody += '\n'
    vocab_path.write_bytes(vbody.encode('utf-8'))
    print('已写入 data/vocab.json:', len(vbody.encode('utf-8')), 'B (原', len(raw_vocab), 'B )')
else:
    print('（干跑模式，未写入）')
