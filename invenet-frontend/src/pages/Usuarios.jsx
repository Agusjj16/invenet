
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Eye,
  Pencil,
  GraduationCap,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Filter,
  UserRound,
  UserRoundX,
  Trash,
  Users as UsersIcon,
  Wrench,
  X,
} from "lucide-react";

import {
  obtenerUsuarios,
  desactivarUsuario,
} from "../services/usuarioService";

import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../context/FeedbackContext";

// =====================================================
// ESTILOS COMPARTIDOS
// =====================================================

const botonSecundario =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const botonPrincipal =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50";

const campoFiltro =
  "w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function nombreCompleto(usuario) {
  return (
    [usuario?.nombre, usuario?.apellido]
      .filter(Boolean)
      .join(" ") || "Sin nombre"
  );
}

function inicialesUsuario(usuario) {
  const nombre =
    usuario?.nombre?.trim()?.[0] ?? "";

  const apellido =
    usuario?.apellido?.trim()?.[0] ?? "";

  return (
    `${nombre}${apellido}`.toUpperCase() || "U"
  );
}

function configuracionRol(nombre) {
  switch (nombre) {
    case "Administrador":
      return {
        icono: ShieldCheck,
        clases:
          "border-violet-200 bg-violet-50 text-violet-700",
      };

    case "Docente":
      return {
        icono: GraduationCap,
        clases:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
      };

    case "Técnico":
      return {
        icono: Wrench,
        clases:
          "border-blue-200 bg-blue-50 text-blue-700",
      };

    default:
      return {
        icono: UserRound,
        clases:
          "border-slate-200 bg-slate-50 text-slate-600",
      };
  }
}

function obtenerMensajeError(error, alternativo) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    alternativo
  );
}

function extraerUsuarios(respuesta) {
  if (Array.isArray(respuesta)) {
    return respuesta;
  }

  if (Array.isArray(respuesta?.data)) {
    return respuesta.data;
  }

  throw new Error(
    "El servidor devolvió un formato de usuarios no válido."
  );
}

// =====================================================
// COMPONENTE: BADGE DE ROL
// =====================================================

function RolBadge({ nombre }) {
  const configuracion = configuracionRol(nombre);
  const Icono = configuracion.icono;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${configuracion.clases}`}
    >
      <Icono size={13} strokeWidth={2} />

      {nombre || "Sin rol"}
    </span>
  );
}

// =====================================================
// COMPONENTE: BADGE DE ESTADO
// =====================================================

function EstadoUsuarioBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">
      <CheckCircle2 size={13} />
      Activo
    </span>
  );
}

// =====================================================
// COMPONENTE: ESTADO VACÍO
// =====================================================

function EstadoVacio({
  hayUsuarios,
  hayFiltros,
  onLimpiar,
  onActualizar,
  deshabilitado = false,
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <UsersIcon
          size={29}
          strokeWidth={1.6}
        />
      </div>

      <h3 className="mt-5 text-base font-bold text-slate-900">
        {hayUsuarios
          ? "No se encontraron usuarios"
          : "No hay usuarios para mostrar"}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
        {hayUsuarios
          ? "No encontramos usuarios que coincidan con los filtros seleccionados."
          : "Actualmente no hay cuentas activas disponibles para mostrar."}
      </p>

      {hayFiltros ? (
        <button
          type="button"
          onClick={onLimpiar}
          disabled={deshabilitado}
          className={`mt-5 ${botonSecundario}`}
        >
          <X size={16} />
          Limpiar filtros
        </button>
      ) : (
        <button
          type="button"
          onClick={onActualizar}
          disabled={deshabilitado}
          className={`mt-5 ${botonSecundario}`}
        >
          <RefreshCw size={16} />
          Actualizar listado
        </button>
      )}
    </div>
  );
}

// =====================================================
// PÁGINA PRINCIPAL
// =====================================================

export default function Usuarios() {
  const location = useLocation();
  const navigate = useNavigate();

  const { user } = useAuth();
  const { toast, confirmar } = useFeedback();

  // =====================================================
  // REFERENCIAS DE CONTROL
  // =====================================================

  const montadoRef = useRef(false);

  const solicitudRef = useRef(0);

  const bajaEnCursoRef = useRef(false);

  const toastRef = useRef(toast);
  toastRef.current = toast;

  const confirmarRef = useRef(confirmar);
  confirmarRef.current = confirmar;

  const mensajeNavegacionRef = useRef(null);

  // =====================================================
  // ESTADOS
  // =====================================================

  const [usuarios, setUsuarios] = useState([]);

  const [cargando, setCargando] = useState(true);

  const [actualizando, setActualizando] =
    useState(false);

  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");

  const [filtroRol, setFiltroRol] =
    useState("todos");

  const [procesandoBaja, setProcesandoBaja] =
    useState(false);

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

  const puedeCrear =
    tienePermiso("usuarios.crear");

  const puedeEditar =
  tienePermiso("usuarios.editar");

  const puedeDesactivar =
    tienePermiso("usuarios.desactivar");

  // =====================================================
  // MENSAJES RECIBIDOS POR NAVEGACIÓN
  // =====================================================

  useEffect(() => {
    const mensaje = location.state?.mensaje;

    if (!mensaje) {
      mensajeNavegacionRef.current = null;
      return;
    }

    // Evita procesar repetidamente el mismo estado
    // mientras React actualiza la navegación.
    if (
      mensajeNavegacionRef.current ===
      location.state
    ) {
      return;
    }

    mensajeNavegacionRef.current =
      location.state;

    toastRef.current.success(mensaje);

    navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }, [
    location.pathname,
    location.state,
    navigate,
  ]);

  // =====================================================
  // CARGAR USUARIOS
  // =====================================================

  const cargarUsuarios = useCallback(
    async (esActualizacion = false) => {
      const numeroSolicitud =
        ++solicitudRef.current;

      if (montadoRef.current) {
        if (esActualizacion) {
          setActualizando(true);
        } else {
          setCargando(true);
        }

        setError("");
      }

      try {
        const respuesta =
          await obtenerUsuarios();

        const registros =
          extraerUsuarios(respuesta);

        const usuariosValidos =
          registros.filter(
            (usuario) =>
              usuario !== null &&
              typeof usuario === "object" &&
              !Array.isArray(usuario)
          );

        if (
          !montadoRef.current ||
          numeroSolicitud !==
            solicitudRef.current
        ) {
          return false;
        }

        setUsuarios(usuariosValidos);
        setError("");

        return true;
      } catch (err) {
        console.error(
          "Error al cargar los usuarios:",
          err
        );

        if (
          !montadoRef.current ||
          numeroSolicitud !==
            solicitudRef.current
        ) {
          return false;
        }

        setError(
          obtenerMensajeError(
            err,
            "No se pudieron cargar los usuarios."
          )
        );

        if (!esActualizacion) {
          setUsuarios([]);
        }

        return false;
      } finally {
        if (
          montadoRef.current &&
          numeroSolicitud ===
            solicitudRef.current
        ) {
          setCargando(false);
          setActualizando(false);
        }
      }
    },
    []
  );

  // =====================================================
  // CARGA INICIAL
  // =====================================================

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  // =====================================================
  // BÚSQUEDA Y FILTROS
  // =====================================================

  const usuariosFiltrados = useMemo(() => {
    const termino = busqueda
      .trim()
      .toLocaleLowerCase("es");

    return usuarios.filter((usuario) => {
      const coincideRol =
        filtroRol === "todos" ||
        usuario.rol?.nombre === filtroRol;

      const contenido = [
        usuario.id,
        usuario.nombre,
        usuario.apellido,
        nombreCompleto(usuario),
        usuario.email,
        usuario.rol?.nombre,
      ]
        .filter((valor) => valor != null)
        .join(" ")
        .toLocaleLowerCase("es");

      const coincideBusqueda =
        !termino ||
        contenido.includes(termino);

      return (
        coincideRol &&
        coincideBusqueda
      );
    });
  }, [usuarios, busqueda, filtroRol]);

  const hayFiltros =
    busqueda.trim() !== "" ||
    filtroRol !== "todos";

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroRol("todos");
  };

  // =====================================================
  // ACTUALIZACIÓN MANUAL
  // =====================================================

  const manejarActualizar = () => {
    if (
      cargando ||
      actualizando ||
      bajaEnCursoRef.current
    ) {
      return;
    }

    cargarUsuarios(true);
  };

  // =====================================================
  // DESACTIVAR USUARIO
  // =====================================================

  const solicitarBaja = async (usuario) => {
    // ===============================================
    // VALIDACIONES PREVIAS
    // ===============================================

    if (
      !puedeDesactivar ||
      !usuario ||
      usuario.id == null ||
      bajaEnCursoRef.current
    ) {
      return;
    }

    if (
      user?.id != null &&
      String(user.id) === String(usuario.id)
    ) {
      toastRef.current.warning(
        "No podés desactivar tu propia cuenta."
      );

      return;
    }

    const usuarioId = usuario.id;
    const nombre = nombreCompleto(usuario);

    // ===============================================
    // BLOQUEAR CONFIRMACIONES DUPLICADAS
    // ===============================================

    bajaEnCursoRef.current = true;
    setProcesandoBaja(true);

    let aceptado = false;

    try {
      aceptado = await confirmarRef.current({
        titulo: "Dar de baja al usuario",

        mensaje:
          `¿Confirmás que querés desactivar la cuenta de ${nombre}? ` +
          "El usuario dejará de aparecer en el listado de cuentas activas. " +
          "Su información se conservará para su administración posterior.",

        textoConfirmar: "Confirmar baja",

        textoCancelar: "Cancelar",

        variante: "danger",
      });
    } catch (err) {
      console.error(
        "Error al solicitar confirmación de baja:",
        err
      );

      if (montadoRef.current) {
        toastRef.current.error(
          "No se pudo mostrar la confirmación."
        );
      }

      return;
    } finally {
      if (!aceptado) {
        bajaEnCursoRef.current = false;

        if (montadoRef.current) {
          setProcesandoBaja(false);
        }
      }
    }

    if (!aceptado || !montadoRef.current) {
      bajaEnCursoRef.current = false;
      return;
    }

    // ===============================================
    // EJECUTAR DESACTIVACIÓN
    // ===============================================

    let desactivacionExitosa = false;

    try {
      await desactivarUsuario(usuarioId);

      desactivacionExitosa = true;

      if (!montadoRef.current) {
        return;
      }

      // La operación ya fue confirmada por Laravel.
      // Actualizamos la interfaz inmediatamente.
      setUsuarios((anteriores) =>
        anteriores.filter(
          (actual) =>
            String(actual.id) !==
            String(usuarioId)
        )
      );

      toastRef.current.success(
        `El usuario ${nombre} fue desactivado correctamente.`
      );
    } catch (err) {
      console.error(
        "Error al desactivar usuario:",
        err
      );

      if (!montadoRef.current) {
        return;
      }

      const mensaje =
        obtenerMensajeError(
          err,
          "No se pudo desactivar el usuario. Intentá nuevamente."
        );

      if (
        err?.response?.status === 422 ||
        err?.response?.status === 409
      ) {
        toastRef.current.warning(mensaje);
      } else if (
        err?.response?.status === 403
      ) {
        toastRef.current.error(
          "No tenés permisos para desactivar usuarios."
        );
      } else {
        toastRef.current.error(mensaje);
      }
    } finally {
      if (!desactivacionExitosa) {
        bajaEnCursoRef.current = false;

        if (montadoRef.current) {
          setProcesandoBaja(false);
        }
      }
    }

    if (!desactivacionExitosa) {
      return;
    }

    // ===============================================
    // SINCRONIZACIÓN POSTERIOR
    // ===============================================

    try {
      const actualizado =
        await cargarUsuarios(true);

      if (
        !actualizado &&
        montadoRef.current
      ) {
        toastRef.current.warning(
          "La cuenta fue desactivada, pero no se pudo actualizar el listado desde el servidor. Podés reintentar con el botón Actualizar."
        );
      }
    } finally {
      bajaEnCursoRef.current = false;

      if (montadoRef.current) {
        setProcesandoBaja(false);
      }
    }
  };

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
              <UsersIcon
                size={27}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                Administración institucional
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Gestión de usuarios
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                Administrá las cuentas de acceso a Invenet,
                consultá sus roles y gestioná los usuarios
                de la institución.
              </p>
            </div>
          </div>

          {/* BOTONES */}

          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
            <button
              type="button"
              onClick={manejarActualizar}
              disabled={
                cargando ||
                actualizando ||
                procesandoBaja
              }
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

            <Link
              to="/usuarios/desactivados"
              className={botonSecundario}
            >
              <UserRoundX size={17} />
              Desactivados
            </Link>

            {puedeCrear && (
              <Link
                to="/usuarios/nuevo"
                className={botonPrincipal}
              >
                <Plus size={18} />
                Nuevo usuario
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* =============================================
          CAJA 2 - LISTADO DE USUARIOS
      ============================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* ENCABEZADO Y FILTROS */}

        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">

            {/* TÍTULO */}

            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <UsersIcon
                  size={21}
                  strokeWidth={1.8}
                />
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  Lista de usuarios registrados
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Consultá los usuarios activos y sus roles.
                </p>
              </div>
            </div>

            {/* TOTAL Y FILTROS */}

            <div className="flex flex-wrap items-center gap-3 xl:justify-end">

              {/* BUSCADOR */}

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
                  placeholder="Buscar usuario o correo..."
                  aria-label="Buscar usuarios"
                  className={`${campoFiltro} pl-10 pr-9`}
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

              {/* FILTRO DE ROL */}

              <div className="relative w-full sm:w-48">
                <Filter
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={filtroRol}
                  onChange={(event) =>
                    setFiltroRol(event.target.value)
                  }
                  aria-label="Filtrar usuarios por rol"
                  className={`${campoFiltro} appearance-none pl-10 pr-9 font-medium`}
                >
                  <option value="todos">
                    Todos los roles
                  </option>

                  <option value="Administrador">
                    Administradores
                  </option>

                  <option value="Docente">
                    Docentes
                  </option>

                  <option value="Técnico">
                    Técnicos
                  </option>
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              {/* LIMPIAR FILTROS */}

              {hayFiltros && (
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  title="Limpiar filtros"
                  aria-label="Limpiar filtros"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <X size={18} />
                </button>
              )}

              <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
                {usuarios.length.toLocaleString("es-AR")}{" "}
                {usuarios.length === 1
                  ? "usuario"
                  : "usuarios"}
              </span>
            </div>
          </div>

          {hayFiltros && !cargando && (
            <p className="mt-3 text-xs text-slate-500">
              {usuariosFiltrados.length}{" "}
              {usuariosFiltrados.length === 1
                ? "resultado encontrado"
                : "resultados encontrados"}
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
                No se pudo actualizar el listado
              </p>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={manejarActualizar}
              disabled={
                cargando ||
                actualizando ||
                procesandoBaja
              }
              className="text-sm font-semibold text-red-700 underline disabled:opacity-50"
            >
              Reintentar
            </button>
          </div>
        )}

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
              Cargando usuarios...
            </p>
          </div>
        ) : error && usuarios.length === 0 ? null : usuariosFiltrados.length === 0 ? (
          <EstadoVacio
            hayUsuarios={usuarios.length > 0}
            hayFiltros={hayFiltros}
            onLimpiar={limpiarFiltros}
            onActualizar={manejarActualizar}
            deshabilitado={
              actualizando ||
              procesandoBaja
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="whitespace-nowrap px-5 py-4">
                    Usuario
                  </th>

                  <th className="whitespace-nowrap px-5 py-4">
                    Correo electrónico
                  </th>

                  <th className="whitespace-nowrap px-5 py-4">
                    Rol
                  </th>

                  <th className="whitespace-nowrap px-5 py-4">
                    Estado
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {usuariosFiltrados.map((usuario) => (
                  <tr
                    key={usuario.id}
                    className="transition-colors hover:bg-slate-50"
                  >

                    {/* USUARIO */}

                    <td className="whitespace-nowrap px-5 py-4 align-middle">
                      <div className="flex flex-col">

                        <div className="min-w-0">
                          <Link
                            to={`/usuarios/${usuario.id}`}
                            title={`Ver detalle de ${nombreCompleto(usuario)}`}
                            className="inline-block font-semibold text-blue-700 transition hover:text-blue-900 hover:underline hover:underline-offset-4"
                          >
                            {nombreCompleto(usuario)}
                          </Link>
                        </div>
                        <span className="mt-1 text-xs text-slate-400">
                          ID#{usuario.id}
                        </span>
                      </div>
                    </td>

                    {/* CORREO */}

                    <td className="px-5 py-4 align-middle">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail
                          size={16}
                          className="shrink-0 text-slate-400"
                        />

                        <span className="break-all">
                          {usuario.email || "Sin correo"}
                        </span>
                      </div>
                    </td>

                    {/* ROL */}

                    <td className="whitespace-nowrap px-5 py-4 align-middle">
                      <RolBadge
                        nombre={usuario.rol?.nombre}
                      />
                    </td>

                    {/* ESTADO */}

                    <td className="whitespace-nowrap px-5 py-4 align-middle">
                      <EstadoUsuarioBadge />
                    </td>

                    {/* ACCIONES */}

                    <td className="whitespace-nowrap px-5 py-4 text-right align-middle">
                      <div className="flex items-center justify-end gap-2">

                        {/* VER DETALLE */}

                        <Link
                          to={`/usuarios/${usuario.id}`}
                          title={`Ver detalle de ${nombreCompleto(usuario)}`}
                          aria-label={`Ver detalle de ${nombreCompleto(usuario)}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all duration-150 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                          <Eye
                            size={17}
                            strokeWidth={1.8}
                          />
                        </Link>

                        {/* EDITAR USUARIO */}

                        {puedeEditar && (
                          <Link
                            to={`/usuarios/${usuario.id}`}
                            title={`Editar ${nombreCompleto(usuario)}`}
                            aria-label={`Editar ${nombreCompleto(usuario)}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-white text-blue-700 transition-all duration-150 hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          >
                            <Pencil
                              size={17}
                              strokeWidth={1.8}
                            />
                          </Link>
                        )}

                        {/* DAR DE BAJA */}

                        {puedeDesactivar &&
                          String(user?.id) !==
                            String(usuario.id) && (
                            <button
                              type="button"
                              onClick={() =>
                                solicitarBaja(usuario)
                              }
                              disabled={procesandoBaja}
                              title={`Dar de baja a ${nombreCompleto(usuario)}`}
                              aria-label={`Dar de baja a ${nombreCompleto(usuario)}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition-all duration-150 hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Trash
                                size={17}
                                strokeWidth={1.8}
                              />
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* =============================================
            PIE DEL LISTADO
        ============================================= */}

        {!cargando && !error && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-5 sm:px-6">
            <p className="text-sm font-medium text-slate-700">
              Mostrando{" "}
              <span className="font-bold">
                {usuariosFiltrados.length}
              </span>{" "}
              de{" "}
              <span className="font-bold">
                {usuarios.length}
              </span>{" "}
              usuarios activos
            </p>

            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
              <CheckCircle2 size={14} />
              Cuentas activas
            </span>
          </div>
        )}
      </section>
    </div>
  );
}
