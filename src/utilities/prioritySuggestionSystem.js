// Robbie F Priority Suggestion System - Capture everyone's state of mind and context
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class PrioritySuggestionSystem {
  constructor() {
    this.suggestions = new Map();
    this.chatContext = new Map();
    this.userStates = new Map();
    this.prioritySignals = new Map();
    this.reports = [];
  }

  // Initialize priority suggestion system
  async initialize() {
    console.log('🎯 Robbie F: Initializing priority suggestion system...');
    
    try {
      // Load existing data
      await this.loadExistingData();
      
      // Start monitoring
      await this.startMonitoring();
      
      console.log('✅ Robbie F: Priority suggestion system ready!');
      return true;
    } catch (error) {
      console.error('❌ Robbie F: Priority suggestion system initialization failed:', error);
      return false;
    }
  }

  // Load existing data
  async loadExistingData() {
    try {
      const data = await fs.readFile('/home/allan/vengeance/data/priority_suggestions.json', 'utf8');
      const parsed = JSON.parse(data);
      
      this.suggestions = new Map(parsed.suggestions || []);
      this.chatContext = new Map(parsed.chatContext || []);
      this.userStates = new Map(parsed.userStates || []);
      this.prioritySignals = new Map(parsed.prioritySignals || []);
      this.reports = parsed.reports || [];
      
      console.log(`📊 Robbie F: Loaded priority data - ${this.suggestions.size} suggestions, ${this.chatContext.size} chat contexts`);
    } catch (error) {
      console.log('⚠️  No existing priority data found, starting fresh');
    }
  }

  // Start monitoring
  async startMonitoring() {
    // Monitor for new suggestions every 30 seconds
    setInterval(async () => {
      await this.processNewSuggestions();
    }, 30000);
    
    // Generate reports every hour
    setInterval(async () => {
      await this.generateHourlyReport();
    }, 3600000);
    
    console.log('🔄 Robbie F: Started monitoring priority suggestions');
  }

  // Process new suggestions
  async processNewSuggestions() {
    try {
      // This would check for new suggestions from all users
      // For now, we'll simulate some processing
      console.log('🎯 Robbie F: Processing new priority suggestions...');
    } catch (error) {
      console.error('❌ Robbie F: Error processing suggestions:', error);
    }
  }

  // Generate hourly report
  async generateHourlyReport() {
    try {
      const report = await this.createReport();
      this.reports.push(report);
      
      // Keep only last 24 reports (24 hours)
      if (this.reports.length > 24) {
        this.reports = this.reports.slice(-24);
      }
      
      // Save data
      await this.saveData();
      
      console.log('📊 Robbie F: Generated hourly priority report');
    } catch (error) {
      console.error('❌ Robbie F: Error generating report:', error);
    }
  }

  // Submit priority suggestion
  async submitPrioritySuggestion(user, suggestion, context = {}) {
    const suggestionId = `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const suggestionData = {
      id: suggestionId,
      user: user,
      suggestion: suggestion,
      context: context,
      timestamp: new Date().toISOString(),
      priority: this.calculatePriority(suggestion, user, context),
      sentiment: this.analyzeSentiment(suggestion),
      urgency: this.analyzeUrgency(suggestion),
      category: this.categorizeSuggestion(suggestion),
      status: 'pending'
    };
    
    this.suggestions.set(suggestionId, suggestionData);
    
    // Update user state
    await this.updateUserState(user, suggestion, context);
    
    // Save data
    await this.saveData();
    
    console.log(`💡 Robbie F: New priority suggestion from ${user}: "${suggestion}"`);
    
    return suggestionData;
  }

  // Calculate priority score
  calculatePriority(suggestion, user, context) {
    let score = 0;
    
    // Base score by user role
    const userRoles = {
      'allan': 10,
      'lisa': 8,
      'tom': 6,
      'kristina': 6,
      'default': 5
    };
    
    score += userRoles[user] || userRoles.default;
    
    // Urgency keywords
    const urgencyKeywords = ['urgent', 'asap', 'immediately', 'critical', 'emergency', 'now'];
    const urgencyCount = urgencyKeywords.filter(keyword => 
      suggestion.toLowerCase().includes(keyword)
    ).length;
    score += urgencyCount * 3;
    
    // Emotional intensity
    const emotionalKeywords = ['really', 'so', 'very', 'extremely', 'absolutely', 'definitely'];
    const emotionalCount = emotionalKeywords.filter(keyword => 
      suggestion.toLowerCase().includes(keyword)
    ).length;
    score += emotionalCount * 2;
    
    // Context factors
    if (context.isRepeated) score += 2;
    if (context.isFollowUp) score += 1;
    if (context.hasDeadline) score += 3;
    
    return Math.min(10, score);
  }

  // Analyze sentiment
  analyzeSentiment(suggestion) {
    const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'perfect', 'love', 'excited'];
    const negativeWords = ['terrible', 'awful', 'horrible', 'hate', 'angry', 'frustrated', 'upset'];
    const neutralWords = ['okay', 'fine', 'good', 'alright', 'decent'];
    
    const text = suggestion.toLowerCase();
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    const neutralCount = neutralWords.filter(word => text.includes(word)).length;
    
    if (positiveCount > negativeCount && positiveCount > neutralCount) return 'positive';
    if (negativeCount > positiveCount && negativeCount > neutralCount) return 'negative';
    return 'neutral';
  }

  // Analyze urgency
  analyzeUrgency(suggestion) {
    const urgentWords = ['urgent', 'asap', 'immediately', 'critical', 'emergency', 'now', 'quickly'];
    const urgentCount = urgentWords.filter(word => 
      suggestion.toLowerCase().includes(word)
    ).length;
    
    if (urgentCount >= 2) return 'high';
    if (urgentCount >= 1) return 'medium';
    return 'low';
  }

  // Categorize suggestion
  categorizeSuggestion(suggestion) {
    const categories = {
      'technical': ['bug', 'fix', 'error', 'issue', 'problem', 'code', 'system'],
      'business': ['sales', 'revenue', 'client', 'customer', 'deal', 'money', 'budget'],
      'personal': ['family', 'home', 'personal', 'health', 'travel', 'vacation'],
      'urgent': ['urgent', 'asap', 'immediately', 'critical', 'emergency'],
      'creative': ['idea', 'creative', 'design', 'marketing', 'content', 'strategy']
    };
    
    const text = suggestion.toLowerCase();
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }
    
    return 'general';
  }

  // Update user state
  async updateUserState(user, suggestion, context) {
    if (!this.userStates.has(user)) {
      this.userStates.set(user, {
        recentSuggestions: [],
        mood: 'neutral',
        stressLevel: 0,
        priorities: [],
        lastActivity: new Date().toISOString()
      });
    }
    
    const userState = this.userStates.get(user);
    userState.recentSuggestions.push({
      suggestion: suggestion,
      timestamp: new Date().toISOString(),
      sentiment: this.analyzeSentiment(suggestion),
      urgency: this.analyzeUrgency(suggestion)
    });
    
    // Keep only last 10 suggestions
    if (userState.recentSuggestions.length > 10) {
      userState.recentSuggestions = userState.recentSuggestions.slice(-10);
    }
    
    // Update mood based on recent suggestions
    userState.mood = this.calculateUserMood(userState.recentSuggestions);
    
    // Update stress level
    userState.stressLevel = this.calculateStressLevel(userState.recentSuggestions);
    
    // Update priorities
    userState.priorities = this.extractPriorities(userState.recentSuggestions);
    
    userState.lastActivity = new Date().toISOString();
  }

  // Calculate user mood
  calculateUserMood(recentSuggestions) {
    const sentiments = recentSuggestions.map(s => s.sentiment);
    const positiveCount = sentiments.filter(s => s === 'positive').length;
    const negativeCount = sentiments.filter(s => s === 'negative').length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // Calculate stress level
  calculateStressLevel(recentSuggestions) {
    const urgencies = recentSuggestions.map(s => s.urgency);
    const highUrgencyCount = urgencies.filter(u => u === 'high').length;
    const mediumUrgencyCount = urgencies.filter(u => u === 'medium').length;
    
    return Math.min(10, highUrgencyCount * 3 + mediumUrgencyCount * 1);
  }

  // Extract priorities
  extractPriorities(recentSuggestions) {
    const priorities = [];
    recentSuggestions.forEach(suggestion => {
      if (suggestion.urgency === 'high' || suggestion.urgency === 'medium') {
        priorities.push({
          text: suggestion.suggestion,
          urgency: suggestion.urgency,
          timestamp: suggestion.timestamp
        });
      }
    });
    
    return priorities.slice(-5); // Keep only last 5 priorities
  }

  // Create report for Allan
  async createReport() {
    const report = {
      id: `report_${Date.now()}`,
      timestamp: new Date().toISOString(),
      summary: await this.generateSummary(),
      userStates: Object.fromEntries(this.userStates),
      topSuggestions: this.getTopSuggestions(5),
      insights: await this.generateInsights(),
      recommendations: await this.generateRecommendations()
    };
    
    return report;
  }

  // Generate summary
  async generateSummary() {
    const totalSuggestions = this.suggestions.size;
    const activeUsers = this.userStates.size;
    const highPrioritySuggestions = Array.from(this.suggestions.values())
      .filter(s => s.priority >= 7).length;
    
    return {
      totalSuggestions,
      activeUsers,
      highPrioritySuggestions,
      overallMood: this.calculateOverallMood(),
      topConcerns: this.getTopConcerns(3)
    };
  }

  // Calculate overall mood
  calculateOverallMood() {
    const moods = Array.from(this.userStates.values()).map(u => u.mood);
    const positiveCount = moods.filter(m => m === 'positive').length;
    const negativeCount = moods.filter(m => m === 'negative').length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // Get top concerns
  getTopConcerns(count) {
    const concerns = Array.from(this.suggestions.values())
      .filter(s => s.urgency === 'high' || s.priority >= 8)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, count);
    
    return concerns.map(c => ({
      user: c.user,
      suggestion: c.suggestion,
      priority: c.priority,
      timestamp: c.timestamp
    }));
  }

  // Get top suggestions
  getTopSuggestions(count) {
    return Array.from(this.suggestions.values())
      .sort((a, b) => b.priority - a.priority)
      .slice(0, count);
  }

  // Generate insights
  async generateInsights() {
    const insights = [];
    
    // User-specific insights
    for (const [user, state] of this.userStates) {
      if (state.stressLevel > 7) {
        insights.push({
          type: 'stress_alert',
          user: user,
          message: `${user} seems to be under high stress. Consider reaching out to offer support.`,
          priority: 'high'
        });
      }
      
      if (state.mood === 'negative' && state.recentSuggestions.length > 3) {
        insights.push({
          type: 'mood_concern',
          user: user,
          message: `${user} has been expressing negative sentiment recently. They might need some encouragement.`,
          priority: 'medium'
        });
      }
      
      if (state.priorities.length > 3) {
        insights.push({
          type: 'priority_overload',
          user: user,
          message: `${user} has many active priorities. They might benefit from help prioritizing.`,
          priority: 'medium'
        });
      }
    }
    
    return insights;
  }

  // Generate recommendations
  async generateRecommendations() {
    const recommendations = [];
    
    // High priority suggestions
    const highPrioritySuggestions = Array.from(this.suggestions.values())
      .filter(s => s.priority >= 8)
      .sort((a, b) => b.priority - a.priority);
    
    if (highPrioritySuggestions.length > 0) {
      recommendations.push({
        type: 'immediate_action',
        message: `You have ${highPrioritySuggestions.length} high-priority suggestions that need attention.`,
        suggestions: highPrioritySuggestions.slice(0, 3)
      });
    }
    
    // User-specific recommendations
    for (const [user, state] of this.userStates) {
      if (state.stressLevel > 7) {
        recommendations.push({
          type: 'support_needed',
          user: user,
          message: `${user} is under high stress. Consider reaching out to offer support or help with their priorities.`,
          priority: 'high'
        });
      }
      
      if (state.mood === 'negative') {
        recommendations.push({
          type: 'encouragement_needed',
          user: user,
          message: `${user} seems to be having a tough time. A positive message or gesture might help.`,
          priority: 'medium'
        });
      }
    }
    
    return recommendations;
  }

  // Generate priority suggestion interface
  generatePrioritySuggestionInterface() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Robbie F - Priority Suggestions</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1e1e1e 0%, #2d2d30 100%);
            color: #cccccc;
            min-height: 100vh;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #4CAF50, #2196F3);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .header p {
            font-size: 1.2em;
            opacity: 0.8;
        }

        .main-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }

        .panel {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            padding: 25px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .panel h2 {
            margin-bottom: 20px;
            font-size: 1.8em;
            color: #4CAF50;
        }

        .suggestion-form {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .form-group {
            text-align: left;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: #4CAF50;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
            width: 100%;
            padding: 12px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: #cccccc;
            font-size: 1em;
        }

        .form-group textarea {
            min-height: 100px;
            resize: vertical;
        }

        .submit-btn {
            padding: 15px 30px;
            background: linear-gradient(45deg, #4CAF50, #2196F3);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 1.1em;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(76, 175, 80, 0.3);
        }

        .suggestions-list {
            max-height: 400px;
            overflow-y: auto;
        }

        .suggestion-item {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 15px;
            border-left: 4px solid #4CAF50;
            transition: all 0.3s ease;
        }

        .suggestion-item:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateX(5px);
        }

        .suggestion-item.high-priority {
            border-left-color: #F44336;
            background: rgba(244, 67, 54, 0.1);
        }

        .suggestion-item.medium-priority {
            border-left-color: #FF9800;
            background: rgba(255, 152, 0, 0.1);
        }

        .suggestion-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }

        .suggestion-user {
            font-weight: bold;
            color: #4CAF50;
        }

        .suggestion-priority {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
            text-transform: uppercase;
        }

        .priority-high {
            background: #F44336;
            color: white;
        }

        .priority-medium {
            background: #FF9800;
            color: white;
        }

        .priority-low {
            background: #4CAF50;
            color: white;
        }

        .suggestion-text {
            font-size: 0.9em;
            line-height: 1.4;
            margin-bottom: 10px;
        }

        .suggestion-meta {
            font-size: 0.8em;
            opacity: 0.7;
            display: flex;
            justify-content: space-between;
        }

        .fade-in {
            animation: fadeIn 0.5s ease-in;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header fade-in">
            <h1>💡 Robbie F - Priority Suggestions</h1>
            <p>Share what's on your mind - I'll help Allan understand what you need</p>
        </div>

        <div class="main-content fade-in">
            <div class="panel">
                <h2>📝 Suggest a Priority</h2>
                <form class="suggestion-form" id="suggestion-form">
                    <div class="form-group">
                        <label for="user">Who are you?</label>
                        <select id="user" name="user" required>
                            <option value="">Select user...</option>
                            <option value="allan">Allan Peretz</option>
                            <option value="lisa">Lisa Peretz</option>
                            <option value="tom">Tom</option>
                            <option value="kristina">Kristina</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="suggestion">What's on your mind?</label>
                        <textarea id="suggestion" name="suggestion" placeholder="Share what you think should be a priority..." required></textarea>
                    </div>

                    <div class="form-group">
                        <label for="context">Additional context (optional)</label>
                        <input type="text" id="context" name="context" placeholder="Any additional details...">
                    </div>

                    <button type="submit" class="submit-btn">Submit Priority Suggestion</button>
                </form>
            </div>

            <div class="panel">
                <h2>📊 Recent Suggestions</h2>
                <div class="suggestions-list" id="suggestions-list">
                    <div class="suggestion-item high-priority">
                        <div class="suggestion-header">
                            <div class="suggestion-user">Lisa Peretz</div>
                            <div class="suggestion-priority priority-high">High</div>
                        </div>
                        <div class="suggestion-text">
                            Allan really needs to call me back - I've been trying to reach him about the kids' school event this weekend
                        </div>
                        <div class="suggestion-meta">
                            <span>2 hours ago</span>
                            <span>Urgent</span>
                        </div>
                    </div>

                    <div class="suggestion-item medium-priority">
                        <div class="suggestion-header">
                            <div class="suggestion-user">Tom</div>
                            <div class="suggestion-priority priority-medium">Medium</div>
                        </div>
                        <div class="suggestion-text">
                            We should prioritize the Johnson deal - they're ready to sign but need final pricing
                        </div>
                        <div class="suggestion-meta">
                            <span>4 hours ago</span>
                            <span>Business</span>
                        </div>
                    </div>

                    <div class="suggestion-item">
                        <div class="suggestion-header">
                            <div class="suggestion-user">Kristina</div>
                            <div class="suggestion-priority priority-low">Low</div>
                        </div>
                        <div class="suggestion-text">
                            The new marketing materials look great - maybe we can use them for the trade show next month
                        </div>
                        <div class="suggestion-meta">
                            <span>6 hours ago</span>
                            <span>Creative</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Handle form submission
        document.getElementById('suggestion-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const suggestion = {
                user: formData.get('user'),
                suggestion: formData.get('suggestion'),
                context: formData.get('context')
            };
            
            if (!suggestion.user || !suggestion.suggestion) {
                alert('Please fill in all required fields');
                return;
            }
            
            try {
                const response = await fetch('/api/priority-suggestion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(suggestion)
                });
                
                if (response.ok) {
                    alert('Priority suggestion submitted successfully!');
                    this.reset();
                    // Refresh suggestions list
                    loadSuggestions();
                } else {
                    alert('Error submitting suggestion. Please try again.');
                }
            } catch (error) {
                alert('Error submitting suggestion. Please try again.');
            }
        });

        // Load suggestions
        async function loadSuggestions() {
            try {
                const response = await fetch('/api/priority-suggestions');
                const suggestions = await response.json();
                
                const suggestionsList = document.getElementById('suggestions-list');
                suggestionsList.innerHTML = suggestions.map(suggestion => \`
                    <div class="suggestion-item \${suggestion.priority >= 8 ? 'high-priority' : suggestion.priority >= 5 ? 'medium-priority' : ''}">
                        <div class="suggestion-header">
                            <div class="suggestion-user">\${suggestion.user}</div>
                            <div class="suggestion-priority priority-\${suggestion.priority >= 8 ? 'high' : suggestion.priority >= 5 ? 'medium' : 'low'}">
                                \${suggestion.priority >= 8 ? 'High' : suggestion.priority >= 5 ? 'Medium' : 'Low'}
                            </div>
                        </div>
                        <div class="suggestion-text">\${suggestion.suggestion}</div>
                        <div class="suggestion-meta">
                            <span>\${new Date(suggestion.timestamp).toLocaleString()}</span>
                            <span>\${suggestion.category}</span>
                        </div>
                    </div>
                \`).join('');
            } catch (error) {
                console.error('Error loading suggestions:', error);
            }
        }

        // Load suggestions on page load
        loadSuggestions();
    </script>
</body>
</html>`;
  }

  // Save data
  async saveData() {
    try {
      const data = {
        suggestions: Array.from(this.suggestions.entries()),
        chatContext: Array.from(this.chatContext.entries()),
        userStates: Array.from(this.userStates.entries()),
        prioritySignals: Array.from(this.prioritySignals.entries()),
        reports: this.reports,
        lastUpdated: new Date().toISOString()
      };
      
      await fs.writeFile('/home/allan/vengeance/data/priority_suggestions.json', JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Robbie F: Error saving priority data:', error);
    }
  }

  // Get status
  getStatus() {
    return {
      totalSuggestions: this.suggestions.size,
      activeUsers: this.userStates.size,
      highPrioritySuggestions: Array.from(this.suggestions.values()).filter(s => s.priority >= 8).length,
      totalReports: this.reports.length,
      lastReport: this.reports[this.reports.length - 1]?.timestamp || null
    };
  }
}

export const prioritySuggestionSystem = new PrioritySuggestionSystem();
