
import {
  Eye,
  Pencil,
  Monitor,
  Archive,
  ExternalLink,
} from "lucide-react";

import { Link } from "react-router-dom";

import EstadoBadge from "./EstadoBadge";

// =====================================================
// COMPONENTE: TABLA DE ACTIVOS
// =====================================================

export default function ActivosTable({
  activos = [],
  puedeEditar = false,
  puedeDarDeBaja = false,
  onDarDeBaja,
}) {
  // =====================================================
  // SIN RESULTADOS
  // =====================================================

  if (activos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Monitor size={30} strokeWidth={1.7} />
        </div>

        <h3 className="mt-5 text-base font-semibold text-slate-900">
          No se encontraron activos
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          No hay equipos disponibles para mostrar.
        </p>
      </div>
    );
  }

  // =====================================================
  // TABLA PRINCIPAL
  // =====================================================

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[950px] text-left text-sm">

        {/* =============================================
            ENCABEZADO
        ============================================= */}

        <thead className="border-b border-slate-200 bg-slate-50/80">
          <tr>
            <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              Código
            </th>

            <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              Categoría
            </th>

            <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              Marca / Modelo
            </th>

            <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              Ubicación
            </th>

            <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              Estado
            </th>

            <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
              Acciones
            </th>
          </tr>
        </thead>

        {/* =============================================
            FILAS
        ============================================= */}

        <tbody className="divide-y divide-slate-100">
          {activos.map((activo) => (
            <tr
              key={activo.id}
              className="group transition-colors duration-150 hover:bg-slate-50/80"
            >

              {/* CÓDIGO DE INVENTARIO */}

              <td className="px-5 py-4">
                <Link
                  to={`/activos/${activo.id}`}
                  title={`Ver detalle de ${activo.codigo_inventario}`}
                  className="inline-flex items-center gap-1.5 font-bold text-blue-700 transition-colors hover:text-blue-900 hover:underline hover:underline-offset-4 focus:outline-none focus:underline"
                >
                  <span>
                    {activo.codigo_inventario}
                  </span>

                  <ExternalLink
                    size={13}
                    className="shrink-0 opacity-50 transition-opacity group-hover:opacity-100"
                  />
                </Link>
              </td>

              {/* CATEGORÍA */}

              <td className="px-5 py-4">
                <span className="font-medium text-slate-700">
                  {activo.categoria?.nombre ?? "Sin categoría"}
                </span>
              </td>

              {/* MARCA Y MODELO */}

              <td className="px-5 py-4">
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800">
                    {activo.marca || "Sin marca"}
                  </span>

                  <span className="mt-1 text-xs text-slate-500">
                    {activo.modelo || "Sin modelo"}
                  </span>
                </div>
              </td>

              {/* UBICACIÓN */}

              <td className="px-5 py-4">
                <span className="text-slate-700">
                  {activo.ubicacion?.nombre ?? "Sin ubicación"}
                </span>
              </td>

              {/* ESTADO */}

              <td className="px-5 py-4">
                <EstadoBadge
                  estado={activo.estado?.nombre}
                />
              </td>

              {/* =====================================
                  ACCIONES
              ===================================== */}

              <td className="px-5 py-4">
                <div className="flex items-center justify-center gap-2">

                  {/* VER DETALLE */}

                  <Link
                    to={`/activos/${activo.id}`}
                    title="Ver detalle del activo"
                    aria-label={`Ver detalle de ${activo.codigo_inventario}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all duration-150 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <Eye size={17} strokeWidth={1.8} />
                  </Link>

                  {/* EDITAR */}

                  {puedeEditar && (
                    <Link
                      to={`/activos/${activo.id}/editar`}
                      title="Editar activo"
                      aria-label={`Editar ${activo.codigo_inventario}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-white text-blue-700 transition-all duration-150 hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <Pencil size={17} strokeWidth={1.8} />
                    </Link>
                  )}

                  {/* DAR DE BAJA */}

                  {puedeDarDeBaja && (
                    <button
                      type="button"
                      onClick={() => onDarDeBaja?.(activo)}
                      disabled={!onDarDeBaja}
                      title="Dar de baja el activo"
                      aria-label={`Dar de baja ${activo.codigo_inventario}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition-all duration-150 hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Archive size={17} strokeWidth={1.8} />
                    </button>
                  )}

                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
