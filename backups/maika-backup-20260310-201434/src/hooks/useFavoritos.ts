import { useState, useEffect } from "react";

export function useFavoritos() {
  const [favoritos, setFavoritos] = useState<number[]>(() => {
    try {
      const guardado = localStorage.getItem("maika_favoritos");
      return guardado ? JSON.parse(guardado) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("maika_favoritos", JSON.stringify(favoritos));
  }, [favoritos]);

  const addFavorito = (id: number) => {
    setFavoritos((prev) => {
      if (!prev.includes(id)) {
        return [...prev, id];
      }
      return prev;
    });
  };

  const removeFavorito = (id: number) => {
    setFavoritos((prev) => prev.filter((favId) => favId !== id));
  };

  const toggleFavorito = (id: number) => {
    setFavoritos((prev) => {
      if (prev.includes(id)) {
        return prev.filter((favId) => favId !== id);
      }
      return [...prev, id];
    });
  };

  const isFavorito = (id: number) => {
    return favoritos.includes(id);
  };

  return {
    favoritos,
    addFavorito,
    removeFavorito,
    toggleFavorito,
    isFavorito,
  };
}
