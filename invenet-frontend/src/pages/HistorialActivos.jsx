
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  AlertCircle,
  Archive,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Filter,
  History,
  MapPin,
  Pencil,
  PlusCircle,
  RefreshCw,
  Search,
  UserRound,
  X,
  ExternalLink,
} from "lucide-react";

import { obtenerHistorialGeneral } from "../services/historialService";

// =====================================================
// ESTILOS COMPARTIDOS
// =====================================================

const botonSecundario =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

// =====================================================
// CONFIGURACIÓN DE EVENTOS
// =====================================================

const TIPOS_EVENTO = {
  ALTA: {
    nombre: "Alta",
    Icono: PlusCircle,
    estilos:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
  },

  MODIFICACION: {
    nombre: "Modificación",
    Icono: Pencil,
    estilos:
      "border-blue-200 bg-blue-50 text-blue-700",
  },

  CAMBIO_UBICACION: {
    nombre: "Cambio de ubicación",
    Icono: MapPin,
    estilos:
      "border-violet-200 bg-violet-50 text-violet-700",
  },

  BAJA: {
    nombre: "Baja",
    Icono: Archive,
    estilos:
      "border-red-200 bg-red-50 text-red-700",
  },
};

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
// COMPONENTE: ETIQUETA DE EVENTO
// =====================================================

function EventoBadge({ tipo }) {
  const config = TIPOS_EVENTO[tipo] ?? {
    nombre: tipo || "Desconocido",
    Icono: History,
    estilos:
      "border-slate-200 bg-slate-50 text-slate-600",
  };

  const { nombre, Icono, estilos } = config;

  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold ${estilos}`}
    >
      <Icono size={14} />
      {nombre}
    </span>
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

export default function HistorialActivos() {
  // =====================================================
  // ESTADOS
  // =====================================================

  const [eventos, setEventos] = useState([]);

  const [busqueda, setBusqueda] = useState("");
  const [busquedaAplicada, setBusquedaAplicada] =
    useState("");

  // Búsqueda automática con espera de 400 ms
  useEffect(() => {
    const temporizador = setTimeout(() => {
      const texto = busqueda.trim();

      if (texto !== busquedaAplicada) {
        setPagina(1);
        setBusquedaAplicada(texto);
      }
    }, 400);

    return () => clearTimeout(temporizador);
  }, [busqueda, busquedaAplicada]);

  const [tipoEvento, setTipoEvento] = useState("");
  const [pagina, setPagina] = useState(1);

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
  // CARGAR HISTORIAL
  // =====================================================

  const cargarHistorial = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const params = {
        page: pagina,
      };

      if (busquedaAplicada.trim()) {
        params.buscar = busquedaAplicada.trim();
      }

      if (tipoEvento) {
        params.tipo_evento = tipoEvento;
      }

      const respuesta = await obtenerHistorialGeneral(
        params
      );

      setEventos(respuesta.data ?? []);

      setPaginacion({
        current_page: respuesta.current_page ?? 1,
        last_page: respuesta.last_page ?? 1,
        total: respuesta.total ?? 0,
        from: respuesta.from ?? null,
        to: respuesta.to ?? null,
      });
    } catch (err) {
      console.error(
        "Error al cargar historial general:",
        err
      );

      setError(
        err.response?.status === 403
          ? "No tenés permisos para consultar el historial."
          : err.response?.data?.message ||
              "No se pudo cargar el historial de activos."
      );

      setEventos([]);

      setPaginacion({
        current_page: pagina,
        last_page: 1,
        total: 0,
        from: null,
        to: null,
      });
    } finally {
      setCargando(false);
    }
  }, [pagina, busquedaAplicada, tipoEvento]);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  // =====================================================
  // ACCIONES
  // =====================================================

  const manejarFiltro = (event) => {
    setPagina(1);
    setTipoEvento(event.target.value);
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setBusquedaAplicada("");
    setTipoEvento("");
    setPagina(1);
  };

  const limpiarBusqueda = () => {
    setBusqueda("");
    setBusquedaAplicada("");
    setPagina(1);
  };

  // =====================================================
  // PAGINACIÓN Y FILTROS
  // =====================================================

  const totalRegistros = Number(
    paginacion.total ?? 0
  );

  const paginaActual = Number(
    paginacion.current_page ?? pagina
  );

  const ultimaPagina = Number(
    paginacion.last_page ?? 1
  );

  const desde = paginacion.from ?? 0;
  const hasta = paginacion.to ?? 0;

  const hayFiltros = Boolean(
    busquedaAplicada || tipoEvento
  );

  // =====================================================
  // RENDERIZADO
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
              <History
                size={27}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0">

              <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                Trazabilidad del inventario
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Historial de activos
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                Consultá los movimientos, modificaciones y cambios
                registrados en los activos del inventario institucional.
              </p>
            </div>
          </div>

          {/* BOTÓN ACTUALIZAR */}

          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">

            <button
              type="button"
              onClick={cargarHistorial}
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
          </div>
        </div>
      </header>

      {/* =============================================
          CAJA 2 - REGISTRO DE MOVIMIENTOS
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
                <History
                  size={21}
                  strokeWidth={1.8}
                />
              </div>

              <div className="min-w-0">

                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  Registro de movimientos
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Consultá la trazabilidad y el historial de cambios de cada activo.
                </p>
              </div>
            </div>

            {/* TOTAL, PÁGINA Y FILTROS */}

            <div className="flex flex-wrap items-center gap-3 xl:justify-end">

              {/* TOTAL DE MOVIMIENTOS */}

              <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
                {totalRegistros.toLocaleString("es-AR")}{" "}
                {totalRegistros === 1
                  ? "movimiento"
                  : "movimientos"}
              </span>

              {/* PÁGINA ACTUAL */}

              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                Página {paginaActual} de {ultimaPagina}
              </span>

              {/* BUSCADOR Y FILTRO DE EVENTOS */}

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">

                {/* BUSCADOR AUTOMÁTICO */}

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
                    placeholder="Buscar por código..."
                    aria-label="Buscar por código de inventario"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />

                  {busqueda && (
                    <button
                      type="button"
                      onClick={limpiarBusqueda}
                      title="Limpiar búsqueda"
                      aria-label="Limpiar búsqueda"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* FILTRO DE MOVIMIENTOS */}

                <div className="relative w-full sm:w-56">

                  <Filter
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    value={tipoEvento}
                    onChange={manejarFiltro}
                    disabled={cargando}
                    aria-label="Filtrar por tipo de movimiento"
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
                  >
                    <option value="">
                      Todos los movimientos
                    </option>

                    <option value="ALTA">Alta</option>

                    <option value="MODIFICACION">
                      Modificación
                    </option>

                    <option value="CAMBIO_UBICACION">
                      Cambio de ubicación
                    </option>

                    <option value="BAJA">Baja</option>
                  </select>

                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
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
                No se pudo cargar el historial
              </p>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={cargarHistorial}
              disabled={cargando}
              className="shrink-0 text-sm font-semibold text-red-700 underline transition hover:text-red-900 disabled:opacity-50"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* =============================================
            TABLA DE MOVIMIENTOS
        ============================================= */}

        {cargando ? (

          /* ESTADO DE CARGA */

          <div className="flex min-h-72 flex-col items-center justify-center gap-4 px-6 py-12">

            <RefreshCw
              size={28}
              className="animate-spin text-blue-700"
            />

            <p className="text-sm font-medium text-slate-600">
              Cargando movimientos...
            </p>
          </div>

        ) : !error ? (
          eventos.length > 0 ? (

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
                      Activo
                    </th>

                    <th
                      scope="col"
                      className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                    >
                      Movimiento
                    </th>

                    <th
                      scope="col"
                      className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                    >
                      Descripción
                    </th>

                    <th
                      scope="col"
                      className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                    >
                      Responsable
                    </th>

                    <th
                      scope="col"
                      className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                    >
                      Fecha
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

                  {eventos.map((evento) => (
                    <tr
                      key={evento.id}
                      className="transition-colors hover:bg-slate-50"
                    >

                      {/* ACTIVO */}

                      <td className="px-5 py-4">
                        <Link
                          to={`/activos/${evento.activo_id}/historial`}
                          title={`Ver detalle del activo`}
                          className="inline-flex items-center gap-1.5 font-bold text-blue-700 transition-colors hover:text-blue-900 hover:underline hover:underline-offset-4 focus:outline-none focus:underline"
                        >
                          <span>
                            {evento.activo?.codigo_inventario ??
                            `Activo #${evento.activo_id}`}
                          </span>

                          <ExternalLink
                            size={13}
                            className="shrink-0 opacity-50 transition-opacity group-hover:opacity-100"
                          />
                        </Link>
                      </td>

                      {/* MOVIMIENTO */}

                      <td className="px-5 py-4 align-middle">

                        <EventoBadge
                          tipo={evento.tipo_evento}
                        />
                      </td>

                      {/* DESCRIPCIÓN */}

                      <td className="max-w-xs px-5 py-4 align-middle">

                        <p
                          className="line-clamp-2 text-sm leading-relaxed text-slate-600"
                          title={evento.descripcion ?? ""}
                        >
                          {evento.descripcion ||
                            "Sin descripción"}
                        </p>
                      </td>

                      {/* RESPONSABLE */}

                      <td className="px-5 py-4 align-middle">

                        <div className="flex items-center gap-2 text-slate-700">

                          <UserRound
                            size={16}
                            className="shrink-0 text-slate-400"
                          />

                          <span className="whitespace-nowrap">
                            {nombreCompleto(
                              evento.usuario
                            )}
                          </span>
                        </div>
                      </td>

                      {/* FECHA */}

                      <td className="whitespace-nowrap px-5 py-4 align-middle">

                        <div className="flex items-center gap-2 text-slate-600">

                          <Clock3
                            size={16}
                            className="shrink-0 text-slate-400"
                          />

                          {formatearFecha(
                            evento.created_at
                          )}
                        </div>
                      </td>

                      {/* ACCIONES */}

                      <td className="px-5 py-4 text-right align-middle">

                        <Link
                          to={`/activos/${evento.activo_id}/historial`}
                          title="Ver historial individual"
                          aria-label={`Ver historial del activo ${
                            evento.activo?.codigo_inventario ??
                            evento.activo_id
                          }`}
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
                <History size={28} />
              </div>

              <h3 className="mt-5 text-base font-semibold text-slate-900">
                {hayFiltros
                  ? "No se encontraron movimientos"
                  : "No hay movimientos registrados"}
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                {hayFiltros
                  ? "No hay movimientos que coincidan con los filtros aplicados. Probá con otros criterios."
                  : "Todavía no hay movimientos registrados en el historial del inventario."}
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
                  ? "movimiento"
                  : "movimientos"}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {hayFiltros
                  ? "Movimientos que coinciden con los filtros aplicados"
                  : "Movimientos registrados en el inventario institucional"}
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
