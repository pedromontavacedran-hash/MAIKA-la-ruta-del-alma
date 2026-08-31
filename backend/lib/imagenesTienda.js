import { promises as fs } from "node:fs";
import path from "node:path";
import { publicTiendaDir } from "./env.js";

function slugificar(texto) {
  return String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    || "sin-nombre";
}

/** `public/tienda/<categoriaId>/`. Crea la carpeta si no existe; no falla si ya está creada. */
export async function crearCarpetaCategoria(categoriaId) {
  await fs.mkdir(path.join(publicTiendaDir, slugificar(categoriaId)), { recursive: true });
}

/** `public/tienda/<categoriaId>/<subcategoriaId>/`. */
export async function crearCarpetaSubcategoria(categoriaId, subcategoriaId) {
  await fs.mkdir(path.join(publicTiendaDir, slugificar(categoriaId), slugificar(subcategoriaId)), { recursive: true });
}

const EXT_POR_MIME = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

/**
 * Si `dataUrl` es una data URL de imagen (`data:image/...;base64,...`), la escribe como archivo real
 * en `public/tienda/<categoriaId>/[<subcategoriaId>/]<nombreBase>.<ext>` y devuelve la URL pública
 * (`/tienda/...`, la sirve Vite en dev y queda bundleada en build). Si no es una data URL (ya es una
 * ruta, o viene vacía), la devuelve tal cual sin tocar disco.
 */
export async function guardarImagenSiEsDataUrl(dataUrl, categoriaId, subcategoriaId, nombreBase) {
  const valor = String(dataUrl || "");
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(valor);
  if (!match) return valor;

  const ext = EXT_POR_MIME[match[1].toLowerCase()] || "jpg";
  const buffer = Buffer.from(match[2], "base64");
  const carpetaRelativa = subcategoriaId
    ? path.join(slugificar(categoriaId), slugificar(subcategoriaId))
    : slugificar(categoriaId);
  const carpetaAbsoluta = path.join(publicTiendaDir, carpetaRelativa);
  await fs.mkdir(carpetaAbsoluta, { recursive: true });

  const base = slugificar(nombreBase);
  let nombreArchivo = `${base}.${ext}`;
  let intento = 1;
  while (true) {
    try {
      await fs.access(path.join(carpetaAbsoluta, nombreArchivo));
      intento += 1;
      nombreArchivo = `${base}-${intento}.${ext}`;
    } catch {
      break;
    }
  }

  await fs.writeFile(path.join(carpetaAbsoluta, nombreArchivo), buffer);
  return `/tienda/${carpetaRelativa.split(path.sep).join("/")}/${nombreArchivo}`;
}
