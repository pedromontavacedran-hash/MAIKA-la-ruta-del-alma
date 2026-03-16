import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import type { Pedido } from "../types";

const MESES_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

/** Parsea fecha del pedido (DD/MM/YYYY o DD/MM/YYYY, HH:MM). Devuelve año y mes (1-12). */
function añoMesDePedido(p: Pedido): { año: number; mes: number } | null {
  if (!p.fecha) return null;
  const s = p.fecha.trim();
  const match = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (match) {
    const dia = parseInt(match[1], 10);
    const mes = parseInt(match[2], 10);
    const año = parseInt(match[3], 10);
    const y = año < 100 ? 2000 + año : año;
    if (mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31) return { año: y, mes };
  }
  const d = new Date(p.fecha);
  if (!Number.isNaN(d.getTime())) return { año: d.getFullYear(), mes: d.getMonth() + 1 };
  return null;
}

function escaparCsv(celda: string): string {
  const s = String(celda ?? "").replace(/"/g, '""');
  return /[;"\n\r]/.test(s) ? `"${s}"` : s;
}

function descargarCSV(pedidos: Pedido[], nombrePeriodo: string) {
  const cabecera = "Fecha;Nº pedido;Cliente;Email;Total (€)";
  const filas = pedidos.map((p) =>
    [
      escaparCsv(p.fecha),
      escaparCsv(p.numero),
      escaparCsv(p.cliente?.nombreApellidos),
      escaparCsv(p.cliente?.email),
      (p.total ?? 0).toFixed(2).replace(".", ",")
    ].join(";")
  );
  const csv = "\uFEFF" + [cabecera, ...filas].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ventas_${nombrePeriodo.replace(/\s+/g, "_")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ContabilidadPage() {
  const { pedidos, setPedidoFacturaAbierto, accesoAdmin, setPagina } = useApp();

  const [añoSeleccionado, setAñoSeleccionado] = useState<string>(""); // "2026"
  const [mesSeleccionado, setMesSeleccionado] = useState<string>(""); // "" = todo el año, "1".."12" = mes

  const añosDisponibles = useMemo(() => {
    const set = new Set<number>();
    pedidos.forEach((p) => {
      const ym = añoMesDePedido(p);
      if (ym) set.add(ym.año);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [pedidos]);

  const pedidosFiltrados = useMemo(() => {
    if (!añoSeleccionado) return [];
    const año = parseInt(añoSeleccionado, 10);
    return pedidos
      .filter((p) => {
        const ym = añoMesDePedido(p);
        if (!ym || ym.año !== año) return false;
        if (mesSeleccionado) return ym.mes === parseInt(mesSeleccionado, 10);
        return true;
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [pedidos, añoSeleccionado, mesSeleccionado]);

  if (!accesoAdmin) {
    return (
      <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center", padding: 40 }}>
        <p style={{ color: "#C9A24A", marginBottom: 20 }}>Solo administradores pueden acceder a Contabilidad.</p>
        <button
          type="button"
          onClick={() => setPagina("admin")}
          style={{
            background: "#C9A24A",
            color: "#1b1745",
            border: "2px solid #C9A24A",
            padding: "12px 24px",
            borderRadius: 12,
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 16
          }}
        >
          ← Volver al panel
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px" }}>
      <h2 style={{ textAlign: "center", color: "#C9A24A", marginBottom: 8 }}>📅 CONTABILIDAD</h2>
      <p style={{ textAlign: "center", color: "rgba(255,255,255,0.85)", marginBottom: 24, fontSize: 14 }}>
        Resumen por año y mes para llevar las ventas
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div style={{ flex: "1 1 140px", minWidth: 120 }}>
          <label style={{ display: "block", color: "#C9A24A", marginBottom: 6, fontSize: 14 }}>Año</label>
          <select
            value={añoSeleccionado}
            onChange={(e) => {
              setAñoSeleccionado(e.target.value);
              setMesSeleccionado("");
            }}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: "2px solid gold",
              background: "#0B0B0D",
              color: "white",
              fontSize: 16
            }}
          >
            <option value="">-- Elegir año --</option>
            {añosDisponibles.map((a) => (
              <option key={a} value={String(a)}>{a}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: "1 1 180px", minWidth: 140 }}>
          <label style={{ display: "block", color: "#C9A24A", marginBottom: 6, fontSize: 14 }}>Mes</label>
          <select
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(e.target.value)}
            disabled={!añoSeleccionado}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: "2px solid gold",
              background: "#0B0B0D",
              color: "white",
              fontSize: 16,
              opacity: añoSeleccionado ? 1 : 0.7
            }}
          >
            <option value="">Todo el año</option>
            {MESES_ES.map((nombre, i) => (
              <option key={i} value={String(i + 1)}>{nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {añoSeleccionado && (() => {
        const lista = pedidosFiltrados;
        const n = lista.length;
        const total = n === 0 ? 0 : lista.reduce((s, p) => s + (p.total ?? 0), 0);
        return (
          <div key={`contabilidad-${añoSeleccionado}-${mesSeleccionado}`}>
            <div style={{
              background: "#0B0B0D",
              border: "2px solid gold",
              borderRadius: 12,
              padding: 16,
              marginBottom: 20
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <strong style={{ color: "#C9A24A", fontSize: 18 }}>
                  {mesSeleccionado
                    ? `${MESES_ES[parseInt(mesSeleccionado, 10) - 1]} ${añoSeleccionado}`
                    : `Año ${añoSeleccionado} (todo el año)`}
                </strong>
                <div style={{ color: "white", fontSize: 16 }}>
                  <span style={{ marginRight: 16 }}>{n} pedidos</span>
                  <span style={{ color: "#C9A24A", fontWeight: "bold" }}>Total: {total.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            <div style={{
              background: "#0B0B0D",
              border: "2px solid gold",
              borderRadius: 12,
              overflow: "hidden",
              marginBottom: 20
            }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", color: "#fff" }}>
                  <thead>
                    <tr style={{ background: "#0B0B0D", borderBottom: "2px solid #C9A24A" }}>
                      <th style={{ padding: "12px 10px", textAlign: "left", color: "#C9A24A" }}>Fecha</th>
                      <th style={{ padding: "12px 10px", textAlign: "left", color: "#C9A24A" }}>Nº pedido</th>
                      <th style={{ padding: "12px 10px", textAlign: "left", color: "#C9A24A" }}>Cliente</th>
                      <th style={{ padding: "12px 10px", textAlign: "right", color: "#C9A24A" }}>Total</th>
                      <th style={{ padding: "12px 10px", width: 100, color: "#C9A24A" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {n === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: 24, textAlign: "center", color: "rgba(255,255,255,0.7)" }}>
                          No hay pedidos en este periodo
                        </td>
                      </tr>
                    ) : (
                      lista.map((p, idx) => (
                      <tr key={`${p.numero}-${idx}`} style={{ borderBottom: "1px solid rgba(212,175,55,0.3)" }}>
                        <td style={{ padding: "10px" }}>{p.fecha}</td>
                        <td style={{ padding: "10px", fontWeight: "bold", color: "#C9A24A" }}>{p.numero}</td>
                        <td style={{ padding: "10px" }}>{p.cliente?.nombreApellidos ?? "—"}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>{p.total?.toFixed(2)} €</td>
                        <td style={{ padding: "8px" }}>
                          <button
                            type="button"
                            onClick={() => setPedidoFacturaAbierto(p)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 8,
                              border: "1px solid gold",
                              background: "rgba(212,175,55,0.15)",
                              color: "#C9A24A",
                              cursor: "pointer",
                              fontWeight: "bold",
                              fontSize: 12
                            }}
                          >
                            Ver factura
                          </button>
                        </td>
                      </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
              <strong style={{ color: "#C9A24A", fontSize: 18 }}>Total del periodo: {total.toFixed(2)} €</strong>
              <button
                type="button"
                onClick={() => {
                  const nombre = mesSeleccionado
                    ? `${MESES_ES[parseInt(mesSeleccionado, 10) - 1]} ${añoSeleccionado}`
                    : `Año ${añoSeleccionado}`;
                  descargarCSV(lista, nombre);
                }}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: "2px solid gold",
                  background: "rgba(212,175,55,0.2)",
                  color: "#C9A24A",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: 14
                }}
              >
                📥 Exportar (CSV)
              </button>
            </div>
          </div>
        );
      })()}

      <div style={{ textAlign: "center" }}>
        <button
          type="button"
          onClick={() => setPagina("admin")}
          style={{
            background: "#C9A24A",
            color: "#1b1745",
            border: "2px solid #C9A24A",
            padding: "12px 24px",
            borderRadius: 12,
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 16
          }}
        >
          ← Volver al panel
        </button>
      </div>
    </div>
  );
}
