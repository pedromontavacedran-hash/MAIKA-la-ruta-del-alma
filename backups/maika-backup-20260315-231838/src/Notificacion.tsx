import { useEffect } from "react";
import "./Notificacion.css";

interface NotificacionProps {
  mensaje: string;
  tipo?: "normal" | "exito" | "error";
  duration?: number;
  onClose: () => void;
}

export default function Notificacion({ 
  mensaje, 
  tipo = "normal", 
  duration = 3000, 
  onClose 
}: NotificacionProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`notificacion ${tipo}`}>
      {mensaje}
    </div>
  );
}