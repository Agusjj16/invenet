export default function EstadoOrdenBadge({ estado }) {
  const estilos = {
    Pendiente: "border-amber-200 bg-amber-50 text-amber-700",
    "En proceso": "border-yellow-200 bg-yellow-50 text-yellow-700",
    Finalizada: "border-green-200 bg-green-50 text-green-700",
  };

  const nombre = estado || "Sin estado";

  return (
    <span
      className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
        estilos[nombre] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {nombre}
    </span>
  );
}