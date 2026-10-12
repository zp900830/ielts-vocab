# -*- coding: utf-8 -*-
"""
cmp_apply.py —— 把 cmp_v4 的辨析卡清洗结果落盘到 data/vocab.json。

设计要点（为什么这样写）：
1. 默认 dry-run，`--apply` 才写盘；写盘前先备份原文件到 work/（单行紧凑 JSON 无价之宝，改错无法 git 之外的兜底）。
2. 只改 cmp 字段：clean_card 只碰 title/summary/items 的 pos/sense/core/scene 与 diff 行；
   eg（门禁 16 例句出处）、w/p、at（章节锚点）等一律原样 —— 写盘前用断言逐项证明。
3. 写盘格式必须与现网一致：ensure_ascii=False + separators=(',',':') + 无尾换行。
   （行首已由 probe_roundtrip.py 验证：json.load → json.dump 往返字节一致，所以「干净字段零漂移」是保证得了的。）
4. SHADOW_DATA_VER 用与 scripts/validate_data.py 完全同口径的 digest 算法重算并回写 index.html ——
   漏改这一处，手机端会拿旧缓存 vocab.json（validate_data.py 的门禁 0 会直接拦）。
"""
import sys, json, re, hashlib, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'work'))
import cmp_v4  # noqa: E402

VOCAB = ROOT / 'data' / 'vocab.json'
INDEX = ROOT / 'index.html'
SHADOW_VER_FILES = ['data/sections.json', 'data/vocab.json', 'data/chapters.json']


def digest(rels, override=None):
    """与 validate_data.py 的 digest() 完全同口径：rel + len(8B BE) + bytes 顺序喂 sha256，取前 10 位。
    override：{rel: bytes} —— dry-run 时用「内存里的新 vocab.json」替掉磁盘旧文件，
    否则干跑报的是旧哈希、看起来像「不用改 SHADOW_DATA_VER」，误导（2026-10-12 修）。"""
    h = hashlib.sha256()
    for rel in rels:
        b = (override or {}).get(rel) or (ROOT / rel).read_bytes()
        h.update(rel.encode('utf-8'))
        h.update(len(b).to_bytes(8, 'big'))
        h.update(b)
    return h.hexdigest()[:10]


def dump_bytes(obj):
    """现网格式：单行紧凑 JSON、无尾换行。"""
    return json.dumps(obj, ensure_ascii=False, separators=(',', ':')).encode('utf-8')


def walk_all_texts(obj):
    """收集一棵子树里所有字符串（用于行话扫描）。"""
    out = []
    if isinstance(obj, dict):
        for v in obj.values():
            out += walk_all_texts(v)
    elif isinstance(obj, list):
        for v in obj:
            out += walk_all_texts(v)
    elif isinstance(obj, str):
        out.append(obj)
    return out


def main():
    apply = '--apply' in sys.argv
    old_bytes = VOCAB.read_bytes()
    V = json.loads(old_bytes.decode('utf-8'))

    # ---------- 1) 生成清洗结果 ----------
    newV = {}
    changed_cards = []
    changed_fields = 0
    dropped_rows = 0
    for w, v in V.items():
        if isinstance(v, dict) and isinstance(v.get('cmp'), dict):
            nc = cmp_v4.clean_card(v['cmp'], w)
            dropped_rows += len(v['cmp'].get('diff') or []) - len(nc.get('diff') or [])
            if json.dumps(nc, ensure_ascii=False, sort_keys=True) != json.dumps(v['cmp'], ensure_ascii=False, sort_keys=True):
                changed_cards.append(w)
                # 统计改动字段数（含 dim）
                changed_fields += sum(
                    1 for path, t in cmp_v4.walk_fields(v['cmp'])
                    if _new_of(nc, path) != t
                )
            nv = dict(v)
            nv['cmp'] = nc
            newV[w] = nv
        else:
            newV[w] = v

    # ---------- 2) 断言：cmp 之外的字段与 eg 必须原样 ----------
    errs = []
    for w in V:
        a, b = V[w], newV[w]
        if {k: x for k, x in a.items() if k != 'cmp'} != {k: x for k, x in b.items() if k != 'cmp'}:
            errs.append(f'{w}: cmp 之外的词条字段被改动')
        c1, c2 = a.get('cmp'), b.get('cmp')
        if not isinstance(c1, dict):
            continue
        if c1.get('at') != c2.get('at'):
            errs.append(f'{w}: at 锚点被改动')
        if c1.get('type') != c2.get('type') or c1.get('group') != c2.get('group'):
            errs.append(f'{w}: type/group 被改动')
        i1 = c1.get('items') or []; i2 = c2.get('items') or []
        if len(i1) != len(i2):
            errs.append(f'{w}: items 数量 {len(i1)}->{len(i2)}')
            continue
        for x, y in zip(i1, i2):
            for f in ('w', 'p', 'eg'):
                if x.get(f) != y.get(f):
                    errs.append(f'{w}.{x.get("w")}: {f} 被改动')
            if set(x.keys()) != set(y.keys()):
                errs.append(f'{w}.{x.get("w")}: item 键集合变化')
        # diff 只许「丢行」，不许增行；行内键集合只许不变
        d1 = c1.get('diff') or []; d2 = c2.get('diff') or []
        if len(d2) > len(d1):
            errs.append(f'{w}: diff 行数增加 {len(d1)}->{len(d2)}')

    if errs:
        print('!! 断言失败，不落盘：')
        for e in errs[:20]:
            print('  ', e)
        sys.exit(1)

    # ---------- 3) 验收：清洗后的 cmp 里不许再有行话 ----------
    resid = []
    for w in newV:
        c = newV[w].get('cmp')
        if not isinstance(c, dict):
            continue
        for path, t in cmp_v4.walk_fields(c):
            hits = cmp_v4.scan(t)
            if hits:
                resid.append((w, path, hits, t[:100]))
    if resid:
        print(f'!! 验收残余 {len(resid)} 条，不落盘：')
        for w, p, h, t in resid[:20]:
            print(f'   [{w}.{p}] {h} {t}')
        sys.exit(1)

    new_bytes = dump_bytes(newV)

    # ---------- 4) 落盘 ----------
    print(f'改动卡片: {len(changed_cards)} / {sum(1 for v in V.values() if isinstance(v, dict) and isinstance(v.get("cmp"), dict))}')
    print(f'改动字段数（含 dim）: {changed_fields}')
    print(f'丢弃 diff 行: {dropped_rows}')
    print(f'vocab.json 字节: {len(old_bytes)} -> {len(new_bytes)}（{len(new_bytes) - len(old_bytes):+d}）')

    new_ver = None
    if apply:
        backup = ROOT / 'work' / 'vocab_backup_2026-10-12.json'
        if not backup.exists():
            shutil.copy2(VOCAB, backup)
            print(f'备份 -> {backup.relative_to(ROOT)}')
        VOCAB.write_bytes(new_bytes)
        # 复核写入：重新读回，json 相等
        back = json.loads(VOCAB.read_bytes().decode('utf-8'))
        assert dump_bytes(back) == new_bytes, '写入复核失败'
        # SHADOW_DATA_VER 回写（必须在 vocab.json 写完后算）
        new_ver = digest(SHADOW_VER_FILES)
        sh = INDEX.read_text(encoding='utf-8')
        ms = re.search(r'const SHADOW_DATA_VER = "([0-9a-fA-F]+)"', sh)
        assert ms, 'index.html 找不到 SHADOW_DATA_VER'
        old_ver = ms.group(1)
        if old_ver != new_ver:
            sh = sh.replace(f'const SHADOW_DATA_VER = "{old_ver}"', f'const SHADOW_DATA_VER = "{new_ver}"')
            INDEX.write_text(sh, encoding='utf-8')
            sh2 = INDEX.read_text(encoding='utf-8')
            got = re.search(r'const SHADOW_DATA_VER = "([0-9a-fA-F]+)"', sh2).group(1)
            assert got == new_ver, 'SHADOW_DATA_VER 回写失败'
            print(f'SHADOW_DATA_VER: {old_ver} -> {new_ver}')
        else:
            print(f'SHADOW_DATA_VER 不变: {new_ver}')
    else:
        # dry-run：用内存里的新 vocab.json 参与哈希（模拟落盘后的真实值）
        new_ver = digest(SHADOW_VER_FILES, override={'data/vocab.json': new_bytes})
        cur_ver = re.search(r"const SHADOW_DATA_VER = \"([0-9a-fA-F]+)\"", INDEX.read_text(encoding="utf-8")).group(1)
        print(f'(dry-run) 落盘后哈希将是: {new_ver}（当前 index.html = {cur_ver}）')
        if new_ver != cur_ver:
            print('           → 落盘时需同步改 SHADOW_DATA_VER（脚本自动做）')
        else:
            print('           → 哈希不变，无需改 SHADOW_DATA_VER')
        print('dry-run 结束，未写盘。加 --apply 落盘。')


_MISSING = object()


def _new_of(card, path):
    """按 walk_fields 的 path 语法在清洗后的 card 上取值；丢行后旧索引越界返回哨兵（只服务统计）。"""
    try:
        m = re.match(r'^items\[(\d+)\]\.(\w+)$', path)
        if m:
            return (card.get('items') or [])[int(m.group(1))].get(m.group(2))
        m = re.match(r'^diff\[(\d+)\]\.(\w+)$', path)
        if m:
            return (card.get('diff') or [])[int(m.group(1))].get(m.group(2))
        return card.get(path)
    except (IndexError, AttributeError):
        return _MISSING


if __name__ == '__main__':
    main()
