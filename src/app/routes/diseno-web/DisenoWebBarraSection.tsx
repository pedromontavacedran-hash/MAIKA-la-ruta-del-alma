import { type RefObject } from "react";
import { THEME } from "../../../config";
import {
  ALTURA_BARRA_TOP_MAX,
  ALTURA_BARRA_TOP_MIN,
  ICONOS_BARRA_ESCALA_MAX,
  ICONOS_BARRA_ESCALA_MIN,
  LOGO_POS_X_REL_MAX,
  LOGO_POS_X_REL_MIN,
  type BarraTopPedidoExitoCfg,
  logoTamanoDesdeAlturaBarra
} from "../../../utils/barraTopPedidoExito/barraTopPedidoExitoCfg";
import type { useAdminDisenoWebEditor } from "../useAdminDisenoWebEditor";

type Editor = ReturnType<typeof useAdminDisenoWebEditor>;

export interface DisenoWebBarraSectionProps {
  editor: Editor;
  checkoutAccordionRefs: RefObject<Record<string, HTMLDivElement | null>>;
}

/** Sección «barra superior» del panel de diseño web: logo, colores, escala, iconos. */
export default function DisenoWebBarraSection({ editor, checkoutAccordionRefs }: DisenoWebBarraSectionProps) {
  const {
    barraTopPedidoExitoCfg,
    colorFondoBarraTemporal,
    setColorFondoBarraTemporal,
    colorIconosBarraTemporal,
    setColorIconosBarraTemporal,
    alturaBarraTemporal,
    setAlturaBarraTemporal,
    iconosEscalaTemporal,
    setIconosEscalaTemporal,
    logoUrlDataPendienteBarra,
    setLogoUrlDataPendienteBarra,
    logoBarraNombreArchivoPendiente,
    setLogoBarraNombreArchivoPendiente,
    inputLogoBarraRef,
    subirLogoBarraPendiente,
    actualizarBarraTopPedidoExitoCfg,
    actualizarBarraTopPedidoExitoCfgParcial,
    logoPosXAlmacenado,
    aplicarLogoPosXDesdeUiPorCien,
    logoPosXSliderUi,
    estiloFlechaBarraLogo
  } = editor;

  return (
    <div
      ref={(el) => {
        checkoutAccordionRefs.current.barra = el;
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
      <div style={{ padding: "16px 18px 22px", display: "grid", gap: 10 }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            color: "rgba(255,255,255,0.9)",
            fontSize: 12,
            userSelect: "none"
          }}
        >
          <input
            type="checkbox"
            checked={barraTopPedidoExitoCfg.mostrarLogoBarra}
            onChange={(e) => actualizarBarraTopPedidoExitoCfg("mostrarLogoBarra", e.target.checked)}
          />
          Mostrar logo
        </label>
        <div style={{ display: "grid", gap: 8 }}>
          <div
            style={{
              color: THEME.goldMain,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.02em"
            }}
          >
            Logo de la barra
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap", minWidth: 0 }}>
            <span style={{ flex: "0 0 auto", color: "rgba(255,255,255,0.88)", fontSize: 11, fontWeight: 700 }}>
              Imagen
            </span>
            <input
              ref={inputLogoBarraRef}
              type="file"
              accept="image/*"
              onChange={subirLogoBarraPendiente}
              style={{ display: "none" }}
            />
            <button
              type="button"
              aria-label="Elegir imagen para el logo de la barra"
              onClick={() => inputLogoBarraRef.current?.click()}
              style={{
                flex: "0 0 auto",
                padding: "5px 12px",
                borderRadius: 6,
                border: `1px solid rgba(201,162,74,0.55)`,
                background: "rgba(201,162,74,0.1)",
                color: THEME.goldMain,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "none",
                letterSpacing: "0.01em",
                lineHeight: 1.25
              }}
            >
              Elegir imagen
            </button>
            <span
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 11,
                color: "rgba(255,255,255,0.55)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
              title={
                logoBarraNombreArchivoPendiente ||
                (barraTopPedidoExitoCfg.logoUrl || "").trim() ||
                undefined
              }
            >
              {logoBarraNombreArchivoPendiente ? (
                <span style={{ color: "rgba(201,162,74,0.95)" }}>{logoBarraNombreArchivoPendiente}</span>
              ) : (barraTopPedidoExitoCfg.logoUrl || "").trim() ? (
                <>{(barraTopPedidoExitoCfg.logoUrl || "").split("/").pop()}</>
              ) : (
                <>—</>
              )}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap", minWidth: 0 }}>
            <button
              type="button"
              aria-label="Desplazar logo a la izquierda"
              disabled={logoPosXAlmacenado <= LOGO_POS_X_REL_MIN}
              onClick={() => {
                const nextUi = Math.max(0, Math.min(100, logoPosXSliderUi - 2));
                aplicarLogoPosXDesdeUiPorCien(nextUi);
              }}
              style={estiloFlechaBarraLogo}
            >
              ◀
            </button>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={logoPosXSliderUi}
              onChange={(e) => aplicarLogoPosXDesdeUiPorCien(Number(e.target.value))}
              aria-label="Posición horizontal del logo"
              style={{ flex: 1, minWidth: 0, height: 20, margin: 0, padding: 0, accentColor: THEME.goldMain }}
            />
            <button
              type="button"
              aria-label="Desplazar logo a la derecha"
              disabled={logoPosXAlmacenado >= LOGO_POS_X_REL_MAX}
              onClick={() => {
                const nextUi = Math.max(0, Math.min(100, logoPosXSliderUi + 2));
                aplicarLogoPosXDesdeUiPorCien(nextUi);
              }}
              style={estiloFlechaBarraLogo}
            >
              ▶
            </button>
          </div>
        </div>
        <label style={{ display: "grid", gap: 4, color: "rgba(255,255,255,0.88)", fontSize: 11, fontWeight: 700 }}>
          Color fondo barra
          <input
            type="color"
            value={colorFondoBarraTemporal}
            onChange={(e) => setColorFondoBarraTemporal(e.target.value)}
            style={{ width: 44, height: 28, border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
          />
        </label>
        <label style={{ display: "grid", gap: 4, color: "rgba(255,255,255,0.88)", fontSize: 11, fontWeight: 700 }}>
          Color iconos
          <input
            type="color"
            value={colorIconosBarraTemporal}
            onChange={(e) => setColorIconosBarraTemporal(e.target.value)}
            style={{ width: 44, height: 28, border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
          />
        </label>
        <label style={{ display: "grid", gap: 6, color: "rgba(255,255,255,0.88)", fontSize: 11, fontWeight: 700 }}>
          Tamaño iconos ({ICONOS_BARRA_ESCALA_MIN}–{ICONOS_BARRA_ESCALA_MAX}%): hamburguesa, llave, usuario, carrito y corazón
          <input
            type="range"
            min={ICONOS_BARRA_ESCALA_MIN}
            max={ICONOS_BARRA_ESCALA_MAX}
            step={1}
            value={iconosEscalaTemporal}
            onChange={(e) =>
              setIconosEscalaTemporal(
                Math.max(
                  ICONOS_BARRA_ESCALA_MIN,
                  Math.min(ICONOS_BARRA_ESCALA_MAX, Math.round(Number(e.target.value)))
                )
              )
            }
            aria-label="Tamaño de los iconos de la barra superior"
            style={{ width: "100%", height: 20, margin: 0, padding: 0, accentColor: THEME.goldMain }}
          />
          <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 9, lineHeight: 1.3 }}>
            Actual: {iconosEscalaTemporal}% (100% = proporcional a la altura de la barra)
          </span>
        </label>
        <label style={{ display: "grid", gap: 6, color: "rgba(255,255,255,0.88)", fontSize: 11, fontWeight: 700 }}>
          Escala de la barra ({ALTURA_BARRA_TOP_MIN}–{ALTURA_BARRA_TOP_MAX}px): altura y logo proporcionales
          <input
            type="range"
            min={ALTURA_BARRA_TOP_MIN}
            max={ALTURA_BARRA_TOP_MAX}
            step={1}
            value={alturaBarraTemporal}
            onChange={(e) =>
              setAlturaBarraTemporal(
                Math.max(
                  ALTURA_BARRA_TOP_MIN,
                  Math.min(ALTURA_BARRA_TOP_MAX, Math.round(Number(e.target.value)))
                )
              )
            }
            aria-label="Escala de la barra superior: altura, logo e iconos"
            style={{ width: "100%", height: 20, margin: 0, padding: 0, accentColor: THEME.goldMain }}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            const alturaBarraSuperior = Math.max(
              ALTURA_BARRA_TOP_MIN,
              Math.min(ALTURA_BARRA_TOP_MAX, Math.round(alturaBarraTemporal))
            );
            const patch: Partial<BarraTopPedidoExitoCfg> = {
              fondoBarraSuperior: colorFondoBarraTemporal,
              colorIconosBarraSuperior: colorIconosBarraTemporal,
              logoTamano: logoTamanoDesdeAlturaBarra(alturaBarraSuperior),
              alturaBarraSuperior,
              iconosEscalaPct: Math.max(
                ICONOS_BARRA_ESCALA_MIN,
                Math.min(ICONOS_BARRA_ESCALA_MAX, Math.round(iconosEscalaTemporal))
              )
            };
            if (logoUrlDataPendienteBarra) {
              patch.logoUrl = logoUrlDataPendienteBarra;
            }
            actualizarBarraTopPedidoExitoCfgParcial(patch);
            setLogoUrlDataPendienteBarra(null);
            setLogoBarraNombreArchivoPendiente("");
            if (inputLogoBarraRef.current) inputLogoBarraRef.current.value = "";
          }}
          style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${THEME.goldMain}`, background: "rgba(201,162,74,0.18)", color: THEME.goldMain, cursor: "pointer", fontSize: 11, fontWeight: 700 }}
        >
          Aplicar cambios
        </button>
      </div>
    </div>
  );
}
