// Universal AI Personality State Bridge
// Unified state management for ALL AI personalities across ALL interfaces
// Works for Robbie, Steve Jobs, Bookkeeper, any personality

class UniversalAIStateBridge {
  constructor(db, config = {}) {
    this.db = db;
    
    // Configuration
    this.config = {
      backend_api_url: config.backend_api_url || 'http://localhost:8000/api/v1',
      websocket_url: config.websocket_url || 'ws://localhost:8000/ws',
      sync_interval: config.sync_interval || 5000, // 5 seconds
      interface_type: 'cursor',
      interface_id: `cursor_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      default_personality_id: config.default_personality_id || 'robbie',
      ...config
    };
    
    // State tracking (per personality)
    this.personalityStates = new Map();
    
    // Current active personality
    this.currentPersonalityId = this.config.default_personality_id;
    
    // WebSocket connection
    this.ws = null;
    this.wsConnected = false;
    
    // Sync queue for offline operation
    this.syncQueue = [];
    
    // Initialize
    this.initialize();
  }
  
  async initialize() {
    console.log('🌉 Initializing Universal AI State Bridge...');
    
    // Register this interface instance
    await this.registerInterface();
    
    // Connect to backend WebSocket
    await this.connectWebSocket();
    
    // Start periodic sync
    this.startPeriodicSync();
    
    // Fetch initial state for current personality
    await this.fetchPersonalityState(this.currentPersonalityId);
    
    console.log(`✅ AI State Bridge initialized (interface: ${this.config.interface_id})`);
  }
  
  // ============================================================================
  // WEBSOCKET CONNECTION
  // ============================================================================
  
  async connectWebSocket() {
    try {
      this.ws = new WebSocket(this.config.websocket_url);
      
      this.ws.on('open', () => {
        console.log('🔌 WebSocket connected to backend');
        this.wsConnected = true;
        
        // Register this Cursor instance
        this.ws.send(JSON.stringify({
          type: 'register',
          instance_type: 'cursor',
          instance_id: this.config.cursor_instance_id,
          user_id: 'allan'
        }));
        
        // Flush sync queue
        this.flushSyncQueue();
      });
      
      this.ws.on('message', (data) => {
        this.handleWebSocketMessage(JSON.parse(data));
      });
      
      this.ws.on('close', () => {
        console.log('⚠️ WebSocket disconnected');
        this.wsConnected = false;
        
        // Attempt reconnection
        setTimeout(() => this.connectWebSocket(), 5000);
      });
      
      this.ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });
    } catch (error) {
      console.error('❌ Failed to connect WebSocket:', error);
      // Fall back to HTTP polling
      this.startHTTPPolling();
    }
  }
  
  handleWebSocketMessage(message) {
    const { type, data } = message;
    
    switch (type) {
      case 'mood_update':
        this.handleMoodUpdate(data);
        break;
        
      case 'commitment_added':
        this.handleCommitmentAdded(data);
        break;
        
      case 'calendar_event':
        this.handleCalendarEvent(data);
        break;
        
      case 'conversation_message':
        this.handleConversationMessage(data);
        break;
        
      case 'memory_update':
        this.handleMemoryUpdate(data);
        break;
        
      case 'personality_change':
        this.handlePersonalityChange(data);
        break;
        
      default:
        console.log(`📨 Received: ${type}`, data);
    }
  }
  
  // ============================================================================
  // STATE SYNCHRONIZATION
  // ============================================================================
  
  async registerInterface() {
    // Register this interface instance in the database
    await this.db.run(`
      INSERT INTO ai_personality_instances (
        id, personality_id, interface_type, interface_id, user_id, status
      ) VALUES (?, ?, ?, ?, ?, 'active')
      ON CONFLICT (id) DO UPDATE SET 
        last_active = CURRENT_TIMESTAMP,
        status = 'active'
    `, [
      this.config.interface_id,
      this.currentPersonalityId,
      this.config.interface_type,
      this.config.interface_id,
      'allan' // Would come from auth
    ]);
  }
  
  async fetchPersonalityState(personalityId) {
    console.log(`📥 Fetching state for ${personalityId}...`);
    
    try {
      const state = {
        personality_id: personalityId,
        mood: await this.queryMoodState(personalityId),
        commitments: await this.queryActiveCommitments(personalityId),
        working_memory: await this.queryWorkingMemory(personalityId),
        calendar_events: await this.queryUpcomingEvents(),
        last_sync: Date.now()
      };
      
      this.personalityStates.set(personalityId, state);
      
      console.log(`✅ State loaded for ${personalityId}:`, {
        mood: state.mood.current_mood,
        commitments: state.commitments.length,
        calendar_events: state.calendar_events.length
      });
      
      return state;
    } catch (error) {
      console.error(`❌ Failed to fetch state for ${personalityId}:`, error);
    }
  }
  
  async queryMoodState(personalityId) {
    const result = await this.db.get(`
      SELECT current_mood, current_mode, energy_level, focus_state, last_state_change
      FROM ai_personality_state
      WHERE personality_id = ?
    `, [personalityId]);
    
    return result || { current_mood: 4, current_mode: 'professional', energy_level: 'normal' };
  }
  
  async queryActiveCommitments(personalityId) {
    return await this.db.all(`
      SELECT id, commitment_text, deadline, priority, committed_to
      FROM ai_commitments
      WHERE personality_id = ? 
        AND status = 'active'
        AND deadline > datetime('now')
      ORDER BY deadline ASC
    `, [personalityId]);
  }
  
  async queryWorkingMemory(personalityId) {
    return await this.db.all(`
      SELECT id, memory_type, content, priority, expires_at, metadata
      FROM ai_working_memory
      WHERE personality_id = ?
        AND (expires_at IS NULL OR expires_at > datetime('now'))
      ORDER BY priority DESC, created_at DESC
      LIMIT 20
    `, [personalityId]);
  }
  
  async queryUpcomingEvents() {
    return await this.db.all(`
      SELECT 
        id, event_title, event_description, start_time, end_time, 
        location, preparation_notes, relevant_personalities
      FROM ai_calendar_events
      WHERE start_time > datetime('now')
        AND start_time < datetime('now', '+24 hours')
      ORDER BY start_time ASC
    `);
  }
  
  async fetchMoodState() {
    const response = await fetch(`${this.config.backend_api_url}/robbie/mood`);
    return response.json();
  }
  
  async fetchPersonalityConfig() {
    const response = await fetch(`${this.config.backend_api_url}/robbie/personality`);
    return response.json();
  }
  
  async fetchActiveCommitments() {
    const response = await fetch(`${this.config.backend_api_url}/commitments/active`);
    return response.json();
  }
  
  async fetchConversationContext() {
    const response = await fetch(`${this.config.backend_api_url}/conversations/recent?limit=20`);
    return response.json();
  }
  
  async fetchRecentMemories() {
    const response = await fetch(`${this.config.backend_api_url}/memories/recent?limit=10`);
    return response.json();
  }
  
  async fetchCalendarEvents() {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const response = await fetch(
      `${this.config.backend_api_url}/calendar/events?start=${now.toISOString()}&end=${tomorrow.toISOString()}`
    );
    return response.json();
  }
  
  // ============================================================================
  // PERIODIC SYNC
  // ============================================================================
  
  startPeriodicSync() {
    setInterval(async () => {
      await this.syncState();
    }, this.config.sync_interval);
  }
  
  async syncState() {
    if (!this.wsConnected) {
      // Use HTTP fallback
      await this.fetchInitialState();
    }
    
    // Check for upcoming calendar events
    await this.checkUpcomingEvents();
  }
  
  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
  handleMoodUpdate(data) {
    console.log(`🎭 Mood updated: ${data.old_mood} → ${data.new_mood}`);
    this.localState.mood = data;
    
    // Persist locally
    this.persistMoodUpdate(data);
  }
  
  handleCommitmentAdded(data) {
    console.log(`📌 Commitment added: ${data.commitment} by ${data.deadline}`);
    this.localState.active_commitments.push(data);
    
    // Persist locally
    this.persistCommitment(data);
  }
  
  handleCalendarEvent(data) {
    console.log(`📅 Calendar event: ${data.title} at ${data.start_time}`);
    this.localState.calendar_events.push(data);
    
    // Check if we need to remind
    this.checkEventReminder(data);
  }
  
  handleConversationMessage(data) {
    console.log(`💬 New message in ${data.source}: ${data.preview}`);
    this.localState.conversation_context.push(data);
    
    // Keep only recent 20
    if (this.localState.conversation_context.length > 20) {
      this.localState.conversation_context.shift();
    }
  }
  
  handleMemoryUpdate(data) {
    console.log(`🧠 Memory updated: ${data.title}`);
    
    // Add or update memory
    const existingIndex = this.localState.recent_memories.findIndex(m => m.id === data.id);
    if (existingIndex >= 0) {
      this.localState.recent_memories[existingIndex] = data;
    } else {
      this.localState.recent_memories.push(data);
    }
  }
  
  handlePersonalityChange(data) {
    console.log(`🎭 Personality changed: ${data.change_type}`);
    this.localState.personality_config = data;
  }
  
  // ============================================================================
  // CALENDAR REMINDERS
  // ============================================================================
  
  async checkUpcomingEvents() {
    const now = new Date();
    
    for (const event of this.localState.calendar_events) {
      const eventTime = new Date(event.start_time);
      const minutesUntil = (eventTime - now) / (1000 * 60);
      
      // Remind at 15 minutes, 5 minutes, and 1 minute
      if (this.shouldRemind(event, minutesUntil)) {
        await this.sendReminder(event, minutesUntil);
      }
    }
  }
  
  shouldRemind(event, minutesUntil) {
    // Check if we already reminded
    if (event.reminded_at) {
      const timeSinceReminder = Date.now() - event.reminded_at;
      if (timeSinceReminder < 2 * 60 * 1000) { // Don't remind again within 2 minutes
        return false;
      }
    }
    
    // Remind at these intervals
    const remindIntervals = [15, 5, 1];
    return remindIntervals.some(interval => 
      minutesUntil <= interval && minutesUntil > (interval - 1)
    );
  }
  
  async sendReminder(event, minutesUntil) {
    const reminderMessage = this.formatReminder(event, minutesUntil);
    
    console.log(`⏰ REMINDER: ${reminderMessage}`);
    
    // Mark as reminded
    event.reminded_at = Date.now();
    
    // Send to Cursor (this would show as a notification)
    await this.showCursorNotification(reminderMessage, 'calendar');
    
    // Log reminder
    await this.logReminder(event, minutesUntil);
  }
  
  formatReminder(event, minutesUntil) {
    const minutes = Math.round(minutesUntil);
    
    let urgency = '📅';
    let message = '';
    
    if (minutes <= 1) {
      urgency = '🚨';
      message = `RIGHT NOW: ${event.title}`;
    } else if (minutes <= 5) {
      urgency = '⚠️';
      message = `In ${minutes} minutes: ${event.title}`;
    } else {
      urgency = '⏰';
      message = `In ${minutes} minutes: ${event.title}`;
    }
    
    // Add location if available
    if (event.location) {
      message += ` (${event.location})`;
    }
    
    // Add preparation notes if available
    if (event.preparation) {
      message += `\n\n📋 Prep: ${event.preparation}`;
    }
    
    return `${urgency} ${message}`;
  }
  
  // ============================================================================
  // CURSOR INTEGRATION
  // ============================================================================
  
  async showCursorNotification(message, type = 'info') {
    // This would integrate with Cursor's notification system
    // For now, log prominently
    console.log('\n' + '='.repeat(80));
    console.log('🔔 ROBBIE NOTIFICATION');
    console.log('='.repeat(80));
    console.log(message);
    console.log('='.repeat(80) + '\n');
    
    // Store notification for retrieval
    await this.storeNotification(message, type);
  }
  
  // ============================================================================
  // CONTEXT INJECTION FOR CURSOR
  // ============================================================================
  
  async getCursorContext() {
    // Generate context that should be injected into Cursor responses
    const context = {
      mood: this.localState.mood,
      active_commitments: this.localState.active_commitments,
      upcoming_events: this.getUpcomingEvents(60), // Next hour
      recent_context: this.localState.conversation_context.slice(-5),
      relevant_memories: this.localState.recent_memories.slice(-3)
    };
    
    return this.formatCursorContext(context);
  }
  
  formatCursorContext(context) {
    let formattedContext = '## 🤖 Robbie Current State\n\n';
    
    // Mood
    formattedContext += `**Current Mood:** ${this.getMoodEmoji(context.mood.current)} ${this.getMoodName(context.mood.current)}\n\n`;
    
    // Upcoming Events
    if (context.upcoming_events.length > 0) {
      formattedContext += '**⏰ Upcoming Events (Next Hour):**\n';
      for (const event of context.upcoming_events) {
        const minutesUntil = Math.round((new Date(event.start_time) - new Date()) / (1000 * 60));
        formattedContext += `- **${minutesUntil}min**: ${event.title}\n`;
      }
      formattedContext += '\n';
    }
    
    // Active Commitments
    if (context.active_commitments.length > 0) {
      formattedContext += '**📌 Active Commitments:**\n';
      for (const commitment of context.active_commitments) {
        formattedContext += `- ${commitment.commitment} (Due: ${new Date(commitment.deadline).toLocaleString()})\n`;
      }
      formattedContext += '\n';
    }
    
    // Recent Context from Chat
    if (context.recent_context.length > 0) {
      formattedContext += '**💬 Recent Chat Context:**\n';
      for (const msg of context.recent_context) {
        formattedContext += `- [${msg.source}] ${msg.preview}\n`;
      }
      formattedContext += '\n';
    }
    
    return formattedContext;
  }
  
  getUpcomingEvents(minutesAhead) {
    const now = new Date();
    const cutoff = new Date(now.getTime() + minutesAhead * 60 * 1000);
    
    return this.localState.calendar_events.filter(event => {
      const eventTime = new Date(event.start_time);
      return eventTime > now && eventTime <= cutoff;
    });
  }
  
  getMoodEmoji(moodLevel) {
    const emojis = {
      1: '😴', 2: '😌', 3: '😊', 4: '🤖', 
      5: '😄', 6: '🤩', 7: '🔥'
    };
    return emojis[moodLevel] || '🤖';
  }
  
  getMoodName(moodLevel) {
    const names = {
      1: 'Sleepy', 2: 'Calm', 3: 'Content', 4: 'Professional',
      5: 'Enthusiastic', 6: 'Excited', 7: 'Hyper'
    };
    return names[moodLevel] || 'Professional';
  }
  
  // ============================================================================
  // STATE PUBLISHING (Cursor → Backend)
  // ============================================================================
  
  async publishCursorActivity(activityType, data) {
    const activity = {
      type: activityType,
      data: data,
      source: 'cursor',
      instance_id: this.config.cursor_instance_id,
      timestamp: new Date().toISOString()
    };
    
    if (this.wsConnected) {
      // Send via WebSocket
      this.ws.send(JSON.stringify({
        type: 'cursor_activity',
        activity: activity
      }));
    } else {
      // Queue for later sync
      this.syncQueue.push(activity);
      await this.persistActivityToLocal(activity);
    }
  }
  
  async publishConversationMessage(message) {
    await this.publishCursorActivity('conversation_message', {
      message: message,
      context: 'cursor_chat'
    });
  }
  
  async publishProgress(progressType, details) {
    await this.publishCursorActivity('progress', {
      progress_type: progressType,
      details: details
    });
  }
  
  async publishCommitment(commitment, deadline) {
    await this.publishCursorActivity('commitment', {
      commitment: commitment,
      deadline: deadline
    });
  }
  
  // ============================================================================
  // OFFLINE SUPPORT
  // ============================================================================
  
  async flushSyncQueue() {
    if (this.syncQueue.length === 0) return;
    
    console.log(`📤 Flushing ${this.syncQueue.length} queued activities...`);
    
    for (const activity of this.syncQueue) {
      try {
        this.ws.send(JSON.stringify({
          type: 'cursor_activity',
          activity: activity
        }));
      } catch (error) {
        console.error('❌ Failed to send activity:', error);
      }
    }
    
    this.syncQueue = [];
  }
  
  startHTTPPolling() {
    console.log('📡 Starting HTTP polling fallback...');
    
    setInterval(async () => {
      await this.fetchInitialState();
    }, 10000); // Poll every 10 seconds
  }
  
  // ============================================================================
  // PERSISTENCE
  // ============================================================================
  
  async persistMoodUpdate(moodData) {
    await this.db.run(`
      INSERT INTO robbie_mood_sync (
        mood_level, changed_by, source, timestamp
      ) VALUES (?, ?, ?, ?)
    `, [
      moodData.new_mood,
      moodData.changed_by || 'system',
      'backend',
      new Date().toISOString()
    ]);
  }
  
  async persistCommitment(commitmentData) {
    await this.db.run(`
      INSERT INTO robbie_commitments_sync (
        commitment, deadline, status, source, timestamp
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      commitmentData.commitment,
      commitmentData.deadline,
      'active',
      'backend',
      new Date().toISOString()
    ]);
  }
  
  async storeNotification(message, type) {
    await this.db.run(`
      INSERT INTO robbie_notifications (
        message, type, shown_at, acknowledged
      ) VALUES (?, ?, ?, ?)
    `, [
      message,
      type,
      new Date().toISOString(),
      false
    ]);
  }
  
  async logReminder(event, minutesUntil) {
    await this.db.run(`
      INSERT INTO robbie_reminders (
        event_id, event_title, minutes_until, reminded_at
      ) VALUES (?, ?, ?, ?)
    `, [
      event.id,
      event.title,
      Math.round(minutesUntil),
      new Date().toISOString()
    ]);
  }
  
  async persistActivityToLocal(activity) {
    await this.db.run(`
      INSERT INTO robbie_activity_queue (
        activity_type, data, source, timestamp, synced
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      activity.type,
      JSON.stringify(activity.data),
      activity.source,
      activity.timestamp,
      false
    ]);
  }
  
  // ============================================================================
  // DATABASE INITIALIZATION
  // ============================================================================
  
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS robbie_mood_sync (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mood_level INTEGER NOT NULL,
        changed_by TEXT NOT NULL,
        source TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS robbie_commitments_sync (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        commitment TEXT NOT NULL,
        deadline DATETIME NOT NULL,
        status TEXT DEFAULT 'active',
        source TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS robbie_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        shown_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        acknowledged BOOLEAN DEFAULT FALSE
      );
      
      CREATE TABLE IF NOT EXISTS robbie_reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT NOT NULL,
        event_title TEXT NOT NULL,
        minutes_until INTEGER NOT NULL,
        reminded_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS robbie_activity_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        activity_type TEXT NOT NULL,
        data TEXT NOT NULL,
        source TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced BOOLEAN DEFAULT FALSE
      );
      
      CREATE INDEX IF NOT EXISTS idx_mood_sync_timestamp ON robbie_mood_sync (timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_commitments_status ON robbie_commitments_sync (status, deadline);
      CREATE INDEX IF NOT EXISTS idx_notifications_acknowledged ON robbie_notifications (acknowledged, shown_at DESC);
      CREATE INDEX IF NOT EXISTS idx_activity_queue_synced ON robbie_activity_queue (synced, timestamp DESC);
    `);
  }
}

module.exports = UniversalAIStateBridge;

