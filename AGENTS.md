# Agent 协作与上线流程

> 本项目为单人维护，但会由多个 AI agent 共同修改。本文件是所有 agent 必须遵守的协作规范。

## 1. 开工前必须做的 3 件事

每次接到任务，先执行：

```bash
git checkout main
git pull origin main
git checkout -b agent/<agent名字>-<任务简称>-<日期>
```

例如：

```bash
git checkout -b agent/kimi-fix-darkmode-0915
```

- 不允许直接在 `main` 分支上修改。
- 如果本地工作区不干净，先问用户如何处理，不要擅自丢弃或覆盖。

## 2. 完工前必须做的 3 件事

```bash
cd playwright-tests && npm test
```

```bash
python3 scripts/validate_data.py
```

```bash
git status
git diff
```

要求：

- `npm test` 必须全绿（目前 27 个测试）。
- **改 `shadow/data/sections.json` 的句子数量，必须同时在 `shadow/index.html` 的 `SENT_SHIFTS`
  追加一条记录**（书签 / 续读位 / 间隔复习 / A-B 循环存的全是全局句号，不登记就会让用户进度静默错位）。
  `validate_data.py` 第 14 条会拦住漏记，第 15 条拦住英文句与中文译文数量不齐。
- `validate_data.py` 必须输出 `Validation PASSED`。
- `git diff` 里不能出现 `config.js`、Supabase key、密码等敏感信息。

## 3. 提交与推送

完成并确认无误后：

```bash
git add -A
git commit -m "type(scope): 简短描述"
git push origin agent/<分支名>
```

然后向用户汇报：

> 任务完成，分支 `agent/<分支名>` 已 push，请合并到 main。

**不要直接 push `main`。**

## 4. 合并到 main

由用户或指定 agent 执行合并：

```bash
git checkout main
git pull origin main
git merge --no-ff agent/<分支名>
git push origin main
```

合并后删除分支：

```bash
git branch -d agent/<分支名>
git push origin --delete agent/<分支名>
```

如果希望用 GitHub Pull Request 合并，可运行：

```bash
gh pr create --title "描述" --body "改动说明"
```

然后用户在 GitHub 页面点击 Merge。

## 5. 部署

生产托管是 **腾讯云 EdgeOne Pages（已改名 EdgeOne Makers）**，只监听 `main` 分支，推上去约 1 分钟自动部署。
**`netlify.toml` 和 `_redirects` 平台完全不认**（是死文件，别指望改缓存/重定向生效）。

发布产物由构建生成（`edgeone.json` 里已配好，控制台显示旧值时手动同步）：

```bash
node scripts/build_site.mjs      # 生成 dist/，本地可跑
```

- 构建命令：`node scripts/build_site.mjs`；安装命令：`true`（仓库根没有 package.json）；输出目录：`dist`。
- **仓库根不是发布根了**：`dist/` 是白名单，只有列进 `scripts/build_site.mjs` 的文件才会公网可见。
  新增运行时要抓的文件，必须同时加进那份白名单，否则构建自检会直接失败。
- 静态 HTML/JS **读不到环境变量**，只有构建命令能读 —— 所以 `config.js` 只能由构建写出。
  环境变量：`SUPABASE_URL`、`SUPABASE_KEY`（或 `SUPABASE_ANON_KEY`），单个值上限 500 字节。
  改环境变量**不会自动重新部署**，要手动点一次「重新部署」。
- `config.js` 依然 **不要提交**（已在 `.gitignore`）。`python3 scripts/inject_config.py` 只用于本地生成。
- 平台默认给未加哈希的文件 `max-age=0`，且**新部署会自动失效边缘缓存**；数据 JSON 另有 `SHADOW_DATA_VER`
  查询串双保险。404 也会被边缘缓存，修完 404 必须重新部署再验证。
- 控制台点击步骤见 `docs/2026-09-19-上线配置操作手册.md`。

## 6. Ship Check（上线前检查）

合并 main 之前，agent 必须确认：

- [ ] 工作区干净，无未提交改动
- [ ] 测试全部通过
- [ ] 源码中无硬编码密钥、密码、private key
- [ ] 没有 `<<<<<<<` / `=======` / `>>>>>>>` 合并冲突标记
- [ ] `config.example.js` 已包含项目所需的所有环境变量
- [ ] 没有误删用户数据文件（如 `data/vocab.json`、`shadow/data/` 等）

## 7. 沟通规则

- 开工前：查看 `git log --oneline -5`，了解上一个 agent 做了什么。
- 完工后：用中文写简短总结，列出改了哪些文件、测试是否通过、下一步建议。
- 不要擅自 `git reset`、`git rebase -i`、`git push --force` 等改写历史的操作。

## 8. 紧急热修

如果必须直接修 main，先征得用户同意，并在提交信息里注明 `[hotfix]`。修完后立即 push 并通知用户。

## 9. 项目结构速查

| 文件/目录 | 说明 |
|-----------|------|
| `index.html` | 主应用（阅读训练） |
| `shadow/index.html` | 影子跟读主应用 |
| `admin/index.html` | 管理后台 |
| `data/` | 词汇、故事、章节源数据 |
| `shadow/data/` | shadow 应用运行所需数据 |
| `scripts/build_site.mjs` | 生成发布目录 `dist/`（白名单 + 注入 config.js） |
| `sql/` | 需要在 Supabase 执行的 SQL（建表 / RLS） |
| `edgeone.json` | 构建命令与输出目录 |
| `scripts/` | 构建与数据工具 |
| `playwright-tests/` | E2E 测试 |
| `config.example.js` | 环境变量配置模板 |
| `netlify.toml` | 部署缓存头配置 |

## 10. 常用命令速查

```bash
# 跑测试
cd playwright-tests && npm test

# 数据校验
python3 scripts/validate_data.py

# 生成生产 config.js
python3 scripts/inject_config.py

# 同步词汇 schema
python3 scripts/normalize_vocab.py --apply

# 查看状态
git status
git log --oneline -5
```
