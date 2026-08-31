import { useEffect, useRef, type ReactNode } from "react";
import { scrollElementIntoMaikaScrollPort } from "../../utils/maikaScrollPort";
import { redimensionarImagenADataUrl } from "../../utils/redimensionarImagen";

/** `inventario` = modal rápido desde lista (solo nombre, precio, stock, descripción). `crear`/`editar` = formulario completo en tienda admin. */
export type ProductoFormModo = "crear" | "editar" | "inventario";

type CategoriaForm = "velas" | "inciensos" | "figuras" | "kits" | "joyas";

const CAT_LABEL: Record<CategoriaForm, string> = {
  velas: "Velas",
  inciensos: "Inciensos",
  figuras: "Figuras",
  kits: "Kits",
  joyas: "Joyería del alma"
};

export type ProductoFormProps = {
  modo: ProductoFormModo;
  /** Prefijo para ids accesibles únicos */
  idPrefix: string;
  className?: string;

  categoria: CategoriaForm;
  onCategoriaChange?: (c: CategoriaForm) => void;
  /** Por defecto sin kits (crear / editar tienda) */
  categoriasOpciones?: CategoriaForm[];
  categoriaDeshabilitada?: boolean;

  mostrarSelectorProducto?: boolean;
  opcionesProducto?: { value: string; nombre: string }[];
  productoValue?: string;
  onProductoChange?: (value: string) => void;

  nombre: string;
  onNombreChange: (v: string) => void;
  precio: string;
  onPrecioChange: (v: string) => void;
  descripcion: string;
  onDescripcionChange: (v: string) => void;

  previewImagen: string | null;
  nombreArchivoImagen: string;
  onSeleccionarImagen: (file: File, dataUrl: string) => void;

  color: string;
  onColorChange: (v: string) => void;
  tamanoTexto: string;
  onTamanoTextoChange: (v: string) => void;
  estiloTexto: string;
  onEstiloTextoChange: (v: string) => void;

  textoVistaPreviaNombre: string;

  stockStr: string;
  onStockStrChange: (v: string) => void;
  mostrarFilaReponer?: boolean;
  unidadesReponer?: string;
  onUnidadesReponerChange?: (v: string) => void;
  onReponerAnadir?: () => void;

  etiquetaBotonPrincipal: string;
  onPrincipal: () => void;
  onRenombrar?: () => void;
  onAnadirProducto?: () => void;
  onEliminar?: () => void;
  onCancelar?: () => void;

  /** Contenido extra antes de «Apariencia en tienda» (p. ej. coste y descuento en edición tienda; no se usa en `inventario`) */
  antesApariencia?: ReactNode;
  /** Contenido extra después de «Stock» y antes de la fila de botones */
  children?: ReactNode;
};

const defaultCats: CategoriaForm[] = ["velas", "inciensos", "figuras", "joyas"];

export default function ProductoForm(props: ProductoFormProps) {
  const {
    modo,
    idPrefix,
    className = "",
    categoria,
    onCategoriaChange,
    categoriasOpciones = defaultCats,
    categoriaDeshabilitada = false,
    mostrarSelectorProducto = false,
    opcionesProducto = [],
    productoValue = "",
    onProductoChange,
    nombre,
    onNombreChange,
    precio,
    onPrecioChange,
    descripcion,
    onDescripcionChange,
    previewImagen,
    nombreArchivoImagen,
    onSeleccionarImagen,
    color,
    onColorChange,
    tamanoTexto,
    onTamanoTextoChange,
    estiloTexto,
    onEstiloTextoChange,
    textoVistaPreviaNombre,
    stockStr,
    onStockStrChange,
    mostrarFilaReponer = false,
    unidadesReponer = "",
    onUnidadesReponerChange,
    onReponerAnadir,
    etiquetaBotonPrincipal,
    onPrincipal,
    onRenombrar,
    onAnadirProducto,
    onEliminar,
    onCancelar,
    antesApariencia,
    children
  } = props;

  const id = (s: string) => `${idPrefix}-${s}`;
  /** Formulario mínimo del modal de inventario (sin coste, apariencia, bloques extra). */
  const esInventario = modo === "inventario";
  const compact = modo === "crear" || esInventario;
  const stockInputInventarioRef = useRef<HTMLInputElement>(null);
  const nombreInputInventarioRef = useRef<HTMLInputElement>(null);
  const precioInputInventarioRef = useRef<HTMLInputElement>(null);
  const descripcionInputInventarioRef = useRef<HTMLTextAreaElement>(null);
  const aplicarBtnInventarioRef = useRef<HTMLButtonElement>(null);

  const avanzarFocoInventario = (campo: "nombre" | "precio" | "stock" | "descripcion") => {
    if (!esInventario) return;
    if (campo === "nombre") {
      precioInputInventarioRef.current?.focus();
      precioInputInventarioRef.current?.select();
      return;
    }
    if (campo === "precio") {
      stockInputInventarioRef.current?.focus();
      stockInputInventarioRef.current?.select();
      return;
    }
    if (campo === "stock") {
      descripcionInputInventarioRef.current?.focus();
      descripcionInputInventarioRef.current?.select();
      return;
    }
    const btn = aplicarBtnInventarioRef.current;
    if (!btn) return;
    btn.focus({ preventScroll: true });
    scrollElementIntoMaikaScrollPort(btn, { align: "nearest" });
  };

  useEffect(() => {
    if (!esInventario) return;
    const raf = requestAnimationFrame(() => {
      const el = stockInputInventarioRef.current;
      if (!el) return;
      el.focus();
      el.select();
    });
    return () => cancelAnimationFrame(raf);
  }, [esInventario]);

  const wrapClass = [
    "editar-productos-page__content",
    "editar-productos-page__panel",
    "producto-form",
    compact ? "producto-form--modal" : "",
    esInventario ? "producto-form--inventario" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  const seccionTitulo = (t: string) => (
    <div className="editar-productos-seccion__titulo">{t}</div>
  );

  return (
    <div className={wrapClass}>
      {(modo === "crear" || modo === "editar") && (
        <section className="editar-productos-seccion">
          {seccionTitulo("Selección")}
          {modo === "crear" && compact ? (
            <div className="editar-productos-campo">
              <label className="editar-productos-label" htmlFor={id("cat")}>
                Categoría
              </label>
              <select
                id={id("cat")}
                className="categoria-select editar-productos-select-entrada"
                value={categoria}
                disabled={categoriaDeshabilitada || !onCategoriaChange}
                onChange={(e) => onCategoriaChange?.(e.target.value as CategoriaForm)}
              >
                {categoriasOpciones.map((c) => (
                  <option key={c} value={c}>
                    {CAT_LABEL[c]}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="editar-productos-seleccion-grid">
              <div className="editar-productos-campo">
                <label className="editar-productos-label" htmlFor={id("cat")}>
                  Categoría
                </label>
                <select
                  id={id("cat")}
                  className="categoria-select editar-productos-select-entrada"
                  value={categoria}
                  disabled={categoriaDeshabilitada || !onCategoriaChange}
                  onChange={(e) => onCategoriaChange?.(e.target.value as CategoriaForm)}
                >
                  {categoriasOpciones.map((c) => (
                    <option key={c} value={c}>
                      {CAT_LABEL[c]}
                    </option>
                  ))}
                </select>
              </div>
              {mostrarSelectorProducto ? (
                <div className="editar-productos-campo">
                  <label className="editar-productos-label" htmlFor={id("prod")}>
                    Producto
                  </label>
                  <select
                    id={id("prod")}
                    className="categoria-select editar-productos-select-entrada editar-productos-select-entrada--ultimo"
                    value={productoValue}
                    onChange={(e) => onProductoChange?.(e.target.value)}
                  >
                    {opcionesProducto.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="editar-productos-campo" aria-hidden />
              )}
            </div>
          )}
        </section>
      )}

      <section className="editar-productos-seccion">
        {seccionTitulo("Datos del producto")}
        <div
          className={
            compact
              ? "editar-productos-seleccion-grid producto-form__datos-fila-compacta"
              : "editar-productos-seleccion-grid"
          }
        >
          <div className="editar-productos-campo">
            <label className="editar-productos-label" htmlFor={id("nombre")}>
              Nombre
            </label>
            <input
              ref={esInventario ? nombreInputInventarioRef : undefined}
              id={id("nombre")}
              type="text"
              className="categoria-text-input"
              value={nombre}
              onChange={(e) => onNombreChange(e.target.value)}
              onKeyDown={(e) => {
                if (!esInventario || e.key !== "Enter") return;
                e.preventDefault();
                avanzarFocoInventario("nombre");
              }}
              placeholder="Nombre del producto"
              style={{ width: "100%", boxSizing: "border-box", minWidth: 0 }}
            />
          </div>
          <div className="editar-productos-campo">
            <label className="editar-productos-label" htmlFor={id("precio")}>
              Precio (€)
            </label>
            <input
              ref={esInventario ? precioInputInventarioRef : undefined}
              id={id("precio")}
              type="number"
              min={0}
              step={0.01}
              className="categoria-number-input"
              value={precio}
              onChange={(e) => onPrecioChange(e.target.value)}
              onKeyDown={(e) => {
                if (!esInventario || e.key !== "Enter") return;
                e.preventDefault();
                avanzarFocoInventario("precio");
              }}
            />
          </div>
        </div>
        {!esInventario ? (
          <div
            className={
              compact
                ? "editar-productos-campo producto-form__desc-campo--compact"
                : "editar-productos-campo"
            }
            style={compact ? undefined : { marginTop: 12 }}
          >
            <label className="editar-productos-label" htmlFor={id("desc")}>
              Descripción
            </label>
            <textarea
              id={id("desc")}
              className={compact ? "categoria-text-input producto-form__textarea-desc" : "categoria-text-input"}
              value={descripcion}
              onChange={(e) => onDescripcionChange(e.target.value)}
              placeholder="Descripción (opcional)"
              rows={compact ? 2 : 3}
              style={{
                width: "100%",
                boxSizing: "border-box",
                minWidth: 0,
                resize: compact ? "none" : "vertical"
              }}
            />
          </div>
        ) : null}
      </section>

      {!esInventario ? antesApariencia : null}

      {!esInventario ? (
      <section className="editar-productos-seccion">
        {seccionTitulo("Apariencia en tienda")}
        <div className="editar-productos-campo editar-productos-campo--compacto">
          <span className="editar-productos-label">Vista previa del nombre</span>
          <div className="editar-productos-preview-nombre">
            <span
              style={{
                fontSize: Number(tamanoTexto) || 22,
                color,
                fontStyle: estiloTexto === "italic" ? "italic" : "normal",
                fontWeight: estiloTexto === "bold" ? "bold" : "normal"
              }}
            >
              {textoVistaPreviaNombre.trim() || "—"}
            </span>
          </div>
        </div>

        {compact ? (
          <>
            <div className="editar-productos-campo producto-form__campo-imagen-compact">
              <label className="editar-productos-label" htmlFor={id("file")}>
                Imagen
              </label>
              <div className="editar-productos-imagen-fila">
                <label className="categoria-file-label" htmlFor={id("file")}>
                  {nombreArchivoImagen || "Seleccionar imagen"}
                  <input
                    id={id("file")}
                    type="file"
                    className="categoria-file-input"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      void redimensionarImagenADataUrl(file).then((dataUrl) => {
                        onSeleccionarImagen(file, dataUrl);
                      });
                    }}
                  />
                </label>
                {previewImagen ? <img src={previewImagen} alt="" className="editar-productos-thumb" /> : null}
              </div>
            </div>
            <div className="editar-productos-seleccion-grid producto-form__fila-tam-estilo">
              <div className="editar-productos-campo">
                <label className="editar-productos-label" htmlFor={id("tam")}>
                  Tamaño del texto
                </label>
                <input
                  id={id("tam")}
                  type="number"
                  min={12}
                  max={48}
                  className="categoria-number-input editar-productos-input-num--ancho"
                  placeholder="px"
                  value={tamanoTexto === "0" ? "" : tamanoTexto}
                  onChange={(e) => onTamanoTextoChange(e.target.value)}
                />
              </div>
              <div className="editar-productos-campo">
                <label className="editar-productos-label" htmlFor={id("est")}>
                  Estilo del texto
                </label>
                <select
                  id={id("est")}
                  value={estiloTexto}
                  onChange={(e) => onEstiloTextoChange(e.target.value)}
                  className="editar-productos-select-campo"
                >
                  <option value="normal">Normal</option>
                  <option value="italic">Cursiva</option>
                  <option value="bold">Negrita</option>
                </select>
              </div>
            </div>
            <div className="editar-productos-campo producto-form__fila-color-compact">
              <label className="editar-productos-label" htmlFor={id("color")}>
                Color
              </label>
              <input
                id={id("color")}
                type="color"
                value={color}
                onChange={(e) => onColorChange(e.target.value)}
                className="editar-productos-color-input producto-form__color-input--compact"
              />
            </div>
          </>
        ) : (
          <div className="editar-productos-apariencia-grid">
            <div className="editar-productos-apariencia-col editar-productos-apariencia-col--izq">
              <div className="editar-productos-campo">
                <label className="editar-productos-label" htmlFor={id("file")}>
                  Imagen
                </label>
                <div className="editar-productos-imagen-fila">
                  <label className="categoria-file-label" htmlFor={id("file")}>
                    {nombreArchivoImagen || "Seleccionar imagen"}
                    <input
                      id={id("file")}
                      type="file"
                      className="categoria-file-input"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        void redimensionarImagenADataUrl(file).then((dataUrl) => {
                          onSeleccionarImagen(file, dataUrl);
                        });
                      }}
                    />
                  </label>
                  {previewImagen ? <img src={previewImagen} alt="" className="editar-productos-thumb" /> : null}
                </div>
              </div>
              <div className="editar-productos-campo">
                <label className="editar-productos-label" htmlFor={id("color")}>
                  Color
                </label>
                <input
                  id={id("color")}
                  type="color"
                  value={color}
                  onChange={(e) => onColorChange(e.target.value)}
                  className="editar-productos-color-input"
                />
              </div>
            </div>
            <div className="editar-productos-apariencia-col editar-productos-apariencia-col--der">
              <div className="editar-productos-campo">
                <label className="editar-productos-label" htmlFor={id("tam")}>
                  Tamaño del texto
                </label>
                <input
                  id={id("tam")}
                  type="number"
                  min={12}
                  max={48}
                  className="categoria-number-input editar-productos-input-num--ancho"
                  placeholder="px"
                  value={tamanoTexto === "0" ? "" : tamanoTexto}
                  onChange={(e) => onTamanoTextoChange(e.target.value)}
                />
              </div>
              <div className="editar-productos-campo">
                <label className="editar-productos-label" htmlFor={id("est")}>
                  Estilo del texto
                </label>
                <select
                  id={id("est")}
                  value={estiloTexto}
                  onChange={(e) => onEstiloTextoChange(e.target.value)}
                  className="editar-productos-select-campo"
                >
                  <option value="normal">Normal</option>
                  <option value="italic">Cursiva</option>
                  <option value="bold">Negrita</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </section>
      ) : null}

      <section
        className={
          esInventario
            ? "editar-productos-seccion producto-form__stock-seccion--inventario"
            : "editar-productos-seccion"
        }
      >
        {!esInventario ? seccionTitulo("Stock") : null}
        {esInventario ? (
          <div className="editar-productos-stock-bloque producto-form__stock-bloque-simple">
            <label className="editar-productos-label" htmlFor={id("stock")}>
              Stock
            </label>
            <div className="editar-productos-stock-fila">
              <input
                ref={stockInputInventarioRef}
                id={id("stock")}
                type="number"
                min={0}
                inputMode="numeric"
                className="categoria-number-input editar-productos-input-stock"
                value={stockStr}
                onChange={(e) => onStockStrChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                avanzarFocoInventario("stock");
                }}
              />
              <span className="editar-productos-stock-sufijo">uds</span>
            </div>
          </div>
        ) : (
          <div className="editar-productos-stock-bloque">
            <div className="editar-productos-stock-fila">
              <label className="editar-productos-stock-inline-label" htmlFor={id("stock")}>
                Existencias
              </label>
              <input
                id={id("stock")}
                type="number"
                min={0}
                className="categoria-number-input editar-productos-input-stock"
                value={stockStr}
                onChange={(e) => onStockStrChange(e.target.value)}
              />
              <span className="editar-productos-stock-sufijo">uds</span>
              {mostrarFilaReponer ? (
                <>
                  <span className="editar-productos-stock-sep" aria-hidden />
                  <label className="editar-productos-stock-inline-label" htmlFor={id("reponer")}>
                    Reponer
                  </label>
                  <input
                    id={id("reponer")}
                    type="number"
                    min={0}
                    placeholder="Cant."
                    value={unidadesReponer}
                    onChange={(e) => onUnidadesReponerChange?.(e.target.value)}
                    className="editar-productos-input-reponer"
                  />
                  <button type="button" className="editar-productos-btn-reponer" onClick={() => onReponerAnadir?.()}>
                    Añadir
                  </button>
                </>
              ) : null}
            </div>
            {modo === "editar" ? (
              <p className="editar-productos-stock-hint">Suma unidades recibidas del proveedor sin reescribir el total a mano.</p>
            ) : null}
          </div>
        )}
      </section>

      {esInventario ? (
        <section className="editar-productos-seccion">
          {seccionTitulo("Descripción")}
          <div className="editar-productos-campo producto-form__desc-campo--compact">
            <label className="editar-productos-label" htmlFor={id("desc-inv")}>
              Descripción
            </label>
            <textarea
              ref={descripcionInputInventarioRef}
              id={id("desc-inv")}
              className="categoria-text-input producto-form__textarea-desc producto-form__textarea-desc--inventario-modal"
              value={descripcion}
              onChange={(e) => onDescripcionChange(e.target.value)}
              onKeyDown={(e) => {
                if (!esInventario || e.key !== "Enter" || e.shiftKey) return;
                e.preventDefault();
                const btn = aplicarBtnInventarioRef.current;
                if (btn) {
                  btn.focus({ preventScroll: true });
                  scrollElementIntoMaikaScrollPort(btn, { align: "nearest" });
                  return;
                }
                avanzarFocoInventario("descripcion");
              }}
              placeholder="Descripción (opcional)"
              rows={3}
              style={{
                width: "100%",
                boxSizing: "border-box",
                minWidth: 0,
                resize: "vertical" as const
              }}
            />
          </div>
        </section>
      ) : null}

      {!esInventario ? children : null}

      <div className="editar-productos-acciones">
        {modo === "crear" ? (
          <>
            <button
              type="button"
              ref={esInventario ? aplicarBtnInventarioRef : undefined}
              className="editar-productos-acciones__btn editar-productos-acciones__btn--primary"
              onClick={onPrincipal}
            >
              {etiquetaBotonPrincipal}
            </button>
            {onCancelar ? (
              <button
                type="button"
                className="editar-productos-acciones__btn editar-productos-acciones__btn--ghost"
                onClick={onCancelar}
              >
                Cancelar
              </button>
            ) : null}
          </>
        ) : modo === "editar" ? (
          <>
            <button
              type="button"
              className="editar-productos-acciones__btn editar-productos-acciones__btn--primary"
              onClick={onPrincipal}
            >
              {etiquetaBotonPrincipal}
            </button>
            {onRenombrar ? (
              <button
                type="button"
                className="editar-productos-acciones__btn editar-productos-acciones__btn--ghost"
                onClick={onRenombrar}
              >
                Renombrar
              </button>
            ) : null}
            {onAnadirProducto ? (
              <button
                type="button"
                className="editar-productos-acciones__btn editar-productos-acciones__btn--accent"
                onClick={onAnadirProducto}
              >
                Añadir producto
              </button>
            ) : null}
            {onEliminar ? (
              <button
                type="button"
                className="editar-productos-acciones__btn editar-productos-acciones__btn--danger"
                onClick={onEliminar}
              >
                Eliminar
              </button>
            ) : null}
          </>
        ) : (
          <>
            {onEliminar ? (
              <button
                type="button"
                className="editar-productos-acciones__btn editar-productos-acciones__btn--danger"
                onClick={onEliminar}
              >
                Eliminar
              </button>
            ) : null}
            <button
              type="button"
              ref={esInventario ? aplicarBtnInventarioRef : undefined}
              className="editar-productos-acciones__btn editar-productos-acciones__btn--primary"
              onClick={onPrincipal}
            >
              {etiquetaBotonPrincipal}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
