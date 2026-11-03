export default function EstadoOrdenBadge({ estado }) {
  const estilos = {
    Pendiente: "bg-amber-100 text-amber-800",
    "En proceso": "bg-blue-100 text-blue-700",
    Finalizada: "bg-green-100 text-green-700",
  };

  const nombre = estado || "Sin estado";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${
        estilos[nombre] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {nombre}
    </span>
  );
}