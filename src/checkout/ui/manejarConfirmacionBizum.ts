import type { Dispatch, SetStateAction } from "react";
import type { ResultadoCheckout } from "../procesarCheckout.types";

export type ResultadoCheckoutBizumConfirmacion = Extract<ResultadoCheckout, { tipo: "bizum_confirmacion" }>;

export type ManejarConfirmacionBizumDeps = {
  setConfirmacionBizumOtroNumeroAbierto: Dispatch<SetStateAction<boolean>>;
};

export function manejarConfirmacionBizum(
  _resultado: ResultadoCheckoutBizumConfirmacion,
  deps: ManejarConfirmacionBizumDeps
): void {
  deps.setConfirmacionBizumOtroNumeroAbierto(true);
}
