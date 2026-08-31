export type DatosCodigoPostal = {
  poblacion: string;
  provincia: string;
  pais: string;
};

export async function obtenerDatosCodigoPostal(
  cp: string,
  provinciaPorPrefijo: Record<string, string>
): Promise<DatosCodigoPostal | null> {
  if (!/^\d{5}$/.test(cp)) return null;
  const provinciaPorCp = (provinciaPorPrefijo[cp.slice(0, 2)] || "").trim();
  const paisDefault = "España";
  try {
    const response = await fetch(`https://api.zippopotam.us/es/${cp}`);
    if (response.ok) {
      const data = (await response.json()) as {
        places?: Array<{
          state: string;
          "place name": string;
        }>;
      };

      const lugar = data.places?.[0];
      if (lugar) {
        const poblacion = (lugar["place name"] || "").trim();
        const provincia = provinciaPorCp || (lugar.state || "").trim();
        const pais = paisDefault;
        return { poblacion, provincia, pais };
      }
    }
  } catch {
    // Fallback abajo.
  }

  try {
    const nominatimUrl =
      `https://nominatim.openstreetmap.org/search?country=Spain&postalcode=${encodeURIComponent(cp)}` +
      "&format=jsonv2&addressdetails=1&limit=1";
    const response = await fetch(nominatimUrl, {
      headers: { "Accept-Language": "es" }
    });
    if (!response.ok) return null;

    const data = (await response.json()) as Array<{
      address?: {
        town?: string;
        city?: string;
        village?: string;
        municipality?: string;
        state?: string;
      };
    }>;

    const first = data?.[0];
    if (!first?.address) return null;

    const poblacion = (
      first.address.town ||
      first.address.city ||
      first.address.village ||
      first.address.municipality ||
      ""
    ).trim();
    const provincia = (provinciaPorCp || first.address.state || "").trim();
    const pais = paisDefault;
    if (!poblacion && !provincia) {
      return { poblacion: "", provincia: provinciaPorCp, pais: paisDefault };
    }
    return { poblacion, provincia, pais };
  } catch {
    return { poblacion: "", provincia: provinciaPorCp, pais: paisDefault };
  }
}
