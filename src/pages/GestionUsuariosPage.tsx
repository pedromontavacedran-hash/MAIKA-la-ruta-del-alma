import ModalUsuarios from "../components/ModalUsuarios";
import EditUsuarioModal from "../components/EditUsuarioModal";
import type { Usuario } from "../types";

type Props = {
  modalUsuariosAbierto: boolean;
  listaUsuarios: Usuario[];
  setModalUsuariosAbierto: (v: boolean) => void;
  mostrarNotificacion: (mensaje: string, tipo?: "normal" | "exito" | "error") => void;
  abrirEditorUsuario: (usuario: Usuario) => void;
  setListaUsuarios: (usuarios: Usuario[]) => void;
  cargarUsuarios: () => void;
  normalizarTelefonoES9: (telefono: string) => string;
  leerMaikaUsuarios: () => any[];
  guardarMaikaUsuarios: (usuarios: any[]) => void;
  usuario: Usuario | null;
  setUsuario: (u: Usuario | null) => void;
  normalizarTelefonoBizum: (telefono: string) => string;
  setPagina: (p: any) => void;
  modalEditarUsuarioAbierto: boolean;
  editUsuarioForm: any;
  setEditUsuarioForm: (v: any) => void;
  setModalEditarUsuarioAbierto: (v: boolean) => void;
  guardarEdicionUsuario: () => void;
};

export default function GestionUsuariosPage(props: Props) {
  const {
    modalUsuariosAbierto,
    listaUsuarios,
    setModalUsuariosAbierto,
    mostrarNotificacion,
    abrirEditorUsuario,
    setListaUsuarios,
    cargarUsuarios,
    normalizarTelefonoES9,
    leerMaikaUsuarios,
    guardarMaikaUsuarios,
    usuario,
    setUsuario,
    normalizarTelefonoBizum,
    setPagina,
    modalEditarUsuarioAbierto,
    editUsuarioForm,
    setEditUsuarioForm,
    setModalEditarUsuarioAbierto,
    guardarEdicionUsuario
  } = props;

  return (
    <>
      <ModalUsuarios
        abierto={modalUsuariosAbierto}
        usuarios={listaUsuarios}
        onClose={() => setModalUsuariosAbierto(false)}
        mostrarNotificacion={mostrarNotificacion}
        onEditUsuario={abrirEditorUsuario}
        onUpdateUsuario={(nuevosUsuarios) => setListaUsuarios(nuevosUsuarios)}
        onRefreshUsuarios={cargarUsuarios}
        onDeleteUsuario={(id) => {
          const usuarioABorrar = listaUsuarios.find((u) => u.id === id);
          const nuevosUsuarios = listaUsuarios.filter((u) => u.id !== id);
          setListaUsuarios(nuevosUsuarios);

          // Persistir borrado en ambas fuentes para que no "reaparezca" al recargar.
          const telBorrado = normalizarTelefonoES9(usuarioABorrar?.telefono || "");
          const emailBorrado = (usuarioABorrar?.email || "").trim().toLowerCase();
          const idStr = String(id || "");
          const telDesdeId = idStr.startsWith("u_") ? normalizarTelefonoES9(idStr.slice(2)) : "";

          const maikaActual = leerMaikaUsuarios();
          const maikaFiltrado = maikaActual.filter((u) => {
            const tel = normalizarTelefonoES9(u.telefono || "");
            const email = (u.email || "").trim().toLowerCase();
            if (telBorrado && tel === telBorrado) return false;
            if (telDesdeId && tel === telDesdeId) return false;
            if (emailBorrado && email === emailBorrado) return false;
            return true;
          });
          if (maikaFiltrado.length !== maikaActual.length) {
            guardarMaikaUsuarios(maikaFiltrado);
          }

          // Limpia siempre legacy por teléfono para evitar que reaparezcan email/datos en acceso rápido.
          if (telBorrado || telDesdeId) {
            try {
              const legacy = JSON.parse(localStorage.getItem("usuarios") || "[]") as Usuario[];
              const legacyArr = Array.isArray(legacy) ? legacy : [];
              const legacyFiltrado = legacyArr.filter((u) => {
                const tel = normalizarTelefonoES9(u.telefono || "");
                const email = (u.email || "").trim().toLowerCase();
                if (telBorrado && tel === telBorrado) return false;
                if (telDesdeId && tel === telDesdeId) return false;
                if (emailBorrado && email === emailBorrado) return false;
                if (idStr && String(u.id || "") === idStr) return false;
                return true;
              });
              if (legacyFiltrado.length !== legacyArr.length) {
                localStorage.setItem("usuarios", JSON.stringify(legacyFiltrado));
              }
            } catch {
              /* ignore */
            }
          }

          const coincideUsuarioEnMemoria =
            !!usuario &&
            !!usuarioABorrar &&
            (String(usuario.id) === String(id) ||
              (usuario.telefono &&
                usuarioABorrar.telefono &&
                normalizarTelefonoBizum(usuario.telefono) === normalizarTelefonoBizum(usuarioABorrar.telefono)));

          let coincideUsuarioEnStorage = false;
          try {
            const rawActual = localStorage.getItem("usuarioActual");
            if (rawActual && usuarioABorrar) {
              const usuarioStorage = JSON.parse(rawActual) as Usuario;
              coincideUsuarioEnStorage =
                String(usuarioStorage.id) === String(id) ||
                (usuarioStorage.telefono &&
                  usuarioABorrar.telefono &&
                  normalizarTelefonoBizum(usuarioStorage.telefono) === normalizarTelefonoBizum(usuarioABorrar.telefono));
            }
          } catch {
            coincideUsuarioEnStorage = false;
          }

          if (coincideUsuarioEnMemoria || coincideUsuarioEnStorage) {
            setUsuario(null);
            localStorage.removeItem("usuarioActual");

            // Forzar volver a la página de inicio para cerrar sesión y evitar pantallas inconsistentes
            setPagina("inicio");
            setModalUsuariosAbierto(false);
          }
        }}
      />

      <EditUsuarioModal
        abierto={modalEditarUsuarioAbierto}
        editUsuarioForm={editUsuarioForm}
        setEditUsuarioForm={setEditUsuarioForm}
        onClose={() => {
          setModalEditarUsuarioAbierto(false);
          setEditUsuarioForm(null);
        }}
        onSave={guardarEdicionUsuario}
      />
    </>
  );
}
