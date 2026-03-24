export const ADMIN_TOKEN_KEY = "maika_admin_token";
export const ADMIN_TOKEN_VALUE = "admin_ok_2026";
export const ADMIN_LAST_LOGIN_KEY = "maika_admin_last_login";
export const ADMIN_SESSION_MINUTES_KEY = "maika_admin_session_minutes";
export const ADMIN_SESSION_MINUTES = 60; // Cambia este valor cuando quieras.

type AdminSession = {
  token: string;
  expiresAt: number;
};

function readSession(raw: string | null): AdminSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AdminSession>;
    if (parsed?.token !== ADMIN_TOKEN_VALUE) return null;
    if (typeof parsed.expiresAt !== "number") return null;
    return { token: parsed.token, expiresAt: parsed.expiresAt };
  } catch {
    // Formato no JSON (token legacy): no calcular aquí para evitar
    // que el contador se "reinicie" en cada lectura.
    return null;
  }
}

function writeSession(expiresAt: number): void {
  const payload: AdminSession = {
    token: ADMIN_TOKEN_VALUE,
    expiresAt
  };
  localStorage.setItem(ADMIN_TOKEN_KEY, JSON.stringify(payload));
}

export function getAdminSessionMinutes(): number {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_MINUTES_KEY);
    const parsed = raw ? Number(raw) : NaN;
    if (!Number.isFinite(parsed)) return ADMIN_SESSION_MINUTES;
    const clamped = Math.max(1, Math.min(24 * 60, Math.floor(parsed)));
    return clamped;
  } catch {
    return ADMIN_SESSION_MINUTES;
  }
}

export function setAdminSessionMinutes(minutes: number): number {
  const normalized = Math.max(1, Math.min(24 * 60, Math.floor(minutes)));
  try {
    localStorage.setItem(ADMIN_SESSION_MINUTES_KEY, String(normalized));
  } catch {
    // ignore storage errors
  }
  return normalized;
}

export function setAdminAuthorization(): void {
  try {
    const sessionMs = getAdminSessionMinutes() * 60 * 1000;
    writeSession(Date.now() + sessionMs);
    localStorage.setItem(ADMIN_LAST_LOGIN_KEY, String(Date.now()));
  } catch {
    // ignore storage errors
  }
}

export function renewAdminAuthorizationWithoutTouchingLastLogin(): void {
  try {
    const sessionMs = getAdminSessionMinutes() * 60 * 1000;
    writeSession(Date.now() + sessionMs);
  } catch {
    // ignore storage errors
  }
}

export function isAdminAuthorized(): boolean {
  try {
    const raw = localStorage.getItem(ADMIN_TOKEN_KEY);
    // Migra formato legacy (string simple) al nuevo formato con expiración fija.
    if (raw === ADMIN_TOKEN_VALUE) {
      setAdminAuthorization();
      return true;
    }
    const session = readSession(raw);
    if (!session) return false;
    if (session.expiresAt <= Date.now()) {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function getAdminSessionRemainingMs(): number {
  try {
    const session = readSession(localStorage.getItem(ADMIN_TOKEN_KEY));
    if (!session) return 0;
    return Math.max(0, session.expiresAt - Date.now());
  } catch {
    return 0;
  }
}

export function getAdminSessionExpiresAtMs(): number {
  try {
    const session = readSession(localStorage.getItem(ADMIN_TOKEN_KEY));
    if (!session) return 0;
    return session.expiresAt;
  } catch {
    return 0;
  }
}

export function clearAdminAuthorization(): void {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
}

export function getAdminLastLoginMs(): number | null {
  try {
    const raw = localStorage.getItem(ADMIN_LAST_LOGIN_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
  } catch {
    return null;
  }
}
