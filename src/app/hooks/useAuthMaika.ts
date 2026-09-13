import { useCallback, useEffect, useState } from "react";
import type { DireccionUsuario, Pagina, Usuario } from "../../types";
import { GUEST_CART_PENDING_KEY } from "../../config";
import {
  esErrorPerfilNoAutorizado,
  guardarSnapshotPerfilCliente,
  hasClientSession,
  limpiarClavesSesionEnLocalStorage,
  MAIKA_AUTH_USER_SNAPSHOT_KEY,
  MAIKA_EVENTO_SESION_CLIENTE_LIMPIADA,
  markClientSessionActive,
  obtenerPerfilApi,
  probeClientSessionApi,
  purgarJwtLegacyEnLocalStorage,
  type UsuarioPerfilCompletoApi
} from "../../services/apiAuth";
import { esEmailVerificable } from "../../utils/proyectarUsuariosDesdeMaika";

const AUTO_LOGOUT_INACTIVIDAD_MIN = 20;

/** Máx. tiempo con pantalla de “cargando sesión” si hay sesión pero aún no hay snapshot ni respuesta del API. */
const AUTH_HYDRATE_UI_MAX_WAIT_MS = 4000;
const AUTH_PROFILE_RETRY_BASE_MS = 2000;
const AUTH_PROFILE_RETRY_MAX_MS = 30000;

export type AuthPerfilSyncState = {
  estado: "ok" | "desactualizado";
  reintentando: boolean;
  intento: number;
  ultimoErrorAt: number | null;
};

function leerUsuarioActualDesdeStorage(): Usuario | null {
  return null;
}

function parseUsuarioDesdeMaikaAuthStorage(): Usuario | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MAIKA_AUTH_USER_SNAPSHOT_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Record<string, unknown>;
    if (p.id === undefined || p.id === null || String(p.id).trim() === "") return null;
    const email = String(p.email ?? "");
    const nombreRaw = typeof p.nombre === "string" ? p.nombre : "";
    const nombre = String(nombreRaw).trim() || email.split("@")[0] || "Usuario";
    return {
      id: p.id as string | number,
      nombre,
      email,
      telefono: String(p.telefono ?? ""),
      direccion: typeof p.direccion === "string" ? p.direccion : "",
      calle: String(p.calle ?? ""),
      bloque: String(p.bloque ?? ""),
      escalera: String(p.escalera ?? ""),
      piso: String(p.piso ?? ""),
      puerta: String(p.puerta ?? ""),
      numero: String(p.numero ?? ""),
      cp: String(p.cp ?? ""),
      provincia: String(p.provincia ?? ""),
      poblacion: String(p.poblacion ?? ""),
      pais: String(p.pais ?? ""),
      direcciones: Array.isArray(p.direcciones) ? (p.direcciones as DireccionUsuario[]) : [],
      direccionPredeterminadaId: String(p.direccionPredeterminadaId ?? ""),
      password: "",
      verificado: esEmailVerificable(email),
      pedidos: []
    };
  } catch {
    return null;
  }
}

type PerfilBackend = UsuarioPerfilCompletoApi;

export type UseAuthMaikaOptions = {
  mostrarNotificacion: (mensaje: string, tipo?: "normal" | "exito" | "error") => void;
  setPagina: (p: Pagina) => void;
};

export function useAuthMaika(o: UseAuthMaikaOptions) {
  const { mostrarNotificacion, setPagina } = o;

  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    if (typeof window === "undefined") return leerUsuarioActualDesdeStorage();
    return leerUsuarioActualDesdeStorage() ?? parseUsuarioDesdeMaikaAuthStorage();
  });
  const [authHydrated, setAuthHydrated] = useState(() => {
    if (typeof window === "undefined") return true;
    return !hasClientSession() || parseUsuarioDesdeMaikaAuthStorage() != null;
  });

  const [loginModalAbierto, setLoginModalAbierto] = useState(false);
  const [modoRegistro, setModoRegistro] = useState<"login" | "register">("login");
  const [authPerfilSync, setAuthPerfilSync] = useState<AuthPerfilSyncState>({
    estado: "ok",
    reintentando: false,
    intento: 0,
    ultimoErrorAt: null
  });

  const limpiarSesionInvalida = useCallback(() => {
    limpiarClavesSesionEnLocalStorage();
    setUsuario(null);
  }, []);

  const construirUsuarioDesdePerfil = useCallback((perfil: PerfilBackend): Usuario => {
    return {
      id: String(perfil.id),
      nombre: perfil.nombre || perfil.email?.split("@")[0] || "Usuario",
      email: perfil.email || "",
      telefono: perfil.telefono || "",
      calle: String(perfil.calle || ""),
      bloque: String(perfil.bloque || ""),
      escalera: String(perfil.escalera || ""),
      piso: String(perfil.piso || ""),
      puerta: String(perfil.puerta || ""),
      numero: String(perfil.numero || ""),
      cp: String(perfil.cp || ""),
      provincia: String(perfil.provincia || ""),
      poblacion: String(perfil.poblacion || ""),
      pais: String(perfil.pais || ""),
      direccion: perfil.direccion ?? "",
      direcciones: Array.isArray(perfil.direcciones) ? perfil.direcciones : [],
      direccionPredeterminadaId: String(perfil.direccionPredeterminadaId || ""),
      password: "",
      verificado: esEmailVerificable(perfil.email || ""),
      mustChangePassword: !!perfil.mustChangePassword,
      pedidos: []
    };
  }, []);

  const persistirSnapshotAuth = useCallback((perfil: PerfilBackend) => {
    guardarSnapshotPerfilCliente(perfil);
  }, []);

  const refrescarPerfilDesdeServidor = useCallback(
    async (opts?: { mostrarBienvenida?: boolean }): Promise<"ok" | "sin_token" | "no_autorizado" | "fallo_temporal"> => {
      if (!hasClientSession()) {
        const ok = await probeClientSessionApi();
        if (!ok) {
          // El servidor dice que no hay sesión: el snapshot de localStorage es obsoleto y no debe
          // seguir pintando la UI como logueada (p. ej. tras reiniciar el backend con secreto viejo).
          limpiarSesionInvalida();
          setAuthPerfilSync({ estado: "ok", reintentando: false, intento: 0, ultimoErrorAt: null });
          return "sin_token";
        }
      }

      setAuthPerfilSync((prev) =>
        prev.estado === "desactualizado" ? { ...prev, reintentando: true } : prev
      );

      try {
        const perfil = await obtenerPerfilApi();
        persistirSnapshotAuth(perfil);
        const usuarioFromMe: Usuario = construirUsuarioDesdePerfil(perfil);
        setUsuario(usuarioFromMe);
        setAuthPerfilSync({ estado: "ok", reintentando: false, intento: 0, ultimoErrorAt: null });
        if (opts?.mostrarBienvenida && !sessionStorage.getItem("maika_bienvenida_session")) {
          sessionStorage.setItem("maika_bienvenida_session", "1");
          const nombre = (perfil.nombre || "").trim() || perfil.email?.split("@")[0] || "Usuario";
          mostrarNotificacion(`Bienvenido de nuevo, ${nombre}`, "normal");
        }
        return "ok";
      } catch (error) {
        if (esErrorPerfilNoAutorizado(error)) {
          limpiarSesionInvalida();
          setAuthPerfilSync({ estado: "ok", reintentando: false, intento: 0, ultimoErrorAt: null });
          return "no_autorizado";
        }
        setAuthPerfilSync((prev) => ({
          estado: "desactualizado",
          reintentando: false,
          intento: prev.estado === "desactualizado" ? Math.min(prev.intento + 1, 8) : 0,
          ultimoErrorAt: Date.now()
        }));
        return "fallo_temporal";
      }
    },
    [limpiarSesionInvalida, persistirSnapshotAuth, construirUsuarioDesdePerfil, mostrarNotificacion]
  );

  const reintentarPerfilAhora = useCallback(() => {
    void refrescarPerfilDesdeServidor();
  }, [refrescarPerfilDesdeServidor]);

  const iniciarSesionConToken = useCallback(
    async (_token?: string, opts?: { mostrarBienvenida?: boolean }): Promise<Usuario | null> => {
      markClientSessionActive();
      purgarJwtLegacyEnLocalStorage();
      localStorage.removeItem(MAIKA_AUTH_USER_SNAPSHOT_KEY);
      setUsuario(null);
      /*
       * No usar `setAuthHydrated(false)` aquí: en `MaikaAppShell` desmonta toda la app (incl. `/cuenta`)
       * y sustituye por «Conectando…». Ese barrido simultáneo al `fetch` de `/me` (p. ej. tras reiniciar
       * el backend o con red lenta) provoca pantalla negra o UI colgada. Los flujos de login ya muestran
       * estado de carga local (p. ej. «Entrando…» en Mi cuenta).
       */
      const estado = await refrescarPerfilDesdeServidor(opts);
      if (estado !== "ok") return null;
      return parseUsuarioDesdeMaikaAuthStorage();
    },
    [refrescarPerfilDesdeServidor]
  );

  const getUsuarioCanonico = useCallback(async (): Promise<Usuario | null> => {
    if (!hasClientSession()) return usuario || null;
    try {
      const estado = await refrescarPerfilDesdeServidor();
      if (estado === "no_autorizado") return null;
      const snapshot = parseUsuarioDesdeMaikaAuthStorage();
      return snapshot ?? usuario ?? null;
    } catch (error) {
      if (esErrorPerfilNoAutorizado(error)) {
        limpiarSesionInvalida();
        return null;
      }
      return usuario || null;
    }
  }, [usuario, limpiarSesionInvalida, refrescarPerfilDesdeServidor]);

  useEffect(() => {
    let activo = true;
    let hidratoUi = false;
    const marcarUiLista = () => {
      if (!activo || hidratoUi) return;
      hidratoUi = true;
      setAuthHydrated(true);
    };

    const hydrateAuthUser = async () => {
      purgarJwtLegacyEnLocalStorage();
      const ok = await probeClientSessionApi();
      if (!ok) {
        // Sin sesión real en el servidor: limpiar el snapshot para que /cuenta muestre login,
        // igual que hacen /suenos y /horoscopo con ExperienciaAuthGuard.
        limpiarSesionInvalida();
        marcarUiLista();
        return;
      }
      try {
        await refrescarPerfilDesdeServidor({ mostrarBienvenida: true });
      } finally {
        if (activo) marcarUiLista();
      }
    };

    const tMax = window.setTimeout(marcarUiLista, AUTH_HYDRATE_UI_MAX_WAIT_MS);
    void hydrateAuthUser();
    return () => {
      activo = false;
      window.clearTimeout(tMax);
    };
  }, [limpiarSesionInvalida, refrescarPerfilDesdeServidor]);

  /** Restablecer contraseña u otros flujos limpian LS fuera de `limpiarSesionInvalida` (p. ej. desde `ResetPasswordPage`). */
  useEffect(() => {
    const onLimpiar = () => {
      limpiarSesionInvalida();
      setAuthHydrated(true);
      setAuthPerfilSync({ estado: "ok", reintentando: false, intento: 0, ultimoErrorAt: null });
    };
    window.addEventListener(MAIKA_EVENTO_SESION_CLIENTE_LIMPIADA, onLimpiar);
    return () => window.removeEventListener(MAIKA_EVENTO_SESION_CLIENTE_LIMPIADA, onLimpiar);
  }, [limpiarSesionInvalida]);

  useEffect(() => {
    if (authPerfilSync.estado !== "desactualizado" || authPerfilSync.reintentando) return;
    const delay = Math.min(
      AUTH_PROFILE_RETRY_MAX_MS,
      AUTH_PROFILE_RETRY_BASE_MS * 2 ** authPerfilSync.intento
    );
    const timer = window.setTimeout(() => {
      void refrescarPerfilDesdeServidor();
    }, delay);
    return () => window.clearTimeout(timer);
  }, [
    authPerfilSync.estado,
    authPerfilSync.reintentando,
    authPerfilSync.intento,
    refrescarPerfilDesdeServidor
  ]);

  useEffect(() => {
    const haySesionActiva = !!usuario || hasClientSession();
    if (!haySesionActiva) return;

    const timeoutMs = AUTO_LOGOUT_INACTIVIDAD_MIN * 60_000;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cerrarSesionPorInactividad = () => {
      limpiarSesionInvalida();
      localStorage.removeItem(GUEST_CART_PENDING_KEY);
      setPagina("cuenta");
      mostrarNotificacion("⏳ Sesión cerrada por inactividad", "normal");
    };

    const resetInactividad = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(cerrarSesionPorInactividad, timeoutMs);
    };

    const eventos: Array<keyof WindowEventMap> = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    for (const ev of eventos) {
      window.addEventListener(ev, resetInactividad, { passive: true });
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") resetInactividad();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    resetInactividad();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      for (const ev of eventos) {
        window.removeEventListener(ev, resetInactividad);
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [usuario, setPagina, mostrarNotificacion]);

  return {
    usuario,
    setUsuario,
    authHydrated,
    setAuthHydrated,
    loginModalAbierto,
    setLoginModalAbierto,
    modoRegistro,
    setModoRegistro,
    limpiarSesionInvalida,
    getUsuarioCanonico,
    authPerfilSync,
    reintentarPerfilAhora,
    iniciarSesionConToken
  };
}
