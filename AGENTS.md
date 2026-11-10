# MAIKA · Rutas del Alma

App React + TypeScript (Vite) con backend Express en `backend/`, persistencia JSON,
y targets PWA / Android (Capacitor) / Electron.

## Dominio

- Dominio definitivo: **https://maikarutasdelalma.com** (ya configurado en
  `sitemap.xml`, `robots.txt`, `index.html` — og/twitter/canonical/JSON-LD — y
  `FRONTEND_URL` de `.env`).
- Página de enlaces para el QR de las tarjetas: **`/enlaces`**. Sus botones se
  editan en el panel admin (`enlaces.json` en `backend/data/`); endpoints
  `GET /enlaces-config` y `PUT /admin/enlaces`.
- Pendiente fuera del repo: publicar la web en el dominio (DNS + hosting) y,
  cuando `https://maikarutasdelalma.com/enlaces` responda, generar el QR
  estático apuntando a esa URL.

## Verificación habitual

- `npm run typecheck` (tsc -b --noEmit), `npm run lint`, `npm run build`.
- Dev: `npm run dev:full` (front :5173 + backend :3001).
