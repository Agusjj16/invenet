import api from "../api/axios";

// CRUD de características técnicas

export const obtenerCaracteristicas = async () => {
  const respuesta = await api.get("/api/caracteristicas");
  return respuesta.data;
};

export const obtenerCaracteristica = async (id) => {
  const respuesta = await api.get(`/api/caracteristicas/${id}`);
  return respuesta.data;
};

export const crearCaracteristica = async (datos) => {
  const respuesta = await api.post("/api/caracteristicas", datos);
  return respuesta.data;
};

export const actualizarCaracteristica = async (id, datos) => {
  const respuesta = await api.put(
    `/api/caracteristicas/${id}`,
    datos
  );
  return respuesta.data;
};

// Características asociadas a una categoría

export const obtenerCaracteristicasPorCategoria = async (
  categoriaId
) => {
  const respuesta = await api.get(
    `/api/categorias/${categoriaId}/caracteristicas`
  );
  return respuesta.data;
};

export const asociarCaracteristica = async (
  categoriaId,
  datos
) => {
  const respuesta = await api.post(
    `/api/categorias/${categoriaId}/caracteristicas`,
    datos
  );
  return respuesta.data;
};

export const actualizarObligatoriedad = async (
  categoriaId,
  caracteristicaId,
  obligatorio
) => {
  const respuesta = await api.patch(
    `/api/categorias/${categoriaId}/caracteristicas/${caracteristicaId}`,
    { obligatorio }
  );
  return respuesta.data;
};

export const desvincularCaracteristica = async (
  categoriaId,
  caracteristicaId
) => {
  const respuesta = await api.delete(
    `/api/categorias/${categoriaId}/caracteristicas/${caracteristicaId}`
  );
  return respuesta.data;
};
