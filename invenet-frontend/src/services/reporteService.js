import api from "../api/axios";

// Consultar todos los reportes (Administrador)
export const obtenerReportes = async (params = {}) => {
  const response = await api.get("/api/reportes-anomalias", {
    params,
  });

  return response.data;
};

// Consultar reportes propios (Docente y Técnico)
export const obtenerReportesPropios = async (params = {}) => {
  const response = await api.get("/api/reportes-anomalias/propios", {
    params,
  });

  return response.data;
};

// Consultar detalle de un reporte
export const obtenerReporte = async (id) => {
  const response = await api.get(`/api/reportes-anomalias/${id}`);

  return response.data;
};

// Crear un reporte de anomalía
export const crearReporte = async (datos) => {
  const response = await api.post("/api/reportes-anomalias", datos);

  return response.data;
};

// Cambiar estado de un reporte
export const cambiarEstadoReporte = async (id, datos) => {
  const response = await api.patch(
    `/api/reportes-anomalias/${id}/estado`,
    datos
  );

  return response.data;
};