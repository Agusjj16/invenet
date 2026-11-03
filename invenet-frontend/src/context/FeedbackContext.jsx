import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import ToastContainer from "../components/ToastContainer";
import ConfirmModal from "../components/ConfirmModal";

// =====================================================
// CONTEXTO GLOBAL
// =====================================================

const FeedbackContext = createContext(null);

// =====================================================
// CONFIGURACIÓN
// =====================================================

const DURACIONES = {
  success: 4000,
  error: 6500,
  warning: 5000,
  info: 4000,
};

const MAX_TOASTS = 4;

// =====================================================
// PROVEEDOR GLOBAL
// =====================================================

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmacion, setConfirmacion] = useState(null);

  const contadorRef = useRef(0);
  const temporizadoresRef = useRef(new Map());
  const resolverConfirmacionRef = useRef(null);
  const confirmacionActivaRef = useRef(false);

  // =====================================================
  // ELIMINAR TOAST
  // =====================================================

  const cerrarToast = useCallback((id) => {
    const temporizador = temporizadoresRef.current.get(id);

    if (temporizador) {
      clearTimeout(temporizador);
      temporizadoresRef.current.delete(id);
    }

    setToasts((anteriores) =>
      anteriores.filter((toast) => toast.id !== id)
    );
  }, []);

  // =====================================================
  // CREAR TOAST
  // =====================================================

  const mostrarToast = useCallback(
    (tipo, mensaje, opciones = {}) => {
      contadorRef.current += 1;

      const id = contadorRef.current;

      const duracion =
        opciones.duracion === 0
          ? 0
          : typeof opciones.duracion === "number" &&
              opciones.duracion > 0
            ? opciones.duracion
            : DURACIONES[tipo] ?? DURACIONES.info;

      const nuevoToast = {
        id,
        tipo,
        mensaje: String(mensaje ?? ""),
        titulo: opciones.titulo ?? null,
        duracion,
      };

      setToasts((anteriores) => {
        const siguientes = [...anteriores, nuevoToast];

        if (siguientes.length <= MAX_TOASTS) {
          return siguientes;
        }

        const eliminados = siguientes.slice(
          0,
          siguientes.length - MAX_TOASTS
        );

        eliminados.forEach((toast) => {
          const temporizador =
            temporizadoresRef.current.get(toast.id);

          if (temporizador) {
            clearTimeout(temporizador);
            temporizadoresRef.current.delete(toast.id);
          }
        });

        return siguientes.slice(-MAX_TOASTS);
      });

      if (duracion > 0) {
        const temporizador = setTimeout(() => {
          cerrarToast(id);
        }, duracion);

        temporizadoresRef.current.set(id, temporizador);
      }

      return id;
    },
    [cerrarToast]
  );

  // =====================================================
  // API DE TOAST
  // =====================================================

  const toast = {
    success: (mensaje, opciones) =>
      mostrarToast("success", mensaje, opciones),

    error: (mensaje, opciones) =>
      mostrarToast("error", mensaje, opciones),

    warning: (mensaje, opciones) =>
      mostrarToast("warning", mensaje, opciones),

    info: (mensaje, opciones) =>
      mostrarToast("info", mensaje, opciones),

    dismiss: cerrarToast,
  };

  // =====================================================
  // RESOLVER CONFIRMACIÓN
  // =====================================================

  const resolverConfirmacion = useCallback((resultado) => {
    if (!confirmacionActivaRef.current) return;

    confirmacionActivaRef.current = false;

    const resolver = resolverConfirmacionRef.current;

    resolverConfirmacionRef.current = null;
    setConfirmacion(null);

    resolver?.(resultado);
  }, []);

  // =====================================================
  // SOLICITAR CONFIRMACIÓN
  // =====================================================

  const confirmar = useCallback((opciones = {}) => {
    if (confirmacionActivaRef.current) {
      return Promise.resolve(false);
    }

    confirmacionActivaRef.current = true;

    return new Promise((resolve) => {
      resolverConfirmacionRef.current = resolve;

      setConfirmacion({
        titulo: opciones.titulo ?? "Confirmar acción",
        mensaje:
          opciones.mensaje ??
          "¿Estás seguro de que querés continuar?",
        textoConfirmar:
          opciones.textoConfirmar ?? "Confirmar",
        textoCancelar:
          opciones.textoCancelar ?? "Cancelar",
        variante: opciones.variante ?? "primary",
      });
    });
  }, []);

  // =====================================================
  // LIMPIEZA AL DESMONTAR
  // =====================================================

  useEffect(() => {
    const temporizadores = temporizadoresRef.current;

    return () => {
      temporizadores.forEach((temporizador) => {
        clearTimeout(temporizador);
      });

      temporizadores.clear();

      if (resolverConfirmacionRef.current) {
        resolverConfirmacionRef.current(false);
        resolverConfirmacionRef.current = null;
      }

      confirmacionActivaRef.current = false;
    };
  }, []);

  // =====================================================
  // RENDERIZADO
  // =====================================================

  return (
    <FeedbackContext.Provider
      value={{
        toast,
        confirmar,
        cerrarToast,
      }}
    >
      {children}

      <ToastContainer
        toasts={toasts}
        onCerrar={cerrarToast}
      />

      <ConfirmModal
        confirmacion={confirmacion}
        onConfirmar={() => resolverConfirmacion(true)}
        onCancelar={() => resolverConfirmacion(false)}
      />
    </FeedbackContext.Provider>
  );
}

// =====================================================
// HOOK GLOBAL
// =====================================================

export function useFeedback() {
  const contexto = useContext(FeedbackContext);

  if (!contexto) {
    throw new Error(
      "useFeedback debe utilizarse dentro de FeedbackProvider."
    );
  }

  return contexto;
}
