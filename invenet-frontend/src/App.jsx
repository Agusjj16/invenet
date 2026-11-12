
import { Navigate, Route, Routes } from "react-router-dom";

// =====================================
// PÁGINAS
// =====================================

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

import Activos from "./pages/Activos";
import ActivoDetalle from "./pages/ActivoDetalle";
import ActivoCrear from "./pages/ActivoCrear";
import ActivosLote from "./pages/ActivosLote";
import ActivoEditar from "./pages/ActivoEditar";

import ActivosDadosDeBaja from "./pages/ActivosDadosDeBaja";
import ActivoDadoDeBajaDetalle from "./pages/ActivoDadoDeBajaDetalle";
import ActivoHistorial from "./pages/ActivoHistorial";
import HistorialActivos from "./pages/HistorialActivos";
import Reportes from "./pages/Reportes";
import ReporteCrear from "./pages/ReporteCrear";
import ReporteDetalle from "./pages/ReporteDetalle";
import OrdenesReparacion from "./pages/OrdenesReparacion";
import OrdenCrear from "./pages/OrdenCrear";
import OrdenDetalle from "./pages/OrdenDetalle";
import Notificaciones from "./pages/Notificaciones";
import Usuarios from "./pages/Usuarios";
import UsuarioCrear from "./pages/UsuarioCrear";
import UsuarioDetalle from "./pages/UsuarioDetalle";
import UsuariosDesactivados from "./pages/UsuariosDesactivados";
import Catalogos from "./pages/Catalogos";
import Categorias from "./pages/Categorias";
import Ubicaciones from "./pages/Ubicaciones";
import Caracteristicas from "./pages/Caracteristicas";
import OpcionesCaracteristicas from "./pages/OpcionesCaracteristicas";
import { useAuth } from "./context/AuthContext";
import Inicio from "./pages/Inicio";

// =====================================
// LAYOUT
// =====================================

import MainLayout from "./layouts/MainLayout";

// =====================================
// PROTECCIÓN DE RUTAS
// =====================================

import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import PermissionRoute from "./routes/PermissionRoute";

// =====================================
// APP
// =====================================

function EntradaPrincipal() {
  const { user } = useAuth();

  return user?.rol?.nombre === "Administrador"
    ? <Navigate to="/dashboard" replace />
    : <Navigate to="/inicio" replace />;
}

function SoloAdministrador({ children }) {
  const { user } = useAuth();

  if (user?.rol?.nombre !== "Administrador") {
    return <Navigate to="/inicio" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>

      {/* =====================================
          RUTAS PÚBLICAS
      ===================================== */}

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* =====================================
          RUTAS AUTENTICADAS
      ===================================== */}

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>

          {/* =====================================
              INICIO SEGÚN ROL
          ===================================== */}

          <Route
            index
            element={<EntradaPrincipal />}
          />

          <Route
            path="inicio"
            element={<Inicio />}
          />

          {/* =====================================
              DASHBOARD - SOLO ADMINISTRADOR
          ===================================== */}

          <Route
            path="dashboard"
            element={
              <SoloAdministrador>
                <Dashboard />
              </SoloAdministrador>
            }
          />

          {/* =====================================
              GESTIÓN DE ACTIVOS - CONSULTAR
          ===================================== */}

          <Route
            element={
              <PermissionRoute
                permisosRequeridos={["activos.ver"]}
              />
            }
          >
            <Route
              path="activos"
              element={<Activos />}
            />

            <Route
              path="activos/:id"
              element={<ActivoDetalle />}
            />
          </Route>

          {/* =====================================
              GESTIÓN DE ACTIVOS - CREAR
          ===================================== */}

          <Route
            element={
              <PermissionRoute
                permisosRequeridos={["activos.crear"]}
              />
            }
          >
            <Route
              path="activos/nuevo"
              element={<ActivoCrear />}
            />

            <Route
              path="activos/lote"
              element={<ActivosLote />}
            />
          </Route>

          {/* =====================================
              GESTIÓN DE ACTIVOS - EDITAR
          ===================================== */}

          <Route
            element={
              <PermissionRoute
                permisosRequeridos={["activos.editar"]}
              />
            }
          >
            <Route
              path="activos/:id/editar"
              element={<ActivoEditar />}
            />
          </Route>

          {/* =====================================
              ACTIVOS DADOS DE BAJA
          ===================================== */}

          <Route
            element={
              <PermissionRoute
                permisosRequeridos={["activos.desactivar"]}
              />
            }
          >
            {/* LISTADO DE ACTIVOS DADOS DE BAJA */}

            <Route
              path="activos/bajas"
              element={<ActivosDadosDeBaja />}
            />

            {/* DETALLE DE ACTIVO DADO DE BAJA */}

            <Route
              path="activos/bajas/:id"
              element={<ActivoDadoDeBajaDetalle />}
            />
          </Route>

          {/* =====================================
              REPORTES DE ANOMALÍAS
          ===================================== */}

          <Route
            element={
              <PermissionRoute
                permisosRequeridos={[
                  "reportes.propios",
                  "reportes.todos",
                ]}
              />
            }
          >
            <Route
              path="reportes"
              element={<Reportes />}
            />

            <Route
              path="reportes/:id"
              element={<ReporteDetalle />}
            />
          </Route>

          {/* =====================================
            CREAR REPORTE DE ANOMALÍA
          ===================================== */}

        <Route
          element={
            <PermissionRoute
              permisosRequeridos={["reportes.crear"]}
            />
          }
        >
          <Route
            path="reportes/nuevo"
            element={<ReporteCrear />}
          />
        </Route>

          {/* =====================================
              ÓRDENES DE REPARACIÓN
          ===================================== */}

        <Route
          element={
            <PermissionRoute
              permisosRequeridos={[
                "ordenes.ver_todas",
                "ordenes.ver_asignadas",
              ]}
            />
          }
        >
          <Route
            path="ordenes-reparacion"
            element={<OrdenesReparacion />}
          />

            <Route
              path="ordenes-reparacion/:id"
              element={<OrdenDetalle />}
            />
        </Route>

        <Route
          element={
            <PermissionRoute
              permisosRequeridos={["ordenes.crear"]}
            />
          }
        >
          <Route
            path="ordenes-reparacion/nueva"
            element={<OrdenCrear />}
          />
        </Route>

          {/* =====================================
              GESTIÓN DE USUARIOS - CONSULTAR
          ===================================== */}

          <Route
            element={
              <PermissionRoute
                permisosRequeridos={["usuarios.ver"]}
              />
            }
          >
            <Route
              path="usuarios"
              element={<Usuarios />}
            />

            <Route
              path="usuarios/desactivados"
              element={<UsuariosDesactivados />}
            />

            <Route
              path="usuarios/:id"
              element={<UsuarioDetalle />}
            />
          </Route>

          {/* =====================================
              GESTIÓN DE USUARIOS - CREAR
          ===================================== */}

          <Route
            element={
              <PermissionRoute
                permisosRequeridos={["usuarios.crear"]}
              />
            }
          >
            <Route
              path="usuarios/nuevo"
              element={<UsuarioCrear />}
            />
          </Route>

          {/* =====================================
              HISTORIAL DE ACTIVOS
          ===================================== */}

          <Route
            element={
              <PermissionRoute
                permisosRequeridos={["historial.ver"]}
              />
            }
          >
            <Route
              path="historial"
              element={<HistorialActivos />}
            />
            <Route
              path="activos/:id/historial"
              element={<ActivoHistorial />}
            />
          </Route>

          {/* =====================================
              CATÁLOGOS
          ===================================== */}

          <Route
            element={
              <PermissionRoute
                permisosRequeridos={["catalogos.gestionar"]}
              />
            }
          >
            <Route
              path="catalogos"
              element={<Catalogos />}
            />

            <Route
              path="catalogos/categorias"
              element={<Categorias />}
            />

            <Route
              path="catalogos/ubicaciones"
              element={<Ubicaciones />}
            />

            <Route
              path="catalogos/caracteristicas"
              element={<Caracteristicas />}
            />

            <Route
              path="catalogos/opciones"
              element={<OpcionesCaracteristicas />}
            />
          </Route>

          {/* =====================================
              NOTIFICACIONES
          ===================================== */}

          <Route
            element={
              <PermissionRoute
                permisosRequeridos={["notificaciones.ver"]}
              />
            }
          >
            <Route
              path="notificaciones"
              element={<Notificaciones />}
            />
          </Route>

        </Route>
      </Route>

      {/* =====================================
          RUTAS INEXISTENTES
      ===================================== */}

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}
