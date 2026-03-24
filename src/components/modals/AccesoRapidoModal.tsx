import type { ReactNode } from "react";

type Props = {
  visible: boolean;
  onClose: () => void;
  bgColor: string;
  goldColor: string;
  subtitulo: string;
  children: ReactNode;
};

export default function AccesoRapidoModal({
  visible,
  onClose,
  bgColor,
  goldColor,
  subtitulo,
  children
}: Props) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(5px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 12100
      }}
    >
      <div
        style={{
          position: "relative",
          background: bgColor,
          border: `2px solid ${goldColor}`,
          borderRadius: 18,
          padding: "22px 18px",
          width: "92%",
          maxWidth: 430,
          color: "white"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            position: "absolute",
            top: 8,
            right: 10,
            background: "transparent",
            border: "none",
            color: goldColor,
            fontSize: 22,
            cursor: "pointer"
          }}
        >
          ×
        </button>
        <h3 style={{ color: goldColor, textAlign: "center", margin: "0 0 8px" }}>
          Acceso rápido
        </h3>
        <p
          style={{
            margin: "0 0 14px",
            fontSize: 12,
            color: "rgba(255,255,255,0.68)",
            textAlign: "center",
            lineHeight: 1.45
          }}
        >
          {subtitulo}
        </p>
        {children}
      </div>
    </div>
  );
}
