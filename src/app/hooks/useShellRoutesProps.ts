import { useMemo } from "react";
import type { AppRoutesProps } from "../AppRoutes";
import { packAppRoutesProps, type AppRoutesAppPack } from "../routing/packAppRoutesProps";

/**
 * Ensambla props de `<AppRoutes />` a partir de packs ya memoizados por dominio.
 * El shell debe estabilizar cada pack con `useMemo` para que solo cambie lo necesario.
 */
export function useShellRoutesProps(
  routing: AppRoutesAppPack["routing"],
  admin: AppRoutesAppPack["admin"],
  chrome: AppRoutesAppPack["chrome"],
  checkout: AppRoutesAppPack["checkout"],
  sesion: AppRoutesAppPack["sesion"],
  tienda: AppRoutesAppPack["tienda"]
): AppRoutesProps {
  return useMemo(
    () =>
      packAppRoutesProps({
        routing,
        admin,
        chrome,
        checkout,
        sesion,
        tienda
      }),
    [routing, admin, chrome, checkout, sesion, tienda]
  );
}
