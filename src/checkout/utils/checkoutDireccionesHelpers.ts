import type { Cliente, DireccionUsuario, Usuario } from "../../types";
import { CLIENTE_VACIO } from "../../app/hooks/useClienteMaika";
import { repartirNombreApellidos } from "../../utils/appIdentity";
import { perfilUsuarioPayloadDesdeMaika } from "../../utils/perfilPayloadDesdeMaika";
import { prepareDireccionesParaGuardar } from "../../utils/prepareDireccionesParaGuardar";
import type { MaikaUsuarioLS } from "../../utils/maikaUsuarios";

/**
 * Construye el payload de perfil desde una fila de maikaUsuarios y reorganiza
 * las direcciones con `prepareDireccionesParaGuardar` para que el backend
 * reciba direcciones normalizadas y con `direccionPredeterminadaId` coherente.
 */
export function perfilPayloadMaikaConDireccionesActuales(
  maikaRow: MaikaUsuarioLS,
  usuarioActual: Usuario | null
): Record<string, unknown> {
  const body = perfilUsuarioPayloadDesdeMaika(maikaRow);
  if (Array.isArray(body.direcciones)) {
    const preparado = prepareDireccionesParaGuardar(
      body.direcciones as DireccionUsuario[],
      Array.isArray(usuarioActual?.direcciones) ? usuarioActual.direcciones : [],
      String(body.direccionPredeterminadaId || usuarioActual?.direccionPredeterminadaId || "")
    );
    body.direcciones = preparado.direcciones;
    body.direccionPredeterminadaId = preparado.direccionPredeterminadaId;
  }
  return body;
}

/**
 * Construye un objeto `Cliente` sincronizado desde un `Usuario` (p. ej. para
 * rellenar `datosCliente` del checkout a partir de la sesión). Reparte el
 * nombre completo en nombre + apellidos y normaliza el país a mayúsculas.
 */
export function clienteSincronoDesdeUsuario(usuarioFuente: Usuario | null): Cliente | null {
  if (!usuarioFuente) return null;
  const repartido = repartirNombreApellidos(usuarioFuente.nombre || "", "");
  return {
    ...CLIENTE_VACIO,
    nombre: (repartido.nombre || "").toUpperCase(),
    apellidos: (repartido.apellidos || "").toUpperCase(),
    nombreApellidos:
      `${(repartido.nombre || "").trim()} ${(repartido.apellidos || "").trim()}`.trim() || usuarioFuente.nombre || "",
    email: usuarioFuente.email || "",
    dni: usuarioFuente.dni || "",
    telefono: usuarioFuente.telefono || "",
    direccion: usuarioFuente.direccion || "",
    calle: usuarioFuente.calle || "",
    numero: usuarioFuente.numero || "",
    bloque: usuarioFuente.bloque || "",
    escalera: usuarioFuente.escalera || "",
    piso: usuarioFuente.piso || "",
    puerta: usuarioFuente.puerta || "",
    cp: usuarioFuente.cp || "",
    poblacion: usuarioFuente.poblacion || "",
    provincia: usuarioFuente.provincia || "",
    ciudad: usuarioFuente.ciudad || "",
    pais: (usuarioFuente.pais || "").trim() || "ESPAÑA",
    notas: ""
  };
}
