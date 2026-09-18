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
  "/envios": "Envíos · MAIKA",
  "/contacto": "Contacto · MAIKA",
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
  if (pathname.startsWith("/admin")) return "Administración · MAIKA";
  if (pathname.startsWith("/tienda")) return "Tienda · MAIKA";
  if (pathname.startsWith("/cuenta")) return "Mi Cuenta · MAIKA";
  return MARCA;
}
