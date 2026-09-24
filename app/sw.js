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

/* M6：离线兜底页。network-first + 缓存兜底能覆盖「访问过一次后断网」，但若导航请求既没网、
   缓存又没命中（清了缓存 / 新部署还没进缓存），respondWith 只能 reject → 浏览器白屏。
   导航类请求（req.mode === 'navigate'）给一张极简离线页，至少不是白屏、能重试。 */
const OFFLINE_HTML = [
  '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1">',
  '<title>离线 · 雅思背单词 3.0</title>',
  '<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;',
  'background:#faf8f4;color:#2b3028;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif}',
  'main{text-align:center;padding:24px}h1{font-size:20px;margin:0 0 8px}',
  'p{color:#6b665a;font-size:14px;line-height:1.7;margin:0 0 18px}',
  'button{border:0;border-radius:999px;padding:12px 22px;font-size:15px;font-weight:700;',
  'color:#fff;background:linear-gradient(135deg,#2e9c76,#0f7c5a);cursor:pointer}',
  '@media (prefers-color-scheme:dark){body{background:#1c1a17;color:#e2ddd5}p{color:#a39b8e}}</style></head>',
  '<body><main><h1>当前离线</h1>',
  '<p>已访问过的内容仍可离线使用；新内容需要联网。<br>连上网后点下面重试。</p>',
  '<button onclick="location.reload()">重试</button></main></body></html>',
].join('');


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
      } catch (_) { /* 缓存读失败 → 走下面的兜底/throw */ }
      if (req.mode === 'navigate') {
        return new Response(OFFLINE_HTML, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
      throw err;   // 真离线且无缓存：让浏览器照常报网络失败
    }
  })());
});
