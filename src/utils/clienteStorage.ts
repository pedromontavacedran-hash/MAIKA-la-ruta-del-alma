import type { Cliente } from "../types";

export function cargarClienteInvitadoDesdeStorage(
  clienteVacio: Cliente,
  quickCheckoutKey: string
): Cliente {
  const perfilCompraRapidaRaw = localStorage.getItem(quickCheckoutKey);
  if (perfilCompraRapidaRaw) {
    try {
      const perfil = JSON.parse(perfilCompraRapidaRaw) as { datosCliente?: Cliente };
      if (perfil?.datosCliente) return perfil.datosCliente;
      return clienteVacio;
    } catch {
      return clienteVacio;
    }
  }

  try {
    const raw = localStorage.getItem("clienteMaika");
    if (!raw) return clienteVacio;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return clienteVacio;
    const c = parsed as Partial<Cliente>;
    const nombre = String(c.nombre ?? "").trim();
    const apellidos = String(c.apellidos ?? "").trim();
    return {
      ...clienteVacio,
      ...c,
      nombre: nombre || (c.nombre as string),
      apellidos: apellidos || (c.apellidos as string),
      nombreApellidos: `${nombre} ${apellidos}`.trim() || (c.nombreApellidos as string) || ""
    } as Cliente;
  } catch {
    return clienteVacio;
  }
}
