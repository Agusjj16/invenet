
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
  Layers3,
  Link2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../context/FeedbackContext";

import { obtenerCategorias } from "../services/categoriaService";

import {
  obtenerCaracteristicas,
  crearCaracteristica,
  actualizarCaracteristica,
  obtenerCaracteristicasPorCategoria,
  asociarCaracteristica,
  actualizarObligatoriedad,
  desvincularCaracteristica,
} from "../services/caracteristicaService";

// =====================================================
// CONFIGURACIÓN
// =====================================================

const TIPOS = [
  { value: "texto", label: "Texto" },
  { value: "numero", label: "Número entero" },
  { value: "decimal", label: "Número decimal" },
  { value: "booleano", label: "Sí / No" },
  { value: "select", label: "Selección" },
];

const FORMULARIO_INICIAL = {
  nombre: "",
  tipo_dato: "texto",
  unidad: "",
};

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

function nombreTipo(tipo) {
  return (
    TIPOS.find((item) => item.value === tipo)?.label ||
    tipo ||
    "Sin especificar"
  );
}

function esObligatoria(item) {
  return (
    item.pivot?.obligatorio === true ||
    item.pivot?.obligatorio === 1 ||
    item.pivot?.obligatorio === "1"
  );
}

// =====================================================
// PÁGINA PRINCIPAL
// =====================================================

export default function Caracteristicas() {
  const { user } = useAuth();
  const { toast, confirmar } = useFeedback();

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

  const [caracteristicas, setCaracteristicas] =
    useState([]);

  const [categorias, setCategorias] =
    useState([]);

  const [categoriaId, setCategoriaId] =
    useState("");

  const [asociadas, setAsociadas] =
    useState([]);

  const [busqueda, setBusqueda] =
    useState("");

  const [filtroTipo, setFiltroTipo] =
    useState("todos");

  const [cargando, setCargando] =
    useState(true);

  const [cargandoAsociadas, setCargandoAsociadas] =
    useState(false);

  const [errorCarga, setErrorCarga] =
    useState("");

  const [errorAsociaciones, setErrorAsociaciones] =
    useState("");

  const [modalAbierto, setModalAbierto] =
    useState(false);

  const [editando, setEditando] =
    useState(null);

  const [formulario, setFormulario] =
    useState({ ...FORMULARIO_INICIAL });

  const [erroresCampos, setErroresCampos] =
    useState({});

  const [guardando, setGuardando] =
    useState(false);

  const [
    caracteristicaParaAsociar,
    setCaracteristicaParaAsociar,
  ] = useState("");

  const [nuevaObligatoria, setNuevaObligatoria] =
    useState(false);

  const [
    procesandoAsociacion,
    setProcesandoAsociacion,
  ] = useState(false);

  const [operacionId, setOperacionId] =
    useState(null);

  // =====================================================
  // REFERENCIAS DE CONTROL
  // =====================================================

  const guardandoRef = useRef(false);
  const procesandoRef = useRef(false);

  const solicitudDatosRef = useRef(0);
  const solicitudAsociadasRef = useRef(0);

  const montadoRef = useRef(false);

  const toastRef = useRef(toast);
  toastRef.current = toast;

  const operacionEnCurso =
    guardando ||
    procesandoAsociacion ||
    operacionId !== null;

  // =====================================================
  // CARGAR CARACTERÍSTICAS Y CATEGORÍAS
  // =====================================================

  const cargarDatos = useCallback(
    async ({ mostrarError = false } = {}) => {
      const solicitud = ++solicitudDatosRef.current;

      setCargando(true);
      setErrorCarga("");

      try {
        const [
          listaCaracteristicas,
          listaCategorias,
        ] = await Promise.all([
          obtenerCaracteristicas(),
          obtenerCategorias(),
        ]);

        if (
          !Array.isArray(listaCaracteristicas) ||
          !Array.isArray(listaCategorias)
        ) {
          throw new Error(
            "El servidor devolvió un formato de datos incorrecto."
          );
        }

        if (
          !montadoRef.current ||
          solicitud !== solicitudDatosRef.current
        ) {
          return false;
        }

        setCaracteristicas(listaCaracteristicas);
        setCategorias(listaCategorias);

        return true;
      } catch (err) {
        if (
          !montadoRef.current ||
          solicitud !== solicitudDatosRef.current
        ) {
          return false;
        }

        console.error(
          "Error al cargar características:",
          err
        );

        const texto = mensajeError(
          err,
          "No se pudieron cargar los catálogos."
        );

        setErrorCarga(texto);

        if (mostrarError) {
          toastRef.current.error(texto);
        }

        return false;
      } finally {
        if (
          montadoRef.current &&
          solicitud === solicitudDatosRef.current
        ) {
          setCargando(false);
        }
      }
    },
    []
  );

  // =====================================================
  // CARGAR ASOCIACIONES
  // =====================================================

  const cargarAsociadas = useCallback(
    async (
      id,
      { mostrarError = false } = {}
    ) => {
      const solicitud = ++solicitudAsociadasRef.current;

      if (!id) {
        setAsociadas([]);
        setErrorAsociaciones("");
        setCargandoAsociadas(false);
        return true;
      }

      setCargandoAsociadas(true);
      setErrorAsociaciones("");

      try {
        const respuesta =
          await obtenerCaracteristicasPorCategoria(id);

        if (
          !montadoRef.current ||
          solicitud !== solicitudAsociadasRef.current
        ) {
          return false;
        }

        if (!Array.isArray(respuesta?.caracteristicas)) {
          throw new Error(
            "El servidor devolvió un formato de asociaciones incorrecto."
          );
        }

        setAsociadas(respuesta.caracteristicas);

        return true;
      } catch (err) {
        if (
          !montadoRef.current ||
          solicitud !== solicitudAsociadasRef.current
        ) {
          return false;
        }

        console.error(
          "Error al cargar asociaciones:",
          err
        );

        const texto = mensajeError(
          err,
          "No se pudieron consultar las asociaciones."
        );

        setAsociadas([]);
        setErrorAsociaciones(texto);

        if (mostrarError) {
          toastRef.current.error(texto);
        }

        return false;
      } finally {
        if (
          montadoRef.current &&
          solicitud === solicitudAsociadasRef.current
        ) {
          setCargandoAsociadas(false);
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

    cargarDatos();

    return () => {
      montadoRef.current = false;
      solicitudDatosRef.current += 1;
    };
  }, [cargarDatos]);

  useEffect(() => {
    cargarAsociadas(categoriaId);

    return () => {
      solicitudAsociadasRef.current += 1;
    };
  }, [categoriaId, cargarAsociadas]);

  // =====================================================
  // ACTUALIZAR DATOS
  // =====================================================

  const refrescar = async () => {
    if (
      cargando ||
      cargandoAsociadas ||
      operacionEnCurso ||
      guardandoRef.current ||
      procesandoRef.current
    ) {
      return;
    }

    await cargarDatos({ mostrarError: true });

    if (categoriaId) {
      await cargarAsociadas(
        categoriaId,
        { mostrarError: true }
      );
    }

    // Actualizar el listado NO genera Toast de éxito.
  };

  // =====================================================
  // FILTROS
  // =====================================================

  const filtradas = useMemo(() => {
    const termino = busqueda
      .trim()
      .toLocaleLowerCase("es-AR");

    return caracteristicas.filter((item) => {
      const coincideBusqueda =
        !termino ||
        [
          item.nombre,
          item.tipo_dato,
          nombreTipo(item.tipo_dato),
          item.unidad,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("es-AR")
          .includes(termino);

      const coincideTipo =
        filtroTipo === "todos" ||
        item.tipo_dato === filtroTipo;

      return coincideBusqueda && coincideTipo;
    });
  }, [caracteristicas, busqueda, filtroTipo]);

  const hayFiltros =
    busqueda.trim() !== "" ||
    filtroTipo !== "todos";

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroTipo("todos");
  };

  // =====================================================
  // CONTADORES
  // =====================================================

  const totalCaracteristicas =
    caracteristicas.length;

  const totalTipos = new Set(
    caracteristicas.map((item) => item.tipo_dato)
  ).size;

  const totalSeleccionables =
    caracteristicas.filter(
      (item) => item.tipo_dato === "select"
    ).length;

  // =====================================================
  // CARACTERÍSTICAS DISPONIBLES
  // =====================================================

  const disponiblesParaAsociar = useMemo(() => {
    const idsAsociadas = new Set(
      asociadas.map((item) => String(item.id))
    );

    return caracteristicas.filter(
      (item) =>
        !idsAsociadas.has(String(item.id))
    );
  }, [caracteristicas, asociadas]);

  const categoriaSeleccionada = categorias.find(
    (item) =>
      String(item.id) === String(categoriaId)
  );

  const totalObligatorias = asociadas.filter(
    esObligatoria
  ).length;

  // =====================================================
  // MODAL CREAR / EDITAR
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

    setEditando(null);
    setFormulario({ ...FORMULARIO_INICIAL });
    setErroresCampos({});
    setModalAbierto(true);
  };

  const abrirEditar = (item) => {
    if (
      !puedeGestionar ||
      operacionEnCurso ||
      guardandoRef.current ||
      procesandoRef.current
    ) {
      return;
    }

    setEditando(item);

    setFormulario({
      nombre: item.nombre ?? "",
      tipo_dato: item.tipo_dato,
      unidad: item.unidad ?? "",
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
    setEditando(null);
    setFormulario({ ...FORMULARIO_INICIAL });
    setErroresCampos({});
  };

  const cambiarCampo = (event) => {
    const { name, value } = event.target;

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));

    setErroresCampos((actual) => ({
      ...actual,
      [name]: "",
    }));
  };

  // =====================================================
  // GUARDAR CARACTERÍSTICA
  // =====================================================

  const guardar = async (event) => {
    event.preventDefault();

    if (
      !puedeGestionar ||
      operacionEnCurso ||
      guardandoRef.current ||
      procesandoRef.current
    ) {
      return;
    }

    const errores = {};

    if (!formulario.nombre.trim()) {
      errores.nombre =
        "Ingresá el nombre de la característica.";
    } else if (
      formulario.nombre.trim().length > 100
    ) {
      errores.nombre =
        "El nombre no puede superar los 100 caracteres.";
    }

    if (formulario.unidad.trim().length > 50) {
      errores.unidad =
        "La unidad no puede superar los 50 caracteres.";
    }

    if (
      !editando &&
      !TIPOS.some(
        (tipo) =>
          tipo.value === formulario.tipo_dato
      )
    ) {
      errores.tipo_dato =
        "Seleccioná un tipo de dato válido.";
    }

    setErroresCampos(errores);

    if (Object.keys(errores).length > 0) {
      toast.warning(
        "Revisá los campos señalados antes de continuar."
      );
      return;
    }

    guardandoRef.current = true;
    setGuardando(true);

    const datos = {
      nombre: formulario.nombre.trim(),
      unidad: formulario.unidad.trim() || null,
    };

    const esEdicion = Boolean(editando);

    try {
      const respuesta = esEdicion
        ? await actualizarCaracteristica(
            editando.id,
            datos
          )
        : await crearCaracteristica({
            ...datos,
            tipo_dato: formulario.tipo_dato,
          });

      setModalAbierto(false);
      setEditando(null);
      setFormulario({ ...FORMULARIO_INICIAL });
      setErroresCampos({});

      toast.success(
        respuesta?.message ||
          (esEdicion
            ? "Característica actualizada correctamente."
            : "Característica creada correctamente.")
      );

      // El guardado ya fue exitoso.
      // Los errores posteriores de recarga se informan
      // de forma independiente.
      await cargarDatos({ mostrarError: true });

      if (categoriaId) {
        await cargarAsociadas(
          categoriaId,
          { mostrarError: true }
        );
      }
    } catch (err) {
      console.error(
        "Error al guardar característica:",
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
              ? "No se pudo actualizar la característica."
              : "No se pudo crear la característica."
          )
        );
      }
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  };

  // =====================================================
  // ASOCIAR CARACTERÍSTICA
  // =====================================================

  const asociar = async (event) => {
    event.preventDefault();

    if (
      !puedeGestionar ||
      !categoriaId ||
      !caracteristicaParaAsociar ||
      operacionEnCurso ||
      cargandoAsociadas ||
      procesandoRef.current ||
      guardandoRef.current
    ) {
      return;
    }

    const idActual = categoriaId;

    procesandoRef.current = true;
    setProcesandoAsociacion(true);

    try {
      const respuesta = await asociarCaracteristica(
        idActual,
        {
          caracteristica_id:
            Number(caracteristicaParaAsociar),
          obligatorio: nuevaObligatoria,
        }
      );

      setCaracteristicaParaAsociar("");
      setNuevaObligatoria(false);

      toast.success(
        respuesta?.message ||
          "Característica asociada correctamente."
      );

      await cargarAsociadas(
        idActual,
        { mostrarError: true }
      );

      await cargarDatos({ mostrarError: true });
    } catch (err) {
      console.error(
        "Error al asociar característica:",
        err
      );

      toast.error(
        mensajeError(
          err,
          "No se pudo asociar la característica."
        )
      );
    } finally {
      procesandoRef.current = false;
      setProcesandoAsociacion(false);
    }
  };

  // =====================================================
  // CAMBIAR OBLIGATORIEDAD
  // =====================================================

  const cambiarObligatoriedad = async (item) => {
    if (
      !puedeGestionar ||
      !categoriaId ||
      operacionEnCurso ||
      cargandoAsociadas ||
      procesandoRef.current ||
      guardandoRef.current
    ) {
      return;
    }

    const idActual = categoriaId;
    const nuevoValor = !esObligatoria(item);

    procesandoRef.current = true;
    setOperacionId(item.id);

    try {
      const respuesta =
        await actualizarObligatoriedad(
          idActual,
          item.id,
          nuevoValor
        );

      toast.success(
        respuesta?.message ||
          "Obligatoriedad actualizada correctamente."
      );

      await cargarAsociadas(
        idActual,
        { mostrarError: true }
      );
    } catch (err) {
      console.error(
        "Error al actualizar obligatoriedad:",
        err
      );

      toast.error(
        mensajeError(
          err,
          "No se pudo cambiar la obligatoriedad."
        )
      );
    } finally {
      procesandoRef.current = false;
      setOperacionId(null);
    }
  };

  // =====================================================
  // DESVINCULAR CARACTERÍSTICA
  // =====================================================

  const solicitarDesvinculacion = async (item) => {
    if (
      !puedeGestionar ||
      !categoriaId ||
      operacionEnCurso ||
      cargandoAsociadas ||
      procesandoRef.current ||
      guardandoRef.current
    ) {
      return;
    }

    const idActual = categoriaId;

    // Confirmación global de Invenet.
    const aceptado = await confirmar({
      titulo: "Desvincular característica",

      mensaje:
        `¿Querés desvincular la característica "${item.nombre}" ` +
        `de la categoría "${categoriaSeleccionada?.nombre || "seleccionada"}"? ` +
        "La operación será rechazada si existen activos de esta categoría " +
        "con valores registrados para esta característica.",

      textoConfirmar: "Confirmar desvinculación",
      textoCancelar: "Cancelar",
      variante: "danger",
    });

    if (
      !aceptado ||
      procesandoRef.current ||
      guardandoRef.current
    ) {
      return;
    }

    procesandoRef.current = true;
    setOperacionId(item.id);

    try {
      const respuesta =
        await desvincularCaracteristica(
          idActual,
          item.id
        );

      toast.success(
        respuesta?.message ||
          "Característica desvinculada correctamente."
      );

      await cargarAsociadas(
        idActual,
        { mostrarError: true }
      );

      await cargarDatos({ mostrarError: true });
    } catch (err) {
      console.error(
        "Error al desvincular característica:",
        err
      );

      toast.error(
        mensajeError(
          err,
          "No se pudo desvincular la característica."
        )
      );
    } finally {
      procesandoRef.current = false;
      setOperacionId(null);
    }
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
              <Settings2
                size={27}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                Administración de catálogos
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Características técnicas
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                Configurá los atributos técnicos
                utilizados para describir los activos
                tecnológicos de la institución.
              </p>
            </div>
          </div>

          {/* ACCIONES */}

          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
            <button
              type="button"
              onClick={refrescar}
              disabled={
                cargando ||
                cargandoAsociadas ||
                operacionEnCurso
              }
              className={botonSecundario}
            >
              <RefreshCw
                size={17}
                className={
                  cargando || cargandoAsociadas
                    ? "animate-spin"
                    : ""
                }
              />

              Actualizar
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
                Nueva característica
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
                No se pudieron cargar los catálogos
              </p>

              <p className="mt-1 text-sm leading-relaxed text-red-700">
                {errorCarga}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={refrescar}
            disabled={
              cargando ||
              cargandoAsociadas ||
              operacionEnCurso
            }
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Reintentar
          </button>
        </div>
      )}

      {/* =============================================
          CAJA 2 - CATÁLOGO DE CARACTERÍSTICAS
      ============================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* ENCABEZADO */}

        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">

            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <ClipboardList
                  size={21}
                  strokeWidth={1.8}
                />
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  Catálogo de características
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Consultá y administrá las
                  características técnicas registradas.
                </p>
              </div>
            </div>

            {/* CONTADORES */}

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
                {totalCaracteristicas} total
              </span>

              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {totalTipos} tipos
              </span>

              <span className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
                {totalSeleccionables} seleccionables
              </span>
            </div>
          </div>

          {/* =============================================
              BÚSQUEDA Y FILTRO
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
                placeholder="Buscar característica..."
                aria-label="Buscar características"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* FILTRO POR TIPO */}

            <div className="relative w-full sm:w-56">
              <select
                id="filtro-tipo-caracteristicas"
                value={filtroTipo}
                onChange={(event) =>
                  setFiltroTipo(event.target.value)
                }
                aria-label="Filtrar por tipo de dato"
                className={selectBase}
              >
                <option value="todos">
                  Todos los tipos
                </option>

                {TIPOS.map((tipo) => (
                  <option
                    key={tipo.value}
                    value={tipo.value}
                  >
                    {tipo.label}
                  </option>
                ))}
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
              {filtradas.length}
            </span>{" "}
            de{" "}
            <span className="font-bold text-slate-700">
              {totalCaracteristicas}
            </span>{" "}
            características
          </p>
        </div>

        {/* =============================================
            TABLA DE CARACTERÍSTICAS
        ============================================= */}

        {cargando ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-3">
            <Loader2
              size={28}
              className="animate-spin text-blue-700"
            />

            <p className="text-sm font-medium text-slate-500">
              Cargando características...
            </p>
          </div>
        ) : errorCarga && caracteristicas.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-5 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <AlertCircle size={30} />
            </div>

            <h3 className="mt-5 text-base font-bold text-slate-900">
              No se pudo cargar el catálogo
            </h3>

            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              Intentá nuevamente utilizando el botón Reintentar.
            </p>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-5 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Settings2 size={30} />
            </div>

            <h3 className="mt-5 text-base font-bold text-slate-900">
              {hayFiltros
                ? "No se encontraron características"
                : "Todavía no hay características registradas"}
            </h3>

            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              {hayFiltros
                ? "No hay características que coincidan con los filtros seleccionados."
                : "Las características técnicas que registres aparecerán acá."}
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
            <table className="w-full min-w-[800px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                  <th className="px-6 py-4">
                    Característica
                  </th>

                  <th className="px-6 py-4">
                    Tipo de dato
                  </th>

                  <th className="px-6 py-4">
                    Unidad
                  </th>

                  <th className="px-6 py-4">
                    Categorías
                  </th>

                  <th className="px-6 py-4 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filtradas.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-slate-50/80"
                  >

                    {/* CARACTERÍSTICA */}

                    <td className="px-6 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                          <Settings2 size={18} />
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">
                            {item.nombre}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            ID #{item.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* TIPO */}

                    <td className="px-6 py-4 align-middle">
                      <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                        {nombreTipo(item.tipo_dato)}
                      </span>
                    </td>

                    {/* UNIDAD */}

                    <td className="px-6 py-4 align-middle">
                      <span className="text-sm text-slate-600">
                        {item.unidad || "—"}
                      </span>
                    </td>

                    {/* CATEGORÍAS */}

                    <td className="px-6 py-4 align-middle">
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                        <Layers3
                          size={16}
                          className="text-slate-400"
                        />

                        {item.categorias?.length ?? 0}
                      </span>
                    </td>

                    {/* ACCIONES */}

                    <td className="px-6 py-4 align-middle">
                      {puedeGestionar ? (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              abrirEditar(item)
                            }
                            disabled={
                              operacionEnCurso ||
                              cargando
                            }
                            title="Editar característica"
                            aria-label={`Editar ${item.nombre}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-blue-700 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Pencil size={16} />
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

        {/* PIE */}

        {!cargando && filtradas.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
            <p className="text-xs text-slate-500">
              Cada característica define un atributo
              técnico que puede asociarse a una o
              varias categorías de activos.
            </p>
          </div>
        )}
      </section>

      {/* =============================================
          CAJA 3 - CONFIGURACIÓN POR CATEGORÍA
      ============================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* ENCABEZADO */}

        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Link2
                size={21}
                strokeWidth={1.8}
              />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Configuración por categoría
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Asociá características técnicas a
                las categorías y definí cuáles
                deben completarse obligatoriamente.
              </p>
            </div>
          </div>
        </div>

        {/* SELECCIÓN DE CATEGORÍA */}

        <div className="border-b border-slate-100 p-5 sm:p-6">
          <label
            htmlFor="categoria-caracteristicas"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Seleccionar categoría
          </label>

          <div className="relative max-w-md">
            <select
              id="categoria-caracteristicas"
              value={categoriaId}
              onChange={(event) => {
                setCategoriaId(event.target.value);
                setAsociadas([]);
                setCaracteristicaParaAsociar("");
                setNuevaObligatoria(false);
                setErrorAsociaciones("");
              }}
              disabled={
                cargando ||
                operacionEnCurso ||
                cargandoAsociadas
              }
              className={selectBase}
            >
              <option value="">
                Seleccioná una categoría
              </option>

              {categorias.map((categoria) => (
                <option
                  key={categoria.id}
                  value={categoria.id}
                >
                  {categoria.nombre}
                </option>
              ))}
            </select>

            <ChevronDown
              size={17}
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          <p className="mt-2 text-xs text-slate-400">
            Seleccioná una categoría para consultar
            sus características asociadas.
          </p>
        </div>

        {/* SIN CATEGORÍA SELECCIONADA */}

        {!categoriaId ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Layers3 size={30} />
            </div>

            <h3 className="mt-5 text-base font-bold text-slate-900">
              Seleccioná una categoría
            </h3>

            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              Elegí una categoría para consultar,
              agregar o administrar sus características
              técnicas.
            </p>
          </div>
        ) : (
          <div>

            {/* =============================================
                RESUMEN DE CATEGORÍA
            ============================================= */}

            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50/40 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                  Categoría seleccionada
                </p>

                <h3 className="mt-1 text-base font-bold text-slate-900">
                  {categoriaSeleccionada?.nombre ||
                    "Categoría"}
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
                  {asociadas.length} asociadas
                </span>

                <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                  {totalObligatorias} obligatorias
                </span>
              </div>
            </div>

            {/* =============================================
                ERROR DE ASOCIACIONES
            ============================================= */}

            {errorAsociaciones && (
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
                      No se pudieron cargar las asociaciones
                    </p>

                    <p className="mt-1 text-sm text-red-700">
                      {errorAsociaciones}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    cargarAsociadas(
                      categoriaId,
                      { mostrarError: true }
                    )
                  }
                  disabled={
                    cargandoAsociadas ||
                    operacionEnCurso
                  }
                  className={botonSecundario}
                >
                  <RefreshCw size={16} />
                  Reintentar
                </button>
              </div>
            )}

            {/* =============================================
                ASOCIAR CARACTERÍSTICA
            ============================================= */}

            {puedeGestionar &&
              !cargandoAsociadas &&
              !errorAsociaciones && (
                <div className="border-b border-slate-100 p-5 sm:p-6">
                  <form
                    onSubmit={asociar}
                    className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 sm:p-5"
                  >
                    <div className="mb-4 flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700">
                        <Plus size={19} />
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Agregar característica
                        </h3>

                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                          Seleccioná un atributo disponible
                          y definí si será obligatorio.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end">

                      {/* SELECT CARACTERÍSTICA */}

                      <div className="min-w-0 flex-1">
                        <label
                          htmlFor="caracteristica-asociar"
                          className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                          Característica disponible
                        </label>

                        <div className="relative">
                          <select
                            id="caracteristica-asociar"
                            value={caracteristicaParaAsociar}
                            onChange={(event) =>
                              setCaracteristicaParaAsociar(
                                event.target.value
                              )
                            }
                            disabled={
                              operacionEnCurso ||
                              disponiblesParaAsociar.length === 0
                            }
                            className={selectBase}
                          >
                            <option value="">
                              {disponiblesParaAsociar.length === 0
                                ? "No hay características disponibles"
                                : "Seleccioná una característica"}
                            </option>

                            {disponiblesParaAsociar.map(
                              (item) => (
                                <option
                                  key={item.id}
                                  value={item.id}
                                >
                                  {item.nombre} —{" "}
                                  {nombreTipo(item.tipo_dato)}
                                </option>
                              )
                            )}
                          </select>

                          <ChevronDown
                            size={17}
                            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                        </div>
                      </div>

                      {/* OBLIGATORIEDAD */}

                      <label className="flex min-h-11 items-center gap-3 rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={nuevaObligatoria}
                          onChange={(event) =>
                            setNuevaObligatoria(
                              event.target.checked
                            )
                          }
                          disabled={operacionEnCurso}
                          className="h-4 w-4 accent-blue-700"
                        />

                        Obligatoria
                      </label>

                      {/* BOTÓN ASOCIAR */}

                      <button
                        type="submit"
                        disabled={
                          !caracteristicaParaAsociar ||
                          operacionEnCurso
                        }
                        className={botonPrincipal}
                      >
                        {procesandoAsociacion ? (
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                        ) : (
                          <Plus size={17} />
                        )}

                        {procesandoAsociacion
                          ? "Asociando..."
                          : "Asociar"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

            {/* =============================================
                LISTADO DE ASOCIADAS
            ============================================= */}

            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <ClipboardList size={18} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Características asociadas
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Atributos configurados para
                    esta categoría.
                  </p>
                </div>
              </div>
            </div>

            {cargandoAsociadas ? (
              <div className="flex min-h-56 flex-col items-center justify-center gap-3">
                <Loader2
                  size={26}
                  className="animate-spin text-blue-700"
                />

                <p className="text-sm text-slate-500">
                  Cargando asociaciones...
                </p>
              </div>
            ) : errorAsociaciones ? (
              <div className="flex min-h-56 flex-col items-center justify-center px-5 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                  <AlertCircle size={25} />
                </div>

                <h4 className="mt-4 text-sm font-bold text-slate-900">
                  No se pudieron consultar las características
                </h4>

                <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                  Intentá nuevamente para consultar las
                  asociaciones de esta categoría.
                </p>
              </div>
            ) : asociadas.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center px-5 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Link2 size={25} />
                </div>

                <h4 className="mt-4 text-sm font-bold text-slate-900">
                  Sin características asociadas
                </h4>

                <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                  Esta categoría todavía no tiene
                  características técnicas asociadas.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="border-b border-slate-200 bg-slate-50/80">
                    <tr className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                      <th className="px-6 py-4">
                        Característica
                      </th>

                      <th className="px-6 py-4">
                        Tipo
                      </th>

                      <th className="px-6 py-4">
                        Obligatoriedad
                      </th>

                      <th className="px-6 py-4 text-right">
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {asociadas.map((item) => {
                      const obligatoria =
                        esObligatoria(item);

                      const procesando =
                        operacionId === item.id;

                      return (
                        <tr
                          key={item.id}
                          className="transition-colors hover:bg-slate-50/80"
                        >

                          {/* CARACTERÍSTICA */}

                          <td className="px-6 py-4 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                <Settings2 size={18} />
                              </div>

                              <div>
                                <p className="font-semibold text-slate-900">
                                  {item.nombre}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  ID #{item.id}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* TIPO */}

                          <td className="px-6 py-4 align-middle">
                            <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                              {nombreTipo(item.tipo_dato)}
                            </span>
                          </td>

                          {/* OBLIGATORIEDAD */}

                          <td className="px-6 py-4 align-middle">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                                obligatoria
                                  ? "border border-amber-100 bg-amber-50 text-amber-700"
                                  : "border border-slate-200 bg-slate-100 text-slate-600"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  obligatoria
                                    ? "bg-amber-500"
                                    : "bg-slate-400"
                                }`}
                              />

                              {obligatoria
                                ? "Obligatoria"
                                : "Opcional"}
                            </span>
                          </td>

                          {/* ACCIONES */}

                          <td className="px-6 py-4 align-middle">
                            {puedeGestionar ? (
                              <div className="flex items-center justify-end gap-2">

                                {/* CAMBIAR OBLIGATORIEDAD */}

                                <button
                                  type="button"
                                  onClick={() =>
                                    cambiarObligatoriedad(item)
                                  }
                                  disabled={
                                    operacionEnCurso ||
                                    cargandoAsociadas
                                  }
                                  title={
                                    obligatoria
                                      ? "Hacer opcional"
                                      : "Hacer obligatoria"
                                  }
                                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {procesando ? (
                                    <Loader2
                                      size={15}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <ShieldCheck size={15} />
                                  )}

                                  {procesando
                                    ? "Procesando..."
                                    : obligatoria
                                    ? "Hacer opcional"
                                    : "Hacer obligatoria"}
                                </button>

                                {/* DESVINCULAR */}

                                <button
                                  type="button"
                                  onClick={() =>
                                    solicitarDesvinculacion(item)
                                  }
                                  disabled={
                                    operacionEnCurso ||
                                    cargandoAsociadas
                                  }
                                  title="Desvincular característica"
                                  aria-label={`Desvincular ${item.nombre}`}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Trash2 size={16} />
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

            {/* PIE */}

            {!cargandoAsociadas &&
              !errorAsociaciones &&
              asociadas.length > 0 && (
                <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                  <p className="text-xs text-slate-500">
                    Las características obligatorias
                    deberán completarse al registrar
                    activos de esta categoría.
                  </p>
                </div>
              )}
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
            if (
              event.target === event.currentTarget
            ) {
              cerrarModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-caracteristica"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
          >

            {/* ENCABEZADO */}

            <div className="border-b border-slate-100 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    {editando ? (
                      <Pencil size={21} />
                    ) : (
                      <Plus size={22} />
                    )}
                  </div>

                  <div>
                    <h2
                      id="titulo-modal-caracteristica"
                      className="text-xl font-bold tracking-tight text-slate-900"
                    >
                      {editando
                        ? "Editar característica"
                        : "Nueva característica"}
                    </h2>

                    <p className="mt-1 text-sm leading-relaxed text-slate-500">
                      {editando
                        ? "Modificá el nombre o la unidad de medida."
                        : "Definí un nuevo atributo técnico para los activos."}
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

            <form onSubmit={guardar} noValidate>
              <div className="space-y-5 p-6">

                {/* NOMBRE */}

                <div>
                  <label
                    htmlFor="caracteristica-nombre"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Nombre de la característica

                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="caracteristica-nombre"
                    name="nombre"
                    type="text"
                    value={formulario.nombre}
                    onChange={cambiarCampo}
                    maxLength={100}
                    autoFocus
                    disabled={guardando}
                    placeholder="Ej.: Memoria RAM"
                    aria-invalid={Boolean(
                      erroresCampos.nombre
                    )}
                    className={`${campoBase} ${
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

                {/* TIPO DE DATO */}

                <div>
                  <label
                    htmlFor="caracteristica-tipo"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Tipo de dato

                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <select
                      id="caracteristica-tipo"
                      name="tipo_dato"
                      value={formulario.tipo_dato}
                      onChange={cambiarCampo}
                      disabled={
                        Boolean(editando) ||
                        guardando
                      }
                      className={`${selectBase} ${
                        erroresCampos.tipo_dato
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : ""
                      }`}
                    >
                      {TIPOS.map((tipo) => (
                        <option
                          key={tipo.value}
                          value={tipo.value}
                        >
                          {tipo.label}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={17}
                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>

                  {editando && (
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                      El tipo de dato no puede
                      modificarse después de crear
                      la característica.
                    </p>
                  )}

                  {erroresCampos.tipo_dato && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {erroresCampos.tipo_dato}
                    </p>
                  )}
                </div>

                {/* UNIDAD */}

                <div>
                  <label
                    htmlFor="caracteristica-unidad"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Unidad de medida

                    <span className="ml-2 text-xs font-normal text-slate-400">
                      Opcional
                    </span>
                  </label>

                  <input
                    id="caracteristica-unidad"
                    name="unidad"
                    type="text"
                    value={formulario.unidad}
                    onChange={cambiarCampo}
                    maxLength={50}
                    disabled={guardando}
                    placeholder="Ej.: GB, MHz, pulgadas"
                    aria-invalid={Boolean(
                      erroresCampos.unidad
                    )}
                    className={`${campoBase} ${
                      erroresCampos.unidad
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : ""
                    }`}
                  />

                  <div className="mt-1.5 flex items-center justify-between gap-3">
                    <div>
                      {erroresCampos.unidad && (
                        <p className="text-xs font-medium text-red-600">
                          {erroresCampos.unidad}
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-slate-400">
                      {formulario.unidad.length}/50
                    </p>
                  </div>
                </div>

                {/* INFORMACIÓN SOBRE SELECT */}

                {!editando &&
                  formulario.tipo_dato === "select" && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2
                          size={18}
                          className="mt-0.5 shrink-0 text-blue-700"
                        />

                        <p className="text-xs leading-relaxed text-blue-800">
                          Después de crear esta
                          característica, podrás
                          configurar sus valores
                          disponibles desde el módulo
                          de{" "}
                          <span className="font-semibold">
                            Opciones de características
                          </span>
                          .
                        </p>
                      </div>
                    </div>
                  )}
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
                    : editando
                    ? "Guardar cambios"
                    : "Crear característica"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
