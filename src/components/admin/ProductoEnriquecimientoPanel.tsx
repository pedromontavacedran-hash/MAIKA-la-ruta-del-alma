import { useEffect, useMemo, useState } from "react";
import type {
  CampoEnriquecimientoProducto,
  DatoEnriquecidoProducto,
  Producto,
  TipoFuenteProducto
} from "../../types";
import { THEME } from "../../config";
import {
  patchAdminEnriquecimientoCampoApi,
  postAdminEnriquecerProductoApi
} from "../../services/apiAdminProductos";

const CAMPOS_ORDEN: CampoEnriquecimientoProducto[] = [
  "nombre",
  "marca",
  "referencia",
  "sku",
  "ean",
  "peso",
  "cantidad",
  "formato",
  "aroma",
  "origen",
  "fabricante",
  "tipoProducto",
  "ingredientes",
  "dimensiones",
  "duracionAproximada",
  "descripcionProveedor",
  "caracteristicas",
  "modoUsoProveedor",
  "advertencias",
  "imagenes",
  "codigoHsTaric"
];

const LABELS: Record<CampoEnriquecimientoProducto, string> = {
  nombre: "Nombre",
  marca: "Marca",
  referencia: "Referencia",
  sku: "SKU",
  ean: "EAN / GTIN",
  peso: "Peso",
  cantidad: "Contenido",
  formato: "Formato",
  aroma: "Aroma",
  origen: "Origen",
  fabricante: "Fabricante",
  tipoProducto: "Tipo de producto",
  ingredientes: "Ingredientes / composición",
  dimensiones: "Dimensiones",
  duracionAproximada: "Duración aprox.",
  descripcionProveedor: "Descripción (proveedor)",
  caracteristicas: "Características",
  modoUsoProveedor: "Modo de uso (proveedor)",
  advertencias: "Advertencias",
  imagenes: "Imágenes",
  codigoHsTaric: "HS / TARIC"
};

const LABEL_ESTADO: Record<string, string> = {
  found: "Encontrado",
  conflict: "Conflicto",
  accepted: "Aceptado",
  rejected: "Rechazado",
  not_found: "Sin datos"
};

const LABEL_ESTADO_GLOBAL: Record<string, string> = {
  pending: "Pendiente",
  imported: "Importado",
  needs_review: "Requiere revisión",
  verified: "Verificado"
};

const OPCIONES_TIPO_FUENTE: { value: TipoFuenteProducto; label: string }[] = [
  { value: "supplier", label: "Proveedor / distribuidor" },
  { value: "manufacturer", label: "Fabricante" },
  { value: "product_label", label: "Etiqueta del producto" },
  { value: "retailer", label: "Minorista" },
  { value: "other", label: "Otra" }
];

function textoValor(value: string | string[] | null | undefined): string {
  if (Array.isArray(value)) return value.join("; ");
  return String(value ?? "").trim();
}

function hostDe(url: string | null | undefined): string {
  if (!url) return "—";
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function colorEstado(status: string): string {
  switch (status) {
    case "accepted":
      return "#7be3a4";
    case "conflict":
      return "#ffcc80";
    case "rejected":
      return "#ff8a80";
    case "found":
      return "#9ec9ff";
    default:
      return "rgba(255,255,255,0.55)";
  }
}

/** Categoría visual de un campo para la vista de resumen. */
type CategoriaCampo = "alta" | "revisar" | "conflicto" | "sin_info";

function categoriaDe(datum: DatoEnriquecidoProducto | undefined): CategoriaCampo {
  if (!datum || datum.status === "not_found") return "sin_info";
  if (datum.status === "conflict" || datum.hasContradiction) return "conflicto";
  if (datum.status === "accepted") return "alta";
  if (datum.status === "rejected") return "sin_info";
  // found
  if (datum.confidence === "high") return "alta";
  return "revisar";
}

const CATEGORIA_INFO: Record<CategoriaCampo, { emoji: string; label: string; color: string }> = {
  alta: { emoji: "🟢", label: "Alta confianza", color: "#7be3a4" },
  revisar: { emoji: "🟡", label: "Revisar", color: "#ffcc80" },
  conflicto: { emoji: "🔴", label: "Conflictos", color: "#ff8a80" },
  sin_info: { emoji: "⚪", label: "Sin información", color: "rgba(255,255,255,0.45)" }
};

/** Cuenta fuentes únicas que aportan el dato (valor principal + alternativas). */
function numFuentes(datum: DatoEnriquecidoProducto | undefined): number {
  if (!datum || datum.status === "not_found") return 0;
  const fuentes = new Set<string>();
  if (datum.source) fuentes.add(datum.source);
  for (const a of datum.alternatives ?? []) {
    if (a?.source) fuentes.add(a.source);
  }
  return fuentes.size;
}

export interface ProductoEnriquecimientoPanelProps {
  producto: Producto | undefined;
  /** Tras cada acción: el padre recarga el catálogo admin (aplicarCatalogoActivoEnEstado). */
  onProductoActualizado: () => void | Promise<void>;
  mostrarNotificacion: (msg: string, tipo: "normal" | "exito" | "error") => void;
}

/**
 * Revisión humana del enriquecimiento automático: importar desde URL/EAN y
 * aceptar / corregir / rechazar cada campo. Nada se muestra en tienda hasta aceptar.
 */
export default function ProductoEnriquecimientoPanel({
  producto,
  onProductoActualizado,
  mostrarNotificacion
}: ProductoEnriquecimientoPanelProps) {
  const enr = producto?.enriquecimiento;
  const [url, setUrl] = useState("");
  const [ean, setEan] = useState("");
  const [marca, setMarca] = useState("");
  const [sourceType, setSourceType] = useState<TipoFuenteProducto>("supplier");
  const [busy, setBusy] = useState(false);
  const [campoCorrigiendo, setCampoCorrigiendo] = useState<CampoEnriquecimientoProducto | null>(null);
  const [valorCorreccion, setValorCorreccion] = useState("");
  const [eleccionConflicto, setEleccionConflicto] = useState<Record<string, string>>({});

  const productoId = producto?.id;
  useEffect(() => {
    setUrl(producto?.urlOrigen ?? producto?.enriquecimiento?.input?.url ?? "");
    setEan(producto?.ean ?? producto?.enriquecimiento?.input?.ean ?? "");
    setMarca(producto?.marca ?? producto?.enriquecimiento?.input?.marca ?? "");
    setCampoCorrigiendo(null);
    setValorCorreccion("");
    setEleccionConflicto({});
  }, [productoId]);

  const resumen = useMemo(() => {
    const counts: Record<CategoriaCampo, number> = { alta: 0, revisar: 0, conflicto: 0, sin_info: 0 };
    for (const campo of CAMPOS_ORDEN) {
      const datum = enr?.fields?.[campo];
      counts[categoriaDe(datum)] += 1;
    }
    return counts;
  }, [enr]);

  if (!producto) return null;

  const lanzarImportacion = () => {
    void (async () => {
      setBusy(true);
      try {
        const p = await postAdminEnriquecerProductoApi(producto.id, {
          url: url.trim() || undefined,
          ean: ean.trim() || undefined,
          marca: marca.trim() || undefined,
          sourceType
        });
        await onProductoActualizado();
        const err = p.enriquecimiento?.fetchError;
        if (err) {
          mostrarNotificacion(`Importación incompleta: ${err}`, "error");
        } else {
          const fields = Object.values(p.enriquecimiento?.fields ?? {});
          const n = fields.filter((f) => f?.status === "found" || f?.status === "conflict").length;
          mostrarNotificacion(`Datos importados: ${n} campos con candidatos. Revisa y acepta los correctos.`, "exito");
        }
      } catch (e) {
        mostrarNotificacion(e instanceof Error ? e.message : "No se pudo importar", "error");
      } finally {
        setBusy(false);
      }
    })();
  };

  const accion = (
    campo: CampoEnriquecimientoProducto,
    body: { action: "accept" | "reject" | "correct"; value?: unknown; sourceUrl?: string }
  ) => {
    void (async () => {
      setBusy(true);
      try {
        await patchAdminEnriquecimientoCampoApi(producto.id, campo, body);
        await onProductoActualizado();
        setCampoCorrigiendo(null);
        setValorCorreccion("");
      } catch (e) {
        mostrarNotificacion(e instanceof Error ? e.message : "No se pudo actualizar el dato", "error");
      } finally {
        setBusy(false);
      }
    })();
  };

  const renderAcciones = (campo: CampoEnriquecimientoProducto, datum: DatoEnriquecidoProducto) => {
    if (campoCorrigiendo === campo) {
      return (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <input
            type="text"
            className="categoria-text-input"
            style={{ flex: "1 1 180px", minWidth: 0, marginBottom: 0 }}
            value={valorCorreccion}
            onChange={(e) => setValorCorreccion(e.target.value)}
            placeholder="Valor corregido"
          />
          <button
            type="button"
            className="editar-productos-acciones__btn editar-productos-acciones__btn--primary"
            disabled={busy || !valorCorreccion.trim()}
            onClick={() => accion(campo, { action: "correct", value: valorCorreccion.trim() })}
          >
            Guardar
          </button>
          <button
            type="button"
            className="editar-productos-acciones__btn editar-productos-acciones__btn--ghost"
            onClick={() => {
              setCampoCorrigiendo(null);
              setValorCorreccion("");
            }}
          >
            Cancelar
          </button>
        </div>
      );
    }
    if (datum.status === "conflict") {
      const alternativas = datum.alternatives ?? [];
      const sel = eleccionConflicto[campo] ?? "";
      return (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <select
            className="categoria-select"
            style={{ flex: "1 1 220px", minWidth: 0 }}
            value={sel}
            onChange={(e) => setEleccionConflicto((prev) => ({ ...prev, [campo]: e.target.value }))}
          >
            <option value="">— Elegir valor —</option>
            {alternativas.map((a, i) => (
              <option key={`${a.source}-${i}`} value={a.source}>
                {textoValor(a.value)} — {hostDe(a.source)} ({a.confidence})
              </option>
            ))}
          </select>
          <button
            type="button"
            className="editar-productos-acciones__btn editar-productos-acciones__btn--primary"
            disabled={busy || !sel}
            onClick={() => accion(campo, { action: "accept", sourceUrl: sel })}
          >
            Aceptar
          </button>
          <button
            type="button"
            className="editar-productos-acciones__btn editar-productos-acciones__btn--ghost"
            onClick={() => {
              setCampoCorrigiendo(campo);
              setValorCorreccion("");
            }}
          >
            Corregir
          </button>
        </div>
      );
    }
    return (
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {datum.status === "found" || datum.status === "rejected" ? (
          <button
            type="button"
            className="editar-productos-acciones__btn editar-productos-acciones__btn--primary"
            disabled={busy || datum.status === "rejected"}
            title={datum.status === "rejected" ? "Ya rechazado: corrígelo para usarlo" : undefined}
            onClick={() => accion(campo, { action: "accept" })}
          >
            Aceptar
          </button>
        ) : null}
        <button
          type="button"
          className="editar-productos-acciones__btn editar-productos-acciones__btn--ghost"
          disabled={busy}
          onClick={() => {
            setCampoCorrigiendo(campo);
            setValorCorreccion(textoValor(datum.value));
          }}
        >
          Corregir
        </button>
        {datum.status === "found" || datum.status === "accepted" ? (
          <button
            type="button"
            className="editar-productos-acciones__btn editar-productos-acciones__btn--ghost"
            disabled={busy}
            onClick={() => accion(campo, { action: "reject" })}
          >
            Rechazar
          </button>
        ) : null}
      </div>
    );
  };

  return (
    <section className="editar-productos-seccion" style={{ marginTop: 18 }}>
      <div className="editar-productos-seccion__titulo">Enriquecimiento automático</div>
      <p style={{ fontSize: 12, opacity: 0.75, margin: "0 0 10px", lineHeight: 1.4 }}>
        Importa datos desde la página del proveedor/fabricante. Nada se publica hasta que aceptes cada campo.
      </p>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <input
          type="url"
          className="categoria-text-input"
          style={{ marginBottom: 0, minWidth: 0 }}
          placeholder="URL de origen (proveedor/fabricante)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <input
          type="text"
          className="categoria-text-input"
          style={{ marginBottom: 0, minWidth: 0 }}
          placeholder="EAN / GTIN"
          value={ean}
          onChange={(e) => setEan(e.target.value)}
        />
        <input
          type="text"
          className="categoria-text-input"
          style={{ marginBottom: 0, minWidth: 0 }}
          placeholder="Marca"
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
        />
        <select
          className="categoria-select"
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value as TipoFuenteProducto)}
        >
          {OPCIONES_TIPO_FUENTE.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          className="editar-productos-acciones__btn editar-productos-acciones__btn--primary"
          disabled={busy}
          onClick={lanzarImportacion}
        >
          {busy ? "Consultando fuente…" : "Enriquecer desde la fuente"}
        </button>
        {enr?.status ? (
          <span style={{ fontSize: 12, color: colorEstado(enr.status === "verified" ? "accepted" : enr.status === "needs_review" ? "conflict" : enr.status === "imported" ? "found" : "not_found") }}>
            Estado: {LABEL_ESTADO_GLOBAL[enr.status] ?? enr.status}
            {enr.checkedAt ? ` · ${new Date(enr.checkedAt).toLocaleString("es-ES")}` : ""}
          </span>
        ) : null}
      </div>
      {enr?.fetchError ? (
        <p style={{ fontSize: 12, color: "#ffcc80", margin: "8px 0 0" }}>Último error de consulta: {enr.fetchError}</p>
      ) : null}

      {/* Vista de resumen */}
      {enr?.fields ? (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12, marginBottom: 8 }}>
          {(["alta", "revisar", "conflicto", "sin_info"] as CategoriaCampo[]).map((cat) => {
            const info = CATEGORIA_INFO[cat];
            const count = resumen[cat];
            return (
              <div
                key={cat}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 10px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.06)",
                  border: `1px solid ${info.color}33`,
                  fontSize: 12
                }}
              >
                <span>{info.emoji}</span>
                <span style={{ color: info.color, fontWeight: 600 }}>{info.label}</span>
                <span style={{ opacity: 0.7 }}>{count}</span>
              </div>
            );
          })}
        </div>
      ) : null}

      {enr?.fields ? (
        <div style={{ overflowX: "auto", marginTop: 4 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ textAlign: "left", color: THEME.goldMain }}>
                <th style={{ padding: "4px 6px" }}>Campo</th>
                <th style={{ padding: "4px 6px" }}>Valor propuesto</th>
                <th style={{ padding: "4px 6px" }}>Confianza</th>
                <th style={{ padding: "4px 6px", textAlign: "center" }}>Nº fuentes</th>
                <th style={{ padding: "4px 6px", textAlign: "center" }}>Conflicto</th>
                <th style={{ padding: "4px 6px" }}>Estado</th>
                <th style={{ padding: "4px 6px" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {CAMPOS_ORDEN.map((campo) => {
                const datum = enr.fields?.[campo];
                if (!datum) return null;
                const valor = textoValor(datum.value);
                const cat = categoriaDe(datum);
                const nFuentes = numFuentes(datum);
                const esRecomendado = cat === "alta" && datum.status === "found" && datum.confidence === "high";
                return (
                  <tr key={campo} style={{ borderTop: "1px solid rgba(255,255,255,0.08)", verticalAlign: "top" }}>
                    <td style={{ padding: "6px" }}>
                      {LABELS[campo]}
                      {esRecomendado ? (
                        <span style={{ display: "block", fontSize: 10, color: "#7be3a4", marginTop: 2 }}>✓ Recomendado</span>
                      ) : null}
                      {datum.correctedByAdmin ? (
                        <span style={{ display: "block", fontSize: 10, color: "#9ec9ff", marginTop: 2 }}>✎ Corregido por admin</span>
                      ) : null}
                    </td>
                    <td style={{ padding: "6px", maxWidth: 220, overflowWrap: "break-word" }}>
                      {valor || <span style={{ opacity: 0.45 }}>—</span>}
                      {datum.status === "conflict" && Array.isArray(datum.alternatives) ? (
                        <div style={{ opacity: 0.65, marginTop: 2 }}>
                          {datum.alternatives.length} valores distintos entre fuentes
                        </div>
                      ) : null}
                      {datum.hasContradiction && datum.status === "accepted" ? (
                        <div style={{ color: "#ffcc80", fontSize: 10, marginTop: 2 }}>
                          ⚠ Una fuente posterior contradice este valor aceptado
                        </div>
                      ) : null}
                      {datum.contentType === "commercial" ? (
                        <div style={{ opacity: 0.55, fontStyle: "italic", marginTop: 2 }}>texto comercial</div>
                      ) : null}
                    </td>
                    <td style={{ padding: "6px" }}>{datum.confidence ?? "—"}</td>
                    <td style={{ padding: "6px", textAlign: "center" }}>{nFuentes > 0 ? nFuentes : "—"}</td>
                    <td style={{ padding: "6px", textAlign: "center" }}>
                      {datum.status === "conflict" || datum.hasContradiction ? (
                        <span style={{ color: "#ff8a80", fontWeight: "bold" }}>Sí</span>
                      ) : (
                        <span style={{ opacity: 0.4 }}>No</span>
                      )}
                    </td>
                    <td style={{ padding: "6px", color: colorEstado(datum.status) }}>
                      {LABEL_ESTADO[datum.status] ?? datum.status}
                    </td>
                    <td style={{ padding: "6px" }}>{renderAcciones(campo, datum)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
