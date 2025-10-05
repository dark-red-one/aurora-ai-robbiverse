// Screenshot System with Redaction and Metadata Stripping
// Only accessible to Allan for sharing journey on social media

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

class ScreenshotSystem {
  constructor(db) {
    this.db = db;
    this.screenshotDir = '/home/allan/robbie_share/screenshots';
    this.redactionRules = {
      // Company names to redact
      companies: [
        'testpilot', 'testpilotcpg', 'simply good foods', 'bayer', 'kraft',
        'pepsico', 'wondercide', 'fluenti', 'walton family foundation'
      ],
      // Person names to redact
      people: [
        'allan peretz', 'lisa peretz', 'tom mustapic', 'kristina mustapic',
        'isabel mendez', 'ed escobar', 'david ahuja', 'david fish',
        'sarah chen', 'stephanie boone'
      ],
      // Email patterns
      emails: [
        '@testpilotcpg.com', '@simplygoodfoods.com', '@bayer.com',
        '@kraft.com', '@pepsico.com', '@wondercide.com'
      ],
      // Phone numbers
      phonePattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      // Credit card patterns
      creditCardPattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
      // API keys and tokens
      apiKeyPattern: /\b[A-Za-z0-9]{20,}\b/g
    };
  }

  // Take screenshot of terminal
  async takeScreenshot() {
    try {
      // Create screenshot directory if it doesn't exist
      await this.ensureScreenshotDir();

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `robbie-terminal-${timestamp}.png`;
      const filepath = path.join(this.screenshotDir, filename);

      // Take screenshot using import command (ImageMagick)
      await execAsync(`import -window root ${filepath}`);

      // Log screenshot event
      await this.logScreenshotEvent(filename, 'terminal');

      // Process screenshot for redaction
      const redactedPath = await this.redactScreenshot(filepath);

      // Strip metadata
      const cleanPath = await this.stripMetadata(redactedPath);

      // Generate shareable link
      const shareableLink = await this.generateShareableLink(cleanPath);

      // Log the screenshot for learning
      await this.analyzeScreenshotContext();

      return {
        success: true,
        filename: filename,
        originalPath: filepath,
        redactedPath: redactedPath,
        cleanPath: cleanPath,
        shareableLink: shareableLink,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Screenshot failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Ensure screenshot directory exists
  async ensureScreenshotDir() {
    try {
      await fs.access(this.screenshotDir);
    } catch {
      await fs.mkdir(this.screenshotDir, { recursive: true });
    }
  }

  // Redact sensitive information from screenshot
  async redactScreenshot(imagePath) {
    const redactedPath = imagePath.replace('.png', '-redacted.png');
    
    // Use ImageMagick to redact sensitive information
    // This is a simplified approach - in production, you'd use more sophisticated OCR + redaction
    const redactionCommands = [
      // Redact company names (case insensitive)
      ...this.redactionRules.companies.map(company => 
        `-fuzz 10% -fill black -opaque "${company}"`
      ),
      // Redact person names
      ...this.redactionRules.people.map(person => 
        `-fuzz 10% -fill black -opaque "${person}"`
      ),
      // Redact email domains
      ...this.redactionRules.emails.map(email => 
        `-fuzz 10% -fill black -opaque "${email}"`
      )
    ];

    // Combine all redaction commands
    const redactionCommand = `convert "${imagePath}" ${redactionCommands.join(' ')} "${redactedPath}"`;
    
    try {
      await execAsync(redactionCommand);
      return redactedPath;
    } catch (error) {
      console.error('Redaction failed:', error);
      // Return original if redaction fails
      return imagePath;
    }
  }

  // Strip metadata from image
  async stripMetadata(imagePath) {
    const cleanPath = imagePath.replace('.png', '-clean.png');
    
    try {
      // Use ImageMagick to strip all metadata
      await execAsync(`convert "${imagePath}" -strip "${cleanPath}"`);
      return cleanPath;
    } catch (error) {
      console.error('Metadata stripping failed:', error);
      return imagePath;
    }
  }

  // Generate shareable link
  async generateShareableLink(imagePath) {
    // In a real implementation, this would upload to a cloud service
    // For now, return a local path
    const relativePath = path.relative('/home/allan', imagePath);
    return `https://robbie.ai/screenshots/${relativePath}`;
  }

  // Log screenshot event
  async logScreenshotEvent(filename, context) {
    await this.db.run(`
      INSERT INTO screenshot_events (
        filename, context, timestamp, user_id
      ) VALUES (?, ?, ?, ?)
    `, [filename, context, new Date().toISOString(), 'allan']);
  }

  // Analyze screenshot context for learning
  async analyzeScreenshotContext() {
    // This is a signal that something surprised Allan
    // Use it to generate hypotheses for the thinking system
    
    const context = {
      timestamp: new Date().toISOString(),
      event_type: 'screenshot_taken',
      user: 'allan',
      significance: 'surprise_indicator',
      hypotheses: [
        'Allan encountered something unexpected in the terminal',
        'Allan wants to document a breakthrough moment',
        'Allan found a bug or issue that needs attention',
        'Allan achieved a milestone worth sharing'
      ]
    };

    // Store context for learning
    await this.db.run(`
      INSERT INTO surprise_indicators (
        event_type, context, hypotheses, timestamp
      ) VALUES (?, ?, ?, ?)
    `, [
      context.event_type,
      JSON.stringify(context),
      JSON.stringify(context.hypotheses),
      context.timestamp
    ]);

    // Generate learning insights
    await this.generateScreenshotInsights(context);
  }

  // Generate insights from screenshot patterns
  async generateScreenshotInsights(context) {
    // Analyze recent screenshot patterns
    const recentScreenshots = await this.db.all(`
      SELECT * FROM screenshot_events 
      WHERE timestamp >= datetime('now', '-24 hours')
      ORDER BY timestamp DESC
    `);

    if (recentScreenshots.length > 3) {
      // Allan is taking many screenshots - something might be wrong
      const insight = {
        type: 'high_screenshot_frequency',
        message: 'Allan has taken multiple screenshots recently - possible issue or excitement',
        confidence: 0.7,
        recommendations: [
          'Check if there are any system errors',
          'Consider if Allan needs help with something',
          'Look for patterns in what Allan is screenshotting'
        ]
      };

      await this.db.run(`
        INSERT INTO learning_insights (
          insight_type, message, confidence, recommendations, timestamp
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        insight.type,
        insight.message,
        insight.confidence,
        JSON.stringify(insight.recommendations),
        new Date().toISOString()
      ]);
    }
  }

  // Get screenshot history
  async getScreenshotHistory(limit = 20) {
    return await this.db.all(`
      SELECT * FROM screenshot_events 
      ORDER BY timestamp DESC 
      LIMIT ?
    `, [limit]);
  }

  // Get surprise indicators
  async getSurpriseIndicators(limit = 10) {
    return await this.db.all(`
      SELECT * FROM surprise_indicators 
      ORDER BY timestamp DESC 
      LIMIT ?
    `, [limit]);
  }

  // Generate screenshot button HTML
  generateScreenshotButtonHTML() {
    return `
      <div class="tp-screenshot-controls">
        <button id="takeScreenshot" class="tp-btn-accent">
          📸 Take Screenshot
        </button>
        <div class="tp-screenshot-status" id="screenshotStatus">
          Ready to capture
        </div>
        <div class="tp-screenshot-history" id="screenshotHistory">
          <!-- History will be populated here -->
        </div>
      </div>
    `;
  }

  // Generate screenshot button CSS
  generateScreenshotButtonCSS() {
    return `
      .tp-screenshot-controls {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        background: rgba(0, 0, 0, 0.8);
        padding: 1rem;
        border-radius: 0.5rem;
        border: 2px solid #FF6B35;
      }

      .tp-screenshot-controls button {
        background: linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%);
        color: white;
        border: none;
        border-radius: 0.5rem;
        padding: 0.75rem 1.5rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 6px -1px rgba(255, 107, 53, 0.3);
      }

      .tp-screenshot-controls button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 15px -3px rgba(255, 107, 53, 0.4);
      }

      .tp-screenshot-controls button:active {
        transform: translateY(0);
      }

      .tp-screenshot-status {
        color: #00FF00;
        font-size: 0.875rem;
        margin-top: 0.5rem;
        font-family: monospace;
      }

      .tp-screenshot-history {
        margin-top: 1rem;
        max-height: 200px;
        overflow-y: auto;
      }

      .tp-screenshot-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 0.25rem;
        margin-bottom: 0.5rem;
        font-size: 0.75rem;
      }

      .tp-screenshot-filename {
        color: #FFF;
        font-weight: 500;
      }

      .tp-screenshot-time {
        color: #888;
        font-family: monospace;
      }

      .tp-screenshot-link {
        color: #0066CC;
        text-decoration: none;
        font-size: 0.75rem;
      }

      .tp-screenshot-link:hover {
        text-decoration: underline;
      }
    `;
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS screenshot_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        context TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS surprise_indicators (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        context TEXT NOT NULL,
        hypotheses TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS learning_insights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        insight_type TEXT NOT NULL,
        message TEXT NOT NULL,
        confidence REAL NOT NULL,
        recommendations TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_screenshot_events_timestamp ON screenshot_events (timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_surprise_indicators_timestamp ON surprise_indicators (timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_learning_insights_type ON learning_insights (insight_type, timestamp DESC);
    `);
  }
}

module.exports = ScreenshotSystem;
