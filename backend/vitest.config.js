import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: backendDir,
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
    exclude: ["tests/productoPublico.test.js"],
    setupFiles: ["tests/setup-backend-env.js"],
    fileParallelism: false
  }
});
