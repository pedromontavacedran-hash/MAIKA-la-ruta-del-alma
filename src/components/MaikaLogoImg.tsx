import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { MAIKA_LOGO_PUBLIC_URL } from "../config";

type Props = {
  /** Si viene del admin (modal checkout), se intenta primero; si falla, cadena por defecto. */
  preferredSrc?: string | null;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  title?: string;
};

function buildChain(preferred?: string | null): string[] {
  const raw = preferred?.trim();
  const parts = [raw, MAIKA_LOGO_PUBLIC_URL].filter(
    (x): x is string => Boolean(x)
  );
  return [...new Set(parts)];
}

/**
 * Imagen del logo con reintentos: URL preferida → `public/logotipo.jpg` → `public/iconos/logotipo.jpg`.
 */
export default function MaikaLogoImg({ preferredSrc, alt = "Maika", className, style, title }: Props) {
  const chain = useMemo(() => buildChain(preferredSrc), [preferredSrc]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [preferredSrc]);

  const src = chain[index] ?? chain[0];

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      title={title}
      style={style}
      onError={() => setIndex((i) => (i + 1 < chain.length ? i + 1 : i))}
    />
  );
}
