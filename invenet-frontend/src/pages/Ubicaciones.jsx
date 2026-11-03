
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
  Layers,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../context/FeedbackContext";

import {
  obtenerTodasUbicaciones,
  crearUbicacion,
  actualizarUbicacion,
  desactivarUbicacion,
  reactivarUbicacion,
} from "../services/ubicacionService";

// =====================================================
// CONFIGURACIÓN
// =====================================================

const formularioInicial = {
  nombre: "",
  descripcion: "",
};

const botonPrincipal =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50";

const botonSecundario =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const estiloCampo =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:opacity-70";

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function mensajeError(error, alternativo) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    alternativo
  );
}

function erroresValidacion(error) {
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

function ubicacionEstaActiva(ubicacion) {
  return (
    ubicacion.activo === true ||
    ubicacion.activo === 1 ||
    ubicacion.activo === "1"
  );
}

// =====================================================
// PÁGINA PRINCIPAL
// =====================================================

export default function Ubicaciones() {
  const { user } = useAuth();

  // =====================================================
  // FEEDBACK GLOBAL
  // =====================================================

  const { toast, confirmar } = useFeedback();

  // Mantiene una referencia actualizada al Toast
  // sin provocar recargas innecesarias del listado.
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
  // ESTADOS
  // =====================================================

  const [ubicaciones, setUbicaciones] = useState([]);

  const [busqueda, setBusqueda] = useState("");

  const [filtroEstado, setFiltroEstado] =
    useState("todas");

  const [cargando, setCargando] = useState(true);

  const [guardando, setGuardando] = useState(false);

  const [procesandoId, setProcesandoId] =
    useState(null);

  const [modalAbierto, setModalAbierto] =
    useState(false);

  const [ubicacionEditando, setUbicacionEditando] =
    useState(null);

  const [formulario, setFormulario] = useState({
    ...formularioInicial,
  });

  const [erroresCampos, setErroresCampos] =
    useState({});

  // El error persistente se utiliza únicamente
  // cuando falla la carga del listado.
  const [errorCarga, setErrorCarga] = useState("");

  // =====================================================
  // REFERENCIAS DE CONTROL
  // =====================================================

  // Previene envíos duplicados del formulario.
  const guardandoRef = useRef(false);

  // Previene cambios de estado simultáneos.
  const procesandoRef = useRef(false);

  // Identifica la solicitud de carga más reciente.
  const solicitudActualRef = useRef(0);

  // Evita actualizar estados después del desmontaje.
  const montadoRef = useRef(false);

  // =====================================================
  // CARGAR UBICACIONES
  // =====================================================

  const cargarUbicaciones = useCallback(
    async ({ mostrarError = true } = {}) => {
      const solicitud = ++solicitudActualRef.current;

      setCargando(true);
      setErrorCarga("");

      try {
        const respuesta =
          await obtenerTodasUbicaciones();

        if (
          !montadoRef.current ||
          solicitud !== solicitudActualRef.current
        ) {
          return false;
        }

        if (!Array.isArray(respuesta)) {
          throw new Error(
            "El servidor devolvió un formato de ubicaciones incorrecto."
          );
        }

        setUbicaciones(respuesta);

        return true;
      } catch (err) {
        if (
          !montadoRef.current ||
          solicitud !== solicitudActualRef.current
        ) {
          return false;
        }

        console.error(
          "Error al cargar ubicaciones:",
          err
        );

        const mensaje = mensajeError(
          err,
          "No se pudieron cargar las ubicaciones."
        );

        setErrorCarga(mensaje);

        if (mostrarError) {
          toastRef.current.error(mensaje);
        }

        return false;
      } finally {
        if (
          montadoRef.current &&
          solicitud === solicitudActualRef.current
        ) {
          setCargando(false);
        }
      }
    },
    []
  );

  // =====================================================
  // CARGA INICIAL
  // =====================================================

  useEffect(() => {
    montadoRef.current = true;

    // La carga inicial no muestra Toast.
    // Si falla, aparece el error persistente.
    cargarUbicaciones({
      mostrarError: false,
    });

    return () => {
      montadoRef.current = false;
      solicitudActualRef.current += 1;
    };
  }, [cargarUbicaciones]);

  // =====================================================
  // ACTUALIZAR LISTADO
  // =====================================================

  const actualizarListado = () => {
    if (
      cargando ||
      guardandoRef.current ||
      procesandoRef.current
    ) {
      return;
    }

    // Sin Toast de éxito al actualizar.
    cargarUbicaciones({
      mostrarError: true,
    });
  };

  // =====================================================
  // FILTROS Y CONTADORES
  // =====================================================

  const ubicacionesFiltradas = useMemo(() => {
    const termino = busqueda
      .trim()
      .toLocaleLowerCase("es-AR");

    return ubicaciones.filter((ubicacion) => {
      const coincideBusqueda =
        !termino ||
        [
          ubicacion.nombre,
          ubicacion.descripcion,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("es-AR")
          .includes(termino);

      const activa = ubicacionEstaActiva(ubicacion);

      const coincideEstado =
        filtroEstado === "todas" ||
        (filtroEstado === "activas" && activa) ||
        (filtroEstado === "inactivas" && !activa);

      return coincideBusqueda && coincideEstado;
    });
  }, [
    ubicaciones,
    busqueda,
    filtroEstado,
  ]);

  const totalUbicaciones = ubicaciones.length;

  const totalActivas = ubicaciones.filter(
    ubicacionEstaActiva
  ).length;

  const totalInactivas =
    totalUbicaciones - totalActivas;

  const hayFiltros =
    busqueda.trim() !== "" ||
    filtroEstado !== "todas";

  const operacionEnCurso =
    guardando || procesandoId !== null;

  // =====================================================
  // ABRIR FORMULARIO
  // =====================================================

  const abrirCrear = () => {
    if (
      !puedeGestionar ||
      operacionEnCurso ||
      guardandoRef.current ||
      procesandoRef.current
    ) {
      return;
    }

    setUbicacionEditando(null);

    setFormulario({
      ...formularioInicial,
    });

    setErroresCampos({});
    setModalAbierto(true);
  };

  const abrirEditar = (ubicacion) => {
    if (
      !puedeGestionar ||
      operacionEnCurso ||
      guardandoRef.current ||
      procesandoRef.current
    ) {
      return;
    }

    setUbicacionEditando(ubicacion);

    setFormulario({
      nombre: ubicacion.nombre ?? "",
      descripcion: ubicacion.descripcion ?? "",
    });

    setErroresCampos({});
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    if (
      guardando ||
      guardandoRef.current
    ) {
      return;
    }

    setModalAbierto(false);
    setUbicacionEditando(null);

    setFormulario({
      ...formularioInicial,
    });

    setErroresCampos({});
  };

  // =====================================================
  // CAMBIOS EN FORMULARIO
  // =====================================================

  const manejarCambio = (event) => {
    const { name, value } = event.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));

    // Al modificar un campo, se limpia únicamente
    // el error de validación correspondiente.
    setErroresCampos((anterior) => ({
      ...anterior,
      [name]: "",
    }));
  };

  // =====================================================
  // VALIDACIÓN
  // =====================================================

  const validarFormulario = () => {
    const errores = {};

    if (!formulario.nombre.trim()) {
      errores.nombre =
        "Ingresá el nombre de la ubicación.";
    } else if (
      formulario.nombre.trim().length > 100
    ) {
      errores.nombre =
        "El nombre no puede superar los 100 caracteres.";
    }

    if (formulario.descripcion.length > 255) {
      errores.descripcion =
        "La descripción no puede superar los 255 caracteres.";
    }

    setErroresCampos(errores);

    return Object.keys(errores).length === 0;
  };

  // =====================================================
  // CREAR / ACTUALIZAR UBICACIÓN
  // =====================================================

  const guardarUbicacion = async (event) => {
    event.preventDefault();

    if (
      !puedeGestionar ||
      guardandoRef.current ||
      procesandoRef.current ||
      procesandoId !== null
    ) {
      return;
    }

    if (!validarFormulario()) {
      toast.warning(
        "Revisá los campos señalados antes de continuar."
      );

      return;
    }

    guardandoRef.current = true;
    setGuardando(true);

    const datos = {
      nombre: formulario.nombre.trim(),
      descripcion:
        formulario.descripcion.trim() || null,
    };

    const esEdicion = Boolean(ubicacionEditando);

    try {
      const respuesta = esEdicion
        ? await actualizarUbicacion(
            ubicacionEditando.id,
            datos
          )
        : await crearUbicacion(datos);

      // La creación o edición se completó
      // correctamente en el backend.
      setModalAbierto(false);
      setUbicacionEditando(null);

      setFormulario({
        ...formularioInicial,
      });

      setErroresCampos({});

      toast.success(
        respuesta?.message ||
          (esEdicion
            ? "Ubicación actualizada correctamente."
            : "Ubicación creada correctamente.")
      );

      // La recarga del listado es independiente
      // del resultado de la operación anterior.
      await cargarUbicaciones({
        mostrarError: true,
      });
    } catch (err) {
      console.error(
        "Error al guardar ubicación:",
        err
      );

      if (err?.response?.status === 422) {
        setErroresCampos(erroresValidacion(err));

        toast.warning(
          "Revisá los datos ingresados. Hay campos que requieren corrección."
        );
      } else {
        toast.error(
          mensajeError(
            err,
            esEdicion
              ? "No se pudo actualizar la ubicación."
              : "No se pudo crear la ubicación."
          )
        );
      }

      // Si falla el guardado, el formulario
      // permanece abierto con los datos ingresados.
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  };

  // =====================================================
  // DESACTIVAR / REACTIVAR UBICACIÓN
  // =====================================================

  const solicitarCambioEstado = async (
    ubicacion,
    accion
  ) => {
    if (
      !puedeGestionar ||
      operacionEnCurso ||
      guardandoRef.current ||
      procesandoRef.current
    ) {
      return;
    }

    const esDesactivacion =
      accion === "desactivar";

    // =====================================================
    // CONFIRMACIÓN GLOBAL
    // =====================================================

    const aceptado = await confirmar({
      titulo: esDesactivacion
        ? "Desactivar ubicación"
        : "Reactivar ubicación",

      mensaje: esDesactivacion
        ? `¿Querés desactivar la ubicación "${ubicacion.nombre}"? La ubicación solo podrá desactivarse si no tiene activos asociados. Podrás reactivarla posteriormente.`
        : `¿Querés reactivar la ubicación "${ubicacion.nombre}"? Volverá a estar disponible para su utilización en el sistema.`,

      textoConfirmar: esDesactivacion
        ? "Confirmar desactivación"
        : "Confirmar reactivación",

      textoCancelar: "Cancelar",

      variante: esDesactivacion
        ? "danger"
        : "success",
    });

    if (!aceptado) {
      return;
    }

    if (
      guardandoRef.current ||
      procesandoRef.current
    ) {
      return;
    }

    procesandoRef.current = true;
    setProcesandoId(ubicacion.id);

    try {
      const respuesta = esDesactivacion
        ? await desactivarUbicacion(ubicacion.id)
        : await reactivarUbicacion(ubicacion.id);

      // Actualización inmediata del estado
      // para reflejar el resultado en la tabla.
      setUbicaciones((anteriores) =>
        anteriores.map((item) =>
          item.id === ubicacion.id
            ? {
                ...item,
                activo: !esDesactivacion,
              }
            : item
        )
      );

      toast.success(
        respuesta?.message ||
          (esDesactivacion
            ? "Ubicación desactivada correctamente."
            : "Ubicación reactivada correctamente.")
      );

      // Se conserva el comportamiento original:
      // el estado se actualiza directamente
      // sin solicitar nuevamente todo el listado.
    } catch (err) {
      console.error(
        "Error al cambiar estado de ubicación:",
        err
      );

      toast.error(
        mensajeError(
          err,
          esDesactivacion
            ? "No se pudo desactivar la ubicación."
            : "No se pudo reactivar la ubicación."
        )
      );
    } finally {
      procesandoRef.current = false;
      setProcesandoId(null);
    }
  };

  // =====================================================
  // LIMPIAR FILTROS
  // =====================================================

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroEstado("todas");
  };

  // =====================================================
  // RENDERIZADO
  // =====================================================

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-10">

      {/* =============================================
          VOLVER A CATÁLOGOS
      ============================================= */}

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
          CAJA 1 - ENCABEZADO INSTITUCIONAL
      ============================================= */}

      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-blue-700" />

        <div className="flex flex-col justify-between gap-5 p-5 sm:p-6 lg:flex-row lg:items-center">

          {/* TÍTULO */}

          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <MapPin
                size={27}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                Administración de catálogos
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Ubicaciones
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                Administrá los espacios físicos donde se
                encuentran los activos tecnológicos
                registrados en Invenet.
              </p>
            </div>
          </div>

          {/* ACCIONES */}

          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">

            <button
              type="button"
              onClick={actualizarListado}
              disabled={
                cargando || operacionEnCurso
              }
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

            {puedeGestionar && (
              <button
                type="button"
                onClick={abrirCrear}
                disabled={
                  cargando || operacionEnCurso
                }
                className={botonPrincipal}
              >
                <Plus size={18} />
                Nueva ubicación
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
                No se pudo actualizar el listado
              </p>

              <p className="mt-1 text-sm leading-relaxed text-red-700">
                {errorCarga}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={actualizarListado}
            disabled={
              cargando || operacionEnCurso
            }
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Reintentar
          </button>
        </div>
      )}

      {/* =============================================
          CAJA 2 - LISTADO
      ============================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* ENCABEZADO DEL LISTADO */}

        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">

            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <MapPin
                  size={21}
                  strokeWidth={1.8}
                />
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  Listado de ubicaciones
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Consultá y administrá las ubicaciones
                  registradas en el sistema.
                </p>
              </div>
            </div>

            {/* CONTADORES */}

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">

              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
                {totalUbicaciones} total
              </span>

              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                {totalActivas} activas
              </span>

              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {totalInactivas} inactivas
              </span>
            </div>
          </div>

          {/* =============================================
              BÚSQUEDA Y FILTRO SELECT
          ============================================= */}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">

            {/* BÚSQUEDA */}

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
                placeholder="Buscar por nombre o descripción..."
                aria-label="Buscar ubicaciones"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* FILTRO SELECT */}

            <div className="relative w-full sm:w-52">
              <select
                id="filtro-estado-ubicaciones"
                value={filtroEstado}
                onChange={(event) =>
                  setFiltroEstado(event.target.value)
                }
                aria-label="Filtrar ubicaciones por estado"
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition hover:border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="todas">
                  Todos los estados
                </option>

                <option value="activas">
                  Activas
                </option>

                <option value="inactivas">
                  Inactivas
                </option>
              </select>

              <ChevronDown
                size={17}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            {/* LIMPIAR FILTROS */}

            {hayFiltros && (
              <button
                type="button"
                onClick={limpiarFiltros}
                title="Limpiar filtros"
                aria-label="Limpiar filtros"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100"
              >
                <X size={17} />
              </button>
            )}
          </div>

          {/* RESULTADOS */}

          <p className="mt-4 text-xs font-medium text-slate-500">
            Mostrando{" "}
            <span className="font-bold text-slate-700">
              {ubicacionesFiltradas.length}
            </span>{" "}
            de{" "}
            <span className="font-bold text-slate-700">
              {totalUbicaciones}
            </span>{" "}
            ubicaciones
          </p>
        </div>

        {/* =============================================
            TABLA
        ============================================= */}

        {cargando ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-3">
            <Loader2
              size={28}
              className="animate-spin text-blue-700"
            />

            <p className="text-sm font-medium text-slate-500">
              Cargando ubicaciones...
            </p>
          </div>
        ) : errorCarga && ubicaciones.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-5 py-12 text-center">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <AlertCircle size={28} />
            </div>

            <h3 className="mt-5 text-base font-bold text-slate-900">
              No se pudo cargar el listado
            </h3>

            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              Intentá nuevamente utilizando el botón
              Reintentar.
            </p>
          </div>
        ) : ubicacionesFiltradas.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-5 py-12 text-center">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <MapPin size={30} />
            </div>

            <h3 className="mt-5 text-base font-bold text-slate-900">
              {hayFiltros
                ? "No se encontraron ubicaciones"
                : "Todavía no hay ubicaciones registradas"}
            </h3>

            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              {hayFiltros
                ? "No hay ubicaciones que coincidan con los filtros seleccionados."
                : "Las ubicaciones que registres en el sistema aparecerán acá."}
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">

              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">

                  <th className="px-6 py-4">
                    Ubicación
                  </th>

                  <th className="px-6 py-4">
                    Descripción
                  </th>

                  <th className="px-6 py-4">
                    Estado
                  </th>

                  <th className="px-6 py-4 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {ubicacionesFiltradas.map((ubicacion) => {
                  const activa =
                    ubicacionEstaActiva(ubicacion);

                  const procesando =
                    procesandoId === ubicacion.id;

                  return (
                    <tr
                      key={ubicacion.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >

                      {/* UBICACIÓN */}

                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                            <MapPin size={18} />
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">
                              {ubicacion.nombre}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              ID #{ubicacion.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* DESCRIPCIÓN */}

                      <td className="max-w-md px-6 py-4 align-middle">
                        <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
                          {ubicacion.descripcion ||
                            "Sin descripción"}
                        </p>
                      </td>

                      {/* ESTADO */}

                      <td className="px-6 py-4 align-middle">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                            activa
                              ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                              : "border border-slate-200 bg-slate-100 text-slate-600"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              activa
                                ? "bg-emerald-500"
                                : "bg-slate-400"
                            }`}
                          />

                          {activa
                            ? "Activa"
                            : "Inactiva"}
                        </span>
                      </td>

                      {/* ACCIONES */}

                      <td className="px-6 py-4 align-middle">
                        {puedeGestionar ? (
                          <div className="flex items-center justify-end gap-2">

                            {/* EDITAR */}

                            <button
                              type="button"
                              onClick={() =>
                                abrirEditar(ubicacion)
                              }
                              disabled={
                                operacionEnCurso || cargando
                              }
                              title="Editar ubicación"
                              aria-label={`Editar ${ubicacion.nombre}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-blue-700 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Pencil size={16} />
                            </button>

                            {/* DESACTIVAR / REACTIVAR */}

                            <button
                              type="button"
                              onClick={() =>
                                solicitarCambioEstado(
                                  ubicacion,
                                  activa
                                    ? "desactivar"
                                    : "reactivar"
                                )
                              }
                              disabled={
                                operacionEnCurso || cargando
                              }
                              title={
                                activa
                                  ? "Desactivar ubicación"
                                  : "Reactivar ubicación"
                              }
                              aria-label={`${
                                activa
                                  ? "Desactivar"
                                  : "Reactivar"
                              } ${ubicacion.nombre}`}
                              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                activa
                                  ? "border-red-100 bg-white text-red-600 hover:border-red-200 hover:bg-red-50"
                                  : "border-emerald-100 bg-white text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50"
                              }`}
                            >
                              {procesando ? (
                                <Loader2
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : activa ? (
                                <Trash2 size={16} />
                              ) : (
                                <RotateCcw size={16} />
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PIE DEL LISTADO */}

        {!cargando &&
          ubicacionesFiltradas.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
              <p className="text-xs text-slate-500">
                Las ubicaciones permiten identificar
                los espacios físicos donde se encuentran
                los activos tecnológicos de la institución.
              </p>
            </div>
          )}
      </section>

      {/* =============================================
          MODAL: CREAR / EDITAR
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
            aria-labelledby="modal-ubicacion-titulo"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
          >

            {/* ENCABEZADO */}

            <div className="border-b border-slate-100 p-6">
              <div className="flex items-start justify-between gap-4">

                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    {ubicacionEditando ? (
                      <Pencil size={21} />
                    ) : (
                      <Plus size={22} />
                    )}
                  </div>

                  <div>
                    <h2
                      id="modal-ubicacion-titulo"
                      className="text-xl font-bold tracking-tight text-slate-900"
                    >
                      {ubicacionEditando
                        ? "Editar ubicación"
                        : "Nueva ubicación"}
                    </h2>

                    <p className="mt-1 text-sm leading-relaxed text-slate-500">
                      {ubicacionEditando
                        ? "Modificá la información de la ubicación seleccionada."
                        : "Registrá un nuevo espacio físico para localizar los activos."}
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

            {/* FORMULARIO */}

            <form
              onSubmit={guardarUbicacion}
              noValidate
            >
              <div className="space-y-5 p-6">

                {/* NOMBRE */}

                <div>
                  <label
                    htmlFor="nombre-ubicacion"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Nombre de la ubicación

                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="nombre-ubicacion"
                    name="nombre"
                    type="text"
                    value={formulario.nombre}
                    onChange={manejarCambio}
                    maxLength={100}
                    autoFocus
                    disabled={guardando}
                    placeholder="Ej.: Laboratorio de informática"
                    aria-invalid={Boolean(
                      erroresCampos.nombre
                    )}
                    className={`${estiloCampo} ${
                      erroresCampos.nombre
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : ""
                    }`}
                  />

                  {erroresCampos.nombre && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {erroresCampos.nombre}
                    </p>
                  )}
                </div>

                {/* DESCRIPCIÓN */}

                <div>
                  <label
                    htmlFor="descripcion-ubicacion"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Descripción

                    <span className="ml-2 text-xs font-normal text-slate-400">
                      Opcional
                    </span>
                  </label>

                  <textarea
                    id="descripcion-ubicacion"
                    name="descripcion"
                    value={formulario.descripcion}
                    onChange={manejarCambio}
                    maxLength={255}
                    rows={4}
                    disabled={guardando}
                    placeholder="Ej.: Primer piso, ala norte..."
                    aria-invalid={Boolean(
                      erroresCampos.descripcion
                    )}
                    className={`${estiloCampo} resize-none ${
                      erroresCampos.descripcion
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : ""
                    }`}
                  />

                  <div className="mt-1.5 flex items-center justify-between gap-3">

                    <div>
                      {erroresCampos.descripcion && (
                        <p className="text-xs font-medium text-red-600">
                          {erroresCampos.descripcion}
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-slate-400">
                      {formulario.descripcion.length}/255
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
                    : ubicacionEditando
                    ? "Guardar cambios"
                    : "Crear ubicación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
