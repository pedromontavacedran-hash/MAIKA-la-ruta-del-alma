import { Suspense } from "react";
import { Route } from "react-router-dom";
import type { AppRoutesProps } from "../AppRoutes";
import { CuentaPage, ResetPasswordPage } from "./lazyPages";
import { bloqueLayoutContenido } from "./routeLayouts";

type AccountRoutesProps = Pick<AppRoutesProps,
  | "formAuth" | "setFormAuth" | "modoRegistro" | "setModoRegistro" | "usuario" | "setUsuario"
  | "iniciarSesionConToken" | "reenvioDisponibleEn" | "setReenvioDisponibleEn" | "mostrarNotificacion"
  | "precargarDatosClienteDesdeUsuario" | "pedidos" | "handleRepetirPedido" | "enviarCodigoEmail"
  | "setPagina" | "telefonoForzadoRegistroDesdeAcceso" | "setTelefonoForzadoRegistroDesdeAcceso"
  | "modoForzadoRegistroDesdeAcceso" | "setModoForzadoRegistroDesdeAcceso"
  | "confirmacionIdentidadActivacion" | "setConfirmacionIdentidadActivacion"
>;

const fallback = <div style={{ opacity: 0.6, textAlign: "center", padding: 24 }}>Cargando MAIKA...</div>;

/** Rutas de cuenta aisladas de catálogo y administración. */
export function AccountRoutes(p: AccountRoutesProps) {
  return (
    <>
      <Route path="/cuenta" element={(
        <Suspense fallback={fallback}>
          {bloqueLayoutContenido(
            <CuentaPage
              formAuth={p.formAuth} setFormAuth={p.setFormAuth} modoRegistro={p.modoRegistro}
              setModoRegistro={p.setModoRegistro} usuario={p.usuario} setUsuario={p.setUsuario}
              iniciarSesionConToken={p.iniciarSesionConToken} reenvioDisponibleEn={p.reenvioDisponibleEn}
              setReenvioDisponibleEn={p.setReenvioDisponibleEn} mostrarNotificacion={p.mostrarNotificacion}
              precargarDatosClienteDesdeUsuario={p.precargarDatosClienteDesdeUsuario} pedidos={p.pedidos}
              onRepetirPedido={p.handleRepetirPedido} enviarCodigoEmail={p.enviarCodigoEmail} setPagina={p.setPagina}
              telefonoForzadoRegistroDesdeAcceso={p.telefonoForzadoRegistroDesdeAcceso}
              setTelefonoForzadoRegistroDesdeAcceso={p.setTelefonoForzadoRegistroDesdeAcceso}
              modoForzadoRegistroDesdeAcceso={p.modoForzadoRegistroDesdeAcceso}
              setModoForzadoRegistroDesdeAcceso={p.setModoForzadoRegistroDesdeAcceso}
              confirmacionIdentidadActivacion={p.confirmacionIdentidadActivacion}
              setConfirmacionIdentidadActivacion={p.setConfirmacionIdentidadActivacion}
            />
          )}
        </Suspense>
      )} />
      <Route path="/reset-password" element={<Suspense fallback={fallback}>{bloqueLayoutContenido(<ResetPasswordPage />)}</Suspense>} />
    </>
  );
}
