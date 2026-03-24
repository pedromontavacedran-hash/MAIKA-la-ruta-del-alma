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

    const templateParams = {
      to_email: email,
      to: email,
      email,
      to_name: nombre,
      name: nombre,
      from_name: "MAIKA - La ruta del alma",
      codigo,
      reply_to: email
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
    const err = error as any;
    if (err?.text) console.error("Mensaje:", err.text);
    if (err?.status) console.error("Estado:", err.status);
    return false;
  }
}
