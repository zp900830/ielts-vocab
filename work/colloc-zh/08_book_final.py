#!/usr/bin/env python3
"""把重扫得到的书条目清一遍：修 OCR 错拼、拆串行条目、删水印垃圾。
输出 work/colloc-zh/book_pairs_final.json（英文以书为准，中文原样；只修 OCR 错字，不改释义）
"""
import json, re, os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'work/colloc-zh/book_pairs_clean.json')
OUT = os.path.join(ROOT, 'work/colloc-zh/book_pairs_final.json')

pairs = json.load(open(SRC, encoding='utf-8'))

# 串行条目：一行里挤了两条
SPLIT = {
    'cause damage to the environment': [('cause damage to the environment', '对环境造成破坏'),
                                        ('drop litter', '扔垃圾')],
    'achieve a work-life balance': [('achieve a work-life balance', '实现工作和生活的平衡'),
                                    ('family commitments', '家庭责任')],
}

# OCR 错拼（只改正形，不换词）
FIX = {
    'gaather information': 'gather information',
    'reenhouse gases': 'greenhouse gases',
    'ereenhouse gases': 'greenhouse gases',
    'intense compelition': 'intense competition',
    'become worid famous': 'become world famous',
    'facial expressioo': 'facial expression',
    'members of conmunity': 'members of community',
    'store inforation': 'store information',
    'gather first-hand inforation': 'gather first-hand information',
    'stifie creativity': 'stifle creativity',
    'the eq ual access to education': 'equal access to education',
    'firee-interest Inams': 'interest-free loans',
    'altemative energy sources': 'alternative energy sources',
    'gcnerate electricity': 'generate electricity',
    'educate the public abou': 'educate the public about',
    'devolc fime': 'devote time',
    'tevise for examos': 'revise for exams',
    'exam grades/examresults': 'exam grades/exam results',
    'Iearn Facts by heart': 'learn facts by heart',
    'rote leamning': 'rote learning',
    'tamily dinners': 'family dinners',
    'a sense ofloneliness': 'a sense of loneliness',
    'appls pesticides': 'apply pesticides',
    'genetic engineuring': 'genetic engineering',
    'mnake good friends': 'make good friends',
    'Howering plants': 'flowering plants',
    'eam money': 'earn money',
    'redevelop ru-down urban areas': 'redevelop run-down urban areas',
    'teleworking. telecommuting, work at liome': 'teleworking, telecommuting, work at home',
    'save uime': 'save time',
    'attend ineetings': 'attend meetings',
    'eamn salaries': 'earn salaries',
    'camn money': 'earn money',
    'biroaden horizons': 'broaden horizons',
    'educational programnies': 'educational programmes',
    'make way for moder buildings': 'make way for modern buildings',
    'up-to-date cquipment': 'up-to-date equipment',
    'mnechanise tasks': 'mechanise tasks',
    'grow the cconomy': 'grow the economy',
    'invent new dnugs': 'invent new drugs',
    'cultural diffierences': 'cultural differences',
    'westem countries': 'western countries',
    'misiead the public': 'mislead the public',
    'fit into the mnoder world': 'fit into the modern world',
    'nisk averse': 'risk averse',
    'a source of facome': 'a source of income',
    'otice party': 'office party',
    'soclal networking websites': 'social networking websites',
    'well-suited to ajob': 'well-suited to a job',
    'recelve a university education 3': 'receive a university education',
    'disadv aniaged students': 'disadvantaged students',
    'exempted froni tuition fees': 'exempted from tuition fees',
    "drop out of' school": 'drop out of school',
    'educational cquality': 'educational equality',
    'sundent loans': 'student loans',
    'chariable organisations': 'charitable organisations',
    'receive vocational uaining': 'receive vocational training',
    'Iead a healthy life': 'lead a healthy life',
    'have a coffce': 'have a coffee',
    'gqo for a swim': 'go for a swim',
    'financial difticulties': 'financial difficulties',
    'i a globalised world': 'in a globalised world',
    'fuent in the first language': 'fluent in the first language',
    'state-funded soicntific research': 'state-funded scientific research',
    'the bi-tech industry': 'the high-tech industry',
    'rush-hour trailic': 'rush-hour traffic',
    'uravel by car': 'travel by car',
    'fower garden': 'flower garden',
    'prefeined areas of study': 'preferred areas of study',
    'passionate ahout': 'passionate about',
    'develop talenis': 'develop talents',
    'redluce the quality of life': 'reduce the quality of life',
    'pult pressure on': 'put pressure on',
    'Fransport costs': 'transport costs',
    'cause dumage to the environment': 'cause damage to the environment',
    'on the verge of extinetiou': 'on the verge of extinction',
    'vocationaljob training': 'vocational/job training',
    'a deterrent effect f': 'a deterrent effect',
    'wear uniforms i': 'wear uniforms',
    'reduce poverty，': 'reduce poverty',
    'g0 bankrupt': 'go bankrupt',
    'create jobs/': 'create jobs',
    'suburban commuters 3': 'suburban commuters',
    'male-dominated industries/': 'male-dominated industries',
}

# 水印/页码残留，整条丢
DROP = {'FTS', 'LTS', 'eq', 'ual'}

# 中文 OCR 错字
ZH_FIX = {
    '思辦能力': '思辨能力',
    '买际工作的能力': '实际工作的能力',
    '稳足的收入': '稳定的收入',
    '锻燒': '锻炼',
    '虛假新闻': '虚假新闻',
}

out, seen = [], set()
for en, zh in pairs:
    zh = ZH_FIX.get(zh, zh)
    if en in DROP or not en or not zh:
        continue
    if en in SPLIT:
        for e2, z2 in SPLIT[en]:
            k = e2.lower()
            if k not in seen:
                seen.add(k); out.append((e2, z2))
        continue
    en2 = FIX.get(en, en)
    # 去掉尾部杂符号
    en2 = re.sub(r'\s*[3/]$', '', en2).strip()
    if not en2 or not re.search(r'[A-Za-z]', en2):
        continue
    k = en2.lower()
    if k in seen:
        continue
    seen.add(k); out.append((en2, zh))

json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('最终条目', len(out))
for en, zh in out[:8]:
    print(' ', en, '=>', zh)
