import type { EditUsuarioForm } from "../App";
import type { Dispatch, SetStateAction } from "react";

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
  border: "2px solid #C9A24A",
  background: "#0B0B0D",
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
        background: "#0B0B0D",
        border: "3px solid #C9A24A",
        borderRadius: 20,
        padding: 36,
        width: "98%",
        maxWidth: 920,
        maxHeight: "96vh",
        overflowY: "auto"
      }}>
        <h3 style={{ color: "#C9A24A", marginBottom: 28, fontSize: 34 }}>✏️ Editar usuario</h3>

        <input
          type="text"
          placeholder="Nombre"
          value={editUsuarioForm.nombre}
          onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, nombre: e.target.value })}
          style={editModalInputStyle}
        />

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

        <input
          type="password"
          placeholder="Contraseña"
          value={editUsuarioForm.password}
          onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, password: e.target.value })}
          style={editModalInputStyle}
        />

        <input
          type="text"
          placeholder="Calle"
          value={editUsuarioForm.calle}
          onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, calle: e.target.value })}
          style={editModalInputStyle}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <input
            type="text"
            placeholder="Número"
            value={editUsuarioForm.numero}
            onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, numero: e.target.value })}
            style={editModalInputStyle}
          />
          <input
            type="text"
            placeholder="Bloque"
            value={editUsuarioForm.bloque}
            onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, bloque: e.target.value })}
            style={editModalInputStyle}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <input
            type="text"
            placeholder="Escalera"
            value={editUsuarioForm.escalera}
            onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, escalera: e.target.value })}
            style={editModalInputStyle}
          />
          <input
            type="text"
            placeholder="Piso"
            value={editUsuarioForm.piso}
            onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, piso: e.target.value })}
            style={editModalInputStyle}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <input
            type="text"
            placeholder="Puerta"
            value={editUsuarioForm.puerta}
            onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, puerta: e.target.value })}
            style={editModalInputStyle}
          />
          <input
            type="text"
            placeholder="C.P."
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
            placeholder="Población"
            value={editUsuarioForm.poblacion}
            onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, poblacion: e.target.value })}
            style={editModalInputStyle}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          <input
            type="text"
            placeholder="País"
            value={editUsuarioForm.pais}
            onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, pais: e.target.value })}
            style={editModalInputStyle}
          />
        </div>

        <input
          type="text"
          placeholder="Dirección completa (autogenerada)"
          value={`${editUsuarioForm.calle}${editUsuarioForm.numero ? `, Nº ${editUsuarioForm.numero}` : ""}${editUsuarioForm.bloque ? `, Bloque ${editUsuarioForm.bloque}` : ""}${editUsuarioForm.escalera ? `, Esc. ${editUsuarioForm.escalera}` : ""}${editUsuarioForm.piso ? `, Piso ${editUsuarioForm.piso}` : ""}${editUsuarioForm.puerta ? `, Puerta ${editUsuarioForm.puerta}` : ""}`}
          readOnly
          style={editModalInputStyle}
        />

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
              background: "#0B0B0D",
              color: "#C9A24A",
              border: "2px solid #C9A24A",
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
              background: "#0B0B0D",
              color: "#C9A24A",
              border: "2px solid #C9A24A",
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

