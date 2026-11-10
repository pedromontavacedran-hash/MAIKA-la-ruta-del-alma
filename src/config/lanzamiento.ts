/**
 * Interruptores de la fase de lanzamiento (web informativa).
 *
 * `TIENDA_PUBLICA = false`: la tienda queda oculta al público (sección TIENDA
 * del menú, buscador, icono de carrito, CTA «Explorar tienda» del hero, y las
 * rutas `/tienda`, `/carrito` y `/seguimiento` muestran «Próximamente»).
 *
 * `SERVICIOS_CONTRATABLES = false`: los servicios se muestran como catálogo
 * informativo — sin precios y sin botones de reserva/contratación; donde iba
 * el precio aparece «Próximamente».
 *
 * `CARrito_VISIBLE = true`: muestra el icono de carrito en la navegación aunque
 * la tienda esté oculta. Los usuarios pueden ver su carrito existente pero no
 * pueden añadir nuevos productos porque `/tienda` está en «Próximamente».
 *
 * Nada se elimina: productos, servicios, carrito, checkout, pagos, backend
 * `/pedidos`, imágenes y lógica se conservan íntegros. Reactivar = `true`.
 */
export const TIENDA_PUBLICA = false;
export const SERVICIOS_CONTRATABLES = false;
export const CARrito_VISIBLE = true;

/**
 * Permite añadir productos al carrito y ver el carrito, pero bloquea el
 * checkout final. Útil para fase informativa donde los clientes pueden
 * guardar productos sin poder comprar.
 */
export const CHECKOUT_HABILITADO = false;

/**
 * Mientras `TIENDA_PUBLICA` es `false`, `/tienda` puede mostrar los productos
 * existentes como catálogo informativo «Próximamente»: imagen, nombre y
 * descripción, sin precio, sin botón de compra, sin carrito ni checkout.
 * `false` = `/tienda` solo muestra la página «Próximamente» simple.
 * Con `TIENDA_PUBLICA = true` este flag no se usa: vuelve la tienda real.
 */
export const MOSTRAR_CATALOGO_PROXIMAMENTE = true;
