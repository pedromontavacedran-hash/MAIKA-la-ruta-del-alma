import { useState, useCallback } from "react";

export function useNotificacion() {
  const [notificacion, setNotificacion] = useState<{
    mensaje: string;
    tipo: "normal" | "exito" | "error";
    color?: string;
  } | null>(null);

  const mostrarNotificacion = useCallback(
    (mensaje: string, tipo: "normal" | "exito" | "error" = "normal") => {
      setNotificacion({ mensaje, tipo });
    },
    []
  );

  return { notificacion, setNotificacion, mostrarNotificacion };
}
