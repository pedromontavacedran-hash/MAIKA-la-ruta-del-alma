import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import AdminPageNav from "../../components/admin/AdminPageNav";
import ModalConfirmacion from "../../ModalConfirmacion";
import { THEME } from "../../config";
import { isAdminAuthorized } from "../../utils/adminAuth";
import { fetchAdminAnaliticaApi, resetAdminAnaliticaApi, type AnaliticaResumen } from "../../services/apiAnalytics";
import { notificarError, notificarExito } from "../../utils/ui/notificaciones";
import {
  NOMBRE_ARTICULO,
  NOMBRE_FUNCION,
  NOMBRE_PROCEDENCIA,
  NOMBRE_SECCION,
  etiqueta,
  tarjetasResumen
} from "./analiticaEtiquetas";

function fechaLegible(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00`);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
}

function TablaContadores({ titulo, mapa, nombres }: { titulo: string; mapa: Record<string, number>; nombres?: Record<string, string> }) {
  const entradas = Object.entries(mapa).sort((a, b) => b[1] - a[1]);
  const max = entradas[0]?.[1] ?? 0;
  return (
    <section
      style={{
        background: THEME.bg,
        border: `2px solid rgba(212,175,55,0.35)`,
        borderRadius: 14,
        padding: 16
      }}
    >
      <h3 style={{ color: THEME.goldMain, margin: "0 0 12px", fontSize: 15 }}>{titulo}</h3>
      {entradas.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, margin: 0 }}>Sin datos todavía.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {entradas.map(([k, v]) => (
            <div key={k} style={{ display: "grid", gridTemplateColumns: "minmax(110px, 160px) 1fr 48px", gap: 8, alignItems: "center" }}>
              <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {nombres ? etiqueta(nombres, k) : k}
              </span>
              <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{ width: `${max ? Math.max(3, Math.round((v / max) * 100)) : 0}%`, height: "100%", background: THEME.goldMain }} />
              </div>
              <span style={{ color: THEME.goldMain, fontSize: 13, fontWeight: "bold", textAlign: "right" }}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function AnaliticaPage() {
  const { accesoAdmin, setPagina, mostrarNotificacion } = useApp();
  const [dias, setDias] = useState(30);
  const [datos, setDatos] = useState<AnaliticaResumen | null>(null);
  const [cargando, setCargando] = useState(true);
  const [confirmarReset, setConfirmarReset] = useState(false);
  const [reseteando, setReseteando] = useState(false);

  const [tick, setTick] = useState(0);

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    fetchAdminAnaliticaApi(dias)
      .then((r) => {
        if (vivo) setDatos(r);
      })
      .catch((e) => {
        const m = e instanceof Error ? e.message : String(e);
        notificarError(mostrarNotificacion, `❌ ${m}`);
        if (vivo) setDatos(null);
      })
      .finally(() => {
        if (vivo) setCargando(false);
      });
    return () => {
      vivo = false;
    };
  }, [dias, tick]);

  const volverDesdeAdmin = () => {
    setPagina(isAdminAuthorized() ? "admin" : "inicio");
  };

  const ejecutarReset = async () => {
    setConfirmarReset(false);
    setReseteando(true);
    try {
      await resetAdminAnaliticaApi();
      setDatos(null);
      notificarExito(mostrarNotificacion, "🗑️ Analítica reiniciada");
      const r = await fetchAdminAnaliticaApi(dias);
      setDatos(r);
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      notificarError(mostrarNotificacion, `❌ ${m}`);
    } finally {
      setReseteando(false);
    }
  };

  if (!accesoAdmin) {
    return <Navigate to="/" replace />;
  }

  const totales = datos?.totales;
  const porDia = [...(datos?.porDia ?? [])].reverse();
  const maxVistasDia = Math.max(1, ...porDia.map((d) => d.vistas));

  return (
    <div className="admin-container" style={{ maxWidth: 860, margin: "0 auto", padding: "0 16px 40px" }}>
      <AdminPageNav onVolver={volverDesdeAdmin} />
      <h2 style={{ textAlign: "center", color: THEME.goldMain, marginBottom: 8 }}>📈 ANALÍTICA</h2>
      <p style={{ textAlign: "center", color: "rgba(255,255,255,0.85)", marginBottom: 16, fontSize: 13 }}>
        Estadística propia y agregada por día. Las «sesiones» son sesiones de navegador, no personas:
        no hay identificadores persistentes ni perfiles.
      </p>

      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20 }}>
        {[7, 30, 90].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setDias(n)}
            style={{
              padding: "8px 16px",
              borderRadius: 20,
              border: `2px solid ${THEME.goldMain}`,
              background: dias === n ? THEME.goldMain : "transparent",
              color: dias === n ? "#1b1745" : THEME.goldMain,
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 13
            }}
          >
            {n} días
          </button>
        ))}
        <button
          type="button"
          disabled={cargando}
          onClick={() => setTick((n) => n + 1)}
          style={{
            padding: "8px 16px",
            borderRadius: 20,
            border: `2px solid ${THEME.goldMain}`,
            background: "transparent",
            color: THEME.goldMain,
            cursor: cargando ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: 13,
            opacity: cargando ? 0.6 : 1
          }}
        >
          ↻ Actualizar
        </button>
        <button
          type="button"
          disabled={reseteando}
          onClick={() => setConfirmarReset(true)}
          style={{
            padding: "8px 16px",
            borderRadius: 20,
            border: "1px solid rgba(255,68,68,0.6)",
            background: "rgba(255,68,68,0.1)",
            color: "#ff8080",
            cursor: reseteando ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: 13,
            opacity: reseteando ? 0.6 : 1
          }}
        >
          🗑️ Reiniciar datos
        </button>
      </div>

      {cargando ? (
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.7)" }}>Cargando…</p>
      ) : !totales ? (
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.7)" }}>Sin datos.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            {tarjetasResumen(totales).map((c) => (
              <div
                key={c.label}
                style={{
                  background: THEME.bg,
                  border: `2px solid rgba(212,175,55,0.35)`,
                  borderRadius: 14,
                  padding: "12px 14px",
                  textAlign: "center"
                }}
              >
                <div style={{ color: THEME.goldMain, fontSize: 20, fontWeight: "bold" }}>{c.valor}</div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{c.label}</div>
              </div>
            ))}
          </div>

          <section
            style={{
              background: THEME.bg,
              border: `2px solid rgba(212,175,55,0.35)`,
              borderRadius: 14,
              padding: 16
            }}
          >
            <h3 style={{ color: THEME.goldMain, margin: "0 0 12px", fontSize: 15 }}>Vistas por día</h3>
            {porDia.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, margin: 0 }}>Sin datos todavía.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {porDia.map((d) => (
                  <div key={d.fecha} style={{ display: "grid", gridTemplateColumns: "92px 1fr 110px", gap: 8, alignItems: "center" }}>
                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{fechaLegible(d.fecha)}</span>
                    <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                      <div style={{ width: `${Math.round((d.vistas / maxVistasDia) * 100)}%`, height: "100%", background: THEME.goldMain }} />
                    </div>
                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, textAlign: "right" }}>
                      {d.vistas} vistas · {d.sesiones} ses.
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            <TablaContadores titulo="Secciones más visitadas" mapa={totales.secciones} nombres={NOMBRE_SECCION} />
            <TablaContadores titulo="Páginas de entrada" mapa={totales.entradas} nombres={NOMBRE_SECCION} />
            <TablaContadores titulo="Páginas de salida" mapa={totales.salidas} nombres={NOMBRE_SECCION} />
            <TablaContadores titulo="Procedencia" mapa={totales.procedencia} nombres={NOMBRE_PROCEDENCIA} />
            <TablaContadores titulo="Dispositivo" mapa={totales.dispositivo} />
            <TablaContadores titulo="Uso de funcionalidades" mapa={totales.funciones} nombres={NOMBRE_FUNCION} />
            <TablaContadores titulo="Artículos más vistos" mapa={totales.articulos} nombres={NOMBRE_ARTICULO} />
          </div>
        </div>
      )}

      <ModalConfirmacion
        abierto={confirmarReset}
        mensaje="¿Reiniciar toda la estadística? Se borrarán todos los datos agregados y no se puede deshacer."
        onConfirmar={() => void ejecutarReset()}
        onCancelar={() => setConfirmarReset(false)}
        textoConfirmar="Sí, reiniciar"
      />
    </div>
  );
}
