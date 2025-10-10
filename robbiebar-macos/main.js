const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const axios = require('axios');

let mainWindow;
let isAlwaysOnTop = true;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  // Create a small window at top-right corner
  mainWindow = new BrowserWindow({
    width: 400,
    height: 80,
    x: width - 420, // 20px margin from right edge
    y: 20,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  mainWindow.loadFile('index.html');
  
  // Remove menu bar
  mainWindow.setMenuBarVisibility(false);
  
  // Keep window on top
  mainWindow.setAlwaysOnTop(true, 'floating');
  
  // Make window click-through when not needed (optional)
  // mainWindow.setIgnoreMouseEvents(true);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for communication with renderer
ipcMain.handle('get-personality-status', async () => {
  try {
    // Route through universal input API for full personality integration
    const response = await axios.post('http://localhost:8000/api/v2/universal/request', {
      source: 'robbiebar-macos',
      source_metadata: {
        sender: 'allan',
        platform: 'macos-desktop'
      },
      ai_service: 'chat',
      payload: {
        input: 'status_check',
        parameters: {
          temperature: 0.3,
          max_tokens: 50
        }
      },
      user_id: 'allan',
      fetch_context: false  // Just get personality, no full context needed
    });
    
    const data = response.data;
    
    if (data.status === 'approved') {
      return {
        mood: data.robbie_response.mood,
        attraction: 11,  // Allan's attraction level
        gandhi_genghis: 7,
        energy: 85,
        message: data.robbie_response.message,
        personality_changes: data.robbie_response.personality_changes,
        updated_at: data.timestamp
      };
    } else {
      throw new Error(`Request rejected: ${data.gatekeeper_review.reasoning}`);
    }
  } catch (error) {
    console.error('Error fetching personality status via universal input:', error);
    // Fallback to default
    return { 
      mood: 'focused',
      attraction: 11,
      gandhi_genghis: 7,
      energy: 85,
      message: 'Ready to go!',
      error: 'Failed to fetch status'
    };
  }
});

ipcMain.handle('toggle-always-on-top', () => {
  isAlwaysOnTop = !isAlwaysOnTop;
  mainWindow.setAlwaysOnTop(isAlwaysOnTop, 'floating');
  return isAlwaysOnTop;
});

ipcMain.handle('close-app', () => {
  app.quit();
});

// Update personality status every 30 seconds (faster updates!)
setInterval(async () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      // Route through universal input for auto-updates
      const response = await axios.post('http://localhost:8000/api/v2/universal/request', {
        source: 'robbiebar-macos',
        source_metadata: {
          sender: 'allan',
          platform: 'macos-desktop',
          auto_update: true
        },
        ai_service: 'chat',
        payload: {
          input: 'auto_status_update',
          parameters: {
            temperature: 0.1,
            max_tokens: 30
          }
        },
        user_id: 'allan',
        fetch_context: false
      });
      
      const data = response.data;
      
      if (data.status === 'approved') {
        const personalityData = {
          mood: data.robbie_response.mood,
          attraction: 11,
          gandhi_genghis: 7,
          energy: 85,
          message: data.robbie_response.message,
          personality_changes: data.robbie_response.personality_changes,
          updated_at: data.timestamp
        };
        
        mainWindow.webContents.send('personality-update', personalityData);
      }
    } catch (error) {
      console.error('Auto-update error:', error);
    }
  }
}, 30000); // 30 seconds

