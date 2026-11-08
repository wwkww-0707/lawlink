/* ==============================================================
   外服法务通 LawLink · 生产部署后端（零依赖，Node.js >= 14）
   --------------------------------------------------------------
   职责：
     1) 静态资源托管：dist/ 目录，含 MIME 识别、gzip 压缩、缓存头
     2) 轻量 API：
        GET /api/health —— 健康检查（存活探测 / 负载均衡探针）
        GET /api/meta   —— 服务元信息（名称 / 版本 / 运行时长）
     3) 未知路径回退 index.html（单页应用路由兼容）

   启动：node server.js（或 npm start）
   端口：默认 8080，可用环境变量 PORT 覆盖；HOST 默认 0.0.0.0
   ============================================================== */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = path.join(__dirname, 'dist');
const START = Date.now();

/* ---------- 扩展名 → MIME 类型 ---------- */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json'
};

/* 可 gzip 压缩的文本类型 */
const GZIP_TYPES = new Set([
  'text/html', 'text/css', 'application/javascript', 'application/json', 'image/svg+xml'
]);

/* 发送 JSON 响应 */
function sendJSON(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

/* 发送文件（带 gzip 与缓存策略） */
function sendFile(req, res, filePath) {
  fs.readFile(filePath, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    const isHtml = ext === '.html';

    /* 响应头：HTML 不缓存（保证发版即生效），静态资源缓存 1 天 */
    const headers = {
      'Content-Type': mime,
      'Cache-Control': isHtml ? 'no-cache' : 'public, max-age=86400',
      'X-Content-Type-Options': 'nosniff'
    };

    const acceptGzip = (req.headers['accept-encoding'] || '').indexOf('gzip') >= 0;
    if (acceptGzip && GZIP_TYPES.has(mime.split(';')[0])) {
      zlib.gzip(buf, { level: 6 }, (zErr, gz) => {
        if (zErr) { res.writeHead(200, headers); res.end(buf); return; }
        headers['Content-Encoding'] = 'gzip';
        headers['Content-Length'] = gz.length;
        res.writeHead(200, headers);
        res.end(gz);
      });
    } else {
      headers['Content-Length'] = buf.length;
      res.writeHead(200, headers);
      res.end(buf);
    }
  });
}

/* ---------- HTTP 服务 ---------- */
const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendJSON(res, 405, { ok: false, msg: 'Method Not Allowed' });
    return;
  }

  /* 路径解析：去查询串、URL 解码、归一化 */
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

  /* ---- API 路由 ---- */
  if (urlPath === '/api/health') {
    sendJSON(res, 200, { ok: true, uptime: Math.round((Date.now() - START) / 1000) + 's', ts: new Date().toISOString() });
    return;
  }
  if (urlPath === '/api/meta') {
    sendJSON(res, 200, {
      ok: true,
      name: 'lawlink-app',
      version: '1.0.0',
      desc: '外服法务通 LawLink · 前后端一体部署包',
      uptime: Math.round((Date.now() - START) / 1000) + 's',
      node: process.version
    });
    return;
  }

  /* ---- 静态文件（防目录穿越：解析后路径必须位于 dist 内） ---- */
  let filePath = path.join(ROOT, path.normalize(urlPath));
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      /* 未命中文件（含目录访问）→ 回退 index.html */
      filePath = path.join(ROOT, 'index.html');
    }
    sendFile(req, res, filePath);
  });
});

server.listen(PORT, HOST, () => {
  console.log('[lawlink] 外服法务通已启动');
  console.log('[lawlink] 后端服务  http://%s:%d  (零依赖 Node %s)', HOST, PORT, process.version);
  console.log('[lawlink] 静态目录  %s', ROOT);
  console.log('[lawlink] 健康检查  http://%s:%d/api/health', HOST, PORT);
});
