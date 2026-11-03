
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Layers,
  ListChecks,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../context/FeedbackContext";

import {
  obtenerCaracteristicas,
} from "../services/caracteristicaService";

import {
  obtenerOpcionesCaracteristica,
  crearOpcionCaracteristica,
  actualizarOpcionCaracteristica,
  eliminarOpcionCaracteristica,
} from "../services/opcionCaracteristicaService";

// =====================================================
// ESTILOS REUTILIZABLES
// =====================================================

const botonPrincipal =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50";

const botonSecundario =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const campoBase =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500";

const selectBase =
  "w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition hover:border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60";

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

function obtenerErroresValidacion(error) {
  const errores = error?.response?.data?.errors ?? {};

  return Object.fromEntries(
    Object.entries(errores).map(([campo, mensajes]) => [
      campo,
      Array.isArray(mensajes)
        ? mensajes[0]
        : String(mensajes),
    ])
  );
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function OpcionesCaracteristicas() {
  const { user } = useAuth();
  const { toast, confirmar } = useFeedback();

  // =====================================================
  // REFERENCIAS
  // =====================================================

  const guardandoRef = useRef(false);
  const eliminandoRef = useRef(false);

  const solicitudCaracteristicasRef = useRef(0);
  const solicitudOpcionesRef = useRef(0);

  const montadoRef = useRef(false);

  const toastRef = useRef(toast);
  toastRef.current = toast;

  // =====================================================
  // PERMISOS
  // =====================================================

  const permisos =
    user?.rol?.permisos ??
    user?.permisos ??
    [];

  const puedeGestionar = permisos.some((permiso) =>
    typeof permiso === "string"
      ? permiso === "catalogos.gestionar"
      : permiso?.nombre === "catalogos.gestionar"
  );

  // =====================================================
  // ESTADOS GENERALES
  // =====================================================

  const [caracteristicas, setCaracteristicas] =
    useState([]);

  const [caracteristicaId, setCaracteristicaId] =
    useState("");

  const [opciones, setOpciones] = useState([]);

  const [
    cargandoCaracteristicas,
    setCargandoCaracteristicas,
  ] = useState(true);

  const [cargandoOpciones, setCargandoOpciones] =
    useState(false);

  const [busqueda, setBusqueda] = useState("");

  const [errorCarga, setErrorCarga] = useState("");
  const [errorOpciones, setErrorOpciones] = useState("");

  // =====================================================
  // ESTADOS DEL FORMULARIO
  // =====================================================

  const [modalAbierto, setModalAbierto] =
    useState(false);

  const [opcionEditando, setOpcionEditando] =
    useState(null);

  const [valor, setValor] = useState("");

  const [erroresCampos, setErroresCampos] =
    useState({});

  const [guardando, setGuardando] =
    useState(false);

  // =====================================================
  // ESTADOS DE ELIMINACIÓN
  // =====================================================

  const [eliminandoId, setEliminandoId] =
    useState(null);

  const operacionEnCurso =
    guardando || eliminandoId !== null;

  // =====================================================
  // CARGAR CARACTERÍSTICAS TIPO SELECT
  // =====================================================

  const cargarCaracteristicas = useCallback(
    async ({ mostrarError = false } = {}) => {
      const solicitud =
        ++solicitudCaracteristicasRef.current;

      setCargandoCaracteristicas(true);
      setErrorCarga("");

      try {
        const respuesta =
          await obtenerCaracteristicas();

        if (!Array.isArray(respuesta)) {
          throw new Error(
            "El servidor devolvió un formato de datos incorrecto."
          );
        }

        if (
          !montadoRef.current ||
          solicitud !== solicitudCaracteristicasRef.current
        ) {
          return false;
        }

        const caracteristicasSelect = respuesta.filter(
          (caracteristica) =>
            caracteristica.tipo_dato === "select"
        );

        setCaracteristicas(caracteristicasSelect);

        setCaracteristicaId((actual) => {
          const existe = caracteristicasSelect.some(
            (item) =>
              String(item.id) === String(actual)
          );

          return existe ? actual : "";
        });

        return true;
      } catch (err) {
        if (
          !montadoRef.current ||
          solicitud !== solicitudCaracteristicasRef.current
        ) {
          return false;
        }

        console.error(
          "Error al cargar características:",
          err
        );

        const texto = obtenerMensajeError(
          err,
          "No se pudieron cargar las características técnicas."
        );

        setErrorCarga(texto);

        if (mostrarError) {
          toastRef.current.error(texto);
        }

        return false;
      } finally {
        if (
          montadoRef.current &&
          solicitud === solicitudCaracteristicasRef.current
        ) {
          setCargandoCaracteristicas(false);
        }
      }
    },
    []
  );

  // =====================================================
  // CARGAR OPCIONES
  // =====================================================

  const cargarOpciones = useCallback(
    async (id, { mostrarError = false } = {}) => {
      const solicitud = ++solicitudOpcionesRef.current;

      setErrorOpciones("");

      if (!id) {
        setOpciones([]);
        setCargandoOpciones(false);
        return true;
      }

      setCargandoOpciones(true);

      try {
        const respuesta =
          await obtenerOpcionesCaracteristica(id);

        if (!Array.isArray(respuesta?.opciones)) {
          throw new Error(
            "El servidor devolvió un formato de opciones incorrecto."
          );
        }

        if (
          !montadoRef.current ||
          solicitud !== solicitudOpcionesRef.current
        ) {
          return false;
        }

        setOpciones(respuesta.opciones);

        return true;
      } catch (err) {
        if (
          !montadoRef.current ||
          solicitud !== solicitudOpcionesRef.current
        ) {
          return false;
        }

        console.error(
          "Error al cargar opciones:",
          err
        );

        const texto = obtenerMensajeError(
          err,
          "No se pudieron cargar las opciones."
        );

        setOpciones([]);
        setErrorOpciones(texto);

        if (mostrarError) {
          toastRef.current.error(texto);
        }

        return false;
      } finally {
        if (
          montadoRef.current &&
          solicitud === solicitudOpcionesRef.current
        ) {
          setCargandoOpciones(false);
        }
      }
    },
    []
  );

  // =====================================================
  // EFECTOS
  // =====================================================

  useEffect(() => {
    montadoRef.current = true;

    cargarCaracteristicas();

    return () => {
      montadoRef.current = false;
      solicitudCaracteristicasRef.current += 1;
    };
  }, [cargarCaracteristicas]);

  useEffect(() => {
    cargarOpciones(caracteristicaId);

    return () => {
      solicitudOpcionesRef.current += 1;
    };
  }, [caracteristicaId, cargarOpciones]);

  // =====================================================
  // DATOS DERIVADOS
  // =====================================================

  const caracteristicaSeleccionada =
    caracteristicas.find(
      (item) =>
        String(item.id) === String(caracteristicaId)
    );

  const opcionesFiltradas = useMemo(() => {
    const termino = busqueda
      .trim()
      .toLocaleLowerCase("es-AR");

    if (!termino) return opciones;

    return opciones.filter((opcion) =>
      String(opcion.valor ?? "")
        .toLocaleLowerCase("es-AR")
        .includes(termino)
    );
  }, [opciones, busqueda]);

  const hayBusqueda = busqueda.trim() !== "";

  // =====================================================
  // ACTUALIZAR DATOS
  // =====================================================

  const refrescar = async () => {
    if (
      cargandoCaracteristicas ||
      cargandoOpciones ||
      operacionEnCurso ||
      guardandoRef.current ||
      eliminandoRef.current
    ) {
      return;
    }

    await cargarCaracteristicas({
      mostrarError: true,
    });

    if (caracteristicaId) {
      await cargarOpciones(caracteristicaId, {
        mostrarError: true,
      });
    }

    // No mostrar Toast de éxito al actualizar.
  };

  // =====================================================
  // ABRIR MODAL PARA CREAR
  // =====================================================

  const abrirCrear = () => {
    if (
      !puedeGestionar ||
      !caracteristicaId ||
      operacionEnCurso ||
      cargandoOpciones ||
      errorOpciones
    ) {
      return;
    }

    setOpcionEditando(null);
    setValor("");
    setErroresCampos({});
    setModalAbierto(true);
  };

  // =====================================================
  // ABRIR MODAL PARA EDITAR
  // =====================================================

  const abrirEditar = (opcion) => {
    if (
      !puedeGestionar ||
      !caracteristicaId ||
      operacionEnCurso ||
      cargandoOpciones ||
      errorOpciones
    ) {
      return;
    }

    setOpcionEditando(opcion);
    setValor(opcion.valor ?? "");
    setErroresCampos({});
    setModalAbierto(true);
  };

  // =====================================================
  // CERRAR MODAL
  // =====================================================

  const cerrarModal = () => {
    if (guardando || guardandoRef.current) {
      return;
    }

    setModalAbierto(false);
    setOpcionEditando(null);
    setValor("");
    setErroresCampos({});
  };

  // =====================================================
  // CREAR / EDITAR OPCIÓN
  // =====================================================

  const guardarOpcion = async (event) => {
    event.preventDefault();

    if (
      !puedeGestionar ||
      !caracteristicaId ||
      operacionEnCurso ||
      guardandoRef.current ||
      eliminandoRef.current
    ) {
      return;
    }

    const valorNormalizado = valor.trim();
    const errores = {};

    if (!valorNormalizado) {
      errores.valor =
        "Ingresá un valor para la opción.";
    } else if (valorNormalizado.length > 100) {
      errores.valor =
        "El valor no puede superar los 100 caracteres.";
    }

    setErroresCampos(errores);

    if (Object.keys(errores).length > 0) {
      toast.warning(
        "Revisá los campos señalados antes de continuar."
      );
      return;
    }

    const esEdicion = Boolean(opcionEditando);
    const idActual = caracteristicaId;

    guardandoRef.current = true;
    setGuardando(true);

    try {
      const respuesta = esEdicion
        ? await actualizarOpcionCaracteristica(
            idActual,
            opcionEditando.id,
            { valor: valorNormalizado }
          )
        : await crearOpcionCaracteristica(
            idActual,
            { valor: valorNormalizado }
          );

      setModalAbierto(false);
      setOpcionEditando(null);
      setValor("");
      setErroresCampos({});

      toast.success(
        respuesta?.message ||
          (esEdicion
            ? "Opción actualizada correctamente."
            : "Opción creada correctamente.")
      );

      // El guardado ya fue exitoso.
      // Si falla la recarga, se informa por separado.
      await cargarOpciones(idActual, {
        mostrarError: true,
      });
    } catch (err) {
      console.error(
        "Error al guardar opción:",
        err
      );

      if (err?.response?.status === 422) {
        setErroresCampos(
          obtenerErroresValidacion(err)
        );

        toast.warning(
          obtenerMensajeError(
            err,
            "Revisá los datos ingresados."
          )
        );
      } else {
        toast.error(
          obtenerMensajeError(
            err,
            esEdicion
              ? "No se pudo actualizar la opción."
              : "No se pudo crear la opción."
          )
        );
      }
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  };

  // =====================================================
  // SOLICITAR ELIMINACIÓN
  // =====================================================

  const solicitarEliminacion = async (opcion) => {
    if (
      !puedeGestionar ||
      !caracteristicaId ||
      operacionEnCurso ||
      cargandoOpciones ||
      guardandoRef.current ||
      eliminandoRef.current
    ) {
      return;
    }

    const idActual = caracteristicaId;
    const nombreCaracteristica =
      caracteristicaSeleccionada?.nombre ||
      "seleccionada";

    const aceptado = await confirmar({
      titulo: "Eliminar opción",

      mensaje:
        `¿Querés eliminar la opción "${opcion.valor}" ` +
        `de la característica "${nombreCaracteristica}"? ` +
        "Si esta opción está siendo utilizada por algún activo, " +
        "el sistema rechazará la eliminación para proteger " +
        "los datos registrados.",

      textoConfirmar: "Confirmar eliminación",
      textoCancelar: "Cancelar",
      variante: "danger",
    });

    if (
      !aceptado ||
      guardandoRef.current ||
      eliminandoRef.current
    ) {
      return;
    }

    eliminandoRef.current = true;
    setEliminandoId(opcion.id);

    try {
      const respuesta =
        await eliminarOpcionCaracteristica(
          idActual,
          opcion.id
        );

      toast.success(
        respuesta?.message ||
          "Opción eliminada correctamente."
      );

      await cargarOpciones(idActual, {
        mostrarError: true,
      });
    } catch (err) {
      console.error(
        "Error al eliminar opción:",
        err
      );

      toast.error(
        obtenerMensajeError(
          err,
          "No se pudo eliminar la opción."
        )
      );
    } finally {
      eliminandoRef.current = false;
      setEliminandoId(null);
    }
  };

  // =====================================================
  // RENDERIZADO
  // =====================================================

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-10">

      {/* VOLVER A CATÁLOGOS */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/catalogos"
          className={botonSecundario}
        >
          <ArrowLeft size={17} />
          Volver a catálogos
        </Link>

        <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-400">
          <Layers size={15} />
          Gestión de catálogos
        </span>
      </div>

      {/* =============================================
          ENCABEZADO INSTITUCIONAL
      ============================================= */}

      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-blue-700" />

        <div className="flex flex-col justify-between gap-5 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <ListChecks
                size={27}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                Administración de catálogos
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Opciones de características
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                Administrá los valores disponibles
                para las características técnicas
                configuradas como tipo selección.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
            <button
              type="button"
              onClick={refrescar}
              disabled={
                cargandoCaracteristicas ||
                cargandoOpciones ||
                operacionEnCurso
              }
              className={botonSecundario}
            >
              <RefreshCw
                size={17}
                className={
                  cargandoCaracteristicas ||
                  cargandoOpciones
                    ? "animate-spin"
                    : ""
                }
              />
              Actualizar
            </button>

            {puedeGestionar && caracteristicaId && (
              <button
                type="button"
                onClick={abrirCrear}
                disabled={
                  cargandoCaracteristicas ||
                  cargandoOpciones ||
                  operacionEnCurso ||
                  Boolean(errorOpciones)
                }
                className={botonPrincipal}
              >
                <Plus size={18} />
                Nueva opción
              </button>
            )}
          </div>
        </div>
      </header>

      {/* =============================================
          ERROR PERSISTENTE DE CARGA
      ============================================= */}

      {errorCarga && (
        <div
          role="alert"
          className="flex flex-col gap-4 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <p className="text-sm font-semibold text-red-800">
                No se pudieron cargar las características
              </p>

              <p className="mt-1 text-sm text-red-700">
                {errorCarga}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              cargarCaracteristicas({
                mostrarError: true,
              })
            }
            disabled={cargandoCaracteristicas}
            className={botonSecundario}
          >
            <RefreshCw size={16} />
            Reintentar
          </button>
        </div>
      )}

      {/* =============================================
          SELECCIÓN DE CARACTERÍSTICA
      ============================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Settings2
                  size={21}
                  strokeWidth={1.8}
                />
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  Seleccionar característica
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Elegí la característica técnica
                  cuyas opciones querés administrar.
                </p>
              </div>
            </div>

            <span className="inline-flex shrink-0 items-center self-start rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
              {caracteristicas.length} seleccionables
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {cargandoCaracteristicas ? (
            <div className="flex items-center gap-3 py-3">
              <Loader2
                size={21}
                className="animate-spin text-blue-700"
              />

              <p className="text-sm font-medium text-slate-500">
                Cargando características...
              </p>
            </div>
          ) : errorCarga && caracteristicas.length === 0 ? (
            <div className="rounded-xl border border-red-100 bg-red-50 p-5">
              <p className="text-sm text-red-700">
                No se pudo consultar el catálogo.
                Utilizá Reintentar para volver a cargarlo.
              </p>
            </div>
          ) : caracteristicas.length === 0 ? (
            <div className="flex flex-col gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400">
                  <Settings2 size={21} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    No hay características seleccionables
                  </h3>

                  <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    Primero necesitás registrar una
                    característica técnica con el
                    tipo de dato «Selección».
                  </p>
                </div>
              </div>

              <Link
                to="/catalogos/caracteristicas"
                className={botonSecundario}
              >
                <Plus size={16} />
                Ir a características
              </Link>
            </div>
          ) : (
            <>
              <label
                htmlFor="selector-caracteristica"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Característica técnica
              </label>

              <div className="relative max-w-xl">
                <select
                  id="selector-caracteristica"
                  value={caracteristicaId}
                  onChange={(event) => {
                    setCaracteristicaId(
                      event.target.value
                    );
                    setBusqueda("");
                    setOpciones([]);
                    setErrorOpciones("");
                  }}
                  disabled={
                    cargandoOpciones ||
                    operacionEnCurso ||
                    modalAbierto
                  }
                  className={selectBase}
                >
                  <option value="">
                    Seleccioná una característica
                  </option>

                  {caracteristicas.map(
                    (caracteristica) => (
                      <option
                        key={caracteristica.id}
                        value={caracteristica.id}
                      >
                        {caracteristica.nombre}
                      </option>
                    )
                  )}
                </select>

                <ChevronDown
                  size={17}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Solo se muestran las características
                configuradas con el tipo de dato
                «Selección».
              </p>
            </>
          )}
        </div>
      </section>

      {/* =============================================
          OPCIONES DISPONIBLES
      ============================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <ClipboardList
                  size={21}
                  strokeWidth={1.8}
                />
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  Opciones disponibles
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Consultá y administrá los valores
                  que podrán seleccionarse en los activos.
                </p>
              </div>
            </div>

            <span className="inline-flex shrink-0 items-center self-start rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
              {caracteristicaId
                ? `${opciones.length} opciones`
                : "Sin selección"}
            </span>
          </div>

          {caracteristicaId && (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-sm">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={busqueda}
                  onChange={(event) =>
                    setBusqueda(event.target.value)
                  }
                  placeholder="Buscar opción..."
                  aria-label="Buscar opciones"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {hayBusqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda("")}
                  className={botonSecundario}
                >
                  <X size={16} />
                  Limpiar búsqueda
                </button>
              )}
            </div>
          )}

          {caracteristicaId &&
            !cargandoOpciones &&
            !errorOpciones && (
              <p className="mt-4 text-xs font-medium text-slate-500">
                Mostrando{" "}
                <span className="font-bold text-slate-700">
                  {opcionesFiltradas.length}
                </span>{" "}
                de{" "}
                <span className="font-bold text-slate-700">
                  {opciones.length}
                </span>{" "}
                opciones
              </p>
            )}
        </div>

        {!caracteristicaId ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <ListChecks size={30} />
            </div>

            <h3 className="mt-5 text-base font-bold text-slate-900">
              Seleccioná una característica
            </h3>

            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              Elegí una característica técnica de
              tipo selección para consultar y
              administrar sus opciones disponibles.
            </p>
          </div>
        ) : (
          <>
            {/* RESUMEN */}

            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 bg-slate-50/40 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                  Característica seleccionada
                </p>

                <h3 className="mt-1 text-base font-bold text-slate-900">
                  {caracteristicaSeleccionada?.nombre ||
                    "Característica"}
                </h3>
              </div>

              <span className="inline-flex items-center self-start rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
                Tipo selección
              </span>
            </div>

            {/* ERROR AL CARGAR OPCIONES */}

            {errorOpciones && (
              <div
                role="alert"
                className="flex flex-col gap-3 border-b border-red-100 bg-red-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle
                    size={19}
                    className="mt-0.5 shrink-0 text-red-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-red-800">
                      No se pudieron cargar las opciones
                    </p>

                    <p className="mt-1 text-sm text-red-700">
                      {errorOpciones}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    cargarOpciones(caracteristicaId, {
                      mostrarError: true,
                    })
                  }
                  disabled={
                    cargandoOpciones ||
                    operacionEnCurso
                  }
                  className={botonSecundario}
                >
                  <RefreshCw size={16} />
                  Reintentar
                </button>
              </div>
            )}

            {/* TABLA DE OPCIONES */}

            {cargandoOpciones ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-3">
                <Loader2
                  size={27}
                  className="animate-spin text-blue-700"
                />

                <p className="text-sm font-medium text-slate-500">
                  Cargando opciones...
                </p>
              </div>
            ) : errorOpciones ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-5 py-12 text-center">
                <AlertCircle
                  size={30}
                  className="text-red-500"
                />

                <h3 className="mt-4 text-base font-bold text-slate-900">
                  No se pudo consultar el listado
                </h3>

                <p className="mt-2 max-w-md text-sm text-slate-500">
                  Reintentá la carga antes de administrar
                  las opciones de esta característica.
                </p>
              </div>
            ) : opcionesFiltradas.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-5 py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <ListChecks size={30} />
                </div>

                <h3 className="mt-5 text-base font-bold text-slate-900">
                  {hayBusqueda
                    ? "No se encontraron opciones"
                    : "Todavía no hay opciones registradas"}
                </h3>

                <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                  {hayBusqueda
                    ? "No hay valores que coincidan con la búsqueda realizada."
                    : "Agregá opciones para definir los valores que podrán seleccionarse al registrar activos."}
                </p>

                {hayBusqueda ? (
                  <button
                    type="button"
                    onClick={() => setBusqueda("")}
                    className={`mt-5 ${botonSecundario}`}
                  >
                    <X size={16} />
                    Limpiar búsqueda
                  </button>
                ) : (
                  puedeGestionar && (
                    <button
                      type="button"
                      onClick={abrirCrear}
                      disabled={
                        cargandoOpciones ||
                        operacionEnCurso
                      }
                      className={`mt-5 ${botonPrincipal}`}
                    >
                      <Plus size={17} />
                      Crear primera opción
                    </button>
                  )
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left">
                  <thead className="border-b border-slate-200 bg-slate-50/80">
                    <tr className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                      <th className="px-6 py-4">
                        Valor de la opción
                      </th>

                      <th className="px-6 py-4">
                        Identificador
                      </th>

                      <th className="px-6 py-4 text-right">
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {opcionesFiltradas.map((opcion) => (
                      <tr
                        key={opcion.id}
                        className="transition-colors hover:bg-slate-50/80"
                      >
                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                              <ListChecks size={18} />
                            </div>

                            <p className="font-semibold text-slate-900">
                              {opcion.valor}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4 align-middle">
                          <span className="text-sm font-medium text-slate-500">
                            #{opcion.id}
                          </span>
                        </td>

                        <td className="px-6 py-4 align-middle">
                          {puedeGestionar ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  abrirEditar(opcion)
                                }
                                disabled={
                                  operacionEnCurso ||
                                  cargandoOpciones
                                }
                                title="Editar opción"
                                aria-label={`Editar ${opcion.valor}`}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-blue-700 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  solicitarEliminacion(opcion)
                                }
                                disabled={
                                  operacionEnCurso ||
                                  cargandoOpciones
                                }
                                title="Eliminar opción"
                                aria-label={`Eliminar ${opcion.valor}`}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {eliminandoId === opcion.id ? (
                                  <Loader2
                                    size={16}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            </div>
                          ) : (
                            <p className="text-right text-xs font-medium text-slate-400">
                              Solo consulta
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!cargandoOpciones &&
              !errorOpciones &&
              opciones.length > 0 && (
                <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                  <p className="text-xs text-slate-500">
                    Los valores configurados estarán
                    disponibles al completar esta
                    característica en los formularios
                    de activos.
                  </p>
                </div>
              )}
          </>
        )}
      </section>

      {/* =============================================
          MODAL: CREAR / EDITAR OPCIÓN
      ============================================= */}

      {modalAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              cerrarModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-opcion"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="border-b border-slate-100 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    {opcionEditando ? (
                      <Pencil size={21} />
                    ) : (
                      <Plus size={22} />
                    )}
                  </div>

                  <div>
                    <h2
                      id="titulo-modal-opcion"
                      className="text-xl font-bold tracking-tight text-slate-900"
                    >
                      {opcionEditando
                        ? "Editar opción"
                        : "Nueva opción"}
                    </h2>

                    <p className="mt-1 text-sm leading-relaxed text-slate-500">
                      {opcionEditando
                        ? "Modificá el valor de la opción seleccionada."
                        : "Agregá un nuevo valor a la característica técnica."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={guardando}
                  aria-label="Cerrar formulario"
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            <form onSubmit={guardarOpcion} noValidate>
              <div className="space-y-5 p-6">

                {/* CARACTERÍSTICA */}

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Característica técnica
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <Settings2
                      size={17}
                      className="text-blue-700"
                    />

                    <p className="text-sm font-bold text-slate-800">
                      {caracteristicaSeleccionada?.nombre ||
                        "Característica"}
                    </p>
                  </div>
                </div>

                {/* VALOR */}

                <div>
                  <label
                    htmlFor="valor-opcion"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Valor de la opción
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="valor-opcion"
                    type="text"
                    value={valor}
                    onChange={(event) => {
                      setValor(event.target.value);

                      setErroresCampos((actual) => ({
                        ...actual,
                        valor: "",
                      }));
                    }}
                    maxLength={100}
                    autoFocus
                    disabled={guardando}
                    placeholder="Ej.: SSD, HDD, NVMe..."
                    aria-invalid={Boolean(
                      erroresCampos.valor
                    )}
                    className={`${campoBase} ${
                      erroresCampos.valor
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : ""
                    }`}
                  />

                  <div className="mt-2 flex items-start justify-between gap-3">
                    <div>
                      {erroresCampos.valor ? (
                        <p className="text-xs font-medium text-red-600">
                          {erroresCampos.valor}
                        </p>
                      ) : (
                        <p className="text-xs leading-relaxed text-slate-500">
                          El valor debe ser único
                          dentro de esta característica.
                        </p>
                      )}
                    </div>

                    <p className="shrink-0 text-xs text-slate-400">
                      {valor.length}/100
                    </p>
                  </div>
                </div>
              </div>

              {/* ACCIONES */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={guardando}
                  className={botonSecundario}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className={botonPrincipal}
                >
                  {guardando ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <CheckCircle2 size={17} />
                  )}

                  {guardando
                    ? "Guardando..."
                    : opcionEditando
                    ? "Guardar cambios"
                    : "Crear opción"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
