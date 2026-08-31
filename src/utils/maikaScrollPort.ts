/**
 * Vista tienda (y subrutas bajo `/tienda/…`): scroll del `.app-shell` completo
 * (`app-shell--tienda-shell-scroll`).
 * Fuera de tienda: **no** se desplaza `.app-shell__content` — el scroll vertical va solo en `.app-shell__routes-grow`
 * (regla genérica: la columna bajo la nav fija no “tira” del shell entero).
 */
export function esRutaVistaTiendaShellScroll(pathname: string): boolean {
  if (pathname === "/tienda") return true;
  return pathname.startsWith("/tienda/");
}

/**
 * Scrollport vertical principal según la clase que pone `Layout` (`tiendaShellScroll`).
 */
export function getMaikaScrollPortEl(): HTMLElement | null {
  const shell = document.querySelector(".app-shell");
  if (!(shell instanceof HTMLElement)) return null;
  if (shell.classList.contains("app-shell--tienda-shell-scroll")) return shell;
  const grow = shell.querySelector(".app-shell__routes-grow");
  return grow instanceof HTMLElement ? grow : null;
}

/**
 * WebKit/Chromium suelen ajustar el scroll al abrir/cerrar `<details>` (scroll anchoring / scroll into view).
 * Con el scroll en `.app-shell__routes-grow` (o `.app-shell` en tienda), eso “mueve la pantalla”.
 * Instalar una vez a nivel app (p. ej. `MaikaAppShell`); devuelve función para desuscribir.
 */
export function installPreserveMaikaScrollPortOnDetailsToggle(): () => void {
  const onToggleCapture = (ev: Event) => {
    if (!(ev.target instanceof HTMLDetailsElement)) return;
    const port = getMaikaScrollPortEl();
    if (!port) return;
    const y = port.scrollTop;
    const w = window.scrollY;
    requestAnimationFrame(() => {
      port.scrollTop = y;
      if (window.scrollY !== w) window.scrollTo(0, w);
    });
  };
  document.addEventListener("toggle", onToggleCapture, true);
  return () => document.removeEventListener("toggle", onToggleCapture, true);
}

export type MaikaScrollIntoAlign = "start" | "center" | "nearest";

/**
 * Alinea un elemento dentro del scrollport Maika (`.app-shell` en tienda, `.app-shell__routes-grow` en el resto).
 * Evita depender del `scrollIntoView` del documento cuando el overflow vertical no es `html/body`.
 */
export function scrollElementIntoMaikaScrollPort(
  el: HTMLElement | null | undefined,
  opts: { align?: MaikaScrollIntoAlign; margin?: number; behavior?: ScrollBehavior } = {}
): void {
  if (!el) return;
  const align = opts.align ?? "nearest";
  const margin = opts.margin ?? 8;
  const behavior = opts.behavior ?? "auto";
  const port = getMaikaScrollPortEl();

  if (!port) {
    el.scrollIntoView({
      block: align === "center" ? "center" : align === "start" ? "start" : "nearest",
      inline: "nearest",
      behavior
    });
    return;
  }

  const elRect = el.getBoundingClientRect();
  const portRect = port.getBoundingClientRect();
  const st = port.scrollTop;
  const elTopRel = elRect.top - portRect.top + st;
  const elH = elRect.height;
  const portInner = port.clientHeight;

  if (align === "center") {
    const next = elTopRel - portInner / 2 + elH / 2;
    port.scrollTo({ top: Math.max(0, next), behavior });
    return;
  }

  if (align === "start") {
    port.scrollTo({ top: Math.max(0, elTopRel - margin), behavior });
    return;
  }

  const elBotRel = elTopRel + elH;
  const viewTop = st;
  const viewBot = st + portInner;
  if (elTopRel < viewTop + margin) {
    port.scrollTo({ top: Math.max(0, elTopRel - margin), behavior });
  } else if (elBotRel > viewBot - margin) {
    port.scrollTo({ top: Math.max(0, elBotRel - portInner + margin), behavior });
  }
}
