export default function StatCard({
  titulo,
  valor,
  icono: Icono,
  color = "blue",
}) {
  const colores = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {titulo}
          </p>

          <p className="mt-3 text-3xl font-bold text-slate-900">
            {valor}
          </p>
        </div>

        <div
          className={`rounded-xl p-3 ${
            colores[color] ?? colores.blue
          }`}
        >
          <Icono size={23} />
        </div>
      </div>
    </div>
  );
}