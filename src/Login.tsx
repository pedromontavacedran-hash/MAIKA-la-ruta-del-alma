import { useState } from "react";
import {
  ensureAdminPanelJwtInSession,
  getLastAdminPanelLoginError,
  getLastAdminPanelRateLimitResetAt
} from "./services/apiAuth";
import { setAdminAuthorization } from "./utils/adminAuth";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [clave, setClave] = useState("");
  const [enviando, setEnviando] = useState(false);

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      justifyContent: "center",
      alignItems: "center",
      background: "#1b1745",
      color: "white"
    }}>
      <div>
        <h2>Acceso Admin</h2>

        <input
          type="password"
          placeholder="Contraseña"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          style={{ padding: "10px", marginTop: "10px" }}
        />

        <br />

        <button
          style={{ marginTop: "10px" }}
          disabled={enviando}
          onClick={async () => {
            setEnviando(true);
            try {
              if (await ensureAdminPanelJwtInSession(clave)) {
                setAdminAuthorization();
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
          }}
        >
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </div>
  );
}
