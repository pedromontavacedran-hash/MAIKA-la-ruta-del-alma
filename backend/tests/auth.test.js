import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app, ensureStorage } from "../app.js";

const TEST_PASSWORD = "testpass1234";
const NEW_PASSWORD_AFTER_RESET = "resetpass9876";

describe.sequential("Auth API", () => {
  let testEmail;
  let agent;

  beforeAll(async () => {
    agent = request.agent(app);
    testEmail = `vitest-${Date.now()}-${Math.random().toString(16).slice(2)}@maika.test`;
    await ensureStorage();
    const reg = await agent
      .post("/auth/register")
      .send({
        email: testEmail,
        password: TEST_PASSWORD,
        nombre: "Vitest"
      });
    expect(reg.status).toBe(200);
    expect(reg.body.ok).toBe(true);
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
