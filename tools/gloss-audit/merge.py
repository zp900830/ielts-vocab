#!/usr/bin/env python3
"""对比 shadow 定稿与两处下游，输出 diff 报告。只生成 diff，不写目标文件。

diff 口径（Task 7 定稿）:
- shadow-wins：下游 m 与 shadow 定稿不一致即计入 diff。
- legacy_longer（用户定夺区，仅 audit 未动过的键）:
  audit 未改 shadow 该键 (cur == pre-audit)，且 legacy m 非 pre m 子串、
  且长度更长 -> 保持不变，列入 hold，由用户逐条定夺。
  audit 动过的键一律 shadow-wins（audit 即已签复核，不重复定夺）。
- sentZh 13 对：由 git(ab12416=pre-R3 vs 当前)逐元对比推导，只报告
  old/new 在 legacy 中的出现次数，不写回。
- glossParts：只报告 shadow/legacy 函数体是否一致，不写回。

写回由 apply（一次性脚本，见 task-7-report.md）执行，复验重跑本脚本：
vocab diff 归零；legacy m-diff 仅剩 hold 区。
"""
import json
import re
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = pathlib.Path(__file__).parent / 'out'
PRE_AUDIT_REF = 'aa12c72:shadow/index.html'
PRE_R3_REF = 'ab12416:shadow/index.html'


def grab_vocab(text):
    m = re.search(r'const VOCAB = (\{.*?\});\n', text, re.S)
    assert m, 'VOCAB not found'
    return json.loads(m.group(1))


def git_show(ref):
    r = subprocess.run(['git', '-C', str(ROOT), 'show', ref],
                       capture_output=True)
    assert r.returncode == 0, ref
    return r.stdout.decode('utf-8')


shadow_raw = (ROOT / 'shadow' / 'index.html').read_text(encoding='utf-8')
shadow_vocab = grab_vocab(shadow_raw)

disk = json.load(open(ROOT / 'data' / 'vocab.json', encoding='utf-8'))
flat = {}
for ch in disk['chapters']:
    for w in ch['words']:
        flat.setdefault(w['w'].lower(), w)

diff_vocab = {k: {'old': w.get('m', ''), 'new': shadow_vocab[k]['m']}
              for k, w in flat.items()
              if k in shadow_vocab and w.get('m', '') != shadow_vocab[k]['m']}

legacy_raw = (ROOT / '雅思影子跟读.html').read_text(encoding='utf-8')
legacy_vocab = grab_vocab(legacy_raw)
diff_legacy = {k: {'old': v.get('m', ''), 'new': shadow_vocab[k]['m']}
               for k, v in legacy_vocab.items()
               if k in shadow_vocab and v.get('m', '') != shadow_vocab[k]['m']}

# audit 改过的键（pre-audit 基线来自 git，确定性）
pre_vocab = grab_vocab(git_show(PRE_AUDIT_REF))
assert set(pre_vocab) == set(shadow_vocab), 'key set changed by audit'
audit_changed = {k for k in shadow_vocab
                 if shadow_vocab[k]['m'] != pre_vocab[k]['m']}
pre_diverged = {k for k in legacy_vocab
                if legacy_vocab[k]['m'] != pre_vocab[k]['m']}


def longer_than(leg, base):
    return (leg not in base) and len(leg) > len(base)


hold = sorted(k for k in diff_legacy
              if k not in audit_changed
              and longer_than(legacy_vocab[k]['m'], pre_vocab[k]['m']))
apply_keys = sorted(k for k in diff_legacy if k not in hold)


def grab_sentzh(text):
    blocks = []
    for m in re.finditer(r'"sentZh": \[', text):
        i = m.end() - 1
        depth, instr, esc, k = 0, False, False, i
        while True:
            c = text[k]
            if instr:
                if esc:
                    esc = False
                elif c == '\\':
                    esc = True
                elif c == '"':
                    instr = False
            else:
                if c == '"':
                    instr = True
                elif c == '[':
                    depth += 1
                elif c == ']':
                    depth -= 1
                    if depth == 0:
                        break
            k += 1
        blocks.append(json.loads(text[m.end() - 1:k + 1]))
    return blocks


def flat_sentzh(blocks):
    return [s for b in blocks for p in b for s in p]


pre_z = flat_sentzh(grab_sentzh(git_show(PRE_R3_REF)))
cur_z = flat_sentzh(grab_sentzh(shadow_raw))
assert len(pre_z) == len(cur_z), (len(pre_z), len(cur_z))
sentzh_pairs = [{'old': a, 'new': b} for a, b in zip(pre_z, cur_z) if a != b]
sentzh_status = [{'old_count': legacy_raw.count(p['old']),
                  'new_count': legacy_raw.count(p['new'])} | p
                 for p in sentzh_pairs]


def func_body(text, name='glossParts'):
    i = text.find('function %s(k) {' % name)
    assert i > 0, name
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


gp_shadow = func_body(shadow_raw)
gp_legacy = func_body(legacy_raw)

print('vocab.json diff:', len(diff_vocab))
print('legacy m diff:', len(diff_legacy))
print('audit-changed keys:', len(audit_changed))
print('pre-diverged (legacy vs pre-audit):', len(pre_diverged))
print('legacy apply:', len(apply_keys))
print('legacy hold (用户定夺区):', len(hold))
print('sentZh pairs:', len(sentzh_pairs))
print('glossParts equal:', gp_shadow == gp_legacy)

OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'sync-diff.json').write_text(json.dumps({
    'vocab_json': diff_vocab,
    'legacy_apply': {k: diff_legacy[k] for k in apply_keys},
    'legacy_hold': {k: diff_legacy[k] for k in hold},
    'audit_changed': sorted(audit_changed),
    'sentzh_pairs': sentzh_pairs,
    'sentzh_status': sentzh_status,
    'glossParts_equal': gp_shadow == gp_legacy,
}, ensure_ascii=False, indent=1), encoding='utf-8')
print('wrote', OUT / 'sync-diff.json')
