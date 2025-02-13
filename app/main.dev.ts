import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';

console.log('Starting main process...');
console.log('Current directory:', __dirname);

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

app.on('ready', async () => {
  console.log('App ready event fired');
  
  // Create preload script content directly
  const preloadScript = `
    const { ipcRenderer } = require('electron');
    const Store = require('electron-store');
    
    process.listenerCount = () => 0;
    
    const store = new Store({ name: 'editor-store' });
    window.electronStore = store;
  `;
  
  // Write it to a temp file
  const fs = require('fs');
  const preloadPath = path.join(__dirname, 'preload-temp.js');
  fs.writeFileSync(preloadPath, preloadScript);
  
  console.log('Preload path:', preloadPath);
  
  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      devTools: true,
      // preload: preloadPath
    }
  });

  // Open DevTools
  mainWindow.webContents.openDevTools();

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('Loading development URL');
    await mainWindow.loadURL('http://localhost:1213/app.html');
  } else {
    mainWindow.loadURL(`file://${__dirname}/app.html`);
  }
}); 
