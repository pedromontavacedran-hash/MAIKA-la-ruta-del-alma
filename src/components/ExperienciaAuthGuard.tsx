import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { probeClientSessionApi } from "../services/apiAuth";

/**
 * Sueños y Horóscopo son experiencias de usuarios registrados: sin sesión no se muestra la
 * experiencia, sino una invitación clara a iniciar sesión o crear cuenta gratuita.
 * La seguridad real la exige el backend (toda la API devuelve 401 sin `maika_session`); esto es
 * solo la puerta visual.
 */
const CONTENIDO_POR_TIPO = {
  sueno: {
    icono: "🌙",
    texto: "Inicia sesión o crea tu cuenta gratuita para acceder a tu interpretación de sueños."
  },
  horoscopo: {
    icono: "🔮",
    texto: "Inicia sesión o crea tu cuenta gratuita para descubrir tu horóscopo diario."
  }
} as const;

export type ExperienciaAuthGuardTipo = keyof typeof CONTENIDO_POR_TIPO;

export default function ExperienciaAuthGuard({
  tipo = "sueno",
  children
}: {
  tipo?: ExperienciaAuthGuardTipo;
  children: ReactNode;
}) {
  const contenido = CONTENIDO_POR_TIPO[tipo] ?? CONTENIDO_POR_TIPO.sueno;
  const navigate = useNavigate();
  const [estado, setEstado] = useState<"cargando" | "ok" | "anon">("cargando");

  useEffect(() => {
    let vivo = true;
    void probeClientSessionApi().then((ok) => {
      if (vivo) setEstado(ok ? "ok" : "anon");
    });
    return () => {
      vivo = false;
    };
  }, []);

  if (estado === "cargando") {
    return null;
  }

  if (estado === "anon") {
    return (
      <div
        style={{
          position: "relative",
          maxWidth: 460,
          margin: "60px auto",
          padding: "26px 22px",
          borderRadius: 16,
          textAlign: "center",
          color: "#f5e6a3",
          background: "rgba(212,175,55,0.07)",
          border: "1px solid rgba(212,175,55,0.3)"
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          aria-label="Cerrar"
          title="Cerrar"
          style={{
            position: "absolute",
            top: 10,
            right: 12,
            background: "none",
            border: "none",
            color: "rgba(245,230,163,0.7)",
            cursor: "pointer",
            fontSize: 24,
            lineHeight: 1,
            padding: 6
          }}
        >
          ×
        </button>
        <p style={{ fontSize: 30, margin: "0 0 10px" }} aria-hidden>
          {contenido.icono}
        </p>
        <h2 style={{ margin: "0 0 10px", fontSize: 20, letterSpacing: "0.5px" }}>
          Esta experiencia es para miembros de MAIKA
        </h2>
        <p style={{ margin: "0 0 18px", fontSize: 14, lineHeight: 1.6, opacity: 0.85 }}>
          {contenido.texto}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            to="/cuenta?vista=login"
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
      </div>
    );
  }

  return <>{children}</>;
}
