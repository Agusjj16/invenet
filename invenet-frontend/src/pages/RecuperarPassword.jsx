import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  MonitorCog,
  ShieldCheck,
} from "lucide-react";
import api from "../api/axios";

export default function RecuperarPassword() {
  const navigate = useNavigate();

  const [paso, setPaso] = useState(1);
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
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
    } catch (err) {
      setError(obtenerError(err));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 px-6 py-4 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <MonitorCog className="text-blue-400" />
            <span className="text-xl font-bold">INVENET</span>
          </div>
          <span className="text-sm text-slate-300">
            ESCOM Nº44
          </span>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-72px)] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
              {paso === 1 && <Mail className="h-8 w-8 text-blue-600" />}
              {paso === 2 && <ShieldCheck className="h-8 w-8 text-blue-600" />}
              {paso === 3 && <KeyRound className="h-8 w-8 text-blue-600" />}
              {paso === 4 && <CheckCircle2 className="h-8 w-8 text-green-600" />}
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              {paso === 1 && "Recuperar contraseña"}
              {paso === 2 && "Verificar código"}
              {paso === 3 && "Nueva contraseña"}
              {paso === 4 && "Contraseña actualizada"}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {paso === 1 &&
                "Ingresá el correo electrónico asociado a tu cuenta."}
              {paso === 2 &&
                "Ingresá el código de seis dígitos enviado a tu correo."}
              {paso === 3 &&
                "Establecé una nueva contraseña para tu cuenta."}
              {paso === 4 &&
                "Ya podés ingresar a Invenet con tu nueva contraseña."}
            </p>
          </div>

          {paso < 4 && (
            <div className="mb-6 flex items-center gap-2">
              {[1, 2, 3].map((numero) => (
                <div
                  key={numero}
                  className={`h-2 flex-1 rounded-full ${
                    paso >= numero ? "bg-blue-600" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          )}

          {mensaje && (
            <div
              role="status"
              className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
            >
              {mensaje}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {paso === 1 && (
            <form onSubmit={solicitarCodigo} className="space-y-5">
              <div>
                <label
                  htmlFor="recovery-email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    id="recovery-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="usuario@correo.com"
                    className="w-full rounded-lg border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {cargando ? "Enviando..." : "Enviar código"}
              </button>
            </form>
          )}

          {paso === 2 && (
            <form onSubmit={verificarCodigo} className="space-y-5">
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
                    setCodigo(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="000000"
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-center text-2xl tracking-[0.4em] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={cargando || codigo.length !== 6}
                className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {cargando ? "Verificando..." : "Verificar código"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaso(1);
                  setCodigo("");
                  setError("");
                  setMensaje("");
                }}
                className="w-full text-sm font-medium text-blue-600 hover:underline"
              >
                Solicitar otro código
              </button>
            </form>
          )}

          {paso === 3 && (
            <form onSubmit={restablecerPassword} className="space-y-5">
              <div>
                <label
                  htmlFor="new-password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Nueva contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className="w-full rounded-lg border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
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
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    id="confirm-password"
                    type="password"
                    value={passwordConfirmation}
                    onChange={(e) =>
                      setPasswordConfirmation(e.target.value)
                    }
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className="w-full rounded-lg border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {cargando
                  ? "Actualizando..."
                  : "Restablecer contraseña"}
              </button>
            </form>
          )}

          {paso === 4 && (
            <div className="space-y-5">
              <div className="rounded-lg bg-green-50 p-4 text-center text-sm text-green-700">
                Tu contraseña fue actualizada correctamente.
              </div>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Ir al inicio de sesión
              </button>
            </div>
          )}

          {paso !== 4 && (
            <Link
              to="/login"
              className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          )}

          <p className="mt-6 text-center text-xs text-slate-400">
            Acceso exclusivo para personal autorizado
          </p>
        </div>
      </main>
    </div>
  );
}
