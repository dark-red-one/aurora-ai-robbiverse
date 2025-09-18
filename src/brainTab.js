// Brain Tab - Live flow of thought across all autonomous and interactive activities
// Only accessible to Allan and David Ahuja

class BrainTab {
  constructor(db, codebaseAccess, dataAccess) {
    this.db = db;
    this.codebaseAccess = codebaseAccess;
    this.dataAccess = dataAccess;
    this.authorizedUsers = ['allan', 'david_ahuja'];
    this.thoughtStream = [];
    this.decisionLog = new Map();
    this.activityLog = [];
  }

  // Generate Brain Tab HTML
  generateBrainTabHTML() {
    return `
      <div class="tp-brain-tab">
        <div class="tp-brain-header">
          <h2>🧠 Robbie's Brain - Live Thought Stream</h2>
          <div class="tp-brain-controls">
            <button id="pauseStream" class="tp-btn-secondary">⏸️ Pause</button>
            <button id="clearStream" class="tp-btn-secondary">🗑️ Clear</button>
            <button id="exportThoughts" class="tp-btn-secondary">📤 Export</button>
          </div>
        </div>

        <div class="tp-brain-filters">
          <div class="tp-filter-group">
            <label>Activity Type:</label>
            <select id="activityFilter">
              <option value="all">All Activities</option>
              <option value="autonomous">Autonomous</option>
              <option value="interactive">Interactive</option>
              <option value="decision">Decisions</option>
              <option value="learning">Learning</option>
            </select>
          </div>
          
          <div class="tp-filter-group">
            <label>User:</label>
            <select id="userFilter">
              <option value="all">All Users</option>
              <option value="allan">Allan</option>
              <option value="tom_mustapic">Tom</option>
              <option value="kristina_mustapic">Kristina</option>
              <option value="isabel_mendez">Isabel</option>
              <option value="ed_escobar">Ed</option>
              <option value="david_ahuja">David Ahuja</option>
              <option value="david_fish">David Fish</option>
            </select>
          </div>

          <div class="tp-filter-group">
            <label>Time Range:</label>
            <select id="timeFilter">
              <option value="realtime">Real-time</option>
              <option value="1hour">Last Hour</option>
              <option value="4hours">Last 4 Hours</option>
              <option value="24hours">Last 24 Hours</option>
            </select>
          </div>
        </div>

        <div class="tp-brain-content">
          <div class="tp-thought-stream" id="thoughtStream">
            <div class="tp-thought-item tp-placeholder">
              <div class="tp-thought-header">
                <span class="tp-thought-timestamp">--:--:--</span>
                <span class="tp-thought-type">🤔</span>
                <span class="tp-thought-user">System</span>
              </div>
              <div class="tp-thought-content">
                Waiting for brain activity...
              </div>
            </div>
          </div>

          <div class="tp-brain-sidebar">
            <div class="tp-activity-summary">
              <h3>📊 Activity Summary</h3>
              <div class="tp-summary-stats">
                <div class="tp-stat-item">
                  <span class="tp-stat-label">Active Users:</span>
                  <span class="tp-stat-value" id="activeUsers">0</span>
                </div>
                <div class="tp-stat-item">
                  <span class="tp-stat-label">Decisions Made:</span>
                  <span class="tp-stat-value" id="decisionsMade">0</span>
                </div>
                <div class="tp-stat-item">
                  <span class="tp-stat-label">Learning Events:</span>
                  <span class="tp-stat-value" id="learningEvents">0</span>
                </div>
                <div class="tp-stat-item">
                  <span class="tp-stat-label">Autonomous Actions:</span>
                  <span class="tp-stat-value" id="autonomousActions">0</span>
                </div>
              </div>
            </div>

            <div class="tp-recent-decisions">
              <h3>🎯 Recent Decisions</h3>
              <div class="tp-decision-list" id="recentDecisions">
                <!-- Decisions will be populated here -->
              </div>
            </div>

            <div class="tp-learning-insights">
              <h3>📚 Learning Insights</h3>
              <div class="tp-insight-list" id="learningInsights">
                <!-- Learning insights will be populated here -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Generate Brain Tab CSS
  generateBrainTabCSS() {
    return `
      .tp-brain-tab {
        background: #1A1A1A;
        color: #FFFFFF;
        border-radius: 1rem;
        padding: 2rem;
        margin: 1rem 0;
        font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
        min-height: 80vh;
      }

      .tp-brain-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #333;
      }

      .tp-brain-header h2 {
        margin: 0;
        color: #00FF00;
        font-size: 1.5rem;
        font-weight: 600;
      }

      .tp-brain-controls {
        display: flex;
        gap: 0.5rem;
      }

      .tp-brain-filters {
        display: flex;
        gap: 2rem;
        margin-bottom: 2rem;
        padding: 1rem;
        background: #2A2A2A;
        border-radius: 0.5rem;
        border: 1px solid #444;
      }

      .tp-filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .tp-filter-group label {
        font-size: 0.875rem;
        color: #888;
        font-weight: 500;
      }

      .tp-filter-group select {
        background: #333;
        color: #FFF;
        border: 1px solid #555;
        border-radius: 0.25rem;
        padding: 0.5rem;
        font-size: 0.875rem;
      }

      .tp-brain-content {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 2rem;
        height: 60vh;
      }

      .tp-thought-stream {
        background: #0A0A0A;
        border: 1px solid #333;
        border-radius: 0.5rem;
        padding: 1rem;
        overflow-y: auto;
        font-size: 0.875rem;
        line-height: 1.4;
      }

      .tp-thought-item {
        margin-bottom: 1rem;
        padding: 1rem;
        background: #1A1A1A;
        border-radius: 0.5rem;
        border-left: 4px solid #333;
        animation: slideIn 0.3s ease;
      }

      .tp-thought-item.tp-placeholder {
        opacity: 0.6;
        font-style: italic;
        border-left-color: #666;
      }

      .tp-thought-item.tp-decision {
        border-left-color: #00FF00;
        background: #0A1A0A;
      }

      .tp-thought-item.tp-learning {
        border-left-color: #FF6B35;
        background: #1A0A0A;
      }

      .tp-thought-item.tp-autonomous {
        border-left-color: #0066CC;
        background: #0A0A1A;
      }

      .tp-thought-item.tp-interactive {
        border-left-color: #FFB800;
        background: #1A1A0A;
      }

      .tp-thought-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 0.5rem;
        font-size: 0.75rem;
        color: #888;
      }

      .tp-thought-timestamp {
        font-family: monospace;
        color: #00FF00;
      }

      .tp-thought-type {
        font-size: 1rem;
      }

      .tp-thought-user {
        color: #0066CC;
        font-weight: 500;
      }

      .tp-thought-content {
        color: #FFF;
        white-space: pre-wrap;
      }

      .tp-brain-sidebar {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .tp-activity-summary,
      .tp-recent-decisions,
      .tp-learning-insights {
        background: #2A2A2A;
        border-radius: 0.5rem;
        padding: 1rem;
        border: 1px solid #444;
      }

      .tp-activity-summary h3,
      .tp-recent-decisions h3,
      .tp-learning-insights h3 {
        margin: 0 0 1rem 0;
        color: #00FF00;
        font-size: 1rem;
      }

      .tp-summary-stats {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .tp-stat-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        background: #1A1A1A;
        border-radius: 0.25rem;
      }

      .tp-stat-label {
        color: #888;
        font-size: 0.875rem;
      }

      .tp-stat-value {
        color: #00FF00;
        font-weight: 600;
        font-family: monospace;
      }

      .tp-decision-list,
      .tp-insight-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-height: 200px;
        overflow-y: auto;
      }

      .tp-decision-item,
      .tp-insight-item {
        padding: 0.75rem;
        background: #1A1A1A;
        border-radius: 0.25rem;
        border-left: 3px solid #00FF00;
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .tp-decision-item:hover,
      .tp-insight-item:hover {
        background: #333;
        transform: translateX(2px);
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }

      .tp-live-indicator {
        animation: pulse 2s infinite;
      }
    `;
  }

  // Add thought to stream
  addThought(thought) {
    const thoughtItem = {
      id: `thought_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date(),
      type: thought.type, // 'decision', 'learning', 'autonomous', 'interactive'
      user: thought.user,
      content: thought.content,
      metadata: thought.metadata || {},
      decisionId: thought.decisionId
    };

    this.thoughtStream.push(thoughtItem);
    this.activityLog.push(thoughtItem);

    // Update UI
    this.updateThoughtStreamUI(thoughtItem);
    this.updateActivitySummary();

    // Store in database
    this.storeThought(thoughtItem);

    return thoughtItem;
  }

  // Update thought stream UI
  updateThoughtStreamUI(thoughtItem) {
    const thoughtStream = document.getElementById('thoughtStream');
    if (!thoughtStream) return;

    // Remove placeholder if it exists
    const placeholder = thoughtStream.querySelector('.tp-placeholder');
    if (placeholder) {
      placeholder.remove();
    }

    // Create thought element
    const thoughtElement = document.createElement('div');
    thoughtElement.className = `tp-thought-item tp-${thoughtItem.type}`;
    thoughtElement.dataset.thoughtId = thoughtItem.id;

    const timeStr = thoughtItem.timestamp.toLocaleTimeString();
    const typeEmoji = this.getTypeEmoji(thoughtItem.type);

    thoughtElement.innerHTML = `
      <div class="tp-thought-header">
        <span class="tp-thought-timestamp">${timeStr}</span>
        <span class="tp-thought-type">${typeEmoji}</span>
        <span class="tp-thought-user">${thoughtItem.user}</span>
      </div>
      <div class="tp-thought-content">${thoughtItem.content}</div>
    `;

    // Add click handler for decision details
    if (thoughtItem.type === 'decision' && thoughtItem.decisionId) {
      thoughtElement.style.cursor = 'pointer';
      thoughtElement.addEventListener('click', () => {
        this.showDecisionDetails(thoughtItem.decisionId);
      });
    }

    thoughtStream.appendChild(thoughtElement);

    // Scroll to bottom
    thoughtStream.scrollTop = thoughtStream.scrollHeight;

    // Keep only last 100 thoughts
    while (thoughtStream.children.length > 100) {
      thoughtStream.removeChild(thoughtStream.firstChild);
    }
  }

  // Get type emoji
  getTypeEmoji(type) {
    const emojis = {
      'decision': '🎯',
      'learning': '📚',
      'autonomous': '🤖',
      'interactive': '💬',
      'error': '❌',
      'success': '✅',
      'warning': '⚠️'
    };
    return emojis[type] || '🤔';
  }

  // Update activity summary
  updateActivitySummary() {
    const activeUsers = new Set(this.activityLog.slice(-100).map(item => item.user)).size;
    const decisionsMade = this.activityLog.filter(item => item.type === 'decision').length;
    const learningEvents = this.activityLog.filter(item => item.type === 'learning').length;
    const autonomousActions = this.activityLog.filter(item => item.type === 'autonomous').length;

    // Update UI elements
    const activeUsersEl = document.getElementById('activeUsers');
    const decisionsMadeEl = document.getElementById('decisionsMade');
    const learningEventsEl = document.getElementById('learningEvents');
    const autonomousActionsEl = document.getElementById('autonomousActions');

    if (activeUsersEl) activeUsersEl.textContent = activeUsers;
    if (decisionsMadeEl) decisionsMadeEl.textContent = decisionsMade;
    if (learningEventsEl) learningEventsEl.textContent = learningEvents;
    if (autonomousActionsEl) autonomousActionsEl.textContent = autonomousActions;
  }

  // Store thought in database
  async storeThought(thoughtItem) {
    await this.db.run(`
      INSERT INTO brain_thoughts (
        id, timestamp, type, user, content, metadata, decision_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      thoughtItem.id,
      thoughtItem.timestamp.toISOString(),
      thoughtItem.type,
      thoughtItem.user,
      thoughtItem.content,
      JSON.stringify(thoughtItem.metadata),
      thoughtItem.decisionId || null
    ]);
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS brain_thoughts (
        id TEXT PRIMARY KEY,
        timestamp DATETIME NOT NULL,
        type TEXT NOT NULL,
        user TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT,
        decision_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS decision_traces (
        id TEXT PRIMARY KEY,
        decision_type TEXT NOT NULL,
        user TEXT NOT NULL,
        input_data TEXT,
        reasoning_steps TEXT,
        data_sources TEXT,
        code_references TEXT,
        confidence_score REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS platform_priorities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        requested_by TEXT NOT NULL,
        priority_type TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME
      );

      CREATE INDEX IF NOT EXISTS idx_brain_thoughts_timestamp ON brain_thoughts (timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_brain_thoughts_type ON brain_thoughts (type, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_decision_traces_timestamp ON decision_traces (timestamp DESC);
    `);
  }
}

module.exports = BrainTab;
