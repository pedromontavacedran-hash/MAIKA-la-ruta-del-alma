import { useApp } from "../context/AppContext";

export default function InicioPage() {
  const { setPagina } = useApp();

  return (
    <div style={{ textAlign: "center" }}>
      <h1
        className="hero-title"
        style={{
          fontSize: 42,
          marginBottom: 32,
          color: "gold",
          opacity: 0.95,
          textTransform: "uppercase",
          letterSpacing: "2px",
          whiteSpace: "nowrap",
          lineHeight: 1.2
        }}
      >
        MAIKA&nbsp;&nbsp;LA RUTA DEL ALMA
      </h1>

      <div style={{ textAlign: "center", marginBottom: 68 }}>
        <div
          className="imagen-inicio-hover"
          style={{
            width: "50%",
            maxWidth: "300px",
            margin: "0 auto",
            borderRadius: 15,
            overflow: "hidden",
            border: "1px solid rgba(212,175,55,0.4)",
            boxShadow: "none"
          }}
        >
          <img
            src="/tienda.jpg"
            alt="Tienda"
            style={{ width: "100%", height: "auto", display: "block" }}
            onError={(e) => {
              const fallbackActual = e.currentTarget.getAttribute("data-fallback");
              if (!fallbackActual) {
                e.currentTarget.setAttribute("data-fallback", "1");
                e.currentTarget.src = "tienda.jpg";
                return;
              }
              if (fallbackActual === "1") {
                e.currentTarget.setAttribute("data-fallback", "2");
                e.currentTarget.src = "/copia.png";
                return;
              }
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
        <button
          className="boton-tienda-hover"
          onClick={() => setPagina("tienda")}
          style={{
            marginTop: "24px",
            background: "transparent",
            color: "#f7d046",
            border: "2px solid gold",
            padding: "16px 56px",
            minWidth: 260,
            borderRadius: 30,
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 20,
            letterSpacing: "1.5px",
            boxShadow: "0 0 20px gold"
          }}
        >
          🛍️ TIENDA
        </button>
      </div>

      <h2 style={{ fontSize: 28, marginBottom: 24, color: "gold" }}>🌟 SERVICIOS</h2>
      <div style={{ display: "flex", justifyContent: "center", gap: 15, flexWrap: "wrap", marginBottom: 64 }}>
        <div className="card" style={{ width: 240, padding: 18, display: "flex", flexDirection: "column", minHeight: 305 }}>
          <h3 style={{ color: "gold", margin: "6px 0", fontSize: 18, textAlign: "center" }}>🔮 Tarot Evolutivo</h3>
          <img
            src="/tarot%20evolutivo.jpg"
            alt="Tarot Evolutivo"
            style={{ width: "100%", height: 115, objectFit: "cover", borderRadius: 10, border: "1px solid gold", marginBottom: 8, display: "block" }}
          />
          <p style={{ color: "white", margin: "4px 0", fontSize: 16, textAlign: "center" }}>Sesión 60 min</p>
          <p style={{ color: "gold", fontSize: 20, fontWeight: "bold", margin: "6px 0", textAlign: "center" }}>45€</p>
          <button
            className="btn-reservar-inicio"
            onClick={() => window.open("https://wa.me/34673175547?text=Hola%20Maika%2C%20quiero%20reservar%20Tarot", "_blank")}
            style={{ border: "none", padding: "12px 16px", borderRadius: 20, cursor: "pointer", width: "100%", fontWeight: "bold", fontSize: 16, marginTop: "auto" }}
          >
            Reservar
          </button>
        </div>
        <div className="card" style={{ width: 240, padding: 18, display: "flex", flexDirection: "column", minHeight: 305 }}>
          <h3 style={{ color: "gold", margin: "6px 0", fontSize: 18, textAlign: "center" }}>✨ Limpieza Energética</h3>
          <img
            src="/limpieza%20energetica.jpg"
            alt="Limpieza Energética"
            style={{ width: "100%", height: 115, objectFit: "cover", borderRadius: 10, border: "1px solid gold", marginBottom: 8, display: "block" }}
          />
          <p style={{ color: "white", margin: "4px 0", fontSize: 16, textAlign: "center" }}>Sesión 45 min</p>
          <p style={{ color: "gold", fontSize: 20, fontWeight: "bold", margin: "6px 0", textAlign: "center" }}>35€</p>
          <button
            className="btn-reservar-inicio"
            onClick={() => window.open("https://wa.me/34673175547?text=Hola%20Maika%2C%20quiero%20reservar%20Limpieza", "_blank")}
            style={{ border: "none", padding: "12px 16px", borderRadius: 20, cursor: "pointer", width: "100%", fontWeight: "bold", fontSize: 16, marginTop: "auto" }}
          >
            Reservar
          </button>
        </div>
        <div className="card" style={{ width: 240, padding: 18, display: "flex", flexDirection: "column", minHeight: 305 }}>
          <h3 style={{ color: "gold", margin: "6px 0", fontSize: 18, textAlign: "center" }}>🕯️ Ritual Personalizado</h3>
          <img
            src="/ritual%20personalizado.jpg"
            alt="Ritual Personalizado"
            style={{ width: "100%", height: 115, objectFit: "cover", borderRadius: 10, border: "1px solid gold", marginBottom: 8, display: "block" }}
          />
          <p style={{ color: "white", margin: "4px 0", fontSize: 16, textAlign: "center" }}>Sesión 60 min</p>
          <p style={{ color: "gold", fontSize: 20, fontWeight: "bold", margin: "6px 0", textAlign: "center" }}>50€</p>
          <button
            className="btn-reservar-inicio"
            onClick={() => window.open("https://wa.me/34673175547?text=Hola%20Maika%2C%20quiero%20consultar%20Ritual", "_blank")}
            style={{ border: "none", padding: "12px 16px", borderRadius: 20, cursor: "pointer", width: "100%", fontWeight: "bold", fontSize: 16, marginTop: "auto" }}
          >
            Reservar
          </button>
        </div>
      </div>

      <h2 style={{ fontSize: 28, marginBottom: 20, color: "gold" }}>💬 TESTIMONIOS</h2>
      <div style={{ maxWidth: 600, margin: "0 auto 40px" }}>
        <p className="card testimonio-card" style={{ marginBottom: 12, fontSize: 16, lineHeight: 1.5 }}>
          "Sentí claridad y paz después de la primera consulta. ¡Recomendadísima!"
        </p>
        <p className="card testimonio-card" style={{ fontSize: 16, lineHeight: 1.5 }}>
          "Me ayudó a entender lo que estaba viviendo. Gracias Maika"
        </p>
      </div>
    </div>
  );
}
