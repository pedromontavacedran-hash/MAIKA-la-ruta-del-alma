import type { CSSProperties, ReactNode } from "react";

function buildScreenStyle(
  maxWidth: number,
  horizontalPadding: string,
  extra?: CSSProperties,
  bottomPadding: string = "0px"
): CSSProperties {
  return {
    maxWidth,
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
    paddingLeft: horizontalPadding,
    paddingRight: horizontalPadding,
    paddingBottom: bottomPadding,
    display: "flex",
    flexDirection: "column",
    minHeight: "calc(100svh - var(--app-topbar-stack))",
    ...extra
  };
}

/** Envolturas compartidas para rutas públicas; mantienen el scroll y espaciado del shell en un único sitio. */
export function bloqueLayoutContenido(children: ReactNode) {
  return (
    <div className="page-top-spacing">
      <div style={buildScreenStyle(800, "20px", undefined, "40px")}>{children}</div>
    </div>
  );
}

/** La pantalla inicial de Sueños no necesita una altura mínima, para evitar un pequeño salto de scroll. */
export function bloqueLayoutSuenos(children: ReactNode) {
  return (
    <div className="page-top-spacing">
      <div className="maika-suenos-ruta-wrap" style={buildScreenStyle(800, "20px", { minHeight: 0 }, "40px")}>{children}</div>
    </div>
  );
}

/** Rutas de tarjetas/grids (servicios y derivados): más ancho que las páginas de texto, sin llegar al catálogo. */
export function bloqueLayoutContenidoAncho(children: ReactNode) {
  return (
    <div className="page-top-spacing">
      <div style={buildScreenStyle(1120, "20px", undefined, "40px")}>{children}</div>
    </div>
  );
}

/** El catálogo aprovecha un ancho mayor que las páginas editoriales. */
export function bloqueLayoutTienda(children: ReactNode) {
  return (
    <div className="page-top-spacing">
      <div style={buildScreenStyle(1120, "20px", undefined, "40px")}>{children}</div>
    </div>
  );
}

const lecturaRutaInnerStyle: CSSProperties = {
  margin: "0 auto",
  width: "100%",
  maxWidth: "var(--lectura-pantalla-ancho-max, min(800px, 100%))",
  boxSizing: "border-box",
  paddingLeft: "20px",
  paddingRight: "20px",
  paddingBottom: "40px",
  display: "flex",
  flexDirection: "column",
  minHeight: "calc(100svh - var(--app-topbar-stack))"
};

/** La anchura de Lectura se controla desde el panel admin mediante una variable CSS. */
export function bloqueLayoutLectura(children: ReactNode) {
  return (
    <div className="page-top-spacing">
      <div className="lectura-page-ruta-wrap" style={lecturaRutaInnerStyle}>{children}</div>
    </div>
  );
}
