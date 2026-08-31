import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CHECKOUT_CONFIG } from "../config/checkoutConfig";
import {
  esSignoId,
  guardarLecturaDiaria,
  leerLecturaDiaria,
  type SignoId
} from "@/utils/horoscopoDiario";
import { LECTURA_POR_ARCANO } from "@/data/lecturaPorArcanoMayor";
import { infoArcanoMayorRws, urlImagenArcanoMayorRws } from "@/data/tarotMayoresRws";
import {
  guardarIndiceArcanoTirada,
  indiceArcanoAleatorio,
  leerIndiceArcanoTirada
} from "@/utils/tiradaArcanoStorage";
import "./lectura.css";

const URL_WHATSAPP_TIRADA_CARTAS = `https://wa.me/${CHECKOUT_CONFIG.whatsappNumber}?text=${encodeURIComponent(
  "Hola Maika, quiero mi tirada de cartas. ¿Cómo funciona la consulta y el pago?"
)}`;

/** Título del signo en pantalla (mismas etiquetas que antes). */
const NOMBRE_SIGNO: Record<SignoId, string> = {
  aries: "Aries",
  tauro: "Tauro",
  geminis: "Geminis",
  cancer: "Cancer",
  leo: "Leo",
  virgo: "Virgo",
  libra: "Libra",
  escorpio: "Escorpio",
  sagitario: "Sagitario",
  capricornio: "Capricornio",
  acuario: "Acuario",
  piscis: "Piscis"
};

const SIMBOLO_SIGNO: Record<SignoId, string> = {
  aries: "♈",
  tauro: "♉",
  geminis: "♊",
  cancer: "♋",
  leo: "♌",
  virgo: "♍",
  libra: "♎",
  escorpio: "♏",
  sagitario: "♐",
  capricornio: "♑",
  acuario: "♒",
  piscis: "♓"
};

type LecturaState = {
  signo?: SignoId;
};

function msHastaProximaMedianoche(): number {
  const ahora = new Date();
  const proximaMedianoche = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate() + 1,
    0,
    0,
    0,
    0
  );
  return Math.max(0, proximaMedianoche.getTime() - ahora.getTime());
}

function formatearTiempoRestante(ms: number): string {
  const totalSegundos = Math.max(0, Math.floor(ms / 1000));
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;
  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

function fechaLocalHoy(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function LecturaPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LecturaState | null;
  const [tiempoRestanteMs, setTiempoRestanteMs] = useState<number>(msHastaProximaMedianoche());
  const [arcanoIdx, setArcanoIdx] = useState<number | null>(null);
  const [cartaFrenteFallo, setCartaFrenteFallo] = useState(false);
  const [destinoActivo, setDestinoActivo] = useState(false);
  const [cartaEntradaVisible, setCartaEntradaVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const fechaLecturaRef = useRef<string>(fechaLocalHoy());
  const cartaRef = useRef<HTMLDivElement | null>(null);
  const destinoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cartaEntradaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const signo = useMemo<SignoId | null>(() => {
    const signoDesdeState = state?.signo;
    if (signoDesdeState && esSignoId(signoDesdeState)) {
      const tiradaState = localStorage.getItem(`tirada-${signoDesdeState}`) as SignoId | null;
      if (tiradaState === signoDesdeState) {
        return signoDesdeState;
      }
    }

    const signoGuardado = localStorage.getItem("tirada-signo-seleccionado");
    if (!signoGuardado || !esSignoId(signoGuardado)) {
      return null;
    }
    const tiradaGuardada = localStorage.getItem(`tirada-${signoGuardado}`) as SignoId | null;
    if (tiradaGuardada !== signoGuardado) {
      return null;
    }
    return signoGuardado;
  }, [state?.signo]);

  const sincronizarLecturaDelDia = useCallback(
    (signoActual: SignoId) => {
      let n = leerIndiceArcanoTirada(signoActual);
      if (n == null) {
        n = indiceArcanoAleatorio();
        guardarIndiceArcanoTirada(signoActual, n);
      }
      guardarLecturaDiaria(signoActual, null);
      setArcanoIdx(n);
    },
    []
  );

  useEffect(() => {
    if (!signo) {
      navigate("/horoscopos", { replace: true });
      return;
    }
    fechaLecturaRef.current = fechaLocalHoy();
    sincronizarLecturaDelDia(signo);
  }, [signo, navigate, sincronizarLecturaDelDia]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add("lectura-no-scroll");
    body.classList.add("lectura-no-scroll");
    return () => {
      html.classList.remove("lectura-no-scroll");
      body.classList.remove("lectura-no-scroll");
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!signo) {
      return;
    }
    setTiempoRestanteMs(msHastaProximaMedianoche());
    const intervalId = window.setInterval(() => {
      setTiempoRestanteMs(msHastaProximaMedianoche());
      const hoy = fechaLocalHoy();
      if (hoy !== fechaLecturaRef.current) {
        fechaLecturaRef.current = hoy;
        sincronizarLecturaDelDia(signo);
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [signo, sincronizarLecturaDelDia]);

  useEffect(() => {
    setCartaFrenteFallo(false);
  }, [arcanoIdx, signo]);

  useEffect(() => {
    if (arcanoIdx == null || !signo) return;
    if (cartaEntradaTimeoutRef.current) {
      window.clearTimeout(cartaEntradaTimeoutRef.current);
      cartaEntradaTimeoutRef.current = null;
    }
    setCartaEntradaVisible(false);
    cartaEntradaTimeoutRef.current = window.setTimeout(() => {
      setCartaEntradaVisible(true);
      cartaEntradaTimeoutRef.current = null;
    }, 100);
  }, [arcanoIdx, signo]);

  const lecturaDiariaActual = leerLecturaDiaria();
  const mostrarContadorDiario = Boolean(lecturaDiariaActual);
  const tiempoRestanteTexto = formatearTiempoRestante(tiempoRestanteMs);

  const bloqueArcano =
    signo != null && arcanoIdx != null ? LECTURA_POR_ARCANO[arcanoIdx] : null;
  const arcanoInfo = arcanoIdx != null ? infoArcanoMayorRws(arcanoIdx) : infoArcanoMayorRws(0);
  const tituloSigno = signo ? NOMBRE_SIGNO[signo] : "";

  const shellExtraClass = signo === "piscis" ? " lectura-shell--piscis" : "";

  const cartaFrenteSrc =
    signo && arcanoIdx != null && bloqueArcano && !cartaFrenteFallo
      ? urlImagenArcanoMayorRws(arcanoIdx)
      : "/cartas/publiccartasreverso.jpg";
  const cartaFrenteAlt =
    arcanoIdx != null && bloqueArcano ? `Arcano mayor: ${arcanoInfo.nombreEs}` : "";

  const handleCartaMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    const el = cartaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = -((y - rect.height / 2) / 18);
    const rotateY = (x - rect.width / 2) / 18;
    el.style.setProperty("--carta-rotate-x", `${rotateX.toFixed(2)}deg`);
    el.style.setProperty("--carta-rotate-y", `${rotateY.toFixed(2)}deg`);
    el.style.setProperty("--carta-brillo-x", `${x.toFixed(1)}px`);
    el.style.setProperty("--carta-brillo-y", `${y.toFixed(1)}px`);
    el.style.setProperty("--carta-scale", "1.04");
    el.style.setProperty("--carta-brillo-opacity", "1");
  }, [reduceMotion]);

  const handleCartaLeave = useCallback(() => {
    const el = cartaRef.current;
    if (!el) return;
    el.style.setProperty("--carta-rotate-x", "0deg");
    el.style.setProperty("--carta-rotate-y", "0deg");
    el.style.setProperty("--carta-scale", "1");
    el.style.setProperty("--carta-brillo-opacity", "0");
    el.style.setProperty("--carta-brillo-x", "50%");
    el.style.setProperty("--carta-brillo-y", "50%");
  }, []);

  const handleCartaClick = useCallback(() => {
    if (reduceMotion) return;
    if (destinoTimeoutRef.current) {
      window.clearTimeout(destinoTimeoutRef.current);
      destinoTimeoutRef.current = null;
    }
    setDestinoActivo(true);
    destinoTimeoutRef.current = window.setTimeout(() => {
      setDestinoActivo(false);
      destinoTimeoutRef.current = null;
    }, 350);
  }, [reduceMotion]);

  useEffect(() => {
    return () => {
      if (destinoTimeoutRef.current) {
        window.clearTimeout(destinoTimeoutRef.current);
      }
      if (cartaEntradaTimeoutRef.current) {
        window.clearTimeout(cartaEntradaTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`inicio-page horoscopos-page lectura-page lectura-shell${shellExtraClass}`}>
      {signo && arcanoIdx !== null && bloqueArcano ? (
        <>
          <div className="lectura-contenido lectura-container lectura-malla">
            <div className="lectura-malla__top lectura-main lectura-malla-principal">
              <aside className="lectura-carta-columna columna-carta lectura-malla__carta">
                <div className={`carta-entrada${cartaEntradaVisible ? " is-visible" : ""}`}>
                  <div
                    ref={cartaRef}
                    className={`carta carta--interactiva${destinoActivo ? " destino-activo" : ""}`}
                    aria-label={`Carta revelada para ${tituloSigno}`}
                    onMouseMove={handleCartaMove}
                    onMouseLeave={handleCartaLeave}
                    onClick={handleCartaClick}
                  >
                    <div className="carta-particulas" aria-hidden="true">
                      <div className="particula" />
                      <div className="particula" />
                      <div className="particula" />
                      <div className="particula" />
                      <div className="particula" />
                      <div className="particula" />
                      <div className="particula" />
                      <div className="particula" />
                      <div className="particula" />
                      <div className="particula" />
                      <div className="particula" />
                      <div className="particula" />
                      <div className="particula" />
                      <div className="particula" />
                      <div className="particula" />
                      <div className="particula" />
                      <div className="particula" />
                      <div className="particula" />
                      <div className="particula" />
                      <div className="particula" />
                    </div>
                    <div className="carta-aura" />
                    <img
                      src={cartaFrenteSrc}
                      alt={cartaFrenteAlt}
                      decoding="async"
                      loading="eager"
                      referrerPolicy="no-referrer-when-downgrade"
                      onError={() => setCartaFrenteFallo(true)}
                    />
                    <div className="carta-brillo" />
                    <div className="carta-destello" />
                    <div className="carta-destino" />
                  </div>
                </div>
              </aside>

              <div className="lectura-malla__columna-lectura">
                <div className="lectura-malla__sup columna-texto texto">
                  <h1 className="lectura-signo signo-titulo">
                    {SIMBOLO_SIGNO[signo]} {tituloSigno.toUpperCase()}
                  </h1>

                  <div className="bloque-semana lectura-base">
                    <h3 className="titulo-seccion">
                      <span className="titulo-seccion__icono" aria-hidden>
                        ✨{" "}
                      </span>
                      Lectura del día
                    </h3>
                    {bloqueArcano.semana
                      .trim()
                      .split(/\n\n+/)
                      .map((graf) => graf.trim())
                      .filter(Boolean)
                      .map((graf, i) => (
                        <p key={i} className="lectura-base__parrafo texto-normal">
                          {graf}
                        </p>
                      ))}
                  </div>
                </div>

                <div className="lectura-separador-oro" aria-hidden="true">
                  <span className="lectura-separador-oro__linea" />
                  <span className="lectura-separador-oro__estrella">✦</span>
                  <span className="lectura-separador-oro__linea" />
                </div>

                <div className="lectura-malla__inf columna-texto texto lectura-texto">
                  <div className="bloque-carta">
                    <span className="etiqueta-carta">Carta que te acompaña</span>
                    <h3 className="lectura-nombre-arcano">{arcanoInfo.nombreEs}</h3>
                    {bloqueArcano.pincelada
                      .trim()
                      .split(/\n\n+/)
                      .map((graf) => graf.trim())
                      .filter(Boolean)
                      .map((graf, i) => (
                        <p key={i}>{graf}</p>
                      ))}
                  </div>

                  <p className="frase-final lectura-base__parrafo lectura-frase-cierre">{bloqueArcano.fraseFinal}</p>
                </div>

              </div>
            </div>

            <div className="lectura-malla__bottom">
              <div className="lectura-linea-malla-cta lectura-linea-malla-cta--superior" aria-hidden />
              <div className="lectura-bloque-inferior lectura-bloque-inferior--cabecera">
                {mostrarContadorDiario ? (
                  <div className="lectura-contador" role="status" aria-live="polite">
                    <p className="lectura-contador__aviso">Tu lectura de hoy ya está revelada</p>
                    <p className="lectura-contador__cuenta">
                      <span className="lectura-contador__estrella" aria-hidden>
                        ✦
                      </span>
                      <span className="lectura-contador__mensaje">
                        Nueva lectura en: {tiempoRestanteTexto}
                      </span>
                      <span className="lectura-contador__estrella" aria-hidden>
                        ✦
                      </span>
                    </p>
                  </div>
                ) : null}

                <p className="lectura-cta-texto">¿Quieres ver qué hay detrás de esto?</p>
              </div>

              <div className="lectura-linea-malla-cta" aria-hidden />

              <div className="lectura-bloque-inferior lectura-bloque-inferior--cta">
                <div className="lectura-cta">
                  <a className="btn-consulta" href={URL_WHATSAPP_TIRADA_CARTAS} target="_blank" rel="noopener noreferrer">
                    <span className="btn-consulta__contenido">
                      <svg className="btn-consulta__icono-wa" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path
                          fill="currentColor"
                          d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
                        />
                      </svg>
                      <span className="btn-consulta__etiqueta">Quiero mi tirada de cartas</span>
                    </span>
                  </a>
                  <p className="lectura-cta-servicio">Consulta por WhatsApp · Pago previo · Videollamada privada</p>
                  <button type="button" className="btn-inicio-secundario" onClick={() => navigate("/")}>
                    Inicio
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : signo && arcanoIdx === null ? (
        <div className="lectura-contenido lectura-container lectura-contenido--empty">
          <p className="lectura-page__texto">Preparando tu lectura…</p>
        </div>
      ) : (
        <div className="lectura-contenido lectura-container lectura-contenido--empty">
          <p className="lectura-page__texto">No hay una tirada guardada para mostrar ahora mismo.</p>
        </div>
      )}
    </div>
  );
}
