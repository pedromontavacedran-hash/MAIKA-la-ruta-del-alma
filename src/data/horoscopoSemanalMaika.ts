/**
 * Horóscopo semanal MAIKA: sustituye `HOROSCOPE_MAIKA_SEMANA` cada semana (5–10 min).
 * Mismo prompt base en IA; pega aquí el resultado y ajusta tono si hace falta.
 *
 * Carta + clave: deben reforzar el mensaje del signo (no al azar). La clave son 3–6 palabras.
 */

export type HoroscopoSignoId =
  | "aries"
  | "tauro"
  | "geminis"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "escorpio"
  | "sagitario"
  | "capricornio"
  | "acuario"
  | "piscis";

export type BloqueHoroscopoSigno = {
  id: HoroscopoSignoId;
  nombre: string;
  /** Arcano mayor (nombre solo). */
  cartaTarot: string;
  /** Micro interpretación breve (3–6 palabras), alineada con el mensaje del signo. */
  cartaTarotClave: string;
  /** Líneas cortas (máx. ~3 en total para el bloque general) */
  general: string[];
  amor: string;
  trabajo: string;
};

export type HoroscopoSemanaMaika = {
  /** Ej.: "14–20 abril 2026" */
  periodoEtiqueta: string;
  /** Texto breve opcional sobre la energía de la semana (una frase) */
  introduccion?: string;
  signos: BloqueHoroscopoSigno[];
};

/** Orden clásico del zodiaco (Aries → Piscis), alineado con fechas del año astrológico. */
export const ORDEN_SIGNOS_ZODIACO: HoroscopoSignoId[] = [
  "aries",
  "tauro",
  "geminis",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "escorpio",
  "sagitario",
  "capricornio",
  "acuario",
  "piscis"
];

/** Devuelve los bloques en orden zodiacal aunque en el JSON vengan desordenados. */
export function signosEnOrdenZodiacal(signos: BloqueHoroscopoSigno[]): BloqueHoroscopoSigno[] {
  const porId = new Map(signos.map((s) => [s.id, s]));
  return ORDEN_SIGNOS_ZODIACO.map((id) => porId.get(id)).filter((s): s is BloqueHoroscopoSigno => s != null);
}

/** Semana actual en web: edita este objeto al publicar cada horóscopo. */
export const HOROSCOPE_MAIKA_SEMANA: HoroscopoSemanaMaika = {
  periodoEtiqueta: "14–20 abril 2026",
  introduccion:
    "Una semana para afinar la escucha interior: lo que asoma no pide prisa, sino presencia.",
  signos: [
    {
      id: "aries",
      nombre: "Aries",
      cartaTarot: "El Emperador",
      cartaTarotClave: "Voluntad y primer paso",
      general: [
        "Te conviene bajar un punto el ritmo sin renunciar a la claridad: lo importante es elegir bien el primer paso.",
        "Si algo te frustra, pregúntate si estás peleando con el momento o con el mensaje que te llega."
      ],
      amor: "La sinceridad ordena el vínculo: un gesto pequeño vale más que un discurso largo.",
      trabajo: "Prioriza una tarea y ciérrala antes de abrir tres frentes; la energía rinde si no se dispersa."
    },
    {
      id: "tauro",
      nombre: "Tauro",
      cartaTarot: "La Emperatriz",
      cartaTarotClave: "Abundancia que arraiga",
      general: [
        "Tu estabilidad interior es un recurso: no la confundas con terquedad cuando pide flexibilidad.",
        "Buen momento para reorganizar lo cotidiano: lo simple, bien hecho, te devuelve calma."
      ],
      amor: "El cariño se nutre de constancia y de escucha; evita suposiciones que no has nombrado.",
      trabajo: "Un acuerdo tácito puede aclararse con una conversación breve y concreta; no pospongas lo evidente."
    },
    {
      id: "geminis",
      nombre: "Géminis",
      cartaTarot: "El Mago",
      cartaTarotClave: "Ideas que conectan",
      general: [
        "La mente va rápida: anota lo esencial antes de que se mezcle con el ruido.",
        "Intercambiar ideas está bien; comprometerte solo con lo que puedes sostener es mejor."
      ],
      amor: "Las palabras importan, pero también el tono: elige una frase clara en lugar de diez vueltas.",
      trabajo: "Evita multitarea forzada; dos cosas bien terminadas te darán más tranquilidad que cinco a medias."
    },
    {
      id: "cancer",
      nombre: "Cáncer",
      cartaTarot: "La Sacerdotisa",
      cartaTarotClave: "Escucha y protección",
      general: [
        "Tu sensibilidad es información, no un fallo: separa intuición de miedo con calma.",
        "Cuidar el espacio emocional no es egoísmo; es condición para dar con generosidad real."
      ],
      amor: "Pedir lo que necesitas con suavidad abre puertas; esperar a que adivinen genera desgaste.",
      trabajo: "Si algo te pesa, ponle nombre antes de cargar con todo: pedir apoyo es madurez."
    },
    {
      id: "leo",
      nombre: "Leo",
      cartaTarot: "El Sol",
      cartaTarotClave: "Luz y reconocimiento",
      general: [
        "Tu luz no necesita competir: brilla más cuando compartes escenario sin miedo a quedar menos.",
        "Reconoce lo logrado y ajusta el siguiente objetivo; el reconocimiento propio también cuenta."
      ],
      amor: "El afecto pide presencia, no performance: un momento auténtico vale más que un plan perfecto.",
      trabajo: "Liderar es también delegar con criterio; no confundas control con responsabilidad."
    },
    {
      id: "virgo",
      nombre: "Virgo",
      cartaTarot: "El Ermitaño",
      cartaTarotClave: "Detalle con sentido",
      general: [
        "El detalle te sirve si no se convierte en ansiedad: define “suficiente” y respira.",
        "Orden exterior ayuda, pero el equilibrio viene de no exigirte perfección imposible."
      ],
      amor: "Pequeños gestos cotidianos construyen confianza; el cariño también es método.",
      trabajo: "Una lista corta y cumplida te dará más paz que una larga que solo miras con culpa."
    },
    {
      id: "libra",
      nombre: "Libra",
      cartaTarot: "La Justicia",
      cartaTarotClave: "Equilibrio honesto",
      general: [
        "Buscar armonía no implica evitar el conflicto necesario: a veces clarificar incomoda y alivia.",
        "Tu buen criterio social es don: úsalo para elegir, no solo para complacer."
      ],
      amor: "Equilibrio es acuerdo honesto; si algo te descentra, nómbralo con tacto y firmeza.",
      trabajo: "Evita decir sí por imagen; una negociación serena protege tu tiempo y tu reputación."
    },
    {
      id: "escorpio",
      nombre: "Escorpio",
      cartaTarot: "La Muerte",
      cartaTarotClave: "Renovar sin miedo",
      general: [
        "Lo profundo te llama: no todo merece tu intensidad; elige dónde invertirla.",
        "Soltar el control simbólico puede abrirte a una renovación que intuías pero no atrevías."
      ],
      amor: "La intimidad crece con verdad medida: confianza se construye paso a paso, no de golpe.",
      trabajo: "Investiga antes de fusionarte con un proyecto ajeno; tu instinto va bien acompañado de datos."
    },
    {
      id: "sagitario",
      nombre: "Sagitario",
      cartaTarot: "El Carro",
      cartaTarotClave: "Avance y dirección",
      general: [
        "La expansión es bella si tiene norte: una meta clara evita que te pierdas en estimulos.",
        "Una conversación honesta puede cambiar tu mapa más que mil planes abstractos."
      ],
      amor: "Compartir horizontes une; imponerlos aleja. Deja espacio a la otra historia.",
      trabajo: "Formación o proyectos nuevos: buen tramo si cierras lo pendiente antes de embarcarte en otra odisea."
    },
    {
      id: "capricornio",
      nombre: "Capricornio",
      cartaTarot: "El Mundo",
      cartaTarotClave: "Meta y perseverancia",
      general: [
        "Tu constancia es oro: no la confundas con aguantar lo que ya no tiene sentido.",
        "Reconocer límites no te hace menos ambicioso; te hace más sostenible."
      ],
      amor: "Compromiso es también cuidado mutuo; programa tiempo de calidad, no solo deberes.",
      trabajo: "Un paso estratégico vale más que diez apuros; revisa prioridades sin dramatizar."
    },
    {
      id: "acuario",
      nombre: "Acuario",
      cartaTarot: "La Estrella",
      cartaTarotClave: "Visión y coherencia",
      general: [
        "Tu mirada original es regalo: compártela sin aislarte en la torre de lo “diferente”.",
        "La libertad interior también pide coherencia con lo que dices y haces."
      ],
      amor: "El vínculo mejora si nombras lo que sientes sin traducirlo solo a teoría.",
      trabajo: "Equipos y causas: aporta idea y también seguimiento; la innovación necesita pies en el suelo."
    },
    {
      id: "piscis",
      nombre: "Piscis",
      cartaTarot: "La Luna",
      cartaTarotClave: "Intuición y límites",
      general: [
        "Tu mundo interior es rico: pon límites suaves a lo que te absorbe sin pedir permiso.",
        "La empatía sana distingue entre acompañar y cargar con lo ajeno."
      ],
      amor: "Romanticismo sí, pero con pies en la tierra: acuerdos claros protegen la magia.",
      trabajo: "Canaliza la creatividad en plazos realistas; terminar algo pequeño te devolverá confianza."
    }
  ]
};
