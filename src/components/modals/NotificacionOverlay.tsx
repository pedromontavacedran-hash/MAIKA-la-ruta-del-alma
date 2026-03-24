import Notificacion from "../../Notificacion";

type NotificacionData = {
  mensaje: string;
  tipo?: "normal" | "exito" | "error";
};

type Props = {
  notificacion: NotificacionData | null;
  onClose: () => void;
};

export default function NotificacionOverlay({ notificacion, onClose }: Props) {
  if (!notificacion) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 999999,
        width: "90%",
        maxWidth: 400
      }}
    >
      <Notificacion mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={onClose} />
    </div>
  );
}
