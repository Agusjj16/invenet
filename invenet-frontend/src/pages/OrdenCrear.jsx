
import { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Info,
  Loader2,
  Monitor,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Wrench,
  X,
} from "lucide-react";

import { useFeedback } from "../context/FeedbackContext";

import {
  obtenerReporte,
  obtenerReportes,
} from "../services/reporteService";

import { obtenerUsuarios } from "../services/usuarioService";

import { crearOrden } from "../services/ordenReparacionService";

// =====================================================
// ESTILOS COMPARTIDOS
// =====================================================

const botonSecundario =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const botonPrincipal =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none";

const inputBusqueda =
  "w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function extraerRegistros(respuesta) {
  if (Array.isArray(respuesta)) return respuesta;

  if (Array.isArray(respuesta?.data)) {
    return respuesta.data;
  }

  if (Array.isArray(respuesta?.usuarios)) {
    return respuesta.usuarios;
  }

  return [];
}

function nombreCompleto(usuario) {
  if (!usuario) return "No disponible";

  return (
    [usuario.nombre, usuario.apellido]
      .filter(Boolean)
      .join(" ") || "No disponible"
  );
}

function primerError(errores, campo) {
  const error = errores?.[campo];

  if (Array.isArray(error)) {
    return error[0] ?? "";
  }

  return error || "";
}

function obtenerMensajeError(error, alternativo) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    alternativo
  );
}

function esTecnicoActivo(usuario) {
  const esTecnico =
    usuario?.rol?.nombre === "Técnico";

  const activo =
    usuario?.deleted_at == null &&
    usuario?.activo !== false &&
    usuario?.activo !== 0 &&
    usuario?.activo !== "0";

  return esTecnico && activo;
}

function esReporteEnRevision(reporte) {
  return reporte?.estado?.nombre === "En revisión";
}

// =====================================================
// COMPONENTE: SECCIÓN DEL FORMULARIO
// =====================================================

function SeccionFormulario({
  numero,
  titulo,
  descripcion,
  icono: Icono,
  completado,
  children,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <Icono size={19} strokeWidth={1.8} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-slate-900">
                {numero}. {titulo}
              </h2>

              {completado && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 size={12} />
                  Completado
                </span>
              )}
            </div>

            <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
              {descripcion}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {children}
      </div>
    </section>
  );
}

// =====================================================
// COMPONENTE: ERROR DE CARGA PERSISTENTE
// =====================================================

function MensajeCargaError({
  mensaje,
  onReintentar,
  cargando,
}) {
  if (!mensaje) return null;

  return (
    <div
      role="alert"
      className="flex flex-col items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center"
    >
      <div className="flex items-start gap-2">
        <AlertCircle
          size={18}
          className="mt-0.5 shrink-0 text-red-600"
        />

        <p className="text-sm leading-relaxed text-red-700">
          {mensaje}
        </p>
      </div>

      {onReintentar && (
        <button
          type="button"
          onClick={onReintentar}
          disabled={cargando}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 underline underline-offset-2 transition hover:text-red-900 disabled:opacity-50"
        >
          <RefreshCw size={15} />
          Reintentar
        </button>
      )}
    </div>
  );
}

// =====================================================
// COMPONENTE: ESTADO VACÍO
// =====================================================

function EstadoVacio({
  icono: Icono,
  titulo,
  descripcion,
}) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <Icono size={23} />
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-700">
        {titulo}
      </p>

      {descripcion && (
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
          {descripcion}
        </p>
      )}
    </div>
  );
}

// =====================================================
// COMPONENTE: TARJETA DE RESUMEN
// =====================================================

function ResumenCampo({
  etiqueta,
  valor,
  descripcion,
  icono: Icono,
  seleccionado,
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        seleccionado
          ? "border-blue-100 bg-blue-50/40"
          : "border-slate-200 bg-slate-50/60"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            seleccionado
              ? "bg-blue-100 text-blue-700"
              : "bg-slate-200/60 text-slate-500"
          }`}
        >
          <Icono size={18} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">
            {etiqueta}
          </p>

          <p className="mt-1 break-words text-sm font-bold text-slate-900">
            {valor}
          </p>

          {descripcion && (
            <p className="mt-1 break-words text-xs text-slate-500">
              {descripcion}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// PÁGINA PRINCIPAL
// =====================================================

export default function OrdenCrear() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const reporteInicial = searchParams.get("reporte_id");

  const { toast, confirmar } = useFeedback();

  // =====================================================
  // REFERENCIAS DE CONTROL
  // =====================================================

  const montadoRef = useRef(false);

  const guardandoRef = useRef(false);

  const confirmandoRef = useRef(false);

  const toastRef = useRef(toast);
  toastRef.current = toast;

  const confirmarRef = useRef(confirmar);
  confirmarRef.current = confirmar;

  // =====================================================
  // ESTADOS
  // =====================================================

  const [reportes, setReportes] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);

  const [
    reporteSeleccionado,
    setReporteSeleccionado,
  ] = useState(null);

  const [
    tecnicoSeleccionado,
    setTecnicoSeleccionado,
  ] = useState(null);

  const [busquedaReporte, setBusquedaReporte] =
    useState("");

  const [busquedaTecnico, setBusquedaTecnico] =
    useState("");

  const [paginaReportes, setPaginaReportes] =
    useState(1);

  const [
    ultimaPaginaReportes,
    setUltimaPaginaReportes,
  ] = useState(1);

  const [cargandoReportes, setCargandoReportes] =
    useState(true);

  const [cargandoTecnicos, setCargandoTecnicos] =
    useState(true);

  const [
    cargandoReporteInicial,
    setCargandoReporteInicial,
  ] = useState(Boolean(reporteInicial));

  const [guardando, setGuardando] = useState(false);

  const [confirmando, setConfirmando] = useState(false);

  const [errorReportes, setErrorReportes] =
    useState("");

  const [errorTecnicos, setErrorTecnicos] =
    useState("");

  const [errorReporteInicial, setErrorReporteInicial] =
    useState("");

  const [erroresCampos, setErroresCampos] =
    useState({});

  const [
    recargaReportes,
    setRecargaReportes,
  ] = useState(0);

  const [
    recargaTecnicos,
    setRecargaTecnicos,
  ] = useState(0);

  // =====================================================
  // CONTROL DE MONTAJE
  // =====================================================

  useEffect(() => {
    montadoRef.current = true;

    return () => {
      montadoRef.current = false;
    };
  }, []);

  // =====================================================
  // CARGAR REPORTES EN REVISIÓN
  // =====================================================

  useEffect(() => {
    let vigente = true;

    const cargarReportes = async () => {
      setCargandoReportes(true);
      setErrorReportes("");

      try {
        const respuesta = await obtenerReportes({
          estado_reporte_id: 2,
          page: paginaReportes,
        });

        if (!vigente) return;

        const registros = extraerRegistros(respuesta);

        setReportes(registros);

        setUltimaPaginaReportes(
          Math.max(
            1,
            Number(
              respuesta?.last_page ??
                respuesta?.meta?.last_page ??
                1
            ) || 1
          )
        );
      } catch (error) {
        if (!vigente) return;

        console.error(
          "Error al cargar reportes:",
          error
        );

        setReportes([]);

        setErrorReportes(
          obtenerMensajeError(
            error,
            "No se pudieron cargar los reportes en revisión."
          )
        );
      } finally {
        if (vigente) {
          setCargandoReportes(false);
        }
      }
    };

    cargarReportes();

    return () => {
      vigente = false;
    };
  }, [paginaReportes, recargaReportes]);

  // =====================================================
  // CARGAR REPORTE DESDE LA URL
  // =====================================================

  useEffect(() => {
    let vigente = true;

    if (!reporteInicial) {
      setReporteSeleccionado(null);
      setErrorReporteInicial("");
      setCargandoReporteInicial(false);

      return () => {
        vigente = false;
      };
    }

    const cargarReporteInicial = async () => {
      setCargandoReporteInicial(true);
      setErrorReporteInicial("");
      setReporteSeleccionado(null);

      try {
        const reporte = await obtenerReporte(
          reporteInicial
        );

        if (!vigente) return;

        if (esReporteEnRevision(reporte)) {
          setReporteSeleccionado(reporte);

          setErroresCampos((anterior) => ({
            ...anterior,
            reporte_id: undefined,
          }));
        } else {
          const mensaje =
            "El reporte seleccionado no está En revisión y no puede utilizarse para crear una orden.";

          setErrorReporteInicial(mensaje);
          toastRef.current.warning(mensaje);
        }
      } catch (error) {
        if (!vigente) return;

        console.error(
          "Error al cargar reporte inicial:",
          error
        );

        const mensaje = obtenerMensajeError(
          error,
          "No se pudo cargar el reporte seleccionado desde la URL."
        );

        setErrorReporteInicial(mensaje);
        toastRef.current.error(mensaje);
      } finally {
        if (vigente) {
          setCargandoReporteInicial(false);
        }
      }
    };

    cargarReporteInicial();

    return () => {
      vigente = false;
    };
  }, [reporteInicial]);

  // =====================================================
  // CARGAR TÉCNICOS ACTIVOS
  // =====================================================

  useEffect(() => {
    let vigente = true;

    const cargarTecnicos = async () => {
      setCargandoTecnicos(true);
      setErrorTecnicos("");

      try {
        const respuesta = await obtenerUsuarios();

        if (!vigente) return;

        const usuarios = extraerRegistros(respuesta);

        const disponibles = usuarios.filter(
          esTecnicoActivo
        );

        setTecnicos(disponibles);
      } catch (error) {
        if (!vigente) return;

        console.error(
          "Error al cargar técnicos:",
          error
        );

        setTecnicos([]);

        setErrorTecnicos(
          obtenerMensajeError(
            error,
            "No se pudieron cargar los técnicos disponibles. Verificá el servicio de usuarios."
          )
        );
      } finally {
        if (vigente) {
          setCargandoTecnicos(false);
        }
      }
    };

    cargarTecnicos();

    return () => {
      vigente = false;
    };
  }, [recargaTecnicos]);

  // =====================================================
  // FILTRAR REPORTES DE LA PÁGINA ACTUAL
  // =====================================================

  const terminoReporte = busquedaReporte
    .trim()
    .toLowerCase();

  const reportesFiltrados = reportes.filter(
    (reporte) => {
      if (!terminoReporte) return true;

      return [
        reporte.id,
        reporte.activo?.codigo_inventario,
        reporte.descripcion,
      ].some((valor) =>
        String(valor ?? "")
          .toLowerCase()
          .includes(terminoReporte)
      );
    }
  );

  // =====================================================
  // FILTRAR TÉCNICOS
  // =====================================================

  const terminoTecnico = busquedaTecnico
    .trim()
    .toLowerCase();

  const tecnicosFiltrados = tecnicos.filter(
    (tecnico) => {
      if (!terminoTecnico) return true;

      return [
        tecnico.nombre,
        tecnico.apellido,
        tecnico.email,
      ].some((valor) =>
        String(valor ?? "")
          .toLowerCase()
          .includes(terminoTecnico)
      );
    }
  );

  // =====================================================
  // SELECCIONAR REPORTE
  // =====================================================

  const seleccionarReporte = (reporte) => {
    if (
      guardandoRef.current ||
      confirmandoRef.current
    ) {
      return;
    }

    if (!esReporteEnRevision(reporte)) {
      toast.warning(
        "Solo podés seleccionar reportes en revisión."
      );
      return;
    }

    setReporteSeleccionado(reporte);
    setErrorReporteInicial("");

    setErroresCampos((anterior) => ({
      ...anterior,
      reporte_id: undefined,
    }));
  };

  // =====================================================
  // CAMBIAR REPORTE
  // =====================================================

  const cambiarReporte = () => {
    if (
      guardandoRef.current ||
      confirmandoRef.current
    ) {
      return;
    }

    setReporteSeleccionado(null);
    setErrorReporteInicial("");

    setErroresCampos((anterior) => ({
      ...anterior,
      reporte_id: undefined,
    }));
  };

  // =====================================================
  // SELECCIONAR TÉCNICO
  // =====================================================

  const seleccionarTecnico = (tecnico) => {
    if (
      guardandoRef.current ||
      confirmandoRef.current
    ) {
      return;
    }

    if (!esTecnicoActivo(tecnico)) {
      toast.warning(
        "El técnico seleccionado no está disponible."
      );
      return;
    }

    setTecnicoSeleccionado(tecnico);

    setErroresCampos((anterior) => ({
      ...anterior,
      tecnico_id: undefined,
    }));
  };

  // =====================================================
  // CAMBIAR TÉCNICO
  // =====================================================

  const cambiarTecnico = () => {
    if (
      guardandoRef.current ||
      confirmandoRef.current
    ) {
      return;
    }

    setTecnicoSeleccionado(null);

    setErroresCampos((anterior) => ({
      ...anterior,
      tecnico_id: undefined,
    }));
  };

  // =====================================================
  // REINTENTAR CARGAS
  // =====================================================

  const reintentarReportes = () => {
    if (guardandoRef.current) return;

    setRecargaReportes((actual) => actual + 1);
  };

  const reintentarTecnicos = () => {
    if (guardandoRef.current) return;

    setRecargaTecnicos((actual) => actual + 1);
  };

  // =====================================================
  // CREAR ORDEN
  // =====================================================

  const manejarSubmit = async (event) => {
    event.preventDefault();

    if (
      guardandoRef.current ||
      confirmandoRef.current
    ) {
      return;
    }

    setErroresCampos({});

    if (!reporteSeleccionado) {
      toast.warning(
        "Seleccioná un reporte de anomalía para continuar."
      );
      return;
    }

    if (!esReporteEnRevision(reporteSeleccionado)) {
      toast.warning(
        "El reporte seleccionado debe estar En revisión."
      );
      return;
    }

    if (!tecnicoSeleccionado) {
      toast.warning(
        "Seleccioná el técnico responsable de la reparación."
      );
      return;
    }

    if (!esTecnicoActivo(tecnicoSeleccionado)) {
      toast.warning(
        "El técnico seleccionado no está activo."
      );
      return;
    }

    const reporteId = Number(
      reporteSeleccionado.id
    );

    const tecnicoId = Number(
      tecnicoSeleccionado.id
    );

    if (
      !Number.isInteger(reporteId) ||
      reporteId <= 0 ||
      !Number.isInteger(tecnicoId) ||
      tecnicoId <= 0
    ) {
      toast.error(
        "Los datos seleccionados no son válidos."
      );
      return;
    }

    // ===============================================
    // CONFIRMACIÓN GLOBAL
    // ===============================================

    confirmandoRef.current = true;
    setConfirmando(true);

    let aceptado = false;

    try {
      aceptado = await confirmarRef.current({
        titulo: "Crear orden de reparación",

        mensaje:
          `¿Querés crear una orden para el reporte #${reporteId} ` +
          `y asignarla a ${nombreCompleto(tecnicoSeleccionado)}? ` +
          "El reporte será derivado a reparación y el activo " +
          "pasará al estado correspondiente según las reglas del sistema.",

        textoConfirmar: "Crear orden",

        textoCancelar: "Cancelar",

        variante: "primary",
      });
    } catch (error) {
      console.error(
        "Error al solicitar confirmación:",
        error
      );

      toastRef.current.error(
        "No se pudo mostrar la confirmación."
      );

      return;
    } finally {
      confirmandoRef.current = false;

      if (montadoRef.current) {
        setConfirmando(false);
      }
    }

    if (
      !aceptado ||
      !montadoRef.current ||
      guardandoRef.current
    ) {
      return;
    }

    // ===============================================
    // ENVÍO AL BACKEND
    // ===============================================

    guardandoRef.current = true;
    setGuardando(true);

    try {
      const respuesta = await crearOrden({
        reporte_id: reporteId,
        tecnico_id: tecnicoId,
      });

      const ordenId =
        respuesta?.orden?.id ??
        respuesta?.data?.orden?.id ??
        respuesta?.id;

      toastRef.current.success(
        respuesta?.message ||
          "Orden de reparación creada correctamente."
      );

      if (ordenId) {
        navigate(
          `/ordenes-reparacion/${ordenId}`,
          {
            replace: true,
          }
        );
      } else {
        // La operación fue exitosa, pero el servicio
        // no devolvió el ID esperado.
        navigate("/ordenes-reparacion", {
          replace: true,
        });
      }
    } catch (error) {
      console.error(
        "Error al crear orden:",
        error
      );

      if (!montadoRef.current) return;

      const errores =
        error?.response?.data?.errors ?? {};

      setErroresCampos(errores);

      const mensaje = obtenerMensajeError(
        error,
        "No se pudo crear la orden de reparación. Verificá los datos seleccionados."
      );

      if (error?.response?.status === 422) {
        toastRef.current.warning(mensaje);
      } else if (error?.response?.status === 403) {
        toastRef.current.error(
          "No tenés permisos para crear órdenes de reparación."
        );
      } else if (error?.response?.status === 409) {
        toastRef.current.warning(mensaje);
      } else {
        toastRef.current.error(mensaje);
      }
    } finally {
      guardandoRef.current = false;

      if (montadoRef.current) {
        setGuardando(false);
      }
    }
  };

  // =====================================================
  // VALIDACIÓN VISUAL
  // =====================================================

  const formularioCompleto =
    Boolean(reporteSeleccionado) &&
    Boolean(tecnicoSeleccionado);

  const bloqueado =
    guardando || confirmando;

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

        <div className="flex items-start gap-4 p-5 sm:p-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <Wrench
              size={27}
              strokeWidth={1.7}
            />
          </div>

          <div className="min-w-0">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
              Gestión de reparaciones
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Nueva orden de reparación
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Seleccioná un reporte en revisión y asigná
              el técnico que realizará la reparación del equipo.
            </p>
          </div>
        </div>
      </header>

      {/* =============================================
          INFORMACIÓN DEL PROCESO
      ============================================= */}

      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <Info
          size={20}
          className="mt-0.5 shrink-0 text-blue-700"
        />

        <div>
          <p className="text-sm font-semibold text-blue-900">
            ¿Qué sucede al crear la orden?
          </p>

          <p className="mt-1 text-sm leading-relaxed text-blue-800">
            El reporte pasará a{" "}
            <strong>Derivado a reparación</strong>,
            el activo cambiará a{" "}
            <strong>En reparación</strong> y el técnico
            responsable recibirá una notificación.
          </p>
        </div>
      </div>

      {/* =============================================
          ERROR DEL REPORTE INICIAL
      ============================================= */}

      {errorReporteInicial && !reporteSeleccionado && (
        <MensajeCargaError
          mensaje={errorReporteInicial}
        />
      )}

      {/* =============================================
          FORMULARIO
      ============================================= */}

      <form
        onSubmit={manejarSubmit}
        className="space-y-5"
      >

        {/* =============================================
            SELECCIÓN DE REPORTE
        ============================================= */}

        <SeccionFormulario
          numero="1"
          titulo="Seleccionar reporte"
          descripcion="Elegí el reporte de anomalía que requiere una intervención técnica."
          icono={ClipboardList}
          completado={Boolean(reporteSeleccionado)}
        >

          {cargandoReporteInicial &&
          !reporteSeleccionado ? (
            <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-8">
              <Loader2
                size={20}
                className="animate-spin text-blue-700"
              />

              <p className="text-sm text-slate-500">
                Cargando reporte seleccionado...
              </p>
            </div>
          ) : reporteSeleccionado ? (

            /* REPORTE SELECCIONADO */

            <div className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/50">
              <div className="flex items-start gap-3 p-4 sm:p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                    Reporte seleccionado
                  </p>

                  <p className="mt-1 text-base font-bold text-slate-900">
                    Reporte #{reporteSeleccionado.id}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                      <Monitor size={13} />

                      {reporteSeleccionado.activo
                        ?.codigo_inventario ??
                        "Activo no disponible"}
                    </span>

                    <span className="rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      En revisión
                    </span>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                    {reporteSeleccionado.descripcion ||
                      "Sin descripción registrada."}
                  </p>
                </div>
              </div>

              <div className="flex justify-end border-t border-emerald-100 bg-white/70 px-4 py-3 sm:px-5">
                <button
                  type="button"
                  onClick={cambiarReporte}
                  disabled={bloqueado}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-900 disabled:opacity-50"
                >
                  <RefreshCw size={16} />
                  Cambiar reporte
                </button>
              </div>
            </div>
          ) : (

            /* LISTADO DE REPORTES */

            <div className="space-y-4">

              {/* BÚSQUEDA */}

              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={busquedaReporte}
                  onChange={(event) =>
                    setBusquedaReporte(
                      event.target.value
                    )
                  }
                  disabled={bloqueado}
                  placeholder="Buscar número de reporte, código o descripción..."
                  aria-label="Buscar reportes"
                  className={inputBusqueda}
                />
              </div>

              <p className="text-xs text-slate-500">
                Se muestran únicamente reportes en revisión.
                La búsqueda se aplica a la página actual.
              </p>

              {/* ERROR DE CARGA */}

              <MensajeCargaError
                mensaje={errorReportes}
                onReintentar={reintentarReportes}
                cargando={cargandoReportes}
              />

              {/* LISTADO */}

              <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200">
                {cargandoReportes ? (
                  <div className="flex items-center justify-center gap-3 p-10">
                    <Loader2
                      size={20}
                      className="animate-spin text-blue-700"
                    />

                    <span className="text-sm text-slate-500">
                      Cargando reportes...
                    </span>
                  </div>
                ) : errorReportes ? (
                  <EstadoVacio
                    icono={AlertCircle}
                    titulo="No se pudieron consultar los reportes"
                    descripcion="Utilizá el botón Reintentar para volver a consultar el servidor."
                  />
                ) : reportesFiltrados.length === 0 ? (
                  <EstadoVacio
                    icono={ClipboardList}
                    titulo="No se encontraron reportes"
                    descripcion={
                      busquedaReporte
                        ? "Probá con otro término o revisá las demás páginas."
                        : "No hay reportes en revisión disponibles en esta página."
                    }
                  />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {reportesFiltrados.map((reporte) => (
                      <button
                        key={reporte.id}
                        type="button"
                        onClick={() =>
                          seleccionarReporte(reporte)
                        }
                        disabled={bloqueado}
                        className="group flex w-full items-center justify-between gap-4 p-4 text-left transition hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:outline-none disabled:opacity-50"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition group-hover:bg-blue-100 group-hover:text-blue-700">
                            <FileText size={18} />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900">
                              Reporte #{reporte.id}
                            </p>

                            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                              <Monitor size={13} />

                              {reporte.activo
                                ?.codigo_inventario ??
                                "Sin código de inventario"}
                            </p>

                            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500 sm:text-sm">
                              {reporte.descripcion ||
                                "Sin descripción registrada."}
                            </p>
                          </div>
                        </div>

                        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-700">
                          <span className="hidden sm:inline">
                            Seleccionar
                          </span>

                          <ChevronRight size={17} />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* PAGINACIÓN */}

              {ultimaPaginaReportes > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setPaginaReportes((actual) =>
                        Math.max(1, actual - 1)
                      )
                    }
                    disabled={
                      paginaReportes === 1 ||
                      cargandoReportes ||
                      bloqueado
                    }
                    className={botonSecundario}
                  >
                    <ChevronLeft size={16} />
                    Anterior
                  </button>

                  <span className="text-xs font-medium text-slate-500">
                    Página {paginaReportes} de{" "}
                    {ultimaPaginaReportes}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setPaginaReportes((actual) =>
                        Math.min(
                          ultimaPaginaReportes,
                          actual + 1
                        )
                      )
                    }
                    disabled={
                      paginaReportes >=
                        ultimaPaginaReportes ||
                      cargandoReportes ||
                      bloqueado
                    }
                    className={botonSecundario}
                  >
                    Siguiente
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ERROR DEL CAMPO REPORTE */}

          {primerError(
            erroresCampos,
            "reporte_id"
          ) && (
            <p className="mt-3 flex items-center gap-2 text-xs font-medium text-red-600">
              <AlertCircle size={15} />

              {primerError(
                erroresCampos,
                "reporte_id"
              )}
            </p>
          )}
        </SeccionFormulario>

        {/* =============================================
            SELECCIÓN DE TÉCNICO
        ============================================= */}

        <SeccionFormulario
          numero="2"
          titulo="Asignar técnico"
          descripcion="Seleccioná el usuario que será responsable de realizar la reparación."
          icono={UserRound}
          completado={Boolean(tecnicoSeleccionado)}
        >

          {tecnicoSeleccionado ? (

            /* TÉCNICO SELECCIONADO */

            <div className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/50">
              <div className="flex items-center gap-3 p-4 sm:p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <UserRound size={22} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                    Técnico seleccionado
                  </p>

                  <p className="mt-1 text-base font-bold text-slate-900">
                    {nombreCompleto(
                      tecnicoSeleccionado
                    )}
                  </p>

                  <p className="mt-1 break-all text-xs text-slate-500">
                    {tecnicoSeleccionado.email ??
                      "Sin correo registrado"}
                  </p>
                </div>

                <CheckCircle2
                  size={20}
                  className="shrink-0 text-emerald-600"
                />
              </div>

              <div className="flex justify-end border-t border-emerald-100 bg-white/70 px-4 py-3 sm:px-5">
                <button
                  type="button"
                  onClick={cambiarTecnico}
                  disabled={bloqueado}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-900 disabled:opacity-50"
                >
                  <RefreshCw size={16} />
                  Cambiar técnico
                </button>
              </div>
            </div>
          ) : (

            /* LISTADO DE TÉCNICOS */

            <div className="space-y-4">

              {/* BÚSQUEDA */}

              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={busquedaTecnico}
                  onChange={(event) =>
                    setBusquedaTecnico(
                      event.target.value
                    )
                  }
                  disabled={bloqueado}
                  placeholder="Buscar técnico por nombre, apellido o correo..."
                  aria-label="Buscar técnicos"
                  className={inputBusqueda}
                />
              </div>

              <p className="text-xs text-slate-500">
                Solo se muestran usuarios activos con el rol Técnico.
              </p>

              {/* ERROR DE CARGA */}

              <MensajeCargaError
                mensaje={errorTecnicos}
                onReintentar={reintentarTecnicos}
                cargando={cargandoTecnicos}
              />

              {/* LISTADO */}

              <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200">
                {cargandoTecnicos ? (
                  <div className="flex items-center justify-center gap-3 p-10">
                    <Loader2
                      size={20}
                      className="animate-spin text-blue-700"
                    />

                    <span className="text-sm text-slate-500">
                      Cargando técnicos...
                    </span>
                  </div>
                ) : errorTecnicos ? (
                  <EstadoVacio
                    icono={AlertCircle}
                    titulo="No se pudieron consultar los técnicos"
                    descripcion="Utilizá el botón Reintentar para volver a consultar el servidor."
                  />
                ) : tecnicosFiltrados.length === 0 ? (
                  <EstadoVacio
                    icono={UserRound}
                    titulo="No se encontraron técnicos"
                    descripcion={
                      busquedaTecnico
                        ? "Probá con otro nombre o correo electrónico."
                        : "No hay técnicos activos disponibles para asignar."
                    }
                  />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {tecnicosFiltrados.map((tecnico) => (
                      <button
                        key={tecnico.id}
                        type="button"
                        onClick={() =>
                          seleccionarTecnico(tecnico)
                        }
                        disabled={bloqueado}
                        className="group flex w-full items-center justify-between gap-4 p-4 text-left transition hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:outline-none disabled:opacity-50"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition group-hover:bg-blue-100 group-hover:text-blue-700">
                            <UserRound size={19} />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900">
                              {nombreCompleto(tecnico)}
                            </p>

                            <p className="mt-1 break-all text-xs text-slate-500">
                              {tecnico.email ??
                                "Sin correo registrado"}
                            </p>
                          </div>
                        </div>

                        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-700">
                          <span className="hidden sm:inline">
                            Seleccionar
                          </span>

                          <ChevronRight size={17} />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ERROR DEL CAMPO TÉCNICO */}

          {primerError(
            erroresCampos,
            "tecnico_id"
          ) && (
            <p className="mt-3 flex items-center gap-2 text-xs font-medium text-red-600">
              <AlertCircle size={15} />

              {primerError(
                erroresCampos,
                "tecnico_id"
              )}
            </p>
          )}
        </SeccionFormulario>

        {/* =============================================
            RESUMEN DE LA ORDEN
        ============================================= */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <ClipboardList size={19} />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">
                Resumen de la orden
              </h2>

              <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
                Revisá los datos antes de confirmar la creación.
              </p>
            </div>
          </div>

          <div className="space-y-4 p-5 sm:p-6">

            {/* DATOS SELECCIONADOS */}

            <div className="grid gap-3 sm:grid-cols-2">
              <ResumenCampo
                etiqueta="Reporte de anomalía"
                valor={
                  reporteSeleccionado
                    ? `Reporte #${reporteSeleccionado.id}`
                    : "Sin seleccionar"
                }
                descripcion={
                  reporteSeleccionado?.activo
                    ?.codigo_inventario ??
                  "Seleccioná un reporte"
                }
                icono={FileText}
                seleccionado={Boolean(
                  reporteSeleccionado
                )}
              />

              <ResumenCampo
                etiqueta="Técnico responsable"
                valor={
                  tecnicoSeleccionado
                    ? nombreCompleto(
                        tecnicoSeleccionado
                      )
                    : "Sin seleccionar"
                }
                descripcion={
                  tecnicoSeleccionado?.email ??
                  "Seleccioná un técnico"
                }
                icono={UserRound}
                seleccionado={Boolean(
                  tecnicoSeleccionado
                )}
              />
            </div>

            {/* ESTADO INICIAL */}

            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  size={17}
                  className="text-slate-500"
                />

                <span className="text-xs font-medium text-slate-600">
                  Estado inicial de la orden:
                </span>
              </div>

              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                Pendiente
              </span>
            </div>

            {/* FORMULARIO COMPLETO */}

            {formularioCompleto && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <CheckCircle2
                  size={19}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />

                <div>
                  <p className="text-sm font-semibold text-emerald-900">
                    Datos completos
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                    El reporte y el técnico están seleccionados.
                    Ya podés confirmar la creación de la orden
                    de reparación.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* =============================================
            ACCIONES
        ============================================= */}

        <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 pt-5 sm:flex-row">
          <Link
            to="/ordenes-reparacion"
            className={botonSecundario}
          >
            <X size={17} />
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={
              bloqueado ||
              !formularioCompleto ||
              cargandoReporteInicial
            }
            className={botonPrincipal}
          >
            {guardando ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Creando orden...
              </>
            ) : confirmando ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Esperando confirmación...
              </>
            ) : (
              <>
                <Wrench size={18} />
                Crear orden de reparación
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
