import { useMemo } from "react";
import "../../FondoEstrellado.css";
import { FONDO_ESTRELLAS_COLOR_DEFAULT } from "../../utils/fondoPantallaConfig";

function hexEstrellaARgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return { r: 201, g: 162, b: 74 };
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return { r: 201, g: 162, b: 74 };
  return { r, g, b };
}

interface Estrella {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  opacity: number;
  glow: number;
}

function posicionConBordes(rnd: (i: number) => number, i: number): { left: number; top: number } {
  const t = rnd(i);
  if (t < 0.4) return { left: rnd(i + 1) * 22, top: rnd(i + 2) * 100 };
  if (t < 0.8) return { left: 78 + rnd(i + 3) * 22, top: rnd(i + 4) * 100 };
  return { left: rnd(i + 5) * 100, top: rnd(i + 6) * 100 };
}

function posicionZonaBaja(rnd: (i: number) => number, i: number): { left: number; top: number } {
  return { left: rnd(i) * 100, top: 60 + rnd(i + 1) * 40 };
}

/** Misma semilla y reglas que `FondoEstrellado`, con menos nodos para el panel admin. */
function generarVistaPrevia(densidadPct: number): Estrella[] {
  const e: Estrella[] = [];
  const seed = 12345;
  const rnd = (i: number) => {
    const x = Math.sin(seed * i) * 10000;
    return x - Math.floor(x);
  };
  const frac = densidadPct / 100;
  const factorMini = 0.065;
  const nCielo = Math.round(1100 * frac * factorMini);
  const nZonaBaja = Math.round(350 * frac * factorMini);
  let id = 0;
  for (let i = 0; i < nCielo; i++) {
    const { left, top } = posicionConBordes(rnd, i);
    const size = rnd(i + 10) < 0.6 ? 0.75 + rnd(i + 11) * 1.1 : 1.4 + rnd(i + 12) * 2.8;
    e.push({
      id: id++,
      left,
      top,
      size,
      delay: rnd(i + 13) * 4,
      opacity: 0.45 + rnd(i + 14) * 0.38,
      glow: size > 2.6 ? 1 : 0
    });
  }
  for (let i = 0; i < nZonaBaja; i++) {
    const { left, top } = posicionZonaBaja(rnd, 5000 + i);
    const size = rnd(5000 + i + 1) < 0.6 ? 0.75 + rnd(5000 + i + 2) * 1.1 : 1.3 + rnd(5000 + i + 3) * 2.4;
    e.push({
      id: id++,
      left,
      top,
      size,
      delay: rnd(5000 + i + 4) * 4,
      opacity: 0.42 + rnd(5000 + i + 5) * 0.38,
      glow: size > 2.4 ? 1 : 0
    });
  }
  return e;
}

type Props = { densidad: number; color?: string };

export default function FondoEstrellasDensidadPreview({
  densidad,
  color = FONDO_ESTRELLAS_COLOR_DEFAULT
}: Props) {
  const estrellas = useMemo(() => generarVistaPrevia(densidad), [densidad]);
  const { r, g, b } = hexEstrellaARgb(color);

  return (
    <div
      aria-hidden
      style={{
        position: "relative",
        width: "100%",
        height: 88,
        borderRadius: 8,
        overflow: "hidden",
        border: "1px dashed rgba(201,162,74,0.45)",
        background: "#0b0b0d",
        boxSizing: "border-box"
      }}
    >
      <div className="fondo-estrellado-aurora__principal" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {estrellas.map((star) => (
          <div
            key={star.id}
            className="estrella-dorada"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              background: color,
              opacity: star.opacity,
              animation: "none",
              boxShadow: star.glow
                ? `0 0 ${star.size * 1.4}px rgba(${r},${g},${b},0.55), 0 0 ${star.size * 2.5}px rgba(${r},${g},${b},0.2)`
                : `0 0 5px rgba(${r},${g},${b},0.35)`
            }}
          />
        ))}
      </div>
    </div>
  );
}
