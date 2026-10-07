import NavPrincipal from "./NavPrincipal";
import CookiesBanner from "./modals/CookiesBanner";
import NotificacionOverlay from "./modals/NotificacionOverlay";
import type { Pagina } from "../types";
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
  notificacion: NotificacionMaikaEstado | null;
  onPrefetchPagina: (p: Pagina) => void;
  onTerminarCompra: () => void;
  onAbrirPoliticaCookies: () => void;
  onAceptarCookies: () => void;
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
        onAbrirPoliticaCookies={props.onAbrirPoliticaCookies}
        onAceptar={props.onAceptarCookies}
      />
      <NotificacionOverlay notificacion={props.notificacion} onClose={props.onCerrarNotificacion} />
    </>
  );
}
