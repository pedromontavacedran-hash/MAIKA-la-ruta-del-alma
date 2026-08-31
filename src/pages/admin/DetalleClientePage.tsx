import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ModalConfirmacion from "../../ModalConfirmacion";
import AdminPageNav from "../../components/admin/AdminPageNav";
import { THEME } from "../../config";
import { leerMaikaPedidos } from "../../utils/maikaPedidos";
import { guardarMaikaUsuarios, leerMaikaUsuarios } from "../../utils/maikaUsuarios";
import type { Cliente, DireccionUsuario, Pedido, Usuario } from "../../types";
import { claveTelefonoES, normalizarTelefonoES9 } from "../../utils/telefono";
import { direccionClave, direccionDesdeCliente, direccionesDesdeHistorial } from "../../utils/direcciones";
import { isAdminAuthorized } from "../../utils/adminAuth";
import { notificarError, notificarExito } from "../../utils/ui/notificaciones";
import { sincronizarMaikaUsuarioEnServidorSiHayToken } from "../../utils/syncMaikaPerfilServidor";
import { ensureAdminUsuariosApiJwt, getJwtTokenParaOperacionesUsuarios, listarUsuariosApi } from "../../services/apiAuth";
import type { UsuarioListItemApi } from "../../services/apiAuth";
import { lineaCompletaDesdeDatosEnvio, textoDireccionVistaAdmin } from "../../utils/pedidos/direccionPedidoVista";
import { construirDireccionCompleta } from "../../utils/direccion";
import { scrollElementIntoMaikaScrollPort } from "../../utils/maikaScrollPort";

function buscarPedidoCompletoEnMap(map: Map<string, Pedido>, idPed: string): Pedido | undefined {
  const k = idPed.trim();
  if (!k) return undefined;
  const direct = map.get(k) ?? map.get(k.toUpperCase());
  if (direct) return direct;
  const lower = k.toLowerCase();
  for (const [key, val] of map) {
    if (key.toLowerCase() === lower) return val;
  }
  return undefined;
}

function notificarErrorSyncServidor(
  mostrarNotificacion: (msg: string, tipo?: "normal" | "exito" | "error") => void,
  r: { ok: boolean; error?: string }
) {
  if (r.error) console.warn("[syncMaikaUsuario]", r.error);
  const msg =
    /\(401\)|Token inválido|No token/i.test(r.error || "")
      ? "Guardado local. Sesión caducada o sin permisos: vuelve a iniciar sesión como administrador."
      : "Guardado local; no se pudo sincronizar el servidor.";
  notificarError(mostrarNotificacion, msg);
}

function formatearFechaEs(fecha: string) {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleString("es-ES", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function estadoTexto(estado?: string) {
  if (estado === "enviado") return "🚚 Enviado";
  if (estado === "entregado") return "✅ Entregado";
  return "🛒 Pendiente";
}

function normalizarTextoComparacion(s: string) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/gi, " ")
    .trim()
    .toUpperCase();
}

function extraerTipoVia(calleRaw: string): "CARRER" | "CARRERA" | null {
  const c = String(calleRaw || "").trim().toUpperCase();
  if (!c) return null;
  const limpio = c
    .replace(/^C\.?\s*\/\s*/g, " ")
    .replace(/^C\s*\/\s*/g, " ")
    .replace(/^C\.?\s*/g, " ")
    .replace(/^CALLE\s+/g, "")
    .trim();
  const m = limpio.match(/^(CARRER|CARRERA)(?:\b|[\s\-.,/])/);
  return m ? (m[1] as "CARRER" | "CARRERA") : null;
}

function titleCaseWords(inputRaw: string): string {
  const input = String(inputRaw || "").trim();
  if (!input) return "";
  return input
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function limpiaDireccionParaPerfil(d: DireccionUsuario): DireccionUsuario | null {
  const o: DireccionUsuario = {
    ...d,
    calle: String(d.calle || "").trim().toUpperCase(),
    numero: String(d.numero || "").trim().toUpperCase(),
    bloque: String(d.bloque || "").trim().toUpperCase(),
    escalera: String(d.escalera || "").trim().toUpperCase(),
    piso: String(d.piso || "").trim().toUpperCase(),
    puerta: String(d.puerta || "").trim().toUpperCase(),
    cp: String(d.cp || "").trim().replace(/\D/g, "").slice(0, 5),
    poblacion: String(d.poblacion || "").trim().toUpperCase(),
    provincia: String(d.provincia || "").trim().toUpperCase(),
    pais: String(d.pais || "").trim().toUpperCase() || "ESPAÑA",
    alias: String(d.alias || "").trim() || "Dirección"
  };
  if (!o.calle || !o.numero || !o.cp || !o.poblacion || !o.provincia || !o.pais) return null;
  return o;
}

function lineaCpUbicacionMostrar(d: Pick<DireccionUsuario, "cp" | "poblacion" | "provincia" | "pais">): string {
  const cp = String(d.cp || "").trim();
  const pob = titleCaseWords(String(d.poblacion || ""));
  const prov = titleCaseWords(String(d.provincia || ""));
  const pais = titleCaseWords(String(d.pais || ""));
  const cola = [prov, pais].filter(Boolean).join(", ");
  const trasCp = [cp, pob].filter(Boolean).join(" ");
  if (!trasCp && !cola) return "";
  const nucleo = trasCp ? `📍C.P ${trasCp}` : "📍C.P";
  return cola ? `${nucleo}, ${cola}` : nucleo;
}

function saneadoDireccionesEstructural(
  raw: unknown,
  predIdRaw: string,
  maxDirecciones: number
): { direcciones: DireccionUsuario[]; direccionPredeterminadaId: string } {
  const arr = Array.isArray(raw) ? raw as Partial<DireccionUsuario>[] : [];
  const out: DireccionUsuario[] = [];
  const claves = new Set<string>();
  const ids = new Set<string>();

  for (let i = 0; i < arr.length; i += 1) {
    const d = arr[i];
    if (!d || typeof d !== "object") continue;

    const calle = String(d.calle || "").trim().toUpperCase();
    const cp = String(d.cp || "").trim().replace(/\D/g, "").slice(0, 5);
    const poblacion = String(d.poblacion || "").trim().toUpperCase();
    const provincia = String(d.provincia || "").trim().toUpperCase();
    const pais = String(d.pais || "").trim().toUpperCase() || "ESPAÑA";
    const numero = String(d.numero || "").trim().toUpperCase();

    // Mínimo obligatorio (decisión ejecutiva): calle + población + CP.
    if (!calle || !poblacion || !cp) continue;

    /** Misma clave que checkout: número, piso, puerta, bloque y escalera distinguen viviendas en la misma calle/CP. */
    const clave = direccionClave({
      calle,
      numero,
      cp,
      poblacion,
      provincia,
      pais,
      bloque: String(d.bloque || "").trim().toUpperCase(),
      escalera: String(d.escalera || "").trim().toUpperCase(),
      piso: String(d.piso || "").trim().toUpperCase(),
      puerta: String(d.puerta || "").trim().toUpperCase()
    });
    if (claves.has(clave)) continue;
    claves.add(clave);

    let id = String(d.id || "").trim();
    if (!id || ids.has(id)) id = `dir_fix_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 8)}`;
    ids.add(id);

    out.push({
      id,
      alias: String(d.alias || "").trim() || `Dirección ${out.length + 1}`,
      calle,
      numero,
      bloque: String(d.bloque || "").trim().toUpperCase(),
      escalera: String(d.escalera || "").trim().toUpperCase(),
      piso: String(d.piso || "").trim().toUpperCase(),
      puerta: String(d.puerta || "").trim().toUpperCase(),
      cp,
      poblacion,
      provincia,
      pais
    });

    if (out.length >= maxDirecciones) break;
  }

  let pred = String(predIdRaw || "").trim();
  if (!out.some((d) => d.id === pred)) pred = out[0]?.id || "";

  return { direcciones: out, direccionPredeterminadaId: pred };
}

/** Remoto (servidor) primero; se añaden filas solo locales que no choquen por clave. */
function mergeDireccionesPorClavePreferirRemoto(
  remotos: DireccionUsuario[],
  locales: DireccionUsuario[],
  max: number
): DireccionUsuario[] {
  const map = new Map<string, DireccionUsuario>();
  for (const d of remotos) {
    map.set(direccionClave(d), d);
  }
  for (const d of locales) {
    const k = direccionClave(d);
    if (!map.has(k)) map.set(k, d);
  }
  return Array.from(map.values()).slice(0, max);
}

function direccionesMaikaFusionadasServidor(
  maikaRow: { direcciones?: unknown; direccionPredeterminadaId?: string } | null,
  usuarioApiRow: UsuarioListItemApi | null | undefined,
  maxDirecciones: number
): DireccionUsuario[] {
  const fromMaika = saneadoDireccionesEstructural(
    maikaRow?.direcciones,
    String(maikaRow?.direccionPredeterminadaId || ""),
    maxDirecciones
  ).direcciones;
  if (usuarioApiRow === undefined || usuarioApiRow === null) return fromMaika;
  const apiSane = saneadoDireccionesEstructural(
    usuarioApiRow.direcciones,
    String(usuarioApiRow.direccionPredeterminadaId || ""),
    maxDirecciones
  );
  return mergeDireccionesPorClavePreferirRemoto(apiSane.direcciones, fromMaika, maxDirecciones);
}

export default function DetalleClientePage({
  mostrarNotificacion,
  abrirEditorUsuario
}: {
  mostrarNotificacion: (msg: string, tipo?: "normal" | "exito" | "error") => void;
  abrirEditorUsuario: (usuario: Usuario) => void;
}) {
  const DIRECCIONES_MAX = 3;
  const NUEVA_DIRECCION_ID = "__nueva__";
  const navigate = useNavigate();
  const location = useLocation();
  const qs = new URLSearchParams(location.search);
  const telParam = qs.get("tel") || "";
  const idParam = qs.get("id") || "";
  const [versionData, setVersionData] = useState(0);
  const [usuarioApiRow, setUsuarioApiRow] = useState<UsuarioListItemApi | null | undefined>(undefined);
  const [formDireccion, setFormDireccion] = useState<DireccionUsuario | null>(null);
  const [direccionEditandoId, setDireccionEditandoId] = useState<string | null>(null);
  const [direccionEditandoClave, setDireccionEditandoClave] = useState<string | null>(null);
  const [direccionAEliminarId, setDireccionAEliminarId] = useState<string | null>(null);
  const editorDireccionRef = useRef<HTMLDivElement | null>(null);

  const data = useMemo(() => {
    const maikaUsuarios = leerMaikaUsuarios();
    const tel9Param = normalizarTelefonoES9(telParam);
    const maika =
      (tel9Param && maikaUsuarios.find((u) => normalizarTelefonoES9(String(u.telefono || "")) === tel9Param))
      || (idParam && maikaUsuarios.find((u) => `u_${normalizarTelefonoES9(String(u.telefono || ""))}` === String(idParam)))
      || null;
    const tel9 = normalizarTelefonoES9(String(maika?.telefono || telParam || ""));
    const clave = tel9 ? claveTelefonoES(tel9) : null;
    const usuarioLegacy: Usuario | null = maika
      ? {
          id: `u_${tel9}`,
          // `maika_usuarios.nombre` a veces ya contiene apellidos (por migraciones/guardados previos),
          // así que evitamos duplicar en el enunciado del detalle.
          nombre: (() => {
            const nombrePilaRaw = String(maika.nombre || "").trim();
            const apellidosRaw = String(maika.apellidos || "").trim();
            if (!apellidosRaw) return nombrePilaRaw;
            if (!nombrePilaRaw) return apellidosRaw;
            return nombrePilaRaw.toLowerCase().includes(apellidosRaw.toLowerCase())
              ? nombrePilaRaw
              : `${nombrePilaRaw} ${apellidosRaw}`.trim();
          })(),
          email: String(maika.email || "").trim(),
          telefono: tel9,
          calle: String(maika.calle || "").trim(),
          numero: String(maika.numero || "").trim(),
          bloque: String(maika.bloque || "").trim(),
          escalera: String(maika.escalera || "").trim(),
          piso: String(maika.piso || "").trim(),
          puerta: String(maika.puerta || "").trim(),
          cp: String(maika.cp || "").trim(),
          poblacion: String(maika.poblacion || "").trim(),
          provincia: String(maika.provincia || "").trim(),
          pais: String(maika.pais || "").trim(),
          direccion:
            construirDireccionCompleta({
              calle: String(maika.calle || "").trim(),
              numero: String(maika.numero || "").trim(),
              bloque: String(maika.bloque || "").trim(),
              escalera: String(maika.escalera || "").trim(),
              piso: String(maika.piso || "").trim(),
              puerta: String(maika.puerta || "").trim()
            }) || "",
          direcciones: Array.isArray(maika.direcciones) ? maika.direcciones : [],
          direccionPredeterminadaId: String(maika.direccionPredeterminadaId || "").trim(),
          verificado: true
        } as Usuario
      : null;

    const saneado = saneadoDireccionesEstructural(
      maika?.direcciones,
      String(maika?.direccionPredeterminadaId || ""),
      DIRECCIONES_MAX
    );

    const predIdSaneado = String(saneado.direccionPredeterminadaId || "") || "";

    // Lista base desde maika (sin servidor); la fusión con GET /usuarios va en dirsMerged.
    const dirsMaika: DireccionUsuario[] = saneado.direcciones;

    const dirPlanoRaw = String(usuarioLegacy?.direccion || "").trim();

    const pedidos = clave ? leerMaikaPedidos().filter((p) => String(p.telefono || "") === String(clave)) : [];
    pedidos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    const necesitaPersistirSaneado = !!maika && (
      JSON.stringify(Array.isArray(maika?.direcciones) ? maika.direcciones : []) !== JSON.stringify(saneado.direcciones)
      || String(maika?.direccionPredeterminadaId || "").trim() !== String(saneado.direccionPredeterminadaId || "").trim()
    );

    return {
      usuarioLegacy,
      maika,
      tel9,
      clave,
      dirsMaika,
      predIdSaneado,
      dirPlanoRaw,
      pedidos,
      saneado,
      necesitaPersistirSaneado
    };
  }, [idParam, telParam, versionData]);

  const { usuarioLegacy, maika, tel9, clave, predIdSaneado, dirPlanoRaw, pedidos, saneado, necesitaPersistirSaneado } =
    data;

  /** Mismo pedido en pedidosMaika (direccionEnvio / cliente); enlaza también si falta tel en cliente pero el Nº coincide con maika_pedidos. */
  const pedidosCompletosPorNumero = useMemo(() => {
    const map = new Map<string, Pedido>();
    if (!tel9) return map;
    const idsMaika = new Set(
      (pedidos || []).map((x) => String(x.idPedido || "").trim()).filter(Boolean)
    );
    try {
      const raw = localStorage.getItem("pedidosMaika");
      const parsed = raw ? JSON.parse(raw) : [];
      const arr = Array.isArray(parsed) ? (parsed as Pedido[]) : [];
      for (const ped of arr) {
        const pedTel = String(ped.cliente?.telefono || "").trim();
        const okPorTel =
          (pedTel && normalizarTelefonoES9(pedTel) === tel9) ||
          (pedTel && clave && claveTelefonoES(pedTel) === clave) ||
          (!pedTel && idsMaika.has(String(ped.numero || "").trim()));
        if (!okPorTel) continue;
        const n = String(ped.numero || "").trim();
        if (n) {
          map.set(n, ped);
          map.set(n.toUpperCase(), ped);
        }
      }
    } catch {
      /* ignore */
    }
    return map;
  }, [tel9, clave, pedidos, versionData]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (isAdminAuthorized()) {
        await ensureAdminUsuariosApiJwt();
      }
      if (!getJwtTokenParaOperacionesUsuarios()) {
        if (!cancelled) setUsuarioApiRow(null);
        return;
      }
      if (!telParam.trim() && !idParam.trim()) {
        if (!cancelled) setUsuarioApiRow(null);
        return;
      }
      try {
        const rows = await listarUsuariosApi();
        if (cancelled) return;
        const tel9 = normalizarTelefonoES9(telParam);
        const idRaw = String(idParam || "").trim();
        const found = rows.find((u) => {
          if (tel9 && normalizarTelefonoES9(String(u.telefono || "")) === tel9) return true;
          if (idRaw && String(u.id) === idRaw) return true;
          if (idRaw && `u_${normalizarTelefonoES9(String(u.telefono || ""))}` === idRaw) return true;
          return false;
        });
        setUsuarioApiRow(found ?? null);
      } catch {
        if (!cancelled) setUsuarioApiRow(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [telParam, idParam, versionData]);

  const dirsMerged = useMemo(() => {
    if (!maika) {
      if (usuarioApiRow === undefined) return [];
      if (usuarioApiRow === null) return [];
      return saneadoDireccionesEstructural(
        usuarioApiRow.direcciones,
        String(usuarioApiRow.direccionPredeterminadaId || ""),
        DIRECCIONES_MAX
      ).direcciones;
    }
    return direccionesMaikaFusionadasServidor(maika, usuarioApiRow, DIRECCIONES_MAX);
  }, [maika, usuarioApiRow, versionData]);

  const predIdFinal = useMemo(() => {
    const dirsUse = dirsMerged;
    let pLocal = predIdSaneado;
    if (pLocal && !dirsUse.some((d) => d.id === pLocal)) {
      pLocal = "";
    }
    // Maika (localStorage) manda en esta pantalla: "Hacer principal" actualiza maika al instante;
    // el snapshot GET /usuarios puede ir un paso por detrás y no debe pisar la UI.
    if (pLocal) return pLocal;

    const apiPid =
      usuarioApiRow?.direccionPredeterminadaId != null
        ? String(usuarioApiRow.direccionPredeterminadaId).trim()
        : "";
    if (apiPid && dirsUse.some((d) => d.id === apiPid)) {
      return apiPid;
    }
    if (dirPlanoRaw && dirsUse.length > 0) {
      const dirPlano = normalizarTextoComparacion(dirPlanoRaw);
      const match = dirsUse.find((d) => {
        const c1 = normalizarTextoComparacion(`${d.calle} ${d.numero}`);
        const c2 = normalizarTextoComparacion(`${d.calle} ${d.numero} ${d.cp} ${d.poblacion}`);
        return dirPlano.includes(c1) || dirPlano.includes(c2);
      });
      if (match?.id) return match.id;
    }
    return dirsUse[0]?.id || "";
  }, [dirsMerged, predIdSaneado, dirPlanoRaw, usuarioApiRow]);

  /**
   * Misma ampliación que en checkout / Cuenta → elegir dirección (App.finalizarCarrito):
   * direcciones guardadas + dirección deducida del perfil plano si no coincide + direcciones desde pedidosMaika.
   * Solo filas de `dirsMerged` son persistidas; el resto es informativo (por eso puede haber 3 en cuenta y 2 guardadas).
   */
  const { dirsVista, idsSoloSugeridos } = useMemo(() => {
    const solo = new Set<string>();
    const out: DireccionUsuario[] = [...dirsMerged];
    const claveDir = (d: DireccionUsuario) => direccionClave(d);

    if (usuarioLegacy && out.length < DIRECCIONES_MAX) {
      const c: Cliente = {
        nombreApellidos: usuarioLegacy.nombre || "",
        email: usuarioLegacy.email || "",
        telefono: usuarioLegacy.telefono || "",
        direccion: usuarioLegacy.direccion || "",
        calle: usuarioLegacy.calle || "",
        numero: usuarioLegacy.numero || "",
        bloque: usuarioLegacy.bloque || "",
        escalera: usuarioLegacy.escalera || "",
        piso: usuarioLegacy.piso || "",
        puerta: usuarioLegacy.puerta || "",
        ciudad: (usuarioLegacy as { ciudad?: string }).ciudad || "",
        cp: usuarioLegacy.cp || "",
        poblacion: usuarioLegacy.poblacion || "",
        provincia: usuarioLegacy.provincia || "",
        pais: usuarioLegacy.pais || "España",
        notas: ""
      };
      const pl = direccionDesdeCliente(c);
      if (pl && !out.some((x) => claveDir(x) === claveDir(pl))) {
        solo.add(pl.id);
        out.push(pl);
      }
    }

    if (clave && out.length < DIRECCIONES_MAX) {
      let pedidosLegacy: Pedido[] = [];
      try {
        const raw = localStorage.getItem("pedidosMaika");
        const parsed = raw ? JSON.parse(raw) : [];
        pedidosLegacy = Array.isArray(parsed) ? parsed : [];
      } catch {
        pedidosLegacy = [];
      }
      for (const h of direccionesDesdeHistorial(clave, pedidosLegacy, claveTelefonoES, DIRECCIONES_MAX)) {
        if (out.length >= DIRECCIONES_MAX) break;
        if (!out.some((x) => claveDir(x) === claveDir(h))) {
          solo.add(h.id);
          out.push(h);
        }
      }
    }

    return { dirsVista: out.slice(0, DIRECCIONES_MAX), idsSoloSugeridos: solo };
  }, [dirsMerged, clave, usuarioLegacy, versionData]);

  const dirsOrdenadas = useMemo(() => {
    if (!predIdFinal) return dirsVista;
    const principal = dirsVista.find((d) => d.id === predIdFinal);
    const resto = dirsVista.filter((d) => d.id !== predIdFinal);
    return principal ? [principal, ...resto] : dirsVista;
  }, [dirsVista, predIdFinal]);
  const totalHistoricoPedidos = useMemo(
    () => pedidos.reduce((sum, p) => sum + (Number(p.total || 0) || 0), 0),
    [pedidos]
  );
  const ultimoPedidoFecha = pedidos.length > 0 ? formatearFechaEs(String(pedidos[0]?.fecha || "")) : "—";

  const nombreRaw =
    usuarioLegacy?.nombre || `${(maika?.nombre || "").trim()} ${(maika?.apellidos || "").trim()}`.trim();
  const nombre = !nombreRaw.trim() ? "—" : titleCaseWords(nombreRaw);
  const telefono = usuarioLegacy?.telefono || (maika?.telefono || "") || "—";
  const email = usuarioLegacy?.email || maika?.email || "—";
  const verificado = !!usuarioLegacy?.verificado;
  const inputBase: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: `1px solid rgba(201,162,74,0.45)`,
    background: "rgba(27,23,69,0.95)",
    color: "white",
    boxSizing: "border-box"
  };

  /** Inserta o actualiza por clave en maika_usuarios y sincroniza; devuelve el id persistido. */
  const upsertDireccionEnMaika = (limpia: DireccionUsuario): string | null => {
    if (!maika) return null;
    const usuariosLS = leerMaikaUsuarios();
    const idx = usuariosLS.findIndex(
      (u) => normalizarTelefonoES9(String(u.telefono || "")) === normalizarTelefonoES9(String(maika.telefono || ""))
    );
    if (idx < 0) return null;

    const prev = usuariosLS[idx];
    let dirsNext = direccionesMaikaFusionadasServidor(prev, usuarioApiRow, DIRECCIONES_MAX);
    const k = direccionClave(limpia);
    const idxMatch = dirsNext.findIndex((d) => direccionClave(d) === k);
    if (idxMatch >= 0) {
      const idFinal = dirsNext[idxMatch].id;
      dirsNext = [...dirsNext];
      dirsNext[idxMatch] = {
        ...limpia,
        id: idFinal,
        alias:
          (String(dirsNext[idxMatch].alias || "").trim() && String(dirsNext[idxMatch].alias)) ||
          limpia.alias ||
          `Dirección ${idxMatch + 1}`
      };
    } else {
      if (dirsNext.length >= DIRECCIONES_MAX) {
        notificarError(mostrarNotificacion, `Máximo ${DIRECCIONES_MAX} direcciones`);
        return null;
      }
      const nuevaId = `dir_admin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      dirsNext = [{ ...limpia, id: nuevaId, alias: limpia.alias || `Dirección ${dirsNext.length + 1}` }, ...dirsNext].slice(
        0,
        DIRECCIONES_MAX
      );
    }

    const predPrev = String(prev?.direccionPredeterminadaId || "").trim();
    let predNext = predPrev;
    if (!predNext || !dirsNext.some((d) => d.id === predNext)) {
      predNext = dirsNext[0]?.id || "";
    }
    const dirPred = dirsNext.find((d) => d.id === predNext) || dirsNext[0];

    usuariosLS[idx] = {
      ...prev,
      direcciones: dirsNext,
      direccionPredeterminadaId: predNext,
      calle: dirPred?.calle || prev.calle,
      numero: dirPred?.numero || prev.numero,
      bloque: dirPred?.bloque || prev.bloque,
      escalera: dirPred?.escalera || prev.escalera,
      piso: dirPred?.piso || prev.piso,
      puerta: dirPred?.puerta || prev.puerta,
      cp: dirPred?.cp || prev.cp,
      poblacion: dirPred?.poblacion || prev.poblacion,
      provincia: dirPred?.provincia || prev.provincia,
      pais: dirPred?.pais || prev.pais
    };

    guardarMaikaUsuarios(usuariosLS, normalizarTelefonoES9);
    const telSync = normalizarTelefonoES9(String(maika.telefono || ""));
    void sincronizarMaikaUsuarioEnServidorSiHayToken(telSync).then((r) => {
      if (!r.ok) notificarErrorSyncServidor(mostrarNotificacion, r);
    });
    setVersionData((v) => v + 1);
    const row = dirsNext.find((d) => direccionClave(d) === k);
    return row?.id || null;
  };

  useEffect(() => {
    if (!formDireccion || !editorDireccionRef.current) return;
    editorDireccionRef.current.animate(
      [
        { opacity: 0, transform: "translateY(8px)" },
        { opacity: 1, transform: "translateY(0)" }
      ],
      { duration: 200, easing: "ease-out" }
    );
  }, [formDireccion, direccionEditandoId]);

  useEffect(() => {
    if (!maika || !necesitaPersistirSaneado) return;
    const usuariosLS = leerMaikaUsuarios();
    const idx = usuariosLS.findIndex((u) => normalizarTelefonoES9(String(u.telefono || "")) === normalizarTelefonoES9(String(maika.telefono || "")));
    if (idx < 0) return;
    usuariosLS[idx] = {
      ...usuariosLS[idx],
      direcciones: saneado.direcciones,
      direccionPredeterminadaId: saneado.direccionPredeterminadaId
    };
    guardarMaikaUsuarios(usuariosLS, normalizarTelefonoES9);
    const telSync = normalizarTelefonoES9(String(maika.telefono || ""));
    void sincronizarMaikaUsuarioEnServidorSiHayToken(telSync).then((r) => {
      if (!r.ok) notificarErrorSyncServidor(mostrarNotificacion, r);
    });
    setVersionData((v) => v + 1);
  }, [maika, necesitaPersistirSaneado, saneado]);

  const iniciarNuevaDireccion = () => {
    if (dirsMerged.length >= DIRECCIONES_MAX) {
      mostrarNotificacion(`Máximo ${DIRECCIONES_MAX} direcciones`, "normal");
      return;
    }
    setDireccionEditandoId(NUEVA_DIRECCION_ID);
    setDireccionEditandoClave(null);
    setFormDireccion({
      id: "",
      alias: "Dirección",
      calle: "",
      numero: "",
      bloque: "",
      escalera: "",
      piso: "",
      puerta: "",
      cp: "",
      poblacion: "",
      provincia: "",
      pais: "ESPAÑA"
    });
    window.setTimeout(() => {
      scrollElementIntoMaikaScrollPort(editorDireccionRef.current, { align: "center", behavior: "smooth" });
    }, 0);
  };

  const iniciarEdicionDireccion = (dir: DireccionUsuario) => {
    setDireccionEditandoId(dir.id);
    setDireccionEditandoClave(direccionClave(dir));
    setFormDireccion({ ...dir });
    window.setTimeout(() => {
      scrollElementIntoMaikaScrollPort(editorDireccionRef.current, { align: "center", behavior: "smooth" });
    }, 0);
  };

  const guardarDireccionIndividual = () => {
    if (!formDireccion || !maika) return;

    const limpia: DireccionUsuario = {
      ...formDireccion,
      calle: String(formDireccion.calle || "").trim().toUpperCase(),
      numero: String(formDireccion.numero || "").trim().toUpperCase(),
      bloque: String(formDireccion.bloque || "").trim().toUpperCase(),
      escalera: String(formDireccion.escalera || "").trim().toUpperCase(),
      piso: String(formDireccion.piso || "").trim().toUpperCase(),
      puerta: String(formDireccion.puerta || "").trim().toUpperCase(),
      cp: String(formDireccion.cp || "").trim().replace(/\D/g, "").slice(0, 5),
      poblacion: String(formDireccion.poblacion || "").trim().toUpperCase(),
      provincia: String(formDireccion.provincia || "").trim().toUpperCase(),
      pais: String(formDireccion.pais || "").trim().toUpperCase()
    };

    if (!limpia.calle || !limpia.numero || !limpia.cp || !limpia.poblacion || !limpia.provincia || !limpia.pais) {
      notificarError(mostrarNotificacion, "Completa calle, número, CP, población, provincia y país");
      return;
    }

    if (
      direccionEditandoId &&
      direccionEditandoId !== NUEVA_DIRECCION_ID &&
      idsSoloSugeridos.has(direccionEditandoId)
    ) {
      const idU = upsertDireccionEnMaika(limpia);
      if (!idU) return;
      setFormDireccion(null);
      setDireccionEditandoId(null);
      setDireccionEditandoClave(null);
      notificarExito(mostrarNotificacion, "Dirección guardada en el perfil");
      return;
    }

    const usuariosLS = leerMaikaUsuarios();
    const idx = usuariosLS.findIndex((u) => normalizarTelefonoES9(String(u.telefono || "")) === normalizarTelefonoES9(String(maika.telefono || "")));
    if (idx < 0) {
      notificarError(mostrarNotificacion, "No se encontró el cliente en maika_usuarios");
      return;
    }

    const prev = usuariosLS[idx];
    let dirsNext = direccionesMaikaFusionadasServidor(prev, usuarioApiRow, DIRECCIONES_MAX);
    const predPrev = String(prev?.direccionPredeterminadaId || "").trim();
    let predNext = predPrev;

    if (direccionEditandoId && direccionEditandoId !== NUEVA_DIRECCION_ID) {
      const idxDir = dirsNext.findIndex((d) => d.id === direccionEditandoId && (!direccionEditandoClave || direccionClave(d) === direccionEditandoClave));
      const idxFallback = idxDir >= 0 ? idxDir : dirsNext.findIndex((d) => d.id === direccionEditandoId);
      const idxReal = idxFallback >= 0 ? idxFallback : dirsNext.findIndex((d) => direccionEditandoClave && direccionClave(d) === direccionEditandoClave);
      if (idxReal >= 0) {
        const idFinal = dirsNext[idxReal]?.id || direccionEditandoId;
        dirsNext = [...dirsNext];
        dirsNext[idxReal] = { ...limpia, id: idFinal };
      }
    } else {
      const nuevaId = `dir_admin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      dirsNext = [{ ...limpia, id: nuevaId }, ...dirsNext].slice(0, DIRECCIONES_MAX);
      if (!predNext) predNext = nuevaId;
    }

    const dirPred = dirsNext.find((d) => d.id === predNext) || dirsNext[0];
    usuariosLS[idx] = {
      ...prev,
      direcciones: dirsNext,
      direccionPredeterminadaId: dirPred?.id || "",
      calle: dirPred?.calle || prev.calle,
      numero: dirPred?.numero || prev.numero,
      bloque: dirPred?.bloque || prev.bloque,
      escalera: dirPred?.escalera || prev.escalera,
      piso: dirPred?.piso || prev.piso,
      puerta: dirPred?.puerta || prev.puerta,
      cp: dirPred?.cp || prev.cp,
      poblacion: dirPred?.poblacion || prev.poblacion,
      provincia: dirPred?.provincia || prev.provincia,
      pais: dirPred?.pais || prev.pais
    };

    guardarMaikaUsuarios(usuariosLS, normalizarTelefonoES9);
    const telSync = normalizarTelefonoES9(String(maika.telefono || ""));
    void sincronizarMaikaUsuarioEnServidorSiHayToken(telSync).then((r) => {
      if (!r.ok) notificarErrorSyncServidor(mostrarNotificacion, r);
    });
    setFormDireccion(null);
    setDireccionEditandoId(null);
    setDireccionEditandoClave(null);
    setVersionData((v) => v + 1);
    notificarExito(mostrarNotificacion, direccionEditandoId && direccionEditandoId !== NUEVA_DIRECCION_ID ? "Dirección actualizada" : "Dirección creada");
  };

  const eliminarDireccionPersistida = (idDir: string, mensajeExito = "Dirección eliminada") => {
    const telRef = normalizarTelefonoES9(String(maika?.telefono || usuarioLegacy?.telefono || telParam || ""));
    const usuariosLS = leerMaikaUsuarios();
    const idx = usuariosLS.findIndex((u) => normalizarTelefonoES9(String(u.telefono || "")) === telRef);

    if (idx >= 0) {
      const prev = usuariosLS[idx];
      const dirsPrev = direccionesMaikaFusionadasServidor(prev, usuarioApiRow, DIRECCIONES_MAX);
      const dirsNext = dirsPrev.filter((d) => d.id !== idDir);
      const predPrev = String(prev?.direccionPredeterminadaId || "").trim();
      const predNext = dirsNext.some((d) => d.id === predPrev) ? predPrev : (dirsNext[0]?.id || "");
      const dirPred = dirsNext.find((d) => d.id === predNext) || null;

      usuariosLS[idx] = {
        ...prev,
        direcciones: dirsNext,
        direccionPredeterminadaId: predNext,
        calle: dirPred?.calle || "",
        numero: dirPred?.numero || "",
        bloque: dirPred?.bloque || "",
        escalera: dirPred?.escalera || "",
        piso: dirPred?.piso || "",
        puerta: dirPred?.puerta || "",
        cp: dirPred?.cp || "",
        poblacion: dirPred?.poblacion || "",
        provincia: dirPred?.provincia || "",
        pais: dirPred?.pais || ""
      };
      guardarMaikaUsuarios(usuariosLS, normalizarTelefonoES9);
      void sincronizarMaikaUsuarioEnServidorSiHayToken(telRef).then((r) => {
        if (!r.ok) notificarErrorSyncServidor(mostrarNotificacion, r);
      });
    } else {
      notificarError(mostrarNotificacion, "No se encontró el cliente en maika_usuarios");
      return;
    }

    if (direccionEditandoId === idDir) {
      setFormDireccion(null);
      setDireccionEditandoId(null);
      setDireccionEditandoClave(null);
    }
    setVersionData((v) => v + 1);
    mostrarNotificacion(mensajeExito, "normal");
  };

  const eliminarDireccion = (idDir: string) => {
    if (idsSoloSugeridos.has(idDir)) {
      const dSug = dirsVista.find((d) => d.id === idDir);
      if (!dSug) {
        notificarError(mostrarNotificacion, "No se encontró la dirección");
        return;
      }
      const limpia = limpiaDireccionParaPerfil(dSug);
      if (!limpia) {
        notificarError(mostrarNotificacion, "Datos incompletos; edita la dirección primero y guarda.");
        return;
      }
      const idU = upsertDireccionEnMaika(limpia);
      if (!idU) return;
      if (direccionEditandoId === idDir) {
        setFormDireccion(null);
        setDireccionEditandoId(null);
        setDireccionEditandoClave(null);
      }
      eliminarDireccionPersistida(
        idU,
        "Dirección quitada del perfil (puede seguir apareciendo en pedidos antiguos)."
      );
      return;
    }
    eliminarDireccionPersistida(idDir);
  };

  const hacerPrincipal = (idDir: string) => {
    if (!maika) return;
    let usuariosLS = leerMaikaUsuarios();
    const idx = usuariosLS.findIndex((u) => normalizarTelefonoES9(String(u.telefono || "")) === normalizarTelefonoES9(String(maika.telefono || "")));
    if (idx < 0) return;
    let prev = usuariosLS[idx];
    let dirsPrev = direccionesMaikaFusionadasServidor(prev, usuarioApiRow, DIRECCIONES_MAX);
    let dirPred = dirsPrev.find((d) => d.id === idDir);

    if (!dirPred && idsSoloSugeridos.has(idDir)) {
      const dSug = dirsVista.find((d) => d.id === idDir);
      if (!dSug) return;
      const limpia = limpiaDireccionParaPerfil(dSug);
      if (!limpia) {
        notificarError(mostrarNotificacion, "Completa calle, número, CP, población, provincia y país antes de marcar principal");
        return;
      }
      const idU = upsertDireccionEnMaika(limpia);
      if (!idU) return;
      usuariosLS = leerMaikaUsuarios();
      prev = usuariosLS[idx];
      dirsPrev = direccionesMaikaFusionadasServidor(prev, usuarioApiRow, DIRECCIONES_MAX);
      dirPred = dirsPrev.find((d) => d.id === idU);
    }

    if (!dirPred) return;

    usuariosLS[idx] = {
      ...prev,
      direcciones: dirsPrev,
      direccionPredeterminadaId: dirPred.id,
      calle: dirPred.calle,
      numero: dirPred.numero,
      bloque: dirPred.bloque || "",
      escalera: dirPred.escalera || "",
      piso: dirPred.piso || "",
      puerta: dirPred.puerta || "",
      cp: dirPred.cp,
      poblacion: dirPred.poblacion,
      provincia: dirPred.provincia,
      pais: dirPred.pais
    };
    guardarMaikaUsuarios(usuariosLS, normalizarTelefonoES9);
    const telPr = normalizarTelefonoES9(String(maika.telefono || ""));
    void sincronizarMaikaUsuarioEnServidorSiHayToken(telPr).then((r) => {
      if (!r.ok) notificarErrorSyncServidor(mostrarNotificacion, r);
    });
    setVersionData((v) => v + 1);
    notificarExito(mostrarNotificacion, "Dirección principal actualizada");
  };

  if (!isAdminAuthorized()) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: 20 }}>
        <div
          style={{
            background: THEME.bg,
            border: `3px solid ${THEME.goldMain}`,
            borderRadius: 24,
            padding: 26
          }}
        >
          <h2 className="admin-page-heading" style={{ color: THEME.goldMain }}>Acceso denegado</h2>
          <p style={{ color: "rgba(255,255,255,0.75)", marginTop: 0 }}>
            Esta pantalla es solo para administradores.
          </p>
          <button
            type="button"
            onClick={() => navigate("/admin", { replace: true })}
            style={{
              marginTop: 10,
              padding: "12px 16px",
              borderRadius: 12,
              border: `2px solid ${THEME.goldMain}`,
              background: "transparent",
              color: THEME.goldMain,
              cursor: "pointer",
              fontWeight: 900
            }}
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container" style={{ paddingBottom: 40 }}>
      <div
        style={{
          background: THEME.bg,
          border: `1px solid color-mix(in srgb, ${THEME.goldMain} 35%, transparent)`,
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 2px 20px rgba(0,0,0,0.2)"
        }}
      >
        <AdminPageNav onVolver={() => navigate("/admin", { replace: true })} />

        <h2 className="admin-page-heading" style={{ color: THEME.goldMain, fontSize: 34 }}>Detalle de cliente</h2>
        <div style={{ color: "white", opacity: 0.88, marginBottom: 20, display: "grid", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, lineHeight: 1.25 }}>
            <div style={{ whiteSpace: "nowrap" }}>
              <strong style={{ color: THEME.goldMain }}>Nombre:</strong> {nombre}
            </div>
            <div style={{ whiteSpace: "nowrap" }}>
              <strong style={{ color: THEME.goldMain }}>Teléfono:</strong> {telefono}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, lineHeight: 1.25 }}>
            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>
              <strong style={{ color: THEME.goldMain }}>Email:</strong> {email}
            </div>
            <div style={{ whiteSpace: "nowrap" }}>
              <strong style={{ color: THEME.goldMain }}>Estado:</strong> {verificado ? "✅ Verificado" : "⏳ No verificado"}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <section style={{ background: "rgba(27,23,69,0.6)", border: `1px solid rgba(201,162,74,0.35)`, borderRadius: 18, padding: 16 }}>
            <h3 className="admin-page-section-heading" style={{ color: THEME.goldMain, fontSize: 22 }}>Direcciones</h3>
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.62)", lineHeight: 1.45 }}>
              Guardadas en este dispositivo y en el servidor{usuarioApiRow ? " (GET /usuarios)" : ""}. Las direcciones
              deducidas del perfil o de pedidos antiguos se muestran igual que en «Mi cuenta»; con Editar, Hacer principal
              o Eliminar se guardan en el perfil del cliente y quedan enlazadas.
            </p>
            {dirsOrdenadas.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.7)", margin: 0 }}>No hay direcciones registradas</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {dirsOrdenadas.map((d) => {
                  const esPrincipal = d.id === predIdFinal;
                  const esEditando =
                    direccionEditandoId === d.id &&
                    (!direccionEditandoClave || direccionEditandoClave === direccionClave(d));
                  const calleParaTipo = String(d.calle || "") || String(esPrincipal ? maika?.calle : "");
                  const tipoVia = extraerTipoVia(calleParaTipo);
                  const pisoValRaw = String(d.piso || "").trim() || (esPrincipal ? String(maika?.piso || "").trim() : "");
                  const puertaValRaw = String(d.puerta || "").trim() || (esPrincipal ? String(maika?.puerta || "").trim() : "");
                  // Para que se vea “bonito”, normalizamos como title case (ej. “1” se queda igual).
                  const pisoVal = titleCaseWords(pisoValRaw);
                  const puertaVal = titleCaseWords(puertaValRaw);
                  const tienePiso = pisoVal.length > 0;
                  const tienePuerta = puertaVal.length > 0;
                  const calleDisplay = titleCaseWords(String(d.calle || "").trim());
                  const lineaCalleNumeroVivienda = construirDireccionCompleta({
                    calle: calleDisplay,
                    numero: String(d.numero || "").trim(),
                    bloque: String(d.bloque || "").trim(),
                    escalera: String(d.escalera || "").trim(),
                    piso: pisoVal,
                    puerta: puertaVal
                  });
                  return (
                    <div
                      key={d.id}
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        border: esEditando
                          ? "2px solid #7fd8ff"
                          : esPrincipal
                            ? `2px solid ${THEME.goldMain}`
                            : "1px solid rgba(201,162,74,0.25)",
                        background: esEditando
                          ? "rgba(127,216,255,0.12)"
                          : esPrincipal
                            ? "rgba(201,162,74,0.08)"
                            : "rgba(0,0,0,0.12)"
                      }}
                    >
                      <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ color: "white", fontWeight: 800 }}>{lineaCalleNumeroVivienda}</div>
                        {esPrincipal && (
                          <div
                            translate="no"
                            className="notranslate"
                            lang="es"
                            style={{
                              color: "#fff",
                              background: "#b8860b",
                              border: "1px solid #f6d365",
                              borderRadius: 999,
                              fontWeight: 900,
                              fontSize: 11,
                              letterSpacing: "0.02em",
                              padding: "4px 10px",
                              boxShadow: "0 0 0 1px rgba(0,0,0,0.15), 0 0 10px rgba(246,211,101,0.28)"
                            }}
                          >
                            ★ PRINCIPAL
                          </div>
                        )}
                      </div>
                      {(tipoVia || tienePiso || tienePuerta) && (
                        <div style={{ color: "rgba(255,255,255,0.82)", marginTop: 6 }}>
                          {tipoVia ? <div style={{ marginBottom: 2 }}>Tipo vía: {tipoVia}</div> : null}
                          {/* Vivienda ya se muestra junto a la calle en la línea superior */}
                        </div>
                      )}
                      <div style={{ color: "rgba(255,255,255,0.82)", marginTop: (tipoVia || tienePiso || tienePuerta) ? 8 : 6 }}>
                        {lineaCpUbicacionMostrar(d) || `${d.cp} ${d.poblacion}`.trim()}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                        <button
                          type="button"
                          onClick={() => iniciarEdicionDireccion(d)}
                          style={{ border: `1px solid ${THEME.goldMain}`, background: "transparent", color: THEME.goldMain, borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setDireccionAEliminarId(d.id)}
                          style={{ border: "1px solid #ff6666", background: "transparent", color: "#ff6666", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                        >
                          Eliminar
                        </button>
                        {!esPrincipal && (
                          <button
                            type="button"
                            onClick={() => hacerPrincipal(d.id)}
                            style={{ border: "1px solid #f6d365", background: "transparent", color: "#f6d365", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                          >
                            Hacer principal
                          </button>
                        )}
                      </div>
                      {esEditando && formDireccion && (
                        <div ref={editorDireccionRef} style={{ marginTop: 12, border: "1px solid rgba(201,162,74,0.35)", borderRadius: 12, padding: 12, background: "rgba(0,0,0,0.2)" }}>
                          <div style={{ color: THEME.goldMain, fontWeight: 800, marginBottom: 8 }}>
                            Editar dirección
                          </div>
                          <div style={{ marginBottom: 10, fontSize: 12, color: "rgba(255,255,255,0.82)" }}>
                            Editando: <strong>{`${formDireccion.calle || ""} ${formDireccion.numero || ""}`.trim() || "Dirección seleccionada"}</strong>
                          </div>
                          <div style={{ display: "grid", gap: 8 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 8 }}>
                              <input value={formDireccion.calle || ""} onChange={(e) => setFormDireccion({ ...formDireccion, calle: e.target.value })} placeholder="Calle" style={{ ...inputBase }} />
                              <input value={formDireccion.numero || ""} onChange={(e) => setFormDireccion({ ...formDireccion, numero: e.target.value })} placeholder="Nº" style={{ ...inputBase }} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                              <input value={formDireccion.piso || ""} onChange={(e) => setFormDireccion({ ...formDireccion, piso: e.target.value })} placeholder="Piso" style={{ ...inputBase }} />
                              <input value={formDireccion.puerta || ""} onChange={(e) => setFormDireccion({ ...formDireccion, puerta: e.target.value })} placeholder="Puerta" style={{ ...inputBase }} />
                              <input value={formDireccion.bloque || ""} onChange={(e) => setFormDireccion({ ...formDireccion, bloque: e.target.value })} placeholder="Bloque" style={{ ...inputBase }} />
                              <input value={formDireccion.escalera || ""} onChange={(e) => setFormDireccion({ ...formDireccion, escalera: e.target.value })} placeholder="Escalera" style={{ ...inputBase }} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8 }}>
                              <input value={formDireccion.cp || ""} onChange={(e) => setFormDireccion({ ...formDireccion, cp: e.target.value.replace(/\D/g, "").slice(0, 5) })} placeholder="CP" style={{ ...inputBase }} />
                              <input value={formDireccion.poblacion || ""} onChange={(e) => setFormDireccion({ ...formDireccion, poblacion: e.target.value })} placeholder="Población" style={{ ...inputBase }} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                              <input value={formDireccion.provincia || ""} onChange={(e) => setFormDireccion({ ...formDireccion, provincia: e.target.value })} placeholder="Provincia" style={{ ...inputBase }} />
                              <input value={formDireccion.pais || ""} onChange={(e) => setFormDireccion({ ...formDireccion, pais: e.target.value })} placeholder="País" style={{ ...inputBase }} />
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
                            <button type="button" onClick={() => { setFormDireccion(null); setDireccionEditandoId(null); setDireccionEditandoClave(null); }} style={{ border: `1px solid ${THEME.goldMain}`, background: "transparent", color: THEME.goldMain, borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontWeight: 700 }}>
                              Cancelar
                            </button>
                            <button type="button" onClick={guardarDireccionIndividual} style={{ border: "none", background: THEME.goldMain, color: "#1b1745", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontWeight: 800 }}>
                              Guardar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <p style={{ margin: "10px 0 0", fontSize: 12, color: "rgba(255,255,255,0.62)" }}>
              La fila con ★ PRINCIPAL es la que se usa por defecto en el perfil plano y en nuevos envíos.
            </p>
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                onClick={iniciarNuevaDireccion}
                disabled={dirsMerged.length >= DIRECCIONES_MAX}
                style={{
                  border: `1px solid ${THEME.goldMain}`,
                  background: "transparent",
                  color: THEME.goldMain,
                  borderRadius: 10,
                  padding: "8px 12px",
                  cursor: dirsMerged.length >= DIRECCIONES_MAX ? "not-allowed" : "pointer",
                  opacity: dirsMerged.length >= DIRECCIONES_MAX ? 0.6 : 1,
                  fontWeight: 800
                }}
              >
                Añadir nueva dirección
              </button>
            </div>
            {direccionEditandoId === NUEVA_DIRECCION_ID && formDireccion && (
              <div ref={editorDireccionRef} style={{ marginTop: 12, border: "1px solid rgba(201,162,74,0.35)", borderRadius: 12, padding: 12, background: "rgba(0,0,0,0.2)" }}>
                <div style={{ color: THEME.goldMain, fontWeight: 800, marginBottom: 8 }}>
                  Nueva dirección
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 8 }}>
                    <input value={formDireccion.calle || ""} onChange={(e) => setFormDireccion({ ...formDireccion, calle: e.target.value })} placeholder="Calle" style={{ ...inputBase }} />
                    <input value={formDireccion.numero || ""} onChange={(e) => setFormDireccion({ ...formDireccion, numero: e.target.value })} placeholder="Nº" style={{ ...inputBase }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                    <input value={formDireccion.piso || ""} onChange={(e) => setFormDireccion({ ...formDireccion, piso: e.target.value })} placeholder="Piso" style={{ ...inputBase }} />
                    <input value={formDireccion.puerta || ""} onChange={(e) => setFormDireccion({ ...formDireccion, puerta: e.target.value })} placeholder="Puerta" style={{ ...inputBase }} />
                    <input value={formDireccion.bloque || ""} onChange={(e) => setFormDireccion({ ...formDireccion, bloque: e.target.value })} placeholder="Bloque" style={{ ...inputBase }} />
                    <input value={formDireccion.escalera || ""} onChange={(e) => setFormDireccion({ ...formDireccion, escalera: e.target.value })} placeholder="Escalera" style={{ ...inputBase }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8 }}>
                    <input value={formDireccion.cp || ""} onChange={(e) => setFormDireccion({ ...formDireccion, cp: e.target.value.replace(/\D/g, "").slice(0, 5) })} placeholder="CP" style={{ ...inputBase }} />
                    <input value={formDireccion.poblacion || ""} onChange={(e) => setFormDireccion({ ...formDireccion, poblacion: e.target.value })} placeholder="Población" style={{ ...inputBase }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <input value={formDireccion.provincia || ""} onChange={(e) => setFormDireccion({ ...formDireccion, provincia: e.target.value })} placeholder="Provincia" style={{ ...inputBase }} />
                    <input value={formDireccion.pais || ""} onChange={(e) => setFormDireccion({ ...formDireccion, pais: e.target.value })} placeholder="País" style={{ ...inputBase }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
                  <button type="button" onClick={() => { setFormDireccion(null); setDireccionEditandoId(null); setDireccionEditandoClave(null); }} style={{ border: `1px solid ${THEME.goldMain}`, background: "transparent", color: THEME.goldMain, borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontWeight: 700 }}>
                    Cancelar
                  </button>
                  <button type="button" onClick={guardarDireccionIndividual} style={{ border: "none", background: THEME.goldMain, color: "#1b1745", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontWeight: 800 }}>
                    Guardar
                  </button>
                </div>
              </div>
            )}
          </section>

          <section style={{ background: "rgba(27,23,69,0.6)", border: `1px solid rgba(201,162,74,0.35)`, borderRadius: 18, padding: 16 }}>
            <h3 className="admin-page-section-heading" style={{ color: THEME.goldMain, fontSize: 22 }}>Pedidos</h3>
            <div style={{ marginBottom: 10, color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
              Total pedidos: <strong style={{ color: THEME.goldMain }}>{pedidos.length}</strong>
              {" · "}
              Importe histórico: <strong style={{ color: THEME.goldMain }}>{totalHistoricoPedidos.toFixed(2)} €</strong>
              {" · "}
              Último pedido: <strong style={{ color: THEME.goldMain }}>{ultimoPedidoFecha}</strong>
            </div>
            {pedidos.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.7)", margin: 0 }}>No hay pedidos para este cliente</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {pedidos.map((p) => (
                  <div
                    key={String(p.idPedido || "")}
                    style={{
                      padding: 14,
                      borderRadius: 14,
                      border: "1px solid rgba(201,162,74,0.25)",
                      background: "rgba(0,0,0,0.12)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ color: THEME.goldMain, fontWeight: 900 }}>
                        Nº {p.idPedido}
                      </div>
                      <div style={{ color: "white", opacity: 0.85, fontSize: 12 }}>{formatearFechaEs(p.fecha)}</div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                      <div style={{ color: "white" }}>{estadoTexto(p.estado)}</div>
                      <div style={{ color: "white", opacity: 0.9, fontWeight: 800 }}>
                        Total: {(Number(p.total || 0)).toFixed(2)} €
                      </div>
                    </div>
                    {(() => {
                      const idPed = String(p.idPedido || "").trim();
                      const pedidoCompleto = idPed ? buscarPedidoCompletoEnMap(pedidosCompletosPorNumero, idPed) : undefined;
                      let entrega = pedidoCompleto
                        ? textoDireccionVistaAdmin(pedidoCompleto).trim()
                        : String(p.direccionCompleta || "").trim();
                      if (entrega && !/\b\d{5}\b/.test(entrega) && usuarioLegacy) {
                        const desdePerfil = lineaCompletaDesdeDatosEnvio({
                          calle: usuarioLegacy.calle,
                          numero: usuarioLegacy.numero,
                          bloque: usuarioLegacy.bloque,
                          escalera: usuarioLegacy.escalera,
                          piso: usuarioLegacy.piso,
                          puerta: usuarioLegacy.puerta,
                          cp: usuarioLegacy.cp,
                          poblacion: usuarioLegacy.poblacion,
                          provincia: usuarioLegacy.provincia,
                          pais: usuarioLegacy.pais,
                          direccion: usuarioLegacy.direccion
                        });
                        if (desdePerfil && /\b\d{5}\b/.test(desdePerfil)) {
                          entrega = desdePerfil;
                        }
                      }
                      return entrega ? (
                        <div
                          style={{
                            marginTop: 10,
                            paddingTop: 10,
                            borderTop: "1px solid rgba(201,162,74,0.2)",
                            fontSize: 13,
                            lineHeight: 1.45,
                            color: "rgba(255,255,255,0.9)"
                          }}
                        >
                          <span style={{ color: THEME.goldMain, fontWeight: 800 }}>Entrega: </span>
                          {entrega}
                        </div>
                      ) : null;
                    })()}
                  </div>
                ))}
              </div>
            )}
          </section>

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button
              type="button"
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: `2px solid ${THEME.goldMain}`,
                background: "transparent",
                color: THEME.goldMain,
                cursor: usuarioLegacy ? "pointer" : "not-allowed",
                fontWeight: 900,
                fontSize: 16,
                opacity: usuarioLegacy ? 1 : 0.6
              }}
              onClick={() => {
                const telRef = normalizarTelefonoES9(
                  String(maika?.telefono || usuarioLegacy?.telefono || telParam || "")
                );
                const maikaActual = leerMaikaUsuarios().find(
                  (m) => normalizarTelefonoES9(String(m.telefono || "")) === telRef
                );

                if (!maikaActual) {
                  notificarError(mostrarNotificacion, "No se encontró el cliente en la gestión admin");
                  return;
                }

                const nombrePilaRaw = String(maikaActual.nombre || "").trim();
                const apellidosRaw = String(maikaActual.apellidos || "").trim();
                // Heurística: si en el storage "nombre" ya incluye apellidos (por migraciones previas),
                // evitamos duplicar al concatenar.
                const nombreCompleto = apellidosRaw
                  ? nombrePilaRaw.toLowerCase().includes(apellidosRaw.toLowerCase())
                    ? nombrePilaRaw
                    : `${nombrePilaRaw} ${apellidosRaw}`.trim()
                  : nombrePilaRaw;

                const usuarioParaEditar: Usuario = {
                  id: `u_${normalizarTelefonoES9(String(maikaActual.telefono || ""))}`,
                  nombre: nombreCompleto,
                  email: String(maikaActual.email || "").trim(),
                  dni: String(maikaActual.dni || "").trim(),
                  password: "",
                  passwordTemporal: false,
                  telefono: normalizarTelefonoES9(String(maikaActual.telefono || "")),
                  calle: String(maikaActual.calle || "").trim(),
                  numero: String(maikaActual.numero || "").trim(),
                  bloque: String(maikaActual.bloque || "").trim(),
                  escalera: String(maikaActual.escalera || "").trim(),
                  piso: String(maikaActual.piso || "").trim(),
                  puerta: String(maikaActual.puerta || "").trim(),
                  cp: String(maikaActual.cp || "").trim(),
                  poblacion: String(maikaActual.poblacion || "").trim(),
                  provincia: String(maikaActual.provincia || "").trim(),
                  pais: String(maikaActual.pais || "").trim(),
                  direccion:
                    construirDireccionCompleta({
                      calle: String(maikaActual.calle || "").trim(),
                      numero: String(maikaActual.numero || "").trim(),
                      bloque: String(maikaActual.bloque || "").trim(),
                      escalera: String(maikaActual.escalera || "").trim(),
                      piso: String(maikaActual.piso || "").trim(),
                      puerta: String(maikaActual.puerta || "").trim()
                    }) || "",
                  direcciones: Array.isArray(maikaActual.direcciones) ? maikaActual.direcciones : [],
                  direccionPredeterminadaId: String(maikaActual.direccionPredeterminadaId || "").trim(),
                  verificado: true
                } as Usuario;

                abrirEditorUsuario(usuarioParaEditar);
                navigate("/admin");
              }}
              disabled={!usuarioLegacy}
            >
              Editar cliente
            </button>
          </div>
        </div>
      </div>
      <ModalConfirmacion
        abierto={!!direccionAEliminarId}
        mensaje="¿Seguro que quieres eliminar esta dirección?"
        textoConfirmar="Eliminar dirección"
        textoCancelar="Cancelar"
        onConfirmar={() => {
          if (direccionAEliminarId) eliminarDireccion(direccionAEliminarId);
          setDireccionAEliminarId(null);
        }}
        onCancelar={() => setDireccionAEliminarId(null)}
      />
    </div>
  );
}

