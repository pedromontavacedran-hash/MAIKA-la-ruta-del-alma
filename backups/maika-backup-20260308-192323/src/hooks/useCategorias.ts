import { useState, useEffect, useCallback } from "react";
import type { CategoriaEntrada } from "../types";
import { CATEGORIA_IMAGENES_KEY } from "../config";

const CATALOGO_DEFAULT: CategoriaEntrada[] = [
  { id: "velas", nombre: "velas" },
  { id: "inciensos", nombre: "inciensos" },
  { id: "figuras", nombre: "figuras" },
];

function normalizarCategoriasCatalogo(raw: unknown): CategoriaEntrada[] {
  if (Array.isArray(raw)) {
    return raw.map((c) =>
      typeof c === "string"
        ? { id: c.toLowerCase(), nombre: c }
        : typeof c === "object" && c !== null && "id" in c && "nombre" in c
          ? { id: String((c as CategoriaEntrada).id), nombre: String((c as CategoriaEntrada).nombre) }
          : { id: "velas", nombre: "velas" }
    );
  }
  return [...CATALOGO_DEFAULT];
}

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
    localStorage.setItem("categoriasCatalogo", JSON.stringify(categoriasCatalogo));
  }, [categoriasCatalogo]);

  const loadCategoryImage = useCallback((categoriaId: string) => {
    try {
      const raw = localStorage.getItem(CATEGORIA_IMAGENES_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      const img = map[categoriaId];
      setPreviewCategoria(typeof img === "string" && img.length > 0 ? img : null);
    } catch {
      setPreviewCategoria(null);
    }
  }, []);

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
