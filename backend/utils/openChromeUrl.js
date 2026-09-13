import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

function chromeCandidates() {
  const fromEnv = [process.env.MAIKA_BROWSER_PATH, process.env.CHROME_PATH].filter(Boolean);
  const localAppData = process.env.LOCALAPPDATA || "";
  return [
    ...fromEnv,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(localAppData, "Google", "Chrome", "Application", "chrome.exe")
  ];
}

export function findChromeExecutable() {
  for (const candidate of chromeCandidates()) {
    if (candidate && existsSync(candidate)) return candidate;
  }
  return null;
}

/** Abre `url` en Google Chrome (Windows). Dev/local: el correo suele abrir Brave como predeterminado. */
export function openUrlInChrome(url) {
  if (process.env.MAIKA_OPEN_LINKS_IN_CHROME === "0") return false;
  const chrome = findChromeExecutable();
  if (!chrome) {
     
    console.warn("[maika-backend] Chrome no encontrado; enlace no abierto automáticamente:", url);
    return false;
  }
  try {
    spawn(chrome, [url], { detached: true, stdio: "ignore" }).unref();
    return true;
  } catch (err) {
     
    console.warn("[maika-backend] No se pudo abrir Chrome:", err?.message || err);
    return false;
  }
}
