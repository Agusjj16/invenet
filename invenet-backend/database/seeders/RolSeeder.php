<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('roles')->insert([
            [
                'nombre' => 'Administrador',
                'descripcion' => 'Administrador general del sistema',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nombre' => 'Docente',
                'descripcion' => 'Usuario habilitado para consultar activos y reportar anomalías',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nombre' => 'Técnico',
                'descripcion' => 'Usuario encargado de gestionar reparaciones asignadas',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}