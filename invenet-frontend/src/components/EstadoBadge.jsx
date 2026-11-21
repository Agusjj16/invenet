export default function EstadoBadge({ estado }) {
  const estilos = {
    Operativo: "border-green-200 bg-green-50 text-green-700",
    "Con anomalía": "border-red-200 bg-red-50 text-red-700",
    "En reparación": "border-yellow-200 bg-yellow-50 text-yellow-700",
    "Dado de baja": "border-red-200 bg-red-50 text-red-700",
  };

  const estilo =
    estilos[estado] ?? "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${estilo}`}
    >
      {estado ?? "Sin estado"}
    </span>
  );
}