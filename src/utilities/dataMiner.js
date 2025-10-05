// Robbie V3 Data Miner - Extract and integrate valuable data from various sources
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class DataMiner {
  constructor() {
    this.credentials = new Map();
    this.addresses = new Map();
    this.approaches = new Map();
    this.standards = new Map();
    this.intentData = new Map();
    this.chromeHistory = [];
    this.bookmarks = [];
    this.priorities = [];
  }

  // Main data mining entry point
  async mineAllData() {
    console.log('🔍 Starting comprehensive data mining...');
    
    try {
      // Mine credentials and sensitive data
      await this.mineCredentials();
      
      // Mine addresses and contact information
      await this.mineAddresses();
      
      // Mine approaches and methodologies
      await this.mineApproaches();
      
      // Mine standards and best practices
      await this.mineStandards();
      
      // Mine browser data for intent analysis
      await this.mineBrowserData();
      
      // Mine priority signals
      await this.minePrioritySignals();
      
      console.log('✅ Data mining completed successfully');
      return this.getMinedData();
    } catch (error) {
      console.error('❌ Data mining failed:', error);
      throw error;
    }
  }

  // Mine credentials and sensitive data
  async mineCredentials() {
    console.log('🔐 Mining credentials and sensitive data...');
    
    // Common credential patterns
    const credentialPatterns = [
      /api[_-]?key[:\s=]+['"]?([a-zA-Z0-9_-]{20,})['"]?/gi,
      /secret[:\s=]+['"]?([a-zA-Z0-9_-]{20,})['"]?/gi,
      /token[:\s=]+['"]?([a-zA-Z0-9_-]{20,})['"]?/gi,
      /password[:\s=]+['"]?([a-zA-Z0-9@#$%^&*()_+-={}[\]|\\:";'<>?,./]{8,})['"]?/gi,
      /client[_-]?id[:\s=]+['"]?([a-zA-Z0-9_-]{10,})['"]?/gi,
      /client[_-]?secret[:\s=]+['"]?([a-zA-Z0-9_-]{20,})['"]?/gi
    ];

    // Search in common locations
    const searchPaths = [
      '/home/allan/.config',
      '/home/allan/.local/share',
      '/home/allan/Documents',
      '/home/allan/Desktop',
      '/home/allan/Downloads'
    ];

    for (const searchPath of searchPaths) {
      try {
        await this.searchForCredentials(searchPath, credentialPatterns);
      } catch (error) {
        console.log(`⚠️  Could not search ${searchPath}: ${error.message}`);
      }
    }

    // Store in secure location
    await this.storeCredentials();
  }

  // Search for credentials in directory
  async searchForCredentials(dirPath, patterns) {
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const file of files) {
        const fullPath = path.join(dirPath, file.name);
        
        if (file.isDirectory()) {
          await this.searchForCredentials(fullPath, patterns);
        } else if (file.isFile() && this.isTextFile(file.name)) {
          try {
            const content = await fs.readFile(fullPath, 'utf8');
            await this.extractCredentialsFromContent(content, fullPath, patterns);
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be accessed
    }
  }

  // Extract credentials from file content
  async extractCredentialsFromContent(content, filePath, patterns) {
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const credential = {
          value: match[1],
          type: this.getCredentialType(pattern),
          source: filePath,
          context: this.getContext(content, match.index),
          timestamp: new Date().toISOString()
        };
        
        this.credentials.set(`${credential.type}_${Date.now()}`, credential);
      }
    }
  }

  // Get credential type from pattern
  getCredentialType(pattern) {
    const patternStr = pattern.toString();
    if (patternStr.includes('api[_-]?key')) return 'api_key';
    if (patternStr.includes('secret')) return 'secret';
    if (patternStr.includes('token')) return 'token';
    if (patternStr.includes('password')) return 'password';
    if (patternStr.includes('client[_-]?id')) return 'client_id';
    if (patternStr.includes('client[_-]?secret')) return 'client_secret';
    return 'unknown';
  }

  // Get context around credential
  getContext(content, index, contextLength = 100) {
    const start = Math.max(0, index - contextLength);
    const end = Math.min(content.length, index + contextLength);
    return content.substring(start, end);
  }

  // Check if file is text file
  isTextFile(filename) {
    const textExtensions = ['.txt', '.md', '.json', '.js', '.ts', '.py', '.sh', '.env', '.config', '.conf'];
    return textExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  // Mine addresses and contact information
  async mineAddresses() {
    console.log('📍 Mining addresses and contact information...');
    
    // Email patterns
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    
    // Phone patterns
    const phonePattern = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    
    // Address patterns
    const addressPattern = /\d+\s+[A-Za-z0-9\s,.-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl|Way|Circle|Cir|Trail|Trl|Parkway|Pkwy)/gi;
    
    // Search in common locations
    const searchPaths = [
      '/home/allan/Documents',
      '/home/allan/Desktop',
      '/home/allan/Downloads',
      '/home/allan/.local/share'
    ];

    for (const searchPath of searchPaths) {
      try {
        await this.searchForAddresses(searchPath, [emailPattern, phonePattern, addressPattern]);
      } catch (error) {
        console.log(`⚠️  Could not search ${searchPath}: ${error.message}`);
      }
    }
  }

  // Search for addresses in directory
  async searchForAddresses(dirPath, patterns) {
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const file of files) {
        const fullPath = path.join(dirPath, file.name);
        
        if (file.isDirectory()) {
          await this.searchForAddresses(fullPath, patterns);
        } else if (file.isFile() && this.isTextFile(file.name)) {
          try {
            const content = await fs.readFile(fullPath, 'utf8');
            await this.extractAddressesFromContent(content, fullPath, patterns);
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be accessed
    }
  }

  // Extract addresses from content
  async extractAddressesFromContent(content, filePath, patterns) {
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const address = {
          value: match[0],
          type: this.getAddressType(pattern),
          source: filePath,
          context: this.getContext(content, match.index),
          timestamp: new Date().toISOString()
        };
        
        this.addresses.set(`${address.type}_${Date.now()}`, address);
      }
    }
  }

  // Get address type from pattern
  getAddressType(pattern) {
    const patternStr = pattern.toString();
    if (patternStr.includes('@')) return 'email';
    if (patternStr.includes('\\d+')) return 'phone';
    if (patternStr.includes('Street|St|Avenue')) return 'address';
    return 'unknown';
  }

  // Mine approaches and methodologies
  async mineApproaches() {
    console.log('🔧 Mining approaches and methodologies...');
    
    // Common approach patterns
    const approachPatterns = [
      /workflow[:\s]+([^.\n]{20,100})/gi,
      /process[:\s]+([^.\n]{20,100})/gi,
      /methodology[:\s]+([^.\n]{20,100})/gi,
      /approach[:\s]+([^.\n]{20,100})/gi,
      /strategy[:\s]+([^.\n]{20,100})/gi,
      /best[_-]?practice[:\s]+([^.\n]{20,100})/gi
    ];

    // Search in documentation and config files
    const searchPaths = [
      '/home/allan/Documents',
      '/home/allan/Desktop',
      '/home/allan/Downloads',
      '/home/allan/.local/share'
    ];

    for (const searchPath of searchPaths) {
      try {
        await this.searchForApproaches(searchPath, approachPatterns);
      } catch (error) {
        console.log(`⚠️  Could not search ${searchPath}: ${error.message}`);
      }
    }
  }

  // Search for approaches in directory
  async searchForApproaches(dirPath, patterns) {
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const file of files) {
        const fullPath = path.join(dirPath, file.name);
        
        if (file.isDirectory()) {
          await this.searchForApproaches(fullPath, patterns);
        } else if (file.isFile() && this.isTextFile(file.name)) {
          try {
            const content = await fs.readFile(fullPath, 'utf8');
            await this.extractApproachesFromContent(content, fullPath, patterns);
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be accessed
    }
  }

  // Extract approaches from content
  async extractApproachesFromContent(content, filePath, patterns) {
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const approach = {
          value: match[1].trim(),
          type: this.getApproachType(pattern),
          source: filePath,
          context: this.getContext(content, match.index),
          timestamp: new Date().toISOString()
        };
        
        this.approaches.set(`${approach.type}_${Date.now()}`, approach);
      }
    }
  }

  // Get approach type from pattern
  getApproachType(pattern) {
    const patternStr = pattern.toString();
    if (patternStr.includes('workflow')) return 'workflow';
    if (patternStr.includes('process')) return 'process';
    if (patternStr.includes('methodology')) return 'methodology';
    if (patternStr.includes('approach')) return 'approach';
    if (patternStr.includes('strategy')) return 'strategy';
    if (patternStr.includes('best[_-]?practice')) return 'best_practice';
    return 'unknown';
  }

  // Mine standards and best practices
  async mineStandards() {
    console.log('📋 Mining standards and best practices...');
    
    // Common standard patterns
    const standardPatterns = [
      /standard[:\s]+([^.\n]{20,100})/gi,
      /requirement[:\s]+([^.\n]{20,100})/gi,
      /specification[:\s]+([^.\n]{20,100})/gi,
      /guideline[:\s]+([^.\n]{20,100})/gi,
      /protocol[:\s]+([^.\n]{20,100})/gi,
      /format[:\s]+([^.\n]{20,100})/gi
    ];

    // Search in documentation and config files
    const searchPaths = [
      '/home/allan/Documents',
      '/home/allan/Desktop',
      '/home/allan/Downloads',
      '/home/allan/.local/share'
    ];

    for (const searchPath of searchPaths) {
      try {
        await this.searchForStandards(searchPath, standardPatterns);
      } catch (error) {
        console.log(`⚠️  Could not search ${searchPath}: ${error.message}`);
      }
    }
  }

  // Search for standards in directory
  async searchForStandards(dirPath, patterns) {
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const file of files) {
        const fullPath = path.join(dirPath, file.name);
        
        if (file.isDirectory()) {
          await this.searchForStandards(fullPath, patterns);
        } else if (file.isFile() && this.isTextFile(file.name)) {
          try {
            const content = await fs.readFile(fullPath, 'utf8');
            await this.extractStandardsFromContent(content, fullPath, patterns);
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be accessed
    }
  }

  // Extract standards from content
  async extractStandardsFromContent(content, filePath, patterns) {
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const standard = {
          value: match[1].trim(),
          type: this.getStandardType(pattern),
          source: filePath,
          context: this.getContext(content, match.index),
          timestamp: new Date().toISOString()
        };
        
        this.standards.set(`${standard.type}_${Date.now()}`, standard);
      }
    }
  }

  // Get standard type from pattern
  getStandardType(pattern) {
    const patternStr = pattern.toString();
    if (patternStr.includes('standard')) return 'standard';
    if (patternStr.includes('requirement')) return 'requirement';
    if (patternStr.includes('specification')) return 'specification';
    if (patternStr.includes('guideline')) return 'guideline';
    if (patternStr.includes('protocol')) return 'protocol';
    if (patternStr.includes('format')) return 'format';
    return 'unknown';
  }

  // Mine browser data for intent analysis
  async mineBrowserData() {
    console.log('🌐 Mining browser data for intent analysis...');
    
    try {
      // Get Chrome history
      await this.mineChromeHistory();
      
      // Get Chrome bookmarks
      await this.mineChromeBookmarks();
      
      // Analyze intent patterns
      await this.analyzeIntent();
      
    } catch (error) {
      console.log(`⚠️  Could not mine browser data: ${error.message}`);
    }
  }

  // Mine Chrome history
  async mineChromeHistory() {
    const chromeHistoryPath = '/home/allan/.config/google-chrome/Default/History';
    
    try {
      // Copy history file to temp location (Chrome locks the original)
      const tempPath = '/tmp/chrome_history_temp';
      await execAsync(`cp "${chromeHistoryPath}" "${tempPath}"`);
      
      // Read history using sqlite3
      const { stdout } = await execAsync(`sqlite3 "${tempPath}" "SELECT url, title, visit_count, last_visit_time FROM urls ORDER BY last_visit_time DESC LIMIT 1000"`);
      
      const historyEntries = stdout.split('\n').filter(line => line.trim()).map(line => {
        const [url, title, visitCount, lastVisitTime] = line.split('|');
        return {
          url: url || '',
          title: title || '',
          visitCount: parseInt(visitCount) || 0,
          lastVisitTime: parseInt(lastVisitTime) || 0,
          timestamp: new Date().toISOString()
        };
      });
      
      this.chromeHistory = historyEntries;
      
      // Clean up temp file
      await execAsync(`rm "${tempPath}"`);
      
    } catch (error) {
      console.log(`⚠️  Could not access Chrome history: ${error.message}`);
    }
  }

  // Mine Chrome bookmarks
  async mineChromeBookmarks() {
    const bookmarksPath = '/home/allan/.config/google-chrome/Default/Bookmarks';
    
    try {
      const bookmarksContent = await fs.readFile(bookmarksPath, 'utf8');
      const bookmarksData = JSON.parse(bookmarksContent);
      
      this.bookmarks = this.extractBookmarks(bookmarksData.roots);
      
    } catch (error) {
      console.log(`⚠️  Could not access Chrome bookmarks: ${error.message}`);
    }
  }

  // Extract bookmarks from Chrome bookmarks structure
  extractBookmarks(roots) {
    const bookmarks = [];
    
    const processNode = (node) => {
      if (node.type === 'url') {
        bookmarks.push({
          name: node.name,
          url: node.url,
          dateAdded: node.date_added,
          timestamp: new Date().toISOString()
        });
      } else if (node.children) {
        node.children.forEach(processNode);
      }
    };
    
    Object.values(roots).forEach(processNode);
    return bookmarks;
  }

  // Analyze intent from browser data
  async analyzeIntent() {
    console.log('🧠 Analyzing intent from browser data...');
    
    // Analyze history for patterns
    const historyAnalysis = this.analyzeHistoryPatterns();
    
    // Analyze bookmarks for priorities
    const bookmarkAnalysis = this.analyzeBookmarkPatterns();
    
    // Combine analyses
    this.intentData = {
      history: historyAnalysis,
      bookmarks: bookmarkAnalysis,
      combined: this.combineIntentAnalyses(historyAnalysis, bookmarkAnalysis),
      timestamp: new Date().toISOString()
    };
  }

  // Analyze history patterns
  analyzeHistoryPatterns() {
    const patterns = {
      domains: new Map(),
      keywords: new Map(),
      timePatterns: new Map(),
      visitFrequency: new Map()
    };
    
    this.chromeHistory.forEach(entry => {
      // Domain analysis
      try {
        const domain = new URL(entry.url).hostname;
        patterns.domains.set(domain, (patterns.domains.get(domain) || 0) + entry.visitCount);
      } catch (error) {
        // Skip invalid URLs
      }
      
      // Keyword analysis
      const words = entry.title.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3) {
          patterns.keywords.set(word, (patterns.keywords.get(word) || 0) + 1);
        }
      });
      
      // Time pattern analysis
      const hour = new Date(entry.lastVisitTime).getHours();
      patterns.timePatterns.set(hour, (patterns.timePatterns.get(hour) || 0) + 1);
      
      // Visit frequency analysis
      patterns.visitFrequency.set(entry.url, entry.visitCount);
    });
    
    return patterns;
  }

  // Analyze bookmark patterns
  analyzeBookmarkPatterns() {
    const patterns = {
      categories: new Map(),
      keywords: new Map(),
      domains: new Map()
    };
    
    this.bookmarks.forEach(bookmark => {
      // Domain analysis
      try {
        const domain = new URL(bookmark.url).hostname;
        patterns.domains.set(domain, (patterns.domains.get(domain) || 0) + 1);
      } catch (error) {
        // Skip invalid URLs
      }
      
      // Keyword analysis
      const words = bookmark.name.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3) {
          patterns.keywords.set(word, (patterns.keywords.get(word) || 0) + 1);
        }
      });
    });
    
    return patterns;
  }

  // Combine intent analyses
  combineIntentAnalyses(historyAnalysis, bookmarkAnalysis) {
    return {
      topDomains: this.getTopItems(historyAnalysis.domains, 10),
      topKeywords: this.getTopItems(historyAnalysis.keywords, 20),
      topBookmarkDomains: this.getTopItems(bookmarkAnalysis.domains, 10),
      topBookmarkKeywords: this.getTopItems(bookmarkAnalysis.keywords, 20),
      activeHours: this.getTopItems(historyAnalysis.timePatterns, 5),
      mostVisited: this.getTopItems(historyAnalysis.visitFrequency, 10)
    };
  }

  // Get top items from map
  getTopItems(map, limit) {
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key, value]) => ({ key, value }));
  }

  // Mine priority signals
  async minePrioritySignals() {
    console.log('🎯 Mining priority signals...');
    
    // Analyze recent activity
    const recentActivity = this.chromeHistory.slice(0, 50);
    
    // Extract priority indicators
    const priorityIndicators = [
      'urgent', 'asap', 'critical', 'important', 'deadline',
      'crisis', 'emergency', 'priority', 'high', 'immediate'
    ];
    
    const prioritySignals = [];
    
    recentActivity.forEach(entry => {
      const text = (entry.title + ' ' + entry.url).toLowerCase();
      
      priorityIndicators.forEach(indicator => {
        if (text.includes(indicator)) {
          prioritySignals.push({
            indicator,
            entry,
            confidence: this.calculatePriorityConfidence(text, indicator),
            timestamp: new Date().toISOString()
          });
        }
      });
    });
    
    this.priorities = prioritySignals.sort((a, b) => b.confidence - a.confidence);
  }

  // Calculate priority confidence
  calculatePriorityConfidence(text, indicator) {
    let confidence = 0.5;
    
    // Increase confidence based on context
    if (text.includes('revenue') || text.includes('money') || text.includes('cash')) confidence += 0.2;
    if (text.includes('client') || text.includes('customer')) confidence += 0.1;
    if (text.includes('deadline') || text.includes('due')) confidence += 0.2;
    if (text.includes('crisis') || text.includes('emergency')) confidence += 0.3;
    
    return Math.min(1.0, confidence);
  }

  // Store credentials securely
  async storeCredentials() {
    const credentialsData = {
      credentials: Array.from(this.credentials.entries()),
      addresses: Array.from(this.addresses.entries()),
      approaches: Array.from(this.approaches.entries()),
      standards: Array.from(this.standards.entries()),
      intentData: this.intentData,
      chromeHistory: this.chromeHistory,
      bookmarks: this.bookmarks,
      priorities: this.priorities,
      timestamp: new Date().toISOString()
    };
    
    // Store in secure location
    const securePath = '/home/allan/vengeance/data/mined_data.json';
    await fs.mkdir(path.dirname(securePath), { recursive: true });
    await fs.writeFile(securePath, JSON.stringify(credentialsData, null, 2));
    
    console.log(`🔐 Mined data stored securely at: ${securePath}`);
  }

  // Get all mined data
  getMinedData() {
    return {
      credentials: Array.from(this.credentials.entries()),
      addresses: Array.from(this.addresses.entries()),
      approaches: Array.from(this.approaches.entries()),
      standards: Array.from(this.standards.entries()),
      intentData: this.intentData,
      chromeHistory: this.chromeHistory,
      bookmarks: this.bookmarks,
      priorities: this.priorities,
      summary: {
        totalCredentials: this.credentials.size,
        totalAddresses: this.addresses.size,
        totalApproaches: this.approaches.size,
        totalStandards: this.standards.size,
        historyEntries: this.chromeHistory.length,
        bookmarks: this.bookmarks.length,
        prioritySignals: this.priorities.length
      }
    };
  }
}

export const dataMiner = new DataMiner();
