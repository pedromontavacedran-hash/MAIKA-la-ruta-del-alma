import { useEffect, useState } from "react";
import type { PerfilCompraRapida } from "../types";
import { cargarPerfilCompraRapidaDesdeStorage } from "../utils/storageLoaders";

export function usePerfilCompraRapida(storageKey: string) {
  const [perfil, setPerfil] = useState<PerfilCompraRapida | null>(null);

  useEffect(() => {
    const data = cargarPerfilCompraRapidaDesdeStorage(storageKey);
    setPerfil(data);
  }, [storageKey]);

  return {
    perfil,
    setPerfil
  };
}
