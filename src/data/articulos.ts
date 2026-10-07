/**
 * Artículos de MAIKA · Rutas del Alma — Fase 0 (primera tanda).
 *
 * Contenido editorial estático: sin CMS ni dependencias. Cada artículo es una
 * lista de bloques que `ArticuloPage` renderiza. En `parrafo` se admiten enlaces
 * internos con sintaxis `[texto](/ruta)` — el renderer solo acepta rutas que
 * empiezan por `/`, así que no se puede enlazar fuera por accidente.
 *
 * Segunda tanda (preparada, NO escribir todavía):
 * - Soñar con alguien que ya no está: duelo, memoria y símbolo
 * - Símbolos, no predicciones: por qué leemos sueños y cartas como espejo
 * - Cábala para empezar: qué es, qué no es y por dónde entrar sin perderte
 * - La carta que más temes es la que más puede enseñarte
 */

export type BloqueArticulo =
  | { tipo: "parrafo"; texto: string }
  | { tipo: "subtitulo"; texto: string }
  | { tipo: "lista"; items: string[] }
  | { tipo: "cita"; texto: string }
  | { tipo: "cta"; texto: string; ruta: string; etiqueta: string };

export interface Articulo {
  slug: string;
  titulo: string;
  /** Resumen corto para tarjetas y meta description (≤ ~160 caracteres). */
  extracto: string;
  /** ISO YYYY-MM-DD — fecha de publicación para JSON-LD. */
  fecha: string;
  lecturaMin: number;
  tema: "Sueños" | "MAIKA" | "Tarot" | "Cábala";
  bloques: BloqueArticulo[];
}

export const ARTICULOS: Articulo[] = [
  {
    slug: "sonar-con-agua",
    titulo: "Qué significa soñar con agua (y por qué no es lo mismo para todos)",
    extracto:
      "El agua es de los símbolos más buscados de los sueños. No tiene un significado único: depende del estado del agua, de lo que haces con ella y de tu momento vital.",
    fecha: "2026-09-22",
    lecturaMin: 6,
    tema: "Sueños",
    bloques: [
      {
        tipo: "parrafo",
        texto:
          "Si has llegado hasta aquí buscando «qué significa soñar con agua», la respuesta honesta empieza con una matización: no existe un significado único. Las tradiciones simbólicas —y también la psicología— coinciden en algo básico: el agua suele hablar de lo que se mueve por dentro. Emociones, cambios, lo que fluye o lo que está estancado. Pero cómo habla depende del sueño concreto y de quien lo sueña."
      },
      { tipo: "subtitulo", texto: "Primero: ¿cómo estaba el agua?" },
      {
        tipo: "parrafo",
        texto:
          "En la lectura simbólica, el estado del agua suele importar más que el agua misma. No es lo mismo un mar en calma que una riada, ni un vaso limpio que una charca turbia. Algunas lecturas habituales en la tradición de interpretación de sueños:"
      },
      {
        tipo: "lista",
        items: [
          "Agua clara y tranquila: suele asociarse con claridad emocional, calma o un momento de equilibrio.",
          "Agua turbia o estancada: a menudo se lee como confusión, emociones sin procesar o algo que lleva tiempo quieto y pide moverse.",
          "Mar agitado, olas, inundación: frecuentemente se interpreta como emociones que desbordan, una situación que se siente más grande que tú.",
          "Lluvia: puede leerse como limpieza, descarga o tristeza, según el tono del sueño.",
          "Río que fluye: suele hablar de cambio, de algo que está en movimiento y no se puede detener."
        ]
      },
      {
        tipo: "parrafo",
        texto:
          "Estas lecturas vienen de la tradición simbólica: son marcos de interpretación, no hechos científicos. Ninguna tabla de símbolos puede decirte qué significa tu sueño sin conocer tu sueño."
      },
      { tipo: "subtitulo", texto: "Segundo: ¿qué hacías tú con el agua?" },
      {
        tipo: "parrafo",
        texto:
          "El mismo mar significa cosas distintas si lo miras desde la orilla, si nadas en él o si te arrastra. Soñar que te ahogas no es lo mismo que soñar que cruzas un río. Tu papel dentro del sueño —observador, protagonista, víctima, nadador— es la segunda pista importante."
      },
      { tipo: "subtitulo", texto: "Tercero — y decisivo: tu momento vital" },
      {
        tipo: "parrafo",
        texto:
          "Una riada en el sueño de alguien que acaba de cambiar de ciudad no cuenta lo mismo que en el de alguien que atraviesa una pérdida. Por eso dos personas pueden soñar «lo mismo» y que no sea lo mismo. El símbolo es un espejo: lo que refleja depende de quién se mira."
      },
      {
        tipo: "cita",
        texto:
          "El símbolo no sentencia; pregunta. La pregunta útil no es «¿qué significa el agua?» sino «¿qué se está moviendo en mí?»."
      },
      { tipo: "subtitulo", texto: "Cómo leer tu propio sueño con agua" },
      {
        tipo: "lista",
        items: [
          "Anota el estado del agua antes de olvidarlo: limpia o turbia, quieta o en movimiento.",
          "Anota qué hacías tú y qué sentías al despertar — la emoción suele ser la clave del sueño.",
          "Pregunta qué de tu vida se parece a esa imagen ahora mismo.",
          "Desconfía de cualquier diccionario que te dé una sola respuesta cerrada."
        ]
      },
      {
        tipo: "parrafo",
        texto:
          "En MAIKA leemos los sueños así: como espejos, no como oráculos. Si quieres una lectura que tenga en cuenta tu relato completo —el agua, tu papel y tu emoción— puedes probar la interpretación de sueños de MAIKA. Es simbólica y orientativa: una forma de mirar tu sueño con más luz, no una verdad sobre ti."
      },
      {
        tipo: "cta",
        texto: "¿Soñaste con agua esta noche? Cuéntanos tu sueño completo: el contexto cambia la lectura.",
        ruta: "/suenos",
        etiqueta: "Interpretar mi sueño"
      },
      {
        tipo: "parrafo",
        texto:
          "Y si te interesa cómo entendemos los símbolos en general, puedes leer [qué es MAIKA · Rutas del Alma (y qué no es)](/articulos/que-es-maika-rutas-del-alma) o la lectura sobre [soñar que se te caen los dientes](/articulos/sonar-dientes-caen)."
      }
    ]
  },
  {
    slug: "sonar-dientes-caen",
    titulo: "Soñar que se te caen los dientes: qué suele estar detrás",
    extracto:
      "Es uno de los sueños más repetidos del mundo. Repasamos las lecturas simbólicas más habituales —vulnerabilidad, cambio, imagen— y cómo encontrar la tuya.",
    fecha: "2026-09-22",
    lecturaMin: 6,
    tema: "Sueños",
    bloques: [
      {
        tipo: "parrafo",
        texto:
          "Pocas imágenes oníricas son tan universales como esta: estás en el sueño, notas un diente flojo, lo tocas, y de pronto se te cae en la mano. O se te desmoronan todos a la vez. Despiertas con una sensación de alivio raro y una pregunta: ¿por qué soñé esto?"
      },
      {
        tipo: "parrafo",
        texto:
          "Es uno de los sueños más relatados en todo el mundo, en culturas muy distintas. Precisamente porque es tan común, acumula lecturas contradictorias: desde presagios antiguos hasta explicaciones psicológicas modernas. Conviene ordenarlas."
      },
      { tipo: "subtitulo", texto: "Qué dice la tradición popular" },
      {
        tipo: "parrafo",
        texto:
          "En la tradición popular de varios países, soñar con dientes que caen se ha leído como presagio —de pérdidas, de malas noticias, incluso de muertes. Es parte del folclore onírico. En MAIKA no trabajamos con presagios: los sueños no anuncian el futuro. Lo que esa tradición refleja, eso sí, es la carga de angustia que este sueño lleva siglos moviendo."
      },
      { tipo: "subtitulo", texto: "Qué sugiere la lectura simbólica" },
      {
        tipo: "parrafo",
        texto:
          "Los dientes son herramienta (morder, defenderse, alimentarse) y también escaparate (la sonrisa, la imagen ante otros). En clave simbólica, perderlos suele leerse por ahí:"
      },
      {
        tipo: "lista",
        items: [
          "Vulnerabilidad o pérdida de control: algo que se desmorona y no puedes sujetar.",
          "Imagen y vergüenza: miedo a quedar expuesto, a perder prestancia ante los demás.",
          "Cambio y renovación: los dientes también caen para dejar sitio — es la imagen de la infancia, de la etapa que termina.",
          "Comunicación: la boca habla; a veces se lee como palabras que se quedan atragantadas o dichas de más."
        ]
      },
      {
        tipo: "parrafo",
        texto:
          "Algunos psicólogos apuntan además a causas físicas simples: rechinar los dientes durmiendo (bruxismo) puede colarse en el sueño como sensación real. La lectura simbólica y la física no se excluyen."
      },
      { tipo: "subtitulo", texto: "El detalle que lo cambia todo: cómo se caen" },
      {
        tipo: "parrafo",
        texto:
          "No es lo mismo un diente que se afloja despacio que una dentadura que se deshace de golpe; ni caérsete en la mano que escupirlos en público. El matiz del sueño es el mensaje: lo gradual suele hablar de procesos, lo brusco de crisis, lo público de imagen, lo privado de algo íntimo."
      },
      {
        tipo: "cita",
        texto:
          "El sueño no dice «esto va a pasarte». Dice «esto se está moviendo en ti». La diferencia lo es todo."
      },
      { tipo: "subtitulo", texto: "Preguntas útiles para leer tu sueño" },
      {
        tipo: "lista",
        items: [
          "¿Dónde estabas y quién te miraba cuando caían? (imagen ante otros)",
          "¿Sentiste dolor, vergüenza, alivio o indiferencia? (la emoción orienta la lectura)",
          "¿Qué de tu vida «se afloja» ahora mismo: un proyecto, una relación, una certeza?",
          "¿Hay algo que no estás diciendo o algo que dijiste y te pesa?"
        ]
      },
      {
        tipo: "parrafo",
        texto:
          "En MAIKA interpretamos el sueño completo —la escena, tu papel y la emoción al despertar— porque el símbolo aislado dice poco. Si quieres una lectura simbólica y orientativa de tu sueño (no una profecía ni un diagnóstico), puedes contarlo tal como lo recuerdas."
      },
      {
        tipo: "cta",
        texto: "Cuéntanos el sueño con detalle: cómo caían, dónde estabas, qué sentiste al despertar.",
        ruta: "/suenos",
        etiqueta: "Interpretar mi sueño"
      },
      {
        tipo: "parrafo",
        texto:
          "También puede interesarte [qué significa soñar con agua](/articulos/sonar-con-agua), otro de los símbolos que más consultas generan."
      }
    ]
  },
  {
    slug: "que-es-maika-rutas-del-alma",
    titulo: "Qué es MAIKA · Rutas del Alma (y qué no es)",
    extracto:
      "Un espacio digital para explorar sueños, símbolos y tradiciones del alma con calma. Esto es lo que encontrarás en MAIKA — y lo que deliberadamente no somos.",
    fecha: "2026-09-22",
    lecturaMin: 5,
    tema: "MAIKA",
    bloques: [
      {
        tipo: "parrafo",
        texto:
          "MAIKA · Rutas del Alma es un espacio digital de exploración interior: interpretación de sueños, horóscopos, Tarot Evolutivo, y una sección didáctica —Rutas del Alma— dedicada a tradiciones como la Cábala y los 72 Nombres. Todo con el mismo marco: símbolos que invitan a mirarte, no sentencias que te dicen quién eres."
      },
      { tipo: "subtitulo", texto: "Qué encontrarás" },
      {
        tipo: "lista",
        items: [
          "Interpretación de sueños: cuentas tu sueño y recibes una lectura simbólica, con opción de profundizar.",
          "Horóscopo diario: una lectura por día, pensada como pausa y no como predicción.",
          "Tarot Evolutivo: las cartas como arquetipos de crecimiento, no como veredicto.",
          "Rutas del Alma: contenido didáctico sobre Cábala, los 72 Nombres y otras tradiciones, con un asistente que responde solo desde esa base documentada.",
          "Artículos como este: piezas escritas con calma para entender los símbolos antes de usarlos."
        ]
      },
      { tipo: "subtitulo", texto: "Qué no somos" },
      {
        tipo: "parrafo",
        texto:
          "Somos igual de claros con lo que no ofrecemos, porque la confianza se construye también por los límites:"
      },
      {
        tipo: "lista",
        items: [
          "No somos videntes ni hacemos predicciones. Ninguna lectura de MAIKA afirma saber tu futuro.",
          "No somos sustituto de ayuda profesional. Los contenidos son simbólicos y orientativos, no psicológicos, médicos ni terapéuticos.",
          "No somos una tienda en este momento: existe una sección de tienda en la web, pero está cerrada al público.",
          "No medimos tu alma: la analítica que usamos es agregada y anónima — sabemos qué secciones se visitan, nunca qué escribes en un sueño o en el chat."
        ]
      },
      { tipo: "subtitulo", texto: "El marco: símbolo, tradición e interpretación" },
      {
        tipo: "parrafo",
        texto:
          "En MAIKA distinguimos siempre tres planos: lo que la tradición dice (por ejemplo, cómo se ha leído históricamente una carta), el símbolo como lenguaje (lo que una imagen puede evocar) y tu interpretación personal (lo que resuena contigo hoy). No presentamos lecturas espirituales como hechos científicos, ni la tradición como imposición. Te damos el mapa; el territorio es tuyo."
      },
      {
        tipo: "cita",
        texto:
          "MAIKA no te dice quién eres. Te ofrece espejos bien hechos para que te mires tú."
      },
      {
        tipo: "parrafo",
        texto:
          "Si quieres empezar por algún sitio, el [Tarot Evolutivo](/servicios/tarot-evolutivo) explica bien nuestra forma de trabajar con símbolos, y [Rutas del Alma](/rutas-del-alma) es la puerta a la parte didáctica. Para conocer la historia y la persona detrás del proyecto, tienes la página [Sobre MAIKA](/sobre-maika)."
      }
    ]
  },
  {
    slug: "tarot-evolutivo-cartas-mapa",
    titulo: "El Tarot Evolutivo: las cartas como mapa, no como sentencia",
    extracto:
      "El Tarot Evolutivo no predice: propone. Las cartas funcionan como arquetipos que ayudan a ver dónde estás y hacia dónde puedes crecer.",
    fecha: "2026-09-22",
    lecturaMin: 6,
    tema: "Tarot",
    bloques: [
      {
        tipo: "parrafo",
        texto:
          "Cuando mucha gente oye «tarot» piensa en una pregunta y una respuesta cerrada: «¿me irá bien?» — «sí, y además en junio». El Tarot Evolutivo trabaja en otra dirección: las cartas no describen lo que te va a pasar, sino lo que te está pasando por dentro y hacia dónde puede crecer."
      },
      { tipo: "subtitulo", texto: "De dónde viene esta lectura" },
      {
        tipo: "parrafo",
        texto:
          "El tarot nació como juego de naipes en la Europa del Renacimiento y acumuló siglos de lectura simbólica. En el siglo XX, autores como Carl Jung (con la idea de arquetipos) y tarotistas como Alejandro Jodorowsky impulsaron una lectura evolutiva: las cartas como figuras universales de la experiencia humana — el inicio del camino, la crisis, la integración — en lugar de augurios."
      },
      {
        tipo: "parrafo",
        texto:
          "En esa tradición, La Muerte no anuncia una muerte: habla de una etapa que termina. La Torre no predice una catástrofe: describe el momento en que una estructura que ya no sirve se tambalea. La lectura deja de ser «qué pasará» y pasa a ser «qué está en juego»."
      },
      { tipo: "subtitulo", texto: "Mapa, no sentencia: qué cambia" },
      {
        tipo: "lista",
        items: [
          "La carta describe un territorio interior, no un evento futuro.",
          "La lectura propone preguntas («¿qué estructura se está agotando?»), no dicta respuestas.",
          "No hay cartas «malas»: hay energías incómodas con algo que enseñar.",
          "Quien consulta conserva el timón: la carta orienta, la decisión es siempre tuya."
        ]
      },
      {
        tipo: "cita",
        texto:
          "Una carta no te dice adónde vas. Te muestra dónde estás parado — y eso ya cambia el paso siguiente."
      },
      { tipo: "subtitulo", texto: "Un ejemplo: El Loco" },
      {
        tipo: "parrafo",
        texto:
          "El Loco —la carta sin número, la que abre y cierra el camino— suele leerse como impulsividad en clave predictiva. En clave evolutiva habla de otra cosa: del momento en que algo nuevo pide empezar sin garantías. La pregunta que propone no es «¿saldrá bien?» sino «¿qué estoy dispuesta o dispuesto a iniciar sin certeza?»."
      },
      { tipo: "subtitulo", texto: "Qué no es el Tarot Evolutivo" },
      {
        tipo: "parrafo",
        texto:
          "No es adivinación, no sustituye decisiones y no es una verdad sobre ti. Es una lectura simbólica y orientativa: un espejo con siglos de tradición detrás, que funciona mejor cuanto más honesta es la pregunta que le llevas."
      },
      {
        tipo: "parrafo",
        texto:
          "En MAIKA puedes conocer el enfoque completo en la página del [Tarot Evolutivo](/servicios/tarot-evolutivo). Y si lo que te trajo fue un sueño, la lectura simbólica de la [interpretación de sueños](/suenos) trabaja con la misma filosofía: símbolo, contexto y tu propia lectura."
      },
      {
        tipo: "cta",
        texto: "Descubre cómo leemos las cartas en MAIKA: arquetipos, preguntas y camino.",
        ruta: "/servicios/tarot-evolutivo",
        etiqueta: "Conocer el Tarot Evolutivo"
      }
    ]
  }
];

export function obtenerArticuloPorSlug(slug: string): Articulo | undefined {
  return ARTICULOS.find((a) => a.slug === slug);
}
