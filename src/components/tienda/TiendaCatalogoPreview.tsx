import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Producto } from "../../types";
import { THEME } from "../../config";
import { useApp } from "../../context/AppContext";
import { fetchProductosTienda } from "../../services/apiProductos";
import { categoriasPorDefecto, getProductImageSrc } from "../../tienda/tiendaHelpers";
import type { ImagenLightbox } from "../../tienda/tiendaHelpers";
import { TiendaLightbox } from "../../tienda/TiendaLightbox";
import {
  VELAS_INICIALES,
  INCIENSOS_INICIALES,
  FIGURAS_INICIALES,
  KITS_INICIALES,
  JOYAS_INICIALES
} from "../../data/catalogoInicial";

/**
 * Ids ocultos del escaparate «Próximamente» (solo presentación; no afecta a la
 * tienda real ni a los datos). 303 = Brazalete Infinito: su imagen es un póster
 * con el precio impreso («29,90 €»), que no debe mostrarse en esta fase.
 */
const IDS_OCULTOS_PREVIEW = new Set<number>([303]);

/** Fichas de cabecera por sección (recortadas del arte en public/tienda/). */
const CABECERA_SECCION: Record<string, string> = {
  servicios: "/tienda/cabecera-servicios.webp",
  inciensos: "/tienda/cabecera-inciensos.webp",
  kits: "/tienda/cabecera-colecciones.webp"
};

const catalogoInicialPlano: Producto[] = [
  ...VELAS_INICIALES,
  ...INCIENSOS_INICIALES,
  ...FIGURAS_INICIALES,
  ...KITS_INICIALES,
  ...JOYAS_INICIALES
];

function etiquetaCategoria(id: string): string {
  const encontrada = categoriasPorDefecto.find((c) => c.id === id);
  return encontrada?.nombre ?? id;
}

function ordenarCategorias(ids: string[]): string[] {
  const orden = categoriasPorDefecto.map((c) => c.id);
  return [...ids].sort((a, b) => {
    const ia = orden.indexOf(a);
    const ib = orden.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

type ItemPreview = { key: string; src: string | null; titulo: string; descripcion: string; precio: number | null; producto?: Producto };
type GrupoPreview = { id: string; titulo: string | null; imagen: (string | null)[]; items: ItemPreview[] };
type SeccionPreview = { id: string; titulo: string; unidad: string; imagen: string | null; grupos: GrupoPreview[]; total: number };

/** Imagen con cadena de fallbacks (portada de marca → primera foto de producto). */
function ImgConFallback({ srcs, alt, style }: { srcs: (string | null | undefined)[]; alt: string; style?: CSSProperties }) {
  const [idx, setIdx] = useState(0);
  const validas = srcs.filter((s): s is string => Boolean(s));
  if (idx >= validas.length) return null;
  return (
    <img
      src={validas[idx]}
      alt={alt}
      loading="lazy"
      onError={() => setIdx(idx + 1)}
      style={style}
    />
  );
}

function TarjetaPreview({ item, onAmpliar, onAnadir }: { item: ItemPreview; onAmpliar: (item: ItemPreview) => void; onAnadir: (item: ItemPreview) => void }) {
  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Ver ${item.titulo} en grande`}
      onClick={() => item.src && onAmpliar(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (item.src) onAmpliar(item);
        }
      }}
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid rgba(212,175,55,0.22)",
        background: "rgba(255,255,255,0.04)",
        display: "flex",
        flexDirection: "column",
        cursor: item.src ? "zoom-in" : "default",
        minHeight: 220
      }}
    >
      <div style={{ position: "relative", aspectRatio: "1 / 1", background: "rgba(0,0,0,0.35)" }}>
        {item.src ? (
          <img
            src={item.src}
            alt={item.titulo}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : null}
        <span
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            padding: "3px 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.4,
            color: THEME.bg,
            background: THEME.goldGradient,
            border: `1px solid ${THEME.goldMain}`
          }}
        >
          Próximamente
        </span>
      </div>
      <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", flex: 1 }}>
        <h4
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 700,
            color: "rgba(255,255,255,0.92)",
            lineHeight: 1.3
          }}
        >
          {item.titulo}
        </h4>
        {item.descripcion ? (
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 12,
              lineHeight: 1.45,
              color: "rgba(255,255,255,0.6)",
              flex: 1
            }}
          >
            {item.descripcion}
          </p>
        ) : null}
        {item.precio != null ? (
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 15,
              fontWeight: 700,
              color: THEME.goldMain,
              lineHeight: 1.2
            }}
          >
            {item.precio.toFixed(2)} €
          </p>
        ) : null}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAnadir(item);
          }}
          style={{
            marginTop: 10,
            padding: "8px 12px",
            fontSize: 13,
            fontWeight: 600,
            color: THEME.goldMain,
            background: "rgba(212, 175, 55, 0.1)",
            border: "1px solid rgba(212, 175, 55, 0.3)",
            borderRadius: 8,
            cursor: "pointer",
            textAlign: "center",
            display: "block",
            width: "100%",
            transition: "background 0.2s ease, border-color 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(212, 175, 55, 0.2)";
            e.currentTarget.style.borderColor = "rgba(212, 175, 55, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(212, 175, 55, 0.1)";
            e.currentTarget.style.borderColor = "rgba(212, 175, 55, 0.3)";
          }}
        >
          🛒 Añadir al carrito
        </button>
      </div>
    </article>
  );
}

/**
 * Catálogo informativo «Próximamente» para `/tienda` mientras `TIENDA_PUBLICA` es
 * `false`: imagen, nombre y descripción de los productos reales (GET /productos,
 * solo activos; si el backend no responde se usa el catálogo inicial del repo),
 * más los servicios de Inicio. Sin precio, sin botón de compra ni de reserva,
 * sin carrito: nada aquí inicia una compra.
 */
export default function TiendaCatalogoPreview() {
  const { serviciosInicio, subcategoriasCatalogo, agregarAlCarrito } = useApp();
  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [cargando, setCargando] = useState(true);
  const [lightbox, setLightbox] = useState<ImagenLightbox | null>(null);
  /** Secciones desplegables: Inciensos abierto por defecto; el clic abre/cierra. */
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set(["cat-inciensos"]));
  /** Subgrupos (subcategorías) desplegables dentro de cada sección: cerrados por defecto. */
  const [gruposAbiertos, setGruposAbiertos] = useState<Set<string>>(new Set());

  const alternar = (set: Set<string>, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  useEffect(() => {
    let vivo = true;
    void fetchProductosTienda()
      .then((list) => {
        if (!vivo) return;
        const base = list && list.length > 0 ? list : catalogoInicialPlano;
        setProductos(base.filter((p) => p.activo !== false && !IDS_OCULTOS_PREVIEW.has(Number(p.id))));
      })
      .finally(() => {
        if (vivo) setCargando(false);
      });
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  if (cargando) {
    return (
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 28 }}>
        Cargando productos…
      </p>
    );
  }

  const porCategoria = new Map<string, Producto[]>();
  for (const p of productos ?? []) {
    const cat = String(p.categoria || "otros");
    const lista = porCategoria.get(cat) ?? [];
    lista.push(p);
    porCategoria.set(cat, lista);
  }

  const aItem = (cat: string, p: Producto): ItemPreview => ({
    key: `${cat}-${p.id}`,
    src: getProductImageSrc(p),
    titulo: p.nombre,
    descripcion: p.descripcion ?? "",
    precio: p.precio ?? null,
    producto: p
  });

  const secciones: SeccionPreview[] = ordenarCategorias([...porCategoria.keys()]).map((cat) => {
    const lista = porCategoria.get(cat) ?? [];
    /** Productos sin subcategoría primero; luego un grupo por subcategoría, en el orden del catálogo. */
    const sinSub = lista.filter((p) => !p.subcategoriaId);
    const subs = (subcategoriasCatalogo ?? []).filter((s) => s.categoriaId === cat);
    const grupos: GrupoPreview[] = [];
    /** Cabecera de marca: portada-banner.jpg en la carpeta de la primera
     * foto del grupo; si falla, la propia foto del producto. */
    const imagenGrupo = (items: ItemPreview[]): (string | null)[] => {
      const primera = items.find((it) => it.src)?.src ?? null;
      const portada = primera && primera.startsWith("/tienda/")
        ? `${primera.slice(0, primera.lastIndexOf("/") + 1)}portada-banner.jpg`
        : null;
      return [portada, primera];
    };
    if (sinSub.length > 0) grupos.push({ id: `${cat}-general`, titulo: null, imagen: [], items: sinSub.map((p) => aItem(cat, p)) });
    for (const sub of subs) {
      const items = lista.filter((p) => p.subcategoriaId === sub.id).map((p) => aItem(cat, p));
      if (items.length > 0) grupos.push({ id: `${cat}-${sub.id}`, titulo: sub.nombre, imagen: imagenGrupo(items), items });
    }
    return { id: `cat-${cat}`, titulo: etiquetaCategoria(cat), unidad: "producto", imagen: CABECERA_SECCION[cat] ?? null, grupos, total: lista.length };
  });

  const servicios = (serviciosInicio ?? []).filter((s) => s?.titulo);
  if (servicios.length > 0) {
    secciones.unshift({
      id: "servicios",
      titulo: "Servicios",
      unidad: "servicio",
      imagen: CABECERA_SECCION.servicios,
      grupos: [
        {
          id: "servicios-general",
          titulo: null,
          imagen: [],
          items: servicios.map((s, i) => ({
            key: `servicio-${i}-${s.titulo}`,
            src: s.imagen || null,
            titulo: s.titulo,
            descripcion: [s.fraseBreve, s.duracion].filter(Boolean).join(" · "),
            precio: null
          }))
        }
      ],
      total: servicios.length
    });
  }

  if (secciones.length === 0) return null;

  return (
    <div style={{ marginTop: 56, textAlign: "left" }}>
      {secciones.map((seccion) => {
        const abierta = abiertas.has(seccion.id);
        return (
          <section key={seccion.id} style={{ marginBottom: 28 }}>
            <button
              type="button"
              aria-expanded={abierta}
              onClick={() =>
                setAbiertas((prev) => {
                  const next = new Set(prev);
                  if (next.has(seccion.id)) next.delete(seccion.id);
                  else next.add(seccion.id);
                  return next;
                })
              }
              style={{
                display: "block",
                width: "100%",
                padding: "10px 2px 8px",
                marginBottom: abierta ? 14 : 0,
                background: "none",
                border: "none",
                borderBottom: `1px solid rgba(212,175,55,0.3)`,
                cursor: "pointer",
                color: THEME.goldMain,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 0.6,
                textTransform: "capitalize",
                textAlign: "left"
              }}
            >
              {seccion.imagen && !abierta ? (
                <span
                  style={{
                    position: "relative",
                    display: "block",
                    borderRadius: 14,
                    overflow: "hidden",
                    border: "1px solid rgba(212,175,55,0.35)",
                    marginBottom: 6
                  }}
                >
                  <img
                    src={seccion.imagen}
                    alt={seccion.titulo}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      objectFit: "cover"
                    }}
                  />
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      right: 12,
                      bottom: 10,
                      padding: "4px 9px",
                      borderRadius: 999,
                      background: "rgba(0,0,0,0.55)",
                      border: "1px solid rgba(212,175,55,0.5)",
                      fontSize: 12,
                      color: THEME.goldMain,
                      transform: abierta ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease"
                    }}
                  >
                    ▼
                  </span>
                </span>
              ) : (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10
                  }}
                >
                  <span>
                    {seccion.titulo}
                    <span
                      style={{
                        marginLeft: 10,
                        fontSize: 12,
                        fontWeight: 400,
                        color: "rgba(255,255,255,0.5)",
                        textTransform: "none",
                        letterSpacing: 0
                      }}
                    >
                      {seccion.total} {seccion.total === 1 ? seccion.unidad : `${seccion.unidad}s`}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    style={{
                      fontSize: 13,
                      transform: abierta ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease"
                    }}
                  >
                    ▼
                  </span>
                </span>
              )}
            </button>
            {abierta
              ? seccion.grupos.map((grupo) => {
                  const grupoAbierto = grupo.titulo == null || gruposAbiertos.has(grupo.id);
                  return (
                    <div key={grupo.id} style={{ marginBottom: 18 }}>
                      {grupo.titulo ? (
                        <button
                          type="button"
                          aria-expanded={grupoAbierto}
                          onClick={() => setGruposAbiertos((prev) => alternar(prev, grupo.id))}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                            width: "100%",
                            padding: "6px 2px",
                            marginBottom: grupoAbierto ? 12 : 0,
                            background: "none",
                            border: "none",
                            borderBottom: "1px solid rgba(212,175,55,0.15)",
                            cursor: "pointer",
                            fontSize: 14,
                            fontWeight: 700,
                            letterSpacing: 0.5,
                            color: "rgba(255,255,255,0.75)",
                            textTransform: "uppercase",
                            textAlign: "left"
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {grupo.imagen.length > 0 ? (
                              <ImgConFallback
                                srcs={grupo.imagen}
                                alt={grupo.titulo}
                                style={{
                                  width: 52,
                                  height: 38,
                                  objectFit: "cover",
                                  borderRadius: 7,
                                  border: "1px solid rgba(212,175,55,0.25)",
                                  flexShrink: 0
                                }}
                              />
                            ) : null}
                            <span>
                              {grupo.titulo}
                              <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: "rgba(255,255,255,0.5)", textTransform: "none" }}>
                                {grupo.items.length} {grupo.items.length === 1 ? "producto" : "productos"}
                              </span>
                            </span>
                          </span>
                          <span
                            aria-hidden="true"
                            style={{ fontSize: 11, transform: grupoAbierto ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
                          >
                            ▼
                          </span>
                        </button>
                      ) : null}
                      {grupoAbierto ? (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                            gap: 16
                          }}
                        >
                          {grupo.items.map((item) => (
                            <TarjetaPreview
                              key={item.key}
                              item={item}
                              onAmpliar={(it) =>
                                setLightbox({
                                  src: it.src as string,
                                  alt: it.titulo,
                                  pie: [it.titulo, it.descripcion].filter(Boolean).join(" — ")
                                })
                              }
                              onAnadir={(it) => {
                                if (it.producto) {
                                  agregarAlCarrito(it.producto);
                                }
                              }}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              : null}
          </section>
        );
      })}
      <TiendaLightbox imagen={lightbox} onClose={() => setLightbox(null)} ampliar />
    </div>
  );
}
