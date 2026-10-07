import { describe, expect, it } from "vitest";
import { ARTICULOS } from "../data/articulos";
import { articuloSlugDesdePathname } from "./analytics";

describe("articuloSlugDesdePathname", () => {
  it("devuelve el slug de un artículo existente", () => {
    for (const a of ARTICULOS) {
      expect(articuloSlugDesdePathname(`/articulos/${a.slug}`)).toBe(a.slug);
    }
  });

  it("tolera barra final y query string", () => {
    const slug = ARTICULOS[0].slug;
    expect(articuloSlugDesdePathname(`/articulos/${slug}/`)).toBe(slug);
    expect(articuloSlugDesdePathname(`/articulos/${slug}?ref=inicio`)).toBe(slug);
  });

  it("rechaza slugs que no existen en el catálogo editorial", () => {
    expect(articuloSlugDesdePathname("/articulos/no-existe")).toBeUndefined();
    expect(articuloSlugDesdePathname("/articulos/__proto__")).toBeUndefined();
    expect(articuloSlugDesdePathname("/articulos/sonar-con-agua/extra")).toBeUndefined();
  });

  it("devuelve undefined fuera de /articulos/:slug", () => {
    expect(articuloSlugDesdePathname("/articulos")).toBeUndefined();
    expect(articuloSlugDesdePathname("/")).toBeUndefined();
    expect(articuloSlugDesdePathname("/suenos")).toBeUndefined();
  });
});
