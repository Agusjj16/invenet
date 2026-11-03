import api from "../api/axios";

export const obtenerCategorias = async () => {
  const respuesta = await api.get("/api/categorias");
  return respuesta.data;
};

export const obtenerCategoria = async (id) => {
  const respuesta = await api.get(`/api/categorias/${id}`);
  return respuesta.data;
};

export const crearCategoria = async (datos) => {
  const respuesta = await api.post("/api/categorias", datos);
  return respuesta.data;
};

export const actualizarCategoria = async (id, datos) => {
  const respuesta = await api.put(
    `/api/categorias/${id}`,
    datos
  );
  return respuesta.data;
};

export const desactivarCategoria = async (id) => {
  const respuesta = await api.delete(`/api/categorias/${id}`);
  return respuesta.data;
};

export const obtenerTodasCategorias = async () => {
  const respuesta = await api.get("/api/categorias/todas");
  return respuesta.data;
};

export const reactivarCategoria = async (id) => {
  const respuesta = await api.patch(
    `/api/categorias/${id}/reactivar`
  );
  return respuesta.data;
};
