
import { Link, Navigate } from "react-router-dom";
import {
  ArrowRight,
  ClipboardList,
  FilePlus2,
  GraduationCap,
  Wrench,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

export default function Inicio() {
  const { user } = useAuth();
  const rol = user?.rol?.nombre;

  if (rol === "Administrador") {
    return <Navigate to="/dashboard" replace />;
  }

  const esDocente = rol === "Docente";
  const esTecnico = rol === "Técnico";

  const accesos = esDocente
    ? [
        {
          titulo: "Crear reporte",
          descripcion: "Informá una anomalía detectada en un equipo.",
          ruta: "/reportes/nuevo",
          icono: FilePlus2,
        },
        {
          titulo: "Mis reportes",
          descripcion: "Consultá el estado de tus reportes.",
          ruta: "/reportes",
          icono: ClipboardList,
        },
      ]
    : esTecnico
      ? [
          {
            titulo: "Órdenes de reparación",
            descripcion: "Consultá y gestioná las reparaciones asignadas.",
            ruta: "/ordenes-reparacion",
            icono: Wrench,
          },
        ]
      : [];

  const IconoRol = esDocente ? GraduationCap : Wrench;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-10">
      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-blue-700" />

        <div className="flex items-start gap-4 p-6 lg:p-8">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <IconoRol size={27} strokeWidth={1.7} />
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-700">
              INVENET · ESCOM Nº44
            </p>

            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Bienvenido, {user?.nombre || "Usuario"}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Perfil: {rol || "Usuario"}. Accedé a las
              funciones disponibles para tu rol.
            </p>
          </div>
        </div>
      </header>

      <section>
        <h2 className="mb-4 text-lg font-bold text-slate-900">
          Accesos rápidos
        </h2>

        {accesos.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            No hay accesos rápidos configurados para tu rol.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {accesos.map((acceso) => {
              const Icono = acceso.icono;

              return (
                <Link
                  key={acceso.ruta}
                  to={acceso.ruta}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Icono size={23} />
                    </div>

                    <ArrowRight
                      size={19}
                      className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-700"
                    />
                  </div>

                  <h3 className="mt-5 text-base font-bold text-slate-900">
                    {acceso.titulo}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-slate-500">
                    {acceso.descripcion}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
