import { test } from "node:test";
import assert from "node:assert/strict";
import { productoPublicoTienda } from "../lib/storage.js";

test("productoPublicoTienda filtra activo", () => {
  const p = { id: 1, nombre: "Vela", precio: 10, stock: 5, activo: false, categoria: "velas" };
  const pub = productoPublicoTienda(p);
  assert.equal("activo" in pub, false, "activo no debe estar en la respuesta publica");
});

test("productoPublicoTienda filtra precioCosteIvaIncluido", () => {
  const p = {
    id: 1,
    nombre: "Vela",
    precio: 10,
    stock: 5,
    precioCosteIvaIncluido: 6.5,
    categoria: "velas"
  };
  const pub = productoPublicoTienda(p);
  assert.equal("precioCosteIvaIncluido" in pub, false, "precioCosteIvaIncluido no debe exponerse");
});

test("productoPublicoTienda preserva campos publicos", () => {
  const p = {
    id: 1,
    nombre: "Vela Blanca",
    precio: 12.5,
    stock: 5,
    categoria: "velas",
    descripcion: "Vela ritual",
    imagen: "vela.jpg",
    activo: true,
    precioCosteIvaIncluido: 6.5
  };
  const pub = productoPublicoTienda(p);
  assert.equal(pub.id, 1);
  assert.equal(pub.nombre, "Vela Blanca");
  assert.equal(pub.precio, 12.5);
  assert.equal(pub.stock, 5);
  assert.equal(pub.categoria, "velas");
  assert.equal(pub.descripcion, "Vela ritual");
  assert.equal(pub.imagen, "vela.jpg");
});

test("productoPublicoTienda no expone enriquecimiento sin revisar", () => {
  const p = {
    id: 1,
    nombre: "Incienso",
    precio: 5,
    stock: 3,
    categoria: "inciensos",
    activo: true,
    marca: "ALAUKIK",
    enriquecimiento: {
      status: "imported",
      fields: { marca: { value: "CandidatoSinRevisar", status: "found" } },
      sources: [{ url: "https://proveedor.example.com/x" }]
    }
  };
  const pub = productoPublicoTienda(p);
  assert.equal("enriquecimiento" in pub, false, "los candidatos importados son solo de administración");
  assert.equal(pub.marca, "ALAUKIK", "los campos planos aprobados sí se exponen");
});
