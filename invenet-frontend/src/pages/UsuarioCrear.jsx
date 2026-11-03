
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Link, useNavigate } from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
  UserRoundPlus,
  Users,
  Wrench,
} from "lucide-react";

import {
  crearUsuario,
  obtenerUsuarios,
} from "../services/usuarioService";

import { useFeedback } from "../context/FeedbackContext";

// =====================================================
// CONFIGURACIÓN INICIAL
// =====================================================

const formularioInicial = {
  nombre: "",
  apellido: "",
  email: "",
  password: "",
  password_confirmation: "",
  rol_id: "",
};

// =====================================================
// ESTILOS COMPARTIDOS
// =====================================================

const botonSecundario =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const botonPrincipal =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50";

const campoBase =
  "w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

function clasesCampo(error) {
  return `${campoBase} ${
    error
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"
  }`;
}

// =====================================================
// CONFIGURACIÓN DE ROLES
// =====================================================

function configuracionRol(nombre) {
  switch (nombre) {
    case "Administrador":
      return {
        Icono: ShieldCheck,
        clases:
          "border-violet-200 bg-violet-50 text-violet-700",
        descripcion:
          "Acceso a las funciones administrativas asignadas al rol.",
      };

    case "Docente":
      return {
        Icono: GraduationCap,
        clases:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        descripcion:
          "Acceso a las funciones institucionales asignadas al rol.",
      };

    case "Técnico":
      return {
        Icono: Wrench,
        clases:
          "border-blue-200 bg-blue-50 text-blue-700",
        descripcion:
          "Acceso a las funciones técnicas asignadas al rol.",
      };

    default:
      return {
        Icono: UserRound,
        clases:
          "border-slate-200 bg-slate-50 text-slate-700",
        descripcion:
          "El usuario recibirá los permisos asociados a este rol.",
      };
  }
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function obtenerMensajeError(error, alternativo) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    alternativo
  );
}

function normalizarErroresLaravel(errores) {
  if (
    !errores ||
    typeof errores !== "object" ||
    Array.isArray(errores)
  ) {
    return {};
  }

  const resultado = {};

  Object.entries(errores).forEach(
    ([campo, mensajes]) => {
      resultado[campo] = Array.isArray(mensajes)
        ? mensajes[0]
        : String(mensajes);
    }
  );

  return resultado;
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
// COMPONENTE: CAMPO DE FORMULARIO
// =====================================================

function Campo({
  etiqueta,
  nombre,
  valor,
  onChange,
  error,
  tipo = "text",
  placeholder = "",
  maxLength,
  autoComplete,
  disabled = false,
  icono: Icono,
  children,
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={nombre}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {etiqueta}
        <span className="ml-1 text-red-500">*</span>
      </label>

      <div className="relative">
        {Icono && (
          <Icono
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
        )}

        <input
          id={nombre}
          name={nombre}
          type={tipo}
          value={valor}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${nombre}-error` : undefined
          }
          className={`${clasesCampo(error)} ${
            Icono ? "pl-11" : ""
          } ${children ? "pr-12" : ""}`}
        />

        {children}
      </div>

      {error && (
        <p
          id={`${nombre}-error`}
          className="mt-1.5 text-xs font-medium text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// =====================================================
// COMPONENTE: ENCABEZADO DE SECCIÓN
// =====================================================

function EncabezadoSeccion({
  icono: Icono,
  titulo,
  descripcion,
}) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
        <Icono size={21} strokeWidth={1.8} />
      </div>

      <div className="min-w-0">
        <h2 className="text-base font-bold tracking-tight text-slate-900">
          {titulo}
        </h2>

        <p className="mt-1 text-sm leading-relaxed text-slate-500">
          {descripcion}
        </p>
      </div>
    </div>
  );
}

// =====================================================
// PÁGINA PRINCIPAL
// =====================================================

export default function UsuarioCrear() {
  const navigate = useNavigate();

  const { toast } = useFeedback();

  // =====================================================
  // REFERENCIAS DE CONTROL
  // =====================================================

  const montadoRef = useRef(false);
  const guardandoRef = useRef(false);
  const solicitudRolesRef = useRef(0);

  const toastRef = useRef(toast);
  toastRef.current = toast;

  // =====================================================
  // ESTADOS
  // =====================================================

  const [formulario, setFormulario] = useState(
    formularioInicial
  );

  const [roles, setRoles] = useState([]);

  const [cargandoRoles, setCargandoRoles] =
    useState(true);

  const [guardando, setGuardando] = useState(false);

  const [errorRoles, setErrorRoles] = useState("");

  const [erroresCampos, setErroresCampos] =
    useState({});

  const [mostrarPassword, setMostrarPassword] =
    useState(false);

  const [mostrarConfirmacion, setMostrarConfirmacion] =
    useState(false);

  // =====================================================
  // CONTROL DE MONTAJE
  // =====================================================

  useEffect(() => {
    montadoRef.current = true;

    return () => {
      montadoRef.current = false;
      solicitudRolesRef.current += 1;
    };
  }, []);

  // =====================================================
  // CARGAR ROLES EXISTENTES
  // =====================================================

  const cargarRoles = useCallback(async () => {
    const numeroSolicitud =
      ++solicitudRolesRef.current;

    if (montadoRef.current) {
      setCargandoRoles(true);
      setErrorRoles("");
    }

    try {
      const respuesta = await obtenerUsuarios();

      const usuarios = extraerUsuarios(respuesta);

      const mapaRoles = new Map();

      usuarios.forEach((usuario) => {
        const rol = usuario?.rol;

        if (
          rol?.id != null &&
          rol?.nombre &&
          !mapaRoles.has(String(rol.id))
        ) {
          mapaRoles.set(String(rol.id), {
            id: rol.id,
            nombre: rol.nombre,
          });
        }
      });

      const rolesEncontrados = Array.from(
        mapaRoles.values()
      ).sort((a, b) =>
        a.nombre.localeCompare(b.nombre, "es")
      );

      if (
        !montadoRef.current ||
        numeroSolicitud !== solicitudRolesRef.current
      ) {
        return;
      }

      setRoles(rolesEncontrados);

      // Evitar que quede seleccionado un rol que
      // ya no aparece entre los disponibles.
      setFormulario((anterior) => {
        if (!anterior.rol_id) {
          return anterior;
        }

        const sigueDisponible =
          rolesEncontrados.some(
            (rol) =>
              String(rol.id) ===
              String(anterior.rol_id)
          );

        return sigueDisponible
          ? anterior
          : {
              ...anterior,
              rol_id: "",
            };
      });

      if (rolesEncontrados.length === 0) {
        setErrorRoles(
          "No se encontraron roles disponibles entre los usuarios registrados."
        );
      }
    } catch (err) {
      console.error(
        "Error al consultar los roles:",
        err
      );

      if (
        !montadoRef.current ||
        numeroSolicitud !== solicitudRolesRef.current
      ) {
        return;
      }

      setRoles([]);

      setErrorRoles(
        obtenerMensajeError(
          err,
          "No se pudieron cargar los roles."
        )
      );
    } finally {
      if (
        montadoRef.current &&
        numeroSolicitud === solicitudRolesRef.current
      ) {
        setCargandoRoles(false);
      }
    }
  }, []);

  useEffect(() => {
    cargarRoles();
  }, [cargarRoles]);

  // =====================================================
  // ACTUALIZAR CAMPOS
  // =====================================================

  const manejarCambio = (event) => {
    const { name, value } = event.target;

    if (guardandoRef.current) {
      return;
    }

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));

    setErroresCampos((anterior) => ({
      ...anterior,
      [name]: "",
    }));
  };

  // =====================================================
  // VALIDACIÓN DEL FORMULARIO
  // =====================================================

  const validarFormulario = () => {
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
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      errores.email =
        "Ingresá un correo electrónico válido.";
    } else if (email.length > 150) {
      errores.email =
        "El correo no puede superar los 150 caracteres.";
    }

    if (!formulario.password) {
      errores.password =
        "Ingresá una contraseña.";
    } else if (formulario.password.length < 8) {
      errores.password =
        "La contraseña debe tener al menos 8 caracteres.";
    }

    if (!formulario.password_confirmation) {
      errores.password_confirmation =
        "Confirmá la contraseña.";
    } else if (
      formulario.password !==
      formulario.password_confirmation
    ) {
      errores.password_confirmation =
        "Las contraseñas no coinciden.";
    }

    const rolSeleccionado = roles.some(
      (rol) =>
        String(rol.id) ===
        String(formulario.rol_id)
    );

    if (!rolSeleccionado) {
      errores.rol_id =
        "Seleccioná un rol válido.";
    }

    setErroresCampos(errores);

    return Object.keys(errores).length === 0;
  };

  // =====================================================
  // GUARDAR USUARIO
  // =====================================================

  const manejarGuardar = async (event) => {
    event.preventDefault();

    // Bloqueo inmediato contra doble envío.
    if (guardandoRef.current) {
      return;
    }

    if (
      cargandoRoles ||
      roles.length === 0
    ) {
      toastRef.current.warning(
        "No hay roles disponibles para crear el usuario."
      );
      return;
    }

    if (!validarFormulario()) {
      toastRef.current.warning(
        "Revisá los campos marcados antes de continuar."
      );
      return;
    }

    guardandoRef.current = true;
    setGuardando(true);
    setErroresCampos({});

    const datos = {
      nombre: formulario.nombre.trim(),
      apellido: formulario.apellido.trim(),
      email: formulario.email.trim(),
      password: formulario.password,
      password_confirmation:
        formulario.password_confirmation,
      rol_id: Number(formulario.rol_id),
    };

    try {
      await crearUsuario(datos);

      if (!montadoRef.current) {
        return;
      }

      // La notificación se muestra directamente
      // mediante el FeedbackContext.
      // No enviamos location.state.mensaje para
      // evitar un segundo Toast en Usuarios.jsx.
      toastRef.current.success(
        "Usuario creado correctamente."
      );

      navigate("/usuarios", {
        replace: true,
      });
    } catch (err) {
      console.error(
        "Error al crear el usuario:",
        err
      );

      if (!montadoRef.current) {
        return;
      }

      const estado = err?.response?.status;

      const mensaje = obtenerMensajeError(
        err,
        "No se pudo crear el usuario. Revisá los datos ingresados."
      );

      if (estado === 422) {
        const erroresLaravel =
          normalizarErroresLaravel(
            err?.response?.data?.errors
          );

        setErroresCampos(erroresLaravel);

        if (
          Object.keys(erroresLaravel).length > 0
        ) {
          toastRef.current.warning(
            "Algunos datos no son válidos. Revisá los campos señalados."
          );
        } else {
          toastRef.current.warning(mensaje);
        }
      } else if (estado === 403) {
        toastRef.current.error(
          "No tenés permisos para crear usuarios."
        );
      } else if (estado === 409) {
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
  // ROL SELECCIONADO
  // =====================================================

  const rolSeleccionado = useMemo(() => {
    return roles.find(
      (rol) =>
        String(rol.id) ===
        String(formulario.rol_id)
    );
  }, [roles, formulario.rol_id]);

  const configuracionSeleccionada =
    configuracionRol(rolSeleccionado?.nombre);

  const IconoRol =
    configuracionSeleccionada.Icono;

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
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <UserRoundPlus
                size={27}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                Administración institucional
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Crear nuevo usuario
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                Registrá una nueva cuenta de acceso a
                Invenet, configurá sus credenciales y
                asignale un rol institucional.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* =============================================
          FORMULARIO DE CREACIÓN
      ============================================= */}

      <form
        onSubmit={manejarGuardar}
        noValidate
        className="space-y-5"
      >

        {/* =============================================
            CAJA 2 - DATOS PERSONALES
        ============================================= */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <EncabezadoSeccion
            icono={UserRound}
            titulo="Datos personales"
            descripcion="Información de identificación y contacto del nuevo usuario."
          />

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">

            {/* NOMBRE */}

            <Campo
              etiqueta="Nombre"
              nombre="nombre"
              valor={formulario.nombre}
              onChange={manejarCambio}
              error={erroresCampos.nombre}
              placeholder="Ej.: Juan"
              maxLength={100}
              autoComplete="given-name"
              disabled={guardando}
              icono={UserRound}
            />

            {/* APELLIDO */}

            <Campo
              etiqueta="Apellido"
              nombre="apellido"
              valor={formulario.apellido}
              onChange={manejarCambio}
              error={erroresCampos.apellido}
              placeholder="Ej.: Pérez"
              maxLength={100}
              autoComplete="family-name"
              disabled={guardando}
              icono={UserRound}
            />

            {/* CORREO */}

            <div className="sm:col-span-2">
              <Campo
                etiqueta="Correo electrónico"
                nombre="email"
                tipo="email"
                valor={formulario.email}
                onChange={manejarCambio}
                error={erroresCampos.email}
                placeholder="usuario@institucion.edu.ar"
                maxLength={150}
                autoComplete="off"
                disabled={guardando}
                icono={Mail}
              />
            </div>
          </div>
        </section>

        {/* =============================================
            CAJA 3 - ROL DEL USUARIO
        ============================================= */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <EncabezadoSeccion
            icono={ShieldCheck}
            titulo="Rol del usuario"
            descripcion="Seleccioná el rol que determinará los permisos y funciones disponibles."
          />

          <div className="p-5 sm:p-6">

            {/* ERROR AL CARGAR ROLES */}

            {errorRoles && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
              >
                <AlertCircle
                  size={19}
                  className="mt-0.5 shrink-0 text-amber-700"
                />

                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">
                    {errorRoles}
                  </p>

                  <button
                    type="button"
                    onClick={cargarRoles}
                    disabled={
                      cargandoRoles ||
                      guardando
                    }
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-800 underline disabled:opacity-50"
                  >
                    <RefreshCw
                      size={14}
                      className={
                        cargandoRoles
                          ? "animate-spin"
                          : ""
                      }
                    />
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            {/* SELECTOR DE ROL */}

            <div className="max-w-xl">
              <label
                htmlFor="rol_id"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Seleccionar rol
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <div className="relative">
                <select
                  id="rol_id"
                  name="rol_id"
                  value={formulario.rol_id}
                  onChange={manejarCambio}
                  disabled={
                    guardando ||
                    cargandoRoles ||
                    roles.length === 0
                  }
                  aria-invalid={Boolean(
                    erroresCampos.rol_id
                  )}
                  aria-describedby={
                    erroresCampos.rol_id
                      ? "rol_id-error"
                      : undefined
                  }
                  className={`${clasesCampo(
                    erroresCampos.rol_id
                  )} appearance-none pr-11`}
                >
                  <option value="">
                    {cargandoRoles
                      ? "Cargando roles..."
                      : "Seleccioná un rol"}
                  </option>

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
                  size={17}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              {erroresCampos.rol_id && (
                <p
                  id="rol_id-error"
                  className="mt-1.5 text-xs font-medium text-red-600"
                >
                  {erroresCampos.rol_id}
                </p>
              )}
            </div>

            {/* ROL SELECCIONADO */}

            {rolSeleccionado && (
              <div
                className={`mt-5 flex max-w-xl items-start gap-3 rounded-xl border p-4 ${configuracionSeleccionada.clases}`}
              >
                <IconoRol
                  size={22}
                  className="mt-0.5 shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">
                    {rolSeleccionado.nombre}
                  </p>

                  <p className="mt-1 text-xs leading-relaxed opacity-90">
                    {
                      configuracionSeleccionada.descripcion
                    }
                  </p>
                </div>

                <CheckCircle2
                  size={18}
                  className="shrink-0"
                />
              </div>
            )}
          </div>
        </section>

        {/* =============================================
            CAJA 4 - CREDENCIALES
        ============================================= */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <EncabezadoSeccion
            icono={LockKeyhole}
            titulo="Credenciales de acceso"
            descripcion="Configurá la contraseña inicial para que el usuario pueda ingresar al sistema."
          />

          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

              {/* CONTRASEÑA */}

              <Campo
                etiqueta="Contraseña"
                nombre="password"
                tipo={
                  mostrarPassword
                    ? "text"
                    : "password"
                }
                valor={formulario.password}
                onChange={manejarCambio}
                error={erroresCampos.password}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                disabled={guardando}
                icono={KeyRound}
              >
                <button
                  type="button"
                  onClick={() =>
                    setMostrarPassword(
                      (valor) => !valor
                    )
                  }
                  disabled={guardando}
                  aria-label={
                    mostrarPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                  aria-pressed={mostrarPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  {mostrarPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </Campo>

              {/* CONFIRMAR CONTRASEÑA */}

              <Campo
                etiqueta="Confirmar contraseña"
                nombre="password_confirmation"
                tipo={
                  mostrarConfirmacion
                    ? "text"
                    : "password"
                }
                valor={
                  formulario.password_confirmation
                }
                onChange={manejarCambio}
                error={
                  erroresCampos.password_confirmation
                }
                placeholder="Repetí la contraseña"
                autoComplete="new-password"
                disabled={guardando}
                icono={KeyRound}
              >
                <button
                  type="button"
                  onClick={() =>
                    setMostrarConfirmacion(
                      (valor) => !valor
                    )
                  }
                  disabled={guardando}
                  aria-label={
                    mostrarConfirmacion
                      ? "Ocultar confirmación"
                      : "Mostrar confirmación"
                  }
                  aria-pressed={mostrarConfirmacion}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  {mostrarConfirmacion ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </Campo>
            </div>

            {/* RECOMENDACIÓN DE SEGURIDAD */}

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <LockKeyhole
                size={19}
                className="mt-0.5 shrink-0 text-slate-500"
              />

              <p className="text-sm leading-relaxed text-slate-600">
                La contraseña debe contener al menos
                8 caracteres. Por seguridad, utilizá
                una contraseña única y difícil de adivinar.
              </p>
            </div>
          </div>
        </section>

        {/* =============================================
            ACCIONES DEL FORMULARIO
        ============================================= */}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/usuarios"
            className={`${botonSecundario} px-6 py-3`}
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={
              guardando ||
              cargandoRoles ||
              roles.length === 0
            }
            className={`${botonPrincipal} px-6 py-3`}
          >
            {guardando ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Guardando usuario...
              </>
            ) : (
              <>
                <Save size={18} />
                Crear usuario
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
