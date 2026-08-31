import type { AuthForm } from "../types";

export function crearFormAuthRegistroDesdeAcceso(telefono: string): AuthForm {
  return {
    nombre: "",
    email: "",
    password: "",
    telefono,
    confirmEmail: "",
    calle: "",
    bloque: "",
    escalera: "",
    piso: "",
    puerta: "",
    numero: "",
    cp: "",
    provincia: "",
    poblacion: "",
    pais: "",
    confirmPassword: "",
    codigoVerificacion: "",
    codigoIngresado: "",
    pasoVerificacion: 1
  };
}
