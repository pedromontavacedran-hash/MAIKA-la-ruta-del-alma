import type { Producto } from "../types";

export const VELAS_INICIALES: Producto[] = [];

export const INCIENSOS_INICIALES: Producto[] = [
  { id: 101, nombre: "Incienso Sándalo", precio: 6.5, stock: 5, imagen: "/incienso-sandalo.jpg", categoria: "inciensos", descripcion: "Meditación" },
  { id: 102, nombre: "Incienso Lavanda", precio: 5.9, stock: 5, imagen: "/incienso-lavanda.jpg", categoria: "inciensos", descripcion: "Calma" },
  { id: 103, nombre: "Incienso Ruda", precio: 7.2, stock: 5, imagen: "/incienso-ruda.jpg", categoria: "inciensos", descripcion: "Protección" },
  { id: 104, nombre: "Incienso Jazmín", precio: 6.8, stock: 5, imagen: "/incienso-jazmin.jpg", categoria: "inciensos", descripcion: "Amor" },
  { id: 105, nombre: "Incienso Palo Santo", precio: 8.5, stock: 5, imagen: "/incienso-palosanto.jpg", categoria: "inciensos", descripcion: "Limpieza" },
  { id: 106, nombre: "Incienso Mirra", precio: 7.9, stock: 5, imagen: "/incienso-mirra.jpg", categoria: "inciensos", descripcion: "Espiritualidad" },
  { id: 107, nombre: "Incienso Canela", precio: 6.4, stock: 5, imagen: "/incienso-canela.jpg", categoria: "inciensos", descripcion: "Éxito" },
  { id: 108, nombre: "Incienso Rosa", precio: 6.1, stock: 5, imagen: "/incienso-rosa.jpg", categoria: "inciensos", descripcion: "Armonía" },
];

export const FIGURAS_INICIALES: Producto[] = [];

export const KITS_INICIALES: Producto[] = [
  { id: 301, nombre: "Kit Luna Nueva", precio: 29.9, stock: 10, imagen: "/kit-luna-nueva.jpg", categoria: "kits", descripcion: "Vela blanca, incienso ruda y figura protección. Ideal para ritual de inicio." },
  { id: 302, nombre: "Kit Protección Hogar", precio: 24.5, stock: 8, imagen: "/kit-proteccion.jpg", categoria: "kits", descripcion: "Vela negra, incienso palo santo. Limpieza y protección." },
];

/**
 * Sin productos semilla: "Joyería del alma" arranca vacía a propósito (no se inventan
 * productos/precios/materiales). El admin da de alta las piezas reales desde
 * Inventario / Nuevo producto, con id >= 401 (rango reservado, ver restarStockCatalogo.ts).
 */
export const JOYAS_INICIALES: Producto[] = [];
