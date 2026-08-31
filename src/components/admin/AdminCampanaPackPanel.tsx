import { useCallback, useMemo, useState, type ChangeEvent } from "react";
import { useApp } from "../../context/AppContext";
import type { CampanaPackConfig, CampanaPackLinea, Producto } from "../../types";
import {
  defaultCampanaPack,
  getCampanaPack,
  normalizarSrcImagenProducto,
  setCampanaPack
} from "../../utils/campanaPack";
import { fileADataUrlJpegComprimido } from "../../utils/imagenDataUrl";

type Props = {
  mostrarNotificacion: (m: string, t: "normal" | "exito" | "error") => void;
};

function toIsoGuard(s: string): string {
  const t = s.trim();
  if (!t) return t;
  return t.length === 16 ? `${t}:00` : t;
}

export default function AdminCampanaPackPanel({ mostrarNotificacion }: Props) {
  const { velas, inciensos, figuras, kits, joyas } = useApp();
  const catalogoPlano = useMemo(
    () => [...velas, ...inciensos, ...figuras, ...(kits ?? []), ...(joyas ?? [])],
    [velas, inciensos, figuras, kits, joyas]
  );
  const catalogoPorId = useMemo(() => new Map(catalogoPlano.map((p) => [p.id, p])), [catalogoPlano]);

  const [draft, setDraft] = useState<CampanaPackConfig>(() => getCampanaPack());
  const [productoAnadirId, setProductoAnadirId] = useState<number>(() => catalogoPlano[0]?.id ?? 0);

  const actualizar = useCallback((patch: Partial<CampanaPackConfig>) => {
    setDraft((d) => ({ ...d, ...patch }));
  }, []);

  const guardar = () => {
    const ini = toIsoGuard(draft.inicio);
    const fin = toIsoGuard(draft.fin);
    if (!ini || !fin) {
      mostrarNotificacion("Indica fecha y hora de inicio y fin de la campaña", "error");
      return;
    }
    const next: CampanaPackConfig = {
      ...draft,
      inicio: ini,
      fin: fin
    };
    setCampanaPack(next);
    setDraft(getCampanaPack());
    mostrarNotificacion("Campaña de pack guardada", "exito");
  };

  const quitar = () => {
    setCampanaPack(null);
    setDraft(getCampanaPack());
    mostrarNotificacion("Campaña restablecida a valores por defecto (no guardados hasta que guardes de nuevo)", "exito");
  };

  const restaurarPlantilla = () => {
    setDraft((actual) => ({
      ...defaultCampanaPack(),
      imagenUrl: actual.imagenUrl
    }));
    mostrarNotificacion("Plantilla cargada sin borrar la imagen actual. Pulsa Guardar para persistir.", "normal");
  };

  const anadirLinea = () => {
    if (!productoAnadirId || !catalogoPlano.length) return;
    const lineas: CampanaPackLinea[] = [...draft.lineas, { productoId: productoAnadirId, cantidad: 1 }];
    actualizar({ lineas });
  };

  const quitarLinea = (idx: number) => {
    const lineas = draft.lineas.filter((_, i) => i !== idx);
    actualizar({ lineas });
  };

  const setCantidadLinea = (idx: number, cantidad: number) => {
    const lineas = draft.lineas.map((l, i) => (i === idx ? { ...l, cantidad: Math.max(1, cantidad) } : l));
    actualizar({ lineas });
  };

  const onElegirImagenArchivo = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const dataUrl = await fileADataUrlJpegComprimido(file);
      actualizar({ imagenUrl: dataUrl });
      mostrarNotificacion("Imagen cargada (se guarda con la campaña en este dispositivo)", "exito");
    } catch {
      mostrarNotificacion("No se pudo leer la imagen", "error");
    }
  };

  return (
    <details style={{ border: "none", borderRadius: 12, overflow: "hidden", background: "transparent" }}>
      <summary className="btn-admin-limpio admin-btn admin-btn--purple admin-summary-btn">
        📦 CAMPAÑA / PACK DESTACADO (TIENDA)
      </summary>
      <div className="admin-accordion-content">
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginBottom: 12, lineHeight: 1.45 }}>
          Una sola campaña activa: define el pack que ves en la tienda (tarjeta + modal al hacer clic). Se guarda en{" "}
          <strong style={{ color: "#d4af37" }}>localStorage</strong>. Tipo <strong>dinámico</strong> está reservado para
          el futuro.
        </p>

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, cursor: "pointer", color: "rgba(255,255,255,0.92)", fontSize: 13 }}>
          <input type="checkbox" checked={draft.activo} onChange={(e) => actualizar({ activo: e.target.checked })} />
          Activo (mostrar pack en tienda)
        </label>

        <label style={{ display: "block", marginBottom: 8, color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
          Tipo
          <select
            className="admin-input"
            style={{ marginTop: 4 }}
            value={draft.tipo}
            onChange={(e) => actualizar({ tipo: e.target.value === "dinamico" ? "dinamico" : "fijo" })}
          >
            <option value="fijo">Pack fijo (tú eliges productos y precio)</option>
            <option value="dinamico" disabled>
              Pack dinámico (próximamente)
            </option>
          </select>
        </label>

        <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
          <label style={{ color: "rgba(255,255,255,0.9)", fontSize: 12 }}>
            Nombre del pack
            <input className="admin-input" style={{ marginTop: 4 }} value={draft.nombre} onChange={(e) => actualizar({ nombre: e.target.value })} />
          </label>
          <label style={{ color: "rgba(255,255,255,0.9)", fontSize: 12 }}>
            Subtítulo corto (tarjeta)
            <input className="admin-input" style={{ marginTop: 4 }} value={draft.subtitulo} onChange={(e) => actualizar({ subtitulo: e.target.value })} />
          </label>
          <div style={{ marginBottom: 8 }}>
            <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 12, marginBottom: 6 }}>Imagen del pack</div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", margin: "0 0 8px", lineHeight: 1.45 }}>
              Sube una foto desde el móvil o la cámara (se guarda en la campaña). O bien: copia una imagen en la carpeta{" "}
              <code style={{ color: "#d4af37" }}>public</code> del proyecto y escribe aquí la ruta desde la raíz (ej.{" "}
              <code style={{ color: "#d4af37" }}>/pack amor propio.jpg</code>, no{" "}
              <code style={{ color: "#d4af37" }}>/public/...</code>).
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <label className="btn-admin-limpio admin-btn admin-btn--blue admin-btn--inline admin-btn-small" style={{ cursor: "pointer", margin: 0 }}>
                🖼 Galería
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={onElegirImagenArchivo} />
              </label>
              <label className="btn-admin-limpio admin-btn admin-btn--green admin-btn--inline admin-btn-small" style={{ cursor: "pointer", margin: 0 }}>
                📷 Cámara
                <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={onElegirImagenArchivo} />
              </label>
              <button type="button" className="btn-admin-limpio admin-btn admin-btn--ghost admin-btn--inline admin-btn-small" onClick={() => actualizar({ imagenUrl: "" })}>
                Quitar imagen
              </button>
            </div>
            {draft.imagenUrl?.startsWith("data:") ? (
              <div style={{ marginBottom: 8 }}>
                <img
                  src={draft.imagenUrl}
                  alt="Vista previa"
                  style={{ maxWidth: "100%", maxHeight: 140, borderRadius: 8, objectFit: "contain", border: "1px solid rgba(212,175,55,0.3)" }}
                />
              </div>
            ) : null}
            <label style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, display: "block" }}>
              Ruta manual en <code style={{ color: "#d4af37" }}>public</code> (opcional)
              <input
                className="admin-input"
                style={{ marginTop: 4 }}
                value={draft.imagenUrl?.startsWith("data:") ? "" : draft.imagenUrl}
                onChange={(e) => actualizar({ imagenUrl: e.target.value })}
                placeholder="Ej: /pack amor propio.jpg"
              />
            </label>
            {draft.imagenUrl && !draft.imagenUrl.startsWith("data:") ? (
              <div style={{ marginTop: 8 }}>
                <img
                  src={normalizarSrcImagenProducto(draft.imagenUrl)}
                  alt=""
                  style={{ maxWidth: "100%", maxHeight: 120, borderRadius: 8, objectFit: "contain" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            ) : null}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <label style={{ color: "rgba(255,255,255,0.9)", fontSize: 12 }}>
              1º Precio de antes (PVP / sin oferta)
              <input
                className="admin-input"
                type="number"
                min={0}
                step={0.01}
                style={{ marginTop: 4 }}
                value={draft.precioAnterior ?? ""}
                placeholder="—"
                onChange={(e) => {
                  const v = e.target.value.trim();
                  actualizar({ precioAnterior: v === "" ? null : parseFloat(v) || null });
                }}
              />
            </label>
            <label style={{ color: "rgba(255,255,255,0.9)", fontSize: 12 }}>
              2º Precio con oferta (final)
              <input
                className="admin-input"
                type="number"
                min={0}
                step={0.01}
                style={{ marginTop: 4 }}
                value={draft.precio}
                onChange={(e) => actualizar({ precio: parseFloat(e.target.value) || 0 })}
              />
            </label>
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.45 }}>
            El texto del botón en tarjeta usa <strong style={{ color: "#d4af37" }}>Descubrir el pack</strong> por defecto (editable abajo). El detalle completo va en el modal.
          </p>
        </div>

        <label style={{ display: "block", marginBottom: 8, color: "rgba(255,255,255,0.9)", fontSize: 12 }}>
          Descripción larga (modal)
          <textarea className="admin-input" rows={4} style={{ marginTop: 4, resize: "vertical" }} value={draft.descripcionLarga} onChange={(e) => actualizar({ descripcionLarga: e.target.value })} />
        </label>
        <label style={{ display: "block", marginBottom: 12, color: "rgba(255,255,255,0.9)", fontSize: 12 }}>
          Texto espiritual / ritual (opcional)
          <textarea className="admin-input" rows={3} style={{ marginTop: 4, resize: "vertical" }} value={draft.textoEspiritual} onChange={(e) => actualizar({ textoEspiritual: e.target.value })} />
        </label>

        <div style={{ marginBottom: 12 }}>
          <div style={{ color: "#d4af37", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Productos del pack</div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", margin: "0 0 8px" }}>
            Si no añades ninguno, en tienda se usará la primera vela + el primer incienso (comportamiento clásico).
          </p>
          {draft.lineas.map((line, idx) => {
            const p = catalogoPorId.get(line.productoId);
            return (
              <div key={`${line.productoId}-${idx}`} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ flex: 1, minWidth: 120, fontSize: 12, color: "rgba(255,255,255,0.9)" }}>{p?.nombre ?? `ID ${line.productoId}`}</span>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>
                  Cant.
                  <input
                    className="admin-input"
                    type="number"
                    min={1}
                    style={{ width: 56, marginLeft: 4, padding: "6px 8px" }}
                    value={line.cantidad}
                    onChange={(e) => setCantidadLinea(idx, parseInt(e.target.value, 10) || 1)}
                  />
                </label>
                <button type="button" className="btn-admin-limpio admin-btn admin-btn--ghost admin-btn--inline admin-btn-small" onClick={() => quitarLinea(idx)}>
                  Quitar
                </button>
              </div>
            );
          })}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 8 }}>
            <select
              className="admin-input"
              style={{ flex: 1, minWidth: 180, maxWidth: "100%" }}
              value={productoAnadirId || ""}
              onChange={(e) => setProductoAnadirId(parseInt(e.target.value, 10) || 0)}
            >
              {catalogoPlano.map((p: Producto) => (
                <option key={p.id} value={p.id}>
                  [{p.categoria}] {p.nombre}
                </option>
              ))}
            </select>
            <button type="button" className="btn-admin-limpio admin-btn admin-btn--blue admin-btn--inline admin-btn-small" onClick={anadirLinea} disabled={!catalogoPlano.length}>
              ＋ Añadir producto
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
          <label style={{ color: "rgba(255,255,255,0.9)", fontSize: 12 }}>
            Inicio campaña
            <input
              className="admin-input"
              type="datetime-local"
              style={{ marginTop: 4 }}
              value={draft.inicio.length >= 16 ? draft.inicio.slice(0, 16) : draft.inicio}
              onChange={(e) => {
                const v = e.target.value;
                actualizar({ inicio: v.length === 16 ? `${v}:00` : v });
              }}
            />
          </label>
          <label style={{ color: "rgba(255,255,255,0.9)", fontSize: 12 }}>
            Fin campaña
            <input
              className="admin-input"
              type="datetime-local"
              style={{ marginTop: 4 }}
              value={draft.fin.length >= 16 ? draft.fin.slice(0, 16) : draft.fin}
              onChange={(e) => {
                const v = e.target.value;
                actualizar({ fin: v.length === 16 ? `${v}:00` : v });
              }}
            />
          </label>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, cursor: "pointer", color: "rgba(255,255,255,0.92)", fontSize: 13 }}>
          <input type="checkbox" checked={draft.mostrarContador} onChange={(e) => actualizar({ mostrarContador: e.target.checked })} />
          Mostrar contador en tarjeta
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, cursor: "pointer", color: "rgba(255,255,255,0.92)", fontSize: 13 }}>
          <input type="checkbox" checked={draft.mostrarAhorro} onChange={(e) => actualizar({ mostrarAhorro: e.target.checked })} />
          Mostrar ahorro (precio anterior vs precio)
        </label>

        <div className="admin-accordion-actions" style={{ flexWrap: "wrap" }}>
          <button type="button" className="btn-admin-limpio admin-btn admin-btn--green admin-btn--inline admin-btn-small" onClick={guardar}>
            Guardar campaña
          </button>
          <button type="button" className="btn-admin-limpio admin-btn admin-btn--orange admin-btn--inline admin-btn-small" onClick={restaurarPlantilla}>
            Cargar plantilla
          </button>
          <button type="button" className="btn-admin-limpio admin-btn admin-btn--purple admin-btn--inline admin-btn-small" onClick={quitar}>
            Quitar datos guardados
          </button>
        </div>
      </div>
    </details>
  );
}
