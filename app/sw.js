/* 3.0 /app/ service worker —— 真实文件（非 blob URL）。
 *
 * 2026-09-24 根因修复（W6 PWA / M2 暴露）：
 *   旧实现用 URL.createObjectURL(new Blob([...])) 内联脚本再 register(blobUrl, {scope:'/app/'})。
 *   Chromium 直接拒绝：「The URL protocol of the script ('blob:…') is not supported」——
 *   SW 从未真正注册，等于没有离线/缓存兜底（M2 往那段 blob 代码里加的「失败退回网络」
 *   根本没机会执行）。静态服务器偶发丢 /app/app.js 时页面就白屏。改成仓内真实文件后 SW 才生效。
 *
 * 策略：**只接管自己 scope 内（/app/…）的同源 GET，一律 network-first**：
 *   - 先走网络 → 成功则回网络响应并顺手写缓存（拿到最新的 app.js / index.html）；
 *   - 网络失败（断网 / 服务器丢连接）→ 退回缓存 → app.js 这类 defer 脚本「永远拿得到」；
 *   - 两者都没有才抛错，交给浏览器按正常失败处理。
 *   不用 cache-first，是为了「EdgeOne 新部署立刻生效」——绝不让旧缓存盖住新部署。
 *   scope 外的请求（/shadow/data/…、跨域字体/CDN/Supabase）一律放行，绝不拦测试 stub
 *   或其它模块。缓存名带版本；activate 清掉旧版本缓存。
 */

const CACHE_NAME = 'ielts-app3-runtime-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin !== self.location.origin) return;          // 跨域不插手
  const scopePath = new URL(self.registration.scope).pathname; // 例如 '/app/'
  if (!url.pathname.startsWith(scopePath)) return;          // 只管网自己的资源

  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      try {
        if (res && res.status === 200 && res.type === 'basic') {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, res.clone()).catch(() => {});
        }
      } catch (_) { /* 缓存写失败只影响下次的兜底，绝不影响本次响应 */ }
      return res;
    } catch (err) {
      try {
        const hit = await caches.match(req);
        if (hit) return hit;
      } catch (_) { /* 缓存读失败 → 走下面的 throw */ }
      throw err;   // 真离线且无缓存：让浏览器照常报网络失败
    }
  })());
});
