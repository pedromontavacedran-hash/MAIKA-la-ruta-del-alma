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
  duration,
  onClose
}: NotificacionProps) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const raw = mensaje ?? "";
  const mensajeLimpio = tipo === "exito" ? raw.replace(/^[\s✅✔]+/, "").trimStart() : raw;

  /** Errores suelen ser más largos y necesitan más tiempo de lectura (bloqueos, recuperación, etc.). */
  const dur = duration ?? (tipo === "error" ? 20000 : 10000);

  useEffect(() => {
    const timer = setTimeout(() => {
      onCloseRef.current();
    }, dur);

    return () => clearTimeout(timer);
  }, [dur]);

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