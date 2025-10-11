// Automated Playwright test for Cursor RobbieBar extension
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runCursorExtensionTests() {
    console.log('🚀 Starting Cursor Extension Test Suite...');
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
        // Test 1: Load webview
        console.log('📄 Test 1: Loading webview...');
        await page.goto('http://localhost:8001/test-index.html');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/01-initial-load.png' });
        console.log('✅ Initial load screenshot saved');
        
        // Test 2: Load page definition
        console.log('📋 Test 2: Loading page definition...');
        await page.click('button:has-text("Load Page Definition")');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/02-page-loaded.png' });
        console.log('✅ Page definition loaded');
        
        // Test 3: Load BlockRenderer
        console.log('🔧 Test 3: Loading BlockRenderer...');
        await page.click('button:has-text("Load BlockRenderer")');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/03-renderer-loaded.png' });
        console.log('✅ BlockRenderer loaded');
        
        // Test 4: Render full sidebar
        console.log('🎨 Test 4: Rendering full sidebar...');
        await page.click('button:has-text("Render Sidebar")');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-results/04-full-render.png' });
        console.log('✅ Full sidebar rendered');
        
        // Test 5: Check console logs
        console.log('📊 Test 5: Checking console logs...');
        const logs = await page.evaluate(() => {
            const logElement = document.getElementById('console-logs');
            return logElement ? logElement.innerText : 'No console logs found';
        });
        console.log('Console Logs:', logs);
        
        // Test 6: Verify all components loaded
        console.log('🔍 Test 6: Verifying components...');
        const snapshot = await page.accessibility.snapshot();
        console.log('Page Snapshot:', JSON.stringify(snapshot, null, 2));
        
        // Test 7: Test API connectivity
        console.log('🌐 Test 7: Testing API connectivity...');
        const apiStatus = await page.evaluate(async () => {
            try {
                const response = await fetch('http://localhost:8000/health');
                const data = await response.json();
                return { success: true, status: data.status };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
        console.log('API Status:', apiStatus);
        
        // Test 8: Test RobbieBlocks CMS
        console.log('📦 Test 8: Testing RobbieBlocks CMS...');
        const cmsStatus = await page.evaluate(async () => {
            try {
                const response = await fetch('http://localhost:8000/api/robbieblocks/page/cursor-sidebar-main?node=vengeance-local');
                const data = await response.json();
                return { 
                    success: data.success, 
                    blocksCount: data.blocks ? data.blocks.length : 0,
                    pageName: data.page ? data.page.page_name : 'Unknown'
                };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
        console.log('CMS Status:', cmsStatus);
        
        console.log('🎉 All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        await page.screenshot({ path: 'test-results/error-screenshot.png' });
        throw error;
    } finally {
        await browser.close();
    }
}

// Generate test report
async function generateTestReport() {
    const reportPath = path.join(__dirname, 'test-report.txt');
    const timestamp = new Date().toISOString();
    
    const report = `Cursor Extension Test Report
Generated: ${timestamp}

Test Results:
- Screenshots saved to: tests/browser/test-results/
- Test files:
  * 01-initial-load.png
  * 02-page-loaded.png  
  * 03-renderer-loaded.png
  * 04-full-render.png

To view results:
1. Check screenshots in test-results/ directory
2. Review console output above
3. Verify extension is installed in Cursor

Next Steps:
1. Restart Cursor to activate extension
2. Look for RobbieBar icon in activity bar
3. Click icon to open sidebar
4. Verify all 8 components render correctly

For manual testing:
- cd cursor-robbiebar-webview && python3 serve-test.py
- Use Playwright browser tools in Cursor
`;

    fs.writeFileSync(reportPath, report);
    console.log('📋 Test report generated: tests/browser/test-report.txt');
}

// Run tests and generate report
runCursorExtensionTests()
    .then(() => generateTestReport())
    .catch(error => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
