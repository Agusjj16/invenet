
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Eye,
  Filter,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  Wrench,
  X,
  ExternalLink,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import {
  obtenerOrdenes,
  obtenerOrdenesAsignadas,
} from "../services/ordenReparacionService";

import EstadoOrdenBadge from "../components/EstadoOrdenBadge";

// =====================================================
// ESTADOS DE LAS ÓRDENES
// =====================================================

const ESTADOS = [
  { id: 1, nombre: "Pendiente" },
  { id: 2, nombre: "En proceso" },
  { id: 3, nombre: "Finalizada" },
];

// =====================================================
// ESTILOS COMPARTIDOS
// =====================================================

const botonSecundario =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const botonPrincipal =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50";

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function formatearFecha(fecha) {
  if (!fecha) return "No disponible";

  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no válida";
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
// COMPONENTE: BOTÓN DE PAGINACIÓN
// =====================================================

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

export default function OrdenesReparacion() {
  const { user } = useAuth();

  // =====================================================
  // PERMISOS
  // =====================================================

  const permisos =
    user?.rol?.permisos ?? user?.permisos ?? [];

  const tienePermiso = (nombre) =>
    permisos.some((permiso) =>
      typeof permiso === "string"
        ? permiso === nombre
        : permiso?.nombre === nombre
    );

  const puedeVerTodas = tienePermiso("ordenes.ver_todas");
  const puedeVerAsignadas = tienePermiso(
    "ordenes.ver_asignadas"
  );
  const puedeCrear = tienePermiso("ordenes.crear");

  // =====================================================
  // ESTADOS
  // =====================================================

  const [ordenes, setOrdenes] = useState([]);

  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");

  const [pagina, setPagina] = useState(1);
  const [recarga, setRecarga] = useState(0);

  const [paginacion, setPaginacion] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    from: null,
    to: null,
  });

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // CARGAR ÓRDENES
  // =====================================================

  useEffect(() => {
    if (!user) return;

    let vigente = true;

    async function cargarOrdenes() {
      setCargando(true);
      setError("");

      try {
        const params = {
          page: pagina,
          por_pagina: 15,
        };

        if (estadoFiltro) {
          params.estado_orden_id = Number(estadoFiltro);
        }

        let respuesta;

        if (puedeVerTodas) {
          respuesta = await obtenerOrdenes(params);
        } else if (puedeVerAsignadas) {
          respuesta = await obtenerOrdenesAsignadas(params);
        } else {
          throw new Error(
            "No tenés permisos para consultar órdenes de reparación."
          );
        }

        if (!vigente) return;

        setOrdenes(respuesta.data ?? []);

        setPaginacion({
          current_page: respuesta.current_page ?? 1,
          last_page: respuesta.last_page ?? 1,
          total: respuesta.total ?? 0,
          from: respuesta.from ?? null,
          to: respuesta.to ?? null,
        });
      } catch (err) {
        if (!vigente) return;

        console.error(
          "Error al cargar órdenes de reparación:",
          err
        );

        setError(
          err.response?.data?.message ||
            err.message ||
            "No se pudieron cargar las órdenes de reparación."
        );

        setOrdenes([]);

        setPaginacion({
          current_page: pagina,
          last_page: 1,
          total: 0,
          from: null,
          to: null,
        });
      } finally {
        if (vigente) {
          setCargando(false);
        }
      }
    }

    cargarOrdenes();

    return () => {
      vigente = false;
    };
  }, [
    user,
    puedeVerTodas,
    puedeVerAsignadas,
    pagina,
    estadoFiltro,
    recarga,
  ]);

  // =====================================================
  // BÚSQUEDA EN LA PÁGINA ACTUAL
  // =====================================================

  const textoBusqueda = busqueda.trim().toLowerCase();

  const ordenesFiltradas = ordenes.filter((orden) => {
    if (!textoBusqueda) return true;

    const valores = [
      orden.id,
      orden.reporte_id,
      orden.reporte?.activo?.codigo_inventario,
      orden.reporte?.descripcion,
      orden.tecnico?.nombre,
      orden.tecnico?.apellido,
    ];

    return valores.some((valor) =>
      String(valor ?? "")
        .toLowerCase()
        .includes(textoBusqueda)
    );
  });

  // =====================================================
  // ACCIONES
  // =====================================================

  const actualizarOrdenes = () => {
    setRecarga((valor) => valor + 1);
  };

  const cambiarEstadoFiltro = (event) => {
    setEstadoFiltro(event.target.value);
    setPagina(1);
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setEstadoFiltro("");
    setPagina(1);
  };

  // =====================================================
  // PAGINACIÓN
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

  const hayFiltros = Boolean(busqueda || estadoFiltro);

  // =====================================================
  // RENDERIZADO PRINCIPAL
  // =====================================================

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-10">

      {/* =============================================
          CAJA 1 - ENCABEZADO INSTITUCIONAL
      ============================================= */}

      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* LÍNEA INSTITUCIONAL */}

        <div className="h-1 bg-blue-700" />

        <div className="flex flex-col justify-between gap-5 p-5 sm:p-6 lg:flex-row lg:items-center">

          {/* TÍTULO */}

          <div className="flex min-w-0 items-start gap-4">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Wrench
                size={27}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0">

              <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                Gestión de mantenimiento
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Órdenes de reparación
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                {puedeVerTodas
                  ? "Consultá y supervisá las reparaciones de los equipos del inventario institucional."
                  : "Consultá y realizá el seguimiento de las órdenes de reparación que tenés asignadas."}
              </p>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}

          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">

            <button
              type="button"
              onClick={actualizarOrdenes}
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
                to="/ordenes-reparacion/nueva"
                className={botonPrincipal}
              >
                <Plus size={18} />
                Nueva orden
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* =============================================
          CAJA 2 - LISTADO DE ÓRDENES
      ============================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* =============================================
            ENCABEZADO DE TABLA + FILTROS
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

              <div className="min-w-0">

                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  {puedeVerTodas
                    ? "Listado de órdenes"
                    : "Mis órdenes asignadas"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Consultá el estado y el seguimiento de cada reparación.
                </p>
              </div>
            </div>

            {/* TOTAL, PÁGINA Y FILTROS */}

            <div className="flex flex-wrap items-center gap-3 xl:justify-end">

              {/* TOTAL */}

              <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
                {totalRegistros.toLocaleString("es-AR")}{" "}
                {totalRegistros === 1
                  ? "orden"
                  : "órdenes"}
              </span>

              {/* PÁGINA */}

              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                Página {paginaActual} de {ultimaPagina}
              </span>

              {/* BÚSQUEDA */}

              <div className="relative w-full sm:w-60">

                <Search
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={busqueda}
                  onChange={(event) =>
                    setBusqueda(event.target.value)
                  }
                  placeholder="Buscar orden..."
                  aria-label="Buscar órdenes"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />

                {busqueda && (
                  <button
                    type="button"
                    onClick={() => setBusqueda("")}
                    aria-label="Limpiar búsqueda"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* FILTRO DE ESTADO */}

              <div className="relative w-full sm:w-52">

                <Filter
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  id="estado-orden"
                  aria-label="Filtrar órdenes por estado"
                  value={estadoFiltro}
                  onChange={cambiarEstadoFiltro}
                  disabled={cargando}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
                >
                  <option value="">
                    Todos los estados
                  </option>

                  {ESTADOS.map((estado) => (
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

              {/* LIMPIAR FILTROS */}

              {hayFiltros && (
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  title="Limpiar filtros"
                  aria-label="Limpiar filtros"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* RESULTADOS DE BÚSQUEDA */}

          {textoBusqueda && !cargando && !error && (
            <p className="mt-3 text-xs text-slate-500">
              {ordenesFiltradas.length}{" "}
              {ordenesFiltradas.length === 1
                ? "resultado encontrado"
                : "resultados encontrados"}{" "}
              en la página actual.
            </p>
          )}
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

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-red-800">
                No se pudieron cargar las órdenes
              </p>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={actualizarOrdenes}
              disabled={cargando}
              className="shrink-0 text-sm font-semibold text-red-700 underline transition hover:text-red-900 disabled:opacity-50"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* =============================================
            TABLA DE ÓRDENES
        ============================================= */}

        {cargando ? (

          /* ESTADO DE CARGA */

          <div className="flex min-h-72 flex-col items-center justify-center gap-4 px-6 py-12">
            <RefreshCw
              size={28}
              className="animate-spin text-blue-700"
            />

            <p className="text-sm font-medium text-slate-600">
              Cargando órdenes de reparación...
            </p>
          </div>

        ) : !error ? (
          ordenesFiltradas.length > 0 ? (

            /* TABLA CON REGISTROS */

            <div className="overflow-x-auto">

              <table className="min-w-full divide-y divide-slate-200 text-sm">

                {/* ENCABEZADOS */}

                <thead className="bg-slate-50">
                  <tr>

                    <th
                      scope="col"
                      className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                    >
                      Orden
                    </th>

                    <th
                      scope="col"
                      className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                    >
                      Activo
                    </th>

                    <th
                      scope="col"
                      className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                    >
                      Reporte
                    </th>

                    <th
                      scope="col"
                      className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                    >
                      Técnico
                    </th>

                    <th
                      scope="col"
                      className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                    >
                      Estado
                    </th>

                    <th
                      scope="col"
                      className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                    >
                      Asignación
                    </th>

                    <th
                      scope="col"
                      className="whitespace-nowrap px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500"
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>

                {/* REGISTROS */}

                <tbody className="divide-y divide-slate-100 bg-white">

                  {ordenesFiltradas.map((orden) => {
                    const activo =
                      orden.reporte?.activo;

                    const tecnico =
                      orden.tecnico ??
                      (Number(orden.tecnico_id) ===
                      Number(user?.id)
                        ? user
                        : null);

                    const pendienteRecibida =
                      orden.estado?.nombre ===
                        "Pendiente" &&
                      Boolean(orden.fecha_recepcion);

                    return (
                      <tr
                        key={orden.id}
                        className="transition-colors hover:bg-slate-50"
                      >

                        {/* ORDEN */}

                      <td className="px-5 py-4">
                        <Link
                          to={`/ordenes-reparacion/${orden.id}`}
                          title={`Ver detalle de la orden ${orden.id}`}
                          className="inline-flex items-center gap-1.5 font-bold text-blue-700 transition-colors hover:text-blue-900 hover:underline hover:underline-offset-4 focus:outline-none focus:underline"
                        >
                          <span>
                            {orden.id}
                          </span>

                          <ExternalLink
                            size={13}
                            className="shrink-0 opacity-50 transition-opacity group-hover:opacity-100"
                          />
                        </Link>
                      </td>

                        {/* ACTIVO */}

                        <td className="px-5 py-4 align-middle">

                          <p className="whitespace-nowrap font-semibold text-slate-900">
                            {activo?.codigo_inventario ??
                              "No disponible"}
                          </p>

                          <p className="mt-1 max-w-48 truncate text-xs text-slate-500">
                            {[
                              activo?.marca,
                              activo?.modelo,
                            ]
                              .filter(Boolean)
                              .join(" ") ||
                              "Sin marca o modelo"}
                          </p>
                        </td>

                        {/* REPORTE */}

                        <td className="px-5 py-4 align-middle">

                          <p className="whitespace-nowrap font-semibold text-slate-900">
                            Reporte #{orden.reporte_id}
                          </p>

                          <p
                            className="mt-1 max-w-52 truncate text-xs text-slate-500"
                            title={
                              orden.reporte?.descripcion ?? ""
                            }
                          >
                            {orden.reporte?.descripcion ??
                              "Sin descripción"}
                          </p>
                        </td>

                        {/* TÉCNICO */}

                        <td className="px-5 py-4 align-middle">

                          <div className="flex items-center gap-2 text-slate-700">

                            <UserRound
                              size={16}
                              className="shrink-0 text-slate-400"
                            />

                            <span className="max-w-44 truncate text-sm">
                              {nombreCompleto(tecnico)}
                            </span>
                          </div>
                        </td>

                        {/* ESTADO */}

                        <td className="px-5 py-4 align-middle">

                          <div className="space-y-1.5">

                            <EstadoOrdenBadge
                              estado={orden.estado?.nombre}
                            />

                            {pendienteRecibida && (
                              <p className="text-xs font-medium text-blue-700">
                                Equipo recibido
                              </p>
                            )}
                          </div>
                        </td>

                        {/* FECHA DE ASIGNACIÓN */}

                        <td className="whitespace-nowrap px-5 py-4 align-middle">

                          <div className="flex items-center gap-2 text-slate-600">

                            <Clock3
                              size={15}
                              className="shrink-0 text-slate-400"
                            />

                            <span className="text-xs font-medium">
                              {formatearFecha(
                                orden.fecha_asignacion
                              )}
                            </span>
                          </div>
                        </td>

                        {/* ACCIONES */}

                        <td className="px-5 py-4 text-right align-middle">

                          <Link
                            to={`/ordenes-reparacion/${orden.id}`}
                            title="Ver detalle de la orden"
                            aria-label={`Ver orden ${orden.id}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700 transition hover:border-blue-200 hover:bg-blue-100"
                          >
                            <Eye size={17} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          ) : (

            /* ESTADO VACÍO */

            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <ClipboardList size={28} />
              </div>

              <h3 className="mt-5 text-base font-semibold text-slate-900">
                {hayFiltros
                  ? "No se encontraron órdenes"
                  : "No hay órdenes de reparación"}
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                {hayFiltros
                  ? "No hay órdenes que coincidan con los filtros aplicados. Probá con otros criterios."
                  : "Todavía no hay órdenes de reparación disponibles para mostrar."}
              </p>

              {hayFiltros && (
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className={`mt-5 ${botonSecundario}`}
                >
                  <X size={16} />
                  Limpiar filtros
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

            {/* INFORMACIÓN */}

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
                  ? "orden"
                  : "órdenes"}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {estadoFiltro
                  ? "Órdenes correspondientes al estado seleccionado"
                  : puedeVerTodas
                    ? "Órdenes de reparación registradas"
                    : "Órdenes de reparación asignadas a tu cuenta"}
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
