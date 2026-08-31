import { useEffect } from "react";

/** Añade `modal-open` al body mientras haya un modal a pantalla completa (scroll bloqueado). */
export function useBodyClassModalOpen(open: boolean) {
  useEffect(() => {
    if (open) document.body.classList.add("modal-open");
    else document.body.classList.remove("modal-open");
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [open]);
}
