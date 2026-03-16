import { useState, useCallback, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Producto, Pagina, IntencionProducto } from "../../types";
import { INTENCIONES_OPCIONES } from "../../types";

type CategoriaCatalogo = "velas" | "inciensos" | "figuras" | "kits";

const CATEGORIAS: { id: CategoriaCatalogo; nombre: string; emoji: string }[] = [
  { id: "velas", nombre: "Velas", emoji: "🕯️" },
  { id: "inciensos", nombre: "Inciensos", emoji: "🌿" },
  { id: "figuras", nombre: "Figuras", emoji: "🪷" },
  { id: "kits", nombre: "Kits", emoji: "📦" }
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
  umbralStockBajo: number;
  mostrarNotificacion: (msg: string, tipo: "normal" | "exito" | "error") => void;
}

const panelStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#0B0B0D",
  color: "#C9A24A",
  padding: 24,
  boxSizing: "border-box"
};

const summaryStyle: React.CSSProperties = {
  color: "#C9A24A",
  fontWeight: "bold",
  fontSize: 20,
  cursor: "pointer",
  border: "2px solid #C9A24A",
  borderRadius: 12,
  padding: "14px 18px",
  background: "rgba(201, 162, 74, 0.08)",
  listStyle: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: 8
};

const inputModalStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 10,
  border: "2px solid #C9A24A",
  background: "#0B0B0D",
  color: "#C9A24A",
  fontSize: 17,
  boxSizing: "border-box",
  minHeight: 48
};

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
  const refNombre = useRef<HTMLInputElement>(null);
  const refCoste = useRef<HTMLInputElement>(null);
  const refPrecio = useRef<HTMLInputElement>(null);
  const refStock = useRef<HTMLInputElement>(null);

  const getProductosByCategoria = useCallback(
    (cat: CategoriaCatalogo): Producto[] => {
      if (cat === "velas") return velas;
      if (cat === "inciensos") return inciensos;
      if (cat === "figuras") return figuras;
      return kits;
    },
    [velas, inciensos, figuras, kits]
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
    },
    []
  );

  const actualizarDatos = useCallback(
    (
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
      const nombreFinal = String(nombre ?? "").trim() || "Sin nombre";
      const costeFinal = Number.isFinite(coste) && coste >= 0 ? coste : 0;
      const precioFinal = Number.isFinite(precio) && precio >= 0 ? precio : 0;
      const stockFinal = Math.max(0, Math.floor(Number(stock)) || 0);
      const dto = descuentoPorcentaje != null ? Math.min(100, Math.max(0, Number(descuentoPorcentaje))) : undefined;
      const actualizado = {
        nombre: nombreFinal,
        precioCosteIvaIncluido: costeFinal,
        precio: precioFinal,
        stock: stockFinal,
        ...(dto !== undefined && dto > 0 ? { descuentoPorcentaje: dto } : { descuentoPorcentaje: undefined }),
        ...(intencion !== undefined ? { intencion: intencion || undefined } : {}),
        ...(paraQueSirve !== undefined ? { paraQueSirve: String(paraQueSirve ?? "").trim() || undefined } : {}),
        ...(comoUsar !== undefined ? { comoUsar: String(comoUsar ?? "").trim() || undefined } : {})
      };
      if (categoria === "velas") setVelas((prev) => prev.map((p) => (p.id === id ? { ...p, ...actualizado } : p)));
      else if (categoria === "inciensos") setInciensos((prev) => prev.map((p) => (p.id === id ? { ...p, ...actualizado } : p)));
      else if (categoria === "figuras") setFiguras((prev) => prev.map((p) => (p.id === id ? { ...p, ...actualizado } : p)));
      else setKits((prev) => prev.map((p) => (p.id === id ? { ...p, ...actualizado } : p)));
      setModalEditar(null);
      setEditarNombre("");
      setEditarCoste("");
      setEditarPrecio("");
      setEditarDescuento("");
      setEditarStock("");
      setEditarIntencion("");
      setEditarParaQueSirve("");
      setEditarComoUsar("");
      mostrarNotificacion("Datos actualizados", "exito");
    },
    [setVelas, setInciensos, setFiguras, setKits, mostrarNotificacion]
  );

  const crearProducto = useCallback(
    (
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
      const nombreFinal = String(nombre ?? "").trim() || "Sin nombre";
      const costeFinal = Number.isFinite(coste) && coste >= 0 ? coste : 0;
      const precioFinal = Number.isFinite(precio) && precio >= 0 ? precio : 0;
      const stockFinal = Math.max(0, Math.floor(Number(stock)) || 0);
      const dto = descuentoPorcentaje != null && descuentoPorcentaje > 0 ? Math.min(100, Math.max(0, Number(descuentoPorcentaje))) : undefined;
      const list = categoria === "velas" ? velas : categoria === "inciensos" ? inciensos : categoria === "figuras" ? figuras : kits;
      const newId = list.length > 0 ? Math.max(...list.map((p) => p.id)) + 1 : 1;
      const nuevo: Producto = {
        id: newId,
        nombre: nombreFinal,
        precio: precioFinal,
        ...(dto != null && dto > 0 ? { descuentoPorcentaje: dto } : {}),
        precioCosteIvaIncluido: costeFinal,
        stock: stockFinal,
        imagen: `/${categoria}-${newId}.jpg`,
        categoria,
        descripcion: "",
        ...(intencion ? { intencion } : {}),
        ...(paraQueSirve?.trim() ? { paraQueSirve: paraQueSirve.trim() } : {}),
        ...(comoUsar?.trim() ? { comoUsar: comoUsar.trim() } : {})
      };
      if (categoria === "velas") setVelas((prev) => [...prev, nuevo]);
      else if (categoria === "inciensos") setInciensos((prev) => [...prev, nuevo]);
      else if (categoria === "figuras") setFiguras((prev) => [...prev, nuevo]);
      else setKits((prev) => [...prev, nuevo]);
      setModalNuevo(null);
      setEditarNombre("");
      setEditarCoste("");
      setEditarPrecio("");
      setEditarDescuento("");
      setEditarStock("");
      setEditarIntencion("");
      setEditarParaQueSirve("");
      setEditarComoUsar("");
      mostrarNotificacion("Producto añadido", "exito");
    },
    [velas, inciensos, figuras, kits, setVelas, setInciensos, setFiguras, setKits, mostrarNotificacion]
  );

  const solicitarEliminar = useCallback((categoria: CategoriaCatalogo, id: number, nombre: string) => {
    setPendienteEliminar({ categoria, id, nombre });
  }, []);

  const ejecutarEliminacion = useCallback(() => {
    if (!pendienteEliminar) return;
    const { categoria, id } = pendienteEliminar;
    if (categoria === "velas") setVelas((prev) => prev.filter((p) => p.id !== id));
    else if (categoria === "inciensos") setInciensos((prev) => prev.filter((p) => p.id !== id));
    else if (categoria === "figuras") setFiguras((prev) => prev.filter((p) => p.id !== id));
    else setKits((prev) => prev.filter((p) => p.id !== id));
    setModalEditar(null);
    setEditarNombre("");
    setEditarCoste("");
    setEditarPrecio("");
    setEditarDescuento("");
    setEditarStock("");
    setPendienteEliminar(null);
    mostrarNotificacion("Producto eliminado", "normal");
  }, [pendienteEliminar, setVelas, setInciensos, setFiguras, setKits, mostrarNotificacion]);

  function TablaProductos({
    categoria,
    productos
  }: {
    categoria: CategoriaCatalogo;
    productos: Producto[];
  }) {
    return (
      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table style={{ width: "100%", minWidth: 640, borderCollapse: "collapse", fontSize: 15, tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "32%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "14%" }} />
          </colgroup>
          <thead>
            <tr style={{ borderBottom: "2px solid #C9A24A" }}>
              <th style={{ textAlign: "left", padding: "12px", color: "#C9A24A", fontSize: 16 }}>Producto</th>
              <th style={{ textAlign: "right", padding: "12px", color: "#C9A24A", fontSize: 16 }}>Precio coste</th>
              <th style={{ textAlign: "right", padding: "12px", color: "#C9A24A", fontSize: 16 }}>Precio venta</th>
              <th style={{ textAlign: "right", padding: "12px", color: "#C9A24A", fontSize: 16 }}>Existencias</th>
              <th style={{ padding: "12px", color: "#C9A24A", textAlign: "center", fontSize: 16 }}></th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => {
              const key = `${categoria}-${p.id}`;
              const costeNum = Number(p.precioCosteIvaIncluido);
              const precioCoste = Number.isFinite(costeNum) ? costeNum : 0;
              const precioNum = Number(p.precio);
              const precioBase = Number.isFinite(precioNum) ? precioNum : 0;
              const dto = p.descuentoPorcentaje != null ? Math.min(100, Math.max(0, Number(p.descuentoPorcentaje))) : 0;
              const precioVenta = dto > 0 ? Math.round(precioBase * (1 - dto / 100) * 100) / 100 : precioBase;
              const stockActual = Number(p.stock);
              const isBajo = stockActual <= umbralStockBajo;
              return (
                <tr key={key} style={{ borderBottom: "1px solid rgba(212,175,55,0.3)" }}>
                  <td style={{ padding: "10px 12px", color: "white", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nombre}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "rgba(255,255,255,0.9)", fontWeight: "bold" }}>
                    {precioCoste > 0 ? `${precioCoste.toFixed(2)} €` : "—"}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "#C9A24A", fontWeight: "bold" }}>
                    {precioVenta.toFixed(2)} €
                    {dto > 0 && <span style={{ fontSize: 12, opacity: 0.9, marginLeft: 4 }}>(−{dto}%)</span>}
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      textAlign: "right",
                      color: isBajo ? "#C9A24A" : "#C9A24A",
                      fontWeight: "bold"
                    }}
                  >
                    {stockActual}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => abrirModalEditar(categoria, p)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 8,
                          border: "2px solid #C9A24A",
                          background: "rgba(201, 162, 74, 0.15)",
                          color: "#C9A24A",
                          fontSize: 13,
                          cursor: "pointer",
                          fontWeight: "bold"
                        }}
                      >
                        Modificar
                      </button>
                      <button
                        type="button"
                        onClick={() => solicitarEliminar(categoria, p.id, p.nombre)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 8,
                          border: "2px solid #e57373",
                          background: "rgba(229, 115, 115, 0.15)",
                          color: "#e57373",
                          fontSize: 13,
                          cursor: "pointer",
                          fontWeight: "bold"
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <button
          type="button"
          onClick={() => setPagina("admin")}
          style={{
            background: "#C9A24A",
            border: "2px solid #C9A24A",
            color: "#1b1745",
            padding: "10px 20px",
            borderRadius: 12,
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 16
          }}
        >
          ← Volver al Admin
        </button>
        <button
          type="button"
          onClick={() => setPagina("tienda")}
          style={{
            background: "#C9A24A",
            border: "2px solid #C9A24A",
            color: "#1b1745",
            padding: "10px 20px",
            borderRadius: 12,
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 16
          }}
        >
          Ir a tienda →
        </button>
      </div>

      <h2 style={{ fontSize: 28, marginBottom: 8, color: "#C9A24A" }}>📦 Inventario</h2>
      <p style={{ color: "rgba(255,255,255,0.85)", marginBottom: 8, fontSize: 15 }}>
        Elige una categoría. Pulsa Modificar en una fila para editar precio coste, precio venta y existencias.
      </p>
      <p style={{ color: "rgba(212,175,55,0.85)", marginBottom: 8, fontSize: 14, fontStyle: "italic" }}>
        IVA incluido
      </p>
      {(() => {
        const listaBajo: { nombre: string; categoria: string; categoriaId: CategoriaCatalogo; stock: number; product: Producto }[] = [
          ...velas.filter((p) => (p.stock ?? 0) <= umbralStockBajo).map((p) => ({ nombre: p.nombre, categoria: "Velas", categoriaId: "velas" as CategoriaCatalogo, stock: p.stock ?? 0, product: p })),
          ...inciensos.filter((p) => (p.stock ?? 0) <= umbralStockBajo).map((p) => ({ nombre: p.nombre, categoria: "Inciensos", categoriaId: "inciensos" as CategoriaCatalogo, stock: p.stock ?? 0, product: p })),
          ...figuras.filter((p) => (p.stock ?? 0) <= umbralStockBajo).map((p) => ({ nombre: p.nombre, categoria: "Figuras", categoriaId: "figuras" as CategoriaCatalogo, stock: p.stock ?? 0, product: p })),
          ...kits.filter((p) => (p.stock ?? 0) <= umbralStockBajo).map((p) => ({ nombre: p.nombre, categoria: "Kits", categoriaId: "kits" as CategoriaCatalogo, stock: p.stock ?? 0, product: p }))
        ];
        const conStockBajo = listaBajo.length;
        return conStockBajo > 0 ? (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ color: "#C9A24A", fontSize: 14, fontWeight: "bold" }}>
                ⚠️ {conStockBajo} {conStockBajo === 1 ? "producto con stock bajo" : "productos con stock bajo"}
              </span>
              <button
                type="button"
                onClick={() => setMostrarListadoStockBajo((v) => !v)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "2px solid #C9A24A",
                  background: "rgba(255, 170, 0, 0.15)",
                  color: "#C9A24A",
                  fontSize: 13,
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                {mostrarListadoStockBajo ? "Ocultar" : "Ver cuáles"}
              </button>
            </div>
            {mostrarListadoStockBajo && (
              <div style={{ marginTop: 14, overflowX: "auto" }}>
                <table style={{ width: "100%", minWidth: 320, borderCollapse: "collapse", fontSize: 14, border: "1px solid rgba(212,175,55,0.4)", borderRadius: 10, overflow: "hidden" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #C9A24A", background: "rgba(201, 162, 74, 0.15)" }}>
                      <th style={{ textAlign: "left", padding: "10px 12px", color: "#C9A24A", fontSize: 13 }}>Producto</th>
                      <th style={{ textAlign: "left", padding: "10px 12px", color: "#C9A24A", fontSize: 13 }}>Categoría</th>
                      <th style={{ textAlign: "right", padding: "10px 12px", color: "#C9A24A", fontSize: 13 }}>Existencias</th>
                      <th style={{ padding: "10px 12px", color: "#C9A24A", fontSize: 13, textAlign: "center", width: 90 }}></th>
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
                        <td style={{ padding: "10px 12px", color: "#C9A24A", opacity: 0.95 }}>{item.categoria}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", color: "#C9A24A", fontWeight: "bold" }}>{item.stock} uds</td>
                        <td style={{ padding: "8px", textAlign: "center" }}>
                          <span style={{ fontSize: 12, color: "#C9A24A", opacity: 0.9 }}>Modificar →</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: 24 }} />
        );
      })()}

      {CATEGORIAS.map(({ id, nombre, emoji }) => {
        const productos = getProductosByCategoria(id);
        return (
          <details
            key={id}
            open={categoriaAbierta === id}
            style={{ marginBottom: 14 }}
          >
            <summary
              style={summaryStyle}
              onClick={(e) => { e.preventDefault(); setCategoriaAbierta((c) => (c === id ? null : id)); }}
            >
              <span>
                {emoji} {nombre}
              </span>
              <span style={{ fontSize: 16, opacity: 0.9 }}>
                {productos.length} {productos.length === 1 ? "producto" : "productos"}
              </span>
            </summary>
            <div style={{ padding: "12px 4px 4px 4px" }}>
              <div style={{ marginBottom: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    setModalEditar(null);
                    setModalNuevo(id);
                    setEditarNombre("");
                    setEditarCoste("");
                    setEditarPrecio("");
                    setEditarDescuento("");
                    setEditarStock("0");
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "2px solid #C9A24A",
                    background: "rgba(201, 162, 74, 0.2)",
                    color: "#C9A24A",
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
                <TablaProductos categoria={id} productos={productos} />
              )}
            </div>
          </details>
        );
      })}

      {modalEditar && (
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
            setModalEditar(null);
            setModalNuevo(null);
            setEditarNombre("");
            setEditarCoste("");
            setEditarPrecio("");
            setEditarStock("");
            setEditarIntencion("");
            setEditarParaQueSirve("");
            setEditarComoUsar("");
          }}
        >
          <div
            style={{
              background: "#0B0B0D",
              border: "2px solid #C9A24A",
              borderRadius: 20,
              padding: 32,
              maxWidth: 520,
              width: "100%"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ color: "#C9A24A", fontWeight: "bold", marginBottom: 16, fontSize: 22 }}>Modificar datos</div>

            <label style={{ display: "block", color: "#C9A24A", marginBottom: 6, fontSize: 16 }}>Producto</label>
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

            <label style={{ display: "block", color: "#C9A24A", marginBottom: 6, marginTop: 14, fontSize: 16 }}>Precio coste (IVA incl.) €</label>
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

            <label style={{ display: "block", color: "#C9A24A", marginBottom: 6, marginTop: 14, fontSize: 16 }}>Precio venta (IVA incl.) €</label>
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

            <label style={{ display: "block", color: "#C9A24A", marginBottom: 6, marginTop: 14, fontSize: 16 }}>Descuento % (0-100, opcional)</label>
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

            <label style={{ display: "block", color: "#C9A24A", marginBottom: 6, marginTop: 14, fontSize: 16 }}>Existencias</label>
            <input
              ref={refStock}
              type="number"
              min={0}
              value={editarStock}
              onChange={(e) => setEditarStock(e.target.value.replace(/[^\d]/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (modalEditar) {
                    const coste = parseFloat(editarCoste.replace(",", "."));
                    const precio = parseFloat(editarPrecio.replace(",", "."));
                    const stock = parseInt(editarStock, 10);
                    const dto = editarDescuento.trim() === "" ? undefined : parseFloat(editarDescuento.replace(",", "."));
                    actualizarDatos(modalEditar.categoria, modalEditar.id, editarNombre, coste, precio, stock, dto, editarIntencion, editarParaQueSirve, editarComoUsar);
                  }
                }
              }}
              style={inputModalStyle}
            />

            <label style={{ display: "block", color: "#C9A24A", marginBottom: 6, marginTop: 14, fontSize: 16 }}>Intención</label>
            <select
              value={editarIntencion}
              onChange={(e) => setEditarIntencion((e.target.value || "") as IntencionProducto | "")}
              style={inputModalStyle}
            >
              {INTENCIONES_OPCIONES.map((opt) => (
                <option key={opt.value || "vacio"} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <label style={{ display: "block", color: "#C9A24A", marginBottom: 6, marginTop: 14, fontSize: 16 }}>Para qué sirve (opcional)</label>
            <input
              type="text"
              value={editarParaQueSirve}
              onChange={(e) => setEditarParaQueSirve(e.target.value)}
              placeholder="Ej: Protección del hogar"
              style={inputModalStyle}
            />

            <label style={{ display: "block", color: "#C9A24A", marginBottom: 6, marginTop: 14, fontSize: 16 }}>Cómo usarlo (opcional)</label>
            <textarea
              value={editarComoUsar}
              onChange={(e) => setEditarComoUsar(e.target.value)}
              placeholder="Ej: Encender en luna creciente..."
              rows={3}
              style={{ ...inputModalStyle, resize: "vertical", minHeight: 72 }}
            />

            <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  setModalEditar(null);
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
                  minWidth: 80,
                  padding: "10px",
                  borderRadius: 8,
                  border: "2px solid #C9A24A",
                  background: "transparent",
                  color: "#C9A24A",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => modalEditar && solicitarEliminar(modalEditar.categoria, modalEditar.id, editarNombre || modalEditar.nombre)}
                style={{
                  padding: "10px",
                  borderRadius: 8,
                  border: "2px solid #e57373",
                  background: "rgba(229, 115, 115, 0.15)",
                  color: "#e57373",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Eliminar
              </button>
              <button
                type="button"
                onClick={() => {
                  const coste = parseFloat(editarCoste.replace(",", "."));
                  const precio = parseFloat(editarPrecio.replace(",", "."));
                  const stock = parseInt(editarStock, 10);
                  const dto = editarDescuento.trim() === "" ? undefined : parseFloat(editarDescuento.replace(",", "."));
                  actualizarDatos(modalEditar!.categoria, modalEditar!.id, editarNombre, coste, precio, stock, dto, editarIntencion, editarParaQueSirve, editarComoUsar);
                }}
                style={{
                  flex: 1,
                  minWidth: 80,
                  padding: "10px",
                  borderRadius: 8,
                  border: "none",
                  background: "#C9A24A",
                  color: "#1b1745",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Aplicar
              </button>
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
              background: "#0B0B0D",
              border: "2px solid #C9A24A",
              borderRadius: 20,
              padding: 32,
              maxWidth: 520,
              width: "100%"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ color: "#C9A24A", fontWeight: "bold", marginBottom: 12, fontSize: 22 }}>Eliminar producto</div>
            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 15, marginBottom: 20, lineHeight: 1.5 }}>
              ¿Eliminar <strong style={{ color: "#C9A24A" }}>{pendienteEliminar.nombre}</strong> del catálogo?
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setPendienteEliminar(null)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "2px solid #C9A24A",
                  background: "transparent",
                  color: "#C9A24A",
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
              background: "#0B0B0D",
              border: "2px solid #C9A24A",
              borderRadius: 20,
              padding: 32,
              maxWidth: 520,
              width: "100%"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ color: "#C9A24A", fontWeight: "bold", marginBottom: 16, fontSize: 22 }}>Nuevo producto</div>

            <label style={{ display: "block", color: "#C9A24A", marginBottom: 6, fontSize: 16 }}>Producto</label>
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

            <label style={{ display: "block", color: "#C9A24A", marginBottom: 6, marginTop: 14, fontSize: 16 }}>Precio coste (IVA incl.) €</label>
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

            <label style={{ display: "block", color: "#C9A24A", marginBottom: 6, marginTop: 14, fontSize: 16 }}>Precio venta (IVA incl.) €</label>
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

            <label style={{ display: "block", color: "#C9A24A", marginBottom: 6, marginTop: 14, fontSize: 16 }}>Descuento % (0-100, opcional)</label>
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

            <label style={{ display: "block", color: "#C9A24A", marginBottom: 6, marginTop: 14, fontSize: 16 }}>Existencias</label>
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

            <label style={{ display: "block", color: "#C9A24A", marginBottom: 6, marginTop: 14, fontSize: 16 }}>Intención</label>
            <select
              value={editarIntencion}
              onChange={(e) => setEditarIntencion((e.target.value || "") as IntencionProducto | "")}
              style={inputModalStyle}
            >
              {INTENCIONES_OPCIONES.map((opt) => (
                <option key={opt.value || "vacio"} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <label style={{ display: "block", color: "#C9A24A", marginBottom: 6, marginTop: 14, fontSize: 16 }}>Para qué sirve (opcional)</label>
            <input
              type="text"
              value={editarParaQueSirve}
              onChange={(e) => setEditarParaQueSirve(e.target.value)}
              placeholder="Ej: Protección del hogar"
              style={inputModalStyle}
            />

            <label style={{ display: "block", color: "#C9A24A", marginBottom: 6, marginTop: 14, fontSize: 16 }}>Cómo usarlo (opcional)</label>
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
                  border: "2px solid #C9A24A",
                  background: "transparent",
                  color: "#C9A24A",
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
                  background: "#C9A24A",
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
