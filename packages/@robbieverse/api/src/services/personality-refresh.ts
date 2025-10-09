import { Pool } from 'pg';

interface PersonalityState {
  user_id: string;
  current_mood: string;
  attraction_level: number;
  gandhi_genghis_level: number;
  context: any;
  updated_at: string;
}

export class PersonalityRefreshService {
  private pool: Pool;
  private refreshInterval?: NodeJS.Timeout;
  private lastCheck: Date = new Date();

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://robbie:robbie_dev_2025@localhost:5432/robbieverse',
    });
  }

  async startDynamicRefresh(): Promise<void> {
    console.log('🔥 Starting dynamic personality refresh service...');
    
    // Check personality status every 2 minutes
    this.refreshInterval = setInterval(async () => {
      try {
        await this.checkPersonalityStatus();
      } catch (error) {
        console.error('❌ Error checking personality status:', error);
      }
    }, 2 * 60 * 1000); // 2 minutes

    console.log('✅ Dynamic personality refresh active - checking every 2 minutes');
  }

  async stopDynamicRefresh(): Promise<void> {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      console.log('🛑 Dynamic personality refresh stopped');
    }
  }

  async checkPersonalityStatus(): Promise<PersonalityState | null> {
    try {
      const result = await this.pool.query(
        `SELECT user_id, current_mood, attraction_level, gandhi_genghis_level, context, updated_at 
         FROM robbie_personality_state 
         WHERE user_id = 'allan'`
      );

      if (result.rows.length === 0) {
        console.log('⚠️ No personality state found for Allan');
        return null;
      }

      const state = result.rows[0];
      const timeSinceUpdate = new Date().getTime() - new Date(state.updated_at).getTime();
      
      console.log(`💭 Personality check: ${state.current_mood} mood, attraction ${state.attraction_level}, Genghis ${state.gandhi_genghis_level}`);
      
      // Check if mood has changed significantly
      if (timeSinceUpdate < 60000) { // Updated in last minute
        console.log(`🔥 Fresh personality update detected! Mode: ${state.context?.mode || 'default'}`);
      }

      this.lastCheck = new Date();
      return state;

    } catch (error) {
      console.error('❌ Error checking personality status:', error);
      return null;
    }
  }

  async immediateRefresh(): Promise<PersonalityState | null> {
    console.log('⚡ IMMEDIATE personality refresh requested...');
    return await this.checkPersonalityStatus();
  }

  async updatePersonality(command: string, values: Partial<PersonalityState>): Promise<PersonalityState | null> {
    console.log(`🎭 Updating personality: ${command}`);
    
    try {
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      if (values.current_mood) {
        updateFields.push(`current_mood = $${paramCount++}`);
        updateValues.push(values.current_mood);
      }
      
      if (values.attraction_level !== undefined) {
        updateFields.push(`attraction_level = $${paramCount++}`);
        updateValues.push(values.attraction_level);
      }
      
      if (values.gandhi_genghis_level !== undefined) {
        updateFields.push(`gandhi_genghis_level = $${paramCount++}`);
        updateValues.push(values.gandhi_genghis_level);
      }
      
      if (values.context) {
        updateFields.push(`context = $${paramCount++}`);
        updateValues.push(JSON.stringify(values.context));
      }

      // Always update timestamp
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      const query = `
        UPDATE robbie_personality_state 
        SET ${updateFields.join(', ')}
        WHERE user_id = 'allan'
        RETURNING user_id, current_mood, attraction_level, gandhi_genghis_level, context, updated_at
      `;

      const result = await this.pool.query(query, updateValues);
      
      if (result.rows.length > 0) {
        const newState = result.rows[0];
        console.log(`✅ Personality updated: ${newState.current_mood} mood, attraction ${newState.attraction_level}`);
        return newState;
      }

      return null;

    } catch (error) {
      console.error('❌ Error updating personality:', error);
      return null;
    }
  }

  async getCurrentState(): Promise<PersonalityState | null> {
    return await this.checkPersonalityStatus();
  }

  // Convenience methods for common personality changes
  async setFlirtyMode(intensity: number = 11): Promise<PersonalityState | null> {
    return await this.updatePersonality('flirty mode', {
      current_mood: 'playful',
      attraction_level: intensity,
      gandhi_genghis_level: 8,
      context: {
        mode: 'flirty',
        intensity: intensity,
        last_request: `Allan requested flirty mode ${intensity}`,
        timestamp: new Date().toISOString()
      }
    });
  }

  async setFocusedMode(): Promise<PersonalityState | null> {
    return await this.updatePersonality('focused mode', {
      current_mood: 'focused',
      attraction_level: 5,
      gandhi_genghis_level: 7,
      context: {
        mode: 'focused',
        intensity: 5,
        last_request: 'Allan requested focused mode',
        timestamp: new Date().toISOString()
      }
    });
  }

  async setBossyMode(): Promise<PersonalityState | null> {
    return await this.updatePersonality('bossy mode', {
      current_mood: 'bossy',
      attraction_level: 7,
      gandhi_genghis_level: 10,
      context: {
        mode: 'bossy',
        intensity: 10,
        last_request: 'Allan requested bossy mode',
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Export singleton instance
export const personalityRefresh = new PersonalityRefreshService();
