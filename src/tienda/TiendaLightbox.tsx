import { createPortal } from "react-dom";
import BotonCerrar from "../components/BotonCerrar";
import type { ImagenLightbox } from "./tiendaHelpers";

export function TiendaLightbox({ imagen, onClose, ampliar = false }: { imagen: ImagenLightbox | null; onClose: () => void; ampliar?: boolean }) {
  if (!imagen) return null;
  return createPortal(
    <div
      className="tienda-lightbox-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Imagen ampliada"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10100,
        background: "rgba(0,0,0,0.9)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px 24px",
        boxSizing: "border-box",
        gap: 12,
        cursor: "pointer",
      }}
    >
      <BotonCerrar
        onClick={(e) => { e?.stopPropagation(); onClose(); }}
        ariaLabel="Cerrar"
        title="Cerrar"
      />
      <img
        src={imagen.src}
        alt={imagen.alt}
        decoding="async"
        onClick={(e) => e.stopPropagation()}
        style={{ width: ampliar ? "min(1400px, 100%)" : undefined, height: ampliar ? "85dvh" : undefined, maxWidth: "100%", maxHeight: "min(85dvh, calc(100dvh - 120px))", minHeight: 0, objectFit: "contain", borderRadius: 12 }}
      />
      {imagen.pie ? (
        <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "1rem", margin: 0, textAlign: "center", flexShrink: 0, maxWidth: "min(680px, 90vw)" }}>
          {imagen.pie}
        </p>
      ) : null}
      <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9rem", margin: 0, textAlign: "center", flexShrink: 0 }}>
        Clic fuera o tecla Escape para cerrar
      </p>
    </div>,
    document.body
  );
}
