import type { Cliente } from "../types";
import type { MaikaUsuarioLS } from "./maikaUsuarios";
import { construirDireccionBasica, construirDireccionCompleta } from "./direccion";
import { direccionDesdeCliente, normalizarDireccionesUsuario } from "./direcciones";
import { normalizarTelefonoES9 } from "./telefono";

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Línea única de dirección (misma idea que la columna de gestión). */
function textoDireccionLineaDesdeMaika(m: MaikaUsuarioLS): string {
  const dirs = normalizarDireccionesUsuario(m?.direcciones as unknown, 10);
  const predId = String(m?.direccionPredeterminadaId || "").trim();
  let d = predId ? dirs.find((x) => x.id === predId) : undefined;
  if (!d && dirs.length > 0) d = dirs[0];
  if (d) {
    const linea = construirDireccionCompleta({
      calle: d.calle,
      numero: d.numero,
      bloque: d.bloque,
      escalera: d.escalera,
      piso: d.piso,
      puerta: d.puerta
    });
    const resto = [d.cp, d.poblacion, d.provincia]
      .map((s) => String(s || "").trim())
      .filter(Boolean)
      .join(", ");
    const texto = [linea, resto].filter(Boolean).join(" · ");
    if (texto) return texto;
  }
  const basica = construirDireccionBasica(String(m.calle || ""), String(m.numero || ""));
  if (!basica) return "";
  const resto = [m.cp, m.poblacion, m.provincia]
    .map((s) => String(s || "").trim())
    .filter(Boolean)
    .join(", ");
  return [basica, resto].filter(Boolean).join(" · ");
}

/**
 * Cuerpo para PATCH /me o PATCH /usuarios/:id con el mismo contenido que guardas en maika_usuarios.
 */
export function perfilUsuarioPayloadDesdeMaika(m: MaikaUsuarioLS): Record<string, unknown> {
  const dirs = normalizarDireccionesUsuario(m?.direcciones as unknown, 10);
  const predId = String(m?.direccionPredeterminadaId || "").trim();
  const pred = (predId && dirs.some((x) => x.id === predId) ? predId : dirs[0]?.id) || "";
  const d = (pred && dirs.find((x) => x.id === pred)) || dirs[0] || null;

  const nombreCompleto = [m.nombre, m.apellidos]
    .map((s) => String(s || "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();

  const tel9 = normalizarTelefonoES9(m.telefono || "");
  const telefono =
    tel9 && /^[67]\d{8}$/.test(tel9) ? `+34${tel9}` : String(m.telefono || "").trim();

  return {
    nombre: nombreCompleto || String(m.nombre || "").trim(),
    email: String(m.email || "").trim().toLowerCase(),
    telefono,
    dni: String(m.dni || "").trim(),
    direccion: textoDireccionLineaDesdeMaika(m),
    calle: String(d?.calle || m.calle || "").trim(),
    numero: String(d?.numero || m.numero || "").trim(),
    bloque: String(d?.bloque || m.bloque || "").trim(),
    escalera: String(d?.escalera || m.escalera || "").trim(),
    piso: String(d?.piso || m.piso || "").trim(),
    puerta: String(d?.puerta || m.puerta || "").trim(),
    cp: String(d?.cp || m.cp || "").trim(),
    poblacion: String(d?.poblacion || m.poblacion || "").trim(),
    provincia: String(d?.provincia || m.provincia || "").trim(),
    pais: String(d?.pais || m.pais || "").trim() || "España",
    direccionPredeterminadaId: pred,
    direcciones: dirs
  };
}

/**
 * Mismo criterio que `perfilUsuarioPayloadDesdeMaika`, desde el cliente del checkout
 * (para PATCH /me tras compra).
 *
 * Nota: en checkout `datosObligatoriosCompletos` usa `(pais || "ESPAÑA")` solo para validar,
 * pero `c.pais` puede seguir vacío; `direccionDesdeCliente` exige `pais` no vacío → sin esto
 * `direcciones` queda [] y el backend sustituye el array por [], además de no rellenar bien.
 * El teléfono se envía como +34… para cumplir el regex del servidor en PATCH.
 */
export function perfilUsuarioPayloadDesdeClienteCheckout(
  c: Cliente,
  direccionLineaCompleta: string
): Record<string, unknown> {
  const cNorm: Cliente = {
    ...c,
    pais: String(c.pais || "").trim() || "España"
  };

  const dir = direccionDesdeCliente(cNorm);
  const dirs = dir ? normalizarDireccionesUsuario([dir], 10) : [];

  const nombreCompleto = [
    `${(cNorm.nombre || "").trim()} ${(cNorm.apellidos || "").trim()}`.trim(),
    (cNorm.nombreApellidos || "").trim()
  ]
    .find((s) => s.length > 0)
    ?.trim() || "";

  const tel9 = normalizarTelefonoES9(cNorm.telefono || "");
  const telefonoApi =
    tel9 && /^[67]\d{8}$/.test(tel9) ? `+34${tel9}` : String(cNorm.telefono || "").trim();

  let lineaDireccion = direccionLineaCompleta.trim();
  if (!lineaDireccion && dir) {
    const via = construirDireccionCompleta({
      calle: dir.calle,
      numero: dir.numero,
      bloque: dir.bloque,
      escalera: dir.escalera,
      piso: dir.piso,
      puerta: dir.puerta
    });
    const resto = [dir.cp, dir.poblacion, dir.provincia, dir.pais]
      .map((s) => String(s || "").trim())
      .filter(Boolean)
      .join(", ");
    lineaDireccion = [via, resto].filter(Boolean).join(" · ");
  }

  const emailTrim = String(cNorm.email || "").trim().toLowerCase();

  const payload: Record<string, unknown> = {
    nombre: nombreCompleto,
    telefono: telefonoApi,
    dni: String(cNorm.dni || "").trim(),
    direccion: lineaDireccion,
    calle: String(cNorm.calle || "").trim(),
    numero: String(cNorm.numero || "").trim(),
    bloque: String(cNorm.bloque || "").trim(),
    escalera: String(cNorm.escalera || "").trim(),
    piso: String(cNorm.piso || "").trim(),
    puerta: String(cNorm.puerta || "").trim(),
    cp: String(cNorm.cp || "").trim(),
    poblacion: String(cNorm.poblacion || "").trim(),
    provincia: String(cNorm.provincia || "").trim(),
    pais: cNorm.pais
  };

  if (dirs.length > 0) {
    payload.direcciones = dirs;
    payload.direccionPredeterminadaId = dirs[0].id;
  }

  if (EMAIL_OK.test(emailTrim)) {
    payload.email = emailTrim;
  }

  return payload;
}
