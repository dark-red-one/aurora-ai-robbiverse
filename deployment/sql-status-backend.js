#!/usr/bin/env node
// 🔥💋 SQL-BASED STATUS BACKEND FOR ROBBIE APPS 🔥💋

const http = require('http');
const url = require('url');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const port = 8000;
const dbPath = '/tmp/robbie_status.db';

// Initialize SQLite database
const db = new sqlite3.Database(dbPath);

// Create tables if they don't exist
db.serialize(() => {
  // System status table
  db.run(`CREATE TABLE IF NOT EXISTS system_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    component TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    version TEXT
  )`);

  // App deployments table
  db.run(`CREATE TABLE IF NOT EXISTS deployments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_name TEXT NOT NULL,
    version TEXT NOT NULL,
    status TEXT NOT NULL,
    deployed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    url TEXT,
    notes TEXT
  )`);

  // User sessions table
  db.run(`CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    app_name TEXT NOT NULL,
    session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
    session_end DATETIME,
    status TEXT DEFAULT 'active'
  )`);

  // Insert initial system status
  db.run(`INSERT OR REPLACE INTO system_status (component, status, message, version) 
          VALUES ('robbie-system', 'operational', 'All systems green', '20251008-041322')`);
  
  db.run(`INSERT OR REPLACE INTO system_status (component, status, message, version) 
          VALUES ('homepage', 'operational', 'Login and app selector working', '20251008-041322')`);
  
  db.run(`INSERT OR REPLACE INTO system_status (component, status, message, version) 
          VALUES ('robbie-code', 'operational', 'React app fully functional', '20251008-041322')`);
  
  db.run(`INSERT OR REPLACE INTO system_status (component, status, message, version) 
          VALUES ('mock-backend', 'operational', 'API endpoints responding', '1.0.0')`);

  // Insert deployment records
  db.run(`INSERT OR REPLACE INTO deployments (app_name, version, status, url, notes) 
          VALUES ('homepage', '20251008-041322', 'deployed', 'http://155.138.194.222/', 'Login and app selector')`);
  
  db.run(`INSERT OR REPLACE INTO deployments (app_name, version, status, url, notes) 
          VALUES ('robbie-code', '20251008-041322', 'deployed', 'http://155.138.194.222/code', 'Full React app with Matrix background')`);
});

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  console.log(`🔥 ${method} ${path}`);
  
  // Route handlers
  switch (path) {
    case '/api/system/stats':
      handleSystemStats(res);
      break;
      
    case '/api/system/status':
      handleSystemStatus(res);
      break;
      
    case '/api/deployments':
      handleDeployments(res);
      break;
      
    case '/api/deployments/status':
      handleDeploymentStatus(res);
      break;
      
    case '/api/auth/login':
      handleLogin(req, res);
      break;
      
    default:
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found', path }));
  }
});

function handleSystemStats(res) {
  db.get(`SELECT 
    COUNT(*) as total_components,
    SUM(CASE WHEN status = 'operational' THEN 1 ELSE 0 END) as operational_components,
    MAX(timestamp) as last_update
    FROM system_status`, (err, row) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: 'sql-backend-1.0.0',
      stats: row
    }));
  });
}

function handleSystemStatus(res) {
  db.all(`SELECT component, status, message, version, timestamp 
          FROM system_status 
          ORDER BY timestamp DESC`, (err, rows) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      timestamp: new Date().toISOString(),
      components: rows
    }));
  });
}

function handleDeployments(res) {
  db.all(`SELECT app_name, version, status, deployed_at, url, notes 
          FROM deployments 
          ORDER BY deployed_at DESC`, (err, rows) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      timestamp: new Date().toISOString(),
      deployments: rows
    }));
  });
}

function handleDeploymentStatus(res) {
  db.get(`SELECT 
    COUNT(*) as total_deployments,
    SUM(CASE WHEN status = 'deployed' THEN 1 ELSE 0 END) as active_deployments,
    MAX(deployed_at) as last_deployment
    FROM deployments`, (err, row) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      timestamp: new Date().toISOString(),
      status: row
    }));
  });
}

function handleLogin(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      const credentials = JSON.parse(body);
      
      // Log login attempt
      db.run(`INSERT INTO user_sessions (user_email, app_name, status) 
              VALUES (?, 'login', 'active')`, [credentials.email], function(err) {
        if (err) {
          console.error('Failed to log session:', err);
        }
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        token: 'sql-token-123',
        user: { email: credentials.email, name: 'Allan' },
        backend: 'sql-based'
      }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
    }
  });
}

server.listen(port, () => {
  console.log(`🔥 SQL-based backend running on http://localhost:${port}`);
  console.log(`📊 Database: ${dbPath}`);
  console.log('📊 Available endpoints:');
  console.log('  GET  /api/system/stats');
  console.log('  GET  /api/system/status');
  console.log('  GET  /api/deployments');
  console.log('  GET  /api/deployments/status');
  console.log('  POST /api/auth/login');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔥 Shutting down SQL backend...');
  db.close((err) => {
    if (err) console.error(err);
    process.exit(0);
  });
});










