import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, "../public/logotipo.jpg");
const dest = path.join(__dirname, "../public/iconos/logotipo.jpg");

if (!fs.existsSync(src)) {
  console.error("No existe public/logotipo.jpg");
  process.exit(1);
}
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
console.log("OK: public/iconos/logotipo.jpg actualizado desde public/logotipo.jpg");
