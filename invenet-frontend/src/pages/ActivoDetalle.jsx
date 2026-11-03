
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Archive,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Cpu,
  Hash,
  History,
  Info,
  MapPin,
  Monitor,
  Pencil,
  RefreshCw,
  Tag,
  AlertCircle,
} from "lucide-react";

import {
  obtenerActivo,
  darDeBajaActivo,
} from "../services/activoService";

import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../context/FeedbackContext";

import EstadoBadge from "../components/EstadoBadge";
import CaracteristicasTecnicas from "../components/CaracteristicasTecnicas";

// =====================================================
// COMPONENTE: CAMPO DE INFORMACIÓN
// =====================================================

function CampoDetalle({ etiqueta, valor, icono: Icono }) {
  const sinValor =
    valor === null ||
    valor === undefined ||
    valor === "";

  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {Icono && (
          <Icono
            size={14}
            className="shrink-0 text-slate-400"
          />
        )}

        {etiqueta}
      </dt>

      <dd
        className={`mt-2 break-words text-sm font-semibold ${
          sinValor ? "text-slate-400" : "text-slate-800"
        }`}
      >
        {sinValor ? "No especificado" : valor}
      </dd>
    </div>
  );
}

// =====================================================
// COMPONENTE: ENCABEZADO DE TARJETA
// =====================================================

function EncabezadoTarjeta({
  icono: Icono,
  titulo,
  descripcion,
}) {
  return (
    <div className="mb-6 flex items-start gap-3 border-b border-slate-100 pb-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
        <Icono size={19} strokeWidth={1.8} />
      </div>

      <div>
        <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
          {titulo}
        </h2>

        <p className="mt-1 text-sm leading-relaxed text-slate-500">
          {descripcion}
        </p>
      </div>
    </div>
  );
}

// =====================================================
// FORMATEAR FECHA
// =====================================================

function formatearFecha(fecha) {
  if (!fecha) return "No especificada";

  const partes = String(fecha)
    .slice(0, 10)
    .split("-");

  if (partes.length !== 3) {
    return String(fecha);
  }

  const [anio, mes, dia] = partes;

  if (!anio || !mes || !dia) {
    return String(fecha);
  }

  return `${dia}/${mes}/${anio}`;
}

// =====================================================
// PÁGINA: DETALLE DEL ACTIVO
// =====================================================

export default function ActivoDetalle() {
  // =====================================================
  // PARÁMETROS, NAVEGACIÓN Y CONTEXTOS
  // =====================================================

  const { id } = useParams();
  const navigate = useNavigate();

  const { user } = useAuth();
  const { toast, confirmar } = useFeedback();

  // =====================================================
  // PERMISOS
  // =====================================================

  const permisos =
    user?.rol?.permisos ?? user?.permisos ?? [];

  const esAdministrador =
    user?.rol?.nombre === "Administrador";

  const tienePermiso = (nombre) =>
    esAdministrador ||
    permisos.some((permiso) =>
      typeof permiso === "string"
        ? permiso === nombre
        : permiso?.nombre === nombre
    );

  const puedeEditar =
    tienePermiso("activos.editar");

  const puedeDarDeBaja =
    tienePermiso("activos.desactivar");

  const puedeVerHistorial =
    tienePermiso("historial.ver");

  // =====================================================
  // ESTADOS
  // =====================================================

  const [activo, setActivo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [procesandoBaja, setProcesandoBaja] =
    useState(false);

  // =====================================================
  // REFERENCIAS
  // =====================================================

  const procesandoBajaRef = useRef(false);

  // =====================================================
  // OBTENER ACTIVO
  // =====================================================

  useEffect(() => {
    let montado = true;

    const cargarActivo = async () => {
      setCargando(true);
      setError("");
      setActivo(null);

      try {
        const respuesta = await obtenerActivo(id);

        if (montado) {
          setActivo(
            respuesta.activo ?? respuesta
          );
        }
      } catch (err) {
        console.error(
          "Error al cargar el activo:",
          err
        );

        if (montado) {
          setError(
            err.response?.status === 404
              ? "El activo solicitado no existe o no está disponible."
              : "No se pudo cargar la información del activo."
          );
        }
      } finally {
        if (montado) {
          setCargando(false);
        }
      }
    };

    cargarActivo();

    return () => {
      montado = false;
    };
  }, [id]);

  // =====================================================
  // BAJA LÓGICA DEL ACTIVO
  // =====================================================

  const solicitarBaja = async () => {
    if (
      !puedeDarDeBaja ||
      !activo ||
      procesandoBajaRef.current
    ) {
      return;
    }

    const codigo =
      activo.codigo_inventario || `#${activo.id}`;

    // =============================================
    // CONFIRMACIÓN GLOBAL
    // =============================================

    const confirmado = await confirmar({
      titulo: "Dar de baja el activo",
      mensaje:
        `Estás por dar de baja el activo ${codigo}.\n\n` +
        "El equipo dejará de aparecer en el inventario activo, " +
        "pero su información y su historial se conservarán.\n\n" +
        "¿Querés continuar?",
      textoConfirmar: "Confirmar baja",
      textoCancelar: "Cancelar",
      variante: "danger",
    });

    if (!confirmado) return;

    if (procesandoBajaRef.current) return;

    procesandoBajaRef.current = true;
    setProcesandoBaja(true);

    // =============================================
    // EJECUTAR BAJA
    // =============================================

    try {
      await darDeBajaActivo(activo.id);

      // ===========================================
      // TOAST DE ÉXITO
      // ===========================================

      toast.success(
        `El activo ${codigo} fue dado de baja correctamente.`
      );

      // ===========================================
      // REGRESAR AL INVENTARIO
      // ===========================================

      navigate("/activos", {
        replace: true,
      });
    } catch (err) {
      console.error(
        "Error al dar de baja el activo:",
        err
      );

      // ===========================================
      // TOAST DE ERROR
      // ===========================================

      toast.error(
        err.response?.data?.message ||
          "No se pudo dar de baja el activo. Intentá nuevamente."
      );
    } finally {
      procesandoBajaRef.current = false;
      setProcesandoBaja(false);
    }
  };

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
          Cargando detalle del activo
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Obteniendo información del inventario...
        </p>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error || !activo) {
    return (
      <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-10">
        <Link
          to="/activos"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-900"
        >
          <ArrowLeft size={18} />
          Volver al inventario
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
              No se pudo mostrar el activo
            </h2>

            <p className="mt-1 text-sm text-red-700">
              {error ||
                "No hay información disponible para este activo."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // INFORMACIÓN PARA LA INTERFAZ
  // =====================================================

  const nombreEquipo =
    [activo.marca, activo.modelo]
      .filter(Boolean)
      .join(" ") ||
    "Equipo sin marca o modelo";

  const nombreCategoria =
    activo.categoria?.nombre ?? "Sin categoría";

  const nombreUbicacion =
    activo.ubicacion?.nombre ?? "Sin ubicación";

  const observaciones =
    typeof activo.observaciones === "string"
      ? activo.observaciones.trim()
      : activo.observaciones;

  // =====================================================
  // RENDERIZADO PRINCIPAL
  // =====================================================

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-10">

      {/* =============================================
          NAVEGACIÓN
      ============================================= */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/activos"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Volver al inventario
        </Link>

        <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-400">
          <Monitor size={15} />
          Inventario institucional
        </span>
      </div>

      {/* =============================================
          ENCABEZADO DEL ACTIVO
      ============================================= */}

      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-blue-700" />

        <div className="p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">

            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Monitor
                  size={27}
                  strokeWidth={1.7}
                />
              </div>

              <div className="min-w-0">
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                  Ficha del activo
                </p>

                <h1 className="break-all text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {activo.codigo_inventario}
                </h1>

                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {nombreCategoria} · {nombreEquipo}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-slate-500">
                    Estado actual:
                  </span>

                  <EstadoBadge
                    estado={activo.estado?.nombre}
                  />
                </div>
              </div>
            </div>

            {/* ACCIONES */}

            <div className="flex flex-wrap items-center gap-2">

              {/* EDITAR ACTIVO */}

              {puedeEditar && (
                <Link
                  to={`/activos/${activo.id}/editar`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <Pencil size={17} />
                  Editar activo
                </Link>
              )}

              {/* VER HISTORIAL */}

              {puedeVerHistorial && (
                <Link
                  to={`/activos/${activo.id}/historial`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <History size={17} />
                  Ver historial
                </Link>
              )}

              {/* DAR DE BAJA */}

              {puedeDarDeBaja && (
                <button
                  type="button"
                  onClick={solicitarBaja}
                  disabled={procesandoBaja}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {procesandoBaja ? (
                    <RefreshCw
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Archive size={17} />
                  )}

                  {procesandoBaja
                    ? "Procesando baja..."
                    : "Dar de baja"}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* =============================================
          INFORMACIÓN GENERAL Y UBICACIÓN
      ============================================= */}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* INFORMACIÓN GENERAL */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <EncabezadoTarjeta
            icono={ClipboardList}
            titulo="Información general"
            descripcion="Datos de identificación y clasificación del equipo."
          />

          <dl className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
            <CampoDetalle
              etiqueta="Código de inventario"
              valor={activo.codigo_inventario}
              icono={Hash}
            />

            <CampoDetalle
              etiqueta="Categoría"
              valor={nombreCategoria}
              icono={Tag}
            />

            <CampoDetalle
              etiqueta="Marca"
              valor={activo.marca}
            />

            <CampoDetalle
              etiqueta="Modelo"
              valor={activo.modelo}
            />

            <CampoDetalle
              etiqueta="Número de serie"
              valor={activo.numero_serie}
              icono={Cpu}
            />

            <CampoDetalle
              etiqueta="ID del activo"
              valor={activo.id}
              icono={Hash}
            />
          </dl>
        </section>

        {/* UBICACIÓN Y ESTADO */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <EncabezadoTarjeta
            icono={MapPin}
            titulo="Ubicación y estado"
            descripcion="Situación actual y datos de ingreso del activo."
          />

          <dl className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
            <CampoDetalle
              etiqueta="Ubicación actual"
              valor={nombreUbicacion}
              icono={MapPin}
            />

            <div className="min-w-0">
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <CheckCircle2 size={14} />
                Estado actual
              </dt>

              <dd className="mt-2">
                <EstadoBadge
                  estado={activo.estado?.nombre}
                />
              </dd>
            </div>

            <CampoDetalle
              etiqueta="Fecha de ingreso"
              valor={formatearFecha(activo.fecha_ingreso)}
              icono={CalendarDays}
            />

            <CampoDetalle
              etiqueta="Identificador"
              valor={activo.id}
              icono={Hash}
            />
          </dl>

          <div className="mt-7 flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <Info
              size={18}
              className="mt-0.5 shrink-0 text-slate-500"
            />

            <p className="text-xs leading-relaxed text-slate-500">
              La ubicación y el estado corresponden a los últimos
              datos registrados para este activo en el inventario.
            </p>
          </div>
        </section>
      </div>

      {/* =============================================
          OBSERVACIONES
      ============================================= */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <EncabezadoTarjeta
          icono={ClipboardList}
          titulo="Observaciones"
          descripcion="Información adicional registrada sobre el activo."
        />

        {observaciones ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
              {observaciones}
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <Info
              size={18}
              className="mt-0.5 shrink-0 text-slate-400"
            />

            <p className="text-sm text-slate-500">
              Este activo no tiene observaciones registradas.
            </p>
          </div>
        )}
      </section>

      {/* =============================================
          CARACTERÍSTICAS TÉCNICAS
      ============================================= */}

      <div className="space-y-4">
        <div className="flex items-start gap-3 px-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm">
            <Cpu size={19} strokeWidth={1.8} />
          </div>

          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Especificaciones técnicas
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Características configuradas para este activo.
            </p>
          </div>
        </div>

        <CaracteristicasTecnicas
          caracteristicas={
            activo.caracteristicas ?? []
          }
        />
      </div>
    </div>
  );
}
