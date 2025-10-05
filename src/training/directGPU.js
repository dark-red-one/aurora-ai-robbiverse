import { exec } from "child_process";
import { promisify } from "util";
import { db } from "./db.js";
import { randomUUID } from "crypto";

const execAsync = promisify(exec);

// Direct GPU Access System - No more proxy nonsense
export class DirectGPU {
  constructor() {
    this.initializeTables();
    this.ollamaBaseUrl = "http://localhost:11434";
  }

  initializeTables() {
    // Direct GPU usage tracking
    db.prepare(`
      CREATE TABLE IF NOT EXISTS direct_gpu_usage (
        id TEXT PRIMARY KEY,
        model TEXT NOT NULL,
        prompt TEXT NOT NULL,
        response TEXT NOT NULL,
        input_tokens INTEGER NOT NULL,
        output_tokens INTEGER NOT NULL,
        total_tokens INTEGER NOT NULL,
        duration_ms INTEGER NOT NULL,
        gpu_utilization REAL,
        memory_used_mb REAL,
        temperature_c REAL,
        cost_usd REAL DEFAULT 0.0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Model performance tracking
    db.prepare(`
      CREATE TABLE IF NOT EXISTS model_performance (
        id TEXT PRIMARY KEY,
        model TEXT NOT NULL,
        task_type TEXT NOT NULL,
        avg_speed_tokens_per_sec REAL,
        avg_gpu_utilization REAL,
        avg_memory_usage_mb REAL,
        success_rate REAL,
        total_requests INTEGER DEFAULT 0,
        last_updated TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Indexes
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_direct_gpu_model ON direct_gpu_usage(model, created_at)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_model_perf_task ON model_performance(task_type, avg_speed_tokens_per_sec)`).run();
  }

  // Get available models directly from Ollama
  async getAvailableModels() {
    try {
      const { stdout } = await execAsync(`curl -s ${this.ollamaBaseUrl}/api/tags`);
      const data = JSON.parse(stdout);
      return data.models || [];
    } catch (error) {
      console.error('Error getting models:', error);
      return [];
    }
  }

  // Generate text directly with GPU
  async generateText(prompt, options = {}) {
    const startTime = Date.now();
    const model = options.model || 'llama-maverick';
    const temperature = options.temperature || 0.7;
    const maxTokens = options.max_tokens || 1024;

    try {
      // Get GPU stats before generation
      const gpuStatsBefore = await this.getGPUStats();
      
      // Call Ollama directly
      const payload = {
        model: model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: temperature,
          num_predict: maxTokens
        }
      };

      const { stdout } = await execAsync(`
        curl -s -X POST ${this.ollamaBaseUrl}/api/generate \
        -H "Content-Type: application/json" \
        -d '${JSON.stringify(payload)}'
      `);

      const response = JSON.parse(stdout);
      const duration = Date.now() - startTime;

      // Get GPU stats after generation
      const gpuStatsAfter = await this.getGPUStats();

      // Extract token counts (Ollama doesn't always provide these)
      const inputTokens = this.estimateTokens(prompt);
      const outputTokens = this.estimateTokens(response.response);
      const totalTokens = inputTokens + outputTokens;

      // Calculate speed
      const tokensPerSecond = outputTokens / (duration / 1000);

      // Record usage
      const usageId = randomUUID();
      db.prepare(`
        INSERT INTO direct_gpu_usage (
          id, model, prompt, response, input_tokens, output_tokens, total_tokens,
          duration_ms, gpu_utilization, memory_used_mb, temperature_c, cost_usd
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        usageId,
        model,
        prompt.substring(0, 1000), // Truncate for storage
        response.response.substring(0, 2000),
        inputTokens,
        outputTokens,
        totalTokens,
        duration,
        gpuStatsAfter.utilization,
        gpuStatsAfter.memoryUsed,
        gpuStatsAfter.temperature,
        0.0 // Local GPU is free
      );

      // Update model performance
      this.updateModelPerformance(model, 'text_generation', tokensPerSecond, gpuStatsAfter);

      return {
        response: response.response,
        model: model,
        tokens: {
          input: inputTokens,
          output: outputTokens,
          total: totalTokens
        },
        performance: {
          duration_ms: duration,
          tokens_per_second: tokensPerSecond,
          gpu_utilization: gpuStatsAfter.utilization,
          memory_used_mb: gpuStatsAfter.memoryUsed,
          temperature_c: gpuStatsAfter.temperature
        },
        cost_usd: 0.0
      };

    } catch (error) {
      console.error('Direct GPU generation error:', error);
      throw new Error(`GPU generation failed: ${error.message}`);
    }
  }

  // Stream text generation
  async generateTextStream(prompt, options = {}, onChunk = null) {
    const startTime = Date.now();
    const model = options.model || 'llama-maverick';
    const temperature = options.temperature || 0.7;
    const maxTokens = options.max_tokens || 1024;

    try {
      const payload = {
        model: model,
        prompt: prompt,
        stream: true,
        options: {
          temperature: temperature,
          num_predict: maxTokens
        }
      };

      // Use curl with streaming
      const { stdout } = await execAsync(`
        curl -s -X POST ${this.ollamaBaseUrl}/api/generate \
        -H "Content-Type: application/json" \
        -d '${JSON.stringify(payload)}'
      `);

      // Parse streaming response
      const lines = stdout.split('\n').filter(line => line.trim());
      let fullResponse = '';
      let inputTokens = this.estimateTokens(prompt);

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.response) {
            fullResponse += data.response;
            if (onChunk) {
              onChunk(data.response);
            }
          }
          if (data.done) {
            break;
          }
        } catch (e) {
          // Skip invalid JSON lines
          continue;
        }
      }

      const duration = Date.now() - startTime;
      const outputTokens = this.estimateTokens(fullResponse);
      const tokensPerSecond = outputTokens / (duration / 1000);

      // Record usage
      const usageId = randomUUID();
      db.prepare(`
        INSERT INTO direct_gpu_usage (
          id, model, prompt, response, input_tokens, output_tokens, total_tokens,
          duration_ms, cost_usd
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        usageId,
        model,
        prompt.substring(0, 1000),
        fullResponse.substring(0, 2000),
        inputTokens,
        outputTokens,
        inputTokens + outputTokens,
        duration,
        0.0
      );

      return {
        response: fullResponse,
        model: model,
        tokens: {
          input: inputTokens,
          output: outputTokens,
          total: inputTokens + outputTokens
        },
        performance: {
          duration_ms: duration,
          tokens_per_second: tokensPerSecond
        },
        cost_usd: 0.0
      };

    } catch (error) {
      console.error('Direct GPU streaming error:', error);
      throw new Error(`GPU streaming failed: ${error.message}`);
    }
  }

  // Get GPU statistics
  async getGPUStats() {
    try {
      // Try nvidia-smi first
      const { stdout } = await execAsync('nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu --format=csv,noheader,nounits');
      const [utilization, memoryUsed, memoryTotal, temperature] = stdout.trim().split(', ');
      
      return {
        utilization: parseFloat(utilization),
        memoryUsed: parseFloat(memoryUsed),
        memoryTotal: parseFloat(memoryTotal),
        temperature: parseFloat(temperature),
        source: 'nvidia-smi'
      };
    } catch (error) {
      console.log('nvidia-smi not available, using fallback stats');
      // Fallback: return basic stats without nvidia-smi
      return {
        utilization: 0,
        memoryUsed: 0,
        memoryTotal: 0,
        temperature: 0,
        source: 'fallback',
        status: 'GPU available but nvidia-smi not found'
      };
    }
  }

  // Estimate token count (rough approximation)
  estimateTokens(text) {
    // Rough estimate: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  // Update model performance metrics
  updateModelPerformance(model, taskType, tokensPerSecond, gpuStats) {
    try {
      const existing = db.prepare(`
        SELECT * FROM model_performance WHERE model = ? AND task_type = ?
      `).get(model, taskType);

      if (existing) {
        // Update existing record
        const newTotalRequests = existing.total_requests + 1;
        const newAvgSpeed = ((existing.avg_speed_tokens_per_sec * existing.total_requests) + tokensPerSecond) / newTotalRequests;
        const newAvgGpuUtil = ((existing.avg_gpu_utilization * existing.total_requests) + gpuStats.utilization) / newTotalRequests;
        const newAvgMemory = ((existing.avg_memory_usage_mb * existing.total_requests) + gpuStats.memoryUsed) / newTotalRequests;

        db.prepare(`
          UPDATE model_performance SET
            avg_speed_tokens_per_sec = ?,
            avg_gpu_utilization = ?,
            avg_memory_usage_mb = ?,
            total_requests = ?,
            last_updated = datetime('now')
          WHERE id = ?
        `).run(newAvgSpeed, newAvgGpuUtil, newAvgMemory, newTotalRequests, existing.id);
      } else {
        // Create new record
        const id = randomUUID();
        db.prepare(`
          INSERT INTO model_performance (
            id, model, task_type, avg_speed_tokens_per_sec, avg_gpu_utilization,
            avg_memory_usage_mb, success_rate, total_requests
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, model, taskType, tokensPerSecond, gpuStats.utilization, gpuStats.memoryUsed, 1.0, 1);
      }
    } catch (error) {
      console.error('Error updating model performance:', error);
    }
  }

  // Get usage statistics
  getUsageStats(days = 7) {
    try {
      const stats = db.prepare(`
        SELECT 
          model,
          COUNT(*) as total_requests,
          AVG(duration_ms) as avg_duration,
          AVG(tokens_per_second) as avg_speed,
          AVG(gpu_utilization) as avg_gpu_util,
          AVG(memory_used_mb) as avg_memory,
          SUM(total_tokens) as total_tokens,
          SUM(cost_usd) as total_cost
        FROM direct_gpu_usage
        WHERE created_at >= datetime('now', '-${days} days')
        GROUP BY model
        ORDER BY total_requests DESC
      `).all();

      return stats;
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return [];
    }
  }

  // Get recent activity
  getRecentActivity(limit = 20) {
    try {
      return db.prepare(`
        SELECT model, prompt, response, input_tokens, output_tokens, duration_ms, gpu_utilization, created_at
        FROM direct_gpu_usage
        ORDER BY created_at DESC
        LIMIT ?
      `).all(limit);
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }
}

// Singleton instance
export const directGPU = new DirectGPU();
