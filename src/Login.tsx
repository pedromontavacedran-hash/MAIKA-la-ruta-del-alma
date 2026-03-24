import { useState } from "react";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [clave, setClave] = useState("");

  const PASSWORD = "maika123";

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
          onClick={() => {
            if (clave === PASSWORD) {
              localStorage.setItem("maika_admin", "ok");
              onLogin();
            } else {
              alert("Contraseña incorrecta");
            }
          }}
        >
          Entrar
        </button>
      </div>
    </div>
  );
}
