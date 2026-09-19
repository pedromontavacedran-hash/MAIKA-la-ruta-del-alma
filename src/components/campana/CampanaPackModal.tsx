import { useEffect, useRef, useState } from "react";
import ModalBase from "../ModalBase";
import type { CampanaPackConfig, Producto } from "../../types";
import {
  campanaMostrarUiAhorro,
  campanaPrecioMostrado,
  campanaVentanaVigente,
  normalizarSrcImagenProducto
} from "../../utils/campanaPack";

type Props = {
  abierto: boolean;
  onClose: () => void;
  campana: CampanaPackConfig;
  lineasResueltas: Array<{ producto: Producto; cantidad: number }>;
  imagenTarjeta: string;
  onAnadirCarrito: () => void;
  abrirImagenAlAbrir?: boolean;
};

export default function CampanaPackModal({
  abierto,
  onClose,
  campana,
  lineasResueltas,
  imagenTarjeta,
  onAnadirCarrito,
  abrirImagenAlAbrir = false
}: Props) {
  const [imagenAmpliadaAbierta, setImagenAmpliadaAbierta] = useState(false);
  const [ctaConfirmado, setCtaConfirmado] = useState(false);
  const ctaTimerRef = useRef<number | null>(null);
  const ofertaHorariaVigente = campanaVentanaVigente(campana);
  const precioAnt = campana.precioAnterior;
  const mostrarAhorro = campanaMostrarUiAhorro(campana, ofertaHorariaVigente);
  const precioMostrado = campanaPrecioMostrado(campana, ofertaHorariaVigente, lineasResueltas);

  useEffect(() => {
    if (!abierto) {
      setImagenAmpliadaAbierta(false);
      return;
    }
    if (abrirImagenAlAbrir && imagenTarjeta) {
      setImagenAmpliadaAbierta(true);
    }
  }, [abierto, abrirImagenAlAbrir, imagenTarjeta]);

  useEffect(() => {
    if (!abierto && !imagenAmpliadaAbierta) return;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [abierto, imagenAmpliadaAbierta]);

  useEffect(() => {
    return () => {
      if (ctaTimerRef.current != null) {
        window.clearTimeout(ctaTimerRef.current);
      }
    };
  }, []);

  const onClickCta = () => {
    setCtaConfirmado(true);
    if (ctaTimerRef.current != null) {
      window.clearTimeout(ctaTimerRef.current);
    }
    ctaTimerRef.current = window.setTimeout(() => {
      setCtaConfirmado(false);
      ctaTimerRef.current = null;
    }, 1200);
    onAnadirCarrito();
  };

  return (
    <ModalBase
      abierto={abierto}
      onClose={onClose}
      maxWidth="520px"
      classNameOverlay="modal-overlay--checkout"
      classNameCard="checkout-modal-card campana-pack-modal-card"
      ariaLabelledBy="campana-pack-modal-titulo"
    >
      <h2 id="campana-pack-modal-titulo" style={{ color: "#d4af37", fontSize: 20, margin: "0 0 8px", fontWeight: 800 }}>
        {campana.nombre}
      </h2>

      {imagenTarjeta ? (
        <div style={{ marginBottom: 16, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(212,175,55,0.25)" }}>
          <button
            type="button"
            onClick={() => setImagenAmpliadaAbierta(true)}
            aria-label="Ampliar imagen del pack"
            style={{
              display: "block",
              width: "100%",
              padding: 0,
              margin: 0,
              border: "none",
              cursor: "zoom-in",
              lineHeight: 0,
              background: "transparent"
            }}
          >
            <img
              src={normalizarSrcImagenProducto(imagenTarjeta)}
              alt=""
              className="campana-pack-modal-image"
              style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block" }}
            />
          </button>
        </div>
      ) : null}

      <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
        {mostrarAhorro ? (
          <>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>Antes</span>
            <span style={{ textDecoration: "line-through", color: "rgba(255,255,255,0.45)", fontSize: 18, fontWeight: 600 }}>{precioAnt!.toFixed(2)} €</span>
          </>
        ) : null}
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{mostrarAhorro ? "Ahora" : "Precio"}</span>
        <span style={{ color: "#d4af37", fontWeight: 800, fontSize: 26 }}>{precioMostrado.toFixed(2)} €</span>
        {mostrarAhorro && precioAnt != null ? (
          <span style={{ color: "#52c41a", fontSize: 14, fontWeight: 600 }}>Ahorras {(precioAnt - campana.precio).toFixed(2)} €</span>
        ) : null}
      </div>

      <div className="campana-pack-modal-body">
        <p style={{ color: "rgba(255,255,255,0.82)", fontSize: 14, margin: "0 0 12px", lineHeight: 1.45 }}>{campana.subtitulo}</p>

        <div
          className="campana-pack-modal-descripcion"
          style={{
            marginBottom: 14,
            padding: 14,
            borderRadius: 12,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.9)",
            fontSize: 14,
            lineHeight: 1.55,
            whiteSpace: "pre-wrap"
          }}
        >
          {campana.descripcionLarga}
        </div>

        {campana.textoEspiritual?.trim() ? (
          <div
            className="campana-pack-modal-espiritual"
            style={{
              marginBottom: 14,
              padding: 14,
              borderRadius: 12,
              background: "rgba(212, 175, 55, 0.08)",
              border: "1px solid rgba(212, 175, 55, 0.22)",
              color: "rgba(255, 245, 220, 0.95)",
              fontSize: 14,
              lineHeight: 1.55,
              fontStyle: "italic",
              whiteSpace: "pre-wrap"
            }}
          >
            {campana.textoEspiritual}
          </div>
        ) : null}

        <div style={{ marginBottom: 10, color: "#d4af37", fontWeight: 700, fontSize: 14 }}>Incluye</div>
        <ul style={{ margin: "0 0 12px", paddingLeft: 20, color: "rgba(255,255,255,0.88)", fontSize: 14, lineHeight: 1.6 }}>
          {lineasResueltas.map(({ producto, cantidad }) => (
            <li key={`${producto.id}-${cantidad}`}>
              {producto.nombre} × {cantidad}
            </li>
          ))}
        </ul>
      </div>

      <div
        className="checkout-modal-footer-block"
        style={{
          marginTop: 4,
          paddingTop: 12,
          paddingBottom: 6,
          width: "100%",
          boxSizing: "border-box"
        }}
      >
        <button
          type="button"
          className="checkout-boton-finalizar"
          onClick={onClickCta}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            fontWeight: 800,
            fontSize: 16,
            background: ctaConfirmado ? "linear-gradient(135deg, #6cc04a, #8be36c)" : "linear-gradient(135deg, #d4af37, #f1d27a)",
            color: "#1b1745",
            boxShadow: ctaConfirmado ? "0 10px 24px rgba(108, 192, 74, 0.35)" : "0 10px 24px rgba(212, 175, 55, 0.35)",
            letterSpacing: "0.01em",
            boxSizing: "border-box"
          }}
        >
          {ctaConfirmado ? "Añadido ✔" : "Reservar ahora"}
        </button>
        {ofertaHorariaVigente ? (
          <p
            style={{
              margin: "8px 0 0",
              textAlign: "center",
              fontSize: 12,
              color: "rgba(255,245,220,0.86)",
              fontWeight: 600,
              letterSpacing: "0.02em"
            }}
          >
            Oferta activa · Disponible hoy
          </p>
        ) : null}
      </div>

      {imagenAmpliadaAbierta && imagenTarjeta ? (
        <div
          onClick={() => setImagenAmpliadaAbierta(false)}
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 12000,
            background: "rgba(0,0,0,0.86)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setImagenAmpliadaAbierta(false);
            }}
            aria-label="Cerrar imagen ampliada"
            style={{
              position: "absolute",
              top: 18,
              right: 18,
              width: 38,
              height: 38,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(20,20,26,0.75)",
              color: "#fff",
              fontSize: 20,
              cursor: "pointer"
            }}
          >
            ×
          </button>
          <img
            src={normalizarSrcImagenProducto(imagenTarjeta)}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(92vw, 980px)",
              maxHeight: "88vh",
              objectFit: "contain",
              borderRadius: 12,
              boxShadow: "0 12px 40px rgba(0,0,0,0.45)"
            }}
          />
        </div>
      ) : null}
    </ModalBase>
  );
}
