
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";

// =====================================================
// CONFIGURACIÓN VISUAL
// =====================================================

const CONFIGURACION = {
  success: {
    titulo: "Operación exitosa",
    icono: CheckCircle2,
    iconoClase: "text-emerald-600",
    fondoIcono: "bg-emerald-50",
    borde: "border-l-emerald-500",
  },
  error: {
    titulo: "Ocurrió un error",
    icono: AlertCircle,
    iconoClase: "text-red-600",
    fondoIcono: "bg-red-50",
    borde: "border-l-red-500",
  },
  warning: {
    titulo: "Atención",
    icono: AlertTriangle,
    iconoClase: "text-amber-600",
    fondoIcono: "bg-amber-50",
    borde: "border-l-amber-500",
  },
  info: {
    titulo: "Información",
    icono: Info,
    iconoClase: "text-blue-700",
    fondoIcono: "bg-blue-50",
    borde: "border-l-blue-600",
  },
};

// =====================================================
// TOAST INDIVIDUAL
// =====================================================

function ToastItem({ toast, onCerrar }) {
  const configuracion =
    CONFIGURACION[toast.tipo] ?? CONFIGURACION.info;

  const Icono = configuracion.icono;

  return (
    <div
      role={toast.tipo === "error" ? "alert" : "status"}
      className={`pointer-events-auto w-full overflow-hidden rounded-2xl border border-slate-200 border-l-4 bg-white shadow-lg shadow-slate-900/10 ${configuracion.borde}`}
    >
      <div className="flex items-start gap-3 p-4">

        {/* ÍCONO */}

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${configuracion.fondoIcono}`}
        >
          <Icono
            size={21}
            strokeWidth={2}
            className={configuracion.iconoClase}
          />
        </div>

        {/* CONTENIDO */}

        <div className="min-w-0 flex-1 pt-0.5">

          <p className="text-sm font-bold text-slate-800">
            {toast.titulo || configuracion.titulo}
          </p>

          <p className="mt-1 break-words text-sm leading-relaxed text-slate-600">
            {toast.mensaje}
          </p>

        </div>

        {/* CERRAR */}

        <button
          type="button"
          onClick={() => onCerrar(toast.id)}
          aria-label="Cerrar notificación"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <X size={17} />
        </button>

      </div>
    </div>
  );
}

// =====================================================
// CONTENEDOR GLOBAL
// =====================================================

export default function ToastContainer({
  toasts = [],
  onCerrar,
}) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-label="Notificaciones del sistema"
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-[390px] flex-col gap-3 sm:bottom-6 sm:right-6"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onCerrar={onCerrar}
        />
      ))}
    </div>
  );
}
