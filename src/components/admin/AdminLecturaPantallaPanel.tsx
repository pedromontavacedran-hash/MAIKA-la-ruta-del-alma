import { useCallback, useEffect, useState, type CSSProperties, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { THEME } from "@/config";
import {
  aplicarLecturaPantallaCssDesdeConfig,
  guardarLecturaPantallaBaselineRestauracion,
  guardarLecturaPantallaConfig,
  hayLecturaPantallaBaselineRestauracion,
  leerLecturaPantallaConfig,
  MAIKA_LECTURA_PANTALLA_UPDATED_EVENT,
  restaurarLecturaPantallaPorDefecto,
  type LecturaPantallaSnapshot
} from "@/utils/lecturaPantallaConfig";

const campoStyle: CSSProperties = {
  display: "grid",
  gap: 8,
  textAlign: "left"
};

const labelTxtStyle: CSSProperties = {
  color: "rgba(255,255,255,0.88)",
  fontSize: 12,
  fontWeight: 600,
  lineHeight: 1.35,
  margin: 0
};

const valorStyle: CSSProperties = {
  margin: 0,
  color: THEME.goldMain,
  fontSize: 14,
  fontWeight: 700,
  lineHeight: 1.3,
  fontVariantNumeric: "tabular-nums"
};

function CampoRango({
  titulo,
  valorTexto,
  min,
  max,
  step,
  value,
  onChange
}: {
  titulo: string;
  valorTexto: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div style={campoStyle}>
      <p style={labelTxtStyle}>{titulo}</p>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", boxSizing: "border-box", margin: 0 }}
      />
      <p style={valorStyle}>{valorTexto}</p>
    </div>
  );
}

function LecturaPantallaModalBody({
  cfg,
  onClose,
  setShell,
  setMalla,
  setTirarHaciaBarra,
  onRestaurar,
  onGuardar,
  onDefinirRestauracion,
  restauracionCustom
}: {
  cfg: LecturaPantallaSnapshot;
  onClose: () => void;
  setShell: (n: number) => void;
  setMalla: (n: number) => void;
  setTirarHaciaBarra: (n: number) => void;
  onRestaurar: () => void;
  onGuardar: () => void;
  onDefinirRestauracion: () => void;
  restauracionCustom: boolean;
}) {
  const stop = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        flex: "1 1 auto",
        gap: 0
      }}
    >
      <div
        style={{
          display: "grid",
          gap: 20,
          flex: "1 1 auto",
          minHeight: 0,
          overflowY: "auto",
          padding: "2px 0 0",
          textAlign: "left"
        }}
      >
        <p style={{ margin: 0, color: "rgba(255,255,255,0.78)", fontSize: 13, lineHeight: 1.55, textAlign: "left" }}>
          Ajustes solo de <strong style={{ color: THEME.goldMain }}>/lectura</strong>.{" "}
          <strong>La carta no cambia.</strong> El primer control quita aire arriba dentro de la lectura (sube carta y
          texto). Los anchos afectan al envoltorio de la ruta y solo a la <strong>columna de texto</strong>. Los
          controles ya guardan al moverlos; para verlo en otra pestaña o pantalla abre <strong>/lectura</strong> ahí
          (mismo navegador), sin ventana emergente. El resto del admin sigue igual.
        </p>

        <CampoRango
          titulo="Acercar contenido arriba (px, solo /lectura)"
          valorTexto={
            cfg.tirarHaciaBarraPx <= 0
              ? "Sin cambio (padding interno por defecto)"
              : `Resta ${cfg.tirarHaciaBarraPx}px al padding superior dentro de la lectura`
          }
          min={0}
          max={120}
          step={2}
          value={cfg.tirarHaciaBarraPx}
          onChange={setTirarHaciaBarra}
        />

        <CampoRango
          titulo="Ancho máx. solo texto (px; la carta igual)"
          valorTexto={`${cfg.mallaAnchoMaxPx}px de ancho útil para títulos y párrafos`}
          min={400}
          max={1200}
          step={10}
          value={cfg.mallaAnchoMaxPx}
          onChange={setMalla}
        />

        <CampoRango
          titulo="Ancho máx. envoltorio página (0 = como otras rutas, ~800px)"
          valorTexto={
            cfg.shellAnchoMaxPx <= 0
              ? "min(800px, 100%) — mismo tope que el resto"
              : `min(${cfg.shellAnchoMaxPx}px, 100%)`
          }
          min={0}
          max={1600}
          step={20}
          value={cfg.shellAnchoMaxPx}
          onChange={setShell}
        />
      </div>

      <div
        style={{
          display: "grid",
          gap: 10,
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px solid rgba(212, 175, 95, 0.22)",
          flexShrink: 0
        }}
      >
        <button
          type="button"
          className="btn-admin-limpio admin-btn admin-btn--blue"
          onClick={(e) => {
            stop(e);
            onGuardar();
          }}
        >
          Guardar
        </button>
        <button
          type="button"
          className="btn-admin-limpio admin-btn admin-btn--ghost"
          onClick={(e) => {
            stop(e);
            onDefinirRestauracion();
          }}
        >
          Definir restauración con los valores actuales
        </button>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            lineHeight: 1.45,
            color: "rgba(255,255,255,0.62)",
            textAlign: "left"
          }}
        >
          {restauracionCustom
            ? "«Valores por defecto» solo en este panel volverá a los tres números que guardaste arriba (no cambia otros ajustes del admin)."
            : "Sin pulsar lo anterior, «Valores por defecto» usa la fábrica del código: texto 720px, envoltorio como el resto (~800px), sin tirar."}
        </p>
        <button
          type="button"
          className="btn-admin-limpio admin-btn admin-btn--ghost"
          onClick={(e) => {
            stop(e);
            onRestaurar();
          }}
        >
          Valores por defecto
        </button>
        <button
          type="button"
          className="btn-admin-limpio admin-btn admin-btn--purple"
          onClick={(e) => {
            stop(e);
            onClose();
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

/**
 * Un botón bajo horóscopos; al pulsar abre el mismo panel de ajustes en un modal.
 */
export function AdminLecturaPantallaPanel() {
  const [abierto, setAbierto] = useState(false);
  const [cfg, setCfg] = useState<LecturaPantallaSnapshot>(() => leerLecturaPantallaConfig());
  const [restauracionCustom, setRestauracionCustom] = useState(() => hayLecturaPantallaBaselineRestauracion());

  const sync = useCallback(() => {
    const next = leerLecturaPantallaConfig();
    setCfg(next);
    setRestauracionCustom(hayLecturaPantallaBaselineRestauracion());
    aplicarLecturaPantallaCssDesdeConfig(next);
  }, []);

  useEffect(() => {
    window.addEventListener(MAIKA_LECTURA_PANTALLA_UPDATED_EVENT, sync as EventListener);
    return () => window.removeEventListener(MAIKA_LECTURA_PANTALLA_UPDATED_EVENT, sync as EventListener);
  }, [sync]);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto]);

  const setShell = useCallback((shellAnchoMaxPx: number) => {
    setCfg(guardarLecturaPantallaConfig({ shellAnchoMaxPx }));
  }, []);

  const setMalla = useCallback((mallaAnchoMaxPx: number) => {
    setCfg(guardarLecturaPantallaConfig({ mallaAnchoMaxPx }));
  }, []);

  const setTirarHaciaBarra = useCallback((tirarHaciaBarraPx: number) => {
    setCfg(guardarLecturaPantallaConfig({ tirarHaciaBarraPx }));
  }, []);

  const onRestaurar = useCallback(() => {
    const next = restaurarLecturaPantallaPorDefecto();
    aplicarLecturaPantallaCssDesdeConfig(next);
    setCfg(() => ({ ...next }));
  }, []);

  const onGuardar = useCallback(() => {
    setCfg(guardarLecturaPantallaConfig(cfg));
  }, [cfg]);

  const onDefinirRestauracion = useCallback(() => {
    guardarLecturaPantallaBaselineRestauracion(cfg);
    setRestauracionCustom(true);
  }, [cfg]);

  const modal =
    abierto &&
    createPortal(
      <div
        role="presentation"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 12000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          boxSizing: "border-box",
          background: "rgba(6, 4, 14, 0.78)"
        }}
        onClick={() => setAbierto(false)}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-lectura-pantalla-titulo"
          style={{
            width: "100%",
            maxWidth: 600,
            maxHeight: "min(92vh, 720px)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            padding: "20px 22px 22px",
            boxSizing: "border-box",
            borderRadius: 16,
            border: "1px solid rgba(212, 175, 95, 0.35)",
            background: "linear-gradient(165deg, #1e1836 0%, #12101e 55%, #0a0814 100%)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
            textAlign: "left"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3
            id="admin-lectura-pantalla-titulo"
            style={{
              margin: "0 0 16px",
              fontSize: 17,
              fontWeight: 800,
              color: THEME.goldMain,
              letterSpacing: "0.02em",
              textAlign: "left",
              lineHeight: 1.25,
              flexShrink: 0
            }}
          >
            Pantalla · Lectura del día
          </h3>
          <LecturaPantallaModalBody
            cfg={cfg}
            onClose={() => setAbierto(false)}
            setShell={setShell}
            setMalla={setMalla}
            setTirarHaciaBarra={setTirarHaciaBarra}
            onRestaurar={onRestaurar}
            onGuardar={onGuardar}
            onDefinirRestauracion={onDefinirRestauracion}
            restauracionCustom={restauracionCustom}
          />
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <button
        type="button"
        className="btn-admin-limpio admin-btn admin-btn--gold"
        style={{ marginTop: 10 }}
        onClick={() => setAbierto(true)}
      >
        Pantalla lectura del día (ajustes)
      </button>
      {modal}
    </>
  );
}
