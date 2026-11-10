import { useState, useCallback, useEffect, useRef } from "react";
import ProductoForm from "../../components/admin/ProductoForm";
import {
  putAdminProductoApi,
  postAdminProductoApi,
  deleteAdminProductoApi,
  aplicarCatalogoActivoEnEstado
} from "../../services/apiAdminProductos";
import type { Dispatch, SetStateAction } from "react";
import type { Producto, Pagina, IntencionProducto, SubcategoriaEntrada } from "../../types";
import AdminPageNav from "../../components/admin/AdminPageNav";
import { THEME } from "../../config";
import { isAdminAuthorized } from "../../utils/adminAuth";
import { notificarExito } from "../../utils/ui/notificaciones";
import InventarioModalEliminar from "./inventario/InventarioModalEliminar";
import InventarioModalNuevo from "./inventario/InventarioModalNuevo";
import PreciosCompetenciaSection from "./inventario/PreciosCompetenciaSection";
import {
  comprobarPendientesPreciosCompetencia,
  comprobarTodosPreciosCompetencia,
  leerPreciosCompetencia,
  type ItemComparativaPrecio
} from "../../services/apiPreciosCompetencia";
import { construirBodyNuevoProducto, construirPatchEdicionProducto } from "./inventario/inventarioHelpers";

type CategoriaCatalogo = "velas" | "inciensos" | "figuras" | "kits" | "joyas";

const CATEGORIAS: { id: CategoriaCatalogo; nombre: string; emoji: string }[] = [
  { id: "velas", nombre: "Velas", emoji: "🕯️" },
  { id: "inciensos", nombre: "Inciensos", emoji: "🌿" },
  { id: "figuras", nombre: "Figuras", emoji: "🪷" },
  { id: "kits", nombre: "Colecciones", emoji: "📦" },
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
  subcategoriasDe: (categoriaId: string) => SubcategoriaEntrada[];
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
  actualizarRapido: (categoria: CategoriaCatalogo, producto: Producto, campo: "precio" | "stock", incremento: number) => void;
  preciosOrigen: Record<number, ItemComparativaPrecio>;
  cargandoPreciosTodos: boolean;
};

/** Cajita con el último precio comprobado en la web del fabricante; clic abre su web oficial. */
function PrecioFabricanteChip({
  item,
  precioMio,
  cargando
}: {
  item: ItemComparativaPrecio | undefined;
  precioMio: number;
  cargando: boolean;
}) {
  const precioFab = item?.ok ? item.precioOrigen : null;
  const diff = precioFab != null ? Math.round((precioMio - precioFab) * 100) / 100 : null;
  const bg = precioFab == null ? "#4a4a4a" : diff != null && diff > 0.01 ? "#7a1f1f" : diff != null && diff < -0.01 ? "#1f7a3a" : "#4a4a4a";
  const titulo =
    precioFab == null
      ? "Fabricante: sin comprobar todavía — clic para abrir su web"
      : `Fabricante: ${precioFab.toFixed(2)} €${item?.comprobadoEn ? ` · ${new Date(item.comprobadoEn).toLocaleString("es-ES")}` : ""}${item?.error ? ` · ${item.error}` : ""} — clic para abrir su web`;
  return (
    <a
      href={item?.urlOrigen}
      target="_blank"
      rel="noopener noreferrer"
      title={titulo}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: "1px 6px",
        width: "100%",
        minHeight: 26,
        boxSizing: "border-box",
        borderRadius: 6,
        border: "1px solid rgba(255,255,255,0.25)",
        background: bg,
        color: "#fff",
        fontSize: 13,
        fontWeight: 800,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        fontVariantNumeric: "tabular-nums",
        textDecoration: "none",
        cursor: "pointer"
      }}
    >
      {cargando ? "…" : precioFab != null ? `${precioFab.toFixed(2)} €` : "—"}
    </a>
  );
}

function InventarioListaProductos({
  categoria,
  productos,
  umbralStockBajo,
  abrirModalEditar,
  actualizarRapido,
  preciosOrigen,
  cargandoPreciosTodos
}: InventarioListaProductosProps) {
  return (
    <div className="inventario-lista-compacta" style={{ marginTop: 8 }}>
      <div className="inventario-fila-grid inventario-lista-compacta__cabecera" aria-hidden>
        <span>Producto</span>
        <span>Precio fab</span>
        <span>Stock</span>
        <span>Precio venta</span>
      </div>
      {productos.map((p) => {
        const key = `${categoria}-${p.id}`;
        const precioNum = Number(p.precio);
        const precioBase = Number.isFinite(precioNum) ? precioNum : 0;
        const dto = p.descuentoPorcentaje != null ? Math.min(100, Math.max(0, Number(p.descuentoPorcentaje))) : 0;
        const precioVenta = dto > 0 ? Math.round(precioBase * (1 - dto / 100) * 100) / 100 : precioBase;
        const stockActual = Math.floor(Number(p.stock) || 0);
        const isBajo = stockActual <= umbralStockBajo;
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                {preciosOrigen[p.id] ? (
                  <PrecioFabricanteChip
                    item={preciosOrigen[p.id]}
                    precioMio={precioVenta}
                    cargando={cargandoPreciosTodos}
                  />
                ) : null}
              </div>
              <div
                className={`inventario-fila-stock${isBajo ? " inventario-fila-stock--bajo" : ""}`}
                title={isBajo ? "Stock bajo" : "Stock disponible"}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, width: "100%", boxSizing: "border-box" }}
              >
                <span>{stockActual}</span>
                <span style={{ display: "inline-flex", flexDirection: "column", gap: 1 }}>
                  <button
                    type="button"
                    onClick={() => actualizarRapido(categoria, p, "stock", 1)}
                    aria-label={`Subir una unidad el stock de ${p.nombre}`}
                    title="Añadir una unidad"
                    style={{ width: 15, height: 11, padding: 0, lineHeight: 1, fontSize: 7, cursor: "pointer", background: "transparent", border: "none", color: "inherit" }}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => actualizarRapido(categoria, p, "stock", -1)}
                    disabled={stockActual <= 0}
                    aria-label={`Bajar una unidad el stock de ${p.nombre}`}
                    title="Quitar una unidad"
                    style={{ width: 15, height: 11, padding: 0, lineHeight: 1, fontSize: 7, cursor: stockActual > 0 ? "pointer" : "not-allowed", background: "transparent", border: "none", color: "inherit" }}
                  >
                    ▼
                  </button>
                </span>
              </div>
              <div className="inventario-fila-precio" title={dto > 0 ? `Base ${precioBase.toFixed(2)} €` : undefined}>
                <span
                  className="inventario-fila-stock"
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, width: "100%", boxSizing: "border-box" }}
                >
                  <span className="inventario-fila-precio__valor">{precioVenta.toFixed(2)} €</span>
                  {dto > 0 && <span className="inventario-fila-precio__dto">−{dto}%</span>}
                  <span style={{ display: "inline-flex", flexDirection: "column", gap: 1 }}>
                    <button
                      type="button"
                      onClick={() => actualizarRapido(categoria, p, "precio", 0.5)}
                      aria-label={`Subir 0,50 € el precio de ${p.nombre}`}
                      title="Subir precio 0,50 €"
                      style={{ width: 15, height: 11, padding: 0, lineHeight: 1, fontSize: 7, cursor: "pointer", background: "transparent", border: "none", color: THEME.goldMain }}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => actualizarRapido(categoria, p, "precio", -0.5)}
                      disabled={precioBase <= 0}
                      aria-label={`Bajar 0,50 € el precio de ${p.nombre}`}
                      title="Bajar precio 0,50 €"
                      style={{ width: 15, height: 11, padding: 0, lineHeight: 1, fontSize: 7, cursor: precioBase > 0 ? "pointer" : "not-allowed", background: "transparent", border: "none", color: THEME.goldMain }}
                    >
                      ▼
                    </button>
                  </span>
                </span>
              </div>
            </div>
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
    subcategoriasDe,
    umbralStockBajo,
    mostrarNotificacion
  } = props;

  const [modalEditar, setModalEditar] = useState<{
    categoria: CategoriaCatalogo;
    id: number;
    nombre: string;
  } | null>(null);
  const [modalNuevo, setModalNuevo] = useState<CategoriaCatalogo | null>(null);
  /** Subcategoría preseleccionada al crear (se asigna al producto nuevo). */
  const [nuevoSubcategoria, setNuevoSubcategoria] = useState<string>("");
  const [editarSubcategoria, setEditarSubcategoria] = useState<string>("");
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
  /** Precio del fabricante por producto (los que tienen urlOrigen): último comprobado en su web oficial. */
  const [preciosOrigen, setPreciosOrigen] = useState<Record<number, ItemComparativaPrecio>>({});
  const [preciosCargandoTodos, setPreciosCargandoTodos] = useState(false);
  const [preciosComprobadoEn, setPreciosComprobadoEn] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    const aplicar = (items: ItemComparativaPrecio[]) => {
      if (cancelado) return;
      setPreciosOrigen(Object.fromEntries(items.map((i) => [i.id, i])));
      const ultima = items.reduce<string | null>(
        (m, i) => (i.comprobadoEn && (!m || i.comprobadoEn > m) ? i.comprobadoEn : m),
        null
      );
      if (ultima) setPreciosComprobadoEn(ultima);
    };
    void leerPreciosCompetencia()
      .then(async (items) => {
        aplicar(items);
        // Si hay productos con enlace de origen aún sin comprobar, se consultan solos una vez.
        if (items.some((i) => i.comprobadoEn == null)) {
          const actualizados = await comprobarPendientesPreciosCompetencia();
          aplicar(actualizados);
        }
      })
      .catch((e) => {
        mostrarNotificacion(e instanceof Error ? `Precios fabricante: ${e.message}` : "Error cargando precios de fabricante", "error");
      });
    return () => {
      cancelado = true;
    };
  }, [mostrarNotificacion]);

  const comprobarTodosPrecios = useCallback(() => {
    setPreciosCargandoTodos(true);
    void comprobarTodosPreciosCompetencia()
      .then((items) => {
        setPreciosOrigen(Object.fromEntries(items.map((i) => [i.id, i])));
        setPreciosComprobadoEn(new Date().toISOString());
      })
      .catch((e) => {
        mostrarNotificacion(e instanceof Error ? e.message : "No se pudieron comprobar los precios", "error");
      })
      .finally(() => setPreciosCargandoTodos(false));
  }, [mostrarNotificacion]);

  /** Valor del input «stock objetivo» por fila (`categoria-id`); al guardar se fija esa cantidad en servidor. */
  const colasAjustesRapidosRef = useRef(new Map<string, Promise<void>>());
  const valoresAjustesRapidosRef = useRef(new Map<string, number>());

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

  const actualizarRapido = useCallback(
    (categoria: CategoriaCatalogo, producto: Producto, campo: "precio" | "stock", incremento: number) => {
      const key = `${categoria}-${producto.id}-${campo}`;
      const valorActual = (valoresAjustesRapidosRef.current.get(key) ?? Number(producto[campo])) || 0;
      const valorNuevo = campo === "stock"
        ? Math.max(0, Math.floor(valorActual + incremento))
        : Math.max(0, Math.round((valorActual + incremento) * 100) / 100);
      if (valorNuevo === valorActual) return;

      valoresAjustesRapidosRef.current.set(key, valorNuevo);
      const setProductos = categoria === "velas"
        ? setVelas
        : categoria === "inciensos"
          ? setInciensos
          : categoria === "figuras"
            ? setFiguras
            : categoria === "kits"
              ? setKits
              : setJoyas;
      setProductos((prev) => prev.map((p) => (p.id === producto.id ? { ...p, [campo]: valorNuevo } : p)));

      const anterior = colasAjustesRapidosRef.current.get(key) ?? Promise.resolve();
      const tarea = anterior
        .catch(() => undefined)
        .then(async () => {
          await putAdminProductoApi(producto.id, { [campo]: valorNuevo });
        })
        .catch(async (error) => {
          valoresAjustesRapidosRef.current.delete(key);
          try {
            await aplicarCatalogoActivoEnEstado(setVelas, setInciensos, setFiguras, setKits, setJoyas);
          } catch {
            void 0;
          }
          mostrarNotificacion(error instanceof Error ? error.message : "No se pudo actualizar el producto", "error");
        })
        .finally(() => {
          if (colasAjustesRapidosRef.current.get(key) === tarea) {
            colasAjustesRapidosRef.current.delete(key);
            valoresAjustesRapidosRef.current.delete(key);
          }
        });
      colasAjustesRapidosRef.current.set(key, tarea);
    },
    [setVelas, setInciensos, setFiguras, setKits, setJoyas, mostrarNotificacion]
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
      setEditarSubcategoria(p.subcategoriaId ?? "");
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
      const patch = construirPatchEdicionProducto({
        categoria,
        nombre,
        coste,
        precio,
        stock,
        descuentoPorcentaje,
        intencion,
        paraQueSirve,
        comoUsar,
        descripcion: editarDescripcion,
        imagenPreview: editarPreviewTienda,
        imagenActual: p.imagen,
        tamano: editarTamano,
        color: editarColor,
        estilo: editarEstilo,
        subcategoriaId: editarSubcategoria
      });

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
      editarSubcategoria,
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
      const body = construirBodyNuevoProducto({
        categoria,
        nombre,
        coste,
        precio,
        stock,
        descuentoPorcentaje,
        intencion,
        paraQueSirve,
        comoUsar,
        subcategoriaId: nuevoSubcategoria
      });

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
    [setVelas, setInciensos, setFiguras, setKits, setJoyas, mostrarNotificacion, limpiarCamposEdicionModal, nuevoSubcategoria]
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
      <PreciosCompetenciaSection
        items={Object.values(preciosOrigen)}
        cargando={preciosCargandoTodos}
        comprobadoEn={preciosComprobadoEn}
        onComprobarTodos={comprobarTodosPrecios}
      />
      {(() => {
        const listaBajo: { nombre: string; categoria: string; categoriaId: CategoriaCatalogo; stock: number; product: Producto }[] = [
          ...velas.filter((p) => (p.stock ?? 0) <= umbralStockBajo).map((p) => ({ nombre: p.nombre, categoria: "Velas", categoriaId: "velas" as CategoriaCatalogo, stock: p.stock ?? 0, product: p })),
          ...inciensos.filter((p) => (p.stock ?? 0) <= umbralStockBajo).map((p) => ({ nombre: p.nombre, categoria: "Inciensos", categoriaId: "inciensos" as CategoriaCatalogo, stock: p.stock ?? 0, product: p })),
          ...figuras.filter((p) => (p.stock ?? 0) <= umbralStockBajo).map((p) => ({ nombre: p.nombre, categoria: "Figuras", categoriaId: "figuras" as CategoriaCatalogo, stock: p.stock ?? 0, product: p })),
          ...kits.filter((p) => (p.stock ?? 0) <= umbralStockBajo).map((p) => ({ nombre: p.nombre, categoria: "Colecciones", categoriaId: "kits" as CategoriaCatalogo, stock: p.stock ?? 0, product: p })),
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
        const subsCategoria = subcategoriasDe(id);
        const subsRaiz = subsCategoria.filter((s) => !s.padreSubcategoriaId);
        const subsHijas = subsCategoria.filter((s) => s.padreSubcategoriaId);
        const sinSubcategoria = productos.filter((p) => !p.subcategoriaId || !subsCategoria.some((s) => s.id === p.subcategoriaId));
        const grupos: { subId: string; nombreGrupo: string; productos: Producto[]; productosTotales: number; hijas: SubcategoriaEntrada[] }[] = [
          { subId: "", nombreGrupo: "Sin subcategoría", productos: sinSubcategoria, productosTotales: sinSubcategoria.length, hijas: [] },
          ...subsRaiz.map((s) => {
            const hijasDeEsta = subsHijas.filter((h) => h.padreSubcategoriaId === s.id);
            const idsHijas = hijasDeEsta.map((h) => h.id);
            const productosPropios = productos.filter((p) => p.subcategoriaId === s.id);
            const productosHijas = productos.filter((p) => p.subcategoriaId && idsHijas.includes(p.subcategoriaId));
            return {
              subId: s.id,
              nombreGrupo: s.nombre,
              productos: productosPropios,
              productosTotales: productosPropios.length + productosHijas.length,
              hijas: hijasDeEsta
            };
          })
        ].filter((g) => g.subId !== "" || g.productos.length > 0 || subsCategoria.length === 0);
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
              {productos.length === 0 && subsCategoria.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.7)", fontStyle: "italic" }}>Sin productos en esta categoría.</p>
              ) : (
                grupos.map((grupo) => (
                  <details key={grupo.subId || "__sin__"} style={{ marginBottom: 10 }}>
                    <summary
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        cursor: "pointer",
                        listStyle: "none",
                        borderBottom: `1px dashed color-mix(in srgb, ${THEME.goldMain} 35%, transparent)`,
                        paddingBottom: 4,
                        userSelect: "none"
                      }}
                    >
                      <span style={{ color: THEME.goldMain, fontWeight: "bold", fontSize: 14 }}>
                        {grupo.subId ? `📁 ${grupo.nombreGrupo}` : "Sin subcategoría"}
                        <span style={{ fontWeight: "normal", fontSize: 12, opacity: 0.75, marginLeft: 8 }}>
                          ({grupo.productosTotales})
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setModalEditar(null);
                          setModalNuevo(id);
                          setNuevoSubcategoria(grupo.subId);
                          limpiarCamposEdicionModal();
                          setEditarStock("0");
                        }}
                        style={{
                          padding: "4px 12px",
                          borderRadius: 8,
                          border: `1px solid ${THEME.goldMain}`,
                          background: "rgba(201, 162, 74, 0.15)",
                          color: THEME.goldMain,
                          fontSize: 12,
                          cursor: "pointer",
                          fontWeight: "bold",
                          whiteSpace: "nowrap"
                        }}
                      >
                        + Añadir
                      </button>
                    </summary>
                    <div style={{ marginTop: 6 }}>
                      {grupo.productos.length === 0 && grupo.hijas.length === 0 ? (
                        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, fontStyle: "italic", margin: "4px 0 0" }}>
                          Vacío.
                        </p>
                      ) : (
                        <>
                          {grupo.productos.length > 0 && (
                            <InventarioListaProductos
                              categoria={id}
                              productos={grupo.productos}
                              umbralStockBajo={umbralStockBajo}
                              abrirModalEditar={abrirModalEditar}
                              actualizarRapido={actualizarRapido}
                              preciosOrigen={preciosOrigen}
                              cargandoPreciosTodos={preciosCargandoTodos}
                            />
                          )}
                          {grupo.hijas.length > 0 && (
                        <div style={{ marginTop: 8, paddingLeft: 14, borderLeft: `2px solid color-mix(in srgb, ${THEME.goldMain} 25%, transparent)` }}>
                          {grupo.hijas.map((hija) => {
                            const prodsHija = productos.filter((p) => p.subcategoriaId === hija.id);
                            return (
                              <details key={hija.id} style={{ marginBottom: 8 }}>
                                <summary
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 10,
                                    cursor: "pointer",
                                    listStyle: "none",
                                    paddingBottom: 3,
                                    userSelect: "none"
                                  }}
                                >
                                  <span style={{ color: THEME.goldMain, fontWeight: 600, fontSize: 13, opacity: 0.92 }}>
                                    📂 {hija.nombre}
                                    <span style={{ fontWeight: "normal", fontSize: 11, opacity: 0.7, marginLeft: 6 }}>
                                      ({prodsHija.length})
                                    </span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setModalEditar(null);
                                      setModalNuevo(id);
                                      setNuevoSubcategoria(hija.id);
                                      limpiarCamposEdicionModal();
                                      setEditarStock("0");
                                    }}
                                    style={{
                                      padding: "3px 10px",
                                      borderRadius: 7,
                                      border: `1px solid ${THEME.goldMain}`,
                                      background: "rgba(201, 162, 74, 0.12)",
                                      color: THEME.goldMain,
                                      fontSize: 11,
                                      cursor: "pointer",
                                      fontWeight: "bold",
                                      whiteSpace: "nowrap"
                                    }}
                                  >
                                    + Añadir
                                  </button>
                                </summary>
                                <div style={{ marginTop: 4 }}>
                                  {prodsHija.length === 0 ? (
                                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontStyle: "italic", margin: "3px 0 0" }}>
                                      Vacío.
                                    </p>
                                  ) : (
                                    <InventarioListaProductos
                                      categoria={id}
                                      productos={prodsHija}
                                      umbralStockBajo={umbralStockBajo}
                                      abrirModalEditar={abrirModalEditar}
                                      actualizarRapido={actualizarRapido}
                                      preciosOrigen={preciosOrigen}
                                      cargandoPreciosTodos={preciosCargandoTodos}
                                    />
                                  )}
                                </div>
                              </details>
                            );
                          })}
                        </div>
                      )}
                        </>
                      )}
                    </div>
                  </details>
                ))
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
              <div style={{ marginBottom: 12 }}>
                <label
                  style={{ display: "block", color: THEME.goldMain, marginBottom: 6, fontSize: 14, fontWeight: 600 }}
                  htmlFor="inv-editar-subcategoria"
                >
                  Subcategoría
                </label>
                <select
                  id="inv-editar-subcategoria"
                  value={editarSubcategoria}
                  onChange={(e) => setEditarSubcategoria(e.target.value)}
                  style={inputModalStyle}
                >
                  <option value="">Sin subcategoría</option>
                  {subcategoriasDe(modalEditar.categoria).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.padreSubcategoriaId ? `↳ ${s.nombre}` : s.nombre}
                    </option>
                  ))}
                </select>
              </div>
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
        <InventarioModalEliminar
          nombre={pendienteEliminar.nombre}
          onCancelar={() => setPendienteEliminar(null)}
          onConfirmar={ejecutarEliminacion}
        />
      )}

      {modalNuevo && (
        <InventarioModalNuevo
          subcategorias={subcategoriasDe(modalNuevo)}
          editarNombre={editarNombre}
          setEditarNombre={setEditarNombre}
          editarCoste={editarCoste}
          setEditarCoste={setEditarCoste}
          editarPrecio={editarPrecio}
          setEditarPrecio={setEditarPrecio}
          editarDescuento={editarDescuento}
          setEditarDescuento={setEditarDescuento}
          editarStock={editarStock}
          setEditarStock={setEditarStock}
          editarIntencion={editarIntencion}
          setEditarIntencion={setEditarIntencion}
          editarParaQueSirve={editarParaQueSirve}
          setEditarParaQueSirve={setEditarParaQueSirve}
          editarComoUsar={editarComoUsar}
          setEditarComoUsar={setEditarComoUsar}
          nuevoSubcategoria={nuevoSubcategoria}
          setNuevoSubcategoria={setNuevoSubcategoria}
          refNombre={refNombre}
          refCoste={refCoste}
          refPrecio={refPrecio}
          refStock={refStock}
          onCancelar={() => {
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
          onCrear={() => {
            const coste = parseFloat(editarCoste.replace(",", "."));
            const precio = parseFloat(editarPrecio.replace(",", "."));
            const stock = parseInt(editarStock, 10) || 0;
            const dto = editarDescuento.trim() === "" ? undefined : parseFloat(editarDescuento.replace(",", "."));
            crearProducto(modalNuevo, editarNombre, coste, precio, stock, dto, editarIntencion, editarParaQueSirve, editarComoUsar);
          }}
        />
      )}
    </div>
  );
}
