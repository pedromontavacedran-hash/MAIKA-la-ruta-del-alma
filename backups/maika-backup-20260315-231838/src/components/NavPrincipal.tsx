import { useState, useRef, useEffect, useMemo, type ReactNode } from "react";
import { useApp } from "../context/AppContext";
import type { Pagina } from "../types";
import type { Producto } from "../types";

/** Orden: 1 Tienda, 2 Servicios, 3 Productos, 4 Sobre Maika, 5 Contacto, 6 Envíos, 7 Legal */
const MENU_INICIO_OPCIONES = [
  { id: "tienda", label: "Tienda", accion: "tienda" as const },
  { id: "servicios", label: "Servicios", accion: "anchor" as const, anchor: "inicio-servicios" },
  { id: "empresa", label: "Sobre Maika", accion: "anchor" as const, anchor: "inicio-empresa" },
  { id: "contacto", label: "Contacto", accion: "whatsapp" as const },
  { id: "envios", label: "Envíos", accion: "anchor" as const, anchor: "inicio-envios" },
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
  <svg width="1.8em" height="1.8em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: "-0.2em" }}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const iconLupa = (
  <svg width="1.8em" height="1.8em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: "-0.2em", background: "transparent" }}>
    <circle cx="11" cy="11" r="8" fill="none" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const iconCarrito = (
  <svg width="1.8em" height="1.8em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: "-0.2em" }}>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const iconMenuTresLineas = (
  <svg width="1.8em" height="1.8em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const iconCerrar = (
  <svg width="1.1em" height="1.1em" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block" }}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const iconPersona = (
  <svg width="2em" height="2em" viewBox="0 0 24 24" fill="none" stroke="#F5E6C8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M20 21a8 8 0 0 0-16 0" />
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
  const { cart, accesoAdmin, velas, inciensos, figuras, kits, abrirTiendaConCategoria, setBusquedaTienda, openLegal } = useApp();
  const totalItemsCarrito = cart.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
  const [inicioMenuAbierto, setInicioMenuAbierto] = useState(false);
  const [productosDesplegableAbierto, setProductosDesplegableAbierto] = useState(false);
  const [legalDesplegableAbierto, setLegalDesplegableAbierto] = useState(false);
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const inicioMenuRef = useRef<HTMLDivElement>(null);
  const inicioDropdownRef = useRef<HTMLDivElement>(null);

  const irABuscarEnTienda = () => {
    setBusquedaTienda(textoBusqueda.trim());
    setPagina("tienda");
    setInicioMenuAbierto(false);
    setTextoBusqueda("");
  };

  const LEGAL_LINKS: { label: string; doc: "aviso-legal" | "politica-cookies" | "politica-privacidad" | "terminos-condiciones" }[] = [
    { label: "Aviso Legal", doc: "aviso-legal" },
    { label: "Política de Cookies", doc: "politica-cookies" },
    { label: "Política de Privacidad", doc: "politica-privacidad" },
    { label: "Términos y Condiciones", doc: "terminos-condiciones" },
  ];

  const itemMenuInicio = {
    display: "block" as const,
    width: "100%" as const,
    padding: "8px 0",
    border: "none",
    borderRadius: 0,
    background: "none",
    color: "white",
    cursor: "pointer" as const,
    fontWeight: 500,
    fontSize: 17,
    textAlign: "left" as const
  };
  const lineaSeparadora = { border: "none" as const, borderTop: "1px solid rgba(201,162,74,0.35)", margin: "4px 0", padding: 0 };
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
    fontSize: 15,
    textAlign: "left" as const
  };
  const linkLegal = {
    display: "block" as const,
    padding: "6px 10px",
    marginBottom: 2,
    color: "rgba(255,255,255,0.9)",
    fontSize: 15,
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
      const target = e.target as Node;
      const dentroMenu = inicioMenuRef.current?.contains(target);
      const dentroDropdown = inicioDropdownRef.current?.contains(target);
      if (!dentroMenu && !dentroDropdown) {
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
      const anchorId = opcion.anchor;
      setPagina("inicio");
      setInicioMenuAbierto(false);
      const delay = pagina === "inicio" ? 100 : 600;
      setTimeout(() => {
        const el = document.getElementById(anchorId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          requestAnimationFrame(() => {
            document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        }
      }, delay);
      return;
    } else if (opcion.accion === "whatsapp") {
      window.open("https://wa.me/34673175547?text=Hola%20Maika%2C%20quiero%20más%20información", "_blank");
    }
    setInicioMenuAbierto(false);
  };

  const NavLink = ({
    onClick,
    active,
    children,
    className = "",
    "aria-label": ariaLabel,
    title
  }: {
    onClick: () => void;
    active: boolean;
    children: ReactNode;
    className?: string;
    "aria-label"?: string;
    title?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      style={{ ...linkStyle(active), display: "inline-flex", alignItems: "center" }}
      className={`app-nav-link ${className}`.trim()}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </button>
  );

  const logoCuadrado = (
    <div style={{ background: "#E6C77A", padding: 10, borderRadius: 8, width: 100, height: 100, minWidth: 100, minHeight: 100, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
      <img src="/logotipo.jpg" alt="Maika" style={{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", objectFit: "contain" }} />
    </div>
  );

  return (
    <>
    <div
      className="app-topbar app-topbar--hero-style"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-end",
        flexWrap: "wrap",
        gap: 20,
        paddingBottom: 16,
        paddingTop: 8,
        paddingLeft: 20,
        paddingRight: 20,
        borderBottom: "2px solid rgba(229, 192, 123, 0.35)",
        background: "#0B0B0D"
      }}
    >
      {pagina !== "tienda" && (
        <div ref={inicioMenuRef} style={{ position: "relative", display: "flex", alignItems: "flex-end" }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setInicioMenuAbierto((v) => !v); }}
            style={{ ...linkStyle(pagina === "inicio"), display: "inline-flex", alignItems: "center" }}
            className="app-nav-link"
            aria-expanded={inicioMenuAbierto}
            aria-haspopup="true"
            aria-label="Menú"
            title="Menú"
          >
            {iconMenuTresLineas}
          </button>
        </div>
      )}
      {logoCuadrado}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flex: 1, flexWrap: "wrap", gap: 20, minWidth: 0 }}>
      <nav className="app-nav-links" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        {!esAppNativa && (
          <NavLink onClick={() => setPagina("admin")} active={pagina === "admin"}>
            {iconAdmin} <span className="app-nav-admin-label">ADMIN</span>
          </NavLink>
        )}
      </nav>

      <div className="app-topbar__right app-topbar__right--btns-aligned">
        <NavLink onClick={() => setPagina("cuenta")} active={pagina === "cuenta"} aria-label="Mi Cuenta" title="Mi Cuenta" className="app-nav-link--right">
          {iconPersona}
        </NavLink>
        <button
          type="button"
          onClick={() => setPagina("carrito")}
          className="app-nav-link app-nav-link--carrito app-nav-link--right"
          style={{ ...linkStyle(false), color: gold }}
          aria-label={totalItemsCarrito > 0 ? `Carrito: ${totalItemsCarrito} artículo${totalItemsCarrito === 1 ? "" : "s"}` : "Carrito"}
          title="Carrito"
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center" }}>{iconCarrito}</span>
            {totalItemsCarrito > 0 && <span style={{ fontSize: "0.95em" }}>({totalItemsCarrito})</span>}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setPagina("favoritos")}
          className="app-nav-link app-nav-link--right"
          style={{ ...linkStyle(pagina === "favoritos") }}
          aria-label="Favoritos"
          title="Favoritos"
        >
          {iconFavoritos}
        </button>
        {!accesoAdmin && (
          <button
            type="button"
            onClick={() => setPagina("seguimiento")}
            className="app-nav-link app-nav-link--right"
            style={{ ...linkStyle(pagina === "seguimiento") }}
            aria-label="Seguimiento"
            title="Seguimiento"
          >
            {iconLupa}
          </button>
        )}
      </div>
      </div>
    </div>
    {inicioMenuAbierto && pagina !== "tienda" && (
      <div
        ref={inicioDropdownRef}
        className="app-inicio-dropdown app-inicio-dropdown--overlay"
        style={{
          position: "fixed",
          top: 110,
          left: 0,
          zIndex: 1100,
          width: "100%",
          maxWidth: "min(50vw, 420px)",
          padding: "16px 20px",
          background: "#0B0B0D",
          borderBottom: "2px solid rgba(229, 192, 123, 0.35)",
          boxSizing: "border-box",
          maxHeight: "min(75vh, 520px)",
          overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", width: "100%", marginBottom: 4, marginRight: -16 }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setInicioMenuAbierto(false); }}
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 8, display: "inline-flex", alignItems: "center", marginRight: -8 }}
            aria-label="Cerrar menú"
            title="Cerrar"
          >
            <span style={{ fontSize: "1.75rem", lineHeight: 1, display: "inline-flex" }}>{iconCerrar}</span>
          </button>
        </div>
        <hr style={lineaSeparadora} />
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <input
              type="search"
              placeholder="Buscar en tienda..."
              value={textoBusqueda}
              onChange={(e) => setTextoBusqueda(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") irABuscarEnTienda(); }}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: 8,
                border: "2px solid rgba(201,162,74,0.5)",
                background: "#0B0B0D",
                color: "white",
                fontSize: 14
              }}
            />
            <button
              type="button"
              onClick={irABuscarEnTienda}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "2px solid #C9A24A",
                background: "#C9A24A",
                color: "#1b1745",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: 13
              }}
            >
              Buscar
            </button>
          </div>
        </div>
        <hr style={lineaSeparadora} />
        {MENU_INICIO_OPCIONES.slice(0, 2).map((opcion) => (
          <div key={opcion.id}>
            <button type="button" onClick={() => onOpcionInicio(opcion)} style={itemMenuInicio}>
              {opcion.label}
            </button>
            <hr style={lineaSeparadora} />
          </div>
        ))}
        <div>
          <button type="button" onClick={(e) => { e.stopPropagation(); setProductosDesplegableAbierto((v) => !v); }} style={itemMenuInicio}>
            Productos
          </button>
          <hr style={lineaSeparadora} />
        </div>
        {productosDesplegableAbierto && (
          <div style={{ maxHeight: 280, overflowY: "auto", marginBottom: 6, paddingLeft: 4, borderLeft: "2px solid rgba(201,162,74,0.3)" }}>
            {CATEGORIAS_ORDEN.map((catId) => {
              const productos = productosPorCategoria[catId] ?? [];
              if (productos.length === 0) return null;
              return (
                <div key={catId} style={{ marginBottom: 10 }}>
                  <div style={{ color: "#C9A24A", fontWeight: "bold", fontSize: 14, marginBottom: 4 }}>{CAT_LABEL[catId]}</div>
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
          <div key={opcion.id}>
            <button type="button" onClick={() => onOpcionInicio(opcion)} style={itemMenuInicio}>
              {opcion.label}
            </button>
            <hr style={lineaSeparadora} />
          </div>
        ))}
        <div>
          <button type="button" onClick={(e) => { e.stopPropagation(); setLegalDesplegableAbierto((v) => !v); }} style={itemMenuInicio}>
            Legal
          </button>
          <hr style={lineaSeparadora} />
        </div>
        {legalDesplegableAbierto && (
          <div style={{ marginBottom: 6, paddingLeft: 4, borderLeft: "2px solid rgba(201,162,74,0.3)" }}>
            {LEGAL_LINKS.map((item) => (
              <button
                key={item.doc}
                type="button"
                style={{ ...linkLegal, background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
                onClick={() => { openLegal(item.doc); setInicioMenuAbierto(false); }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    )}
    <div style={{ height: 150, minHeight: 150 }} aria-hidden="true" />
    </>
  );
}
