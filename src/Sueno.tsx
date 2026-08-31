import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiBaseUrl } from "./config/apiBaseUrl";
import type { SuenoPremiumLocationState } from "./pages/SuenoPremiumPage";
import "./Sueno.css";

const INTERPRETAR_TIMEOUT_MS = 55_000;

const MSG_VACIO =
  "Escribe tu sueño con un poco de detalle para poder interpretarlo con la IA.";

function puedeProfundizar(textoSueno: string, mensajeResultado: string): boolean {
  const t = textoSueno.trim();
  const r = mensajeResultado.trim();
  if (t.length < 8) return false;
  if (!r || r === MSG_VACIO) return false;
  if (r === "Interpretando tu sueño...") return false;
  return r.length >= 40;
}

type InterpretarSuenoResultado =
  | { ok: true; mensaje: string }
  | { ok: false; mensaje: string };

/** Solo IA vía backend (OpenAI). Sin fallback de texto fijo. */
async function interpretarSuenoRemoto(
  texto: string,
  signal: AbortSignal
): Promise<InterpretarSuenoResultado> {
  const body = JSON.stringify({ texto });
  /** En dev, primero el backend directo (CORS permitido) evita depender solo del proxy de Vite. */
  const base = getApiBaseUrl();
  const urls = import.meta.env.DEV
    ? [`${base}/sueno/interpretar`, "/api/sueno/interpretar"]
    : [`${base}/sueno/interpretar`];

  let ultimoError = "No pudimos conectar con el servidor de interpretación.";

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal
      });
      if (signal.aborted) {
        return {
          ok: false,
          mensaje:
            "La petición se canceló o superó el tiempo de espera. Comprueba la conexión y vuelve a intentarlo."
        };
      }
      const data: { ok?: boolean; mensaje?: string; reason?: string; error?: string } = await res
        .json()
        .catch(() => ({}));

      if (res.ok && data.ok && typeof data.mensaje === "string" && data.mensaje.trim()) {
        return { ok: true, mensaje: data.mensaje.trim() };
      }

      if (res.status === 503 && data.reason === "no_key") {
        return {
          ok: false,
          mensaje:
            "La interpretación por IA no está activa: el servidor necesita la variable de entorno OPENAI_API_KEY. Configúrala, reinicia el backend y prueba de nuevo."
        };
      }
      if (res.status === 400) {
        return {
          ok: false,
          mensaje: "El texto no es válido para la IA (demasiado largo o vacío). Revisa el relato e inténtalo otra vez."
        };
      }
      if (res.status === 404) {
        ultimoError =
          "404: el backend no reconoce POST /sueno/interpretar (código desactualizado o proceso equivocado). Para el servidor en `backend/`, vuelve a iniciarlo con la versión actual del repo y comprueba que escuche en el puerto 3001.";
      } else if (res.status >= 500 || data.error === "openai" || data.error === "sin_contenido") {
        ultimoError =
          "El servicio de IA devolvió un error. Espera unos segundos y pulsa interpretar otra vez.";
      } else {
        ultimoError = `No se pudo interpretar (código HTTP ${res.status}). Comprueba que el backend esté en marcha en ${base}.`;
      }

      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn("[Sueno] interpretar remoto", url, res.status, data);
      }
    } catch (e) {
      if (signal.aborted) {
        return {
          ok: false,
          mensaje:
            "La petición se canceló o superó el tiempo de espera. Comprueba la conexión y vuelve a intentarlo."
        };
      }
      ultimoError =
        "Sin conexión al servidor (¿está el backend en el puerto 3001 y la URL de la API bien configurada?).";
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn("[Sueno] interpretar fetch", url, e);
      }
    }
  }

  return { ok: false, mensaje: ultimoError };
}

function esVozEspanola(v: SpeechSynthesisVoice): boolean {
  return v.lang.toLowerCase().startsWith("es");
}

/** Voz cercana: masculina ES si existe; si no, Google / es-ES (suena menos “locutada” que forzar femenina). */
function elegirVozMasculinaOCercanaEspanol(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voces = window.speechSynthesis.getVoices();
  if (voces.length === 0) return null;
  const n = (v: SpeechSynthesisVoice) => v.name.toLowerCase();
  return (
    voces.find((v) => esVozEspanola(v) && /\bmale\b/i.test(n(v))) ||
    voces.find((v) => esVozEspanola(v) && /google/.test(n(v))) ||
    voces.find((v) => /google/i.test(n(v))) ||
    voces.find((v) => v.lang === "es-ES" || v.lang.toLowerCase() === "es-es") ||
    voces.find(esVozEspanola) ||
    voces[0]
  );
}

/** Texto pensado para oído: saltos → pausa, sin iconos que el motor pronuncie raro. */
function prepararTextoParaVoz(texto: string): string {
  return texto
    .replace(/\r?\n+/g, ". ")
    .replace(/✨/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

let speechChainId = 0;
const PAUSA_ENTRE_FRASES_MS = 750;

/** Varios utterances + pausa larga: ritmo de conversación, no bloque leído. */
function hablarNatural(texto: string, narrar: boolean) {
  if (!narrar || typeof window === "undefined" || !window.speechSynthesis) return;
  const myId = speechChainId;
  window.speechSynthesis.cancel();
  const listo = prepararTextoParaVoz(texto);
  const frases = listo
    .split(/[.!?]+/)
    .map((f) => f.trim())
    .filter((f) => f.length > 0);
  if (frases.length === 0) return;
  let i = 0;
  let pausaTimer: number | null = null;

  const limpiarPausa = () => {
    if (pausaTimer != null) {
      window.clearTimeout(pausaTimer);
      pausaTimer = null;
    }
  };

  const aplicarVoz = (u: SpeechSynthesisUtterance) => {
    const voz = elegirVozMasculinaOCercanaEspanol();
    if (voz) u.voice = voz;
    u.lang = "es-ES";
    u.rate = 0.9;
    u.pitch = 1;
    u.volume = 1;
  };

  function siguiente() {
    if (myId !== speechChainId) return;
    if (i >= frases.length) return;
    const u = new SpeechSynthesisUtterance(frases[i]);
    aplicarVoz(u);
    u.onend = () => {
      if (myId !== speechChainId) return;
      limpiarPausa();
      i += 1;
      if (i >= frases.length) return;
      pausaTimer = window.setTimeout(siguiente, PAUSA_ENTRE_FRASES_MS);
    };
    u.onerror = () => {
      if (myId !== speechChainId) return;
      limpiarPausa();
      i += 1;
      if (i < frases.length) {
        pausaTimer = window.setTimeout(siguiente, PAUSA_ENTRE_FRASES_MS);
      }
    };
    window.speechSynthesis.speak(u);
  }
  siguiente();
}

export default function Sueno() {
  const navigate = useNavigate();
  const [sueno, setSueno] = useState("");
  const [resultado, setResultado] = useState("");
  const [resultadoVisible, setResultadoVisible] = useState("");
  const [narrarVoz, setNarrarVoz] = useState(true);
  const intervaloCanalizacionRef = useRef<number | null>(null);
  const interpretAbortRef = useRef<AbortController | null>(null);
  const interpretIdRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return undefined;
    const warmVoices = () => {
      window.speechSynthesis.getVoices();
    };
    warmVoices();
    window.speechSynthesis.addEventListener("voiceschanged", warmVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", warmVoices);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (intervaloCanalizacionRef.current != null) {
        window.clearInterval(intervaloCanalizacionRef.current);
      }
      interpretAbortRef.current?.abort();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const escribirTexto = (texto: string) => {
    const caracteres = Array.from(texto);
    let i = 0;
    setResultadoVisible("");

    if (intervaloCanalizacionRef.current != null) {
      window.clearInterval(intervaloCanalizacionRef.current);
    }

    const intervalo = window.setInterval(() => {
      if (i >= caracteres.length) {
        window.clearInterval(intervalo);
        intervaloCanalizacionRef.current = null;
        return;
      }
      const idx = i;
      i += 1;
      setResultadoVisible((prev) => prev + (caracteres[idx] ?? ""));
      if (i >= caracteres.length) {
        window.clearInterval(intervalo);
        intervaloCanalizacionRef.current = null;
      }
    }, 25);
    intervaloCanalizacionRef.current = intervalo;
  };

  const onInterpretarClick = () => {
    const texto = sueno.trim();
    const narrar = narrarVoz;

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    speechChainId += 1;

    if (intervaloCanalizacionRef.current != null) {
      window.clearInterval(intervaloCanalizacionRef.current);
      intervaloCanalizacionRef.current = null;
    }

    interpretAbortRef.current?.abort();

    const myId = ++interpretIdRef.current;

    const aplicarMensaje = (mensajeFinal: string) => {
      if (myId !== interpretIdRef.current) return;
      setResultado(mensajeFinal);
      escribirTexto(mensajeFinal);
      void (async () => {
        await new Promise((r) => setTimeout(r, 400));
        if (myId !== interpretIdRef.current) return;
        hablarNatural(mensajeFinal, narrar);
      })();
    };

    if (!texto) {
      aplicarMensaje(MSG_VACIO);
      return;
    }

    const ctl = new AbortController();
    interpretAbortRef.current = ctl;
    const timeoutId = window.setTimeout(() => ctl.abort(), INTERPRETAR_TIMEOUT_MS);

    setResultado("Interpretando tu sueño...");
    setResultadoVisible("");

    void (async () => {
      try {
        const res = await interpretarSuenoRemoto(texto, ctl.signal);
        if (myId !== interpretIdRef.current) return;
        aplicarMensaje(res.mensaje);
      } finally {
        window.clearTimeout(timeoutId);
      }
    })();
  };

  return (
    <div style={{ padding: 20, color: "white" }}>
      <h2
        style={{
          fontSize: "32px",
          color: "#d4af37",
          letterSpacing: "1px",
          textShadow: "0 0 10px rgba(212,175,55,0.5)",
          marginBottom: "14px",
          textTransform: "uppercase"
        }}
      >
        Interpretador de Sueños
      </h2>

      <textarea
        placeholder="Describe tu sueño..."
        value={sueno}
        onChange={(e) => setSueno(e.target.value)}
        style={{
          width: "100%",
          height: 92,
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

      <button
        type="button"
        onClick={onInterpretarClick}
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

      <div
        style={{
          marginTop: "20px",
          padding: "18px",
          borderRadius: "16px",
          background: "rgba(0,0,0,0.6)",
          border: "1px solid rgba(212,175,55,0.3)",
          color: "#f5e6a3",
          fontSize: "18.5px",
          fontStyle: "italic",
          lineHeight: "1.7",
          boxShadow: "0 0 15px rgba(212,175,55,0.2)",
          animation: "fadeIn 1.5s ease",
          whiteSpace: "pre-wrap"
        }}
      >
        ✨ {resultadoVisible || resultado}
        {resultadoVisible.length > 0 && resultadoVisible.length < resultado.length && (
          <span
            style={{
              display: "inline-block",
              marginLeft: "2px",
              animation: "blink 1s infinite"
            }}
          >
            |
          </span>
        )}
      </div>

      {puedeProfundizar(sueno, resultado) ? (
        <div style={{ marginTop: "18px", textAlign: "center" }}>
          <button
            type="button"
            onClick={() =>
              navigate("/sueno-premium", {
                state: {
                  sueno: sueno.trim(),
                  interpretacionBasica: resultado.trim()
                } satisfies SuenoPremiumLocationState
              })
            }
            style={{
              padding: "12px 22px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, rgba(212,175,55,0.35), rgba(245,230,163,0.2))",
              border: "1px solid rgba(212,175,55,0.55)",
              color: "#f5e6a3",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "16px",
              boxShadow: "0 0 14px rgba(212,175,55,0.25)"
            }}
          >
            Profundizar interpretación ✨
          </button>
          <p style={{ marginTop: "10px", fontSize: "14px", color: "rgba(245,230,163,0.75)" }}>
            Lectura más detallada en otra pantalla (desbloqueo de ejemplo).
          </p>
        </div>
      ) : null}
    </div>
  );
}
