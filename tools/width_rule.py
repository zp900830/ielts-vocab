#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""「一行有多宽」的唯一一把尺。

为什么单独一个文件：这条规则被抄进了 4 个地方（生产校验、两个自写工具、外加代理手算），
三份独立审核各自反推出不同口径，吵了一轮谁也没法证伪谁 —— 因为大家量的根本不是同一把尺。
以后只改这里，别处一律 import。

口径（2026-09-20 拍板）：汉字与全角标点各记 1，其余（拉丁字母、空格、半角括号）记 0.5。
上限：段末默认那一行 ≤40，总结句 ≤30。上限不松。
"≤40" 的验收标准（2026-09-20 他拍板，改口径不改数字）：**手机上占两行以内**，不是"一行读完"。
52+5 张卡实测：段末容器 334px / 字号 13px / 行高 22.1px → 一行只装得下约 25 个汉字当量，
所以 40 这个数从批次 1A 起对应的就是两行。别把它压到 25 —— 那等于把已验收的 57 张卡推倒重写。

用法：
  python3 tools/width_rule.py --selftest          # 尺子本身没被人改跑偏
  python3 tools/width_rule.py --bless <草稿...>   # 把当前实测值钉成基准（只在人工核对过后跑）
  python3 tools/width_rule.py --check  <草稿...>  # 与基准比对，漂了就报
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PINFILE = os.path.join(ROOT, 'tools', 'width_samples.json')
LINE_CAP, SUM_CAP = 40, 30   # 40 = 手机上两行以内（不是一行，见文件头验收标准）。压到 25 等于推倒 57 张已验收的卡。


def width(t):
    return sum(1 if ('一' <= c <= '鿿') or ('　' <= c <= '〿') or ('＀' <= c <= '￯') else 0.5
               for c in t or '')


# ---------- 从草稿里把两行取出来（和 tools/audit_ledger.py 同一套形状约定） ----------
def extract(md):
    """→ [(组标题, kind, 文本)]，kind ∈ {'line','sum'}"""
    out, cur, lines = [], None, md.split('\n')
    i = 0
    while i < len(lines):
        ln = lines[i]
        g = re.match(r'^##\s+(组\s*\d+.*)$', ln)
        if g:
            cur = re.sub(r'\s+｜.*$', '', g.group(1)).strip()
        elif re.match(r'^##\s', ln):
            cur = None
        if cur and re.match(r'^(?:#{2,6}\s+|\*\*)[^#]*默认', ln):
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1
            if j < len(lines) and lines[j].strip().startswith('```'):
                j += 1
                body = []
                while j < len(lines) and not lines[j].strip().startswith('```'):
                    body.append(lines[j])
                    j += 1
                out.append((cur, 'line', '\n'.join(body).strip()))
            i = j + 1
            continue
        if cur and re.match(r'^(?:#{2,6}\s+|\*\*)[^#]*总结句', ln):
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1
            body = []
            while j < len(lines) and lines[j].strip() and not lines[j].startswith('#'):
                body.append(lines[j].strip().lstrip('>').strip())
                j += 1
            out.append((cur, 'sum', ' '.join([b for b in body if b])))
            i = j
            continue
        i += 1
    return out


def selftest():
    """钉死几条人工核对过的读数。改了 width() 就会在这里炸。"""
    cases = [
        # 这三条初稿是我手算的，跑出来全错 —— 恰好证明"手算宽度"不能当依据（草稿里的标称值也是这么来的）
        ('damp = 摸得着（cold and damp、damp clay），humid = 吸得到（uncomfortably humid）', 40.0),
        ('curse = 诅咒（恨你），swear = 骂街（烦你）。', 22.0),
        ('', 0.0),
        ('纯汉字十字', 5.0),
        ('（）「」、。：', 7.0),
        ('abc 中文', 4.0),
    ]
    bad = [(t, w, width(t)) for t, w in cases if width(t) != w]
    if bad:
        for t, want, got in bad:
            print(f'FAIL 期望 {want} 实得 {got}: {t!r}')
        return 1
    print(f'selftest ok（{len(cases)} 条读数钉死）')
    return 0


def main(argv):
    if '--selftest' in argv:
        return selftest()
    paths = [a for a in argv if not a.startswith('--')]
    bless = '--bless' in argv
    samples = {}
    for p in paths:
        for grp, kind, text in extract(open(p, encoding='utf-8').read()):
            samples[f'{os.path.basename(p)}::{grp}::{kind}'] = {'w': width(text), 't': text}
    if bless:
        json.dump(samples, open(PINFILE, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print(f'已钉 {len(samples)} 条实测值 → tools/width_samples.json')
        return 0
    if not os.path.exists(PINFILE):
        print('没有基准文件，先 --bless（只在人工核对宽度之后跑一次）')
        return 2
    pin = json.load(open(PINFILE, encoding='utf-8'))
    drift = [(k, v['w'], pin[k]['w'], v['t']) for k, v in samples.items()
             if k in pin and abs(pin[k]['w'] - v['w']) > 0.01]
    over = [(k, v['w'], v['t']) for k, v in samples.items()
            if (k.endswith('::line') and v['w'] > LINE_CAP)
            or (k.endswith('::sum') and v['w'] > SUM_CAP)]
    print(f'比对 {len(samples)} 条 / 基准 {len(pin)} 条 / 漂移 {len(drift)} / 超限 {len(over)}')
    for k, got, want, t in drift[:20]:
        print(f'  漂移 {k}: 基准 {want} → 现在 {got}   {t[:40]}')
    for k, got, t in over[:20]:
        print(f'  超限 {k}: {got}   {t[:46]}')
    missing = [k for k in pin if k not in samples]
    if missing:
        print(f'  基准里有 {len(missing)} 条这次没量到（草稿少了组？版式没被认出来？）：')
        for k in missing[:10]:
            print(f'    {k}')
    return 1 if (drift or over or missing) else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
