import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import type { BloqueHoroscopoSigno } from "@/data/horoscopoSemanalMaika";
import { ARCANOS_MAYORES_RWS, urlImagenArcanoMayorRws } from "@/data/tarotMayoresRws";
import { TarotCartaHoroscopo } from "@/components/horoscopos/TarotCartaHoroscopo";

const IMAGEN_CARTA_MODAL_MAIKA = "/tarot-maika/la-estrella-maika.png";

type Props = {
  signo: BloqueHoroscopoSigno;
  whatsappHref: string;
  onClose: () => void;
};

export function HoroscopoSignoModal({ signo, whatsappHref, onClose }: Props) {
  const cerrarRef = useRef<HTMLButtonElement>(null);

  const cartaImagenSrc = useMemo(() => {
    const indice = ARCANOS_MAYORES_RWS.findIndex((a) => a.nombreEs === signo.cartaTarot);
    if (indice >= 0) return urlImagenArcanoMayorRws(indice);
    return IMAGEN_CARTA_MODAL_MAIKA;
  }, [signo.cartaTarot]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    cerrarRef.current?.focus();
  }, [signo.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="horoscopo-signo-modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="horoscopo-signo-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="horoscopo-signo-modal-titulo"
      >
        <button
          ref={cerrarRef}
          type="button"
          className="horoscopo-signo-modal__cerrar"
          aria-label="Cerrar"
          onClick={onClose}
        >
          ×
        </button>

        <div className="horoscopo-signo-modal__body">
          <div className="horoscopo-signo-modal__carta">
            <p className="horoscopos-carta-epigrafe">Tu arcano esta semana</p>
            <p className="horoscopos-carta-nombre">{signo.cartaTarot}</p>
            <TarotCartaHoroscopo cartaTarot={signo.cartaTarot} soloFicha imagenSrc={cartaImagenSrc} />
          </div>
          <h3 id="horoscopo-signo-modal-titulo" className="horoscopos-signo-nombre">
            {signo.nombre}
          </h3>
          <div className="horoscopos-signo-card__contenido horoscopo-signo-modal__texto">
            <div className="horoscopos-etiqueta horoscopos-etiqueta--general">Energía general</div>
            <div className="horoscopos-bloque-general">
              {signo.general.map((linea, idx) => (
                <p key={idx}>{linea}</p>
              ))}
            </div>
            <div className="horoscopos-etiqueta">Amor</div>
            <p className="horoscopos-parrafo">{signo.amor}</p>
            <div className="horoscopos-etiqueta">Trabajo</div>
            <p className="horoscopos-parrafo">{signo.trabajo}</p>
          </div>
        </div>

        <div className="horoscopo-signo-modal__pie">
          <p className="horoscopo-signo-modal__cta-linea">Esta carta tiene un mensaje para ti.</p>
          <p className="horoscopo-signo-modal__cta-linea">Descubre qué significa en tu momento actual.</p>
          <a
            className="horoscopo-signo-modal__whatsapp"
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            Reserva tu tirada por WhatsApp
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
}
