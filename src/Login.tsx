import { useState } from "react";
import {
  ensureAdminPanelJwtInSession,
  getLastAdminPanelLoginError,
  getLastAdminPanelRateLimitResetAt
} from "./services/apiAuth";
import { setAdminAuthorization } from "./utils/adminAuth";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [clave, setClave] = useState("");
  const [recordar, setRecordar] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const entrar = async () => {
    if (enviando) return;
    setEnviando(true);
    try {
      if (await ensureAdminPanelJwtInSession(clave, recordar)) {
        setAdminAuthorization(recordar);
        onLogin();
      } else {
        const motivo = getLastAdminPanelLoginError();
        const resetAt = getLastAdminPanelRateLimitResetAt();
        const resetTexto = resetAt ? new Date(resetAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "";
        alert(
          motivo === "rate_limit"
            ? `Demasiados intentos.${resetTexto ? ` Vuelve a probar sobre las ${resetTexto}.` : " Espera unos minutos y vuelve a probar."}`
            : motivo === "network"
              ? "No se pudo contactar con el servidor."
              : "Contraseña incorrecta"
        );
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      justifyContent: "center",
      alignItems: "center",
      background: "#1b1745",
      color: "white"
    }}>
      {/* <form> real: Enter envía y el gestor de contraseñas de Chrome
          puede guardarla (autocomplete current-password). */}
      <form
        onSubmit={(e) => { e.preventDefault(); void entrar(); }}
        autoComplete="on"
      >
        <h2>Acceso Admin</h2>

        {/* nombre de cuenta implícito: el gestor lo asocia a "admin" */}
        <input
          type="text"
          name="username"
          autoComplete="username"
          defaultValue="admin"
          aria-hidden="true"
          tabIndex={-1}
          style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
        />

        <input
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Contraseña"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          style={{ padding: "10px", marginTop: "10px" }}
        />

        <br />

        <label style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          marginTop: "10px", fontSize: "14px", cursor: "pointer"
        }}>
          <input
            type="checkbox"
            checked={recordar}
            onChange={(e) => setRecordar(e.target.checked)}
          />
          Recordar en este dispositivo (30 días)
        </label>

        <br />

        <button type="submit" style={{ marginTop: "10px" }} disabled={enviando}>
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
