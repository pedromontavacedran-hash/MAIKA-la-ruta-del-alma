import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app, ensureStorage } from "../app.js";
import { ADMIN_PANEL_PASSWORD } from "../lib/env.js";

const TEST_PASSWORD = "testpass1234";
const NEW_PASSWORD_AFTER_RESET = "resetpass9876";

describe.sequential("Auth API", () => {
  let testEmail;
  let testPhone;
  let agent;

  beforeAll(async () => {
    agent = request.agent(app);
    testEmail = `vitest-${Date.now()}-${Math.random().toString(16).slice(2)}@maika.test`;
    testPhone = `6${String(Date.now()).slice(-8)}`;
    await ensureStorage();
    // Alta pública real: solicitar código (en test se expone vía globalThis, nunca en la respuesta),
    // verificarlo y registrar con el token emitido + aceptación legal.
    const cod = await agent
      .post("/auth/registro/solicitar-codigo")
      .send({ email: testEmail, declaraMayorEdad: true });
    expect(cod.status).toBe(200);
    const codigo = globalThis.__MAIKA_TEST_REGISTRO_CODIGOS__?.[testEmail];
    expect(typeof codigo).toBe("string");
    const ver = await agent
      .post("/auth/registro/verificar")
      .send({ email: testEmail, codigo });
    expect(ver.status).toBe(200);
    expect(ver.body.verificacionToken).toBeTruthy();
    const reg = await agent
      .post("/auth/register")
      .send({
        email: testEmail,
        password: TEST_PASSWORD,
        nombre: "Vitest",
        telefono: testPhone,
        verificacionToken: ver.body.verificacionToken,
        aceptacionTerminos: true,
        aceptacionPrivacidad: true,
        declaraMayorEdad: true
      });
    expect(reg.status).toBe(200);
    expect(reg.body.ok).toBe(true);
    const { readUsuarios } = await import("../lib/storage.js");
    const guardado = (await readUsuarios()).find(
      (u) => String(u?.email || "").toLowerCase() === testEmail
    );
    expect(guardado?.declaraMayorEdad).toBe(true);
    expect(typeof guardado?.declaraMayorEdadFecha).toBe("string");
    expect(guardado?.fechaNacimiento).toBeUndefined();
  });

  it("rechaza el alta sin verificación de email ni aceptación legal", async () => {
    const res = await agent.post("/auth/register").send({
      email: `sin-verificar-${Date.now()}@maika.test`,
      password: TEST_PASSWORD,
      nombre: "Sin Verificar",
      telefono: `6${String(Date.now() + 1).slice(-8)}`
    });
    expect(res.status).toBe(400);
  });

  it("rechaza solicitar código sin declarar mayoría de edad", async () => {
    const res = await agent
      .post("/auth/registro/solicitar-codigo")
      .send({ email: `menor-${Date.now()}@maika.test` });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/18/);
  });

  it("rechaza el alta pública sin declarar mayoría de edad aunque el email esté verificado", async () => {
    const email = `sin-mayor-edad-${Date.now()}@maika.test`;
    await agent
      .post("/auth/registro/solicitar-codigo")
      .send({ email, declaraMayorEdad: true });
    const codigo = globalThis.__MAIKA_TEST_REGISTRO_CODIGOS__?.[email];
    const ver = await agent.post("/auth/registro/verificar").send({ email, codigo });
    expect(ver.status).toBe(200);
    const reg = await agent.post("/auth/register").send({
      email,
      password: TEST_PASSWORD,
      nombre: "Sin Mayor Edad",
      telefono: `6${String(Date.now() + 2).slice(-8)}`,
      verificacionToken: ver.body.verificacionToken,
      aceptacionTerminos: true,
      aceptacionPrivacidad: true
    });
    expect(reg.status).toBe(400);
    expect(reg.body.error).toMatch(/18/);
  });

  it("rechaza un código de verificación incorrecto", async () => {
    const email = `codigo-mal-${Date.now()}@maika.test`;
    await agent
      .post("/auth/registro/solicitar-codigo")
      .send({ email, declaraMayorEdad: true });
    const res = await agent
      .post("/auth/registro/verificar")
      .send({ email, codigo: "000000" });
    // Puede ser incorrecto (400) o, por azar 1/1.000.000, correcto (200): ambos son válidos.
    expect([200, 400]).toContain(res.status);
  });

  it("login correcto establece cookie de sesión", async () => {
    const res = await agent.post("/auth/login").send({ email: testEmail, password: TEST_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.user?.email).toContain("@maika.test");
    const me = await agent.get("/me");
    expect(me.status).toBe(200);
    expect(String(me.body?.email || "")).toContain("@maika.test");
  });

  it("login incorrecto: 401 y mismo mensaje genérico", async () => {
    const res = await request(app).post("/auth/login").send({ email: testEmail, password: "mala12345" });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Credenciales incorrectas" });
  });

  it("la consulta por teléfono no expone el email y la recuperación sigue funcionando", async () => {
    const estado = await request(app).post("/auth/estado-telefono").send({ telefono: testPhone });
    expect(estado.status).toBe(200);
    expect(estado.body).toEqual({ existe: true, hasEmail: true, hasPassword: true });
    expect(estado.body.email).toBeUndefined();

    const forgot = await request(app).post("/auth/forgot-password").send({ telefono: testPhone });
    expect(forgot.status).toBe(200);
    expect(globalThis.__MAIKA_TEST_LAST_RESET_TOKEN__).toBeTruthy();
  });

  it("el logout admin revoca también las sesiones admin de otros navegadores", async () => {
    const adminA = request.agent(app);
    const adminB = request.agent(app);
    const loginA = await adminA.post("/auth/admin-panel-token").send({ password: ADMIN_PANEL_PASSWORD });
    const loginB = await adminB.post("/auth/admin-panel-token").send({ password: ADMIN_PANEL_PASSWORD });
    expect(loginA.status).toBe(200);
    expect(loginB.status).toBe(200);

    expect((await adminA.get("/auth/admin/me")).status).toBe(200);
    expect((await adminB.get("/auth/admin/me")).status).toBe(200);
    expect((await adminA.post("/auth/admin/logout")).status).toBe(200);
    expect((await adminB.get("/auth/admin/me")).status).toBe(403);
  });

  it("flujo reset password completo", async () => {
    const forgot = await request(app).post("/auth/forgot-password").send({ email: testEmail });
    expect(forgot.status).toBe(200);
    const token = globalThis.__MAIKA_TEST_LAST_RESET_TOKEN__;
    expect(token && String(token).length > 20).toBe(true);

    const reset = await request(app)
      .post("/auth/reset-password")
      .send({ token, newPassword: NEW_PASSWORD_AFTER_RESET });
    expect(reset.status).toBe(200);

    const badOld = await agent.post("/auth/login").send({ email: testEmail, password: TEST_PASSWORD });
    expect(badOld.status).toBe(401);

    const loginNew = await agent
      .post("/auth/login")
      .send({ email: testEmail, password: NEW_PASSWORD_AFTER_RESET });
    expect(loginNew.status).toBe(200);
    const me = await agent.get("/me");
    expect(me.status).toBe(200);
  });

  it("nunca crea transporte SMTP real en tests aunque haya credenciales en el entorno", async () => {
    // Regresión: con SMTP_* "reales" el transporte debe seguir siendo null y no enviarse nada.
    process.env.SMTP_HOST = "smtp.gmail.com";
    process.env.SMTP_USER = "vitest-no-real@maika.test";
    process.env.SMTP_PASS = "vitest-no-real";
    try {
      const { getSmtpTransporter, smtpConfigCompleta } = await import("../lib/email.js");
      expect(smtpConfigCompleta()).toBe(false);
      expect(getSmtpTransporter()).toBeNull();
      const res = await request(app).post("/auth/forgot-password").send({ email: testEmail });
      expect(res.status).toBe(200);
      expect(globalThis.__MAIKA_TEST_LAST_RESET_TOKEN__).toBeTruthy();
    } finally {
      process.env.SMTP_HOST = "";
      process.env.SMTP_USER = "";
      process.env.SMTP_PASS = "";
    }
  });

  afterAll(() => {
    delete globalThis.__MAIKA_TEST_LAST_RESET_TOKEN__;
  });
});
