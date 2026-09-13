import { useEffect, type Dispatch, type SetStateAction } from "react";
import {
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_VERSION,
  RECORDAR_DATOS_INVITADO_KEY,
  UMBRAL_STOCK_BAJO_KEY,
  NOTA_PEDIDO_ENVIO_KEY,
  DESPLEGABLE_INICIO_KEY,
  DESPLEGABLE_INICIO_DEFAULT,
  SERVICIOS_INICIO_KEY,
  SERVICIOS_INICIO_DEFAULT,
  type BloqueDesplegableInicio,
  type ServicioInicio
} from "../../config";
import type { ConsentimientoCookies } from "../../types";
import { cargarConsentimientoCookiesDesdeStorage } from "../../utils/cookiesConsent";
import { runOnce } from "../../utils/prefetchPredictivo";
import { preloadCarritoPage } from "../routing/lazyPages";

export type UseAppBootstrapStorageOptions = {
  esAppNativa: boolean;
  setConsentimientoCookies: Dispatch<SetStateAction<ConsentimientoCookies>>;
  setRecordarDatosInvitado: Dispatch<SetStateAction<boolean>>;
  setUmbralStockBajo: Dispatch<SetStateAction<number>>;
  setNotaPedidoEnvio: Dispatch<SetStateAction<string>>;
  setDesplegableInicio: Dispatch<SetStateAction<BloqueDesplegableInicio[]>>;
  setServiciosInicio: Dispatch<SetStateAction<ServicioInicio[]>>;
  setMostrarAvisoCookies: Dispatch<SetStateAction<boolean>>;
};

export function useAppBootstrapStorage(o: UseAppBootstrapStorageOptions) {
  const {
    esAppNativa,
    setConsentimientoCookies,
    setRecordarDatosInvitado,
    setUmbralStockBajo,
    setNotaPedidoEnvio,
    setDesplegableInicio,
    setServiciosInicio,
    setMostrarAvisoCookies
  } = o;

  useEffect(() => {
    const consentimientoCargado = cargarConsentimientoCookiesDesdeStorage(
      COOKIE_CONSENT_KEY,
      COOKIE_CONSENT_VERSION
    );
    if (consentimientoCargado) {
      setConsentimientoCookies(consentimientoCargado);
    }

    const recordarInvitadoRaw = localStorage.getItem(RECORDAR_DATOS_INVITADO_KEY);
    setRecordarDatosInvitado(recordarInvitadoRaw === "1");

    // No precargar datos de checkout al entrar: el formulario empieza vacío siempre
    const umbralGuardado = localStorage.getItem(UMBRAL_STOCK_BAJO_KEY);
    if (umbralGuardado) {
      const n = parseInt(umbralGuardado, 10);
      if (Number.isFinite(n) && n >= 0 && n <= 99) setUmbralStockBajo(n);
    }
    const notaGuardada = localStorage.getItem(NOTA_PEDIDO_ENVIO_KEY);
    if (notaGuardada != null && notaGuardada !== "") setNotaPedidoEnvio(notaGuardada);
    const desplegableGuardado = localStorage.getItem(DESPLEGABLE_INICIO_KEY);
    if (desplegableGuardado) {
      try {
        const parsed = JSON.parse(desplegableGuardado);
        const def = DESPLEGABLE_INICIO_DEFAULT[0];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDesplegableInicio(
            parsed.map(
              (b: { titulo?: string; subtitulo?: string; numProductos?: number; inicio?: number }) => ({
                titulo: typeof b.titulo === "string" ? b.titulo : def?.titulo ?? "",
                subtitulo: typeof b.subtitulo === "string" ? b.subtitulo : def?.subtitulo ?? "",
                inicio: Number.isFinite(b.inicio) && (b.inicio as number) >= 0 ? (b.inicio as number) : 0,
                numProductos:
                  Number.isFinite(b.numProductos) && (b.numProductos as number) >= 1
                    ? Math.min(20, b.numProductos as number)
                    : 3
              })
            )
          );
        } else if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && "titulo" in parsed) {
          setDesplegableInicio([
            {
              titulo: typeof parsed.titulo === "string" ? parsed.titulo : def?.titulo ?? "",
              subtitulo: typeof parsed.subtitulo === "string" ? parsed.subtitulo : def?.subtitulo ?? "",
              inicio: 0,
              numProductos:
                Number.isFinite(parsed.numProductos) && (parsed.numProductos as number) >= 1
                  ? Math.min(20, parsed.numProductos as number)
                  : 3
            }
          ]);
        }
      } catch {
        // ignorar
      }
    }
    const serviciosGuardado = localStorage.getItem(SERVICIOS_INICIO_KEY);
    if (serviciosGuardado) {
      try {
        const parsed = JSON.parse(serviciosGuardado) as ServicioInicio[];
        if (Array.isArray(parsed) && parsed.length >= 3) {
          const def = SERVICIOS_INICIO_DEFAULT;
          setServiciosInicio(
            parsed.slice(0, 3).map((s, i) => ({
              titulo: typeof s.titulo === "string" ? s.titulo : def[i]?.titulo ?? "",
              fraseBreve:
                typeof s.fraseBreve === "string"
                  ? s.fraseBreve
                  : def[i]?.fraseBreve ?? "",
              imagen: typeof s.imagen === "string" ? s.imagen : def[i]?.imagen ?? "",
              duracion: typeof s.duracion === "string" ? s.duracion : def[i]?.duracion ?? "",
              precio: typeof s.precio === "string" ? s.precio : def[i]?.precio ?? "",
              textoBoton: typeof s.textoBoton === "string" ? s.textoBoton : def[i]?.textoBoton ?? "",
              urlWhatsApp: typeof s.urlWhatsApp === "string" ? s.urlWhatsApp : def[i]?.urlWhatsApp ?? ""
            }))
          );
        }
      } catch {
        // ignorar
      }
    }
    if (!consentimientoCargado) {
      setMostrarAvisoCookies(true);
    }
    // Solo al montar: no depender de normalizarItemCarrito para no re-ejecutar al cambiar catálogo
     
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 600) {
        runOnce("intent-scroll-buy", preloadCarritoPage);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (esAppNativa) {
      root.classList.add("maika-native");
      return () => root.classList.remove("maika-native");
    }
    root.classList.remove("maika-native");
  }, [esAppNativa]);

}
