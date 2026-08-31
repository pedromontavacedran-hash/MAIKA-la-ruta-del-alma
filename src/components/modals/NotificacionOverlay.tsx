import Notificacion from "../../Notificacion";
import type { NotificacionMaikaEstado } from "../../hooks/useNotificacion";

type Props = {
  notificacion: NotificacionMaikaEstado | null;
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
      <Notificacion
        key={notificacion.avisoKey}
        mensaje={notificacion.mensaje}
        tipo={notificacion.tipo}
        onClose={onClose}
      />
    </div>
  );
}
