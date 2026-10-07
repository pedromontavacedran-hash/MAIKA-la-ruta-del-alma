/*
 * Bibliografía visible de Rutas del Alma.
 * Espejo de presentación del registro interno
 * (backend/data/rutasDelAlma/fuentes.json): aquí solo vive lo que se muestra —
 * autor, título, edición y enlace legal. Las páginas se citan únicamente en la
 * base interna, cuando se hayan verificado en la obra.
 */

export type ObraAcademica = {
  id: string;
  autor: string;
  titulo: string;
  edicion: string;
  enlace?: string;
  /** Qué documenta la obra dentro de la sección. */
  ambito: string;
};

export const OBRAS_ACADEMICAS: Record<string, ObraAcademica> = {
  scholem: {
    id: "scholem-origins-kabbalah",
    autor: "Gershom Scholem",
    titulo: "Origins of the Kabbalah",
    edicion: "Jewish Publication Society / Princeton University Press, 1987",
    enlace: "https://archive.org/details/originsofkabbala0000scho",
    ambito: "Orígenes históricos de la Cábala medieval (Provenza, Cataluña, primeros cabalistas, Bahir)."
  },
  idel: {
    id: "idel-new-perspectives",
    autor: "Moshe Idel",
    titulo: "Kabbalah: New Perspectives",
    edicion: "Yale University Press, 1988",
    enlace: "https://archive.org/details/kabbalahnewpersp0000idel",
    ambito: "Perspectivas académicas: corrientes, experiencia mística y evolución de la Cábala."
  },
  giller: {
    id: "giller-reading-zohar",
    autor: "Pinchas Giller",
    titulo: "Reading the Zohar: The Sacred Text of the Kabbalah",
    edicion: "Oxford University Press, 2001",
    enlace: "https://books.google.com/books?id=e8vnCwAAQBAJ",
    ambito: "Zóhar: estructura, recepción y tradición zohárica."
  }
};
