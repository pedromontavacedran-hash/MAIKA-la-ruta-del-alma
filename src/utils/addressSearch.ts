import { limpiarQuery } from "./query";

export type SugerenciaDireccion = {
  display_name: string;
  address?: {
    road?: string;
    house_number?: string;
    postcode?: string;
    city?: string;
    state?: string;
    county?: string;
  };
};

export function normalizarPhotonFeature(f: { properties?: Record<string, unknown> }): SugerenciaDireccion | null {
  const p = (f.properties || {}) as Record<string, string>;
  const street = p.street || p.name || "";
  if (!street && !p.name) return null;
  const num = p.housenumber || "";
  const city = p.city || "";
  const pc = p.postcode || "";
  const line = [street, num].filter(Boolean).join(" ");
  const display = [line, pc, city].filter(Boolean).join(", ") || String(p.name || "Dirección");
  return {
    display_name: display,
    address: {
      road: street || undefined,
      house_number: num || undefined,
      postcode: pc || undefined,
      city: city || undefined,
      state: p.state || undefined,
      county: p.county || undefined
    }
  };
}

export function construirQueryBusquedaDireccion(calle: string, cp: string, poblacion: string): string {
  let queryRaw: string;
  if (cp.length === 5) {
    queryRaw = `${limpiarQuery(calle)} ${cp}`;
  } else if (poblacion) {
    queryRaw = `${limpiarQuery(calle)} ${poblacion}`;
  } else {
    queryRaw = limpiarQuery(calle);
  }
  return String(queryRaw ?? "").replace(/\s+/g, " ").trim();
}

export function filtrarSugerenciasPorCp(data: SugerenciaDireccion[], cp: string): SugerenciaDireccion[] {
  if (cp.length !== 5) return data;
  const cpNorm = cp;
  return data.filter((s) => (s.address?.postcode || "").replace(/\D/g, "").slice(0, 5) === cpNorm);
}
