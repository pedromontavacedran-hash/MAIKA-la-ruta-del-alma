const EMAIL_VALIDO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function esEmailVerificable(email) {
  return EMAIL_VALIDO_REGEX.test(String(email || "").trim().toLowerCase());
}

export function esEmailTecnicoMaika(email) {
  return /@(checkout\.maika\.shop|usuarios\.maika\.shop)$/i.test(String(email || "").trim());
}

export function tieneEmailRealMaika(email) {
  const emailNorm = String(email || "").trim().toLowerCase();
  return esEmailVerificable(emailNorm) && !esEmailTecnicoMaika(emailNorm);
}

/**
 * Igualdad de buzón al estilo Gmail/Googlemail: ignora puntos y lo que va tras "+" en la parte local.
 * Evita 404 en login cuando el usuario escribe el correo distinto a como quedó guardado en `usuarios.json`.
 */
export function normalizarEmailParaBusquedaLogin(email) {
  const raw = String(email ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
  const at = raw.lastIndexOf("@");
  if (at <= 0) return raw;
  let local = raw.slice(0, at);
  const domain = raw.slice(at + 1);
  if (domain === "gmail.com" || domain === "googlemail.com") {
    const plus = local.indexOf("+");
    if (plus !== -1) local = local.slice(0, plus);
    local = local.replace(/\./g, "");
    return `${local}@${domain}`;
  }
  return raw;
}

export function normalizarTelefono(telefono) {
  const soloDigitos = String(telefono || "").replace(/\D/g, "").trim();
  if (soloDigitos.startsWith("0034") && soloDigitos.length > 4) return soloDigitos.slice(4);
  if (soloDigitos.startsWith("34") && soloDigitos.length > 9) return soloDigitos.slice(2);
  return soloDigitos;
}

/** Mismo formato que `emailCheckoutAutomatico` en el front (`checkoutSyncUsuarioServidor.ts`): solo identifica la cuenta técnica, no es secreto. */
export function emailCheckoutAutomaticoServidor(tel9) {
  return `maika.cli.${tel9}@checkout.maika.shop`;
}
