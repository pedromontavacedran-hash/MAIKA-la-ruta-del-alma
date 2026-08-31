export default function RequisitosPasswordHint({ password, compact }: { password: string; compact?: boolean }) {
  const tieneMinimo = (password || "").length >= 8;
  const tieneNumero = /\d/.test(password || "");
  if (compact) {
    return (
      <div
        style={{
          marginTop: -2,
          marginBottom: 6,
          fontSize: 11,
          lineHeight: 1.35,
          color: "rgba(255,255,255,0.72)",
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 12px",
          alignItems: "center"
        }}
      >
        <span>Min. 8 caracteres</span>
        <span style={{ color: tieneMinimo ? "rgba(126,205,143,0.95)" : "rgba(255,255,255,0.5)" }}>{tieneMinimo ? "✔" : "○"} Longitud</span>
        <span style={{ color: tieneNumero ? "rgba(126,205,143,0.95)" : "rgba(255,255,255,0.5)" }}>{tieneNumero ? "✔" : "○"} Numero</span>
      </div>
    );
  }
  return (
    <div style={{ marginTop: -2, marginBottom: 10, fontSize: 12, lineHeight: 1.45 }}>
      <div style={{ color: "rgba(255,255,255,0.78)" }}>Minimo 8 caracteres</div>
      <div style={{ color: tieneMinimo ? "rgba(126,205,143,0.95)" : "rgba(255,255,255,0.62)" }}>
        {tieneMinimo ? "✔" : "•"} Longitud correcta
      </div>
      <div style={{ color: tieneNumero ? "rgba(126,205,143,0.95)" : "rgba(255,255,255,0.62)" }}>
        {tieneNumero ? "✔" : "•"} Contiene numero
      </div>
    </div>
  );
}
