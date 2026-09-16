import { THEME } from "../../config";

export interface NavAdminModalProps {
  claveAdminInput: string;
  setClaveAdminInput: (v: string) => void;
  mostrarClaveAdminNav: boolean;
  setMostrarClaveAdminNav: (fn: (v: boolean) => boolean) => void;
  errorClaveAdmin: boolean;
  setErrorClaveAdmin: (v: boolean) => void;
  mensajeErrorClaveAdmin: string;
  setMensajeErrorClaveAdmin: (v: string) => void;
  adminRateLimitBloqueado: boolean;
  setAdminRateLimitBloqueado: (v: boolean) => void;
  cerrarModalAdmin: () => void;
  confirmarAccesoAdmin: () => void;
}

/** Modal de acceso admin desde la barra de navegación (input de contraseña + ver/ocultar). */
export default function NavAdminModal({
  claveAdminInput,
  setClaveAdminInput,
  mostrarClaveAdminNav,
  setMostrarClaveAdminNav,
  errorClaveAdmin,
  setErrorClaveAdmin,
  mensajeErrorClaveAdmin,
  setMensajeErrorClaveAdmin,
  adminRateLimitBloqueado,
  setAdminRateLimitBloqueado,
  cerrarModalAdmin,
  confirmarAccesoAdmin
}: NavAdminModalProps) {
  return (
    <div
      onClick={cerrarModalAdmin}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10030,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 360,
          background: THEME.bg,
          border: `2px solid ${THEME.goldMain}`,
          borderRadius: 14,
          padding: 16,
          color: "white"
        }}
      >
        <button
          type="button"
          onClick={cerrarModalAdmin}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 28,
            height: 28,
            borderRadius: 999,
            border: `1px solid ${THEME.goldMain}`,
            background: "rgba(0,0,0,0.6)",
            color: THEME.goldMain,
            cursor: "pointer",
            fontSize: 18,
            lineHeight: 1
          }}
          aria-label="Cerrar acceso admin"
          title="Cerrar"
        >
          ×
        </button>
        <h3 style={{ margin: "0 0 12px", color: THEME.goldMain, textAlign: "center" }}>Acceso admin</h3>
        <div style={{ position: "relative" }}>
          <input
            type={mostrarClaveAdminNav ? "text" : "password"}
            placeholder="Introduce contraseña"
            value={claveAdminInput}
            onChange={(e) => {
              setClaveAdminInput(e.target.value);
              if (errorClaveAdmin) setErrorClaveAdmin(false);
              setMensajeErrorClaveAdmin("Contraseña incorrecta");
              setAdminRateLimitBloqueado(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !adminRateLimitBloqueado) confirmarAccesoAdmin();
            }}
            disabled={adminRateLimitBloqueado}
            autoFocus
            autoComplete="current-password"
            style={{
              width: "100%",
              padding: "10px 44px 10px 12px",
              borderRadius: 10,
              border: `2px solid ${errorClaveAdmin ? "#ff4d4d" : THEME.goldMain}`,
              background: "transparent",
              color: "white",
              opacity: adminRateLimitBloqueado ? 0.58 : 1,
              cursor: adminRateLimitBloqueado ? "not-allowed" : "text",
              boxSizing: "border-box"
            }}
          />
          <button
            type="button"
            onClick={() => setMostrarClaveAdminNav((v) => !v)}
            style={{
              position: "absolute",
              right: 6,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 18,
              padding: 4,
              color: THEME.goldMain
            }}
            title={mostrarClaveAdminNav ? "Ocultar contraseña" : "Ver contraseña"}
            aria-label={mostrarClaveAdminNav ? "Ocultar contraseña" : "Ver contraseña"}
            disabled={adminRateLimitBloqueado}
          >
            {mostrarClaveAdminNav ? "🙈" : "👁"}
          </button>
        </div>
        {errorClaveAdmin && (
          <p style={{ margin: "8px 0 0", color: "#ff8a8a", fontSize: 13 }}>{mensajeErrorClaveAdmin}</p>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button
            type="button"
            onClick={cerrarModalAdmin}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              border: `1px solid ${THEME.goldMain}`,
              background: "transparent",
              color: THEME.goldMain,
              cursor: "pointer"
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmarAccesoAdmin}
            disabled={adminRateLimitBloqueado}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              border: "none",
              background: THEME.goldMain,
              color: "#1b1745",
              fontWeight: "bold",
              cursor: adminRateLimitBloqueado ? "not-allowed" : "pointer",
              opacity: adminRateLimitBloqueado ? 0.58 : 1
            }}
          >
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
}
