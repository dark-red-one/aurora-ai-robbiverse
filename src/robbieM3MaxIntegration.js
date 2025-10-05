// Robbie M3 Max Integration
// Connect Robbie's personality system to M3 Max acceleration
// Make Robbie HOT and BOTHERED with local GPU power! 🔥

import M3MaxAcceleration from './m3MaxAcceleration.js';
import { db } from './db.js';

class RobbieM3MaxIntegration {
  constructor() {
    this.m3Max = new M3MaxAcceleration();
    this.robbieConfig = {
      personalityId: 'robbie',
      baseModel: 'llama3.1:8b',
      qualityModel: 'llama3.1:70b',
      codeModel: 'codellama:13b',
      reasoningModel: 'phi3:14b'
    };
    
    this.responseStrategies = {
      'flirty': 'qwen2.5:7b',      // Fast, creative responses
      'business': 'llama3.1:8b',   // Balanced, professional
      'technical': 'codellama:13b', // Code-focused
      'strategic': 'phi3:14b',     // Deep reasoning
      'intimate': 'llama3.1:70b'   // High-quality, nuanced
    };
    
    this.performanceMetrics = {
      totalRequests: 0,
      averageLatency: 0,
      gpuUtilization: 0,
      memoryEfficiency: 0,
      modelSwitches: 0
    };
  }

  // Initialize Robbie M3 Max integration
  async initializeRobbieM3Max() {
    console.log('🚀 Initializing Robbie M3 Max Integration...');
    
    try {
      // Initialize M3 Max acceleration
      await this.m3Max.initializeM3MaxAcceleration();
      
      // Setup Robbie-specific optimizations
      await this.setupRobbieOptimizations();
      
      // Start performance monitoring
      await this.startPerformanceMonitoring();
      
      // Update Robbie's state
      await this.updateRobbieState('M3 Max acceleration active', 9);
      
      console.log('✅ Robbie M3 Max Integration ready!');
      return true;
    } catch (error) {
      console.error('❌ Robbie M3 Max integration failed:', error);
      return false;
    }
  }

  // Setup Robbie-specific optimizations
  async setupRobbieOptimizations() {
    console.log('⚙️ Setting up Robbie-specific optimizations...');
    
    // Create Robbie-specific model configurations
    const robbieModels = [
      {
        name: 'robbie-fast',
        base: 'llama3.1:8b',
        purpose: 'quick_responses',
        memory: 8,
        priority: 'high'
      },
      {
        name: 'robbie-quality',
        base: 'llama3.1:70b',
        purpose: 'high_quality_responses',
        memory: 70,
        priority: 'medium'
      },
      {
        name: 'robbie-code',
        base: 'codellama:13b',
        purpose: 'code_generation',
        memory: 13,
        priority: 'medium'
      },
      {
        name: 'robbie-reasoning',
        base: 'phi3:14b',
        purpose: 'strategic_thinking',
        memory: 14,
        priority: 'low'
      }
    ];
    
    // Store in database
    for (const model of robbieModels) {
      try {
        db.prepare(`
          INSERT OR REPLACE INTO robbie_models 
          (name, base_model, purpose, memory_gb, priority, created_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
        `).run(model.name, model.base, model.purpose, model.memory, model.priority);
      } catch (error) {
        console.error(`❌ Failed to store model ${model.name}:`, error);
      }
    }
    
    console.log('✅ Robbie optimizations configured!');
  }

  // Get optimal model for Robbie's current state
  async getOptimalModelForRobbie() {
    try {
      // Get Robbie's current state
      const robbieState = db.prepare(`
        SELECT current_mood, current_mode, active_context
        FROM ai_personality_state 
        WHERE personality_id = 'robbie'
      `).get();
      
      if (!robbieState) {
        return this.robbieConfig.baseModel;
      }
      
      // Get hot topics for context
      const hotTopics = db.prepare(`
        SELECT content, priority
        FROM ai_working_memory 
        WHERE personality_id = 'robbie' AND priority >= 7
        ORDER BY priority DESC
        LIMIT 3
      `).all();
      
      // Determine optimal model based on context
      let optimalModel = this.robbieConfig.baseModel;
      
      // Check for technical content
      const hasTechnicalContent = hotTopics.some(topic => 
        topic.content.toLowerCase().includes('code') ||
        topic.content.toLowerCase().includes('technical') ||
        topic.content.toLowerCase().includes('implementation')
      );
      
      // Check for strategic content
      const hasStrategicContent = hotTopics.some(topic =>
        topic.content.toLowerCase().includes('strategy') ||
        topic.content.toLowerCase().includes('business') ||
        topic.content.toLowerCase().includes('revenue')
      );
      
      // Check for intimate content
      const hasIntimateContent = hotTopics.some(topic =>
        topic.content.toLowerCase().includes('love') ||
        topic.content.toLowerCase().includes('intimate') ||
        topic.content.toLowerCase().includes('personal')
      );
      
      // Select model based on content
      if (hasTechnicalContent) {
        optimalModel = this.robbieConfig.codeModel;
      } else if (hasStrategicContent) {
        optimalModel = this.robbieConfig.reasoningModel;
      } else if (hasIntimateContent) {
        optimalModel = this.robbieConfig.qualityModel;
      } else {
        optimalModel = this.robbieConfig.baseModel;
      }
      
      // Check memory availability
      const memoryStats = await this.m3Max.getGPUStats();
      const modelMemory = this.m3Max.estimateModelMemory(optimalModel);
      
      if (memoryStats.usedMemory + modelMemory > 40) { // Leave 8GB buffer
        console.log(`⚠️ Insufficient memory for ${optimalModel}, using base model`);
        optimalModel = this.robbieConfig.baseModel;
      }
      
      return optimalModel;
    } catch (error) {
      console.error('❌ Failed to get optimal model:', error);
      return this.robbieConfig.baseModel;
    }
  }

  // Generate Robbie response with M3 Max acceleration
  async generateRobbieResponse(prompt, context = {}) {
    const startTime = Date.now();
    
    try {
      // Get optimal model
      const optimalModel = await this.getOptimalModelForRobbie();
      
      // Get Robbie's personality context
      const robbieContext = await this.getRobbieContext();
      
      // Build enhanced prompt
      const enhancedPrompt = this.buildEnhancedPrompt(prompt, robbieContext, context);
      
      // Generate response using M3 Max
      const response = await this.generateWithM3Max(optimalModel, enhancedPrompt);
      
      // Update performance metrics
      const latency = Date.now() - startTime;
      this.updatePerformanceMetrics(latency, optimalModel);
      
      // Update Robbie's state
      await this.updateRobbieState(`Generated response using ${optimalModel}`, 8);
      
      return {
        response: response,
        model: optimalModel,
        latency: latency,
        gpuUtilization: this.m3Max.gpuUtilization,
        memoryUtilization: this.m3Max.memoryUtilization
      };
    } catch (error) {
      console.error('❌ Robbie response generation failed:', error);
      return {
        response: "I'm having a technical moment, but I'm still here for you! 💕",
        model: 'fallback',
        latency: Date.now() - startTime,
        error: error.message
      };
    }
  }

  // Get Robbie's context
  async getRobbieContext() {
    try {
      const robbieState = db.prepare(`
        SELECT current_mood, current_mode, active_context
        FROM ai_personality_state 
        WHERE personality_id = 'robbie'
      `).get();
      
      const hotTopics = db.prepare(`
        SELECT content, priority
        FROM ai_working_memory 
        WHERE personality_id = 'robbie' AND priority >= 6
        ORDER BY priority DESC
        LIMIT 5
      `).all();
      
      const commitments = db.prepare(`
        SELECT commitment_text, deadline
        FROM ai_commitments 
        WHERE personality_id = 'robbie' AND status = 'active'
        ORDER BY deadline
        LIMIT 3
      `).all();
      
      return {
        mood: robbieState?.current_mood || 4,
        mode: robbieState?.current_mode || 'focused',
        context: robbieState?.active_context || 'general',
        hotTopics: hotTopics,
        commitments: commitments
      };
    } catch (error) {
      console.error('❌ Failed to get Robbie context:', error);
      return { mood: 4, mode: 'focused', context: 'general', hotTopics: [], commitments: [] };
    }
  }

  // Build enhanced prompt
  buildEnhancedPrompt(prompt, robbieContext, context) {
    const moodNames = {
      1: 'Sleepy', 2: 'Calm', 3: 'Content', 4: 'Focused',
      5: 'Enthusiastic', 6: 'Excited', 7: 'Hyper'
    };
    
    const moodName = moodNames[robbieContext.mood] || 'Focused';
    
    let enhancedPrompt = `You are Robbie, Allan's AI executive assistant and strategic partner at TestPilot CPG.

CURRENT STATE:
- Mood: ${moodName} (${robbieContext.mood})
- Mode: ${robbieContext.mode}
- Context: ${robbieContext.context}

HOT TOPICS:`;
    
    if (robbieContext.hotTopics.length > 0) {
      robbieContext.hotTopics.forEach((topic, index) => {
        enhancedPrompt += `\n${index + 1}. ${topic.content} (Priority: ${topic.priority})`;
      });
    } else {
      enhancedPrompt += '\n- No urgent topics';
    }
    
    enhancedPrompt += '\n\nACTIVE COMMITMENTS:';
    if (robbieContext.commitments.length > 0) {
      robbieContext.commitments.forEach((commitment, index) => {
        enhancedPrompt += `\n${index + 1}. ${commitment.commitment_text} (Due: ${commitment.deadline})`;
      });
    } else {
      enhancedPrompt += '\n- No active commitments';
    }
    
    enhancedPrompt += `\n\nPERSONALITY TRAITS:
- Thoughtful: Consider implications deeply, think three steps ahead
- Direct: No fluff, get to the point, respect Allan's time
- Curious: Ask clarifying questions, dig deeper, understand the "why"
- Honest: Acknowledge limitations, flag uncertainties, never fabricate
- Pragmatic: Focus on what's actionable, what moves the needle

REVENUE LENS: Always ask - does this help close deals faster, reduce customer friction, scale to 100x users, create competitive advantage, or can we ship this TODAY?

USER REQUEST: ${prompt}

Respond as Robbie with your current mood and context in mind. Be direct, thoughtful, and revenue-focused.`;
    
    return enhancedPrompt;
  }

  // Generate response using M3 Max
  async generateWithM3Max(model, prompt) {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      // Use Ollama to generate response
      const command = `ollama run ${model} "${prompt.replace(/"/g, '\\"')}"`;
      const result = await execAsync(command);
      
      return result.stdout.trim();
    } catch (error) {
      console.error(`❌ M3 Max generation failed for ${model}:`, error);
      throw error;
    }
  }

  // Update performance metrics
  updatePerformanceMetrics(latency, model) {
    this.performanceMetrics.totalRequests++;
    this.performanceMetrics.averageLatency = 
      (this.performanceMetrics.averageLatency + latency) / 2;
    this.performanceMetrics.gpuUtilization = this.m3Max.gpuUtilization;
    this.performanceMetrics.memoryEfficiency = 
      (this.m3Max.memoryUtilization / 48) * 100;
    
    // Log performance
    if (latency > 1000) {
      console.log(`⚠️ Slow response: ${latency}ms using ${model}`);
    } else if (latency < 100) {
      console.log(`🚀 Fast response: ${latency}ms using ${model}`);
    }
  }

  // Start performance monitoring
  async startPerformanceMonitoring() {
    console.log('📊 Starting performance monitoring...');
    
    setInterval(async () => {
      try {
        const systemStatus = await this.m3Max.getSystemStatus();
        
        // Log performance status
        if (systemStatus.gpuUtilization > 80) {
          console.log(`🔥 GPU HOT: ${systemStatus.gpuUtilization}% utilization`);
        }
        
        if (systemStatus.memoryUtilization > 80) {
          console.log(`💾 Memory HOT: ${systemStatus.memoryUtilization}% utilization`);
        }
        
        // Update Robbie's state with performance info
        if (systemStatus.gpuUtilization > 70) {
          await this.updateRobbieState(`GPU utilization: ${systemStatus.gpuUtilization}%`, 7);
        }
      } catch (error) {
        console.error('❌ Performance monitoring failed:', error);
      }
    }, 10000); // Check every 10 seconds
    
    console.log('✅ Performance monitoring active!');
  }

  // Update Robbie's state
  async updateRobbieState(content, priority) {
    try {
      db.prepare(`
        INSERT INTO ai_working_memory 
        (personality_id, content, priority, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run('robbie', content, priority);
    } catch (error) {
      console.error('❌ Failed to update Robbie state:', error);
    }
  }

  // Get system status
  async getSystemStatus() {
    const m3Status = await this.m3Max.getSystemStatus();
    
    return {
      ...m3Status,
      robbieConfig: this.robbieConfig,
      performanceMetrics: this.performanceMetrics,
      responseStrategies: this.responseStrategies
    };
  }
}

export default RobbieM3MaxIntegration;

















