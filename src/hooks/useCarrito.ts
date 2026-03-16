import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import type { Producto, ItemCarrito } from "../types";
import { CARRITO_KEY } from "../config";
import { precioSeguro, idSeguro } from "../utils/precio";

export type CatalogForCarrito = {
  precioItemCarrito: (item: Pick<ItemCarrito, "id" | "precio" | "nombre">) => number;
  normalizarItemCarrito: (item: ItemCarrito) => ItemCarrito;
  precioCatalogoPorId: Map<number, number>;
  velas: Producto[];
  inciensos: Producto[];
  figuras: Producto[];
  kits: Producto[];
};

export type MostrarNotificacion = (mensaje: string, tipo: "normal" | "exito" | "error") => void;

export function useCarrito(catalog: CatalogForCarrito, mostrarNotificacion: MostrarNotificacion) {
  const [cart, setCart] = useState<ItemCarrito[]>([]);
  const {
    precioItemCarrito,
    normalizarItemCarrito,
    precioCatalogoPorId,
    velas,
    inciensos,
    figuras,
    kits
  } = catalog;

  const getStockProducto = useCallback(
    (id: number) => {
      const stock =
        id < 100
          ? velas.find((p) => p.id === id)?.stock
          : id < 200
            ? inciensos.find((p) => p.id === id)?.stock
            : id < 300
              ? figuras.find((p) => p.id === id)?.stock
              : kits.find((p) => p.id === id)?.stock;
      return Math.max(0, Number(stock ?? 0));
    },
    [velas, inciensos, figuras, kits]
  );

  const carritoYaCargadoRef = useRef(false);
  useEffect(() => {
    if (carritoYaCargadoRef.current) return;
    carritoYaCargadoRef.current = true;
    const carritoGuardado = localStorage.getItem(CARRITO_KEY);
    if (carritoGuardado) {
      try {
        const carritoParseado = JSON.parse(carritoGuardado) as ItemCarrito[];
        const carritoSeguro = Array.isArray(carritoParseado) ? carritoParseado : [];
        const carritoNormalizado = carritoSeguro
          .map((item) => normalizarItemCarrito(item))
          .filter((item) => item.cantidad > 0);
        setCart(carritoNormalizado);
        const originalSerializado = JSON.stringify(carritoSeguro);
        const normalizadoSerializado = JSON.stringify(carritoNormalizado);
        if (originalSerializado !== normalizadoSerializado) {
          localStorage.setItem(CARRITO_KEY, normalizadoSerializado);
        }
      } catch {
        localStorage.removeItem(CARRITO_KEY);
        setCart([]);
      }
    }
  }, [normalizarItemCarrito]);

  const esPrimeraEjecucionGuardarCarritoRef = useRef(true);
  useEffect(() => {
    if (esPrimeraEjecucionGuardarCarritoRef.current) {
      esPrimeraEjecucionGuardarCarritoRef.current = false;
      return;
    }
    localStorage.setItem(CARRITO_KEY, JSON.stringify(cart));
  }, [cart]);

  const totalItemsCarrito = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const cantidad = Number.isFinite(Number(item.cantidad)) ? Number(item.cantidad) : 0;
        return sum + cantidad;
      }, 0),
    [cart]
  );

  const total = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const cantidad = Number.isFinite(Number(item.cantidad)) ? Number(item.cantidad) : 0;
        return sum + precioItemCarrito(item) * cantidad;
      }, 0),
    [cart, precioItemCarrito]
  );

  const agregarAlCarrito = useCallback(
    (producto: Producto) => {
      const idNum = Number(producto.id);
      const stockDisponible = Math.max(0, Number(producto.stock));
      if (!Number.isFinite(idNum) || stockDisponible <= 0) {
        mostrarNotificacion(`❌ ${producto.nombre} agotado`, "error");
        return;
      }
      const cantidadEnCarrito = (() => {
        const item = cart.find((p) => idSeguro(p.id) === idNum);
        return item ? Math.max(0, Number(item.cantidad) || 0) : 0;
      })();
      if (cantidadEnCarrito >= stockDisponible) {
        mostrarNotificacion(`Solo hay ${stockDisponible} unidades disponibles de ${producto.nombre}`, "error");
        return;
      }
      const precioNormalizado = (() => {
        const directo = precioSeguro(producto.precio);
        if (directo > 0) return directo;
        return precioCatalogoPorId.get(idNum) ?? precioCatalogoPorId.get(producto.id as number) ?? 0;
      })();
      setCart((prev) => {
        const existente = prev.find((p) => idSeguro(p.id) === idNum);
        const cantidadActual = existente ? Number(existente.cantidad) || 0 : 0;
        const nuevaCantidad = Math.min(cantidadActual + 1, stockDisponible);
        if (existente) {
          return prev.map((p) =>
            idSeguro(p.id) === idNum
              ? {
                  ...p,
                  precio: precioNormalizado > 0 ? precioNormalizado : precioItemCarrito(p),
                  cantidad: nuevaCantidad
                }
              : p
          );
        }
        return [...prev, normalizarItemCarrito({ ...producto, id: idNum, precio: precioNormalizado, cantidad: 1 })];
      });
      mostrarNotificacion(`✅ ${producto.nombre} añadido`, "exito");
    },
    [cart, mostrarNotificacion, precioCatalogoPorId, precioItemCarrito, normalizarItemCarrito]
  );

  const cambiarCantidad = useCallback(
    (id: number, incremento: number) => {
      const idNum = Number(id);
      if (!Number.isFinite(idNum)) return;
      const stockDisponible = getStockProducto(idNum);
      const itemActual = cart.find((p) => idSeguro(p.id) === idNum || Number(p.id) === idNum);
      const cantidadActual = itemActual ? Number(itemActual.cantidad) || 0 : 0;
      if (incremento > 0 && stockDisponible <= 0) {
        const nombre = itemActual?.nombre ?? "Producto";
        mostrarNotificacion(`❌ ${nombre} agotado`, "error");
        return;
      }
      if (incremento > 0 && cantidadActual >= stockDisponible) {
        const nombre = itemActual?.nombre ?? "Producto";
        mostrarNotificacion(`Solo hay ${stockDisponible} unidades disponibles de ${nombre}`, "error");
        return;
      }
      const nextCart = (prev: ItemCarrito[]) => {
        const item = prev.find((p) => idSeguro(p.id) === idNum || Number(p.id) === idNum);
        if (!item) return prev;
        let nuevaCantidad = Math.max(0, (Number(item.cantidad) || 0) + incremento);
        if (incremento > 0) nuevaCantidad = Math.min(nuevaCantidad, stockDisponible);
        return prev
          .map((p) => {
            if (idSeguro(p.id) !== idNum && Number(p.id) !== idNum) return { ...p };
            return { ...p, id: idNum, precio: precioItemCarrito(p), cantidad: nuevaCantidad };
          })
          .filter((p) => p.cantidad > 0);
      };
      flushSync(() => {
        setCart(nextCart);
      });
    },
    [cart, getStockProducto, precioItemCarrito, mostrarNotificacion]
  );

  return {
    cart,
    setCart,
    total,
    totalItemsCarrito,
    agregarAlCarrito,
    cambiarCantidad,
    getStockProducto
  };
}
