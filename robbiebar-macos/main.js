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
    const response = await axios.get('http://aurora.testpilot.ai/api/personality/status');
    return response.data;
  } catch (error) {
    console.error('Error fetching personality status:', error);
    return { error: 'Failed to fetch status' };
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

// Update personality status every minute
setInterval(async () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      const response = await axios.get('http://aurora.testpilot.ai/api/personality/status');
      mainWindow.webContents.send('personality-update', response.data);
    } catch (error) {
      console.error('Auto-update error:', error);
    }
  }
}, 60000); // 60 seconds

