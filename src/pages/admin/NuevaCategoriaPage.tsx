import type { Dispatch, SetStateAction } from "react";
import type { CategoriaEntrada, Pagina } from "../../types";
import AdminPageNav from "../../components/admin/AdminPageNav";
import { THEME } from "../../config";
import { isAdminAuthorized } from "../../utils/adminAuth";
import { notificarError, notificarExito } from "../../utils/ui/notificaciones";
import { redimensionarImagenADataUrl } from "../../utils/redimensionarImagen";
import { postAdminCategoriaApi, putAdminCategoriaApi } from "../../services/apiCategorias";

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
}

const panelStyle = {
  minHeight: "calc(100svh - var(--app-topbar-stack))" as const,
  background: THEME.bg,
  color: THEME.goldMain,
  display: "flex" as const,
  flexDirection: "column" as const,
  alignItems: "center" as const,
  justifyContent: "flex-start" as const
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
    mostrarNotificacion
  } = props;

  const esRenombrar = categoriaARenombrar !== null;

  const guardarCategoria = () => {
    const nombre = nuevaCategoriaNombre.trim();
    const nombreNorm = nombre.toLowerCase();
    if (!nombre) {
      notificarError(mostrarNotificacion, "Escribe el nombre de la categoría");
      return;
    }
    if (esRenombrar) {
      if (!categoriaARenombrar) return;
      if (categoriasCatalogo.some((c) => c.nombre.toLowerCase() === nombreNorm && c.id !== categoriaARenombrar)) {
        notificarError(mostrarNotificacion, "❌ Ya existe una categoría con ese nombre");
        return;
      }
      void (async () => {
        try {
          const actualizada = await putAdminCategoriaApi(categoriaARenombrar, nombreNorm, nuevaCategoriaImagen);
          setCategoriasCatalogo((prev) => prev.map((c) => (c.id === categoriaARenombrar ? actualizada : c)));
          setCategoriaSeleccionada(categoriaARenombrar);
          setPreviewCategoria(actualizada.imagen ?? null);
          setNombreImagenCategoria(nuevaCategoriaNombreImagen);
          setTamanoCategoria(nuevaCategoriaTamano);
          setColorCategoria(nuevaCategoriaColor);
          setEstiloTextoCategoria(nuevaCategoriaEstilo);
          notificarExito(mostrarNotificacion, "✏️ Categoría renombrada");
          limpiarYVolver();
        } catch (e) {
          notificarError(mostrarNotificacion, e instanceof Error ? e.message : "No se pudo renombrar la categoría");
        }
      })();
      return;
    }
    if (categoriasCatalogo.some((c) => c.nombre.toLowerCase() === nombreNorm)) {
      notificarError(mostrarNotificacion, "❌ La categoría ya existe");
      return;
    }
    void (async () => {
      try {
        const creada = await postAdminCategoriaApi(nombreNorm, nuevaCategoriaImagen);
        setCategoriasCatalogo((prev) => [...prev, creada]);
        setCategoriaSeleccionada(creada.id);
        setPreviewCategoria(creada.imagen ?? null);
        setNombreImagenCategoria(nuevaCategoriaNombreImagen);
        setTamanoCategoria(nuevaCategoriaTamano);
        setColorCategoria(nuevaCategoriaColor);
        setEstiloTextoCategoria(nuevaCategoriaEstilo);
        notificarExito(mostrarNotificacion, "✅ Categoría añadida");
        limpiarYVolver();
      } catch (e) {
        notificarError(mostrarNotificacion, e instanceof Error ? e.message : "No se pudo crear la categoría");
      }
    })();
  };

  const limpiarYVolver = () => {
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
    <div className="admin-container" style={{ ...panelStyle }}>
      <AdminPageNav
        onVolver={() => {
          if (isAdminAuthorized()) {
            setPagina("admin");
          } else {
            setPagina("inicio");
          }
        }}
      />
      <h2 className="admin-page-heading" style={{ fontSize: 38 }}>{esRenombrar ? "Renombrar categoría" : "Añadir nueva categoría"}</h2>
      <div className="categoria-edit-panel">
        <label style={{ color: THEME.goldMain, fontWeight: "bold", fontSize: 20 }}>Nombre de la categoría</label>
        <input type="text" className="categoria-text-input" value={nuevaCategoriaNombre} onChange={(e) => setNuevaCategoriaNombre(e.target.value)} placeholder="Ej: velas, inciensos, figuras..." />

        <label style={{ color: THEME.goldMain, fontWeight: "bold", fontSize: 20 }}>Vista previa</label>
        <div style={{ display: "flex", alignItems: "center", gap: 15, marginTop: 10, marginBottom: 5 }}>
          <div style={{ fontSize: Number(nuevaCategoriaTamano) || 22, color: nuevaCategoriaColor, fontStyle: nuevaCategoriaEstilo === "italic" ? "italic" : "normal", fontWeight: nuevaCategoriaEstilo === "bold" ? "bold" : "normal" }}>
            {nuevaCategoriaNombre || "—"}
          </div>
        </div>

        <label style={{ color: THEME.goldMain, fontWeight: "bold", fontSize: 20 }}>Imagen (opcional)</label>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <label className="categoria-file-label">
            {nuevaCategoriaNombreImagen || "Seleccionar imagen"}
            <input type="file" className="categoria-file-input" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setNuevaCategoriaNombreImagen(file.name);
              void redimensionarImagenADataUrl(file).then(setNuevaCategoriaImagen);
            }} />
          </label>
          {nuevaCategoriaImagen && <img src={nuevaCategoriaImagen} alt="Vista previa" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: `2px solid ${THEME.goldMain}` }} />}
        </div>

        <label style={{ color: THEME.goldMain, fontWeight: "bold", fontSize: 20 }}>Color del texto</label>
        <input type="color" value={nuevaCategoriaColor} onChange={(e) => setNuevaCategoriaColor(e.target.value)} style={{ width: 60, height: 60, border: `2px solid ${THEME.goldMain}`, borderRadius: 12, marginBottom: 18 }} />

        <label style={{ color: THEME.goldMain, fontWeight: "bold", fontSize: 20 }}>Tamaño del texto</label>
        <input type="number" min={12} max={48} className="categoria-number-input" value={nuevaCategoriaTamano === "0" ? "" : nuevaCategoriaTamano} onChange={(e) => setNuevaCategoriaTamano(e.target.value)} />

        <label style={{ color: THEME.goldMain, fontWeight: "bold", fontSize: 20 }}>Estilo del texto</label>
        <select value={nuevaCategoriaEstilo} onChange={(e) => setNuevaCategoriaEstilo(e.target.value)} className="categoria-select" style={{ marginBottom: 20 }}>
          <option value="normal">Normal</option>
          <option value="italic">Cursiva</option>
          <option value="bold">Negrita</option>
        </select>

        <div className="categoria-btn-group">
          <button className="categoria-edit-btn" style={{ background: "#1565c0", color: THEME.goldMain, border: `2px solid ${THEME.goldMain}` }} onClick={guardarCategoria}>
            {esRenombrar ? "Guardar nombre" : "Crear categoría"}
          </button>
          <button className="categoria-edit-btn" style={{ background: "#7b2d3a", color: "#fff", border: `2px solid ${THEME.goldMain}` }} onClick={cancelar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
