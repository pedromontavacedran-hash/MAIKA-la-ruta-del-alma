import { useState, useRef, useEffect, useMemo, type ReactNode } from "react";
import { useApp } from "../context/AppContext";
import type { Pagina } from "../types";
import type { Producto } from "../types";

/** Orden: 1 Tienda, 2 Servicios, 3 Productos, 4 Sobre Maika, 5 Contacto, 6 Envíos, 7 Legal */
const MENU_INICIO_OPCIONES = [
  { id: "tienda", label: "🏪 Tienda", accion: "tienda" as const },
  { id: "servicios", label: "✨ Servicios", accion: "anchor" as const, anchor: "inicio-servicios" },
  { id: "empresa", label: "🌙 Sobre Maika", accion: "anchor" as const, anchor: "inicio-empresa" },
  { id: "contacto", label: "📬 Contacto", accion: "whatsapp" as const },
  { id: "envios", label: "🚚 Envíos", accion: "anchor" as const, anchor: "inicio-envios" },
] as const;

const CATEGORIAS_ORDEN = ["velas", "inciensos", "figuras", "kits"] as const;
const CAT_LABEL: Record<string, string> = { velas: "Velas", inciensos: "Inciensos", figuras: "Figuras", kits: "Kits" };

interface NavPrincipalProps {
  pagina: Pagina;
  setPagina: (p: Pagina) => void;
  onTerminarCompra: () => void;
  esAppNativa: boolean;
}

const gold = "#e5c07b";

const iconAdmin = (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: "-0.2em", marginRight: 4 }}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const iconFavoritos = (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: "-0.2em", marginRight: 4 }}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const iconSeguimiento = (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: "-0.2em", marginRight: 4 }}>
    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
    <path d="M15 18h2" />
    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
  </svg>
);

const iconCarrito = (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: "-0.2em" }}>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const linkStyle = (active: boolean, size = 16) => ({
  color: gold,
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

export default function NavPrincipal({
  pagina,
  setPagina,
  onTerminarCompra: _onTerminarCompra,
  esAppNativa
}: NavPrincipalProps) {
  const { cart, accesoAdmin, velas, inciensos, figuras, kits, abrirTiendaConCategoria } = useApp();
  const totalItemsCarrito = cart.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
  const [inicioMenuAbierto, setInicioMenuAbierto] = useState(false);
  const [productosDesplegableAbierto, setProductosDesplegableAbierto] = useState(false);
  const [legalDesplegableAbierto, setLegalDesplegableAbierto] = useState(false);
  const inicioMenuRef = useRef<HTMLDivElement>(null);

  const LEGAL_LINKS = [
    { label: "Aviso Legal", href: "/aviso-legal.html" },
    { label: "Política de Cookies", href: "/politica-cookies.html" },
    { label: "Política de Privacidad", href: "/politica-privacidad.html" },
    { label: "Términos y Condiciones", href: "/terminos-condiciones.html" },
  ] as const;

  const btnMenuInicio = {
    display: "block" as const,
    width: "100%" as const,
    padding: "10px 12px",
    marginBottom: 6,
    border: "1px solid rgba(201,162,74,0.4)",
    borderRadius: 8,
    background: "transparent",
    color: "#e5c07b",
    cursor: "pointer" as const,
    fontWeight: 500,
    fontSize: 14,
    textAlign: "left" as const
  };
  const btnProductoLista = {
    display: "block" as const,
    width: "100%" as const,
    padding: "6px 10px",
    marginBottom: 2,
    border: "none",
    borderRadius: 6,
    background: "transparent",
    color: "rgba(255,255,255,0.9)",
    cursor: "pointer" as const,
    fontSize: 13,
    textAlign: "left" as const
  };
  const linkLegal = {
    display: "block" as const,
    padding: "6px 10px",
    marginBottom: 2,
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    textDecoration: "none" as const
  };

  const productosPorCategoria = useMemo(() => {
    const listas: Record<string, Producto[]> = {
      velas: velas ?? [],
      inciensos: inciensos ?? [],
      figuras: figuras ?? [],
      kits: kits ?? []
    };
    return listas;
  }, [velas, inciensos, figuras, kits]);

  useEffect(() => {
    const cerrar = (e: MouseEvent) => {
      if (inicioMenuRef.current && !inicioMenuRef.current.contains(e.target as Node)) {
        setInicioMenuAbierto(false);
      }
    };
    if (inicioMenuAbierto) {
      document.addEventListener("click", cerrar);
      return () => document.removeEventListener("click", cerrar);
    }
  }, [inicioMenuAbierto]);

  useEffect(() => {
    if (!inicioMenuAbierto) {
      setProductosDesplegableAbierto(false);
      setLegalDesplegableAbierto(false);
    }
  }, [inicioMenuAbierto]);

  const onOpcionInicio = (opcion: (typeof MENU_INICIO_OPCIONES)[number]) => {
    if (opcion.accion === "tienda") setPagina("tienda");
    else if (opcion.accion === "anchor" && opcion.anchor) {
      setPagina("inicio");
      setTimeout(() => {
        document.getElementById(opcion.anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, pagina === "inicio" ? 50 : 400);
    } else if (opcion.accion === "whatsapp") {
      window.open("https://wa.me/34673175547?text=Hola%20Maika%2C%20quiero%20más%20información", "_blank");
    }
    setInicioMenuAbierto(false);
  };

  const NavLink = ({
    onClick,
    active,
    children
  }: {
    onClick: () => void;
    active: boolean;
    children: ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      style={{ ...linkStyle(active), display: "inline-flex", alignItems: "center" }}
      className="app-nav-link"
    >
      {children}
    </button>
  );

  return (
    <div
      className="app-topbar app-topbar--hero-style"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: 20,
        marginBottom: 30,
        borderBottom: "2px solid rgba(229, 192, 123, 0.35)",
        paddingBottom: 16,
        paddingTop: 8
      }}
    >
      <nav className="app-nav-links" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        {pagina !== "tienda" && (
          <div ref={inicioMenuRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setInicioMenuAbierto((v) => !v); }}
              style={{ ...linkStyle(pagina === "inicio"), display: "inline-flex", alignItems: "center" }}
              className="app-nav-link"
              aria-expanded={inicioMenuAbierto}
              aria-haspopup="true"
            >
              Inicio
            </button>
            {inicioMenuAbierto && (
              <div
                className="app-inicio-dropdown"
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: 8,
                  padding: "10px 12px",
                  background: "rgba(11, 11, 13, 0.98)",
                  border: "2px solid #C9A24A",
                  borderRadius: 12,
                  minWidth: 220,
                  maxWidth: 320,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                  zIndex: 1000
                }}
              >
                {MENU_INICIO_OPCIONES.slice(0, 2).map((opcion) => (
                  <button key={opcion.id} type="button" onClick={() => onOpcionInicio(opcion)} style={btnMenuInicio}>
                    {opcion.label}
                  </button>
                ))}
                <button type="button" onClick={(e) => { e.stopPropagation(); setProductosDesplegableAbierto((v) => !v); }} style={btnMenuInicio}>
                  🛍️ Productos {productosDesplegableAbierto ? "▼" : "▶"}
                </button>
                {productosDesplegableAbierto && (
                  <div style={{ maxHeight: 280, overflowY: "auto", marginBottom: 6, paddingLeft: 4, borderLeft: "2px solid rgba(201,162,74,0.3)" }}>
                    {CATEGORIAS_ORDEN.map((catId) => {
                      const productos = productosPorCategoria[catId] ?? [];
                      if (productos.length === 0) return null;
                      return (
                        <div key={catId} style={{ marginBottom: 10 }}>
                          <div style={{ color: "#C9A24A", fontWeight: "bold", fontSize: 12, marginBottom: 4 }}>{CAT_LABEL[catId]}</div>
                          {productos.map((p) => (
                            <button key={`${catId}-${p.id}`} type="button" onClick={() => { abrirTiendaConCategoria(catId); setPagina("tienda"); setInicioMenuAbierto(false); }} style={btnProductoLista}>
                              {p.nombre}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
                {MENU_INICIO_OPCIONES.slice(2).map((opcion) => (
                  <button key={opcion.id} type="button" onClick={() => onOpcionInicio(opcion)} style={btnMenuInicio}>
                    {opcion.label}
                  </button>
                ))}
                <button type="button" onClick={(e) => { e.stopPropagation(); setLegalDesplegableAbierto((v) => !v); }} style={btnMenuInicio}>
                  📜 Legal
                </button>
                {legalDesplegableAbierto && (
                  <div style={{ marginBottom: 6, paddingLeft: 4, borderLeft: "2px solid rgba(201,162,74,0.3)" }}>
                    {LEGAL_LINKS.map((item) => (
                      <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" style={linkLegal} onClick={() => setInicioMenuAbierto(false)}>
                        {item.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {!accesoAdmin && (
          <NavLink onClick={() => setPagina("seguimiento")} active={pagina === "seguimiento"}>
            {iconSeguimiento} Seguimiento
          </NavLink>
        )}
        <NavLink onClick={() => setPagina("cuenta")} active={pagina === "cuenta"}>
          Mi Cuenta
        </NavLink>
        {!esAppNativa && (
          <NavLink onClick={() => setPagina("admin")} active={pagina === "admin"}>
            {iconAdmin} <span className="app-nav-admin-label">ADMIN</span>
          </NavLink>
        )}
      </nav>

      <div className="app-topbar__right app-topbar__right--btns-aligned">
        <button
          type="button"
          onClick={() => setPagina("carrito")}
          className="app-nav-link app-nav-link--carrito app-nav-link--right"
          style={{ ...linkStyle(false), color: gold }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
            (<span style={{ display: "inline-flex", alignItems: "center" }}>{iconCarrito}</span>
            {totalItemsCarrito})
          </span>{" "}
          {totalItemsCarrito === 1 ? "artículo" : "artículos"}
        </button>
        <button
          type="button"
          onClick={() => setPagina("favoritos")}
          className="app-nav-link app-nav-link--right"
          style={{ ...linkStyle(pagina === "favoritos") }}
        >
          {iconFavoritos} Favoritos
        </button>
      </div>
    </div>
  );
}
