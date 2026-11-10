import { promises as fs } from "node:fs";
import path from "node:path";
import { dataDir } from "./env.js";

const enlacesFile = path.join(dataDir, "enlaces.json");

const MAX_ENLACES = 30;
const MAX_ETIQUETA = 80;
const MAX_URL = 300;
const MAX_ICONO = 16;

/** Enlaces iniciales de `/enlaces` (los edita el admin; el QR siempre apuntará a esa página). */
export const ENLACES_DEFAULT = [
  {
    id: "tienda",
    etiqueta: "Tienda online",
    url: "/tienda",
    icono: "🛍️",
    activa: true
  },
  {
    id: "tiktok",
    etiqueta: "TikTok",
    url: "https://www.tiktok.com/@maika.rutasdelalma",
    icono: "♪",
    activa: true
  },
  {
    id: "instagram",
    etiqueta: "Instagram",
    url: "https://www.instagram.com/maika.rutasdelalma/",
    icono: "📸",
    activa: true
  },
  {
    id: "whatsapp",
    etiqueta: "WhatsApp",
    url: "https://wa.me/34673175547?text=Hola%20MAIKA",
    icono: "💬",
    activa: true
  }
];

function urlEnlaceValida(url) {
  const u = String(url || "").trim();
  if (!u || u.length > MAX_URL) return false;
  // Ruta interna del propio sitio (sin "//" inicial: evitaría //dominio externo).
  if (u.startsWith("/") && !u.startsWith("//")) return true;
  return /^https?:\/\//i.test(u);
}

function sanearEnlace(e, indice) {
  const etiqueta = String(e?.etiqueta || "").trim().slice(0, MAX_ETIQUETA);
  const url = String(e?.url || "").trim().slice(0, MAX_URL);
  if (!etiqueta || !urlEnlaceValida(url)) return null;
  const idRaw = String(e?.id || "").trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
  return {
    id: idRaw || `enlace-${indice + 1}`,
    etiqueta,
    url,
    icono: String(e?.icono || "").trim().slice(0, MAX_ICONO),
    activa: e?.activa !== false
  };
}

export function sanearListaEnlaces(lista) {
  const vistos = new Set();
  const out = [];
  for (const e of Array.isArray(lista) ? lista : []) {
    const s = sanearEnlace(e, out.length);
    if (!s) continue;
    let id = s.id;
    let n = 2;
    while (vistos.has(id)) {
      id = `${s.id}-${n}`;
      n += 1;
    }
    vistos.add(id);
    out.push({ ...s, id });
    if (out.length >= MAX_ENLACES) break;
  }
  return out;
}

export async function leerEnlaces() {
  try {
    const raw = await fs.readFile(enlacesFile, "utf8");
    const j = JSON.parse(raw);
    // Archivo válido aunque la lista quede vacía (el admin puede retirarlo todo a propósito).
    if (Array.isArray(j?.enlaces)) return sanearListaEnlaces(j.enlaces);
  } catch {
    /* archivo ausente o corrupto → defaults */
  }
  return sanearListaEnlaces(ENLACES_DEFAULT);
}

export async function guardarEnlaces(lista) {
  await fs.mkdir(dataDir, { recursive: true });
  const enlaces = sanearListaEnlaces(lista);
  const out = { enlaces, actualizadoEn: new Date().toISOString() };
  await fs.writeFile(enlacesFile, JSON.stringify(out, null, 2), "utf8");
  return enlaces;
}
