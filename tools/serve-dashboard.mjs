import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const host = process.env.DASHBOARD_HOST || '127.0.0.1';
const port = Number(process.env.DASHBOARD_PORT || 8080);
const root = resolve(process.cwd());

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || `${host}:${port}`}`);
  const pathname = url.pathname === '/' ? '/dashboard.html' : url.pathname;
  const filePath = normalize(join(root, pathname));

  if (!filePath.startsWith(root)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  try {
    const stats = statSync(filePath);
    if (!stats.isFile()) {
      throw new Error('Not a file');
    }

    res.writeHead(200, {
      'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream',
      'Content-Length': stats.size,
    });
    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Try DASHBOARD_PORT=${port + 1} npm run dashboard`);
  } else if (error.code === 'EACCES' || error.code === 'EPERM') {
    console.error(`Unable to bind ${host}:${port}. Try another DASHBOARD_PORT or host.`);
  } else {
    console.error(error);
  }
  process.exit(1);
});

server.listen(port, host, () => {
  console.log(`Dashboard running at http://${host}:${port}/dashboard.html`);
  console.log('Keep the API running separately with: npm run dev');
});
