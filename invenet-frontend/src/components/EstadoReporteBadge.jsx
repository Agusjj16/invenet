export default function EstadoReporteBadge({ estado }) {
  const configuracion = {
    Pendiente: {
      clases: "border-amber-200 bg-amber-50 text-amber-800",
      punto: "bg-amber-500",
    },
    "En revisión": {
      clases: "border-yellow-200 bg-yellow-50 text-yellow-700",
      punto: "bg-yellow-500",
    },
    "Derivado a reparación": {
      clases: "border-red-200 bg-red-50 text-red-700",
      punto: "bg-red-500",
    },
    Cerrado: {
      clases: "border-emerald-200 bg-emerald-50 text-emerald-700",
      punto: "bg-emerald-500",
    },
  };

  const nombre = estado || "Sin estado";

  const estilo = configuracion[nombre] ?? {
    clases: "border-slate-200 bg-slate-50 text-slate-700",
    punto: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex gap-2 items-center rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${estilo.clases}`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${estilo.punto}`}
      />

      {nombre}
    </span>
  );
}
