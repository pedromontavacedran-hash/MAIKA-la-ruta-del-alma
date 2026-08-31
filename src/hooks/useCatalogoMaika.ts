import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type { Producto, ItemCarrito } from "../types";
import type { CatalogoActualizadoCheckout } from "../checkout/enviarPedidoWhatsApp";
import { CATALOGO_VELAS_KEY, CATALOGO_INCIENSOS_KEY, CATALOGO_FIGURAS_KEY, CATALOGO_KITS_KEY, CATALOGO_JOYAS_KEY, DEMO_ACTIVO_KEY, DEMO_CATALOGO_KEY } from "../config";
import { VELAS_INICIALES, INCIENSOS_INICIALES, FIGURAS_INICIALES, KITS_INICIALES, JOYAS_INICIALES } from "../data/catalogoInicial";
import { fetchProductosTienda } from "../services/apiProductos";
import { listaProductosSegura } from "../utils/listaProductosSegura";
import { precioSeguro, idSeguro } from "../utils/precio";

export function useCatalogoMaika() {
  const [velas, setVelas] = useState<Producto[]>(VELAS_INICIALES);
  const [inciensos, setInciensos] = useState<Producto[]>(INCIENSOS_INICIALES);
  const [figuras, setFiguras] = useState<Producto[]>(FIGURAS_INICIALES);
  const [kits, setKits] = useState<Producto[]>(KITS_INICIALES);
  const [joyas, setJoyas] = useState<Producto[]>(JOYAS_INICIALES);
  const omitirPrimeraEscrituraRef = useRef(true);

  const velasLista = useMemo(() => listaProductosSegura(velas), [velas]);
  const inciensosLista = useMemo(() => listaProductosSegura(inciensos), [inciensos]);
  const figurasLista = useMemo(() => listaProductosSegura(figuras), [figuras]);
  const kitsLista = useMemo(() => listaProductosSegura(kits), [kits]);
  const joyasLista = useMemo(() => listaProductosSegura(joyas), [joyas]);

  const precioConDescuento = (p: Producto): number => {
    const base = precioSeguro(p.precio);
    const d = p.descuentoPorcentaje != null ? Math.min(100, Math.max(0, Number(p.descuentoPorcentaje))) : 0;
    if (d <= 0) return base;
    return Math.round(base * (1 - d / 100) * 100) / 100;
  };

  const precioCatalogoPorId = useMemo(() => {
    const catalogo = [...velasLista, ...inciensosLista, ...figurasLista, ...kitsLista, ...joyasLista];
    return new Map<number, number>(
      catalogo.map((p) => [p.id, precioConDescuento(p)])
    );
  }, [velasLista, inciensosLista, figurasLista, kitsLista, joyasLista]);

  const precioCatalogoPorNombre = useMemo(() => {
    const catalogo = [...velasLista, ...inciensosLista, ...figurasLista, ...kitsLista, ...joyasLista];
    return new Map<string, number>(
      catalogo.map((p) => [p.nombre.trim().toLowerCase(), precioConDescuento(p)])
    );
  }, [velasLista, inciensosLista, figurasLista, kitsLista, joyasLista]);

  const getProductoByValue = useCallback(
    (value: string): Producto | undefined => {
      if (!value) return undefined;
      const [cat, idStr] = value.split("-");
      const id = Number(idStr);
      if (cat === "velas") return velasLista.find((p) => p.id === id);
      if (cat === "inciensos") return inciensosLista.find((p) => p.id === id);
      if (cat === "figuras") return figurasLista.find((p) => p.id === id);
      if (cat === "kits") return kitsLista.find((p) => p.id === id);
      if (cat === "joyas") return joyasLista.find((p) => p.id === id);
      return undefined;
    },
    [velasLista, inciensosLista, figurasLista, kitsLista, joyasLista]
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
    let cancelled = false;

    function aplicarDesdeLocalStorage() {
      const v = localStorage.getItem(CATALOGO_VELAS_KEY);
      const i = localStorage.getItem(CATALOGO_INCIENSOS_KEY);
      const f = localStorage.getItem(CATALOGO_FIGURAS_KEY);
      const k = localStorage.getItem(CATALOGO_KITS_KEY);
      const j = localStorage.getItem(CATALOGO_JOYAS_KEY);
      if (v && i && f) {
        try {
          const vParsed = JSON.parse(v) as Producto[];
          const iParsed = JSON.parse(i) as Producto[];
          const fParsed = JSON.parse(f) as Producto[];
          if (Array.isArray(vParsed) && vParsed.length > 0) setVelas(listaProductosSegura(vParsed));
          if (Array.isArray(iParsed) && iParsed.length > 0) setInciensos(listaProductosSegura(iParsed));
          if (Array.isArray(fParsed) && fParsed.length > 0) setFiguras(listaProductosSegura(fParsed));
          if (k) {
            const kParsed = JSON.parse(k) as Producto[];
            if (Array.isArray(kParsed)) setKits(listaProductosSegura(kParsed));
          }
          if (j) {
            const jParsed = JSON.parse(j) as Producto[];
            if (Array.isArray(jParsed)) setJoyas(listaProductosSegura(jParsed));
          }
        } catch {
          /* mantener valores por defecto */
        }
      }
    }

    (async () => {
      const demoActivo = localStorage.getItem(DEMO_ACTIVO_KEY) === "true";
      const catalogoDemoRaw = localStorage.getItem(DEMO_CATALOGO_KEY);
      if (demoActivo && catalogoDemoRaw) {
        try {
          const demo = JSON.parse(catalogoDemoRaw) as {
            velas: Producto[];
            inciensos: Producto[];
            figuras: Producto[];
            kits?: Producto[];
            joyas?: Producto[];
          };
          if (Array.isArray(demo.velas)) setVelas(listaProductosSegura(demo.velas));
          if (Array.isArray(demo.inciensos)) setInciensos(listaProductosSegura(demo.inciensos));
          if (Array.isArray(demo.figuras)) setFiguras(listaProductosSegura(demo.figuras));
          if (Array.isArray(demo.kits)) setKits(listaProductosSegura(demo.kits));
          if (Array.isArray(demo.joyas)) setJoyas(listaProductosSegura(demo.joyas));
        } catch {
          localStorage.removeItem(DEMO_CATALOGO_KEY);
        }
        return;
      }

      const desdeApi = await fetchProductosTienda();
      if (cancelled) return;
      if (desdeApi) {
        const ok = listaProductosSegura(desdeApi);
        const porCat = (c: Producto["categoria"]) =>
          ok.filter((p) => p.categoria === c).sort((a, b) => a.id - b.id);
        setVelas(porCat("velas"));
        setInciensos(porCat("inciensos"));
        setFiguras(porCat("figuras"));
        setKits(porCat("kits"));
        setJoyas(porCat("joyas"));
        return;
      }

      aplicarDesdeLocalStorage();
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // No sobrescribir localStorage en la primera ejecución (estado inicial), para no pisar lo cargado
    if (omitirPrimeraEscrituraRef.current) {
      omitirPrimeraEscrituraRef.current = false;
      return;
    }
    localStorage.setItem(CATALOGO_VELAS_KEY, JSON.stringify(velasLista));
    localStorage.setItem(CATALOGO_INCIENSOS_KEY, JSON.stringify(inciensosLista));
    localStorage.setItem(CATALOGO_FIGURAS_KEY, JSON.stringify(figurasLista));
    localStorage.setItem(CATALOGO_KITS_KEY, JSON.stringify(kitsLista));
    localStorage.setItem(CATALOGO_JOYAS_KEY, JSON.stringify(joyasLista));
  }, [velasLista, inciensosLista, figurasLista, kitsLista, joyasLista]);

  const aplicarCatalogoActualizado = useCallback((catalogo: CatalogoActualizadoCheckout) => {
    setVelas(listaProductosSegura(catalogo.velas));
    setInciensos(listaProductosSegura(catalogo.inciensos));
    setFiguras(listaProductosSegura(catalogo.figuras));
    setKits(listaProductosSegura(catalogo.kits));
    setJoyas(listaProductosSegura(catalogo.joyas));
  }, []);

  return {
    velas: velasLista,
    setVelas,
    inciensos: inciensosLista,
    setInciensos,
    figuras: figurasLista,
    setFiguras,
    kits: kitsLista,
    setKits,
    joyas: joyasLista,
    setJoyas,
    getProductoByValue,
    precioCatalogoPorId,
    precioCatalogoPorNombre,
    precioItemCarrito,
    normalizarItemCarrito,
    aplicarCatalogoActualizado,
  };
}
