import { promises as fs } from "node:fs";
import path from "node:path";
import { dataDir } from "./env.js";

const webEstadoFile = path.join(dataDir, "webEstado.json");

const ESTADO_DEFAULT = { cerrada: false, mensaje: "" };

export async function leerWebEstado() {
  try {
    const raw = await fs.readFile(webEstadoFile, "utf8");
    const j = JSON.parse(raw);
    return {
      cerrada: j?.cerrada === true,
      mensaje: typeof j?.mensaje === "string" ? j.mensaje.slice(0, 300) : ""
    };
  } catch {
    return { ...ESTADO_DEFAULT };
  }
}

export async function guardarWebEstado(estado) {
  await fs.mkdir(dataDir, { recursive: true });
  const out = {
    cerrada: estado?.cerrada === true,
    mensaje: String(estado?.mensaje ?? "").slice(0, 300),
    actualizadoEn: new Date().toISOString()
  };
  await fs.writeFile(webEstadoFile, JSON.stringify(out, null, 2), "utf8");
  return out;
}
