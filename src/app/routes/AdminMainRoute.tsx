import { Suspense, type Dispatch, type SetStateAction } from "react";
import { createPortal } from "react-dom";
import { CuentaPage } from "../routing/lazyPages";
import GestionUsuariosPage from "../../pages/GestionUsuariosPage";
import AdminAccessPanel from "../../components/admin/AdminAccessPanel";
import AdminPanelShell from "../../components/admin/AdminPanelShell";
import AdminCampanaPackPanel from "../../components/admin/AdminCampanaPackPanel";
import { AdminLecturaPantallaPanel } from "../../components/admin/AdminLecturaPantallaPanel";
import HeroDisenoWebLogoEditorForm from "../../components/admin/HeroDisenoWebLogoEditorForm";
import DisenoWebTabNav from "./diseno-web/DisenoWebTabNav";
import BotonHero from "./diseno-web/BotonHero";
import EspaciadoHero from "./diseno-web/EspaciadoHero";
import { ADMIN_DISENO_WEB_PREFIX } from "./diseno-web/disenoWebPaths";
import AdminMetricasPanel from "../../components/admin/AdminMetricasPanel";
import FondoEstrellasDensidadPreview from "../../components/admin/FondoEstrellasDensidadPreview";
import {
  THEME,
  DESPLEGABLE_INICIO_KEY,
  SERVICIOS_INICIO_KEY,
  UMBRAL_STOCK_BAJO_KEY,
  NOTA_PEDIDO_ENVIO_KEY,
  NOTA_PEDIDO_ENVIO_DEFAULT,
  type ServicioInicio,
  type BloqueDesplegableInicio
} from "../../config";
import type { AuthForm, Usuario, Pedido, Producto, Pagina, EditUsuarioForm } from "../../types";
import type { AdminMetricsResumen } from "../../admin/hooks/useAdminMetrics";
import type { MaikaUsuarioLS } from "../../utils/maikaUsuarios";
import type { MaikaPedidoLS } from "../../utils/maikaPedidos";
import type { CuponAdminEntrada } from "./EditarCuponesAdminPanel";
import { clearAdminAuthorization, setAdminAuthorization } from "../../utils/adminAuth";
import {
  clearAdminUsuariosApiJwt,
  ensureAdminPanelJwtInSession,
  getLastAdminPanelLoginError,
  getLastAdminPanelRateLimitResetAt
} from "../../services/apiAuth";
import { notificarError, notificarExito } from "../../utils/ui/notificaciones";
import { normalizarTelefonoES9 } from "../../utils/telefono";
import { normalizarTelefonoBizum } from "../../utils/pago";
import { ALTURA_BARRA_TOP_MAX, ALTURA_BARRA_TOP_MIN, ICONOS_BARRA_ESCALA_MAX, ICONOS_BARRA_ESCALA_MIN, LOGO_POS_X_REL_MAX, LOGO_POS_X_REL_MIN, type BarraTopPedidoExitoCfg, logoTamanoDesdeAlturaBarra } from "../../utils/barraTopPedidoExito/barraTopPedidoExitoCfg";
import { FONDO_ESTRELLAS_DENSIDAD_MAX, FONDO_ESTRELLAS_DENSIDAD_MIN, FONDO_ESTRELLAS_MOVIMIENTO_MAX, FONDO_ESTRELLAS_MOVIMIENTO_MIN, guardarFondoEstrellasColor, guardarFondoEstrellasDensidad, guardarFondoEstrellasMovimiento, guardarFondoAppCapaPreset, guardarFondoPantallaOscuridad, guardarFondoPantallaTono } from "../../utils/fondoPantallaConfig";
import { HERO_BANNER_DEFAULT_SRC, HERO_BANNER_STRETCH_X_MAX, HERO_BANNER_STRETCH_X_MIN, HERO_BANNER_ZOOM_MAX, HERO_BANNER_ZOOM_MIN } from "../../utils/heroBannerConfig";
import { CHECKOUT_VISUAL_PRESETS_MAX } from "../../utils/checkoutVisualPresets";
import { urlAbsolutaPrevisualizacionHeroWeb } from "../../utils/heroWebPreviewEmbed";
import { urlAbsolutaPrevisualizacionFondoEstrellas } from "../../utils/fondoEstrellasPreviewEmbed";

import { useAdminDisenoWebEditor } from "./useAdminDisenoWebEditor";

export type AdminMainRouteProps = {
  esAdmin: boolean;
  accesoAdmin: boolean;
  modalUsuariosAbierto: boolean;
  setModalUsuariosAbierto: (v: boolean) => void;
  altaUsuarioEnGestionAbierta: boolean;
  setAltaUsuarioEnGestionAbierta: (v: boolean) => void;
  listaUsuarios: Usuario[];
  abrirRegistroAdminCuenta: () => void;
  formAuth: AuthForm;
  setFormAuth: Dispatch<SetStateAction<AuthForm>>;
  modoRegistro: "login" | "register";
  setModoRegistro: Dispatch<SetStateAction<"login" | "register">>;
  usuario: Usuario | null;
  setUsuario: (u: Usuario | null) => void;
  iniciarSesionConToken: (token: string, opts?: { mostrarBienvenida?: boolean }) => Promise<Usuario | null>;
  reenvioDisponibleEn: number;
  setReenvioDisponibleEn: Dispatch<SetStateAction<number>>;
  mostrarNotificacion: (m: string, t: "normal" | "exito" | "error") => void;
  precargarDatosClienteDesdeUsuario: (u: Usuario | null) => void;
  pedidos: Pedido[];
  handleRepetirPedido: (pedido: MaikaPedidoLS) => void;
  enviarCodigoEmail: (email: string, nombre: string, codigo: string) => Promise<boolean>;
  setPagina: (p: Pagina) => void;
  telefonoForzadoRegistroDesdeAcceso: string;
  setTelefonoForzadoRegistroDesdeAcceso: (v: string) => void;
  modoForzadoRegistroDesdeAcceso: "" | "registro" | "activar";
  setModoForzadoRegistroDesdeAcceso: (v: "" | "registro" | "activar") => void;
  confirmacionIdentidadActivacion: boolean;
  setConfirmacionIdentidadActivacion: (v: boolean) => void;
  cargarUsuarios: () => void | Promise<void>;
  abrirEditorUsuario: (u: Usuario) => void;
  abrirDetalleCliente: (u: Usuario) => void;
  setListaUsuarios: Dispatch<SetStateAction<Usuario[]>>;
  leerMaikaUsuarios: () => MaikaUsuarioLS[];
  guardarMaikaUsuarios: (u: MaikaUsuarioLS[]) => void;
  modalEditarUsuarioAbierto: boolean;
  editUsuarioForm: EditUsuarioForm;
  setEditUsuarioForm: Dispatch<SetStateAction<EditUsuarioForm>>;
  setModalEditarUsuarioAbierto: (v: boolean) => void;
  guardarEdicionUsuario: () => void | Promise<void>;
  claveAdmin: string;
  setClaveAdmin: (v: string) => void;
  setAccesoAdmin: (v: boolean) => void;
  adminUltimoLoginTexto: string;
  adminAhoraTexto: string;
  desplegableInicio: BloqueDesplegableInicio[];
  setDesplegableInicio: (v: BloqueDesplegableInicio[]) => void;
  velas: Producto[];
  inciensos: Producto[];
  figuras: Producto[];
  kits: Producto[];
  joyas: Producto[];
  serviciosInicio: ServicioInicio[];
  setServiciosInicio: (v: ServicioInicio[]) => void;
  setCuponesAdmin: Dispatch<SetStateAction<Record<string, CuponAdminEntrada>>>;
  getCuponesDisponibles: () => Record<string, CuponAdminEntrada>;
  metrics: AdminMetricsResumen;
  pedidosPendientes: Pedido[];
  pedidosEnviados: Pedido[];
  pedidosEntregados: Pedido[];
  umbralStockBajo: number;
  setUmbralStockBajo: (v: number) => void;
  notaPedidoEnvio: string;
  setNotaPedidoEnvio: (v: string) => void;
};

export function AdminMainRoute(p: AdminMainRouteProps) {
  const {
    esAdmin,
    accesoAdmin,
    modalUsuariosAbierto,
    setModalUsuariosAbierto,
    altaUsuarioEnGestionAbierta,
    setAltaUsuarioEnGestionAbierta,
    listaUsuarios,
    abrirRegistroAdminCuenta,
    formAuth,
    setFormAuth,
    modoRegistro,
    setModoRegistro,
    usuario,
    setUsuario,
    iniciarSesionConToken,
    reenvioDisponibleEn,
    setReenvioDisponibleEn,
    mostrarNotificacion,
    precargarDatosClienteDesdeUsuario,
    pedidos,
    handleRepetirPedido,
    enviarCodigoEmail,
    setPagina,
    telefonoForzadoRegistroDesdeAcceso,
    setTelefonoForzadoRegistroDesdeAcceso,
    modoForzadoRegistroDesdeAcceso,
    setModoForzadoRegistroDesdeAcceso,
    confirmacionIdentidadActivacion,
    setConfirmacionIdentidadActivacion,
    cargarUsuarios,
    abrirEditorUsuario,
    abrirDetalleCliente,
    setListaUsuarios,
    leerMaikaUsuarios,
    guardarMaikaUsuarios,
    modalEditarUsuarioAbierto,
    editUsuarioForm,
    setEditUsuarioForm,
    setModalEditarUsuarioAbierto,
    guardarEdicionUsuario,
    claveAdmin,
    setClaveAdmin,
    setAccesoAdmin,
    adminUltimoLoginTexto,
    adminAhoraTexto,
    desplegableInicio,
    setDesplegableInicio,
    velas,
    inciensos,
    figuras,
    kits,
    joyas,
    serviciosInicio,
    setServiciosInicio,
    setCuponesAdmin,
    getCuponesDisponibles,
    metrics,
    pedidosPendientes,
    pedidosEnviados,
    pedidosEntregados,
    umbralStockBajo,
    setUmbralStockBajo,
    notaPedidoEnvio,
    setNotaPedidoEnvio
  } = p;

  const {
    navigate,
    pathname,
    esVistaDisenoWebCompleta,
    esApartadoDisenoWebHero,
    mostrarBloqueHeroDisenoWeb,
    adminAccesoBloqueadoRateLimit,
    setAdminAccesoBloqueadoRateLimit,
    adminAccesoMensajeError,
    setAdminAccesoMensajeError,
    barraTopPedidoExitoCfg,
    colorFondoBarraTemporal,
    setColorFondoBarraTemporal,
    colorIconosBarraTemporal,
    setColorIconosBarraTemporal,
    alturaBarraTemporal,
    setAlturaBarraTemporal,
    iconosEscalaTemporal,
    setIconosEscalaTemporal,
    logoUrlDataPendienteBarra,
    setLogoUrlDataPendienteBarra,
    logoBarraNombreArchivoPendiente,
    setLogoBarraNombreArchivoPendiente,
    setPestanaHeroDisenoWeb,
    checkoutAccordionRefs,
    segmentoDisenoWebPantalla,
    pantallaLimpiaDisenoWebApartado,
    tabDisenoWebEfectiva,
    tituloApartadoDisenoWebHero,
    estiloWrapFocusCheckout,
    fondoPantallaNombreArchivo,
    fondoPantallaPreviewUrl,
    fondoPantallaOscuridad,
    setFondoPantallaOscuridad,
    fondoPantallaTono,
    setFondoPantallaTono,
    fondoEstrellasDensidad,
    setFondoEstrellasDensidad,
    fondoEstrellasColor,
    setFondoEstrellasColor,
    fondoEstrellasMovimiento,
    setFondoEstrellasMovimiento,
    fondoAppCapaPreset,
    setFondoAppCapaPreset,
    heroBannerNombreArchivo,
    heroBannerZoom,
    heroBannerStretchX,
    heroBannerCtaOffset,
    checkoutVisualPresetNombre,
    setCheckoutVisualPresetNombre,
    checkoutVisualPresetsLista,
    hayBaselineRestaurarTodo,
    mensajePredeterminadoRestaurar,
    heroPreviewAbierta,
    heroPreviewSesionPanelOk,
    heroPreviewIframeKey,
    fondoEstrellasPreviewAbierta,
    setFondoEstrellasPreviewAbierta,
    fondoEstrellasPreviewIframeKey,
    setFondoEstrellasPreviewIframeKey,
    inputFondoPantallaRef,
    inputHeroBannerRef,
    HERO_BANNER_UNDO_MAX,
    heroBannerPuedeDeshacer,
    inputHeroLogoRef,
    inputLogoBarraRef,
    heroLogoEdicion,
    heroLogoNombreArchivo,
    cerrarHeroPreviewGrande,
    abrirPreviewHeroFullscreen,
    cerrarFondoEstrellasPreviewGrande,
    actualizarBarraTopPedidoExitoCfg,
    actualizarBarraTopPedidoExitoCfgParcial,
    logoPosXAlmacenado,
    aplicarLogoPosXDesdeUiPorCien,
    logoPosXSliderUi,
    estiloFlechaBarraLogo,
    deshacerUltimoCambioHeroBanner,
    guardarCheckoutVisualPresetDesdePanel,
    cargarCheckoutVisualPresetDesdePanel,
    eliminarCheckoutVisualPresetDesdePanel,
    fijarPredeterminadoRestaurarTodoCheckoutVisual,
    quitarPredeterminadoPersonalizadoRestaurarTodo,
    restaurarTodoCheckoutVisualDesdePanel,
    aplicarZoomHeroBanner,
    aplicarStretchXHeroBanner,
    aplicarCtaOffsetHeroBanner,
    subirHeroBanner,
    subirHeroLogoPendiente,
    aplicarHeroLogoDesdePanel,
    persistirHeroLogoEnVivo,
    subirFondoPantalla,
    subirLogoBarraPendiente
  } = useAdminDisenoWebEditor({ esAdmin, accesoAdmin, mostrarNotificacion });

  async function intentarAccederAdmin() {
    if (adminAccesoBloqueadoRateLimit) return;
    setAdminAccesoMensajeError("");
    const ok = await ensureAdminPanelJwtInSession(claveAdmin);
    if (ok) {
      setAdminAuthorization();
      setAccesoAdmin(true);
      setClaveAdmin("");
      setAdminAccesoBloqueadoRateLimit(false);
      setAdminAccesoMensajeError("");
      return;
    }
    const error = getLastAdminPanelLoginError();
    if (error === "rate_limit") {
      setAdminAccesoBloqueadoRateLimit(true);
      const resetAt = getLastAdminPanelRateLimitResetAt();
      const segundos = resetAt ? Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)) : null;
      setAdminAccesoMensajeError(
        segundos ? `Demasiados intentos. Prueba de nuevo en ${segundos}s.` : "Demasiados intentos. Prueba de nuevo más tarde."
      );
      if (resetAt) {
        window.setTimeout(() => {
          setAdminAccesoBloqueadoRateLimit(false);
          setAdminAccesoMensajeError("");
        }, Math.max(0, resetAt - Date.now()));
      }
    } else if (error === "network") {
      setAdminAccesoMensajeError("Error de conexión. Inténtalo de nuevo.");
    } else {
      setAdminAccesoMensajeError("Clave incorrecta.");
    }
  }

  return (
    <>
    <div className="admin-layout">
      {accesoAdmin && modalUsuariosAbierto ? (
        <GestionUsuariosPage
          modalUsuariosAbierto
          listaUsuarios={listaUsuarios}
          setModalUsuariosAbierto={setModalUsuariosAbierto}
          onAbrirFormularioAltaAdmin={abrirRegistroAdminCuenta}
          panelAltaUsuario={
            altaUsuarioEnGestionAbierta ? (
              <Suspense
                fallback={(
                  <div style={{ color: THEME.goldMain, padding: 20, textAlign: "center" }}>
                    Cargando formulario…
                  </div>
                )}
              >
                <CuentaPage
                  embedPanelGestion
                  adminRegistroSinVerificacionOverride
                  onSalirEmbedPanelGestion={() => setAltaUsuarioEnGestionAbierta(false)}
                  onExitoAltaEmbedGestion={() => {
                    cargarUsuarios();
                    setAltaUsuarioEnGestionAbierta(false);
                  }}
                  formAuth={formAuth}
                  setFormAuth={setFormAuth}
                  modoRegistro={modoRegistro}
                  setModoRegistro={setModoRegistro}
                  usuario={usuario}
                  setUsuario={setUsuario}
                  iniciarSesionConToken={iniciarSesionConToken}
                  reenvioDisponibleEn={reenvioDisponibleEn}
                  setReenvioDisponibleEn={setReenvioDisponibleEn}
                  mostrarNotificacion={mostrarNotificacion}
                  precargarDatosClienteDesdeUsuario={precargarDatosClienteDesdeUsuario}
                  pedidos={pedidos}
                  onRepetirPedido={handleRepetirPedido}
                  enviarCodigoEmail={enviarCodigoEmail}
                  setPagina={setPagina}
                  telefonoForzadoRegistroDesdeAcceso={telefonoForzadoRegistroDesdeAcceso}
                  setTelefonoForzadoRegistroDesdeAcceso={setTelefonoForzadoRegistroDesdeAcceso}
                  modoForzadoRegistroDesdeAcceso={modoForzadoRegistroDesdeAcceso}
                  setModoForzadoRegistroDesdeAcceso={setModoForzadoRegistroDesdeAcceso}
                  confirmacionIdentidadActivacion={confirmacionIdentidadActivacion}
                  setConfirmacionIdentidadActivacion={setConfirmacionIdentidadActivacion}
                />
              </Suspense>
            ) : null
          }
          mostrarNotificacion={mostrarNotificacion}
          abrirEditorUsuario={abrirEditorUsuario}
          abrirDetalleCliente={abrirDetalleCliente}
          setListaUsuarios={setListaUsuarios}
          cargarUsuarios={cargarUsuarios}
          normalizarTelefonoES9={normalizarTelefonoES9}
          leerMaikaUsuarios={leerMaikaUsuarios}
          guardarMaikaUsuarios={guardarMaikaUsuarios}
          usuario={usuario}
          setUsuario={setUsuario}
          normalizarTelefonoBizum={normalizarTelefonoBizum}
          setPagina={setPagina}
          modalEditarUsuarioAbierto={modalEditarUsuarioAbierto}
          editUsuarioForm={editUsuarioForm}
          setEditUsuarioForm={setEditUsuarioForm}
          setModalEditarUsuarioAbierto={setModalEditarUsuarioAbierto}
          guardarEdicionUsuario={guardarEdicionUsuario}
        />
      ) : (
      <>
      {!pantallaLimpiaDisenoWebApartado ? <h2 className="admin-title">⚙️ PANEL ADMIN</h2> : null}
      {!accesoAdmin ? (
        <p className="admin-subtitle">
          Última sesión: {adminUltimoLoginTexto} | Ahora: {adminAhoraTexto}
        </p>
      ) : null}

      {accesoAdmin ? (
        <AdminPanelShell
          bgColor={THEME.bg}
          goldColor={THEME.goldMain}
          flatInnerFrame={pantallaLimpiaDisenoWebApartado}
          sessionMeta={
            <>
              Última sesión: {adminUltimoLoginTexto} | Ahora: {adminAhoraTexto}
            </>
          }
          onCerrar={() => {
            setModalUsuariosAbierto(false);
            clearAdminAuthorization();
            clearAdminUsuariosApiJwt();
            setAccesoAdmin(false);
            setPagina("inicio");
          }}
        >
          <div className="admin-dashboard-stack">
            <div
              className={pantallaLimpiaDisenoWebApartado ? "admin-diseno-web-full" : undefined}
              style={pantallaLimpiaDisenoWebApartado ? undefined : { display: "contents" }}
            >
              {!pantallaLimpiaDisenoWebApartado ? (
              <section className="admin-section admin-card admin-panel-bloque">
            <div className="admin-panel-categoria">
              <h3 className="admin-panel-categoria-titulo">Usuarios</h3>
              <button
                className="btn-admin-limpio admin-btn admin-btn--green"
                onClick={cargarUsuarios}
              >
                📋 GESTIÓN DE USUARIOS
              </button>
              <button
                className="btn-admin-limpio admin-btn admin-btn--purple"
                onClick={() => {
                  window.open("/horoscopos?preview=1", "maika-horoscopos-preview", "noopener,noreferrer");
                }}
                style={{ marginTop: 10 }}
              >
                🔮 NORIA HORÓSCOPOS (PREVIEW)
              </button>
              <AdminLecturaPantallaPanel />
            </div>
              </section>
              ) : null}
              <section className="admin-section admin-card admin-panel-bloque">
            <div className="admin-panel-categoria admin-panel-categoria--pedidos">
              {!pantallaLimpiaDisenoWebApartado ? (
                <>
              <h3 className="admin-panel-categoria-titulo">Pedidos</h3>
              <button
                className="btn-admin-limpio admin-btn admin-btn--blue"
                onClick={() => setPagina("seguimiento")}
              >
                🚚 SEGUIMIENTO DE PEDIDOS
              </button>
                </>
              ) : null}

              {mostrarBloqueHeroDisenoWeb ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  border: pantallaLimpiaDisenoWebApartado ? "none" : "2px solid rgba(201, 162, 74, 0.55)",
                  borderRadius: pantallaLimpiaDisenoWebApartado ? 0 : 14,
                  overflow: pantallaLimpiaDisenoWebApartado ? "visible" : "hidden",
                  background: pantallaLimpiaDisenoWebApartado ? "transparent" : "rgba(201, 162, 74, 0.07)"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderBottom: "1px solid rgba(201,162,74,0.28)",
                    background: "rgba(0,0,0,0.12)"
                  }}
                >
                  {esApartadoDisenoWebHero ? (
                    <>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                        <button
                          type="button"
                          className="btn-admin-limpio admin-btn admin-btn--gold admin-btn--inline"
                          onClick={() => navigate(ADMIN_DISENO_WEB_PREFIX, { replace: true })}
                        >
                          ← Volver a Hero diseño web
                        </button>
                        <button
                          type="button"
                          className="btn-admin-limpio admin-btn admin-btn--inline"
                          onClick={() => navigate("/admin", { replace: true })}
                          style={{ background: "rgba(0,0,0,0.38)", color: THEME.goldMain, border: "1px solid rgba(201,162,74,0.55)" }}
                        >
                          Panel admin
                        </button>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: THEME.goldMain }}>{tituloApartadoDisenoWebHero}</span>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn-admin-limpio admin-btn admin-btn--gold admin-btn--inline"
                        onClick={() => navigate("/admin", { replace: true })}
                      >
                        ← Volver al panel principal
                      </button>
                      <span style={{ fontSize: 13, fontWeight: 800, color: THEME.goldMain }}>Hero diseño web completa</span>
                    </>
                  )}
                </div>
                <div
                  className="admin-accordion-content admin-accordion-aviso-pedido"
                  style={{ padding: 14, display: "grid", gap: 12 }}
                >
                  {esVistaDisenoWebCompleta ? (
                    pathname.startsWith(ADMIN_DISENO_WEB_PREFIX) ? (
                      <DisenoWebTabNav />
                    ) : (
                      <div
                        role="tablist"
                        aria-label="Apartados hero diseño web"
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 8,
                          alignItems: "stretch",
                          justifyContent: "flex-start"
                        }}
                      >
                        {(
                          [
                            { id: "ajustes" as const, label: "Ajustes" },
                            { id: "barra" as const, label: "Barra superior" },
                            { id: "fondo" as const, label: "Fondo" },
                            { id: "hero" as const, label: "Imagen hero" },
                            { id: "heroLogo" as const, label: "Logo" },
                            { id: "boton" as const, label: "Botón" },
                            { id: "espaciado" as const, label: "Espaciado" }
                          ] as const
                        ).map((tab) => {
                          const on = tabDisenoWebEfectiva === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              role="tab"
                              aria-selected={on}
                              title={
                                tab.id === "heroLogo"
                                  ? "Abre el editor del logo (ruta dedicada)"
                                  : tab.id === "barra"
                                    ? "Barra superior (ruta dedicada)"
                                    : tab.id === "fondo"
                                      ? "Fondo (ruta dedicada)"
                                      : tab.id === "hero"
                                        ? "Imagen hero (ruta dedicada)"
                                        : tab.id === "boton"
                                          ? "Botón «Explorar tienda» (ruta dedicada)"
                                          : tab.id === "espaciado"
                                            ? "Espaciado (ruta dedicada)"
                                            : undefined
                              }
                              onClick={() => {
                                if (tab.id === "heroLogo") {
                                  void navigate(`${ADMIN_DISENO_WEB_PREFIX}/logo`);
                                  return;
                                }
                                if (tab.id === "barra") {
                                  void navigate(`${ADMIN_DISENO_WEB_PREFIX}/barra`);
                                  return;
                                }
                                if (tab.id === "fondo") {
                                  void navigate(`${ADMIN_DISENO_WEB_PREFIX}/fondo`);
                                  return;
                                }
                                if (tab.id === "hero") {
                                  void navigate(`${ADMIN_DISENO_WEB_PREFIX}/imagen`);
                                  return;
                                }
                                if (tab.id === "boton") {
                                  void navigate(`${ADMIN_DISENO_WEB_PREFIX}/boton`);
                                  return;
                                }
                                if (tab.id === "espaciado") {
                                  void navigate(`${ADMIN_DISENO_WEB_PREFIX}/espaciado`);
                                  return;
                                }
                                setPestanaHeroDisenoWeb(tab.id);
                              }}
                              className="btn-admin-limpio admin-btn admin-btn--inline"
                              style={{
                                flex: "1 1 auto",
                                minWidth: "min(100%, 120px)",
                                padding: "8px 12px",
                                borderRadius: 10,
                                border: on ? `2px solid ${THEME.goldMain}` : "1px solid rgba(201,162,74,0.45)",
                                background: on ? "rgba(201,162,74,0.22)" : "rgba(0,0,0,0.38)",
                                color: THEME.goldMain,
                                fontSize: 12,
                                fontWeight: on ? 800 : 600,
                                cursor: "pointer",
                                boxShadow: on ? "0 0 0 1px rgba(250,232,170,0.12)" : "none",
                                lineHeight: 1.25
                              }}
                            >
                              {tab.label}
                            </button>
                          );
                        })}
                      </div>
                    )
                  ) : null}
                  {segmentoDisenoWebPantalla === "" ? (
                  <div
                    style={{
                      marginBottom: 0,
                      borderRadius: 10,
                      border: "1px solid rgba(201,162,74,0.35)",
                      background: "rgba(0,0,0,0.22)",
                      overflow: "hidden"
                    }}
                  >
                  <div style={{ padding: "10px 12px", display: "grid", gap: 8 }}>
                    <h4 style={{ margin: "0 0 8px", color: THEME.goldMain, fontSize: 15, fontWeight: 800 }}>
                      Logo y colores de la barra; hero y fondo. El texto del modal de pedido realizado va fijo en código (
                      <code style={{ fontSize: 12 }}>pedidoExitoModalFijo.ts</code>).
                    </h4>
                  <div style={{ fontSize: 10, fontWeight: 700, color: THEME.goldMain, letterSpacing: "0.02em", lineHeight: 1.35 }}>
                    Presets: guarda o carga la configuración completa de los cuatro apartados (barra superior, fondo del modal, imagen hero, logo del mensaje). Máximo {CHECKOUT_VISUAL_PRESETS_MAX} presets guardados. «Restaurar todo» vuelve a tu predeterminado: la primera vez se tomó una copia de lo que ya tenías en este navegador; puedes actualizarlo con el botón de abajo o volver al genérico del código.
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <input
                      type="text"
                      value={checkoutVisualPresetNombre}
                      onChange={(e) => setCheckoutVisualPresetNombre(e.target.value)}
                      placeholder="Nombre del preset"
                      aria-label="Nombre del preset de barra, fondo, hero y logo"
                      style={{
                        flex: "1 1 160px",
                        minWidth: 120,
                        padding: "6px 8px",
                        borderRadius: 6,
                        border: `1px solid rgba(201,162,74,0.45)`,
                        background: THEME.bg,
                        color: "#fff",
                        fontSize: 11,
                        boxSizing: "border-box"
                      }}
                    />
                    <button
                      type="button"
                      onClick={guardarCheckoutVisualPresetDesdePanel}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: `1px solid ${THEME.goldMain}`,
                        background: "rgba(201,162,74,0.14)",
                        color: THEME.goldMain,
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 700
                      }}
                    >
                      Guardar preset
                    </button>
                    <button
                      type="button"
                      onClick={restaurarTodoCheckoutVisualDesdePanel}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: `1px solid ${THEME.goldMain}`,
                        background: "rgba(201,162,74,0.1)",
                        color: THEME.goldMain,
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 700
                      }}
                    >
                      Restaurar todo
                    </button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={fijarPredeterminadoRestaurarTodoCheckoutVisual}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: `1px solid rgba(160,200,255,0.45)`,
                        background: "rgba(80,120,200,0.2)",
                        color: "#c8dcff",
                        cursor: "pointer",
                        fontSize: 10,
                        fontWeight: 700
                      }}
                    >
                      Fijar panel actual como predeterminado de Restaurar
                    </button>
                    {hayBaselineRestaurarTodo ? (
                      <button
                        type="button"
                        onClick={quitarPredeterminadoPersonalizadoRestaurarTodo}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "1px solid rgba(255,255,255,0.28)",
                          background: "transparent",
                          color: "rgba(255,255,255,0.55)",
                          cursor: "pointer",
                          fontSize: 10,
                          fontWeight: 600
                        }}
                      >
                        Quitar predeterminado personalizado
                      </button>
                    ) : null}
                  </div>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.42)", lineHeight: 1.35 }}>
                    Estado:{" "}
                    {hayBaselineRestaurarTodo
                      ? "predeterminado personalizado activo (Restaurar todo ≠ código genérico)."
                      : "sin predeterminado guardado: Restaurar todo = valores genéricos del código."}
                  </span>
                  {mensajePredeterminadoRestaurar ? (
                    <div
                      role="status"
                      aria-live="polite"
                      style={{
                        marginTop: 8,
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid rgba(120, 200, 140, 0.45)",
                        background: "rgba(40, 90, 55, 0.35)",
                        color: "#c8f0d4",
                        fontSize: 11,
                        fontWeight: 600,
                        lineHeight: 1.45
                      }}
                    >
                      {mensajePredeterminadoRestaurar}
                    </div>
                  ) : null}
                  {checkoutVisualPresetsLista.length === 0 ? (
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>Ningún preset guardado aún.</span>
                  ) : (
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
                      {checkoutVisualPresetsLista.map((p) => (
                        <li
                          key={p.nombre}
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            flexWrap: "wrap",
                            justifyContent: "space-between"
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              color: "rgba(255,255,255,0.88)",
                              flex: "1 1 auto",
                              minWidth: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}
                            title={p.nombre}
                          >
                            {p.nombre}
                          </span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => cargarCheckoutVisualPresetDesdePanel(p.nombre)}
                              style={{
                                flex: "0 0 auto",
                                padding: "5px 10px",
                                borderRadius: 6,
                                border: `1px solid rgba(201,162,74,0.55)`,
                                background: "rgba(201,162,74,0.1)",
                                color: THEME.goldMain,
                                cursor: "pointer",
                                fontSize: 10,
                                fontWeight: 700
                              }}
                            >
                              Cargar
                            </button>
                            <button
                              type="button"
                              title="Borrar este preset de la lista (no afecta a la web hasta que cargues otro o cambies a mano)"
                              onClick={() => eliminarCheckoutVisualPresetDesdePanel(p.nombre)}
                              style={{
                                flex: "0 0 auto",
                                padding: "5px 10px",
                                borderRadius: 6,
                                border: "1px solid rgba(255,120,120,0.55)",
                                background: "rgba(180,40,40,0.18)",
                                color: "#ffb4b4",
                                cursor: "pointer",
                                fontSize: 10,
                                fontWeight: 700
                              }}
                            >
                              Eliminar
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  </div>
                  </div>
                  ) : null}
                  {segmentoDisenoWebPantalla === "espaciado" ? (
                    <div style={{ padding: "16px 18px 22px", display: "grid", gap: 10 }}>
                      <EspaciadoHero />
                    </div>
                  ) : null}
                  {segmentoDisenoWebPantalla === "boton" ? (
                    <div
                      style={{
                        borderRadius: 16,
                        overflow: "hidden",
                        width: "100%",
                        border: "2px solid rgba(250, 232, 170, 0.55)",
                        background: "rgba(16, 12, 30, 0.97)",
                        boxShadow: "0 12px 40px rgba(0,0,0,0.45)"
                      }}
                    >
                      <div style={{ padding: "16px 18px 22px", display: "grid", gap: 10 }}>
                        <BotonHero ctaOffset={heroBannerCtaOffset} onCtaOffsetChange={aplicarCtaOffsetHeroBanner} />
                      </div>
                    </div>
                  ) : null}
                <div className="admin-checkout-focus-wrap" style={estiloWrapFocusCheckout}>
                  {segmentoDisenoWebPantalla === "barra" ? (
                  <div
                    ref={(el) => {
                      checkoutAccordionRefs.current.barra = el;
                    }}
                    style={{
                      borderRadius: 16,
                      overflow: "hidden",
                      width: "100%",
                      border: "2px solid rgba(250, 232, 170, 0.55)",
                      background: "rgba(16, 12, 30, 0.97)",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.45)"
                    }}
                  >
                    <div style={{ padding: "16px 18px 22px", display: "grid", gap: 10 }}>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                          color: "rgba(255,255,255,0.9)",
                          fontSize: 12,
                          userSelect: "none"
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={barraTopPedidoExitoCfg.mostrarLogoBarra}
                          onChange={(e) => actualizarBarraTopPedidoExitoCfg("mostrarLogoBarra", e.target.checked)}
                        />
                        Mostrar logo
                      </label>
                      <div style={{ display: "grid", gap: 8 }}>
                        <div
                          style={{
                            color: THEME.goldMain,
                            fontSize: 12,
                            fontWeight: 800,
                            letterSpacing: "0.02em"
                          }}
                        >
                          Logo de la barra
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap", minWidth: 0 }}>
                          <span style={{ flex: "0 0 auto", color: "rgba(255,255,255,0.88)", fontSize: 11, fontWeight: 700 }}>
                            Imagen
                          </span>
                          <input
                            ref={inputLogoBarraRef}
                            type="file"
                            accept="image/*"
                            onChange={subirLogoBarraPendiente}
                            style={{ display: "none" }}
                          />
                          <button
                            type="button"
                            aria-label="Elegir imagen para el logo de la barra"
                            onClick={() => inputLogoBarraRef.current?.click()}
                            style={{
                              flex: "0 0 auto",
                              padding: "5px 12px",
                              borderRadius: 6,
                              border: `1px solid rgba(201,162,74,0.55)`,
                              background: "rgba(201,162,74,0.1)",
                              color: THEME.goldMain,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              boxShadow: "none",
                              letterSpacing: "0.01em",
                              lineHeight: 1.25
                            }}
                          >
                            Elegir imagen
                          </button>
                          <span
                            style={{
                              flex: 1,
                              minWidth: 0,
                              fontSize: 11,
                              color: "rgba(255,255,255,0.55)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}
                            title={
                              logoBarraNombreArchivoPendiente ||
                              (barraTopPedidoExitoCfg.logoUrl || "").trim() ||
                              undefined
                            }
                          >
                            {logoBarraNombreArchivoPendiente ? (
                              <span style={{ color: "rgba(201,162,74,0.95)" }}>{logoBarraNombreArchivoPendiente}</span>
                            ) : (barraTopPedidoExitoCfg.logoUrl || "").trim() ? (
                              <>{(barraTopPedidoExitoCfg.logoUrl || "").split("/").pop()}</>
                            ) : (
                              <>—</>
                            )}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap", minWidth: 0 }}>
                          <button
                            type="button"
                            aria-label="Desplazar logo a la izquierda"
                            disabled={logoPosXAlmacenado <= LOGO_POS_X_REL_MIN}
                            onClick={() => {
                              const nextUi = Math.max(0, Math.min(100, logoPosXSliderUi - 2));
                              aplicarLogoPosXDesdeUiPorCien(nextUi);
                            }}
                            style={estiloFlechaBarraLogo}
                          >
                            ◀
                          </button>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            value={logoPosXSliderUi}
                            onChange={(e) => aplicarLogoPosXDesdeUiPorCien(Number(e.target.value))}
                            aria-label="Posición horizontal del logo"
                            style={{ flex: 1, minWidth: 0, height: 20, margin: 0, padding: 0, accentColor: THEME.goldMain }}
                          />
                          <button
                            type="button"
                            aria-label="Desplazar logo a la derecha"
                            disabled={logoPosXAlmacenado >= LOGO_POS_X_REL_MAX}
                            onClick={() => {
                              const nextUi = Math.max(0, Math.min(100, logoPosXSliderUi + 2));
                              aplicarLogoPosXDesdeUiPorCien(nextUi);
                            }}
                            style={estiloFlechaBarraLogo}
                          >
                            ▶
                          </button>
                        </div>
                      </div>
                      <label style={{ display: "grid", gap: 4, color: "rgba(255,255,255,0.88)", fontSize: 11, fontWeight: 700 }}>
                        Color fondo barra
                        <input
                          type="color"
                          value={colorFondoBarraTemporal}
                          onChange={(e) => setColorFondoBarraTemporal(e.target.value)}
                          style={{ width: 44, height: 28, border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
                        />
                      </label>
                      <label style={{ display: "grid", gap: 4, color: "rgba(255,255,255,0.88)", fontSize: 11, fontWeight: 700 }}>
                        Color iconos
                        <input
                          type="color"
                          value={colorIconosBarraTemporal}
                          onChange={(e) => setColorIconosBarraTemporal(e.target.value)}
                          style={{ width: 44, height: 28, border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
                        />
                      </label>
                      <label style={{ display: "grid", gap: 6, color: "rgba(255,255,255,0.88)", fontSize: 11, fontWeight: 700 }}>
                        Tamaño iconos ({ICONOS_BARRA_ESCALA_MIN}–{ICONOS_BARRA_ESCALA_MAX}%): hamburguesa, llave, usuario, carrito y corazón
                        <input
                          type="range"
                          min={ICONOS_BARRA_ESCALA_MIN}
                          max={ICONOS_BARRA_ESCALA_MAX}
                          step={1}
                          value={iconosEscalaTemporal}
                          onChange={(e) =>
                            setIconosEscalaTemporal(
                              Math.max(
                                ICONOS_BARRA_ESCALA_MIN,
                                Math.min(ICONOS_BARRA_ESCALA_MAX, Math.round(Number(e.target.value)))
                              )
                            )
                          }
                          aria-label="Tamaño de los iconos de la barra superior"
                          style={{ width: "100%", height: 20, margin: 0, padding: 0, accentColor: THEME.goldMain }}
                        />
                        <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 9, lineHeight: 1.3 }}>
                          Actual: {iconosEscalaTemporal}% (100% = proporcional a la altura de la barra)
                        </span>
                      </label>
                      <label style={{ display: "grid", gap: 6, color: "rgba(255,255,255,0.88)", fontSize: 11, fontWeight: 700 }}>
                        Escala de la barra ({ALTURA_BARRA_TOP_MIN}–{ALTURA_BARRA_TOP_MAX}px): altura y logo proporcionales
                        <input
                          type="range"
                          min={ALTURA_BARRA_TOP_MIN}
                          max={ALTURA_BARRA_TOP_MAX}
                          step={1}
                          value={alturaBarraTemporal}
                          onChange={(e) =>
                            setAlturaBarraTemporal(
                              Math.max(
                                ALTURA_BARRA_TOP_MIN,
                                Math.min(ALTURA_BARRA_TOP_MAX, Math.round(Number(e.target.value)))
                              )
                            )
                          }
                          aria-label="Escala de la barra superior: altura, logo e iconos"
                          style={{ width: "100%", height: 20, margin: 0, padding: 0, accentColor: THEME.goldMain }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const alturaBarraSuperior = Math.max(
                            ALTURA_BARRA_TOP_MIN,
                            Math.min(ALTURA_BARRA_TOP_MAX, Math.round(alturaBarraTemporal))
                          );
                          const patch: Partial<BarraTopPedidoExitoCfg> = {
                            fondoBarraSuperior: colorFondoBarraTemporal,
                            colorIconosBarraSuperior: colorIconosBarraTemporal,
                            logoTamano: logoTamanoDesdeAlturaBarra(alturaBarraSuperior),
                            alturaBarraSuperior,
                            iconosEscalaPct: Math.max(
                              ICONOS_BARRA_ESCALA_MIN,
                              Math.min(ICONOS_BARRA_ESCALA_MAX, Math.round(iconosEscalaTemporal))
                            )
                          };
                          if (logoUrlDataPendienteBarra) {
                            patch.logoUrl = logoUrlDataPendienteBarra;
                          }
                          actualizarBarraTopPedidoExitoCfgParcial(patch);
                          setLogoUrlDataPendienteBarra(null);
                          setLogoBarraNombreArchivoPendiente("");
                          if (inputLogoBarraRef.current) inputLogoBarraRef.current.value = "";
                        }}
                        style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${THEME.goldMain}`, background: "rgba(201,162,74,0.18)", color: THEME.goldMain, cursor: "pointer", fontSize: 11, fontWeight: 700 }}
                      >
                        Aplicar cambios
                      </button>
                    </div>
                  </div>
                  ) : null}
                  {segmentoDisenoWebPantalla === "fondo" ? (
                  <div
                    ref={(el) => {
                      checkoutAccordionRefs.current.fondo = el;
                    }}
                    style={{
                      borderRadius: 16,
                      overflow: "hidden",
                      width: "100%",
                      border: "2px solid rgba(250, 232, 170, 0.55)",
                      background: "rgba(16, 12, 30, 0.97)",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.45)"
                    }}
                  >
                    <div style={{ padding: "16px 18px 22px", display: "grid", gap: 8 }}>
                      <input ref={inputFondoPantallaRef} type="file" accept="image/*" onChange={subirFondoPantalla} style={{ display: "none" }} />
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => inputFondoPantallaRef.current?.click()}
                          style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${THEME.goldMain}`, background: "linear-gradient(180deg, rgba(201,162,74,0.28), rgba(201,162,74,0.12))", color: THEME.goldMain, cursor: "pointer", fontSize: 11, fontWeight: 600 }}
                        >
                          Configurar fondo pantalla
                        </button>
                      </div>
                      <div style={{ display: "grid", gap: 6 }}>
                        <span style={{ color: "rgba(255,255,255,0.78)", fontSize: 11, fontWeight: 700 }}>
                          Capa base de toda la web
                        </span>
                        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, lineHeight: 1.35 }}>
                          Mismo degradado en todas las pantallas (debajo de estrellas y contenido). Se guarda en este navegador.
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => {
                              guardarFondoAppCapaPreset("");
                              setFondoAppCapaPreset("");
                            }}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 6,
                              border: `1px solid ${fondoAppCapaPreset === "" ? THEME.goldMain : "rgba(255,255,255,0.28)"}`,
                              background: fondoAppCapaPreset === "" ? "rgba(201,162,74,0.22)" : "rgba(255,255,255,0.06)",
                              color: THEME.goldMain,
                              cursor: "pointer",
                              fontSize: 11,
                              fontWeight: 700
                            }}
                          >
                            Cielo clásico
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              guardarFondoAppCapaPreset("maika-lila");
                              setFondoAppCapaPreset("maika-lila");
                            }}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 6,
                              border: `1px solid ${fondoAppCapaPreset === "maika-lila" ? THEME.goldMain : "rgba(255,255,255,0.28)"}`,
                              background: fondoAppCapaPreset === "maika-lila" ? "rgba(201,162,74,0.22)" : "rgba(255,255,255,0.06)",
                              color: THEME.goldMain,
                              cursor: "pointer",
                              fontSize: 11,
                              fontWeight: 700
                            }}
                          >
                            Degradado lila Maika
                          </button>
                        </div>
                      </div>
                      <div style={{ display: "grid", gap: 4 }}>
                        <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 9, letterSpacing: "0.02em" }}>
                          Vista previa cielo (densidad actual) — pulsa para pantalla completa
                        </span>
                        <button
                          type="button"
                          className="admin-btn-sutil-levita"
                          title="Ver el mismo cielo que en la web, a pantalla completa (tono, oscuridad, imagen y estrellas guardados en este navegador)"
                          aria-label="Abrir vista previa del cielo a pantalla completa"
                          onClick={() => {
                            setFondoEstrellasPreviewIframeKey((k) => k + 1);
                            setFondoEstrellasPreviewAbierta(true);
                          }}
                          style={{
                            display: "block",
                            width: "100%",
                            margin: 0,
                            padding: 0,
                            border: "none",
                            borderRadius: 8,
                            background: "transparent",
                            cursor: "zoom-in",
                            WebkitTapHighlightColor: "transparent"
                          }}
                        >
                          <FondoEstrellasDensidadPreview densidad={fondoEstrellasDensidad} color={fondoEstrellasColor} />
                        </button>
                        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 8, lineHeight: 1.3 }}>
                          Misma lógica que inicio/tienda: zona vacía y el fondo que ya tienes configurado (localStorage).
                        </div>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 11, lineHeight: 1.35 }}>
                          Estrellas 0%-100%: <strong style={{ color: THEME.goldMain }}>{fondoEstrellasDensidad}%</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = Math.max(FONDO_ESTRELLAS_DENSIDAD_MIN, fondoEstrellasDensidad - 10);
                            setFondoEstrellasDensidad(next);
                            guardarFondoEstrellasDensidad(next);
                          }}
                          disabled={fondoEstrellasDensidad <= FONDO_ESTRELLAS_DENSIDAD_MIN}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 5,
                            border: `1px solid ${THEME.goldMain}`,
                            background: "rgba(201,162,74,0.12)",
                            color: THEME.goldMain,
                            cursor: fondoEstrellasDensidad <= FONDO_ESTRELLAS_DENSIDAD_MIN ? "not-allowed" : "pointer",
                            fontSize: 10,
                            fontWeight: 700,
                            opacity: fondoEstrellasDensidad <= FONDO_ESTRELLAS_DENSIDAD_MIN ? 0.45 : 1
                          }}
                        >
                          - Est
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = Math.min(FONDO_ESTRELLAS_DENSIDAD_MAX, fondoEstrellasDensidad + 10);
                            setFondoEstrellasDensidad(next);
                            guardarFondoEstrellasDensidad(next);
                          }}
                          disabled={fondoEstrellasDensidad >= FONDO_ESTRELLAS_DENSIDAD_MAX}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 5,
                            border: `1px solid ${THEME.goldMain}`,
                            background: "linear-gradient(180deg, rgba(201,162,74,0.22), rgba(201,162,74,0.08))",
                            color: THEME.goldMain,
                            cursor: fondoEstrellasDensidad >= FONDO_ESTRELLAS_DENSIDAD_MAX ? "not-allowed" : "pointer",
                            fontSize: 10,
                            fontWeight: 700,
                            opacity: fondoEstrellasDensidad >= FONDO_ESTRELLAS_DENSIDAD_MAX ? 0.45 : 1
                          }}
                        >
                          + Est
                        </button>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 11, lineHeight: 1.35 }}>
                          Movimiento: <strong style={{ color: THEME.goldMain }}>{fondoEstrellasMovimiento}%</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = Math.max(FONDO_ESTRELLAS_MOVIMIENTO_MIN, fondoEstrellasMovimiento - 20);
                            setFondoEstrellasMovimiento(next);
                            guardarFondoEstrellasMovimiento(next);
                          }}
                          disabled={fondoEstrellasMovimiento <= FONDO_ESTRELLAS_MOVIMIENTO_MIN}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 5,
                            border: `1px solid ${THEME.goldMain}`,
                            background: "rgba(201,162,74,0.12)",
                            color: THEME.goldMain,
                            cursor: fondoEstrellasMovimiento <= FONDO_ESTRELLAS_MOVIMIENTO_MIN ? "not-allowed" : "pointer",
                            fontSize: 10,
                            fontWeight: 700,
                            opacity: fondoEstrellasMovimiento <= FONDO_ESTRELLAS_MOVIMIENTO_MIN ? 0.45 : 1
                          }}
                        >
                          - Vel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = Math.min(FONDO_ESTRELLAS_MOVIMIENTO_MAX, fondoEstrellasMovimiento + 20);
                            setFondoEstrellasMovimiento(next);
                            guardarFondoEstrellasMovimiento(next);
                          }}
                          disabled={fondoEstrellasMovimiento >= FONDO_ESTRELLAS_MOVIMIENTO_MAX}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 5,
                            border: `1px solid ${THEME.goldMain}`,
                            background: "linear-gradient(180deg, rgba(201,162,74,0.22), rgba(201,162,74,0.08))",
                            color: THEME.goldMain,
                            cursor: fondoEstrellasMovimiento >= FONDO_ESTRELLAS_MOVIMIENTO_MAX ? "not-allowed" : "pointer",
                            fontSize: 10,
                            fontWeight: 700,
                            opacity: fondoEstrellasMovimiento >= FONDO_ESTRELLAS_MOVIMIENTO_MAX ? 0.45 : 1
                          }}
                        >
                          + Vel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFondoEstrellasMovimiento(260);
                            guardarFondoEstrellasMovimiento(260);
                          }}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 5,
                            border: `1px solid ${THEME.goldMain}`,
                            background: "rgba(201,162,74,0.18)",
                            color: THEME.goldMain,
                            cursor: "pointer",
                            fontSize: 10,
                            fontWeight: 700
                          }}
                        >
                          Rapida
                        </button>
                      </div>
                      <div style={{ display: "grid", gap: 5 }}>
                        <div style={{ color: "rgba(255,255,255,0.82)", fontSize: 11 }}>Color estrellas</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4 }}>
                          {[
                            "#c9a24a",
                            "#d4af37",
                            "#e8dcc8",
                            "#ffffff",
                            "#9ecfff",
                            "#7eb6ff",
                            "#c4a8e8",
                            "#b8a8ff",
                            "#e8a0c0",
                            "#ffccaa",
                            "#7fd8be",
                            "#a8e6cf",
                            "#66ddaa",
                            "#ffd36a",
                            "#8b7355",
                            "#f0f0f0"
                          ].map((c) => (
                            <button
                              key={`estrella-color-${c}`}
                              type="button"
                              onClick={() => {
                                setFondoEstrellasColor(c);
                                guardarFondoEstrellasColor(c);
                              }}
                              title={c}
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: 4,
                                border:
                                  fondoEstrellasColor.toLowerCase() === c.toLowerCase()
                                    ? `2px solid ${THEME.goldMain}`
                                    : "1px solid rgba(255,255,255,0.28)",
                                background: c,
                                cursor: "pointer",
                                padding: 0
                              }}
                            />
                          ))}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 10 }}>{fondoEstrellasColor.toUpperCase()}</span>
                          <input
                            type="color"
                            value={fondoEstrellasColor}
                            onChange={(e) => {
                              const next = e.target.value;
                              setFondoEstrellasColor(next);
                              guardarFondoEstrellasColor(next);
                            }}
                            style={{ width: 36, height: 24, border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
                          />
                        </div>
                      </div>
                      {fondoPantallaNombreArchivo ? (
                        <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 10, lineHeight: 1.2 }}>{fondoPantallaNombreArchivo}</div>
                      ) : null}
                      <div style={{ border: "1px dashed rgba(201,162,74,0.45)", borderRadius: 8, overflow: "hidden", height: 72, background: fondoPantallaPreviewUrl ? "#0b0b0d" : "rgba(255,255,255,0.03)" }}>
                        {fondoPantallaPreviewUrl ? (
                          <img src={fondoPantallaPreviewUrl} alt="Vista previa fondo pantalla" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        ) : null}
                      </div>
                      <label style={{ color: "rgba(255,255,255,0.82)", fontSize: 11, display: "grid", gap: 4 }}>
                        Oscuridad fondo: {fondoPantallaOscuridad}%
                        <input
                          type="range"
                          min={0}
                          max={85}
                          step={1}
                          value={fondoPantallaOscuridad}
                          onChange={(e) => {
                            const next = Number(e.target.value);
                            setFondoPantallaOscuridad(next);
                            guardarFondoPantallaOscuridad(next);
                          }}
                        />
                      </label>
                      <div style={{ display: "grid", gap: 5 }}>
                        <div style={{ color: "rgba(255,255,255,0.82)", fontSize: 11 }}>Paleta color fondo</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4 }}>
                          {[
                            "#0b0b0d", "#1b1745", "#2d1f5e", "#43286e", "#5d3382", "#0f3d3e", "#145a5d", "#2a8f96",
                            "#3b1f1f", "#5a2a2a", "#7a3b3b", "#9a4d4d", "#4f401c", "#6b5424", "#8b6b2e", "#c9a24a"
                          ].map((color) => (
                            <button
                              key={`fondo-pantalla-tono-${color}`}
                              type="button"
                              onClick={() => {
                                setFondoPantallaTono(color);
                                guardarFondoPantallaTono(color);
                              }}
                              title={color}
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: 4,
                                border: fondoPantallaTono.toLowerCase() === color.toLowerCase() ? `2px solid ${THEME.goldMain}` : "1px solid rgba(255,255,255,0.28)",
                                background: color,
                                cursor: "pointer",
                                padding: 0
                              }}
                            />
                          ))}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 10 }}>{fondoPantallaTono.toUpperCase()}</span>
                          <input
                            type="color"
                            value={fondoPantallaTono}
                            onChange={(e) => {
                              const next = e.target.value;
                              setFondoPantallaTono(next);
                              guardarFondoPantallaTono(next);
                            }}
                            style={{ width: 36, height: 24, border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  ) : null}
                  {segmentoDisenoWebPantalla === "imagen" ? (
                  <div
                    ref={(el) => {
                      checkoutAccordionRefs.current.hero = el;
                    }}
                    style={{
                      borderRadius: 16,
                      overflow: "hidden",
                      width: "100%",
                      border: "2px solid rgba(250, 232, 170, 0.55)",
                      background: "rgba(16, 12, 30, 0.97)",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.45)"
                    }}
                  >
                      <div style={{ padding: "16px 18px 22px", display: "grid", gap: 8 }}>
                      <input ref={inputHeroBannerRef} type="file" accept="image/*" onChange={subirHeroBanner} style={{ display: "none" }} />
                      <p style={{ margin: 0, color: "rgba(255,255,255,0.62)", fontSize: 10, lineHeight: 1.35 }}>
                        Referencia del producto: el hero por defecto es <code style={{ color: THEME.goldMain }}>{HERO_BANNER_DEFAULT_SRC}</code>. Al subir archivo, se reescala y comprime a un perfil parecido (JPEG, lado largo y peso orientados a ese JPG) para que casi siempre quepa en el navegador.
                      </p>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => inputHeroBannerRef.current?.click()}
                          style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${THEME.goldMain}`, background: "linear-gradient(180deg, rgba(201,162,74,0.28), rgba(201,162,74,0.12))", color: THEME.goldMain, cursor: "pointer", fontSize: 11, fontWeight: 600 }}
                        >
                          Cambiar imagen hero
                        </button>
                        <button
                          type="button"
                          disabled={!heroBannerPuedeDeshacer}
                          title={
                            heroBannerPuedeDeshacer
                              ? "Vuelve a la imagen (y zoom/estirado) justo antes del último cambio de archivo. Puedes pulsar varias veces hasta 5 pasos."
                              : "Sube primero otra imagen para poder deshacer"
                          }
                          onClick={deshacerUltimoCambioHeroBanner}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            border: `1px solid ${THEME.goldMain}`,
                            background: heroBannerPuedeDeshacer ? "rgba(201,162,74,0.14)" : "rgba(60,60,60,0.35)",
                            color: heroBannerPuedeDeshacer ? THEME.goldMain : "rgba(255,255,255,0.35)",
                            cursor: heroBannerPuedeDeshacer ? "pointer" : "not-allowed",
                            fontSize: 11,
                            fontWeight: 700
                          }}
                        >
                          ↩ Deshacer último
                        </button>
                      </div>
                      <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: 9, lineHeight: 1.35 }}>
                        Cada vez que guardas una imagen nueva, puedes deshacer hasta {HERO_BANNER_UNDO_MAX} cambios seguidos (se guarda también el zoom y el estirado que tenías en ese momento).
                      </p>
                      {heroBannerNombreArchivo ? (
                        <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 10, lineHeight: 1.2 }}>{heroBannerNombreArchivo}</div>
                      ) : null}
                      <div style={{ color: "rgba(255,255,255,0.62)", fontSize: 10, lineHeight: 1.35 }}>
                        Edición directa: los cambios del hero se guardan en este navegador al mover sliders o subir imagen.
                      </div>
                      <button
                        type="button"
                        onClick={abrirPreviewHeroFullscreen}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: `1px solid ${THEME.goldMain}`,
                          background: "rgba(201,162,74,0.14)",
                          color: THEME.goldMain,
                          cursor: "pointer",
                          fontSize: 11,
                          fontWeight: 700,
                          justifySelf: "start",
                          width: "fit-content"
                        }}
                      >
                        Ver inicio — pantalla completa
                      </button>
                      <label style={{ color: "rgba(255,255,255,0.82)", fontSize: 11, display: "grid", gap: 4 }}>
                        Zoom hero: {heroBannerZoom}% (menos = más lejos, más = más cerca)
                        <input
                          type="range"
                          min={HERO_BANNER_ZOOM_MIN}
                          max={HERO_BANNER_ZOOM_MAX}
                          step={1}
                          value={heroBannerZoom}
                          onChange={(e) => aplicarZoomHeroBanner(Number(e.target.value))}
                        />
                      </label>
                      <label style={{ color: "rgba(255,255,255,0.82)", fontSize: 11, display: "grid", gap: 4 }}>
                        Estirado horizontal (solo escritorio): {heroBannerStretchX}% (100% = sin estirar; más = más ancho)
                        <input
                          type="range"
                          min={HERO_BANNER_STRETCH_X_MIN}
                          max={HERO_BANNER_STRETCH_X_MAX}
                          step={1}
                          value={heroBannerStretchX}
                          onChange={(e) => aplicarStretchXHeroBanner(Number(e.target.value))}
                        />
                      </label>
                    </div>
                  </div>
                  ) : null}
                  {segmentoDisenoWebPantalla === "logo" ? (
                  <div
                    ref={(el) => {
                      checkoutAccordionRefs.current.heroLogo = el;
                    }}
                    style={{
                      borderRadius: 16,
                      overflow: "hidden",
                      width: "100%",
                      border: "2px solid rgba(250, 232, 170, 0.55)",
                      background: "rgba(16, 12, 30, 0.97)",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.45)"
                    }}
                  >
                    <div style={{ padding: "16px 18px 22px", display: "grid", gap: 10 }}>
                      <HeroDisenoWebLogoEditorForm
                        heroLogoEdicion={heroLogoEdicion}
                        persistirHeroLogoEnVivo={persistirHeroLogoEnVivo}
                        inputHeroLogoRef={inputHeroLogoRef}
                        onChangeHeroLogoFile={subirHeroLogoPendiente}
                        heroLogoNombreArchivo={heroLogoNombreArchivo}
                        onAbrirPreviewInicio={abrirPreviewHeroFullscreen}
                        onAplicarCambios={aplicarHeroLogoDesdePanel}
                        ocultarVistaPreviaInicio={esVistaDisenoWebCompleta && !esApartadoDisenoWebHero}
                      />
                    </div>
                  </div>
                  ) : null}
                  {heroPreviewAbierta && typeof document !== "undefined"
                    ? createPortal(
                        (() => {
                          const btnCerrar = (
                            <button
                              type="button"
                              onClick={cerrarHeroPreviewGrande}
                              style={{
                                position: "fixed",
                                top: "max(8px, env(safe-area-inset-top, 0px))",
                                right: "max(8px, env(safe-area-inset-right, 0px))",
                                margin: 0,
                                padding: "6px 10px",
                                border: "none",
                                borderRadius: 0,
                                background: "transparent",
                                color: "rgba(201, 162, 74, 0.5)",
                                cursor: "pointer",
                                fontSize: 30,
                                lineHeight: 1,
                                fontWeight: 200,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 20001,
                                boxShadow: "none",
                                WebkitTapHighlightColor: "transparent"
                              }}
                              title="Cerrar vista previa (Esc)"
                              aria-label="Cerrar vista previa de inicio"
                            >
                              ×
                            </button>
                          );
                          return (
                        <div
                          role="dialog"
                          aria-modal="true"
                          aria-label="Vista previa: página de inicio real (barra superior y hero, con los ajustes del panel si caben en sesión)"
                          style={{
                            position: "fixed",
                            inset: 0,
                            width: "100vw",
                            height: "100vh",
                            maxHeight: "100dvh",
                            zIndex: 20000,
                            margin: 0,
                            padding: 0,
                            boxSizing: "border-box",
                            background: "#0b0b0d",
                            overflow: "hidden"
                          }}
                        >
                          <iframe
                            key={heroPreviewIframeKey}
                            title="Inicio — vista previa desde panel"
                            src={urlAbsolutaPrevisualizacionHeroWeb({ sesionPanel: heroPreviewSesionPanelOk })}
                            style={{
                              position: "absolute",
                              inset: 0,
                              width: "100%",
                              height: "100%",
                              border: 0,
                              display: "block"
                            }}
                          />
                          {btnCerrar}
                        </div>
                          );
                        })(),
                        document.body
                      )
                    : null}
                  {fondoEstrellasPreviewAbierta && typeof document !== "undefined"
                    ? createPortal(
                        (() => {
                          const btnCerrarFondo = (
                            <button
                              type="button"
                              onClick={cerrarFondoEstrellasPreviewGrande}
                              style={{
                                position: "fixed",
                                top: "max(8px, env(safe-area-inset-top, 0px))",
                                right: "max(8px, env(safe-area-inset-right, 0px))",
                                margin: 0,
                                padding: "6px 10px",
                                border: "none",
                                borderRadius: 0,
                                background: "transparent",
                                color: "rgba(201, 162, 74, 0.5)",
                                cursor: "pointer",
                                fontSize: 30,
                                lineHeight: 1,
                                fontWeight: 200,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 20001,
                                boxShadow: "none",
                                WebkitTapHighlightColor: "transparent"
                              }}
                              title="Cerrar vista previa (Esc)"
                              aria-label="Cerrar vista previa del cielo"
                            >
                              ×
                            </button>
                          );
                          return (
                            <div
                              role="dialog"
                              aria-modal="true"
                              aria-label="Vista previa: cielo estrellado a pantalla completa"
                              style={{
                                position: "fixed",
                                inset: 0,
                                width: "100vw",
                                height: "100vh",
                                maxHeight: "100dvh",
                                zIndex: 20000,
                                margin: 0,
                                padding: 0,
                                boxSizing: "border-box",
                                background: "#0b0b0d",
                                overflow: "hidden"
                              }}
                            >
                              <iframe
                                key={fondoEstrellasPreviewIframeKey}
                                title="Cielo — vista previa desde panel"
                                src={urlAbsolutaPrevisualizacionFondoEstrellas()}
                                style={{
                                  position: "absolute",
                                  inset: 0,
                                  width: "100%",
                                  height: "100%",
                                  border: 0,
                                  display: "block"
                                }}
                              />
                              {btnCerrarFondo}
                            </div>
                          );
                        })(),
                        document.body
                      )
                    : null}
                </div>
              </div>
              </div>
              ) : (
              <div
                style={{
                  gridColumn: "1 / -1",
                  border: "2px solid rgba(201, 162, 74, 0.55)",
                  borderRadius: 14,
                  overflow: "hidden",
                  background: "rgba(201, 162, 74, 0.07)"
                }}
              >
                <button
                  type="button"
                  className="btn-admin-limpio admin-btn admin-btn--gold admin-summary-btn admin-summary-pedido-oro"
                  style={{ width: "100%", boxSizing: "border-box", textAlign: "left" }}
                  onClick={() => navigate(ADMIN_DISENO_WEB_PREFIX, { replace: true })}
                >
                  Hero diseño web completa — abrir en vista dedicada
                </button>
                <p style={{ margin: "0 16px 16px", fontSize: 11, color: "rgba(255,255,255,0.62)", lineHeight: 1.45 }}>
                  Se abre como pantalla separada en <code style={{ fontSize: 10, opacity: 0.85 }}>/admin/diseno-web</code> dentro de la misma web.
                </p>
              </div>
              )}
            </div>
              {!pantallaLimpiaDisenoWebApartado ? (
              <section className="admin-section admin-card admin-panel-bloque">
            <div className="admin-panel-categoria">
              <h3 className="admin-panel-categoria-titulo">Tienda</h3>
              <details
                style={{
                  gridColumn: "1 / -1",
                  border: "2px solid #006064",
                  borderRadius: 14,
                  overflow: "hidden",
                  background: "rgba(0, 96, 100, 0.12)"
                }}
              >
              <summary
                className="btn-admin-limpio admin-btn admin-btn--blue admin-summary-btn"
              >
                🛒 EDICIÓN TIENDA
              </summary>
              <div className="admin-submenu">
                <button
                  className="admin-submenu-item admin-submenu-item--button"
                  onClick={() => setPagina("editarCategorias")}
                >
                  📁 Editar categorías
                </button>
                <button
                  className="admin-submenu-item admin-submenu-item--button"
                  onClick={() => setPagina("editarProductos")}
                >
                  🛠️ Edición de productos
                </button>
                <details className="admin-submenu-group">
                  <summary
                    className="admin-submenu-item"
                  >
                    📂 Desplegable de la página de inicio
                  </summary>
                  <div className="admin-accordion-content">
                    <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginBottom: 8 }}>Cada bloque es <strong style={{ color: THEME.goldMain }}>lo que tú quieras</strong>: algo novedoso, ofertas, ritual del mes, caja misteriosa… Título y subtítulo los pones tú; eliges desde qué producto empieza y cuántos mostrar. En subtítulo puedes usar <strong style={{ color: THEME.goldMain }}>{"{mes}"}</strong> y <strong style={{ color: THEME.goldMain }}>{"{año}"}</strong> para la fecha.</p>
                    <details style={{ marginBottom: 12 }}>
                      <summary style={{ color: THEME.goldMain, cursor: "pointer", fontSize: 13, fontWeight: "bold" }}>¿De dónde salen los productos? Ver orden del catálogo</summary>
                      <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 8, marginBottom: 4 }}>Los productos salen del catálogo en este orden: <strong>velas</strong> → <strong>inciensos</strong> → <strong>figuras</strong> → <strong>kits</strong> → <strong>joyería del alma</strong>. El número &quot;Desde producto&quot; es la posición (0 = el primero, 1 = el segundo…). Así sabes qué productos verá cada bloque:</p>
                      <ul style={{ margin: 0, paddingLeft: 20, color: "rgba(255,255,255,0.85)", fontSize: 12, maxHeight: 120, overflowY: "auto" }}>
                        {[...velas, ...inciensos, ...figuras, ...(kits ?? []), ...(joyas ?? [])].map((p, i) => (
                          <li key={`${p.categoria}-${p.id}`} style={{ marginBottom: 2 }}><strong style={{ color: THEME.goldMain }}>{i}</strong> – {p.nombre}</li>
                        ))}
                      </ul>
                      {[...velas, ...inciensos, ...figuras, ...(kits ?? []), ...(joyas ?? [])].length === 0 && (
                        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>No hay productos en el catálogo. Añade productos en Edición de productos / Inventario.</p>
                      )}
                    </details>
                    <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, marginBottom: 12 }}>Elige <strong style={{ color: THEME.goldMain }}>desde qué producto</strong> empieza el bloque y <strong style={{ color: THEME.goldMain }}>cuántos</strong> mostrar. Abajo ves los nombres que se verán en la página.</p>
                    {desplegableInicio.map((bloque, idx) => (
                      <div key={idx} style={{ marginBottom: 16, padding: 12, border: "1px solid rgba(201,162,74,0.5)", borderRadius: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span style={{ color: THEME.goldMain, fontWeight: "bold" }}>Bloque {idx + 1}</span>
                          {desplegableInicio.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const next = desplegableInicio.filter((_, i) => i !== idx);
                                setDesplegableInicio(next);
                                localStorage.setItem(DESPLEGABLE_INICIO_KEY, JSON.stringify(next));
                                mostrarNotificacion("Bloque eliminado", "normal");
                              }}
                              style={{ padding: "4px 10px", fontSize: 12, background: "rgba(200,80,80,0.3)", color: "#ff9999", border: "1px solid #cc6666", borderRadius: 8, cursor: "pointer" }}
                            >
                              Eliminar bloque
                            </button>
                          )}
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ display: "block", color: "rgba(255,255,255,0.9)", fontSize: 12, marginBottom: 2 }}>Título</label>
                          <input
                            type="text"
                            value={bloque.titulo}
                            onChange={(e) => {
                              const next = desplegableInicio.slice();
                              next[idx] = { ...next[idx], titulo: e.target.value };
                              setDesplegableInicio(next);
                              localStorage.setItem(DESPLEGABLE_INICIO_KEY, JSON.stringify(next));
                            }}
                            placeholder="Ej: Lo nuevo, Ofertas, Lo que quieras destacar…"
                            style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `2px solid ${THEME.goldMain}`, background: THEME.bg, color: "white", fontSize: 13, boxSizing: "border-box" }}
                          />
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ display: "block", color: "rgba(255,255,255,0.9)", fontSize: 12, marginBottom: 2 }}>Subtítulo</label>
                          <input
                            type="text"
                            value={bloque.subtitulo}
                            onChange={(e) => {
                              const next = desplegableInicio.slice();
                              next[idx] = { ...next[idx], subtitulo: e.target.value };
                              setDesplegableInicio(next);
                              localStorage.setItem(DESPLEGABLE_INICIO_KEY, JSON.stringify(next));
                            }}
                            placeholder="Ej: Lunas de {mes} {año} – Ver productos"
                            style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `2px solid ${THEME.goldMain}`, background: THEME.bg, color: "white", fontSize: 13, boxSizing: "border-box" }}
                          />
                        </div>
                        {(() => {
                          const listaCat = [...velas, ...inciensos, ...figuras, ...(kits ?? []), ...(joyas ?? [])];
                          const totalCat = listaCat.length;
                          const inicioValido = totalCat > 0 ? Math.min(bloque.inicio, totalCat - 1) : 0;
                          const mostrados = listaCat.slice(inicioValido, inicioValido + bloque.numProductos);
                          return (
                        <div>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
                          <div style={{ flex: "1 1 200px" }}>
                            <label style={{ display: "block", color: "rgba(255,255,255,0.9)", fontSize: 12, marginBottom: 2 }}>Empezar desde este producto</label>
                            <select
                              value={inicioValido}
                              onChange={(e) => {
                                const v = Math.max(0, parseInt(e.target.value, 10) || 0);
                                const next = desplegableInicio.slice();
                                next[idx] = { ...next[idx], inicio: v };
                                setDesplegableInicio(next);
                                localStorage.setItem(DESPLEGABLE_INICIO_KEY, JSON.stringify(next));
                              }}
                              style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `2px solid ${THEME.goldMain}`, background: THEME.bg, color: "white", fontSize: 13, cursor: "pointer", boxSizing: "border-box" }}
                            >
                              {listaCat.map((p, i) => (
                                <option key={`${p.categoria}-${p.id}`} value={i}>{p.nombre}</option>
                              ))}
                              {totalCat === 0 && (
                                <option value={0}>Sin productos en catálogo</option>
                              )}
                            </select>
                          </div>
                          <div>
                            <label style={{ display: "block", color: "rgba(255,255,255,0.9)", fontSize: 12, marginBottom: 2 }}>Nº productos</label>
                            <select
                              value={bloque.numProductos}
                              onChange={(e) => {
                                const v = Math.min(20, Math.max(1, parseInt(e.target.value, 10)));
                                const next = desplegableInicio.slice();
                                next[idx] = { ...next[idx], numProductos: v };
                                setDesplegableInicio(next);
                                localStorage.setItem(DESPLEGABLE_INICIO_KEY, JSON.stringify(next));
                              }}
                              style={{ padding: "8px 10px", borderRadius: 6, border: `2px solid ${THEME.goldMain}`, background: THEME.bg, color: THEME.goldMain, fontSize: 13, cursor: "pointer" }}
                            >
                              {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map((n) => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        {mostrados.length > 0 && (
                          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 4 }}>
                            En la página se verán: <strong style={{ color: THEME.goldMain }}>{mostrados.map((p) => p.nombre).join(", ")}</strong>
                          </p>
                        )}
                        </div>
                          );
                        })()}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const listaCat = [...velas, ...inciensos, ...figuras, ...(kits ?? []), ...(joyas ?? [])];
                        const totalCat = listaCat.length;
                        const ultimo = desplegableInicio[desplegableInicio.length - 1];
                        const inicioSiguiente = ultimo ? ultimo.inicio + ultimo.numProductos : 0;
                        const inicioNuevo = totalCat > 0 && inicioSiguiente < totalCat
                          ? inicioSiguiente
                          : 0;
                        const next = [...desplegableInicio, { titulo: "Nuevo bloque", subtitulo: "Ver productos", inicio: inicioNuevo, numProductos: 3 }];
                        setDesplegableInicio(next);
                        localStorage.setItem(DESPLEGABLE_INICIO_KEY, JSON.stringify(next));
                        mostrarNotificacion("Bloque añadido. Edita título y elige desde qué producto mostrar.", "normal");
                      }}
                      style={{ width: "100%", padding: "12px", marginTop: 8, background: "rgba(201,162,74,0.2)", color: THEME.goldMain, border: `2px dashed ${THEME.goldMain}`, borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: 14 }}
                    >
                      ＋ Añadir otro bloque (lo que quieras: novedades, ofertas, etc.)
                    </button>
                  </div>
                </details>
                <details className="admin-submenu-group">
                  <summary
                    className="admin-submenu-item"
                  >
                    ✨ Servicios (modificar tarjetas de la página de inicio)
                  </summary>
                  <div className="admin-accordion-content">
                    <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginBottom: 12 }}>Edita los 3 servicios que se muestran en la sección SERVICIOS de la página de inicio. La imagen es la ruta del archivo en <code style={{ color: THEME.goldMain }}>public/</code> (ej: /mi-imagen.jpg).</p>
                    {serviciosInicio.map((s, idx) => (
                      <div key={idx} style={{ marginBottom: 16, padding: 12, border: "1px solid rgba(201,162,74,0.4)", borderRadius: 10 }}>
                        <div style={{ color: THEME.goldMain, fontWeight: "bold", marginBottom: 8 }}>Servicio {idx + 1}</div>
                        <div style={{ display: "grid", gap: 8 }}>
                          <div>
                            <label style={{ display: "block", color: "rgba(255,255,255,0.9)", fontSize: 12, marginBottom: 2 }}>Título</label>
                            <input
                              type="text"
                              value={s.titulo}
                              onChange={(e) => {
                                const next = [...serviciosInicio];
                                next[idx] = { ...next[idx], titulo: e.target.value };
                                setServiciosInicio(next);
                                localStorage.setItem(SERVICIOS_INICIO_KEY, JSON.stringify(next));
                              }}
                              placeholder="Ej: 🔮 Tarot Evolutivo"
                              style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `2px solid ${THEME.goldMain}`, background: THEME.bg, color: "white", fontSize: 13, boxSizing: "border-box" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", color: "rgba(255,255,255,0.9)", fontSize: 12, marginBottom: 2 }}>Frase corta (bajo el título, opcional)</label>
                            <input
                              type="text"
                              value={s.fraseBreve ?? ""}
                              onChange={(e) => {
                                const next = [...serviciosInicio];
                                next[idx] = { ...next[idx], fraseBreve: e.target.value };
                                setServiciosInicio(next);
                                localStorage.setItem(SERVICIOS_INICIO_KEY, JSON.stringify(next));
                              }}
                              placeholder="Ej: Para entender tu momento actual"
                              style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `2px solid ${THEME.goldMain}`, background: THEME.bg, color: "white", fontSize: 13, boxSizing: "border-box" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", color: "rgba(255,255,255,0.9)", fontSize: 12, marginBottom: 2 }}>Imagen (ruta)</label>
                            <input
                              type="text"
                              value={s.imagen}
                              onChange={(e) => {
                                const next = [...serviciosInicio];
                                next[idx] = { ...next[idx], imagen: e.target.value };
                                setServiciosInicio(next);
                                localStorage.setItem(SERVICIOS_INICIO_KEY, JSON.stringify(next));
                              }}
                              placeholder="/tarot.jpg"
                              style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `2px solid ${THEME.goldMain}`, background: THEME.bg, color: "white", fontSize: 13, boxSizing: "border-box" }}
                            />
                          </div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <div style={{ flex: "1 1 120px" }}>
                              <label style={{ display: "block", color: "rgba(255,255,255,0.9)", fontSize: 12, marginBottom: 2 }}>Duración</label>
                              <input
                                type="text"
                                value={s.duracion}
                                onChange={(e) => {
                                  const next = [...serviciosInicio];
                                  next[idx] = { ...next[idx], duracion: e.target.value };
                                  setServiciosInicio(next);
                                  localStorage.setItem(SERVICIOS_INICIO_KEY, JSON.stringify(next));
                                }}
                                placeholder="Sesión 60 min"
                                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `2px solid ${THEME.goldMain}`, background: THEME.bg, color: "white", fontSize: 13, boxSizing: "border-box" }}
                              />
                            </div>
                            <div style={{ flex: "1 1 80px" }}>
                              <label style={{ display: "block", color: "rgba(255,255,255,0.9)", fontSize: 12, marginBottom: 2 }}>Precio</label>
                              <input
                                type="text"
                                value={s.precio}
                                onChange={(e) => {
                                  const next = [...serviciosInicio];
                                  next[idx] = { ...next[idx], precio: e.target.value };
                                  setServiciosInicio(next);
                                  localStorage.setItem(SERVICIOS_INICIO_KEY, JSON.stringify(next));
                                }}
                                placeholder="45€"
                                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `2px solid ${THEME.goldMain}`, background: THEME.bg, color: "white", fontSize: 13, boxSizing: "border-box" }}
                              />
                            </div>
                          </div>
                          <div>
                            <label style={{ display: "block", color: "rgba(255,255,255,0.9)", fontSize: 12, marginBottom: 2 }}>Texto del botón</label>
                            <input
                              type="text"
                              value={s.textoBoton}
                              onChange={(e) => {
                                const next = [...serviciosInicio];
                                next[idx] = { ...next[idx], textoBoton: e.target.value };
                                setServiciosInicio(next);
                                localStorage.setItem(SERVICIOS_INICIO_KEY, JSON.stringify(next));
                              }}
                              placeholder="Reservar Tarot"
                              style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `2px solid ${THEME.goldMain}`, background: THEME.bg, color: "white", fontSize: 13, boxSizing: "border-box" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", color: "rgba(255,255,255,0.9)", fontSize: 12, marginBottom: 2 }}>Enlace WhatsApp</label>
                            <input
                              type="text"
                              value={s.urlWhatsApp}
                              onChange={(e) => {
                                const next = [...serviciosInicio];
                                next[idx] = { ...next[idx], urlWhatsApp: e.target.value };
                                setServiciosInicio(next);
                                localStorage.setItem(SERVICIOS_INICIO_KEY, JSON.stringify(next));
                              }}
                              placeholder="https://wa.me/..."
                              style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `2px solid ${THEME.goldMain}`, background: THEME.bg, color: "white", fontSize: 13, boxSizing: "border-box" }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </details>

              <button
                className="btn-admin-limpio admin-btn admin-btn--green"
                onClick={() => setPagina("inventario")}
              >
                📦 INVENTARIO
              </button>
              <AdminCampanaPackPanel mostrarNotificacion={mostrarNotificacion} />
            </div>
              </section>
              ) : null}
              </section>
              {!pantallaLimpiaDisenoWebApartado ? (
              <>
              <section className="admin-section admin-card admin-panel-bloque">
            <div className="admin-panel-categoria">
              <h3 className="admin-panel-categoria-titulo">Negocio</h3>
              <button
                className="btn-admin-limpio admin-btn admin-btn--gold"
                onClick={() => {
                  setCuponesAdmin(getCuponesDisponibles());
                  setPagina("editarCupones");
                }}
              >
                🎟️ CÓDIGOS PROMOCIONALES
              </button>
              <button
                className="btn-admin-limpio admin-btn admin-btn--purple"
                onClick={() => setPagina("contabilidad")}
              >
                📅 CONTABILIDAD
              </button>
            </div>
              </section>

          <div className="admin-section admin-panel-dashboard admin-card admin-panel-bloque admin-panel-bloque--metricas">
            <h3 className="admin-panel-categoria-titulo">Métricas</h3>
            <AdminMetricasPanel
              bgColor={THEME.bg}
              goldColor={THEME.goldMain}
              ventasTotales={metrics.ventasTotales}
              pedidosTotales={metrics.pedidosTotales}
              usuariosTotales={metrics.usuariosTotales}
              stockBajo={metrics.stockBajo}
              pedidos={pedidos}
              pedidosPendientes={pedidosPendientes}
              pedidosEnviados={pedidosEnviados}
              pedidosEntregados={pedidosEntregados}
              umbralStockBajo={umbralStockBajo}
              setUmbralStockBajo={setUmbralStockBajo}
              umbralKey={UMBRAL_STOCK_BAJO_KEY}
              mostrarNotificacion={mostrarNotificacion}
              notaPedidoEnvio={notaPedidoEnvio}
              setNotaPedidoEnvio={setNotaPedidoEnvio}
              notaKey={NOTA_PEDIDO_ENVIO_KEY}
              notaDefault={NOTA_PEDIDO_ENVIO_DEFAULT}
            />
          </div>
              </>
              ) : null}
            </div>
          </div>

        </AdminPanelShell>
      ) : null}
      </>
      )}
    </div>

    </>
  );
}
