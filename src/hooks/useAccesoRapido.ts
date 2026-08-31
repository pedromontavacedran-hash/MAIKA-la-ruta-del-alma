import { useCallback } from "react";
import type { PerfilCompraRapida, ItemCarrito } from "../types";
import { validarCompraRapida } from "../utils/pedidos/validarCompraRapida";

type Params = {
  perfil: PerfilCompraRapida | null;
  items: ItemCarrito[];
  metodoPagoValido: boolean;
  crearPedidoRapido: () => Promise<void>;
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

export function useAccesoRapido({
  perfil,
  items,
  metodoPagoValido,
  crearPedidoRapido,
  onSuccess,
  onError
}: Params) {
  const ejecutarCompraRapida = useCallback(async () => {
    const res = validarCompraRapida({
      perfil,
      items,
      metodoPagoValido
    });
    if (res.ok === false) {
      onError?.(res.message);
      return;
    }

    try {
      await crearPedidoRapido();
      onSuccess?.();
    } catch {
      onError?.("Error en compra rápida");
    }
  }, [perfil, items, metodoPagoValido, crearPedidoRapido, onSuccess, onError]);

  return { ejecutarCompraRapida };
}
