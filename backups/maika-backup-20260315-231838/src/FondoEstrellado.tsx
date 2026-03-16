import { useEffect, useState, useMemo } from 'react';
import './FondoEstrellado.css';

interface Estrella {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  opacity: number;
  glow: number;
}

/** Más estrellas en laterales (0–22% y 78–100%) */
function posicionConBordes(rnd: (i: number) => number, i: number): { left: number; top: number } {
  const t = rnd(i);
  if (t < 0.4) return { left: rnd(i + 1) * 22, top: rnd(i + 2) * 100 };
  if (t < 0.8) return { left: 78 + rnd(i + 3) * 22, top: rnd(i + 4) * 100 };
  return { left: rnd(i + 5) * 100, top: rnd(i + 6) * 100 };
}

/** Estrellas en la zona baja (debajo / bajo testimonios) */
function posicionZonaBaja(rnd: (i: number) => number, i: number): { left: number; top: number } {
  return { left: rnd(i) * 100, top: 60 + rnd(i + 1) * 40 };
}

export default function FondoEstrellado() {
  const [estrellas, setEstrellas] = useState<Estrella[]>([]);
  const [constelaciones, setConstelaciones] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);

  const estrellasYLineas = useMemo(() => {
    const e: Estrella[] = [];
    const seed = 12345;
    const rnd = (i: number) => {
      const x = Math.sin(seed * i) * 10000;
      return x - Math.floor(x);
    };
    let id = 0;
    for (let i = 0; i < 1100; i++) {
      const { left, top } = posicionConBordes(rnd, i);
      const size = rnd(i + 10) < 0.6 ? 1 + rnd(i + 11) * 1.5 : 2 + rnd(i + 12) * 4;
      e.push({
        id: id++,
        left,
        top,
        size,
        delay: rnd(i + 13) * 4,
        opacity: 0.5 + rnd(i + 14) * 0.35,
        glow: size > 3 ? 1 : 0,
      });
    }
    for (let i = 0; i < 350; i++) {
      const { left, top } = posicionZonaBaja(rnd, 5000 + i);
      const size = rnd(5000 + i + 1) < 0.6 ? 1 + rnd(5000 + i + 2) * 1.5 : 2 + rnd(5000 + i + 3) * 3;
      e.push({
        id: id++,
        left,
        top,
        size,
        delay: rnd(5000 + i + 4) * 4,
        opacity: 0.45 + rnd(5000 + i + 5) * 0.4,
        glow: size > 3 ? 1 : 0,
      });
    }
    return e;
  }, []);

  useEffect(() => {
    setEstrellas(estrellasYLineas);
    const grandes = estrellasYLineas
      .filter((s) => s.size >= 3)
      .sort(() => Math.random() - 0.5)
      .slice(0, 14);
    const lineas: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < grandes.length - 1; i += 2) {
      const a = grandes[i];
      const b = grandes[i + 1];
      if (a && b && Math.hypot(a.left - b.left, a.top - b.top) < 35) {
        lineas.push({ x1: a.left, y1: a.top, x2: b.left, y2: b.top });
      }
    }
    setConstelaciones(lineas);
  }, [estrellasYLineas]);

  return (
    <div className="fondo-estrellado-aurora">
      <svg className="fondo-estrellado-constelaciones" aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none">
        {constelaciones.map((l, i) => (
          <line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="rgba(201, 162, 74, 0.5)"
            strokeWidth="0.15"
          />
        ))}
      </svg>
      {estrellas.map((e) => (
        <div
          key={e.id}
          className="estrella-dorada"
          style={{
            left: `${e.left}%`,
            top: `${e.top}%`,
            width: `${e.size}px`,
            height: `${e.size}px`,
            opacity: e.opacity,
            animationDelay: `${e.delay}s`,
            boxShadow: e.glow
              ? `0 0 ${e.size * 1.5}px rgba(201, 162, 74, 0.6), 0 0 ${e.size * 3}px rgba(201, 162, 74, 0.25)`
              : 'none',
          }}
        />
      ))}
    </div>
  );
}
