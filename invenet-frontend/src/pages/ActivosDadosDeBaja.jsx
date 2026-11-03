
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  Archive,
  ArrowLeft,
  Eye,
  RefreshCw,
  Search,
  Monitor,
  ClipboardList,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Info,
  AlertCircle,
  X,
  ExternalLink,
} from "lucide-react";

import { obtenerActivosDadosDeBaja } from "../services/activoService";
import { useFeedback } from "../context/FeedbackContext";

// =====================================================
// CONFIGURACIÓN VISUAL
// =====================================================

const clasesBoton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40";

// =====================================================
// FORMATEAR FECHA
// =====================================================

function formatearFecha(fecha) {
  if (!fecha) return "No disponible";

  const partes = String(fecha).slice(0, 10).split("-");

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
// PÁGINA: ACTIVOS DADOS DE BAJA
// =====================================================

export default function ActivosDadosDeBaja() {
  // =====================================================
  // FEEDBACK GLOBAL
  // =====================================================

  const { toast } = useFeedback();

  // Se mantiene una referencia actualizada al Toast
  // para no volver a ejecutar el efecto de carga cuando
  // cambia el contexto global.
  const toastRef = useRef(toast);
  toastRef.current = toast;

  // =====================================================
  // ESTADOS
  // =====================================================

  const [activos, setActivos] = useState([]);
  const [paginacion, setPaginacion] = useState(null);

  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState("");

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Controla las solicitudes para evitar que una
  // respuesta anterior sobrescriba datos más recientes.
  const solicitudActual = useRef(0);

  // Evita actualizaciones de estado después de desmontar
  // el componente.
  const montadoRef = useRef(false);

  // =====================================================
  // CARGAR ACTIVOS DADOS DE BAJA
  // =====================================================

  const cargarActivos = useCallback(
    async ({
      mostrarExito = false,
      mostrarError = true,
    } = {}) => {
      const solicitud = ++solicitudActual.current;

      setCargando(true);
      setError("");

      try {
        const respuesta =
          await obtenerActivosDadosDeBaja({
            page: pagina,
          });

        if (
          !montadoRef.current ||
          solicitud !== solicitudActual.current
        ) {
          return;
        }

        setActivos(respuesta.data ?? []);
        setPaginacion(respuesta);

        if (mostrarExito) {
          toastRef.current.success(
            "El listado de activos dados de baja se actualizó correctamente."
          );
        }
      } catch (err) {
        if (
          !montadoRef.current ||
          solicitud !== solicitudActual.current
        ) {
          return;
        }

        console.error(
          "Error al cargar activos dados de baja:",
          err
        );

        const mensaje =
          err.response?.data?.message ||
          "No se pudieron cargar los activos dados de baja.";

        setError(mensaje);

        // Se limpian los datos anteriores para no
        // mostrar información desactualizada.
        setActivos([]);
        setPaginacion(null);

        if (mostrarError) {
          toastRef.current.error(mensaje);
        }
      } finally {
        if (
          montadoRef.current &&
          solicitud === solicitudActual.current
        ) {
          setCargando(false);
        }
      }
    },
    [pagina]
  );

  // =====================================================
  // CARGA INICIAL Y CAMBIOS DE PÁGINA
  // =====================================================

  useEffect(() => {
    montadoRef.current = true;

    // La carga automática no muestra un Toast de éxito.
    cargarActivos({
      mostrarExito: false,
      mostrarError: true,
    });

    return () => {
      montadoRef.current = false;

      // Invalida las solicitudes pendientes.
      solicitudActual.current += 1;
    };
  }, [cargarActivos]);

  // =====================================================
  // ACTUALIZACIÓN MANUAL
  // =====================================================

  const actualizarListado = () => {
  if (cargando) return;

  cargarActivos({
    mostrarError: true,
  });
};

  // =====================================================
  // BÚSQUEDA EN LA PÁGINA ACTUAL
  // =====================================================

  const textoBusqueda = busqueda.trim().toLowerCase();

  const activosFiltrados = activos.filter((activo) => {
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
  // DATOS DE RESUMEN
  // =====================================================

  const totalActivos = paginacion?.total ?? 0;
  const totalPagina = activos.length;
  const totalFiltrados = activosFiltrados.length;

  const paginaActual =
    paginacion?.current_page ?? pagina;

  const ultimaPagina =
    paginacion?.last_page ?? 1;

  const desde = paginacion?.from ?? 0;
  const hasta = paginacion?.to ?? 0;

  // =====================================================
  // LIMPIAR BÚSQUEDA
  // =====================================================

  const limpiarBusqueda = () => {
    setBusqueda("");
  };

  // =====================================================
  // CAMBIAR PÁGINA
  // =====================================================

  const irPaginaAnterior = () => {
    if (cargando || paginaActual <= 1) return;

    setPagina((anterior) =>
      Math.max(1, anterior - 1)
    );
  };

  const irPaginaSiguiente = () => {
    if (cargando || paginaActual >= ultimaPagina) {
      return;
    }

    setPagina((anterior) =>
      Math.min(ultimaPagina, anterior + 1)
    );
  };

  // =====================================================
  // RENDERIZADO PRINCIPAL
  // =====================================================

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-10">

      {/* =============================================
          NAVEGACIÓN
      ============================================= */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/activos"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
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
          ENCABEZADO INSTITUCIONAL
      ============================================= */}

      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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

              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Consultá los equipos retirados del
                inventario y accedé a su información
                histórica.
              </p>
            </div>
          </div>

          {/* ACTUALIZAR */}

          <button
            type="button"
            onClick={actualizarListado}
            disabled={cargando}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={cargando ? "animate-spin" : ""}
            />

            {cargando
              ? "Actualizando..."
              : "Actualizar listado"}
          </button>
        </div>
      </header>

      {/* =============================================
          RESUMEN DE REGISTROS
      ============================================= */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        {/* TOTAL DE BAJAS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-500">
              Total de activos dados de baja
            </span>

            <div className="rounded-xl bg-red-50 p-2.5 text-red-600">
              <Archive size={19} />
            </div>
          </div>

          <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            {totalActivos.toLocaleString("es-AR")}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Registros históricos
          </p>
        </div>

        {/* REGISTROS EN PÁGINA */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-500">
              Registros en esta página
            </span>

            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
              <ClipboardList size={19} />
            </div>
          </div>

          <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            {totalPagina.toLocaleString("es-AR")}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Equipos cargados
          </p>
        </div>

        {/* RESULTADOS VISIBLES */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-500">
              Resultados visibles
            </span>

            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
              <Search size={19} />
            </div>
          </div>

          <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            {totalFiltrados.toLocaleString("es-AR")}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Coincidencias en la página actual
          </p>
        </div>
      </section>

      {/* =============================================
          BÚSQUEDA Y FILTROS
      ============================================= */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

        {/* ENCABEZADO */}

        <div className="mb-5 flex items-start gap-3 border-b border-slate-100 pb-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
            <Search
              size={19}
              strokeWidth={1.8}
            />
          </div>

          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              Buscar activos dados de baja
            </h2>

            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              Localizá equipos por código, categoría,
              marca, modelo, número de serie o ubicación.
            </p>
          </div>
        </div>

        {/* BUSCADOR */}

        <div className="relative">
          <Search
            size={19}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={busqueda}
            onChange={(event) =>
              setBusqueda(event.target.value)
            }
            placeholder="Buscar por código, categoría, marca, modelo..."
            aria-label="Buscar activos dados de baja"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          {busqueda && (
            <button
              type="button"
              onClick={limpiarBusqueda}
              title="Limpiar búsqueda"
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={17} />
            </button>
          )}
        </div>

        {/* ACLARACIÓN */}

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <Info
            size={17}
            className="mt-0.5 shrink-0 text-slate-400"
          />

          <p className="text-xs leading-relaxed text-slate-500">
            La búsqueda se realiza sobre los registros
            de la página actual. Para consultar otros
            equipos, utilizá los controles de paginación.
          </p>
        </div>
      </section>

      {/* =============================================
          ERROR DE CARGA
      ============================================= */}

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-4 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={21}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <p className="text-sm font-bold text-red-800">
                No se pudo cargar el listado
              </p>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              cargarActivos({
                mostrarExito: false,
                mostrarError: true,
              })
            }
            disabled={cargando}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Reintentar
          </button>
        </div>
      )}

      {/* =============================================
          LISTADO DE ACTIVOS
      ============================================= */}

      <section className="space-y-4">

        {/* TÍTULO DE LA SECCIÓN */}

        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm">
              <ClipboardList
                size={19}
                strokeWidth={1.8}
              />
            </div>

            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Listado de bajas
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Equipos retirados del inventario institucional.
              </p>
            </div>
          </div>

          {!cargando && !error && (
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              {totalFiltrados}{" "}
              {totalFiltrados === 1
                ? "registro visible"
                : "registros visibles"}
            </span>
          )}
        </div>

        {/* =============================================
            ESTADO DE CARGA
        ============================================= */}

        {cargando ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <RefreshCw
                size={25}
                className="animate-spin"
              />
            </div>

            <h3 className="mt-5 text-base font-bold text-slate-800">
              Cargando activos dados de baja
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Obteniendo los registros históricos del inventario...
            </p>
          </div>
        ) : !error && activosFiltrados.length === 0 ? (

          /* =============================================
              ESTADO VACÍO
          ============================================= */

          <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              {textoBusqueda ? (
                <Search size={26} />
              ) : (
                <Archive size={26} />
              )}
            </div>

            <h3 className="mt-5 text-base font-bold text-slate-900">
              {textoBusqueda
                ? "No se encontraron coincidencias"
                : "No hay activos dados de baja"}
            </h3>

            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              {textoBusqueda
                ? "No hay equipos que coincidan con la búsqueda en esta página."
                : "Todavía no hay equipos dados de baja para mostrar en este listado."}
            </p>

            {textoBusqueda && (
              <button
                type="button"
                onClick={limpiarBusqueda}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                <X size={16} />
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : !error ? (

          /* =============================================
              TABLA DE ACTIVOS
          ============================================= */

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      Código
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Categoría
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Marca / Modelo
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Ubicación
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Fecha de baja
                    </th>

                    <th className="px-5 py-4 text-center font-semibold">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {activosFiltrados.map((activo) => (
                    <tr
                      key={activo.id}
                      className="transition-colors hover:bg-slate-50"
                    >

                      {/* CÓDIGO */}

                      <td className="px-5 py-4">
                        <Link
                          to={`/activos/bajas/${activo.id}`}
                          title="Consultar detalle del activo dado de baja"
                          className="group inline-flex items-center gap-2 font-semibold text-blue-700 transition hover:text-blue-900"
                        >
                          <span className="break-all group-hover:underline">
                            {activo.codigo_inventario}
                          </span>

                          <ExternalLink
                            size={14}
                            className="shrink-0 opacity-50 transition group-hover:opacity-100"
                          />
                        </Link>
                      </td>

                      {/* CATEGORÍA */}

                      <td className="px-5 py-4 text-slate-700">
                        {activo.categoria?.nombre ??
                          "Sin categoría"}
                      </td>

                      {/* MARCA / MODELO */}

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {activo.marca || "Sin marca"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {activo.modelo || "Sin modelo"}
                        </p>
                      </td>

                      {/* UBICACIÓN */}

                      <td className="px-5 py-4 text-slate-700">
                        {activo.ubicacion?.nombre ??
                          "Sin ubicación"}
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

                      <td className="px-5 py-4 text-center">
                        <Link
                          to={`/activos/bajas/${activo.id}`}
                          title="Consultar activo dado de baja"
                          aria-label={`Consultar ${activo.codigo_inventario}`}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Eye size={17} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>

      {/* =============================================
          PAGINACIÓN
      ============================================= */}

      {!cargando && !error && paginacion && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">

            {/* INFORMACIÓN */}

            <div className="text-center sm:text-left">
              <p className="text-sm font-semibold text-slate-700">
                Mostrando {desde}–{hasta} de{" "}
                {totalActivos.toLocaleString("es-AR")} activos
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Página {paginaActual} de {ultimaPagina}
              </p>
            </div>

            {/* CONTROLES */}

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={
                  cargando || paginaActual <= 1
                }
                onClick={irPaginaAnterior}
                className={clasesBoton}
              >
                <ChevronLeft size={17} />
                Anterior
              </button>

              <span className="inline-flex min-w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm font-bold text-blue-700">
                {paginaActual}
              </span>

              <button
                type="button"
                disabled={
                  cargando ||
                  paginaActual >= ultimaPagina
                }
                onClick={irPaginaSiguiente}
                className={clasesBoton}
              >
                Siguiente
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
