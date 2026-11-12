
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  AlertCircle,
  Archive,
  ChevronLeft,
  ChevronRight,
  Database,
  Layers,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../context/FeedbackContext";

import {
  obtenerActivos,
  darDeBajaActivo,
} from "../services/activoService";

import ActivosTable from "../components/ActivosTable";

// =====================================================
// ESTILOS COMPARTIDOS
// =====================================================

const botonSecundario =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const botonPrincipal =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50";

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

export default function Activos() {
  // =====================================================
  // CONTEXTOS Y NAVEGACIÓN
  // =====================================================

  const { user } = useAuth();
  const { toast, confirmar } = useFeedback();

  const location = useLocation();
  const navigate = useNavigate();

  // =====================================================
  // ESTADOS
  // =====================================================

  const [activos, setActivos] = useState([]);
  const [paginacion, setPaginacion] = useState(null);

  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState("");

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [procesandoBaja, setProcesandoBaja] =
    useState(false);

  // =====================================================
  // REFERENCIAS
  // =====================================================

  const mensajeProcesadoRef = useRef(null);
  const procesandoBajaRef = useRef(false);

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

  const esAdministrador =
    user?.rol?.nombre === "Administrador";

  const puedeCrear =
    tienePermiso("activos.crear") || esAdministrador;

  const puedeEditar =
    tienePermiso("activos.editar") || esAdministrador;

  const puedeDarDeBaja =
    tienePermiso("activos.desactivar") ||
    esAdministrador;

  // =====================================================
  // MENSAJES RECIBIDOS DESDE OTRAS PANTALLAS
  // =====================================================

  useEffect(() => {
    const mensaje = location.state?.mensajeExito;

    if (!mensaje) return;

    if (mensajeProcesadoRef.current === location.key) {
      return;
    }

    mensajeProcesadoRef.current = location.key;

    toast.success(mensaje);

    // Limpiamos únicamente el mensaje procesado.
    // Conservamos cualquier otro estado de navegación.

    const estadoActual = location.state ?? {};

    const { mensajeExito, ...estadoRestante } =
      estadoActual;

    navigate(
      {
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
      },
      {
        replace: true,
        state: estadoRestante,
      }
    );
  }, [
    location.key,
    location.pathname,
    location.search,
    location.hash,
    location.state,
    navigate,
    toast,
  ]);

  // =====================================================
  // CARGAR ACTIVOS
  // =====================================================

  const cargarActivos = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const respuesta = await obtenerActivos({
        page: pagina,
      });

      setActivos(respuesta.data ?? []);
      setPaginacion(respuesta);
    } catch (err) {
      console.error("Error al cargar activos:", err);

      setError(
        err.response?.data?.message ||
          "No se pudo cargar el inventario. Intentá nuevamente."
      );

      setActivos([]);
      setPaginacion(null);
    } finally {
      setCargando(false);
    }
  }, [pagina]);

  useEffect(() => {
    cargarActivos();
  }, [cargarActivos]);

  // =====================================================
  // BAJA DE ACTIVOS
  // =====================================================

  const solicitarBaja = async (activo) => {
    if (
      !puedeDarDeBaja ||
      !activo ||
      procesandoBajaRef.current
    ) {
      return;
    }

    const codigo =
      activo.codigo_inventario || `#${activo.id}`;

    // -----------------------------------------------
    // CONFIRMACIÓN GLOBAL
    // -----------------------------------------------

    const confirmado = await confirmar({
      titulo: "Dar de baja el activo",
      mensaje:
        `Estás por dar de baja el activo ${codigo}.\n\n` +
        "El activo dejará de aparecer en el inventario activo, " +
        "pero su información e historial se conservarán.\n\n" +
        "¿Querés continuar?",
      textoConfirmar: "Confirmar baja",
      textoCancelar: "Cancelar",
      variante: "danger",
    });

    if (!confirmado) return;

    if (procesandoBajaRef.current) return;

    procesandoBajaRef.current = true;
    setProcesandoBaja(true);

    // -----------------------------------------------
    // EJECUTAR BAJA
    // -----------------------------------------------

    try {
      await darDeBajaActivo(activo.id);

      // ---------------------------------------------
      // RETROALIMENTACIÓN DE ÉXITO
      // ---------------------------------------------

      toast.success(
        `El activo ${codigo} fue dado de baja correctamente.`
      );

      // ---------------------------------------------
      // ACTUALIZAR INVENTARIO
      // ---------------------------------------------

      // Si era el único registro de la página,
      // regresamos a la página anterior.

      if (activos.length === 1 && pagina > 1) {
        setPagina((anterior) => anterior - 1);
      } else {
        await cargarActivos();
      }
    } catch (err) {
      console.error(
        "Error al dar de baja el activo:",
        err
      );

      // ---------------------------------------------
      // RETROALIMENTACIÓN DE ERROR
      // ---------------------------------------------

      toast.error(
        err.response?.data?.message ||
          "No se pudo dar de baja el activo. Intentá nuevamente."
      );
    } finally {
      procesandoBajaRef.current = false;
      setProcesandoBaja(false);
    }
  };

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
      activo.estado?.nombre,
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
          CAJA 1 - ENCABEZADO INSTITUCIONAL
      ============================================= */}

      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* LÍNEA INSTITUCIONAL */}

        <div className="h-1 bg-blue-700" />

        <div className="flex flex-col justify-between gap-5 p-5 sm:p-6 lg:flex-row lg:items-center">

          {/* TÍTULO */}

          <div className="flex min-w-0 items-start gap-4">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Database
                size={27}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0">

              <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                Gestión institucional
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Gestión de activos
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                Consultá y administrá los equipos y recursos
                tecnológicos del inventario institucional.
              </p>

            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}

          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">

            {/* ACTUALIZAR */}

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

            {/* ACTIVOS DADOS DE BAJA */}

            {puedeDarDeBaja && (
              <Link
                to="/activos/bajas"
                className={botonSecundario}
              >
                <Archive size={17} />
                Activos dados de baja
              </Link>
            )}

            {/* REGISTRO MÚLTIPLE */}

            {puedeCrear && (
              <Link
                to="/activos/lote"
                className={botonSecundario}
              >
                <Layers size={17} />
                Registro múltiple
              </Link>
            )}

            {/* NUEVO ACTIVO */}

            {puedeCrear && (
              <Link
                to="/activos/nuevo"
                className={botonPrincipal}
              >
                <Plus size={18} />
                Nuevo activo
              </Link>
            )}

          </div>
        </div>
      </header>

      {/* =============================================
          CAJA 2 - INVENTARIO DE ACTIVOS
      ============================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* =============================================
            ENCABEZADO DE TABLA + BÚSQUEDA
        ============================================= */}

        <div className="border-b border-slate-100 p-5 sm:p-6">

          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">

            {/* TÍTULO DEL LISTADO */}

            <div className="flex min-w-0 items-start gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Database
                  size={21}
                  strokeWidth={1.8}
                />
              </div>

              <div className="min-w-0">

                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  Inventario de activos
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Consultá, editá y administrá los equipos registrados.
                </p>

              </div>
            </div>

            

            {/* TOTAL, PÁGINA Y BÚSQUEDA */}

            <div className="flex flex-wrap items-center gap-3 xl:justify-end">

              {/* BÚSQUEDA */}

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
                  aria-label="Buscar activos"
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

              {/* TOTAL DE ACTIVOS */}

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
                No se pudo cargar el inventario
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
            TABLA DE ACTIVOS
        ============================================= */}

        {cargando ? (

          /* ESTADO DE CARGA */

          <div className="flex min-h-72 flex-col items-center justify-center gap-4 px-6 py-12">

            <RefreshCw
              size={28}
              className="animate-spin text-blue-700"
            />

            <p className="text-sm font-medium text-slate-600">
              Cargando inventario...
            </p>

          </div>

        ) : !error ? (
          activosFiltrados.length > 0 ? (

            /* TABLA CON REGISTROS */

            <ActivosTable
              activos={activosFiltrados}
              puedeEditar={puedeEditar}
              puedeDarDeBaja={puedeDarDeBaja}
              onDarDeBaja={solicitarBaja}
            />

          ) : (

            /* ESTADO VACÍO */

            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Search size={28} />
              </div>

              <h3 className="mt-5 text-base font-semibold text-slate-900">
                {hayBusqueda
                  ? "No se encontraron resultados"
                  : "No hay activos registrados"}
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                {hayBusqueda
                  ? "No hay coincidencias en esta página. Probá con otra búsqueda o cambiá de página."
                  : "Todavía no hay equipos disponibles para mostrar."}
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
                Registros del inventario institucional
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
