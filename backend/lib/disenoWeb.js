import { promises as fs } from "node:fs";
import path from "node:path";
import { dataDir } from "./env.js";

const disenoWebFile = path.join(dataDir, "disenoWeb.json");
const PAYLOAD_MAX_BYTES = 8 * 1024 * 1024;

export async function leerDisenoWeb() {
  try {
    const raw = await fs.readFile(disenoWebFile, "utf8");
    const j = JSON.parse(raw);
    return j?.payload && typeof j.payload === "object" ? j.payload : null;
  } catch {
    return null;
  }
}

export async function guardarDisenoWeb(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, status: 400, error: "Payload inválido" };
  }
  const out = { payload, actualizadoEn: new Date().toISOString() };
  const raw = JSON.stringify(out);
  if (raw.length > PAYLOAD_MAX_BYTES) {
    return { ok: false, status: 413, error: "Diseño demasiado grande" };
  }
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(disenoWebFile, raw, "utf8");
  return { ok: true };
}
