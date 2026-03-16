import { useEffect, useState } from "react";
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
      value: 40,
      density: { enable: true, width: 1920, height: 1080 },
    },
    color: { value: "#d4af37" },
    opacity: { value: { min: 0.35, max: 0.58 } },
    size: { value: { min: 0.8, max: 2.2 } },
    move: {
      enable: true,
      speed: 0.25,
      direction: "top",
      random: true,
      straight: false,
      outModes: { default: "out" },
    },
    shape: { type: "circle" },
  },
  detectRetina: true,
};

export default function HeroParticles() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setInit(true));
  }, []);

  if (!init) return null;

  return (
    <div
      className="hero-particles"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 2,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      <Particles id="hero-particles" options={options} style={{ position: "absolute", width: "100%", height: "100%" }} />
    </div>
  );
}
