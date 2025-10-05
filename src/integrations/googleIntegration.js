import { db } from "./db.js";
import { randomUUID } from "crypto";

// Google Integration System - Syncs with Google Drive, Gmail, Calendar
export class GoogleIntegration {
  constructor() {
    this.initializeTables();
    this.setupOAuth();
  }

  initializeTables() {
    // Google sync status table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS google_sync_status (
        id TEXT PRIMARY KEY,
        service TEXT NOT NULL, -- 'drive', 'gmail', 'calendar', 'contacts'
        last_sync TEXT NOT NULL DEFAULT (datetime('now')),
        sync_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
        items_processed INTEGER DEFAULT 0,
        items_total INTEGER DEFAULT 0,
        error_message TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Google Drive files table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS google_drive_files (
        id TEXT PRIMARY KEY,
        google_file_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size_bytes INTEGER,
        modified_time TEXT,
        web_view_link TEXT,
        local_path TEXT,
        sync_status TEXT DEFAULT 'pending', -- 'pending', 'synced', 'modified', 'deleted'
        last_synced TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Gmail messages table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS gmail_messages (
        id TEXT PRIMARY KEY,
        google_message_id TEXT NOT NULL UNIQUE,
        thread_id TEXT NOT NULL,
        subject TEXT,
        sender TEXT,
        recipient TEXT,
        date TEXT,
        snippet TEXT,
        body TEXT,
        labels TEXT, -- JSON array
        importance TEXT, -- 'high', 'medium', 'low'
        processed BOOLEAN DEFAULT FALSE,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Google Calendar events table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS google_calendar_events (
        id TEXT PRIMARY KEY,
        google_event_id TEXT NOT NULL UNIQUE,
        summary TEXT,
        description TEXT,
        start_time TEXT,
        end_time TEXT,
        location TEXT,
        attendees TEXT, -- JSON array
        status TEXT, -- 'confirmed', 'tentative', 'cancelled'
        meeting_type TEXT, -- 'internal', 'external', 'personal'
        importance TEXT, -- 'high', 'medium', 'low'
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Google Contacts table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS google_contacts (
        id TEXT PRIMARY KEY,
        google_contact_id TEXT NOT NULL UNIQUE,
        name TEXT,
        email TEXT,
        phone TEXT,
        company TEXT,
        title TEXT,
        notes TEXT,
        tags TEXT, -- JSON array
        last_contacted TEXT,
        relationship_strength REAL DEFAULT 0.5, -- 0.0 to 1.0
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Indexes
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_google_drive_modified ON google_drive_files(modified_time)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_gmail_date ON gmail_messages(date)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_gmail_importance ON gmail_messages(importance)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_calendar_start ON google_calendar_events(start_time)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_contacts_company ON google_contacts(company)`).run();
  }

  setupOAuth() {
    // OAuth configuration would go here
    // For now, we'll use service account credentials
    this.credentials = {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      access_token: null,
      token_expiry: null
    };
  }

  // Sync Google Drive files
  async syncGoogleDrive() {
    const syncId = randomUUID();
    
    try {
      // Mark sync as in progress
      db.prepare(`
        INSERT INTO google_sync_status (id, service, sync_status)
        VALUES (?, 'drive', 'in_progress')
      `).run(syncId);

      // This would integrate with Google Drive API
      // For now, we'll simulate the sync process
      const files = await this.fetchGoogleDriveFiles();
      
      let processed = 0;
      for (const file of files) {
        await this.processDriveFile(file);
        processed++;
        
        // Update progress
        db.prepare(`
          UPDATE google_sync_status 
          SET items_processed = ?, items_total = ?
          WHERE id = ?
        `).run(processed, files.length, syncId);
      }

      // Mark sync as completed
      db.prepare(`
        UPDATE google_sync_status 
        SET sync_status = 'completed', last_sync = datetime('now')
        WHERE id = ?
      `).run(syncId);

      return { success: true, filesProcessed: processed };
    } catch (error) {
      // Mark sync as failed
      db.prepare(`
        UPDATE google_sync_status 
        SET sync_status = 'failed', error_message = ?
        WHERE id = ?
      `).run(error.message, syncId);

      return { success: false, error: error.message };
    }
  }

  // Sync Gmail messages
  async syncGmail() {
    const syncId = randomUUID();
    
    try {
      db.prepare(`
        INSERT INTO google_sync_status (id, service, sync_status)
        VALUES (?, 'gmail', 'in_progress')
      `).run(syncId);

      const messages = await this.fetchGmailMessages();
      
      let processed = 0;
      for (const message of messages) {
        await this.processGmailMessage(message);
        processed++;
        
        db.prepare(`
          UPDATE google_sync_status 
          SET items_processed = ?, items_total = ?
          WHERE id = ?
        `).run(processed, messages.length, syncId);
      }

      db.prepare(`
        UPDATE google_sync_status 
        SET sync_status = 'completed', last_sync = datetime('now')
        WHERE id = ?
      `).run(syncId);

      return { success: true, messagesProcessed: processed };
    } catch (error) {
      db.prepare(`
        UPDATE google_sync_status 
        SET sync_status = 'failed', error_message = ?
        WHERE id = ?
      `).run(error.message, syncId);

      return { success: false, error: error.message };
    }
  }

  // Sync Google Calendar events
  async syncGoogleCalendar() {
    const syncId = randomUUID();
    
    try {
      db.prepare(`
        INSERT INTO google_sync_status (id, service, sync_status)
        VALUES (?, 'calendar', 'in_progress')
      `).run(syncId);

      const events = await this.fetchGoogleCalendarEvents();
      
      let processed = 0;
      for (const event of events) {
        await this.processCalendarEvent(event);
        processed++;
        
        db.prepare(`
          UPDATE google_sync_status 
          SET items_processed = ?, items_total = ?
          WHERE id = ?
        `).run(processed, events.length, syncId);
      }

      db.prepare(`
        UPDATE google_sync_status 
        SET sync_status = 'completed', last_sync = datetime('now')
        WHERE id = ?
      `).run(syncId);

      return { success: true, eventsProcessed: processed };
    } catch (error) {
      db.prepare(`
        UPDATE google_sync_status 
        SET sync_status = 'failed', error_message = ?
        WHERE id = ?
      `).run(error.message, syncId);

      return { success: false, error: error.message };
    }
  }

  // Sync Google Contacts
  async syncGoogleContacts() {
    const syncId = randomUUID();
    
    try {
      db.prepare(`
        INSERT INTO google_sync_status (id, service, sync_status)
        VALUES (?, 'contacts', 'in_progress')
      `).run(syncId);

      const contacts = await this.fetchGoogleContacts();
      
      let processed = 0;
      for (const contact of contacts) {
        await this.processContact(contact);
        processed++;
        
        db.prepare(`
          UPDATE google_sync_status 
          SET items_processed = ?, items_total = ?
          WHERE id = ?
        `).run(processed, contacts.length, syncId);
      }

      db.prepare(`
        UPDATE google_sync_status 
        SET sync_status = 'completed', last_sync = datetime('now')
        WHERE id = ?
      `).run(syncId);

      return { success: true, contactsProcessed: processed };
    } catch (error) {
      db.prepare(`
        UPDATE google_sync_status 
        SET sync_status = 'failed', error_message = ?
        WHERE id = ?
      `).run(error.message, syncId);

      return { success: false, error: error.message };
    }
  }

  // Mock API calls - these would be replaced with actual Google API calls
  async fetchGoogleDriveFiles() {
    // This would use Google Drive API
    return [
      {
        id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        name: 'TestPilot Strategy Q4 2024.pdf',
        mimeType: 'application/pdf',
        size: 1024000,
        modifiedTime: new Date().toISOString(),
        webViewLink: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view'
      }
    ];
  }

  async fetchGmailMessages() {
    // This would use Gmail API
    return [
      {
        id: '18c2f4a5b6c7d8e9f0',
        threadId: '18c2f4a5b6c7d8e9f0',
        subject: 'TestPilot Growth Strategy Discussion',
        sender: 'allan@testpilot.com',
        recipient: 'robbie@testpilot.com',
        date: new Date().toISOString(),
        snippet: 'Let\'s discuss the Q4 growth strategy and how we can optimize our approach...',
        body: 'Full email body would go here...',
        labels: ['INBOX', 'IMPORTANT']
      }
    ];
  }

  async fetchGoogleCalendarEvents() {
    // This would use Google Calendar API
    return [
      {
        id: 'event123',
        summary: 'TestPilot Strategy Meeting',
        description: 'Weekly strategy discussion with the team',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
        location: 'Conference Room A',
        attendees: ['allan@testpilot.com', 'robbie@testpilot.com'],
        status: 'confirmed',
        meetingType: 'internal'
      }
    ];
  }

  async fetchGoogleContacts() {
    // This would use Google Contacts API
    return [
      {
        id: 'contact123',
        name: 'John Smith',
        email: 'john@example.com',
        phone: '+1-555-0123',
        company: 'Acme Corp',
        title: 'VP of Sales',
        notes: 'Met at conference, interested in partnership'
      }
    ];
  }

  // Process individual items
  async processDriveFile(file) {
    const existing = db.prepare(`
      SELECT * FROM google_drive_files WHERE google_file_id = ?
    `).get(file.id);

    if (existing) {
      // Update existing file
      db.prepare(`
        UPDATE google_drive_files SET
          name = ?, mime_type = ?, size_bytes = ?, modified_time = ?,
          web_view_link = ?, sync_status = 'synced', last_synced = datetime('now')
        WHERE google_file_id = ?
      `).run(
        file.name, file.mimeType, file.size, file.modifiedTime,
        file.webViewLink, file.id
      );
    } else {
      // Insert new file
      const id = randomUUID();
      db.prepare(`
        INSERT INTO google_drive_files (
          id, google_file_id, name, mime_type, size_bytes, modified_time, web_view_link
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, file.id, file.name, file.mimeType, file.size, file.modifiedTime, file.webViewLink
      );
    }
  }

  async processGmailMessage(message) {
    const existing = db.prepare(`
      SELECT * FROM gmail_messages WHERE google_message_id = ?
    `).get(message.id);

    if (existing) {
      // Update existing message
      db.prepare(`
        UPDATE gmail_messages SET
          subject = ?, sender = ?, recipient = ?, date = ?, snippet = ?, body = ?, labels = ?
        WHERE google_message_id = ?
      `).run(
        message.subject, message.sender, message.recipient, message.date,
        message.snippet, message.body, JSON.stringify(message.labels), message.id
      );
    } else {
      // Insert new message
      const id = randomUUID();
      db.prepare(`
        INSERT INTO gmail_messages (
          id, google_message_id, thread_id, subject, sender, recipient, date, snippet, body, labels
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, message.id, message.threadId, message.subject, message.sender,
        message.recipient, message.date, message.snippet, message.body, JSON.stringify(message.labels)
      );
    }
  }

  async processCalendarEvent(event) {
    const existing = db.prepare(`
      SELECT * FROM google_calendar_events WHERE google_event_id = ?
    `).get(event.id);

    if (existing) {
      // Update existing event
      db.prepare(`
        UPDATE google_calendar_events SET
          summary = ?, description = ?, start_time = ?, end_time = ?, location = ?,
          attendees = ?, status = ?, meeting_type = ?
        WHERE google_event_id = ?
      `).run(
        event.summary, event.description, event.startTime, event.endTime, event.location,
        JSON.stringify(event.attendees), event.status, event.meetingType, event.id
      );
    } else {
      // Insert new event
      const id = randomUUID();
      db.prepare(`
        INSERT INTO google_calendar_events (
          id, google_event_id, summary, description, start_time, end_time, location, attendees, status, meeting_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, event.id, event.summary, event.description, event.startTime, event.endTime,
        event.location, JSON.stringify(event.attendees), event.status, event.meetingType
      );
    }
  }

  async processContact(contact) {
    const existing = db.prepare(`
      SELECT * FROM google_contacts WHERE google_contact_id = ?
    `).get(contact.id);

    if (existing) {
      // Update existing contact
      db.prepare(`
        UPDATE google_contacts SET
          name = ?, email = ?, phone = ?, company = ?, title = ?, notes = ?
        WHERE google_contact_id = ?
      `).run(
        contact.name, contact.email, contact.phone, contact.company, contact.title, contact.notes, contact.id
      );
    } else {
      // Insert new contact
      const id = randomUUID();
      db.prepare(`
        INSERT INTO google_contacts (
          id, google_contact_id, name, email, phone, company, title, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, contact.id, contact.name, contact.email, contact.phone, contact.company, contact.title, contact.notes
      );
    }
  }

  // Get sync status
  getSyncStatus() {
    return db.prepare(`
      SELECT * FROM google_sync_status 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all();
  }

  // Get recent files
  getRecentFiles(limit = 20) {
    return db.prepare(`
      SELECT * FROM google_drive_files 
      ORDER BY modified_time DESC 
      LIMIT ?
    `).all(limit);
  }

  // Get recent messages
  getRecentMessages(limit = 20) {
    return db.prepare(`
      SELECT * FROM gmail_messages 
      ORDER BY date DESC 
      LIMIT ?
    `).all(limit);
  }

  // Get upcoming events
  getUpcomingEvents(limit = 10) {
    return db.prepare(`
      SELECT * FROM google_calendar_events 
      WHERE start_time > datetime('now') 
      ORDER BY start_time ASC 
      LIMIT ?
    `).all(limit);
  }

  // Get contacts by company
  getContactsByCompany(company) {
    return db.prepare(`
      SELECT * FROM google_contacts 
      WHERE company LIKE ? 
      ORDER BY name ASC
    `).all(`%${company}%`);
  }
}

// Singleton instance
export const googleIntegration = new GoogleIntegration();
