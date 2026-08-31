/**
 * En escritorio el scroll va en el scrollport principal (`getMaikaScrollPortEl`: tienda → shell, resto → `__content`).
 * Sobre `<input type="range">`, la rueda suele cambiar el valor y no desplaza el panel.
 * Interceptamos wheel en fase capture y pasamos el delta a ese contenedor.
 */

import { getMaikaScrollPortEl } from "./maikaScrollPort";

function ancestroPuedeScrollVertical(el: HTMLElement | null, limite: HTMLElement, deltaY: number): boolean {
  let n: HTMLElement | null = el?.parentElement ?? null;
  while (n && n !== limite) {
    const st = getComputedStyle(n);
    const oy = st.overflowY;
    if ((oy === "auto" || oy === "scroll") && n.scrollHeight > n.clientHeight + 1) {
      const max = n.scrollHeight - n.clientHeight;
      if (deltaY > 0 && n.scrollTop < max - 1) return true;
      if (deltaY < 0 && n.scrollTop > 1) return true;
    }
    n = n.parentElement;
  }
  return false;
}

/** Activa el comportamiento mientras el panel admin principal (`/admin`) está montado con sesión. */
export function mountAdminRangeWheelScrollPassthrough(): () => void {
  const mq = window.matchMedia("(min-width: 769px)");
  let detachWheel: (() => void) | null = null;

  const attach = () => {
    detachWheel?.();
    detachWheel = null;
    if (!mq.matches) return;

    const onWheel = (e: WheelEvent) => {
      const port = getMaikaScrollPortEl();
      const t = e.target;
      if (!(t instanceof HTMLInputElement) || t.type !== "range") return;
      if (port && !port.contains(t)) return;

      const portPuedeScroll =
        !!port &&
        port.scrollHeight > port.clientHeight + 1 &&
        ((e.deltaY > 0 && port.scrollTop < port.scrollHeight - port.clientHeight - 1) ||
          (e.deltaY < 0 && port.scrollTop > 1));

      if (port && ancestroPuedeScrollVertical(t, port, e.deltaY)) return;

      const doc = document.scrollingElement as HTMLElement | null;
      const docPuedeScroll =
        !!doc &&
        doc.scrollHeight > doc.clientHeight + 1 &&
        ((e.deltaY > 0 && doc.scrollTop < doc.scrollHeight - doc.clientHeight - 1) ||
          (e.deltaY < 0 && doc.scrollTop > 1));

      if (!portPuedeScroll && !docPuedeScroll) return;

      e.preventDefault();
      if (portPuedeScroll && port) {
        port.scrollTop += e.deltaY;
        return;
      }
      window.scrollBy({ top: e.deltaY, behavior: "auto" });
    };

    document.addEventListener("wheel", onWheel, { capture: true, passive: false });
    detachWheel = () => document.removeEventListener("wheel", onWheel, true);
  };

  attach();
  mq.addEventListener("change", attach);
  return () => {
    mq.removeEventListener("change", attach);
    detachWheel?.();
  };
}
