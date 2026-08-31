import type { CSSProperties } from "react";

type Props = {
  codigo: string;
  bloqueado: boolean;
  estadoVerificacion: "idle" | "ok" | "error";
  intentosRestantes: number;
  intentosUsados: number;
  textoCuentaAtrasBloqueo: string;
  inputStyle: CSSProperties;
  goldColor: string;
  onCodigoChange: (value: string) => void;
  onVerificar: () => void;
};

export default function AccesoRapidoVerificacionPaso({
  codigo,
  bloqueado,
  estadoVerificacion,
  intentosRestantes,
  intentosUsados,
  textoCuentaAtrasBloqueo,
  inputStyle,
  goldColor,
  onCodigoChange,
  onVerificar
}: Props) {
  return (
    <>
      <input
        type="text"
        value={codigo}
        onChange={(e) => onCodigoChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          if (!bloqueado) onVerificar();
        }}
        placeholder="Código del último pedido"
        style={{ ...inputStyle, opacity: bloqueado ? 0.7 : 1, textTransform: "uppercase" }}
        disabled={bloqueado}
      />
      {bloqueado ? (
        <div style={{ margin: "8px 0 0", display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255, 183, 183, 0.95)" }}>
            Demasiados intentos.
          </p>
          <button
            type="button"
            disabled
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: goldColor,
              padding: "4px 10px",
              borderRadius: 8,
              border: "1px solid rgba(201, 162, 74, 0.55)",
              background: "rgba(201, 162, 74, 0.18)",
              cursor: "default"
            }}
          >
            {textoCuentaAtrasBloqueo}
          </button>
        </div>
      ) : (
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 12,
            color:
              estadoVerificacion === "ok"
                ? "rgba(126,205,143,0.95)"
                : estadoVerificacion === "error"
                  ? "rgba(255, 183, 183, 0.95)"
                  : "rgba(255,255,255,0.72)"
          }}
        >
          {estadoVerificacion === "ok"
            ? "✅ Identidad verificada"
            : (estadoVerificacion === "error" && intentosUsados > 0)
              ? `❌ No se pudo verificar la identidad. Intentos restantes: ${intentosRestantes}`
              : `Intentos disponibles: ${intentosRestantes}`}
        </p>
      )}
      <button
        type="button"
        disabled={bloqueado}
        onClick={onVerificar}
        style={{
          width: "100%",
          marginTop: 12,
          padding: 12,
          borderRadius: 10,
          border: "none",
          background: bloqueado ? "rgba(201, 162, 74, 0.35)" : goldColor,
          color: bloqueado ? "rgba(27, 23, 69, 0.75)" : "#1b1745",
          fontWeight: "bold",
          cursor: bloqueado ? "default" : "pointer",
          opacity: bloqueado ? 0.5 : 1
        }}
      >
        {bloqueado ? "Bloqueado temporalmente" : "Verificar identidad"}
      </button>
    </>
  );
}
