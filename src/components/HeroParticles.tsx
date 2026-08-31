import { useEffect, useId, useLayoutEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";

const options: ISourceOptions = {
  fullScreen: false,
  background: { color: { value: "transparent" } },
  fpsLimit: 60,
  interactivity: { detect_on: "canvas", events: { onHover: { enable: false }, onClick: { enable: false } } },
  particles: {
    number: {
      value: 43,
      density: { enable: true, width: 1920, height: 1080 },
    },
    color: { value: "#f2de8a" },
    opacity: { value: { min: 0.4, max: 0.6 } },
    size: { value: { min: 0.8, max: 2.4 } },
    move: {
      enable: true,
      speed: 0.22,
      direction: "top",
      random: true,
      straight: false,
      outModes: { default: "out" },
    },
    shape: { type: "circle" },
  },
  detectRetina: true,
};

function particulasPermitidas(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (window.matchMedia("(max-width: 768px)").matches) return false;
  return true;
}

export default function HeroParticles() {
  const id = useId();
  const [permitir, setPermitir] = useState(false);
  const [init, setInit] = useState(false);

  useLayoutEffect(() => {
    setPermitir(particulasPermitidas());
    const mqNarrow = window.matchMedia("(max-width: 768px)");
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPermitir(particulasPermitidas());
    mqNarrow.addEventListener("change", sync);
    mqReduce.addEventListener("change", sync);
    return () => {
      mqNarrow.removeEventListener("change", sync);
      mqReduce.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!permitir) {
      setInit(false);
      return;
    }
    let cancelado = false;
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      if (!cancelado) setInit(true);
    });
    return () => {
      cancelado = true;
    };
  }, [permitir]);

  if (!permitir || !init) return null;

  return (
    <div
      className="hero-particles"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        /* Detrás del JPG: las partículas no deben velar el arte del banner */
        zIndex: 0,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      <Particles
        id={`hero-particles-${id.replace(/:/g, "")}`}
        options={options}
        style={{ position: "absolute", width: "100%", height: "100%" }}
      />
    </div>
  );
}
