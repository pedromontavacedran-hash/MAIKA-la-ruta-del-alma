/**
 * Redimensiona/comprime una imagen antes de guardarla como data URL (se envía tal cual al backend,
 * embebida en el JSON de producto/categoría). Las fotos de móvil sin tocar pesan varios MB y se ven
 * "inmensas" en cualquier sitio sin recorte fijo; esto las deja en un tamaño manejable y consistente.
 */
export function redimensionarImagenADataUrl(
  file: File,
  opciones: { ladoMax?: number; calidad?: number } = {}
): Promise<string> {
  const ladoMax = opciones.ladoMax ?? 1400;
  const calidad = opciones.calidad ?? 0.85;

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const escala = Math.min(1, ladoMax / Math.max(img.width, img.height));
      const ancho = Math.max(1, Math.round(img.width * escala));
      const alto = Math.max(1, Math.round(img.height * escala));

      const canvas = document.createElement("canvas");
      canvas.width = ancho;
      canvas.height = alto;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No se pudo redimensionar la imagen"));
        return;
      }
      ctx.drawImage(img, 0, 0, ancho, alto);
      resolve(canvas.toDataURL("image/jpeg", calidad));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}
