'use strict';

const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

// In development: app.isPackaged === false (electron run directly)
// In production:  app.isPackaged === true  (built by electron-builder)
const isDev = !app.isPackaged;

let mainWindow = null;
let backendProcess = null;
let backendStartedByApp = false;
let backendState = {
  status: 'starting',
  message: 'Launching local backend…',
};


function setBackendState(status, message) {
  backendState = { status, message };
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('backend:status', backendState);
  }
}


function getBackendDevConfig() {
  const backendDir = path.join(__dirname, '..', 'backend');
  const pythonCandidates = [
    path.join(backendDir, 'venve', 'Scripts', 'python.exe'),
    path.join(backendDir, '.venv', 'Scripts', 'python.exe'),
    'python',
  ];

  for (const pythonPath of pythonCandidates) {
    if (pythonPath === 'python' || fs.existsSync(pythonPath)) {
      return {
        command: pythonPath,
        args: ['app.py'],
        cwd: backendDir,
      };
    }
  }

  return null;
}

/**
 * In production the Flask backend is bundled by PyInstaller and placed at
 * <resources>/backend/app.exe by electron-builder extraResources.
 */
function getBackendExePath() {
  return path.join(process.resourcesPath, 'backend', 'app.exe');
}

/**
 * Poll GET /api/health until the backend responds 200 or retries are exhausted.
 */
function waitForBackend(retries = 40, intervalMs = 500) {
  return new Promise((resolve, reject) => {
    function attempt(remaining) {
      const req = http.get('http://127.0.0.1:5000/api/health', (res) => {
        res.resume(); // drain the response
        if (res.statusCode === 200) return resolve();
        if (remaining > 0) return setTimeout(() => attempt(remaining - 1), intervalMs);
        reject(new Error(`Backend returned HTTP ${res.statusCode}`));
      });
      req.on('error', () => {
        if (remaining > 0) return setTimeout(() => attempt(remaining - 1), intervalMs);
        reject(new Error('Backend unreachable after all retries'));
      });
      req.end();
    }
    attempt(retries);
  });
}


function checkBackendAlreadyRunning() {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:5000/api/health', (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.end();
  });
}

function startBackendProcess(command, args, cwd) {
  backendStartedByApp = true;
  backendProcess = spawn(command, args, {
    cwd,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  backendProcess.stdout.on('data', (chunk) => process.stdout.write(chunk));
  backendProcess.stderr.on('data', (chunk) => process.stderr.write(chunk));
  backendProcess.on('error', (error) => {
    const message = `Backend failed to start: ${error.message}`;
    setBackendState('error', message);
    dialog.showErrorBox('BankShield Backend Error', message);
  });
  backendProcess.on('exit', (code) => {
    const crashed = backendStartedByApp && !app.isQuitting;
    backendProcess = null;
    if (crashed) {
      const message = `The local backend stopped unexpectedly${code === null ? '.' : ` with code ${code}.`}`;
      setBackendState('error', message);
      dialog.showErrorBox('BankShield Backend Stopped', message);
    }
  });
}


async function startBackend() {
  if (await checkBackendAlreadyRunning()) {
    backendStartedByApp = false;
    setBackendState('ready', 'Using existing local backend.');
    return;
  }

  setBackendState('starting', 'Launching local backend…');

  if (isDev) {
    const devConfig = getBackendDevConfig();
    if (!devConfig) {
      throw new Error('Could not locate a Python interpreter for the backend virtual environment.');
    }
    startBackendProcess(devConfig.command, devConfig.args, devConfig.cwd);
  } else {
    const exe = getBackendExePath();
    if (!fs.existsSync(exe)) {
      throw new Error(`Bundled backend executable was not found at ${exe}`);
    }
    startBackendProcess(exe, [], path.dirname(exe));
  }

  await waitForBackend();
  setBackendState('ready', 'Local backend is ready.');
}

function stopBackend() {
  if (backendProcess) {
    try {
      backendStartedByApp = false;
      backendProcess.kill();
    } catch (_) {
      /* ignore */
    }
    backendProcess = null;
  }
}


async function loadRenderer() {
  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  await mainWindow.loadFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 680,
    backgroundColor: '#0f172a',
    autoHideMenuBar: true,
    fullscreenable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    title: 'BankShield',
    show: false,
  });

  mainWindow.removeMenu();
  mainWindow.setMenuBarVisibility(false);
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  loadRenderer().catch((error) => {
    dialog.showErrorBox('BankShield UI Error', `Failed to load the desktop interface: ${error.message}`);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    setBackendState(backendState.status, backendState.message);
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── App lifecycle ──────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);

  try {
    await startBackend();
  } catch (err) {
    const message = `BankShield could not start its local backend. ${err.message}`;
    setBackendState('error', message);
    dialog.showErrorBox('BankShield Backend Error', message);
  }
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  app.isQuitting = true;
  stopBackend();
});

// ── IPC handlers ───────────────────────────────────────────────────────────

ipcMain.handle('app:version', () => app.getVersion());
ipcMain.handle('app:is-dev', () => isDev);
ipcMain.handle('app:backend-state', () => backendState);
ipcMain.handle('window:toggle-fullscreen', () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return false;
  }

  mainWindow.setFullScreen(!mainWindow.isFullScreen());
  return mainWindow.isFullScreen();
});
ipcMain.handle('dialog:save-report', async (_, payload) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: payload.defaultName,
    filters: [{ name: 'PDF Report', extensions: ['pdf'] }],
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  fs.writeFileSync(result.filePath, Buffer.from(payload.buffer));
  return { canceled: false, filePath: result.filePath };
});
