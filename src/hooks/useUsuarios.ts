import { useEffect, useMemo, useState } from "react";
import type { Usuario } from "../types";

export function useUsuarios() {
  const [listaUsuarios, setListaUsuarios] = useState<Usuario[]>([]);
  const [busquedaUsuarios, setBusquedaUsuarios] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("usuarios");
      const parsed = raw ? (JSON.parse(raw) as Usuario[]) : [];
      setListaUsuarios(Array.isArray(parsed) ? parsed : []);
    } catch {
      setListaUsuarios([]);
    }
  }, []);

  const buscarPorTelefono = useMemo(
    () => (telefono: string) => {
      const tel = String(telefono || "").replace(/\D/g, "").trim();
      if (!tel) return undefined;
      return listaUsuarios.find((u) => String(u.telefono || "").replace(/\D/g, "").trim() === tel);
    },
    [listaUsuarios]
  );

  return {
    listaUsuarios,
    setListaUsuarios,
    busquedaUsuarios,
    setBusquedaUsuarios,
    buscarPorTelefono
  };
}
