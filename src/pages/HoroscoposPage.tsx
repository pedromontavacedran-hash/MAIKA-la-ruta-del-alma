import { useEffect, useLayoutEffect, useRef, useState, type ReactElement } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getApiBaseUrl } from "@/config/apiBaseUrl";
import { esSignoId, guardarLecturaDiaria, type SignoId } from "@/utils/horoscopoDiario";
import {
  guardarIndiceArcanoTirada,
  indiceArcanoAleatorio,
  leerIndiceArcanoTirada,
  quitarArcanoTirada
} from "@/utils/tiradaArcanoStorage";

function useHoroscoposNoScroll() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add("horoscopos-no-scroll");
    body.classList.add("horoscopos-no-scroll");
    return () => {
      html.classList.remove("horoscopos-no-scroll");
      body.classList.remove("horoscopos-no-scroll");
    };
  }, []);
}

function ZodiacIcon({ signo, className }: { signo: SignoId; className?: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const icons: Record<SignoId, ReactElement> = {
    aries: (
      <>
        <path {...common} d="M8 18c0-5 2.6-8 5.8-8 2.1 0 3.7 1.6 3.7 3.8V28" />
        <path {...common} d="M32 18c0-5-2.6-8-5.8-8-2.1 0-3.7 1.6-3.7 3.8V28" />
      </>
    ),
    tauro: (
      <>
        <circle {...common} cx="20" cy="22" r="7.5" />
        <path {...common} d="M9 14c1.8-4 5-6 11-6s9.2 2 11 6" />
      </>
    ),
    geminis: (
      <>
        <path {...common} d="M12 9h16M12 31h16" />
        <path {...common} d="M15 10c2.2 5.5 2.2 10.5 0 20" />
        <path {...common} d="M25 10c-2.2 5.5-2.2 10.5 0 20" />
      </>
    ),
    cancer: (
      <>
        <circle {...common} cx="14" cy="14" r="4.2" />
        <circle {...common} cx="26" cy="26" r="4.2" />
        <path {...common} d="M10 26c2.2-5.8 7-8.2 13-8.2 4.2 0 7.5 1 10 3.2" />
      </>
    ),
    leo: (
      <>
        <circle {...common} cx="26" cy="12.5" r="4.3" />
        <path {...common} d="M30 15.5c-6.8 0-12 3.8-12 9.8 0 3.6 2.4 6.7 6.4 6.7 3.3 0 5.8-2.3 5.8-5.3 0-2.4-1.7-4.4-4.1-4.4-1.6 0-2.8.8-3.6 2" />
      </>
    ),
    virgo: (
      <>
        <path {...common} d="M10 30V14c0-2 1.4-3.6 3.1-3.6S16 12 16 14v16" />
        <path {...common} d="M16 30V14c0-2 1.4-3.6 3.1-3.6S22 12 22 14v16" />
        <path {...common} d="M22 22c2.2 0 3.6 1.8 3.6 4.1 0 1.7-.8 3-2 3.9" />
        <path {...common} d="M24 30c3.4 0 5.5-2.3 6.2-5.3" />
      </>
    ),
    libra: (
      <>
        <path {...common} d="M9 28h22" />
        <path {...common} d="M12 23h16" />
        <path {...common} d="M14 23a6 6 0 0 1 12 0" />
      </>
    ),
    escorpio: (
      <>
        <path {...common} d="M10 30V14c0-2 1.4-3.6 3.1-3.6S16 12 16 14v16" />
        <path {...common} d="M16 30V14c0-2 1.4-3.6 3.1-3.6S22 12 22 14v16" />
        <path {...common} d="M22 30V14c0-2 1.4-3.6 3.1-3.6S26 12 26 14v11" />
        <path {...common} d="M26 25l4 3-4 3" />
      </>
    ),
    sagitario: (
      <>
        <path {...common} d="M10 30 30 10" />
        <path {...common} d="M21 10h9v9" />
        <path {...common} d="M12.5 17.5h7M12.5 17.5v7" />
      </>
    ),
    capricornio: (
      <>
        <path {...common} d="M10 30V14c0-2 1.4-3.6 3.1-3.6S16 12 16 14v10.5c0 3.2 2 5.5 5 5.5 2.8 0 4.8-1.9 4.8-4.5 0-2.2-1.6-4-4-4" />
        <path {...common} d="M21.8 21.5c2.1 0 3.7-1.6 3.7-3.7s-1.6-3.7-3.7-3.7" />
      </>
    ),
    acuario: (
      <>
        <path {...common} d="M8 15c2.5 0 3.5-2 6-2s3.5 2 6 2 3.5-2 6-2 3.5 2 6 2" />
        <path {...common} d="M8 24c2.5 0 3.5-2 6-2s3.5 2 6 2 3.5-2 6-2 3.5 2 6 2" />
      </>
    ),
    piscis: (
      <>
        <path {...common} d="M20 9v22" />
        <path {...common} d="M10 12c4.5 0 7.2 2.8 10 8 2.8-5.2 5.5-8 10-8" />
        <path {...common} d="M10 28c4.5 0 7.2-2.8 10-8 2.8 5.2 5.5 8 10 8" />
      </>
    ),
  };

  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
      {icons[signo]}
    </svg>
  );
}

const SIGNOS_EN_RUEDA = 12;

/**
 * Radios desde el centro (expresiones `min()` para que encajen con `.rueda.rueda--noria`
 * en viewports estrechos).
 */
/** Orbita cerca del aro exterior (encaja con `.rueda.rueda--noria` min ~528px / 84vw). */
const NORIA_GEOM = {
  radialNodoBajo: "min(139px, 23vw)",
  radialNodoMed: "min(192px, 32vw)",
  radialNodoAlto: "min(257px, 43vw)",
  marca: "min(208px, 34vw)",
  conexion: "min(257px, 43vw)",
  nodoSigno: "min(257px, 43vw)",
  signo: "min(218px, 36vw)",
} as const;

function mod360(g: number): number {
  return ((g % 360) + 360) % 360;
}

/** Rotación absoluta que deja el signo `indice` (0 = Aries) arriba; si ya coincide, no avanza vueltas vacías. */
function rotacionAbsolutaParaSigno(indice: number, rotacionActual: number): number {
  const angle = (indice / SIGNOS_EN_RUEDA) * 360;
  const objetivoBase = -90 - angle;
  const targetMod = mod360(objetivoBase);
  const curMod = mod360(rotacionActual);
  if (curMod === targetMod) return rotacionActual;
  let objetivo = objetivoBase;
  while (objetivo <= rotacionActual) objetivo += 360;
  return objetivo;
}

function rotacionAlineadaAries(rotacionActual: number): number {
  return rotacionAbsolutaParaSigno(0, rotacionActual);
}

/** Pausa antes del giro a Aries (sin animación de salida de carta). */
const MS_PAUSA_TRAS_SALIDA = 3000;
const DURACION_GIRO_RUEDA_ARIES_SEG = 3;
const STORAGE_RESET_ARIES_AT = "horoscopos-reset-aries-at";
const ROTACION_BASE_ARIES = -90;

/**
 * El límite del horóscopo (1 lectura por día natural, hora de España) vive en el backend
 * (`usr:<id>` en `horoscopo_uso_diario.json`). localStorage queda solo como caché visual para
 * que /lectura pueda pintar la carta; no decide nada.
 */
async function consultarEstadoHoroscopo(): Promise<{ yaUsado: boolean; signo: SignoId | null; restanteMs: number }> {
  const base = getApiBaseUrl();
  const urls = import.meta.env.DEV
    ? [`${base}/horoscopo/estado`, "/api/horoscopo/estado"]
    : [`${base}/horoscopo/estado`];
  for (const url of urls) {
    try {
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404 && url !== urls[urls.length - 1]) continue;
      const data = await res.json().catch(() => ({}));
      const signo = typeof data?.signo === "string" && esSignoId(data.signo) ? data.signo : null;
      const restanteMs = Number.isFinite(Number(data?.restanteMs)) ? Math.max(0, Number(data.restanteMs)) : 0;
      return { yaUsado: data?.yaUsado === true, signo, restanteMs };
    } catch {
      /* probar la siguiente URL */
    }
  }
  return { yaUsado: false, signo: null, restanteMs: 0 };
}



async function registrarUsoHoroscopo(signo: SignoId): Promise<void> {
  const base = getApiBaseUrl();
  const urls = import.meta.env.DEV
    ? [`${base}/horoscopo/uso`, "/api/horoscopo/uso"]
    : [`${base}/horoscopo/uso`];
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ signo })
      });
      if (res.status === 404 && url !== urls[urls.length - 1]) continue;
      return;
    } catch {
      /* probar la siguiente URL */
    }
  }
}

const CARTA_TRASERA_POR_SIGNO: Record<SignoId, string> = {
  aries: "/tarot/Aries.jpg",
  tauro: "/tarot/Tauro.jpg",
  geminis: "/tarot/Géminis.jpg",
  cancer: "/tarot/Cáncer.jpg",
  leo: "/tarot/Leo.jpg",
  virgo: "/tarot/Virgo.jpg",
  libra: "/tarot/Libra.jpg",
  escorpio: "/tarot/Escorpio.jpg",
  sagitario: "/tarot/Sagitario.jpg",
  capricornio: "/tarot/Capricornio.jpg",
  acuario: "/tarot/Acuario.jpg",
  piscis: "/tarot/Piscis.jpg",
};
const CARTA_REVERSO_BASE = "/tarot/reverso-base.jpg";
const CARTA_TRASERA_FALLBACK = CARTA_REVERSO_BASE;

export default function HoroscoposPage() {
  useHoroscoposNoScroll();
  const cartaTraseraSrc = CARTA_REVERSO_BASE;

  const signos = [
    { id: "aries" as const, nombre: "Aries" },
    { id: "tauro" as const, nombre: "Tauro" },
    { id: "geminis" as const, nombre: "Géminis" },
    { id: "cancer" as const, nombre: "Cáncer" },
    { id: "leo" as const, nombre: "Leo" },
    { id: "virgo" as const, nombre: "Virgo" },
    { id: "libra" as const, nombre: "Libra" },
    { id: "escorpio" as const, nombre: "Escorpio" },
    { id: "sagitario" as const, nombre: "Sagitario" },
    { id: "capricornio" as const, nombre: "Capricornio" },
    { id: "acuario" as const, nombre: "Acuario" },
    { id: "piscis" as const, nombre: "Piscis" },
  ];

  const [activo, setActivo] = useState<number | null>(null);
  const [signoSeleccionado, setSignoSeleccionado] = useState<SignoId | null>(null);
  const [signoRevelado, setSignoRevelado] = useState<SignoId | null>(null);
  const [tiradaHecha, setTiradaHecha] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [rotacionRueda, setRotacionRueda] = useState(ROTACION_BASE_ARIES);
  const [duracionGiroSegundos, setDuracionGiroSegundos] = useState(18);
  const [girando, setGirando] = useState(false);
  const [signoCarta, setSignoCarta] = useState<number | null>(null);
  const [pulsoActivo, setPulsoActivo] = useState(false);
  const [cartaEntradaSeq, setCartaEntradaSeq] = useState(0);
  const [cartaSaliendo, setCartaSaliendo] = useState(false);
  const [cartaHoverActiva, setCartaHoverActiva] = useState(false);
  const [hoverSignoId, setHoverSignoId] = useState<SignoId | null>(null);
  const [accesoDiarioVerificado, setAccesoDiarioVerificado] = useState(false);
  /** Fin del bloqueo diario (medianoche Europe/Madrid). 0 = sin bloqueo. */
  const [horoscopoBloqueadoHasta, setHoroscopoBloqueadoHasta] = useState(0);
  const [ahoraMs, setAhoraMs] = useState(() => Date.now());
  const giroTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulsoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetAriesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const postCartaTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const flujoCartaActivoRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const previewActivo = query.get("preview") === "1";
  const STORAGE_SIGNO_SELECCIONADO = "tirada-signo-seleccionado";
  const dataSignos: Record<SignoId, { frase: string; carta: string; mensaje: string }> = {
    aries: {
      frase: "Se abre una oportunidad, pero tendras que decidir rapido.",
      carta: "El Impulso",
      mensaje: "Actuar sin dudar sera clave.",
    },
    tauro: {
      frase: "Algo se estabiliza por fin, pero requiere paciencia.",
      carta: "La Tierra",
      mensaje: "Lo constante dara resultado.",
    },
    geminis: {
      frase: "Viene una conversacion importante que lo cambia todo.",
      carta: "El Vinculo",
      mensaje: "Escuchar sera mas importante que hablar.",
    },
    cancer: {
      frase: "Tus emociones te estan avisando de algo importante.",
      carta: "El Refugio",
      mensaje: "Confia en lo que sientes.",
    },
    leo: {
      frase: "Es tu momento de destacar, pero sin forzarlo.",
      carta: "El Sol Interior",
      mensaje: "Tu energia atraera lo que buscas.",
    },
    virgo: {
      frase: "Algo pequeno marcara una gran diferencia.",
      carta: "La Pureza",
      mensaje: "El detalle sera la clave.",
    },
    libra: {
      frase: "Tendras que tomar una decision que llevas evitando.",
      carta: "La Balanza",
      mensaje: "El equilibrio no es quedarse quieto.",
    },
    escorpio: {
      frase: "Un cambio llega, aunque no lo esperabas.",
      carta: "La Sombra",
      mensaje: "Soltar te hara avanzar.",
    },
    sagitario: {
      frase: "Se abre un camino nuevo, pero depende de ti dar el paso.",
      carta: "El Camino",
      mensaje: "Atrevete a salir de lo conocido.",
    },
    capricornio: {
      frase: "Todo empieza a tomar forma, sigue asi.",
      carta: "La Cumbre",
      mensaje: "La constancia te acerca a tu meta.",
    },
    acuario: {
      frase: "Algo rompe tu rutina para bien.",
      carta: "La Vision",
      mensaje: "Aceptar el cambio te abrira puertas.",
    },
    piscis: {
      frase: "Tu intuicion esta mas fuerte de lo normal.",
      carta: "El Sueno",
      mensaje: "Haz caso a esa sensacion.",
    },
  };

  useLayoutEffect(() => {
    if (previewActivo) {
      setAccesoDiarioVerificado(true);
      return;
    }
    let vivo = true;
    void (async () => {
      // El backend decide si hoy ya hay lectura para esta cuenta; localStorage solo es caché.
      // Si ya se consumió la lectura diaria, NO se navega a /lectura: se muestra el bloqueo
      // directamente en esta página (igual que en Sueños), sin cartas ni CTAs.
      const estado = await consultarEstadoHoroscopo();
      if (!vivo) return;
      if (estado.yaUsado) {
        const hasta = estado.restanteMs > 0
          ? Date.now() + estado.restanteMs
          : Number.MAX_SAFE_INTEGER;
        setHoroscopoBloqueadoHasta(hasta);
        setAhoraMs(Date.now());
        setAccesoDiarioVerificado(true);
        return;
      }
      setAccesoDiarioVerificado(true);
    })();
    return () => {
      vivo = false;
    };
  }, [navigate, previewActivo]);

  const clearPostCartaTimers = () => {
    postCartaTimersRef.current.forEach((id) => clearTimeout(id));
    postCartaTimersRef.current = [];
  };

  useEffect(() => {
    const aplicarResetAriesSilencioso = () => {
      // Se aplica en background (sin animación visible) para que la rueda arranque en Aries.
      setDuracionGiroSegundos(DURACION_GIRO_RUEDA_ARIES_SEG);
      setGirando(false);
      setRotacionRueda((prev) => rotacionAlineadaAries(prev));
      setActivo(null);
      localStorage.removeItem(STORAGE_RESET_ARIES_AT);
      if (resetAriesTimeoutRef.current) {
        clearTimeout(resetAriesTimeoutRef.current);
        resetAriesTimeoutRef.current = null;
      }
    };

    const resetAriesAtRaw = localStorage.getItem(STORAGE_RESET_ARIES_AT);
    if (!resetAriesAtRaw) {
      return;
    }
    const resetAriesAt = Number(resetAriesAtRaw);
    if (!Number.isFinite(resetAriesAt)) {
      localStorage.removeItem(STORAGE_RESET_ARIES_AT);
      return;
    }

    const delay = resetAriesAt - Date.now();
    if (delay <= 0) {
      aplicarResetAriesSilencioso();
      return;
    }
    resetAriesTimeoutRef.current = setTimeout(aplicarResetAriesSilencioso, delay);
    return () => {
      if (resetAriesTimeoutRef.current) {
        clearTimeout(resetAriesTimeoutRef.current);
        resetAriesTimeoutRef.current = null;
      }
    };
  }, []);

  const puntoSeguroCarta = (
    event: React.PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>,
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const margenX = Math.min(16, rect.width * 0.08);
    const margenTop = Math.min(18, rect.height * 0.1);
    const margenBottom = Math.min(12, rect.height * 0.06);
    return x >= margenX && x <= rect.width - margenX && y >= margenTop && y <= rect.height - margenBottom;
  };

  const actualizarHoverCarta = (event: React.PointerEvent<HTMLDivElement>) => {
    setCartaHoverActiva(puntoSeguroCarta(event));
  };

  const resetHoverSigno = () => {
    setHoverSignoId(null);
  };

  useEffect(() => {
    return () => {
      if (giroTimeoutRef.current) {
        clearTimeout(giroTimeoutRef.current);
      }
      if (pulsoTimeoutRef.current) {
        clearTimeout(pulsoTimeoutRef.current);
      }
      if (resetAriesTimeoutRef.current) {
        clearTimeout(resetAriesTimeoutRef.current);
      }
      clearPostCartaTimers();
    };
  }, []);

  const revelarCarta = () => {
    if (girando || signoCarta === null || !signoSeleccionado) {
      return;
    }
    if (tiradaHecha && signoRevelado) {
      navigate("/lectura", {
        state: {
          signo: signoRevelado,
        },
      });
      return;
    }
    if (flujoCartaActivoRef.current) {
      return;
    }
    flujoCartaActivoRef.current = true;

    const storageKey = `tirada-${signoSeleccionado}`;
    const guardado = localStorage.getItem(storageKey) as SignoId | null;
    const resultado = guardado ?? signoSeleccionado;
    if (!guardado) {
      localStorage.setItem(storageKey, resultado);
    }
    if (previewActivo) {
      // En preview admin forzamos tirada nueva en cada prueba.
      guardarIndiceArcanoTirada(resultado, indiceArcanoAleatorio());
    } else if (leerIndiceArcanoTirada(resultado) == null) {
      guardarIndiceArcanoTirada(resultado, indiceArcanoAleatorio());
    }
    localStorage.setItem(STORAGE_SIGNO_SELECCIONADO, signoSeleccionado);
    guardarLecturaDiaria(resultado, null);
    void registrarUsoHoroscopo(resultado);
    setSignoRevelado(resultado);
    setFlipped(false);
    setCartaSaliendo(false);
    setTiradaHecha(true);

    if (giroTimeoutRef.current) {
      clearTimeout(giroTimeoutRef.current);
      giroTimeoutRef.current = null;
    }
    if (pulsoTimeoutRef.current) {
      clearTimeout(pulsoTimeoutRef.current);
      pulsoTimeoutRef.current = null;
    }
    clearPostCartaTimers();
    setPulsoActivo(false);

    localStorage.setItem(STORAGE_RESET_ARIES_AT, String(Date.now() + MS_PAUSA_TRAS_SALIDA));
    flujoCartaActivoRef.current = false;
    navigate("/lectura", {
      state: {
        signo: resultado,
      },
    });
  };

  const cerrarCartaTemporal = () => {
    if (tiradaHecha) {
      return;
    }
    setFlipped(false);
    setSignoCarta(null);
  };

  const reiniciarTirada = () => {
    if (signoSeleccionado) {
      localStorage.removeItem(`tirada-${signoSeleccionado}`);
      quitarArcanoTirada(signoSeleccionado);
    }
    localStorage.removeItem(STORAGE_SIGNO_SELECCIONADO);
    setTiradaHecha(false);
    setFlipped(false);
    setSignoRevelado(null);
    setRotacionRueda(ROTACION_BASE_ARIES);
    setActivo(null);
    setSignoCarta(null);
    setSignoSeleccionado(null);
    setGirando(false);
    setDuracionGiroSegundos(18);
    setCartaSaliendo(false);
    flujoCartaActivoRef.current = false;
    clearPostCartaTimers();
    if (giroTimeoutRef.current) {
      clearTimeout(giroTimeoutRef.current);
      giroTimeoutRef.current = null;
    }
    if (pulsoTimeoutRef.current) {
      clearTimeout(pulsoTimeoutRef.current);
      pulsoTimeoutRef.current = null;
    }
    setPulsoActivo(false);
  };

  // Actualiza el restante del bloqueo diario; al llegar a 00:00 (hora española) se libera solo.
  useEffect(() => {
    if (horoscopoBloqueadoHasta <= Date.now()) return;
    const id = window.setInterval(() => setAhoraMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [horoscopoBloqueadoHasta]);

  if (!accesoDiarioVerificado) {
    return null;
  }

  const horoscopoBloqueado = horoscopoBloqueadoHasta > ahoraMs;
  if (horoscopoBloqueado) {
    return (
      <div style={{ padding: 20, color: "white" }}>
        <div style={{ maxWidth: 720 }}>
          <h1
            className="horoscopo-titulo"
            style={{
              fontSize: "32px",
              color: "#d4af37",
              letterSpacing: "1px",
              textShadow: "0 0 10px rgba(212,175,55,0.5)",
              marginBottom: "6px",
              textTransform: "uppercase"
            }}
          >
            Horóscopo diario
          </h1>
          <p className="horoscopo-sub">Las estrellas te esperan cada mañana</p>
        </div>
        <div
          role="status"
          style={{
            maxWidth: 480,
            margin: "24px auto",
            padding: "22px 20px",
            borderRadius: 12,
            textAlign: "center",
            color: "#f5e6a3",
            background: "rgba(120, 90, 200, 0.10)",
            border: "1px solid rgba(212, 175, 55, 0.3)"
          }}
        >
          <p style={{ margin: "0 0 14px", fontSize: 16, lineHeight: 1.5 }}>
            🔮 Ya has utilizado tu horóscopo gratuito de hoy.
          </p>
          <p
            style={{
              margin: 0,
              marginLeft: "9%",
              color: "rgba(245, 230, 163, 0.85)",
              fontSize: 14,
              lineHeight: 1.55
            }}
          >
            Podrás consultar una nueva lectura a partir de las 00:00 h.
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{
              marginTop: 24,
              padding: "9px 14px",
              borderRadius: 10,
              background: "none",
              border: "1px solid rgba(212, 175, 55, 0.35)",
              color: "rgba(245, 230, 163, 0.85)",
              cursor: "pointer"
            }}
          >
            ← Volver a Maika
          </button>
        </div>
      </div>
    );
  }

  const seleccionarSigno = (indice: number) => {
    resetHoverSigno();
    const angle = (indice / signos.length) * 360;
    const objetivoBase = -90 - angle;
    // Objetivo absoluto: siempre horario y siempre aterriza exacto en su sitio.
    let objetivoAbsoluto = objetivoBase;
    while (objetivoAbsoluto <= rotacionRueda) {
      objetivoAbsoluto += 360;
    }
    const deltaHorario = objetivoAbsoluto - rotacionRueda;
    const gradosPorSegundo = 56;
    const duracion = Math.max(3.4, Math.min(8.6, deltaHorario / gradosPorSegundo));
    setDuracionGiroSegundos(duracion);
    setGirando(true);
    if (giroTimeoutRef.current) {
      clearTimeout(giroTimeoutRef.current);
    }
    if (pulsoTimeoutRef.current) {
      clearTimeout(pulsoTimeoutRef.current);
      pulsoTimeoutRef.current = null;
    }
    setPulsoActivo(false);
    giroTimeoutRef.current = setTimeout(() => {
      setGirando(false);
      setSignoCarta(indice);
      setCartaEntradaSeq((prev) => prev + 1);
      setPulsoActivo(true);
      pulsoTimeoutRef.current = setTimeout(() => {
        setPulsoActivo(false);
        pulsoTimeoutRef.current = null;
      }, 220);
      giroTimeoutRef.current = null;
    }, Math.ceil(duracion * 1000) + 120);
    setRotacionRueda(objetivoAbsoluto);
    setActivo(indice);
    setSignoSeleccionado(signos[indice].id);
  };

  const datosSignoRevelado = signoRevelado ? dataSignos[signoRevelado] : null;
  /* Mientras la rueda gira no se debe ver a qué signo va la carta: solo tras parar (`signoCarta`,
     fijado en el timeout de `seleccionarSigno`) o si `activo` quedó de antes sin estar girando. */
  const signoActualCarta =
    signoCarta !== null ? signos[signoCarta].id : !girando && activo !== null ? signos[activo].id : null;
  const cartaTraseraSignoSrc = signoActualCarta
    ? encodeURI(CARTA_TRASERA_POR_SIGNO[signoActualCarta])
    : cartaTraseraSrc;

  return (
    <div className="inicio-page horoscopos-page horoscopos-page--noria">
      <div className="inicio-bloques-texto horoscopos-page__shell horoscopos-page__shell--noria">
        <div className="horoscopos-selector horoscopos-selector--noria">
          <header className="horoscopos-noria-header">
            <h1 className="horoscopo-titulo">Horóscopo diario</h1>
            {signoRevelado === null ? (
              <p className="horoscopo-sub">Pulsa tu signo y revela tu carta de hoy</p>
            ) : (
              <p className="horoscopo-sub horoscopo-sub--frase">{datosSignoRevelado?.frase}</p>
            )}
          </header>
          <div className="rueda rueda--noria">
            <div className={`rueda-centro${hoverSignoId ? " rueda-centro--activo" : ""}`} aria-hidden="true" />
            <div className="rueda-anillo rueda-anillo--externo" aria-hidden="true" />
            <div className="rueda-anillo rueda-anillo--medio" aria-hidden="true" />
            <div className="rueda-anillo rueda-anillo--micro-a" aria-hidden="true" />
            <div className="rueda-anillo rueda-anillo--micro-b" aria-hidden="true" />
            <div className="rueda-radiales" aria-hidden="true">
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i / 12) * 360;
                return (
                  <div key={`radial-${i}`}>
                    <span
                      className="rueda-radial"
                      style={{ transform: `translate(-50%, -50%) rotate(${angle}deg)` }}
                    />
                    <span
                      className="rueda-nodo-interseccion"
                      style={{
                        transform: `translate(-50%, -50%) rotate(${angle}deg) translate(${NORIA_GEOM.radialNodoBajo})`,
                      }}
                    />
                    <span
                      className="rueda-nodo-interseccion"
                      style={{
                        transform: `translate(-50%, -50%) rotate(${angle}deg) translate(${NORIA_GEOM.radialNodoMed})`,
                      }}
                    />
                    <span
                      className="rueda-nodo-interseccion rueda-nodo-interseccion--exterior"
                      style={{
                        transform: `translate(-50%, -50%) rotate(${angle}deg) translate(${NORIA_GEOM.radialNodoAlto})`,
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="rueda-marcas" aria-hidden="true">
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = (i / 24) * 360;
                return (
                  <span
                    key={`marca-${i}`}
                    className="rueda-marca"
                    style={{
                      transform: `translate(-50%, -50%) rotate(${angle}deg) translate(${NORIA_GEOM.marca})`,
                    }}
                  />
                );
              })}
            </div>
            <div className="rueda-conexiones" aria-hidden="true">
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = (i / 24) * 360 + 7.5;
                return (
                  <span
                    key={`conexion-${i}`}
                    className="rueda-conexion"
                    style={{
                      transform: `translate(-50%, -50%) rotate(${angle}deg) translate(${NORIA_GEOM.conexion})`,
                    }}
                  />
                );
              })}
            </div>
            <div className="rueda-nodos-signos" aria-hidden="true">
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = (i / 24) * 360;
                return (
                  <span
                    key={`nodo-signo-${i}`}
                    className="rueda-nodo-signo"
                    style={{
                      transform: `translate(-50%, -50%) rotate(${angle}deg) translate(${NORIA_GEOM.nodoSigno})`,
                    }}
                  />
                );
              })}
            </div>
            <div
              className={`signos-capa${girando ? " signos-capa--girando" : ""}`}
              style={{
                transform: `rotate(${rotacionRueda}deg)`,
                ["--rueda-rot-dur" as string]: `${duracionGiroSegundos}s`,
                ["--rueda-rot-angle" as string]: `${rotacionRueda}deg`,
              }}
            >
              {signos.map((signo, i) => {
                const angle = (i / signos.length) * 360;
                return (
                  <button
                    key={signo.nombre}
                    type="button"
                    className={`signo${activo === i ? " activo" : ""}${activo === i && pulsoActivo ? " signo--pulso" : ""}`}
                    style={{
                      transform: `translate(-50%, -50%) rotate(${angle}deg) translate(${NORIA_GEOM.signo}) rotate(-${angle}deg)`,
                    }}
                    onClick={() => seleccionarSigno(i)}
                    onMouseEnter={() => setHoverSignoId(signo.id)}
                    onMouseLeave={resetHoverSigno}
                    aria-pressed={activo === i}
                    aria-label={signo.nombre}
                  >
                    <span className="signo-contenido">
                      <span className="signo-circulo" aria-hidden="true">
                        <ZodiacIcon signo={signo.id} className="icono" />
                      </span>
                      <span className="nombre">{signo.nombre}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="carta-container carta-container--noria-centro">
              <div className={`carta-wrapper carta-wrapper--noria${cartaSaliendo ? " carta-wrapper--saliendo" : ""}`}>
                <div
                  key={cartaEntradaSeq}
                  className={`carta-inner carta-inner--noria carta-inner--entrada ${flipped ? "flipped" : ""}${cartaHoverActiva ? " carta-inner--hover-activa" : ""}${hoverSignoId ? " carta-inner--signo-hover" : ""}`}
                  onPointerEnter={actualizarHoverCarta}
                  onPointerMove={actualizarHoverCarta}
                  onPointerLeave={() => setCartaHoverActiva(false)}
                  onClick={(e) => {
                    if (!puntoSeguroCarta(e)) return;
                    revelarCarta();
                  }}
                >
                  <div className="carta cara-trasera">
                    <img
                      src={cartaTraseraSignoSrc}
                      alt="Carta boca abajo"
                      onError={(e) => {
                        if (e.currentTarget.src.endsWith(CARTA_TRASERA_FALLBACK)) {
                          e.currentTarget.onerror = null;
                          return;
                        }
                        e.currentTarget.src = CARTA_TRASERA_FALLBACK;
                      }}
                    />
                  </div>
                  <div className="carta cara-frontal">
                    <img
                      src={cartaTraseraSignoSrc}
                      alt=""
                      className="carta-frontal-base"
                      aria-hidden="true"
                      onError={(e) => {
                        if (e.currentTarget.src.endsWith(CARTA_TRASERA_FALLBACK)) {
                          e.currentTarget.onerror = null;
                          return;
                        }
                        e.currentTarget.src = CARTA_TRASERA_FALLBACK;
                      }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className={`carta-cerrar-temp carta-cerrar-temp--noria${flipped && !tiradaHecha ? " carta-cerrar-temp--visible" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    cerrarCartaTemporal();
                  }}
                  aria-label="Cerrar carta"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
          <p className="horoscopos-noria-pasos" role="status">
            1. Elige tu signo <span className="horoscopos-noria-pasos__sep">✦</span> 2. Pulsa la carta
          </p>
          {tiradaHecha ? (
            <button type="button" className="horoscopos-reset-btn" onClick={reiniciarTirada}>
              Volver a consultar
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
