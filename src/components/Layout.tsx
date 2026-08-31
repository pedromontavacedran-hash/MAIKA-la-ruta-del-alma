import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import FondoEstrellado from "../FondoEstrellado";
import {
  FONDO_PANTALLA_UPDATED_EVENT,
  leerFondoAppCapaPreset,
  type FondoAppCapaPresetId
} from "@/utils/fondoPantallaConfig";

interface LayoutProps {
  children: ReactNode;
  pulseStyle?: string;
  /** Si true, quita padding superior para que el hero quede a ras del borde */
  fullBleedTop?: boolean;
  /** Si true, quita padding horizontal para vistas que deben ocupar todo el ancho. */
  fullBleedX?: boolean;
  /** Override opcional del fondo del shell (útil para pruebas visuales). */
  backgroundColorOverride?: string;
  /** Si true, oculta el fondo estrellado de forma explícita. */
  ocultarFondoEstrellado?: boolean;
  /** Inventario admin: sin topbar global; un poco más de aire útil arriba */
  inventarioAdminSinNav?: boolean;
  /** Rutas con contenido largo: desplazan dentro de la zona bajo la barra. */
  adminPanelScroll?: boolean;
  /**
   * `/tienda` y subrutas: scroll en `.app-shell`.
   * En el resto el scroll va en `.app-shell__routes-grow`; `__content` no hace scroll (evita desplazamiento de toda la columna).
   */
  tiendaShellScroll?: boolean;
}

export default function Layout({
  children,
  pulseStyle,
  fullBleedTop,
  fullBleedX,
  backgroundColorOverride,
  ocultarFondoEstrellado,
  inventarioAdminSinNav,
  adminPanelScroll,
  tiendaShellScroll = false
}: LayoutProps) {
  const [fondoAppCapa, setFondoAppCapa] = useState<FondoAppCapaPresetId>(() =>
    typeof window !== "undefined" ? leerFondoAppCapaPreset() : ""
  );

  useEffect(() => {
    const onActualizado = () => setFondoAppCapa(leerFondoAppCapaPreset());
    window.addEventListener(FONDO_PANTALLA_UPDATED_EVENT, onActualizado as EventListener);
    return () => window.removeEventListener(FONDO_PANTALLA_UPDATED_EVENT, onActualizado as EventListener);
  }, []);

  const shellFondo = useMemo(() => {
    if (backgroundColorOverride) {
      return { backgroundColor: backgroundColorOverride } as const;
    }
    if (fondoAppCapa === "maika-lila") {
      /* El degradado lo pinta FondoEstrellado; el shell transparente evita doble capa. */
      return { backgroundColor: "transparent" } as const;
    }
    return { backgroundColor: "var(--maika-bg)" } as const;
  }, [backgroundColorOverride, fondoAppCapa]);

  return (
    <div
      className={`app-shell${fullBleedTop ? " app-shell--full-bleed-top" : ""}${fullBleedX ? " app-shell--full-bleed-x" : ""}${inventarioAdminSinNav ? " app-shell--inventario-admin" : ""}${adminPanelScroll ? " app-shell--admin-panel-scroll" : ""}${tiendaShellScroll ? " app-shell--tienda-shell-scroll" : ""}`}
      style={{
        ...shellFondo,
        minHeight: "100svh",
        /* Inicio: sin shorthand padding:20 — así el hero llega a los bordes sin depender solo de CSS !important */
        ...(fullBleedTop
          ? {
              paddingTop: 0,
              paddingBottom: 20,
              paddingLeft: 0,
              paddingRight: 0
            }
          : {
              /* Sin padding superior: evita franja `--maika-bg` entre viewport y contenido (la nav es fixed);
                 el aire bajo la barra lo marcan las rutas (p. ej. `.page-top-spacing`) o el panel admin. Móvil ya forzaba shell padding-top 0. */
              paddingTop: 0,
              paddingBottom: 20,
              paddingLeft: fullBleedX ? 0 : 20,
              paddingRight: fullBleedX ? 0 : 20
            }),
        color: "#F5E6C8",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div className="app-shell__content" style={{ position: "relative", zIndex: 1 }}>
        {!ocultarFondoEstrellado ? <FondoEstrellado /> : null}
        {pulseStyle && <style>{pulseStyle}</style>}
        {children}
      </div>
    </div>
  );
}
