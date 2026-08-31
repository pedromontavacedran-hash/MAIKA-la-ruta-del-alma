import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useSyncStatus } from "../app/hooks/useSyncStatus";
import type { SyncStatus } from "../utils/maikaSyncStatus";
import "./SyncIndicator.css";

const FLASH_MS = 250;

/** Cabecera escritorio: “Sinc.” + tiempo; móvil ya usaba abreviatura en `textoSyncTopbarMovil`. */
const SYNC_ETIQUETA: Record<SyncStatus, string> = {
  ok: "Sinc.",
  checking: "Pendiente",
  pending: "Pendiente",
  offline: "Sin API",
  error: "Error"
};

function lineaTiempoSync(status: SyncStatus, etiqueta: string, tiempoRelativo: string, queueLength: number): string {
  if (status === "pending") {
    return queueLength > 0
      ? `${queueLength} pendiente${queueLength === 1 ? "" : "s"} · ${tiempoRelativo}`
      : `Último intento · ${tiempoRelativo}`;
  }
  if (status === "checking") return `Comprobando servidor · ${tiempoRelativo}`;
  return `${etiqueta} · ${tiempoRelativo}`;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/** Solo topbar móvil: texto tipo `Sinc. 2 min. 3 seg.` */
function useViewportMax768(): boolean {
  const [m, setM] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const onChange = () => setM(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return m;
}

function formatoRelojCompactoMovil(sec: number): string {
  if (sec <= 0) return "ahora";
  if (sec < 60) return sec === 1 ? "1 seg." : `${sec} seg.`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  if (min < 60) {
    const minPart = min === 1 ? "1 min." : `${min} min.`;
    if (rem === 0) return minPart;
    const segPart = rem === 1 ? "1 seg." : `${rem} seg.`;
    return `${minPart} ${segPart}`;
  }
  const h = Math.floor(min / 60);
  const minRem = min % 60;
  if (minRem === 0) return h === 1 ? "1 h" : `${h} h`;
  const hPart = h === 1 ? "1 h" : `${h} h`;
  const mPart = minRem === 1 ? "1 min." : `${minRem} min.`;
  return `${hPart} ${mPart}`;
}

function textoSyncTopbarMovil(status: SyncStatus, sec: number, queueLength: number): string {
  const t = formatoRelojCompactoMovil(sec);
  if (status === "pending") {
    const prefix = queueLength > 0 ? `Pend. ${queueLength}` : "Pend.";
    return t === "ahora" ? `${prefix} ahora` : `${prefix} ${t}`;
  }
  if (status === "checking") return t === "ahora" ? "Pend. ahora" : `Pend. ${t}`;
  if (status === "offline") return t === "ahora" ? "Sin API" : `Sin API ${t}`;
  if (status === "error") return t === "ahora" ? "Err. ahora" : `Err. ${t}`;
  return t === "ahora" ? "Sinc. ahora" : `Sinc. ${t}`;
}

function horaUltimoIntento(ts: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
}

function SyncDots() {
  return (
    <span className="maika-sync-dots" aria-hidden="true">
      <span>.</span>
      <span>.</span>
      <span>.</span>
    </span>
  );
}

type ContentParams = {
  status: SyncStatus;
  lineaTiempo: string;
};

const lineaBaseStyle = {
  display: "inline-flex" as const,
  flexWrap: "nowrap" as const,
  alignItems: "baseline" as const,
  justifyContent: "flex-end" as const,
  gap: 4,
  whiteSpace: "nowrap" as const,
  fontSize: 12,
  fontWeight: 600,
  maxWidth: "100%"
};

/** Siempre una sola línea (sin salto). */
function getContent({ status, lineaTiempo }: ContentParams): { body: ReactNode } {
  const esAmarillo = status === "pending" || status === "checking";

  if (esAmarillo) {
    return {
      body: (
        <span style={lineaBaseStyle}>
          <span>{status === "pending" ? "Por sincronizar" : "Sincronizando"}</span>
          <span style={{ fontWeight: 500, opacity: 0.92, fontSize: 11 }}>
            {status === "pending" ? "(pulsa" : "(comprobando"}
          </span>
          <SyncDots />
          <span style={{ fontWeight: 500, opacity: 0.92, fontSize: 11 }}>)</span>
          <span style={{ fontWeight: 500, opacity: 0.75, padding: "0 2px" }} aria-hidden="true">
            ·
          </span>
          <span style={{ fontWeight: 500, opacity: 0.92, fontSize: 11 }}>{lineaTiempo}</span>
        </span>
      )
    };
  }

  return {
    body: <span style={lineaBaseStyle}>{lineaTiempo}</span>
  };
}

function syncColors(status: SyncStatus): { esVerde: boolean; esAmarillo: boolean; esOffline: boolean } {
  return {
    esVerde: status === "ok",
    esAmarillo: status === "pending" || status === "checking",
    esOffline: status === "offline"
  };
}

export type SyncIndicatorPlacement = "topbar" | "fixed";

export type SyncIndicatorProps = {
  /** `topbar`: junto a iconos cuenta/carrito (cabecera). `fixed`: esquina inferior derecha (legacy). */
  placement?: SyncIndicatorPlacement;
};

export default function SyncIndicator({ placement = "topbar" }: SyncIndicatorProps) {
  const { status, lastSyncAt, tiempoRelativo, segundosDesdeRelojSync, queueLength, syncing, syncNow, apiKnown } =
    useSyncStatus();
  const reducedMotion = usePrefersReducedMotion();
  const viewportMovil = useViewportMax768();
  const [isFlashing, setIsFlashing] = useState(false);
  const prevStatusRef = useRef<SyncStatus | null>(null);

  const etiqueta = SYNC_ETIQUETA[status];
  const lineaTiempo = lineaTiempoSync(status, etiqueta, tiempoRelativo, queueLength);
  const { esVerde, esAmarillo, esOffline } = syncColors(status);
  const intentoHora = horaUltimoIntento(lastSyncAt);
  const isTopbar = placement === "topbar";
  const topbarMovilCompacto = isTopbar && viewportMovil;
  const hayPendientes = queueLength > 0;

  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;

    if (reducedMotion) return;

    const llegaOkDesdeTransitorio =
      status === "ok" &&
      prev !== null &&
      prev !== "ok" &&
      (prev === "pending" || prev === "checking" || prev === "offline" || prev === "error");

    if (!llegaOkDesdeTransitorio) return;

    setIsFlashing(true);
    const t = window.setTimeout(() => setIsFlashing(false), FLASH_MS);
    return () => window.clearTimeout(t);
  }, [status, reducedMotion]);

  /**
   * Móvil + cabecera: ocultar cuando todo va bien; tampoco mostrar «Pend.» mientras el probe
   * del API no ha terminado (evita flash amarillo → desaparece que empuja logo/iconos).
   */
  if (isTopbar && viewportMovil && (status === "ok" || (status === "checking" && !apiKnown))) {
    return null;
  }

  const { body } = topbarMovilCompacto
    ? {
        body: (
          <span style={{ ...lineaBaseStyle, fontSize: 11 }}>
            {textoSyncTopbarMovil(status, segundosDesdeRelojSync, queueLength)}
          </span>
        )
      }
    : getContent({ status, lineaTiempo });

  const accionPendiente =
    status === "pending" ? `reintentando envío${hayPendientes ? `, ${queueLength} pendiente(s)` : ""}` : status === "checking" ? "comprobando servidor" : null;
  const ariaSync = accionPendiente
    ? `Sincronización: Pendiente, ${accionPendiente}. ${lineaTiempo}. Último intento: ${intentoHora}.`
    : `Sincronización: ${lineaTiempo}. Último intento: ${intentoHora}.`;

  const titleSync = accionPendiente
    ? `${lineaTiempo}\n${accionPendiente}\nÚltimo intento: ${intentoHora}`
    : `${lineaTiempo}\nÚltimo intento: ${intentoHora}`;

  const allowMotion = !reducedMotion;
  /** El `scale` del pulso en la topbar desplaza el flex vecino (logo/iconos); solo en `fixed` conservamos pulso. */
  const showPulse = allowMotion && (status === "pending" || status === "checking") && !isTopbar;
  const showFlash = allowMotion && isFlashing && status === "ok";

  const classNames = [
    "maika-sync-indicator",
    isTopbar ? "maika-sync-indicator--topbar" : "",
    topbarMovilCompacto ? "maika-sync-indicator--topbar-mobile-compact" : "",
    /** En topbar los puntos animados mueven subpíxeles en el flex; el pulso ya está desactivado aquí. */
    allowMotion && esAmarillo && !isTopbar ? "maika-sync-indicator--motion" : "",
    showPulse ? "maika-sync-indicator--pulse" : "",
    showFlash ? "maika-sync-indicator--flash" : ""
  ]
    .filter(Boolean)
    .join(" ");

  const layoutTopbar: CSSProperties = {
    position: "relative",
    alignSelf: "center",
    zIndex: 1,
    maxWidth: "min(520px, calc(100vw - 96px))",
    marginRight: 4
  };

  const layoutFixed: CSSProperties = {
    position: "fixed",
    bottom: "max(58px, calc(46px + env(safe-area-inset-bottom, 0px)))",
    right: "max(10px, env(safe-area-inset-right, 0px))",
    zIndex: 9999,
    maxWidth: "min(520px, calc(100vw - 24px))"
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={ariaSync}
      title={titleSync}
      data-maika-sync-status={status}
      className={classNames}
      onClick={
        hayPendientes && !syncing
          ? () => {
              void syncNow();
            }
          : undefined
      }
      style={{
        padding: "5px 8px 4px",
        borderRadius: "8px",
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.02em",
        border: "none",
        background: esVerde ? "#1f7a3a" : esAmarillo ? "#a67c00" : esOffline ? "#a85a12" : "#7a1f1f",
        color: "#fff",
        pointerEvents: hayPendientes ? "auto" : "none",
        cursor: hayPendientes ? (syncing ? "wait" : "pointer") : "default",
        userSelect: "none",
        boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
        display: "flex",
        flexDirection: "row",
        flexWrap: "nowrap",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 4,
        lineHeight: 1.2,
        textAlign: "right",
        overflow: "visible",
        ...(isTopbar ? layoutTopbar : layoutFixed)
      }}
    >
      {body}
      {hayPendientes && !topbarMovilCompacto ? (
        <button
          type="button"
          className="maika-sync-indicator__button"
          disabled={syncing}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void syncNow();
          }}
          aria-label="Sincronizar cambios pendientes ahora"
        >
          {syncing ? "..." : "Sync"}
        </button>
      ) : null}
    </div>
  );
}
