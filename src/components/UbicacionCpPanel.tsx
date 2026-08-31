import type { CSSProperties, KeyboardEvent, RefObject } from "react";
import {
  hayDatosUbicacionPorCp,
  textoLineaUbicacionCp,
  textoLineaUbicacionCpCompleta
} from "../utils/direccionUtils";

function pxDesdeFontSize(fs: CSSProperties["fontSize"]): number | null {
  if (typeof fs === "number" && Number.isFinite(fs)) return fs;
  if (typeof fs === "string") {
    const m = fs.trim().match(/^(\d+(?:\.\d+)?)px$/i);
    if (m) return parseFloat(m[1]);
  }
  return null;
}

export interface UbicacionCpPanelProps {
  cp: string;
  onCpChange: (cp: string) => void;
  poblacion: string;
  provincia: string;
  pais: string;
  inputStyle: CSSProperties;
  /** Desactiva solo el campo CP (p. ej. checkout en modo solo lectura). */
  cpDisabled?: boolean;
  namePrefix?: string;
  onCpKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  /**
   * `panel`: CP + resumen a la derecha (legacy).
   * `stack`: CP y línea 📍 debajo (registro / editar usuario).
   * `cpSolo`: solo el input CP (el resumen va en otro sitio, p. ej. checkout debajo del botón).
   */
  layoutUbicacion?: "panel" | "stack" | "cpSolo";
  /** Ref al input de CP (p. ej. foco con Enter desde otro campo). */
  cpInputRef?: RefObject<HTMLInputElement | null>;
}

/**
 * CP + línea de ubicación detectada por CP (misma presentación en checkout y registro).
 */
export default function UbicacionCpPanel({
  cp,
  onCpChange,
  poblacion,
  provincia,
  pais,
  inputStyle,
  cpDisabled = false,
  namePrefix = "maika-cp",
  onCpKeyDown,
  layoutUbicacion = "panel",
  cpInputRef
}: UbicacionCpPanelProps) {
  const lineaPanel = textoLineaUbicacionCp(poblacion, provincia, pais);
  const vacioPanel = !lineaPanel;
  const lineaStack = textoLineaUbicacionCpCompleta(poblacion, provincia, pais);
  const mostrarLineaStack =
    hayDatosUbicacionPorCp(cp, poblacion, provincia) && !!lineaStack;

  const basePx = pxDesdeFontSize(inputStyle.fontSize) ?? 14;
  const lineaPx = Math.max(11, basePx - 2);
  /** Línea de ubicación en layout apilado (cuenta): legible y visible. */
  const lineaStackPx = Math.max(12, basePx);

  const inputCp = (
    <input
      ref={(el) => {
        if (cpInputRef) cpInputRef.current = el;
      }}
      type="text"
      name={`${namePrefix}-cp`}
      placeholder="C.P *"
      autoComplete="off"
      data-lpignore="true"
      data-1p-ignore="true"
      value={cp || ""}
      disabled={cpDisabled}
      onChange={(e) => onCpChange(e.target.value.replace(/\D/g, "").slice(0, 5))}
      onKeyDown={onCpKeyDown}
      inputMode="numeric"
      maxLength={5}
      style={{ ...inputStyle, minWidth: 0, marginBottom: 0, padding: "8px 10px", lineHeight: 1.2 }}
    />
  );

  if (layoutUbicacion === "cpSolo") {
    return (
      <div className="checkout-ubicacion-cp-solo" style={{ marginTop: 8, marginBottom: 8 }}>
        <div style={{ maxWidth: 140 }}>{inputCp}</div>
      </div>
    );
  }

  if (layoutUbicacion === "stack") {
    return (
      <div style={{ marginTop: 14, marginBottom: 0 }}>
        <div style={{ maxWidth: 140 }}>{inputCp}</div>
        {mostrarLineaStack && (
          <div
            style={{
              marginTop: 10,
              marginBottom: 4,
              fontSize: lineaStackPx,
              lineHeight: 1.45,
              wordBreak: "break-word",
              fontWeight: 400,
              letterSpacing: 0.01,
              color: "rgba(255,255,255,0.72)"
            }}
          >
            <span translate="no" className="notranslate" lang="es">
              {lineaStack.startsWith("📍 ") ? (
                <>
                  <span
                    aria-hidden
                    style={{
                      fontSize: Math.max(9, lineaStackPx * 0.78),
                      marginRight: 5,
                      verticalAlign: "0.05em",
                      opacity: 0.92
                    }}
                  >
                    📍
                  </span>
                  {lineaStack.slice(3)}
                </>
              ) : (
                lineaStack
              )}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="checkout-ubicacion-cp-grid">
      {inputCp}
      <div
        style={{
          border: `1px solid rgba(201, 162, 74, 0.28)`,
          borderRadius: 10,
          padding: "8px 10px",
          background: "rgba(255,255,255,0.03)",
          color: "rgba(255,255,255,0.58)",
          minHeight: 38,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center"
        }}
      >
        <div
          style={{
            fontSize: lineaPx,
            lineHeight: 1.4,
            wordBreak: "break-word",
            fontWeight: 400,
            letterSpacing: 0.01
          }}
        >
          {vacioPanel ? (
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: Math.max(10, lineaPx - 1) }}>
              —
            </span>
          ) : (
            <span translate="no" className="notranslate" lang="es" style={{ color: "rgba(255,255,255,0.62)" }}>
              {lineaPanel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
