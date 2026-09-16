/**
 * Extrae el precio público actual de una URL de producto (web del proveedor).
 * Prueba patrones habituales: JSON embebido (salePrice/price), JSON-LD, meta tags
 * y microdata. Devuelve null si no se puede determinar con confianza.
 */

const FETCH_TIMEOUT_MS = 12_000;

function parseImporteES(raw) {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;
  s = s.replace(/[€$\s]|&nbsp;|eur/gi, "");
  // "1,79" | "1.79" | "1.234,56"
  if (/^\d{1,3}(\.\d{3})+,\d{1,2}$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d+,\d{1,2}$/.test(s)) s = s.replace(",", ".");
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0 || n > 100000) return null;
  return Math.round(n * 100) / 100;
}

function extraerPrecioDeHtml(htmlCrudo) {
  // El JSON embebido puede venir con comillas escapadas (\"price\":\"1,79€\"): se normaliza.
  const html = htmlCrudo.replace(/\\"/g, '"');
  // 1. JSON embebido estilo headless WooCommerce: "salePrice":"1,79€" / "price":"1,79€"
  const sale = html.match(/"salePrice"\s*:\s*"([^"]+)"/);
  const priceJ = html.match(/"price"\s*:\s*"([^"]+)"/);
  const regular = html.match(/"regularPrice"\s*:\s*"([^"]+)"/);
  const saleN = parseImporteES(sale?.[1]);
  const priceJN = parseImporteES(priceJ?.[1]);
  const regularN = parseImporteES(regular?.[1]);
  if (saleN != null) return { precio: saleN, precioRegular: regularN ?? priceJN ?? null };
  if (priceJN != null) return { precio: priceJN, precioRegular: regularN ?? null };

  // 2. JSON-LD: "offers":{"price":...} | offers:[{price}]
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const j = JSON.parse(m[1]);
      const items = Array.isArray(j) ? j : [j];
      for (const it of items) {
        const offers = it?.offers;
        const off = Array.isArray(offers) ? offers[0] : offers;
        const p = parseImporteES(off?.price ?? off?.lowPrice);
        if (p != null) return { precio: p, precioRegular: null };
      }
    } catch {
      /* json malformado */
    }
  }

  // 3. Meta OpenGraph product / microdata itemprop
  const meta = html.match(/property="product:price:amount"\s+content="([^"]+)"/)
    ?? html.match(/content="([^"]+)"\s+property="product:price:amount"/);
  const metaN = parseImporteES(meta?.[1]);
  if (metaN != null) return { precio: metaN, precioRegular: null };

  const item = html.match(/itemprop="price"[^>]*content="([^"]+)"/)
    ?? html.match(/content="([^"]+)"[^>]*itemprop="price"/);
  const itemN = parseImporteES(item?.[1]);
  if (itemN != null) return { precio: itemN, precioRegular: null };

  return null;
}

/**
 * Descarga `url` y extrae { precio, precioRegular }.
 * @returns {Promise<{ok:true, precio:number, precioRegular:number|null}|{ok:false, error:string}>}
 */
export async function extraerPrecioDeUrl(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    let res;
    try {
      res = await fetch(url, {
        signal: ctrl.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; MaikaPriceCheck/1.0)", Accept: "text/html" },
        redirect: "follow"
      });
    } finally {
      clearTimeout(t);
    }
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const html = await res.text();
    const r = extraerPrecioDeHtml(html);
    if (!r) return { ok: false, error: "precio no encontrado en la página" };
    return { ok: true, precio: r.precio, precioRegular: r.precioRegular };
  } catch (e) {
    return { ok: false, error: e?.name === "AbortError" ? "tiempo de espera agotado" : "error de red" };
  }
}
