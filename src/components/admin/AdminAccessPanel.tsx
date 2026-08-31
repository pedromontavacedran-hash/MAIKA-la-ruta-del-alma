import { useState } from "react";

type Props = {
  claveAdmin: string;
  bgColor: string;
  goldColor: string;
  setClaveAdmin: (v: string) => void;
  onAcceder: () => void;
  bloqueado?: boolean;
  mensajeError?: string;
};

export default function AdminAccessPanel({
  claveAdmin,
  bgColor,
  goldColor,
  setClaveAdmin,
  onAcceder,
  bloqueado = false,
  mensajeError
}: Props) {
  const [mostrarClave, setMostrarClave] = useState(false);
  const eyeBtnStyle = {
    position: "absolute" as const,
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 20,
    padding: 4,
    color: goldColor
  };

  return (
    <div style={{ background: bgColor, border: `3px solid ${goldColor}`, borderRadius: 24, padding: 34, maxWidth: 620, margin: "0 auto" }}>
      <h3 style={{ color: goldColor, textAlign: "center", marginBottom: 16, fontSize: 30 }}>🔐 Acceso</h3>
      <div style={{ position: "relative", marginBottom: 14 }}>
        <input
          id="maika-admin-clave-local"
          name="maika-admin-clave-local"
          type={mostrarClave ? "text" : "password"}
          placeholder="Clave"
          value={claveAdmin}
          onChange={(e) => setClaveAdmin(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !bloqueado) onAcceder();
          }}
          disabled={bloqueado}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "16px 48px 16px 16px",
            borderRadius: 14,
            border: `2px solid ${goldColor}`,
            background: bgColor,
            color: goldColor,
            fontSize: 22,
            opacity: bloqueado ? 0.58 : 1,
            cursor: bloqueado ? "not-allowed" : "text"
          }}
          autoFocus
          autoComplete="new-password"
          autoCapitalize="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={() => setMostrarClave((v) => !v)}
          disabled={bloqueado}
          style={eyeBtnStyle}
          title={mostrarClave ? "Ocultar contraseña" : "Ver contraseña"}
          aria-label={mostrarClave ? "Ocultar contraseña" : "Ver contraseña"}
        >
          {mostrarClave ? "🙈" : "👁"}
        </button>
      </div>
      {mensajeError ? (
        <p style={{ margin: "0 0 14px", color: "#ff8a8a", fontSize: 14, textAlign: "center" }}>
          {mensajeError}
        </p>
      ) : null}
      <button
        className="btn-azul-categoria"
        onClick={onAcceder}
        disabled={bloqueado}
        style={{
          width: "100%",
          padding: "16px",
          borderRadius: 14,
          cursor: bloqueado ? "not-allowed" : "pointer",
          fontWeight: "bold",
          fontSize: 22,
          opacity: bloqueado ? 0.58 : 1
        }}
      >
        Acceder
      </button>
    </div>
  );
}
