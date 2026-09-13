import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dataParent = mkdtempSync(join(tmpdir(), "maika-backend-test-"));

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "vitest-jwt-secret-for-maika-backend-tests!";
process.env.MAIKA_PREMIUM_JWT_SECRET = "vitest-premium-jwt-for-maika-tests!!!!";
process.env.MAIKA_ADMIN_PANEL_PASSWORD = "vitest-admin-panel-secret-pass";
process.env.FRONTEND_URL = "http://localhost:5173";
process.env.MAIKA_QUIET = "1";
process.env.MAIKA_USER_DATA = dataParent;

// En tests NUNCA puede haber SMTP real: se limpian las credenciales por si el entorno o un .env
// las inyecta (además `backend/lib/email.js` bloquea el transporte con NODE_ENV=test).
process.env.SMTP_HOST = "";
process.env.SMTP_PORT = "";
process.env.SMTP_USER = "";
process.env.SMTP_PASS = "";
process.env.SMTP_SECURE = "";
process.env.SMTP_ALLOW_INVALID_TLS = "";
process.env.SMTP_TEST_TO = "";
