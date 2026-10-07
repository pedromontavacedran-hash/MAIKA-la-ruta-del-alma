import { useEffect, useState } from "react";
import type { Producto } from "../../types";
import { THEME } from "../../config";
import { useApp } from "../../context/AppContext";
import { fetchProductosTienda } from "../../services/apiProductos";
import { categoriasPorDefecto, getProductImageSrc } from "../../tienda/tiendaHelpers";
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

type ItemPreview = { key: string; src: string | null; titulo: string; descripcion: string };
type SeccionPreview = { id: string; titulo: string; unidad: string; items: ItemPreview[] };

function TarjetaPreview({ item }: { item: ItemPreview }) {
  return (
    <article
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid rgba(212,175,55,0.22)",
        background: "rgba(255,255,255,0.04)",
        display: "flex",
        flexDirection: "column"
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
      <div style={{ padding: "12px 14px 14px" }}>
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
              color: "rgba(255,255,255,0.6)"
            }}
          >
            {item.descripcion}
          </p>
        ) : null}
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
  const { serviciosInicio } = useApp();
  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [cargando, setCargando] = useState(true);
  /** Secciones desplegables: Inciensos abierto por defecto; el clic abre/cierra. */
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set(["cat-inciensos"]));

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

  const secciones: SeccionPreview[] = ordenarCategorias([...porCategoria.keys()]).map((cat) => ({
    id: `cat-${cat}`,
    titulo: etiquetaCategoria(cat),
    unidad: "producto",
    items: (porCategoria.get(cat) ?? []).map((p) => ({
      key: `${cat}-${p.id}`,
      src: getProductImageSrc(p),
      titulo: p.nombre,
      descripcion: p.descripcion ?? ""
    }))
  }));

  const servicios = (serviciosInicio ?? []).filter((s) => s?.titulo);
  if (servicios.length > 0) {
    secciones.unshift({
      id: "servicios",
      titulo: "Servicios",
      unidad: "servicio",
      items: servicios.map((s, i) => ({
        key: `servicio-${i}-${s.titulo}`,
        src: s.imagen || null,
        titulo: s.titulo,
        descripcion: [s.fraseBreve, s.duracion].filter(Boolean).join(" · ")
      }))
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
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
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
                  {seccion.items.length} {seccion.items.length === 1 ? seccion.unidad : `${seccion.unidad}s`}
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
            </button>
            {abierta ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                  gap: 16
                }}
              >
                {seccion.items.map((item) => (
                  <TarjetaPreview key={item.key} item={item} />
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
