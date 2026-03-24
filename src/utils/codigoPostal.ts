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
  try {
    const response = await fetch(`https://api.zippopotam.us/es/${cp}`);
    if (!response.ok) return null;

    const data = (await response.json()) as {
      places?: Array<{
        state: string;
        "place name": string;
      }>;
    };

    const lugar = data.places?.[0];
    if (!lugar) return null;

    const poblacion = (lugar["place name"] || "").trim();
    const provincia = provinciaPorPrefijo[cp.slice(0, 2)] || (lugar.state || "").trim();
    const pais = "España";

    return { poblacion, provincia, pais };
  } catch {
    return null;
  }
}
