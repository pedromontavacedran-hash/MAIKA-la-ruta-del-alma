import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { SugerenciaAccesoView, puedeEnviarSugerencia } from "./SugerenciaModal";

describe("Sugerencias y mejoras", () => {
  it("muestra a usuarios anónimos solo la invitación de miembro con login y registro", () => {
    const onClose = vi.fn();
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <SugerenciaAccesoView onClose={onClose} />
      </MemoryRouter>
    );

    expect(html).toContain("Esta función es para miembros de MAIKA");
    expect(html).toContain("Inicia sesión o crea tu cuenta gratuita para enviar sugerencias y ayudarnos a mejorar.");
    expect(html).toContain("Iniciar sesión");
    expect(html).toContain("Crear cuenta gratuita");
    expect(html).toContain('href="/cuenta?vista=login"');
    expect(html).toContain('href="/cuenta?vista=registro"');
    expect(html).not.toContain('type="email"');
    expect(html).not.toContain('type="tel"');
  });

  it("solo habilita el envío con tipo y mensaje no vacío", () => {
    expect(puedeEnviarSugerencia("", "Texto", false)).toBe(false);
    expect(puedeEnviarSugerencia("Web / diseño", "", false)).toBe(false);
    expect(puedeEnviarSugerencia("Web / diseño", "   ", false)).toBe(false);
    expect(puedeEnviarSugerencia("Web / diseño", "Texto", true)).toBe(false);
    expect(puedeEnviarSugerencia("Web / diseño", "Texto", false)).toBe(true);
    expect(puedeEnviarSugerencia("Tienda / productos", "Texto", false)).toBe(true);
  });
});
