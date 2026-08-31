/**
 * Cola de sincronización con el backend (usuarios, pedidos).
 * Supervivencia ante fallos de red/API: los ítems fallidos permanecen hasta lograr envío.
 */

import type { Pedido } from "../types";
import { esPedidoApiRechazoClienteSinReintento } from "../services/apiPedidos";
import { esErrorDeConexion } from "./esErrorDeConexion";
import { getOutboxLastSyncOk, notifyOutboxSyncFinished } from "./maikaOutboxSyncSession";
import { normalizarTelefonoES9 } from "./telefono";
import { confirmarPedidoBackend } from "./pedidos/confirmarPedidoBackend";
import type { MaikaUsuarioLS } from "./maikaUsuarios";

export const MAIKA_OUTBOX_KEY = "maika_outbox";

/** UI (p. ej. toast) cuando un lote de la cola se envía bien tras estar pendiente. */
export const MAIKA_OUTBOX_COLA_ENVIADA_EVENT = "maika-outbox-cola-enviada";

/** Reprograma el temporizador de sync en shell (cola vacía ↔ con ítems). */
export const MAIKA_OUTBOX_REPLANIFICAR_TEMPORIZADOR_EVENT = "maika-outbox-replanificar-temporizador";

export type MaikaOutboxColaEnviadaDetail = {
  enviadosSnapshot: number;
  /** Hubo altas a la cola durante el sync; puede seguir en amarillo. */
  siguenEnCola: boolean;
};

export type MaikaOutboxTipo = "usuario" | "pedido" | "perfil";
export type MaikaOutboxAccion = "crear" | "editar" | "upsert" | "patchMe";

export type MaikaOutboxItem = {
  id: string;
  tipo: MaikaOutboxTipo;
  accion: MaikaOutboxAccion;
  data: unknown;
  timestamp: number;
  /** Evita duplicados lógicos (ej. usuario:+34612345678, pedido:MK…) */
  dedupeKey?: string;
};

const OUTBOX_DEBOUNCE_MS = 900;

let outboxDebounceId: ReturnType<typeof setTimeout> | null = null;
let outboxProcesando = false;

function normalizarItems(raw: unknown): MaikaOutboxItem[] {
  if (!Array.isArray(raw)) return [];
  const out: MaikaOutboxItem[] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const o = x as Partial<MaikaOutboxItem>;
    if (o.tipo !== "usuario" && o.tipo !== "pedido" && o.tipo !== "perfil") continue;
    if (o.accion !== "crear" && o.accion !== "editar" && o.accion !== "upsert" && o.accion !== "patchMe") continue;
    if (typeof o.id !== "string" || !o.id) continue;
    if (typeof o.timestamp !== "number") continue;
    out.push({
      id: o.id,
      tipo: o.tipo,
      accion: o.accion,
      data: o.data,
      timestamp: o.timestamp,
      dedupeKey: typeof o.dedupeKey === "string" ? o.dedupeKey : undefined
    });
  }
  return out;
}

export function leerOutbox(): MaikaOutboxItem[] {
  try {
    const raw = localStorage.getItem(MAIKA_OUTBOX_KEY);
    if (!raw) return [];
    return normalizarItems(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

export function guardarOutbox(items: MaikaOutboxItem[]): void {
  try {
    localStorage.setItem(MAIKA_OUTBOX_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("[maika_outbox] No se pudo guardar la cola en localStorage", e);
  }
}

function quitarPorDedupe(cola: MaikaOutboxItem[], tipo: MaikaOutboxTipo, dedupeKey: string | undefined): MaikaOutboxItem[] {
  if (!dedupeKey) return cola;
  return cola.filter((x) => !(x.tipo === tipo && x.dedupeKey === dedupeKey));
}

/**
 * Añade a la cola. Si hay mismo tipo+dedupeKey, sustituye la entrada anterior.
 */
export function encolarOutbox(parcial: Omit<MaikaOutboxItem, "id" | "timestamp"> & { id?: string }): void {
  const id = parcial.id?.trim() || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `ob_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
  const timestamp = Date.now();
  let cola = leerOutbox();
  cola = quitarPorDedupe(cola, parcial.tipo, parcial.dedupeKey);
  cola.push({
    id,
    tipo: parcial.tipo,
    accion: parcial.accion,
    data: parcial.data,
    timestamp,
    dedupeKey: parcial.dedupeKey
  });
  guardarOutbox(cola);
  console.log("[maika_outbox] Encolado", parcial.tipo, parcial.accion, parcial.dedupeKey ?? id, "· pendientes:", cola.length);
}

export function encolarUsuarioUpsert(u: MaikaUsuarioLS): void {
  const tel9 = normalizarTelefonoES9(String(u.telefono || ""));
  const dedupeKey = /^[67]\d{8}$/.test(tel9)
    ? `usuario:+34${tel9}`
    : `usuario:email:${(u.email || "").trim().toLowerCase()}`;
  encolarOutbox({
    tipo: "usuario",
    accion: "upsert",
    data: JSON.parse(JSON.stringify(u)) as MaikaUsuarioLS,
    dedupeKey
  });
}

export type MaikaOutboxPedidoCrearData = {
  pedido: Pedido;
  idempotencyKey: string;
};

export type MaikaOutboxPerfilPatchData = {
  body: Record<string, unknown>;
  idempotencyKey: string;
};

/** Misma regla que al encolar: número de pedido o idempotency. */
export function dedupeKeyPedidoCrear(pedido: Pedido, idempotencyKey: string): string {
  const num = String(pedido?.numero || "").trim();
  return num ? `pedido:${num}` : `pedido:${idempotencyKey.trim() || "sin_numero"}`;
}

export function encolarPedidoCrear(pedido: Pedido, idempotencyKey: string): void {
  encolarOutbox({
    tipo: "pedido",
    accion: "crear",
    data: { pedido: JSON.parse(JSON.stringify(pedido)) as Pedido, idempotencyKey: idempotencyKey.trim() } satisfies MaikaOutboxPedidoCrearData,
    dedupeKey: dedupeKeyPedidoCrear(pedido, idempotencyKey)
  });
}

export function encolarPerfilPatch(
  body: Record<string, unknown>,
  idempotencyKey: string,
  dedupeKey = "perfil:me"
): void {
  encolarOutbox({
    tipo: "perfil",
    accion: "patchMe",
    data: { body: JSON.parse(JSON.stringify(body)) as Record<string, unknown>, idempotencyKey: idempotencyKey.trim() } satisfies MaikaOutboxPerfilPatchData,
    dedupeKey
  });
}

/**
 * Tras POST /pedidos OK (checkout u otro): quita la entrada de envío pendiente.
 * Coincide por `dedupeKey` o por `idempotencyKey` dentro de `data`.
 */
export function quitarPedidoCreadoDelOutbox(pedido: Pedido, idempotencyKey: string): void {
  const keyTrim = idempotencyKey.trim();
  const dedupe = dedupeKeyPedidoCrear(pedido, idempotencyKey);
  let cola = leerOutbox();
  const antes = cola.length;
  cola = cola.filter((x) => {
    if (x.tipo !== "pedido" || x.accion !== "crear") return true;
    if (x.dedupeKey === dedupe) return false;
    const d = x.data as MaikaOutboxPedidoCrearData;
    if (d && typeof d.idempotencyKey === "string" && d.idempotencyKey.trim() === keyTrim) return false;
    return true;
  });
  if (cola.length < antes) {
    guardarOutbox(cola);
    console.log("[maika_outbox] Quitado pedido tras confirmación API OK · pendientes:", cola.length);
  }
}

export function programarSincronizarOutbox(normalizarTelefonoES9: (telefono: string) => string): void {
  if (typeof window === "undefined") return;
  if (outboxDebounceId) window.clearTimeout(outboxDebounceId);
  outboxDebounceId = window.setTimeout(() => {
    outboxDebounceId = null;
    void sincronizarOutbox(normalizarTelefonoES9);
  }, OUTBOX_DEBOUNCE_MS);
}

type ItemSyncOutcome = "ok" | "fail_connection" | "fail_server" | "drop_pedido_cliente";

async function procesarItem(
  item: MaikaOutboxItem,
  normalizarTelefonoES9: (telefono: string) => string
): Promise<ItemSyncOutcome> {
  if (item.tipo === "usuario" && item.accion === "upsert") {
    const u = item.data as MaikaUsuarioLS;
    if (!u || typeof u !== "object") return "fail_server";
    const { sincronizarUnUsuarioMaikaConBackend } = await import("./maikaUsuarios");
    const r = await sincronizarUnUsuarioMaikaConBackend(u, normalizarTelefonoES9);
    if (r.ok === true) return "ok";
    return r.connectionIssue ? "fail_connection" : "fail_server";
  }
  if (item.tipo === "pedido" && item.accion === "crear") {
    const d = item.data as MaikaOutboxPedidoCrearData;
    if (!d?.pedido || typeof d.pedido !== "object") return "fail_server";
    const res = await confirmarPedidoBackend(d.pedido, d.idempotencyKey);
    if (res.ok === true) return "ok";
    if (esPedidoApiRechazoClienteSinReintento(res.error)) return "drop_pedido_cliente";
    return esErrorDeConexion(res.error) ? "fail_connection" : "fail_server";
  }
  if (item.tipo === "perfil" && item.accion === "patchMe") {
    const d = item.data as MaikaOutboxPerfilPatchData;
    if (!d?.body || typeof d.body !== "object") return "fail_server";
    const { actualizarPerfilUsuarioApi } = await import("../services/apiAuth");
    await actualizarPerfilUsuarioApi(d.body, { idempotencyKey: d.idempotencyKey });
    return "ok";
  }
  return "fail_server";
}

/**
 * Intenta enviar cada ítem; los que fallan se conservan. Preserva entradas añadidas durante el proceso.
 */
export async function sincronizarOutbox(normalizarTelefonoES9: (telefono: string) => string): Promise<void> {
  if (typeof window === "undefined") return;
  if (outboxProcesando) {
    /** Latido sin duplicar trabajo: notifica listeners sin mover el reloj del pill. */
    notifyOutboxSyncFinished(getOutboxLastSyncOk(), { refreshTimestamp: false });
    return;
  }
  outboxProcesando = true;
  try {
    const snapshot = leerOutbox();
    if (snapshot.length === 0) {
      notifyOutboxSyncFinished(true);
      return;
    }
    const idsSnapshot = new Set(snapshot.map((i) => i.id));
    snapshot.sort((a, b) => a.timestamp - b.timestamp);

    const fallidos: MaikaOutboxItem[] = [];
    let okCount = 0;
    let anyServerFailure = false;
    for (const item of snapshot) {
      let outcome: ItemSyncOutcome;
      try {
        outcome = await procesarItem(item, normalizarTelefonoES9);
      } catch (e) {
        outcome = esErrorDeConexion(e) ? "fail_connection" : "fail_server";
      }
      if (outcome === "ok") okCount++;
      else if (outcome === "drop_pedido_cliente") {
        /* 409 stock, 4xx validación: no reintentar; no cuenta como fallo de sync “rojo”. */
      } else {
        fallidos.push(item);
        if (outcome === "fail_server") anyServerFailure = true;
      }
    }

    const colaActual = leerOutbox();
    const nuevosDurante = colaActual.filter((i) => !idsSnapshot.has(i.id));
    guardarOutbox([...fallidos, ...nuevosDurante]);

    const colaRestante = fallidos.length + nuevosDurante.length;
    const refrescarReloj = colaRestante === 0;

    if (okCount === snapshot.length) {
      notifyOutboxSyncFinished(true, { refreshTimestamp: refrescarReloj });
      if (snapshot.length > 0 && typeof window !== "undefined") {
        const siguenEnCola = nuevosDurante.length > 0;
        window.dispatchEvent(
          new CustomEvent<MaikaOutboxColaEnviadaDetail>(MAIKA_OUTBOX_COLA_ENVIADA_EVENT, {
            detail: { enviadosSnapshot: snapshot.length, siguenEnCola }
          })
        );
      }
    } else if (anyServerFailure) {
      notifyOutboxSyncFinished(false, { refreshTimestamp: refrescarReloj });
    } else {
      /** Solo fallos de red/API caída: no marcar sesión como error (cola sigue pendiente). */
      notifyOutboxSyncFinished(getOutboxLastSyncOk(), { refreshTimestamp: refrescarReloj });
    }

    if (okCount > 0 || fallidos.length > 0) {
      console.log(
        "[maika_outbox] Sync · ok:",
        okCount,
        "· siguen pendientes:",
        fallidos.length + nuevosDurante.length
      );
    }
  } catch (e) {
    const conn = esErrorDeConexion(e);
    notifyOutboxSyncFinished(conn ? getOutboxLastSyncOk() : false, {
      refreshTimestamp: !conn
    });
  } finally {
    outboxProcesando = false;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(MAIKA_OUTBOX_REPLANIFICAR_TEMPORIZADOR_EVENT));
    }
  }
}
