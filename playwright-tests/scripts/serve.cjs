#!/usr/bin/env node
'use strict';
/*
 * vocab-test-server —— Playwright 测试用静态文件服务器（2026-10-10 新增，替代 python3 -m http.server）
 *
 * 为什么不用 `python3 -m http.server`：
 *   全量门禁（4 workers 并发）下它会成片重置连接（net::ERR_CONNECTION_RESET），
 *   随机把若干条用例拖进「boot 停滞」——/js/plan-engine.js 挂掉后 ShadowPlan 未定义，
 *   TASK.init() 在 index.html 的 try/catch 里被静默吞掉，waitAppReady 闸门挂满 120s。
 *   根因：http.server 的 listen backlog 固定为 5（socketserver.TCPServer.request_queue_size 不可配），
 *   且 HTTP/1.0 无 keep-alive —— 每个文件都新开连接；并发突发时 macOS 直接 RST。
 *   压测复现（scripts/stress-probe.cjs，4 并发 × 10 轮页面加载）：python 版 21/40 失败，
 *   本服务器 40/40 成功。
 *
 * 特性（刻意保持「与 python 版等语义」）：
 *   - HTTP/1.1 keep-alive（浏览器单主机最多 6 条连接复用，不再每文件新开）
 *   - Node 默认 backlog（511）；accept 与文件 I/O 全异步
 *   - 与 python 版一致：目录 → index.html、缺尾斜杠 301、只服务 GET/HEAD、
 *     不支持 Range（python 的 SimpleHTTPRequestHandler 也不支持）
 *   - 响应头 Server: vocab-test-server —— 供 ensure-server.cjs / root-server.ts
 *     识别「端口上跑的是不是本服务器」（发现旧 python 服务器会被当作残留清掉）
 *   - 不实现 304 / If-Modified-Since：一律 Cache-Control: no-cache + 全量 200，
 *     测试场景要的是确定性，不要协商缓存
 *
 * 用法：node serve.cjs <port> [root]      # root 默认 = 当前工作目录；只监听 127.0.0.1
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const [portArg, rootArg] = process.argv.slice(2);
const port = Number(portArg);
const root = path.resolve(process.cwd(), rootArg || '.');
if (!Number.isInteger(port) || port <= 0) {
  console.error('[serve] 用法: node serve.cjs <port> [root]');
  process.exit(2);
}
try {
  if (!fs.statSync(root).isDirectory()) throw new Error('not a directory');
} catch (e) {
  console.error('[serve] 根目录不存在: ' + root);
  process.exit(2);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.wasm': 'application/wasm',
};
const mimeOf = (p) => MIME[path.extname(p).toLowerCase()] || 'application/octet-stream';

function fail(res, code, msg) {
  res.statusCode = code;
  res.setHeader('Server', 'vocab-test-server');
  const buf = Buffer.from(String(msg) + '\n');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Length', buf.length);
  res.end(buf);
}

function serveFile(req, res, fsPath, st) {
  res.statusCode = 200;
  res.setHeader('Server', 'vocab-test-server');
  res.setHeader('Content-Type', mimeOf(fsPath));
  res.setHeader('Content-Length', st.size);
  res.setHeader('Last-Modified', st.mtime.toUTCString());
  res.setHeader('Cache-Control', 'no-cache');
  if (req.method === 'HEAD') return res.end(); // Node 对 HEAD 自动丢弃 body
  const stream = fs.createReadStream(fsPath);
  stream.on('error', () => { try { res.destroy(); } catch (e) { /* ignore */ } });
  stream.pipe(res);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return fail(res, 405, 'Method Not Allowed');

  let url;
  let pathname;
  try {
    url = new URL(req.url, 'http://127.0.0.1');
    pathname = decodeURIComponent(url.pathname);
  } catch (e) {
    return fail(res, 400, 'Bad Request');
  }
  if (pathname.indexOf('\0') !== -1) return fail(res, 400, 'Bad Request');

  const fsPath = path.normalize(path.join(root, pathname));
  if (fsPath !== root && fsPath.indexOf(root + path.sep) !== 0) return fail(res, 403, 'Forbidden');

  fs.stat(fsPath, (err, st) => {
    if (!err && st.isDirectory()) {
      if (!pathname.endsWith('/')) {
        res.statusCode = 301;
        res.setHeader('Server', 'vocab-test-server');
        res.setHeader('Location', pathname + '/' + (url.search || ''));
        res.setHeader('Content-Length', '0');
        return res.end();
      }
      const idx = path.join(fsPath, 'index.html');
      return fs.stat(idx, (e2, st2) => {
        if (e2 || !st2.isFile()) return fail(res, 404, 'Not Found');
        serveFile(req, res, idx, st2);
      });
    }
    if (err || !st.isFile()) return fail(res, 404, 'Not Found');
    serveFile(req, res, fsPath, st);
  });
});

server.on('error', (err) => {
  console.error('[serve] 启动失败（端口 ' + port + '）: ' + (err.code || err.message));
  process.exit(1);
});

process.title = 'vocab-test-server :' + port;
server.listen(port, '127.0.0.1', () => {
  console.log('[serve] vocab-test-server http://127.0.0.1:' + port + '  root=' + root);
});
