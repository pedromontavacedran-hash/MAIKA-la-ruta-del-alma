import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LecturaProfunda, type SuenoChatMensaje, type SuenoPremiumLocationState } from "./pages/SuenoPremiumPage";
import { detenerNarracion, esVozEspanola, hablarNatural } from "./voz";
import { MaikaAvatar } from "./components/MaikaAvatar";
import "./Sueno.css";
import {
  consultarEstadoSueno,
  interpretarSuenoRemoto,
  PROFUNDIZAR_ERROR_GENERICO,
  profundizarSuenoRemoto
} from "./services/apiSueno";

const INTERPRETAR_TIMEOUT_MS = 55_000;

const MSG_VACIO =
  "Escribe tu sueño con un poco de detalle para poder interpretarlo con la IA.";

/** Pregunta rápida de contexto antes de interpretar: mejora la lectura sin tocar el backend (se añade al texto enviado). */
const PREGUNTA_CONTEXTO = "¿Cómo te sentiste al despertar de este sueño?";
const CONTEXTO_AYUDA = "Tu emoción también nos ayuda a comprender mejor su mensaje.";
const CHIPS_CONTEXTO = [
  "Tranquila/o",
  "Feliz",
  "Confusa/o",
  "Triste",
  "Ansiosa/o"
] as const;

function puedeProfundizar(textoSueno: string, mensajeResultado: string): boolean {
  const t = textoSueno.trim();
  const r = mensajeResultado.trim();
  if (t.length < 2) return false;
  if (!r || r === MSG_VACIO) return false;
  if (r === "Interpretando tu sueño...") return false;
  return r.length >= 40;
}

const PROFUNDIZAR_TIMEOUT_MS = 45_000;
/**
 * Límite de preguntas gratis del "Pregunta a Maika" por sueño interpretado: cada pregunta es una
 * llamada de pago a la IA, así que sin tope el coste de API escala con quien más pregunte. No es
 * memoria permanente ni backend: solo cuenta los mensajes de usuario ya en `historialProfundizar`,
 * que ya se reinicia solo al interpretar un sueño nuevo.
 */
const PREGUNTAS_PROFUNDIZAR_MAX = 1;


export default function Sueno() {
  const [sueno, setSueno] = useState("");
  const [resultado, setResultado] = useState("");
  /** Datos para incrustar la lectura profunda debajo, sin cambiar de pantalla; `null` = oculta. */
  const [premium, setPremium] = useState<SuenoPremiumLocationState | null>(null);
  const [narrarVoz, setNarrarVoz] = useState(true);
  /** Solo para ir probando voces del navegador; vacío = automática (`elegirVozFemeninaOCercanaEspanol`). */
  const [vocesDisponibles, setVocesDisponibles] = useState<SpeechSynthesisVoice[]>([]);
  const [vozElegidaNombre, setVozElegidaNombre] = useState("");
  /** Velocidad de narración para pruebas (speechSynthesis `rate`, 0.6–1.4). En móvil arranca en 0.9 · Normal. */
  const [velocidadVoz, setVelocidadVoz] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches ? "0.9" : "1.15"
  );
  /** Tono de narración para pruebas (speechSynthesis `pitch`, 0.7–1.3). En móvil arranca en 1.0 · Neutro. */
  const [tonoVoz, setTonoVoz] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches ? "1" : "0.85"
  );
  const navigate = useNavigate();
  /** Texto mostrado en el recuadro: se revela letra a letra; `null` = usar `resultado` completo. */
  const [textoRevelado, setTextoRevelado] = useState<string | null>(null);
  /** `true` solo cuando el texto terminó de escribirse por completo (gate del botón Profundizar). */
  const [lecturaTerminada, setLecturaTerminada] = useState(false);
  /** `true` mientras se muestra la pregunta de contexto previa a interpretar. */
  const [pidiendoContexto, setPidiendoContexto] = useState(false);
  const [respuestaContexto, setRespuestaContexto] = useState("");
  /**
   * "Profundizar con Maika": conversación libre sobre el sueño ya interpretado. `suenoOriginal` y
   * `emocionDespertar` son una foto fija de lo que realmente se envió a interpretar (no el `sueno`/
   * `respuestaContexto` en vivo, que el usuario podría seguir editando después). La interpretación
   * inicial ya vive en `resultado`, así que no se duplica.
   */
  const [suenoOriginal, setSuenoOriginal] = useState("");
  const [emocionDespertar, setEmocionDespertar] = useState("");
  /** Timestamp (ms) hasta el que rige el límite de 1 sueño gratis/24 h; 0 = puede interpretar. */
  const [suenoBloqueadoHasta, setSuenoBloqueadoHasta] = useState(0);
  /** Duración real del descanso entre interpretaciones gratuitas (la da el backend). */
  const suenoCooldownMsRef = useRef(0);
  /** Reloj interno para que la cuenta atrás se actualice sin recargar. */
  const [ahoraMs, setAhoraMs] = useState(() => Date.now());
  const [historialProfundizar, setHistorialProfundizar] = useState<SuenoChatMensaje[]>([]);
  const [preguntaProfundizar, setPreguntaProfundizar] = useState("");
  const [cargandoProfundizar, setCargandoProfundizar] = useState(false);
  const [errorProfundizar, setErrorProfundizar] = useState("");
  const interpretAbortRef = useRef<AbortController | null>(null);
  const reveladoTimerRef = useRef<number | null>(null);
  const interpretIdRef = useRef(0);
  const contextoTextareaRef = useRef<HTMLTextAreaElement>(null);
  const profundizarAbortRef = useRef<AbortController | null>(null);
  /** Revelado progresivo de la respuesta de "Pregunta a Maika", con voz si está activada. */
  const chatRevelaIdRef = useRef(0);
  const chatRevelaTimerRef = useRef<number | null>(null);
  const [revelaChat, setRevelaChat] = useState<{ completo: string; visible: string } | null>(null);
  const tuvoRevelaChatRef = useRef(false);
  /** Recuadro del resultado con scroll propio: se auto-desplaza mientras se revela el texto. */
  const cajaResultadoRef = useRef<HTMLDivElement>(null);
  const entradaProfundaRef = useRef<HTMLDivElement>(null);

  /** Al entrar al interpretador: si ya se usó la gratuita de hoy, se muestra el bloqueo directamente. */
  useEffect(() => {
    void consultarEstadoSueno().then(({ restanteMs, cooldownMs }) => {
      suenoCooldownMsRef.current = cooldownMs;
      if (restanteMs > 0) setSuenoBloqueadoHasta(Date.now() + restanteMs);
    });
  }, []);

  useEffect(() => {
    if (suenoBloqueadoHasta <= Date.now()) return;
    const id = window.setInterval(() => setAhoraMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [suenoBloqueadoHasta]);

  useLayoutEffect(() => {
    const caja = cajaResultadoRef.current;
    const entrada = entradaProfundaRef.current;
    if (!premium || !caja || !entrada) return;
    const top = caja.scrollTop + entrada.getBoundingClientRect().top - caja.getBoundingClientRect().top - caja.clientTop - 18;
    caja.scrollTo({ top, behavior: "instant" });
  }, [premium]);

  /**
   * Mientras se revela la lectura, la página sigue el final del contenido: en móvil el avatar
   * empuja la caja fuera de pantalla y sin esto el usuario ve solo negro durante la narración.
   * Si el usuario sube la página a releer, se deja de seguir; si vuelve abajo, se retoma.
   */
  const seguirLecturaRef = useRef(true);
  const ultimoScrollRef = useRef(0);
  /**
   * Cuando el recuadro se vacía al arrancar el revelado (de "Interpretando tu sueño..." a texto
   * vacío) la página encoge y el propio `scrollTop` forzado más abajo baja de valor: sin esta
   * bandera el listener de scroll lo confundía con "el usuario subió a releer" y desactivaba el
   * seguimiento justo al empezar a narrar, dejando la vista clavada en el hueco vacío de abajo
   * (pantalla en negro) aunque el usuario nunca tocó la pantalla.
   */
  const scrollProgramaticoRef = useRef(false);

  useEffect(() => {
    const sp = document.querySelector<HTMLElement>(".app-shell__routes-grow");
    if (!sp) return undefined;
    ultimoScrollRef.current = sp.scrollTop;
    const onScroll = () => {
      const st = sp.scrollTop;
      if (scrollProgramaticoRef.current) {
        ultimoScrollRef.current = st;
        return;
      }
      if (st < ultimoScrollRef.current - 4) {
        seguirLecturaRef.current = false;
      } else if (st >= sp.scrollHeight - sp.clientHeight - 60) {
        seguirLecturaRef.current = true;
      }
      ultimoScrollRef.current = st;
    };
    sp.addEventListener("scroll", onScroll, { passive: true });
    return () => sp.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!resultado || !seguirLecturaRef.current) return;
    const sp = document.querySelector<HTMLElement>(".app-shell__routes-grow");
    if (!sp) return;
    scrollProgramaticoRef.current = true;
    sp.scrollTop = sp.scrollHeight;
    window.requestAnimationFrame(() => {
      scrollProgramaticoRef.current = false;
    });
    /*
     * `lecturaTerminada` entra aquí aunque no se lea dentro: al terminar la narración aparece el
     * bloque "Pregunta a Maika" (crece el recuadro), pero `textoRevelado` ya suele valer lo mismo
     * justo antes de ese cambio (el revelado ya había alcanzado el texto final), así que sin esta
     * dependencia el efecto no se repetía y la pantalla general se quedaba clavada donde estaba
     * mientras el recuadro interior sí bajaba.
     */
  }, [resultado, textoRevelado, revelaChat, historialProfundizar, lecturaTerminada]);

  useEffect(() => {
    if (textoRevelado === null) return;
    const el = cajaResultadoRef.current;
    if (!el) return;
    const distanciaAlFondo = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanciaAlFondo < 80) {
      el.scrollTop = el.scrollHeight;
    }
  }, [textoRevelado]);

  useEffect(() => {
    const el = cajaResultadoRef.current;
    if (!el || !revelaChat) return;
    el.scrollTop = el.scrollHeight;
  }, [revelaChat]);

  /** Cuando termina de narrar/escribir la interpretación, baja el scroll del
   *  recuadro de resultado hasta el final, donde está la pregunta. */
  useEffect(() => {
    if (!lecturaTerminada || premium) return;
    const el = cajaResultadoRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [lecturaTerminada, premium]);

  /** Lo mismo tras revelar la respuesta del chat gratis, para que se vea el CTA de pago. */
  useEffect(() => {
    if (revelaChat) {
      tuvoRevelaChatRef.current = true;
      return;
    }
    if (!tuvoRevelaChatRef.current) return;
    tuvoRevelaChatRef.current = false;
    const el = cajaResultadoRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [revelaChat]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return undefined;
    const warmVoices = () => {
      const todas = window.speechSynthesis.getVoices();
      const espanolas = todas.filter(esVozEspanola);
      const lista = espanolas.length > 0 ? espanolas : todas;
      // Solo la voz "Google español de Estados Unidos": se quitan todas las demás
      // del desplegable. Si el navegador no la tiene, se cae a la lista completa.
      const googleEsUS = lista.filter((v) => /google/i.test(v.name) && v.lang.toLowerCase() === "es-us");
      const listaFinal = googleEsUS.length > 0 ? googleEsUS : lista;
      setVocesDisponibles(listaFinal);
      if (googleEsUS.length > 0) {
        setVozElegidaNombre((prev) => (prev === "" ? googleEsUS[0].name : prev));
      }
    };
    warmVoices();
    window.speechSynthesis.addEventListener("voiceschanged", warmVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", warmVoices);
    };
  }, []);

  useEffect(() => {
    return () => {
      interpretAbortRef.current?.abort();
      profundizarAbortRef.current?.abort();
      if (reveladoTimerRef.current != null) {
        window.clearInterval(reveladoTimerRef.current);
      }
      if (chatRevelaTimerRef.current != null) {
        window.clearInterval(chatRevelaTimerRef.current);
      }
      chatRevelaIdRef.current += 1;
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const onInterpretarClick = (contexto = "") => {
    const texto = sueno.trim();
    const narrar = narrarVoz;
    const velocidad = Number(velocidadVoz) || 0.9;
    const tono = Number(tonoVoz) || 1;

    detenerNarracion();

    if (reveladoTimerRef.current != null) {
      window.clearInterval(reveladoTimerRef.current);
      reveladoTimerRef.current = null;
    }
    if (chatRevelaTimerRef.current != null) {
      window.clearInterval(chatRevelaTimerRef.current);
      chatRevelaTimerRef.current = null;
    }
    chatRevelaIdRef.current += 1;
    setRevelaChat(null);
    setTextoRevelado(null);
    setLecturaTerminada(false);

    interpretAbortRef.current?.abort();

    const myId = ++interpretIdRef.current;
    const vozElegida = vocesDisponibles.find((v) => v.name === vozElegidaNombre) ?? null;

    const aplicarMensaje = (mensajeFinal: string) => {
      if (myId !== interpretIdRef.current) return;
      setResultado(mensajeFinal);
      setTextoRevelado("");
      setLecturaTerminada(false);

      const caracteres = Array.from(mensajeFinal);
      if (caracteres.length === 0) {
        setLecturaTerminada(true);
        return;
      }

      if (narrar) {
        // Con voz: el texto sigue exactamente lo que se va narrando (eventos reales
        // de la voz), no una estimación aparte que puede desincronizarse.
        window.setTimeout(() => {
          if (myId !== interpretIdRef.current) return;
          hablarNatural(
            mensajeFinal,
            true,
            vozElegida,
            velocidad,
            tono,
            (visible) => {
              if (myId !== interpretIdRef.current) return;
              setTextoRevelado(visible);
            },
            () => {
              if (myId !== interpretIdRef.current) return;
              setTextoRevelado(mensajeFinal);
              setLecturaTerminada(true);
            }
          );
        }, 300);
        return;
      }

      // Sin voz: ritmo constante a la velocidad elegida, nada de frenar en signos o puntos.
      const msPorLetra = Math.max(12, Math.round(100 / velocidad));
      let idx = 0;
      const timer = window.setInterval(() => {
        if (myId !== interpretIdRef.current) {
          window.clearInterval(timer);
          reveladoTimerRef.current = null;
          return;
        }
        idx += 1;
        setTextoRevelado(mensajeFinal.slice(0, idx));
        if (idx >= caracteres.length) {
          window.clearInterval(timer);
          reveladoTimerRef.current = null;
          setLecturaTerminada(true);
        }
      }, msPorLetra);
      reveladoTimerRef.current = timer;
    };

    if (!texto) {
      aplicarMensaje(MSG_VACIO);
      return;
    }

    // Sueño nuevo → conversación de "profundizar" nueva: se descarta la de cualquier sueño anterior.
    profundizarAbortRef.current?.abort();
    setSuenoOriginal(texto);
    setEmocionDespertar(contexto.trim());
    setHistorialProfundizar([]);
    setPreguntaProfundizar("");
    setErrorProfundizar("");
    setCargandoProfundizar(false);

    const ctl = new AbortController();
    interpretAbortRef.current = ctl;
    const timeoutId = window.setTimeout(() => ctl.abort(), INTERPRETAR_TIMEOUT_MS);

    seguirLecturaRef.current = true;
    setResultado("Interpretando tu sueño...");

    const textoEnviado = contexto.trim()
      ? `${texto}\n\n(Cómo me sentí al despertar de este sueño: ${contexto.trim()})`
      : texto;

    void (async () => {
      try {
        const res = await interpretarSuenoRemoto(textoEnviado, ctl.signal);
        if (myId !== interpretIdRef.current) return;
        if (res.ok === false && res.limite24h) {
          setSuenoBloqueadoHasta(Date.now() + (res.restanteMs || 0));
          setAhoraMs(Date.now());
          setResultado("");
          return;
        }
        if (suenoCooldownMsRef.current > 0) {
          setSuenoBloqueadoHasta(Date.now() + suenoCooldownMsRef.current);
          setAhoraMs(Date.now());
        }
        aplicarMensaje(res.mensaje);
      } catch (err: unknown) {
        if (myId !== interpretIdRef.current) return;
        const msg = err instanceof Error ? err.message : String(err);
        aplicarMensaje(`Error inesperado: ${msg}`);
      } finally {
        window.clearTimeout(timeoutId);
      }
    })();
  };

  /** Mismo patrón de revelado/narración de la interpretación inicial, pero para respuestas del chat. */
  const aplicarRespuestaChat = (mensajeFinal: string) => {
    const myId = ++chatRevelaIdRef.current;
    setRevelaChat({ completo: mensajeFinal, visible: "" });

    const narrar = narrarVoz;
    const velocidad = Number(velocidadVoz) || 0.9;
    const tono = Number(tonoVoz) || 1;
    const vozElegida = vocesDisponibles.find((v) => v.name === vozElegidaNombre) ?? null;

    const finalizar = () => {
      if (myId !== chatRevelaIdRef.current) return;
      if (chatRevelaTimerRef.current != null) {
        window.clearInterval(chatRevelaTimerRef.current);
      }
      chatRevelaTimerRef.current = null;
      setRevelaChat(null);
      setHistorialProfundizar((prev) => [...prev, { rol: "ai", texto: mensajeFinal }]);
    };

    const caracteres = Array.from(mensajeFinal);
    if (caracteres.length === 0) {
      finalizar();
      return;
    }

    if (narrar) {
      hablarNatural(
        mensajeFinal,
        true,
        vozElegida,
        velocidad,
        tono,
        (visible) => {
          if (myId !== chatRevelaIdRef.current) return;
          setRevelaChat({ completo: mensajeFinal, visible });
        },
        () => {
          if (myId !== chatRevelaIdRef.current) return;
          finalizar();
        }
      );
      return;
    }

    const msPorLetra = Math.max(12, Math.round(100 / velocidad));
    let idx = 0;
    const timer = window.setInterval(() => {
      if (myId !== chatRevelaIdRef.current) {
        window.clearInterval(timer);
        chatRevelaTimerRef.current = null;
        return;
      }
      idx += 1;
      setRevelaChat({ completo: mensajeFinal, visible: mensajeFinal.slice(0, idx) });
      if (idx >= caracteres.length) {
        window.clearInterval(timer);
        chatRevelaTimerRef.current = null;
        finalizar();
      }
    }, msPorLetra);
    chatRevelaTimerRef.current = timer;
  };

  const enviarPreguntaProfundizar = () => {
    const pregunta = preguntaProfundizar.trim();
    const preguntasUsadas = historialProfundizar.filter((m) => m.rol === "user").length;
    if (pregunta.length < 3 || pregunta.length > 500 || cargandoProfundizar || revelaChat) return;
    if (preguntasUsadas >= PREGUNTAS_PROFUNDIZAR_MAX) return;

    const historialPrevio = historialProfundizar;
    const userMsg: SuenoChatMensaje = { rol: "user", texto: pregunta };
    setHistorialProfundizar((prev) => [...prev, userMsg]);
    setPreguntaProfundizar("");
    setErrorProfundizar("");
    setCargandoProfundizar(true);

    profundizarAbortRef.current?.abort();
    const ctl = new AbortController();
    profundizarAbortRef.current = ctl;
    const timeoutId = window.setTimeout(() => ctl.abort(), PROFUNDIZAR_TIMEOUT_MS);

    void (async () => {
      try {
        const res = await profundizarSuenoRemoto(
          suenoOriginal,
          emocionDespertar,
          resultado,
          historialPrevio,
          pregunta,
          ctl.signal
        );
        if (res.ok) {
          aplicarRespuestaChat(res.mensaje);
        } else {
          setHistorialProfundizar(historialPrevio);
          setPreguntaProfundizar(pregunta);
          setErrorProfundizar(res.mensaje);
        }
      } catch {
        setHistorialProfundizar(historialPrevio);
        setPreguntaProfundizar(pregunta);
        setErrorProfundizar(PROFUNDIZAR_ERROR_GENERICO);
      } finally {
        window.clearTimeout(timeoutId);
        setCargandoProfundizar(false);
      }
    })();
  };

  /** Cuenta preguntas ya hechas en `historialProfundizar` en vez de guardar un contador aparte. */
  const preguntasProfundizarUsadas = historialProfundizar.filter((m) => m.rol === "user").length;
  const preguntasProfundizarRestantes = Math.max(0, PREGUNTAS_PROFUNDIZAR_MAX - preguntasProfundizarUsadas);
  const limiteProfundizarAlcanzado = preguntasProfundizarRestantes <= 0;

  /**
   * `resultado` es el único estado real de "ya hay/está en curso una interpretación": arranca vacío,
   * pasa a "Interpretando tu sueño..." al pulsar Continuar/Saltar y luego al texto final. `MSG_VACIO`
   * no cuenta (el usuario ni siquiera escribió un sueño), así que Maika sigue oculta en ese caso.
   */
  const interpretacionIniciada = resultado !== "" && resultado !== MSG_VACIO;
  const mostrarAvatar = narrarVoz && interpretacionIniciada;

  const suenoBloqueadoRestanteMs = Math.max(0, suenoBloqueadoHasta - ahoraMs);
  /** Bloqueo del interpretador: solo tapa la entrada, no una lectura ya en curso ni el premium abierto. */
  const suenoBloqueado = suenoBloqueadoRestanteMs > 0 && !interpretacionIniciada && !premium;

  /**
   * Cuando aparece el CTA de lectura profunda, la interpretación gratuita ya se registró en backend:
   * se consulta el estado para mostrar la cuenta atrás bajo la oferta.
   */
  const mostrarCtaPremium =
    limiteProfundizarAlcanzado &&
    !cargandoProfundizar &&
    revelaChat === null &&
    !errorProfundizar &&
    historialProfundizar.some((m) => m.rol === "ai");
  useEffect(() => {
    if (!mostrarCtaPremium) return;
    void consultarEstadoSueno().then(({ restanteMs, cooldownMs }) => {
      suenoCooldownMsRef.current = cooldownMs;
      if (restanteMs > 0) setSuenoBloqueadoHasta(Date.now() + restanteMs);
    });
  }, [mostrarCtaPremium]);

  return (
    <div className="maika-sueno-pagina" style={{ color: "white" }}>
      <div className={`maika-sueno-grid${mostrarAvatar ? "" : " maika-sueno-grid--sin-avatar"}`}>
        <div className="maika-sueno-col-principal">
          <h2
            style={{
              fontSize: "32px",
              color: "#d4af37",
              letterSpacing: "1px",
              textShadow: "0 0 10px rgba(212,175,55,0.5)",
              marginBottom: "6px",
              textTransform: "uppercase"
            }}
          >
            Interpretador de Sueños
          </h2>
          <p className="maika-sueno-subtitulo">Cuéntame tu sueño y juntos exploraremos su significado</p>

          {suenoBloqueado ? (
            <div className="maika-sueno-bloqueado" role="status" style={{ textAlign: "center" }}>
              <p className="maika-sueno-bloqueado-titulo" style={{ marginBottom: "14px" }}>
                🌙 Ya has utilizado tu interpretación gratuita de hoy.
              </p>
              <p className="maika-sueno-bloqueado-texto" style={{ marginLeft: "9%" }}>
                Podrás compartir un nuevo sueño a partir de las 00:00 h.
              </p>
              <button
                type="button"
                className="maika-sueno-btn-secundario"
                onClick={() => navigate("/")}
                style={{ marginTop: "24px" }}
              >
                ← Volver a Maika
              </button>
            </div>
          ) : (
          <>
          <textarea
            placeholder="Describe tu sueño..."
            value={sueno}
            onChange={(e) => setSueno(e.target.value)}
            style={{
              width: "100%",
              height: 64,
              padding: "10px",
              borderRadius: "12px",
              background: "rgba(0,0,0,0.6)",
              color: "white",
              fontSize: "16px",
              lineHeight: 1.5,
              border: "1px solid rgba(212,175,55,0.4)",
              outline: "none",
              boxShadow: "0 0 10px rgba(212,175,55,0.2)",
              resize: "none"
            }}
          />

          {!pidiendoContexto ? (
            <button
              type="button"
              onClick={() => {
                if (!sueno.trim()) {
                  onInterpretarClick();
                  return;
                }
                setRespuestaContexto("");
                setPidiendoContexto(true);
              }}
              style={{
                marginTop: "10px",
                padding: "10px 20px",
                borderRadius: "10px",
                background: "linear-gradient(45deg, #d4af37, #f5e6a3)",
                border: "none",
                color: "black",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              Interpretar sueño ✨
            </button>
          ) : (
            <div className="maika-sueno-contexto-panel">
              <div className="maika-sueno-contexto-header">
                <span className="maika-sueno-contexto-icono" aria-hidden>
                  🪷
                </span>
                <div>
                  <p className="maika-sueno-contexto-pregunta">{PREGUNTA_CONTEXTO}</p>
                  <p className="maika-sueno-contexto-ayuda">{CONTEXTO_AYUDA}</p>
                </div>
              </div>

              <div className="maika-sueno-contexto-chips">
                {CHIPS_CONTEXTO.map((label) => (
                  <button
                    key={label}
                    type="button"
                    className={`maika-sueno-chip${respuestaContexto === label ? " activo" : ""}`}
                    onClick={() => setRespuestaContexto(label)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <textarea
                ref={contextoTextareaRef}
                value={respuestaContexto}
                onChange={(e) => setRespuestaContexto(e.target.value)}
                placeholder="Si lo deseas, puedes añadir más detalles..."
                rows={2}
                className="maika-sueno-contexto-textarea"
              />

              <div className="maika-sueno-contexto-acciones">
                <button
                  type="button"
                  className="maika-sueno-btn-primario"
                  onClick={() => {
                    setPidiendoContexto(false);
                    onInterpretarClick(respuestaContexto);
                  }}
                >
                  Continuar ✨
                </button>
                <button
                  type="button"
                  className="maika-sueno-btn-secundario"
                  onClick={() => {
                    setPidiendoContexto(false);
                    onInterpretarClick();
                  }}
                >
                  Saltar
                </button>
              </div>
            </div>
          )}
          </>
          )}

          {!suenoBloqueado && (
          <div className="maika-sueno-row-voz">
            <label>
              <input
                type="checkbox"
                checked={narrarVoz}
                onChange={(e) => setNarrarVoz(e.target.checked)}
              />
              Narrar en voz (navegador)
            </label>
          </div>
          )}

          {!suenoBloqueado && narrarVoz && vocesDisponibles.length > 0 && (
            <div className="maika-sueno-row-voz maika-sueno-row-voz--ajustes" style={{ marginTop: "6px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                Velocidad:
            <select
              value={velocidadVoz}
              onChange={(e) => {
                setVelocidadVoz(e.target.value);
              }}
              style={{
                background: "rgba(0,0,0,0.6)",
                color: "#f5e6a3",
                border: "1px solid rgba(212,175,55,0.4)",
                borderRadius: "8px",
                padding: "4px 8px"
              }}
            >
              <option value="0.6">0.6 · Muy lenta</option>
              <option value="0.75">0.75 · Lenta</option>
              <option value="0.9">0.9 · Normal</option>
              <option value="1">1.0 · Estándar</option>
              <option value="1.15">1.15 · Rápida</option>
              <option value="1.3">1.3 · Muy rápida</option>
              <option value="1.5">1.5 · Ultrarrápida</option>
            </select>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            Tono:
            <select
              value={tonoVoz}
              onChange={(e) => {
                setTonoVoz(e.target.value);
              }}
              style={{
                background: "rgba(0,0,0,0.6)",
                color: "#f5e6a3",
                border: "1px solid rgba(212,175,55,0.4)",
                borderRadius: "8px",
                padding: "4px 8px"
              }}
            >
              <option value="0.7">0.7 · Grave</option>
              <option value="0.85">0.85 · Suave grave</option>
              <option value="1">1.0 · Neutro</option>
              <option value="1.15">1.15 · Agudo</option>
              <option value="1.3">1.3 · Suave agudo</option>
            </select>
          </label>
            </div>
          )}
        </div>

        {mostrarAvatar ? (
          <div className="maika-sueno-col-avatar">
            <MaikaAvatar size="lg" />
          </div>
        ) : null}
      </div>

      {!suenoBloqueado && (
      <div
        ref={cajaResultadoRef}
        className="maika-sueno-resultado"
        style={{
          marginTop: "20px",
          padding: "18px",
          borderRadius: "16px",
          background: "rgba(0,0,0,0.6)",
          border: "1px solid rgba(212,175,55,0.3)",
          color: "#f5e6a3",
          boxShadow: "0 0 15px rgba(212,175,55,0.2)",
          animation: "fadeIn 1.5s ease",
          maxHeight: "42vh",
          overflowY: "auto",
          scrollBehavior: "smooth"
        }}
      >
        <div style={{ fontSize: "18.5px", fontStyle: "italic", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
          ✨ {textoRevelado === null ? resultado || "Escribe tu relato arriba y pulsa interpretar." : textoRevelado}
        </div>

        {puedeProfundizar(suenoOriginal, resultado) && lecturaTerminada ? (
          <div className="maika-sueno-profundizar">
            {/* Cabecera invitando a preguntar: solo antes de empezar. En cuanto hay hilo, estorba
                (parece "otro recuadro" en vez de una conversación que sigue bajo la lectura). */}
            {historialProfundizar.length === 0 && !revelaChat ? (
              <>
                <div className="maika-sueno-profundizar-header">
                  <span aria-hidden>💬</span>
                  <div>
                    <p className="maika-sueno-profundizar-titulo">Pregunta a Maika sobre este sueño</p>
                    <p className="maika-sueno-profundizar-ayuda">
                      Resuelve una duda concreta sobre algún símbolo, detalle o sensación de tu sueño.
                    </p>
                  </div>
                </div>

                {preguntasProfundizarRestantes > 0 ? (
                  <p className="maika-sueno-profundizar-contador">
                    ✨ Como parte de esta lectura, puedes hacer una pregunta a Maika para profundizar en tu sueño.
                  </p>
                ) : null}
              </>
            ) : null}

            {(historialProfundizar.length > 0 || revelaChat) ? (
              <div className="maika-sueno-profundizar-hilo">
                {historialProfundizar.map((m, i) => (
                  <div
                    key={`${i}-${m.rol}-${m.texto.slice(0, 12)}`}
                    className={`maika-sueno-profundizar-fila ${m.rol === "user" ? "usuario" : "maika"}`}
                  >
                    <div className={m.rol === "user" ? "maika-sueno-burbuja-usuario" : "maika-sueno-burbuja-maika"}>
                      {m.texto}
                    </div>
                  </div>
                ))}
                {revelaChat ? (
                  <div className="maika-sueno-profundizar-fila maika">
                    <div className="maika-sueno-burbuja-maika">
                      {revelaChat.visible || "✨"}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {cargandoProfundizar ? (
              <p className="maika-sueno-profundizar-cargando">✨ Maika está pensando tu respuesta...</p>
            ) : null}

            {errorProfundizar ? (
              <p className="maika-sueno-profundizar-error" role="alert">
                {errorProfundizar}
              </p>
            ) : null}

            {!limiteProfundizarAlcanzado ? (
              <>
                <div className="maika-sueno-profundizar-entrada" style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <textarea
                    value={preguntaProfundizar}
                    onChange={(e) => setPreguntaProfundizar(e.target.value)}
                    placeholder="Pregunta algo a Maika sobre este sueño..."
                    rows={2}
                    maxLength={500}
                    disabled={cargandoProfundizar || revelaChat !== null}
                    className="maika-sueno-contexto-textarea"
                    style={{ flex: 1 }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        enviarPreguntaProfundizar();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="maika-sueno-btn-primario"
                    onClick={enviarPreguntaProfundizar}
                    disabled={cargandoProfundizar || revelaChat !== null || preguntaProfundizar.trim().length < 3}
                    style={{ alignSelf: "flex-end" }}
                  >
                    {cargandoProfundizar ? "Enviando…" : "Enviar ✨"}
                  </button>
                </div>
              </>
            ) : !errorProfundizar && historialProfundizar.some((m) => m.rol === "ai") ? (
              <div className="maika-sueno-profundizar-limite">
                <p className="maika-sueno-profundizar-limite-titulo">
                  ✨ Has utilizado tu pregunta adicional
                </p>
                <p className="maika-sueno-profundizar-limite-texto">
                  Este sueño todavía puede explorarse desde otros ángulos: sus emociones, símbolos, relaciones y posibles conexiones con tu momento actual.
                </p>
                <p className="maika-sueno-profundizar-invitacion">
                  🔮 Descubre lo que aún puede revelarte tu sueño
                </p>
                <p className="maika-sueno-profundizar-precio">Lectura profunda · 3,99 €</p>
                <button
                  type="button"
                  className="maika-sueno-btn-primario"
                  disabled={premium !== null}
                  aria-expanded={premium !== null}
                  aria-controls="maika-lectura-profunda"
                  onClick={() =>
                    setPremium({
                      sueno: suenoOriginal,
                      interpretacionBasica: resultado.trim(),
                      emocion: emocionDespertar,
                      historialAdicional: historialProfundizar.map((m) => ({ ...m }))
                    })
                  }
                  style={{ marginTop: "12px" }}
                >
                  Desbloquear lectura profunda ✨
                </button>
                {suenoBloqueadoHasta > ahoraMs ? (
                  <p className="maika-sueno-cooldown">
                    🌙 Tu próxima interpretación gratuita estará disponible a partir de las 00:00 h.
                  </p>
                ) : null}
              </div>
            ) : null}

            {/* Cierre de la experiencia gratuita: solo cuando la pregunta adicional ya se consumió
                y la respuesta de Maika terminó (mismo gate que el bloque premium). */}
            {limiteProfundizarAlcanzado &&
            !cargandoProfundizar &&
            revelaChat === null &&
            historialProfundizar.some((m) => m.rol === "ai") ? (
              <div className="maika-sueno-cierre">
                <p className="maika-sueno-profundizar-limite-titulo">
                  🌙 Tu experiencia de hoy termina aquí
                </p>
                <p className="maika-sueno-profundizar-limite-texto">
                  Gracias por compartir tu sueño con Maika.
                </p>
                <p className="maika-sueno-profundizar-limite-texto">
                  Podrás compartir un nuevo sueño a partir de las 00:00 h.
                </p>
                <button
                  type="button"
                  className="maika-sueno-btn-secundario"
                  onClick={() => navigate("/")}
                  style={{ marginTop: "14px" }}
                >
                  ← Volver a Maika
                </button>
              </div>
            ) : null}
          </div>
        ) : null}



        {premium ? (
          <div id="maika-lectura-profunda" ref={entradaProfundaRef} className="maika-sueno-entrada-profunda">
            <LecturaProfunda
              sueno={premium.sueno}
              interpretacionBasica={premium.interpretacionBasica}
              emocion={premium.emocion}
              historialAdicional={premium.historialAdicional}
              narrarVoz={narrarVoz}
              vozNombre={vozElegidaNombre}
              velocidadVoz={Number(velocidadVoz) || 0.9}
              tonoVoz={Number(tonoVoz) || 1}
              sinContenedor
            />
          </div>
        ) : null}
      </div>
      )}
    </div>
  );
}
