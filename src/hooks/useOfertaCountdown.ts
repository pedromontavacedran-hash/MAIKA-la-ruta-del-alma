import { useEffect, useMemo, useState } from "react";
import type { OfertaConfig } from "../utils/oferta";
import { esOfertaEnVigencia, obtenerRangoOfertaActivo } from "../utils/oferta";

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (d > 0) return `${d}d ${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Cuenta atrás hasta el fin de la ventana de oferta (la misma que define el admin en localStorage).
 * Devuelve null si no hay oferta en vigor.
 */
export function useOfertaCountdown(ofertaConfig: OfertaConfig | null): string | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return useMemo(() => {
    if (!esOfertaEnVigencia(ofertaConfig)) return null;
    const { fin } = obtenerRangoOfertaActivo(ofertaConfig);
    const ms = Math.max(0, fin.getTime() - now);
    return formatCountdown(ms);
  }, [ofertaConfig, now]);
}
