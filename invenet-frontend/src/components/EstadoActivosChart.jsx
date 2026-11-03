
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Monitor,
  Wrench,
  Archive,
} from "lucide-react";

// =====================================================
// CONFIGURACIÓN DE ESTADOS
// =====================================================

const configuracionEstados = {
  Operativo: {
    barra: "bg-emerald-500",
    fondo: "bg-emerald-50",
    texto: "text-emerald-700",
    borde: "border-emerald-100",
    icono: CheckCircle2,
  },

  "En reparación": {
    barra: "bg-amber-500",
    fondo: "bg-amber-50",
    texto: "text-amber-700",
    borde: "border-amber-100",
    icono: Wrench,
  },

  "Con anomalía": {
    barra: "bg-red-500",
    fondo: "bg-red-50",
    texto: "text-red-700",
    borde: "border-red-100",
    icono: AlertTriangle,
  },

  "Dado de baja": {
    barra: "bg-slate-400",
    fondo: "bg-slate-100",
    texto: "text-slate-600",
    borde: "border-slate-200",
    icono: Archive,
  },
};

const configuracionPredeterminada = {
  barra: "bg-blue-500",
  fondo: "bg-blue-50",
  texto: "text-blue-700",
  borde: "border-blue-100",
  icono: Monitor,
};

const formatearNumero = (valor) =>
  Number(valor ?? 0).toLocaleString("es-AR");

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function EstadoActivosChart({
  estados = [],
  total = 0,
}) {
  const totalNumerico = Number(total ?? 0);

  const estadosOrdenados = [...estados].sort((a, b) => {
    const orden = [
      "Operativo",
      "En reparación",
      "Con anomalía",
      "Dado de baja",
    ];

    const posicionA = orden.indexOf(a.estado);
    const posicionB = orden.indexOf(b.estado);

    return (
      (posicionA === -1 ? 999 : posicionA) -
      (posicionB === -1 ? 999 : posicionB)
    );
  });

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* =============================================
          ENCABEZADO
      ============================================= */}

      <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Distribución de activos por estado
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Representación de los equipos según su estado operativo.
          </p>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <Activity size={17} className="text-blue-700" />

          <span className="text-xs font-medium text-slate-500">
            Total de activos
          </span>

          <span className="ml-1 text-sm font-bold text-slate-900">
            {formatearNumero(totalNumerico)}
          </span>
        </div>
      </div>

      {/* =============================================
          SIN DATOS
      ============================================= */}

      {estadosOrdenados.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Monitor size={27} strokeWidth={1.7} />
          </div>

          <h3 className="mt-4 text-sm font-semibold text-slate-800">
            Sin información disponible
          </h3>

          <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
            Todavía no hay activos registrados para mostrar
            estadísticas por estado.
          </p>
        </div>
      ) : (
        <div className="p-6">

          {/* =============================================
              LISTADO DE ESTADOS
          ============================================= */}

          <div className="space-y-5">
            {estadosOrdenados.map((item) => {
              const cantidad = Number(item.total ?? 0);

              const porcentaje =
                totalNumerico > 0
                  ? Math.min(
                      100,
                      Math.max(
                        0,
                        (cantidad / totalNumerico) * 100
                      )
                    )
                  : 0;

              const configuracion =
                configuracionEstados[item.estado] ??
                configuracionPredeterminada;

              const Icono = configuracion.icono;

              return (
                <div
                  key={item.estado}
                  className="rounded-xl border border-slate-100 bg-white p-4 transition-colors hover:bg-slate-50/60"
                >
                  {/* DATOS DEL ESTADO */}

                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${configuracion.fondo} ${configuracion.texto} ${configuracion.borde}`}
                      >
                        <Icono size={19} strokeWidth={1.8} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {item.estado}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          Estado del inventario
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold tabular-nums text-slate-900">
                        {formatearNumero(cantidad)}
                      </span>

                      <span
                        className={`min-w-[70px] rounded-lg px-2.5 py-1.5 text-center text-xs font-bold tabular-nums ${configuracion.fondo} ${configuracion.texto}`}
                      >
                        {porcentaje.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* BARRA DE PROGRESO */}

                  <div
                    className="h-2.5 overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-label={`Porcentaje de activos en estado ${item.estado}`}
                    aria-valuenow={porcentaje}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${configuracion.barra}`}
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* =============================================
              INFORMACIÓN COMPLEMENTARIA
          ============================================= */}

          <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-slate-400">
              Los porcentajes representan la proporción de cada estado
              respecto del total de activos registrados.
            </p>

            <span className="shrink-0 text-xs font-medium text-slate-400">
              Inventario institucional
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
