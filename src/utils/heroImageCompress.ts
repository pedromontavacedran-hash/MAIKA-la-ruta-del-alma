/**
 * Normaliza subidas del hero hacia un perfil parecido al banner por defecto (`HERO_BANNER_DEFAULT_SRC`):
 * mismo orden de magnitud en píxeles y en peso aproximado para localStorage / vista previa.
 *
 * Opcionalmente, si se pasa la imagen hero **actual** (`dimensionesReferenciaSrc`), la nueva imagen
 * se escala y recorta (cover) para quedar en **las mismas medidas en píxeles** que esa referencia.
 */

import { HERO_BANNER_DEFAULT_SRC } from "./heroBannerConfig";

const JPEG_CALIDAD_INICIAL = 0.88;
const JPEG_CALIDAD_MIN = 0.48;
const JPEG_PASO = 0.055;

function esRasterDataUrl(dataUrl: string): boolean {
  if (!dataUrl.startsWith("data:image/")) return false;
  if (dataUrl.startsWith("data:image/svg")) return false;
  return /^data:image\/(png|jpe?g|webp|gif|bmp|avif)/i.test(dataUrl.split(";")[0] || "");
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("imagen"));
    img.src = src;
  });
}

/** Escala y recorta la imagen para llenar W×H (centrado), como object-fit: cover. */
function dibujarCover(
  img: HTMLImageElement,
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number
): void {
  const sw = img.naturalWidth || img.width;
  const sh = img.naturalHeight || img.height;
  if (!sw || !sh) return;
  const scale = Math.max(W / sw, H / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  const dx = (W - dw) / 2;
  const dy = (H - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

export type ReferenciaHeroOriginal = {
  /** Lado largo máximo del canvas (como el JPG por defecto del repo). */
  maxLado: number;
  /** Longitud máxima aproximada del `data:` en base64 (margen sobre el original). */
  maxCharsObjetivo: number;
};

let cacheReferencia: Promise<ReferenciaHeroOriginal> | null = null;

/**
 * Lee `/banner.jpg` (o la ruta configurada): píxeles y tamaño en red para fijar metas de compresión.
 */
export function obtenerReferenciaHeroDesdeOriginal(): Promise<ReferenciaHeroOriginal> {
  if (cacheReferencia) return cacheReferencia;
  cacheReferencia = (async (): Promise<ReferenciaHeroOriginal> => {
    let maxLado = 1920;
    try {
      const img = await cargarImagen(HERO_BANNER_DEFAULT_SRC);
      const w = img.naturalWidth || 0;
      const h = img.naturalHeight || 0;
      const lado = Math.max(w, h);
      if (lado > 0) {
        maxLado = Math.min(2048, Math.max(960, lado));
      }
    } catch {
      /* HERO_BANNER_DEFAULT_SRC no cargó (404, CORS en raro); mantenemos 1920 */
    }

    let maxCharsObjetivo = 950_000;
    try {
      const res = await fetch(HERO_BANNER_DEFAULT_SRC, { cache: "force-cache" });
      const blob = await res.blob();
      const base64Teorico = Math.ceil((blob.size * 4) / 3);
      maxCharsObjetivo = Math.min(1_600_000, Math.max(420_000, Math.floor(base64Teorico * 1.18)));
    } catch {
      /* fetch fallido: techo conservador */
    }

    return { maxLado, maxCharsObjetivo };
  })();
  return cacheReferencia;
}

/** Por si en desarrollo sustituyes `banner.jpg` y quieres recalcular metas. */
export function invalidarReferenciaHeroOriginal(): void {
  cacheReferencia = null;
}

export type ComprimirDataUrlHeroOpciones = {
  /**
   * Ruta (`/banner.jpg`), URL o data URL del hero **vigente antes de sustituir**.
   * Si carga bien, la salida tendrá exactamente sus `naturalWidth` × `naturalHeight` (recorte cover).
   */
  dimensionesReferenciaSrc?: string;
};

/**
 * Reescala (si hace falta) y comprime a JPEG hasta acercarse al peso del hero por defecto.
 * Con `dimensionesReferenciaSrc`, la imagen nueva adopta las mismas medidas en píxeles que la referencia.
 * Si el canvas falla, devuelve el `dataUrl` de entrada.
 */
export async function comprimirDataUrlHeroSiHaceFalta(
  dataUrl: string,
  opciones?: ComprimirDataUrlHeroOpciones
): Promise<string> {
  if (typeof document === "undefined" || !esRasterDataUrl(dataUrl)) {
    return dataUrl;
  }

  let ref: ReferenciaHeroOriginal;
  try {
    ref = await obtenerReferenciaHeroDesdeOriginal();
  } catch {
    ref = { maxLado: 1920, maxCharsObjetivo: 950_000 };
  }

  let img: HTMLImageElement;
  try {
    img = await cargarImagen(dataUrl);
  } catch {
    return dataUrl;
  }

  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) return dataUrl;

  let targetW = 0;
  let targetH = 0;
  let usarDimensionesReferencia = false;
  const refSrc = opciones?.dimensionesReferenciaSrc?.trim();
  if (refSrc) {
    try {
      const refImg = await cargarImagen(refSrc);
      const rw = refImg.naturalWidth || refImg.width;
      const rh = refImg.naturalHeight || refImg.height;
      if (rw > 0 && rh > 0) {
        targetW = rw;
        targetH = rh;
        usarDimensionesReferencia = true;
      }
    } catch {
      /* seguimos con el modo clásico */
    }
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;

  let nw: number;
  let nh: number;

  if (usarDimensionesReferencia) {
    nw = targetW;
    nh = targetH;
    canvas.width = nw;
    canvas.height = nh;
    dibujarCover(img, ctx, nw, nh);
  } else {
    const ratio = Math.min(1, ref.maxLado / Math.max(w, h));
    nw = Math.max(1, Math.round(w * ratio));
    nh = Math.max(1, Math.round(h * ratio));
    canvas.width = nw;
    canvas.height = nh;
    ctx.drawImage(img, 0, 0, nw, nh);
  }

  const redibujar = () => {
    const c = canvas.getContext("2d");
    if (!c) return;
    c.clearRect(0, 0, canvas.width, canvas.height);
    if (usarDimensionesReferencia) {
      dibujarCover(img, c, canvas.width, canvas.height);
    } else {
      c.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
  };

  let q = JPEG_CALIDAD_INICIAL;
  let candidato = canvas.toDataURL("image/jpeg", q);

  while (candidato.length > ref.maxCharsObjetivo && q > JPEG_CALIDAD_MIN + 0.01) {
    q = Math.max(JPEG_CALIDAD_MIN, q - JPEG_PASO);
    candidato = canvas.toDataURL("image/jpeg", q);
  }

  while (candidato.length > ref.maxCharsObjetivo && canvas.width > 640) {
    nw = Math.max(640, Math.round(canvas.width * 0.88));
    nh = Math.max(360, Math.round(canvas.height * 0.88));
    canvas.width = nw;
    canvas.height = nh;
    redibujar();
    candidato = canvas.toDataURL("image/jpeg", q);
  }

  if (candidato.length <= ref.maxCharsObjetivo) return candidato;
  if (candidato.length < dataUrl.length) return candidato;
  if (dataUrl.length <= ref.maxCharsObjetivo) return dataUrl;
  return candidato;
}
