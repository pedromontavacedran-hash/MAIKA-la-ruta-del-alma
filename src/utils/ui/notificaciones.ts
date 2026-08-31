type TipoNotificacion = "normal" | "exito" | "error";

type MostrarNotificacion = (mensaje: string, tipo: TipoNotificacion) => void;

export function notificarError(mostrarNotificacion: MostrarNotificacion, mensaje: string) {
  mostrarNotificacion(mensaje, "error");
}

export function notificarExito(mostrarNotificacion: MostrarNotificacion, mensaje: string) {
  mostrarNotificacion(mensaje, "exito");
}
