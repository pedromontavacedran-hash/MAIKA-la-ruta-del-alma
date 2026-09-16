import { Suspense, type Dispatch, type SetStateAction } from "react";
import { CuentaPage } from "../routing/lazyPages";
import GestionUsuariosPage from "../../pages/GestionUsuariosPage";
import AdminPanelShell from "../../components/admin/AdminPanelShell";
import AdminCampanaPackPanel from "../../components/admin/AdminCampanaPackPanel";
import AdminWebEstadoToggle from "../../components/admin/AdminWebEstadoToggle";
import { AdminLecturaPantallaPanel } from "../../components/admin/AdminLecturaPantallaPanel";
import AdminMetricasPanel from "../../components/admin/AdminMetricasPanel";
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
import { clearAdminAuthorization } from "../../utils/adminAuth";
import { clearAdminUsuariosApiJwt } from "../../services/apiAuth";

import { normalizarTelefonoES9 } from "../../utils/telefono";
import { normalizarTelefonoBizum } from "../../utils/pago";

import { useAdminDisenoWebEditor } from "./useAdminDisenoWebEditor";
import { AdminDisenoWebPanel } from "./AdminDisenoWebPanel";
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
  const disenoWebEditor = useAdminDisenoWebEditor({ esAdmin, accesoAdmin, mostrarNotificacion });
  const { pantallaLimpiaDisenoWebApartado } = disenoWebEditor;

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
              <AdminWebEstadoToggle mostrarNotificacion={mostrarNotificacion} />
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

              <AdminDisenoWebPanel editor={disenoWebEditor} />
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
              unidadesVendidas={metrics.unidadesVendidas}
              valorInventario={metrics.valorInventario}
              unidadesEnStock={metrics.unidadesEnStock}
              topProductos={metrics.topProductos}
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
