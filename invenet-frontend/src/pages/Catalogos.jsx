
import { Link } from "react-router-dom";

import {
  ArrowRight,
  Database,
  Layers3,
  ListChecks,
  MapPin,
  Settings2,
} from "lucide-react";

// =====================================================
// SECCIONES DE CATÁLOGOS
// =====================================================

const secciones = [
  {
    titulo: "Categorías",
    descripcion:
      "Administrá los tipos de activos tecnológicos registrados en Invenet.",
    detalle:
      "Clasificación de activos",
    icono: Layers3,
    ruta: "/catalogos/categorias",
  },
  {
    titulo: "Ubicaciones",
    descripcion:
      "Gestioná los espacios físicos donde se encuentran los activos.",
    detalle:
      "Organización institucional",
    icono: MapPin,
    ruta: "/catalogos/ubicaciones",
  },
  {
    titulo: "Características técnicas",
    descripcion:
      "Configurá los atributos técnicos asociados a las categorías.",
    detalle:
      "Atributos del inventario",
    icono: Settings2,
    ruta: "/catalogos/caracteristicas",
  },
  {
    titulo: "Opciones de características",
    descripcion:
      "Administrá los valores disponibles para los atributos seleccionables.",
    detalle:
      "Valores de atributos",
    icono: ListChecks,
    ruta: "/catalogos/opciones",
  },
];

// =====================================================
// COMPONENTE: TARJETA DE CATÁLOGO
// =====================================================

function TarjetaCatalogo({ seccion }) {
  const Icono = seccion.icono;

  return (
    <Link
      to={seccion.ruta}
      className="group flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:p-6"
    >
      {/* ENCABEZADO */}

      <div className="flex items-start justify-between gap-4">

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700 transition-colors group-hover:border-blue-200 group-hover:bg-blue-100">
          <Icono
            size={23}
            strokeWidth={1.8}
          />
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-all group-hover:border-blue-200 group-hover:text-blue-700">
          <ArrowRight
            size={18}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </div>
      </div>

      {/* INFORMACIÓN */}

      <div className="mt-5 flex-1">

        <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
          {seccion.detalle}
        </p>

        <h3 className="mt-2 text-lg font-bold tracking-tight text-slate-900 transition-colors group-hover:text-blue-800">
          {seccion.titulo}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {seccion.descripcion}
        </p>
      </div>

      {/* ACCIÓN */}

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">

        <span className="text-sm font-semibold text-blue-700 transition-colors group-hover:text-blue-800">
          Administrar sección
        </span>

        <ArrowRight
          size={17}
          className="text-blue-600 transition-transform group-hover:translate-x-1"
        />
      </div>
    </Link>
  );
}

// =====================================================
// PÁGINA PRINCIPAL
// =====================================================

export default function Catalogos() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-10">

      {/* =============================================
          CAJA 1 - ENCABEZADO INSTITUCIONAL
      ============================================= */}

      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* LÍNEA INSTITUCIONAL */}

        <div className="h-1 bg-blue-700" />

        <div className="flex flex-col justify-between gap-5 p-5 sm:p-6 lg:flex-row lg:items-center">

          {/* TÍTULO */}

          <div className="flex min-w-0 items-start gap-4">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Database
                size={27}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0">

              <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                Administración del sistema
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Gestión de catálogos
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                Administrá la información utilizada para
                clasificar, describir y localizar los activos
                tecnológicos de la institución.
              </p>
            </div>
          </div>

          {/* IDENTIFICADOR */}

          <div className="flex shrink-0 items-center">

            <span className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700">

              <Layers3 size={17} />

              {secciones.length} secciones disponibles
            </span>
          </div>
        </div>
      </header>

      {/* =============================================
          CAJA 2 - SECCIONES DE CATÁLOGOS
      ============================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* ENCABEZADO */}

        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">

          <div className="flex min-w-0 items-start gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Layers3
                size={21}
                strokeWidth={1.8}
              />
            </div>

            <div className="min-w-0">

              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Administración de catálogos
              </h2>

              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                Seleccioná una sección para gestionar
                la información del inventario.
              </p>
            </div>
          </div>

          {/* CONTADOR */}

          <span className="inline-flex shrink-0 items-center self-start rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 sm:self-auto">
            {secciones.length} catálogos
          </span>
        </div>

        {/* TARJETAS */}

        <div className="p-5 sm:p-6">

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:gap-5">

            {secciones.map((seccion) => (
              <TarjetaCatalogo
                key={seccion.ruta}
                seccion={seccion}
              />
            ))}
          </div>
        </div>

        {/* PIE INFORMATIVO */}

        <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-6">

          <p className="text-xs leading-relaxed text-slate-500">
            Los cambios realizados en los catálogos
            pueden afectar las opciones disponibles
            al registrar o editar activos tecnológicos.
          </p>
        </div>
      </section>
    </div>
  );
}
