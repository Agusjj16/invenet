import api from "../api/axios";

// =====================================
// CONSULTAR HISTORIAL GENERAL
// =====================================

export const obtenerHistorialGeneral = async (params = {}) => {
  const response = await api.get("/api/historial-activos", {
    params,
  });

  return response.data;
};