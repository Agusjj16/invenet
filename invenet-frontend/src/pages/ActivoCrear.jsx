
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Cpu,
  LoaderCircle,
  Monitor,
  Save,
  PlusCircle,
  ClipboardList,
  MapPin,
  CalendarDays,
  Hash,
  Tag,
  FileText,
  Info,
  AlertCircle,
  Layers,
} from "lucide-react";

import { crearActivo } from "../services/activoService";

import {
  obtenerCategorias,
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
  categoria_id: "",
  ubicacion_id: "",
  fecha_ingreso: new Date().toLocaleDateString("en-CA"),
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
          <span className="font-bold text-red-500">*</span>
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
// PÁGINA: CREAR ACTIVO
// =====================================================

export default function ActivoCrear() {
  // =====================================================
  // NAVEGACIÓN Y FEEDBACK GLOBAL
  // =====================================================

  const navigate = useNavigate();
  const { toast } = useFeedback();

  // =====================================================
  // ESTADOS DEL FORMULARIO
  // =====================================================

  const [formulario, setFormulario] =
    useState(formularioInicial);

  const [categorias, setCategorias] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [caracteristicas, setCaracteristicas] =
    useState([]);

  const [
    valoresCaracteristicas,
    setValoresCaracteristicas,
  ] = useState({});

  const [errores, setErrores] = useState({});

  // Se reserva para errores que impiden utilizar
  // correctamente el formulario.
  const [errorGeneral, setErrorGeneral] = useState("");

  const [cargandoCatalogos, setCargandoCatalogos] =
    useState(true);

  const [
    cargandoCaracteristicas,
    setCargandoCaracteristicas,
  ] = useState(false);

  const [guardando, setGuardando] = useState(false);

  const [modoGuardado, setModoGuardado] =
    useState("detalle");

  // =====================================================
  // REFERENCIAS
  // =====================================================

  // Evita que respuestas antiguas sobrescriban
  // las características de una nueva categoría.
  const solicitudCategoria = useRef(0);

  // Evita envíos duplicados antes de que React
  // actualice visualmente el estado de guardado.
  const guardandoRef = useRef(false);

  const codigoInputRef = useRef(null);

  // =====================================================
  // CARGAR CATEGORÍAS Y UBICACIONES
  // =====================================================

  useEffect(() => {
    let activo = true;

    const cargarCatalogos = async () => {
      try {
        const [
          respuestaCategorias,
          respuestaUbicaciones,
        ] = await Promise.all([
          obtenerCategorias(),
          obtenerUbicaciones(),
        ]);

        if (!activo) return;

        setCategorias(
          respuestaCategorias.filter(
            (categoria) => categoria.activo
          )
        );

        setUbicaciones(
          respuestaUbicaciones.filter(
            (ubicacion) => ubicacion.activo
          )
        );

        setErrorGeneral("");
      } catch (error) {
        console.error(
          "Error al cargar catálogos:",
          error
        );

        if (activo) {
          setErrorGeneral(
            "No se pudieron cargar las categorías y ubicaciones. Volvé al inventario e intentá nuevamente."
          );
        }
      } finally {
        if (activo) {
          setCargandoCatalogos(false);
        }
      }
    };

    cargarCatalogos();

    return () => {
      activo = false;
      solicitudCategoria.current += 1;
    };
  }, []);

  // =====================================================
  // CAMBIAR CAMPOS GENERALES
  // =====================================================

  const cambiarCampo = (event) => {
    const { name, value } = event.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));

    setErrores((anterior) => ({
      ...anterior,
      [name]: undefined,
    }));
  };

  // =====================================================
  // CAMBIAR CATEGORÍA
  // =====================================================

  const cambiarCategoria = async (event) => {
    const categoriaId = event.target.value;

    const numeroSolicitud =
      ++solicitudCategoria.current;

    setFormulario((anterior) => ({
      ...anterior,
      categoria_id: categoriaId,
    }));

    setCaracteristicas([]);
    setValoresCaracteristicas({});
    setErrores({});

    if (!categoriaId) {
      setCargandoCaracteristicas(false);
      return;
    }

    setCargandoCaracteristicas(true);

    try {
      const respuesta =
        await obtenerCaracteristicasPorCategoria(
          categoriaId
        );

      if (
        numeroSolicitud !== solicitudCategoria.current
      ) {
        return;
      }

      setCaracteristicas(
        respuesta.caracteristicas ?? []
      );
    } catch (error) {
      if (
        numeroSolicitud !== solicitudCategoria.current
      ) {
        return;
      }

      console.error(
        "Error al cargar características:",
        error
      );

      setCaracteristicas([]);

      toast.error(
        "No se pudieron cargar las características técnicas de la categoría."
      );
    } finally {
      if (
        numeroSolicitud === solicitudCategoria.current
      ) {
        setCargandoCaracteristicas(false);
      }
    }
  };

  // =====================================================
  // CAMBIAR CARACTERÍSTICA
  // =====================================================

  const cambiarCaracteristica = (id, valor) => {
    setValoresCaracteristicas((anterior) => ({
      ...anterior,
      [id]: valor,
    }));

    setErrores((anterior) => {
      const nuevosErrores = { ...anterior };

      const indice = caracteristicas.findIndex(
        (caracteristica) =>
          String(caracteristica.id) === String(id)
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
  // PREPARAR CARACTERÍSTICAS PARA EL BACKEND
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
  // GUARDAR ACTIVO
  // =====================================================

  const guardarActivo = async (event) => {
    event.preventDefault();

    if (
      guardandoRef.current ||
      cargandoCatalogos ||
      cargandoCaracteristicas ||
      errorGeneral
    ) {
      return;
    }

    guardandoRef.current = true;

    setGuardando(true);
    setErrores({});

    const datos = {
      codigo_inventario:
        formulario.codigo_inventario.trim(),

      categoria_id: Number(formulario.categoria_id),

      ubicacion_id: Number(formulario.ubicacion_id),

      fecha_ingreso: formulario.fecha_ingreso,

      marca: formulario.marca.trim() || null,

      modelo: formulario.modelo.trim() || null,

      numero_serie:
        formulario.numero_serie.trim() || null,

      observaciones:
        formulario.observaciones.trim() || null,

      caracteristicas: prepararCaracteristicas(),
    };

    try {
      // =============================================
      // REGISTRAR ACTIVO EN EL BACKEND
      // =============================================

      const respuesta = await crearActivo(datos);

      const nuevoId = respuesta.activo?.id;

      // =============================================
      // GUARDAR Y REGISTRAR OTRO
      // =============================================

      if (modoGuardado === "otro") {
        setFormulario((anterior) => ({
          ...anterior,

          // Estos campos deben ser únicos.
          codigo_inventario: "",
          numero_serie: "",
        }));

        // Se conservan categoría, ubicación,
        // fecha, marca, modelo, observaciones
        // y características técnicas.
        setErrores({});

        toast.success(
          `El activo ${datos.codigo_inventario} fue registrado correctamente. Podés continuar con el siguiente equipo.`
        );

        codigoInputRef.current?.focus();

        return;
      }

      // =============================================
      // GUARDAR Y VER DETALLE
      // =============================================

      toast.success(
        `El activo ${datos.codigo_inventario} fue registrado correctamente.`
      );

      if (nuevoId) {
        navigate(`/activos/${nuevoId}`, {
          replace: true,
        });
      } else {
        // Si el backend no devuelve un identificador,
        // regresamos al inventario.
        navigate("/activos", {
          replace: true,
        });
      }
    } catch (error) {
      console.error(
        "Error al registrar activo:",
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
          "Revisá los campos indicados y volvé a intentarlo."
        );
      } else {
        // ===========================================
        // ERRORES GENERALES DE REGISTRO
        // ===========================================

        toast.error(
          error.response?.data?.message ||
            "No se pudo registrar el activo. Intentá nuevamente."
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

  if (cargandoCatalogos) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50">
          <LoaderCircle
            size={27}
            className="animate-spin text-blue-700"
          />
        </div>

        <h2 className="mt-5 text-base font-bold text-slate-800">
          Preparando formulario
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Cargando categorías y ubicaciones disponibles...
        </p>
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
          ENCABEZADO INSTITUCIONAL
      ============================================= */}

      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-blue-700" />

        <div className="flex flex-col justify-between gap-5 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <PlusCircle
                size={27}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                Administración del inventario
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Registrar nuevo activo
              </h1>

              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Incorporá un nuevo equipo al inventario
                completando sus datos y características técnicas.
              </p>
            </div>
          </div>

          <div className="flex w-fit items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <ClipboardList size={18} />
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Tipo de operación
              </p>

              <p className="text-sm font-bold text-slate-800">
                Alta de inventario
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* =============================================
          ERROR DE CARGA DEL FORMULARIO
      ============================================= */}

      {errorGeneral && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <AlertCircle
            size={21}
            className="mt-0.5 shrink-0 text-red-600"
          />

          <div>
            <p className="text-sm font-bold text-red-800">
              No se pudo preparar el formulario
            </p>

            <p className="mt-1 text-sm text-red-700">
              {errorGeneral}
            </p>
          </div>
        </div>
      )}

      {/* =============================================
          FORMULARIO
      ============================================= */}

      <form
        onSubmit={guardarActivo}
        className="space-y-6"
      >

        {/* =============================================
            INFORMACIÓN GENERAL
        ============================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <EncabezadoSeccion
            icono={ClipboardList}
            titulo="Información general"
            descripcion="Datos de identificación, clasificación y ubicación del equipo."
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
                ref={codigoInputRef}
                id="codigo_inventario"
                name="codigo_inventario"
                type="text"
                value={formulario.codigo_inventario}
                onChange={cambiarCampo}
                required
                maxLength={50}
                placeholder="Ej: INV-0007"
                className={clasesInput}
              />
            </CampoFormulario>

            {/* CATEGORÍA */}

            <CampoFormulario
              id="categoria_id"
              etiqueta="Categoría"
              icono={Layers}
              obligatorio
              error={errorCampo("categoria_id")}
              descripcion="La categoría determina las características técnicas disponibles."
            >
              <select
                id="categoria_id"
                name="categoria_id"
                value={formulario.categoria_id}
                onChange={cambiarCategoria}
                required
                className={clasesInput}
              >
                <option value="">
                  Seleccionar categoría
                </option>

                {categorias.map((categoria) => (
                  <option
                    key={categoria.id}
                    value={categoria.id}
                  >
                    {categoria.nombre}
                  </option>
                ))}
              </select>
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
                name="ubicacion_id"
                value={formulario.ubicacion_id}
                onChange={cambiarCampo}
                required
                className={clasesInput}
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
                name="fecha_ingreso"
                type="date"
                value={formulario.fecha_ingreso}
                onChange={cambiarCampo}
                required
                className={clasesInput}
              />
            </CampoFormulario>

            {/* MARCA */}

            <CampoFormulario
              id="marca"
              etiqueta="Marca"
              icono={Tag}
              error={errorCampo("marca")}
            >
              <input
                id="marca"
                name="marca"
                type="text"
                value={formulario.marca}
                onChange={cambiarCampo}
                maxLength={100}
                placeholder="Ej: Dell, HP, Lenovo"
                className={clasesInput}
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
                name="modelo"
                type="text"
                value={formulario.modelo}
                onChange={cambiarCampo}
                maxLength={100}
                placeholder="Ej: OptiPlex 7090"
                className={clasesInput}
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
                name="numero_serie"
                type="text"
                value={formulario.numero_serie}
                onChange={cambiarCampo}
                maxLength={100}
                placeholder="Número de serie del fabricante"
                className={clasesInput}
              />
            </CampoFormulario>

            {/* OBSERVACIONES */}

            <div className="md:col-span-2">
              <CampoFormulario
                id="observaciones"
                etiqueta="Observaciones"
                icono={FileText}
                error={errorCampo("observaciones")}
                descripcion="Registrá cualquier información adicional relevante sobre el activo."
              >
                <textarea
                  id="observaciones"
                  name="observaciones"
                  value={formulario.observaciones}
                  onChange={cambiarCampo}
                  rows={4}
                  placeholder="Agregá observaciones sobre el equipo..."
                  className={`${clasesInput} resize-y`}
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
            descripcion="Especificaciones correspondientes a la categoría seleccionada."
          />

          {!formulario.categoria_id ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                <Cpu size={23} strokeWidth={1.7} />
              </div>

              <h3 className="mt-4 text-sm font-bold text-slate-800">
                Seleccioná una categoría
              </h3>

              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                Al seleccionar una categoría se mostrarán
                las características técnicas disponibles
                para ese tipo de equipo.
              </p>
            </div>
          ) : cargandoCaracteristicas ? (
            <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-8 text-sm text-slate-500">
              <LoaderCircle
                size={20}
                className="animate-spin text-blue-700"
              />

              Cargando características técnicas...
            </div>
          ) : caracteristicas.length === 0 ? (
            <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-5">
              <Info
                size={19}
                className="mt-0.5 shrink-0 text-slate-400"
              />

              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Sin características configuradas
                </p>

                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  Esta categoría no tiene características técnicas
                  disponibles para completar.
                </p>
              </div>
            </div>
          ) : (
            <CaracteristicasForm
              caracteristicas={caracteristicas}
              valores={valoresCaracteristicas}
              onChange={cambiarCaracteristica}
              errores={errores}
            />
          )}

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
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">

            {/* INFORMACIÓN */}

            <div className="flex items-start gap-2">
              <Info
                size={17}
                className="mt-0.5 shrink-0 text-slate-400"
              />

              <p className="max-w-lg text-xs leading-relaxed text-slate-500">
                Los campos marcados con * son obligatorios.
                Podés guardar el equipo y consultar su detalle
                o continuar registrando activos similares.
              </p>
            </div>

            {/* BOTONES */}

            <div className="flex flex-wrap items-center justify-end gap-3">

              {/* CANCELAR */}

              <Link
                to="/activos"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </Link>

              {/* GUARDAR Y VER DETALLE */}

              <button
                type="submit"
                onClick={() =>
                  setModoGuardado("detalle")
                }
                disabled={
                  guardando ||
                  cargandoCatalogos ||
                  cargandoCaracteristicas ||
                  Boolean(errorGeneral)
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardando &&
                modoGuardado === "detalle" ? (
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={18} />
                )}

                Guardar y ver detalle
              </button>

              {/* GUARDAR Y REGISTRAR OTRO */}

              <button
                type="submit"
                onClick={() =>
                  setModoGuardado("otro")
                }
                disabled={
                  guardando ||
                  cargandoCatalogos ||
                  cargandoCaracteristicas ||
                  Boolean(errorGeneral)
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardando &&
                modoGuardado === "otro" ? (
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <PlusCircle size={18} />
                )}

                Guardar y registrar otro
              </button>

            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
