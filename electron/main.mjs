import { app, BrowserWindow, nativeImage, shell } from "electron";
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const ICON_PNG = path.join(rootDir, "public", "logos", "logo web lila3.png");
const ICON_ICO = path.join(rootDir, "public", "icon.ico");

/** @type {import("node:child_process").ChildProcess | null} */
let backendChild = null;
/** @type {BrowserWindow | null} */
let splashWindow = null;

function windowIcon() {
  if (fs.existsSync(ICON_ICO)) {
    const img = nativeImage.createFromPath(ICON_ICO);
    if (!img.isEmpty()) return img;
  }
  if (fs.existsSync(ICON_PNG)) {
    const img = nativeImage.createFromPath(ICON_PNG);
    if (!img.isEmpty()) return img;
  }
  return undefined;
}

function waitTcpPort(port, host = "127.0.0.1", timeoutMs = 45_000) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const tryOnce = () => {
      const socket = net.createConnection({ port, host }, () => {
        socket.destroy();
        resolve();
      });
      socket.on("error", () => {
        socket.destroy();
        if (Date.now() - t0 > timeoutMs) {
          reject(new Error(`El puerto ${port} no respondió a tiempo`));
        } else {
          setTimeout(tryOnce, 280);
        }
      });
    };
    tryOnce();
  });
}

function createSplashWindow() {
  const w = new BrowserWindow({
    width: 420,
    height: 280,
    frame: false,
    resizable: false,
    center: true,
    show: true,
    alwaysOnTop: true,
    backgroundColor: "#120a18",
    icon: windowIcon(),
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });
  w.loadFile(path.join(__dirname, "splash.html"));
  return w;
}

function attachExternalLinks(win) {
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

/** Ventana principal sin cargar URL todavía (arranque empaquetado con splash). */
function createMainWindowHidden() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: "MAIKA Rutas del Alma",
    autoHideMenuBar: true,
    icon: windowIcon(),
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  attachExternalLinks(win);
  return win;
}

function createWindowDev(startUrl) {
  const win = createMainWindowHidden();
  win.once("ready-to-show", () => win.show());
  win.loadURL(startUrl);
  return win;
}

function startPackagedBackend() {
  const root = app.getAppPath();
  const serverJs = path.join(root, "backend", "server.js");
  if (!fs.existsSync(serverJs)) {
    throw new Error(`No se encuentra ${serverJs}`);
  }
  backendChild = spawn(process.execPath, [serverJs], {
    cwd: root,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      MAIKA_SERVE_DIST: "1",
      MAIKA_QUIET: "1",
      NODE_ENV: "production",
      MAIKA_USER_DATA: app.getPath("userData")
    },
    windowsHide: true,
    stdio: "ignore"
  });
  backendChild.on("error", (err) => {
     
    console.error("[maika-electron] backend:", err);
  });
}

function cerrarSplash() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
  }
  splashWindow = null;
}

app.whenReady().then(async () => {
  try {
    if (app.isPackaged) {
      splashWindow = createSplashWindow();
      const mainWin = createMainWindowHidden();
      startPackagedBackend();
      await waitTcpPort(3001);
      await mainWin.loadURL("http://127.0.0.1:3001/");
      cerrarSplash();
      mainWin.show();
    } else {
      createWindowDev("http://127.0.0.1:5173/");
    }
  } catch (e) {
    cerrarSplash();
     
    console.error("[maika-electron]", e);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const url = app.isPackaged ? "http://127.0.0.1:3001/" : "http://127.0.0.1:5173/";
    createWindowDev(url);
  }
});

app.on("before-quit", () => {
  cerrarSplash();
  if (backendChild && !backendChild.killed) {
    backendChild.kill();
    backendChild = null;
  }
});
