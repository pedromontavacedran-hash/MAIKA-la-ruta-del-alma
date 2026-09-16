import { promises as fs } from "node:fs";
import path from "node:path";
import { dataDir } from "./env.js";

const cacheFile = path.join(dataDir, "preciosOrigen.json");

/**
 * Último precio comprobado en la web del fabricante por producto.
 * Formato: { [productoId]: { precio, precioRegular, comprobadoEn, url, ok, error } }
 */
export async function leerPreciosOrigen() {
  try {
    const j = JSON.parse(await fs.readFile(cacheFile, "utf8"));
    return j && typeof j === "object" && j.items && typeof j.items === "object" ? j.items : {};
  } catch {
    return {};
  }
}

export async function guardarPrecioOrigen(productoId, entrada) {
  const items = await leerPreciosOrigen();
  items[String(productoId)] = entrada;
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(cacheFile, JSON.stringify({ items }, null, 2), "utf8");
}
