# Plan de simplificación – Maika (página empresa)

Objetivo: dejar el código más claro, mantenible y preparado para crecer sin tocar un solo archivo gigante.

---

## 1. Situación actual

- **App.tsx** ~4600 líneas: estado, tipos, constantes, lógica de negocio, navegación y UI de casi todas las pantallas.
- Navegación por estado `pagina` (sin rutas URL).
- Pantallas: inicio, tienda, carrito, seguimiento, cuenta, admin, editarCategorias, editarProductos, nuevoProducto, nuevaCategoria.
- Ya hay componentes: Tienda, Carrito, AdminApp, modales, FooterLegal, etc.

---

## 2. Estructura de carpetas propuesta

```
src/
├── main.tsx
├── App.tsx                    # Solo: shell, navegación, providers
├── App.css
├── index.css
│
├── types/                     # Tipos e interfaces
│   └── index.ts               # Producto, ItemCarrito, Cliente, Usuario, Pedido, CategoriaEntrada, etc.
│
├── config/                    # Constantes y configuración
│   └── index.ts               # Claves localStorage, EMAILJS, keys admin, etc.
│
├── hooks/                     # Lógica reutilizable
│   ├── useCatalogo.ts         # velas, inciensos, figuras + localStorage
│   ├── useCategorias.ts       # categoriasCatalogo + imágenes categoría
│   ├── useCarrito.ts          # cart, agregar, quitar, total
│   ├── useNotificacion.ts     # notificacion, mostrarNotificacion
│   └── usePedidos.ts          # pedidos, form pedido, búsqueda (si se puede aislar)
│
├── pages/                     # Una carpeta por “página”
│   ├── InicioPage.tsx
│   ├── TiendaPage.tsx         # Envuelve <Tienda /> con props
│   ├── CarritoPage.tsx        # Envuelve <Carrito />
│   ├── SeguimientoPage.tsx
│   ├── CuentaPage.tsx
│   ├── admin/
│   │   ├── AdminPanelPage.tsx # Panel admin (botones, etc.)
│   │   ├── EditarCategoriasPage.tsx
│   │   ├── EditarProductosPage.tsx
│   │   ├── NuevaCategoriaPage.tsx
│   │   └── NuevoProductoPage.tsx
│   └── index.ts               # export { InicioPage, TiendaPage, ... }
│
├── components/                # Componentes compartidos
│   ├── Layout.tsx             # Fondo, nav, contenedor común
│   ├── NavPrincipal.tsx       # Barra de navegación (Inicio, Tienda, etc.)
│   ├── Notificacion.tsx
│   ├── ModalConfirmacion.tsx
│   ├── ModalUsuarios.tsx
│   ├── EditUsuarioModal.tsx
│   ├── PedidoExitoModal.tsx
│   ├── VisitasCounter.tsx
│   ├── FooterLegal.tsx
│   └── ...
│
├── Tienda/                    # Módulo Tienda (o dentro de pages/)
│   └── Tienda.tsx
│
├── Carrito/
│   └── Carrito.tsx
│
└── admin/                     # Ya existe
    ├── AdminApp.tsx
    ├── dashboard/
    ├── orders/
    ├── products/
    └── customers/
```

---

## 3. Orden recomendado (por fases)

### Fase 1 – Tipos y config (sin cambiar comportamiento)
- Crear `src/types/index.ts`: mover `Producto`, `ItemCarrito`, `Cliente`, `Usuario`, `Pedido`, `CategoriaEntrada`, `AuthForm`, `EditUsuarioForm`, etc.
- Crear `src/config/index.ts`: claves localStorage, EMAILJS, cualquier constante de negocio.
- En `App.tsx` sustituir definiciones por `import type { ... } from "./types"` e `import { ... } from "./config"`.
- Resultado: App.tsx sigue igual en lógica, pero sin ~150 líneas de tipos y constantes.

### Fase 2 – Hooks de datos
- **useCatalogo**: estado `velas`, `inciensos`, `figuras`, carga/guardado en localStorage, `getProductoByValue`, etc. App (o páginas) solo usan el hook.
- **useCategorias**: `categoriasCatalogo`, `categoriaSeleccionada`, imágenes de categoría en localStorage, normalización. Las pantallas de editar categorías consumen este hook.
- **useCarrito**: `cart`, `setCart`, `agregarAlCarrito`, funciones de precio/total que ahora están en App.
- **useNotificacion**: estado de notificación + `mostrarNotificacion`. App o layout lo usa y pasa a quien haga falta.
- Ir moviendo la lógica de App a estos hooks y reemplazar en App por llamadas a los hooks. App se va aligerando sin cambiar flujo.

### Fase 3 – Extraer páginas
- Por cada valor de `pagina` que hoy es un bloque grande en App, crear un componente en `pages/` (p. ej. `EditarCategoriasPage.tsx`).
- Esa página recibe por props lo que necesite: estado y setters que vienen de los hooks (o de App que usa los hooks).
- En App solo queda algo tipo:
  - `{ pagina === "editarCategorias" && <EditarCategoriasPage ... /> }`
- Objetivo: App.tsx con solo shell (layout, nav, cookies, modales) + un `switch`/objeto de rutas por `pagina`, sin bloques de 200–400 líneas.

### Fase 4 – Layout y navegación
- **Layout**: componente que tenga el fondo común, estructura base y el lugar donde se renderiza la página actual.
- **NavPrincipal**: extraer la barra de navegación (Inicio, Tienda, Seguimiento, Cuenta, Admin, Carrito) a un componente que reciba `pagina` y `setPagina` (o un callback `onNavigate`).
- Opcional: definir un tipo `Pagina = "inicio" | "tienda" | ...` en `types` y usarlo en todo el proyecto.

### Fase 5 (opcional) – Rutas URL
- Si más adelante quieres URLs (ej. `/tienda`, `/carrito`), se puede añadir **React Router** y que cada ruta renderice la misma página que ahora corresponde a cada `pagina`. El refactor anterior (páginas y hooks) facilita mucho este paso.

---

## 4. Cómo quedaría App.tsx (objetivo)

- Import de tipos, config, hooks y páginas.
- Uso de hooks: `useCatalogo()`, `useCategorias()`, `useCarrito()`, `useNotificacion()`, etc.
- Estado que siga siendo global por necesidad: `pagina`, `setPagina`, acceso admin, estado de pedido/búsqueda, etc. (parte de esto se puede ir moviendo a hooks en fases posteriores).
- Render:
  - Layout con nav.
  - Banner de cookies si aplica.
  - Modales (notificación, confirmación, éxito pedido, usuarios, etc.).
  - Un único bloque que según `pagina` renderice `<InicioPage />`, `<TiendaPage />`, `<EditarCategoriasPage />`, etc., pasando las props necesarias (datos de los hooks + callbacks).
- Sin bloques enormes de JSX de cada pantalla dentro de App.

---

## 5. Beneficios

- **Mantenimiento**: cada pantalla en su archivo; cada hook con una responsabilidad clara.
- **Pruebas**: se pueden probar hooks y páginas por separado.
- **Escalabilidad**: nuevas páginas = nuevo archivo en `pages/` y una línea en el switch de App.
- **Claridad**: App.tsx como “orquestador” (navegación + providers + layout), no como contenedor de toda la lógica.

---

## 6. Resumen de pasos concretos

1. Crear `src/types/index.ts` y `src/config/index.ts` y mover tipos y constantes.
2. Crear hooks (`useCatalogo`, `useCategorias`, `useCarrito`, `useNotificacion`) y mover lógica desde App.
3. Crear componentes de página en `src/pages/` (EditarCategorias, EditarProductos, NuevaCategoria, NuevoProducto, etc.) y mover el JSX desde App.
4. Extraer Layout y NavPrincipal; dejar App solo con shell + switch de páginas.
5. (Opcional) Añadir React Router cuando quieras rutas con URL.

---

## 7. Ya implementado (refactor aplicado)

- **Fase 1**: `src/types/index.ts`, `src/config/index.ts` — tipos y constantes extraídos; App importa y reexporta tipos.
- **Hooks**: `src/hooks/useNotificacion.ts`, `src/hooks/useCatalogo.ts`, `src/hooks/useCategorias.ts` — App usa estos hooks; el catálogo y las categorías se gestionan fuera del cuerpo de App.
- **Datos iniciales**: `src/data/catalogoInicial.ts` — arrays por defecto de velas, inciensos, figuras.
- **Utilidades**: `src/utils/precio.ts` — `precioSeguro`, `idSeguro`.
- **Layout y navegación**: `src/components/Layout.tsx`, `src/components/NavPrincipal.tsx` — App renderiza `<Layout>` y `<NavPrincipal>`; mismo aspecto y comportamiento.
- **App.tsx**: Sigue conteniendo el switch de páginas y el resto del estado (carrito, usuario, pedidos, etc.), pero ya no define tipos, constantes de catálogo ni la lógica de useCatalogo/useCategorias/useNotificacion. Build: OK.

Próximo paso opcional: Fase 3 (extraer cada pantalla a un componente en `src/pages/`).
