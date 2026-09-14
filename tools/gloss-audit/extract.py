#!/usr/bin/env python3
"""抽取影子跟读数据为对齐表。幂等：只读 shadow，写 out/。"""
import json, re, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[2]
raw = (ROOT / 'shadow' / 'index.html').read_text(encoding='utf-8')

def grab(name):
    m = re.search(r'const %s = (\{.*?\});\n' % name, raw, re.S)
    assert m, name
    return json.loads(m.group(1))

def grab_list(name):
    m = re.search(r'const %s = (\[.*?\]);\n' % name, raw, re.S)
    assert m, name
    return json.loads(m.group(1))

def sense_list(mstr):
    return [p.strip() for p in re.split(r'[；;]', mstr or '') if p.strip()]

VOCAB = grab('VOCAB')
SECTIONS = grab_list('SECTIONS')
out = ROOT / 'tools' / 'gloss-audit' / 'out'
out.mkdir(parents=True, exist_ok=True)
out.joinpath('vocab-m.json').write_text(
    json.dumps({k: v.get('m', '') for k, v in VOCAB.items()}, ensure_ascii=False, indent=1),
    encoding='utf-8')
rows = []
for si, s in enumerate(SECTIONS):
    ens = [t for p in s['paragraphs'] for t in p]
    zhs = [z for p in s.get('sentZh', []) for z in p]
    assert len(ens) == len(zhs), (si, len(ens), len(zhs))
    for i, (en, zh) in enumerate(zip(ens, zhs)):
        marks = re.findall(r'\[\[([^\]:]+):', en)
        rows.append({'sec': si, 'i': i, 'en': en, 'zh': zh, 'marks': [x.lower() for x in marks]})
out.joinpath('sent-align.json').write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding='utf-8')
poly = [k for k, v in VOCAB.items() if len(sense_list(v.get('m', ''))) > 1]
polyset = set(poly)
out.joinpath('poly-sentences.json').write_text(json.dumps(
    [r for r in rows if polyset & set(r['marks'])], ensure_ascii=False, indent=1), encoding='utf-8')
senses_all = [sense_list(v.get('m', '')) for v in VOCAB.values()]
doublesemi = sum(1 for v in VOCAB.values() if '；；' in v.get('m', ''))
over3 = sum(1 for ss in senses_all if len(ss) > 3)
first2_over12 = sum(1 for ss in senses_all if len('；'.join(ss[:2])) > 12)
print('vocab:', len(VOCAB), 'sents:', len(rows), 'poly-words:', len(poly),
      'poly-sents:', sum(1 for r in rows if polyset & set(r['marks'])))
print('doublesemi:', doublesemi, 'over-3-senses:', over3, 'two-sense-over12:', first2_over12)
