import NavPrincipal from "./NavPrincipal";
import CookiesBanner from "./modals/CookiesBanner";
import NotificacionOverlay from "./modals/NotificacionOverlay";
import type { ConsentimientoCookies, Pagina } from "../types";
import type { NotificacionMaikaEstado } from "../hooks/useNotificacion";
import "./AppTopChrome.css";

type Props = {
  /** Solo `/admin/inventario`: oculta logo + menú + accesos (la página ya tiene volver / tienda). */
  omitirNavPrincipal?: boolean;
  pagina: Pagina;
  setPagina: (p: Pagina) => void;
  mostrarAvisoCookies: boolean;
  bgColor: string;
  goldColor: string;
  mostrarConfigCookies: boolean;
  consentimientoCookies: ConsentimientoCookies;
  notificacion: NotificacionMaikaEstado | null;
  onPrefetchPagina: (p: Pagina) => void;
  onTerminarCompra: () => void;
  onAbrirPoliticaCookies: () => void;
  onRechazarOpcionales: () => void;
  onToggleConfigCookies: () => void;
  onAceptarTodasCookies: () => void;
  onCerrarConfigCookies: () => void;
  onGuardarPreferenciasCookies: () => void;
  onUpdatePreferencias: (checked: boolean) => void;
  onUpdateAnaliticas: (checked: boolean) => void;
  onUpdateMarketing: (checked: boolean) => void;
  onCerrarNotificacion: () => void;
};

export default function AppTopChrome(props: Props) {
  return (
    <>
      {!props.omitirNavPrincipal ? (
        <NavPrincipal
          pagina={props.pagina}
          setPagina={props.setPagina}
          onPrefetchPagina={props.onPrefetchPagina}
          onTerminarCompra={props.onTerminarCompra}
        />
      ) : null}
      <CookiesBanner
        visible={props.mostrarAvisoCookies}
        pagina={props.pagina}
        bgColor={props.bgColor}
        goldColor={props.goldColor}
        mostrarConfigCookies={props.mostrarConfigCookies}
        consentimientoCookies={props.consentimientoCookies}
        onAbrirPoliticaCookies={props.onAbrirPoliticaCookies}
        onRechazarOpcionales={props.onRechazarOpcionales}
        onToggleConfig={props.onToggleConfigCookies}
        onAceptarTodas={props.onAceptarTodasCookies}
        onCerrarConfig={props.onCerrarConfigCookies}
        onGuardarPreferencias={props.onGuardarPreferenciasCookies}
        onUpdatePreferencias={props.onUpdatePreferencias}
        onUpdateAnaliticas={props.onUpdateAnaliticas}
        onUpdateMarketing={props.onUpdateMarketing}
      />
      <NotificacionOverlay notificacion={props.notificacion} onClose={props.onCerrarNotificacion} />
    </>
  );
}
