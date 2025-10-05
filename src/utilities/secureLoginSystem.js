// Robbie F Secure Login System - Dropdown users, PIN codes, progressive lockouts
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class SecureLoginSystem {
  constructor() {
    this.users = {
      'allan': {
        name: 'Allan Peretz',
        pin: '2106',
        role: 'ceo',
        permissions: ['full_access', 'admin', 'sales', 'personal'],
        lockoutLevel: 0,
        lastAttempt: null,
        failedAttempts: 0,
        isLocked: false,
        lockoutUntil: null
      },
      'lisa': {
        name: 'Lisa Peretz',
        pin: '5555',
        role: 'spouse',
        permissions: ['personal', 'reach_out', 'allan_focus'],
        lockoutLevel: 0,
        lastAttempt: null,
        failedAttempts: 0,
        isLocked: false,
        lockoutUntil: null
      },
      'tom': {
        name: 'Tom',
        pin: '1234',
        role: 'sales',
        permissions: ['sales', 'reach_out', 'limited_access'],
        lockoutLevel: 0,
        lastAttempt: null,
        failedAttempts: 0,
        isLocked: false,
        lockoutUntil: null
      },
      'kristina': {
        name: 'Kristina',
        pin: '5678',
        role: 'sales',
        permissions: ['sales', 'reach_out', 'limited_access'],
        lockoutLevel: 0,
        lastAttempt: null,
        failedAttempts: 0,
        isLocked: false,
        lockoutUntil: null
      }
    };
    
    this.lockoutLevels = {
      1: { duration: 5 * 60 * 1000, description: '5 minutes' },      // 5 minutes
      2: { duration: 10 * 60 * 1000, description: '10 minutes' },    // 10 minutes
      3: { duration: 30 * 60 * 1000, description: '30 minutes' },    // 30 minutes
      4: { duration: null, description: 'Full lockout' }              // Full lockout
    };
    
    this.loginAttempts = [];
    this.currentUser = null;
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
    this.lastActivity = null;
  }

  // Initialize secure login system
  async initialize() {
    console.log('🔐 Robbie F: Initializing secure login system...');
    
    try {
      // Load existing data
      await this.loadExistingData();
      
      // Start monitoring
      await this.startMonitoring();
      
      console.log('✅ Robbie F: Secure login system ready!');
      return true;
    } catch (error) {
      console.error('❌ Robbie F: Secure login system initialization failed:', error);
      return false;
    }
  }

  // Load existing data
  async loadExistingData() {
    try {
      const data = await fs.readFile('/home/allan/vengeance/data/login_data.json', 'utf8');
      const parsed = JSON.parse(data);
      
      // Update users with saved data
      Object.keys(parsed.users || {}).forEach(username => {
        if (this.users[username]) {
          this.users[username] = { ...this.users[username], ...parsed.users[username] };
        }
      });
      
      // Load login attempts
      this.loginAttempts = parsed.loginAttempts || [];
      
      console.log(`📊 Robbie F: Loaded login data for ${Object.keys(this.users).length} users`);
    } catch (error) {
      console.log('⚠️  No existing login data found, starting fresh');
    }
  }

  // Start monitoring
  async startMonitoring() {
    // Check for expired lockouts every minute
    setInterval(async () => {
      await this.checkExpiredLockouts();
    }, 60000);
    
    // Check session timeout every 5 minutes
    setInterval(async () => {
      await this.checkSessionTimeout();
    }, 300000);
    
    console.log('🔄 Robbie F: Started monitoring login system');
  }

  // Check for expired lockouts
  async checkExpiredLockouts() {
    const now = new Date();
    
    Object.keys(this.users).forEach(username => {
      const user = this.users[username];
      if (user.isLocked && user.lockoutUntil && new Date(user.lockoutUntil) <= now) {
        user.isLocked = false;
        user.lockoutUntil = null;
        user.failedAttempts = 0;
        user.lockoutLevel = 0;
        
        console.log(`🔓 Robbie F: Lockout expired for ${user.name}`);
      }
    });
  }

  // Check session timeout
  async checkSessionTimeout() {
    if (this.currentUser && this.lastActivity) {
      const now = new Date();
      const timeSinceActivity = now.getTime() - this.lastActivity.getTime();
      
      if (timeSinceActivity > this.sessionTimeout) {
        await this.logout();
        console.log(`⏰ Robbie F: Session timed out for ${this.currentUser.name}`);
      }
    }
  }

  // Generate login interface
  generateLoginInterface() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Robbie F - Secure Login</title>
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
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .login-container {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            padding: 40px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            width: 400px;
            text-align: center;
        }

        .login-header {
            margin-bottom: 30px;
        }

        .login-header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #4CAF50, #2196F3);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .login-header p {
            font-size: 1.1em;
            opacity: 0.8;
        }

        .login-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
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

        .form-group select,
        .form-group input {
            width: 100%;
            padding: 15px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            color: #cccccc;
            font-size: 1.1em;
            transition: all 0.3s ease;
        }

        .form-group select:focus,
        .form-group input:focus {
            outline: none;
            border-color: #4CAF50;
            box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
        }

        .form-group select option {
            background: #2d2d30;
            color: #cccccc;
        }

        .login-button {
            padding: 15px 30px;
            background: linear-gradient(45deg, #4CAF50, #2196F3);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 1.2em;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 10px;
        }

        .login-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(76, 175, 80, 0.3);
        }

        .login-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

        .error-message {
            background: rgba(244, 67, 54, 0.1);
            border: 1px solid #F44336;
            border-radius: 8px;
            padding: 15px;
            color: #F44336;
            margin-top: 20px;
            display: none;
        }

        .success-message {
            background: rgba(76, 175, 80, 0.1);
            border: 1px solid #4CAF50;
            border-radius: 8px;
            padding: 15px;
            color: #4CAF50;
            margin-top: 20px;
            display: none;
        }

        .lockout-message {
            background: rgba(255, 152, 0, 0.1);
            border: 1px solid #FF9800;
            border-radius: 8px;
            padding: 15px;
            color: #FF9800;
            margin-top: 20px;
            display: none;
        }

        .pin-display {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 20px;
            margin-top: 20px;
            display: none;
        }

        .pin-display h3 {
            margin-bottom: 15px;
            color: #4CAF50;
        }

        .pin-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
        }

        .pin-button {
            padding: 15px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: #cccccc;
            cursor: pointer;
            font-size: 1.2em;
            font-weight: bold;
            transition: all 0.3s ease;
        }

        .pin-button:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: scale(1.05);
        }

        .pin-button:active {
            transform: scale(0.95);
        }

        .pin-display .clear-btn {
            grid-column: 1 / -1;
            background: #F44336;
            color: white;
            margin-top: 10px;
        }

        .pin-display .clear-btn:hover {
            background: #D32F2F;
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
    <div class="login-container fade-in">
        <div class="login-header">
            <h1>🤖 Robbie F</h1>
            <p>Secure Login System</p>
        </div>

        <form class="login-form" id="login-form">
            <div class="form-group">
                <label for="username">Select User</label>
                <select id="username" name="username" required>
                    <option value="">Choose a user...</option>
                    <option value="allan">Allan Peretz (CEO)</option>
                    <option value="lisa">Lisa Peretz (Spouse)</option>
                    <option value="tom">Tom (Sales)</option>
                    <option value="kristina">Kristina (Sales)</option>
                </select>
            </div>

            <div class="form-group">
                <label for="pin">PIN Code</label>
                <input type="password" id="pin" name="pin" placeholder="Enter PIN" maxlength="10" required>
            </div>

            <button type="submit" class="login-button" id="login-button">Login</button>
        </form>

        <div class="error-message" id="error-message"></div>
        <div class="success-message" id="success-message"></div>
        <div class="lockout-message" id="lockout-message"></div>

        <div class="pin-display" id="pin-display">
            <h3>PIN Code Surface</h3>
            <div class="pin-grid">
                <button class="pin-button" onclick="addPinDigit('1')">1</button>
                <button class="pin-button" onclick="addPinDigit('2')">2</button>
                <button class="pin-button" onclick="addPinDigit('3')">3</button>
                <button class="pin-button" onclick="addPinDigit('4')">4</button>
                <button class="pin-button" onclick="addPinDigit('5')">5</button>
                <button class="pin-button" onclick="addPinDigit('6')">6</button>
                <button class="pin-button" onclick="addPinDigit('7')">7</button>
                <button class="pin-button" onclick="addPinDigit('8')">8</button>
                <button class="pin-button" onclick="addPinDigit('9')">9</button>
                <button class="pin-button" onclick="addPinDigit('0')">0</button>
                <button class="pin-button clear-btn" onclick="clearPin()">Clear</button>
            </div>
        </div>
    </div>

    <script>
        let currentPin = '';
        let selectedUser = '';

        // Show/hide PIN display based on user selection
        document.getElementById('username').addEventListener('change', function() {
            selectedUser = this.value;
            const pinDisplay = document.getElementById('pin-display');
            if (selectedUser) {
                pinDisplay.style.display = 'block';
            } else {
                pinDisplay.style.display = 'none';
            }
        });

        // Add PIN digit
        function addPinDigit(digit) {
            currentPin += digit;
            document.getElementById('pin').value = currentPin;
        }

        // Clear PIN
        function clearPin() {
            currentPin = '';
            document.getElementById('pin').value = '';
        }

        // Handle form submission
        document.getElementById('login-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const pin = document.getElementById('pin').value;
            
            if (!username || !pin) {
                showError('Please select a user and enter a PIN');
                return;
            }
            
            // Attempt login
            const result = await attemptLogin(username, pin);
            
            if (result.success) {
                showSuccess('Login successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
            } else {
                showError(result.message);
                if (result.lockout) {
                    showLockout(result.lockoutMessage);
                }
            }
        });

        // Attempt login
        async function attemptLogin(username, pin) {
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, pin })
                });
                
                const result = await response.json();
                return result;
            } catch (error) {
                return { success: false, message: 'Login failed. Please try again.' };
            }
        }

        // Show error message
        function showError(message) {
            hideAllMessages();
            document.getElementById('error-message').textContent = message;
            document.getElementById('error-message').style.display = 'block';
        }

        // Show success message
        function showSuccess(message) {
            hideAllMessages();
            document.getElementById('success-message').textContent = message;
            document.getElementById('success-message').style.display = 'block';
        }

        // Show lockout message
        function showLockout(message) {
            hideAllMessages();
            document.getElementById('lockout-message').textContent = message;
            document.getElementById('lockout-message').style.display = 'block';
        }

        // Hide all messages
        function hideAllMessages() {
            document.getElementById('error-message').style.display = 'none';
            document.getElementById('success-message').style.display = 'none';
            document.getElementById('lockout-message').style.display = 'none';
        }
    </script>
</body>
</html>`;
  }

  // Attempt login
  async attemptLogin(username, pin) {
    const user = this.users[username];
    
    if (!user) {
      await this.logFailedAttempt(username, 'User not found');
      return { success: false, message: 'Invalid user' };
    }
    
    // Check if user is locked out
    if (user.isLocked) {
      const lockoutTime = new Date(user.lockoutUntil);
      const now = new Date();
      const remainingTime = Math.ceil((lockoutTime.getTime() - now.getTime()) / 1000 / 60);
      
      await this.logFailedAttempt(username, 'Attempted login while locked out');
      return { 
        success: false, 
        message: 'Account is locked out',
        lockout: true,
        lockoutMessage: `Account locked for ${remainingTime} more minutes`
      };
    }
    
    // Check PIN
    if (user.pin !== pin) {
      user.failedAttempts++;
      user.lastAttempt = new Date();
      
      // Apply lockout based on failed attempts
      if (user.failedAttempts >= 3) {
        user.lockoutLevel++;
        const lockoutLevel = this.lockoutLevels[user.lockoutLevel];
        
        if (lockoutLevel.duration) {
          user.isLocked = true;
          user.lockoutUntil = new Date(Date.now() + lockoutLevel.duration);
          user.failedAttempts = 0; // Reset for next lockout level
        } else {
          user.isLocked = true;
          user.lockoutUntil = null; // Permanent lockout
        }
        
        await this.logFailedAttempt(username, `Failed login - Lockout level ${user.lockoutLevel} (${lockoutLevel.description})`);
        return { 
          success: false, 
          message: `Too many failed attempts. ${lockoutLevel.description} lockout applied.`,
          lockout: true,
          lockoutMessage: `Account locked for ${lockoutLevel.description}`
        };
      }
      
      await this.logFailedAttempt(username, `Failed login - Attempt ${user.failedAttempts}`);
      return { success: false, message: `Invalid PIN. ${3 - user.failedAttempts} attempts remaining.` };
    }
    
    // Successful login
    user.failedAttempts = 0;
    user.lockoutLevel = 0;
    user.isLocked = false;
    user.lockoutUntil = null;
    this.currentUser = user;
    this.lastActivity = new Date();
    
    await this.logSuccessfulAttempt(username);
    await this.saveData();
    
    return { success: true, message: 'Login successful', user: user };
  }

  // Log failed attempt
  async logFailedAttempt(username, reason) {
    const attempt = {
      id: Date.now().toString(),
      username: username,
      success: false,
      reason: reason,
      timestamp: new Date().toISOString(),
      ip: 'unknown', // Would get real IP in production
      userAgent: 'unknown' // Would get real user agent in production
    };
    
    this.loginAttempts.push(attempt);
    
    // Keep only last 1000 attempts
    if (this.loginAttempts.length > 1000) {
      this.loginAttempts = this.loginAttempts.slice(-1000);
    }
    
    // Save data
    await this.saveData();
    
    // Report to Allan if it's a security concern
    if (username === 'allan' || this.loginAttempts.filter(a => a.username === username).length > 5) {
      await this.reportSecurityConcern(attempt);
    }
    
    console.log(`🚨 Robbie F: Failed login attempt - ${username}: ${reason}`);
  }

  // Log successful attempt
  async logSuccessfulAttempt(username) {
    const attempt = {
      id: Date.now().toString(),
      username: username,
      success: true,
      reason: 'Successful login',
      timestamp: new Date().toISOString(),
      ip: 'unknown',
      userAgent: 'unknown'
    };
    
    this.loginAttempts.push(attempt);
    await this.saveData();
    
    console.log(`✅ Robbie F: Successful login - ${username}`);
  }

  // Report security concern
  async reportSecurityConcern(attempt) {
    // This would send an alert to Allan
    console.log(`🚨 Robbie F: Security concern reported - ${attempt.username}: ${attempt.reason}`);
    
    // Could integrate with email, Slack, or other notification systems
  }

  // Save data
  async saveData() {
    try {
      const data = {
        users: this.users,
        loginAttempts: this.loginAttempts,
        lastUpdated: new Date().toISOString()
      };
      
      await fs.writeFile('/home/allan/vengeance/data/login_data.json', JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Robbie F: Error saving login data:', error);
    }
  }

  // Logout
  async logout() {
    if (this.currentUser) {
      console.log(`👋 Robbie F: User logged out - ${this.currentUser.name}`);
      this.currentUser = null;
      this.lastActivity = null;
    }
  }

  // Get user dashboard based on role
  getUserDashboard(username) {
    const user = this.users[username];
    if (!user) return null;
    
    switch (user.role) {
      case 'ceo':
        return this.getCEODashboard();
      case 'spouse':
        return this.getSpouseDashboard();
      case 'sales':
        return this.getSalesDashboard();
      default:
        return this.getDefaultDashboard();
    }
  }

  // Get CEO dashboard
  getCEODashboard() {
    return {
      title: 'Allan Peretz - CEO Dashboard',
      tabs: ['inbox', 'notes', 'browser', 'cursor', 'killswitch', 'pins'],
      permissions: ['full_access', 'admin', 'sales', 'personal'],
      features: ['all_systems', 'admin_panel', 'sales_data', 'personal_notes']
    };
  }

  // Get spouse dashboard
  getSpouseDashboard() {
    return {
      title: 'Lisa Peretz - Spouse Dashboard',
      tabs: ['inbox', 'notes', 'allan_focus', 'reach_out'],
      permissions: ['personal', 'reach_out', 'allan_focus'],
      features: ['allan_status', 'reach_out_to_allan', 'personal_notes', 'family_updates']
    };
  }

  // Get sales dashboard
  getSalesDashboard() {
    return {
      title: 'Sales Dashboard',
      tabs: ['inbox', 'sales_data', 'leads', 'reach_out'],
      permissions: ['sales', 'reach_out', 'limited_access'],
      features: ['sales_pipeline', 'lead_management', 'reach_out_to_allan', 'sales_notes']
    };
  }

  // Get default dashboard
  getDefaultDashboard() {
    return {
      title: 'User Dashboard',
      tabs: ['inbox', 'notes'],
      permissions: ['limited_access'],
      features: ['basic_access']
    };
  }

  // Get status
  getStatus() {
    return {
      totalUsers: Object.keys(this.users).length,
      activeUsers: Object.values(this.users).filter(u => !u.isLocked).length,
      lockedUsers: Object.values(this.users).filter(u => u.isLocked).length,
      totalAttempts: this.loginAttempts.length,
      failedAttempts: this.loginAttempts.filter(a => !a.success).length,
      currentUser: this.currentUser?.name || null,
      lastActivity: this.lastActivity
    };
  }
}

export const secureLoginSystem = new SecureLoginSystem();
