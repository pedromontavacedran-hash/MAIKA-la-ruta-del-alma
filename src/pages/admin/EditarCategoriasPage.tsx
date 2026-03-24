import type { Dispatch, SetStateAction } from "react";
import type { CategoriaEntrada, Pagina } from "../../types";
import BotonCerrar from "../../components/BotonCerrar";
import { THEME } from "../../config";
import { isAdminAuthorized } from "../../utils/adminAuth";

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
  CATEGORIA_IMAGENES_KEY: string;
}

const panelStyle = {
  minHeight: "100vh" as const,
  background: THEME.bg,
  color: THEME.goldMain,
  display: "flex" as const,
  flexDirection: "column" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  padding: 40
};

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
    CATEGORIA_IMAGENES_KEY
  } = props;

  const valorSelect = categoriasCatalogo.some((c) => c.id === categoriaSeleccionada) ? categoriaSeleccionada : (categoriasCatalogo[0]?.id ?? "");

  return (
    <div style={panelStyle}>
      <h2 style={{ fontSize: 38, margin: 0, marginBottom: 30 }}>Editar Categorías</h2>
      <div className="categoria-edit-panel editar-categorias-panel" style={{ position: "relative" }}>
        <BotonCerrar
          onClick={() => {
            if (isAdminAuthorized()) {
              setPagina("admin");
            } else {
              setPagina("inicio");
            }
          }}
          ariaLabel="Cerrar"
          title="Cerrar"
        />
        <label style={{ color: THEME.goldMain, fontWeight: "bold", fontSize: 20 }}>Nombre de la categoría</label>
        <select className="categoria-select" value={valorSelect} onChange={(e) => setCategoriaSeleccionada(e.target.value)}>
          {categoriasCatalogo.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre.charAt(0).toUpperCase() + c.nombre.slice(1)}</option>
          ))}
        </select>

        <label style={{ color: THEME.goldMain, fontWeight: "bold", fontSize: 20 }}>Vista previa de la categoría</label>
        <div style={{ display: "flex", alignItems: "center", gap: 15, marginTop: 10, marginBottom: 25 }}>
          <div style={{ fontSize: Number(tamanoCategoria) || 22, color: colorCategoria, fontStyle: estiloTextoCategoria === "italic" ? "italic" : "normal", fontWeight: estiloTextoCategoria === "bold" ? "bold" : "normal" }}>
            {categoriasCatalogo.find((c) => c.id === categoriaSeleccionada)?.nombre ?? categoriaSeleccionada}
          </div>
        </div>

        <label style={{ color: THEME.goldMain, fontWeight: "bold", fontSize: 20 }}>Imagen</label>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <label className="categoria-file-label">
            {nombreImagenCategoria || "Seleccionar imagen"}
            <input
              type="file"
              className="categoria-file-input"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setNombreImagenCategoria(file.name);
                const reader = new FileReader();
                reader.onload = (event) => setPreviewCategoria(event.target?.result as string);
                reader.readAsDataURL(file);
              }}
            />
          </label>
          {previewCategoria && (
            <img src={previewCategoria} alt="Vista previa" style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 10, border: `2px solid ${THEME.goldMain}` }} />
          )}
        </div>

        <label style={{ color: THEME.goldMain, fontWeight: "bold", fontSize: 20 }}>Color</label>
        <input type="color" value={colorCategoria} onChange={(e) => setColorCategoria(e.target.value)} style={{ width: 60, height: 60, border: `2px solid ${THEME.goldMain}`, borderRadius: 12, marginBottom: 18 }} />

        <label style={{ color: THEME.goldMain, fontWeight: "bold", fontSize: 20 }}>Tamaño del texto</label>
        <input type="number" min={12} max={48} className="categoria-number-input" placeholder="Tamaño..." value={tamanoCategoria === "0" ? "" : tamanoCategoria} onChange={(e) => setTamanoCategoria(e.target.value)} />

        <label style={{ color: THEME.goldMain, fontWeight: "bold", fontSize: 20 }}>Estilo del texto</label>
        <select value={estiloTextoCategoria} onChange={(e) => setEstiloTextoCategoria(e.target.value)} style={{ padding: 10, borderRadius: 10, border: `2px solid ${THEME.goldMain}`, background: THEME.bg, color: THEME.goldMain, fontSize: 16, marginBottom: 20 }}>
          <option value="normal">Normal</option>
          <option value="italic">Cursiva</option>
          <option value="bold">Negrita</option>
        </select>

        <button className="categoria-edit-btn" onClick={() => {
          try {
            const raw = localStorage.getItem(CATEGORIA_IMAGENES_KEY);
            const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
            if (previewCategoria) map[categoriaSeleccionada] = previewCategoria;
            else delete map[categoriaSeleccionada];
            localStorage.setItem(CATEGORIA_IMAGENES_KEY, JSON.stringify(map));
          } catch { /* ignore */ }
          mostrarNotificacion("✅ Categoría guardada", "exito");
          if (isAdminAuthorized()) {
            setPagina("admin");
          } else {
            setPagina("inicio");
          }
        }}>Guardar</button>

        <button className="categoria-edit-btn" style={{ background: "#1565c0", color: THEME.goldMain, border: `2px solid ${THEME.goldMain}` }} onClick={() => {
          setCategoriaARenombrar(categoriaSeleccionada);
          setNuevaCategoriaNombre(categoriasCatalogo.find((c) => c.id === categoriaSeleccionada)?.nombre ?? categoriaSeleccionada);
          setNuevaCategoriaImagen(previewCategoria);
          setNuevaCategoriaNombreImagen(nombreImagenCategoria);
          setNuevaCategoriaTamano(tamanoCategoria);
          setNuevaCategoriaColor(colorCategoria);
          setNuevaCategoriaEstilo(estiloTextoCategoria);
          setPagina("nuevaCategoria");
        }}>Renombrar categoría</button>

        <button className="categoria-edit-btn" style={{ background: "#1565c0", color: THEME.goldMain, border: `2px solid ${THEME.goldMain}` }} onClick={() => {
          setCategoriaARenombrar(null);
          setNuevaCategoriaNombre("");
          setNuevaCategoriaImagen(null);
          setNuevaCategoriaNombreImagen("");
          setNuevaCategoriaTamano("22");
          setNuevaCategoriaColor("#ffffff");
          setNuevaCategoriaEstilo("normal");
          setPagina("nuevaCategoria");
        }}>Añadir categoría</button>

        <button className="categoria-edit-btn" style={{ background: "#7b2d3a", color: "#fff", border: `2px solid ${THEME.goldMain}` }} onClick={() => {
          const id = categoriaSeleccionada;
          const nombre = categoriasCatalogo.find((c) => c.id === id)?.nombre ?? id;
          if (!window.confirm(`¿Eliminar la categoría "${nombre}"?`)) return;
          const siguiente = categoriasCatalogo.filter((c) => c.id !== id);
          setCategoriasCatalogo(siguiente);
          setCategoriaSeleccionada(siguiente[0]?.id ?? "");
          mostrarNotificacion("Categoría eliminada", "normal");
        }}>Eliminar categoría</button>
      </div>
    </div>
  );
}
