// Robbie Ubuntu OS Integration System
// Extends Aurora's Robbie AI with OS-level automation capabilities
// Maintains GATEKEEPER safety controls with step-once/step-many/trash workflow

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import playwright from 'playwright';
import fs from 'fs/promises';

const execAsync = promisify(exec);

class RobbieOSIntegration {
  constructor(gatekeeper, actionQueue) {
    this.gatekeeper = gatekeeper; // Your existing GATEKEEPER system
    this.actionQueue = actionQueue; // Your step-once/step-many approval queue
    
    this.capabilities = {
      programs: new ProgramLauncher(),
      browser: new BrowserController(), 
      credentials: new CredentialManager(),
      system: new SystemController(),
      safety: new SafetyMonitor()
    };
    
    this.activeProcesses = new Map();
    this.activeBrowsers = new Map();
    this.airGapActive = false;
  }

  // Main entry point for OS automation requests
  async processOSCommand(naturalLanguage, userId = 'allan') {
    console.log(`🤖 Robbie OS: Processing "${naturalLanguage}"`);
    
    // Step 1: Parse natural language into actions
    const actions = await this.parseToActions(naturalLanguage);
    
    // Step 2: GATEKEEPER safety analysis (your existing system)
    const safetyAnalysis = await this.gatekeeper.analyzeActions(actions);
    
    // Step 3: Queue actions based on risk level
    const queueResult = await this.queueActions(actions, safetyAnalysis);
    
    return {
      source: 'robbie_os',
      response: queueResult.userMessage,
      actions_queued: queueResult.actionsQueued,
      requires_approval: queueResult.requiresApproval,
      safety_status: safetyAnalysis.status
    };
  }

  // Parse natural language into executable actions
  async parseToActions(command) {
    const actions = [];
    
    // Common patterns
    if (command.includes('launch') || command.includes('open')) {
      const program = this.extractProgramName(command);
      actions.push({
        type: 'launch_program',
        program: program,
        risk_level: 'low',
        description: `Launch ${program}`
      });
    }
    
    if (command.includes('browse') || command.includes('go to')) {
      const url = this.extractURL(command);
      actions.push({
        type: 'browse_web',
        url: url,
        risk_level: 'medium',
        description: `Navigate to ${url}`
      });
    }
    
    if (command.includes('login') || command.includes('credentials')) {
      const site = this.extractSite(command);
      actions.push({
        type: 'use_credentials',
        site: site,
        risk_level: 'high',
        description: `Use stored credentials for ${site}`
      });
    }
    
    if (command.includes('download') || command.includes('save')) {
      const target = this.extractDownloadTarget(command);
      actions.push({
        type: 'download_file',
        target: target,
        risk_level: 'medium',
        description: `Download ${target}`
      });
    }
    
    return actions;
  }

  // Queue actions with your step-once/step-many logic
  async queueActions(actions, safetyAnalysis) {
    const lowRiskActions = actions.filter(a => a.risk_level === 'low');
    const mediumRiskActions = actions.filter(a => a.risk_level === 'medium');
    const highRiskActions = actions.filter(a => a.risk_level === 'high');
    
    // Auto-approve low risk (step-once for harmless actions)
    for (const action of lowRiskActions) {
      await this.actionQueue.autoApprove(action);
    }
    
    // Queue medium/high risk for approval (step-many for important actions)
    const requiresApproval = [...mediumRiskActions, ...highRiskActions];
    
    for (const action of requiresApproval) {
      await this.actionQueue.queueForApproval(action, {
        preview: await this.generateActionPreview(action),
        canTrash: true,
        canAirGap: true
      });
    }
    
    return {
      userMessage: this.buildUserMessage(lowRiskActions, requiresApproval),
      actionsQueued: lowRiskActions.length + requiresApproval.length,
      requiresApproval: requiresApproval.length > 0
    };
  }

  // Generate preview of what action will do (for user approval)
  async generateActionPreview(action) {
    switch (action.type) {
      case 'launch_program':
        return `Will launch ${action.program} in a sandboxed environment`;
      
      case 'browse_web':
        return `Will open browser and navigate to ${action.url}`;
      
      case 'use_credentials':
        return `Will use stored credentials to login to ${action.site}`;
      
      case 'download_file':
        return `Will download ${action.target} to ~/Downloads/`;
      
      default:
        return `Will execute: ${action.description}`;
    }
  }

  // Execute approved actions (called by your existing approval system)
  async executeAction(action) {
    if (this.airGapActive) {
      throw new Error('AIRGAP active - no OS actions allowed');
    }
    
    console.log(`🔧 Robbie OS: Executing ${action.type}`);
    
    try {
      switch (action.type) {
        case 'launch_program':
          return await this.capabilities.programs.launch(action.program);
        
        case 'browse_web':
          return await this.capabilities.browser.navigate(action.url);
        
        case 'use_credentials':
          return await this.capabilities.credentials.useCredentials(action.site);
        
        case 'download_file':
          return await this.capabilities.browser.download(action.target);
        
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      console.error(`❌ Action failed: ${error.message}`);
      throw error;
    }
  }

  // AIRGAP emergency stop (your existing safety feature)
  async activateAirGap() {
    console.log('🚨 AIRGAP ACTIVATED - Stopping all OS automation');
    this.airGapActive = true;
    
    // Kill all spawned processes
    for (const [pid, process] of this.activeProcesses) {
      try {
        process.kill('SIGTERM');
        console.log(`⏹️ Killed process ${pid}`);
      } catch (error) {
        console.error(`Failed to kill process ${pid}: ${error.message}`);
      }
    }
    
    // Close all browser contexts
    for (const [id, browser] of this.activeBrowsers) {
      try {
        await browser.close();
        console.log(`⏹️ Closed browser ${id}`);
      } catch (error) {
        console.error(`Failed to close browser ${id}: ${error.message}`);
      }
    }
    
    this.activeProcesses.clear();
    this.activeBrowsers.clear();
  }

  // Deactivate AIRGAP when safe
  deactivateAirGap() {
    console.log('✅ AIRGAP deactivated - OS automation available');
    this.airGapActive = false;
  }

  // Helper methods for parsing
  extractProgramName(command) {
    const programs = ['firefox', 'chrome', 'code', 'terminal', 'files', 'calculator'];
    for (const program of programs) {
      if (command.toLowerCase().includes(program)) {
        return program;
      }
    }
    return 'unknown';
  }

  extractURL(command) {
    const urlPattern = /(https?:\/\/[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/;
    const match = command.match(urlPattern);
    return match ? match[0] : null;
  }

  extractSite(command) {
    const sites = ['testpilot', 'github', 'gmail', 'slack', 'hubspot'];
    for (const site of sites) {
      if (command.toLowerCase().includes(site)) {
        return site;
      }
    }
    return 'unknown';
  }

  extractDownloadTarget(command) {
    const filePattern = /([a-zA-Z0-9-_]+\.[a-zA-Z]{2,4}|report|document|file)/;
    const match = command.match(filePattern);
    return match ? match[0] : 'file';
  }

  buildUserMessage(autoApproved, needsApproval) {
    let message = '';
    
    if (autoApproved.length > 0) {
      message += `✅ Auto-executed ${autoApproved.length} safe actions. `;
    }
    
    if (needsApproval.length > 0) {
      message += `⏸️ ${needsApproval.length} actions need approval - check your action queue.`;
    }
    
    if (autoApproved.length === 0 && needsApproval.length === 0) {
      message = "I understood your request but couldn't identify specific actions to take.";
    }
    
    return message;
  }
}

export default RobbieOSIntegration;
