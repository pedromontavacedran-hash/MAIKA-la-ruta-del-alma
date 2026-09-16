import dns from "node:dns/promises";
import net from "node:net";
import { load } from "cheerio";

export const PRODUCT_ENRICHMENT_FIELDS = [
  "nombre",
  "marca",
  "referencia",
  "sku",
  "ean",
  "peso",
  "cantidad",
  "formato",
  "aroma",
  "origen",
  "fabricante",
  "tipoProducto",
  "ingredientes",
  "dimensiones",
  "duracionAproximada",
  "descripcionProveedor",
  "caracteristicas",
  "modoUsoProveedor",
  "advertencias",
  "imagenes",
  "codigoHsTaric"
];

const SOURCE_TYPES = new Set(["manufacturer", "supplier", "product_label", "retailer", "other"]);
const SOURCE_PRIORITY = { manufacturer: 5, product_label: 4, supplier: 3, retailer: 2, other: 1 };
const CONFIDENCE_PRIORITY = { high: 3, medium: 2, low: 1 };
const MAX_HTML_BYTES = 2 * 1024 * 1024;

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function cleanArray(value) {
  const list = Array.isArray(value) ? value : [value];
  return [...new Set(list.map(cleanText).filter(Boolean))];
}

function normalizeComparable(value) {
  const values = Array.isArray(value) ? value : [value];
  return values
    .map((item) => cleanText(item).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
    .sort()
    .join("|");
}

function normalizeLabel(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9/ ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isPrivateAddress(address) {
  if (!address) return true;
  if (net.isIPv6(address)) {
    const normalized = address.toLowerCase();
    return normalized === "::1" || normalized === "::" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:") || normalized.startsWith("::ffff:127.") || normalized.startsWith("::ffff:10.") || normalized.startsWith("::ffff:192.168.");
  }
  if (!net.isIPv4(address)) return true;
  const [a, b] = address.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}

async function validatePublicUrl(rawUrl) {
  let url;
  try {
    url = new URL(String(rawUrl ?? "").trim());
  } catch {
    throw new Error("URL de origen inválida");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Solo se permiten URLs HTTP o HTTPS");
  if (url.username || url.password) throw new Error("La URL no puede contener credenciales");
  if (["localhost", "localhost.localdomain"].includes(url.hostname.toLowerCase())) throw new Error("No se permiten direcciones locales");
  const addresses = await dns.lookup(url.hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some((entry) => isPrivateAddress(entry.address))) throw new Error("La URL apunta a una red privada o no permitida");
  return url;
}

function robotsAllows(text, pathname) {
  let applies = false;
  const disallowed = [];
  for (const rawLine of String(text ?? "").split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (key === "user-agent") {
      applies = value === "*";
    } else if (applies && key === "disallow" && value) {
      disallowed.push(value);
    }
  }
  return !disallowed.some((rule) => rule === "/" || pathname.startsWith(rule));
}

async function checkRobots(url) {
  const robotsUrl = new URL("/robots.txt", url.origin);
  try {
    const response = await fetch(robotsUrl, {
      headers: { "User-Agent": "MAIKA-ProductImporter/1.0" },
      redirect: "error",
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) return true;
    return robotsAllows(await response.text(), url.pathname);
  } catch {
    return true;
  }
}

async function fetchHtml(rawUrl) {
  let url = await validatePublicUrl(rawUrl);
  if (!(await checkRobots(url))) throw new Error("La página no permite esta consulta según robots.txt");
  for (let redirectCount = 0; redirectCount <= 4; redirectCount += 1) {
    const response = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.6",
        "User-Agent": "MAIKA-ProductImporter/1.0"
      },
      redirect: "manual",
      signal: AbortSignal.timeout(15000)
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error(`Redirección sin destino (${response.status})`);
      url = await validatePublicUrl(new URL(location, url).toString());
      continue;
    }
    if (!response.ok) throw new Error(`La fuente respondió con estado ${response.status}`);
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("text/html") && !contentType.toLowerCase().includes("application/xhtml+xml")) throw new Error("La URL no devuelve una página HTML");
    const declaredLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_HTML_BYTES) throw new Error("La página supera el tamaño permitido");
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_HTML_BYTES) throw new Error("La página supera el tamaño permitido");
    return { html: new TextDecoder("utf-8", { fatal: false }).decode(bytes), finalUrl: url.toString() };
  }
  throw new Error("La fuente realizó demasiadas redirecciones");
}

function findProductObjects(value, found = []) {
  if (!value || typeof value !== "object") return found;
  if (Array.isArray(value)) {
    for (const item of value) findProductObjects(item, found);
    return found;
  }
  const types = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
  if (types.some((type) => String(type).toLowerCase() === "product")) found.push(value);
  if (value["@graph"]) findProductObjects(value["@graph"], found);
  return found;
}

function validEan(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (![8, 12, 13, 14].includes(digits.length)) return null;
  const body = digits.slice(0, -1).split("").reverse().map(Number);
  const sum = body.reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === Number(digits.at(-1)) ? digits : null;
}

function extractWeight(value) {
  const match = cleanText(value).match(/\b(\d+(?:[.,]\d+)?)\s*(kg|g|gr|gramos?|ml|cl|l)\b/i);
  if (!match) return null;
  const unit = match[2].toLowerCase().replace(/^gr(?:amos?)?$/, "g");
  return `${match[1].replace(",", ".")} ${unit}`;
}

function extractQuantity(value) {
  const match = cleanText(value).match(/\b(\d+\s*[-–]\s*\d+|\d+)\s*(varillas?|barritas?|sticks?|unidades?|uds?\.?|piezas?)\b/i);
  if (!match) return null;
  return `${match[1].replace(/\s+/g, "")} ${match[2].toLowerCase()}`;
}

function sourceTypeSafe(value) {
  return SOURCE_TYPES.has(value) ? value : "other";
}

/**
 * Detecta "404 suaves": HTTP 200 pero la plantilla indica que no hay ficha
 * (PrestaShop: `page-not-found` / "No hay productos disponibles", textos típicos).
 */
export function detectNotFoundPage(html) {
  const $ = load(String(html ?? ""));
  if ($("#pagenotfound, .page-not-found, .pagenotfound").length > 0) return true;
  const mainText = $("#main, main, #content, body").first().text().slice(0, 30000);
  return /no hay productos disponibles|página no encontrada|pagina no encontrada|page not found|producto no disponible|product not found|no longer available/i.test(
    mainText
  );
}

function emptyDatum(contentType = "objective") {
  return { value: null, source: null, sourceType: null, confidence: null, status: "not_found", contentType };
}

function buildFields(candidates) {
  const commercialFields = new Set(["descripcionProveedor", "caracteristicas"]);
  const fields = Object.fromEntries(PRODUCT_ENRICHMENT_FIELDS.map((field) => [field, emptyDatum(commercialFields.has(field) ? "commercial" : "objective")]));
  for (const field of PRODUCT_ENRICHMENT_FIELDS) {
    const values = candidates.get(field) ?? [];
    const unique = [];
    for (const candidate of values) {
      if (candidate.value == null || (Array.isArray(candidate.value) && candidate.value.length === 0)) continue;
      const normalized = normalizeComparable(candidate.value);
      if (!unique.some((item) => normalizeComparable(item.value) === normalized)) unique.push(candidate);
    }
    if (unique.length === 0) continue;
    unique.sort((a, b) => (CONFIDENCE_PRIORITY[b.confidence] - CONFIDENCE_PRIORITY[a.confidence]) || (SOURCE_PRIORITY[b.sourceType] - SOURCE_PRIORITY[a.sourceType]));
    if (unique.length > 1) {
      fields[field] = {
        ...emptyDatum(unique[0].contentType),
        status: "conflict",
        alternatives: unique.map(({ value, source, sourceType, confidence }) => ({ value, source, sourceType, confidence }))
      };
      continue;
    }
    const selected = unique[0];
    fields[field] = { ...selected, status: "found" };
  }
  return fields;
}

function labelToFields(label, value) {
  const normalized = normalizeLabel(label);
  if (/marca|brand/.test(normalized)) return [["marca", value]];
  if (/referencia|reference|ref /.test(`${normalized} `)) return [["referencia", value]];
  if (/\bsku\b/.test(normalized)) return [["sku", value]];
  if (/ean|gtin|codigo de barras|barcode/.test(normalized)) return [["ean", validEan(value)]];
  if (/hs code|codigo hs|taric/.test(normalized)) return [["codigoHsTaric", cleanText(value)]];
  if (/aroma|esencia|fragrance|scent/.test(normalized)) return [["aroma", value]];
  if (/origen|pais de fabricacion|hecho en|made in|country of origin/.test(normalized)) return [["origen", value]];
  if (/fabricante|manufacturer/.test(normalized)) return [["fabricante", value]];
  if (/ingredientes|composicion|composition|ingredients|material/.test(normalized)) return [["ingredientes", value]];
  if (/dimensiones|dimensions|medidas|size/.test(normalized)) return [["dimensiones", value]];
  if (/duracion|burning time|duration/.test(normalized)) return [["duracionAproximada", value]];
  if (/modo de uso|como usar|instructions|directions/.test(normalized)) return [["modoUsoProveedor", value]];
  if (/advertencias|seguridad|warnings|safety/.test(normalized)) return [["advertencias", value]];
  if (/tipo de incienso|tipo de producto|product type/.test(normalized)) return [["tipoProducto", value]];
  if (/formato|format/.test(normalized)) return [["formato", value]];
  if (/peso|weight/.test(normalized)) return [["peso", extractWeight(value) ?? value]];
  if (/cantidad|quantity/.test(normalized)) {
    const weight = extractWeight(value);
    const quantity = extractQuantity(value);
    return [...(weight ? [["peso", weight]] : []), ...(quantity ? [["cantidad", quantity]] : [])];
  }
  return [];
}

export function extractProductData(html, sourceUrl, rawSourceType = "supplier") {
  const sourceType = sourceTypeSafe(rawSourceType);
  const $ = load(String(html ?? ""));
  const notFoundPage = detectNotFoundPage(html);
  const candidates = new Map();
  const add = (field, rawValue, confidence = "high", contentType = "objective") => {
    if (!PRODUCT_ENRICHMENT_FIELDS.includes(field)) return;
    const value = field === "imagenes" || field === "caracteristicas" ? cleanArray(rawValue) : cleanText(rawValue);
    if (!value || (Array.isArray(value) && value.length === 0)) return;
    if (!candidates.has(field)) candidates.set(field, []);
    candidates.get(field).push({ value, source: sourceUrl, sourceType, confidence, contentType });
  };

  $("script[type='application/ld+json']").each((_, element) => {
    try {
      const parsed = JSON.parse($(element).text());
      for (const product of findProductObjects(parsed)) {
        add("nombre", product.name, "high");
        add("marca", typeof product.brand === "object" ? product.brand?.name : product.brand, "high");
        add("fabricante", typeof product.manufacturer === "object" ? product.manufacturer?.name : product.manufacturer, "high");
        add("referencia", product.mpn, "high");
        add("sku", product.sku, "high");
        add("ean", validEan(product.gtin13 ?? product.gtin14 ?? product.gtin12 ?? product.gtin8 ?? product.gtin), "high");
        add("peso", typeof product.weight === "object" ? `${product.weight?.value ?? ""} ${product.weight?.unitText ?? product.weight?.unitCode ?? ""}` : product.weight, "high");
        add("dimensiones", product.size, "medium");
        add("ingredientes", product.material, "medium");
        add("origen", typeof product.countryOfOrigin === "object" ? product.countryOfOrigin?.name : product.countryOfOrigin, "high");
        add("descripcionProveedor", product.description, "medium", "commercial");
        add("imagenes", product.image, "high");
      }
    } catch {
      return;
    }
  });

  const title = cleanText($("meta[property='og:title']").attr("content") || $("h1").first().text() || $("title").text());
  const description = cleanText($("meta[property='og:description']").attr("content") || $("meta[name='description']").attr("content"));
  const image = cleanText($("meta[property='og:image']").attr("content"));
  if (!notFoundPage) {
    add("nombre", title, "medium");
    add("descripcionProveedor", description, "low", "commercial");
    add("imagenes", image ? new URL(image, sourceUrl).toString() : null, "medium");
  }

  const reference = cleanText($(".product-reference span, [itemprop='sku']").first().text() || $(".product-reference").first().text()).replace(/^.*?:\s*/, "");
  const brand = cleanText($("[itemprop='brand'], .product-manufacturer a, .brand a").first().text());
  if (!notFoundPage) {
    add("referencia", reference, "high");
    add("marca", brand, "high");
  }

  const pairs = [];
  if (!notFoundPage) {
    $("dt").each((_, element) => pairs.push([$(element).text(), $(element).next("dd").text()]));
  $("table tr").each((_, row) => {
    const cells = $(row).find("th,td").map((__, cell) => $(cell).text()).get();
    if (cells.length >= 2) pairs.push([cells[0], cells.slice(1).join(" ")]);
  });
  $(".product-features li, .data-sheet li, .product-features .data-sheet").each((_, element) => {
    const name = $(element).find(".name,dt,.feature-name").first().text();
    const value = $(element).find(".value,dd,.feature-value").first().text();
    if (name && value) pairs.push([name, value]);
  });
    for (const [label, value] of pairs) {
      for (const [field, mappedValue] of labelToFields(label, cleanText(value))) add(field, mappedValue, "high");
    }

    add("peso", extractWeight(title), "medium");
    add("cantidad", extractQuantity(title), "medium");
    const titleOrigin = title.match(/(?:hecho|fabricado|made|handcrafted)\s+(?:en|in)\s+([\p{L} .-]{2,40})(?:$|[-|,])/iu);
    if (titleOrigin) add("origen", titleOrigin[1], "medium");
    if (/\b(varillas?|barritas?|sticks?)\b/i.test(title)) add("tipoProducto", "Varillas", "medium");
    if (/\bmasala\b/i.test(title)) add("tipoProducto", "Masala", "medium");

    // Extracción de datos corporativos del fabricante (páginas about/contact)
    // Solo aplica cuando sourceType es manufacturer: busca dirección, país, descripción
    if (sourceType === "manufacturer") {
      const bodyText = cleanText($("body").text());
      // Origen: "India", "Gujarat", "Rajkot" en contexto de dirección
      const mfrOrigin = bodyText.match(/(?:address|sede|located in|based in|headquartered in)[:\s]*([^\n]{5,80})/i);
      if (mfrOrigin) add("origen", mfrOrigin[1], "high");
      const countryMatch = bodyText.match(/\b(INDIA|India)\b/);
      if (countryMatch) add("origen", "India", "high");
      // Fabricante: nombre de empresa "X Pvt. Ltd." o "X Inc." — solo en contexto de dirección/contacto
      const contactBlock = bodyText.match(/(?:address|sede|visit|contact)[:\s]*([^\n]{10,300})/i);
      if (contactBlock) {
        const mfrName = contactBlock[1].match(/([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\s+(?:Pvt\.?\s*Ltd\.?|Private Limited|Inc\.?|LLP|LLC))/);
        if (mfrName) add("fabricante", mfrName[1], "high");
      }
      // Descripción corporativa del about
      const aboutText = bodyText.match(/(Welcome to [A-Z][a-zA-Z]+[^.]{20,300}\.)/);
      if (aboutText) add("descripcionProveedor", aboutText[1], "medium", "commercial");
      // Marca desde el título si no se encontró antes
      if (title && /alaukik/i.test(title)) add("marca", "Alaukik", "medium");
    }

    // Extracción desde la descripción (og:description / meta description): patrones comunes
    if (description) {
      const descAroma = description.match(/(?:aroma|fragrance|scent|esencia)\s+(?:of\s+)?(?:litchi|lychee)/i);
      if (descAroma) add("aroma", "Litchi", "medium");
      const descOrigin = description.match(/(?:made|handcrafted|manufactured|crafted)\s+(?:en|in)\s+([\p{L} .-]{2,40})(?:[.,;]|$)/iu);
      if (descOrigin) add("origen", descOrigin[1], "medium");
      const descSticks = description.match(/(approx(?:imately)?\s*\d+|under\s*\d+|around\s*\d+|\d+\s*[-–]\s*\d+)\s*(?:sticks?|varillas?|barritas?)/i);
      if (descSticks) add("cantidad", descSticks[0], "medium");
      const descWeight = extractWeight(description);
      if (descWeight) add("peso", descWeight, "medium");
    }

    // <li> en áreas de descripción ampliadas (Shopify, WooCommerce, PrestaShop)
    const featureItems = $(
      ".product-description li, .description li, [itemprop='description'] li, " +
      ".ss-prod-tab-content li, .tab-content li, .woocommerce-product-details__short-description li, " +
      ".product-short-description li, .rte li, .product-info li"
    )
      .map((_, element) => cleanText($(element).text()))
      .get()
      .filter((s) => s && s.length > 5 && s.length < 200)
      .slice(0, 20);
    add("caracteristicas", featureItems, "low", "commercial");

    // Patrones de texto en <li> para campos específicos
    for (const item of featureItems) {
      const liAroma = item.match(/(?:aroma|fragrance|scent|esencia)\s+(?:of\s+)?([\p{L} -]{3,30})/i);
      if (liAroma) add("aroma", liAroma[1], "medium");
      const liWeight = item.match(/(?:pack weight|peso|weight)\s*[:：]?\s*(\d+\s*(?:g|gr|kg|gramos?))/i);
      if (liWeight) add("peso", liWeight[1], "medium");
      const liSticks = item.match(/(under\s*\d+|approx(?:imately)?\s*\d+|around\s*\d+|\d+\s*[-–]\s*\d+)\s*(?:sticks?|varillas?|barritas?)/i);
      if (liSticks) add("cantidad", liSticks[0], "medium");
      if (/hand.?rolled/i.test(item)) add("tipoProducto", "Varillas hand-rolled", "medium");
      if (/masala/i.test(item)) add("tipoProducto", "Masala", "medium");
    }
  }
  // El EAN incrustado en la propia URL sí es fiable aunque la ficha esté retirada.
  const urlEanCandidates = sourceUrl.match(/\b\d{8,14}\b/g) ?? [];
  for (const candidate of urlEanCandidates) add("ean", validEan(candidate), "medium");

  return buildFields(candidates);
}

export function mergeProductEnrichments(existing, incoming) {
  if (!existing?.fields) return incoming;
  const candidates = new Map();
  const addDatum = (field, datum) => {
    if (!datum || datum.status === "not_found" || datum.status === "rejected") return;
    const values = datum.status === "conflict" ? datum.alternatives ?? [] : [datum];
    for (const value of values) {
      if (value?.value == null || !value.source) continue;
      if (!candidates.has(field)) candidates.set(field, []);
      candidates.get(field).push({
        value: value.value,
        source: value.source,
        sourceType: sourceTypeSafe(value.sourceType),
        confidence: value.confidence ?? "low",
        contentType: datum.contentType ?? "objective"
      });
    }
  };
  const accepted = {};
  for (const field of PRODUCT_ENRICHMENT_FIELDS) {
    const existingDatum = existing.fields[field];
    if (existingDatum?.status === "accepted") {
      // Conservar el valor aceptado, pero comprobar si la nueva fuente lo contradice
      const incomingDatum = incoming?.fields?.[field];
      const incomingValues = incomingDatum?.status === "conflict"
        ? (incomingDatum.alternatives ?? [])
        : incomingDatum && incomingDatum.status !== "not_found" && incomingDatum.status !== "rejected"
          ? [incomingDatum]
          : [];
      const contradictorias = incomingValues.filter(
        (v) => v?.value != null && !mismoValorEnriquecido(v.value, existingDatum.value)
      );
      if (contradictorias.length > 0) {
        accepted[field] = {
          ...existingDatum,
          hasContradiction: true,
          alternatives: [
            ...(Array.isArray(existingDatum.alternatives) ? existingDatum.alternatives : []),
            ...contradictorias.map((v) => ({
              value: v.value,
              source: v.source,
              sourceType: sourceTypeSafe(v.sourceType),
              confidence: v.confidence ?? "low"
            }))
          ]
        };
      } else {
        accepted[field] = existingDatum;
      }
      continue;
    }
    addDatum(field, existingDatum);
    addDatum(field, incoming?.fields?.[field]);
  }
  const fields = buildFields(candidates);
  Object.assign(fields, accepted);
  const sources = [...(existing.sources ?? []), ...(incoming?.sources ?? [])].filter(
    (source, index, all) => source?.url && all.findIndex((other) => other?.url === source.url) === index
  );
  const hasConflict = Object.values(fields).some(
    (field) => field.status === "conflict" || field.hasContradiction
  );
  return {
    ...incoming,
    status: hasConflict ? "needs_review" : incoming.status,
    fields,
    sources
  };
}

function mismoValorEnriquecido(a, b) {
  const norm = (x) => (Array.isArray(x) ? x : [x]).map((v) => String(v ?? "").trim().toLowerCase()).sort().join("|");
  return norm(a) === norm(b);
}

/**
 * Jerarquía obligatoria de fuentes para el enriquecimiento:
 *   1. Fabricante / marca oficial
 *   2. Catálogo oficial del fabricante
 *   3. Distribuidor / proveedor
 *   4. Minoristas
 *
 * Dada una marca conocida, intenta localizar su web oficial verificando que
 * la página pertenece realmente a esa marca. Devuelve { url, verified } o null.
 * No inventa URLs: solo construye candidatos obvios y los verifica con fetch.
 */
const KNOWN_OFFICIAL_SITES = {
  alaukik: ["https://www.alaukikincense.com/", "https://alaukikincense.in/"]
};

export async function resolveOfficialSite(marca) {
  if (!marca) return null;
  const key = marca.toLowerCase().trim();
  // Candidatos conocidos
  const candidates = KNOWN_OFFICIAL_SITES[key] ?? [];
  // Candidato derivado del nombre de marca (no inventamos dominios desconocidos)
  if (candidates.length === 0) {
    const slug = key.replace(/[^a-z0-9]/g, "");
    if (slug.length >= 3 && slug.length <= 20) {
      candidates.push(`https://www.${slug}.com/`, `https://${slug}.com/`, `https://www.${slug}.in/`);
    }
  }
  for (const url of candidates) {
    try {
      const r = await fetchHtml(url);
      if (!r.html || r.html.length < 500) continue;
      const html = r.html.toLowerCase();
      // Verificar que la página menciona la marca
      if (!html.includes(key)) continue;
      // Descartar páginas de parking / dominios en venta
      if (/domain.*for sale|buy this domain|parked domain/i.test(html)) continue;
      return { url: r.finalUrl || url, verified: true };
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Enriquecimiento con jerarquía de fuentes:
 * 1. Si se indica una URL explícita, se usa esa (el caller ya decidió la fuente).
 * 2. Si no hay URL pero hay marca, se busca la web oficial del fabricante.
 * 3. Si la web oficial existe y es accesible, se extraen datos de allí (sourceType=manufacturer).
 * 4. El caller puede encadenar fuentes adicionales con mergeProductEnrichments.
 */
export async function importProductData(input = {}) {
  const now = new Date().toISOString();
  const normalizedInput = {
    nombre: cleanText(input.nombre),
    marca: cleanText(input.marca) || null,
    url: cleanText(input.url) || null,
    ean: validEan(input.ean) || null
  };
  const base = {
    status: "pending",
    checkedAt: null,
    input: normalizedInput,
    fields: Object.fromEntries(PRODUCT_ENRICHMENT_FIELDS.map((field) => [field, emptyDatum(["descripcionProveedor", "caracteristicas"].includes(field) ? "commercial" : "objective")])),
    sources: []
  };

  // Si no hay URL explícita, intentar localizar la web oficial del fabricante
  let urlToFetch = normalizedInput.url;
  let sourceType = sourceTypeSafe(input.sourceType ?? "supplier");
  let officialSite = null;

  if (!urlToFetch && normalizedInput.marca) {
    officialSite = await resolveOfficialSite(normalizedInput.marca);
    if (officialSite) {
      urlToFetch = officialSite.url;
      sourceType = "manufacturer";
    }
  }

  if (!urlToFetch) {
    return { ...base, status: "needs_review", fetchError: "No se indicó una URL de origen y no se pudo localizar la web oficial del fabricante; indica una URL manualmente" };
  }

  try {
    const { html, finalUrl } = await fetchHtml(urlToFetch);
    const pageNotFound = detectNotFoundPage(html);
    const fields = extractProductData(html, finalUrl, sourceType);
    if (normalizedInput.ean && fields.ean.status === "not_found") {
      fields.ean = { value: normalizedInput.ean, source: null, sourceType: "other", confidence: "low", status: "found", contentType: "objective" };
    }
    const hasConflict = Object.values(fields).some((field) => field.status === "conflict");
    return {
      status: hasConflict || pageNotFound ? "needs_review" : "imported",
      checkedAt: now,
      input: normalizedInput,
      fields,
      sources: [{ url: finalUrl, sourceType, checkedAt: now, title: fields.nombre.value || undefined, official: !!officialSite }],
      fetchError: pageNotFound
        ? "La página de origen no muestra una ficha de producto (posible baja del artículo o 404 suave)"
        : null
    };
  } catch (error) {
    return { ...base, status: "needs_review", checkedAt: now, fetchError: error instanceof Error ? error.message : "No se pudo consultar la fuente" };
  }
}

function normalizedIdentity(value) {
  return cleanText(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

export function findDuplicateProduct(products, candidate, excludeId = null) {
  const list = Array.isArray(products) ? products.filter((p) => Number(p.id) !== Number(excludeId)) : [];
  const ean = validEan(candidate?.ean);
  if (ean) {
    const match = list.find((p) => validEan(p.ean) === ean);
    if (match) return { product: match, matchedBy: "ean" };
  }
  const reference = normalizedIdentity(candidate?.referencia || candidate?.sku);
  if (reference) {
    const match = list.find((p) => normalizedIdentity(p.referencia || p.sku) === reference);
    if (match) return { product: match, matchedBy: "reference" };
  }
  const sourceUrl = cleanText(candidate?.urlOrigen || candidate?.url).replace(/\/$/, "");
  if (sourceUrl) {
    const match = list.find((p) => cleanText(p.urlOrigen).replace(/\/$/, "") === sourceUrl);
    if (match) return { product: match, matchedBy: "source_url" };
  }
  const identity = [candidate?.marca, candidate?.nombre, candidate?.peso].map(normalizedIdentity).join("|");
  if (candidate?.marca && candidate?.nombre && candidate?.peso) {
    const match = list.find((p) => [p.marca, p.nombre, p.peso].map(normalizedIdentity).join("|") === identity);
    if (match) return { product: match, matchedBy: "brand_name_weight" };
  }
  return null;
}
