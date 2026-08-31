export function esEmailTecnicoMaika(email: string): boolean {
  return /@(checkout\.maika\.shop|usuarios\.maika\.shop)$/i.test(String(email || "").trim());
}

export function tieneEmailRealMaika(email: string): boolean {
  const emailNorm = String(email || "").trim();
  return !!emailNorm && !esEmailTecnicoMaika(emailNorm);
}
