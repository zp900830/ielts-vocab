import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './journeys',
  timeout: 120000,
  retries: 0,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:8931',
    channel: 'chromium',
    headless: true,
  },
  /* 8932 那台服务器（主站根目录）由这两个钩子统一管，见 global-setup.ts 顶部的原因说明。 */
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  webServer: process.env.E2E_NO_SERVER ? undefined : {
    /* 2026-10-10：从 python3 -m http.server 换成自写的 scripts/serve.cjs。
       python 版在 4 workers 并发下会成片 RST 连接（同端口压测 23/40 失败，拖出随机红），
       Node 版同场景 40/40。为什么、怎么验证：见 scripts/serve.cjs 头部注释与
       docs/superpowers/specs/2026-10-10-删除挖空选词.md。
       注意：cwd 是本目录，'..' 即仓库根。 */
    command: 'node scripts/serve.cjs 8931 ..',
    port: 8931,
    reuseExistingServer: true,
  },
});
