/**
 * Campos de perfil persistibles (sin contraseña). Validación por longitud para evitar abusos.
 */

/** Acepta string o número (p. ej. piso desde JSON); evita perder piso/puerta al sane. */
const STR = (v, max) => {
  if (v === null || v === undefined) return undefined;
  const t = String(v).trim();
  if (t.length > max) return undefined;
  return t;
};

function saneaDireccionItem(d, idx) {
  if (!d || typeof d !== "object") return null;
  const id = STR(d.id, 80);
  const alias = STR(d.alias, 120);
  const calle = STR(d.calle, 200);
  const numero = STR(d.numero, 40);
  if (!calle || !numero) return null;
  const poblacion = STR(d.poblacion, 120) || "";
  const provincia = STR(d.provincia, 120) || "";
  return {
    id: id || `dir_srv_${Date.now()}_${idx}`,
    alias: alias || `Dirección ${idx + 1}`,
    calle,
    numero,
    bloque: STR(d.bloque, 40) || "",
    escalera: STR(d.escalera, 40) || "",
    piso: STR(d.piso, 40) || "",
    puerta: STR(d.puerta, 40) || "",
    cp: STR(d.cp, 8) || "",
    poblacion,
    provincia,
    pais: STR(d.pais, 80) || "España"
  };
}

export function pickUsuarioPerfilServidor(data) {
  const src = typeof data === "object" && data !== null ? data : {};
  const out = {};

  const n = STR(src.nombre, 200);
  if (n !== undefined) out.nombre = n;

  const dni = STR(src.dni, 40);
  if (dni !== undefined) out.dni = dni;

  if (typeof src.direccion === "string") {
    const v = src.direccion.trim();
    if (v.length <= 500) out.direccion = v;
  }

  for (const key of [
    "calle",
    "numero",
    "bloque",
    "escalera",
    "piso",
    "puerta",
    "cp",
    "poblacion",
    "provincia",
    "pais"
  ]) {
    const v = STR(src[key], key === "calle" ? 200 : 120);
    if (v !== undefined) out[key] = v;
  }

  const pred = STR(src.direccionPredeterminadaId, 80);
  if (pred !== undefined) out.direccionPredeterminadaId = pred;

  if (Array.isArray(src.direcciones)) {
    const lim = src.direcciones.slice(0, 10);
    const dirs = [];
    for (let i = 0; i < lim.length; i++) {
      const one = saneaDireccionItem(lim[i], i);
      if (one) dirs.push(one);
    }
    out.direcciones = dirs;
  }

  if (typeof src.telefono === "string") {
    const v = src.telefono.trim();
    if (/^[0-9+\s-]{6,20}$/.test(v)) out.telefono = v;
  }

  if (typeof src.email === "string") {
    const v = src.email.trim().toLowerCase();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) out.email = v;
  }

  return out;
}
