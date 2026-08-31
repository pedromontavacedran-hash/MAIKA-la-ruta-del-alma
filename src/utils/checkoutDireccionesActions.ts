import type { Cliente, DireccionUsuario, Usuario } from "../types";
import type { MaikaUsuarioLS } from "./maikaUsuarios";
import { construirDireccionBasica, construirDireccionCompleta } from "./direccion";

type ResolverParams = {
  idDir: string;
  usuario: Usuario | null;
  datosCliente: Cliente;
  direccionesCheckout: DireccionUsuario[];
  leerMaikaUsuarios: () => MaikaUsuarioLS[];
  normalizarTelefonoES9: (telefono: string) => string;
  normalizarDireccionesUsuario: (dirsRaw: unknown) => DireccionUsuario[];
  claveTelefonoES: (telefono: string) => string | null;
};

type ResolverError = { ok: false; error: string };
type ResolverOk = {
  ok: true;
  usuariosLS: MaikaUsuarioLS[];
  dirs: DireccionUsuario[];
  dir: DireccionUsuario;
  mergedUser: Usuario;
};

export function resolverUsoDireccionCheckout(params: ResolverParams): ResolverOk | ResolverError {
  const {
    idDir,
    usuario,
    datosCliente,
    direccionesCheckout,
    leerMaikaUsuarios,
    normalizarTelefonoES9,
    normalizarDireccionesUsuario,
    claveTelefonoES
  } = params;
  const id = String(idDir || "").trim();
  if (!id) return { ok: false, error: "Dirección no válida" };
  if (!usuario) return { ok: false, error: "Inicia sesión para usar la dirección" };

  const telRef = normalizarTelefonoES9(String(usuario.telefono || datosCliente.telefono || ""));
  const emailRef = String(usuario.email || "").trim().toLowerCase();
  const usuariosLS = leerMaikaUsuarios();
  let idxMaika = usuariosLS.findIndex((u) => normalizarTelefonoES9(String(u.telefono || "")) === telRef);
  if (idxMaika < 0 && emailRef) {
    idxMaika = usuariosLS.findIndex((u) => String(u.email || "").trim().toLowerCase() === emailRef);
  }

  if (idxMaika < 0) {
    const dirsSeed = normalizarDireccionesUsuario(direccionesCheckout);
    const dirSeed = dirsSeed.find((d) => d.id === id) || dirsSeed[0];
    if (!dirSeed) return { ok: false, error: "Dirección no encontrada" };
    const nombreCompleto = String(usuario.nombre || "").trim();
    const [nombre, ...apellidosParts] = nombreCompleto.split(/\s+/).filter(Boolean);
    const nuevo: MaikaUsuarioLS = {
      telefono: claveTelefonoES(usuario.telefono || datosCliente.telefono || "") || "",
      nombre: nombre || "",
      apellidos: apellidosParts.join(" "),
      email: String(usuario.email || "").trim(),
      dni: "",
      calle: dirSeed.calle || "",
      numero: dirSeed.numero || "",
      bloque: dirSeed.bloque || "",
      escalera: dirSeed.escalera || "",
      piso: dirSeed.piso || "",
      puerta: dirSeed.puerta || "",
      cp: dirSeed.cp || "",
      poblacion: dirSeed.poblacion || "",
      provincia: dirSeed.provincia || "",
      pais: dirSeed.pais || "",
      direcciones: dirsSeed,
      direccionPredeterminadaId: dirSeed.id
    };
    if (!nuevo.telefono) return { ok: false, error: "No se encontró el cliente en maika_usuarios" };
    usuariosLS.push(nuevo);
    idxMaika = usuariosLS.length - 1;
  }

  const prev = usuariosLS[idxMaika];
  const dirs = normalizarDireccionesUsuario(prev?.direcciones);
  const dir = dirs.find((d) => d.id === id) || normalizarDireccionesUsuario(direccionesCheckout).find((d) => d.id === id);
  if (!dir) return { ok: false, error: "Dirección no encontrada" };

  usuariosLS[idxMaika] = {
    ...prev,
    direcciones: dirs,
    direccionPredeterminadaId: id,
    calle: dir.calle || "",
    numero: dir.numero || "",
    bloque: dir.bloque || "",
    escalera: dir.escalera || "",
    piso: dir.piso || "",
    puerta: dir.puerta || "",
    cp: dir.cp || "",
    poblacion: dir.poblacion || "",
    provincia: dir.provincia || "",
    pais: dir.pais || ""
  };

  const mergedUser: Usuario = {
    ...usuario,
    direccion:
      construirDireccionCompleta({
        calle: dir.calle,
        numero: dir.numero,
        bloque: dir.bloque,
        escalera: dir.escalera,
        piso: dir.piso,
        puerta: dir.puerta
      }) || construirDireccionBasica(dir.calle || "", dir.numero || ""),
    calle: dir.calle || "",
    numero: dir.numero || "",
    bloque: dir.bloque || "",
    escalera: dir.escalera || "",
    piso: dir.piso || "",
    puerta: dir.puerta || "",
    cp: dir.cp || "",
    poblacion: dir.poblacion || "",
    provincia: dir.provincia || "",
    pais: dir.pais || ""
  };

  return { ok: true, usuariosLS, dirs, dir, mergedUser };
}
