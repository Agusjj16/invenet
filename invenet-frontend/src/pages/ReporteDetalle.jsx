
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Link, useParams } from "react-router-dom";

import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Cpu,
  FileText,
  Hash,
  Info,
  Loader2,
  MapPin,
  Monitor,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Wrench,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../context/FeedbackContext";

import {
  obtenerReporte,
  cambiarEstadoReporte,
} from "../services/reporteService";

import EstadoReporteBadge from "../components/EstadoReporteBadge";

// =====================================================
// ESTILOS GENERALES
// =====================================================

const botonSecundario =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const botonPrincipal =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50";

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function formatearFecha(fecha) {
  if (!fecha) return "No disponible";

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

function obtenerMensajeError(error, mensajeAlternativo) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    mensajeAlternativo
  );
}

function obtenerEstadosDisponibles(estadoActual) {
  switch (estadoActual) {
    case "Pendiente":
      return [
        { id: 2, nombre: "En revisión" },
        { id: 4, nombre: "Cerrado" },
      ];

    case "En revisión":
      return [{ id: 4, nombre: "Cerrado" }];

    default:
      return [];
  }
}

// =====================================================
// COMPONENTE: CAMPO DE INFORMACIÓN
// =====================================================

function CampoDetalle({
  etiqueta,
  valor,
  icono: Icono,
}) {
  const contenido =
    valor === null ||
    valor === undefined ||
    valor === ""
      ? "No disponible"
      : valor;

  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-2 text-xs font-medium text-slate-500">
        {Icono && (
          <Icono
            size={15}
            className="shrink-0 text-slate-400"
          />
        )}

        {etiqueta}
      </dt>

      <dd className="mt-1.5 break-words text-sm font-semibold text-slate-900">
        {contenido}
      </dd>
    </div>
  );
}

// =====================================================
// COMPONENTE: ENCABEZADO DE SECCIÓN
// =====================================================

function EncabezadoSeccion({
  icono: Icono,
  titulo,
  descripcion,
  color = "blue",
  accion,
}) {
  const colores = {
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-600",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            colores[color] ?? colores.blue
          }`}
        >
          <Icono size={20} strokeWidth={1.8} />
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900">
            {titulo}
          </h2>

          {descripcion && (
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              {descripcion}
            </p>
          )}
        </div>
      </div>

      {accion}
    </div>
  );
}

// =====================================================
// PÁGINA PRINCIPAL
// =====================================================

export default function ReporteDetalle() {
  const { id } = useParams();

  const { user } = useAuth();
  const { toast, confirmar } = useFeedback();

  // =====================================================
  // REFERENCIAS
  // =====================================================

  const montadoRef = useRef(false);
  const procesandoRef = useRef(false);
  const confirmacionPendienteRef = useRef(false);

  const solicitudRef = useRef(0);

  const toastRef = useRef(toast);
  toastRef.current = toast;

  // =====================================================
  // PERMISOS
  // =====================================================

  const permisos =
    user?.rol?.permisos ??
    user?.permisos ??
    [];

  const tienePermiso = (nombre) =>
    permisos.some((permiso) =>
      typeof permiso === "string"
        ? permiso === nombre
        : permiso?.nombre === nombre
    );

  const puedeCambiarEstado =
    tienePermiso("reportes.estado");

  const puedeCrearOrden =
    tienePermiso("ordenes.crear");

  const puedeVerActivo =
    tienePermiso("activos.ver");

  // =====================================================
  // ESTADOS
  // =====================================================

  const [reporte, setReporte] = useState(null);

  const [cargando, setCargando] = useState(true);

  const [error, setError] = useState("");

  const [procesando, setProcesando] = useState(false);

  const [recarga, setRecarga] = useState(0);

  // =====================================================
  // CONTROL DE MONTAJE
  // =====================================================

  useEffect(() => {
    montadoRef.current = true;

    return () => {
      montadoRef.current = false;
      solicitudRef.current += 1;
    };
  }, []);

  // =====================================================
  // CARGAR REPORTE
  // =====================================================

  useEffect(() => {
    let vigente = true;

    const solicitud = ++solicitudRef.current;

    const cargarReporte = async () => {
      setCargando(true);
      setError("");

      try {
        const respuesta = await obtenerReporte(id);

        if (
          !vigente ||
          !montadoRef.current ||
          solicitud !== solicitudRef.current
        ) {
          return;
        }

        if (
          !respuesta ||
          typeof respuesta !== "object" ||
          !respuesta.id
        ) {
          throw new Error(
            "El servidor devolvió un reporte inválido."
          );
        }

        setReporte(respuesta);
      } catch (err) {
        if (
          !vigente ||
          !montadoRef.current ||
          solicitud !== solicitudRef.current
        ) {
          return;
        }

        console.error(
          "Error al cargar reporte:",
          err
        );

        setReporte(null);

        if (err?.response?.status === 403) {
          setError(
            "No tenés permisos para consultar este reporte."
          );
        } else if (err?.response?.status === 404) {
          setError(
            "El reporte solicitado no existe."
          );
        } else {
          setError(
            obtenerMensajeError(
              err,
              "No se pudo cargar el reporte."
            )
          );
        }
      } finally {
        if (
          vigente &&
          montadoRef.current &&
          solicitud === solicitudRef.current
        ) {
          setCargando(false);
        }
      }
    };

    cargarReporte();

    return () => {
      vigente = false;
      solicitudRef.current += 1;
    };
  }, [id, recarga]);

  // =====================================================
  // ACTUALIZAR REPORTE
  // =====================================================

  const refrescar = useCallback(() => {
    if (
      procesandoRef.current ||
      confirmacionPendienteRef.current
    ) {
      return;
    }

    setRecarga((valor) => valor + 1);

    // No mostrar Toast de éxito al actualizar.
  }, []);

  // =====================================================
  // ESTADO ACTUAL Y TRANSICIONES
  // =====================================================

  const estadoActual =
    reporte?.estado?.nombre ?? "Sin estado";

  const estadosDisponibles =
    obtenerEstadosDisponibles(estadoActual);

  // =====================================================
  // CAMBIAR ESTADO DEL REPORTE
  // =====================================================

  const solicitarCambioEstado = async (estado) => {
    if (
      !puedeCambiarEstado ||
      !reporte ||
      procesandoRef.current ||
      confirmacionPendienteRef.current
    ) {
      return;
    }

    const transicionValida =
      obtenerEstadosDisponibles(estadoActual).some(
        (item) => item.id === estado.id
      );

    if (!transicionValida) {
      toast.warning(
        "Esta transición de estado no está disponible."
      );
      return;
    }

    const reporteId = reporte.id;
    const estadoAnterior = estadoActual;

    confirmacionPendienteRef.current = true;

    let aceptado = false;

    try {
      const esCierre = estado.nombre === "Cerrado";

      aceptado = await confirmar({
        titulo: esCierre
          ? "Cerrar reporte de anomalía"
          : "Cambiar estado del reporte",

        mensaje: esCierre
          ? `¿Querés cerrar el reporte #${reporteId}? ` +
            `El estado cambiará de "${estadoAnterior}" a "Cerrado". ` +
            "Si se cierra sin reparación, el sistema actualizará " +
            "el estado del activo según las reglas del backend."
          : `¿Querés cambiar el estado del reporte #${reporteId} ` +
            `de "${estadoAnterior}" a "${estado.nombre}"?`,

        textoConfirmar: esCierre
          ? "Cerrar reporte"
          : "Confirmar cambio",

        textoCancelar: "Cancelar",

        variante: esCierre ? "warning" : "primary",
      });
    } catch (err) {
      console.error(
        "Error al solicitar confirmación:",
        err
      );

      toastRef.current.error(
        "No se pudo mostrar la confirmación."
      );

      return;
    } finally {
      confirmacionPendienteRef.current = false;
    }

    if (
      !aceptado ||
      !montadoRef.current ||
      procesandoRef.current
    ) {
      return;
    }

    procesandoRef.current = true;
    setProcesando(true);

    try {
      const respuesta = await cambiarEstadoReporte(
        reporteId,
        {
          estado_reporte_id: estado.id,
        }
      );

      toastRef.current.success(
        respuesta?.message ||
          "Estado del reporte actualizado correctamente."
      );

      // El cambio ya se guardó correctamente.
      // La recarga se ejecuta después y tiene
      // su propio manejo de errores.
      if (montadoRef.current) {
        setRecarga((valor) => valor + 1);
      }
    } catch (err) {
      console.error(
        "Error al cambiar estado:",
        err
      );

      if (!montadoRef.current) return;

      const mensaje = obtenerMensajeError(
        err,
        "No se pudo actualizar el estado del reporte."
      );

      if (err?.response?.status === 422) {
        toastRef.current.warning(mensaje);
      } else if (err?.response?.status === 403) {
        toastRef.current.error(
          "No tenés permisos para cambiar el estado del reporte."
        );
      } else {
        toastRef.current.error(mensaje);
      }
    } finally {
      procesandoRef.current = false;

      if (montadoRef.current) {
        setProcesando(false);
      }
    }
  };

  // =====================================================
  // RENDERIZADO: CARGANDO
  // =====================================================

  if (cargando) {
    return (
      <div className="mx-auto w-full max-w-[1600px]">
        <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <Loader2
            size={29}
            className="animate-spin text-blue-700"
          />

          <p className="mt-4 text-sm font-semibold text-slate-700">
            Cargando detalle del reporte...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Consultando la información registrada.
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDERIZADO: ERROR
  // =====================================================

  if (error || !reporte) {
    return (
      <div className="mx-auto w-full max-w-[1600px] space-y-4">
        <Link
          to="/reportes"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Volver a reportes
        </Link>

        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle size={27} />
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            No se pudo mostrar el reporte
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {error ||
              "No se encontró el reporte solicitado."}
          </p>

          <button
            type="button"
            onClick={refrescar}
            className={`mt-5 ${botonSecundario}`}
          >
            <RefreshCw size={17} />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // DATOS DEL REPORTE
  // =====================================================

  const activo = reporte.activo;
  const usuario = reporte.usuario;

  const nombreUsuario = usuario
    ? `${usuario.nombre ?? ""} ${
        usuario.apellido ?? ""
      }`.trim() || "No disponible"
    : "No disponible";

  const nombreEquipo = activo
    ? [activo.marca, activo.modelo]
        .filter(Boolean)
        .join(" ")
    : "";

  const activoDadoDeBaja =
    Boolean(activo?.deleted_at) ||
    activo?.estado?.nombre === "Dado de baja";

  const rutaActivo = activoDadoDeBaja
    ? `/activos/bajas/${activo?.id}`
    : `/activos/${activo?.id}`;

  // =====================================================
  // RENDERIZADO PRINCIPAL
  // =====================================================

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-4 pb-8">

      {/* =============================================
          NAVEGACIÓN
      ============================================= */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/reportes"
          className={botonSecundario}
        >
          <ArrowLeft size={17} />
          Volver a reportes
        </Link>

        <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-400">
          <ClipboardList size={15} />
          Gestión de incidencias
        </span>
      </div>

      {/* =============================================
          ENCABEZADO INSTITUCIONAL
      ============================================= */}

      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-blue-700" />

        <div className="flex flex-col justify-between gap-4 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <ClipboardList
                size={25}
                strokeWidth={1.8}
              />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Reporte #{reporte.id}
              </h1>

              <p className="mt-1.5 text-sm text-slate-500">
                Información y seguimiento de la anomalía registrada.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={refrescar}
            disabled={procesando}
            className={botonSecundario}
          >
            <RefreshCw size={17} />
            Actualizar
          </button>
        </div>
      </header>

      {/* =============================================
          RESUMEN COMPACTO
      ============================================= */}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">

        {/* ESTADO */}

        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <ShieldCheck size={16} />
            Estado actual
          </div>

          <EstadoReporteBadge estado={estadoActual} />
        </div>

        {/* FECHA */}

        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <CalendarDays size={16} />
            Fecha del reporte
          </div>

          <p className="text-sm font-bold text-slate-900">
            {formatearFecha(reporte.fecha_reporte)}
          </p>
        </div>

        {/* USUARIO */}

        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <UserRound size={16} />
            Reportado por
          </div>

          <p
            className="truncate text-sm font-bold text-slate-900"
            title={nombreUsuario}
          >
            {nombreUsuario}
          </p>
        </div>
      </section>

      {/* =============================================
          DESCRIPCIÓN DE LA ANOMALÍA
      ============================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <EncabezadoSeccion
          icono={AlertTriangle}
          titulo="Descripción de la anomalía"
          descripcion="Problema informado al registrar el reporte."
          color="amber"
        />

        <div className="p-5 sm:p-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
              {reporte.descripcion || "Sin descripción"}
            </p>
          </div>
        </div>
      </section>

      {/* =============================================
          INFORMACIÓN DEL ACTIVO
      ============================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <EncabezadoSeccion
          icono={Monitor}
          titulo="Activo afectado"
          descripcion="Equipo asociado al reporte de anomalía."
          color="blue"
          accion={
            activo &&
            puedeVerActivo && (
              <Link
                to={rutaActivo}
                className={botonSecundario}
              >
                <Monitor size={16} />
                Ver activo
                <ArrowRight size={15} />
              </Link>
            )
          }
        />

        <div className="p-5 sm:p-6">
          {activo ? (
            <>
              {activoDadoDeBaja && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <AlertTriangle
                    size={18}
                    className="mt-0.5 shrink-0 text-amber-700"
                  />

                  <p className="text-sm text-amber-800">
                    El activo asociado a este reporte
                    se encuentra dado de baja.
                  </p>
                </div>
              )}

              <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
                <CampoDetalle
                  etiqueta="Código de inventario"
                  valor={activo.codigo_inventario}
                  icono={Hash}
                />

                <CampoDetalle
                  etiqueta="Categoría"
                  valor={activo.categoria?.nombre}
                  icono={Cpu}
                />

                <CampoDetalle
                  etiqueta="Marca"
                  valor={activo.marca}
                />

                <CampoDetalle
                  etiqueta="Modelo"
                  valor={activo.modelo}
                />

                <CampoDetalle
                  etiqueta="Número de serie"
                  valor={activo.numero_serie}
                />

                <CampoDetalle
                  etiqueta="Ubicación"
                  valor={activo.ubicacion?.nombre}
                  icono={MapPin}
                />

                <CampoDetalle
                  etiqueta="Estado actual del activo"
                  valor={activo.estado?.nombre}
                />

                <CampoDetalle
                  etiqueta="Equipo"
                  valor={nombreEquipo}
                  icono={Monitor}
                />
              </dl>
            </>
          ) : (
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <Info
                size={19}
                className="shrink-0 text-slate-400"
              />

              <p className="text-sm text-slate-500">
                No se encontró información del activo asociado.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* =============================================
          INFORMACIÓN DEL REGISTRO
      ============================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <EncabezadoSeccion
          icono={FileText}
          titulo="Información del registro"
          descripcion="Datos de identificación y seguimiento del reporte."
          color="slate"
        />

        <div className="p-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
            <CampoDetalle
              etiqueta="Número de reporte"
              valor={`#${reporte.id}`}
              icono={Hash}
            />

            <CampoDetalle
              etiqueta="Usuario responsable"
              valor={nombreUsuario}
              icono={UserRound}
            />

            <CampoDetalle
              etiqueta="Fecha de creación"
              valor={formatearFecha(reporte.created_at)}
              icono={CalendarDays}
            />

            <CampoDetalle
              etiqueta="Última actualización"
              valor={formatearFecha(reporte.updated_at)}
              icono={Clock3}
            />

            <CampoDetalle
              etiqueta="Estado del reporte"
              valor={
                <EstadoReporteBadge
                  estado={estadoActual}
                />
              }
              icono={ShieldCheck}
            />
          </dl>
        </div>
      </section>

      {/* =============================================
          GESTIÓN DEL REPORTE
      ============================================= */}

      {puedeCambiarEstado && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <EncabezadoSeccion
            icono={ShieldCheck}
            titulo="Gestión del reporte"
            descripcion="Actualizá el estado según el seguimiento realizado."
            color="violet"
          />

          <div className="p-5 sm:p-6">

            {/* ESTADO ACTUAL */}

            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-slate-500">
                Estado actual:
              </span>

              <EstadoReporteBadge estado={estadoActual} />
            </div>

            {/* ACCIONES DISPONIBLES */}

            {estadosDisponibles.length > 0 ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  {estadosDisponibles.map((estado) => (
                    <button
                      key={estado.id}
                      type="button"
                      onClick={() =>
                        solicitarCambioEstado(estado)
                      }
                      disabled={procesando}
                      className={
                        estado.nombre === "Cerrado"
                          ? "inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                          : botonPrincipal
                      }
                    >
                      {estado.nombre === "Cerrado" ? (
                        <CheckCircle2 size={17} />
                      ) : (
                        <Clock3 size={17} />
                      )}

                      {estado.nombre === "Cerrado"
                        ? "Cerrar reporte"
                        : "Pasar a En revisión"}
                    </button>
                  ))}

                  {/* GENERAR ORDEN */}

                  {puedeCrearOrden &&
                    estadoActual === "En revisión" && (
                      <Link
                        to={`/ordenes-reparacion/nueva?reporte_id=${reporte.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
                      >
                        <Wrench size={17} />
                        Generar orden de reparación
                      </Link>
                    )}
                </div>

                {/* INFORMACIÓN */}

                <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <Info
                    size={18}
                    className="mt-0.5 shrink-0 text-blue-700"
                  />

                  <p className="text-sm leading-relaxed text-blue-800">
                    Al cerrar un reporte sin reparación,
                    el sistema actualizará automáticamente
                    el estado del activo según las reglas
                    establecidas en el backend.
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                {estadoActual === "Derivado a reparación" ? (
                  <Wrench
                    size={19}
                    className="shrink-0 text-violet-600"
                  />
                ) : (
                  <CheckCircle2
                    size={19}
                    className="shrink-0 text-emerald-600"
                  />
                )}

                <p className="text-sm leading-relaxed text-slate-600">
                  {estadoActual === "Derivado a reparación"
                    ? "Este reporte fue derivado a reparación. Su seguimiento continúa mediante la orden de reparación correspondiente."
                    : estadoActual === "Cerrado"
                      ? "Este reporte está cerrado y no admite nuevos cambios de estado."
                      : "No hay transiciones disponibles para el estado actual."}
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
