// Agent Office - High Performance Static HTTP Server
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = path.resolve(__dirname);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  try {
    let cleanPath = req.url.split('?')[0];
    if (cleanPath === '/' || cleanPath === '') {
      cleanPath = 'index.html';
    } else {
      cleanPath = cleanPath.replace(/^\/+/, '');
    }

    const safePath = path.normalize(cleanPath).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(ROOT, safePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': Buffer.byteLength(data),
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(data);
    });
  } catch (ex) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500 Server Error: ' + ex.message);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Agent Office is live at http://127.0.0.1:${PORT}/ and http://localhost:${PORT}/`);
});
