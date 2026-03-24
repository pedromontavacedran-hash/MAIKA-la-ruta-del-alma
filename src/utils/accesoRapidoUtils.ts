export function hashCodigoAccesoRapido(codigo: string): string {
  return btoa(`${codigo}_maika_salt`);
}

export function passwordSeguraBasica(password: string): boolean {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(String(password || ""));
}

export function evaluarPasswordBasica(password: string): {
  tieneMinimo: boolean;
  tieneNumero: boolean;
  tieneLetra: boolean;
  tieneLetrasYNumeros: boolean;
  valida: boolean;
} {
  const p = String(password || "");
  const tieneMinimo = p.length >= 8;
  const tieneNumero = /\d/.test(p);
  const tieneLetra = /[A-Za-z]/.test(p);
  const tieneLetrasYNumeros = tieneNumero && tieneLetra;
  return {
    tieneMinimo,
    tieneNumero,
    tieneLetra,
    tieneLetrasYNumeros,
    valida: tieneMinimo && tieneLetrasYNumeros
  };
}

export function enmascararEmail(email: string): string {
  const e = (email || "").trim();
  const [user, domain] = e.split("@");
  if (!user || !domain) return "";
  if (user.length <= 2) {
    return `${user[0]}***@${domain}`;
  }
  return `${user.slice(0, 2)}***@${domain}`;
}
