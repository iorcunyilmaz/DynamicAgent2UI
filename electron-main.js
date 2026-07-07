const { app, BrowserWindow, screen, ipcMain } = require("electron");
const path = require("path");

let floatingWindow;

// Listen for window resize requests from Next.js
ipcMain.on("resize-window", (event, { width, height }) => {
  if (floatingWindow && !floatingWindow.isDestroyed()) {
    floatingWindow.setSize(width, height);
  }
});

function createWindows() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  // Create the Floating Frameless Desktop Dialog Window
  floatingWindow = new BrowserWindow({
    width: 480,
    height: 650,
    x: screenWidth - 520, // Position on the right side of the screen
    y: 120,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    hasShadow: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  floatingWindow.loadURL("http://localhost:3000/floating");

  floatingWindow.on("closed", () => {
    app.quit();
  });
}

app.whenReady().then(() => {
  // Enable macOS transparent visual visuals
  app.commandLine.appendSwitch("enable-transparent-visuals");
  
  createWindows();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindows();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
