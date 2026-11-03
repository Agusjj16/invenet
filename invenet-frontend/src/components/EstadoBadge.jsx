export default function EstadoBadge({ estado }) {
  const estilos = {
    Operativo: "bg-green-100 text-green-700",
    "Con anomalía": "bg-red-100 text-red-700",
    "En reparación": "bg-yellow-100 text-yellow-700",
    "Dado de baja": "bg-red-100 text-red-700",
  };

  const estilo =
    estilos[estado] ?? "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${estilo}`}
    >
      {estado ?? "Sin estado"}
    </span>
  );
}