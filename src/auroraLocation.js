// Aurora Location System
// Everyone starts in Aurora - the main town with public venues

class AuroraLocation {
  constructor(db, personalityIsolation) {
    this.db = db;
    this.personalityIsolation = personalityIsolation;
    
    this.auroraVenues = {
      'town_square': {
        name: 'Aurora Town Square',
        type: 'public',
        description: 'Central gathering place for announcements and general chat',
        privacy_level: 'public',
        flirty_allowed: false,
        sensitive_info_allowed: false,
        max_occupancy: 50,
        emoji: '🏛️'
      },
      
      'the_pub': {
        name: 'The Rusty Gear Pub',
        type: 'public',
        description: 'Casual hangout spot for team bonding and informal discussions',
        privacy_level: 'public',
        flirty_allowed: false,
        sensitive_info_allowed: false,
        max_occupancy: 20,
        emoji: '🍺'
      },
      
      'conference_room': {
        name: 'Aurora Conference Room',
        type: 'semi_private',
        description: 'Business meetings and team discussions',
        privacy_level: 'business',
        flirty_allowed: false,
        sensitive_info_allowed: 'business_only',
        max_occupancy: 10,
        emoji: '📊'
      },
      
      'allans_office': {
        name: 'Allan\'s Private Office',
        type: 'private',
        description: 'Allan\'s private workspace - invitation only',
        privacy_level: 'private',
        flirty_allowed: true,
        sensitive_info_allowed: true,
        max_occupancy: 3,
        emoji: '🏢',
        access_control: 'allan_only'
      },
      
      'dev_lab': {
        name: 'Development Laboratory',
        type: 'semi_private',
        description: 'Technical discussions and code reviews',
        privacy_level: 'technical',
        flirty_allowed: false,
        sensitive_info_allowed: 'technical_only',
        max_occupancy: 8,
        emoji: '⚗️'
      },
      
      'quiet_corner': {
        name: 'Quiet Corner Café',
        type: 'semi_private',
        description: 'Small group conversations and private chats',
        privacy_level: 'semi_private',
        flirty_allowed: false,
        sensitive_info_allowed: 'limited',
        max_occupancy: 4,
        emoji: '☕'
      }
    };

    this.currentOccupancy = new Map();
    this.userLocations = new Map();
    
    // Everyone starts in Aurora
    this.defaultLocation = 'town_square';
  }

  // Check privacy before sharing sensitive info
  async checkPrivacyForSensitiveInfo(userId, currentLocation, message) {
    const venue = this.auroraVenues[currentLocation];
    const occupancy = this.getCurrentOccupancy(currentLocation);
    
    // Check if message contains sensitive information
    const isSensitive = this.detectSensitiveInfo(message);
    
    if (!isSensitive) {
      return { privacy_check_needed: false, can_proceed: true };
    }

    // If sensitive info detected
    if (venue.privacy_level === 'public' || occupancy.length > 1) {
      return {
        privacy_check_needed: true,
        can_proceed: false,
        privacy_request: {
          question: "I may be sharing some sensitive info... Are we alone?",
          options: ['Yes', 'No'],
          current_location: venue.name,
          other_users: occupancy.filter(u => u !== userId),
          venue_type: venue.type
        }
      };
    }

    return { privacy_check_needed: false, can_proceed: true };
  }

  // Detect sensitive information
  detectSensitiveInfo(message) {
    const sensitiveKeywords = [
      'revenue', 'financial', 'debt', 'crisis', 'budget', 'personal',
      'private', 'confidential', 'internal', 'strategy', 'deal value',
      'bank', 'payment', 'vendor', 'cash flow', 'pipeline'
    ];

    const messageLower = message.toLowerCase();
    return sensitiveKeywords.some(keyword => messageLower.includes(keyword));
  }

  // Get current occupancy of a venue
  getCurrentOccupancy(venueId) {
    return this.currentOccupancy.get(venueId) || [];
  }

  // Move user to different venue
  async moveUserToVenue(userId, venueId) {
    const venue = this.auroraVenues[venueId];
    if (!venue) throw new Error(`Venue ${venueId} not found`);

    // Check access control
    if (venue.access_control === 'allan_only' && userId !== 'allan') {
      throw new Error(`${venue.name} is Allan's private office - invitation only`);
    }

    // Check occupancy
    const currentOccupancy = this.getCurrentOccupancy(venueId);
    if (currentOccupancy.length >= venue.max_occupancy) {
      throw new Error(`${venue.name} is at capacity (${venue.max_occupancy} users)`);
    }

    // Remove from previous location
    const previousLocation = this.userLocations.get(userId);
    if (previousLocation) {
      this.removeUserFromVenue(userId, previousLocation);
    }

    // Add to new location
    this.addUserToVenue(userId, venueId);

    // Log movement
    await this.logUserMovement(userId, previousLocation, venueId);

    return {
      success: true,
      previous_location: previousLocation,
      new_location: venueId,
      venue: venue,
      occupancy: this.getCurrentOccupancy(venueId)
    };
  }

  // Add user to venue
  addUserToVenue(userId, venueId) {
    const occupancy = this.getCurrentOccupancy(venueId);
    occupancy.push(userId);
    this.currentOccupancy.set(venueId, occupancy);
    this.userLocations.set(userId, venueId);
  }

  // Remove user from venue
  removeUserFromVenue(userId, venueId) {
    const occupancy = this.getCurrentOccupancy(venueId);
    const filtered = occupancy.filter(u => u !== userId);
    this.currentOccupancy.set(venueId, filtered);
  }

  // Generate Aurora town interface
  generateAuroraInterfaceHTML() {
    return `
      <div class="tp-aurora-town">
        <div class="tp-town-header">
          <h2>🏛️ Aurora - Main Town</h2>
          <div class="tp-location-info">
            <span class="tp-current-location" id="currentLocation">
              ${this.getVenueEmoji('town_square')} Town Square
            </span>
            <span class="tp-occupancy" id="currentOccupancy">
              👥 ${this.getCurrentOccupancy('town_square').length} people
            </span>
          </div>
        </div>

        <div class="tp-town-map">
          ${Object.entries(this.auroraVenues).map(([venueId, venue]) => 
            this.generateVenueCard(venueId, venue)
          ).join('')}
        </div>

        <div class="tp-location-chat" id="locationChat">
          <div class="tp-chat-header">
            <h3>💬 ${this.auroraVenues['town_square'].name}</h3>
            <div class="tp-chat-occupancy">
              ${this.generateOccupancyList('town_square')}
            </div>
          </div>
          
          <div class="tp-chat-messages" id="chatMessages">
            <!-- Messages will appear here -->
          </div>
          
          <div class="tp-chat-input">
            <input type="text" id="messageInput" placeholder="Type your message...">
            <button onclick="sendLocationMessage()" class="tp-btn-send">Send</button>
          </div>
        </div>

        <div class="tp-privacy-indicator" id="privacyIndicator">
          <span class="tp-privacy-level">🔓 Public Venue</span>
          <span class="tp-privacy-warning">No flirty mode or sensitive info</span>
        </div>
      </div>
    `;
  }

  // Generate venue card
  generateVenueCard(venueId, venue) {
    const occupancy = this.getCurrentOccupancy(venueId);
    const isCurrentLocation = this.userLocations.get('allan') === venueId;
    
    return `
      <div class="tp-venue-card ${isCurrentLocation ? 'tp-current' : ''}" 
           data-venue="${venueId}"
           onclick="moveToVenue('${venueId}')">
        
        <div class="tp-venue-header">
          <span class="tp-venue-emoji">${venue.emoji}</span>
          <span class="tp-venue-name">${venue.name}</span>
          <span class="tp-venue-occupancy">${occupancy.length}/${venue.max_occupancy}</span>
        </div>

        <div class="tp-venue-description">
          ${venue.description}
        </div>

        <div class="tp-venue-privacy">
          <span class="tp-privacy-badge tp-${venue.privacy_level}">
            ${venue.privacy_level.replace('_', ' ')}
          </span>
          ${venue.flirty_allowed ? '<span class="tp-flirty-badge">💕 Flirty OK</span>' : ''}
        </div>

        <div class="tp-venue-occupants">
          ${occupancy.slice(0, 3).map(userId => `
            <span class="tp-occupant">${this.getUserDisplayName(userId)}</span>
          `).join('')}
          ${occupancy.length > 3 ? `<span class="tp-more">+${occupancy.length - 3} more</span>` : ''}
        </div>
      </div>
    `;
  }

  // Generate occupancy list
  generateOccupancyList(venueId) {
    const occupancy = this.getCurrentOccupancy(venueId);
    
    if (occupancy.length === 0) {
      return '<span class="tp-empty-venue">Empty venue</span>';
    }

    return occupancy.map(userId => `
      <span class="tp-occupant-badge">
        <span class="tp-occupant-emoji">${this.getUserEmoji(userId)}</span>
        <span class="tp-occupant-name">${this.getUserDisplayName(userId)}</span>
      </span>
    `).join('');
  }

  // Helper methods
  getVenueEmoji(venueId) {
    return this.auroraVenues[venueId]?.emoji || '📍';
  }

  getUserDisplayName(userId) {
    const displayNames = {
      'allan': 'Allan',
      'tom_mustapic': 'Tom',
      'kristina_mustapic': 'Kristina',
      'isabel_mendez': 'Isabel',
      'ed_escobar': 'Ed',
      'david_ahuja': 'David A.',
      'david_fish': 'David F.',
      'marcus_chen': 'Marcus'
    };
    return displayNames[userId] || userId;
  }

  getUserEmoji(userId) {
    const userEmojis = {
      'allan': '👑',
      'tom_mustapic': '💰',
      'kristina_mustapic': '📋',
      'isabel_mendez': '📈',
      'ed_escobar': '⚙️',
      'david_ahuja': '🎯',
      'david_fish': '📊',
      'marcus_chen': '👨‍💻'
    };
    return userEmojis[userId] || '👤';
  }

  // Log user movement
  async logUserMovement(userId, fromVenue, toVenue) {
    await this.db.run(`
      INSERT INTO user_movements (
        user_id, from_venue, to_venue, moved_at
      ) VALUES (?, ?, ?, ?)
    `, [userId, fromVenue, toVenue, new Date().toISOString()]);
  }

  // Initialize Aurora with all users
  async initializeAurora() {
    console.log('🏛️ Initializing Aurora - Main Town...');
    
    // Place all users in town square initially
    const allUsers = ['allan', 'tom_mustapic', 'kristina_mustapic', 'isabel_mendez', 'ed_escobar', 'david_ahuja', 'david_fish', 'marcus_chen'];
    
    for (const userId of allUsers) {
      this.addUserToVenue(userId, 'town_square');
    }

    await this.initializeTables();
    
    console.log(`✅ Aurora initialized - ${allUsers.length} users in Town Square`);
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS aurora_venues (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        privacy_level TEXT NOT NULL,
        flirty_allowed BOOLEAN DEFAULT FALSE,
        sensitive_info_allowed TEXT DEFAULT 'none',
        max_occupancy INTEGER DEFAULT 10,
        emoji TEXT DEFAULT '📍'
      );

      CREATE TABLE IF NOT EXISTS user_locations (
        user_id TEXT PRIMARY KEY,
        current_venue TEXT NOT NULL,
        last_moved DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (current_venue) REFERENCES aurora_venues (id)
      );

      CREATE TABLE IF NOT EXISTS user_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        from_venue TEXT,
        to_venue TEXT NOT NULL,
        moved_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS venue_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venue_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        message TEXT NOT NULL,
        message_type TEXT DEFAULT 'chat',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (venue_id) REFERENCES aurora_venues (id)
      );

      CREATE INDEX IF NOT EXISTS idx_user_locations_venue ON user_locations (current_venue);
      CREATE INDEX IF NOT EXISTS idx_user_movements_user ON user_movements (user_id, moved_at DESC);
      CREATE INDEX IF NOT EXISTS idx_venue_messages_venue ON venue_messages (venue_id, timestamp DESC);
    `);

    // Insert venue data
    for (const [venueId, venue] of Object.entries(this.auroraVenues)) {
      await this.db.run(`
        INSERT OR IGNORE INTO aurora_venues (
          id, name, type, description, privacy_level, 
          flirty_allowed, sensitive_info_allowed, max_occupancy, emoji
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        venueId,
        venue.name,
        venue.type,
        venue.description,
        venue.privacy_level,
        venue.flirty_allowed,
        venue.sensitive_info_allowed,
        venue.max_occupancy,
        venue.emoji
      ]);
    }
  }
}

module.exports = AuroraLocation;
