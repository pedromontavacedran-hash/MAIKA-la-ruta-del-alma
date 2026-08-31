import { useEffect, useCallback, type Dispatch, type SetStateAction } from "react";
import type { AuthForm, Cliente, EditUsuarioForm } from "../../types";
import { obtenerDatosCodigoPostal } from "../../utils/codigoPostal";
import { aplicarDatosCpDetectados } from "../../utils/direccionUtils";
import { PROVINCIA_POR_PREFIJO_CP } from "../../utils/appCoreUtils";

/**
 * Autocompletar población/provincia al tener CP de 5 dígitos (registro, checkout, edición usuario).
 */
export function useAutocompletarCodigoPostalEffects(p: {
  formAuthCp: string;
  datosClienteCp: string;
  editUsuarioForm: EditUsuarioForm | null;
  editUsuarioFormCp: string | undefined;
  setFormAuth: Dispatch<SetStateAction<AuthForm>>;
  setEditUsuarioForm: Dispatch<SetStateAction<EditUsuarioForm | null>>;
  setDatosCliente: Dispatch<SetStateAction<Cliente>>;
}) {
  const { setFormAuth, setEditUsuarioForm, setDatosCliente } = p;

  const autocompletarPorCodigoPostal = useCallback(
    async (cp: string, destino: "registro" | "checkout" | "editUsuario") => {
      const datos = await obtenerDatosCodigoPostal(cp, PROVINCIA_POR_PREFIJO_CP);
      if (!datos) return;

      if (destino === "registro") {
        setFormAuth((prev) => aplicarDatosCpDetectados(prev, cp, datos));
        return;
      }

      if (destino === "editUsuario") {
        setEditUsuarioForm((prev) => (prev ? aplicarDatosCpDetectados(prev, cp, datos) : prev));
        return;
      }

      setDatosCliente((prev) => aplicarDatosCpDetectados<Cliente>(prev, cp, datos));
    },
    [setFormAuth, setEditUsuarioForm, setDatosCliente]
  );

  useEffect(() => {
    if (/^\d{5}$/.test(p.formAuthCp)) {
      void autocompletarPorCodigoPostal(p.formAuthCp, "registro");
    }
  }, [p.formAuthCp, autocompletarPorCodigoPostal]);

  useEffect(() => {
    const cpCheckout = String(p.datosClienteCp || "");
    if (/^\d{5}$/.test(cpCheckout)) {
      void autocompletarPorCodigoPostal(cpCheckout, "checkout");
    }
  }, [p.datosClienteCp, autocompletarPorCodigoPostal]);

  useEffect(() => {
    const cpEdit = p.editUsuarioFormCp?.trim() ?? "";
    if (p.editUsuarioForm && /^\d{5}$/.test(cpEdit)) {
      void autocompletarPorCodigoPostal(cpEdit, "editUsuario");
    }
  }, [p.editUsuarioFormCp, p.editUsuarioForm, autocompletarPorCodigoPostal]);
}
