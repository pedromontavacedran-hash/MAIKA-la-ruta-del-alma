import { useState, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Producto, Pagina } from "../../types";
import BotonCerrar from "../../components/BotonCerrar";

export interface EditarProductosPageProps {
  setPagina: (p: Pagina) => void;
  velas: Producto[];
  setVelas: Dispatch<SetStateAction<Producto[]>>;
  inciensos: Producto[];
  setInciensos: Dispatch<SetStateAction<Producto[]>>;
  figuras: Producto[];
  setFiguras: Dispatch<SetStateAction<Producto[]>>;
  getProductoByValue: (value: string) => Producto | undefined;
  categoriaEditarProductos: "velas" | "inciensos" | "figuras";
  setCategoriaEditarProductos: Dispatch<SetStateAction<"velas" | "inciensos" | "figuras">>;
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
  setCategoriaNuevoProducto: Dispatch<SetStateAction<"velas" | "inciensos" | "figuras">>;
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
}

const panelStyle = {
  minHeight: "100vh" as const,
  background: "#0B0B0D",
  color: "#C9A24A",
  display: "flex" as const,
  flexDirection: "column" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  padding: 40,
  position: "relative" as const
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
    mostrarNotificacion
  } = props;

  const listaActual = categoriaEditarProductos === "velas" ? velas : categoriaEditarProductos === "inciensos" ? inciensos : figuras;
  const productosDeLaCategoria = listaActual.map((p) => ({ value: `${categoriaEditarProductos}-${p.id}`, nombre: p.nombre, categoria: categoriaEditarProductos }));
  const valorSelect = productosDeLaCategoria.some((p) => p.value === productoSeleccionado) ? productoSeleccionado : productosDeLaCategoria[0]?.value ?? "";
  const productoActual = productosDeLaCategoria.find((p) => p.value === valorSelect);

  const [stockProducto, setStockProducto] = useState(0);
  const [unidadesReponer, setUnidadesReponer] = useState("");
  const productoCompleto = getProductoByValue(valorSelect);
  useEffect(() => {
    setStockProducto(productoCompleto ? Number(productoCompleto.stock) || 0 : 0);
    setUnidadesReponer("");
  }, [productoCompleto?.id, productoCompleto?.stock]);

  return (
    <div style={panelStyle}>
      <BotonCerrar onClick={() => setPagina("admin")} ariaLabel="Volver al panel" title="Cerrar" />
      <h2 style={{ fontSize: 38, marginBottom: 30 }}>Editar Productos</h2>
      <div className="categoria-edit-panel">
        <label style={{ color: "#C9A24A", fontWeight: "bold", fontSize: 20 }}>Categoría</label>
        <select
          className="categoria-select"
          value={categoriaEditarProductos}
          onChange={(e) => {
            const cat = e.target.value as "velas" | "inciensos" | "figuras";
            setCategoriaEditarProductos(cat);
            const list = cat === "velas" ? velas : cat === "inciensos" ? inciensos : figuras;
            const val = list[0] ? `${cat}-${list[0].id}` : "";
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
        >
          <option value="velas">Velas</option>
          <option value="inciensos">Inciensos</option>
          <option value="figuras">Figuras</option>
        </select>

        <label style={{ color: "#C9A24A", fontWeight: "bold", fontSize: 20 }}>Nombre del producto</label>
        <select
          className="categoria-select"
          value={valorSelect}
          onChange={(e) => {
            const val = e.target.value;
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
        >
          {productosDeLaCategoria.map((p) => (
            <option key={p.value} value={p.value}>{p.nombre}</option>
          ))}
        </select>

        <label style={{ color: "#C9A24A", fontWeight: "bold", fontSize: 20 }}>Vista previa del producto</label>
        <div style={{ display: "flex", alignItems: "center", gap: 15, marginTop: 10, marginBottom: 25 }}>
          <div style={{ fontSize: Number(tamanoProducto) || 22, color: colorProducto, fontStyle: estiloTextoProducto === "italic" ? "italic" : "normal", fontWeight: estiloTextoProducto === "bold" ? "bold" : "normal" }}>
            {productoActual?.nombre ?? "—"}
          </div>
        </div>

        <label style={{ color: "#C9A24A", fontWeight: "bold", fontSize: 20 }}>Imagen</label>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <label className="categoria-file-label">
            {nombreImagenProducto || "Seleccionar imagen"}
            <input type="file" className="categoria-file-input" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setNombreImagenProducto(file.name);
              const reader = new FileReader();
              reader.onload = (event) => setPreviewProducto(event.target?.result as string);
              reader.readAsDataURL(file);
            }} />
          </label>
          {previewProducto && <img src={previewProducto} alt="Vista previa" style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 10, border: "2px solid #C9A24A" }} />}
        </div>

        <label style={{ color: "#C9A24A", fontWeight: "bold", fontSize: 20 }}>Color</label>
        <input type="color" value={colorProducto} onChange={(e) => setColorProducto(e.target.value)} style={{ width: 60, height: 60, border: "2px solid #C9A24A", borderRadius: 12, marginBottom: 18 }} />

        <label style={{ color: "#C9A24A", fontWeight: "bold", fontSize: 20 }}>Tamaño del texto</label>
        <input type="number" min={12} max={48} className="categoria-number-input" placeholder="Tamaño..." value={tamanoProducto === "0" ? "" : tamanoProducto} onChange={(e) => setTamanoProducto(e.target.value)} />

        <label style={{ color: "#C9A24A", fontWeight: "bold", fontSize: 20 }}>Estilo del texto</label>
        <select value={estiloTextoProducto} onChange={(e) => setEstiloTextoProducto(e.target.value)} style={{ padding: 10, borderRadius: 10, border: "2px solid #C9A24A", background: "#0B0B0D", color: "#C9A24A", fontSize: 16, marginBottom: 20 }}>
          <option value="normal">Normal</option>
          <option value="italic">Cursiva</option>
          <option value="bold">Negrita</option>
        </select>

        <label style={{ color: "#C9A24A", fontWeight: "bold", fontSize: 20 }}>Stock (existencias)</label>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <input
            type="number"
            min={0}
            className="categoria-number-input"
            value={stockProducto}
            onChange={(e) => setStockProducto(Math.max(0, parseInt(e.target.value, 10) || 0))}
            style={{ width: 90 }}
          />
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>unidades</span>
        </div>
        <div style={{ marginBottom: 20, padding: 12, background: "rgba(212,175,55,0.12)", borderRadius: 12, border: "1px solid #C9A24A" }}>
          <div style={{ color: "#C9A24A", fontWeight: "bold", fontSize: 16, marginBottom: 8 }}>Reponer stock (tras compra a proveedor)</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <input
              type="number"
              min={0}
              placeholder="Unidades recibidas"
              value={unidadesReponer}
              onChange={(e) => setUnidadesReponer(e.target.value)}
              style={{ width: 140, padding: 8, borderRadius: 8, border: "2px solid #C9A24A", background: "#0B0B0D", color: "#C9A24A" }}
            />
            <button
              type="button"
              onClick={() => {
                const n = parseInt(unidadesReponer, 10);
                if (!Number.isFinite(n) || n < 0) return;
                const nuevoStock = stockProducto + n;
                setStockProducto(nuevoStock);
                setUnidadesReponer("");
                const prod = getProductoByValue(valorSelect);
                if (!prod) return;
                const updated = { ...prod, stock: nuevoStock };
                if (prod.categoria === "velas") setVelas((prev) => prev.map((p) => (p.id === prod.id ? updated : p)));
                else if (prod.categoria === "inciensos") setInciensos((prev) => prev.map((p) => (p.id === prod.id ? updated : p)));
                else setFiguras((prev) => prev.map((p) => (p.id === prod.id ? updated : p)));
                mostrarNotificacion(`✅ Stock actualizado: ${nuevoStock} unidades`, "exito");
              }}
              style={{ padding: "8px 16px", borderRadius: 8, background: "#C9A24A", color: "#1b1745", border: "none", fontWeight: "bold", cursor: "pointer" }}
            >
              Añadir al stock
            </button>
          </div>
        </div>

        <button className="categoria-edit-btn" onClick={() => {
          const prod = getProductoByValue(valorSelect);
          if (!prod) return;
          const tamano = Number(tamanoProducto) || 22;
          const updated: Producto = {
            ...prod,
            imagen: previewProducto && previewProducto.startsWith("data:") ? previewProducto : prod.imagen,
            nombreTamano: tamano,
            nombreColor: colorProducto,
            nombreEstilo: estiloTextoProducto as "normal" | "italic" | "bold",
            stock: Math.max(0, stockProducto)
          };
          if (prod.categoria === "velas") setVelas((prev) => prev.map((p) => (p.id === prod.id ? updated : p)));
          else if (prod.categoria === "inciensos") setInciensos((prev) => prev.map((p) => (p.id === prod.id ? updated : p)));
          else setFiguras((prev) => prev.map((p) => (p.id === prod.id ? updated : p)));
          mostrarNotificacion("✅ Producto guardado. Los cambios se verán en la tienda.", "exito");
          setPagina("admin");
        }}>Guardar</button>

        <button className="categoria-edit-btn" style={{ background: "#1565c0", color: "#C9A24A", border: "2px solid #C9A24A" }} onClick={() => {
          const prod = getProductoByValue(valorSelect);
          if (!prod) return;
          const nuevo = prompt("Nuevo nombre del producto", prod.nombre);
          if (!nuevo?.trim()) return;
          const updated = { ...prod, nombre: nuevo.trim() };
          if (prod.categoria === "velas") setVelas((prev) => prev.map((p) => (p.id === prod.id ? updated : p)));
          else if (prod.categoria === "inciensos") setInciensos((prev) => prev.map((p) => (p.id === prod.id ? updated : p)));
          else setFiguras((prev) => prev.map((p) => (p.id === prod.id ? updated : p)));
          setProductoSeleccionado(`${prod.categoria}-${prod.id}`);
          mostrarNotificacion("✏️ Producto renombrado", "exito");
        }}>Renombrar producto</button>

        <button className="categoria-edit-btn" style={{ background: "#1565c0", color: "#C9A24A", border: "2px solid #C9A24A" }} onClick={() => {
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
        }}>Añadir producto</button>

        <button className="categoria-edit-btn" style={{ background: "#7b2d3a", color: "#fff", border: "2px solid #C9A24A" }} onClick={() => {
          const prod = getProductoByValue(valorSelect);
          if (!prod) return;
          if (!window.confirm(`¿Eliminar el producto "${prod.nombre}"?`)) return;
          if (prod.categoria === "velas") setVelas((prev) => prev.filter((p) => p.id !== prod.id));
          else if (prod.categoria === "inciensos") setInciensos((prev) => prev.filter((p) => p.id !== prod.id));
          else setFiguras((prev) => prev.filter((p) => p.id !== prod.id));
          setProductoSeleccionado("");
          mostrarNotificacion("Producto eliminado", "normal");
        }}>Eliminar producto</button>
      </div>
    </div>
  );
}
