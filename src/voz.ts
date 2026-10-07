/** Narración por voz compartida entre la pantalla de interpretación y la lectura profunda. */

import { emitSpeechEnd, emitSpeechStart, emitSpeechWord } from "./utils/speechAvatarBus";

export function esVozEspanola(v: SpeechSynthesisVoice): boolean {
  return v.lang.toLowerCase().startsWith("es");
}

/** Voz cercana: femenina ES si existe; si no, Google / es-ES (voz de Google en español suele ser femenina por defecto). */
export function elegirVozFemeninaOCercanaEspanol(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voces = window.speechSynthesis.getVoices();
  if (voces.length === 0) return null;
  const n = (v: SpeechSynthesisVoice) => v.name.toLowerCase();
  const esMasculina = (v: SpeechSynthesisVoice) => /\bmale\b/i.test(n(v));
  return (
    voces.find((v) => esVozEspanola(v) && /\bfemale\b/i.test(n(v))) ||
    voces.find((v) => esVozEspanola(v) && /google/.test(n(v)) && !esMasculina(v)) ||
    voces.find((v) => /google/i.test(n(v)) && !esMasculina(v)) ||
    voces.find((v) => (v.lang === "es-ES" || v.lang.toLowerCase() === "es-es") && !esMasculina(v)) ||
    voces.find((v) => esVozEspanola(v) && !esMasculina(v)) ||
    voces.find(esVozEspanola) ||
    voces[0]
  );
}

/** Busca una voz concreta guardada por nombre entre las voces disponibles del navegador. */
export function buscarVozPorNombre(nombre: string): SpeechSynthesisVoice | null {
  if (!nombre.trim() || typeof window === "undefined" || !window.speechSynthesis) return null;
  return window.speechSynthesis.getVoices().find((v) => v.name === nombre) ?? null;
}

/** Texto pensado para oído: saltos → pausa, sin iconos que el motor pronuncie raro. */
export function prepararTextoParaVoz(texto: string): string {
  return texto
    .replace(/\r?\n+/g, ". ")
    .replace(/✨/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Frases del mensaje para lectura pausada y revelado progresivo del texto en pantalla. */
export function segmentosDesdeTexto(texto: string): string[] {
  const limpio = texto
    .replace(/✨/g, "")
    .replace(/\r?\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!limpio) return [];
  const partes = limpio
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return partes.length > 0 ? partes : [limpio];
}

let speechChainId = 0;
const PAUSA_ENTRE_FRASES_MS = 350;

/*
 * Mantiene la pantalla encendida mientras se narra: la lectura dura minutos sin tocar el
 * móvil y el sistema la apagaba a mitad (pantalla en negro aunque el audio seguía).
 * Screen Wake Lock no existe en todos los WebView: si falla, se sigue sin ella.
 */
type WakeLockSentinelLike = { release: () => Promise<void> };
let wakeLockSentinel: WakeLockSentinelLike | null = null;
let narracionEnCurso = false;

async function pedirPantallaDespierta() {
  if (typeof navigator === "undefined") return;
  const wl = (navigator as { wakeLock?: { request: (tipo: string) => Promise<WakeLockSentinelLike> } }).wakeLock;
  if (!wl) return;
  try {
    wakeLockSentinel = await wl.request("screen");
  } catch {
    wakeLockSentinel = null;
  }
}

function soltarPantallaDespierta() {
  narracionEnCurso = false;
  const s = wakeLockSentinel;
  wakeLockSentinel = null;
  if (s) void s.release().catch(() => undefined);
}

/* El sistema suelta el wake-lock al ocultar la app; se repide al volver si seguía narrando. */
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && narracionEnCurso && !wakeLockSentinel) {
      void pedirPantallaDespierta();
    }
  });
}

/**
 * Matices gratis por frase (nada de voz de pago): ligera entonación de pregunta/exclamación,
 * una pizca de variación aleatoria para que no suene siempre clavado igual, y pausa distinta
 * según cómo termine la frase (más larga tras «!»/«?» que tras un punto normal).
 */
function matizFrase(
  segmentoTexto: string,
  velocidadBase: number,
  tonoBase: number
): { rate: number; pitch: number; pausaMs: number } {
  const ultimo = segmentoTexto.trim().slice(-1);
  const jitter = 0.97 + Math.random() * 0.06; // ±3%, evita que cada frase suene idéntica
  if (ultimo === "?") {
    return { rate: velocidadBase * jitter, pitch: Math.min(2, tonoBase * 1.08), pausaMs: 420 };
  }
  if (ultimo === "!") {
    return { rate: Math.min(2, velocidadBase * 1.04 * jitter), pitch: Math.min(2, tonoBase * 1.1), pausaMs: 420 };
  }
  return { rate: velocidadBase * jitter, pitch: tonoBase, pausaMs: PAUSA_ENTRE_FRASES_MS };
}

/**
 * Varios utterances + pausa breve: ritmo de conversación, no bloque leído.
 * Si se pasa `onProgreso`, el texto revelado se guía por los eventos reales de la voz
 * (`boundary` por palabra + `end` por frase) en vez de un cronómetro aproximado: así el
 * texto en pantalla queda exactamente sincronizado con lo que se está narrando, a la
 * velocidad que sea (la del propio motor de voz), en vez de una estimación.
 */
export function hablarNatural(
  texto: string,
  narrar: boolean,
  vozPreferida?: SpeechSynthesisVoice | null,
  velocidad = 0.9,
  tono = 1,
  onProgreso?: (visible: string) => void,
  onFin?: () => void
) {
  if (!narrar || typeof window === "undefined" || !window.speechSynthesis) {
    onFin?.();
    return;
  }
  const myId = ++speechChainId;
  window.speechSynthesis.cancel();
  const segmentos = segmentosDesdeTexto(texto).map(prepararTextoParaVoz);
  if (segmentos.length === 0) {
    onFin?.();
    return;
  }
  narracionEnCurso = true;
  void pedirPantallaDespierta();
  const finYLiberar = () => {
    soltarPantallaDespierta();
    onFin?.();
  };
  let i = 0;
  let pausaTimer: number | null = null;
  let revelado = "";

  const limpiarPausa = () => {
    if (pausaTimer != null) {
      window.clearTimeout(pausaTimer);
      pausaTimer = null;
    }
  };

  const aplicarVoz = (u: SpeechSynthesisUtterance, rate: number, pitch: number) => {
    const voz = vozPreferida ?? elegirVozFemeninaOCercanaEspanol();
    if (voz) u.voice = voz;
    u.lang = "es-ES";
    u.rate = rate;
    u.pitch = pitch;
    u.volume = 1;
  };

  function siguiente() {
    if (myId !== speechChainId) return;
    if (i >= segmentos.length) {
      finYLiberar();
      return;
    }
    const segmentoTexto = segmentos[i];
    const prefijo = revelado;
    const matiz = matizFrase(segmentoTexto, velocidad, tono);
    const u = new SpeechSynthesisUtterance(segmentoTexto);
    aplicarVoz(u, matiz.rate, matiz.pitch);

    let timerFrase: number | null = null;
    let boundaryRecibido = false;
    const limpiarTimerFrase = () => {
      if (timerFrase != null) {
        window.clearInterval(timerFrase);
        timerFrase = null;
      }
    };

    if (onProgreso) {
      u.onboundary = (ev) => {
        if (myId !== speechChainId) return;
        if (ev.name && ev.name !== "word") return;
        boundaryRecibido = true;
        limpiarTimerFrase();
        emitSpeechWord();
        const hasta = Math.min(segmentoTexto.length, Math.max(0, ev.charIndex + (ev.charLength || 0)));
        onProgreso(prefijo ? `${prefijo} ${segmentoTexto.slice(0, hasta)}` : segmentoTexto.slice(0, hasta));
      };
    }

    let finalizado = false;
    let finTimer: number | null = null;
    const avanzar = () => {
      if (myId !== speechChainId || finalizado) return;
      finalizado = true;
      limpiarPausa();
      limpiarTimerFrase();
      if (finTimer != null) {
        window.clearTimeout(finTimer);
        finTimer = null;
      }
      emitSpeechEnd();
      revelado = prefijo ? `${prefijo} ${segmentoTexto}` : segmentoTexto;
      onProgreso?.(revelado);
      i += 1;
      if (i >= segmentos.length) {
        finYLiberar();
        return;
      }
      pausaTimer = window.setTimeout(siguiente, matiz.pausaMs);
    };
    u.onend = avanzar;
    u.onerror = avanzar;

    // No dependemos de `onstart` (hay navegadores/voces que no lo disparan bien):
    // el avatar arranca a "hablar" en el mismo instante en que se manda a decir la frase.
    emitSpeechStart();
    window.speechSynthesis.speak(u);

    // Temporización de reserva: si el navegador no dispara `onend`/`onerror`, forzamos
    // el avance justo después de que el cronómetro de revelado termine la frase.
    const msPorLetra = Math.max(8, Math.round(60 / matiz.rate));
    const duracionMaxima = Math.max(4000, Math.ceil(segmentoTexto.length * msPorLetra) + 4000);
    finTimer = window.setTimeout(avanzar, duracionMaxima);

    // Avatar: la "boca" se anima con las palabras reales si llegan (`boundary`); si no
    // (muchas voces, incluida "Google es-US" en varios navegadores, no las mandan), con
    // el mismo cronómetro letra a letra que ya escribe el texto de esta frase.
    if (onProgreso) {
      const caracteresFrase = Array.from(segmentoTexto);
      if (caracteresFrase.length > 0) {
        let idx = 0;
        timerFrase = window.setInterval(() => {
          if (myId !== speechChainId || boundaryRecibido) {
            limpiarTimerFrase();
            return;
          }
          idx += 1;
          emitSpeechWord();
          onProgreso(prefijo ? `${prefijo} ${segmentoTexto.slice(0, idx)}` : segmentoTexto.slice(0, idx));
          if (idx >= caracteresFrase.length) {
            limpiarTimerFrase();
            /*
             * Sin `boundary` (WebView Android y voces que no emiten eventos) `onend`
             * puede no dispararse nunca: el avance lo lleva el cronómetro y la lectura
             * sigue fluida, sin esperas muertas entre frases. Los utterances se encolan
             * en el motor de voz, así que el audio no se solapa. Si `onend` sí llega,
             * el guard `finalizado` evita el doble avance.
             */
            avanzar();
          }
        }, msPorLetra);
      }
    }
  }
  siguiente();
}

/** Suspende el utterance actual; los segmentos siguientes quedan encolados hasta reanudar. */
export function pausarNarracion() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.pause();
  }
}

/** Reanuda una narración pausada. */
export function reanudarNarracion() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.resume();
  }
}

/** Cancela cualquier narración en curso e invalida las cadenas de habla pendientes. */
export function detenerNarracion() {
  speechChainId += 1;
  soltarPantallaDespierta();
  emitSpeechEnd();
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
