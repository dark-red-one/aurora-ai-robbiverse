# Testing Documentation

## Overview

This directory contains comprehensive testing suites for the RobbieBar Cursor extension and related components.

## Directory Structure

```
tests/
├── browser/                           # Browser automation tests
│   ├── cursor-extension-test.js      # Main Playwright test suite
│   ├── run-cursor-tests.sh           # Automated test runner
│   ├── test-results/                 # Screenshots and test artifacts
│   ├── test-report.txt               # Generated test report
│   └── final-test-report.txt         # Final comprehensive report
└── README.md                         # This documentation
```

## Quick Start

### Run All Tests
```bash
./tests/browser/run-cursor-tests.sh
```

### Manual Testing
```bash
# Start test server
cd cursor-robbiebar-webview && python3 serve-test.py

# Use Playwright browser tools in Cursor to test
```

## Test Coverage

### Automated Tests
- ✅ Extension package verification
- ✅ API connectivity (Universal Input API)
- ✅ RobbieBlocks CMS integration
- ✅ BlockRenderer class loading
- ✅ Component rendering verification
- ✅ Screenshot capture for documentation

### Manual Testing Checklist
- [ ] Extension activates in Cursor sidebar
- [ ] All 8 components render correctly
- [ ] API connection to localhost:8000 works
- [ ] Personality system responds (attraction 11)
- [ ] System stats update every 2 seconds
- [ ] Chat interface connects to Universal Input API
- [ ] File navigator shows current workspace
- [ ] App links open correctly
- [ ] No console errors

## Components Tested

### RobbieBar Extension Components (8 total)
1. **robbie-avatar-header** - Avatar with personality sliders
2. **app-links-nav** - Links to @Work, @Code, @Play apps
3. **system-stats-monitor** - CPU/Memory usage with real-time updates
4. **ai-chat-interface** - Chat with Universal Input API integration
5. **file-navigator-git** - File tree with git status
6. **tv-livestream-embed** - CNN livestream embed
7. **lofi-beats-player** - Music player with controls
8. **sticky-notes-widget** - Notes with surface/submerge functionality

## API Integration Tests

### Universal Input API
- Health check: `GET http://localhost:8000/health`
- Personality request: `POST http://localhost:8000/api/v2/universal/request`
- Personality state management
- Mood changes and attraction levels

### RobbieBlocks CMS
- Page definition: `GET http://localhost:8000/api/robbieblocks/page/cursor-sidebar-main?node=vengeance-local`
- Component definitions
- Branding configuration (Vengeance Gaming Rig)
- Dynamic content loading

## Browser Testing Tools

### Available in Cursor
When developing or debugging frontend code, use these Playwright tools:

1. `mcp_cursor-playwright_browser_navigate` - Navigate to pages
2. `mcp_cursor-playwright_browser_take_screenshot` - Take screenshots
3. `mcp_cursor-playwright_browser_snapshot` - Get page snapshot
4. `mcp_cursor-playwright_browser_click` - Click elements
5. `mcp_cursor-playwright_browser_console_messages` - Check console
6. `mcp_cursor-playwright_browser_network_requests` - Network requests
7. `mcp_cursor-playwright_browser_evaluate` - Evaluate JavaScript

## Test Results

### Screenshots
All test screenshots are saved to `tests/browser/test-results/`:
- `01-initial-load.png` - Initial page load
- `02-page-loaded.png` - Page definition loaded
- `03-renderer-loaded.png` - BlockRenderer loaded
- `04-full-render.png` - Full sidebar rendered
- `error-screenshot.png` - Error state (if any)

### Reports
- `test-report.txt` - Basic test results
- `final-test-report.txt` - Comprehensive test summary

## Troubleshooting

### Common Issues
1. **API not responding**: Check if Universal Input API is running
2. **Components not loading**: Verify BlockRenderer class loads correctly
3. **Extension not visible**: Restart Cursor after installation
4. **Console errors**: Check browser console for JavaScript errors

### Debug Commands
```bash
# Check API status
curl http://localhost:8000/health

# Check CMS
curl "http://localhost:8000/api/robbieblocks/page/cursor-sidebar-main?node=vengeance-local"

# Check extension installation
cursor --list-extensions | grep robbiebar
```

## Best Practices

1. **Always test before committing**: Run browser tests before pushing changes
2. **Take screenshots**: Document visual changes with screenshots
3. **Check console logs**: Look for JavaScript errors or warnings
4. **Test on different pages**: Verify components work in different contexts
5. **Verify API integration**: Ensure all API calls succeed
6. **Test personality system**: Verify attraction levels and mood changes work correctly

## Extension Installation

### Install in Cursor
```bash
cd cursor-robbiebar-webview
cursor --install-extension robbiebar-webview-3.0.0.vsix
```

### Verify Installation
1. Restart Cursor
2. Look for RobbieBar icon in activity bar (heart icon)
3. Click icon to open sidebar
4. Verify all components render correctly

## Development Workflow

1. **Make changes** to extension code
2. **Run tests** with `./tests/browser/run-cursor-tests.sh`
3. **Check screenshots** in `test-results/` directory
4. **Test manually** using browser tools in Cursor
5. **Verify extension** works in actual Cursor environment
6. **Commit changes** with test results

## Integration with Cursor Rules

Testing guidelines are integrated into Cursor development rules:
- `.cursor/rules/browser-testing-guidelines.mdc` - Comprehensive testing guide
- `.cursor/rules/robbie-cursor-personality.mdc` - Updated with testing standards

See these files for detailed testing procedures and quality standards.
