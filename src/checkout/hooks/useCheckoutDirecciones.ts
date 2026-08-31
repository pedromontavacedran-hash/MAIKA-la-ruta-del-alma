import { useCallback, useEffect, useState } from "react";
import type { NavigateFunction } from "react-router-dom";
import type { Cliente, DireccionUsuario, Usuario } from "../../types";
import { CLIENTE_VACIO } from "../../app/hooks/useClienteMaika";
import { DIRECCIONES_MAX } from "../../app/routing/routeMaps";
import { repartirNombreApellidos } from "../../utils/appIdentity";
import { construirDireccionBasica, construirDireccionCompleta } from "../../utils/direccion";
import {
  direccionClave as direccionClaveFn,
  direccionDesdeCliente as direccionDesdeClienteFn,
  direccionLegacyDesdeUsuarioLS as direccionLegacyDesdeUsuarioLSFn,
  normalizarDireccionesUsuario as normalizarDireccionesUsuarioFn
} from "../../utils/direcciones";
import { direccionesDesdePedidosMaikaLegacy } from "../../utils/direccionesHistorialPedidosMaika";
import { claveTelefonoES, normalizarTelefonoES9 } from "../../utils/telefono";
import type { MaikaUsuarioLS } from "../../utils/maikaUsuarios";
import { resolverUsoDireccionCheckout } from "../../utils/checkoutDireccionesActions";
import {
  construirDireccionParaBackend,
  eliminarDireccionCheckoutPersistida,
  guardarDireccionEnMaikaUsuarios
} from "../../utils/checkoutDireccionPersist";
import { perfilUsuarioPayloadDesdeMaika } from "../../utils/perfilPayloadDesdeMaika";
import { actualizarPerfilOEncolar } from "../../utils/perfilOfflineQueue";
import { hasClientSession } from "../../services/apiAuth";
import { prepareDireccionesParaGuardar } from "../../utils/prepareDireccionesParaGuardar";
import { notificarError, notificarExito } from "../../utils/ui/notificaciones";
import { direccionCheckoutEsSoloHistorialPedidos } from "../../utils/direccionCheckoutOrigen";
import { persistirDireccionHistorialSeleccionadaEnLibreta } from "../../utils/persistirHistorialDireccionEnLibreta";

const DIRECCION_LAST_EDITADA_KEY = "maika_direccion_last_editada_id";

function perfilPayloadMaikaConDireccionesActuales(maikaRow: MaikaUsuarioLS, usuarioActual: Usuario | null): Record<string, unknown> {
  const body = perfilUsuarioPayloadDesdeMaika(maikaRow);
  if (Array.isArray(body.direcciones)) {
    const preparado = prepareDireccionesParaGuardar(
      body.direcciones as DireccionUsuario[],
      Array.isArray(usuarioActual?.direcciones) ? usuarioActual.direcciones : [],
      String(body.direccionPredeterminadaId || usuarioActual?.direccionPredeterminadaId || "")
    );
    body.direcciones = preparado.direcciones;
    body.direccionPredeterminadaId = preparado.direccionPredeterminadaId;
  }
  return body;
}

function clienteSincronoDesdeUsuario(usuarioFuente: Usuario | null): Cliente | null {
  if (!usuarioFuente) return null;
  const repartido = repartirNombreApellidos(usuarioFuente.nombre || "", "");
  return {
    ...CLIENTE_VACIO,
    nombre: (repartido.nombre || "").toUpperCase(),
    apellidos: (repartido.apellidos || "").toUpperCase(),
    nombreApellidos:
      `${(repartido.nombre || "").trim()} ${(repartido.apellidos || "").trim()}`.trim() || usuarioFuente.nombre || "",
    email: usuarioFuente.email || "",
    dni: usuarioFuente.dni || "",
    telefono: usuarioFuente.telefono || "",
    direccion: usuarioFuente.direccion || "",
    calle: usuarioFuente.calle || "",
    numero: usuarioFuente.numero || "",
    bloque: usuarioFuente.bloque || "",
    escalera: usuarioFuente.escalera || "",
    piso: usuarioFuente.piso || "",
    puerta: usuarioFuente.puerta || "",
    cp: usuarioFuente.cp || "",
    poblacion: usuarioFuente.poblacion || "",
    provincia: usuarioFuente.provincia || "",
    ciudad: usuarioFuente.ciudad || "",
    pais: (usuarioFuente.pais || "").trim() || "ESPAÑA",
    notas: ""
  };
}

export type UseCheckoutDireccionesDeps = {
  datosCliente: Cliente;
  setDatosCliente: React.Dispatch<React.SetStateAction<Cliente>>;
  setCalleCheckoutResetSignal: React.Dispatch<React.SetStateAction<number>>;
  usuario: Usuario | null;
  setUsuario: (u: Usuario | null) => void;
  modoDireccionCheckout: boolean;
  navigate: NavigateFunction;
  mostrarNotificacion: (m: string, t: "normal" | "exito" | "error") => void;
  precargarDatosClienteDesdeUsuario: (u: Usuario | null) => void;
  leerMaikaUsuarios: () => MaikaUsuarioLS[];
  guardarMaikaUsuarios: (u: MaikaUsuarioLS[]) => void;
  setPasoFinalizarCompra: (v: "datos" | "confirmarDireccion" | "pago") => void;
  setFormPedidoAbierto: (v: boolean) => void;
};

export function useCheckoutDirecciones(d: UseCheckoutDireccionesDeps) {
  const {
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
  } = d;

  const [guardandoDireccionCheckout, setGuardandoDireccionCheckout] = useState(false);
  const [guardandoDireccionHistorialEnCuenta, setGuardandoDireccionHistorialEnCuenta] = useState(false);
  const [direccionesCheckout, setDireccionesCheckout] = useState<DireccionUsuario[]>([]);
  const [direccionCheckoutSeleccionadaId, setDireccionCheckoutSeleccionadaId] = useState("");
  const [direccionCheckoutActiva, setDireccionCheckoutActiva] = useState<DireccionUsuario | null>(null);
  const [modoNuevaDireccionCheckout, setModoNuevaDireccionCheckout] = useState(false);
  const [direccionPredeterminadaCheckoutId, setDireccionPredeterminadaCheckoutId] = useState("");
  const [direccionCheckoutAEliminarId, setDireccionCheckoutAEliminarId] = useState<string | null>(null);
  const [usarDireccionPrincipalCheckout, setUsarDireccionPrincipalCheckout] = useState(true);
  /** Pedido: edición manual de CP/calle (p. ej. «cambiar dirección» con 1 guardada). */
  const [modoEdicionUnaDireccionCheckout, setModoEdicionUnaDireccionCheckout] = useState(false);

  const normalizarDireccionesUsuario = useCallback(
    (dirsRaw: unknown) => normalizarDireccionesUsuarioFn(dirsRaw, DIRECCIONES_MAX),
    []
  );

  const aplicarDireccionEnCheckout = useCallback(
    (dir: DireccionUsuario) => {
      setCalleCheckoutResetSignal((n) => n + 1);
      setDireccionCheckoutActiva(dir);
      setDatosCliente((prev) => ({
        ...prev,
        direccion:
          construirDireccionCompleta({
            calle: dir.calle,
            numero: dir.numero,
            bloque: dir.bloque,
            escalera: dir.escalera,
            piso: dir.piso,
            puerta: dir.puerta
          }) || construirDireccionBasica(dir.calle, dir.numero),
        calle: dir.calle || prev.calle,
        numero: dir.numero || prev.numero,
        bloque: dir.bloque || "",
        escalera: dir.escalera || "",
        piso: dir.piso || "",
        puerta: dir.puerta || "",
        cp: dir.cp || prev.cp,
        poblacion: dir.poblacion || prev.poblacion,
        ciudad: dir.poblacion || prev.ciudad,
        provincia: dir.provincia || prev.provincia,
        pais: dir.pais || prev.pais
      }));
    },
    [setCalleCheckoutResetSignal, setDatosCliente]
  );

  const resetParaAbrirCheckout = useCallback(() => {
    setDireccionesCheckout([]);
    setDireccionCheckoutSeleccionadaId("");
    setDireccionCheckoutActiva(null);
  }, []);

  const prepararListaYSeleccionDesdeUsuario = useCallback(
    (usuarioFuenteCheckout: Usuario) => {
      const clave = claveTelefonoES(usuarioFuenteCheckout.telefono || "");
      const dirsUsuario = normalizarDireccionesUsuarioFn(usuarioFuenteCheckout.direcciones, Number.MAX_SAFE_INTEGER);
      const clienteSync = clienteSincronoDesdeUsuario(usuarioFuenteCheckout);
      const dirUsuarioPlana = clienteSync ? direccionDesdeClienteFn(clienteSync) : null;
      const dirsBase = [...dirsUsuario];
      if (dirUsuarioPlana && !dirsBase.some((x) => direccionClaveFn(x) === direccionClaveFn(dirUsuarioPlana))) {
        dirsBase.push(dirUsuarioPlana);
      }
      const dirsHistorial = direccionesDesdePedidosMaikaLegacy(clave, claveTelefonoES, DIRECCIONES_MAX);
      for (const dh of dirsHistorial) {
        if (!dirsBase.some((x) => direccionClaveFn(x) === direccionClaveFn(dh))) dirsBase.push(dh);
        if (dirsBase.length >= DIRECCIONES_MAX) break;
      }
      const dirsSlice = dirsBase;
      setDireccionesCheckout(dirsSlice);
      if (dirsSlice.length === 0) {
        setDireccionPredeterminadaCheckoutId("");
        setUsarDireccionPrincipalCheckout(true);
        setDireccionCheckoutSeleccionadaId("__nueva__");
        setModoNuevaDireccionCheckout(true);
      } else {
        let predeterminada = String(usuarioFuenteCheckout.direccionPredeterminadaId || "").trim();
        if (!predeterminada || !dirsSlice.some((x) => x.id === predeterminada)) {
          predeterminada = dirsSlice[0]?.id || "";
        }
        let seleccionId = predeterminada || dirsSlice[0]?.id || "";
        if (modoDireccionCheckout) {
          const lastIdRaw = localStorage.getItem(DIRECCION_LAST_EDITADA_KEY);
          const lastId = (lastIdRaw || "").trim();
          if (lastId && dirsSlice.some((x) => x.id === lastId)) {
            seleccionId = lastId;
          }
          localStorage.removeItem(DIRECCION_LAST_EDITADA_KEY);
        }

        setDireccionPredeterminadaCheckoutId(predeterminada);
        setUsarDireccionPrincipalCheckout(predeterminada ? seleccionId === predeterminada : true);
        setDireccionCheckoutSeleccionadaId(seleccionId);
        setModoNuevaDireccionCheckout(false);
        if (seleccionId) {
          const dir = dirsSlice.find((x) => x.id === seleccionId);
          if (dir) aplicarDireccionEnCheckout(dir);
        }
        if (!modoDireccionCheckout && dirsSlice.length > 0) {
          setModoEdicionUnaDireccionCheckout(false);
        }
      }
    },
    [aplicarDireccionEnCheckout, modoDireccionCheckout, normalizarDireccionesUsuario]
  );

  useEffect(() => {
    if (direccionesCheckout.length !== 1) setModoEdicionUnaDireccionCheckout(false);
  }, [direccionesCheckout.length]);

  useEffect(() => {
    if (modoNuevaDireccionCheckout) setModoEdicionUnaDireccionCheckout(false);
  }, [modoNuevaDireccionCheckout]);

  useEffect(() => {
    if (!modoDireccionCheckout || modoNuevaDireccionCheckout) return;
    if (direccionesCheckout.length === 0) return;

    const actual = direccionesCheckout.find((x) => x.id === direccionCheckoutSeleccionadaId) || null;
    if (actual) {
      if (!direccionCheckoutActiva || direccionCheckoutActiva.id !== actual.id) {
        setDireccionCheckoutActiva(actual);
      }
      aplicarDireccionEnCheckout(actual);
      return;
    }

    const fallback = direccionesCheckout[0];
    if (!fallback) return;
    setDireccionCheckoutSeleccionadaId(fallback.id);
    setDireccionCheckoutActiva(fallback);
    aplicarDireccionEnCheckout(fallback);
  }, [
    modoDireccionCheckout,
    modoNuevaDireccionCheckout,
    direccionesCheckout,
    direccionCheckoutSeleccionadaId,
    direccionCheckoutActiva,
    aplicarDireccionEnCheckout
  ]);

  useEffect(() => {
    if (direccionesCheckout.length <= 1) return;

    const vistos = new Set<string>();
    let cambiado = false;
    const normalizadas = direccionesCheckout.map((dir, i) => {
      const base = String(dir.id || "").trim() || `dir_runtime_${i}`;
      let id = base;
      if (vistos.has(id)) {
        id = `${base}__${i}`;
        cambiado = true;
      }
      vistos.add(id);
      return id === dir.id ? dir : { ...dir, id };
    });

    if (!cambiado) return;

    setDireccionesCheckout(normalizadas);
    setDireccionCheckoutSeleccionadaId((prev) => {
      if (normalizadas.some((x) => x.id === prev)) return prev;
      return normalizadas[0]?.id || "";
    });
    setDireccionPredeterminadaCheckoutId((prev) => {
      if (normalizadas.some((x) => x.id === prev)) return prev;
      return normalizadas[0]?.id || "";
    });
    setDireccionCheckoutActiva((prev) => {
      if (!prev) return null;
      return (
        normalizadas.find((x) => direccionClaveFn(x) === direccionClaveFn(prev))
        || normalizadas.find((x) => x.id === prev.id)
        || null
      );
    });
  }, [direccionesCheckout]);

  const eliminarDireccionCheckout = useCallback(
    (idDir: string) => {
      if (!usuario) {
        notificarError(mostrarNotificacion, "Inicia sesión para eliminar direcciones");
        return;
      }
      const res = eliminarDireccionCheckoutPersistida({
        idDir,
        usuarioTelefono: String(usuario.telefono || ""),
        datosClienteTelefono: String(datosCliente.telefono || ""),
        direccionesCheckout,
        direccionPredeterminadaCheckoutId,
        leerMaikaUsuarios,
        guardarMaikaUsuarios,
        normalizarTelefonoES9,
        normalizarDireccionesUsuario
      });
      if (res.kind === "error") {
        mostrarNotificacion(
          res.error === "Debes tener al menos una dirección" ? res.error : res.error,
          res.error === "Debes tener al menos una dirección" ? "normal" : "error"
        );
        setDireccionCheckoutAEliminarId(null);
        return;
      }

      setDireccionesCheckout(res.dirs);
      setDireccionPredeterminadaCheckoutId(res.predeterminadaId);
      setUsarDireccionPrincipalCheckout(true);
      if (res.dirs.length === 0) {
        setDireccionCheckoutSeleccionadaId("");
        setDireccionCheckoutActiva(null);
        setModoNuevaDireccionCheckout(true);
        setDatosCliente((prev) => ({
          ...prev,
          direccion: "",
          calle: "",
          numero: "",
          bloque: "",
          escalera: "",
          piso: "",
          puerta: "",
          cp: "",
          poblacion: "",
          ciudad: "",
          provincia: "",
          pais: prev.pais || "ESPAÑA"
        }));
      } else {
        const siguienteId = res.dirs.some((x) => x.id === direccionCheckoutSeleccionadaId)
          ? direccionCheckoutSeleccionadaId
          : res.predeterminadaId || res.dirs[0].id;
        setDireccionCheckoutSeleccionadaId(siguienteId);
        const siguienteDir = res.dirs.find((x) => x.id === siguienteId) || res.dirs[0];
        if (siguienteDir) aplicarDireccionEnCheckout(siguienteDir);
        setModoNuevaDireccionCheckout(false);
      }
      setDireccionCheckoutAEliminarId(null);
      mostrarNotificacion("Dirección eliminada", "normal");
    },
    [
      usuario,
      datosCliente,
      direccionesCheckout,
      direccionPredeterminadaCheckoutId,
      direccionCheckoutSeleccionadaId,
      mostrarNotificacion,
      aplicarDireccionEnCheckout,
      leerMaikaUsuarios,
      guardarMaikaUsuarios,
      normalizarDireccionesUsuario,
      setDatosCliente
    ]
  );

  const usarDireccionCheckout = useCallback(
    (idDir: string) => {
      const dirPick = direccionesCheckout.find((x) => x.id === idDir);
      if (usuario && dirPick && direccionCheckoutEsSoloHistorialPedidos(usuario, dirPick)) {
        setModoEdicionUnaDireccionCheckout(false);
        setModoNuevaDireccionCheckout(false);
        setDireccionCheckoutSeleccionadaId(dirPick.id);
        aplicarDireccionEnCheckout(dirPick);
        const pred = (direccionPredeterminadaCheckoutId || "").trim();
        setUsarDireccionPrincipalCheckout(pred ? dirPick.id === pred : true);
        return;
      }

      const res = resolverUsoDireccionCheckout({
        idDir,
        usuario,
        datosCliente,
        direccionesCheckout,
        leerMaikaUsuarios,
        normalizarTelefonoES9,
        normalizarDireccionesUsuario,
        claveTelefonoES
      });
      if ("error" in res) {
        notificarError(mostrarNotificacion, res.error);
        return;
      }
      guardarMaikaUsuarios(res.usuariosLS);

      setDireccionesCheckout(res.dirs);
      setDireccionPredeterminadaCheckoutId(res.dir.id);
      setDireccionCheckoutSeleccionadaId(res.dir.id);
      setDireccionCheckoutActiva(res.dir);
      aplicarDireccionEnCheckout(res.dir);
      setUsarDireccionPrincipalCheckout(true);
      setModoNuevaDireccionCheckout(false);
      setUsuario(res.mergedUser);
      precargarDatosClienteDesdeUsuario(res.mergedUser);

      notificarExito(mostrarNotificacion, "✅ Dirección fijada como principal");
      if (modoDireccionCheckout) {
        setPasoFinalizarCompra("datos");
        setFormPedidoAbierto(false);
        navigate("/cuenta", { replace: true });
      }
    },
    [
      usuario,
      datosCliente,
      mostrarNotificacion,
      aplicarDireccionEnCheckout,
      setUsuario,
      precargarDatosClienteDesdeUsuario,
      modoDireccionCheckout,
      navigate,
      direccionesCheckout,
      leerMaikaUsuarios,
      guardarMaikaUsuarios,
      normalizarDireccionesUsuario,
      setPasoFinalizarCompra,
      setFormPedidoAbierto,
      prepararListaYSeleccionDesdeUsuario,
      setModoEdicionUnaDireccionCheckout,
      setModoNuevaDireccionCheckout,
      direccionPredeterminadaCheckoutId,
      setDireccionCheckoutSeleccionadaId,
      setUsarDireccionPrincipalCheckout
    ]
  );

  const sincronizarPerfilTrasHistorialEnLibreta = useCallback(
    (usuarioNext: Usuario) => {
      void (async () => {
        try {
          if (!hasClientSession()) return;
          const tel9 = normalizarTelefonoES9(usuarioNext.telefono || "");
          const maikaRow = leerMaikaUsuarios().find((u) => normalizarTelefonoES9(String(u.telefono || "")) === tel9);
          if (maikaRow) await actualizarPerfilOEncolar(perfilPayloadMaikaConDireccionesActuales(maikaRow, usuarioNext));
        } catch {
          /* ignore */
        }
      })();
    },
    [leerMaikaUsuarios]
  );

  const guardarDireccionHistorialEnCuenta = useCallback(async () => {
    if (!usuario) return;
    const id = String(direccionCheckoutSeleccionadaId || "").trim();
    if (!id || id === "__nueva__") return;
    const dir = direccionesCheckout.find((x) => x.id === id);
    if (!dir || !direccionCheckoutEsSoloHistorialPedidos(usuario, dir)) return;

    setGuardandoDireccionHistorialEnCuenta(true);
    try {
      const pr = persistirDireccionHistorialSeleccionadaEnLibreta({
        usuario,
        dir,
        leerMaikaUsuarios
      });
      if (pr.ok === false) {
        notificarError(mostrarNotificacion, pr.error);
        return;
      }
      const nuevoId = String(pr.usuarioNext.direccionPredeterminadaId || "").trim();
      if (nuevoId) localStorage.setItem(DIRECCION_LAST_EDITADA_KEY, nuevoId);

      guardarMaikaUsuarios(pr.usuariosLS);
      setUsuario(pr.usuarioNext);
      precargarDatosClienteDesdeUsuario(pr.usuarioNext);
      prepararListaYSeleccionDesdeUsuario(pr.usuarioNext);
      notificarExito(mostrarNotificacion, "Dirección guardada en tu cuenta");
      sincronizarPerfilTrasHistorialEnLibreta(pr.usuarioNext);
    } finally {
      setGuardandoDireccionHistorialEnCuenta(false);
    }
  }, [
    usuario,
    direccionCheckoutSeleccionadaId,
    direccionesCheckout,
    leerMaikaUsuarios,
    guardarMaikaUsuarios,
    setUsuario,
    precargarDatosClienteDesdeUsuario,
    prepararListaYSeleccionDesdeUsuario,
    mostrarNotificacion,
    sincronizarPerfilTrasHistorialEnLibreta
  ]);

  const elegirDireccionParaEnvioPedido = useCallback(
    (d: DireccionUsuario) => {
      if (!usuario) return;
      if (!modoDireccionCheckout && direccionCheckoutEsSoloHistorialPedidos(usuario, d)) {
        const pr = persistirDireccionHistorialSeleccionadaEnLibreta({
          usuario,
          dir: d,
          leerMaikaUsuarios
        });
        if (pr.ok === false) {
          notificarError(mostrarNotificacion, pr.error);
        } else {
          guardarMaikaUsuarios(pr.usuariosLS);
          setUsuario(pr.usuarioNext);
          precargarDatosClienteDesdeUsuario(pr.usuarioNext);
          prepararListaYSeleccionDesdeUsuario(pr.usuarioNext);
          notificarExito(mostrarNotificacion, "Dirección guardada en tu cuenta");
          sincronizarPerfilTrasHistorialEnLibreta(pr.usuarioNext);
          return;
        }
      }
      setModoEdicionUnaDireccionCheckout(false);
      setModoNuevaDireccionCheckout(false);
      setDireccionCheckoutSeleccionadaId(d.id);
      aplicarDireccionEnCheckout(d);
      const pred = (direccionPredeterminadaCheckoutId || "").trim();
      setUsarDireccionPrincipalCheckout(pred ? d.id === pred : true);
    },
    [
      usuario,
      setModoEdicionUnaDireccionCheckout,
      setModoNuevaDireccionCheckout,
      setDireccionCheckoutSeleccionadaId,
      aplicarDireccionEnCheckout,
      direccionPredeterminadaCheckoutId,
      setUsarDireccionPrincipalCheckout
    ]
  );

  const guardarDireccionCheckout = useCallback(
    async (opts?: { autoDesdeSelector?: boolean; forzarUsarPrincipal?: boolean }) => {
      const autoDesdeSelector = Boolean(opts?.autoDesdeSelector);
      const usarPrincipal = modoDireccionCheckout
        ? true
        : typeof opts?.forzarUsarPrincipal === "boolean"
          ? opts.forzarUsarPrincipal
          : usarDireccionPrincipalCheckout;
      if (!usuario) {
        if (!autoDesdeSelector) notificarError(mostrarNotificacion, "Inicia sesión para guardar la dirección");
        return;
      }
      const { direccionFull, direccionParaBackend } = construirDireccionParaBackend(datosCliente);

      if (!direccionFull || direccionFull.length < 5) {
        if (!autoDesdeSelector) notificarError(mostrarNotificacion, "Introduce una dirección válida (mín. 5 caracteres)");
        return;
      }

      const claveTel = claveTelefonoES(datosCliente.telefono || "");
      const direccionPartes = direccionDesdeClienteFn(datosCliente);
      const direccionSeleccionada =
        direccionCheckoutSeleccionadaId && direccionCheckoutSeleccionadaId !== "__nueva__"
          ? direccionesCheckout.find((x) => x.id === direccionCheckoutSeleccionadaId) || null
          : null;

      const guardarEnMaikaDirecciones = () =>
        guardarDireccionEnMaikaUsuarios({
          claveTel,
          direccionPartes,
          direccionSeleccionada,
          modoDireccionCheckout,
          modoNuevaDireccionCheckout,
          usarPrincipal,
          direccionesMax: DIRECCIONES_MAX,
          leerMaikaUsuarios,
          guardarMaikaUsuarios,
          normalizarDireccionesUsuario,
          direccionLegacyDesdeUsuarioLS: direccionLegacyDesdeUsuarioLSFn,
          direccionClave: direccionClaveFn
        });

      setGuardandoDireccionCheckout(true);
      try {
        if (hasClientSession()) {
          const resDir = guardarEnMaikaDirecciones();
          if (resDir?.direccionIdResultado) localStorage.setItem(DIRECCION_LAST_EDITADA_KEY, resDir.direccionIdResultado);
          if (resDir?.direccionesNext) setDireccionesCheckout(resDir.direccionesNext);
          if (resDir?.direccionIdResultado) setDireccionCheckoutSeleccionadaId(resDir.direccionIdResultado);
          if (resDir?.direccionPredeterminadaId) {
            setDireccionPredeterminadaCheckoutId(resDir.direccionPredeterminadaId);
            setUsarDireccionPrincipalCheckout(resDir.direccionIdResultado === resDir.direccionPredeterminadaId);
          }
          setModoNuevaDireccionCheckout(false);

          const tel9Sync = normalizarTelefonoES9(datosCliente.telefono || "");
          const maikaRow = leerMaikaUsuarios().find((u) => normalizarTelefonoES9(u.telefono || "") === tel9Sync);
          if (!maikaRow) {
            if (!autoDesdeSelector) notificarError(mostrarNotificacion, "No se encontró el cliente en maika para sincronizar.");
            return;
          }
          const sync = await actualizarPerfilOEncolar(perfilPayloadMaikaConDireccionesActuales(maikaRow, usuario));
          const ru = sync.ok ? sync.usuario : null;
          const merged: Usuario = {
            ...usuario,
            direccion: ru?.direccion || direccionParaBackend || usuario.direccion,
            nombre: ru?.nombre || usuario.nombre,
            email: ru?.email || usuario.email,
            telefono: normalizarTelefonoES9(ru?.telefono || usuario.telefono || ""),
            dni: ru?.dni || usuario.dni,
            calle: ru?.calle || usuario.calle,
            numero: ru?.numero || usuario.numero,
            bloque: ru?.bloque || usuario.bloque,
            escalera: ru?.escalera || usuario.escalera,
            piso: ru?.piso || usuario.piso,
            puerta: ru?.puerta || usuario.puerta,
            cp: ru?.cp || usuario.cp,
            poblacion: ru?.poblacion || usuario.poblacion,
            provincia: ru?.provincia || usuario.provincia,
            pais: ru?.pais || usuario.pais,
            direcciones: Array.isArray(ru?.direcciones) && ru.direcciones.length > 0
              ? ru.direcciones
              : resDir?.direccionesNext || usuario.direcciones,
            direccionPredeterminadaId:
              ru?.direccionPredeterminadaId || resDir?.direccionPredeterminadaId || usuario.direccionPredeterminadaId
          };
          setUsuario(merged);
          precargarDatosClienteDesdeUsuario(merged);

          if (!autoDesdeSelector) {
            notificarExito(mostrarNotificacion, "✅ Dirección guardada");
            setPasoFinalizarCompra("datos");
            setFormPedidoAbierto(false);
            navigate("/cuenta", { replace: true });
          }
          return;
        }

        const merged: Usuario = { ...usuario, direccion: direccionParaBackend };
        setUsuario(merged);
        precargarDatosClienteDesdeUsuario(merged);

        const resDir = guardarEnMaikaDirecciones();
        if (resDir?.direccionIdResultado) localStorage.setItem(DIRECCION_LAST_EDITADA_KEY, resDir.direccionIdResultado);
        if (resDir?.direccionesNext) setDireccionesCheckout(resDir.direccionesNext);
        if (resDir?.direccionIdResultado) setDireccionCheckoutSeleccionadaId(resDir.direccionIdResultado);
        if (resDir?.direccionPredeterminadaId) {
          setDireccionPredeterminadaCheckoutId(resDir.direccionPredeterminadaId);
          setUsarDireccionPrincipalCheckout(resDir.direccionIdResultado === resDir.direccionPredeterminadaId);
        }
        setModoNuevaDireccionCheckout(false);

        if (!autoDesdeSelector) {
          notificarExito(mostrarNotificacion, "✅ Dirección guardada");
          setPasoFinalizarCompra("datos");
          setFormPedidoAbierto(false);
          navigate("/cuenta", { replace: true });
        }
      } catch {
        if (!autoDesdeSelector) notificarError(mostrarNotificacion, "Error al guardar la dirección");
      } finally {
        setGuardandoDireccionCheckout(false);
      }
    },
    [
      usuario,
      datosCliente,
      mostrarNotificacion,
      precargarDatosClienteDesdeUsuario,
      setUsuario,
      navigate,
      direccionCheckoutSeleccionadaId,
      direccionesCheckout,
      usarDireccionPrincipalCheckout,
      modoDireccionCheckout,
      modoNuevaDireccionCheckout,
      leerMaikaUsuarios,
      guardarMaikaUsuarios,
      normalizarDireccionesUsuario,
      setPasoFinalizarCompra,
      setFormPedidoAbierto
    ]
  );

  return {
    guardandoDireccionCheckout,
    guardandoDireccionHistorialEnCuenta,
    direccionesCheckout,
    direccionCheckoutSeleccionadaId,
    direccionCheckoutActiva,
    modoNuevaDireccionCheckout,
    modoEdicionUnaDireccionCheckout,
    direccionPredeterminadaCheckoutId,
    direccionCheckoutAEliminarId,
    usarDireccionPrincipalCheckout,
    setModoEdicionUnaDireccionCheckout,
    setDireccionCheckoutSeleccionadaId,
    setDireccionCheckoutActiva,
    setModoNuevaDireccionCheckout,
    setDireccionPredeterminadaCheckoutId,
    setDireccionCheckoutAEliminarId,
    setUsarDireccionPrincipalCheckout,
    aplicarDireccionEnCheckout,
    eliminarDireccionCheckout,
    usarDireccionCheckout,
    guardarDireccionCheckout,
    guardarDireccionHistorialEnCuenta,
    resetParaAbrirCheckout,
    prepararListaYSeleccionDesdeUsuario,
    elegirDireccionParaEnvioPedido
  };
}

export type UseCheckoutDireccionesReturn = ReturnType<typeof useCheckoutDirecciones>;
