import type { CSSProperties, ReactNode } from "react";

type Props = {
  passwordNueva: string;
  passwordConfirmar: string;
  mostrarPasswordNueva: boolean;
  mostrarPasswordConfirmar: boolean;
  puedeGuardarPassword: boolean;
  passwordsCoinciden: boolean;
  inputStyle: CSSProperties;
  goldColor: string;
  requisitosPasswordNode: ReactNode;
  onPasswordNuevaChange: (value: string) => void;
  onPasswordConfirmarChange: (value: string) => void;
  onTogglePasswordNueva: () => void;
  onTogglePasswordConfirmar: () => void;
  onGuardarPassword: () => void;
  onVolverCodigo: () => void;
};

export default function AccesoRapidoPasswordPaso({
  inputStyle,
  goldColor,
  onGuardarPassword,
  onVolverCodigo
}: Props) {
  return (
    <>
      <div
        style={{
          ...inputStyle,
          height: "auto",
          padding: 14,
          lineHeight: 1.45,
          color: "rgba(255,255,255,0.86)"
        }}
      >
        Te enviaremos un enlace seguro a tu correo para crear la contraseña. Por seguridad, la contraseña se define desde ese enlace.
      </div>
      <button
        type="button"
        onClick={onGuardarPassword}
        style={{
          width: "100%",
          marginTop: 10,
          padding: 12,
          borderRadius: 10,
          border: "none",
          background: goldColor,
          color: "#1b1745",
          fontWeight: "bold",
          cursor: "pointer",
          opacity: 1
        }}
      >
        Enviar enlace seguro
      </button>
      <button
        type="button"
        onClick={onVolverCodigo}
        style={{ width: "100%", marginTop: 10, padding: 12, borderRadius: 10, border: `1px solid ${goldColor}`, background: "transparent", color: goldColor, fontWeight: "bold", cursor: "pointer" }}
      >
        ← Volver al código
      </button>
    </>
  );
}
