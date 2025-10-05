// Team Polling System - Anonymous voting with live streaming
// Data collection for model training and team engagement

const { WebSocket } = require('ws');

class TeamPollingSystem {
  constructor(db) {
    this.db = db;
    this.activePolls = new Map();
    this.voteStreams = new Map();
    this.teamMembers = {
      'tom_mustapic': {
        name: 'Tom Mustapic',
        role: 'Head of Revenue',
        email: 'tom@testpilotcpg.com',
        permissions: ['vote', 'view_results', 'create_polls']
      },
      'kristina_mustapic': {
        name: 'Kristina Mustapic',
        role: 'Account Manager',
        email: 'kristina@testpilotcpg.com',
        permissions: ['vote', 'view_results']
      },
      'isabel_mendez': {
        name: 'Isabel Mendez',
        role: 'Marketing Lead',
        email: 'isabel@testpilotcpg.com',
        permissions: ['vote', 'view_results', 'create_polls']
      },
      'ed_escobar': {
        name: 'Ed Escobar',
        role: 'Co-founder / CTO',
        email: 'ed@testpilotcpg.com',
        permissions: ['vote', 'view_results', 'create_polls', 'admin']
      },
      'david_ahuja': {
        name: 'David Ahuja',
        role: 'Advisor',
        email: 'david.ahuja@testpilotcpg.com',
        permissions: ['vote', 'view_results']
      },
      'david_fish': {
        name: 'David Fish',
        role: 'Advisor',
        email: 'david.fish@testpilotcpg.com',
        permissions: ['vote', 'view_results']
      }
    };
  }

  // Create a new poll
  async createPoll(pollData) {
    const poll = {
      id: `poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question: pollData.question,
      options: pollData.options,
      type: pollData.type || 'binary', // binary, multiple_choice, rating
      details_link: pollData.details_link,
      created_by: pollData.created_by,
      created_at: new Date().toISOString(),
      expires_at: pollData.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      total_votes: 0,
      results: {},
      anonymous_votes: [],
      live_stream_enabled: true
    };

    // Initialize results for each option
    poll.options.forEach(option => {
      poll.results[option.id] = {
        text: option.text,
        votes: 0,
        percentage: 0
      };
    });

    // Store in database
    await this.db.run(`
      INSERT INTO team_polls (
        id, question, options, type, details_link, created_by, 
        created_at, expires_at, status, total_votes, results
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      poll.id,
      poll.question,
      JSON.stringify(poll.options),
      poll.type,
      poll.details_link,
      poll.created_by,
      poll.created_at,
      poll.expires_at,
      poll.status,
      poll.total_votes,
      JSON.stringify(poll.results)
    ]);

    // Add to active polls
    this.activePolls.set(poll.id, poll);

    // Start live stream
    this.startLiveStream(poll.id);

    return poll;
  }

  // Create daily poll automatically
  async createDailyPoll() {
    const dailyQuestions = [
      {
        question: "Will we sign a contract with Simply Good Foods this week?",
        details_link: "https://testpilotcpg.com/simply-good-deal",
        options: [
          { id: 'yes', text: 'Yes', emoji: '✅' },
          { id: 'no', text: 'No', emoji: '❌' }
        ]
      },
      {
        question: "How confident are you in our Q4 revenue targets?",
        details_link: "https://testpilotcpg.com/q4-targets",
        options: [
          { id: 'very_confident', text: 'Very Confident', emoji: '🚀' },
          { id: 'confident', text: 'Confident', emoji: '👍' },
          { id: 'neutral', text: 'Neutral', emoji: '🤔' },
          { id: 'concerned', text: 'Concerned', emoji: '😟' }
        ]
      },
      {
        question: "Should we prioritize the Bayer partnership this week?",
        details_link: "https://testpilotcpg.com/bayer-partnership",
        options: [
          { id: 'yes', text: 'Yes, high priority', emoji: '🔥' },
          { id: 'maybe', text: 'Maybe, medium priority', emoji: '⚡' },
          { id: 'no', text: 'No, focus elsewhere', emoji: '📋' }
        ]
      },
      {
        question: "Rate our current team productivity level",
        details_link: "https://testpilotcpg.com/team-metrics",
        options: [
          { id: 'excellent', text: 'Excellent', emoji: '🌟' },
          { id: 'good', text: 'Good', emoji: '👍' },
          { id: 'average', text: 'Average', emoji: '😐' },
          { id: 'needs_improvement', text: 'Needs Improvement', emoji: '📈' }
        ]
      }
    ];

    // Select random question for today
    const todayQuestion = dailyQuestions[Math.floor(Math.random() * dailyQuestions.length)];
    
    const poll = await this.createPoll({
      question: todayQuestion.question,
      options: todayQuestion.options,
      type: 'binary',
      details_link: todayQuestion.details_link,
      created_by: 'robbie_system',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

    console.log(`📊 Daily poll created: ${poll.question}`);
    return poll;
  }

  // Submit a vote
  async submitVote(pollId, userId, optionId, metadata = {}) {
    const poll = this.activePolls.get(pollId);
    if (!poll) {
      throw new Error('Poll not found');
    }

    if (poll.status !== 'active') {
      throw new Error('Poll is not active');
    }

    if (new Date() > new Date(poll.expires_at)) {
      throw new Error('Poll has expired');
    }

    // Check if user already voted
    const existingVote = await this.db.get(`
      SELECT * FROM poll_votes 
      WHERE poll_id = ? AND user_id = ?
    `, [pollId, userId]);

    if (existingVote) {
      throw new Error('User has already voted on this poll');
    }

    // Record vote in database
    await this.db.run(`
      INSERT INTO poll_votes (
        poll_id, user_id, option_id, voted_at, metadata
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      pollId,
      userId,
      optionId,
      new Date().toISOString(),
      JSON.stringify(metadata)
    ]);

    // Update poll results
    poll.total_votes++;
    poll.results[optionId].votes++;
    
    // Recalculate percentages
    Object.keys(poll.results).forEach(optionId => {
      poll.results[optionId].percentage = 
        Math.round((poll.results[optionId].votes / poll.total_votes) * 100);
    });

    // Update database
    await this.db.run(`
      UPDATE team_polls 
      SET total_votes = ?, results = ?
      WHERE id = ?
    `, [poll.total_votes, JSON.stringify(poll.results), pollId]);

    // Add to anonymous vote stream
    const anonymousVote = {
      id: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      option_id: optionId,
      option_text: poll.results[optionId].text,
      emoji: poll.options.find(opt => opt.id === optionId)?.emoji || '📊',
      timestamp: new Date().toISOString(),
      poll_id: pollId
    };

    poll.anonymous_votes.push(anonymousVote);

    // Broadcast live update
    this.broadcastVoteUpdate(pollId, anonymousVote, poll);

    // Check if poll is complete
    if (poll.total_votes >= Object.keys(this.teamMembers).length) {
      await this.completePoll(pollId);
    }

    return {
      success: true,
      poll_id: pollId,
      option_id: optionId,
      total_votes: poll.total_votes,
      results: poll.results
    };
  }

  // Start live stream for a poll
  startLiveStream(pollId) {
    const poll = this.activePolls.get(pollId);
    if (!poll) return;

    // Create live stream data
    const stream = {
      poll_id: pollId,
      question: poll.question,
      options: poll.options,
      total_votes: poll.total_votes,
      results: poll.results,
      anonymous_votes: poll.anonymous_votes,
      live_updates: [],
      participants: new Set()
    };

    this.voteStreams.set(pollId, stream);
  }

  // Broadcast vote update to all connected clients
  broadcastVoteUpdate(pollId, vote, poll) {
    const stream = this.voteStreams.get(pollId);
    if (!stream) return;

    // Add to live updates
    stream.live_updates.push({
      type: 'vote_cast',
      vote: vote,
      total_votes: poll.total_votes,
      results: poll.results,
      timestamp: new Date().toISOString()
    });

    // Broadcast to all connected clients
    this.broadcastToClients(pollId, {
      type: 'vote_update',
      poll_id: pollId,
      vote: vote,
      total_votes: poll.total_votes,
      results: poll.results,
      participation_rate: this.calculateParticipationRate(pollId)
    });
  }

  // Calculate participation rate
  calculateParticipationRate(pollId) {
    const poll = this.activePolls.get(pollId);
    if (!poll) return 0;

    const totalTeamMembers = Object.keys(this.teamMembers).length;
    return Math.round((poll.total_votes / totalTeamMembers) * 100);
  }

  // Get live poll data
  getLivePollData(pollId) {
    const poll = this.activePolls.get(pollId);
    const stream = this.voteStreams.get(pollId);
    
    if (!poll || !stream) return null;

    return {
      poll: {
        id: poll.id,
        question: poll.question,
        options: poll.options,
        details_link: poll.details_link,
        status: poll.status,
        expires_at: poll.expires_at
      },
      results: poll.results,
      total_votes: poll.total_votes,
      participation_rate: this.calculateParticipationRate(pollId),
      anonymous_votes: poll.anonymous_votes.slice(-10), // Last 10 votes
      live_updates: stream.live_updates.slice(-20) // Last 20 updates
    };
  }

  // Complete a poll
  async completePoll(pollId) {
    const poll = this.activePolls.get(pollId);
    if (!poll) return;

    poll.status = 'completed';
    
    // Update database
    await this.db.run(`
      UPDATE team_polls 
      SET status = 'completed', completed_at = ?
      WHERE id = ?
    `, [new Date().toISOString(), pollId]);

    // Broadcast completion
    this.broadcastToClients(pollId, {
      type: 'poll_completed',
      poll_id: pollId,
      final_results: poll.results,
      total_votes: poll.total_votes,
      participation_rate: this.calculateParticipationRate(pollId)
    });

    // Generate insights
    await this.generatePollInsights(pollId);

    console.log(`✅ Poll completed: ${poll.question} (${poll.total_votes} votes)`);
  }

  // Generate insights from poll data
  async generatePollInsights(pollId) {
    const poll = this.activePolls.get(pollId);
    if (!poll) return;

    const insights = {
      poll_id: pollId,
      question: poll.question,
      total_votes: poll.total_votes,
      participation_rate: this.calculateParticipationRate(pollId),
      winning_option: Object.keys(poll.results).reduce((a, b) => 
        poll.results[a].votes > poll.results[b].votes ? a : b
      ),
      consensus_level: this.calculateConsensusLevel(poll.results),
      insights: []
    };

    // Analyze consensus
    if (insights.consensus_level > 80) {
      insights.insights.push({
        type: 'high_consensus',
        message: `Strong team consensus (${insights.consensus_level}%) on this question`,
        confidence: 'high'
      });
    } else if (insights.consensus_level < 50) {
      insights.insights.push({
        type: 'low_consensus',
        message: `Mixed team opinions (${insights.consensus_level}% consensus) - may need discussion`,
        confidence: 'medium'
      });
    }

    // Analyze participation
    if (insights.participation_rate < 60) {
      insights.insights.push({
        type: 'low_participation',
        message: `Only ${insights.participation_rate}% of team participated - consider follow-up`,
        confidence: 'medium'
      });
    }

    // Store insights
    await this.db.run(`
      INSERT INTO poll_insights (
        poll_id, insights_data, generated_at
      ) VALUES (?, ?, ?)
    `, [
      pollId,
      JSON.stringify(insights),
      new Date().toISOString()
    ]);

    return insights;
  }

  // Calculate consensus level
  calculateConsensusLevel(results) {
    const votes = Object.values(results).map(r => r.votes);
    const totalVotes = votes.reduce((a, b) => a + b, 0);
    
    if (totalVotes === 0) return 0;
    
    const maxVotes = Math.max(...votes);
    return Math.round((maxVotes / totalVotes) * 100);
  }

  // Broadcast to all connected clients
  broadcastToClients(pollId, data) {
    // This would integrate with your WebSocket system
    console.log(`📡 Broadcasting to poll ${pollId}:`, data.type);
  }

  // Get poll history
  async getPollHistory(limit = 10) {
    const polls = await this.db.all(`
      SELECT * FROM team_polls 
      ORDER BY created_at DESC 
      LIMIT ?
    `, [limit]);

    return polls.map(poll => ({
      ...poll,
      options: JSON.parse(poll.options),
      results: JSON.parse(poll.results)
    }));
  }

  // Get team member voting stats
  async getTeamMemberStats(userId) {
    const stats = await this.db.get(`
      SELECT 
        COUNT(*) as total_votes,
        COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completed_polls,
        COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_polls,
        MAX(pv.voted_at) as last_vote
      FROM poll_votes pv
      JOIN team_polls p ON pv.poll_id = p.id
      WHERE pv.user_id = ?
    `, [userId]);

    return stats;
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS team_polls (
        id TEXT PRIMARY KEY,
        question TEXT NOT NULL,
        options TEXT NOT NULL,
        type TEXT DEFAULT 'binary',
        details_link TEXT,
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        status TEXT DEFAULT 'active',
        total_votes INTEGER DEFAULT 0,
        results TEXT NOT NULL,
        completed_at DATETIME
      );

      CREATE TABLE IF NOT EXISTS poll_votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        poll_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        option_id TEXT NOT NULL,
        voted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT,
        FOREIGN KEY (poll_id) REFERENCES team_polls (id)
      );

      CREATE TABLE IF NOT EXISTS poll_insights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        poll_id TEXT NOT NULL,
        insights_data TEXT NOT NULL,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (poll_id) REFERENCES team_polls (id)
      );

      CREATE TABLE IF NOT EXISTS team_members (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        email TEXT NOT NULL,
        permissions TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON poll_votes (poll_id);
      CREATE INDEX IF NOT EXISTS idx_poll_votes_user ON poll_votes (user_id);
      CREATE INDEX IF NOT EXISTS idx_team_polls_status ON team_polls (status, created_at);
    `);

    // Insert team members
    for (const [id, member] of Object.entries(this.teamMembers)) {
      await this.db.run(`
        INSERT OR IGNORE INTO team_members (id, name, role, email, permissions)
        VALUES (?, ?, ?, ?, ?)
      `, [
        id,
        member.name,
        member.role,
        member.email,
        JSON.stringify(member.permissions)
      ]);
    }
  }
}

module.exports = TeamPollingSystem;
