# Contratos de consistencia por módulo (estado actual)

Este documento describe **qué garantiza hoy el cliente** frente al servidor, no lo que “debería” ser. Sirve para priorizar cambios y evitar parches que rompan invariantes implícitas.

## Alcance y límite del outbox

El **outbox** (`maika_outbox` en `localStorage`) aporta **resiliencia operativa** ante fallos de red, API caída y refrescos de pestaña: reintentos y deduplicación donde aplica.

**No garantiza** consistencia absoluta frente a:

- pérdida o borrado del almacenamiento del navegador;
- datos corruptos en `localStorage`;
- errores lógicos o condiciones de carrera entre caminos distintos de actualización.

En la práctica: **alta probabilidad de entrega eventual** bajo condiciones normales, no demostración formal.

---

## Módulo: Pedidos (creación)

| Aspecto | Acuerdo actual |
|--------|----------------|
| **Fuente de verdad** | Servidor (el pedido “oficial” es el que acepta la API). |
| **Garantía en cliente** | Cola persistente + procesamiento con reintentos; creación de pedido encolada antes del intento de API; clave de idempotencia en el envío. Código: `src/utils/maikaOutbox.ts`, `src/checkout/fases/persistirTrasPedidoCheckout.ts`. |
| **Riesgo residual** | Sin datos locales no hay cola; duplicados o huecos si el servidor no respeta idempotencia o hay bugs en dedupe. |
| **Reconciliación** | Con sesión (`token`): `GET` de pedidos y mirror en `pedidosMaika` (`src/hooks/usePedidosMaika.ts`). Sin token: solo local. |

---

## Módulo: Usuarios Maika → API

| Aspecto | Acuerdo actual |
|--------|----------------|
| **Fuente de verdad** | Mixta: listado/gestión en cliente (`maika_usuarios`) y registros en API; deben alinearse por sync, no hay único dueño documentado en código. |
| **Garantía en cliente** | Cambios típicos pasan por outbox (`usuario` + `upsert`) y `sincronizarOutbox`. Existen **otros caminos**: guardado con `omitirOutbox` + sync debounced, checkout (`checkoutSyncUsuarioServidor`), admin (`syncMaikaPerfilServidor.ts`). |
| **Riesgo residual** | Posibles carreras o sobrescrituras entre caminos; depuración más difícil. |
| **Reconciliación** | `restaurarMaikaUsuariosDesdeBackendSiVacio` si no hay filas locales; listados admin desde API. |

---

## Módulo: Estado de pedido

| Aspecto | Acuerdo actual |
|--------|----------------|
| **Fuente de verdad** | **Ambigua**: se persiste primero en local y luego se intenta API; si la API falla, el cambio queda solo en cliente. Código: `src/utils/pedidos/sincronizarEstadoPedidoMaika.ts`. |
| **Garantía en cliente** | Persistencia local inmediata. |
| **Riesgo residual** | Divergencia silenciosa con el servidor (admin u otro dispositivo ven otro estado). |
| **Reconciliación** | **No definida** como cola de reintentos; punto débil explícito para evolución. |

---

## Módulo: Carrito

| Aspecto | Acuerdo actual |
|--------|----------------|
| **Fuente de verdad** | Sin token: cliente (`localStorage`). Con token: servidor como mirror principal tras carga; merge con carrito invitado pendiente al pasar a sesión. Código: `src/hooks/useCarrito.ts`. |
| **Garantía en cliente** | Best-effort: debounce y `guardarCarritoApi` sin cola de reintentos fuerte. |
| **Riesgo residual** | Cambios no reflejados en servidor si la API falla en el guardado. |
| **Reconciliación** | Merge al login cuando hay `GUEST_CART_PENDING_KEY`; nueva carga desde API al cambiar identidad de sesión. |

---

## Módulo: Catálogo y stock

| Aspecto | Acuerdo actual |
|--------|----------------|
| **Fuente de verdad** | Principalmente **cliente** (listas y persistencia local); el stock se ajusta tras checkout en flujo local. |
| **Garantía en cliente** | No hay reconciliación periódica unificada con un catálogo servidor descrito en el mismo patrón que pedidos/usuarios. |
| **Riesgo residual** | Desalineación en escenarios multiusuario o multi-dispositivo si el backend fuera canónico en el futuro. |
| **Reconciliación** | Depende del flujo de carga del catálogo (hooks/config); no consolidada aquí como contrato único. |

---

## Módulo: Auth / JWT

| Aspecto | Acuerdo actual |
|--------|----------------|
| **Fuente de verdad** | Servidor emite el token; el cliente lo guarda y lo adjunta a las peticiones. |
| **Garantía en cliente** | Helpers en `src/services/apiAuth.ts` (`getStoredJwtToken`, etc.). En **algunos** sitios se usa `localStorage.getItem("token")` directamente (p. ej. claves de sync en shell). |
| **Riesgo residual** | Comportamiento “a medias” si solo una parte del código ve el mismo almacén de sesión. |
| **Reconciliación** | Mejora recomendada: **una sola función de lectura** de JWT y evitar acceso directo disperso (contrato futuro, no obligatorio en este documento). |

---

## Módulo: Indicador de sincronización (UI)

| Aspecto | Acuerdo actual |
|--------|----------------|
| **Comportamiento** | Combina estado de la cola `maika_outbox`, resultado del último intento en la sesión (`maikaOutboxSyncSession`) y probe de `/health` (`src/app/hooks/useSyncStatus.ts`, `src/utils/maikaApiProbe.ts`). |
| **Nota** | Es **indicador**, no garantía de que todos los subsistemas (carrito, estado de pedido, etc.) estén alineados con el servidor. |

---

## Cómo usar este documento

- Al cambiar código: actualizar la fila del módulo afectado si cambian fuente de verdad, garantías o reconciliación.
- Al priorizar trabajo: los módulos con reconciliación **no definida** o **fuente ambigua** suelen ser los primeros candidatos a endurecer (p. ej. outbox para estado de pedido, unificación JWT).

Este documento se actualiza **cuando cambia el comportamiento real del sistema**, no antes. Si en runtime un contrato deja de cumplirse, o bien hay un **bug** que hay que corregir, o el **contrato está desactualizado** y hay que actualizar este archivo para que siga siendo la fuente de verdad sobre lo que el código promete.

Última revisión alineada con el código del monorepo Maika (frontend + referencias a rutas de `src/`).
