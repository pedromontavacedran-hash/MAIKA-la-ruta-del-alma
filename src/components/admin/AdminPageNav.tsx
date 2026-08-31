type Props = {
  onVolver: () => void;
  etiqueta?: string;
  /** Mismo aspecto que «Salir al inicio» del panel admin (`admin-btn--gold`). */
  varianteVolver?: "ghost" | "gold";
};

/** Navegación de página admin (no usar BotonCerrar / modal). */
export default function AdminPageNav({
  onVolver,
  etiqueta = "← Volver al panel admin",
  varianteVolver = "ghost"
}: Props) {
  const claseBoton =
    varianteVolver === "gold"
      ? "admin-boton-volver admin-btn admin-btn--gold admin-btn--inline"
      : "admin-boton-volver admin-btn admin-btn--ghost admin-btn--inline";
  return (
    <nav className="admin-page-nav" aria-label="Navegación del panel">
      <button type="button" className={claseBoton} onClick={onVolver}>
        {etiqueta}
      </button>
    </nav>
  );
}
