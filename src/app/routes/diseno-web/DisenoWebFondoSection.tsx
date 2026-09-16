import { type RefObject } from "react";
import FondoEstrellasDensidadPreview from "../../../components/admin/FondoEstrellasDensidadPreview";
import { THEME } from "../../../config";
import {
  FONDO_ESTRELLAS_DENSIDAD_MAX,
  FONDO_ESTRELLAS_DENSIDAD_MIN,
  FONDO_ESTRELLAS_MOVIMIENTO_MAX,
  FONDO_ESTRELLAS_MOVIMIENTO_MIN,
  guardarFondoEstrellasColor,
  guardarFondoEstrellasDensidad,
  guardarFondoEstrellasMovimiento,
  guardarFondoAppCapaPreset,
  guardarFondoPantallaOscuridad,
  guardarFondoPantallaTono
} from "../../../utils/fondoPantallaConfig";
import type { useAdminDisenoWebEditor } from "../useAdminDisenoWebEditor";

type Editor = ReturnType<typeof useAdminDisenoWebEditor>;

export interface DisenoWebFondoSectionProps {
  editor: Editor;
  checkoutAccordionRefs: RefObject<Record<string, HTMLDivElement | null>>;
}

/** Sección «fondo pantalla» del panel de diseño web: capa base, estrellas, oscuridad, paleta. */
export default function DisenoWebFondoSection({ editor, checkoutAccordionRefs }: DisenoWebFondoSectionProps) {
  const {
    fondoPantallaNombreArchivo,
    fondoPantallaPreviewUrl,
    fondoPantallaOscuridad,
    setFondoPantallaOscuridad,
    fondoPantallaTono,
    setFondoPantallaTono,
    fondoEstrellasDensidad,
    setFondoEstrellasDensidad,
    fondoEstrellasColor,
    setFondoEstrellasColor,
    fondoEstrellasMovimiento,
    setFondoEstrellasMovimiento,
    fondoAppCapaPreset,
    setFondoAppCapaPreset,
    inputFondoPantallaRef,
    subirFondoPantalla,
    setFondoEstrellasPreviewAbierta,
    setFondoEstrellasPreviewIframeKey
  } = editor;

  return (
    <div
      ref={(el) => {
        checkoutAccordionRefs.current.fondo = el;
      }}
      style={{
        borderRadius: 16,
        overflow: "hidden",
        width: "100%",
        border: "2px solid rgba(250, 232, 170, 0.55)",
        background: "rgba(16, 12, 30, 0.97)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)"
      }}
    >
      <div style={{ padding: "16px 18px 22px", display: "grid", gap: 8 }}>
        <input ref={inputFondoPantallaRef} type="file" accept="image/*" onChange={subirFondoPantalla} style={{ display: "none" }} />
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => inputFondoPantallaRef.current?.click()}
            style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${THEME.goldMain}`, background: "linear-gradient(180deg, rgba(201,162,74,0.28), rgba(201,162,74,0.12))", color: THEME.goldMain, cursor: "pointer", fontSize: 11, fontWeight: 600 }}
          >
            Configurar fondo pantalla
          </button>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <span style={{ color: "rgba(255,255,255,0.78)", fontSize: 11, fontWeight: 700 }}>
            Capa base de toda la web
          </span>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, lineHeight: 1.35 }}>
            Mismo degradado en todas las pantallas (debajo de estrellas y contenido). Se guarda en este navegador.
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                guardarFondoAppCapaPreset("");
                setFondoAppCapaPreset("");
              }}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: `1px solid ${fondoAppCapaPreset === "" ? THEME.goldMain : "rgba(255,255,255,0.28)"}`,
                background: fondoAppCapaPreset === "" ? "rgba(201,162,74,0.22)" : "rgba(255,255,255,0.06)",
                color: THEME.goldMain,
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 700
              }}
            >
              Cielo clásico
            </button>
            <button
              type="button"
              onClick={() => {
                guardarFondoAppCapaPreset("maika-lila");
                setFondoAppCapaPreset("maika-lila");
              }}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: `1px solid ${fondoAppCapaPreset === "maika-lila" ? THEME.goldMain : "rgba(255,255,255,0.28)"}`,
                background: fondoAppCapaPreset === "maika-lila" ? "rgba(201,162,74,0.22)" : "rgba(255,255,255,0.06)",
                color: THEME.goldMain,
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 700
              }}
            >
              Degradado lila Maika
            </button>
          </div>
        </div>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 9, letterSpacing: "0.02em" }}>
            Vista previa cielo (densidad actual) — pulsa para pantalla completa
          </span>
          <button
            type="button"
            className="admin-btn-sutil-levita"
            title="Ver el mismo cielo que en la web, a pantalla completa (tono, oscuridad, imagen y estrellas guardados en este navegador)"
            aria-label="Abrir vista previa del cielo a pantalla completa"
            onClick={() => {
              setFondoEstrellasPreviewIframeKey((k) => k + 1);
              setFondoEstrellasPreviewAbierta(true);
            }}
            style={{
              display: "block",
              width: "100%",
              margin: 0,
              padding: 0,
              border: "none",
              borderRadius: 8,
              background: "transparent",
              cursor: "zoom-in",
              WebkitTapHighlightColor: "transparent"
            }}
          >
            <FondoEstrellasDensidadPreview densidad={fondoEstrellasDensidad} color={fondoEstrellasColor} />
          </button>
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 8, lineHeight: 1.3 }}>
            Misma lógica que inicio/tienda: zona vacía y el fondo que ya tienes configurado (localStorage).
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 11, lineHeight: 1.35 }}>
            Estrellas 0%-100%: <strong style={{ color: THEME.goldMain }}>{fondoEstrellasDensidad}%</strong>
          </span>
          <button
            type="button"
            onClick={() => {
              const next = Math.max(FONDO_ESTRELLAS_DENSIDAD_MIN, fondoEstrellasDensidad - 10);
              setFondoEstrellasDensidad(next);
              guardarFondoEstrellasDensidad(next);
            }}
            disabled={fondoEstrellasDensidad <= FONDO_ESTRELLAS_DENSIDAD_MIN}
            style={{
              padding: "4px 8px",
              borderRadius: 5,
              border: `1px solid ${THEME.goldMain}`,
              background: "rgba(201,162,74,0.12)",
              color: THEME.goldMain,
              cursor: fondoEstrellasDensidad <= FONDO_ESTRELLAS_DENSIDAD_MIN ? "not-allowed" : "pointer",
              fontSize: 10,
              fontWeight: 700,
              opacity: fondoEstrellasDensidad <= FONDO_ESTRELLAS_DENSIDAD_MIN ? 0.45 : 1
            }}
          >
            - Est
          </button>
          <button
            type="button"
            onClick={() => {
              const next = Math.min(FONDO_ESTRELLAS_DENSIDAD_MAX, fondoEstrellasDensidad + 10);
              setFondoEstrellasDensidad(next);
              guardarFondoEstrellasDensidad(next);
            }}
            disabled={fondoEstrellasDensidad >= FONDO_ESTRELLAS_DENSIDAD_MAX}
            style={{
              padding: "4px 8px",
              borderRadius: 5,
              border: `1px solid ${THEME.goldMain}`,
              background: "linear-gradient(180deg, rgba(201,162,74,0.22), rgba(201,162,74,0.08))",
              color: THEME.goldMain,
              cursor: fondoEstrellasDensidad >= FONDO_ESTRELLAS_DENSIDAD_MAX ? "not-allowed" : "pointer",
              fontSize: 10,
              fontWeight: 700,
              opacity: fondoEstrellasDensidad >= FONDO_ESTRELLAS_DENSIDAD_MAX ? 0.45 : 1
            }}
          >
            + Est
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 11, lineHeight: 1.35 }}>
            Movimiento: <strong style={{ color: THEME.goldMain }}>{fondoEstrellasMovimiento}%</strong>
          </span>
          <button
            type="button"
            onClick={() => {
              const next = Math.max(FONDO_ESTRELLAS_MOVIMIENTO_MIN, fondoEstrellasMovimiento - 20);
              setFondoEstrellasMovimiento(next);
              guardarFondoEstrellasMovimiento(next);
            }}
            disabled={fondoEstrellasMovimiento <= FONDO_ESTRELLAS_MOVIMIENTO_MIN}
            style={{
              padding: "4px 8px",
              borderRadius: 5,
              border: `1px solid ${THEME.goldMain}`,
              background: "rgba(201,162,74,0.12)",
              color: THEME.goldMain,
              cursor: fondoEstrellasMovimiento <= FONDO_ESTRELLAS_MOVIMIENTO_MIN ? "not-allowed" : "pointer",
              fontSize: 10,
              fontWeight: 700,
              opacity: fondoEstrellasMovimiento <= FONDO_ESTRELLAS_MOVIMIENTO_MIN ? 0.45 : 1
            }}
          >
            - Vel
          </button>
          <button
            type="button"
            onClick={() => {
              const next = Math.min(FONDO_ESTRELLAS_MOVIMIENTO_MAX, fondoEstrellasMovimiento + 20);
              setFondoEstrellasMovimiento(next);
              guardarFondoEstrellasMovimiento(next);
            }}
            disabled={fondoEstrellasMovimiento >= FONDO_ESTRELLAS_MOVIMIENTO_MAX}
            style={{
              padding: "4px 8px",
              borderRadius: 5,
              border: `1px solid ${THEME.goldMain}`,
              background: "linear-gradient(180deg, rgba(201,162,74,0.22), rgba(201,162,74,0.08))",
              color: THEME.goldMain,
              cursor: fondoEstrellasMovimiento >= FONDO_ESTRELLAS_MOVIMIENTO_MAX ? "not-allowed" : "pointer",
              fontSize: 10,
              fontWeight: 700,
              opacity: fondoEstrellasMovimiento >= FONDO_ESTRELLAS_MOVIMIENTO_MAX ? 0.45 : 1
            }}
          >
            + Vel
          </button>
          <button
            type="button"
            onClick={() => {
              setFondoEstrellasMovimiento(260);
              guardarFondoEstrellasMovimiento(260);
            }}
            style={{
              padding: "4px 8px",
              borderRadius: 5,
              border: `1px solid ${THEME.goldMain}`,
              background: "rgba(201,162,74,0.18)",
              color: THEME.goldMain,
              cursor: "pointer",
              fontSize: 10,
              fontWeight: 700
            }}
          >
            Rapida
          </button>
        </div>
        <div style={{ display: "grid", gap: 5 }}>
          <div style={{ color: "rgba(255,255,255,0.82)", fontSize: 11 }}>Color estrellas</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4 }}>
            {[
              "#c9a24a", "#d4af37", "#e8dcc8", "#ffffff",
              "#9ecfff", "#7eb6ff", "#c4a8e8", "#b8a8ff",
              "#e8a0c0", "#ffccaa", "#7fd8be", "#a8e6cf",
              "#66ddaa", "#ffd36a", "#8b7355", "#f0f0f0"
            ].map((c) => (
              <button
                key={`estrella-color-${c}`}
                type="button"
                onClick={() => {
                  setFondoEstrellasColor(c);
                  guardarFondoEstrellasColor(c);
                }}
                title={c}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  border:
                    fondoEstrellasColor.toLowerCase() === c.toLowerCase()
                      ? `2px solid ${THEME.goldMain}`
                      : "1px solid rgba(255,255,255,0.28)",
                  background: c,
                  cursor: "pointer",
                  padding: 0
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 10 }}>{fondoEstrellasColor.toUpperCase()}</span>
            <input
              type="color"
              value={fondoEstrellasColor}
              onChange={(e) => {
                const next = e.target.value;
                setFondoEstrellasColor(next);
                guardarFondoEstrellasColor(next);
              }}
              style={{ width: 36, height: 24, border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
            />
          </div>
        </div>
        {fondoPantallaNombreArchivo ? (
          <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 10, lineHeight: 1.2 }}>{fondoPantallaNombreArchivo}</div>
        ) : null}
        <div style={{ border: "1px dashed rgba(201,162,74,0.45)", borderRadius: 8, overflow: "hidden", height: 72, background: fondoPantallaPreviewUrl ? "#0b0b0d" : "rgba(255,255,255,0.03)" }}>
          {fondoPantallaPreviewUrl ? (
            <img src={fondoPantallaPreviewUrl} alt="Vista previa fondo pantalla" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : null}
        </div>
        <label style={{ color: "rgba(255,255,255,0.82)", fontSize: 11, display: "grid", gap: 4 }}>
          Oscuridad fondo: {fondoPantallaOscuridad}%
          <input
            type="range"
            min={0}
            max={85}
            step={1}
            value={fondoPantallaOscuridad}
            onChange={(e) => {
              const next = Number(e.target.value);
              setFondoPantallaOscuridad(next);
              guardarFondoPantallaOscuridad(next);
            }}
          />
        </label>
        <div style={{ display: "grid", gap: 5 }}>
          <div style={{ color: "rgba(255,255,255,0.82)", fontSize: 11 }}>Paleta color fondo</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4 }}>
            {[
              "#0b0b0d", "#1b1745", "#2d1f5e", "#43286e", "#5d3382", "#0f3d3e", "#145a5d", "#2a8f96",
              "#3b1f1f", "#5a2a2a", "#7a3b3b", "#9a4d4d", "#4f401c", "#6b5424", "#8b6b2e", "#c9a24a"
            ].map((color) => (
              <button
                key={`fondo-pantalla-tono-${color}`}
                type="button"
                onClick={() => {
                  setFondoPantallaTono(color);
                  guardarFondoPantallaTono(color);
                }}
                title={color}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  border: fondoPantallaTono.toLowerCase() === color.toLowerCase() ? `2px solid ${THEME.goldMain}` : "1px solid rgba(255,255,255,0.28)",
                  background: color,
                  cursor: "pointer",
                  padding: 0
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 10 }}>{fondoPantallaTono.toUpperCase()}</span>
            <input
              type="color"
              value={fondoPantallaTono}
              onChange={(e) => {
                const next = e.target.value;
                setFondoPantallaTono(next);
                guardarFondoPantallaTono(next);
              }}
              style={{ width: 36, height: 24, border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
