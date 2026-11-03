import api from "../api/axios";

// Obtener ubicaciones activas
export const obtenerUbicaciones = async () => {
  const respuesta = await api.get("/api/ubicaciones");
  return respuesta.data;
};

// Obtener una ubicación
export const obtenerUbicacion = async (id) => {
  const respuesta = await api.get(`/api/ubicaciones/${id}`);
  return respuesta.data;
};

// Crear ubicación
export const crearUbicacion = async (datos) => {
  const respuesta = await api.post("/api/ubicaciones", datos);
  return respuesta.data;
};

// Actualizar ubicación
export const actualizarUbicacion = async (id, datos) => {
  const respuesta = await api.put(
    `/api/ubicaciones/${id}`,
    datos
  );

  return respuesta.data;
};

// Desactivar ubicación
export const desactivarUbicacion = async (id) => {
  const respuesta = await api.delete(
    `/api/ubicaciones/${id}`
  );

  return respuesta.data;
};

export const obtenerTodasUbicaciones = async () => {
  const respuesta = await api.get("/api/ubicaciones/todas");
  return respuesta.data;
};

export const reactivarUbicacion = async (id) => {
  const respuesta = await api.patch(
    `/api/ubicaciones/${id}/reactivar`
  );
  return respuesta.data;
};
