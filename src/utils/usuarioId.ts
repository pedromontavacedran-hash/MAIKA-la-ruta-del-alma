const USUARIO_ID_KEY = "maika_usuario_id";
const AUTH_USER_KEY = "maika_auth_user";

function generarUsuarioId() {
  const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `anon_${seed}`;
}

export function getUsuarioId() {
  try {
    const authRaw = localStorage.getItem(AUTH_USER_KEY);
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
