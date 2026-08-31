import { Outlet } from "react-router-dom";
import DisenoWebTabNav from "./DisenoWebTabNav";

/**
 * Layout padre con pestañas (`NavLink`) y `<Outlet />` para rutas anidadas.
 * Cuando conectes en `AppRoutes` como `element` de `path="/admin/diseno-web"`,
 * los hijos (`index`, `barra`, …) se pintan aquí sin desmontar el shell.
 *
 * Hoy el panel sigue montado en `AdminMainRoute` bajo `/admin/diseno-web/*` (una sola instancia);
 * este layout queda listo para migrar el shell sin perder estado.
 */
export default function DisenoWebLayout() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <DisenoWebTabNav />
      <Outlet />
    </div>
  );
}
