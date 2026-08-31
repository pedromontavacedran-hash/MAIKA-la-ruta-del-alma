import type { CSSProperties } from "react";

type Props = {
  codigoIngresado: string;
  enviando: boolean;
  codigoBloqueado: boolean;
  codigoExpirado: boolean;
  reenvioEn: number;
  inputStyle: CSSProperties;
  goldColor: string;
  onCodigoChange: (value: string) => void;
  onVerificarCodigo: () => void;
  onReenviarCodigo: () => void;
  onVolver: () => void;
};

export default function AccesoRapidoCodigoPaso({
  codigoIngresado,
  enviando,
  codigoBloqueado,
  codigoExpirado,
  reenvioEn,
  inputStyle,
  goldColor,
  onCodigoChange,
  onVerificarCodigo,
  onReenviarCodigo,
  onVolver
}: Props) {
  return (
    <>
      <input
        type="text"
        value={codigoIngresado}
        onChange={(e) => onCodigoChange(e.target.value)}
        placeholder="Código de 6 dígitos"
        inputMode="numeric"
        style={inputStyle}
      />
      <button
        type="button"
        disabled={enviando || codigoBloqueado || codigoExpirado}
        onClick={onVerificarCodigo}
        style={{ width: "100%", padding: 12, borderRadius: 10, border: "none", background: goldColor, color: "#1b1745", fontWeight: "bold", cursor: "pointer" }}
      >
        Verificar código
      </button>
      <button
        type="button"
        disabled={enviando || reenvioEn > 0}
        onClick={onReenviarCodigo}
        style={{
          width: "100%",
          marginTop: 10,
          padding: 12,
          borderRadius: 10,
          border: `1px solid ${goldColor}`,
          background: reenvioEn > 0 ? "#555" : "transparent",
          color: goldColor,
          fontWeight: "bold",
          cursor: enviando || reenvioEn > 0 ? "not-allowed" : "pointer",
          opacity: enviando || reenvioEn > 0 ? 0.85 : 1
        }}
      >
        {enviando
          ? "Enviando..."
          : reenvioEn > 0
            ? `Reenviar en ${reenvioEn}s`
            : "Reenviar código"}
      </button>
      <button
        type="button"
        onClick={onVolver}
        style={{ width: "100%", marginTop: 10, padding: 12, borderRadius: 10, border: `1px solid ${goldColor}`, background: "transparent", color: goldColor, fontWeight: "bold", cursor: "pointer" }}
      >
        ← Volver
      </button>
    </>
  );
}
