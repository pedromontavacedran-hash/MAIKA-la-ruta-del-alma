import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import type { Location, NavigateFunction } from "react-router-dom";
import type { Cliente, Usuario } from "../../types";
import type { MaikaUsuarioLS } from "../../utils/maikaUsuarios";
import { CLIENTE_VACIO } from "../../app/hooks/useClienteMaika";
import { QUICK_CHECKOUT_KEY } from "../../config";
import { generarNumeroPedido } from "../../utils/appIdentity";
import { cargarClienteInvitadoDesdeStorage } from "../../utils/clienteStorage";
import { claveTelefonoES, normalizarTelefonoES9 } from "../../utils/telefono";
import { useCheckoutDirecciones } from "./useCheckoutDirecciones";

export type UseCheckoutDireccionFlowDeps = {
  datosCliente: Cliente;
  setDatosCliente: React.Dispatch<React.SetStateAction<Cliente>>;
  usuario: Usuario | null;
  setUsuario: (u: Usuario | null) => void;
  authHydrated: boolean;
  modoDireccionCheckout: boolean;
  navigate: NavigateFunction;
  location: Pick<Location, "pathname">;
  mostrarNotificacion: (m: string, t: "normal" | "exito" | "error") => void;
  precargarDatosClienteDesdeUsuario: (u: Usuario | null) => void;
  leerMaikaUsuarios: () => MaikaUsuarioLS[];
  guardarMaikaUsuarios: (u: MaikaUsuarioLS[]) => void;
  setPasoFinalizarCompra: (v: "datos" | "confirmarDireccion" | "pago") => void;
  setFormPedidoAbierto: (v: boolean) => void;
  getUsuarioCanonico: () => Promise<Usuario | null>;
  proyectarUsuariosDesdeMaika: (u: MaikaUsuarioLS[]) => Usuario[];
  recordarDatosInvitado: boolean;
  resetCliente: () => void;
  setAvisoTelefonoCheckout: (v: { encontrado: boolean; texto: string } | null) => void;
  setNumeroPedidoPreview: React.Dispatch<React.SetStateAction<string | null>>;
  ultimoTelefonoRecuperadoRef: MutableRefObject<string | null>;
  /** Si devuelve false, no se abre el modal (p. ej. stock insuficiente tras sync). */
  antesDeAbrirCheckoutModal?: () => Promise<boolean>;
};

/** Opciones de `finalizarCarrito` (p. ej. login con el modal ya abierto: evita carrera con el carrito vacío durante la fusión API). */
export type FinalizarCarritoOpciones = {
  /** Por defecto `true`. Si `false`, no ejecuta `antesDeAbrirCheckoutModal`. */
  validarAntesDeAbrir?: boolean;
  /** Por defecto `true`. Si `false`, mantiene el número de pedido (preview) que ya mostraba el usuario. */
  regenerarNumeroPedidoPreview?: boolean;
};

export function useCheckoutDireccionFlow(d: UseCheckoutDireccionFlowDeps) {
  const {
    datosCliente,
    setDatosCliente,
    usuario,
    setUsuario,
    authHydrated,
    modoDireccionCheckout,
    navigate,
    location,
    mostrarNotificacion,
    precargarDatosClienteDesdeUsuario,
    leerMaikaUsuarios,
    guardarMaikaUsuarios,
    setPasoFinalizarCompra,
    setFormPedidoAbierto,
    getUsuarioCanonico,
    proyectarUsuariosDesdeMaika,
    recordarDatosInvitado,
    resetCliente,
    setAvisoTelefonoCheckout,
    setNumeroPedidoPreview,
    ultimoTelefonoRecuperadoRef,
    antesDeAbrirCheckoutModal
  } = d;

  const [buscandoCalleCheckout, setBuscandoCalleCheckout] = useState(false);
  const [calleCheckoutResetSignal, setCalleCheckoutResetSignal] = useState(0);

  const direcciones = useCheckoutDirecciones({
    datosCliente,
    setDatosCliente,
    setCalleCheckoutResetSignal,
    usuario,
    setUsuario,
    modoDireccionCheckout,
    navigate,
    mostrarNotificacion,
    precargarDatosClienteDesdeUsuario,
    leerMaikaUsuarios,
    guardarMaikaUsuarios,
    setPasoFinalizarCompra,
    setFormPedidoAbierto
  });

  const finalizarCarrito = async (opts?: FinalizarCarritoOpciones) => {
    const validarAntes = opts?.validarAntesDeAbrir !== false;
    const regenerarNumero = opts?.regenerarNumeroPedidoPreview !== false;
    if (validarAntes && antesDeAbrirCheckoutModal) {
      const puede = await antesDeAbrirCheckoutModal();
      if (!puede) return;
    }
    ultimoTelefonoRecuperadoRef.current = null;
    direcciones.resetParaAbrirCheckout();
    const usuarioCanonico = await getUsuarioCanonico();
    const usuarioCheckout = usuarioCanonico || usuario;
    if (usuarioCanonico) setUsuario(usuarioCanonico);

    // 1) Usuario logueado: backend/canónico primero; fallback local solo mientras /me aún hidrata.
    if (usuarioCheckout) {
      let usuarioFuenteCheckout: Usuario = usuarioCheckout;
      const puedeUsarSnapshotLocal = !usuarioCanonico && !authHydrated && usuario;
      if (puedeUsarSnapshotLocal) {
        const usuariosLS = leerMaikaUsuarios();
        const claveFallback = normalizarTelefonoES9(usuario.telefono || "");
        const encontradoFallback = usuariosLS.find(
          (u) => normalizarTelefonoES9(String(u.telefono || "")) === claveFallback
        );
        if (encontradoFallback) {
          const proyectado = proyectarUsuariosDesdeMaika([encontradoFallback])[0];
          if (proyectado) usuarioFuenteCheckout = proyectado;
        }
      }

      const telCheckout = claveTelefonoES(usuarioFuenteCheckout.telefono || "");
      const telUsuarioState = usuario ? claveTelefonoES(usuario.telefono || "") : null;
      if (!usuarioCanonico && telCheckout && telUsuarioState && telCheckout === telUsuarioState) {
        const dirsCanon = Array.isArray(usuarioFuenteCheckout.direcciones) ? usuarioFuenteCheckout.direcciones : [];
        const dirsSt = Array.isArray(usuario?.direcciones) ? usuario.direcciones : [];
        usuarioFuenteCheckout = {
          ...usuario!,
          ...usuarioFuenteCheckout,
          direcciones: dirsCanon.length > 0 ? dirsCanon : dirsSt
        };
      }

      precargarDatosClienteDesdeUsuario(usuarioFuenteCheckout);
      direcciones.prepararListaYSeleccionDesdeUsuario(usuarioFuenteCheckout);
    } else {
      if (recordarDatosInvitado) {
        setDatosCliente(cargarClienteInvitadoDesdeStorage(CLIENTE_VACIO, QUICK_CHECKOUT_KEY));
      } else {
        // Sin sesión iniciada: por privacidad, checkout vacío.
        resetCliente();
      }
      setAvisoTelefonoCheckout(null);
    }

    if (regenerarNumero) setNumeroPedidoPreview(generarNumeroPedido());
    setPasoFinalizarCompra("datos");
    setFormPedidoAbierto(true);
  };

  const modoDireccionCheckoutAbiertoRef = useRef(false);
  const datosClienteAntesModoDireccionRef = useRef<Cliente | null>(null);
  const usuarioAntesModoDireccionRef = useRef<Usuario | null>(null);

  const cerrarCheckoutSinGuardar = useCallback(() => {
    // En modo dirección la X descarta cualquier cambio local no guardado.
    if (modoDireccionCheckout && datosClienteAntesModoDireccionRef.current) {
      setDatosCliente(datosClienteAntesModoDireccionRef.current);
    }
    // Blindaje UX: cerrar modal nunca debe tumbar la sesión.
    if (modoDireccionCheckout && !usuario && usuarioAntesModoDireccionRef.current) {
      setUsuario(usuarioAntesModoDireccionRef.current);
    }
    if (modoDireccionCheckout) {
      // Evita click-through sobre acciones sensibles al cerrar el modal.
      sessionStorage.setItem("maika_ignore_logout_until", String(Date.now() + 300));
    }
    setPasoFinalizarCompra("datos");
    setFormPedidoAbierto(false);
    if (modoDireccionCheckout) navigate("/cuenta", { replace: true });
  }, [modoDireccionCheckout, navigate, usuario, setUsuario, setDatosCliente, setPasoFinalizarCompra, setFormPedidoAbierto]);

  useEffect(() => {
    if (location.pathname !== "/carrito" && location.pathname !== "/cuenta") return;
    if (!modoDireccionCheckout) {
      modoDireccionCheckoutAbiertoRef.current = false;
      datosClienteAntesModoDireccionRef.current = null;
      usuarioAntesModoDireccionRef.current = null;
      return;
    }
    if (modoDireccionCheckoutAbiertoRef.current) return;
    modoDireccionCheckoutAbiertoRef.current = true;
    datosClienteAntesModoDireccionRef.current = { ...datosCliente };
    usuarioAntesModoDireccionRef.current = usuario;
    finalizarCarrito();
     
  }, [location.pathname, modoDireccionCheckout]);

  /** Tras login o recuperar contraseña en `/cuenta?modo=direccion`, vuelve al modal de finalizar compra (no a «Mi cuenta»). */
  useEffect(() => {
    if (!modoDireccionCheckout || location.pathname !== "/cuenta") return;
    let marcar = false;
    try {
      marcar = sessionStorage.getItem("maika_reabrir_checkout_tras_auth") === "1";
    } catch {
      return;
    }
    if (!marcar || !usuario) return;
    try {
      sessionStorage.removeItem("maika_reabrir_checkout_tras_auth");
    } catch {
      /* ignore */
    }
    modoDireccionCheckoutAbiertoRef.current = false;
    void finalizarCarrito();
     
  }, [usuario, location.pathname, modoDireccionCheckout]);

  useEffect(() => {
    if (!modoDireccionCheckout) return;
    setPasoFinalizarCompra("datos");
  }, [modoDireccionCheckout, setPasoFinalizarCompra]);

  return {
    direcciones,
    finalizarCarrito,
    cerrarCheckoutSinGuardar,
    buscandoCalleCheckout,
    setBuscandoCalleCheckout,
    calleCheckoutResetSignal,
    setCalleCheckoutResetSignal,
    /** Mismo flag que routing; por si el consumidor prefiere nombre explícito de flujo. */
    modoDireccionCheckoutActivo: modoDireccionCheckout
  };
}
