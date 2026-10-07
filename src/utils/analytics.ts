import { getApiBaseUrl } from "../config/apiBaseUrl";
import { ARTICULOS } from "../data/articulos";
import { isAdminAuthorized } from "./adminAuth";

/**
 * Analítica propia mínima (Fase 0): envía eventos agregados al backend.
 *
 * Qué se mide: sección visitada (lista cerrada, nunca el path completo ni la query),
 * si es la primera vista de la sesión de navegador, procedencia general del referrer,
 * tipo de dispositivo (móvil/escritorio) y duración aproximada al salir.
 *
 * Qué NO se mide: contenido (sueños, chats, formularios), identificadores de persona,
 * IP (el servidor la usa solo para rate-limit en memoria), User-Agent, resolución
 * exacta ni fingerprint. La "sesión" se detecta en cliente: la primera vista tras abrir
 * la pestaña se marca como entrada (bandera en memoria del módulo, no persistida);
 * `localStorage["maika_visitado"]` solo marca que el navegador ya estuvo alguna vez
 * para distinguir visita nueva de recurrente — no es una cookie ni identifica a nadie.
 */

const KEY_VISITADO = "maika_visitado";
/** Exclusión voluntaria: poner `localStorage["maika_analitica_off"]="1"` en un navegador propio. */
const KEY_EXCLUIDA = "maika_analitica_off";
const UMBRAL_MOVIL_PX = 768;

/** path → sección cerrada (espejo de `SECCIONES_ANALITICA` en backend/lib/analytics.js). */
function seccionDesdePathname(pathname: string): string {
  const p = pathname.split("?")[0].replace(/\/+$/, "") || "/";
  if (p === "/") return "inicio";
  const mapeo: Record<string, string> = {
    "/tienda": "tienda",
    "/carrito": "carrito",
    "/seguimiento": "seguimiento",
    "/servicios": "servicios",
    "/suenos": "suenos",
    "/sueno-premium": "suenos",
    "/horoscopos": "horoscopos",
    "/lectura": "lectura",
    "/ritual-del-mes": "ritual-del-mes",
    "/testimonios": "testimonios",
    "/sobre-maika": "sobre-maika",
    "/rutas-del-alma": "rutas-del-alma",
    "/articulos": "articulos",
    "/contacto": "contacto",
    "/envios": "envios",
    "/legal": "legal",
    "/cuenta": "cuenta",
    "/reset-password": "cuenta",
    "/admin": "admin"
  };
  const prefijos = Object.keys(mapeo)
    .filter((k) => p === k || p.startsWith(`${k}/`))
    .sort((a, b) => b.length - a.length);
  return prefijos.length ? mapeo[prefijos[0]] : "otra";
}

/** referrer → categoría cerrada; mismo origen o vacío = "directo". */
function procedenciaDesdeReferrer(): string {
  try {
    const ref = document.referrer;
    if (!ref) return "directo";
    const host = new URL(ref).hostname.toLowerCase();
    if (host === window.location.hostname) return "directo";
    if (/(^|\.)google\./.test(host) || host.endsWith(".google.com")) return "google";
    if (host.includes("instagram.")) return "instagram";
    if (host.includes("tiktok.")) return "tiktok";
    if (host.includes("whatsapp.") || host === "wa.me") return "whatsapp";
    if (host.includes("facebook.") || host === "fb.me" || host.includes("fbcdn.")) return "facebook";
    if (host.includes("pinterest.")) return "pinterest";
    return "otro";
  } catch {
    return "otro";
  }
}

/**
 * `/articulos/:slug` → slug editorial cerrado, solo si existe en `ARTICULOS`.
 * Así el backend nunca recibe identificadores inventados desde el navegador.
 */
export function articuloSlugDesdePathname(pathname: string): string | undefined {
  const p = pathname.split("?")[0].replace(/\/+$/, "");
  if (!p.startsWith("/articulos/")) return undefined;
  const slug = p.slice("/articulos/".length);
  return ARTICULOS.some((a) => a.slug === slug) ? slug : undefined;
}

function dispositivoActual(): "movil" | "escritorio" {
  return window.innerWidth < UMBRAL_MOVIL_PX ? "movil" : "escritorio";
}

let entradaPendiente = true;
let inicioPagina = Date.now();
let ultimaSeccion = "inicio";
let salidaEnviada = false;

/** El panel mide al público: no contamos rutas /admin, sesiones de administrador ni navegadores excluidos. */
function visitaExcluida(pathname: string): boolean {
  if (pathname.startsWith("/admin")) return true;
  if (isAdminAuthorized()) return true;
  try {
    return localStorage.getItem(KEY_EXCLUIDA) === "1";
  } catch {
    return false;
  }
}

function postBeacon(endpoint: string, payload: Record<string, unknown>): void {
  try {
    const url = `${getApiBaseUrl()}${endpoint}`;
    const body = JSON.stringify(payload);
    if (typeof navigator.sendBeacon === "function") {
      const ok = navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      if (ok) return;
    }
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "omit"
    }).catch(() => {});
  } catch {
    /* La estadística nunca interrumpe la navegación. */
  }
}

/** Llamar en cada cambio de ruta del SPA. */
export function registrarVistaAnalitica(pathname: string): void {
  try {
    if (typeof window === "undefined") return;
    if (visitaExcluida(pathname)) {
      entradaPendiente = false;
      salidaEnviada = true;
      return;
    }
    const seccion = seccionDesdePathname(pathname);
    ultimaSeccion = seccion;
    inicioPagina = Date.now();
    salidaEnviada = false;

    let primeraVez = false;
    const entrada = entradaPendiente;
    if (entrada) {
      entradaPendiente = false;
      try {
        primeraVez = !localStorage.getItem(KEY_VISITADO);
        if (primeraVez) localStorage.setItem(KEY_VISITADO, "1");
      } catch {
        /* localStorage puede estar bloqueado: se cuenta como recurrente. */
      }
    }

    const articulo = articuloSlugDesdePathname(pathname);
    postBeacon("/analytics/vista", {
      seccion,
      entrada,
      procedencia: entrada ? procedenciaDesdeReferrer() : "directo",
      dispositivo: dispositivoActual(),
      primeraVez,
      ...(articulo ? { articulo } : {})
    });
  } catch {
    /* noop */
  }
}

let salidaListenersInstalados = false;

/** Instala una sola vez los listeners de fin de visita (pagehide / pestaña oculta). */
export function instalarSalidaAnalitica(): void {
  if (typeof window === "undefined" || salidaListenersInstalados) return;
  salidaListenersInstalados = true;
  const enviar = () => {
    if (salidaEnviada || entradaPendiente) return;
    salidaEnviada = true;
    postBeacon("/analytics/salida", {
      seccion: ultimaSeccion,
      duracionMs: Date.now() - inicioPagina
    });
  };
  window.addEventListener("pagehide", enviar);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") enviar();
  });
}
