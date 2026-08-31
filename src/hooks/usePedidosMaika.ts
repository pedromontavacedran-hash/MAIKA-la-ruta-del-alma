import { useEffect, useState } from "react";
import type { Pedido } from "../types";
import { cargarPedidosDesdeStorage } from "../utils/storageLoaders";
import { obtenerPedidosApi } from "../services/apiPedidos";
import { hasClientSession } from "../services/apiAuth";

/**
 * `syncKey` debe cambiar cuando cambia la identidad de sesión (p. ej. auth listo, usuario.id, login/logout).
 * Así tras F5 o login no quedamos con el efecto ejecutado solo en el primer render vacío.
 */
export function usePedidosMaika(syncKey: string | null) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  useEffect(() => {
    if (syncKey == null) return;
    let activo = true;
    const hydrate = async () => {
      const hasToken = hasClientSession();
      if (!hasToken) {
        const data = cargarPedidosDesdeStorage("pedidosMaika");
        if (!activo) return;
        setPedidos(data);
        return;
      }
      try {
        const remotos = await obtenerPedidosApi();
        if (!activo) return;
        setPedidos(remotos);
        localStorage.setItem("pedidosMaika", JSON.stringify(remotos));
      } catch {
        const data = cargarPedidosDesdeStorage("pedidosMaika");
        if (!activo) return;
        setPedidos(data);
      }
    };
    void hydrate();
    return () => {
      activo = false;
    };
  }, [syncKey]);

  return {
    pedidos,
    setPedidos
  };
}
