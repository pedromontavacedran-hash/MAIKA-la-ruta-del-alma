/**
 * Copia backend/data/*.json a backups/maika-data-YYYYMMDD-HHMMSS/
 * Ejecutar: npm run backup:data
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dataDir = join(root, 'backend', 'data');
const backupsRoot = join(root, 'backups');

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-` +
    `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  );
}

if (!existsSync(dataDir)) {
  console.error('No existe backend/data. Nada que respaldar.');
  process.exit(1);
}

const files = readdirSync(dataDir).filter(
  (f) => f.endsWith('.json') && statSync(join(dataDir, f)).isFile()
);

if (files.length === 0) {
  console.warn('backend/data no tiene archivos .json.');
  process.exit(0);
}

const destDir = join(backupsRoot, `maika-data-${stamp()}`);
mkdirSync(destDir, { recursive: true });

for (const f of files) {
  copyFileSync(join(dataDir, f), join(destDir, f));
}

console.log(`Respaldo creado: ${destDir}`);
console.log(`Archivos: ${files.join(', ')}`);
