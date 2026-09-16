import type { RefObject } from "react";
import type { IntencionProducto, SubcategoriaEntrada } from "../../../types";
import { INTENCIONES_OPCIONES } from "../../../types";
import { THEME } from "../../../config";

const inputModalStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 10,
  border: `2px solid ${THEME.goldMain}`,
  background: THEME.bg,
  color: THEME.goldMain,
  fontSize: 17,
  boxSizing: "border-box",
  minHeight: 48
};

export interface InventarioModalNuevoProps {
  subcategorias: SubcategoriaEntrada[];
  editarNombre: string;
  setEditarNombre: (v: string) => void;
  editarCoste: string;
  setEditarCoste: (v: string) => void;
  editarPrecio: string;
  setEditarPrecio: (v: string) => void;
  editarDescuento: string;
  setEditarDescuento: (v: string) => void;
  editarStock: string;
  setEditarStock: (v: string) => void;
  editarIntencion: IntencionProducto | "";
  setEditarIntencion: (v: IntencionProducto | "") => void;
  editarParaQueSirve: string;
  setEditarParaQueSirve: (v: string) => void;
  editarComoUsar: string;
  setEditarComoUsar: (v: string) => void;
  nuevoSubcategoria: string;
  setNuevoSubcategoria: (v: string) => void;
  refNombre: RefObject<HTMLInputElement | null>;
  refCoste: RefObject<HTMLInputElement | null>;
  refPrecio: RefObject<HTMLInputElement | null>;
  refStock: RefObject<HTMLInputElement | null>;
  onCancelar: () => void;
  onCrear: () => void;
}

/** Modal «Nuevo producto» del inventario: nombre, coste, precio, descuento, stock, subcategoría, intención. */
export default function InventarioModalNuevo({
  subcategorias,
  editarNombre,
  setEditarNombre,
  editarCoste,
  setEditarCoste,
  editarPrecio,
  setEditarPrecio,
  editarDescuento,
  setEditarDescuento,
  editarStock,
  setEditarStock,
  editarIntencion,
  setEditarIntencion,
  editarParaQueSirve,
  setEditarParaQueSirve,
  editarComoUsar,
  setEditarComoUsar,
  nuevoSubcategoria,
  setNuevoSubcategoria,
  refNombre,
  refCoste,
  refPrecio,
  refStock,
  onCancelar,
  onCrear
}: InventarioModalNuevoProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20
      }}
      onClick={onCancelar}
    >
      <div
        style={{
          background: THEME.bg,
          border: `2px solid ${THEME.goldMain}`,
          borderRadius: 20,
          padding: 32,
          maxWidth: 520,
          width: "100%"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ color: THEME.goldMain, fontWeight: "bold", marginBottom: 16, fontSize: 22 }}>Nuevo producto</div>

        <label style={{ display: "block", color: THEME.goldMain, marginBottom: 6, fontSize: 16 }}>Producto</label>
        <input
          ref={refNombre}
          type="text"
          value={editarNombre}
          onChange={(e) => setEditarNombre(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              refCoste.current?.focus();
            }
          }}
          placeholder="Nombre del producto"
          style={inputModalStyle}
          autoFocus
        />

        <label style={{ display: "block", color: THEME.goldMain, marginBottom: 6, marginTop: 14, fontSize: 16 }}>Precio coste (IVA incl.) €</label>
        <input
          ref={refCoste}
          type="number"
          min={0}
          step={0.01}
          value={editarCoste}
          onChange={(e) => setEditarCoste(e.target.value.replace(",", "."))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              refPrecio.current?.focus();
            }
          }}
          style={inputModalStyle}
        />

        <label style={{ display: "block", color: THEME.goldMain, marginBottom: 6, marginTop: 14, fontSize: 16 }}>Precio venta (IVA incl.) €</label>
        <input
          ref={refPrecio}
          type="number"
          min={0}
          step={0.01}
          value={editarPrecio}
          onChange={(e) => setEditarPrecio(e.target.value.replace(",", "."))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              refStock.current?.focus();
            }
          }}
          style={inputModalStyle}
        />

        <label style={{ display: "block", color: THEME.goldMain, marginBottom: 6, marginTop: 14, fontSize: 16 }}>Descuento % (0-100, opcional)</label>
        <input
          type="number"
          min={0}
          max={100}
          step={1}
          placeholder="0"
          value={editarDescuento}
          onChange={(e) => setEditarDescuento(e.target.value.replace(",", "."))}
          style={inputModalStyle}
        />

        <label style={{ display: "block", color: THEME.goldMain, marginBottom: 6, marginTop: 14, fontSize: 16 }}>Existencias</label>
        <input
          ref={refStock}
          type="number"
          min={0}
          value={editarStock}
          onChange={(e) => setEditarStock(e.target.value.replace(/[^\d]/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onCrear();
            }
          }}
          style={inputModalStyle}
        />

        <label style={{ display: "block", color: THEME.goldMain, marginBottom: 6, marginTop: 14, fontSize: 16 }}>Subcategoría</label>
        <select
          value={nuevoSubcategoria}
          onChange={(e) => setNuevoSubcategoria(e.target.value)}
          style={inputModalStyle}
        >
          <option value="">Sin subcategoría</option>
          {subcategorias.map((s) => (
            <option key={s.id} value={s.id}>
              {s.padreSubcategoriaId ? `↳ ${s.nombre}` : s.nombre}
            </option>
          ))}
        </select>

        <label style={{ display: "block", color: THEME.goldMain, marginBottom: 6, marginTop: 14, fontSize: 16 }}>Intención</label>
        <select
          value={editarIntencion}
          onChange={(e) => setEditarIntencion((e.target.value || "") as IntencionProducto | "")}
          style={inputModalStyle}
        >
          {INTENCIONES_OPCIONES.map((opt) => (
            <option key={opt.value || "vacio"} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <label style={{ display: "block", color: THEME.goldMain, marginBottom: 6, marginTop: 14, fontSize: 16 }}>Para qué sirve (opcional)</label>
        <input
          type="text"
          value={editarParaQueSirve}
          onChange={(e) => setEditarParaQueSirve(e.target.value)}
          placeholder="Ej: Protección del hogar"
          style={inputModalStyle}
        />

        <label style={{ display: "block", color: THEME.goldMain, marginBottom: 6, marginTop: 14, fontSize: 16 }}>Cómo usarlo (opcional)</label>
        <textarea
          value={editarComoUsar}
          onChange={(e) => setEditarComoUsar(e.target.value)}
          placeholder="Ej: Encender en luna creciente..."
          rows={3}
          style={{ ...inputModalStyle, resize: "vertical", minHeight: 72 }}
        />

        <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
          <button
            type="button"
            onClick={onCancelar}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 8,
              border: `2px solid ${THEME.goldMain}`,
              background: "transparent",
              color: THEME.goldMain,
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onCrear}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 8,
              border: "none",
              background: THEME.goldMain,
              color: "#1b1745",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
}
