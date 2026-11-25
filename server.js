const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const BASE_DIR = path.resolve(__dirname);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function isBlockedPath(relPath) {
  const lower = relPath.toLowerCase();
  const segments = lower.split(/[\\/]+/).filter(Boolean);
  if (segments.some(seg => seg.startsWith('.') || seg === 'backups' || seg === 'node_modules')) {
    return true;
  }
  return lower.endsWith('.gs') || lower.endsWith('.bat') || lower.endsWith('.zip') || lower.endsWith('.rules');
}

const server = http.createServer((req, res) => {
  let reqPath;
  try {
    reqPath = decodeURIComponent(String(req.url || '/').split('?')[0]);
  } catch (_) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 Bad Request');
    return;
  }

  // รูทหลัก หรือ /index.html ให้เปิด index_app.html ซึ่งเป็นตัวแอพพลิเคชันจริง
  if (reqPath === '/' || reqPath === '/index.html') {
    reqPath = '/index_app.html';
  }

  const rawSegments = reqPath.split(/[/\\]+/).filter(Boolean);
  const normalizedRel = path.normalize(rawSegments.join(path.sep));
  const filePath = path.resolve(BASE_DIR, normalizedRel);

  // Path traversal & sensitive file guard
  if (rawSegments.includes('..') || (filePath !== BASE_DIR && !filePath.startsWith(BASE_DIR + path.sep)) || isBlockedPath(normalizedRel)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found: ' + reqPath);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[FaCiLiTy Local Preview] Server running at http://localhost:${PORT}/`);
  console.log(`[FaCiLiTy Local Preview] Serving index_app.html (Full App) locally on this machine only`);
});

