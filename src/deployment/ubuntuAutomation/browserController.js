// Robbie Browser Controller for Ubuntu OS Integration
// Handles web browsing, credential entry, and page understanding
// Uses Playwright for robust browser automation with stealth capabilities

import { chromium, firefox } from 'playwright';
import fs from 'fs/promises';

class BrowserController {
  constructor(credentialManager) {
    this.credentialManager = credentialManager;
    this.activeBrowsers = new Map();
    this.currentContext = null;
    this.currentPage = null;
    
    // Stealth configuration for natural browsing
    this.launchOptions = {
      headless: false, // Visible browser for user oversight
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--disable-web-security',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection'
      ]
    };
  }

  // Launch browser and navigate to URL
  async navigate(url, options = {}) {
    console.log(`🌐 Robbie Browser: Navigating to ${url}`);
    
    try {
      // Launch browser if not already active
      if (!this.currentContext) {
        await this.launchBrowser(options.browserType || 'chromium');
      }
      
      // Create new page
      this.currentPage = await this.currentContext.newPage();
      
      // Navigate to URL
      await this.currentPage.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // Understand the page content
      const pageAnalysis = await this.analyzePage();
      
      return {
        success: true,
        url: url,
        title: await this.currentPage.title(),
        analysis: pageAnalysis,
        message: `Successfully navigated to ${url}`
      };
      
    } catch (error) {
      console.error(`❌ Navigation failed: ${error.message}`);
      throw error;
    }
  }

  // Launch browser with stealth configuration
  async launchBrowser(browserType = 'chromium') {
    console.log(`🚀 Launching ${browserType} browser...`);
    
    const browser = browserType === 'firefox' 
      ? await firefox.launch(this.launchOptions)
      : await chromium.launch(this.launchOptions);
    
    this.currentContext = await browser.newContext({
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US'
    });
    
    // Track browser for cleanup
    const browserId = Date.now().toString();
    this.activeBrowsers.set(browserId, browser);
    
    return browserId;
  }

  // Analyze current page content and structure
  async analyzePage() {
    if (!this.currentPage) {
      throw new Error('No active page to analyze');
    }
    
    try {
      const analysis = {
        title: await this.currentPage.title(),
        url: this.currentPage.url(),
        forms: await this.identifyForms(),
        buttons: await this.identifyButtons(),
        loginElements: await this.identifyLoginElements(),
        downloadLinks: await this.identifyDownloadLinks(),
        pageType: await this.determinePageType()
      };
      
      console.log(`📊 Page Analysis: ${analysis.pageType} with ${analysis.forms.length} forms, ${analysis.buttons.length} buttons`);
      
      return analysis;
      
    } catch (error) {
      console.error(`❌ Page analysis failed: ${error.message}`);
      return { error: error.message };
    }
  }

  // Identify forms on the page
  async identifyForms() {
    const forms = await this.currentPage.$$eval('form', forms => 
      forms.map(form => ({
        action: form.action,
        method: form.method,
        id: form.id,
        name: form.name,
        inputs: Array.from(form.querySelectorAll('input')).map(input => ({
          type: input.type,
          name: input.name,
          placeholder: input.placeholder,
          required: input.required
        }))
      }))
    );
    
    return forms;
  }

  // Identify interactive buttons
  async identifyButtons() {
    const buttons = await this.currentPage.$$eval('button, input[type="button"], input[type="submit"]', buttons =>
      buttons.map(btn => ({
        text: btn.textContent || btn.value,
        type: btn.type,
        id: btn.id,
        className: btn.className
      }))
    );
    
    return buttons;
  }

  // Identify login-related elements
  async identifyLoginElements() {
    const selectors = [
      'input[type="email"]',
      'input[type="password"]', 
      'input[name*="user"]',
      'input[name*="login"]',
      'input[name*="email"]',
      'button[type="submit"]'
    ];
    
    const elements = {};
    
    for (const selector of selectors) {
      try {
        const element = await this.currentPage.$(selector);
        if (element) {
          elements[selector] = {
            visible: await element.isVisible(),
            placeholder: await element.getAttribute('placeholder'),
            name: await element.getAttribute('name')
          };
        }
      } catch (error) {
        // Element not found, continue
      }
    }
    
    return elements;
  }

  // Identify download links
  async identifyDownloadLinks() {
    const downloadLinks = await this.currentPage.$$eval('a[href*="download"], a[href$=".pdf"], a[href$=".doc"], a[href$=".xlsx"]', links =>
      links.map(link => ({
        text: link.textContent,
        href: link.href,
        filename: link.href.split('/').pop()
      }))
    );
    
    return downloadLinks;
  }

  // Determine page type for context
  async determinePageType() {
    const url = this.currentPage.url();
    const title = await this.currentPage.title();
    
    if (url.includes('login') || title.toLowerCase().includes('login')) {
      return 'login_page';
    }
    
    if (url.includes('dashboard') || title.toLowerCase().includes('dashboard')) {
      return 'dashboard';
    }
    
    if (url.includes('download') || await this.currentPage.$('a[href*="download"]')) {
      return 'download_page';
    }
    
    return 'general_page';
  }

  // Enter credentials (requires approval via GATEKEEPER)
  async useCredentials(site) {
    if (!this.currentPage) {
      throw new Error('No active page for credential entry');
    }
    
    console.log(`🔐 Entering credentials for ${site}`);
    
    try {
      // Get credentials from secure storage
      const credentials = await this.credentialManager.getCredentials(site);
      
      if (!credentials) {
        throw new Error(`No stored credentials found for ${site}`);
      }
      
      // Find and fill email/username field
      const emailSelectors = [
        'input[type="email"]',
        'input[name*="email"]',
        'input[name*="user"]',
        'input[name*="login"]'
      ];
      
      let emailFilled = false;
      for (const selector of emailSelectors) {
        try {
          const element = await this.currentPage.$(selector);
          if (element && await element.isVisible()) {
            await element.fill(credentials.email || credentials.username);
            emailFilled = true;
            console.log(`✅ Filled email/username field`);
            break;
          }
        } catch (error) {
          continue;
        }
      }
      
      if (!emailFilled) {
        throw new Error('Could not find email/username field');
      }
      
      // Find and fill password field
      const passwordElement = await this.currentPage.$('input[type="password"]');
      if (passwordElement && await passwordElement.isVisible()) {
        await passwordElement.fill(credentials.password);
        console.log(`✅ Filled password field`);
      } else {
        throw new Error('Could not find password field');
      }
      
      // Look for submit button
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Login")',
        'button:has-text("Sign in")'
      ];
      
      for (const selector of submitSelectors) {
        try {
          const element = await this.currentPage.$(selector);
          if (element && await element.isVisible()) {
            await element.click();
            console.log(`✅ Clicked login button`);
            break;
          }
        } catch (error) {
          continue;
        }
      }
      
      // Wait for navigation or success indicators
      await this.currentPage.waitForLoadState('networkidle', { timeout: 10000 });
      
      return {
        success: true,
        site: site,
        message: `Successfully logged into ${site}`
      };
      
    } catch (error) {
      console.error(`❌ Credential entry failed: ${error.message}`);
      throw error;
    }
  }

  // Download file from current page
  async download(filename) {
    if (!this.currentPage) {
      throw new Error('No active page for download');
    }
    
    console.log(`📥 Downloading ${filename}...`);
    
    try {
      // Set up download handling
      const downloadPromise = this.currentPage.waitForEvent('download');
      
      // Find and click download link
      const downloadSelectors = [
        `a[href*="${filename}"]`,
        `a:has-text("${filename}")`,
        'a[href*="download"]',
        'button:has-text("Download")'
      ];
      
      let downloadTriggered = false;
      for (const selector of downloadSelectors) {
        try {
          const element = await this.currentPage.$(selector);
          if (element && await element.isVisible()) {
            await element.click();
            downloadTriggered = true;
            console.log(`✅ Triggered download via ${selector}`);
            break;
          }
        } catch (error) {
          continue;
        }
      }
      
      if (!downloadTriggered) {
        throw new Error(`Could not find download link for ${filename}`);
      }
      
      // Wait for download and save
      const download = await downloadPromise;
      const downloadPath = `${process.env.HOME}/Downloads/${download.suggestedFilename()}`;
      await download.saveAs(downloadPath);
      
      return {
        success: true,
        filename: download.suggestedFilename(),
        path: downloadPath,
        message: `Downloaded ${download.suggestedFilename()} to Downloads folder`
      };
      
    } catch (error) {
      console.error(`❌ Download failed: ${error.message}`);
      throw error;
    }
  }

  // Get page content for understanding context
  async getPageContent() {
    if (!this.currentPage) {
      return null;
    }
    
    try {
      const content = {
        title: await this.currentPage.title(),
        url: this.currentPage.url(),
        text: await this.currentPage.$eval('body', body => body.innerText),
        html: await this.currentPage.content(),
        screenshot: await this.currentPage.screenshot({ 
          type: 'png', 
          fullPage: false // Just viewport
        })
      };
      
      return content;
      
    } catch (error) {
      console.error(`❌ Failed to get page content: ${error.message}`);
      return null;
    }
  }

  // Close browser and cleanup
  async close() {
    console.log('🔄 Closing browser and cleaning up...');
    
    if (this.currentPage) {
      await this.currentPage.close();
      this.currentPage = null;
    }
    
    if (this.currentContext) {
      await this.currentContext.close();
      this.currentContext = null;
    }
    
    // Close all tracked browsers
    for (const [id, browser] of this.activeBrowsers) {
      try {
        await browser.close();
        console.log(`✅ Closed browser ${id}`);
      } catch (error) {
        console.error(`Failed to close browser ${id}: ${error.message}`);
      }
    }
    
    this.activeBrowsers.clear();
  }
}

export default BrowserController;
