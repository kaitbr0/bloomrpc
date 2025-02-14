import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';

console.log('Starting main process...');
console.log('Current directory:', __dirname);

// Add before creating the window
console.log('Creating window...');

function registerIpcHandlers() {
  console.log('Registering IPC handlers...');
  
  ipcMain.handle('open-file-dialog', async () => {
    console.log('Main: Handling open-file-dialog request');
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Protos', extensions: ['proto'] }
      ]
    });
    console.log('Main: Dialog result:', result);
    return result.filePaths;
  });
  
  ipcMain.handle('open-directory-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    return result.filePaths;
  });
  
  console.log('IPC handlers registered');
}

// Call it before creating window
registerIpcHandlers();

let mainWindow: BrowserWindow | null = null;

app.whenReady().then(async () => {
  try {
    console.log('App ready event fired');
    
    // Simplest possible preload script
    const preloadScript = `
      const { contextBridge } = require('electron');
      const Store = require('electron-store');
      
      // Expose store API through contextBridge
      contextBridge.exposeInMainWorld('electronAPI', {
        store: new Store(),
        getItem: (key) => new Store().get(key),
        setItem: (key, value) => new Store().set(key, value),
        deleteItem: (key) => new Store().delete(key)
      });
    `;
    
    // Write preload script to temp file
    const fs = require('fs');
    const preloadPath = path.join(__dirname, 'preload.js');
    fs.writeFileSync(preloadPath, preloadScript);
    
    mainWindow = new BrowserWindow({
      show: false,
      width: 1024,
      height: 728,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false,
        devTools: true,
        preload: preloadPath
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('Loading development URL');
      await mainWindow.loadURL('http://localhost:1213/app.html');
    } else {
      mainWindow.loadURL(`file://${__dirname}/app.html`);
    }

    mainWindow.webContents.openDevTools();
    mainWindow.show();

  } catch (error) {
    console.error('Failed to initialize app:', error);
    app.quit();
  }
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
}); 
