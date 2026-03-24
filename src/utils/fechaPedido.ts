/**
 * Parsea fechas de pedidos: ISO, o cadenas típicas de toLocaleString() en español (dd/mm/yyyy[, hora]).
 */

export function parseFechaPedido(fecha: string | undefined | null): Date | null {
  if (fecha == null || typeof fecha !== "string") return null;
  const s = fecha.trim();
  if (!s) return null;

  const directa = new Date(s);
  if (!Number.isNaN(directa.getTime())) return directa;

  // dd/mm/aaaa[, o espacio] h:mm[:ss] (salida habitual de toLocaleString es-ES)
  const m = s.match(
    /(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s*[,\s]+\s*(\d{1,2}):(\d{2})(?::(\d{2}))?)?/i
  );
  if (m) {
    const dia = Number(m[1]);
    const mes = Number(m[2]);
    let anio = Number(m[3]);
    if (anio < 100) anio += 2000;
    const h = m[4] != null ? Number(m[4]) : 0;
    const min = m[5] != null ? Number(m[5]) : 0;
    const sec = m[6] != null ? Number(m[6]) : 0;
    if (mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31) {
      const dt = new Date(anio, mes - 1, dia, h, min, sec);
      if (!Number.isNaN(dt.getTime())) return dt;
    }
  }

  // Intento antiguo: asumir que el motor esperaba mm/dd si falló dd/mm
  const sinComas = s.replace(/,/g, " ");
  const normalizada = sinComas.replace(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/, "$2/$1/$3");
  const alternativa = new Date(normalizada);
  if (!Number.isNaN(alternativa.getTime())) return alternativa;

  return null;
}

/** Texto para la UI; si no se puede parsear pero hay texto, se muestra tal cual. */
export function textoFechaPedido(fecha: string | undefined | null, conHora = true): string {
  const d = parseFechaPedido(fecha ?? "");
  if (d) {
    return conHora
      ? d.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })
      : d.toLocaleDateString("es-ES", { dateStyle: "short" });
  }
  const t = (fecha ?? "").trim();
  return t || "—";
}
