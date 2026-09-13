import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useEffect } from "react";
import ModalUsuarios from "../components/ModalUsuarios";
import EditUsuarioModal from "../components/EditUsuarioModal";
import type { EditUsuarioForm, Pagina, Usuario } from "../types";
import type { MaikaUsuarioLS } from "../utils/maikaUsuarios";

type Props = {
  modalUsuariosAbierto: boolean;
  listaUsuarios: Usuario[];
  setModalUsuariosAbierto: (v: boolean) => void;
  /** Prepara y muestra el formulario embebido en gestión. */
  onAbrirFormularioAltaAdmin?: () => void;
  panelAltaUsuario?: ReactNode;
  mostrarNotificacion: (mensaje: string, tipo?: "normal" | "exito" | "error") => void;
  abrirEditorUsuario: (usuario: Usuario) => void;
  /** Ficha ampliada (solo lectura + acciones); distinto del modal de edición. */
  abrirDetalleCliente: (usuario: Usuario) => void;
  setListaUsuarios: (usuarios: Usuario[]) => void;
  cargarUsuarios: () => void;
  normalizarTelefonoES9: (telefono: string) => string;
  leerMaikaUsuarios: () => MaikaUsuarioLS[];
  guardarMaikaUsuarios: (usuarios: MaikaUsuarioLS[]) => void;
  usuario: Usuario | null;
  setUsuario: (u: Usuario | null) => void;
  normalizarTelefonoBizum: (telefono: string) => string;
  setPagina: (p: Pagina) => void;
  modalEditarUsuarioAbierto: boolean;
  editUsuarioForm: EditUsuarioForm | null;
  setEditUsuarioForm: Dispatch<SetStateAction<EditUsuarioForm | null>>;
  setModalEditarUsuarioAbierto: (v: boolean) => void;
  guardarEdicionUsuario: () => void;
};

export default function GestionUsuariosPage(props: Props) {
  const {
    modalUsuariosAbierto,
    listaUsuarios,
    setModalUsuariosAbierto,
    onAbrirFormularioAltaAdmin,
    panelAltaUsuario,
    mostrarNotificacion,
    abrirEditorUsuario,
    abrirDetalleCliente,
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

  useEffect(() => {
    cargarUsuarios();
    // Solo al montar la página de gestión (referencia estable no requerida)
     
  }, []);

  return (
    <>
      <ModalUsuarios
        abierto={modalUsuariosAbierto}
        usuarios={listaUsuarios}
        onClose={() => setModalUsuariosAbierto(false)}
        onAbrirFormularioAltaAdmin={onAbrirFormularioAltaAdmin}
        panelAltaUsuario={panelAltaUsuario}
        mostrarNotificacion={mostrarNotificacion}
        onEditUsuario={abrirEditorUsuario}
        onVerDetalle={abrirDetalleCliente}
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

          const coincideUsuarioEnMemoria =
            !!usuario &&
            !!usuarioABorrar &&
            (String(usuario.id) === String(id) ||
              (usuario.telefono &&
                usuarioABorrar.telefono &&
                normalizarTelefonoBizum(usuario.telefono) === normalizarTelefonoBizum(usuarioABorrar.telefono)));

          if (coincideUsuarioEnMemoria) {
            setUsuario(null);

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
