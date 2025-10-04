// Robbie F PIN Code Surfacer - Extract and manage PINs, 2FA codes, and passwords
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class PinCodeSurfacer {
  constructor() {
    this.extractedCodes = new Map();
    this.stickyNotes = [];
    this.isUnlocked = false;
    this.currentPin = null;
    this.patterns = {
      // PIN patterns
      pin: [
        /\b\d{4}\b/g,  // 4-digit PIN
        /\b\d{6}\b/g,  // 6-digit PIN
        /\b\d{8}\b/g,  // 8-digit PIN
        /\bPIN[:\s]*(\d{4,8})\b/gi,
        /\bCode[:\s]*(\d{4,8})\b/gi,
        /\bPasscode[:\s]*(\d{4,8})\b/gi
      ],
      // 2FA patterns
      twoFA: [
        /\b\d{6}\b/g,  // 6-digit 2FA
        /\b\d{8}\b/g,  // 8-digit 2FA
        /\b2FA[:\s]*(\d{6,8})\b/gi,
        /\bTwo[-\s]?Factor[:\s]*(\d{6,8})\b/gi,
        /\bVerification[:\s]*(\d{6,8})\b/gi,
        /\bAuth[:\s]*(\d{6,8})\b/gi,
        /\bOTP[:\s]*(\d{6,8})\b/gi
      ],
      // Password patterns
      password: [
        /\bPassword[:\s]*([a-zA-Z0-9!@#$%^&*()_+-={}[\]|\\:";'<>?,./]{8,})\b/gi,
        /\bPass[:\s]*([a-zA-Z0-9!@#$%^&*()_+-={}[\]|\\:";'<>?,./]{8,})\b/gi,
        /\bPwd[:\s]*([a-zA-Z0-9!@#$%^&*()_+-={}[\]|\\:";'<>?,./]{8,})\b/gi
      ],
      // Service patterns
      service: [
        /\b(?:Gmail|Google|Microsoft|Apple|Facebook|Twitter|LinkedIn|GitHub|Slack|Discord|Zoom|Teams)\b/gi,
        /\b(?:Bank|Chase|Wells Fargo|Bank of America|Capital One|American Express|Visa|Mastercard)\b/gi,
        /\b(?:Amazon|Netflix|Spotify|YouTube|Instagram|TikTok|Snapchat)\b/gi
      ]
    };
    this.sources = {
      email: [],
      sms: [],
      slack: []
    };
  }

  // Initialize PIN code surfacer
  async initialize() {
    console.log('🔐 Robbie F: Initializing PIN code surfacer...');
    
    try {
      // Load existing codes
      await this.loadExistingCodes();
      
      // Start monitoring
      await this.startMonitoring();
      
      console.log('✅ Robbie F: PIN code surfacer ready!');
      return true;
    } catch (error) {
      console.error('❌ Robbie F: PIN code surfacer initialization failed:', error);
      return false;
    }
  }

  // Load existing codes
  async loadExistingCodes() {
    try {
      const codesData = await fs.readFile('/home/allan/vengeance/data/extracted_codes.json', 'utf8');
      const codes = JSON.parse(codesData);
      
      codes.forEach(code => {
        this.extractedCodes.set(code.id, code);
      });
      
      console.log(`📊 Robbie F: Loaded ${this.extractedCodes.size} extracted codes`);
    } catch (error) {
      console.log('⚠️  No existing codes found, starting fresh');
    }
  }

  // Start monitoring
  async startMonitoring() {
    // Monitor for new codes every 30 seconds
    setInterval(async () => {
      await this.scanForNewCodes();
    }, 30000);
    
    console.log('🔄 Robbie F: Started monitoring for new codes');
  }

  // Scan for new codes
  async scanForNewCodes() {
    try {
      // Scan emails
      await this.scanEmails();
      
      // Scan SMS
      await this.scanSMS();
      
      // Scan Slack
      await this.scanSlack();
      
      // Update sticky notes
      await this.updateStickyNotes();
      
    } catch (error) {
      console.error('❌ Robbie F: Error scanning for codes:', error);
    }
  }

  // Scan emails for codes
  async scanEmails() {
    try {
      // This would integrate with your email system
      // For now, we'll simulate some examples
      const sampleEmails = [
        {
          id: 'email_1',
          subject: 'Your verification code',
          body: 'Your verification code is 123456. Please enter this code to complete your login.',
          timestamp: new Date().toISOString(),
          source: 'email'
        },
        {
          id: 'email_2',
          subject: 'Security Alert - New Login',
          body: 'We detected a new login to your account. Your PIN is 2106. If this was not you, please contact support.',
          timestamp: new Date().toISOString(),
          source: 'email'
        }
      ];
      
      for (const email of sampleEmails) {
        await this.extractCodesFromText(email.body, email, 'email');
      }
    } catch (error) {
      console.error('❌ Robbie F: Error scanning emails:', error);
    }
  }

  // Scan SMS for codes
  async scanSMS() {
    try {
      // This would integrate with your SMS system
      // For now, we'll simulate some examples
      const sampleSMS = [
        {
          id: 'sms_1',
          body: 'Your 2FA code is 789012. Valid for 5 minutes.',
          timestamp: new Date().toISOString(),
          source: 'sms'
        },
        {
          id: 'sms_2',
          body: 'Gmail: Your verification code is 345678. Do not share this code.',
          timestamp: new Date().toISOString(),
          source: 'sms'
        }
      ];
      
      for (const sms of sampleSMS) {
        await this.extractCodesFromText(sms.body, sms, 'sms');
      }
    } catch (error) {
      console.error('❌ Robbie F: Error scanning SMS:', error);
    }
  }

  // Scan Slack for codes
  async scanSlack() {
    try {
      // This would integrate with your Slack system
      // For now, we'll simulate some examples
      const sampleSlack = [
        {
          id: 'slack_1',
          body: 'Hey team, the new system PIN is 5555. Keep this secure!',
          timestamp: new Date().toISOString(),
          source: 'slack'
        },
        {
          id: 'slack_2',
          body: 'Allan, your 2FA code for the meeting is 987654.',
          timestamp: new Date().toISOString(),
          source: 'slack'
        }
      ];
      
      for (const slack of sampleSlack) {
        await this.extractCodesFromText(slack.body, slack, 'slack');
      }
    } catch (error) {
      console.error('❌ Robbie F: Error scanning Slack:', error);
    }
  }

  // Extract codes from text
  async extractCodesFromText(text, context, source) {
    const extracted = [];
    
    // Extract PINs
    for (const pattern of this.patterns.pin) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const code = match.replace(/\D/g, ''); // Remove non-digits
          if (code.length >= 4 && code.length <= 8) {
            extracted.push({
              type: 'PIN',
              code: code,
              pattern: pattern.toString(),
              context: context,
              source: source
            });
          }
        });
      }
    }
    
    // Extract 2FA codes
    for (const pattern of this.patterns.twoFA) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const code = match.replace(/\D/g, ''); // Remove non-digits
          if (code.length >= 6 && code.length <= 8) {
            extracted.push({
              type: '2FA',
              code: code,
              pattern: pattern.toString(),
              context: context,
              source: source
            });
          }
        });
      }
    }
    
    // Extract passwords
    for (const pattern of this.patterns.password) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const password = match.replace(/^(?:Password|Pass|Pwd)[:\s]*/gi, '');
          if (password.length >= 8) {
            extracted.push({
              type: 'Password',
              code: password,
              pattern: pattern.toString(),
              context: context,
              source: source
            });
          }
        });
      }
    }
    
    // Extract service names
    for (const pattern of this.patterns.service) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          extracted.push({
            type: 'Service',
            code: match,
            pattern: pattern.toString(),
            context: context,
            source: source
          });
        });
      }
    }
    
    // Store extracted codes
    for (const code of extracted) {
      const codeId = `${source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const codeData = {
        id: codeId,
        type: code.type,
        code: code.code,
        source: source,
        context: context,
        extractedAt: new Date().toISOString(),
        isActive: true,
        expiresAt: this.calculateExpiration(code.type)
      };
      
      this.extractedCodes.set(codeId, codeData);
    }
    
    if (extracted.length > 0) {
      console.log(`🔍 Robbie F: Extracted ${extracted.length} codes from ${source}`);
    }
  }

  // Calculate expiration time
  calculateExpiration(type) {
    const now = new Date();
    
    switch (type) {
      case '2FA':
        return new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
      case 'PIN':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      case 'Password':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
      case 'Service':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
      default:
        return new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
    }
  }

  // Update sticky notes
  async updateStickyNotes() {
    this.stickyNotes = Array.from(this.extractedCodes.values())
      .filter(code => code.isActive && new Date(code.expiresAt) > new Date())
      .sort((a, b) => new Date(b.extractedAt) - new Date(a.extractedAt))
      .slice(0, 20); // Keep only the 20 most recent
    
    // Save to file
    await this.saveCodes();
  }

  // Save codes to file
  async saveCodes() {
    try {
      const codesData = Array.from(this.extractedCodes.values());
      await fs.writeFile('/home/allan/vengeance/data/extracted_codes.json', JSON.stringify(codesData, null, 2));
    } catch (error) {
      console.error('❌ Robbie F: Error saving codes:', error);
    }
  }

  // Generate sticky notes interface
  generateStickyNotesInterface() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Robbie F - PIN Code Sticky Notes</title>
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
            overflow: hidden;
        }

        .pin-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .pin-input {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            border: 2px solid #4CAF50;
        }

        .pin-input h2 {
            margin-bottom: 20px;
            color: #4CAF50;
        }

        .pin-input input {
            width: 200px;
            padding: 15px;
            font-size: 1.5em;
            text-align: center;
            border: none;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.1);
            color: #cccccc;
            margin-bottom: 20px;
        }

        .pin-input button {
            padding: 10px 20px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1.1em;
        }

        .sticky-notes-container {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            max-height: calc(100vh - 40px);
            overflow-y: auto;
            z-index: 999;
        }

        .sticky-note {
            background: linear-gradient(135deg, #ffeb3b 0%, #ffc107 100%);
            color: #333;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            transform: rotate(-2deg);
            transition: all 0.3s ease;
            cursor: pointer;
            position: relative;
        }

        .sticky-note:hover {
            transform: rotate(0deg) scale(1.05);
            z-index: 1001;
        }

        .sticky-note.pin {
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white;
        }

        .sticky-note.twofa {
            background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
            color: white;
        }

        .sticky-note.password {
            background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
            color: white;
        }

        .sticky-note.service {
            background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%);
            color: white;
        }

        .note-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .note-type {
            font-weight: bold;
            font-size: 0.9em;
            text-transform: uppercase;
        }

        .note-time {
            font-size: 0.8em;
            opacity: 0.8;
        }

        .note-code {
            font-size: 1.5em;
            font-weight: bold;
            text-align: center;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
        }

        .note-context {
            font-size: 0.9em;
            opacity: 0.8;
            margin-bottom: 5px;
        }

        .note-source {
            font-size: 0.8em;
            opacity: 0.7;
            text-transform: uppercase;
        }

        .note-actions {
            display: flex;
            gap: 5px;
            margin-top: 10px;
        }

        .note-action {
            padding: 4px 8px;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8em;
            color: inherit;
        }

        .note-action:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        .cycle-controls {
            position: fixed;
            bottom: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            z-index: 1000;
        }

        .cycle-btn {
            padding: 10px 15px;
            background: rgba(0, 0, 0, 0.8);
            color: #4CAF50;
            border: 1px solid #4CAF50;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9em;
        }

        .cycle-btn:hover {
            background: #4CAF50;
            color: white;
        }

        .hidden {
            display: none;
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
    <div class="pin-overlay" id="pin-overlay">
        <div class="pin-input">
            <h2>🔐 Enter PIN to View Codes</h2>
            <input type="password" id="pin-input" placeholder="Enter PIN" maxlength="10">
            <br>
            <button onclick="checkPin()">Unlock</button>
        </div>
    </div>

    <div class="sticky-notes-container hidden" id="sticky-notes">
        <div class="sticky-note pin">
            <div class="note-header">
                <div class="note-type">PIN</div>
                <div class="note-time">2 min ago</div>
            </div>
            <div class="note-code">2106</div>
            <div class="note-context">Robbie F System Access</div>
            <div class="note-source">Email</div>
            <div class="note-actions">
                <button class="note-action" onclick="copyCode('2106')">Copy</button>
                <button class="note-action" onclick="hideNote(this)">Hide</button>
            </div>
        </div>

        <div class="sticky-note twofa">
            <div class="note-header">
                <div class="note-type">2FA</div>
                <div class="note-time">5 min ago</div>
            </div>
            <div class="note-code">123456</div>
            <div class="note-context">Gmail Verification</div>
            <div class="note-source">SMS</div>
            <div class="note-actions">
                <button class="note-action" onclick="copyCode('123456')">Copy</button>
                <button class="note-action" onclick="hideNote(this)">Hide</button>
            </div>
        </div>

        <div class="sticky-note twofa">
            <div class="note-header">
                <div class="note-type">2FA</div>
                <div class="note-time">8 min ago</div>
            </div>
            <div class="note-code">789012</div>
            <div class="note-context">Slack Verification</div>
            <div class="note-source">Slack</div>
            <div class="note-actions">
                <button class="note-action" onclick="copyCode('789012')">Copy</button>
                <button class="note-action" onclick="hideNote(this)">Hide</button>
            </div>
        </div>

        <div class="sticky-note service">
            <div class="note-header">
                <div class="note-type">Service</div>
                <div class="note-time">15 min ago</div>
            </div>
            <div class="note-code">Gmail</div>
            <div class="note-context">Email Service</div>
            <div class="note-source">Email</div>
            <div class="note-actions">
                <button class="note-action" onclick="copyCode('Gmail')">Copy</button>
                <button class="note-action" onclick="hideNote(this)">Hide</button>
            </div>
        </div>
    </div>

    <div class="cycle-controls hidden" id="cycle-controls">
        <button class="cycle-btn" onclick="cycleNotes('prev')">← Previous</button>
        <button class="cycle-btn" onclick="cycleNotes('next')">Next →</button>
        <button class="cycle-btn" onclick="lockNotes()">🔒 Lock</button>
    </div>

    <script>
        let currentNoteIndex = 0;
        let isUnlocked = false;

        function checkPin() {
            const pin = document.getElementById('pin-input').value;
            const validPins = ['2106', '5555']; // Allan's and Lisa's PINs
            
            if (validPins.includes(pin)) {
                unlockNotes();
            } else {
                alert('Invalid PIN');
            }
        }

        function unlockNotes() {
            isUnlocked = true;
            document.getElementById('pin-overlay').classList.add('hidden');
            document.getElementById('sticky-notes').classList.remove('hidden');
            document.getElementById('cycle-controls').classList.remove('hidden');
        }

        function lockNotes() {
            isUnlocked = false;
            document.getElementById('pin-overlay').classList.remove('hidden');
            document.getElementById('sticky-notes').classList.add('hidden');
            document.getElementById('cycle-controls').classList.add('hidden');
            document.getElementById('pin-input').value = '';
        }

        function copyCode(code) {
            navigator.clipboard.writeText(code).then(() => {
                alert('Code copied to clipboard!');
            });
        }

        function hideNote(button) {
            button.closest('.sticky-note').style.display = 'none';
        }

        function cycleNotes(direction) {
            const notes = document.querySelectorAll('.sticky-note');
            if (notes.length === 0) return;
            
            if (direction === 'next') {
                currentNoteIndex = (currentNoteIndex + 1) % notes.length;
            } else {
                currentNoteIndex = (currentNoteIndex - 1 + notes.length) % notes.length;
            }
            
            // Highlight current note
            notes.forEach((note, index) => {
                if (index === currentNoteIndex) {
                    note.style.border = '2px solid #4CAF50';
                    note.style.transform = 'rotate(0deg) scale(1.05)';
                } else {
                    note.style.border = 'none';
                    note.style.transform = 'rotate(-2deg) scale(1)';
                }
            });
        }

        // Allow Enter key to submit PIN
        document.getElementById('pin-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkPin();
            }
        });

        // Initialize
        if (isUnlocked) {
            unlockNotes();
        }
    </script>
</body>
</html>`;
  }

  // Get status
  getStatus() {
    return {
      isUnlocked: this.isUnlocked,
      totalCodes: this.extractedCodes.size,
      activeCodes: this.stickyNotes.length,
      lastScan: new Date().toISOString()
    };
  }
}

export const pinCodeSurfacer = new PinCodeSurfacer();
