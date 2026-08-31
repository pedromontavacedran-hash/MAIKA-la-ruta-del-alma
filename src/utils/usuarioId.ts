import { MAIKA_AUTH_USER_SNAPSHOT_KEY } from "../services/apiAuth";

const USUARIO_ID_KEY = "maika_usuario_id";

function generarUsuarioId() {
  const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `anon_${seed}`;
}

export function getUsuarioId() {
  try {
    const authRaw = localStorage.getItem(MAIKA_AUTH_USER_SNAPSHOT_KEY);
    if (authRaw) {
      const auth = JSON.parse(authRaw) as { id?: string | number };
      if (auth?.id !== undefined && auth?.id !== null && String(auth.id).trim()) {
        return `user_${String(auth.id).trim()}`;
      }
    }
  } catch {
    // Ignorar parse inválido y seguir con fallback anónimo.
  }
  const existente = localStorage.getItem(USUARIO_ID_KEY)?.trim();
  if (existente) return existente;
  const nuevo = generarUsuarioId();
  localStorage.setItem(USUARIO_ID_KEY, nuevo);
  return nuevo;
}
