import { describe, expect, it } from "vitest";
import { ARTICULOS } from "../../data/articulos";
import {
  NOMBRE_ARTICULO,
  formatoDuracion,
  tarjetasResumen
} from "./analiticaEtiquetas";

describe("analiticaEtiquetas", () => {
  it("cada slug editorial tiene su título legible en el panel", () => {
    for (const a of ARTICULOS) {
      expect(NOMBRE_ARTICULO[a.slug]).toBe(a.titulo);
    }
    /* Ningún slug desconocido recibe nombre propio: se mostraría el slug crudo. */
    expect(NOMBRE_ARTICULO["no-existe"]).toBeUndefined();
  });

  it("la tarjeta de vistas se llama «Páginas vistas», no «Vistas»", () => {
    const tarjetas = tarjetasResumen({
      sesiones: 2,
      primeraVez: 1,
      recurrentes: 1,
      vistas: 23,
      duracionTotalMs: 125000,
      duraciones: 4
    });
    const labels = tarjetas.map((t) => t.label);
    expect(labels).toContain("Páginas vistas");
    expect(labels).not.toContain("Vistas");
    expect(tarjetas.find((t) => t.label === "Páginas vistas")?.valor).toBe(23);
    expect(tarjetas.find((t) => t.label === "Duración media")?.valor).toBe("31 s");
  });

  it("formatoDuracion", () => {
    expect(formatoDuracion(45000)).toBe("45 s");
    expect(formatoDuracion(125000)).toBe("2 min 5 s");
    expect(formatoDuracion(0)).toBe("0 s");
  });
});
