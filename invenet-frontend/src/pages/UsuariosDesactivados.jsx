
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
  Clock3,
  GraduationCap,
  Loader2,
  Mail,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  UserRound,
  UserRoundX,
  Wrench,
  X,
  Users,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../context/FeedbackContext";

import {
  obtenerUsuariosDesactivados,
  restaurarUsuario,
} from "../services/usuarioService";

// =====================================================
// ESTILOS COMPARTIDOS
// =====================================================

const botonSecundario =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const campoBusqueda =
  "w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

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

function fechaLegible(fecha) {
  if (!fecha) return "No disponible";

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return "No disponible";
  }

  return valor.toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function nombreCompleto(usuario) {
  return (
    [usuario?.nombre, usuario?.apellido]
      .filter(Boolean)
      .join(" ") || "Sin nombre"
  );
}

function inicialesUsuario(usuario) {
  const nombre = usuario?.nombre?.trim()?.[0] ?? "";
  const apellido = usuario?.apellido?.trim()?.[0] ?? "";

  return `${nombre}${apellido}`.toUpperCase() || "U";
}

function configuracionRol(nombre) {
  switch (nombre) {
    case "Administrador":
      return {
        Icono: ShieldCheck,
        clases:
          "border-violet-200 bg-violet-50 text-violet-700",
      };

    case "Docente":
      return {
        Icono: GraduationCap,
        clases:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
      };

    case "Técnico":
      return {
        Icono: Wrench,
        clases:
          "border-blue-200 bg-blue-50 text-blue-700",
      };

    default:
      return {
        Icono: UserRound,
        clases:
          "border-slate-200 bg-slate-50 text-slate-600",
      };
  }
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
  const Icono = configuracion.Icono;

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

function EstadoDesactivadoBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700">
      Desactivado
    </span>
  );
}

// =====================================================
// PÁGINA PRINCIPAL
// =====================================================

export default function UsuariosDesactivados() {
  const { user } = useAuth();
  const { toast, confirmar } = useFeedback();

  // =====================================================
  // REFERENCIAS DE CONTROL
  // =====================================================

  const montadoRef = useRef(false);

  // Cada solicitud recibe un identificador.
  // Solo la solicitud vigente puede actualizar
  // el listado.
  const solicitudRef = useRef(0);

  // Evita abrir varias confirmaciones o ejecutar
  // varias restauraciones simultáneamente.
  const restauracionEnCursoRef = useRef(false);

  // Versión de los datos. Permite invalidar una
  // consulta iniciada antes de una restauración.
  const versionDatosRef = useRef(0);

  const toastRef = useRef(toast);
  const confirmarRef = useRef(confirmar);

  toastRef.current = toast;
  confirmarRef.current = confirmar;

  // =====================================================
  // ESTADOS
  // =====================================================

  const [usuarios, setUsuarios] = useState([]);

  const [busqueda, setBusqueda] = useState("");

  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] =
    useState(false);

  // Exclusivamente para errores persistentes
  // de consulta del listado.
  const [error, setError] = useState("");

  const [restaurando, setRestaurando] =
    useState(false);

  const [usuarioRestaurandoId, setUsuarioRestaurandoId] =
    useState(null);

  // =====================================================
  // PERMISOS
  // =====================================================

  const permisos =
    user?.rol?.permisos ?? user?.permisos ?? [];

  const puedeRestaurar =
    Array.isArray(permisos) &&
    permisos.some((permiso) =>
      typeof permiso === "string"
        ? permiso === "usuarios.desactivar"
        : permiso?.nombre === "usuarios.desactivar"
    );

  // =====================================================
  // CONTROL DE MONTAJE
  // =====================================================

  useEffect(() => {
    montadoRef.current = true;

    return () => {
      montadoRef.current = false;

      // Invalida las consultas pendientes.
      solicitudRef.current += 1;
    };
  }, []);

  // =====================================================
  // CARGAR USUARIOS DESACTIVADOS
  // =====================================================

  const cargarUsuarios = useCallback(
    async (esActualizacion = false) => {
      // Evitar que una recarga manual interfiera
      // con una restauración en curso.
      if (restauracionEnCursoRef.current) {
        return;
      }

      const solicitud = ++solicitudRef.current;
      const versionInicial = versionDatosRef.current;

      if (esActualizacion) {
        setActualizando(true);
      } else {
        setCargando(true);
      }

      setError("");

      try {
        const respuesta =
          await obtenerUsuariosDesactivados();

        const registros = extraerUsuarios(respuesta);

        if (
          !montadoRef.current ||
          solicitud !== solicitudRef.current ||
          versionInicial !== versionDatosRef.current
        ) {
          return;
        }

        setUsuarios(
          registros.filter(
            (usuario) =>
              usuario !== null &&
              typeof usuario === "object"
          )
        );
      } catch (err) {
        console.error(
          "Error al cargar usuarios desactivados:",
          err
        );

        if (
          !montadoRef.current ||
          solicitud !== solicitudRef.current ||
          versionInicial !== versionDatosRef.current
        ) {
          return;
        }

        setError(
          mensajeError(
            err,
            "No se pudieron cargar los usuarios desactivados."
          )
        );

        // Si la carga inicial falla, se limpia
        // la tabla. Si falla una actualización,
        // se conserva el último listado obtenido.
        if (!esActualizacion) {
          setUsuarios([]);
        }
      } finally {
        if (
          montadoRef.current &&
          solicitud === solicitudRef.current
        ) {
          setCargando(false);
          setActualizando(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  // =====================================================
  // BÚSQUEDA AUTOMÁTICA
  // =====================================================

  const usuariosFiltrados = useMemo(() => {
    const termino = busqueda
      .trim()
      .toLocaleLowerCase("es");

    if (!termino) return usuarios;

    return usuarios.filter((usuario) => {
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

      return contenido.includes(termino);
    });
  }, [usuarios, busqueda]);

  // =====================================================
  // RESTAURACIÓN DE USUARIOS
  // =====================================================

  const solicitarRestauracion = async (usuario) => {
    if (
      !usuario?.id ||
      !puedeRestaurar ||
      restauracionEnCursoRef.current ||
      cargando ||
      actualizando
    ) {
      return;
    }

    // Se activa antes de abrir el diálogo.
    // Así, varios clics no generan varias
    // confirmaciones simultáneas.
    restauracionEnCursoRef.current = true;

    setRestaurando(true);
    setUsuarioRestaurandoId(usuario.id);

    try {
      const aceptado = await confirmarRef.current({
        titulo: "Restaurar usuario",
        mensaje:
          `¿Querés restaurar la cuenta de ${nombreCompleto(
            usuario
          )}? ` +
          "El usuario volverá a estar activo y dejará de aparecer en el listado de cuentas desactivadas.",
        textoConfirmar: "Restaurar usuario",
        textoCancelar: "Cancelar",
        variante: "primary",
      });

      // Cancelar no produce ninguna notificación.
      if (!aceptado || !montadoRef.current) {
        return;
      }

      const respuesta = await restaurarUsuario(
        usuario.id
      );

      if (!montadoRef.current) {
        return;
      }

      // Invalida las respuestas de consultas
      // iniciadas antes de esta restauración.
      versionDatosRef.current += 1;
      solicitudRef.current += 1;

      // El usuario restaurado desaparece
      // inmediatamente de la tabla.
      setUsuarios((anteriores) =>
        anteriores.filter(
          (item) =>
            String(item.id) !== String(usuario.id)
        )
      );

      // La restauración fue confirmada por el
      // backend, por lo que se notifica éxito
      // sin depender de una segunda consulta.
      toastRef.current.success(
        respuesta?.message ||
          `La cuenta de ${nombreCompleto(
            usuario
          )} fue restaurada correctamente.`
      );
    } catch (err) {
      console.error(
        "Error al restaurar usuario:",
        err
      );

      if (!montadoRef.current) {
        return;
      }

      const estado = err?.response?.status;

      if (estado === 403) {
        toastRef.current.error(
          "No tenés permisos para restaurar este usuario."
        );
      } else if (
        estado === 404 ||
        estado === 409 ||
        estado === 422
      ) {
        toastRef.current.warning(
          mensajeError(
            err,
            "No se pudo restaurar la cuenta. Es posible que su estado haya cambiado."
          )
        );
      } else {
        toastRef.current.error(
          mensajeError(
            err,
            "No se pudo restaurar el usuario. Intentá nuevamente."
          )
        );
      }
    } finally {
      restauracionEnCursoRef.current = false;

      if (montadoRef.current) {
        setRestaurando(false);
        setUsuarioRestaurandoId(null);

        // Si había una consulta invalidada
        // por la restauración, se liberan
        // los indicadores de carga.
        setCargando(false);
        setActualizando(false);
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/usuarios"
          className={botonSecundario}
        >
          <ArrowLeft size={17} />
          Volver a usuarios
        </Link>

        <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-400">
          <Users size={15} />
          Administración de usuarios
        </span>
      </div>

      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-blue-700" />

        <div className="flex flex-col justify-between gap-5 p-5 sm:p-6 lg:flex-row lg:items-center">

          {/* TÍTULO */}

          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <UserRoundX
                size={27}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                Administración institucional
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Usuarios desactivados
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                Consultá las cuentas desactivadas de Invenet
                y restaurá su acceso cuando sea necesario.
              </p>
            </div>
          </div>

          {/* ACCIONES */}

          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
            <button
              type="button"
              onClick={() => cargarUsuarios(true)}
              disabled={
                cargando ||
                actualizando ||
                restaurando
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
          </div>
        </div>
      </header>

      {/* =============================================
          CAJA 2 - LISTADO DE USUARIOS
      ============================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* ENCABEZADO Y BÚSQUEDA */}

        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">

            {/* TÍTULO */}

            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <UserRoundX
                  size={21}
                  strokeWidth={1.8}
                />
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  Cuentas desactivadas
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Consultá los usuarios dados de baja y gestioná su restauración.
                </p>
              </div>
            </div>

            {/* CONTADOR Y BUSCADOR */}

            <div className="flex flex-wrap items-center gap-3 xl:justify-end">

              {/* TOTAL */}

              <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
                {usuarios.length.toLocaleString("es-AR")}{" "}
                {usuarios.length === 1
                  ? "usuario"
                  : "usuarios"}
              </span>

              {/* BUSCADOR */}

              <div className="relative w-full sm:w-72">
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
                  aria-label="Buscar usuarios desactivados"
                  className={campoBusqueda}
                />

                {busqueda && (
                  <button
                    type="button"
                    onClick={() => setBusqueda("")}
                    title="Limpiar búsqueda"
                    aria-label="Limpiar búsqueda"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* RESULTADOS DE BÚSQUEDA */}

          {busqueda.trim() && !cargando && (
            <p className="mt-3 text-xs text-slate-500">
              {usuariosFiltrados.length}{" "}
              {usuariosFiltrados.length === 1
                ? "resultado encontrado"
                : "resultados encontrados"}
            </p>
          )}
        </div>

        {/* =============================================
            ERROR PERSISTENTE DE CONSULTA
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
                No se pudo cargar el listado
              </p>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => cargarUsuarios(true)}
              disabled={
                cargando ||
                actualizando ||
                restaurando
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

          /* CARGANDO */

          <div className="flex min-h-72 flex-col items-center justify-center gap-3">
            <Loader2
              size={28}
              className="animate-spin text-blue-700"
            />

            <p className="text-sm font-medium text-slate-500">
              Cargando usuarios desactivados...
            </p>
          </div>

        ) : error && usuarios.length === 0 ? null : usuariosFiltrados.length === 0 ? (

          /* SIN RESULTADOS */

          <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <UserRoundX size={29} />
            </div>

            <h3 className="mt-5 text-base font-bold text-slate-900">
              {busqueda.trim()
                ? "No se encontraron usuarios"
                : "No hay usuarios desactivados"}
            </h3>

            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              {busqueda.trim()
                ? "No encontramos cuentas que coincidan con tu búsqueda. Probá con otros criterios."
                : "Actualmente no hay cuentas desactivadas. Cuando se dé de baja un usuario, aparecerá en este listado."}
            </p>

            {busqueda.trim() && (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                className={`mt-5 ${botonSecundario}`}
              >
                <X size={16} />
                Limpiar búsqueda
              </button>
            )}
          </div>

        ) : (

          /* TABLA CON REGISTROS */

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">

              {/* ENCABEZADOS */}

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
                    Fecha de baja
                  </th>

                  <th className="whitespace-nowrap px-5 py-4">
                    Estado
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>

              {/* REGISTROS */}

              <tbody className="divide-y divide-slate-100 bg-white">
                {usuariosFiltrados.map((usuario) => (
                  <tr
                    key={usuario.id}
                    className="transition-colors hover:bg-slate-50"
                  >

                    {/* USUARIO */}

                    <td className="whitespace-nowrap px-5 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
                          {inicialesUsuario(usuario)}
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">
                            {nombreCompleto(usuario)}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            ID #{usuario.id}
                          </p>
                        </div>
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

                    {/* FECHA DE BAJA */}

                    <td className="whitespace-nowrap px-5 py-4 align-middle">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock3
                          size={16}
                          className="shrink-0 text-slate-400"
                        />

                        {fechaLegible(usuario.deleted_at)}
                      </div>
                    </td>

                    {/* ESTADO */}

                    <td className="whitespace-nowrap px-5 py-4 align-middle">
                      <EstadoDesactivadoBadge />
                    </td>

                    {/* ACCIONES */}

                    <td className="whitespace-nowrap px-5 py-4 text-right align-middle">
                      {puedeRestaurar ? (
                        <button
                          type="button"
                          onClick={() =>
                            solicitarRestauracion(usuario)
                          }
                          disabled={
                            restaurando ||
                            cargando ||
                            actualizando
                          }
                          title={`Restaurar a ${nombreCompleto(usuario)}`}
                          aria-label={`Restaurar a ${nombreCompleto(usuario)}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700 transition hover:border-blue-200 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {restaurando &&
                          String(usuarioRestaurandoId) ===
                            String(usuario.id) ? (
                            <Loader2
                              size={17}
                              className="animate-spin"
                            />
                          ) : (
                            <RotateCcw size={17} />
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Solo consulta
                        </span>
                      )}
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
              usuarios desactivados
            </p>

            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
              <UserRoundX size={14} />
              Cuentas desactivadas
            </span>
          </div>
        )}
      </section>
    </div>
  );
}
