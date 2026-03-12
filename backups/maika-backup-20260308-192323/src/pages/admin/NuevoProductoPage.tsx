import type { Dispatch, SetStateAction } from "react";
import type { Producto, Pagina } from "../../types";

export interface NuevoProductoPageProps {
  setPagina: (p: Pagina) => void;
  velas: Producto[];
  setVelas: Dispatch<SetStateAction<Producto[]>>;
  inciensos: Producto[];
  setInciensos: Dispatch<SetStateAction<Producto[]>>;
  figuras: Producto[];
  setFiguras: Dispatch<SetStateAction<Producto[]>>;
  categoriaNuevoProducto: "velas" | "inciensos" | "figuras";
  setCategoriaNuevoProducto: Dispatch<SetStateAction<"velas" | "inciensos" | "figuras">>;
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
  setCategoriaEditarProductos: Dispatch<SetStateAction<"velas" | "inciensos" | "figuras">>;
  mostrarNotificacion: (msg: string, tipo: "normal" | "exito" | "error") => void;
}

const panelStyle = {
  minHeight: "100vh" as const,
  background: "#1b1745",
  color: "gold",
  display: "flex" as const,
  flexDirection: "column" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  padding: 40
};

export default function NuevoProductoPage(props: NuevoProductoPageProps) {
  const {
    setPagina,
    velas,
    setVelas,
    inciensos,
    setInciensos,
    figuras,
    setFiguras,
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
    mostrarNotificacion
  } = props;

  const crearProducto = () => {
    const nombre = nuevoProductoNombre.trim();
    if (!nombre) {
      mostrarNotificacion("Escribe el nombre del producto", "error");
      return;
    }
    const precio = Number(nuevoProductoPrecio?.replace(",", "."));
    if (!Number.isFinite(precio) || precio < 0) {
      mostrarNotificacion("Precio no válido", "error");
      return;
    }
    const stock = Math.max(0, Math.floor(Number(nuevoProductoStock) || 0));
    const cat = categoriaNuevoProducto;
    let nuevoId: number;
    if (cat === "velas") nuevoId = velas.length > 0 ? Math.max(...velas.map((p) => p.id)) + 1 : 1;
    else if (cat === "inciensos") nuevoId = inciensos.length > 0 ? Math.max(...inciensos.map((p) => p.id)) + 1 : 101;
    else nuevoId = figuras.length > 0 ? Math.max(...figuras.map((p) => p.id)) + 1 : 201;

    const nuevoProducto: Producto = {
      id: nuevoId,
      nombre,
      precio,
      stock,
      imagen: nuevoProductoImagen && nuevoProductoImagen.startsWith("data:") ? nuevoProductoImagen : "",
      categoria: cat,
      descripcion: nuevoProductoDescripcion.trim(),
      nombreTamano: Number(nuevoProductoTamano) || 22,
      nombreColor: nuevoProductoColor,
      nombreEstilo: nuevoProductoEstilo as "normal" | "italic" | "bold"
    };

    if (cat === "velas") setVelas((prev) => [...prev, nuevoProducto]);
    else if (cat === "inciensos") setInciensos((prev) => [...prev, nuevoProducto]);
    else setFiguras((prev) => [...prev, nuevoProducto]);

    setProductoSeleccionado(`${cat}-${nuevoId}`);
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
    mostrarNotificacion(`✅ Producto "${nombre}" añadido`, "exito");
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
  };

  return (
    <div style={panelStyle}>
      <h2 style={{ fontSize: 38, marginBottom: 30 }}>Añadir nuevo producto</h2>
      <div className="categoria-edit-panel">
        <label style={{ color: "gold", fontWeight: "bold", fontSize: 20 }}>Categoría</label>
        <select className="categoria-select" value={categoriaNuevoProducto} onChange={(e) => setCategoriaNuevoProducto(e.target.value as "velas" | "inciensos" | "figuras")}>
          <option value="velas">Velas</option>
          <option value="inciensos">Inciensos</option>
          <option value="figuras">Figuras</option>
        </select>

        <label style={{ color: "gold", fontWeight: "bold", fontSize: 20 }}>Nombre</label>
        <input type="text" className="categoria-text-input" value={nuevoProductoNombre} onChange={(e) => setNuevoProductoNombre(e.target.value)} placeholder="Nombre del producto" />

        <label style={{ color: "gold", fontWeight: "bold", fontSize: 20 }}>Precio (€)</label>
        <input type="number" min={0} step={0.01} className="categoria-number-input" value={nuevoProductoPrecio} onChange={(e) => setNuevoProductoPrecio(e.target.value)} />

        <label style={{ color: "gold", fontWeight: "bold", fontSize: 20 }}>Stock inicial</label>
        <input type="number" min={0} className="categoria-number-input" value={nuevoProductoStock} onChange={(e) => setNuevoProductoStock(Math.max(0, Math.floor(Number(e.target.value) || 0)))} />

        <label style={{ color: "gold", fontWeight: "bold", fontSize: 20 }}>Descripción (opcional)</label>
        <div style={{ gridColumn: "span 2", width: "100%" }}>
          <textarea className="categoria-text-input" value={nuevoProductoDescripcion} onChange={(e) => setNuevoProductoDescripcion(e.target.value)} placeholder="Descripción del producto" style={{ width: "100%", minWidth: 0 }} />
        </div>

        <label style={{ color: "gold", fontWeight: "bold", fontSize: 20 }}>Vista previa</label>
        <div style={{ display: "flex", alignItems: "center", gap: 15, marginTop: 10, marginBottom: 5 }}>
          <div style={{ fontSize: Number(nuevoProductoTamano) || 22, color: nuevoProductoColor, fontStyle: nuevoProductoEstilo === "italic" ? "italic" : "normal", fontWeight: nuevoProductoEstilo === "bold" ? "bold" : "normal" }}>
            {nuevoProductoNombre || "—"}
          </div>
        </div>

        <label style={{ color: "gold", fontWeight: "bold", fontSize: 20 }}>Imagen</label>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <label className="categoria-file-label">
            {nuevoProductoNombreImagen || "Seleccionar imagen"}
            <input type="file" className="categoria-file-input" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setNuevoProductoNombreImagen(file.name);
              const reader = new FileReader();
              reader.onload = (event) => setNuevoProductoImagen(event.target?.result as string);
              reader.readAsDataURL(file);
            }} />
          </label>
          {nuevoProductoImagen && <img src={nuevoProductoImagen} alt="Vista previa" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "2px solid gold" }} />}
        </div>

        <label style={{ color: "gold", fontWeight: "bold", fontSize: 20 }}>Color del texto</label>
        <input type="color" value={nuevoProductoColor} onChange={(e) => setNuevoProductoColor(e.target.value)} style={{ width: 60, height: 60, border: "2px solid gold", borderRadius: 12, marginBottom: 18 }} />

        <label style={{ color: "gold", fontWeight: "bold", fontSize: 20 }}>Tamaño del texto</label>
        <input type="number" min={12} max={48} className="categoria-number-input" value={nuevoProductoTamano === "0" ? "" : nuevoProductoTamano} onChange={(e) => setNuevoProductoTamano(e.target.value)} />

        <label style={{ color: "gold", fontWeight: "bold", fontSize: 20 }}>Estilo del texto</label>
        <select value={nuevoProductoEstilo} onChange={(e) => setNuevoProductoEstilo(e.target.value)} className="categoria-select" style={{ marginBottom: 20 }}>
          <option value="normal">Normal</option>
          <option value="italic">Cursiva</option>
          <option value="bold">Negrita</option>
        </select>

        <div className="categoria-btn-group">
          <button className="categoria-edit-btn" style={{ background: "#1565c0", color: "gold", border: "2px solid gold" }} onClick={crearProducto}>Crear producto</button>
          <button className="categoria-edit-btn" style={{ background: "#7b2d3a", color: "#fff", border: "2px solid gold" }} onClick={cancelar}>Cancelar</button>
        </div>
      </div>
      <button className="categoria-volver-btn" onClick={() => setPagina("editarProductos")}>Volver a Editar Productos</button>
    </div>
  );
}
