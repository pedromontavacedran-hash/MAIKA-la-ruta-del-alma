import { useState, useCallback } from "react";

export type NotificacionMaikaEstado = {
  mensaje: string;
  tipo: "normal" | "exito" | "error";
  color?: string;
  /** Incrementa en cada aviso para forzar remount sin `setState(null)` + `setTimeout` (evita parpadeos y saltos en la UI). */
  avisoKey: number;
};

export function useNotificacion() {
  const [notificacion, setNotificacion] = useState<NotificacionMaikaEstado | null>(null);

  const mostrarNotificacion = useCallback(
    (mensaje: string, tipo: "normal" | "exito" | "error" = "normal") => {
      setNotificacion((prev) => ({
        mensaje,
        tipo,
        avisoKey: (prev?.avisoKey ?? 0) + 1
      }));
    },
    []
  );

  return { notificacion, setNotificacion, mostrarNotificacion };
}
