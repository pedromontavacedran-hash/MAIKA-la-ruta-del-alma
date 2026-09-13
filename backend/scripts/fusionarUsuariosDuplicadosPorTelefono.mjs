/**
 * Limpieza one-off: fusiona usuarios en backend/data/usuarios.json que comparten
 * el mismo teléfono móvil ES normalizado (6/7 + 8 dígitos).
 *
 * No importa server.js (no arranca Express).
 *
 * Uso:
 *   node backend/scripts/fusionarUsuariosDuplicadosPorTelefono.mjs --dry-run
 *   node backend/scripts/fusionarUsuariosDuplicadosPorTelefono.mjs
 *
 * O desde la raíz del repo:
 *   npm run dedupe:usuarios-telefono -- --dry-run
 *
 * Con --dry-run solo imprime el informe JSON; no escribe archivos.
 *
 * Importante: detén el proceso del API (`node backend/server.js`) antes de ejecutar sin --dry-run.
 * El servidor cachea usuarios en memoria; si sigue en marcha, un `writeUsuarios` posterior
 * podría sobrescribir el JSON con datos antiguos.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "data");
const usuariosFile = path.join(dataDir, "usuarios.json");
const pedidosFile = path.join(dataDir, "pedidos.json");
const carritosFile = path.join(dataDir, "carritos.json");

const DRY_RUN = process.argv.includes("--dry-run") || process.env.DRY_RUN === "1";

/** Misma lógica que backend/app.js */
function normalizarTelefono(telefono) {
  const soloDigitos = String(telefono || "").replace(/\D/g, "").trim();
  if (soloDigitos.startsWith("0034") && soloDigitos.length > 4) return soloDigitos.slice(4);
  if (soloDigitos.startsWith("34") && soloDigitos.length > 9) return soloDigitos.slice(2);
  return soloDigitos;
}

function telefonoMovilESValido(telNorm) {
  return /^[67]\d{8}$/.test(telNorm);
}

function esEmailMaikaAutomatico(email) {
  const e = String(email || "").trim().toLowerCase();
  if (!e) return true;
  if (/^maika\.cli\.\d+@checkout\.maika\.shop$/i.test(e)) return true;
  if (/^maika\.sync\.\d+@usuarios\.maika\.shop$/i.test(e)) return true;
  return false;
}

function esEmailReal(email) {
  const e = String(email || "").trim();
  return e.length > 0 && !esEmailMaikaAutomatico(e);
}

function riquezaPerfil(u) {
  let n = 0;
  n += String(u.nombre || "").trim().length;
  n += (Array.isArray(u.direcciones) ? u.direcciones.length : 0) * 20;
  if (String(u.direccion || "").trim()) n += 15;
  if (String(u.calle || "").trim() && String(u.cp || "").trim()) n += 25;
  if (String(u.dni || "").trim()) n += 10;
  for (const k of ["poblacion", "provincia", "pais", "numero", "bloque", "piso", "puerta"]) {
    if (String(u[k] || "").trim()) n += 3;
  }
  return n;
}

/** Mejor candidato primero: email real > más datos > id más antiguo (menor). */
function ordenarCandidatosPrincipal(grupo) {
  return [...grupo].sort((a, b) => {
    const ar = esEmailReal(a.email) ? 1 : 0;
    const br = esEmailReal(b.email) ? 1 : 0;
    if (ar !== br) return br - ar;
    const sa = riquezaPerfil(a);
    const sb = riquezaPerfil(b);
    if (sa !== sb) return sb - sa;
    const ida = Number(a.id);
    const idb = Number(b.id);
    if (Number.isFinite(ida) && Number.isFinite(idb) && ida !== idb) return ida - idb;
    return String(a.id ?? "").localeCompare(String(b.id ?? ""));
  });
}

function direccionClave(d) {
  if (!d || typeof d !== "object") return "";
  return [
    String(d.calle || "").trim().toLowerCase(),
    String(d.numero || "").trim().toLowerCase(),
    String(d.cp || "").trim().toLowerCase(),
    String(d.poblacion || "").trim().toLowerCase(),
    String(d.provincia || "").trim().toLowerCase(),
    String(d.pais || "").trim().toLowerCase(),
    String(d.bloque || "").trim().toLowerCase(),
    String(d.escalera || "").trim().toLowerCase(),
    String(d.piso || "").trim().toLowerCase(),
    String(d.puerta || "").trim().toLowerCase()
  ].join("|");
}

function unirDireccionesSinDuplicados(listas) {
  const visto = new Set();
  const out = [];
  let idx = 0;
  for (const arr of listas) {
    const a = Array.isArray(arr) ? arr : [];
    for (const d of a) {
      if (!d || typeof d !== "object") continue;
      const calle = String(d.calle || "").trim();
      const numero = String(d.numero || "").trim();
      if (!calle || !numero) continue;
      const k = direccionClave(d);
      if (!k || visto.has(k)) continue;
      visto.add(k);
      const id = String(d.id || "").trim() || `dir_fus_${idx++}_${Date.now().toString(36)}`;
      out.push({
        ...d,
        id,
        alias: String(d.alias || "").trim() || `Dirección ${out.length + 1}`
      });
    }
  }
  return out.slice(0, 10);
}

function nombreMasCompleto(...candidatos) {
  let best = "";
  for (const c of candidatos) {
    const t = String(c || "").trim();
    if (t.length > best.length) best = t;
  }
  return best;
}

function elegirEmailFusionados(grupo) {
  const reales = grupo.map((u) => String(u.email || "").trim()).filter(esEmailReal);
  if (reales.length > 0) {
    reales.sort((a, b) => b.length - a.length);
    return reales[0].toLowerCase();
  }
  const cualquiera = grupo.map((u) => String(u.email || "").trim()).filter(Boolean);
  cualquiera.sort((a, b) => b.length - a.length);
  return cualquiera[0] ? cualquiera[0].toLowerCase() : "";
}

function fusionarCamposEscalares(principal, otros, claves) {
  const out = { ...principal };
  for (const k of claves) {
    if (String(out[k] || "").trim() !== "") continue;
    for (const o of otros) {
      const v = o[k];
      if (v != null && String(v).trim() !== "") {
        out[k] = v;
        break;
      }
    }
  }
  return out;
}

const CAMPOS_PERFIL = [
  "dni",
  "direccion",
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
];

/**
 * @param {object[]} grupo Mismo tel9 válido, length >= 2
 * @returns {{ merged: object, eliminadosIds: (string|number)[], principalId: string|number }}
 */
function fusionarGrupo(grupo) {
  const ordenados = ordenarCandidatosPrincipal(grupo);
  const principal = ordenados[0];
  const otros = ordenados.slice(1);
  const eliminadosIds = otros.map((u) => u.id);

  const dirsList = [principal.direcciones, ...otros.map((o) => o.direcciones)];
  const direcciones = unirDireccionesSinDuplicados(dirsList);
  let direccionPredeterminadaId = String(principal.direccionPredeterminadaId || "").trim();
  if (direccionPredeterminadaId && !direcciones.some((d) => d.id === direccionPredeterminadaId)) {
    direccionPredeterminadaId = direcciones[0]?.id || "";
  } else if (!direccionPredeterminadaId && direcciones[0]) {
    direccionPredeterminadaId = direcciones[0].id;
  }

  const nombre = nombreMasCompleto(principal.nombre, ...otros.map((o) => o.nombre));
  const email = elegirEmailFusionados(grupo);
  const tel9 = normalizarTelefono(principal.telefono);
  const telefonoCanon = telefonoMovilESValido(tel9) ? `+34${tel9}` : String(principal.telefono || "").trim();

  let merged = {
    ...principal,
    nombre,
    email,
    telefono: telefonoCanon,
    direcciones,
    direccionPredeterminadaId
  };

  merged = fusionarCamposEscalares(merged, otros, CAMPOS_PERFIL);

  merged.verificado = Boolean(principal.verificado || otros.some((o) => o.verificado));

  return {
    merged,
    eliminadosIds,
    principalId: principal.id
  };
}

function usuarioIdBackend(id) {
  return `user_${String(id ?? "").trim()}`;
}

async function main() {
  await fs.mkdir(dataDir, { recursive: true });

  const rawU = await fs.readFile(usuariosFile, "utf8").catch(() => "[]");
  let usuarios = JSON.parse(rawU);
  if (!Array.isArray(usuarios)) usuarios = [];

  /** @type {Map<string, object[]>} */
  const porTel = new Map();
  const sinTelValido = [];

  for (const u of usuarios) {
    if (!u || typeof u !== "object") continue;
    const telNorm = normalizarTelefono(u.telefono);
    if (!telefonoMovilESValido(telNorm)) {
      sinTelValido.push(u);
      continue;
    }
    const list = porTel.get(telNorm) || [];
    list.push(u);
    porTel.set(telNorm, list);
  }

  const informe = {
    dryRun: DRY_RUN,
    gruposDuplicados: [],
    usuariosFusionados: 0,
    usuariosEliminados: 0,
    pedidosActualizados: 0,
    carritosActualizados: 0
  };

  /** @type {Map<string, string>} usuarioId antiguo → usuarioId nuevo (solo eliminados) */
  const mapUsuarioId = new Map();

  const resultadoUsuarios = [...sinTelValido];

  for (const [tel9, grupo] of porTel) {
    if (grupo.length === 1) {
      resultadoUsuarios.push(grupo[0]);
      continue;
    }

    const { merged, eliminadosIds, principalId } = fusionarGrupo(grupo);
    resultadoUsuarios.push(merged);
    informe.gruposDuplicados.push({
      telefonoNorm: tel9,
      principalId,
      eliminadosIds,
      emailResultado: merged.email
    });
    informe.usuariosFusionados += 1;
    informe.usuariosEliminados += eliminadosIds.length;

    const nuevoUid = usuarioIdBackend(principalId);
    for (const id of eliminadosIds) {
      mapUsuarioId.set(usuarioIdBackend(id), nuevoUid);
    }
  }

  let pedidos = [];
  try {
    const rawP = await fs.readFile(pedidosFile, "utf8");
    const p = JSON.parse(rawP);
    pedidos = Array.isArray(p) ? p : [];
  } catch {
    pedidos = [];
  }

  const pedidosSiguiente = pedidos.map((ped) => {
    if (!ped || typeof ped !== "object") return ped;
    const uid = String(ped.usuarioId || "").trim();
    const mapped = mapUsuarioId.get(uid);
    if (!mapped || mapped === uid) return ped;
    informe.pedidosActualizados += 1;
    return { ...ped, usuarioId: mapped };
  });

  let carritos = [];
  try {
    const rawC = await fs.readFile(carritosFile, "utf8");
    const c = JSON.parse(rawC);
    carritos = Array.isArray(c) ? c : [];
  } catch {
    carritos = [];
  }

  const carritosSiguiente = carritos.map((row) => {
    if (!row || typeof row !== "object") return row;
    const uid = String(row.usuarioId || "").trim();
    const mapped = mapUsuarioId.get(uid);
    if (!mapped || mapped === uid) return row;
    informe.carritosActualizados += 1;
    return { ...row, usuarioId: mapped };
  });

  console.log(JSON.stringify(informe, null, 2));

  if (DRY_RUN) {
    console.error("\n[dedupe] Modo --dry-run: no se ha escrito ningún archivo.");
    return;
  }

  if (informe.gruposDuplicados.length === 0) {
    console.error("\n[dedupe] No hay duplicados por teléfono válido. Nada que guardar.");
    return;
  }

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const backupU = path.join(dataDir, `usuarios.pre-fusion-telefono.${ts}.json`);
  const backupP = path.join(dataDir, `pedidos.pre-fusion-telefono.${ts}.json`);
  const backupC = path.join(dataDir, `carritos.pre-fusion-telefono.${ts}.json`);

  await fs.writeFile(backupU, JSON.stringify(usuarios, null, 2), "utf8");
  await fs.writeFile(backupP, JSON.stringify(pedidos, null, 2), "utf8");
  await fs.writeFile(backupC, JSON.stringify(carritos, null, 2), "utf8");

  await fs.writeFile(usuariosFile, JSON.stringify(resultadoUsuarios, null, 2), "utf8");
  await fs.writeFile(pedidosFile, JSON.stringify(pedidosSiguiente, null, 2), "utf8");
  await fs.writeFile(carritosFile, JSON.stringify(carritosSiguiente, null, 2), "utf8");

  console.error("\n[dedupe] Copias de seguridad:");
  console.error(" ", backupU);
  console.error(" ", backupP);
  console.error(" ", backupC);
  console.error("[dedupe] Escritura completada.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
