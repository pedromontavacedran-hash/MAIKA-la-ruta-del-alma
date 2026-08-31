# MAIKA

Front React + Vite; API en `backend/`. Para el detalle de estilos y contratos sigue leyendo más abajo.

## Desarrollo local

### Arranque

- **Todo junto (recomendado):** `npm run dev:full` — Vite + Express en paralelo.
- **Por separado:** `npm run dev` (front, suele ser `:5173`) y en otra terminal `npm run backend:dev` (API, suele ser `:3001`).
- **Móvil / misma Wi‑Fi:** `npm run dev:mobile` y apunta el cliente al API del PC vía `public/maika-api.json` (`apiBaseUrl`) o `VITE_API_URL` en el build; la lógica está en `src/config/apiBaseUrl.ts`.

### Variables de entorno (`.env`)

Copia `.env.example` a `.env` y rellena.

**Imprescindibles en producción:** `JWT_SECRET`, `MAIKA_ADMIN_PANEL_PASSWORD`, `MAIKA_PREMIUM_JWT_SECRET` (valores largos y únicos; no subas `.env` al repo).

**Recuperación de contraseña y correos:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (en Gmail, contraseña de aplicación, no la cuenta normal). Opcional: `SMTP_TEST_TO` para probar envíos.

**Enlaces y CORS:** `FRONTEND_URL` debe coincidir con la URL real del front (enlaces en mails, coherencia en despliegue).

**Opcional:** `WHATSAPP_URL` (enlace `wa.me` en el pie del correo de recuperación).

**Dónde apunta el front al API:** `VITE_API_URL` en tiempo de build, o `public/maika-api.json` → `apiBaseUrl` (útil en red local sin recompilar).

### Checklist antes de publicar

**Calidad (CI / local)** — mismo criterio que el paso 1 de la auditoría:

- En local: `npm run lint`, `npm run typecheck`, `npm run test` (y `npm run test:backend` si cambiaste lógica en `backend/`).
- Tras subir cambios: revisar que **CI** en GitHub (`.github/workflows/ci.yml`) ha pasado **en verde**.

**Documentación** — paso 2 de la auditoría:

- README y `.env.example` coherentes con cómo arrancas y despliegas.
- [docs/MEJORAS.md](docs/MEJORAS.md) al día (sin ítems obsoletos que confundan).

**Web y flujos**

- Smoke en **al menos dos navegadores** (p. ej. Chrome + Firefox o Edge).
- **Olvidé la contraseña:** solicitud → correo recibido → enlace → nueva clave → **inicio de sesión** con esa clave.
- **Mi cuenta:** login, datos visibles, sin mensaje de API inalcanzable; si cambias dominio, confirma `FRONTEND_URL` y la URL pública del API.
- **Producción:** secretos fuertes, SMTP real, `FRONTEND_URL` y `apiBaseUrl` / `VITE_API_URL` acordes al dominio final; prueba rápida en **móvil** o al menos ventana estrecha si el tráfico principal es responsive.
- Opcional: `npm run build` y `npm run preview` para validar el bundle contra la API de staging.

**Lista editable de pendientes / pruebas:** [docs/TEMAS-PENDIENTES.md](docs/TEMAS-PENDIENTES.md).

## Arquitectura

- Contratos de consistencia: docs/CONTRATOS-CONSISTENCIA.md

## Arquitectura CSS

El CSS de la app **no vive en un solo `App.css` gigante**: se partió en módulos para **reducir ruido**, **localizar cambios** (tienda, checkout, admin, horóscopos, etc.) y **evitar regresiones** al tocar una zona sin querer afectar otra. El aspecto se mantuvo igual que con el monolito; lo que cambió es **dónde está cada bloque** y **en qué orden se carga**.

### Por qué se dividió `App.css`

- **Mantenimiento**: buscar reglas entre miles de líneas era propenso a errores.
- **Responsabilidad por ámbito**: variables y base global (`src/styles/global.css`), layout en dos archivos (`layout-responsive.css`, `layout-shell.css` — en el monolito original **no eran consecutivos**, así que no se fusionaron en un solo `layout.css` sin romper la cascada), páginas o flujos (`src/pages/*.css`).
- **Rutas aisladas**: la lectura semanal va en `src/pages/lectura.css` importado solo desde `LecturaPage.tsx`; no mezclar ese layout con el resto.

### Qué hace `scripts/split-app-css.mjs`

Es un script **de mantenimiento** (no forma parte del build habitual): lee `src/App.css` y **vuelca rangos de líneas fijos** a los ficheros destino (`checkout`, `cuenta`, `global`, `layout-responsive`, `home`, `servicios`, `admin`, `layout-shell`, `tienda`, `admin-supplement`, `legal`, `horoscopo`). Sirve para **regenerar** los módulos a partir de un monolito si alguien pegara de nuevo un `App.css` único (por ejemplo tras un merge desastroso).

**Importante**: si editas los CSS modularizados a mano (lo normal), **no hace falta** ejecutar el script salvo que quieras **re-sincronizar** desde un `App.css` monolítico de referencia.

### Cómo volver a ejecutar el split

Desde la raíz del repo:

```bash
node scripts/split-app-css.mjs
```

Eso **sobrescribe** los archivos listados en el script con el contenido actual de `src/App.css` según los rangos definidos en el propio script. Antes de ejecutarlo, asegúrate de que `App.css` es realmente el monolito fuente que quieres trocear; si tu `App.css` ya es solo el barrel de `@import`, el script no es aplicable tal cual.

### Orden de carga de CSS (no reordenar a la ligera)

1. **`main.tsx`**: `@/styles/global.css` primero (variables `:root`, reset, scrollbar, `body`, bloque base largo que antes iba ~655–1401).
2. **`MaikaAppShell.tsx`**: `App.css`, que solo **encadena** `@import` en el **mismo orden** que el antiguo monolito:
   - `checkout.css` → `cuenta.css` → `layout-responsive.css` → `home.css` → `servicios.css` → **`admin.css`** → `layout-shell.css` → `tienda.css` → **`admin-supplement.css`** → `legal.css` → `horoscopo.css`.
3. **`LecturaPage.tsx`**: `lectura.css` (solo ruta `/lectura`).

El tramo **admin** está en **dos archivos** porque en el monolito había **código de admin antes y después** del bloque de shell + tienda; juntarlos en un solo `.css` importado una vez **cambiaría la cascada**. Si añades reglas nuevas, colócalas en el módulo que corresponda y, si dudas del orden, mira el comentario en `src/App.css`.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
