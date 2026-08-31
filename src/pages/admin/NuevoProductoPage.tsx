import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Producto, Pagina, SubcategoriaEntrada, GeneroJoya, AcabadoJoya } from "../../types";
import { GENEROS_JOYA_OPCIONES, ACABADOS_JOYA_OPCIONES } from "../../types";
import AdminPageNav from "../../components/admin/AdminPageNav";
import ProductoForm from "../../components/admin/ProductoForm";
import { THEME } from "../../config";
import { isAdminAuthorized } from "../../utils/adminAuth";
import { notificarError, notificarExito } from "../../utils/ui/notificaciones";
import { postAdminProductoApi, aplicarCatalogoActivoEnEstado } from "../../services/apiAdminProductos";

export interface NuevoProductoPageProps {
  setPagina: (p: Pagina) => void;
  velas: Producto[];
  setVelas: Dispatch<SetStateAction<Producto[]>>;
  inciensos: Producto[];
  setInciensos: Dispatch<SetStateAction<Producto[]>>;
  figuras: Producto[];
  setFiguras: Dispatch<SetStateAction<Producto[]>>;
  setKits: Dispatch<SetStateAction<Producto[]>>;
  setJoyas: Dispatch<SetStateAction<Producto[]>>;
  categoriaNuevoProducto: "velas" | "inciensos" | "figuras" | "joyas";
  setCategoriaNuevoProducto: Dispatch<SetStateAction<"velas" | "inciensos" | "figuras" | "joyas">>;
  nuevoProductoNombre: string;
  setNuevoProductoNombre: Dispatch<SetStateAction<string>>;
  nuevoProductoPrecio: string;
  setNuevoProductoPrecio: Dispatch<SetStateAction<string>>;
  nuevoProductoStock: number;
  setNuevoProductoStock: Dispatch<SetStateAction<number>>;
  nuevoProductoDescripcion: string;
  setNuevoProductoDescripcion: Dispatch<SetStateAction<string>>;
  nuevoProductoImagen: string | null;
  setNuevoProductoImagen: Dispatch<SetStateAction<string | null>>;
  nuevoProductoNombreImagen: string;
  setNuevoProductoNombreImagen: Dispatch<SetStateAction<string>>;
  nuevoProductoTamano: string;
  setNuevoProductoTamano: Dispatch<SetStateAction<string>>;
  nuevoProductoColor: string;
  setNuevoProductoColor: Dispatch<SetStateAction<string>>;
  nuevoProductoEstilo: string;
  setNuevoProductoEstilo: Dispatch<SetStateAction<string>>;
  setProductoSeleccionado: Dispatch<SetStateAction<string>>;
  setCategoriaEditarProductos: Dispatch<SetStateAction<"velas" | "inciensos" | "figuras" | "joyas">>;
  mostrarNotificacion: (msg: string, tipo: "normal" | "exito" | "error") => void;
  subcategoriasDe: (categoriaId: string) => SubcategoriaEntrada[];
}

export default function NuevoProductoPage(props: NuevoProductoPageProps) {
  const {
    setPagina,
    setVelas,
    setInciensos,
    setFiguras,
    setKits,
    setJoyas,
    categoriaNuevoProducto,
    setCategoriaNuevoProducto,
    nuevoProductoNombre,
    setNuevoProductoNombre,
    nuevoProductoPrecio,
    setNuevoProductoPrecio,
    nuevoProductoStock,
    setNuevoProductoStock,
    nuevoProductoDescripcion,
    setNuevoProductoDescripcion,
    nuevoProductoImagen,
    setNuevoProductoImagen,
    nuevoProductoNombreImagen,
    setNuevoProductoNombreImagen,
    nuevoProductoTamano,
    setNuevoProductoTamano,
    nuevoProductoColor,
    setNuevoProductoColor,
    nuevoProductoEstilo,
    setNuevoProductoEstilo,
    setProductoSeleccionado,
    setCategoriaEditarProductos,
    mostrarNotificacion,
    subcategoriasDe
  } = props;

  const [subcategoriaId, setSubcategoriaId] = useState("");
  const [generoJoya, setGeneroJoya] = useState<GeneroJoya | "">("");
  const [acabadoJoya, setAcabadoJoya] = useState<AcabadoJoya | "">("");

  const subcategoriasDeCategoria = useMemo(
    () => subcategoriasDe(categoriaNuevoProducto),
    [subcategoriasDe, categoriaNuevoProducto]
  );

  const crearProducto = () => {
    const nombre = nuevoProductoNombre.trim();
    if (!nombre) {
      notificarError(mostrarNotificacion, "Escribe el nombre del producto");
      return;
    }
    const precio = Number(nuevoProductoPrecio?.replace(",", "."));
    if (!Number.isFinite(precio) || precio < 0) {
      notificarError(mostrarNotificacion, "Precio no válido");
      return;
    }
    const stock = Math.max(0, Math.floor(Number(nuevoProductoStock) || 0));
    const cat = categoriaNuevoProducto;
    if (subcategoriasDeCategoria.length > 0 && !subcategoriaId) {
      notificarError(mostrarNotificacion, "Elige la subcategoría");
      return;
    }
    const body: Record<string, unknown> = {
      categoria: cat,
      nombre,
      precio,
      stock,
      imagen: nuevoProductoImagen && nuevoProductoImagen.startsWith("data:") ? nuevoProductoImagen : "",
      descripcion: nuevoProductoDescripcion.trim(),
      activo: true,
      nombreTamano: Number(nuevoProductoTamano) || 22,
      nombreColor: nuevoProductoColor,
      nombreEstilo: nuevoProductoEstilo
    };
    if (subcategoriaId) body.subcategoriaId = subcategoriaId;
    if (cat === "joyas") {
      if (subcategoriaId === "pulseras" && generoJoya) body.generoJoya = generoJoya;
      if (acabadoJoya) body.acabadoJoya = acabadoJoya;
    }

    void (async () => {
      try {
        const created = (await postAdminProductoApi(body)) as Producto;
        const newId = Number(created?.id);
        if (!Number.isFinite(newId) || newId <= 0) {
          notificarError(mostrarNotificacion, "Respuesta del servidor inválida (sin id)");
          return;
        }
        await aplicarCatalogoActivoEnEstado(setVelas, setInciensos, setFiguras, setKits, setJoyas);
        setProductoSeleccionado(`${cat}-${newId}`);
        setCategoriaEditarProductos(cat);
        setPagina("editarProductos");
        setNuevoProductoNombre("");
        setNuevoProductoPrecio("10");
        setNuevoProductoStock(5);
        setNuevoProductoDescripcion("");
        setNuevoProductoImagen(null);
        setNuevoProductoNombreImagen("");
        setNuevoProductoTamano("22");
        setNuevoProductoColor("#ffffff");
        setNuevoProductoEstilo("normal");
        setSubcategoriaId("");
        setGeneroJoya("");
        setAcabadoJoya("");
        notificarExito(mostrarNotificacion, `✅ Producto "${nombre}" guardado en el servidor`);
      } catch (e) {
        notificarError(mostrarNotificacion, e instanceof Error ? e.message : "No se pudo crear el producto");
      }
    })();
  };

  const cancelar = () => {
    setPagina("editarProductos");
    setNuevoProductoNombre("");
    setNuevoProductoPrecio("10");
    setNuevoProductoStock(5);
    setNuevoProductoDescripcion("");
    setNuevoProductoImagen(null);
    setNuevoProductoNombreImagen("");
    setNuevoProductoTamano("22");
    setNuevoProductoColor("#ffffff");
    setNuevoProductoEstilo("normal");
    setSubcategoriaId("");
    setGeneroJoya("");
    setAcabadoJoya("");
  };

  return (
    <div
      className="nuevo-producto-route"
      style={{
        minHeight: "calc(100svh - var(--app-topbar-stack))",
        background: THEME.bg,
        color: THEME.goldMain,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box"
      }}
    >
      <AdminPageNav
        onVolver={() => {
          if (isAdminAuthorized()) {
            setPagina("admin");
          } else {
            setPagina("inicio");
          }
        }}
      />
      <div className="nuevo-producto-route__card-area">
        <div
          className="inventario-modal-editar inventario-modal-editar--con-form inventario-modal-editar--nuevo-producto editar-productos-page"
          style={{
            background: THEME.bg,
            border: `2px solid ${THEME.goldMain}`,
            borderRadius: 14,
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box"
          }}
        >
          <header className="inventario-modal-editar__header inventario-modal-editar__header--nuevo">
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
                Añadir nuevo producto
              </div>
              <div
                style={{
                  marginTop: 3,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.82)",
                  lineHeight: 1.35
                }}
              >
                Mismo flujo compacto que en inventario y edición.
              </div>
            </div>
          </header>

          <div className="inventario-modal-editar__body-scroll">
            <ProductoForm
              modo="crear"
              idPrefix="np"
              className="producto-form--inventario-modal"
              categoria={categoriaNuevoProducto}
              onCategoriaChange={(c) => setCategoriaNuevoProducto(c as "velas" | "inciensos" | "figuras" | "joyas")}
              nombre={nuevoProductoNombre}
              onNombreChange={setNuevoProductoNombre}
              precio={nuevoProductoPrecio}
              onPrecioChange={setNuevoProductoPrecio}
              descripcion={nuevoProductoDescripcion}
              onDescripcionChange={setNuevoProductoDescripcion}
              previewImagen={nuevoProductoImagen}
              nombreArchivoImagen={nuevoProductoNombreImagen}
              onSeleccionarImagen={(file, dataUrl) => {
                setNuevoProductoNombreImagen(file.name);
                setNuevoProductoImagen(dataUrl);
              }}
              color={nuevoProductoColor}
              onColorChange={setNuevoProductoColor}
              tamanoTexto={nuevoProductoTamano}
              onTamanoTextoChange={setNuevoProductoTamano}
              estiloTexto={nuevoProductoEstilo}
              onEstiloTextoChange={setNuevoProductoEstilo}
              textoVistaPreviaNombre={nuevoProductoNombre}
              stockStr={String(nuevoProductoStock)}
              onStockStrChange={(s) => setNuevoProductoStock(Math.max(0, Math.floor(parseInt(s, 10) || 0)))}
              etiquetaBotonPrincipal="Crear producto"
              onPrincipal={crearProducto}
              onCancelar={cancelar}
            >
              {subcategoriasDeCategoria.length > 0 ? (
                <section className="editar-productos-seccion">
                  <div className="editar-productos-seccion__titulo">Subcategoría</div>
                  <div className="editar-productos-seleccion-grid">
                    <div className="editar-productos-campo">
                      <label className="editar-productos-label" htmlFor="np-subcategoria">
                        Subcategoría
                      </label>
                      <select
                        id="np-subcategoria"
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
                    {categoriaNuevoProducto === "joyas" ? (
                      <div className="editar-productos-campo">
                        <label className="editar-productos-label" htmlFor="np-acabado-joya">
                          Acabado
                        </label>
                        <select
                          id="np-acabado-joya"
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
                    {categoriaNuevoProducto === "joyas" && subcategoriaId === "pulseras" ? (
                      <div className="editar-productos-campo">
                        <label className="editar-productos-label" htmlFor="np-genero-joya">
                          Pensada para
                        </label>
                        <select
                          id="np-genero-joya"
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
        </div>
      </div>
    </div>
  );
}
