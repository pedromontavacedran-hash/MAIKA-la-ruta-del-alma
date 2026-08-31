/** Coordinación entre pestañas del mismo origen (p. ej. enlace del correo abre /reset-password en una pestaña nueva). */

export const MAIKA_TABS_BROADCAST_NAME = "maika-tabs-v1";

export type MaikaTabsBroadcastPayload = {
  type: "reset-password-tab-opened";
  ts: number;
};

export function broadcastMaikaTabMessage(payload: MaikaTabsBroadcastPayload): void {
  if (typeof BroadcastChannel === "undefined") return;
  const ch = new BroadcastChannel(MAIKA_TABS_BROADCAST_NAME);
  try {
    ch.postMessage(payload);
  } finally {
    ch.close();
  }
}
