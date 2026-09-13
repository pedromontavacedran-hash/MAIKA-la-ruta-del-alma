/**
 * Día natural en hora de España (Europe/Madrid), formato "YYYY-MM-DD".
 * Compartido por los límites diarios de horóscopo y sueños: el contador se reinicia a las
 * 00:00 hora española, no tras 24 h rodantes.
 */
export function fechaHoyEspana() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());
}

/** Ms que faltan hasta la próxima medianoche Europe/Madrid (momento en que el límite diario se libera). */
export function msHastaMedianocheEspana() {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" });
  const hoy = fmt.format(new Date());
  const now = Date.now();
  let hi = now + 60_000;
  while (fmt.format(new Date(hi)) === hoy) hi += 3_600_000;
  let lo = now;
  while (hi - lo > 1_000) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (fmt.format(new Date(mid)) === hoy) lo = mid;
    else hi = mid;
  }
  return Math.max(0, hi - now);
}
