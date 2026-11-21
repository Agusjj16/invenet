
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Eye,
  Filter,
  Plus,
  RefreshCw,
  UserRound,
  ExternalLink,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import {
  obtenerReportes,
  obtenerReportesPropios,
} from "../services/reporteService";

// =====================================================
// ESTILOS COMPARTIDOS
// =====================================================

const botonSecundario =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const botonPrincipal =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50";

// =====================================================
// CONFIGURACIÓN DE ESTADOS
// =====================================================

const ESTADOS_REPORTE = [
  { id: 1, nombre: "Pendiente" },
  { id: 2, nombre: "En revisión" },
  { id: 3, nombre: "Derivado a reparación" },
  { id: 4, nombre: "Cerrado" },
];

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";

  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) {
    return String(fecha);
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function nombreCompleto(usuario) {
  if (!usuario) return "No disponible";

  return (
    [usuario.nombre, usuario.apellido]
      .filter(Boolean)
      .join(" ") || "No disponible"
  );
}

// =====================================================
// COMPONENTES AUXILIARES
// =====================================================

function EstadoReporteBadge({ estado }) {
  const estilos = {
    Pendiente:
      "border-amber-200 bg-amber-50 text-amber-800",
    "En revisión":
      "border-yellow-200 bg-yellow-50 text-yellow-700",
    "Derivado a reparación":
      "border-red-200 bg-red-50 text-red-700",
    Cerrado:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  const nombre = estado || "Sin estado";

  return (
    <span
      className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
        estilos[nombre] ??
        "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {nombre}
    </span>
  );
}

function BotonPaginacion({
  children,
  onClick,
  disabled,
  icono: Icono,
  iconoDerecha = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {!iconoDerecha && Icono && <Icono size={16} />}
      {children}
      {iconoDerecha && Icono && <Icono size={16} />}
    </button>
  );
}

// =====================================================
// PÁGINA PRINCIPAL
// =====================================================

export default function Reportes() {
  const { user } = useAuth();

  // =====================================================
  // PERMISOS
  // =====================================================

  const permisos = user?.rol?.permisos ?? [];

  const tienePermiso = (nombre) =>
    permisos.some((permiso) =>
      typeof permiso === "string"
        ? permiso === nombre
        : permiso?.nombre === nombre
    );

  const puedeVerTodos = tienePermiso("reportes.todos");
  const puedeVerPropios = tienePermiso("reportes.propios");
  const puedeCrear = tienePermiso("reportes.crear");

  // =====================================================
  // ESTADOS
  // =====================================================

  const [reportes, setReportes] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [estadoFiltro, setEstadoFiltro] = useState("");

  const [paginacion, setPaginacion] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    from: null,
    to: null,
  });

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [recarga, setRecarga] = useState(0);

  // =====================================================
  // CARGAR REPORTES
  // =====================================================

  useEffect(() => {
    if (!user) return;

    let activo = true;

    async function cargarReportes() {
      setCargando(true);
      setError("");

      try {
        const params = {
          page: pagina,
        };

        let respuesta;

        if (puedeVerTodos) {
          if (estadoFiltro) {
            params.estado_reporte_id = estadoFiltro;
          }

          respuesta = await obtenerReportes(params);
        } else if (puedeVerPropios) {
          respuesta = await obtenerReportesPropios(params);
        } else {
          throw new Error(
            "No tenés permisos para consultar reportes."
          );
        }

        if (!activo) return;

        setReportes(respuesta.data ?? []);

        setPaginacion({
          current_page: respuesta.current_page ?? 1,
          last_page: respuesta.last_page ?? 1,
          total: respuesta.total ?? 0,
          from: respuesta.from ?? null,
          to: respuesta.to ?? null,
        });
      } catch (err) {
        if (!activo) return;

        console.error("Error al cargar reportes:", err);

        setError(
          err.response?.data?.message ||
            err.message ||
            "No se pudieron cargar los reportes."
        );

        setReportes([]);
        setPaginacion({
          current_page: pagina,
          last_page: 1,
          total: 0,
          from: null,
          to: null,
        });
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarReportes();

    return () => {
      activo = false;
    };
  }, [
    user,
    puedeVerTodos,
    puedeVerPropios,
    pagina,
    estadoFiltro,
    recarga,
  ]);

  // =====================================================
  // ACCIONES
  // =====================================================

  const actualizarReportes = () => {
    setRecarga((valor) => valor + 1);
  };

  const manejarFiltro = (event) => {
    setEstadoFiltro(event.target.value);
    setPagina(1);
  };

  // =====================================================
  // DATOS DE PAGINACIÓN
  // =====================================================

  const totalRegistros = Number(paginacion.total ?? 0);
  const paginaActual = Number(
    paginacion.current_page ?? pagina
  );
  const ultimaPagina = Number(
    paginacion.last_page ?? 1
  );

  const desde = paginacion.from ?? 0;
  const hasta = paginacion.to ?? 0;

  // =====================================================
  // RENDERIZADO
  // =====================================================

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-10">

      {/* =============================================
          CAJA 1 - ENCABEZADO PRINCIPAL
      ============================================= */}

      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-blue-700" />

        <div className="flex flex-col justify-between gap-5 p-5 sm:p-6 lg:flex-row lg:items-center">

          {/* TÍTULO */}

          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <ClipboardList
                size={27}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                Gestión institucional
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Reportes de anomalías
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                {puedeVerTodos
                  ? "Consultá y gestioná las anomalías reportadas en los equipos de la institución."
                  : "Consultá los reportes realizados y realizá el seguimiento de su estado."}
              </p>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}

          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">

            <button
              type="button"
              onClick={actualizarReportes}
              disabled={cargando}
              className={botonSecundario}
            >
              <RefreshCw
                size={17}
                className={
                  cargando ? "animate-spin" : ""
                }
              />

              {cargando
                ? "Actualizando..."
                : "Actualizar"}
            </button>

            {puedeCrear && (
              <Link
                to="/reportes/nuevo"
                className={botonPrincipal}
              >
                <Plus size={18} />
                Nuevo reporte
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* =============================================
          CAJA 2 - LISTADO DE REPORTES
      ============================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* =============================================
            ENCABEZADO DE LA TABLA + FILTROS
        ============================================= */}

        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">

            {/* TÍTULO DEL LISTADO */}

            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <ClipboardList
                  size={21}
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  {puedeVerTodos
                    ? "Listado de reportes"
                    : "Mis reportes"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {puedeVerTodos
                    ? "Consultá los reportes registrados y su estado actual."
                    : "Seguimiento de las anomalías que reportaste."}
                </p>
              </div>
            </div>

            {/* TOTAL, PÁGINA Y FILTRO */}

            <div className="flex flex-wrap items-center gap-3 xl:justify-end">

                            {/* FILTRO DE ESTADO */}

              {puedeVerTodos && (
                <div className="relative min-w-[210px] flex-1 sm:flex-none">

                  <Filter
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    id="estado-reporte"
                    aria-label="Filtrar por estado del reporte"
                    value={estadoFiltro}
                    onChange={manejarFiltro}
                    disabled={cargando}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
                  >
                    <option value="">
                      Todos los estados
                    </option>

                    {ESTADOS_REPORTE.map((estado) => (
                      <option
                        key={estado.id}
                        value={estado.id}
                      >
                        {estado.nombre}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              )}

              {/* TOTAL DE REPORTES */}

              <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
                {totalRegistros.toLocaleString("es-AR")}{" "}
                {totalRegistros === 1
                  ? "reporte"
                  : "reportes"}
              </span>

              {/* PÁGINA ACTUAL */}

              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                Página {paginaActual} de {ultimaPagina}
              </span>
            </div>
          </div>
        </div>

        {/* =============================================
            ERROR DE CONSULTA
        ============================================= */}

        {error && (
          <div
            role="alert"
            className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:m-6"
          >
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">
                No se pudieron cargar los reportes
              </p>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={actualizarReportes}
              disabled={cargando}
              className="text-sm font-semibold text-red-700 underline disabled:opacity-50"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* =============================================
            TABLA DE REPORTES
        ============================================= */}

        {cargando ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-4 px-6 py-12">
            <RefreshCw
              size={28}
              className="animate-spin text-blue-700"
            />

            <p className="text-sm font-medium text-slate-600">
              Cargando reportes...
            </p>
          </div>
        ) : !error ? (
          reportes.length > 0 ? (

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">

                {/* ENCABEZADOS */}

                <thead className="bg-slate-50">
                  <tr>
                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Reporte
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Activo
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Descripción
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Estado
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Reportado por
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Fecha
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Acciones
                    </th>
                  </tr>
                </thead>

                {/* REGISTROS */}

                <tbody className="divide-y divide-slate-100 bg-white">

                  {reportes.map((reporte) => (
                    <tr
                      key={reporte.id}
                      className="transition-colors hover:bg-slate-50"
                    >

                      {/* REPORTE */}


                      <td className="px-5 py-4">
                        <Link
                          to={`/reportes/${reporte.id}`}
                          title={`Ver detalle de ${reporte.id}`}
                          className="inline-flex items-center gap-1.5 font-bold text-blue-700 transition-colors hover:text-blue-900 hover:underline hover:underline-offset-4 focus:outline-none focus:underline"
                        >
                          <span>
                            {reporte.id}
                          </span>

                          <ExternalLink
                            size={13}
                            className="shrink-0 opacity-50 transition-opacity group-hover:opacity-100"
                          />
                        </Link>
                      </td>

                      {/* ACTIVO */}

                      <td className="px-5 py-4">
                        <p className="whitespace-nowrap font-semibold text-slate-900">
                          {reporte.activo?.codigo_inventario ??
                            `Activo #${reporte.activo_id}`}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {[
                            reporte.activo?.marca,
                            reporte.activo?.modelo,
                          ]
                            .filter(Boolean)
                            .join(" ") || "Sin marca o modelo"}
                        </p>
                      </td>

                      {/* DESCRIPCIÓN */}

                      <td className="max-w-xs px-5 py-4">
                        <p
                          className="line-clamp-2 text-sm leading-relaxed text-slate-600"
                          title={reporte.descripcion ?? ""}
                        >
                          {reporte.descripcion ||
                            "Sin descripción"}
                        </p>
                      </td>

                      {/* ESTADO */}

                      <td className="whitespace-nowrap px-5 py-4">
                        <EstadoReporteBadge
                          estado={reporte.estado?.nombre}
                        />
                      </td>

                      {/* REPORTADO POR */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-slate-700">
                          <UserRound
                            size={16}
                            className="shrink-0 text-slate-400"
                          />

                          <span className="whitespace-nowrap">
                            {reporte.usuario
                              ? nombreCompleto(
                                  reporte.usuario
                                )
                              : Number(
                                    reporte.usuario_id
                                  ) === Number(user?.id)
                                ? nombreCompleto(user)
                                : "No disponible"}
                          </span>
                        </div>
                      </td>

                      {/* FECHA */}

                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock3
                            size={16}
                            className="shrink-0 text-slate-400"
                          />

                          {formatearFecha(
                            reporte.fecha_reporte
                          )}
                        </div>
                      </td>

                      {/* ACCIONES */}

                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/reportes/${reporte.id}`}
                          title="Ver detalle del reporte"
                          aria-label={`Ver reporte ${reporte.id}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700 transition hover:border-blue-200 hover:bg-blue-100"
                        >
                          <Eye size={17} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          ) : (

            /* ESTADO VACÍO */

            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <AlertTriangle size={28} />
              </div>

              <h3 className="mt-5 text-base font-semibold text-slate-900">
                No se encontraron reportes
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                {estadoFiltro && puedeVerTodos
                  ? "No hay reportes que coincidan con el estado seleccionado."
                  : "Todavía no hay reportes disponibles para mostrar."}
              </p>

              {estadoFiltro && puedeVerTodos && (
                <button
                  type="button"
                  onClick={() => {
                    setEstadoFiltro("");
                    setPagina(1);
                  }}
                  className={`mt-5 ${botonSecundario}`}
                >
                  <Filter size={16} />
                  Quitar filtro
                </button>
              )}
            </div>
          )
        ) : null}

        {/* =============================================
            PAGINACIÓN INFERIOR
        ============================================= */}

        {!cargando && !error && (
          <div className="flex flex-col justify-between gap-4 border-t border-slate-100 bg-slate-50/50 px-5 py-5 sm:flex-row sm:items-center sm:px-6">

            {/* INFORMACIÓN DE REGISTROS */}

            <div>
              <p className="text-sm font-medium text-slate-700">
                Mostrando{" "}
                <span className="font-bold">
                  {desde}–{hasta}
                </span>{" "}
                de{" "}
                <span className="font-bold">
                  {totalRegistros.toLocaleString("es-AR")}
                </span>{" "}
                {totalRegistros === 1
                  ? "reporte"
                  : "reportes"}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {puedeVerTodos
                  ? estadoFiltro
                    ? "Registros correspondientes al estado seleccionado"
                    : "Reportes de anomalías registrados"
                  : "Reportes realizados por tu cuenta"}
              </p>
            </div>

            {/* CONTROLES DE PAGINACIÓN */}

            <div className="flex flex-wrap items-center gap-2">

              <BotonPaginacion
                icono={ChevronLeft}
                disabled={
                  cargando || paginaActual <= 1
                }
                onClick={() =>
                  setPagina((actual) =>
                    Math.max(1, actual - 1)
                  )
                }
              >
                Anterior
              </BotonPaginacion>

              <div className="flex min-w-20 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <span className="text-sm font-semibold text-slate-700">
                  {paginaActual} / {ultimaPagina}
                </span>
              </div>

              <BotonPaginacion
                icono={ChevronRight}
                iconoDerecha
                disabled={
                  cargando ||
                  paginaActual >= ultimaPagina
                }
                onClick={() =>
                  setPagina((actual) =>
                    Math.min(
                      ultimaPagina,
                      actual + 1
                    )
                  )
                }
              >
                Siguiente
              </BotonPaginacion>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
