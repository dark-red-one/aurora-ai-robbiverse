/**
 * Aurora API Gateway - Unified Entry Point
 * Consolidates all scattered API endpoints into one intelligent gateway
 * Version: 2.0.0
 */

import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import { EventEmitter } from 'events';

// ============================================
// API GATEWAY CLASS
// ============================================

export class AuroraAPIGateway extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      port: process.env.GATEWAY_PORT || 3000,
      environment: process.env.NODE_ENV || 'development',
      jwtSecret: process.env.JWT_SECRET || 'aurora-secret-key',
      ...config
    };
    
    this.app = express();
    this.services = new Map();
    this.routes = new Map();
    this.metrics = {
      requests: 0,
      errors: 0,
      latency: []
    };
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupServiceDiscovery();
  }
  
  setupMiddleware() {
    // Security
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: this.config.environment === 'production' 
        ? ['https://aurora.ai', 'https://app.aurora.ai']
        : '*',
      credentials: true
    }));
    
    // Compression
    this.app.use(compression());
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Logging
    this.app.use(morgan(this.config.environment === 'production' ? 'combined' : 'dev'));
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: this.config.environment === 'production' ? 100 : 1000,
      message: 'Too many requests from this IP'
    });
    this.app.use('/api/', limiter);
    
    // Request tracking
    this.app.use((req, res, next) => {
      req.startTime = Date.now();
      
      res.on('finish', () => {
        const latency = Date.now() - req.startTime;
        this.metrics.requests++;
        this.metrics.latency.push(latency);
        
        if (this.metrics.latency.length > 1000) {
          this.metrics.latency.shift();
        }
        
        if (res.statusCode >= 400) {
          this.metrics.errors++;
        }
        
        this.emit('request', {
          method: req.method,
          path: req.path,
          status: res.statusCode,
          latency,
          ip: req.ip
        });
      });
      
      next();
    });
  }
  
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        uptime: process.uptime(),
        metrics: this.getMetrics(),
        services: Array.from(this.services.keys())
      });
    });
    
    // API Documentation
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'Aurora API Gateway',
        version: '2.0.0',
        endpoints: this.getEndpointDocumentation()
      });
    });
    
    // ============================================
    // UNIFIED CHAT API
    // ============================================
    
    this.app.post('/api/v2/chat', this.authenticate, async (req, res) => {
      try {
        const { message, mode = 'balanced', context = [] } = req.body;
        
        // Route to appropriate chat service based on mode
        const service = this.selectChatService(mode);
        
        if (!service) {
          return res.status(503).json({ error: 'Chat service unavailable' });
        }
        
        const response = await service.process(message, { mode, context, user: req.user });
        
        res.json({
          success: true,
          response,
          service: service.name,
          mode
        });
        
      } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Chat processing failed' });
      }
    });
    
    // ============================================
    // NATURAL SQL API
    // ============================================
    
    this.app.post('/api/v2/query', this.authenticate, async (req, res) => {
      try {
        const { question, format = 'json' } = req.body;
        
        // Convert natural language to SQL
        const sql = await this.convertNaturalToSQL(question);
        
        // Execute query with safety checks
        const results = await this.executeQuery(sql, req.user);
        
        res.json({
          success: true,
          question,
          sql,
          results,
          format
        });
        
      } catch (error) {
        console.error('Query error:', error);
        res.status(500).json({ error: 'Query processing failed' });
      }
    });
    
    // ============================================
    // GPU MESH API
    // ============================================
    
    this.app.get('/api/v2/gpu/status', async (req, res) => {
      try {
        const nodes = await this.getGPUNodeStatus();
        
        res.json({
          success: true,
          nodes,
          meshEnabled: process.env.GPU_MESH_ENABLED === 'true',
          totalGPUs: nodes.reduce((sum, n) => sum + n.gpuCount, 0)
        });
        
      } catch (error) {
        console.error('GPU status error:', error);
        res.status(500).json({ error: 'Failed to get GPU status' });
      }
    });
    
    this.app.post('/api/v2/gpu/execute', this.authenticate, async (req, res) => {
      try {
        const { task, priority = 'normal' } = req.body;
        
        // Find best available GPU node
        const node = await this.selectGPUNode(task);
        
        if (!node) {
          return res.status(503).json({ error: 'No GPU resources available' });
        }
        
        // Queue task for execution
        const jobId = await this.queueGPUTask(node, task, priority);
        
        res.json({
          success: true,
          jobId,
          node: node.id,
          estimatedTime: node.estimatedTime
        });
        
      } catch (error) {
        console.error('GPU execution error:', error);
        res.status(500).json({ error: 'GPU task submission failed' });
      }
    });
    
    // ============================================
    // PERSONALITY API
    // ============================================
    
    this.app.get('/api/v2/personalities', async (req, res) => {
      try {
        const personalities = await this.getPersonalities();
        
        res.json({
          success: true,
          count: personalities.length,
          personalities
        });
        
      } catch (error) {
        console.error('Personalities error:', error);
        res.status(500).json({ error: 'Failed to get personalities' });
      }
    });
    
    this.app.post('/api/v2/personalities/:id/activate', this.authenticate, async (req, res) => {
      try {
        const { id } = req.params;
        const { traits = {} } = req.body;
        
        const result = await this.activatePersonality(id, traits);
        
        res.json({
          success: true,
          personality: id,
          traits: result.traits,
          message: `${id} personality activated`
        });
        
      } catch (error) {
        console.error('Personality activation error:', error);
        res.status(500).json({ error: 'Failed to activate personality' });
      }
    });
    
    // ============================================
    // FEATURE FLAGS API
    // ============================================
    
    this.app.get('/api/v2/features', async (req, res) => {
      try {
        const features = await this.getFeatureFlags();
        
        res.json({
          success: true,
          features
        });
        
      } catch (error) {
        console.error('Features error:', error);
        res.status(500).json({ error: 'Failed to get features' });
      }
    });
    
    this.app.post('/api/v2/features/:feature/toggle', this.authenticate, this.requireAdmin, async (req, res) => {
      try {
        const { feature } = req.params;
        const { enabled } = req.body;
        
        await this.toggleFeature(feature, enabled);
        
        res.json({
          success: true,
          feature,
          enabled,
          message: `Feature ${feature} ${enabled ? 'enabled' : 'disabled'}`
        });
        
      } catch (error) {
        console.error('Feature toggle error:', error);
        res.status(500).json({ error: 'Failed to toggle feature' });
      }
    });
    
    // ============================================
    // ANALYTICS API
    // ============================================
    
    this.app.get('/api/v2/analytics/dashboard', async (req, res) => {
      try {
        const analytics = await this.getAnalytics();
        
        res.json({
          success: true,
          analytics
        });
        
      } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed to get analytics' });
      }
    });
    
    // ============================================
    // LEGACY API COMPATIBILITY
    // ============================================
    
    // Map old endpoints to new ones
    this.app.use('/api/chat', (req, res) => {
      req.url = '/api/v2/chat';
      this.app.handle(req, res);
    });
    
    this.app.use('/api/v1/*', (req, res) => {
      req.url = req.url.replace('/api/v1', '/api/v2');
      this.app.handle(req, res);
    });
    
    // ============================================
    // SERVICE PROXYING
    // ============================================
    
    // Proxy to backend services
    this.setupServiceProxies();
    
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
        method: req.method
      });
    });
    
    // Error handler
    this.app.use((err, req, res, next) => {
      console.error('Gateway error:', err);
      
      res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(this.config.environment === 'development' && { stack: err.stack })
      });
    });
  }
  
  setupServiceProxies() {
    // FastAPI backend
    if (process.env.BACKEND_URL) {
      this.app.use('/backend', createProxyMiddleware({
        target: process.env.BACKEND_URL || 'http://localhost:8000',
        changeOrigin: true,
        pathRewrite: { '^/backend': '' }
      }));
    }
    
    // Vengeance Node.js
    if (process.env.VENGEANCE_URL) {
      this.app.use('/vengeance', createProxyMiddleware({
        target: process.env.VENGEANCE_URL || 'http://localhost:3001',
        changeOrigin: true,
        pathRewrite: { '^/vengeance': '' }
      }));
    }
  }
  
  setupServiceDiscovery() {
    // Register known services
    this.services.set('chat-fast', {
      name: 'chat-fast',
      url: 'http://localhost:8001',
      health: '/health',
      priority: 1
    });
    
    this.services.set('chat-quality', {
      name: 'chat-quality',
      url: 'http://localhost:8002',
      health: '/health',
      priority: 2
    });
    
    this.services.set('database', {
      name: 'database',
      url: 'postgresql://localhost:5432',
      health: 'SELECT 1',
      priority: 1
    });
    
    this.services.set('redis', {
      name: 'redis',
      url: 'redis://localhost:6379',
      health: 'PING',
      priority: 1
    });
    
    // Start health monitoring
    this.startHealthMonitoring();
  }
  
  startHealthMonitoring() {
    setInterval(async () => {
      for (const [name, service] of this.services) {
        try {
          // Check service health
          const healthy = await this.checkServiceHealth(service);
          service.healthy = healthy;
          service.lastCheck = new Date();
          
          if (!healthy) {
            this.emit('service:unhealthy', { name, service });
          }
        } catch (error) {
          service.healthy = false;
          service.error = error.message;
        }
      }
    }, 30000); // Every 30 seconds
  }
  
  async checkServiceHealth(service) {
    // Implementation would check actual service health
    return true;
  }
  
  // Middleware functions
  authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token && this.config.environment === 'development') {
      req.user = { id: 'dev-user', role: 'admin' };
      return next();
    }
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
  
  requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  };
  
  // Service selection methods
  selectChatService(mode) {
    const serviceMap = {
      'fast': 'chat-fast',
      'balanced': 'chat-fast',
      'quality': 'chat-quality',
      'creative': 'chat-quality'
    };
    
    const serviceName = serviceMap[mode] || 'chat-fast';
    const service = this.services.get(serviceName);
    
    if (service?.healthy) {
      return service;
    }
    
    // Fallback to any healthy chat service
    for (const [name, svc] of this.services) {
      if (name.startsWith('chat') && svc.healthy) {
        return svc;
      }
    }
    
    return null;
  }
  
  async selectGPUNode(task) {
    // Find node with lowest load
    const nodes = await this.getGPUNodeStatus();
    
    return nodes
      .filter(n => n.status === 'active')
      .sort((a, b) => a.load - b.load)[0];
  }
  
  // Helper methods
  async convertNaturalToSQL(question) {
    // Simplified - would use AI in production
    const patterns = [
      { pattern: /how many (.*)/i, sql: 'SELECT COUNT(*) FROM $1' },
      { pattern: /show all (.*)/i, sql: 'SELECT * FROM $1 LIMIT 100' },
      { pattern: /top (\d+) (.*)/i, sql: 'SELECT * FROM $2 LIMIT $1' }
    ];
    
    for (const { pattern, sql } of patterns) {
      const match = question.match(pattern);
      if (match) {
        return sql.replace(/\$(\d+)/g, (_, n) => match[n]);
      }
    }
    
    throw new Error('Could not understand query');
  }
  
  async executeQuery(sql, user) {
    // Safety checks
    if (!sql.toLowerCase().startsWith('select')) {
      throw new Error('Only SELECT queries allowed');
    }
    
    // Execute query (simplified)
    return [
      { id: 1, name: 'Sample Result', value: 100 }
    ];
  }
  
  async getGPUNodeStatus() {
    return [
      { id: 'aurora', gpuCount: 2, load: 0.12, status: 'active' },
      { id: 'collaboration', gpuCount: 1, load: 0.45, status: 'active' },
      { id: 'fluenti', gpuCount: 1, load: 0.23, status: 'active' }
    ];
  }
  
  async queueGPUTask(node, task, priority) {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Queue task (simplified)
    console.log(`Queuing task ${jobId} on node ${node.id}`);
    
    return jobId;
  }
  
  async getPersonalities() {
    return [
      { id: 'robbie', name: 'Robbie', description: 'Helpful AI copilot' },
      { id: 'professional', name: 'Professional', description: 'Business-focused' },
      { id: 'creative', name: 'Creative', description: 'Artistic and innovative' },
      { id: 'allanbot', name: 'AllanBot', description: 'Digital twin of Allan' }
    ];
  }
  
  async activatePersonality(id, traits) {
    console.log(`Activating personality ${id} with traits:`, traits);
    return { traits: { ...traits, active: true } };
  }
  
  async getFeatureFlags() {
    return {
      gpu_mesh: true,
      natural_sql: true,
      risk_assessment: true,
      character_cards: true,
      bbs_interface: false,
      town_system: false,
      device_ecosystem: false
    };
  }
  
  async toggleFeature(feature, enabled) {
    console.log(`Toggling feature ${feature} to ${enabled}`);
    // Update feature flag in database
  }
  
  async getAnalytics() {
    return {
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: this.metrics.requests > 0 
        ? (this.metrics.errors / this.metrics.requests * 100).toFixed(2) + '%'
        : '0%',
      avgLatency: this.metrics.latency.length > 0
        ? Math.round(this.metrics.latency.reduce((a, b) => a + b, 0) / this.metrics.latency.length)
        : 0,
      uptime: process.uptime(),
      services: Array.from(this.services.entries()).map(([name, service]) => ({
        name,
        healthy: service.healthy,
        lastCheck: service.lastCheck
      }))
    };
  }
  
  getMetrics() {
    return {
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      avgLatency: this.metrics.latency.length > 0
        ? Math.round(this.metrics.latency.reduce((a, b) => a + b, 0) / this.metrics.latency.length)
        : 0
    };
  }
  
  getEndpointDocumentation() {
    return {
      chat: {
        path: '/api/v2/chat',
        method: 'POST',
        description: 'Unified chat endpoint with multiple modes',
        body: {
          message: 'string',
          mode: 'fast|balanced|quality|creative',
          context: 'array'
        }
      },
      query: {
        path: '/api/v2/query',
        method: 'POST',
        description: 'Natural language SQL queries',
        body: {
          question: 'string',
          format: 'json|csv|table'
        }
      },
      gpu: {
        status: {
          path: '/api/v2/gpu/status',
          method: 'GET',
          description: 'Get GPU cluster status'
        },
        execute: {
          path: '/api/v2/gpu/execute',
          method: 'POST',
          description: 'Submit GPU task',
          body: {
            task: 'object',
            priority: 'low|normal|high'
          }
        }
      },
      personalities: {
        list: {
          path: '/api/v2/personalities',
          method: 'GET',
          description: 'List available personalities'
        },
        activate: {
          path: '/api/v2/personalities/:id/activate',
          method: 'POST',
          description: 'Activate a personality',
          body: {
            traits: 'object'
          }
        }
      },
      features: {
        list: {
          path: '/api/v2/features',
          method: 'GET',
          description: 'Get feature flags'
        },
        toggle: {
          path: '/api/v2/features/:feature/toggle',
          method: 'POST',
          description: 'Toggle feature flag',
          body: {
            enabled: 'boolean'
          }
        }
      },
      analytics: {
        path: '/api/v2/analytics/dashboard',
        method: 'GET',
        description: 'Get analytics dashboard data'
      }
    };
  }
  
  async start() {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.config.port, () => {
        console.log(`🚀 Aurora API Gateway running on port ${this.config.port}`);
        console.log(`📍 Environment: ${this.config.environment}`);
        console.log(`🔗 Services registered: ${this.services.size}`);
        console.log(`📊 Endpoints available: ${Object.keys(this.getEndpointDocumentation()).length} groups`);
        
        this.emit('started', { port: this.config.port });
        resolve();
      });
    });
  }
  
  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('👋 Aurora API Gateway stopped');
          this.emit('stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// ============================================
// EXPORTS
// ============================================

export default AuroraAPIGateway;

// Start gateway if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const gateway = new AuroraAPIGateway();
  
  gateway.start().catch(console.error);
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🔄 Shutting down gracefully...');
    await gateway.stop();
    process.exit(0);
  });
}



