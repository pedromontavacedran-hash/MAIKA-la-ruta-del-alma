/**
 * Textos de /lectura según el arcano mayor (0 = El Loco … 21 = El Mundo).
 * Cada tirada elige uno al azar entre 22; el signo zodiacal solo encabeza la pantalla.
 */
export type LecturaBloqueArcano = {
  semana: string;
  pincelada: string;
  fraseFinal: string;
};

export const LECTURA_POR_ARCANO: readonly LecturaBloqueArcano[] = [
  {
    semana:
      "Hoy huele a comienzo sin guion cerrado: lo que te anima no es imprudencia, es confianza en que puedes volver a empezar.\n\nNo necesitas tener el mapa entero. Basta con un paso honesto y un “sí” que no sea huida hacia delante.\n\nLo que cuenta es no fingir: el Loco avanza mejor cuando elige ligereza con conciencia, no con negación.",
    pincelada:
      "La carta te habla de salto y de fe medida.\n\nDe soltar el peso del qué dirán si ya no te cabe.\n\nY de un gesto pequeño que abre un ciclo nuevo sin dramatizarlo.",
    fraseFinal: "El primer paso no promete el final: promete movimiento real."
  },
  {
    semana:
      "Hoy tienes recursos a mano: manos, palabra, tiempo, ideas. El truco no es hacer más, es canalizar con intención.\n\nSi te dispersas, no es porque falte talento: es porque falta una elección clara de prioridad.\n\nCuando nombras lo que vas a usar de verdad, el Mago deja de ser postureo y se vuelve oficio.",
    pincelada:
      "La carta pone foco en la herramienta correcta, no en todas a la vez.\n\nTe recuerda que concentrar es un acto de poder.\n\nY que la magia cotidiana es cumplir lo que dices que harás.",
    fraseFinal: "Lo que materializas empieza por lo que eliges no diluir."
  },
  {
    semana:
      "Hoy conviene bajar el volumen exterior para oír lo que no grita: intuición, cuerpo, silencio útil.\n\nNo todo merece explicación inmediata; algunas respuestas llegan cuando dejas de forzar la pregunta.\n\nProtege tu espacio interior como quien guarda una llama: no es aislamiento, es lucidez.",
    pincelada:
      "La carta invita a esperar sin congelarte.\n\nA confiar en lo que ya sabes y aún no has dicho en voz alta.\n\nY a no ceder tu verdad por prisa de encajar.",
    fraseFinal: "Lo profundo no compite en ruido: gana en claridad."
  },
  {
    semana:
      "Hoy el cuidado y el placer no son lujo: son combustible. Lo que nutre también ordena.\n\nSi te sientes vacía o vacío, revisa dónde te negaste lo básico: descanso, belleza simple, vínculos cálidos.\n\nLa Emperatriz crece cuando deja de pedir permiso para ocupar su propio terreno.",
    pincelada:
      "La carta habla de abundancia que se siente, no que se presume.\n\nDe crear con manos y presencia.\n\nY de sembrar con paciencia lo que quieres cosechar.",
    fraseFinal: "Lo que alimentas con ternura, también te sostiene."
  },
  {
    semana:
      "Hoy pide estructura sin rigidez cruel: límites claros, calendario realista, responsabilidad contigo mismo.\n\nSi algo se tambalea, no siempre es falta de fuerza: a veces es falta de criterio y prioridad.\n\nEl Emperador manda mejor cuando protege el orden que permite vivir, no el que castiga.",
    pincelada:
      "La carta propone marco y ejemplo.\n\nTe pide coherencia entre lo que dices y lo que sostienes.\n\nY un “no” firme que también es cuidado.",
    fraseFinal: "La autoridad verdadera ordena para que la vida respire."
  },
  {
    semana:
      "Hoy aparecen normas, maestros, tradiciones: lo que ya funcionó antes y lo que la tribu espera.\n\nNo se trata de obedecer ciego: se trata de aprender con criterio y decidir qué adoptas y qué reformulas.\n\nEl Hierofante honra la enseñanza útil y cuestiona la repetición vacía.",
    pincelada:
      "La carta nombra pertenencia y sentido.\n\nTe invita a buscar guía sin entregar tu voz.\n\nY a traducir lo sagrado a gestos concretos en el día a día.",
    fraseFinal: "Aprender bien es elegir qué legado continúa en ti."
  },
  {
    semana:
      "Hoy el corazón y la elección comparten mesa: vínculos, contratos emocionales, dilemas que ya no admiten eterna ambigüedad.\n\nAlinear cabeza y cuerpo con lo que realmente quieres duele menos que sostener dos vidas a la vez.\n\nLos Enamorados piden honestidad, no drama.",
    pincelada:
      "La carta pone dos caminos y una verdad común: tú.\n\nNo te pide perfección: te pide coherencia.\n\nY un compromiso contigo antes que con la imagen.",
    fraseFinal: "Elegir es un acto de amor cuando deja de ser fuga."
  },
  {
    semana:
      "Hoy la voluntad tiene carretera: metas visibles, obstáculos que se sortean, un carro que avanza si tú sujetas riendas y caballos a la vez.\n\nDisciplina emocional y acción: sin eso, solo hay ruido de batalla.\n\nEl Carro gana cuando no confunde velocidad con dirección.",
    pincelada:
      "La carta habla de control fino, no de fuerza bruta.\n\nDe canalizar impulsos hacia un objetivo.\n\nY de no rendirte en la primera curva.",
    fraseFinal: "La victoria cotidiana es seguir con rumbo cuando cansas."
  },
  {
    semana:
      "Hoy la fuerza no es apretar más: es suavizar lo que resiste, domesticar lo interno con paciencia.\n\nSi algo te desborda, quizá necesitas otro tono, no más presión.\n\nLa Fuerza verdadera sonríe al tigre: no lo niega, lo nombra y lo acompaña.",
    pincelada:
      "La carta une coraje y tacto.\n\nTe recuerda que la valentía también es esperar el momento adecuado.\n\nY que la ternura puede ser límite, no debilidad.",
    fraseFinal: "Quien domina su miedo no lo aplasta: lo integra."
  },
  {
    semana:
      "Hoy conviene retirarse un paso: observar, revisar, encender la linterna en lo confuso.\n\nNo es huir: es dejar de actuar solo por ansiedad.\n\nEl Ermitaño encuentra respuestas cuando deja de iluminar todo el paisaje y elige un sendero.",
    pincelada:
      "La carta bendice la pausa útil.\n\nTe pide silencio con propósito.\n\nY una pregunta honesta en lugar de diez distracciones.",
    fraseFinal: "A veces avanzar es apagar ruido hasta oír tu norte."
  },
  {
    semana:
      "Hoy algo gira: suerte, timing, cambios que no pediste y aun así te mueven de sitio.\n\nNo todo depende de ti, pero tu actitud sí decide si el giro te rompe o te reubica.\n\nLa Rueda enseña ritmo: subidas y bajadas son parte del mismo viaje.",
    pincelada:
      "La carta habla de ciclos y aceptación activa.\n\nTe invita a soltar el control total sin rendirte a la deriva.\n\nY a aprovechar el tramo que toca con lucidez.",
    fraseFinal: "Cuando la vida gira, anclarte no es parar: es elegir dónde pisar."
  },
  {
    semana:
      "Hoy la balanza pide equidad: hechos, contratos, palabras que cuadren con la realidad.\n\nSi algo pesa, nombralo: la Justicia crece con la verdad medida, no con el castigo gratuito.\n\nAjusta cuentas contigo y con los demás sin confundir claridad con frialdad.",
    pincelada:
      "La carta propone mirada limpia.\n\nTe pide consecuencias justas, no venganza.\n\nY un acuerdo que puedas firmar con la conciencia tranquila.",
    fraseFinal: "Lo justo no siempre es cómodo, pero ordena el camino."
  },
  {
    semana:
      "Hoy toca perspectiva invertida: esperar, ceder control estratégico, ver lo que solo se ve desde otro ángulo.\n\nNo es perder: es soltar la lucha equivocada.\n\nEl Colgado regala una pausa que enseña si no la llenas de culpa.",
    pincelada:
      "La carta habla de suspensión con sentido.\n\nDe confiar en procesos que no controlas.\n\nY de dejar que el tiempo haga su parte sin abandonarte.",
    fraseFinal: "Cuelga la prisa: mira distinto y entenderás más."
  },
  {
    semana:
      "Hoy algo termina para transformarse: finales honestos, cierres, mudanzas internas.\n\nNo es melodrama: es vida que ya no cabe en la forma anterior.\n\nLa Muerte corta lo que caducó para que entre aire nuevo.",
    pincelada:
      "La carta no promete destrucción gratuita: promete renovación.\n\nTe pide soltar el nombre de lo que ya no es.\n\nY caminar liviano hacia lo siguiente.",
    fraseFinal: "Lo que muere de verdad te devuelve movilidad."
  },
  {
    semana:
      "Hoy mezclas aguas: templanza es calibrar, sanar sin prisa, integrar opuestos sin guerra.\n\nSi estás partido entre extremos, busca el tercer camino: hábitos suaves, ritmo, moderación consciente.\n\nLa Templanza cura cuando deja de exigirte perfección inmediata.",
    pincelada:
      "La carta propone alquimia cotidiana.\n\nUn paso medido vale más que un salto ansioso.\n\nY unir cabeza, cuerpo y corazón en una misma conversación.",
    fraseFinal: "El equilibrio no es mitad de nada: es mezcla sabia."
  },
  {
    semana:
      "Hoy aparecen ataduras tentadoras: placer fácil, deuda emocional, patrones que prometen control y roban oxígeno.\n\nNombrar el vínculo tóxico no te hace dramático: te devuelve opción.\n\nEl Diablo pierde fuerza cuando dejas de negar lo que ya sabes.",
    pincelada:
      "La carta enciende lucidez incómoda.\n\nTe pide honestidad sobre dependencias.\n\nY un primer paso pequeño hacia la libertad real.",
    fraseFinal: "Ver la cadena ya es empezar a soltarla."
  },
  {
    semana:
      "Hoy algo se derrumba para revelar verdad: choques, claridades bruscas, estructuras que ya no aguantaban.\n\nDuelen los golpes, pero a veces la Torre devuelve cielo abierto.\n\nReconstruye desde lo esencial, sin adornar el error.",
    pincelada:
      "La carta no celebra el caos: lo atraviesa con dignidad.\n\nTe invita a soltar lo falso rápido.\n\nY a no reconstruir la misma prisión con ladrillos nuevos.",
    fraseFinal: "Tras el estruendo, queda espacio para lo auténtico."
  },
  {
    semana:
      "Hoy una luz lejana vuelve a ser creíble: esperanza modesta, calma después del naufragio, fe que no necesita gritar.\n\nNo es negar problemas: es recordar que aún queda agua limpia para beber.\n\nLa Estrella riega heridas con paciencia.",
    pincelada:
      "La carta habla de guía suave y constancia.\n\nDe mirar al frente sin exigirte fe perfecta.\n\nY de permitirte desear otra vez.",
    fraseFinal: "La esperanza pequeña, sostenida, mueve semanas enteras."
  },
  {
    semana:
      "Hoy la intuición se mezcla con sombra: sueños, miedos proyectados, señales ambiguas.\n\nNo confundas sensación con certeza: anota, contrasta, respira.\n\nLa Luna enseña a transitar lo difuso sin perderte.",
    pincelada:
      "La carta honra lo simbólico y pide pies en la tierra.\n\nTe invita a discernir intuición de ansiedad.\n\nY a no tomar decisiones grandes solo en la niebla.",
    fraseFinal: "En la oscuridad útil, camina despacio y con nombre propio."
  },
  {
    semana:
      "Hoy lo claro vuelve: calor, vitalidad, reconocimiento sencillo.\n\nNo hace falta apagar a nadie para brillar: el Sol ilumina sin pedir aplauso eterno.\n\nDisfruta lo logrado y comparte luz sin quemarte.",
    pincelada:
      "La carta celebra la verdad visible.\n\nTe pide transparencia contigo.\n\nY alegría sin performance forzada.",
    fraseFinal: "Tu claridad contagia cuando no necesita dominar."
  },
  {
    semana:
      "Hoy un llamado resuena: despertar, revisión profunda, segunda oportunidad consciente.\n\nLo que dormía pide nombre; lo que pospusiste pide respuesta.\n\nEl Juicio reconcilia contigo misma versión que intentó hacerlo lo mejor que pudo.",
    pincelada:
      "La carta habla de liberación y propósito renovado.\n\nTe invita a contestar con el pecho abierto.\n\nY a dejar atrás vergüenzas que ya no te enseñan nada.",
    fraseFinal: "Levantarse no es borrar el pasado: es responder distinto."
  },
  {
    semana:
      "Hoy cierras un arco: integración, logro simbólico, sensación de “ya encaja”.\n\nNo es perfección total: es coherencia alcanzada con esfuerzo honesto.\n\nEl Mundo baila cuando dejas de perseguir una meta vacía y celebras lo vivido.",
    pincelada:
      "La carta corona un proceso.\n\nTe pide reconocimiento sin ego inflado.\n\nY a abrir la siguiente puerta sin tirar lo aprendido.",
    fraseFinal: "Lo que integras deja de perseguirte: empieza a sostenerte."
  }
];
