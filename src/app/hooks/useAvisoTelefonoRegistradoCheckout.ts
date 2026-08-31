import { useEffect, useRef, type MutableRefObject } from "react";
import type { Usuario } from "../../types";
import type { MaikaUsuarioLS } from "../../utils/maikaUsuarios";
import { normalizarTelefonoES9 } from "../../utils/telefono";

type AvisoTelefono = { encontrado: boolean; texto: string; origen?: "local" } | null;

/**
 * Aviso “teléfono ya registrado” en checkout (sin autorrellenar) y reset al cambiar paso / sesión.
 * Misma lógica y dependencias que antes en App.tsx.
 */
export function useAvisoTelefonoRegistradoCheckout(p: {
  telefonoCliente: string;
  usuario: Usuario | null;
  findMaikaUsuarioPorTel9: (tel9: string) => MaikaUsuarioLS | null;
  setAvisoTelefonoCheckout: (v: AvisoTelefono) => void;
  setCalleCheckoutResetSignal: (updater: (n: number) => number) => void;
  ultimoTelefonoRecuperadoRef: MutableRefObject<string | null>;
  formPedidoAbierto: boolean;
  pasoFinalizarCompra: "datos" | "confirmarDireccion" | "pago";
}) {
  const {
    telefonoCliente,
    usuario,
    findMaikaUsuarioPorTel9,
    setAvisoTelefonoCheckout,
    setCalleCheckoutResetSignal,
    ultimoTelefonoRecuperadoRef,
    formPedidoAbierto,
    pasoFinalizarCompra
  } = p;

  const findRef = useRef(findMaikaUsuarioPorTel9);
  findRef.current = findMaikaUsuarioPorTel9;

  useEffect(() => {
    const tel9 = normalizarTelefonoES9(telefonoCliente || "");
    if (!/^[67]\d{8}$/.test(tel9)) {
      setAvisoTelefonoCheckout(null);
      return;
    }
    if (ultimoTelefonoRecuperadoRef.current === tel9) return;

    if (usuario) {
      setAvisoTelefonoCheckout(null);
      ultimoTelefonoRecuperadoRef.current = tel9;
      return;
    }

    const encontrado = findRef.current(tel9);
    if (!encontrado) {
      ultimoTelefonoRecuperadoRef.current = tel9;
      setAvisoTelefonoCheckout(null);
      return;
    }

    ultimoTelefonoRecuperadoRef.current = tel9;
    setAvisoTelefonoCheckout({
      encontrado: true,
      origen: "local",
      texto: "Este teléfono tiene datos guardados en este dispositivo. Por privacidad, inicia sesión para usarlos."
    });
    setCalleCheckoutResetSignal((n) => n + 1);
  }, [telefonoCliente, usuario]);

  useEffect(() => {
    if (!formPedidoAbierto || pasoFinalizarCompra !== "datos") setAvisoTelefonoCheckout(null);
  }, [pasoFinalizarCompra, formPedidoAbierto]);

  useEffect(() => {
    if (usuario) {
      setAvisoTelefonoCheckout(null);
    } else {
      ultimoTelefonoRecuperadoRef.current = null;
    }
  }, [usuario]);
}
