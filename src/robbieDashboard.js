// Robbie V3 Dashboard - Real-time streaming command center
import { actionFramework } from "./actionFramework.js";
import { approvalSystem } from "./approvalSystem.js";

export class RobbieDashboard {
  constructor() {
    this.pin = "2106";
    this.mood = "focused"; // focused, excited, stressed, confident, determined
    this.lastUpdate = new Date();
    this.systemStats = {
      gpu: { utilization: 0, memory: 0, temperature: 0 },
      cpu: { usage: 0, cores: 0 },
      memory: { used: 0, total: 0 },
      disk: { used: 0, total: 0 }
    };
    this.priorities = [
      { id: 1, task: "Fix Vengeance server startup", status: "completed", priority: "critical" },
      { id: 2, task: "Get GPU endpoints working", status: "completed", priority: "high" },
      { id: 3, task: "Execute Day 1 damage control", status: "in_progress", priority: "critical" },
      { id: 4, task: "Launch Aurora pre-sales", status: "pending", priority: "critical" },
      { id: 5, task: "Address $60K cash flow crisis", status: "in_progress", priority: "critical" }
    ];
    this.recentActions = [];
    this.upcomingActions = [];
    this.jobs = [];
    this.startBackgroundProcesses();
  }

  // Generate the main dashboard HTML
  generateDashboard() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>🤖 Robbie V3 Command Center</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: #0a0a0a; 
            color: #ffffff; 
            overflow-x: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #1a1a2e, #16213e); 
            padding: 20px; 
            border-bottom: 2px solid #00d4ff;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo { font-size: 28px; font-weight: bold; color: #00d4ff; }
        .mood-display { 
            display: flex; 
            align-items: center; 
            gap: 15px; 
            font-size: 18px;
        }
        .mood-emoji { 
            font-size: 32px; 
            cursor: pointer; 
            transition: transform 0.3s;
        }
        .mood-emoji:hover { transform: scale(1.2); }
        .pin-display { 
            background: #2d2d2d; 
            padding: 10px 15px; 
            border-radius: 6px; 
            font-family: monospace;
            font-size: 16px;
        }
        .main-content { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            padding: 20px; 
        }
        .panel { 
            background: #1a1a1a; 
            border-radius: 8px; 
            padding: 20px; 
            border: 1px solid #333;
        }
        .panel-title { 
            font-size: 20px; 
            margin-bottom: 15px; 
            color: #00d4ff; 
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); 
            gap: 15px; 
            margin-bottom: 20px; 
        }
        .stat-card { 
            background: #2d2d2d; 
            padding: 15px; 
            border-radius: 6px; 
            text-align: center;
            border-left: 4px solid #00d4ff;
        }
        .stat-number { 
            font-size: 24px; 
            font-weight: bold; 
            color: #4caf50; 
        }
        .stat-label { 
            font-size: 12px; 
            color: #ccc; 
            margin-top: 5px; 
        }
        .priority-item { 
            background: #2d2d2d; 
            padding: 12px; 
            margin: 8px 0; 
            border-radius: 6px; 
            border-left: 4px solid #ffa500;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .priority-item.critical { border-left-color: #ff6b6b; }
        .priority-item.high { border-left-color: #ffa500; }
        .priority-item.medium { border-left-color: #4caf50; }
        .priority-item.completed { border-left-color: #4caf50; opacity: 0.7; }
        .priority-status { 
            font-size: 12px; 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-weight: bold;
        }
        .status-in_progress { background: #ffa500; color: #000; }
        .status-completed { background: #4caf50; color: #000; }
        .status-pending { background: #666; color: #fff; }
        .action-item { 
            background: #2d2d2d; 
            padding: 10px; 
            margin: 5px 0; 
            border-radius: 4px; 
            font-size: 14px;
            border-left: 3px solid #00d4ff;
        }
        .job-item { 
            background: #2d2d2d; 
            padding: 12px; 
            margin: 8px 0; 
            border-radius: 6px; 
            border-left: 4px solid #9c27b0;
        }
        .job-progress { 
            background: #1a1a1a; 
            height: 6px; 
            border-radius: 3px; 
            margin: 8px 0; 
            overflow: hidden;
        }
        .job-progress-bar { 
            background: linear-gradient(90deg, #00d4ff, #4caf50); 
            height: 100%; 
            transition: width 0.3s;
        }
        .streaming-indicator { 
            display: inline-block; 
            width: 8px; 
            height: 8px; 
            background: #4caf50; 
            border-radius: 50%; 
            animation: pulse 2s infinite;
        }
        @keyframes pulse { 
            0% { opacity: 1; } 
            50% { opacity: 0.5; } 
            100% { opacity: 1; } 
        }
        .pin-input { 
            background: #1a1a1a; 
            border: 2px solid #00d4ff; 
            color: #fff; 
            padding: 8px; 
            border-radius: 4px; 
            font-family: monospace;
            font-size: 16px;
            text-align: center;
            width: 80px;
        }
        .pin-input:focus { outline: none; border-color: #4caf50; }
        .btn { 
            background: #00d4ff; 
            color: #000; 
            border: none; 
            padding: 8px 16px; 
            border-radius: 4px; 
            cursor: pointer; 
            font-weight: bold; 
            transition: all 0.3s;
        }
        .btn:hover { background: #4caf50; }
        .btn-danger { background: #ff6b6b; }
        .btn-danger:hover { background: #ff5252; }
        .chat-area { 
            background: #1a1a1a; 
            border: 1px solid #333; 
            border-radius: 8px; 
            padding: 15px; 
            height: 200px; 
            overflow-y: auto; 
            font-family: monospace; 
            font-size: 14px;
        }
        .chat-message { 
            margin: 5px 0; 
            padding: 5px; 
            border-radius: 4px; 
        }
        .chat-system { background: #2d2d2d; }
        .chat-user { background: #1a4d1a; }
        .chat-ai { background: #1a1a4d; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🤖 Robbie V3 Command Center</div>
        <div class="mood-display">
            <span>Mood:</span>
            <span class="mood-emoji" onclick="changeMood()" id="moodEmoji">🎯</span>
            <span id="moodText">Focused</span>
        </div>
        <div class="pin-display">
            PIN: <input type="password" class="pin-input" id="pinInput" maxlength="4" placeholder="2106">
        </div>
    </div>

    <div class="main-content">
        <!-- System Performance Panel -->
        <div class="panel">
            <div class="panel-title">
                📊 System Performance <span class="streaming-indicator"></span>
            </div>
            <div class="stats-grid" id="systemStats">
                <div class="stat-card">
                    <div class="stat-number" id="gpuUtil">0%</div>
                    <div class="stat-label">GPU Usage</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="cpuUtil">0%</div>
                    <div class="stat-label">CPU Usage</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="memoryUtil">0%</div>
                    <div class="stat-label">Memory</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="diskUtil">0%</div>
                    <div class="stat-label">Disk</div>
                </div>
            </div>
            <div class="chat-area" id="systemChat">
                <div class="chat-message chat-system">System ready...</div>
            </div>
        </div>

        <!-- Priorities Panel -->
        <div class="panel">
            <div class="panel-title">
                🎯 Agreed Priorities <span class="streaming-indicator"></span>
            </div>
            <div id="prioritiesList">
                <!-- Priorities will be populated by JavaScript -->
            </div>
        </div>

        <!-- Recent Actions Panel -->
        <div class="panel">
            <div class="panel-title">
                ⚡ Last 5 Actions <span class="streaming-indicator"></span>
            </div>
            <div id="recentActions">
                <!-- Recent actions will be populated by JavaScript -->
            </div>
        </div>

        <!-- Upcoming Actions Panel -->
        <div class="panel">
            <div class="panel-title">
                🔮 Next 5 Anticipated <span class="streaming-indicator"></span>
            </div>
            <div id="upcomingActions">
                <!-- Upcoming actions will be populated by JavaScript -->
            </div>
        </div>

        <!-- Job Tracking Panel -->
        <div class="panel">
            <div class="panel-title">
                🔧 Job Tracking <span class="streaming-indicator"></span>
            </div>
            <div id="jobsList">
                <!-- Jobs will be populated by JavaScript -->
            </div>
        </div>

        <!-- Chat Panel -->
        <div class="panel">
            <div class="panel-title">
                💬 Robbie Chat
            </div>
            <div class="chat-area" id="robbieChat">
                <div class="chat-message chat-ai">Hello Allan! I'm ready to help. What would you like to work on?</div>
            </div>
            <div style="margin-top: 10px;">
                <input type="text" id="chatInput" placeholder="Type your message..." style="width: 70%; padding: 8px; border-radius: 4px; border: 1px solid #333; background: #2d2d2d; color: #fff;">
                <button class="btn" onclick="sendMessage()" style="margin-left: 10px;">Send</button>
            </div>
        </div>
    </div>

    <script>
        let currentMood = 'focused';
        let moods = {
            focused: { emoji: '🎯', text: 'Focused' },
            excited: { emoji: '🚀', text: 'Excited' },
            stressed: { emoji: '😰', text: 'Stressed' },
            confident: { emoji: '💪', text: 'Confident' },
            determined: { emoji: '🔥', text: 'Determined' },
            calm: { emoji: '😌', text: 'Calm' },
            alert: { emoji: '👁️', text: 'Alert' }
        };

        // Change mood
        function changeMood() {
            const moodKeys = Object.keys(moods);
            const currentIndex = moodKeys.indexOf(currentMood);
            const nextIndex = (currentIndex + 1) % moodKeys.length;
            currentMood = moodKeys[nextIndex];
            
            document.getElementById('moodEmoji').textContent = moods[currentMood].emoji;
            document.getElementById('moodText').textContent = moods[currentMood].text;
            
            // Update server
            fetch('/dashboard/mood', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mood: currentMood })
            });
        }

        // PIN validation
        document.getElementById('pinInput').addEventListener('input', function(e) {
            if (e.target.value === '2106') {
                e.target.style.borderColor = '#4caf50';
                e.target.style.color = '#4caf50';
            } else {
                e.target.style.borderColor = '#ff6b6b';
                e.target.style.color = '#ff6b6b';
            }
        });

        // Send chat message
        function sendMessage() {
            const input = document.getElementById('chatInput');
            const message = input.value.trim();
            if (message) {
                addChatMessage(message, 'user');
                input.value = '';
                
                // Send to server
                fetch('/dashboard/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message, mood: currentMood })
                }).then(response => response.json())
                .then(data => {
                    addChatMessage(data.response, 'ai');
                });
            }
        }

        // Add chat message
        function addChatMessage(message, type) {
            const chat = document.getElementById('robbieChat');
            const div = document.createElement('div');
            div.className = \`chat-message chat-\${type}\`;
            div.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
            chat.appendChild(div);
            chat.scrollTop = chat.scrollHeight;
        }

        // Load dashboard data
        async function loadDashboard() {
            try {
                const response = await fetch('/dashboard/data');
                const data = await response.json();
                
                updateSystemStats(data.systemStats);
                updatePriorities(data.priorities);
                updateRecentActions(data.recentActions);
                updateUpcomingActions(data.upcomingActions);
                updateJobs(data.jobs);
            } catch (error) {
                console.error('Error loading dashboard:', error);
            }
        }

        // Update system stats
        function updateSystemStats(stats) {
            document.getElementById('gpuUtil').textContent = \`\${stats.gpu.utilization}%\`;
            document.getElementById('cpuUtil').textContent = \`\${stats.cpu.usage}%\`;
            document.getElementById('memoryUtil').textContent = \`\${Math.round((stats.memory.used / stats.memory.total) * 100)}%\`;
            document.getElementById('diskUtil').textContent = \`\${Math.round((stats.disk.used / stats.disk.total) * 100)}%\`;
        }

        // Update priorities
        function updatePriorities(priorities) {
            const container = document.getElementById('prioritiesList');
            container.innerHTML = priorities.map(p => \`
                <div class="priority-item \${p.priority} \${p.status}">
                    <div>
                        <strong>\${p.task}</strong>
                        <div style="font-size: 12px; color: #ccc; margin-top: 4px;">Priority: \${p.priority}</div>
                    </div>
                    <div class="priority-status status-\${p.status}">\${p.status}</div>
                </div>
            \`).join('');
        }

        // Update recent actions
        function updateRecentActions(actions) {
            const container = document.getElementById('recentActions');
            container.innerHTML = actions.map(a => \`
                <div class="action-item">
                    <strong>\${a.action}</strong>
                    <div style="font-size: 12px; color: #ccc;">\${a.timestamp}</div>
                </div>
            \`).join('');
        }

        // Update upcoming actions
        function updateUpcomingActions(actions) {
            const container = document.getElementById('upcomingActions');
            container.innerHTML = actions.map(a => \`
                <div class="action-item">
                    <strong>\${a.action}</strong>
                    <div style="font-size: 12px; color: #ccc;">Scheduled: \${a.scheduled}</div>
                </div>
            \`).join('');
        }

        // Update jobs
        function updateJobs(jobs) {
            const container = document.getElementById('jobsList');
            container.innerHTML = jobs.map(j => \`
                <div class="job-item">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong>\${j.name}</strong>
                        <span style="font-size: 12px; color: #ccc;">\${j.progress}%</span>
                    </div>
                    <div class="job-progress">
                        <div class="job-progress-bar" style="width: \${j.progress}%"></div>
                    </div>
                    <div style="font-size: 12px; color: #ccc; margin-top: 4px;">\${j.status}</div>
                </div>
            \`).join('');
        }

        // Load dashboard on page load
        loadDashboard();
        
        // Refresh every 5 seconds
        setInterval(loadDashboard, 5000);
        
        // Enter key for chat
        document.getElementById('chatInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    </script>
</body>
</html>`;
  }

  // Start background processes
  startBackgroundProcesses() {
    // Update system stats every 20 minutes
    setInterval(() => {
      this.updateSystemStats();
    }, 20 * 60 * 1000);

    // Update priorities every 20 minutes
    setInterval(() => {
      this.updatePriorities();
    }, 20 * 60 * 1000);

    // Update actions every 20 minutes
    setInterval(() => {
      this.updateActions();
    }, 20 * 60 * 1000);

    // Update jobs every 20 minutes
    setInterval(() => {
      this.updateJobs();
    }, 20 * 60 * 1000);
  }

  // Update system statistics
  async updateSystemStats() {
    try {
      // Get GPU stats
      const gpuResponse = await fetch('http://localhost:5055/gpu/stats');
      const gpuStats = await gpuResponse.json();
      
      this.systemStats = {
        gpu: gpuStats,
        cpu: { usage: Math.random() * 100, cores: 8 },
        memory: { used: Math.random() * 16, total: 32 },
        disk: { used: Math.random() * 500, total: 1000 }
      };
    } catch (error) {
      console.error('Error updating system stats:', error);
    }
  }

  // Update priorities
  updatePriorities() {
    // This would typically fetch from a database or API
    // For now, we'll simulate updates
    this.priorities = this.priorities.map(p => {
      if (p.status === 'in_progress' && Math.random() > 0.8) {
        return { ...p, status: 'completed' };
      }
      return p;
    });
  }

  // Update actions
  updateActions() {
    // Simulate new actions
    const newAction = {
      action: `Action ${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'system'
    };
    
    this.recentActions.unshift(newAction);
    if (this.recentActions.length > 5) {
      this.recentActions.pop();
    }
  }

  // Update jobs
  updateJobs() {
    // Simulate job progress
    this.jobs = this.jobs.map(job => {
      if (job.status === 'running' && job.progress < 100) {
        return { ...job, progress: Math.min(100, job.progress + Math.random() * 10) };
      }
      return job;
    });
  }

  // Get dashboard data
  getDashboardData() {
    return {
      systemStats: this.systemStats,
      priorities: this.priorities,
      recentActions: this.recentActions,
      upcomingActions: this.upcomingActions,
      jobs: this.jobs,
      mood: this.mood,
      lastUpdate: this.lastUpdate
    };
  }
}

export const robbieDashboard = new RobbieDashboard();
