import { THEME } from "./config";

interface ModalConfirmacionProps {
  abierto: boolean;
  mensaje: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  /** Texto del botón rojo de confirmar. Por defecto: "Confirmar" */
  textoConfirmar?: string;
  /** Texto del botón de cancelar. Por defecto: "Cancelar" */
  textoCancelar?: string;
  /** z-index del overlay para quedar por encima de otros modales (ej. 10002) */
  zIndex?: number;
}

export default function ModalConfirmacion({ 
  abierto, 
  mensaje, 
  onConfirmar, 
  onCancelar,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  zIndex = 10000
}: ModalConfirmacionProps) {
  if (!abierto) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(5px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex
      }}
      onClick={onCancelar}
    >
      <div
        style={{
        background: THEME.bg,
        border: `3px solid ${THEME.goldMain}`,
        borderRadius: 30,
        padding: "30px 40px",
        maxWidth: 400,
        width: "90%",
        boxShadow: "0 0 50px rgba(255, 215, 0, 0.5)",
        textAlign: "center"
      }}>
        {/* Icono decorativo */}
        <div style={{ fontSize: "3rem", marginBottom: 10 }}>🕯️</div>
        
        <h3 style={{ color: THEME.goldMain, fontSize: "1.5rem", marginBottom: 15 }}>
          ¿Estás segura?
        </h3>
        
        <p style={{ color: "white", fontSize: "1.1rem", marginBottom: 25 }}>
          {mensaje}
        </p>
        
        <div style={{
          display: "flex",
          gap: 15,
          justifyContent: "center"
        }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCancelar(); }}
            style={{
              background: "transparent",
              border: `2px solid ${THEME.goldMain}`,
              color: THEME.goldMain,
              padding: "12px 25px",
              borderRadius: 30,
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "1rem",
              flex: 1,
              transition: "all 0.3s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,215,0,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {textoCancelar}
          </button>
          
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onConfirmar(); }}
            style={{
              background: "#ff4444",
              border: "none",
              color: "white",
              padding: "12px 25px",
              borderRadius: 30,
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "1rem",
              flex: 1,
              transition: "all 0.3s",
              boxShadow: "0 0 20px rgba(255, 68, 68, 0.5)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.background = "#ff6666";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.background = "#ff4444";
            }}
          >
            {textoConfirmar}
          </button>
        </div>
        
        {/* Advertencia sutil */}
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", marginTop: 20 }}>
          Esta acción no se puede deshacer
        </p>
      </div>
    </div>
  );
}