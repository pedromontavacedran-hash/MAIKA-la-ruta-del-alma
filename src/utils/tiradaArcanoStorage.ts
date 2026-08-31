import type { SignoId } from "@/utils/horoscopoDiario";

export function claveArcanoTirada(signo: SignoId): string {
  return `tirada-arcano-${signo}`;
}

function fechaLocalHoy(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function leerIndiceArcanoTirada(signo: SignoId): number | null {
  const key = claveArcanoTirada(signo);
  const raw = localStorage.getItem(key);
  if (raw == null) return null;

  // Compatibilidad con formato legacy (solo número)
  const legacy = Number.parseInt(raw, 10);
  if (Number.isInteger(legacy) && legacy >= 0 && legacy <= 21) {
    // Migra a formato diario para que a partir de ahora rote por fecha.
    localStorage.setItem(
      key,
      JSON.stringify({
        indice: legacy,
        fecha: fechaLocalHoy()
      })
    );
    return legacy;
  }

  try {
    const parsed = JSON.parse(raw) as { indice?: number; fecha?: string };
    if (!parsed || typeof parsed !== "object") return null;
    const indice = Number(parsed.indice);
    const fecha = String(parsed.fecha ?? "");
    if (!Number.isInteger(indice) || indice < 0 || indice > 21) return null;
    if (fecha !== fechaLocalHoy()) {
      localStorage.removeItem(key);
      return null;
    }
    return indice;
  } catch {
    return null;
  }
}

export function guardarIndiceArcanoTirada(signo: SignoId, indice: number): void {
  const i = ((indice % 22) + 22) % 22;
  localStorage.setItem(
    claveArcanoTirada(signo),
    JSON.stringify({
      indice: i,
      fecha: fechaLocalHoy()
    })
  );
}

export function indiceArcanoAleatorio(): number {
  return Math.floor(Math.random() * 22);
}

export function quitarArcanoTirada(signo: SignoId): void {
  localStorage.removeItem(claveArcanoTirada(signo));
}
