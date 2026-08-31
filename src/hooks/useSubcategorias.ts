import { useState, useEffect, useCallback } from "react";
import type { SubcategoriaEntrada } from "../types";
import {
  fetchSubcategoriasTienda,
  postAdminSubcategoriaApi,
  putAdminSubcategoriaApi,
  deleteAdminSubcategoriaApi
} from "../services/apiCategorias";

const SUBCATEGORIAS_KEY = "subcategoriasCatalogo";

/** Semilla real de "Joyería del alma" (categoriaId "joyas"), pedida explícitamente. */
const SUBCATEGORIAS_DEFAULT: SubcategoriaEntrada[] = [
  { id: "collares", categoriaId: "joyas", nombre: "Collares" },
  { id: "colgantes-amuletos", categoriaId: "joyas", nombre: "Colgantes y Amuletos" },
  { id: "pulseras", categoriaId: "joyas", nombre: "Pulseras" },
  { id: "anillos", categoriaId: "joyas", nombre: "Anillos" },
  { id: "pendientes", categoriaId: "joyas", nombre: "Pendientes" }
];

function normalizarSubcategoriasCatalogo(raw: unknown): SubcategoriaEntrada[] {
  if (!Array.isArray(raw)) return [...SUBCATEGORIAS_DEFAULT];
  const list = raw
    .map((s) =>
      typeof s === "object" && s !== null && "id" in s && "categoriaId" in s && "nombre" in s
        ? {
            id: String((s as SubcategoriaEntrada).id),
            categoriaId: String((s as SubcategoriaEntrada).categoriaId),
            nombre: String((s as SubcategoriaEntrada).nombre)
          }
        : null
    )
    .filter((s): s is SubcategoriaEntrada => s !== null);
  for (const seed of SUBCATEGORIAS_DEFAULT) {
    if (!list.some((s) => s.id === seed.id && s.categoriaId === seed.categoriaId)) list.push(seed);
  }
  return list;
}

/**
 * Subcategorías: fuente real es el backend (`GET /subcategorias`, visible para cualquier visitante,
 * igual que las categorías). `localStorage` es solo caché de primer pintado / respaldo offline.
 */
export function useSubcategorias() {
  const [subcategoriasCatalogo, setSubcategoriasCatalogo] = useState<SubcategoriaEntrada[]>(() => {
    try {
      const guardado = localStorage.getItem(SUBCATEGORIAS_KEY);
      return normalizarSubcategoriasCatalogo(guardado ? JSON.parse(guardado) : null);
    } catch {
      return [...SUBCATEGORIAS_DEFAULT];
    }
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const desdeApi = await fetchSubcategoriasTienda();
      if (cancelled || !desdeApi) return;
      /**
       * El backend es la fuente de verdad: se reemplaza el estado local sin conservar "extras".
       * `agregarSubcategoria` ya no crea nada en local si el POST al servidor falla (lanza),
       * así que cualquier entrada puramente local a estas alturas es un resto de un fallo antiguo
       * (p. ej. "estar") y no debe resucitar en cada carga.
       */
      setSubcategoriasCatalogo(normalizarSubcategoriasCatalogo(desdeApi));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(SUBCATEGORIAS_KEY, JSON.stringify(subcategoriasCatalogo));
  }, [subcategoriasCatalogo]);

  const subcategoriasDe = useCallback(
    (categoriaId: string): SubcategoriaEntrada[] => subcategoriasCatalogo.filter((s) => s.categoriaId === categoriaId),
    [subcategoriasCatalogo]
  );

  /** Lanza con el mensaje real (validación local, o el error que devuelva el servidor) si falla. */
  const agregarSubcategoria = useCallback(
    async (categoriaId: string, nombre: string): Promise<SubcategoriaEntrada> => {
      const nombreTrim = nombre.trim();
      if (!nombreTrim) throw new Error("Escribe un nombre para la subcategoría");
      const nombreNorm = nombreTrim.toLowerCase();
      if (subcategoriasCatalogo.some((s) => s.categoriaId === categoriaId && s.nombre.trim().toLowerCase() === nombreNorm)) {
        throw new Error("Ya existe una subcategoría con ese nombre en esta categoría");
      }
      const creada = await postAdminSubcategoriaApi(categoriaId, nombreTrim);
      setSubcategoriasCatalogo((prev) => [...prev, creada]);
      return creada;
    },
    [subcategoriasCatalogo]
  );

  const renombrarSubcategoria = useCallback(async (id: string, nombre: string): Promise<void> => {
    const nombreTrim = nombre.trim();
    if (!nombreTrim) throw new Error("Escribe un nombre para la subcategoría");
    const actualizada = await putAdminSubcategoriaApi(id, nombreTrim);
    setSubcategoriasCatalogo((prev) => prev.map((s) => (s.id === id ? actualizada : s)));
  }, []);

  const eliminarSubcategoria = useCallback(async (id: string): Promise<void> => {
    await deleteAdminSubcategoriaApi(id);
    setSubcategoriasCatalogo((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return {
    subcategoriasCatalogo,
    setSubcategoriasCatalogo,
    subcategoriasDe,
    agregarSubcategoria,
    renombrarSubcategoria,
    eliminarSubcategoria
  };
}
