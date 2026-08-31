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
