/**
 * Banner flotante cuando el perfil del cliente está desactualizado (sin conexión):
 * muestra datos guardados y permite reintentar la sincronización.
 */
export default function PerfilSyncOfflineBanner({
  reintentando,
  onReintentar
}: {
  reintentando: boolean;
  onReintentar: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        top: "calc(var(--app-topbar-stack, 72px) + 8px)",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9998,
        width: "min(520px, calc(100vw - 24px))",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "8px 10px",
        borderRadius: 999,
        border: "1px solid rgba(212, 175, 55, 0.45)",
        background: "rgba(10, 7, 24, 0.94)",
        color: "#f5e6a3",
        fontSize: 12,
        lineHeight: 1.25,
        backdropFilter: "blur(10px)"
      }}
    >
      <span style={{ minWidth: 0 }}>
        Sin conexión. Mostrando datos guardados.{" "}
        {reintentando ? "Reintentando..." : "Reintentando en breve..."}
      </span>
      <button
        type="button"
        onClick={onReintentar}
        disabled={reintentando}
        style={{
          flexShrink: 0,
          border: "1px solid rgba(212, 175, 55, 0.55)",
          borderRadius: 999,
          background: reintentando ? "rgba(255,255,255,0.08)" : "rgba(212, 175, 55, 0.16)",
          color: "#f5e6a3",
          padding: "5px 9px",
          fontSize: 12,
          fontWeight: 700,
          cursor: reintentando ? "not-allowed" : "pointer"
        }}
      >
        Reintentar
      </button>
    </div>
  );
}
