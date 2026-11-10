import { obtenerArticuloPorSlug } from "../../data/articulos";

const MARCA = "MAIKA · Rutas del Alma";

/** Títulos exactos por ruta (sin contar `/admin/*`, `/tienda/*` y comodines, ver `tituloDocumento`). */
const TITULO_POR_RUTA: Record<string, string> = {
  "/": MARCA,
  "/tienda": "Tienda · MAIKA",
  "/servicios": "Servicios · MAIKA",
  "/servicios/tarot-evolutivo": "Tarot Evolutivo · MAIKA",
  "/servicios/limpieza-energetica": "Limpieza Energética · MAIKA",
  "/servicios/ritual-personalizado": "Ritual Personalizado · MAIKA",
  "/ritual-del-mes": "Ritual del Mes · MAIKA",
  "/suenos": "Interpretación de Sueños · MAIKA",
  "/sueno-premium": "Lectura Premium · MAIKA",
  "/horoscopos": "Horóscopos · MAIKA",
  "/testimonios": "Testimonios · MAIKA",
  "/sobre-maika": "Sobre MAIKA · MAIKA",
  "/rutas-del-alma": "Rutas del Alma · MAIKA",
  "/rutas-del-alma/cabala": "La Cábala · MAIKA",
  "/rutas-del-alma/72-nombres": "Los 72 Nombres de Dios · MAIKA",
  "/articulos": "Artículos · MAIKA",
  "/envios": "Envíos · MAIKA",
  "/contacto": "Contacto · MAIKA",
  "/enlaces": "Enlaces · MAIKA · Rutas del Alma",
  "/legal": "Aviso Legal · MAIKA",
  "/carrito": "Carrito · MAIKA",
  "/cuenta": "Mi Cuenta · MAIKA",
  "/seguimiento": "Seguimiento de Pedido · MAIKA",
  "/reset-password": "Restablecer Contraseña · MAIKA",
  "/lectura": "Lectura · MAIKA"
};

/** `document.title` según la ruta actual; el navegador lo muestra en la pestaña. */
export function tituloDocumento(pathname: string): string {
  if (TITULO_POR_RUTA[pathname]) return TITULO_POR_RUTA[pathname];
  if (pathname.startsWith("/articulos/")) {
    const articulo = obtenerArticuloPorSlug(pathname.slice("/articulos/".length));
    return articulo ? `${articulo.titulo} · MAIKA` : "Artículos · MAIKA";
  }
  if (pathname.startsWith("/admin")) return "Administración · MAIKA";
  if (pathname.startsWith("/tienda")) return "Tienda · MAIKA";
  if (pathname.startsWith("/cuenta")) return "Mi Cuenta · MAIKA";
  return MARCA;
}

const DESCRIPCION_POR_DEFECTO =
  "MAIKA · Rutas del Alma: interpretación simbólica de sueños, horóscopos, Tarot Evolutivo y Rutas del Alma — Cábala, los 72 Nombres y tradiciones del alma explicadas con calma.";

/** Meta description por ruta; el resto usa la descripción global de index.html. */
const DESCRIPCION_POR_RUTA: Record<string, string> = {
  "/rutas-del-alma":
    "Rutas del Alma de MAIKA: un espacio de conocimiento y reflexión espiritual — tradiciones, símbolos y caminos del alma, explicados con calma.",
  "/rutas-del-alma/cabala":
    "Qué es la Cábala: origen, el Árbol de la Vida y las 10 Sefirot. Una introducción clara a su simbolismo dentro de Rutas del Alma de MAIKA.",
  "/rutas-del-alma/72-nombres":
    "Los 72 Nombres de Dios (Shem HaMephorash): qué son, su origen en Éxodo 14:19-21 y su lugar en la tradición cabalística. Rutas del Alma de MAIKA.",
  "/articulos":
    "Artículos de MAIKA · Rutas del Alma: guías sobre símbolos de sueños, Tarot Evolutivo y tradiciones del alma, escritas con calma."
};

/** `meta[name="description"]` según la ruta actual (por defecto la descripción global). */
export function descripcionDocumento(pathname: string): string {
  if (DESCRIPCION_POR_RUTA[pathname]) return DESCRIPCION_POR_RUTA[pathname];
  if (pathname.startsWith("/articulos/")) {
    const articulo = obtenerArticuloPorSlug(pathname.slice("/articulos/".length));
    if (articulo) return articulo.extracto;
  }
  return DESCRIPCION_POR_DEFECTO;
}
