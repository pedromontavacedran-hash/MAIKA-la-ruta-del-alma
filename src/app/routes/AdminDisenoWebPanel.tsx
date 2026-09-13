import { createPortal } from "react-dom";
import HeroDisenoWebLogoEditorForm from "../../components/admin/HeroDisenoWebLogoEditorForm";
import DisenoWebTabNav from "./diseno-web/DisenoWebTabNav";
import BotonHero from "./diseno-web/BotonHero";
import EspaciadoHero from "./diseno-web/EspaciadoHero";
import { ADMIN_DISENO_WEB_PREFIX } from "./diseno-web/disenoWebPaths";
import FondoEstrellasDensidadPreview from "../../components/admin/FondoEstrellasDensidadPreview";
import { THEME } from "../../config";
import { ALTURA_BARRA_TOP_MAX, ALTURA_BARRA_TOP_MIN, ICONOS_BARRA_ESCALA_MAX, ICONOS_BARRA_ESCALA_MIN, LOGO_POS_X_REL_MAX, LOGO_POS_X_REL_MIN, type BarraTopPedidoExitoCfg, logoTamanoDesdeAlturaBarra } from "../../utils/barraTopPedidoExito/barraTopPedidoExitoCfg";
import { FONDO_ESTRELLAS_DENSIDAD_MAX, FONDO_ESTRELLAS_DENSIDAD_MIN, FONDO_ESTRELLAS_MOVIMIENTO_MAX, FONDO_ESTRELLAS_MOVIMIENTO_MIN, guardarFondoEstrellasColor, guardarFondoEstrellasDensidad, guardarFondoEstrellasMovimiento, guardarFondoAppCapaPreset, guardarFondoPantallaOscuridad, guardarFondoPantallaTono } from "../../utils/fondoPantallaConfig";
import { HERO_BANNER_DEFAULT_SRC, HERO_BANNER_STRETCH_X_MAX, HERO_BANNER_STRETCH_X_MIN, HERO_BANNER_ZOOM_MAX, HERO_BANNER_ZOOM_MIN } from "../../utils/heroBannerConfig";
import { CHECKOUT_VISUAL_PRESETS_MAX } from "../../utils/checkoutVisualPresets";
import { urlAbsolutaPrevisualizacionHeroWeb } from "../../utils/heroWebPreviewEmbed";
import { urlAbsolutaPrevisualizacionFondoEstrellas } from "../../utils/fondoEstrellasPreviewEmbed";
import type { useAdminDisenoWebEditor } from "./useAdminDisenoWebEditor";

type AdminDisenoWebPanelProps = {
  editor: ReturnType<typeof useAdminDisenoWebEditor>;
};

export function AdminDisenoWebPanel({ editor }: AdminDisenoWebPanelProps) {
  const {
    navigate,
    pathname,
    esVistaDisenoWebCompleta,
    esApartadoDisenoWebHero,
    mostrarBloqueHeroDisenoWeb,
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
  } = editor;

  return (
    <>
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
                          â† Volver a Hero diseño web
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
                        â† Volver al panel principal
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
                              <>â€”</>
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
                            â—€
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
                            â–¶
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
                        Escala de la barra ({ALTURA_BARRA_TOP_MIN}â€“{ALTURA_BARRA_TOP_MAX}px): altura y logo proporcionales
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
                          Vista previa cielo (densidad actual) â€” pulsa para pantalla completa
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
                        Ver inicio â€” pantalla completa
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
                              Ã—
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
                            title="Inicio â€” vista previa desde panel"
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
                              Ã—
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
                                title="Cielo â€” vista previa desde panel"
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
                  Hero diseño web completa â€” abrir en vista dedicada
                </button>
                <p style={{ margin: "0 16px 16px", fontSize: 11, color: "rgba(255,255,255,0.62)", lineHeight: 1.45 }}>
                  Se abre como pantalla separada en <code style={{ fontSize: 10, opacity: 0.85 }}>/admin/diseno-web</code> dentro de la misma web.
                </p>
              </div>
              )}
    </>
  );
}