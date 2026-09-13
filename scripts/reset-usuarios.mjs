/**
 * Respalda backend/data/usuarios.json y lo deja en [] para pruebas limpias.
 * Uso: npm run reset:usuarios
 *
 * Reinicia el backend después si estaba en marcha (para recargar memoria).
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const usuariosPath = join(root, "backend", "data", "usuarios.json");
const backupsRoot = join(root, "backups");

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

if (!existsSync(usuariosPath)) {
  console.error("No existe:", usuariosPath);
  process.exit(1);
}

const raw = readFileSync(usuariosPath, "utf8").trim();
if (raw !== "[]" && raw !== "[]\n") {
  const destDir = join(backupsRoot, `maika-usuarios-before-reset-${stamp()}`);
  mkdirSync(destDir, { recursive: true });
  const dest = join(destDir, "usuarios.json");
  copyFileSync(usuariosPath, dest);
  console.log("Copia de seguridad:", dest);
}

writeFileSync(usuariosPath, "[\n]\n", "utf8");
console.log("usuarios.json → [] (listo). Si el API estaba corriendo, reinicia backend:dev).");
