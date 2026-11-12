
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ClipboardPlus,
  Info,
  Loader2,
  Monitor,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { useFeedback } from "../context/FeedbackContext";

import { obtenerActivosReportables } from "../services/activoService";
import { crearReporte } from "../services/reporteService";

// =====================================================
// ESTILOS GENERALES
// =====================================================

const botonSecundario =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const botonPrincipal =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60";

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function obtenerMensajeError(error, mensajeAlternativo) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    mensajeAlternativo
  );
}

function normalizarErrores(errores = {}) {
  return Object.fromEntries(
    Object.entries(errores).map(([campo, mensajes]) => [
      campo,
      Array.isArray(mensajes)
        ? mensajes
        : [String(mensajes)],
    ])
  );
}

// =====================================================
// ENCABEZADO DE SECCIÓN
// =====================================================

function EncabezadoSeccion({
  numero,
  icono: Icono,
  titulo,
  descripcion,
  color = "blue",
}) {
  const colores = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
  };

  return (
    <div className="mb-5 flex items-start gap-3 border-b border-slate-100 pb-5">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
          colores[color] ?? colores.blue
        }`}
      >
        <Icono size={19} strokeWidth={1.8} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
            {titulo}
          </h2>

          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Paso {numero}
          </span>
        </div>

        <p className="mt-1 text-sm leading-relaxed text-slate-500">
          {descripcion}
        </p>
      </div>
    </div>
  );
}

// =====================================================
// PÁGINA: CREAR REPORTE
// =====================================================

export default function ReporteCrear() {
  const navigate = useNavigate();
  const { toast } = useFeedback();

  // =====================================================
  // REFERENCIAS DE CONTROL
  // =====================================================

  const guardandoRef = useRef(false);
  const montadoRef = useRef(false);

  const toastRef = useRef(toast);
  toastRef.current = toast;

  // =====================================================
  // ESTADOS
  // =====================================================

  const [activos, setActivos] = useState([]);

  const [activoSeleccionado, setActivoSeleccionado] =
    useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);

  const [paginacion, setPaginacion] = useState({
    current_page: 1,
    last_page: 1,
  });

  const [descripcion, setDescripcion] = useState("");

  const [cargandoActivos, setCargandoActivos] =
    useState(true);

  const [guardando, setGuardando] = useState(false);

  const [errorActivos, setErrorActivos] = useState("");

  const [erroresCampos, setErroresCampos] = useState({});

  const [recargaActivos, setRecargaActivos] = useState(0);

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
  // CARGAR ACTIVOS
  // =====================================================

  
  useEffect(() => {
    let vigente = true;

    const cargarActivos = async () => {
      setCargandoActivos(true);
      setErrorActivos("");

      try {
        const respuesta = await obtenerActivosReportables({
          page: pagina,
          buscar: busqueda.trim() || undefined,
        });

        if (!vigente || !montadoRef.current) {
          return;
        }

        if (!Array.isArray(respuesta?.data)) {
          throw new Error(
            "El servidor devolvió un formato de activos incorrecto."
          );
        }

        setActivos(respuesta.data);

        setPaginacion({
          current_page: respuesta.current_page ?? pagina,
          last_page: respuesta.last_page ?? 1,
        });
      } catch (error) {
        if (!vigente || !montadoRef.current) {
          return;
        }

        console.error("Error al cargar equipos:", error);

        setErrorActivos(
          obtenerMensajeError(
            error,
            "No se pudieron cargar los equipos disponibles."
          )
        );

        setActivos([]);

        setPaginacion({
          current_page: pagina,
          last_page: 1,
        });
      } finally {
        if (vigente && montadoRef.current) {
          setCargandoActivos(false);
        }
      }
    };

    const temporizador = setTimeout(cargarActivos, 300);

    return () => {
      vigente = false;
      clearTimeout(temporizador);
    };
  }, [pagina, busqueda, recargaActivos]);


  // =====================================================
  // FILTRAR ACTIVOS DE LA PÁGINA
  // =====================================================

  const activosFiltrados = activos;

  // =====================================================
  // SELECCIONAR ACTIVO
  // =====================================================

  const seleccionarActivo = (activo) => {
    if (guardandoRef.current) return;

    const estado = activo.estado?.nombre;

    if (
      estado === "En reparación" ||
      estado === "Dado de baja"
    ) {
      toast.warning(
        "Este activo no está disponible para registrar un reporte."
      );
      return;
    }

    setActivoSeleccionado(activo);

    setErroresCampos((actual) => ({
      ...actual,
      activo_id: [],
    }));
  };

  // =====================================================
  // CAMBIAR ACTIVO
  // =====================================================

  const cambiarActivo = () => {
    if (guardandoRef.current) return;

    setActivoSeleccionado(null);

    setErroresCampos((actual) => ({
      ...actual,
      activo_id: [],
    }));
  };

  // =====================================================
  // ACTUALIZAR ACTIVOS
  // =====================================================

  const actualizarActivos = () => {
    if (cargandoActivos || guardandoRef.current) {
      return;
    }

    setRecargaActivos((valor) => valor + 1);

    // No se muestra Toast de éxito al actualizar.
  };

  // =====================================================
  // VALIDAR FORMULARIO
  // =====================================================

  const validarFormulario = () => {
    const errores = {};

    if (!activoSeleccionado) {
      errores.activo_id = [
        "Tenés que seleccionar un activo para registrar el reporte.",
      ];
    }

    if (!descripcion.trim()) {
      errores.descripcion = [
        "La descripción de la anomalía es obligatoria.",
      ];
    }

    setErroresCampos(errores);

    if (Object.keys(errores).length > 0) {
      toast.warning(
        "Revisá los campos señalados antes de registrar el reporte."
      );

      return false;
    }

    return true;
  };

  // =====================================================
  // ENVIAR REPORTE
  // =====================================================

  const manejarSubmit = async (event) => {
    event.preventDefault();

    if (guardandoRef.current) return;

    if (!validarFormulario()) {
      return;
    }

    guardandoRef.current = true;
    setGuardando(true);

    try {
      const respuesta = await crearReporte({
        activo_id: activoSeleccionado.id,
        descripcion: descripcion.trim(),
      });

      toastRef.current.success(
        respuesta?.message ||
          "Reporte de anomalía registrado correctamente."
      );

      const reporteId = respuesta?.reporte?.id;

      if (reporteId) {
        navigate(`/reportes/${reporteId}`, {
          replace: true,
        });
      } else {
        // El reporte fue creado, pero la respuesta
        // no incluyó su identificador.
        navigate("/reportes", {
          replace: true,
        });
      }
    } catch (error) {
      console.error(
        "Error al crear reporte:",
        error
      );

      if (!montadoRef.current) {
        return;
      }

      if (error?.response?.status === 422) {
        setErroresCampos(
          normalizarErrores(
            error.response?.data?.errors ?? {}
          )
        );

        toastRef.current.warning(
          obtenerMensajeError(
            error,
            "Revisá los datos ingresados antes de continuar."
          )
        );
      } else if (error?.response?.status === 403) {
        toastRef.current.error(
          "No tenés permisos para crear reportes."
        );
      } else {
        toastRef.current.error(
          obtenerMensajeError(
            error,
            "Ocurrió un error al registrar el reporte. Intentá nuevamente."
          )
        );
      }
    } finally {
      guardandoRef.current = false;

      if (montadoRef.current) {
        setGuardando(false);
      }
    }
  };

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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <ClipboardPlus
                size={27}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                Gestión de incidencias
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Nuevo reporte de anomalía
              </h1>

              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Seleccioná un equipo del inventario y
                describí el problema detectado.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* =============================================
          MENSAJE INFORMATIVO
      ============================================= */}

      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <Info
          size={19}
          className="mt-0.5 shrink-0 text-blue-700"
        />

        <div>
          <p className="text-sm font-semibold text-blue-900">
            Información importante
          </p>

          <p className="mt-1 text-sm leading-relaxed text-blue-800">
            Al registrar un reporte, el equipo pasará
            automáticamente al estado{" "}
            <strong>Con anomalía</strong> y el reporte
            quedará en estado{" "}
            <strong>Pendiente</strong>.
          </p>
        </div>
      </div>

      {/* =============================================
          FORMULARIO
      ============================================= */}

      <form
        onSubmit={manejarSubmit}
        className="space-y-5"
        noValidate
      >

        {/* =============================================
            PASO 1: SELECCIONAR ACTIVO
        ============================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <EncabezadoSeccion
            numero="01"
            icono={Monitor}
            titulo="Seleccionar activo"
            descripcion="Elegí el equipo que presenta la anomalía."
          />

          {/* ACTIVO SELECCIONADO */}

          {activoSeleccionado ? (
            <div className="flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                  <CheckCircle2 size={21} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                    Activo seleccionado
                  </p>

                  <p className="mt-1 break-all text-base font-bold text-slate-900">
                    {activoSeleccionado.codigo_inventario}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {[
                      activoSeleccionado.marca,
                      activoSeleccionado.modelo,
                    ]
                      .filter(Boolean)
                      .join(" ") || "Sin marca o modelo"}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Estado actual:{" "}
                    <span className="font-semibold text-slate-700">
                      {activoSeleccionado.estado?.nombre ??
                        "No disponible"}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={cambiarActivo}
                disabled={guardando}
                className={botonSecundario}
              >
                <X size={16} />
                Cambiar activo
              </button>
            </div>
          ) : (
            <div className="space-y-4">

              {/* BUSCADOR Y ACTUALIZAR */}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={busqueda}
                    onChange={(event) => {
                      setBusqueda(event.target.value);
                      setPagina(1);
                    }}
                    placeholder="Buscar por código, marca o modelo en esta página..."
                    aria-label="Buscar activos"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />

                  {busqueda && (
                    <button
                      type="button"
                      onClick={() => {
                        setBusqueda("");
                        setPagina(1);
                      }}
                      aria-label="Limpiar búsqueda"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={actualizarActivos}
                  disabled={cargandoActivos}
                  className={botonSecundario}
                >
                  <RefreshCw
                    size={17}
                    className={
                      cargandoActivos
                        ? "animate-spin"
                        : ""
                    }
                  />
                  Actualizar
                </button>
              </div>

              {/* ACLARACIÓN DE BÚSQUEDA */}

              <p className="text-xs text-slate-400">
                Buscá equipos por código de inventario, marca o modelo.
                Los resultados se consultan en todo el registro de equipos disponibles.
              </p>

              {/* ERROR AL CARGAR ACTIVOS */}

              {errorActivos && (
                <div
                  role="alert"
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle
                      size={17}
                      className="shrink-0 text-red-600"
                    />

                    <p className="text-sm text-red-700">
                      {errorActivos}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={actualizarActivos}
                    disabled={cargandoActivos}
                    className="text-sm font-semibold text-red-700 underline underline-offset-2 hover:text-red-900 disabled:opacity-50"
                  >
                    Reintentar
                  </button>
                </div>
              )}

              {/* LISTADO DE ACTIVOS */}

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Monitor
                      size={16}
                      className="text-slate-500"
                    />

                    <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
                      Equipos disponibles
                    </span>
                  </div>

                  <span className="text-xs font-medium text-slate-400">
                    {activosFiltrados.length} en esta página
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {cargandoActivos ? (
                    <div className="flex min-h-36 flex-col items-center justify-center gap-3 p-8">
                      <Loader2
                        size={22}
                        className="animate-spin text-blue-700"
                      />

                      <p className="text-sm text-slate-500">
                        Cargando activos...
                      </p>
                    </div>
                  ) : errorActivos ? (
                    <div className="flex min-h-36 flex-col items-center justify-center gap-3 p-8 text-center">
                      <AlertCircle
                        size={25}
                        className="text-red-400"
                      />

                      <p className="text-sm font-medium text-slate-600">
                        No se pudo consultar el inventario.
                      </p>
                    </div>
                  ) : activosFiltrados.length === 0 ? (
                    <div className="flex min-h-36 flex-col items-center justify-center gap-3 p-8 text-center">
                      <Search
                        size={25}
                        className="text-slate-300"
                      />

                      <p className="text-sm font-medium text-slate-600">
                        No se encontraron activos en esta página.
                      </p>

                      {busqueda && (
                        <p className="text-xs text-slate-400">
                          Probá con otro código, marca o modelo.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {activosFiltrados.map((activo) => {
                        const enReparacion =
                          activo.estado?.nombre ===
                          "En reparación";

                        const dadoDeBaja =
                          activo.estado?.nombre ===
                          "Dado de baja";

                        const noDisponible =
                          enReparacion || dadoDeBaja;

                        const nombreEquipo = [
                          activo.marca,
                          activo.modelo,
                        ]
                          .filter(Boolean)
                          .join(" ") ||
                          "Sin marca o modelo";

                        return (
                          <button
                            key={activo.id}
                            type="button"
                            onClick={() =>
                              seleccionarActivo(activo)
                            }
                            disabled={
                              noDisponible || guardando
                            }
                            className="group flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition hover:bg-blue-50/70 focus:outline-none focus-visible:bg-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50/50 disabled:opacity-60"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition group-hover:border-blue-200 group-hover:text-blue-700">
                                <Monitor size={19} />
                              </div>

                              <div className="min-w-0">
                                <p className="break-all text-sm font-bold text-slate-800">
                                  {activo.codigo_inventario}
                                </p>

                                <p className="mt-0.5 truncate text-xs text-slate-500">
                                  {nombreEquipo}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  {activo.estado?.nombre ??
                                    "Sin estado"}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                noDisponible
                                  ? "bg-slate-100 text-slate-500"
                                  : "bg-blue-50 text-blue-700 group-hover:bg-blue-100"
                              }`}
                            >
                              {noDisponible
                                ? "No disponible"
                                : "Seleccionar"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* PAGINACIÓN */}

              {!cargandoActivos &&
                !errorActivos &&
                paginacion.last_page > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setPagina((actual) =>
                          Math.max(1, actual - 1)
                        )
                      }
                      disabled={pagina <= 1}
                      className={botonSecundario}
                    >
                      <ChevronLeft size={16} />
                      Anterior
                    </button>

                    <span className="text-xs font-semibold text-slate-500">
                      Página {paginacion.current_page} de{" "}
                      {paginacion.last_page}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setPagina((actual) =>
                          Math.min(
                            paginacion.last_page,
                            actual + 1
                          )
                        )
                      }
                      disabled={
                        pagina >= paginacion.last_page
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

          {/* ERROR DE SELECCIÓN */}

          {erroresCampos.activo_id?.length > 0 && (
            <p className="mt-3 flex items-center gap-2 text-sm text-red-600">
              <AlertCircle size={16} />
              {erroresCampos.activo_id[0]}
            </p>
          )}
        </section>

        {/* =============================================
            PASO 2: DESCRIPCIÓN DE LA ANOMALÍA
        ============================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <EncabezadoSeccion
            numero="02"
            icono={AlertTriangle}
            titulo="Describir la anomalía"
            descripcion="Explicá qué problema presenta el equipo."
            color="amber"
          />

          <div>
            <label
              htmlFor="descripcion"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Descripción del problema
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <textarea
              id="descripcion"
              value={descripcion}
              onChange={(event) => {
                setDescripcion(event.target.value);

                setErroresCampos((actual) => ({
                  ...actual,
                  descripcion: [],
                }));
              }}
              rows={6}
              placeholder="Ejemplo: La computadora no enciende al presionar el botón de encendido. Se verificó que está conectada a la corriente, pero no responde."
              disabled={guardando}
              aria-invalid={Boolean(
                erroresCampos.descripcion?.length
              )}
              className={`w-full resize-y rounded-xl border bg-white p-4 text-sm leading-relaxed text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                erroresCampos.descripcion?.length
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"
              }`}
            />

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs leading-relaxed text-slate-500">
                Describí los síntomas observados y
                cualquier información que ayude a
                identificar el problema.
              </p>

              <span className="text-xs font-medium text-slate-400">
                {descripcion.length} caracteres
              </span>
            </div>

            {erroresCampos.descripcion?.length > 0 && (
              <p className="mt-3 flex items-center gap-2 text-sm text-red-600">
                <AlertCircle size={16} />
                {erroresCampos.descripcion[0]}
              </p>
            )}
          </div>
        </section>

        {/* =============================================
            ACCIONES DEL FORMULARIO
        ============================================= */}

        <div className="flex flex-col-reverse items-stretch justify-end gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
          <Link
            to="/reportes"
            className={botonSecundario}
          >
            <X size={17} />
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={guardando}
            className={botonPrincipal}
          >
            {guardando ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Registrando reporte...
              </>
            ) : (
              <>
                <ClipboardPlus size={18} />
                Registrar reporte
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
