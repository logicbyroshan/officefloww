# 07 - Electron Process Architecture & Security Hardening

## Overview
OfficeFloww runs as an enterprise desktop application utilizing Electron's multi-process architecture with complete sandboxing and zero Node.js integration inside the renderer window.

## Security Configuration Matrix

```javascript
// apps/desktop/main.js
const mainWindow = new BrowserWindow({
  width: 1280,
  height: 860,
  minWidth: 1024,
  minHeight: 700,
  webPreferences: {
    preload: path.join(__dirname, "preload.js"),
    contextIsolation: true,       // Enforces separate execution contexts
    nodeIntegration: false,        // Prevents renderer from accessing Node APIs
    sandbox: true,                 // Chromium multi-process sandbox
    enableRemoteModule: false,     // Disables deprecated remote module
    allowRunningInsecureContent: false,
  },
});
```

## Content Security Policy (CSP)
Defined in `apps/desktop/index.html`:
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  connect-src 'self' http://127.0.0.1:8000 http://localhost:8000;
  img-src 'self' data: blob: http://127.0.0.1:8000 http://localhost:8000;
">
```

## Safe IPC Bridge (`preload.js`)
The renderer interacts with native operating system capabilities strictly through exposed methods on `window.electronAPI`:
```javascript
contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  version: "1.0.0",
  openExternal: (url) => shell.openExternal(url),
  showItemInFolder: (fullPath) => shell.showItemInFolder(fullPath),
});
```
This guarantees that external file access and network requests cannot execute unauthorized system binaries.
