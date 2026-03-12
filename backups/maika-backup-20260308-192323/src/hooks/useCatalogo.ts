import { useState, useEffect, useMemo, useCallback } from "react";
import type { Producto, ItemCarrito } from "../types";
import { CATALOGO_VELAS_KEY, CATALOGO_INCIENSOS_KEY, CATALOGO_FIGURAS_KEY, DEMO_ACTIVO_KEY, DEMO_CATALOGO_KEY } from "../config";
import { VELAS_INICIALES, INCIENSOS_INICIALES, FIGURAS_INICIALES } from "../data/catalogoInicial";
import { precioSeguro, idSeguro } from "../utils/precio";

export function useCatalogo() {
  const [velas, setVelas] = useState<Producto[]>(VELAS_INICIALES);
  const [inciensos, setInciensos] = useState<Producto[]>(INCIENSOS_INICIALES);
  const [figuras, setFiguras] = useState<Producto[]>(FIGURAS_INICIALES);

  const precioCatalogoPorId = useMemo(() => {
    const catalogo = [...velas, ...inciensos, ...figuras];
    return new Map<number, number>(
      catalogo.map((p) => [p.id, precioSeguro(p.precio)])
    );
  }, [velas, inciensos, figuras]);

  const precioCatalogoPorNombre = useMemo(() => {
    const catalogo = [...velas, ...inciensos, ...figuras];
    return new Map<string, number>(
      catalogo.map((p) => [p.nombre.trim().toLowerCase(), precioSeguro(p.precio)])
    );
  }, [velas, inciensos, figuras]);

  const getProductoByValue = useCallback(
    (value: string): Producto | undefined => {
      if (!value) return undefined;
      const [cat, idStr] = value.split("-");
      const id = Number(idStr);
      if (cat === "velas") return velas.find((p) => p.id === id);
      if (cat === "inciensos") return inciensos.find((p) => p.id === id);
      if (cat === "figuras") return figuras.find((p) => p.id === id);
      return undefined;
    },
    [velas, inciensos, figuras]
  );

  const precioItemCarrito = useCallback(
    (item: Pick<ItemCarrito, "id" | "precio" | "nombre">): number => {
      const precioDirecto = precioSeguro(item.precio);
      if (precioDirecto > 0) return precioDirecto;
      const idNorm = idSeguro(item.id);
      if (idNorm !== null) {
        const porId = precioCatalogoPorId.get(idNorm);
        if (typeof porId === "number" && porId > 0) return porId;
      }
      const nombreNorm = String(item.nombre || "").trim().toLowerCase();
      const porNombre = precioCatalogoPorNombre.get(nombreNorm);
      if (typeof porNombre === "number" && porNombre > 0) return porNombre;
      return 0;
    },
    [precioCatalogoPorId, precioCatalogoPorNombre]
  );

  const normalizarItemCarrito = useCallback(
    (item: ItemCarrito): ItemCarrito => {
      const idNorm = idSeguro(item.id) ?? item.id;
      const precioNorm = precioItemCarrito({ id: idNorm, precio: item.precio, nombre: item.nombre });
      const precioFinal =
        precioNorm > 0
          ? precioNorm
          : precioCatalogoPorNombre.get(String(item.nombre || "").trim().toLowerCase()) ?? 0;
      return {
        ...item,
        id: idNorm as number,
        precio: precioFinal,
        cantidad: Number.isFinite(Number(item.cantidad)) ? Number(item.cantidad) : 0,
      };
    },
    [precioItemCarrito, precioCatalogoPorNombre]
  );

  useEffect(() => {
    const demoActivo = localStorage.getItem(DEMO_ACTIVO_KEY) === "true";
    const catalogoDemoRaw = localStorage.getItem(DEMO_CATALOGO_KEY);
    if (demoActivo && catalogoDemoRaw) {
      try {
        const demo = JSON.parse(catalogoDemoRaw) as { velas: Producto[]; inciensos: Producto[]; figuras: Producto[] };
        if (Array.isArray(demo.velas)) setVelas(demo.velas);
        if (Array.isArray(demo.inciensos)) setInciensos(demo.inciensos);
        if (Array.isArray(demo.figuras)) setFiguras(demo.figuras);
      } catch {
        localStorage.removeItem(DEMO_CATALOGO_KEY);
      }
      return;
    }
    const v = localStorage.getItem(CATALOGO_VELAS_KEY);
    const i = localStorage.getItem(CATALOGO_INCIENSOS_KEY);
    const f = localStorage.getItem(CATALOGO_FIGURAS_KEY);
    if (v && i && f) {
      try {
        const vParsed = JSON.parse(v) as Producto[];
        const iParsed = JSON.parse(i) as Producto[];
        const fParsed = JSON.parse(f) as Producto[];
        if (Array.isArray(vParsed) && vParsed.length > 0) setVelas(vParsed);
        if (Array.isArray(iParsed) && iParsed.length > 0) setInciensos(iParsed);
        if (Array.isArray(fParsed) && fParsed.length > 0) setFiguras(fParsed);
      } catch {
        /* mantener valores por defecto */
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CATALOGO_VELAS_KEY, JSON.stringify(velas));
    localStorage.setItem(CATALOGO_INCIENSOS_KEY, JSON.stringify(inciensos));
    localStorage.setItem(CATALOGO_FIGURAS_KEY, JSON.stringify(figuras));
  }, [velas, inciensos, figuras]);

  return {
    velas,
    setVelas,
    inciensos,
    setInciensos,
    figuras,
    setFiguras,
    getProductoByValue,
    precioCatalogoPorId,
    precioCatalogoPorNombre,
    precioItemCarrito,
    normalizarItemCarrito,
  };
}
