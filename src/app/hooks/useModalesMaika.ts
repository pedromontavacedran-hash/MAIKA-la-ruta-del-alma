import { useEffect, useState } from "react";

/**
 * Modales de gestión de usuarios en admin.
 * Login / edición de perfil: `src/app/hooks/useAuthMaika.ts`.
 */
export function useModalesMaika(locationPathname: string) {
  const [modalUsuariosAbierto, setModalUsuariosAbierto] = useState(false);
  const [altaUsuarioEnGestionAbierta, setAltaUsuarioEnGestionAbierta] = useState(false);

  useEffect(() => {
    if (!modalUsuariosAbierto) setAltaUsuarioEnGestionAbierta(false);
  }, [modalUsuariosAbierto]);

  useEffect(() => {
    if (!modalUsuariosAbierto) return;
    if (!locationPathname.startsWith("/admin")) {
      setModalUsuariosAbierto(false);
    }
  }, [locationPathname, modalUsuariosAbierto]);

  return {
    modalUsuariosAbierto,
    setModalUsuariosAbierto,
    altaUsuarioEnGestionAbierta,
    setAltaUsuarioEnGestionAbierta
  };
}
