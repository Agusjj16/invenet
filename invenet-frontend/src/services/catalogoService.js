import api from "../api/axios";

// Obtener categorías
export const obtenerCategorias = async () => {
  const response = await api.get("/api/categorias");
  return response.data;
};

// Obtener ubicaciones
export const obtenerUbicaciones = async () => {
  const response = await api.get("/api/ubicaciones");
  return response.data;
};

// Obtener características de una categoría
export const obtenerCaracteristicasPorCategoria = async (categoriaId) => {
  const response = await api.get(
    `/api/categorias/${categoriaId}/caracteristicas`
  );

  return response.data;
};