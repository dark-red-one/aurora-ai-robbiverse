// Robbie F Universal Inbox - Unified email, SMS, and communication management
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class UniversalInbox {
  constructor() {
    this.messages = new Map();
    this.categories = {
      'inbox': [],
      'important': [],
      'unread': [],
      'sent': [],
      'drafts': [],
      'trash': []
    };
    this.filters = {
      'unread': true,
      'important': false,
      'from_allan': false,
      'from_lisa': false,
      'from_team': false
    };
    this.isInitialized = false;
  }

  // Initialize universal inbox
  async initialize() {
    console.log('📧 Robbie F: Initializing universal inbox...');
    
    try {
      // Load existing messages
      await this.loadExistingMessages();
      
      // Start monitoring
      await this.startMonitoring();
      
      this.isInitialized = true;
      console.log('✅ Robbie F: Universal inbox ready!');
      return true;
    } catch (error) {
      console.error('❌ Robbie F: Universal inbox initialization failed:', error);
      return false;
    }
  }

  // Load existing messages
  async loadExistingMessages() {
    try {
      const messagesData = await fs.readFile('/home/allan/vengeance/data/inbox_messages.json', 'utf8');
      const messages = JSON.parse(messagesData);
      
      messages.forEach(message => {
        this.messages.set(message.id, message);
        this.categorizeMessage(message);
      });
      
      console.log(`📊 Robbie F: Loaded ${this.messages.size} messages`);
    } catch (error) {
      console.log('⚠️  No existing messages found, starting fresh');
      await this.initializeSampleMessages();
    }
  }

  // Initialize sample messages
  async initializeSampleMessages() {
    const sampleMessages = [
      {
        id: 'msg_1',
        from: 'allan@testpilotcpg.com',
        to: 'robbie@heyrobbie.ai',
        subject: 'Make sure we have the web browser tab and notes tab too even if UI is basic',
        body: 'This is a Robbie note - I need to implement web browser and notes tabs in the interface.',
        timestamp: new Date().toISOString(),
        type: 'email',
        category: 'inbox',
        isRead: false,
        isImportant: true,
        isAllanNote: false,
        isRobbieNote: true
      },
      {
        id: 'msg_2',
        from: 'allan@testpilotcpg.com',
        to: 'robbie@heyrobbie.ai',
        subject: 'All of the "Make sure" things should become robbie notes',
        body: 'This is a Robbie note - I need to automatically convert "Make sure" statements into Robbie notes.',
        timestamp: new Date().toISOString(),
        type: 'email',
        category: 'inbox',
        isRead: false,
        isImportant: true,
        isAllanNote: false,
        isRobbieNote: true
      },
      {
        id: 'msg_3',
        from: 'allan@testpilotcpg.com',
        to: 'robbie@heyrobbie.ai',
        subject: 'And anything I say (please note) should be an Allan note',
        body: 'This is an Allan note - I need to automatically convert "(please note)" statements into Allan notes.',
        timestamp: new Date().toISOString(),
        type: 'email',
        category: 'inbox',
        isRead: false,
        isImportant: true,
        isAllanNote: true,
        isRobbieNote: false
      },
      {
        id: 'msg_4',
        from: 'allan@testpilotcpg.com',
        to: 'robbie@heyrobbie.ai',
        subject: 'I can also edit notes add notes and delete notes in the web interface',
        body: 'This is an Allan note - I need to implement note editing, adding, and deleting in the web interface.',
        timestamp: new Date().toISOString(),
        type: 'email',
        category: 'inbox',
        isRead: false,
        isImportant: true,
        isAllanNote: true,
        isRobbieNote: false
      },
      {
        id: 'msg_5',
        from: 'allan@testpilotcpg.com',
        to: 'robbie@heyrobbie.ai',
        subject: 'Also start the inbox',
        body: 'This is an Allan note - I need to start the inbox system.',
        timestamp: new Date().toISOString(),
        type: 'email',
        category: 'inbox',
        isRead: false,
        isImportant: true,
        isAllanNote: true,
        isRobbieNote: false
      },
      {
        id: 'msg_6',
        from: 'allan@testpilotcpg.com',
        to: 'robbie@heyrobbie.ai',
        subject: '(Universal inbox) even if it\'s only email for now',
        body: 'This is an Allan note - I need to implement a universal inbox, starting with email.',
        timestamp: new Date().toISOString(),
        type: 'email',
        category: 'inbox',
        isRead: false,
        isImportant: true,
        isAllanNote: true,
        isRobbieNote: false
      }
    ];
    
    for (const message of sampleMessages) {
      this.messages.set(message.id, message);
      this.categorizeMessage(message);
    }
  }

  // Categorize message
  categorizeMessage(message) {
    // Add to inbox by default
    if (!this.categories.inbox.includes(message.id)) {
      this.categories.inbox.push(message.id);
    }
    
    // Add to unread if not read
    if (!message.isRead && !this.categories.unread.includes(message.id)) {
      this.categories.unread.push(message.id);
    }
    
    // Add to important if marked important
    if (message.isImportant && !this.categories.important.includes(message.id)) {
      this.categories.important.push(message.id);
    }
    
    // Add to sent if from Allan
    if (message.from === 'allan@testpilotcpg.com' && !this.categories.sent.includes(message.id)) {
      this.categories.sent.push(message.id);
    }
  }

  // Start monitoring
  async startMonitoring() {
    // Monitor for new messages every 10 seconds
    setInterval(async () => {
      await this.checkForNewMessages();
    }, 10000);
    
    console.log('🔄 Robbie F: Started monitoring for new messages');
  }

  // Check for new messages
  async checkForNewMessages() {
    try {
      // This would check for new emails, SMS, etc.
      // For now, we'll simulate some updates
      await this.simulateNewMessages();
    } catch (error) {
      console.error('❌ Robbie F: Error checking for new messages:', error);
    }
  }

  // Simulate new messages
  async simulateNewMessages() {
    // This would integrate with actual email/SMS systems
    // For now, we'll just log that we're checking
    console.log('📧 Robbie F: Checking for new messages...');
  }

  // Generate inbox interface
  generateInboxInterface() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Robbie F - Universal Inbox</title>
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

        .header p {
            font-size: 1.2em;
            opacity: 0.8;
        }

        .inbox-controls {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }

        .filter-btn {
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: #cccccc;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .filter-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .filter-btn.active {
            background: #4CAF50;
            border-color: #4CAF50;
            color: white;
        }

        .message-list {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .message-item {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 15px;
            border-left: 4px solid #4CAF50;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .message-item:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateX(5px);
        }

        .message-item.unread {
            border-left-color: #2196F3;
            background: rgba(33, 150, 243, 0.1);
        }

        .message-item.important {
            border-left-color: #FF9800;
            background: rgba(255, 152, 0, 0.1);
        }

        .message-item.allan-note {
            border-left-color: #9C27B0;
            background: rgba(156, 39, 176, 0.1);
        }

        .message-item.robbie-note {
            border-left-color: #4CAF50;
            background: rgba(76, 175, 80, 0.1);
        }

        .message-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }

        .message-subject {
            font-weight: bold;
            font-size: 1.1em;
        }

        .message-meta {
            display: flex;
            gap: 10px;
            font-size: 0.9em;
            opacity: 0.8;
        }

        .message-body {
            font-size: 0.9em;
            opacity: 0.8;
            margin-bottom: 10px;
            line-height: 1.4;
        }

        .message-actions {
            display: flex;
            gap: 10px;
        }

        .action-btn {
            padding: 4px 8px;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            border-radius: 4px;
            color: #cccccc;
            cursor: pointer;
            font-size: 0.8em;
            transition: all 0.3s ease;
        }

        .action-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .action-btn.important {
            background: #FF9800;
            color: white;
        }

        .action-btn.read {
            background: #2196F3;
            color: white;
        }

        .action-btn.delete {
            background: #F44336;
            color: white;
        }

        .note-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.7em;
            font-weight: bold;
            text-transform: uppercase;
            margin-left: 8px;
        }

        .note-badge.allan {
            background: #9C27B0;
            color: white;
        }

        .note-badge.robbie {
            background: #4CAF50;
            color: white;
        }

        .compose-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            background: linear-gradient(45deg, #4CAF50, #2196F3);
            border: none;
            border-radius: 50%;
            color: white;
            font-size: 1.5em;
            cursor: pointer;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
        }

        .compose-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
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
            <h1>📧 Robbie F - Universal Inbox</h1>
            <p>Unified email, SMS, and communication management</p>
        </div>

        <div class="inbox-controls fade-in">
            <button class="filter-btn active" onclick="filterMessages('all')">All Messages</button>
            <button class="filter-btn" onclick="filterMessages('unread')">Unread</button>
            <button class="filter-btn" onclick="filterMessages('important')">Important</button>
            <button class="filter-btn" onclick="filterMessages('allan-notes')">Allan Notes</button>
            <button class="filter-btn" onclick="filterMessages('robbie-notes')">Robbie Notes</button>
            <button class="filter-btn" onclick="filterMessages('sent')">Sent</button>
            <button class="filter-btn" onclick="filterMessages('drafts')">Drafts</button>
        </div>

        <div class="message-list fade-in" id="message-list">
            <div class="message-item unread important allan-note">
                <div class="message-header">
                    <div class="message-subject">
                        Make sure we have the web browser tab and notes tab too even if UI is basic
                        <span class="note-badge robbie">Robbie Note</span>
                    </div>
                    <div class="message-meta">
                        <span>2 min ago</span>
                        <span>•</span>
                        <span>allan@testpilotcpg.com</span>
                    </div>
                </div>
                <div class="message-body">
                    This is a Robbie note - I need to implement web browser and notes tabs in the interface.
                </div>
                <div class="message-actions">
                    <button class="action-btn read" onclick="markAsRead(this)">Mark Read</button>
                    <button class="action-btn important" onclick="toggleImportant(this)">Important</button>
                    <button class="action-btn delete" onclick="deleteMessage(this)">Delete</button>
                </div>
            </div>

            <div class="message-item unread important allan-note">
                <div class="message-header">
                    <div class="message-subject">
                        All of the "Make sure" things should become robbie notes
                        <span class="note-badge robbie">Robbie Note</span>
                    </div>
                    <div class="message-meta">
                        <span>5 min ago</span>
                        <span>•</span>
                        <span>allan@testpilotcpg.com</span>
                    </div>
                </div>
                <div class="message-body">
                    This is a Robbie note - I need to automatically convert "Make sure" statements into Robbie notes.
                </div>
                <div class="message-actions">
                    <button class="action-btn read" onclick="markAsRead(this)">Mark Read</button>
                    <button class="action-btn important" onclick="toggleImportant(this)">Important</button>
                    <button class="action-btn delete" onclick="deleteMessage(this)">Delete</button>
                </div>
            </div>

            <div class="message-item unread important allan-note">
                <div class="message-header">
                    <div class="message-subject">
                        And anything I say (please note) should be an Allan note
                        <span class="note-badge allan">Allan Note</span>
                    </div>
                    <div class="message-meta">
                        <span>8 min ago</span>
                        <span>•</span>
                        <span>allan@testpilotcpg.com</span>
                    </div>
                </div>
                <div class="message-body">
                    This is an Allan note - I need to automatically convert "(please note)" statements into Allan notes.
                </div>
                <div class="message-actions">
                    <button class="action-btn read" onclick="markAsRead(this)">Mark Read</button>
                    <button class="action-btn important" onclick="toggleImportant(this)">Important</button>
                    <button class="action-btn delete" onclick="deleteMessage(this)">Delete</button>
                </div>
            </div>

            <div class="message-item unread important allan-note">
                <div class="message-header">
                    <div class="message-subject">
                        I can also edit notes add notes and delete notes in the web interface
                        <span class="note-badge allan">Allan Note</span>
                    </div>
                    <div class="message-meta">
                        <span>12 min ago</span>
                        <span>•</span>
                        <span>allan@testpilotcpg.com</span>
                    </div>
                </div>
                <div class="message-body">
                    This is an Allan note - I need to implement note editing, adding, and deleting in the web interface.
                </div>
                <div class="message-actions">
                    <button class="action-btn read" onclick="markAsRead(this)">Mark Read</button>
                    <button class="action-btn important" onclick="toggleImportant(this)">Important</button>
                    <button class="action-btn delete" onclick="deleteMessage(this)">Delete</button>
                </div>
            </div>

            <div class="message-item unread important allan-note">
                <div class="message-header">
                    <div class="message-subject">
                        Also start the inbox
                        <span class="note-badge allan">Allan Note</span>
                    </div>
                    <div class="message-meta">
                        <span>15 min ago</span>
                        <span>•</span>
                        <span>allan@testpilotcpg.com</span>
                    </div>
                </div>
                <div class="message-body">
                    This is an Allan note - I need to start the inbox system.
                </div>
                <div class="message-actions">
                    <button class="action-btn read" onclick="markAsRead(this)">Mark Read</button>
                    <button class="action-btn important" onclick="toggleImportant(this)">Important</button>
                    <button class="action-btn delete" onclick="deleteMessage(this)">Delete</button>
                </div>
            </div>

            <div class="message-item unread important allan-note">
                <div class="message-header">
                    <div class="message-subject">
                        (Universal inbox) even if it's only email for now
                        <span class="note-badge allan">Allan Note</span>
                    </div>
                    <div class="message-meta">
                        <span>18 min ago</span>
                        <span>•</span>
                        <span>allan@testpilotcpg.com</span>
                    </div>
                </div>
                <div class="message-body">
                    This is an Allan note - I need to implement a universal inbox, starting with email.
                </div>
                <div class="message-actions">
                    <button class="action-btn read" onclick="markAsRead(this)">Mark Read</button>
                    <button class="action-btn important" onclick="toggleImportant(this)">Important</button>
                    <button class="action-btn delete" onclick="deleteMessage(this)">Delete</button>
                </div>
            </div>
        </div>
    </div>

    <button class="compose-btn" onclick="composeMessage()">+</button>

    <script>
        function filterMessages(filter) {
            // Update active filter button
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            // Filter messages based on selected filter
            const messages = document.querySelectorAll('.message-item');
            messages.forEach(message => {
                let show = true;
                
                switch(filter) {
                    case 'unread':
                        show = message.classList.contains('unread');
                        break;
                    case 'important':
                        show = message.classList.contains('important');
                        break;
                    case 'allan-notes':
                        show = message.classList.contains('allan-note');
                        break;
                    case 'robbie-notes':
                        show = message.classList.contains('robbie-note');
                        break;
                    case 'sent':
                        show = message.classList.contains('sent');
                        break;
                    case 'drafts':
                        show = message.classList.contains('draft');
                        break;
                    default:
                        show = true;
                }
                
                message.style.display = show ? 'block' : 'none';
            });
        }

        function markAsRead(button) {
            const message = button.closest('.message-item');
            message.classList.remove('unread');
            button.textContent = 'Mark Unread';
            button.onclick = () => markAsUnread(button);
        }

        function markAsUnread(button) {
            const message = button.closest('.message-item');
            message.classList.add('unread');
            button.textContent = 'Mark Read';
            button.onclick = () => markAsRead(button);
        }

        function toggleImportant(button) {
            const message = button.closest('.message-item');
            message.classList.toggle('important');
            button.textContent = message.classList.contains('important') ? 'Not Important' : 'Important';
        }

        function deleteMessage(button) {
            if (confirm('Are you sure you want to delete this message?')) {
                button.closest('.message-item').remove();
            }
        }

        function composeMessage() {
            alert('Compose message functionality coming soon!');
        }
    </script>
</body>
</html>`;
  }

  // Get status
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      totalMessages: this.messages.size,
      unreadCount: this.categories.unread.length,
      importantCount: this.categories.important.length,
      allanNotesCount: Array.from(this.messages.values()).filter(m => m.isAllanNote).length,
      robbieNotesCount: Array.from(this.messages.values()).filter(m => m.isRobbieNote).length
    };
  }
}

export const universalInbox = new UniversalInbox();
