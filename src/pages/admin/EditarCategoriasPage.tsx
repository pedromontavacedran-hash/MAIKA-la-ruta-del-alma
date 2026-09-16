import { useState, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { CategoriaEntrada, SubcategoriaEntrada, Pagina, Producto } from "../../types";
import { THEME } from "../../config";
import { isAdminAuthorized } from "../../utils/adminAuth";
import { notificarExito, notificarError } from "../../utils/ui/notificaciones";
import { redimensionarImagenADataUrl } from "../../utils/redimensionarImagen";
import { deleteAdminCategoriaApi, putAdminCategoriaApi } from "../../services/apiCategorias";

export interface EditarCategoriasPageProps {
  setPagina: (p: Pagina) => void;
  categoriasCatalogo: CategoriaEntrada[];
  setCategoriasCatalogo: Dispatch<SetStateAction<CategoriaEntrada[]>>;
  categoriaSeleccionada: string;
  setCategoriaSeleccionada: Dispatch<SetStateAction<string>>;
  previewCategoria: string | null;
  setPreviewCategoria: Dispatch<SetStateAction<string | null>>;
  nombreImagenCategoria: string;
  setNombreImagenCategoria: Dispatch<SetStateAction<string>>;
  colorCategoria: string;
  setColorCategoria: Dispatch<SetStateAction<string>>;
  tamanoCategoria: string;
  setTamanoCategoria: Dispatch<SetStateAction<string>>;
  estiloTextoCategoria: string;
  setEstiloTextoCategoria: Dispatch<SetStateAction<string>>;
  setCategoriaARenombrar: Dispatch<SetStateAction<string | null>>;
  setNuevaCategoriaNombre: Dispatch<SetStateAction<string>>;
  setNuevaCategoriaImagen: Dispatch<SetStateAction<string | null>>;
  setNuevaCategoriaNombreImagen: Dispatch<SetStateAction<string>>;
  setNuevaCategoriaTamano: Dispatch<SetStateAction<string>>;
  setNuevaCategoriaColor: Dispatch<SetStateAction<string>>;
  setNuevaCategoriaEstilo: Dispatch<SetStateAction<string>>;
  mostrarNotificacion: (msg: string, tipo: "normal" | "exito" | "error") => void;
  velas: Producto[];
  inciensos: Producto[];
  figuras: Producto[];
  kits: Producto[];
  joyas: Producto[];
  subcategoriasCatalogo: SubcategoriaEntrada[];
  subcategoriasDe: (categoriaId: string) => SubcategoriaEntrada[];
  agregarSubcategoria: (categoriaId: string, nombre: string, padreSubcategoriaId?: string) => Promise<SubcategoriaEntrada>;
  renombrarSubcategoria: (id: string, nombre: string, padreSubcategoriaId?: string) => Promise<void>;
  eliminarSubcategoria: (id: string) => Promise<void>;
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

function listaProductosPorCategoriaId(
  id: string,
  velas: Producto[],
  inciensos: Producto[],
  figuras: Producto[],
  kits: Producto[],
  joyas: Producto[]
): Producto[] {
  if (id === "velas") return velas;
  if (id === "inciensos") return inciensos;
  if (id === "figuras") return figuras;
  if (id === "kits") return kits;
  if (id === "joyas") return joyas;
  return [];
}

type Nivel = "categorias" | "subcategorias";

const SUB_PADRE_SIN_SELECCION = "__sin_seleccionar__";
const SUB_PADRE_RAIZ = "__nivel_principal__";

/**
 * "Editar categorías" solo gestiona categorías y subcategorías (taxonomía).
 * La gestión de productos (crear/editar) vive únicamente en "Edición de productos",
 * a propósito: no hay listado de productos ni botón "Editar producto" aquí.
 */
export default function EditarCategoriasPage(props: EditarCategoriasPageProps) {
  const {
    setPagina,
    categoriasCatalogo,
    setCategoriasCatalogo,
    categoriaSeleccionada,
    setCategoriaSeleccionada,
    previewCategoria,
    setPreviewCategoria,
    nombreImagenCategoria,
    setNombreImagenCategoria,
    colorCategoria,
    setColorCategoria,
    tamanoCategoria,
    setTamanoCategoria,
    estiloTextoCategoria,
    setEstiloTextoCategoria,
    setCategoriaARenombrar,
    setNuevaCategoriaNombre,
    setNuevaCategoriaImagen,
    setNuevaCategoriaNombreImagen,
    setNuevaCategoriaTamano,
    setNuevaCategoriaColor,
    setNuevaCategoriaEstilo,
    mostrarNotificacion,
    velas,
    inciensos,
    figuras,
    kits,
    joyas,
    subcategoriasCatalogo,
    subcategoriasDe,
    agregarSubcategoria,
    renombrarSubcategoria,
    eliminarSubcategoria
  } = props;

  const valorSelect = categoriasCatalogo.some((c) => c.id === categoriaSeleccionada) ? categoriaSeleccionada : (categoriasCatalogo[0]?.id ?? "");

  const listaActual = listaProductosPorCategoriaId(valorSelect, velas, inciensos, figuras, kits, joyas);

  const stockTotalCategoria = listaActual.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);

  const [nivel, setNivel] = useState<Nivel>("categorias");
  const [nuevaSubNombre, setNuevaSubNombre] = useState("");
  const [nuevaSubPadre, setNuevaSubPadre] = useState<string>(SUB_PADRE_SIN_SELECCION);
  const [subEditandoId, setSubEditandoId] = useState<string | null>(null);
  const [nombreSubEditado, setNombreSubEditado] = useState("");
  const [padreSubEditado, setPadreSubEditado] = useState<string>("");
  /** Categoría destino de la nueva subcategoría (local, para no resetear el nivel al cambiarla). */
  const [subTargetCategoria, setSubTargetCategoria] = useState(valorSelect);

  useEffect(() => {
    setNivel("categorias");
    // Volver siempre al nivel 1 si cambia la categoría activa desde el selector.
  }, [valorSelect]);

  useEffect(() => {
    if (nivel === "subcategorias") setSubTargetCategoria(valorSelect);
  }, [nivel, valorSelect]);

  const volverDesdeEditarCategorias = () => {
    if (isAdminAuthorized()) {
      setPagina("admin");
    } else {
      setPagina("inicio");
    }
  };

  const subcategoriasDeCategoriaActual = subcategoriasDe(valorSelect);
  const nombreCategoriaActual = categoriasCatalogo.find((c) => c.id === valorSelect)?.nombre ?? valorSelect;
  const nombreSubTargetCategoria = categoriasCatalogo.find((c) => c.id === subTargetCategoria)?.nombre ?? subTargetCategoria;
  const nuevaSubPadreEntrada = subcategoriasDe(subTargetCategoria).find((s) => s.id === nuevaSubPadre);

  return (
    <div
      className="admin-container editar-productos-page editar-categorias-page"
      style={pageWrapStyle}
    >
      <header className="editar-productos-page__cabecera">
        <div className="editar-productos-page__cabecera-texto">
          <h1 className="editar-productos-page__titulo">Editar categorías</h1>
          <p className="editar-productos-page__subtitulo">
            {nivel === "categorias"
              ? "Selecciona una categoría para editarla o gestionar sus subcategorías."
              : `${nombreCategoriaActual.charAt(0).toUpperCase() + nombreCategoriaActual.slice(1)} · subcategorías`}
          </p>
        </div>
        <button
          type="button"
          className="editar-productos-btn-cerrar"
          onClick={volverDesdeEditarCategorias}
          aria-label="Cerrar y volver al panel"
          title="Cerrar"
        >
          ×
        </button>
      </header>

      {nivel !== "categorias" ? (
        <button
          type="button"
          className="editar-productos-acciones__btn editar-productos-acciones__btn--ghost"
          style={{ alignSelf: "flex-start", marginBottom: 12 }}
          onClick={() => setNivel("categorias")}
        >
          ← Volver
        </button>
      ) : null}

      {nivel === "categorias" ? (
        <div className="editar-productos-page__content editar-productos-page__panel">
          <section className="editar-productos-seccion">
            <div className="editar-productos-seccion__titulo">Selección</div>
            <div className="editar-productos-campo">
              <label className="editar-productos-label" htmlFor="ec-cat">
                Categoría
              </label>
              <select
                id="ec-cat"
                className="categoria-select editar-productos-select-entrada"
                value={valorSelect}
                onChange={(e) => setCategoriaSeleccionada(e.target.value)}
              >
                {categoriasCatalogo.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre.charAt(0).toUpperCase() + c.nombre.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="editar-productos-seccion">
            <div className="editar-productos-seccion__titulo">Apariencia en tienda</div>
            <div className="editar-productos-campo editar-productos-campo--compacto">
              <span className="editar-productos-label">Vista previa del nombre</span>
              <div className="editar-productos-preview-nombre">
                <span
                  style={{
                    fontSize: Number(tamanoCategoria) || 22,
                    color: colorCategoria,
                    fontStyle: estiloTextoCategoria === "italic" ? "italic" : "normal",
                    fontWeight: estiloTextoCategoria === "bold" ? "bold" : "normal"
                  }}
                >
                  {nombreCategoriaActual}
                </span>
              </div>
            </div>

            <div className="editar-productos-apariencia-grid">
              <div className="editar-productos-apariencia-col editar-productos-apariencia-col--izq">
                <div className="editar-productos-campo">
                  <label className="editar-productos-label" htmlFor="ec-file">
                    Imagen
                  </label>
                  <div className="editar-productos-imagen-fila">
                    <label className="categoria-file-label" htmlFor="ec-file">
                      {nombreImagenCategoria || "Seleccionar imagen"}
                      <input
                        id="ec-file"
                        type="file"
                        className="categoria-file-input"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setNombreImagenCategoria(file.name);
                          void redimensionarImagenADataUrl(file).then(setPreviewCategoria);
                        }}
                      />
                    </label>
                    {previewCategoria && (
                      <img src={previewCategoria} alt="" className="editar-productos-thumb" />
                    )}
                  </div>
                </div>
                <div className="editar-productos-campo">
                  <label className="editar-productos-label" htmlFor="ec-color">
                    Color
                  </label>
                  <input
                    id="ec-color"
                    type="color"
                    value={colorCategoria}
                    onChange={(e) => setColorCategoria(e.target.value)}
                    className="editar-productos-color-input"
                  />
                </div>
              </div>
              <div className="editar-productos-apariencia-col editar-productos-apariencia-col--der">
                <div className="editar-productos-campo">
                  <label className="editar-productos-label" htmlFor="ec-tam">
                    Tamaño del texto
                  </label>
                  <input
                    id="ec-tam"
                    type="number"
                    min={12}
                    max={48}
                    className="categoria-number-input editar-productos-input-num--ancho"
                    placeholder="px"
                    value={tamanoCategoria === "0" ? "" : tamanoCategoria}
                    onChange={(e) => setTamanoCategoria(e.target.value)}
                  />
                </div>
                <div className="editar-productos-campo">
                  <label className="editar-productos-label" htmlFor="ec-est">
                    Estilo del texto
                  </label>
                  <select
                    id="ec-est"
                    value={estiloTextoCategoria}
                    onChange={(e) => setEstiloTextoCategoria(e.target.value)}
                    className="editar-productos-select-campo"
                  >
                    <option value="normal">Normal</option>
                    <option value="italic">Cursiva</option>
                    <option value="bold">Negrita</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section className="editar-productos-seccion">
            <div className="editar-productos-seccion__titulo">Subcategorías</div>
            <div className="editar-productos-stock-bloque">
              <p style={{ margin: "0 0 10px", color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
                {listaActual.length} {listaActual.length === 1 ? "producto" : "productos"} en esta categoría · {stockTotalCategoria} uds en stock
                {subcategoriasDeCategoriaActual.length > 0
                  ? ` · ${subcategoriasDeCategoriaActual.length} ${subcategoriasDeCategoriaActual.length === 1 ? "subcategoría" : "subcategorías"}`
                  : ""}
              </p>
              <button
                type="button"
                className="editar-productos-acciones__btn editar-productos-acciones__btn--primary"
                onClick={() => setNivel("subcategorias")}
              >
                Gestionar subcategorías →
              </button>
            </div>
          </section>

          <div className="editar-productos-acciones">
            <button
              type="button"
              className="editar-productos-acciones__btn editar-productos-acciones__btn--primary"
              onClick={() => {
                void (async () => {
                  try {
                    const actualizada = await putAdminCategoriaApi(valorSelect, nombreCategoriaActual, previewCategoria ?? null);
                    setCategoriasCatalogo((prev) => prev.map((c) => (c.id === valorSelect ? actualizada : c)));
                    notificarExito(mostrarNotificacion, "✅ Categoría guardada");
                    if (isAdminAuthorized()) {
                      setPagina("admin");
                    } else {
                      setPagina("inicio");
                    }
                  } catch (e) {
                    notificarError(mostrarNotificacion, e instanceof Error ? e.message : "No se pudo guardar la categoría");
                  }
                })();
              }}
            >
              Guardar
            </button>
            <button
              type="button"
              className="editar-productos-acciones__btn editar-productos-acciones__btn--ghost"
              onClick={() => {
                setCategoriaARenombrar(valorSelect);
                setNuevaCategoriaNombre(nombreCategoriaActual);
                setNuevaCategoriaImagen(previewCategoria);
                setNuevaCategoriaNombreImagen(nombreImagenCategoria);
                setNuevaCategoriaTamano(tamanoCategoria);
                setNuevaCategoriaColor(colorCategoria);
                setNuevaCategoriaEstilo(estiloTextoCategoria);
                setPagina("nuevaCategoria");
              }}
            >
              Renombrar
            </button>
            <button
              type="button"
              className="editar-productos-acciones__btn editar-productos-acciones__btn--accent"
              onClick={() => {
                setCategoriaARenombrar(null);
                setNuevaCategoriaNombre("");
                setNuevaCategoriaImagen(null);
                setNuevaCategoriaNombreImagen("");
                setNuevaCategoriaTamano("22");
                setNuevaCategoriaColor("#ffffff");
                setNuevaCategoriaEstilo("normal");
                setPagina("nuevaCategoria");
              }}
            >
              Añadir categoría
            </button>
            <button
              type="button"
              className="editar-productos-acciones__btn editar-productos-acciones__btn--danger"
              onClick={() => {
                const id = valorSelect;
                if (listaActual.length > 0) {
                  notificarError(mostrarNotificacion, `No se puede eliminar: ${listaActual.length} productos siguen en esta categoría.`);
                  return;
                }
                if (!window.confirm(`¿Eliminar la categoría "${nombreCategoriaActual}"?`)) return;
                void (async () => {
                  try {
                    await deleteAdminCategoriaApi(id);
                    const siguiente = categoriasCatalogo.filter((c) => c.id !== id);
                    setCategoriasCatalogo(siguiente);
                    setCategoriaSeleccionada(siguiente[0]?.id ?? "");
                    notificarExito(mostrarNotificacion, "Categoría eliminada");
                  } catch (e) {
                    notificarError(mostrarNotificacion, e instanceof Error ? e.message : "No se pudo eliminar la categoría");
                  }
                })();
              }}
            >
              Eliminar
            </button>
          </div>
        </div>
      ) : null}

      {nivel === "subcategorias" ? (
        <div className="editar-productos-page__content editar-productos-page__panel">
          <section className="editar-productos-seccion">
            <div className="editar-productos-seccion__titulo">Todas las subcategorías</div>
            {subcategoriasCatalogo.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Todavía no hay subcategorías.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {categoriasCatalogo.map((c) => {
                  const subs = subcategoriasCatalogo.filter((s) => s.categoriaId === c.id);
                  const raices = subs
                    .filter((s) => !s.padreSubcategoriaId || !subs.some((otra) => otra.id === s.padreSubcategoriaId))
                    .sort((a, b) => {
                      const posicionGrupo = (raiz: SubcategoriaEntrada) => Math.min(
                        ...subs
                          .map((s, index) => (s.id === raiz.id || s.padreSubcategoriaId === raiz.id ? index : Number.POSITIVE_INFINITY))
                      );
                      return posicionGrupo(a) - posicionGrupo(b);
                    });
                  const subsOrdenadas = raices.flatMap((raiz) => [
                    raiz,
                    ...subs.filter((s) => s.padreSubcategoriaId === raiz.id)
                  ]);
                  const todosProductos = [...velas, ...inciensos, ...figuras, ...kits, ...joyas];
                  const productosCategoria = todosProductos.filter((p) => p.categoria === c.id);
                  const numeroSubcarpetas = subs.filter((s) => s.padreSubcategoriaId).length;
                  return (
                    <details key={c.id} style={{ border: `1px solid ${THEME.goldMain}`, borderRadius: 10 }}>
                      <summary
                        style={{
                          cursor: "pointer",
                          padding: "12px 14px",
                          color: THEME.goldMain,
                          fontWeight: "bold",
                          listStyle: "none"
                        }}
                      >
                        {c.nombre}{" "}
                        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "normal" }}>
                          ({raices.length} {raices.length === 1 ? "carpeta" : "carpetas"}
                          {numeroSubcarpetas > 0 ? ` + ${numeroSubcarpetas} ${numeroSubcarpetas === 1 ? "subcarpeta" : "subcarpetas"}` : ""}
                          {` · ${productosCategoria.length} ${productosCategoria.length === 1 ? "producto" : "productos"}`})
                        </span>
                      </summary>
                      <ul style={{ listStyle: "none", margin: 0, padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                        {subs.length === 0 ? (
                          <li style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Sin subcategorías todavía.</li>
                        ) : null}
                        {subsOrdenadas.map((sub) => {
                          const hijasIds = subs.filter((s) => s.padreSubcategoriaId === sub.id).map((s) => s.id);
                          const enUsoDirecto = todosProductos.filter((p) => p.subcategoriaId === sub.id).length;
                          const enUsoHijas = todosProductos.filter((p) => p.subcategoriaId && hijasIds.includes(p.subcategoriaId)).length;
                          const enUso = enUsoDirecto + enUsoHijas;
                          const editando = subEditandoId === sub.id;
                          const esHija = Boolean(sub.padreSubcategoriaId && subs.some((s) => s.id === sub.padreSubcategoriaId));
                          return (
                            <li
                              key={sub.id}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: esHija ? 6 : 8,
                                padding: esHija ? "7px 9px" : "10px 12px",
                                marginLeft: esHija ? 18 : 0,
                                marginRight: esHija ? 18 : 0,
                                border: esHija ? "none" : `1px solid ${THEME.goldMain}`,
                                borderRadius: esHija ? 0 : 10,
                                background: "transparent"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                {editando ? (
                                  <input
                                    type="text"
                                    className="categoria-text-input"
                                    autoFocus
                                    value={nombreSubEditado}
                                    onChange={(e) => setNombreSubEditado(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        void (async () => {
                                          try {
                                            await renombrarSubcategoria(sub.id, nombreSubEditado, padreSubEditado || undefined);
                                            setSubEditandoId(null);
                                            notificarExito(mostrarNotificacion, "Subcategoría guardada");
                                          } catch (e) {
                                            notificarError(mostrarNotificacion, e instanceof Error ? e.message : "No se pudo guardar la subcategoría");
                                          }
                                        })();
                                      } else if (e.key === "Escape") {
                                        setSubEditandoId(null);
                                      }
                                    }}
                                    style={{ flex: 1, minWidth: 0 }}
                                  />
                                ) : (
                                  <span style={{ flex: 1, color: "white", fontSize: esHija ? 11 : 13 }}>
                                    {esHija ? "↳ " : ""}{sub.nombre}{" "}
                                    <span style={{ color: "rgba(255,255,255,0.55)", fontSize: esHija ? 10 : 12 }}>
                                      ({enUso} {enUso === 1 ? "producto" : "productos"})
                                    </span>
                                  </span>
                                )}
                                {editando ? (
                                  <>
                                    <button
                                      type="button"
                                      className="editar-productos-acciones__btn editar-productos-acciones__btn--primary"
                                      onClick={() => {
                                        void (async () => {
                                          try {
                                            await renombrarSubcategoria(sub.id, nombreSubEditado, padreSubEditado || undefined);
                                            setSubEditandoId(null);
                                            notificarExito(mostrarNotificacion, "Subcategoría guardada");
                                          } catch (e) {
                                            notificarError(mostrarNotificacion, e instanceof Error ? e.message : "No se pudo guardar la subcategoría");
                                          }
                                        })();
                                      }}
                                    >
                                      Guardar
                                    </button>
                                    <button
                                      type="button"
                                      className="editar-productos-acciones__btn editar-productos-acciones__btn--ghost"
                                      onClick={() => setSubEditandoId(null)}
                                    >
                                      Cancelar
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      className="editar-productos-acciones__btn editar-productos-acciones__btn--ghost"
                                      style={esHija ? { padding: "4px 7px", fontSize: 9 } : undefined}
                                      onClick={() => {
                                        setSubEditandoId(sub.id);
                                        setNombreSubEditado(sub.nombre);
                                        setPadreSubEditado(sub.padreSubcategoriaId ?? "");
                                      }}
                                    >
                                      Renombrar
                                    </button>
                                    <button
                                      type="button"
                                      className="editar-productos-acciones__btn editar-productos-acciones__btn--danger"
                                      style={esHija ? { padding: "4px 7px", fontSize: 9 } : undefined}
                                      onClick={() => {
                                        if (hijasIds.length > 0) {
                                          notificarError(
                                            mostrarNotificacion,
                                            `No se puede eliminar: contiene ${hijasIds.length} ${hijasIds.length === 1 ? "subcarpeta" : "subcarpetas"}.`
                                          );
                                          return;
                                        }
                                        if (enUso > 0) {
                                          notificarError(
                                            mostrarNotificacion,
                                            `No se puede eliminar: ${enUso} ${enUso === 1 ? "producto usa" : "productos usan"} esta subcategoría.`
                                          );
                                          return;
                                        }
                                        if (!window.confirm(`¿Eliminar la subcategoría "${sub.nombre}"?`)) return;
                                        void (async () => {
                                          try {
                                            await eliminarSubcategoria(sub.id);
                                            notificarExito(mostrarNotificacion, "Subcategoría eliminada");
                                          } catch (e) {
                                            notificarError(mostrarNotificacion, e instanceof Error ? e.message : "No se pudo eliminar la subcategoría");
                                          }
                                        })();
                                      }}
                                    >
                                      Eliminar
                                    </button>
                                  </>
                                )}
                              </div>
                              {editando ? (
                                <div className="editar-productos-campo" style={{ margin: 0 }}>
                                  <label className="editar-productos-label" style={{ fontSize: 12, marginBottom: 4 }}>
                                    Subcategoría padre
                                  </label>
                                  <select
                                    className="categoria-select editar-productos-select-entrada"
                                    value={padreSubEditado}
                                    onChange={(e) => setPadreSubEditado(e.target.value)}
                                  >
                                    <option value="">Sin padre (nivel raíz)</option>
                                    {hijasIds.length === 0
                                      ? subs
                                          .filter((s) => s.id !== sub.id && !s.padreSubcategoriaId)
                                          .map((s) => (
                                            <option key={s.id} value={s.id}>{s.nombre}</option>
                                          ))
                                      : null}
                                  </select>
                                </div>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    </details>
                  );
                })}
              </div>
            )}
          </section>

          <section className="editar-productos-seccion">
            <div className="editar-productos-seccion__titulo">Añadir subcategoría</div>
            <div className="editar-productos-campo">
              <label className="editar-productos-label" htmlFor="ec-sub-cat">
                Categoría destino
              </label>
              <select
                id="ec-sub-cat"
                className="categoria-select editar-productos-select-entrada"
                value={subTargetCategoria}
                onChange={(e) => {
                  setSubTargetCategoria(e.target.value);
                  setNuevaSubPadre(SUB_PADRE_SIN_SELECCION);
                }}
              >
                {categoriasCatalogo.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre.charAt(0).toUpperCase() + c.nombre.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="editar-productos-campo">
              <label className="editar-productos-label" htmlFor="ec-sub-padre">
                Subcategoría padre (opcional)
              </label>
              <select
                id="ec-sub-padre"
                className="categoria-select editar-productos-select-entrada"
                value={nuevaSubPadre}
                onChange={(e) => setNuevaSubPadre(e.target.value)}
              >
                <option value={SUB_PADRE_SIN_SELECCION} disabled>Selecciona dónde guardarla</option>
                <option value={SUB_PADRE_RAIZ}>Nivel principal de la categoría</option>
                {subcategoriasDe(subTargetCategoria)
                  .filter((s) => !s.padreSubcategoriaId)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
              </select>
              <p style={{ margin: "7px 0 0", color: THEME.goldMain, fontSize: 12, fontWeight: 600 }}>
                {nuevaSubPadre === SUB_PADRE_SIN_SELECCION
                  ? "Elige el destino antes de añadir"
                  : `Destino: ${nombreSubTargetCategoria} → ${nuevaSubPadreEntrada?.nombre ?? "nivel principal"}`}
              </p>
            </div>
            <div className="editar-productos-campo">
              <input
                type="text"
                className="categoria-text-input"
                value={nuevaSubNombre}
                onChange={(e) => setNuevaSubNombre(e.target.value)}
                placeholder="Ej: Collares"
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  void (async () => {
                    try {
                      if (nuevaSubPadre === SUB_PADRE_SIN_SELECCION) throw new Error("Selecciona dónde guardar la subcategoría");
                      const padreId = nuevaSubPadre === SUB_PADRE_RAIZ ? undefined : nuevaSubPadre;
                      await agregarSubcategoria(subTargetCategoria, nuevaSubNombre, padreId);
                      setNuevaSubNombre("");
                      setNuevaSubPadre(SUB_PADRE_SIN_SELECCION);
                      notificarExito(mostrarNotificacion, "✅ Subcategoría añadida");
                    } catch (e) {
                      notificarError(mostrarNotificacion, e instanceof Error ? e.message : "No se pudo crear la subcategoría");
                    }
                  })();
                }}
              />
            </div>
            <div className="editar-productos-acciones">
              <button
                type="button"
                className="editar-productos-acciones__btn editar-productos-acciones__btn--accent"
                onClick={() => {
                  void (async () => {
                    try {
                      if (nuevaSubPadre === SUB_PADRE_SIN_SELECCION) throw new Error("Selecciona dónde guardar la subcategoría");
                      const padreId = nuevaSubPadre === SUB_PADRE_RAIZ ? undefined : nuevaSubPadre;
                      await agregarSubcategoria(subTargetCategoria, nuevaSubNombre, padreId);
                      setNuevaSubNombre("");
                      setNuevaSubPadre(SUB_PADRE_SIN_SELECCION);
                      notificarExito(mostrarNotificacion, "✅ Subcategoría añadida");
                    } catch (e) {
                      notificarError(mostrarNotificacion, e instanceof Error ? e.message : "No se pudo crear la subcategoría");
                    }
                  })();
                }}
              >
                Añadir subcategoría
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
