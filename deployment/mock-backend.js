#!/usr/bin/env node
// 🔥💋 MOCK BACKEND FOR ROBBIE APPS 🔥💋

const http = require('http');
const url = require('url');

const port = 8000;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  console.log(`🔥 ${req.method} ${path}`);
  
  // Mock API endpoints
  switch (path) {
    case '/api/auth/login':
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        token: 'mock-token-123',
        user: { email: 'allan@testpilotcpg.com', name: 'Allan' }
      }));
      break;
      
    case '/api/system/stats':
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: 'mock-1.0.0'
      }));
      break;
      
    default:
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(port, () => {
  console.log(`🔥 Mock backend running on http://localhost:${port}`);
  console.log('📊 Available endpoints:');
  console.log('  POST /api/auth/login');
  console.log('  GET  /api/system/stats');
});










