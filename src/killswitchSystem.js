// Robbie V3 Killswitch System - Visual n8n integration for outbound communication control
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class KillswitchSystem {
  constructor() {
    this.modes = {
      SAFE: 'safe',
      TEST: 'test', 
      LIVE: 'live'
    };
    this.currentMode = this.modes.SAFE;
    this.queuedCommunications = [];
    this.bridgeStatus = {
      smtp: 'disconnected',
      sms: 'disconnected',
      api: 'disconnected'
    };
    this.n8nWorkflowPath = '/home/allan/n8n/workflows';
    this.workflowTemplates = new Map();
  }

  // Initialize killswitch system
  async initialize() {
    console.log('🔌 Initializing Killswitch System...');
    
    try {
      // Create n8n workflow directory
      await this.createN8nDirectory();
      
      // Generate workflow templates
      await this.generateWorkflowTemplates();
      
      // Create the main killswitch workflow
      await this.createKillswitchWorkflow();
      
      // Set up monitoring
      await this.setupMonitoring();
      
      console.log('✅ Killswitch System initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Killswitch System initialization failed:', error);
      throw error;
    }
  }

  // Create n8n workflow directory
  async createN8nDirectory() {
    const dirs = [
      '/home/allan/n8n',
      '/home/allan/n8n/workflows',
      '/home/allan/n8n/workflows/killswitch',
      '/home/allan/n8n/workflows/templates',
      '/home/allan/n8n/workflows/modes'
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  // Generate workflow templates
  async generateWorkflowTemplates() {
    console.log('📋 Generating workflow templates...');
    
    // SMTP Bridge Template
    await this.generateSMTPBridgeTemplate();
    
    // SMS Bridge Template
    await this.generateSMSBridgeTemplate();
    
    // API Bridge Template
    await this.generateAPIBridgeTemplate();
    
    // Mode Switcher Template
    await this.generateModeSwitcherTemplate();
  }

  // Generate SMTP Bridge Template
  async generateSMTPBridgeTemplate() {
    const smtpTemplate = {
      "name": "SMTP Bridge - Killswitch Control",
      "nodes": [
        {
          "id": "smtp-input",
          "name": "SMTP Input",
          "type": "n8n-nodes-base.webhook",
          "typeVersion": 1,
          "position": [100, 300],
          "parameters": {
            "path": "smtp-bridge",
            "httpMethod": "POST"
          }
        },
        {
          "id": "smtp-mode-check",
          "name": "Mode Check",
          "type": "n8n-nodes-base.function",
          "typeVersion": 1,
          "position": [300, 300],
          "parameters": {
            "functionCode": `
              const mode = $('smtp-mode').first().json.mode || 'SAFE';
              const communication = $input.first().json;
              
              return {
                mode: mode,
                communication: communication,
                timestamp: new Date().toISOString()
              };
            `
          }
        },
        {
          "id": "smtp-safe-mode",
          "name": "SAFE MODE - Send to Allan",
          "type": "n8n-nodes-base.emailSend",
          "typeVersion": 1,
          "position": [500, 200],
          "parameters": {
            "fromEmail": "robbie@heyrobbie.ai",
            "toEmail": "allan@testpilotcpg.com",
            "subject": "🔒 SAFE MODE: {{ $json.communication.subject }}",
            "message": `
              <h2>🔒 SAFE MODE - Outbound Communication Blocked</h2>
              <p><strong>Original Recipient:</strong> {{ $json.communication.to }}</p>
              <p><strong>Subject:</strong> {{ $json.communication.subject }}</p>
              <p><strong>Message:</strong></p>
              <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0;">
                {{ $json.communication.body }}
              </div>
              <p><strong>Timestamp:</strong> {{ $json.timestamp }}</p>
              <p><strong>Mode:</strong> {{ $json.mode }}</p>
            `,
            "options": {
              "allowUnauthorizedCerts": false
            }
          }
        },
        {
          "id": "smtp-test-mode",
          "name": "TEST MODE - Send to Allan",
          "type": "n8n-nodes-base.emailSend",
          "typeVersion": 1,
          "position": [500, 300],
          "parameters": {
            "fromEmail": "robbie@heyrobbie.ai",
            "toEmail": "allan@testpilotcpg.com",
            "subject": "🧪 TEST MODE: {{ $json.communication.subject }}",
            "message": `
              <h2>🧪 TEST MODE - Outbound Communication Test</h2>
              <p><strong>Original Recipient:</strong> {{ $json.communication.to }}</p>
              <p><strong>Subject:</strong> {{ $json.communication.subject }}</p>
              <p><strong>Message:</strong></p>
              <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0;">
                {{ $json.communication.body }}
              </div>
              <p><strong>Timestamp:</strong> {{ $json.timestamp }}</p>
              <p><strong>Mode:</strong> {{ $json.mode }}</p>
              <p><strong>Note:</strong> This would have been sent to the original recipient in LIVE mode.</p>
            `,
            "options": {
              "allowUnauthorizedCerts": false
            }
          }
        },
        {
          "id": "smtp-live-mode",
          "name": "LIVE MODE - Send to Recipient",
          "type": "n8n-nodes-base.emailSend",
          "typeVersion": 1,
          "position": [500, 400],
          "parameters": {
            "fromEmail": "robbie@heyrobbie.ai",
            "toEmail": "{{ $json.communication.to }}",
            "subject": "{{ $json.communication.subject }}",
            "message": "{{ $json.communication.body }}",
            "options": {
              "allowUnauthorizedCerts": false
            }
          }
        },
        {
          "id": "smtp-queue",
          "name": "Queue Communication",
          "type": "n8n-nodes-base.function",
          "typeVersion": 1,
          "position": [700, 300],
          "parameters": {
            "functionCode": `
              const communication = $input.first().json;
              
              // Queue the communication for audit
              const queuedComm = {
                id: Date.now().toString(),
                type: 'email',
                recipient: communication.communication.to,
                subject: communication.communication.subject,
                body: communication.communication.body,
                mode: communication.mode,
                timestamp: communication.timestamp,
                status: 'queued',
                bridge: 'smtp'
              };
              
              // Store in database or send to Robbie
              return queuedComm;
            `
          }
        }
      ],
      "connections": {
        "smtp-input": {
          "main": [
            [
              {
                "node": "smtp-mode-check",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "smtp-mode-check": {
          "main": [
            [
              {
                "node": "smtp-safe-mode",
                "type": "main",
                "index": 0
              },
              {
                "node": "smtp-test-mode",
                "type": "main",
                "index": 0
              },
              {
                "node": "smtp-live-mode",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "smtp-safe-mode": {
          "main": [
            [
              {
                "node": "smtp-queue",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "smtp-test-mode": {
          "main": [
            [
              {
                "node": "smtp-queue",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "smtp-live-mode": {
          "main": [
            [
              {
                "node": "smtp-queue",
                "type": "main",
                "index": 0
              }
            ]
          ]
        }
      },
      "active": false,
      "settings": {
        "executionOrder": "v1"
      },
      "versionId": "1"
    };

    await fs.writeFile(
      '/home/allan/n8n/workflows/templates/smtp-bridge.json',
      JSON.stringify(smtpTemplate, null, 2)
    );
  }

  // Generate SMS Bridge Template
  async generateSMSBridgeTemplate() {
    const smsTemplate = {
      "name": "SMS Bridge - Killswitch Control",
      "nodes": [
        {
          "id": "sms-input",
          "name": "SMS Input",
          "type": "n8n-nodes-base.webhook",
          "typeVersion": 1,
          "position": [100, 300],
          "parameters": {
            "path": "sms-bridge",
            "httpMethod": "POST"
          }
        },
        {
          "id": "sms-mode-check",
          "name": "Mode Check",
          "type": "n8n-nodes-base.function",
          "typeVersion": 1,
          "position": [300, 300],
          "parameters": {
            "functionCode": `
              const mode = $('sms-mode').first().json.mode || 'SAFE';
              const communication = $input.first().json;
              
              return {
                mode: mode,
                communication: communication,
                timestamp: new Date().toISOString()
              };
            `
          }
        },
        {
          "id": "sms-safe-mode",
          "name": "SAFE MODE - Send to Allan",
          "type": "n8n-nodes-base.twilio",
          "typeVersion": 1,
          "position": [500, 200],
          "parameters": {
            "operation": "send",
            "to": "+14793664632",
            "message": "🔒 SAFE MODE: {{ $json.communication.message }} (Original: {{ $json.communication.to }})"
          }
        },
        {
          "id": "sms-test-mode",
          "name": "TEST MODE - Send to Allan",
          "type": "n8n-nodes-base.twilio",
          "typeVersion": 1,
          "position": [500, 300],
          "parameters": {
            "operation": "send",
            "to": "+14793664632",
            "message": "🧪 TEST MODE: {{ $json.communication.message }} (Original: {{ $json.communication.to }})"
          }
        },
        {
          "id": "sms-live-mode",
          "name": "LIVE MODE - Send to Recipient",
          "type": "n8n-nodes-base.twilio",
          "typeVersion": 1,
          "position": [500, 400],
          "parameters": {
            "operation": "send",
            "to": "{{ $json.communication.to }}",
            "message": "{{ $json.communication.message }}"
          }
        },
        {
          "id": "sms-queue",
          "name": "Queue Communication",
          "type": "n8n-nodes-base.function",
          "typeVersion": 1,
          "position": [700, 300],
          "parameters": {
            "functionCode": `
              const communication = $input.first().json;
              
              const queuedComm = {
                id: Date.now().toString(),
                type: 'sms',
                recipient: communication.communication.to,
                message: communication.communication.message,
                mode: communication.mode,
                timestamp: communication.timestamp,
                status: 'queued',
                bridge: 'sms'
              };
              
              return queuedComm;
            `
          }
        }
      ],
      "connections": {
        "sms-input": {
          "main": [
            [
              {
                "node": "sms-mode-check",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "sms-mode-check": {
          "main": [
            [
              {
                "node": "sms-safe-mode",
                "type": "main",
                "index": 0
              },
              {
                "node": "sms-test-mode",
                "type": "main",
                "index": 0
              },
              {
                "node": "sms-live-mode",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "sms-safe-mode": {
          "main": [
            [
              {
                "node": "sms-queue",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "sms-test-mode": {
          "main": [
            [
              {
                "node": "sms-queue",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "sms-live-mode": {
          "main": [
            [
              {
                "node": "sms-queue",
                "type": "main",
                "index": 0
              }
            ]
          ]
        }
      },
      "active": false,
      "settings": {
        "executionOrder": "v1"
      },
      "versionId": "1"
    };

    await fs.writeFile(
      '/home/allan/n8n/workflows/templates/sms-bridge.json',
      JSON.stringify(smsTemplate, null, 2)
    );
  }

  // Generate API Bridge Template
  async generateAPIBridgeTemplate() {
    const apiTemplate = {
      "name": "API Bridge - Killswitch Control",
      "nodes": [
        {
          "id": "api-input",
          "name": "API Input",
          "type": "n8n-nodes-base.webhook",
          "typeVersion": 1,
          "position": [100, 300],
          "parameters": {
            "path": "api-bridge",
            "httpMethod": "POST"
          }
        },
        {
          "id": "api-mode-check",
          "name": "Mode Check",
          "type": "n8n-nodes-base.function",
          "typeVersion": 1,
          "position": [300, 300],
          "parameters": {
            "functionCode": `
              const mode = $('api-mode').first().json.mode || 'SAFE';
              const communication = $input.first().json;
              
              return {
                mode: mode,
                communication: communication,
                timestamp: new Date().toISOString()
              };
            `
          }
        },
        {
          "id": "api-safe-mode",
          "name": "SAFE MODE - Log to Allan",
          "type": "n8n-nodes-base.emailSend",
          "typeVersion": 1,
          "position": [500, 200],
          "parameters": {
            "fromEmail": "robbie@heyrobbie.ai",
            "toEmail": "allan@testpilotcpg.com",
            "subject": "🔒 SAFE MODE: API Call Blocked",
            "message": `
              <h2>🔒 SAFE MODE - API Call Blocked</h2>
              <p><strong>Endpoint:</strong> {{ $json.communication.endpoint }}</p>
              <p><strong>Method:</strong> {{ $json.communication.method }}</p>
              <p><strong>Data:</strong></p>
              <pre>{{ JSON.stringify($json.communication.data, null, 2) }}</pre>
              <p><strong>Timestamp:</strong> {{ $json.timestamp }}</p>
              <p><strong>Mode:</strong> {{ $json.mode }}</p>
            `
          }
        },
        {
          "id": "api-test-mode",
          "name": "TEST MODE - Log to Allan",
          "type": "n8n-nodes-base.emailSend",
          "typeVersion": 1,
          "position": [500, 300],
          "parameters": {
            "fromEmail": "robbie@heyrobbie.ai",
            "toEmail": "allan@testpilotcpg.com",
            "subject": "🧪 TEST MODE: API Call Test",
            "message": `
              <h2>🧪 TEST MODE - API Call Test</h2>
              <p><strong>Endpoint:</strong> {{ $json.communication.endpoint }}</p>
              <p><strong>Method:</strong> {{ $json.communication.method }}</p>
              <p><strong>Data:</strong></p>
              <pre>{{ JSON.stringify($json.communication.data, null, 2) }}</pre>
              <p><strong>Timestamp:</strong> {{ $json.timestamp }}</p>
              <p><strong>Mode:</strong> {{ $json.mode }}</p>
              <p><strong>Note:</strong> This would have been sent to the original endpoint in LIVE mode.</p>
            `
          }
        },
        {
          "id": "api-live-mode",
          "name": "LIVE MODE - Send to Endpoint",
          "type": "n8n-nodes-base.httpRequest",
          "typeVersion": 1,
          "position": [500, 400],
          "parameters": {
            "url": "{{ $json.communication.endpoint }}",
            "method": "{{ $json.communication.method }}",
            "body": "{{ JSON.stringify($json.communication.data) }}",
            "options": {
              "headers": {
                "Content-Type": "application/json"
              }
            }
          }
        },
        {
          "id": "api-queue",
          "name": "Queue Communication",
          "type": "n8n-nodes-base.function",
          "typeVersion": 1,
          "position": [700, 300],
          "parameters": {
            "functionCode": `
              const communication = $input.first().json;
              
              const queuedComm = {
                id: Date.now().toString(),
                type: 'api',
                endpoint: communication.communication.endpoint,
                method: communication.communication.method,
                data: communication.communication.data,
                mode: communication.mode,
                timestamp: communication.timestamp,
                status: 'queued',
                bridge: 'api'
              };
              
              return queuedComm;
            `
          }
        }
      ],
      "connections": {
        "api-input": {
          "main": [
            [
              {
                "node": "api-mode-check",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "api-mode-check": {
          "main": [
            [
              {
                "node": "api-safe-mode",
                "type": "main",
                "index": 0
              },
              {
                "node": "api-test-mode",
                "type": "main",
                "index": 0
              },
              {
                "node": "api-live-mode",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "api-safe-mode": {
          "main": [
            [
              {
                "node": "api-queue",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "api-test-mode": {
          "main": [
            [
              {
                "node": "api-queue",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "api-live-mode": {
          "main": [
            [
              {
                "node": "api-queue",
                "type": "main",
                "index": 0
              }
            ]
          ]
        }
      },
      "active": false,
      "settings": {
        "executionOrder": "v1"
      },
      "versionId": "1"
    };

    await fs.writeFile(
      '/home/allan/n8n/workflows/templates/api-bridge.json',
      JSON.stringify(apiTemplate, null, 2)
    );
  }

  // Generate Mode Switcher Template
  async generateModeSwitcherTemplate() {
    const modeSwitcher = {
      "name": "Mode Switcher - Killswitch Control",
      "nodes": [
        {
          "id": "mode-input",
          "name": "Mode Input",
          "type": "n8n-nodes-base.webhook",
          "typeVersion": 1,
          "position": [100, 300],
          "parameters": {
            "path": "mode-switch",
            "httpMethod": "POST"
          }
        },
        {
          "id": "mode-validator",
          "name": "Mode Validator",
          "type": "n8n-nodes-base.function",
          "typeVersion": 1,
          "position": [300, 300],
          "parameters": {
            "functionCode": `
              const validModes = ['SAFE', 'TEST', 'LIVE'];
              const requestedMode = $input.first().json.mode;
              
              if (!validModes.includes(requestedMode)) {
                throw new Error('Invalid mode. Must be SAFE, TEST, or LIVE');
              }
              
              return {
                mode: requestedMode,
                timestamp: new Date().toISOString(),
                valid: true
              };
            `
          }
        },
        {
          "id": "mode-updater",
          "name": "Update Mode",
          "type": "n8n-nodes-base.function",
          "typeVersion": 1,
          "position": [500, 300],
          "parameters": {
            "functionCode": `
              const mode = $input.first().json.mode;
              
              // Update mode in all bridges
              const updates = [
                { bridge: 'smtp', mode: mode },
                { bridge: 'sms', mode: mode },
                { bridge: 'api', mode: mode }
              ];
              
              return {
                updates: updates,
                currentMode: mode,
                timestamp: new Date().toISOString()
              };
            `
          }
        },
        {
          "id": "mode-confirmation",
          "name": "Mode Confirmation",
          "type": "n8n-nodes-base.emailSend",
          "typeVersion": 1,
          "position": [700, 300],
          "parameters": {
            "fromEmail": "robbie@heyrobbie.ai",
            "toEmail": "allan@testpilotcpg.com",
            "subject": "🔌 Killswitch Mode Changed: {{ $json.currentMode }}",
            "message": `
              <h2>🔌 Killswitch Mode Changed</h2>
              <p><strong>New Mode:</strong> {{ $json.currentMode }}</p>
              <p><strong>Timestamp:</strong> {{ $json.timestamp }}</p>
              <p><strong>Bridges Updated:</strong></p>
              <ul>
                {{ $json.updates.map(update => '<li>' + update.bridge + ': ' + update.mode + '</li>').join('') }}
              </ul>
            `
          }
        }
      ],
      "connections": {
        "mode-input": {
          "main": [
            [
              {
                "node": "mode-validator",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "mode-validator": {
          "main": [
            [
              {
                "node": "mode-updater",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "mode-updater": {
          "main": [
            [
              {
                "node": "mode-confirmation",
                "type": "main",
                "index": 0
              }
            ]
          ]
        }
      },
      "active": false,
      "settings": {
        "executionOrder": "v1"
      },
      "versionId": "1"
    };

    await fs.writeFile(
      '/home/allan/n8n/workflows/templates/mode-switcher.json',
      JSON.stringify(modeSwitcher, null, 2)
    );
  }

  // Create the main killswitch workflow
  async createKillswitchWorkflow() {
    const killswitchWorkflow = {
      "name": "Robbie V3 Killswitch - Main Control",
      "nodes": [
        {
          "id": "killswitch-dashboard",
          "name": "Killswitch Dashboard",
          "type": "n8n-nodes-base.webhook",
          "typeVersion": 1,
          "position": [100, 300],
          "parameters": {
            "path": "killswitch-dashboard",
            "httpMethod": "GET"
          }
        },
        {
          "id": "bridge-status",
          "name": "Bridge Status",
          "type": "n8n-nodes-base.function",
          "typeVersion": 1,
          "position": [300, 300],
          "parameters": {
            "functionCode": `
              return {
                bridges: {
                  smtp: {
                    status: 'disconnected',
                    mode: 'SAFE',
                    lastActivity: new Date().toISOString()
                  },
                  sms: {
                    status: 'disconnected',
                    mode: 'SAFE',
                    lastActivity: new Date().toISOString()
                  },
                  api: {
                    status: 'disconnected',
                    mode: 'SAFE',
                    lastActivity: new Date().toISOString()
                  }
                },
                currentMode: 'SAFE',
                queuedCommunications: 0,
                timestamp: new Date().toISOString()
              };
            `
          }
        },
        {
          "id": "dashboard-response",
          "name": "Dashboard Response",
          "type": "n8n-nodes-base.respondToWebhook",
          "typeVersion": 1,
          "position": [500, 300],
          "parameters": {
            "respondWith": "json",
            "responseBody": "{{ $json }}"
          }
        }
      ],
      "connections": {
        "killswitch-dashboard": {
          "main": [
            [
              {
                "node": "bridge-status",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "bridge-status": {
          "main": [
            [
              {
                "node": "dashboard-response",
                "type": "main",
                "index": 0
              }
            ]
          ]
        }
      },
      "active": false,
      "settings": {
        "executionOrder": "v1"
      },
      "versionId": "1"
    };

    await fs.writeFile(
      '/home/allan/n8n/workflows/killswitch/main-killswitch.json',
      JSON.stringify(killswitchWorkflow, null, 2)
    );
  }

  // Set up monitoring
  async setupMonitoring() {
    console.log('📊 Setting up killswitch monitoring...');
    
    // Create monitoring script
    const monitoringScript = `#!/bin/bash
# Robbie V3 Killswitch Monitoring Script

echo "🔌 Robbie V3 Killswitch System Status"
echo "======================================"
echo ""

# Check n8n status
if pgrep -f "n8n" > /dev/null; then
    echo "✅ n8n is running"
else
    echo "❌ n8n is not running"
fi

# Check workflow status
echo ""
echo "📋 Workflow Status:"
echo "-------------------"

# Check if workflows exist
if [ -f "/home/allan/n8n/workflows/killswitch/main-killswitch.json" ]; then
    echo "✅ Main Killswitch workflow exists"
else
    echo "❌ Main Killswitch workflow missing"
fi

if [ -f "/home/allan/n8n/workflows/templates/smtp-bridge.json" ]; then
    echo "✅ SMTP Bridge template exists"
else
    echo "❌ SMTP Bridge template missing"
fi

if [ -f "/home/allan/n8n/workflows/templates/sms-bridge.json" ]; then
    echo "✅ SMS Bridge template exists"
else
    echo "❌ SMS Bridge template missing"
fi

if [ -f "/home/allan/n8n/workflows/templates/api-bridge.json" ]; then
    echo "✅ API Bridge template exists"
else
    echo "❌ API Bridge template missing"
fi

if [ -f "/home/allan/n8n/workflows/templates/mode-switcher.json" ]; then
    echo "✅ Mode Switcher template exists"
else
    echo "❌ Mode Switcher template missing"
fi

echo ""
echo "🔌 Bridge Status:"
echo "-----------------"
echo "SMTP Bridge: DISCONNECTED (SAFE MODE)"
echo "SMS Bridge: DISCONNECTED (SAFE MODE)"
echo "API Bridge: DISCONNECTED (SAFE MODE)"
echo ""
echo "Current Mode: SAFE"
echo "Queued Communications: 0"
echo ""
echo "To change mode, use: curl -X POST http://localhost:5678/webhook/mode-switch -d '{\"mode\":\"TEST\"}'"
echo "To view dashboard: curl http://localhost:5678/webhook/killswitch-dashboard"
`;

    await fs.writeFile('/home/allan/n8n/monitor-killswitch.sh', monitoringScript);
    await execAsync('chmod +x /home/allan/n8n/monitor-killswitch.sh');
  }

  // Get current mode
  getCurrentMode() {
    return this.currentMode;
  }

  // Set mode
  async setMode(mode) {
    if (!Object.values(this.modes).includes(mode)) {
      throw new Error('Invalid mode. Must be SAFE, TEST, or LIVE');
    }

    this.currentMode = mode;
    
    // Update bridge status
    Object.keys(this.bridgeStatus).forEach(bridge => {
      this.bridgeStatus[bridge] = mode === this.modes.LIVE ? 'connected' : 'disconnected';
    });

    console.log(`🔌 Killswitch mode changed to: ${mode}`);
    return true;
  }

  // Queue communication
  async queueCommunication(communication) {
    const queuedComm = {
      id: Date.now().toString(),
      ...communication,
      mode: this.currentMode,
      timestamp: new Date().toISOString(),
      status: 'queued'
    };

    this.queuedCommunications.push(queuedComm);
    
    console.log(`📝 Communication queued: ${queuedComm.id}`);
    return queuedComm;
  }

  // Get queued communications
  getQueuedCommunications() {
    return this.queuedCommunications;
  }

  // Clear queue
  async clearQueue() {
    this.queuedCommunications = [];
    console.log('🗑️ Communication queue cleared');
  }

  // Get bridge status
  getBridgeStatus() {
    return {
      bridges: this.bridgeStatus,
      currentMode: this.currentMode,
      queuedCommunications: this.queuedCommunications.length,
      timestamp: new Date().toISOString()
    };
  }

  // Generate n8n workflow instructions
  generateWorkflowInstructions() {
    return `
# 🔌 Robbie V3 Killswitch System - n8n Integration

## Overview
The killswitch system provides visual, drag-and-drop control over all outbound communications through n8n workflows.

## Workflow Structure

### 1. Main Killswitch Workflow
- **File**: `/home/allan/n8n/workflows/killswitch/main-killswitch.json`
- **Purpose**: Central dashboard and control
- **Webhook**: `http://localhost:5678/webhook/killswitch-dashboard`

### 2. Bridge Workflows
Each bridge has three modes that you can drag connections to:

#### SMTP Bridge
- **File**: `/home/allan/n8n/workflows/templates/smtp-bridge.json`
- **Webhook**: `http://localhost:5678/webhook/smtp-bridge`
- **Modes**:
  - 🔒 **SAFE MODE**: All emails go to allan@testpilotcpg.com
  - 🧪 **TEST MODE**: All emails go to allan@testpilotcpg.com (marked as test)
  - 🚀 **LIVE MODE**: Emails go to original recipients

#### SMS Bridge
- **File**: `/home/allan/n8n/workflows/templates/sms-bridge.json`
- **Webhook**: `http://localhost:5678/webhook/sms-bridge`
- **Modes**:
  - 🔒 **SAFE MODE**: All SMS go to +14793664632
  - 🧪 **TEST MODE**: All SMS go to +14793664632 (marked as test)
  - 🚀 **LIVE MODE**: SMS go to original recipients

#### API Bridge
- **File**: `/home/allan/n8n/workflows/templates/api-bridge.json`
- **Webhook**: `http://localhost:5678/webhook/api-bridge`
- **Modes**:
  - 🔒 **SAFE MODE**: All API calls logged to allan@testpilotcpg.com
  - 🧪 **TEST MODE**: All API calls logged to allan@testpilotcpg.com (marked as test)
  - 🚀 **LIVE MODE**: API calls go to original endpoints

### 3. Mode Switcher
- **File**: `/home/allan/n8n/workflows/templates/mode-switcher.json`
- **Webhook**: `http://localhost:5678/webhook/mode-switch`
- **Purpose**: Change mode across all bridges

## How to Use

### 1. Start n8n
```bash
cd /home/allan/n8n
n8n start
```

### 2. Import Workflows
1. Open n8n at `http://localhost:5678`
2. Import each workflow from the templates directory
3. Activate the workflows you want to use

### 3. Control Modes
- **Visual Control**: Drag connections from "OUTBOUND PIPE" to the desired mode
- **API Control**: Send POST to mode-switch webhook
- **Dashboard**: View status at killswitch-dashboard webhook

### 4. Monitor Communications
- All communications are queued and logged
- View queued communications in the dashboard
- Audit trail is maintained for all actions

## Safety Features

1. **Default SAFE Mode**: All bridges start in SAFE mode
2. **Visual Confirmation**: You can see exactly where connections go
3. **Audit Trail**: All communications are logged and queued
4. **Easy Rollback**: Simply drag connections back to SAFE mode
5. **Test Mode**: Test communications without affecting recipients

## Integration with Robbie

The killswitch system integrates with Robbie through:
- Webhook endpoints for each bridge
- Mode switching API
- Communication queuing
- Status monitoring

All outbound communications from Robbie must go through these bridges, ensuring complete control and visibility.
`;
  }
}

export const killswitchSystem = new KillswitchSystem();
