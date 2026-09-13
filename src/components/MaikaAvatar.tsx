import { useEffect, useRef } from "react";
import { subscribeToSpeechAvatar } from "../utils/speechAvatarBus";
import "../Sueno.css";

/**
 * Presencia estática de Maika: nada de vídeo ni labios, solo CSS. Mientras el audio de narración
 * suena (eventos reales de `speechAvatarBus`, no una estimación), el contenedor recibe `maika-speaking`
 * y la respiración/halo de Sueno.css se activa sobre la propia foto (que ya trae su marco dorado,
 * sin anillo extra superpuesto).
 */
export function MaikaAvatar({ size = "sm" }: { size?: "sm" | "lg" }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const onStart = () => root?.classList.add("maika-speaking");
    const onEnd = () => root?.classList.remove("maika-speaking");
    const unsubscribe = subscribeToSpeechAvatar(onStart, () => {}, onEnd);
    return unsubscribe;
  }, []);

  return (
    <div
      ref={rootRef}
      className={size === "lg" ? "maika-avatar maika-avatar--lg" : "maika-avatar"}
      aria-label="Maika"
    >
      <img
        className="maika-avatar-img"
        src="/maika-avatar.jpg"
        alt="Maika"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}
