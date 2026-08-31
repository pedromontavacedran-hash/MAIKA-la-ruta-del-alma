import { useEffect, type Dispatch, type SetStateAction } from "react";
import { QUICK_CHECKOUT_KEY, RECORDAR_DATOS_INVITADO_KEY } from "../../config";
import type { PerfilCompraRapida, Usuario } from "../../types";

/** Sincroniza el toggle “recordar datos” con localStorage y limpia caché de invitado si se desactiva. */
export function useRecordarDatosInvitadoPersistence(p: {
  recordarDatosInvitado: boolean;
  usuario: Usuario | null;
  setPerfilCompraRapida: Dispatch<SetStateAction<PerfilCompraRapida | null>>;
}) {
  const { recordarDatosInvitado, usuario, setPerfilCompraRapida } = p;

  useEffect(() => {
    localStorage.setItem(RECORDAR_DATOS_INVITADO_KEY, recordarDatosInvitado ? "1" : "0");
    if (!recordarDatosInvitado) {
      localStorage.removeItem("clienteMaika");
      localStorage.removeItem(QUICK_CHECKOUT_KEY);
      if (!usuario) setPerfilCompraRapida(null);
    }
  }, [recordarDatosInvitado, usuario]);
}
