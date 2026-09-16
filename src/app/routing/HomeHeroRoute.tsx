import HeroParticles from "../../components/HeroParticles";
import MaikaLogoImg from "../../components/MaikaLogoImg";
import type { HeroBannerAjuste } from "../../utils/heroBannerConfig";
import type { HeroLogoConfig } from "../../utils/heroLogoConfig";

type HomeHeroRouteProps = {
  bannerSrc: string;
  bannerAjuste: HeroBannerAjuste;
  visualTick: number;
  logoCfg: HeroLogoConfig;
  portalTiendaActivo: boolean;
  onExplorarTienda: () => void;
};

/** Inicio visual aislado de la tabla de rutas: no conoce sesión, catálogo ni estado del checkout. */
export function HomeHeroRoute({
  bannerSrc,
  bannerAjuste,
  visualTick,
  logoCfg,
  portalTiendaActivo,
  onExplorarTienda
}: HomeHeroRouteProps) {
  return (
    <>
      <section
        className={`hero-section${portalTiendaActivo ? " hero-section--portal-activo" : ""}`}
        data-maika="hero-main"
        aria-label="Banner principal"
        style={{ ["--hero-desktop-stretch-x" as string]: `${bannerAjuste.stretchX / 100}` }}
      >
        <div className="hero-section__visual">
          <div className="hero-section__img-scale-x">
            <img
              key={`hero-banner-${visualTick}`}
              src={bannerSrc}
              alt="Conecta con tu esencia - Magia y Bienestar para tu Alma"
              className="hero-section__img"
              style={{
                transformOrigin: "center center",
                transform: `scale(${bannerAjuste.zoom / 100})`
              }}
            />
          </div>
          <HeroParticles />
          <div className="hero-section__brand-stack">
            {logoCfg.mostrarHeroLogo ? (
              <MaikaLogoImg
                preferredSrc={(logoCfg.heroLogoUrl || "").trim() || undefined}
                alt="Logo MAIKA"
                className="hero-section__mandala"
                style={{
                  position: "relative",
                  width: `${logoCfg.heroLogoTamano}px`,
                  maxWidth: "min(92vw, 100%)",
                  height: "auto",
                  objectFit: "contain",
                  pointerEvents: "none",
                  zIndex: 9,
                  display: "block",
                  flexShrink: 0
                }}
              />
            ) : null}
            <button
              type="button"
              className="hero-section__btn-explorar"
              onClick={(event) => {
                event.stopPropagation();
                onExplorarTienda();
              }}
              aria-label="Explorar tienda"
            >
              Explorar tienda
            </button>
          </div>
        </div>
      </section>
      {portalTiendaActivo ? <div className="portal-tienda-overlay" aria-hidden="true" /> : null}
    </>
  );
}
