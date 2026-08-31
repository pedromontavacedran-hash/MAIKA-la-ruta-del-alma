import type { CSSProperties } from "react";
import { THEME } from "../config";

export const inputStyle = {
  width: "100%" as const,
  padding: 12,
  marginBottom: 10,
  borderRadius: 10,
  border: `2px solid ${THEME.goldMain}`,
  background: THEME.bg,
  color: THEME.text,
  fontSize: 18,
  outline: "none"
};

/** Botón principal dorado del checkout (gradiente + sombra). */
export const checkoutPrimaryButtonStyle: CSSProperties = {
  background: "linear-gradient(135deg, #d4af37, #f1d27a)",
  color: "#000",
  boxShadow: "0 4px 15px rgba(212, 175, 55, 0.3)",
  border: "none",
  fontWeight: "bold"
};

/** Misma base que el CTA principal sin box-shadow (la clase `.checkout-boton-finalizar` define sombra y hover). */
export const checkoutPrimaryButtonStyleNoShadow: CSSProperties = {
  background: "linear-gradient(135deg, #d4af37, #f1d27a)",
  color: "#000",
  border: "none",
  fontWeight: "bold"
};

/** Inputs del modal de checkout: contraste sobre fondo oscuro. */
export const checkoutInputStyle: CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  marginBottom: 8,
  borderRadius: 9,
  border: "1px solid rgba(212, 175, 55, 0.25)",
  background: "rgba(255, 255, 255, 0.04)",
  color: "#fff",
  fontSize: 14,
  outline: "none"
};
