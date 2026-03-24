import { useState, useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { AuthForm, Usuario, Pedido, Pagina } from "../types";
import { inputStyle } from "../styles/inputStyle";
import BotonCerrar from "../components/BotonCerrar";
import { THEME } from "../config";
import { parseFechaPedido, textoFechaPedido } from "../utils/fechaPedido";
import { loginApi, registerApi } from "../services/apiAuth";
import { useAuth } from "../hooks/useAuth";

type MaikaPedidoProductoLS = {
  idProducto: number;
  nombre: string;
  precio: number;
  cantidad: number;
};

type MaikaPedidoLS = {
  idPedido: string;
  telefono: string;
  fecha: string;
  productos: MaikaPedidoProductoLS[];
  total: number;
  direccionCompleta: string;
  estado?: "pendiente" | "enviado" | "entregado";
  nota?: string;
};

export interface CuentaPageProps {
  formAuth: AuthForm;
  setFormAuth: Dispatch<SetStateAction<AuthForm>>;
  modoRegistro: "login" | "register";
  setModoRegistro: Dispatch<SetStateAction<"login" | "register">>;
  usuario: Usuario | null;
  setUsuario: Dispatch<SetStateAction<Usuario | null>>;
  reenvioDisponibleEn: number;
  setReenvioDisponibleEn: Dispatch<SetStateAction<number>>;
  provinciaPaisBloqueadosRegistro: boolean;
  mostrarNotificacion: (mensaje: string, tipo: "normal" | "exito" | "error") => void;
  precargarDatosClienteDesdeUsuario: (u: Usuario | null) => void;
  pedidos: Pedido[];
  onRepetirPedido: (pedido: MaikaPedidoLS) => void;
  enviarCodigoEmail: (email: string, nombre: string, codigo: string) => Promise<boolean>;
  setPagina: (p: Pagina) => void;
  telefonoForzadoRegistroDesdeAcceso: string;
  setTelefonoForzadoRegistroDesdeAcceso: Dispatch<SetStateAction<string>>;
  modoForzadoRegistroDesdeAcceso: "" | "registro" | "activar";
  setModoForzadoRegistroDesdeAcceso: Dispatch<SetStateAction<"" | "registro" | "activar">>;
  confirmacionIdentidadActivacion: boolean;
  setConfirmacionIdentidadActivacion: Dispatch<SetStateAction<boolean>>;
}

const formAuthReset: AuthForm = {
  nombre: "", email: "", password: "", telefono: "",
  confirmEmail: "", calle: "", bloque: "", escalera: "", piso: "", puerta: "", numero: "", cp: "", provincia: "", poblacion: "", pais: "España", confirmPassword: "",
  codigoVerificacion: "", codigoIngresado: "", pasoVerificacion: 1
};

/** Normaliza teléfono a 9 dígitos (España): quita prefijo 34/0034 y no numéricos */
function normalizarTelefono(t: string): string {
  const soloDigitos = (t || "").replace(/\D/g, "").trim();
  if (soloDigitos.startsWith("0034") && soloDigitos.length > 4) return soloDigitos.slice(4);
  if (soloDigitos.startsWith("34") && soloDigitos.length > 9) return soloDigitos.slice(2);
  return soloDigitos;
}

/** Misma lógica que en App (claveTelefonoES): solo móvil ES 6/7 + 8 dígitos → +34XXXXXXXXX */
function claveTelefonoMaika(telefono: string): string | null {
  const t9 = normalizarTelefono(telefono || "");
  if (!/^[67]\d{8}$/.test(t9)) return null;
  return `+34${t9}`;
}

function emailValidoLogin(s: string): boolean {
  const t = (s || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

function tieneEmailVerificable(email: string): boolean {
  return emailValidoLogin((email || "").trim().toLowerCase());
}

function passwordSeguraBasica(password: string): boolean {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(String(password || ""));
}

type EstadoCuentaRegistro = "no_existe" | "incompleta" | "actividad_sin_email" | "protegida";
function clasificarCuentaRegistroPorTelefono(telNorm: string): EstadoCuentaRegistro {
  if (!/^[67]\d{8}$/.test(telNorm)) return "no_existe";
  let usuarios: Usuario[] = [];
  try {
    const parsed = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
    usuarios = Array.isArray(parsed) ? parsed : [];
  } catch {
    usuarios = [];
  }
  const usuario = usuarios.find((u) => normalizarTelefono(u.telefono || "") === telNorm) || null;
  if (!usuario) return "no_existe";
  const tieneEmail = !!(usuario.email || "").trim();
  const tienePassword = !!String(usuario.password || "").trim();
  const tienePedidos = !!(usuario.pedidos && usuario.pedidos.length > 0);
  const tieneDireccion = !!((usuario.direccion || "").trim() || (usuario.calle || "").trim() || (usuario.cp || "").trim());
  if (tieneEmail || tienePassword) return "protegida";
  if (tienePedidos || tieneDireccion) return "actividad_sin_email";
  return "incompleta";
}

function RequisitosPasswordHint({ password }: { password: string }) {
  const tieneMinimo = (password || "").length >= 8;
  const tieneNumero = /\d/.test(password || "");
  return (
    <div style={{ marginTop: -2, marginBottom: 10, fontSize: 12, lineHeight: 1.45 }}>
      <div style={{ color: "rgba(255,255,255,0.78)" }}>Minimo 8 caracteres</div>
      <div style={{ color: tieneMinimo ? "rgba(126,205,143,0.95)" : "rgba(255,255,255,0.62)" }}>
        {tieneMinimo ? "✔" : "•"} Longitud correcta
      </div>
      <div style={{ color: tieneNumero ? "rgba(126,205,143,0.95)" : "rgba(255,255,255,0.62)" }}>
        {tieneNumero ? "✔" : "•"} Contiene numero
      </div>
    </div>
  );
}

const SESSION_LOGIN_TRAS_ACCESO_RAPIDO = "maika_login_tras_acceso_rapido";

function pedidoLegacyAMaika(p: Pedido): MaikaPedidoLS | null {
  const clave = claveTelefonoMaika(p.cliente?.telefono || "");
  if (!clave) return null;
  const c = p.cliente;
  const direccionCompleta =
    (c?.direccion || "").trim() ||
    `${(c?.calle || "").trim()}${(c?.numero || "").trim() ? `, Nº ${(c?.numero || "").trim()}` : ""}`.trim() ||
    "—";
  let fechaIso = p.fecha || "";
  const d = parseFechaPedido(p.fecha);
  if (d) fechaIso = d.toISOString();

  return {
    idPedido: String(p.numero),
    telefono: clave,
    fecha: fechaIso,
    productos: (p.items || []).map((it) => ({
      idProducto: Number(it.id),
      nombre: String(it.nombre || ""),
      precio: Number(it.precio || 0),
      cantidad: Number(it.cantidad || 0)
    })),
    total: Number(p.total || 0),
    direccionCompleta,
    estado: p.estado,
    nota: undefined
  };
}

function cargarPedidosUsuario(claveUsuario: string | null): MaikaPedidoLS[] {
  if (!claveUsuario) return [];

  let listaMaika: MaikaPedidoLS[] = [];
  try {
    const raw = localStorage.getItem("maika_pedidos");
    const parsed = raw ? JSON.parse(raw) : [];
    listaMaika = Array.isArray(parsed) ? (parsed as MaikaPedidoLS[]) : [];
  } catch {
    listaMaika = [];
  }

  const desdeMaika = listaMaika.filter((p) => claveTelefonoMaika(p.telefono || "") === claveUsuario);

  let desdeLegacy: MaikaPedidoLS[] = [];
  try {
    const rawL = localStorage.getItem("pedidosMaika");
    const legacy = rawL ? JSON.parse(rawL) : [];
    if (Array.isArray(legacy)) {
      desdeLegacy = (legacy as Pedido[])
        .map(pedidoLegacyAMaika)
        .filter((x): x is MaikaPedidoLS => x !== null && x.telefono === claveUsuario);
    }
  } catch {
    desdeLegacy = [];
  }

  const mapa = new Map<string, MaikaPedidoLS>();
  for (const p of desdeLegacy) mapa.set(String(p.idPedido), p);
  for (const p of desdeMaika) mapa.set(String(p.idPedido), p);

  return Array.from(mapa.values()).sort((a, b) => {
    const tb = parseFechaPedido(b.fecha)?.getTime() ?? 0;
    const ta = parseFechaPedido(a.fecha)?.getTime() ?? 0;
    return tb - ta;
  });
}

export default function CuentaPage({
  formAuth,
  setFormAuth,
  modoRegistro,
  setModoRegistro,
  usuario,
  setUsuario,
  reenvioDisponibleEn,
  setReenvioDisponibleEn,
  provinciaPaisBloqueadosRegistro,
  mostrarNotificacion,
  precargarDatosClienteDesdeUsuario,
  onRepetirPedido,
  enviarCodigoEmail,
  setPagina,
  telefonoForzadoRegistroDesdeAcceso,
  setTelefonoForzadoRegistroDesdeAcceso,
  modoForzadoRegistroDesdeAcceso,
  setModoForzadoRegistroDesdeAcceso,
  confirmacionIdentidadActivacion,
  setConfirmacionIdentidadActivacion
}: CuentaPageProps) {
  const { login: loginSesionJwt, logout: logoutSesionJwt } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const prevModoRef = useRef<"login" | "register" | null>(null);
  const nombreRegistroRef = useRef<HTMLInputElement>(null);
  const emailRegistroRef = useRef<HTMLInputElement>(null);
  const passwordRegistroRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRegistroRef = useRef<HTMLInputElement>(null);
  const botonEnviarCodigoRegistroRef = useRef<HTMLButtonElement>(null);
  const emailLoginRef = useRef<HTMLInputElement>(null);
  const passwordLoginRef = useRef<HTMLInputElement>(null);
  const botonLoginRef = useRef<HTMLButtonElement>(null);
  const telefonoRecuperarRef = useRef<HTMLInputElement>(null);
  const botonRecuperarRef = useRef<HTMLButtonElement>(null);
  const codigoRecuperarRef = useRef<HTMLInputElement>(null);
  const nuevaPasswordRecuperarRef = useRef<HTMLInputElement>(null);
  const botonActualizarPasswordRef = useRef<HTMLButtonElement>(null);

  // Estados para recuperar contraseña
  const [modoRecuperar, setModoRecuperar] = useState(false);
  const [pasoRecuperar, setPasoRecuperar] = useState(1);
  const [telefonoRecuperar, setTelefonoRecuperar] = useState("");
  const [codigoRecuperar, setCodigoRecuperar] = useState("");
  const [codigoIngresadoRecuperar, setCodigoIngresadoRecuperar] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [showNuevaPassword, setShowNuevaPassword] = useState(false);
  const claveUsuario = claveTelefonoMaika(usuario?.telefono || "");
  const [maikaPedidosUsuario, setMaikaPedidosUsuario] = useState<MaikaPedidoLS[]>([]);
  const [pedidoDetalleAbierto, setPedidoDetalleAbierto] = useState<MaikaPedidoLS | null>(null);

  const passwordWrapperStyle = { position: "relative" as const, marginBottom: 10 };
  const eyeBtnStyle = {
    position: "absolute" as const,
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 20,
    padding: 4,
    color: THEME.goldMain
  };
  const inputWithEyeStyle = { ...inputStyle, paddingRight: 44 };
  const telefonoForzadoRegistro = normalizarTelefono(telefonoForzadoRegistroDesdeAcceso || "").slice(0, 9);
  const registroForzadoDesdeAcceso = modoRegistro === "register" && !modoRecuperar && !!telefonoForzadoRegistro;
  const activacionForzadaDesdeAcceso = registroForzadoDesdeAcceso && modoForzadoRegistroDesdeAcceso === "activar";
  const telefonoForzadoEnmascarado =
    telefonoForzadoRegistro.length === 9
      ? `${telefonoForzadoRegistro.slice(0, 3)}****${telefonoForzadoRegistro.slice(7)}`
      : telefonoForzadoRegistro;

  // Vaciar telefono/email y contraseñas al mostrar Registrarse o Iniciar Sesión
  useEffect(() => {
    if (modoRegistro === "register" && prevModoRef.current !== "register") {
      setFormAuth((prev) => ({
        ...prev,
        telefono: telefonoForzadoRegistro || "",
        email: "",
        confirmEmail: "",
        password: "",
        confirmPassword: ""
      }));
    } else if (modoRegistro === "login" && prevModoRef.current !== "login") {
      setFormAuth((prev) => ({
        ...prev,
        email: "",
        confirmEmail: "",
        password: ""
      }));
    }
    prevModoRef.current = modoRegistro;
  }, [modoRegistro, setFormAuth, telefonoForzadoRegistro]);

  useEffect(() => {
    if (!registroForzadoDesdeAcceso) return;
    setFormAuth((prev) => ({ ...prev, telefono: telefonoForzadoRegistro }));
  }, [registroForzadoDesdeAcceso, telefonoForzadoRegistro, setFormAuth]);

  /** Tras acceso rápido (checkout): abrir Mi Cuenta con el correo ya validado. */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_LOGIN_TRAS_ACCESO_RAPIDO);
      if (!raw) return;
      sessionStorage.removeItem(SESSION_LOGIN_TRAS_ACCESO_RAPIDO);
      const parsed = JSON.parse(raw) as { email?: string };
      const em = (parsed?.email || "").trim().toLowerCase();
      if (!em) return;
      setFormAuth((prev) => ({ ...prev, email: em, confirmEmail: em, password: "", telefono: "" }));
      setModoRegistro("login");
      setModoRecuperar(false);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!usuario) {
      setMaikaPedidosUsuario([]);
      return;
    }
    const recargar = () => setMaikaPedidosUsuario(cargarPedidosUsuario(claveUsuario));
    recargar();
    window.addEventListener("focus", recargar);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "maika_pedidos" || e.key === "pedidosMaika") recargar();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", recargar);
      window.removeEventListener("storage", onStorage);
    };
  }, [claveUsuario, usuario]);

  if (!usuario) {
    return (
      <div style={{ maxWidth: 500, margin: "0 auto", position: "relative" }}>
        <BotonCerrar
          onClick={() => {
            setTelefonoForzadoRegistroDesdeAcceso("");
            setModoForzadoRegistroDesdeAcceso("");
            setConfirmacionIdentidadActivacion(false);
            setPagina("inicio");
          }}
          ariaLabel="Volver al inicio"
          title="Volver al inicio"
        />
        <h2 style={{ textAlign: "center", color: THEME.goldMain, marginBottom: 30 }}>👤 Mi Cuenta</h2>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <button
            onClick={() => {
              if (registroForzadoDesdeAcceso) return;
              setModoRegistro("login");
              setModoForzadoRegistroDesdeAcceso("");
              setConfirmacionIdentidadActivacion(false);
              setFormAuth({ ...formAuth, password: "", pasoVerificacion: 1 });
              setReenvioDisponibleEn(0);
              setModoRecuperar(false);
            }}
            style={{ flex: 1, padding: 12, background: modoRegistro === "login" && !modoRecuperar ? THEME.goldMain : "transparent", color: modoRegistro === "login" && !modoRecuperar ? "#1b1745" : THEME.goldMain, border: `2px solid ${THEME.goldMain}`, borderRadius: 10, cursor: registroForzadoDesdeAcceso ? "not-allowed" : "pointer", fontWeight: "bold", opacity: registroForzadoDesdeAcceso ? 0.55 : 1 }}
          >Iniciar Sesión</button>
          <button
            onClick={() => { setModoRegistro("register"); setModoForzadoRegistroDesdeAcceso(""); setConfirmacionIdentidadActivacion(false); setFormAuth((prev) => ({ ...prev, email: "", confirmEmail: "", password: "", confirmPassword: "", pasoVerificacion: 1 })); setReenvioDisponibleEn(0); setModoRecuperar(false); }}
            style={{ flex: 1, padding: 12, background: modoRegistro === "register" && !modoRecuperar ? THEME.goldMain : "transparent", color: modoRegistro === "register" && !modoRecuperar ? "#1b1745" : THEME.goldMain, border: `2px solid ${THEME.goldMain}`, borderRadius: 10, cursor: "pointer", fontWeight: "bold" }}
          >Registrarse</button>
        </div>
        <div style={{ background: THEME.bg, padding: 30, borderRadius: 20, border: `2px solid ${THEME.goldMain}` }}>
          {!modoRecuperar && modoRegistro === "register" && formAuth.pasoVerificacion === 1 && (
            <>
              <h3 style={{ color: THEME.goldMain, textAlign: "center", marginBottom: 20 }}>
                {activacionForzadaDesdeAcceso ? "Activa tu cuenta" : "Crea tu cuenta"}
              </h3>
              {registroForzadoDesdeAcceso ? (
                <p style={{ color: "rgba(255,255,255,0.9)", textAlign: "center", marginTop: -6, marginBottom: 14, fontWeight: 600 }}>
                  {activacionForzadaDesdeAcceso
                    ? "Este número ya tiene actividad. Activa tu cuenta para recuperar el acceso."
                    : "Completa tu registro para activar tu cuenta"}
                </p>
              ) : null}
              {activacionForzadaDesdeAcceso && confirmacionIdentidadActivacion ? (
                <p style={{ color: "#8ad9b2", textAlign: "center", marginTop: -6, marginBottom: 12, fontSize: 13 }}>
                  ✔ Identidad verificada correctamente
                </p>
              ) : null}
              <input
                ref={nombreRegistroRef}
                type="text"
                placeholder="Nombre completo *"
                value={formAuth.nombre}
                onChange={(e) => setFormAuth({ ...formAuth, nombre: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  emailRegistroRef.current?.focus();
                }}
                style={inputStyle}
              />
              <input
                type="tel"
                placeholder="Teléfono * (identificador de cuenta)"
                value={formAuth.telefono}
                onChange={(e) => {
                  if (registroForzadoDesdeAcceso) return;
                  setFormAuth({ ...formAuth, telefono: e.target.value.replace(/\D/g, "").slice(0, 11) });
                }}
                readOnly={registroForzadoDesdeAcceso}
                inputMode="numeric"
                maxLength={11}
                style={{ ...inputStyle, opacity: registroForzadoDesdeAcceso ? 0.82 : 1 }}
              />
              {registroForzadoDesdeAcceso ? (
                <p style={{ color: "rgba(201,162,74,0.95)", fontSize: 12, margin: "-4px 0 10px" }}>
                  Teléfono verificado: {telefonoForzadoEnmascarado}
                </p>
              ) : null}
              <input
                ref={emailRegistroRef}
                type="email"
                placeholder={registroForzadoDesdeAcceso ? "Email *" : "Email de confirmación (opcional)"}
                value={formAuth.confirmEmail}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormAuth({ ...formAuth, email: v, confirmEmail: v });
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  passwordRegistroRef.current?.focus();
                }}
                style={inputStyle}
                autoComplete="off"
              />
              <div style={passwordWrapperStyle}>
                <input
                  ref={passwordRegistroRef}
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña *"
                  value={formAuth.password}
                  onChange={(e) => setFormAuth({ ...formAuth, password: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    confirmPasswordRegistroRef.current?.focus();
                  }}
                  style={inputWithEyeStyle}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} style={eyeBtnStyle} title={showPassword ? "Ocultar contraseña" : "Ver contraseña"} aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}>{showPassword ? "🙈" : "👁"}</button>
              </div>
              <RequisitosPasswordHint password={formAuth.password} />
              <div style={passwordWrapperStyle}>
                <input
                  ref={confirmPasswordRegistroRef}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmar Contraseña *"
                  value={formAuth.confirmPassword}
                  onChange={(e) => setFormAuth({ ...formAuth, confirmPassword: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    botonEnviarCodigoRegistroRef.current?.click();
                  }}
                  style={inputStyle}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} style={eyeBtnStyle} title={showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"} aria-label={showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"}>{showConfirmPassword ? "🙈" : "👁"}</button>
              </div>
              {!registroForzadoDesdeAcceso && (
                <>
                  <input type="text" placeholder="Calle *" value={formAuth.calle} onChange={(e) => setFormAuth({ ...formAuth, calle: e.target.value })} style={inputStyle} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <input type="text" placeholder="Número *" value={formAuth.numero} onChange={(e) => setFormAuth({ ...formAuth, numero: e.target.value })} style={inputStyle} />
                    <input type="text" placeholder="Bloque (opcional)" value={formAuth.bloque} onChange={(e) => setFormAuth({ ...formAuth, bloque: e.target.value })} style={inputStyle} />
                    <input type="text" placeholder="Escalera (opcional)" value={formAuth.escalera} onChange={(e) => setFormAuth({ ...formAuth, escalera: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <input type="text" placeholder="Piso (opcional)" value={formAuth.piso} onChange={(e) => setFormAuth({ ...formAuth, piso: e.target.value })} style={inputStyle} />
                    <input type="text" placeholder="Puerta (opcional)" value={formAuth.puerta} onChange={(e) => setFormAuth({ ...formAuth, puerta: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <input type="text" placeholder="C.P. *" value={formAuth.cp} onChange={(e) => setFormAuth({ ...formAuth, cp: e.target.value.replace(/\D/g, "").slice(0, 5) })} inputMode="numeric" maxLength={5} style={inputStyle} />
                    <input type="text" placeholder="Provincia *" value={formAuth.provincia} onChange={(e) => setFormAuth({ ...formAuth, provincia: e.target.value })} readOnly={provinciaPaisBloqueadosRegistro} title={provinciaPaisBloqueadosRegistro ? "Autocompletado por C.P." : ""} style={{ ...inputStyle, opacity: provinciaPaisBloqueadosRegistro ? 0.85 : 1 }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <input type="text" placeholder="Población *" value={formAuth.poblacion} onChange={(e) => setFormAuth({ ...formAuth, poblacion: e.target.value })} style={inputStyle} />
                    <input type="text" placeholder="País *" value={formAuth.pais} onChange={(e) => setFormAuth({ ...formAuth, pais: e.target.value })} readOnly={provinciaPaisBloqueadosRegistro} title={provinciaPaisBloqueadosRegistro ? "Autocompletado por C.P." : ""} style={{ ...inputStyle, opacity: provinciaPaisBloqueadosRegistro ? 0.85 : 1 }} />
                  </div>
                  <p style={{ color: "white", fontSize: 13, marginTop: -2, marginBottom: 8, opacity: 0.85 }}>Dirección de facturación obligatoria para completar el registro</p>
                  <input type="text" placeholder="Dirección completa (autogenerada)" value={`${formAuth.calle || ""}${formAuth.numero ? `, Nº ${formAuth.numero}` : ""}${formAuth.bloque ? `, Bloque ${formAuth.bloque}` : ""}${formAuth.escalera ? `, Esc. ${formAuth.escalera}` : ""}${formAuth.piso ? `, Piso ${formAuth.piso}` : ""}${formAuth.puerta ? `, Puerta ${formAuth.puerta}` : ""}`} readOnly style={inputStyle} />
                </>
              )}
              <button
                ref={botonEnviarCodigoRegistroRef}
                onClick={async () => {
                  const telNorm = normalizarTelefono(formAuth.telefono);
                  if (!/^[67]\d{8}$/.test(telNorm)) { mostrarNotificacion("❌ El teléfono debe ser 9 dígitos (móvil España, 6 o 7)", "error"); return; }
                  const requiereDireccion = !registroForzadoDesdeAcceso;
                  if (!formAuth.nombre || !formAuth.telefono || !formAuth.password || !formAuth.confirmPassword) { mostrarNotificacion("❌ Completa todos los campos obligatorios", "error"); return; }
                  if (registroForzadoDesdeAcceso && !(formAuth.email || "").trim()) { mostrarNotificacion("❌ El email es obligatorio para crear tu cuenta", "error"); return; }
                  if (requiereDireccion && (!formAuth.calle || !formAuth.numero || !formAuth.cp || !formAuth.provincia || !formAuth.poblacion || !formAuth.pais)) { mostrarNotificacion("❌ Completa todos los campos obligatorios", "error"); return; }
                  if (formAuth.password !== formAuth.confirmPassword) { mostrarNotificacion("❌ Las contraseñas no coinciden", "error"); return; }
                  if (!passwordSeguraBasica(formAuth.password)) {
                    mostrarNotificacion("❌ La contraseña debe tener mínimo 8 caracteres, con letras y números", "error");
                    return;
                  }
                  const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
                  const estadoCuenta = clasificarCuentaRegistroPorTelefono(telNorm);
                  if (activacionForzadaDesdeAcceso) {
                    if (estadoCuenta !== "actividad_sin_email") {
                      mostrarNotificacion("❌ Este número no puede activarse desde este flujo", "error");
                      return;
                    }
                  } else if (registroForzadoDesdeAcceso) {
                    if (estadoCuenta === "protegida" || estadoCuenta === "actividad_sin_email") {
                      mostrarNotificacion("❌ Este número ya está registrado. Inicia sesión.", "error");
                      return;
                    }
                  } else if (estadoCuenta === "protegida" || estadoCuenta === "actividad_sin_email") {
                    mostrarNotificacion("❌ Este número ya está registrado. Inicia sesión.", "error");
                    return;
                  }
                  const emailNorm = (formAuth.email || "").trim().toLowerCase();
                  if (emailNorm) {
                    const emailDuplicado = usuarios.some((u: Usuario) => (u.email || "").trim().toLowerCase() === emailNorm);
                    if (emailDuplicado) { mostrarNotificacion("❌ Usuario registrado: ese email ya existe. Inicia sesión.", "error"); return; }
                  }
                  const emailParaCodigo = (formAuth.email || "").trim().toLowerCase();
                  if (!tieneEmailVerificable(emailParaCodigo)) {
                    mostrarNotificacion("❌ Debes indicar un email válido para verificar la cuenta", "error");
                    return;
                  }
                  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
                  mostrarNotificacion("📧 Enviando código al email...", "normal");
                  try {
                    const enviado = await enviarCodigoEmail(emailParaCodigo, formAuth.nombre, codigo);
                    if (enviado) {
                      setFormAuth({ ...formAuth, email: emailParaCodigo, confirmEmail: emailParaCodigo, codigoVerificacion: codigo, pasoVerificacion: 2 });
                      setReenvioDisponibleEn(60);
                      mostrarNotificacion(`✅ Código enviado a ${emailParaCodigo}`, "exito");
                    } else {
                      mostrarNotificacion("❌ Error al enviar el código. Revisa la consola (F12)", "error");
                    }
                  } catch {
                    mostrarNotificacion("❌ Error al enviar el código", "error");
                  }
                }}
                style={{ width: "100%", padding: 12, background: THEME.goldMain, color: "#1b1745", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: 16, marginTop: 20 }}
              >{activacionForzadaDesdeAcceso ? "Enviar código de activación" : "Enviar código de verificación"}</button>
            </>
          )}
          {!modoRecuperar && modoRegistro === "register" && formAuth.pasoVerificacion === 2 && (
            <>
              <h3 style={{ color: THEME.goldMain, textAlign: "center", marginBottom: 20 }}>
                {activacionForzadaDesdeAcceso ? "Paso 2: Activar cuenta" : "Paso 2: Verificar cuenta"}
              </h3>
              <p style={{ color: "white", textAlign: "center", marginBottom: 20 }}>{formAuth.email?.trim() ? `Hemos enviado un código a ${formAuth.email}` : "Introduce el código que te hemos mostrado"}</p>
              <p style={{ color: "white", textAlign: "center", fontSize: 13, marginTop: -8, marginBottom: 16, opacity: 0.85 }}>{formAuth.email?.trim() ? "El mensaje suele llegar en menos de 1 minuto. Revisa también spam." : "Si no lo anotaste, vuelve atrás y pon un email para recibir el código."}</p>
              <input type="text" placeholder="Código de 6 dígitos" value={formAuth.codigoIngresado || ""} onChange={(e) => setFormAuth({ ...formAuth, codigoIngresado: e.target.value })} style={inputStyle} />
              <button
                onClick={async () => {
                  if (formAuth.codigoIngresado === formAuth.codigoVerificacion) {
                    const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
                    const direccionCompleta = registroForzadoDesdeAcceso
                      ? ""
                      : `${(formAuth.calle || "").trim()}, Nº ${(formAuth.numero || "").trim()}${(formAuth.bloque || "").trim() ? `, Bloque ${(formAuth.bloque || "").trim()}` : ""}${(formAuth.escalera || "").trim() ? `, Esc. ${(formAuth.escalera || "").trim()}` : ""}${(formAuth.piso || "").trim() ? `, Piso ${(formAuth.piso || "").trim()}` : ""}${(formAuth.puerta || "").trim() ? `, Puerta ${(formAuth.puerta || "").trim()}` : ""}`;
                    const telefonoNorm = normalizarTelefono(formAuth.telefono);
                    const indexExistente = usuarios.findIndex((u: Usuario) => normalizarTelefono(u.telefono || "") === telefonoNorm);
                    const estadoCuenta = clasificarCuentaRegistroPorTelefono(telefonoNorm);
                    if (activacionForzadaDesdeAcceso) {
                      if (estadoCuenta !== "actividad_sin_email") {
                        mostrarNotificacion("❌ Este número no puede activarse desde este flujo", "error");
                        return;
                      }
                    } else if (registroForzadoDesdeAcceso) {
                      if (estadoCuenta === "protegida" || estadoCuenta === "actividad_sin_email") {
                        mostrarNotificacion("❌ Este número ya está registrado. Inicia sesión.", "error");
                        return;
                      }
                    } else if (estadoCuenta === "protegida" || estadoCuenta === "actividad_sin_email") {
                      mostrarNotificacion("❌ Este número ya está registrado. Inicia sesión.", "error");
                      return;
                    }
                    const emailNorm = (formAuth.email || "").trim().toLowerCase();
                    if (emailNorm) {
                      const emailDuplicado = usuarios.some((u: Usuario) => (u.email || "").trim().toLowerCase() === emailNorm && normalizarTelefono(u.telefono || "") !== telefonoNorm);
                      if (emailDuplicado) { mostrarNotificacion("❌ Usuario registrado: ese email ya existe. Inicia sesión.", "error"); return; }
                    }
                    const emailVerificado = (formAuth.email || "").trim().toLowerCase();
                    const nuevoUsuario: Usuario = {
                      id: Date.now(), nombre: formAuth.nombre, email: (formAuth.email || "").trim(), telefono: formAuth.telefono,
                      calle: registroForzadoDesdeAcceso ? "" : formAuth.calle,
                      bloque: registroForzadoDesdeAcceso ? "" : formAuth.bloque,
                      escalera: registroForzadoDesdeAcceso ? "" : formAuth.escalera,
                      piso: registroForzadoDesdeAcceso ? "" : formAuth.piso,
                      puerta: registroForzadoDesdeAcceso ? "" : formAuth.puerta,
                      numero: registroForzadoDesdeAcceso ? "" : formAuth.numero,
                      direccion: direccionCompleta,
                      cp: registroForzadoDesdeAcceso ? "" : formAuth.cp,
                      provincia: registroForzadoDesdeAcceso ? "" : formAuth.provincia,
                      poblacion: registroForzadoDesdeAcceso ? "" : formAuth.poblacion,
                      pais: registroForzadoDesdeAcceso ? "" : formAuth.pais,
                      password: formAuth.password, verificado: tieneEmailVerificable(emailVerificado), pedidos: []
                    };
                    
                    // Si el usuario ya existía sin registrar (por haber comprado antes), lo actualizamos en vez de crear uno nuevo (por teléfono)
                    if (indexExistente !== -1) {
                      // Mantenemos el ID original y sus pedidos, actualizamos el resto
                      usuarios[indexExistente] = { 
                        ...usuarios[indexExistente],
                        nombre: formAuth.nombre,
                        email: emailVerificado || (usuarios[indexExistente].email || "").trim().toLowerCase(),
                        telefono: formAuth.telefono,
                        calle: registroForzadoDesdeAcceso ? (usuarios[indexExistente].calle || "") : formAuth.calle,
                        bloque: registroForzadoDesdeAcceso ? (usuarios[indexExistente].bloque || "") : formAuth.bloque,
                        escalera: registroForzadoDesdeAcceso ? (usuarios[indexExistente].escalera || "") : formAuth.escalera,
                        piso: registroForzadoDesdeAcceso ? (usuarios[indexExistente].piso || "") : formAuth.piso,
                        puerta: registroForzadoDesdeAcceso ? (usuarios[indexExistente].puerta || "") : formAuth.puerta,
                        numero: registroForzadoDesdeAcceso ? (usuarios[indexExistente].numero || "") : formAuth.numero,
                        direccion: registroForzadoDesdeAcceso ? (usuarios[indexExistente].direccion || "") : direccionCompleta,
                        cp: registroForzadoDesdeAcceso ? (usuarios[indexExistente].cp || "") : formAuth.cp,
                        provincia: registroForzadoDesdeAcceso ? (usuarios[indexExistente].provincia || "") : formAuth.provincia,
                        poblacion: registroForzadoDesdeAcceso ? (usuarios[indexExistente].poblacion || "") : formAuth.poblacion,
                        pais: registroForzadoDesdeAcceso ? (usuarios[indexExistente].pais || "") : formAuth.pais,
                        password: formAuth.password,
                        verificado: tieneEmailVerificable(emailVerificado)
                      };
                      setUsuario(usuarios[indexExistente]);
                      localStorage.setItem("usuarioActual", JSON.stringify(usuarios[indexExistente]));
                      precargarDatosClienteDesdeUsuario(usuarios[indexExistente]);
                    } else {
                      if (activacionForzadaDesdeAcceso) {
                        mostrarNotificacion("❌ No se encontró una cuenta existente para activar", "error");
                        return;
                      }
                      // Blindaje final: si el email ya existe, no crear usuario duplicado
                      if (emailNorm) {
                        const idxEmail = usuarios.findIndex((u: Usuario) => (u.email || "").trim().toLowerCase() === emailNorm);
                        if (idxEmail !== -1) { mostrarNotificacion("❌ Usuario registrado: ese email ya existe. Inicia sesión.", "error"); return; }
                      }
                      usuarios.push(nuevoUsuario);
                      setUsuario(nuevoUsuario);
                      localStorage.setItem("usuarioActual", JSON.stringify(nuevoUsuario));
                      precargarDatosClienteDesdeUsuario(nuevoUsuario);
                    }
                    
                    localStorage.setItem("usuarios", JSON.stringify(usuarios));
                    try {
                      const emailRegistro = (formAuth.email || "").trim();
                      if (emailRegistro && formAuth.password) {
                        await registerApi({
                          email: emailRegistro,
                          password: formAuth.password,
                          telefono: formAuth.telefono,
                          nombre: formAuth.nombre
                        });
                      }
                    } catch {
                      // Registro backend opcional: no bloquea el alta local.
                    }
                    
                    mostrarNotificacion(`✅ Cuenta verificada y registrada con éxito: ${formAuth.nombre}`, "exito");
                    setTelefonoForzadoRegistroDesdeAcceso("");
                    setModoForzadoRegistroDesdeAcceso("");
                    setConfirmacionIdentidadActivacion(false);
                    setFormAuth(formAuthReset);
                    setReenvioDisponibleEn(0);
                  } else { mostrarNotificacion("❌ Código incorrecto", "error"); }
                }}
                style={{ width: "100%", padding: 12, background: THEME.goldMain, color: "#1b1745", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: 16, marginTop: 10 }}
              >{activacionForzadaDesdeAcceso ? "Verificar y activar cuenta" : "Verificar y completar registro"}</button>
              <button
                onClick={async () => {
                  if (reenvioDisponibleEn > 0) return;
                  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
                  const emailR = (formAuth.email || "").trim().toLowerCase();
                  if (!tieneEmailVerificable(emailR)) {
                    mostrarNotificacion("❌ Debes indicar un email válido para reenviar el código", "error");
                    return;
                  }
                  mostrarNotificacion("📧 Reenviando código...", "normal");
                  const enviado = await enviarCodigoEmail(emailR, formAuth.nombre, codigo);
                  if (enviado) {
                    setFormAuth((prev) => ({ ...prev, email: emailR, confirmEmail: emailR, codigoVerificacion: codigo }));
                    setReenvioDisponibleEn(60);
                    mostrarNotificacion(`✅ Nuevo código enviado a ${emailR}`, "exito");
                  } else {
                    mostrarNotificacion("❌ No se pudo reenviar el código", "error");
                  }
                }}
                disabled={reenvioDisponibleEn > 0}
                style={{ width: "100%", padding: 12, background: reenvioDisponibleEn > 0 ? "#666" : THEME.bg, color: THEME.goldMain, border: `2px solid ${THEME.goldMain}`, borderRadius: 10, cursor: reenvioDisponibleEn > 0 ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: 15, marginTop: 10, opacity: reenvioDisponibleEn > 0 ? 0.85 : 1 }}
              >{reenvioDisponibleEn > 0 ? `Reenviar código en ${reenvioDisponibleEn}s` : "Reenviar código"}</button>
              <button onClick={() => { setFormAuth({ ...formAuth, pasoVerificacion: 1 }); setReenvioDisponibleEn(0); }} style={{ width: "100%", padding: 12, background: "transparent", color: THEME.goldMain, border: `2px solid ${THEME.goldMain}`, borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: 16, marginTop: 10 }}>← Volver</button>
            </>
          )}
          {!modoRecuperar && modoRegistro === "login" && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                void (async () => {
                const emailNorm = (formAuth.email || "").trim().toLowerCase();
                if (!emailNorm || !formAuth.password) {
                  mostrarNotificacion("❌ Introduce correo y contraseña", "error");
                  return;
                }
                if (!emailValidoLogin(emailNorm)) {
                  mostrarNotificacion("❌ Introduce un correo electrónico válido", "error");
                  return;
                }
                const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
                const usuarioPorEmail = usuarios.find(
                  (u: Usuario) => (u.email || "").trim().toLowerCase() === emailNorm
                );

                try {
                  const auth = await loginApi(emailNorm, formAuth.password);
                  loginSesionJwt(auth.token, auth.user);
                  const usuarioSesion: Usuario = usuarioPorEmail ?? {
                    id: Number(auth.user.id) || Date.now(),
                    nombre: auth.user.nombre || emailNorm.split("@")[0] || "Usuario",
                    email: auth.user.email || emailNorm,
                    telefono: auth.user.telefono || "",
                    direccion: "",
                    password: "",
                    verificado: tieneEmailVerificable(auth.user.email || emailNorm),
                    pedidos: []
                  };
                  setUsuario(usuarioSesion);
                  localStorage.setItem("usuarioActual", JSON.stringify(usuarioSesion));
                  precargarDatosClienteDesdeUsuario(usuarioSesion);
                  mostrarNotificacion(`✅ Bienvenido ${usuarioSesion.nombre}`, "exito");
                  setTelefonoForzadoRegistroDesdeAcceso("");
                  setModoForzadoRegistroDesdeAcceso("");
                  setConfirmacionIdentidadActivacion(false);
                  setFormAuth(formAuthReset);
                  return;
                } catch {
                  // Fallback local para no romper cuentas antiguas sin backend.
                }

                if (!usuarioPorEmail) {
                  mostrarNotificacion("❌ Correo o contraseña incorrectos", "error");
                  return;
                }

                const cuentaVerificada = !!usuarioPorEmail.verificado && tieneEmailVerificable(usuarioPorEmail.email || "");
                if (!cuentaVerificada) {
                  mostrarNotificacion("⚠️ Esta cuenta está pendiente de registro. Completa los datos en la pestaña 'Registrarse'.", "error");
                  setModoRegistro("register");
                  setFormAuth({
                    ...formAuth,
                    nombre: usuarioPorEmail.nombre || "",
                    telefono: usuarioPorEmail.telefono || formAuth.telefono,
                    calle: usuarioPorEmail.calle || "",
                    bloque: usuarioPorEmail.bloque || "",
                    escalera: usuarioPorEmail.escalera || "",
                    piso: usuarioPorEmail.piso || "",
                    puerta: usuarioPorEmail.puerta || "",
                    numero: usuarioPorEmail.numero || "",
                    cp: usuarioPorEmail.cp || "",
                    provincia: usuarioPorEmail.provincia || "",
                    poblacion: usuarioPorEmail.poblacion || "",
                    pais: usuarioPorEmail.pais || "España",
                    password: "",
                    confirmPassword: "",
                    email: usuarioPorEmail.email || "",
                    confirmEmail: usuarioPorEmail.email || ""
                  });
                  return;
                }

                if (usuarioPorEmail.password !== formAuth.password) {
                  mostrarNotificacion("❌ Correo o contraseña incorrectos", "error");
                  return;
                }

                setUsuario(usuarioPorEmail);
                localStorage.setItem("usuarioActual", JSON.stringify(usuarioPorEmail));
                precargarDatosClienteDesdeUsuario(usuarioPorEmail);
                mostrarNotificacion(`✅ Bienvenido ${usuarioPorEmail.nombre}`, "exito");
                setTelefonoForzadoRegistroDesdeAcceso("");
                setModoForzadoRegistroDesdeAcceso("");
                setConfirmacionIdentidadActivacion(false);
                setFormAuth(formAuthReset);
                })();
              }} 
              autoComplete="off"
            >
              <input
                ref={emailLoginRef}
                type="email"
                placeholder="Correo electrónico"
                value={formAuth.email}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormAuth({ ...formAuth, email: v, confirmEmail: v });
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  passwordLoginRef.current?.focus();
                }}
                style={inputStyle}
                autoComplete="email"
                name="login-email"
              />
              <div style={passwordWrapperStyle}>
                <input
                  ref={passwordLoginRef}
                  type={showPasswordLogin ? "text" : "password"}
                  placeholder="Contraseña"
                  value={formAuth.password}
                  onChange={(e) => setFormAuth({ ...formAuth, password: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    botonLoginRef.current?.click();
                  }}
                  style={inputWithEyeStyle}
                  autoComplete="new-password"
                  name="login-password"
                />
                <button type="button" onClick={() => setShowPasswordLogin((v) => !v)} style={eyeBtnStyle} title={showPasswordLogin ? "Ocultar contraseña" : "Ver contraseña"} aria-label={showPasswordLogin ? "Ocultar contraseña" : "Ver contraseña"}>{showPasswordLogin ? "🙈" : "👁"}</button>
              </div>
              <button
                ref={botonLoginRef}
                type="submit"
                style={{ width: "100%", padding: 12, background: THEME.goldMain, color: "#1b1745", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: 16, marginTop: 10 }}
              >Iniciar Sesión</button>
              <div style={{ textAlign: "center", marginTop: 15 }}>
                <button type="button" onClick={() => { 
                  setModoRecuperar(true); 
                  setPasoRecuperar(1); 
                  setTelefonoRecuperar("");
                  setCodigoIngresadoRecuperar(""); 
                  setNuevaPassword(""); 
                }} style={{ background: "none", border: "none", color: THEME.goldMain, cursor: "pointer", textDecoration: "underline", fontSize: 14 }}>¿Olvidaste tu contraseña?</button>
              </div>
            </form>
          )}
          {modoRecuperar && (
            <>
              {pasoRecuperar === 1 && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const telNorm = normalizarTelefono(telefonoRecuperar);
                    if (!/^[67]\d{8}$/.test(telNorm)) { mostrarNotificacion("❌ Introduce un teléfono válido (9 dígitos)", "error"); return; }
                    const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
                    const usuarioEncontrado = usuarios.find((u: Usuario) => normalizarTelefono(u.telefono || "") === telNorm);
                    if (!usuarioEncontrado) { mostrarNotificacion("❌ No existe ninguna cuenta con ese teléfono", "error"); return; }
                    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
                    setCodigoRecuperar(codigo);
                    setPasoRecuperar(2);
                    const emailUser = (usuarioEncontrado.email || "").trim();
                    if (emailUser) {
                      mostrarNotificacion("📧 Enviando código al email...", "normal");
                      try {
                        const enviado = await enviarCodigoEmail(emailUser, usuarioEncontrado.nombre, codigo);
                        if (enviado) { mostrarNotificacion(`✅ Código enviado a ${emailUser}`, "exito"); }
                        else { mostrarNotificacion("❌ Error al enviar. Código mostrado: " + codigo, "error"); }
                      } catch { mostrarNotificacion("❌ Error. Tu código es: " + codigo, "error"); }
                    } else {
                      mostrarNotificacion(`✅ Tu código de recuperación es: ${codigo}`, "exito");
                    }
                  }}
                  autoComplete="off"
                >
                  <h3 style={{ color: THEME.goldMain, textAlign: "center", marginBottom: 20 }}>Recuperar Contraseña</h3>
                  <p style={{ color: "white", textAlign: "center", marginBottom: 20 }}>Introduce tu teléfono para recibir un código de recuperación.</p>
                  <input
                    ref={telefonoRecuperarRef}
                    type="tel"
                    placeholder="Teléfono (9 dígitos)"
                    value={telefonoRecuperar}
                    onChange={(e) => setTelefonoRecuperar(e.target.value.replace(/\D/g, "").slice(0, 11))}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      botonRecuperarRef.current?.click();
                    }}
                    style={inputStyle}
                    inputMode="numeric"
                    autoComplete="tel"
                    name="telefono-recuperacion"
                  />
                  <button
                    ref={botonRecuperarRef}
                    type="submit"
                    style={{ width: "100%", padding: 12, background: THEME.goldMain, color: "#1b1745", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: 16, marginTop: 10 }}
                  >Recuperar contraseña</button>
                  <button type="button" onClick={() => setModoRecuperar(false)} style={{ width: "100%", padding: 12, background: "transparent", color: THEME.goldMain, border: `2px solid ${THEME.goldMain}`, borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: 16, marginTop: 10 }}>← Cancelar</button>
                </form>
              )}
              {pasoRecuperar === 2 && (
                <>
                  <h3 style={{ color: THEME.goldMain, textAlign: "center", marginBottom: 20 }}>Verificar y Cambiar</h3>
                  <p style={{ color: "white", textAlign: "center", marginBottom: 20 }}>Introduce el código recibido y tu nueva contraseña.</p>
                  <input
                    ref={codigoRecuperarRef}
                    type="text"
                    placeholder="Código de verificación"
                    value={codigoIngresadoRecuperar}
                    onChange={(e) => setCodigoIngresadoRecuperar(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      nuevaPasswordRecuperarRef.current?.focus();
                    }}
                    style={inputStyle}
                    autoComplete="off"
                    name="codigo-recuperacion"
                  />
                  <div style={passwordWrapperStyle}>
                    <input
                      ref={nuevaPasswordRecuperarRef}
                      type={showNuevaPassword ? "text" : "password"}
                      placeholder="Nueva Contraseña"
                      value={nuevaPassword}
                      onChange={(e) => setNuevaPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        botonActualizarPasswordRef.current?.click();
                      }}
                      style={inputWithEyeStyle}
                      autoComplete="new-password"
                      name="nueva-password"
                    />
                    <button type="button" onClick={() => setShowNuevaPassword((v) => !v)} style={eyeBtnStyle} title={showNuevaPassword ? "Ocultar contraseña" : "Ver contraseña"} aria-label={showNuevaPassword ? "Ocultar contraseña" : "Ver contraseña"}>{showNuevaPassword ? "🙈" : "👁"}</button>
                  </div>
                  <RequisitosPasswordHint password={nuevaPassword} />
                  <button
                    ref={botonActualizarPasswordRef}
                    onClick={() => {
                      if (!codigoIngresadoRecuperar || !nuevaPassword) { mostrarNotificacion("❌ Completa todos los campos", "error"); return; }
                      if (!passwordSeguraBasica(nuevaPassword)) {
                        mostrarNotificacion("❌ La contraseña debe tener mínimo 8 caracteres, con letras y números", "error");
                        return;
                      }
                      if (codigoIngresadoRecuperar !== codigoRecuperar) { mostrarNotificacion("❌ Código incorrecto", "error"); return; }
                      const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
                      const telNorm = normalizarTelefono(telefonoRecuperar);
                      const index = usuarios.findIndex((u: Usuario) => normalizarTelefono(u.telefono || "") === telNorm);
                      if (index !== -1) {
                        usuarios[index].password = nuevaPassword;
                        const emailRecuperado = (usuarios[index].email || "").trim().toLowerCase();
                        localStorage.setItem("usuarios", JSON.stringify(usuarios));
                        mostrarNotificacion("✅ Contraseña actualizada correctamente", "exito");
                        setModoRecuperar(false);
                        setPasoRecuperar(1);
                        setCodigoIngresadoRecuperar("");
                        setNuevaPassword("");
                        setModoRegistro("login");
                        setFormAuth((prev) => ({
                          ...prev,
                          telefono: telefonoRecuperar,
                          email: emailRecuperado,
                          confirmEmail: emailRecuperado,
                          password: ""
                        }));
                      } else { mostrarNotificacion("❌ Error inesperado", "error"); }
                    }}
                    style={{ width: "100%", padding: 12, background: THEME.goldMain, color: "#1b1745", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: 16, marginTop: 10 }}
                  >Actualizar Contraseña</button>
                  <button onClick={() => { setPasoRecuperar(1); setTelefonoRecuperar(""); }} style={{ width: "100%", padding: 12, background: "transparent", color: THEME.goldMain, border: `2px solid ${THEME.goldMain}`, borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: 16, marginTop: 10 }}>← Volver</button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  const estadoTexto = (estado?: MaikaPedidoLS["estado"]) => {
    if (estado === "enviado") return "🚚 Enviado";
    if (estado === "entregado") return "✅ Entregado";
    return "🛒 Pendiente";
  };

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", position: "relative" }}>
      <BotonCerrar
        onClick={() => {
          setTelefonoForzadoRegistroDesdeAcceso("");
          setModoForzadoRegistroDesdeAcceso("");
          setConfirmacionIdentidadActivacion(false);
          setPagina("inicio");
        }}
        ariaLabel="Volver al inicio"
        title="Volver al inicio"
      />
      <h2 style={{ textAlign: "center", color: THEME.goldMain, marginBottom: 30 }}>👤 Mi Cuenta</h2>
      <div style={{ background: THEME.bg, padding: 20, borderRadius: 20, border: `2px solid ${THEME.goldMain}`, marginBottom: 20 }}>
        <h3 style={{ color: THEME.goldMain, marginBottom: 15 }}>Bienvenido, {usuario.nombre}</h3>
        <p style={{ color: "white" }}>📞 {usuario.telefono || "—"}</p>
        {usuario.email && <p style={{ color: "white" }}>📧 {usuario.email}</p>}
        {usuario.direccion && <p style={{ color: "white" }}>📍 {usuario.direccion}</p>}
        {(usuario.cp || usuario.poblacion || usuario.provincia || usuario.pais) && (
          <p style={{ color: "white" }}>🗺️ {usuario.cp || ""} {usuario.poblacion || ""}{usuario.provincia ? `, ${usuario.provincia}` : ""}{usuario.pais ? `, ${usuario.pais}` : ""}</p>
        )}
        <button onClick={() => { logoutSesionJwt(); setUsuario(null); localStorage.removeItem("usuarioActual"); mostrarNotificacion("👋 Sesión cerrada", "normal"); }} style={{ background: "transparent", color: "#ff4444", border: "2px solid #ff4444", padding: "8px 20px", borderRadius: 10, cursor: "pointer", fontWeight: "bold", marginTop: 10 }}>Cerrar Sesión</button>
      </div>
      <h3 style={{ color: THEME.goldMain, marginBottom: 15 }}>📦 Mis Pedidos</h3>
      {!claveUsuario && (
        <p style={{ color: "#ffb3b3", textAlign: "center", padding: 12, background: THEME.bg, borderRadius: 12, fontSize: 13, marginBottom: 12 }}>
          Tu cuenta no tiene un teléfono móvil válido (9 dígitos, 6 o 7). Los pedidos se asocian al teléfono; revisa tus datos o contacta si falta.
        </p>
      )}
      {maikaPedidosUsuario.length === 0 ? (
        <p style={{ color: "white", textAlign: "center", padding: 20, background: THEME.bg, borderRadius: 20 }}>No tienes pedidos aún</p>
      ) : (
        maikaPedidosUsuario.map((p) => {
          const resumenProductos = (p.productos || []).reduce((sum, pr) => sum + (Number(pr.cantidad) || 0), 0);
          return (
            <div key={p.idPedido} style={{ background: THEME.bg, padding: 15, borderRadius: 15, border: `1px solid ${THEME.goldMain}`, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <strong style={{ color: THEME.goldMain }}>
                  {textoFechaPedido(p.fecha, false)}
                </strong>
                <span style={{ color: "white", fontSize: 12 }}>{estadoTexto(p.estado)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ color: "white" }}>Total: {Number(p.total || 0).toFixed(2)} €</span>
                <span style={{ color: "white" }}>{resumenProductos} productos</span>
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                <button
                  onClick={() => setPedidoDetalleAbierto(p)}
                  style={{ flex: 1, padding: 10, background: "transparent", color: THEME.goldMain, border: `1px solid ${THEME.goldMain}`, borderRadius: 10, cursor: "pointer", fontWeight: "bold" }}
                >
                  Ver detalles
                </button>
                <button
                  onClick={() => onRepetirPedido(p)}
                  style={{ flex: 1, padding: 10, background: THEME.goldMain, color: "#1b1745", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "bold" }}
                >
                  Repetir pedido
                </button>
              </div>
            </div>
          );
        })
      )}

      {pedidoDetalleAbierto && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(5px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 12000
          }}
          onClick={() => setPedidoDetalleAbierto(null)}
        >
          <div
            style={{
              background: THEME.bg,
              border: `3px solid ${THEME.goldMain}`,
              borderRadius: 30,
              padding: "28px 26px",
              maxWidth: 520,
              width: "90%",
              boxShadow: "0 0 50px rgba(255,215,0,0.35)",
              textAlign: "center"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 44, marginBottom: 6 }}>🧾</div>
            <h3 style={{ color: THEME.goldMain, marginBottom: 10 }}>
              Detalles del pedido ({String(pedidoDetalleAbierto.idPedido ?? "").slice(-6)})
            </h3>
            <p style={{ color: "white", marginBottom: 10 }}>
              Fecha: {textoFechaPedido(pedidoDetalleAbierto.fecha, true)}
            </p>
            <p style={{ color: "white", marginBottom: 10 }}>
              Dirección: {pedidoDetalleAbierto.direccionCompleta || "—"}
            </p>
            <div style={{ color: "white", textAlign: "left", marginTop: 12 }}>
              {(pedidoDetalleAbierto.productos || []).map((pr, idx) => (
                <div key={`${pr.idProducto}-${idx}`} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                  <span>{pr.nombre} x {pr.cantidad}</span>
                  <span>{Number(pr.precio || 0).toFixed(2)} €</span>
                </div>
              ))}
            </div>
            <p style={{ color: THEME.goldMain, fontWeight: "bold", marginTop: 12 }}>
              Total: {Number(pedidoDetalleAbierto.total || 0).toFixed(2)} €
            </p>
            {pedidoDetalleAbierto.nota && (
              <p style={{ color: "white", marginTop: 10, opacity: 0.95 }}>
                Nota: {pedidoDetalleAbierto.nota}
              </p>
            )}
            <button
              onClick={() => setPedidoDetalleAbierto(null)}
              style={{ width: "100%", marginTop: 16, padding: 12, background: "transparent", color: THEME.goldMain, border: `2px solid ${THEME.goldMain}`, borderRadius: 15, cursor: "pointer", fontWeight: "bold" }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
