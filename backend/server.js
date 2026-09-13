import { app, ensureStorage, verificarSmtpAlArrancar } from "./app.js";

const PORT = Number(process.env.PORT || 3001);

ensureStorage()
  .then(async () => {
    await verificarSmtpAlArrancar();
    /** Host configurable: por defecto escucha en todas las interfaces para desarrollo local,
     *  pero en producción se puede restringir a 127.0.0.1 con la variable HOST. */
    const HOST = process.env.HOST || "0.0.0.0";
    const server = app.listen(PORT, HOST, () => {
      if (process.env.MAIKA_QUIET !== "1") {
         
        console.log(`[maika-backend] Escuchando en ${HOST}:${PORT} (red local + esta máquina).`);
         
        console.log(`[maika-backend] Desde este PC: http://localhost:${PORT}`);
         
        console.log(
          `[maika-backend] Desde móvil (misma WiFi): http://TU_IP_LAN:${PORT} — en Windows: ipconfig → IPv4. Abre el puerto ${PORT} en el firewall si falla.`
        );
      }
    });
    server.on("error", (err) => {
       
      console.error("[maika-backend] Puerto ocupado o no usable:", PORT, err?.message || err);
      process.exit(1);
    });
  })
  .catch((err) => {
     
    console.error("[maika-backend] Error al preparar backend/data:", err);
    process.exit(1);
  });
