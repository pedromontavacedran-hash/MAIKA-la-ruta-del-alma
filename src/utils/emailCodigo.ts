import emailjs from "@emailjs/browser";

type EmailJsConfig = {
  PUBLIC_KEY: string;
  SERVICE_ID: string;
  TEMPLATE_ID: string;
};

export async function enviarCodigoEmail(
  email: string,
  nombre: string,
  codigo: string,
  config: EmailJsConfig
): Promise<boolean> {
  try {
    emailjs.init(config.PUBLIC_KEY);
    const emailNormalizado = String(email || "").trim().toLowerCase();
    const nombreNormalizado = String(nombre || "").trim() || "Cliente";
    if (!emailNormalizado) return false;

    const templateParams = {
      // Compatibilidad amplia con plantillas EmailJS antiguas/nuevas.
      to_email: emailNormalizado,
      email: emailNormalizado,
      user_email: emailNormalizado,
      recipient: emailNormalizado,
      to: emailNormalizado,
      to_name: nombreNormalizado,
      nombre: nombreNormalizado,
      from_name: "MAIKA - La ruta del alma",
      codigo
    };

    const response = await emailjs.send(
      config.SERVICE_ID,
      config.TEMPLATE_ID,
      templateParams
    );

    console.log("✅ Email enviado:", response);
    return true;
  } catch (error: unknown) {
    console.error("❌ Error completo:", error);
    if (error && typeof error === "object") {
      const err = error as { text?: string; status?: unknown };
      if (err.text) console.error("Mensaje:", err.text);
      if (err.status != null) console.error("Estado:", err.status);
    }
    return false;
  }
}
