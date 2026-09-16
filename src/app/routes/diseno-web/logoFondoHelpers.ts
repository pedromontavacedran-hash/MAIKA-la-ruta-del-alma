/** Carga un data-URL de imagen y devuelve el HTMLImageElement resuelto. */
export function cargarImagenDataUrl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("imagen"));
    img.src = src;
  });
}

/**
 * Quita el fondo sólido (claro u oscuro) de un logo PNG/WebP detectando el color medio de las esquinas.
 * Si no hay fondo sólido claro/oscuro, devuelve el dataUrl original sin tocar.
 */
export async function quitarFondoSolidoLogoBarra(dataUrl: string): Promise<string> {
  if (typeof document === "undefined" || !/^data:image\/(png|webp)/i.test(dataUrl)) return dataUrl;
  const img = await cargarImagenDataUrl(dataUrl);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) return dataUrl;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const esquinas = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1]
  ] as const;
  let r = 0;
  let g = 0;
  let b = 0;
  for (const [x, y] of esquinas) {
    const i = (y * w + x) * 4;
    r += data[i] ?? 0;
    g += data[i + 1] ?? 0;
    b += data[i + 2] ?? 0;
  }
  r = Math.round(r / esquinas.length);
  g = Math.round(g / esquinas.length);
  b = Math.round(b / esquinas.length);

  const fondoClaro = r > 225 && g > 225 && b > 225;
  const fondoOscuro = r < 30 && g < 30 && b < 30;
  if (!fondoClaro && !fondoOscuro) return dataUrl;

  const tolerancia = fondoClaro ? 78 : 54;
  for (let i = 0; i < data.length; i += 4) {
    const dr = (data[i] ?? 0) - r;
    const dg = (data[i + 1] ?? 0) - g;
    const db = (data[i + 2] ?? 0) - b;
    const distancia = Math.sqrt(dr * dr + dg * dg + db * db);
    if (distancia <= tolerancia) {
      data[i + 3] = Math.round((distancia / tolerancia) * 255);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}
