import { db } from "./db.js";
import { randomUUID } from "crypto";
import crypto from "crypto";

// Credentials Management System with AES-GCM encryption
export class CredentialsManager {
  constructor() {
    this.initializeTables();
    this.encryptionKey = this.getOrCreateEncryptionKey();
  }

  initializeTables() {
    // Encrypted credentials table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS encrypted_credentials (
        id TEXT PRIMARY KEY,
        service TEXT NOT NULL,
        credential_type TEXT NOT NULL, -- 'api_key', 'oauth_token', 'password', 'secret'
        encrypted_data TEXT NOT NULL,
        iv TEXT NOT NULL,
        tag TEXT NOT NULL,
        description TEXT,
        expires_at TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // API endpoints table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS api_endpoints (
        id TEXT PRIMARY KEY,
        service TEXT NOT NULL,
        endpoint_name TEXT NOT NULL,
        base_url TEXT NOT NULL,
        auth_type TEXT NOT NULL, -- 'bearer', 'api_key', 'oauth', 'basic'
        credential_id TEXT,
        headers TEXT, -- JSON object
        rate_limit_per_minute INTEGER,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Service configurations
    db.prepare(`
      CREATE TABLE IF NOT EXISTS service_configs (
        id TEXT PRIMARY KEY,
        service_name TEXT NOT NULL UNIQUE,
        config_data TEXT NOT NULL, -- JSON object
        is_active BOOLEAN DEFAULT TRUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Indexes
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_credentials_service ON encrypted_credentials(service, is_active)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_endpoints_service ON api_endpoints(service, is_active)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_service_configs_name ON service_configs(service_name, is_active)`).run();
  }

  getOrCreateEncryptionKey() {
    // In production, this should be stored securely
    const key = process.env.VENGEANCE_ENCRYPTION_KEY || 'default-key-change-in-production';
    return crypto.createHash('sha256').update(key).digest();
  }

  // Encrypt sensitive data
  encryptData(data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);
    cipher.setAAD(Buffer.from('vengeance-credentials', 'utf8'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  // Decrypt sensitive data
  decryptData(encryptedData, iv, tag) {
    try {
      const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey);
      decipher.setAAD(Buffer.from('vengeance-credentials', 'utf8'));
      decipher.setAuthTag(Buffer.from(tag, 'hex'));
      
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt credentials');
    }
  }

  // Store encrypted credentials
  async storeCredentials(service, credentialType, data, description = '', expiresAt = null) {
    try {
      const { encrypted, iv, tag } = this.encryptData(JSON.stringify(data));
      const id = randomUUID();
      
      db.prepare(`
        INSERT INTO encrypted_credentials (
          id, service, credential_type, encrypted_data, iv, tag, description, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, service, credentialType, encrypted, iv, tag, description, expiresAt);
      
      return { id, service, credentialType, description };
    } catch (error) {
      console.error('Error storing credentials:', error);
      throw new Error('Failed to store credentials');
    }
  }

  // Retrieve and decrypt credentials
  async getCredentials(service, credentialType = null) {
    try {
      let query = 'SELECT * FROM encrypted_credentials WHERE service = ? AND is_active = TRUE';
      let params = [service];
      
      if (credentialType) {
        query += ' AND credential_type = ?';
        params.push(credentialType);
      }
      
      const rows = db.prepare(query).all(...params);
      
      return rows.map(row => {
        const decryptedData = this.decryptData(row.encrypted_data, row.iv, row.tag);
        return {
          id: row.id,
          service: row.service,
          credentialType: row.credential_type,
          data: JSON.parse(decryptedData),
          description: row.description,
          expiresAt: row.expires_at,
          createdAt: row.created_at
        };
      });
    } catch (error) {
      console.error('Error retrieving credentials:', error);
      throw new Error('Failed to retrieve credentials');
    }
  }

  // Store API endpoint configuration
  async storeAPIEndpoint(service, endpointName, baseUrl, authType, credentialId = null, headers = {}, rateLimit = null) {
    try {
      const id = randomUUID();
      
      db.prepare(`
        INSERT INTO api_endpoints (
          id, service, endpoint_name, base_url, auth_type, credential_id, headers, rate_limit_per_minute
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, service, endpointName, baseUrl, authType, credentialId, JSON.stringify(headers), rateLimit);
      
      return { id, service, endpointName, baseUrl, authType };
    } catch (error) {
      console.error('Error storing API endpoint:', error);
      throw new Error('Failed to store API endpoint');
    }
  }

  // Get API endpoint configuration
  async getAPIEndpoint(service, endpointName = null) {
    try {
      let query = 'SELECT * FROM api_endpoints WHERE service = ? AND is_active = TRUE';
      let params = [service];
      
      if (endpointName) {
        query += ' AND endpoint_name = ?';
        params.push(endpointName);
      }
      
      const rows = db.prepare(query).all(...params);
      
      return rows.map(row => ({
        id: row.id,
        service: row.service,
        endpointName: row.endpoint_name,
        baseUrl: row.base_url,
        authType: row.auth_type,
        credentialId: row.credential_id,
        headers: JSON.parse(row.headers || '{}'),
        rateLimit: row.rate_limit_per_minute,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Error retrieving API endpoint:', error);
      throw new Error('Failed to retrieve API endpoint');
    }
  }

  // Store service configuration
  async storeServiceConfig(serviceName, configData) {
    try {
      const id = randomUUID();
      
      db.prepare(`
        INSERT OR REPLACE INTO service_configs (id, service_name, config_data)
        VALUES (?, ?, ?)
      `).run(id, serviceName, JSON.stringify(configData));
      
      return { id, serviceName, configData };
    } catch (error) {
      console.error('Error storing service config:', error);
      throw new Error('Failed to store service configuration');
    }
  }

  // Get service configuration
  async getServiceConfig(serviceName) {
    try {
      const row = db.prepare(`
        SELECT * FROM service_configs WHERE service_name = ? AND is_active = TRUE
      `).get(serviceName);
      
      if (!row) return null;
      
      return {
        id: row.id,
        serviceName: row.service_name,
        configData: JSON.parse(row.config_data),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Error retrieving service config:', error);
      throw new Error('Failed to retrieve service configuration');
    }
  }

  // Initialize default credentials and endpoints
  async initializeDefaults() {
    try {
      // Google APIs
      await this.storeAPIEndpoint('google', 'drive', 'https://www.googleapis.com/drive/v3', 'oauth', null, {
        'Content-Type': 'application/json'
      });
      
      await this.storeAPIEndpoint('google', 'gmail', 'https://gmail.googleapis.com/gmail/v1', 'oauth', null, {
        'Content-Type': 'application/json'
      });
      
      await this.storeAPIEndpoint('google', 'calendar', 'https://www.googleapis.com/calendar/v3', 'oauth', null, {
        'Content-Type': 'application/json'
      });
      
      // HubSpot
      await this.storeAPIEndpoint('hubspot', 'crm', 'https://api.hubapi.com/crm/v3', 'api_key', null, {
        'Content-Type': 'application/json'
      });
      
      // Clay
      await this.storeAPIEndpoint('clay', 'enrichment', 'https://www.clay.com/api/v1', 'api_key', null, {
        'Content-Type': 'application/json'
      });
      
      // Slack
      await this.storeAPIEndpoint('slack', 'webhook', 'https://hooks.slack.com/services', 'bearer', null, {
        'Content-Type': 'application/json'
      });
      
      // OpenAI (for fallback)
      await this.storeAPIEndpoint('openai', 'chat', 'https://api.openai.com/v1', 'bearer', null, {
        'Content-Type': 'application/json'
      });
      
      // TestPilot specific services
      await this.storeAPIEndpoint('testpilot', 'shopping_simulator', 'https://testpilot-shopping-simulator.com/api', 'api_key', null, {
        'Content-Type': 'application/json',
        'X-API-Version': 'v1'
      });
      
      console.log('✅ Default API endpoints initialized');
    } catch (error) {
      console.error('Error initializing defaults:', error);
    }
  }

  // List all services
  listServices() {
    try {
      const services = db.prepare(`
        SELECT DISTINCT service, COUNT(*) as endpoint_count
        FROM api_endpoints 
        WHERE is_active = TRUE
        GROUP BY service
        ORDER BY service
      `).all();
      
      return services;
    } catch (error) {
      console.error('Error listing services:', error);
      return [];
    }
  }

  // Deactivate credentials
  deactivateCredentials(credentialId) {
    try {
      db.prepare(`
        UPDATE encrypted_credentials 
        SET is_active = FALSE, updated_at = datetime('now')
        WHERE id = ?
      `).run(credentialId);
      
      return { success: true, credentialId };
    } catch (error) {
      console.error('Error deactivating credentials:', error);
      throw new Error('Failed to deactivate credentials');
    }
  }

  // Check if credentials are expired
  checkExpiredCredentials() {
    try {
      const expired = db.prepare(`
        SELECT id, service, credential_type, description, expires_at
        FROM encrypted_credentials
        WHERE expires_at IS NOT NULL 
        AND expires_at < datetime('now')
        AND is_active = TRUE
      `).all();
      
      return expired;
    } catch (error) {
      console.error('Error checking expired credentials:', error);
      return [];
    }
  }
}

// Singleton instance
export const credentialsManager = new CredentialsManager();
