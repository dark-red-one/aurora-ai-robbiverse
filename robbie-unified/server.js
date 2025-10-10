#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// CORS for all origins
app.use(cors({
  origin: '*',
  credentials: true
}));

// JSON parsing
app.use(express.json());

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));

// Robbie Personality System
const robbieState = {
  mood: 'focused',
  attraction: 11,
  gandhiGenghis: 7,
  isPublic: false,
  activeUsers: ['Allan'],
  turboLevel: 8,
  confidence: 85,
  stress: 20,
  energy: 75
};

// API Routes
app.get('/api/personality/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: Date.now(),
    personality: robbieState
  });
});

app.get('/api/mood/current', (req, res) => {
  res.json({
    mood: robbieState.mood,
    attraction: robbieState.attraction,
    gandhiGenghis: robbieState.gandhiGenghis,
    user_id: 'allan'
  });
});

app.post('/api/mood/update', (req, res) => {
  const { mood, attraction_level, gandhi_genghis_level } = req.body;
  
  if (mood) robbieState.mood = mood;
  if (attraction_level) robbieState.attraction = Math.min(11, Math.max(1, attraction_level));
  if (gandhi_genghis_level) robbieState.gandhiGenghis = Math.min(10, Math.max(1, gandhi_genghis_level));
  
  // Broadcast to all connected clients
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify({
        type: 'personality_update',
        data: robbieState
      }));
    }
  });
  
  res.json({ success: true, personality: robbieState });
});

app.get('/api/system/stats', (req, res) => {
  // Mock system stats
  res.json({
    cpu: Math.floor(Math.random() * 30) + 40, // 40-70%
    memory: Math.floor(Math.random() * 20) + 60, // 60-80%
    gpu: Math.floor(Math.random() * 25) + 45, // 45-70%
    timestamp: Date.now()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: Date.now() });
});

// WebSocket for real-time updates
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send current state to new client
  ws.send(JSON.stringify({
    type: 'init',
    data: robbieState
  }));
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data);
      
      // Handle different message types
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (err) {
      console.error('WebSocket message error:', err);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 80;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`🚀 Robbie Unified Server running on http://${HOST}:${PORT}`);
  console.log(`🎯 Personality API: http://${HOST}:${PORT}/api/personality/status`);
  console.log(`💬 WebSocket: ws://${HOST}:${PORT}`);
  console.log(`🔥 System Stats: http://${HOST}:${PORT}/api/system/stats`);
});





