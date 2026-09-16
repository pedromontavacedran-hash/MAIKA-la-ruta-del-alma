import { THEME } from "../config";

/** Pantalla de espera mientras se hidrata la sesión del cliente al arrancar la app. */
export default function MaikaHydratingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 24,
        boxSizing: "border-box",
        textAlign: "center",
        background: `linear-gradient(165deg, ${THEME.bg} 0%, #1a1538 45%, #12102a 100%)`,
        color: "#e8e4dc",
        fontFamily: "system-ui, sans-serif"
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 600, color: THEME.goldMain }}>MAIKA</div>
      <div style={{ fontSize: 15, lineHeight: 1.45, maxWidth: 320 }}>
        Conectando con tu cuenta…
      </div>
      <div style={{ fontSize: 13, opacity: 0.75, maxWidth: 320 }}>
        Si tarda, comprobamos el servidor; en unos segundos podrás seguir comprando.
      </div>
    </div>
  );
}
