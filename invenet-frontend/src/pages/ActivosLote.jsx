
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  ChevronDown,
  Copy,
  Layers,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  Monitor,
  ClipboardList,
  MapPin,
  CalendarDays,
  Hash,
  Tag,
  Cpu,
  FileText,
  Info,
  AlertCircle,
  PackagePlus,
  ListPlus,
} from "lucide-react";

import { crearActivosLote } from "../services/activoService";

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

const hoy = () => {
  const fecha = new Date();

  const local = new Date(
    fecha.getTime() - fecha.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 10);
};

let siguienteId = 1;

const nuevaFila = () => ({
  idLocal: siguienteId++,
  codigo_inventario: "",
  numero_serie: "",
  ubicacion_id: "",
  marca: "",
  modelo: "",
  observaciones: "",
  caracteristicas: {},
});

const clasesInput =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

// =====================================================
// COMPONENTE: ENCABEZADO DE SECCIÓN
// =====================================================

function EncabezadoSeccion({
  icono: Icono,
  titulo,
  descripcion,
  complemento,
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
      <div className="flex items-start gap-3">
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

      {complemento}
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
// PÁGINA: REGISTRO MÚLTIPLE DE ACTIVOS
// =====================================================

export default function ActivosLote() {
  const navigate = useNavigate();
  const { toast, confirmar } = useFeedback();

  // =====================================================
  // ESTADOS
  // =====================================================

  const [categorias, setCategorias] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [caracteristicas, setCaracteristicas] = useState([]);

  const [categoriaId, setCategoriaId] = useState("");
  const [fechaIngreso, setFechaIngreso] = useState(hoy());

  const [filas, setFilas] = useState(() => [nuevaFila()]);

  const [filasExpandidas, setFilasExpandidas] = useState(
    () => [filas[0].idLocal]
  );

  const [cargandoCatalogos, setCargandoCatalogos] =
    useState(true);

  const [
    cargandoCaracteristicas,
    setCargandoCaracteristicas,
  ] = useState(false);

  const [guardando, setGuardando] = useState(false);

  const [errores, setErrores] = useState({});

  // Error persistente solamente cuando no se pueden
  // cargar datos necesarios para utilizar el formulario.
  const [errorCarga, setErrorCarga] = useState("");

  const solicitudCategoria = useRef(0);
  const guardandoRef = useRef(false);

  // =====================================================
  // UTILIDADES DE ERRORES
  // =====================================================

  const limpiarError = (clave) => {
    setErrores((anteriores) => {
      const nuevos = { ...anteriores };
      delete nuevos[clave];
      return nuevos;
    });
  };

  const limpiarErroresFila = (indice, campo) => {
    setErrores((anteriores) => {
      const nuevos = { ...anteriores };

      delete nuevos[`activos.${indice}.${campo}`];

      return nuevos;
    });
  };

  // Los errores del backend usan índices de filas.
  // Cuando cambia la estructura del lote, esos índices
  // pueden dejar de corresponder a los mismos equipos.
  const limpiarErroresEstructura = () => {
    setErrores({});
  };

  // =====================================================
  // EXPANDIR Y CONTRAER EQUIPOS
  // =====================================================

  const alternarFila = (idLocal) => {
    setFilasExpandidas((anteriores) =>
      anteriores.includes(idLocal)
        ? anteriores.filter((id) => id !== idLocal)
        : [...anteriores, idLocal]
    );
  };

  const desplegarTodos = () => {
    setFilasExpandidas(filas.map((fila) => fila.idLocal));
  };

  const contraerTodos = () => {
    setFilasExpandidas([]);
  };

  // =====================================================
  // CARGAR CATÁLOGOS
  // =====================================================

  useEffect(() => {
    let activo = true;

    const cargarCatalogos = async () => {
      setCargandoCatalogos(true);
      setErrorCarga("");

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
          respuestaCategorias.filter((item) => item.activo)
        );

        setUbicaciones(
          respuestaUbicaciones.filter((item) => item.activo)
        );
      } catch (error) {
        if (!activo) return;

        console.error(
          "Error al cargar catálogos:",
          error
        );

        setErrorCarga(
          "No se pudieron cargar las categorías y ubicaciones."
        );
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
  // CAMBIAR CATEGORÍA
  // =====================================================

  const cambiarCategoria = async (valor) => {
    const solicitud = ++solicitudCategoria.current;

    setCategoriaId(valor);
    setCaracteristicas([]);
    setErrorCarga("");

    // Al cambiar la categoría se reinician las
    // características técnicas de todos los equipos.
    setFilas((anteriores) =>
      anteriores.map((fila) => ({
        ...fila,
        caracteristicas: {},
      }))
    );

    setFilasExpandidas((anteriores) => {
      const primeraFila = filas[0]?.idLocal;

      if (
        !primeraFila ||
        anteriores.includes(primeraFila)
      ) {
        return anteriores;
      }

      return [...anteriores, primeraFila];
    });

    setErrores({});

    if (!valor) {
      setCargandoCaracteristicas(false);
      return;
    }

    setCargandoCaracteristicas(true);

    try {
      const respuesta =
        await obtenerCaracteristicasPorCategoria(valor);

      if (solicitud !== solicitudCategoria.current) {
        return;
      }

      setCaracteristicas(
        respuesta.caracteristicas ?? []
      );
    } catch (error) {
      if (solicitud !== solicitudCategoria.current) {
        return;
      }

      console.error(
        "Error al cargar características:",
        error
      );

      setErrorCarga(
        "No se pudieron cargar las características de la categoría seleccionada."
      );

      toast.error(
        "No se pudieron cargar las características técnicas."
      );
    } finally {
      if (solicitud === solicitudCategoria.current) {
        setCargandoCaracteristicas(false);
      }
    }
  };

  // =====================================================
  // MODIFICAR DATOS DE UN EQUIPO
  // =====================================================

  const actualizarFila = (idLocal, campo, valor) => {
    if (guardandoRef.current) return;

    const indice = filas.findIndex(
      (fila) => fila.idLocal === idLocal
    );

    setFilas((anteriores) =>
      anteriores.map((fila) =>
        fila.idLocal === idLocal
          ? { ...fila, [campo]: valor }
          : fila
      )
    );

    if (indice !== -1) {
      limpiarErroresFila(indice, campo);
    }
  };

  // =====================================================
  // MODIFICAR CARACTERÍSTICAS DE UN EQUIPO
  // =====================================================

  const actualizarCaracteristica = (
    idLocal,
    idCaracteristica,
    valor
  ) => {
    if (guardandoRef.current) return;

    setFilas((anteriores) =>
      anteriores.map((fila) =>
        fila.idLocal === idLocal
          ? {
              ...fila,
              caracteristicas: {
                ...fila.caracteristicas,
                [idCaracteristica]: valor,
              },
            }
          : fila
      )
    );

    const indiceFila = filas.findIndex(
      (fila) => fila.idLocal === idLocal
    );

    if (indiceFila === -1) return;

    setErrores((anteriores) => {
      const nuevos = { ...anteriores };

      const prefijo =
        `activos.${indiceFila}.caracteristicas`;

      // Se limpian los errores técnicos de esta fila.
      // Los errores de otros equipos se conservan.
      Object.keys(nuevos).forEach((clave) => {
        if (
          clave === prefijo ||
          clave.startsWith(`${prefijo}.`)
        ) {
          delete nuevos[clave];
        }
      });

      return nuevos;
    });
  };

  // =====================================================
  // AGREGAR EQUIPO
  // =====================================================

  const agregarFila = () => {
    if (filas.length >= 100 || guardandoRef.current) {
      return;
    }

    const fila = nuevaFila();

    setFilas((anteriores) => [
      ...anteriores,
      fila,
    ]);

    setFilasExpandidas((anteriores) => [
      ...anteriores,
      fila.idLocal,
    ]);

    limpiarErroresEstructura();
  };

  // =====================================================
  // DUPLICAR EQUIPO
  // =====================================================

  const duplicarFila = (idLocal) => {
    if (filas.length >= 100 || guardandoRef.current) {
      return;
    }

    const original = filas.find(
      (fila) => fila.idLocal === idLocal
    );

    if (!original) return;

    const copia = {
      ...original,
      idLocal: siguienteId++,
      codigo_inventario: "",
      numero_serie: "",
      ubicacion_id: "",
      caracteristicas: {
        ...original.caracteristicas,
      },
    };

    const indice = filas.findIndex(
      (fila) => fila.idLocal === idLocal
    );

    setFilas((anteriores) => {
      const nuevas = [...anteriores];
      nuevas.splice(indice + 1, 0, copia);
      return nuevas;
    });

    setFilasExpandidas((anteriores) => [
      ...anteriores,
      copia.idLocal,
    ]);

    limpiarErroresEstructura();

    toast.info(
      "Equipo duplicado. Completá su código de inventario y número de serie."
    );
  };

  // =====================================================
  // ELIMINAR EQUIPO DEL LOTE
  // =====================================================

  const eliminarFila = async (idLocal) => {
    if (filas.length === 1 || guardandoRef.current) {
      return;
    }

    const indice = filas.findIndex(
      (fila) => fila.idLocal === idLocal
    );

    if (indice === -1) return;

    const fila = filas[indice];

    const confirmado = await confirmar({
      titulo: "¿Quitar equipo del lote?",
      mensaje: fila.codigo_inventario.trim()
        ? `¿Querés quitar el equipo "${fila.codigo_inventario.trim()}" del registro múltiple? Los datos cargados para este equipo se perderán.`
        : `¿Querés quitar el equipo ${indice + 1} del registro múltiple? Los datos cargados para este equipo se perderán.`,
      textoConfirmar: "Quitar equipo",
      textoCancelar: "Cancelar",
      variante: "danger",
    });

    if (!confirmado || guardandoRef.current) return;

    setFilas((anteriores) => {
      // Se vuelve a comprobar que el lote conserve
      // al menos un equipo.
      if (anteriores.length <= 1) {
        return anteriores;
      }

      return anteriores.filter(
        (item) => item.idLocal !== idLocal
      );
    });

    setFilasExpandidas((anteriores) =>
      anteriores.filter((id) => id !== idLocal)
    );

    limpiarErroresEstructura();

    toast.info("El equipo fue quitado del lote.");
  };

  // =====================================================
  // PREPARAR CARACTERÍSTICAS
  // =====================================================

  const prepararCaracteristicas = (fila) =>
    caracteristicas
      .filter((caracteristica) => {
        const valor =
          fila.caracteristicas[caracteristica.id];

        return (
          valor !== undefined &&
          valor !== null &&
          String(valor).trim() !== ""
        );
      })
      .map((caracteristica) => ({
        caracteristica_id: caracteristica.id,
        valor: String(
          fila.caracteristicas[caracteristica.id]
        ).trim(),
      }));

  // =====================================================
  // GUARDAR LOTE
  // =====================================================

  const guardarLote = async (event) => {
    event.preventDefault();

    if (guardandoRef.current) return;

    if (
      cargandoCatalogos ||
      cargandoCaracteristicas ||
      errorCarga
    ) {
      toast.warning(
        "Esperá a que se cargue toda la información necesaria."
      );
      return;
    }

    if (!categoriaId || !fechaIngreso) {
      toast.warning(
        "Completá la categoría y la fecha de ingreso."
      );
      return;
    }

    const indiceSinUbicacion = filas.findIndex(
      (fila) => !fila.ubicacion_id
    );

    if (indiceSinUbicacion !== -1) {
      setFilasExpandidas((anteriores) => [
        ...new Set([
          ...anteriores,
          filas[indiceSinUbicacion].idLocal,
        ]),
      ]);

      toast.warning(
        `Seleccioná una ubicación para el equipo ${indiceSinUbicacion + 1}.`
      );

      return;
    }

    guardandoRef.current = true;
    setGuardando(true);
    setErrores({});

    const activos = filas.map((fila) => ({
      codigo_inventario:
        fila.codigo_inventario.trim(),

      categoria_id:
        Number(categoriaId),

      ubicacion_id:
        Number(fila.ubicacion_id),

      fecha_ingreso:
        fechaIngreso,

      marca:
        fila.marca.trim() || null,

      modelo:
        fila.modelo.trim() || null,

      numero_serie:
        fila.numero_serie.trim() || null,

      observaciones:
        fila.observaciones.trim() || null,

      caracteristicas:
        prepararCaracteristicas(fila),
    }));

    try {
      const respuesta = await crearActivosLote(activos);

      const total = Number(
        respuesta?.total_registrados ?? activos.length
      );

      toast.success(
        `${total} ${
          total === 1
            ? "activo registrado"
            : "activos registrados"
        } correctamente.`
      );

      navigate("/activos", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Error al registrar lote:",
        error
      );

      if (error.response?.status === 422) {
        const erroresBackend =
          error.response.data?.errors ?? {};

        setErrores(erroresBackend);

        toast.warning(
          "Hay errores en el lote. Revisá los equipos señalados."
        );

        // Desplegar todos los equipos con errores.
        const indicesConErrores = new Set();

        Object.keys(erroresBackend).forEach((clave) => {
          const coincidencia =
            clave.match(/^activos\.(\d+)\./);

          if (coincidencia) {
            indicesConErrores.add(
              Number(coincidencia[1])
            );
          }
        });

        const idsConErrores = filas
          .filter((_, indice) =>
            indicesConErrores.has(indice)
          )
          .map((fila) => fila.idLocal);

        setFilasExpandidas((anteriores) => [
          ...new Set([
            ...anteriores,
            ...idsConErrores,
          ]),
        ]);
      } else {
        toast.error(
          error.response?.data?.message ||
            "No se pudo registrar el lote. Intentá nuevamente."
        );
      }
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  };

  // =====================================================
  // ERRORES POR EQUIPO
  // =====================================================

  const errorCampo = (indice, campo) =>
    errores[`activos.${indice}.${campo}`]?.[0];

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
          Preparando registro múltiple
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
              <PackagePlus
                size={27}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                Administración del inventario
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Registro múltiple de activos
              </h1>

              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Incorporá varios equipos en una sola
                operación, compartiendo sus datos
                generales y configurando sus
                características individuales.
              </p>
            </div>
          </div>

          <div className="flex w-fit items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Layers size={18} />
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Capacidad del lote
              </p>

              <p className="text-sm font-bold text-slate-800">
                Hasta 100 activos
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* =============================================
          ERROR DE CARGA
      ============================================= */}

      {errorCarga && (
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
              No se pudo cargar la información
            </p>

            <p className="mt-1 text-sm text-red-700">
              {errorCarga}
            </p>
          </div>
        </div>
      )}

      {/* =============================================
          FORMULARIO
      ============================================= */}

      <form
        onSubmit={guardarLote}
        className="space-y-6"
      >

        {/* =============================================
            DATOS COMPARTIDOS
        ============================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <EncabezadoSeccion
            icono={ClipboardList}
            titulo="Datos compartidos"
            descripcion="Esta información se aplicará a todos los equipos incluidos en el lote."
          />

          <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">

            {/* CATEGORÍA */}

            <CampoFormulario
              id="categoria-lote"
              etiqueta="Categoría"
              icono={Layers}
              obligatorio
              error={errores.categoria_id?.[0]}
              descripcion="Define las características técnicas de todos los equipos."
            >
              <select
                id="categoria-lote"
                required
                value={categoriaId}
                onChange={(event) =>
                  cambiarCategoria(event.target.value)
                }
                disabled={guardando}
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

            {/* FECHA DE INGRESO */}

            <CampoFormulario
              id="fecha-lote"
              etiqueta="Fecha de ingreso"
              icono={CalendarDays}
              obligatorio
              error={errores.fecha_ingreso?.[0]}
            >
              <input
                id="fecha-lote"
                type="date"
                required
                value={fechaIngreso}
                disabled={guardando}
                onChange={(event) => {
                  setFechaIngreso(event.target.value);
                  limpiarError("fecha_ingreso");
                }}
                className={clasesInput}
              />
            </CampoFormulario>
          </div>

          <div className="mt-6 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
            <Info
              size={17}
              className="mt-0.5 shrink-0 text-blue-600"
            />

            <p className="text-xs leading-relaxed text-blue-800">
              Todos los equipos tendrán la misma categoría y fecha
              de ingreso. La ubicación, el código de inventario y
              los demás datos se completan individualmente.
            </p>
          </div>
        </section>

        {/* =============================================
            EQUIPOS DEL LOTE
        ============================================= */}

        <section className="space-y-4">

          {/* ENCABEZADO DE EQUIPOS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <EncabezadoSeccion
              icono={ListPlus}
              titulo="Equipos del lote"
              descripcion="Completá los datos de cada equipo. Podés agregar, duplicar o eliminar registros."
              complemento={
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">
                    Equipos cargados
                  </p>

                  <p className="mt-0.5 text-lg font-bold text-blue-800">
                    {filas.length}
                    <span className="text-sm font-medium text-blue-500">
                      /100
                    </span>
                  </p>
                </div>
              }
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={desplegarTodos}
                  disabled={guardando}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                >
                  <ChevronDown size={16} />
                  Desplegar todos
                </button>

                <button
                  type="button"
                  onClick={contraerTodos}
                  disabled={guardando}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                >
                  <ChevronDown
                    size={16}
                    className="rotate-180"
                  />
                  Contraer todos
                </button>
              </div>

              <button
                type="button"
                onClick={agregarFila}
                disabled={
                  filas.length >= 100 || guardando
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={18} />
                Agregar equipo
              </button>
            </div>
          </div>

          {/* =============================================
              LISTADO DE EQUIPOS
          ============================================= */}

          {filas.map((fila, indice) => {
            const expandida =
              filasExpandidas.includes(fila.idLocal);

            const tieneErrores =
              Object.keys(errores).some((clave) =>
                clave.startsWith(`activos.${indice}.`)
              );

            const erroresCaracteristicas = {};

            // Mantiene el formato de errores esperado
            // por el componente CaracteristicasForm.
            caracteristicas.forEach(
              (caracteristica, indiceCaracteristica) => {
                const error =
                  errores[
                    `activos.${indice}.caracteristicas.${indiceCaracteristica}.valor`
                  ];

                if (error) {
                  erroresCaracteristicas[
                    `caracteristicas.${indiceCaracteristica}.valor`
                  ] = error;
                }
              }
            );

            return (
              <div
                key={fila.idLocal}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-colors ${
                  tieneErrores
                    ? "border-red-300"
                    : "border-slate-200"
                }`}
              >

                {/* =====================================
                    ENCABEZADO DEL EQUIPO
                ===================================== */}

                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-4">

                  {/* IDENTIFICACIÓN */}

                  <button
                    type="button"
                    onClick={() =>
                      alternarFila(fila.idLocal)
                    }
                    aria-expanded={expandida}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                      <Monitor
                        size={19}
                        strokeWidth={1.8}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          Equipo {indice + 1}
                        </span>

                        {tieneErrores && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                            <AlertCircle size={12} />
                            Revisar errores
                          </span>
                        )}
                      </div>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {fila.codigo_inventario.trim() ||
                          "Código pendiente de completar"}
                      </p>
                    </div>

                    <ChevronDown
                      size={18}
                      className={`ml-1 shrink-0 text-slate-400 transition-transform ${
                        expandida ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* ACCIONES DEL EQUIPO */}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        duplicarFila(fila.idLocal)
                      }
                      disabled={
                        filas.length >= 100 || guardando
                      }
                      title="Duplicar equipo"
                      aria-label={`Duplicar equipo ${indice + 1}`}
                      className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-white p-2.5 text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Copy size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        eliminarFila(fila.idLocal)
                      }
                      disabled={
                        filas.length === 1 || guardando
                      }
                      title="Eliminar equipo del lote"
                      aria-label={`Eliminar equipo ${indice + 1}`}
                      className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white p-2.5 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>

                {/* =====================================
                    DATOS INDIVIDUALES
                ===================================== */}

                <div className="grid grid-cols-1 gap-x-5 gap-y-5 p-5 md:grid-cols-2 xl:grid-cols-4">

                  {/* CÓDIGO DE INVENTARIO */}

                  <CampoFormulario
                    id={`codigo-${fila.idLocal}`}
                    etiqueta="Código de inventario"
                    icono={Hash}
                    obligatorio
                    error={errorCampo(
                      indice,
                      "codigo_inventario"
                    )}
                  >
                    <input
                      id={`codigo-${fila.idLocal}`}
                      type="text"
                      required
                      maxLength={50}
                      disabled={guardando}
                      value={fila.codigo_inventario}
                      onChange={(event) =>
                        actualizarFila(
                          fila.idLocal,
                          "codigo_inventario",
                          event.target.value
                        )
                      }
                      placeholder="Ej: INV-0201"
                      className={clasesInput}
                    />
                  </CampoFormulario>

                  {/* UBICACIÓN INDIVIDUAL */}

                  <CampoFormulario
                    id={`ubicacion-${fila.idLocal}`}
                    etiqueta="Ubicación"
                    icono={MapPin}
                    obligatorio
                    error={errorCampo(indice, "ubicacion_id")}
                  >
                    <select
                      id={`ubicacion-${fila.idLocal}`}
                      required
                      disabled={guardando}
                      value={fila.ubicacion_id}
                      onChange={(event) =>
                        actualizarFila(
                          fila.idLocal,
                          "ubicacion_id",
                          event.target.value
                        )
                      }
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

                  {/* NÚMERO DE SERIE */}

                  <CampoFormulario
                    id={`serie-${fila.idLocal}`}
                    etiqueta="Número de serie"
                    icono={Hash}
                    error={errorCampo(
                      indice,
                      "numero_serie"
                    )}
                  >
                    <input
                      id={`serie-${fila.idLocal}`}
                      type="text"
                      maxLength={100}
                      disabled={guardando}
                      value={fila.numero_serie}
                      onChange={(event) =>
                        actualizarFila(
                          fila.idLocal,
                          "numero_serie",
                          event.target.value
                        )
                      }
                      placeholder="Número de serie"
                      className={clasesInput}
                    />
                  </CampoFormulario>

                  {/* MARCA */}

                  <CampoFormulario
                    id={`marca-${fila.idLocal}`}
                    etiqueta="Marca"
                    icono={Tag}
                    error={errorCampo(indice, "marca")}
                  >
                    <input
                      id={`marca-${fila.idLocal}`}
                      type="text"
                      maxLength={100}
                      disabled={guardando}
                      value={fila.marca}
                      onChange={(event) =>
                        actualizarFila(
                          fila.idLocal,
                          "marca",
                          event.target.value
                        )
                      }
                      placeholder="Ej: Lenovo"
                      className={clasesInput}
                    />
                  </CampoFormulario>

                  {/* MODELO */}

                  <CampoFormulario
                    id={`modelo-${fila.idLocal}`}
                    etiqueta="Modelo"
                    icono={Monitor}
                    error={errorCampo(indice, "modelo")}
                  >
                    <input
                      id={`modelo-${fila.idLocal}`}
                      type="text"
                      maxLength={100}
                      disabled={guardando}
                      value={fila.modelo}
                      onChange={(event) =>
                        actualizarFila(
                          fila.idLocal,
                          "modelo",
                          event.target.value
                        )
                      }
                      placeholder="Ej: ThinkCentre"
                      className={clasesInput}
                    />
                  </CampoFormulario>
                </div>

                {/* =====================================
                    INFORMACIÓN ADICIONAL
                ===================================== */}

                {expandida && (
                  <div className="space-y-6 border-t border-slate-100 p-5">

                    {/* OBSERVACIONES */}

                    <CampoFormulario
                      id={`observaciones-${fila.idLocal}`}
                      etiqueta="Observaciones"
                      icono={FileText}
                      error={errorCampo(
                        indice,
                        "observaciones"
                      )}
                      descripcion="Información adicional correspondiente a este equipo."
                    >
                      <textarea
                        id={`observaciones-${fila.idLocal}`}
                        rows={3}
                        disabled={guardando}
                        value={fila.observaciones}
                        onChange={(event) =>
                          actualizarFila(
                            fila.idLocal,
                            "observaciones",
                            event.target.value
                          )
                        }
                        placeholder="Agregá observaciones sobre este equipo..."
                        className={`${clasesInput} resize-y`}
                      />
                    </CampoFormulario>

                    {/* CARACTERÍSTICAS TÉCNICAS */}

                    <div>
                      <div className="mb-5 flex items-start gap-3 border-b border-slate-100 pb-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                          <Cpu size={18} />
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            Características técnicas
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            Especificaciones individuales de este equipo.
                          </p>
                        </div>
                      </div>

                      {!categoriaId ? (
                        <div className="flex items-start gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5">
                          <Info
                            size={18}
                            className="mt-0.5 shrink-0 text-slate-400"
                          />

                          <p className="text-sm text-slate-500">
                            Seleccioná una categoría en
                            Datos compartidos para completar
                            las características técnicas.
                          </p>
                        </div>
                      ) : cargandoCaracteristicas ? (
                        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                          <LoaderCircle
                            size={19}
                            className="animate-spin text-blue-700"
                          />

                          Cargando características...
                        </div>
                      ) : errorCarga ? (
                        <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-5">
                          <AlertCircle
                            size={18}
                            className="mt-0.5 shrink-0 text-red-600"
                          />

                          <p className="text-sm text-red-700">
                            No se pudieron cargar las
                            características técnicas.
                            Volvé a seleccionar la categoría
                            para intentar nuevamente.
                          </p>
                        </div>
                      ) : caracteristicas.length === 0 ? (
                        <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-5">
                          <Info
                            size={18}
                            className="mt-0.5 shrink-0 text-slate-400"
                          />

                          <p className="text-sm text-slate-500">
                            Esta categoría no tiene
                            características técnicas
                            configuradas.
                          </p>
                        </div>
                      ) : (
                        <CaracteristicasForm
                          caracteristicas={caracteristicas}
                          valores={fila.caracteristicas}
                          onChange={(id, valor) =>
                            actualizarCaracteristica(
                              fila.idLocal,
                              id,
                              valor
                            )
                          }
                          errores={erroresCaracteristicas}
                        />
                      )}

                      {errores[
                        `activos.${indice}.caracteristicas`
                      ] && (
                        <p
                          role="alert"
                          className="mt-3 flex items-center gap-2 text-sm font-medium text-red-600"
                        >
                          <AlertCircle size={16} />

                          {
                            errores[
                              `activos.${indice}.caracteristicas`
                            ][0]
                          }
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* =============================================
            ACCIONES FINALES
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
                Revisá los códigos de inventario y los
                datos individuales antes de confirmar.
                Todos los equipos del lote se enviarán
                en una sola operación.
              </p>
            </div>

            {/* BOTONES */}

            <div className="flex flex-wrap items-center justify-end gap-3">
              <Link
                to="/activos"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={
                  guardando ||
                  cargandoCatalogos ||
                  cargandoCaracteristicas ||
                  Boolean(errorCarga)
                }
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
                  ? "Registrando activos..."
                  : `Registrar ${filas.length} ${
                      filas.length === 1
                        ? "activo"
                        : "activos"
                    }`}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
