export default function CaracteristicasForm({
  caracteristicas,
  valores,
  onChange,
  errores = {},
}) {
  if (caracteristicas.length === 0) {
    return (
      <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
        Esta categoría no tiene características técnicas configuradas.
      </p>
    );
  }

  const clasesInput =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {caracteristicas.map((caracteristica, indice) => {
        const obligatorio = Boolean(
          Number(caracteristica.pivot?.obligatorio)
        );

        const valor = valores[caracteristica.id] ?? "";

        const error =
          errores[`caracteristicas.${indice}.valor`]?.[0] ||
          errores[`caracteristicas.${indice}.caracteristica_id`]?.[0];

        const idCampo = `caracteristica-${caracteristica.id}`;

        return (
          <div key={caracteristica.id} className="space-y-2">
            <label
              htmlFor={idCampo}
              className="block text-sm font-medium text-slate-700"
            >
              {caracteristica.nombre}

              {caracteristica.unidad && (
                <span className="ml-1 text-slate-500">
                  ({caracteristica.unidad})
                </span>
              )}

              {obligatorio && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </label>

            {caracteristica.tipo_dato === "select" ? (
              <select
                id={idCampo}
                value={valor}
                required={obligatorio}
                onChange={(e) =>
                  onChange(caracteristica.id, e.target.value)
                }
                className={clasesInput}
              >
                <option value="">Seleccionar opción</option>

                {(caracteristica.opciones ?? []).map((opcion) => (
                  <option key={opcion.id} value={opcion.valor}>
                    {opcion.valor}
                  </option>
                ))}
              </select>
            ) : caracteristica.tipo_dato === "booleano" ? (
              <select
                id={idCampo}
                value={valor}
                required={obligatorio}
                onChange={(e) =>
                  onChange(caracteristica.id, e.target.value)
                }
                className={clasesInput}
              >
                <option value="">Seleccionar opción</option>
                <option value="1">Sí</option>
                <option value="0">No</option>
              </select>
            ) : (
              <input
                id={idCampo}
                type={
                  caracteristica.tipo_dato === "numero" ||
                  caracteristica.tipo_dato === "decimal"
                    ? "number"
                    : "text"
                }
                min={
                  caracteristica.tipo_dato === "numero"
                    ? "0"
                    : undefined
                }
                step={
                  caracteristica.tipo_dato === "numero"
                    ? "1"
                    : caracteristica.tipo_dato === "decimal"
                      ? "any"
                      : undefined
                }
                maxLength={
                  caracteristica.tipo_dato === "texto"
                    ? 255
                    : undefined
                }
                value={valor}
                required={obligatorio}
                onChange={(e) =>
                  onChange(caracteristica.id, e.target.value)
                }
                placeholder={`Ingresar ${caracteristica.nombre.toLowerCase()}`}
                className={clasesInput}
              />
            )}

            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}