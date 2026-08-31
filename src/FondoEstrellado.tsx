import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useLocation } from "react-router-dom";
import "./FondoEstrellado.css";
import {
  FONDO_APP_GRADIENTE_MAIKA_LILA,
  FONDO_PANTALLA_UPDATED_EVENT,
  leerFondoAppCapaPreset,
  leerFondoEstrellasColor,
  leerFondoEstrellasDensidad,
  leerFondoEstrellasMovimiento,
  leerFondoPantallaConfig,
  leerFondoPantallaOscuridad,
  leerFondoPantallaTono,
  type FondoAppCapaPresetId
} from "./utils/fondoPantallaConfig";

interface Estrella {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  opacity: number;
  glow: number;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return `rgba(11,11,13,${alpha})`;
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return `rgba(11,11,13,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

function hexEstrellaARgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return { r: 201, g: 162, b: 74 };
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return { r: 201, g: 162, b: 74 };
  return { r, g, b };
}

/** Reparto homogéneo: cubre todo el cielo (incluido centro). */
function posicionConBordes(rnd: (i: number) => number, i: number): { left: number; top: number } {
  return { left: rnd(i + 1) * 100, top: rnd(i + 2) * 100 };
}

/** Estrellas en la zona baja (debajo / bajo testimonios) */
function posicionZonaBaja(rnd: (i: number) => number, i: number): { left: number; top: number } {
  return { left: rnd(i) * 100, top: 60 + rnd(i + 1) * 40 };
}

/** Refuerzo solo visible en móvil (CSS): arriba-izquierda y franja superior central (cabecera / logo). */
function generarRefuerzoMovilMaika(rnd: (i: number) => number, frac: number): Estrella[] {
  const e: Estrella[] = [];
  let id = 300_000;
  const base = 70_000;
  const nMedia = Math.round(64 * frac);
  for (let i = 0; i < nMedia; i++) {
    const size = 0.9 + rnd(base + i) * 1.4;
    e.push({
      id: id++,
      left: rnd(base + i + 1) * 30,
      top: rnd(base + i + 2) * 24,
      size,
      delay: rnd(base + i + 3) * 4,
      opacity: 0.42 + rnd(base + i + 4) * 0.38,
      glow: size > 2.2 ? 1 : 0
    });
  }
  for (let i = 0; i < nMedia; i++) {
    const size = 0.85 + rnd(base + 500 + i) * 1.35;
    e.push({
      id: id++,
      left: 18 + rnd(base + 500 + i + 1) * 64,
      top: rnd(base + 500 + i + 2) * 16,
      size,
      delay: rnd(base + 500 + i + 3) * 4,
      opacity: 0.4 + rnd(base + 500 + i + 4) * 0.36,
      glow: size > 2.1 ? 1 : 0
    });
  }
  return e;
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function mapaEstrella(e: Estrella, colorHex: string, movimientoPct: number, ciclo: number) {
  const { r, g, b } = hexEstrellaARgb(colorHex);
  const sombraSuave = `0 0 6px rgba(${r},${g},${b},0.42)`;
  const sombraBrillo = `0 0 ${e.size * 1.5}px rgba(${r},${g},${b},0.6), 0 0 ${e.size * 3}px rgba(${r},${g},${b},0.25)`;
  const estrellaEnMovimiento = e.id % 50 === 0;
  const factor = Math.max(0, movimientoPct) / 100;
  const semilla = e.id * 97 + ciclo * 131;
  const leftRender = estrellaEnMovimiento ? pseudoRandom(semilla + 1) * 100 : e.left;
  const topRender = estrellaEnMovimiento ? pseudoRandom(semilla + 2) * 100 : e.top;
  const distanciaVw = factor > 0 && estrellaEnMovimiento ? Math.min(170, Math.max(14, factor * 55)) : 0;
  const distanciaVh = factor > 0 && estrellaEnMovimiento ? Math.min(120, Math.max(8, factor * 32)) : 0;
  const angulo = (pseudoRandom(semilla + 3) * 70 - 35) * (Math.PI / 180);
  const dx = Math.cos(angulo) * distanciaVw;
  const dy = Math.sin(angulo) * distanciaVh;
  const rotDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const duracion = factor > 0 && estrellaEnMovimiento ? Math.max(2.8, 18 / Math.max(0.12, factor)) : 0;
  return (
    <div
      key={estrellaEnMovimiento ? `${e.id}-${ciclo}` : e.id}
      className="estrella-dorada"
      style={{
        left: `${leftRender}%`,
        top: `${topRender}%`,
        width: `${e.size}px`,
        height: `${e.size}px`,
        background: colorHex,
        opacity: e.opacity,
        animationDelay: factor > 0 && estrellaEnMovimiento ? `${e.delay}s, 0s` : undefined,
        animationDuration: factor > 0 && estrellaEnMovimiento ? `5s, ${duracion}s` : undefined,
        animationName: factor > 0 && estrellaEnMovimiento ? "parpadear-estrella, mover-estrella" : "none",
        animationTimingFunction: factor > 0 && estrellaEnMovimiento ? "ease-in-out, linear" : undefined,
        animationIterationCount: factor > 0 && estrellaEnMovimiento ? "infinite, infinite" : undefined,
        ["--estrella-dx" as string]: `${dx.toFixed(2)}vw`,
        ["--estrella-dy" as string]: `${dy.toFixed(2)}vh`,
        ["--estrella-rot" as string]: `${rotDeg.toFixed(2)}deg`,
        boxShadow: e.glow ? sombraBrillo : sombraSuave
      }}
    />
  );
}

export default function FondoEstrellado() {
  const { pathname } = useLocation();
  const [fondoPersonalizadoUrl, setFondoPersonalizadoUrl] = useState("");
  const [fondoOscuridad, setFondoOscuridad] = useState(45);
  const [fondoTono, setFondoTono] = useState("#0b0b0d");
  const [fondoAppCapaPreset, setFondoAppCapaPreset] = useState<FondoAppCapaPresetId>(() =>
    typeof window !== "undefined" ? leerFondoAppCapaPreset() : ""
  );
  const [estrellasDensidad, setEstrellasDensidad] = useState(100);
  const [estrellasColor, setEstrellasColor] = useState(() => leerFondoEstrellasColor());
  const [estrellasMovimiento, setEstrellasMovimiento] = useState(() => leerFondoEstrellasMovimiento());
  const [cicloMovimiento, setCicloMovimiento] = useState(0);
  /** En panel admin el cielo va fijo a densidad base; el valor guardado se ve en inicio/tienda/resto de la web. */
  const densidadCielo = pathname.startsWith("/admin") ? 100 : estrellasDensidad;
  const { estrellas, refuerzoMovilMaika } = useMemo(() => {
    const e: Estrella[] = [];
    const seed = 12345;
    const rnd = (i: number) => {
      const x = Math.sin(seed * i) * 10000;
      return x - Math.floor(x);
    };
    const frac = densidadCielo / 100;
    const nCielo = Math.round(1100 * frac);
    const nZonaBaja = Math.round(350 * frac);
    let id = 0;
    for (let i = 0; i < nCielo; i++) {
      const { left, top } = posicionConBordes(rnd, i);
      const size = rnd(i + 10) < 0.6 ? 1 + rnd(i + 11) * 1.5 : 2 + rnd(i + 12) * 4;
      e.push({
        id: id++,
        left,
        top,
        size,
        delay: rnd(i + 13) * 4,
        opacity: 0.5 + rnd(i + 14) * 0.35,
        glow: size > 3 ? 1 : 0
      });
    }
    for (let i = 0; i < nZonaBaja; i++) {
      const { left, top } = posicionZonaBaja(rnd, 5000 + i);
      const size = rnd(5000 + i + 1) < 0.6 ? 1 + rnd(5000 + i + 2) * 1.5 : 2 + rnd(5000 + i + 3) * 3;
      e.push({
        id: id++,
        left,
        top,
        size,
        delay: rnd(5000 + i + 4) * 4,
        opacity: 0.45 + rnd(5000 + i + 5) * 0.4,
        glow: size > 3 ? 1 : 0
      });
    }

    return { estrellas: e, refuerzoMovilMaika: generarRefuerzoMovilMaika(rnd, frac) };
  }, [densidadCielo]);

  useEffect(() => {
    setFondoPersonalizadoUrl(leerFondoPantallaConfig());
    setFondoOscuridad(leerFondoPantallaOscuridad());
    setFondoTono(leerFondoPantallaTono());
    setEstrellasDensidad(leerFondoEstrellasDensidad());
    setEstrellasColor(leerFondoEstrellasColor());
    setEstrellasMovimiento(leerFondoEstrellasMovimiento());
    const onFondoActualizado = () => {
      setFondoPersonalizadoUrl(leerFondoPantallaConfig());
      setFondoOscuridad(leerFondoPantallaOscuridad());
      setFondoTono(leerFondoPantallaTono());
      setFondoAppCapaPreset(leerFondoAppCapaPreset());
      setEstrellasDensidad(leerFondoEstrellasDensidad());
      setEstrellasColor(leerFondoEstrellasColor());
      setEstrellasMovimiento(leerFondoEstrellasMovimiento());
    };
    window.addEventListener(FONDO_PANTALLA_UPDATED_EVENT, onFondoActualizado as EventListener);
    return () => {
      window.removeEventListener(FONDO_PANTALLA_UPDATED_EVENT, onFondoActualizado as EventListener);
    };
  }, []);

  useEffect(() => {
    const factor = Math.max(0, estrellasMovimiento) / 100;
    if (factor <= 0) return;
    const intervaloMs = Math.round(Math.max(4500, 24000 / Math.max(0.15, factor)));
    const t = window.setInterval(() => {
      setCicloMovimiento((v) => v + 1);
    }, intervaloMs);
    return () => window.clearInterval(t);
  }, [estrellasMovimiento]);

  const opacidadArriba = Math.max(0, Math.min(0.9, fondoOscuridad / 100));
  const opacidadAbajo = Math.max(0, Math.min(0.95, (fondoOscuridad + 12) / 100));
  const esConfigVisualPorDefecto = !fondoPersonalizadoUrl && fondoTono.toLowerCase() === "#0b0b0d" && fondoOscuridad === 45;
  const factorMovimiento = Math.max(0, estrellasMovimiento);

  const capaAuroraStyle = useMemo((): CSSProperties | undefined => {
    if (fondoAppCapaPreset === "maika-lila") {
      const overlays: string[] = [];
      if (fondoPersonalizadoUrl) {
        overlays.push(
          `linear-gradient(${hexToRgba(fondoTono, opacidadArriba)}, ${hexToRgba(fondoTono, opacidadAbajo)}), url(${fondoPersonalizadoUrl})`
        );
      } else if (!esConfigVisualPorDefecto) {
        overlays.push(
          `linear-gradient(${hexToRgba(fondoTono, opacidadArriba)}, ${hexToRgba(fondoTono, opacidadAbajo)})`
        );
      }
      const top = overlays[0];
      const background = top ? `${top}, ${FONDO_APP_GRADIENTE_MAIKA_LILA}` : FONDO_APP_GRADIENTE_MAIKA_LILA;
      return {
        background,
        ...(fondoPersonalizadoUrl
          ? { backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }
          : {})
      };
    }
    if (esConfigVisualPorDefecto) return undefined;
    return {
      backgroundImage: fondoPersonalizadoUrl
        ? `linear-gradient(${hexToRgba(fondoTono, opacidadArriba)}, ${hexToRgba(fondoTono, opacidadAbajo)}), url(${fondoPersonalizadoUrl})`
        : `linear-gradient(${hexToRgba(fondoTono, opacidadArriba)}, ${hexToRgba(fondoTono, opacidadAbajo)})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat"
    };
  }, [
    fondoAppCapaPreset,
    fondoPersonalizadoUrl,
    fondoTono,
    fondoOscuridad,
    esConfigVisualPorDefecto,
    opacidadArriba,
    opacidadAbajo
  ]);

  return (
    <div
      className="fondo-estrellado-aurora"
      style={capaAuroraStyle}
    >
      {/*
        Líneas de constelación (SVG + preserveAspectRatio="none") generaban una raya fija en los bordes
        al estirar trazos cerca de x=0 / x=100. Solo estrellas, sin segmentos.
      */}
      <div className="fondo-estrellado-aurora__principal">
        {estrellas.map((star) => mapaEstrella(star, estrellasColor, factorMovimiento, cicloMovimiento))}
      </div>
      <div className="fondo-estrellado-aurora__movil-maika" aria-hidden="true">
        {refuerzoMovilMaika.map((star) => mapaEstrella(star, estrellasColor, factorMovimiento, cicloMovimiento))}
      </div>
    </div>
  );
}
