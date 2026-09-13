/**
 * Extrae rangos de líneas de src/App.css a módulos (orden de cascada = orden de import en App.css).
 * Ejecutar desde la raíz del repo: node scripts/split-app-css.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const appCss = path.join(root, "src", "App.css");
const lines = fs.readFileSync(appCss, "utf8").split(/\r?\n/);

/** Líneas 1-based [start, end] inclusive */
function slice(start, end) {
  return lines.slice(start - 1, end).join("\n");
}

const chunks = [
  ["src/pages/checkout.css", 1, 335, "Checkout modal + overlays compartidos con flujo checkout"],
  ["src/pages/cuenta.css", 336, 654, "Mi cuenta (página / modal)"],
  ["src/styles/global.css", 655, 1401, "Variables :root, reset, shell base, tienda/catálogo (bloque 655–1401)"],
  ["src/styles/layout-responsive.css", 1402, 1653, "Móvil: touch targets, safe area, topbar hero, full-bleed"],
  ["src/pages/home.css", 1654, 2149, "Hero / inicio"],
  ["src/pages/servicios.css", 2150, 2425, "Servicios"],
  ["src/pages/admin.css", 2426, 3514, "Admin (antes del bloque shell 3515)"],
  ["src/styles/layout-shell.css", 3515, 4214, "Topbar, bottombar, app-shell scroll, zoom legibility"],
  ["src/pages/tienda.css", 4215, 4852, "Tienda lightbox, cerrar modal global, carrito layout (hasta fin bloque carrito)"],
  ["src/pages/admin-supplement.css", 4853, 6131, "Admin (editores, inventario, modales)"],
  ["src/pages/legal.css", 6132, 6253, "Páginas legales"],
  ["src/pages/horoscopo.css", 6254, lines.length, "Horóscopos lista + modal signo"]
];

for (const [rel, a, b, note] of chunks) {
  const out = path.join(root, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const body = slice(a, b);
  const header = `/* Módulo extraído de App.css (líneas ${a}–${b}). ${note} */\n\n`;
  fs.writeFileSync(out, header + body + "\n", "utf8");
  console.log("wrote", rel, `(${b - a + 1} lines)`);
}

console.log("done");
