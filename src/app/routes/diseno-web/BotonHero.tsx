import { THEME } from "../../../config";
import {
  HERO_CTA_OFFSET_MAX,
  HERO_CTA_OFFSET_MIN
} from "../../../utils/heroBannerConfig";

export type BotonHeroProps = {
  /** px; mismo valor que persiste en `maikaHeroBannerAjuste` (`ctaOffset`). */
  ctaOffset: number;
  onCtaOffsetChange: (px: number) => void;
};

/**
 * Apartado dedicado del CTA «Explorar tienda» (desplazamiento vertical vía `--hero-cta-offset`).
 */
export default function BotonHero({ ctaOffset, onCtaOffsetChange }: BotonHeroProps) {
  return (
    <div>
      <h2 style={{ margin: "0 0 8px", color: "rgba(250, 232, 170, 0.95)", fontSize: 18, fontWeight: 800 }}>
        Botón (CTA)
      </h2>
      <p style={{ margin: "0 0 12px", color: "rgba(255,255,255,0.72)", fontSize: 12, lineHeight: 1.45 }}>
        Posición vertical del botón «Explorar tienda» en el hero (se guarda en este navegador, igual que zoom e imagen).
      </p>
      <label style={{ color: "rgba(255,255,255,0.82)", fontSize: 11, display: "grid", gap: 4 }}>
        Posición botón (vertical): {ctaOffset}px (subir: valores negativos; bajar: positivos)
        <input
          type="range"
          min={HERO_CTA_OFFSET_MIN}
          max={HERO_CTA_OFFSET_MAX}
          step={1}
          value={ctaOffset}
          onChange={(e) => onCtaOffsetChange(Number(e.target.value))}
        />
      </label>
      <p style={{ margin: "10px 0 0", color: THEME.goldMain, fontSize: 11, lineHeight: 1.35, opacity: 0.9 }}>
        El inicio aplica <code style={{ fontSize: 10 }}>margin-top: var(--hero-cta-offset)</code> al botón.
      </p>
    </div>
  );
}
