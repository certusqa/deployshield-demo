#!/usr/bin/env node
'use strict';

/**
 * Minimal demo SUT for the DeployShield hermetic gate.
 * Serves static pages only — no framework, no build step.
 * Covers the six flows under test; not a Sauce Demo clone.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.SUT_PORT || 4173);
const ROOT = path.join(__dirname, 'public');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.ico': 'image/x-icon',
};

function send(res, status, body, type) {
  res.writeHead(status, {
    'Content-Type': type || 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let rel = urlPath === '/' ? '/index.html' : urlPath;
  if (rel.includes('..')) {
    send(res, 400, 'Bad request');
    return;
  }

  const filePath = path.join(ROOT, rel);
  if (!filePath.startsWith(ROOT)) {
    send(res, 400, 'Bad request');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, 'Not found');
      return;
    }
    const ext = path.extname(filePath);
    send(res, 200, data, TYPES[ext] || 'application/octet-stream');
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`DeployShield demo SUT listening on http://127.0.0.1:${PORT}`);
});
