const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 720,
    title: "OfficeFloww — Industrial Production OS",
    icon: path.join(__dirname, "assets", "logo.png"),
    backgroundColor: "#0d1117",
    show: true,
    center: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.webContents.on("did-fail-load", (e, code, desc) => {
    console.error("Failed to load:", code, desc);
  });
  win.webContents.on("console-message", (event, level, message) => {
    console.log(`[Renderer] ${message}`);
  });

  win.loadFile(path.join(__dirname, "index.html"));

  win.show();
  win.restore();
  win.focus();
  win.setAlwaysOnTop(true);
  setTimeout(() => {
    try {
      win.setAlwaysOnTop(false);
    } catch (e) {}
  }, 1500);

  // Live reload on bundle rebuild
  const fs = require("fs");
  const bundlePath = path.join(__dirname, "dist", "bundle.js");
  let reloadTimeout = null;
  if (fs.existsSync(bundlePath)) {
    fs.watch(bundlePath, () => {
      clearTimeout(reloadTimeout);
      reloadTimeout = setTimeout(() => {
        console.log("[Main] Reloading Electron renderer with updated bundle...");
        win.webContents.reloadIgnoringCache();
      }, 150);
    });
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
