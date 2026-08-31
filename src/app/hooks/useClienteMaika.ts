import { useCallback, useState } from "react";
import type { Cliente, Usuario } from "../../types";
import { repartirNombreApellidos } from "../../utils/appIdentity";

export const CLIENTE_VACIO: Cliente = {
  nombre: "",
  apellidos: "",
  nombreApellidos: "",
  email: "",
  dni: "",
  telefono: "",
  direccion: "",
  calle: "",
  numero: "",
  bloque: "",
  escalera: "",
  piso: "",
  puerta: "",
  ciudad: "",
  cp: "",
  poblacion: "",
  provincia: "",
  pais: "",
  notas: ""
};

export function useClienteMaika() {
  const [datosCliente, setDatosCliente] = useState<Cliente>(() => ({ ...CLIENTE_VACIO }));

  const precargarDatosClienteDesdeUsuario = useCallback((usuarioFuente: Usuario | null) => {
    if (!usuarioFuente) return;

    const repartido = repartirNombreApellidos(usuarioFuente.nombre || "", "");
    setDatosCliente((prev) => ({
      ...prev,
      nombre: (repartido.nombre || "").toUpperCase(),
      apellidos: (repartido.apellidos || "").toUpperCase(),
      nombreApellidos:
        `${(repartido.nombre || "").trim()} ${(repartido.apellidos || "").trim()}`.trim() ||
        usuarioFuente.nombre ||
        prev.nombreApellidos,
      email: usuarioFuente.email || prev.email,
      dni: usuarioFuente.dni || prev.dni,
      telefono: usuarioFuente.telefono || prev.telefono,
      direccion: usuarioFuente.direccion || prev.direccion,
      calle: usuarioFuente.calle || prev.calle,
      numero: usuarioFuente.numero || prev.numero,
      bloque: usuarioFuente.bloque || prev.bloque,
      escalera: usuarioFuente.escalera || prev.escalera,
      piso: usuarioFuente.piso || prev.piso,
      puerta: usuarioFuente.puerta || prev.puerta,
      cp: usuarioFuente.cp || prev.cp,
      poblacion: usuarioFuente.poblacion || prev.poblacion,
      provincia: usuarioFuente.provincia || prev.provincia,
      ciudad: usuarioFuente.ciudad || prev.ciudad,
      pais: usuarioFuente.pais || prev.pais
    }));
  }, []);

  const resetCliente = useCallback(() => {
    setDatosCliente(CLIENTE_VACIO);
  }, []);

  return {
    datosCliente,
    setDatosCliente,
    precargarDatosClienteDesdeUsuario,
    resetCliente
  };
}
