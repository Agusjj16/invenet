<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolPermisoSeeder extends Seeder
{
    public function run(): void
    {
        $administrador = DB::table('roles')
            ->where('nombre', 'Administrador')
            ->value('id');

        $docente = DB::table('roles')
            ->where('nombre', 'Docente')
            ->value('id');

        $tecnico = DB::table('roles')
            ->where('nombre', 'Técnico')
            ->value('id');


        // ADMINISTRADOR
        $todosLosPermisos = DB::table('permisos')->pluck('id');

        foreach ($todosLosPermisos as $permisoId) {
            DB::table('rol_permiso')->insert([
                'rol_id' => $administrador,
                'permiso_id' => $permisoId,
            ]);
        }


        // DOCENTE
        $permisosDocente = [
            'activos.ver',
            'reportes.crear',
            'reportes.propios',
            'notificaciones.ver',
        ];

        $this->asignarPermisos($docente, $permisosDocente);


        // TÉCNICO
        $permisosTecnico = [
            'activos.ver',
            'reportes.crear',
            'reportes.propios',
            'ordenes.ver_asignadas',
            'ordenes.reparar',
            'ordenes.finalizar',
            'notificaciones.ver',
        ];

        $this->asignarPermisos($tecnico, $permisosTecnico);
    }


    private function asignarPermisos(
        int $rolId,
        array $permisos
    ): void {
        $ids = DB::table('permisos')
            ->whereIn('nombre', $permisos)
            ->pluck('id');

        foreach ($ids as $permisoId) {
            DB::table('rol_permiso')->insert([
                'rol_id' => $rolId,
                'permiso_id' => $permisoId,
            ]);
        }
    }
}