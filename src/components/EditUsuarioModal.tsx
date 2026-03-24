import type { EditUsuarioForm } from "../App";
import { useState, type Dispatch, type SetStateAction } from "react";
import { THEME } from "../config";

interface EditUsuarioModalProps {
  abierto: boolean;
  editUsuarioForm: EditUsuarioForm | null;
  setEditUsuarioForm: Dispatch<SetStateAction<EditUsuarioForm | null>>;
  onClose: () => void;
  onSave: () => void;
}

const editModalInputStyle: React.CSSProperties = {
  width: "100%",
  padding: 20,
  marginBottom: 16,
  borderRadius: 10,
  border: `2px solid ${THEME.goldMain}`,
  background: THEME.bg,
  color: "white",
  fontSize: 20,
  outline: "none"
};

export default function EditUsuarioModal({
  abierto,
  editUsuarioForm,
  setEditUsuarioForm,
  onClose,
  onSave
}: EditUsuarioModalProps) {
  const [mostrarPassword, setMostrarPassword] = useState(false);
  if (!abierto || !editUsuarioForm) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.9)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 11000
    }}>
      <div style={{
        background: THEME.bg,
        border: `3px solid ${THEME.goldMain}`,
        borderRadius: 20,
        padding: 36,
        width: "98%",
        maxWidth: 920,
        maxHeight: "96vh",
        overflowY: "auto"
      }}>
        <h3 style={{ color: THEME.goldMain, marginBottom: 28, fontSize: 34 }}>✏️ Editar usuario</h3>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
          <input
            type="text"
            placeholder="Nombre y apellidos"
            value={editUsuarioForm.nombre}
            onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, nombre: e.target.value })}
            style={editModalInputStyle}
          />
          <input
            type="text"
            placeholder="DNI"
            value={editUsuarioForm.dni || ""}
            onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, dni: e.target.value.toUpperCase() })}
            style={{ ...editModalInputStyle, textTransform: "uppercase" }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={editUsuarioForm.email}
            onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, email: e.target.value })}
            style={editModalInputStyle}
          />
          <input
            type="tel"
            placeholder="Teléfono"
            value={editUsuarioForm.telefono}
            onChange={(e) =>
              setEditUsuarioForm({
                ...editUsuarioForm,
                telefono: e.target.value.replace(/\D/g, "").slice(0, 9)
              })
            }
            inputMode="numeric"
            maxLength={9}
            style={editModalInputStyle}
          />
        </div>

        <div style={{ position: "relative", marginBottom: 16 }}>
          <input
            type={mostrarPassword ? "text" : "password"}
            placeholder="Contraseña"
            value={editUsuarioForm.password}
            onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, password: e.target.value })}
            style={{ ...editModalInputStyle, marginBottom: 0, paddingRight: 56 }}
          />
          <button
            type="button"
            onClick={() => setMostrarPassword((v) => !v)}
            aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            title={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              color: THEME.goldMain,
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1
            }}
          >
            {mostrarPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <div style={{ color: THEME.goldMain, fontWeight: "bold", fontSize: 22, margin: "6px 0 16px" }}>
          Editar dirección
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: 12 }}>
          <input
            type="text"
            placeholder="Calle"
            value={editUsuarioForm.calle}
            onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, calle: e.target.value })}
            style={editModalInputStyle}
          />
          <input
            type="text"
            placeholder="Nº"
            value={editUsuarioForm.numero}
            onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, numero: e.target.value })}
            style={editModalInputStyle}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          <input
            type="text"
            placeholder="Piso"
            value={editUsuarioForm.piso}
            onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, piso: e.target.value })}
            style={editModalInputStyle}
          />
          <input
            type="text"
            placeholder="Puerta"
            value={editUsuarioForm.puerta}
            onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, puerta: e.target.value })}
            style={editModalInputStyle}
          />
          <input
            type="text"
            placeholder="Bloque"
            value={editUsuarioForm.bloque}
            onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, bloque: e.target.value })}
            style={editModalInputStyle}
          />
          <input
            type="text"
            placeholder="Escalera"
            value={editUsuarioForm.escalera}
            onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, escalera: e.target.value })}
            style={editModalInputStyle}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 12 }}>
          <input
            type="text"
            placeholder="C.P. *"
            value={editUsuarioForm.cp}
            onChange={(e) =>
              setEditUsuarioForm({
                ...editUsuarioForm,
                cp: e.target.value.replace(/\D/g, "").slice(0, 5)
              })
            }
            inputMode="numeric"
            maxLength={5}
            style={editModalInputStyle}
          />
          <input
            type="text"
            placeholder="Población"
            value={editUsuarioForm.poblacion}
            onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, poblacion: e.target.value })}
            style={editModalInputStyle}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <input
            type="text"
            placeholder="Provincia"
            value={editUsuarioForm.provincia}
            onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, provincia: e.target.value })}
            style={editModalInputStyle}
          />
          <input
            type="text"
            placeholder="País"
            value={editUsuarioForm.pais}
            onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, pais: e.target.value })}
            style={editModalInputStyle}
          />
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 12, color: "white", marginBottom: 24, fontSize: 19 }}>
          <input
            type="checkbox"
            checked={editUsuarioForm.verificado}
            onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, verificado: e.target.checked })}
          />
          Usuario verificado
        </label>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            className="btn-azul-categoria"
            onClick={onClose}
            style={{
              flex: 1,
              background: THEME.bg,
              color: THEME.goldMain,
              border: `2px solid ${THEME.goldMain}`,
              borderRadius: 12,
              padding: "16px 18px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 19
            }}
          >
            Cancelar
          </button>
          <button
            className="btn-azul-categoria"
            onClick={onSave}
            style={{
              flex: 1,
              background: THEME.bg,
              color: THEME.goldMain,
              border: `2px solid ${THEME.goldMain}`,
              borderRadius: 12,
              padding: "16px 18px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 19
            }}
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

