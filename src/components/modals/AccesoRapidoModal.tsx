import type { ReactNode } from "react";
import ModalBase from "../ModalBase";

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
  return (
    <ModalBase
      abierto={visible}
      onClose={onClose}
      zIndex={12100}
      maxWidth="430px"
      classNameOverlay="modal-overlay--flujo-checkout"
      cerrarAlPulsarFondo={false}
      styleCard={{
        background: bgColor,
        border: `2px solid ${goldColor}`,
        borderRadius: 18,
        padding: "16px 16px 14px",
        width: "92%",
        color: "white",
        maxHeight: "min(86vh, 680px)",
        overflowY: "auto"
      }}
    >
      <h3 style={{ color: goldColor, textAlign: "center", margin: "0 0 6px" }}>
        Acceso rápido
      </h3>
      <p
        style={{
          margin: "0 0 10px",
          fontSize: 12,
          color: "rgba(255,255,255,0.68)",
          textAlign: "center",
          lineHeight: 1.45
        }}
      >
        {subtitulo}
      </p>
      {children}
    </ModalBase>
  );
}
