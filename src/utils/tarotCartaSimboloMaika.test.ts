import { describe, expect, it } from "vitest";
import { simboloMaikaParaCartaTarot } from "./tarotCartaSimboloMaika";

describe("simboloMaikaParaCartaTarot", () => {
  it("ejemplos del deck MAIKA", () => {
    expect(simboloMaikaParaCartaTarot("La Estrella")).toBe("✨");
    expect(simboloMaikaParaCartaTarot("La Luna")).toBe("🌙");
    expect(simboloMaikaParaCartaTarot("El Sol")).toBe("☀️");
    expect(simboloMaikaParaCartaTarot("La Muerte")).toBe("🔥");
    expect(simboloMaikaParaCartaTarot("El Diablo")).toBe("🔺");
    expect(simboloMaikaParaCartaTarot("El Mago")).toBe("✋");
    expect(simboloMaikaParaCartaTarot("La Emperatriz")).toBe("🌿");
    expect(simboloMaikaParaCartaTarot("El Mundo")).toBe("🌌");
  });

  it("desconocido → ✨", () => {
    expect(simboloMaikaParaCartaTarot("Carta inventada XYZ")).toBe("✨");
  });
});
