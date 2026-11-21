import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  LoaderCircle,
  Save,
  Pencil,
  Monitor,
  ClipboardList,
  Cpu,
  MapPin,
  CalendarDays,
  Hash,
  Tag,
  Info,
  AlertCircle,
  LockKeyhole,
  FileText,
} from "lucide-react";

import {
  obtenerActivo,
  actualizarActivo,
} from "../services/activoService";

import {
  obtenerUbicaciones,
  obtenerCaracteristicasPorCategoria,
} from "../services/catalogoService";

import { useFeedback } from "../context/FeedbackContext";

import CaracteristicasForm from "../components/CaracteristicasForm";

// =====================================================
// CONFIGURACIÓN INICIAL
// =====================================================

const formularioInicial = {
  codigo_inventario: "",
  ubicacion_id: "",
  fecha_ingreso: "",
  marca: "",
  modelo: "",
  numero_serie: "",
  observaciones: "",
};

const clasesInput =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

// =====================================================
// COMPONENTE: ENCABEZADO DE SECCIÓN
// =====================================================

function EncabezadoSeccion({
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
// COMPONENTE: CAMPO DEL FORMULARIO
// =====================================================

function CampoFormulario({
  id,
  etiqueta,
  icono: Icono,
  obligatorio = false,
  error,
  descripcion,
  children,
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
      >
        {Icono && (
          <Icono
            size={15}
            className="shrink-0 text-slate-400"
          />
        )}

        <span>{etiqueta}</span>

        {obligatorio && (
          <span className="font-bold text-red-500">
            *
          </span>
        )}
      </label>

      {children}

      {descripcion && (
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          {descripcion}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-2 flex items-start gap-1.5 text-xs font-medium text-red-600"
        >
          <AlertCircle
            size={14}
            className="mt-0.5 shrink-0"
          />
          {error}
        </p>
      )}
    </div>
  );
}

// =====================================================
// PÁGINA: EDITAR ACTIVO
// =====================================================

export default function ActivoEditar() {
  // =====================================================
  // PARÁMETROS, NAVEGACIÓN Y FEEDBACK
  // =====================================================

  const { id } = useParams();
  const navigate = useNavigate();

  const { toast } = useFeedback();

  // =====================================================
  // ESTADOS
  // =====================================================

  const [activo, setActivo] = useState(null);

  const [ubicaciones, setUbicaciones] = useState([]);
  const [caracteristicas, setCaracteristicas] = useState([]);

  const [formulario, setFormulario] =
    useState(formularioInicial);

  const [
    valoresCaracteristicas,
    setValoresCaracteristicas,
  ] = useState({});

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [errores, setErrores] = useState({});

  // Este error se reserva para problemas que impiden
  // cargar el formulario de edición.
  const [errorCarga, setErrorCarga] = useState("");

  // =====================================================
  // REFERENCIAS
  // =====================================================

  // Impide que se envíen varias solicitudes de
  // actualización simultáneamente.
  const guardandoRef = useRef(false);

  // =====================================================
  // CARGAR INFORMACIÓN
  // =====================================================

  useEffect(() => {
    let activoEffect = true;

    const cargarDatos = async () => {
      setCargando(true);
      setErrorCarga("");

      try {
        // =============================================
        // OBTENER ACTIVO Y UBICACIONES
        // =============================================

        const [
          respuestaActivo,
          respuestaUbicaciones,
        ] = await Promise.all([
          obtenerActivo(id),
          obtenerUbicaciones(),
        ]);

        const datosActivo =
          respuestaActivo.activo ?? respuestaActivo;

        // =============================================
        // OBTENER CARACTERÍSTICAS DE LA CATEGORÍA
        // =============================================

        const respuestaCaracteristicas =
          await obtenerCaracteristicasPorCategoria(
            datosActivo.categoria_id
          );

        if (!activoEffect) return;

        // =============================================
        // GUARDAR INFORMACIÓN OBTENIDA
        // =============================================

        setActivo(datosActivo);

        setUbicaciones(
          respuestaUbicaciones.filter(
            (ubicacion) => ubicacion.activo
          )
        );

        setCaracteristicas(
          respuestaCaracteristicas.caracteristicas ?? []
        );

        // =============================================
        // COMPLETAR FORMULARIO
        // =============================================

        setFormulario({
          codigo_inventario:
            datosActivo.codigo_inventario ?? "",

          ubicacion_id:
            String(datosActivo.ubicacion_id ?? ""),

          fecha_ingreso:
            String(
              datosActivo.fecha_ingreso ?? ""
            ).slice(0, 10),

          marca: datosActivo.marca ?? "",
          modelo: datosActivo.modelo ?? "",

          numero_serie:
            datosActivo.numero_serie ?? "",

          observaciones:
            datosActivo.observaciones ?? "",
        });

        // =============================================
        // COMPLETAR CARACTERÍSTICAS TÉCNICAS
        // =============================================

        const valores = {};

        (
          datosActivo.caracteristicas ?? []
        ).forEach((caracteristica) => {
          valores[caracteristica.id] = String(
            caracteristica.pivot?.valor ?? ""
          );
        });

        setValoresCaracteristicas(valores);
      } catch (error) {
        if (!activoEffect) return;

        console.error(
          "Error al cargar datos del activo:",
          error
        );

        setErrorCarga(
          error.response?.data?.message ||
            "No se pudieron cargar los datos del activo."
        );
      } finally {
        if (activoEffect) {
          setCargando(false);
        }
      }
    };

    cargarDatos();

    return () => {
      activoEffect = false;
    };
  }, [id]);

  // =====================================================
  // MODIFICAR CAMPOS
  // =====================================================

  const cambiarCampo = (campo, valor) => {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));

    // Limpiar solamente el error del campo modificado.
    setErrores((anteriores) => {
      const nuevosErrores = { ...anteriores };

      delete nuevosErrores[campo];

      return nuevosErrores;
    });
  };

  // =====================================================
  // MODIFICAR CARACTERÍSTICAS TÉCNICAS
  // =====================================================

  const cambiarCaracteristica = (
    idCaracteristica,
    valor
  ) => {
    setValoresCaracteristicas((anteriores) => ({
      ...anteriores,
      [idCaracteristica]: valor,
    }));

    // Se limpian los errores de la característica
    // modificada, conservando los demás errores.

    setErrores((anteriores) => {
      const nuevosErrores = { ...anteriores };

      const indice = caracteristicas.findIndex(
        (caracteristica) =>
          String(caracteristica.id) ===
          String(idCaracteristica)
      );

      if (indice !== -1) {
        delete nuevosErrores[
          `caracteristicas.${indice}.valor`
        ];

        delete nuevosErrores[
          `caracteristicas.${indice}.caracteristica_id`
        ];
      }

      delete nuevosErrores.caracteristicas;

      return nuevosErrores;
    });
  };

  // =====================================================
  // PREPARAR CARACTERÍSTICAS
  // =====================================================

  const prepararCaracteristicas = () => {
    return caracteristicas
      .filter((caracteristica) => {
        const valor =
          valoresCaracteristicas[caracteristica.id];

        return (
          valor !== undefined &&
          valor !== null &&
          String(valor).trim() !== ""
        );
      })
      .map((caracteristica) => ({
        caracteristica_id: caracteristica.id,

        valor: String(
          valoresCaracteristicas[caracteristica.id]
        ).trim(),
      }));
  };

  // =====================================================
  // GUARDAR CAMBIOS
  // =====================================================

  const guardarCambios = async (event) => {
    event.preventDefault();

    if (guardandoRef.current || !activo) return;

    guardandoRef.current = true;

    setGuardando(true);
    setErrores({});

    // =============================================
    // PREPARAR DATOS PARA EL BACKEND
    // =============================================

    const datos = {
      codigo_inventario:
        formulario.codigo_inventario.trim(),

      ubicacion_id:
        Number(formulario.ubicacion_id),

      fecha_ingreso:
        formulario.fecha_ingreso,

      marca:
        formulario.marca.trim() || null,

      modelo:
        formulario.modelo.trim() || null,

      numero_serie:
        formulario.numero_serie.trim() || null,

      observaciones:
        formulario.observaciones.trim() || null,

      caracteristicas:
        prepararCaracteristicas(),
    };

    try {
      // =============================================
      // ACTUALIZAR ACTIVO
      // =============================================

      await actualizarActivo(id, datos);

      // =============================================
      // TOAST DE ÉXITO
      // =============================================

      toast.success(
        `El activo ${datos.codigo_inventario} fue actualizado correctamente.`
      );

      // =============================================
      // NAVEGAR AL DETALLE
      // =============================================

      navigate(`/activos/${id}`, {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Error al actualizar el activo:",
        error
      );

      // =============================================
      // ERRORES DE VALIDACIÓN
      // =============================================

      if (error.response?.status === 422) {
        const erroresBackend =
          error.response.data?.errors ?? {};

        setErrores(erroresBackend);

        toast.warning(
          "Hay errores en el formulario. Revisá los campos señalados."
        );
      } else {
        // ===========================================
        // ERRORES GENERALES
        // ===========================================

        toast.error(
          error.response?.data?.message ||
            "No se pudo actualizar el activo. Intentá nuevamente."
        );
      }
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  };

  // =====================================================
  // OBTENER ERROR DE CAMPO
  // =====================================================

  const errorCampo = (campo) =>
    errores[campo]?.[0];

  // =====================================================
  // PANTALLA DE CARGA
  // =====================================================

  if (cargando) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50">
          <LoaderCircle
            size={27}
            className="animate-spin text-blue-700"
          />
        </div>

        <h2 className="mt-5 text-base font-bold text-slate-800">
          Cargando activo
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Preparando la información para su edición...
        </p>
      </div>
    );
  }

  // =====================================================
  // ERROR DE CARGA
  // =====================================================

  if (!activo) {
    return (
      <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-10">
        <Link
          to="/activos"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-blue-50 hover:text-blue-700"
        >
          <ArrowLeft size={17} />
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
              No se pudo cargar el activo
            </h2>

            <p className="mt-1 text-sm text-red-700">
              {errorCarga ||
                "No se encontró el activo solicitado."}
            </p>
          </div>
        </div>
      </div>
    );
  }

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
          to={`/activos/${id}`}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Volver al detalle
        </Link>

        <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-400">
          <Monitor size={15} />
          Inventario institucional
        </span>
      </div>

      {/* =============================================
          ENCABEZADO
      ============================================= */}

      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-blue-700" />

        <div className="flex flex-col justify-between gap-5 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Pencil
                size={27}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                Administración del inventario
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Editar activo
              </h1>

              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Modificá los datos y las características
                del equipo registrado.
              </p>
            </div>
          </div>

          <div className="flex w-fit items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Monitor size={18} />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Activo seleccionado
              </p>

              <p className="break-all text-sm font-bold text-slate-800">
                {activo.codigo_inventario}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* =============================================
          FORMULARIO
      ============================================= */}

      <form
        onSubmit={guardarCambios}
        className="space-y-6"
      >

        {/* =============================================
            INFORMACIÓN GENERAL
        ============================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <EncabezadoSeccion
            icono={ClipboardList}
            titulo="Información general"
            descripcion="Datos de identificación, clasificación y ubicación del activo."
          />

          <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">

            {/* CÓDIGO DE INVENTARIO */}

            <CampoFormulario
              id="codigo_inventario"
              etiqueta="Código de inventario"
              icono={Hash}
              obligatorio
              error={errorCampo("codigo_inventario")}
            >
              <input
                id="codigo_inventario"
                type="text"
                required
                maxLength={50}
                className={clasesInput}
                value={formulario.codigo_inventario}
                onChange={(event) =>
                  cambiarCampo(
                    "codigo_inventario",
                    event.target.value
                  )
                }
                placeholder="Ingresá el código de inventario"
              />
            </CampoFormulario>

            {/* CATEGORÍA */}

            <CampoFormulario
              id="categoria"
              etiqueta="Categoría"
              icono={Tag}
              descripcion="La categoría del activo no se puede modificar."
            >
              <div className="relative">
                <input
                  id="categoria"
                  type="text"
                  disabled
                  value={activo.categoria?.nombre ?? ""}
                  className={`${clasesInput} pr-11`}
                />

                <LockKeyhole
                  size={17}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </CampoFormulario>

            {/* UBICACIÓN */}

            <CampoFormulario
              id="ubicacion_id"
              etiqueta="Ubicación"
              icono={MapPin}
              obligatorio
              error={errorCampo("ubicacion_id")}
            >
              <select
                id="ubicacion_id"
                required
                className={clasesInput}
                value={formulario.ubicacion_id}
                onChange={(event) =>
                  cambiarCampo(
                    "ubicacion_id",
                    event.target.value
                  )
                }
              >
                <option value="">
                  Seleccionar ubicación
                </option>

                {ubicaciones.map((ubicacion) => (
                  <option
                    key={ubicacion.id}
                    value={ubicacion.id}
                  >
                    {ubicacion.nombre}
                  </option>
                ))}
              </select>
            </CampoFormulario>

            {/* FECHA DE INGRESO */}

            <CampoFormulario
              id="fecha_ingreso"
              etiqueta="Fecha de ingreso"
              icono={CalendarDays}
              obligatorio
              error={errorCampo("fecha_ingreso")}
            >
              <input
                id="fecha_ingreso"
                type="date"
                required
                className={clasesInput}
                value={formulario.fecha_ingreso}
                onChange={(event) =>
                  cambiarCampo(
                    "fecha_ingreso",
                    event.target.value
                  )
                }
              />
            </CampoFormulario>

            {/* MARCA */}

            <CampoFormulario
              id="marca"
              etiqueta="Marca"
              icono={Monitor}
              error={errorCampo("marca")}
            >
              <input
                id="marca"
                type="text"
                maxLength={100}
                className={clasesInput}
                value={formulario.marca}
                onChange={(event) =>
                  cambiarCampo(
                    "marca",
                    event.target.value
                  )
                }
                placeholder="Ingresá la marca"
              />
            </CampoFormulario>

            {/* MODELO */}

            <CampoFormulario
              id="modelo"
              etiqueta="Modelo"
              icono={Monitor}
              error={errorCampo("modelo")}
            >
              <input
                id="modelo"
                type="text"
                maxLength={100}
                className={clasesInput}
                value={formulario.modelo}
                onChange={(event) =>
                  cambiarCampo(
                    "modelo",
                    event.target.value
                  )
                }
                placeholder="Ingresá el modelo"
              />
            </CampoFormulario>

            {/* NÚMERO DE SERIE */}

            <CampoFormulario
              id="numero_serie"
              etiqueta="Número de serie"
              icono={Hash}
              error={errorCampo("numero_serie")}
            >
              <input
                id="numero_serie"
                type="text"
                maxLength={100}
                className={clasesInput}
                value={formulario.numero_serie}
                onChange={(event) =>
                  cambiarCampo(
                    "numero_serie",
                    event.target.value
                  )
                }
                placeholder="Ingresá el número de serie"
              />
            </CampoFormulario>

            {/* OBSERVACIONES */}

            <div className="md:col-span-2">
              <CampoFormulario
                id="observaciones"
                etiqueta="Observaciones"
                icono={FileText}
                error={errorCampo("observaciones")}
                descripcion="Podés registrar información adicional relevante sobre el equipo."
              >
                <textarea
                  id="observaciones"
                  rows={4}
                  className={`${clasesInput} resize-y`}
                  value={formulario.observaciones}
                  onChange={(event) =>
                    cambiarCampo(
                      "observaciones",
                      event.target.value
                    )
                  }
                  placeholder="Agregá observaciones sobre el activo..."
                />
              </CampoFormulario>
            </div>
          </div>
        </section>

        {/* =============================================
            CARACTERÍSTICAS TÉCNICAS
        ============================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <EncabezadoSeccion
            icono={Cpu}
            titulo="Características técnicas"
            descripcion="Actualizá las especificaciones técnicas correspondientes a la categoría del equipo."
          />

          <CaracteristicasForm
            caracteristicas={caracteristicas}
            valores={valoresCaracteristicas}
            onChange={cambiarCaracteristica}
            errores={errores}
          />

          {errorCampo("caracteristicas") && (
            <p
              role="alert"
              className="mt-4 flex items-center gap-2 text-sm font-medium text-red-600"
            >
              <AlertCircle size={16} />
              {errorCampo("caracteristicas")}
            </p>
          )}
        </section>

        {/* =============================================
            ACCIONES DEL FORMULARIO
        ============================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            {/* INFORMACIÓN */}

            <div className="flex items-start gap-2">
              <Info
                size={17}
                className="mt-0.5 shrink-0 text-slate-400"
              />

              <p className="max-w-lg text-xs leading-relaxed text-slate-500">
                Revisá los datos antes de guardar.
                Los cambios quedarán registrados
                en el historial del activo.
              </p>
            </div>

            {/* BOTONES */}

            <div className="flex flex-wrap items-center justify-end gap-3">

              {/* CANCELAR */}

              <Link
                to={`/activos/${id}`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </Link>

              {/* GUARDAR CAMBIOS */}

              <button
                type="submit"
                disabled={guardando}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardando ? (
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={18} />
                )}

                {guardando
                  ? "Guardando..."
                  : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
