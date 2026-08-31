import { describe, expect, it } from "vitest";
import { normalizarNombreCartaTarotASlug, urlImagenTarotCarta } from "./tarotCartaImagen";

describe("normalizarNombreCartaTarotASlug", () => {
  it("minúsculas, espacios a guiones, sin acentos", () => {
    expect(normalizarNombreCartaTarotASlug("La Muerte")).toBe("la-muerte");
    expect(normalizarNombreCartaTarotASlug("El Carro")).toBe("el-carro");
    expect(normalizarNombreCartaTarotASlug("La Emperatriz")).toBe("la-emperatriz");
  });

  it("normaliza ñ y mayúsculas", () => {
    expect(normalizarNombreCartaTarotASlug("El Ermitaño")).toBe("el-ermitano");
    expect(normalizarNombreCartaTarotASlug("  el  loco  ")).toBe("el-loco");
  });

  it("elimina puntuación extra", () => {
    expect(normalizarNombreCartaTarotASlug("La Rueda de la Fortuna")).toBe("la-rueda-de-la-fortuna");
  });
});

describe("urlImagenTarotCarta", () => {
  it("usa CDN npm + mapa de arcanos mayores (slug → major/Nm.jpg)", () => {
    expect(urlImagenTarotCarta("La Justicia")).toBe(
      "https://cdn.jsdelivr.net/npm/tarot-card-img@0.1.0/major/11m.jpg"
    );
    expect(urlImagenTarotCarta("El Ermitaño")).toBe(
      "https://cdn.jsdelivr.net/npm/tarot-card-img@0.1.0/major/9m.jpg"
    );
  });
});
