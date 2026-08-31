import { describe, expect, it } from "vitest";
import type { DireccionUsuario } from "../types";
import { prepareDireccionesParaGuardar } from "./prepareDireccionesParaGuardar";

const mk = (over: Partial<DireccionUsuario>): DireccionUsuario => ({
  id: over.id || crypto.randomUUID(),
  alias: over.alias || "",
  calle: over.calle || "Calle Mayor",
  numero: over.numero || "10",
  bloque: over.bloque || "",
  escalera: over.escalera || "",
  piso: over.piso || "",
  puerta: over.puerta || "",
  cp: over.cp || "28001",
  poblacion: over.poblacion || "Madrid",
  provincia: over.provincia || "Madrid",
  pais: over.pais || "ES"
});

describe("prepareDireccionesParaGuardar", () => {
  it("merge: conserva entrantes + actuales con las nuevas primero", () => {
    const existente = mk({ calle: "A", numero: "1" });
    const entrante = mk({ calle: "B", numero: "2" });

    const { direcciones } = prepareDireccionesParaGuardar([entrante], [existente]);

    expect(direcciones).toHaveLength(2);
    expect(direcciones[0].calle).toBe("B");
  });

  it("duplicado: misma direccion fisica no se duplica", () => {
    const existente = mk({ calle: "Calle   Mayor", numero: "10", poblacion: "Málaga" });
    const entrante = mk({ calle: "calle mayor", numero: "10", poblacion: "Malaga" });

    const { direcciones } = prepareDireccionesParaGuardar([entrante], [existente]);

    expect(direcciones).toHaveLength(1);
  });

  it("predeterminada invalida: cae a la primera direccion valida", () => {
    const a = mk({ id: "a" });
    const b = mk({ id: "b", calle: "Otra calle", numero: "2" });

    const { direccionPredeterminadaId, direcciones } = prepareDireccionesParaGuardar([a, b], [], "no-existe");

    expect(direcciones.length).toBeGreaterThan(0);
    expect(direccionPredeterminadaId).toBe(direcciones[0].id);
  });
});
