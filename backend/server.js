import { app, ensureStorage, verificarSmtpAlArrancar } from "./app.js";

const PORT = Number(process.env.PORT || 3001);

ensureStorage()
  .then(async () => {
    await verificarSmtpAlArrancar();
    /** Todas las interfaces: el móvil en la misma WiFi puede usar http://IPv4-LAN:PORT (si el firewall lo permite). */
    const HOST = "0.0.0.0";
    const server = app.listen(PORT, HOST, () => {
      if (process.env.MAIKA_QUIET !== "1") {
        // eslint-disable-next-line no-console
        console.log(`[maika-backend] Escuchando en ${HOST}:${PORT} (red local + esta máquina).`);
        // eslint-disable-next-line no-console
        console.log(`[maika-backend] Desde este PC: http://localhost:${PORT}`);
        // eslint-disable-next-line no-console
        console.log(
          `[maika-backend] Desde móvil (misma WiFi): http://TU_IP_LAN:${PORT} — en Windows: ipconfig → IPv4. Abre el puerto ${PORT} en el firewall si falla.`
        );
      }
    });
    server.on("error", (err) => {
      // eslint-disable-next-line no-console
      console.error("[maika-backend] Puerto ocupado o no usable:", PORT, err?.message || err);
      process.exit(1);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[maika-backend] Error al preparar backend/data:", err);
    process.exit(1);
  });
