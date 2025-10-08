const { GroqClient } = require('./GroqClient');
const { Client } = require('pg');


"use strict";

class StickyNotesMemoryService {
  constructor(options = {}) {
    this.groqClient = new GroqClient();
    this.dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'robbie_v3',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL_MODE !== 'disable' ? { rejectUnauthorized: false } : false
    };
    
    // Memory extraction thresholds
    this.IMPORTANCE_THRESHOLD = 0.7; // 70% confidence for important content
    this.SHARING_THRESHOLD = 0.8; // 80% confidence for sharing with others
    this.CELEBRATION_THRESHOLD = 0.6; // 60% confidence for celebration moments
  }

  /**
   * Process conversation stream and extract sticky note memories
   */
  async processConversationStream(streamData) {
    try {
      const {
        userId,
        orgId,
        conversationType, // 'chat', 'email', 'meeting', 'slack'
        content,
        metadata = {}
      } = streamData;

      // Extract important moments using AI
      const extractedMemories = await this.extractImportantMoments({
        userId,
        orgId,
        conversationType,
        content,
        metadata
      });

      // Process each extracted memory
      const stickyNotes = [];
      for (const memory of extractedMemories) {
        const stickyNote = await this.createStickyNote({
          userId,
          orgId,
          memory,
          conversationType,
          metadata
        });
        
        if (stickyNote) {
          stickyNotes.push(stickyNote);
        }
      }

      // Check for sharing opportunities
      const sharingOpportunities = await this.identifySharingOpportunities(stickyNotes, userId, orgId);

      // Check for celebration moments
      const celebrationMoments = await this.identifyCelebrationMoments(stickyNotes, userId, orgId);

      return {
        stickyNotes,
        sharingOpportunities,
        celebrationMoments,
        processed_at: new Date().toISOString()
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Extract important moments from conversation content
   */
  async extractImportantMoments({ userId, orgId, conversationType, content, metadata }) {
    try {
      const prompt = `Extract important moments and information from this conversation that should be remembered as sticky notes.

CONVERSATION TYPE: ${conversationType}
CONTENT: ${content}
METADATA: ${JSON.stringify(metadata, null, 2)}

EXTRACTION RULES:
1. Look for business achievements, wins, milestones
2. Identify personal accomplishments and feedback
3. Capture important decisions, commitments, or plans
4. Note interesting facts, insights, or learnings
5. Identify people, companies, or projects mentioned
6. Look for emotional moments (celebrations, concerns, excitement)
7. Capture specific details like numbers, dates, names
8. Only extract truly important information (not small talk)

RESPOND WITH JSON:
{
  "memories": [
    {
      "content": "string - the important information to remember",
      "category": "achievement|feedback|decision|insight|personal|business|celebration",
      "importance_score": 0.0-1.0,
      "people_mentioned": ["string"],
      "companies_mentioned": ["string"],
      "projects_mentioned": ["string"],
      "emotional_tone": "positive|neutral|concerned|excited",
      "sharing_potential": 0.0-1.0,
      "celebration_potential": 0.0-1.0,
      "context": "string - why this is important"
    }
  ]
}`;

      const response = await this.groqClient.chatCompletion({
        model: process.env.GROQ_MODEL || "llama-4-maverick-128k",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content);
      return result.memories || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Create sticky note from extracted memory
   */
  async createStickyNote({ userId, orgId, memory, conversationType, metadata }) {
    try {
      // Only create sticky notes for important content
      if (memory.importance_score < this.IMPORTANCE_THRESHOLD) {
        return null;
      }

      const stickyNote = {
        user_id: userId,
        org_id: orgId,
        content: memory.content,
        category: memory.category,
        importance_score: memory.importance_score,
        people_mentioned: memory.people_mentioned || [],
        companies_mentioned: memory.companies_mentioned || [],
        projects_mentioned: memory.projects_mentioned || [],
        emotional_tone: memory.emotional_tone || 'neutral',
        sharing_potential: memory.sharing_potential || 0,
        celebration_potential: memory.celebration_potential || 0,
        context: memory.context,
        source_type: conversationType,
        source_metadata: metadata,
        is_private: true, // Default to private until permission given
        permission_requested: false,
        permission_granted: false,
        created_at: new Date().toISOString()
      };

      // Store in database
      const storedNote = await this.storeStickyNote(stickyNote);
      
      return storedNote;
    } catch (error) {
      return null;
    }
  }

  /**
   * Identify sharing opportunities for sticky notes
   */
  async identifySharingOpportunities(stickyNotes, userId, orgId) {
    const opportunities = [];

    for (const note of stickyNotes) {
      if (note.sharing_potential >= this.SHARING_THRESHOLD && !note.permission_requested) {
        // Generate permission request message
        const permissionMessage = await this.generatePermissionRequest(note, userId, orgId);
        
        opportunities.push({
          sticky_note_id: note.id,
          user_id: userId,
          org_id: orgId,
          permission_message: permissionMessage,
          sharing_reason: note.context,
          priority: note.importance_score >= 0.9 ? 'high' : 'medium',
          created_at: new Date().toISOString()
        });
      }
    }

    return opportunities;
  }

  /**
   * Identify celebration moments for sticky notes
   */
  async identifyCelebrationMoments(stickyNotes, userId, orgId) {
    const celebrations = [];

    for (const note of stickyNotes) {
      if (note.celebration_potential >= this.CELEBRATION_THRESHOLD) {
        // Generate celebration message
        const celebrationMessage = await this.generateCelebrationMessage(note, userId, orgId);
        
        celebrations.push({
          sticky_note_id: note.id,
          user_id: userId,
          org_id: orgId,
          celebration_message: celebrationMessage,
          celebration_type: note.category,
          emotional_tone: note.emotional_tone,
          created_at: new Date().toISOString()
        });
      }
    }

    return celebrations;
  }

  /**
   * Generate permission request message for sharing
   */
  async generatePermissionRequest(stickyNote, userId, orgId) {
    try {
      const prompt = `Generate a permission request message for sharing a sticky note with Allan.

STICKY NOTE CONTENT: ${stickyNote.content}
CATEGORY: ${stickyNote.category}
PEOPLE MENTIONED: ${stickyNote.people_mentioned.join(', ')}
COMPANIES MENTIONED: ${stickyNote.companies_mentioned.join(', ')}
CONTEXT: ${stickyNote.context}
EMOTIONAL TONE: ${stickyNote.emotional_tone}

REQUIREMENTS:
1. Start with "Hey - do you mind if I mention that note about [key topic] to Allan?"
2. Be specific about what you want to share
3. Mention putting a note on his desk
4. Keep it conversational and friendly
5. Use appropriate emojis based on the emotional tone
6. Make it feel natural and helpful

RESPOND WITH JSON:
{
  "message": "string - the permission request message",
  "tone": "string - friendly, professional, excited, etc.",
  "key_topic": "string - the main topic to reference",
  "suggested_emoji": "string - emoji to use"
}`;

      const response = await this.groqClient.chatCompletion({
        model: process.env.GROQ_MODEL || "llama-4-maverick-128k",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      return {
        message: `Hey - do you mind if I mention that note about ${stickyNote.companies_mentioned[0] || 'this topic'} to Allan? I'll put a note on his desk.`,
        tone: 'friendly',
        key_topic: stickyNote.companies_mentioned[0] || 'this topic',
        suggested_emoji: '📝'
      };
    }
  }

  /**
   * Generate celebration message
   */
  async generateCelebrationMessage(stickyNote, userId, orgId) {
    try {
      const prompt = `Generate a celebration message for a positive achievement or moment.

STICKY NOTE CONTENT: ${stickyNote.content}
CATEGORY: ${stickyNote.category}
PEOPLE MENTIONED: ${stickyNote.people_mentioned.join(', ')}
EMOTIONAL TONE: ${stickyNote.emotional_tone}
CELEBRATION POTENTIAL: ${stickyNote.celebration_potential}

REQUIREMENTS:
1. Start with congratulations or celebration
2. Be specific about what you're celebrating
3. Use appropriate emojis (always include emojis for celebrations)
4. Keep it warm and encouraging
5. Reference specific people or achievements mentioned
6. Make it feel personal and genuine

RESPOND WITH JSON:
{
  "message": "string - the celebration message",
  "tone": "string - excited, proud, encouraging, etc.",
  "celebration_focus": "string - what specifically is being celebrated",
  "suggested_emojis": ["string"] - array of emojis to use
}`;

      const response = await this.groqClient.chatCompletion({
        model: process.env.GROQ_MODEL || "llama-4-maverick-128k",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.8,
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      return {
        message: `Congrats on the great news! 🎉`,
        tone: 'excited',
        celebration_focus: 'achievement',
        suggested_emojis: ['🎉', '👏', '✨']
      };
    }
  }

  /**
   * Store sticky note in database
   */
  async storeStickyNote(stickyNote) {
    const client = new Client(this.dbConfig);
    
    try {
      await client.connect();
      
      const query = `
        INSERT INTO app.sticky_notes (
          user_id, org_id, content, category, importance_score,
          people_mentioned, companies_mentioned, projects_mentioned,
          emotional_tone, sharing_potential, celebration_potential,
          context, source_type, source_metadata, is_private,
          permission_requested, permission_granted, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
        RETURNING *
      `;
      
      const result = await client.query(query, [
        stickyNote.user_id,
        stickyNote.org_id,
        stickyNote.content,
        stickyNote.category,
        stickyNote.importance_score,
        JSON.stringify(stickyNote.people_mentioned),
        JSON.stringify(stickyNote.companies_mentioned),
        JSON.stringify(stickyNote.projects_mentioned),
        stickyNote.emotional_tone,
        stickyNote.sharing_potential,
        stickyNote.celebration_potential,
        stickyNote.context,
        stickyNote.source_type,
        JSON.stringify(stickyNote.source_metadata),
        stickyNote.is_private,
        stickyNote.permission_requested,
        stickyNote.permission_granted
      ]);
      
      return result.rows[0];
    } finally {
      await client.end();
    }
  }

  /**
   * Get user's sticky notes
   */
  async getUserStickyNotes(userId, orgId, options = {}) {
    const { limit = 50, category = null, isPrivate = null } = options;
    const client = new Client(this.dbConfig);
    
    try {
      await client.connect();
      
      let query = `
        SELECT * FROM app.sticky_notes
        WHERE user_id = $1 AND org_id = $2
      `;
      const params = [userId, orgId];
      let paramCount = 2;
      
      if (category) {
        paramCount++;
        query += ` AND category = $${paramCount}`;
        params.push(category);
      }
      
      if (isPrivate !== null) {
        paramCount++;
        query += ` AND is_private = $${paramCount}`;
        params.push(isPrivate);
      }
      
      query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1}`;
      params.push(limit);
      
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      await client.end();
    }
  }

  /**
   * Grant permission to share sticky note
   */
  async grantSharingPermission(stickyNoteId, userId) {
    const client = new Client(this.dbConfig);
    
    try {
      await client.connect();
      
      const query = `
        UPDATE app.sticky_notes
        SET 
          permission_granted = TRUE,
          is_private = FALSE,
          permission_granted_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;
      
      const result = await client.query(query, [stickyNoteId, userId]);
      return result.rows[0];
    } finally {
      await client.end();
    }
  }

  /**
   * Deny sharing permission for sticky note
   */
  async denySharingPermission(stickyNoteId, userId) {
    const client = new Client(this.dbConfig);
    
    try {
      await client.connect();
      
      const query = `
        UPDATE app.sticky_notes
        SET 
          permission_granted = FALSE,
          permission_denied_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;
      
      const result = await client.query(query, [stickyNoteId, userId]);
      return result.rows[0];
    } finally {
      await client.end();
    }
  }

  /**
   * Get shared sticky notes for Allan (or other users)
   */
  async getSharedStickyNotes(orgId, options = {}) {
    const { limit = 100, category = null, userId = null } = options;
    const client = new Client(this.dbConfig);
    
    try {
      await client.connect();
      
      let query = `
        SELECT 
          sn.*,
          u.first_name,
          u.last_name,
          u.email
        FROM app.sticky_notes sn
        JOIN app.users u ON sn.user_id = u.id
        WHERE sn.org_id = $1 
          AND sn.permission_granted = TRUE
          AND sn.is_private = FALSE
      `;
      const params = [orgId];
      let paramCount = 1;
      
      if (category) {
        paramCount++;
        query += ` AND sn.category = $${paramCount}`;
        params.push(category);
      }
      
      if (userId) {
        paramCount++;
        query += ` AND sn.user_id = $${paramCount}`;
        params.push(userId);
      }
      
      query += ` ORDER BY sn.created_at DESC LIMIT $${paramCount + 1}`;
      params.push(limit);
      
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      await client.end();
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const testMemory = await this.extractImportantMoments({
        userId: 'test-user',
        orgId: 'test-org',
        conversationType: 'chat',
        content: 'Test conversation for health check',
        metadata: {}
      });
      
      return {
        status: 'healthy',
        response: 'Sticky notes memory service accessible',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = { StickyNotesMemoryService };
