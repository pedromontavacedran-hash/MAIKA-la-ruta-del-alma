import type { ReactNode } from "react";
import { evaluarPasswordBasica } from "../../utils/accesoRapidoUtils";

/** Requisitos visuales de contraseña (mínimo 8 + letras y números) para el acceso rápido. */
export default function RequisitosPasswordAccesoRapido({ password }: { password: string }): ReactNode {
  const estado = evaluarPasswordBasica(password || "");
  const tieneMinimo = estado.tieneMinimo;
  const tieneLetrasYNumeros = estado.tieneLetrasYNumeros;
  return (
    <div style={{ marginTop: 8, marginBottom: 2, fontSize: 12, lineHeight: 1.45 }}>
      <div style={{ color: tieneMinimo ? "rgba(126,205,143,0.95)" : "rgba(255,255,255,0.62)" }}>
        {tieneMinimo ? "✔" : "•"} Minimo 8 caracteres
      </div>
      <div style={{ color: tieneLetrasYNumeros ? "rgba(126,205,143,0.95)" : "rgba(255,255,255,0.62)" }}>
        {tieneLetrasYNumeros ? "✔" : "•"} Contiene letras y numeros
      </div>
    </div>
  );
}
