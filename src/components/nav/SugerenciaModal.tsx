import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ModalBase from "../ModalBase";
import { THEME } from "../../config";
import { checkoutInputStyle, checkoutPrimaryButtonStyleNoShadow } from "../../styles/inputStyle";
import { useApp } from "../../context/AppContext";
import { notificarError, notificarExito } from "../../utils/ui/notificaciones";
import { obtenerPerfilApi, probeClientSessionApi } from "../../services/apiAuth";
import { enviarSugerenciaApi } from "../../services/apiSugerencias";
import type { TipoSugerencia } from "../../types";

type Props = {
  onClose: () => void;
};

const TIPOS: TipoSugerencia[] = [
  "Web / diseño",
  "Tienda / productos",
  "Funcionalidad",
  "Experiencia de usuario",
  "Contenido",
  "Error o problema",
  "Otra sugerencia"
];

export function puedeEnviarSugerencia(tipo: TipoSugerencia | "", mensaje: string, enviando: boolean): boolean {
  return tipo !== "" && mensaje.trim() !== "" && !enviando;
}

export function SugerenciaAccesoView({ onClose }: Props) {
  return (
    <>
      <p style={{ fontSize: 30, margin: "0 0 10px", textAlign: "center" }} aria-hidden>
        💡
      </p>
      <h2
        id="sugerencia-acceso-titulo"
        style={{ margin: "0 0 10px", fontSize: 20, letterSpacing: "0.5px", textAlign: "center", color: "#f5e6a3" }}
      >
        Esta función es para miembros de MAIKA
      </h2>
      <p style={{ margin: "0 0 18px", fontSize: 14, lineHeight: 1.6, opacity: 0.85, textAlign: "center", color: "#f5e6a3" }}>
        Inicia sesión o crea tu cuenta gratuita para enviar sugerencias y ayudarnos a mejorar.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <Link
          to="/cuenta?vista=login"
          onClick={onClose}
          style={{
            padding: "10px 22px",
            borderRadius: 10,
            background: "linear-gradient(45deg, #d4af37, #f5e6a3)",
            color: "#1a1208",
            fontWeight: 700,
            fontSize: 14,
            textDecoration: "none"
          }}
        >
          Iniciar sesión
        </Link>
        <Link
          to="/cuenta?vista=registro"
          onClick={onClose}
          style={{
            padding: "10px 22px",
            borderRadius: 10,
            background: "transparent",
            border: "1px solid rgba(212,175,55,0.5)",
            color: "#f5e6a3",
            fontWeight: 600,
            fontSize: 14,
            textDecoration: "none"
          }}
        >
          Crear cuenta gratuita
        </Link>
      </div>
    </>
  );
}

function SugerenciaFormulario({ onClose }: Props) {
  const { mostrarNotificacion } = useApp();
  const [tipo, setTipo] = useState<TipoSugerencia | "">("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  const campoStyle = { ...checkoutInputStyle, marginBottom: 12, boxSizing: "border-box" as const };
  const optionStyle = { backgroundColor: "#1b1745", color: "#f5e6a3" };
  const botonPrincipalStyle = {
    width: "100%",
    padding: "12px 14px",
    fontSize: 15,
    borderRadius: 10,
    fontWeight: 600,
    cursor: "pointer",
    boxSizing: "border-box" as const,
    ...checkoutPrimaryButtonStyleNoShadow
  };

  const mensajeTrim = mensaje.trim();
  const puedeEnviar = puedeEnviarSugerencia(tipo, mensaje, enviando);

  const limpiarFormulario = () => {
    setTipo("");
    setMensaje("");
  };

  const submit = async () => {
    if (!tipo || !mensajeTrim || enviando) return;
    setEnviando(true);
    try {
      await enviarSugerenciaApi({ tipo, mensaje: mensajeTrim });
      limpiarFormulario();
      onClose();
      notificarExito(mostrarNotificacion, "✨ Gracias por tu sugerencia. La tendremos en cuenta para seguir mejorando MAIKA.");
    } catch {
      notificarError(mostrarNotificacion, "❌ No se pudo enviar tu sugerencia. Inténtalo de nuevo en unos minutos.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form
      autoComplete="off"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <label style={{ color: THEME.goldMain, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
        Tipo de sugerencia *
      </label>
      <select
        value={tipo}
        disabled={enviando}
        onChange={(e) => setTipo(e.target.value as TipoSugerencia | "")}
        style={{ ...campoStyle, cursor: enviando ? "not-allowed" : "pointer", colorScheme: "dark" }}
      >
        <option value="" disabled style={optionStyle}>
          Selecciona un tipo de sugerencia
        </option>
        {TIPOS.map((t) => (
          <option key={t} value={t} style={optionStyle}>
            {t}
          </option>
        ))}
      </select>

      <label style={{ color: THEME.goldMain, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
        Mensaje *
      </label>
      <textarea
        placeholder="Cuéntanos qué mejorarías o qué te gustaría encontrar..."
        value={mensaje}
        disabled={enviando}
        onChange={(e) => setMensaje(e.target.value)}
        rows={5}
        style={{ ...campoStyle, resize: "vertical", minHeight: 100, marginBottom: 16 }}
      />

      <button
        type="submit"
        disabled={!puedeEnviar}
        className="checkout-boton-finalizar"
        style={{
          ...botonPrincipalStyle,
          cursor: puedeEnviar ? "pointer" : "not-allowed",
          opacity: puedeEnviar ? 1 : 0.55
        }}
      >
        {enviando ? "Enviando…" : "Enviar sugerencia"}
      </button>
      <button
        type="button"
        onClick={onClose}
        disabled={enviando}
        style={{
          width: "100%",
          padding: "12px 14px",
          fontSize: 15,
          borderRadius: 10,
          fontWeight: 600,
          boxSizing: "border-box",
          background: "transparent",
          color: THEME.goldMain,
          border: "1px solid rgba(212, 175, 55, 0.45)",
          marginTop: 10,
          cursor: enviando ? "not-allowed" : "pointer"
        }}
      >
        Cancelar
      </button>
    </form>
  );
}

/** Buzón "💡 Sugerencias y mejoras" del menú: solo usuarios con sesión MAIKA. */
export default function SugerenciaModal({ onClose }: Props) {
  const [acceso, setAcceso] = useState<"comprobando" | "ok" | "anon">("comprobando");

  useEffect(() => {
    let vivo = true;
    void (async () => {
      const sesionOk = await probeClientSessionApi();
      if (!sesionOk) {
        if (vivo) setAcceso("anon");
        return;
      }
      try {
        await obtenerPerfilApi();
        if (vivo) setAcceso("ok");
      } catch {
        if (vivo) setAcceso("anon");
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  if (acceso === "comprobando") return null;

  const esAnon = acceso === "anon";

  return (
    <ModalBase
      abierto
      onClose={onClose}
      zIndex={11050}
      maxWidth="480px"
      classNameCard={esAnon ? "" : "cuenta-maika-card"}
      styleOverlay={esAnon ? { alignItems: "flex-start" } : undefined}
      styleCard={
        esAnon
          ? {
              padding: "26px 22px",
              width: "100%",
              boxSizing: "border-box",
              color: "#f5e6a3",
              background: "linear-gradient(rgba(212,175,55,0.07), rgba(212,175,55,0.07)), #0b0906",
              border: "1px solid rgba(212,175,55,0.3)",
              borderRadius: 16,
              boxShadow: "0 24px 64px rgba(0,0,0,0.55)",
              marginTop: "calc(var(--app-topbar-stack, 100px) + 60px)",
              flexShrink: 0
            }
          : { padding: 20, width: "100%", boxSizing: "border-box", color: "#fff" }
      }
      ariaLabelledBy={acceso === "ok" ? "sugerencia-modal-titulo" : "sugerencia-acceso-titulo"}
    >
      {esAnon ? (
        <SugerenciaAccesoView onClose={onClose} />
      ) : (
        <>
          <h2
            id="sugerencia-modal-titulo"
            style={{ textAlign: "center", color: THEME.goldMain, marginBottom: 10, marginTop: 4, fontSize: 18 }}
          >
            💡 Sugerencias y mejoras
          </h2>
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.82)", fontSize: 13.5, lineHeight: 1.5, margin: "0 0 18px" }}>
            Tu opinión nos ayuda a mejorar. Cuéntanos qué cambiarías, qué añadirías o qué podríamos hacer mejor en MAIKA.
          </p>
          <SugerenciaFormulario onClose={onClose} />
        </>
      )}
    </ModalBase>
  );
}
