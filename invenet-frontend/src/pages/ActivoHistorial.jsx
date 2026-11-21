import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Archive,
  ChevronDown,
  ChevronUp,
  Clock3,
  History,
  MapPin,
  Pencil,
  PlusCircle,
  RefreshCw,
  UserRound,
  Monitor,
  ClipboardList,
  AlertCircle,
  ArrowRight,
  FileClock,
} from "lucide-react";

import { obtenerHistorialActivo } from "../services/activoService";

// =====================================================
// CONFIGURACIÓN VISUAL DE EVENTOS
// =====================================================

const CONFIG_EVENTOS = {
  ALTA: {
    titulo: "Alta del activo",
    Icono: PlusCircle,
    icono: "bg-emerald-50 text-emerald-700 border-emerald-100",
    etiqueta: "bg-emerald-50 text-emerald-700 border-emerald-200",
    punto: "bg-emerald-500",
  },

  MODIFICACION: {
    titulo: "Modificación de datos",
    Icono: Pencil,
    icono: "bg-blue-50 text-blue-700 border-blue-100",
    etiqueta: "bg-blue-50 text-blue-700 border-blue-200",
    punto: "bg-blue-500",
  },

  CAMBIO_UBICACION: {
    titulo: "Cambio de ubicación",
    Icono: MapPin,
    icono: "bg-violet-50 text-violet-700 border-violet-100",
    etiqueta: "bg-violet-50 text-violet-700 border-violet-200",
    punto: "bg-violet-500",
  },

  BAJA: {
    titulo: "Baja del activo",
    Icono: Archive,
    icono: "bg-red-50 text-red-700 border-red-100",
    etiqueta: "bg-red-50 text-red-700 border-red-200",
    punto: "bg-red-500",
  },
};

const CONFIG_PREDETERMINADA = {
  titulo: "Movimiento del activo",
  Icono: History,
  icono: "bg-slate-100 text-slate-700 border-slate-200",
  etiqueta: "bg-slate-100 text-slate-700 border-slate-200",
  punto: "bg-slate-400",
};

// =====================================================
// ETIQUETAS DE CAMPOS
// =====================================================

const ETIQUETAS = {
  codigo_inventario: "Código de inventario",
  categoria_id: "ID de categoría",
  ubicacion_id: "ID de ubicación",
  estado_id: "ID de estado",
  fecha_ingreso: "Fecha de ingreso",
  marca: "Marca",
  modelo: "Modelo",
  numero_serie: "Número de serie",
  observaciones: "Observaciones",
  deleted_at: "Fecha de baja",
};

// =====================================================
// FORMATEAR FECHA
// =====================================================

function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";

  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) {
    return String(fecha);
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// =====================================================
// FORMATEAR VALORES
// =====================================================

function formatearValor(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return "Sin valor";
  }

  if (typeof valor === "boolean") {
    return valor ? "Sí" : "No";
  }

  if (typeof valor === "object") {
    if (
      !Array.isArray(valor) &&
      Object.prototype.hasOwnProperty.call(valor, "valor")
    ) {
      return formatearValor(valor.valor);
    }

    return JSON.stringify(valor);
  }

  return String(valor);
}

// =====================================================
// NORMALIZAR DATOS DEL HISTORIAL
// =====================================================

function normalizarDatos(datos) {
  if (!datos || typeof datos !== "object") {
    return {};
  }

  const resultado = {};

  const datosActivo =
    datos.activo && typeof datos.activo === "object"
      ? datos.activo
      : datos;

  for (const [clave, valor] of Object.entries(datosActivo)) {
    if (
      [
        "id",
        "created_at",
        "updated_at",
        "caracteristicas",
      ].includes(clave)
    ) {
      continue;
    }

    resultado[clave] = valor;
  }

  const caracteristicas =
    datos.caracteristicas ?? datosActivo.caracteristicas;

  if (caracteristicas && typeof caracteristicas === "object") {
    for (const [id, valor] of Object.entries(caracteristicas)) {
      resultado[`caracteristica_${id}`] = valor;
    }
  }

  return resultado;
}

// =====================================================
// OBTENER CAMBIOS DEL EVENTO
// =====================================================

function obtenerCambios(evento) {
  const anteriores = normalizarDatos(evento.datos_anteriores);
  const nuevos = normalizarDatos(evento.datos_nuevos);

  const claves = [
    ...new Set([
      ...Object.keys(anteriores),
      ...Object.keys(nuevos),
    ]),
  ];

  return claves
    .filter((clave) => {
      const anterior = formatearValor(anteriores[clave]);
      const nuevo = formatearValor(nuevos[clave]);

      return anterior !== nuevo;
    })
    .map((clave) => ({
      campo: clave.startsWith("caracteristica_")
        ? `Característica #${clave.replace("caracteristica_", "")}`
        : ETIQUETAS[clave] ?? clave,
      anterior: formatearValor(anteriores[clave]),
      nuevo: formatearValor(nuevos[clave]),
    }));
}

// =====================================================
// COMPONENTE: EVENTO DEL HISTORIAL
// =====================================================

function EventoHistorial({ evento, ultimo = false }) {
  const [expandido, setExpandido] = useState(false);

  const configuracion =
    CONFIG_EVENTOS[evento.tipo_evento] ??
    CONFIG_PREDETERMINADA;

  const {
    Icono,
    titulo,
    icono,
    etiqueta,
    punto,
  } = configuracion;

  const cambios = Array.isArray(evento.cambios_legibles)
  ? evento.cambios_legibles
  : obtenerCambios(evento);

  const nombreUsuario = evento.usuario
    ? [evento.usuario.nombre, evento.usuario.apellido]
        .filter(Boolean)
        .join(" ") || "Usuario no disponible"
    : "Usuario no disponible";

  return (
    <div className="relative pl-9 sm:pl-12">

      {/* LÍNEA DE TIEMPO */}

      {!ultimo && (
        <div className="absolute bottom-0 left-[11px] top-7 w-px bg-slate-200 sm:left-[15px]" />
      )}

      <div
        className={`absolute left-[4px] top-7 h-4 w-4 rounded-full border-4 border-white shadow-sm ring-2 ring-slate-200 sm:left-[8px] ${punto}`}
      />

      {/* TARJETA */}

      <article className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
        <div className="p-5 sm:p-6">

          {/* ENCABEZADO DEL EVENTO */}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${icono}`}
            >
              <Icono size={22} strokeWidth={1.8} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                  {titulo}
                </h3>

                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${etiqueta}`}
                >
                  {evento.tipo_evento?.replaceAll("_", " ") ||
                    "MOVIMIENTO"}
                </span>
              </div>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {evento.descripcion || "Sin descripción registrada."}
              </p>

              {/* METADATOS */}

              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <UserRound
                    size={16}
                    className="shrink-0 text-slate-400"
                  />

                  <span className="break-words">
                    {nombreUsuario}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Clock3
                    size={16}
                    className="shrink-0 text-slate-400"
                  />

                  <time dateTime={evento.created_at || undefined}>
                    {formatearFecha(evento.created_at)}
                  </time>
                </div>
              </div>

              {/* BOTÓN PARA VER CAMBIOS */}

              {cambios.length > 0 && (
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => setExpandido((actual) => !actual)}
                    aria-expanded={expandido}
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                  >
                    {expandido ? (
                      <ChevronUp size={17} />
                    ) : (
                      <ChevronDown size={17} />
                    )}

                    {expandido
                      ? "Ocultar cambios"
                      : `Ver cambios (${cambios.length})`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =====================================
            COMPARACIÓN DE CAMBIOS
        ===================================== */}

        {expandido && cambios.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <ClipboardList size={18} className="text-blue-700" />

              <h4 className="text-sm font-bold text-slate-800">
                Detalle de modificaciones
              </h4>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Campo
                      </th>

                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Valor anterior
                      </th>

                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Valor nuevo
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {cambios.map((cambio) => (
                      <tr
                        key={cambio.campo}
                        className="transition-colors hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {cambio.campo}
                        </td>

                        <td className="px-4 py-3 align-top text-slate-500">
                          <span className="block max-w-sm whitespace-pre-wrap break-words">
                            {cambio.anterior}
                          </span>
                        </td>

                        <td className="px-4 py-3 align-top">
                          <div className="flex items-start gap-2">
                            <ArrowRight
                              size={15}
                              className="mt-0.5 shrink-0 text-blue-600"
                            />

                            <span className="block max-w-sm whitespace-pre-wrap break-words font-semibold text-slate-800">
                              {cambio.nuevo}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              Se muestran los valores registrados antes y después
              de cada modificación.
            </p>
          </div>
        )}
      </article>
    </div>
  );
}

// =====================================================
// PÁGINA PRINCIPAL: HISTORIAL DEL ACTIVO
// =====================================================

export default function ActivoHistorial() {
  const { id } = useParams();

  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const location = useLocation();
  const vieneDeBajas = location.state?.origen === "bajas";
  const rutaDetalle = vieneDeBajas
  ? `/activos/bajas/${id}`
  : `/activos/${id}`;

  // =====================================================
  // CARGAR HISTORIAL
  // =====================================================

  useEffect(() => {
    let montado = true;

    async function cargarHistorial() {
      setCargando(true);
      setError("");

      try {
        const respuesta = await obtenerHistorialActivo(id);

        if (montado) {
          setEventos(
            Array.isArray(respuesta) ? respuesta : []
          );
        }
      } catch (err) {
        console.error("Error al cargar historial:", err);

        if (montado) {
          setError(
            err.response?.status === 404
              ? "No se encontró el activo solicitado."
              : "No se pudo cargar el historial del activo."
          );
        }
      } finally {
        if (montado) {
          setCargando(false);
        }
      }
    }

    cargarHistorial();

    return () => {
      montado = false;
    };
  }, [id]);

  // =====================================================
  // CARGANDO
  // =====================================================

  if (cargando) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50">
          <RefreshCw
            size={27}
            className="animate-spin text-blue-700"
          />
        </div>

        <h2 className="mt-5 text-base font-bold text-slate-800">
          Cargando historial
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Obteniendo movimientos registrados del activo...
        </p>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-10">
        <Link
          to={rutaDetalle}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-blue-50 hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Volver al detalle
        </Link>

        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-6"
        >
          <AlertCircle
            size={22}
            className="shrink-0 text-red-600"
          />

          <div>
            <h2 className="text-base font-bold text-red-800">
              No se pudo cargar el historial
            </h2>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // CONTADORES
  // =====================================================

  const totalMovimientos = eventos.length;
  // Obtener el código de inventario del activo
  const codigoInventario =
    eventos.find(
      (evento) => evento.activo?.codigo_inventario
    )?.activo?.codigo_inventario ??
    eventos.find(
      (evento) => evento.datos_nuevos?.activo?.codigo_inventario
    )?.datos_nuevos?.activo?.codigo_inventario ??
    eventos.find(
      (evento) => evento.datos_nuevos?.codigo_inventario
    )?.datos_nuevos?.codigo_inventario ??
    eventos.find(
      (evento) => evento.datos_anteriores?.codigo_inventario
    )?.datos_anteriores?.codigo_inventario ??
    `ID #${id}`;

  const totalModificaciones = eventos.filter(
    (evento) => evento.tipo_evento === "MODIFICACION"
  ).length;

  const totalCambiosUbicacion = eventos.filter(
    (evento) => evento.tipo_evento === "CAMBIO_UBICACION"
  ).length;

  // =====================================================
  // RENDERIZADO
  // =====================================================

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-10">

      {/* =============================================
          NAVEGACIÓN
      ============================================= */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={rutaDetalle}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Volver al detalle
        </Link>

        <Link
          to="/activos"
          className="text-sm font-semibold text-blue-700 transition hover:text-blue-900 hover:underline"
        >
          Ir al inventario
        </Link>
      </div>

      {/* =============================================
          ENCABEZADO
      ============================================= */}

      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-blue-700" />

        <div className="flex flex-col justify-between gap-5 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <History size={27} strokeWidth={1.7} />
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                Trazabilidad del inventario
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Historial del activo
              </h1>

              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Registro cronológico de altas, modificaciones,
                cambios de ubicación y bajas.
              </p>
            </div>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Monitor size={18} className="text-blue-700" />

            <div>
              <p className="text-sm font-bold text-slate-800">
                {codigoInventario}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* =============================================
          RESUMEN DE MOVIMIENTOS
      ============================================= */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        {/* TOTAL */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Total de movimientos
            </span>

            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
              <FileClock size={19} />
            </div>
          </div>

          <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            {totalMovimientos.toLocaleString("es-AR")}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Eventos registrados
          </p>
        </div>

        {/* MODIFICACIONES */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Modificaciones
            </span>

            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
              <Pencil size={19} />
            </div>
          </div>

          <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            {totalModificaciones.toLocaleString("es-AR")}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Cambios de datos
          </p>
        </div>

        {/* UBICACIONES */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Cambios de ubicación
            </span>

            <div className="rounded-xl bg-violet-50 p-2.5 text-violet-700">
              <MapPin size={19} />
            </div>
          </div>

          <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            {totalCambiosUbicacion.toLocaleString("es-AR")}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Movimientos de ubicación
          </p>
        </div>
      </section>

      {/* =============================================
          LÍNEA DE TIEMPO
      ============================================= */}

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm">
              <ClipboardList size={19} strokeWidth={1.8} />
            </div>

            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Registro de movimientos
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Consultá los eventos y los valores modificados.
              </p>
            </div>
          </div>

          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
            {totalMovimientos} registros
          </span>
        </div>

        {eventos.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <History size={27} />
            </div>

            <h3 className="mt-5 text-base font-bold text-slate-900">
              Sin movimientos registrados
            </h3>

            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              Todavía no hay eventos disponibles en el historial
              de este activo.
            </p>
          </div>
        ) : (
          <div className="pt-2">
            {eventos.map((evento, index) => (
              <EventoHistorial
                key={evento.id}
                evento={evento}
                ultimo={index === eventos.length - 1}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
