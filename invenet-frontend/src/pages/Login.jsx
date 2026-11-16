
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setEnviando(true);

    try {
      await login(email, password);
    } catch (error) {
      if (error.response?.status === 422) {
        setError("El correo o la contraseña son incorrectos.");
      } else if (error.response?.status === 419) {
        setError("La sesión expiró. Intentá nuevamente.");
      } else if (error.response?.status === 429) {
        setError("Demasiados intentos. Esperá unos minutos.");
      } else {
        setError("No se pudo iniciar sesión. Verificá la conexión.");
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Encabezado */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3">
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
          </div>

          <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600 sm:block">
            ESCOM N.º 44
          </span>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10 sm:py-14">
        {/* Elementos decorativos */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-emerald-100/50 blur-3xl"
        />

        <div className="relative w-full max-w-[440px]">
          {/* Identidad */}
          <div className="mb-7 text-center">
            <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl border border-slate-100 bg-white p-3 shadow-sm">
              <img
                src={logo}
                alt=""
                className="h-full w-full object-contain"
              />
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Bienvenido a Invenet
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Sistema de gestión y seguimiento
              <br />
              de activos informáticos
            </p>
          </div>

          {/* Formulario */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-9">
            <div className="mb-7">
              <h2 className="text-lg font-semibold text-slate-900">
                Iniciar sesión
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Ingresá tus credenciales para continuar.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Correo electrónico */}
              <div>
                <label
                  htmlFor="email"
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
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ingresá tu correo electrónico"
                    autoComplete="username"
                    required
                    disabled={enviando}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-700"
                  >
                    Contraseña
                  </label>

                  <Link
                    to="/recuperar-password"
                    className="text-xs font-semibold text-blue-600 transition hover:text-blue-700 hover:underline"
                  >
                    ¿La olvidaste?
                  </Link>
                </div>

                <div className="relative">
                  <Lock
                    size={19}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    type={mostrarPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresá tu contraseña"
                    autoComplete="current-password"
                    required
                    disabled={enviando}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() => setMostrarPassword((prev) => !prev)}
                    aria-label={
                      mostrarPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    aria-pressed={mostrarPassword}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                  >
                    {mostrarPassword ? (
                      <EyeOff size={19} aria-hidden="true" />
                    ) : (
                      <Eye size={19} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* Mensajes de error */}
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              {/* Botón de acceso */}
              <button
                type="submit"
                disabled={enviando}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {enviando ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Ingresando...
                  </>
                ) : (
                  <>
                    Iniciar sesión
                    <ArrowRight size={18} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            {/* Información de seguridad */}
            <div className="mt-7 flex items-center justify-center gap-2 border-t border-slate-100 pt-6">
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

          {/* Institución */}
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
