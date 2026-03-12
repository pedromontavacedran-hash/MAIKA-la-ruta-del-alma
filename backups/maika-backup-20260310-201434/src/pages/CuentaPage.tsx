import { useState, useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { AuthForm, Usuario, Pedido, Pagina } from "../types";
import { inputStyle } from "../styles/inputStyle";

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
  enviarCodigoEmail: (email: string, nombre: string, codigo: string) => Promise<boolean>;
  setPagina: (p: Pagina) => void;
}

const formAuthReset: AuthForm = {
  nombre: "", email: "", password: "", telefono: "",
  confirmEmail: "", calle: "", bloque: "", escalera: "", piso: "", puerta: "", numero: "", cp: "", provincia: "", poblacion: "", pais: "España", confirmPassword: "",
  codigoVerificacion: "", codigoIngresado: "", pasoVerificacion: 1
};

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
  pedidos,
  enviarCodigoEmail,
  setPagina
}: CuentaPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const prevModoRef = useRef<"login" | "register" | null>(null);

  // Estados para recuperar contraseña
  const [modoRecuperar, setModoRecuperar] = useState(false);
  const [pasoRecuperar, setPasoRecuperar] = useState(1);
  const [emailRecuperar, setEmailRecuperar] = useState("");
  const [codigoRecuperar, setCodigoRecuperar] = useState("");
  const [codigoIngresadoRecuperar, setCodigoIngresadoRecuperar] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [showNuevaPassword, setShowNuevaPassword] = useState(false);

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
    color: "gold"
  };
  const inputWithEyeStyle = { ...inputStyle, paddingRight: 44 };

  // Vaciar email y contraseñas al mostrar Registrarse o Iniciar Sesión
  useEffect(() => {
    if (modoRegistro === "register" && prevModoRef.current !== "register") {
      setFormAuth((prev) => ({
        ...prev,
        email: "",
        confirmEmail: "",
        password: "",
        confirmPassword: ""
      }));
    } else if (modoRegistro === "login" && prevModoRef.current !== "login") {
      setFormAuth((prev) => ({
        ...prev,
        email: "",
        password: ""
      }));
    }
    prevModoRef.current = modoRegistro;
  }, [modoRegistro, setFormAuth]);

  if (!usuario) {
    return (
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", color: "gold", marginBottom: 30 }}>👤 Mi Cuenta</h2>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <button
            onClick={() => { setModoRegistro("login"); setFormAuth({ ...formAuth, password: "", pasoVerificacion: 1 }); setReenvioDisponibleEn(0); setModoRecuperar(false); }}
            style={{ flex: 1, padding: 12, background: modoRegistro === "login" && !modoRecuperar ? "gold" : "transparent", color: modoRegistro === "login" && !modoRecuperar ? "#1b1745" : "gold", border: "2px solid gold", borderRadius: 10, cursor: "pointer", fontWeight: "bold" }}
          >Iniciar Sesión</button>
          <button
            onClick={() => { setModoRegistro("register"); setFormAuth((prev) => ({ ...prev, email: "", confirmEmail: "", password: "", confirmPassword: "", pasoVerificacion: 1 })); setReenvioDisponibleEn(0); setModoRecuperar(false); }}
            style={{ flex: 1, padding: 12, background: modoRegistro === "register" && !modoRecuperar ? "gold" : "transparent", color: modoRegistro === "register" && !modoRecuperar ? "#1b1745" : "gold", border: "2px solid gold", borderRadius: 10, cursor: "pointer", fontWeight: "bold" }}
          >Registrarse</button>
        </div>
        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setPagina("inicio")}
            style={{ padding: "10px 20px", background: "transparent", color: "gold", border: "2px solid gold", borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: 15 }}
          >
            Cancelar → Inicio
          </button>
        </div>
        <div style={{ background: "#2b2560", padding: 30, borderRadius: 20, border: "2px solid gold" }}>
          {!modoRecuperar && modoRegistro === "register" && formAuth.pasoVerificacion === 1 && (
            <>
              <h3 style={{ color: "gold", textAlign: "center", marginBottom: 20 }}>Paso 1: Datos personales</h3>
              <input type="text" placeholder="Nombre completo *" value={formAuth.nombre} onChange={(e) => setFormAuth({ ...formAuth, nombre: e.target.value })} style={inputStyle} />
              <input type="tel" placeholder="Teléfono *" value={formAuth.telefono} onChange={(e) => setFormAuth({ ...formAuth, telefono: e.target.value.replace(/\D/g, "").slice(0, 9) })} inputMode="numeric" maxLength={9} style={inputStyle} />
              <input type="email" placeholder="Email *" value={formAuth.email} onChange={(e) => setFormAuth({ ...formAuth, email: e.target.value })} style={inputStyle} autoComplete="off" />
              <input type="email" placeholder="Confirmar Email *" value={formAuth.confirmEmail} onChange={(e) => setFormAuth({ ...formAuth, confirmEmail: e.target.value })} style={inputStyle} autoComplete="off" />
              <div style={passwordWrapperStyle}>
                <input type={showPassword ? "text" : "password"} placeholder="Contraseña *" value={formAuth.password} onChange={(e) => setFormAuth({ ...formAuth, password: e.target.value })} style={inputWithEyeStyle} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword((v) => !v)} style={eyeBtnStyle} title={showPassword ? "Ocultar contraseña" : "Ver contraseña"} aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}>{showPassword ? "🙈" : "👁"}</button>
              </div>
              <div style={passwordWrapperStyle}>
                <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirmar Contraseña *" value={formAuth.confirmPassword} onChange={(e) => setFormAuth({ ...formAuth, confirmPassword: e.target.value })} style={inputStyle} autoComplete="new-password" />
                <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} style={eyeBtnStyle} title={showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"} aria-label={showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"}>{showConfirmPassword ? "🙈" : "👁"}</button>
              </div>
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
              <button
                onClick={async () => {
                  if (formAuth.telefono && !/^\d{9}$/.test(formAuth.telefono)) { mostrarNotificacion("❌ El teléfono debe tener 9 números", "error"); return; }
                  if (!formAuth.nombre || !formAuth.telefono || !formAuth.email || !formAuth.password || !formAuth.confirmEmail || !formAuth.confirmPassword || !formAuth.calle || !formAuth.numero || !formAuth.cp || !formAuth.provincia || !formAuth.poblacion || !formAuth.pais) { mostrarNotificacion("❌ Completa todos los campos obligatorios", "error"); return; }
                  if (formAuth.password !== formAuth.confirmPassword) { mostrarNotificacion("❌ Las contraseñas no coinciden", "error"); return; }
                  if (formAuth.email !== formAuth.confirmEmail) { mostrarNotificacion("❌ Los emails no coinciden", "error"); return; }
                  const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
                  const usuarioExistente = usuarios.find((u: Usuario) => u.email.toLowerCase() === formAuth.email.toLowerCase().trim());
                  if (usuarioExistente && usuarioExistente.verificado) { mostrarNotificacion("❌ Este email ya está registrado. Por favor, inicia sesión.", "error"); return; }
                  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
                  mostrarNotificacion("📧 Enviando código...", "normal");
                  try {
                    const enviado = await enviarCodigoEmail(formAuth.email, formAuth.nombre, codigo);
                    if (enviado) { setFormAuth({ ...formAuth, codigoVerificacion: codigo, pasoVerificacion: 2 }); setReenvioDisponibleEn(60); mostrarNotificacion(`✅ Código enviado a ${formAuth.email}`, "exito"); }
                    else { mostrarNotificacion("❌ Error al enviar el código. Revisa la consola (F12)", "error"); }
                  } catch { mostrarNotificacion("❌ Error al enviar el código", "error"); }
                }}
                style={{ width: "100%", padding: 12, background: "gold", color: "#1b1745", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: 16, marginTop: 20 }}
              >Enviar código de verificación</button>
            </>
          )}
          {!modoRecuperar && modoRegistro === "register" && formAuth.pasoVerificacion === 2 && (
            <>
              <h3 style={{ color: "gold", textAlign: "center", marginBottom: 20 }}>Paso 2: Verificar Email</h3>
              <p style={{ color: "white", textAlign: "center", marginBottom: 20 }}>Hemos enviado un código a {formAuth.email}</p>
              <p style={{ color: "white", textAlign: "center", fontSize: 13, marginTop: -8, marginBottom: 16, opacity: 0.85 }}>El mensaje suele llegar en menos de 1 minuto. Revisa también spam/correo no deseado.</p>
              <input type="text" placeholder="Código de 6 dígitos" value={formAuth.codigoIngresado || ""} onChange={(e) => setFormAuth({ ...formAuth, codigoIngresado: e.target.value })} style={inputStyle} />
              <button
                onClick={async () => {
                  if (formAuth.codigoIngresado === formAuth.codigoVerificacion) {
                    const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
                      const direccionCompleta = `${(formAuth.calle || "").trim()}, Nº ${(formAuth.numero || "").trim()}${(formAuth.bloque || "").trim() ? `, Bloque ${(formAuth.bloque || "").trim()}` : ""}${(formAuth.escalera || "").trim() ? `, Esc. ${(formAuth.escalera || "").trim()}` : ""}${(formAuth.piso || "").trim() ? `, Piso ${(formAuth.piso || "").trim()}` : ""}${(formAuth.puerta || "").trim() ? `, Puerta ${(formAuth.puerta || "").trim()}` : ""}`;
                    const nuevoUsuario: Usuario = {
                      id: Date.now(), nombre: formAuth.nombre, email: formAuth.email, telefono: formAuth.telefono,
                      calle: formAuth.calle, bloque: formAuth.bloque, escalera: formAuth.escalera, piso: formAuth.piso, puerta: formAuth.puerta, numero: formAuth.numero,
                      direccion: direccionCompleta, cp: formAuth.cp, provincia: formAuth.provincia, poblacion: formAuth.poblacion, pais: formAuth.pais,
                      password: formAuth.password, verificado: true, pedidos: []
                    };
                    
                    // Si el usuario ya existía sin registrar (por haber comprado antes), lo actualizamos en vez de crear uno nuevo
                    const emailAComprobar = (formAuth.email || "").trim().toLowerCase();
                    const indexExistente = usuarios.findIndex((u: Usuario) => (u.email || "").trim().toLowerCase() === emailAComprobar);
                    
                    if (indexExistente !== -1) {
                      // Mantenemos el ID original y sus pedidos, actualizamos el resto
                      usuarios[indexExistente] = { 
                        ...usuarios[indexExistente],
                        nombre: formAuth.nombre,
                        telefono: formAuth.telefono,
                        calle: formAuth.calle,
                        bloque: formAuth.bloque,
                        escalera: formAuth.escalera,
                        piso: formAuth.piso,
                        puerta: formAuth.puerta,
                        numero: formAuth.numero,
                        direccion: direccionCompleta,
                        cp: formAuth.cp,
                        provincia: formAuth.provincia,
                        poblacion: formAuth.poblacion,
                        pais: formAuth.pais,
                        password: formAuth.password,
                        verificado: true
                      };
                      setUsuario(usuarios[indexExistente]);
                      localStorage.setItem("usuarioActual", JSON.stringify(usuarios[indexExistente]));
                      precargarDatosClienteDesdeUsuario(usuarios[indexExistente]);
                    } else {
                      usuarios.push(nuevoUsuario);
                      setUsuario(nuevoUsuario);
                      localStorage.setItem("usuarioActual", JSON.stringify(nuevoUsuario));
                      precargarDatosClienteDesdeUsuario(nuevoUsuario);
                    }
                    
                    localStorage.setItem("usuarios", JSON.stringify(usuarios));
                    
                    mostrarNotificacion(`✅ Cuenta verificada y registrada con éxito: ${formAuth.nombre}`, "exito");
                    setFormAuth(formAuthReset);
                    setReenvioDisponibleEn(0);
                  } else { mostrarNotificacion("❌ Código incorrecto", "error"); }
                }}
                style={{ width: "100%", padding: 12, background: "gold", color: "#1b1745", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: 16, marginTop: 10 }}
              >Verificar y completar registro</button>
              <button
                onClick={async () => {
                  if (reenvioDisponibleEn > 0) return;
                  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
                  mostrarNotificacion("📧 Reenviando código...", "normal");
                  const enviado = await enviarCodigoEmail(formAuth.email, formAuth.nombre, codigo);
                  if (enviado) { setFormAuth((prev) => ({ ...prev, codigoVerificacion: codigo })); setReenvioDisponibleEn(60); mostrarNotificacion(`✅ Nuevo código enviado a ${formAuth.email}`, "exito"); }
                  else { mostrarNotificacion("❌ No se pudo reenviar el código", "error"); }
                }}
                disabled={reenvioDisponibleEn > 0}
                style={{ width: "100%", padding: 12, background: reenvioDisponibleEn > 0 ? "#666" : "#1b1745", color: "gold", border: "2px solid gold", borderRadius: 10, cursor: reenvioDisponibleEn > 0 ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: 15, marginTop: 10, opacity: reenvioDisponibleEn > 0 ? 0.85 : 1 }}
              >{reenvioDisponibleEn > 0 ? `Reenviar código en ${reenvioDisponibleEn}s` : "Reenviar código"}</button>
              <button onClick={() => { setFormAuth({ ...formAuth, pasoVerificacion: 1 }); setReenvioDisponibleEn(0); }} style={{ width: "100%", padding: 12, background: "transparent", color: "gold", border: "2px solid gold", borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: 16, marginTop: 10 }}>← Volver</button>
            </>
          )}
          {!modoRecuperar && modoRegistro === "login" && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!formAuth.email.trim() || !formAuth.password) {
                  mostrarNotificacion("❌ Introduce email y contraseña", "error");
                  return;
                }
                const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
                
                // 1. Buscamos primero al usuario solo por email
                const usuarioPorEmail = usuarios.find((u: Usuario) => u.email.toLowerCase() === formAuth.email.toLowerCase().trim());
                
                if (!usuarioPorEmail) {
                  mostrarNotificacion("❌ Email o contraseña incorrectos", "error");
                  return;
                }

                // 2. Si el usuario existe pero no está verificado (compra rápida), lo mandamos a registrarse sin importar qué contraseña haya puesto
                if (!usuarioPorEmail.verificado) {
                  mostrarNotificacion("⚠️ Esta cuenta está pendiente de registro. Completa los datos en la pestaña 'Registrarse'.", "error");
                  
                  // Cambiamos automáticamente a la pestaña de registro y pre-cargamos los datos
                  setModoRegistro("register");
                  setFormAuth({
                    ...formAuth,
                    nombre: usuarioPorEmail.nombre || "",
                    telefono: usuarioPorEmail.telefono || "",
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
                    password: "", // Limpiar contraseña por seguridad
                    confirmPassword: "",
                    confirmEmail: formAuth.email
                  });
                  return;
                }

                // 3. Si el usuario SÍ está verificado, entonces la contraseña tiene que coincidir exactamente
                if (usuarioPorEmail.password !== formAuth.password) {
                  mostrarNotificacion("❌ Email o contraseña incorrectos", "error");
                  return;
                }

                // 4. Todo correcto, iniciar sesión
                setUsuario(usuarioPorEmail);
                localStorage.setItem("usuarioActual", JSON.stringify(usuarioPorEmail));
                precargarDatosClienteDesdeUsuario(usuarioPorEmail);
                mostrarNotificacion(`✅ Bienvenido ${usuarioPorEmail.nombre}`, "exito");
                setFormAuth(formAuthReset);
              }} 
              autoComplete="off"
            >
              <input type="email" placeholder="Email" value={formAuth.email} onChange={(e) => setFormAuth({ ...formAuth, email: e.target.value })} style={inputStyle} autoComplete="new-email" name="login-email" />
              <div style={passwordWrapperStyle}>
                <input type={showPasswordLogin ? "text" : "password"} placeholder="Contraseña" value={formAuth.password} onChange={(e) => setFormAuth({ ...formAuth, password: e.target.value })} style={inputWithEyeStyle} autoComplete="new-password" name="login-password" />
                <button type="button" onClick={() => setShowPasswordLogin((v) => !v)} style={eyeBtnStyle} title={showPasswordLogin ? "Ocultar contraseña" : "Ver contraseña"} aria-label={showPasswordLogin ? "Ocultar contraseña" : "Ver contraseña"}>{showPasswordLogin ? "🙈" : "👁"}</button>
              </div>
              <button
                type="submit"
                style={{ width: "100%", padding: 12, background: "gold", color: "#1b1745", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: 16, marginTop: 10 }}
              >Iniciar Sesión</button>
              <div style={{ textAlign: "center", marginTop: 15 }}>
                <button type="button" onClick={() => { 
                  setModoRecuperar(true); 
                  setPasoRecuperar(1); 
                  setEmailRecuperar(""); // ¡AQUÍ ESTÁ EL CAMBIO! Ahora siempre estará vacío
                  setCodigoIngresadoRecuperar(""); 
                  setNuevaPassword(""); 
                }} style={{ background: "none", border: "none", color: "gold", cursor: "pointer", textDecoration: "underline", fontSize: 14 }}>¿Olvidaste tu contraseña?</button>
              </div>
            </form>
          )}
          {modoRecuperar && (
            <>
              {pasoRecuperar === 1 && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!emailRecuperar) { mostrarNotificacion("❌ Introduce tu email", "error"); return; }
                    const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
                    const usuarioEncontrado = usuarios.find((u: Usuario) => u.email.toLowerCase() === emailRecuperar.trim().toLowerCase());
                    if (!usuarioEncontrado) { mostrarNotificacion("❌ No existe ninguna cuenta con ese email", "error"); return; }
                    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
                    mostrarNotificacion("📧 Enviando código...", "normal");
                    try {
                      const enviado = await enviarCodigoEmail(emailRecuperar, usuarioEncontrado.nombre, codigo);
                      if (enviado) {
                        setCodigoRecuperar(codigo);
                        setPasoRecuperar(2);
                        mostrarNotificacion(`✅ Código enviado a ${emailRecuperar}`, "exito");
                      } else { mostrarNotificacion("❌ Error al enviar el código. Revisa la consola", "error"); }
                    } catch { mostrarNotificacion("❌ Error al enviar el código", "error"); }
                  }}
                  autoComplete="off"
                >
                  <h3 style={{ color: "gold", textAlign: "center", marginBottom: 20 }}>Recuperar Contraseña</h3>
                  <p style={{ color: "white", textAlign: "center", marginBottom: 20 }}>Introduce tu email para enviarte un código de recuperación.</p>
                  <input type="email" placeholder="Email" value={emailRecuperar} onChange={(e) => setEmailRecuperar(e.target.value)} style={inputStyle} autoComplete="off" name="email-recuperacion" />
                  <button
                    type="submit"
                    style={{ width: "100%", padding: 12, background: "gold", color: "#1b1745", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: 16, marginTop: 10 }}
                  >Recuperar contraseña</button>
                  <button type="button" onClick={() => setModoRecuperar(false)} style={{ width: "100%", padding: 12, background: "transparent", color: "gold", border: "2px solid gold", borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: 16, marginTop: 10 }}>← Cancelar</button>
                </form>
              )}
              {pasoRecuperar === 2 && (
                <>
                  <h3 style={{ color: "gold", textAlign: "center", marginBottom: 20 }}>Verificar y Cambiar</h3>
                  <p style={{ color: "white", textAlign: "center", marginBottom: 20 }}>Introduce el código enviado a {emailRecuperar} y tu nueva contraseña.</p>
                  <input type="text" placeholder="Código de verificación" value={codigoIngresadoRecuperar} onChange={(e) => setCodigoIngresadoRecuperar(e.target.value)} style={inputStyle} autoComplete="off" name="codigo-recuperacion" />
                  <div style={passwordWrapperStyle}>
                    <input type={showNuevaPassword ? "text" : "password"} placeholder="Nueva Contraseña" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} style={inputWithEyeStyle} autoComplete="new-password" name="nueva-password" />
                    <button type="button" onClick={() => setShowNuevaPassword((v) => !v)} style={eyeBtnStyle} title={showNuevaPassword ? "Ocultar contraseña" : "Ver contraseña"} aria-label={showNuevaPassword ? "Ocultar contraseña" : "Ver contraseña"}>{showNuevaPassword ? "🙈" : "👁"}</button>
                  </div>
                  <button
                    onClick={() => {
                      if (!codigoIngresadoRecuperar || !nuevaPassword) { mostrarNotificacion("❌ Completa todos los campos", "error"); return; }
                      if (codigoIngresadoRecuperar !== codigoRecuperar) { mostrarNotificacion("❌ Código incorrecto", "error"); return; }
                      const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
                      const index = usuarios.findIndex((u: Usuario) => u.email === emailRecuperar);
                      if (index !== -1) {
                        usuarios[index].password = nuevaPassword;
                        localStorage.setItem("usuarios", JSON.stringify(usuarios));
                        mostrarNotificacion("✅ Contraseña actualizada correctamente", "exito");
                        setModoRecuperar(false);
                        setPasoRecuperar(1);
                        setCodigoIngresadoRecuperar("");
                        setNuevaPassword("");
                        setFormAuth({ ...formAuth, email: emailRecuperar, password: "" });
                      } else { mostrarNotificacion("❌ Error inesperado", "error"); }
                    }}
                    style={{ width: "100%", padding: 12, background: "gold", color: "#1b1745", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: 16, marginTop: 10 }}
                  >Actualizar Contraseña</button>
                  <button onClick={() => { setPasoRecuperar(1); setEmailRecuperar(""); }} style={{ width: "100%", padding: 12, background: "transparent", color: "gold", border: "2px solid gold", borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: 16, marginTop: 10 }}>← Volver</button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  const pedidosUsuario = pedidos.filter(p => p.cliente?.email === usuario.email);
  
  // Agrupar pedidos del usuario en base a su información de usuario actual + los del sistema general
  // Esto previene que si el usuario tiene pedidos antiguos con este email sigan apareciendo
  const todosLosPedidosDelUsuario = Array.from(new Set([
    ...(usuario.pedidos || []),
    ...pedidosUsuario
  ].map(p => JSON.stringify(p)))).map(p => JSON.parse(p) as Pedido)
  .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", color: "gold", marginBottom: 30 }}>👤 Mi Cuenta</h2>
      <div style={{ marginBottom: 16 }}>
        <button type="button" onClick={() => setPagina("inicio")} style={{ padding: "10px 20px", background: "transparent", color: "gold", border: "2px solid gold", borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: 15 }}>Cancelar → Inicio</button>
      </div>
      <div style={{ background: "#2b2560", padding: 20, borderRadius: 20, border: "2px solid gold", marginBottom: 20 }}>
        <h3 style={{ color: "gold", marginBottom: 15 }}>Bienvenido, {usuario.nombre}</h3>
        <p style={{ color: "white" }}>📧 {usuario.email}</p>
        <p style={{ color: "white" }}>📞 {usuario.telefono}</p>
        {usuario.direccion && <p style={{ color: "white" }}>📍 {usuario.direccion}</p>}
        {(usuario.cp || usuario.poblacion || usuario.provincia || usuario.pais) && (
          <p style={{ color: "white" }}>🗺️ {usuario.cp || ""} {usuario.poblacion || ""}{usuario.provincia ? `, ${usuario.provincia}` : ""}{usuario.pais ? `, ${usuario.pais}` : ""}</p>
        )}
        <button onClick={() => { setUsuario(null); localStorage.removeItem("usuarioActual"); mostrarNotificacion("👋 Sesión cerrada", "normal"); }} style={{ background: "transparent", color: "#ff4444", border: "2px solid #ff4444", padding: "8px 20px", borderRadius: 10, cursor: "pointer", fontWeight: "bold", marginTop: 10 }}>Cerrar Sesión</button>
      </div>
      <h3 style={{ color: "gold", marginBottom: 15 }}>📦 Mis Pedidos</h3>
      {todosLosPedidosDelUsuario.length === 0 ? (
        <p style={{ color: "white", textAlign: "center", padding: 20, background: "#2b2560", borderRadius: 20 }}>No tienes pedidos aún</p>
      ) : (
        todosLosPedidosDelUsuario.map((p) => {
          const pasos = [{ estado: "pendiente", label: "Pendiente", icono: "🛒" }, { estado: "enviado", label: "Enviado", icono: "🚚" }, { estado: "entregado", label: "Entregado", icono: "✅" }] as const;
          const indiceActual = p.estado === "pendiente" ? 0 : p.estado === "enviado" ? 1 : 2;
          return (
            <div key={p.numero} style={{ background: "#2b2560", padding: 15, borderRadius: 15, border: "1px solid gold", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><strong style={{ color: "gold" }}>{p.numero}</strong><span style={{ color: "white", fontSize: 12 }}>{p.fecha}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                <span style={{ color: "white" }}>Total: {p.total?.toFixed(2)} €</span>
                <span style={{ color: p.estado === "pendiente" ? "#22d3ee" : p.estado === "enviado" ? "#e67e22" : "#2ecc71", fontWeight: "bold" }}>
                  {p.estado === "pendiente" ? "🛒 Pendiente" : p.estado === "enviado" ? "🚚 Enviado" : "✅ Entregado"}
                </span>
              </div>
              <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", gap: 8 }}>
                {pasos.map((paso, index) => {
                  const activo = index <= indiceActual;
                  return (
                    <div key={`${p.numero}-${paso.estado}`} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ height: 6, borderRadius: 6, marginBottom: 6, background: activo ? "gold" : "rgba(255,255,255,0.2)" }} />
                      <div style={{ fontSize: 12, color: activo ? "gold" : "rgba(255,255,255,0.7)" }}>{paso.icono} {paso.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
