import { useState } from "react";
import { MonitorCog, Mail, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login } = useAuth();

    const [error, setError] = useState("");
    const [enviando, setEnviando] = useState(false);

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
              <MonitorCog className="h-8 w-8 text-blue-600" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              Bienvenido a Invenet
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Sistema de gestión de activos informáticos
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Correo electrónico
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@escuela.edu.ar"
                  autoComplete="username"
                  required
                  className="w-full rounded-lg border border-slate-300 py-3 pl-11 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Contraseña
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresá tu contraseña"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-lg border border-slate-300 py-3 pl-11 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="text-right">
              <Link
                to="/recuperar-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {error && (
            <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
                {error}
            </div>
            )}

            <button
                type="submit"
                disabled={enviando}
                className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                {enviando ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Acceso exclusivo para personal autorizado
          </p>
        </div>
      </main>
    </div>
  );
}