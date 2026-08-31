import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useEsAdminPermitidoEnEsteCliente } from "../utils/adminSoloEscritorio";

/** Redirige a inicio si el admin no está permitido en este dispositivo / ancho. */
export default function AdminRouteGuard({ children }: { children: ReactNode }) {
  const ok = useEsAdminPermitidoEnEsteCliente();
  if (!ok) return <Navigate to="/" replace />;
  return <>{children}</>;
}
