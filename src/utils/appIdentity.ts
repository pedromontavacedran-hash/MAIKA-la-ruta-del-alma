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
  const random = Math.floor(Math.random() * 100).toString().padStart(2, "0");
  return `MK${year}${month}${day}-${random}`;
}

export function generarReferenciaPago(): string {
  const time = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 900 + 100);
  return `PAY-${time}-${random}`;
}
