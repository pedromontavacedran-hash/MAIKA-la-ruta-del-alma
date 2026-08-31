import { construirDireccionBasica } from "./direccion";
import type { MaikaUsuarioLS } from "./maikaUsuarios";
import type { Usuario } from "../types";
import { normalizarTelefonoES9 } from "./telefono";

const EMAIL_VALIDO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function esEmailVerificable(email: string): boolean {
  return EMAIL_VALIDO_REGEX.test(String(email || "").trim().toLowerCase());
}

export function proyectarUsuariosDesdeMaika(maikaUsuarios: MaikaUsuarioLS[]): Usuario[] {
  return maikaUsuarios.map((u) => {
    const tel9 = normalizarTelefonoES9(u.telefono || "");
    const nombreRaw = String(u.nombre || "").trim();
    const apellidosRaw = String(u.apellidos || "").trim();
    const nombreCompuesto = !nombreRaw
      ? apellidosRaw
      : !apellidosRaw
        ? nombreRaw
        : nombreRaw.toLowerCase().includes(apellidosRaw.toLowerCase())
          ? nombreRaw
          : `${nombreRaw} ${apellidosRaw}`.trim();
    return {
      id: `u_${tel9 || Date.now()}`,
      nombre: nombreCompuesto,
      email: (u.email || "").trim(),
      dni: (u.dni || "").trim(),
      password: (u.password || "").trim(),
      hasPassword: typeof u.hasPassword === "boolean" ? u.hasPassword : !!String(u.password || "").trim(),
      telefono: tel9,
      calle: (u.calle || "").trim(),
      numero: (u.numero || "").trim(),
      bloque: (u.bloque || "").trim(),
      escalera: (u.escalera || "").trim(),
      piso: (u.piso || "").trim(),
      puerta: (u.puerta || "").trim(),
      cp: (u.cp || "").trim(),
      poblacion: (u.poblacion || "").trim(),
      provincia: (u.provincia || "").trim(),
      pais: (u.pais || "").trim(),
      direccion: construirDireccionBasica(u.calle || "", u.numero || ""),
      direcciones: Array.isArray(u.direcciones) ? u.direcciones : [],
      direccionPredeterminadaId: String(u.direccionPredeterminadaId || "").trim(),
      verificado: esEmailVerificable((u.email || "").trim())
    } as Usuario;
  });
}
