import type { CSSProperties } from "react";
import { THEME } from "../../config";
import { DIRECCIONES_MAX } from "../../app/routing/routeMaps";
import { lineasTextoSeleccionDireccion } from "../../utils/direccion";
import type { DireccionUsuario } from "../../types";

export interface DireccionesSectionProps {
  dirsCuentaNormalizadas: DireccionUsuario[];
  direccionPredeterminadaId: string | undefined;
  direccionDosLineas: { linea1: string; linea2?: string };
  onElegirPrincipal: (idDir: string) => void;
  onIrADireccion: () => void;
  cuentaCtaPrincipalStyle: CSSProperties;
}

/** Bloque «Dirección 📍» de Mi Cuenta: lista seleccionable + botón añadir/cambiar. */
export default function DireccionesSection(p: DireccionesSectionProps) {
  const predId = String(p.direccionPredeterminadaId || "").trim();
  const primeraId = p.dirsCuentaNormalizadas[0]?.id || "";

  return (
    <div style={{ marginTop: 12 }}>
      <label style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", display: "block", marginBottom: 6 }}>
        Dirección 📍
        {p.dirsCuentaNormalizadas.length > 0 ? (
          <span style={{ fontWeight: 500, opacity: 0.7, fontSize: 11, marginLeft: 6 }}>
            ({p.dirsCuentaNormalizadas.length}/{DIRECCIONES_MAX})
          </span>
        ) : null}
      </label>
      {p.dirsCuentaNormalizadas.length > 0 ? (
        <>
          <div style={{ display: "grid", gap: 7 }}>
            {p.dirsCuentaNormalizadas.map((d) => {
              const esPrincipal = (predId && d.id === predId) || (!predId && d.id === primeraId);
              const { linea1, linea2 } = lineasTextoSeleccionDireccion(d);
              return (
                <button
                  key={d.id}
                  type="button"
                  aria-current={esPrincipal ? "true" : undefined}
                  onClick={() => {
                    if (esPrincipal) return;
                    p.onElegirPrincipal(d.id);
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: esPrincipal ? `2px solid ${THEME.goldMain}` : "1px solid rgba(212,175,55,0.22)",
                    background: esPrincipal ? "rgba(201,162,74,0.1)" : "rgba(255,255,255,0.04)",
                    cursor: esPrincipal ? "default" : "pointer",
                    boxSizing: "border-box"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 8
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: "rgba(255,255,255,0.94)",
                          lineHeight: 1.35
                        }}
                      >
                        {linea1 || "—"}
                      </div>
                      {linea2 ? (
                        <div
                          style={{
                            marginTop: 4,
                            fontSize: 11,
                            fontWeight: 500,
                            color: "rgba(190,185,230,0.85)",
                            lineHeight: 1.35
                          }}
                        >
                          {linea2}
                        </div>
                      ) : null}
                      {!esPrincipal ? (
                        <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.45)" }}>
                          Toca para usarla como principal
                        </div>
                      ) : null}
                    </div>
                    {esPrincipal ? (
                      <span
                        style={{
                          flexShrink: 0,
                          fontSize: 9,
                          fontWeight: 800,
                          letterSpacing: "0.06em",
                          color: THEME.goldMain,
                          border: `1px solid ${THEME.goldMain}`,
                          borderRadius: 8,
                          padding: "3px 8px"
                        }}
                      >
                        PRINCIPAL
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
          {p.dirsCuentaNormalizadas.length > 1 ? (
            <p style={{ margin: "8px 0 0", fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>
              Elige otra fila para cambiar la dirección principal.
            </p>
          ) : null}
          <button
            type="button"
            className="checkout-boton-finalizar"
            onClick={p.onIrADireccion}
            disabled={p.dirsCuentaNormalizadas.length >= DIRECCIONES_MAX}
            style={{
              ...p.cuentaCtaPrincipalStyle,
              marginTop: 10,
              opacity: p.dirsCuentaNormalizadas.length >= DIRECCIONES_MAX ? 0.55 : 1,
              cursor: p.dirsCuentaNormalizadas.length >= DIRECCIONES_MAX ? "not-allowed" : "pointer"
            }}
          >
            + Añadir otra dirección
          </button>
        </>
      ) : (
        <>
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 9,
              border: "1px solid rgba(212, 175, 55, 0.25)",
              background: "rgba(255, 255, 255, 0.04)",
              color: "rgba(255,255,255,0.88)",
              minHeight: 44,
              whiteSpace: "pre-wrap",
              lineHeight: 1.45,
              cursor: "not-allowed",
              boxSizing: "border-box"
            }}
            title="Dirección bloqueada. Pulsa «Cambiar dirección» para editar o añadir."
          >
            {p.direccionDosLineas.linea1 ? (
              <>
                <div>{p.direccionDosLineas.linea1}</div>
                {p.direccionDosLineas.linea2 && (
                  <div style={{ marginTop: 2, opacity: 0.9 }}>{p.direccionDosLineas.linea2}</div>
                )}
              </>
            ) : (
              "Sin dirección guardada"
            )}
          </div>
          <button
            type="button"
            className="checkout-boton-finalizar"
            onClick={p.onIrADireccion}
            style={{ ...p.cuentaCtaPrincipalStyle, marginTop: 10 }}
          >
            Cambiar dirección
          </button>
        </>
      )}
    </div>
  );
}
