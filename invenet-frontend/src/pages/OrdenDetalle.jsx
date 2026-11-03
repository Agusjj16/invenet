
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleCheckBig,
  ClipboardList,
  Clock3,
  FileText,
  Hash,
  Info,
  Loader2,
  MapPin,
  Monitor,
  PackageCheck,
  Pencil,
  Play,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
  Wrench,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../context/FeedbackContext";

import {
  obtenerOrden,
  recibirOrden,
  iniciarOrden,
  actualizarTrabajoOrden,
  finalizarOrden,
} from "../services/ordenReparacionService";

import EstadoOrdenBadge from "../components/EstadoOrdenBadge";

// =====================================================
// ESTILOS GENERALES
// =====================================================

const botonSecundario =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const botonPrincipal =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50";

const botonFinalizar =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none";

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function formatearFecha(fecha) {
  if (!fecha) return "No registrada";

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

function nombreCompleto(usuario) {
  if (!usuario) return "No disponible";

  return (
    [usuario.nombre, usuario.apellido]
      .filter(Boolean)
      .join(" ") || "No disponible"
  );
}

function obtenerMensajeError(error, mensajeAlternativo) {
  return (
    error?.response?.data?.message ||
    mensajeAlternativo
  );
}

function obtenerErroresValidacion(error) {
  return error?.response?.data?.errors ?? {};
}

function obtenerOrdenRespuesta(respuesta) {
  return (
    respuesta?.orden ??
    respuesta?.data?.orden ??
    respuesta?.data?.data ??
    respuesta?.data ??
    respuesta
  );
}

function esOrdenValida(orden) {
  return (
    orden &&
    typeof orden === "object" &&
    !Array.isArray(orden) &&
    orden.id != null
  );
}

// =====================================================
// COMPONENTE: SECCIÓN
// =====================================================

function Seccion({
  titulo,
  descripcion,
  icono: Icono,
  children,
  accion,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <Icono size={19} strokeWidth={1.8} />
          </div>

          <div className="min-w-0">
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              {titulo}
            </h2>

            {descripcion && (
              <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
                {descripcion}
              </p>
            )}
          </div>
        </div>

        {accion && (
          <div className="shrink-0">{accion}</div>
        )}
      </div>

      <div className="p-5 sm:p-6">
        {children}
      </div>
    </section>
  );
}

// =====================================================
// COMPONENTE: CAMPO INFORMATIVO
// =====================================================

function Campo({ etiqueta, valor, icono: Icono }) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {Icono && <Icono size={13} />}
        {etiqueta}
      </p>

      <div className="break-words text-sm font-semibold text-slate-800">
        {valor ?? "No disponible"}
      </div>
    </div>
  );
}

// =====================================================
// COMPONENTE: INDICADOR
// =====================================================

function Indicador({
  titulo,
  valor,
  icono: Icono,
  color = "blue",
}) {
  const colores = {
    blue: "bg-blue-50 text-blue-700",
    violet: "bg-violet-50 text-violet-700",
    emerald: "bg-emerald-50 text-emerald-700",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {titulo}
          </p>

          <div className="mt-2 break-words text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
            {valor}
          </div>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            colores[color] ?? colores.blue
          }`}
        >
          <Icono size={19} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}

// =====================================================
// COMPONENTE: ETAPA DE SEGUIMIENTO
// =====================================================

function EtapaSeguimiento({
  titulo,
  fecha,
  completada,
  actual,
  esUltima,
}) {
  return (
    <div className="relative flex gap-3">
      {!esUltima && (
        <div
          className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${
            completada
              ? "bg-emerald-200"
              : "bg-slate-200"
          }`}
        />
      )}

      <div
        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
          completada
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : actual
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-slate-50 text-slate-400"
        }`}
      >
        {completada ? (
          <CheckCircle2 size={17} />
        ) : actual ? (
          <Clock3 size={16} />
        ) : (
          <span className="h-2 w-2 rounded-full bg-slate-300" />
        )}
      </div>

      <div className="min-w-0 flex-1 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={`text-sm font-semibold ${
              completada || actual
                ? "text-slate-900"
                : "text-slate-500"
            }`}
          >
            {titulo}
          </p>

          {actual && !completada && (
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
              Próximo paso
            </span>
          )}
        </div>

        <p className="mt-1 text-xs text-slate-500">
          {completada
            ? formatearFecha(fecha)
            : actual
              ? "Pendiente de realizar"
              : "Aún no realizada"}
        </p>
      </div>
    </div>
  );
}

// =====================================================
// COMPONENTE: PASO DE GESTIÓN
// =====================================================

function PasoGestion({
  numero,
  titulo,
  descripcion,
  icono: Icono,
  completado,
  disponible,
  children,
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        completado
          ? "border-emerald-200 bg-emerald-50/40"
          : disponible
            ? "border-blue-200 bg-blue-50/30"
            : "border-slate-200 bg-slate-50/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            completado
              ? "bg-emerald-100 text-emerald-700"
              : disponible
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-400"
          }`}
        >
          {completado ? (
            <CheckCircle2 size={20} />
          ) : (
            <Icono size={19} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              {numero}. {titulo}
            </h3>

            {completado && (
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                Completado
              </span>
            )}
          </div>

          <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
            {descripcion}
          </p>
        </div>
      </div>

      {children && (
        <div className="mt-4">{children}</div>
      )}
    </div>
  );
}

// =====================================================
// COMPONENTE: BLOQUE DE TRABAJO
// =====================================================

function BloqueTrabajo({
  titulo,
  contenido,
  vacio,
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-800">
        {titulo}
      </h3>

      <div
        className={`min-h-20 rounded-xl border p-4 ${
          contenido
            ? "border-slate-200 bg-slate-50/70"
            : "border-dashed border-slate-200 bg-slate-50/40"
        }`}
      >
        <p
          className={`whitespace-pre-wrap text-sm leading-relaxed ${
            contenido
              ? "text-slate-700"
              : "italic text-slate-400"
          }`}
        >
          {contenido || vacio}
        </p>
      </div>
    </div>
  );
}

// =====================================================
// COMPONENTE: CAMPO DE FORMULARIO
// =====================================================

function CampoTrabajo({
  id,
  etiqueta,
  ayuda,
  valor,
  onChange,
  error,
  placeholder,
  filas = 4,
  disabled,
  obligatorio = false,
}) {
  const mensajeError = Array.isArray(error)
    ? error[0]
    : error;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-semibold text-slate-800"
      >
        {etiqueta}

        {obligatorio && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <p className="mb-3 text-xs leading-relaxed text-slate-500">
        {ayuda}
      </p>

      <textarea
        id={id}
        name={id}
        value={valor}
        onChange={onChange}
        disabled={disabled}
        rows={filas}
        placeholder={placeholder}
        aria-invalid={Boolean(mensajeError)}
        aria-describedby={
          mensajeError ? `${id}-error` : undefined
        }
        className={`w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 ${
          mensajeError
            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
            : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"
        }`}
      />

      {mensajeError && (
        <p
          id={`${id}-error`}
          className="mt-2 flex items-center gap-2 text-xs font-medium text-red-600"
        >
          <AlertCircle size={15} />
          {mensajeError}
        </p>
      )}
    </div>
  );
}

// =====================================================
// PÁGINA PRINCIPAL
// =====================================================

export default function OrdenDetalle() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast, confirmar } = useFeedback();

  // =====================================================
  // REFERENCIAS DE CONTROL
  // =====================================================

  const montadoRef = useRef(false);
  const operacionRef = useRef(false);
  const solicitudRef = useRef(0);

  const toastRef = useRef(toast);
  toastRef.current = toast;

  const confirmarRef = useRef(confirmar);
  confirmarRef.current = confirmar;

  // =====================================================
  // ESTADOS
  // =====================================================

  const [orden, setOrden] = useState(null);

  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);

  const [error, setError] = useState("");
  const [procesandoAccion, setProcesandoAccion] =
    useState("");

  const [editandoTrabajo, setEditandoTrabajo] =
    useState(false);

  const [guardandoTrabajo, setGuardandoTrabajo] =
    useState(false);

  const [finalizandoOrden, setFinalizandoOrden] =
    useState(false);

  const [confirmandoAccion, setConfirmandoAccion] =
    useState(false);

  const [formularioTrabajo, setFormularioTrabajo] =
    useState({
      diagnostico: "",
      detalle_reparacion: "",
      observaciones: "",
    });

  const [erroresTrabajo, setErroresTrabajo] =
    useState({});

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

  const puedeVerActivo =
    tienePermiso("activos.ver");

  const puedeVerReporte =
    tienePermiso("reportes.todos") ||
    tienePermiso("reportes.propios");

  const esTecnicoAsignado =
    Boolean(orden) &&
    user?.id != null &&
    Number(orden.tecnico_id) === Number(user.id);

  const puedeGestionarReparacion =
    esTecnicoAsignado &&
    tienePermiso("ordenes.reparar");

  // =====================================================
  // DATOS DERIVADOS
  // =====================================================

  const reporte = orden?.reporte;
  const activo = reporte?.activo;
  const tecnico = orden?.tecnico;
  const reportante = reporte?.usuario;

  const estado =
    orden?.estado?.nombre ?? "Sin estado";

  const ordenPendiente = estado === "Pendiente";
  const reparacionEnProceso = estado === "En proceso";
  const ordenFinalizada = estado === "Finalizada";

  const equipoRecibido = Boolean(
    orden?.fecha_recepcion
  );

  const reparacionIniciada = Boolean(
    orden?.fecha_inicio
  );

  const diagnosticoCompleto = Boolean(
    orden?.diagnostico?.trim()
  );

  const reparacionCompleta = Boolean(
    orden?.detalle_reparacion?.trim()
  );

  const trabajoCompleto =
    diagnosticoCompleto && reparacionCompleta;

  const puedeRecibir =
    puedeGestionarReparacion &&
    ordenPendiente &&
    !equipoRecibido;

  const puedeIniciar =
    puedeGestionarReparacion &&
    ordenPendiente &&
    equipoRecibido;

  const puedeEditarTrabajo =
    puedeGestionarReparacion &&
    reparacionEnProceso;

  const puedeFinalizarOrden =
    puedeGestionarReparacion &&
    reparacionEnProceso &&
    trabajoCompleto;

  const operacionEnCurso =
    actualizando ||
    Boolean(procesandoAccion) ||
    guardandoTrabajo ||
    finalizandoOrden ||
    confirmandoAccion;

  const descripcionEquipo =
    [activo?.marca, activo?.modelo]
      .filter(Boolean)
      .join(" ") || "Sin marca o modelo";

  // =====================================================
  // CARGAR DETALLE
  // =====================================================

  const cargarOrden = useCallback(
    async ({
      mostrarCargaCompleta = true,
      mostrarError = true,
    } = {}) => {
      const numeroSolicitud = ++solicitudRef.current;

      if (montadoRef.current) {
        if (mostrarCargaCompleta) {
          setCargando(true);
        } else {
          setActualizando(true);
        }
      }

      try {
        const respuesta = await obtenerOrden(id);

        const ordenObtenida =
          obtenerOrdenRespuesta(respuesta);

        if (!esOrdenValida(ordenObtenida)) {
          throw new Error(
            "La respuesta del servidor no contiene una orden válida."
          );
        }

        if (
          !montadoRef.current ||
          numeroSolicitud !== solicitudRef.current
        ) {
          return false;
        }

        setOrden(ordenObtenida);
        setError("");

        return true;
      } catch (err) {
        console.error(
          "Error al obtener la orden:",
          err
        );

        if (
          !montadoRef.current ||
          numeroSolicitud !== solicitudRef.current
        ) {
          return false;
        }

        const mensaje =
          err?.response?.data?.message ||
          err?.message ||
          "No se pudo cargar la orden de reparación.";

        if (mostrarError) {
          setError(mensaje);
        }

        if (mostrarCargaCompleta) {
          setOrden(null);
        }

        return false;
      } finally {
        if (
          montadoRef.current &&
          numeroSolicitud === solicitudRef.current
        ) {
          setCargando(false);
          setActualizando(false);
        }
      }
    },
    [id]
  );

  // =====================================================
  // CARGA INICIAL
  // =====================================================

  useEffect(() => {
    setError("");
    setOrden(null);
    setEditandoTrabajo(false);
    setErroresTrabajo({});
    setFormularioTrabajo({
      diagnostico: "",
      detalle_reparacion: "",
      observaciones: "",
    });

    cargarOrden();
  }, [cargarOrden]);

  // =====================================================
  // ACTUALIZACIÓN MANUAL
  // =====================================================

  const manejarActualizar = async () => {
    if (
      operacionRef.current ||
      operacionEnCurso ||
      editandoTrabajo
    ) {
      return;
    }

    operacionRef.current = true;

    try {
      await cargarOrden({
        mostrarCargaCompleta: false,
      });
    } finally {
      operacionRef.current = false;
    }
  };

  // =====================================================
  // SINCRONIZACIÓN POSTERIOR A UNA OPERACIÓN
  // =====================================================

  const sincronizarDespuesDeOperacion = async (
    respuesta
  ) => {
    const ordenActualizada =
      respuesta?.orden ??
      respuesta?.data?.orden;

    if (
      montadoRef.current &&
      esOrdenValida(ordenActualizada)
    ) {
      setOrden(ordenActualizada);
    }

    const sincronizado = await cargarOrden({
      mostrarCargaCompleta: false,
      mostrarError: false,
    });

    if (!sincronizado && montadoRef.current) {
      toastRef.current.warning(
        "La operación se realizó, pero no se pudo actualizar la información. Usá el botón Actualizar."
      );
    }

    return sincronizado;
  };

  // =====================================================
  // EJECUTAR ACCIÓN CON CONFIRMACIÓN
  // =====================================================

  const ejecutarAccionConfirmada = async ({
    accion,
    disponible,
    titulo,
    mensaje,
    textoConfirmar,
    variante,
    servicio,
    mensajeExito,
    mensajeError,
  }) => {
    if (
      !disponible ||
      operacionRef.current ||
      operacionEnCurso ||
      editandoTrabajo
    ) {
      return;
    }

    operacionRef.current = true;
    setConfirmandoAccion(true);

    let aceptado = false;

    try {
      aceptado = await confirmarRef.current({
        titulo,
        mensaje,
        textoConfirmar,
        textoCancelar: "Cancelar",
        variante,
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
      if (montadoRef.current) {
        setConfirmandoAccion(false);
      }

      if (!aceptado) {
        operacionRef.current = false;
      }
    }

    if (!aceptado || !montadoRef.current) {
      operacionRef.current = false;
      return;
    }

    setProcesandoAccion(accion);
    setError("");

    if (accion === "finalizacion") {
      setFinalizandoOrden(true);
    }

    try {
      const respuesta = await servicio(id);

      if (!montadoRef.current) return;

      toastRef.current.success(
        respuesta?.message ||
        respuesta?.data?.message ||
        mensajeExito
      );

      await sincronizarDespuesDeOperacion(respuesta);
    } catch (err) {
      console.error(
        `Error en la acción ${accion}:`,
        err
      );

      if (!montadoRef.current) return;

      const mensajeObtenido =
        obtenerMensajeError(err, mensajeError);

      if (
        err?.response?.status === 422 ||
        err?.response?.status === 409
      ) {
        toastRef.current.warning(mensajeObtenido);
      } else if (err?.response?.status === 403) {
        toastRef.current.error(
          "No tenés permisos para realizar esta acción."
        );
      } else {
        toastRef.current.error(mensajeObtenido);
      }

      await cargarOrden({
        mostrarCargaCompleta: false,
        mostrarError: false,
      });
    } finally {
      operacionRef.current = false;

      if (montadoRef.current) {
        setProcesandoAccion("");
        setFinalizandoOrden(false);
      }
    }
  };

  // =====================================================
  // CONFIRMAR RECEPCIÓN
  // =====================================================

  const manejarRecepcion = () => {
    ejecutarAccionConfirmada({
      accion: "recepcion",
      disponible: puedeRecibir,

      titulo: "Confirmar recepción del equipo",

      mensaje:
        `¿Confirmás que recibiste el equipo ${
          activo?.codigo_inventario ?? ""
        } correspondiente a la orden #${orden.id}? ` +
        "Esta acción registrará la fecha de recepción.",

      textoConfirmar: "Confirmar recepción",
      variante: "primary",

      servicio: recibirOrden,

      mensajeExito:
        "Recepción del equipo registrada correctamente.",

      mensajeError:
        "No se pudo registrar la recepción del equipo.",
    });
  };

  // =====================================================
  // INICIAR REPARACIÓN
  // =====================================================

  const manejarInicio = () => {
    ejecutarAccionConfirmada({
      accion: "inicio",
      disponible: puedeIniciar,

      titulo: "Iniciar reparación",

      mensaje:
        `¿Querés iniciar la reparación del equipo ${
          activo?.codigo_inventario ?? ""
        } correspondiente a la orden #${orden.id}?`,

      textoConfirmar: "Iniciar reparación",
      variante: "primary",

      servicio: iniciarOrden,

      mensajeExito:
        "La reparación se inició correctamente.",

      mensajeError:
        "No se pudo iniciar la reparación.",
    });
  };

  // =====================================================
  // EDITAR TRABAJO
  // =====================================================

  const manejarEditarTrabajo = () => {
    if (
      !puedeEditarTrabajo ||
      operacionRef.current ||
      operacionEnCurso
    ) {
      return;
    }

    setFormularioTrabajo({
      diagnostico: orden.diagnostico ?? "",
      detalle_reparacion:
        orden.detalle_reparacion ?? "",
      observaciones: orden.observaciones ?? "",
    });

    setErroresTrabajo({});
    setError("");
    setEditandoTrabajo(true);
  };

  // =====================================================
  // CAMBIAR CAMPOS
  // =====================================================

  const manejarCambioTrabajo = (event) => {
    const { name, value } = event.target;

    setFormularioTrabajo((anterior) => ({
      ...anterior,
      [name]: value,
    }));

    setErroresTrabajo((anterior) => ({
      ...anterior,
      [name]: undefined,
    }));
  };

  // =====================================================
  // CANCELAR EDICIÓN
  // =====================================================

  const manejarCancelarTrabajo = () => {
    if (
      guardandoTrabajo ||
      operacionRef.current
    ) {
      return;
    }

    setEditandoTrabajo(false);
    setErroresTrabajo({});
  };

  // =====================================================
  // GUARDAR TRABAJO
  // =====================================================

  const manejarGuardarTrabajo = async (event) => {
    event.preventDefault();

    if (
      !puedeEditarTrabajo ||
      !editandoTrabajo ||
      operacionRef.current ||
      operacionEnCurso
    ) {
      return;
    }

    operacionRef.current = true;

    setGuardandoTrabajo(true);
    setErroresTrabajo({});
    setError("");

    const datos = {
      diagnostico:
        formularioTrabajo.diagnostico.trim(),

      detalle_reparacion:
        formularioTrabajo.detalle_reparacion.trim(),

      observaciones:
        formularioTrabajo.observaciones.trim(),
    };

    try {
      const respuesta = await actualizarTrabajoOrden(
        id,
        datos
      );

      if (!montadoRef.current) return;

      setEditandoTrabajo(false);

      toastRef.current.success(
        respuesta?.message ||
        respuesta?.data?.message ||
        "Trabajo de reparación guardado correctamente."
      );

      await sincronizarDespuesDeOperacion(respuesta);
    } catch (err) {
      console.error(
        "Error al guardar el trabajo:",
        err
      );

      if (!montadoRef.current) return;

      const errores =
        obtenerErroresValidacion(err);

      setErroresTrabajo(errores);

      const mensaje =
        obtenerMensajeError(
          err,
          "No se pudo guardar el trabajo de reparación."
        );

      if (err?.response?.status === 422) {
        if (Object.keys(errores).length === 0) {
          toastRef.current.warning(mensaje);
        }
      } else if (err?.response?.status === 403) {
        toastRef.current.error(
          "No tenés permisos para modificar esta reparación."
        );
      } else {
        toastRef.current.error(mensaje);
      }
    } finally {
      operacionRef.current = false;

      if (montadoRef.current) {
        setGuardandoTrabajo(false);
      }
    }
  };

  // =====================================================
  // FINALIZAR ORDEN
  // =====================================================

  const manejarFinalizarOrden = () => {
    if (
      !puedeFinalizarOrden ||
      editandoTrabajo
    ) {
      return;
    }

    ejecutarAccionConfirmada({
      accion: "finalizacion",
      disponible: puedeFinalizarOrden,

      titulo: "Finalizar reparación",

      mensaje:
        `¿Confirmás que el equipo ${
          activo?.codigo_inventario ?? ""
        } fue reparado correctamente? ` +
        `Se finalizará la orden #${orden.id}, ` +
        "se cerrará el reporte asociado y el activo " +
        "volverá al estado operativo según las reglas del sistema. " +
        "Después no podrás seguir editando el trabajo de esta orden.",

      textoConfirmar: "Finalizar reparación",
      variante: "success",

      servicio: finalizarOrden,

      mensajeExito:
        "La reparación se finalizó correctamente.",

      mensajeError:
        "No se pudo finalizar la reparación.",
    });
  };

  // =====================================================
  // ESTADO DE CARGA
  // =====================================================

  if (cargando) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2
          size={28}
          className="animate-spin text-blue-700"
        />

        <p className="text-sm font-medium text-slate-500">
          Cargando detalle de la orden...
        </p>
      </div>
    );
  }

  // =====================================================
  // ORDEN NO DISPONIBLE
  // =====================================================

  if (!orden) {
    return (
      <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-10">
        <Link
          to="/ordenes-reparacion"
          className={botonSecundario}
        >
          <ArrowLeft size={17} />
          Volver a órdenes
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle size={27} />
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            No se pudo mostrar la orden
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {error || "La orden no está disponible."}
          </p>

          <button
            type="button"
            onClick={() => {
              setError("");
              cargarOrden();
            }}
            className={`mt-6 ${botonPrincipal}`}
          >
            <RefreshCw size={17} />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // ETAPAS DE SEGUIMIENTO
  // =====================================================

  const etapas = [
    {
      titulo: "Orden asignada",
      fecha: orden.fecha_asignacion,
    },
    {
      titulo: "Equipo recibido",
      fecha: orden.fecha_recepcion,
    },
    {
      titulo: "Reparación iniciada",
      fecha: orden.fecha_inicio,
    },
    {
      titulo: "Reparación finalizada",
      fecha: orden.fecha_finalizacion,
    },
  ];

  const proximaEtapa = etapas.findIndex(
    (etapa) => !etapa.fecha
  );

  // =====================================================
  // MENSAJE CONTEXTUAL
  // =====================================================

  let tituloSiguientePaso = "";
  let descripcionSiguientePaso = "";

  if (ordenFinalizada) {
    tituloSiguientePaso = "Reparación finalizada";

    descripcionSiguientePaso =
      "La orden está cerrada y el trabajo técnico quedó registrado.";
  } else if (ordenPendiente && !equipoRecibido) {
    tituloSiguientePaso = "Pendiente de recepción";

    descripcionSiguientePaso =
      "El técnico responsable debe confirmar que recibió el equipo.";
  } else if (ordenPendiente && equipoRecibido) {
    tituloSiguientePaso = "Equipo recibido";

    descripcionSiguientePaso =
      "El siguiente paso es iniciar la reparación.";
  } else if (
    reparacionEnProceso &&
    !trabajoCompleto
  ) {
    tituloSiguientePaso = "Registrar trabajo técnico";

    descripcionSiguientePaso =
      "Para finalizar la orden es necesario guardar el diagnóstico y las tareas realizadas.";
  } else if (
    reparacionEnProceso &&
    trabajoCompleto
  ) {
    tituloSiguientePaso = "Lista para finalizar";

    descripcionSiguientePaso =
      "El diagnóstico y el detalle de reparación están registrados. El técnico puede finalizar la orden.";
  }

  // =====================================================
  // RENDERIZADO PRINCIPAL
  // =====================================================

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-10">

      {/* =============================================
          NAVEGACIÓN
      ============================================= */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/ordenes-reparacion"
          className={botonSecundario}
        >
          <ArrowLeft size={17} />
          Volver a órdenes
        </Link>

        <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-400">
          <Wrench size={15} />
          Gestión de mantenimiento
        </span>
      </div>

      {/* =============================================
          ENCABEZADO
      ============================================= */}

      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-blue-700" />

        <div className="flex flex-col justify-between gap-5 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Wrench
                size={27}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                Detalle de reparación
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Orden #{orden.id}
              </h1>

              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Consultá la información del equipo,
                el trabajo realizado y el seguimiento
                de la reparación.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <EstadoOrdenBadge estado={estado} />

                {esTecnicoAsignado && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                    <ShieldCheck size={14} />
                    Asignada a vos
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={manejarActualizar}
            disabled={
              operacionEnCurso ||
              editandoTrabajo
            }
            className={botonSecundario}
          >
            <RefreshCw
              size={17}
              className={
                actualizando ? "animate-spin" : ""
              }
            />
            Actualizar
          </button>
        </div>
      </header>

      {/* =============================================
          ERROR PERSISTENTE DE CONSULTA
      ============================================= */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0 text-red-600"
          />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>

            <p className="mt-1 text-xs text-red-600">
              Podés volver a consultar la información
              utilizando el botón Actualizar.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Cerrar error"
            className="text-red-600 hover:text-red-800"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* =============================================
          RESUMEN
      ============================================= */}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Indicador
          titulo="Número de orden"
          valor={`#${orden.id}`}
          icono={Hash}
          color="blue"
        />

        <Indicador
          titulo="Equipo"
          valor={
            activo?.codigo_inventario ??
            "No disponible"
          }
          icono={Monitor}
          color="blue"
        />

        <Indicador
          titulo="Reporte asociado"
          valor={`#${orden.reporte_id}`}
          icono={ClipboardList}
          color="violet"
        />

        <Indicador
          titulo="Estado actual"
          valor={
            <EstadoOrdenBadge estado={estado} />
          }
          icono={
            ordenFinalizada
              ? CheckCircle2
              : Clock3
          }
          color={
            ordenFinalizada
              ? "emerald"
              : "blue"
          }
        />
      </div>

      {/* =============================================
          SITUACIÓN ACTUAL
      ============================================= */}

      {tituloSiguientePaso && (
        <div
          className={`flex items-start gap-3 rounded-xl border p-4 ${
            ordenFinalizada
              ? "border-emerald-200 bg-emerald-50"
              : "border-blue-100 bg-blue-50"
          }`}
        >
          <div
            className={`mt-0.5 shrink-0 ${
              ordenFinalizada
                ? "text-emerald-700"
                : "text-blue-700"
            }`}
          >
            {ordenFinalizada ? (
              <CheckCircle2 size={20} />
            ) : (
              <Info size={20} />
            )}
          </div>

          <div>
            <p
              className={`text-sm font-bold ${
                ordenFinalizada
                  ? "text-emerald-900"
                  : "text-blue-900"
              }`}
            >
              {tituloSiguientePaso}
            </p>

            <p
              className={`mt-1 text-sm leading-relaxed ${
                ordenFinalizada
                  ? "text-emerald-800"
                  : "text-blue-800"
              }`}
            >
              {descripcionSiguientePaso}
            </p>
          </div>
        </div>
      )}

      {/* =============================================
          CONTENIDO PRINCIPAL
      ============================================= */}

      <div className="grid items-start gap-5 xl:grid-cols-3">

        {/* =============================================
            COLUMNA PRINCIPAL
        ============================================= */}

        <div className="space-y-5 xl:col-span-2">

          {/* =============================================
              EQUIPO ASOCIADO
          ============================================= */}

          <Seccion
            titulo="Equipo asociado"
            descripcion="Datos del activo que se encuentra en reparación."
            icono={Monitor}
          >
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <Campo
                etiqueta="Código de inventario"
                valor={
                  activo?.codigo_inventario ??
                  "No disponible"
                }
                icono={Hash}
              />

              <Campo
                etiqueta="Marca y modelo"
                valor={descripcionEquipo}
                icono={Monitor}
              />

              <Campo
                etiqueta="Número de serie"
                valor={activo?.numero_serie}
              />

              <Campo
                etiqueta="Categoría"
                valor={
                  activo?.categoria?.nombre ??
                  (activo?.categoria_id
                    ? `Categoría #${activo.categoria_id}`
                    : "No disponible")
                }
              />

              <Campo
                etiqueta="Ubicación"
                valor={
                  activo?.ubicacion?.nombre ??
                  (activo?.ubicacion_id
                    ? `Ubicación #${activo.ubicacion_id}`
                    : "No disponible")
                }
                icono={MapPin}
              />
            </div>

            {puedeVerActivo && activo?.id && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <Link
                  to={`/activos/${activo.id}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-900"
                >
                  <Monitor size={16} />
                  Ver ficha completa del activo
                  <ChevronRight size={15} />
                </Link>
              </div>
            )}
          </Seccion>

          {/* =============================================
              REPORTE DE ANOMALÍA
          ============================================= */}

          <Seccion
            titulo="Reporte de anomalía"
            descripcion="Problema que dio origen a esta orden de reparación."
            icono={ClipboardList}
          >
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <Campo
                etiqueta="Número de reporte"
                valor={
                  reporte?.id
                    ? `#${reporte.id}`
                    : "No disponible"
                }
                icono={Hash}
              />

              <Campo
                etiqueta="Fecha del reporte"
                valor={formatearFecha(
                  reporte?.fecha_reporte
                )}
                icono={CalendarDays}
              />

              <Campo
                etiqueta="Reportado por"
                valor={nombreCompleto(reportante)}
                icono={UserRound}
              />

              <Campo
                etiqueta="Estado del reporte"
                valor={
                  reporte?.estado?.nombre ??
                  "No disponible"
                }
              />
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Descripción de la anomalía
              </h3>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {reporte?.descripcion ||
                    "El reporte no tiene descripción."}
                </p>
              </div>
            </div>

            {puedeVerReporte && reporte?.id && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <Link
                  to={`/reportes/${reporte.id}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-900"
                >
                  <ClipboardList size={16} />
                  Ver reporte completo
                  <ChevronRight size={15} />
                </Link>
              </div>
            )}
          </Seccion>

          {/* =============================================
              TRABAJO DE REPARACIÓN
          ============================================= */}

          <Seccion
            titulo="Trabajo de reparación"
            descripcion="Diagnóstico, tareas realizadas y observaciones del técnico."
            icono={Wrench}
            accion={
              puedeEditarTrabajo &&
              !editandoTrabajo && (
                <button
                  type="button"
                  onClick={manejarEditarTrabajo}
                  disabled={operacionEnCurso}
                  className={botonSecundario}
                >
                  <Pencil size={16} />

                  {orden.diagnostico ||
                  orden.detalle_reparacion ||
                  orden.observaciones
                    ? "Editar trabajo"
                    : "Registrar trabajo"}
                </button>
              )
            }
          >
            {editandoTrabajo && puedeEditarTrabajo ? (

              /* FORMULARIO DE EDICIÓN */

              <form
                onSubmit={manejarGuardarTrabajo}
                className="space-y-5"
              >
                <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <Info
                    size={18}
                    className="mt-0.5 shrink-0 text-blue-700"
                  />

                  <p className="text-sm leading-relaxed text-blue-800">
                    Podés guardar avances durante la reparación.
                    Para finalizar la orden, el diagnóstico y
                    el detalle de reparación deben estar completos.
                  </p>
                </div>

                <CampoTrabajo
                  id="diagnostico"
                  etiqueta="Diagnóstico técnico"
                  ayuda="Explicá cuál es la falla detectada y, si corresponde, su causa."
                  valor={formularioTrabajo.diagnostico}
                  onChange={manejarCambioTrabajo}
                  error={erroresTrabajo.diagnostico}
                  placeholder="Ej.: Se detectó una falla en la memoria RAM que provoca reinicios inesperados..."
                  filas={5}
                  disabled={guardandoTrabajo}
                  obligatorio
                />

                <CampoTrabajo
                  id="detalle_reparacion"
                  etiqueta="Detalle de reparación"
                  ayuda="Describí las tareas realizadas para solucionar el problema."
                  valor={
                    formularioTrabajo.detalle_reparacion
                  }
                  onChange={manejarCambioTrabajo}
                  error={
                    erroresTrabajo.detalle_reparacion
                  }
                  placeholder="Ej.: Se reemplazó el módulo de memoria defectuoso y se verificó el funcionamiento del equipo..."
                  filas={5}
                  disabled={guardandoTrabajo}
                  obligatorio
                />

                <CampoTrabajo
                  id="observaciones"
                  etiqueta="Observaciones"
                  ayuda="Agregá recomendaciones o información adicional, si corresponde."
                  valor={formularioTrabajo.observaciones}
                  onChange={manejarCambioTrabajo}
                  error={erroresTrabajo.observaciones}
                  placeholder="Ej.: Se recomienda realizar mantenimiento preventivo durante los próximos meses..."
                  filas={4}
                  disabled={guardandoTrabajo}
                />

                <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
                  <button
                    type="button"
                    onClick={manejarCancelarTrabajo}
                    disabled={guardandoTrabajo}
                    className={botonSecundario}
                  >
                    <X size={17} />
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={
                      guardandoTrabajo ||
                      operacionEnCurso
                    }
                    className={botonPrincipal}
                  >
                    {guardandoTrabajo ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save size={17} />
                        Guardar trabajo
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (

              /* VISUALIZACIÓN DEL TRABAJO */

              <div className="space-y-5">
                <BloqueTrabajo
                  titulo="Diagnóstico técnico"
                  contenido={orden.diagnostico}
                  vacio="Todavía no se registró un diagnóstico."
                />

                <BloqueTrabajo
                  titulo="Detalle de reparación"
                  contenido={orden.detalle_reparacion}
                  vacio="Todavía no se registraron tareas de reparación."
                />

                <BloqueTrabajo
                  titulo="Observaciones"
                  contenido={orden.observaciones}
                  vacio="Sin observaciones registradas."
                />

                {(orden.diagnostico ||
                  orden.detalle_reparacion ||
                  orden.observaciones) && (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                    <CheckCircle2
                      size={18}
                      className="mt-0.5 shrink-0 text-emerald-700"
                    />

                    <div>
                      <p className="text-sm font-semibold text-emerald-900">
                        Información guardada
                      </p>

                      <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                        El trabajo registrado está disponible
                        para su consulta.
                        {puedeEditarTrabajo &&
                          " Podés actualizarlo mientras la reparación siga en proceso."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Seccion>
        </div>

        {/* =============================================
            COLUMNA LATERAL
        ============================================= */}

        <div className="space-y-5">

          {/* =============================================
              GESTIÓN DE LA REPARACIÓN
          ============================================= */}

          {puedeGestionarReparacion &&
            !ordenFinalizada && (
              <Seccion
                titulo="Gestionar reparación"
                descripcion="Realizá las acciones siguiendo el orden indicado."
                icono={Wrench}
              >
                <div className="space-y-3">

                  {/* PASO 1 */}

                  <PasoGestion
                    numero="1"
                    titulo="Recibir equipo"
                    icono={PackageCheck}
                    completado={equipoRecibido}
                    disponible={puedeRecibir}
                    descripcion={
                      equipoRecibido
                        ? `Recibido el ${formatearFecha(
                            orden.fecha_recepcion
                          )}.`
                        : "Confirmá que el equipo está en tus manos."
                    }
                  >
                    {puedeRecibir && (
                      <button
                        type="button"
                        onClick={manejarRecepcion}
                        disabled={operacionEnCurso}
                        className={`w-full ${botonPrincipal}`}
                      >
                        {procesandoAccion === "recepcion" ? (
                          <>
                            <Loader2
                              size={17}
                              className="animate-spin"
                            />
                            Registrando...
                          </>
                        ) : (
                          <>
                            <PackageCheck size={17} />
                            Confirmar recepción
                          </>
                        )}
                      </button>
                    )}
                  </PasoGestion>

                  {/* PASO 2 */}

                  <PasoGestion
                    numero="2"
                    titulo="Iniciar reparación"
                    icono={Play}
                    completado={reparacionIniciada}
                    disponible={puedeIniciar}
                    descripcion={
                      reparacionIniciada
                        ? `Iniciada el ${formatearFecha(
                            orden.fecha_inicio
                          )}.`
                        : equipoRecibido
                          ? "El equipo fue recibido. Ya podés iniciar el trabajo."
                          : "Primero debés confirmar la recepción del equipo."
                    }
                  >
                    {puedeIniciar && (
                      <button
                        type="button"
                        onClick={manejarInicio}
                        disabled={operacionEnCurso}
                        className={`w-full ${botonPrincipal}`}
                      >
                        {procesandoAccion === "inicio" ? (
                          <>
                            <Loader2
                              size={17}
                              className="animate-spin"
                            />
                            Iniciando...
                          </>
                        ) : (
                          <>
                            <Play size={17} />
                            Iniciar reparación
                          </>
                        )}
                      </button>
                    )}
                  </PasoGestion>

                  {/* PASO 3 */}

                  <PasoGestion
                    numero="3"
                    titulo="Registrar trabajo"
                    icono={FileText}
                    completado={
                      reparacionEnProceso &&
                      trabajoCompleto
                    }
                    disponible={
                      reparacionEnProceso &&
                      !trabajoCompleto
                    }
                    descripcion={
                      trabajoCompleto
                        ? "Diagnóstico y tareas de reparación registrados."
                        : reparacionEnProceso
                          ? "Completá el diagnóstico y las tareas realizadas."
                          : "Disponible cuando comience la reparación."
                    }
                  >
                    {reparacionEnProceso &&
                      !trabajoCompleto &&
                      !editandoTrabajo && (
                        <button
                          type="button"
                          onClick={manejarEditarTrabajo}
                          disabled={operacionEnCurso}
                          className={`w-full ${botonSecundario}`}
                        >
                          <Pencil size={16} />
                          Registrar trabajo
                        </button>
                      )}

                    {editandoTrabajo && (
                      <p className="text-xs font-medium text-blue-700">
                        Formulario de trabajo en edición.
                      </p>
                    )}
                  </PasoGestion>
                </div>
              </Seccion>
            )}

          {/* =============================================
              FINALIZAR REPARACIÓN
          ============================================= */}

          {puedeGestionarReparacion &&
            reparacionEnProceso && (
              <Seccion
                titulo="Finalizar reparación"
                descripcion="Verificá los requisitos antes de cerrar la orden."
                icono={CircleCheckBig}
              >
                <div className="space-y-4">

                  {/* REQUISITOS */}

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      {diagnosticoCompleto ? (
                        <CheckCircle2
                          size={18}
                          className="mt-0.5 shrink-0 text-emerald-600"
                        />
                      ) : (
                        <AlertCircle
                          size={18}
                          className="mt-0.5 shrink-0 text-amber-600"
                        />
                      )}

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Diagnóstico técnico
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {diagnosticoCompleto
                            ? "Registrado correctamente."
                            : "Pendiente de completar."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      {reparacionCompleta ? (
                        <CheckCircle2
                          size={18}
                          className="mt-0.5 shrink-0 text-emerald-600"
                        />
                      ) : (
                        <AlertCircle
                          size={18}
                          className="mt-0.5 shrink-0 text-amber-600"
                        />
                      )}

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Detalle de reparación
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {reparacionCompleta
                            ? "Tareas documentadas."
                            : "Pendiente de completar."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {!trabajoCompleto && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs leading-relaxed text-amber-800">
                        Para finalizar, completá y guardá
                        los dos campos obligatorios del
                        trabajo técnico.
                      </p>
                    </div>
                  )}

                  {trabajoCompleto && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                      <p className="text-xs font-semibold text-blue-900">
                        ¿Qué sucederá al finalizar?
                      </p>

                      <p className="mt-2 text-xs leading-relaxed text-blue-800">
                        Se cerrará la orden y el reporte
                        asociado. El equipo volverá al estado
                        operativo, según el flujo del sistema.
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={manejarFinalizarOrden}
                    disabled={
                      !puedeFinalizarOrden ||
                      operacionEnCurso ||
                      editandoTrabajo
                    }
                    className={`w-full ${botonFinalizar}`}
                  >
                    {finalizandoOrden ? (
                      <>
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                        Finalizando...
                      </>
                    ) : (
                      <>
                        <CircleCheckBig size={18} />
                        Finalizar reparación
                      </>
                    )}
                  </button>

                  {editandoTrabajo && (
                    <p className="text-center text-xs text-slate-500">
                      Guardá o cancelá la edición
                      antes de finalizar.
                    </p>
                  )}
                </div>
              </Seccion>
            )}

          {/* =============================================
              TÉCNICO RESPONSABLE
          ============================================= */}

          <Seccion
            titulo="Técnico responsable"
            descripcion="Personal asignado a esta orden."
            icono={UserRound}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <UserRound size={21} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">
                  {nombreCompleto(tecnico)}
                </p>

                <p className="mt-1 break-all text-xs text-slate-500">
                  {tecnico?.email ??
                    "Sin correo registrado"}
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <Campo
                etiqueta="Fecha de asignación"
                valor={formatearFecha(
                  orden.fecha_asignacion
                )}
                icono={CalendarDays}
              />
            </div>
          </Seccion>

          {/* =============================================
              SEGUIMIENTO
          ============================================= */}

          <Seccion
            titulo="Seguimiento"
            descripcion="Etapas registradas de la reparación."
            icono={Clock3}
          >
            <div className="pt-1">
              {etapas.map((etapa, indice) => (
                <EtapaSeguimiento
                  key={etapa.titulo}
                  titulo={etapa.titulo}
                  fecha={etapa.fecha}
                  completada={Boolean(etapa.fecha)}
                  actual={indice === proximaEtapa}
                  esUltima={
                    indice === etapas.length - 1
                  }
                />
              ))}
            </div>
          </Seccion>

          {/* =============================================
              DATOS DE REGISTRO
          ============================================= */}

          <Seccion
            titulo="Datos de registro"
            descripcion="Información administrativa de la orden."
            icono={FileText}
          >
            <div className="space-y-5">
              <Campo
                etiqueta="Identificador"
                valor={`#${orden.id}`}
                icono={Hash}
              />

              <Campo
                etiqueta="Fecha de creación"
                valor={formatearFecha(
                  orden.created_at
                )}
                icono={CalendarDays}
              />

              <Campo
                etiqueta="Última actualización"
                valor={formatearFecha(
                  orden.updated_at
                )}
                icono={RefreshCw}
              />
            </div>
          </Seccion>
        </div>
      </div>
    </div>
  );
}
