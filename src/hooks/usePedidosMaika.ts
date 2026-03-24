import { useEffect, useState } from "react";
import type { Pedido } from "../types";
import { cargarPedidosDesdeStorage } from "../utils/storageLoaders";
import { obtenerPedidosApi } from "../services/apiPedidos";

export function usePedidosMaika() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  useEffect(() => {
    let activo = true;
    const hydrate = async () => {
      const hasToken = !!localStorage.getItem("token");
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
  }, []);

  return {
    pedidos,
    setPedidos
  };
}
