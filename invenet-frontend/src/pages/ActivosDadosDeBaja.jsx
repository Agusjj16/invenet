
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  AlertCircle,
  Archive,
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  Monitor,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { obtenerActivosDadosDeBaja } from "../services/activoService";

// =====================================================
// ESTILOS COMPARTIDOS
// =====================================================

const botonSecundario =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

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
// FUNCIÓN: FORMATEAR FECHA
// =====================================================

function formatearFecha(fecha) {
  if (!fecha) return "No disponible";

  const partes = String(fecha)
    .slice(0, 10)
    .split("-");

  if (partes.length !== 3) {
    return String(fecha);
  }

  const [anio, mes, dia] = partes;

  if (!anio || !mes || !dia) {
    return String(fecha);
  }

  return `${dia}/${mes}/${anio}`;
}

// =====================================================
// PÁGINA PRINCIPAL
// =====================================================

export default function ActivosDadosDeBaja() {
  // =====================================================
  // ESTADOS
  // =====================================================

  const [activos, setActivos] = useState([]);
  const [paginacion, setPaginacion] = useState(null);

  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState("");

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // REFERENCIAS
  // =====================================================

  const solicitudActualRef = useRef(0);
  const montadoRef = useRef(false);

  // =====================================================
  // CARGAR ACTIVOS DADOS DE BAJA
  // =====================================================

  const cargarActivos = useCallback(async () => {
    const solicitud = ++solicitudActualRef.current;

    setCargando(true);
    setError("");

    try {
      const respuesta =
        await obtenerActivosDadosDeBaja({
          page: pagina,
        });

      if (
        !montadoRef.current ||
        solicitud !== solicitudActualRef.current
      ) {
        return;
      }

      setActivos(respuesta.data ?? []);
      setPaginacion(respuesta);
    } catch (err) {
      if (
        !montadoRef.current ||
        solicitud !== solicitudActualRef.current
      ) {
        return;
      }

      console.error(
        "Error al cargar activos dados de baja:",
        err
      );

      setError(
        err.response?.data?.message ||
          "No se pudieron cargar los activos dados de baja. Intentá nuevamente."
      );

      setActivos([]);
      setPaginacion(null);
    } finally {
      if (
        montadoRef.current &&
        solicitud === solicitudActualRef.current
      ) {
        setCargando(false);
      }
    }
  }, [pagina]);

  // =====================================================
  // CARGA INICIAL Y CAMBIO DE PÁGINA
  // =====================================================

  useEffect(() => {
    montadoRef.current = true;

    cargarActivos();

    return () => {
      montadoRef.current = false;
      solicitudActualRef.current += 1;
    };
  }, [cargarActivos]);

  // =====================================================
  // BÚSQUEDA EN LA PÁGINA ACTUAL
  // =====================================================

  const textoBusqueda = busqueda.trim().toLowerCase();

  const activosFiltrados = activos.filter((activo) => {
    if (!textoBusqueda) return true;

    const valores = [
      activo.codigo_inventario,
      activo.categoria?.nombre,
      activo.marca,
      activo.modelo,
      activo.numero_serie,
      activo.ubicacion?.nombre,
    ];

    return valores.some((valor) =>
      String(valor ?? "")
        .toLowerCase()
        .includes(textoBusqueda)
    );
  });

  // =====================================================
  // PAGINACIÓN
  // =====================================================

  const totalRegistros = Number(
    paginacion?.total ?? 0
  );

  const paginaActual = Number(
    paginacion?.current_page ?? pagina
  );

  const ultimaPagina = Number(
    paginacion?.last_page ?? 1
  );

  const desde = Number(paginacion?.from ?? 0);
  const hasta = Number(paginacion?.to ?? 0);

  const hayBusqueda = textoBusqueda.length > 0;

  // =====================================================
  // RENDERIZADO
  // =====================================================

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-10">

      {/* =============================================
          NAVEGACIÓN
      ============================================= */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/activos"
          className={botonSecundario}
        >
          <ArrowLeft size={17} />
          Volver al inventario
        </Link>

        <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-400">
          <Monitor size={15} />
          Inventario institucional
        </span>
      </div>

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
              <Archive
                size={27}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0">

              <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                Administración del inventario
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Activos dados de baja
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                Consultá los equipos retirados del
                inventario institucional y accedé
                a su información histórica.
              </p>

            </div>
          </div>

          {/* BOTÓN ACTUALIZAR */}

          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
            <button
              type="button"
              onClick={cargarActivos}
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
          CAJA 2 - LISTADO DE ACTIVOS DADOS DE BAJA
      ============================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* =============================================
            ENCABEZADO DEL LISTADO + BÚSQUEDA
        ============================================= */}

        <div className="border-b border-slate-100 p-5 sm:p-6">

          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">

            {/* TÍTULO DEL LISTADO */}

            <div className="flex min-w-0 items-start gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Archive
                  size={21}
                  strokeWidth={1.8}
                />
              </div>

              <div className="min-w-0">

                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  Listado de bajas
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Consultá los equipos retirados del inventario institucional.
                </p>

              </div>
            </div>

            {/* TOTAL, PÁGINA Y BÚSQUEDA */}

            <div className="flex flex-wrap items-center gap-3 xl:justify-end">

              {/* TOTAL DE ACTIVOS DADOS DE BAJA */}

              <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
                {totalRegistros.toLocaleString("es-AR")}{" "}
                {totalRegistros === 1
                  ? "activo"
                  : "activos"}
              </span>

              {/* PÁGINA ACTUAL */}

              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                Página {paginaActual} de {ultimaPagina}
              </span>

              {/* BUSCADOR INTEGRADO */}

              <div className="relative w-full sm:w-64">

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
                  placeholder="Buscar activo..."
                  aria-label="Buscar activos dados de baja"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />

                {busqueda && (
                  <button
                    type="button"
                    onClick={() => setBusqueda("")}
                    title="Limpiar búsqueda"
                    aria-label="Limpiar búsqueda"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X size={16} />
                  </button>
                )}

              </div>
            </div>
          </div>

          {/* RESULTADOS DE BÚSQUEDA */}

          {hayBusqueda && !cargando && !error && (
            <p className="mt-3 text-xs text-slate-500">
              {activosFiltrados.length}{" "}
              {activosFiltrados.length === 1
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
                No se pudo cargar el listado
              </p>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>

            </div>

            <button
              type="button"
              onClick={cargarActivos}
              disabled={cargando}
              className="shrink-0 text-sm font-semibold text-red-700 underline transition hover:text-red-900 disabled:opacity-50"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* =============================================
            TABLA DE ACTIVOS DADOS DE BAJA
        ============================================= */}

        {cargando ? (

          /* ESTADO DE CARGA */

          <div className="flex min-h-72 flex-col items-center justify-center gap-4 px-6 py-12">

            <RefreshCw
              size={28}
              className="animate-spin text-blue-700"
            />

            <p className="text-sm font-medium text-slate-600">
              Cargando activos dados de baja...
            </p>

          </div>

        ) : !error ? (
          activosFiltrados.length > 0 ? (

            /* TABLA CON REGISTROS */

            <div className="w-full overflow-x-auto">

              <table className="w-full min-w-[950px] text-left text-sm">

                {/* ENCABEZADOS */}

                <thead className="border-b border-slate-200 bg-slate-50/80">
                  <tr>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Código
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Categoría
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Marca / Modelo
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Ubicación
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Fecha de baja
                    </th>

                    <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                      Acciones
                    </th>

                  </tr>
                </thead>

                {/* FILAS */}

                <tbody className="divide-y divide-slate-100">

                  {activosFiltrados.map((activo) => (
                    <tr
                      key={activo.id}
                      className="group transition-colors duration-150 hover:bg-slate-50/80"
                    >

                      {/* CÓDIGO */}

                      <td className="px-5 py-4">

                        <Link
                          to={`/activos/bajas/${activo.id}`}
                          title={`Ver detalle de ${activo.codigo_inventario}`}
                          className="inline-flex items-center gap-1.5 font-bold text-blue-700 transition-colors hover:text-blue-900 hover:underline hover:underline-offset-4 focus:outline-none focus:underline"
                        >
                          <span>
                            {activo.codigo_inventario}
                          </span>

                          <ExternalLink
                            size={13}
                            className="shrink-0 opacity-50 transition-opacity group-hover:opacity-100"
                          />
                        </Link>

                      </td>

                      {/* CATEGORÍA */}

                      <td className="px-5 py-4">
                        <span className="font-medium text-slate-700">
                          {activo.categoria?.nombre ??
                            "Sin categoría"}
                        </span>
                      </td>

                      {/* MARCA Y MODELO */}

                      <td className="px-5 py-4">

                        <div className="flex flex-col">

                          <span className="font-semibold text-slate-800">
                            {activo.marca || "Sin marca"}
                          </span>

                          <span className="mt-1 text-xs text-slate-500">
                            {activo.modelo || "Sin modelo"}
                          </span>

                        </div>

                      </td>

                      {/* UBICACIÓN */}

                      <td className="px-5 py-4">
                        <span className="text-slate-700">
                          {activo.ubicacion?.nombre ??
                            "Sin ubicación"}
                        </span>
                      </td>

                      {/* FECHA DE BAJA */}

                      <td className="px-5 py-4">

                        <div className="inline-flex items-center gap-2 text-slate-600">

                          <CalendarDays
                            size={15}
                            className="shrink-0 text-slate-400"
                          />

                          <span>
                            {formatearFecha(
                              activo.deleted_at
                            )}
                          </span>

                        </div>

                      </td>

                      {/* ACCIONES */}

                      <td className="px-5 py-4">

                        <div className="flex items-center justify-center gap-2">

                          <Link
                            to={`/activos/bajas/${activo.id}`}
                            title="Ver detalle del activo dado de baja"
                            aria-label={`Ver detalle de ${activo.codigo_inventario}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all duration-150 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          >
                            <Eye
                              size={17}
                              strokeWidth={1.8}
                            />
                          </Link>

                        </div>

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
                {hayBusqueda ? (
                  <Search size={28} />
                ) : (
                  <Archive size={28} />
                )}
              </div>

              <h3 className="mt-5 text-base font-semibold text-slate-900">
                {hayBusqueda
                  ? "No se encontraron resultados"
                  : "No hay activos dados de baja"}
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                {hayBusqueda
                  ? "No hay coincidencias en esta página. Probá con otra búsqueda o cambiá de página."
                  : "Todavía no hay equipos dados de baja para mostrar."}
              </p>

              {hayBusqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda("")}
                  className={`mt-5 ${botonSecundario}`}
                >
                  <X size={16} />
                  Limpiar búsqueda
                </button>
              )}

            </div>
          )
        ) : null}

        {/* =============================================
            PAGINACIÓN INFERIOR
        ============================================= */}

        {!cargando && !error && paginacion && (
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
                  ? "activo"
                  : "activos"}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Registros históricos del inventario
              </p>

            </div>

            {/* CONTROLES DE PAGINACIÓN */}

            <div className="flex flex-wrap items-center gap-2">

              <BotonPaginacion
                icono={ChevronLeft}
                disabled={paginaActual <= 1 || cargando}
                onClick={() =>
                  setPagina((anterior) =>
                    Math.max(1, anterior - 1)
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
                  paginaActual >= ultimaPagina ||
                  cargando
                }
                onClick={() =>
                  setPagina((anterior) =>
                    Math.min(
                      ultimaPagina,
                      anterior + 1
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
