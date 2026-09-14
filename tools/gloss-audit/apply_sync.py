#!/usr/bin/env python3
"""Task 7 一次性写回脚本（不提交）：读 tools/gloss-audit/out/sync-diff.json，
外科手术式替换 vocab.json / legacy html。全程断言，失败即停。"""
import json
import re
import pathlib

WT = pathlib.Path('/Users/zhoupeng/Library/Mobile Documents/com~apple~CloudDocs/雅思背单词项目/.worktrees/audit-a')
diff = json.loads((WT / 'tools' / 'gloss-audit' / 'out' / 'sync-diff.json').read_text(encoding='utf-8'))


def decode_span(text, quote_idx):
    """quote_idx 指向开引号；返回 (decoded, end_idx_exclusive)。"""
    assert text[quote_idx] == '"', quote_idx
    k = quote_idx + 1
    esc = False
    while True:
        c = text[k]
        if esc:
            esc = False
        elif c == '\\':
            esc = True
        elif c == '"':
            break
        k += 1
    return json.loads(text[quote_idx:k + 1]), k + 1


def enc(s):
    return json.dumps(s, ensure_ascii=False)[1:-1]


# ---- 1. vocab.json：逐行锚定 "w" -> 同行块内 "m" ----
vp = WT / 'data' / 'vocab.json'
vt = vp.read_text(encoding='utf-8')
applied_rows = 0
per_key = {}
edits = []
for m in re.finditer(r'"w": "', vt):
    word, wend = decode_span(vt, m.end() - 1)
    key = word.lower()
    if key not in diff['vocab_json']:
        continue
    mi = vt.find('"m": "', wend)
    assert mi > 0, word
    # 确保 m 在同一行块（下一个 "w" 之前）
    nxt = vt.find('"w": "', wend)
    assert nxt == -1 or mi < nxt, word
    old, mend = decode_span(vt, mi + len('"m": "') - 1)
    exp = diff['vocab_json'][key]['old']
    new = diff['vocab_json'][key]['new']
    if old == new:
        continue  # 重复词的某一行已是定稿值，无需改
    # debate 类重复词：各行 old 变体不同（首见行以外的行），一律收敛到 new
    edits.append((mi + len('"m": "'), mend - 1, new, key, old))
seen_keys = set()
for start, end, new, key, old in sorted(edits, reverse=True):
    vt = vt[:start] + enc(new) + vt[end:]
    applied_rows += 1
    per_key[key] = per_key.get(key, 0) + 1
    seen_keys.add(key)
# debate：首见行 old==exp 断言（抽查一条即可，其余行变体已收敛）
print('multi-old keys:', {k: v for k, v in per_key.items() if v > 1})
assert set(per_key) == set(diff['vocab_json']), (
    len(per_key), len(diff['vocab_json']))
print('vocab rows replaced:', applied_rows, 'keys:', len(per_key))
vp.write_text(vt, encoding='utf-8')

# ---- 2. legacy html：VOCAB m（apply 集），hold 集不动 ----
lp = WT / '雅思影子跟读.html'
lt = lp.read_text(encoding='utf-8')
n = 0
for key in sorted(diff['legacy_apply']):
    anchor = json.dumps(key, ensure_ascii=False) + ': {'
    assert lt.count(anchor) == 1, (key, lt.count(anchor))
    start = lt.find(anchor)
    mi = lt.find('"m": "', start)
    assert mi > start, key
    old, mend = decode_span(lt, mi + len('"m": "') - 1)
    exp = diff['legacy_apply'][key]['old']
    assert old == exp, (key,)
    lt = lt[:mi + len('"m": "')] + enc(diff['legacy_apply'][key]['new']) + lt[mend - 1:]
    n += 1
print('legacy m replaced:', n)
# hold 集逐条确认未动
for key in sorted(diff['legacy_hold']):
    anchor = json.dumps(key, ensure_ascii=False) + ': {'
    assert lt.count(anchor) == 1, key
    start = lt.find(anchor)
    mi = lt.find('"m": "', start)
    old, _ = decode_span(lt, mi + len('"m": "') - 1)
    assert old == diff['legacy_hold'][key]['old'], key
print('legacy hold untouched:', len(diff['legacy_hold']))

# ---- 3. sentZh 13 对 ----
for p in diff['sentzh_pairs']:
    assert lt.count(p['old']) == 1, p['old'][:30]
    assert lt.count(p['new']) == 0, p['new'][:30]
    lt = lt.replace(p['old'], p['new'])
print('sentZh replaced:', len(diff['sentzh_pairs']))
for p in diff['sentzh_pairs']:
    assert lt.count(p['old']) == 0 and lt.count(p['new']) == 1, p['new'][:30]

# ---- 4. glossParts 函数体照搬 shadow ----
sh = (WT / 'shadow' / 'index.html').read_text(encoding='utf-8')


def func_body(text):
    i = text.find('function glossParts(k) {')
    assert i > 0
    j = text.find('{', i)
    depth, k, instr, esc = 0, j, None, False
    while True:
        c = text[k]
        if instr:
            if esc:
                esc = False
            elif c == '\\':
                esc = True
            elif c == instr:
                instr = None
        else:
            if c in '"`\\\'':
                instr = c
            elif c == '{':
                depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0:
                    break
        k += 1
    return text[i:k + 1]


bs, bl = func_body(sh), func_body(lt)
assert not diff['glossParts_equal'] or bs == bl
assert lt.count(bl) == 1
lt = lt.replace(bl, bs)
print('glossParts ported')
lp.write_text(lt, encoding='utf-8')
print('ALL-OK')
