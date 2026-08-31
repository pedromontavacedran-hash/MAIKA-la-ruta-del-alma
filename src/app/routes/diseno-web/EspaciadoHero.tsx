import { useCallback, useEffect, useState } from "react";
import { THEME } from "../../../config";
import {
  guardarWebLayoutPageGaps,
  guardarWebLayoutTopOffset,
  leerWebLayoutConfig,
  MAIKA_WEB_LAYOUT_UPDATED_EVENT,
  WEB_LAYOUT_PAGE_GAP_MAX,
  WEB_LAYOUT_PAGE_GAP_MIN,
  WEB_LAYOUT_TOP_OFFSET_MAX
} from "../../../utils/webLayoutConfig";

/**
 * Control del hueco global bajo la barra (`--app-layout-top-offset` → `--app-topbar-stack`).
 */
export default function EspaciadoHero() {
  const [topOffset, setTopOffset] = useState(() =>
    typeof window !== "undefined" ? leerWebLayoutConfig().topOffset : 0
  );
  const [pageHeaderGap, setPageHeaderGap] = useState(() =>
    typeof window !== "undefined" ? (leerWebLayoutConfig().pageHeaderGap ?? 12) : 12
  );
  const [pageSubheaderGap, setPageSubheaderGap] = useState(() =>
    typeof window !== "undefined" ? (leerWebLayoutConfig().pageSubheaderGap ?? 12) : 12
  );

  useEffect(() => {
    const sync = () => {
      const cfg = leerWebLayoutConfig();
      setTopOffset(cfg.topOffset);
      setPageHeaderGap(cfg.pageHeaderGap ?? 12);
      setPageSubheaderGap(cfg.pageSubheaderGap ?? 12);
    };
    window.addEventListener(MAIKA_WEB_LAYOUT_UPDATED_EVENT, sync as EventListener);
    return () => window.removeEventListener(MAIKA_WEB_LAYOUT_UPDATED_EVENT, sync as EventListener);
  }, []);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const n = Number(e.target.value);
    const next = guardarWebLayoutTopOffset(n);
    setTopOffset(next.topOffset);
  }, []);

  const onChangeHeaderGap = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const n = Number(e.target.value);
    const next = guardarWebLayoutPageGaps(n, pageSubheaderGap);
    setPageHeaderGap(next.pageHeaderGap ?? 12);
    setPageSubheaderGap(next.pageSubheaderGap ?? 12);
  }, [pageSubheaderGap]);

  const onChangeSubheaderGap = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const n = Number(e.target.value);
    const next = guardarWebLayoutPageGaps(pageHeaderGap, n);
    setPageHeaderGap(next.pageHeaderGap ?? 12);
    setPageSubheaderGap(next.pageSubheaderGap ?? 12);
  }, [pageHeaderGap]);

  return (
    <div>
      <h2
        className="admin-page-heading"
        style={{ color: "rgba(250, 232, 170, 0.95)", fontSize: 18, fontWeight: 800 }}
      >
        Espaciado
      </h2>
      <p className="admin-page-subheading" style={{ color: "rgba(255,255,255,0.72)", fontSize: 12, lineHeight: 1.45 }}>
        Ajusta dónde empieza el contenido bajo la barra en toda la web (se guarda en este navegador).
      </p>
      <label style={{ display: "grid", gap: 6, color: "rgba(255,255,255,0.88)", fontSize: 12, fontWeight: 600 }}>
        Espacio extra bajo la barra
        <input
          type="range"
          min={0}
          max={WEB_LAYOUT_TOP_OFFSET_MAX}
          value={topOffset}
          onChange={onChange}
          aria-valuemin={0}
          aria-valuemax={WEB_LAYOUT_TOP_OFFSET_MAX}
          aria-valuenow={topOffset}
        />
      </label>
      <p style={{ margin: "10px 0 0", color: THEME.goldMain, fontSize: 13, fontWeight: 700 }}>{topOffset}px</p>

      <div style={{ height: 12 }} />

      <label style={{ display: "grid", gap: 6, color: "rgba(255,255,255,0.88)", fontSize: 12, fontWeight: 600 }}>
        Separación título (bloques internos)
        <input
          type="range"
          min={WEB_LAYOUT_PAGE_GAP_MIN}
          max={WEB_LAYOUT_PAGE_GAP_MAX}
          step={1}
          value={pageHeaderGap}
          onChange={onChangeHeaderGap}
          aria-valuemin={WEB_LAYOUT_PAGE_GAP_MIN}
          aria-valuemax={WEB_LAYOUT_PAGE_GAP_MAX}
          aria-valuenow={pageHeaderGap}
        />
      </label>
      <p style={{ margin: "10px 0 0", color: THEME.goldMain, fontSize: 13, fontWeight: 700 }}>{pageHeaderGap}px</p>

      <div style={{ height: 10 }} />

      <label style={{ display: "grid", gap: 6, color: "rgba(255,255,255,0.88)", fontSize: 12, fontWeight: 600 }}>
        Separación subtítulo (bloques internos)
        <input
          type="range"
          min={WEB_LAYOUT_PAGE_GAP_MIN}
          max={WEB_LAYOUT_PAGE_GAP_MAX}
          step={1}
          value={pageSubheaderGap}
          onChange={onChangeSubheaderGap}
          aria-valuemin={WEB_LAYOUT_PAGE_GAP_MIN}
          aria-valuemax={WEB_LAYOUT_PAGE_GAP_MAX}
          aria-valuenow={pageSubheaderGap}
        />
      </label>
      <p style={{ margin: "10px 0 0", color: THEME.goldMain, fontSize: 13, fontWeight: 700 }}>{pageSubheaderGap}px</p>
    </div>
  );
}
