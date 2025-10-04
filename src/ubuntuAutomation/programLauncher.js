// Ubuntu Program Launcher for Robbie OS Integration
// Safely launches programs with Firejail sandboxing

import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class ProgramLauncher {
  constructor() {
    this.launchMethods = {
      firefox: {
        command: 'firefox',
        sandbox: true,
        profile: '--new-instance',
        riskLevel: 'low'
      },
      chrome: {
        command: 'google-chrome',
        sandbox: true,
        profile: '--new-window',
        riskLevel: 'low'
      },
      code: {
        command: 'code',
        sandbox: false, // Code needs file system access
        profile: '--new-window',
        riskLevel: 'medium'
      },
      terminal: {
        command: 'gnome-terminal',
        sandbox: false,
        profile: '--new-window',
        riskLevel: 'medium'
      },
      files: {
        command: 'nautilus',
        sandbox: true,
        profile: '--new-window',
        riskLevel: 'low'
      }
    };
  }

  // Launch program with appropriate safety measures
  async launch(programName, options = {}) {
    const config = this.launchMethods[programName.toLowerCase()];
    
    if (!config) {
      throw new Error(`Unknown program: ${programName}`);
    }
    
    console.log(`🚀 Launching ${programName} with safety controls...`);
    
    try {
      // Check if program exists
      await this.verifyProgramExists(config.command);
      
      // Build launch command
      const launchCommand = this.buildLaunchCommand(config, options);
      
      // Execute with monitoring
      const process = await this.launchWithMonitoring(launchCommand, programName);
      
      return {
        success: true,
        processId: process.pid,
        program: programName,
        sandboxed: config.sandbox,
        riskLevel: config.riskLevel,
        message: `Successfully launched ${programName}`
      };
      
    } catch (error) {
      console.error(`❌ Failed to launch ${programName}: ${error.message}`);
      throw error;
    }
  }

  // Verify program exists on system
  async verifyProgramExists(command) {
    try {
      await execAsync(`which ${command}`);
      return true;
    } catch (error) {
      throw new Error(`Program ${command} not found on system`);
    }
  }

  // Build launch command with sandboxing if needed
  buildLaunchCommand(config, options) {
    let command = config.command;
    
    // Add profile options
    if (config.profile && !options.noProfile) {
      command += ` ${config.profile}`;
    }
    
    // Add user-specified arguments
    if (options.args) {
      command += ` ${options.args}`;
    }
    
    // Wrap with Firejail sandbox if enabled
    if (config.sandbox && !options.noSandbox) {
      command = `firejail --quiet --net=eth0 --dns=8.8.8.8 ${command}`;
    }
    
    return command;
  }

  // Launch with process monitoring
  async launchWithMonitoring(command, programName) {
    return new Promise((resolve, reject) => {
      console.log(`📋 Executing: ${command}`);
      
      const process = spawn('bash', ['-c', command], {
        detached: true,
        stdio: 'ignore'
      });
      
      process.on('error', (error) => {
        reject(new Error(`Launch failed: ${error.message}`));
      });
      
      process.on('spawn', () => {
        // Track process for potential termination
        this.activeProcesses.set(process.pid, {
          process: process,
          program: programName,
          launchTime: new Date(),
          command: command
        });
        
        console.log(`✅ ${programName} launched with PID ${process.pid}`);
        resolve(process);
      });
      
      // Detach process so it continues running
      process.unref();
    });
  }

  // Kill specific program (for AIRGAP or user request)
  async killProgram(programName) {
    console.log(`⏹️ Killing all instances of ${programName}...`);
    
    try {
      // Use pkill to terminate all instances
      await execAsync(`pkill -f ${programName}`);
      
      // Remove from active processes tracking
      for (const [pid, info] of this.activeProcesses) {
        if (info.program === programName) {
          this.activeProcesses.delete(pid);
        }
      }
      
      return {
        success: true,
        message: `All instances of ${programName} terminated`
      };
      
    } catch (error) {
      console.error(`❌ Failed to kill ${programName}: ${error.message}`);
      throw error;
    }
  }

  // List running programs launched by Robbie
  getActivePrograms() {
    const active = [];
    
    for (const [pid, info] of this.activeProcesses) {
      active.push({
        pid: pid,
        program: info.program,
        runtime: Date.now() - info.launchTime.getTime(),
        command: info.command
      });
    }
    
    return active;
  }

  // Emergency kill all (AIRGAP feature)
  async killAllPrograms() {
    console.log('🚨 EMERGENCY KILL ALL PROGRAMS');
    
    const killed = [];
    
    for (const [pid, info] of this.activeProcesses) {
      try {
        info.process.kill('SIGTERM');
        killed.push(info.program);
      } catch (error) {
        console.error(`Failed to kill ${info.program} (${pid}): ${error.message}`);
      }
    }
    
    this.activeProcesses.clear();
    
    return {
      success: true,
      killedPrograms: killed,
      message: `Emergency stop: ${killed.length} programs terminated`
    };
  }
}

export default ProgramLauncher;
