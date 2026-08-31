import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { EditUsuarioForm, Usuario } from "../../types";
import { proyectarUsuariosDesdeMaika } from "../../utils/proyectarUsuariosDesdeMaika";
import { normalizarTelefonoES9 } from "../../utils/telefono";
import {
  guardarMaikaUsuarios as guardarMaikaUsuariosStorage,
  leerMaikaUsuarios as leerMaikaUsuariosStorage,
  migrarLegacyAMaikaSiHaceFalta,
  restaurarMaikaUsuariosDesdeBackendSiVacio,
  type MaikaUsuarioLS
} from "../../utils/maikaUsuarios";
import {
  deduplicarListaGestionUsuarios,
  fusionarApiYLocales,
  fusionarListaGestionUsuarios,
  leerLegacyUsuariosJSON,
  mapearUsuarioApiAGestion,
  usuariosGestionAMaikaUsuarioLS
} from "../../utils/adminUsuariosFusion";
import { normalizarDireccionesUsuario as normalizarDireccionesUsuarioUtil } from "../../utils/direcciones";
import {
  ensureAdminUsuariosApiJwt,
  getJwtTokenParaOperacionesUsuarios,
  listarUsuariosApi
} from "../../services/apiAuth";
import { isAdminAuthorized } from "../../utils/adminAuth";
import { guardarEdicionUsuarioMaika } from "../../hooks/useAuthMaikaGuardarEdicionUsuario";

export type UseUsuariosMaikaOptions = {
  mostrarNotificacion: (mensaje: string, tipo?: "normal" | "exito" | "error") => void;
  usuario: Usuario | null;
  setUsuario: Dispatch<SetStateAction<Usuario | null>>;
  getUsuarioCanonico: () => Promise<Usuario | null>;
  precargarDatosClienteDesdeUsuario: (u: Usuario | null) => void;
  setModalUsuariosAbierto: (open: boolean) => void;
  direccionesMax: number;
};

export function useUsuariosMaika(o: UseUsuariosMaikaOptions) {
  const {
    mostrarNotificacion,
    usuario,
    setUsuario,
    getUsuarioCanonico,
    precargarDatosClienteDesdeUsuario,
    setModalUsuariosAbierto,
    direccionesMax
  } = o;

  const leerMaikaUsuarios = useCallback(() => leerMaikaUsuariosStorage(), []);
  const guardarMaikaUsuarios = useCallback(
    (usuarios: MaikaUsuarioLS[]) => guardarMaikaUsuariosStorage(usuarios, normalizarTelefonoES9),
    []
  );

  const [listaUsuarios, setListaUsuarios] = useState<Usuario[]>([]);

  const rehidratarListaDesdeAlmacenamientoLocal = useCallback(() => {
    try {
      const listaMaika = proyectarUsuariosDesdeMaika(leerMaikaUsuariosStorage());
      const lista = fusionarListaGestionUsuarios(listaMaika, leerLegacyUsuariosJSON());
      setListaUsuarios(lista);
    } catch {
      setListaUsuarios([]);
    }
  }, []);

  /** Iguala `maika_usuarios` con la lista ya fusionada (API+local), sin volver a subir todo al servidor. */
  const persistirFusionEnMaikaLocal = useCallback((listaFinal: Usuario[]) => {
    const prevMaika = leerMaikaUsuariosStorage();
    const passMap = new Map<string, string>();
    for (const m of prevMaika) {
      const t = normalizarTelefonoES9(m.telefono || "");
      const p = String(m.password || "").trim();
      if (t && /^[67]\d{8}$/.test(t) && p) passMap.set(t, p);
    }
    const maikaRows = usuariosGestionAMaikaUsuarioLS(listaFinal, passMap, normalizarTelefonoES9);
    guardarMaikaUsuariosStorage(maikaRows, normalizarTelefonoES9, {
      sincronizarServidor: false,
      omitirOutbox: true
    });
  }, []);

  const ultimoIntentoRestaurarRef = useRef(0);

  useEffect(() => {
    void (async () => {
      try {
        let maika = migrarLegacyAMaikaSiHaceFalta(normalizarTelefonoES9);
        if (maika.length === 0) {
          maika = await restaurarMaikaUsuariosDesdeBackendSiVacio(normalizarTelefonoES9);
        }
        rehidratarListaDesdeAlmacenamientoLocal();
      } catch {
        setListaUsuarios([]);
      }
    })();
  }, [rehidratarListaDesdeAlmacenamientoLocal]);

  /** Tras borrar datos del sitio: si el almacén sigue vacío, reintenta al volver la pestaña o la red. */
  useEffect(() => {
    const intentar = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      void (async () => {
        if (leerMaikaUsuariosStorage().length > 0) {
          rehidratarListaDesdeAlmacenamientoLocal();
          return;
        }
        const ahora = Date.now();
        if (ahora - ultimoIntentoRestaurarRef.current < 5000) return;
        ultimoIntentoRestaurarRef.current = ahora;
        await restaurarMaikaUsuariosDesdeBackendSiVacio(normalizarTelefonoES9);
        rehidratarListaDesdeAlmacenamientoLocal();
      })();
    };
    window.addEventListener("online", intentar);
    document.addEventListener("visibilitychange", intentar);
    return () => {
      window.removeEventListener("online", intentar);
      document.removeEventListener("visibilitychange", intentar);
    };
  }, [rehidratarListaDesdeAlmacenamientoLocal]);

  const [modalEditarUsuarioAbierto, setModalEditarUsuarioAbierto] = useState(false);
  const [editUsuarioForm, setEditUsuarioForm] = useState<EditUsuarioForm | null>(null);

  const normalizarDireccionesUsuario = useCallback(
    (dirsRaw: unknown) => normalizarDireccionesUsuarioUtil(dirsRaw, direccionesMax),
    [direccionesMax]
  );

  const abrirEditorUsuario = useCallback(
    (usuarioAEditar: Usuario) => {
      setModalUsuariosAbierto(true);
      const tel9 = normalizarTelefonoES9(usuarioAEditar.telefono || "");
      const maika = leerMaikaUsuarios().find((m) => normalizarTelefonoES9(m.telefono || "") === tel9);
      const dirsMaika = normalizarDireccionesUsuario(maika?.direcciones);
      const dirsUsuario = normalizarDireccionesUsuario(usuarioAEditar.direcciones);
      const dirsBase = dirsMaika.length >= dirsUsuario.length ? dirsMaika : dirsUsuario;
      const predId = String(maika?.direccionPredeterminadaId || usuarioAEditar.direccionPredeterminadaId || "").trim();
      const dirSeleccionada =
        (predId && dirsBase.find((dir) => dir.id === predId)) || dirsBase[0] || null;

      setEditUsuarioForm({
        id: usuarioAEditar.id,
        nombre: usuarioAEditar.nombre || "",
        email: usuarioAEditar.email || "",
        dni: usuarioAEditar.dni || "",
        telefono: usuarioAEditar.telefono || "",
        password: "",
        passwordTemporal: false,
        calle: dirSeleccionada?.calle || usuarioAEditar.calle || usuarioAEditar.direccion || "",
        bloque: dirSeleccionada?.bloque || usuarioAEditar.bloque || "",
        escalera: dirSeleccionada?.escalera || usuarioAEditar.escalera || "",
        piso: dirSeleccionada?.piso || usuarioAEditar.piso || "",
        puerta: dirSeleccionada?.puerta || usuarioAEditar.puerta || "",
        numero: dirSeleccionada?.numero || usuarioAEditar.numero || "",
        cp: dirSeleccionada?.cp || usuarioAEditar.cp || "",
        provincia: dirSeleccionada?.provincia || usuarioAEditar.provincia || "",
        poblacion: dirSeleccionada?.poblacion || usuarioAEditar.poblacion || "",
        pais: dirSeleccionada?.pais || usuarioAEditar.pais || "España",
        direccion: usuarioAEditar.direccion || "",
        verificado: !!usuarioAEditar.verificado,
        direccionesDisponibles: dirsBase,
        direccionEditandoId: dirSeleccionada?.id || ""
      });
      setModalEditarUsuarioAbierto(true);
    },
    [leerMaikaUsuarios, normalizarDireccionesUsuario, setModalUsuariosAbierto]
  );

  const guardarEdicionUsuario = useCallback(async () => {
    if (!editUsuarioForm) return;
    await guardarEdicionUsuarioMaika({
      editUsuarioForm,
      usuario,
      mostrarNotificacion,
      setListaUsuarios,
      setUsuario,
      precargarDatosClienteDesdeUsuario,
      setModalEditarUsuarioAbierto,
      setEditUsuarioForm,
      getUsuarioCanonico,
      leerMaikaUsuarios,
      guardarMaikaUsuarios,
      direccionesMax
    });
  }, [
    editUsuarioForm,
    usuario,
    mostrarNotificacion,
    precargarDatosClienteDesdeUsuario,
    getUsuarioCanonico,
    leerMaikaUsuarios,
    guardarMaikaUsuarios,
    direccionesMax
  ]);

  const esperarJwtDisponible = useCallback(async (maxMs = 1800, stepMs = 60) => {
    const fin = Date.now() + maxMs;
    for (;;) {
      if (getJwtTokenParaOperacionesUsuarios()) return true;
      if (Date.now() >= fin) return !!getJwtTokenParaOperacionesUsuarios();
      await new Promise<void>((r) => setTimeout(r, stepMs));
    }
  }, []);

  const cargarUsuarios = useCallback(() => {
    void (async () => {
      let listaFinal: Usuario[] = [];
      const localesFusionados = fusionarListaGestionUsuarios(
        proyectarUsuariosDesdeMaika(leerMaikaUsuarios()),
        leerLegacyUsuariosJSON()
      );

      if (isAdminAuthorized()) {
        await ensureAdminUsuariosApiJwt();
      }

      const hayJwt = await esperarJwtDisponible();
      if (!hayJwt) {
        mostrarNotificacion(
          "ℹ️ Sin sesión activa: mostrando usuarios locales de este dispositivo.",
          "normal"
        );
        listaFinal = deduplicarListaGestionUsuarios(localesFusionados);
        setListaUsuarios(listaFinal);
        setModalUsuariosAbierto(true);
        return;
      }

      try {
        const apiRows = await listarUsuariosApi();
        const apiGestion = apiRows.map(mapearUsuarioApiAGestion);
        listaFinal = deduplicarListaGestionUsuarios(fusionarApiYLocales(apiGestion, localesFusionados));
        persistirFusionEnMaikaLocal(listaFinal);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        listaFinal = deduplicarListaGestionUsuarios(localesFusionados);
        if (msg.includes("(401)")) {
          mostrarNotificacion(
            "⚠️ Sesión caducada o sin permiso. Mostrando usuarios locales.",
            "normal"
          );
        } else {
          mostrarNotificacion(
            "⚠️ No se pudo cargar el servidor. Mostrando usuarios locales de este dispositivo.",
            "normal"
          );
        }
      }

      setListaUsuarios(listaFinal);
      setModalUsuariosAbierto(true);
    })();
  }, [esperarJwtDisponible, leerMaikaUsuarios, mostrarNotificacion, persistirFusionEnMaikaLocal, setModalUsuariosAbierto]);

  return {
    listaUsuarios,
    setListaUsuarios,
    modalEditarUsuarioAbierto,
    setModalEditarUsuarioAbierto,
    editUsuarioForm,
    setEditUsuarioForm,
    guardarEdicionUsuario,
    proyectarUsuariosDesdeMaika,
    abrirEditorUsuario,
    cargarUsuarios,
    leerMaikaUsuarios,
    guardarMaikaUsuarios
  };
}
