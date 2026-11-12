
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  FileText,
  Inbox,
  Loader2,
  RefreshCw,
  Wrench,
  X,
} from "lucide-react";

import {
  obtenerNotificaciones,
  obtenerCantidadNoLeidas,
  marcarNotificacionLeida,
  marcarTodasLeidas,
} from "../services/notificacionService";

import {
  EVENTO_NOTIFICACIONES_ACTUALIZADAS,
  emitirNotificacionesActualizadas,
} from "../utils/notificacionesEventos";

import { useFeedback } from "../context/FeedbackContext";

// =====================================================
// ESTILOS COMPARTIDOS
// =====================================================

const botonSecundario =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const botonPrincipal =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50";

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function formatearFecha(fecha) {
  if (!fecha) return "Fecha no disponible";

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return "Fecha no válida";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(valor);
}

function obtenerConfiguracionTipo(tipo) {
  switch (tipo) {
    case "REPARACION_FINALIZADA":
      return {
        Icono: CheckCircle2,
        fondo: "bg-emerald-50",
        color: "text-emerald-700",
        etiqueta: "Reparación finalizada",
      };

    case "ORDEN_ASIGNADA":
    case "REPARACION_ASIGNADA":
      return {
        Icono: Wrench,
        fondo: "bg-blue-50",
        color: "text-blue-700",
        etiqueta: "Orden asignada",
      };

    case "REPORTE_CREADO":
      return {
        Icono: ClipboardList,
        fondo: "bg-violet-50",
        color: "text-violet-700",
        etiqueta: "Nuevo reporte",
      };

    case "REPORTE_CERRADO":
      return {
        Icono: FileText,
        fondo: "bg-slate-100",
        color: "text-slate-600",
        etiqueta: "Reporte cerrado",
      };

    default:
      return {
        Icono: Bell,
        fondo: "bg-blue-50",
        color: "text-blue-700",
        etiqueta: "Notificación",
      };
  }
}

// =====================================================
// NORMALIZAR RUTAS DEL BACKEND
// =====================================================

function obtenerRutaFrontend(url) {
  if (typeof url !== "string") return null;

  const ruta = url.trim();

  // Solo aceptamos rutas internas.
  if (
    !ruta.startsWith("/") ||
    ruta.startsWith("//")
  ) {
    return null;
  }

  const rutaNormalizada =
    ruta.replace(/\/+$/, "") || "/";

  // Reportes
  const reporte = rutaNormalizada.match(
    /^\/(?:reportes-anomalias|reportes)\/(\d+)$/
  );

  if (reporte) {
    return `/reportes/${reporte[1]}`;
  }

  // Órdenes de reparación
  const orden = rutaNormalizada.match(
    /^\/(?:ordenes-reparacion|ordenes-reparaciones)\/(\d+)$/
  );

  if (orden) {
    return `/ordenes-reparacion/${orden[1]}`;
  }

  // Activos
  const activo = rutaNormalizada.match(
    /^\/activos\/(\d+)$/
  );

  if (activo) {
    return `/activos/${activo[1]}`;
  }

  return null;
}

// =====================================================
// COMPONENTE: NOTIFICACIÓN
// =====================================================

function TarjetaNotificacion({
  notificacion,
  onMarcarLeida,
  marcando,
  bloqueada,
}) {
  const datos = notificacion.data ?? {};

  const leida = Boolean(notificacion.read_at);

  const configuracion = obtenerConfiguracionTipo(
    datos.tipo
  );

  const Icono = configuracion.Icono;

  const ruta = obtenerRutaFrontend(datos.url);

  return (
    <article
      className={`rounded-xl border p-4 transition-colors sm:p-5 ${
        leida
          ? "border-slate-200 bg-white hover:bg-slate-50/70"
          : "border-blue-200 bg-blue-50/40 hover:bg-blue-50/70"
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">

        {/* ÍCONO */}
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${configuracion.fondo} ${configuracion.color}`}
        >
          <Icono size={21} strokeWidth={1.8} />
        </div>

        {/* CONTENIDO */}
        <div className="min-w-0 flex-1">

          {/* TÍTULO Y ESTADO */}
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 sm:text-base">
              {datos.titulo || "Notificación"}
            </h3>

            {!leida && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-700 px-2.5 py-1 text-[11px] font-semibold text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                Nueva
              </span>
            )}
          </div>

          {/* MENSAJE */}
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">
            {datos.mensaje ||
              "Sin descripción disponible."}
          </p>

          {/* INFORMACIÓN ADICIONAL */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">

            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <Clock3 size={14} />
              {formatearFecha(
                notificacion.created_at
              )}
            </span>

            <span className="text-xs font-medium text-slate-500">
              {configuracion.etiqueta}
            </span>

            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold ${
                leida
                  ? "text-slate-500"
                  : "text-blue-700"
              }`}
            >
              {leida ? (
                <CheckCircle2 size={13} />
              ) : (
                <BellRing size={13} />
              )}

              {leida ? "Leída" : "Sin leer"}
            </span>
          </div>

          {/* ENLACE RELACIONADO */}
          {ruta && (
            <div className="mt-4 border-t border-slate-200/70 pt-3">
              <Link
                to={ruta}
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-900 hover:underline hover:underline-offset-4"
              >
                Ver detalle relacionado
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>

        {/* ACCIÓN */}
        {!leida && (
          <button
            type="button"
            onClick={() =>
              onMarcarLeida(notificacion.id)
            }
            disabled={marcando || bloqueada}
            title="Marcar como leída"
            aria-label={`Marcar como leída: ${
              datos.titulo || "Notificación"
            }`}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-white text-blue-700 transition hover:border-blue-200 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {marcando ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <Check size={18} />
            )}
          </button>
        )}
      </div>
    </article>
  );
}

// =====================================================
// COMPONENTE: ESTADO VACÍO
// =====================================================

function EstadoVacio({ filtro }) {
  const contenido = {
    todas: {
      titulo: "No hay notificaciones",
      descripcion:
        "Cuando haya novedades relacionadas con tu actividad en Invenet, aparecerán acá.",
    },

    no_leidas: {
      titulo: "No tenés notificaciones pendientes",
      descripcion:
        "Ya estás al día con tus notificaciones.",
    },

    leidas: {
      titulo: "Todavía no hay notificaciones leídas",
      descripcion:
        "Las notificaciones que marques como leídas aparecerán acá.",
    },
  };

  const informacion =
    contenido[filtro] || contenido.todas;

  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">

      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Inbox size={30} strokeWidth={1.7} />
      </div>

      <h3 className="mt-5 text-base font-bold text-slate-900">
        {informacion.titulo}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
        {informacion.descripcion}
      </p>
    </div>
  );
}

// =====================================================
// PÁGINA PRINCIPAL
// =====================================================

export default function Notificaciones() {

  // =====================================================
  // FEEDBACK GLOBAL
  // =====================================================

  const { toast } = useFeedback();

  // =====================================================
  // ESTADOS
  // =====================================================

  const [notificaciones, setNotificaciones] =
    useState([]);

  const [pagina, setPagina] = useState(1);
  const [ultimaPagina, setUltimaPagina] = useState(1);
  const [total, setTotal] = useState(0);

  const [filtro, setFiltro] = useState("todas");

  const [cargando, setCargando] = useState(true);

  const [actualizando, setActualizando] =
    useState(false);

  const [error, setError] = useState("");

  // Estado de lectura
  const [cantidadNoLeidas, setCantidadNoLeidas] =
    useState(0);

  const [marcandoId, setMarcandoId] =
    useState(null);

  const [marcandoTodas, setMarcandoTodas] =
    useState(false);

  // Modal
  const [
    mostrarConfirmacionTodas,
    setMostrarConfirmacionTodas,
  ] = useState(false);

  // Evita reaccionar al evento emitido por esta misma página.
  const ignorarEventoPropio = useRef(false);

  // =====================================================
  // CARGAR NOTIFICACIONES
  // =====================================================

  const cargarNotificaciones = useCallback(
    async (esActualizacion = false) => {

      if (esActualizacion) {
        setActualizando(true);
      } else {
        setCargando(true);
      }

      setError("");

      try {
        const [
          respuesta,
          respuestaContador,
        ] = await Promise.all([
          obtenerNotificaciones({
            page: pagina,
            filtro,
          }),
          obtenerCantidadNoLeidas(),
        ]);

        const registros = Array.isArray(respuesta)
          ? respuesta
          : respuesta?.data ?? [];

        if (!Array.isArray(registros)) {
          throw new Error(
            "El servidor devolvió un formato de notificaciones no válido."
          );
        }

        const ultimaPaginaReal = Math.max(
          1,
          Number(respuesta?.last_page) || 1
        );

        // Si la página solicitada ya no existe,
        // retrocedemos a la última disponible.
        if (pagina > ultimaPaginaReal) {
          setPagina(ultimaPaginaReal);
          return;
        }

        const paginaReal = Number(
          respuesta?.current_page
        );

        if (
          Number.isInteger(paginaReal) &&
          paginaReal > 0 &&
          paginaReal !== pagina
        ) {
          setPagina(paginaReal);
        }

        setNotificaciones(registros);

        setUltimaPagina(ultimaPaginaReal);

        setTotal(
          Number(respuesta?.total) ||
            registros.length
        );

        setCantidadNoLeidas(
          Number(respuestaContador?.cantidad) || 0
        );

      } catch (err) {
        console.error(
          "Error al obtener notificaciones:",
          err
        );

        setError(
          err.response?.data?.message ||
            err.message ||
            "No se pudieron cargar las notificaciones."
        );

        if (!esActualizacion) {
          setNotificaciones([]);
        }

      } finally {
        setCargando(false);
        setActualizando(false);
      }
    },
    [pagina, filtro]
  );

  useEffect(() => {
    cargarNotificaciones();
  }, [cargarNotificaciones]);

  // =====================================================
  // SINCRONIZACIÓN CON LA CAMPANA
  // =====================================================

  useEffect(() => {
    const manejarActualizacionExterna = () => {
      if (ignorarEventoPropio.current) {
        return;
      }

      cargarNotificaciones(true);
    };

    window.addEventListener(
      EVENTO_NOTIFICACIONES_ACTUALIZADAS,
      manejarActualizacionExterna
    );

    return () => {
      window.removeEventListener(
        EVENTO_NOTIFICACIONES_ACTUALIZADAS,
        manejarActualizacionExterna
      );
    };
  }, [cargarNotificaciones]);

  const notificarActualizacion = () => {
    ignorarEventoPropio.current = true;

    try {
      emitirNotificacionesActualizadas();
    } finally {
      ignorarEventoPropio.current = false;
    }
  };

  // =====================================================
  // MARCAR UNA NOTIFICACIÓN COMO LEÍDA
  // =====================================================

  const manejarMarcarLeida = async (id) => {

    if (
      marcandoId !== null ||
      marcandoTodas ||
      actualizando ||
      cargando
    ) {
      return;
    }

    setMarcandoId(id);

    try {
      const respuesta =
        await marcarNotificacionLeida(id);

      const fechaLectura =
        respuesta?.notificacion?.read_at ||
        new Date().toISOString();

      // Actualización visual inmediata
      setNotificaciones((anteriores) =>
        anteriores.map((notificacion) =>
          notificacion.id === id
            ? {
                ...notificacion,
                read_at: fechaLectura,
              }
            : notificacion
        )
      );

      // Sincronizar con la campana
      notificarActualizacion();

      // Mostrar feedback global
      toast.success(
        respuesta?.message ||
          "Notificación marcada como leída correctamente."
      );

      // Recuperar contador real sin invalidar
      // una operación que ya se completó.
      try {
        const contador =
          await obtenerCantidadNoLeidas();

        setCantidadNoLeidas(
          Number(contador?.cantidad) || 0
        );
      } catch (errorContador) {
        console.error(
          "Error al actualizar el contador:",
          errorContador
        );
      }

      // En filtros de leídas/sin leer,
      // actualizar listado y paginación.
      if (filtro !== "todas") {
        await cargarNotificaciones(true);
      }

    } catch (err) {
      console.error(
        "Error al marcar notificación:",
        err
      );

      toast.error(
        err.response?.data?.message ||
          "No se pudo marcar la notificación como leída."
      );

      await cargarNotificaciones(true);

    } finally {
      setMarcandoId(null);
    }
  };

  // =====================================================
  // MARCAR TODAS COMO LEÍDAS
  // =====================================================

  const solicitarMarcarTodas = () => {

    if (
      cantidadNoLeidas === 0 ||
      marcandoTodas ||
      marcandoId !== null ||
      actualizando ||
      cargando
    ) {
      return;
    }

    setMostrarConfirmacionTodas(true);
  };

  const cerrarModal = () => {
    if (marcandoTodas) return;

    setMostrarConfirmacionTodas(false);
  };

  const confirmarMarcarTodas = async () => {

    if (
      cantidadNoLeidas === 0 ||
      marcandoTodas ||
      marcandoId !== null ||
      actualizando ||
      cargando
    ) {
      return;
    }

    setMarcandoTodas(true);

    try {
      const respuesta =
        await marcarTodasLeidas();

      const fechaLectura =
        new Date().toISOString();

      // Actualizar tarjetas
      setNotificaciones((anteriores) =>
        anteriores.map((notificacion) => ({
          ...notificacion,
          read_at:
            notificacion.read_at || fechaLectura,
        }))
      );

      setCantidadNoLeidas(0);
      setMostrarConfirmacionTodas(false);

      // Sincronizar con campana
      notificarActualizacion();

      // Toast global de éxito
      toast.success(
        respuesta?.message ||
          "Todas las notificaciones fueron marcadas como leídas."
      );

      if (filtro !== "todas") {
        await cargarNotificaciones(true);
      }

    } catch (err) {
      console.error(
        "Error al marcar todas las notificaciones:",
        err
      );

      toast.error(
        err.response?.data?.message ||
          "No se pudieron marcar todas las notificaciones."
      );

      setMostrarConfirmacionTodas(false);

      await cargarNotificaciones(true);

    } finally {
      setMarcandoTodas(false);
    }
  };

  // =====================================================
  // CAMBIAR FILTRO
  // =====================================================

  const cambiarFiltro = (nuevoFiltro) => {

    if (
      nuevoFiltro === filtro ||
      marcandoTodas ||
      marcandoId !== null ||
      actualizando
    ) {
      return;
    }

    setNotificaciones([]);
    setPagina(1);
    setFiltro(nuevoFiltro);
  };

  // =====================================================
  // DATOS DEL LISTADO
  // =====================================================

  const opcionesFiltro = [
    {
      valor: "todas",
      texto: "Todas",
    },
    {
      valor: "no_leidas",
      texto: "Sin leer",
    },
    {
      valor: "leidas",
      texto: "Leídas",
    },
  ];

  const accionesBloqueadas =
    cargando ||
    actualizando ||
    marcandoTodas ||
    marcandoId !== null;

  // =====================================================
  // RENDERIZADO
  // =====================================================

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-10">

      {/* =============================================
          CAJA 1 - ENCABEZADO INSTITUCIONAL
      ============================================= */}

      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="h-1 bg-blue-700" />

        <div className="flex flex-col justify-between gap-5 p-5 sm:p-6 lg:flex-row lg:items-center">

          {/* TÍTULO */}
          <div className="flex min-w-0 items-start gap-4">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <BellRing
                size={27}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0">

              <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                Centro de actividad
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Notificaciones
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                Consultá las novedades y eventos relacionados
                con tus actividades en Invenet.
              </p>
            </div>
          </div>

          {/* BOTONES */}
          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">

            <button
              type="button"
              onClick={() =>
                cargarNotificaciones(true)
              }
              disabled={accionesBloqueadas}
              className={botonSecundario}
            >
              <RefreshCw
                size={17}
                className={
                  cargando || actualizando
                    ? "animate-spin"
                    : ""
                }
              />

              {actualizando
                ? "Actualizando..."
                : "Actualizar"}
            </button>

            <button
              type="button"
              onClick={solicitarMarcarTodas}
              disabled={
                accionesBloqueadas ||
                cantidadNoLeidas === 0
              }
              className={botonPrincipal}
            >
              {marcandoTodas ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <CheckCheck size={17} />
              )}

              {marcandoTodas
                ? "Marcando..."
                : "Marcar todas como leídas"}
            </button>
          </div>
        </div>
      </header>

      {/* =============================================
          CAJA 2 - BANDEJA DE NOTIFICACIONES
      ============================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* ENCABEZADO Y FILTROS */}
        <div className="border-b border-slate-100 p-5 sm:p-6">

          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">

            {/* TÍTULO */}
            <div className="flex min-w-0 items-start gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Bell
                  size={21}
                  strokeWidth={1.8}
                />
              </div>

              <div className="min-w-0">

                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  Bandeja de notificaciones
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Consultá tus notificaciones y administrá su estado de lectura.
                </p>
              </div>
            </div>

            {/* CONTADORES */}
            <div className="flex flex-wrap items-center gap-2 xl:justify-end">

              <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
                {total.toLocaleString("es-AR")}{" "}
                {total === 1
                  ? "notificación"
                  : "notificaciones"}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">

                <BellRing size={13} />

                {cantidadNoLeidas} sin leer
              </span>

              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                Página {pagina} de {ultimaPagina}
              </span>
            </div>
          </div>

          {/* FILTRO DE NOTIFICACIONES */}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">

            <label
              htmlFor="filtro-notificaciones"
              className="text-sm font-semibold text-slate-700"
            >
              Filtrar por estado
            </label>

            <div className="relative w-full sm:w-56">

              <select
                id="filtro-notificaciones"
                value={filtro}
                onChange={(event) =>
                  cambiarFiltro(event.target.value)
                }
                disabled={accionesBloqueadas}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition hover:border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
              >
                {opcionesFiltro.map((opcion) => (
                  <option
                    key={opcion.valor}
                    value={opcion.valor}
                  >
                    {opcion.texto}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={17}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* ERROR DE CARGA */}
        {error && notificaciones.length > 0 && (
          <div
            role="alert"
            className="mx-5 mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:mx-6"
          >
            <AlertCircle
              size={19}
              className="shrink-0 text-red-600"
            />

            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* CONTENIDO */}
        <div className="p-5 sm:p-6">

          {cargando ? (

            <div className="flex min-h-72 flex-col items-center justify-center gap-3">

              <Loader2
                size={28}
                className="animate-spin text-blue-700"
              />

              <p className="text-sm font-medium text-slate-500">
                Cargando notificaciones...
              </p>
            </div>

          ) : error && notificaciones.length === 0 ? (

            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <AlertCircle size={30} />
              </div>

              <h3 className="mt-5 text-base font-bold text-slate-900">
                No se pudieron cargar las notificaciones
              </h3>

              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  cargarNotificaciones()
                }
                className={`mt-5 ${botonPrincipal}`}
              >
                <RefreshCw size={16} />
                Reintentar
              </button>
            </div>

          ) : notificaciones.length === 0 ? (

            <EstadoVacio filtro={filtro} />

          ) : (

            <div className="space-y-3">

              {notificaciones.map(
                (notificacion) => (
                  <TarjetaNotificacion
                    key={notificacion.id}
                    notificacion={notificacion}
                    onMarcarLeida={
                      manejarMarcarLeida
                    }
                    marcando={
                      marcandoId === notificacion.id
                    }
                    bloqueada={
                      accionesBloqueadas
                    }
                  />
                )
              )}
            </div>
          )}
        </div>

        {/* PAGINACIÓN */}
        {!cargando && ultimaPagina > 1 && (

          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 px-5 py-5 sm:flex-row sm:px-6">

            <p className="text-sm font-medium text-slate-600">
              Página{" "}
              <span className="font-bold text-slate-900">
                {pagina}
              </span>{" "}
              de{" "}
              <span className="font-bold text-slate-900">
                {ultimaPagina}
              </span>
              {" · "}
              {total} notificaciones
            </p>

            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={() =>
                  setPagina((anterior) =>
                    Math.max(1, anterior - 1)
                  )
                }
                disabled={
                  pagina <= 1 ||
                  accionesBloqueadas
                }
                className={botonSecundario}
              >
                <ArrowLeft size={16} />
                Anterior
              </button>

              <button
                type="button"
                onClick={() =>
                  setPagina((anterior) =>
                    Math.min(
                      ultimaPagina,
                      anterior + 1
                    )
                  )
                }
                disabled={
                  pagina >= ultimaPagina ||
                  accionesBloqueadas
                }
                className={botonSecundario}
              >
                Siguiente
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* =============================================
          MODAL: MARCAR TODAS COMO LEÍDAS
      ============================================= */}

      {mostrarConfirmacionTodas && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="presentation"
        >

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-marcar-todas"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
          >

            {/* ÍCONO */}
            <div className="mb-5 flex items-start justify-between gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <CheckCheck size={24} />
              </div>

              <button
                type="button"
                onClick={cerrarModal}
                disabled={marcandoTodas}
                aria-label="Cerrar"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            {/* CONTENIDO */}
            <h2
              id="titulo-marcar-todas"
              className="text-xl font-bold tracking-tight text-slate-900"
            >
              Marcar todas como leídas
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Estás por marcar todas tus notificaciones
              pendientes como leídas.
            </p>

            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Actualmente tenés{" "}
              <span className="font-bold text-slate-800">
                {cantidadNoLeidas}
              </span>{" "}
              {cantidadNoLeidas === 1
                ? "notificación sin leer"
                : "notificaciones sin leer"}
              .
            </p>

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">

              <CheckCircle2
                size={19}
                className="mt-0.5 shrink-0 text-blue-700"
              />

              <p className="text-sm leading-relaxed text-blue-800">
                Esta acción actualizará el estado de lectura
                de todas tus notificaciones, no solamente
                las de la página actual.
              </p>
            </div>

            {/* BOTONES */}
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={cerrarModal}
                disabled={marcandoTodas}
                className={botonSecundario}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarMarcarTodas}
                disabled={marcandoTodas}
                className={botonPrincipal}
              >
                {marcandoTodas ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <CheckCheck size={17} />
                )}

                {marcandoTodas
                  ? "Procesando..."
                  : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
