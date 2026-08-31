/** Sección de testimonios (texto fijo de ejemplo). */
export default function InicioTestimoniosBloque() {
  return (
    <div
      className="inicio-wrapper inicio-page maika-route-fill-column"
      style={{ maxWidth: 1100, margin: "0 auto", width: "100%" }}
    >
      <div className="inicio-bloques-texto">
        <section aria-labelledby="pagina-testimonios-titulo">
          <h2 id="pagina-testimonios-titulo" className="inicio-seccion-titulo" style={{ marginBottom: 18 }}>
            Testimonios
          </h2>
          <div className="inicio-testimonios">
            <blockquote className="testimonio-card">
              «Llegó todo muy bien presentado y con una energía preciosa. Las velas huelen increíble; ya son parte de mi
              ritual nocturno.»
              <footer style={{ marginTop: 12, fontSize: 14, color: "rgba(255,255,255,0.7)" }}>— Lucía, Madrid</footer>
            </blockquote>
            <blockquote className="testimonio-card">
              «Pedí ayuda para elegir y la atención fue cercana y clara. El incienso y las figuras superaron lo que
              imaginaba por fotos.»
              <footer style={{ marginTop: 12, fontSize: 14, color: "rgba(255,255,255,0.7)" }}>— Andrea, Valencia</footer>
            </blockquote>
            <blockquote className="testimonio-card">
              «Maika transmite confianza y cuidado en cada detalle. Repito seguro; se nota el mimo en el empaquetado y en
              los mensajes.»
              <footer style={{ marginTop: 12, fontSize: 14, color: "rgba(255,255,255,0.7)" }}>— Carmen, Barcelona</footer>
            </blockquote>
          </div>
        </section>
      </div>
    </div>
  );
}
