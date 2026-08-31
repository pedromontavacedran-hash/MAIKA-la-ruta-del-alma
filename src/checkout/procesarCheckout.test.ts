import type { MutableRefObject } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EnviarPedidoWhatsAppContext } from "./procesarCheckout.types";
import type { Pedido } from "../types";
import { persistirTrasPedidoCheckout } from "./fases/persistirTrasPedidoCheckout";
import { hasClientSession } from "../services/apiAuth";

vi.mock("../services/apiAuth", () => ({
  hasClientSession: vi.fn()
}));

vi.mock("./fases/syncUsuarioYAuthCheckout", () => ({
  syncUsuarioYAuthCheckout: vi.fn().mockResolvedValue({})
}));

vi.mock("./fases/esperarAntesDeCalcularPedido", () => ({
  esperarAntesDeCalcularPedido: vi.fn().mockResolvedValue(undefined)
}));

vi.mock("./fases/persistirTrasPedidoCheckout", () => ({
  persistirTrasPedidoCheckout: vi.fn(
    async (params: {
      pedidoNuevo: Pedido;
      velas: unknown;
      inciensos: unknown;
      figuras: unknown;
      kits: unknown;
    }) => ({
      pedidosActualizados: [params.pedidoNuevo],
      catalogoActualizado: {
        velas: params.velas,
        inciensos: params.inciensos,
        figuras: params.figuras,
        kits: params.kits
      }
    })
  )
}));

import { procesarCheckout } from "./procesarCheckout";

function ctxValido(): EnviarPedidoWhatsAppContext {
  const pedidoApiPendienteRef: MutableRefObject<Pedido | null> = { current: null };
  const productoBase = {
    id: 1,
    nombre: "Vela test",
    precio: 10,
    stock: 50,
    imagen: "",
    categoria: "velas" as const,
    descripcion: ""
  };
  const item = { ...productoBase, cantidad: 2 };
  const cliente = {
    nombre: "ANA",
    apellidos: "TEST",
    nombreApellidos: "ANA TEST",
    email: "ana@test.es",
    telefono: "612345678",
    calle: "Mayor",
    numero: "1",
    cp: "28001",
    poblacion: "Madrid",
    provincia: "Madrid",
    pais: "España"
  };

  return {
    datosCliente: cliente,
    datosPago: {
      bizumTelefono: "612345678",
      tarjetaNumero: "",
      tarjetaTitular: "",
      tarjetaCaducidad: "",
      tarjetaCVV: ""
    },
    cart: [item],
    descuentoCupon: 0,
    cuponAplicado: null,
    velas: [productoBase],
    inciensos: [],
    figuras: [],
    kits: [],
    direccionesMax: 5,
    bizumYaConfirmadoPorUsuario: true,
    pedidoApiPendienteRef,
    leerMaikaUsuarios: () => [],
    guardarMaikaUsuarios: () => {},
    precioItemCarrito: (i) => Number(i.precio),
    ejecutarConfirmacionPedido: async () => ({ ok: true } as const)
  };
}

const localStorageMock: Storage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
};

describe("procesarCheckout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("localStorage", localStorageMock);
    vi.mocked(localStorageMock.getItem).mockImplementation(() => null);
    vi.mocked(hasClientSession).mockReturnValue(true);
  });

  it("motor: ok con pedido, totales, URL WhatsApp y llamada a persistencia", async () => {
    const r = await procesarCheckout(ctxValido());

    expect(r.tipo).toBe("ok");
    expect(persistirTrasPedidoCheckout).toHaveBeenCalled();
    const persistirArg = vi.mocked(persistirTrasPedidoCheckout).mock.calls[0]?.[0];
    expect(persistirArg?.idempotencyKey).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );

    if (r.tipo !== "ok") {
      throw new Error("se esperaba tipo ok");
    }

    expect(r.pedido.numero.length).toBeGreaterThan(0);
    expect(r.pedido.total).toBeGreaterThan(0);
    expect(r.pedido.subtotal).toBeGreaterThan(0);
    expect(r.urlWhatsApp).toMatch(/wa\.me\//);
    expect(r.aplicarInput.urlWhatsApp).toBe(r.urlWhatsApp);
    expect(r.pedidosActualizados.length).toBeGreaterThan(0);
  });

  it("error si no hay sesión tras sync (evita éxito local sin descontar stock en servidor)", async () => {
    vi.mocked(hasClientSession).mockReturnValue(false);
    const r = await procesarCheckout(ctxValido());
    expect(r.tipo).toBe("error");
    expect(persistirTrasPedidoCheckout).not.toHaveBeenCalled();
  });
});
