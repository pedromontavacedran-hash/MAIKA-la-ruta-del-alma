import { useEffect, useRef } from "react";
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
  duration = 10000, 
  onClose 
}: NotificacionProps) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const raw = mensaje ?? "";
  const mensajeLimpio = tipo === "exito" ? raw.replace(/^[\s✅✔]+/, "").trimStart() : raw;

  useEffect(() => {
    const timer = setTimeout(() => {
      onCloseRef.current();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <div className={`notificacion ${tipo}`}>
      {tipo === "exito" ? (
        <span className="notificacion__marca-exito" aria-hidden>
          ✓
        </span>
      ) : null}
      {mensajeLimpio}
    </div>
  );
}