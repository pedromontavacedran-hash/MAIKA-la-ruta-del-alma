import { type ItemCarrito } from "./App";
import BotonCerrar from "./components/BotonCerrar";
import { THEME } from "./config";
import { CHECKOUT_CONFIG } from "./config/checkoutConfig";

interface Props {
  cart: ItemCarrito[];
  obtenerPrecioItem: (item: ItemCarrito) => number;
  cambiarCantidad: (id: number, incremento: number) => void;
  eliminarProducto: (id: number) => void;
  volver: () => void;
  vaciar: () => void;
  /** Rechazo 4xx en checkout (p. ej. stock): mismo bloqueo que el paso de pago del modal. */
  checkoutHayRechazoServidor?: boolean;
  procesandoPagoCheckout?: boolean;
}

export default function Carrito({
  cart,
  obtenerPrecioItem,
  cambiarCantidad,
  eliminarProducto,
  volver,
  vaciar,
  checkoutHayRechazoServidor = false,
  procesandoPagoCheckout = false
}: Props) {
  const UMBRAL_ENVIO_GRATIS = 50;
  const ENVIO_BASE = 4.9;
  const total = cart.reduce((sum, item) => sum + obtenerPrecioItem(item) * (Number(item.cantidad) || 0), 0);
  const faltaParaEnvioGratis = Math.max(0, UMBRAL_ENVIO_GRATIS - total);
  const envioCalculado = total >= UMBRAL_ENVIO_GRATIS ? 0 : ENVIO_BASE;
  const totalConEnvio = total + envioCalculado;
  const finalizarDeshabilitado = checkoutHayRechazoServidor || procesandoPagoCheckout || cart.length === 0;

  const generarMensajeWhatsApp = () => {
    const lineas = cart.map((item) => {
      const precio = obtenerPrecioItem(item);
      return `- ${item.nombre} — ${item.cantidad} — ${precio.toFixed(2)} €`;
    });
    const totalTexto = totalConEnvio.toFixed(2);
    return `Hola, me interesan los siguientes artículos de MAIKA · Rutas del Alma:\n\n${lineas.join("\n")}\n\nTotal estimado: ${totalTexto} €\n\n¿Podrías informarme sobre su disponibilidad?`;
  };

  if (cart.length === 0) {
    return (
      <div
        className="carrito-vista carrito-vista--con-banda-superior maika-anchor maika-page-content maika-page-content--wide"
        style={{ textAlign: "center", padding: 40 }}
      >
        <div className="carrito-vista__banda-superior" aria-hidden />
        <div className="carrito-vista__cabecera maika-page-header">
          <h2 className="maika-page-title" style={{ fontSize: "2.1rem", position: "relative", zIndex: 1 }}>🛒 Carrito vacío</h2>
          <BotonCerrar
            variante="discreto"
            onClick={volver}
            ariaLabel="Volver a tienda"
            title="Volver a tienda"
          />
        </div>
        <div className="maika-page-subheader" aria-hidden />
      </div>
    );
  }

  return (
    <div
      className="carrito-vista carrito-vista--con-banda-superior maika-anchor maika-page-content maika-page-content--wide"
      style={{ color: THEME.goldMain, margin: "0 auto", maxWidth: 1440, padding: "20px", boxSizing: "border-box", width: "100%" }}
    >
      <div className="carrito-vista__banda-superior" aria-hidden />
      <div className="carrito-vista__cabecera maika-page-header">
        <h2 className="maika-page-title" style={{ position: "relative", zIndex: 1 }}>🛒 Tu carrito</h2>
        <BotonCerrar
          variante="discreto"
          onClick={volver}
          ariaLabel="Volver a tienda"
          title="Volver a tienda"
        />
      </div>
      <div className="maika-page-subheader" aria-hidden />

      <div className="maika-page-body">
      <div className="carrito-layout__grid">
        <div className="carrito-layout__productos">
          {cart.map((item, index) => (
            <div
              key={`${item.id}-${item.cantidad}`}
              className="carrito-layout__producto-fila"
              style={{ marginBottom: index < cart.length - 1 ? 20 : 0 }}
            >
              <div className="carrito-producto-fila__cuerpo">
                <div className="carrito-producto-fila__info">
                  <strong className="carrito-producto-fila__nombre">{item.nombre}</strong>
                </div>
                <div className="carrito-producto-fila__control-precio">
                  <div className="carrito-producto-fila__qty">
                    <button
                      type="button"
                      className="carrito-producto-fila__btn-qty"
                      onClick={() => cambiarCantidad(Number(item.id), -1)}
                      aria-label="Quitar una unidad"
                    >
                      −
                    </button>
                    <span className="carrito-producto-fila__cantidad">{item.cantidad}</span>
                    <button
                      type="button"
                      className="carrito-producto-fila__btn-qty"
                      onClick={() => cambiarCantidad(Number(item.id), 1)}
                      aria-label="Añadir una unidad"
                    >
                      +
                    </button>
                  </div>
                  <span className="carrito-producto-fila__subtotal">
                    {(obtenerPrecioItem(item) * item.cantidad).toFixed(2)} €
                  </span>
                  <button
                    type="button"
                    className="maika-btn-secondary"
                    onClick={() => eliminarProducto(Number(item.id))}
                    style={{
                      padding: "6px 10px",
                      borderColor: "rgba(180, 48, 48, 0.75)",
                      color: "#ffd6d6"
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              {index < cart.length - 1 ? <div className="carrito-producto-fila__sep" aria-hidden /> : null}
            </div>
          ))}
        </div>

        <aside className="carrito-layout__resumen">
          <div className="maika-card carrito-resumen">
          <div className="carrito-resumen-envio">
            {faltaParaEnvioGratis > 0
              ? `🚚 Te faltan ${faltaParaEnvioGratis.toFixed(2)} € para envío gratis`
              : "✅ ¡Ya tienes envío gratis!"}
          </div>
          <p style={{ margin: 0, textAlign: "center", color: "white", opacity: 0.95, fontSize: 16, fontWeight: "bold" }}>
            Envío gratis a partir de 50 €
          </p>

          <div className="maika-resumen" style={{ color: "rgba(245, 230, 200, 0.95)", fontSize: 15, fontVariantNumeric: "tabular-nums" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6
              }}
            >
              <span>Subtotal</span>
              <span>{total.toFixed(2)} €</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6
              }}
            >
              <span>Envío</span>
              <span>{envioCalculado.toFixed(2)} €</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 10,
                fontWeight: "bold",
                fontSize: 16,
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                paddingTop: 10,
                color: THEME.goldMain,
                fontVariantNumeric: "tabular-nums"
              }}
            >
              <span>Total</span>
              <span>{totalConEnvio.toFixed(2)} €</span>
            </div>
          </div>

          <div className="carrito-resumen__acciones">
            <a
              href={`https://wa.me/${CHECKOUT_CONFIG.whatsappNumber}?text=${encodeURIComponent(generarMensajeWhatsApp())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="carrito-btn-principal"
              style={{
                display: "block",
                textAlign: "center",
                textDecoration: "none",
                background: "#25d366",
                border: "1px solid #25d366",
                color: "#fff",
                opacity: finalizarDeshabilitado ? 0.5 : 1,
                pointerEvents: finalizarDeshabilitado ? "none" : "auto",
                cursor: finalizarDeshabilitado ? "not-allowed" : "pointer"
              }}
            >
              💬 Enviar mi selección por WhatsApp
            </a>

            <div className="carrito-resumen__fila-botones">
              <button type="button" onClick={vaciar} className="maika-btn-secondary">
                🗑️ vaciar carrito
              </button>
            </div>
          </div>
          </div>
        </aside>
      </div>
      </div>
    </div>
  );
}
