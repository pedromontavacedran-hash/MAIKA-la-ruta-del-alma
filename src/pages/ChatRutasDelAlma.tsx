import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  enviarChatRutasDelAlma,
  ERROR_CHAT_RUTAS,
  type MensajeChatRutas
} from "../services/apiRutasDelAlma";
import {
  detenerNarracion,
  hablarNatural,
  pausarNarracion,
  reanudarNarracion
} from "../voz";

type Mensaje = {
  id: number;
  role: "user" | "assistant";
  content: string;
  fuentes?: string;
};

const INTRO_CHAT =
  "Investiga y comprende la Cábala, sus símbolos, su historia y sus tradiciones. Las respuestas distinguen entre la tradición documentada y las interpretaciones posteriores, e indican sus fuentes.";

/** Id reservado para la narración de la introducción cuando aún no hay respuestas. */
const VOZ_INTRO_ID = -1;

/**
 * Versión narrable de una respuesta: sin URLs, sin la línea de fuentes,
 * sin iconos ni marcadores; las etiquetas de capa quedan como frase.
 */
function textoParaNarracion(texto: string): string {
  return texto
    .replace(/https?:\/\/\S+/g, "")
    .replace(/Fuentes consultadas:[^\n]*/gi, "")
    .replace(/[📜🔎🎓🧭✨📚]/gu, "")
    .replace(/\*\*/g, "")
    .replace(
      /^(Tradición|Contexto histórico|Investigación académica|Interpretaciones posteriores|Mirada MAIKA)\s*:\s*/gim,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * «Explora y pregunta»: asistente de conocimiento de Rutas del Alma.
 * Conversación real contra el backend (`/rutas-del-alma/chat`, DeepSeek/OpenAI),
 * limitada por el system prompt al corpus documentado de la sección.
 */
export default function ChatRutasDelAlma() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [entrada, setEntrada] = useState("");
  const [cargando, setCargando] = useState(false);
  const [copiadoId, setCopiadoId] = useState<number | null>(null);
  const [vozId, setVozId] = useState<number | null>(null);
  const [vozPausada, setVozPausada] = useState(false);
  const idRef = useRef(0);
  const hiloRef = useRef<HTMLDivElement>(null);
  const vozDisponible =
    typeof window !== "undefined" && typeof window.speechSynthesis !== "undefined";

  /* Si el modal/página se desmonta, la narración no puede seguir sonando. */
  useEffect(() => () => detenerNarracion(), []);

  const escucharRespuesta = (m: Mensaje) => {
    const texto = textoParaNarracion(m.content);
    if (!texto) return;
    setVozPausada(false);
    setVozId(m.id);
    hablarNatural(texto, true, null, 0.9, 1, undefined, () => {
      setVozId(null);
      setVozPausada(false);
    });
  };

  /** Cabecera: narra la última respuesta del asistente; si aún no hay, lee la introducción. */
  const escucharDesdeCabecera = () => {
    const ultima = [...mensajes].reverse().find((m) => m.role === "assistant");
    if (ultima) {
      escucharRespuesta(ultima);
      return;
    }
    setVozPausada(false);
    setVozId(VOZ_INTRO_ID);
    hablarNatural(INTRO_CHAT, true, null, 0.9, 1, undefined, () => {
      setVozId(null);
      setVozPausada(false);
    });
  };

  const pausarReanudarVoz = () => {
    if (vozPausada) {
      reanudarNarracion();
      setVozPausada(false);
    } else {
      pausarNarracion();
      setVozPausada(true);
    }
  };

  const detenerVoz = () => {
    detenerNarracion();
    setVozId(null);
    setVozPausada(false);
  };

  const copiarRespuesta = async (m: Mensaje) => {
    const texto = m.fuentes
      ? `${m.content}\n\nFuentes consultadas: ${m.fuentes}`
      : m.content;
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      const area = document.createElement("textarea");
      area.value = texto;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopiadoId(m.id);
    window.setTimeout(() => setCopiadoId(null), 2000);
  };

  const preguntar = async () => {
    const pregunta = entrada.trim();
    if (!pregunta || cargando) return;

    detenerNarracion();
    setVozId(null);
    setVozPausada(false);
    idRef.current += 1;
    const idPregunta = idRef.current;
    setEntrada("");
    setMensajes((prev) => [...prev, { id: idPregunta, role: "user", content: pregunta }]);
    setCargando(true);
    requestAnimationFrame(() => {
      /* Al enviar, la pregunta queda arriba de la vista (tras ella vendrá «Consultando…»). */
      const hilo = hiloRef.current;
      const ultimo = hilo?.lastElementChild;
      const preguntaEl = ultimo?.previousElementSibling ?? ultimo;
      preguntaEl?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    /* El backend recibe todo el hilo: las respuestas de seguimiento mantienen contexto. */
    const historial: MensajeChatRutas[] = [
      ...mensajes.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: pregunta }
    ];
    const r = await enviarChatRutasDelAlma(historial);

    idRef.current += 1;
    setMensajes((prev) => [
      ...prev,
      {
        id: idRef.current,
        role: "assistant",
        content: r.ok ? r.mensaje : r.mensaje || ERROR_CHAT_RUTAS,
        fuentes: r.ok ? r.fuentes : undefined
      }
    ]);
    setCargando(false);
    requestAnimationFrame(() => {
      /* La vista arranca en la pregunta del usuario: la respuesta se lee hacia abajo. */
      const hilo = hiloRef.current;
      const ultimo = hilo?.lastElementChild;
      const preguntaEl = ultimo?.previousElementSibling ?? ultimo;
      preguntaEl?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void preguntar();
  };

  return (
    <section className="rutas-del-alma-chat" aria-labelledby="chat-rutas-titulo">
      <div className="rutas-del-alma-chat-cabecera">
        <h3 id="chat-rutas-titulo" className="rutas-del-alma-seccion-titulo">
          🔎 Explora y pregunta
        </h3>
        {vozDisponible ? (
          vozId !== null ? (
            <span className="chat-acciones chat-acciones--cabecera">
              <button
                type="button"
                className="chat-voz"
                onClick={pausarReanudarVoz}
                aria-label={vozPausada ? "Continuar la narración" : "Pausar la narración"}
              >
                {vozPausada ? "▶️ Continuar" : "⏸️ Pausar"}
              </button>
              <button
                type="button"
                className="chat-voz"
                onClick={detenerVoz}
                aria-label="Detener la narración"
              >
                ⏹️ Detener
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="chat-voz"
              onClick={escucharDesdeCabecera}
              aria-label="Escuchar con voz las respuestas del chat"
              title="Escuchar con voz"
            >
              🔊 Escuchar
            </button>
          )
        ) : null}
      </div>
      <p className="rutas-del-alma-chat-intro">{INTRO_CHAT}</p>

      {mensajes.length > 0 ? (
        <div className="rutas-del-alma-chat-mensajes" ref={hiloRef}>
          {mensajes.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="rutas-del-alma-chat-mensaje">
                <p className="chat-pregunta"><strong>Tú:</strong> {m.content}</p>
              </div>
            ) : (
              <div key={m.id} className="rutas-del-alma-chat-mensaje">
                <div className="chat-respuesta">
                  <p className="chat-quien">Rutas del Alma</p>
                  {m.content.split(/\n{2,}/).map((parrafo, i) => (
                    <p key={i}>{parrafo}</p>
                  ))}
                  {m.fuentes ? (
                    <p className="chat-fuentes">Fuentes consultadas: {m.fuentes}</p>
                  ) : null}
                  <div className="chat-acciones chat-acciones--flotantes">
                    <button
                      type="button"
                      className="chat-copiar"
                      onClick={() => void copiarRespuesta(m)}
                      aria-label="Copiar esta respuesta"
                    >
                      {copiadoId === m.id ? "Copiado ✓" : "📋"}
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
          {cargando ? (
            <div className="rutas-del-alma-chat-mensaje">
              <div className="chat-respuesta">
                <p className="chat-quien">Rutas del Alma</p>
                <p className="chat-cargando">Consultando las fuentes…</p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <form className="rutas-del-alma-chat-form" onSubmit={onSubmit}>
        <input
          type="text"
          value={entrada}
          onChange={(e) => setEntrada(e.target.value)}
          placeholder="Escribe tu pregunta..."
          aria-label="Escribe tu pregunta sobre la Cábala"
          maxLength={500}
          disabled={cargando}
        />
        <button type="submit" disabled={cargando || !entrada.trim()}>
          {cargando ? "Consultando…" : "Investigar ✨"}
        </button>
      </form>
    </section>
  );
}
