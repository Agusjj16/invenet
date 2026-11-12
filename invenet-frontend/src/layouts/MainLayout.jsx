
import { useEffect, useMemo, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  Bell,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Monitor,
  MonitorCog,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Users,
  Wrench,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import NotificacionesCampana from "../components/NotificacionesCampana";

// =====================================================
// ESTILOS COMPARTIDOS
// =====================================================

const botonIcono =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50";

// =====================================================
// CONFIGURACIÓN DE NAVEGACIÓN
// =====================================================

const MODULOS = [
  {
  nombre: "Inicio",
  descripcion: "Panel de control",
  ruta: "/dashboard",
  icono: LayoutDashboard,
  permisos: [],
  soloAdministrador: true,
  },
  {
    nombre: "Inicio",
    descripcion: "Panel principal",
    ruta: "/inicio",
    icono: LayoutDashboard,
    permisos: [],
    soloNoAdministrador: true,
  },
  {
    nombre: "Activos",
    descripcion: "Gestión de activos",
    ruta: "/activos",
    icono: Monitor,
    permisos: ["activos.ver"],
  },
  {
    nombre: "Reportes",
    descripcion: "Reportes de anomalías",
    ruta: "/reportes",
    icono: ClipboardList,
    permisos: ["reportes.propios", "reportes.todos"],
  },
  {
    nombre: "Reparaciones",
    descripcion: "Órdenes de reparación",
    ruta: "/ordenes-reparacion",
    icono: Wrench,
    permisos: [
      "ordenes.ver_asignadas",
      "ordenes.ver_todas",
    ],
  },
  {
    nombre: "Usuarios",
    descripcion: "Gestión de usuarios",
    ruta: "/usuarios",
    icono: Users,
    permisos: ["usuarios.ver"],
  },
  {
    nombre: "Historial",
    descripcion: "Historial de activos",
    ruta: "/historial",
    icono: History,
    permisos: ["historial.ver"],
  },
  {
    nombre: "Catálogos",
    descripcion: "Configuración de catálogos",
    ruta: "/catalogos",
    icono: Settings,
    permisos: ["catalogos.gestionar"],
  },
  {
    nombre: "Notificaciones",
    descripcion: "Centro de actividad",
    ruta: "/notificaciones",
    icono: Bell,
    permisos: ["notificaciones.ver"],
  },
];

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function obtenerIniciales(nombre, apellido) {
  const inicialNombre = String(nombre ?? "")
    .trim()
    .charAt(0);

  const inicialApellido = String(apellido ?? "")
    .trim()
    .charAt(0);

  return (
    `${inicialNombre}${inicialApellido}`.toUpperCase() ||
    "U"
  );
}

function obtenerModuloActual(pathname, modulos) {
  const coincidencias = modulos.filter((modulo) => {
    if (modulo.ruta === "/") {
      return pathname === "/";
    }

    return (
      pathname === modulo.ruta ||
      pathname.startsWith(`${modulo.ruta}/`)
    );
  });

  return (
    coincidencias.sort(
      (a, b) => b.ruta.length - a.ruta.length
    )[0] ?? modulos[0] ?? MODULOS[0]
  );
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function MainLayout() {
  // =====================================================
  // AUTENTICACIÓN
  // =====================================================

  const { user, logout } = useAuth();

  // =====================================================
  // UBICACIÓN ACTUAL
  // =====================================================

  const location = useLocation();

  // =====================================================
  // ESTADOS
  // =====================================================

  const [menuAbierto, setMenuAbierto] = useState(false);

  const [menuContraido, setMenuContraido] = useState(false);

  const [cerrandoSesion, setCerrandoSesion] =
    useState(false);

  const [errorLogout, setErrorLogout] = useState("");

  // =====================================================
  // DATOS DEL USUARIO
  // =====================================================

  const nombreCompleto = [
    user?.nombre,
    user?.apellido,
  ]
    .filter(Boolean)
    .join(" ")
    .trim() || "Usuario";

  const nombreRol = user?.rol?.nombre ?? "Usuario";

  const iniciales = obtenerIniciales(
    user?.nombre,
    user?.apellido
  );

  // =====================================================
  // PERMISOS
  // =====================================================

  const permisos = user?.rol?.permisos ?? user?.permisos ?? [];

  const esAdministrador =
    user?.rol?.nombre === "Administrador";

  const nombresPermisos = useMemo(() => {
    return new Set(
      (Array.isArray(permisos) ? permisos : [])
        .map((permiso) =>
          typeof permiso === "string"
            ? permiso
            : permiso?.nombre
        )
        .filter(Boolean)
    );
  }, [permisos]);

  const puedeVerNotificaciones =
    nombresPermisos.has("notificaciones.ver");

  // =====================================================
  // NAVEGACIÓN DISPONIBLE
  // =====================================================

  const enlacesVisibles = useMemo(() => {
  return MODULOS.filter((modulo) => {
    if (modulo.soloAdministrador && !esAdministrador) {
      return false;
    }

    if (modulo.soloNoAdministrador && esAdministrador) {
      return false;
    }

    if (modulo.permisos.length === 0) {
      return true;
    }

    return (
      esAdministrador ||
      modulo.permisos.some((permiso) =>
        nombresPermisos.has(permiso)
      )
    );
  });
  }, [esAdministrador, nombresPermisos]);

  // =====================================================
  // MÓDULO ACTUAL
  // =====================================================

  const moduloActual = obtenerModuloActual(
    location.pathname,
    enlacesVisibles
  );

  const IconoModuloActual = moduloActual.icono;

  // =====================================================
  // CERRAR MENÚ MÓVIL AL NAVEGAR
  // =====================================================

  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  // =====================================================
  // BLOQUEAR SCROLL AL ABRIR MENÚ MÓVIL
  // =====================================================

  useEffect(() => {
    if (!menuAbierto) return;

    const overflowAnterior = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, [menuAbierto]);

  // =====================================================
  // CERRAR MENÚ MÓVIL CON ESC
  // =====================================================

  useEffect(() => {
    if (!menuAbierto) return;

    const manejarTecla = (event) => {
      if (event.key === "Escape") {
        setMenuAbierto(false);
      }
    };

    window.addEventListener("keydown", manejarTecla);

    return () => {
      window.removeEventListener(
        "keydown",
        manejarTecla
      );
    };
  }, [menuAbierto]);

  // =====================================================
  // CERRAR SESIÓN
  // =====================================================

  const handleLogout = async () => {
    if (cerrandoSesion) return;

    setErrorLogout("");
    setCerrandoSesion(true);

    try {
      await logout();
    } catch {
      setErrorLogout(
        "No se pudo cerrar la sesión. Intentá nuevamente."
      );
    } finally {
      setCerrandoSesion(false);
    }
  };

  // =====================================================
  // RENDERIZADO
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =============================================
          BARRA SUPERIOR
      ============================================= */}

      <header className="fixed inset-x-0 top-0 z-40 h-[72px] border-b border-slate-200 bg-white shadow-sm">

        <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-5 lg:px-6">

          {/* =====================================
              LOGOTIPO Y NAVEGACIÓN
          ===================================== */}

          <div className="flex min-w-0 items-center gap-3 sm:gap-4">

            {/* MENÚ MÓVIL */}

            <button
              type="button"
              onClick={() =>
                setMenuAbierto((anterior) => !anterior)
              }
              className={`${botonIcono} md:hidden`}
              aria-label={
                menuAbierto
                  ? "Cerrar menú lateral"
                  : "Abrir menú lateral"
              }
              aria-expanded={menuAbierto}
              aria-controls="invenet-sidebar"
            >
              {menuAbierto ? (
                <X size={20} />
              ) : (
                <Menu size={20} />
              )}
            </button>

            {/* IDENTIDAD DE INVENET */}

            <div className="flex shrink-0 items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm">
                <MonitorCog
                  size={24}
                  strokeWidth={1.8}
                />
              </div>

              <div className="hidden flex-col sm:flex">

                <span className="text-lg font-extrabold leading-tight tracking-[0.08em] text-slate-900">
                  INVENET
                </span>

                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Gestión de activos
                </span>

              </div>

            </div>

            {/* SEPARADOR */}

            <div className="mx-1 hidden h-8 w-px bg-slate-200 lg:block" />

            {/* UBICACIÓN ACTUAL */}

            <div className="hidden min-w-0 items-center gap-3 lg:flex">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <IconoModuloActual size={18} />
              </div>

              <div className="min-w-0">

                <p className="truncate text-sm font-bold text-slate-800">
                  {moduloActual.nombre}
                </p>

                <p className="truncate text-xs text-slate-400">
                  {moduloActual.descripcion}
                </p>

              </div>

            </div>

          </div>

          {/* =====================================
              ACCIONES DEL USUARIO
          ===================================== */}

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">

            {/* CAMPANA DE NOTIFICACIONES */}

            {puedeVerNotificaciones && (
              <div className="flex items-center justify-center">
                <NotificacionesCampana key={user?.id} />
              </div>
            )}

            {/* SEPARADOR */}

            <div className="mx-1 hidden h-8 w-px bg-slate-200 sm:block" />

            {/* AVATAR */}

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold text-blue-700">
              {iniciales}
            </div>

            {/* DATOS DEL USUARIO */}

            <div className="hidden min-w-0 text-left sm:block">

              <p
                className="max-w-44 truncate text-sm font-bold text-slate-800"
                title={nombreCompleto}
              >
                {nombreCompleto}
              </p>

              <p
                className="max-w-44 truncate text-xs font-medium text-slate-400"
                title={nombreRol}
              >
                {nombreRol}
              </p>

            </div>

            {/* CERRAR SESIÓN */}

            <button
              type="button"
              onClick={handleLogout}
              disabled={cerrandoSesion}
              title={
                cerrandoSesion
                  ? "Cerrando sesión..."
                  : "Cerrar sesión"
              }
              aria-label="Cerrar sesión"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut size={19} />
            </button>

          </div>

        </div>

      </header>

      {/* =============================================
          FONDO DEL MENÚ MÓVIL
      ============================================= */}

      {menuAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú lateral"
          onClick={() => setMenuAbierto(false)}
          className="fixed inset-0 top-[72px] z-30 bg-slate-950/40 backdrop-blur-[2px] md:hidden"
        />
      )}

      {/* =============================================
          MENÚ LATERAL
      ============================================= */}

      <aside
        id="invenet-sidebar"
        className={`fixed bottom-0 left-0 top-[72px] z-30 flex flex-col border-r border-slate-200 bg-white shadow-xl shadow-slate-900/5 transition-[width,transform] duration-200 ease-in-out md:shadow-none ${
          menuContraido ? "md:w-[84px]" : "md:w-64"
        } w-64 ${
          menuAbierto
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >

        {/* =====================================
            ENCABEZADO DEL MENÚ
        ===================================== */}

        <div
          className={`flex shrink-0 items-center border-b border-slate-100 py-5 ${
            menuContraido
              ? "justify-between px-4 md:justify-center md:px-2"
              : "justify-between px-5"
          }`}
        >

          <div
            className={`min-w-0 ${
              menuContraido ? "md:hidden" : ""
            }`}
          >

            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-700">
              Menú principal
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Navegación del sistema
            </p>

          </div>

          {/* CONTRAER / EXPANDIR EN ESCRITORIO */}

          <button
            type="button"
            onClick={() =>
              setMenuContraido((anterior) => !anterior)
            }
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 md:inline-flex"
            title={
              menuContraido
                ? "Expandir menú"
                : "Contraer menú"
            }
            aria-label={
              menuContraido
                ? "Expandir menú lateral"
                : "Contraer menú lateral"
            }
            aria-expanded={!menuContraido}
          >
            {menuContraido ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>

        </div>

        {/* =====================================
            ENLACES DE NAVEGACIÓN
        ===================================== */}

        <nav
          aria-label="Navegación principal"
          className="min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-5"
        >

          {enlacesVisibles.map((item) => {
            const Icono = item.icono;

            return (
              <NavLink
                key={item.ruta}
                to={item.ruta}
                end={item.ruta === "/"}
                onClick={() => setMenuAbierto(false)}
                title={
                  menuContraido
                    ? item.nombre
                    : undefined
                }
                className={({ isActive }) =>
                  `group relative flex min-h-12 items-center rounded-xl text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                    menuContraido
                      ? "justify-start gap-3 px-3 md:justify-center md:px-2"
                      : "gap-3 px-3"
                  } ${
                    isActive
                      ? "bg-blue-700 text-white shadow-sm shadow-blue-700/20"
                      : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                  }`
                }
              >

                {({ isActive }) => (
                  <>
                    <Icono
                      size={20}
                      strokeWidth={1.8}
                      className={`shrink-0 transition-transform duration-150 group-hover:scale-105 ${
                        isActive
                          ? "text-white"
                          : "text-slate-500 group-hover:text-blue-700"
                      }`}
                    />

                    <span
                      className={`min-w-0 flex-1 truncate ${
                        menuContraido ? "md:hidden" : ""
                      }`}
                    >
                      {item.nombre}
                    </span>

                    {/* INDICADOR DE SECCIÓN ACTIVA */}

                    {isActive && (
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full bg-white/90 ${
                          menuContraido ? "md:hidden" : ""
                        }`}
                      />
                    )}
                  </>
                )}

              </NavLink>
            );
          })}

        </nav>
      </aside>

      {/* =============================================
          MENSAJE DE ERROR AL CERRAR SESIÓN
      ============================================= */}

      {errorLogout && (
        <div
          role="alert"
          className="fixed right-4 top-20 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 shadow-lg"
        >

          <div className="min-w-0 flex-1">

            <p className="text-sm font-semibold text-red-800">
              Error al cerrar sesión
            </p>

            <p className="mt-1 text-sm text-red-700">
              {errorLogout}
            </p>

          </div>

          <button
            type="button"
            onClick={() => setErrorLogout("")}
            className="shrink-0 rounded-lg p-1 text-red-600 transition hover:bg-red-100"
            aria-label="Cerrar mensaje de error"
          >
            <X size={17} />
          </button>

        </div>
      )}

      {/* =============================================
          CONTENIDO PRINCIPAL
      ============================================= */}

      <main
        className={`min-h-screen pt-[72px] transition-[padding] duration-200 ${
          menuContraido
            ? "md:pl-[84px]"
            : "md:pl-64"
        }`}
      >

        <div className="mx-auto w-full max-w-[1700px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">

          <Outlet />

        </div>

      </main>

    </div>
  );
}
