import type { CSSProperties } from "react";

export const gold = "#e5c07b";

export const iconAdmin = (sizePx?: number) => (
  <svg className="nav-icon-stroke" width={sizePx ?? "1.45em"} height={sizePx ?? "1.45em"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.15" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block", marginRight: 0 }}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

export const iconCarrito = (sizePx?: number) => (
  <svg width={sizePx ?? "1.8em"} height={sizePx ?? "1.8em"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block" }}>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

export const iconMenuTresLineas = (sizePx?: number) => (
  <svg width={sizePx ?? "1.8em"} height={sizePx ?? "1.8em"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block" }}>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

export const iconCerrar = (
  <svg width="1.1em" height="1.1em" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block" }}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const iconPersona = (sizePx?: number) => (
  <svg className="nav-icon-filled" width={sizePx ?? "2em"} height={sizePx ?? "2em"} viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true" style={{ display: "block" }}>
    <path d="M12 12c2.76 0 5-2.46 5-5.5S14.76 1 12 1 7 3.46 7 6.5 9.24 12 12 12z" />
    <path d="M12 14c-4.42 0-8 2.69-8 6v2h16v-2c0-3.31-3.58-6-8-6z" />
  </svg>
);

/** Marcador uniforme de las entradas del menú: estrella fina de cuatro puntas (dorada vía CSS). */
export const iconMenuMarcador = (
  <svg className="app-menu-item__marcador" width="8" height="8" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true" style={{ display: "inline-block", flexShrink: 0 }}>
    <path d="M12 2c1 6 4 9 10 10-6 1-9 4-10 10-1-6-4-9-10-10 6-1 9-4 10-10z" />
  </svg>
);

export const linkStyle = (active: boolean, size = 16): CSSProperties => ({
  color: "var(--barra-iconos-color, #e5c07b)",
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
  fontSize: size,
  fontWeight: active ? 600 : 500,
  textDecoration: "none",
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  whiteSpace: "nowrap" as const,
  transition: "color 0.2s ease"
});
