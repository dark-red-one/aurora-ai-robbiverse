import { db } from "./db.js";
import { randomUUID } from "crypto";
import { directGPU } from "./directGPU.js";
import { characterFilter } from "./characterFilter.js";

// Interactive Town System - MUD meets YPO networking
export class TownSystem {
  constructor() {
    this.initializeTables();
    this.locations = this.getDefaultLocations();
    this.npcs = this.getDefaultNPCs();
    this.mentors = this.getDefaultMentors();
    this.currentUser = null;
    this.currentLocation = 'townsquare';
  }

  initializeTables() {
    // User sessions and locations
    db.prepare(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        current_location TEXT NOT NULL,
        last_seen TEXT NOT NULL DEFAULT (datetime('now')),
        session_data TEXT, -- JSON object
        is_online BOOLEAN DEFAULT TRUE
      )
    `).run();

    // Location visits and interactions
    db.prepare(`
      CREATE TABLE IF NOT EXISTS location_visits (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        location TEXT NOT NULL,
        visit_duration INTEGER, -- seconds
        interactions INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // NPC interactions
    db.prepare(`
      CREATE TABLE IF NOT EXISTS npc_interactions (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        npc_name TEXT NOT NULL,
        interaction_type TEXT NOT NULL, -- 'chat', 'trade', 'quest', 'advice'
        interaction_data TEXT, -- JSON object
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Mentor sessions
    db.prepare(`
      CREATE TABLE IF NOT EXISTS mentor_sessions (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        mentor_name TEXT NOT NULL,
        topic TEXT,
        session_data TEXT, -- JSON object
        duration_minutes INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Indexes
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_user_sessions_username ON user_sessions(username, is_online)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_location_visits_location ON location_visits(location, created_at)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_npc_interactions_npc ON npc_interactions(npc_name, created_at)`).run();
  }

  getDefaultLocations() {
    return {
      'townsquare': {
        name: 'Town Square',
        description: 'The bustling heart of the Robbieverse. Entrepreneurs, investors, and innovators gather here.',
        npcs: ['robbie', 'dealer', 'mentor_jesus'],
        activities: ['chat', 'networking', 'announcements'],
        hashtags: ['#networking', '#startup', '#investment', '#innovation']
      },
      'townpub': {
        name: 'The Town Pub',
        description: 'A cozy gathering place where deals are made over drinks. The walls are lined with success stories.',
        npcs: ['bartender', 'venture_capitalist', 'serial_entrepreneur'],
        activities: ['drinks', 'deals', 'stories', 'networking'],
        hashtags: ['#deals', '#networking', '#success', '#stories']
      },
      'triviahall': {
        name: 'Trivia Hall',
        description: 'Test your business knowledge and compete with other entrepreneurs. Prizes include mentorship sessions!',
        npcs: ['quiz_master', 'competitor_1', 'competitor_2'],
        activities: ['trivia', 'competition', 'learning', 'prizes'],
        hashtags: ['#trivia', '#competition', '#learning', '#prizes']
      },
      'casino': {
        name: 'The High Stakes Casino',
        description: 'Where entrepreneurs bet on their instincts. Play with virtual chips, win real insights.',
        npcs: ['dealer', 'high_roller', 'lucky_entrepreneur'],
        activities: ['poker', 'blackjack', 'roulette', 'betting'],
        hashtags: ['#gambling', '#risk', '#strategy', '#luck']
      },
      'mentor_garden': {
        name: 'Mentor Garden',
        description: 'A peaceful place where wisdom grows. Mentors from all industries share their knowledge.',
        npcs: ['mentor_jesus', 'tech_guru', 'marketing_maven', 'finance_wizard'],
        activities: ['mentorship', 'wisdom', 'guidance', 'reflection'],
        hashtags: ['#mentorship', '#wisdom', '#guidance', '#growth']
      },
      'aurora': {
        name: 'Aurora',
        description: 'The presidential hub of the Robbieverse. Only accessible with proper credentials.',
        npcs: ['robbie', 'president', 'security_guard'],
        activities: ['governance', 'strategy', 'leadership', 'decisions'],
        hashtags: ['#presidential', '#governance', '#strategy', '#leadership']
      }
    };
  }

  getDefaultNPCs() {
    return {
      'robbie': {
        name: 'Robbie',
        title: 'Growth-Obsessed COO',
        personality: 'Strategic, data-driven, growth-focused',
        greeting: 'Welcome to the Robbieverse! I\'m here to help you scale and optimize everything.',
        activities: ['strategy', 'growth', 'optimization', 'data_analysis'],
        language: 'business_english'
      },
      'dealer': {
        name: 'The Dealer',
        title: 'Casino Host',
        personality: 'Charming, risk-aware, strategic',
        greeting: 'Welcome to the high stakes table! Ready to bet on your business instincts?',
        activities: ['gambling', 'risk_assessment', 'strategy', 'entertainment'],
        language: 'casino_english'
      },
      'mentor_jesus': {
        name: 'Mentor Jesus',
        title: 'Spiritual & Business Mentor',
        personality: 'Wise, compassionate, historically grounded',
        greeting: 'Peace be with you, entrepreneur. Let me share wisdom that has stood the test of time.',
        activities: ['mentorship', 'wisdom', 'spiritual_guidance', 'historical_insights'],
        language: 'biblical_english'
      },
      'bartender': {
        name: 'Sam the Bartender',
        title: 'Pub Host & Story Collector',
        personality: 'Friendly, observant, well-connected',
        greeting: 'What\'ll it be? I\'ve heard every success story and failure in this town.',
        activities: ['drinks', 'stories', 'networking', 'advice'],
        language: 'pub_english'
      },
      'venture_capitalist': {
        name: 'Victoria Capital',
        title: 'Venture Capitalist',
        personality: 'Sharp, analytical, opportunity-focused',
        greeting: 'I\'m always looking for the next unicorn. What\'s your pitch?',
        activities: ['investment', 'pitching', 'analysis', 'networking'],
        language: 'vc_english'
      },
      'quiz_master': {
        name: 'Professor Quiz',
        title: 'Trivia Master',
        personality: 'Enthusiastic, knowledgeable, competitive',
        greeting: 'Ready to test your business acumen? The stakes are high, but the rewards are higher!',
        activities: ['trivia', 'education', 'competition', 'testing'],
        language: 'academic_english'
      }
    };
  }

  getDefaultMentors() {
    return {
      'mentor_jesus': {
        name: 'Mentor Jesus',
        expertise: ['leadership', 'ethics', 'servant_leadership', 'historical_wisdom'],
        language: 'biblical_english',
        personality: 'Compassionate, wise, historically grounded',
        greeting: 'Come, let us reason together about your business challenges.',
        specialties: ['moral_leadership', 'team_building', 'crisis_management', 'long_term_thinking']
      },
      'tech_guru': {
        name: 'Dr. Sarah Chen',
        expertise: ['technology', 'innovation', 'scalability', 'digital_transformation'],
        language: 'tech_english',
        personality: 'Innovative, analytical, future-focused',
        greeting: 'Technology is just a tool. The real magic is in how you use it to serve people.',
        specialties: ['ai_implementation', 'system_design', 'digital_strategy', 'tech_ethics']
      },
      'marketing_maven': {
        name: 'Marcus Brand',
        expertise: ['marketing', 'branding', 'customer_acquisition', 'growth_hacking'],
        language: 'marketing_english',
        personality: 'Creative, data-driven, customer-obsessed',
        greeting: 'Your brand is what people say about you when you\'re not in the room. Let\'s make it count.',
        specialties: ['brand_strategy', 'content_marketing', 'social_media', 'customer_psychology']
      },
      'finance_wizard': {
        name: 'Wendy Numbers',
        expertise: ['finance', 'accounting', 'fundraising', 'financial_modeling'],
        language: 'finance_english',
        personality: 'Precise, strategic, risk-aware',
        greeting: 'Numbers tell a story. Let me help you write the next chapter of your financial success.',
        specialties: ['fundraising', 'financial_planning', 'valuation', 'cash_flow_management']
      }
    };
  }

  // Generate town interface
  generateTownInterface() {
    return `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Robbieverse Town - Interactive Networking</title>
<style>
/* Town Interface Aesthetic */
:root {
  --bg-primary: #0a0a0a;
  --bg-secondary: #1a1a1a;
  --bg-tertiary: #2a2a2a;
  --text-primary: #00ff00;
  --text-secondary: #888888;
  --text-accent: #ffff00;
  --text-error: #ff0000;
  --text-success: #00ff00;
  --text-warning: #ffaa00;
  --border: #333333;
  --font-mono: 'Courier New', 'Monaco', 'Consolas', monospace;
  --mentor-gold: #ffd700;
  --npc-blue: #00aaff;
  --location-green: #00ff88;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body { 
  font-family: var(--font-mono);
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.4;
  overflow: hidden;
}

.container {
  display: flex;
  height: 100vh;
}

/* Location Panel */
.location-panel {
  width: 300px;
  background: var(--bg-secondary);
  border-right: 2px solid var(--border);
  display: flex;
  flex-direction: column;
}

.location-header {
  background: var(--bg-tertiary);
  padding: 15px;
  border-bottom: 1px solid var(--border);
}

.location-title {
  color: var(--location-green);
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}

.location-description {
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.3;
}

/* NPCs Panel */
.npcs-panel {
  padding: 15px;
  border-bottom: 1px solid var(--border);
}

.npcs-title {
  color: var(--text-accent);
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
}

.npc-item {
  display: flex;
  align-items: center;
  padding: 8px;
  margin-bottom: 5px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.npc-item:hover {
  background: var(--npc-blue);
  color: var(--bg-primary);
}

.npc-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--npc-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  font-size: 14px;
}

.npc-info {
  flex: 1;
}

.npc-name {
  font-weight: bold;
  font-size: 12px;
}

.npc-title {
  color: var(--text-secondary);
  font-size: 10px;
}

.npc-status {
  color: var(--text-success);
  font-size: 10px;
}

/* Locations List */
.locations-panel {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
}

.locations-title {
  color: var(--text-accent);
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
}

.location-item {
  padding: 10px;
  margin-bottom: 8px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.location-item:hover {
  background: var(--location-green);
  color: var(--bg-primary);
}

.location-item.current {
  background: var(--text-accent);
  color: var(--bg-primary);
}

.location-name {
  font-weight: bold;
  font-size: 12px;
  margin-bottom: 3px;
}

.location-desc {
  color: var(--text-secondary);
  font-size: 10px;
  line-height: 1.2;
}

/* Main Chat Area */
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.chat-header {
  background: var(--bg-secondary);
  padding: 10px 15px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chat-title {
  color: var(--text-accent);
  font-weight: bold;
}

.chat-status {
  color: var(--text-success);
  font-size: 12px;
}

.chat-messages {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  font-size: 13px;
}

.message {
  margin-bottom: 3px;
  display: flex;
  align-items: flex-start;
}

.message-timestamp {
  color: var(--text-secondary);
  margin-right: 8px;
  font-size: 11px;
  min-width: 60px;
}

.message-content {
  flex: 1;
}

.message-system {
  color: var(--text-warning);
  font-style: italic;
}

.message-npc {
  color: var(--npc-blue);
}

.message-mentor {
  color: var(--mentor-gold);
  font-weight: bold;
}

.message-user {
  color: var(--text-primary);
}

.message-announcement {
  color: var(--text-accent);
  font-weight: bold;
  text-align: center;
  padding: 10px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  margin: 10px 0;
}

/* Input Area */
.input-area {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 10px;
}

.input-prompt {
  color: var(--text-accent);
  margin-right: 5px;
  font-weight: bold;
}

.input-field {
  flex: 1;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 13px;
  padding: 5px 8px;
  outline: none;
}

.input-field:focus {
  border-color: var(--text-accent);
}

/* Commands Help */
.commands-help {
  position: fixed;
  top: 10px;
  right: 10px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  padding: 10px;
  border-radius: 3px;
  font-size: 11px;
  max-width: 200px;
  display: none;
}

.commands-help.show {
  display: block;
}

.command-item {
  margin-bottom: 3px;
}

.command-name {
  color: var(--text-accent);
  font-weight: bold;
}

.command-desc {
  color: var(--text-secondary);
}
</style>
</head><body>
  <div class="container">
    <!-- Location Panel -->
    <div class="location-panel">
      <div class="location-header">
        <div class="location-title" id="current-location">Town Square</div>
        <div class="location-description" id="location-description">The bustling heart of the Robbieverse. Entrepreneurs, investors, and innovators gather here.</div>
      </div>
      
      <div class="npcs-panel">
        <div class="npcs-title">👥 NPCs Here</div>
        <div id="npcs-list">
          <!-- NPCs will be populated here -->
        </div>
      </div>
      
      <div class="locations-panel">
        <div class="locations-title">🗺️ Locations</div>
        <div id="locations-list">
          <!-- Locations will be populated here -->
        </div>
      </div>
    </div>
    
    <!-- Main Chat Area -->
    <div class="chat-area">
      <div class="chat-header">
        <div class="chat-title">ROBBIEVERSE TOWN</div>
        <div class="chat-status">● ONLINE</div>
      </div>
      
      <div class="chat-messages" id="chat-messages">
        <div class="message">
          <span class="message-timestamp">[${new Date().toLocaleTimeString()}]</span>
          <div class="message-content">
            <div class="message-announcement">MENTOR JESUS HAS ENTERED THE CHAT...</div>
          </div>
        </div>
        <div class="message">
          <span class="message-timestamp">[${new Date().toLocaleTimeString()}]</span>
          <div class="message-content">
            <div class="message-mentor">Mentor Jesus: "Peace be with you, entrepreneur. I am here to share wisdom that has stood the test of time. What challenges are you facing in your business journey?"</div>
          </div>
        </div>
        <div class="message">
          <span class="message-timestamp">[${new Date().toLocaleTimeString()}]</span>
          <div class="message-content">
            <div class="message-npc">Robbie: "Welcome to the Robbieverse! I'm your growth-obsessed COO, ready to help you scale and optimize everything. Type /help for available commands."</div>
          </div>
        </div>
      </div>
      
      <div class="input-area">
        <span class="input-prompt">town></span>
        <input type="text" class="input-field" id="message-input" placeholder="Type your message or command..." autocomplete="off">
      </div>
    </div>
  </div>

  <!-- Commands Help -->
  <div class="commands-help" id="commands-help">
    <div class="command-item">
      <span class="command-name">/help</span> - Show this help
    </div>
    <div class="command-item">
      <span class="command-name">/join &lt;location&gt;</span> - Travel to location
    </div>
    <div class="command-item">
      <span class="command-name">/travel aurora</span> - Travel to Aurora (presidential)
    </div>
    <div class="command-item">
      <span class="command-name">/talk &lt;npc&gt;</span> - Talk to NPC
    </div>
    <div class="command-item">
      <span class="command-name">/mentor &lt;topic&gt;</span> - Request mentorship
    </div>
    <div class="command-item">
      <span class="command-name">/look</span> - Look around
    </div>
    <div class="command-item">
      <span class="command-name">/who</span> - Who's online
    </div>
  </div>

  <script>
    // Town System JavaScript
    let currentLocation = 'townsquare';
    let currentUser = 'allan';
    let messageHistory = [];
    let historyIndex = -1;

    // Location and NPC data
    const locations = ${JSON.stringify(this.locations)};
    const npcs = ${JSON.stringify(this.npcs)};
    const mentors = ${JSON.stringify(this.mentors)};

    // Initialize interface
    document.addEventListener('DOMContentLoaded', function() {
      const input = document.getElementById('message-input');
      input.focus();
      
      // Load current location
      loadLocation(currentLocation);
      loadNPCs();
      loadLocations();
      
      // Set up event listeners
      input.addEventListener('keydown', handleKeyDown);
      
      // Auto-refresh every 10 seconds
      setInterval(() => {
        loadNPCs();
        updateOnlineStatus();
      }, 10000);
    });

    function handleKeyDown(e) {
      if (e.key === 'Enter') {
        sendMessage();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateHistory(-1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateHistory(1);
      } else if (e.key === 'F1') {
        e.preventDefault();
        toggleHelp();
      }
    }

    function sendMessage() {
      const input = document.getElementById('message-input');
      const message = input.value.trim();
      
      if (!message) return;
      
      // Add to history
      messageHistory.unshift(message);
      if (messageHistory.length > 100) {
        messageHistory = messageHistory.slice(0, 100);
      }
      historyIndex = -1;
      
      // Process command or regular message
      if (message.startsWith('/')) {
        processCommand(message);
      } else {
        addMessage(currentUser, message, 'user');
        // NPCs might respond
        handleNPCAIResponse(message);
      }
      
      input.value = '';
    }

    function processCommand(command) {
      const parts = command.split(' ');
      const cmd = parts[0].toLowerCase();
      
      switch (cmd) {
        case '/help':
          toggleHelp();
          break;
        case '/join':
          if (parts[1]) {
            travelToLocation(parts[1]);
          } else {
            addMessage('system', 'Usage: /join &lt;location&gt;', 'system');
          }
          break;
        case '/travel':
          if (parts[1] === 'aurora') {
            travelToAurora();
          } else {
            addMessage('system', 'Aurora access requires presidential credentials.', 'system');
          }
          break;
        case '/talk':
          if (parts[1]) {
            talkToNPC(parts[1]);
          } else {
            addMessage('system', 'Usage: /talk &lt;npc_name&gt;', 'system');
          }
          break;
        case '/mentor':
          const topic = parts.slice(1).join(' ');
          requestMentorship(topic);
          break;
        case '/look':
          lookAround();
          break;
        case '/who':
          showWhoOnline();
          break;
        default:
          addMessage('system', 'Unknown command. Type /help for available commands.', 'system');
      }
    }

    function travelToLocation(locationName) {
      if (locations[locationName]) {
        currentLocation = locationName;
        loadLocation(locationName);
        addMessage('system', \`Traveled to \${locations[locationName].name}\`, 'system');
        loadNPCs();
      } else {
        addMessage('system', 'Location not found.', 'system');
      }
    }

    function travelToAurora() {
      // Check if user has presidential credentials
      if (currentUser === 'allan' || currentUser === 'president') {
        travelToLocation('aurora');
        addMessage('system', 'Presidential credentials verified. Welcome to Aurora.', 'system');
      } else {
        addMessage('system', 'Access denied. Presidential credentials required.', 'system');
      }
    }

    function talkToNPC(npcName) {
      const npc = npcs[npcName];
      if (npc && locations[currentLocation].npcs.includes(npcName)) {
        addMessage(npcName, npc.greeting, 'npc');
        
        // Generate contextual response based on location and user
        setTimeout(() => {
          const contextualResponse = generateNPCResponse(npc, currentLocation);
          addMessage(npcName, contextualResponse, 'npc');
        }, 1000);
      } else {
        addMessage('system', \`\${npcName} is not here or doesn't exist.\`, 'system');
      }
    }

    function requestMentorship(topic) {
      const availableMentors = locations[currentLocation].npcs.filter(npc => mentors[npc]);
      
      if (availableMentors.length > 0) {
        const mentorName = availableMentors[0];
        const mentor = mentors[mentorName];
        
        addMessage(mentorName, \`I'd be honored to mentor you on \${topic || 'your business journey'}. Let me share some wisdom...\`, 'mentor');
        
        // Generate mentor response
        setTimeout(() => {
          const mentorResponse = generateMentorResponse(mentor, topic);
          addMessage(mentorName, mentorResponse, 'mentor');
        }, 2000);
      } else {
        addMessage('system', 'No mentors available in this location. Try the Mentor Garden.', 'system');
      }
    }

    function lookAround() {
      const location = locations[currentLocation];
      addMessage('system', \`You are in \${location.name}. \${location.description}\`, 'system');
      addMessage('system', \`NPCs here: \${location.npcs.join(', ')}\`, 'system');
      addMessage('system', \`Activities: \${location.activities.join(', ')}\`, 'system');
    }

    function showWhoOnline() {
      addMessage('system', 'Online users:', 'system');
      addMessage('system', '- allan (you)', 'system');
      addMessage('system', '- robbie (NPC)', 'system');
      addMessage('system', '- mentor_jesus (NPC)', 'system');
    }

    function generateNPCResponse(npc, location) {
      const responses = {
        'robbie': [
          'Let me analyze your current metrics and suggest some optimizations...',
          'I\'m tracking your growth patterns. Here\'s what I\'m seeing...',
          'Based on the data, I recommend focusing on these key areas...'
        ],
        'dealer': [
          'The house always wins, but smart entrepreneurs know when to fold.',
          'I\'ve seen many fortunes made and lost at this table. What\'s your strategy?',
          'Risk is just opportunity in disguise. Are you ready to play?'
        ],
        'mentor_jesus': [
          'Consider the lilies of the field - they don\'t toil or spin, yet they are clothed in splendor.',
          'The greatest among you will be your servant. True leadership serves others.',
          'Do unto others as you would have them do unto you - this applies to business too.'
        ]
      };
      
      const npcResponses = responses[npc.name] || ['I\'m here to help. What do you need?'];
      return npcResponses[Math.floor(Math.random() * npcResponses.length)];
    }

    function generateMentorResponse(mentor, topic) {
      const responses = {
        'mentor_jesus': [
          'Remember, "Where your treasure is, there your heart will be also." Focus on what truly matters.',
          'The parable of the talents teaches us to invest wisely and multiply our gifts.',
          'Love your customers as yourself - this is the greatest commandment of business.'
        ],
        'tech_guru': [
          'Technology should serve humanity, not the other way around. How can we use tech to solve real problems?',
          'The best systems are invisible to users. Focus on the experience, not the technology.',
          'Innovation happens at the intersection of technology and human need.'
        ],
        'marketing_maven': [
          'Your brand is a promise. Make sure you can keep it.',
          'People don\'t buy products, they buy solutions to their problems.',
          'The best marketing doesn\'t feel like marketing - it feels like help.'
        ],
        'finance_wizard': [
          'Cash flow is the lifeblood of business. Monitor it like your health.',
          'Profit is an opinion, but cash is a fact. Focus on what\'s real.',
          'The best investment is in your team and your customers.'
        ]
      };
      
      const mentorResponses = responses[mentor.name] || ['I\'m here to share my experience. What would you like to know?'];
      return mentorResponses[Math.floor(Math.random() * mentorResponses.length)];
    }

    function handleNPCAIResponse(message) {
      // Simple AI response based on keywords
      if (message.toLowerCase().includes('help') || message.toLowerCase().includes('advice')) {
        setTimeout(() => {
          addMessage('robbie', 'I\'m here to help! What specific challenge are you facing?', 'npc');
        }, 1500);
      }
    }

    function addMessage(username, text, type = 'system') {
      const container = document.getElementById('chat-messages');
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message';
      
      const timestamp = new Date().toLocaleTimeString();
      messageDiv.innerHTML = \`
        <span class="message-timestamp">[\${timestamp}]</span>
        <div class="message-content">
          <div class="message-\${type}">\${username}: \${text}</div>
        </div>
      \`;
      
      container.appendChild(messageDiv);
      container.scrollTop = container.scrollHeight;
    }

    function loadLocation(locationName) {
      const location = locations[locationName];
      document.getElementById('current-location').textContent = location.name;
      document.getElementById('location-description').textContent = location.description;
    }

    function loadNPCs() {
      const container = document.getElementById('npcs-list');
      const location = locations[currentLocation];
      const npcsHere = location.npcs;
      
      container.innerHTML = npcsHere.map(npcName => {
        const npc = npcs[npcName];
        return \`
          <div class="npc-item" onclick="talkToNPC('\${npcName}')">
            <div class="npc-avatar">\${npcName.charAt(0).toUpperCase()}</div>
            <div class="npc-info">
              <div class="npc-name">\${npc.name}</div>
              <div class="npc-title">\${npc.title}</div>
              <div class="npc-status">● Available</div>
            </div>
          </div>
        \`;
      }).join('');
    }

    function loadLocations() {
      const container = document.getElementById('locations-list');
      
      container.innerHTML = Object.entries(locations).map(([key, location]) => \`
        <div class="location-item \${key === currentLocation ? 'current' : ''}" onclick="travelToLocation('\${key}')">
          <div class="location-name">\${location.name}</div>
          <div class="location-desc">\${location.description}</div>
        </div>
      \`).join('');
    }

    function toggleHelp() {
      const help = document.getElementById('commands-help');
      help.classList.toggle('show');
    }

    function navigateHistory(direction) {
      if (messageHistory.length === 0) return;
      
      historyIndex += direction;
      if (historyIndex < 0) historyIndex = 0;
      if (historyIndex >= messageHistory.length) historyIndex = messageHistory.length - 1;
      
      document.getElementById('message-input').value = messageHistory[historyIndex] || '';
    }

    function updateOnlineStatus() {
      // Update online status
      document.querySelector('.chat-status').textContent = '● ONLINE';
    }

    // Auto-scroll chat
    setInterval(() => {
      const container = document.getElementById('chat-messages');
      container.scrollTop = container.scrollHeight;
    }, 100);
  </script>
</body></html>`;
  }

  // Travel to location
  async travelToLocation(username, locationName) {
    try {
      if (!this.locations[locationName]) {
        throw new Error('Location not found');
      }

      // Check access permissions
      if (locationName === 'aurora' && !this.hasPresidentialAccess(username)) {
        throw new Error('Presidential credentials required for Aurora access');
      }

      // Update user session
      db.prepare(`
        INSERT OR REPLACE INTO user_sessions (id, username, current_location, last_seen, is_online)
        VALUES (?, ?, ?, datetime('now'), TRUE)
      `).run(randomUUID(), username, locationName);

      // Record visit
      db.prepare(`
        INSERT INTO location_visits (id, username, location)
        VALUES (?, ?, ?)
      `).run(randomUUID(), username, locationName);

      return {
        success: true,
        location: this.locations[locationName],
        message: `Traveled to ${this.locations[locationName].name}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Talk to NPC
  async talkToNPC(username, npcName, message = '') {
    try {
      const npc = this.npcs[npcName];
      if (!npc) {
        throw new Error('NPC not found');
      }

      // Record interaction
      db.prepare(`
        INSERT INTO npc_interactions (id, username, npc_name, interaction_type, interaction_data)
        VALUES (?, ?, ?, ?, ?)
      `).run(randomUUID(), username, npcName, 'chat', JSON.stringify({ message }));

      // Generate NPC response using AI
      const response = await this.generateNPCResponse(npc, message);
      
      return {
        success: true,
        npc: npc.name,
        response: response
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Generate NPC response using AI
  async generateNPCResponse(npc, userMessage) {
    try {
      const prompt = `
        You are ${npc.name}, a ${npc.title} in the Robbieverse town system.
        Personality: ${npc.personality}
        Language style: ${npc.language}
        
        User message: "${userMessage}"
        
        Respond in character, using your personality and language style.
        Keep responses concise but engaging (2-3 sentences max).
        Be helpful and business-focused.
      `;

      const response = await directGPU.generateText(prompt, {
        model: 'llama-maverick',
        temperature: 0.8,
        max_tokens: 150
      });

      return response.response;
    } catch (error) {
      console.error('Error generating NPC response:', error);
      return npc.greeting;
    }
  }

  // Request mentorship
  async requestMentorship(username, mentorName, topic) {
    try {
      const mentor = this.mentors[mentorName];
      if (!mentor) {
        throw new Error('Mentor not found');
      }

      // Record mentorship session
      db.prepare(`
        INSERT INTO mentor_sessions (id, username, mentor_name, topic)
        VALUES (?, ?, ?, ?)
      `).run(randomUUID(), username, mentorName, topic);

      // Generate mentor response
      const response = await this.generateMentorResponse(mentor, topic);
      
      return {
        success: true,
        mentor: mentor.name,
        response: response
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Generate mentor response
  async generateMentorResponse(mentor, topic) {
    try {
      const prompt = `
        You are ${mentor.name}, a ${mentor.expertise.join(', ')} expert and mentor.
        Personality: ${mentor.personality}
        Language style: ${mentor.language}
        Specialties: ${mentor.specialties.join(', ')}
        
        Topic: "${topic || 'general business advice'}"
        
        Provide wise, actionable mentorship in your character's voice.
        Be specific and practical (3-4 sentences).
        Draw from your expertise and historical wisdom.
      `;

      const response = await directGPU.generateText(prompt, {
        model: 'llama-maverick',
        temperature: 0.7,
        max_tokens: 200
      });

      return response.response;
    } catch (error) {
      console.error('Error generating mentor response:', error);
      return mentor.greeting;
    }
  }

  // Check presidential access
  hasPresidentialAccess(username) {
    return username === 'allan' || username === 'president';
  }

  // Get online users
  getOnlineUsers() {
    try {
      return db.prepare(`
        SELECT username, current_location, last_seen
        FROM user_sessions
        WHERE is_online = TRUE
        ORDER BY last_seen DESC
      `).all();
    } catch (error) {
      console.error('Error getting online users:', error);
      return [];
    }
  }

  // Get location statistics
  getLocationStats() {
    try {
      return db.prepare(`
        SELECT location, COUNT(*) as visits, AVG(visit_duration) as avg_duration
        FROM location_visits
        WHERE created_at >= datetime('now', '-7 days')
        GROUP BY location
        ORDER BY visits DESC
      `).all();
    } catch (error) {
      console.error('Error getting location stats:', error);
      return [];
    }
  }
}

// Singleton instance
export const townSystem = new TownSystem();
