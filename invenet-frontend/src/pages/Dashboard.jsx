
import { useCallback, useEffect, useState } from "react";

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileCheck2,
  FileSearch,
  LayoutDashboard,
  Monitor,
  RefreshCw,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { obtenerDashboard } from "../services/dashboardService";
import EstadoActivosChart from "../components/EstadoActivosChart";

// =====================================================
// CONFIGURACIÓN VISUAL
// =====================================================

const colores = {
  blue: {
    icono: "bg-blue-50 text-blue-700 ring-blue-100",
    numero: "text-blue-700",
    acento: "bg-blue-600",
  },
  green: {
    icono: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    numero: "text-emerald-700",
    acento: "bg-emerald-500",
  },
  amber: {
    icono: "bg-amber-50 text-amber-700 ring-amber-100",
    numero: "text-amber-700",
    acento: "bg-amber-500",
  },
  red: {
    icono: "bg-red-50 text-red-700 ring-red-100",
    numero: "text-red-700",
    acento: "bg-red-500",
  },
  slate: {
    icono: "bg-slate-100 text-slate-700 ring-slate-200",
    numero: "text-slate-800",
    acento: "bg-slate-500",
  },
};

const formatearNumero = (valor) =>
  Number(valor ?? 0).toLocaleString("es-AR");

function Indicador({
  titulo,
  valor,
  icono: Icono,
  color = "blue",
  descripcion,
}) {
  const estilo = colores[color] ?? colores.blue;

  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className={`absolute inset-x-0 top-0 h-1 ${estilo.acento}`} />

      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${estilo.icono}`}
        >
          <Icono size={21} strokeWidth={1.8} />
        </div>

        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Indicador
        </span>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-slate-500">
          {titulo}
        </p>

        <p className={`mt-2 text-4xl font-bold tracking-tight ${estilo.numero}`}>
          {formatearNumero(valor)}
        </p>

        {descripcion && (
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            {descripcion}
          </p>
        )}
      </div>
    </article>
  );
}

function EncabezadoSeccion({
  icono: Icono,
  titulo,
  descripcion,
  etiqueta,
}) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm">
          <Icono size={19} strokeWidth={1.8} />
        </div>

        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            {titulo}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {descripcion}
          </p>
        </div>
      </div>

      {etiqueta && (
        <span className="w-fit rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
          {etiqueta}
        </span>
      )}
    </div>
  );
}

function FilaResumen({
  titulo,
  valor,
  total,
  color,
  icono: Icono,
}) {
  const cantidad = Number(valor ?? 0);
  const totalNumerico = Number(total ?? 0);

  const porcentaje =
    totalNumerico > 0
      ? Math.min(100, Math.max(0, (cantidad / totalNumerico) * 100))
      : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${color.fondo}`}
          >
            <Icono size={17} className={color.texto} />
          </div>

          <span className="text-sm font-semibold text-slate-700">
            {titulo}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-slate-900">
            {formatearNumero(cantidad)}
          </span>

          <span className="w-14 text-right text-xs font-medium text-slate-500">
            {porcentaje.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${color.barra} transition-all duration-500`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
}

// =====================================================
// DASHBOARD PRINCIPAL
// =====================================================

export default function Dashboard() {
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState("");

  const cargarDashboard = useCallback(async (esActualizacion = false) => {
    if (esActualizacion) {
      setActualizando(true);
    } else {
      setCargando(true);
    }

    setError("");

    try {
      const datos = await obtenerDashboard();
      setDashboard(datos);
    } catch (err) {
      console.error("Error al cargar dashboard:", err);
      setError("No se pudieron cargar las estadísticas. Intentá nuevamente.");
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, []);

  useEffect(() => {
    cargarDashboard();
  }, [cargarDashboard]);

  // =====================================================
  // USUARIO Y ROLES
  // =====================================================

  const rol = user?.rol?.nombre;

  const esAdministrador = rol === "Administrador";
  const esDocente = rol === "Docente";
  const esTecnico = rol === "Técnico";

  // =====================================================
  // ESTADÍSTICAS
  // =====================================================

  const totalActivos = Number(dashboard?.activos?.total ?? 0);
  const estados = dashboard?.activos?.por_estado ?? [];

  const obtenerCantidadEstado = (nombreEstado) => {
    const estado = estados.find(
      (item) => item.estado === nombreEstado
    );

    return Number(estado?.total ?? 0);
  };

  const activosOperativos = obtenerCantidadEstado("Operativo");
  const activosEnReparacion = obtenerCantidadEstado("En reparación");
  const activosConAnomalias = obtenerCantidadEstado("Con anomalía");

  const porcentajeOperativos =
    totalActivos > 0
      ? (activosOperativos / totalActivos) * 100
      : 0;

  const activosRequierenAtencion =
  activosConAnomalias + activosEnReparacion;

  const activosSinIntervencion = Math.max(
    0,
    totalActivos - activosRequierenAtencion
  );

  const porcentajeAtencion =
    totalActivos > 0
      ? (activosRequierenAtencion / totalActivos) * 100
      : 0;

  const reportes = dashboard?.reportes;
  const ordenes = dashboard?.ordenes;

  // =====================================================
  // PANTALLA DE CARGA
  // =====================================================

  if (cargando) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50">
          <RefreshCw
            size={27}
            className="animate-spin text-blue-700"
          />
        </div>

        <h2 className="mt-5 text-base font-bold text-slate-800">
          Preparando el panel de control
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Cargando información del inventario...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-8 pb-10">

      {/* =================================================
          MENSAJES DE ERROR
      ================================================= */}

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="shrink-0 text-red-600" />

            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => cargarDashboard(true)}
            className="text-sm font-semibold text-red-700 underline underline-offset-2"
          >
            Reintentar
          </button>
        </div>
      )}

      {dashboard && (
        <>

          {/* =============================================
              INDICADORES DE INVENTARIO
          ============================================= */}

          <section>
            <EncabezadoSeccion
              icono={Monitor}
              titulo="Estado del inventario"
              descripcion="Resumen actualizado de los activos tecnológicos registrados."
              etiqueta="Inventario institucional"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Indicador
                titulo="Total de activos"
                valor={totalActivos}
                icono={Monitor}
                color="blue"
                descripcion="Equipos registrados en el sistema"
              />

              <Indicador
                titulo="Activos operativos"
                valor={activosOperativos}
                icono={CheckCircle2}
                color="green"
                descripcion="Equipos disponibles para su utilización"
              />

              <Indicador
                titulo="En reparación"
                valor={activosEnReparacion}
                icono={Wrench}
                color="amber"
                descripcion="Equipos en proceso de reparación"
              />

              <Indicador
                titulo="Con anomalías"
                valor={activosConAnomalias}
                icono={AlertTriangle}
                color="red"
                descripcion="Equipos que requieren atención"
              />
            </div>
          </section>

          {/* =============================================
              DISTRIBUCIÓN E ÍNDICE DE OPERATIVIDAD
          ============================================= */}

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">

            
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-3">
              <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-slate-900">
                    Atención del inventario
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Equipos que requieren seguimiento o intervención técnica.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
                  <ClipboardList size={20} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-medium text-slate-500">
                    Requieren atención
                  </p>

                  <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
                    {formatearNumero(activosRequierenAtencion)}
                  </p>

                  <p className="mt-2 text-xs font-medium text-slate-500">
                    {porcentajeAtencion.toFixed(1)}% del inventario
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-5">
                  <p className="text-sm font-medium text-emerald-800">
                    Sin intervención pendiente
                  </p>

                  <p className="mt-3 text-4xl font-bold tracking-tight text-emerald-700">
                    {formatearNumero(activosSinIntervencion)}
                  </p>

                  <p className="mt-2 text-xs font-medium text-emerald-700">
                    Según los estados registrados
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50/50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-700">
                      <AlertTriangle size={18} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Con anomalías
                      </p>
                      <p className="text-xs text-slate-500">
                        Equipos pendientes de atención
                      </p>
                    </div>
                  </div>

                  <span className="text-lg font-bold text-red-700">
                    {formatearNumero(activosConAnomalias)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                      <Wrench size={18} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        En reparación
                      </p>
                      <p className="text-xs text-slate-500">
                        Equipos bajo intervención técnica
                      </p>
                    </div>
                  </div>

                  <span className="text-lg font-bold text-amber-700">
                    {formatearNumero(activosEnReparacion)}
                  </span>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <p className="text-xs leading-relaxed text-slate-400">
                  Los indicadores se calculan a partir de los estados
                  actuales de los activos registrados.
                </p>
              </div>
            </article>

            <article className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-slate-900 p-6 text-white shadow-sm xl:col-span-2">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/10" />
              <div className="pointer-events-none absolute -right-7 -top-7 h-36 w-36 rounded-full border border-white/10" />

              <div className="relative">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                    <Activity size={22} />
                  </div>

                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                    Disponibilidad
                  </span>
                </div>

                <p className="text-sm font-medium text-slate-300">
                  Índice de operatividad
                </p>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-5xl font-bold tracking-tight sm:text-6xl">
                    {porcentajeOperativos.toFixed(1)}
                  </span>

                  <span className="text-2xl font-medium text-emerald-300">
                    %
                  </span>
                </div>

                <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
                  Proporción de activos que se encuentran en condiciones operativas.
                </p>
              </div>

              <div className="relative mt-10">
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-300">
                    Equipos operativos
                  </span>

                  <span className="font-semibold text-emerald-300">
                    {formatearNumero(activosOperativos)} de{" "}
                    {formatearNumero(totalActivos)}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, porcentajeOperativos))}%`,
                    }}
                  />
                </div>

                <div className="mt-3 flex justify-between text-xs text-slate-500">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            </article>
          </section>

          {/* =============================================
              REPORTES
          ============================================= */}

          {reportes && (esAdministrador || esDocente) && (
            <section>
              <EncabezadoSeccion
                icono={ClipboardList}
                titulo={esAdministrador ? "Gestión de reportes" : "Mis reportes"}
                descripcion={
                  esAdministrador
                    ? "Seguimiento de las anomalías registradas en el sistema."
                    : "Estado de los reportes de anomalías que realizaste."
                }
                etiqueta="Reportes de anomalías"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Indicador
                  titulo={esAdministrador ? "Total de reportes" : "Mis reportes"}
                  valor={reportes.total}
                  icono={ClipboardList}
                  color="blue"
                />

                <Indicador
                  titulo="Pendientes"
                  valor={reportes.pendientes}
                  icono={Clock3}
                  color="amber"
                />

                <Indicador
                  titulo="En revisión"
                  valor={reportes.en_revision}
                  icono={FileSearch}
                  color="slate"
                />

                <Indicador
                  titulo="Cerrados"
                  valor={reportes.cerrados}
                  icono={FileCheck2}
                  color="green"
                />
              </div>
            </section>
          )}

          {/* =============================================
              ÓRDENES DE REPARACIÓN
          ============================================= */}

          {ordenes && (esAdministrador || esTecnico) && (
            <section>
              <EncabezadoSeccion
                icono={Wrench}
                titulo={
                  esAdministrador
                    ? "Órdenes de reparación"
                    : "Mis órdenes asignadas"
                }
                descripcion={
                  esAdministrador
                    ? "Control y seguimiento de las reparaciones del inventario."
                    : "Seguimiento de las reparaciones asignadas a tu usuario."
                }
                etiqueta="Mantenimiento técnico"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Indicador
                  titulo={esAdministrador ? "Total de órdenes" : "Mis órdenes"}
                  valor={ordenes.total}
                  icono={ClipboardList}
                  color="blue"
                />

                <Indicador
                  titulo="Pendientes"
                  valor={ordenes.pendientes}
                  icono={Clock3}
                  color="amber"
                />

                <Indicador
                  titulo="En proceso"
                  valor={ordenes.en_proceso}
                  icono={Wrench}
                  color="slate"
                />

                <Indicador
                  titulo="Finalizadas"
                  valor={ordenes.finalizadas}
                  icono={CheckCircle2}
                  color="green"
                />
              </div>
            </section>
          )}

          {/* =============================================
              GRÁFICO DEL INVENTARIO
          ============================================= */}

          <section>
            <EncabezadoSeccion
              icono={Activity}
              titulo="Análisis del inventario"
              descripcion="Visualización gráfica de los estados de los activos."
              etiqueta="Estadísticas"
            />

            <EstadoActivosChart
              estados={estados}
              total={totalActivos}
            />
          </section>
        </>
      )}
    </div>
  );
}
