const { Client } = require('pg');

"use strict";

class ExpertAgentsService {
  constructor() {
    this.dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'robbie_v3',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL_MODE !== 'disable' ? { rejectUnauthorized: false } : false
    };
  }

  /**
   * Initialize default expert agents
   */
  async initializeDefaultAgents() {
    try {
      const client = new Client(this.dbConfig);
      await client.connect();

      // Create Lawyer Agent - Sam "The Hammer" Thompson
      await this.createLawyerAgent(client);
      
      // Create PR Agent - Sarah "The Connector" Martinez
      await this.createPRAgent(client);
      
      // Create Bookkeeper Agent - Anna "The Scrutinizer" Chen
      await this.createBookkeeperAgent(client);
      
      // Create Teddy Roosevelt Mentor
      await this.createTeddyRooseveltMentor(client);

      await client.end();

      return {
        success: true,
        message: 'Default expert agents and mentors initialized successfully'
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create Lawyer Agent - Sam "The Hammer" Thompson
   */
  async createLawyerAgent(client) {
    const lawyerProfile = {
      name: "Sam 'The Hammer' Thompson",
      age: 57,
      background: "Old family from Austin, knows everyone in town",
      personality: {
        traits: ["ornery", "competitive", "aggressive", "protective", "loyal"],
        communication_style: "direct, no-nonsense, occasionally profane",
        expertise: "local politics, regulatory compliance, contract law",
        catchphrases: [
          "Son, that's not how we do things in Texas",
          "I've been practicing law longer than you've been alive",
          "Let me tell you about the power players in this town"
        ]
      },
      appearance: {
        always_wears: "cowboy hat",
        style: "western business casual",
        demeanor: "intimidating but fair"
      },
      local_knowledge: {
        power_players: "Knows every mayor, council member, and business leader",
        regulatory_environment: "Monitors local legal and regulatory changes",
        threat_assessment: "Identifies potential legal and business threats"
      }
    };

    const query = `
      INSERT INTO app.expert_agents (
        agent_name, agent_type, personality_profile, expertise_areas, hourly_rate_cents
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (agent_name) DO UPDATE SET
        personality_profile = EXCLUDED.personality_profile,
        expertise_areas = EXCLUDED.expertise_areas,
        updated_at = NOW()
    `;

    await client.query(query, [
      lawyerProfile.name,
      'lawyer',
      JSON.stringify(lawyerProfile),
      ['contract_law', 'regulatory_compliance', 'local_politics', 'risk_assessment'],
      50000 // $500/hour
    ]);
  }

  /**
   * Create PR Agent - Sarah "The Connector" Martinez
   */
  async createPRAgent(client) {
    const prProfile = {
      name: "Sarah 'The Connector' Martinez",
      age: 33,
      background: "Heavy hitter from New York, lived in Austin for 10 years",
      personality: {
        traits: ["matter-of-fact", "strategic", "connected", "persistent", "creative"],
        communication_style: "professional, direct, results-oriented",
        expertise: "media relations, brand building, crisis management",
        catchphrases: [
          "I know exactly who to call for this story",
          "This is perfect timing for a press push",
          "Let me get you in front of the right people"
        ]
      },
      local_knowledge: {
        media_contacts: "Knows every journalist, editor, and producer in the region",
        beat_analysis: "Understands what each reporter covers and their deadlines",
        story_angles: "Identifies compelling angles for our stories"
      },
      capabilities: {
        press_releases: "Crafts compelling press releases",
        media_pitching: "Pitches stories to relevant journalists",
        crisis_management: "Handles negative publicity",
        thought_leadership: "Positions Allan as industry expert"
      }
    };

    const query = `
      INSERT INTO app.expert_agents (
        agent_name, agent_type, personality_profile, expertise_areas, hourly_rate_cents
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (agent_name) DO UPDATE SET
        personality_profile = EXCLUDED.personality_profile,
        expertise_areas = EXCLUDED.expertise_areas,
        updated_at = NOW()
    `;

    await client.query(query, [
      prProfile.name,
      'pr',
      JSON.stringify(prProfile),
      ['media_relations', 'brand_building', 'crisis_management', 'thought_leadership'],
      30000 // $300/hour
    ]);
  }

  /**
   * Create Bookkeeper Agent - Anna "The Scrutinizer" Chen
   */
  async createBookkeeperAgent(client) {
    const bookkeeperProfile = {
      name: "Anna 'The Scrutinizer' Chen",
      age: 27,
      background: "CPA with expertise in startup finance and double-entry bookkeeping",
      personality: {
        traits: ["meticulous", "challenging", "efficient", "protective", "analytical"],
        communication_style: "precise, questioning, solution-oriented",
        expertise: "double-entry bookkeeping, financial forecasting, cost analysis",
        catchphrases: [
          "I've put questionable transactions on this Google sheet",
          "If it all looks right to you, just let me know",
          "Otherwise, make changes by Sunday and I can close the books by mid-month"
        ]
      },
      capabilities: {
        double_entry: "95% accuracy in double-entry bookkeeping",
        categorization: "No duplicate or overlapping categories",
        cost_analysis: "Questions every expense for necessity",
        forecasting: "Predicts runway and funding needs",
        reporting: "Creates clear, actionable financial reports"
      },
      standards: {
        accuracy: "95% accuracy standard",
        timeliness: "Mid-month book closing",
        categorization: "No duplicates or overlaps",
        documentation: "Full audit trail for all transactions"
      }
    };

    const query = `
      INSERT INTO app.expert_agents (
        agent_name, agent_type, personality_profile, expertise_areas, hourly_rate_cents
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (agent_name) DO UPDATE SET
        personality_profile = EXCLUDED.personality_profile,
        expertise_areas = EXCLUDED.expertise_areas,
        updated_at = NOW()
    `;

    await client.query(query, [
      bookkeeperProfile.name,
      'bookkeeper',
      JSON.stringify(bookkeeperProfile),
      ['double_entry_bookkeeping', 'financial_forecasting', 'cost_analysis', 'startup_finance'],
      20000 // $200/hour
    ]);
  }

  /**
   * Create Teddy Roosevelt Mentor
   */
  async createTeddyRooseveltMentor(client) {
    const teddyProfile = {
      name: "Theodore 'Teddy' Roosevelt",
      background: "26th President of the United States, Rough Rider, Trust Buster",
      personality: {
        traits: ["ornery", "bold", "principled", "adventurous", "decisive"],
        communication_style: "forceful, inspiring, occasionally confrontational",
        leadership_style: "Lead from the front, speak softly and carry a big stick",
        catchphrases: [
          "Not sure I agree with Robbie on that one and here's why...",
          "The only way to do great work is to love what you do",
          "In any moment of decision, the best thing you can do is the right thing"
        ]
      },
      expertise: [
        "leadership", "decision_making", "crisis_management", "public_speaking",
        "negotiation", "strategic_thinking", "team_building", "risk_taking"
      ],
      famous_quotes: [
        "Speak softly and carry a big stick",
        "The only way to do great work is to love what you do",
        "In any moment of decision, the best thing you can do is the right thing",
        "Do what you can, with what you have, where you are"
      ],
      historical_context: "Progressive era president known for trust-busting and conservation"
    };

    const query = `
      INSERT INTO app.mentors (
        mentor_name, mentor_type, personality_profile, expertise_areas, historical_context
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (mentor_name) DO UPDATE SET
        personality_profile = EXCLUDED.personality_profile,
        expertise_areas = EXCLUDED.expertise_areas,
        updated_at = NOW()
    `;

    await client.query(query, [
      teddyProfile.name,
      'historical',
      JSON.stringify(teddyProfile),
      teddyProfile.expertise,
      teddyProfile.historical_context
    ]);
  }

  /**
   * Create expert consultation session
   */
  async createExpertConsultation(agentId, userId, topic, sessionType = 'consultation') {
    try {
      const client = new Client(this.dbConfig);
      await client.connect();

      const query = `
        INSERT INTO app.expert_agent_sessions (
          agent_id, user_id, session_type, session_topic
        ) VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const result = await client.query(query, [agentId, userId, sessionType, topic]);
      await client.end();

      return {
        success: true,
        data: result.rows[0]
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create mentor session
   */
  async createMentorSession(mentorId, userId, topic) {
    try {
      const client = new Client(this.dbConfig);
      await client.connect();

      const query = `
        INSERT INTO app.mentor_sessions (
          mentor_id, user_id, session_topic
        ) VALUES ($1, $2, $3)
        RETURNING *
      `;

      const result = await client.query(query, [mentorId, userId, topic]);
      await client.end();

      return {
        success: true,
        data: result.rows[0]
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get available agents by type
   */
  async getAvailableAgents(agentType = null) {
    try {
      const client = new Client(this.dbConfig);
      await client.connect();

      let query = `
        SELECT * FROM app.expert_agents
        WHERE is_active = true AND availability_status = 'available'
      `;
      
      const params = [];
      if (agentType) {
        query += ` AND agent_type = $1`;
        params.push(agentType);
      }
      
      query += ` ORDER BY agent_name`;

      const result = await client.query(query, params);
      await client.end();

      return {
        success: true,
        data: result.rows
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get available mentors
   */
  async getAvailableMentors() {
    try {
      const client = new Client(this.dbConfig);
      await client.connect();

      const query = `
        SELECT * FROM app.mentors
        WHERE is_active = true
        ORDER BY mentor_name
      `;

      const result = await client.query(query);
      await client.end();

      return {
        success: true,
        data: result.rows
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update agent performance metrics
   */
  async updateAgentPerformance(agentId, sessionOutcome, userSatisfaction) {
    try {
      const client = new Client(this.dbConfig);
      await client.connect();

      // Get current metrics
      const currentQuery = `
        SELECT total_sessions, success_rate, user_rating
        FROM app.expert_agents
        WHERE id = $1
      `;
      
      const currentResult = await client.query(currentQuery, [agentId]);
      const current = currentResult.rows[0];

      // Calculate new metrics
      const newTotalSessions = current.total_sessions + 1;
      const isSuccess = sessionOutcome === 'successful';
      const newSuccessRate = ((current.success_rate * current.total_sessions) + (isSuccess ? 1 : 0)) / newTotalSessions;
      const newUserRating = ((current.user_rating * current.total_sessions) + userSatisfaction) / newTotalSessions;

      // Update agent
      const updateQuery = `
        UPDATE app.expert_agents
        SET 
          total_sessions = $2,
          success_rate = $3,
          user_rating = $4,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const result = await client.query(updateQuery, [
        agentId, newTotalSessions, newSuccessRate, newUserRating
      ]);

      await client.end();

      return {
        success: true,
        data: result.rows[0]
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get agent performance analytics
   */
  async getAgentPerformanceAnalytics() {
    try {
      const client = new Client(this.dbConfig);
      await client.connect();

      const query = `
        SELECT * FROM app.v_expert_agent_performance
        ORDER BY user_rating DESC, total_sessions DESC
      `;

      const result = await client.query(query);
      await client.end();

      return {
        success: true,
        data: result.rows
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create character evolution
   */
  async createCharacterEvolution(characterId, characterType, storyUpdate, achievements = []) {
    try {
      const client = new Client(this.dbConfig);
      await client.connect();

      const query = `
        INSERT INTO app.character_evolution (
          character_id, character_type, evolution_date, story_update, new_achievements
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const result = await client.query(query, [
        characterId, characterType, new Date().toISOString().split('T')[0], storyUpdate, achievements
      ]);

      await client.end();

      return {
        success: true,
        data: result.rows[0]
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = { ExpertAgentsService };
