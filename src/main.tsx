import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import "@/styles/global.css";
import './index.css'
import App from './App.tsx'
import { resolveApiBaseUrl } from './config/apiBaseUrl'
import {
  leerBarraTopPedidoExitoCfg,
  ALTURA_BARRA_TOP_MIN,
  ALTURA_BARRA_TOP_MAX
} from '@/utils/barraTopPedidoExito/barraTopPedidoExitoCfg'
import { aplicarWebLayoutCssDesdeStorage } from '@/utils/webLayoutConfig'
import {
  aplicarLecturaPantallaCssDesdeStorage,
  registrarLecturaPantallaSyncEntrePestanas
} from '@/utils/lecturaPantallaConfig'
import { aplicarHeroCtaOffsetDesdeStorage } from '@/utils/heroBannerConfig'

/** Evita un fotograma con `--app-topbar-h` por defecto y luego salto al leer LS (padding `__content` + barra). */
function aplicarAlturaBarraTopDesdeStorage() {
  try {
    const h = Math.max(
      ALTURA_BARRA_TOP_MIN,
      Math.min(ALTURA_BARRA_TOP_MAX, Math.round(leerBarraTopPedidoExitoCfg().alturaBarraSuperior))
    );
    document.documentElement.style.setProperty('--app-topbar-h', `${h}px`);
  } catch {
    /* noop */
  }
}
aplicarAlturaBarraTopDesdeStorage();
/** Misma idea: `--app-layout-top-offset` solo en `html` antes del primer paint (evita conflicto con reglas estáticas). */
aplicarWebLayoutCssDesdeStorage();
aplicarLecturaPantallaCssDesdeStorage();
registrarLecturaPantallaSyncEntrePestanas();
aplicarHeroCtaOffsetDesdeStorage();

void (async () => {
  try {
    ;(window as Window & { __MAIKA_API_BASE__?: string }).__MAIKA_API_BASE__ = await resolveApiBaseUrl()
  } catch {
    ;(window as Window & { __MAIKA_API_BASE__?: string }).__MAIKA_API_BASE__ =
      (import.meta.env.VITE_API_URL as string | undefined)?.trim() || "http://localhost:3001"
  }

  const tree = (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );

  createRoot(document.getElementById('root')!).render(
    <StrictMode>{tree}</StrictMode>,
  )
})()
