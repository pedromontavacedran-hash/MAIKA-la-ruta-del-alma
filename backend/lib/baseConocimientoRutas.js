import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/*
 * Base de conocimiento de Rutas del Alma.
 *
 * Carga los .json de backend/data/rutasDelAlma/ (formato: ver README.md de ese
 * directorio), valida su esquema y ofrece recuperación por relevancia: dado el
 * texto de la conversación devuelve las entradas documentadas más cercanas para
 * inyectarlas como contexto autorizado en el prompt del asistente.
 *
 * Regla de la casa: el modelo solo responde con lo que esta base aporta; si no
 * hay entradas relevantes, la ruta devuelve el mensaje de insuficiencia sin
 * llamar al proveedor de IA.
 */

const DIR_BASE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "data",
  "rutasDelAlma"
);

const CERTEZAS = new Set(["documentado", "probable", "discutido", "incierto"]);
const CAPAS_VALIDAS = ["tradicion", "historia", "academia", "interpretaciones", "miradaMaika"];

const ETIQUETAS_CAPA = {
  tradicion: "Tradición",
  historia: "Historia",
  academia: "Investigación académica",
  interpretaciones: "Interpretaciones posteriores",
  miradaMaika: "Mirada MAIKA"
};

/* Archivo del registro bibliográfico: no contiene entradas de conocimiento. */
const ARCHIVO_FUENTES = "fuentes.json";

let baseCache = null;
let fuentesCache = null;

function normalizar(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function validarFuente(raw, archivo) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const { id, autor, titulo } = raw;
  if (typeof id !== "string" || !id.trim() || typeof autor !== "string" || !autor.trim() || typeof titulo !== "string" || !titulo.trim()) {
    console.warn(`[rutasDelAlma/base] fuente descartada por esquema en ${archivo}`);
    return null;
  }
  return {
    ...raw,
    id: id.trim(),
    autor: autor.trim(),
    titulo: titulo.trim(),
    capitulosConsultados: Array.isArray(raw.capitulosConsultados) ? raw.capitulosConsultados : [],
    temasRelacionados: Array.isArray(raw.temasRelacionados) ? raw.temasRelacionados : []
  };
}

/** Registro bibliográfico (obras de referencia): id → ficha. */
export function cargarFuentes() {
  if (fuentesCache) return fuentesCache;
  fuentesCache = new Map();
  const ruta = path.join(DIR_BASE, ARCHIVO_FUENTES);
  if (!existsSync(ruta)) return fuentesCache;
  let lista;
  try {
    lista = JSON.parse(readFileSync(ruta, "utf8"));
  } catch (err) {
    console.warn(`[rutasDelAlma/base] JSON inválido en ${ARCHIVO_FUENTES}: ${err?.message || err}`);
    return fuentesCache;
  }
  if (!Array.isArray(lista)) return fuentesCache;
  for (const raw of lista) {
    const fuente = validarFuente(raw, ARCHIVO_FUENTES);
    if (fuente && !fuentesCache.has(fuente.id)) fuentesCache.set(fuente.id, fuente);
  }
  return fuentesCache;
}

function validarReferencias(raw, idEntrada) {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) return [];
  const registro = cargarFuentes();
  const limpias = [];
  for (const ref of raw) {
    if (!ref || typeof ref !== "object" || typeof ref.fuente !== "string" || !ref.fuente.trim()) continue;
    const fuenteId = ref.fuente.trim();
    if (!registro.has(fuenteId)) {
      console.warn(`[rutasDelAlma/base] ${idEntrada}: referencia a fuente no registrada: ${fuenteId}`);
      continue;
    }
    limpias.push({
      fuente: fuenteId,
      ...(typeof ref.capitulo === "string" && ref.capitulo.trim() ? { capitulo: ref.capitulo.trim() } : {}),
      ...(typeof ref.paginas === "string" && ref.paginas.trim() ? { paginas: ref.paginas.trim() } : {}),
      ...(typeof ref.nota === "string" && ref.nota.trim() ? { nota: ref.nota.trim() } : {})
    });
  }
  return limpias;
}

function validarEntrada(raw, archivo) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const { id, titulo, palabrasClave, certeza, capas, fuentes } = raw;
  if (typeof id !== "string" || !id.trim()) return null;
  if (typeof titulo !== "string" || !titulo.trim()) return null;
  if (!Array.isArray(palabrasClave) || palabrasClave.length === 0) return null;
  if (!CERTEZAS.has(certeza)) return null;
  if (!capas || typeof capas !== "object" || Array.isArray(capas)) return null;
  const capasLimpias = {};
  let algunaCapa = false;
  for (const nombre of CAPAS_VALIDAS) {
    const texto = capas[nombre];
    if (typeof texto === "string" && texto.trim()) {
      capasLimpias[nombre] = texto.trim();
      algunaCapa = true;
    }
  }
  if (!algunaCapa) return null;
  const entrada = {
    id: id.trim(),
    titulo: titulo.trim(),
    palabrasClave: palabrasClave.filter((p) => typeof p === "string" && p.trim()).map((p) => normalizar(p)),
    certeza,
    capas: capasLimpias,
    fuentes: Array.isArray(fuentes)
      ? fuentes.filter((f) => typeof f === "string" && f.trim()).map((f) => f.trim())
      : [],
    referencias: validarReferencias(raw.referencias, id),
    /* ids de otras entradas del mismo tema: se arrastran al contexto cuando
       la entrada es hit directo (recuperación multi-fuente). */
    relacionados: Array.isArray(raw.relacionados)
      ? raw.relacionados.filter((r) => typeof r === "string" && r.trim()).map((r) => r.trim())
      : []
  };
  if (entrada.palabrasClave.length === 0) {
    console.warn(`[rutasDelAlma/base] entrada sin palabras clave válidas: ${id} (${archivo})`);
    return null;
  }
  return entrada;
}

/** Carga (una vez) todas las entradas válidas de la base. */
export function cargarBaseConocimiento() {
  if (baseCache) return baseCache;
  baseCache = [];
  if (!existsSync(DIR_BASE)) {
    console.warn(`[rutasDelAlma/base] directorio no encontrado: ${DIR_BASE}`);
    return baseCache;
  }
  const ids = new Set();
  cargarFuentes();
  for (const archivo of readdirSync(DIR_BASE)) {
    if (!archivo.endsWith(".json") || archivo === ARCHIVO_FUENTES) continue;
    const ruta = path.join(DIR_BASE, archivo);
    let lista;
    try {
      lista = JSON.parse(readFileSync(ruta, "utf8"));
    } catch (err) {
      console.warn(`[rutasDelAlma/base] JSON inválido en ${archivo}: ${err?.message || err}`);
      continue;
    }
    if (!Array.isArray(lista)) {
      console.warn(`[rutasDelAlma/base] ${archivo} no contiene un array`);
      continue;
    }
    for (const raw of lista) {
      const entrada = validarEntrada(raw, archivo);
      if (!entrada) {
        console.warn(`[rutasDelAlma/base] entrada descartada por esquema en ${archivo}`);
        continue;
      }
      if (ids.has(entrada.id)) {
        console.warn(`[rutasDelAlma/base] id duplicado: ${entrada.id}`);
        continue;
      }
      ids.add(entrada.id);
      baseCache.push(entrada);
    }
  }
  /* Validar que los `relacionados` apuntan a entradas existentes. */
  for (const entrada of baseCache) {
    entrada.relacionados = entrada.relacionados.filter((rel) => {
      const ok = ids.has(rel);
      if (!ok) console.warn(`[rutasDelAlma/base] ${entrada.id}: relacionado desconocido: ${rel}`);
      return ok;
    });
  }
  return baseCache;
}

/*
 * Expansión de la consulta: la pregunta del usuario rara vez usa las palabras
 * exactas de la documentación. Cada patrón añade términos de búsqueda
 * equivalentes para que la recuperación sea por TEMA, no por frase literal.
 * (P. ej. «¿quién descubrió la Cábala?» → origen, primeros cabalistas…)
 */
const EXPANSION_CONSULTA = [
  [/descubr|creo|crear|creador|invent|empez|comenz|nacio|nacer|surgi|aparec|fundador|fundamento|nace|nacio|de donde viene|de donde procede/, "origen origenes aparicion surgimiento primeros cabalistas comienzo"],
  [/primero|quien fue el primero|iniciador/, "primeros cabalistas origen isaac el ciego"],
  [/angeles?|angelic|angelolog/, "angeles nombre de angel capa angelica reuchlin rudd"],
  [/zohar|esplendor/, "zohar moises de leon castilla"],
  [/nombre(s)? de dios|nombre divino/, "shem hamephorash nombre explicito tetragrammaton 72 nombres"],
  [/arbol/, "arbol de la vida sefirot senderos"],
  [/tarot|astrologia|planeta|ocult|esoterismo occidental|golden dawn/, "ocultismo moderno interpretaciones tarot"],
  [/cristian|hermet|renacim/, "cristiano hermetica reuchlin interpretaciones posteriores"],
  [/significa|significado|traducc|traducir/, "significado traduccion"],
  [/contempl|medit|rezo|practicar|usar|sirven/, "contemplacion uso practica"],
  [/edad|cuando|epoca|siglo/, "historia datacion medieval siglo"],
  [/escribio|autor|autoria|escrito/, "autoria autor atribucion"]
];

const STOPWORDS = new Set([
  "que", "cual", "cuales", "quien", "quienes", "como", "donde", "cuando", "por",
  "para", "con", "sin", "una", "uno", "unos", "unas", "del", "los", "las",
  "les", "los", "este", "esta", "estos", "estas", "ese", "esa", "esos", "esas",
  "hay", "son", "fue", "era", "ser", "han", "has", "the", "and", "de", "la",
  "el", "en", "y", "a", "o", "u", "es", "al", "lo", "su", "sus", "se", "me",
  "te", "mi", "tu", "le", "nos", "ya", "muy", "mas", "mas", "tan", "asi",
  "entre", "sobre", "tras", "hacia", "desde", "hasta", "por", "pero", "sino",
  "puede", "puedo", "quiero", "quisiera", "dime", "explica", "cuenta", "sabes",
  "algo", "toda", "todo", "realmente", "verdad", "entonces", "eso", "esa",
  "relacion", "tiene", "tienen", "tener"
]);

function expandirConsulta(consultaNorm) {
  const extra = [];
  for (const [patron, expansion] of EXPANSION_CONSULTA) {
    if (patron.test(consultaNorm)) extra.push(expansion);
  }
  return extra.length > 0 ? `${consultaNorm} ${extra.join(" ")}` : consultaNorm;
}

function tokensRelevantes(textoNorm) {
  return new Set(
    textoNorm
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 4 && !STOPWORDS.has(t))
  );
}

function puntuarEntrada(entrada, consultaNorm, tokensConsulta) {
  let puntos = 0;
  for (const clave of entrada.palabrasClave) {
    if (clave && consultaNorm.includes(clave)) {
      /* Las claves más específicas (más palabras) pesan más. */
      puntos += clave.split(" ").length * 2;
      continue;
    }
    /* Coincidencia parcial: cada token de la clave presente suma (una fuente
       puede ser relevante sin usar la frase exacta de la pregunta). */
    const tokensClave = clave.split(" ").filter((t) => t.length >= 4);
    const presentes = tokensClave.filter((t) => tokensConsulta.has(t)).length;
    if (presentes > 0) puntos += presentes * 0.5;
  }
  for (const palabra of normalizar(entrada.titulo).split(/[^a-z0-9]+/)) {
    if (palabra.length >= 4 && tokensConsulta.has(palabra)) puntos += 1.5;
  }
  /* Los propios tokens del id temático (p. ej. «isaac-el-ciego») cuentan. */
  for (const parte of entrada.id.split(/[.\-]/)) {
    if (parte.length >= 4 && tokensConsulta.has(parte)) puntos += 2;
  }
  /* Solape léxico ligero con el contenido documentado. */
  for (const nombre of CAPAS_VALIDAS) {
    const texto = entrada.capas[nombre];
    if (!texto) continue;
    const tokensEntrada = tokensRelevantes(normalizar(texto));
    for (const t of tokensConsulta) {
      if (tokensEntrada.has(t)) puntos += 0.3;
    }
  }
  return puntos;
}

/**
 * Recuperación documental multi-fuente:
 * 1) puntúa todas las entradas contra la consulta (ampliada con sinónimos);
 * 2) añade las entradas declaradas como `relacionados` de los hits directos,
 *    para que el contexto traiga el conjunto documental del tema;
 * 3) recorta por número de entradas y por presupuesto de caracteres.
 * @param {string} textoConsulta conversación o pregunta.
 * @param {{ maxEntradas?: number, maxChars?: number }} [opciones]
 */
export function recuperarEntradas(textoConsulta, { maxEntradas = 7, maxChars = 8000 } = {}) {
  const base = cargarBaseConocimiento();
  const consultaNorm = ` ${normalizar(textoConsulta)} `;
  const consultaExpandida = expandirConsulta(consultaNorm);
  const tokensConsulta = tokensRelevantes(consultaExpandida);

  const puntuadas = base
    .map((entrada) => ({ entrada, puntos: puntuarEntrada(entrada, consultaExpandida, tokensConsulta) }))
    .filter((r) => r.puntos > 0)
    .sort((a, b) => b.puntos - a.puntos);

  /* Segunda pasada: temas relacionados de los hits directos entran con
     prioridad baja, detrás de cualquier coincidencia directa. */
  const directas = new Set(puntuadas.map((r) => r.entrada.id));
  const relacionadas = new Set();
  for (const { entrada } of puntuadas) {
    for (const rel of entrada.relacionados || []) {
      if (!directas.has(rel)) relacionadas.add(rel);
    }
  }
  const porId = new Map(base.map((e) => [e.id, e]));
  const resultado = puntuadas.map((r) => r.entrada);
  for (const id of relacionadas) {
    const entrada = porId.get(id);
    if (entrada) resultado.push(entrada);
  }

  const seleccion = [];
  let usados = 0;
  for (const entrada of resultado) {
    if (seleccion.length >= maxEntradas) break;
    const coste = JSON.stringify(entrada).length;
    if (usados + coste > maxChars) continue;
    usados += coste;
    seleccion.push(entrada);
  }
  return seleccion;
}

/* Jerarquía de fuentes: menor número = mayor peso documental. Se usa para
   ordenar las referencias dentro del contexto (primero lo primario). */
const NIVEL_FUENTE = {
  "primaria": 0,
  "texto-historico": 0,
  "monografia-academica": 1,
  "estudio-academico": 2,
  "sintesis-academica": 3,
  "divulgacion-verificada": 4
};

function rangoFuente(ficha) {
  return NIVEL_FUENTE[ficha?.nivel] ?? 3;
}

/**
 * Formatea las entradas recuperadas como bloque de contexto para el prompt.
 * Es el único material autorizado que recibe el modelo.
 */
export function formatearContextoBase(entradas) {
  return entradas
    .map((e) => {
      const partes = [`[${e.id}] ${e.titulo} (nivel de certeza: ${e.certeza})`];
      for (const nombre of CAPAS_VALIDAS) {
        if (e.capas[nombre]) partes.push(`${ETIQUETAS_CAPA[nombre]}: ${e.capas[nombre]}`);
      }
      if (e.fuentes.length > 0) partes.push(`Fuentes registradas: ${e.fuentes.join("; ")}`);
      const refs = [...(e.referencias || [])]
        .map((ref) => ({ ref, ficha: cargarFuentes().get(ref.fuente) }))
        .filter((r) => r.ficha)
        .sort((a, b) => rangoFuente(a.ficha) - rangoFuente(b.ficha));
      for (const { ref, ficha } of refs) {
        const detalle = [
          `${ficha.autor}, ${ficha.titulo}`,
          ficha.editorial ? `${ficha.editorial}` : "",
          ficha.año ? `(${ficha.año})` : "",
          ref.capitulo ? `— cap. ${ref.capitulo}` : "",
          ref.paginas ? `pp. ${ref.paginas}` : "",
          ref.nota ? `(${ref.nota})` : ""
        ].filter(Boolean).join(" ");
        partes.push(`Referencia bibliográfica: ${detalle}`);
      }
      return partes.join("\n");
    })
    .join("\n\n---\n\n");
}
