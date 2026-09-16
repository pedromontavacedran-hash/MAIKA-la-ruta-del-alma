import { loginApi, type LoginApiResponse } from "../../services/apiAuth";

/**
 * Login del servidor desde el flujo de acceso rápido del checkout.
 * Misma sesión JWT que Mi cuenta: API primero y perfil canónico vía /me después.
 */
export async function loginServidorDesdeAccesoRapido(
  tel9: string,
  pass: string
): Promise<LoginApiResponse> {
  return await loginApi(tel9, pass);
}
