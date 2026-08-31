import { test } from "node:test";
import assert from "node:assert";
import { sanitizeUsuarioUpdate } from "./sanitizeUsuario.js";
import { pickUsuarioEditable } from "./pickUsuarioEditable.js";

test("sanitizeUsuarioUpdate elimina nombre", () => {
  const input = { nombre: "Hacker", direccion: "abcde" };
  const out = sanitizeUsuarioUpdate(input);
  assert.ok(!("nombre" in out), "nombre debe ser eliminado");
  assert.strictEqual(out.direccion, "abcde");
});

test("pickUsuarioEditable ignora nombre, rol y campos arbitrarios", () => {
  const input = {
    nombre: "Hacker",
    rol: "admin",
    emailVerificado: true,
    direccion: "Calle X",
    telefono: "612345678",
    password: "secreto123"
  };
  const out = pickUsuarioEditable(input);
  assert.ok(!("nombre" in out));
  assert.ok(!("rol" in out));
  assert.ok(!("emailVerificado" in out));
  assert.strictEqual(out.direccion, "Calle X");
  assert.strictEqual(out.telefono, "612345678");
  assert.strictEqual(out.password, "secreto123");
});

test("pickUsuarioEditable normaliza dirección (trim)", () => {
  const input = { nombre: "X", rol: "admin", direccion: " Calle 1 " };
  const out = pickUsuarioEditable(input);
  assert.ok(!("nombre" in out));
  assert.ok(!("rol" in out));
  assert.strictEqual(out.direccion, "Calle 1");
});

test("pickUsuarioEditable no incluye dirección demasiado corta ni email inválido", () => {
  assert.ok(!("direccion" in pickUsuarioEditable({ direccion: "abc" })));
  assert.ok(!("email" in pickUsuarioEditable({ email: "no-es-email" })));
});
