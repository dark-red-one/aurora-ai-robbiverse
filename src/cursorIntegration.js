// Robbie F Cursor Integration - Tabbed interface with job management and prioritization
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class CursorIntegration {
  constructor() {
    this.cursorAgent = null;
    this.jobs = new Map();
    this.queue = [];
    this.proposedPriorities = [];
    this.officialPriorities = [];
    this.isConnected = false;
    this.lastSync = null;
  }

  // Initialize Cursor integration
  async initialize() {
    console.log('🎯 Robbie F: Initializing Cursor integration...');
    
    try {
      // Connect to Cursor agent
      await this.connectToCursorAgent();
      
      // Load existing jobs and priorities
      await this.loadExistingData();
      
      // Start monitoring
      await this.startMonitoring();
      
      console.log('✅ Robbie F: Cursor integration ready!');
      return true;
    } catch (error) {
      console.error('❌ Robbie F: Cursor integration failed:', error);
      return false;
    }
  }

  // Connect to Cursor agent
  async connectToCursorAgent() {
    try {
      // This would connect to the actual Cursor agent API
      // For now, we'll simulate the connection
      this.cursorAgent = {
        endpoint: 'http://localhost:3000/api/cursor',
        apiKey: process.env.CURSOR_API_KEY || 'demo-key',
        connected: true
      };
      
      this.isConnected = true;
      console.log('🔗 Robbie F: Connected to Cursor agent');
    } catch (error) {
      console.error('❌ Robbie F: Failed to connect to Cursor agent:', error);
      this.isConnected = false;
    }
  }

  // Load existing data
  async loadExistingData() {
    try {
      // Load jobs
      const jobsData = await fs.readFile('/home/allan/vengeance/data/cursor_jobs.json', 'utf8');
      const jobs = JSON.parse(jobsData);
      jobs.forEach(job => this.jobs.set(job.id, job));
      
      // Load queue
      const queueData = await fs.readFile('/home/allan/vengeance/data/cursor_queue.json', 'utf8');
      this.queue = JSON.parse(queueData);
      
      // Load priorities
      const prioritiesData = await fs.readFile('/home/allan/vengeance/data/cursor_priorities.json', 'utf8');
      const priorities = JSON.parse(prioritiesData);
      this.officialPriorities = priorities.official || [];
      this.proposedPriorities = priorities.proposed || [];
      
      console.log(`📊 Robbie F: Loaded ${this.jobs.size} jobs, ${this.queue.length} queue items, ${this.officialPriorities.length} official priorities`);
    } catch (error) {
      console.log('⚠️  No existing Cursor data found, starting fresh');
      await this.initializeDefaultData();
    }
  }

  // Initialize default data
  async initializeDefaultData() {
    this.jobs = new Map();
    this.queue = [];
    this.officialPriorities = [];
    this.proposedPriorities = [];
    
    // Add some default proposed priorities based on our plan
    this.proposedPriorities = [
      {
        id: 'prop_1',
        title: 'Complete Killswitch System',
        description: 'Finish the 3-position killswitch with real-time feedback',
        impact: 'High',
        effort: 'Medium',
        priority: 1,
        category: 'Core System',
        estimatedTime: '2-3 hours',
        dependencies: []
      },
      {
        id: 'prop_2',
        title: 'Implement Slack Integration',
        description: 'Set up Slack listening and sock puppet message drafting',
        impact: 'High',
        effort: 'High',
        priority: 2,
        category: 'Integration',
        estimatedTime: '4-6 hours',
        dependencies: ['prop_1']
      },
      {
        id: 'prop_3',
        title: 'Build Lisa Access Control',
        description: 'Create smart redaction system for Lisa\'s queries',
        impact: 'Medium',
        effort: 'Medium',
        priority: 3,
        category: 'Security',
        estimatedTime: '2-3 hours',
        dependencies: []
      },
      {
        id: 'prop_4',
        title: 'Complete Data Mining System',
        description: 'Finish the comprehensive data mining and integration system',
        impact: 'High',
        effort: 'High',
        priority: 4,
        category: 'Data',
        estimatedTime: '3-4 hours',
        dependencies: []
      },
      {
        id: 'prop_5',
        title: 'Integrate All Systems',
        description: 'Connect all systems together seamlessly',
        impact: 'High',
        effort: 'High',
        priority: 5,
        category: 'Integration',
        estimatedTime: '2-3 hours',
        dependencies: ['prop_1', 'prop_2', 'prop_3', 'prop_4']
      }
    ];
  }

  // Start monitoring
  async startMonitoring() {
    // Monitor Cursor agent for new jobs and updates
    setInterval(async () => {
      await this.syncWithCursorAgent();
    }, 5000); // Sync every 5 seconds
    
    console.log('🔄 Robbie F: Started monitoring Cursor agent');
  }

  // Sync with Cursor agent
  async syncWithCursorAgent() {
    if (!this.isConnected) return;
    
    try {
      // This would sync with the actual Cursor agent
      // For now, we'll simulate some updates
      await this.simulateCursorUpdates();
      
      this.lastSync = new Date().toISOString();
    } catch (error) {
      console.error('❌ Robbie F: Sync failed:', error);
    }
  }

  // Simulate Cursor updates
  async simulateCursorUpdates() {
    // Simulate some job progress updates
    this.jobs.forEach(job => {
      if (job.status === 'in_progress' && Math.random() < 0.1) {
        job.progress = Math.min(100, job.progress + Math.random() * 10);
        if (job.progress >= 100) {
          job.status = 'completed';
          job.completedAt = new Date().toISOString();
        }
      }
    });
  }

  // Generate Cursor tab interface
  generateCursorTab() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Robbie F - Cursor Integration</title>
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
            max-width: 1400px;
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

        .emoji {
            font-size: 1.2em;
            margin-right: 8px;
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

        .job-item {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 15px;
            border-left: 4px solid #4CAF50;
            transition: all 0.3s ease;
        }

        .job-item:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateX(5px);
        }

        .job-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }

        .job-title {
            font-weight: bold;
            font-size: 1.1em;
        }

        .job-status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
        }

        .status-queued { background: #FF9800; color: white; }
        .status-in_progress { background: #2196F3; color: white; }
        .status-completed { background: #4CAF50; color: white; }
        .status-failed { background: #F44336; color: white; }

        .job-progress {
            width: 100%;
            height: 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            overflow: hidden;
            margin: 10px 0;
        }

        .job-progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #2196F3);
            transition: width 0.3s ease;
        }

        .job-details {
            font-size: 0.9em;
            opacity: 0.8;
            margin-bottom: 5px;
        }

        .priority-item {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 15px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
        }

        .priority-item:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .priority-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }

        .priority-title {
            font-weight: bold;
            font-size: 1.1em;
        }

        .priority-impact {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
        }

        .impact-high { background: #F44336; color: white; }
        .impact-medium { background: #FF9800; color: white; }
        .impact-low { background: #4CAF50; color: white; }

        .priority-details {
            font-size: 0.9em;
            opacity: 0.8;
            margin-bottom: 10px;
        }

        .priority-actions {
            display: flex;
            gap: 10px;
        }

        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9em;
            transition: all 0.3s ease;
        }

        .btn-primary {
            background: #4CAF50;
            color: white;
        }

        .btn-primary:hover {
            background: #45a049;
            transform: translateY(-2px);
        }

        .btn-secondary {
            background: #2196F3;
            color: white;
        }

        .btn-secondary:hover {
            background: #1976D2;
            transform: translateY(-2px);
        }

        .btn-danger {
            background: #F44336;
            color: white;
        }

        .btn-danger:hover {
            background: #D32F2F;
            transform: translateY(-2px);
        }

        .queue-controls {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }

        .queue-item {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 10px;
            border-left: 4px solid #2196F3;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .queue-item.dragging {
            opacity: 0.5;
            transform: rotate(5deg);
        }

        .queue-item.drag-over {
            border-left-color: #4CAF50;
        }

        .queue-handle {
            cursor: move;
            padding: 5px;
            color: #666;
        }

        .queue-handle:hover {
            color: #4CAF50;
        }

        .proposed-priorities {
            max-height: 400px;
            overflow-y: auto;
        }

        .go-button {
            width: 100%;
            padding: 15px;
            background: linear-gradient(45deg, #4CAF50, #2196F3);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 1.2em;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 20px;
        }

        .go-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(76, 175, 80, 0.3);
        }

        .go-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

        .status-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: #4CAF50;
            padding: 10px 15px;
            border-radius: 20px;
            font-size: 0.9em;
            border: 1px solid #4CAF50;
        }

        .status-indicator::before {
            content: "●";
            margin-right: 8px;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
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
    <div class="status-indicator">CURSOR SYNC</div>
    
    <div class="container">
        <div class="header fade-in">
            <h1><span class="emoji">🎯</span>Robbie F - Cursor Integration</h1>
            <p>Manage Cursor jobs, queue, and priorities with intelligent recommendations</p>
        </div>

        <div class="main-content fade-in">
            <div class="panel">
                <h2><span class="emoji">📋</span>Active Jobs</h2>
                <div id="active-jobs">
                    <div class="job-item">
                        <div class="job-header">
                            <div class="job-title">Killswitch System</div>
                            <div class="job-status status-in_progress">In Progress</div>
                        </div>
                        <div class="job-progress">
                            <div class="job-progress-bar" style="width: 75%"></div>
                        </div>
                        <div class="job-details">Building 3-position killswitch with real-time feedback</div>
                        <div class="job-details">ETA: 30 minutes</div>
                    </div>
                    
                    <div class="job-item">
                        <div class="job-header">
                            <div class="job-title">Slack Integration</div>
                            <div class="job-status status-queued">Queued</div>
                        </div>
                        <div class="job-progress">
                            <div class="job-progress-bar" style="width: 0%"></div>
                        </div>
                        <div class="job-details">Setting up Slack listening and sock puppet system</div>
                        <div class="job-details">ETA: 2 hours</div>
                    </div>
                </div>
            </div>

            <div class="panel">
                <h2><span class="emoji">🔄</span>Queue Management</h2>
                <div class="queue-controls">
                    <button class="btn btn-primary" onclick="addToQueue()">+ Add Job</button>
                    <button class="btn btn-secondary" onclick="clearQueue()">Clear Queue</button>
                    <button class="btn btn-primary" onclick="syncWithCursor()">🔄 Sync</button>
                </div>
                <div id="queue-list">
                    <div class="queue-item" draggable="true">
                        <div class="queue-handle">⋮⋮</div>
                        <div>
                            <div class="job-title">Data Mining System</div>
                            <div class="job-details">Priority: High | ETA: 1 hour</div>
                        </div>
                        <button class="btn btn-danger" onclick="removeFromQueue(this)">×</button>
                    </div>
                    
                    <div class="queue-item" draggable="true">
                        <div class="queue-handle">⋮⋮</div>
                        <div>
                            <div class="job-title">Lisa Access Control</div>
                            <div class="job-details">Priority: Medium | ETA: 45 min</div>
                        </div>
                        <button class="btn btn-danger" onclick="removeFromQueue(this)">×</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="panel fade-in">
            <h2><span class="emoji">🎯</span>Proposed Priorities</h2>
            <p style="margin-bottom: 20px; opacity: 0.8;">Based on our plan, ordered by impact. Check the ones you want to add to the official list.</p>
            
            <div class="proposed-priorities" id="proposed-priorities">
                <div class="priority-item">
                    <div class="priority-header">
                        <div class="priority-title">Complete Killswitch System</div>
                        <div class="priority-impact impact-high">High Impact</div>
                    </div>
                    <div class="priority-details">
                        Finish the 3-position killswitch with real-time feedback and logging
                    </div>
                    <div class="priority-details">
                        <strong>Effort:</strong> Medium | <strong>Time:</strong> 2-3 hours | <strong>Dependencies:</strong> None
                    </div>
                    <div class="priority-actions">
                        <label>
                            <input type="checkbox" onchange="togglePriority(this, 'prop_1')"> Add to Official List
                        </label>
                    </div>
                </div>

                <div class="priority-item">
                    <div class="priority-header">
                        <div class="priority-title">Implement Slack Integration</div>
                        <div class="priority-impact impact-high">High Impact</div>
                    </div>
                    <div class="priority-details">
                        Set up Slack listening and sock puppet message drafting system
                    </div>
                    <div class="priority-details">
                        <strong>Effort:</strong> High | <strong>Time:</strong> 4-6 hours | <strong>Dependencies:</strong> Killswitch System
                    </div>
                    <div class="priority-actions">
                        <label>
                            <input type="checkbox" onchange="togglePriority(this, 'prop_2')"> Add to Official List
                        </label>
                    </div>
                </div>

                <div class="priority-item">
                    <div class="priority-header">
                        <div class="priority-title">Build Lisa Access Control</div>
                        <div class="priority-impact impact-medium">Medium Impact</div>
                    </div>
                    <div class="priority-details">
                        Create smart redaction system for Lisa's queries with policy management
                    </div>
                    <div class="priority-details">
                        <strong>Effort:</strong> Medium | <strong>Time:</strong> 2-3 hours | <strong>Dependencies:</strong> None
                    </div>
                    <div class="priority-actions">
                        <label>
                            <input type="checkbox" onchange="togglePriority(this, 'prop_3')"> Add to Official List
                        </label>
                    </div>
                </div>

                <div class="priority-item">
                    <div class="priority-header">
                        <div class="priority-title">Complete Data Mining System</div>
                        <div class="priority-impact impact-high">High Impact</div>
                    </div>
                    <div class="priority-details">
                        Finish the comprehensive data mining and integration system
                    </div>
                    <div class="priority-details">
                        <strong>Effort:</strong> High | <strong>Time:</strong> 3-4 hours | <strong>Dependencies:</strong> None
                    </div>
                    <div class="priority-actions">
                        <label>
                            <input type="checkbox" onchange="togglePriority(this, 'prop_4')"> Add to Official List
                        </label>
                    </div>
                </div>

                <div class="priority-item">
                    <div class="priority-header">
                        <div class="priority-title">Integrate All Systems</div>
                        <div class="priority-impact impact-high">High Impact</div>
                    </div>
                    <div class="priority-details">
                        Connect all systems together seamlessly
                    </div>
                    <div class="priority-details">
                        <strong>Effort:</strong> High | <strong>Time:</strong> 2-3 hours | <strong>Dependencies:</strong> All above
                    </div>
                    <div class="priority-actions">
                        <label>
                            <input type="checkbox" onchange="togglePriority(this, 'prop_5')"> Add to Official List
                        </label>
                    </div>
                </div>
            </div>

            <button class="go-button" onclick="addSelectedPriorities()" id="go-button">
                🚀 Go! Add Selected Priorities to Official List
            </button>
        </div>
    </div>

    <script>
        let selectedPriorities = new Set();
        let queueItems = [];

        // Toggle priority selection
        function togglePriority(checkbox, priorityId) {
            if (checkbox.checked) {
                selectedPriorities.add(priorityId);
            } else {
                selectedPriorities.delete(priorityId);
            }
            
            updateGoButton();
        }

        // Update Go button state
        function updateGoButton() {
            const goButton = document.getElementById('go-button');
            goButton.disabled = selectedPriorities.size === 0;
            goButton.textContent = selectedPriorities.size > 0 
                ? `🚀 Go! Add ${selectedPriorities.size} Selected Priorities` 
                : '🚀 Go! Add Selected Priorities to Official List';
        }

        // Add selected priorities to official list
        function addSelectedPriorities() {
            if (selectedPriorities.size === 0) return;
            
            // This would add the selected priorities to the official list
            console.log('Adding priorities:', Array.from(selectedPriorities));
            
            // Clear selections
            selectedPriorities.clear();
            document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
            updateGoButton();
            
            // Show success message
            alert('Priorities added to official list!');
        }

        // Add to queue
        function addToQueue() {
            const jobTitle = prompt('Enter job title:');
            if (jobTitle) {
                const queueItem = document.createElement('div');
                queueItem.className = 'queue-item';
                queueItem.draggable = true;
                queueItem.innerHTML = \`
                    <div class="queue-handle">⋮⋮</div>
                    <div>
                        <div class="job-title">\${jobTitle}</div>
                        <div class="job-details">Priority: Medium | ETA: 1 hour</div>
                    </div>
                    <button class="btn btn-danger" onclick="removeFromQueue(this)">×</button>
                \`;
                
                document.getElementById('queue-list').appendChild(queueItem);
            }
        }

        // Remove from queue
        function removeFromQueue(button) {
            button.parentElement.remove();
        }

        // Clear queue
        function clearQueue() {
            if (confirm('Are you sure you want to clear the queue?')) {
                document.getElementById('queue-list').innerHTML = '';
            }
        }

        // Sync with Cursor
        function syncWithCursor() {
            console.log('Syncing with Cursor...');
            // This would sync with the actual Cursor agent
            alert('Synced with Cursor!');
        }

        // Initialize
        updateGoButton();
    </script>
</body>
</html>`;
  }

  // Add priority to official list
  async addPriorityToOfficialList(priorityId) {
    const priority = this.proposedPriorities.find(p => p.id === priorityId);
    if (priority) {
      this.officialPriorities.push({
        ...priority,
        addedAt: new Date().toISOString(),
        status: 'active'
      });
      
      // Remove from proposed
      this.proposedPriorities = this.proposedPriorities.filter(p => p.id !== priorityId);
      
      // Save to file
      await this.savePriorities();
      
      console.log(`✅ Robbie F: Added priority to official list: ${priority.title}`);
    }
  }

  // Save priorities
  async savePriorities() {
    try {
      const prioritiesData = {
        official: this.officialPriorities,
        proposed: this.proposedPriorities,
        lastUpdated: new Date().toISOString()
      };
      
      await fs.writeFile('/home/allan/vengeance/data/cursor_priorities.json', JSON.stringify(prioritiesData, null, 2));
    } catch (error) {
      console.error('❌ Robbie F: Error saving priorities:', error);
    }
  }

  // Get status
  getStatus() {
    return {
      isConnected: this.isConnected,
      jobsCount: this.jobs.size,
      queueLength: this.queue.length,
      officialPriorities: this.officialPriorities.length,
      proposedPriorities: this.proposedPriorities.length,
      lastSync: this.lastSync
    };
  }
}

export const cursorIntegration = new CursorIntegration();
