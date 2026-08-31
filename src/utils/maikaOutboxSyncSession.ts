/**
 * Estado en memoria (por pestaña / recarga) del último intento de `sincronizarOutbox`.
 * No persiste: un sync OK posterior resetea el indicador sin depender de errores antiguos.
 */

export type MaikaOutboxSyncSession = {
  lastSyncOk: boolean;
  lastSyncAt: number;
};

/** Cola vacía antes del primer sync en la sesión → no mostrar rojo hasta que falle un intento real. */
let session: MaikaOutboxSyncSession = { lastSyncOk: true, lastSyncAt: 0 };

const listeners = new Set<() => void>();

export function getMaikaOutboxSyncSession(): MaikaOutboxSyncSession {
  return { ...session };
}

export function getOutboxLastSyncOk(): boolean {
  return session.lastSyncOk;
}

export function subscribeMaikaOutboxSyncSession(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export type NotifyOutboxSyncFinishedOptions = {
  /**
   * Si false, conserva `lastSyncAt` (cola sigue pendiente o latido sin trabajo nuevo).
   * Así “Hace X min” no vuelve a “Ahora” en cada foco, ruta o reintento fallido.
   */
  refreshTimestamp?: boolean;
};

/**
 * Llamar al terminar cada ejecución de `sincronizarOutbox` (cola vacía o con ítems).
 * Por defecto actualiza `lastSyncAt` (último intento con cola ya vacía o estado estable).
 */
export function notifyOutboxSyncFinished(ok: boolean, options?: NotifyOutboxSyncFinishedOptions): void {
  const prevOk = session.lastSyncOk;
  const now = Date.now();
  const bump = options?.refreshTimestamp !== false;
  const nextAt = bump ? now : session.lastSyncAt > 0 ? session.lastSyncAt : now;
  session = { lastSyncOk: ok, lastSyncAt: nextAt };
  if (prevOk !== ok) {
    console.log(
      `[maika_sync] Último intento de outbox: ${ok ? "OK (verde al vaciar cola)" : "FALLO (rojo si cola vacía)"} · ts=${session.lastSyncAt}`
    );
  }
  for (const fn of listeners) fn();
}
