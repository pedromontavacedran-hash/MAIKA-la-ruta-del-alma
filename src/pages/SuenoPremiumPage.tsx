import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { getApiBaseUrl } from "../config/apiBaseUrl";
import "../Sueno.css";

export type SuenoPremiumLocationState = {
  sueno: string;
  interpretacionBasica?: string;
};

export type SuenoChatMensaje = { rol: "user" | "ai"; texto: string };

type OkToken = { ok: true; token: string };
type ErrMsg = { ok: false; mensaje: string };

type SeguimientoResultado = { ok: true; mensaje: string } | { ok: false; mensaje: string };

const TIMEOUT_MS = 60_000;

/** Mensajes rotativos mientras llega la lectura profunda (rendimiento percibido). */
const MENSAJES_ESPERA_LECTURA = [
  "Estoy conectando con tu sueño... dame un instante ✨",
  "Conectando con el significado de lo que contaste...",
  "Observando los símbolos de tu relato...",
  "Interpretando lo que hay detrás..."
] as const;

/**
 * Contador global (no se resetea con remount/Strict Mode). Si usáramos solo `useRef`, un remount
 * puede dejar el ref en 0 mientras un async sigue con `myEpoch === 1` y el `finally` no llama a
 * `finalizarLecturaCarga` → `cargando` / modo espera quedan mal y el botón «Continuar» no se habilita.
 */
let lecturaProfundaEpoch = 0;

async function solicitarSimularCobroRemoto(signal: AbortSignal): Promise<OkToken | ErrMsg> {
  const base = getApiBaseUrl();
  const urls = import.meta.env.DEV
    ? [`${base}/sueno/premium/simular-cobro`, "/api/sueno/premium/simular-cobro"]
    : [`${base}/sueno/premium/simular-cobro`];

  let ultimo = "No pudimos conectar con el servidor.";

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        signal
      });
      if (signal.aborted) {
        return { ok: false, mensaje: "Petición cancelada o tiempo de espera agotado." };
      }
      const data: { ok?: boolean; desbloqueoToken?: string } = await res.json().catch(() => ({}));
      if (res.ok && data.ok && typeof data.desbloqueoToken === "string" && data.desbloqueoToken.trim()) {
        return { ok: true, token: data.desbloqueoToken.trim() };
      }
      ultimo = `No se pudo iniciar el desbloqueo (HTTP ${res.status}).`;
    } catch {
      if (signal.aborted) {
        return { ok: false, mensaje: "Petición cancelada o tiempo de espera agotado." };
      }
      ultimo = "Sin conexión al servidor. Comprueba que el backend esté en marcha.";
    }
  }

  return { ok: false, mensaje: ultimo };
}

async function seguimientoSuenoRemoto(
  texto: string,
  interpretacionBasica: string,
  desbloqueoToken: string,
  signal: AbortSignal
): Promise<SeguimientoResultado> {
  const body = JSON.stringify({
    texto,
    interpretacionBasica: interpretacionBasica.trim() || undefined,
    desbloqueoToken
  });
  const base = getApiBaseUrl();
  const urls = import.meta.env.DEV
    ? [`${base}/sueno/seguimiento`, "/api/sueno/seguimiento"]
    : [`${base}/sueno/seguimiento`];

  let ultimo = "No pudimos conectar con el servidor.";

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal
      });
      if (signal.aborted) {
        return { ok: false, mensaje: "Petición cancelada o tiempo de espera agotado." };
      }
      const data: { ok?: boolean; mensaje?: string; reason?: string; error?: string } = await res
        .json()
        .catch(() => ({}));

      if (res.ok && data.ok && typeof data.mensaje === "string" && data.mensaje.trim()) {
        return { ok: true, mensaje: data.mensaje.trim() };
      }

      if (res.status === 402) {
        const r = data.reason;
        const m =
          typeof data.mensaje === "string" && data.mensaje.trim() ? data.mensaje.trim() : "";
        if (r === "premium_required") {
          return {
            ok: false,
            mensaje: m || "Primero desbloquea la lectura profunda desde el botón de esta pantalla."
          };
        }
        if (r === "premium_token_invalid") {
          return {
            ok: false,
            mensaje:
              m ||
              "Tu sesión ha caducado o el acceso no es válido. Vuelve a desbloquear la lectura profunda."
          };
        }
        if (r === "premium_seguimiento_ya_usado") {
          return {
            ok: false,
            mensaje: m || "Ya usaste la lectura profunda con este acceso. Desbloquea de nuevo si necesitas otra."
          };
        }
        return { ok: false, mensaje: m || "Acceso no disponible en este momento." };
      }

      if (res.status === 503 && data.reason === "no_key") {
        return {
          ok: false,
          mensaje:
            "La lectura profunda no está activa: el servidor necesita OPENAI_API_KEY. Configúrala y reinicia el backend."
        };
      }
      if (res.status === 400) {
        ultimo = "Los datos enviados no son válidos. Vuelve desde la pantalla de sueños e inténtalo de nuevo.";
      } else if (res.status >= 500 || data.error === "openai" || data.error === "sin_contenido") {
        ultimo = "El servicio de IA devolvió un error. Espera unos segundos y prueba otra vez.";
      } else {
        ultimo = `No se pudo completar la lectura (HTTP ${res.status}).`;
      }
    } catch {
      if (signal.aborted) {
        return { ok: false, mensaje: "Petición cancelada o tiempo de espera agotado." };
      }
      ultimo = "Sin conexión al servidor. Comprueba que el backend esté en marcha.";
    }
  }

  return { ok: false, mensaje: ultimo };
}

async function suenoChatRemoto(
  historial: SuenoChatMensaje[],
  desbloqueoToken: string,
  signal: AbortSignal
): Promise<{ ok: true; mensaje: string } | { ok: false; mensaje: string }> {
  const body = JSON.stringify({ historial });
  const base = getApiBaseUrl();
  const urls = import.meta.env.DEV
    ? [`${base}/sueno/chat`, "/api/sueno/chat"]
    : [`${base}/sueno/chat`];

  let ultimo = "No pudimos conectar con el servidor.";

  for (const url of urls) {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (desbloqueoToken.trim()) {
        headers.Authorization = `Bearer ${desbloqueoToken.trim()}`;
      }
      const res = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal
      });
      if (signal.aborted) {
        return { ok: false, mensaje: "Petición cancelada o tiempo de espera agotado." };
      }
      const data: { ok?: boolean; mensaje?: string; reason?: string; error?: string } = await res
        .json()
        .catch(() => ({}));

      if (res.ok && data.ok && typeof data.mensaje === "string" && data.mensaje.trim()) {
        return { ok: true, mensaje: data.mensaje.trim() };
      }

      if (res.status === 402) {
        const m = typeof data.mensaje === "string" && data.mensaje.trim() ? data.mensaje.trim() : "";
        const r = data.reason;
        if (r === "premium_required") {
          return {
            ok: false,
            mensaje: m || "Necesitas desbloquear la lectura profunda para seguir conversando."
          };
        }
        if (r === "premium_token_invalid") {
          return {
            ok: false,
            mensaje:
              m ||
              "Tu sesión ha caducado, vuelve a desbloquear la lectura profunda para continuar el chat."
          };
        }
        if (r === "premium_seguimiento_pendiente") {
          return {
            ok: false,
            mensaje: m || "Primero completa la lectura profunda; después podrás usar el chat con el mismo acceso."
          };
        }
        return {
          ok: false,
          mensaje: m || "No pudimos validar el acceso al chat. Vuelve a intentar o desbloquea de nuevo."
        };
      }
      if (res.status === 503 && data.reason === "no_key") {
        return {
          ok: false,
          mensaje: "La conversación no está disponible: falta configurar la IA en el servidor."
        };
      }
      if (res.status >= 500 || data.error === "openai" || data.error === "sin_contenido") {
        ultimo = "La IA no respondió bien. Prueba otra vez en unos segundos.";
      } else {
        ultimo = `Error al continuar la conversación (HTTP ${res.status}).`;
      }
    } catch {
      if (signal.aborted) {
        return { ok: false, mensaje: "Petición cancelada o tiempo de espera agotado." };
      }
      ultimo = "Sin conexión al servidor.";
    }
  }

  return { ok: false, mensaje: ultimo };
}

const panel: CSSProperties = {
  padding: 20,
  color: "white",
  maxWidth: 720,
  margin: "0 auto"
};

const titulo: CSSProperties = {
  fontSize: "28px",
  color: "#d4af37",
  letterSpacing: "0.5px",
  textShadow: "0 0 10px rgba(212,175,55,0.45)",
  marginBottom: "12px"
};

const caja: CSSProperties = {
  marginTop: "16px",
  padding: "18px",
  borderRadius: "16px",
  background: "rgba(0,0,0,0.6)",
  border: "1px solid rgba(212,175,55,0.3)",
  color: "#f5e6a3",
  fontSize: "17px",
  lineHeight: 1.65,
  whiteSpace: "pre-wrap"
};

const btnPrimario: CSSProperties = {
  marginTop: "14px",
  padding: "12px 22px",
  borderRadius: "12px",
  background: "linear-gradient(45deg, #d4af37, #f5e6a3)",
  border: "none",
  color: "black",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "16px"
};

const btnSec: CSSProperties = {
  marginTop: "10px",
  display: "inline-block",
  color: "rgba(245,230,163,0.85)",
  fontSize: "15px"
};

const chatBurbujaUser: CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: "14px 14px 4px 14px",
  background: "linear-gradient(135deg, #d4af37, #c9a43a)",
  color: "#1a1208",
  maxWidth: "88%",
  textAlign: "left",
  whiteSpace: "pre-wrap",
  lineHeight: 1.5,
  fontSize: "15px",
  boxShadow: "0 4px 14px rgba(0,0,0,0.25)"
};

const sugerenciasChat: string[] = [
  "¿Qué sentías en ese momento?",
  "¿Te resulta familiar esa situación?"
];

const chipSugerencia: CSSProperties = {
  marginTop: "8px",
  marginRight: "8px",
  padding: "6px 12px",
  borderRadius: "999px",
  fontSize: "13px",
  cursor: "pointer",
  border: "1px solid rgba(212,175,55,0.35)",
  background: "rgba(212,175,55,0.12)",
  color: "#f5e6d0"
};

const chipPrimeraSugerencia: CSSProperties = {
  ...chipSugerencia,
  marginTop: "10px",
  marginRight: 0,
  fontSize: "14px",
  padding: "8px 14px"
};

const chatBurbujaAi: CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: "14px 14px 14px 4px",
  background: "rgba(30,22,40,0.92)",
  border: "1px solid rgba(212,175,55,0.28)",
  color: "#f5e6e0",
  maxWidth: "88%",
  textAlign: "left",
  whiteSpace: "pre-wrap",
  lineHeight: 1.55,
  fontSize: "15px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
};

export default function SuenoPremiumPage() {
  const location = useLocation();
  const state = location.state as SuenoPremiumLocationState | null;

  const sueno = useMemo(() => String(state?.sueno ?? "").trim(), [state?.sueno]);
  const interpretacionBasica = useMemo(
    () => String(state?.interpretacionBasica ?? "").trim(),
    [state?.interpretacionBasica]
  );

  const [desbloqueado, setDesbloqueado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [faseCarga, setFaseCarga] = useState<"idle" | "pago" | "ia">("idle");
  /** Mismo JWT que envía el chat en `Authorization` (tras lectura profunda, el backend marca el `jti` como OK). */
  const [desbloqueoToken, setDesbloqueoToken] = useState("");
  const [historial, setHistorial] = useState<SuenoChatMensaje[]>([]);
  const [input, setInput] = useState("");
  const [cargandoChat, setCargandoChat] = useState(false);
  const [error, setError] = useState("");
  const [errorChat, setErrorChat] = useState("");
  /** Solo true mientras se muestra el placeholder (texto en `mensajeEspera`, no en `historial`). */
  const [modoEsperaLectura, setModoEsperaLectura] = useState(false);
  /** Texto de espera rotativo; el interval solo toca esto, nunca `historial`. */
  const [mensajeEspera, setMensajeEspera] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);
  /** Siempre el último historial renderizado (evita closure obsoleto al enviar). */
  const historialRef = useRef<SuenoChatMensaje[]>([]);
  /** Bloquea doble envío antes de que React aplique `cargandoChat`. */
  const chatEnVueloRef = useRef(false);
  /**
   * Evita que un tick del intervalo de “mensajes de espera” pise la lectura real
   * (race: setInterval vs setHistorial al terminar la IA).
   */
  const rotacionEsperaActivaRef = useRef(false);
  historialRef.current = historial;

  const finalizarLecturaCarga = useCallback(() => {
    rotacionEsperaActivaRef.current = false;
    setModoEsperaLectura(false);
    setMensajeEspera("");
    setCargando(false);
    setFaseCarga("idle");
  }, []);

  /** Lo que se muestra en el panel: placeholder derivado o historial real del chat. */
  const historialRender = useMemo((): SuenoChatMensaje[] => {
    if (modoEsperaLectura) {
      return [{ rol: "ai", texto: mensajeEspera.trim() || MENSAJES_ESPERA_LECTURA[0] }];
    }
    return historial;
  }, [modoEsperaLectura, mensajeEspera, historial]);

  /** Chat usable: mismo JWT premium (`desbloqueoToken`), sin carga ni placeholder rotando. */
  const chatActivo = useMemo(
    () =>
      desbloqueado &&
      Boolean(desbloqueoToken.trim()) &&
      !cargando &&
      !modoEsperaLectura,
    [desbloqueado, desbloqueoToken, cargando, modoEsperaLectura]
  );

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [historialRender, cargandoChat]);

  useEffect(() => {
    if (!modoEsperaLectura) return;
    rotacionEsperaActivaRef.current = true;
    let ix = 0;
    const id = window.setInterval(() => {
      if (!rotacionEsperaActivaRef.current) return;
      ix = (ix + 1) % MENSAJES_ESPERA_LECTURA.length;
      setMensajeEspera(MENSAJES_ESPERA_LECTURA[ix]);
    }, 1500);
    return () => {
      rotacionEsperaActivaRef.current = false;
      window.clearInterval(id);
    };
  }, [modoEsperaLectura]);

  const iniciarPagoSimulado = useCallback(() => {
    void (async () => {
      const myEpoch = ++lecturaProfundaEpoch;
      setError("");
      setCargando(true);
      setFaseCarga("pago");
      rotacionEsperaActivaRef.current = true;
      setModoEsperaLectura(true);
      setMensajeEspera(MENSAJES_ESPERA_LECTURA[0]);
      setDesbloqueado(true);
      setHistorial([]);
      const ctl = new AbortController();
      const tid = window.setTimeout(() => ctl.abort(), TIMEOUT_MS);
      try {
        // Cobro y seguimiento en serie: el token del cobro es obligatorio para la IA (no hay Promise.all aquí).
        const cobro = await solicitarSimularCobroRemoto(ctl.signal);
        if (myEpoch !== lecturaProfundaEpoch) return;
        if (cobro.ok === false) {
          setDesbloqueado(false);
          setHistorial([]);
          setError(cobro.mensaje);
          return;
        }
        if (myEpoch !== lecturaProfundaEpoch) return;
        setDesbloqueoToken(cobro.token);
        setFaseCarga("ia");
        const out = await seguimientoSuenoRemoto(
          sueno,
          interpretacionBasica,
          cobro.token,
          ctl.signal
        );
        if (myEpoch !== lecturaProfundaEpoch) return;
        if (out.ok) {
          setHistorial([{ rol: "ai", texto: out.mensaje }]);
        } else {
          setDesbloqueado(false);
          setHistorial([]);
          setError(out.mensaje);
        }
      } catch {
        if (myEpoch !== lecturaProfundaEpoch) return;
        setDesbloqueado(false);
        setHistorial([]);
        setError("Algo no fue bien. Revisa la conexión e inténtalo de nuevo.");
      } finally {
        window.clearTimeout(tid);
        if (myEpoch === lecturaProfundaEpoch) {
          finalizarLecturaCarga();
        }
      }
    })();
  }, [sueno, interpretacionBasica, finalizarLecturaCarga]);

  const enviarMensaje = useCallback(() => {
    const t = input.trim();
    if (
      t.length < 3 ||
      cargando ||
      modoEsperaLectura ||
      !desbloqueoToken.trim() ||
      cargandoChat ||
      chatEnVueloRef.current
    )
      return;
    const userMsg: SuenoChatMensaje = { rol: "user", texto: t };
    const nuevoHistorial = [...historialRef.current, userMsg];
    chatEnVueloRef.current = true;
    setHistorial(nuevoHistorial);
    setInput("");
    setErrorChat("");
    setCargandoChat(true);
    const ctl = new AbortController();
    const tid = window.setTimeout(() => ctl.abort(), TIMEOUT_MS);
    void (async () => {
      try {
        const data = await suenoChatRemoto(nuevoHistorial, desbloqueoToken, ctl.signal);
        if (data.ok) {
          setHistorial((prev) => [...prev, { rol: "ai", texto: data.mensaje }]);
        } else {
          setErrorChat(data.mensaje);
        }
      } finally {
        window.clearTimeout(tid);
        chatEnVueloRef.current = false;
        setCargandoChat(false);
      }
    })();
  }, [input, desbloqueoToken, cargandoChat, cargando, modoEsperaLectura]);

  if (!state || !sueno) {
    return <Navigate to="/suenos" replace />;
  }

  return (
    <div style={panel}>
      <h1 style={titulo}>Lectura profunda del alma (3,99&nbsp;€)</h1>
      <p style={{ color: "rgba(245,230,163,0.92)", fontSize: "16px", lineHeight: 1.55, margin: 0 }}>
        Accede a una lectura más profunda y personalizada de tu sueño: más matices, más vínculos con lo que viviste,{" "}
        <strong>sin repetir</strong> la primera interpretación.
      </p>
      <p
        style={{
          color: "rgba(245,230,163,0.82)",
          fontSize: "15px",
          lineHeight: 1.55,
          margin: "10px 0 0"
        }}
      >
        El paso de pago está <strong>simulado</strong> por ahora; cuando conectes Stripe, aquí mismo vivirá el mismo
        ritual, con el cobro y la tranquilidad de que solo quien corresponde abre esta puerta.
      </p>

      {!desbloqueado ? (
        <div style={caja}>
          <p style={{ marginTop: 0 }}>
            <strong>Tu relato</strong> (resumen): {sueno.length > 220 ? `${sueno.slice(0, 220)}…` : sueno}
          </p>
          {interpretacionBasica ? (
            <p style={{ opacity: 0.92 }}>
              <strong>Ya viste</strong> una primera lectura. Lo que viene ahora amplía capas y conexiones, sin repetir
              lo mismo.
            </p>
          ) : null}
          <p style={{ marginBottom: 0 }}>
            Incluye el relato que trajiste y, si la hay, tu primera interpretación: la profunda enlaza con eso sin
            copiarla.
          </p>
          <button type="button" style={btnPrimario} onClick={iniciarPagoSimulado} disabled={cargando}>
            Ver el mensaje oculto de tu sueño ✨
          </button>
          <p style={{ marginTop: "8px", fontSize: "14px", opacity: 0.8, marginBottom: 0 }}>
            También puedes usar: «Desbloquear lectura profunda» — mismo paso.
          </p>
          {error ? (
            <div style={{ marginTop: "12px" }}>
              <p style={{ color: "#ffb3b3", margin: "0 0 8px" }} role="alert">
                {error}
              </p>
              <button
                type="button"
                onClick={iniciarPagoSimulado}
                disabled={cargando}
                style={{
                  ...btnPrimario,
                  marginTop: 0,
                  padding: "8px 16px",
                  fontSize: "14px",
                  background: "rgba(212,175,55,0.25)",
                  color: "#f5e6a3",
                  border: "1px solid rgba(212,175,55,0.5)"
                }}
              >
                Reintentar
              </button>
            </div>
          ) : null}
          <div>
            <Link to="/suenos" style={btnSec}>
              ← Volver al interpretador
            </Link>
          </div>
        </div>
      ) : (
        <div style={caja}>
          <h2 style={{ ...titulo, fontSize: "22px", marginTop: 0 }}>Tu lectura profunda</h2>
          <p style={{ marginTop: 0, fontSize: "15px", opacity: 0.88, marginBottom: 0 }}>
            Lo primero es lo que ya recibiste; debajo puedes seguir en un tono más cercano, como un acompañamiento.
          </p>
          {cargando ? (
            <p
              style={{
                marginTop: "10px",
                marginBottom: 0,
                fontSize: "14px",
                opacity: 0.75,
                fontStyle: "italic",
                color: "#d4c4a8"
              }}
            >
              {faseCarga === "pago" ? "Abriendo tu acceso..." : "Tejiendo la lectura profunda..."}
            </p>
          ) : null}

          <div
            style={{
              marginTop: "18px",
              maxHeight: "min(52vh, 420px)",
              overflowY: "auto",
              padding: "12px 6px",
              borderRadius: "14px",
              background: "rgba(0,0,0,0.35)",
              border: "1px solid rgba(212,175,55,0.15)"
            }}
          >
            {historialRender.map((m, i) => (
              <div
                key={
                  modoEsperaLectura && i === 0
                    ? `espera-${m.texto.slice(0, 24)}`
                    : `${i}-${m.rol}-${m.texto.slice(0, 12)}`
                }
                style={{
                  textAlign: m.rol === "user" ? "right" : "left",
                  marginBottom: "12px"
                }}
              >
                <div style={m.rol === "user" ? chatBurbujaUser : chatBurbujaAi}>{m.texto}</div>
              </div>
            ))}
            {cargandoChat || cargando ? (
              <div style={{ opacity: 0.65, fontStyle: "italic", fontSize: "14px", color: "#d4c4a8" }}>
                {cargando ? "MAIKA está preparando tu lectura..." : "MAIKA está interpretando..."}
              </div>
            ) : null}
            <div ref={chatBottomRef} style={{ height: 1 }} aria-hidden />
          </div>

          {historial.length === 1 && chatActivo ? (
            <div style={{ marginTop: "10px" }}>
              <button
                type="button"
                style={chipPrimeraSugerencia}
                disabled={!chatActivo || cargandoChat}
                onClick={() => setInput("Lo que más me impactó fue...")}
              >
                Lo que más me impactó fue...
              </button>
            </div>
          ) : null}

          <>
            <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "0" }}>
              {sugerenciasChat.map((s) => (
                <button
                  key={s}
                  type="button"
                  style={chipSugerencia}
                  disabled={!chatActivo || cargandoChat}
                  onClick={() => setInput((prev) => (prev.trim() ? `${prev.trim()} ${s}` : s))}
                >
                  {s}
                </button>
              ))}
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe lo que sentiste o lo que más te llamó la atención…"
              rows={3}
              disabled={!chatActivo || cargandoChat}
              style={{
                width: "100%",
                marginTop: "14px",
                padding: "12px 14px",
                borderRadius: "12px",
                border: "1px solid rgba(212,175,55,0.35)",
                background: "rgba(0,0,0,0.45)",
                color: "#f5e6e0",
                fontSize: "15px",
                lineHeight: 1.5,
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
            <button
              type="button"
              style={{
                ...btnPrimario,
                marginTop: "10px",
                opacity: !chatActivo || cargandoChat ? 0.55 : 1,
                cursor: !chatActivo || cargandoChat ? "not-allowed" : "pointer"
              }}
              onClick={enviarMensaje}
              disabled={!chatActivo || cargandoChat || input.trim().length < 3}
            >
              {cargandoChat ? "Pensando…" : "Continuar ✨"}
            </button>
            {errorChat ? (
              <p style={{ color: "#ffb3b3", marginTop: "10px", marginBottom: 0 }} role="alert">
                {errorChat}
              </p>
            ) : null}
          </>

          <div style={{ marginTop: "18px" }}>
            <Link to="/suenos" style={{ ...btnSec, textDecoration: "none" }}>
              ← Nueva interpretación
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
