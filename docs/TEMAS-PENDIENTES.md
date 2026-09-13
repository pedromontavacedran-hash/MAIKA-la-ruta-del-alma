# Temas pendientes (MAIKA)

Archivo **vivo**: edítalo tú cuando quieras. Si en el chat preguntas *qué tenemos pendiente* o *qué falta probar*, la referencia es **este fichero** (además del código si hace falta).

Cómo marcar tareas:

- Pendiente: `- [ ] descripción`
- Hecho: `- [x] descripción`

---

## Pruebas antes de publicar

### Calidad en código (CI / local) — *auditoría paso 1*

- [ ] En local: `npm run lint` + `npm run typecheck` + `npm run test` (si tocaste backend de datos: `npm run test:backend`).
- [ ] Si hay PR o push a `main`/`master`: comprobar que **GitHub Actions (CI)** terminó **en verde** (`build`, tests incluidos).

### Documentación — *auditoría paso 2*

- [ ] **README:** arranque y variables siguen siendo ciertos (o actualízalos si cambió algo).
- [ ] **[MEJORAS.md](MEJORAS.md):** tachar o actualizar lo obsoleto para no guiar con ideas ya hechas o descartadas.

### Web y flujos

- [ ] Smoke en al menos dos navegadores (p. ej. Chrome + Firefox o Edge).
- [ ] Flujo **Olvidé la contraseña**: solicitud → correo → enlace → nueva clave → login.
- [ ] **Mi cuenta**: login, datos visibles, sin error de API inalcanzable.
- [ ] URLs de producción coherentes: `FRONTEND_URL`, API (`VITE_API_URL` / `maika-api.json`).
- [ ] Prueba rápida en móvil o vista estrecha (si aplica al tráfico real).
- [ ] Opcional: `npm run build` + `npm run preview` contra API de staging.

*(La guía genérica sigue en el README, sección «Checklist antes de publicar».)*

---

## Otros pendientes

Añade aquí lo que sea: bugs, mejoras, revisión legal, contenido, etc.

- [ ] *(ejemplo)* …
