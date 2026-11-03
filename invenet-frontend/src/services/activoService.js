import api from "../api/axios";

// Listar activos
export const obtenerActivos = async (params = {}) => {
  const response = await api.get("/api/activos", {
    params,
  });

  return response.data;
};

// Obtener detalle
export const obtenerActivo = async (id) => {
  const response = await api.get(`/api/activos/${id}`);
  return response.data;
};

// Registrar activo
export const crearActivo = async (datos) => {
  const response = await api.post("/api/activos", datos);
  return response.data;
};

export const crearActivosLote = async (activos) => {
  const response = await api.post("/api/activos/lote", {
    activos,
  });

  return response.data;
};

export const actualizarActivo = async (id, datos) => {
  const response = await api.put(`/api/activos/${id}`, datos);
  return response.data;
};

export const darDeBajaActivo = async (id) => {
  const response = await api.delete(`/api/activos/${id}`);
  return response.data;
};

// Listar activos dados de baja
export const obtenerActivosDadosDeBaja = async (params = {}) => {
  const response = await api.get("/api/activos/dados-de-baja", {
    params,
  });

  return response.data;
};

// Consultar detalle de un activo dado de baja
export const obtenerActivoDadoDeBaja = async (id) => {
  const response = await api.get(
    `/api/activos/dados-de-baja/${id}`
  );

  return response.data;
};

// Consultar historial individual de un activo
export const obtenerHistorialActivo = async (id) => {
  const response = await api.get(`/api/activos/${id}/historial`);

  return response.data;
};