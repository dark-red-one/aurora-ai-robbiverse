import { approvalSystem } from "./approvalSystem.js";

// Approval UI System - Complete control over all outbound communications
export class ApprovalUI {
  constructor() {
    this.killswitchActive = true; // Default to ON
    this.stepMode = true; // Default to step-by-step
    this.pendingSteps = [];
    this.currentStep = null;
  }

  // Generate the main approval dashboard HTML
  generateDashboard() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Robbie Approval Control Center</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { 
            font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #1a1a1a; 
            color: #ffffff; 
        }
        .header { 
            background: #2d2d2d; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 20px; 
            border-left: 4px solid #ff6b6b;
        }
        .killswitch { 
            display: flex; 
            align-items: center; 
            gap: 15px; 
            margin-bottom: 15px; 
        }
        .switch { 
            position: relative; 
            width: 60px; 
            height: 30px; 
            background: #ff6b6b; 
            border-radius: 15px; 
            cursor: pointer; 
            transition: all 0.3s; 
        }
        .switch.active { background: #4caf50; }
        .switch::before { 
            content: ''; 
            position: absolute; 
            width: 26px; 
            height: 26px; 
            background: white; 
            border-radius: 50%; 
            top: 2px; 
            left: 2px; 
            transition: all 0.3s; 
        }
        .switch.active::before { transform: translateX(30px); }
        .status { 
            font-size: 18px; 
            font-weight: bold; 
        }
        .status.active { color: #4caf50; }
        .status.inactive { color: #ff6b6b; }
        .queue-section { 
            background: #2d2d2d; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 20px; 
        }
        .queue-item { 
            background: #3d3d3d; 
            padding: 15px; 
            margin: 10px 0; 
            border-radius: 6px; 
            border-left: 4px solid #ffa500; 
        }
        .queue-item.approved { border-left-color: #4caf50; }
        .queue-item.rejected { border-left-color: #ff6b6b; }
        .queue-item.pending { border-left-color: #ffa500; }
        .item-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 10px; 
        }
        .item-type { 
            background: #555; 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 12px; 
            font-weight: bold; 
        }
        .item-status { 
            font-size: 12px; 
            font-weight: bold; 
        }
        .item-content { 
            margin: 10px 0; 
            padding: 10px; 
            background: #1a1a1a; 
            border-radius: 4px; 
            font-family: monospace; 
            font-size: 14px; 
            white-space: pre-wrap; 
        }
        .item-actions { 
            display: flex; 
            gap: 10px; 
            margin-top: 10px; 
        }
        .btn { 
            padding: 8px 16px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
            font-weight: bold; 
            transition: all 0.3s; 
        }
        .btn-approve { background: #4caf50; color: white; }
        .btn-reject { background: #ff6b6b; color: white; }
        .btn-edit { background: #ffa500; color: white; }
        .btn-preview { background: #2196f3; color: white; }
        .btn-step { background: #9c27b0; color: white; }
        .btn:hover { opacity: 0.8; }
        .step-modal { 
            position: fixed; 
            top: 0; 
            left: 0; 
            width: 100%; 
            height: 100%; 
            background: rgba(0,0,0,0.8); 
            display: none; 
            justify-content: center; 
            align-items: center; 
            z-index: 1000; 
        }
        .step-content { 
            background: #2d2d2d; 
            padding: 30px; 
            border-radius: 8px; 
            max-width: 600px; 
            width: 90%; 
            text-align: center; 
        }
        .step-title { 
            font-size: 24px; 
            margin-bottom: 20px; 
            color: #9c27b0; 
        }
        .step-description { 
            font-size: 16px; 
            margin-bottom: 20px; 
            line-height: 1.5; 
        }
        .step-preview { 
            background: #1a1a1a; 
            padding: 15px; 
            border-radius: 4px; 
            margin: 20px 0; 
            text-align: left; 
            font-family: monospace; 
            white-space: pre-wrap; 
        }
        .step-actions { 
            display: flex; 
            gap: 15px; 
            justify-content: center; 
            margin-top: 20px; 
        }
        .btn-yes { 
            background: #4caf50; 
            color: white; 
            padding: 12px 24px; 
            font-size: 16px; 
        }
        .btn-no { 
            background: #ff6b6b; 
            color: white; 
            padding: 12px 24px; 
            font-size: 16px; 
        }
        .stats { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
            margin-bottom: 20px; 
        }
        .stat-card { 
            background: #2d2d2d; 
            padding: 15px; 
            border-radius: 6px; 
            text-align: center; 
        }
        .stat-number { 
            font-size: 24px; 
            font-weight: bold; 
            color: #4caf50; 
        }
        .stat-label { 
            font-size: 14px; 
            color: #ccc; 
            margin-top: 5px; 
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ Robbie Approval Control Center</h1>
        <div class="killswitch">
            <div class="switch ${this.killswitchActive ? 'active' : ''}" onclick="toggleKillswitch()"></div>
            <div class="status ${this.killswitchActive ? 'active' : 'inactive'}">
                ${this.killswitchActive ? 'KILLSWITCH: ON (All outbound blocked)' : 'KILLSWITCH: OFF (Outbound allowed)'}
            </div>
        </div>
        <div style="margin-top: 10px;">
            <label>
                <input type="checkbox" id="stepMode" ${this.stepMode ? 'checked' : ''} onchange="toggleStepMode()">
                Step-by-step mode (requires approval for each action)
            </label>
        </div>
    </div>

    <div class="stats" id="stats">
        <!-- Stats will be populated by JavaScript -->
    </div>

    <div class="queue-section">
        <h2>📋 Approval Queue</h2>
        <div id="queue-items">
            <!-- Queue items will be populated by JavaScript -->
        </div>
    </div>

    <div class="step-modal" id="stepModal">
        <div class="step-content">
            <div class="step-title">🤖 Robbie Step Confirmation</div>
            <div class="step-description" id="stepDescription">
                <!-- Step description will be populated -->
            </div>
            <div class="step-preview" id="stepPreview">
                <!-- Step preview will be populated -->
            </div>
            <div class="step-actions">
                <button class="btn btn-yes" onclick="confirmStep()">Yes, Execute</button>
                <button class="btn btn-no" onclick="cancelStep()">No, Cancel</button>
            </div>
        </div>
    </div>

    <script>
        let killswitchActive = ${this.killswitchActive};
        let stepMode = ${this.stepMode};
        let currentStep = null;

        // Toggle killswitch
        function toggleKillswitch() {
            killswitchActive = !killswitchActive;
            const switchEl = document.querySelector('.switch');
            const statusEl = document.querySelector('.status');
            
            if (killswitchActive) {
                switchEl.classList.add('active');
                statusEl.textContent = 'KILLSWITCH: ON (All outbound blocked)';
                statusEl.className = 'status active';
            } else {
                switchEl.classList.remove('active');
                statusEl.textContent = 'KILLSWITCH: OFF (Outbound allowed)';
                statusEl.className = 'status inactive';
            }
            
            // Update server
            fetch('/approval/killswitch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: killswitchActive })
            });
        }

        // Toggle step mode
        function toggleStepMode() {
            stepMode = document.getElementById('stepMode').checked;
            
            // Update server
            fetch('/approval/stepmode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: stepMode })
            });
        }

        // Show step confirmation modal
        function showStepConfirmation(step) {
            currentStep = step;
            const modal = document.getElementById('stepModal');
            const description = document.getElementById('stepDescription');
            const preview = document.getElementById('stepPreview');
            
            description.textContent = step.description;
            preview.textContent = step.preview;
            
            modal.style.display = 'flex';
        }

        // Confirm step execution
        function confirmStep() {
            if (currentStep) {
                // Execute the step
                fetch('/approval/execute-step', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stepId: currentStep.id })
                }).then(response => response.json())
                .then(result => {
                    console.log('Step executed:', result);
                    closeStepModal();
                    loadQueue(); // Refresh the queue
                });
            }
        }

        // Cancel step
        function cancelStep() {
            closeStepModal();
        }

        // Close step modal
        function closeStepModal() {
            document.getElementById('stepModal').style.display = 'none';
            currentStep = null;
        }

        // Load approval queue
        async function loadQueue() {
            try {
                const response = await fetch('/approval/queue');
                const data = await response.json();
                
                // Update stats
                updateStats(data.stats);
                
                // Update queue items
                updateQueueItems(data.queue);
            } catch (error) {
                console.error('Error loading queue:', error);
            }
        }

        // Update stats
        function updateStats(stats) {
            const statsEl = document.getElementById('stats');
            statsEl.innerHTML = \`
                <div class="stat-card">
                    <div class="stat-number">\${stats.pending}</div>
                    <div class="stat-label">Pending</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">\${stats.approved}</div>
                    <div class="stat-label">Approved</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">\${stats.sent}</div>
                    <div class="stat-label">Sent</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">\${stats.rejected}</div>
                    <div class="stat-label">Rejected</div>
                </div>
            \`;
        }

        // Update queue items
        function updateQueueItems(items) {
            const queueEl = document.getElementById('queue-items');
            queueEl.innerHTML = items.map(item => \`
                <div class="queue-item \${item.status}">
                    <div class="item-header">
                        <div class="item-type">\${item.type.toUpperCase()}</div>
                        <div class="item-status">\${item.status.toUpperCase()}</div>
                    </div>
                    <div><strong>To:</strong> \${item.recipient}</div>
                    <div><strong>Subject:</strong> \${item.subject || 'N/A'}</div>
                    <div class="item-content">\${item.content}</div>
                    <div class="item-actions">
                        <button class="btn btn-preview" onclick="previewItem('\${item.id}')">Preview</button>
                        <button class="btn btn-approve" onclick="approveItem('\${item.id}')">Approve</button>
                        <button class="btn btn-reject" onclick="rejectItem('\${item.id}')">Reject</button>
                        <button class="btn btn-edit" onclick="editItem('\${item.id}')">Edit</button>
                        <button class="btn btn-step" onclick="stepItem('\${item.id}')">Step Mode</button>
                    </div>
                </div>
            \`).join('');
        }

        // Preview item
        function previewItem(itemId) {
            // Show detailed preview
            console.log('Preview item:', itemId);
        }

        // Approve item
        function approveItem(itemId) {
            fetch(\`/approval/approve/\${itemId}\`, { method: 'POST' })
            .then(() => loadQueue());
        }

        // Reject item
        function rejectItem(itemId) {
            const reason = prompt('Rejection reason:');
            if (reason) {
                fetch(\`/approval/reject/\${itemId}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason })
                }).then(() => loadQueue());
            }
        }

        // Edit item
        function editItem(itemId) {
            // Show edit modal
            console.log('Edit item:', itemId);
        }

        // Step mode for item
        function stepItem(itemId) {
            // Show step confirmation
            const step = {
                id: itemId,
                description: \`I'm going to draft and send this \${item.type} to \${item.recipient} exactly as shown below. May I take this one step?\`,
                preview: \`To: \${item.recipient}\\nSubject: \${item.subject || 'N/A'}\\n\\n\${item.content}\`
            };
            showStepConfirmation(step);
        }

        // Load queue on page load
        loadQueue();
        
        // Refresh every 5 seconds
        setInterval(loadQueue, 5000);
    </script>
</body>
</html>`;
  }

  // Generate step confirmation for specific action
  generateStepConfirmation(action, details) {
    return {
      id: action.id,
      description: `I'm going to ${action.type} ${action.target} exactly as shown below. May I take this one step?`,
      preview: this.formatStepPreview(action, details),
      requiresApproval: true
    };
  }

  // Format step preview
  formatStepPreview(action, details) {
    switch (action.type) {
      case 'email':
        return `To: ${action.recipient}
Subject: ${action.subject}

${action.content}`;
      
      case 'linkedin':
        return `Post Content:
${action.content}

Tags: ${action.tags || 'None'}`;
      
      case 'call':
        return `Call: ${action.recipient}
Script: ${action.script}
Purpose: ${action.purpose}`;
      
      default:
        return `Action: ${action.type}
Target: ${action.target}
Details: ${JSON.stringify(details, null, 2)}`;
    }
  }
}

export const approvalUI = new ApprovalUI();
