import type { MutableRefObject } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Cliente, ItemCarrito, Pedido, Producto } from "../../types";

const actualizarStockSpy = vi.fn(
  (_cart: ItemCarrito[], v: Producto[], i: Producto[], f: Producto[], k: Producto[]) => ({
    velas: v,
    inciensos: i,
    figuras: f,
    kits: k
  })
);

const fetchCatalogoSpy = vi.fn();
const vaciarCarritoSpy = vi.fn().mockResolvedValue(undefined);

vi.mock("../services/actualizarStock", () => ({
  actualizarStockCatalogoYPersistir: (...a: unknown[]) => actualizarStockSpy(...a)
}));

vi.mock("../../services/apiProductos", () => ({
  fetchCatalogoCuatroListasDesdeApi: () => fetchCatalogoSpy()
}));

vi.mock("../../utils/maikaOutbox", () => ({
  encolarPedidoCrear: vi.fn(),
  programarSincronizarOutbox: vi.fn(),
  quitarPedidoCreadoDelOutbox: vi.fn()
}));

vi.mock("../services/guardarPedidosLocal", () => ({
  prependPedidoYPersistirPedidosMaika: vi.fn((p: Pedido) => [p])
}));

vi.mock("../services/guardarMaikaPedidosCheckout", () => ({
  registrarMaikaPedidoDesdeCheckout: vi.fn()
}));

vi.mock("../services/guardarUsuarios", () => ({
  fusionarYGuardarUsuarioMaikaCheckout: vi.fn()
}));

vi.mock("../services/vaciarCarritoServidor", () => ({
  vaciarCarritoServidorSiHayToken: (...a: unknown[]) => vaciarCarritoSpy(...a)
}));

import { persistirTrasPedidoCheckout } from "./persistirTrasPedidoCheckout";
import { quitarPedidoCreadoDelOutbox } from "../../utils/maikaOutbox";

function productoBase(id: number): Producto {
  return {
    id,
    nombre: "P",
    precio: 10,
    stock: 5,
    imagen: "",
    categoria: "velas",
    descripcion: ""
  };
}

function pedidoMinimo(items: ItemCarrito[]): Pedido {
  const c: Cliente = {
    nombreApellidos: "T",
    email: "t@test.es",
    telefono: "600000000",
    calle: "C",
    numero: "1",
    cp: "28001",
    poblacion: "M",
    provincia: "M",
    pais: "ES"
  };
  return {
    numero: "MK-TEST-1",
    fecha: new Date().toISOString(),
    cliente: c,
    items,
    subtotal: 10,
    envio: 0,
    total: 10,
    estado: "pendiente"
  };
}

describe("persistirTrasPedidoCheckout — stock vs 409", () => {
  const pedidoApiPendienteRef: MutableRefObject<Pedido | null> = { current: null };

  beforeEach(() => {
    vi.clearAllMocks();
    actualizarStockSpy.mockClear();
    fetchCatalogoSpy.mockReset();
    vaciarCarritoSpy.mockClear();
    vi.stubGlobal(
      "localStorage",
      {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(),
        length: 0
      } satisfies Storage
    );
  });

  it("Prueba 2: rechazo_servidor (409 stock) NO llama actualizarStockCatalogoYPersistir y mantiene catálogo", async () => {
    const velas = [productoBase(1)];
    const item: ItemCarrito = { ...productoBase(1), cantidad: 2 };
    const pedido = pedidoMinimo([item]);

    const r = await persistirTrasPedidoCheckout({
      pedidoNuevo: pedido,
      pedidoApiPendienteRef,
      idempotencyKey: "k1",
      ejecutarConfirmacionPedido: async () => ({
        ok: false,
        kind: "rechazo_servidor",
        mensaje: "Stock insuficiente para «Vela» (disponible 1, pedido 2)"
      }),
      telefonoNormalizadoCheckout: "600000000",
      numeroPedido: pedido.numero,
      cart: [item],
      totalFinal: 10,
      direccionEnvioCompletaTexto: "",
      dcOk: pedido.cliente,
      direccionesMax: 5,
      leerMaikaUsuarios: () => [],
      guardarMaikaUsuarios: () => {},
      velas,
      inciensos: [],
      figuras: [],
      kits: []
    });

    expect(actualizarStockSpy).not.toHaveBeenCalled();
    expect(r.catalogoActualizado.velas[0]?.stock).toBe(5);
    expect(r.errorServidorCheckout?.mensaje).toContain("Stock insuficiente");
    expect(vaciarCarritoSpy).not.toHaveBeenCalled();
    expect(quitarPedidoCreadoDelOutbox).toHaveBeenCalledWith(pedido, "k1");
  });

  it("Offline / sin API OK: sí resta stock local (fallback)", async () => {
    const velas = [productoBase(1)];
    const item: ItemCarrito = { ...productoBase(1), cantidad: 2 };
    const pedido = pedidoMinimo([item]);

    actualizarStockSpy.mockImplementation(() => ({
      velas: [{ ...velas[0], stock: 3 }],
      inciensos: [],
      figuras: [],
      kits: []
    }));

    const r = await persistirTrasPedidoCheckout({
      pedidoNuevo: pedido,
      pedidoApiPendienteRef,
      idempotencyKey: "k2",
      ejecutarConfirmacionPedido: async () => ({ ok: false, kind: "sin_token" }),
      telefonoNormalizadoCheckout: "600000000",
      numeroPedido: pedido.numero,
      cart: [item],
      totalFinal: 10,
      direccionEnvioCompletaTexto: "",
      dcOk: pedido.cliente,
      direccionesMax: 5,
      leerMaikaUsuarios: () => [],
      guardarMaikaUsuarios: () => {},
      velas,
      inciensos: [],
      figuras: [],
      kits: []
    });

    expect(actualizarStockSpy).toHaveBeenCalledTimes(1);
    expect(r.catalogoActualizado.velas[0]?.stock).toBe(3);
    expect(r.errorServidorCheckout).toBeUndefined();
    expect(vaciarCarritoSpy).toHaveBeenCalled();
  });

  it("API OK: intenta fetch catálogo; no usa actualizarStock si fetch devuelve datos", async () => {
    const velas = [productoBase(1)];
    const item: ItemCarrito = { ...productoBase(1), cantidad: 1 };
    const pedido = pedidoMinimo([item]);

    fetchCatalogoSpy.mockResolvedValue({
      velas: [{ ...velas[0], stock: 4 }],
      inciensos: [],
      figuras: [],
      kits: []
    });

    const r = await persistirTrasPedidoCheckout({
      pedidoNuevo: pedido,
      pedidoApiPendienteRef,
      idempotencyKey: "k3",
      ejecutarConfirmacionPedido: async () => ({ ok: true }),
      telefonoNormalizadoCheckout: "600000000",
      numeroPedido: pedido.numero,
      cart: [item],
      totalFinal: 10,
      direccionEnvioCompletaTexto: "",
      dcOk: pedido.cliente,
      direccionesMax: 5,
      leerMaikaUsuarios: () => [],
      guardarMaikaUsuarios: () => {},
      velas,
      inciensos: [],
      figuras: [],
      kits: []
    });

    expect(fetchCatalogoSpy).toHaveBeenCalled();
    expect(actualizarStockSpy).not.toHaveBeenCalled();
    expect(r.catalogoActualizado.velas[0]?.stock).toBe(4);
  });
});
