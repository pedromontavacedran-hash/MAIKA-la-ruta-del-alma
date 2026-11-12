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

## Sistema QR para tarjetas físicas

- **URL permanente del QR**: `https://maikarutasdelalma.com` (raíz del dominio)
- **Destino actual**: `https://maika.enzonic.dev/enlaces`
- **Archivo de redirección**: `public/index-redirect.html` (redirige automáticamente)
- **Cómo configurar cuando el dominio esté activo**:
  1. Configurar DNS para `maikarutasdelalma.com`
  2. Configurar hosting (puede ser el mismo servidor que Enzonic o uno diferente)
  3. Subir el contenido de `public/index-redirect.html` como `index.html` en el hosting del dominio
  4. Verificar que `https://maikarutasdelalma.com` redirige a `https://maika.enzonic.dev/enlaces`
  5. Generar el QR apuntando a `https://maikarutasdelalma.com` y guardarlo como `maika_qr.png`
- **Ventaja**: El QR impreso nunca cambiará; solo se modifica el archivo de redirección en el hosting

## Verificación habitual

- `npm run typecheck` (tsc -b --noEmit), `npm run lint`, `npm run build`.
- Dev: `npm run dev:full` (front :5173 + backend :3001).
