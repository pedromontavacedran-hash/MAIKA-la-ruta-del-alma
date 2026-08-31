import type { Cliente, DireccionUsuario } from "../types";
import type { MaikaUsuarioLS } from "./maikaUsuarios";
import { construirDireccionCompleta } from "./direccion";

export function construirDireccionParaBackend(datosCliente: Cliente): {
  direccionFull: string;
  direccionParaBackend: string;
} {
  const calle = (datosCliente.calle || "").trim();
  const numero = (datosCliente.numero || "").trim();
  const cp = (datosCliente.cp || "").trim();
  const poblacion = (datosCliente.poblacion || "").trim();
  const provincia = (datosCliente.provincia || "").trim();
  const pais = (datosCliente.pais || "ESPAÑA").trim();

  const direccionCalleExtras = construirDireccionCompleta({
    calle,
    numero,
    bloque: datosCliente.bloque,
    escalera: datosCliente.escalera,
    piso: datosCliente.piso,
    puerta: datosCliente.puerta
  }).trim();

  const cpPoblacion = cp && poblacion ? `${cp} ${poblacion}` : "";
  const provPais = [provincia, pais].filter(Boolean).join(", ");

  const direccionConstruida = [direccionCalleExtras, cpPoblacion, provPais]
    .filter(Boolean)
    .join(", ")
    .replace(/\s+/g, " ")
    .trim();

  const direccionFallback = (datosCliente.direccion || "").trim();
  const direccionFull = (direccionConstruida.length >= 5 ? direccionConstruida : direccionFallback).trim();
  const direccionParaBackend = direccionFull.length > 120 ? direccionFull.slice(0, 120).trim() : direccionFull;
  return { direccionFull, direccionParaBackend };
}

export function guardarDireccionEnMaikaUsuarios(params: {
  claveTel: string | null;
  direccionPartes: DireccionUsuario | null;
  direccionSeleccionada: DireccionUsuario | null;
  modoDireccionCheckout: boolean;
  modoNuevaDireccionCheckout: boolean;
  usarPrincipal: boolean;
  direccionesMax: number;
  leerMaikaUsuarios: () => MaikaUsuarioLS[];
  guardarMaikaUsuarios: (usuarios: MaikaUsuarioLS[]) => void;
  normalizarDireccionesUsuario: (dirsRaw: unknown) => DireccionUsuario[];
  direccionLegacyDesdeUsuarioLS: (u: MaikaUsuarioLS | null | undefined) => DireccionUsuario | null;
  direccionClave: (d: Pick<DireccionUsuario, "calle" | "numero" | "cp" | "poblacion" | "provincia" | "pais">) => string;
}): { direccionesNext: DireccionUsuario[]; direccionIdResultado: string; direccionPredeterminadaId: string } | undefined {
  const {
    claveTel,
    direccionPartes,
    direccionSeleccionada,
    modoDireccionCheckout,
    modoNuevaDireccionCheckout,
    usarPrincipal,
    direccionesMax,
    leerMaikaUsuarios,
    guardarMaikaUsuarios,
    normalizarDireccionesUsuario,
    direccionLegacyDesdeUsuarioLS,
    direccionClave
  } = params;

  if (!claveTel || !direccionPartes) return;
  const usuariosLS = leerMaikaUsuarios();
  const idxMaika = usuariosLS.findIndex((u) => String(u?.telefono || "").trim() === String(claveTel));
  if (idxMaika < 0) return;

  const prev = usuariosLS[idxMaika];
  const dirsGuardadas = normalizarDireccionesUsuario(prev?.direcciones);
  const legacyPrev = direccionLegacyDesdeUsuarioLS(prev);

  const base = [...dirsGuardadas];
  if (legacyPrev && !base.some((d) => direccionClave(d) === direccionClave(legacyPrev))) base.push(legacyPrev);

  let direccionesNext = base;
  let direccionPredeterminadaId = prev?.direccionPredeterminadaId || "";
  let direccionIdResultado = "";

  const forzarCrearNueva = modoDireccionCheckout && modoNuevaDireccionCheckout;
  if (direccionSeleccionada && !forzarCrearNueva) {
    const updatedDir: DireccionUsuario = {
      ...direccionSeleccionada,
      ...direccionPartes,
      id: direccionSeleccionada.id,
      alias: direccionSeleccionada.alias || direccionPartes.alias
    };

    const idxDir = direccionesNext.findIndex((d) => d.id === direccionSeleccionada.id);
    if (idxDir >= 0) {
      direccionesNext = [...direccionesNext];
      direccionesNext[idxDir] = updatedDir;
    } else {
      direccionesNext = [updatedDir, ...direccionesNext];
    }
    direccionIdResultado = updatedDir.id;
    if (usarPrincipal) direccionPredeterminadaId = updatedDir.id;
  } else {
    const nuevoAlias = usarPrincipal
      ? "Dirección principal"
      : direccionesNext.length > 0
        ? `Dirección ${direccionesNext.length + 1}`
        : "Dirección";
    const nuevaDir: DireccionUsuario = { ...direccionPartes, alias: nuevoAlias };
    direccionesNext = [nuevaDir, ...direccionesNext].slice(0, direccionesMax);
    direccionIdResultado = nuevaDir.id;
    if (usarPrincipal || !direccionPredeterminadaId) direccionPredeterminadaId = nuevaDir.id;
  }

  direccionesNext = normalizarDireccionesUsuario(direccionesNext);
  if (!direccionesNext.some((d) => d.id === direccionPredeterminadaId)) {
    direccionPredeterminadaId = direccionesNext[0]?.id || "";
  }

  const dirPred =
    direccionesNext.find((d) => d.id === direccionPredeterminadaId) || direccionesNext[0] || null;

  usuariosLS[idxMaika] = {
    ...prev,
    direcciones: direccionesNext,
    direccionPredeterminadaId,
    ...(dirPred
      ? {
          calle: String(dirPred.calle || "").trim(),
          numero: String(dirPred.numero || "").trim(),
          bloque: String(dirPred.bloque || "").trim(),
          escalera: String(dirPred.escalera || "").trim(),
          piso: String(dirPred.piso || "").trim(),
          puerta: String(dirPred.puerta || "").trim(),
          cp: String(dirPred.cp || "").trim(),
          poblacion: String(dirPred.poblacion || "").trim(),
          provincia: String(dirPred.provincia || "").trim(),
          pais: String(dirPred.pais || "").trim()
        }
      : {})
  };
  guardarMaikaUsuarios(usuariosLS);
  return { direccionesNext, direccionIdResultado, direccionPredeterminadaId };
}

export function eliminarDireccionCheckoutPersistida(params: {
  idDir: string;
  usuarioTelefono: string;
  datosClienteTelefono: string;
  direccionesCheckout: DireccionUsuario[];
  direccionPredeterminadaCheckoutId: string;
  leerMaikaUsuarios: () => MaikaUsuarioLS[];
  guardarMaikaUsuarios: (usuarios: MaikaUsuarioLS[]) => void;
  normalizarTelefonoES9: (telefono: string) => string;
  normalizarDireccionesUsuario: (dirsRaw: unknown) => DireccionUsuario[];
}): { kind: "ok"; dirs: DireccionUsuario[]; predeterminadaId: string } | { kind: "error"; error: string } {
  const {
    idDir, usuarioTelefono, datosClienteTelefono, direccionesCheckout, direccionPredeterminadaCheckoutId,
    leerMaikaUsuarios, guardarMaikaUsuarios, normalizarTelefonoES9, normalizarDireccionesUsuario
  } = params;

  const id = String(idDir || "").trim();
  if (!id) return { kind: "error", error: "ID de dirección inválido" };
  const telRef = normalizarTelefonoES9(String(usuarioTelefono || datosClienteTelefono || ""));
  const usuariosLS = leerMaikaUsuarios();
  const idxMaika = usuariosLS.findIndex((u) => normalizarTelefonoES9(String(u.telefono || "")) === telRef);

  let dirsBase = normalizarDireccionesUsuario(direccionesCheckout);
  let predPrev = String(direccionPredeterminadaCheckoutId || "").trim();
  if (idxMaika >= 0) {
    const prev = usuariosLS[idxMaika];
    dirsBase = normalizarDireccionesUsuario(prev?.direcciones);
    predPrev = String(prev?.direccionPredeterminadaId || "").trim() || predPrev;
  }
  if (dirsBase.length <= 1) return { kind: "error", error: "Debes tener al menos una dirección" };

  const dirsNext = dirsBase.filter((d) => d.id !== id);
  const predNext = dirsNext.some((d) => d.id === predPrev) ? predPrev : (dirsNext[0]?.id || "");
  const dirPred = dirsNext.find((d) => d.id === predNext) || null;

  if (idxMaika < 0) return { kind: "error", error: "No se encontró el cliente en maika_usuarios" };
  const prev = usuariosLS[idxMaika];
  usuariosLS[idxMaika] = {
    ...prev,
    direcciones: dirsNext,
    direccionPredeterminadaId: predNext,
    calle: dirPred?.calle || "",
    numero: dirPred?.numero || "",
    bloque: dirPred?.bloque || "",
    escalera: dirPred?.escalera || "",
    piso: dirPred?.piso || "",
    puerta: dirPred?.puerta || "",
    cp: dirPred?.cp || "",
    poblacion: dirPred?.poblacion || "",
    provincia: dirPred?.provincia || "",
    pais: dirPred?.pais || ""
  };
  guardarMaikaUsuarios(usuariosLS);

  const usuariosPersistidos = leerMaikaUsuarios();
  const idxPersistido = usuariosPersistidos.findIndex((u) => normalizarTelefonoES9(String(u.telefono || "")) === telRef);
  const dirsRefresco =
    idxPersistido >= 0
      ? normalizarDireccionesUsuario(usuariosPersistidos[idxPersistido]?.direcciones)
      : dirsNext;
  const predRefrescoRaw =
    idxPersistido >= 0
      ? String(usuariosPersistidos[idxPersistido]?.direccionPredeterminadaId || "").trim()
      : predNext;
  const predRefresco = dirsRefresco.some((d) => d.id === predRefrescoRaw) ? predRefrescoRaw : (dirsRefresco[0]?.id || "");
  return { kind: "ok", dirs: dirsRefresco, predeterminadaId: predRefresco };
}
