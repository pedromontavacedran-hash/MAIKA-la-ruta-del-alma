# Mejoras sugeridas – Maika

Lista priorizada de mejoras. Marca cuando apliques cada una.

---

## 1. Código y mantenibilidad

| # | Mejora | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 1.1 | **usePedidos**: Extraer lógica de pedidos (estado, localStorage, email, búsqueda) a un hook `usePedidos.ts`. App solo orquesta. | Medio | Alto – App.tsx sigue ~3900 líneas; bajaría mucho. |
| 1.2 | **React Router**: Añadir rutas URL (`/`, `/tienda`, `/carrito`, `/seguimiento`, etc.) para poder compartir enlaces y usar atrás/adelante del navegador. | Medio | Alto – Mejor UX y SEO. |
| 1.3 | **Constantes de estilo**: Sustituir colores y tamaños repetidos (ej. `#C9A24A`, `#0B0B0D`) por variables CSS o el objeto `THEME` de `config`. | Bajo | Medio – Consistencia y cambio de tema más fácil. |
| 1.4 | **Error boundary**: Envolver la app en un componente que capture errores de React y muestre una pantalla de “Algo ha fallado” en lugar de pantalla en blanco. | Bajo | Medio – Mejor experiencia ante fallos. |

---

## 2. Rendimiento y build

| # | Mejora | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 2.1 | **Code splitting**: Cargar páginas admin con `React.lazy` + `Suspense`. | ~~Bajo~~ | ✅ **Hecho** – Admin en chunks separados; manualChunks para React y EmailJS. |
| 2.2 | **Vite**: Ajustar más `manualChunks` o límites si quieres afinar carga. | Bajo | Bajo – Opcional. |

---

## 3. UX y accesibilidad

| # | Mejora | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 3.1 | **Focus y teclado**: Asegurar que modales y formularios se puedan cerrar con Escape y que el foco quede atrapado dentro del modal. | Bajo | Medio – Accesibilidad. |
| 3.2 | **Etiquetas en formularios**: Revisar que inputs tengan `label` asociado (por id o aria-label) para lectores de pantalla. | Bajo | Medio – Accesibilidad. |
| 3.3 | **Estados de carga**: Mostrar spinner o skeleton al cargar datos (localStorage, búsqueda de pedido) cuando pueda tardar. | Bajo | Bajo – Sensación de respuesta. |

---

## 4. Seguridad y buenas prácticas

| # | Mejora | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 4.1 | **Claves sensibles**: EmailJS (PUBLIC_KEY, etc.) en variables de entorno (`import.meta.env.VITE_*`) en lugar de en `config` en claro, para no subirlas al repo si se hace público. | Bajo | Alto – Si el repo es o será público. |
| 4.2 | **Validación de formularios**: Unificar validación (email, teléfono, CP) en helpers o una pequeña lib (ej. zod) para no duplicar reglas. | Medio | Medio – Menos bugs y mensajes coherentes. |

---

## 5. Funcionalidad (ideas ya listadas)

- Las ideas de **PENDIENTE_IDEAS_ESOTERISMO.md** están marcadas como “Hechas”. Si quieres ampliar: más kits, más bloques en Inicio, o A/B de textos de “Ritual del mes”.

---

## Resumen rápido

- **Rápido y muy útil**: 1.3 (THEME), 1.4 (Error boundary), 3.1 (Escape en modales), 4.1 (env para EmailJS).
- **Más trabajo, mucho impacto**: 1.1 (usePedidos), 1.2 (React Router).

*(2.1 Code splitting ya aplicado.)*

Si dices por cuál quieres empezar, se puede bajar al detalle (pasos o código concreto).
