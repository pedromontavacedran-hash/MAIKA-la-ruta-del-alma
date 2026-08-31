import { useState, useEffect, useMemo, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Producto, Pagina, SubcategoriaEntrada, GeneroJoya, AcabadoJoya } from "../../types";
import { GENEROS_JOYA_OPCIONES, ACABADOS_JOYA_OPCIONES } from "../../types";
import { THEME } from "../../config";
import { isAdminAuthorized } from "../../utils/adminAuth";
import { notificarExito } from "../../utils/ui/notificaciones";
import { putAdminProductoApi, deleteAdminProductoApi, aplicarCatalogoActivoEnEstado } from "../../services/apiAdminProductos";
import ModalBase from "../../components/ModalBase";
import ProductoForm from "../../components/admin/ProductoForm";

export interface EditarProductosPageProps {
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
  getProductoByValue: (value: string) => Producto | undefined;
  categoriaEditarProductos: "velas" | "inciensos" | "figuras" | "joyas";
  setCategoriaEditarProductos: Dispatch<SetStateAction<"velas" | "inciensos" | "figuras" | "joyas">>;
  productoSeleccionado: string;
  setProductoSeleccionado: Dispatch<SetStateAction<string>>;
  previewProducto: string | null;
  setPreviewProducto: Dispatch<SetStateAction<string | null>>;
  nombreImagenProducto: string;
  setNombreImagenProducto: Dispatch<SetStateAction<string>>;
  colorProducto: string;
  setColorProducto: Dispatch<SetStateAction<string>>;
  tamanoProducto: string;
  setTamanoProducto: Dispatch<SetStateAction<string>>;
  estiloTextoProducto: string;
  setEstiloTextoProducto: Dispatch<SetStateAction<string>>;
  setCategoriaNuevoProducto: Dispatch<SetStateAction<"velas" | "inciensos" | "figuras" | "joyas">>;
  setNuevoProductoNombre: Dispatch<SetStateAction<string>>;
  setNuevoProductoPrecio: Dispatch<SetStateAction<string>>;
  setNuevoProductoStock: Dispatch<SetStateAction<number>>;
  setNuevoProductoDescripcion: Dispatch<SetStateAction<string>>;
  setNuevoProductoImagen: Dispatch<SetStateAction<string | null>>;
  setNuevoProductoNombreImagen: Dispatch<SetStateAction<string>>;
  setNuevoProductoTamano: Dispatch<SetStateAction<string>>;
  setNuevoProductoColor: Dispatch<SetStateAction<string>>;
  setNuevoProductoEstilo: Dispatch<SetStateAction<string>>;
  mostrarNotificacion: (msg: string, tipo: "normal" | "exito" | "error") => void;
  subcategoriasDe: (categoriaId: string) => SubcategoriaEntrada[];
}

const pageWrapStyle = {
  background: THEME.bg,
  color: THEME.goldMain,
  display: "flex" as const,
  flexDirection: "column" as const,
  alignItems: "stretch" as const,
  paddingTop: "var(--app-content-pad-bajo-nav)",
  paddingLeft: 12,
  paddingRight: 12,
  paddingBottom: 20,
  boxSizing: "border-box" as const,
  width: "100%",
  maxWidth: 600,
  margin: "0 auto"
};

export default function EditarProductosPage(props: EditarProductosPageProps) {
  const {
    setPagina,
    velas,
    setVelas,
    inciensos,
    setInciensos,
    figuras,
    setFiguras,
    setKits,
    joyas,
    setJoyas,
    getProductoByValue,
    categoriaEditarProductos,
    setCategoriaEditarProductos,
    productoSeleccionado,
    setProductoSeleccionado,
    previewProducto,
    setPreviewProducto,
    nombreImagenProducto,
    setNombreImagenProducto,
    colorProducto,
    setColorProducto,
    tamanoProducto,
    setTamanoProducto,
    estiloTextoProducto,
    setEstiloTextoProducto,
    setCategoriaNuevoProducto,
    setNuevoProductoNombre,
    setNuevoProductoPrecio,
    setNuevoProductoStock,
    setNuevoProductoDescripcion,
    setNuevoProductoImagen,
    setNuevoProductoNombreImagen,
    setNuevoProductoTamano,
    setNuevoProductoColor,
    setNuevoProductoEstilo,
    mostrarNotificacion,
    subcategoriasDe
  } = props;

  const listaActual =
    categoriaEditarProductos === "velas" ? velas :
    categoriaEditarProductos === "inciensos" ? inciensos :
    categoriaEditarProductos === "figuras" ? figuras :
    joyas;
  const productosDeLaCategoria = listaActual.map((p) => ({ value: `${categoriaEditarProductos}-${p.id}`, nombre: p.nombre, categoria: categoriaEditarProductos }));
  const valorSelect = productosDeLaCategoria.some((p) => p.value === productoSeleccionado) ? productoSeleccionado : productosDeLaCategoria[0]?.value ?? "";
  const productoActual = productosDeLaCategoria.find((p) => p.value === valorSelect);

  const [stockProducto, setStockProducto] = useState(0);
  const [unidadesReponer, setUnidadesReponer] = useState("");
  const [modalRenombrarAbierto, setModalRenombrarAbierto] = useState(false);
  const [renombrarSnap, setRenombrarSnap] = useState<string | null>(null);
  const [nombreRenombrar, setNombreRenombrar] = useState("");
  const inputRenombrarRef = useRef<HTMLInputElement>(null);
  const productoCompleto = getProductoByValue(valorSelect);
  const [nombreProd, setNombreProd] = useState("");
  const [precioProd, setPrecioProd] = useState("");
  const [descProd, setDescProd] = useState("");
  const [subcategoriaId, setSubcategoriaId] = useState("");
  const [generoJoya, setGeneroJoya] = useState<GeneroJoya | "">("");
  const [acabadoJoya, setAcabadoJoya] = useState<AcabadoJoya | "">("");

  const subcategoriasDeCategoria = useMemo(
    () => subcategoriasDe(categoriaEditarProductos),
    [subcategoriasDe, categoriaEditarProductos]
  );

  useEffect(() => {
    setStockProducto(productoCompleto ? Number(productoCompleto.stock) || 0 : 0);
    setUnidadesReponer("");
  }, [productoCompleto?.id, productoCompleto?.stock]);

  useEffect(() => {
    setSubcategoriaId(productoCompleto?.subcategoriaId ?? "");
    setGeneroJoya(productoCompleto?.generoJoya ?? "");
    setAcabadoJoya(productoCompleto?.acabadoJoya ?? "");
  }, [productoCompleto?.id, productoCompleto?.subcategoriaId, productoCompleto?.generoJoya, productoCompleto?.acabadoJoya]);

  useEffect(() => {
    if (!productoCompleto) {
      setNombreProd("");
      setPrecioProd("");
      setDescProd("");
      return;
    }
    setNombreProd(productoCompleto.nombre ?? "");
    setPrecioProd(String(productoCompleto.precio ?? ""));
    setDescProd(productoCompleto.descripcion ?? "");
  }, [productoCompleto?.id, productoCompleto?.nombre, productoCompleto?.precio, productoCompleto?.descripcion]);

  useEffect(() => {
    if (!modalRenombrarAbierto) return;
    const t = window.setTimeout(() => inputRenombrarRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [modalRenombrarAbierto]);

  useEffect(() => {
    if (!modalRenombrarAbierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModalRenombrarAbierto(false);
        setRenombrarSnap(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalRenombrarAbierto]);

  const cerrarModalRenombrar = () => {
    setModalRenombrarAbierto(false);
    setRenombrarSnap(null);
  };

  const confirmarRenombrar = () => {
    void (async () => {
      const snap = renombrarSnap;
      const prod = snap ? getProductoByValue(snap) : undefined;
      if (!prod) {
        cerrarModalRenombrar();
        return;
      }
      const nuevo = nombreRenombrar.trim();
      if (!nuevo) {
        mostrarNotificacion("Escribe un nombre para el producto.", "error");
        return;
      }
      try {
        await putAdminProductoApi(prod.id, { nombre: nuevo });
        await aplicarCatalogoActivoEnEstado(setVelas, setInciensos, setFiguras, setKits, setJoyas);
        setProductoSeleccionado(`${prod.categoria}-${prod.id}`);
        cerrarModalRenombrar();
        notificarExito(mostrarNotificacion, "✏️ Nombre guardado en el servidor");
      } catch (e) {
        mostrarNotificacion(e instanceof Error ? e.message : "No se pudo renombrar", "error");
      }
    })();
  };

  const volverDesdeEditarProductos = () => {
    if (isAdminAuthorized()) {
      setPagina("admin");
    } else {
      setPagina("inicio");
    }
  };

  return (
    <div className="admin-container editar-productos-page" style={pageWrapStyle}>
      <ModalBase
        abierto={modalRenombrarAbierto}
        onClose={cerrarModalRenombrar}
        maxWidth="440px"
        zIndex={10050}
        classNameCard="modal-card--renombrar-producto"
        styleCard={{
          border: "1px solid rgba(212, 175, 55, 0.35)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.45)"
        }}
        ariaLabelledBy="modal-renombrar-producto-titulo"
      >
        <h2
          id="modal-renombrar-producto-titulo"
          style={{
            margin: "0 0 6px",
            fontSize: "1.15rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase" as const,
            color: THEME.goldMain
          }}
        >
          Renombrar producto
        </h2>
        <p style={{ margin: "0 0 16px", fontSize: 14, opacity: 0.88, lineHeight: 1.45 }}>
          El nombre se guarda en el servidor y se verá en la tienda con el estilo que definas abajo.
        </p>
        <label className="editar-productos-label" htmlFor="ep-renombrar-nombre" style={{ display: "block", marginBottom: 8 }}>
          Nuevo nombre
        </label>
        <input
          ref={inputRenombrarRef}
          id="ep-renombrar-nombre"
          type="text"
          className="categoria-text-input"
          autoComplete="off"
          value={nombreRenombrar}
          onChange={(e) => setNombreRenombrar(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              confirmarRenombrar();
            }
          }}
          style={{ width: "100%", boxSizing: "border-box", marginBottom: 0, minWidth: 0 }}
        />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginTop: 22,
            justifyContent: "flex-end"
          }}
        >
          <button
            type="button"
            className="editar-productos-acciones__btn editar-productos-acciones__btn--ghost"
            onClick={cerrarModalRenombrar}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="editar-productos-acciones__btn editar-productos-acciones__btn--primary"
            onClick={confirmarRenombrar}
          >
            Guardar nombre
          </button>
        </div>
      </ModalBase>

      <header className="editar-productos-page__cabecera">
        <div className="editar-productos-page__cabecera-texto">
          <h1 className="editar-productos-page__titulo">Editar productos</h1>
          <p className="editar-productos-page__subtitulo">Selecciona categoría y producto para modificar.</p>
        </div>
        <button
          type="button"
          className="editar-productos-btn-cerrar"
          onClick={volverDesdeEditarProductos}
          aria-label="Cerrar y volver al panel"
          title="Cerrar"
        >
          ×
        </button>
      </header>

      <ProductoForm
        modo="editar"
        idPrefix="ep"
        categoria={categoriaEditarProductos}
        onCategoriaChange={(cat) => {
          const c = cat as "velas" | "inciensos" | "figuras" | "joyas";
          setCategoriaEditarProductos(c);
          const list = c === "velas" ? velas : c === "inciensos" ? inciensos : c === "figuras" ? figuras : joyas;
          const val = list[0] ? `${c}-${list[0].id}` : "";
          setProductoSeleccionado(val);
          const prod = list[0] ? getProductoByValue(val) : undefined;
          if (prod) {
            setTamanoProducto(String(prod.nombreTamano ?? 22));
            setColorProducto(prod.nombreColor ?? "#ffffff");
            setEstiloTextoProducto(prod.nombreEstilo ?? "normal");
            setPreviewProducto(prod.imagen ? prod.imagen : null);
            setNombreImagenProducto("");
          }
        }}
        mostrarSelectorProducto
        opcionesProducto={productosDeLaCategoria.map((p) => ({ value: p.value, nombre: p.nombre }))}
        productoValue={valorSelect}
        onProductoChange={(val) => {
          setProductoSeleccionado(val);
          const prod = getProductoByValue(val);
          if (prod) {
            setTamanoProducto(String(prod.nombreTamano ?? 22));
            setColorProducto(prod.nombreColor ?? "#ffffff");
            setEstiloTextoProducto(prod.nombreEstilo ?? "normal");
            setPreviewProducto(prod.imagen ? prod.imagen : null);
            setNombreImagenProducto("");
          }
        }}
        nombre={nombreProd}
        onNombreChange={setNombreProd}
        precio={precioProd}
        onPrecioChange={setPrecioProd}
        descripcion={descProd}
        onDescripcionChange={setDescProd}
        previewImagen={previewProducto}
        nombreArchivoImagen={nombreImagenProducto}
        onSeleccionarImagen={(_file, dataUrl) => {
          setNombreImagenProducto(_file.name);
          setPreviewProducto(dataUrl);
        }}
        color={colorProducto}
        onColorChange={setColorProducto}
        tamanoTexto={tamanoProducto}
        onTamanoTextoChange={setTamanoProducto}
        estiloTexto={estiloTextoProducto}
        onEstiloTextoChange={setEstiloTextoProducto}
        textoVistaPreviaNombre={nombreProd || productoActual?.nombre || ""}
        stockStr={String(stockProducto)}
        onStockStrChange={(s) => setStockProducto(Math.max(0, parseInt(s, 10) || 0))}
        mostrarFilaReponer
        unidadesReponer={unidadesReponer}
        onUnidadesReponerChange={setUnidadesReponer}
        onReponerAnadir={() => {
          void (async () => {
            const n = parseInt(unidadesReponer, 10);
            if (!Number.isFinite(n) || n < 0) return;
            const nuevoStock = stockProducto + n;
            const prod = getProductoByValue(valorSelect);
            if (!prod) return;
            try {
              await putAdminProductoApi(prod.id, {
                categoria: prod.categoria,
                nombre: prod.nombre,
                precio: prod.precio,
                stock: nuevoStock,
                imagen: prod.imagen ?? "",
                descripcion: prod.descripcion ?? "",
                activo: true
              });
              await aplicarCatalogoActivoEnEstado(setVelas, setInciensos, setFiguras, setKits, setJoyas);
              setStockProducto(nuevoStock);
              setUnidadesReponer("");
              notificarExito(mostrarNotificacion, `✅ Stock guardado en servidor: ${nuevoStock} uds`);
            } catch (e) {
              mostrarNotificacion(e instanceof Error ? e.message : "No se pudo guardar el stock", "error");
            }
          })();
        }}
        etiquetaBotonPrincipal="Guardar"
        onPrincipal={() => {
          void (async () => {
            const prod = getProductoByValue(valorSelect);
            if (!prod) return;
            const tamano = Number(tamanoProducto) || 22;
            const precioNum = Number(precioProd.replace(",", "."));
            const nombreTrim = nombreProd.trim();
            const descTrim = descProd.trim();
            const updated: Producto = {
              ...prod,
              nombre: nombreTrim || prod.nombre,
              precio: Number.isFinite(precioNum) && precioNum >= 0 ? precioNum : prod.precio,
              descripcion: descTrim,
              imagen: previewProducto && previewProducto.startsWith("data:") ? previewProducto : prod.imagen,
              nombreTamano: tamano,
              nombreColor: colorProducto,
              nombreEstilo: estiloTextoProducto as "normal" | "italic" | "bold",
              stock: Math.max(0, stockProducto)
            };
            const patch: Record<string, unknown> = {
              categoria: updated.categoria,
              nombre: updated.nombre,
              precio: updated.precio,
              stock: updated.stock,
              imagen: updated.imagen ?? "",
              descripcion: updated.descripcion ?? "",
              activo: true,
              nombreTamano: updated.nombreTamano,
              nombreColor: updated.nombreColor,
              nombreEstilo: updated.nombreEstilo
            };
            if (updated.precioCosteIvaIncluido != null && Number.isFinite(updated.precioCosteIvaIncluido)) {
              patch.precioCosteIvaIncluido = updated.precioCosteIvaIncluido;
            }
            patch.descuentoPorcentaje =
              updated.descuentoPorcentaje != null && updated.descuentoPorcentaje > 0 ? updated.descuentoPorcentaje : null;
            patch.intencion = updated.intencion && String(updated.intencion).trim() ? updated.intencion : null;
            patch.paraQueSirve = updated.paraQueSirve?.trim() || null;
            patch.comoUsar = updated.comoUsar?.trim() || null;
            patch.subcategoriaId = subcategoriaId || null;
            if (updated.categoria === "joyas") {
              patch.generoJoya = subcategoriaId === "pulseras" ? generoJoya || null : null;
              patch.acabadoJoya = acabadoJoya || null;
            }
            try {
              await putAdminProductoApi(prod.id, patch);
              await aplicarCatalogoActivoEnEstado(setVelas, setInciensos, setFiguras, setKits, setJoyas);
              notificarExito(mostrarNotificacion, "✅ Producto guardado en el servidor.");
              if (isAdminAuthorized()) {
                setPagina("admin");
              } else {
                setPagina("inicio");
              }
            } catch (e) {
              mostrarNotificacion(e instanceof Error ? e.message : "No se pudo guardar", "error");
            }
          })();
        }}
        onRenombrar={() => {
          const prod = getProductoByValue(valorSelect);
          if (!prod) return;
          setRenombrarSnap(valorSelect);
          setNombreRenombrar(prod.nombre);
          setModalRenombrarAbierto(true);
        }}
        onAnadirProducto={() => {
          setCategoriaNuevoProducto(categoriaEditarProductos);
          setNuevoProductoNombre("");
          setNuevoProductoPrecio("10");
          setNuevoProductoStock(5);
          setNuevoProductoDescripcion("");
          setNuevoProductoImagen(null);
          setNuevoProductoNombreImagen("");
          setNuevoProductoTamano("22");
          setNuevoProductoColor("#ffffff");
          setNuevoProductoEstilo("normal");
          setPagina("nuevoProducto");
        }}
        onEliminar={() => {
          void (async () => {
            const prod = getProductoByValue(valorSelect);
            if (!prod) return;
            if (!window.confirm(`¿Eliminar el producto "${prod.nombre}"? (baja en catálogo)`)) return;
            try {
              await deleteAdminProductoApi(prod.id);
              await aplicarCatalogoActivoEnEstado(setVelas, setInciensos, setFiguras, setKits, setJoyas);
              setProductoSeleccionado("");
              mostrarNotificacion("Producto dado de baja en el servidor", "normal");
            } catch (e) {
              mostrarNotificacion(e instanceof Error ? e.message : "No se pudo eliminar", "error");
            }
          })();
        }}
      >
        {subcategoriasDeCategoria.length > 0 ? (
          <section className="editar-productos-seccion">
            <div className="editar-productos-seccion__titulo">Subcategoría</div>
            <div className="editar-productos-seleccion-grid">
              <div className="editar-productos-campo">
                <label className="editar-productos-label" htmlFor="ep-subcategoria">
                  Subcategoría
                </label>
                <select
                  id="ep-subcategoria"
                  className="categoria-select editar-productos-select-entrada"
                  value={subcategoriaId}
                  onChange={(e) => setSubcategoriaId(e.target.value)}
                >
                  <option value="">— Elige subcategoría —</option>
                  {subcategoriasDeCategoria.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
              {categoriaEditarProductos === "joyas" ? (
                <div className="editar-productos-campo">
                  <label className="editar-productos-label" htmlFor="ep-acabado-joya">
                    Acabado
                  </label>
                  <select
                    id="ep-acabado-joya"
                    className="categoria-select editar-productos-select-entrada"
                    value={acabadoJoya}
                    onChange={(e) => setAcabadoJoya(e.target.value as AcabadoJoya | "")}
                  >
                    {ACABADOS_JOYA_OPCIONES.map((o) => (
                      <option key={o.value || "vacio"} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              ) : null}
              {categoriaEditarProductos === "joyas" && subcategoriaId === "pulseras" ? (
                <div className="editar-productos-campo">
                  <label className="editar-productos-label" htmlFor="ep-genero-joya">
                    Pensada para
                  </label>
                  <select
                    id="ep-genero-joya"
                    className="categoria-select editar-productos-select-entrada"
                    value={generoJoya}
                    onChange={(e) => setGeneroJoya(e.target.value as GeneroJoya | "")}
                  >
                    {GENEROS_JOYA_OPCIONES.map((o) => (
                      <option key={o.value || "vacio"} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </ProductoForm>
    </div>
  );
}
