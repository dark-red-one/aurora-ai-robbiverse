// Location Awareness System for Team Members
// Provides custom narratives about Allan's current status based on who's looking

const { execAsync } = require('child_process');
const { promisify } = require('util');

class LocationAwarenessSystem {
  constructor(db) {
    this.db = db;
    this.currentStatus = {
      location: 'Unknown',
      activity: 'Working',
      availability: 'Busy',
      lastUpdate: new Date(),
      context: '',
      priority: 'normal'
    };
    this.teamMembers = {
      'lisa': {
        name: 'Lisa Peretz',
        role: 'wife',
        relationship: 'personal',
        interests: ['family', 'health', 'work-life balance', 'travel'],
        communication_style: 'caring, direct, family-focused'
      },
      'tom': {
        name: 'Tom',
        role: 'sales_team',
        relationship: 'professional',
        interests: ['sales', 'revenue', 'client_meetings', 'business_development'],
        communication_style: 'business-focused, results-oriented'
      },
      'kristina': {
        name: 'Kristina',
        role: 'sales_team',
        relationship: 'professional',
        interests: ['sales', 'marketing', 'client_relationships', 'team_coordination'],
        communication_style: 'collaborative, detail-oriented'
      }
    };
  }

  // Update Allan's current status
  async updateStatus(statusData) {
    this.currentStatus = {
      ...this.currentStatus,
      ...statusData,
      lastUpdate: new Date()
    };

    // Store in database
    await this.db.run(`
      INSERT INTO location_updates (location, activity, availability, context, priority, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      this.currentStatus.location,
      this.currentStatus.activity,
      this.currentStatus.availability,
      this.currentStatus.context,
      this.currentStatus.priority,
      this.currentStatus.lastUpdate.toISOString()
    ]);

    // Notify team members
    await this.notifyTeamMembers();
  }

  // Generate custom narrative based on team member
  generateNarrative(teamMemberId) {
    const member = this.teamMembers[teamMemberId];
    if (!member) return this.getGenericNarrative();

    const status = this.currentStatus;
    const timeAgo = this.getTimeAgo(status.lastUpdate);

    switch (member.role) {
      case 'wife':
        return this.generateWifeNarrative(status, timeAgo);
      case 'sales_team':
        return this.generateSalesNarrative(status, timeAgo, member);
      default:
        return this.getGenericNarrative();
    }
  }

  generateWifeNarrative(status, timeAgo) {
    const narratives = {
      'in_meeting': [
        `Allan's in a meeting right now - he's been heads down on some important calls. I'll make sure he takes a break soon! 💪`,
        `He's currently in a meeting but should be wrapping up soon. I know he's been working hard on that revenue push you mentioned.`,
        `Allan's in a meeting - looks like it's going well based on his energy level. He'll probably want to tell you about it later!`
      ],
      'working': [
        `Allan's deep in work mode right now - he's been really focused on getting things moving. I can tell he's feeling the pressure but staying positive!`,
        `He's working hard on the business stuff. I can see he's making progress on those client calls you were worried about.`,
        `Allan's in work mode - he seems determined to turn things around. I'm keeping an eye on him to make sure he doesn't burn out.`
      ],
      'traveling': [
        `Allan's traveling right now - he should be back soon. I know he's been looking forward to being home with you!`,
        `He's on the road but staying connected. I can tell he misses you and can't wait to be back.`,
        `Allan's traveling - he's been checking in regularly and seems to be handling everything well.`
      ],
      'at_grocery': [
        `Allan's at the grocery store - he mentioned wanting to surprise you with something nice for dinner! 🛒`,
        `He's doing some shopping right now. I think he's trying to take care of some errands so you don't have to worry about them.`,
        `Allan's at the store - he's been really thoughtful about picking up things you might need.`
      ],
      'unavailable': [
        `Allan's taking some time to himself right now - he's been under a lot of pressure and needed a moment. I'll let him know you're thinking of him.`,
        `He's stepped away for a bit - probably dealing with some of that stress from work. I'm keeping an eye on him.`,
        `Allan's taking a break - he's been working so hard, I think he just needed to clear his head.`
      ]
    };

    const activityNarratives = narratives[status.activity] || narratives['working'];
    const selectedNarrative = activityNarratives[Math.floor(Math.random() * activityNarratives.length)];
    
    return {
      narrative: selectedNarrative,
      emoji: this.getStatusEmoji(status.activity),
      priority: status.priority,
      lastSeen: timeAgo,
      context: status.context
    };
  }

  generateSalesNarrative(status, timeAgo, member) {
    const narratives = {
      'in_meeting': [
        `Allan's in a client meeting right now - looks like it could be a good one based on his prep work. He's been really focused on closing some deals.`,
        `He's currently in a meeting with a potential client. I can tell he's feeling confident about this one - he's been preparing all week.`,
        `Allan's in a sales meeting - he's been working on this opportunity for a while. Fingers crossed it goes well!`
      ],
      'working': [
        `Allan's deep in sales mode right now - he's been making calls and following up on leads. I can see he's making progress on the pipeline.`,
        `He's working on sales stuff - been really focused on those follow-ups you mentioned. Looks like he's got some momentum going.`,
        `Allan's in work mode - he's been hitting the phones hard and I can tell he's feeling optimistic about the numbers.`
      ],
      'traveling': [
        `Allan's traveling for business - he's got some important meetings lined up. He's been really focused on making this trip count.`,
        `He's on the road for work - looks like he's got a full schedule of client meetings. I can tell he's excited about the opportunities.`,
        `Allan's traveling for sales meetings - he's been preparing for these calls and seems confident about the outcomes.`
      ],
      'at_grocery': [
        `Allan's taking a quick break to run some errands - he's been working so hard, I think he needed to step away for a moment.`,
        `He's handling some personal stuff right now - probably trying to clear his head before jumping back into sales calls.`,
        `Allan's taking care of some errands - he's been really focused on work, so this is probably a good mental break.`
      ],
      'unavailable': [
        `Allan's taking some time to himself - he's been under a lot of pressure with the sales targets. I'll make sure he gets back to you soon.`,
        `He's stepped away for a bit - probably dealing with some of that stress from the revenue push. I'm keeping an eye on him.`,
        `Allan's taking a break - he's been working so hard on sales, I think he just needed to clear his head.`
      ]
    };

    const activityNarratives = narratives[status.activity] || narratives['working'];
    const selectedNarrative = activityNarratives[Math.floor(Math.random() * activityNarratives.length)];
    
    return {
      narrative: selectedNarrative,
      emoji: this.getStatusEmoji(status.activity),
      priority: status.priority,
      lastSeen: timeAgo,
      context: status.context,
      businessContext: this.getBusinessContext(status)
    };
  }

  getGenericNarrative() {
    return {
      narrative: `Allan is currently ${this.currentStatus.activity}. Last updated ${this.getTimeAgo(this.currentStatus.lastUpdate)}.`,
      emoji: this.getStatusEmoji(this.currentStatus.activity),
      priority: this.currentStatus.priority,
      lastSeen: this.getTimeAgo(this.currentStatus.lastUpdate),
      context: this.currentStatus.context
    };
  }

  getStatusEmoji(activity) {
    const emojis = {
      'in_meeting': '📞',
      'working': '💻',
      'traveling': '✈️',
      'at_grocery': '🛒',
      'unavailable': '😴',
      'busy': '⚡',
      'available': '✅'
    };
    return emojis[activity] || '🤔';
  }

  getTimeAgo(timestamp) {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  getBusinessContext(status) {
    const contexts = {
      'in_meeting': 'Client meeting in progress',
      'working': 'Active sales work',
      'traveling': 'Business travel',
      'at_grocery': 'Personal break',
      'unavailable': 'Taking time off'
    };
    return contexts[status.activity] || 'Status unknown';
  }

  // Get location status for a specific team member
  async getStatusForMember(teamMemberId) {
    const narrative = this.generateNarrative(teamMemberId);
    
    return {
      ...narrative,
      timestamp: this.currentStatus.lastUpdate,
      rawStatus: this.currentStatus,
      teamMember: this.teamMembers[teamMemberId]?.name || 'Unknown'
    };
  }

  // Record feedback on location updates
  async recordFeedback(teamMemberId, feedback, updateId) {
    await this.db.run(`
      INSERT INTO location_feedback (team_member_id, update_id, feedback, timestamp, narrative_shown)
      VALUES (?, ?, ?, ?, ?)
    `, [
      teamMemberId,
      updateId,
      feedback, // 'thumbs_up' or 'thumbs_down'
      new Date().toISOString(),
      JSON.stringify(this.generateNarrative(teamMemberId))
    ]);

    // If negative feedback, schedule follow-up
    if (feedback === 'thumbs_down') {
      await this.scheduleFollowUp(teamMemberId, updateId);
    }
  }

  // Schedule AI follow-up for negative feedback
  async scheduleFollowUp(teamMemberId, updateId) {
    const member = this.teamMembers[teamMemberId];
    const update = await this.getUpdateById(updateId);
    
    // Schedule follow-up for 2 hours later
    const followUpTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
    
    await this.db.run(`
      INSERT INTO follow_up_tasks (team_member_id, update_id, scheduled_time, status, follow_up_type)
      VALUES (?, ?, ?, ?, ?)
    `, [
      teamMemberId,
      updateId,
      followUpTime.toISOString(),
      'pending',
      'location_feedback'
    ]);
  }

  // Process follow-up tasks
  async processFollowUps() {
    const pendingFollowUps = await this.db.all(`
      SELECT * FROM follow_up_tasks 
      WHERE status = 'pending' AND scheduled_time <= ?
    `, [new Date().toISOString()]);

    for (const followUp of pendingFollowUps) {
      await this.executeFollowUp(followUp);
    }
  }

  // Execute follow-up conversation
  async executeFollowUp(followUp) {
    const member = this.teamMembers[followUp.team_member_id];
    const update = await this.getUpdateById(followUp.update_id);
    const originalNarrative = JSON.parse(followUp.narrative_shown || '{}');

    const followUpMessage = this.generateFollowUpMessage(member, update, originalNarrative);
    
    // Send follow-up (this would integrate with your chat system)
    await this.sendFollowUpMessage(followUp.team_member_id, followUpMessage);
    
    // Mark as completed
    await this.db.run(`
      UPDATE follow_up_tasks SET status = 'completed' WHERE id = ?
    `, [followUp.id]);
  }

  generateFollowUpMessage(member, update, originalNarrative) {
    const followUps = {
      'wife': [
        `Hey Lisa! I noticed you didn't like my update about Allan's ${update.activity}. What was that about? I want to make sure I'm giving you the right information.`,
        `Hi Lisa! I saw you gave a thumbs down to my update about Allan. Was there something specific that didn't seem right? I'd love to improve how I communicate with you.`,
        `Hey! I noticed you weren't happy with my update about Allan's status. Can you help me understand what I got wrong? I want to be more helpful to you.`
      ],
      'sales_team': [
        `Hey! I noticed you didn't like my update about Allan's ${update.activity}. What was off about it? I want to make sure I'm giving you the business context you need.`,
        `Hi! I saw you gave a thumbs down to my Allan update. Was there something about the business context that didn't seem right? I'd love to improve my reporting.`,
        `Hey! I noticed you weren't satisfied with my update about Allan's status. Can you help me understand what information you were looking for?`
      ]
    };

    const memberFollowUps = followUps[member.role] || followUps['sales_team'];
    return memberFollowUps[Math.floor(Math.random() * memberFollowUps.length)];
  }

  // Notify team members of status updates
  async notifyTeamMembers() {
    // This would integrate with your notification system
    // For now, just log the updates
    console.log('Location update:', this.currentStatus);
  }

  // Send follow-up message (integrate with your chat system)
  async sendFollowUpMessage(teamMemberId, message) {
    // This would integrate with your chat/notification system
    console.log(`Follow-up to ${teamMemberId}: ${message}`);
  }

  // Get update by ID
  async getUpdateById(updateId) {
    const result = await this.db.get(`
      SELECT * FROM location_updates WHERE id = ?
    `, [updateId]);
    return result;
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS location_updates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        location TEXT NOT NULL,
        activity TEXT NOT NULL,
        availability TEXT NOT NULL,
        context TEXT,
        priority TEXT DEFAULT 'normal',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS location_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_member_id TEXT NOT NULL,
        update_id INTEGER NOT NULL,
        feedback TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        narrative_shown TEXT,
        FOREIGN KEY (update_id) REFERENCES location_updates (id)
      );

      CREATE TABLE IF NOT EXISTS follow_up_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_member_id TEXT NOT NULL,
        update_id INTEGER NOT NULL,
        scheduled_time DATETIME NOT NULL,
        status TEXT DEFAULT 'pending',
        follow_up_type TEXT NOT NULL,
        narrative_shown TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (update_id) REFERENCES location_updates (id)
      );

      CREATE INDEX IF NOT EXISTS idx_location_feedback_member ON location_feedback (team_member_id);
      CREATE INDEX IF NOT EXISTS idx_follow_up_tasks_scheduled ON follow_up_tasks (scheduled_time, status);
    `);
  }
}

module.exports = LocationAwarenessSystem;
