import { useEffect, useState } from "react";
import type { AuthUser } from "../services/apiAuth";

type JwtPayload = {
  id?: string | number;
  email?: string;
  exp?: number;
  iat?: number;
};

const TOKEN_KEY = "token";
const AUTH_USER_KEY = "maika_auth_user";

function safeParseJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const rawUser = localStorage.getItem(AUTH_USER_KEY);
    if (rawUser) {
      try {
        setUser(JSON.parse(rawUser) as AuthUser);
        return;
      } catch {
        localStorage.removeItem(AUTH_USER_KEY);
      }
    }
    if (!token) return;
    const payload = safeParseJwt(token);
    if (!payload?.id || !payload?.email) return;
    const fallbackUser: AuthUser = { id: payload.id, email: payload.email };
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(fallbackUser));
    setUser(fallbackUser);
  }, []);

  function login(token: string, nextUser?: AuthUser) {
    localStorage.setItem(TOKEN_KEY, token);
    const payload = safeParseJwt(token);
    const resolvedUser =
      nextUser ??
      (payload?.id && payload?.email
        ? { id: payload.id, email: payload.email }
        : null);
    if (resolvedUser) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(resolvedUser));
      setUser(resolvedUser);
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setUser(null);
  }

  return { user, login, logout };
}
