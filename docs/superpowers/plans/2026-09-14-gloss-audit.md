# 翻译/释义排查修正（子项目 A）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按 R0–R3 修完影子跟读全部句译与词条释义，并同步两处下游，全量测试通过。

**Architecture:** 脚本抽取对齐表 → 人审定规则 → 脚本批量改（Python 精确字符串替换，不碰代码行）→ 每批独立 diff 报告由用户逐条签字 → 门禁（node --check + 18 tests）。

**Tech Stack:** Python 3（数据抽取/合并）、Node（语法校验）、Playwright（E2E）。

**Spec:** `docs/superpowers/specs/2026-09-14-gloss-audit-design.md`（v2.1）

## Global Constraints

- 真相源只有 `shadow/index.html` 内联数据；同步方向 shadow → `data/vocab.json` → `雅思影子跟读.html`，不可反向。
- 本期内禁止重跑 `build_ielts.py`（其注入正则命中数据块，且产出无 sentZh/paraZh）。
- 不碰例句、例句译文、音标；`paraZh` 仅浏览。
- 每个数据改动必须出现在某份 diff 报告里并经用户签字后合入。
- 提交门禁：抽出内联 script 的 `node --check` + 18 个 test() 全过。

---

### Task 1: Step 0 安全冻结（备份 + 构建器上锁）

**Files:**
- Create: `shadow/index.html.backup-20260914`（时间戳备份，不提交，沿用仓库已有 backup 惯例）
- Modify: `build_ielts.py:8`（OUT 行加冻结注释，不改逻辑）

**Interfaces:**
- Consumes: 无
- Produces: 备份文件；`git HEAD` 即回滚点（已提交状态干净可恢复）

- [ ] **Step 1: 创建时间戳备份**

```bash
cp "shadow/index.html" "shadow/index.html.backup-20260914"
ls -la shadow/index.html.backup-20260914
```

- [ ] **Step 2: 给构建器加冻结注释**

```python
# 旧行：
OUT = "/Users/zhoupeng/Library/Mobile Documents/com~apple~CloudDocs/雅思背单词项目/雅思影子跟读.html"
# 新行（只加注释，不改值）：
# FROZEN 2026-09-14：子项目A进行中，禁止重跑（注入正则会冲掉 shadow 内联 sentZh/paraZh 人工成果）
OUT = "/Users/zhoupeng/Library/Mobile Documents/com~apple~CloudDocs/雅思背单词项目/雅思影子跟读.html"
```

- [ ] **Step 3: 验证 git 可回滚**

```bash
git status --short shadow/index.html
git stash list | head -2
```

预期：工作区干净（只有 backup 未跟踪文件），`git show HEAD:shadow/index.html` 可取回。

- [ ] **Step 4: Commit**

```bash
git add build_ielts.py
git commit -m "chore: 冻结 build_ielts.py（子项目A期间禁止重跑，防冲掉句译）"
```

---

### Task 2: 抽取脚本 + 基线报表

**Files:**
- Create: `tools/gloss-audit/extract.py`
- Create: `docs/superpowers/reports/2026-09-14-gloss-baseline.md`（基线数字报表，提交存档）

**Interfaces:**
- Consumes: `shadow/index.html:933-935`（SECTIONS/VOCAB/CHAPTERS 三行）、`data/vocab.json`
- Produces: `tools/gloss-audit/out/` 下 `vocab-m.json`、`sent-align.json`、`poly-sentences.json`（Task 3–6 的输入）；报表数字供用户核对

- [ ] **Step 1: 写抽取脚本**

```python
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

VOCAB = grab('VOCAB')
SECTIONS = grab_list('SECTIONS')
out = ROOT / 'tools' / 'gloss-audit' / 'out'
out.mkdir(parents=True, exist_ok=True)
(json.dumps(VOCAB, ensure_ascii=False, indent=1)).__class__
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
poly = [k for k, v in VOCAB.items() if len([p for p in re.split(r'[；;]', v.get('m', '')) if p.strip()]) > 1]
polyset = set(poly)
out.joinpath('poly-sentences.json').write_text(json.dumps(
    [r for r in rows if polyset & set(r['marks'])], ensure_ascii=False, indent=1), encoding='utf-8')
print('vocab:', len(VOCAB), 'sents:', len(rows), 'poly-words:', len(poly),
      'poly-sents:', sum(1 for r in rows if polyset & set(r['marks'])))
```

- [ ] **Step 2: 运行并核对基线数字**

```bash
python3 tools/gloss-audit/extract.py
```

预期输出：`vocab: 3219 sents: 1809 poly-sents: 1502`（与评审实测一致；poly-words 预期 2209）。

- [ ] **Step 3: 写基线报表并提交**

报表 `docs/superpowers/reports/2026-09-14-gloss-baseline.md` 内容：上述四个数字 + `；；`393 条 + 义项>3 共 455 条 + 前两义超 12 字 293 条（脚本加三个计数后填入）。

```bash
git add tools/gloss-audit/extract.py docs/superpowers/reports/2026-09-14-gloss-baseline.md
git commit -m "chore(audit): 抽取脚本+基线报表（3219词/1809句/1502多义句）"
```

---

### Task 3: R0 数据清洗（393 ；； + 48 混英文）

**Files:**
- Modify: `shadow/index.html:934`（VOCAB 行内 `m` 字段，仅字符串替换）
- Create: `docs/superpowers/reports/2026-09-14-gloss-r0.md`（清洗 diff，用户签字后合入）

**Interfaces:**
- Consumes: `tools/gloss-audit/out/vocab-m.json`（Task 2）
- Produces: 清洗后的 `m` 值集合（Task 4 的输入基础）；用户签字 = 合入门槛

- [ ] **Step 1: 生成清洗 diff（不写文件，只出报告）**

```bash
python3 - <<'EOF'
import json, re, pathlib
out = pathlib.Path('tools/gloss-audit/out')
vocab = json.loads((out / 'vocab-m.json').read_text(encoding='utf-8'))
fixed = {}
for k, m in vocab.items():
    parts = [p.strip() for p in re.split(r'[；;]', m) if p.strip()]
    clean = '；'.join(parts)
    if clean != m:
        fixed[k] = (m, clean)
print('clean-fix count:', len(fixed))
pathlib.Path('docs/superpowers/reports/2026-09-14-gloss-r0.md').write_text(
    '# R0 清洗 diff（共 %d 条）\n\n' % len(fixed) +
    ''.join('- `%s`\n  - 原：%s\n  - 新：%s\n' % (k, a, b) for k, (a, b) in sorted(fixed.items())),
    encoding='utf-8')
EOF
```

预期：`clean-fix count` 为 393 上下（含 48 条混英文的分隔修复；纯英文片段改写另行逐条列入报告由用户定）。

- [ ] **Step 2: 用户逐条签字后，用精确替换写回文件**

替换规则：对报告中每一对（原→新），在 `shadow/index.html` 内做一次精确字符串替换（原串必须唯一，否则停下报人工）。

- [ ] **Step 3: 复跑抽取脚本确认归零**

```bash
python3 tools/gloss-audit/extract.py
python3 -c "import json; v=json.load(open('tools/gloss-audit/out/vocab-m.json')); print('doublesemi left:', sum(1 for m in v.values() if '；；' in m))"
```

预期：`doublesemi left: 0`。

- [ ] **Step 4: Commit**

```bash
git add shadow/index.html docs/superpowers/reports/2026-09-14-gloss-r0.md
git commit -m "fix(gloss): R0 清洗连续分隔符与空义项（用户已签 diff）"
```

---

### Task 4: R1 词条义项收敛（455 超限 + 缺义补齐）

**Files:**
- Modify: `shadow/index.html:934`（VOCAB `m`）
- Create: `docs/superpowers/reports/2026-09-14-gloss-r1.md`（按章分批 diff，用户签字后合入）

**Interfaces:**
- Consumes: Task 3 之后的新 `vocab-m.json`
- Produces: 2–3 义收敛后的 `m`（Task 5/6 的输入）

- [ ] **Step 1: 列出超限与缺义候选表**

```bash
python3 - <<'EOF'
import json, re
vocab = json.load(open('tools/gloss-audit/out/vocab-m.json'))
over = {k: m for k, m in vocab.items()
        if len([p for p in re.split(r'[；;]', m) if p.strip()]) > 3}
print('over-3 count:', len(over))
json.dump(over, open('tools/gloss-audit/out/r1-over.json', 'w'), ensure_ascii=False, indent=1)
EOF
```

预期：`over-3 count: 455`。

- [ ] **Step 2: 按 Oxford Learner's / Collins 常用义逐条收敛到 2–3 义，写入报告 diff**

报告格式与 R0 同（`词 / 原 / 新`），缺义补齐（如 swear 类已全的不动）。分批出（每批 ≤100 条），每批同时落盘机器可读对：

```bash
python3 - <<'EOF'
import json
# pairs 由人工按报告整理，每批一个文件：[{"k":词,"old":原m,"new":新m}]
pairs = json.load(open('tools/gloss-audit/out/r1-batch1.json'))
assert all(set(x) == {'k', 'old', 'new'} for x in pairs)
json.dump(pairs, open('tools/gloss-audit/out/r1-pairs.json', 'w'), ensure_ascii=False)
print('batch size:', len(pairs))
EOF
```

每批用户签字后执行 Step 3。

- [ ] **Step 3: 用户签字后精确替换写回并复验**

```bash
python3 - <<'EOF'
import json
pairs = json.load(open('tools/gloss-audit/out/r1-pairs.json'))  # [{"k":词,"old":原m,"new":新m}]
p = 'shadow/index.html'
raw = open(p, encoding='utf-8').read()
for it in pairs:
    assert raw.count(it['old']) == 1, ('not-unique', it['k'])
    raw = raw.replace(it['old'], it['new'])
open(p, 'w', encoding='utf-8').write(raw)
print('replaced:', len(pairs))
EOF
python3 tools/gloss-audit/extract.py
```

预期：`replaced` 等于签字条数；重跑后超限计数归零（Step 1 命令复跑）。

- [ ] **Step 4: Commit（每批一次）**

```bash
git add shadow/index.html docs/superpowers/reports/2026-09-14-gloss-r1.md
git commit -m "fix(gloss): R1 词条义项收敛到2-3义（第N批，用户已签）"
```

---

### Task 5: R2 行内截断改规则 + E2E 加固（TDD）

**Files:**
- Modify: `shadow/index.html:950-955`（`glossParts`）
- Modify: `tests/e2e/shadow/inline-gloss.md`（加 Step 5）
- Modify: `playwright-tests/journeys/shadow/inline-gloss.spec.ts`（加 Step 5 编译）
- Create: `docs/superpowers/reports/2026-09-14-gloss-r2.md`（行为变更说明，用户签字）

**Interfaces:**
- Consumes: Task 4 之后干净的 `m`
- Produces: 新 `glossParts` 行为（Task 8 门禁覆盖）

- [ ] **Step 1: 先写 failing 的 E2E 断言（Step 5）**

在 `inline-gloss.spec.ts` 的 `test(...)` 内、`Step 4` 之后追加：

```ts
await test.step('Step 5: Gloss has two senses and no trailing separator', async () => {
  const bad = await page.evaluate(() => {
    const gls = [...document.querySelectorAll('.gl')];
    let twoSense = 0;
    const problems: string[] = [];
    for (const gl of gls) {
      const glP = gl.querySelector('.gl-p');
      let meaningText = '';
      let node: ChildNode | null = glP && glP.nextSibling ? glP.nextSibling : gl.firstChild;
      while (node) { meaningText += node.textContent || ''; node = node.nextSibling; }
      meaningText = meaningText.trim();
      if (!meaningText) continue;
      if (/[；;]$/.test(meaningText)) problems.push('trailing-sep: ' + meaningText);
      if (/[；;]/.test(meaningText) && !/[；;]\s*$/.test(meaningText)) {
        const parts = meaningText.split(/[；;]/).map(s => s.trim()).filter(Boolean);
        if (parts.length >= 2) twoSense += 1;
        else problems.push('empty-sense: ' + meaningText);
      }
    }
    return { twoSense, problems: problems.slice(0, 5) };
  });
  expect(bad.problems).toEqual([]);
  expect(bad.twoSense).toBeGreaterThan(0);
});
```

`tests/e2e/shadow/inline-gloss.md` 同步加 Step 5 文字（① 含两义分隔符；② 不以分隔符结尾；③ 无空义项）。

- [ ] **Step 2: 跑它，确认现在失败**

```bash
E2E_NO_SERVER=1 npx playwright test journeys/shadow/inline-gloss.spec.ts --reporter=list --timeout=30000
```

预期：Step 5 FAIL（首义单显，无 twoSense；若脏数据仍在还会有 trailing-sep）。

- [ ] **Step 3: 改 `glossParts`（最小实现，含降级）**

```js
// 旧（shadow/index.html:950-955）：
function glossParts(k) {
const info = (typeof VOCAB !== 'undefined' && VOCAB[k]) || null;
if (!info || !info.m) return null;
const m = info.m.split(/[；;]/)[0].trim().slice(0, 12);
return { ph: glossPhon(k), m };
}
// 新：
function glossParts(k) {
const info = (typeof VOCAB !== 'undefined' && VOCAB[k]) || null;
if (!info || !info.m) return null;
const parts = String(info.m).split(/[；;]/).map(s => s.trim()).filter(Boolean);
const two = parts.slice(0, 2).join('；');
const m = (two.length <= 12 ? two : parts[0]).slice(0, 12);
return { ph: glossPhon(k), m };
}
```

- [ ] **Step 4: 重跑该 spec，确认通过**

同 Step 2 命令。预期：全 steps PASS（含 swear 行内显两义）。

- [ ] **Step 5: Commit**

```bash
git add shadow/index.html tests/e2e/shadow/inline-gloss.md playwright-tests/journeys/shadow/inline-gloss.spec.ts docs/superpowers/reports/2026-09-14-gloss-r2.md
git commit -m "feat(gloss): 行内取前两义+超长退回首义，E2E 加固分隔符断言"
```

---

### Task 6: R3 句译复核（1502 句，按章分批）

**Files:**
- Modify: `shadow/index.html` 内 `sentZh` 数组（仅目标句字符串替换）
- Create: `docs/superpowers/reports/2026-09-14-gloss-r3-chN.md`（每章一份 diff，用户签字后合入）

**Interfaces:**
- Consumes: `tools/gloss-audit/out/poly-sentences.json`（Task 2，1502 句）
- Produces: 搭配取义正确的 sentZh

- [ ] **Step 1: 按章输出复核表（英文原句 / 现句译 / 空的新译栏）**

```bash
python3 - <<'EOF'
import json, pathlib
rows = json.load(open('tools/gloss-audit/out/poly-sentences.json'))
bysec = {}
for r in rows:
    bysec.setdefault(r['sec'], []).append(r)
for sec, rs in sorted(bysec.items()):
    p = pathlib.Path('docs/superpowers/reports/2026-09-14-gloss-r3-ch%d-draft.md' % (sec + 1))
    p.write_text('# R3 第%d章复核（%d 句）\n\n' % (sec + 1, len(rs)) +
        ''.join('## 第%d句 `%s`\n- EN：%s\n- 现译：%s\n- 新译：（待填）\n' % (
            r['i'] + 1, ','.join(r['marks'][:4]), r['en'], r['zh']) for r in rs),
        encoding='utf-8')
    print('ch%d:' % (sec + 1), len(rs))
EOF
```

- [ ] **Step 2: 逐句按搭配义填新译**（只需改"取错义"的句，无问题留空；swear 首句示例：`也不会对拥堵交通发誓抱怨` → `也不会对着拥堵的交通骂骂咧咧`）

- [ ] **Step 3: 用户签字后精确替换写回**（原句译串必须全文唯一，否则停下报人工）

```bash
python3 - <<'EOF'
import json
pairs = json.load(open('tools/gloss-audit/out/r3-pairs-ch1.json'))  # [{"old":原句译,"new":新句译}]
p = 'shadow/index.html'
raw = open(p, encoding='utf-8').read()
for it in pairs:
    assert raw.count(it['old']) == 1, ('not-unique', it['old'][:20])
    raw = raw.replace(it['old'], it['new'])
open(p, 'w', encoding='utf-8').write(raw)
print('replaced:', len(pairs))
EOF
```

- [ ] **Step 4: 每章 commit 一次**

```bash
git add shadow/index.html docs/superpowers/reports/2026-09-14-gloss-r3-ch1.md
git commit -m "fix(gloss): R3 第1章句译搭配复核（用户已签）"
```

---

### Task 7: 同步下游（vocab.json 312 条 + legacy 673 条）

**Files:**
- Create: `tools/gloss-audit/merge.py`
- Modify: `data/vocab.json`（312 条 `m`，shadow 为准）
- Modify: `雅思影子跟读.html`（VOCAB `m` + sentZh + glossParts，shadow 为准）
- Create: `docs/superpowers/reports/2026-09-14-gloss-sync.md`（两份 diff，用户签字后合入）

**Interfaces:**
- Consumes: Task 4/6 定稿后的 shadow 数据
- Produces: 三端一致的数据；legacy 多出义项清单（用户定夺项）

- [ ] **Step 1: 写合并脚本（只生成 diff，不直接写目标文件）**

```python
#!/usr/bin/env python3
"""对比 shadow 定稿与两处下游，输出 diff 报告。写回由人工在签字后执行。"""
import json, re, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[2]
raw = (ROOT / 'shadow' / 'index.html').read_text(encoding='utf-8')
shadow_vocab = json.loads(re.search(r'const VOCAB = (\{.*?\});\n', raw, re.S).group(1))

disk = json.load(open(ROOT / 'data' / 'vocab.json', encoding='utf-8'))
flat = {}
for ch in disk['chapters']:
    for w in ch['words']:
        flat.setdefault(w['w'].lower(), w)
diff_json = {k: (w.get('m', ''), shadow_vocab[k]['m']) for k, w in flat.items()
             if k in shadow_vocab and w.get('m', '') != shadow_vocab[k]['m']}
print('vocab.json diff:', len(diff_json))

legacy = (ROOT / '雅思影子跟读.html').read_text(encoding='utf-8')
legacy_vocab = json.loads(re.search(r'const VOCAB = (\{.*?\});\n', legacy, re.S).group(1))
diff_legacy = {k: (v.get('m', ''), shadow_vocab[k]['m']) for k, v in legacy_vocab.items()
               if k in shadow_vocab and v.get('m', '') != shadow_vocab[k]['m']}
print('legacy diff:', len(diff_legacy))
extra = {k: v.get('m', '') for k, v in legacy_vocab.items()
         if k in shadow_vocab and v.get('m', '') not in shadow_vocab[k].get('m', '')
         and len(v.get('m', '')) > len(shadow_vocab[k].get('m', ''))}
print('legacy-longer (need user call):', len(extra))
json.dump({'vocab_json': diff_json, 'legacy': diff_legacy, 'legacy_longer': extra},
          open(pathlib.Path(__file__).parent / 'out' / 'sync-diff.json', 'w'),
          ensure_ascii=False, indent=1)
```

- [ ] **Step 2: 运行并把 diff 写成签字报告**

预期：`vocab.json diff` 312 上下，`legacy diff` 673 上下。报告列 `词 / 下游现值 / shadow 定稿`，`legacy_longer` 单列"用户定夺区"。

- [ ] **Step 3: 用户签字后写回并复验差异归零**（json 按 key 回写 `m`；legacy 的 VOCAB `m`、sentZh、glossParts 三处照搬 shadow 定稿）

- [ ] **Step 4: Commit**

```bash
git add data/vocab.json "雅思影子跟读.html" docs/superpowers/reports/2026-09-14-gloss-sync.md tools/gloss-audit/merge.py
git commit -m "sync(gloss): 下游回写（vocab.json+legacy，shadow为准，用户已签）"
```

---

### Task 8: 门禁（语法 + 18 tests）与收尾

**Files:** 无新文件（只跑命令）

**Interfaces:**
- Consumes: Task 1–7 全部合入
- Produces: 绿 CI + 最终提交

- [ ] **Step 1: 抽出内联 script 做 node --check**

```bash
python3 -c "
raw = open('shadow/index.html', encoding='utf-8').read()
i = raw.find('<script>', raw.find('supabase-js')); j = raw.find('</script>', i)
open('/tmp/inline-check.js','w',encoding='utf-8').write(raw[i+8:j])" && node --check /tmp/inline-check.js && echo SYNTAX-OK
```

预期：`SYNTAX-OK`。

- [ ] **Step 2: 全量 E2E**

```bash
npm test -- --reporter=list --timeout=30000
```

预期：`18 passed`（17 文件 Harris 注：mobile-expand 修后计入；progress-sync 计入；inline-gloss 含新 Step 5）。

- [ ] **Step 3: 最终确认 diff 总览并收尾提交**

```bash
git log --oneline -12
git status --short
```

预期：R0/R1/R2/R3/sync 各自独立 commit，工作区干净。
