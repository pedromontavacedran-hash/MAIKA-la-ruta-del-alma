# MAIKA · Rutas del Alma

App React + TypeScript (Vite) con backend Express en `backend/`, persistencia JSON,
y targets PWA / Android (Capacitor) / Electron.

## Pendientes

- **Dominio definitivo (SEO)**: cuando la web tenga dominio propio:
  - `public/sitemap.xml` — sustituir `https://TU-DOMINIO` por el dominio real.
  - `public/robots.txt` — descomentar y ajustar la línea `Sitemap:`.
  - `index.html` — convertir `og:image` / `twitter:image` a URLs absolutas
    (`https://dominio/og-portada.png`); opcionalmente añadir `og:url` y
    `<link rel="canonical">`.
  - `index.html` JSON-LD — añadir `"url"` absoluta al objeto `Store`.

## Verificación habitual

- `npm run typecheck` (tsc -b --noEmit), `npm run lint`, `npm run build`.
- Dev: `npm run dev:full` (front :5173 + backend :3001).
