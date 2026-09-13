/**
 * Genera capacitor.config.json (Capacitor no soporta bien TS+ESM en todos los entornos).
 *
 * --packaged  → sin server.url (APK que usa dist empaquetado).
 * (sin flag)  → si existe .capacitor-live o CAP_SERVER_URL, añade server para modo directo.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function readCapacitorLiveFile() {
  try {
    const p = join(root, '.capacitor-live');
    if (!existsSync(p)) return undefined;
    for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
      const t = line.trim();
      if (t.startsWith('http')) return t;
    }
  } catch {
    /* */
  }
  return undefined;
}

const packaged = process.argv.includes('--packaged');
const fromEnv = (process.env.CAP_SERVER_URL || '').trim();
const fromFile = readCapacitorLiveFile();
const liveUrl = packaged ? '' : fromEnv || fromFile || '';

const config = {
  appId: 'com.maika.app',
  appName: 'Maika',
  webDir: 'dist',
  ...(liveUrl
    ? {
        server: {
          url: liveUrl,
          cleartext: true
        }
      }
    : {})
};

const out = join(root, 'capacitor.config.json');
writeFileSync(out, JSON.stringify(config, null, 2), 'utf8');
console.log(
  packaged
    ? '[capacitor] capacitor.config.json (empaquetado, sin servidor dev)'
    : liveUrl
      ? `[capacitor] capacitor.config.json (modo directo: ${liveUrl})`
      : '[capacitor] capacitor.config.json (sin .capacitor-live → empaquetado)'
);
