const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || "http://localhost:3001";

export type AuthUser = {
  id: number | string;
  email: string;
  telefono?: string;
  nombre?: string;
};

export type LoginApiResponse = {
  token: string;
  user: AuthUser;
};

export async function loginApi(email: string, password: string): Promise<LoginApiResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error(`Login fallido (${res.status})`);
  return (await res.json()) as LoginApiResponse;
}

export async function registerApi(data: {
  email: string;
  password: string;
  telefono?: string;
  nombre?: string;
}): Promise<{ ok: true; user: AuthUser }> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Registro fallido (${res.status})`);
  return (await res.json()) as { ok: true; user: AuthUser };
}

export async function obtenerPerfilApi(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Perfil no disponible (${res.status})`);
  return (await res.json()) as AuthUser;
}

export async function actualizarPasswordApi(data: {
  email?: string;
  telefono?: string;
  password: string;
}): Promise<{ ok: true }> {
  const res = await fetch(`${API_URL}/auth/password`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Actualización de password fallida (${res.status})`);
  return (await res.json()) as { ok: true };
}
