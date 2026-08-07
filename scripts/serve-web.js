const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 4173);
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function resolveRequestPath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, `http://${host}`).pathname);
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const target = path.resolve(root, relativePath);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) return null;
  return target;
}

const server = http.createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('Method Not Allowed');
    return;
  }

  let target;
  try {
    target = resolveRequestPath(request.url || '/');
  } catch {
    response.writeHead(400);
    response.end('Bad Request');
    return;
  }
  if (!target) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  fs.stat(target, (error, stats) => {
    if (error || !stats.isFile()) {
      response.writeHead(404);
      response.end('Not Found');
      return;
    }
    response.writeHead(200, {
      'Cache-Control': 'no-cache',
      'Content-Type': contentTypes[path.extname(target).toLowerCase()] || 'application/octet-stream',
    });
    if (request.method === 'HEAD') response.end();
    else fs.createReadStream(target).pipe(response);
  });
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Set PORT to use another port.`);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`Web preview: http://${host}:${port}`);
  console.log('Press Ctrl+C to stop.');
});
