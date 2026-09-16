import type { EditUsuarioForm } from "../App";
import { useRef, useState, useEffect, type Dispatch, type SetStateAction } from "react";
import { THEME } from "../config";
import ModalBase from "./ModalBase";
import { checkoutInputStyle } from "../styles/inputStyle";
import UbicacionCpPanel from "./UbicacionCpPanel";
import CalleInputConSugerencias, { CalleInputAyudaSugerencias } from "./CalleInputConSugerencias";

interface EditUsuarioModalProps {
  abierto: boolean;
  editUsuarioForm: EditUsuarioForm | null;
  setEditUsuarioForm: Dispatch<SetStateAction<EditUsuarioForm | null>>;
  onClose: () => void;
  onSave: () => void | Promise<void>;
}

const editModalInputStyle: React.CSSProperties = {
  ...checkoutInputStyle,
  marginBottom: 6,
  fontSize: 14,
  boxSizing: "border-box"
};
const editModalInputBlueStyle: React.CSSProperties = {
  ...editModalInputStyle,
  border: "1px solid rgba(120, 160, 255, 0.45)",
  background: "rgba(30, 44, 110, 0.72)"
};

function generarPasswordTemporalMaika(nombre: string): string {
  const base = String(nombre || "Cliente")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 6) || "Cliente";
  const sufijo = Math.floor(1000 + Math.random() * 9000);
  return `Maika${sufijo}!${base}`;
}

function abrirWhatsappTemporal(telefono: string, email: string, password: string) {
  const tel = String(telefono || "").replace(/\D/g, "");
  const telIntl = tel.length === 9 ? `34${tel}` : tel;
  const texto = [
    "Hola, te he creado un acceso temporal a MAIKA.",
    "",
    `Email: ${email || "tu email"}`,
    `Contraseña temporal: ${password}`,
    "",
    "Caduca en 10 minutos. Entra y cámbiala desde Mi Cuenta > Cambiar contraseña."
  ].join("\n");
  if (telIntl) {
    window.open(`https://wa.me/${telIntl}?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer");
  }
}

export default function EditUsuarioModal({
  abierto,
  editUsuarioForm,
  setEditUsuarioForm,
  onClose,
  onSave
}: EditUsuarioModalProps) {
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [nombreDesbloqueado, setNombreDesbloqueado] = useState(false);
  useEffect(() => {
    if (!abierto) setNombreDesbloqueado(false);
  }, [abierto]);
  const [buscandoCalle, setBuscandoCalle] = useState(false);
  const [confirmarTemporal, setConfirmarTemporal] = useState<null | { telefono: string; email: string; password: string }>(null);
  const [guardandoTemporal, setGuardandoTemporal] = useState(false);
  const dniRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const telefonoRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const cpRef = useRef<HTMLInputElement>(null);
  const calleRef = useRef<HTMLInputElement>(null);
  const numeroRef = useRef<HTMLInputElement>(null);
  const pisoRef = useRef<HTMLInputElement>(null);
  const puertaRef = useRef<HTMLInputElement>(null);
  const bloqueRef = useRef<HTMLInputElement>(null);
  const escaleraRef = useRef<HTMLInputElement>(null);
  const guardarBtnRef = useRef<HTMLButtonElement>(null);
  const onEnterFocus = (e: React.KeyboardEvent, next: React.RefObject<HTMLElement | null>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    next.current?.focus();
  };
  if (!abierto || !editUsuarioForm) return null;

  return (
    <>
    <ModalBase
      abierto
      onClose={onClose}
      zIndex={11000}
      classNameCard="modal-card--wide"
      maxWidth="920px"
      styleCard={{
        background: THEME.bg,
        border: `3px solid ${THEME.goldMain}`,
        borderRadius: 20,
        padding: 20,
        width: "98%",
        maxHeight: "96vh",
        overflowY: "auto"
      }}
    >
      <h3 style={{ color: THEME.goldMain, marginBottom: 12, fontSize: 24 }}>✏️ Editar usuario</h3>
      <p style={{ color: "rgba(255,255,255,0.78)", marginTop: 0, marginBottom: 12, fontSize: 12 }}>
        Mismo formato que alta de usuario para editar rápido y sin confusiones. La contraseña no se muestra: escribe una nueva solo si quieres cambiarla.
      </p>

      <p style={{ fontSize: 13, color: THEME.goldMain, fontWeight: 700, letterSpacing: 0.4, marginBottom: 12, marginTop: 0 }}>
        Datos personales
      </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 12,
            alignItems: "start"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
                Nombre *
              </span>
              <button
                type="button"
                onClick={() => setNombreDesbloqueado((v) => !v)}
                title={nombreDesbloqueado ? "Volver a bloquear el nombre" : "Desbloquear para corregir el nombre"}
                style={{
                  background: "transparent",
                  border: `1px solid ${nombreDesbloqueado ? "#7ecd8f" : THEME.goldMain}`,
                  color: nombreDesbloqueado ? "#7ecd8f" : THEME.goldMain,
                  borderRadius: 8,
                  padding: "2px 7px",
                  cursor: "pointer",
                  fontSize: 12,
                  lineHeight: 1.2
                }}
              >
                {nombreDesbloqueado ? "🔓" : "🔒"}
              </button>
            </div>
            <input
              type="text"
              placeholder="Nombre y apellidos"
              value={editUsuarioForm.nombre}
              disabled={!nombreDesbloqueado}
              readOnly={!nombreDesbloqueado}
              onChange={(e) => {
                if (!nombreDesbloqueado) return;
                setEditUsuarioForm({ ...editUsuarioForm, nombre: e.target.value });
              }}
              style={{
                ...editModalInputStyle,
                opacity: nombreDesbloqueado ? 1 : 0.88,
                cursor: nombreDesbloqueado ? "text" : "not-allowed"
              }}
            />
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
              {nombreDesbloqueado
                ? "Nombre y apellidos completos (sale en pedidos y facturas)"
                : "Bloqueado (asociado a pedidos). Pulsa 🔒 solo para corregir errores"}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", display: "block", marginBottom: 6 }}>
              DNI
            </label>
            <input
              ref={dniRef}
              type="text"
              placeholder="DNI / NIE"
              value={editUsuarioForm.dni || ""}
              onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, dni: e.target.value.toUpperCase() })}
              onKeyDown={(e) => onEnterFocus(e, emailRef)}
              autoComplete="off"
              style={{ ...editModalInputStyle, textTransform: "uppercase" }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
          <input
            ref={emailRef}
            type="email"
            name="maika-admin-edit-email"
            autoComplete="off"
            placeholder="Email"
            value={editUsuarioForm.email}
            onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, email: e.target.value })}
            onKeyDown={(e) => onEnterFocus(e, telefonoRef)}
            style={editModalInputBlueStyle}
          />
          <input
            ref={telefonoRef}
            type="tel"
            name="maika-admin-edit-telefono"
            autoComplete="off"
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
            onKeyDown={(e) => onEnterFocus(e, passwordRef)}
            style={editModalInputBlueStyle}
          />
        </div>

        <div style={{ position: "relative", marginBottom: 16 }}>
          <input
            ref={passwordRef}
            type={mostrarPassword ? "text" : "password"}
            name="maika-admin-edit-new-password"
            autoComplete="new-password"
            spellCheck={false}
            placeholder="Nueva contraseña (dejar vacío para no cambiar)"
            value={editUsuarioForm.password}
            onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, password: e.target.value })}
            onKeyDown={(e) => onEnterFocus(e, cpRef)}
            style={{ ...editModalInputBlueStyle, marginBottom: 0, paddingRight: 56 }}
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
        <button
          type="button"
          onClick={() => {
            const pwd = generarPasswordTemporalMaika(editUsuarioForm.nombre);
            setEditUsuarioForm({ ...editUsuarioForm, password: pwd, passwordTemporal: true });
            setConfirmarTemporal({ telefono: editUsuarioForm.telefono, email: editUsuarioForm.email, password: pwd });
          }}
          style={{
            width: "100%",
            padding: "10px 12px",
            marginTop: -6,
            marginBottom: 8,
            borderRadius: 10,
            border: `1px solid ${THEME.goldMain}`,
            background: "rgba(212,175,55,0.1)",
            color: THEME.goldMain,
            cursor: "pointer",
            fontWeight: 700
          }}
        >
          Generar acceso temporal WhatsApp (10 min)
        </button>
        {editUsuarioForm.passwordTemporal && editUsuarioForm.password ? (
          <div
            role="alert"
            style={{
              marginTop: 0,
              marginBottom: 14,
              padding: "10px 12px",
              borderRadius: 10,
              border: `1px solid ${THEME.goldMain}`,
              background: "rgba(212,175,55,0.18)",
              color: THEME.goldMain,
              fontSize: 12,
              lineHeight: 1.45,
              fontWeight: 700
            }}
          >
            ⚠️ Contraseña temporal generada. Confirma el envío por WhatsApp: se guardará en el
            servidor y se abrirá WhatsApp con el mensaje. Caduca en 10 minutos y el cliente deberá
            cambiarla al entrar.
          </div>
        ) : null}

        <p style={{ fontSize: 13, color: THEME.goldMain, fontWeight: 700, letterSpacing: 0.4, marginBottom: 6, marginTop: 10 }}>
          Dirección de envío
        </p>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: -4, marginBottom: 8 }}>
          Esta dirección se usará como principal para sus pedidos.
        </p>
        <UbicacionCpPanel
          namePrefix="maika-editar-usuario"
          layoutUbicacion="stack"
          cp={editUsuarioForm.cp || ""}
          onCpChange={(next) =>
            setEditUsuarioForm((prev) =>
              prev
                ? {
                    ...prev,
                    cp: next,
                    ...(next.length < 5 ? { poblacion: "", provincia: "", pais: "" } : {})
                  }
                : prev
            )
          }
          poblacion={editUsuarioForm.poblacion || ""}
          provincia={editUsuarioForm.provincia || ""}
          pais={editUsuarioForm.pais || ""}
          inputStyle={editModalInputBlueStyle}
          cpInputRef={cpRef}
          onCpKeyDown={(e) => onEnterFocus(e, calleRef)}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8, marginBottom: 0, maxWidth: "100%" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", width: "100%" }}>
            <div style={{ flex: "1 1 0", minWidth: 0, width: "100%" }}>
              <CalleInputConSugerencias
                name="maika-editar-usuario-calle"
                placeholder="Calle *"
                value={editUsuarioForm.calle || ""}
                onValueChange={(v) => setEditUsuarioForm({ ...editUsuarioForm, calle: v })}
                onMergeCampos={(patch) => setEditUsuarioForm({ ...editUsuarioForm, ...patch })}
                cp={editUsuarioForm.cp || ""}
                poblacion={editUsuarioForm.poblacion || ""}
                inputStyle={editModalInputBlueStyle}
                onBuscandoPhoton={setBuscandoCalle}
                forwardedRef={calleRef}
                onInputKeyDown={(e) => onEnterFocus(e, numeroRef)}
              />
            </div>
            <input
              ref={numeroRef}
              type="text"
              name="maika-editar-usuario-numero"
              placeholder="N.º *"
              autoComplete="off"
              value={editUsuarioForm.numero}
              onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, numero: e.target.value.toUpperCase() })}
              onKeyDown={(e) => onEnterFocus(e, pisoRef)}
              style={{
                ...editModalInputBlueStyle,
                textTransform: "uppercase",
                marginBottom: 0,
                width: 96,
                minWidth: 96,
                maxWidth: 96,
                flexShrink: 0,
                textAlign: "center"
              }}
            />
          </div>

          <CalleInputAyudaSugerencias buscando={buscandoCalle} />

          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", width: "100%" }}>
            <input
              ref={pisoRef}
              type="text"
              name="maika-editar-usuario-piso"
              placeholder="Piso"
              autoComplete="off"
              value={editUsuarioForm.piso}
              onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, piso: e.target.value.toUpperCase() })}
              onKeyDown={(e) => onEnterFocus(e, puertaRef)}
              style={{
                ...editModalInputBlueStyle,
                textTransform: "uppercase",
                marginBottom: 0,
                flex: "1 1 0",
                minWidth: 0,
                width: "100%"
              }}
            />
            <input
              ref={puertaRef}
              type="text"
              name="maika-editar-usuario-puerta"
              placeholder="Puerta"
              autoComplete="off"
              value={editUsuarioForm.puerta}
              onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, puerta: e.target.value.toUpperCase() })}
              onKeyDown={(e) => onEnterFocus(e, bloqueRef)}
              style={{
                ...editModalInputBlueStyle,
                textTransform: "uppercase",
                marginBottom: 0,
                width: 96,
                minWidth: 96,
                maxWidth: 96,
                flexShrink: 0,
                textAlign: "center"
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 8,
            marginTop: 8,
            marginBottom: 8,
            maxWidth: "100%"
          }}
        >
          <input
            ref={bloqueRef}
            type="text"
            name="maika-editar-usuario-bloque"
            placeholder="Bloque"
            autoComplete="off"
            value={editUsuarioForm.bloque}
            onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, bloque: e.target.value.toUpperCase() })}
            onKeyDown={(e) => onEnterFocus(e, escaleraRef)}
            style={{ ...editModalInputBlueStyle, textTransform: "uppercase", marginBottom: 0 }}
          />
          <input
            ref={escaleraRef}
            type="text"
            name="maika-editar-usuario-escalera"
            placeholder="Escalera"
            autoComplete="off"
            value={editUsuarioForm.escalera}
            onChange={(e) => setEditUsuarioForm({ ...editUsuarioForm, escalera: e.target.value.toUpperCase() })}
            onKeyDown={(e) => onEnterFocus(e, guardarBtnRef)}
            style={{ ...editModalInputBlueStyle, textTransform: "uppercase", marginBottom: 0 }}
          />
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 12, color: "white", marginBottom: 16, fontSize: 14 }}>
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
              padding: "12px 14px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 15
            }}
          >
            Cancelar
          </button>
          <button
            ref={guardarBtnRef}
            className="btn-azul-categoria"
            onClick={onSave}
            style={{
              flex: 1,
              background: THEME.bg,
              color: THEME.goldMain,
              border: `2px solid ${THEME.goldMain}`,
              borderRadius: 12,
              padding: "12px 14px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 15
            }}
          >
            Guardar cambios
          </button>
        </div>
    </ModalBase>

    {confirmarTemporal && (
      <ModalBase
        abierto
        onClose={() => setConfirmarTemporal(null)}
        zIndex={12000}
        maxWidth="560px"
        styleCard={{
          background: THEME.bg,
          border: `3px solid ${THEME.goldMain}`,
          borderRadius: 20,
          padding: 0,
          width: "96%",
          maxHeight: "96vh",
          overflowY: "auto",
          boxShadow: "0 24px 80px rgba(0,0,0,0.85)"
        }}
      >
        {/* Cabecera explícita */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(212,175,55,0.22), rgba(212,175,55,0.08))",
            borderBottom: `2px solid ${THEME.goldMain}`,
            padding: "22px 24px",
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            textAlign: "center"
          }}
        >
          <div style={{ fontSize: 40, lineHeight: 1, marginBottom: 6 }}>🔐</div>
          <h2 style={{ color: THEME.goldMain, margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: 0.5 }}>
            ACCESO TEMPORAL
          </h2>
          <p style={{ color: "rgba(255,255,255,0.75)", margin: "6px 0 0", fontSize: 12, letterSpacing: 0.3 }}>
            Vas a guardar una contraseña temporal y enviarla por WhatsApp
          </p>
        </div>

        {/* Cuerpo con datos del cliente y contraseña */}
        <div style={{ padding: "20px 24px" }}>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
            Cliente
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 8,
              padding: "14px 16px",
              borderRadius: 12,
              border: `1px solid rgba(255,255,255,0.18)`,
              background: "rgba(255,255,255,0.04)",
              marginBottom: 18
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
              <span style={{ color: "rgba(255,255,255,0.55)" }}>Nombre</span>
              <span style={{ color: "#fff", fontWeight: 600, textAlign: "right" }}>{editUsuarioForm.nombre || "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
              <span style={{ color: "rgba(255,255,255,0.55)" }}>Teléfono</span>
              <span style={{ color: "#fff", fontWeight: 600, textAlign: "right" }}>{confirmarTemporal.telefono || "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
              <span style={{ color: "rgba(255,255,255,0.55)" }}>Email</span>
              <span style={{ color: "#fff", fontWeight: 600, textAlign: "right", overflowWrap: "anywhere" }}>{confirmarTemporal.email || "—"}</span>
            </div>
          </div>

          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
            Contraseña temporal (caduca en 10 min)
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              borderRadius: 12,
              border: `2px solid ${THEME.goldMain}`,
              background: "rgba(212,175,55,0.12)",
              marginBottom: 18
            }}
          >
            <code style={{ color: THEME.goldMain, fontSize: 16, fontWeight: 700, flex: 1, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", overflowWrap: "anywhere" }}>
              {confirmarTemporal.password}
            </code>
            <button
              type="button"
              onClick={() => { void navigator.clipboard?.writeText(confirmarTemporal.password).catch(() => {}); }}
              aria-label="Copiar contraseña"
              title="Copiar contraseña"
              style={{
                background: "transparent",
                border: `1px solid ${THEME.goldMain}`,
                color: THEME.goldMain,
                borderRadius: 8,
                padding: "6px 10px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700
              }}
            >
              Copiar
            </button>
          </div>

          <div
            role="alert"
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              border: `1px solid rgba(255,180,80,0.4)`,
              background: "rgba(255,180,80,0.08)",
              color: "#ffcc80",
              fontSize: 12.5,
              lineHeight: 1.5,
              marginBottom: 18
            }}
          >
            ⚠️ Al confirmar se <strong>guardará en el servidor</strong> y se abrirá WhatsApp con el mensaje.
            El cliente deberá cambiarla al entrar. Si cancelas, no se guarda nada.
          </div>
        </div>

        {/* Botones grandes */}
        <div style={{ display: "flex", gap: 12, padding: "0 24px 22px" }}>
          <button
            type="button"
            onClick={() => setConfirmarTemporal(null)}
            disabled={guardandoTemporal}
            style={{
              flex: 1,
              padding: "14px 16px",
              borderRadius: 14,
              border: `1px solid rgba(255,255,255,0.3)`,
              background: "transparent",
              color: "rgba(255,255,255,0.8)",
              cursor: guardandoTemporal ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: 15
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={guardandoTemporal}
            onClick={async () => {
              const datos = confirmarTemporal;
              if (!datos) return;
              setGuardandoTemporal(true);
              try {
                await onSave();
                abrirWhatsappTemporal(datos.telefono, datos.email, datos.password);
              } catch {
                /* onSave ya notifica errores; no abrimos WhatsApp si falla */
              } finally {
                setGuardandoTemporal(false);
                setConfirmarTemporal(null);
              }
            }}
            style={{
              flex: 1.4,
              padding: "14px 16px",
              borderRadius: 14,
              border: `2px solid ${THEME.goldMain}`,
              background: "linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.1))",
              color: THEME.goldMain,
              cursor: guardandoTemporal ? "not-allowed" : "pointer",
              fontWeight: 800,
              fontSize: 15,
              letterSpacing: 0.3,
              opacity: guardandoTemporal ? 0.6 : 1
            }}
          >
            {guardandoTemporal ? "Guardando…" : "✓ Guardar y enviar por WhatsApp"}
          </button>
        </div>
      </ModalBase>
    )}
    </>
  );
}

