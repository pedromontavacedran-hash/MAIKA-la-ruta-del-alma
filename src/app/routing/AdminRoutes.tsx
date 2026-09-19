import { Suspense } from "react";
import { Navigate, Route } from "react-router-dom";
import AdminRouteGuard from "../../components/AdminRouteGuard";
import {
  NOTA_PEDIDO_ENVIO_DEFAULT,
  NOTA_PEDIDO_ENVIO_KEY,
  THEME,
  UMBRAL_STOCK_BAJO_KEY
} from "../../config";
import {
  AdminMainRoute,
  AdminSugerenciasPage,
  ConfigMetricasPage,
  ContabilidadPage,
  DetalleClientePage,
  EditarCategoriasPage,
  EditarCuponesAdminPanel,
  EditarProductosPage,
  InventarioPage,
  NuevaCategoriaPage,
  NuevoProductoPage
} from "./lazyPages";
import { bloqueLayoutContenido } from "./routeLayouts";
import type {
  AppRoutesAdminPack,
  AppRoutesCategoriasPack,
  AppRoutesCatalogoPack,
  AppRoutesEditarProductoPack,
  AppRoutesNuevoProductoPack,
  AppRoutesRoutingPack,
  AppRoutesSesionUsuariosPack,
  AppRoutesSitioPack
} from "./packAppRoutesProps";

export type AdminRoutesProps = AppRoutesRoutingPack &
  AppRoutesAdminPack &
  AppRoutesSesionUsuariosPack &
  AppRoutesCategoriasPack &
  AppRoutesCatalogoPack &
  AppRoutesEditarProductoPack &
  AppRoutesNuevoProductoPack &
  AppRoutesSitioPack;

const fallbackAdmin = (
  <div style={{ padding: 48, textAlign: "center", color: THEME.goldMain }}>Cargando…</div>
);

/**
 * Genera los elementos `<Route>` de administración. Es una función (no componente):
 * `<Routes>` solo admite `<Route>`/`<Fragment>` como hijos, así que se invoca como
 * `{AdminRoutes(props)}` desde `AppRoutes`. `p.mostrarNotificacion` ya llega
 * envuelta con el filtro de notificaciones admin (`p.mostrarNotificacion`).
 */
export function AdminRoutes(p: AdminRoutesProps) {
  const adminMainRouteElement = (
    <Suspense fallback={fallbackAdmin}>
      <AdminRouteGuard>
        <AdminMainRoute
        esAdmin={p.esAdmin}
        accesoAdmin={p.accesoAdmin}
        modalUsuariosAbierto={p.modalUsuariosAbierto}
        setModalUsuariosAbierto={p.setModalUsuariosAbierto}
        altaUsuarioEnGestionAbierta={p.altaUsuarioEnGestionAbierta}
        setAltaUsuarioEnGestionAbierta={p.setAltaUsuarioEnGestionAbierta}
        listaUsuarios={p.listaUsuarios}
        abrirRegistroAdminCuenta={p.abrirRegistroAdminCuenta}
        formAuth={p.formAuth}
        setFormAuth={p.setFormAuth}
        modoRegistro={p.modoRegistro}
        setModoRegistro={p.setModoRegistro}
        usuario={p.usuario}
        setUsuario={p.setUsuario}
        iniciarSesionConToken={p.iniciarSesionConToken}
        reenvioDisponibleEn={p.reenvioDisponibleEn}
        setReenvioDisponibleEn={p.setReenvioDisponibleEn}
        mostrarNotificacion={p.mostrarNotificacion}
        precargarDatosClienteDesdeUsuario={p.precargarDatosClienteDesdeUsuario}
        pedidos={p.pedidos}
        handleRepetirPedido={p.handleRepetirPedido}
        enviarCodigoEmail={p.enviarCodigoEmail}
        setPagina={p.setPagina}
        telefonoForzadoRegistroDesdeAcceso={p.telefonoForzadoRegistroDesdeAcceso}
        setTelefonoForzadoRegistroDesdeAcceso={p.setTelefonoForzadoRegistroDesdeAcceso}
        modoForzadoRegistroDesdeAcceso={p.modoForzadoRegistroDesdeAcceso}
        setModoForzadoRegistroDesdeAcceso={p.setModoForzadoRegistroDesdeAcceso}
        confirmacionIdentidadActivacion={p.confirmacionIdentidadActivacion}
        setConfirmacionIdentidadActivacion={p.setConfirmacionIdentidadActivacion}
        cargarUsuarios={p.cargarUsuarios}
        abrirEditorUsuario={p.abrirEditorUsuario}
        abrirDetalleCliente={p.abrirDetalleCliente}
        setListaUsuarios={p.setListaUsuarios}
        leerMaikaUsuarios={p.leerMaikaUsuarios}
        guardarMaikaUsuarios={p.guardarMaikaUsuarios}
        modalEditarUsuarioAbierto={p.modalEditarUsuarioAbierto}
        editUsuarioForm={p.editUsuarioForm}
        setEditUsuarioForm={p.setEditUsuarioForm}
        setModalEditarUsuarioAbierto={p.setModalEditarUsuarioAbierto}
        guardarEdicionUsuario={p.guardarEdicionUsuario}
        claveAdmin={p.claveAdmin}
        setClaveAdmin={p.setClaveAdmin}
        setAccesoAdmin={p.setAccesoAdmin}
        adminUltimoLoginTexto={p.adminUltimoLoginTexto}
        adminAhoraTexto={p.adminAhoraTexto}
        desplegableInicio={p.desplegableInicio}
        setDesplegableInicio={p.setDesplegableInicio}
        velas={p.velas}
        inciensos={p.inciensos}
        figuras={p.figuras}
        kits={p.kits}
        joyas={p.joyas}
        serviciosInicio={p.serviciosInicio}
        setServiciosInicio={p.setServiciosInicio}
        setCuponesAdmin={p.setCuponesAdmin}
        getCuponesDisponibles={p.getCuponesDisponibles}
        metrics={p.metrics}
        pedidosPendientes={p.pedidosPendientes}
        pedidosEnviados={p.pedidosEnviados}
        pedidosEntregados={p.pedidosEntregados}
        umbralStockBajo={p.umbralStockBajo}
        setUmbralStockBajo={p.setUmbralStockBajo}
        notaPedidoEnvio={p.notaPedidoEnvio}
        setNotaPedidoEnvio={p.setNotaPedidoEnvio}
      />
      </AdminRouteGuard>
    </Suspense>
  );

  return (
    <>
    <Route
      path="/admin/editar-categorias"
      element={(
        <AdminRouteGuard>
        <Suspense fallback={fallbackAdmin}>
          <EditarCategoriasPage
            setPagina={p.setPagina}
            categoriasCatalogo={p.categoriasCatalogo}
            setCategoriasCatalogo={p.setCategoriasCatalogo}
            categoriaSeleccionada={p.categoriaSeleccionada}
            setCategoriaSeleccionada={p.setCategoriaSeleccionada}
            previewCategoria={p.previewCategoria}
            setPreviewCategoria={p.setPreviewCategoria}
            nombreImagenCategoria={p.nombreImagenCategoria}
            setNombreImagenCategoria={p.setNombreImagenCategoria}
            colorCategoria={p.colorCategoria}
            setColorCategoria={p.setColorCategoria}
            tamanoCategoria={p.tamanoCategoria}
            setTamanoCategoria={p.setTamanoCategoria}
            estiloTextoCategoria={p.estiloTextoCategoria}
            setEstiloTextoCategoria={p.setEstiloTextoCategoria}
            setCategoriaARenombrar={p.setCategoriaARenombrar}
            setNuevaCategoriaNombre={p.setNuevaCategoriaNombre}
            setNuevaCategoriaImagen={p.setNuevaCategoriaImagen}
            setNuevaCategoriaNombreImagen={p.setNuevaCategoriaNombreImagen}
            setNuevaCategoriaTamano={p.setNuevaCategoriaTamano}
            setNuevaCategoriaColor={p.setNuevaCategoriaColor}
            setNuevaCategoriaEstilo={p.setNuevaCategoriaEstilo}
            mostrarNotificacion={p.mostrarNotificacion}
            velas={p.velas}
            inciensos={p.inciensos}
            figuras={p.figuras}
            kits={p.kits}
            joyas={p.joyas}
            subcategoriasCatalogo={p.subcategoriasCatalogo}
            subcategoriasDe={p.subcategoriasDe}
            agregarSubcategoria={p.agregarSubcategoria}
            renombrarSubcategoria={p.renombrarSubcategoria}
            eliminarSubcategoria={p.eliminarSubcategoria}
          />
        </Suspense>
        </AdminRouteGuard>
      )}
    />
    <Route
      path="/admin/nueva-categoria"
      element={(
        <AdminRouteGuard>
        <Suspense fallback={fallbackAdmin}>
          <NuevaCategoriaPage
            setPagina={p.setPagina}
            categoriasCatalogo={p.categoriasCatalogo}
            setCategoriasCatalogo={p.setCategoriasCatalogo}
            categoriaARenombrar={p.categoriaARenombrar}
            setCategoriaARenombrar={p.setCategoriaARenombrar}
            categoriaSeleccionada={p.categoriaSeleccionada}
            setCategoriaSeleccionada={p.setCategoriaSeleccionada}
            nuevaCategoriaNombre={p.nuevaCategoriaNombre}
            setNuevaCategoriaNombre={p.setNuevaCategoriaNombre}
            nuevaCategoriaImagen={p.nuevaCategoriaImagen}
            setNuevaCategoriaImagen={p.setNuevaCategoriaImagen}
            nuevaCategoriaNombreImagen={p.nuevaCategoriaNombreImagen}
            setNuevaCategoriaNombreImagen={p.setNuevaCategoriaNombreImagen}
            nuevaCategoriaTamano={p.nuevaCategoriaTamano}
            setNuevaCategoriaTamano={p.setNuevaCategoriaTamano}
            nuevaCategoriaColor={p.nuevaCategoriaColor}
            setNuevaCategoriaColor={p.setNuevaCategoriaColor}
            nuevaCategoriaEstilo={p.nuevaCategoriaEstilo}
            setNuevaCategoriaEstilo={p.setNuevaCategoriaEstilo}
            setPreviewCategoria={p.setPreviewCategoria}
            setNombreImagenCategoria={p.setNombreImagenCategoria}
            setTamanoCategoria={p.setTamanoCategoria}
            setColorCategoria={p.setColorCategoria}
            setEstiloTextoCategoria={p.setEstiloTextoCategoria}
            mostrarNotificacion={p.mostrarNotificacion}
          />
        </Suspense>
        </AdminRouteGuard>
      )}
    />
    <Route
      path="/admin/editar-productos"
      element={(
        <AdminRouteGuard>
        <Suspense fallback={fallbackAdmin}>
          <EditarProductosPage
            setPagina={p.setPagina}
            velas={p.velas}
            setVelas={p.setVelas}
            inciensos={p.inciensos}
            setInciensos={p.setInciensos}
            figuras={p.figuras}
            setFiguras={p.setFiguras}
            kits={p.kits}
            setKits={p.setKits}
            joyas={p.joyas}
            setJoyas={p.setJoyas}
            getProductoByValue={p.getProductoByValue}
            categoriaEditarProductos={p.categoriaEditarProductos}
            setCategoriaEditarProductos={p.setCategoriaEditarProductos}
            productoSeleccionado={p.productoSeleccionado}
            setProductoSeleccionado={p.setProductoSeleccionado}
            previewProducto={p.previewProducto}
            setPreviewProducto={p.setPreviewProducto}
            nombreImagenProducto={p.nombreImagenProducto}
            setNombreImagenProducto={p.setNombreImagenProducto}
            colorProducto={p.colorProducto}
            setColorProducto={p.setColorProducto}
            tamanoProducto={p.tamanoProducto}
            setTamanoProducto={p.setTamanoProducto}
            estiloTextoProducto={p.estiloTextoProducto}
            setEstiloTextoProducto={p.setEstiloTextoProducto}
            setCategoriaNuevoProducto={p.setCategoriaNuevoProducto}
            setNuevoProductoNombre={p.setNuevoProductoNombre}
            setNuevoProductoPrecio={p.setNuevoProductoPrecio}
            setNuevoProductoStock={p.setNuevoProductoStock}
            setNuevoProductoDescripcion={p.setNuevoProductoDescripcion}
            setNuevoProductoImagen={p.setNuevoProductoImagen}
            setNuevoProductoNombreImagen={p.setNuevoProductoNombreImagen}
            setNuevoProductoTamano={p.setNuevoProductoTamano}
            setNuevoProductoColor={p.setNuevoProductoColor}
            setNuevoProductoEstilo={p.setNuevoProductoEstilo}
            mostrarNotificacion={p.mostrarNotificacion}
            subcategoriasDe={p.subcategoriasDe}
          />
        </Suspense>
        </AdminRouteGuard>
      )}
    />
    <Route
      path="/admin/inventario"
      element={(
        <AdminRouteGuard>
        <Suspense fallback={fallbackAdmin}>
          <InventarioPage
            setPagina={p.setPagina}
            velas={p.velas}
            setVelas={p.setVelas}
            inciensos={p.inciensos}
            setInciensos={p.setInciensos}
            figuras={p.figuras}
            setFiguras={p.setFiguras}
            kits={p.kits}
            setKits={p.setKits}
            joyas={p.joyas}
            setJoyas={p.setJoyas}
            subcategoriasDe={p.subcategoriasDe}
            umbralStockBajo={p.umbralStockBajo}
            mostrarNotificacion={p.mostrarNotificacion}
          />
        </Suspense>
        </AdminRouteGuard>
      )}
    />
    <Route
      path="/admin/nuevo-producto"
      element={(
        <AdminRouteGuard>
        <Suspense fallback={fallbackAdmin}>
          <NuevoProductoPage
            setPagina={p.setPagina}
            velas={p.velas}
            setVelas={p.setVelas}
            inciensos={p.inciensos}
            setInciensos={p.setInciensos}
            figuras={p.figuras}
            setFiguras={p.setFiguras}
            setKits={p.setKits}
            setJoyas={p.setJoyas}
            categoriaNuevoProducto={p.categoriaNuevoProducto}
            setCategoriaNuevoProducto={p.setCategoriaNuevoProducto}
            nuevoProductoNombre={p.nuevoProductoNombre}
            setNuevoProductoNombre={p.setNuevoProductoNombre}
            nuevoProductoPrecio={p.nuevoProductoPrecio}
            setNuevoProductoPrecio={p.setNuevoProductoPrecio}
            nuevoProductoStock={p.nuevoProductoStock}
            setNuevoProductoStock={p.setNuevoProductoStock}
            nuevoProductoDescripcion={p.nuevoProductoDescripcion}
            setNuevoProductoDescripcion={p.setNuevoProductoDescripcion}
            nuevoProductoImagen={p.nuevoProductoImagen}
            setNuevoProductoImagen={p.setNuevoProductoImagen}
            nuevoProductoNombreImagen={p.nuevoProductoNombreImagen}
            setNuevoProductoNombreImagen={p.setNuevoProductoNombreImagen}
            nuevoProductoTamano={p.nuevoProductoTamano}
            setNuevoProductoTamano={p.setNuevoProductoTamano}
            nuevoProductoColor={p.nuevoProductoColor}
            setNuevoProductoColor={p.setNuevoProductoColor}
            nuevoProductoEstilo={p.nuevoProductoEstilo}
            setNuevoProductoEstilo={p.setNuevoProductoEstilo}
            setProductoSeleccionado={p.setProductoSeleccionado}
            setCategoriaEditarProductos={p.setCategoriaEditarProductos}
            mostrarNotificacion={p.mostrarNotificacion}
            subcategoriasDe={p.subcategoriasDe}
          />
        </Suspense>
        </AdminRouteGuard>
      )}
    />

    {/*
      Rutas /admin: las MÁS ESPECÍFICAS primero. Si existiera `/admin/*`, atraparía todo y `/admin/diseno-web/*` no llegaría.
      Aquí `/admin` es ruta exacta (sin *), no sombrea `/admin/diseno-web/...`; igual dejamos diseño web antes del índice admin.
      `espaciado` va explícito antes del `*` por compatibilidad con el `path="*"` global que redirige a `/`.
    */}
    <Route path="/admin/diseno-web/imagen-hero" element={<Navigate to="/admin/diseno-web/imagen" replace />} />
    <Route path="/admin/diseno-web/boton" element={adminMainRouteElement} />
    <Route path="/admin/diseno-web/espaciado" element={adminMainRouteElement} />
    <Route path="/admin/diseno-web/*" element={adminMainRouteElement} />
    <Route path="/admin" element={adminMainRouteElement} />
    <Route
      path="/admin/configuracion-metricas"
      element={(
        <AdminRouteGuard>
          <Suspense fallback={fallbackAdmin}>
            <ConfigMetricasPage
            setPagina={p.setPagina}
            umbralStockBajo={p.umbralStockBajo}
            setUmbralStockBajo={p.setUmbralStockBajo}
            umbralKey={UMBRAL_STOCK_BAJO_KEY}
            mostrarNotificacion={p.mostrarNotificacion}
            notaPedidoEnvio={p.notaPedidoEnvio}
            setNotaPedidoEnvio={p.setNotaPedidoEnvio}
            notaKey={NOTA_PEDIDO_ENVIO_KEY}
            notaDefault={NOTA_PEDIDO_ENVIO_DEFAULT}
          />
          </Suspense>
        </AdminRouteGuard>
      )}
    />
    {/* ADMIN: CUPONES */}
    <Route
      path="/admin/editar-cupones"
      element={
        <AdminRouteGuard>
        <Suspense fallback={fallbackAdmin}>
          <EditarCuponesAdminPanel
          cuponesAdmin={p.cuponesAdmin}
          setCuponesAdmin={p.setCuponesAdmin}
          setPagina={p.setPagina}
          mostrarNotificacion={p.mostrarNotificacion}
        />
        </Suspense>
        </AdminRouteGuard>
      }
    />

    {/* DETALLE CLIENTE (solo lectura) */}
    <Route
      path="/admin/detalle-cliente"
      element={(
        <AdminRouteGuard>
        <Suspense fallback={fallbackAdmin}>
          <DetalleClientePage
            mostrarNotificacion={p.mostrarNotificacion}
            abrirEditorUsuario={p.abrirEditorUsuario}
          />
        </Suspense>
        </AdminRouteGuard>
      )}
    />

    {/* CONTABILIDAD (admin real + compat legacy) */}
    <Route
      path="/admin/contabilidad"
      element={p.accesoAdmin ? <Suspense fallback={fallbackAdmin}>{bloqueLayoutContenido(<ContabilidadPage />)}</Suspense> : <Navigate to="/" replace />}
    />
    <Route path="/contabilidad" element={<Navigate to="/admin/contabilidad" replace />} />

    {/* SUGERENCIAS Y MEJORAS (buzón del menú público) */}
    <Route
      path="/admin/sugerencias"
      element={p.accesoAdmin ? <Suspense fallback={fallbackAdmin}>{bloqueLayoutContenido(<AdminSugerenciasPage />)}</Suspense> : <Navigate to="/" replace />}
    />
    </>
  );
}
