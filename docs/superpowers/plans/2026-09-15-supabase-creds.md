# Phase 1.2 Supabase 凭证剥离 / 构建时注入 实施计划

> **Goal:** 把真实 Supabase URL/anon key 从所有进入版本控制的前端源码中移除；运行时统一从 `config.js` 读取，部署时通过环境变量生成 `config.js`。

**Architecture:**
- `index.html`、`admin/index.html`、`shadow/index.html` 统一读取 `window.IELTS_CONFIG`（由 `config.js` 提供）。
- `config.js` 被 `.gitignore` 排除，本地开发时复制 `config.example.js` 并填入真实值。
- 新增 `scripts/inject_config.py`：从环境变量 `SUPABASE_URL` / `SUPABASE_KEY` 生成 `config.js`，供 CI/部署使用。
- 遗留单文件 `雅思影子跟读.html` 中的真实凭证替换为占位符，保持文件可独立打开（不依赖外部 `config.js`）。

**Tech Stack:** HTML/JS、Python 3、Git、Supabase JS SDK

**Global Constraints:**
- 不破坏本地无 `config.js` 时的使用（云同步/云端语音静默禁用，给出清晰提示）。
- `shadow/index.html` 已有的 Playwright 回归必须继续 18/18 通过。
- `config.js` 不得进入 git。

---

### Task 1: 统一运行时配置读取接口

**Files:**
- Modify: `index.html:1197-1218`

**Steps:**
1. 在 `<head>`/主脚本前加入 `<script src="config.js"></script>`（若文件 404 不影响页面继续运行）。
2. 将 `SB.DEF_URL` / `SB.DEF_KEY` 从硬编码改为读取 `window.IELTS_CONFIG`：
   ```js
   const _CFG = (typeof window !== 'undefined' && window.IELTS_CONFIG) || {};
   const SB = {
     DEF_URL: _CFG.SUPABASE_URL || '',
     DEF_KEY: _CFG.SUPABASE_KEY || '',
     ...
   };
   ```
3. 在 `SB.client()` 中补充缺失配置的早期报错；在 `signIn`/`signUp` 入口同样校验，避免用户看到 SDK 内部错误。

**Test:**
- 删除/重命名本地 `config.js`，在浏览器打开 `index.html`，确认页面正常加载、Console 仅打印“Supabase 未配置”提示、登录按钮点击给出“云同步未配置”toast。
- 恢复 `config.js` 后登录流程仍可用。

---

### Task 2: 新增部署注入脚本

**Files:**
- Create: `scripts/inject_config.py`

**Steps:**
1. 读取环境变量 `SUPABASE_URL` 与 `SUPABASE_KEY`（兼容 `SUPABASE_ANON_KEY` 作为 fallback）。
2. 若任一缺失则报错退出并打印用法。
3. 生成根目录 `config.js`（可选同时生成 `shadow/config.js`）：
   ```js
   window.IELTS_CONFIG = {
     SUPABASE_URL: '...',
     SUPABASE_KEY: '...',
   };
   ```
4. 支持 `--check` 模式：仅检查环境变量是否齐全，不写入文件。

**Test:**
```bash
SUPABASE_URL=https://example.supabase.co SUPABASE_KEY=dummy python3 scripts/inject_config.py
cat config.js
```

---

### Task 3: 清理遗留单文件中的真实凭证

**Files:**
- Modify: `雅思影子跟读.html`

**Steps:**
1. 定位 `CLOUD.URL` / `CLOUD.KEY` 的硬编码值。
2. 替换为占位符：
   ```js
   URL: 'https://your-project.supabase.co',
   KEY: 'your-anon-key',
   ```
3. 在对象上方加注释：`// 生产部署时请通过 scripts/inject_config.py 注入真实凭证，或手动替换此处`。

**Test:**
```bash
grep -n "nhqevdkjqzgnyjbijwso" 雅思影子跟读.html index.html || echo "No real credentials found"
```

---

### Task 4: 更新示例配置与文档

**Files:**
- Modify: `config.example.js`

**Steps:**
1. 保留占位符值。
2. 在文件顶部补充部署用法：
   ```
   // 部署时生成：
   //   SUPABASE_URL=https://... SUPABASE_KEY=... python3 scripts/inject_config.py
   ```

---

### Task 5: 回归验证

**Steps:**
1. 运行 Playwright shadow 回归：`cd playwright-tests && npm test`，预期 18/18 通过。
2. 在浏览器打开 `index.html` 与 `shadow/index.html`，确认控制台无异常。
3. 使用 `git diff --stat` 确认 `config.js` 未出现在变更中。

---

## Spec Coverage

- 凭证从源码移除 → Task 1、Task 3
- 构建时注入 → Task 2
- 本地开发不中断 → Task 1 的缺失配置兜底 + Task 4 示例
- 不泄露到版本控制 → `.gitignore` 已覆盖 `config.js`，Task 5 验证
