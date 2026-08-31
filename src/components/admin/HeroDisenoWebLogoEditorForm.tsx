import type { ChangeEvent, RefObject } from "react";
import { THEME } from "../../config";
import type { HeroLogoConfig } from "../../utils/heroLogoConfig";

export type HeroDisenoWebLogoEditorFormProps = {
  heroLogoEdicion: HeroLogoConfig;
  persistirHeroLogoEnVivo: (patch: Partial<HeroLogoConfig>) => void;
  inputHeroLogoRef: RefObject<HTMLInputElement | null>;
  onChangeHeroLogoFile: (e: ChangeEvent<HTMLInputElement>) => void;
  heroLogoNombreArchivo: string;
  onAbrirPreviewInicio: () => void;
  onAplicarCambios: () => void;
  /** Si true, no se muestra el enlace «Ver inicio — pantalla completa» (p. ej. dentro de Hero diseño web completo). */
  ocultarVistaPreviaInicio?: boolean;
};

/** Formulario «Logo dentro del mensaje» (hero web), reutilizable en pestaña o pantalla aparte. */
export default function HeroDisenoWebLogoEditorForm(p: HeroDisenoWebLogoEditorFormProps) {
  const {
    heroLogoEdicion,
    persistirHeroLogoEnVivo,
    inputHeroLogoRef,
    onChangeHeroLogoFile,
    heroLogoNombreArchivo,
    onAbrirPreviewInicio,
    onAplicarCambios,
    ocultarVistaPreviaInicio = false
  } = p;

  return (
    <>
      <input ref={inputHeroLogoRef} type="file" accept="image/*" onChange={onChangeHeroLogoFile} style={{ display: "none" }} />
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          color: "rgba(255,255,255,0.9)",
          fontSize: 12,
          userSelect: "none"
        }}
      >
        <input
          type="checkbox"
          checked={heroLogoEdicion.mostrarHeroLogo}
          onChange={(e) => persistirHeroLogoEnVivo({ mostrarHeroLogo: e.target.checked })}
        />
        Mostrar logo hero
      </label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          onClick={() => inputHeroLogoRef.current?.click()}
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: `1px solid ${THEME.goldMain}`,
            background: "linear-gradient(180deg, rgba(201,162,74,0.28), rgba(201,162,74,0.12))",
            color: THEME.goldMain,
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600
          }}
        >
          Elegir imagen
        </button>
        {heroLogoNombreArchivo ? (
          <span style={{ color: "rgba(255,255,255,0.72)", fontSize: 10 }}>{heroLogoNombreArchivo}</span>
        ) : null}
      </div>
      <label style={{ color: "rgba(255,255,255,0.82)", fontSize: 11, display: "grid", gap: 4 }}>
        Tamaño (40–200)
        <input
          type="range"
          min={40}
          max={200}
          step={1}
          value={heroLogoEdicion.heroLogoTamano}
          onChange={(e) =>
            persistirHeroLogoEnVivo({
              heroLogoTamano: Math.max(40, Math.min(200, Math.round(Number(e.target.value))))
            })
          }
        />
      </label>
      <p style={{ margin: 0, color: "rgba(255,255,255,0.58)", fontSize: 10, lineHeight: 1.35 }}>
        En la portada el logo y «Explorar tienda» van en columna centrada; el zoom del banner no mueve el botón. X/Y se siguen guardando (copias / compatibilidad).
      </p>
      <label style={{ color: "rgba(255,255,255,0.82)", fontSize: 11, display: "grid", gap: 4 }}>
        Posición X (0–100)
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={heroLogoEdicion.heroLogoPosX}
          onChange={(e) =>
            persistirHeroLogoEnVivo({
              heroLogoPosX: Math.max(0, Math.min(100, Math.round(Number(e.target.value))))
            })
          }
        />
      </label>
      <label style={{ color: "rgba(255,255,255,0.82)", fontSize: 11, display: "grid", gap: 4 }}>
        Posición Y (0–100)
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={heroLogoEdicion.heroLogoPosY}
          onChange={(e) =>
            persistirHeroLogoEnVivo({
              heroLogoPosY: Math.max(0, Math.min(100, Math.round(Number(e.target.value))))
            })
          }
        />
      </label>
      {!ocultarVistaPreviaInicio ? (
        <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.55)", fontSize: 10, lineHeight: 1.4 }}>
          Vista previa del inicio (banner y zoom en vivo, logo desde lo guardado):{" "}
          <button
            type="button"
            onClick={onAbrirPreviewInicio}
            style={{
              margin: 0,
              padding: 0,
              border: "none",
              background: "none",
              color: THEME.goldMain,
              cursor: "pointer",
              fontSize: 10,
              fontWeight: 700,
              textDecoration: "underline",
              fontFamily: "inherit"
            }}
          >
            Ver inicio — pantalla completa
          </button>
        </p>
      ) : null}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onAplicarCambios}
          style={{
            padding: "8px 10px",
            borderRadius: 8,
            border: `1px solid ${THEME.goldMain}`,
            background: "rgba(201,162,74,0.18)",
            color: THEME.goldMain,
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 700
          }}
        >
          Aplicar cambios
        </button>
      </div>
    </>
  );
}
