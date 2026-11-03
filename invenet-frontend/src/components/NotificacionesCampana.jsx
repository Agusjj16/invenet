
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Link, useLocation } from "react-router-dom";

import {
  ArrowRight,
  Bell,
  Check,
  CheckCheck,
  Clock3,
  Inbox,
  Loader2,
  RefreshCw,
} from "lucide-react";

import {
  obtenerNotificaciones,
  obtenerCantidadNoLeidas,
  marcarNotificacionLeida,
  marcarTodasLeidas,
} from "../services/notificacionService";

import {
  EVENTO_NOTIFICACIONES_ACTUALIZADAS,
  emitirNotificacionesActualizadas,
} from "../utils/notificacionesEventos";

// =====================================
// CONFIGURACIÓN
// =====================================

const INTERVALO_ACTUALIZACION = 60_000;
const MAXIMO_RECIENTES = 5;

// =====================================
// FUNCIONES AUXILIARES
// =====================================

function formatearFecha(fecha) {
  if (!fecha) return "";

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) return "";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(valor);
}

function obtenerRuta(url) {
  if (typeof url !== "string") return null;

  const ruta = url.trim().replace(/\/+$/, "");

  if (!ruta.startsWith("/") || ruta.startsWith("//")) {
    return null;
  }

  const reporte = ruta.match(
    /^\/(?:reportes-anomalias|reportes)\/(\d+)$/
  );

  if (reporte) {
    return `/reportes/${reporte[1]}`;
  }

  const orden = ruta.match(
    /^\/ordenes-reparacion\/(\d+)$/
  );

  if (orden) {
    return `/ordenes-reparacion/${orden[1]}`;
  }

  const activo = ruta.match(/^\/activos\/(\d+)$/);

  if (activo) {
    return `/activos/${activo[1]}`;
  }

  return null;
}

// =====================================
// COMPONENTE PRINCIPAL
// =====================================

export default function NotificacionesCampana() {
  const location = useLocation();

  const [abierto, setAbierto] = useState(false);

  const [cantidad, setCantidad] = useState(0);
  const [notificaciones, setNotificaciones] = useState([]);

  const [cargandoLista, setCargandoLista] = useState(false);
  const [actualizandoContador, setActualizandoContador] =
    useState(false);

  const [procesandoId, setProcesandoId] = useState(null);
  const [procesandoTodas, setProcesandoTodas] = useState(false);

  const [error, setError] = useState("");

  const contenedorRef = useRef(null);

  // Guardamos las solicitudes en curso para no repetirlas.
  const consultaContadorRef = useRef(null);
  const consultaListaRef = useRef(null);

  // Controlamos si el componente sigue montado.
  const montadoRef = useRef(false);

  // Evitamos refrescar dos veces al montar por la ruta.
  const primeraRutaRef = useRef(true);

  // Permite consultar el estado actual desde los listeners.
  const abiertoRef = useRef(false);

  // =====================================
  // CONSULTAR SOLO EL CONTADOR
  // =====================================

  const cargarContador = useCallback(async () => {
    // Si ya hay una consulta en curso, la reutilizamos.
    if (consultaContadorRef.current) {
      return consultaContadorRef.current;
    }

    const consulta = (async () => {
      if (montadoRef.current) {
        setActualizandoContador(true);
      }

      try {
        const respuesta = await obtenerCantidadNoLeidas();

        if (montadoRef.current) {
          setCantidad(Number(respuesta.cantidad) || 0);
        }
      } catch (err) {
        console.error(
          "Error al actualizar contador de notificaciones:",
          err
        );
      } finally {
        if (montadoRef.current) {
          setActualizandoContador(false);
        }
      }
    })();

    consultaContadorRef.current = consulta;

    try {
      await consulta;
    } finally {
      if (consultaContadorRef.current === consulta) {
        consultaContadorRef.current = null;
      }
    }
  }, []);

  // =====================================
  // CONSULTAR NOTIFICACIONES RECIENTES
  // =====================================

  const cargarRecientes = useCallback(async () => {
    if (consultaListaRef.current) {
      return consultaListaRef.current;
    }

    const consulta = (async () => {
      if (montadoRef.current) {
        setCargandoLista(true);
        setError("");
      }

      try {
        const respuesta = await obtenerNotificaciones({
          page: 1,
          filtro: "todas",
        });

        const registros = Array.isArray(respuesta)
          ? respuesta
          : respuesta.data ?? [];

        if (montadoRef.current) {
          setNotificaciones(
            registros.slice(0, MAXIMO_RECIENTES)
          );
        }
      } catch (err) {
        console.error(
          "Error al cargar notificaciones recientes:",
          err
        );

        if (montadoRef.current) {
          setError(
            err.response?.data?.message ||
              "No se pudieron cargar las notificaciones."
          );
        }
      } finally {
        if (montadoRef.current) {
          setCargandoLista(false);
        }
      }
    })();

    consultaListaRef.current = consulta;

    try {
      await consulta;
    } finally {
      if (consultaListaRef.current === consulta) {
        consultaListaRef.current = null;
      }
    }
  }, []);

  // =====================================
  // ACTUALIZAR CAMPANA
  // =====================================

  const actualizarCampana = useCallback(async () => {
    if (document.visibilityState === "hidden") {
      return;
    }

    // El contador siempre se actualiza.
    // El listado solo se consulta si el panel está abierto.
    const solicitudes = [cargarContador()];

    if (abiertoRef.current) {
      solicitudes.push(cargarRecientes());
    }

    await Promise.all(solicitudes);
  }, [cargarContador, cargarRecientes]);

  // =====================================
  // MONTAJE Y SINCRONIZACIÓN AUTOMÁTICA
  // =====================================

  useEffect(() => {
    montadoRef.current = true;

    // Primera consulta: únicamente el contador.
    cargarContador();

    // Una sola actualización cada 60 segundos.
    const intervalo = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        cargarContador();
      }
    }, INTERVALO_ACTUALIZACION);

    // Cuando se vuelve a la pestaña, actualizamos.
    const manejarVisibilidad = () => {
      if (document.visibilityState === "visible") {
        actualizarCampana();
      }
    };

    // Cuando se vuelve a enfocar la ventana.
    const manejarFoco = () => {
      if (document.visibilityState === "visible") {
        actualizarCampana();
      }
    };

    // Cambios realizados desde la bandeja completa.
    const manejarEvento = () => {
      actualizarCampana();
    };

    document.addEventListener(
      "visibilitychange",
      manejarVisibilidad
    );

    window.addEventListener("focus", manejarFoco);

    window.addEventListener(
      EVENTO_NOTIFICACIONES_ACTUALIZADAS,
      manejarEvento
    );

    return () => {
      montadoRef.current = false;

      window.clearInterval(intervalo);

      document.removeEventListener(
        "visibilitychange",
        manejarVisibilidad
      );

      window.removeEventListener("focus", manejarFoco);

      window.removeEventListener(
        EVENTO_NOTIFICACIONES_ACTUALIZADAS,
        manejarEvento
      );
    };
  }, [cargarContador, actualizarCampana]);

  // =====================================
  // ABRIR O CERRAR EL PANEL
  // =====================================

  const cambiarApertura = () => {
    if (abierto) {
      abiertoRef.current = false;
      setAbierto(false);
      return;
    }

    abiertoRef.current = true;
    setAbierto(true);

    // Al abrir, consultamos los registros recientes
    // y actualizamos el contador.
    cargarRecientes();
    cargarContador();
  };

  const cerrarPanel = useCallback(() => {
    abiertoRef.current = false;
    setAbierto(false);
  }, []);

  // =====================================
  // CERRAR AL NAVEGAR
  // =====================================

  useEffect(() => {
    cerrarPanel();

    // En el montaje inicial ya se consulta el contador.
    if (primeraRutaRef.current) {
      primeraRutaRef.current = false;
      return;
    }

    cargarContador();
  }, [location.pathname, cerrarPanel, cargarContador]);

  // =====================================
  // CERRAR AL HACER CLIC FUERA
  // =====================================

  useEffect(() => {
    if (!abierto) return;

    const manejarClickFuera = (event) => {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(event.target)
      ) {
        cerrarPanel();
      }
    };

    const manejarEscape = (event) => {
      if (event.key === "Escape") {
        cerrarPanel();
      }
    };

    document.addEventListener(
      "mousedown",
      manejarClickFuera
    );

    document.addEventListener(
      "keydown",
      manejarEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        manejarClickFuera
      );

      document.removeEventListener(
        "keydown",
        manejarEscape
      );
    };
  }, [abierto, cerrarPanel]);

  // =====================================
  // MARCAR UNA COMO LEÍDA
  // =====================================

  const manejarMarcarLeida = async (id) => {
    if (procesandoId || procesandoTodas) return;

    setProcesandoId(id);
    setError("");

    try {
      await marcarNotificacionLeida(id);

      // Actualizamos inmediatamente el registro local.
      setNotificaciones((anteriores) =>
        anteriores.map((notificacion) =>
          notificacion.id === id
            ? {
                ...notificacion,
                read_at: new Date().toISOString(),
              }
            : notificacion
        )
      );

      // Sincronizamos el contador y la bandeja.
      emitirNotificacionesActualizadas();

      await cargarContador();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "No se pudo marcar la notificación."
      );
    } finally {
      setProcesandoId(null);
    }
  };

  // =====================================
  // MARCAR TODAS COMO LEÍDAS
  // =====================================

  const manejarMarcarTodas = async () => {
    if (
      procesandoTodas ||
      procesandoId ||
      cantidad === 0
    ) {
      return;
    }

    setProcesandoTodas(true);
    setError("");

    try {
      await marcarTodasLeidas();

      const fecha = new Date().toISOString();

      setNotificaciones((anteriores) =>
        anteriores.map((notificacion) => ({
          ...notificacion,
          read_at: notificacion.read_at || fecha,
        }))
      );

      setCantidad(0);

      emitirNotificacionesActualizadas();

      await cargarContador();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "No se pudieron marcar todas como leídas."
      );
    } finally {
      setProcesandoTodas(false);
    }
  };

  // =====================================
  // RENDERIZADO
  // =====================================

  return (
    <div ref={contenedorRef} className="relative">

      {/* BOTÓN DE CAMPANA */}

      <button
        type="button"
        onClick={cambiarApertura}
        aria-label={`Notificaciones, ${cantidad} sin leer`}
        aria-expanded={abierto}
        aria-haspopup="dialog"
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition ${
          abierto
            ? "bg-slate-700 text-blue-400"
            : "text-slate-300 hover:bg-slate-800 hover:text-white"
        }`}
      >
        <Bell size={21} />

        {cantidad > 0 && (
          <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-slate-900">
            {cantidad > 99 ? "99+" : cantidad}
          </span>
        )}
      </button>

      {/* PANEL DESPLEGABLE */}

      {abierto && (
        <div
          role="dialog"
          aria-label="Notificaciones recientes"
          className="absolute right-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl sm:w-96"
        >

          {/* ENCABEZADO */}

          <div className="border-b border-slate-100 px-5 py-4">

            <div className="flex items-center justify-between gap-3">

              <div>
                <h2 className="font-bold text-slate-900">
                  Notificaciones
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {cantidad === 0
                    ? "No tenés notificaciones pendientes"
                    : `${cantidad} sin leer`}
                </p>
              </div>

              <button
                type="button"
                onClick={actualizarCampana}
                disabled={
                  cargandoLista ||
                  actualizandoContador ||
                  procesandoTodas ||
                  Boolean(procesandoId)
                }
                aria-label="Actualizar notificaciones"
                title="Actualizar"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={
                    cargandoLista || actualizandoContador
                      ? "animate-spin"
                      : ""
                  }
                />
              </button>

            </div>

            {cantidad > 0 && (
              <button
                type="button"
                onClick={manejarMarcarTodas}
                disabled={
                  procesandoTodas ||
                  Boolean(procesandoId) ||
                  cargandoLista
                }
                className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-blue-700 hover:text-blue-800 disabled:opacity-50"
              >
                {procesandoTodas ? (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <CheckCheck size={15} />
                )}

                Marcar todas como leídas
              </button>
            )}

          </div>

          {/* ERROR */}

          {error && (
            <div
              role="alert"
              className="border-b border-red-100 bg-red-50 px-5 py-3 text-xs text-red-700"
            >
              {error}
            </div>
          )}

          {/* LISTADO */}

          <div className="max-h-96 overflow-y-auto">

            {cargandoLista && notificaciones.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
                <Loader2
                  size={19}
                  className="animate-spin text-blue-600"
                />
                Cargando...
              </div>
            ) : notificaciones.length === 0 ? (
              <div className="px-5 py-12 text-center">

                <Inbox
                  size={32}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  No hay notificaciones
                </p>

              </div>
            ) : (
              <div className="divide-y divide-slate-100">

                {notificaciones.map((notificacion) => {
                  const datos = notificacion.data ?? {};
                  const leida = Boolean(notificacion.read_at);
                  const ruta = obtenerRuta(datos.url);

                  return (
                    <div
                      key={notificacion.id}
                      className={`px-5 py-4 ${
                        leida
                          ? "bg-white"
                          : "bg-blue-50/50"
                      }`}
                    >

                      <div className="flex items-start gap-3">

                        <div
                          className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            leida
                              ? "bg-slate-100 text-slate-500"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          <Bell size={17} />
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-start justify-between gap-2">

                            <p className="text-sm font-semibold text-slate-900">
                              {datos.titulo || "Notificación"}
                            </p>

                            {!leida && (
                              <span
                                title="Sin leer"
                                className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600"
                              />
                            )}

                          </div>

                          <p className="mt-1 text-xs leading-relaxed text-slate-600">
                            {datos.mensaje || "Sin descripción"}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-3">

                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                              <Clock3 size={12} />
                              {formatearFecha(
                                notificacion.created_at
                              )}
                            </span>

                            {ruta && (
                              <Link
                                to={ruta}
                                onClick={cerrarPanel}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
                              >
                                Ver detalle
                                <ArrowRight size={13} />
                              </Link>
                            )}

                          </div>

                          {!leida && (
                            <button
                              type="button"
                              onClick={() =>
                                manejarMarcarLeida(
                                  notificacion.id
                                )
                              }
                              disabled={
                                Boolean(procesandoId) ||
                                procesandoTodas
                              }
                              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 disabled:opacity-50"
                            >
                              {procesandoId ===
                              notificacion.id ? (
                                <Loader2
                                  size={13}
                                  className="animate-spin"
                                />
                              ) : (
                                <Check size={13} />
                              )}

                              Marcar como leída
                            </button>
                          )}

                        </div>

                      </div>

                    </div>
                  );
                })}

              </div>
            )}

          </div>

          {/* PIE DEL PANEL */}

          <div className="border-t border-slate-100 bg-slate-50 p-3">

            <Link
              to="/notificaciones"
              onClick={cerrarPanel}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Ver todas las notificaciones
              <ArrowRight size={16} />
            </Link>

          </div>

        </div>
      )}

    </div>
  );
}
