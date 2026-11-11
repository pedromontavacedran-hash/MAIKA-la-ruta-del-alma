/// <reference types="vitest/config" />
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  /** Rutas absolutas para web hosting en raíz del dominio. */
  base: "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"]
  },
  /** Mismo puerto que `.capacitor-live` / Capacitor (5173, default Vite). */
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    /** Sueños: `fetch("/api/imagen")` → backend `POST /sueno/imagen` (evita CORS y mismo origen en dev). */
    proxy: {
      "/api/imagen": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/imagen/, "/sueno/imagen")
      },
      /** `POST /api/sueno/interpretar` (y futuras rutas bajo /api/sueno/*) → `/sueno/*` en :3001 */
      "/api/sueno": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sueno/, "/sueno")
      },
      /** `POST /api/rutas-del-alma/chat` → `/rutas-del-alma/chat` en :3001 (mismo patrón que sueno). */
      "/api/rutas-del-alma": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rutas-del-alma/, "/rutas-del-alma")
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id) return;
          if (id.includes("node_modules")) {
            if (id.includes("react-dom")) return "vendor-react";
            if (id.includes("react")) return "vendor-react";
            return "vendor";
          }
        },
      },
    },
  },
})
