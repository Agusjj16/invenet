
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  Archive,
  ArrowLeft,
  CalendarDays,
  Hash,
  History,
  MapPin,
  Monitor,
  RefreshCw,
  ClipboardList,
  Cpu,
  FileText,
  Info,
  AlertCircle,
  Tag,
  Clock3,
  ShieldCheck,
} from "lucide-react";

import { obtenerActivoDadoDeBaja } from "../services/activoService";

import EstadoBadge from "../components/EstadoBadge";
import CaracteristicasTecnicas from "../components/CaracteristicasTecnicas";
import { useAuth } from "../context/AuthContext";

// =====================================================
// COMPONENTE: CAMPO DE INFORMACIÓN
// =====================================================

function CampoDetalle({
  etiqueta,
  valor,
  icono: Icono,
}) {
  const valorVisible =
    valor !== null &&
    valor !== undefined &&
    String(valor).trim() !== ""
      ? valor
      : "No especificado";

  return (
    <div className="min-w-0">
      <dt className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {Icono && (
          <Icono
            size={14}
            className="shrink-0"
          />
        )}

        {etiqueta}
      </dt>

      <dd className="break-words text-sm font-semibold leading-relaxed text-slate-800">
        {valorVisible}
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
        <Icono
          size={19}
          strokeWidth={1.8}
        />
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
  if (!fecha) return "No disponible";

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
// PÁGINA: DETALLE DEL ACTIVO DADO DE BAJA
// =====================================================

export default function ActivoDadoDeBajaDetalle() {
  const { id } = useParams();

  // =====================================================
  // USUARIO Y PERMISOS
  // =====================================================

  const { user } = useAuth();

  const puedeVerHistorial =
    user?.rol?.permisos?.some(
      (permiso) =>
        permiso.nombre === "historial.ver"
    ) ?? false;

  // =====================================================
  // ESTADOS
  // =====================================================

  const [activo, setActivo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // CARGAR ACTIVO DADO DE BAJA
  // =====================================================

  useEffect(() => {
    let montado = true;

    const cargarActivo = async () => {
      setCargando(true);
      setError("");
      setActivo(null);

      try {
        // IMPORTANTE:
        // Se consulta el servicio específico de activos
        // dados de baja, no el servicio de activos vigentes.
        const respuesta =
          await obtenerActivoDadoDeBaja(id);

        if (!montado) return;

        const datosActivo =
          respuesta.activo ?? respuesta;

        setActivo(datosActivo);
      } catch (err) {
        if (!montado) return;

        console.error(
          "Error al consultar activo dado de baja:",
          err
        );

        if (err.response?.status === 404) {
          setError(
            "El activo dado de baja no existe o no se encuentra disponible."
          );
        } else {
          setError(
            err.response?.data?.message ||
              "No se pudo cargar la información del activo."
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
  // PANTALLA DE CARGA
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
          Cargando activo dado de baja
        </h2>

        <p className="mt-2 text-center text-sm text-slate-500">
          Consultando la información histórica del equipo...
        </p>
      </div>
    );
  }

  // =====================================================
  // ERROR DE CARGA
  // =====================================================

  if (error || !activo) {
    return (
      <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-10">

        <Link
          to="/activos/bajas"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Volver a activos dados de baja
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
              No se pudo consultar el activo
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-red-700">
              {error ||
                "No se encontró información del activo solicitado."}
            </p>

            <Link
              to="/activos/bajas"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-red-800 underline underline-offset-4 transition hover:text-red-950"
            >
              <ArrowLeft size={15} />
              Regresar al listado de bajas
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // DATOS DEL ACTIVO
  // =====================================================

  const nombreCategoria =
    activo.categoria?.nombre ?? "Sin categoría";

  const marcaModelo =
    [activo.marca, activo.modelo]
      .filter(Boolean)
      .join(" ") || "Equipo sin marca o modelo";

  const fechaBaja = formatearFecha(
    activo.deleted_at
  );

  const fechaIngreso = formatearFecha(
    activo.fecha_ingreso
  );

  // =====================================================
  // RENDERIZADO PRINCIPAL
  // =====================================================

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-10">

      {/* =============================================
          NAVEGACIÓN
      ============================================= */}

      <div className="flex flex-wrap items-center justify-between gap-3">

        {/* VOLVER AL LISTADO DE BAJAS */}

        <Link
          to="/activos/bajas"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Volver a activos dados de baja
        </Link>

        <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-400">
          <Monitor size={15} />
          Inventario institucional
        </span>
      </div>

      {/* =============================================
          ENCABEZADO INSTITUCIONAL
      ============================================= */}

      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-blue-700" />

        <div className="flex flex-col justify-between gap-5 p-5 sm:p-6 lg:flex-row lg:items-center">

          {/* INFORMACIÓN PRINCIPAL */}

          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Archive
                size={27}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                Registro histórico del inventario
              </p>

              <h1 className="break-all text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {activo.codigo_inventario}
              </h1>

              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {nombreCategoria}
                <span className="mx-2 text-slate-300">
                  ·
                </span>
                {marcaModelo}
              </p>
            </div>
          </div>

          {/* ACCIONES */}

          <div className="flex flex-wrap items-center gap-3">

            {/* ESTADO */}

            <span className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800">
              <Archive size={16} />
              Dado de baja
            </span>

            {/* HISTORIAL */}

            {puedeVerHistorial && (
              <Link
                to={`/activos/${activo.id}/historial`}
                state={{ origen: "bajas" }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <History size={17} />
                Ver historial
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* =============================================
          INFORMACIÓN DE LA BAJA
      ============================================= */}

      <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">

          {/* DESCRIPCIÓN */}

          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-100 text-amber-700">
              <Archive
                size={21}
                strokeWidth={1.8}
              />
            </div>

            <div>
              <h2 className="text-base font-bold text-amber-950 sm:text-lg">
                Activo dado de baja
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-amber-900/80">
                Este equipo fue retirado del inventario
                activo. Su información permanece disponible
                para preservar la trazabilidad y permitir
                la consulta de sus datos históricos.
              </p>

              <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-amber-800">
                <ShieldCheck size={16} />
                Registro conservado para consulta
              </div>
            </div>
          </div>

          {/* FECHA DE BAJA */}

          <div className="shrink-0 rounded-xl border border-amber-200 bg-white/80 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
              <CalendarDays size={15} />
              Fecha de baja
            </div>

            <p className="mt-2 text-lg font-bold text-amber-950">
              {fechaBaja}
            </p>
          </div>
        </div>
      </section>

      {/* =============================================
          INFORMACIÓN GENERAL Y UBICACIÓN
      ============================================= */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* =============================================
            INFORMACIÓN GENERAL
        ============================================= */}

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
              valor={activo.categoria?.nombre}
              icono={Tag}
            />

            <CampoDetalle
              etiqueta="Marca"
              valor={activo.marca}
              icono={Monitor}
            />

            <CampoDetalle
              etiqueta="Modelo"
              valor={activo.modelo}
              icono={Monitor}
            />

            <CampoDetalle
              etiqueta="Número de serie"
              valor={activo.numero_serie}
              icono={Hash}
            />

            <CampoDetalle
              etiqueta="ID del activo"
              valor={activo.id}
              icono={Hash}
            />
          </dl>
        </section>

        {/* =============================================
            UBICACIÓN Y FECHAS
        ============================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <EncabezadoTarjeta
            icono={MapPin}
            titulo="Ubicación y fechas"
            descripcion="Última ubicación registrada y fechas relevantes del activo."
          />

          <dl className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">

            {/* ÚLTIMA UBICACIÓN */}

            <CampoDetalle
              etiqueta="Última ubicación"
              valor={activo.ubicacion?.nombre}
              icono={MapPin}
            />

            {/* ESTADO */}

            <div className="min-w-0">
              <dt className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Archive size={14} />
                Estado
              </dt>

              <dd className="mt-1">
                <EstadoBadge
                  estado={
                    activo.estado?.nombre ??
                    "Dado de baja"
                  }
                />
              </dd>
            </div>

            {/* FECHA DE INGRESO */}

            <CampoDetalle
              etiqueta="Fecha de ingreso"
              valor={fechaIngreso}
              icono={CalendarDays}
            />

            {/* FECHA DE BAJA */}

            <CampoDetalle
              etiqueta="Fecha de baja"
              valor={fechaBaja}
              icono={Clock3}
            />
          </dl>

          {/* INFORMACIÓN ADICIONAL */}

          <div className="mt-6 flex items-start gap-2 border-t border-slate-100 pt-5">
            <Info
              size={16}
              className="mt-0.5 shrink-0 text-slate-400"
            />

            <p className="text-xs leading-relaxed text-slate-500">
              La ubicación corresponde al último registro
              disponible antes de la baja del activo.
            </p>
          </div>
        </section>
      </div>

      {/* =============================================
          OBSERVACIONES
      ============================================= */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <EncabezadoTarjeta
          icono={FileText}
          titulo="Observaciones"
          descripcion="Información adicional registrada sobre el activo."
        />

        {activo.observaciones?.trim() ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-4">
            <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
              {activo.observaciones}
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-5">
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

      <section className="space-y-4">

        {/* ENCABEZADO */}

        <div className="flex items-start gap-3 px-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-blue-700 shadow-sm">
            <Cpu
              size={19}
              strokeWidth={1.8}
            />
          </div>

          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Especificaciones técnicas
            </h2>

            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              Características técnicas conservadas en
              el registro histórico del equipo.
            </p>
          </div>
        </div>

        {/* COMPONENTE EXISTENTE */}

        <CaracteristicasTecnicas
          caracteristicas={
            activo.caracteristicas ?? []
          }
        />
      </section>

      {/* =============================================
          NAVEGACIÓN INFERIOR
      ============================================= */}

      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-5">

        {/* ACLARACIÓN */}

        <div className="flex items-start gap-2">
          <Info
            size={17}
            className="mt-0.5 shrink-0 text-slate-400"
          />

          <p className="max-w-lg text-xs leading-relaxed text-slate-500">
            Este registro corresponde a un activo dado de baja.
            Podés consultar su información, pero no modificarla
            desde esta pantalla.
          </p>
        </div>

        {/* VOLVER */}

        <Link
          to="/activos/bajas"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Volver al listado de bajas
        </Link>
      </div>
    </div>
  );
}
