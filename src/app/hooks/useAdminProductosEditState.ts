import { useEffect, useState } from "react";
import type { Pagina, Producto } from "../../types";

export type CategoriaProductoEditable = "velas" | "inciensos" | "figuras" | "joyas";

export type UseAdminProductosEditStateInput = {
  pagina: Pagina;
  categoriaSeleccionada: string;
  loadCategoryImage: (categoriaId: string) => void;
  velas: Producto[];
  inciensos: Producto[];
  figuras: Producto[];
  joyas: Producto[];
};

/**
 * Estado del editor de productos del admin (editar existente + crear nuevo) y sus
 * efectos: precargar imagen de categoría al entrar en "editarCategorias" y
 * autoseleccionar el primer producto al entrar en "editarProductos".
 */
export function useAdminProductosEditState(p: UseAdminProductosEditStateInput) {
  const [categoriaEditarProductos, setCategoriaEditarProductos] = useState<CategoriaProductoEditable>("velas");
  const [productoSeleccionado, setProductoSeleccionado] = useState<string>("");
  const [previewProducto, setPreviewProducto] = useState<string | null>(null);
  const [nombreImagenProducto, setNombreImagenProducto] = useState("");
  const [colorProducto, setColorProducto] = useState<string>("#ffffff");
  const [tamanoProducto, setTamanoProducto] = useState<string>("22");
  const [estiloTextoProducto, setEstiloTextoProducto] = useState<string>("normal");

  const [categoriaNuevoProducto, setCategoriaNuevoProducto] = useState<CategoriaProductoEditable>("velas");
  const [nuevoProductoNombre, setNuevoProductoNombre] = useState("");
  const [nuevoProductoPrecio, setNuevoProductoPrecio] = useState("10");
  const [nuevoProductoStock, setNuevoProductoStock] = useState(5);
  const [nuevoProductoDescripcion, setNuevoProductoDescripcion] = useState("");
  const [nuevoProductoImagen, setNuevoProductoImagen] = useState<string | null>(null);
  const [nuevoProductoNombreImagen, setNuevoProductoNombreImagen] = useState("");
  const [nuevoProductoTamano, setNuevoProductoTamano] = useState("22");
  const [nuevoProductoColor, setNuevoProductoColor] = useState("#ffffff");
  const [nuevoProductoEstilo, setNuevoProductoEstilo] = useState<string>("normal");

  useEffect(() => {
    if (p.pagina !== "editarCategorias") return;
    p.loadCategoryImage(p.categoriaSeleccionada);
  }, [p.pagina, p.categoriaSeleccionada, p.loadCategoryImage]);

  useEffect(() => {
    if (p.pagina !== "editarProductos") return;
    const list =
      categoriaEditarProductos === "velas" ? p.velas :
      categoriaEditarProductos === "inciensos" ? p.inciensos :
      categoriaEditarProductos === "figuras" ? p.figuras :
      p.joyas;
    const first = list[0];
    if (first) {
      setProductoSeleccionado(`${categoriaEditarProductos}-${first.id}`);
      setTamanoProducto(String(first.nombreTamano ?? 22));
      setColorProducto(first.nombreColor ?? "#ffffff");
      setEstiloTextoProducto(first.nombreEstilo ?? "normal");
      setPreviewProducto(first.imagen ? first.imagen : null);
      setNombreImagenProducto("");
    }
  }, [p.pagina, categoriaEditarProductos, p.velas, p.inciensos, p.figuras, p.joyas]);

  return {
    categoriaEditarProductos,
    setCategoriaEditarProductos,
    productoSeleccionado,
    setProductoSeleccionado,
    previewProducto,
    setPreviewProducto,
    nombreImagenProducto,
    setNombreImagenProducto,
    colorProducto,
    setColorProducto,
    tamanoProducto,
    setTamanoProducto,
    estiloTextoProducto,
    setEstiloTextoProducto,
    categoriaNuevoProducto,
    setCategoriaNuevoProducto,
    nuevoProductoNombre,
    setNuevoProductoNombre,
    nuevoProductoPrecio,
    setNuevoProductoPrecio,
    nuevoProductoStock,
    setNuevoProductoStock,
    nuevoProductoDescripcion,
    setNuevoProductoDescripcion,
    nuevoProductoImagen,
    setNuevoProductoImagen,
    nuevoProductoNombreImagen,
    setNuevoProductoNombreImagen,
    nuevoProductoTamano,
    setNuevoProductoTamano,
    nuevoProductoColor,
    setNuevoProductoColor,
    nuevoProductoEstilo,
    setNuevoProductoEstilo
  };
}
