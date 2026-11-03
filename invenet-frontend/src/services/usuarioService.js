import api from "../api/axios";

// Listar usuarios activos
export const obtenerUsuarios = async (params = {}) => {
  const respuesta = await api.get("/api/usuarios", {
    params,
  });

  return respuesta.data;
};

// Consultar un usuario activo
export const obtenerUsuario = async (id) => {
  const respuesta = await api.get(`/api/usuarios/${id}`);
  return respuesta.data;
};

// Crear usuario
export const crearUsuario = async (datos) => {
  const respuesta = await api.post("/api/usuarios", datos);
  return respuesta.data;
};

// Actualizar datos personales
export const actualizarUsuario = async (id, datos) => {
  const respuesta = await api.put(
    `/api/usuarios/${id}`,
    datos
  );

  return respuesta.data;
};

// Cambiar rol
export const cambiarRolUsuario = async (id, rolId) => {
  const respuesta = await api.patch(
    `/api/usuarios/${id}/rol`,
    { rol_id: rolId }
  );

  return respuesta.data;
};

// Desactivar usuario
export const desactivarUsuario = async (id) => {
  const respuesta = await api.delete(
    `/api/usuarios/${id}`
  );

  return respuesta.data;
};

// Listar usuarios desactivados
export const obtenerUsuariosDesactivados = async () => {
  const respuesta = await api.get(
    "/api/usuarios/desactivados"
  );

  return respuesta.data;
};

// Restaurar usuario
export const restaurarUsuario = async (id) => {
  const respuesta = await api.patch(
    `/api/usuarios/${id}/restaurar`
  );

  return respuesta.data;
};
