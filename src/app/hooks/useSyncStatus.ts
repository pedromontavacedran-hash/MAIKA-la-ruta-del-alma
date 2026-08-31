import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MAIKA_API_BECAME_REACHABLE_EVENT, probeMaikaApiReachable } from "../../utils/maikaApiProbe";
import {
  leerOutbox,
  MAIKA_OUTBOX_REPLANIFICAR_TEMPORIZADOR_EVENT,
  sincronizarOutbox
} from "../../utils/maikaOutbox";
import { getMaikaOutboxSyncSession, subscribeMaikaOutboxSyncSession } from "../../utils/maikaOutboxSyncSession";
import { diagnoseSyncLocal, getSyncStatus, mergeSyncStatus, type SyncStatus } from "../../utils/maikaSyncStatus";
import { normalizarTelefonoES9 } from "../../utils/telefono";

function refrescarLastSyncAt(): number {
  return getMaikaOutboxSyncSession().lastSyncAt;
}

/** Texto tipo SaaS: segundos siempre visibles hasta la hora (p. ej. "Hace 1 min 8 s"). */
function formatHaceDesdeSync(lastSyncAtMs: number, ahoraMs: number): string {
  if (!lastSyncAtMs) return "Sin intentos aún";
  const sec = Math.max(0, Math.floor((ahoraMs - lastSyncAtMs) / 1000));
  if (sec < 60) {
    if (sec === 0) return "Ahora";
    return sec === 1 ? "Hace 1 segundo" : `Hace ${sec} s`;
  }
  const min = Math.floor(sec / 60);
  const secRem = sec % 60;
  if (min < 60) {
    if (secRem === 0) return min === 1 ? "Hace 1 min" : `Hace ${min} min`;
    return min === 1 ? `Hace 1 min ${secRem} s` : `Hace ${min} min ${secRem} s`;
  }
  const h = Math.floor(min / 60);
  const minRem = min % 60;
  if (minRem === 0) return h === 1 ? "Hace 1 h" : `Hace ${h} h`;
  return h === 1 ? `Hace 1 h ${minRem} min` : `Hace ${h} h ${minRem} min`;
}

export function useSyncStatus() {
  const [local, setLocal] = useState<SyncStatus>(() => getSyncStatus());
  const [queueLength, setQueueLength] = useState<number>(() => leerOutbox().length);
  const [syncing, setSyncing] = useState(false);
  const [apiReachable, setApiReachable] = useState<boolean | null>(null);
  const [apiKnown, setApiKnown] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number>(() => refrescarLastSyncAt());
  const [ahoraTick, setAhoraTick] = useState(() => Date.now());
  /** Inicio de la racha actual “sin API” (no el último sync OK del outbox). */
  const sinApiDesdeRef = useRef<number | null>(null);
  const prevApiReachableRef = useRef<boolean | null>(null);

  /**
   * Cada segundo el chip de la cabecera recalculaba texto y re-pintaba el flex (micro-movimiento junto al logo).
   * 5 s sigue siendo usable para “hace X min” y reduce mucho el jitter.
   */
  useEffect(() => {
    const id = window.setInterval(() => setAhoraTick(Date.now()), 5000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    return subscribeMaikaOutboxSyncSession(() => {
      try {
        const diag = diagnoseSyncLocal();
        setLocal(diag.status);
        setQueueLength(diag.queueLength);
        setLastSyncAt(refrescarLastSyncAt());
      } catch {
        setLocal("error");
        setQueueLength(0);
        setLastSyncAt(refrescarLastSyncAt());
      }
    });
  }, []);

  useEffect(() => {
    const tickLocal = () => {
      try {
        const diag = diagnoseSyncLocal();
        setLocal(diag.status);
        setQueueLength(diag.queueLength);
        setLastSyncAt(refrescarLastSyncAt());
      } catch {
        setLocal("error");
        setQueueLength(0);
        setLastSyncAt(refrescarLastSyncAt());
      }
    };
    const tickProbe = () => {
      void probeMaikaApiReachable().then((ok) => {
        const prev = prevApiReachableRef.current;
        if (prev === false && ok === true && typeof window !== "undefined") {
          window.dispatchEvent(new Event(MAIKA_API_BECAME_REACHABLE_EVENT));
        }
        prevApiReachableRef.current = ok;
        setApiReachable(ok);
        setApiKnown(true);
        try {
          const diag = diagnoseSyncLocal();
          setLocal(diag.status);
          setQueueLength(diag.queueLength);
        } catch {
          setLocal("error");
          setQueueLength(0);
        }
      });
    };

    tickLocal();
    tickProbe();

    const interval = setInterval(() => {
      tickLocal();
      tickProbe();
    }, 2000);

    const onOnline = () => {
      tickLocal();
      tickProbe();
    };
    window.addEventListener("online", onOnline);

    const alVolverALaPestana = () => {
      /** Sin esto, en segundo plano el navegador frena el intervalo de 1s y el contador queda “pillado” hasta F5. */
      setAhoraTick(Date.now());
      tickLocal();
      tickProbe();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") alVolverALaPestana();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", alVolverALaPestana);
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) alVolverALaPestana();
    };
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener(MAIKA_OUTBOX_REPLANIFICAR_TEMPORIZADOR_EVENT, tickLocal);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", alVolverALaPestana);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener(MAIKA_OUTBOX_REPLANIFICAR_TEMPORIZADOR_EVENT, tickLocal);
    };
  }, []);

  const syncNow = useCallback(async () => {
    setSyncing(true);
    try {
      await sincronizarOutbox(normalizarTelefonoES9);
      const diag = diagnoseSyncLocal();
      setLocal(diag.status);
      setQueueLength(diag.queueLength);
      setLastSyncAt(refrescarLastSyncAt());
    } finally {
      setSyncing(false);
    }
  }, []);

  const status = useMemo(
    () => mergeSyncStatus(local, apiReachable, apiKnown),
    [local, apiReachable, apiKnown]
  );

  if (status === "offline") {
    if (sinApiDesdeRef.current == null) sinApiDesdeRef.current = Date.now();
  } else {
    sinApiDesdeRef.current = null;
  }

  /** Solo la parte temporal (la UI añade “Sincronizado · …”, “Sin API · …”, etc.). */
  const tiempoRelativo = useMemo(() => {
    if (status === "offline") {
      const t = sinApiDesdeRef.current;
      if (t == null) return "Sin conexión…";
      const base = formatHaceDesdeSync(t, ahoraTick);
      if (base === "Ahora") return "Ahora";
      if (base === "Sin intentos aún") return "Ahora";
      return base;
    }
    return formatHaceDesdeSync(lastSyncAt, ahoraTick);
  }, [status, lastSyncAt, ahoraTick]);

  /** Segundos desde el ancla del reloj (sin API desde `sinApiDesdeRef`, si no `lastSyncAt`) — para texto compacto en móvil. */
  const segundosDesdeRelojSync = useMemo(() => {
    if (status === "offline") {
      const t = sinApiDesdeRef.current;
      if (t == null) return 0;
      return Math.max(0, Math.floor((ahoraTick - t) / 1000));
    }
    if (!lastSyncAt) return 0;
    return Math.max(0, Math.floor((ahoraTick - lastSyncAt) / 1000));
  }, [status, lastSyncAt, ahoraTick]);

  return useMemo(
    () => ({
      status,
      lastSyncAt,
      tiempoRelativo,
      segundosDesdeRelojSync,
      queueLength,
      syncing,
      syncNow,
      apiKnown
    }),
    [status, lastSyncAt, tiempoRelativo, segundosDesdeRelojSync, queueLength, syncing, syncNow, apiKnown]
  );
}
