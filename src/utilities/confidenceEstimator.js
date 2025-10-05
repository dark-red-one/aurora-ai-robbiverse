import { db } from "./db.js";
import { randomUUID } from "crypto";

// Confidence-Based Estimation System
export class ConfidenceEstimator {
  constructor() {
    this.initializeTables();
  }

  initializeTables() {
    // Estimation history table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS estimation_history (
        id TEXT PRIMARY KEY,
        work_type TEXT NOT NULL,
        complexity_score REAL NOT NULL,
        estimated_duration_minutes INTEGER NOT NULL,
        actual_duration_minutes INTEGER,
        estimated_cost_usd REAL NOT NULL,
        actual_cost_usd REAL,
        estimated_tokens INTEGER NOT NULL,
        actual_tokens INTEGER,
        confidence_score REAL NOT NULL,
        confidence_level TEXT NOT NULL,
        estimation_factors TEXT, -- JSON array of factors
        accuracy_score REAL, -- How close the estimate was
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Model performance by task type
    db.prepare(`
      CREATE TABLE IF NOT EXISTS model_performance (
        id TEXT PRIMARY KEY,
        model_name TEXT NOT NULL,
        task_type TEXT NOT NULL,
        avg_accuracy REAL NOT NULL,
        avg_speed REAL NOT NULL,
        avg_cost REAL NOT NULL,
        success_rate REAL NOT NULL,
        sample_size INTEGER NOT NULL,
        last_updated TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Indexes
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_estimation_work_type ON estimation_history(work_type, confidence_score)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_model_performance_task ON model_performance(task_type, avg_accuracy)`).run();
  }

  // Estimate work with confidence scoring
  async estimateWork(workType, description, complexityFactors = {}) {
    try {
      // Calculate complexity score (0-100)
      const complexityScore = this.calculateComplexity(workType, description, complexityFactors);
      
      // Get historical data for similar work
      const historicalData = this.getHistoricalData(workType, complexityScore);
      
      // Calculate base estimates
      const baseEstimate = this.calculateBaseEstimate(workType, complexityScore, historicalData);
      
      // Calculate confidence score
      const confidenceScore = this.calculateConfidence(workType, complexityScore, historicalData);
      
      // Determine confidence level and language
      const confidenceLevel = this.getConfidenceLevel(confidenceScore);
      const confidenceLanguage = this.getConfidenceLanguage(confidenceScore);
      
      // Select optimal model
      const recommendedModel = this.selectOptimalModel(workType, complexityScore, confidenceScore);
      
      // Calculate estimates with confidence ranges
      const estimates = this.calculateConfidenceRanges(baseEstimate, confidenceScore);
      
      return {
        workType,
        complexityScore,
        confidenceScore,
        confidenceLevel,
        confidenceLanguage,
        recommendedModel,
        estimates,
        factors: this.getEstimationFactors(workType, complexityScore, historicalData)
      };
    } catch (error) {
      console.error('Estimation error:', error);
      return this.getFallbackEstimate(workType);
    }
  }

  calculateComplexity(workType, description, factors) {
    let score = 50; // Base complexity
    
    // Work type complexity
    const typeComplexity = {
      'pdf': 60,
      'analysis': 80,
      'research': 90,
      'strategy': 85,
      'copy': 40,
      'design': 70,
      'code': 75,
      'presentation': 55
    };
    
    score = typeComplexity[workType] || 50;
    
    // Description length factor
    if (description.length > 500) score += 10;
    if (description.length > 1000) score += 15;
    
    // Complexity factors
    if (factors.requiresResearch) score += 20;
    if (factors.requiresExternalData) score += 15;
    if (factors.requiresMultipleIterations) score += 10;
    if (factors.requiresSpecializedKnowledge) score += 25;
    if (factors.requiresClientFeedback) score += 5;
    
    // Urgency factor (higher urgency = lower complexity for estimation)
    if (factors.urgent) score -= 10;
    
    return Math.max(10, Math.min(100, score));
  }

  getHistoricalData(workType, complexityScore) {
    try {
      const data = db.prepare(`
        SELECT 
          AVG(estimated_duration_minutes) as avg_duration,
          AVG(actual_duration_minutes) as avg_actual_duration,
          AVG(estimated_cost_usd) as avg_cost,
          AVG(actual_cost_usd) as avg_actual_cost,
          AVG(estimated_tokens) as avg_tokens,
          AVG(actual_tokens) as avg_actual_tokens,
          AVG(accuracy_score) as avg_accuracy,
          COUNT(*) as sample_size
        FROM estimation_history
        WHERE work_type = ? 
        AND complexity_score BETWEEN ? AND ?
        AND actual_duration_minutes IS NOT NULL
      `).get(workType, complexityScore - 20, complexityScore + 20);
      
      return data || { sample_size: 0 };
    } catch (error) {
      console.error('Error getting historical data:', error);
      return { sample_size: 0 };
    }
  }

  calculateBaseEstimate(workType, complexityScore, historicalData) {
    // Base estimates by work type and complexity
    const baseEstimates = {
      'pdf': {
        duration: Math.round(complexityScore * 0.8), // 8-80 minutes
        cost: complexityScore * 0.3, // $3-30
        tokens: Math.round(complexityScore * 15) // 150-1500 tokens
      },
      'analysis': {
        duration: Math.round(complexityScore * 1.2), // 12-120 minutes
        cost: complexityScore * 0.5, // $5-50
        tokens: Math.round(complexityScore * 25) // 250-2500 tokens
      },
      'research': {
        duration: Math.round(complexityScore * 1.5), // 15-150 minutes
        cost: complexityScore * 0.7, // $7-70
        tokens: Math.round(complexityScore * 30) // 300-3000 tokens
      },
      'strategy': {
        duration: Math.round(complexityScore * 1.3), // 13-130 minutes
        cost: complexityScore * 0.6, // $6-60
        tokens: Math.round(complexityScore * 20) // 200-2000 tokens
      }
    };
    
    const base = baseEstimates[workType] || baseEstimates['analysis'];
    
    // Adjust based on historical data if available
    if (historicalData.sample_size > 0) {
      return {
        duration: Math.round((base.duration + historicalData.avg_actual_duration) / 2),
        cost: (base.cost + historicalData.avg_actual_cost) / 2,
        tokens: Math.round((base.tokens + historicalData.avg_actual_tokens) / 2)
      };
    }
    
    return base;
  }

  calculateConfidence(workType, complexityScore, historicalData) {
    let confidence = 50; // Base confidence
    
    // Historical data confidence boost
    if (historicalData.sample_size > 10) confidence += 20;
    else if (historicalData.sample_size > 5) confidence += 15;
    else if (historicalData.sample_size > 0) confidence += 10;
    
    // Complexity confidence (moderate complexity is most predictable)
    if (complexityScore >= 40 && complexityScore <= 70) confidence += 10;
    else if (complexityScore < 30 || complexityScore > 80) confidence -= 15;
    
    // Work type confidence
    const typeConfidence = {
      'pdf': 15,
      'analysis': 10,
      'research': 5,
      'strategy': 8,
      'copy': 20,
      'design': 12,
      'code': 8,
      'presentation': 18
    };
    
    confidence += typeConfidence[workType] || 0;
    
    // Historical accuracy boost
    if (historicalData.avg_accuracy > 0.8) confidence += 15;
    else if (historicalData.avg_accuracy > 0.6) confidence += 10;
    else if (historicalData.avg_accuracy > 0.4) confidence += 5;
    
    return Math.max(10, Math.min(95, confidence)); // Never claim 100% confidence
  }

  getConfidenceLevel(confidenceScore) {
    if (confidenceScore >= 90) return 'very_high';
    if (confidenceScore >= 80) return 'high';
    if (confidenceScore >= 70) return 'good';
    if (confidenceScore >= 60) return 'moderate';
    if (confidenceScore >= 50) return 'fair';
    return 'low';
  }

  getConfidenceLanguage(confidenceScore) {
    if (confidenceScore >= 90) return "I'm pretty sure";
    if (confidenceScore >= 80) return "I'd bet";
    if (confidenceScore >= 70) return "I'm confident";
    if (confidenceScore >= 60) return "I believe";
    if (confidenceScore >= 50) return "My intuition suggests";
    return "This is an educated guess";
  }

  selectOptimalModel(workType, complexityScore, confidenceScore) {
    // Model selection based on task type and confidence requirements
    const modelRecommendations = {
      'pdf': {
        high_confidence: 'llama-maverick', // Better for structured output
        medium_confidence: 'qwen-local',
        low_confidence: 'qwen-local' // Fallback to local
      },
      'analysis': {
        high_confidence: 'llama-maverick', // Better reasoning
        medium_confidence: 'llama-maverick',
        low_confidence: 'qwen-local'
      },
      'research': {
        high_confidence: 'llama-maverick', // Better for complex research
        medium_confidence: 'llama-maverick',
        low_confidence: 'qwen-local'
      },
      'strategy': {
        high_confidence: 'llama-maverick', // Strategic thinking
        medium_confidence: 'llama-maverick',
        low_confidence: 'qwen-local'
      }
    };
    
    const confidenceLevel = this.getConfidenceLevel(confidenceScore);
    const recommendations = modelRecommendations[workType] || modelRecommendations['analysis'];
    
    if (confidenceLevel === 'very_high' || confidenceLevel === 'high') {
      return recommendations.high_confidence;
    } else if (confidenceLevel === 'good' || confidenceLevel === 'moderate') {
      return recommendations.medium_confidence;
    } else {
      return recommendations.low_confidence;
    }
  }

  calculateConfidenceRanges(baseEstimate, confidenceScore) {
    // Calculate ranges based on confidence
    const uncertainty = (100 - confidenceScore) / 100;
    
    return {
      duration: {
        min: Math.round(baseEstimate.duration * (1 - uncertainty * 0.3)),
        max: Math.round(baseEstimate.duration * (1 + uncertainty * 0.5)),
        best: baseEstimate.duration
      },
      cost: {
        min: baseEstimate.cost * (1 - uncertainty * 0.2),
        max: baseEstimate.cost * (1 + uncertainty * 0.4),
        best: baseEstimate.cost
      },
      tokens: {
        min: Math.round(baseEstimate.tokens * (1 - uncertainty * 0.2)),
        max: Math.round(baseEstimate.tokens * (1 + uncertainty * 0.4)),
        best: baseEstimate.tokens
      }
    };
  }

  getEstimationFactors(workType, complexityScore, historicalData) {
    const factors = [];
    
    if (historicalData.sample_size > 0) {
      factors.push(`Based on ${historicalData.sample_size} similar projects`);
    }
    
    if (complexityScore > 80) {
      factors.push('High complexity detected');
    } else if (complexityScore < 40) {
      factors.push('Low complexity - straightforward task');
    }
    
    if (historicalData.avg_accuracy > 0.8) {
      factors.push('High historical accuracy');
    }
    
    factors.push(`Work type: ${workType}`);
    
    return factors;
  }

  getFallbackEstimate(workType) {
    return {
      workType,
      complexityScore: 50,
      confidenceScore: 30,
      confidenceLevel: 'low',
      confidenceLanguage: 'This is an educated guess',
      recommendedModel: 'qwen-local',
      estimates: {
        duration: { min: 30, max: 120, best: 60 },
        cost: { min: 5, max: 25, best: 15 },
        tokens: { min: 200, max: 800, best: 400 }
      },
      factors: ['Limited historical data', 'Fallback estimation']
    };
  }

  // Record actual results for learning
  recordActualResults(estimationId, actualDuration, actualCost, actualTokens) {
    try {
      const estimation = db.prepare(`SELECT * FROM estimation_history WHERE id = ?`).get(estimationId);
      if (!estimation) return;
      
      // Calculate accuracy score
      const durationAccuracy = 1 - Math.abs(actualDuration - estimation.estimated_duration_minutes) / estimation.estimated_duration_minutes;
      const costAccuracy = 1 - Math.abs(actualCost - estimation.estimated_cost_usd) / estimation.estimated_cost_usd;
      const tokenAccuracy = 1 - Math.abs(actualTokens - estimation.estimated_tokens) / estimation.estimated_tokens;
      const accuracyScore = (durationAccuracy + costAccuracy + tokenAccuracy) / 3;
      
      // Update estimation with actual results
      db.prepare(`
        UPDATE estimation_history SET
          actual_duration_minutes = ?,
          actual_cost_usd = ?,
          actual_tokens = ?,
          accuracy_score = ?
        WHERE id = ?
      `).run(actualDuration, actualCost, actualTokens, accuracyScore, estimationId);
      
      // Update model performance
      this.updateModelPerformance(estimation.work_type, accuracyScore);
      
    } catch (error) {
      console.error('Error recording actual results:', error);
    }
  }

  updateModelPerformance(workType, accuracyScore) {
    try {
      // This would update model performance metrics
      // Implementation depends on how we track model usage
    } catch (error) {
      console.error('Error updating model performance:', error);
    }
  }
}

// Singleton instance
export const confidenceEstimator = new ConfidenceEstimator();
