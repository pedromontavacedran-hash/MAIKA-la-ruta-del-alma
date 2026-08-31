/**
 * Base URL del backend (login, pedidos, carrito).
 *
 * En navegador en el PC, `http://localhost:3001` suele ser correcto.
 * En la APK, `localhost` es el propio teléfono: la petición falla y el login no funciona.
 *
 * Solución: antes de `npm run build`, define `VITE_API_URL` (p. ej. en `.env.production`)
 * con la URL pública de tu API, o rellena `public/maika-api.json` → `apiBaseUrl`.
 */
function stripTrailingSlash(s: string): string {
  return s.replace(/\/+$/, "");
}

/** `maika-api.json` suele traer `http://localhost:3001` para dev en el PC; en el móvil por IP eso apunta al propio teléfono y rompe el probe /health. */
function apiBaseApuntaSoloLoopback(urlString: string): boolean {
  try {
    const u = new URL(urlString);
    return u.hostname === "localhost" || u.hostname === "127.0.0.1";
  } catch {
    return /\blocalhost\b|127\.0\.0\.1/.test(urlString);
  }
}

function paginaEsLoopback(): boolean {
  if (typeof window === "undefined") return true;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1";
}

/** IPv4 privada típica (Wi‑Fi / LAN): mismo host que la página → API en :3001. Evita que en móvil se use localhost (el propio teléfono). */
function esIPv4PrivadaLan(hostname: string): boolean {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return false;
  const p = hostname.split(".").map((n) => Number(n));
  if (p.length !== 4 || p.some((n) => !Number.isFinite(n) || n > 255)) return false;
  const [a, b] = p;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

/**
 * Mismo host que la página, puerto 3001 (cookies httpOnly requieren mismo hostname).
 */
function apiUrlFromPageHost(): string | null {
  if (typeof window === "undefined") return null;
  const h = window.location.hostname;
  if (h === "localhost" || h === "127.0.0.1") return `http://${h}:3001`;
  if (esIPv4PrivadaLan(h)) return `http://${h}:3001`;
  return null;
}

function preferApiHostDeLaPaginaEnLoopback(configured: string): string {
  const fromHost = apiUrlFromPageHost();
  if (!fromHost || !paginaEsLoopback()) return configured;
  if (!apiBaseApuntaSoloLoopback(configured)) return configured;
  try {
    if (new URL(configured).hostname !== new URL(fromHost).hostname) return fromHost;
  } catch {
    return fromHost;
  }
  return configured;
}

export async function resolveApiBaseUrl(): Promise<string> {
  const env = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  const fallback = "http://localhost:3001";
  let fromFile = "";
  try {
    const res = await fetch("/maika-api.json", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { apiBaseUrl?: string };
      fromFile = typeof data.apiBaseUrl === "string" ? data.apiBaseUrl.trim() : "";
    }
  } catch {
    /* sin archivo */
  }
  const ignorarArchivoLoopbackEnDispositivoRemoto =
    Boolean(fromFile) && apiBaseApuntaSoloLoopback(fromFile) && !paginaEsLoopback();
  if (fromFile && !ignorarArchivoLoopbackEnDispositivoRemoto) {
    return stripTrailingSlash(preferApiHostDeLaPaginaEnLoopback(fromFile));
  }
  const fromHost = apiUrlFromPageHost();
  if (fromHost) return fromHost;
  if (fromFile && !apiBaseApuntaSoloLoopback(fromFile)) return stripTrailingSlash(fromFile);
  return stripTrailingSlash(env || fallback);
}

/** Usar tras el arranque (main.tsx asigna `window.__MAIKA_API_BASE__`). */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const w = (window as Window & { __MAIKA_API_BASE__?: string }).__MAIKA_API_BASE__?.trim();
    if (w) {
      if (!paginaEsLoopback() && apiBaseApuntaSoloLoopback(w)) {
        const fromHost = apiUrlFromPageHost();
        if (fromHost) return stripTrailingSlash(fromHost);
      }
      return stripTrailingSlash(preferApiHostDeLaPaginaEnLoopback(w));
    }
  }
  const fromHost = apiUrlFromPageHost();
  if (fromHost) return fromHost;
  const env = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  return stripTrailingSlash(env || "http://localhost:3001");
}
