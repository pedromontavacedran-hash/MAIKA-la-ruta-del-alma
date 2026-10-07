import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { analyticsFile } from "../lib/env.js";
import { fechaHoyEspana } from "../lib/fechaEspana.js";
import {
  ARTICULOS_ANALITICA,
  registrarVista,
  resetearAnalitica,
  resumenAnalitica
} from "../lib/analytics.js";

const backendDir = path.dirname(fileURLToPath(import.meta.url));

const hoy = fechaHoyEspana();

/** YYYY-MM-DD de hace `n` días (mediodía local → misma fecha en Europe/Madrid). */
function haceDias(n) {
  const d = new Date(`${hoy}T12:00:00.000`);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/**
 * El cache de lib/analytics se rellena en la primera llamada: para probar la
 * agregación multi-día sembramos el archivo ANTES de cualquier lectura.
 */
beforeAll(() => {
  const datos = {};
  for (let i = 1; i <= 9; i += 1) {
    datos[haceDias(i)] = {
      vistas: 1,
      secciones: { articulos: 1 },
      articulos: { "sonar-con-agua": 1 }
    };
  }
  datos[haceDias(45)] = {
    vistas: 2,
    secciones: { articulos: 2 },
    articulos: { "sonar-dientes-caen": 5 }
  };
  mkdirSync(path.dirname(analyticsFile), { recursive: true });
  writeFileSync(analyticsFile, JSON.stringify(datos), "utf8");
});

describe("Analítica propia — vistas por artículo", () => {
  it("el selector de días agrega solo los cubos dentro de la ventana", () => {
    const r7 = resumenAnalitica(7);
    expect(r7.totales.articulos["sonar-con-agua"]).toBe(7);
    expect(r7.totales.articulos["sonar-dientes-caen"]).toBeUndefined();

    const r90 = resumenAnalitica(90);
    expect(r90.totales.articulos["sonar-con-agua"]).toBe(9);
    expect(r90.totales.articulos["sonar-dientes-caen"]).toBe(5);
  });

  it("cada cubo diario expone su mapa de artículos", () => {
    const r = resumenAnalitica(90);
    const dia = r.porDia.find((d) => d.fecha === haceDias(1));
    expect(dia.articulos["sonar-con-agua"]).toBe(1);
    const antiguo = r.porDia.find((d) => d.fecha === haceDias(45));
    expect(antiguo.articulos["sonar-dientes-caen"]).toBe(5);
  });

  it("la allowlist del backend es espejo exacto de los slugs de articulos.ts", () => {
    const fuente = readFileSync(
      path.join(backendDir, "../../src/data/articulos.ts"),
      "utf8"
    );
    const slugsEditoriales = new Set(
      [...fuente.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1])
    );
    expect(slugsEditoriales.size).toBeGreaterThan(0);
    expect(ARTICULOS_ANALITICA).toEqual(slugsEditoriales);
  });

  it("registrarVista cuenta slug válido e ignora slugs arbitrarios", () => {
    resetearAnalitica();

    registrarVista({ seccion: "articulos", entrada: false, articulo: "sonar-con-agua" });
    registrarVista({ seccion: "articulos", entrada: false, articulo: "no-existe-este-articulo" });
    registrarVista({ seccion: "articulos", entrada: false, articulo: "__proto__" });
    registrarVista({ seccion: "articulos", entrada: false });

    const totales = resumenAnalitica(30).totales;
    expect(totales.articulos["sonar-con-agua"]).toBe(1);
    expect(Object.keys(totales.articulos)).toEqual(["sonar-con-agua"]);
    /* La vista de página sí cuenta aunque el slug no sea válido. */
    expect(totales.vistas).toBe(4);
    expect(totales.secciones.articulos).toBe(4);
  });

  it("POST /analytics/vista acepta el campo articulo y solo cuenta slugs cerrados", async () => {
    resetearAnalitica();

    const ok = await request(app)
      .post("/analytics/vista")
      .send({ seccion: "articulos", articulo: "tarot-evolutivo-cartas-mapa" });
    expect(ok.status).toBe(204);

    const malo = await request(app)
      .post("/analytics/vista")
      .send({ seccion: "articulos", articulo: "payload-inventado", extra: "ignorado" });
    expect(malo.status).toBe(204);

    const totales = resumenAnalitica(30).totales;
    expect(totales.articulos["tarot-evolutivo-cartas-mapa"]).toBe(1);
    expect(totales.articulos["payload-inventado"]).toBeUndefined();
    expect(totales.vistas).toBe(2);
  });
});
