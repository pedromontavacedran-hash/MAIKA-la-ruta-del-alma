/** Extrae el cuerpo del texto legal desde el HTML estático (sin iframe). Quita la X si existiera. */
export function extractLegalStaticSource(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll(".cerrar, a.cerrar").forEach((el) => el.remove());
  const main = doc.querySelector("main.legal-static-source");
  const legacyCard = doc.querySelector(".card");
  const root = main ?? legacyCard ?? doc.body;
  return root.innerHTML.trim();
}
