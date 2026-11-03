
import { useEffect, useId, useRef } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  X,
} from "lucide-react";

// =====================================================
// CONFIGURACIÓN VISUAL
// =====================================================

const VARIANTES = {
  primary: {
    icono: HelpCircle,
    fondoIcono: "bg-blue-50",
    colorIcono: "text-blue-700",
    boton:
      "bg-blue-700 text-white hover:bg-blue-800 focus-visible:ring-blue-400",
  },
  danger: {
    icono: AlertTriangle,
    fondoIcono: "bg-red-50",
    colorIcono: "text-red-600",
    boton:
      "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-400",
  },
  warning: {
    icono: AlertTriangle,
    fondoIcono: "bg-amber-50",
    colorIcono: "text-amber-600",
    boton:
      "bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-400",
  },
  success: {
    icono: CheckCircle2,
    fondoIcono: "bg-emerald-50",
    colorIcono: "text-emerald-600",
    boton:
      "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-400",
  },
};

// =====================================================
// MODAL GLOBAL
// =====================================================

export default function ConfirmModal({
  confirmacion,
  onConfirmar,
  onCancelar,
}) {
  const tituloId = useId();
  const descripcionId = useId();

  const modalRef = useRef(null);
  const botonCancelarRef = useRef(null);
  const elementoAnteriorRef = useRef(null);

  const abierto = Boolean(confirmacion);

  // =====================================================
  // CONTROL DE FOCO Y TECLADO
  // =====================================================

  useEffect(() => {
    if (!abierto) return;

    elementoAnteriorRef.current = document.activeElement;

    const overflowAnterior = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    botonCancelarRef.current?.focus();

    const manejarTeclado = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancelar();
        return;
      }

      if (event.key !== "Tab") return;

      const elementos = Array.from(
        modalRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );

      if (elementos.length === 0) return;

      const primero = elementos[0];
      const ultimo = elementos[elementos.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === primero
      ) {
        event.preventDefault();
        ultimo.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === ultimo
      ) {
        event.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener("keydown", manejarTeclado);

    return () => {
      document.body.style.overflow = overflowAnterior;

      document.removeEventListener(
        "keydown",
        manejarTeclado
      );

      elementoAnteriorRef.current?.focus?.();
    };
  }, [abierto, onCancelar]);

  // =====================================================
  // NO RENDERIZAR SI ESTÁ CERRADO
  // =====================================================

  if (!confirmacion) {
    return null;
  }

  const variante =
    VARIANTES[confirmacion.variante] ??
    VARIANTES.primary;

  const Icono = variante.icono;

  // =====================================================
  // RENDERIZADO
  // =====================================================

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">

      {/* FONDO */}

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
      />

      {/* MODAL */}

      <div
        ref={modalRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={descripcionId}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >

        {/* LÍNEA INSTITUCIONAL */}

        <div className="h-1 bg-blue-700" />

        <div className="p-6">

          {/* ENCABEZADO */}

          <div className="flex items-start gap-4">

            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${variante.fondoIcono}`}
            >
              <Icono
                size={24}
                className={variante.colorIcono}
              />
            </div>

            <div className="min-w-0 flex-1 pt-0.5">

              <h2
                id={tituloId}
                className="text-lg font-bold text-slate-900"
              >
                {confirmacion.titulo}
              </h2>

              <p
                id={descripcionId}
                className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-slate-600"
              >
                {confirmacion.mensaje}
              </p>

            </div>

            <button
              type="button"
              onClick={onCancelar}
              aria-label="Cerrar confirmación"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <X size={19} />
            </button>

          </div>

          {/* ACCIONES */}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              ref={botonCancelarRef}
              type="button"
              onClick={onCancelar}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              {confirmacion.textoCancelar}
            </button>

            <button
              type="button"
              onClick={onConfirmar}
              className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 ${variante.boton}`}
            >
              {confirmacion.textoConfirmar}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}
