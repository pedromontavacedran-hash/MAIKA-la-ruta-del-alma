export function repartirNombreApellidos(nombreRaw: string, apellidosRaw: string): { nombre: string; apellidos: string } {
  const nombreLimpio = String(nombreRaw || "").trim().replace(/\s+/g, " ");
  const apellidosLimpio = String(apellidosRaw || "").trim().replace(/\s+/g, " ");
  if (!nombreLimpio) return { nombre: "", apellidos: apellidosLimpio };

  const nPartes = nombreLimpio.split(" ").filter(Boolean);
  const aPartes = apellidosLimpio ? apellidosLimpio.split(" ").filter(Boolean) : [];

  // Regla práctica para nombres españoles:
  // si "nombre" tiene más de una palabra y "apellidos" trae 0/1 palabra,
  // asumimos que el resto del nombre eran apellidos.
  if (nPartes.length >= 2 && aPartes.length <= 1) {
    const nombre = nPartes[0];
    const resto = nPartes.slice(1).join(" ");
    const apellidos = `${resto}${apellidosLimpio ? ` ${apellidosLimpio}` : ""}`.trim();
    return { nombre, apellidos };
  }

  return { nombre: nombreLimpio, apellidos: apellidosLimpio };
}

export function generarNumeroPedido(): string {
  const year = new Date().getFullYear().toString().slice(2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
  const day = new Date().getDate().toString().padStart(2, "0");
  /** 4 dígitos (antes 2): más margen frente a intentos de adivinar el código al activar una cuenta técnica. */
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `MK${year}${month}${day}-${random}`;
}

export function generarReferenciaPago(): string {
  const time = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 900 + 100);
  return `PAY-${time}-${random}`;
}

/**
 * UUID v4 para cabeceras tipo Idempotency-Key.
 * `crypto.randomUUID` no existe en HTTP en varios móviles/WebViews (solo en contextos “seguros”).
 */
export function generarUuidV4(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      /* seguir */
    }
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6]! & 0x0f) | 0x40;
    b[8] = (b[8]! & 0x3f) | 0x80;
    const h = (n: number) => n.toString(16).padStart(2, "0");
    let s = "";
    for (let i = 0; i < 16; i++) s += h(b[i]!);
    return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
  }
  return `mk_${Date.now()}_${Math.random().toString(36).slice(2, 12)}_${Math.random().toString(36).slice(2, 12)}`;
}
