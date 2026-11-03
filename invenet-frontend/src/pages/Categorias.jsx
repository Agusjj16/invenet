
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
  Layers3,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  X,
  Layers,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../context/FeedbackContext";

import {
  obtenerTodasCategorias,
  crearCategoria,
  actualizarCategoria,
  desactivarCategoria,
  reactivarCategoria,
} from "../services/categoriaService";

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
  const errores =
    error?.response?.data?.errors ?? {};

  return Object.fromEntries(
    Object.entries(errores).map(
      ([campo, mensajes]) => [
        campo,
        Array.isArray(mensajes)
          ? mensajes[0]
          : String(mensajes),
      ]
    )
  );
}

function categoriaEstaActiva(categoria) {
  return (
    categoria.activo === true ||
    categoria.activo === 1 ||
    categoria.activo === "1"
  );
}

// =====================================================
// PÁGINA PRINCIPAL
// =====================================================

export default function Categorias() {
  const { user } = useAuth();

  // =====================================================
  // FEEDBACK GLOBAL
  // =====================================================

  const { toast, confirmar } = useFeedback();

  // =====================================================
  // PERMISOS
  // =====================================================

  const permisos =
    user?.rol?.permisos ??
    user?.permisos ??
    [];

  const puedeGestionar = permisos.some(
    (permiso) =>
      typeof permiso === "string"
        ? permiso === "catalogos.gestionar"
        : permiso?.nombre === "catalogos.gestionar"
  );

  // =====================================================
  // ESTADOS
  // =====================================================

  const [categorias, setCategorias] = useState([]);

  const [busqueda, setBusqueda] = useState("");

  const [filtroEstado, setFiltroEstado] =
    useState("todas");

  const [cargando, setCargando] = useState(true);

  const [guardando, setGuardando] = useState(false);

  const [procesandoId, setProcesandoId] =
    useState(null);

  const [modalAbierto, setModalAbierto] =
    useState(false);

  const [
    categoriaEditando,
    setCategoriaEditando,
  ] = useState(null);

  const [formulario, setFormulario] =
    useState(formularioInicial);

  const [erroresCampos, setErroresCampos] =
    useState({});

  // Error persistente exclusivo de la carga del listado.
  const [errorCarga, setErrorCarga] = useState("");

  // =====================================================
  // REFERENCIAS DE CONTROL
  // =====================================================

  // Evita envíos duplicados antes de que React actualice
  // el estado "guardando".
  const guardandoRef = useRef(false);

  // Evita ejecutar dos cambios de estado simultáneos.
  const procesandoRef = useRef(false);

  // Evita que una respuesta antigua sobrescriba
  // una carga más reciente.
  const solicitudCargaRef = useRef(0);

  // Permite invalidar solicitudes cuando se desmonta
  // la pantalla.
  const montadoRef = useRef(false);

  // =====================================================
  // CARGAR CATEGORÍAS
  // =====================================================

  const cargarCategorias = useCallback(
    async ({ mostrarError = true } = {}) => {
      const solicitud = ++solicitudCargaRef.current;

      setCargando(true);
      setErrorCarga("");

      try {
        const respuesta =
          await obtenerTodasCategorias();

        if (
          !montadoRef.current ||
          solicitud !== solicitudCargaRef.current
        ) {
          return false;
        }

        if (!Array.isArray(respuesta)) {
          throw new Error(
            "El servidor devolvió un formato de categorías incorrecto."
          );
        }

        setCategorias(respuesta);
        return true;
      } catch (err) {
        if (
          !montadoRef.current ||
          solicitud !== solicitudCargaRef.current
        ) {
          return false;
        }

        console.error(
          "Error al cargar categorías:",
          err
        );

        const mensaje = mensajeError(
          err,
          "No se pudieron cargar las categorías."
        );

        setErrorCarga(mensaje);

        if (mostrarError) {
          toast.error(mensaje);
        }

        return false;
      } finally {
        if (
          montadoRef.current &&
          solicitud === solicitudCargaRef.current
        ) {
          setCargando(false);
        }
      }
    },
    [toast]
  );

  // =====================================================
  // CARGA INICIAL
  // =====================================================

  useEffect(() => {
    montadoRef.current = true;

    cargarCategorias({
      mostrarError: false,
    });

    return () => {
      montadoRef.current = false;
      solicitudCargaRef.current += 1;
    };
  }, [cargarCategorias]);

  // =====================================================
  // FILTRADO Y CONTADORES
  // =====================================================

  const categoriasFiltradas = useMemo(() => {
    const termino =
      busqueda.trim().toLocaleLowerCase("es-AR");

    return categorias.filter((categoria) => {
      const coincideBusqueda =
        !termino ||
        [
          categoria.nombre,
          categoria.descripcion,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("es-AR")
          .includes(termino);

      const activa =
        categoriaEstaActiva(categoria);

      const coincideEstado =
        filtroEstado === "todas" ||
        (filtroEstado === "activas" && activa) ||
        (filtroEstado === "inactivas" && !activa);

      return (
        coincideBusqueda &&
        coincideEstado
      );
    });
  }, [
    categorias,
    busqueda,
    filtroEstado,
  ]);

  const totalCategorias = categorias.length;

  const totalActivas = categorias.filter(
    categoriaEstaActiva
  ).length;

  const totalInactivas =
    totalCategorias - totalActivas;

  const hayFiltros =
    busqueda.trim() !== "" ||
    filtroEstado !== "todas";

  const operacionEnCurso =
    guardando ||
    procesandoId !== null;

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

    setCategoriaEditando(null);

    setFormulario({
      ...formularioInicial,
    });

    setErroresCampos({});
    setModalAbierto(true);
  };

  const abrirEditar = (categoria) => {
    if (
      !puedeGestionar ||
      operacionEnCurso ||
      guardandoRef.current ||
      procesandoRef.current
    ) {
      return;
    }

    setCategoriaEditando(categoria);

    setFormulario({
      nombre: categoria.nombre ?? "",
      descripcion: categoria.descripcion ?? "",
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
    setCategoriaEditando(null);

    setFormulario({
      ...formularioInicial,
    });

    setErroresCampos({});
  };

  // =====================================================
  // FORMULARIO
  // =====================================================

  const manejarCambio = (event) => {
    const { name, value } = event.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));

    setErroresCampos((anterior) => ({
      ...anterior,
      [name]: "",
    }));
  };

  const validarFormulario = () => {
    const errores = {};

    if (!formulario.nombre.trim()) {
      errores.nombre =
        "Ingresá el nombre de la categoría.";
    } else if (
      formulario.nombre.trim().length > 100
    ) {
      errores.nombre =
        "El nombre no puede superar los 100 caracteres.";
    }

    if (
      formulario.descripcion.length > 255
    ) {
      errores.descripcion =
        "La descripción no puede superar los 255 caracteres.";
    }

    setErroresCampos(errores);

    return Object.keys(errores).length === 0;
  };

  // =====================================================
  // GUARDAR CATEGORÍA
  // =====================================================

  const guardarCategoria = async (event) => {
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

    const esEdicion = Boolean(categoriaEditando);

    const datos = {
      nombre: formulario.nombre.trim(),
      descripcion:
        formulario.descripcion.trim() || null,
    };

    try {
      const respuesta = esEdicion
        ? await actualizarCategoria(
            categoriaEditando.id,
            datos
          )
        : await crearCategoria(datos);

      // La operación se completó correctamente.
      setModalAbierto(false);
      setCategoriaEditando(null);

      setFormulario({
        ...formularioInicial,
      });

      setErroresCampos({});

      toast.success(
        respuesta?.message ||
          (esEdicion
            ? "Categoría actualizada correctamente."
            : "Categoría creada correctamente.")
      );

      // La recarga se maneja de forma independiente.
      // Si falla, no se informa que falló el guardado.
      await cargarCategorias({
        mostrarError: true,
      });
    } catch (err) {
      console.error(
        "Error al guardar categoría:",
        err
      );

      const errores = erroresValidacion(err);
      const esValidacion =
        err.response?.status === 422;

      if (esValidacion) {
        setErroresCampos(errores);

        toast.warning(
          "Revisá los datos ingresados. Hay campos que requieren corrección."
        );
      } else {
        toast.error(
          mensajeError(
            err,
            esEdicion
              ? "No se pudo actualizar la categoría."
              : "No se pudo crear la categoría."
          )
        );
      }

      // Se mantiene abierto el formulario y se
      // conservan los valores ingresados.
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  };

  // =====================================================
  // DESACTIVAR / REACTIVAR
  // =====================================================

  const solicitarCambioEstado = async (
    categoria,
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

    const aceptado = await confirmar({
      titulo: esDesactivacion
        ? "Desactivar categoría"
        : "Reactivar categoría",

      mensaje: esDesactivacion
        ? `¿Querés desactivar la categoría "${categoria.nombre}"? Solo podrá desactivarse si no tiene activos asociados. Podrás reactivarla posteriormente.`
        : `¿Querés reactivar la categoría "${categoria.nombre}"? Volverá a estar disponible para su utilización en el sistema.`,

      textoConfirmar: esDesactivacion
        ? "Confirmar desactivación"
        : "Confirmar reactivación",

      textoCancelar: "Cancelar",

      variante: esDesactivacion
        ? "danger"
        : "success",
    });

    if (!aceptado) return;

    // Evita que dos confirmaciones ejecuten
    // simultáneamente cambios sobre categorías.
    if (
      guardandoRef.current ||
      procesandoRef.current
    ) {
      return;
    }

    procesandoRef.current = true;
    setProcesandoId(categoria.id);

    try {
      const respuesta = esDesactivacion
        ? await desactivarCategoria(categoria.id)
        : await reactivarCategoria(categoria.id);

      // Actualización inmediata del registro.
      setCategorias((anteriores) =>
        anteriores.map((item) =>
          item.id === categoria.id
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
            ? "Categoría desactivada correctamente."
            : "Categoría reactivada correctamente.")
      );

      // Sin Toast de éxito por la recarga.
      await cargarCategorias({
        mostrarError: true,
      });
    } catch (err) {
      console.error(
        "Error al cambiar estado de categoría:",
        err
      );

      toast.error(
        mensajeError(
          err,
          esDesactivacion
            ? "No se pudo desactivar la categoría."
            : "No se pudo reactivar la categoría."
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
              <Layers3
                size={27}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                Administración de catálogos
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Categorías de activos
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                Gestioná la clasificación de los
                activos tecnológicos registrados
                en Invenet.
              </p>
            </div>
          </div>

          {/* ACCIONES */}

          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">

            <button
              type="button"
              onClick={() =>
                cargarCategorias({
                  mostrarError: true,
                })
              }
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
                Nueva categoría
              </button>
            )}
          </div>
        </div>
      </header>

      {/* =============================================
          ERROR DE CARGA
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
            onClick={() =>
              cargarCategorias({
                mostrarError: true,
              })
            }
            disabled={cargando || operacionEnCurso}
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

        {/* ENCABEZADO */}

        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">

            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Layers3
                  size={21}
                  strokeWidth={1.8}
                />
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  Listado de categorías
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Consultá y administrá las categorías
                  registradas en el sistema.
                </p>
              </div>
            </div>

            {/* CONTADORES */}

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
                {totalCategorias} total
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
                aria-label="Buscar categorías"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* FILTRO SELECT */}

            <div className="relative w-full sm:w-52">
              <select
                id="filtro-estado-categorias"
                value={filtroEstado}
                onChange={(event) =>
                  setFiltroEstado(event.target.value)
                }
                aria-label="Filtrar categorías por estado"
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
              {categoriasFiltradas.length}
            </span>{" "}
            de{" "}
            <span className="font-bold text-slate-700">
              {totalCategorias}
            </span>{" "}
            categorías
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
              Cargando categorías...
            </p>
          </div>
        ) : errorCarga && categorias.length === 0 ? (
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
        ) : categoriasFiltradas.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-5 py-12 text-center">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Layers3 size={30} />
            </div>

            <h3 className="mt-5 text-base font-bold text-slate-900">
              {hayFiltros
                ? "No se encontraron categorías"
                : "Todavía no hay categorías registradas"}
            </h3>

            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              {hayFiltros
                ? "No hay categorías que coincidan con los filtros seleccionados."
                : "Las categorías que registres en el sistema aparecerán acá."}
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
                    Categoría
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
                {categoriasFiltradas.map((categoria) => {
                  const activa =
                    categoriaEstaActiva(categoria);

                  const procesando =
                    procesandoId === categoria.id;

                  return (
                    <tr
                      key={categoria.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >

                      {/* CATEGORÍA */}

                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                            <Layers3 size={18} />
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">
                              {categoria.nombre}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              ID #{categoria.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* DESCRIPCIÓN */}

                      <td className="max-w-md px-6 py-4 align-middle">
                        <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
                          {categoria.descripcion ||
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
                                abrirEditar(categoria)
                              }
                              disabled={
                                operacionEnCurso ||
                                cargando
                              }
                              title="Editar categoría"
                              aria-label={`Editar ${categoria.nombre}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-blue-700 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Pencil size={16} />
                            </button>

                            {/* DESACTIVAR / REACTIVAR */}

                            <button
                              type="button"
                              onClick={() =>
                                solicitarCambioEstado(
                                  categoria,
                                  activa
                                    ? "desactivar"
                                    : "reactivar"
                                )
                              }
                              disabled={
                                operacionEnCurso ||
                                cargando
                              }
                              title={
                                activa
                                  ? "Desactivar categoría"
                                  : "Reactivar categoría"
                              }
                              aria-label={`${
                                activa
                                  ? "Desactivar"
                                  : "Reactivar"
                              } ${categoria.nombre}`}
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
          categoriasFiltradas.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
              <p className="text-xs text-slate-500">
                Las categorías permiten organizar
                los activos tecnológicos y definir
                sus características asociadas.
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
            aria-labelledby="modal-categoria-titulo"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
          >

            {/* ENCABEZADO */}

            <div className="border-b border-slate-100 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    {categoriaEditando ? (
                      <Pencil size={21} />
                    ) : (
                      <Plus size={22} />
                    )}
                  </div>

                  <div>
                    <h2
                      id="modal-categoria-titulo"
                      className="text-xl font-bold tracking-tight text-slate-900"
                    >
                      {categoriaEditando
                        ? "Editar categoría"
                        : "Nueva categoría"}
                    </h2>

                    <p className="mt-1 text-sm leading-relaxed text-slate-500">
                      {categoriaEditando
                        ? "Modificá la información de la categoría seleccionada."
                        : "Registrá una nueva categoría para clasificar los activos."}
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
              onSubmit={guardarCategoria}
              noValidate
            >
              <div className="space-y-5 p-6">

                {/* NOMBRE */}

                <div>
                  <label
                    htmlFor="nombre-categoria"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Nombre de la categoría
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="nombre-categoria"
                    name="nombre"
                    type="text"
                    value={formulario.nombre}
                    onChange={manejarCambio}
                    maxLength={100}
                    autoFocus
                    disabled={guardando}
                    placeholder="Ej.: Proyectores"
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
                    htmlFor="descripcion-categoria"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Descripción

                    <span className="ml-2 text-xs font-normal text-slate-400">
                      Opcional
                    </span>
                  </label>

                  <textarea
                    id="descripcion-categoria"
                    name="descripcion"
                    value={formulario.descripcion}
                    onChange={manejarCambio}
                    maxLength={255}
                    rows={4}
                    disabled={guardando}
                    placeholder="Describí brevemente la categoría..."
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
                    : categoriaEditando
                    ? "Guardar cambios"
                    : "Crear categoría"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
