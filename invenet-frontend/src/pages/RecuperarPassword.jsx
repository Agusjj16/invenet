
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import api from "../api/axios";
import logo from "../assets/logo.png";

export default function RecuperarPassword() {
  const navigate = useNavigate();

  const [paso, setPaso] = useState(1);
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const obtenerError = (err) => {
    if (err.response?.status === 429) {
      return "Demasiados intentos. Esperá unos minutos.";
    }

    if (err.response?.status === 419) {
      return "La sesión expiró. Actualizá la página e intentá nuevamente.";
    }

    const errores = err.response?.data?.errors;

    if (errores) {
      const primero = Object.values(errores)[0];
      if (Array.isArray(primero)) return primero[0];
    }

    return (
      err.response?.data?.message ||
      "Ocurrió un error. Intentá nuevamente."
    );
  };

  const solicitarCodigo = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    setMensaje("");

    try {
      await api.get("/sanctum/csrf-cookie");

      const { data } = await api.post(
        "/api/password/solicitar-codigo",
        { email }
      );

      setMensaje(data.message);
      setPaso(2);
    } catch (err) {
      setError(obtenerError(err));
    } finally {
      setCargando(false);
    }
  };

  const verificarCodigo = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    setMensaje("");

    try {
      const { data } = await api.post(
        "/api/password/verificar-codigo",
        { email, codigo }
      );

      setResetToken(data.reset_token);
      setMensaje(data.message);
      setPaso(3);
    } catch (err) {
      setError(obtenerError(err));
    } finally {
      setCargando(false);
    }
  };

  const restablecerPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);

    try {
      await api.post("/api/password/restablecer", {
        email,
        reset_token: resetToken,
        password,
        password_confirmation: passwordConfirmation,
      });

      setPaso(4);
      setCodigo("");
      setResetToken("");
      setPassword("");
      setPasswordConfirmation("");
      setMostrarPassword(false);
      setMostrarConfirmacion(false);
    } catch (err) {
      setError(obtenerError(err));
    } finally {
      setCargando(false);
    }
  };

  const titulos = {
    1: "Recuperar contraseña",
    2: "Verificar código",
    3: "Nueva contraseña",
    4: "Contraseña actualizada",
  };

  const descripciones = {
    1: "Ingresá el correo electrónico asociado a tu cuenta.",
    2: "Ingresá el código de seis dígitos enviado a tu correo.",
    3: "Establecé una nueva contraseña para tu cuenta.",
    4: "Ya podés ingresar a Invenet con tu nueva contraseña.",
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60";

  const buttonClass =
    "flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Encabezado */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
          <Link to="/login" className="flex items-center gap-3">
            <img
              src={logo}
              alt="Logo de Invenet"
              className="h-11 w-11 object-contain"
            />

            <div>
              <span className="block text-xl font-extrabold tracking-tight text-slate-900">
                INVENET
              </span>
              <span className="block text-[10px] font-medium uppercase tracking-widest text-slate-500">
                Gestión de activos
              </span>
            </div>
          </Link>

          <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600 sm:block">
            ESCOM N.º 44
          </span>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10 sm:py-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-emerald-100/50 blur-3xl"
        />

        <div className="relative w-full max-w-[440px]">
          {/* Identidad visual */}
          <div className="mb-7 text-center">
            <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl border border-slate-100 bg-white p-3 shadow-sm">
              <img
                src={logo}
                alt=""
                className="h-full w-full object-contain"
              />
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {titulos[paso]}
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              {descripciones[paso]}
            </p>
          </div>

          {/* Tarjeta */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-9">
            {/* Encabezado del paso */}
            <div className="mb-6 flex items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  paso === 4
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                {paso === 1 && <Mail size={22} />}
                {paso === 2 && <ShieldCheck size={22} />}
                {paso === 3 && <KeyRound size={22} />}
                {paso === 4 && <CheckCircle2 size={22} />}
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {paso === 1 && "Verificación de correo"}
                  {paso === 2 && "Confirmá tu identidad"}
                  {paso === 3 && "Restablecer acceso"}
                  {paso === 4 && "Proceso completado"}
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  {paso === 4
                    ? "Tu cuenta está lista para ingresar."
                    : `Paso ${paso} de 3`}
                </p>
              </div>
            </div>

            {/* Indicador de progreso */}
            {paso < 4 && (
              <div
                className="mb-7 flex items-center gap-2"
                aria-label={`Paso ${paso} de 3`}
              >
                {[1, 2, 3].map((numero) => (
                  <div
                    key={numero}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      paso >= numero
                        ? "bg-blue-600"
                        : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Mensaje informativo */}
            {mensaje && (
              <div
                role="status"
                className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              >
                {mensaje}
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {/* PASO 1: Solicitar código */}
            {paso === 1 && (
              <form
                onSubmit={solicitarCodigo}
                className="space-y-5"
              >
                <div>
                  <label
                    htmlFor="recovery-email"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Correo electrónico
                  </label>

                  <div className="relative">
                    <Mail
                      size={19}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="recovery-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={cargando}
                      autoComplete="email"
                      placeholder="Ingresá tu correo electrónico"
                      className={inputClass}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className={buttonClass}
                >
                  {cargando ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar código
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* PASO 2: Verificar código */}
            {paso === 2 && (
              <form
                onSubmit={verificarCodigo}
                className="space-y-5"
              >
                <div>
                  <label
                    htmlFor="recovery-code"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Código de verificación
                  </label>

                  <input
                    id="recovery-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={codigo}
                    onChange={(e) =>
                      setCodigo(
                        e.target.value.replace(/\D/g, "")
                      )
                    }
                    placeholder="000000"
                    required
                    disabled={cargando}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-center text-2xl font-semibold tracking-[0.35em] text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                  />

                  <p className="mt-2 text-center text-xs text-slate-500">
                    Revisá también la carpeta de correo no deseado.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={cargando || codigo.length !== 6}
                  className={buttonClass}
                >
                  {cargando ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      Verificar código
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={cargando}
                  onClick={() => {
                    setPaso(1);
                    setCodigo("");
                    setResetToken("");
                    setError("");
                    setMensaje("");
                  }}
                  className="w-full text-sm font-medium text-blue-600 transition hover:text-blue-700 hover:underline disabled:opacity-60"
                >
                  Solicitar otro código
                </button>
              </form>
            )}

            {/* PASO 3: Nueva contraseña */}
            {paso === 3 && (
              <form
                onSubmit={restablecerPassword}
                className="space-y-5"
              >
                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Nueva contraseña
                  </label>

                  <div className="relative">
                    <Lock
                      size={19}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="new-password"
                      type={
                        mostrarPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      autoComplete="new-password"
                      minLength={8}
                      required
                      disabled={cargando}
                      placeholder="Mínimo 8 caracteres"
                      className={inputClass}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setMostrarPassword((prev) => !prev)
                      }
                      aria-label={
                        mostrarPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      aria-pressed={mostrarPassword}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                    >
                      {mostrarPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Confirmar contraseña
                  </label>

                  <div className="relative">
                    <Lock
                      size={19}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="confirm-password"
                      type={
                        mostrarConfirmacion
                          ? "text"
                          : "password"
                      }
                      value={passwordConfirmation}
                      onChange={(e) =>
                        setPasswordConfirmation(e.target.value)
                      }
                      autoComplete="new-password"
                      minLength={8}
                      required
                      disabled={cargando}
                      placeholder="Repetí tu nueva contraseña"
                      className={inputClass}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setMostrarConfirmacion((prev) => !prev)
                      }
                      aria-label={
                        mostrarConfirmacion
                          ? "Ocultar confirmación"
                          : "Mostrar confirmación"
                      }
                      aria-pressed={mostrarConfirmacion}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                    >
                      {mostrarConfirmacion ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className={buttonClass}
                >
                  {cargando ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      Restablecer contraseña
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* PASO 4: Confirmación */}
            {paso === 4 && (
              <div className="space-y-6">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                  <CheckCircle2
                    size={36}
                    className="mx-auto mb-3 text-emerald-600"
                  />

                  <p className="text-sm font-medium text-emerald-800">
                    Tu contraseña fue actualizada correctamente.
                  </p>

                  <p className="mt-2 text-xs text-emerald-700">
                    Ya podés iniciar sesión con tus nuevas credenciales.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className={buttonClass}
                >
                  Ir al inicio de sesión
                  <ArrowRight size={18} />
                </button>
              </div>
            )}

            {/* Regresar al login */}
            {paso !== 4 && (
              <Link
                to="/login"
                className="mt-7 flex items-center justify-center gap-2 border-t border-slate-100 pt-6 text-sm font-medium text-slate-500 transition hover:text-blue-600"
              >
                <ArrowLeft size={17} />
                Volver al inicio de sesión
              </Link>
            )}

            <div className="mt-6 flex items-center justify-center gap-2">
              <ShieldCheck
                size={16}
                aria-hidden="true"
                className="text-emerald-600"
              />

              <p className="text-xs text-slate-500">
                Acceso exclusivo para personal autorizado
              </p>
            </div>
          </div>

          <p className="mt-7 text-center text-xs text-slate-400">
            Escuela Superior de Comercio N.º 44
          </p>
        </div>
      </main>

      {/* Pie de página */}
      <footer className="border-t border-slate-200 bg-white px-4 py-4">
        <p className="text-center text-xs text-slate-400">
          INVENET · Sistema de gestión de activos informáticos
        </p>
      </footer>
    </div>
  );
}
