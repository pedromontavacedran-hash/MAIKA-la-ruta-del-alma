import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import type { Producto, ItemCarrito } from "../types";
import { CARRITO_KEY, GUEST_CART_PENDING_KEY } from "../config";
import { precioSeguro, idSeguro } from "../utils/precio";
import { getUsuarioId } from "../utils/usuarioId";
import { guardarCarritoApi, obtenerCarritoApi } from "../services/apiCarrito";
import { hasClientSession } from "../services/apiAuth";
import { notificarError, notificarExito } from "../utils/ui/notificaciones";
import { resolverCarritoTrasObtenerRemoto } from "./carritoMergeLogic";

const AUTH_CART_DIRTY_KEY = "maika_auth_cart_dirty";

export type CatalogForCarrito = {
  precioItemCarrito: (item: Pick<ItemCarrito, "id" | "precio" | "nombre">) => number;
  normalizarItemCarrito: (item: ItemCarrito) => ItemCarrito;
  precioCatalogoPorId: Map<number, number>;
  velas: Producto[];
  inciensos: Producto[];
  figuras: Producto[];
  kits: Producto[];
  joyas: Producto[];
};

export type MostrarNotificacion = (mensaje: string, tipo: "normal" | "exito" | "error") => void;

function hasToken() {
  return hasClientSession();
}

function leerCarritoLocalBasico(): ItemCarrito[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(CARRITO_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => item as ItemCarrito)
      .filter((item) => Math.max(0, Number(item?.cantidad) || 0) > 0);
  } catch {
    return [];
  }
}

function leerCarritoLocalSeguro(normalizarItemCarrito: (i: ItemCarrito) => ItemCarrito): ItemCarrito[] {
  const raw = localStorage.getItem(CARRITO_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => normalizarItemCarrito(item as ItemCarrito))
    .filter((item) => item.cantidad > 0);
}

export function useCarrito(
  catalog: CatalogForCarrito,
  mostrarNotificacion: MostrarNotificacion,
  carritoIdentityKey: string | null
) {
  const [cart, setCart] = useState<ItemCarrito[]>(() => leerCarritoLocalBasico());
  const {
    precioItemCarrito,
    normalizarItemCarrito,
    precioCatalogoPorId,
    velas,
    inciensos,
    figuras,
    kits,
    joyas
  } = catalog;

  const getStockProducto = useCallback(
    (id: number) => {
      /**
       * Búsqueda directa por id en todo el catálogo, sin asumir rangos por categoría:
       * el backend asigna ids con `maxId + 1` global, así que un producto nuevo de
       * cualquier categoría puede recibir cualquier id (ver restarStockCatalogo.ts).
       */
      const v = Array.isArray(velas) ? velas : [];
      const i = Array.isArray(inciensos) ? inciensos : [];
      const f = Array.isArray(figuras) ? figuras : [];
      const k = Array.isArray(kits) ? kits : [];
      const j = Array.isArray(joyas) ? joyas : [];
      const stock =
        v.find((p) => p.id === id)?.stock ??
        i.find((p) => p.id === id)?.stock ??
        f.find((p) => p.id === id)?.stock ??
        k.find((p) => p.id === id)?.stock ??
        j.find((p) => p.id === id)?.stock;
      return Math.max(0, Number(stock ?? 0));
    },
    [velas, inciensos, figuras, kits, joyas]
  );

  const cargadoBackendRef = useRef(false);
  const lastSavedRef = useRef<string>("");
  const persistTimeoutRef = useRef<number | null>(null);
  const cargaCarritoSeqRef = useRef(0);

  /** Solo `carritoIdentityKey` debe disparar recarga completa; si dependemos de `getStockProducto` / precio, cada sync de catálogo vacía el carrito (`setCart([])`) y rompe el checkout ("Carrito vacío" con total aún visible). */
  const carritoLoadFnsRef = useRef({
    normalizarItemCarrito,
    precioItemCarrito,
    getStockProducto
  });
  carritoLoadFnsRef.current = { normalizarItemCarrito, precioItemCarrito, getStockProducto };

  useEffect(() => {
    if (carritoIdentityKey == null) return;
    const seq = ++cargaCarritoSeqRef.current;
    if (persistTimeoutRef.current != null) {
      window.clearTimeout(persistTimeoutRef.current);
      persistTimeoutRef.current = null;
    }
    cargadoBackendRef.current = false;
    lastSavedRef.current = localStorage.getItem(CARRITO_KEY) || JSON.stringify(leerCarritoLocalBasico());

    const norm = carritoLoadFnsRef.current.normalizarItemCarrito;

    const cargarLocal = () => {
      const carritoGuardado = localStorage.getItem(CARRITO_KEY);
      if (!carritoGuardado) {
        setCart([]);
        lastSavedRef.current = "[]";
        return;
      }
      try {
        const carritoNormalizado = leerCarritoLocalSeguro(norm);
        setCart(carritoNormalizado);
        const originalSerializado = carritoGuardado;
        const normalizadoSerializado = JSON.stringify(carritoNormalizado);
        if (originalSerializado !== normalizadoSerializado) {
          localStorage.setItem(CARRITO_KEY, normalizadoSerializado);
        }
        lastSavedRef.current = normalizadoSerializado;
      } catch {
        localStorage.removeItem(CARRITO_KEY);
        setCart([]);
        lastSavedRef.current = "[]";
      }
    };
    void (async () => {
      if (!hasToken()) {
        if (seq !== cargaCarritoSeqRef.current) return;
        cargarLocal();
        /**
         * `GUEST_CART_PENDING_KEY` solo lo ponía el efecto de persistencia cuando el carrito
         * cambiaba respecto a `lastSavedRef`. Tras `cargarLocal()` ambos coinciden → al iniciar sesión
         * desde checkout no había fusión invitado+servidor y el carrito pasaba a vacío (modal “sin productos”).
         */
        try {
          const rawLs = localStorage.getItem(CARRITO_KEY);
          if (!rawLs || rawLs === "[]") {
            localStorage.removeItem(GUEST_CART_PENDING_KEY);
          } else {
            const parsed = JSON.parse(rawLs) as unknown;
            if (Array.isArray(parsed) && parsed.length > 0) {
              localStorage.setItem(GUEST_CART_PENDING_KEY, "1");
            } else {
              localStorage.removeItem(GUEST_CART_PENDING_KEY);
            }
          }
        } catch {
          localStorage.removeItem(GUEST_CART_PENDING_KEY);
        }
        cargadoBackendRef.current = true;
        return;
      }
      const guestPending = localStorage.getItem(GUEST_CART_PENDING_KEY) === "1";
      const authDirty = localStorage.getItem(AUTH_CART_DIRTY_KEY) === "1";
      let localSeguro: ItemCarrito[] = [];
      try {
        localSeguro = leerCarritoLocalSeguro(norm);
      } catch {
        localSeguro = [];
      }
      try {
        const usuarioId = getUsuarioId();
        const remoto = await obtenerCarritoApi(usuarioId);
        if (seq !== cargaCarritoSeqRef.current) return;
        const remotoSeguro = Array.isArray(remoto?.items) ? remoto.items : [];
        const remotoNorm = remotoSeguro
          .map((item) => norm(item))
          .filter((item) => item.cantidad > 0);
        const { normalizarItemCarrito: normFresh, precioItemCarrito: precioFresh, getStockProducto: stockFresh } =
          carritoLoadFnsRef.current;
        const carritoNormalizado = resolverCarritoTrasObtenerRemoto({
          authDirty,
          guestPending,
          localSeguro,
          remotoNorm,
          normalizarItemCarrito: normFresh,
          precioItemCarrito: precioFresh,
          getStockProducto: stockFresh
        });
        if (authDirty) {
          localStorage.removeItem(AUTH_CART_DIRTY_KEY);
          void guardarCarritoApi(usuarioId, carritoNormalizado).catch(() => {
            localStorage.setItem(AUTH_CART_DIRTY_KEY, "1");
          });
        }
        if (!authDirty && guestPending) {
          localStorage.removeItem(GUEST_CART_PENDING_KEY);
          void guardarCarritoApi(usuarioId, carritoNormalizado).catch(() => {});
        }
        if (!authDirty && !guestPending && remotoNorm.length === 0 && localSeguro.length > 0) {
          void guardarCarritoApi(usuarioId, carritoNormalizado).catch(() => {});
        }
        setCart(carritoNormalizado);
        const serializado = JSON.stringify(carritoNormalizado);
        localStorage.setItem(CARRITO_KEY, serializado);
        lastSavedRef.current = serializado;
      } catch {
        if (seq !== cargaCarritoSeqRef.current) return;
        cargarLocal();
      } finally {
        if (seq === cargaCarritoSeqRef.current) {
          cargadoBackendRef.current = true;
        }
      }
    })();
  }, [carritoIdentityKey]);

  useEffect(() => {
    if (carritoIdentityKey == null) return;
    if (!cargadoBackendRef.current) return;
    const current = JSON.stringify(cart);
    if (current === lastSavedRef.current) return;
    try {
      localStorage.setItem(CARRITO_KEY, current);
      if (!hasToken()) {
        const parsed = JSON.parse(current) as unknown;
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem(GUEST_CART_PENDING_KEY, "1");
        } else {
          localStorage.removeItem(GUEST_CART_PENDING_KEY);
        }
      } else {
        localStorage.setItem(AUTH_CART_DIRTY_KEY, "1");
      }
    } catch {
      /* El guardado diferido volverá a intentarlo. */
    }
    if (persistTimeoutRef.current != null) {
      window.clearTimeout(persistTimeoutRef.current);
    }
    persistTimeoutRef.current = window.setTimeout(() => {
      persistTimeoutRef.current = null;
      lastSavedRef.current = current;
      if (!hasToken()) {
        localStorage.setItem(CARRITO_KEY, current);
        try {
          const parsed = JSON.parse(current) as unknown;
          if (Array.isArray(parsed) && parsed.length > 0) {
            localStorage.setItem(GUEST_CART_PENDING_KEY, "1");
          } else {
            localStorage.removeItem(GUEST_CART_PENDING_KEY);
          }
        } catch {
          localStorage.removeItem(GUEST_CART_PENDING_KEY);
        }
        return;
      }
      let prevLs: string | null = null;
      try {
        prevLs = localStorage.getItem(CARRITO_KEY);
      } catch {
        prevLs = null;
      }
      localStorage.setItem(CARRITO_KEY, current);
      /** Tras checkout, `persistirTrasPedidoCheckout` ya vacía LS y servidor; evita segundo `guardarCarritoApi([], [])`. */
      if (cart.length === 0 && current === "[]" && prevLs === "[]") {
        return;
      }
      const usuarioId = getUsuarioId();
      void guardarCarritoApi(usuarioId, cart)
        .then(() => {
          localStorage.removeItem(AUTH_CART_DIRTY_KEY);
        })
        .catch(() => {
          localStorage.setItem(AUTH_CART_DIRTY_KEY, "1");
        });
    }, 300);
    return () => {
      if (persistTimeoutRef.current != null) {
        window.clearTimeout(persistTimeoutRef.current);
        persistTimeoutRef.current = null;
      }
    };
  }, [cart, carritoIdentityKey]);

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
    (producto: Producto, opts?: { silenciarNotificacion?: boolean; mensajeExito?: string }): boolean => {
      const idNum = Number(producto.id);
      if (producto.activo === false) {
        notificarError(mostrarNotificacion, `❌ ${producto.nombre} ya no está disponible`);
        return false;
      }
      const stockDisponible = Math.max(0, Number(producto.stock));
      if (!Number.isFinite(idNum) || stockDisponible <= 0) {
        notificarError(mostrarNotificacion, `❌ No hay stock de ${producto.nombre}`);
        return false;
      }
      const cantidadEnCarrito = (() => {
        const item = cart.find((p) => idSeguro(p.id) === idNum);
        return item ? Math.max(0, Number(item.cantidad) || 0) : 0;
      })();
      if (cantidadEnCarrito >= stockDisponible) {
        notificarError(mostrarNotificacion, `Ya tienes todas las unidades disponibles de ${producto.nombre} en el carrito`);
        return false;
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
      if (!opts?.silenciarNotificacion) {
        notificarExito(mostrarNotificacion, opts?.mensajeExito ?? `✅ ${producto.nombre} añadido`);
      }
      return true;
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
        notificarError(mostrarNotificacion, `❌ ${nombre} agotado`);
        return;
      }
      if (incremento > 0 && cantidadActual >= stockDisponible) {
        const nombre = itemActual?.nombre ?? "Producto";
        notificarError(mostrarNotificacion, `Solo hay ${stockDisponible} unidades disponibles de ${nombre}`);
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

  const guardarVaciadoInmediato = useCallback(() => {
    if (!hasToken()) return;
    const vacio = "[]";
    try {
      localStorage.setItem(AUTH_CART_DIRTY_KEY, "1");
      localStorage.setItem(CARRITO_KEY, vacio);
    } catch {
      /* El guardado diferido volverá a intentarlo. */
    }
    void guardarCarritoApi(getUsuarioId(), [])
      .then(() => {
        localStorage.removeItem(AUTH_CART_DIRTY_KEY);
        lastSavedRef.current = vacio;
      })
      .catch(() => {
        localStorage.setItem(AUTH_CART_DIRTY_KEY, "1");
      });
  }, []);

  const eliminarProductoCarrito = useCallback(
    (id: number) => {
      const idNum = Number(id);
      if (!Number.isFinite(idNum)) return;
      const siguiente = cart.filter((p) => idSeguro(p.id) !== idNum && Number(p.id) !== idNum);
      if (siguiente.length === cart.length) return;
      flushSync(() => {
        setCart(siguiente);
      });
      if (siguiente.length === 0) guardarVaciadoInmediato();
    },
    [cart, guardarVaciadoInmediato]
  );

  return {
    cart,
    setCart,
    total,
    totalItemsCarrito,
    agregarAlCarrito,
    cambiarCantidad,
    eliminarProductoCarrito,
    getStockProducto
  };
}
