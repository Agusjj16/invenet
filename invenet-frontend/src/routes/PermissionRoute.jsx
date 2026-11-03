import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PermissionRoute({ permisosRequeridos = [] }) {
  const { user } = useAuth();

  const permisos = user?.rol?.permisos ?? user?.permisos ?? [];

  const esAdministrador = user?.rol?.nombre === "Administrador";

  const autorizado =
    esAdministrador ||
    permisosRequeridos.some((nombre) =>
      permisos.some((permiso) =>
        typeof permiso === "string"
          ? permiso === nombre
          : permiso.nombre === nombre
      )
    );

  if (!autorizado) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}