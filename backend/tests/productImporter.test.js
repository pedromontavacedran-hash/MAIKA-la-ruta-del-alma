import { describe, expect, it } from "vitest";
import {
  extractProductData,
  findDuplicateProduct,
  importProductData,
  mergeProductEnrichments
} from "../lib/productImporter.js";

const URL_FUENTE = "https://proveedor.example.com/producto/123";

const HTML_JSONLD = `<!doctype html><html><head>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Product",
 "name":"Incienso Alaukik Litchi",
 "brand":{"@type":"Brand","name":"ALAUKIK"},
 "gtin13":"8906058544805",
 "sku":"ALAUKIKLitchi",
 "weight":{"@type":"QuantitativeValue","value":90,"unitText":"g"},
 "description":"Incienso de litchi en varillas",
 "image":"https://proveedor.example.com/img.jpg",
 "countryOfOrigin":{"@type":"Country","name":"India"}}
</script>
</head><body>
<dl><dt>Aroma</dt><dd>Litchi</dd><dt>Origen</dt><dd>India</dd></dl>
</body></html>`;

describe("extractProductData", () => {
  it("extrae campos objetivos desde JSON-LD con fuente y confianza", () => {
    const fields = extractProductData(HTML_JSONLD, URL_FUENTE, "supplier");
    expect(fields.nombre.status).toBe("found");
    expect(fields.nombre.value).toBe("Incienso Alaukik Litchi");
    expect(fields.nombre.source).toBe(URL_FUENTE);
    expect(fields.nombre.sourceType).toBe("supplier");
    expect(fields.nombre.confidence).toBe("high");
    expect(fields.marca.value).toBe("ALAUKIK");
    expect(fields.ean.value).toBe("8906058544805");
    expect(fields.sku.value).toBe("ALAUKIKLitchi");
    expect(fields.peso.value).toContain("90");
    expect(fields.origen.value).toBe("India");
    expect(fields.aroma.value).toBe("Litchi");
  });

  it("marca descripción como contenido comercial, no objetivo", () => {
    const fields = extractProductData(HTML_JSONLD, URL_FUENTE, "supplier");
    expect(fields.descripcionProveedor.status).toBe("found");
    expect(fields.descripcionProveedor.contentType).toBe("commercial");
    expect(fields.marca.contentType).toBe("objective");
  });

  it("deja not_found los campos ausentes en la fuente", () => {
    const fields = extractProductData(HTML_JSONLD, URL_FUENTE, "supplier");
    expect(fields.ingredientes.status).toBe("not_found");
    expect(fields.ingredientes.value).toBeNull();
    expect(fields.codigoHsTaric.status).toBe("not_found");
  });

  it("rechaza un EAN con dígito de control inválido", () => {
    const html = `<html><head><script type="application/ld+json">
      {"@type":"Product","name":"X","gtin13":"8906058544800"}
      </script></head><body></body></html>`;
    const fields = extractProductData(html, "https://proveedor.example.com/p/999", "supplier");
    expect(fields.ean.status).toBe("not_found");
  });

  it("registra conflicto cuando la misma página aporta valores incompatibles", () => {
    const html = `<html><head><script type="application/ld+json">
      {"@type":"Product","name":"X","brand":{"name":"ALAUKIK"}}
      </script></head><body><span itemprop="brand">OtraMarca</span></body></html>`;
    const fields = extractProductData(html, URL_FUENTE, "supplier");
    expect(fields.marca.status).toBe("conflict");
    expect(fields.marca.alternatives.length).toBe(2);
  });
});

describe("importProductData", () => {
  it("sin URL devuelve fetchError y campos not_found (nunca inventa datos)", async () => {
    const res = await importProductData({ nombre: "Incienso Alaukik Litchi 90 g" });
    expect(res.fetchError).toBeTruthy();
    expect(res.fields.marca.status).toBe("not_found");
    expect(res.sources).toEqual([]);
  });

  it("rechaza URLs locales/privadas sin hacer petición", async () => {
    const res = await importProductData({ url: "http://localhost:3001/x" });
    expect(res.status).toBe("needs_review");
    expect(res.fetchError).toBeTruthy();
    expect(res.fields.nombre.status).toBe("not_found");
  });
});

describe("mergeProductEnrichments", () => {
  it("conserva campos aceptados por el admin aunque la nueva fuente diga otra cosa", () => {
    const existing = {
      fields: {
        marca: {
          value: "ALAUKIK",
          source: "https://manual.admin",
          sourceType: "other",
          confidence: "high",
          status: "accepted",
          contentType: "objective"
        }
      },
      sources: []
    };
    const incoming = {
      status: "imported",
      fields: {
        marca: {
          value: "OtraMarca",
          source: URL_FUENTE,
          sourceType: "supplier",
          confidence: "high",
          status: "found",
          contentType: "objective"
        }
      },
      sources: [{ url: URL_FUENTE, sourceType: "supplier", checkedAt: "2026-01-01T00:00:00Z" }]
    };
    const merged = mergeProductEnrichments(existing, incoming);
    expect(merged.fields.marca.status).toBe("accepted");
    expect(merged.fields.marca.value).toBe("ALAUKIK");
  });

  it("fusiona fuentes sin duplicar URLs", () => {
    const src = { url: URL_FUENTE, sourceType: "supplier", checkedAt: "2026-01-01T00:00:00Z" };
    const merged = mergeProductEnrichments(
      { fields: {}, sources: [src] },
      { status: "imported", fields: {}, sources: [src] }
    );
    expect(merged.sources).toHaveLength(1);
  });
});

describe("findDuplicateProduct", () => {
  const catalogo = [
    { id: 313, nombre: "Limpia Casas", marca: "ALAUKIK", peso: "30 g", ean: "8906058544805" },
    { id: 400, nombre: "Vela", referencia: "VELA-01" },
    { id: 401, nombre: "Otro", urlOrigen: "https://proveedor.example.com/p/77" }
  ];

  it("detecta duplicado por EAN", () => {
    const dup = findDuplicateProduct(catalogo, { nombre: "Cualquiera", ean: "8906058544805" });
    expect(dup?.product.id).toBe(313);
    expect(dup?.matchedBy).toBe("ean");
  });

  it("detecta duplicado por referencia/SKU", () => {
    const dup = findDuplicateProduct(catalogo, { nombre: "Vela copia", referencia: "vela-01" });
    expect(dup?.product.id).toBe(400);
    expect(dup?.matchedBy).toBe("reference");
  });

  it("detecta duplicado por URL de origen", () => {
    const dup = findDuplicateProduct(catalogo, {
      nombre: "Otro",
      urlOrigen: "https://proveedor.example.com/p/77/"
    });
    expect(dup?.product.id).toBe(401);
    expect(dup?.matchedBy).toBe("source_url");
  });

  it("detecta duplicado por marca + nombre + peso", () => {
    const dup = findDuplicateProduct(catalogo, {
      nombre: "Limpia Casas",
      marca: "alaukik",
      peso: "30 g"
    });
    expect(dup?.product.id).toBe(313);
    expect(dup?.matchedBy).toBe("brand_name_weight");
  });

  it("excluye el propio producto al editar", () => {
    const dup = findDuplicateProduct(
      catalogo,
      { nombre: "Limpia Casas", ean: "8906058544805" },
      313
    );
    expect(dup).toBeNull();
  });

  it("no confunde productos distintos de la misma marca y peso", () => {
    const dup = findDuplicateProduct(catalogo, {
      nombre: "Ruda",
      marca: "ALAUKIK",
      peso: "30 g"
    });
    expect(dup).toBeNull();
  });
});
