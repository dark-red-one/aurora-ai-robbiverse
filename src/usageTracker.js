import { db } from "./db.js";
import { randomUUID } from "crypto";

// Enhanced usage tracking for all API calls
export class ComprehensiveUsageTracker {
  constructor() {
    this.initializeTables();
  }

  initializeTables() {
    // Enhanced usage tracking table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS api_usage (
        id TEXT PRIMARY KEY,
        service TEXT NOT NULL, -- 'llm', 'clay', 'hubspot', 'gmail', etc.
        endpoint TEXT NOT NULL,
        model TEXT,
        method TEXT NOT NULL,
        request_size INTEGER DEFAULT 0,
        response_size INTEGER DEFAULT 0,
        input_tokens INTEGER DEFAULT 0,
        output_tokens INTEGER DEFAULT 0,
        total_tokens INTEGER DEFAULT 0,
        latency_ms INTEGER NOT NULL,
        cost_usd REAL DEFAULT 0.0,
        success BOOLEAN NOT NULL,
        error_message TEXT,
        user_id TEXT,
        session_id TEXT,
        model_flags TEXT, -- JSON of model-specific flags
        cache_hit BOOLEAN DEFAULT FALSE,
        retry_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Cost tracking by service
    db.prepare(`
      CREATE TABLE IF NOT EXISTS cost_analytics (
        id TEXT PRIMARY KEY,
        service TEXT NOT NULL,
        date TEXT NOT NULL,
        total_cost_usd REAL DEFAULT 0.0,
        total_tokens INTEGER DEFAULT 0,
        total_requests INTEGER DEFAULT 0,
        avg_latency_ms REAL DEFAULT 0.0,
        success_rate REAL DEFAULT 0.0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Performance metrics
    db.prepare(`
      CREATE TABLE IF NOT EXISTS performance_metrics (
        id TEXT PRIMARY KEY,
        service TEXT NOT NULL,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        metadata TEXT, -- JSON for additional context
        timestamp TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Indexes for performance
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_api_usage_service ON api_usage(service, created_at)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_api_usage_model ON api_usage(model, created_at)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_api_usage_cost ON api_usage(cost_usd, created_at)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_cost_analytics_date ON cost_analytics(date, service)`).run();
  }

  // Track any API call with comprehensive metrics
  trackApiCall({
    service,
    endpoint,
    model = null,
    method = 'POST',
    requestSize = 0,
    responseSize = 0,
    inputTokens = 0,
    outputTokens = 0,
    latencyMs,
    costUsd = 0.0,
    success = true,
    errorMessage = null,
    userId = 'robbie',
    sessionId = null,
    modelFlags = {},
    cacheHit = false,
    retryCount = 0
  }) {
    try {
      const totalTokens = inputTokens + outputTokens;
      const id = randomUUID();
      
      db.prepare(`
        INSERT INTO api_usage (
          id, service, endpoint, model, method, request_size, response_size,
          input_tokens, output_tokens, total_tokens, latency_ms, cost_usd,
          success, error_message, user_id, session_id, model_flags, cache_hit, retry_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, service, endpoint, model, method, requestSize, responseSize,
        inputTokens, outputTokens, totalTokens, latencyMs, costUsd,
        success, errorMessage, userId, sessionId, JSON.stringify(modelFlags), cacheHit, retryCount
      );

      // Update daily cost analytics
      this.updateDailyCostAnalytics(service, costUsd, totalTokens, latencyMs, success);
      
      return id;
    } catch (error) {
      console.error('Failed to track API usage:', error);
      return null;
    }
  }

  updateDailyCostAnalytics(service, costUsd, totalTokens, latencyMs, success) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get existing record
      const existing = db.prepare(`
        SELECT * FROM cost_analytics 
        WHERE service = ? AND date = ?
      `).get(service, today);

      if (existing) {
        // Update existing record
        const newTotalCost = existing.total_cost_usd + costUsd;
        const newTotalTokens = existing.total_tokens + totalTokens;
        const newTotalRequests = existing.total_requests + 1;
        const newAvgLatency = ((existing.avg_latency_ms * existing.total_requests) + latencyMs) / newTotalRequests;
        const newSuccessRate = success ? 
          ((existing.success_rate * existing.total_requests) + 1) / newTotalRequests :
          (existing.success_rate * existing.total_requests) / newTotalRequests;

        db.prepare(`
          UPDATE cost_analytics SET
            total_cost_usd = ?, total_tokens = ?, total_requests = ?,
            avg_latency_ms = ?, success_rate = ?
          WHERE id = ?
        `).run(newTotalCost, newTotalTokens, newTotalRequests, newAvgLatency, newSuccessRate, existing.id);
      } else {
        // Create new record
        const id = randomUUID();
        db.prepare(`
          INSERT INTO cost_analytics (
            id, service, date, total_cost_usd, total_tokens, total_requests,
            avg_latency_ms, success_rate
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, service, today, costUsd, totalTokens, 1, latencyMs, success ? 1.0 : 0.0);
      }
    } catch (error) {
      console.error('Failed to update daily cost analytics:', error);
    }
  }

  // Track performance metrics
  trackPerformanceMetric(service, metricName, metricValue, metadata = {}) {
    try {
      const id = randomUUID();
      db.prepare(`
        INSERT INTO performance_metrics (id, service, metric_name, metric_value, metadata)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, service, metricName, metricValue, JSON.stringify(metadata));
    } catch (error) {
      console.error('Failed to track performance metric:', error);
    }
  }

  // Get usage analytics
  getUsageAnalytics(service = null, days = 7) {
    try {
      const whereClause = service ? 'WHERE service = ?' : '';
      const params = service ? [service] : [];
      
      const usage = db.prepare(`
        SELECT 
          service,
          COUNT(*) as total_requests,
          SUM(cost_usd) as total_cost,
          SUM(total_tokens) as total_tokens,
          AVG(latency_ms) as avg_latency,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate,
          SUM(CASE WHEN cache_hit = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as cache_hit_rate
        FROM api_usage 
        ${whereClause}
        AND created_at >= datetime('now', '-${days} days')
        GROUP BY service
        ORDER BY total_cost DESC
      `).all(...params);

      return usage;
    } catch (error) {
      console.error('Failed to get usage analytics:', error);
      return [];
    }
  }

  // Get cost trends
  getCostTrends(days = 30) {
    try {
      const trends = db.prepare(`
        SELECT 
          date,
          service,
          total_cost_usd,
          total_tokens,
          total_requests,
          avg_latency_ms,
          success_rate
        FROM cost_analytics 
        WHERE date >= date('now', '-${days} days')
        ORDER BY date DESC, service
      `).all();

      return trends;
    } catch (error) {
      console.error('Failed to get cost trends:', error);
      return [];
    }
  }

  // Get model performance comparison
  getModelPerformance() {
    try {
      const performance = db.prepare(`
        SELECT 
          model,
          COUNT(*) as requests,
          AVG(latency_ms) as avg_latency,
          AVG(cost_usd) as avg_cost,
          SUM(cost_usd) as total_cost,
          SUM(total_tokens) as total_tokens,
          AVG(total_tokens) as avg_tokens_per_request,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate
        FROM api_usage 
        WHERE model IS NOT NULL
        AND created_at >= datetime('now', '-7 days')
        GROUP BY model
        ORDER BY total_cost DESC
      `).all();

      return performance;
    } catch (error) {
      console.error('Failed to get model performance:', error);
      return [];
    }
  }

  // Get top expensive operations
  getTopExpensiveOperations(limit = 10) {
    try {
      const expensive = db.prepare(`
        SELECT 
          service,
          endpoint,
          model,
          cost_usd,
          latency_ms,
          total_tokens,
          created_at
        FROM api_usage 
        WHERE cost_usd > 0
        ORDER BY cost_usd DESC
        LIMIT ?
      `).all(limit);

      return expensive;
    } catch (error) {
      console.error('Failed to get expensive operations:', error);
      return [];
    }
  }

  // Calculate cost per token by service
  getCostPerToken() {
    try {
      const costPerToken = db.prepare(`
        SELECT 
          service,
          model,
          SUM(cost_usd) / NULLIF(SUM(total_tokens), 0) as cost_per_token,
          SUM(cost_usd) as total_cost,
          SUM(total_tokens) as total_tokens
        FROM api_usage 
        WHERE total_tokens > 0
        AND created_at >= datetime('now', '-7 days')
        GROUP BY service, model
        HAVING cost_per_token > 0
        ORDER BY cost_per_token DESC
      `).all();

      return costPerToken;
    } catch (error) {
      console.error('Failed to get cost per token:', error);
      return [];
    }
  }
}

// Singleton instance
export const usageTracker = new ComprehensiveUsageTracker();

// Helper function to wrap API calls with tracking
export function withUsageTracking(apiCall, service, endpoint, options = {}) {
  return async (...args) => {
    const startTime = Date.now();
    let success = false;
    let errorMessage = null;
    let result = null;

    try {
      result = await apiCall(...args);
      success = true;
      return result;
    } catch (error) {
      errorMessage = error.message;
      throw error;
    } finally {
      const latencyMs = Date.now() - startTime;
      
      // Extract metrics from result if available
      const metrics = result?.usage || {};
      
      usageTracker.trackApiCall({
        service,
        endpoint,
        model: options.model,
        method: options.method || 'POST',
        requestSize: options.requestSize || 0,
        responseSize: result ? JSON.stringify(result).length : 0,
        inputTokens: metrics.prompt_tokens || 0,
        outputTokens: metrics.completion_tokens || 0,
        latencyMs,
        costUsd: options.costUsd || 0.0,
        success,
        errorMessage,
        userId: options.userId || 'robbie',
        sessionId: options.sessionId,
        modelFlags: options.modelFlags || {},
        cacheHit: options.cacheHit || false,
        retryCount: options.retryCount || 0
      });
    }
  };
}
