<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Rol;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class RolPermisoSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {

            $administrador = DB::table('roles')
                ->where('nombre', 'Administrador')
                ->value('id');

            $docente = DB::table('roles')
                ->where('nombre', 'Docente')
                ->value('id');

            $tecnico = DB::table('roles')
                ->where('nombre', 'Técnico')
                ->value('id');

            if (!$administrador || !$docente || !$tecnico) {
                throw new RuntimeException(
                    'Faltan roles para asignar permisos.'
                );
            }

            // ADMINISTRADOR: todos los permisos.
            $todos = DB::table('permisos')
                ->pluck('id')
                ->all();

            // DOCENTE: reportar y consultar sus reportes.
            $permisosDocente = [
                'reportes.crear',
                'reportes.propios',
                'notificaciones.ver',
            ];

            // TÉCNICO: gestionar sus reparaciones.
            $permisosTecnico = [
                'ordenes.ver_asignadas',
                'ordenes.reparar',
                'ordenes.finalizar',
                'notificaciones.ver',
            ];

            $this->sincronizar($administrador, $todos);

            $this->sincronizar(
                $docente,
                $this->obtenerIds($permisosDocente)
            );

            $this->sincronizar(
                $tecnico,
                $this->obtenerIds($permisosTecnico)
            );
        });
    }

    private function obtenerIds(array $nombres): array
    {
        $permisos = DB::table('permisos')
            ->whereIn('nombre', $nombres)
            ->pluck('id', 'nombre');

        $faltantes = array_diff(
            $nombres,
            $permisos->keys()->all()
        );

        if (!empty($faltantes)) {
            throw new RuntimeException(
                'Permisos inexistentes: ' .
                implode(', ', $faltantes)
            );
        }

        return $permisos->values()->all();
    }

    private function sincronizar(
        int $rolId,
        array $permisosIds
    ): void {
        DB::table('rol_permiso')
            ->where('rol_id', $rolId)
            ->delete();

        foreach ($permisosIds as $permisoId) {
            DB::table('rol_permiso')->insert([
                'rol_id' => $rolId,
                'permiso_id' => $permisoId,
            ]);
        }
    }
}
