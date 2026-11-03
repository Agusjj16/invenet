
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Info,
  Loader2,
  LockKeyhole,
  Mail,
  Pencil,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
  UserRoundX,
  Users,
  Wrench,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../context/FeedbackContext";

import {
  actualizarUsuario,
  cambiarRolUsuario,
  desactivarUsuario,
  obtenerUsuario,
  obtenerUsuarios,
} from "../services/usuarioService";

// =====================================================
// ESTILOS COMPARTIDOS
// =====================================================

const botonSecundario =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const botonPrincipal =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50";

const botonPeligro =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50";

const estiloInput =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500";

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
  const nombre = usuario?.nombre?.trim()?.[0] ?? "";
  const apellido = usuario?.apellido?.trim()?.[0] ?? "";

  return `${nombre}${apellido}`.toUpperCase() || "U";
}

function configuracionRol(nombre) {
  switch (nombre) {
    case "Administrador":
      return {
        icono: ShieldCheck,
        clases:
          "border-violet-200 bg-violet-50 text-violet-700",
        descripcion:
          "Administración y gestión institucional",
      };

    case "Docente":
      return {
        icono: GraduationCap,
        clases:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        descripcion:
          "Consulta y reporte de anomalías",
      };

    case "Técnico":
      return {
        icono: Wrench,
        clases:
          "border-blue-200 bg-blue-50 text-blue-700",
        descripcion:
          "Gestión de reparaciones y mantenimiento",
      };

    default:
      return {
        icono: UserRound,
        clases:
          "border-slate-200 bg-slate-50 text-slate-600",
        descripcion: "Rol no especificado",
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

function obtenerErroresValidacion(error) {
  const errores = error?.response?.data?.errors;

  if (
    !errores ||
    typeof errores !== "object" ||
    Array.isArray(errores)
  ) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(errores).map(([campo, mensajes]) => [
      campo,
      Array.isArray(mensajes)
        ? mensajes[0]
        : String(mensajes),
    ])
  );
}

function obtenerIdRol(usuario) {
  const id = usuario?.rol_id ?? usuario?.rol?.id;

  return id == null ? "" : String(id);
}

function extraerUsuarios(respuesta) {
  if (Array.isArray(respuesta)) {
    return respuesta;
  }

  if (Array.isArray(respuesta?.data)) {
    return respuesta.data;
  }

  throw new Error(
    "La respuesta de usuarios no tiene un formato válido."
  );
}

function extraerUsuarioActualizado(respuesta) {
  if (respuesta?.user?.id) {
    return respuesta.user;
  }

  if (respuesta?.data?.user?.id) {
    return respuesta.data.user;
  }

  if (respuesta?.id) {
    return respuesta;
  }

  return null;
}

function obtenerDatosFormulario(usuario) {
  return {
    nombre: usuario?.nombre ?? "",
    apellido: usuario?.apellido ?? "",
    email: usuario?.email ?? "",
  };
}

// =====================================================
// COMPONENTES REUTILIZABLES
// =====================================================

function RolBadge({ nombre }) {
  const configuracion = configuracionRol(nombre);
  const Icono = configuracion.icono;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${configuracion.clases}`}
    >
      <Icono size={14} />
      {nombre || "Sin rol"}
    </span>
  );
}

function EncabezadoSeccion({
  icono: Icono,
  titulo,
  descripcion,
  accion,
}) {
  return (
    <div className="flex min-h-[88px] flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Icono size={19} strokeWidth={1.8} />
        </div>

        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-900">
            {titulo}
          </h2>

          <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
            {descripcion}
          </p>
        </div>
      </div>

      {accion && (
        <div className="shrink-0">{accion}</div>
      )}
    </div>
  );
}

function CampoInformacion({
  etiqueta,
  valor,
  icono: Icono,
}) {
  return (
    <div className="flex min-h-[94px] flex-col justify-center rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-center gap-2">
        {Icono && (
          <Icono
            size={15}
            className="shrink-0 text-slate-400"
          />
        )}

        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {etiqueta}
        </p>
      </div>

      <p className="mt-2 break-words text-sm font-semibold text-slate-900">
        {valor || "No disponible"}
      </p>
    </div>
  );
}

function MensajeError({ mensaje, onCerrar }) {
  if (!mensaje) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
    >
      <AlertCircle
        size={19}
        className="mt-0.5 shrink-0 text-red-600"
      />

      <p className="flex-1 text-sm font-medium leading-relaxed text-red-700">
        {mensaje}
      </p>

      {onCerrar && (
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar mensaje"
          className="text-red-600 hover:text-red-800"
        >
          <X size={17} />
        </button>
      )}
    </div>
  );
}

function CampoFormulario({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  maxLength,
  disabled,
  placeholder,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
        <span className="ml-1 text-red-500">*</span>
      </label>

      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${id}-error` : undefined
        }
        className={`${estiloInput} ${
          error
            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
            : ""
        }`}
      />

      {error && (
        <p
          id={`${id}-error`}
          className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600"
        >
          <AlertCircle size={13} />
          {error}
        </p>
      )}
    </div>
  );
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function UsuarioDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { user } = useAuth();
  const { toast, confirmar } = useFeedback();

  // =====================================================
  // REFERENCIAS DE CONTROL
  // =====================================================

  const montadoRef = useRef(false);
  const solicitudUsuarioRef = useRef(0);
  const solicitudRolesRef = useRef(0);

  const operacionRef = useRef(false);

  const toastRef = useRef(toast);
  const confirmarRef = useRef(confirmar);

  toastRef.current = toast;
  confirmarRef.current = confirmar;

  // =====================================================
  // PERMISOS
  // =====================================================

  const permisos =
    user?.rol?.permisos ?? user?.permisos ?? [];

  const tienePermiso = (nombre) =>
    Array.isArray(permisos) &&
    permisos.some((permiso) =>
      typeof permiso === "string"
        ? permiso === nombre
        : permiso?.nombre === nombre
    );

  const puedeEditar =
    tienePermiso("usuarios.editar");

  const puedeCambiarRol =
    tienePermiso("usuarios.roles");

  const puedeDesactivar =
    tienePermiso("usuarios.desactivar");

  // =====================================================
  // ESTADOS
  // =====================================================

  const [usuario, setUsuario] = useState(null);

  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] =
    useState(false);

  const [error, setError] = useState("");

  const [editando, setEditando] = useState(false);
  const [guardandoDatos, setGuardandoDatos] =
    useState(false);

  const [formulario, setFormulario] = useState({
    nombre: "",
    apellido: "",
    email: "",
  });

  const [erroresDatos, setErroresDatos] =
    useState({});

  const [roles, setRoles] = useState([]);
  const [cargandoRoles, setCargandoRoles] =
    useState(false);
  const [errorRoles, setErrorRoles] = useState("");

  const [rolSeleccionado, setRolSeleccionado] =
    useState("");

  const [guardandoRol, setGuardandoRol] =
    useState(false);

  const [desactivando, setDesactivando] =
    useState(false);

  // =====================================================
  // CONTROL DE MONTAJE
  // =====================================================

  useEffect(() => {
    montadoRef.current = true;

    return () => {
      montadoRef.current = false;
      solicitudUsuarioRef.current += 1;
      solicitudRolesRef.current += 1;
    };
  }, []);

  // =====================================================
  // CARGAR USUARIO
  // =====================================================

  const cargarUsuario = useCallback(
    async (esActualizacion = false) => {
      const solicitud = ++solicitudUsuarioRef.current;

      if (esActualizacion) {
        setActualizando(true);
      } else {
        setCargando(true);
      }

      setError("");

      try {
        const respuesta = await obtenerUsuario(id);

        const encontrado =
          respuesta?.id
            ? respuesta
            : respuesta?.data?.id
              ? respuesta.data
              : null;

        if (!encontrado) {
          throw new Error(
            "El servidor no devolvió un usuario válido."
          );
        }

        if (
          !montadoRef.current ||
          solicitud !== solicitudUsuarioRef.current
        ) {
          return;
        }

        setUsuario(encontrado);
        setFormulario(
          obtenerDatosFormulario(encontrado)
        );
        setRolSeleccionado(
          obtenerIdRol(encontrado)
        );
        setErroresDatos({});
      } catch (err) {
        console.error(
          "Error al consultar usuario:",
          err
        );

        if (
          !montadoRef.current ||
          solicitud !== solicitudUsuarioRef.current
        ) {
          return;
        }

        setError(
          obtenerMensajeError(
            err,
            "No se pudo cargar el usuario."
          )
        );
      } finally {
        if (
          montadoRef.current &&
          solicitud === solicitudUsuarioRef.current
        ) {
          setCargando(false);
          setActualizando(false);
        }
      }
    },
    [id]
  );

  useEffect(() => {
    cargarUsuario();
  }, [cargarUsuario]);

  // =====================================================
  // CARGAR ROLES
  // =====================================================

  const rolActualId = obtenerIdRol(usuario);
  const rolActualNombre = usuario?.rol?.nombre;

  const cargarRoles = useCallback(async () => {
    if (!puedeCambiarRol) {
      return;
    }

    const solicitud = ++solicitudRolesRef.current;

    setCargandoRoles(true);
    setErrorRoles("");

    try {
      const respuesta = await obtenerUsuarios();
      const usuarios = extraerUsuarios(respuesta);

      const mapa = new Map();

      usuarios.forEach((registro) => {
        const rol = registro?.rol;

        if (
          rol?.id != null &&
          rol?.nombre
        ) {
          mapa.set(String(rol.id), {
            id: rol.id,
            nombre: rol.nombre,
          });
        }
      });

      // Mantener visible el rol actual aunque
      // no aparezca en la consulta de usuarios.
      if (
        rolActualId &&
        rolActualNombre
      ) {
        mapa.set(rolActualId, {
          id: rolActualId,
          nombre: rolActualNombre,
        });
      }

      const disponibles = Array.from(
        mapa.values()
      ).sort((a, b) =>
        a.nombre.localeCompare(b.nombre, "es")
      );

      if (
        !montadoRef.current ||
        solicitud !== solicitudRolesRef.current
      ) {
        return;
      }

      setRoles(disponibles);

      if (!disponibles.length) {
        setErrorRoles(
          "No se encontraron roles disponibles."
        );
      }
    } catch (err) {
      console.error(
        "Error al cargar roles:",
        err
      );

      if (
        !montadoRef.current ||
        solicitud !== solicitudRolesRef.current
      ) {
        return;
      }

      setErrorRoles(
        obtenerMensajeError(
          err,
          "No se pudieron consultar los roles."
        )
      );
    } finally {
      if (
        montadoRef.current &&
        solicitud === solicitudRolesRef.current
      ) {
        setCargandoRoles(false);
      }
    }
  }, [
    puedeCambiarRol,
    rolActualId,
    rolActualNombre,
  ]);

  useEffect(() => {
    cargarRoles();
  }, [cargarRoles]);

  // =====================================================
  // EDICIÓN DE DATOS
  // =====================================================

  const comenzarEdicion = () => {
    if (
      !usuario ||
      !puedeEditar ||
      operacionRef.current
    ) {
      return;
    }

    setFormulario(
      obtenerDatosFormulario(usuario)
    );
    setErroresDatos({});
    setEditando(true);
  };

  const cancelarEdicion = () => {
    if (operacionRef.current) {
      return;
    }

    setEditando(false);
    setErroresDatos({});

    if (usuario) {
      setFormulario(
        obtenerDatosFormulario(usuario)
      );
    }
  };

  const manejarCambioDatos = (event) => {
    if (operacionRef.current) {
      return;
    }

    const { name, value } = event.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));

    setErroresDatos((anterior) => ({
      ...anterior,
      [name]: "",
    }));
  };

  const validarDatos = () => {
    const errores = {};

    const nombre = formulario.nombre.trim();
    const apellido = formulario.apellido.trim();
    const email = formulario.email.trim();

    if (!nombre) {
      errores.nombre = "Ingresá el nombre.";
    } else if (nombre.length > 100) {
      errores.nombre =
        "El nombre no puede superar los 100 caracteres.";
    }

    if (!apellido) {
      errores.apellido = "Ingresá el apellido.";
    } else if (apellido.length > 100) {
      errores.apellido =
        "El apellido no puede superar los 100 caracteres.";
    }

    if (!email) {
      errores.email =
        "Ingresá el correo electrónico.";
    } else if (email.length > 150) {
      errores.email =
        "El correo no puede superar los 150 caracteres.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      errores.email =
        "Ingresá un correo válido.";
    }

    setErroresDatos(errores);

    return Object.keys(errores).length === 0;
  };

  const guardarDatos = async (event) => {
    event.preventDefault();

    if (
      !puedeEditar ||
      !editando ||
      !usuario ||
      operacionRef.current
    ) {
      return;
    }

    if (!validarDatos()) {
      toastRef.current.warning(
        "Revisá los campos marcados antes de continuar."
      );
      return;
    }

    const datos = {
      nombre: formulario.nombre.trim(),
      apellido: formulario.apellido.trim(),
      email: formulario.email.trim(),
    };

    // Evitar solicitudes innecesarias.
    const sinCambios =
      datos.nombre === usuario.nombre &&
      datos.apellido === usuario.apellido &&
      datos.email === usuario.email;

    if (sinCambios) {
      setEditando(false);
      setErroresDatos({});
      toastRef.current.info(
        "No se detectaron cambios en los datos."
      );
      return;
    }

    operacionRef.current = true;
    setGuardandoDatos(true);

    try {
      const respuesta = await actualizarUsuario(
        id,
        datos
      );

      if (!montadoRef.current) {
        return;
      }

      // La API original devuelve respuesta.user.
      // Si no viene el objeto completo, se
      // consulta nuevamente al servidor.
      let actualizado =
        extraerUsuarioActualizado(respuesta);

      if (!actualizado) {
        const consulta = await obtenerUsuario(id);

        actualizado =
          consulta?.id
            ? consulta
            : consulta?.data?.id
              ? consulta.data
              : null;
      }

      if (!montadoRef.current) {
        return;
      }

      if (!actualizado?.id) {
        throw new Error(
          "Los cambios se enviaron, pero no se pudo recuperar el usuario actualizado."
        );
      }

      setUsuario(actualizado);
      setFormulario(
        obtenerDatosFormulario(actualizado)
      );
      setRolSeleccionado(
        obtenerIdRol(actualizado)
      );
      setEditando(false);
      setErroresDatos({});

      toastRef.current.success(
        "Datos del usuario actualizados correctamente."
      );
    } catch (err) {
      console.error(
        "Error al editar usuario:",
        err
      );

      if (!montadoRef.current) {
        return;
      }

      if (err?.response?.status === 422) {
        const errores =
          obtenerErroresValidacion(err);

        setErroresDatos(errores);

        toastRef.current.warning(
          Object.keys(errores).length
            ? "Revisá los datos señalados."
            : obtenerMensajeError(
                err,
                "Los datos ingresados no son válidos."
              )
        );
      } else if (
        err?.response?.status === 403
      ) {
        toastRef.current.error(
          "No tenés permisos para editar este usuario."
        );
      } else {
        toastRef.current.error(
          obtenerMensajeError(
            err,
            "No se pudieron guardar los cambios."
          )
        );
      }
    } finally {
      operacionRef.current = false;

      if (montadoRef.current) {
        setGuardandoDatos(false);
      }
    }
  };

  // =====================================================
  // CAMBIO DE ROL
  // =====================================================

  const esCuentaPropia =
    usuario != null &&
    String(usuario.id) === String(user?.id);

  const rolModificado =
    rolSeleccionado !== "" &&
    rolSeleccionado !== rolActualId;

  const guardarRol = async (event) => {
    event.preventDefault();

    if (
      !usuario ||
      !puedeCambiarRol ||
      esCuentaPropia ||
      editando ||
      operacionRef.current ||
      !rolModificado
    ) {
      return;
    }

    const rolValido = roles.some(
      (rol) =>
        String(rol.id) === rolSeleccionado
    );

    if (!rolValido) {
      toastRef.current.warning(
        "Seleccioná un rol válido."
      );
      return;
    }

    const nuevoRol = roles.find(
      (rol) =>
        String(rol.id) === rolSeleccionado
    );

    // Bloqueo durante la confirmación para
    // evitar abrir varios diálogos.
    operacionRef.current = true;
    setGuardandoRol(true);

    try {
      const aceptado =
        await confirmarRef.current({
          titulo: "Confirmar cambio de rol",
          mensaje:
            `¿Querés cambiar el rol de ${nombreCompleto(
              usuario
            )} a "${nuevoRol.nombre}"? ` +
            "Esta acción modificará sus permisos de acceso.",
          textoConfirmar: "Cambiar rol",
          textoCancelar: "Cancelar",
          variante: "warning",
        });

      if (
        !aceptado ||
        !montadoRef.current
      ) {
        return;
      }

      const respuesta = await cambiarRolUsuario(
        id,
        Number(rolSeleccionado)
      );

      if (!montadoRef.current) {
        return;
      }

      let actualizado =
        extraerUsuarioActualizado(respuesta);

      if (!actualizado) {
        const consulta = await obtenerUsuario(id);

        actualizado =
          consulta?.id
            ? consulta
            : consulta?.data?.id
              ? consulta.data
              : null;
      }

      if (!montadoRef.current) {
        return;
      }

      if (!actualizado?.id) {
        throw new Error(
          "El cambio se envió, pero no se pudo recuperar el usuario actualizado."
        );
      }

      setUsuario(actualizado);
      setRolSeleccionado(
        obtenerIdRol(actualizado)
      );
      setFormulario(
        obtenerDatosFormulario(actualizado)
      );

      toastRef.current.success(
        "Rol del usuario actualizado correctamente."
      );
    } catch (err) {
      console.error(
        "Error al cambiar rol:",
        err
      );

      if (!montadoRef.current) {
        return;
      }

      if (err?.response?.status === 422) {
        toastRef.current.warning(
          obtenerMensajeError(
            err,
            "El rol seleccionado no es válido."
          )
        );
      } else if (
        err?.response?.status === 403
      ) {
        toastRef.current.error(
          "No tenés permisos para cambiar el rol."
        );
      } else {
        toastRef.current.error(
          obtenerMensajeError(
            err,
            "No se pudo cambiar el rol."
          )
        );
      }
    } finally {
      operacionRef.current = false;

      if (montadoRef.current) {
        setGuardandoRol(false);
      }
    }
  };

  // =====================================================
  // DESACTIVACIÓN
  // =====================================================

  const manejarDesactivacion = async () => {
    if (
      !usuario ||
      !puedeDesactivar ||
      esCuentaPropia ||
      editando ||
      operacionRef.current
    ) {
      return;
    }

    operacionRef.current = true;
    setDesactivando(true);

    try {
      const aceptado =
        await confirmarRef.current({
          titulo: "Confirmar desactivación",
          mensaje:
            `¿Querés dar de baja la cuenta de ${nombreCompleto(
              usuario
            )}? ` +
            "El usuario perderá el acceso a Invenet. " +
            "Su información se conservará y la cuenta podrá restaurarse desde Usuarios desactivados.",
          textoConfirmar: "Desactivar usuario",
          textoCancelar: "Cancelar",
          variante: "danger",
        });

      if (
        !aceptado ||
        !montadoRef.current
      ) {
        return;
      }

      await desactivarUsuario(usuario.id);

      if (!montadoRef.current) {
        return;
      }

      toastRef.current.success(
        "Usuario desactivado correctamente."
      );

      // No enviamos state.mensaje para evitar
      // notificaciones duplicadas en Usuarios.jsx.
      navigate("/usuarios", {
        replace: true,
      });
    } catch (err) {
      console.error(
        "Error al desactivar usuario:",
        err
      );

      if (!montadoRef.current) {
        return;
      }

      if (err?.response?.status === 403) {
        toastRef.current.error(
          "No tenés permisos para desactivar este usuario."
        );
      } else if (
        err?.response?.status === 422 ||
        err?.response?.status === 409
      ) {
        toastRef.current.warning(
          obtenerMensajeError(
            err,
            "No se puede desactivar este usuario."
          )
        );
      } else {
        toastRef.current.error(
          obtenerMensajeError(
            err,
            "No se pudo desactivar el usuario."
          )
        );
      }
    } finally {
      operacionRef.current = false;

      if (montadoRef.current) {
        setDesactivando(false);
      }
    }
  };

  // =====================================================
  // ESTADOS DE PANTALLA
  // =====================================================

  if (cargando) {
    return (
      <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-10">
        <div className="flex min-h-[350px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <Loader2
            size={30}
            className="animate-spin text-blue-700"
          />

          <p className="text-sm font-medium text-slate-500">
            Cargando información del usuario...
          </p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="mx-auto max-w-3xl space-y-5 pb-10">
        <Link
          to="/usuarios"
          className={botonSecundario}
        >
          <ArrowLeft size={17} />
          Volver a usuarios
        </Link>

        <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
          <AlertCircle
            size={30}
            className="text-red-600"
          />

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            No se pudo consultar el usuario
          </h1>

          <p className="mt-2 text-sm text-red-600">
            {error || "Usuario no encontrado."}
          </p>

          <button
            type="button"
            onClick={() => cargarUsuario()}
            className={`mt-5 ${botonPrincipal}`}
          >
            <RefreshCw size={16} />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const rolConfig = configuracionRol(
    usuario.rol?.nombre
  );

  const IconoRol = rolConfig.icono;

  const operacionEnCurso =
    guardandoDatos ||
    guardandoRol ||
    desactivando;

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

      {/* =============================================
          ENCABEZADO INSTITUCIONAL
      ============================================= */}

      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-blue-700" />

        <div className="flex flex-col justify-between gap-5 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <UserRound
                size={27}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                Administración institucional
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Detalle del usuario
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                Consultá los datos de la cuenta,
                administrá su rol y gestioná su acceso
                a Invenet.
              </p>
            </div>
          </div>

          {/* BOTONES DEL ENCABEZADO */}

          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
            <button
              type="button"
              onClick={() => cargarUsuario(true)}
              disabled={
                actualizando ||
                operacionEnCurso ||
                editando
              }
              className={botonSecundario}
            >
              <RefreshCw
                size={17}
                className={
                  actualizando
                    ? "animate-spin"
                    : ""
                }
              />
              Actualizar
            </button>

            {puedeDesactivar && (
              <button
                type="button"
                onClick={manejarDesactivacion}
                disabled={
                  esCuentaPropia ||
                  operacionEnCurso ||
                  editando ||
                  actualizando
                }
                title={
                  esCuentaPropia
                    ? "No podés desactivar tu propia cuenta"
                    : "Dar de baja usuario"
                }
                className={botonPeligro}
              >
                {desactivando ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <UserRoundX size={17} />
                )}

                {desactivando
                  ? "Desactivando..."
                  : "Dar de baja"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* =============================================
          ERROR PERSISTENTE DE CONSULTA
      ============================================= */}

      <MensajeError
        mensaje={error}
        onCerrar={() => setError("")}
      />

      {/* =============================================
          RESUMEN DEL USUARIO
      ============================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">

          {/* AVATAR */}

          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl font-bold text-blue-700">
            {inicialesUsuario(usuario)}
          </div>

          {/* DATOS PRINCIPALES */}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {nombreCompleto(usuario)}
              </h2>

              {esCuentaPropia && (
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                  Tu cuenta
                </span>
              )}
            </div>

            <p className="mt-2 flex items-center gap-2 break-all text-sm text-slate-500">
              <Mail
                size={15}
                className="shrink-0"
              />
              {usuario.email || "Sin correo"}
            </p>

            <p className="mt-2 text-xs font-medium text-slate-400">
              Identificador de usuario #{usuario.id}
            </p>
          </div>

          {/* ESTADO Y ROL */}

          <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
            <RolBadge
              nombre={usuario.rol?.nombre}
            />

            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 size={14} />
              Activo
            </span>
          </div>
        </div>
      </section>

      {/* =============================================
          TARJETAS DE INFORMACIÓN
      ============================================= */}

      <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">

        {/* =============================================
            INFORMACIÓN PERSONAL
        ============================================= */}

        <section className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <EncabezadoSeccion
            icono={UserRound}
            titulo="Información personal"
            descripcion="Datos de identificación y contacto del usuario."
            accion={
              puedeEditar && !editando ? (
                <button
                  type="button"
                  onClick={comenzarEdicion}
                  disabled={
                    operacionEnCurso ||
                    actualizando
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
                >
                  <Pencil size={16} />
                  Editar datos
                </button>
              ) : null
            }
          />

          <div className="flex-1 p-5 sm:p-6">
            {editando ? (
              <form
                onSubmit={guardarDatos}
                noValidate
                className="flex h-full flex-col"
              >
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <CampoFormulario
                      id="nombre"
                      label="Nombre"
                      value={formulario.nombre}
                      onChange={manejarCambioDatos}
                      error={erroresDatos.nombre}
                      maxLength={100}
                      disabled={guardandoDatos}
                      placeholder="Nombre del usuario"
                    />

                    <CampoFormulario
                      id="apellido"
                      label="Apellido"
                      value={formulario.apellido}
                      onChange={manejarCambioDatos}
                      error={erroresDatos.apellido}
                      maxLength={100}
                      disabled={guardandoDatos}
                      placeholder="Apellido del usuario"
                    />
                  </div>

                  <CampoFormulario
                    id="email"
                    label="Correo electrónico"
                    type="email"
                    value={formulario.email}
                    onChange={manejarCambioDatos}
                    error={erroresDatos.email}
                    maxLength={150}
                    disabled={guardandoDatos}
                    placeholder="correo@institucion.edu.ar"
                  />
                </div>

                <div className="mt-auto flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={cancelarEdicion}
                    disabled={guardandoDatos}
                    className={botonSecundario}
                  >
                    <X size={16} />
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={guardandoDatos}
                    className={botonPrincipal}
                  >
                    {guardandoDatos ? (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Save size={17} />
                    )}

                    {guardandoDatos
                      ? "Guardando..."
                      : "Guardar cambios"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <CampoInformacion
                  etiqueta="Nombre"
                  valor={usuario.nombre}
                  icono={UserRound}
                />

                <CampoInformacion
                  etiqueta="Apellido"
                  valor={usuario.apellido}
                  icono={UserRound}
                />

                <div className="sm:col-span-2">
                  <CampoInformacion
                    etiqueta="Correo electrónico"
                    valor={usuario.email}
                    icono={Mail}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* =============================================
            ROL Y PERMISOS
        ============================================= */}

        <section className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <EncabezadoSeccion
            icono={ShieldCheck}
            titulo="Rol y permisos"
            descripcion="Nivel de acceso asignado a esta cuenta."
          />

          <div className="flex-1 space-y-5 p-5 sm:p-6">

            {/* ROL ACTUAL */}

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Rol actual
              </p>

              <div className="mt-3 flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${rolConfig.clases}`}
                >
                  <IconoRol size={21} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">
                    {usuario.rol?.nombre || "Sin rol"}
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {rolConfig.descripcion}
                  </p>
                </div>
              </div>
            </div>

            {/* CAMBIAR ROL */}

            {puedeCambiarRol && (
              <div className="space-y-4 border-t border-slate-100 pt-5">
                {esCuentaPropia ? (
                  <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <LockKeyhole
                      size={18}
                      className="mt-0.5 shrink-0 text-amber-700"
                    />

                    <p className="text-xs leading-relaxed text-amber-800">
                      Por seguridad, no podés modificar
                      el rol de tu propia cuenta.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={guardarRol}
                    className="space-y-4"
                  >
                    <div>
                      <label
                        htmlFor="rol_id"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Cambiar rol
                      </label>

                      <div className="relative">
                        <select
                          id="rol_id"
                          value={rolSeleccionado}
                          onChange={(event) => {
                            if (
                              operacionRef.current
                            ) {
                              return;
                            }

                            setRolSeleccionado(
                              event.target.value
                            );
                          }}
                          disabled={
                            cargandoRoles ||
                            guardandoRol ||
                            operacionEnCurso ||
                            editando ||
                            actualizando
                          }
                          className={`${estiloInput} appearance-none pr-10`}
                        >
                          <option value="">
                            Seleccioná un rol
                          </option>

                          {rolActualId &&
                            !roles.some(
                              (rol) =>
                                String(rol.id) ===
                                rolActualId
                            ) && (
                              <option
                                value={rolActualId}
                              >
                                {usuario.rol?.nombre ||
                                  "Rol actual"}
                              </option>
                            )}

                          {roles.map((rol) => (
                            <option
                              key={rol.id}
                              value={rol.id}
                            >
                              {rol.nombre}
                            </option>
                          ))}
                        </select>

                        <ChevronDown
                          size={16}
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                      </div>
                    </div>

                    {/* ERROR PERSISTENTE DE ROLES */}

                    {errorRoles && (
                      <div
                        role="alert"
                        className="rounded-xl border border-amber-200 bg-amber-50 p-3"
                      >
                        <p className="text-xs text-amber-800">
                          {errorRoles}
                        </p>

                        <button
                          type="button"
                          onClick={cargarRoles}
                          disabled={
                            cargandoRoles ||
                            operacionEnCurso
                          }
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 underline disabled:opacity-50"
                        >
                          <RefreshCw
                            size={13}
                            className={
                              cargandoRoles
                                ? "animate-spin"
                                : ""
                            }
                          />
                          Reintentar
                        </button>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={
                        operacionEnCurso ||
                        cargandoRoles ||
                        roles.length === 0 ||
                        !rolModificado ||
                        editando ||
                        actualizando
                      }
                      className={`w-full ${botonPrincipal}`}
                    >
                      {guardandoRol ? (
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                      ) : (
                        <ShieldCheck size={17} />
                      )}

                      {guardandoRol
                        ? "Procesando..."
                        : "Guardar nuevo rol"}
                    </button>

                    <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-3">
                      <Info
                        size={16}
                        className="mt-0.5 shrink-0 text-blue-700"
                      />

                      <p className="text-xs leading-relaxed text-blue-800">
                        Cambiar el rol modifica los
                        permisos y las funciones
                        disponibles para este usuario.
                      </p>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
