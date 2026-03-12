import type { Dispatch, SetStateAction } from "react";
import type { CategoriaEntrada, Pagina } from "../../types";

export interface NuevaCategoriaPageProps {
  setPagina: (p: Pagina) => void;
  categoriasCatalogo: CategoriaEntrada[];
  setCategoriasCatalogo: Dispatch<SetStateAction<CategoriaEntrada[]>>;
  categoriaARenombrar: string | null;
  setCategoriaARenombrar: Dispatch<SetStateAction<string | null>>;
  categoriaSeleccionada: string;
  setCategoriaSeleccionada: Dispatch<SetStateAction<string>>;
  nuevaCategoriaNombre: string;
  setNuevaCategoriaNombre: Dispatch<SetStateAction<string>>;
  nuevaCategoriaImagen: string | null;
  setNuevaCategoriaImagen: Dispatch<SetStateAction<string | null>>;
  nuevaCategoriaNombreImagen: string;
  setNuevaCategoriaNombreImagen: Dispatch<SetStateAction<string>>;
  nuevaCategoriaTamano: string;
  setNuevaCategoriaTamano: Dispatch<SetStateAction<string>>;
  nuevaCategoriaColor: string;
  setNuevaCategoriaColor: Dispatch<SetStateAction<string>>;
  nuevaCategoriaEstilo: string;
  setNuevaCategoriaEstilo: Dispatch<SetStateAction<string>>;
  setPreviewCategoria: Dispatch<SetStateAction<string | null>>;
  setNombreImagenCategoria: Dispatch<SetStateAction<string>>;
  setTamanoCategoria: Dispatch<SetStateAction<string>>;
  setColorCategoria: Dispatch<SetStateAction<string>>;
  setEstiloTextoCategoria: Dispatch<SetStateAction<string>>;
  mostrarNotificacion: (msg: string, tipo: "normal" | "exito" | "error") => void;
  CATEGORIA_IMAGENES_KEY: string;
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

export default function NuevaCategoriaPage(props: NuevaCategoriaPageProps) {
  const {
    setPagina,
    categoriasCatalogo,
    setCategoriasCatalogo,
    categoriaARenombrar,
    setCategoriaARenombrar,
    setCategoriaSeleccionada,
    nuevaCategoriaNombre,
    setNuevaCategoriaNombre,
    nuevaCategoriaImagen,
    setNuevaCategoriaImagen,
    nuevaCategoriaNombreImagen,
    setNuevaCategoriaNombreImagen,
    nuevaCategoriaTamano,
    setNuevaCategoriaTamano,
    nuevaCategoriaColor,
    setNuevaCategoriaColor,
    nuevaCategoriaEstilo,
    setNuevaCategoriaEstilo,
    setPreviewCategoria,
    setNombreImagenCategoria,
    setTamanoCategoria,
    setColorCategoria,
    setEstiloTextoCategoria,
    mostrarNotificacion,
    CATEGORIA_IMAGENES_KEY
  } = props;

  const esRenombrar = categoriaARenombrar !== null;

  const guardarCategoria = () => {
    const nombre = nuevaCategoriaNombre.trim();
    const nombreNorm = nombre.toLowerCase();
    if (!nombre) {
      mostrarNotificacion("Escribe el nombre de la categoría", "error");
      return;
    }
    if (esRenombrar) {
      if (!categoriaARenombrar) return;
      if (categoriasCatalogo.some((c) => c.nombre.toLowerCase() === nombreNorm && c.id !== categoriaARenombrar)) {
        mostrarNotificacion("❌ Ya existe una categoría con ese nombre", "error");
        return;
      }
      setCategoriasCatalogo((prev) => prev.map((c) => (c.id === categoriaARenombrar ? { ...c, nombre: nombreNorm } : c)));
      setCategoriaSeleccionada(categoriaARenombrar);
      setPreviewCategoria(nuevaCategoriaImagen);
      setNombreImagenCategoria(nuevaCategoriaNombreImagen);
      setTamanoCategoria(nuevaCategoriaTamano);
      setColorCategoria(nuevaCategoriaColor);
      setEstiloTextoCategoria(nuevaCategoriaEstilo);
      if (nuevaCategoriaImagen) {
        try {
          const raw = localStorage.getItem(CATEGORIA_IMAGENES_KEY);
          const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
          map[categoriaARenombrar] = nuevaCategoriaImagen;
          localStorage.setItem(CATEGORIA_IMAGENES_KEY, JSON.stringify(map));
        } catch { /* ignore */ }
      }
      mostrarNotificacion("✏️ Categoría renombrada", "exito");
    } else {
      if (categoriasCatalogo.some((c) => c.nombre.toLowerCase() === nombreNorm)) {
        mostrarNotificacion("❌ La categoría ya existe", "error");
        return;
      }
      const nuevoId = nombreNorm.replace(/\s+/g, "-");
      setCategoriasCatalogo((prev) => [...prev, { id: nuevoId, nombre: nombreNorm }]);
      setCategoriaSeleccionada(nuevoId);
      setPreviewCategoria(nuevaCategoriaImagen);
      setNombreImagenCategoria(nuevaCategoriaNombreImagen);
      setTamanoCategoria(nuevaCategoriaTamano);
      setColorCategoria(nuevaCategoriaColor);
      setEstiloTextoCategoria(nuevaCategoriaEstilo);
      if (nuevaCategoriaImagen) {
        try {
          const raw = localStorage.getItem(CATEGORIA_IMAGENES_KEY);
          const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
          map[nuevoId] = nuevaCategoriaImagen;
          localStorage.setItem(CATEGORIA_IMAGENES_KEY, JSON.stringify(map));
        } catch { /* ignore */ }
      }
      mostrarNotificacion("✅ Categoría añadida", "exito");
    }
    setPagina("editarCategorias");
    setCategoriaARenombrar(null);
    setNuevaCategoriaNombre("");
    setNuevaCategoriaImagen(null);
    setNuevaCategoriaNombreImagen("");
    setNuevaCategoriaTamano("22");
    setNuevaCategoriaColor("#ffffff");
    setNuevaCategoriaEstilo("normal");
  };

  const cancelar = () => {
    setPagina("editarCategorias");
    setCategoriaARenombrar(null);
    setNuevaCategoriaNombre("");
    setNuevaCategoriaImagen(null);
    setNuevaCategoriaNombreImagen("");
    setNuevaCategoriaTamano("22");
    setNuevaCategoriaColor("#ffffff");
    setNuevaCategoriaEstilo("normal");
  };

  return (
    <div style={panelStyle}>
      <h2 style={{ fontSize: 38, marginBottom: 30 }}>{esRenombrar ? "Renombrar categoría" : "Añadir nueva categoría"}</h2>
      <div className="categoria-edit-panel">
        <label style={{ color: "gold", fontWeight: "bold", fontSize: 20 }}>Nombre de la categoría</label>
        <input type="text" className="categoria-text-input" value={nuevaCategoriaNombre} onChange={(e) => setNuevaCategoriaNombre(e.target.value)} placeholder="Ej: velas, inciensos, figuras..." />

        <label style={{ color: "gold", fontWeight: "bold", fontSize: 20 }}>Vista previa</label>
        <div style={{ display: "flex", alignItems: "center", gap: 15, marginTop: 10, marginBottom: 5 }}>
          <div style={{ fontSize: Number(nuevaCategoriaTamano) || 22, color: nuevaCategoriaColor, fontStyle: nuevaCategoriaEstilo === "italic" ? "italic" : "normal", fontWeight: nuevaCategoriaEstilo === "bold" ? "bold" : "normal" }}>
            {nuevaCategoriaNombre || "—"}
          </div>
        </div>

        <label style={{ color: "gold", fontWeight: "bold", fontSize: 20 }}>Imagen (opcional)</label>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <label className="categoria-file-label">
            {nuevaCategoriaNombreImagen || "Seleccionar imagen"}
            <input type="file" className="categoria-file-input" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setNuevaCategoriaNombreImagen(file.name);
              const reader = new FileReader();
              reader.onload = (event) => setNuevaCategoriaImagen(event.target?.result as string);
              reader.readAsDataURL(file);
            }} />
          </label>
          {nuevaCategoriaImagen && <img src={nuevaCategoriaImagen} alt="Vista previa" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "2px solid gold" }} />}
        </div>

        <label style={{ color: "gold", fontWeight: "bold", fontSize: 20 }}>Color del texto</label>
        <input type="color" value={nuevaCategoriaColor} onChange={(e) => setNuevaCategoriaColor(e.target.value)} style={{ width: 60, height: 60, border: "2px solid gold", borderRadius: 12, marginBottom: 18 }} />

        <label style={{ color: "gold", fontWeight: "bold", fontSize: 20 }}>Tamaño del texto</label>
        <input type="number" min={12} max={48} className="categoria-number-input" value={nuevaCategoriaTamano === "0" ? "" : nuevaCategoriaTamano} onChange={(e) => setNuevaCategoriaTamano(e.target.value)} />

        <label style={{ color: "gold", fontWeight: "bold", fontSize: 20 }}>Estilo del texto</label>
        <select value={nuevaCategoriaEstilo} onChange={(e) => setNuevaCategoriaEstilo(e.target.value)} className="categoria-select" style={{ marginBottom: 20 }}>
          <option value="normal">Normal</option>
          <option value="italic">Cursiva</option>
          <option value="bold">Negrita</option>
        </select>

        <div className="categoria-btn-group">
          <button className="categoria-edit-btn" style={{ background: "#1565c0", color: "gold", border: "2px solid gold" }} onClick={guardarCategoria}>
            {esRenombrar ? "Guardar nombre" : "Crear categoría"}
          </button>
          <button className="categoria-edit-btn" style={{ background: "#7b2d3a", color: "#fff", border: "2px solid gold" }} onClick={cancelar}>Cancelar</button>
        </div>
      </div>
      <button className="categoria-volver-btn" style={{
        backgroundImage: "linear-gradient(rgba(10, 7, 25, 0.45), rgba(10, 7, 25, 0.45)), url('/fondo%20estrellado.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        color: "gold", 
        border: "2px solid gold" 
      }} onClick={() => setPagina("editarCategorias")}>Volver a Editar Categorías</button>
    </div>
  );
}
