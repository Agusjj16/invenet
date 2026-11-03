import api from "../api/axios";

// Todas las órdenes: Administrador
export const obtenerOrdenes = async (params = {}) => {
  const response = await api.get("/api/ordenes-reparacion", {
    params,
  });

  return response.data;
};

// Órdenes asignadas: Técnico
export const obtenerOrdenesAsignadas = async (params = {}) => {
  const response = await api.get(
    "/api/ordenes-reparacion/asignadas",
    { params }
  );

  return response.data;
};

// Detalle de una orden
export const obtenerOrden = async (id) => {
  const response = await api.get(`/api/ordenes-reparacion/${id}`);

  return response.data;
};

// Crear orden desde un reporte
export const crearOrden = async (datos) => {
  const response = await api.post("/api/ordenes-reparacion", datos);

  return response.data;
};

// Confirmar recepción del equipo
export const recibirOrden = async (id) => {
  const response = await api.patch(
    `/api/ordenes-reparacion/${id}/recepcion`
  );

  return response.data;
};

// Iniciar reparación
export const iniciarOrden = async (id) => {
  const response = await api.patch(
    `/api/ordenes-reparacion/${id}/iniciar`
  );

  return response.data;
};

// Registrar diagnóstico y trabajo
export const actualizarTrabajoOrden = async (id, datos) => {
  const response = await api.put(
    `/api/ordenes-reparacion/${id}/trabajo`,
    datos
  );

  return response.data;
};

// Finalizar reparación
export const finalizarOrden = async (id) => {
  const response = await api.patch(
    `/api/ordenes-reparacion/${id}/finalizar`
  );

  return response.data;
};