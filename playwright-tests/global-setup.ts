/* 全仓唯一的 8932 静态服务器出口。
   为什么必须在 globalSetup 而不是各 spec 的 beforeAll：`journeys/smoke.spec.ts` 与
   `journeys/app-review-queue.spec.ts` 以前各自 startRootServer/stopRootServer，而
   `utils/root-server.ts` 起服务前会 `pkill -f "http.server 8932"` 清残留 ——
   先跑完的那个文件收工，就把另一个还在用的服务器一起带走了，全量偶发红一条 `page.goto` 超时，
   单跑又复现不出来（2026-09-22 走查遗留批次第 ⑦ 条）。
   globalSetup / globalTeardown 与主 runner 同进程，所以 root-server 里那个模块级 proc 活得过整个跑测周期。 */
import { startRootServer } from './utils/root-server';

export default async function globalSetup() {
  if (process.env.E2E_NO_SERVER) return;                 // 外部已经起了服务器，这里不插手
  if (process.env.E2E_ENVIRONMENT && process.env.E2E_ENVIRONMENT !== 'local') return;
  const url = await startRootServer();
  process.env.E2E_ROOT_URL = url;                        // Playwright 官方推荐的 setup → test 传值方式
}
