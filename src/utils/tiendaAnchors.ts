import { scrollElementIntoMaikaScrollPort } from "./maikaScrollPort";

/**
 * Anclas internas de la vista /tienda para entradas del menú principal.
 * La vista es lazy y puede estar mostrando una categoría/detalle interno, así que el
 * consumidor (`Tienda`) resetea sus vistas internas y luego reintenta el scroll hasta
 * que el elemento exista.
 */
export const TIENDA_ANCHOR_EVENT = "maika:tienda-anchor";
export const TIENDA_ANCHOR_STORAGE_KEY = "maika:tienda-anchor-pendiente";

export const TIENDA_ANCHOR_IDS = {
  packsDestacados: "tienda-packs-destacados",
  masVendidos: "tienda-mas-vendidos"
} as const;

export type TiendaAnchorId = (typeof TIENDA_ANCHOR_IDS)[keyof typeof TIENDA_ANCHOR_IDS];

/** Ya estamos dentro de /tienda: el componente escucha el evento y hace el scroll. */
export function emitirTiendaAnchor(id: TiendaAnchorId): void {
  window.dispatchEvent(new CustomEvent(TIENDA_ANCHOR_EVENT, { detail: { id } }));
}

/** Venimos de otra ruta: se guarda para que `Tienda` lo consuma al montar. */
export function guardarTiendaAnchorPendiente(id: TiendaAnchorId): void {
  try {
    sessionStorage.setItem(TIENDA_ANCHOR_STORAGE_KEY, id);
  } catch {
    /* Sin storage (modo privado): el menú navega a /tienda sin scroll. */
  }
}

export function consumirTiendaAnchorPendiente(): string | null {
  try {
    const id = sessionStorage.getItem(TIENDA_ANCHOR_STORAGE_KEY);
    if (id) sessionStorage.removeItem(TIENDA_ANCHOR_STORAGE_KEY);
    return id;
  } catch {
    return null;
  }
}

/** La barra fija tapa el inicio del scrollport: el ancla queda justo debajo. */
function margenBajoTopbarPx(): number {
  const px = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--app-topbar-stack"));
  return (Number.isFinite(px) ? px : 100) + 12;
}

/**
 * Scroll suave al ancla dentro del scrollport Maika, reintentando mientras la vista
 * termina de montar (lazy) o de cerrar la categoría interna. Devuelve cancelación.
 */
export function scrollATiendaAnchor(id: string): () => void {
  let vivo = true;
  let intentos = 30;
  const tick = () => {
    if (!vivo) return;
    const el = document.getElementById(id);
    if (el instanceof HTMLElement) {
      scrollElementIntoMaikaScrollPort(el, { align: "start", margin: margenBajoTopbarPx(), behavior: "smooth" });
      return;
    }
    intentos -= 1;
    if (intentos > 0) window.setTimeout(tick, 100);
  };
  window.setTimeout(tick, 0);
  return () => {
    vivo = false;
  };
}
