import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import DOMPurify, { type Config } from "dompurify";
import { PATH_BY_PAGINA } from "@/app/routing/routeMaps";
import { esLegalSlug, LEGAL_META } from "@/app/routing/legalRoutes";
import { extractLegalStaticSource } from "../utils/extractLegalStaticSource";

const LEGAL_HTML_PURIFY: Config = {
  ALLOWED_TAGS: [
    "h1", "h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "em", "b", "i", "a", "br", "span",
  ],
  ALLOWED_ATTR: ["href", "title", "class"],
  RETURN_TRUSTED_TYPE: false,
};

function sanitizeLegalHtml(html: string): string {
  return DOMPurify.sanitize(html, LEGAL_HTML_PURIFY);
}

export default function LegalDocumentPage() {
  const { slug } = useParams<{ slug: string }>();
  const [innerHtml, setInnerHtml] = useState<string | null>(null);
  const [estado, setEstado] = useState<"cargando" | "error" | "ok">("cargando");

  useEffect(() => {
    if (!esLegalSlug(slug)) return;
    const meta = LEGAL_META[slug];
    let cancelado = false;
    setEstado("cargando");
    setInnerHtml(null);

    fetch(`/${meta.htmlBase}.html`)
      .then((r) => {
        if (!r.ok) throw new Error("fetch");
        return r.text();
      })
      .then((text) => {
        if (cancelado) return;
        setInnerHtml(sanitizeLegalHtml(extractLegalStaticSource(text)));
        setEstado("ok");
      })
      .catch(() => {
        if (!cancelado) setEstado("error");
      });

    return () => {
      cancelado = true;
    };
  }, [slug]);

  if (!esLegalSlug(slug)) {
    return <Navigate to={PATH_BY_PAGINA.legal} replace />;
  }

  const meta = LEGAL_META[slug];

  if (estado === "error") {
    return (
      <div className="legal-doc-page">
        <div className="legal-doc-page__inner">
          <Link className="legal-doc-page__back" to={PATH_BY_PAGINA.legal}>
            ← Volver a Legal
          </Link>
          <p className="legal-doc-prose legal-doc-page__status">No se pudo cargar el documento. Prueba de nuevo en unos segundos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="legal-doc-page">
      <div className="legal-doc-page__inner">
        <Link className="legal-doc-page__back" to={PATH_BY_PAGINA.legal}>
          ← Volver a Legal
        </Link>

        {estado === "cargando" && <p className="legal-doc-page__status">Cargando…</p>}

        {estado === "ok" && innerHtml != null && (
          <article
            className="legal-doc-prose"
            aria-label={meta.titulo}
            dangerouslySetInnerHTML={{ __html: innerHtml }}
          />
        )}
      </div>
    </div>
  );
}
