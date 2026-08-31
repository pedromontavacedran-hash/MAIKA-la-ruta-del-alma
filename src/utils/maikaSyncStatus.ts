import { getOutboxLastSyncOk } from "./maikaOutboxSyncSession";

/**
 * `offline` = cola vacía pero el backend no responde (p. ej. CMD cerrado).
 * `checking` = aún no hay resultado del probe al API (evita mostrar verde falso).
 */
export type SyncStatus = "ok" | "pending" | "error" | "offline" | "checking";

/** @deprecated Ya no se escribe; se limpia al leer por compatibilidad con sesiones antiguas. */
export const MAIKA_SYNC_DEGRADED_KEY = "maika_sync_degraded";

export type SyncLocalCode =
  | "OUTBOX_ABSENT"
  | "OUTBOX_INVALID_JSON"
  | "OUTBOX_NOT_ARRAY"
  | "OUTBOX_EMPTY"
  | "QUEUE_WAITING"
  | "LAST_OUTBOX_SYNC_FAILED"
  | "STORAGE_ERROR";

export type SyncLocalDiagnostic = {
  status: SyncStatus;
  code: SyncLocalCode;
  /** Ítems en cola (0 si no aplica o error de lectura). */
  queueLength: number;
};

function clearLegacyDegradedKey(): void {
  try {
    localStorage.removeItem(MAIKA_SYNC_DEGRADED_KEY);
  } catch {
    /* noop */
  }
}

/**
 * Indicador local: primero cola; si está vacía y el formato es válido, el color depende del último intento de sync en esta sesión.
 */
export function diagnoseSyncLocal(): SyncLocalDiagnostic {
  try {
    const outboxRaw = localStorage.getItem("maika_outbox");
    if (!outboxRaw) {
      clearLegacyDegradedKey();
      const lastOk = getOutboxLastSyncOk();
      return {
        status: lastOk ? "ok" : "error",
        code: lastOk ? "OUTBOX_ABSENT" : "LAST_OUTBOX_SYNC_FAILED",
        queueLength: 0
      };
    }

    let outbox: unknown;
    try {
      outbox = JSON.parse(outboxRaw) as unknown;
    } catch {
      return { status: "error", code: "OUTBOX_INVALID_JSON", queueLength: 0 };
    }

    if (!Array.isArray(outbox)) {
      return { status: "error", code: "OUTBOX_NOT_ARRAY", queueLength: 0 };
    }

    const queueLength = outbox.length;
    if (queueLength === 0) {
      clearLegacyDegradedKey();
      const lastOk = getOutboxLastSyncOk();
      return {
        status: lastOk ? "ok" : "error",
        code: lastOk ? "OUTBOX_EMPTY" : "LAST_OUTBOX_SYNC_FAILED",
        queueLength: 0
      };
    }

    return { status: "pending", code: "QUEUE_WAITING", queueLength };
  } catch {
    return { status: "error", code: "STORAGE_ERROR", queueLength: 0 };
  }
}

export function getSyncStatus(): SyncStatus {
  return diagnoseSyncLocal().status;
}

/**
 * Combina estado local (cola) con reachability del API.
 * - `apiKnown === false`: aún no se ha probado → nunca devolver `ok` si la cola está vacía (no verde engañoso).
 * - Sin servidor y cola vacía → `offline`.
 * - Sin servidor y hay cola → `pending` (misma cola; no confundir con error del servidor).
 */
export function mergeSyncStatus(
  local: SyncStatus,
  apiReachable: boolean | null,
  apiKnown: boolean
): SyncStatus {
  if (!apiKnown) {
    if (local === "ok") return "checking";
    return local;
  }
  if (apiReachable === false) {
    if (local === "ok") return "offline";
    if (local === "pending") return "pending";
    return "error";
  }
  return local;
}
