import { useState, useEffect, useCallback } from "react";
import type { CategoriaEntrada } from "../types";
import { fetchCategoriasTienda } from "../services/apiCategorias";

const CATALOGO_DEFAULT: CategoriaEntrada[] = [
  { id: "velas", nombre: "velas" },
  { id: "inciensos", nombre: "inciensos" },
  { id: "figuras", nombre: "figuras" },
  { id: "kits", nombre: "kits" },
  { id: "joyas", nombre: "joyería del alma" },
];

function normalizarCategoriasCatalogo(raw: unknown): CategoriaEntrada[] {
  let list: CategoriaEntrada[];
  if (Array.isArray(raw)) {
    list = raw.map((c) => {
      if (typeof c === "string") return { id: c.toLowerCase(), nombre: c };
      if (typeof c === "object" && c !== null && "id" in c && "nombre" in c) {
        const entrada = c as CategoriaEntrada;
        const imagen = typeof entrada.imagen === "string" && entrada.imagen.length > 0 ? entrada.imagen : undefined;
        return imagen
          ? { id: String(entrada.id), nombre: String(entrada.nombre), imagen }
          : { id: String(entrada.id), nombre: String(entrada.nombre) };
      }
      return { id: "velas", nombre: "velas" };
    });
    if (!list.some((x) => x.id === "kits")) list.push({ id: "kits", nombre: "kits" });
    if (!list.some((x) => x.id === "joyas")) list.push({ id: "joyas", nombre: "joyería del alma" });
    return list;
  }
  return [...CATALOGO_DEFAULT];
}

/**
 * Categorías: fuente real es el backend (`GET /categorias`, visible para cualquier visitante).
 * `localStorage` es solo caché de primer pintado / respaldo offline, no la fuente de verdad.
 */
export function useCategorias() {
  const [categoriasCatalogo, setCategoriasCatalogo] = useState<CategoriaEntrada[]>(() => {
    try {
      const guardado = localStorage.getItem("categoriasCatalogo");
      return normalizarCategoriasCatalogo(guardado ? JSON.parse(guardado) : null);
    } catch {
      return [...CATALOGO_DEFAULT];
    }
  });

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>("velas");
  const [previewCategoria, setPreviewCategoria] = useState<string | null>(null);
  const [tamanoCategoria, setTamanoCategoria] = useState("22");
  const [colorCategoria, setColorCategoria] = useState("#ffffff");
  const [estiloTextoCategoria, setEstiloTextoCategoria] = useState("normal");
  const [nombreImagenCategoria, setNombreImagenCategoria] = useState("");

  const [nuevaCategoriaNombre, setNuevaCategoriaNombre] = useState("");
  const [nuevaCategoriaImagen, setNuevaCategoriaImagen] = useState<string | null>(null);
  const [nuevaCategoriaNombreImagen, setNuevaCategoriaNombreImagen] = useState("");
  const [nuevaCategoriaTamano, setNuevaCategoriaTamano] = useState("22");
  const [nuevaCategoriaColor, setNuevaCategoriaColor] = useState("#ffffff");
  const [nuevaCategoriaEstilo, setNuevaCategoriaEstilo] = useState("normal");
  const [categoriaARenombrar, setCategoriaARenombrar] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const desdeApi = await fetchCategoriasTienda();
      if (cancelled || !desdeApi || desdeApi.length === 0) return;
      const apiNormalizado = normalizarCategoriasCatalogo(desdeApi);
      /** Fusionar, no sobrescribir: no perder categorías creadas en este navegador antes de que el backend las conociera. */
      setCategoriasCatalogo((prevLocal) => {
        const extra = prevLocal.filter((local) => !apiNormalizado.some((c) => c.id === local.id));
        return [...apiNormalizado, ...extra];
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("categoriasCatalogo", JSON.stringify(categoriasCatalogo));
  }, [categoriasCatalogo]);

  /** La imagen real vive en `categoria.imagen` (backend), no en localStorage. */
  const loadCategoryImage = useCallback(
    (categoriaId: string) => {
      const categoria = categoriasCatalogo.find((c) => c.id === categoriaId);
      setPreviewCategoria(categoria?.imagen && categoria.imagen.length > 0 ? categoria.imagen : null);
    },
    [categoriasCatalogo]
  );

  return {
    categoriasCatalogo,
    setCategoriasCatalogo,
    categoriaSeleccionada,
    setCategoriaSeleccionada,
    previewCategoria,
    setPreviewCategoria,
    tamanoCategoria,
    setTamanoCategoria,
    colorCategoria,
    setColorCategoria,
    estiloTextoCategoria,
    setEstiloTextoCategoria,
    nombreImagenCategoria,
    setNombreImagenCategoria,
    nuevaCategoriaNombre,
    setNuevaCategoriaNombre,
    nuevaCategoriaImagen,
    setNuevaCategoriaImagen,
    nuevaCategoriaNombreImagen,
    setNuevaCategoriaNombreImagen,
    nuevaCategoriaTamano,
    setNuevaCategoriaTamano,
    nuevaCategoriaColor,
    setNuevaCategoriaColor,
    nuevaCategoriaEstilo,
    setNuevaCategoriaEstilo,
    categoriaARenombrar,
    setCategoriaARenombrar,
    normalizarCategoriasCatalogo,
    loadCategoryImage,
  };
}
