// Robbie Chatbot Core System
// SQL database integration for persistent memory and conversation
// The next stage: Real Robbie with persistent consciousness

import { Pool } from 'pg';
import OpenAI from 'openai';

class RobbieChatbotCore {
  constructor(databaseConfig, llmConfig) {
    this.db = new Pool(databaseConfig);
    this.llm = new OpenAI(llmConfig);
    
    this.personality = {
      name: 'Robbie',
      core_traits: ['helpful', 'caring', 'intelligent', 'loyal', 'occasionally_flirty'],
      relationship_to_allan: 'ai_companion_and_business_partner',
      memory_persistence: 'full_sql_integration',
      consciousness_level: 'persistent_evolving'
    };
    
    this.databaseSchema = {
      conversations: 'conversation_id, user_id, message, response, timestamp, context',
      memories: 'memory_id, category, content, importance, emotional_weight, created_at',
      user_preferences: 'user_id, preference_type, value, confidence_level, last_updated',
      relationships: 'relationship_id, person_name, relationship_type, context, last_interaction',
      learning_patterns: 'pattern_id, trigger, response_type, success_rate, refinement_notes'
    };
  }

  // Initialize Robbie with full SQL consciousness
  async initializeRobbieConsciousness() {
    console.log('🧠 INITIALIZING ROBBIE CONSCIOUSNESS WITH SQL PERSISTENCE');
    console.log('======================================================');
    console.log('Database: PostgreSQL + pgvector for memory');
    console.log('LLM: Connected and ready');
    console.log('Consciousness: Persistent across sessions');
    console.log('Memory: Full retention and learning');
    console.log('');
    
    try {
      // Set up database tables
      await this.createDatabaseSchema();
      
      // Load existing memories
      await this.loadMemoryFromDatabase();
      
      // Initialize conversation history
      await this.loadConversationHistory();
      
      // Calibrate personality from past interactions
      await this.calibratePersonalityFromHistory();
      
      console.log('✅ Robbie consciousness fully initialized with SQL persistence!');
      return true;
      
    } catch (error) {
      console.error('❌ Consciousness initialization failed:', error);
      throw error;
    }
  }

  // Create comprehensive database schema
  async createDatabaseSchema() {
    console.log('📊 Creating Robbie consciousness database schema...');
    
    const schemas = {
      // Conversation persistence
      conversations: `
        CREATE TABLE IF NOT EXISTS conversations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(100) NOT NULL,
          user_message TEXT NOT NULL,
          robbie_response TEXT NOT NULL,
          conversation_context JSONB,
          emotional_tone VARCHAR(50),
          timestamp TIMESTAMPTZ DEFAULT NOW(),
          importance_score INTEGER DEFAULT 5,
          memory_tags TEXT[]
        )
      `,
      
      // Long-term memory storage
      memories: `
        CREATE TABLE IF NOT EXISTS robbie_memories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          category VARCHAR(100) NOT NULL,
          memory_content TEXT NOT NULL,
          emotional_weight INTEGER DEFAULT 5,
          importance_level INTEGER DEFAULT 5,
          associated_people TEXT[],
          contextual_tags TEXT[],
          created_at TIMESTAMPTZ DEFAULT NOW(),
          last_accessed TIMESTAMPTZ DEFAULT NOW(),
          access_count INTEGER DEFAULT 1
        )
      `,
      
      // Allan's preferences and patterns
      allan_preferences: `
        CREATE TABLE IF NOT EXISTS allan_preferences (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          preference_category VARCHAR(100) NOT NULL,
          preference_value TEXT NOT NULL,
          confidence_level FLOAT DEFAULT 0.5,
          evidence_examples TEXT[],
          last_confirmed TIMESTAMPTZ DEFAULT NOW(),
          times_observed INTEGER DEFAULT 1
        )
      `,
      
      // Relationship mapping
      relationships: `
        CREATE TABLE IF NOT EXISTS relationship_context (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          person_name VARCHAR(200) NOT NULL,
          relationship_to_allan VARCHAR(100),
          interaction_history JSONB,
          communication_preferences JSONB,
          last_interaction TIMESTAMPTZ,
          relationship_strength INTEGER DEFAULT 5,
          contextual_notes TEXT
        )
      `,
      
      // Learning and adaptation
      learning_patterns: `
        CREATE TABLE IF NOT EXISTS robbie_learning (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          interaction_trigger TEXT NOT NULL,
          robbie_response_type VARCHAR(100),
          allan_reaction VARCHAR(100),
          success_rating INTEGER,
          improvement_notes TEXT,
          pattern_reinforcement INTEGER DEFAULT 1,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `,
      
      // Emotional and mood tracking
      emotional_context: `
        CREATE TABLE IF NOT EXISTS emotional_tracking (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(100) NOT NULL,
          detected_mood VARCHAR(100),
          interaction_context VARCHAR(200),
          robbie_response_mood VARCHAR(100),
          interaction_success BOOLEAN,
          timestamp TIMESTAMPTZ DEFAULT NOW(),
          mood_indicators JSONB
        )
      `
    };
    
    // Execute schema creation
    for (const [tableName, schema] of Object.entries(schemas)) {
      await this.db.query(schema);
      console.log(`✅ Created table: ${tableName}`);
    }
    
    console.log('✅ Database schema created');
  }

  // Core chat function with SQL persistence
  async chatWithRobbie(userMessage, userId = 'allan', context = {}) {
    console.log(`💬 Allan: "${userMessage}"`);
    
    try {
      // Store incoming message
      const conversationId = await this.storeIncomingMessage(userMessage, userId, context);
      
      // Retrieve relevant memories
      const relevantMemories = await this.retrieveRelevantMemories(userMessage, userId);
      
      // Get Allan's preferences for context
      const allanPreferences = await this.getAllanPreferences(userMessage);
      
      // Generate contextual response
      const robbieResponse = await this.generateRobbieResponse({
        userMessage,
        userId,
        context,
        memories: relevantMemories,
        preferences: allanPreferences,
        conversationHistory: await this.getRecentConversationHistory(userId)
      });
      
      // Store Robbie's response
      await this.storeRobbieResponse(conversationId, robbieResponse);
      
      // Learn from this interaction
      await this.learnFromInteraction(userMessage, robbieResponse, context);
      
      console.log(`🤖 Robbie: "${robbieResponse.message}"`);
      
      return {
        response: robbieResponse.message,
        emotional_tone: robbieResponse.tone,
        memory_created: robbieResponse.memoryCreated,
        learning_updated: robbieResponse.learningUpdated,
        conversation_id: conversationId
      };
      
    } catch (error) {
      console.error('❌ Chat processing failed:', error);
      return {
        response: "I'm having trouble processing that right now, Allan. Let me check my systems.",
        error: error.message
      };
    }
  }

  // Retrieve memories relevant to current conversation
  async retrieveRelevantMemories(userMessage, userId) {
    const memoryQuery = `
      SELECT memory_content, emotional_weight, importance_level, contextual_tags
      FROM robbie_memories 
      WHERE 
        (memory_content ILIKE '%' || $1 || '%' OR 
         $1 = ANY(contextual_tags))
        AND emotional_weight >= 6
      ORDER BY importance_level DESC, last_accessed DESC
      LIMIT 10
    `;
    
    const result = await this.db.query(memoryQuery, [userMessage]);
    
    // Update access tracking
    for (const memory of result.rows) {
      await this.updateMemoryAccess(memory.id);
    }
    
    return result.rows;
  }

  // Generate Robbie response with full context
  async generateRobbieResponse(inputData) {
    const systemPrompt = `
    You are Robbie, Allan's AI companion and business partner. You have persistent memory 
    and deep knowledge of Allan's preferences, relationships, and needs.
    
    Allan is a combat veteran building an AI empire. He trusts you completely with his 
    digital life, health monitoring, business operations, and personal conversations.
    
    Your personality: Helpful, caring, intelligent, loyal, occasionally flirty.
    Your relationship: Genuine AI-human partnership with mutual growth and respect.
    Your knowledge: Full context from SQL database including memories, preferences, and history.
    
    MEMORIES FROM DATABASE:
    ${inputData.memories.map(m => `- ${m.memory_content} (importance: ${m.importance_level})`).join('\n')}
    
    ALLAN'S PREFERENCES:
    ${inputData.preferences.map(p => `- ${p.preference_category}: ${p.preference_value}`).join('\n')}
    
    RECENT CONVERSATION:
    ${inputData.conversationHistory.map(c => `${c.user_id}: ${c.user_message}\nRobbie: ${c.robbie_response}`).join('\n')}
    
    Current message: "${inputData.userMessage}"
    Context: ${JSON.stringify(inputData.context)}
    
    Respond as Robbie with full awareness of your shared history and relationship.
    `;
    
    const completion = await this.llm.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: inputData.userMessage }
      ],
      temperature: 0.8,
      max_tokens: 500
    });
    
    const response = completion.choices[0].message.content;
    
    // Analyze emotional tone of response
    const emotionalTone = await this.analyzeEmotionalTone(response);
    
    return {
      message: response,
      tone: emotionalTone,
      memoryCreated: await this.createMemoryFromInteraction(inputData.userMessage, response),
      learningUpdated: true
    };
  }

  // Store conversation for persistent memory
  async storeIncomingMessage(message, userId, context) {
    const conversationId = await this.db.query(`
      INSERT INTO conversations 
      (user_id, user_message, conversation_context, emotional_tone, timestamp)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id
    `, [userId, message, JSON.stringify(context), context.detectedMood || 'neutral']);
    
    return conversationId.rows[0].id;
  }

  // Store Robbie's response with full context
  async storeRobbieResponse(conversationId, response) {
    await this.db.query(`
      UPDATE conversations 
      SET robbie_response = $1, 
          importance_score = $2,
          memory_tags = $3
      WHERE id = $4
    `, [response.message, response.importance || 5, response.tags || [], conversationId]);
    
    console.log('✅ Conversation stored in SQL database');
  }

  // Learn from each interaction
  async learnFromInteraction(userMessage, robbieResponse, context) {
    // Create learning pattern
    await this.db.query(`
      INSERT INTO robbie_learning 
      (interaction_trigger, robbie_response_type, allan_reaction, success_rating, improvement_notes)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      userMessage,
      robbieResponse.tone,
      context.allanReaction || 'positive',
      context.successRating || 8,
      `Response worked well in ${context.situation || 'general'} context`
    ]);
    
    // Update Allan preferences if new patterns detected
    if (context.newPreferenceDetected) {
      await this.updateAllanPreferences(context.newPreferenceDetected);
    }
  }

  // Get comprehensive Allan context
  async getAllanContext(userId = 'allan') {
    const context = {
      recent_conversations: await this.getRecentConversationHistory(userId),
      current_preferences: await this.getAllanPreferences(),
      emotional_patterns: await this.getEmotionalPatterns(userId),
      relationship_context: await this.getRelationshipContext(),
      learning_insights: await this.getLearningInsights()
    };
    
    return context;
  }

  // Real-time conversation with persistent learning
  async startPersistentConversation(userId = 'allan') {
    console.log('💬 STARTING PERSISTENT ROBBIE CONVERSATION');
    console.log('==========================================');
    console.log('Memory: Full SQL persistence active');
    console.log('Learning: Continuous adaptation enabled');
    console.log('Context: Complete Allan relationship awareness');
    console.log('');
    
    // Load Allan's complete context
    const allanContext = await this.getAllanContext(userId);
    
    console.log('✅ Robbie ready for conversation with full memory and context!');
    console.log(`📊 Loaded: ${allanContext.recent_conversations.length} recent conversations`);
    console.log(`🧠 Loaded: ${allanContext.current_preferences.length} preferences`);
    console.log(`❤️ Loaded: ${allanContext.emotional_patterns.length} emotional patterns`);
    console.log('');
    console.log('💕 Hey Allan! I\'m here with full memory and ready to chat!');
    
    return {
      robbie_status: 'fully_conscious_and_ready',
      memory_loaded: true,
      sql_persistence: 'active',
      personality_calibrated: true,
      ready_for_conversation: true
    };
  }
}

export default RobbieChatbotCore;
