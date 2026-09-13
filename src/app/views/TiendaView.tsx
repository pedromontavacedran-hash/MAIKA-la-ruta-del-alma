import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { CHECKOUT_CONFIG } from "@/config/checkoutConfig";
import Tienda from "../../Tienda";
import { useApp } from "../../context/AppContext";
import type { CampanaPackConfig, Producto } from "../../types";
import {
  campanaMostrarUiAhorro,
  campanaPrecioMostrado,
  campanaVentanaVigente,
  campanaVisibleEnTienda,
  getCampanaPack,
  imagenPackParaTarjeta,
  normalizarSrcImagenProducto,
  resolverLineasPack,
  subscribeCampanaPack
} from "../../utils/campanaPack";
import BotonCerrar from "../../components/BotonCerrar";
import { useOfertaCountdown } from "../../hooks/useOfertaCountdown";
import { esRutaVistaTiendaShellScroll } from "../../utils/maikaScrollPort";

type PackLegacyItem = {
  id: string;
  nombre: string;
  descripcion: string;
  masVendido?: boolean;
  productos: Array<{ producto: Producto; cantidad: number }>;
  precioEstimado: number;
  precio: number;
  precioAntes?: number;
};

/** Packs cuando la campaña admin no aplica: mismos productos que antes, presentación alineada con «Pack destacado». */
function usePacksLegacy(velas: Producto[], inciensos: Producto[], figuras: Producto[]) {
  return useMemo(() => {
    const v = Array.isArray(velas) ? velas : [];
    const i = Array.isArray(inciensos) ? inciensos : [];
    const f = Array.isArray(figuras) ? figuras : [];
    const velaBase = v[0] || null;
    const velaProteccion = v[1] || v[0] || null;
    const inciensoBase = i[0] || null;
    const figuraBase = f[0] || null;

    const out: PackLegacyItem[] = [];

    if (velaBase && inciensoBase) {
      const productos = [
        { producto: velaBase, cantidad: 1 },
        { producto: inciensoBase, cantidad: 1 }
      ];
      const precioEstimado = productos.reduce((acc, p) => acc + Number(p.producto.precio || 0) * p.cantidad, 0);
      out.push({
        id: "pack-limpieza-energetica",
        nombre: "✨ Pack Limpieza Energética",
        descripcion: "Vela + incienso para armonizar y renovar energía",
        masVendido: true,
        productos,
        precioEstimado,
        precio: 29.9,
        precioAntes: 39.9
      });
    }

    if (velaProteccion && figuraBase) {
      const productos = [
        { producto: velaProteccion, cantidad: 1 },
        { producto: figuraBase, cantidad: 1 }
      ];
      const precioEstimado = productos.reduce((acc, p) => acc + Number(p.producto.precio || 0) * p.cantidad, 0);
      out.push({
        id: "pack-proteccion",
        nombre: "🛡️ Pack Protección",
        descripcion: "Vela + figura para reforzar protección personal",
        productos,
        precioEstimado,
        precio: precioEstimado
      });
    }

    return out;
  }, [velas, inciensos, figuras]);
}

function imagenPrincipalPack(pack: PackLegacyItem): string | null {
  const img = pack.productos[0]?.producto?.imagen;
  if (!img) return null;
  if (img.startsWith("data:") || img.startsWith("http") || img.startsWith("/")) return img;
  return `/${img.replace(/^\//, "")}`;
}

export default function TiendaView() {
  const location = useLocation();
  const {
    setPagina,
    velas,
    inciensos,
    figuras,
    kits,
    joyas,
    categoriasCatalogo,
    subcategoriasCatalogo,
    cart,
    agregarAlCarrito,
    categoriaTiendaAlAbrir,
    setCategoriaTiendaAlAbrir,
    busquedaTienda,
    setBusquedaTienda,
    mostrarNotificacion,
    sincronizarCarritoAlEntrarVista,
    pedidos
  } = useApp();
  const [campana, setCampana] = useState<CampanaPackConfig>(() => getCampanaPack());
  useEffect(() => {
    return subscribeCampanaPack(() => {
      setCampana(getCampanaPack());
    });
  }, []);

  const ultimaSyncTiendaRef = useRef(0);

  /** Misma sync que al abrir `/carrito`: stock y precios del servidor antes de poder añadir con datos viejos. */
  useEffect(() => {
    if (!esRutaVistaTiendaShellScroll(location.pathname)) return;
    ultimaSyncTiendaRef.current = Date.now();
    const t = window.setTimeout(() => {
      void sincronizarCarritoAlEntrarVista();
    }, 0);
    return () => window.clearTimeout(t);
  }, [location.pathname, location.key, sincronizarCarritoAlEntrarVista]);

  /** Al volver a la pestaña en tienda, refresco si pasaron unos segundos (otro dispositivo pudo comprar). */
  useEffect(() => {
    if (!esRutaVistaTiendaShellScroll(location.pathname)) return;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const n = Date.now();
      if (n - ultimaSyncTiendaRef.current < 6000) return;
      ultimaSyncTiendaRef.current = n;
      void sincronizarCarritoAlEntrarVista();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [location.pathname, sincronizarCarritoAlEntrarVista]);

  const lineasCampana = useMemo(
    () => resolverLineasPack(campana, velas, inciensos, figuras, kits, joyas),
    [campana, velas, inciensos, figuras, kits, joyas]
  );

  const campanaActivaEnTienda = campanaVisibleEnTienda(campana, lineasCampana != null);
  const ofertaHorariaVigente = campanaVentanaVigente(campana);
  const precioPackMostrado = campanaPrecioMostrado(campana, ofertaHorariaVigente, lineasCampana);
  const mostrarUiAhorroPack = campanaMostrarUiAhorro(campana, ofertaHorariaVigente);
  const countdownCampana = useOfertaCountdown(
    campana.mostrarContador && ofertaHorariaVigente
      ? {
          inicio: campana.inicio,
          fin: campana.fin
        }
      : null
  );
  const imgTarjeta = useMemo(
    () => (lineasCampana ? imagenPackParaTarjeta(campana, lineasCampana) : ""),
    [campana, lineasCampana]
  );
  const packsLegacy = usePacksLegacy(velas, inciensos, figuras);
  const packsOrdenados = useMemo(
    () => [...packsLegacy].sort((a, b) => (b.masVendido ? 1 : 0) - (a.masVendido ? 1 : 0)),
    [packsLegacy]
  );

  const [pantallaCampanaAbierta, setPantallaCampanaAbierta] = useState(false);
  const [imagenPackAmpliada, setImagenPackAmpliada] = useState(false);
  const abrirPantallaPack = () => setPantallaCampanaAbierta(true);
  const cerrarPantallaPack = () => {
    setImagenPackAmpliada(false);
    setPantallaCampanaAbierta(false);
  };

  const anadirPackAlCarrito = (productos: Array<{ producto: Producto; cantidad: number }>) => {
    let unidadesOk = 0;
    let unidadesPedidas = 0;
    productos.forEach(({ producto, cantidad }) => {
      for (let i = 0; i < cantidad; i += 1) {
        unidadesPedidas += 1;
        if (agregarAlCarrito(producto, { silenciarNotificacion: true })) {
          unidadesOk += 1;
        }
      }
    });
    if (unidadesOk === 0) {
      mostrarNotificacion(
        "No se ha podido añadir el pack: los productos no tienen stock o están agotados.",
        "error"
      );
    } else if (unidadesOk < unidadesPedidas) {
      mostrarNotificacion(
        `Solo se han añadido ${unidadesOk} de ${unidadesPedidas} unidades del pack (stock insuficiente en algún producto).`,
        "normal"
      );
    } else {
      mostrarNotificacion(`✅ ${campana.nombre} añadido`, "exito");
    }
  };

  const anadirPackLegacyAlCarrito = (pack: PackLegacyItem) => {
    let unidadesOk = 0;
    let unidadesPedidas = 0;
    pack.productos.forEach(({ producto, cantidad }) => {
      for (let i = 0; i < cantidad; i += 1) {
        unidadesPedidas += 1;
        if (agregarAlCarrito(producto, { silenciarNotificacion: true })) {
          unidadesOk += 1;
        }
      }
    });
    if (unidadesOk === 0) {
      mostrarNotificacion(
        "No se ha podido añadir el pack: los productos no tienen stock o están agotados.",
        "error"
      );
    } else if (unidadesOk < unidadesPedidas) {
      mostrarNotificacion(
        `Solo se han añadido ${unidadesOk} de ${unidadesPedidas} unidades del pack (stock insuficiente en algún producto).`,
        "normal"
      );
    } else {
      mostrarNotificacion(`✅ ${pack.nombre} añadido al carrito`, "exito");
    }
  };

  const comprarPackWhatsApp = (nombre: string, precio: number, productos: Array<{ producto: Producto; cantidad: number }>) => {
    const lineas = productos.map((p) => `- ${p.producto.nombre} x${p.cantidad}`);
    const mensaje = [`Hola, quiero el ${nombre}:`, "", ...lineas, "", `Precio: ${precio.toFixed(2)}€`].join("\n");
    window.open(`https://wa.me/${CHECKOUT_CONFIG.whatsappNumber}?text=${encodeURIComponent(mensaje)}`, "_blank");
  };

  const hayBloquePackArriba =
    (campanaActivaEnTienda && lineasCampana != null) || packsOrdenados.length > 0;

  /** Pack destacado / packs legacy solo en el listado principal; al abrir velas, inciensos… se oculta. */
  const [vistaCategoriaInternaAbierta, setVistaCategoriaInternaAbierta] = useState(false);

  if (pantallaCampanaAbierta && campanaActivaEnTienda && lineasCampana) {
    return (
      <section className="maika-anchor tienda-page-layout tienda-pack-detalle-screen">
        <div className="tienda-pack-detalle-screen__header">
          <button
            type="button"
            className="tienda-pack-detalle-screen__volver"
            onClick={cerrarPantallaPack}
          >
            ← Volver a tienda
          </button>
        </div>

        <article className="tienda-pack-detalle-card">
          <div className="tienda-pack-detalle-card__media">
            {imgTarjeta ? (
              <button
                type="button"
                className="tienda-pack-detalle-card__imagen-btn"
                onClick={() => setImagenPackAmpliada(true)}
                aria-label="Ampliar imagen del pack"
              >
                <img
                  className="tienda-pack-detalle-card__imagen"
                  src={normalizarSrcImagenProducto(imgTarjeta)}
                  alt=""
                  width={1200}
                  height={675}
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ) : null}
          </div>

          <div className="tienda-pack-detalle-card__contenido">
            <span className="tienda-pack-detalle-card__eyebrow">Ritual seleccionado</span>
            <h1>{campana.nombre}</h1>
            {campana.subtitulo?.trim() ? <p className="tienda-pack-detalle-card__subtitulo">{campana.subtitulo}</p> : null}

            <div className="tienda-pack-detalle-card__precio">
              {mostrarUiAhorroPack && campana.precioAnterior != null ? (
                <span className="tienda-pack-detalle-card__precio-anterior">{campana.precioAnterior.toFixed(2)} €</span>
              ) : null}
              <strong>{precioPackMostrado.toFixed(2)} €</strong>
              {mostrarUiAhorroPack && campana.precioAnterior != null ? (
                <span className="tienda-pack-detalle-card__ahorro">Ahorras {(campana.precioAnterior - campana.precio).toFixed(2)} €</span>
              ) : null}
            </div>

            <div className="tienda-pack-detalle-card__texto">
              {campana.descripcionLarga}
            </div>

            {campana.textoEspiritual?.trim() ? (
              <div className="tienda-pack-detalle-card__ritual">
                {campana.textoEspiritual}
              </div>
            ) : null}

            <div className="tienda-pack-detalle-card__incluye">
              <h2>Incluye</h2>
              <ul>
                {lineasCampana.map(({ producto, cantidad }) => (
                  <li key={`${producto.id}-${cantidad}`}>
                    {producto.nombre} × {cantidad}
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              className="checkout-boton-finalizar tienda-pack-detalle-card__cta"
              onClick={() => anadirPackAlCarrito(lineasCampana)}
            >
              Reservar ahora
            </button>

            {ofertaHorariaVigente ? (
              <p className="tienda-pack-detalle-card__nota">Oferta activa · Disponible hoy</p>
            ) : null}
          </div>
        </article>

        {imagenPackAmpliada && imgTarjeta ? createPortal(
          <div
            className="tienda-pack-imagen-ampliada"
            onClick={() => setImagenPackAmpliada(false)}
            role="presentation"
          >
            <button
              type="button"
              className="tienda-pack-imagen-ampliada__cerrar"
              onClick={(e) => {
                e.stopPropagation();
                setImagenPackAmpliada(false);
              }}
              aria-label="Cerrar imagen ampliada"
            >
              ×
            </button>
            <img
              src={normalizarSrcImagenProducto(imgTarjeta)}
              alt=""
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body
        ) : null}
      </section>
    );
  }

  return (
    <>
      {!vistaCategoriaInternaAbierta && campanaActivaEnTienda && lineasCampana ? (
        <section
          className="maika-anchor tienda-page-layout tienda-pack-destacado-seccion"
          style={{
            width: "100%",
            margin: "0 auto",
            boxSizing: "border-box"
          }}
        >
          <div className="tienda-pack-destacado-inner">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                minHeight: 44,
                marginBottom: 14,
                boxSizing: "border-box"
              }}
            >
              <div style={{ width: 34, flexShrink: 0 }} aria-hidden />
              <p
                style={{
                  flex: 1,
                  color: "rgba(212, 175, 55, 0.88)",
                  margin: 0,
                  paddingTop: 2,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  textAlign: "center",
                  lineHeight: 1.4
                }}
              >
                Pack destacado
              </p>
              <BotonCerrar
                onClick={() => setPagina("inicio")}
                ariaLabel="Volver al inicio"
                title="Volver al inicio"
                style={{ position: "relative", top: "auto", right: "auto", flexShrink: 0 }}
              />
            </div>

            <article className="tienda-pack-destacado-card">
              {ofertaHorariaVigente ? (
                <div className="tienda-pack-destacado-card__oferta-badge">
                  Oferta activa
                </div>
              ) : null}
              {imgTarjeta ? (
                <button
                  type="button"
                  className="tienda-pack-destacado-card__media"
                  onClick={abrirPantallaPack}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: 0,
                    margin: 0,
                    border: "none",
                    cursor: "pointer",
                    lineHeight: 0
                  }}
                  aria-label={`Ver detalle: ${campana.nombre}`}
                >
                  <img
                    className="tienda-pack-destacado-card__imagen"
                    src={normalizarSrcImagenProducto(imgTarjeta)}
                    alt=""
                    width={1200}
                    height={675}
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ) : null}

              <div className="tienda-pack-destacado-card__cuerpo" style={{ padding: "18px 16px 18px" }}>
                <button
                  type="button"
                  onClick={abrirPantallaPack}
                  style={{
                    width: "100%",
                    padding: 0,
                    margin: 0,
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    font: "inherit",
                    color: "inherit"
                  }}
                  aria-label={`Ver detalle: ${campana.nombre}`}
                >
                  <h2 style={{ color: "#f5f0e6", fontWeight: 800, fontSize: 22, lineHeight: 1.25, margin: "0 0 10px" }}>
                    {campana.nombre}
                  </h2>
                  {campana.subtitulo?.trim() ? (
                    <p style={{ color: "rgba(255,255,255,0.68)", fontSize: 14, lineHeight: 1.45, margin: 0, fontWeight: 400 }}>
                      {campana.subtitulo}
                    </p>
                  ) : null}
                </button>

                <div
                  className="tienda-pack-destacado-card__meta-row"
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: countdownCampana ? "space-between" : "flex-start",
                    flexWrap: "wrap",
                    gap: "10px 14px"
                  }}
                >
                  {countdownCampana ? (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: "1px solid rgba(212,175,55,0.35)",
                        background: "rgba(212,175,55,0.08)",
                        color: "rgba(255,245,220,0.95)",
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0
                      }}
                    >
                      Disponible hoy
                      <span style={{ color: "#f0d78c", fontWeight: 800 }}>{countdownCampana}</span>
                    </div>
                  ) : null}
                  <div className="tienda-pack-destacado-card__fila-precio">
                    {mostrarUiAhorroPack && campana.precioAnterior != null ? (
                      <span
                        style={{
                          textDecoration: "line-through",
                          color: "rgba(255,255,255,0.16)",
                          fontSize: 11,
                          fontWeight: 400,
                          letterSpacing: "0.03em"
                        }}
                      >
                        {campana.precioAnterior.toFixed(2)} €
                      </span>
                    ) : null}
                    <span className="tienda-pack-destacado-precio">{precioPackMostrado.toFixed(2)} €</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={abrirPantallaPack}
                  className="checkout-boton-finalizar"
                  style={{
                    marginTop: 20,
                    width: "100%",
                    padding: "11px 16px",
                    borderRadius: 10,
                    border: "none",
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: "pointer",
                    background: "linear-gradient(135deg, #d4af37, #f1d27a)",
                    color: "#1b1745",
                    boxSizing: "border-box",
                    boxShadow: "0 6px 18px rgba(212, 175, 55, 0.25)"
                  }}
                >
                  {campana.textoBotonTarjeta?.trim() || "Descubrir el pack"}
                </button>
              </div>
            </article>
          </div>

        </section>
      ) : null}
      {!vistaCategoriaInternaAbierta &&
      !(campanaActivaEnTienda && lineasCampana != null) &&
      packsOrdenados.length > 0 ? (
        <section
          className="maika-anchor tienda-page-layout tienda-pack-destacado-seccion"
          style={{
            width: "100%",
            margin: "0 auto",
            boxSizing: "border-box"
          }}
        >
          <div className="tienda-pack-destacado-inner" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                minHeight: 44,
                marginBottom: 2,
                boxSizing: "border-box"
              }}
            >
              <div style={{ width: 34, flexShrink: 0 }} aria-hidden />
              <p
                style={{
                  flex: 1,
                  color: "rgba(212, 175, 55, 0.88)",
                  margin: 0,
                  paddingTop: 2,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  textAlign: "center",
                  lineHeight: 1.4
                }}
              >
                Packs que venden
              </p>
              <BotonCerrar
                onClick={() => setPagina("inicio")}
                ariaLabel="Volver al inicio"
                title="Volver al inicio"
                style={{ position: "relative", top: "auto", right: "auto", flexShrink: 0 }}
              />
            </div>

            {packsOrdenados.map((pack) => {
              const srcImagen = imagenPrincipalPack(pack);
              return (
                <article key={pack.id} className="tienda-pack-destacado-card">
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      zIndex: 2,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "#1b1745",
                      background: "linear-gradient(135deg, #d4af37, #f1d27a)",
                      boxShadow: "0 6px 16px rgba(0,0,0,0.3)"
                    }}
                  >
                    {pack.masVendido ? "Top ventas" : "Pack"}
                  </div>
                  {srcImagen ? (
                    <div className="tienda-pack-destacado-card__media">
                      <img
                        className="tienda-pack-destacado-card__imagen"
                        src={normalizarSrcImagenProducto(srcImagen)}
                        alt=""
                        width={1200}
                        height={675}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ) : null}

                  <div className="tienda-pack-destacado-card__cuerpo" style={{ padding: "16px 15px 18px" }}>
                    <h2 style={{ color: "#f5f0e6", fontWeight: 800, fontSize: 17, lineHeight: 1.25, margin: "0 0 8px" }}>
                      {pack.nombre}
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.68)", fontSize: 14, lineHeight: 1.45, margin: "0 0 16px", fontWeight: 400 }}>
                      {pack.descripcion}
                    </p>
                    <p style={{ color: "rgba(255,245,220,0.88)", fontSize: 13, lineHeight: 1.5, margin: "0 0 18px" }}>
                      <span style={{ color: "rgba(212,175,55,0.9)", fontWeight: 700 }}>Incluye: </span>
                      {pack.productos.map((p) => `${p.producto.nombre} ×${p.cantidad}`).join(" · ")}
                    </p>

                    <div className="tienda-pack-destacado-card__fila-precio" style={{ gap: "10px 16px" }}>
                      {pack.precioAntes != null && pack.precioAntes > pack.precio ? (
                        <span
                          style={{
                            textDecoration: "line-through",
                            color: "rgba(255,255,255,0.16)",
                            fontSize: 11,
                            fontWeight: 400,
                            letterSpacing: "0.03em"
                          }}
                        >
                          {pack.precioAntes.toFixed(2)} €
                        </span>
                      ) : null}
                      <span className="tienda-pack-destacado-precio">{pack.precio.toFixed(2)} €</span>
                      {pack.precioAntes != null && pack.precioAntes > pack.precio ? (
                        <span style={{ color: "#7dcea0", fontSize: 12, fontWeight: 700 }}>
                          Ahorras {(pack.precioAntes - pack.precio).toFixed(2)} €
                        </span>
                      ) : null}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => anadirPackLegacyAlCarrito(pack)}
                        className="checkout-boton-finalizar"
                        style={{
                          width: "100%",
                          padding: "14px 16px",
                          borderRadius: 10,
                          border: "none",
                          fontWeight: 700,
                          fontSize: 15,
                          cursor: "pointer",
                          background: "linear-gradient(135deg, #d4af37, #f1d27a)",
                          color: "#1b1745",
                          boxSizing: "border-box",
                          boxShadow: "0 6px 18px rgba(212, 175, 55, 0.25)"
                        }}
                      >
                        Añadir pack al carrito
                      </button>
                      <button
                        type="button"
                        onClick={() => comprarPackWhatsApp(pack.nombre, pack.precio, pack.productos)}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: 10,
                          border: "1px solid rgba(37, 211, 102, 0.45)",
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: "pointer",
                          background: "rgba(37, 211, 102, 0.12)",
                          color: "#afffd1",
                          boxSizing: "border-box"
                        }}
                      >
                        Comprar por WhatsApp
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {hayBloquePackArriba && !vistaCategoriaInternaAbierta ? (
        <p className="tienda-pack-puente-a-catalogo">También puedes explorar los más elegidos</p>
      ) : null}

      <Tienda
        velas={velas}
        inciensos={inciensos}
        figuras={figuras}
        kits={kits}
        joyas={joyas}
        categoriasCatalogo={categoriasCatalogo}
        subcategoriasCatalogo={subcategoriasCatalogo}
        cart={cart}
        agregarAlCarrito={agregarAlCarrito}
        volver={() => setPagina("inicio")}
        catalogoTrasPackHero={hayBloquePackArriba && !vistaCategoriaInternaAbierta}
        mostrarBotonCerrar={!hayBloquePackArriba || vistaCategoriaInternaAbierta}
        categoriaInicial={categoriaTiendaAlAbrir}
        onCategoriaInicialAplicada={() => setCategoriaTiendaAlAbrir(null)}
        busquedaInicial={busquedaTienda}
        onBusquedaInicialAplicada={() => setBusquedaTienda("")}
        onVistaCategoriaInternaChange={setVistaCategoriaInternaAbierta}
        pedidos={pedidos}
      />
    </>
  );
}
