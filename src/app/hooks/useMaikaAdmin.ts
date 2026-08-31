import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import { flushSync } from "react-dom";
import type { NavigateFunction } from "react-router-dom";
import type { ItemCarrito, Pedido, Producto, Usuario } from "../../types";
import { usePedidosVistasAdmin } from "./usePedidosVistasAdmin";
import { useAdminMetrics } from "../../admin/hooks/useAdminMetrics";
import {
  guardarMaikaPedidos as guardarMaikaPedidosStorage,
  leerMaikaPedidos as leerMaikaPedidosStorage,
  type MaikaPedidoLS
} from "../../utils/maikaPedidos";
import { getAdminLastLoginMs, isAdminAuthorized } from "../../utils/adminAuth";
import { esAdminPermitidoEnEsteCliente } from "../../utils/adminSoloEscritorio";
import { sincronizarEstadoPedidoMaika } from "../../utils/pedidos/sincronizarEstadoPedidoMaika";
import { notificarError } from "../../utils/ui/notificaciones";
import { buildRenderCajaPedidos, PULSE_CAJA_PEDIDOS_ADMIN_STYLE } from "../../admin/renderCajaPedidos";
import { THEME } from "../../config";

export type UseMaikaAdminInput = {
  pedidos: Pedido[];
  setPedidos: Dispatch<SetStateAction<Pedido[]>>;
  cart: ItemCarrito[];
  velas: Producto[];
  inciensos: Producto[];
  figuras: Producto[];
  kits: Producto[];
  joyas: Producto[];
  umbralStockBajo: number;
  listaUsuarios: Usuario[];
  accesoAdmin: boolean;
  setAccesoAdmin: (v: boolean) => void;
  mostrarNotificacion: (mensaje: string, tipo: "normal" | "exito" | "error") => void;
  onAbrirFacturaPedido: (p: Pedido | null) => void;
  navigate: NavigateFunction;
  locationPathname: string;
};

export function useMaikaAdmin(p: UseMaikaAdminInput) {
  const {
    pedidos,
    setPedidos,
    cart,
    velas,
    inciensos,
    figuras,
    kits,
    joyas,
    umbralStockBajo,
    listaUsuarios,
    accesoAdmin,
    mostrarNotificacion,
    onAbrirFacturaPedido,
    navigate,
    locationPathname
  } = p;

  const [, setAdminSessionTick] = useState(0);
  const esAdmin = isAdminAuthorized();
  const adminAhora = new Date();
  const adminUltimoLoginMs = getAdminLastLoginMs();
  const adminUltimoLoginTexto = adminUltimoLoginMs
    ? new Date(adminUltimoLoginMs).toLocaleString("es-ES")
    : "Sin registro";
  const adminAhoraTexto = adminAhora.toLocaleString("es-ES");

  useEffect(() => {
    const refrescarCuentaAdmin = () => setAdminSessionTick((prev) => prev + 1);
    refrescarCuentaAdmin();
    const id = window.setInterval(() => {
      refrescarCuentaAdmin();
    }, 5000);
    return () => {
      window.clearInterval(id);
    };
  }, []);

  const {
    pedidosPendientes,
    pedidosEnviados,
    pedidosEntregados,
    pedidosPendientesOrdenados,
    pedidosEnviadosOrdenados,
    pedidosEntregadosOrdenados
  } = usePedidosVistasAdmin(pedidos);

  const [busquedaPedido, setBusquedaPedido] = useState("");
  const [pedidoAbierto, setPedidoAbierto] = useState<number | null>(null);
  const [pendientesAbierto, setPendientesAbierto] = useState(true);
  const [enviadosAbierto, setEnviadosAbierto] = useState(false);
  const [entregadosAbierto, setEntregadosAbierto] = useState(false);

  const leerMaikaPedidos = (): MaikaPedidoLS[] => leerMaikaPedidosStorage();
  const guardarMaikaPedidos = (rows: MaikaPedidoLS[]) => guardarMaikaPedidosStorage(rows);

  const metrics = useAdminMetrics({
    pedidos,
    cart,
    velas,
    inciensos,
    figuras,
    kits,
    joyas,
    umbralStockBajo,
    listaUsuarios
  });

  const cambiarEstadoPedido = async (numeroPedido: string, nuevoEstado: Pedido["estado"]) => {
    const res = await sincronizarEstadoPedidoMaika({
      pedidos,
      numeroPedido,
      nuevoEstado,
      leerMaikaPedidos,
      guardarMaikaPedidos
    });
    if (!res.ok) {
      notificarError(mostrarNotificacion, `No se encontró el pedido ${numeroPedido}`);
      return;
    }
    flushSync(() => {
      setPedidos(res.nuevosPedidos);
    });
    mostrarNotificacion(`✅ Pedido ${res.pedidoOriginal.numero} → ${nuevoEstado}`, "exito");
    setPedidoAbierto(null);
  };

  const pulseAnimationStyle = PULSE_CAJA_PEDIDOS_ADMIN_STYLE;

  const renderCajaPedidos = buildRenderCajaPedidos({
    themeBg: THEME.bg,
    themeGold: THEME.goldMain,
    busquedaPedido,
    pedidos,
    pedidoAbierto,
    setPedidoAbierto,
    accesoAdmin,
    cambiarEstadoPedido,
    onAbrirFacturaPedido
  });

  useEffect(() => {
    if (!locationPathname.startsWith("/admin")) return;
    if (!esAdminPermitidoEnEsteCliente()) {
      navigate("/", { replace: true });
    }
  }, [locationPathname, navigate]);

  return {
    pedidosPendientes,
    pedidosEnviados,
    pedidosEntregados,
    pedidosPendientesOrdenados,
    pedidosEnviadosOrdenados,
    pedidosEntregadosOrdenados,
    busquedaPedido,
    setBusquedaPedido,
    pedidoAbierto,
    setPedidoAbierto,
    pendientesAbierto,
    setPendientesAbierto,
    enviadosAbierto,
    setEnviadosAbierto,
    entregadosAbierto,
    setEntregadosAbierto,
    metrics,
    renderCajaPedidos,
    pulseAnimationStyle,
    esAdmin,
    adminUltimoLoginTexto,
    adminAhoraTexto
  };
}
