import { Link } from "react-router-dom";
import { PATH_BY_PAGINA } from "@/app/routing/routeMaps";
import { LEGAL_META, LEGAL_SLUGS, type LegalSlug } from "@/app/routing/legalRoutes";
import { THEME } from "../config";

const slugToPagina: Record<LegalSlug, "legalTerminos" | "legalPrivacidad" | "legalCookies" | "legalAviso"> = {
  terminos: "legalTerminos",
  privacidad: "legalPrivacidad",
  cookies: "legalCookies",
  aviso: "legalAviso"
};

const LEGAL_TOP_PAD = "8px";

export default function LegalIndexPage() {
  return (
    <div
      className="inicio-page"
      style={{ textAlign: "center", color: "inherit", paddingTop: LEGAL_TOP_PAD, paddingBottom: 32 }}
    >
      <h1
        className="inicio-seccion-titulo"
        style={{
          fontSize: "clamp(24px, 4vw, 32px)",
          color: THEME.goldMain,
          fontWeight: "bold",
          marginBottom: 28,
          scrollMarginTop: 100
        }}
      >
        Legal
      </h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 480, margin: "0 auto", width: "100%" }}>
        {LEGAL_SLUGS.map((slug) => {
          const meta = LEGAL_META[slug];
          return (
            <Link
              key={slug}
              to={PATH_BY_PAGINA[slugToPagina[slug]]}
              style={{
                display: "block",
                padding: "16px 20px",
                borderRadius: 14,
                border: `1px solid rgba(229, 192, 123, 0.45)`,
                background: "rgba(8, 6, 15, 0.85)",
                color: "rgba(255,255,255,0.95)",
                textDecoration: "none",
                fontSize: 17,
                fontWeight: 600,
                textAlign: "center",
                transition: "border-color 0.2s ease, background 0.2s ease"
              }}
            >
              {meta.tituloCorto}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
