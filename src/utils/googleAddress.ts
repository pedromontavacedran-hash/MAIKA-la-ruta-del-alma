export type GoogleAddressComponent = {
  types: string[];
  long_name: string;
  short_name: string;
};

export function parseGoogleAddressComponents(
  components: GoogleAddressComponent[]
): {
  route: string;
  streetNumber: string;
  postalCode: string;
  locality: string;
  province: string;
} {
  const get = (type: string) => components.find((c) => c.types.includes(type))?.long_name ?? "";
  const getShort = (type: string) => components.find((c) => c.types.includes(type))?.short_name ?? "";

  const route = get("route");
  const streetNumber = get("street_number");
  const postalCode = (getShort("postal_code") || get("postal_code") || "").replace(/\D/g, "").slice(0, 5);
  const locality = get("locality") || get("sublocality") || get("administrative_area_level_3");
  const province = get("administrative_area_level_2") || get("administrative_area_level_1");

  return { route, streetNumber, postalCode, locality, province };
}
