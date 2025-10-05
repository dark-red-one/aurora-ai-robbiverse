import { db } from "./db.js";
import { randomUUID } from "crypto";
import { directGPU } from "./directGPU.js";
import { workTracker } from "./workTracker.js";

// File Portal System - Animated drop zone with transporter beam effects
export class FilePortal {
  constructor() {
    this.initializeTables();
    this.processingQueue = [];
    this.isProcessing = false;
  }

  initializeTables() {
    // File processing queue
    db.prepare(`
      CREATE TABLE IF NOT EXISTS file_processing (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER,
        status TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'processing', 'completed', 'failed'
        processing_steps TEXT, -- JSON array of steps
        observations TEXT, -- JSON array of observations
        extracted_data TEXT, -- JSON object
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        completed_at TEXT
      )
    `).run();

    // File observations
    db.prepare(`
      CREATE TABLE IF NOT EXISTS file_observations (
        id TEXT PRIMARY KEY,
        file_id TEXT NOT NULL,
        observation_type TEXT NOT NULL, -- 'contact', 'sentiment', 'technical', 'business'
        observation_text TEXT NOT NULL,
        confidence_score REAL DEFAULT 0.5,
        metadata TEXT, -- JSON object
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Indexes
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_file_processing_status ON file_processing(status, created_at)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_file_observations_file ON file_observations(file_id, observation_type)`).run();
  }

  // Generate file portal interface
  generateFilePortal() {
    return `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>File Portal - Robbieverse</title>
<style>
/* File Portal Aesthetic */
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
  --portal-blue: #00aaff;
  --portal-purple: #aa00ff;
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

/* File Panel */
.file-panel {
  width: 400px;
  background: var(--bg-secondary);
  border-right: 2px solid var(--border);
  display: flex;
  flex-direction: column;
}

.file-panel-header {
  background: var(--bg-tertiary);
  padding: 15px;
  border-bottom: 1px solid var(--border);
}

.file-panel-title {
  color: var(--text-accent);
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}

.file-panel-subtitle {
  color: var(--text-secondary);
  font-size: 12px;
}

/* Drop Zone */
.drop-zone {
  flex: 1;
  margin: 20px;
  border: 3px dashed var(--border);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.drop-zone.dragover {
  border-color: var(--portal-blue);
  background: rgba(0, 170, 255, 0.1);
  transform: scale(1.02);
}

.drop-zone.processing {
  border-color: var(--text-success);
  background: rgba(0, 255, 0, 0.1);
}

.drop-zone-icon {
  font-size: 48px;
  color: var(--text-secondary);
  margin-bottom: 15px;
  transition: all 0.3s ease;
}

.drop-zone.dragover .drop-zone-icon {
  color: var(--portal-blue);
  transform: scale(1.1);
}

.drop-zone-text {
  color: var(--text-secondary);
  font-size: 14px;
  text-align: center;
  margin-bottom: 10px;
}

.drop-zone-subtext {
  color: var(--text-secondary);
  font-size: 11px;
  text-align: center;
}

/* Transporter Beam Effect */
.transporter-beam {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    0deg,
    transparent 0%,
    rgba(0, 170, 255, 0.3) 20%,
    rgba(170, 0, 255, 0.3) 50%,
    rgba(0, 170, 255, 0.3) 80%,
    transparent 100%
  );
  animation: beam 2s ease-in-out infinite;
  opacity: 0;
  pointer-events: none;
}

.transporter-beam.active {
  opacity: 1;
}

@keyframes beam {
  0%, 100% { transform: translateY(-100%); }
  50% { transform: translateY(100%); }
}

/* Processing Steps */
.processing-steps {
  padding: 20px;
  border-top: 1px solid var(--border);
  max-height: 200px;
  overflow-y: auto;
}

.processing-step {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
}

.step-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--text-secondary);
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

.step-icon.completed {
  background: var(--text-success);
  color: var(--bg-primary);
}

.step-icon.processing {
  background: var(--text-warning);
  color: var(--bg-primary);
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.step-text {
  color: var(--text-primary);
}

/* Chat Surface */
.chat-surface {
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

.message-observation {
  color: var(--text-primary);
}

.message-observation.contact {
  color: var(--portal-blue);
}

.message-observation.sentiment {
  color: var(--text-warning);
}

.message-observation.technical {
  color: var(--text-success);
}

.message-observation.business {
  color: var(--text-accent);
}

.message-prompt {
  color: var(--text-secondary);
  font-style: italic;
  margin-top: 5px;
  padding-left: 20px;
}

/* Commodore READY */
.commodore-ready {
  color: var(--text-accent);
  font-weight: bold;
  margin-top: 10px;
  display: flex;
  align-items: center;
}

.cursor-blink {
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* File List */
.file-list {
  padding: 20px;
  border-top: 1px solid var(--border);
  max-height: 300px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 8px;
  margin-bottom: 5px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  font-size: 12px;
}

.file-icon {
  margin-right: 8px;
  font-size: 14px;
}

.file-name {
  flex: 1;
  color: var(--text-primary);
}

.file-status {
  color: var(--text-secondary);
  font-size: 10px;
}
</style>
</head><body>
  <div class="container">
    <!-- File Panel -->
    <div class="file-panel">
      <div class="file-panel-header">
        <div class="file-panel-title">📁 FILE PORTAL</div>
        <div class="file-panel-subtitle">Drop files to process through Robbieverse</div>
      </div>
      
      <div class="drop-zone" id="drop-zone">
        <div class="transporter-beam" id="transporter-beam"></div>
        <div class="drop-zone-icon">📁</div>
        <div class="drop-zone-text">Drop files here</div>
        <div class="drop-zone-subtext">or click to browse</div>
      </div>
      
      <div class="processing-steps" id="processing-steps">
        <!-- Processing steps will appear here -->
      </div>
      
      <div class="file-list" id="file-list">
        <!-- File list will appear here -->
      </div>
    </div>
    
    <!-- Chat Surface -->
    <div class="chat-surface">
      <div class="chat-header">
        <div class="chat-title">ROBBIEVERSE CHAT</div>
        <div class="chat-status">● ONLINE</div>
      </div>
      
      <div class="chat-messages" id="chat-messages">
        <div class="message">
          <span class="message-timestamp">[${new Date().toLocaleTimeString()}]</span>
          <div class="message-content">
            <div class="message-system">File Portal initialized. Ready to process files through the Robbieverse.</div>
          </div>
        </div>
      </div>
      
      <div class="commodore-ready" id="commodore-ready" style="display: none;">
        <span>READY.</span>
        <span class="cursor-blink">_</span>
      </div>
    </div>
  </div>

  <script>
    // File Portal JavaScript
    const dropZone = document.getElementById('drop-zone');
    const transporterBeam = document.getElementById('transporter-beam');
    const processingSteps = document.getElementById('processing-steps');
    const chatMessages = document.getElementById('chat-messages');
    const commodoreReady = document.getElementById('commodore-ready');
    const fileList = document.getElementById('file-list');

    let isProcessing = false;

    // Drag and drop handlers
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      
      const files = Array.from(e.dataTransfer.files);
      files.forEach(file => processFile(file));
    });

    // Click to browse
    dropZone.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.onchange = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => processFile(file));
      };
      input.click();
    });

    async function processFile(file) {
      if (isProcessing) {
        addMessage('system', 'Please wait for current file to finish processing.', 'system');
        return;
      }

      isProcessing = true;
      dropZone.classList.add('processing');
      
      // Start transporter beam effect
      transporterBeam.classList.add('active');
      
      // Add file to list
      addFileToList(file);
      
      // Clear previous processing steps
      processingSteps.innerHTML = '';
      
      // Add processing steps
      const steps = [
        { text: 'File received', icon: '✓' },
        { text: 'Analyzing file type', icon: '⏳' },
        { text: 'Extracting data', icon: '⏳' },
        { text: 'Running AI analysis', icon: '⏳' },
        { text: 'Generating observations', icon: '⏳' },
        { text: 'Updating databases', icon: '⏳' }
      ];
      
      steps.forEach((step, index) => {
        setTimeout(() => {
          addProcessingStep(step.text, step.icon, index === steps.length - 1);
        }, index * 1000);
      });
      
      // Simulate file processing
      setTimeout(async () => {
        await simulateFileProcessing(file);
        isProcessing = false;
        dropZone.classList.remove('processing');
        transporterBeam.classList.remove('active');
        showCommodoreReady();
      }, steps.length * 1000);
    }

    function addProcessingStep(text, icon, isLast) {
      const stepDiv = document.createElement('div');
      stepDiv.className = 'processing-step';
      stepDiv.innerHTML = \`
        <div class="step-icon \${icon === '✓' ? 'completed' : icon === '⏳' ? 'processing' : ''}">\${icon}</div>
        <div class="step-text">\${text}</div>
      \`;
      processingSteps.appendChild(stepDiv);
    }

    async function simulateFileProcessing(file) {
      // Simulate different file types and processing
      const fileType = file.type;
      const fileName = file.name;
      
      addMessage('system', \`Processing \${fileName} (\${fileType})\`, 'system');
      
      // Simulate observations based on file type
      if (fileType.includes('image')) {
        addMessage('observation', 'Interpreting images using VZX filter...', 'technical');
        addMessage('observation', 'Found 3 faces in image - running facial recognition', 'technical');
        addMessage('observation', 'Detected: Mark Johnson (confidence: 87%)', 'contact');
      } else if (fileType.includes('pdf')) {
        addMessage('observation', 'Extracting text using OCR...', 'technical');
        addMessage('observation', 'Found Mark\'s phone number - adding to CRM', 'contact');
        addMessage('observation', 'Document sentiment: Professional, slightly urgent', 'sentiment');
      } else if (fileType.includes('text') || fileName.includes('email')) {
        addMessage('observation', 'Analyzing text content...', 'technical');
        addMessage('observation', 'Melanie seems upset today... Sentiment trending down', 'sentiment');
        addMessage('observation', 'CONGRATS - you\'ve been invited to that lunch bill mentioned', 'business');
        addMessage('observation', '5th outreach from Mom today... She\'s worried about the bank', 'contact');
      }
      
      // Add some random technical observations
      const techObservations = [
        'Running sentiment analysis on extracted text',
        'Cross-referencing with existing contact database',
        'Updating relationship strength scores',
        'Generating follow-up recommendations',
        'Syncing with HubSpot CRM',
        'Creating calendar reminders',
        'Analyzing communication patterns'
      ];
      
      techObservations.forEach((obs, index) => {
        setTimeout(() => {
          addMessage('observation', obs, 'technical');
        }, (index + 1) * 500);
      });
    }

    function addMessage(type, text, category = 'system') {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message';
      
      const timestamp = new Date().toLocaleTimeString();
      messageDiv.innerHTML = \`
        <span class="message-timestamp">[\${timestamp}]</span>
        <div class="message-content">
          <div class="message-\${type} message-observation \${category}">\${text}</div>
        </div>
      \`;
      
      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addFileToList(file) {
      const fileDiv = document.createElement('div');
      fileDiv.className = 'file-item';
      fileDiv.innerHTML = \`
        <div class="file-icon">📄</div>
        <div class="file-name">\${file.name}</div>
        <div class="file-status">Processing...</div>
      \`;
      fileList.appendChild(fileDiv);
    }

    function showCommodoreReady() {
      commodoreReady.style.display = 'flex';
      setTimeout(() => {
        commodoreReady.style.display = 'none';
      }, 3000);
    }

    // Auto-scroll chat
    setInterval(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
  </script>
</body></html>`;
  }

  // Process file through Robbieverse
  async processFile(file) {
    const fileId = randomUUID();
    
    try {
      // Record file processing start
      db.prepare(`
        INSERT INTO file_processing (id, filename, file_type, file_size, status)
        VALUES (?, ?, ?, ?, 'processing')
      `).run(fileId, file.name, file.type, file.size);

      // Simulate processing steps
      const steps = [
        'File received and validated',
        'Analyzing file type and structure',
        'Extracting text and metadata',
        'Running AI analysis',
        'Generating observations',
        'Updating databases'
      ];

      // Process with AI
      const observations = await this.analyzeFile(file);
      
      // Record observations
      for (const observation of observations) {
        const obsId = randomUUID();
        db.prepare(`
          INSERT INTO file_observations (id, file_id, observation_type, observation_text, confidence_score, metadata)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(obsId, fileId, observation.type, observation.text, observation.confidence, JSON.stringify(observation.metadata));
      }

      // Update file status
      db.prepare(`
        UPDATE file_processing 
        SET status = 'completed', completed_at = datetime('now'), observations = ?, extracted_data = ?
        WHERE id = ?
      `).run(JSON.stringify(observations), JSON.stringify({}), fileId);

      return { fileId, observations };
    } catch (error) {
      console.error('File processing error:', error);
      
      // Mark as failed
      db.prepare(`
        UPDATE file_processing 
        SET status = 'failed', completed_at = datetime('now')
        WHERE id = ?
      `).run(fileId);

      throw error;
    }
  }

  // Analyze file content with AI
  async analyzeFile(file) {
    const observations = [];
    
    try {
      // Read file content
      const content = await this.readFileContent(file);
      
      // Use direct GPU for analysis
      const analysisPrompt = `
        Analyze this file content and extract key observations:
        
        File: ${file.name}
        Type: ${file.type}
        Content: ${content.substring(0, 2000)}
        
        Provide observations in this format:
        - CONTACT: [any contact information found]
        - SENTIMENT: [emotional tone and sentiment analysis]
        - TECHNICAL: [technical details and processing notes]
        - BUSINESS: [business insights and opportunities]
        
        Be specific and actionable.
      `;
      
      const analysis = await directGPU.generateText(analysisPrompt, {
        model: 'llama-maverick',
        temperature: 0.3,
        max_tokens: 1000
      });
      
      // Parse analysis into observations
      const lines = analysis.response.split('\n');
      for (const line of lines) {
        if (line.includes('CONTACT:')) {
          observations.push({
            type: 'contact',
            text: line.replace('CONTACT:', '').trim(),
            confidence: 0.8,
            metadata: { source: 'ai_analysis' }
          });
        } else if (line.includes('SENTIMENT:')) {
          observations.push({
            type: 'sentiment',
            text: line.replace('SENTIMENT:', '').trim(),
            confidence: 0.7,
            metadata: { source: 'ai_analysis' }
          });
        } else if (line.includes('TECHNICAL:')) {
          observations.push({
            type: 'technical',
            text: line.replace('TECHNICAL:', '').trim(),
            confidence: 0.9,
            metadata: { source: 'ai_analysis' }
          });
        } else if (line.includes('BUSINESS:')) {
          observations.push({
            type: 'business',
            text: line.replace('BUSINESS:', '').trim(),
            confidence: 0.8,
            metadata: { source: 'ai_analysis' }
          });
        }
      }
      
      return observations;
    } catch (error) {
      console.error('File analysis error:', error);
      return [{
        type: 'technical',
        text: `Error analyzing file: ${error.message}`,
        confidence: 1.0,
        metadata: { source: 'error' }
      }];
    }
  }

  // Read file content based on type
  async readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  // Get file processing history
  getFileHistory(limit = 20) {
    try {
      return db.prepare(`
        SELECT * FROM file_processing 
        ORDER BY created_at DESC 
        LIMIT ?
      `).all(limit);
    } catch (error) {
      console.error('Error getting file history:', error);
      return [];
    }
  }

  // Get observations by type
  getObservationsByType(observationType, limit = 50) {
    try {
      return db.prepare(`
        SELECT fo.*, fp.filename 
        FROM file_observations fo
        JOIN file_processing fp ON fo.file_id = fp.id
        WHERE fo.observation_type = ?
        ORDER BY fo.created_at DESC
        LIMIT ?
      `).all(observationType, limit);
    } catch (error) {
      console.error('Error getting observations:', error);
      return [];
    }
  }
}

// Singleton instance
export const filePortal = new FilePortal();
