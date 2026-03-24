export function limpiarQuery(text: string): string {
  return text
    .toLowerCase()
    .replace(/calle|carrer|avenida|avda|plaza|passeig|paseo/gi, " ")
    .replace(/\bi\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
