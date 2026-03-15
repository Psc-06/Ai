'use strict';

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose a minimal, typed API to the renderer process.
 * Never expose full ipcRenderer — only the specific channels needed.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => ipcRenderer.invoke('app:version'),
  isDev: () => ipcRenderer.invoke('app:is-dev'),
  getBackendState: () => ipcRenderer.invoke('app:backend-state'),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
  saveReport: (buffer, defaultName) => ipcRenderer.invoke('dialog:save-report', { buffer, defaultName }),
  onBackendStatus: (listener) => {
    const wrapped = (_event, payload) => listener(payload);
    ipcRenderer.on('backend:status', wrapped);
    return () => ipcRenderer.removeListener('backend:status', wrapped);
  },
  platform: process.platform,
});
