import api from "../api/axios";

// ==========================================
// CONSULTAR OPCIONES
// ==========================================

export const obtenerOpcionesCaracteristica = async (
  caracteristicaId
) => {
  const respuesta = await api.get(
    `/api/caracteristicas/${caracteristicaId}/opciones`
  );

  return respuesta.data;
};

// ==========================================
// CREAR OPCIÓN
// ==========================================

export const crearOpcionCaracteristica = async (
  caracteristicaId,
  datos
) => {
  const respuesta = await api.post(
    `/api/caracteristicas/${caracteristicaId}/opciones`,
    datos
  );

  return respuesta.data;
};

// ==========================================
// EDITAR OPCIÓN
// ==========================================

export const actualizarOpcionCaracteristica = async (
  caracteristicaId,
  opcionId,
  datos
) => {
  const respuesta = await api.put(
    `/api/caracteristicas/${caracteristicaId}/opciones/${opcionId}`,
    datos
  );

  return respuesta.data;
};

// ==========================================
// ELIMINAR OPCIÓN
// ==========================================

export const eliminarOpcionCaracteristica = async (
  caracteristicaId,
  opcionId
) => {
  const respuesta = await api.delete(
    `/api/caracteristicas/${caracteristicaId}/opciones/${opcionId}`
  );

  return respuesta.data;
};
