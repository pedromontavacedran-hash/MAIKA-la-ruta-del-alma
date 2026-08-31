export type MaikaSpacingMode = "default" | "compact" | "airy";

const MAIKA_SPACING_CLASSES = [
  "maika-spacing-compact",
  "maika-spacing-airy"
] as const;

/**
 * Aplica el preset de espaciado global del hero en `document.documentElement`.
 * - default: sin clase extra (usa variables base de `:root`)
 * - compact: clase `maika-spacing-compact`
 * - airy: clase `maika-spacing-airy`
 */
export function setMaikaSpacing(mode: MaikaSpacingMode): void {
  const root = document.documentElement;
  root.classList.remove(...MAIKA_SPACING_CLASSES);

  if (mode === "compact") {
    root.classList.add("maika-spacing-compact");
  } else if (mode === "airy") {
    root.classList.add("maika-spacing-airy");
  }
}
