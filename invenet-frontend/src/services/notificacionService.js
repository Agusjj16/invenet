import api from "../api/axios";

// Obtener notificaciones paginadas
export const obtenerNotificaciones = async (params = {}) => {
  const response = await api.get("/api/notificaciones", {
    params,
  });

  return response.data;
};

// Consultar cantidad global de notificaciones sin leer
export const obtenerCantidadNoLeidas = async () => {
  const response = await api.get(
    "/api/notificaciones/no-leidas"
  );

  return response.data;
};

// Marcar una notificación como leída
export const marcarNotificacionLeida = async (id) => {
  const response = await api.patch(
    `/api/notificaciones/${id}/leer`
  );

  return response.data;
};

// Marcar todas las notificaciones como leídas
export const marcarTodasLeidas = async () => {
  const response = await api.patch(
    "/api/notificaciones/leer-todas"
  );

  return response.data;
};