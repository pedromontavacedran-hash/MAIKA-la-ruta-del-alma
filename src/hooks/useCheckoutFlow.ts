import { useCallback, useRef, useState } from "react";
import type { EnviarPedidoWhatsAppOverride } from "../checkout/procesarCheckout.types";
import {
  construirOrquestarEnvioPedidoWhatsAppDeps,
  type ConstruirOrquestarEnvioPedidoWhatsAppInput
} from "../checkout/ui/construirOrquestarEnvioPedidoWhatsAppDeps";
import { orquestarCheckout, type EjecutarCheckoutMaika } from "../services/checkout/orquestarCheckout";

/** Evita que el botón de pago parpadee si la API responde muy rápido (mejor percepción de “comprobando”). */
const PROCESANDO_PAGO_MIN_MS = 950;

type Params = {
  ejecutarCheckout: EjecutarCheckoutMaika;
  /** Objeto que App reconstruye cada render; se lee vía ref para no fijar `useCallback` a decenas de campos. */
  depsUi: ConstruirOrquestarEnvioPedidoWhatsAppInput;
};

export function useCheckoutFlow({ ejecutarCheckout, depsUi }: Params) {
  const depsRef = useRef(depsUi);
  depsRef.current = depsUi;

  const [procesandoPago, setProcesandoPago] = useState(false);

  const enviarPedidoWhatsApp = useCallback(
    async (override?: EnviarPedidoWhatsAppOverride) => {
      depsRef.current.setMensajeErrorCheckoutPago?.(null);
      setProcesandoPago(true);
      const t0 = Date.now();
      try {
        await orquestarCheckout(
          ejecutarCheckout,
          override,
          construirOrquestarEnvioPedidoWhatsAppDeps(depsRef.current)
        );
      } finally {
        const restante = PROCESANDO_PAGO_MIN_MS - (Date.now() - t0);
        if (restante > 0) {
          await new Promise((r) => setTimeout(r, restante));
        }
        setProcesandoPago(false);
      }
    },
    [ejecutarCheckout]
  );

  return { procesandoPago, enviarPedidoWhatsApp };
}
