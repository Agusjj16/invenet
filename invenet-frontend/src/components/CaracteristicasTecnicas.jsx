import { Cpu } from "lucide-react";

// =====================================
// FORMATEAR VALOR SEGÚN TIPO DE DATO
// =====================================

function formatearValor(caracteristica) {
  const valor = caracteristica.pivot?.valor;
  const tipo = caracteristica.tipo_dato;
  const unidad = caracteristica.unidad;

  // Si no tiene valor registrado
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return "No especificado";
  }

  // Características booleanas
  if (tipo === "booleano") {
    if (
      valor === true ||
      valor === 1 ||
      valor === "1" ||
      valor === "true"
    ) {
      return "Sí";
    }

    if (
      valor === false ||
      valor === 0 ||
      valor === "0" ||
      valor === "false"
    ) {
      return "No";
    }
  }

  // Texto, números, decimales y select
  const valorFormateado = String(valor);

  if (unidad) {
    return `${valorFormateado} ${unidad}`;
  }

  return valorFormateado;
}

// =====================================
// COMPONENTE PRINCIPAL
// =====================================

export default function CaracteristicasTecnicas({
  caracteristicas = [],
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      {/* ENCABEZADO */}

      <div className="mb-6 flex items-center gap-3">
        <Cpu
          size={23}
          className="text-blue-600"
        />

        <h2 className="text-lg font-semibold text-slate-900">
          Características técnicas
        </h2>
      </div>

      {/* SIN CARACTERÍSTICAS */}

      {caracteristicas.length === 0 ? (
        <div className="rounded-xl bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-500">
            Este activo no tiene características técnicas registradas.
          </p>
        </div>
      ) : (

        /* LISTADO DINÁMICO */

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {caracteristicas.map((caracteristica) => (
            <div
              key={caracteristica.id}
              className="rounded-xl border border-slate-100 bg-slate-50 p-4"
            >
              <dt className="text-sm text-slate-500">
                {caracteristica.nombre}
              </dt>

              <dd className="mt-2 break-words text-base font-semibold text-slate-900">
                {formatearValor(caracteristica)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}