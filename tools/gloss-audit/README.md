# gloss-audit 脚本说明

Source of truth：`shadow/index.html` 内联数据为准。
同步方向：shadow → `data/vocab.json` → legacy（`雅思影子跟读.html`），永不反向。
`extract.py`：只读 shadow，抽取对齐表写 `out/`。
`merge.py`：对比 shadow 与下游，只生成 diff，不写目标文件。
`apply_sync.py`：读 `out/sync-diff.json` 一次性写回下游（断言 fail-fast）。
`out/` 为临时 scratch，可删除重跑，不提交。
冻结提醒：`build_ielts.py` 默认 fail-closed（需 `IELTS_ALLOW_REBUILD=1`）。
