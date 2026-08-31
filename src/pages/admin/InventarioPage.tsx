import { useState, useCallback, useRef } from "react";
import ProductoForm from "../../components/admin/ProductoForm";
import {
  putAdminProductoApi,
  postAdminProductoApi,
  deleteAdminProductoApi,
  aplicarCatalogoActivoEnEstado
} from "../../services/apiAdminProductos";
import type { Dispatch, SetStateAction } from "react";
import type { Producto, Pagina, IntencionProducto } from "../../types";
import { INTENCIONES_OPCIONES } from "../../types";
import AdminPageNav from "../../components/admin/AdminPageNav";
import { THEME } from "../../config";
import { isAdminAuthorized } from "../../utils/adminAuth";
import { notificarExito } from "../../utils/ui/notificaciones";

type CategoriaCatalogo = "velas" | "inciensos" | "figuras" | "kits" | "joyas";

const CATEGORIAS: { id: CategoriaCatalogo; nombre: string; emoji: string }[] = [
  { id: "velas", nombre: "Velas", emoji: "🕯️" },
  { id: "inciensos", nombre: "Inciensos", emoji: "🌿" },
  { id: "figuras", nombre: "Figuras", emoji: "🪷" },
  { id: "kits", nombre: "Kits", emoji: "📦" },
  { id: "joyas", nombre: "Joyería del alma", emoji: "✨" }
];

export interface InventarioPageProps {
  setPagina: (p: Pagina) => void;
  velas: Producto[];
  setVelas: Dispatch<SetStateAction<Producto[]>>;
  inciensos: Producto[];
  setInciensos: Dispatch<SetStateAction<Producto[]>>;
  figuras: Producto[];
  setFiguras: Dispatch<SetStateAction<Producto[]>>;
  kits: Producto[];
  setKits: Dispatch<SetStateAction<Producto[]>>;
  joyas: Producto[];
  setJoyas: Dispatch<SetStateAction<Producto[]>>;
  umbralStockBajo: number;
  mostrarNotificacion: (msg: string, tipo: "normal" | "exito" | "error") => void;
}

const inputModalStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 10,
  border: `2px solid ${THEME.goldMain}`,
  background: THEME.bg,
  color: THEME.goldMain,
  fontSize: 17,
  boxSizing: "border-box",
  minHeight: 48
};

/** Lista solo lectura + acciones; la edición es solo en `ProductoForm` (modal inventario). */
type InventarioListaProductosProps = {
  categoria: CategoriaCatalogo;
  productos: Producto[];
  umbralStockBajo: number;
  abrirModalEditar: (categoria: CategoriaCatalogo, p: Producto) => void;
  solicitarEliminar: (categoria: CategoriaCatalogo, id: number, nombre: string) => void;
};

function InventarioListaProductos({
  categoria,
  productos,
  umbralStockBajo,
  abrirModalEditar,
  solicitarEliminar
}: InventarioListaProductosProps) {
  return (
    <div className="inventario-lista-compacta" style={{ marginTop: 8 }}>
      <div className="inventario-fila-grid inventario-lista-compacta__cabecera" aria-hidden>
        <span>Producto</span>
        <span>Precio venta</span>
        <span>Stock</span>
        <span className="inventario-lista-compacta__cab-act" />
      </div>
      {productos.map((p) => {
        const key = `${categoria}-${p.id}`;
        const precioNum = Number(p.precio);
        const precioBase = Number.isFinite(precioNum) ? precioNum : 0;
        const dto = p.descuentoPorcentaje != null ? Math.min(100, Math.max(0, Number(p.descuentoPorcentaje))) : 0;
        const precioVenta = dto > 0 ? Math.round(precioBase * (1 - dto / 100) * 100) / 100 : precioBase;
        const stockActual = Math.floor(Number(p.stock) || 0);
        const isBajo = stockActual <= umbralStockBajo;
        const desc = String(p.descripcion ?? "").trim();
        return (
          <article key={key} className="inventario-fila-producto">
            <div className="inventario-fila-grid inventario-fila-producto__main">
              <button
                type="button"
                className="inventario-fila-nombre"
                title="Editar producto"
                onClick={() => abrirModalEditar(categoria, p)}
              >
                <span className="inventario-fila-nombre__txt">{p.nombre}</span>
              </button>
              <div className="inventario-fila-precio" title={dto > 0 ? `Base ${precioBase.toFixed(2)} €` : undefined}>
                <span className="inventario-fila-precio__valor">{precioVenta.toFixed(2)} €</span>
                {dto > 0 && <span className="inventario-fila-precio__dto">−{dto}%</span>}
              </div>
              <div
                className={`inventario-fila-stock${isBajo ? " inventario-fila-stock--bajo" : ""}`}
                title={isBajo ? "Stock bajo — pulsa el nombre o ✏️ para editar" : "Pulsa el nombre o ✏️ para editar"}
              >
                {stockActual}
              </div>
              <div className="inventario-fila-acciones">
                <button
                  type="button"
                  className="inventario-fila-ico inventario-fila-ico--editar"
                  onClick={() => abrirModalEditar(categoria, p)}
                  aria-label={`Modificar ${p.nombre}`}
                >
                  ✏️
                </button>
                <button
                  type="button"
                  className="inventario-fila-ico inventario-fila-ico--eliminar"
                  onClick={() => solicitarEliminar(categoria, p.id, p.nombre)}
                  aria-label={`Eliminar ${p.nombre}`}
                >
                  🗑️
                </button>
              </div>
            </div>
            {desc ? (
              <p className="inventario-fila-producto__desc">{desc}</p>
            ) : (
              <p className="inventario-fila-producto__desc inventario-fila-producto__desc--vacio">Sin descripción</p>
            )}
          </article>
        );
      })}
    </div>
  );
}

export default function InventarioPage(props: InventarioPageProps) {
  const {
    setPagina,
    velas,
    setVelas,
    inciensos,
    setInciensos,
    figuras,
    setFiguras,
    kits,
    setKits,
    joyas,
    setJoyas,
    umbralStockBajo,
    mostrarNotificacion
  } = props;

  const [modalEditar, setModalEditar] = useState<{
    categoria: CategoriaCatalogo;
    id: number;
    nombre: string;
  } | null>(null);
  const [modalNuevo, setModalNuevo] = useState<CategoriaCatalogo | null>(null);
  const [mostrarListadoStockBajo, setMostrarListadoStockBajo] = useState(false);
  const [categoriaAbierta, setCategoriaAbierta] = useState<CategoriaCatalogo | null>(null);
  const [pendienteEliminar, setPendienteEliminar] = useState<{ categoria: CategoriaCatalogo; id: number; nombre: string } | null>(null);
  const [editarNombre, setEditarNombre] = useState("");
  const [editarCoste, setEditarCoste] = useState("");
  const [editarPrecio, setEditarPrecio] = useState("");
  const [editarDescuento, setEditarDescuento] = useState("");
  const [editarStock, setEditarStock] = useState("");
  const [editarIntencion, setEditarIntencion] = useState<IntencionProducto | "">("");
  const [editarParaQueSirve, setEditarParaQueSirve] = useState("");
  const [editarComoUsar, setEditarComoUsar] = useState("");
  const [editarDescripcion, setEditarDescripcion] = useState("");
  const [editarPreviewTienda, setEditarPreviewTienda] = useState<string | null>(null);
  const [editarNombreArchivoTienda, setEditarNombreArchivoTienda] = useState("");
  const [editarTamano, setEditarTamano] = useState("22");
  const [editarColor, setEditarColor] = useState("#ffffff");
  const [editarEstilo, setEditarEstilo] = useState("normal");
  const refNombre = useRef<HTMLInputElement>(null);
  const refCoste = useRef<HTMLInputElement>(null);
  const refPrecio = useRef<HTMLInputElement>(null);
  const refStock = useRef<HTMLInputElement>(null);
  const guardandoRef = useRef(false);
  /** Valor del input «stock objetivo» por fila (`categoria-id`); al guardar se fija esa cantidad en servidor. */

  const limpiarCamposEdicionModal = useCallback(() => {
    setEditarNombre("");
    setEditarCoste("");
    setEditarPrecio("");
    setEditarDescuento("");
    setEditarStock("");
    setEditarIntencion("");
    setEditarParaQueSirve("");
    setEditarComoUsar("");
    setEditarDescripcion("");
    setEditarPreviewTienda(null);
    setEditarNombreArchivoTienda("");
    setEditarTamano("22");
    setEditarColor("#ffffff");
    setEditarEstilo("normal");
  }, []);

  const getProductosByCategoria = useCallback(
    (cat: CategoriaCatalogo): Producto[] => {
      if (cat === "velas") return velas;
      if (cat === "inciensos") return inciensos;
      if (cat === "figuras") return figuras;
      if (cat === "kits") return kits;
      return joyas;
    },
    [velas, inciensos, figuras, kits, joyas]
  );

  const abrirModalEditar = useCallback(
    (categoria: CategoriaCatalogo, p: Producto) => {
      setModalNuevo(null);
      setModalEditar({ categoria, id: p.id, nombre: p.nombre });
      setEditarNombre(p.nombre ?? "");
      const coste = Number(p.precioCosteIvaIncluido);
      setEditarCoste(Number.isFinite(coste) ? String(coste) : "");
      setEditarPrecio(String(p.precio ?? ""));
      setEditarDescuento(p.descuentoPorcentaje != null ? String(p.descuentoPorcentaje) : "");
      setEditarStock(String(p.stock ?? ""));
      setEditarIntencion((p.intencion as IntencionProducto) || "");
      setEditarParaQueSirve(p.paraQueSirve ?? "");
      setEditarComoUsar(p.comoUsar ?? "");
      setEditarDescripcion(p.descripcion ?? "");
      setEditarPreviewTienda(p.imagen && String(p.imagen).trim() ? p.imagen : null);
      setEditarNombreArchivoTienda("");
      setEditarTamano(String(p.nombreTamano ?? 22));
      setEditarColor(p.nombreColor ?? "#ffffff");
      setEditarEstilo(p.nombreEstilo ?? "normal");
    },
    []
  );

  const actualizarDatos = useCallback(
    async (
      categoria: CategoriaCatalogo,
      id: number,
      nombre: string,
      coste: number,
      precio: number,
      stock: number,
      descuentoPorcentaje?: number,
      intencion?: IntencionProducto | "",
      paraQueSirve?: string,
      comoUsar?: string
    ) => {
      if (guardandoRef.current) return;
      const list =
        categoria === "velas" ? velas : categoria === "inciensos" ? inciensos : categoria === "figuras" ? figuras : categoria === "kits" ? kits : joyas;
      const p = list.find((x) => x.id === id);
      if (!p) {
        mostrarNotificacion("Producto no encontrado", "error");
        return;
      }
      const nombreFinal = String(nombre ?? "").trim() || "Sin nombre";
      const costeFinal = Number.isFinite(coste) && coste >= 0 ? coste : 0;
      const precioFinal = Number.isFinite(precio) && precio >= 0 ? precio : 0;
      const stockFinal = Math.max(0, Math.floor(Number(stock)) || 0);
      const dtoNum =
        descuentoPorcentaje != null && Number.isFinite(descuentoPorcentaje)
          ? Math.min(100, Math.max(0, Number(descuentoPorcentaje)))
          : null;

      const imagenFinal =
        editarPreviewTienda && editarPreviewTienda.startsWith("data:") ? editarPreviewTienda : p.imagen ?? "";
      const estiloTienda =
        editarEstilo === "italic" || editarEstilo === "bold" ? editarEstilo : "normal";

      const patch: Record<string, unknown> = {
        categoria,
        nombre: nombreFinal,
        precio: precioFinal,
        stock: stockFinal,
        imagen: imagenFinal,
        descripcion: editarDescripcion.trim(),
        activo: true,
        precioCosteIvaIncluido: costeFinal,
        descuentoPorcentaje: dtoNum !== null && dtoNum > 0 ? dtoNum : null,
        intencion: intencion && String(intencion).trim() ? intencion : null,
        paraQueSirve: String(paraQueSirve ?? "").trim() || null,
        comoUsar: String(comoUsar ?? "").trim() || null,
        nombreTamano: Number(editarTamano) || 22,
        nombreColor: editarColor,
        nombreEstilo: estiloTienda
      };

      guardandoRef.current = true;
      try {
        await putAdminProductoApi(id, patch);
        try {
          await aplicarCatalogoActivoEnEstado(setVelas, setInciensos, setFiguras, setKits, setJoyas);
        } catch (e2) {
          mostrarNotificacion(
            e2 instanceof Error ? `Guardado, pero al refrescar: ${e2.message}` : "Guardado; error al refrescar catálogo",
            "error"
          );
        }
        setModalEditar(null);
        limpiarCamposEdicionModal();
        notificarExito(mostrarNotificacion, "Datos guardados en el servidor");
      } catch (e) {
        mostrarNotificacion(e instanceof Error ? e.message : "Error al guardar", "error");
      } finally {
        guardandoRef.current = false;
      }
    },
    [
      velas,
      inciensos,
      figuras,
      kits,
      joyas,
      setVelas,
      setInciensos,
      setFiguras,
      setKits,
      setJoyas,
      mostrarNotificacion,
      editarDescripcion,
      editarPreviewTienda,
      editarTamano,
      editarColor,
      editarEstilo,
      limpiarCamposEdicionModal
    ]
  );

  const crearProducto = useCallback(
    async (
      categoria: CategoriaCatalogo,
      nombre: string,
      coste: number,
      precio: number,
      stock: number,
      descuentoPorcentaje?: number,
      intencion?: IntencionProducto | "",
      paraQueSirve?: string,
      comoUsar?: string
    ) => {
      if (guardandoRef.current) return;
      const nombreFinal = String(nombre ?? "").trim() || "Sin nombre";
      const costeFinal = Number.isFinite(coste) && coste >= 0 ? coste : 0;
      const precioFinal = Number.isFinite(precio) && precio >= 0 ? precio : 0;
      const stockFinal = Math.max(0, Math.floor(Number(stock)) || 0);
      const dto =
        descuentoPorcentaje != null && descuentoPorcentaje > 0
          ? Math.min(100, Math.max(0, Number(descuentoPorcentaje)))
          : undefined;
      const body: Record<string, unknown> = {
        categoria,
        nombre: nombreFinal,
        precio: precioFinal,
        stock: stockFinal,
        imagen: "",
        descripcion: "",
        activo: true,
        precioCosteIvaIncluido: costeFinal
      };
      if (dto != null && dto > 0) body.descuentoPorcentaje = dto;
      if (intencion) body.intencion = intencion;
      if (paraQueSirve?.trim()) body.paraQueSirve = paraQueSirve.trim();
      if (comoUsar?.trim()) body.comoUsar = comoUsar.trim();

      guardandoRef.current = true;
      try {
        await postAdminProductoApi(body);
        try {
          await aplicarCatalogoActivoEnEstado(setVelas, setInciensos, setFiguras, setKits, setJoyas);
        } catch (e2) {
          mostrarNotificacion(
            e2 instanceof Error ? `Creado, pero al refrescar: ${e2.message}` : "Creado; error al refrescar catálogo",
            "error"
          );
        }
        setModalNuevo(null);
        limpiarCamposEdicionModal();
        notificarExito(mostrarNotificacion, "Producto añadido en el servidor");
      } catch (e) {
        mostrarNotificacion(e instanceof Error ? e.message : "Error al crear producto", "error");
      } finally {
        guardandoRef.current = false;
      }
    },
    [setVelas, setInciensos, setFiguras, setKits, setJoyas, mostrarNotificacion, limpiarCamposEdicionModal]
  );

  const solicitarEliminar = useCallback((categoria: CategoriaCatalogo, id: number, nombre: string) => {
    setPendienteEliminar({ categoria, id, nombre });
  }, []);

  const ejecutarEliminacion = useCallback(async () => {
    if (!pendienteEliminar || guardandoRef.current) return;
    const { id } = pendienteEliminar;
    guardandoRef.current = true;
    try {
      await deleteAdminProductoApi(id);
      try {
        await aplicarCatalogoActivoEnEstado(setVelas, setInciensos, setFiguras, setKits, setJoyas);
      } catch (e2) {
        mostrarNotificacion(
          e2 instanceof Error ? `Baja aplicada, pero al refrescar: ${e2.message}` : "Baja aplicada; error al refrescar catálogo",
          "error"
        );
      }
      setModalEditar(null);
      limpiarCamposEdicionModal();
      setPendienteEliminar(null);
      mostrarNotificacion("Producto dado de baja en el servidor", "normal");
    } catch (e) {
      mostrarNotificacion(e instanceof Error ? e.message : "Error al eliminar", "error");
    } finally {
      guardandoRef.current = false;
    }
  }, [pendienteEliminar, setVelas, setInciensos, setFiguras, setKits, setJoyas, mostrarNotificacion, limpiarCamposEdicionModal]);

  return (
    <div className="inventario-page admin-layout admin-dashboard-bloque">
      <AdminPageNav
        varianteVolver="gold"
        onVolver={() => {
          if (isAdminAuthorized()) {
            setPagina("admin");
          } else {
            setPagina("inicio");
          }
        }}
      />
      <header
        className="admin-inventario-header"
        style={{
          marginBottom: 18,
          borderBottom: `1px solid color-mix(in srgb, ${THEME.goldMain} 22%, transparent)`,
          paddingBottom: 10
        }}
      >
        <h2 className="admin-panel-categoria-titulo inventario-titulo-bloque">📦 Inventario</h2>
        <button
          type="button"
          className="btn-admin-limpio admin-btn-inventario-tienda"
          onClick={() => setPagina("tienda")}
        >
          Ir a tienda →
        </button>
      </header>
      <p className="admin-inventario-linea-contexto">Gestión de productos por categoría</p>
      <p className="admin-inventario-nota-iva admin-inventario-nota-iva--discreta">IVA incluido</p>
      <details
        className="inventario-info-details"
        style={{ marginTop: 4, marginBottom: 8, color: "rgba(255,255,255,0.78)", fontSize: 13, lineHeight: 1.45 }}
      >
        <summary
          style={{
            cursor: "pointer",
            color: `color-mix(in srgb, ${THEME.goldMain} 72%, transparent)`,
            fontWeight: 500,
            fontSize: 12,
            letterSpacing: "0.02em",
            userSelect: "none",
            listStyle: "none"
          }}
        >
          ℹ️ Información
        </summary>
        <div
          style={{
            marginTop: 10,
            paddingLeft: 10,
            borderLeft: `2px solid rgba(212,175,55,0.3)`
          }}
        >
          <p style={{ margin: 0, color: "rgba(255,255,255,0.82)" }}>
            Elige una categoría. Pulsa el <strong>nombre</strong> o <strong>✏️</strong> para abrir el editor (nombre, precio, stock, descripción) y <strong>Aplicar</strong> en el modal. El coste y el descuento del catálogo no se muestran ahí pero se conservan al guardar. <strong>🗑️</strong> elimina el producto (con confirmación).
          </p>
        </div>
      </details>
      {(() => {
        const listaBajo: { nombre: string; categoria: string; categoriaId: CategoriaCatalogo; stock: number; product: Producto }[] = [
          ...velas.filter((p) => (p.stock ?? 0) <= umbralStockBajo).map((p) => ({ nombre: p.nombre, categoria: "Velas", categoriaId: "velas" as CategoriaCatalogo, stock: p.stock ?? 0, product: p })),
          ...inciensos.filter((p) => (p.stock ?? 0) <= umbralStockBajo).map((p) => ({ nombre: p.nombre, categoria: "Inciensos", categoriaId: "inciensos" as CategoriaCatalogo, stock: p.stock ?? 0, product: p })),
          ...figuras.filter((p) => (p.stock ?? 0) <= umbralStockBajo).map((p) => ({ nombre: p.nombre, categoria: "Figuras", categoriaId: "figuras" as CategoriaCatalogo, stock: p.stock ?? 0, product: p })),
          ...kits.filter((p) => (p.stock ?? 0) <= umbralStockBajo).map((p) => ({ nombre: p.nombre, categoria: "Kits", categoriaId: "kits" as CategoriaCatalogo, stock: p.stock ?? 0, product: p })),
          ...joyas.filter((p) => (p.stock ?? 0) <= umbralStockBajo).map((p) => ({ nombre: p.nombre, categoria: "Joyería del alma", categoriaId: "joyas" as CategoriaCatalogo, stock: p.stock ?? 0, product: p }))
        ];
        const conStockBajo = listaBajo.length;
        return conStockBajo > 0 ? (
          <div className="admin-inventario-stock-bajo-bloque">
            <p className="admin-inventario-stock-bajo-linea admin-inventario-stock-bajo-linea--compacta">
              <span className="admin-inventario-stock-bajo-etiqueta">
                ⚠️ {conStockBajo}{" "}
                {conStockBajo === 1 ? "producto con stock bajo" : "productos con stock bajo"}
              </span>
              <span className="admin-inventario-stock-bajo-sep" aria-hidden>
                {" "}
                —{" "}
              </span>
              <button
                type="button"
                className="admin-inventario-link-accion"
                onClick={() => setMostrarListadoStockBajo((v) => !v)}
              >
                {mostrarListadoStockBajo ? "ocultar" : "ver"}
              </button>
            </p>
            {mostrarListadoStockBajo && (
              <div style={{ marginTop: 10, overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    minWidth: 320,
                    borderCollapse: "collapse",
                    fontSize: 14,
                    border: `1px solid color-mix(in srgb, ${THEME.goldMain} 22%, transparent)`,
                    borderRadius: 10,
                    overflow: "hidden"
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: `1px solid color-mix(in srgb, ${THEME.goldMain} 30%, transparent)`,
                        background: "rgba(201, 162, 74, 0.08)"
                      }}
                    >
                      <th style={{ textAlign: "left", padding: "10px 12px", color: THEME.goldMain, fontSize: 13 }}>Producto</th>
                      <th style={{ textAlign: "left", padding: "10px 12px", color: THEME.goldMain, fontSize: 13 }}>Categoría</th>
                      <th style={{ textAlign: "right", padding: "10px 12px", color: THEME.goldMain, fontSize: 13 }}>Existencias</th>
                      <th style={{ padding: "10px 12px", color: THEME.goldMain, fontSize: 13, textAlign: "center", width: 90 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaBajo.map((item, i) => (
                      <tr
                        key={`${item.categoriaId}-${item.product.id}-${i}`}
                        onClick={() => {
                          setCategoriaAbierta(item.categoriaId);
                          abrirModalEditar(item.categoriaId, item.product);
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setCategoriaAbierta(item.categoriaId); abrirModalEditar(item.categoriaId, item.product); } }}
                        style={{
                          cursor: "pointer",
                          borderBottom: "1px solid rgba(212,175,55,0.25)",
                          background: "transparent"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 170, 0, 0.12)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <td style={{ padding: "10px 12px", color: "white" }}>{item.nombre}</td>
                        <td style={{ padding: "10px 12px", color: THEME.goldMain, opacity: 0.95 }}>{item.categoria}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", color: THEME.goldMain, fontWeight: "bold" }}>{item.stock} uds</td>
                        <td style={{ padding: "8px", textAlign: "center" }}>
                          <span style={{ fontSize: 12, color: THEME.goldMain, opacity: 0.9 }}>Modificar →</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null;
      })()}

      <div className="admin-inventario-categorias">
      {CATEGORIAS.map(({ id, nombre, emoji }) => {
        const productos = getProductosByCategoria(id);
        return (
          <details
            key={id}
            open={categoriaAbierta === id}
            className="admin-inventario-categoria"
          >
            <summary
              className="btn-admin-limpio admin-btn admin-btn--blue admin-summary-btn"
              onClick={(e) => { e.preventDefault(); setCategoriaAbierta((c) => (c === id ? null : id)); }}
            >
              <span>
                {emoji} {nombre}
              </span>
              <span style={{ fontSize: 13, opacity: 0.88, fontWeight: 600 }}>
                {productos.length} {productos.length === 1 ? "producto" : "productos"}
              </span>
            </summary>
            <div className="admin-accordion-content admin-inventario-categoria-body">
              <div style={{ marginBottom: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    setModalEditar(null);
                    setModalNuevo(id);
                    limpiarCamposEdicionModal();
                    setEditarStock("0");
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: `2px solid ${THEME.goldMain}`,
                    background: "rgba(201, 162, 74, 0.2)",
                    color: THEME.goldMain,
                    fontSize: 14,
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  + Añadir producto
                </button>
              </div>
              {productos.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.7)", fontStyle: "italic" }}>Sin productos en esta categoría.</p>
              ) : (
                <InventarioListaProductos
                  categoria={id}
                  productos={productos}
                  umbralStockBajo={umbralStockBajo}
                  abrirModalEditar={abrirModalEditar}
                  solicitarEliminar={solicitarEliminar}
                />
              )}
            </div>
          </details>
        );
      })}
      </div>

      {modalEditar && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 10
          }}
          onClick={() => {
            setModalEditar(null);
            setModalNuevo(null);
            limpiarCamposEdicionModal();
          }}
        >
          <div
            className="inventario-modal-editar inventario-modal-editar--con-form editar-productos-page"
            style={{
              background: THEME.bg,
              border: `2px solid ${THEME.goldMain}`,
              borderRadius: 14,
              width: "100%",
              boxSizing: "border-box"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <header
              className="inventario-modal-editar__header"
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 8,
                flexShrink: 0,
                borderBottom: `1px solid color-mix(in srgb, ${THEME.goldMain} 20%, transparent)`
              }}
            >
              <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "clamp(0.95rem, 2.4vw, 1.1rem)",
                    fontWeight: 800,
                    color: THEME.goldMain,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase"
                  }}
                >
                  Modificar producto
                </div>
                <div style={{ marginTop: 3, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)", lineHeight: 1.3 }}>
                  {(editarNombre || modalEditar.nombre || "").trim() || "—"}
                </div>
              </div>
              <button
                type="button"
                className="inventario-modal-btn-cerrar"
                aria-label="Cerrar"
                onClick={() => {
                  setModalEditar(null);
                  limpiarCamposEdicionModal();
                }}
              >
                ×
              </button>
            </header>

            <div className="inventario-modal-editar__body-scroll">
              <ProductoForm
                key={`${modalEditar.categoria}-${modalEditar.id}`}
                modo="inventario"
                idPrefix={`inv-${modalEditar.id}`}
                className="producto-form--inventario-modal"
                categoria={modalEditar.categoria}
                nombre={editarNombre}
                onNombreChange={setEditarNombre}
                precio={editarPrecio}
                onPrecioChange={(v) => setEditarPrecio(v.replace(",", "."))}
                descripcion={editarDescripcion}
                onDescripcionChange={setEditarDescripcion}
                previewImagen={editarPreviewTienda}
                nombreArchivoImagen={editarNombreArchivoTienda}
                onSeleccionarImagen={(file, dataUrl) => {
                  setEditarNombreArchivoTienda(file.name);
                  setEditarPreviewTienda(dataUrl);
                }}
                color={editarColor}
                onColorChange={setEditarColor}
                tamanoTexto={editarTamano}
                onTamanoTextoChange={setEditarTamano}
                estiloTexto={editarEstilo}
                onEstiloTextoChange={setEditarEstilo}
                textoVistaPreviaNombre={editarNombre}
                stockStr={editarStock}
                onStockStrChange={(v) => setEditarStock(v.replace(/[^\d]/g, ""))}
                etiquetaBotonPrincipal="Aplicar"
                onPrincipal={() => {
                  const coste = parseFloat(editarCoste.replace(",", "."));
                  const precio = parseFloat(editarPrecio.replace(",", "."));
                  const stock = parseInt(editarStock, 10);
                  const dto = editarDescuento.trim() === "" ? undefined : parseFloat(editarDescuento.replace(",", "."));
                  void actualizarDatos(
                    modalEditar.categoria,
                    modalEditar.id,
                    editarNombre,
                    coste,
                    precio,
                    stock,
                    dto,
                    editarIntencion,
                    editarParaQueSirve,
                    editarComoUsar
                  );
                }}
                onCancelar={() => {
                  setModalEditar(null);
                  limpiarCamposEdicionModal();
                }}
                onEliminar={() =>
                  solicitarEliminar(modalEditar.categoria, modalEditar.id, editarNombre || modalEditar.nombre)
                }
              />
            </div>
          </div>
        </div>
      )}

      {pendienteEliminar && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001,
            padding: 20
          }}
          onClick={() => setPendienteEliminar(null)}
        >
          <div
            style={{
              background: THEME.bg,
              border: `2px solid ${THEME.goldMain}`,
              borderRadius: 20,
              padding: 32,
              maxWidth: 520,
              width: "100%"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ color: THEME.goldMain, fontWeight: "bold", marginBottom: 12, fontSize: 22 }}>Eliminar producto</div>
            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 15, marginBottom: 20, lineHeight: 1.5 }}>
              ¿Eliminar <strong style={{ color: THEME.goldMain }}>{pendienteEliminar.nombre}</strong> del catálogo?
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setPendienteEliminar(null)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: `2px solid ${THEME.goldMain}`,
                  background: "transparent",
                  color: THEME.goldMain,
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={ejecutarEliminacion}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: "#e57373",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalNuevo && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20
          }}
          onClick={() => {
            setModalNuevo(null);
            setEditarNombre("");
            setEditarCoste("");
            setEditarPrecio("");
            setEditarStock("");
          }}
        >
          <div
            style={{
              background: THEME.bg,
              border: `2px solid ${THEME.goldMain}`,
              borderRadius: 20,
              padding: 32,
              maxWidth: 520,
              width: "100%"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ color: THEME.goldMain, fontWeight: "bold", marginBottom: 16, fontSize: 22 }}>Nuevo producto</div>

            <label style={{ display: "block", color: THEME.goldMain, marginBottom: 6, fontSize: 16 }}>Producto</label>
            <input
              ref={refNombre}
              type="text"
              value={editarNombre}
              onChange={(e) => setEditarNombre(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  refCoste.current?.focus();
                }
              }}
              placeholder="Nombre del producto"
              style={inputModalStyle}
              autoFocus
            />

            <label style={{ display: "block", color: THEME.goldMain, marginBottom: 6, marginTop: 14, fontSize: 16 }}>Precio coste (IVA incl.) €</label>
            <input
              ref={refCoste}
              type="number"
              min={0}
              step={0.01}
              value={editarCoste}
              onChange={(e) => setEditarCoste(e.target.value.replace(",", "."))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  refPrecio.current?.focus();
                }
              }}
              style={inputModalStyle}
            />

            <label style={{ display: "block", color: THEME.goldMain, marginBottom: 6, marginTop: 14, fontSize: 16 }}>Precio venta (IVA incl.) €</label>
            <input
              ref={refPrecio}
              type="number"
              min={0}
              step={0.01}
              value={editarPrecio}
              onChange={(e) => setEditarPrecio(e.target.value.replace(",", "."))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  refStock.current?.focus();
                }
              }}
              style={inputModalStyle}
            />

            <label style={{ display: "block", color: THEME.goldMain, marginBottom: 6, marginTop: 14, fontSize: 16 }}>Descuento % (0-100, opcional)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              placeholder="0"
              value={editarDescuento}
              onChange={(e) => setEditarDescuento(e.target.value.replace(",", "."))}
              style={inputModalStyle}
            />

            <label style={{ display: "block", color: THEME.goldMain, marginBottom: 6, marginTop: 14, fontSize: 16 }}>Existencias</label>
            <input
              ref={refStock}
              type="number"
              min={0}
              value={editarStock}
              onChange={(e) => setEditarStock(e.target.value.replace(/[^\d]/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const coste = parseFloat(editarCoste.replace(",", "."));
                  const precio = parseFloat(editarPrecio.replace(",", "."));
                  const stock = parseInt(editarStock, 10) || 0;
                  const dto = editarDescuento.trim() === "" ? undefined : parseFloat(editarDescuento.replace(",", "."));
                  crearProducto(modalNuevo, editarNombre, coste, precio, stock, dto, editarIntencion, editarParaQueSirve, editarComoUsar);
                }
              }}
              style={inputModalStyle}
            />

            <label style={{ display: "block", color: THEME.goldMain, marginBottom: 6, marginTop: 14, fontSize: 16 }}>Intención</label>
            <select
              value={editarIntencion}
              onChange={(e) => setEditarIntencion((e.target.value || "") as IntencionProducto | "")}
              style={inputModalStyle}
            >
              {INTENCIONES_OPCIONES.map((opt) => (
                <option key={opt.value || "vacio"} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <label style={{ display: "block", color: THEME.goldMain, marginBottom: 6, marginTop: 14, fontSize: 16 }}>Para qué sirve (opcional)</label>
            <input
              type="text"
              value={editarParaQueSirve}
              onChange={(e) => setEditarParaQueSirve(e.target.value)}
              placeholder="Ej: Protección del hogar"
              style={inputModalStyle}
            />

            <label style={{ display: "block", color: THEME.goldMain, marginBottom: 6, marginTop: 14, fontSize: 16 }}>Cómo usarlo (opcional)</label>
            <textarea
              value={editarComoUsar}
              onChange={(e) => setEditarComoUsar(e.target.value)}
              placeholder="Ej: Encender en luna creciente..."
              rows={3}
              style={{ ...inputModalStyle, resize: "vertical", minHeight: 72 }}
            />

            <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
              <button
                type="button"
                onClick={() => {
                  setModalNuevo(null);
                  setEditarNombre("");
                  setEditarCoste("");
                  setEditarPrecio("");
                  setEditarDescuento("");
                  setEditarStock("");
                  setEditarIntencion("");
                  setEditarParaQueSirve("");
                  setEditarComoUsar("");
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 8,
                  border: `2px solid ${THEME.goldMain}`,
                  background: "transparent",
                  color: THEME.goldMain,
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const coste = parseFloat(editarCoste.replace(",", "."));
                  const precio = parseFloat(editarPrecio.replace(",", "."));
                  const stock = parseInt(editarStock, 10) || 0;
                  const dto = editarDescuento.trim() === "" ? undefined : parseFloat(editarDescuento.replace(",", "."));
                  crearProducto(modalNuevo, editarNombre, coste, precio, stock, dto, editarIntencion, editarParaQueSirve, editarComoUsar);
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 8,
                  border: "none",
                  background: THEME.goldMain,
                  color: "#1b1745",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Añadir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
