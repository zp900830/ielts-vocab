/* 与 global-setup.ts 成对：关掉那台全仓唯一的 8932 服务器。
   两个钩子跑在主 runner 进程里，所以 utils/root-server.ts 那个模块级 proc 在这里还活着。 */
import { stopRootServer } from './utils/root-server';

export default async function globalTeardown() {
  await stopRootServer();
}
