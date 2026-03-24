export type ResetAccesoRapidoActions = {
  setAccesoRapidoPaso: (v: 1 | 2 | 3 | 4) => void;
  setAccesoRapidoCodigoEnviado: (v: string) => void;
  setAccesoRapidoCodigoIngresado: (v: string) => void;
  setAccesoRapidoCodigoUltimoPedido: (v: string) => void;
  setAccesoRapidoIntentosSeguridad: (v: number) => void;
  setAccesoRapidoEstadoVerificacionSeguridad: (v: "idle" | "ok" | "error") => void;
  setAccesoRapidoSeguridadUiBloqueado: (v: boolean) => void;
  setAccesoRapidoCodigoExpiraEnMs: (v: number | null) => void;
  setAccesoRapidoIntentosCodigo: (v: number) => void;
  setAccesoRapidoCodigoBloqueado: (v: boolean) => void;
  setAccesoRapidoReenvioEn: (v: number) => void;
  setAccesoRapidoEmailVerificado: (v: string) => void;
  setAccesoRapidoPasswordNueva: (v: string) => void;
  setAccesoRapidoPasswordConfirmar: (v: string) => void;
  setAccesoRapidoMostrarPasswordNueva: (v: boolean) => void;
  setAccesoRapidoMostrarPasswordConfirmar: (v: boolean) => void;
  setErrorCodigo: (v: boolean) => void;
};

export function resetAccesoRapidoCheckoutState(actions: ResetAccesoRapidoActions) {
  actions.setAccesoRapidoPaso(1);
  actions.setAccesoRapidoCodigoEnviado("");
  actions.setAccesoRapidoCodigoIngresado("");
  actions.setAccesoRapidoCodigoUltimoPedido("");
  actions.setAccesoRapidoIntentosSeguridad(0);
  actions.setAccesoRapidoEstadoVerificacionSeguridad("idle");
  actions.setAccesoRapidoSeguridadUiBloqueado(false);
  actions.setAccesoRapidoCodigoExpiraEnMs(null);
  actions.setAccesoRapidoIntentosCodigo(0);
  actions.setAccesoRapidoCodigoBloqueado(false);
  actions.setAccesoRapidoReenvioEn(0);
  actions.setAccesoRapidoEmailVerificado("");
  actions.setAccesoRapidoPasswordNueva("");
  actions.setAccesoRapidoPasswordConfirmar("");
  actions.setAccesoRapidoMostrarPasswordNueva(false);
  actions.setAccesoRapidoMostrarPasswordConfirmar(false);
  actions.setErrorCodigo(false);
}
